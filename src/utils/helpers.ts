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

  // 主牌大于副牌
  const isCard1Main = mainRank && card1.rank === mainRank;
  const isCard2Main = mainRank && card2.rank === mainRank;
  if (isCard1Main && !isCard2Main) return 1;
  if (!isCard1Main && isCard2Main) return -1;

  // 红桃主牌特殊规则
  if (mainSuit === Suit.HEART) {
    const isCard1RedHeart = card1.suit === Suit.HEART && card1.rank === mainRank;
    const isCard2RedHeart = card2.suit === Suit.HEART && card2.rank === mainRank;
    if (isCard1RedHeart && !isCard2RedHeart) return 1;
    if (!isCard1RedHeart && isCard2RedHeart) return -1;
  }

  // 比较牌值
  const rank1Index = RANK_ORDER.indexOf(card1.rank);
  const rank2Index = RANK_ORDER.indexOf(card2.rank);
  if (rank1Index !== rank2Index) {
    return rank1Index - rank2Index;
  }

  // 牌值相同，比较花色
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
