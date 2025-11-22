import React from 'react';

// Standard SVG paths for Card Suits
// ViewBox: 0 0 100 120

export const SuitPaths = {
  // Spade: Top pointed leaf + triangular base
  spade: `M50 5 C 50 5 10 45 10 65 C 10 85 25 95 40 95 C 48 95 50 85 50 85 C 50 85 52 95 60 95 C 75 95 90 85 90 65 C 90 45 50 5 50 5 Z 
          M 50 85 L 25 110 L 75 110 L 50 85 Z`,

  // Heart: Standard
  heart: `M50 105 C 50 105 5 60 5 32 C 5 12 20 0 38 0 C 48 0 50 10 50 10 C 50 10 52 0 62 0 C 80 0 95 12 95 32 C 95 60 50 105 50 105 Z`,

  // Club: Three circles + triangular stem
  club: `M50 30 m -20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0 
         M25 65 m -20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0 
         M75 65 m -20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0 
         M50 60 L 25 110 L 75 110 L 50 60 Z`,

  // Diamond: Sharp geometric
  diamond: `M50 5 L 90 60 L 50 115 L 10 60 Z`
};

interface SuitIconProps {
  suit: 'spade' | 'heart' | 'club' | 'diamond';
  className?: string;
  style?: React.CSSProperties;
}

export const SuitIcon: React.FC<SuitIconProps> = ({ suit, className = "", style }) => {
  let path = "";
  // Standard ViewBox covering stems and bases
  // Min-x: 0, Min-y: 0, Width: 100, Height: 120
  let viewBox = "0 0 100 120";

  switch (suit) {
    case 'spade':
      path = SuitPaths.spade;
      break;
    case 'heart':
      path = SuitPaths.heart;
      break;
    case 'club':
      path = SuitPaths.club;
      break;
    case 'diamond':
      path = SuitPaths.diamond;
      break;
  }

  return (
    <svg
      viewBox={viewBox}
      className={`fill-current ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={path} />
    </svg>
  );
};

// Geometric Court Cards - Minimalist & Modern

export const KingGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    {/* Frame */}
    <rect x="10" y="10" width="80" height="120" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
    <rect x="15" y="15" width="70" height="110" rx="2" fill="none" stroke="#D4AF37" strokeWidth="1" />

    {/* Crown */}
    <path d="M30,45 L30,30 L40,40 L50,25 L60,40 L70,30 L70,45 Z" fill="#D4AF37" stroke={color} strokeWidth="1" />
    <circle cx="50" cy="22" r="2.5" fill={color} />

    {/* Robe / Body */}
    <path d="M30,45 L70,45 L70,100 L30,100 Z" fill={color} fillOpacity="0.1" />
    <path d="M50,45 L50,100" stroke={color} strokeWidth="1" strokeDasharray="4 2" />

    {/* Sword */}
    <path d="M50,60 L85,25" stroke={color} strokeWidth="2" />
    <path d="M45,65 L55,55" stroke={color} strokeWidth="2" />

    {/* Indices */}
    <text x="20" y="120" fontSize="24" fill={color} fontFamily="serif" fontWeight="bold">K</text>
    <text x="80" y="30" fontSize="24" fill={color} fontFamily="serif" fontWeight="bold" transform="rotate(180 80 30)">K</text>
  </svg>
);

export const QueenGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    {/* Frame */}
    <rect x="10" y="10" width="80" height="120" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
    <rect x="15" y="15" width="70" height="110" rx="2" fill="none" stroke="#D4AF37" strokeWidth="1" />

    {/* Crown */}
    <path d="M35,40 Q50,25 65,40 L65,50 L35,50 Z" fill="#D4AF37" stroke={color} strokeWidth="1" />
    <circle cx="50" cy="35" r="2" fill={color} />

    {/* Robe / Body */}
    <path d="M35,50 L65,50 L75,100 L25,100 Z" fill={color} fillOpacity="0.1" />
    <path d="M50,50 L50,100" stroke={color} strokeWidth="0.5" />

    {/* Flower */}
    <circle cx="65" cy="70" r="5" fill="none" stroke={color} strokeWidth="1" />
    <path d="M65,75 L65,90" stroke={color} strokeWidth="1" />

    {/* Indices */}
    <text x="20" y="120" fontSize="24" fill={color} fontFamily="serif" fontWeight="bold">Q</text>
    <text x="80" y="30" fontSize="24" fill={color} fontFamily="serif" fontWeight="bold" transform="rotate(180 80 30)">Q</text>
  </svg>
);

export const JackGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    {/* Frame */}
    <rect x="10" y="10" width="80" height="120" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
    <rect x="15" y="15" width="70" height="110" rx="2" fill="none" stroke="#D4AF37" strokeWidth="1" />

    {/* Hat */}
    <path d="M30,35 L70,35 L60,20 L40,20 Z" fill="#D4AF37" stroke={color} strokeWidth="1" />
    <path d="M30,35 L25,45" stroke={color} strokeWidth="1" />

    {/* Body */}
    <rect x="35" y="35" width="30" height="60" fill={color} fillOpacity="0.1" />
    <path d="M35,35 L65,95" stroke={color} strokeWidth="0.5" />
    <path d="M65,35 L35,95" stroke={color} strokeWidth="0.5" />

    {/* Halberd */}
    <line x1="25" y1="110" x2="75" y2="50" stroke={color} strokeWidth="2" />
    <path d="M75,50 L80,45 L70,55 Z" fill={color} />

    {/* Indices */}
    <text x="20" y="120" fontSize="24" fill={color} fontFamily="serif" fontWeight="bold">J</text>
    <text x="80" y="30" fontSize="24" fill={color} fontFamily="serif" fontWeight="bold" transform="rotate(180 80 30)">J</text>
  </svg>
);

export const JokerGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full">
    {/* Jester Hat */}
    <path d="M50,25 L65,45 L80,40 L70,55 L75,70 L50,60 L25,70 L30,55 L20,40 L35,45 Z" fill={color} />
    <circle cx="20" cy="40" r="3" fill="#D4AF37" />
    <circle cx="80" cy="40" r="3" fill="#D4AF37" />
    <circle cx="50" cy="25" r="3" fill="#D4AF37" />

    {/* Face Mask */}
    <path d="M35,60 Q50,80 65,60" fill="none" stroke={color} strokeWidth="2" />
    <circle cx="40" cy="55" r="2" fill={color} />
    <circle cx="60" cy="55" r="2" fill={color} />

    {/* Collar */}
    <path d="M35,85 L50,100 L65,85" fill="none" stroke="#D4AF37" strokeWidth="2" />

    <text x="50" y="125" fontSize="16" textAnchor="middle" fill={color} fontFamily="serif" letterSpacing="3" fontWeight="bold">JOKER</text>
  </svg>
);