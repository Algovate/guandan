import type { Card, Play } from './types';
import { PlayType, Rank, Suit } from './types';
import { RANK_ORDER } from '../utils/constants';
import { sortCards, compareCardValues } from '../utils/helpers';

/**
 * 识别牌型
 */
export function identifyPlayType(cards: Card[]): PlayType | null {
  if (cards.length === 0) return null;

  const sortedCards = sortCards(cards);
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

  // 钢板（二个连续三张牌，不可超过2个，6张）
  if (count === 6) {
    const plate = isPlate(sortedCards);
    if (plate) {
      return PlayType.PLATE;
    }
  }

  // 三连对（三对连续对牌，不可超过3对，6张）
  if (count === 6) {
    const triplePair = isTriplePair(sortedCards);
    if (triplePair) {
      return PlayType.TRIPLE_PAIR;
    }
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

  // 顺子（恰好5张连续，不可超过五张）
  if (count === 5) {
    const straight = isStraight(sortedCards);
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
 * 检查是否为顺子（恰好5张连续单牌）
 */
function isStraight(cards: Card[]): boolean {
  if (cards.length !== 5) return false;

  // 排除王
  const nonJokers = cards.filter(c => c.suit !== Suit.JOKER);
  if (nonJokers.length !== 5) return false;

  // 获取所有不同的rank（必须是5张不同的牌）
  const ranks = [...new Set(nonJokers.map(c => c.rank))];
  if (ranks.length !== 5) return false;

  const rankIndices = ranks
    .map(rank => ({ rank, index: RANK_ORDER.indexOf(rank) }))
    .filter(({ index }) => index !== -1)
    .map(({ index }) => index)
    .sort((a, b) => a - b);

  if (rankIndices.length !== 5) return false;

  // 检查是否连续
  let consecutive = true;
  for (let j = 1; j < 5; j++) {
    if (rankIndices[j] !== rankIndices[0] + j) {
      consecutive = false;
      break;
    }
  }

  return consecutive;
}

/**
 * 检查是否为三连对（三对连续对牌，不可超过3对）
 */
function isTriplePair(cards: Card[]): boolean {
  if (cards.length !== 6) return false;

  // 排除王
  const nonJokers = cards.filter(c => c.suit !== Suit.JOKER);
  if (nonJokers.length !== 6) return false;

  // 统计每个rank的数量
  const rankCounts = new Map<Rank, number>();
  nonJokers.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });

  // 必须是3个不同的rank，每个都是2张
  if (rankCounts.size !== 3) return false;
  for (const count of rankCounts.values()) {
    if (count !== 2) return false;
  }

  // 获取这三个rank
  const ranks = Array.from(rankCounts.keys())
    .map(rank => ({ rank, index: RANK_ORDER.indexOf(rank) }))
    .filter(({ index }) => index !== -1)
    .map(({ index }) => index)
    .sort((a, b) => a - b);

  if (ranks.length !== 3) return false;

  // 检查是否连续
  return ranks[1] === ranks[0] + 1 && ranks[2] === ranks[1] + 1;
}

/**
 * 检查是否为钢板（二个连续三张牌，不可超过2个）
 */
function isPlate(cards: Card[]): boolean {
  if (cards.length !== 6) return false;

  // 排除王
  const nonJokers = cards.filter(c => c.suit !== Suit.JOKER);
  if (nonJokers.length !== 6) return false;

  // 统计每个rank的数量
  const rankCounts = new Map<Rank, number>();
  nonJokers.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });

  // 必须是2个不同的rank，每个都是3张
  if (rankCounts.size !== 2) return false;
  for (const count of rankCounts.values()) {
    if (count !== 3) return false;
  }

  // 获取这两个rank
  const ranks = Array.from(rankCounts.keys())
    .map(rank => ({ rank, index: RANK_ORDER.indexOf(rank) }))
    .filter(({ index }) => index !== -1)
    .map(({ index }) => index)
    .sort((a, b) => a - b);

  if (ranks.length !== 2) return false;

  // 检查是否连续
  return ranks[1] === ranks[0] + 1;
}

/**
 * 创建Play对象
 */
export function createPlay(cards: Card[]): Play | null {
  const type = identifyPlayType(cards);
  if (!type) return null;

  return {
    type,
    cards: sortCards(cards),
  };
}

/**
 * 获取牌型的优先级（数字越大优先级越高）
 */
