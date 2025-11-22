import type { Card } from './types';
import { Suit, Rank } from './types';

/**
 * 创建一副完整的牌
 */
function createDeck(deckNumber: number): Card[] {
  const cards: Card[] = [];
  
  // 普通牌（A, 2-10, J, Q, K）
  const ranks = [
    Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE,
    Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
    Rank.JACK, Rank.QUEEN, Rank.KING
  ];
  
  const suits = [Suit.SPADE, Suit.HEART, Suit.DIAMOND, Suit.CLUB];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push({
        suit,
        rank,
        id: `${deckNumber}-${suit}-${rank}`,
      });
    }
  }
  
  // 添加大小王
  cards.push({
    suit: Suit.JOKER,
    rank: Rank.JOKER_SMALL,
    id: `${deckNumber}-joker-small`,
  });
  
  cards.push({
    suit: Suit.JOKER,
    rank: Rank.JOKER_BIG,
    id: `${deckNumber}-joker-big`,
  });
  
  return cards;
}

/**
 * 洗牌算法（Fisher-Yates）
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 牌堆管理类
 */
export class Deck {
  private cards: Card[];
  
  constructor() {
    // 创建两副牌
    const deck1 = createDeck(1);
    const deck2 = createDeck(2);
    this.cards = [...deck1, ...deck2];
  }
  
  /**
   * 洗牌
   */
  shuffle(): void {
    this.cards = shuffle(this.cards);
  }
  
  /**
   * 发牌
   * @param count 发牌数量
   * @returns 发出去的牌
   */
  deal(count: number): Card[] {
    if (count > this.cards.length) {
      throw new Error('Not enough cards in deck');
    }
    return this.cards.splice(0, count);
  }
  
  /**
   * 获取剩余牌数
   */
  get remainingCount(): number {
    return this.cards.length;
  }
  
  /**
   * 获取所有牌（用于调试）
   */
  get allCards(): Card[] {
    return [...this.cards];
  }
  
  /**
   * 检查是否为空
   */
  isEmpty(): boolean {
    return this.cards.length === 0;
  }
}
