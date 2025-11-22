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

// ... (Court card graphics remain same, just update imports if needed)
// Copying Court Graphics to ensure file integrity

export const KingGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    <rect x="5" y="5" width="90" height="130" fill="none" stroke={color} strokeWidth="2" />
    <rect x="10" y="10" width="80" height="120" fill="none" stroke="#D4AF37" strokeWidth="1" />
    <path d="M30,40 L30,25 L40,35 L50,20 L60,35 L70,25 L70,40 Z" fill="#D4AF37" stroke={color} strokeWidth="1" />
    <circle cx="50" cy="18" r="3" fill={color} />
    <rect x="30" y="40" width="40" height="50" fill="none" stroke={color} strokeWidth="1" />
    <path d="M35,55 Q50,65 65,55" stroke={color} fill="none" strokeWidth="2" /> 
    <circle cx="40" cy="50" r="2" fill={color} />
    <circle cx="60" cy="50" r="2" fill={color} />
    <path d="M50,90 L50,120 M40,100 L60,100" stroke={color} strokeWidth="3" />
    <text x="15" y="125" fontSize="20" fill={color} fontFamily="serif" fontWeight="bold">K</text>
    <text x="85" y="25" fontSize="20" fill={color} fontFamily="serif" fontWeight="bold" transform="rotate(180 85 25)">K</text>
  </svg>
);

export const QueenGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    <rect x="5" y="5" width="90" height="130" fill="none" stroke={color} strokeWidth="2" />
    <rect x="10" y="10" width="80" height="120" fill="none" stroke="#D4AF37" strokeWidth="1" />
    <path d="M35,35 Q50,20 65,35 L65,45 L35,45 Z" fill="#D4AF37" stroke={color} strokeWidth="1" />
    <ellipse cx="50" cy="65" rx="20" ry="25" fill="none" stroke={color} strokeWidth="1" />
    <circle cx="42" cy="60" r="2" fill={color} />
    <circle cx="58" cy="60" r="2" fill={color} />
    <path d="M45,75 Q50,80 55,75" stroke={color} fill="none" />
    <circle cx="50" cy="110" r="10" fill="none" stroke={color} strokeWidth="1" />
    <path d="M50,100 L50,120 M40,110 L60,110" stroke={color} strokeWidth="1" />
    <text x="15" y="125" fontSize="20" fill={color} fontFamily="serif" fontWeight="bold">Q</text>
    <text x="85" y="25" fontSize="20" fill={color} fontFamily="serif" fontWeight="bold" transform="rotate(180 85 25)">Q</text>
  </svg>
);

export const JackGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    <rect x="5" y="5" width="90" height="130" fill="none" stroke={color} strokeWidth="2" />
    <rect x="10" y="10" width="80" height="120" fill="none" stroke="#D4AF37" strokeWidth="1" />
    <path d="M30,30 L70,30 L60,15 L65,10 L40,30" fill={color} opacity="0.2" />
    <path d="M30,30 L70,30 L50,10 Z" fill="none" stroke={color} strokeWidth="1" />
    <rect x="35" y="30" width="30" height="40" fill="none" stroke={color} strokeWidth="1" />
    <circle cx="45" cy="45" r="2" fill={color} />
    <circle cx="55" cy="45" r="2" fill={color} />
    <line x1="20" y1="120" x2="80" y2="60" stroke={color} strokeWidth="2" />
    <path d="M80,60 L85,55 L75,65 Z" fill={color} />
    <text x="15" y="125" fontSize="20" fill={color} fontFamily="serif" fontWeight="bold">J</text>
    <text x="85" y="25" fontSize="20" fill={color} fontFamily="serif" fontWeight="bold" transform="rotate(180 85 25)">J</text>
  </svg>
);

export const JokerGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full">
    <path d="M50,20 L55,35 L70,35 L60,45 L65,60 L50,50 L35,60 L40,45 L30,35 L45,35 Z" fill={color} />
    <path d="M30,80 C30,60 40,50 50,50 C60,50 70,60 70,80" fill="none" stroke={color} strokeWidth="2" />
    <circle cx="30" cy="80" r="3" fill="#D4AF37" />
    <circle cx="70" cy="80" r="3" fill="#D4AF37" />
    <circle cx="50" cy="50" r="3" fill="#D4AF37" />
    <path d="M35,80 Q50,110 65,80" fill="none" stroke={color} strokeWidth="2" />
    <circle cx="42" cy="75" r="2" fill={color} />
    <circle cx="58" cy="75" r="2" fill={color} />
    <path d="M40,90 Q50,100 60,90" fill="none" stroke={color} strokeWidth="2" />
    <text x="50" y="120" fontSize="14" textAnchor="middle" fill={color} fontFamily="serif" letterSpacing="2">JOKER</text>
  </svg>
);