function getPlayTypePriority(play: Play): number {
  switch (play.type) {
    case PlayType.FOUR_KINGS:
      return 100; // 最高
    case PlayType.BOMB:
      if (play.cards.length >= 6) return 90; // 六张和六张以上炸弹
      if (play.cards.length === 5) return 70; // 五张炸弹
      return 60; // 四张炸弹
    case PlayType.STRAIGHT_FLUSH:
      return 80; // 同花顺
    case PlayType.TRIPLE_PAIR:
      return 50; // 三连对
    case PlayType.PLATE:
      return 50; // 钢板
    case PlayType.TRIPLE_WITH_PAIR:
      return 50; // 三带二
    case PlayType.TRIPLE:
      return 50; // 三张
    case PlayType.PAIR:
      return 50; // 对子
    case PlayType.SINGLE:
      return 50; // 单张
    case PlayType.STRAIGHT:
      return 50; // 顺子（不在炸弹范围内）
    default:
      return 0;
  }
}

/**
 * 比较两个Play的大小
 * @returns 正数表示play1大，负数表示play2大，0表示相等或无法比较
 * 规则：四王 > 六张和六张以上炸弹 > 同花顺 > 五张炸弹 > 四张炸弹 > 其它牌型
 */
export function comparePlays(play1: Play, play2: Play): number {
  const priority1 = getPlayTypePriority(play1);
  const priority2 = getPlayTypePriority(play2);

  // 先比较优先级
  if (priority1 !== priority2) {
    return priority1 - priority2;
  }

  // 优先级相同，进一步比较

  // 四王都是最大的
  if (play1.type === PlayType.FOUR_KINGS && play2.type === PlayType.FOUR_KINGS) {
    return 0; // 相等
  }

  // 炸弹之间比较
  if (play1.type === PlayType.BOMB && play2.type === PlayType.BOMB) {
    // 先比较牌数（六张及以上优先）
    if (play1.cards.length !== play2.cards.length) {
      return play1.cards.length - play2.cards.length;
    }
    // 牌数相同，比较大小
    return compareCardValues(play1.cards[0], play2.cards[0]);
  }

  // 同花顺之间比较
  if (play1.type === PlayType.STRAIGHT_FLUSH && play2.type === PlayType.STRAIGHT_FLUSH) {
    return compareCardValues(play1.cards[play1.cards.length - 1], play2.cards[play2.cards.length - 1]);
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
      case PlayType.TRIPLE_PAIR:
        // 三连对比较最大的对子
        return play.cards[play.cards.length - 1];
      case PlayType.PLATE:
        // 钢板比较最大的三张
        return play.cards[play.cards.length - 1];
      case PlayType.STRAIGHT:
      case PlayType.STRAIGHT_FLUSH:
        return play.cards[play.cards.length - 1]; // 顺子比较最大的牌
      default:
        return play.cards[0];
    }
  };

  const card1 = getMainCard(play1);
  const card2 = getMainCard(play2);

  return compareCardValues(card1, card2);
}

/**
 * 检查play1是否能压过play2
 */
export function canBeat(play1: Play, play2: Play): boolean {
  const comparison = comparePlays(play1, play2);
  return comparison > 0;
}

/**
 * 从手牌中找出所有可能的出牌组合
 */
