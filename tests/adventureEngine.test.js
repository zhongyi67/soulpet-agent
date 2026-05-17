import test from 'node:test';
import assert from 'node:assert/strict';

import { runAdventure } from '../src/core/adventureEngine.js';
import { defaultWorld } from '../src/world/defaultWorld.js';

test('runAdventure settles a safe newbie map without dormancy', () => {
  const pet = {
    id: 'pet_1',
    vitality: { spirit: 100, fatigue: 0, injury: 0, status: 'healthy' },
    personality: { curiosity: 50, courage: 30 },
    bond: { level: 1 },
    equipment: []
  };

  const result = runAdventure({ pet, mapId: 'crescent_courtyard', world: defaultWorld, seed: 'safe-demo' });

  assert.equal(result.map.id, 'crescent_courtyard');
  assert.equal(result.dormancy.dormant, false);
  assert.ok(result.vitalityAfter.spirit > 0);
  assert.ok(result.memories.length >= 1);
});

test('runAdventure can trigger attack and protective dormancy prevention in high risk maps', () => {
  const pet = {
    id: 'pet_1',
    vitality: { spirit: 8, fatigue: 80, injury: 70, status: 'critical' },
    personality: { curiosity: 90, courage: 80 },
    bond: { level: 3 },
    equipment: [{ id: 'heart_guard_stone', effects: [{ type: 'prevent_dormancy_once' }] }]
  };

  const result = runAdventure({ pet, mapId: 'anomaly_rift', world: defaultWorld, seed: 'danger-demo' });

  assert.equal(result.map.id, 'anomaly_rift');
  assert.equal(result.dormancy.dormant, false);
  assert.equal(result.dormancy.preventedBy, 'heart_guard_stone');
  assert.equal(result.vitalityAfter.status, 'critical');
});
