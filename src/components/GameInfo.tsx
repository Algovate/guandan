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
          className="px-5 py-2 flex items-center gap-4 shadow-xl bg-[#F9F7E8] rounded-2xl border-2 border-[#C5A059]"
        >
          {/* 当前等级 */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-b from-white to-gray-100 rounded-lg border-2 border-[#C5A059] shadow-sm flex items-center justify-center">
              <span className="text-2xl font-serif font-bold text-gray-800">
                {gameState.level}
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[11px] text-gray-500 font-medium mb-0.5">级数</span>
              <span className="text-sm font-bold text-[#5D4037] tracking-wide">当前级牌</span>
            </div>
          </div>
          
          {/* 分隔线 */}
          <div className="h-8 w-px bg-gray-300" />
          
          {/* 主牌 */}
          <div className="flex items-center gap-3">
            {gameState.mainSuit && gameState.mainRank ? (
              <>
                <div className={`w-11 h-11 bg-white rounded-lg border-2 shadow-sm flex items-center justify-center ${
                   // 主牌框总是红色边框，突出显示
                   'border-[#D32F2F]'
                }`}>
                  <div className="w-7 h-7">
                    <SuitIcon suit={gameState.mainSuit as any} />
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-gray-500 font-medium mb-0.5">主牌</span>
                  <span className="text-sm font-bold text-[#D32F2F] font-serif">
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
        {/* 比分板 - 保持经典风格但微调以匹配左侧色调 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="px-4 py-2 flex items-center gap-3 shadow-xl bg-[#F9F7E8] rounded-2xl border-2 border-[#C5A059]"
        >
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">一队</div>
            <div className="w-8 h-8 bg-[#1A237E] rounded-full border-2 border-white shadow-md flex items-center justify-center">
              <span className="text-white text-sm font-bold font-serif">{gameState.teamScores[0]}</span>
            </div>
          </div>
          
          <div className="text-[#C5A059] text-lg font-serif italic font-bold px-1">vs</div>
          
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">二队</div>
            <div className="w-8 h-8 bg-[#B71C1C] rounded-full border-2 border-white shadow-md flex items-center justify-center">
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
            className="w-10 h-10 rounded-full bg-[#37474F] border-2 border-[#546E7A] shadow-lg flex items-center justify-center text-white hover:bg-[#455A64] transition-colors"
            title="规则"
          >
            <span className="text-lg font-serif font-bold">?</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSettings}
            className="w-10 h-10 rounded-full bg-[#37474F] border-2 border-[#546E7A] shadow-lg flex items-center justify-center text-white hover:bg-[#455A64] transition-colors"
            title="设置"
          >
            <span className="text-lg">⚙️</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}