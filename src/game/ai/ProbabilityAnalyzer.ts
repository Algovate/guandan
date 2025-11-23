import type { Card, Player, GameState, Play } from '../types';
import { PlayType } from '../types';
import { CardTracker } from './CardTracker';

/**
 * 风险评估结果
 */
export interface RiskAssessment {
    riskLevel: 'low' | 'medium' | 'high';
    beatenProbability: number;      // 被压概率 0-1
    teammateCanHelpProbability: number; // 队友能接牌概率 0-1
    shouldPlay: boolean;
    reason: string;
}

/**
 * 对手反应预测
 */
export interface ResponsePrediction {
    willBeat: boolean;
    confidence: number;  // 0-1
    likelyPlayType: PlayType | null;
}

/**
 * 概率分析模块 - 计算胜率、风险评估
 */
export class ProbabilityAnalyzer {
    private cardTracker: CardTracker;

    constructor(cardTracker: CardTracker) {
        this.cardTracker = cardTracker;
    }

    /**
     * 计算当前局面胜率
     * 基于：手牌数、牌力、炸弹数、队友状态、控制权等
     */
    calculateWinProbability(gameState: GameState, player: Player): number {
        const playerIndex = gameState.players.findIndex(p => p.id === player.id);
        if (playerIndex === -1) return 0.5;

        const teammateIndex = (playerIndex + 2) % 4; // 对面是队友
        const teammate = gameState.players[teammateIndex];
        const opponentIndices = this.getOpponentIndices(playerIndex);

        let probability = 0.5; // 基础50%

        // 1. 手牌数优势（越少越好，权重更高）
        const avgOpponentCards = this.getAverageOpponentCards(gameState, playerIndex);
        const myTeamCards = player.hand.length + teammate.hand.length;
        const opponentTeamCards = opponentIndices.reduce((sum, idx) =>
            sum + this.cardTracker.getPlayerCardCount(idx), 0
        );

        if (myTeamCards < opponentTeamCards) {
            const advantage = (opponentTeamCards - myTeamCards) / 54; // 54是总牌数
            probability += Math.min(0.25, advantage * 0.5); // 最多增加25%
        } else {
            const disadvantage = (myTeamCards - opponentTeamCards) / 54;
            probability -= Math.min(0.25, disadvantage * 0.5); // 最多减少25%
        }

        // 2. 个人手牌数优势（额外权重）
        if (player.hand.length < avgOpponentCards) {
            const advantage = (avgOpponentCards - player.hand.length) / 27; // 27是初始手牌数
            probability += Math.min(0.1, advantage * 0.3);
        }

        // 3. 炸弹数量估计（更精确）
        const myBombCount = this.estimatePlayerBombs(player.hand);
        const teammateBombCount = this.estimatePlayerBombs(teammate.hand);
        const totalMyBombs = myBombCount + teammateBombCount;

        const totalOpponentBombs = opponentIndices.reduce((sum, idx) =>
            sum + this.cardTracker.estimateBombCount(idx, gameState), 0
        );

        probability += (totalMyBombs - totalOpponentBombs) * 0.12; // 炸弹优势

        // 4. 控制权（最后出牌的是我方）
        if (gameState.lastPlayPlayerIndex === playerIndex ||
            gameState.lastPlayPlayerIndex === teammateIndex) {
            probability += 0.08; // 有控制权
        } else {
            probability -= 0.05; // 失去控制权
        }

        // 5. 接近胜利的奖励
        if (player.hand.length <= 3) {
            probability += 0.15; // 即将走完
        } else if (player.hand.length <= 5) {
            probability += 0.08; // 接近走完
        }

        if (teammate.hand.length <= 3) {
            probability += 0.1; // 队友即将走完
        }

        // 6. 对手接近胜利的惩罚
        const opponentNearWin = opponentIndices.some(idx =>
            this.cardTracker.getPlayerCardCount(idx) <= 3
        );
        if (opponentNearWin) {
            probability -= 0.12; // 对手即将走完
        }
        
        // 7. 牌型优势评估（新增）
        const myHandStructure = this.analyzeHandStructure(player.hand);
        const teammateHandStructure = this.analyzeHandStructure(teammate.hand);
        const myTeamStructureScore = myHandStructure + teammateHandStructure;
        
        // 估算对手牌型（使用CardTracker的推断）
        let opponentStructureScore = 0;
        opponentIndices.forEach(idx => {
            const inference = this.cardTracker.inferHandStructure(idx, gameState);
            opponentStructureScore += inference.likelyBombs * 20 + 
                                     inference.likelyStraights * 10 +
                                     inference.likelyTriples * 5 +
                                     (inference.hasControlCards ? 10 : 0);
        });
        
        if (myTeamStructureScore > opponentStructureScore) {
            probability += 0.05; // 牌型优势
        } else if (myTeamStructureScore < opponentStructureScore * 0.7) {
            probability -= 0.05; // 牌型劣势
        }
        
        // 8. 控制权深度分析（新增）
        // 如果连续多轮有控制权，优势更大
        if (gameState.lastPlayPlayerIndex === playerIndex ||
            gameState.lastPlayPlayerIndex === teammateIndex) {
            // 检查是否连续控制
            const recentHistory = this.getRecentPlayHistory(gameState);
            const consecutiveControl = this.countConsecutiveControl(recentHistory, playerIndex, teammateIndex);
            if (consecutiveControl >= 2) {
                probability += 0.03 * consecutiveControl; // 连续控制奖励
            }
        }

        // 限制在 0-1 范围
        return Math.max(0, Math.min(1, probability));
    }

