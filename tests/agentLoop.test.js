import test from 'node:test';
import assert from 'node:assert/strict';

import { updateEmotionFromOwnerMessage } from '../src/core/emotionEngine.js';
import { updateBondFromEvent } from '../src/core/bondEngine.js';
import { SoulPetAgent } from '../src/agent/SoulPetAgent.js';

function createPet() {
  return {
    id: 'pet_1',
    name: '阿墨',
    emotion: { joy: 10, missing: 5, worry: 0, pride: 0, grievance: 0, curiosity: 20, shyness: 0, fatigue: 0 },
    bond: { points: 0, level: 0, stage: 'stranger' },
    vitality: { spirit: 100, fatigue: 0, injury: 0, status: 'healthy' },
    personality: { curiosity: 70, courage: 50 },
    equipment: []
  };
}

test('updateEmotionFromOwnerMessage increases joy and pride for praise', () => {
  const next = updateEmotionFromOwnerMessage(createPet().emotion, '阿墨真棒，主人夸夸你');

  assert.ok(next.joy > 10);
  assert.ok(next.pride > 0);
  assert.equal(next.grievance, 0);
});

test('updateEmotionFromOwnerMessage increases grievance and worry for scolding without emotional blackmail', () => {
  const next = updateEmotionFromOwnerMessage(createPet().emotion, '你怎么这么笨，做错了');

  assert.ok(next.grievance > 0);
  assert.ok(next.worry > 0);
  assert.ok(next.joy <= 10);
});

test('updateBondFromEvent advances bond stage by points', () => {
  let bond = { points: 0, level: 0, stage: 'stranger' };
  bond = updateBondFromEvent(bond, 'owner_praise');
  bond = updateBondFromEvent(bond, 'owner_comfort');
  bond = updateBondFromEvent(bond, 'adventure_return');

  assert.ok(bond.points > 0);
  assert.ok(['firstBond', 'attached', 'companion', 'guardian', 'soulbound'].includes(bond.stage));
});

test('SoulPetAgent handles owner message, updates emotion/bond, writes memory, and replies', async () => {
  const writes = [];
  const memoryRepo = {
    async writeMemory(memory) { writes.push(memory); },
    async writeLatestAliveSnapshot(snapshot) { writes.push({ type: 'snapshot', snapshot }); }
  };
  const agent = new SoulPetAgent({ pet: createPet(), memoryRepo });

  const result = await agent.run({ type: 'owner_message', text: '阿墨真棒，主人摸摸你' });

  assert.equal(result.actions[0].type, 'reply');
  assert.match(result.actions[0].message, /主人/);
  assert.ok(agent.state.emotion.joy > 10);
  assert.ok(agent.state.bond.points > 0);
  assert.ok(writes.some((entry) => entry.type === 'owner_interaction'));
});

test('SoulPetAgent handles adventure request by returning a panel before starting risky action', async () => {
  const agent = new SoulPetAgent({ pet: createPet(), memoryRepo: { async writeMemory() {}, async writeLatestAliveSnapshot() {} } });

  const result = await agent.run({ type: 'adventure_request', mapId: 'anomaly_rift' });

  assert.equal(result.actions[0].type, 'open_panel');
  assert.equal(result.actions[0].panel.type, 'adventure_confirm');
  assert.match(result.actions[0].rendered, /异常裂隙探险面板/);
});

test('SoulPetAgent tick emits proactive message only through guards and logs memory', async () => {
  const writes = [];
  const pet = createPet();
  pet.bond = { points: 80, level: 2, stage: 'attached' };
  const agent = new SoulPetAgent({ pet, memoryRepo: { async writeMemory(memory) { writes.push(memory); }, async writeLatestAliveSnapshot() {} } });

  const result = await agent.run({ type: 'tick', reason: 'adventure_return', sentToday: 0, quietHours: { start: 0, end: 0 }, now: '2026-05-17T10:00:00.000Z' });

  assert.equal(result.actions[0].type, 'proactive_message');
  assert.ok(writes.some((entry) => entry.type === 'proactive_log'));
});
