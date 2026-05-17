export const defaultWorld = {
  maps: {
    crescent_courtyard: {
      id: 'crescent_courtyard',
      name: '新月庭院',
      riskLevel: 0,
      eventTable: [
        { type: 'safe_return', weight: 60 },
        { type: 'treasure', weight: 25 },
        { type: 'memory_shard', weight: 15 }
      ],
      treasures: [
        {
          id: 'moon_white_pebble',
          name: '月白石子',
          rarity: 'common',
          category: 'nest',
          lore: '第一次短途探险常见的小石子，摸起来像温柔的月光。',
          effects: []
        }
      ],
      enemies: []
    },
    anomaly_rift: {
      id: 'anomaly_rift',
      name: '异常裂隙',
      riskLevel: 4,
      eventTable: [
        { type: 'attack', weight: 80 },
        { type: 'corruption', weight: 10 },
        { type: 'artifact', weight: 10 }
      ],
      treasures: [
        {
          id: 'rift_crystal',
          name: '裂隙碎晶',
          rarity: 'epic',
          category: 'evolution',
          lore: '危险裂隙中凝出的碎晶，可能引向特殊进化。',
          effects: [{ type: 'evolution_signal', value: 'rift_touched' }]
        }
      ],
      enemies: [
        {
          id: 'rift_guardian',
          name: '裂隙守卫',
          attackType: 'spirit',
          basePower: 80,
          effects: {
            spiritDamage: [12, 24],
            fatigueGain: [10, 25],
            injuryGain: [15, 30],
            emotionChanges: { worry: 8, courage: 2 }
          }
        }
      ]
    }
  }
};
