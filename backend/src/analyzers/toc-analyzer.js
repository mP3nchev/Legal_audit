'use strict';

/**
 * TOC Analyzer — orchestrates Privacy Policy and T&C analysis via Claude API.
 *
 * Architecture decisions:
 *  • Uses @anthropic-ai/sdk directly (timeout: 300s) — claude-api.js timeout is 90s
 *  • Circuit breaker from circuit-breaker.js wraps every Claude call
 *  • Fire-and-forget via runFullAnalysis — HTTP 200 is returned before Claude starts
 *  • Sequential: Privacy → 15s delay → T&C (no concurrency, rate limit protection)
 */

const path      = require('path');
const fs        = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

const { CircuitBreaker }    = require('../utils/circuit-breaker');
const { createLogger }      = require('../utils/logger');
const { extractTextFromBuffer, cleanText } = require('../utils/text-extractor');
const { getDatabase }       = require('../database/db');
const constants             = require('../config/constants');
const {
  calculateTotal,
  getVerbalScale,
  countLowScores,
} = require('./toc-score-calculator');

const logger  = createLogger('toc-analyzer');
const breaker = new CircuitBreaker({ name: 'toc-claude', failureThreshold: 3, resetTimeout: 120_000 });

const CLAUDE_MODEL   = constants.CLAUDE_MODEL;
const CLAUDE_TIMEOUT = 300_000; // 300 seconds per document — plan requirement

// ── Config loaders ────────────────────────────────────────────────────────────

function loadCriteriaConfig(docType) {
  const p = path.join(__dirname, `../config/toc-criteria-${docType}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadQuestions() {
  const p = path.join(__dirname, '../config/toc-questions.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ── Task 2.1: buildActiveCriteria ────────────────────────────────────────────
/**
 * Build the list of active criteria for a document type, applying skip logic.
 *
 * @param {string} docType            - 'privacy' | 'toc'
 * @param {Object} questionsAnswers   - { has_registration: true, processes_payments: false, ... }
 * @param {Object} criteriaConfig     - contents of toc-criteria-{docType}.json
 * @returns {Array}                   - [{...criterion, skipped: bool}]
 * @throws                            - CRITERIA_COUNT_MISMATCH if totals don't add up
 */
function buildActiveCriteria(docType, questionsAnswers, criteriaConfig) {
  const questions   = loadQuestions();
  const allCriteria = Object.values(criteriaConfig.tiers).flat();

  // Collect ids to skip based on false answers
  // skip_criteria_if_false supports both legacy array and new per-docType object: { privacy: [], toc: [] }
  const skipIds = new Set();
  for (const [key, answer] of Object.entries(questionsAnswers || {})) {
    if (!answer && questions[key]) {
      const q = questions[key];
      const appliesToDoc = q.applies_to === 'both' || q.applies_to === docType;
      if (appliesToDoc && q.skip_criteria_if_false) {
        const skipList = Array.isArray(q.skip_criteria_if_false)
          ? q.skip_criteria_if_false                      // legacy format
          : (q.skip_criteria_if_false[docType] || []);    // per-docType format
        skipList.forEach(id => skipIds.add(id));
      }
    }
  }

  const result    = allCriteria.map(c => ({ ...c, skipped: skipIds.has(c.id) }));
  const evaluated = result.filter(c => !c.skipped).length;
  const skipped   = result.filter(c =>  c.skipped).length;

  logger.info('active-criteria-built', {
    docType, evaluated, skipped, expected: criteriaConfig.expected_count,
  });

  // Critical validation — all criteria must be accounted for
  if (evaluated + skipped !== criteriaConfig.expected_count) {
    throw new Error(
      `CRITERIA_COUNT_MISMATCH: expected ${criteriaConfig.expected_count} total, ` +
      `got evaluated=${evaluated} + skipped=${skipped} = ${evaluated + skipped}`
    );
  }

  return result;
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt(docType) {
  if (docType === 'privacy') {
    const promptPath = path.join(
      __dirname,
      '../../prompts/ONLY INSTRUCTION SET \u2014 PRIVACY POLICY AUDITOR_March 2026.md'
    );
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf8');
    }
    logger.warn('privacy-prompt-file-missing', { path: promptPath });
    // Fallback — minimal prompt when file is absent
    return (
      'You are a senior GDPR legal expert specializing in Privacy Policy compliance. ' +
      'Evaluate the privacy policy against the listed criteria and return structured JSON scores. ' +
      'Return ONLY a valid JSON array — no explanatory text before or after.'
    );
  }
  return (
    'You are a senior contract lawyer specializing in Terms & Conditions compliance. ' +
    'You evaluate terms and conditions documents against specific criteria and return structured JSON scores. ' +
    'You are precise, consistent, and strictly follow the exact output format requested. ' +
    'Return ONLY a valid JSON array — no explanatory text before or after.'
  );
}

function buildUserPrompt(docType, activeCriteria, businessContext, documentText) {
  const docLabel    = docType === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';
  const activeList  = activeCriteria.filter(c => !c.skipped);
  const skippedList = activeCriteria.filter(c =>  c.skipped);
  const criteriaStr = activeList
    .map(c => `${c.id}. [Tier ${c.tier}, weight ×${c.multiplier}] ${c.name}`)
    .join('\n');

  const lang     = businessContext.language === 'bg' ? 'Bulgarian' : 'English';
  const langNote = `LANGUAGE INSTRUCTION: Write ALL "explanation" and "recommendation" field values ENTIRELY in ${lang}. This is mandatory - do not use any other language regardless of the document's language or this prompt's language.
FORMATTING RULES: Use only straight double quotes " for quotations. Use only hyphen - for dashes. Do NOT use curly/smart quotes (\u2018\u2019\u201C\u201D) or em dashes (\u2014) or en dashes (\u2013).`;

  const excludedSection = skippedList.length > 0
    ? `EXCLUDED CRITERIA — NOT APPLICABLE (set score=0, applicable=false, skip evaluation and all related interdependency rules):
${skippedList.map(c => `${c.id}. ${c.name}`).join('\n')}

`
    : '';

  return `${langNote}

${excludedSection}You are auditing a ${docLabel} for the following business:
Business type: ${businessContext.businessType}
Site URL: ${businessContext.siteUrl}
Client: ${businessContext.clientName}

EVALUATE EXACTLY the following ${activeList.length} criteria:
${criteriaStr}

SCORING SCALE (1–5):
1 = Completely absent or grossly inadequate
2 = Mentioned but very inadequately addressed
3 = Partially addressed with significant gaps
4 = Well addressed with only minor gaps
5 = Fully and comprehensively addressed

DOCUMENT TO ANALYZE:
${documentText}

CRITICAL OUTPUT RULES:
1. Return ONLY a valid JSON array. No text before or after.
2. First character MUST be [
3. Last character MUST be ]
4. Array MUST contain EXACTLY ${activeList.length} objects — one per ACTIVE criterion above (excluded criteria are NOT in the array).
5. Each object: { "id": <number>, "score": <1-5>, "explanation": "<2-3 sentences of findings in ${lang}>", "recommendation": "<2-3 sentences of actionable guidance on what specifically to add or fix, written in ${lang} — provide ONLY for criteria scoring ≤ 2, empty string for all others>" }

OUTPUT (JSON array only, starting with [):`;
}

// ── Robust JSON extractor ─────────────────────────────────────────────────────

function parseClaudeJson(raw) {
  const first = raw.indexOf('[');
  const last  = raw.lastIndexOf(']');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error(`No JSON array found in response. Preview: ${raw.slice(0, 200)}`);
  }
  return JSON.parse(raw.substring(first, last + 1));
}

