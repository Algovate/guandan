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

// 线性布局计算
const calculateLinearLayout = (
  cardCount: number, 
  index: number, 
  isMobile: boolean
) => {
  if (cardCount === 0) return { x: 0, zIndex: 0 };
  
  // Calculate center index
  const centerIndex = (cardCount - 1) / 2;
  
  // Spacing logic
  // Standard card width is roughly 100px (desktop) / 80px (mobile)
  // We want visible index (approx 30-40px)
  const baseSpacing = isMobile ? 38 : 50;
  
  // If too many cards, squeeze them
  let spacing = baseSpacing;
  if (cardCount > 15) spacing = baseSpacing * 0.90;
  if (cardCount > 20) spacing = baseSpacing * 0.80;
  if (cardCount > 25) spacing = baseSpacing * 0.70;
  
  const x = (index - centerIndex) * spacing;
  
  return {
    x,
    zIndex: index // Left to Right increasing Z-index ensures Right covers Left (Standard)
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
  
  // 检测是否为移动端，响应窗口大小变化
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
      showToast(`提示：${PLAY_TYPE_NAMES[hintPlay.type]}`, 'info');
    }
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
      
      {/* Action Buttons - Floating above cards - Absolute positioned to prevent overlap */}
      <div className="absolute bottom-[280px] z-[300] flex items-center justify-center gap-6 pointer-events-auto">
        {isCurrentPlayer && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePass}
              disabled={!canPass}
              className="px-8 py-3 rounded-xl bg-gray-300 text-gray-700 font-bold text-xl shadow-lg border-b-4 border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 active:border-b-0 active:translate-y-1 transition-all"
            >
              不出
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHint}
              disabled={possiblePlays.length === 0}
              className="px-8 py-3 rounded-xl bg-[#4CAF50] text-white font-bold text-xl shadow-lg border-b-4 border-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#66BB6A] active:border-b-0 active:translate-y-1 transition-all"
            >
              提示
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              disabled={!canPlay}
              className="px-8 py-3 rounded-xl bg-white text-[#333] font-bold text-xl shadow-lg border-b-4 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:border-b-0 active:translate-y-1 transition-all"
            >
              出牌
            </motion.button>
          </>
        )}
        
        {!isCurrentPlayer && (
           <div className="bg-black/40 backdrop-blur-md text-white px-6 py-2 rounded-full font-bold border border-white/20 shadow-lg">
             等待其他玩家...
           </div>
        )}
      </div>

      {/* Hand Area - Fixed Height Container at Bottom */}
      <div className="relative w-full flex justify-center items-end pb-4 px-4 pointer-events-auto" style={{ height: '220px' }}>
        <div className="relative h-full flex justify-center items-end w-full max-w-5xl">
            <AnimatePresence mode="popLayout">
              {sortedHand.map((card, index) => {
                const isSelected = selectedCards.some(c => c.id === card.id);
                const isHighlighted = possiblePlays.some(play => 
                  play.cards.some(c => c.id === card.id)
                );
                
                const layout = calculateLinearLayout(sortedHand.length, index, isMobile);
                
                return (
                  <motion.div
                    key={card.id}
                    layoutId={`card-${card.id}`}
                    initial={{ y: 100, opacity: 0, scale: 0.8 }}
                    animate={{ 
                      y: isSelected ? -30 : 0, 
                      opacity: 1, 
                      scale: 1,
                      x: layout.x,
                      zIndex: layout.zIndex + (isSelected ? 100 : 0)
                    }}
                    exit={{ y: 200, opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    whileHover={{ 
                      y: isSelected ? -40 : -20,
                      transition: { duration: 0.2 }
                    }}
                    style={{ 
                      position: 'absolute',
                      bottom: 0,
                      cursor: isCurrentPlayer ? 'pointer' : 'default',
                    }}
                  >
                    <Card
                      card={card}
                      isSelected={isSelected}
                      isHighlighted={isHighlighted && !isSelected && isCurrentPlayer}
                      onClick={() => isCurrentPlayer && selectCard(card)}
                      size={isMobile ? "md" : "lg"}
                      faceUp={true}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
        </div>
      </div>
      
      {/* Controls Footer (Sort/Details) */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-50 pointer-events-auto">
         <button 
           onClick={() => setShowHandDetail(true)}
           className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
           title="查看手牌"
         >
           📋
         </button>
      </div>

      <HandDetail
        cards={sortedHand}
        isOpen={showHandDetail}
        onClose={() => setShowHandDetail(false)}
      />
    </div>
  );
}