import type { Card, Play } from '../game/types';
import { findPossiblePlays, comparePlays } from '../game/CardTypes';
import { AIDifficulty } from '../game/types';

/**
 * AI策略接口
 */
export interface AIStrategy {
  decidePlay(
    hand: Card[],
    lastPlay: Play | null,
    isTeammateLastPlay: boolean,
  ): { play: Play | null; pass: boolean };
}

/**
 * 简单AI：随机出牌
 */
export class EasyAIStrategy implements AIStrategy {
  decidePlay(
    hand: Card[],
    lastPlay: Play | null,
    isTeammateLastPlay: boolean,
  ): { play: Play | null; pass: boolean } {
    // 如果是队友出的牌，大概率不出
    if (isTeammateLastPlay && Math.random() > 0.3) {
      return { play: null, pass: true };
    }
    
    const possiblePlays = findPossiblePlays(hand, lastPlay);
    
    if (possiblePlays.length === 0) {
      return { play: null, pass: true };
    }
    
    // 随机选择一个
    const randomPlay = possiblePlays[Math.floor(Math.random() * possiblePlays.length)];
    return { play: randomPlay, pass: false };
  }
}

/**
 * 中等AI：基础策略
 */
export class MediumAIStrategy implements AIStrategy {
  decidePlay(
    hand: Card[],
    lastPlay: Play | null,
    isTeammateLastPlay: boolean,
  ): { play: Play | null; pass: boolean } {
    // 如果是队友出的牌，大概率不出
    if (isTeammateLastPlay && Math.random() > 0.2) {
      return { play: null, pass: true };
    }
    
    const possiblePlays = findPossiblePlays(hand, lastPlay);
    
    if (possiblePlays.length === 0) {
      return { play: null, pass: true };
    }
    
    // 策略：优先出小牌，保留大牌
    const sortedPlays = [...possiblePlays].sort((a, b) => {
      const comparison = comparePlays(a, b);
      return -comparison; // 反向排序，小的在前
    });
    
    // 80%概率出最小的，20%概率随机
    if (Math.random() > 0.2) {
      return { play: sortedPlays[0], pass: false };
    } else {
      const randomPlay = possiblePlays[Math.floor(Math.random() * possiblePlays.length)];
      return { play: randomPlay, pass: false };
    }
  }
}

/**
 * 困难AI：深度分析
 */
export class HardAIStrategy implements AIStrategy {
  decidePlay(
    hand: Card[],
    lastPlay: Play | null,
    isTeammateLastPlay: boolean,
  ): { play: Play | null; pass: boolean } {
    // 如果是队友出的牌，根据手牌情况决定
    if (isTeammateLastPlay) {
      // 如果手牌很多，让队友继续
      if (hand.length > 15 && Math.random() > 0.3) {
        return { play: null, pass: true };
      }
      // 如果手牌很少，可能帮助队友
      if (hand.length < 5 && Math.random() > 0.5) {
        return { play: null, pass: true };
      }
    }
    
    const possiblePlays = findPossiblePlays(hand, lastPlay);
    
    if (possiblePlays.length === 0) {
      return { play: null, pass: true };
    }
    
    // 评估每个出牌的价值
    const evaluatedPlays = possiblePlays.map(play => ({
      play,
      score: this.evaluatePlay(play, hand, lastPlay),
    }));
    
    // 根据情况选择策略
    const handCount = hand.length;
    
    // 手牌很多时，优先出小牌
    if (handCount > 15) {
      evaluatedPlays.sort((a, b) => a.score - b.score);
      return { play: evaluatedPlays[0].play, pass: false };
    }
    
    // 手牌中等时，平衡出牌
    if (handCount > 8) {
      evaluatedPlays.sort((a, b) => a.score - b.score);
      const midIndex = Math.floor(evaluatedPlays.length / 3);
      return { play: evaluatedPlays[midIndex].play, pass: false };
    }
    
    // 手牌少时，尽量出完
    evaluatedPlays.sort((a, b) => {
      // 优先出能出完的牌
      const aCanFinish = a.play.cards.length === hand.length;
      const bCanFinish = b.play.cards.length === hand.length;
      if (aCanFinish && !bCanFinish) return -1;
      if (!aCanFinish && bCanFinish) return 1;
      return a.score - b.score;
    });
    
    return { play: evaluatedPlays[0].play, pass: false };
  }
  
  /**
   * 评估出牌的价值
   * 分数越低越好（优先出）
   */
  private evaluatePlay(
    play: Play,
    _hand: Card[],
    lastPlay: Play | null,
  ): number {
    let score = 0;
    
    // 牌数越少越好
    score += play.cards.length * 10;
    
    // 评估牌的大小（越小越好）
    const avgCardValue = play.cards.reduce((sum, card) => {
      const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const index = rankOrder.indexOf(card.rank);
      return sum + (index >= 0 ? index : 20);
    }, 0) / play.cards.length;
    score += avgCardValue;
    
    // 炸弹价值高（保留）
    if (play.type === 'bomb' || play.type === 'four_kings') {
      score += 100;
    }
    
    // 如果能压过，稍微降低分数（优先出）
    if (lastPlay && comparePlays(play, lastPlay) > 0) {
      score -= 5;
    }
    
    return score;
  }
}

/**
 * 根据难度获取AI策略
 */
export function getAIStrategy(difficulty: AIDifficulty): AIStrategy {
  switch (difficulty) {
    case AIDifficulty.EASY:
      return new EasyAIStrategy();
    case AIDifficulty.MEDIUM:
      return new MediumAIStrategy();
    case AIDifficulty.HARD:
      return new HardAIStrategy();
    default:
      return new MediumAIStrategy();
  }
}