    /**
     * 评估出牌风险
     */
    evaluatePlayRisk(
        play: Play,
        gameState: GameState,
        playerIndex: number
    ): RiskAssessment {
        const opponentIndices = this.getOpponentIndices(playerIndex);

        // 计算被压概率
        let beatenProbability = 0;
        opponentIndices.forEach(oppIndex => {
            const oppCardCount = this.cardTracker.getPlayerCardCount(oppIndex);
            if (oppCardCount > 0) {
                beatenProbability += this.estimateBeatenProbability(play, oppIndex, gameState);
            }
        });
        beatenProbability = beatenProbability / opponentIndices.length;

        // 计算队友能接牌概率
        const teammateIndex = (playerIndex + 2) % 4;
        const teammateCanHelpProbability = this.estimateTeammateCanHelp(
            play,
            teammateIndex,
            gameState
        );

        // 综合判断
        let riskLevel: 'low' | 'medium' | 'high';
        let shouldPlay = true;
        let reason = '';

        if (beatenProbability < 0.3) {
            riskLevel = 'low';
            reason = '出牌较安全，对手难以压制';
        } else if (beatenProbability < 0.7) {
            riskLevel = 'medium';
            reason = '出牌有一定风险';
            // 如果队友能帮忙，降低风险
            if (teammateCanHelpProbability > 0.6) {
                riskLevel = 'low';
                reason = '队友可能能接牌，风险可控';
            }
        } else {
            riskLevel = 'high';
            reason = '出牌风险较高，很可能被压';
            // 高风险时考虑不出
            if (teammateCanHelpProbability < 0.4) {
                shouldPlay = false;
                reason = '风险过高且队友难以帮助';
            }
        }

        return {
            riskLevel,
            beatenProbability,
            teammateCanHelpProbability,
            shouldPlay,
            reason
        };
    }

