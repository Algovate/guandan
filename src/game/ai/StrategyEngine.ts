import type { GameState, Card, Player, Play } from '../types';
import { PlayType } from '../types';
import { findPossiblePlays, comparePlays, canBeat } from '../CardTypes';
import { HandEvaluator } from './HandEvaluator';
import { ProbabilityAnalyzer } from './ProbabilityAnalyzer';
import { CardTracker } from './CardTracker';
import { MCTSEngine } from './MCTSEngine';
import type { AIPersonality } from './AIPersonality';

/**
 * Strategy Engine - Main AI decision making logic
 * 集成概率分析和记牌功能，做出更智能的决策
 */
export class StrategyEngine {
  /**
   * Main decision making function
   * @param player 当前玩家
   * @param gameState 游戏状态
   * @param probabilityAnalyzer 概率分析器（可选）
   * @param cardTracker 记牌器（可选）
   * @param personality AI性格（可选）
   */
  static decideMove(
    player: Player,
    gameState: GameState,
    probabilityAnalyzer?: ProbabilityAnalyzer,
    cardTracker?: CardTracker,
    personality?: AIPersonality
  ): Card[] | null {
    const { lastPlay, lastPlayPlayerIndex, players } = gameState;
    const hand = player.hand;

    // If no cards, must pass
    if (hand.length === 0) return null;

    const handScore = HandEvaluator.evaluate(hand);
    const isStrongHand = handScore.totalScore > 300;
    const hasControlCards = handScore.controlCount >= 3;
    
    // 确定游戏阶段（开局/中局/残局）
    const gamePhase = this.determineGamePhase(gameState);

    // Determine if last play was from teammate
    const isTeammateLastPlay = lastPlay && lastPlayPlayerIndex >= 0 &&
      players[lastPlayPlayerIndex]?.team === player.team;

    // Get all possible plays
    const possiblePlays = findPossiblePlays(hand, lastPlay);
    const beatingPlays = possiblePlays.filter(p => lastPlay ? canBeat(p, lastPlay) : true);

    // If no last play, we are leading
    if (!lastPlay) {
      return this.chooseLeadPlay(player, possiblePlays, hand, gameState, probabilityAnalyzer);
    }

    // Teammate played last - usually pass unless we can finish
    if (isTeammateLastPlay) {
      // 如果手牌很少，考虑接牌走完
      if (hand.length <= 3 && beatingPlays.length > 0) {
        return beatingPlays[0].cards;
      }
      // 如果手牌很少且队友也快走完，可以接牌
      const playerIndex = players.findIndex(p => p.id === player.id);
      if (playerIndex >= 0 && cardTracker) {
        const teammateIndex = (playerIndex + 2) % 4;
        const teammateCards = cardTracker.getPlayerCardCount(teammateIndex);
        if (teammateCards <= 3 && hand.length <= 5 && beatingPlays.length > 0) {
          return beatingPlays[0].cards;
        }
      }
      return null; // Pass to let teammate continue
    }

    // Opponent played - decide whether to beat or pass
    if (beatingPlays.length === 0) {
      return null; // Cannot beat, must pass
    }

    // 判断是否应该使用MCTS深度搜索
    const shouldUseMCTS = this.shouldUseMCTS(player, gameState, beatingPlays.length);
    
    // 如果应该使用MCTS，进行深度搜索
    if (shouldUseMCTS) {
      const mctsResult = this.useMCTSForDecision(player, gameState);
      if (mctsResult) {
        // MCTS返回的结果作为参考，但仍需要与概率分析结合
        // 如果MCTS结果在可选出牌中，优先考虑
        const mctsPlay = beatingPlays.find(p => 
          p.cards.length === mctsResult.length &&
          p.cards.every((card, idx) => card.id === mctsResult[idx]?.id)
        );
        if (mctsPlay && probabilityAnalyzer) {
          // 验证MCTS结果的风险
          const playerIndex = players.findIndex(p => p.id === player.id);
          if (playerIndex >= 0) {
            const risk = probabilityAnalyzer.evaluatePlayRisk(mctsPlay, gameState, playerIndex);
            if (risk.shouldPlay || hand.length <= 5) {
              return mctsPlay.cards;
            }
          }
        }
      }
    }

    // 使用概率分析进行风险评估
    if (probabilityAnalyzer && cardTracker) {
      const playerIndex = players.findIndex(p => p.id === player.id);
      if (playerIndex >= 0) {
        // 评估每个可能的出牌
        const playEvaluations = beatingPlays.map(play => {
          const risk = probabilityAnalyzer.evaluatePlayRisk(play, gameState, playerIndex);
          const winProb = probabilityAnalyzer.calculateWinProbability(gameState, player);
          
          // 计算综合得分
          let score = 0;
          
          // 风险评估：风险越低越好（根据性格调整）
          let riskWeight = 30;
          if (personality) {
            riskWeight *= personality.riskTolerance; // 激进型更容忍风险
          }
          
          if (risk.riskLevel === 'low') {
            score += riskWeight;
          } else if (risk.riskLevel === 'medium') {
            score += riskWeight * 0.33;
          } else {
            score -= riskWeight * 0.67; // 高风险
          }
          
          // 胜率：胜率越高，越应该出牌
          score += winProb * 20;
          
          // 手牌数：越少越应该出牌
          if (hand.length <= 3) {
            score += 25; // 即将走完
          } else if (hand.length <= 5) {
            score += 15;
          }
          
          // 炸弹策略：根据性格调整
          if (play.type === PlayType.BOMB || play.type === PlayType.FOUR_KINGS) {
            const shouldUseBomb = probabilityAnalyzer.shouldUseBomb(gameState, player, play);
            let bombScore = 0;
            if (shouldUseBomb) {
              bombScore = 40; // 应该使用炸弹
            } else {
              bombScore = -30; // 不应该使用炸弹，保留
            }
            
            // 根据性格调整：激进型更容易用炸弹，保守型更谨慎
            if (personality) {
              bombScore *= (1 - personality.bombThreshold); // 门槛越低，越容易用
            }
            score += bombScore;
          }
          
          // 队友能帮助：如果队友能接牌，可以更激进（配合型更重视）
          if (risk.teammateCanHelpProbability > 0.6) {
            let helpScore = 15;
            if (personality) {
              helpScore *= personality.teamworkPriority; // 配合型更重视队友
            }
            score += helpScore;
          }
          
          // 根据游戏阶段调整策略
          score = this.adjustScoreByGamePhase(score, gamePhase, personality);
          
          return { play, score, risk };
        });
        
        // 按得分排序
        playEvaluations.sort((a, b) => b.score - a.score);
        
        // 如果最高分的出牌风险可接受，选择它
        const bestPlay = playEvaluations[0];
        if (bestPlay && bestPlay.risk.shouldPlay) {
          return bestPlay.play.cards;
        }
        
        // 如果最佳出牌风险过高，尝试找风险较低的选择
        const safePlay = playEvaluations.find(e => e.risk.riskLevel === 'low');
        if (safePlay) {
          return safePlay.play.cards;
        }
        
        // 如果所有出牌风险都很高，但手牌很少，还是出牌
        if (hand.length <= 5) {
          return bestPlay.play.cards;
        }
        
        // 否则不出
        return null;
      }
    }

    // 回退到简单策略（如果没有分析器）
    // Strong hand or few cards left - be aggressive
    if (isStrongHand || hand.length <= 5 || hasControlCards) {
      return beatingPlays[beatingPlays.length - 1].cards; // Play strongest
    }

    // Normal situation - be conservative, play weakest beating card
    return beatingPlays[0].cards;
  }