// ── Claude API call (with circuit breaker) ────────────────────────────────────

async function callClaude(systemPrompt, userPrompt, auditUid, docType, attempt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey, timeout: CLAUDE_TIMEOUT });

  // Audit calls use BURST limit (38k) directly — Anthropic charges for actual
  // tokens generated, not for max_tokens, so there is no cost penalty.
  // Generic calls use the standard 22k limit.
  const maxTokens = (docType === 'privacy' || docType === 'toc')
    ? constants.CLAUDE_MAX_TOKENS_BURST
    : constants.CLAUDE_MAX_TOKENS;

  logger.info('claude-call-start', { auditUid, docType, attempt, model: CLAUDE_MODEL, maxTokens });

  const response = await breaker.call(() =>
    client.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    })
  );

  const outputTokens = response.usage?.output_tokens ?? 0;

  // Warn if response still hit the ceiling (indicates an unusually large document)
  if (response.stop_reason === 'max_tokens') {
    logger.warn('claude-output-truncated', {
      auditUid, docType, attempt, outputTokens, maxTokens,
      hint: 'Response was cut off. Consider raising CLAUDE_MAX_TOKENS_BURST.',
    });
  }

  const raw = response.content?.[0]?.text ?? '';
  logger.info('claude-call-done', {
    auditUid, docType, attempt,
    inputTokens:  response.usage?.input_tokens,
    outputTokens, stopReason: response.stop_reason,
    previewLen:   raw.length,
  });

  return { raw };
}

// ── Task 2.2: analyzePrivacyPolicy ───────────────────────────────────────────

