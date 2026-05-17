import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { LocalMemoryRepo } from '../src/core/memoryRepo.js';

test('LocalMemoryRepo writes adventure logs and latest alive snapshot', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'soulpet-memory-demo-'));
  const repo = new LocalMemoryRepo(dir);

  await repo.writeAdventureResult({
    id: 'adv_1',
    map: { id: 'crescent_courtyard', name: '新月庭院' },
    event: 'treasure',
    vitalityAfter: { spirit: 98, fatigue: 2, injury: 0, status: 'healthy' },
    memories: [{ title: '第一次新月庭院探险', summary: '带回月白石子。' }]
  });

  await repo.writeLatestAliveSnapshot({ petId: 'pet_1', vitality: { spirit: 98 } });

  const files = await fs.readdir(path.join(dir, 'adventures'));
  assert.ok(files.some((file) => file.endsWith('.json')));

  const snapshot = JSON.parse(await fs.readFile(path.join(dir, 'system', 'latest_alive.json'), 'utf8'));
  assert.equal(snapshot.petId, 'pet_1');
});
