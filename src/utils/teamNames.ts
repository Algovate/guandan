// 队伍主题配置
export interface TeamTheme {
  teamName: string;
  players: [string, string]; // 两个玩家姓名
  avatars?: [string, string]; // 可选：两个玩家头像emoji
}

// 队伍主题列表
export const TEAM_THEMES: TeamTheme[] = [
  // 三国主题
  {
    teamName: '蜀汉',
    players: ['诸葛亮', '刘备'],
    avatars: ['🧙‍♂️', '👑'],
  },
  {
    teamName: '曹魏',
    players: ['曹操', '司马懿'],
    avatars: ['😈', '🎭'],
  },
  {
    teamName: '东吴',
    players: ['孙权', '周瑜'],
    avatars: ['🦁', '🎯'],
  },
  {
    teamName: '西凉',
    players: ['马超', '赵云'],
    avatars: ['⚔️', '🛡️'],
  },
  // 其他历史主题
  {
    teamName: '大唐',
    players: ['李世民', '李靖'],
    avatars: ['👑', '⚔️'],
  },
  {
    teamName: '大宋',
    players: ['赵匡胤', '岳飞'],
    avatars: ['👑', '🛡️'],
  },
  {
    teamName: '大明',
    players: ['朱元璋', '徐达'],
    avatars: ['👑', '⚔️'],
  },
  // 颜色主题
  {
    teamName: '红队',
    players: ['红方一', '红方二'],
    avatars: ['🔴', '🌹'],
  },
  {
    teamName: '蓝队',
    players: ['蓝方一', '蓝方二'],
    avatars: ['🔵', '💙'],
  },
  {
    teamName: '绿队',
    players: ['绿方一', '绿方二'],
    avatars: ['🟢', '🌿'],
  },
  {
    teamName: '黄队',
    players: ['黄方一', '黄方二'],
    avatars: ['🟡', '⭐'],
  },
  // 动物主题
  {
    teamName: '龙队',
    players: ['青龙', '白龙'],
    avatars: ['🐉', '🐲'],
  },
  {
    teamName: '虎队',
    players: ['猛虎', '飞虎'],
    avatars: ['🐅', '🐯'],
  },
  {
    teamName: '鹰队',
    players: ['雄鹰', '猎鹰'],
    avatars: ['🦅', '🦉'],
  },
  {
    teamName: '狼队',
    players: ['头狼', '战狼'],
    avatars: ['🐺', '⚡'],
  },
];

/**
 * 随机选择两个不同的队伍主题
 * @returns 包含两个队伍主题的数组，第一个是team 0，第二个是team 1
 */
export function selectRandomTeamThemes(): [TeamTheme, TeamTheme] {
  const availableThemes = [...TEAM_THEMES];
  
  // 随机选择第一个主题
  const firstIndex = Math.floor(Math.random() * availableThemes.length);
  const firstTheme = availableThemes[firstIndex];
  
  // 移除已选择的主题
  availableThemes.splice(firstIndex, 1);
  
  // 随机选择第二个主题
  const secondIndex = Math.floor(Math.random() * availableThemes.length);
  const secondTheme = availableThemes[secondIndex];
  
  return [firstTheme, secondTheme];
}

