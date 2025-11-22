import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GameMode } from '../game/types';

type SettingsTab = 'game' | 'audio' | 'advanced';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('game');
  
  const {
    showSettings,
    toggleSettings,
    gameMode,
    setGameMode,
    showToast,
    showDebug,
    toggleDebug,
    soundEnabled,
    soundVolume,
    setSoundEnabled,
    setSoundVolume
  } = useGameStore();

  const modeOptions = [
    {
      value: GameMode.COMPETITIVE,
      label: '竞技模式',
      desc: '标准规则，无提示',
      icon: '🏆',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      value: GameMode.TEACHING,
      label: '教学模式',
      desc: '智能提示，AI思考展示',
      icon: '🎓',
      color: 'from-blue-400 to-cyan-500',
    }
  ];

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    const option = modeOptions.find(opt => opt.value === mode);
    showToast(`已切换至${option?.label}`, 'success');
  };

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    showToast(`音效已${newValue ? '开启' : '关闭'}`, 'info');
  };

  const handleVolumeChange = (volume: number) => {
    setSoundVolume(volume);
  };

  const handleDebugToggle = () => {
    const newValue = !showDebug;
    toggleDebug();
    showToast(`调试模式已${newValue ? '开启' : '关闭'}`, 'info');
  };

  const tabs = [
    { id: 'game' as SettingsTab, label: '游戏', icon: '🎮' },
    { id: 'audio' as SettingsTab, label: '音频', icon: '🔊' },
    { id: 'advanced' as SettingsTab, label: '高级', icon: '⚙️' },
  ];

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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl mx-4"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="glass-panel rounded-xl shadow-2xl border border-accent-gold/30 relative overflow-hidden"
              style={{
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              {/* 背景装饰 - 简化 */}
              <div className="absolute inset-0 bg-gradient-to-br from-ui-primary/5 via-transparent to-accent-gold/5 pointer-events-none" />

              <div className="relative z-10">
                {/* 标题栏 */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">⚙️</div>
                    <h2 className="text-lg font-display font-bold text-gold-metallic">游戏设置</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleSettings}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg font-bold transition-colors"
                  >
                    ×
                  </motion.button>
                </div>

                {/* 标签导航 - 紧凑 */}
                <div className="flex border-b border-white/5">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 px-3 py-2.5 relative text-sm font-medium transition-colors
                        ${activeTab === tab.id 
                          ? 'text-gold-metallic' 
                          : 'text-gray-400 hover:text-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-base">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </div>
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"
                          initial={false}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* 内容区域 */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {/* 游戏设置标签页 */}
                    {activeTab === 'game' && (
                      <motion.div
                        key="game"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                      >
                        {/* 游戏模式设置 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="text-lg">🎮</div>
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">游戏模式</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {modeOptions.map((option) => (
                              <motion.button
                                key={option.value}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleModeChange(option.value)}
                                className={`
                                  relative p-3 rounded-lg border transition-all duration-200
                                  flex flex-col items-center text-center gap-1.5 overflow-hidden
                                  ${gameMode === option.value
                                    ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-lg`
                                    : 'bg-white/5 text-gray-200 border-white/10 hover:border-white/20 hover:bg-white/10'
                                  }
                                `}
                              >
                                <div className="text-2xl">{option.icon}</div>
                                <div className={`font-semibold text-sm ${gameMode === option.value ? 'text-white' : 'text-gray-100'}`}>
                                  {option.label}
                                </div>
                                <div className={`text-xs ${gameMode === option.value ? 'text-white/90' : 'text-gray-400'}`}>
                                  {option.desc}
                                </div>
                                {gameMode === option.value && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center text-white text-xs"
                                  >
                                    ✓
                                  </motion.div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* AI风格说明 */}
                        <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                          <div className="flex items-start gap-2.5">
                            <div className="text-xl">🤖</div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-100 mb-1">AI对手风格</div>
                              <div className="text-xs text-gray-400 leading-relaxed">
                                每局游戏AI对手会随机分配不同的性格风格：激进型、保守型、配合型、均衡型，让每局游戏都充满变数和挑战！
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 音频设置标签页 */}
                    {activeTab === 'audio' && (
                      <motion.div
                        key="audio"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="text-lg">🔊</div>
                          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">音频设置</h3>
                        </div>

                        {/* 音效开关 */}
                        <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <motion.div
                                animate={soundEnabled ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.3 }}
                                className="text-2xl"
                              >
                                {soundEnabled ? '🔊' : '🔇'}
                              </motion.div>
                              <div>
                                <div className="font-semibold text-sm text-gray-100">音效</div>
                                <div className="text-xs text-gray-400">游戏音效开关</div>
                              </div>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={handleSoundToggle}
                              className={`
                                relative w-12 h-6 rounded-full p-0.5 transition-colors duration-300 cursor-pointer
                                ${soundEnabled ? 'bg-green-500' : 'bg-gray-600'}
                              `}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow-md"
                                animate={{ x: soundEnabled ? 24 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </motion.button>
                          </div>

                          {/* 音量控制 */}
                          {soundEnabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-3 border-t border-white/10"
                            >
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-300 min-w-[40px] font-medium">音量</div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={soundVolume * 100}
                                  onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
                                  className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-compact"
                                  style={{
                                    background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${soundVolume * 100}%, #4a5568 ${soundVolume * 100}%, #4a5568 100%)`
                                  }}
                                />
                                <div className="text-xs text-gray-300 min-w-[35px] text-right font-medium">
                                  {Math.round(soundVolume * 100)}%
                                </div>
                              </div>
                              <style>{`
                                .slider-compact::-webkit-slider-thumb {
                                  appearance: none;
                                  width: 16px;
                                  height: 16px;
                                  border-radius: 50%;
                                  background: #d4af37;
                                  cursor: pointer;
                                  box-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 0 6px rgba(212,175,55,0.4);
                                }
                                .slider-compact::-moz-range-thumb {
                                  width: 16px;
                                  height: 16px;
                                  border-radius: 50%;
                                  background: #d4af37;
                                  cursor: pointer;
                                  border: none;
                                  box-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 0 6px rgba(212,175,55,0.4);
                                }
                              `}</style>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* 高级设置标签页 */}
                    {activeTab === 'advanced' && (
                      <motion.div
                        key="advanced"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="text-lg">⚙️</div>
                          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">高级设置</h3>
                        </div>

                        {/* 调试模式 */}
                        <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <motion.div
                                animate={showDebug ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.3 }}
                                className="text-2xl"
                              >
                                🔍
                              </motion.div>
                              <div>
                                <div className="font-semibold text-sm text-gray-100">调试模式</div>
                                <div className="text-xs text-gray-400">显示游戏内部状态和日志</div>
                              </div>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={handleDebugToggle}
                              className={`
                                relative w-12 h-6 rounded-full p-0.5 transition-colors duration-300 cursor-pointer
                                ${showDebug ? 'bg-green-500' : 'bg-gray-600'}
                              `}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow-md"
                                animate={{ x: showDebug ? 24 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
