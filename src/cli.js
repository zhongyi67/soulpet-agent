#!/usr/bin/env node
import path from 'node:path';
import os from 'node:os';

import { runAdventure } from './core/adventureEngine.js';
import { createAdventureConfirmPanel, renderTextPanel } from './core/panelEngine.js';
import { LocalMemoryRepo } from './core/memoryRepo.js';
import { defaultWorld } from './world/defaultWorld.js';
import { hatchSoulPet } from './core/hatchingEngine.js';
import { StateStore } from './core/stateStore.js';
import { SoulPetAgent } from './agent/SoulPetAgent.js';
import { routeIncomingText } from './adapters/messageBridge.js';
import { PendingPanelStore } from './core/pendingPanelStore.js';
import { GitHubMemoryRepo } from './core/githubMemoryRepo.js';
import { initializeMemoryCore } from './core/memoryCoreInitializer.js';
import { syncLocalMemoryToGitHub } from './core/memorySync.js';
import { shouldEmitTickMessage, getSentTodayCount, markProactiveSent } from './core/cronTickEngine.js';

const command = process.argv[2] ?? 'demo';
const statePath = path.join(os.homedir(), '.soulpet-agent', 'state.json');
const pendingPanelPath = path.join(os.homedir(), '.soulpet-agent', 'pending-panel.json');
const store = new StateStore(statePath);
const panelStore = new PendingPanelStore(pendingPanelPath);

function demoPet(mapId) {
  return {
    id: 'soulpet-demo',
    name: '阿墨',
    emotion: { joy: 20, missing: 0, worry: 0, pride: 0, grievance: 0, curiosity: 35, shyness: 10, fatigue: 0 },
    vitality: { spirit: mapId === 'anomaly_rift' ? 8 : 100, fatigue: mapId === 'anomaly_rift' ? 80 : 0, injury: mapId === 'anomaly_rift' ? 70 : 0, status: mapId === 'anomaly_rift' ? 'critical' : 'healthy' },
    personality: { curiosity: 70, courage: 55, playfulness: 82 },
    bond: { points: 80, level: 2, stage: 'attached' },
    equipment: mapId === 'anomaly_rift' ? [{ id: 'heart_guard_stone', effects: [{ type: 'prevent_dormancy_once' }] }] : []
  };
}

async function loadOrDemoPet(mapId = 'crescent_courtyard') {
  if (await store.exists()) return store.load();
  return demoPet(mapId);
}

async function runAdventureDemo(mapId) {
  const pet = await loadOrDemoPet(mapId);
  const map = defaultWorld.maps[mapId];
  if (!map) throw new Error(`Unknown map: ${mapId}`);

  console.log(renderTextPanel(createAdventureConfirmPanel({ pet, map })));
  console.log('\n--- 命运骰结算 ---');

  const result = runAdventure({ pet, mapId, world: defaultWorld, seed: `demo:${mapId}` });
  console.log(JSON.stringify({
    event: result.event,
    enemy: result.enemy?.name ?? null,
    rewards: result.rewards.map((reward) => reward.name),
    vitalityBefore: result.vitalityBefore,
    vitalityAfter: result.vitalityAfter,
    dormancy: result.dormancy,
    memory: result.memories[0]
  }, null, 2));

  const repoDir = path.join(os.homedir(), '.soulpet-demo-memory');
  const repo = new LocalMemoryRepo(repoDir);
  await repo.writeAdventureResult(result);
  await repo.writeLatestAliveSnapshot({ petId: pet.id, vitality: result.vitalityAfter });
  console.log(`\n已写入本地 GitHub 记忆仓库模拟目录：${repoDir}`);
}

if (command === 'hatch') {
  const owner = process.argv[3] ?? '道友';
  const petName = process.argv[4] ?? '阿墨';
  const pet = hatchSoulPet({ owner, petName, seed: `${owner}:${petName}` });
  await store.save(pet);
  const repo = new LocalMemoryRepo(path.join(os.homedir(), '.soulpet-demo-memory'));
  for (const memory of pet.memories) await repo.writeMemory(memory);
  await repo.writeLatestAliveSnapshot({ petId: pet.id, vitality: pet.vitality, bond: pet.bond });
  console.log(`孵化完成：${pet.name}（${pet.species}）`);
  console.log(`状态已保存：${statePath}`);
} else if (command === 'say') {
  const text = process.argv.slice(3).join(' ') || '阿墨真棒，主人摸摸你';
  const pet = await loadOrDemoPet();
  const repo = new LocalMemoryRepo(path.join(os.homedir(), '.soulpet-demo-memory'));
  const result = await routeIncomingText({ text, pet, memoryRepo: repo, source: 'cli', panelStore });
  if (result.agentResult?.state) await store.save(result.agentResult.state);
  console.log(result.messages.map((message) => message.text).join('\n'));
} else if (command === 'tick') {
  const reason = process.argv[3] ?? 'adventure_return';
  const pet = await loadOrDemoPet();
  const repo = new LocalMemoryRepo(path.join(os.homedir(), '.soulpet-demo-memory'));
  const agent = new SoulPetAgent({ pet, memoryRepo: repo });
  const result = await agent.run({ type: 'tick', reason, sentToday: 0, quietHours: { start: 0, end: 0 }, now: new Date().toISOString() });
  console.log(result.actions.map((action) => action.message).join('\n') || `轻声铃没有响：${result.skipped}`);
} else if (command === 'cron-tick') {
  const now = new Date().toISOString();
  const pet = await loadOrDemoPet();
  if (!shouldEmitTickMessage({ state: pet, now })) process.exit(0);

  const repo = new LocalMemoryRepo(path.join(os.homedir(), '.soulpet-demo-memory'));
  const agent = new SoulPetAgent({ pet, memoryRepo: repo });
  const sentToday = getSentTodayCount({ state: pet, now });
  const result = await agent.run({ type: 'tick', reason: 'quiet_presence', sentToday, quietHours: { start: 22, end: 8 }, now });

  if (!result.actions.length) process.exit(0);

  const updated = markProactiveSent({ state: result.state, now });
  await store.save(updated);
  await repo.writeLatestAliveSnapshot({ petId: updated.id, vitality: updated.vitality, bond: updated.bond, lastProactiveAt: updated.lastProactiveAt, sentToday: updated.sentToday });
  console.log(result.actions.map((action) => action.message).join('\n'));
} else if (command === 'sync-github') {
  const owner = process.argv[3] ?? 'demo-owner';
  const repoName = process.argv[4] ?? 'soulpet-memory-demo-demo';
  const pet = await loadOrDemoPet();
  const repo = new GitHubMemoryRepo({ owner, repo: repoName });
  await initializeMemoryCore({ repo, pet });
  const localRoot = path.join(os.homedir(), '.soulpet-demo-memory');
  const syncResult = await syncLocalMemoryToGitHub({ localRoot, repo, destinationPrefix: 'imported/demo-memory' });
  console.log(`GitHub 记忆核已同步：${owner}/${repoName}`);
  console.log(`同步本地记忆文件：${syncResult.uploaded}`);
} else if (command === 'demo' || command === 'adventure') {
  await runAdventureDemo(process.argv[3] ?? 'crescent_courtyard');
} else {
  console.error('Usage: npm run demo -- [hatch OWNER PET_NAME | say TEXT | tick REASON | cron-tick | sync-github OWNER REPO | adventure MAP]');
  process.exit(1);
}
