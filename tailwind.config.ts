import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
// Phase 5 P.3-MAX (§7.2): Lab color single source. Tailwind imports the
// same color table used by runtime JS/3D consumers so the two layers
// can never drift. Change a lab color in labColors.ts and both Tailwind
// utilities (bg-lab-3, text-lab-5) AND Three.js materials update together.
import { buildTailwindLabColors } from './src/config/labColors';

// AUDIT-G7: Tailwind v4 uses @import "tailwindcss" in CSS — darkMode:'class' removed (v4 uses @custom-variant)
// Content detection is automatic in v4 but kept for compatibility mode
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ═══ Frost-Prismatic Neon Accents — OKLCH L=0.75 (DES-03) ═══
        neon: {
          blue: { DEFAULT: 'oklch(0.75 0.17 225)', dim: 'oklch(0.75 0.17 225 / 0.25)', glow: 'oklch(0.75 0.17 225 / 0.15)' },
          green: { DEFAULT: 'oklch(0.75 0.19 155)', dim: 'oklch(0.75 0.19 155 / 0.25)', glow: 'oklch(0.75 0.19 155 / 0.15)' },
          purple: { DEFAULT: 'oklch(0.75 0.19 295)', dim: 'oklch(0.75 0.19 295 / 0.25)', glow: 'oklch(0.75 0.19 295 / 0.15)' },
          orange: { DEFAULT: 'oklch(0.75 0.20 25)', dim: 'oklch(0.75 0.20 25 / 0.25)', glow: 'oklch(0.75 0.20 25 / 0.15)' },
          amber: { DEFAULT: 'oklch(0.75 0.17 75)', dim: 'oklch(0.75 0.17 75 / 0.25)', glow: 'oklch(0.75 0.17 75 / 0.15)' },
        },
        // ═══ spark-* ALIASES — OKLCH (backward compatibility) ═══
        spark: {
          blue: 'oklch(0.75 0.17 225)',
          purple: 'oklch(0.75 0.19 295)',
          green: 'oklch(0.75 0.19 155)',
          orange: 'oklch(0.75 0.20 25)',
          coral: 'oklch(0.75 0.20 25)',
          amber: 'oklch(0.75 0.17 75)',
        },
        // ═══ Surface Colors — OKLCH (dark mode) ═══
        surface: {
          base: 'oklch(0.13 0.02 260)',
          deep: 'oklch(0.13 0.02 260)',
          card: 'oklch(0.16 0.02 280)',
          elevated: 'oklch(0.19 0.02 290)',
          border: 'oklch(1.0 0 0 / 0.06)',
        },
        // ═══ Lab Accent Colors (1-10) — OKLCH L=0.75 ═══
        // Phase 5 P.3-MAX: Generated from src/config/labColors.ts — the
        // single canonical lab color table. Both tailwind utilities AND
        // runtime JS/3D materials read from that file now.
        lab: buildTailwindLabColors(),
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px — minimum sub-scale size
      },
      fontFamily: {
        display: ['var(--font-display)', 'Exo 2', 'Exo 2 Fallback', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Sora', 'Sora Fallback', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        data: ['var(--font-data)', 'Orbitron', 'monospace'],
      },
      // DES-08: Semantic spacing tokens (maps to CSS --space-* variables)
      spacing: {
        'xs': 'var(--space-xs)',       //  4px
        'sm': 'var(--space-sm)',       //  8px
        'md': 'var(--space-md)',       // 16px
        'lg': 'var(--space-lg)',       // 24px
        'xl': 'var(--space-xl)',       // 32px
        '2xl': 'var(--space-2xl)',     // 48px
        'section': 'var(--space-section)', // 64px
      },
      // Fix Tailwind 4 spacing-token leak into max-w-* utilities.
      // The semantic spacing scale above redefines `md`, `lg`, `xl` to
      // 16/24/32px; without this explicit maxWidth scale, Tailwind 4
      // resolves max-w-md as max-width:16px and collapses content into
      // one-word-per-line columns (e.g. the global error page on mobile,
      // login + signup before the auth-page hardening commit). These
      // values are the Tailwind 3 defaults, restored explicitly so
      // every existing max-w-{sm,md,lg,xl,2xl,3xl...} usage works again.
      maxWidth: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
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
        'badge-unlock': 'badge-unlock 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards',
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
  plugins: [tailwindcssAnimate],
};

export default config;
