import type { Level } from '../game/types';
import { Rank, Suit } from '../game/types';

// 牌值顺序（从小到大，A最大）
export const RANK_ORDER: Rank[] = [
  Rank.TWO,
  Rank.THREE,
  Rank.FOUR,
  Rank.FIVE,
  Rank.SIX,
  Rank.SEVEN,
  Rank.EIGHT,
  Rank.NINE,
  Rank.TEN,
  Rank.JACK,
  Rank.QUEEN,
  Rank.KING,
  Rank.ACE,
  Rank.JOKER_SMALL,
  Rank.JOKER_BIG,
];

// 等级顺序
export const LEVEL_ORDER: Level[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 花色顺序
export const SUIT_ORDER: Suit[] = [Suit.CLUB, Suit.DIAMOND, Suit.SPADE, Suit.HEART];

// 每副牌的数量
export const CARDS_PER_DECK = 54;

// 总牌数（两副牌）
export const TOTAL_CARDS = 108;

// 每人手牌数
export const CARDS_PER_PLAYER = 27;

// 玩家数量
export const PLAYER_COUNT = 4;

// 花色显示名称
export const SUIT_NAMES: Record<Suit, string> = {
  [Suit.SPADE]: '♠',
  [Suit.HEART]: '♥',
  [Suit.DIAMOND]: '♦',
  [Suit.CLUB]: '♣',
  [Suit.JOKER]: '🃏',
};

// 牌值显示名称
export const RANK_NAMES: Record<Rank, string> = {
  [Rank.ACE]: 'A',
  [Rank.TWO]: '2',
  [Rank.THREE]: '3',
  [Rank.FOUR]: '4',
  [Rank.FIVE]: '5',
  [Rank.SIX]: '6',
  [Rank.SEVEN]: '7',
  [Rank.EIGHT]: '8',
  [Rank.NINE]: '9',
  [Rank.TEN]: '10',
  [Rank.JACK]: 'J',
  [Rank.QUEEN]: 'Q',
  [Rank.KING]: 'K',
  [Rank.JOKER_SMALL]: '小王',
  [Rank.JOKER_BIG]: '大王',
};

// 牌型名称
export const PLAY_TYPE_NAMES: Record<string, string> = {
  single: '单张',
  pair: '对子',
  triple: '三张',
  triple_with_pair: '三带二',
  straight: '顺子',
  straight_flush: '同花顺',
  bomb: '炸弹',
  four_kings: '四王',
};
