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
     * 基于：手牌数、牌力、炸弹数、队友状态
     */
    calculateWinProbability(gameState: GameState, player: Player): number {
        const playerIndex = gameState.players.findIndex(p => p.id === player.id);
        if (playerIndex === -1) return 0.5;

        const teammateIndex = (playerIndex + 2) % 4; // 对面是队友
        const teammate = gameState.players[teammateIndex];

        let probability = 0.5; // 基础50%

        // 1. 手牌数优势（越少越好）
        const avgOpponentCards = this.getAverageOpponentCards(gameState, playerIndex);
        if (player.hand.length < avgOpponentCards) {
            probability += 0.1 * (avgOpponentCards - player.hand.length) / avgOpponentCards;
        } else {
            probability -= 0.1 * (player.hand.length - avgOpponentCards) / player.hand.length;
        }

        // 2. 队友手牌数优势
        if (teammate.hand.length < avgOpponentCards) {
            probability += 0.05 * (avgOpponentCards - teammate.hand.length) / avgOpponentCards;
        }

        // 3. 炸弹数量估计
        const myBombCount = this.estimatePlayerBombs(player.hand);
        const opponentBombCount = this.cardTracker.estimateBombCount(
            (playerIndex + 1) % 4,
            gameState
        );
        probability += (myBombCount - opponentBombCount) * 0.1;

        // 4. 控制权（最后出牌的是我方）
        if (gameState.lastPlayPlayerIndex === playerIndex ||
            gameState.lastPlayPlayerIndex === teammateIndex) {
            probability += 0.1;
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
     * 判断是否应该使用炸弹
     */
    shouldUseBomb(
        gameState: GameState,
        player: Player,
        _bombPlay: Play
    ): boolean {
        const playerIndex = gameState.players.findIndex(p => p.id === player.id);
        if (playerIndex === -1) return false;

        const opponentIndices = this.getOpponentIndices(playerIndex);

        // 1. 对手即将走完（剩余牌数 <= 3）
        const hasOpponentNearWin = opponentIndices.some(idx =>
            this.cardTracker.getPlayerCardCount(idx) <= 3
        );
        if (hasOpponentNearWin) return true;

        // 2. 自己即将走完（剩余牌数 <= 5）
        if (player.hand.length <= 5) return true;

        // 3. 胜率分析
        const winProb = this.calculateWinProbability(gameState, player);
        if (winProb < 0.3) {
            // 劣势时，炸弹可能是转机
            return true;
        }
        if (winProb > 0.7) {
            // 优势时，保留炸弹可能更好
            return false;
        }

        // 4. 对手可能有更大的炸弹
        const opponentBombCount = opponentIndices.reduce((sum, idx) =>
            sum + this.cardTracker.estimateBombCount(idx, gameState), 0
        );
        if (opponentBombCount > 1) {
            // 对手炸弹多，尽早用掉
            return true;
        }

        return false;
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
     * 估算对手压牌概率
     */
    private estimateBeatenProbability(
        play: Play,
        opponentIndex: number,
        gameState: GameState
    ): number {
        const oppCardCount = this.cardTracker.getPlayerCardCount(opponentIndex);
        if (oppCardCount === 0) return 0;

        let probability = 0.3; // 基础概率

        // 1. 根据牌型调整
        if (play.type === PlayType.BOMB || play.type === PlayType.FOUR_KINGS) {
            probability = 0.1; // 炸弹难被压
        } else if (play.type === PlayType.SINGLE) {
            probability = 0.5; // 单张容易被压
        }

        // 2. 根据对手手牌数调整
        if (oppCardCount > 15) {
            probability += 0.2; // 牌多可能有大牌
        } else if (oppCardCount < 5) {
            probability -= 0.1; // 牌少可能没有
        }

        // 3. 根据对手可能的炸弹数
        const bombCount = this.cardTracker.estimateBombCount(opponentIndex, gameState);
        if (bombCount > 0 && play.type !== PlayType.BOMB) {
            probability += bombCount * 0.15;
        }

        return Math.max(0, Math.min(1, probability));
    }

    /**
     * 估算队友能接牌概率
     */
    private estimateTeammateCanHelp(
        _play: Play,
        teammateIndex: number,
        gameState: GameState
    ): number {
        const teammateCardCount = this.cardTracker.getPlayerCardCount(teammateIndex);
        if (teammateCardCount === 0) return 0;

        let probability = 0.4; // 基础概率

        // 根据队友手牌数
        if (teammateCardCount > 15) {
            probability += 0.2;
        } else if (teammateCardCount < 5) {
            probability -= 0.2;
        }

        // 根据队友可能的炸弹数
        const bombCount = this.cardTracker.estimateBombCount(teammateIndex, gameState);
        probability += bombCount * 0.2;

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
     * 估算玩家炸弹数量
     */
    private estimatePlayerBombs(hand: Card[]): number {
        const rankCounts = new Map<string, number>();
        hand.forEach(card => {
            rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
        });

        let bombCount = 0;
        rankCounts.forEach(count => {
            if (count >= 4) bombCount++;
        });

        return bombCount;
    }
}
