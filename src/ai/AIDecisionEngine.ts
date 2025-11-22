import type { Play, Player, GameState } from '../game/types';
import { getAIStrategy } from './strategies';
import type { AIStrategy } from './strategies';
import { AIDifficulty } from '../game/types';

/**
 * AI决策引擎
 */
export class AIDecisionEngine {
  private strategy: AIStrategy;
  
  constructor(difficulty: AIDifficulty = AIDifficulty.MEDIUM) {
    this.strategy = getAIStrategy(difficulty);
  }
  
  setDifficulty(difficulty: AIDifficulty): void {
    this.strategy = getAIStrategy(difficulty);
  }
  
  /**
   * 做出决策
   */
  makeDecision(
    player: Player,
    gameState: GameState
  ): { play: Play | null; pass: boolean } {
    const lastPlay = gameState.lastPlay;
    const lastPlayPlayerIndex = gameState.lastPlayPlayerIndex;
    
    // 判断上家是否是队友
    const isTeammateLastPlay = lastPlayPlayerIndex >= 0 
      ? gameState.players[lastPlayPlayerIndex].team === player.team
      : false;
    
    return this.strategy.decidePlay(
      player.hand,
      lastPlay,
      isTeammateLastPlay,
      gameState.mainRank || undefined,
      gameState.mainSuit || undefined
    );
  }
}
