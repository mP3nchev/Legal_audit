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

// Multer — two optional fields
const tocUpload = uploadMultipleFiles([
  { name: 'privacy', maxCount: 1 },
  { name: 'toc',     maxCount: 1 },
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
  const { client_name, site_url, business_type, questions_answers_json } = req.body;

  if (!client_name || !site_url || !business_type) {
    return res.status(400).json({
      error: 'client_name, site_url, and business_type are required',
      code:  'E400',
    });
  }

  const privacyFile = req.files?.privacy?.[0] ?? null;
  const tocFile     = req.files?.toc?.[0]     ?? null;

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

  const uid = 'toc_' + crypto.randomBytes(4).toString('hex');
  const db  = getDatabase();

  db.prepare(`
    INSERT INTO toc_audits (uid, client_name, site_url, business_type, has_privacy, has_toc)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uid, client_name, site_url, business_type,
    privacyFile ? 1 : 0, tocFile ? 1 : 0);

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

// ── POST /api/toc/:uid/publish ────────────────────────────────────────────────
// Protected — SQLite transaction, immutable snapshot

function handlePublish(req, res) {
  const { uid } = req.params;
  const db       = getDatabase();

  const audit = db.prepare('SELECT * FROM toc_audits WHERE uid = ?').get(uid);
  if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });
  if (audit.share_uid) return res.status(409).json({ error: 'Already published', code: 'E409' });

  const privacyRow = db.prepare(
    "SELECT * FROM toc_results WHERE audit_uid = ? AND doc_type = 'privacy'"
  ).get(uid);

  const tocRow = db.prepare(
    "SELECT * FROM toc_results WHERE audit_uid = ? AND doc_type = 'toc'"
  ).get(uid);

  const shareUid = crypto.randomBytes(8).toString('hex');

  const snapshot = JSON.stringify({
    audit,
    privacy_result: parseResultRow(privacyRow),
    toc_result:     parseResultRow(tocRow),
  });

  const publishTx = db.transaction(() => {
    db.prepare(`
      UPDATE toc_audits
      SET share_uid = ?, published_json = ?, published_at = datetime('now')
      WHERE uid = ?
    `).run(shareUid, snapshot, uid);
  });

  try {
    publishTx();
  } catch (txErr) {
    logger.error('publish-tx-failed', { uid, error: txErr.message });
    return res.status(500).json({ error: 'Publish failed (transaction error)', code: 'E500' });
  }

  const share_url = `/toc-report/share/${shareUid}`;
  logger.info('publish-complete', { uid, shareUid, share_url });

  return res.json({ share_uid: shareUid, share_url });
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

module.exports = router;
