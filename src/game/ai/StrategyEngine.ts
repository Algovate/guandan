import type { GameState, Card, Player } from '../types';
import { PlayType } from '../types';
import { findPossiblePlays, comparePlays, canBeat } from '../CardTypes';
import { HandEvaluator } from './HandEvaluator';

/**
 * Strategy Engine - Simplified without trump card dependencies
 */
export class StrategyEngine {
  /**
   * Main decision making function
   */
  static decideMove(player: Player, gameState: GameState): Card[] | null {
    const { lastPlay, lastPlayPlayerIndex, players } = gameState;
    const hand = player.hand;

    // If no cards, must pass
    if (hand.length === 0) return null;

    const handScore = HandEvaluator.evaluate(hand);
    const isStrongHand = handScore.totalScore > 300;
    const hasControlCards = handScore.controlCount >= 3;

    // Determine if last play was from teammate
    const isTeammateLastPlay = lastPlay && lastPlayPlayerIndex >= 0 &&
      players[lastPlayPlayerIndex]?.team === player.team;

    // Get all possible plays
    const possiblePlays = findPossiblePlays(hand, lastPlay);
    const beatingPlays = possiblePlays.filter(p => lastPlay ? canBeat(p, lastPlay) : true);

    // If no last play, we are leading
    if (!lastPlay) {
      return this.chooseLeadPlay(player, possiblePlays, hand);
    }

    // Teammate played last - usually pass unless we can finish
    if (isTeammateLastPlay) {
      if (hand.length <= 3 && beatingPlays.length > 0) {
        return beatingPlays[0].cards;
      }
      return null; // Pass to let teammate continue
    }

    // Opponent played - decide whether to beat or pass
    if (beatingPlays.length === 0) {
      return null; // Cannot beat, must pass
    }

    // Strong hand or few cards left - be aggressive
    if (isStrongHand || hand.length <= 5 || hasControlCards) {
      return beatingPlays[beatingPlays.length - 1].cards; // Play strongest
    }

    // Normal situation - be conservative, play weakest beating card
    return beatingPlays[0].cards;
  }

  /**
   * Choose which play to lead with
   */
  private static chooseLeadPlay(
    _player: Player,
    possiblePlays: any[],
    hand: Card[]
  ): Card[] | null {
    if (possiblePlays.length === 0) return null;

    // Categorize plays
    const straights = possiblePlays.filter(p =>
      p.type === PlayType.STRAIGHT || p.type === PlayType.STRAIGHT_FLUSH
    );
    const triples = possiblePlays.filter(p =>
      p.type === PlayType.TRIPLE || p.type === PlayType.TRIPLE_WITH_PAIR ||
      p.type === PlayType.TRIPLE_PAIR || p.type === PlayType.PLATE
    );
    const pairs = possiblePlays.filter(p => p.type === PlayType.PAIR);
    const singles = possiblePlays.filter(p => p.type === PlayType.SINGLE);

    // If few cards, play biggest combo to try to finish
    if (hand.length <= 5) {
      possiblePlays.sort((a, b) => comparePlays(b, a));
      return possiblePlays[0].cards;
    }

    // Lead with structure plays if available (straights, triples, etc.)
    if (straights.length > 0) {
      straights.sort((a, b) => comparePlays(a, b));
      return straights[0].cards; // Lead with weakest straight
    }

    if (triples.length > 0) {
      triples.sort((a, b) => comparePlays(a, b));
      return triples[0].cards;
    }

    if (pairs.length > 0) {
      pairs.sort((a, b) => comparePlays(a, b));
      return pairs[0].cards;
    }

    if (singles.length > 0) {
      singles.sort((a, b) => comparePlays(a, b));
      return singles[0].cards;
    }

    // Fallback: play first available
    return possiblePlays[0].cards;
  }
}
