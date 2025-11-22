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

// Classic Court Cards - Traditional Playing Card Style

export const KingGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    {/* Crown - Classic King Crown */}
    <path d="M25,30 L30,20 L35,25 L40,15 L45,25 L50,10 L55,25 L60,15 L65,25 L70,20 L75,30 L75,40 L25,40 Z" 
          fill="#D4AF37" stroke={color} strokeWidth="1.5" />
    <circle cx="50" cy="12" r="2" fill={color} />
    <circle cx="40" cy="20" r="1.5" fill={color} />
    <circle cx="60" cy="20" r="1.5" fill={color} />
    
    {/* Head */}
    <ellipse cx="50" cy="50" rx="12" ry="14" fill="none" stroke={color} strokeWidth="1.5" />
    
    {/* Eyes */}
    <circle cx="45" cy="48" r="2" fill={color} />
    <circle cx="55" cy="48" r="2" fill={color} />
    
    {/* Nose */}
    <path d="M50,52 L48,55 L52,55 Z" fill={color} />
    
    {/* Mustache */}
    <path d="M42,56 Q50,58 58,56" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M42,56 Q45,60 42,64" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M58,56 Q55,60 58,64" stroke={color} strokeWidth="1.5" fill="none" />
    
    {/* Beard */}
    <path d="M38,60 Q50,75 62,60" stroke={color} strokeWidth="2" fill="none" />
    <path d="M38,60 Q35,70 38,80" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M62,60 Q65,70 62,80" stroke={color} strokeWidth="1.5" fill="none" />
    
    {/* Robe - Upper Body */}
    <path d="M30,80 Q30,70 35,65 Q50,60 65,65 Q70,70 70,80" 
          stroke={color} strokeWidth="2" fill="none" />
    
    {/* Robe - Lower Body */}
    <path d="M30,80 L30,110 Q30,120 40,120 Q50,118 60,120 Q70,120 70,110 L70,80" 
          stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    
    {/* Scepter / Sword - Left Side */}
    <line x1="20" y1="25" x2="20" y2="100" stroke={color} strokeWidth="2.5" />
    <path d="M20,25 L15,20 L25,20 Z" fill={color} />
    <circle cx="20" cy="60" r="3" fill="#D4AF37" stroke={color} strokeWidth="1" />
    
    {/* Scepter / Sword - Right Side */}
    <line x1="80" y1="25" x2="80" y2="100" stroke={color} strokeWidth="2.5" />
    <path d="M80,25 L75,20 L85,20 Z" fill={color} />
    <circle cx="80" cy="60" r="3" fill="#D4AF37" stroke={color} strokeWidth="1" />
    
    {/* Decorative Elements on Robe */}
    <circle cx="50" cy="85" r="3" fill="none" stroke={color} strokeWidth="1" />
    <path d="M50,88 L50,95" stroke={color} strokeWidth="1" />
  </svg>
);

