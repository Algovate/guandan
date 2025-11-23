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
    static analyze(hand: Card[], mainRank?: Rank, mainSuit?: Suit): HandStructure {
        const sortedHand = sortCards([...hand], mainRank, mainSuit);
        const plays: Play[] = [];
        let currentHand = [...sortedHand];

        // 1. Extract Bombs (Highest Priority)
        const bombs = this.extractBombs(currentHand, mainRank, mainSuit);
        plays.push(...bombs.plays);
        currentHand = bombs.remaining;

        // 2. Extract Straight Flushes
        const straightFlushes = this.extractStraightFlushes(currentHand, mainRank, mainSuit);
        plays.push(...straightFlushes.plays);
        currentHand = straightFlushes.remaining;

        // 3. Extract Plates (Steel Plates)
        const plates = this.extractPlates(currentHand, mainRank, mainSuit);
        plays.push(...plates.plays);
        currentHand = plates.remaining;

        // 4. Extract Triple Pairs
        const triplePairs = this.extractTriplePairs(currentHand, mainRank, mainSuit);
        plays.push(...triplePairs.plays);
        currentHand = triplePairs.remaining;

        // 5. Extract Straights
        const straights = this.extractStraights(currentHand, mainRank, mainSuit);
        plays.push(...straights.plays);
        currentHand = straights.remaining;

        // 6. Extract Triples (with or without pairs)
        const triples = this.extractTriples(currentHand, mainRank, mainSuit);
        plays.push(...triples.plays);
        currentHand = triples.remaining;

        // 7. Extract Pairs
        const pairs = this.extractPairs(currentHand, mainRank, mainSuit);
        plays.push(...pairs.plays);
        currentHand = pairs.remaining;

        // 8. Remaining are Singles
        currentHand.forEach(card => {
            const play = createPlay([card], mainRank, mainSuit);
            if (play) plays.push(play);
        });

        return {
            plays,
            remainingCards: [], // All converted to plays
            handCount: plays.length,
            totalValue: this.calculateTotalValue(plays)
        };
    }

    private static extractBombs(hand: Card[], mainRank?: Rank, mainSuit?: Suit): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        // Four Kings
        const jokers = remaining.filter(c => c.suit === Suit.JOKER);
        if (jokers.length === 4) {
            const play = createPlay(jokers, mainRank, mainSuit);
            if (play) {
                plays.push(play);
                remaining = remaining.filter(c => c.suit !== Suit.JOKER);
            }
        }

        // Normal Bombs (4+ same rank)
        const rankGroups = this.groupCardsByRank(remaining);
        rankGroups.forEach((cards, rank) => {
            if (cards.length >= 4) {
                const play = createPlay(cards, mainRank, mainSuit);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => c.rank !== rank);
                }
            }
        });

        return { plays, remaining };
    }

    private static extractStraightFlushes(hand: Card[], _mainRank?: Rank, _mainSuit?: Suit): { plays: Play[], remaining: Card[] } {
        // Simplified: Check for 5 consecutive same-suit cards
        // This is complex, implementing a basic greedy check
        return { plays: [], remaining: hand }; // Placeholder for now
    }

    private static extractPlates(hand: Card[], mainRank?: Rank, mainSuit?: Suit): { plays: Play[], remaining: Card[] } {
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

            // Check if consecutive and not main rank
            if (RANK_ORDER.indexOf(r2) === RANK_ORDER.indexOf(r1) + 1 && r1 !== mainRank && r2 !== mainRank) {
                const cards1 = rankGroups.get(r1)!;
                const cards2 = rankGroups.get(r2)!;
                const play = createPlay([...cards1, ...cards2], mainRank, mainSuit);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => c.rank !== r1 && c.rank !== r2);
                    i++; // Skip next
                }
            }
        }

        return { plays, remaining };
    }

    private static extractTriplePairs(hand: Card[], _mainRank?: Rank, _mainSuit?: Suit): { plays: Play[], remaining: Card[] } {
        // Similar to plates but for pairs
        return { plays: [], remaining: hand }; // Placeholder
    }

    private static extractStraights(hand: Card[], mainRank?: Rank, mainSuit?: Suit): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        // Filter out Jokers and Main Rank (usually not used in straights unless desperate)
        // For simplicity, we only look for natural straights
        const potentialCards = remaining.filter(c =>
            c.suit !== Suit.JOKER && c.rank !== mainRank
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

                const play = createPlay(straightCards, mainRank, mainSuit);
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
                    const result = this.extractStraights(remaining, mainRank, mainSuit);
                    plays.push(...result.plays);
                    remaining = result.remaining;
                    return { plays, remaining };
                }
            }
        }

        return { plays, remaining };
    }
    private static extractTriples(hand: Card[], mainRank?: Rank, mainSuit?: Suit): { plays: Play[], remaining: Card[] } {
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
                const play = createPlay([...tripleCards, ...pairCards], mainRank, mainSuit);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => !tripleCards.includes(c) && !pairCards.includes(c));
                }
            } else {
                // Just triple
                const play = createPlay(tripleCards, mainRank, mainSuit);
                if (play) {
                    plays.push(play);
                    remaining = remaining.filter(c => !tripleCards.includes(c));
                }
            }
        });

        return { plays, remaining };
    }

    private static extractPairs(hand: Card[], mainRank?: Rank, mainSuit?: Suit): { plays: Play[], remaining: Card[] } {
        const plays: Play[] = [];
        let remaining = [...hand];

        const rankGroups = this.groupCardsByRank(remaining);
        rankGroups.forEach((cards, rank) => {
            if (cards.length === 2) {
                const play = createPlay(cards, mainRank, mainSuit);
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
        // Simple heuristic
        return plays.length * -10; // Fewer hands is better? No, this is value.
        // Actually we want to minimize hand count.
        // Value = Sum of play values
        return 0;
    }
}