  /**
   * Choose which play to lead with
   * 选择首出牌，考虑手牌评估和策略
   */
  private static chooseLeadPlay(
    player: Player,
    possiblePlays: Play[],
    hand: Card[],
    gameState: GameState,
    probabilityAnalyzer?: ProbabilityAnalyzer
  ): Card[] | null {
    if (possiblePlays.length === 0) return null;

    // If few cards, play biggest combo to try to finish
    if (hand.length <= 5) {
      possiblePlays.sort((a, b) => comparePlays(b, a));
      return possiblePlays[0].cards;
    }

    // 使用概率分析选择最佳首出牌
    if (probabilityAnalyzer) {
      const playerIndex = gameState.players.findIndex(p => p.id === player.id);
      if (playerIndex >= 0) {
        // 评估每个可能的首出牌
        const playEvaluations = possiblePlays.map(play => {
          // 创建临时游戏状态来评估风险
          const tempGameState = { ...gameState, lastPlay: play };
          const risk = probabilityAnalyzer.evaluatePlayRisk(play, tempGameState, playerIndex);
          
          let score = 0;
          
          // 优先选择风险低、牌型好的出牌
          if (risk.riskLevel === 'low') {
            score += 20;
          } else if (risk.riskLevel === 'medium') {
            score += 5;
          }
          
          // 牌型价值
          switch (play.type) {
            case PlayType.STRAIGHT_FLUSH:
              score += 15;
              break;
            case PlayType.STRAIGHT:
              score += 10;
              break;
            case PlayType.TRIPLE_PAIR:
            case PlayType.PLATE:
              score += 8;
              break;
            case PlayType.TRIPLE_WITH_PAIR:
              score += 6;
              break;
            case PlayType.TRIPLE:
              score += 4;
              break;
            case PlayType.PAIR:
              score += 2;
              break;
            case PlayType.SINGLE:
              score += 1;
              break;
            case PlayType.BOMB:
            case PlayType.FOUR_KINGS:
              // 首出牌通常不使用炸弹
              score -= 30;
              break;
          }
          
          return { play, score, risk };
        });
        
        // 按得分排序，选择得分最高的
        playEvaluations.sort((a, b) => b.score - a.score);
        const bestPlay = playEvaluations[0];
        
        // 如果最佳选择不是炸弹，选择它
        if (bestPlay && bestPlay.play.type !== PlayType.BOMB && 
            bestPlay.play.type !== PlayType.FOUR_KINGS) {
          return bestPlay.play.cards;
        }
      }
    }

    // 回退策略：Categorize plays
    const straights = possiblePlays.filter(p =>
      p.type === PlayType.STRAIGHT || p.type === PlayType.STRAIGHT_FLUSH
    );
    const triples = possiblePlays.filter(p =>
      p.type === PlayType.TRIPLE || p.type === PlayType.TRIPLE_WITH_PAIR ||
      p.type === PlayType.TRIPLE_PAIR || p.type === PlayType.PLATE
    );
    const pairs = possiblePlays.filter(p => p.type === PlayType.PAIR);
    const singles = possiblePlays.filter(p => p.type === PlayType.SINGLE);

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

  /**
   * 判断是否应该使用MCTS进行深度搜索
   * 在关键时刻使用：手牌少、关键决策点等
   */
  private static shouldUseMCTS(
    player: Player,
    gameState: GameState,
    possiblePlaysCount: number
  ): boolean {
    // 1. 手牌很少时（<= 8张），使用MCTS
    if (player.hand.length <= 8) {
      return true;
    }

    // 2. 关键时刻：有人快走完
    const minCards = Math.min(...gameState.players.map(p => p.hand.length));
    if (minCards <= 5) {
      return true;
    }

    // 3. 可选出牌较少时（<= 3个），使用MCTS深度分析
    if (possiblePlaysCount <= 3 && possiblePlaysCount > 0) {
      return true;
    }

    // 4. 游戏后期（已出牌数 > 60）
    const totalCards = 108; // 两副牌
    const estimatedPlayedCards = totalCards - gameState.players.reduce((sum, p) => sum + p.hand.length, 0);
    if (estimatedPlayedCards > 60) {
      return true;
    }

    return false;
  }

  /**
   * 使用MCTS进行决策
   */
  private static useMCTSForDecision(
    player: Player,
    gameState: GameState
  ): Card[] | null {
    try {
      const mctsEngine = new MCTSEngine();
      // 根据手牌数调整时间限制
      const timeLimit = player.hand.length <= 5 ? 2000 : 1000;
      const result = mctsEngine.search(gameState, timeLimit);
      return result;
    } catch (error) {
      // MCTS失败时回退到常规策略
      console.warn('MCTS search failed, falling back to regular strategy:', error);
      return null;
    }
  }

  /**
   * 确定游戏阶段
   */
  private static determineGamePhase(gameState: GameState): 'early' | 'mid' | 'late' {
    const totalCards = 108;
    const totalRemainingCards = gameState.players.reduce((sum, p) => sum + p.hand.length, 0);
    const playedCards = totalCards - totalRemainingCards;
    const progress = playedCards / totalCards;

    if (progress < 0.3) return 'early';  // 开局
    if (progress < 0.7) return 'mid';    // 中局
    return 'late';                        // 残局
  }

  /**
   * 根据游戏阶段调整得分
   */
  private static adjustScoreByGamePhase(
    score: number,
    phase: 'early' | 'mid' | 'late',
    personality?: AIPersonality
  ): number {
    let multiplier = 1.0;

    switch (phase) {
      case 'early':
        // 开局：保守一些，保留大牌
        multiplier = 0.9;
        break;
      case 'mid':
        // 中局：正常策略
        multiplier = 1.0;
        break;
      case 'late':
        // 残局：更激进，尽快出完
        multiplier = 1.2;
        break;
    }

    // 根据性格调整
    if (personality) {
      multiplier *= (0.8 + personality.aggressiveness * 0.4); // 0.8-1.2之间
    }

    return score * multiplier;
  }

}
