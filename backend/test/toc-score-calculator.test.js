'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const {
  calculateTierScore,
  calculateTotal,
  getVerbalScale,
  countLowScores,
  recalculateFromEditor,
} = require('../src/analyzers/toc-score-calculator');

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCriteria(tier, multiplier, scores, skippedFlags = []) {
  return scores.map((score, i) => ({
    id: i + 1,
    tier,
    multiplier,
    score,
    skipped: skippedFlags[i] ?? false,
  }));
}

// ── calculateTierScore ───────────────────────────────────────────────────────

test('tier1: 3 criteria × multiplier 5 — scores [5,3,4]', () => {
  const c = makeCriteria(1, 5, [5, 3, 4]);
  const r = calculateTierScore(c, 1);
  assert.equal(r.score, 60);   // (5+3+4)*5
  assert.equal(r.max,   75);   // 3*5*5
  assert.ok(Math.abs(r.pct - 80) < 0.01);
});

test('tier2: multiplier 4 — scores [4,4,4,4]', () => {
  const c = makeCriteria(2, 4, [4, 4, 4, 4]);
  const r = calculateTierScore(c, 2);
  assert.equal(r.score, 64);   // 4*4*4
  assert.equal(r.max,   80);   // 4*5*4
  assert.ok(Math.abs(r.pct - 80) < 0.01);
});

test('tier3: multiplier 3 — mixed criteria including skipped', () => {
  const criteria = [
    { id: 1, tier: 3, multiplier: 3, score: 5, skipped: false },
    { id: 2, tier: 3, multiplier: 3, score: 1, skipped: true },  // excluded
    { id: 3, tier: 3, multiplier: 3, score: 3, skipped: false },
  ];
  const r = calculateTierScore(criteria, 3);
  assert.equal(r.score, 24);   // (5+3)*3 — skipped excluded
  assert.equal(r.max,   30);   // 2*5*3
  assert.ok(Math.abs(r.pct - 80) < 0.01);
});

test('empty tier (no criteria) — returns zeros', () => {
  const r = calculateTierScore([], 1);
  assert.equal(r.score, 0);
  assert.equal(r.max,   0);
  assert.equal(r.pct,   0);
});

test('all criteria skipped — returns zeros', () => {
  const c = makeCriteria(1, 5, [5, 4, 3], [true, true, true]);
  const r = calculateTierScore(c, 1);
  assert.equal(r.score, 0);
  assert.equal(r.max,   0);
  assert.equal(r.pct,   0);
});

test('all scores maximum (5) — pct should be 100', () => {
  const c = makeCriteria(4, 2, [5, 5, 5]);
  const r = calculateTierScore(c, 4);
  assert.equal(r.pct, 100);
});

// ── calculateTotal ───────────────────────────────────────────────────────────

test('calculateTotal aggregates all 4 tiers correctly', () => {
  const criteria = [
    ...makeCriteria(1, 5, [5]),
    ...makeCriteria(2, 4, [5]),
    ...makeCriteria(3, 3, [5]),
    ...makeCriteria(4, 2, [5]),
  ];
  const { total_score, total_max_score, total_pct } = calculateTotal(criteria);
  // 1 criterion per tier, each score=5: total = 5*5 + 5*4 + 5*3 + 5*2 = 70
  assert.equal(total_score,     70);
  assert.equal(total_max_score, 70);
  assert.ok(Math.abs(total_pct - 100) < 0.01);
});

// ── getVerbalScale ───────────────────────────────────────────────────────────

test('getVerbalScale boundary: 30 → Критичен риск', () => {
  assert.equal(getVerbalScale(30), 'Критичен риск');
});

test('getVerbalScale boundary: 31 → Несъответствие', () => {
  assert.equal(getVerbalScale(31), 'Несъответствие');
});

test('getVerbalScale boundary: 50 → Несъответствие', () => {
  assert.equal(getVerbalScale(50), 'Несъответствие');
});

test('getVerbalScale boundary: 51 → Частично съответствие', () => {
  assert.equal(getVerbalScale(51), 'Частично съответствие');
});

test('getVerbalScale: 75 → Адекватно', () => {
  assert.equal(getVerbalScale(75), 'Адекватно');
});

test('getVerbalScale: 76 → Високо съответствие', () => {
  assert.equal(getVerbalScale(76), 'Високо съответствие');
});

test('getVerbalScale: 90 → Пълно съответствие', () => {
  assert.equal(getVerbalScale(90), 'Пълно съответствие');
});

test('getVerbalScale: 0 → Критичен риск', () => {
  assert.equal(getVerbalScale(0), 'Критичен риск');
});

test('getVerbalScale: 100 → Пълно съответствие', () => {
  assert.equal(getVerbalScale(100), 'Пълно съответствие');
});

// ── countLowScores ───────────────────────────────────────────────────────────

test('countLowScores: skipped criteria excluded', () => {
  const criteria = [
    { score: 2, skipped: false },   // counts
    { score: 4, skipped: false },   // does not count (>3)
    { score: 1, skipped: true },    // skipped — excluded
    { score: 3, skipped: false },   // counts (<=3)
  ];
  assert.equal(countLowScores(criteria), 2);
});

test('countLowScores: all high scores → 0', () => {
  const criteria = [{ score: 4, skipped: false }, { score: 5, skipped: false }];
  assert.equal(countLowScores(criteria), 0);
});

test('countLowScores: all skipped → 0', () => {
  const criteria = [{ score: 1, skipped: true }, { score: 2, skipped: true }];
  assert.equal(countLowScores(criteria), 0);
});

// ── recalculateFromEditor ────────────────────────────────────────────────────

test('recalculateFromEditor returns all expected fields', () => {
  const editorCriteria = [
    { id: 1, tier: 1, multiplier: 5, score: 5, skipped: false },
    { id: 2, tier: 2, multiplier: 4, score: 3, skipped: false },
    { id: 3, tier: 3, multiplier: 3, score: 2, skipped: false },
  ];
  const result = recalculateFromEditor(editorCriteria);
  assert.ok('total_score'      in result);
  assert.ok('total_max_score'  in result);
  assert.ok('total_pct'        in result);
  assert.ok('tier_scores_json' in result);
  assert.ok('low_score_count'  in result);
  assert.ok('verbal_scale'     in result);
  // tier_scores_json must be valid JSON
  assert.doesNotThrow(() => JSON.parse(result.tier_scores_json));
});

test('recalculateFromEditor: verbal_scale matches total_pct', () => {
  const editorCriteria = [{ id: 1, tier: 1, multiplier: 5, score: 5, skipped: false }];
  const result = recalculateFromEditor(editorCriteria);
  assert.equal(result.total_pct, 100);
  assert.equal(result.verbal_scale, 'Пълно съответствие');
});
