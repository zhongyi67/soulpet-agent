import test from 'node:test';
import assert from 'node:assert/strict';

import { createDueTickEvents, Inbox } from '../src/core/daemonEngine.js';

test('createDueTickEvents creates proactive tick when enough time elapsed', () => {
  const events = createDueTickEvents({
    state: { lastProactiveAt: '2026-05-17T08:00:00.000Z', proactiveIntervalMinutes: 60 },
    now: '2026-05-17T10:00:00.000Z'
  });

  assert.deepEqual(events, [{ type: 'tick', reason: 'quiet_presence', now: '2026-05-17T10:00:00.000Z' }]);
});

test('Inbox stores panel/action items until owner handles them', () => {
  const inbox = new Inbox();
  inbox.add({ type: 'panel', title: '异常裂隙救援' });
  inbox.add({ type: 'tool_permission', title: '网页蛛丝' });

  assert.equal(inbox.pending().length, 2);
  inbox.resolve(inbox.pending()[0].id);
  assert.equal(inbox.pending().length, 1);
});
