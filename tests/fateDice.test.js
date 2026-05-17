import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyFateRoll, createSeededDice } from '../src/core/fateDice.js';

test('classifyFateRoll maps boundary rolls to fate tiers', () => {
  assert.equal(classifyFateRoll(1), 'calamity');
  assert.equal(classifyFateRoll(5), 'calamity');
  assert.equal(classifyFateRoll(6), 'danger');
  assert.equal(classifyFateRoll(20), 'danger');
  assert.equal(classifyFateRoll(21), 'ordinary');
  assert.equal(classifyFateRoll(50), 'ordinary');
  assert.equal(classifyFateRoll(51), 'smooth');
  assert.equal(classifyFateRoll(80), 'smooth');
  assert.equal(classifyFateRoll(81), 'lucky');
  assert.equal(classifyFateRoll(95), 'lucky');
  assert.equal(classifyFateRoll(96), 'miracle');
  assert.equal(classifyFateRoll(100), 'miracle');
});

test('createSeededDice produces deterministic 1-100 rolls', () => {
  const a = createSeededDice('owner-pet-map');
  const b = createSeededDice('owner-pet-map');

  const rollsA = [a.roll100(), a.roll100(), a.roll100(), a.roll100(), a.roll100()];
  const rollsB = [b.roll100(), b.roll100(), b.roll100(), b.roll100(), b.roll100()];

  assert.deepEqual(rollsA, rollsB);
  for (const roll of rollsA) {
    assert.ok(roll >= 1 && roll <= 100);
  }
});