export const QueenGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    {/* Crown - Classic Queen Crown */}
    <path d="M30,30 L35,20 L40,28 L45,18 L50,25 L55,18 L60,28 L65,20 L70,30 L70,40 L30,40 Z" 
          fill="#D4AF37" stroke={color} strokeWidth="1.5" />
    <circle cx="50" cy="22" r="2" fill={color} />
    <circle cx="40" cy="24" r="1.5" fill={color} />
    <circle cx="60" cy="24" r="1.5" fill={color} />
    
    {/* Head */}
    <ellipse cx="50" cy="52" rx="11" ry="13" fill="none" stroke={color} strokeWidth="1.5" />
    
    {/* Hair */}
    <path d="M39,50 Q35,45 32,50 Q35,55 39,60" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M61,50 Q65,45 68,50 Q65,55 61,60" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M39,50 Q50,48 61,50" stroke={color} strokeWidth="1.5" fill="none" />
    
    {/* Eyes */}
    <circle cx="45" cy="50" r="1.5" fill={color} />
    <circle cx="55" cy="50" r="1.5" fill={color} />
    
    {/* Nose */}
    <path d="M50,53 L48,56 L52,56 Z" fill={color} />
    
    {/* Mouth */}
    <path d="M46,58 Q50,60 54,58" stroke={color} strokeWidth="1.5" fill="none" />
    
    {/* Neck */}
    <line x1="48" y1="65" x2="48" y2="70" stroke={color} strokeWidth="1.5" />
    <line x1="52" y1="65" x2="52" y2="70" stroke={color} strokeWidth="1.5" />
    
    {/* Dress - Upper Body */}
    <path d="M28,70 Q28,65 35,68 Q50,65 65,68 Q72,65 72,70" 
          stroke={color} strokeWidth="2" fill="none" />
    
    {/* Dress - Lower Body (Elegant Flowing) */}
    <path d="M28,70 Q25,75 28,85 Q30,100 35,110 Q50,118 65,110 Q70,100 72,85 Q75,75 72,70" 
          stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    
    {/* Flower - Left Side */}
    <circle cx="20" cy="75" r="4" fill="none" stroke={color} strokeWidth="1.5" />
    <circle cx="20" cy="75" r="2" fill={color} fillOpacity="0.3" />
    <path d="M20,79 L20,85" stroke={color} strokeWidth="1.5" />
    <path d="M16,82 L24,82" stroke={color} strokeWidth="1" />
    
    {/* Flower - Right Side */}
    <circle cx="80" cy="75" r="4" fill="none" stroke={color} strokeWidth="1.5" />
    <circle cx="80" cy="75" r="2" fill={color} fillOpacity="0.3" />
    <path d="M80,79 L80,85" stroke={color} strokeWidth="1.5" />
    <path d="M76,82 L84,82" stroke={color} strokeWidth="1" />
    
    {/* Decorative Elements on Dress */}
    <circle cx="50" cy="85" r="2.5" fill="none" stroke={color} strokeWidth="1" />
    <path d="M50,87.5 L50,92" stroke={color} strokeWidth="1" />
  </svg>
);

export const JackGraphic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 140" className="w-full h-full opacity-90">
    {/* Hat - Classic Jack Hat */}
    <path d="M30,35 L35,25 L40,30 L45,22 L50,28 L55,22 L60,30 L65,25 L70,35 L70,42 L30,42 Z" 
          fill="#D4AF37" stroke={color} strokeWidth="1.5" />
    <path d="M30,42 L25,50 L30,48" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M70,42 L75,50 L70,48" stroke={color} strokeWidth="1.5" fill="none" />
    <circle cx="50" cy="26" r="1.5" fill={color} />
    
    {/* Head */}
    <ellipse cx="50" cy="58" rx="10" ry="12" fill="none" stroke={color} strokeWidth="1.5" />
    
    {/* Eyes */}
    <circle cx="46" cy="56" r="1.5" fill={color} />
    <circle cx="54" cy="56" r="1.5" fill={color} />
    
    {/* Nose */}
    <path d="M50,59 L48,62 L52,62 Z" fill={color} />
    
    {/* Mouth */}
    <path d="M48,64 Q50,66 52,64" stroke={color} strokeWidth="1.5" fill="none" />
    
    {/* Neck */}
    <line x1="48" y1="70" x2="48" y2="75" stroke={color} strokeWidth="1.5" />
    <line x1="52" y1="70" x2="52" y2="75" stroke={color} strokeWidth="1.5" />
    
    {/* Tunic - Upper Body */}
    <path d="M32,75 Q32,72 38,74 Q50,72 62,74 Q68,72 68,75" 
          stroke={color} strokeWidth="2" fill="none" />
    
    {/* Tunic - Lower Body */}
    <path d="M32,75 L32,105 Q32,110 40,110 Q50,108 60,110 Q68,110 68,105 L68,75" 
          stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    
    {/* Spear / Halberd - Left Side */}
    <line x1="18" y1="30" x2="18" y2="110" stroke={color} strokeWidth="2.5" />
    <path d="M18,30 L13,25 L23,25 Z" fill={color} />
    <path d="M18,110 L15,115 L21,115 Z" fill={color} />
    
    {/* Spear / Halberd - Right Side */}
    <line x1="82" y1="30" x2="82" y2="110" stroke={color} strokeWidth="2.5" />
    <path d="M82,30 L77,25 L87,25 Z" fill={color} />
    <path d="M82,110 L79,115 L85,115 Z" fill={color} />
    
    {/* Decorative Elements on Tunic */}
    <circle cx="50" cy="85" r="2" fill="none" stroke={color} strokeWidth="1" />
    <path d="M50,87 L50,90" stroke={color} strokeWidth="1" />
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