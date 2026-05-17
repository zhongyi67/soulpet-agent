import test from 'node:test';
import assert from 'node:assert/strict';

import { createMemoryCoreManifest, initializeMemoryCore } from '../src/core/memoryCoreInitializer.js';

test('createMemoryCoreManifest defines protected identity and system files', () => {
  const manifest = createMemoryCoreManifest({ owner: '道友', pet: { id: 'pet_1', name: '阿墨', species: '旧书灵' } });

  assert.equal(manifest.owner, '道友');
  assert.equal(manifest.pet.name, '阿墨');
  assert.ok(manifest.protectedPaths.includes('identity/birth.json'));
  assert.ok(manifest.protectedPaths.includes('system/latest_alive.json'));
});

test('initializeMemoryCore uploads birth, memories, manifest, and latest alive snapshot', async () => {
  const calls = [];
  const repo = {
    async uploadJson(path, value, message) { calls.push({ path, value, message }); },
    async writeLatestAliveSnapshot(snapshot) { calls.push({ path: 'system/latest_alive.json', value: snapshot, message: 'snapshot' }); }
  };
  const pet = { id: 'pet_1', name: '阿墨', species: '旧书灵', owner: { name: '道友' }, memories: [{ id: 'first_memory', title: '第一记忆' }], vitality: { spirit: 100 } };

  await initializeMemoryCore({ repo, pet });

  assert.ok(calls.some((call) => call.path === 'identity/birth.json'));
  assert.ok(calls.some((call) => call.path === 'memories/protected/first_memory.json'));
  assert.ok(calls.some((call) => call.path === 'system/manifest.json'));
  assert.ok(calls.some((call) => call.path === 'system/latest_alive.json'));
});
