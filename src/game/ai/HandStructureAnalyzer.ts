import type { Card, Play } from '../types';
import { Rank, Suit } from '../types';
import { createPlay } from '../CardTypes';
import { sortCards } from '../../utils/helpers';
import { RANK_ORDER } from '../../utils/constants';

export interface HandStructure {
    plays: Play[];
    remainingCards: Card[];
    handCount: number; // Number of turns to go out
    totalValue: number;
}

/**
 * Analyzes the structure of a hand to find optimal plays
 */
export class HandStructureAnalyzer {
    /**
     * Decomposes a hand into a list of plays
     */
    static analyze(hand: Card[]): HandStructure {
        const sortedHand = sortCards([...hand]);
        const plays: Play[] = [];
        let currentHand = [...sortedHand];

        // 1. Extract Bombs (Highest Priority)
        const bombs = this.extractBombs(currentHand);
        plays.push(...bombs.plays);
        currentHand = bombs.remaining;

        // 2. Extract Straight Flushes
        const straightFlushes = this.extractStraightFlushes(currentHand);
        plays.push(...straightFlushes.plays);
        currentHand = straightFlushes.remaining;

        // 3. Extract Plates (Steel Plates)
        const plates = this.extractPlates(currentHand);
        plays.push(...plates.plays);
        currentHand = plates.remaining;

        // 4. Extract Triple Pairs
        const triplePairs = this.extractTriplePairs(currentHand);
        plays.push(...triplePairs.plays);
        currentHand = triplePairs.remaining;

        // 5. Extract Straights
        const straights = this.extractStraights(currentHand);
        plays.push(...straights.plays);
        currentHand = straights.remaining;

        // 6. Extract Triples (with or without pairs)
        const triples = this.extractTriples(currentHand);
        plays.push(...triples.plays);
        currentHand = triples.remaining;

        // 7. Extract Pairs
        const pairs = this.extractPairs(currentHand);
        plays.push(...pairs.plays);
        currentHand = pairs.remaining;

        // 8. Remaining are Singles
        currentHand.forEach(card => {
            const play = createPlay([card]);
            if (play) plays.push(play);
        });

        return {
            plays,
            remainingCards: [], // All converted to plays
            handCount: plays.length,
            totalValue: this.calculateTotalValue(plays)
        };
    }

    private static extractBombs(hand: Card[]): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        // Four Kings
        const jokers = remaining.filter(c => c.suit === Suit.JOKER);
        if (jokers.length === 4) {
            const play = createPlay(jokers);
            if (play) {
                plays.push(play);
                remaining = remaining.filter(c => c.suit !== Suit.JOKER);
            }
        }

