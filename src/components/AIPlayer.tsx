import { motion } from 'framer-motion';
import type { Player } from '../game/types';
import { PlayerPosition } from '../game/types';

interface AIPlayerProps {
  player: Player;
  position: PlayerPosition;
  isCurrentPlayer: boolean;
  isThinking?: boolean;
}

const positionClasses = {
  [PlayerPosition.TOP]: 'top-4 md:top-8 left-1/2 -translate-x-1/2',
  [PlayerPosition.LEFT]: 'left-6 md:left-10 top-1/2 -translate-y-1/2',
  [PlayerPosition.RIGHT]: 'right-6 md:right-10 top-1/2 -translate-y-1/2',
  [PlayerPosition.BOTTOM]: 'bottom-40 md:bottom-44 left-1/2 -translate-x-1/2',
};

const positionStyles = {
  [PlayerPosition.TOP]: { flexDirection: 'row' as const, alignItems: 'center' as const },
  [PlayerPosition.LEFT]: { flexDirection: 'column' as const, alignItems: 'center' as const },
  [PlayerPosition.RIGHT]: { flexDirection: 'column' as const, alignItems: 'center' as const },
  [PlayerPosition.BOTTOM]: { flexDirection: 'row' as const, alignItems: 'center' as const },
};

// SVG Icons
const RobotIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
  </svg>
);

export default function AIPlayer({ player, position, isCurrentPlayer, isThinking = false }: AIPlayerProps) {
  const cardCount = player.hand.length;
  const teamColor = player.team === 0 ? 'from-blue-500 to-blue-700' : 'from-red-500 to-red-700';

  return (
    <motion.div
      className={`absolute ${positionClasses[position]} flex items-center gap-3 z-30`}
      style={positionStyles[position]}
      animate={isCurrentPlayer ? {
        scale: 1.05,
      } : {
        scale: 1
      }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      {/* 玩家信息卡片 - 经典卡片风格 */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        animate={isCurrentPlayer ? {
          boxShadow: [
            "0 0 0px rgba(212,175,55,0.2)",
            "0 0 20px rgba(212,175,55,0.6)",
            "0 0 0px rgba(212,175,55,0.2)"
          ],
          borderColor: "rgba(212,175,55,1)"
        } : {
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          borderColor: "rgba(212,175,55,0.3)" // default border color
        }}
        transition={{
          boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          borderColor: { duration: 0.3 }
        }}
        className={`
          panel-classic px-4 py-2
          transition-all duration-300
          min-w-[120px] flex flex-col items-center
          bg-opacity-95 backdrop-blur-sm
          border-2
        `}
      >
        {/* 玩家头像区域 */}
        <div className="relative mb-1">
          <div className={`w-12 h-12 rounded-full border-2 border-casino-gold shadow-md flex items-center justify-center bg-gradient-to-br ${teamColor} text-white overflow-hidden`}>
            {player.avatar ? (
              <span className="text-2xl" role="img" aria-label="avatar">{player.avatar}</span>
            ) : (
              player.isAI ? <RobotIcon /> : <UserIcon />
            )}
          </div>

          {/* 队伍标识 - 左下角 */}
          <div className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border border-white shadow-sm flex items-center justify-center text-[10px] font-bold bg-white text-gray-800`}>
            {player.team + 1}
          </div>

          {/* 牌数 Badge - 右上角 (Shield Style) */}
          <div className="absolute -top-2 -right-3 w-7 h-7">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-[#3E2723] rounded-full border-2 border-[#D4AF37] shadow-md transform rotate-45"></div>
              <span className="relative text-white font-bold font-serif text-sm z-10">{cardCount}</span>
            </div>
          </div>
        </div>

        {/* 玩家名称 */}
        <div className="font-serif font-bold text-casino-wood text-base whitespace-nowrap">
          {player.name}
        </div>

        {/* 思考状态 */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-lg border border-casino-gold/50 whitespace-nowrap z-20"
          >
            <div className="flex items-center gap-2 text-casino-gold text-sm font-serif font-bold">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                ⏳
              </motion.span>
              <span>思考中...</span>
            </div>
          </motion.div>
        )}

        {/* 当前玩家指示 */}
        {isCurrentPlayer && !isThinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-casino-gold text-white text-xs font-serif font-bold px-3 py-1 rounded-full shadow-lg border border-white/30 whitespace-nowrap z-20"
          >
            当前出牌
          </motion.div>
        )}
      </motion.div>

      {/* 手牌预览（背面）已移除，使用 Badge 显示数量 */}
    </motion.div>
  );
}