import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Card from './Card';
import HandDetail from './HandDetail';
import type { Card as CardType } from '../game/types';
import { findPossiblePlays } from '../game/CardTypes';
import { sortCards } from '../utils/helpers';
import { PLAY_TYPE_NAMES } from '../utils/constants';
import { GamePhase } from '../game/types';

// 扇形布局计算
const calculateFanLayout = (
  cardCount: number,
  index: number,
  isMobile: boolean
) => {
  if (cardCount === 0) return { x: 0, y: 0, rotate: 0, zIndex: 0 };

  const centerIndex = (cardCount - 1) / 2;
  const baseSpacing = isMobile ? 30 : 40;

  // Squeeze if too many cards
  let spacing = baseSpacing;
  if (cardCount > 15) spacing = baseSpacing * 0.85;
  if (cardCount > 20) spacing = baseSpacing * 0.70;

  const x = (index - centerIndex) * spacing;

  // Fan effect: cards on edges are lower and rotated
  const distanceFromCenter = Math.abs(index - centerIndex);
  const y = Math.pow(distanceFromCenter, 2) * (isMobile ? 0.5 : 0.8) + 10;
  const rotate = (index - centerIndex) * (isMobile ? 2 : 3);

  return {
    x,
    y,
    rotate,
    zIndex: index
  };
};

export default function PlayerHand() {
  const {
    gameState,
    selectedCards,
    selectCard,
    clearSelection,
    playCards,
    pass,
    showToast
  } = useGameStore();

  if (!gameState) return null;

  const player = gameState.players.find(p => !p.isAI);
  if (!player) return null;

  const sortedHand = sortCards(
    player.hand,
    gameState.mainRank || undefined,
    gameState.mainSuit || undefined
  );

  const isCurrentPlayer = gameState.currentPlayerIndex === gameState.players.indexOf(player);

  const possiblePlays = isCurrentPlayer
    ? findPossiblePlays(
      sortedHand,
      gameState.lastPlay,
      gameState.mainRank || undefined,
      gameState.mainSuit || undefined
    )
    : [];

  const selectedPlay = possiblePlays.find(play => {
    if (play.cards.length !== selectedCards.length) return false;
    const selectedIds = new Set(selectedCards.map(c => c.id));
    return play.cards.every(c => selectedIds.has(c.id));
  });

  const canPlay = selectedPlay !== undefined && selectedCards.length > 0;
  const canPass = isCurrentPlayer && gameState.lastPlay !== null && gameState.phase === GamePhase.PLAYING;

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const [showHandDetail, setShowHandDetail] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handlePlay = () => {
    if (canPlay && selectedPlay && selectedCards.length > 0) {
      playCards(selectedCards);
    }
  };

  const handlePass = () => {
    if (canPass) {
      pass();
    }
  };

  const handleHint = () => {
    if (possiblePlays.length > 0) {
      const hintPlay = possiblePlays[0];
      clearSelection();
      const cardsToSelect = hintPlay.cards
        .map(c => sortedHand.find(h => h.id === c.id))
        .filter((c): c is CardType => c !== undefined);

      setTimeout(() => {
        cardsToSelect.forEach((card, index) => {
          setTimeout(() => selectCard(card), index * 50);
        });
      }, 100);
      showToast(`Hint: ${PLAY_TYPE_NAMES[hintPlay.type]}`, 'info');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">

      {/* Action Buttons */}
      <div className="absolute bottom-[280px] z-[300] flex items-center justify-center gap-6 pointer-events-auto">
        {isCurrentPlayer && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePass}
              disabled={!canPass}
              className="btn-casino-secondary"
            >
              不出
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHint}
              disabled={possiblePlays.length === 0}
              className="btn-casino-secondary border-[#4CAF50] bg-gradient-to-b from-[#4CAF50] to-[#2E7D32]"
            >
              提示
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              disabled={!canPlay}
              className="btn-casino-primary"
            >
              出牌
            </motion.button>
          </>
        )}

        {!isCurrentPlayer && (
          <div className="glass-panel text-white/90 px-8 py-3 rounded-full font-bold border border-white/20 shadow-lg tracking-wider">
            等待其他玩家...
          </div>
        )}
      </div>

      {/* Hand Area */}
      <div className="relative w-full flex justify-center items-end pb-8 px-4 pointer-events-auto" style={{ height: '260px' }}>
        <div className="relative h-full flex justify-center items-end w-full max-w-5xl">
          <AnimatePresence mode="popLayout">
            {sortedHand.map((card, index) => {
              const isSelected = selectedCards.some(c => c.id === card.id);
              const isHighlighted = possiblePlays.some(play =>
                play.cards.some(c => c.id === card.id)
              );

              const layout = calculateFanLayout(sortedHand.length, index, isMobile);

              return (
                <motion.div
                  key={card.id}
                  layoutId={`card-${card.id}`}
                  initial={{ y: 200, opacity: 0, scale: 0.8 }}
                  animate={{
                    y: isSelected ? layout.y - 40 : layout.y,
                    x: layout.x,
                    rotate: layout.rotate,
                    opacity: 1,
                    scale: 1,
                    zIndex: layout.zIndex + (isSelected ? 100 : 0)
                  }}
                  exit={{ y: 200, opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  whileHover={{
                    y: isSelected ? layout.y - 50 : layout.y - 20,
                    scale: 1.1,
                    zIndex: 100,
                    transition: { duration: 0.2 }
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    cursor: 'pointer',
                    transformOrigin: 'center bottom'
                  }}
                >
                  <Card
                    card={card}
                    isSelected={isSelected}
                    isHighlighted={isHighlighted && !isSelected && isCurrentPlayer}
                    onClick={() => selectCard(card)}
                    size={isMobile ? "md" : "lg"}
                    faceUp={true}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls Footer */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-50 pointer-events-auto">
        <button
          onClick={() => setShowHandDetail(true)}
          className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md transition-colors border border-white/10 shadow-lg"
          title="View Hand Details"
        >
          <span className="text-xl">📋</span>
        </button>
      </div>

      {/* User Info Panel */}
      <div className="absolute bottom-6 left-6 z-50 pointer-events-auto flex items-center gap-3">
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 border border-white/20 shadow-lg bg-black/30 backdrop-blur-md">
          <div className={`w-10 h-10 rounded-full border-2 border-casino-gold shadow-md flex items-center justify-center bg-gradient-to-br ${player.team === 0 ? 'from-blue-500 to-blue-700' : 'from-red-500 to-red-700'} text-white overflow-hidden`}>
            <span className="text-xl" role="img" aria-label="avatar">{player.avatar || '👤'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold font-serif text-sm leading-tight">{player.name}</span>
            <span className="text-xs text-gray-300 font-serif">队伍 {player.team + 1}</span>
          </div>
        </div>
      </div>

      <HandDetail
        cards={sortedHand}
        isOpen={showHandDetail}
        onClose={() => setShowHandDetail(false)}
      />
    </div>
  );
}