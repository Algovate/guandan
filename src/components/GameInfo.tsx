import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SUIT_NAMES, RANK_NAMES } from '../utils/constants';
import { Suit } from '../game/types';

export default function GameInfo() {
  const { gameState, toggleSettings, toggleTutorial } = useGameStore();
  
  if (!gameState) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute top-4 md:top-6 left-4 md:left-6 right-4 md:right-6 flex justify-between items-start z-10 flex-wrap gap-3 md:gap-4"
    >
      {/* 左侧信息面板 - 经典铭牌风格 */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="panel-classic px-6 py-3 flex-1 min-w-[280px] md:min-w-[320px]"
      >
        <div className="flex gap-8 items-center flex-wrap justify-center md:justify-start">
          {/* 当前等级 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-b from-gray-100 to-gray-300 rounded border-2 border-casino-gold shadow-inner flex items-center justify-center">
              <span className="text-2xl font-serif font-bold text-classic-black drop-shadow-sm">
                {gameState.level}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">级数</span>
              <span className="text-sm font-serif font-bold text-casino-wood">当前级牌</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-gray-300 shadow-[1px_0_0_white]" />
          
          {/* 主牌 */}
          <div className="flex items-center gap-3">
            {gameState.mainSuit && gameState.mainRank ? (
              <>
                <div className="w-12 h-12 bg-white rounded border-2 border-classic-red shadow-sm flex items-center justify-center">
                  <span className={`text-3xl ${
                    gameState.mainSuit === Suit.HEART || gameState.mainSuit === Suit.DIAMOND 
                      ? 'text-classic-red' 
                      : 'text-classic-black'
                  }`}>
                    {SUIT_NAMES[gameState.mainSuit]}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">主牌</span>
                  <span className="text-sm font-serif font-bold text-classic-red">
                    {RANK_NAMES[gameState.mainRank]}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm font-serif italic">无主牌</div>
            )}
          </div>
          
          <div className="h-10 w-px bg-gray-300 shadow-[1px_0_0_white]" />
          
          {/* 得分 */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">一队</div>
              <div className="w-10 h-10 bg-classic-back-blue rounded-full border-2 border-white shadow-md flex items-center justify-center mx-auto">
                <span className="text-white font-bold font-serif">{gameState.teamScores[0]}</span>
              </div>
            </div>
            <div className="text-casino-gold text-xl font-serif italic font-bold">vs</div>
            <div className="text-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">二队</div>
              <div className="w-10 h-10 bg-classic-back-red rounded-full border-2 border-white shadow-md flex items-center justify-center mx-auto">
                <span className="text-white font-bold font-serif">{gameState.teamScores[1]}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* 右侧按钮组 - 经典按钮风格 */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTutorial}
          className="w-12 h-12 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600 shadow-lg flex items-center justify-center text-white hover:border-gray-400 transition-colors"
          title="规则"
        >
          <span className="text-xl">?</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSettings}
          className="w-12 h-12 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600 shadow-lg flex items-center justify-center text-white hover:border-gray-400 transition-colors"
          title="设置"
        >
          <span className="text-xl">⚙️</span>
        </motion.button>
      </div>
    </motion.div>
  );
}