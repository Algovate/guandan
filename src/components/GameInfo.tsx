import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SUIT_NAMES, RANK_NAMES } from '../utils/constants';
import { Suit } from '../game/types';

export default function GameInfo() {
  const { gameState, toggleSettings, toggleTutorial } = useGameStore();
  
  if (!gameState) return null;
  
  return (
    <>
      {/* 左上角：游戏状态 (级数 + 主牌) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-10"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="panel-classic px-4 py-3 flex items-center gap-4 shadow-lg bg-opacity-95 backdrop-blur-sm"
        >
          {/* 当前等级 */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-b from-gray-100 to-gray-300 rounded border-2 border-casino-gold shadow-inner flex items-center justify-center">
              <span className="text-xl font-serif font-bold text-classic-black drop-shadow-sm">
                {gameState.level}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight">级数</span>
              <span className="text-xs font-serif font-bold text-casino-wood">当前级牌</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-gray-300/50 shadow-[1px_0_0_white]" />
          
          {/* 主牌 */}
          <div className="flex items-center gap-2">
            {gameState.mainSuit && gameState.mainRank ? (
              <>
                <div className="w-10 h-10 bg-white rounded border-2 border-classic-red shadow-sm flex items-center justify-center">
                  <span className={`text-2xl ${
                    gameState.mainSuit === Suit.HEART || gameState.mainSuit === Suit.DIAMOND 
                      ? 'text-classic-red' 
                      : 'text-classic-black'
                  }`}>
                    {SUIT_NAMES[gameState.mainSuit]}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight">主牌</span>
                  <span className="text-xs font-serif font-bold text-classic-red">
                    {RANK_NAMES[gameState.mainRank]}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-xs font-serif italic px-2">无主牌</div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* 右上角：比分 + 功能按钮 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex items-start gap-3"
      >
        {/* 比分板 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="panel-classic px-4 py-2 flex items-center gap-3 shadow-lg bg-opacity-95 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">一队</div>
            <div className="w-8 h-8 bg-classic-back-blue rounded-full border border-white shadow-md flex items-center justify-center">
              <span className="text-white text-sm font-bold font-serif">{gameState.teamScores[0]}</span>
            </div>
          </div>
          
          <div className="text-casino-gold text-lg font-serif italic font-bold px-1">vs</div>
          
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">二队</div>
            <div className="w-8 h-8 bg-classic-back-red rounded-full border border-white shadow-md flex items-center justify-center">
              <span className="text-white text-sm font-bold font-serif">{gameState.teamScores[1]}</span>
            </div>
          </div>
        </motion.div>

        {/* 按钮组 */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTutorial}
            className="w-10 h-10 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600 shadow-lg flex items-center justify-center text-white hover:border-gray-400 transition-colors"
            title="规则"
          >
            <span className="text-lg font-serif">?</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSettings}
            className="w-10 h-10 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600 shadow-lg flex items-center justify-center text-white hover:border-gray-400 transition-colors"
            title="设置"
          >
            <span className="text-lg">⚙️</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}