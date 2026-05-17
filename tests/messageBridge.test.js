import test from 'node:test';
import assert from 'node:assert/strict';

import { parseOwnerSelection, routeIncomingText } from '../src/adapters/messageBridge.js';

const pet = {
  id: 'pet_1',
  name: '阿墨',
  emotion: { joy: 20, missing: 0, worry: 0, pride: 0, grievance: 0, curiosity: 35, shyness: 10, fatigue: 0 },
  bond: { points: 80, level: 2, stage: 'attached' },
  vitality: { spirit: 100, fatigue: 0, injury: 0, status: 'healthy' },
  personality: { curiosity: 70, courage: 60, playfulness: 80 },
  equipment: []
};

test('parseOwnerSelection parses numeric panel choices only', () => {
  assert.deepEqual(parseOwnerSelection('1'), { type: 'panel_selection', choice: 1 });
  assert.deepEqual(parseOwnerSelection('  3  '), { type: 'panel_selection', choice: 3 });
  assert.equal(parseOwnerSelection('阿墨真棒'), null);
});

test('routeIncomingText routes adventure keywords to panel instead of immediate risky execution', async () => {
  const result = await routeIncomingText({ text: '去异常裂隙探险', pet, memoryRepo: { async writeMemory() {}, async writeLatestAliveSnapshot() {} } });

  assert.equal(result.agentResult.actions[0].type, 'open_panel');
  assert.match(result.messages[0].text, /异常裂隙探险面板/);
  assert.equal(result.messages[0].metadata.requiresOwnerChoice, true);
});

test('routeIncomingText routes normal owner text to SoulPetAgent reply', async () => {
  const result = await routeIncomingText({ text: '阿墨真棒', pet, memoryRepo: { async writeMemory() {}, async writeLatestAliveSnapshot() {} } });

  assert.equal(result.agentResult.actions[0].type, 'reply');
  assert.match(result.messages[0].text, /主人/);
});

test('routeIncomingText stores panel selection as pending owner choice event', async () => {
  const result = await routeIncomingText({ text: '1', pet, memoryRepo: { async writeMemory() {}, async writeLatestAliveSnapshot() {} } });

  assert.equal(result.event.type, 'panel_selection');
  assert.equal(result.messages[0].metadata.requiresOwnerChoice, false);
  assert.match(result.messages[0].text, /没有待处理面板/);
});
