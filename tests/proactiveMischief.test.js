import test from 'node:test';
import assert from 'node:assert/strict';

import { createProactiveIntent, whisperBellAllows } from '../src/core/proactiveEngine.js';
import { createMischiefIntent, safetyGuardAllows } from '../src/core/mischiefEngine.js';

const basePet = {
  id: 'pet_1',
  name: '阿墨',
  emotion: { joy: 60, missing: 20, worry: 0, pride: 10, grievance: 0, curiosity: 70, shyness: 0, fatigue: 10 },
  bond: { points: 80, level: 2, stage: 'attached' },
  vitality: { spirit: 90, fatigue: 10, injury: 0, status: 'healthy' },
  personality: { playfulness: 80, curiosity: 70 }
};

test('createProactiveIntent creates bounded adventure-return intent', () => {
  const intent = createProactiveIntent({ pet: basePet, reason: 'adventure_return', now: '2026-05-17T10:00:00.000Z' });

  assert.equal(intent.type, 'adventure_return');
  assert.equal(intent.pressureRisk, 'low');
  assert.match(intent.messageDraft, /主人/);
});

test('whisperBellAllows blocks proactive messages during quiet hours and over daily cap', () => {
  const intent = createProactiveIntent({ pet: basePet, reason: 'memory_recall', now: '2026-05-17T23:30:00.000Z' });

  assert.equal(whisperBellAllows({ pet: basePet, intent, sentToday: 0, quietHours: { start: 22, end: 8 } }).allowed, false);
  assert.equal(whisperBellAllows({ pet: basePet, intent, sentToday: 1, quietHours: { start: 0, end: 0 } }).allowed, false);
});

test('createMischiefIntent only creates safe self-state/text mischief when playfulness and bond allow it', () => {
  const intent = createMischiefIntent({ pet: basePet, recentMischiefCount: 0 });

  assert.ok(intent);
  assert.equal(intent.scope, 'pet_self_state');
  assert.equal(safetyGuardAllows(intent).allowed, true);
});

test('safetyGuardAllows rejects external or owner-file mischief', () => {
  assert.equal(safetyGuardAllows({ type: 'mischief', scope: 'owner_files', action: 'edit_code' }).allowed, false);
  assert.equal(safetyGuardAllows({ type: 'mischief', scope: 'external_posting', action: 'create_issue' }).allowed, false);
});