export function findPossiblePlays(
  hand: Card[],
  lastPlay: Play | null
): Play[] {
  const possiblePlays: Play[] = [];
  const sortedHand = sortCards(hand);

  // 如果没有上家出牌，可以出任意合法牌型
  if (!lastPlay) {
    // 找出所有可能的牌型
    const checked = new Set<string>();

    // 单张
    sortedHand.forEach(card => {
      const play = createPlay([card]);
      if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
        possiblePlays.push(play);
        checked.add(play.cards.map(c => c.id).join(','));
      }
    });

    // 对子
    for (let i = 0; i < sortedHand.length - 1; i++) {
      for (let j = i + 1; j < sortedHand.length; j++) {
        if (sortedHand[i].rank === sortedHand[j].rank) {
          const play = createPlay([sortedHand[i], sortedHand[j]]);
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
            const play = createPlay([sortedHand[i], sortedHand[j], sortedHand[k]]);
            if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
              possiblePlays.push(play);
              checked.add(play.cards.map(c => c.id).join(','));
            }
          }
        }
      }
    }

    // 三带二
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
          const play = createPlay([...triple, ...pair]);
          if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
            possiblePlays.push(play);
            checked.add(play.cards.map(c => c.id).join(','));
          }
        }
      });
    });

    // 钢板（二个连续三张牌）
    for (let i = 0; i < triples.length - 1; i++) {
      for (let j = i + 1; j < triples.length; j++) {
        if (triples[i][0].rank !== triples[j][0].rank) {
          const rank1Index = RANK_ORDER.indexOf(triples[i][0].rank);
          const rank2Index = RANK_ORDER.indexOf(triples[j][0].rank);
          if (rank1Index !== -1 && rank2Index !== -1) {
            const minIndex = Math.min(rank1Index, rank2Index);
            const maxIndex = Math.max(rank1Index, rank2Index);
            // 检查是否连续
            if (maxIndex === minIndex + 1) {
              const plateCards = [...triples[i], ...triples[j]];
              const play = createPlay(plateCards);
              if (play && play.type === PlayType.PLATE && !checked.has(play.cards.map(c => c.id).join(','))) {
                possiblePlays.push(play);
                checked.add(play.cards.map(c => c.id).join(','));
              }
            }
          }
        }
      }
    }

    // 三连对
    for (let i = 0; i < pairs.length - 2; i++) {
      for (let j = i + 1; j < pairs.length - 1; j++) {
        for (let k = j + 1; k < pairs.length; k++) {
          const ranks = [pairs[i][0].rank, pairs[j][0].rank, pairs[k][0].rank];
          // 检查是否三个不同的rank
          if (ranks[0] !== ranks[1] && ranks[1] !== ranks[2] && ranks[0] !== ranks[2]) {
            const rankIndices = ranks
              .map(rank => RANK_ORDER.indexOf(rank))
              .filter(idx => idx !== -1)
              .sort((a, b) => a - b);
            if (rankIndices.length === 3) {
              // 检查是否连续
              if (rankIndices[1] === rankIndices[0] + 1 && rankIndices[2] === rankIndices[1] + 1) {
                const triplePairCards = [...pairs[i], ...pairs[j], ...pairs[k]];
                const play = createPlay(triplePairCards);
                if (play && play.type === PlayType.TRIPLE_PAIR && !checked.has(play.cards.map(c => c.id).join(','))) {
                  possiblePlays.push(play);
                  checked.add(play.cards.map(c => c.id).join(','));
                }
              }
            }
          }
        }
      }
    }

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
          const play = createPlay(cards.slice(0, count));
          if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
            possiblePlays.push(play);
            checked.add(play.cards.map(c => c.id).join(','));
          }
        }
      }
    });

    // 顺子（恰好5张连续单牌）
    const rankMap = new Map<Rank, Card[]>();
    sortedHand.forEach(card => {
      if (card.suit !== Suit.JOKER) {
        if (!rankMap.has(card.rank)) {
          rankMap.set(card.rank, []);
        }
        rankMap.get(card.rank)!.push(card);
      }
    });

    const ranks = Array.from(rankMap.keys())
      .map(rank => ({ rank, index: RANK_ORDER.indexOf(rank) }))
      .filter(({ index }) => index !== -1)
      .sort((a, b) => a.index - b.index)
      .map(({ rank }) => rank);

    // 查找所有可能的5张连续组合
    for (let i = 0; i <= ranks.length - 5; i++) {
      const straightRanks = ranks.slice(i, i + 5);
      // 检查是否连续
      let isConsecutive = true;
      for (let j = 1; j < 5; j++) {
        const prevIndex = RANK_ORDER.indexOf(straightRanks[j - 1]);
        const currIndex = RANK_ORDER.indexOf(straightRanks[j]);
        if (currIndex !== prevIndex + 1) {
          isConsecutive = false;
          break;
        }
      }

      if (isConsecutive) {
        // 生成所有可能的顺子组合
        const generateStraights = (rankIndex: number, currentCards: Card[]): void => {
          if (rankIndex === 5) {
            const play = createPlay(currentCards);
            if (play && (play.type === PlayType.STRAIGHT || play.type === PlayType.STRAIGHT_FLUSH)) {
              const key = play.cards.map(c => c.id).sort().join(',');
              if (!checked.has(key)) {
                possiblePlays.push(play);
                checked.add(key);
              }
            }
            return;
          }

          const rank = straightRanks[rankIndex];
          const cardsForRank = rankMap.get(rank) || [];
          for (const card of cardsForRank) {
            generateStraights(rankIndex + 1, [...currentCards, card]);
          }
        };

        generateStraights(0, []);
      }
    }

    // 四王
    const jokers = sortedHand.filter(c => c.suit === Suit.JOKER);
    if (jokers.length === 4) {
      const play = createPlay(jokers);
      if (play && !checked.has(play.cards.map(c => c.id).join(','))) {
        possiblePlays.push(play);
        checked.add(play.cards.map(c => c.id).join(','));
      }
    }
  } else {
    // 有上家出牌，只能出能压过的牌
    const checked = new Set<string>();
    const allPossible = findPossiblePlays(hand, null);
    allPossible.forEach(play => {
      if (canBeat(play, lastPlay)) {
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
