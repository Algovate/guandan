import type { GameState, Card, Play, Player } from '../types';
import { AIDifficulty, PlayType } from '../types';
import { findPossiblePlays, comparePlays, canBeat } from '../CardTypes';
import { HandEvaluator } from './HandEvaluator';
import { CardTracker } from './CardTracker';
import { ProbabilityAnalyzer } from './ProbabilityAnalyzer';
import { MCTSEngine } from './MCTSEngine';
import type { AIPersonality } from './AIPersonality';
import { PersonalityType, getPersonality } from './AIPersonality';

/**
 * 增强的策略引擎 - 整合所有AI模块
 */
export class StrategyEngine {
  private static cardTracker: CardTracker | null = null;
  private static probabilityAnalyzer: ProbabilityAnalyzer | null = null;
  private static mctsEngine: MCTSEngine | null = null;

  /**
   * 初始化AI引擎
   */
  static initialize(gameState: GameState): void {
    this.cardTracker = new CardTracker(gameState.deck, gameState.players);
    this.probabilityAnalyzer = new ProbabilityAnalyzer(this.cardTracker);
    this.mctsEngine = new MCTSEngine();
  }

  /**
   * 记录出牌
   */
  static trackPlay(cards: Card[], playerIndex: number): void {
    if (this.cardTracker) {
      this.cardTracker.trackPlayedCards(cards, playerIndex);
    }
  }

  /**
   * 主决策函数 - 整合所有新功能
   */
  static decideMove(
    player: Player,
    gameState: GameState,
    difficulty: AIDifficulty = AIDifficulty.MEDIUM,
    personality?: AIPersonality
  ): Card[] | null {
    // 确保初始化
    if (!this.cardTracker || !this.probabilityAnalyzer) {
      this.initialize(gameState);
    }

    const { hand } = player;
    const { lastPlay, lastPlayPlayerIndex, mainRank, mainSuit, players } = gameState;

    // 如果没有性格，使用默认
    const aiPersonality = personality || getPersonality(PersonalityType.BALANCED);

    // 评估手牌
    const handScore = HandEvaluator.evaluate(hand, mainRank || undefined, mainSuit || undefined);

    // 1. 首出（没有lastPlay或自己是上家）
    if (!lastPlay || lastPlayPlayerIndex === -1 || lastPlayPlayerIndex === gameState.currentPlayerIndex) {
      return this.decideLeadMove(player, gameState, handScore, aiPersonality, difficulty);
    }

    // 2. 跟牌
    const isTeammate = this.isTeammate(player, lastPlayPlayerIndex, players);

    // 查找可出的牌
    const possiblePlays = findPossiblePlays(hand, lastPlay, mainRank || undefined, mainSuit || undefined);
    const beatingPlays = possiblePlays.filter(p => canBeat(p, lastPlay, mainRank || undefined, mainSuit || undefined));

    if (beatingPlays.length === 0) {
      return null; // 必须过牌
    }

    // 队友逻辑
    if (isTeammate) {
      return this.handleTeammatePlay(
        player,
        gameState,
        lastPlay,
        beatingPlays,
        aiPersonality
      );
    }

    // 对手逻辑
    return this.handleOpponentPlay(
      player,
      gameState,
      lastPlay,
      beatingPlays,
      handScore,
      aiPersonality,
      difficulty
    );
  }

  /**
   * 首出决策
   */
  private static decideLeadMove(
    player: Player,
    gameState: GameState,
    _handScore: any,
    personality: AIPersonality,
    difficulty: AIDifficulty
  ): Card[] {
    const { hand } = player;
    const { mainRank, mainSuit } = gameState;

    // 困难AI使用MCTS
    if (difficulty === AIDifficulty.HARD && this.mctsEngine) {
      const mctsResult = this.mctsEngine.search(gameState, 1000);
      if (mctsResult) {
        return mctsResult;
      }
    }

    // 查找所有可能的首出玩法
    const possiblePlays = findPossiblePlays(hand, null, mainRank || undefined, mainSuit || undefined);

    if (possiblePlays.length === 0) return [];

    // 根据手牌数决策
    if (hand.length <= 5) {
      // 手牌少，积极出完
      return this.findFinishingPlay(possiblePlays, hand);
    }

    // 根据性格调整策略
    if (personality.type === PersonalityType.AGGRESSIVE) {
      // 激进：优先出对子、三张等控制牌
      return this.findAggressiveLeadPlay(possiblePlays);
    } else if (personality.type === PersonalityType.CONSERVATIVE) {
      // 保守：出最小的单张或对子
      return this.findConservativeLeadPlay(possiblePlays, mainRank, mainSuit);
    }

    // 默认策略：优先顺子，其次小牌
    return this.findBalancedLeadPlay(possiblePlays, mainRank, mainSuit);
  }

