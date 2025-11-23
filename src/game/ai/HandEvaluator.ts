import type { Card } from '../types';
import { Rank, PlayType } from '../types';
import { findPossiblePlays } from '../CardTypes';
import { RANK_ORDER } from '../../utils/constants';
import { HandStructureAnalyzer } from './HandStructureAnalyzer';

export interface HandScore {
  totalScore: number;
  bombCount: number;
  controlCount: number; // Kings, Aces, Jokers
  structure: PlayType[]; // List of potential plays
  flexibility: number; // 出牌灵活性 0-100
  synergy: number; // 牌型配合价值 0-100
  endgameScore: number; // 残局评分
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

    // 9. 出牌灵活性评估（新增）
    const flexibility = this.evaluateFlexibility(hand, possiblePlays);
    score += flexibility * 0.5; // 灵活性加分

    // 10. 牌型配合价值评估（新增）
    const synergy = this.evaluateSynergy(hand, structure);
    score += synergy * 0.3; // 配合价值加分

    // 11. 残局优化评估（新增）
    const endgameScore = this.evaluateEndgame(hand, structure);
    if (hand.length <= 10) {
      score += endgameScore * 0.4; // 残局阶段更重视残局评分
    }

    return {
      totalScore: score,
      bombCount,
      controlCount,
      structure,
      flexibility,
      synergy,
      endgameScore
    };
  }

  /**
   * 评估出牌灵活性
   * 评估手牌能应对的牌型范围
   */
  private static evaluateFlexibility(hand: Card[], possiblePlays: any[]): number {
    let flexibility = 0;

    // 1. 能出的牌型种类越多，灵活性越高
    const playTypes = new Set(possiblePlays.map(p => p.type));
    flexibility += playTypes.size * 10; // 每种牌型+10分

    // 2. 能应对不同大小的牌（有大有小）
    const rankGroups = new Map<Rank, number>();
    hand.forEach(c => {
      rankGroups.set(c.rank, (rankGroups.get(c.rank) || 0) + 1);
    });

    const ranks = Array.from(rankGroups.keys());
    const rankIndices = ranks.map(r => RANK_ORDER.indexOf(r)).filter(idx => idx !== -1);
    if (rankIndices.length > 0) {
      const minRank = Math.min(...rankIndices);
      const maxRank = Math.max(...rankIndices);
      const rankRange = maxRank - minRank;
      flexibility += Math.min(rankRange * 2, 30); // 牌值范围越大，灵活性越高
    }

    // 3. 有单张、对子、三张等基础牌型，灵活性高
    if (playTypes.has(PlayType.SINGLE)) flexibility += 15;
    if (playTypes.has(PlayType.PAIR)) flexibility += 15;
    if (playTypes.has(PlayType.TRIPLE)) flexibility += 10;

    // 4. 有炸弹，灵活性最高（能应对任何牌型）
    if (playTypes.has(PlayType.BOMB) || playTypes.has(PlayType.FOUR_KINGS)) {
      flexibility += 30;
    }

    return Math.min(100, flexibility);
  }

  /**
   * 评估牌型配合价值
   * 评估手牌中各牌型的配合度
   */
  private static evaluateSynergy(hand: Card[], structure: PlayType[]): number {
    let synergy = 0;

    // 1. 使用HandStructureAnalyzer分析手牌结构
    const handStructure = HandStructureAnalyzer.analyze(hand);
    const handCount = handStructure.handCount;
    
    // 手牌数越少，说明牌型配合越好
    synergy += (27 - handCount) * 2; // 最多54分

    // 2. 有组合牌型（顺子、三连对、钢板等），配合价值高
    const comboTypes = [
      PlayType.STRAIGHT_FLUSH,
      PlayType.STRAIGHT,
      PlayType.TRIPLE_PAIR,
      PlayType.PLATE
    ];
    comboTypes.forEach(type => {
      if (structure.includes(type)) {
        synergy += 10;
      }
    });

    // 3. 三带二的配合（三张+对子）
    if (structure.includes(PlayType.TRIPLE_WITH_PAIR)) {
      synergy += 8;
    }

    // 4. 炸弹与其他牌型的配合
    if (structure.includes(PlayType.BOMB) || structure.includes(PlayType.FOUR_KINGS)) {
      // 如果有炸弹，且其他牌型也丰富，配合价值高
      if (structure.length > 2) {
        synergy += 15;
      }
    }

    // 5. 控制牌与牌型的配合
    const jokerCount = hand.filter(c =>
      c.rank === Rank.JOKER_BIG || c.rank === Rank.JOKER_SMALL
    ).length;
    if (jokerCount > 0 && structure.length > 1) {
      synergy += jokerCount * 5; // 王能配合其他牌型
    }

    return Math.min(100, synergy);
  }

  /**
   * 评估残局评分
   * 针对残局阶段的特殊评估逻辑
   */
  private static evaluateEndgame(hand: Card[], structure: PlayType[]): number {
    let endgameScore = 0;

    // 1. 手牌数越少，残局评分越高
    if (hand.length <= 3) {
      endgameScore += 50; // 即将走完
    } else if (hand.length <= 5) {
      endgameScore += 30;
    } else if (hand.length <= 8) {
      endgameScore += 15;
    }

    // 2. 残局阶段，能一次性出完的牌型价值最高
    const handStructure = HandStructureAnalyzer.analyze(hand);
    if (handStructure.handCount === 1) {
      endgameScore += 40; // 能一次性出完
    } else if (handStructure.handCount === 2) {
      endgameScore += 20; // 两次出完
    }

    // 3. 残局阶段，大牌和控制牌价值更高
    const jokerCount = hand.filter(c =>
      c.rank === Rank.JOKER_BIG || c.rank === Rank.JOKER_SMALL
    ).length;
    endgameScore += jokerCount * 10;

    const aceCount = hand.filter(c => c.rank === Rank.ACE).length;
    endgameScore += aceCount * 5;

    // 4. 残局阶段，炸弹价值极高
    if (structure.includes(PlayType.BOMB) || structure.includes(PlayType.FOUR_KINGS)) {
      endgameScore += 30;
    }

    // 5. 残局阶段，单张、对子等小牌型价值降低（容易被压）
    if (hand.length <= 5) {
      const smallPlayTypes: PlayType[] = [PlayType.SINGLE, PlayType.PAIR];
      const hasOnlySmallPlays = structure.every(type => smallPlayTypes.includes(type));
      if (hasOnlySmallPlays && structure.length > 2) {
        endgameScore -= 20; // 只有小牌型，容易被压
      }
    }

    // 6. 残局阶段，能应对多种牌型的能力很重要
    const endgamePossiblePlays = findPossiblePlays(hand, null);
    const flexibility = this.evaluateFlexibility(hand, endgamePossiblePlays);
    endgameScore += flexibility * 0.2;

    return Math.max(0, Math.min(100, endgameScore));
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
