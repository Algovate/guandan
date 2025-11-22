import type { Player, GameState, Card } from '../game/types';
import { AIDecisionEngine } from './AIDecisionEngine';
import { PersonalityType } from '../game/ai/AIPersonality';
import { delay } from '../utils/helpers';

/**
 * AI玩家管理器
 */
export class AIPlayerManager {
  private decisionEngine: AIDecisionEngine;
  
  constructor(personalityType?: PersonalityType) {
    this.decisionEngine = new AIDecisionEngine(personalityType);
  }
  
  setPersonality(personalityType: PersonalityType): void {
    this.decisionEngine.setPersonality(personalityType);
  }
  
  getPersonality() {
    return this.decisionEngine.getPersonality();
  }
  
  /**
   * AI玩家做出行动
   * @returns 返回要出的牌，或null表示不出
   */
  async makeMove(
    player: Player,
    gameState: GameState,
    onPlay: (playerIndex: number, cards: Card[]) => { success: boolean; error?: string },
    onPass: (playerIndex: number) => { success: boolean; error?: string }
  ): Promise<void> {
    // 模拟思考时间
    const thinkTime = 500 + Math.random() * 1000;
    await delay(thinkTime);
    
    const playerIndex = gameState.players.indexOf(player);
    if (playerIndex === -1) return;
    
    const decision = this.decisionEngine.makeDecision(player, gameState);
    
    if (decision.pass || !decision.play) {
      onPass(playerIndex);
    } else {
      onPlay(playerIndex, decision.play.cards);
    }
  }
}
