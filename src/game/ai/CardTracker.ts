import type { Card, Player, GameState, Play } from '../types';
import { Rank, PlayType } from '../types';

/**
 * 玩家行为记录
 */
interface PlayerBehavior {
    passCount: number;                    // 过牌次数
    playCount: number;                    // 出牌次数
    lastPlayType: PlayType | null;        // 最后出牌类型
    preferredPlayTypes: Map<PlayType, number>; // 偏好的牌型统计
    passOnPlayTypes: Map<PlayType, number>;    // 对哪些牌型选择过牌
    bombUsage: number;                    // 炸弹使用次数
    aggressivePlays: number;              // 激进出牌次数（主动压牌）
}

/**
 * 牌型推断结果
 */
export interface HandStructureInference {
    likelyBombs: number;                  // 可能的炸弹数
    likelyStraights: number;              // 可能的顺子数
    likelyTriples: number;                // 可能的三张数
    likelyPairs: number;                  // 可能的对子数
    hasControlCards: boolean;             // 是否有控制牌（王、A等）
    confidence: number;                   // 推断置信度 0-1
}

/**
 * 记牌器 - 跟踪已出牌和推断对手手牌
 * 增强版：支持贝叶斯推断、牌型推断和出牌模式学习
 */
export class CardTracker {
    private playedCards: Card[] = [];
    private initialDeck: Card[] = [];
    private playerCardCounts: Map<number, number> = new Map();
    
    // 贝叶斯推断相关
    private cardProbabilities: Map<number, Map<string, number>> = new Map(); // 玩家索引 -> (牌key -> 概率)
    private playerBehaviors: Map<number, PlayerBehavior> = new Map();
    
    // 出牌历史
    private playHistory: Array<{ playerIndex: number; play: Play | null; passed: boolean }> = [];

    /**
     * 初始化记牌器
     */
    constructor(totalCards: Card[], players: Player[]) {
        this.initialDeck = [...totalCards];
        players.forEach((player, index) => {
            this.playerCardCounts.set(index, player.hand.length);
            // 初始化行为记录
            this.playerBehaviors.set(index, {
                passCount: 0,
                playCount: 0,
                lastPlayType: null,
                preferredPlayTypes: new Map(),
                passOnPlayTypes: new Map(),
                bombUsage: 0,
                aggressivePlays: 0
            });
            // 初始化概率映射
            this.cardProbabilities.set(index, new Map());
        });
    }

    /**
     * 记录已出的牌
     */
    trackPlayedCards(cards: Card[], playerIndex: number, play: Play | null = null): void {
        this.playedCards.push(...cards);
        const currentCount = this.playerCardCounts.get(playerIndex) || 0;
        this.playerCardCounts.set(playerIndex, currentCount - cards.length);
        
        // 更新行为记录
        const behavior = this.playerBehaviors.get(playerIndex);
        if (behavior) {
            behavior.playCount++;
            if (play) {
                behavior.lastPlayType = play.type;
                const count = behavior.preferredPlayTypes.get(play.type) || 0;
                behavior.preferredPlayTypes.set(play.type, count + 1);
                
                if (play.type === PlayType.BOMB || play.type === PlayType.FOUR_KINGS) {
                    behavior.bombUsage++;
                }
            }
        }
        
        // 记录出牌历史
        this.playHistory.push({ playerIndex, play, passed: false });
        
        // 更新贝叶斯概率：出过的牌概率降为0
        this.updateProbabilitiesAfterPlay(playerIndex, cards);
    }
    
    /**
     * 记录过牌行为
     */
    trackPass(playerIndex: number, lastPlay: Play | null): void {
        const behavior = this.playerBehaviors.get(playerIndex);
        if (behavior) {
            behavior.passCount++;
            if (lastPlay) {
                const count = behavior.passOnPlayTypes.get(lastPlay.type) || 0;
                behavior.passOnPlayTypes.set(lastPlay.type, count + 1);
            }
        }
        
        // 记录过牌历史
        this.playHistory.push({ playerIndex, play: null, passed: true });
        
        // 更新贝叶斯概率：过牌可能意味着没有能压过的牌
        if (lastPlay) {
            this.updateProbabilitiesAfterPass(playerIndex, lastPlay);
        }
    }

    /**
     * 获取剩余未出的牌
     */
    getRemainingCards(): Card[] {
        const playedIds = new Set(this.playedCards.map(c => c.id));
        return this.initialDeck.filter(c => !playedIds.has(c.id));
    }

