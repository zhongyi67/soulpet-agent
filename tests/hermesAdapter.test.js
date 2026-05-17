import test from 'node:test';
import assert from 'node:assert/strict';

import { HermesSoulPetAdapter, buildHermesProfileDraft } from '../src/adapters/hermesAdapter.js';

test('HermesSoulPetAdapter renders SoulPet reply actions into 宿主 text messages', () => {
  const adapter = new HermesSoulPetAdapter({ source: 'cli' });
  const messages = adapter.renderActions([
    { type: 'reply', message: '主人~阿墨记住啦。' },
    { type: 'proactive_message', message: '主人~阿墨回来了。' }
  ]);

  assert.deepEqual(messages, [
    { channel: 'origin', source: 'cli', text: '主人~阿墨记住啦。', metadata: { soulpetActionType: 'reply' } },
    { channel: 'origin', source: 'cli', text: '主人~阿墨回来了。', metadata: { soulpetActionType: 'proactive_message' } }
  ]);
});

test('HermesSoulPetAdapter renders panels as text without executing risky choices', () => {
  const adapter = new HermesSoulPetAdapter({ source: 'cli' });
  const messages = adapter.renderActions([
    { type: 'open_panel', rendered: '【异常裂隙探险面板】\n1. 允许出发\n2. 先休息', panel: { id: 'panel_1' } }
  ]);

  assert.equal(messages[0].text, '【异常裂隙探险面板】\n1. 允许出发\n2. 先休息');
  assert.equal(messages[0].metadata.requiresOwnerChoice, true);
});

test('buildHermesProfileDraft includes soulpet boundary and minimal toolsets', () => {
  const draft = buildHermesProfileDraft({ profileName: 'soulpet', workdir: '/path/to/soulpet' });

  assert.equal(draft.profileName, 'soulpet');
  assert.match(draft.systemPrompt, /灵伴系统/);
  assert.match(draft.systemPrompt, /不能越权/);
  assert.deepEqual(draft.recommendedToolsets, ['file', 'terminal', 'cronjob']);
  assert.equal(draft.workdir, '/path/to/soulpet');
});
