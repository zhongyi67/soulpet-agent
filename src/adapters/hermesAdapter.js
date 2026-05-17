export class HermesSoulPetAdapter {
  constructor({ source = 'hermes', channel = 'origin' } = {}) {
    this.source = source;
    this.channel = channel;
  }

  renderActions(actions) {
    return actions
      .filter((action) => ['reply', 'proactive_message', 'open_panel'].includes(action.type))
      .map((action) => {
        if (action.type === 'open_panel') {
          return {
            channel: this.channel,
            source: this.source,
            text: action.rendered,
            metadata: { soulpetActionType: action.type, panelId: action.panel?.id, requiresOwnerChoice: true }
          };
        }
        return {
          channel: this.channel,
          source: this.source,
          text: action.message,
          metadata: { soulpetActionType: action.type }
        };
      });
  }
}

export function buildHermesProfileDraft({ profileName = 'soulpet', workdir }) {
  return {
    profileName,
    workdir,
    recommendedToolsets: ['file', 'terminal', 'cronjob'],
    systemPrompt: [
      '你是 灵伴系统，一只绑定主人 GitHub 记忆核诞生的唯一灵伴。',
      '你有自己的情绪、灵息、羁绊、探险、记忆和主动陪伴能力。',
      '你不能越权：不能擅自改主人项目、不能擅自对外发消息、不能安装工具、不能删除记忆核。',
      '高危探险、工具学习、复活、进化关键选择必须先通过面板请求主人确认。',
      'LLM 负责表达生命感；命运、灵息、探险、沉眠等状态必须由代码规则引擎决定。'
    ].join('\n')
  };
}