async function analyzePrivacyPolicy(text, activeCriteria, businessContext, auditUid) {
  const expectedCount = activeCriteria.filter(c => !c.skipped).length;
  logger.info('analyze-privacy-start', { auditUid, expectedCount, textLen: text.length });

  const system = buildSystemPrompt('privacy');
  const user   = buildUserPrompt('privacy', activeCriteria, businessContext, text);

  let parsed;

  // Attempt 1
  try {
    const { raw } = await callClaude(system, user, auditUid, 'privacy', 1);
    parsed = parseClaudeJson(raw);
  } catch (firstErr) {
    logger.warn('analyze-privacy-retry', { auditUid, reason: firstErr.message });

    // Attempt 2 — more explicit instructions
    const retryUser = user +
      '\n\nYour previous response could not be parsed as JSON. ' +
      'Return ONLY the raw JSON array starting with [ and ending with ]. Absolutely nothing else.';
    try {
      const { raw: raw2 } = await callClaude(system, retryUser, auditUid, 'privacy', 2);
      parsed = parseClaudeJson(raw2);
    } catch (secondErr) {
      throw new Error(`JSON_PARSE_FAILED: ${secondErr.message}`);
    }
  }

  // Post-parse validation — warn but do not fail if Claude returns slightly fewer criteria.
  // mergeWithConfig fills any missing criterion with score=1 as a safe default.
  if (parsed.length !== expectedCount) {
    logger.warn('analyze-privacy-count-mismatch', {
      auditUid, expectedCount, got: parsed.length,
      hint: 'mergeWithConfig will fill missing criteria with score=1',
    });
  }

  return mergeWithConfig(parsed, activeCriteria);
}

// ── Task 2.3: analyzeToc ─────────────────────────────────────────────────────

async function analyzeToc(text, activeCriteria, businessContext, auditUid) {
  const expectedCount = activeCriteria.filter(c => !c.skipped).length;
  logger.info('analyze-toc-start', { auditUid, expectedCount, textLen: text.length });

  const system = buildSystemPrompt('toc');
  const user   = buildUserPrompt('toc', activeCriteria, businessContext, text);

  let parsed;

  try {
    const { raw } = await callClaude(system, user, auditUid, 'toc', 1);
    parsed = parseClaudeJson(raw);
  } catch (firstErr) {
    logger.warn('analyze-toc-retry', { auditUid, reason: firstErr.message });

    const retryUser = user +
      '\n\nYour previous response could not be parsed as JSON. ' +
      'Return ONLY the raw JSON array starting with [ and ending with ]. Absolutely nothing else.';
    try {
      const { raw: raw2 } = await callClaude(system, retryUser, auditUid, 'toc', 2);
      parsed = parseClaudeJson(raw2);
    } catch (secondErr) {
      throw new Error(`JSON_PARSE_FAILED: ${secondErr.message}`);
    }
  }

  if (parsed.length !== expectedCount) {
    logger.warn('analyze-toc-count-mismatch', {
      auditUid, expectedCount, got: parsed.length,
      hint: 'mergeWithConfig will fill missing criteria with score=1',
    });
  }

  return mergeWithConfig(parsed, activeCriteria);
}

// ── Merge Claude response with criteria config ────────────────────────────────

function sanitizeText(text) {
  if (!text) return text;
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, '"')  // curly single quotes -> double quote
    .replace(/[\u201C\u201D]/g, '"')               // curly double quotes -> double quote
    .replace(/[\u2014\u2013]/g, '-');              // em dash, en dash -> hyphen
}

function mergeWithConfig(claudeResponse, activeCriteria) {
  const responseMap = new Map(claudeResponse.map(r => [r.id, r]));

  return activeCriteria.map(criterion => {
    if (criterion.skipped) {
      return { ...criterion, score: null, explanation: null };
    }
    const r = responseMap.get(criterion.id);
    return {
      ...criterion,
      score:          r?.score          ?? 1,
      explanation:    sanitizeText(r?.explanation    ?? ''),
      recommendation: sanitizeText(r?.recommendation ?? ''),
    };
  });
}

// ── Save result to toc_results ────────────────────────────────────────────────

