import { getDailyProactiveLimit } from './bondEngine.js';

function hourOf(iso) {
  return new Date(iso).getUTCHours();
}

function inQuietHours(hour, quietHours) {
  if (!quietHours || quietHours.start === quietHours.end) return false;
  const { start, end } = quietHours;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function createProactiveIntent({ pet, reason, now = new Date().toISOString() }) {
  const type = reason ?? 'quiet_presence';
  const messageByReason = {
    adventure_return: `主人~${pet.name}从外面回来了，爪爪上还带着一点星尘。`,
    memory_recall: `主人，${pet.name}刚刚想起了一枚小小的记忆晶片，想轻轻给你看看。`,
    mischief: `主人，${pet.name}刚刚把小窝里的月白石子偷偷摆成了你的名字。`,
    quiet_presence: `主人，${pet.name}在小窝里安静亮着灯，不吵你。`
  };
  return {
    id: `intent_${Date.parse(now)}_${type}`,
    petId: pet.id,
    type,
    reason: type,
    importance: type === 'adventure_return' ? 7 : 4,
    emotion: pet.emotion,
    bondRequired: type === 'mischief' ? 'attached' : 'firstBond',
    requiresReply: false,
    pressureRisk: 'low',
    messageDraft: messageByReason[type] ?? messageByReason.quiet_presence,
    createdAt: now
  };
}

export function whisperBellAllows({ pet, intent, sentToday = 0, quietHours = { start: 22, end: 8 }, now = intent?.createdAt ?? new Date().toISOString() }) {
  if (!intent) return { allowed: false, reason: 'no_intent' };
  const limit = getDailyProactiveLimit(pet.bond ?? {});
  if (sentToday >= limit) return { allowed: false, reason: 'daily_limit' };
  if (inQuietHours(hourOf(now), quietHours)) return { allowed: false, reason: 'quiet_hours' };
  if (intent.pressureRisk === 'high') return { allowed: false, reason: 'pressure_risk' };
  if (pet.vitality?.status === 'dormant') return { allowed: false, reason: 'dormant' };
  return { allowed: true, reason: 'allowed' };
}
