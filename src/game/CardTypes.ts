import type { Card, Play } from './types';
import { PlayType, Rank, Suit } from './types';
import { RANK_ORDER } from '../utils/constants';
import { sortCards, compareCards } from '../utils/helpers';

/**
 * 识别牌型
 */
export function identifyPlayType(cards: Card[], mainRank?: Rank, mainSuit?: Suit): PlayType | null {
  if (cards.length === 0) return null;
  
  const sortedCards = sortCards(cards, mainRank, mainSuit);
  const count = sortedCards.length;
  
  // 单张
  if (count === 1) {
    return PlayType.SINGLE;
  }
  
  // 对子
  if (count === 2) {
    if (sortedCards[0].rank === sortedCards[1].rank) {
      return PlayType.PAIR;
    }
    return null;
  }
  
  // 三张
  if (count === 3) {
    if (sortedCards[0].rank === sortedCards[1].rank && 
        sortedCards[1].rank === sortedCards[2].rank) {
      return PlayType.TRIPLE;
    }
    return null;
  }
  
  // 三带二（5张）
  if (count === 5) {
    const ranks = sortedCards.map(c => c.rank);
    const rankCounts = new Map<string, number>();
    ranks.forEach(rank => {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
    });
    
    const counts = Array.from(rankCounts.values()).sort();
    if (counts.length === 2 && counts[0] === 2 && counts[1] === 3) {
      return PlayType.TRIPLE_WITH_PAIR;
    }
    return null;
  }
  
  // 四王
  if (count === 4) {
    const allJokers = sortedCards.every(c => 
      c.rank === Rank.JOKER_BIG || c.rank === Rank.JOKER_SMALL
    );
    if (allJokers) {
      return PlayType.FOUR_KINGS;
    }
  }
  
  // 炸弹（4张及以上相同）
  if (count >= 4) {
    const firstRank = sortedCards[0].rank;
    const allSame = sortedCards.every(c => c.rank === firstRank);
    if (allSame) {
      return PlayType.BOMB;
    }
  }
  
  // 顺子（至少5张连续）
  if (count >= 5) {
    const straight = isStraight(sortedCards, mainRank);
    if (straight) {
      // 检查是否同花
      const isFlush = sortedCards.every(c => c.suit === sortedCards[0].suit);
      if (isFlush && !sortedCards.some(c => c.suit === Suit.JOKER)) {
        return PlayType.STRAIGHT_FLUSH;
      }
      return PlayType.STRAIGHT;
    }
  }
  
  return null;
}

/**
 * 检查是否为顺子
 */
function isStraight(cards: Card[], mainRank?: Rank): boolean {
  if (cards.length < 5) return false;
  
  // 排除王
  const nonJokers = cards.filter(c => c.suit !== Suit.JOKER);
  if (nonJokers.length < 5) return false;
  
  // 获取所有不同的rank
  const ranks = [...new Set(nonJokers.map(c => c.rank))];
  const rankIndices = ranks
    .map(rank => ({ rank, index: RANK_ORDER.indexOf(rank) }))
    .filter(({ rank, index }) => index !== -1 && rank !== mainRank) // 排除主牌
    .map(({ index }) => index)
    .sort((a, b) => a - b);
  
  if (rankIndices.length < 5) return false;
  
  // 检查是否连续
  for (let i = 0; i <= rankIndices.length - 5; i++) {
    let consecutive = true;
    for (let j = 1; j < 5; j++) {
      if (rankIndices[i + j] !== rankIndices[i] + j) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;
  }
  
  return false;
}

/**
 * 创建Play对象
 */
export function createPlay(cards: Card[], mainRank?: Rank, mainSuit?: Suit): Play | null {
  const type = identifyPlayType(cards, mainRank, mainSuit);
  if (!type) return null;
  
  return {
    type,
    cards: sortCards(cards, mainRank, mainSuit),
    mainRank: mainRank || undefined,
    mainSuit: mainSuit || undefined,
  };
}

/**
 * 比较两个Play的大小
 * @returns 正数表示play1大，负数表示play2大，0表示相等或无法比较
 */
export function comparePlays(play1: Play, play2: Play, mainRank?: Rank, mainSuit?: Suit): number {
  // 四王最大
  if (play1.type === PlayType.FOUR_KINGS) return 1;
  if (play2.type === PlayType.FOUR_KINGS) return -1;
  
  // 炸弹大于其他牌型（除了四王）
  const play1IsBomb = play1.type === PlayType.BOMB;
  const play2IsBomb = play2.type === PlayType.BOMB;
  const play1IsFourKings = play1.type === 'four_kings' as PlayType;
  const play2IsFourKings = play2.type === 'four_kings' as PlayType;
  
  if (play1IsBomb && !play2IsBomb && !play2IsFourKings) {
    return 1;
  }
  if (play2IsBomb && !play1IsBomb && !play1IsFourKings) {
    return -1;
  }
  
  // 炸弹之间比较
  if (play1IsBomb && play2IsBomb) {
    // 比较炸弹的牌数和大小
    if (play1.cards.length !== play2.cards.length) {
      return play1.cards.length - play2.cards.length;
    }
    return compareCards(play1.cards[0], play2.cards[0], mainRank, mainSuit);
  }
  
  // 相同牌型才能比较
  if (play1.type !== play2.type) {
    return 0; // 无法比较
  }
  
  // 牌数必须相同
  if (play1.cards.length !== play2.cards.length) {
    return 0;
  }
  
  // 比较主要牌的大小
  const getMainCard = (play: Play): Card => {
    switch (play.type) {
      case PlayType.SINGLE:
      case PlayType.PAIR:
      case PlayType.TRIPLE:
      case PlayType.BOMB:
        return play.cards[0];
      case PlayType.TRIPLE_WITH_PAIR:
        // 三带二比较三张的部分
        const rankCounts = new Map<string, number>();
        play.cards.forEach(c => {
          rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1);
        });
        const tripleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)?.[0];
        return play.cards.find(c => c.rank === tripleRank) || play.cards[0];
      case PlayType.STRAIGHT:
      case PlayType.STRAIGHT_FLUSH:
        return play.cards[play.cards.length - 1]; // 顺子比较最大的牌
      default:
        return play.cards[0];
    }
  };
  
  const card1 = getMainCard(play1);
  const card2 = getMainCard(play2);
  
  return compareCards(card1, card2, mainRank, mainSuit);
}

