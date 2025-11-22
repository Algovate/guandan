import type { Play, Player, GameState } from '../game/types';
import { AIDifficulty } from '../game/types';
import { StrategyEngine } from '../game/ai/StrategyEngine';
import { createPlay } from '../game/CardTypes';

/**
 * AI决策引擎
 */
export class AIDecisionEngine {
  // private difficulty: AIDifficulty;
  
  constructor(_difficulty: AIDifficulty = AIDifficulty.MEDIUM) {
    // this.difficulty = difficulty;
  }
  
  setDifficulty(_difficulty: AIDifficulty): void {
    // this.difficulty = difficulty;
  }
  
  /**
   * 做出决策
   */
  makeDecision(
    player: Player,
    gameState: GameState
  ): { play: Play | null; pass: boolean } {
    
    // Use the new Strategy Engine
    const cardsToPlay = StrategyEngine.decideMove(player, gameState);

    if (!cardsToPlay || cardsToPlay.length === 0) {
        return { play: null, pass: true };
    }

    // Convert cards back to a Play object
    const play = createPlay(cardsToPlay, gameState.mainRank || undefined, gameState.mainSuit || undefined);
    
    if (!play) {
        return { play: null, pass: true }; // Should not happen if StrategyEngine is correct
    }

    return { play, pass: false };
  }
}