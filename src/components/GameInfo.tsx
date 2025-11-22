import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { RANK_NAMES } from '../utils/constants';
import { SuitIcon } from './card/CardAssets';

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
          className="glass-panel px-5 py-3 flex items-center gap-4 rounded-2xl"
        >
          {/* 当前等级 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-b from-[#d4af37] to-[#b8860b] rounded-xl border border-[#f3d267] shadow-lg flex items-center justify-center">
              <span className="text-2xl font-serif font-bold text-white drop-shadow-md">
                {gameState.level}
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-0.5">Level</span>
              <span className="text-sm font-bold text-gold-metallic tracking-wide">当前级牌</span>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="h-8 w-px bg-white/10" />

          {/* 主牌 */}
          <div className="flex items-center gap-3">
            {gameState.mainSuit && gameState.mainRank ? (
              <>
                <div className={`w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner flex items-center justify-center`}>
                  <div className="w-8 h-8">
                    <SuitIcon suit={gameState.mainSuit as any} />
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-0.5">Trump</span>
                  <span className="text-sm font-bold text-white font-serif">
                    {RANK_NAMES[gameState.mainRank]}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-xs font-serif italic px-2">NO TRUMP</div>
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
          className="glass-panel px-5 py-3 flex items-center gap-4 rounded-2xl"
        >
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Team 1</div>
            <div className="w-10 h-10 bg-[#1A237E] rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <span className="text-white text-lg font-bold font-serif relative z-10">{gameState.teamScores[0]}</span>
            </div>
          </div>

          <div className="text-gold-metallic text-xl font-serif italic font-bold px-1 pt-4">vs</div>

          <div className="flex flex-col items-center">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Team 2</div>
            <div className="w-10 h-10 bg-[#B71C1C] rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <span className="text-white text-lg font-bold font-serif relative z-10">{gameState.teamScores[1]}</span>
            </div>
          </div>
        </motion.div>

        {/* 按钮组 */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTutorial}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/20"
            title="Rules"
          >
            <span className="text-xl font-serif font-bold text-gold-metallic">?</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSettings}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/20"
            title="Settings"
          >
            <span className="text-xl">⚙️</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}