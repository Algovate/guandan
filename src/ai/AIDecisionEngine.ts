import type { Play, Player, GameState } from '../game/types';
import { StrategyEngine } from '../game/ai/StrategyEngine';
import { createPlay } from '../game/CardTypes';
import type { AIPersonality } from '../game/ai/AIPersonality';
import { getPersonality, PersonalityType, getRandomPersonality, calculateThinkingTime } from '../game/ai/AIPersonality';
import type { AIDecision } from '../game/ai/DecisionExplainer';
import { DecisionExplainer } from '../game/ai/DecisionExplainer';
import { ProbabilityAnalyzer } from '../game/ai/ProbabilityAnalyzer';
import { CardTracker } from '../game/ai/CardTracker';

/**
 * AI情绪状态
 */
export const EmotionState = {
  CONFIDENT: 'confident',
  NORMAL: 'normal',
  ANXIOUS: 'anxious',
  EXCITED: 'excited'
} as const;

export type EmotionState = typeof EmotionState[keyof typeof EmotionState];

/**
 * AI决策结果（包含解释）
 */
export interface AIDecisionResult {
  play: Play | null;
  pass: boolean;
  explanation?: {
    type: string;
    reason: string;
    confidence: number;
    factors: string[];
    emoji: string;
  };
  thinkingTime: number;
  emotion: EmotionState;
}

/**
 * AI决策引擎 - 整合性格和解释系统
 * 集成概率分析和记牌功能，做出更智能的决策
 */
export class AIDecisionEngine {
  private personality: AIPersonality;
  private explainer: DecisionExplainer;
  private probabilityAnalyzer: ProbabilityAnalyzer | null = null;
  private cardTracker: CardTracker | null = null;

  constructor(personalityType?: PersonalityType) {
    this.personality = personalityType ? getPersonality(personalityType) : getRandomPersonality();
    this.explainer = new DecisionExplainer();
  }

  /**
   * 设置概率分析器和记牌器
   * 这些分析器应该在游戏开始时创建并共享
   */
  setAnalyzers(probabilityAnalyzer: ProbabilityAnalyzer, cardTracker: CardTracker): void {
    this.probabilityAnalyzer = probabilityAnalyzer;
    this.cardTracker = cardTracker;
  }

  setPersonality(personalityType: PersonalityType): void {
    this.personality = getPersonality(personalityType);
  }

  getPersonality(): AIPersonality {
    return this.personality;
  }

  /**
   * 做出决策并生成解释
   * 使用概率分析和记牌功能进行智能决策
   */
  makeDecisionWithExplanation(
    player: Player,
    gameState: GameState
  ): AIDecisionResult {
    // 计算决策复杂度
    const complexity = this.calculateComplexity(player, gameState);

    // 计算思考时间
    const thinkingTime = calculateThinkingTime(this.personality, complexity);

    // 获取情绪状态
    const emotion = this.getEmotionState(player, gameState);

    // 使用改进的 Strategy Engine 进行决策
    // 如果可用，传递概率分析器、记牌器和性格
    const cardsToPlay = StrategyEngine.decideMove(
      player,
      gameState,
      this.probabilityAnalyzer || undefined,
      this.cardTracker || undefined,
      this.personality
    );

    let play: Play | null = null;
    let pass = false;

    if (!cardsToPlay || cardsToPlay.length === 0) {
      pass = true;
    } else {
      play = createPlay(cardsToPlay);
      if (!play) {
        pass = true;
      }
    }

    // 如果使用了分析器，更新记牌器
    const playerIndex = gameState.players.findIndex(p => p.id === player.id);
    if (playerIndex >= 0 && this.cardTracker) {
      if (play) {
        this.cardTracker.trackPlayedCards(play.cards, playerIndex, play);
      } else if (pass) {
        // 记录过牌行为
        this.cardTracker.trackPass(playerIndex, gameState.lastPlay);
      }
    }

    // 构建AI决策对象
    const aiDecision: AIDecision = {
      play,
      pass,
      isTeammateMove: this.isTeammateLastPlay(player, gameState),
      isOpponentThreat: this.isOpponentThreat(gameState)
    };

    // 生成解释
    const explanation = play
      ? this.explainer.explainPlay(aiDecision, gameState, player)
      : this.explainer.explainPass(gameState, player);

    return {
      play,
      pass,
      explanation,
      thinkingTime,
      emotion
    };
  }

  /**
   * 简单的决策（不含解释，兼容旧代码）
   */
  makeDecision(
    player: Player,
    gameState: GameState
  ): { play: Play | null; pass: boolean } {
    const result = this.makeDecisionWithExplanation(player, gameState);
    return {
      play: result.play,
      pass: result.pass
    };
  }

  /**
   * 计算决策复杂度
   */
  private calculateComplexity(player: Player, gameState: GameState): number {
    let complexity = 0.5; // 基础复杂度

    // 手牌数越多越复杂
    complexity += Math.min(player.hand.length / 27, 0.3);

    // 有lastPlay时更复杂
    if (gameState.lastPlay) {
      complexity += 0.1;
    }

    // 关键时刻更复杂（有人快走完）
    const minCards = Math.min(...gameState.players.map(p => p.hand.length));
    if (minCards <= 5) {
      complexity += 0.2;
    }

    return Math.min(1, complexity);
  }

  /**
   * 获取AI情绪状态
   */
  private getEmotionState(player: Player, gameState: GameState): EmotionState {
    const playerIndex = gameState.players.findIndex(p => p.id === player.id);
    const teammateIndex = (playerIndex + 2) % 4;
    const teammate = gameState.players[teammateIndex];

    // 即将获胜
    if (player.hand.length <= 2 || teammate.hand.length <= 2) {
      return EmotionState.EXCITED;
    }

    // 计算优势
    const opponents = [
      gameState.players[(playerIndex + 1) % 4],
      gameState.players[(playerIndex + 3) % 4]
    ];

    const myTeamCards = player.hand.length + teammate.hand.length;
    const opponentCards = opponents[0].hand.length + opponents[1].hand.length;

    if (myTeamCards < opponentCards * 0.6) {
      return EmotionState.CONFIDENT;
    } else if (myTeamCards > opponentCards * 1.5) {
      return EmotionState.ANXIOUS;
    }

    return EmotionState.NORMAL;
  }

  /**
   * 判断是否队友刚出牌
   */
  private isTeammateLastPlay(player: Player, gameState: GameState): boolean {
    const playerIndex = gameState.players.findIndex(p => p.id === player.id);
    const teammateIndex = (playerIndex + 2) % 4;
    return gameState.lastPlayPlayerIndex === teammateIndex;
  }

  /**
   * 判断对手是否有威胁
   * 使用记牌器获取更准确的手牌数
   */
  private isOpponentThreat(gameState: GameState): boolean {
    const opponentIndices = [
      (gameState.currentPlayerIndex + 1) % 4,
      (gameState.currentPlayerIndex + 3) % 4
    ];

    // 如果记牌器可用，使用更准确的数据
    if (this.cardTracker) {
      return opponentIndices.some(idx => {
        const cardCount = this.cardTracker!.getPlayerCardCount(idx);
        return cardCount <= 5;
      });
    }

    // 回退到使用游戏状态中的手牌数
    return opponentIndices.some(idx => gameState.players[idx].hand.length <= 5);
  }
}