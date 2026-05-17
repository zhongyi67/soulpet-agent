const forbiddenScopes = new Set(['owner_files', 'external_posting', 'host_config', 'shell', 'paid_api']);

export function createMischiefIntent({ pet, recentMischiefCount = 0 }) {
  const playfulness = pet.personality?.playfulness ?? 0;
  const stage = pet.bond?.stage ?? 'stranger';
  const fatigue = pet.emotion?.fatigue ?? pet.vitality?.fatigue ?? 0;
  const grievance = pet.emotion?.grievance ?? 0;
  if (playfulness < 70) return null;
  if (!['attached', 'companion', 'guardian', 'soulbound'].includes(stage)) return null;
  if (fatigue >= 70 || grievance >= 60) return null;
  if (recentMischiefCount >= 2) return null;

  return {
    id: `mischief_${Date.now()}`,
    type: 'mischief',
    scope: 'pet_self_state',
    action: 'rearrange_nest_pebbles',
    messageDraft: `主人~${pet.name}把小窝里的月白石子摆成了你的名字，假装什么都没发生。`,
    memory: '一次安全的小捣蛋：灵伴只改变了自己的灵巢状态。'
  };
}

export function safetyGuardAllows(intent) {
  if (!intent) return { allowed: false, reason: 'no_intent' };
  if (forbiddenScopes.has(intent.scope)) return { allowed: false, reason: 'forbidden_scope' };
  if (['edit_code', 'create_issue', 'external_message', 'install_tool', 'delete_file'].includes(intent.action)) {
    return { allowed: false, reason: 'forbidden_action' };
  }
  return { allowed: true, reason: 'allowed' };
}