    /**
     * 判断是否应该使用炸弹（改进版）
     */
    shouldUseBomb(
        gameState: GameState,
        player: Player,
        bombPlay: Play
    ): boolean {
        const playerIndex = gameState.players.findIndex(p => p.id === player.id);
        if (playerIndex === -1) return false;

        const opponentIndices = this.getOpponentIndices(playerIndex);
        const teammateIndex = (playerIndex + 2) % 4;

        // 1. 对手即将走完（剩余牌数 <= 3）- 最高优先级
        const hasOpponentNearWin = opponentIndices.some(idx =>
            this.cardTracker.getPlayerCardCount(idx) <= 3
        );
        if (hasOpponentNearWin) {
            // 如果对手只剩1-2张，必须用炸弹阻止
            const criticalOpponent = opponentIndices.find(idx =>
                this.cardTracker.getPlayerCardCount(idx) <= 2
            );
            if (criticalOpponent !== undefined) {
                return true;
            }
        }

        // 2. 自己即将走完（剩余牌数 <= 5）
        if (player.hand.length <= 5) {
            // 如果使用炸弹后能走完，优先使用
            if (player.hand.length - bombPlay.cards.length <= 0) {
                return true;
            }
            // 如果队友也快走完，可以更激进
            const teammate = gameState.players[teammateIndex];
            if (teammate.hand.length <= 5) {
                return true;
            }
        }

        // 3. 胜率分析（更细致的判断）
        const winProb = this.calculateWinProbability(gameState, player);
        if (winProb < 0.25) {
            // 严重劣势时，炸弹可能是转机
            return true;
        }
        if (winProb > 0.75) {
            // 明显优势时，保留炸弹可能更好（除非能直接获胜）
            if (player.hand.length > 8) {
                return false;
            }
        }

        // 4. 对手炸弹分析（使用牌型推断）
        let opponentBombCount = 0;
        let opponentHasBiggerBomb = false;
        opponentIndices.forEach(idx => {
            const inference = this.cardTracker.inferHandStructure(idx, gameState);
            opponentBombCount += inference.likelyBombs;
            // 检查对手是否有更大的炸弹
            if (bombPlay.type === PlayType.BOMB && bombPlay.cards.length < 6) {
                // 如果对手可能有6张以上的炸弹，我们的炸弹可能被压
                if (inference.likelyBombs > 1) {
                    opponentHasBiggerBomb = true;
                }
            }
        });
        
        if (opponentBombCount > 1.5) {
            // 对手炸弹多，尽早用掉（避免被更大的炸弹压）
            return true;
        }
        
        if (opponentHasBiggerBomb && bombPlay.cards.length < 6) {
            // 对手可能有更大的炸弹，小炸弹应该尽早用
            return true;
        }

        // 5. 当前出牌的重要性（新增）
        // 如果当前出的是关键牌（如大牌、组合牌），用炸弹保护
        if (gameState.lastPlay) {
            const lastPlayType = gameState.lastPlay.type;
            // 如果对手出了大牌型，考虑用炸弹
            if (lastPlayType === PlayType.STRAIGHT_FLUSH || 
                lastPlayType === PlayType.BOMB ||
                (lastPlayType === PlayType.STRAIGHT && gameState.lastPlay.cards.length >= 5)) {
                // 如果队友接不了，且我们有炸弹，考虑使用
                const teammateCanHelp = this.estimateTeammateCanHelp(
                    gameState.lastPlay,
                    teammateIndex,
                    gameState
                );
                if (teammateCanHelp < 0.4 && winProb < 0.6) {
                    return true;
                }
            }
        }

        // 6. 炸弹大小考虑（新增）
        // 小炸弹（4张）应该更早使用，大炸弹（6张+）可以保留
        if (bombPlay.type === PlayType.FOUR_KINGS) {
            // 四王应该谨慎使用，除非关键时刻
            return hasOpponentNearWin || player.hand.length <= 3;
        }
        
        if (bombPlay.cards.length >= 6) {
            // 大炸弹可以保留更久
            if (winProb > 0.5 && player.hand.length > 8) {
                return false;
            }
        }

        return false;
    }
    
    /**
     * 分析手牌结构得分（辅助方法）
     */
    private analyzeHandStructure(hand: Card[]): number {
        // 简化：基于手牌数、炸弹数等
        let score = 0;
        const bombCount = this.estimatePlayerBombs(hand);
        score += bombCount * 20;
        score += (27 - hand.length) * 2; // 手牌越少越好
        return score;
    }
    
    /**
     * 获取最近的出牌历史（辅助方法）
     */
    private getRecentPlayHistory(_gameState: GameState): Array<{ playerIndex: number; hasPlay: boolean }> {
        // 简化实现：返回最近几轮的信息
        // 实际可以从gameState.playHistory或CardTracker获取
        return [];
    }
    
