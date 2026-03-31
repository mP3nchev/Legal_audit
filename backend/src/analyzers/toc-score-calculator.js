'use strict';

/**
 * TOC Score Calculator — Pure functions, zero I/O, zero side-effects.
 *
 * Criteria shape: { id, name, tier, multiplier, score:1-5, skipped:bool, explanation? }
 */

const VERBAL_SCALE = [
  { min: 0,  max: 30,  label: 'Критичен риск' },
  { min: 31, max: 50,  label: 'Несъответствие' },
  { min: 51, max: 60,  label: 'Частично съответствие' },
  { min: 61, max: 75,  label: 'Адекватно' },
  { min: 76, max: 89,  label: 'Високо съответствие' },
  { min: 90, max: 100, label: 'Пълно съответствие' },
];

/**
 * Calculate score for a single tier.
 *
 * @param {Array} criteria  - full flat criteria array (all tiers)
 * @param {number} tierNum  - which tier to calculate (1-4)
 * @returns {{ score, max, pct }}
 */
function calculateTierScore(criteria, tierNum) {
  const tierCriteria = criteria.filter(c => c.tier === tierNum && !c.skipped);
  if (tierCriteria.length === 0) return { score: 0, max: 0, pct: 0 };

  const multiplier = tierCriteria[0].multiplier ?? 1;
  const score = tierCriteria.reduce((sum, c) => sum + c.score * multiplier, 0);
  const max   = tierCriteria.length * 5 * multiplier;
  const pct   = max > 0 ? (score / max) * 100 : 0;

  return { score, max, pct };
}

/**
 * Calculate totals across all four tiers.
 *
 * @param {Array} criteria - full flat criteria array
 * @returns {{ tier_scores, total_score, total_max_score, total_pct }}
 */
function calculateTotal(criteria) {
  const tier_scores = {};
  let total_score = 0;
  let total_max_score = 0;

  for (let t = 1; t <= 4; t++) {
    const ts = calculateTierScore(criteria, t);
    tier_scores[`tier${t}`] = ts;
    total_score     += ts.score;
    total_max_score += ts.max;
  }

  const total_pct = total_max_score > 0
    ? (total_score / total_max_score) * 100
    : 0;

  return { tier_scores, total_score, total_max_score, total_pct };
}

/**
 * Map a percentage to a verbal scale label.
 *
 * @param {number} pct - 0-100
 * @returns {string}
 */
function getVerbalScale(pct) {
  const rounded = Math.round(pct);
  for (const step of VERBAL_SCALE) {
    if (rounded >= step.min && rounded <= step.max) return step.label;
  }
  return rounded <= 0 ? VERBAL_SCALE[0].label : VERBAL_SCALE[VERBAL_SCALE.length - 1].label;
}

/**
 * Count criteria with score ≤ 3 (skipped criteria excluded).
 *
 * @param {Array} criteria
 * @returns {number}
 */
function countLowScores(criteria) {
  return criteria.filter(c => !c.skipped && c.score <= 2).length;
}

/**
 * Recalculate full scoring from the editor's saved criteria JSON.
 * Used by POST /api/toc/:uid/save to produce authoritative scores.
 *
 * @param {Array} editorCriteria - [{id, tier, multiplier, score, skipped, explanation}]
 * @returns {{ total_score, total_max_score, total_pct, tier_scores_json, low_score_count, verbal_scale }}
 */
function recalculateFromEditor(editorCriteria) {
  const { tier_scores, total_score, total_max_score, total_pct } = calculateTotal(editorCriteria);
  const low_score_count = countLowScores(editorCriteria);
  const verbal_scale    = getVerbalScale(total_pct);

  return {
    total_score,
    total_max_score,
    total_pct,
    tier_scores_json: JSON.stringify(tier_scores),
    low_score_count,
    verbal_scale,
  };
}

module.exports = {
  calculateTierScore,
  calculateTotal,
  getVerbalScale,
  countLowScores,
  recalculateFromEditor,
};
