const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function load(...names) {
  const context = vm.createContext({ console, setTimeout, clearTimeout, Map, Promise, URL });
  context.globalThis = context;
  for (const name of names) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), context);
  }
  return context.CCUdemy;
}

test('SRS SM-2 algorithm calculates intervals, ease factors and due dates correctly', () => {
  const { calculateSrs } = load('languages.js', 'settings.js', 'library.js');

  const card0 = { word: 'neural', meaning: 'thuộc nơ-ron' };

  // Rating 2 (Good) on new card -> rep 1, interval 1 day
  const card1 = calculateSrs(card0, 2);
  assert.equal(card1.srsRepetitions, 1);
  assert.equal(card1.srsInterval, 1);
  assert.equal(card1.srsEase, 2.5);
  assert(card1.srsDueDate > Date.now());

  // Rating 2 (Good) on rep 1 -> rep 2, interval 6 days
  const card2 = calculateSrs(card1, 2);
  assert.equal(card2.srsRepetitions, 2);
  assert.equal(card2.srsInterval, 6);

  // Rating 3 (Easy) on rep 2 -> rep 3, ease boosts to 2.65, interval = 6 * 2.5 * 1.3 ≈ 20 days
  const card3 = calculateSrs(card2, 3);
  assert.equal(card3.srsRepetitions, 3);
  assert.equal(card3.srsEase, 2.65);
  assert.equal(card3.srsInterval, 20);

  // Rating 1 (Again) -> resets reps to 0, interval to 0 (5 min queue), ease drops
  const cardLapse = calculateSrs(card3, 1);
  assert.equal(cardLapse.srsRepetitions, 0);
  assert.equal(cardLapse.srsInterval, 0);
  assert.equal(cardLapse.srsEase, 2.45);
  assert(cardLapse.srsDueDate <= Date.now() + 5 * 60 * 1000);
});

test('normalizeWord preserves and sanitizes SRS properties', () => {
  const { normalizeWord } = load('languages.js', 'settings.js', 'library.js');

  const normalized = normalizeWord({
    word: 'gradient',
    meaning: 'độ dốc',
    srsRepetitions: 4,
    srsInterval: 14,
    srsEase: 2.8,
    srsDueDate: 1700000000000,
    srsLastReviewed: 1699000000000
  });

  assert.equal(normalized.srsRepetitions, 4);
  assert.equal(normalized.srsInterval, 14);
  assert.equal(normalized.srsEase, 2.8);
  assert.equal(normalized.srsDueDate, 1700000000000);
  assert.equal(normalized.srsLastReviewed, 1699000000000);

  // Missing values fallback to default
  const defaultNorm = normalizeWord({ word: 'tensor', meaning: 'mảng nhiều chiều' });
  assert.equal(defaultNorm.srsRepetitions, 0);
  assert.equal(defaultNorm.srsInterval, 0);
  assert.equal(defaultNorm.srsEase, 2.5);
  assert.equal(defaultNorm.srsDueDate, 0);
});
