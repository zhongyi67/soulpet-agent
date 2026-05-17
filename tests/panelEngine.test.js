import test from 'node:test';
import assert from 'node:assert/strict';

import { createAdventureConfirmPanel, renderTextPanel } from '../src/core/panelEngine.js';
import { defaultWorld } from '../src/world/defaultWorld.js';

test('createAdventureConfirmPanel exposes risk, vitality, rewards, dangers, and choices', () => {
  const pet = { name: '阿墨', vitality: { spirit: 62, fatigue: 48, injury: 0, status: 'healthy' }, equipment: [] };

  const panel = createAdventureConfirmPanel({ pet, map: defaultWorld.maps.anomaly_rift });

  assert.equal(panel.type, 'adventure_confirm');
  assert.equal(panel.title, '异常裂隙探险面板');
  assert.ok(panel.sections.some((section) => section.title === '当前状态'));
  assert.ok(panel.actions.some((action) => action.value === 'adventure:start:anomaly_rift'));
  assert.ok(panel.actions.some((action) => action.value === 'adventure:cancel'));
});

test('renderTextPanel renders numbered actions for any chat host', () => {
  const panel = {
    title: '测试面板',
    petLine: '主人，我可以出发吗？',
    sections: [{ title: '风险', lines: ['高危'] }],
    actions: [
      { label: '出发', value: 'go' },
      { label: '不去了', value: 'cancel' }
    ]
  };

  const text = renderTextPanel(panel);

  assert.match(text, /【测试面板】/);
  assert.match(text, /1\. 出发/);
  assert.match(text, /2\. 不去了/);
});
