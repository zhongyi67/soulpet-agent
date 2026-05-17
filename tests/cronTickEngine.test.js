import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldEmitTickMessage, markProactiveSent } from '../src/core/cronTickEngine.js';

test('shouldEmitTickMessage stays silent when proactive interval has not elapsed', () => {
  const state = { lastProactiveAt: '2026-01-01T00:00:00.000Z', proactiveIntervalMinutes: 180 };

  assert.equal(shouldEmitTickMessage({ state, now: '2026-01-01T01:00:00.000Z' }), false);
});

test('shouldEmitTickMessage allows message when proactive interval elapsed', () => {
  const state = { lastProactiveAt: '2026-01-01T00:00:00.000Z', proactiveIntervalMinutes: 180 };

  assert.equal(shouldEmitTickMessage({ state, now: '2026-01-01T03:00:01.000Z' }), true);
});

test('markProactiveSent records send time and daily count', () => {
  const state = { sentToday: { date: '2026-01-01', count: 1 } };

  const updated = markProactiveSent({ state, now: '2026-01-01T03:00:01.000Z' });

  assert.equal(updated.lastProactiveAt, '2026-01-01T03:00:01.000Z');
  assert.deepEqual(updated.sentToday, { date: '2026-01-01', count: 2 });
});

test('markProactiveSent resets daily count on a new date', () => {
  const state = { sentToday: { date: '2026-01-01', count: 5 } };

  const updated = markProactiveSent({ state, now: '2026-01-02T00:00:01.000Z' });

  assert.deepEqual(updated.sentToday, { date: '2026-01-02', count: 1 });
});
