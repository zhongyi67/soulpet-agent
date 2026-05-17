import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { routeIncomingText } from '../src/adapters/messageBridge.js';
import { PendingPanelStore } from '../src/core/pendingPanelStore.js';

function createPet() {
  return {
    id: 'pet_1',
    name: '阿墨',
    emotion: { joy: 20, missing: 0, worry: 0, pride: 0, grievance: 0, curiosity: 35, shyness: 10, fatigue: 0 },
    bond: { points: 80, level: 2, stage: 'attached' },
    vitality: { spirit: 100, fatigue: 0, injury: 0, status: 'healthy' },
    personality: { curiosity: 70, courage: 60, playfulness: 80 },
    equipment: []
  };
}

function memoryRepo(calls = []) {
  return {
    async writeMemory(memory) { calls.push({ type: 'memory', memory }); },
    async writeAdventureResult(result) { calls.push({ type: 'adventure', result }); },
    async writeLatestAliveSnapshot(snapshot) { calls.push({ type: 'snapshot', snapshot }); }
  };
}

async function tempPanelStore() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'soulpet-panel-'));
  return new PendingPanelStore(path.join(dir, 'pending.json'));
}

test('adventure request stores pending panel and does not execute adventure immediately', async () => {
  const calls = [];
  const panelStore = await tempPanelStore();

  const result = await routeIncomingText({ text: '去异常裂隙探险', pet: createPet(), memoryRepo: memoryRepo(calls), panelStore });
  const pending = await panelStore.load();

  assert.equal(result.agentResult.actions[0].type, 'open_panel');
  assert.equal(pending.type, 'adventure_request');
  assert.equal(pending.mapId, 'anomaly_rift');
  assert.equal(calls.some((call) => call.type === 'adventure'), false);
});

test('panel selection 1 executes stored adventure, clears pending panel, and writes memory', async () => {
  const calls = [];
  const panelStore = await tempPanelStore();
  await routeIncomingText({ text: '去异常裂隙探险', pet: createPet(), memoryRepo: memoryRepo(calls), panelStore });

  const result = await routeIncomingText({ text: '1', pet: createPet(), memoryRepo: memoryRepo(calls), panelStore });
  const pending = await panelStore.load();

  assert.equal(result.event.type, 'panel_selection');
  assert.equal(result.agentResult.actions[0].type, 'adventure_result');
  assert.match(result.messages[0].text, /命运骰结算/);
  assert.equal(calls.some((call) => call.type === 'adventure'), true);
  assert.equal(pending, null);
});

test('panel selection 2 or 3 clears pending panel without adventure execution', async () => {
  const calls = [];
  const panelStore = await tempPanelStore();
  await routeIncomingText({ text: '去异常裂隙探险', pet: createPet(), memoryRepo: memoryRepo(calls), panelStore });

  const result = await routeIncomingText({ text: '2', pet: createPet(), memoryRepo: memoryRepo(calls), panelStore });

  assert.match(result.messages[0].text, /先休息/);
  assert.equal(await panelStore.load(), null);
  assert.equal(calls.some((call) => call.type === 'adventure'), false);
});