  /**
   * 处理队友出牌
   */
  private static handleTeammatePlay(
    player: Player,
    gameState: GameState,
    lastPlay: Play,
    beatingPlays: Play[],
    personality: AIPersonality
  ): Card[] | null {
    const { hand } = player;
    const playerIndex = gameState.players.findIndex(p => p.id === player.id);

    // 配合型性格更倾向于让牌
    if (personality.type === PersonalityType.COOPERATIVE) {
      // 只在手牌很少时才帮队友
      if (hand.length >= 5) {
        return null;
      }
    }

    // 如果队友出的是炸弹或大牌，让牌
    if (this.isStrongPlay(lastPlay)) {
      // 除非自己能直接走完
      if (beatingPlays.some(p => p.cards.length === hand.length)) {
        return beatingPlays.find(p => p.cards.length === hand.length)!.cards;
      }
      return null;
    }

    // 如果对手即将走完，必须帮队友压制
    const opponents = [
      (playerIndex + 1) % 4,
      (playerIndex + 3) % 4
    ];
    const hasOpponentNearWin = opponents.some(idx =>
      this.cardTracker?.getPlayerCardCount(idx)! <= 3
    );

    if (hasOpponentNearWin) {
      // 出最小的能压过的牌
      beatingPlays.sort((a, b) => comparePlays(a, b, gameState.mainRank || undefined, gameState.mainSuit || undefined));
      return beatingPlays[0].cards;
    }

    // 一般情况让牌
    return null;
  }

  /**
   * 处理对手出牌
   */
  private static handleOpponentPlay(
    player: Player,
    gameState: GameState,
    _lastPlay: Play,
    beatingPlays: Play[],
    handScore: any,
    personality: AIPersonality,
    difficulty: AIDifficulty
  ): Card[] | null {
    const { hand } = player;
    const { mainRank, mainSuit } = gameState;
    const playerIndex = gameState.players.findIndex(p => p.id === player.id);
    const opponentIndex = gameState.lastPlayPlayerIndex;

    // 排序：从小到大
    beatingPlays.sort((a, b) => comparePlays(a, b, mainRank || undefined, mainSuit || undefined));

    // 检查炸弹时机
    const bombPlays = beatingPlays.filter(p =>
      p.type === PlayType.BOMB || p.type === PlayType.FOUR_KINGS
    );

    if (bombPlays.length > 0 && this.probabilityAnalyzer) {
      const shouldBomb = this.probabilityAnalyzer.shouldUseBomb(gameState, player, bombPlays[0]);

      if (shouldBomb) {
        // 根据性格调整炸弹决策
        const bombThreshold = personality.bombThreshold;
        if (Math.random() > bombThreshold) {
          return bombPlays[0].cards;
        }
      }
    }

    // 过滤掉炸弹，看是否有普通牌能压
    const normalPlays = beatingPlays.filter(p =>
      p.type !== PlayType.BOMB && p.type !== PlayType.FOUR_KINGS
    );

    if (normalPlays.length === 0) {
      // 只have炸弹能压，但不值得用
      return null;
    }

    // 使用概率分析评估风险
    if (this.probabilityAnalyzer && difficulty === AIDifficulty.HARD) {
      const riskAssessment = this.probabilityAnalyzer.evaluatePlayRisk(
        normalPlays[0],
        gameState,
        playerIndex
      );

      // 根据性格和风险评估决策
      if (!riskAssessment.shouldPlay) {
        // 高风险且不建议出牌
        if (personality.riskTolerance < 0.5) {
          return null; // 保守型不出
        }
      }
    }

    // 对手即将走完，必须压制
    const opponentHandCount = this.cardTracker?.getPlayerCardCount(opponentIndex) || 999;
    if (opponentHandCount <= 3) {
      return normalPlays[0].cards;
    }

    // 根据性格决策
    if (personality.type === PersonalityType.AGGRESSIVE) {
      // 激进：倾向于压牌
      if (personality.aggressiveness > Math.random()) {
        return normalPlays[0].cards;
      }
    } else if (personality.type === PersonalityType.CONSERVATIVE) {
      // 保守：只在有明显优势时出
      if (handScore.totalScore > 70 || hand.length < 8) {
        return normalPlays[0].cards;
      }
      return null;
    }

    // 默认：出小牌
    return normalPlays[0].cards;
  }

