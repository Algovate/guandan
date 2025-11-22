import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '../game/types';
import { Suit, Rank } from '../game/types';
import { SUIT_NAMES, RANK_NAMES, RANK_ORDER, SUIT_ORDER } from '../utils/constants';
import { useMemo } from 'react';

interface HandDetailProps {
  cards: Card[];
  isOpen: boolean;
  onClose: () => void;
}

// 统计手牌
const getHandStatistics = (cards: Card[]) => {
  const bySuit: Record<Suit, Card[]> = {
    [Suit.SPADE]: [],
    [Suit.HEART]: [],
    [Suit.DIAMOND]: [],
    [Suit.CLUB]: [],
    [Suit.JOKER]: [],
  };
  
  const byRank: Record<Rank, Card[]> = {
    [Rank.ACE]: [],
    [Rank.TWO]: [],
    [Rank.THREE]: [],
    [Rank.FOUR]: [],
    [Rank.FIVE]: [],
    [Rank.SIX]: [],
    [Rank.SEVEN]: [],
    [Rank.EIGHT]: [],
    [Rank.NINE]: [],
    [Rank.TEN]: [],
    [Rank.JACK]: [],
    [Rank.QUEEN]: [],
    [Rank.KING]: [],
    [Rank.JOKER_SMALL]: [],
    [Rank.JOKER_BIG]: [],
  };
  
  cards.forEach(card => {
    bySuit[card.suit].push(card);
    byRank[card.rank].push(card);
  });
  
  return { bySuit, byRank };
};

export default function HandDetail({ cards, isOpen, onClose }: HandDetailProps) {
  const statistics = useMemo(() => getHandStatistics(cards), [cards]);
  
  // 按花色和点数分组显示
  const groupedBySuit = useMemo(() => {
    return SUIT_ORDER.map(suit => ({
      suit,
      cards: statistics.bySuit[suit],
      count: statistics.bySuit[suit].length
    })).filter(group => group.count > 0);
  }, [statistics]);
  
  // 按点数分组（不包括Joker）
  const groupedByRank = useMemo(() => {
    return RANK_ORDER.filter(rank => rank !== Rank.JOKER_SMALL && rank !== Rank.JOKER_BIG)
      .map(rank => ({
        rank,
        cards: statistics.byRank[rank],
        count: statistics.byRank[rank].length
      }))
      .filter(group => group.count > 0);
  }, [statistics]);
  
  // Joker单独处理
  const jokers = [
    ...statistics.byRank[Rank.JOKER_SMALL],
    ...statistics.byRank[Rank.JOKER_BIG]
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="glass rounded-3xl shadow-2xl border-2 border-accent-gold/40 p-6 md:p-8 relative overflow-hidden"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
              }}
            >
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/8 via-transparent to-ui-primary/8 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                {/* 标题 */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">🃏</div>
                    <div>
                      <h2 className="text-3xl font-display font-bold text-gray-800">我的手牌</h2>
                      <div className="text-sm text-gray-600 mt-1">共 {cards.length} 张牌</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold transition-colors"
                  >
                    ×
                  </motion.button>
                </div>
                
                {/* 按花色分组 */}
                <div className="mb-6">
                  <h3 className="text-lg font-display font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📊</span>
                    <span>按花色分类</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {groupedBySuit.map(({ suit, cards: suitCards, count }) => (
                      <motion.div
                        key={suit}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 rounded-xl p-3 border border-gray-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{SUIT_NAMES[suit]}</span>
                          <span className="font-bold text-gray-800">{count} 张</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {suitCards
                            .sort((a, b) => {
                              const rankOrder = RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
                              return rankOrder;
                            })
                            .map((card, idx) => (
                              <div key={card.id} className="flex items-center gap-1">
                                <span>{RANK_NAMES[card.rank]}</span>
                                {idx < suitCards.length - 1 && <span className="text-gray-400">,</span>}
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* 按点数分组 */}
                <div className="mb-6">
                  <h3 className="text-lg font-display font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>🔢</span>
                    <span>按点数分类</span>
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {groupedByRank.map(({ rank, count }) => (
                      <motion.div
                        key={rank}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/60 rounded-lg p-2 border border-gray-200 text-center"
                      >
                        <div className="font-bold text-gray-800 text-lg">{RANK_NAMES[rank]}</div>
                        <div className="text-xs text-gray-600">{count} 张</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* 王牌 */}
                {jokers.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-display font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span>🃏</span>
                      <span>王牌</span>
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {jokers.map(card => (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-purple-100 rounded-lg px-3 py-2 border border-purple-300"
                        >
                          <span className="font-bold text-purple-700">{RANK_NAMES[card.rank]}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 完整列表 */}
                <div>
                  <h3 className="text-lg font-display font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📋</span>
                    <span>完整列表</span>
                  </h3>
                  <div className="bg-white/60 rounded-xl p-4 border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {cards
                        .sort((a, b) => {
                          const suitOrder = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
                          if (suitOrder !== 0) return suitOrder;
                          return RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
                        })
                        .map((card, index) => (
                          <motion.span
                            key={card.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.01 }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-300 text-sm font-medium"
                          >
                            <span className={card.suit === Suit.HEART || card.suit === Suit.DIAMOND ? 'text-red-600' : 'text-gray-800'}>
                              {SUIT_NAMES[card.suit]}
                            </span>
                            <span className="text-gray-800">{RANK_NAMES[card.rank]}</span>
                            {index < cards.length - 1 && <span className="text-gray-400">,</span>}
                          </motion.span>
                        ))}
                    </div>
                  </div>
                </div>
                
                {/* 关闭按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="btn-primary w-full mt-6 text-lg py-3"
                >
                  关闭
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
