import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { RANK_NAMES } from '../utils/constants';
import { GameMode } from '../game/types';
import { SuitIcon } from './card/CardAssets';

interface GameInfoProps {
  onOpenPlayHistory?: () => void;
  onOpenAllHands?: () => void;
}

export default function GameInfo({ onOpenPlayHistory, onOpenAllHands }: GameInfoProps) {
  const { gameState, toggleSettings, toggleTutorial, gameMode } = useGameStore();

  if (!gameState) return null;

  return (
    <>
      {/* 左上角：游戏状态 (级数 + 主牌) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-10 origin-top-left scale-90 md:scale-100"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-panel px-3 py-2 md:px-5 md:py-3 flex items-center gap-3 md:gap-4 rounded-2xl"
        >
          {/* 当前等级 */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-b from-[#d4af37] to-[#b8860b] rounded-xl border border-[#f3d267] shadow-lg flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-xl md:text-2xl font-display font-bold text-white drop-shadow-md">
                {gameState.level}
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[8px] md:text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-0.5">Level</span>
              <span className="text-xs md:text-sm font-bold text-gold-metallic tracking-wide font-display">当前级牌</span>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="h-6 md:h-8 w-px bg-white/10" />

          {/* 主牌 */}
          <div className="flex items-center gap-2 md:gap-3">
            {gameState.mainSuit && gameState.mainRank ? (
              <>
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner flex items-center justify-center`}>
                  <div
                    className={`w-6 h-6 md:w-8 md:h-8 ${gameState.mainSuit === 'heart' || gameState.mainSuit === 'diamond'
                        ? 'text-red-500'
                        : 'text-white'
                      }`}
                  >
                    <SuitIcon suit={gameState.mainSuit as any} />
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[8px] md:text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-0.5">Trump</span>
                  <span className="text-xs md:text-sm font-bold text-white font-display">
                    {RANK_NAMES[gameState.mainRank]}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-[10px] md:text-xs font-serif italic px-2">无主牌</div>
            )}
          </div>
        </motion.div>

        {/* 游戏模式指示器 - 放在等级信息下方 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-2 md:mt-3"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSettings}
            className={`
              px-3 py-1 md:px-4 md:py-1.5 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-2 w-fit cursor-pointer
              ${gameMode === GameMode.TEACHING
                ? 'bg-blue-500/20 border-blue-400/30 text-blue-100 hover:bg-blue-500/30'
                : 'bg-purple-500/20 border-purple-400/30 text-purple-100 hover:bg-purple-500/30'
              }
            `}
          >
            <span className="text-base md:text-lg">{gameMode === GameMode.TEACHING ? '🎓' : '🏆'}</span>
            <span className="font-display font-bold text-xs md:text-sm tracking-wide">
              {gameMode === GameMode.TEACHING ? '教学模式' : '竞技模式'}
            </span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 右上角：比分 + 功能按钮 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex items-center gap-2 md:gap-3 origin-top-right scale-90 md:scale-100"
      >
        {/* 比分板 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-panel px-3 py-2 md:px-5 md:py-3 flex items-center gap-3 md:gap-4 rounded-2xl"
        >
          <div className="flex flex-col items-center">
            <div className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{gameState.teamNames[0]}</div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#1A237E] rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none group-hover:opacity-120 transition-opacity" />
              <span className="text-white text-base md:text-lg font-bold font-display relative z-10">{gameState.teamScores[0]}</span>
            </div>
          </div>

          <div className="text-gold-metallic text-lg md:text-xl font-serif italic font-bold px-0.5 md:px-1 pt-3 md:pt-4">vs</div>

          <div className="flex flex-col items-center">
            <div className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{gameState.teamNames[1]}</div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#B71C1C] rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none group-hover:opacity-120 transition-opacity" />
              <span className="text-white text-base md:text-lg font-bold font-display relative z-10">{gameState.teamScores[1]}</span>
            </div>
          </div>
        </motion.div>

        {/* 按钮组 */}
        <div className="flex items-center justify-center gap-2">
          {/* Teaching Mode Features */}
          {gameMode === GameMode.TEACHING && onOpenPlayHistory && onOpenAllHands && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenPlayHistory}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/20"
                title="出牌历史"
              >
                <span className="text-lg md:text-xl">📜</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAllHands}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/20"
                title="查看各家手牌"
              >
                <span className="text-lg md:text-xl">👁️</span>
              </motion.button>
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTutorial}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/20"
            title="Rules"
          >
            <span className="text-lg md:text-xl font-serif font-bold text-gold-metallic">?</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSettings}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/20"
            title="Settings"
          >
            <span className="text-lg md:text-xl">⚙️</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}