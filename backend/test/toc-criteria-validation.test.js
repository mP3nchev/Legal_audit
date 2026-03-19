'use strict';

/**
 * Phase 5 — Criteria validation tests
 *
 * Tests:
 *  1. Privacy criteria JSON: expected_count matches actual flattened count
 *  2. T&C criteria JSON: expected_count matches actual flattened count
 *  3. Every criterion has id, name, tier (1-4), multiplier
 *  4. No duplicate IDs within each docType config
 *  5. buildActiveCriteria — all true → no criteria skipped
 *  6. buildActiveCriteria — has_registration=false → criteria 12,13,14 skipped
 *  7. buildActiveCriteria — processes_payments=false → criteria 8,9,15,16 skipped
 *  8. buildActiveCriteria — multiple false answers → union of skip ids
 *  9. buildActiveCriteria — total evaluated + skipped === expected_count
 * 10. buildActiveCriteria — unknown question keys are ignored (no throw)
 */

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

// Load configs directly
const privacyCfg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/config/toc-criteria-privacy.json'), 'utf8')
);
const tocCfg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/config/toc-criteria-toc.json'), 'utf8')
);
const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/config/toc-questions.json'), 'utf8')
);

// Inline buildActiveCriteria logic for isolated testing (mirrors toc-analyzer.js)
function buildActiveCriteriaLocal(docType, questionsAnswers, criteriaConfig) {
  const allCriteria = Object.values(criteriaConfig.tiers).flat();

  const skipIds = new Set();
  Object.entries(questionsAnswers).forEach(([key, value]) => {
    if (value === false && questions[key]?.skip_criteria_if_false) {
      questions[key].skip_criteria_if_false.forEach(id => skipIds.add(id));
    }
  });

  const result = allCriteria.map(c => ({
    ...c,
    skipped:     skipIds.has(c.id),
    score:       null,
    explanation: null,
  }));

  const evaluated = result.filter(c => !c.skipped).length;
  const skipped   = result.filter(c =>  c.skipped).length;

  if (evaluated + skipped !== criteriaConfig.expected_count) {
    throw new Error(
      `CRITERIA_COUNT_MISMATCH: evaluated(${evaluated}) + skipped(${skipped}) !== expected(${criteriaConfig.expected_count})`
    );
  }

  return result;
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

console.log('\nCriteria Validation Tests\n');

// 1. Privacy expected_count
test('privacy expected_count matches flat count', () => {
  const flat = Object.values(privacyCfg.tiers).flat();
  assert.strictEqual(flat.length, privacyCfg.expected_count,
    `Privacy flat=${flat.length} expected=${privacyCfg.expected_count}`);
});

// 2. T&C expected_count
test('toc expected_count matches flat count', () => {
  const flat = Object.values(tocCfg.tiers).flat();
  assert.strictEqual(flat.length, tocCfg.expected_count,
    `T&C flat=${flat.length} expected=${tocCfg.expected_count}`);
});

// 3. All criteria have required fields
test('all privacy criteria have id, name, tier (1-4), multiplier', () => {
  Object.values(privacyCfg.tiers).flat().forEach(c => {
    assert.ok(typeof c.id === 'number',        `criterion missing id: ${JSON.stringify(c)}`);
    assert.ok(typeof c.name === 'string',      `criterion missing name: id=${c.id}`);
    assert.ok([1, 2, 3, 4].includes(c.tier),   `tier out of range: id=${c.id} tier=${c.tier}`);
    assert.ok(typeof c.multiplier === 'number', `criterion missing multiplier: id=${c.id}`);
  });
});

test('all toc criteria have id, name, tier (1-4), multiplier', () => {
  Object.values(tocCfg.tiers).flat().forEach(c => {
    assert.ok(typeof c.id === 'number',        `criterion missing id`);
    assert.ok(typeof c.name === 'string',      `criterion missing name: id=${c.id}`);
    assert.ok([1, 2, 3, 4].includes(c.tier),   `tier out of range: id=${c.id}`);
    assert.ok(typeof c.multiplier === 'number', `criterion missing multiplier: id=${c.id}`);
  });
});

// 4. No duplicate IDs
test('no duplicate ids in privacy config', () => {
  const ids = Object.values(privacyCfg.tiers).flat().map(c => c.id);
  const unique = new Set(ids);
  assert.strictEqual(unique.size, ids.length, `Duplicates: ${ids.filter((v, i) => ids.indexOf(v) !== i)}`);
});

test('no duplicate ids in toc config', () => {
  const ids = Object.values(tocCfg.tiers).flat().map(c => c.id);
  const unique = new Set(ids);
  assert.strictEqual(unique.size, ids.length, `Duplicates: ${ids.filter((v, i) => ids.indexOf(v) !== i)}`);
});

// 5. All true → no skipped
test('all questions true → no criteria skipped (privacy)', () => {
  const allTrue = Object.fromEntries(Object.keys(questions).map(k => [k, true]));
  const result = buildActiveCriteriaLocal('privacy', allTrue, privacyCfg);
  const skipped = result.filter(c => c.skipped);
  assert.strictEqual(skipped.length, 0, `Expected 0 skipped, got ${skipped.length}`);
});

// 6. has_registration=false → 12,13,14 skipped
test('has_registration=false skips criteria 12, 13, 14', () => {
  const answers = { has_registration: false };
  const result = buildActiveCriteriaLocal('privacy', answers, privacyCfg);
  const expectedSkipIds = questions.has_registration.skip_criteria_if_false;
  const actualSkippedIds = result.filter(c => c.skipped).map(c => c.id);
  expectedSkipIds.forEach(id => {
    // Only check IDs that exist in privacy config
    const exists = Object.values(privacyCfg.tiers).flat().some(c => c.id === id);
    if (exists) {
      assert.ok(actualSkippedIds.includes(id), `Expected id ${id} to be skipped`);
    }
  });
});

// 7. processes_payments=false → 8,9,15,16 skipped
test('processes_payments=false skips expected criteria', () => {
  const answers = { processes_payments: false };
  const result = buildActiveCriteriaLocal('privacy', answers, privacyCfg);
  const expectedSkipIds = questions.processes_payments.skip_criteria_if_false;
  const actualSkippedIds = result.filter(c => c.skipped).map(c => c.id);
  expectedSkipIds.forEach(id => {
    const exists = Object.values(privacyCfg.tiers).flat().some(c => c.id === id);
    if (exists) {
      assert.ok(actualSkippedIds.includes(id), `Expected id ${id} to be skipped`);
    }
  });
});

// 8. Multiple false answers → union of skipped ids
test('multiple false answers → union of skipped ids', () => {
  const answers = { has_registration: false, processes_payments: false };
  const result = buildActiveCriteriaLocal('privacy', answers, privacyCfg);
  const skipped = result.filter(c => c.skipped);
  // Should have at least as many as either alone
  const single = buildActiveCriteriaLocal('privacy', { has_registration: false }, privacyCfg);
  assert.ok(skipped.length >= single.filter(c => c.skipped).length,
    'Union should be >= single answer skip count');
});

// 9. evaluated + skipped === expected_count always holds
test('evaluated + skipped === expected_count for any combination', () => {
  const combinations = [
    {},
    { has_registration: false },
    { processes_payments: false },
    { has_newsletter: false },
    { has_registration: false, processes_payments: false, has_newsletter: false },
  ];
  combinations.forEach(answers => {
    // Should not throw
    const result = buildActiveCriteriaLocal('privacy', answers, privacyCfg);
    const total = result.length;
    assert.strictEqual(total, privacyCfg.expected_count,
      `answers=${JSON.stringify(answers)}: total=${total} expected=${privacyCfg.expected_count}`);
  });
});

// 10. Unknown question keys → no throw
test('unknown question keys are silently ignored', () => {
  const answers = { nonexistent_key: false, another_unknown: false };
  assert.doesNotThrow(() => {
    buildActiveCriteriaLocal('privacy', answers, privacyCfg);
  });
});

// Summary
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
