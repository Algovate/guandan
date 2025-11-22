import type { GameState, Card, Play, Player } from '../types';
import { PlayType } from '../types';
import { findPossiblePlays, comparePlays, canBeat } from '../CardTypes';
import { HandEvaluator } from './HandEvaluator';

export class StrategyEngine {
  /**
   * Decide the best move for the current AI player
   */
  static decideMove(
    player: Player,
    gameState: GameState
  ): Card[] | null {
    const { hand } = player;
    const { lastPlay, lastPlayPlayerIndex, mainRank, mainSuit, players } = gameState;
    
    // Evaluate Hand
    const handScore = HandEvaluator.evaluate(hand, mainRank || undefined, mainSuit || undefined);
    const isStrongHand = handScore.totalScore > 60; // Tweak threshold

    // 1. Lead (First to Play)
    if (!lastPlay || lastPlayPlayerIndex === -1 || lastPlayPlayerIndex === gameState.currentPlayerIndex) {
      return this.decideLeadMove(player, handScore, mainRank, mainSuit);
    }

    // 2. Follow (Responding to someone)
    const isTeammate = this.isTeammate(player, lastPlayPlayerIndex, players);
    
    // Find all legal moves that can beat lastPlay
    const possiblePlays = findPossiblePlays(hand, lastPlay, mainRank || undefined, mainSuit || undefined);
    const beatingPlays = possiblePlays.filter(p => canBeat(p, lastPlay, mainRank || undefined, mainSuit || undefined));

    if (beatingPlays.length === 0) {
      return null; // Pass
    }

    // Sort by "cost" (Logic: smallest valid play is best usually)
    // We can use comparePlays to sort, assuming smaller plays are "weaker"
    beatingPlays.sort((a, b) => comparePlays(a, b, mainRank || undefined, mainSuit || undefined));

    // Teammate Logic
    if (isTeammate) {
      // If teammate played a high card or bomb, let them pass (unless we can finish)
      if (this.isStrongPlay(lastPlay)) {
        // Only overtake if we can finish hand or have absolute control
        if (hand.length < 5) return beatingPlays[0].cards;
        return null; 
      }
      // If teammate played low, help them? Or let opponents fight?
      // Simple: Pass if teammate played
      return null; 
    }

    // Opponent Logic
    // Try to play the smallest beating play that isn't "too expensive"
    const bestPlay = beatingPlays[0];
    
    // Don't waste a Bomb on a small single unless we are desperate
    if (bestPlay.type === PlayType.BOMB && lastPlay.type !== PlayType.BOMB) {
       // Only bomb if hand is very strong or opponent is about to win
       const opponentHandCount = players[lastPlayPlayerIndex].hand.length;
       if (opponentHandCount < 5 || isStrongHand) {
         return bestPlay.cards;
       }
       return null;
    }

    return bestPlay.cards;
  }

  private static decideLeadMove(
    player: Player, 
    _handScore: any,
    mainRank?: any, 
    mainSuit?: any
  ): Card[] {
    // Simple Strategy: Play Smallest Single or Pair
    // Advanced: Check structure. If lots of pairs, play pair.
    
    // Generate all possible "Lead" plays (pass null as lastPlay)
    const possiblePlays = findPossiblePlays(player.hand, null, mainRank, mainSuit);
    
    if (possiblePlays.length === 0) return []; // Should not happen if hand > 0

    // Prioritize:
    // 1. Straights / Tubes (3+3) if available (clear many cards)
    // 2. Smallest Single/Pair
    
    const straights = possiblePlays.filter(p => p.type === PlayType.STRAIGHT || p.type === PlayType.STRAIGHT_FLUSH);
    if (straights.length > 0) {
        return straights[0].cards; // Play first straight found
    }

    const triples = possiblePlays.filter(p => p.type === PlayType.TRIPLE_WITH_PAIR || p.type === PlayType.TRIPLE);
    if (triples.length > 0) {
        return triples[0].cards;
    }

    const pairs = possiblePlays.filter(p => p.type === PlayType.PAIR);
    // Sort pairs by rank (low to high)
    pairs.sort((a, b) => comparePlays(a, b, mainRank, mainSuit));
    
    const singles = possiblePlays.filter(p => p.type === PlayType.SINGLE);
    singles.sort((a, b) => comparePlays(a, b, mainRank, mainSuit));

    // If many pairs, lead pair. Else lead single.
    if (pairs.length > singles.length && pairs.length > 0) {
        return pairs[0].cards;
    }
    
    if (singles.length > 0) {
        return singles[0].cards;
    }

    // Fallback (e.g. Bomb only)
    return possiblePlays[0].cards;
  }

  private static isTeammate(me: Player, otherIndex: number, players: Player[]): boolean {
    // Teams: 0&2, 1&3
    // Indices: 0,1,2,3
    // My index? We don't have my index passed directly, but we can find it
    const myIndex = players.findIndex(p => p.id === me.id);
    return (myIndex % 2) === (otherIndex % 2);
  }

  private static isStrongPlay(play: Play): boolean {
    // Heuristic: Bomb, or Rank > J (for single/pair)
    if (play.type === PlayType.BOMB || play.type === PlayType.FOUR_KINGS) return true;
    // Check rank of first card
    // This is a simplification
    return false; 
  }
}
