import type { Card } from '../game/types';
import { Rank } from '../game/types';
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
 * @returns 正数表示card1大，负数表示card2大，0表示相等
 */
export function compareCards(
  card1: Card,
  card2: Card
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

  // 比较点数
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
 * 比較两张牌的大小（仅比较数值，忽略花色）
 * 用于判断出牌是否能压过
 */
export function compareCardValues(
  card1: Card,
  card2: Card
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

  // 比较点数
  const rank1Index = RANK_ORDER.indexOf(card1.rank);
  const rank2Index = RANK_ORDER.indexOf(card2.rank);

  return rank1Index - rank2Index;
}

/**
 * 对牌进行排序
 */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => compareCards(a, b));
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
