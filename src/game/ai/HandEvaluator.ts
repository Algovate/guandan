import type { Card } from '../types';
import { Rank, PlayType } from '../types';
import { findPossiblePlays } from '../CardTypes';
import { RANK_ORDER } from '../../utils/constants';

export interface HandScore {
  totalScore: number;
  bombCount: number;
  controlCount: number; // Kings, Aces, Jokers
  structure: PlayType[]; // List of potential plays
}

export class HandEvaluator {
  /**
   * Evaluate the strength of a hand
   * 评估手牌强度，考虑基础牌值、组合牌型、控制牌等因素
   */
  static evaluate(hand: Card[]): HandScore {
    let score = 0;
    let bombCount = 0;
    let controlCount = 0;
    const structure: PlayType[] = [];

    // 1. Base Card Value Scoring
    hand.forEach(card => {
      const value = this.getCardValue(card);
      score += value;

      // Count controls (Jokers, Aces)
      if (card.rank === Rank.JOKER_BIG || card.rank === Rank.JOKER_SMALL) {
        controlCount++;
      } else if (card.rank === Rank.ACE) {
        controlCount++;
      }
    });

    // 2. Structure Scoring (Enhanced)
    const rankGroups = new Map<Rank, number>();
    hand.forEach(c => {
      rankGroups.set(c.rank, (rankGroups.get(c.rank) || 0) + 1);
    });

    // Bombs
    rankGroups.forEach((count) => {
      if (count >= 4) {
        bombCount++;
        score += 30 * (count - 3); // 炸弹价值：4张+30，5张+60，6张+90...
        structure.push(PlayType.BOMB);
      }
    });

    // King Bomb (四王)
    const bigJokers = hand.filter(c => c.rank === Rank.JOKER_BIG).length;
    const smallJokers = hand.filter(c => c.rank === Rank.JOKER_SMALL).length;
    if (bigJokers + smallJokers === 4) {
      bombCount++;
      score += 150; // 四王价值最高
      structure.push(PlayType.FOUR_KINGS);
    }

    // 3. 组合牌型评估（使用 findPossiblePlays 检测）
    const possiblePlays = findPossiblePlays(hand, null);
    const detectedStructures = new Set<PlayType>();

    // 统计各种组合牌型
    let straightCount = 0;
    let straightFlushCount = 0;
    let triplePairCount = 0;
    let plateCount = 0;
    let tripleWithPairCount = 0;

    possiblePlays.forEach(play => {
      switch (play.type) {
        case PlayType.STRAIGHT_FLUSH:
          if (!detectedStructures.has(PlayType.STRAIGHT_FLUSH)) {
            straightFlushCount++;
            detectedStructures.add(PlayType.STRAIGHT_FLUSH);
            score += 40; // 同花顺价值很高
            structure.push(PlayType.STRAIGHT_FLUSH);
          }
          break;
        case PlayType.STRAIGHT:
          straightCount++;
          if (!detectedStructures.has(PlayType.STRAIGHT)) {
            score += 15; // 顺子价值
            structure.push(PlayType.STRAIGHT);
            detectedStructures.add(PlayType.STRAIGHT);
          }
          break;
        case PlayType.TRIPLE_PAIR:
          triplePairCount++;
          if (!detectedStructures.has(PlayType.TRIPLE_PAIR)) {
            score += 25; // 三连对价值
            structure.push(PlayType.TRIPLE_PAIR);
            detectedStructures.add(PlayType.TRIPLE_PAIR);
          }
          break;
        case PlayType.PLATE:
          plateCount++;
          if (!detectedStructures.has(PlayType.PLATE)) {
            score += 25; // 钢板价值
            structure.push(PlayType.PLATE);
            detectedStructures.add(PlayType.PLATE);
          }
          break;
        case PlayType.TRIPLE_WITH_PAIR:
          tripleWithPairCount++;
          if (!detectedStructures.has(PlayType.TRIPLE_WITH_PAIR)) {
            score += 18; // 三带二价值
            structure.push(PlayType.TRIPLE_WITH_PAIR);
            detectedStructures.add(PlayType.TRIPLE_WITH_PAIR);
          }
          break;
      }
    });

    // 4. 基础牌型评估
    // Triples
    rankGroups.forEach((count) => {
      if (count === 3) {
        score += 10;
        if (!structure.includes(PlayType.TRIPLE)) {
          structure.push(PlayType.TRIPLE);
        }
      }
    });

    // Pairs
    rankGroups.forEach((count) => {
      if (count === 2) {
        score += 4;
        if (!structure.includes(PlayType.PAIR)) {
          structure.push(PlayType.PAIR);
        }
      }
    });

    // 5. 牌型配合价值评估
    // 如果有多个三张，可能组成钢板
    const tripleRanks = Array.from(rankGroups.entries())
      .filter(([_, count]) => count >= 3)
      .map(([rank]) => rank);
    
    if (tripleRanks.length >= 2) {
      // 检查是否可以组成钢板
      const sortedTripleRanks = tripleRanks
        .map(rank => ({ rank, index: RANK_ORDER.indexOf(rank) }))
        .filter(({ index }) => index !== -1)
        .sort((a, b) => a.index - b.index);
      
      for (let i = 0; i < sortedTripleRanks.length - 1; i++) {
        if (sortedTripleRanks[i + 1].index === sortedTripleRanks[i].index + 1) {
          score += 5; // 可以组成钢板的额外价值
          break;
        }
      }
    }

    // 如果有多个对子，可能组成三连对
    const pairRanks = Array.from(rankGroups.entries())
      .filter(([_, count]) => count >= 2)
      .map(([rank]) => rank);
    
    if (pairRanks.length >= 3) {
      const sortedPairRanks = pairRanks
        .map(rank => ({ rank, index: RANK_ORDER.indexOf(rank) }))
        .filter(({ index }) => index !== -1)
        .sort((a, b) => a.index - b.index);
      
      // 检查是否有连续的三对
      for (let i = 0; i <= sortedPairRanks.length - 3; i++) {
        if (sortedPairRanks[i + 2].index === sortedPairRanks[i].index + 2 &&
            sortedPairRanks[i + 1].index === sortedPairRanks[i].index + 1) {
          score += 5; // 可以组成三连对的额外价值
          break;
        }
      }
    }

    // 6. 控制牌奖励
    const jokerCount = hand.filter(c =>
      c.rank === Rank.JOKER_BIG ||
      c.rank === Rank.JOKER_SMALL
    ).length;
    score += jokerCount * 8; // 提高王的权重

    // 7. 孤立小牌的惩罚
    rankGroups.forEach((count, rank) => {
      if (count === 1 && this.getRankBaseValue(rank) < 2) { // < 10
        score -= 5; // 孤立小牌降低手牌价值
      }
    });

    // 8. 手牌数量奖励（牌越少越容易走完）
    if (hand.length <= 5) {
      score += 20; // 接近走完的奖励
    } else if (hand.length <= 10) {
      score += 10; // 手牌较少的奖励
    }

    return {
      totalScore: score,
      bombCount,
      controlCount,
      structure
    };
  }

  /**
   * Get approximate value of a single card
   */
  private static getCardValue(card: Card): number {
    if (card.rank === Rank.JOKER_BIG) return 15;
    if (card.rank === Rank.JOKER_SMALL) return 12;

    return this.getRankBaseValue(card.rank);
  }

  private static getRankBaseValue(rank: Rank): number {
    switch (rank) {
      case Rank.ACE: return 6;
      case Rank.KING: return 5;
      case Rank.QUEEN: return 4;
      case Rank.JACK: return 3;
      case Rank.TEN: return 2;
      default: return 1;
    }
  }
}
