'use strict';

const express   = require('express');
const path      = require('path');
const fs        = require('fs');
const crypto    = require('crypto');
const router    = express.Router();

const { authMiddleware }       = require('../middleware/auth');
const { uploadMultipleFiles }  = require('../middleware/file-upload');
const { getDatabase }          = require('../database/db');
const { createLogger }         = require('../utils/logger');
const { recalculateFromEditor } = require('../analyzers/toc-score-calculator');
const { runFullAnalysis }       = require('../analyzers/toc-analyzer');

const logger = createLogger('toc');

// Multer — document fields + optional partner logo
const tocUpload = uploadMultipleFiles([
  { name: 'privacy', maxCount: 1 },
  { name: 'toc',     maxCount: 1 },
  { name: 'logo',    maxCount: 1 },
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadQuestions() {
  const p = path.join(__dirname, '../config/toc-questions.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseResultRow(row) {
  if (!row) return null;
  return {
    ...row,
    criteria:        JSON.parse(row.editor_criteria_json || row.criteria_json || '[]'),
    tier_scores:     JSON.parse(row.tier_scores_json     || '{}'),
    recommendations: JSON.parse(row.recommendations_json || '[]'),
  };
}

// ── POST /api/toc/start ───────────────────────────────────────────────────────
// Accepts multipart/form-data. Returns {audit_uid} immediately — fire-and-forget.

async function handleStart(req, res) {
  const { client_name, site_url, business_type, questions_answers_json, report_tagline, report_title, audit_date } = req.body;

  if (!client_name || !site_url || !business_type) {
    return res.status(400).json({
      error: 'client_name, site_url, and business_type are required',
      code:  'E400',
    });
  }

  const privacyFile = req.files?.privacy?.[0] ?? null;
  const tocFile     = req.files?.toc?.[0]     ?? null;
  const logoFile    = req.files?.logo?.[0]    ?? null;

  if (!privacyFile && !tocFile) {
    return res.status(400).json({
      error: 'At least one document (privacy or toc) must be uploaded',
      code:  'E400',
    });
  }

  let questionsAnswers = {};
  if (questions_answers_json) {
    try {
      questionsAnswers = JSON.parse(questions_answers_json);
    } catch {
      return res.status(400).json({ error: 'Invalid questions_answers_json', code: 'E400' });
    }
  }

  // Convert logo to base64 data URL if provided (max 2 MB enforced by multer)
  let partnerLogoData = null;
  if (logoFile) {
    const mime = logoFile.mimetype || 'image/png';
    partnerLogoData = `data:${mime};base64,${logoFile.buffer.toString('base64')}`;
  }

  const uid = 'toc_' + crypto.randomBytes(4).toString('hex');
  const db  = getDatabase();

  // Use provided audit_date if valid ISO string, otherwise fallback to DB default (now)
  let createdAt = null;
  if (audit_date) {
    const parsed = new Date(audit_date);
    if (!isNaN(parsed.getTime())) createdAt = parsed.toISOString();
  }

  const insertSql = createdAt
    ? `INSERT INTO toc_audits (uid, client_name, site_url, business_type, has_privacy, has_toc, partner_logo_data, report_tagline, report_title, language, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    : `INSERT INTO toc_audits (uid, client_name, site_url, business_type, has_privacy, has_toc, partner_logo_data, report_tagline, report_title, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const insertParams = [uid, client_name, site_url, business_type,
    privacyFile ? 1 : 0, tocFile ? 1 : 0,
    partnerLogoData, report_tagline?.trim() || null, report_title?.trim() || null,
    req.body.language === 'en' ? 'en' : 'bg',
    ...(createdAt ? [createdAt] : [])];

  db.prepare(insertSql).run(...insertParams);

  // HTTP 200 immediately — client starts polling
  res.json({ audit_uid: uid });

  logger.info('audit-started', { uid, has_privacy: !!privacyFile, has_toc: !!tocFile });

  const businessContext = {
    clientName:   client_name,
    siteUrl:      site_url,
    businessType: business_type,
    language:     req.body.language || 'bg',
  };

  // Fire-and-forget — do NOT await
  runFullAnalysis(privacyFile, tocFile, questionsAnswers, businessContext, uid).catch(err => {
    logger.error('fire-and-forget-error', { uid, error: err.message });
    try {
      db.prepare("UPDATE toc_audits SET status='failed', error_details=? WHERE uid=?")
        .run(err.message, uid);
    } catch { /* best-effort */ }
  });
}

// ── GET /api/toc/questions?business_type=X ────────────────────────────────────
// Public — returns questions config

function handleGetQuestions(req, res) {
  try {
    const questions = loadQuestions();
    logger.info('questions-fetched', { business_type: req.query.business_type });
    return res.json({ questions });
  } catch (err) {
    logger.error('questions-load-failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to load questions', code: 'E500' });
  }
}

// ── GET /api/toc/:uid/status ──────────────────────────────────────────────────
// Public (uid is sufficient protection) — lightweight poll

function handleStatus(req, res) {
  try {
    const db    = getDatabase();
    const audit = db.prepare(
      'SELECT status, error_details FROM toc_audits WHERE uid = ?'
    ).get(req.params.uid);

    if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });

    return res.json({ status: audit.status, error_details: audit.error_details ?? null });
  } catch (err) {
    logger.error('status-fetch-failed', { uid: req.params.uid, error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── GET /api/toc/:uid ─────────────────────────────────────────────────────────
// Protected — full audit data

function handleGetAudit(req, res) {
  try {
    const db    = getDatabase();
    const audit = db.prepare('SELECT * FROM toc_audits WHERE uid = ?').get(req.params.uid);

    if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });

    const privacyRow = db.prepare(
      "SELECT * FROM toc_results WHERE audit_uid = ? AND doc_type = 'privacy'"
    ).get(req.params.uid);

    const tocRow = db.prepare(
      "SELECT * FROM toc_results WHERE audit_uid = ? AND doc_type = 'toc'"
    ).get(req.params.uid);

    return res.json({
      audit,
      privacy_result: parseResultRow(privacyRow),
      toc_result:     parseResultRow(tocRow),
    });
  } catch (err) {
    logger.error('get-audit-failed', { uid: req.params.uid, error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── POST /api/toc/:uid/save ───────────────────────────────────────────────────
// Protected — recalculate authoritative scores from editor criteria

function handleSave(req, res) {
  const { uid }                          = req.params;
  const { doc_type, editor_criteria_json } = req.body;

  if (!doc_type || !Array.isArray(editor_criteria_json)) {
    return res.status(400).json({
      error: 'doc_type and editor_criteria_json (array) are required',
      code:  'E400',
    });
  }

  const db     = getDatabase();
  const result = db.prepare(
    'SELECT * FROM toc_results WHERE audit_uid = ? AND doc_type = ?'
  ).get(uid, doc_type);

  if (!result) return res.status(404).json({ error: 'Result not found', code: 'E404' });

  const scores = recalculateFromEditor(editor_criteria_json);

  db.prepare(`
    UPDATE toc_results SET
      editor_criteria_json = ?,
      total_score          = ?,
      total_max_score      = ?,
      total_pct            = ?,
      tier_scores_json     = ?,
      low_score_count      = ?,
      verbal_scale         = ?
    WHERE audit_uid = ? AND doc_type = ?
  `).run(
    JSON.stringify(editor_criteria_json),
    scores.total_score,
    scores.total_max_score,
    scores.total_pct,
    scores.tier_scores_json,
    scores.low_score_count,
    scores.verbal_scale,
    uid, doc_type,
  );

  logger.info('save-complete', { uid, doc_type, total_pct: scores.total_pct.toFixed(1) });

  return res.json(scores);
}

// ── Snapshot helper ───────────────────────────────────────────────────────────
// Builds the immutable public snapshot from the live record. published_json is
// stripped from the audit row so repeated publishes do not nest snapshots.

function buildSnapshot(db, uid, shareUid, publishedAt) {
  const audit = db.prepare('SELECT * FROM toc_audits WHERE uid = ?').get(uid);
  const { published_json: _omit, ...auditRow } = audit;

  const privacyRow = db.prepare(
    "SELECT * FROM toc_results WHERE audit_uid = ? AND doc_type = 'privacy'"
  ).get(uid);
  const tocRow = db.prepare(
    "SELECT * FROM toc_results WHERE audit_uid = ? AND doc_type = 'toc'"
  ).get(uid);

  return JSON.stringify({
    audit: { ...auditRow, share_uid: shareUid, published_at: publishedAt },
    privacy_result: parseResultRow(privacyRow),
    toc_result:     parseResultRow(tocRow),
  });
}

// ── POST /api/toc/:uid/publish ────────────────────────────────────────────────
// Protected. First call publishes; later calls refresh the snapshot and keep the
// same public link. Body {new_link: true} issues a new link (the old one stops working).

function handlePublish(req, res) {
  const { uid } = req.params;
  const db      = getDatabase();

  const audit = db.prepare('SELECT uid, share_uid FROM toc_audits WHERE uid = ?').get(uid);
  if (!audit) {
    logger.warn('publish-not-found', { uid });
    return res.status(404).json({ error: 'Not found', code: 'E404' });
  }

  const isRepublish = !!audit.share_uid;
  const newLink     = req.body?.new_link === true;
  const shareUid    = (isRepublish && !newLink)
    ? audit.share_uid
    : crypto.randomBytes(8).toString('hex');
  const publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const publishTx = db.transaction(() => {
    db.prepare(`
      UPDATE toc_audits
      SET share_uid = ?, published_json = ?, published_at = ?
      WHERE uid = ?
    `).run(shareUid, buildSnapshot(db, uid, shareUid, publishedAt), publishedAt, uid);
  });

  try {
    publishTx();
  } catch (txErr) {
    logger.error('publish-tx-failed', { uid, error: txErr.message });
    return res.status(500).json({ error: 'Publish failed (transaction error)', code: 'E500' });
  }

  const share_url = `/toc-report/share/${shareUid}`;
  logger.info('publish-complete', { uid, shareUid, share_url, republished: isRepublish, newLink });

  return res.json({ share_uid: shareUid, share_url, republished: isRepublish });
}

// ── POST /api/toc/:uid/unpublish ──────────────────────────────────────────────
// Protected - the public link stops working; the audit stays editable.

function handleUnpublish(req, res) {
  const { uid } = req.params;
  const db      = getDatabase();

  const audit = db.prepare('SELECT uid FROM toc_audits WHERE uid = ?').get(uid);
  if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });

  db.prepare(
    'UPDATE toc_audits SET share_uid = NULL, published_json = NULL, published_at = NULL WHERE uid = ?'
  ).run(uid);

  logger.info('unpublish-complete', { uid });
  return res.json({ ok: true, uid });
}

// ── PATCH /api/toc/:uid/cover ─────────────────────────────────────────────────
// Protected. multipart/form-data; only the fields that are present are changed:
// client_name, site_url, report_title, report_tagline, language, audit_date,
// logo (file) or remove_logo=1. Changes affect the live record; the public
// link shows them after the next publish (refresh).

const LOGO_MAX_BYTES = 2 * 1024 * 1024;

function handleCover(req, res) {
  try {
    const { uid } = req.params;
    const body    = req.body || {};
    const db      = getDatabase();

    const audit = db.prepare('SELECT uid FROM toc_audits WHERE uid = ?').get(uid);
    if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });

    const sets   = [];
    const params = [];
    const has    = k => Object.prototype.hasOwnProperty.call(body, k);

    for (const col of ['client_name', 'site_url']) {
      if (!has(col)) continue;
      const v = String(body[col]).trim();
      if (!v) return res.status(400).json({ error: `${col} cannot be empty`, code: 'E400' });
      sets.push(`${col} = ?`); params.push(v);
    }

    for (const col of ['report_title', 'report_tagline']) {
      if (!has(col)) continue;
      sets.push(`${col} = ?`); params.push(String(body[col]).trim() || null);
    }

    if (has('language')) {
      if (!['bg', 'en'].includes(body.language)) {
        return res.status(400).json({ error: 'language must be bg or en', code: 'E400' });
      }
      sets.push('language = ?'); params.push(body.language);
    }

    if (has('audit_date') && String(body.audit_date).trim()) {
      const parsed = new Date(body.audit_date);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid audit_date', code: 'E400' });
      }
      sets.push('created_at = ?'); params.push(parsed.toISOString());
    }

    const logoFile = req.files?.logo?.[0] ?? null;
    if (logoFile) {
      if (!String(logoFile.mimetype).startsWith('image/')) {
        return res.status(400).json({ error: 'Logo must be an image', code: 'E400' });
      }
      if (logoFile.size > LOGO_MAX_BYTES) {
        return res.status(400).json({ error: 'Logo must be under 2 MB', code: 'E400' });
      }
      sets.push('partner_logo_data = ?');
      params.push(`data:${logoFile.mimetype};base64,${logoFile.buffer.toString('base64')}`);
    } else if (body.remove_logo === '1' || body.remove_logo === 'true') {
      sets.push('partner_logo_data = NULL');
    }

    if (!sets.length) return res.status(400).json({ error: 'No changes provided', code: 'E400' });

    db.prepare(`UPDATE toc_audits SET ${sets.join(', ')} WHERE uid = ?`).run(...params, uid);

    logger.info('cover-updated', { uid, fields: sets.length });
    return res.json({ ok: true, uid });
  } catch (err) {
    logger.error('cover-update-failed', { error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── GET /api/toc/share/:share_uid ────────────────────────────────────────────
// Public — reads immutable published_json snapshot

function handleShare(req, res) {
  try {
    const db    = getDatabase();
    const audit = db.prepare(
      'SELECT published_json FROM toc_audits WHERE share_uid = ?'
    ).get(req.params.share_uid);

    if (!audit?.published_json) {
      return res.status(404).json({ error: 'Not found', code: 'E404' });
    }

    return res.json(JSON.parse(audit.published_json));
  } catch (err) {
    logger.error('share-fetch-failed', { share_uid: req.params.share_uid, error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── GET /api/toc/dashboard ────────────────────────────────────────────────────
// Protected — paginated list with scores (single LEFT JOIN query — no N+1)

function handleDashboard(req, res) {
  try {
    const db     = getDatabase();
    const page   = Math.max(1, parseInt(req.query.page  ?? '1',  10));
    const limit  = Math.min(50, parseInt(req.query.limit ?? '20', 10));
    const offset = (page - 1) * limit;

    const audits = db.prepare(`
      SELECT
        a.uid,
        a.client_name,
        a.site_url,
        a.business_type,
        a.status,
        a.created_at,
        a.share_uid,
        p.total_pct       AS privacy_pct,
        p.low_score_count AS privacy_low_count,
        t.total_pct       AS toc_pct,
        t.low_score_count AS toc_low_count
      FROM toc_audits a
      LEFT JOIN toc_results p ON p.audit_uid = a.uid AND p.doc_type = 'privacy'
      LEFT JOIN toc_results t ON t.audit_uid = a.uid AND t.doc_type = 'toc'
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    return res.json({ audits, page, limit });
  } catch (err) {
    logger.error('dashboard-failed', { error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── PATCH /api/toc/:uid/set-date — Admin: update created_at ──────────────────
// Protected by authMiddleware (x-api-key). One-off or admin use.

function handleSetDate(req, res) {
  try {
    const { uid }  = req.params;
    const { date } = req.body;

    if (!date) return res.status(400).json({ error: 'Missing date field', code: 'E400' });

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'Invalid date format', code: 'E400' });
    }

    const db    = getDatabase();
    const audit = db.prepare('SELECT uid, published_json FROM toc_audits WHERE uid = ?').get(uid);
    if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });

    const isoDate = parsed.toISOString();

    // Update live record
    db.prepare('UPDATE toc_audits SET created_at = ? WHERE uid = ?').run(isoDate, uid);

    // Also patch created_at inside the published_json snapshot so the share page reflects the change
    if (audit.published_json) {
      try {
        const snapshot      = JSON.parse(audit.published_json);
        if (snapshot.audit) snapshot.audit.created_at = isoDate;
        db.prepare('UPDATE toc_audits SET published_json = ? WHERE uid = ?')
          .run(JSON.stringify(snapshot), uid);
      } catch {
        logger.warn('admin-set-date-snapshot-parse-failed', { uid });
      }
    }

    logger.info('admin-set-date', { uid, date: isoDate });
    return res.json({ ok: true, uid, created_at: isoDate });
  } catch (err) {
    logger.error('admin-set-date-failed', { error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── PATCH /api/toc/:uid/set-tagline - Admin: change the cover subtitle ───────
// :uid may be the audit uid or its share_uid. Updates the live record and,
// if already published, the immutable snapshot so the public link reflects it.

function handleSetTagline(req, res) {
  try {
    const { report_tagline } = req.body;

    if (typeof report_tagline !== 'string') {
      return res.status(400).json({ error: 'report_tagline (string) is required', code: 'E400' });
    }

    const db    = getDatabase();
    const audit = db.prepare(
      'SELECT uid, published_json FROM toc_audits WHERE uid = ? OR share_uid = ?'
    ).get(req.params.uid, req.params.uid);
    if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });

    const tagline = report_tagline.trim() || null;

    db.prepare('UPDATE toc_audits SET report_tagline = ? WHERE uid = ?').run(tagline, audit.uid);

    if (audit.published_json) {
      try {
        const snapshot = JSON.parse(audit.published_json);
        if (snapshot.audit) snapshot.audit.report_tagline = tagline;
        db.prepare('UPDATE toc_audits SET published_json = ? WHERE uid = ?')
          .run(JSON.stringify(snapshot), audit.uid);
      } catch {
        logger.warn('admin-set-tagline-snapshot-parse-failed', { uid: audit.uid });
      }
    }

    logger.info('admin-set-tagline', { uid: audit.uid });
    return res.json({ ok: true, uid: audit.uid, report_tagline: tagline });
  } catch (err) {
    logger.error('admin-set-tagline-failed', { error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── DELETE /api/toc/:uid ──────────────────────────────────────────────────────
// Protected — removes audit and all associated results

function handleDelete(req, res) {
  const { uid } = req.params;
  const db       = getDatabase();

  const audit = db.prepare('SELECT uid FROM toc_audits WHERE uid = ?').get(uid);
  if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });

  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM toc_results WHERE audit_uid = ?').run(uid);
    db.prepare('DELETE FROM toc_audits WHERE uid = ?').run(uid);
  });

  try {
    deleteTx();
  } catch (txErr) {
    logger.error('delete-tx-failed', { uid, error: txErr.message });
    return res.status(500).json({ error: 'Delete failed', code: 'E500' });
  }

  logger.info('audit-deleted', { uid });
  return res.json({ ok: true, uid });
}

// ── Route registration ────────────────────────────────────────────────────────
// Static segments BEFORE :uid params

router.get('/questions',        handleGetQuestions);              // public
router.get('/share/:share_uid', handleShare);                     // public
router.get('/dashboard',        authMiddleware, handleDashboard);

router.post('/start',           authMiddleware, tocUpload, handleStart);
router.get('/:uid/status',      handleStatus);                    // public (uid guards access)
router.get('/:uid',             authMiddleware, handleGetAudit);
router.post('/:uid/save',       authMiddleware, handleSave);
router.post('/:uid/publish',    authMiddleware, handlePublish);
router.post('/:uid/unpublish',  authMiddleware, handleUnpublish);
router.patch('/:uid/cover',     authMiddleware, tocUpload, handleCover);
router.patch('/:uid/set-date',  authMiddleware, handleSetDate);
router.patch('/:uid/set-tagline', authMiddleware, handleSetTagline);
router.delete('/:uid',          authMiddleware, handleDelete);

module.exports = router;
