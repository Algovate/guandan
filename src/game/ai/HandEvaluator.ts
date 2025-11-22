import type { Card } from '../types';
import { Rank, Suit, PlayType } from '../types';

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
  static evaluate(hand: Card[], mainRank?: Rank, mainSuit?: Suit): HandScore {
    let score = 0;
    let bombCount = 0;
    let controlCount = 0;
    const structure: PlayType[] = [];

    // 1. Base Card Value Scoring
    hand.forEach(card => {
      const value = this.getCardValue(card, mainRank, mainSuit);
      score += value;

      // Count controls (Jokers, Level Cards, Aces)
      if (card.rank === Rank.JOKER_BIG || card.rank === Rank.JOKER_SMALL) {
        controlCount++;
      } else if (mainRank && card.rank === mainRank) {
        controlCount++;
      } else if (card.rank === Rank.ACE) {
        controlCount++;
      }
    });

    // 2. Structure Scoring (Simplified)
    // Find bombs
    const rankGroups = new Map<Rank, number>();
    hand.forEach(c => {
      rankGroups.set(c.rank, (rankGroups.get(c.rank) || 0) + 1);
    });

    rankGroups.forEach((count) => {
      if (count >= 4) {
        bombCount++;
        score += 20 * (count - 3); // 4 cards = 20, 5 cards = 40
        structure.push(PlayType.BOMB);
      }
    });
    
    // Check for 4 Kings (King Bomb)
    const bigJokers = hand.filter(c => c.rank === Rank.JOKER_BIG).length;
    const smallJokers = hand.filter(c => c.rank === Rank.JOKER_SMALL).length;
    if (bigJokers + smallJokers === 4) {
        bombCount++; // Super bomb
        score += 100;
        structure.push(PlayType.FOUR_KINGS);
    }

    // Bonus for having many trumps
    const trumpCount = hand.filter(c => 
      (mainRank && c.rank === mainRank) || 
      (mainSuit && c.suit === mainSuit) || 
      c.rank === Rank.JOKER_BIG || 
      c.rank === Rank.JOKER_SMALL
    ).length;
    
    score += trumpCount * 2;

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
  private static getCardValue(card: Card, mainRank?: Rank, mainSuit?: Suit): number {
    if (card.rank === Rank.JOKER_BIG) return 15;
    if (card.rank === Rank.JOKER_SMALL) return 12;
    
    // Level Cards
    if (mainRank && card.rank === mainRank) {
      if (card.suit === Suit.HEART) return 10; // Heart Level
      return 8; // Other Level
    }

    // Main Suit (Non-Level)
    if (mainSuit && card.suit === mainSuit) {
        // Main suit cards are slightly better than normal
        return this.getRankBaseValue(card.rank) + 2;
    }

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
