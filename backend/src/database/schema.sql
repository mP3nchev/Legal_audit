-- CraftPolicy Legal Audit System
-- Base schema — toc tables are created by migrate-add-toc.js on startup
-- This file intentionally minimal: no CP_audit tables belong here.

-- Budget tracking (lightweight cost guard for Claude API calls)
CREATE TABLE IF NOT EXISTS budget_tracking (
    date TEXT PRIMARY KEY,
    spent_usd REAL NOT NULL DEFAULT 0,
    reset_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
