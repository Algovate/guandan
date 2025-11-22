import type { Card, Player, GameState } from '../types';
import { Rank } from '../types';

/**
 * 记牌器 - 跟踪已出牌和推断对手手牌
 */
export class CardTracker {
    private playedCards: Card[] = [];
    private initialDeck: Card[] = [];
    private playerCardCounts: Map<number, number> = new Map();

    /**
     * 初始化记牌器
     */
    constructor(totalCards: Card[], players: Player[]) {
        this.initialDeck = [...totalCards];
        players.forEach((player, index) => {
            this.playerCardCounts.set(index, player.hand.length);
        });
    }

    /**
     * 记录已出的牌
     */
    trackPlayedCards(cards: Card[], playerIndex: number): void {
        this.playedCards.push(...cards);
        const currentCount = this.playerCardCounts.get(playerIndex) || 0;
        this.playerCardCounts.set(playerIndex, currentCount - cards.length);
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
     * 推断某个玩家可能持有的牌（基于概率）
     * 返回每张牌的概率 (0-1)
     */
    getProbableHands(playerIndex: number, gameState: GameState): Map<string, number> {
        const remaining = this.getRemainingCards();
        const playerHandCount = this.playerCardCounts.get(playerIndex) || 0;
        const probabilities = new Map<string, number>();

        if (playerHandCount === 0) {
            return probabilities;
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
            return probabilities;
        }

        // 基础概率：该玩家手牌数 / 其他玩家总手牌数
        const baseProbability = playerHandCount / otherPlayersCardCount;

        unknownCards.forEach(card => {
            const key = `${card.suit}-${card.rank}`;
            probabilities.set(key, baseProbability);
        });

        return probabilities;
    }

    /**
     * 根据玩家行为更新牌型推断
     * 例如：玩家过牌可能说明没有某些牌型
     */
    updateBeliefs(
        _playerIndex: number,
        action: 'play' | 'pass',
        lastPlay: Card[] | null,
        _gameState: GameState
    ): void {
        // 简单实现：记录行为历史
        // 未来可以扩展为贝叶斯推断

        if (action === 'pass' && lastPlay) {
            // 玩家选择不出，说明可能没有能压过的牌
            // 可以降低该玩家持有大牌的概率（未来实现）
        }
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
        players.forEach((player, index) => {
            this.playerCardCounts.set(index, player.hand.length);
        });
    }

    /**
     * 获取玩家当前手牌数
     */
    getPlayerCardCount(playerIndex: number): number {
        return this.playerCardCounts.get(playerIndex) || 0;
    }
}