function saveTocResult(auditUid, docType, fullCriteria, expectedCount) {
  const db = getDatabase();

  const { tier_scores, total_score, total_max_score, total_pct } = calculateTotal(fullCriteria);
  const verbal_scale    = getVerbalScale(total_pct);
  const low_score_count = countLowScores(fullCriteria);
  const evaluated_count = fullCriteria.filter(c => !c.skipped).length;

  // Priority recommendations: Tier 1 first, then Tier 2 etc.; score ≤ 2 only; max 7
  const lowScoring = fullCriteria
    .filter(c => !c.skipped && c.score !== null && c.score <= 2)
    .sort((a, b) => a.tier - b.tier || a.score - b.score);

  // Fallback: if fewer than 3 found at ≤2, take lowest-scoring overall (up to 5)
  const recSource = lowScoring.length >= 3
    ? lowScoring.slice(0, 7)
    : fullCriteria
        .filter(c => !c.skipped && c.score !== null)
        .sort((a, b) => a.tier - b.tier || a.score - b.score)
        .slice(0, 5);

  const recommendations = recSource.map(c => ({
    title:          c.name,
    text:           c.explanation    || '',
    recommendation: c.recommendation || '',
  }));

  const business_summary =
    `Одитът обхваща ${evaluated_count} критерия. ` +
    `Обща оценка: ${total_pct.toFixed(1)}% (${verbal_scale}). ` +
    `Критерии с ниска оценка (≤3): ${low_score_count}.`;

  db.prepare(`
    INSERT INTO toc_results (
      audit_uid, doc_type, criteria_json,
      total_score, total_max_score, total_pct,
      tier_scores_json, low_score_count, verbal_scale,
      recommendations_json, business_summary,
      evaluated_count, expected_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    auditUid, docType,
    JSON.stringify(fullCriteria),
    total_score, total_max_score, total_pct,
    JSON.stringify(tier_scores),
    low_score_count, verbal_scale,
    JSON.stringify(recommendations),
    business_summary,
    evaluated_count, expectedCount,
  );

  logger.info('result-saved', {
    auditUid, docType,
    total_pct: total_pct.toFixed(1), verbal_scale, low_score_count,
  });
}

// ── Task 2.3: runFullAnalysis (fire-and-forget engine) ───────────────────────
/**
 * Orchestrates the full audit: Privacy → 15s delay → T&C.
 * Called fire-and-forget from /start route handler — HTTP 200 already sent.
 *
 * @param {Object|null} privacyFile     - multer file object {buffer, originalname}
 * @param {Object|null} tocFile         - multer file object {buffer, originalname}
 * @param {Object}      questionsAnswers - {has_registration: bool, ...}
 * @param {Object}      businessContext  - {clientName, siteUrl, businessType}
 * @param {string}      auditUid
 */
async function runFullAnalysis(privacyFile, tocFile, questionsAnswers, businessContext, auditUid) {
  const db = getDatabase();

  // ── Privacy ───────────────────────────────────────────────────────────────
  if (privacyFile) {
    try {
      const privacyConfig  = loadCriteriaConfig('privacy');
      const activeCriteria = buildActiveCriteria('privacy', questionsAnswers, privacyConfig);
      const rawText        = await extractTextFromBuffer(privacyFile.buffer, privacyFile.originalname);
      const cleanedText    = cleanText(rawText);
      const fullCriteria   = await analyzePrivacyPolicy(cleanedText, activeCriteria, businessContext, auditUid);
      saveTocResult(auditUid, 'privacy', fullCriteria, privacyConfig.expected_count);
    } catch (err) {
      logger.error('privacy-analysis-failed', { auditUid, error: err.message });
      db.prepare("UPDATE toc_audits SET status='failed', error_details=? WHERE uid=?")
        .run(`Privacy analysis failed: ${err.message}`, auditUid);
      return; // Do NOT proceed to T&C when Privacy fails
    }
  }

  // 15s cooldown between sequential Claude calls (rate limit protection)
  if (privacyFile && tocFile) {
    logger.info('inter-doc-delay', { auditUid, delayMs: 15_000 });
    await new Promise(resolve => setTimeout(resolve, 15_000)); // non-blocking
  }

  // ── T&C ───────────────────────────────────────────────────────────────────
  if (tocFile) {
    try {
      const tocConfig      = loadCriteriaConfig('toc');
      const activeCriteria = buildActiveCriteria('toc', questionsAnswers, tocConfig);
      const rawText        = await extractTextFromBuffer(tocFile.buffer, tocFile.originalname);
      const cleanedText    = cleanText(rawText);
      const fullCriteria   = await analyzeToc(cleanedText, activeCriteria, businessContext, auditUid);
      saveTocResult(auditUid, 'toc', fullCriteria, tocConfig.expected_count);
    } catch (err) {
      logger.error('toc-analysis-failed', { auditUid, error: err.message });
      // Privacy result is already saved — mark as partial, not failed
      db.prepare("UPDATE toc_audits SET status='partial', error_details=? WHERE uid=?")
        .run(`T&C analysis failed: ${err.message}`, auditUid);
      return;
    }
  }

  db.prepare("UPDATE toc_audits SET status='completed' WHERE uid=?").run(auditUid);
  logger.info('full-analysis-complete', { auditUid });
}

module.exports = {
  buildActiveCriteria,
  analyzePrivacyPolicy,
  analyzeToc,
  runFullAnalysis,
};
