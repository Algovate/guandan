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

// 计算扇面布局的参数 - 优化为更清晰的布局，让牌更容易看清
const calculateFanLayout = (
  cardCount: number, 
  index: number, 
  isMobile: boolean, 
  isExpanded: boolean = false
) => {
  if (cardCount === 0) return { rotation: 0, x: 0, y: 0, transformOrigin: 'center bottom' };
  
  // 如果展开模式，完全不旋转，让所有牌都清晰可见
  if (isExpanded) {
    const centerIndex = (cardCount - 1) / 2;
    // 展开模式使用更大的间距，确保所有牌都清晰可见，角标完全可见
    const baseSpread = isMobile ? 35 : 60; // 显著增加展开模式的间距
    let spreadDistance = baseSpread;
    
    // 根据牌数调整间距，但保持较大间距以确保可见性
    if (cardCount > 27) {
      spreadDistance = baseSpread * 0.85; // 即使牌很多，也保持很大间距
    } else if (cardCount > 25) {
      spreadDistance = baseSpread * 0.88;
    } else if (cardCount > 20) {
      spreadDistance = baseSpread * 0.92;
    } else if (cardCount > 15) {
      spreadDistance = baseSpread * 0.96;
    } else if (cardCount > 10) {
      spreadDistance = baseSpread * 0.98;
    }
    // cardCount <= 10 时使用完整的 baseSpread
    
    const x = (index - centerIndex) * spreadDistance;
    return {
      rotation: 0, // 展开时完全不旋转，所有牌垂直
      x,
      y: 0,
      transformOrigin: 'center bottom'
    };
  }
  
  // 扇面模式：进一步减少旋转角度，增加间距，让牌更容易看清
  // 最大旋转角度减少到 1-2 度，几乎完全垂直，确保角标清晰可见
  const baseMaxAngle = isMobile ? 1 : 2;
  const angleMultiplier = cardCount < 10 ? 0.15 : cardCount < 20 ? 0.12 : 0.1;
  const dynamicAngle = Math.min(cardCount * angleMultiplier, baseMaxAngle);
  const maxAngle = Math.max(0, dynamicAngle); // 最小角度为0，确保几乎不旋转
  
  // 计算中心索引
  const centerIndex = (cardCount - 1) / 2;
  
  // 计算每张牌的角度
  const angleStep = cardCount > 1 ? maxAngle / (cardCount - 1) : 0;
  const rotation = (index - centerIndex) * angleStep;
  
  // 大幅增加水平间距，让牌充分展开，确保所有牌都清晰可见
  // 进一步增加基础间距，减少重叠，确保角标不被遮挡
  const baseSpread = isMobile ? 35 : 55; // 显著增加基础间距
  let spreadDistance = baseSpread;
  
  // 保持较大的间距，确保每张牌都清晰可见，角标不被遮挡
  // 即使牌很多，也保持相对较大的间距
  if (cardCount > 27) {
    spreadDistance = baseSpread * 0.85; // 大幅提高大牌数时的间距系数
  } else if (cardCount > 25) {
    spreadDistance = baseSpread * 0.88;
  } else if (cardCount > 20) {
    spreadDistance = baseSpread * 0.92;
  } else if (cardCount > 15) {
    spreadDistance = baseSpread * 0.96;
  } else if (cardCount > 10) {
    spreadDistance = baseSpread * 0.98;
  }
  // cardCount <= 10 时使用完整的 baseSpread
  
  const x = (index - centerIndex) * spreadDistance;
  
  return {
    rotation,
    x,
    y: 0,
    transformOrigin: 'center bottom'
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
  
  // 展开/收起状态，展开时所有牌几乎不旋转，更容易看清
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 手牌详情弹窗状态
  const [showHandDetail, setShowHandDetail] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
    };
    
    // 初始设置
    if (typeof window !== 'undefined') {
      handleResize();
    }
    
    // 添加防抖，避免频繁触发
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 200);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', debouncedHandleResize);
      return () => {
        window.removeEventListener('resize', debouncedHandleResize);
        clearTimeout(timeoutId);
      };
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
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="fixed bottom-0 left-0 right-0 z-30"
    >
      {/* 渐变遮罩 - 适应深色毛毡背景 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />
      
      {/* 主要内容 - 经典面板风格 */}
      <div className="relative bg-gradient-to-b from-casino-wood to-black border-t-4 border-casino-gold/60 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
      >
        <div className="max-w-7xl mx-auto">
          {/* 手牌区域 - 扇面布局，优化为更清晰的展示 */}
          <div 
            className="relative flex justify-center items-end mb-4 md:mb-6 pb-3 px-2 w-full" 
            style={{ 
              overflowX: 'visible', 
              overflowY: 'visible',
              minHeight: sortedHand.length > 20 ? '260px' : '240px', // 进一步增加高度
              height: 'auto'
            }}
          >
            <div 
              className="relative w-full" 
              style={{ 
                height: '100%', 
                minHeight: sortedHand.length > 20 ? '260px' : sortedHand.length > 15 ? '250px' : '240px',
                overflow: 'visible',
                // 根据牌数和展开状态动态调整padding，大幅增加以适应更宽的布局
                // 确保角标绝对不被裁剪
                paddingLeft: isExpanded 
                  ? (isMobile 
                      ? (sortedHand.length > 27 ? '90px' : sortedHand.length > 25 ? '80px' : sortedHand.length > 20 ? '70px' : sortedHand.length > 15 ? '60px' : sortedHand.length > 10 ? '50px' : '40px')
                      : (sortedHand.length > 27 ? '180px' : sortedHand.length > 25 ? '160px' : sortedHand.length > 20 ? '140px' : sortedHand.length > 15 ? '120px' : sortedHand.length > 10 ? '100px' : '80px'))
                  : (isMobile
                      ? (sortedHand.length > 27 ? '80px' : sortedHand.length > 25 ? '70px' : sortedHand.length > 20 ? '60px' : sortedHand.length > 15 ? '50px' : sortedHand.length > 10 ? '40px' : '30px')
                      : (sortedHand.length > 27 ? '160px' : sortedHand.length > 25 ? '140px' : sortedHand.length > 20 ? '120px' : sortedHand.length > 15 ? '100px' : sortedHand.length > 10 ? '80px' : '60px')),
                paddingRight: isExpanded
                  ? (isMobile
                      ? (sortedHand.length > 27 ? '90px' : sortedHand.length > 25 ? '80px' : sortedHand.length > 20 ? '70px' : sortedHand.length > 15 ? '60px' : sortedHand.length > 10 ? '50px' : '40px')
                      : (sortedHand.length > 27 ? '180px' : sortedHand.length > 25 ? '160px' : sortedHand.length > 20 ? '140px' : sortedHand.length > 15 ? '120px' : sortedHand.length > 10 ? '100px' : '80px'))
                  : (isMobile
                      ? (sortedHand.length > 27 ? '80px' : sortedHand.length > 25 ? '70px' : sortedHand.length > 20 ? '60px' : sortedHand.length > 15 ? '50px' : sortedHand.length > 10 ? '40px' : '30px')
                      : (sortedHand.length > 27 ? '160px' : sortedHand.length > 25 ? '140px' : sortedHand.length > 20 ? '120px' : sortedHand.length > 15 ? '100px' : sortedHand.length > 10 ? '80px' : '60px'))
              }}
            >
              <AnimatePresence mode="popLayout">
                {sortedHand.map((card, index) => {
                  const isSelected = selectedCards.some(c => c.id === card.id);
                  const isHighlighted = possiblePlays.some(play => 
                    play.cards.some(c => c.id === card.id)
                  );
                  
                  // 计算扇面布局参数
                  const layout = calculateFanLayout(sortedHand.length, index, isMobile, isExpanded);
                  
                  // 选中时提升更多，完全消除旋转让牌完全清晰
                  const selectedY = isSelected ? -40 : 0;
                  // 即使在扇面模式下也尽量减少旋转，确保角标清晰可见
                  const selectedRotation = isSelected ? 0 : Math.abs(layout.rotation) < 0.5 ? layout.rotation : layout.rotation * 0.3; // 进一步减少旋转
                  const selectedScale = isSelected ? 1.30 : 1; // 选中时放大更多
                  
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ 
                        opacity: 0, 
                        y: 100, 
                        scale: 0.5,
                        rotate: 0,
                        x: 0
                      }}
                      animate={{ 
                        opacity: 1, 
                        y: selectedY, 
                        scale: selectedScale,
                        rotate: selectedRotation,
                        x: layout.x
                      }}
                      exit={{ 
                        opacity: 0, 
                        y: 100, 
                        scale: 0.5,
                        rotate: 0,
                        x: 0,
                        transition: { duration: 0.2 }
                      }}
                      transition={{ 
                        delay: isExpanded ? index * 0.008 : index * 0.01, // 展开模式动画更快
                        type: "spring",
                        stiffness: isExpanded ? 350 : 320, // 展开模式更快速
                        damping: isExpanded ? 28 : 26,
                        mass: 0.7
                      }}
                      whileHover={isCurrentPlayer ? {
                        y: isSelected ? -44 : -24,
                        scale: isSelected ? 1.32 : 1.22, // 悬停时放大更多
                        rotate: isSelected ? 0 : (isExpanded ? 0 : 0), // 悬停时完全消除旋转，确保角标清晰
                        zIndex: 200,
                        transition: { duration: 0.2, type: "spring", stiffness: 400, damping: 25 }
                      } : {}}
                      style={{ 
                        position: 'absolute',
                        left: '50%',
                        bottom: 0,
                        transformOrigin: layout.transformOrigin,
                        zIndex: isSelected ? 200 : (isHighlighted ? 100 : sortedHand.length - index + 10), // 提高z-index确保牌可见
                        transformStyle: 'preserve-3d',
                        // 根据屏幕大小和展开状态动态调整marginLeft
                        // 极大幅度减少负margin，甚至使用微小的负margin，确保角标完全暴露
                        marginLeft: isExpanded 
                          ? (isMobile ? '-5px' : '-10px') // 展开时几乎无重叠
                          : (isMobile ? '-8px' : '-15px'), // 扇面模式大幅减少重叠
                        cursor: isCurrentPlayer ? 'pointer' : 'default',
                        willChange: 'transform', // 优化性能
                        // 确保牌在悬停和选中时完全可见
                        pointerEvents: 'auto'
                      }}
                    >
                      <Card
                        card={card}
                        isSelected={isSelected}
                        isHighlighted={isHighlighted && !isSelected && isCurrentPlayer}
                        onClick={() => isCurrentPlayer && selectCard(card)}
                        size={isMobile ? "md" : "lg"} // 移动端使用中等尺寸
                        faceUp={true}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          
          {/* 操作按钮和状态 */}
          {isCurrentPlayer ? (
            <div className="flex flex-col items-center gap-4">
              {/* 手牌统计信息 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 text-sm text-gray-300 bg-black/20 rounded-full px-4 py-2 backdrop-blur-sm border border-white/10"
              >
                <span className="text-lg">🃏</span>
                <span className="font-semibold">手牌：{sortedHand.length} 张</span>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => setShowHandDetail(true)}
                  className="text-accent-yellow hover:text-accent-amber font-medium underline decoration-dotted underline-offset-2 transition-colors"
                  title="点击查看手牌详情"
                >
                  查看详情
                </button>
              </motion.div>
              
              {/* 选中牌型提示 */}
              {selectedPlay && selectedCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-accent-yellow font-semibold text-lg flex items-center gap-2 px-4 py-2 bg-accent-yellow/10 rounded-full border border-accent-yellow/30 backdrop-blur-sm"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ✨
                  </motion.span>
                  <span>可出：{PLAY_TYPE_NAMES[selectedPlay.type]}</span>
                </motion.div>
              )}
              
              {/* 按钮组 */}
              <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                {/* 查看手牌详情按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHandDetail(true)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded px-4 py-2 text-sm md:text-base font-serif font-bold shadow-md flex items-center gap-2 transition-all"
                  title="查看手牌详情 - 以文字列表形式查看所有手牌"
                >
                  <span>📋</span>
                  <span className="hidden sm:inline">我的手牌</span>
                </motion.button>
                
                {/* 展开/收起按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsExpanded(!isExpanded);
                    if (!isExpanded) {
                      showToast('已切换到清晰视图', 'info');
                    } else {
                      showToast('已切换到扇面视图', 'info');
                    }
                  }}
                  className={`${isExpanded ? 'bg-casino-gold text-black' : 'bg-gray-800 text-gray-200'} border border-gray-600 hover:brightness-110 rounded px-4 py-2 text-sm md:text-base font-serif font-bold shadow-md flex items-center gap-2 transition-all`}
                  title={isExpanded ? "收起手牌" : "展开手牌"}
                >
                  <motion.span
                    animate={isExpanded ? { rotate: 0 } : { rotate: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isExpanded ? '📋' : '👁️'}
                  </motion.span>
                  <span className="hidden sm:inline">{isExpanded ? '收起' : '展开'}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlay}
                  disabled={!canPlay}
                  className="bg-gradient-to-b from-casino-gold to-yellow-600 text-white border border-yellow-400 rounded px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-serif font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale flex items-center gap-2 hover:shadow-xl transition-all"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  <span>🎯</span>
                  <span className="hidden sm:inline">{selectedPlay ? `出 ${PLAY_TYPE_NAMES[selectedPlay.type]}` : '出牌'}</span>
                  <span className="sm:hidden">出牌</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePass}
                  disabled={!canPass}
                  className="bg-gradient-to-b from-gray-700 to-gray-900 text-white border border-gray-600 rounded px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-serif font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-all"
                >
                  不出
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleHint}
                  disabled={possiblePlays.length === 0}
                  className="bg-gradient-to-b from-blue-600 to-blue-800 text-white border border-blue-500 rounded px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-serif font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:brightness-110 transition-all"
                >
                  <span>💡</span>
                  <span className="hidden sm:inline">提示</span>
                </motion.button>
                
                {selectedCards.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearSelection}
                    className="bg-red-800/80 hover:bg-red-700 text-white border border-red-600/50 rounded px-4 py-2 text-sm md:text-base font-serif font-bold shadow-md transition-all"
                  >
                    取消
                  </motion.button>
                )}
              </div>
              
              {/* 手牌数量和视图提示 */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-white/70 text-sm">
                  剩余 {sortedHand.length} 张牌
                </div>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-accent-yellow/80 text-xs flex items-center gap-1"
                  >
                    <span>✨</span>
                    <span>清晰视图 - 所有牌垂直排列</span>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <div className="text-accent-yellow text-xl font-semibold flex items-center justify-center gap-2 px-4 py-2 bg-accent-yellow/10 rounded-full border border-accent-yellow/30 backdrop-blur-sm"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  ⏳
                </motion.div>
                <span>等待其他玩家出牌...</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* 手牌详情弹窗 */}
      <HandDetail
        cards={sortedHand}
        isOpen={showHandDetail}
        onClose={() => setShowHandDetail(false)}
      />
    </motion.div>
  );
}