import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Card as CardType } from '../game/types';
import { Suit, Rank } from '../game/types';
import { SuitIcon, KingGraphic, QueenGraphic, JackGraphic, JokerGraphic } from './card/CardAssets';
import PipGrid from './card/PipGrid';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  card: CardType;
  index?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  animate?: any;
  initial?: any;
  whileHover?: any;
  layoutId?: string;
  faceDown?: boolean;
  faceUp?: boolean;
  className?: string;
  size?: CardSize; // Explicit size prop
}

// Size mapping
const SIZE_CLASSES: Record<CardSize, string> = {
  xs: 'w-16 h-24',  // 64x96px
  sm: 'w-20 h-30',  // 80x120px
  md: 'w-24 h-36',  // 96x144px
  lg: 'w-32 h-48',  // 128x192px (Default)
  xl: 'w-40 h-60'   // 160x240px
};

// 获取卡牌颜色
const getCardColor = (suit: Suit, rank: Rank): string => {
  if (rank === Rank.JOKER_BIG) return '#b91c1c'; // darker red
  if (rank === Rank.JOKER_SMALL) return '#1a1a1a'; // darker black
  return (suit === Suit.HEART || suit === Suit.DIAMOND) ? '#b91c1c' : '#1a1a1a';
};

// 获取显示的数字/字母
const getRankDisplay = (rank: Rank): string => {
  switch (rank) {
    case Rank.ACE: return 'A';
    case Rank.JACK: return 'J';
    case Rank.QUEEN: return 'Q';
    case Rank.KING: return 'K';
    case Rank.JOKER_SMALL: return 'JOKER';
    case Rank.JOKER_BIG: return 'JOKER';
    default: return rank.toString();
  }
};

const CornerIndex: React.FC<{
  rank: Rank;
  suit: Suit;
  color: string;
  position: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
  size: CardSize;
}> = ({ rank, suit, color, position, size }) => {
  const isJoker = rank === Rank.JOKER_SMALL || rank === Rank.JOKER_BIG;
  const rankText = getRankDisplay(rank);

  // Scale font size based on card size
  const fontSize = size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : size === 'md' ? 'text-lg' : 'text-2xl';
  const iconSize = size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const padding = size === 'xs' ? 'p-0.5' : 'p-1';

  let positionClass = '';
  switch (position) {
    case 'top-left': positionClass = 'top-1 left-1'; break;
    case 'top-right': positionClass = 'top-1 right-1'; break;
    case 'bottom-right': positionClass = 'bottom-1 right-1 rotate-180'; break;
    case 'bottom-left': positionClass = 'bottom-1 left-1 rotate-180'; break;
  }

  // Joker 特殊处理
  if (isJoker) {
    return (
      <div className={`absolute flex flex-col items-center ${positionClass} ${padding}`}>
        <div
          className={`font-serif font-bold leading-none tracking-widest writing-vertical-rl text-orientation-upright ${fontSize}`}
          style={{ color }}
        >
          JOKER
        </div>
      </div>
    );
  }

  const suitKey = suit?.toLowerCase() as any;

  return (
    <div className={`absolute flex flex-col items-center ${positionClass} p-0.5`}>
      <div className={`font-serif font-bold leading-none ${fontSize}`} style={{ color }}>
        {rankText}
      </div>
      <div className={`${iconSize} mt-0.5`}>
        <SuitIcon suit={suitKey} style={{ color }} />
      </div>
    </div>
  );
};

const CardFace: React.FC<{ card: CardType; color: string; size: CardSize }> = ({ card, color, size }) => {
  const { rank, suit } = card;
  const isJoker = rank === Rank.JOKER_SMALL || rank === Rank.JOKER_BIG;
  const suitKey = suit?.toLowerCase() as any;

  // Scale padding based on size
  const padding = size === 'xs' ? 'p-1' : size === 'sm' ? 'p-2' : size === 'md' ? 'p-4' : 'p-6';

  // 渲染中间内容
  const renderCenterContent = () => {
    if (isJoker) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center ${padding}`}>
          <JokerGraphic color={color} />
        </div>
      );
    }

    switch (rank) {
      case Rank.JACK:
        return <div className={`w-full h-full ${padding}`}><JackGraphic color={color} /></div>;
      case Rank.QUEEN:
        return <div className={`w-full h-full ${padding}`}><QueenGraphic color={color} /></div>;
      case Rank.KING:
        return <div className={`w-full h-full ${padding}`}><KingGraphic color={color} /></div>;
      case Rank.ACE:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1/3 h-1/3">
              <SuitIcon suit={suitKey} style={{ color }} />
            </div>
          </div>
        );
      default:
        const rankNum = parseInt(rank as string, 10);
        // Adjust padding for pip grid
        const pipPadding = size === 'xs' ? 'p-1.5' : size === 'sm' ? 'p-2.5' : size === 'md' ? 'p-4' : 'p-6';
        return <div className={`w-full h-full ${pipPadding}`}><PipGrid rank={rankNum} suit={suit} color={color} /></div>;
    }
  };

  return (
    <div className="card-face w-full h-full select-none backface-hidden">
      {(rank === Rank.JACK || rank === Rank.QUEEN || rank === Rank.KING) && (
        <div className="absolute inset-2 border border-[#D4AF37] opacity-30 rounded-sm pointer-events-none"></div>
      )}

      <CornerIndex rank={rank} suit={suit} color={color} position="top-left" size={size} />
      <CornerIndex rank={rank} suit={suit} color={color} position="bottom-right" size={size} />

      {renderCenterContent()}
    </div>
  );
};

const CardBack: React.FC = () => (
  <div className="card-back w-full h-full overflow-hidden relative backface-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-1/3 h-1/3 border-2 border-white/40 rounded-full flex items-center justify-center backdrop-blur-sm">
        <div className="w-2/3 h-2/3 border border-white/20 rounded-full bg-white/5"></div>
      </div>
    </div>
  </div>
);

export const Card: React.FC<CardProps> = ({
  card,
  isSelected = false,
  isHighlighted = false,
  isPlayable = true,
  onClick,
  style,
  animate,
  initial,
  whileHover,
  layoutId,
  faceDown = false,
  faceUp,
  className = '',
  size = 'lg' // Default to lg (Player Hand size)
}) => {
  const color = useMemo(() => getCardColor(card.suit, card.rank), [card.suit, card.rank]);
  const isFaceDown = faceDown || (faceUp === false);

  // Get dimension classes
  const sizeClass = SIZE_CLASSES[size];

  return (
    <motion.div
      layoutId={layoutId}
      initial={initial}
      animate={animate}

      style={{
        ...style,
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      className={`
        relative rounded-xl cursor-pointer transition-all duration-200
        ${sizeClass}
        ${isSelected ? '' : 'hover:-translate-y-1'}
        ${isHighlighted ? 'ring-2 ring-[#D4AF37] ring-opacity-50' : ''}
        ${!isPlayable && !isFaceDown ? 'brightness-75 grayscale-[0.3] cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileTap={{ scale: 0.95, rotate: 0, zIndex: 100 }}
      whileHover={whileHover || { scale: 1.05, zIndex: 50, transition: { duration: 0.2 } }}
    >
      {isFaceDown ? (
        <CardBack />
      ) : (
        <div className={`w-full h-full ${isSelected ? 'card-face selected' : ''}`}>
          <CardFace card={card} color={color} size={size} />
        </div>
      )}
    </motion.div>
  );
};

export default Card;