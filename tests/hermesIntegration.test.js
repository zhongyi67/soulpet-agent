import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCronCreateCommand, buildProfileCreateCommand, createHermesIntegrationPlan } from '../src/adapters/hermesIntegration.js';

test('buildProfileCreateCommand creates a cloned soulpet 分身配置 command', () => {
  assert.deepEqual(buildProfileCreateCommand({ profileName: 'soulpet' }), ['hermes', 'profile', 'create', 'soulpet', '--clone']);
});

test('buildCronCreateCommand schedules SoulPet tick back to origin', () => {
  const command = buildCronCreateCommand({ schedule: 'every 2h', workdir: '/path/to/soulpet' });

  assert.equal(command[0], 'hermes');
  assert.ok(command.includes('cron'));
  assert.ok(command.includes('every 2h'));
  assert.ok(command.join(' ').includes('npm run demo -- tick quiet_presence'));
  assert.ok(command.includes('/path/to/soulpet'));
});

test('createHermesIntegrationPlan includes manual commands and non-destructive notes', () => {
  const plan = createHermesIntegrationPlan({ profileName: 'soulpet', workdir: '/path/to/soulpet' });

  assert.equal(plan.profileName, 'soulpet');
  assert.ok(plan.commands.some((cmd) => cmd.join(' ').includes('profile create soulpet')));
  assert.ok(plan.commands.some((cmd) => cmd.join(' ').includes('cron create')));
  assert.match(plan.notes.join('\n'), /不会自动重启网关/);
});
