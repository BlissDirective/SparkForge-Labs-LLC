import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ═══ Frost-Prismatic Neon Accents (60% blue / 40% pops) ═══
        neon: {
          blue: { DEFAULT: '#00BBFF', dim: '#00BBFF40', glow: '#00BBFF25' },
          green: { DEFAULT: '#00FF88', dim: '#00FF8840', glow: '#00FF8825' },
          purple: { DEFAULT: '#AA66FF', dim: '#AA66FF40', glow: '#AA66FF25' },
          orange: { DEFAULT: '#FF6644', dim: '#FF664440', glow: '#FF664425' },
          amber: { DEFAULT: '#FFAA44', dim: '#FFAA4440', glow: '#FFAA4425' },
        },
        // ═══ spark-* ALIASES — backward compatibility ═══
        // These point to the same values as neon-* so both work.
        // Code written with spark-blue or neon-blue both compile.
        spark: {
          blue: '#00BBFF',
          purple: '#AA66FF',
          green: '#00FF88',
          orange: '#FF6644',
          coral: '#FF6644',
          amber: '#FFAA44',
        },
        // ═══ Surface Colors (dark mode) ═══
        surface: {
          base: '#0A0E16',
          deep: '#0A0E16',
          card: '#111118',
          elevated: '#1A1822',
          border: 'rgba(255, 255, 255, 0.06)',
        },
        // ═══ Lab Accent Colors (1-10) ═══
        lab: {
          1: '#00BBFF',  // What IS AI?
          2: '#AA66FF',  // Teaching Machines
          3: '#FF66AA',  // The Brain Inside
          4: '#FFAA44',  // AI That Creates
          5: '#00FF88',  // AI Helpers
          6: '#FF6644',  // AI & Ethics
          7: '#06B6D4',  // Computer Vision
          8: '#818CF8',  // Words & Language
          9: '#F97316',  // Build with AI
          10: '#D946EF', // AI's Future
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px — minimum sub-scale size
      },
      fontFamily: {
        display: ['Exo 2', 'system-ui', 'sans-serif'],
        body: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        data: ['Orbitron', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0,187,255,0.25)',
        'glow-purple': '0 0 20px rgba(170,102,255,0.25)',
        'glow-green': '0 0 20px rgba(0,255,136,0.25)',
        'glow-orange': '0 0 20px rgba(255,102,68,0.25)',
        'glow-amber': '0 0 20px rgba(255,170,68,0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.06)',
        'chrome': '0 1px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)',
        'interactive': '0 4px 20px rgba(0,0,0,0.3), 0 0 15px var(--lab-glow, rgba(0,187,255,0.15))',
      },
      backgroundImage: {
        'frost-gradient': 'linear-gradient(135deg, rgba(0,187,255,0.08), rgba(170,102,255,0.05))',
        'chrome-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
        'glass-surface': 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0,187,255,0.15)' },
          '50%': { boxShadow: '0 0 24px rgba(0,187,255,0.3)' },
        },
        'chrome-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'connection-pulse': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        'hex-appear': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'badge-unlock': {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%': { transform: 'scale(1.3) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'slide-up-spring': {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '60%': { transform: 'translateY(-4px)' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-bounce': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'xp-counter': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-60px) scale(1.5)', opacity: '0' },
        },
        'subtle-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,187,255,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(0,187,255,0.25)' },
        },
        // ═══ v2 NEW KEYFRAMES ═══
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-border-rotate': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'float': 'float 3.5s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'chrome-shimmer': 'chrome-shimmer 3s linear infinite',
        'connection-pulse': 'connection-pulse 4s ease-in-out infinite',
        'hex-appear': 'hex-appear 0.4s ease both',
        'badge-unlock': 'badge-unlock 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'confetti-fall': 'confetti-fall 3s ease-in forwards',
        'slide-up': 'slide-up-spring 0.5s ease-out forwards',
        'scale-bounce': 'scale-bounce 0.5s ease-out forwards',
        'xp-float': 'xp-counter 1.5s ease-out forwards',
        'subtle-glow': 'subtle-glow 4s ease-in-out infinite',
        // v2 additions
        'skeleton-shimmer': 'skeleton-shimmer 1.8s linear infinite',
        'glow-border': 'glow-border-rotate 4s ease infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
