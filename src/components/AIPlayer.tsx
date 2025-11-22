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
  [PlayerPosition.TOP]: 'top-2 md:top-8 left-1/2 -translate-x-1/2',
  [PlayerPosition.LEFT]: 'left-2 md:left-10 top-[40%] md:top-1/2 -translate-y-1/2',
  [PlayerPosition.RIGHT]: 'right-2 md:right-10 top-[40%] md:top-1/2 -translate-y-1/2',
  [PlayerPosition.BOTTOM]: 'bottom-32 md:bottom-44 left-1/2 -translate-x-1/2',
};

const positionStyles = {
  [PlayerPosition.TOP]: { flexDirection: 'row' as const, alignItems: 'center' as const },
  [PlayerPosition.LEFT]: { flexDirection: 'column' as const, alignItems: 'center' as const },
  [PlayerPosition.RIGHT]: { flexDirection: 'column' as const, alignItems: 'center' as const },
  [PlayerPosition.BOTTOM]: { flexDirection: 'row' as const, alignItems: 'center' as const },
};

// SVG Icons
const RobotIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
  </svg>
);

export default function AIPlayer({ player, position, isCurrentPlayer, isThinking = false }: AIPlayerProps) {
  const cardCount = player.hand.length;
  const teamColor = player.team === 0 ? 'from-blue-500 to-blue-700' : 'from-red-500 to-red-700';

  return (
    <motion.div
      className={`absolute ${positionClasses[position]} flex items-center gap-2 md:gap-3 z-30`}
      style={positionStyles[position]}
      animate={isCurrentPlayer ? {
        scale: 1.05,
      } : {
        scale: 1
      }}
      transition={{ duration: 0.2, type: "spring", stiffness: 250, damping: 20 }}
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
          panel-classic px-2 py-1 md:px-4 md:py-2
          transition-all duration-300
          min-w-[80px] md:min-w-[120px] flex flex-col items-center
          bg-opacity-95 backdrop-blur-sm
          border-2
        `}
      >
        {/* 玩家头像区域 - 移除圆形限制，允许更大展示 */}
        <div className="relative mb-1 md:mb-2 group">
          {/* 背景光晕 */}
          <div className={`absolute inset-0 bg-gradient-to-br ${teamColor} opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-500`}></div>

          {/* 头像容器 */}
          <div className={`relative w-16 h-16 md:w-28 md:h-28 flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:-translate-y-2`}>
            {player.avatarImage ? (
              <img
                src={player.avatarImage}
                alt={player.name}
                className="w-full h-full object-cover rounded-xl shadow-lg border-2 border-white/30"
              />
            ) : player.avatar ? (
              <span className="text-4xl md:text-7xl filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)] transform transition-transform group-hover:rotate-6" role="img" aria-label="avatar">
                {player.avatar}
              </span>
            ) : (
              <div className={`w-12 h-12 md:w-20 md:h-20 rounded-xl bg-gradient-to-br ${teamColor} flex items-center justify-center shadow-lg border-2 border-white/30`}>
                {player.isAI ? <RobotIcon /> : <UserIcon />}
              </div>
            )}
          </div>

          {/* 队伍标识 - 左下角悬浮 */}
          <div className={`absolute bottom-0 left-0 w-5 h-5 md:w-8 md:h-8 rounded-lg border md:border-2 border-white/50 shadow-lg flex items-center justify-center text-[10px] md:text-sm font-bold bg-gradient-to-br ${teamColor} text-white z-10 transform -rotate-6`}>
            {player.team + 1}
          </div>

          {/* 牌数 Badge - 右上角悬浮 */}
          <div className="absolute top-0 right-0 w-6 h-6 md:w-9 md:h-9 z-20 transform translate-x-1 -translate-y-1 md:translate-x-2 md:-translate-y-2">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-[#3E2723] rounded-lg border md:border-2 border-[#D4AF37] shadow-md transform rotate-12"></div>
              <span className="relative text-white font-bold font-serif text-[10px] md:text-sm z-10">{cardCount}</span>
            </div>
          </div>
        </div>

        {/* 玩家名字 - 增强对比度 */}
        <div className="relative z-10 px-2 py-0.5 md:px-3 md:py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg transform hover:scale-105 transition-transform">
          <span className="font-serif font-bold text-white text-xs md:text-lg tracking-wide text-shadow-sm whitespace-nowrap">
            {player.name}
          </span>
        </div>

        {/* 思考状态 */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg border border-casino-gold/50 whitespace-nowrap z-20"
          >
            <div className="flex items-center gap-1 md:gap-2 text-casino-gold text-xs md:text-sm font-serif font-bold">
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
            className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-casino-gold text-white text-[10px] md:text-xs font-serif font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg border border-white/30 whitespace-nowrap z-20"
          >
            当前出牌
          </motion.div>
        )}
      </motion.div>

      {/* 手牌预览（背面）已移除，使用 Badge 显示数量 */}
    </motion.div>
  );
}