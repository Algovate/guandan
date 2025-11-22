import type { GameState, Player, Play } from '../types';
import { PlayType } from '../types';

/**
 * 决策类型
 */
export type DecisionType = 'attack' | 'defense' | 'cooperate' | 'conserve' | 'finish';

/**
 * 决策原因
 */
export interface DecisionReason {
    type: DecisionType;
    reason: string;           // 中文原因
    confidence: number;       // 信心值 0-1
    factors: string[];        // 影响因素列表
    emoji: string;            // 表情符号
}

/**
 * 决策因素
 */
export interface DecisionFactor {
    name: string;
    value: number;
    weight: number;
}

/**
 * AI决策
 */
export interface AIDecision {
    play: Play | null;
    pass: boolean;
    winProbability?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    isTeammateMove?: boolean;
    isOpponentThreat?: boolean;
}

/**
 * 决策解释系统 - 生成人类可读的决策原因
 */
export class DecisionExplainer {

    /**
     * 解释出牌决策
     */
    explainPlay(
        decision: AIDecision,
        gameState: GameState,
        player: Player
    ): DecisionReason {
        const factors: string[] = [];
        let type: DecisionType = 'attack';
        let reason = '';
        let confidence = 0.7;
        let emoji = '🎯';

        if (!decision.play) {
            return this.explainPass(gameState, player);
        }

        const play = decision.play;
        const playerIndex = gameState.players.findIndex(p => p.id === player.id);
        const opponentIndices = [
            (playerIndex + 1) % 4,
            (playerIndex + 3) % 4
        ];

        // 1. 判断是否即将走完
        if (player.hand.length <= 5) {
            type = 'finish';
            reason = '手牌不多，积极出牌争取走完';
            factors.push(`剩余${player.hand.length}张牌`);
            confidence = 0.9;
            emoji = '🏆';
        }
        // 2. 判断是否使用炸弹
        else if (play.type === PlayType.BOMB || play.type === PlayType.FOUR_KINGS) {
            const opponentsNearWin = opponentIndices.some(idx =>
                gameState.players[idx].hand.length <= 3
            );

            if (opponentsNearWin) {
                type = 'defense';
                reason = '对手即将走完，使用炸弹压制';
                factors.push('对手剩余牌少');
                confidence = 0.95;
                emoji = '💣';
            } else {
                type = 'attack';
                reason = '时机成熟，使用炸弹建立优势';
                factors.push('炸弹价值最大化');
                confidence = 0.8;
                emoji = '💥';
            }
        }
        // 3. 判断是否队友刚出牌
        else if (decision.isTeammateMove) {
            type = 'cooperate';
            reason = '配合队友，帮助压制对手';
            factors.push('队友需要支持');
            confidence = 0.75;
            emoji = '🤝';
        }
        // 4. 判断是否防守
        else if (decision.isOpponentThreat) {
            type = 'defense';
            reason = '对手威胁较大，必须压制';
            factors.push('对手牌力强');
            confidence = 0.85;
            emoji = '🛡️';
        }
        // 5. 判断是否首出
        else if (!gameState.lastPlay || gameState.lastPlayPlayerIndex === playerIndex) {
            type = 'attack';

            if (play.type === PlayType.SINGLE || play.type === PlayType.PAIR) {
                reason = '出小牌试探，保留大牌后用';
                factors.push('优先出小牌');
            } else if (play.type === PlayType.STRAIGHT || play.type === PlayType.STRAIGHT_FLUSH) {
                reason = '出顺子减少手牌，提高灵活性';
                factors.push('顺子可减少多张牌');
            } else {
                reason = '主动出牌建立优势';
                factors.push('掌握主动权');
            }
            confidence = 0.7;
            emoji = '⚔️';
        }
        // 6. 一般进攻
        else {
            type = 'attack';

            if (decision.riskLevel === 'low') {
                reason = '安全出牌，对手难以压制';
                factors.push('风险较低');
                confidence = 0.8;
                emoji = '✅';
            } else if (decision.riskLevel === 'high') {
                reason = '冒险出牌，争取主动权';
                factors.push('风险较高');
                confidence = 0.5;
                emoji = '⚠️';
            } else {
                reason = '正常出牌，保持节奏';
                factors.push('稳定策略');
                confidence = 0.7;
                emoji = '👍';
            }
        }

        // 添加牌型信息
        factors.push(`牌型：${this.getPlayTypeName(play.type)}`);

        // 添加胜率信息
        if (decision.winProbability !== undefined) {
            const winPercent = Math.round(decision.winProbability * 100);
            factors.push(`预计胜率：${winPercent}%`);

            if (decision.winProbability > 0.7) {
                confidence = Math.min(0.95, confidence + 0.1);
            } else if (decision.winProbability < 0.3) {
                confidence = Math.max(0.3, confidence - 0.1);
            }
        }

        return {
            type,
            reason,
            confidence,
            factors,
            emoji
        };
    }

    /**
     * 解释过牌决策
     */
    explainPass(gameState: GameState, player: Player): DecisionReason {
        const factors: string[] = [];
        let reason = '';
        let type: DecisionType = 'conserve';
        let confidence = 0.7;
        let emoji = '🙅';

        const playerIndex = gameState.players.findIndex(p => p.id === player.id);
        const teammateIndex = (playerIndex + 2) % 4;
        const isTeammateLastPlay = gameState.lastPlayPlayerIndex === teammateIndex;

        // 1. 队友出的牌
        if (isTeammateLastPlay) {
            type = 'cooperate';
            reason = '队友出牌较好，不需要压';
            factors.push('配合队友');
            confidence = 0.85;
            emoji = '🤝';
        }
        // 2. 没有能出的牌
        else if (gameState.lastPlay) {
            type = 'defense';
            reason = '没有能压过的牌，被迫选择不出';
            factors.push('无法压制');
            confidence = 1.0;
            emoji = '😔';
        }
        // 3. 保留实力
        else {
            type = 'conserve';

            if (player.hand.length > 15) {
                reason = '手牌较多，暂时观望保留实力';
                factors.push(`手牌${player.hand.length}张`);
            } else {
                reason = '当前局面不适合出牌，保守策略';
                factors.push('谨慎行事');
            }
            confidence = 0.6;
            emoji = '🤔';
        }

        return {
            type,
            reason,
            confidence,
            factors,
            emoji
        };
    }

    /**
     * 生成简洁的解释文本
     */
    generateExplanation(factors: DecisionFactor[]): string {
        if (factors.length === 0) {
            return '基于当前局面做出决策';
        }

        // 选择权重最高的因素
        const topFactors = factors
            .sort((a, b) => (b.value * b.weight) - (a.value * a.weight))
            .slice(0, 2);

        return topFactors.map(f => f.name).join('，');
    }

    /**
     * 获取牌型名称
     */
    private getPlayTypeName(type: PlayType): string {
        const names: Record<PlayType, string> = {
            [PlayType.SINGLE]: '单张',
            [PlayType.PAIR]: '对子',
            [PlayType.TRIPLE]: '三张',
            [PlayType.TRIPLE_WITH_PAIR]: '三带二',
            [PlayType.TRIPLE_PAIR]: '三连对',
            [PlayType.PLATE]: '钢板',
            [PlayType.STRAIGHT]: '顺子',
            [PlayType.STRAIGHT_FLUSH]: '同花顺',
            [PlayType.BOMB]: '炸弹',
            [PlayType.FOUR_KINGS]: '四王'
        };
        return names[type] || '未知';
    }
}
