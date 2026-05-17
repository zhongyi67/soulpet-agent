import test from 'node:test';
import assert from 'node:assert/strict';

import { applyDamage, checkDormancy } from '../src/core/vitalityEngine.js';

test('applyDamage lowers spirit and increases fatigue and injury without going below zero', () => {
  const state = { spirit: 20, fatigue: 10, injury: 5, status: 'healthy' };

  const next = applyDamage(state, { spiritDamage: 25, fatigueGain: 12, injuryGain: 20 });

  assert.equal(next.spirit, 0);
  assert.equal(next.fatigue, 22);
  assert.equal(next.injury, 25);
  assert.equal(next.status, 'dormant');
});

test('checkDormancy allows protective artifacts to prevent dormancy once', () => {
  const state = { spirit: 0, fatigue: 50, injury: 90, status: 'critical' };
  const result = checkDormancy(state, [{ id: 'heart_guard_stone', effects: [{ type: 'prevent_dormancy_once' }] }]);

  assert.equal(result.dormant, false);
  assert.equal(result.preventedBy, 'heart_guard_stone');
  assert.equal(result.state.spirit, 1);
  assert.equal(result.state.status, 'critical');
});