        // Normal Bombs (4+ same rank)
        const rankGroups = this.groupCardsByRank(remaining);
        rankGroups.forEach((cards, rank) => {
            if (cards.length >= 4) {
                const play = createPlay(cards);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => c.rank !== rank);
                }
            }
        });

        return { plays, remaining };
    }

    private static extractStraightFlushes(hand: Card[]): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        // 过滤掉王（王不能组成同花顺）
        const potentialCards = remaining.filter(c => c.suit !== Suit.JOKER);

        // 按花色分组
        const suitGroups = new Map<Suit, Card[]>();
        potentialCards.forEach(card => {
            if (!suitGroups.has(card.suit)) {
                suitGroups.set(card.suit, []);
            }
            suitGroups.get(card.suit)!.push(card);
        });

        // 对每个花色查找同花顺
        suitGroups.forEach((cards) => {
            // 按rank排序
            const sortedCards = cards.sort((a, b) => 
                RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)
            );

            // 查找连续5张
            for (let i = 0; i <= sortedCards.length - 5; i++) {
                const candidate = sortedCards.slice(i, i + 5);
                
                // 检查是否连续
                let isConsecutive = true;
                for (let j = 1; j < 5; j++) {
                    const prevRank = candidate[j - 1].rank;
                    const currRank = candidate[j].rank;
                    const prevIdx = RANK_ORDER.indexOf(prevRank);
                    const currIdx = RANK_ORDER.indexOf(currRank);
                    
                    // 跳过王的位置
                    if (prevIdx === -1 || currIdx === -1 || 
                        prevRank === Rank.JOKER_SMALL || prevRank === Rank.JOKER_BIG ||
                        currRank === Rank.JOKER_SMALL || currRank === Rank.JOKER_BIG) {
                        isConsecutive = false;
                        break;
                    }
                    
                    if (currIdx !== prevIdx + 1) {
                        isConsecutive = false;
                        break;
                    }
                }

                if (isConsecutive) {
                    const play = createPlay(candidate);
                    if (play && play.type === 'straight_flush') {
                        plays.push(play);
                        // 移除已使用的牌
                        candidate.forEach(c => {
                            const index = remaining.findIndex(rc => rc.id === c.id);
                            if (index !== -1) remaining.splice(index, 1);
                        });
                        
                        // 递归查找剩余的同花顺
                        const result = this.extractStraightFlushes(remaining);
                        plays.push(...result.plays);
                        remaining = result.remaining;
                        return { plays, remaining };
                    }
                }
            }
        });

        return { plays, remaining };
    }

    private static extractPlates(hand: Card[]): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        // Find consecutive triples
        const rankGroups = this.groupCardsByRank(remaining);
        const tripleRanks: Rank[] = [];
        rankGroups.forEach((cards, rank) => {
            if (cards.length === 3) tripleRanks.push(rank);
        });

        // Sort ranks by order
        tripleRanks.sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));

        for (let i = 0; i < tripleRanks.length - 1; i++) {
            const r1 = tripleRanks[i];
            const r2 = tripleRanks[i + 1];

            // Check if consecutive
            if (RANK_ORDER.indexOf(r2) === RANK_ORDER.indexOf(r1) + 1) {
                const cards1 = rankGroups.get(r1)!;
                const cards2 = rankGroups.get(r2)!;
                const play = createPlay([...cards1, ...cards2]);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => c.rank !== r1 && c.rank !== r2);
                    i++; // Skip next
                }
            }
        }

        return { plays, remaining };
    }

    private static extractTriplePairs(hand: Card[]): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        // 按rank分组
        const rankGroups = this.groupCardsByRank(remaining);
        
        // 找出所有对子
        const pairRanks: Rank[] = [];
        rankGroups.forEach((cards, rank) => {
            if (cards.length >= 2) {
                pairRanks.push(rank);
            }
        });

        // 按rank顺序排序
        pairRanks.sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));

        // 查找连续的三对（三连对需要恰好6张牌，即3对）
        for (let i = 0; i <= pairRanks.length - 3; i++) {
            const r1 = pairRanks[i];
            const r2 = pairRanks[i + 1];
            const r3 = pairRanks[i + 2];

            // 检查是否连续
            const idx1 = RANK_ORDER.indexOf(r1);
            const idx2 = RANK_ORDER.indexOf(r2);
            const idx3 = RANK_ORDER.indexOf(r3);

            // 跳过王（王不能组成三连对）
            if (r1 === Rank.JOKER_SMALL || r1 === Rank.JOKER_BIG ||
                r2 === Rank.JOKER_SMALL || r2 === Rank.JOKER_BIG ||
                r3 === Rank.JOKER_SMALL || r3 === Rank.JOKER_BIG) {
                continue;
            }

            if (idx1 !== -1 && idx2 !== -1 && idx3 !== -1 &&
                idx2 === idx1 + 1 && idx3 === idx2 + 1) {
                // 组成三连对
                const cards1 = rankGroups.get(r1)!.slice(0, 2); // 取前两张
                const cards2 = rankGroups.get(r2)!.slice(0, 2);
                const cards3 = rankGroups.get(r3)!.slice(0, 2);
                
                const triplePairCards = [...cards1, ...cards2, ...cards3];
                const play = createPlay(triplePairCards);
                
                if (play && play.type === 'triple_pair') {
                    plays.push(play);
                    // 移除已使用的牌
                    triplePairCards.forEach(c => {
                        const index = remaining.findIndex(rc => rc.id === c.id);
                        if (index !== -1) remaining.splice(index, 1);
                    });
                    
                    // 递归查找剩余的三连对
                    const result = this.extractTriplePairs(remaining);
                    plays.push(...result.plays);
                    remaining = result.remaining;
                    return { plays, remaining };
                }
            }
        }

        return { plays, remaining };
    }

    private static extractStraights(hand: Card[]): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        // Filter out Jokers (usually not used in straights unless desperate)
        // For simplicity, we only look for natural straights
        const potentialCards = remaining.filter(c =>
            c.suit !== Suit.JOKER
        );

        const rankGroups = this.groupCardsByRank(potentialCards);
        const uniqueRanks = Array.from(rankGroups.keys())
            .sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));

        // Find 5 consecutive ranks
        for (let i = 0; i <= uniqueRanks.length - 5; i++) {
            const straightRanks = uniqueRanks.slice(i, i + 5);

            // Check continuity
            let isConsecutive = true;
            for (let j = 1; j < 5; j++) {
                if (RANK_ORDER.indexOf(straightRanks[j]) !== RANK_ORDER.indexOf(straightRanks[j - 1]) + 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                // Construct straight
                const straightCards: Card[] = [];
                straightRanks.forEach(rank => {
                    straightCards.push(rankGroups.get(rank)![0]); // Take one of each
                });

                const play = createPlay(straightCards);
                if (play) {
                    plays.push(play);
                    // Remove used cards
                    straightCards.forEach(c => {
                        const index = remaining.findIndex(rc => rc.id === c.id);
                        if (index !== -1) remaining.splice(index, 1);
                    });

                    // Re-evaluate remaining (simple greedy approach, might miss overlapping straights)
                    // For now, just continue to next iteration, but we need to update rankGroups if we want to find multiple straights
                    // To keep it simple, we just return one straight at a time or restart. 
                    // Let's just break and return for now, or recurse?
                    // Recursion is safer.
                    const result = this.extractStraights(remaining);
                    plays.push(...result.plays);
                    remaining = result.remaining;
                    return { plays, remaining };
                }
            }
        }

        return { plays, remaining };
    }
    private static extractTriples(hand: Card[]): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        const rankGroups = this.groupCardsByRank(remaining);

        // Find triples
        const triples: Card[][] = [];
        rankGroups.forEach((cards) => {
            if (cards.length === 3) {
                triples.push(cards);
            }
        });

        // Find pairs for 3+2
        const pairs: Card[][] = [];
        rankGroups.forEach((cards) => {
            if (cards.length === 2) {
                pairs.push(cards);
            }
        });

        // Match triples with pairs
        triples.forEach(tripleCards => {
            if (pairs.length > 0) {
                const pairCards = pairs.pop()!;
                const play = createPlay([...tripleCards, ...pairCards]);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => !tripleCards.includes(c) && !pairCards.includes(c));
                }
            } else {
                // Just triple
                const play = createPlay(tripleCards);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => !tripleCards.includes(c));
                }
            }
        });

        return { plays, remaining };
    }

    private static extractPairs(hand: Card[]): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        const rankGroups = this.groupCardsByRank(remaining);
        rankGroups.forEach((cards, rank) => {
            if (cards.length === 2) {
                const play = createPlay(cards);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => c.rank !== rank);
                }
            }
        });

        return { plays, remaining };
    }

    private static groupCardsByRank(cards: Card[]): Map<Rank, Card[]> {
        const map = new Map<Rank, Card[]>();
        cards.forEach(c => {
            if (!map.has(c.rank)) map.set(c.rank, []);
            map.get(c.rank)!.push(c);
        });
        return map;
    }

    private static calculateTotalValue(plays: Play[]): number {
        // 计算手牌结构的总价值
        // 价值越高越好（能快速出完的组合）
        let totalValue = 0;
        
        plays.forEach(play => {
            switch (play.type) {
                case 'four_kings':
                    totalValue += 100; // 四王价值最高
                    break;
                case 'bomb':
                    totalValue += 50 + (play.cards.length - 4) * 10; // 炸弹越大价值越高
                    break;
                case 'straight_flush':
                    totalValue += 40; // 同花顺
                    break;
                case 'plate':
                    totalValue += 30; // 钢板
                    break;
                case 'triple_pair':
                    totalValue += 25; // 三连对
                    break;
                case 'straight':
                    totalValue += 15; // 顺子
                    break;
                case 'triple_with_pair':
                    totalValue += 12; // 三带二
                    break;
                case 'triple':
                    totalValue += 8; // 三张
                    break;
                case 'pair':
                    totalValue += 4; // 对子
                    break;
                case 'single':
                    totalValue += 1; // 单张
                    break;
            }
        });
        
        // 手牌数越少越好，所以给予负的惩罚
        totalValue -= plays.length * 2;
        
        return totalValue;
    }
    
    /**
     * 优化手牌结构分解
     * 尝试多种分解方案，选择最优的
     */
    static analyzeOptimal(hand: Card[]): HandStructure {
        // 当前使用贪心策略，未来可以扩展为尝试多种组合
        return this.analyze(hand);
    }
}
