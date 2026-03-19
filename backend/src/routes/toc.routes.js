'use strict';

const express     = require('express');
const path        = require('path');
const fs          = require('fs');
const router      = express.Router();

const { authMiddleware }       = require('../middleware/auth');
const { uploadMultipleFiles }  = require('../middleware/file-upload');
const { getDatabase }          = require('../database/db');
const { createLogger }         = require('../utils/logger');

const logger = createLogger('toc');

// File upload fields accepted by /start
const tocUpload = uploadMultipleFiles([
  { name: 'privacy', maxCount: 1 },
  { name: 'toc',     maxCount: 1 },
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadQuestions() {
  const qPath = path.join(__dirname, '../config/toc-questions.json');
  return JSON.parse(fs.readFileSync(qPath, 'utf8'));
}

// ── POST /api/toc/start ──────────────────────────────────────────────────────
// Accepts multipart/form-data; returns {audit_uid} immediately (fire-and-forget)

async function handleStart(req, res) {
  // TODO (Phase 2): full implementation
  return res.status(501).json({ error: 'Not implemented', code: 'E501' });
}

// ── GET /api/toc/questions?business_type=X ───────────────────────────────────
// Public — no auth required

function handleGetQuestions(req, res) {
  try {
    const { business_type } = req.query;
    const questions = loadQuestions();

    // Filter to questions that apply to the given business type (optional refinement)
    const filtered = Object.entries(questions).reduce((acc, [key, q]) => {
      acc[key] = q;
      return acc;
    }, {});

    logger.info('questions-fetched', { business_type });
    return res.json({ questions: filtered });
  } catch (err) {
    logger.error('questions-load-failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to load questions', code: 'E500' });
  }
}

// ── GET /api/toc/:uid/status ─────────────────────────────────────────────────
// Lightweight poll — no auth (uid is sufficient protection)

function handleStatus(req, res) {
  try {
    const db    = getDatabase();
    const audit = db.prepare(
      'SELECT status, error_details FROM toc_audits WHERE uid = ?'
    ).get(req.params.uid);

    if (!audit) return res.status(404).json({ error: 'Not found', code: 'E404' });

    return res.json({
      status:        audit.status,
      error_details: audit.error_details ?? null,
    });
  } catch (err) {
    logger.error('status-fetch-failed', { uid: req.params.uid, error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── GET /api/toc/:uid ────────────────────────────────────────────────────────
// Full fetch — protected

async function handleGetAudit(req, res) {
  // TODO (Phase 2): full implementation
  return res.status(501).json({ error: 'Not implemented', code: 'E501' });
}

// ── POST /api/toc/:uid/save ──────────────────────────────────────────────────
// Recalculate authoritative scores from editor criteria — protected

async function handleSave(req, res) {
  // TODO (Phase 2): full implementation
  return res.status(501).json({ error: 'Not implemented', code: 'E501' });
}

// ── POST /api/toc/:uid/publish ───────────────────────────────────────────────
// Snapshot to published_json, generate share_uid — protected

async function handlePublish(req, res) {
  // TODO (Phase 2): full implementation
  return res.status(501).json({ error: 'Not implemented', code: 'E501' });
}

// ── GET /api/toc/share/:share_uid ────────────────────────────────────────────
// Public — reads published_json snapshot

function handleShare(req, res) {
  try {
    const db    = getDatabase();
    const audit = db.prepare(
      'SELECT published_json FROM toc_audits WHERE share_uid = ?'
    ).get(req.params.share_uid);

    if (!audit || !audit.published_json) {
      return res.status(404).json({ error: 'Not found', code: 'E404' });
    }

    return res.json(JSON.parse(audit.published_json));
  } catch (err) {
    logger.error('share-fetch-failed', { share_uid: req.params.share_uid, error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── GET /api/toc/dashboard ───────────────────────────────────────────────────
// Protected — list of audits with scores

function handleDashboard(req, res) {
  try {
    const db   = getDatabase();
    const page  = Math.max(1, parseInt(req.query.page  ?? '1',  10));
    const limit = Math.min(50, parseInt(req.query.limit ?? '20', 10));
    const offset = (page - 1) * limit;

    const rows = db.prepare(`
      SELECT
        a.uid,
        a.client_name,
        a.site_url,
        a.created_at,
        a.status,
        p.total_pct   AS privacy_pct,
        p.low_score_count AS privacy_low_count,
        t.total_pct   AS toc_pct,
        t.low_score_count AS toc_low_count
      FROM toc_audits a
      LEFT JOIN toc_results p ON p.audit_uid = a.uid AND p.doc_type = 'privacy'
      LEFT JOIN toc_results t ON t.audit_uid = a.uid AND t.doc_type = 'toc'
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    return res.json({ audits: rows, page, limit });
  } catch (err) {
    logger.error('dashboard-failed', { error: err.message });
    return res.status(500).json({ error: 'Internal error', code: 'E500' });
  }
}

// ── Route registration ───────────────────────────────────────────────────────
// Order matters: static segments before :uid params

router.get('/questions',         handleGetQuestions);           // public
router.get('/share/:share_uid',  handleShare);                  // public
router.get('/dashboard',         authMiddleware, handleDashboard);

router.post('/start',            authMiddleware, tocUpload, handleStart);
router.get('/:uid/status',       handleStatus);                 // public (uid guards)
router.get('/:uid',              authMiddleware, handleGetAudit);
router.post('/:uid/save',        authMiddleware, handleSave);
router.post('/:uid/publish',     authMiddleware, handlePublish);

module.exports = router;
