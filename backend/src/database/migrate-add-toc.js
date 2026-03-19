'use strict';

/**
 * Migration: Create toc_audits and toc_results tables
 * Runs on every startup — CREATE TABLE IF NOT EXISTS guards prevent duplicates.
 */

function run(db) {
  // ── toc_audits ─────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS toc_audits (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      uid            TEXT NOT NULL UNIQUE,
      client_name    TEXT NOT NULL,
      site_url       TEXT NOT NULL,
      business_type  TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'processing',
      has_privacy    INTEGER NOT NULL DEFAULT 0,
      has_toc        INTEGER NOT NULL DEFAULT 0,
      error_details  TEXT,
      share_uid      TEXT,
      published_json TEXT,
      created_at     DATETIME NOT NULL DEFAULT (datetime('now')),
      published_at   DATETIME
    )
  `);

  // ── toc_results ────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS toc_results (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_uid            TEXT NOT NULL,
      doc_type             TEXT NOT NULL,
      criteria_json        TEXT NOT NULL,
      editor_criteria_json TEXT,
      total_score          REAL,
      total_max_score      REAL,
      total_pct            REAL,
      tier_scores_json     TEXT,
      low_score_count      INTEGER,
      verbal_scale         TEXT,
      recommendations_json TEXT,
      business_summary     TEXT,
      evaluated_count      INTEGER,
      expected_count       INTEGER,
      FOREIGN KEY (audit_uid) REFERENCES toc_audits(uid)
    )
  `);

  // ── Indexes ─────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_toc_audits_uid
      ON toc_audits(uid);

    CREATE INDEX IF NOT EXISTS idx_toc_results_audit
      ON toc_results(audit_uid);

    CREATE INDEX IF NOT EXISTS idx_toc_audits_created
      ON toc_audits(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_toc_share
      ON toc_audits(share_uid)
      WHERE share_uid IS NOT NULL;
  `);

  process.stdout.write(JSON.stringify({
    ts: new Date().toISOString(),
    service: 'migrate-add-toc',
    level: 'info',
    event: 'toc_tables_ready'
  }) + '\n');
}

module.exports = { run };
