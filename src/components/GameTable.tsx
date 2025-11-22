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
  const { gameState, initGame, startGame, toastMessage } = useGameStore();
  
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
        <div className="absolute inset-0 bg-black/30" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="text-casino-gold text-4xl font-serif font-bold flex items-center gap-4 mb-4 drop-shadow-lg">
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl"
            >
              🂡
            </motion.div>
            <span className="tracking-widest">CASINO GUANDAN</span>
          </div>
          <div className="text-white/80 font-serif italic">正在加载...</div>
        </motion.div>
      </div>
    );
  }
  
  const players = gameState.players;
  const currentPlayerIndex = gameState.currentPlayerIndex;
  
  return (
    <div className="min-h-screen texture-felt relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      {/* 桌面边缘装饰 - 木质边框 */}
      <div className="absolute inset-0 border-[12px] border-casino-wood pointer-events-none z-50 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_0_0_2px_rgba(0,0,0,0.8)] rounded-none" />
      
      {/* 装饰性光照 - 聚光灯效果 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      
      {/* 桌面LOGO */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10 select-none">
        <div className="text-casino-gold text-6xl md:text-8xl font-serif font-bold tracking-widest text-center border-4 border-casino-gold p-8 rounded-full">
          ♣ 掼 蛋 ♦
          <div className="text-4xl md:text-6xl mt-2">GUANDAN</div>
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
            className="panel-classic p-8 md:p-12 text-center max-w-md mx-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-6xl md:text-7xl mb-6"
            >
              {gameState.teamScores[0] > gameState.teamScores[1] ? '👑' : '🏆'}
            </motion.div>
            
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 text-casino-wood">
              {gameState.teamScores[0] > gameState.teamScores[1] ? '一队获胜！' : '二队获胜！'}
            </h2>
            
            <div className="mb-8 mt-4 space-y-2">
              <div className="flex justify-between items-center border-b border-gray-300 pb-2 text-lg">
                <span className="font-serif text-gray-600">一队</span>
                <span className="font-bold text-classic-red text-2xl">{gameState.teamScores[0]}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-lg">
                <span className="font-serif text-gray-600">二队</span>
                <span className="font-bold text-classic-black text-2xl">{gameState.teamScores[1]}</span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                initGame();
                startGame();
              }}
              className="px-8 py-3 bg-gradient-to-b from-casino-gold to-yellow-600 rounded-full text-white font-bold text-lg shadow-lg border border-yellow-400 w-full hover:shadow-xl transition-all"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
            >
              再来一局
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}