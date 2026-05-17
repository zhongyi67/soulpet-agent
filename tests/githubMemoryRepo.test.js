import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreateRepoCommand, buildPutFileCommand, GitHubMemoryRepo } from '../src/core/githubMemoryRepo.js';

test('buildCreateRepoCommand creates private gh repo command without executing', () => {
  assert.deepEqual(buildCreateRepoCommand({ repoName: 'soulpet-memory-demo' }), [
    'gh', 'repo', 'create', 'soulpet-memory-demo', '--private', '--description', '灵伴私有记忆核', '--disable-wiki'
  ]);
});

test('buildPutFileCommand targets GitHub contents API path', () => {
  const command = buildPutFileCommand({ owner: 'demo-owner', repo: 'soulpet-memory-demo', filePath: 'identity/birth.json' });

  assert.equal(command[0], 'gh');
  assert.equal(command[1], 'api');
  assert.match(command[2], /repos\/demo-owner\/soulpet-memory-demo\/contents\/identity%2Fbirth\.json/);
  assert.ok(command.includes('-X'));
  assert.ok(command.includes('PUT'));
});

test('GitHubMemoryRepo uploadJson uses injected runner and base64 payload', async () => {
  const calls = [];
  const repo = new GitHubMemoryRepo({
    owner: 'demo-owner',
    repo: 'soulpet-memory-demo',
    runner: async (command, input) => {
      calls.push({ command, input });
      if (command.join(' ').includes('?ref=main')) throw new Error('Not Found');
      return { stdout: '{}', stderr: '', code: 0 };
    }
  });

  await repo.uploadJson('identity/birth.json', { name: '阿墨' }, 'birth soulpet');

  assert.equal(calls.length, 2);
  assert.match(calls[1].command.join(' '), /contents\/identity%2Fbirth\.json/);
  const payload = JSON.parse(calls[1].input);
  assert.equal(payload.message, 'birth soulpet');
  assert.equal(Buffer.from(payload.content, 'base64').toString('utf8'), JSON.stringify({ name: '阿墨' }, null, 2));
});
