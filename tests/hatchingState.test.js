import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { hatchSoulPet } from '../src/core/hatchingEngine.js';
import { StateStore } from '../src/core/stateStore.js';

test('hatchSoulPet creates unique starter pet with first memory and owner anchor', () => {
  const pet = hatchSoulPet({ owner: '道友', petName: '阿墨', seed: 'demo-owner' });

  assert.equal(pet.owner.name, '道友');
  assert.equal(pet.name, '阿墨');
  assert.equal(pet.bond.stage, 'firstBond');
  assert.equal(pet.vitality.spirit, 100);
  assert.ok(pet.memories.some((memory) => memory.level === 'first_memory'));
  assert.ok(pet.memories.some((memory) => memory.level === 'owner_anchor'));
});

test('StateStore saves and loads pet state as JSON', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'soulpet-state-'));
  const store = new StateStore(path.join(dir, 'state.json'));
  const pet = hatchSoulPet({ owner: '道友', petName: '阿墨', seed: 'state-demo' });

  await store.save(pet);
  const loaded = await store.load();

  assert.equal(loaded.id, pet.id);
  assert.equal(loaded.name, '阿墨');
});
