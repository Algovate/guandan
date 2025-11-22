import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { AIDifficulty } from '../game/types';

export default function Settings() {
  const { showSettings, toggleSettings, aiDifficulty, setAIDifficulty, showToast } = useGameStore();
  
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
            <div className="glass rounded-3xl shadow-2xl border-2 border-accent-gold/40 p-8 relative overflow-hidden"
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
                    <h2 className="text-3xl font-display font-bold text-gray-800">游戏设置</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleSettings}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold transition-colors"
                  >
                    ×
                  </motion.button>
                </div>
                
                {/* AI难度设置 */}
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
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