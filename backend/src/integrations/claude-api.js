const constants = require('../config/constants');
const { CircuitBreaker } = require('../utils/circuit-breaker');
const { createLogger } = require('../utils/logger');

/**
 * Claude API Integration with Prompt Caching + Circuit Breaker
 * Cost optimization: 90% reduction on cached prompts
 */

const logger = createLogger('claude-api');
const claudeBreaker = new CircuitBreaker({ name: 'claude-api', failureThreshold: 3, resetTimeout: 120000 });
const CLAUDE_TIMEOUT_MS = 300000; // 300s — matches toc-analyzer.js (40-page prompts need time)

/**
 * Budget Tracker with SQLite Persistence
 * Survives server restarts (critical for production auto-scaling)
 */
let dailySpent = 0;
let budgetResetTime = Date.now();
let db = null; // Lazy-loaded database connection

/**
 * Get database connection (lazy initialization)
 */
function getDb() {
  if (!db) {
    const { getDatabase } = require('../database/db');
    db = getDatabase();
  }
  return db;
}

/**
 * Load budget from database on first access
 */
function loadBudgetFromDb() {
  try {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const row = getDb().prepare('SELECT spent_usd, reset_at FROM budget_tracking WHERE date = ?').get(today);

    if (row) {
      dailySpent = row.spent_usd;
      budgetResetTime = new Date(row.reset_at).getTime();
      logger.info('budget-loaded', { date: today, spent: dailySpent.toFixed(4) });
    } else {
      // First request of the day - initialize new row
      dailySpent = 0;
      budgetResetTime = Date.now();
      getDb().prepare('INSERT OR IGNORE INTO budget_tracking (date, spent_usd) VALUES (?, 0)').run(today);
      logger.info('budget-initialized', { date: today });
    }
  } catch (error) {
    logger.error('budget-load-failed', { error: error.message });
    // Fallback to in-memory tracking
    dailySpent = 0;
    budgetResetTime = Date.now();
  }
}

/**
 * Save budget to database
 * @param {number} cost - Cost to add
 */
function saveBudgetToDb(cost) {
  try {
    const today = new Date().toISOString().split('T')[0];
    getDb().prepare(`
      INSERT INTO budget_tracking (date, spent_usd, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(date) DO UPDATE SET
        spent_usd = spent_usd + excluded.spent_usd,
        updated_at = CURRENT_TIMESTAMP
    `).run(today, cost);
  } catch (error) {
    logger.error('budget-save-failed', { error: error.message, cost });
  }
}

/**
 * Check if budget allows a new audit request
 * @returns {{ allowed: boolean, spent: number, limit: number, retryAfter?: number }}
 */
function checkBudget() {
  // Lazy load budget on first check
  if (dailySpent === 0 && budgetResetTime === Date.now()) {
    loadBudgetFromDb();
  }
  const budget = constants.DAILY_BUDGET_USD;

  if (dailySpent >= budget) {
    // Budget exceeded - calculate seconds until next day (simplified: 24h from first spend)
    const retryAfter = Math.max(0, Math.ceil((budgetResetTime + 86400000 - Date.now()) / 1000));
    return {
      allowed: false,
      spent: dailySpent,
      limit: budget,
      retryAfter
    };
  }

  return {
    allowed: true,
    spent: dailySpent,
    limit: budget
  };
}

/**
 * Track spending after Claude API call
 * @param {number} cost - Cost in USD
 */
function trackSpending(cost) {
  dailySpent += cost;
  saveBudgetToDb(cost); // Persist to database
  logger.info('api-cost-tracked', {
    cost: cost.toFixed(4),
    dailyTotal: dailySpent.toFixed(4),
    budget: constants.DAILY_BUDGET_USD,
    remaining: (constants.DAILY_BUDGET_USD - dailySpent).toFixed(4)
  });
}

/**
 * Reset budget counter (called manually or via cron)
 */
function resetBudget() {
  const previousSpent = dailySpent;
  dailySpent = 0;
  budgetResetTime = Date.now();

  // Clear database for new day
  try {
    const today = new Date().toISOString().split('T')[0];
    getDb().prepare('INSERT OR REPLACE INTO budget_tracking (date, spent_usd, reset_at) VALUES (?, 0, CURRENT_TIMESTAMP)').run(today);
    logger.info('budget-reset', { previousSpent: previousSpent.toFixed(4), date: today });
  } catch (error) {
    logger.error('budget-reset-failed', { error: error.message });
  }
}

