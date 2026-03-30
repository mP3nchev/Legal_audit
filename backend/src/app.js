'use strict';

const express      = require('express');
const cors         = require('cors');
const { requestIdMiddleware: addRequestId } = require('./middleware/requestId');
const { errorHandler }     = require('./middleware/error-handler');
const { createLogger }     = require('./utils/logger');
const { initDatabase }     = require('./database/db');
const tocRoutes            = require('./routes/toc.routes');

const logger = createLogger('app');
const app    = express();

// ── Database init (runs migrations including toc tables) ─────────────────────
initDatabase();
logger.info('app-init', { event: 'db_ready' });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(addRequestId);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info('request', { method: req.method, path: req.path, ip: req.ip });
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/toc', tocRoutes);

// ── Health check (unauthenticated) ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  logger.warn('route-not-found', { method: req.method, path: req.path });
  res.status(404).json({ error: 'Not found', code: 'E404', path: req.path });
});

// ── Centralised error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
