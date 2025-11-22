// 花色枚举
export const Suit = {
  SPADE: 'spade',    // 黑桃
  HEART: 'heart',    // 红桃
  DIAMOND: 'diamond', // 方块
  CLUB: 'club',      // 梅花
  JOKER: 'joker',   // 王
} as const;

export type Suit = typeof Suit[keyof typeof Suit];

// 牌值
export const Rank = {
  ACE: 'A',
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
  SEVEN: '7',
  EIGHT: '8',
  NINE: '9',
  TEN: '10',
  JACK: 'J',
  QUEEN: 'Q',
  KING: 'K',
  JOKER_SMALL: 'joker_small', // 小王
  JOKER_BIG: 'joker_big',     // 大王
} as const;

export type Rank = typeof Rank[keyof typeof Rank];

// 单张牌
export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // 唯一标识，用于区分两副牌中的相同牌
}

// 牌型类型
export const PlayType = {
  SINGLE: 'single',           // 单张
  PAIR: 'pair',               // 对子
  TRIPLE: 'triple',           // 三张
  TRIPLE_WITH_PAIR: 'triple_with_pair', // 三带二
  TRIPLE_PAIR: 'triple_pair', // 三连对
  PLATE: 'plate',             // 钢板
  STRAIGHT: 'straight',       // 顺子
  STRAIGHT_FLUSH: 'straight_flush', // 同花顺
  BOMB: 'bomb',               // 炸弹
  FOUR_KINGS: 'four_kings',   // 四王
} as const;

export type PlayType = typeof PlayType[keyof typeof PlayType];

// 出牌
export interface Play {
  type: PlayType;
  cards: Card[];
  mainRank?: Rank; // 主牌等级（用于升级）
  mainSuit?: Suit; // 主牌花色
}

// 玩家位置
export const PlayerPosition = {
  TOP: 'top',      // 上方
  LEFT: 'left',    // 左侧
  RIGHT: 'right',  // 右侧
  BOTTOM: 'bottom', // 下方（玩家）
} as const;

export type PlayerPosition = typeof PlayerPosition[keyof typeof PlayerPosition];

// 玩家
export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  hand: Card[];
  isAI: boolean;
  team: 0 | 1; // 0或1，表示两个队伍
  avatar?: string;
  avatarImage?: string;
  personality?: string; // AI性格类型（PersonalityType）
}

// 游戏阶段
export const GamePhase = {
  WAITING: 'waiting',           // 等待开始
  DEALING: 'dealing',           // 发牌中
  CALLING_MAIN: 'calling_main', // 叫主
  PLAYING: 'playing',           // 出牌中
  ROUND_END: 'round_end',       // 一轮结束
  GAME_END: 'game_end',         // 游戏结束
} as const;

export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

// 当前等级（从2开始升级到A）
export type Level = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

// 游戏状态
export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  currentPlay: Play | null;
  lastPlay: Play | null;
  lastPlayPlayerIndex: number;
  level: Level;
  mainSuit: Suit | null;
  mainRank: Rank | null;
  deck: Card[];
  teamScores: [number, number]; // 两个队伍的得分
  roundWinner: number | null;
  playHistory?: Play[];  // 出牌历史（可选）
}

// AI难度
export const AIDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type AIDifficulty = typeof AIDifficulty[keyof typeof AIDifficulty];

// 游戏模式
export const GameMode = {
  COMPETITIVE: 'competitive', // 竞技模式
  TEACHING: 'teaching',       // 教学模式
} as const;

export type GameMode = typeof GameMode[keyof typeof GameMode];