/**
 * Fetch with AbortController timeout
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error(`Claude API timeout after ${timeoutMs}ms`);
      e.code = 'CLAUDE_TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generic Claude API call — used by solution-generator, cookie-policy-comparator, etc.
 *
 * @param {string} prompt - User prompt text
 * @param {Object} options
 * @param {number} [options.maxTokens]   - Max output tokens (default: CLAUDE_MAX_TOKENS)
 * @param {number} [options.temperature] - Sampling temperature (0–1, default: 0.3)
 * @param {boolean} [options.useCache]   - Enable prompt caching (default: false)
 * @returns {Promise<{ text: string, usage: Object }>}
 */
async function analyzeWithClaude(prompt, options = {}) {
  const maxTokens = options.maxTokens || constants.CLAUDE_MAX_TOKENS;
  const temperature = options.temperature !== undefined ? options.temperature : 0.3;
  const startTime = Date.now();

  if (!constants.CLAUDE_API_KEY || constants.CLAUDE_API_KEY === 'sk-ant-api03-placeholder') {
    throw new Error('Claude API key not configured. Please set CLAUDE_API_KEY in .env');
  }

  const messageContent = options.useCache
    ? [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral' } }]
    : prompt;

  const requestBody = {
    model: constants.CLAUDE_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: messageContent }]
  };

  const response = await claudeBreaker.call(() =>
    fetchWithTimeout(constants.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': constants.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }, CLAUDE_TIMEOUT_MS)
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('api-request-failed', { status: response.status, error: errorText.substring(0, 200) });
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const usage = data.usage || {};
  const cost = calculateCost(usage);

  trackSpending(cost);

  logger.info('api-usage', {
    maxTokens,
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    cost: cost.toFixed(4),
    durationMs: Date.now() - startTime
  });

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error('No response text from Claude API');
  }

  return {
    text,
    usage: {
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      cached_tokens: usage.cache_read_input_tokens || 0,
      cost_usd: cost,
      model: constants.CLAUDE_MODEL
    }
  };
}

/**
 * Calculate API cost based on usage
 * Pricing for Claude Sonnet 4 (as of Jan 2025):
 * - Input: $3 per million tokens
 * - Output: $15 per million tokens
 * - Cache writes: $3.75 per million tokens
 * - Cache reads: $0.30 per million tokens
 *
 * @param {Object} usage - Usage object from Claude API
 * @returns {number} Cost in USD
 */
function calculateCost(usage) {
  const inputCost = (usage.input_tokens || 0) * 0.000003;
  const outputCost = (usage.output_tokens || 0) * 0.000015;
  const cacheWriteCost = (usage.cache_creation_input_tokens || 0) * 0.00000375;
  const cacheReadCost = (usage.cache_read_input_tokens || 0) * 0.0000003;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

/**
 * Test Claude API connection
 * @returns {Promise<boolean>} True if connection successful
 */
async function testClaudeConnection() {
  try {
    logger.info('connection-test-start', {});

    if (!constants.CLAUDE_API_KEY || constants.CLAUDE_API_KEY === 'sk-ant-api03-placeholder') {
      logger.warn('connection-test-no-key', {});
      return false;
    }

    const response = await fetch(constants.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': constants.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: constants.CLAUDE_MODEL,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      })
    });

    if (response.ok) {
      logger.info('connection-test-success', {});
      return true;
    } else {
      const errorText = await response.text();
      logger.error('connection-test-failed', { status: response.status, error: errorText.substring(0, 200) });
      return false;
    }
  } catch (error) {
    logger.error('connection-test-error', { error: error.message });
    return false;
  }
}

/**
 * Graceful fallback when Claude is unavailable.
 * Returns a placeholder requiring manual review.
 */
function buildFallbackAnalysis() {
  return {
    analysis: {
      criteria: Array.from({ length: 37 }, (_, i) => ({
        id: i + 1, score: 0, max_score: 1,
        reason: 'AI analysis unavailable — manual review required.',
        skipped: true
      })),
      total_score: 0, max_score: 37, percentage: 0,
      category: 'MANUAL_REVIEW_REQUIRED',
      fallback: true, fallback_reason: 'Claude API circuit breaker open or timeout'
    },
    usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0 },
    duration: 0,
    fallback: true
  };
}

module.exports = {
  analyzeWithClaude,
  testClaudeConnection,
  calculateCost,
  buildFallbackAnalysis,
  claudeBreaker,
  checkBudget,
  resetBudget
};
