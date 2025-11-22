/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 游戏主题色
        'table-primary': '#0f5132',
        'table-secondary': '#1a7a4a',
        'table-accent': '#2d9a5f',
        'table-dark': '#0a3d26',
        'table-light': '#2d8659',
        
        // 卡片颜色
        'card-bg': '#ffffff',
        'card-red': '#dc2626',
        'card-red-light': '#ef4444',
        'card-black': '#1f2937',
        'card-back': '#1e40af',
        
        // 经典扑克风颜色
        'classic-red': '#D40000',
        'classic-black': '#0A0A0A',
        'classic-back-blue': '#003366',
        'classic-back-red': '#8B0000',
        
        // 赌场风格颜色
        'felt-green': '#0a3d26', // 深绿毛毡
        'felt-green-light': '#135436',
        'casino-gold': '#d4af37', // 经典金
        'casino-gold-light': '#f3d267',
        'casino-wood': '#3e2723', // 深木色
        'panel-bg': '#fdfbf7', // 米色纸张背景
        'panel-border': '#cba35c', // 面板边框
        
        // 强调色
        'accent-gold': '#f59e0b',
        'accent-amber': '#fbbf24',
        'accent-yellow': '#fcd34d',
        
        // UI颜色
        'ui-primary': '#3b82f6',
        'ui-success': '#10b981',
        'ui-warning': '#f59e0b',
        'ui-error': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'card-selected': '0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.2)',
        'glow': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'card-flip': 'cardFlip 0.6s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
