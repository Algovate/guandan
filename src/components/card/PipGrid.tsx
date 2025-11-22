import React from 'react';
import { SuitIcon } from './CardAssets';
import { Suit } from '../../game/types';

interface PipGridProps {
  rank: number;
  suit: Suit;
  color: string;
}

// 定义每个点数的位置 (百分比)
// x: 0-100 (left to right), y: 0-100 (top to bottom)
// 修正：使用 0-100% 更容易调整
const PIP_POSITIONS: Record<number, { x: number, y: number, inverted?: boolean }[]> = {
  1: [{ x: 50, y: 50 }], // Ace usually handled separately, but fallback here
  2: [
    { x: 50, y: 20 }, 
    { x: 50, y: 80, inverted: true }
  ],
  3: [
    { x: 50, y: 20 },
    { x: 50, y: 50 },
    { x: 50, y: 80, inverted: true }
  ],
  4: [
    { x: 25, y: 20 }, { x: 75, y: 20 },
    { x: 25, y: 80, inverted: true }, { x: 75, y: 80, inverted: true }
  ],
  5: [
    { x: 25, y: 20 }, { x: 75, y: 20 },
    { x: 50, y: 50 },
    { x: 25, y: 80, inverted: true }, { x: 75, y: 80, inverted: true }
  ],
  6: [
    { x: 25, y: 20 }, { x: 75, y: 20 },
    { x: 25, y: 50 }, { x: 75, y: 50 },
    { x: 25, y: 80, inverted: true }, { x: 75, y: 80, inverted: true }
  ],
  7: [
    { x: 25, y: 20 }, { x: 75, y: 20 },
    { x: 50, y: 35 }, // Extra pip
    { x: 25, y: 50 }, { x: 75, y: 50 },
    { x: 25, y: 80, inverted: true }, { x: 75, y: 80, inverted: true }
  ],
  8: [
    { x: 25, y: 20 }, { x: 75, y: 20 },
    { x: 25, y: 40 }, { x: 75, y: 40 }, // Mid upper
    { x: 25, y: 60, inverted: true }, { x: 75, y: 60, inverted: true }, // Mid lower
    { x: 25, y: 80, inverted: true }, { x: 75, y: 80, inverted: true }
  ],
  9: [
    { x: 25, y: 20 }, { x: 75, y: 20 },
    { x: 25, y: 40 }, { x: 75, y: 40 },
    { x: 50, y: 50 }, // Center
    { x: 25, y: 60, inverted: true }, { x: 75, y: 60, inverted: true },
    { x: 25, y: 80, inverted: true }, { x: 75, y: 80, inverted: true }
  ],
  10: [
    { x: 25, y: 20 }, { x: 75, y: 20 },
    { x: 50, y: 30 }, // Top center
    { x: 25, y: 40 }, { x: 75, y: 40 },
    { x: 25, y: 60, inverted: true }, { x: 75, y: 60, inverted: true },
    { x: 50, y: 70, inverted: true }, // Bottom center
    { x: 25, y: 80, inverted: true }, { x: 75, y: 80, inverted: true }
  ],
};

const PipGrid: React.FC<PipGridProps> = ({ rank, suit, color }) => {
  const positions = PIP_POSITIONS[rank];

  if (!positions) return null;

  // 转换 Suit enum 为字符串 key
  const suitKey = suit.toLowerCase() as 'spade' | 'heart' | 'club' | 'diamond';

  return (
    <div className="relative w-full h-full">
      {positions.map((pos, index) => (
        <div
          key={index}
          className="absolute w-[18%] h-[18%] flex items-center justify-center"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) ${pos.inverted ? 'rotate(180deg)' : ''}`,
            color: color
          }}
        >
          <SuitIcon suit={suitKey} className="w-full h-full" />
        </div>
      ))}
    </div>
  );
};

export default PipGrid;
