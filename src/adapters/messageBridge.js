import { SoulPetAgent } from '../agent/SoulPetAgent.js';
import { runAdventure } from '../core/adventureEngine.js';
import { defaultWorld } from '../world/defaultWorld.js';
import { HermesSoulPetAdapter } from './hermesAdapter.js';

export function parseOwnerSelection(text) {
  const trimmed = String(text ?? '').trim();
  if (/^[1-9]\d*$/.test(trimmed)) return { type: 'panel_selection', choice: Number(trimmed) };
  return null;
}

function inferEventFromText(text) {
  const selection = parseOwnerSelection(text);
  if (selection) return selection;
  if (/探险|异常裂隙|新月庭院|雾林/.test(text)) {
    const mapId = /异常裂隙/.test(text) ? 'anomaly_rift' : 'crescent_courtyard';
    return { type: 'adventure_request', mapId };
  }
  return { type: 'owner_message', text };
}

function renderAdventureResult(result) {
  const rewards = result.rewards.length ? result.rewards.map((reward) => reward.name).join('、') : '没有获得物品';
  const enemy = result.enemy ? `\n遭遇：${result.enemy.name}` : '';
  return [
    '--- 命运骰结算 ---',
    `地点：${result.map.name}`,
    `事件：${result.event}${enemy}`,
    `命运：${result.rolls.fateTier}（${result.rolls.fate}）`,
    `获得：${rewards}`,
    `灵息：${result.vitalityBefore.spirit} → ${result.vitalityAfter.spirit}`,
    `状态：${result.vitalityAfter.status}`,
    `记忆：${result.memories[0].summary}`
  ].join('\n');
}

async function handlePanelSelection({ event, pet, memoryRepo, panelStore, source }) {
  const pending = panelStore ? await panelStore.load() : null;
  if (!pending) {
    return {
      event,
      agentResult: { actions: [] },
      messages: [{ channel: 'origin', source, text: '主人，现在没有待处理面板哦~', metadata: { soulpetActionType: 'panel_selection', requiresOwnerChoice: false } }]
    };
  }

  await panelStore.clear();
  if (event.choice === 1 && pending.type === 'adventure_request') {
    const result = runAdventure({ pet, mapId: pending.mapId, world: defaultWorld, seed: `${pet.id}:${pending.mapId}:${pending.createdAt}` });
    if (memoryRepo?.writeAdventureResult) await memoryRepo.writeAdventureResult(result);
    if (memoryRepo?.writeLatestAliveSnapshot) await memoryRepo.writeLatestAliveSnapshot({ petId: pet.id, vitality: result.vitalityAfter });
    const updatedPet = { ...pet, vitality: result.vitalityAfter, inventory: [...(pet.inventory ?? []), ...result.rewards] };
    const action = { type: 'adventure_result', result, message: renderAdventureResult(result) };
    return {
      event,
      agentResult: { actions: [action], state: updatedPet },
      messages: [{ channel: 'origin', source, text: action.message, metadata: { soulpetActionType: 'adventure_result', requiresOwnerChoice: false } }]
    };
  }

  const text = event.choice === 2
    ? '好呀主人，阿墨先休息，等灵息更稳一点再出发。'
    : '好哒主人，阿墨把这次探险取消啦。';
  return {
    event,
    agentResult: { actions: [{ type: 'panel_cancelled', message: text }], state: pet },
    messages: [{ channel: 'origin', source, text, metadata: { soulpetActionType: 'panel_cancelled', requiresOwnerChoice: false } }]
  };
}

export async function routeIncomingText({ text, pet, memoryRepo, source = 'cli', panelStore = null }) {
  const event = inferEventFromText(text);
  const adapter = new HermesSoulPetAdapter({ source });
  if (event.type === 'panel_selection') return handlePanelSelection({ event, pet, memoryRepo, panelStore, source });
  const agent = new SoulPetAgent({ pet, memoryRepo });
  const agentResult = await agent.run(event);
  if (event.type === 'adventure_request' && panelStore) {
    await panelStore.save({ type: 'adventure_request', mapId: event.mapId, createdAt: new Date().toISOString() });
  }
  return { event, agentResult, messages: adapter.renderActions(agentResult.actions) };
}
