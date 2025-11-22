import type { Card } from '../game/types';
import { Rank, Suit } from '../game/types';
import { RANK_ORDER, SUIT_ORDER } from './constants';

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 比较两张牌的大小
 * @param card1 
 * @param card2 
 * @param mainRank 当前主牌等级
 * @param mainSuit 当前主牌花色
 * @returns 正数表示card1大，负数表示card2大，0表示相等
 */
export function compareCards(
  card1: Card,
  card2: Card,
  mainRank?: Rank,
  mainSuit?: Suit
): number {
  // 四王最大
  const card1IsBigJoker = card1.rank === Rank.JOKER_BIG;
  const card2IsBigJoker = card2.rank === Rank.JOKER_BIG;
  const card1IsSmallJoker = card1.rank === Rank.JOKER_SMALL;
  const card2IsSmallJoker = card2.rank === Rank.JOKER_SMALL;
  
  if (card1IsBigJoker) return 1;
  if (card2IsBigJoker) return -1;
  if (card1IsSmallJoker && !card2IsBigJoker) return 1;
  if (card2IsSmallJoker && !card1IsBigJoker) return -1;

  // 级牌（Level Card）处理
  // 掼蛋规则：红桃级牌 > 其他级牌 > 主花色牌 > 普通牌
  const isCard1Level = mainRank && card1.rank === mainRank;
  const isCard2Level = mainRank && card2.rank === mainRank;

  // 如果都是级牌
  if (isCard1Level && isCard2Level) {
    // 红桃级牌最大（逢人配）
    if (card1.suit === Suit.HEART && card2.suit !== Suit.HEART) return 1;
    if (card2.suit === Suit.HEART && card1.suit !== Suit.HEART) return -1;
    // 其他级牌大小相同（或者按花色排序，通常不区分大小，但为了排序稳定可以按花色）
    return SUIT_ORDER.indexOf(card1.suit) - SUIT_ORDER.indexOf(card2.suit);
  }

  // 一个是级牌，一个不是
  if (isCard1Level && !isCard2Level) return 1;
  if (!isCard1Level && isCard2Level) return -1;

  // 主花色处理
  // 如果都不是级牌，检查是否为主花色
  const isCard1MainSuit = mainSuit && card1.suit === mainSuit;
  const isCard2MainSuit = mainSuit && card2.suit === mainSuit;

  if (isCard1MainSuit && !isCard2MainSuit) return 1;
  if (!isCard1MainSuit && isCard2MainSuit) return -1;

  // 都是主花色或都是副牌，比较点数
  const rank1Index = RANK_ORDER.indexOf(card1.rank);
  const rank2Index = RANK_ORDER.indexOf(card2.rank);
  if (rank1Index !== rank2Index) {
    return rank1Index - rank2Index;
  }

  // 点数相同，比较花色
  const suit1Index = SUIT_ORDER.indexOf(card1.suit);
  const suit2Index = SUIT_ORDER.indexOf(card2.suit);
  return suit1Index - suit2Index;
}

/**
 * 对牌进行排序
 */
export function sortCards(cards: Card[], mainRank?: Rank, mainSuit?: Suit): Card[] {
  return [...cards].sort((a, b) => compareCards(a, b, mainRank, mainSuit));
}

/**
 * 检查两张牌是否相同（不考虑id）
 */
export function areCardsEqual(card1: Card, card2: Card): boolean {
  return card1.suit === card2.suit && card1.rank === card2.rank;
}

/**
 * 从手牌中移除指定的牌
 */
export function removeCardsFromHand(hand: Card[], cardsToRemove: Card[]): Card[] {
  return hand.filter(card => 
    !cardsToRemove.some(toRemove => card.id === toRemove.id)
  );
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
