import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GamePhase, GameMode } from '../game/types';
import Card from './Card';
import { SuitIcon } from './card/CardAssets';
import { RANK_NAMES } from '../utils/constants';
import { findPossiblePlays } from '../game/CardTypes';
import { sortCards } from '../utils/helpers';
import PlayHistory from './PlayHistory';
import AllHands from './AllHands';
import Toast from './Toast';

export default function MobileArenaLayout() {
  const {
    gameState,
    selectedCards,
    selectCard,
    playCards,
    pass,
    toggleSettings,
    toggleTutorial,
    toastMessage,
    gameMode,
  } = useGameStore();

  const [handExpanded, setHandExpanded] = useState(true);
  const [showPlayHistory, setShowPlayHistory] = useState(false);
  const [showAllHands, setShowAllHands] = useState(false);

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

  const handlePass = () => {
    if (canPass) {
      pass();
    }
  };

  const handlePlay = () => {
    if (canPlay && selectedPlay && selectedCards.length > 0) {
      playCards();
    }
  };

  const aiPlayers = gameState.players.filter(p => p.isAI);
  const currentPlay = gameState.currentPlay;
  const lastPlayer = gameState.lastPlayPlayerIndex >= 0
    ? gameState.players[gameState.lastPlayPlayerIndex]
    : null;

  // 计算扇形布局
  const calculateFanLayout = (cardCount: number, index: number) => {
    if (cardCount === 0) return { x: 0, y: 0, rotate: 0, zIndex: 0 };
    const centerIndex = (cardCount - 1) / 2;
    const spacing = cardCount > 20 ? 18 : 22;
    const x = (index - centerIndex) * spacing;
    const distanceFromCenter = Math.abs(index - centerIndex);
    const y = Math.pow(distanceFromCenter, 2) * 0.3;
    const rotate = (index - centerIndex) * 1.2;
    return { x, y, rotate, zIndex: index };
  };

  return (
    <div className="fixed inset-0 texture-felt overflow-hidden flex flex-col">
      {/* 顶部状态栏 - 紧凑设计 */}
      <div className="flex-shrink-0 bg-black/20 backdrop-blur-md border-b border-white/10 px-3 py-2 z-50 shadow-md">
        <div className="flex items-center justify-between">
          {/* 左侧：等级和主牌 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-b from-[#d4af37] to-[#b8860b] rounded-lg border border-[#f3d267] flex items-center justify-center">
              <span className="text-sm font-bold text-white">{gameState.level}</span>
            </div>
            {gameState.mainSuit && gameState.mainRank && (
              <>
                <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                  <SuitIcon suit={gameState.mainSuit as any} />
                </div>
                <span className="text-xs text-white font-bold">{RANK_NAMES[gameState.mainRank]}</span>
              </>
            )}
          </div>

          {/* 中间：比分 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#1A237E] rounded-full border border-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{gameState.teamScores[0]}</span>
              </div>
              <span className="text-xs text-gray-400">VS</span>
              <div className="w-6 h-6 bg-[#B71C1C] rounded-full border border-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{gameState.teamScores[1]}</span>
              </div>
            </div>
          </div>

          {/* 右侧：功能按钮 */}
          <div className="flex items-center gap-1.5">
            {/* Teaching Mode Features */}
            {gameMode === GameMode.TEACHING && (
              <>
                <button
                  onClick={() => setShowPlayHistory(true)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm"
                  title="出牌历史"
                >
                  📜
                </button>
                <button
                  onClick={() => setShowAllHands(true)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm"
                  title="查看各家手牌"
                >
                  👁️
                </button>
              </>
            )}
            <button
              onClick={toggleTutorial}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm"
            >
              ?
            </button>
            <button
              onClick={toggleSettings}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* 主游戏区域 */}
      <div className="flex-1 relative overflow-hidden">
        {/* AI玩家信息 - 紧凑列表式 */}
        <div className="absolute top-2 left-0 right-0 z-30 px-2">
          <div className="flex justify-between items-start">
            {aiPlayers.map((aiPlayer) => {
              const playerIndex = gameState.players.indexOf(aiPlayer);
              const isCurrent = playerIndex === gameState.currentPlayerIndex;
              const isThinking = isCurrent && gameState.phase === GamePhase.PLAYING;
              const teamColor = aiPlayer.team === 0 ? 'bg-blue-500/20 border-blue-400' : 'bg-red-500/20 border-red-400';

              return (
                <motion.div
                  key={aiPlayer.id}
                  animate={isCurrent ? { scale: 1.05 } : { scale: 1 }}
                  className={`px-2 py-1 rounded-lg border ${teamColor} backdrop-blur-sm min-w-[60px]`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="text-lg">{aiPlayer.avatar || '🤖'}</div>
                    <div className="text-[10px] text-white font-bold truncate max-w-[50px]">{aiPlayer.name}</div>
                    <div className="text-[9px] text-white/80">剩余: {aiPlayer.hand.length}</div>
                    {isThinking && (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-[8px] text-yellow-400"
                      >
                        思考中...
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 中央出牌区域 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          {currentPlay && lastPlayer && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                {lastPlayer.name} 出牌
              </div>
              <div className="flex items-center gap-1">
                {currentPlay.cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    style={{
                      marginLeft: index === 0 ? 0 : -12,
                      zIndex: index
                    }}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card card={card} faceUp={true} size="sm" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* 当前玩家信息 - 底部中央 */}
        <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 z-30">
          <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
            <div className="flex items-center gap-2">
              <span className="text-lg">{player.avatar || '👤'}</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">{player.name}</span>
                <span className="text-[10px] text-gray-400">队伍 {player.team + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部手牌区域 */}
      <div className="flex-shrink-0 bg-black/40 backdrop-blur-md border-t border-white/10">
        {/* 手牌展开/收起按钮 */}
        <div className="flex justify-center py-1">
          <button
            onClick={() => setHandExpanded(!handExpanded)}
            className="text-white/60 text-xs px-3 py-1"
          >
            {handExpanded ? '收起手牌 ▲' : '展开手牌 ▼'}
          </button>
        </div>

        {/* 操作按钮 */}
        {isCurrentPlayer && (
          <div className="flex justify-center gap-3 px-4 pb-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePass}
              disabled={!canPass}
              className="flex-1 py-3 btn-casino-secondary rounded-xl text-white font-bold text-sm disabled:opacity-50"
            >
              不出
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              disabled={!canPlay}
              className="flex-1 py-3 btn-casino-primary rounded-xl text-white font-bold text-sm disabled:opacity-50 shadow-lg"
            >
              出牌
            </motion.button>
          </div>
        )}

        {/* 手牌显示 */}
        <AnimatePresence>
          {handExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative h-[140px] flex justify-center items-end pb-3 px-2 overflow-hidden"
            >
              <div className="relative w-full max-w-full flex justify-center items-end">
                <AnimatePresence mode="popLayout">
                  {sortedHand.map((card, index) => {
                    const isSelected = selectedCards.some(c => c.id === card.id);
                    const isHighlighted = possiblePlays.some(play =>
                      play.cards.some(c => c.id === card.id)
                    );
                    const layout = calculateFanLayout(sortedHand.length, index);

                    return (
                      <motion.div
                        key={card.id}
                        layoutId={`card-${card.id}`}
                        initial={{ y: 100, opacity: 0, scale: 0.8 }}
                        animate={{
                          y: isSelected ? layout.y - 20 : layout.y,
                          x: layout.x,
                          rotate: layout.rotate,
                          opacity: 1,
                          scale: 1,
                          zIndex: layout.zIndex + (isSelected ? 100 : 0)
                        }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        whileTap={{ scale: 1.15, y: layout.y - 25 }}
                        style={{
                          position: 'absolute',
                          bottom: 5,
                          cursor: 'pointer',
                          transformOrigin: 'center bottom'
                        }}
                        onClick={() => selectCard(card)}
                      >
                        <Card
                          card={card}
                          isSelected={isSelected}
                          isHighlighted={isHighlighted && !isSelected && isCurrentPlayer}
                          size="sm"
                          faceUp={true}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Toast通知 */}
      {toastMessage && toastMessage.message && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => useGameStore.setState({ toastMessage: null })}
        />
      )}

      {/* Teaching Mode Components */}
      {gameMode === GameMode.TEACHING && (
        <>
          <PlayHistory
            plays={gameState.playHistory || []}
            isOpen={showPlayHistory}
            onClose={() => setShowPlayHistory(false)}
          />
          <AllHands
            players={gameState.players}
            mainRank={gameState.mainRank || undefined}
            mainSuit={gameState.mainSuit || undefined}
            isOpen={showAllHands}
            onClose={() => setShowAllHands(false)}
          />
        </>
      )}

    </div>
  );
}