    /**
     * 获取剩余未出的牌（按牌面统计，不考虑id）
     */
    getRemainingCardsByRank(): Map<string, number> {
        const remaining = this.getRemainingCards();
        const counts = new Map<string, number>();

        remaining.forEach(card => {
            const key = `${card.suit}-${card.rank}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return counts;
    }

    /**
     * 推断某个玩家可能持有的牌（基于贝叶斯概率）
     * 返回每张牌的概率 (0-1)
     */
    getProbableHands(playerIndex: number, gameState: GameState): Map<string, number> {
        const remaining = this.getRemainingCards();
        const playerHandCount = this.playerCardCounts.get(playerIndex) || 0;
        const probabilities = this.cardProbabilities.get(playerIndex) || new Map();

        if (playerHandCount === 0) {
            return new Map();
        }

        // 计算总剩余牌数（排除已知的自己手牌）
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const knownCards = currentPlayer.hand;
        const knownIds = new Set(knownCards.map(c => c.id));

        const unknownCards = remaining.filter(c => !knownIds.has(c.id));
        const totalUnknownCards = unknownCards.length;

        // 计算其他玩家的总手牌数
        let otherPlayersCardCount = 0;
        this.playerCardCounts.forEach((count, idx) => {
            if (idx !== gameState.currentPlayerIndex) {
                otherPlayersCardCount += count;
            }
        });

        if (otherPlayersCardCount === 0 || totalUnknownCards === 0) {
            return new Map();
        }

        // 如果概率映射为空或需要更新，重新计算基础概率
        if (probabilities.size === 0) {
        const baseProbability = playerHandCount / otherPlayersCardCount;
        unknownCards.forEach(card => {
            const key = `${card.suit}-${card.rank}`;
            probabilities.set(key, baseProbability);
        });
        }

        // 归一化概率（确保总和等于手牌数）
        this.normalizeProbabilities(probabilities, playerHandCount);

        return new Map(probabilities);
    }
    
    /**
     * 归一化概率分布
     */
    private normalizeProbabilities(probabilities: Map<string, number>, targetSum: number): void {
        const currentSum = Array.from(probabilities.values()).reduce((sum, p) => sum + p, 0);
        if (currentSum > 0 && Math.abs(currentSum - targetSum) > 0.01) {
            const factor = targetSum / currentSum;
            probabilities.forEach((prob, key) => {
                probabilities.set(key, prob * factor);
            });
        }
    }
    
    /**
     * 出牌后更新概率（贝叶斯更新）
     */
    private updateProbabilitiesAfterPlay(playerIndex: number, playedCards: Card[]): void {
        const probabilities = this.cardProbabilities.get(playerIndex);
        if (!probabilities) return;
        
        // 出过的牌概率设为0
        playedCards.forEach(card => {
            const key = `${card.suit}-${card.rank}`;
            probabilities.set(key, 0);
        });
        
        // 重新归一化
        const playerHandCount = this.playerCardCounts.get(playerIndex) || 0;
        this.normalizeProbabilities(probabilities, playerHandCount);
    }
    
    /**
     * 过牌后更新概率（贝叶斯推断）
     * 如果玩家过牌，可能意味着：
     * 1. 没有能压过的牌（降低大牌概率）
     * 2. 有牌但选择不出（可能是策略性过牌）
     */
    private updateProbabilitiesAfterPass(playerIndex: number, lastPlay: Play): void {
        const probabilities = this.cardProbabilities.get(playerIndex);
        if (!probabilities) return;
        
        const behavior = this.playerBehaviors.get(playerIndex);
        if (!behavior) return;
        
        // 计算过牌率
        const totalActions = behavior.passCount + behavior.playCount;
        const passRate = totalActions > 0 ? behavior.passCount / totalActions : 0.5;
        
        // 如果过牌率很高，更可能是没有能压的牌
        // 降低能压过lastPlay的牌的概率
        const reductionFactor = 0.7 + passRate * 0.2; // 0.7-0.9之间
        
        probabilities.forEach((prob, key) => {
            const [, rank] = key.split('-');
            // 简化：如果这张牌能压过lastPlay，降低其概率
            // 这里需要根据lastPlay的类型来判断
            if (this.couldBeatLastPlay(rank as Rank, lastPlay)) {
                probabilities.set(key, prob * reductionFactor);
            }
        });
        
        // 重新归一化
        const playerHandCount = this.playerCardCounts.get(playerIndex) || 0;
        this.normalizeProbabilities(probabilities, playerHandCount);
    }
    
    /**
     * 判断一张牌是否能压过lastPlay（简化版）
     */
    private couldBeatLastPlay(rank: Rank, lastPlay: Play): boolean {
        // 简化实现：只考虑单张、对子、三张的情况
        if (lastPlay.type === PlayType.SINGLE && lastPlay.cards.length > 0) {
            const lastRank = lastPlay.cards[0].rank;
            return this.compareRanks(rank, lastRank) > 0;
        }
        // 其他情况暂时返回false，可以后续扩展
        return false;
    }
    
    /**
     * 比较两张牌的大小
     */
    private compareRanks(rank1: Rank, rank2: Rank): number {
        const order = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'joker_small', 'joker_big'];
        const idx1 = order.indexOf(rank1);
        const idx2 = order.indexOf(rank2);
        if (idx1 === -1 || idx2 === -1) return 0;
        return idx1 - idx2;
    }

    /**
     * 根据玩家行为更新牌型推断（已集成到trackPass和trackPlayedCards中）
     * 保留此方法以兼容旧代码
     */
    updateBeliefs(
        playerIndex: number,
        action: 'play' | 'pass',
        lastPlay: Play | null,
        _gameState: GameState
    ): void {
        if (action === 'pass') {
            this.trackPass(playerIndex, lastPlay);
        } else if (lastPlay) {
            this.trackPlayedCards(lastPlay.cards, playerIndex, lastPlay);
        }
    }
    
    /**
     * 推断玩家可能的手牌结构
     */
    inferHandStructure(playerIndex: number, gameState: GameState): HandStructureInference {
        const playerHandCount = this.playerCardCounts.get(playerIndex) || 0;
        const behavior = this.playerBehaviors.get(playerIndex);
        const probabilities = this.getProbableHands(playerIndex, gameState);
        
        let likelyBombs = 0;
        let likelyStraights = 0;
        let likelyTriples = 0;
        let likelyPairs = 0;
        let hasControlCards = false;
        let confidence = 0.5;
        
        if (playerHandCount === 0) {
            return {
                likelyBombs: 0,
                likelyStraights: 0,
                likelyTriples: 0,
                likelyPairs: 0,
                hasControlCards: false,
                confidence: 1.0
            };
        }
        
        // 1. 推断炸弹
        const rankCounts = new Map<Rank, number>();
        probabilities.forEach((prob, key) => {
            const [, rank] = key.split('-');
            const current = rankCounts.get(rank as Rank) || 0;
            rankCounts.set(rank as Rank, current + prob);
        });
        
        rankCounts.forEach((count) => {
            if (count >= 3.5) { // 高概率有4张或以上
                likelyBombs += count / 4;
            }
        });
        
        // 检查四王
        const bigJokerProb = probabilities.get(`joker-joker_big`) || 0;
        const smallJokerProb = probabilities.get(`joker-joker_small`) || 0;
        if (bigJokerProb + smallJokerProb >= 3.5) {
            likelyBombs += 0.5;
            hasControlCards = true;
        }
        
        // 2. 推断控制牌
        const aceProb = probabilities.get(`spade-A`) || 0;
        const kingProb = probabilities.get(`spade-K`) || 0;
        if (aceProb > 0.3 || kingProb > 0.3 || bigJokerProb > 0.3 || smallJokerProb > 0.3) {
            hasControlCards = true;
        }
        
        // 3. 根据行为推断牌型偏好
        if (behavior) {
            // 如果玩家经常出某种牌型，可能还有更多
            behavior.preferredPlayTypes.forEach((count, playType) => {
                const frequency = count / (behavior.playCount || 1);
                if (frequency > 0.3) {
                    switch (playType) {
                        case PlayType.STRAIGHT:
                        case PlayType.STRAIGHT_FLUSH:
                            likelyStraights += frequency * 0.5;
                            break;
                        case PlayType.TRIPLE:
                        case PlayType.TRIPLE_WITH_PAIR:
                            likelyTriples += frequency * 0.5;
                            break;
                        case PlayType.PAIR:
                            likelyPairs += frequency * 0.5;
                            break;
                    }
                }
            });
        }
        
        // 4. 根据手牌数调整置信度
        if (playerHandCount <= 5) {
            confidence = 0.8; // 手牌少时，推断更准确
        } else if (playerHandCount <= 10) {
            confidence = 0.6;
        } else {
            confidence = 0.4; // 手牌多时，不确定性高
        }
        
        // 5. 根据已出牌数调整置信度
        const totalCards = this.initialDeck.length;
        const playedCount = this.playedCards.length;
        const gameProgress = playedCount / totalCards;
        confidence = confidence * (0.5 + gameProgress * 0.5); // 游戏进行越久，推断越准确
        
        return {
            likelyBombs: Math.round(likelyBombs * 10) / 10,
            likelyStraights: Math.round(likelyStraights * 10) / 10,
            likelyTriples: Math.round(likelyTriples * 10) / 10,
            likelyPairs: Math.round(likelyPairs * 10) / 10,
            hasControlCards,
            confidence: Math.min(1, Math.max(0, confidence))
        };
    }
    
    /**
     * 获取玩家的出牌模式分析
     */
    getPlayerPattern(playerIndex: number): {
        isAggressive: boolean;
        isConservative: boolean;
        preferredPlayType: PlayType | null;
        bombUsageRate: number;
        passRate: number;
    } {
        const behavior = this.playerBehaviors.get(playerIndex);
        if (!behavior) {
            return {
                isAggressive: false,
                isConservative: false,
                preferredPlayType: null,
                bombUsageRate: 0,
                passRate: 0.5
            };
        }
        
        const totalActions = behavior.passCount + behavior.playCount;
        const passRate = totalActions > 0 ? behavior.passCount / totalActions : 0.5;
        const bombUsageRate = behavior.playCount > 0 ? behavior.bombUsage / behavior.playCount : 0;
        
        // 找出最偏好的牌型
        let maxCount = 0;
        let preferredPlayType: PlayType | null = null;
        behavior.preferredPlayTypes.forEach((count, playType) => {
            if (count > maxCount) {
                maxCount = count;
                preferredPlayType = playType;
            }
        });
        
        // 判断风格
        const isAggressive = passRate < 0.3 && bombUsageRate > 0.1;
        const isConservative = passRate > 0.5 && bombUsageRate < 0.05;
        
        return {
            isAggressive,
            isConservative,
            preferredPlayType,
            bombUsageRate,
            passRate
        };
    }

    /**
     * 分析某个玩家可能的炸弹数量
     */
    estimateBombCount(_playerIndex: number, _gameState: GameState): number {
        const remaining = this.getRemainingCardsByRank();

        let estimatedBombs = 0;

        // 统计每个等级的牌数
        const rankCounts = new Map<Rank, number>();
        remaining.forEach((count, key) => {
            const [, rank] = key.split('-');
            rankCounts.set(rank as Rank, (rankCounts.get(rank as Rank) || 0) + count);
        });

        // 如果某个等级有4张或以上，可能是炸弹
        rankCounts.forEach((count) => {
            if (count >= 4) {
                estimatedBombs += 0.3; // 概率估计
            }
        });

        // 检查四王
        const bigJokerCount = rankCounts.get(Rank.JOKER_BIG) || 0;
        const smallJokerCount = rankCounts.get(Rank.JOKER_SMALL) || 0;
        if (bigJokerCount + smallJokerCount === 4) {
            estimatedBombs += 0.5;
        }

        return Math.round(estimatedBombs);
    }

    /**
     * 重置记牌器（新一轮）
     */
    reset(totalCards: Card[], players: Player[]): void {
        this.playedCards = [];
        this.initialDeck = [...totalCards];
        this.playerCardCounts.clear();
        this.cardProbabilities.clear();
        this.playerBehaviors.clear();
        this.playHistory = [];
        
        players.forEach((player, index) => {
            this.playerCardCounts.set(index, player.hand.length);
            // 重新初始化
            this.playerBehaviors.set(index, {
                passCount: 0,
                playCount: 0,
                lastPlayType: null,
                preferredPlayTypes: new Map(),
                passOnPlayTypes: new Map(),
                bombUsage: 0,
                aggressivePlays: 0
            });
            this.cardProbabilities.set(index, new Map());
        });
    }

    /**
     * 获取玩家当前手牌数
     */
    getPlayerCardCount(playerIndex: number): number {
        return this.playerCardCounts.get(playerIndex) || 0;
    }
}
