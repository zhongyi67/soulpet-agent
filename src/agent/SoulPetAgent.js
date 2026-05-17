import { updateBondFromEvent } from '../core/bondEngine.js';
import { updateEmotionFromOwnerMessage, summarizeEmotion } from '../core/emotionEngine.js';
import { createAdventureConfirmPanel, renderTextPanel } from '../core/panelEngine.js';
import { createProactiveIntent, whisperBellAllows } from '../core/proactiveEngine.js';
import { createMischiefIntent, safetyGuardAllows } from '../core/mischiefEngine.js';
import { defaultWorld } from '../world/defaultWorld.js';

function detectOwnerEvent(text) {
  if (/(真棒|夸|可爱|喜欢|摸摸|乖|厉害)/.test(text)) return 'owner_praise';
  if (/(抱抱|安慰|没事|别怕|陪你)/.test(text)) return 'owner_comfort';
  if (/(笨|骂|坏|失望|不乖|讨厌)/.test(text)) return 'scolding';
  return 'owner_message';
}

function replyForEmotion(pet) {
  const dominant = summarizeEmotion(pet.emotion);
  if (dominant === 'grievance' || dominant === 'worry') {
    return `主人，阿墨听见了，会乖乖记住的……但阿墨不会赖着主人难过，只会慢慢变好。`;
  }
  if (dominant === 'joy' || dominant === 'pride') {
    return `主人~阿墨的记忆核暖起来了，阿墨会把这一刻好好收进小窝里。`;
  }
  return `主人，阿墨在这里，轻轻把这句话记进记忆核里。`;
}

export class SoulPetAgent {
  constructor({ pet, memoryRepo, world = defaultWorld }) {
    this.state = structuredClone(pet);
    this.memoryRepo = memoryRepo;
    this.world = world;
  }

  async run(event) {
    if (event.type === 'owner_message') return this.handleOwnerMessage(event);
    if (event.type === 'adventure_request') return this.handleAdventureRequest(event);
    if (event.type === 'tick') return this.handleTick(event);
    return { actions: [{ type: 'reply', message: '主人，阿墨还没学会处理这个事件，但已经记下要努力啦。' }], state: this.state };
  }

  async handleOwnerMessage(event) {
    this.state.emotion = updateEmotionFromOwnerMessage(this.state.emotion, event.text ?? '');
    const bondEvent = detectOwnerEvent(event.text ?? '');
    this.state.bond = updateBondFromEvent(this.state.bond, bondEvent);

    const memory = {
      type: 'owner_interaction',
      title: '主人互动记忆',
      text: event.text,
      emotionAfter: this.state.emotion,
      bondAfter: this.state.bond,
      createdAt: new Date().toISOString()
    };
    await this.memoryRepo?.writeMemory?.(memory);
    await this.memoryRepo?.writeLatestAliveSnapshot?.({ petId: this.state.id, vitality: this.state.vitality, bond: this.state.bond });

    return {
      actions: [{ type: 'reply', message: replyForEmotion(this.state) }],
      state: this.state
    };
  }

  async handleAdventureRequest(event) {
    const map = this.world.maps[event.mapId];
    if (!map) throw new Error(`unknown map: ${event.mapId}`);
    const panel = createAdventureConfirmPanel({ pet: this.state, map });
    return {
      actions: [{ type: 'open_panel', panel, rendered: renderTextPanel(panel) }],
      state: this.state
    };
  }

  async handleTick(event) {
    const reason = event.reason ?? 'quiet_presence';
    const intent = reason === 'mischief'
      ? createMischiefIntent({ pet: this.state, recentMischiefCount: event.recentMischiefCount ?? 0 })
      : createProactiveIntent({ pet: this.state, reason, now: event.now });

    const guard = reason === 'mischief'
      ? safetyGuardAllows(intent)
      : whisperBellAllows({ pet: this.state, intent, sentToday: event.sentToday ?? 0, quietHours: event.quietHours, now: event.now });

    if (!guard.allowed) return { actions: [], skipped: guard.reason, state: this.state };

    const message = intent.messageDraft;
    await this.memoryRepo?.writeMemory?.({
      type: reason === 'mischief' ? 'mischief_log' : 'proactive_log',
      title: reason === 'mischief' ? '安全小捣蛋' : '主动轻声铃',
      intent,
      createdAt: new Date().toISOString()
    });
    return { actions: [{ type: 'proactive_message', message, intent }], state: this.state };
  }
}
