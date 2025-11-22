import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Card from './Card';
import HandDetail from './HandDetail';
import { findPossiblePlays } from '../game/CardTypes';
import { sortCards } from '../utils/helpers';
import { GamePhase, GameMode } from '../game/types';

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
    playCards,
    pass,
    gameMode,
    getHint
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
      playCards();
    }
  };

  const handlePass = () => {
    if (canPass) {
      pass();
    }
  };


  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">

      {/* Hand Area with Buttons */}
      <div className="relative w-full flex flex-col justify-end items-center px-2 md:px-4 pointer-events-auto mb-20 md:mb-24 pb-2 md:pb-4" style={{ minHeight: isMobile ? '320px' : '400px' }}>
        {/* Hand Cards Area */}
        <div className="relative w-full flex justify-center items-end flex-1 mb-2 md:mb-3" style={{ height: isMobile ? '240px' : '300px' }}>
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
                    y: isSelected ? layout.y - (isMobile ? 15 : 20) : layout.y,
                    x: isSelected ? layout.x * 0.95 : layout.x,
                    rotate: layout.rotate,
                    opacity: 1,
                    scale: 1,
                    zIndex: layout.zIndex
                  }}
                  exit={{ y: 200, opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  whileHover={{
                    y: isSelected 
                      ? layout.y - (isMobile ? 20 : 25) 
                      : layout.y - (isMobile ? 10 : 20),
                    scale: 1.1,
                    zIndex: layout.zIndex + 20,
                    transition: { duration: 0.2 }
                  }}
                  style={{
                    position: 'absolute',
                    bottom: isMobile ? 20 : 30,
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

        {/* Action Buttons - 放置在 hand area 底部 */}
        <div className="relative z-[300] flex items-center justify-center gap-3 md:gap-4 pointer-events-auto scale-90 md:scale-100 origin-center mt-2 md:mt-3">
          {isCurrentPlayer && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePass}
                disabled={!canPass}
                className="btn-casino-secondary px-5 py-2 md:px-6 md:py-2.5 text-sm md:text-base"
              >
                不出
              </motion.button>

              {gameMode === GameMode.TEACHING && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={getHint}
                  className="btn-casino-secondary border-[#4CAF50] bg-gradient-to-b from-[#4CAF50] to-[#2E7D32] px-5 py-2 md:px-6 md:py-2.5 text-sm md:text-base"
                >
                  提示
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlay}
                disabled={!canPlay}
                className="btn-casino-primary px-5 py-2 md:px-6 md:py-2.5 text-sm md:text-base"
              >
                出牌
              </motion.button>
            </>
          )}

          {!isCurrentPlayer && (
            <div className="glass-panel text-white/90 px-5 py-2 md:px-6 md:py-2.5 rounded-full font-bold border border-white/20 shadow-lg tracking-wider text-sm md:text-base">
              等待其他玩家...
            </div>
          )}
        </div>
      </div>

      {/* Controls Footer */}
      <div className="absolute bottom-[180px] right-2 md:bottom-8 md:right-6 flex gap-2 z-50 pointer-events-auto">
        <button
          onClick={() => setShowHandDetail(true)}
          className="bg-black/40 hover:bg-black/60 text-white p-2 md:p-3 rounded-full backdrop-blur-md transition-colors border border-white/10 shadow-lg"
          title="View Hand Details"
        >
          <span className="text-lg md:text-xl">📋</span>
        </button>
      </div>

      {/* User Info Panel */}
      <div className="absolute bottom-[180px] left-2 md:bottom-8 md:left-6 z-50 pointer-events-auto flex items-center gap-4 origin-bottom-left scale-90 md:scale-100">
        <div className="glass-panel pl-3 pr-6 py-2 md:pl-4 md:pr-8 md:py-3 rounded-2xl flex items-center gap-3 md:gap-4 border border-white/20 shadow-2xl bg-black/60 backdrop-blur-xl transition-all hover:bg-black/70 hover:scale-105">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center -my-4 -ml-2">
            {player.avatarImage ? (
              <img src={player.avatarImage} alt={player.name} className="w-full h-full object-cover rounded-xl shadow-lg border-2 border-white/30" />
            ) : (
              <span className="text-5xl md:text-6xl filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]" role="img" aria-label="avatar">{player.avatar || '👤'}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold font-serif text-lg md:text-xl leading-tight tracking-wide text-shadow-md">{player.name}</span>
            <span className="text-[10px] md:text-xs text-gray-300 font-serif uppercase tracking-wider mt-0.5 md:mt-1">{gameState?.teamNames?.[player.team] || `队伍 ${player.team + 1}`}</span>
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