import type { Card } from '../types';
import { Rank, PlayType } from '../types';


export interface HandScore {
  totalScore: number;
  bombCount: number;
  controlCount: number; // Kings, Aces, Jokers
  structure: PlayType[]; // List of potential plays
}

export class HandEvaluator {
  /**
   * Evaluate the strength of a hand
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
    // We use findPossiblePlays to detect structures, but we need to be careful not to double count.
    // A simple approach is to detect "best" non-overlapping structures.
    // For performance, we'll do a simplified structural analysis.

    const rankGroups = new Map<Rank, number>();
    hand.forEach(c => {
      rankGroups.set(c.rank, (rankGroups.get(c.rank) || 0) + 1);
    });

    // Bombs
    rankGroups.forEach((count) => {
      if (count >= 4) {
        bombCount++;
        score += 30 * (count - 3); // Increased bomb value
        structure.push(PlayType.BOMB);
      }
    });

    // King Bomb
    const bigJokers = hand.filter(c => c.rank === Rank.JOKER_BIG).length;
    const smallJokers = hand.filter(c => c.rank === Rank.JOKER_SMALL).length;
    if (bigJokers + smallJokers === 4) {
      bombCount++;
      score += 150; // Massive value
      structure.push(PlayType.FOUR_KINGS);
    }

    // Triples
    rankGroups.forEach((count) => {
      if (count === 3) {
        score += 10;
        structure.push(PlayType.TRIPLE);
      }
    });

    // Pairs
    rankGroups.forEach((count) => {
      if (count === 2) {
        score += 4;
        structure.push(PlayType.PAIR);
      }
    });

    // Straights (Simplified detection)
    // This is hard to do perfectly without a full solver, but we can give a bonus for connected cards
    // ... (omitted for performance, relying on base card values and groups)

    // Bonus for having jokers
    const jokerCount = hand.filter(c =>
      c.rank === Rank.JOKER_BIG ||
      c.rank === Rank.JOKER_SMALL
    ).length;

    score += jokerCount * 5;

    // Penalty for single small cards (orphan cards)
    // Cards < 10 that are singles
    rankGroups.forEach((count, rank) => {
      if (count === 1 && this.getRankBaseValue(rank) < 2) { // < 10
        score -= 5;
      }
    });

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