  // ==================== 辅助方法 ====================

  private static findFinishingPlay(possiblePlays: Play[], hand: Card[]): Card[] {
    // 优先找能一次出完的
    const finishPlay = possiblePlays.find(p => p.cards.length === hand.length);
    if (finishPlay) return finishPlay.cards;

    // 否则出能减少最多牌的
    possiblePlays.sort((a, b) => b.cards.length - a.cards.length);
    return possiblePlays[0].cards;
  }

  private static findAggressiveLeadPlay(possiblePlays: Play[]): Card[] {
    // 优先对子、三张等
    const triples = possiblePlays.filter(p =>
      p.type === PlayType.TRIPLE || p.type === PlayType.TRIPLE_WITH_PAIR
    );
    if (triples.length > 0) return triples[0].cards;

    const pairs = possiblePlays.filter(p => p.type === PlayType.PAIR);
    if (pairs.length > 0) return pairs[0].cards;

    return possiblePlays[0].cards;
  }

  private static findConservativeLeadPlay(
    possiblePlays: Play[],
    mainRank?: any,
    mainSuit?: any
  ): Card[] {
    // 出最小的单张或对子
    const singles = possiblePlays.filter(p => p.type === PlayType.SINGLE);
    if (singles.length > 0) {
      singles.sort((a, b) => comparePlays(a, b, mainRank, mainSuit));
      return singles[0].cards;
    }

    const pairs = possiblePlays.filter(p => p.type === PlayType.PAIR);
    if (pairs.length > 0) {
      pairs.sort((a, b) => comparePlays(a, b, mainRank, mainSuit));
      return pairs[0].cards;
    }

    return possiblePlays[0].cards;
  }

  private static findBalancedLeadPlay(
    possiblePlays: Play[],
    mainRank?: any,
    mainSuit?: any
  ): Card[] {
    // 优先顺子
    const straights = possiblePlays.filter(p =>
      p.type === PlayType.STRAIGHT || p.type === PlayType.STRAIGHT_FLUSH
    );
    if (straights.length > 0) return straights[0].cards;

    // 其次三带二
    const triples = possiblePlays.filter(p => p.type === PlayType.TRIPLE_WITH_PAIR);
    if (triples.length > 0) return triples[0].cards;

    // 再出小对子
    const pairs = possiblePlays.filter(p => p.type === PlayType.PAIR);
    if (pairs.length > 0) {
      pairs.sort((a, b) => comparePlays(a, b, mainRank, mainSuit));
      return pairs[0].cards;
    }

    // 最后出小单张
    const singles = possiblePlays.filter(p => p.type === PlayType.SINGLE);
    if (singles.length > 0) {
      singles.sort((a, b) => comparePlays(a, b, mainRank, mainSuit));
      return singles[0].cards;
    }

    return possiblePlays[0].cards;
  }

  private static isTeammate(me: Player, otherIndex: number, players: Player[]): boolean {
    const myIndex = players.findIndex(p => p.id === me.id);
    return (myIndex % 2) === (otherIndex % 2);
  }

  private static isStrongPlay(play: Play): boolean {
    if (play.type === PlayType.BOMB || play.type === PlayType.FOUR_KINGS) return true;
    // 可以扩展：判断是否是大牌
    return false;
  }
}
