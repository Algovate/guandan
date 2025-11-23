import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function Tutorial() {
  const { showTutorial, toggleTutorial } = useGameStore();

  const rules = [
    {
      title: '游戏简介',
      icon: '🎮',
      content: '掼蛋是一种流行于江苏及周边地区的扑克牌游戏，采用两副牌（108张），由四位玩家进行，2v2团队对战。',
    },
    {
      title: '牌型',
      icon: '🃏',
      content: [
        '单张：任意一张牌',
        '对子：两张相同点数的牌',
        '三张：三张相同点数的牌',
        '三带二：三张相同点数 + 一对',
        '三连对：三对连续对牌（不可超过3对）',
        '钢板：二个连续三张牌（不可超过2个）',
        '顺子：恰好5张连续点数的牌（不可超过五张）',
        '同花顺：相同花色的顺子',
        '炸弹：四张、五张、六张及以上相同点数的牌',
        '四王：两张大王 + 两张小王（最大）',
      ],
    },
    {
      title: '游戏规则',
      icon: '📋',
      content: [
        '游戏从2开始，依次升级到A（2不必打，A必打）',
        '先过A的队伍获胜',
        '牌型大小：四王 > 六张及以上炸弹 > 同花顺 > 五张炸弹 > 四张炸弹 > 其它牌型',
        '主牌等级和花色在叫主阶段确定',
        '主牌大于副牌，红桃主牌为"逢人配"（可任意组合）',
        '队友可以不出牌，让队友继续出',
        '必须出能压过上家的牌，否则选择不出',
      ],
    },
    {
      title: '操作说明',
      icon: '🎯',
      content: [
        '点击手牌进行选择，可以多选',
        '点击"出牌"按钮出牌"',
        '点击"不出"按钮跳过',
        '点击"提示"按钮查看可出牌型',
      ],
    },
  ];

  return (
    <AnimatePresence>
      {showTutorial && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleTutorial}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-panel rounded-3xl shadow-2xl border border-[#d4af37]/30 p-8 relative overflow-hidden"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/8 via-transparent to-ui-primary/8 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  {/* 标题 */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="text-3xl sm:text-4xl md:text-5xl flex-shrink-0">📖</div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-accent-gold to-accent-amber bg-clip-text text-transparent break-words min-w-0">
                        掼蛋游戏规则
                      </h2>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleTutorial}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl font-bold transition-colors flex-shrink-0 border border-white/10"
                    >
                      ×
                    </motion.button>
                  </div>

                  {/* 规则内容 */}
                  <div className="space-y-6">
                    {rules.map((rule, index) => (
                      <motion.div
                        key={rule.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-black/40 rounded-2xl p-6 border border-white/10 hover:border-[#d4af37]/30 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-4xl flex-shrink-0">{rule.icon}</div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-display font-bold text-gold-metallic mb-3">
                              {rule.title}
                            </h3>
                            {Array.isArray(rule.content) ? (
                              <ul className="space-y-2 text-gray-300">
                                {rule.content.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-accent-gold mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-300 leading-relaxed">{rule.content}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* 关闭按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTutorial}
                    className="btn-casino-primary w-full mt-8 text-lg py-4"
                  >
                    我知道了
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}