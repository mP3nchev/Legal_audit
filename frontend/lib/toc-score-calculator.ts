// VISUAL ONLY — backend is the source of truth for all authoritative scores.
// This file is a TypeScript port of backend/src/analyzers/toc-score-calculator.js
// used exclusively for instant UI feedback when the user drags sliders.

export interface Criterion {
  id:          number;
  name:        string;
  tier:        number;
  multiplier:  number;
  score:       number | null;  // null when skipped
  skipped:     boolean;
  explanation: string | null;
}

export interface TierResult {
  score: number;
  max:   number;
  pct:   number;
}

export interface TierScores {
  tier1: TierResult;
  tier2: TierResult;
  tier3: TierResult;
  tier4: TierResult;
}

export interface ScoringResult {
  tier_scores:     TierScores;
  total_score:     number;
  total_max_score: number;
  total_pct:       number;
  verbal_scale:    string;
  low_score_count: number;
}

// Must be identical to backend VERBAL_SCALE
const VERBAL_SCALE = [
  { min: 0,  max: 30,  label: 'Критичен риск' },
  { min: 31, max: 50,  label: 'Несъответствие' },
  { min: 51, max: 60,  label: 'Частично съответствие' },
  { min: 61, max: 75,  label: 'Адекватно' },
  { min: 76, max: 89,  label: 'Високо съответствие' },
  { min: 90, max: 100, label: 'Пълно съответствие' },
] as const;

export function calculateTierScore(criteria: Criterion[], tierNum: number): TierResult {
  const tierCriteria = criteria.filter(c => c.tier === tierNum && !c.skipped);
  if (tierCriteria.length === 0) return { score: 0, max: 0, pct: 0 };

  const multiplier = tierCriteria[0].multiplier ?? 1;
  const score = tierCriteria.reduce((sum, c) => sum + (c.score ?? 0) * multiplier, 0);
  const max   = tierCriteria.length * 5 * multiplier;
  const pct   = max > 0 ? (score / max) * 100 : 0;

  return { score, max, pct };
}

export function calculateTotal(criteria: Criterion[]): { tier_scores: TierScores; total_score: number; total_max_score: number; total_pct: number } {
  const tier_scores = {} as TierScores;
  let total_score = 0;
  let total_max_score = 0;

  for (let t = 1; t <= 4; t++) {
    const ts = calculateTierScore(criteria, t);
    (tier_scores as unknown as Record<string, TierResult>)[`tier${t}`] = ts;
    total_score     += ts.score;
    total_max_score += ts.max;
  }

  const total_pct = total_max_score > 0 ? (total_score / total_max_score) * 100 : 0;
  return { tier_scores, total_score, total_max_score, total_pct };
}

export function getVerbalScale(pct: number): string {
  const rounded = Math.round(pct);
  for (const step of VERBAL_SCALE) {
    if (rounded >= step.min && rounded <= step.max) return step.label;
  }
  return rounded <= 0 ? VERBAL_SCALE[0].label : VERBAL_SCALE[VERBAL_SCALE.length - 1].label;
}

export function countLowScores(criteria: Criterion[]): number {
  return criteria.filter(c => !c.skipped && c.score !== null && c.score <= 3).length;
}

export function recalculateFromEditor(criteria: Criterion[]): ScoringResult {
  const { tier_scores, total_score, total_max_score, total_pct } = calculateTotal(criteria);
  return {
    tier_scores,
    total_score,
    total_max_score,
    total_pct,
    verbal_scale:    getVerbalScale(total_pct),
    low_score_count: countLowScores(criteria),
  };
}
