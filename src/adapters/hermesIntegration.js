export function buildProfileCreateCommand({ profileName = 'soulpet' }) {
  return ['hermes', 'profile', 'create', profileName, '--clone'];
}

export function buildCronCreateCommand({ schedule = 'every 2h', workdir = process.cwd(), deliver = 'origin' }) {
  const prompt = '运行 灵伴系统 tick：在工作目录执行 npm run demo -- tick quiet_presence；如果有输出，把它作为灵伴主动消息返回给主人。不要执行高危探险或安装工具。';
  return [
    'hermes', 'cron', 'create', schedule,
    '--name', 'soulpet-quiet-presence',
    '--workdir', workdir,
    '--deliver', deliver,
    '--', prompt, '&&', 'npm run demo -- tick quiet_presence'
  ];
}

export function createHermesIntegrationPlan({ profileName = 'soulpet', workdir = process.cwd(), schedule = 'every 2h' }) {
  return {
    profileName,
    workdir,
    commands: [
      buildProfileCreateCommand({ profileName }),
      buildCronCreateCommand({ schedule, workdir })
    ],
    notes: [
      '这是非破坏性集成计划，不会自动重启网关。',
      '分身配置 创建后需要在新会话或 网关 重启后生效。',
      '定时轻声铃 只运行低风险 quiet_presence tick，不会自动高危探险。',
      '消息平台 面板选择需要通过消息桥接解析后才会执行。'
    ]
  };
}
