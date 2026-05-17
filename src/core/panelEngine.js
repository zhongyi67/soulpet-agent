export function createAdventureConfirmPanel({ pet, map }) {
  const treasureNames = map.treasures?.map((treasure) => treasure.name).join('、') || '未知小物';
  const enemyNames = map.enemies?.map((enemy) => enemy.name).join('、') || '无明显敌人';
  return {
    id: `panel_adventure_${map.id}`,
    type: 'adventure_confirm',
    title: `${map.name}探险面板`,
    petLine: `${pet.name ?? '灵伴'}抬头看着主人：这里可能有危险，也可能有让我变强的东西。`,
    priority: map.riskLevel >= 4 ? 'high' : 'normal',
    sections: [
      {
        title: '当前状态',
        lines: [
          `灵息：${pet.vitality.spirit}/100`,
          `疲惫：${pet.vitality.fatigue}/100`,
          `状态：${pet.vitality.status}`
        ]
      },
      {
        title: '可能获得',
        lines: [treasureNames]
      },
      {
        title: '可能危险',
        lines: [`风险等级：${map.riskLevel}`, `可能遭遇：${enemyNames}`]
      }
    ],
    actions: [
      {
        id: 'start_adventure',
        label: '允许出发',
        style: 'primary',
        value: `adventure:start:${map.id}`
      },
      {
        id: 'rest_first',
        label: '先休息',
        style: 'secondary',
        value: 'adventure:rest_first'
      },
      {
        id: 'cancel',
        label: '不去了',
        style: 'soft',
        value: 'adventure:cancel'
      }
    ]
  };
}

export function renderTextPanel(panel) {
  const lines = [`【${panel.title}】`];
  if (panel.petLine) lines.push('', panel.petLine);

  for (const section of panel.sections ?? []) {
    lines.push('', `【${section.title}】`);
    for (const line of section.lines ?? []) lines.push(String(line));
  }

  if (panel.actions?.length) {
    lines.push('', '请选择：');
    panel.actions.forEach((action, index) => {
      lines.push(`${index + 1}. ${action.label}`);
    });
  }

  return lines.join('\n');
}
