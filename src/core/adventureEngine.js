import { createSeededDice } from './fateDice.js';
import { applyDamage, checkDormancy } from './vitalityEngine.js';

function pickWeighted(items, roll) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = ((roll - 1) % total) + 1;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items.at(-1);
}

function rangedValue(range, roll) {
  const [min, max] = range;
  return min + ((roll - 1) % (max - min + 1));
}

function resolveDamage(map, event, enemy, rolls) {
  if (event.type !== 'attack' && event.type !== 'corruption') {
    return { spiritDamage: 0, fatigueGain: Math.max(1, map.riskLevel), injuryGain: 0 };
  }

  const effects = enemy?.effects ?? {};
  const riskBonus = Math.max(0, map.riskLevel - 1);
  return {
    spiritDamage: effects.spiritDamage ? rangedValue(effects.spiritDamage, rolls.vitality) + riskBonus : riskBonus,
    fatigueGain: effects.fatigueGain ? rangedValue(effects.fatigueGain, rolls.danger) : map.riskLevel * 2,
    injuryGain: effects.injuryGain ? rangedValue(effects.injuryGain, rolls.exploration) : map.riskLevel,
    reason: enemy ? `attacked_by:${enemy.id}` : event.type
  };
}

function resolveRewards(map, event, rolls) {
  if (['treasure', 'artifact', 'memory_shard'].includes(event.type)) {
    const treasure = map.treasures?.[((rolls.treasure - 1) % map.treasures.length)] ?? null;
    return treasure ? [treasure] : [];
  }
  if (rolls.fateTier === 'lucky' || rolls.fateTier === 'miracle') {
    return map.treasures?.slice(0, 1) ?? [];
  }
  return [];
}

export function runAdventure({ pet, mapId, world, seed }) {
  const map = world.maps[mapId];
  if (!map) throw new Error(`unknown map: ${mapId}`);

  const dice = createSeededDice(seed ?? `${pet.id}:${mapId}:${Date.now()}`);
  const rolls = dice.rollAll();
  const event = pickWeighted(map.eventTable, rolls.exploration);
  const enemy = ['attack', 'corruption'].includes(event.type) && map.enemies?.length
    ? map.enemies[(rolls.danger - 1) % map.enemies.length]
    : null;

  const damage = resolveDamage(map, event, enemy, rolls);
  const damaged = applyDamage(pet.vitality, damage);
  const dormancy = checkDormancy(damaged, pet.equipment ?? []);
  const rewards = resolveRewards(map, event, rolls);
  const memory = {
    type: 'adventure_memory',
    title: `${map.name}探险`,
    importance: event.type === 'attack' ? 6 : 4,
    summary: enemy
      ? `灵伴在${map.name}遭遇了${enemy.name}，这次经历会影响它的勇气和谨慎。`
      : `灵伴从${map.name}归来，带回了${rewards.length ? rewards.map((r) => r.name).join('、') : '一小段旅途记忆'}。`
  };

  return {
    petId: pet.id,
    map,
    rolls,
    event: event.type,
    enemy,
    damage,
    rewards,
    vitalityBefore: pet.vitality,
    vitalityAfter: dormancy.state,
    dormancy,
    memories: [memory]
  };
}