    /**
     * 计算连续控制轮数（辅助方法）
     */
    private countConsecutiveControl(
        history: Array<{ playerIndex: number; hasPlay: boolean }>,
        playerIndex: number,
        teammateIndex: number
    ): number {
        let count = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].hasPlay && 
                (history[i].playerIndex === playerIndex || history[i].playerIndex === teammateIndex)) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    /**
     * 预测对手反应
     */
    predictOpponentResponse(
        play: Play,
        opponentIndex: number,
        gameState: GameState
    ): ResponsePrediction {
        const oppCardCount = this.cardTracker.getPlayerCardCount(opponentIndex);

        if (oppCardCount === 0) {
            return { willBeat: false, confidence: 1, likelyPlayType: null };
        }

        // 简化预测：基于牌型和剩余牌数
        const beatenProb = this.estimateBeatenProbability(play, opponentIndex, gameState);

        return {
            willBeat: beatenProb > 0.5,
            confidence: Math.abs(beatenProb - 0.5) * 2, // 转换为信心值
            likelyPlayType: play.type // 简化：假设对手用相同牌型
        };
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 估算对手压牌概率（改进版）
     * 考虑牌型、牌大小、对手手牌数、已出牌等因素
     */
    private estimateBeatenProbability(
        play: Play,
        opponentIndex: number,
        gameState: GameState
    ): number {
        const oppCardCount = this.cardTracker.getPlayerCardCount(opponentIndex);
        if (oppCardCount === 0) return 0;

        let probability = 0.35; // 基础概率

        // 1. 根据牌型调整（更细致的分类）
        switch (play.type) {
            case PlayType.FOUR_KINGS:
                probability = 0.05; // 四王几乎不可能被压
                break;
            case PlayType.BOMB:
                // 炸弹大小影响被压概率
                if (play.cards.length >= 6) {
                    probability = 0.08; // 6张及以上炸弹很难被压
                } else if (play.cards.length === 5) {
                    probability = 0.15; // 5张炸弹
                } else {
                    probability = 0.25; // 4张炸弹
                }
                break;
            case PlayType.STRAIGHT_FLUSH:
                probability = 0.2; // 同花顺较难被压
                break;
            case PlayType.SINGLE:
                probability = 0.55; // 单张容易被压
                break;
            case PlayType.PAIR:
                probability = 0.45; // 对子
                break;
            case PlayType.TRIPLE:
            case PlayType.TRIPLE_WITH_PAIR:
                probability = 0.4; // 三张/三带二
                break;
            case PlayType.STRAIGHT:
                probability = 0.35; // 顺子
                break;
            case PlayType.TRIPLE_PAIR:
            case PlayType.PLATE:
                probability = 0.3; // 三连对/钢板
                break;
        }

        // 2. 根据对手手牌数调整（更精确的模型）
        if (oppCardCount > 20) {
            probability += 0.25; // 牌很多，很可能有大牌
        } else if (oppCardCount > 15) {
            probability += 0.15;
        } else if (oppCardCount > 10) {
            probability += 0.05;
        } else if (oppCardCount < 5) {
            probability -= 0.15; // 牌很少，可能没有能压的
        } else if (oppCardCount < 8) {
            probability -= 0.08;
        }

        // 3. 根据对手可能的炸弹数
        const bombCount = this.cardTracker.estimateBombCount(opponentIndex, gameState);
        if (bombCount > 0) {
            if (play.type === PlayType.BOMB || play.type === PlayType.FOUR_KINGS) {
                // 炸弹对炸弹，根据炸弹大小判断
                probability += bombCount * 0.1;
            } else {
                // 非炸弹可能被炸弹压
                probability += bombCount * 0.2;
            }
        }

        // 4. 根据对手出牌历史模式调整（使用CardTracker的新功能）
        const opponentPattern = this.cardTracker.getPlayerPattern(opponentIndex);
        if (opponentPattern.isAggressive) {
            // 激进型对手更可能压牌
            probability += 0.1;
        } else if (opponentPattern.isConservative) {
            // 保守型对手可能不会轻易压牌
            probability -= 0.1;
        }
        
        // 如果对手对这种牌型经常过牌，降低被压概率
        // 这里可以通过CardTracker的passOnPlayTypes来获取更精确的数据
        // 暂时使用简化版本
        // const passOnThisType = this.cardTracker.getPlayerPattern(opponentIndex);

        // 5. 根据牌的大小调整（大牌更难被压）
        if (play.type !== PlayType.BOMB && play.type !== PlayType.FOUR_KINGS && play.cards.length > 0) {
            // 评估牌的大小（简化：使用第一张牌的rank）
            const cardRank = play.cards[0].rank;
            const rankOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
            const rankIndex = rankOrder.indexOf(cardRank);
            if (rankIndex >= 8) { // K, A, 2 等大牌
                probability -= 0.1;
            } else if (rankIndex <= 3) { // 3, 4, 5, 6 等小牌
                probability += 0.1;
            }
        }
        
        // 6. 使用牌型推断来更精确评估
        const handInference = this.cardTracker.inferHandStructure(opponentIndex, gameState);
        if (handInference.hasControlCards) {
            // 对手有控制牌，可能能压
            probability += 0.1 * handInference.confidence;
        }
        if (handInference.likelyBombs > 0 && 
            (play.type === PlayType.BOMB || play.type === PlayType.FOUR_KINGS)) {
            // 对手可能有炸弹，炸弹对炸弹
            probability += handInference.likelyBombs * 0.15;
        }

        return Math.max(0, Math.min(1, probability));
    }

    /**
     * 估算队友能接牌概率（改进版）
     * 考虑牌型匹配、队友手牌数、炸弹等因素
     */
    private estimateTeammateCanHelp(
        play: Play,
        teammateIndex: number,
        gameState: GameState
    ): number {
        const teammateCardCount = this.cardTracker.getPlayerCardCount(teammateIndex);
        if (teammateCardCount === 0) return 0;

        let probability = 0.45; // 基础概率（稍微提高）

        // 1. 根据队友手牌数（更细致的模型）
        if (teammateCardCount > 20) {
            probability += 0.25; // 牌很多，很可能能接
        } else if (teammateCardCount > 15) {
            probability += 0.15;
        } else if (teammateCardCount > 10) {
            probability += 0.05;
        } else if (teammateCardCount < 5) {
            probability -= 0.15; // 牌很少，可能接不了
        } else if (teammateCardCount < 8) {
            probability -= 0.05;
        }

        // 2. 根据队友可能的炸弹数
        const bombCount = this.cardTracker.estimateBombCount(teammateIndex, gameState);
        if (bombCount > 0) {
            // 队友有炸弹，可以接任何牌型
            probability += bombCount * 0.25;
        }

        // 3. 根据牌型调整（某些牌型更容易被接）
        switch (play.type) {
            case PlayType.SINGLE:
            case PlayType.PAIR:
                probability += 0.1; // 单张和对子更容易被接
                break;
            case PlayType.TRIPLE:
            case PlayType.TRIPLE_WITH_PAIR:
                probability += 0.05;
                break;
            case PlayType.BOMB:
            case PlayType.FOUR_KINGS:
                // 炸弹需要队友也有炸弹才能接
                probability = bombCount > 0 ? 0.6 : 0.1;
                break;
        }

        // 4. 如果队友手牌很少，可能急于走完，更愿意接牌
        if (teammateCardCount <= 3) {
            probability += 0.15;
        }

        return Math.max(0, Math.min(1, probability));
    }

    /**
     * 获取对手索引
     */
    private getOpponentIndices(playerIndex: number): number[] {
        return [
            (playerIndex + 1) % 4,
            (playerIndex + 3) % 4
        ];
    }

    /**
     * 获取平均对手手牌数
     */
    private getAverageOpponentCards(_gameState: GameState, playerIndex: number): number {
        const opponentIndices = this.getOpponentIndices(playerIndex);
        const total = opponentIndices.reduce((sum, idx) =>
            sum + this.cardTracker.getPlayerCardCount(idx), 0
        );
        return total / opponentIndices.length;
    }

    /**
     * 估算玩家炸弹数量（改进版）
     * 考虑四王和不同大小的炸弹
     */
    private estimatePlayerBombs(hand: Card[]): number {
        const rankCounts = new Map<string, number>();
        hand.forEach(card => {
            rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
        });

        let bombCount = 0;
        
        // 统计普通炸弹
        rankCounts.forEach(count => {
            if (count >= 4) {
                // 根据炸弹大小加权（大炸弹更有价值）
                if (count >= 6) {
                    bombCount += 1.5; // 6张及以上炸弹
                } else if (count === 5) {
                    bombCount += 1.2; // 5张炸弹
                } else {
                    bombCount += 1.0; // 4张炸弹
                }
            }
        });

        // 检查四王
        const bigJokers = hand.filter(c => c.rank === 'joker_big').length;
        const smallJokers = hand.filter(c => c.rank === 'joker_small').length;
        if (bigJokers + smallJokers === 4) {
            bombCount += 2.0; // 四王价值最高
        }

        return Math.round(bombCount * 10) / 10; // 保留一位小数
    }
}
