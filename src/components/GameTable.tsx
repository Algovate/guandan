import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import AIPlayer from './AIPlayer';
import PlayerHand from './PlayerHand';
import PlayArea from './PlayArea';
import GameInfo from './GameInfo';
import Toast from './Toast';
import { PlayerPosition, GamePhase } from '../game/types';

export default function GameTable() {
  const { gameState, initGame, startGame, toastMessage, clearSelection } = useGameStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (gameState?.phase === GamePhase.WAITING) {
      const timer = setTimeout(() => {
        startGame();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [gameState?.phase, startGame]);

  if (!gameState) {
    return (
      <div className="min-h-screen texture-felt flex items-center justify-center relative overflow-hidden">
        {/* 加载动画背景 */}
        <div className="absolute inset-0 bg-black/40" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="text-gold-metallic text-5xl font-serif font-bold flex items-center gap-6 mb-6 drop-shadow-2xl">
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl"
            >
              ♠
            </motion.div>
            <span className="tracking-[0.2em]">CASINO GUANDAN</span>
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="text-6xl"
            >
              ♥
            </motion.div>
          </div>
          <div className="text-white/60 font-serif italic tracking-widest text-lg">正在准备牌桌...</div>
        </motion.div>
      </div>
    );
  }

  const players = gameState.players;
  const currentPlayerIndex = gameState.currentPlayerIndex;

  return (
    <div
      className="min-h-screen texture-felt relative overflow-hidden shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"
      onClick={(e) => {
        // Only clear if clicking the background directly, not children
        if (e.target === e.currentTarget) {
          clearSelection();
        }
      }}
    >
      {/* 桌面边缘装饰 - 豪华木质边框 (Split into 4 parts to avoid center overlap) */}
      {/* 桌面边缘装饰 - 移除木纹边框，保持全屏台面 */}

      {/* 装饰性光照 - 聚光灯效果 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_10%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

      {/* 桌面LOGO */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10 select-none transform -rotate-12">
        <div className="text-gold-metallic text-6xl md:text-9xl font-serif font-bold tracking-widest text-center border-8 border-[#d4af37]/20 p-12 rounded-full">
          <div className="text-4xl md:text-6xl mb-4 opacity-80">ROYAL</div>
          GUANDAN
          <div className="text-4xl md:text-6xl mt-4 opacity-80">CLUB</div>
        </div>
      </div>

      {/* 游戏信息 */}
      <GameInfo />

      {/* AI玩家 */}
      {players.filter(p => p.isAI).map((player, index) => {
        const positions = [PlayerPosition.TOP, PlayerPosition.LEFT, PlayerPosition.RIGHT];
        const playerIndex = players.indexOf(player);
        return (
          <AIPlayer
            key={player.id}
            player={player}
            position={positions[index]}
            isCurrentPlayer={playerIndex === currentPlayerIndex}
            isThinking={playerIndex === currentPlayerIndex && gameState.phase === GamePhase.PLAYING}
          />
        );
      })}

      {/* 中央出牌区域 */}
      <PlayArea />

      {/* 玩家手牌 */}
      <PlayerHand />

      {/* Toast通知 */}
      {toastMessage && toastMessage.message && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => useGameStore.setState({ toastMessage: null })}
        />
      )}

      {/* 游戏结束界面 */}
      {gameState.phase === GamePhase.GAME_END && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="panel-classic p-10 md:p-16 text-center max-w-2xl mx-4 flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-7xl md:text-8xl mb-8 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
            >
              {gameState.teamScores[0] > gameState.teamScores[1] ? '👑' : '🏆'}
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-gold-metallic">
              {gameState.teamScores[0] > gameState.teamScores[1] ? `${gameState.teamNames[0]}获胜` : `${gameState.teamNames[1]}获胜`}
            </h2>

            <div className="mb-10 mt-4 w-full space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-4 text-xl">
                <span className="font-serif text-gray-300">{gameState.teamNames[0]}</span>
                <span className="font-bold text-gold-metallic text-3xl">{gameState.teamScores[0]}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-xl">
                <span className="font-serif text-gray-300">{gameState.teamNames[1]}</span>
                <span className="font-bold text-silver-metallic text-3xl">{gameState.teamScores[1]}</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                initGame();
                startGame();
              }}
              className="btn-casino-primary text-xl px-12 py-4 shadow-2xl"
            >
              再来一局
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}