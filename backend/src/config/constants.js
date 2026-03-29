'use strict';

/**
 * Application constants — env-driven configuration for Claude API and budget control.
 * claude-api.js (Group 1 copy) reads from this module.
 */

module.exports = {
  // Claude API
  CLAUDE_API_KEY:   process.env.ANTHROPIC_API_KEY || '',
  CLAUDE_API_URL:   'https://api.anthropic.com/v1/messages',
  CLAUDE_MODEL:     process.env.CLAUDE_MODEL    || 'claude-sonnet-4-6',
  CLAUDE_MAX_TOKENS:         parseInt(process.env.CLAUDE_MAX_TOKENS         || '22000', 10), // generic calls
  CLAUDE_MAX_TOKENS_PRIVACY: parseInt(process.env.CLAUDE_MAX_TOKENS_PRIVACY || '48000', 10), // privacy + toc audits
  CLAUDE_MAX_TOKENS_BURST:   parseInt(process.env.CLAUDE_MAX_TOKENS_BURST   || '48000', 10), // audit calls (Claude Sonnet 4.6 max: 128k)

  // Budget guard (internal tool — generous limit)
  DAILY_BUDGET_USD: parseFloat(process.env.DAILY_BUDGET_USD || '20'),
};
