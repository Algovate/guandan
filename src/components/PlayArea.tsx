import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Card from './Card';
import { PLAY_TYPE_NAMES } from '../utils/constants';
import { PlayerPosition } from '../game/types';

export default function PlayArea() {
  const { gameState } = useGameStore();

  if (!gameState || !gameState.currentPlay) {
    return null;
  }

  const play = gameState.currentPlay;
  const lastPlayer = gameState.lastPlayPlayerIndex >= 0
    ? gameState.players[gameState.lastPlayPlayerIndex]
    : null;

  if (!lastPlayer) return null;

  const position = lastPlayer.position;

  // 根据玩家位置确定出牌区域的位置
  const getPositionStyle = (pos: PlayerPosition) => {
    switch (pos) {
      case PlayerPosition.BOTTOM:
        return "bottom-[35%] left-1/2 -translate-x-1/2"; // 玩家自己：底部上方
      case PlayerPosition.TOP:
        return "top-[32%] left-1/2 -translate-x-1/2"; // 对家：顶部下方
      case PlayerPosition.LEFT:
        return "top-1/2 left-[25%] -translate-y-1/2"; // 上家：左侧右方
      case PlayerPosition.RIGHT:
        return "top-1/2 right-[25%] -translate-y-1/2"; // 下家：右侧左方
      default:
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
  };

  // 定义入场动画：模拟从玩家方向飞入
  const getInitialVariant = (pos: PlayerPosition) => {
    switch (pos) {
      case PlayerPosition.BOTTOM: return { y: 200, opacity: 0, scale: 0.5, rotateX: 45 };
      case PlayerPosition.TOP: return { y: -200, opacity: 0, scale: 0.5, rotateX: -45 };
      case PlayerPosition.LEFT: return { x: -200, opacity: 0, scale: 0.5, rotateY: -45 };
      case PlayerPosition.RIGHT: return { x: 200, opacity: 0, scale: 0.5, rotateY: 45 };
      default: return { scale: 0.8, opacity: 0 };
    }
  };

  const containerClass = getPositionStyle(position);
  const initialVariant = getInitialVariant(position);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={play.cards.map(c => c.id).join(',')} // 只要牌变了就重新触发动画
        className={`absolute z-20 flex flex-col items-center ${containerClass}`}
        initial={initialVariant}
        animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* 玩家名字和牌型提示 */}
        <div className="mb-4 flex items-center gap-3 glass-panel px-4 py-1.5 rounded-full shadow-xl">
          <span className="text-gold-metallic font-serif font-bold text-base whitespace-nowrap">
            {lastPlayer.name}
          </span>
          <span className="text-white/90 text-xs font-bold px-2 py-0.5 bg-white/10 rounded border border-white/10 tracking-wide">
            {PLAY_TYPE_NAMES[play.type] || play.type}
          </span>
        </div>

        {/* 牌组显示 */}
        <div className="flex items-center justify-center perspective-1000">
          {play.cards.map((card, index) => (
            <motion.div
              key={card.id}
              className="origin-bottom"
              style={{
                marginLeft: index === 0 ? 0 : '-3rem', // 负 margin 实现重叠
                zIndex: index
              }}
              initial={{ scale: 0.8, rotate: 0 }}
              animate={{
                scale: 0.9,
                rotate: (index - (play.cards.length - 1) / 2) * 3, // 扇形展开
                y: Math.abs(index - (play.cards.length - 1) / 2) * 2 // 轻微弧度
              }}
              whileHover={{ scale: 1.1, zIndex: 100, y: -20, transition: { duration: 0.2 } }}
            >
              <Card
                card={card}
                faceUp={true}
                size="md"
                className="shadow-2xl ring-1 ring-black/20"
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}