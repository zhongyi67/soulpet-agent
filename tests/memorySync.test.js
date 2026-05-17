import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { listLocalMemoryFiles, syncLocalMemoryToGitHub } from '../src/core/memorySync.js';

test('listLocalMemoryFiles returns json and markdown files with stable relative paths', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'soulpet-sync-'));
  await fs.mkdir(path.join(root, 'memories', 'events'), { recursive: true });
  await fs.writeFile(path.join(root, 'system.json'), '{"ok":true}', 'utf8');
  await fs.writeFile(path.join(root, 'memories', 'events', 'a.md'), '# hello', 'utf8');
  await fs.writeFile(path.join(root, 'ignore.tmp'), 'nope', 'utf8');

  const files = await listLocalMemoryFiles(root);

  assert.deepEqual(files.map((file) => file.relativePath), ['memories/events/a.md', 'system.json']);
});

test('syncLocalMemoryToGitHub uploads local demo memory into imported namespace', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'soulpet-sync-'));
  await fs.mkdir(path.join(root, 'memories'), { recursive: true });
  await fs.writeFile(path.join(root, 'memories', 'one.json'), '{"type":"memory"}', 'utf8');

  const uploads = [];
  const repo = {
    async uploadText(filePath, text, message) {
      uploads.push({ filePath, text, message });
    }
  };

  const result = await syncLocalMemoryToGitHub({ localRoot: root, repo, destinationPrefix: 'imported/demo' });

  assert.equal(result.uploaded, 1);
  assert.equal(uploads[0].filePath, 'imported/demo/memories/one.json');
  assert.equal(uploads[0].text, '{"type":"memory"}');
  assert.match(uploads[0].message, /sync local memory/);
});
