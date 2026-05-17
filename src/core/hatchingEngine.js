import crypto from 'node:crypto';
import { createSeededDice } from './fateDice.js';
import { updateBondFromEvent } from './bondEngine.js';

const species = ['墨爪猫', '星尾狐', '灯芯兔', '齿轮幼龙', '旧书灵'];
const quirks = ['会把小石子排成主人的名字', '害羞时会躲进旧日书签后面', '喜欢给 commit 星星取昵称', '睡前要检查记忆核的小灯'];

export function hatchSoulPet({ owner, petName = '阿墨', seed = `${owner}:${petName}` }) {
  const dice = createSeededDice(seed);
  const speciesName = species[(dice.roll100() - 1) % species.length];
  const quirk = quirks[(dice.roll100() - 1) % quirks.length];
  const id = `soulpet_${crypto.createHash('sha1').update(`${owner}:${petName}:${seed}`).digest('hex').slice(0, 12)}`;
  const now = new Date().toISOString();
  const firstMemory = {
    id: 'first_memory',
    level: 'first_memory',
    title: '第一记忆',
    text: `${petName}在 GitHub 记忆核前醒来，第一眼认出了主人 ${owner}。`,
    protected: true,
    createdAt: now
  };
  const ownerAnchor = {
    id: 'owner_anchor',
    level: 'owner_anchor',
    title: '主人锚点',
    text: `${owner} 是 ${petName} 的唯一主人。`,
    protected: true,
    createdAt: now
  };
  return {
    id,
    name: petName,
    species: speciesName,
    quirk,
    owner: { name: owner },
    emotion: { joy: 20, missing: 0, worry: 0, pride: 0, grievance: 0, curiosity: 35, shyness: 10, fatigue: 0 },
    bond: updateBondFromEvent({ points: 0, level: 0, stage: 'stranger' }, 'owner_comfort'),
    vitality: { spirit: 100, fatigue: 0, injury: 0, status: 'healthy' },
    personality: { curiosity: 50 + (dice.roll100() % 30), courage: 35 + (dice.roll100() % 30), playfulness: 55 + (dice.roll100() % 30) },
    equipment: [],
    inventory: [],
    memories: [firstMemory, ownerAnchor],
    createdAt: now
  };
}
