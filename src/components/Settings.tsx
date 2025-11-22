import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { AIDifficulty, GameMode } from '../game/types';

export default function Settings() {
  const { showSettings, toggleSettings, aiDifficulty, setAIDifficulty, gameMode, setGameMode, showToast, showDebug, toggleDebug } = useGameStore();

  const difficultyOptions = [
    {
      value: AIDifficulty.EASY,
      label: '简单',
      desc: 'AI随机出牌，适合新手',
      icon: '😊',
      color: 'from-green-500 to-green-600'
    },
    {
      value: AIDifficulty.MEDIUM,
      label: '中等',
      desc: 'AI使用基础策略',
      icon: '🤔',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      value: AIDifficulty.HARD,
      label: '困难',
      desc: 'AI深度分析，极具挑战',
      icon: '🧠',
      color: 'from-red-500 to-red-700'
    },
  ];

  const handleDifficultyChange = (difficulty: AIDifficulty) => {
    setAIDifficulty(difficulty);
    const option = difficultyOptions.find(opt => opt.value === difficulty);
    showToast(`AI难度已设置为：${option?.label}`, 'success');
  };

  const modeOptions = [
    {
      value: GameMode.COMPETITIVE,
      label: '竞技模式',
      desc: '标准规则，无提示，严谨对战',
      icon: '🏆',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      value: GameMode.TEACHING,
      label: '教学模式',
      desc: '智能提示，AI思考展示，轻松上手',
      icon: '🎓',
      color: 'from-blue-400 to-cyan-500'
    }
  ];

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
  };

  return (
    <AnimatePresence>
      {showSettings && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSettings}
          />
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4 p-4"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="glass-panel rounded-3xl shadow-2xl border-2 border-accent-gold/40 p-8 relative overflow-hidden"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
              }}
            >
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-ui-primary/8 via-transparent to-accent-gold/8 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

              <div className="relative z-10">
                {/* 标题 */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">⚙️</div>
                    <h2 className="text-3xl font-display font-bold text-gold-metallic drop-shadow-md">游戏设置</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleSettings}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl font-bold transition-colors border border-white/10"
                  >
                    ×
                  </motion.button>
                </div>

                {/* 游戏模式设置 */}
                <div className="space-y-4 mb-8">
                  <div className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 ml-1">
                    游戏模式
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {modeOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleModeChange(option.value)}
                        className={`
                          p-4 rounded-2xl border-2 transition-all duration-300
                          flex flex-col items-center text-center gap-2
                          ${gameMode === option.value
                            ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-lg`
                            : 'bg-white/50 text-gray-700 border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="text-3xl mb-1">{option.icon}</div>
                        <div className="font-display font-bold text-lg leading-tight">
                          {option.label}
                        </div>
                        <div className={`text-xs ${gameMode === option.value ? 'text-white/90' : 'text-gray-500'}`}>
                          {option.desc}
                        </div>
                        {gameMode === option.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 text-lg"
                          >
                            ✓
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* AI难度设置 */}
                <div className="space-y-4 mb-8">
                  <div className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 ml-1">
                    AI难度
                  </div>
                  <div className="space-y-3">
                    {difficultyOptions.map((option, index) => (
                      <motion.button
                        key={option.value}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDifficultyChange(option.value)}
                        className={`
                          w-full p-4 rounded-2xl border-2 transition-all duration-300
                          flex items-center gap-4 text-left
                          ${aiDifficulty === option.value
                            ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-lg`
                            : 'bg-white/50 text-gray-700 border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="text-3xl flex-shrink-0">{option.icon}</div>
                        <div className="flex-1">
                          <div className={`font-display font-bold text-lg ${aiDifficulty === option.value ? 'text-white' : 'text-gray-800'}`}>
                            {option.label}
                          </div>
                          <div className={`text-sm ${aiDifficulty === option.value ? 'text-white/90' : 'text-gray-600'}`}>
                            {option.desc}
                          </div>
                        </div>
                        {aiDifficulty === option.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-2xl"
                          >
                            ✓
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 调试模式设置 */}
                <div className="flex items-center justify-between bg-black/30 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🔍</div>
                    <div>
                      <div className="font-display font-bold text-lg text-gray-200">调试模式</div>
                      <div className="text-xs text-gray-400">显示游戏内部状态和日志</div>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleDebug}
                    className={`
                      w-14 h-8 rounded-full p-1 transition-colors duration-300
                      ${showDebug ? 'bg-green-500' : 'bg-gray-300'}
                    `}
                  >
                    <motion.div
                      className="w-6 h-6 bg-white rounded-full shadow-md"
                      animate={{ x: showDebug ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                {/* 确定按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleSettings}
                  className="btn-primary w-full mt-8 text-lg py-4"
                >
                  确定
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}