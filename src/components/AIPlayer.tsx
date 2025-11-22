import { motion } from 'framer-motion';
import type { Player } from '../game/types';
import { PlayerPosition } from '../game/types';
import Card from './Card';

interface AIPlayerProps {
  player: Player;
  position: PlayerPosition;
  isCurrentPlayer: boolean;
  isThinking?: boolean;
}

const positionClasses = {
  [PlayerPosition.TOP]: 'top-4 md:top-8 left-1/2 -translate-x-1/2',
  [PlayerPosition.LEFT]: 'left-4 md:left-8 top-1/2 -translate-y-1/2',
  [PlayerPosition.RIGHT]: 'right-4 md:right-8 top-1/2 -translate-y-1/2',
  [PlayerPosition.BOTTOM]: 'bottom-40 md:bottom-44 left-1/2 -translate-x-1/2',
};

const positionStyles = {
  [PlayerPosition.TOP]: { flexDirection: 'row' as const, alignItems: 'center' as const },
  [PlayerPosition.LEFT]: { flexDirection: 'column' as const, alignItems: 'center' as const },
  [PlayerPosition.RIGHT]: { flexDirection: 'column' as const, alignItems: 'center' as const },
  [PlayerPosition.BOTTOM]: { flexDirection: 'row' as const, alignItems: 'center' as const },
};

export default function AIPlayer({ player, position, isCurrentPlayer, isThinking = false }: AIPlayerProps) {
  const cardCount = player.hand.length;
  const isVertical = position === PlayerPosition.LEFT || position === PlayerPosition.RIGHT;
  const teamColor = player.team === 0 ? 'from-ui-primary to-blue-600' : 'from-ui-error to-red-600';
  
  return (
    <motion.div
      className={`absolute ${positionClasses[position]} flex items-center gap-3 z-10`}
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
        className={`
          panel-classic px-5 py-3
          ${isCurrentPlayer ? 'ring-2 ring-casino-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]' : ''}
          transition-all duration-300
          min-w-[140px] flex flex-col items-center
        `}
      >
        {/* 玩家头像区域 */}
        <div className="relative mb-2">
          <div className={`w-12 h-12 rounded-full border-2 border-casino-gold shadow-md flex items-center justify-center bg-gradient-to-br ${teamColor}`}>
            <span className="text-white font-serif font-bold text-xl">
              {player.name.charAt(0)}
            </span>
          </div>
          {/* 队伍标识 */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-white shadow-sm flex items-center justify-center text-[10px] font-bold bg-white text-gray-800`}>
            {player.team + 1}
          </div>
        </div>

        {/* 玩家名称 */}
        <div className="font-serif font-bold text-casino-wood text-lg mb-1">
          {player.name}
        </div>
        
        {/* 牌数显示 */}
        <div className="flex items-center gap-2 bg-black/5 px-3 py-1 rounded-full w-full justify-center">
          <div className="text-lg">🂠</div>
          <div className="text-sm font-bold text-gray-700">
            <span className="font-serif text-lg">{cardCount}</span>
          </div>
        </div>
        
        {/* 思考状态 */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-lg border border-casino-gold/50 whitespace-nowrap"
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
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-casino-gold text-white text-xs font-serif font-bold px-3 py-1 rounded-full shadow-lg border border-white/30 whitespace-nowrap"
          >
            轮到你了
          </motion.div>
        )}
      </motion.div>
      
      {/* 手牌预览（背面） */}
      <div className={`flex gap-1.5 ${isVertical ? 'flex-col' : 'flex-row'}`}>
        {Array.from({ length: Math.min(cardCount, 6) }).map((_, i) => {
          const dummyCard = { 
            suit: 'spade' as const, 
            rank: 'A' as const, 
            id: `dummy-${player.id}-${i}` 
          };
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: isVertical ? -10 : 0, x: isVertical ? 0 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              transition={{ delay: i * 0.1, type: "spring" }}
            >
              <Card
                card={dummyCard}
                size="sm"
                faceUp={false}
              />
            </motion.div>
          );
        })}
        {cardCount > 6 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center text-white font-serif font-bold text-sm bg-black/30 rounded-lg px-2 py-1 backdrop-blur-sm border border-white/20"
          >
            +{cardCount - 6}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}