/**
 * 检查play1是否能压过play2
 */
export function canBeat(play1: Play, play2: Play, mainRank?: Rank, mainSuit?: Suit): boolean {
  const comparison = comparePlays(play1, play2, mainRank, mainSuit);
  return comparison > 0;
}

/**
 * 从手牌中找出所有可能的出牌组合
 */
export function findPossiblePlays(
  hand: Card[],
  lastPlay: Play | null,
  mainRank?: Rank,
  mainSuit?: Suit
): Play[] {
  const possiblePlays: Play[] = [];
  const sortedHand = sortCards(hand, mainRank, mainSuit);
  
  // 如果没有上家出牌，可以出任意合法牌型
  if (!lastPlay) {
    // 找出所有可能的牌型
    const checked = new Set<string>();
    
    // 单张
    sortedHand.forEach(card => {
      const play = createPlay([card], mainRank, mainSuit);
      if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
        possiblePlays.push(play);
        checked.add(play.cards.map(c => c.id).join(','));
      }
    });
    
    // 对子
    for (let i = 0; i < sortedHand.length - 1; i++) {
      for (let j = i + 1; j < sortedHand.length; j++) {
        if (sortedHand[i].rank === sortedHand[j].rank) {
          const play = createPlay([sortedHand[i], sortedHand[j]], mainRank, mainSuit);
          if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
            possiblePlays.push(play);
            checked.add(play.cards.map(c => c.id).join(','));
          }
        }
      }
    }
    
    // 三张
    for (let i = 0; i < sortedHand.length - 2; i++) {
      for (let j = i + 1; j < sortedHand.length - 1; j++) {
        for (let k = j + 1; k < sortedHand.length; k++) {
          if (sortedHand[i].rank === sortedHand[j].rank && sortedHand[j].rank === sortedHand[k].rank) {
            const play = createPlay([sortedHand[i], sortedHand[j], sortedHand[k]], mainRank, mainSuit);
            if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
              possiblePlays.push(play);
              checked.add(play.cards.map(c => c.id).join(','));
            }
          }
        }
      }
    }
    
    // 三带二
    // 简化实现：找出所有三张和对子的组合
    const triples: Card[][] = [];
    const pairs: Card[][] = [];
    
    for (let i = 0; i < sortedHand.length - 2; i++) {
      for (let j = i + 1; j < sortedHand.length - 1; j++) {
        for (let k = j + 1; k < sortedHand.length; k++) {
          if (sortedHand[i].rank === sortedHand[j].rank && sortedHand[j].rank === sortedHand[k].rank) {
            triples.push([sortedHand[i], sortedHand[j], sortedHand[k]]);
          }
        }
      }
    }
    
    for (let i = 0; i < sortedHand.length - 1; i++) {
      for (let j = i + 1; j < sortedHand.length; j++) {
        if (sortedHand[i].rank === sortedHand[j].rank) {
          pairs.push([sortedHand[i], sortedHand[j]]);
        }
      }
    }
    
    triples.forEach(triple => {
      pairs.forEach(pair => {
        if (triple[0].rank !== pair[0].rank) {
          const play = createPlay([...triple, ...pair], mainRank, mainSuit);
          if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
            possiblePlays.push(play);
            checked.add(play.cards.map(c => c.id).join(','));
          }
        }
      });
    });
    
    // 炸弹
    const rankGroups = new Map<Rank, Card[]>();
    sortedHand.forEach(card => {
      if (!rankGroups.has(card.rank)) {
        rankGroups.set(card.rank, []);
      }
      rankGroups.get(card.rank)!.push(card);
    });
    
    rankGroups.forEach(cards => {
      if (cards.length >= 4) {
        // 取前4张或更多
        for (let count = 4; count <= cards.length; count++) {
          const play = createPlay(cards.slice(0, count), mainRank, mainSuit);
          if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
            possiblePlays.push(play);
            checked.add(play.cards.map(c => c.id).join(','));
          }
        }
      }
    });
    
    // 四王
    const jokers = sortedHand.filter(c => c.suit === Suit.JOKER);
    if (jokers.length === 4) {
      const play = createPlay(jokers, mainRank, mainSuit);
      if (play) possiblePlays.push(play);
    }
  } else {
    // 有上家出牌，只能出能压过的牌
    const checked = new Set<string>();
    // 重新调用findPossiblePlays，但这次传入null以获取所有可能
    const allPossible = findPossiblePlays(hand, null, mainRank, mainSuit);
    allPossible.forEach(play => {
      if (canBeat(play, lastPlay, mainRank, mainSuit)) {
        const playKey = play.cards.map(c => c.id).sort().join(',');
        if (!checked.has(playKey)) {
          possiblePlays.push(play);
          checked.add(playKey);
        }
      }
    });
  }
  
  return possiblePlays;
}
