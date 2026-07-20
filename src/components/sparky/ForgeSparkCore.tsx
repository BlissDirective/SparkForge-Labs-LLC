'use client';

// ════════════════════════════════════════════════════════════════════════════
// FORGESPARK CORE — Forge F7 (Concept 10 Part 11)
// ════════════════════════════════════════════════════════════════════════════
// The forge-era mascot: a small cyber-fox kit forged from liquid bronze
// and living circuitry. Big hexagon-iris eyes, plasma-flame tail (the
// ONLY persistent magenta in the app), amber circuit seams.
//
// Prop-contract IDENTICAL to SparkyCore (drop-in). SparkyCore branches
// here when FORGE_MASCOT is on; flag-off restores the orb everywhere.
// Hand-authored SVG — the source of truth for the future forgespark.riv.

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { SparkyCoreProps, SparkyExpression, SparkySize } from './SparkyCore';

const SIZE_MAP: Record<SparkySize, number> = {
  sm: 40,
  md: 72,
  lg: 120,
  xl: 192,
};

// Palette (fixed — the mascot reads identically in both themes)
const BRONZE = '#C87B3B';
const BRONZE_DEEP = '#8A5426';
const CREAM = '#F5EBDC';
const AMBER = '#FF8C1A';
const GOLD = '#FFC24A';
const CYAN = '#35E0FF';
const PLASMA = '#FF3DA5';
const DARK = '#16100B';

interface FoxExpressionConfig {
  /** 1 = open; 0.08 = closed */
  eyeScaleY: number;
  /** crescent = happy closed-arc eyes */
  eyeStyle: 'round' | 'crescent' | 'wide';
  /** degrees; negative = flattened back */
  earRotate: number;
  /** tail flame scale */
  flameScale: number;
  /** tail flame tip color */
  flameTip: string;
  glowColor: string;
  fx: 'none' | 'sparks' | 'gear' | 'arcs' | 'orbit' | 'zzz' | 'question' | 'trophy' | 'bang';
}

const FOX_EXPRESSIONS: Record<SparkyExpression, FoxExpressionConfig> = {
  idle:        { eyeScaleY: 1,    eyeStyle: 'round',    earRotate: 0,   flameScale: 1,   flameTip: PLASMA, glowColor: GOLD,   fx: 'none' },
  happy:       { eyeScaleY: 1,    eyeStyle: 'crescent', earRotate: -6,  flameScale: 1.2, flameTip: PLASMA, glowColor: GOLD,   fx: 'sparks' },
  thinking:    { eyeScaleY: 0.6,  eyeStyle: 'round',    earRotate: 8,   flameScale: 0.9, flameTip: AMBER,  glowColor: CYAN,   fx: 'gear' },
  speaking:    { eyeScaleY: 1,    eyeStyle: 'round',    earRotate: -4,  flameScale: 1,   flameTip: PLASMA, glowColor: GOLD,   fx: 'arcs' },
  excited:     { eyeScaleY: 1,    eyeStyle: 'wide',     earRotate: -10, flameScale: 1.4, flameTip: PLASMA, glowColor: GOLD,   fx: 'orbit' },
  sleepy:      { eyeScaleY: 0.18, eyeStyle: 'round',    earRotate: 14,  flameScale: 0.6, flameTip: AMBER,  glowColor: BRONZE, fx: 'zzz' },
  sad:         { eyeScaleY: 0.75, eyeStyle: 'round',    earRotate: 20,  flameScale: 0.55,flameTip: '#4FC6FF', glowColor: '#4FC6FF', fx: 'question' },
  celebrating: { eyeScaleY: 1,    eyeStyle: 'crescent', earRotate: -10, flameScale: 1.6, flameTip: PLASMA, glowColor: GOLD,   fx: 'trophy' },
  surprised:   { eyeScaleY: 1,    eyeStyle: 'wide',     earRotate: -14, flameScale: 0.8, flameTip: PLASMA, glowColor: CYAN,   fx: 'bang' },
};

const ARIA: Record<SparkyExpression, string> = {
  idle: 'ForgeSpark the fox is here',
  happy: 'ForgeSpark is happy!',
  thinking: 'ForgeSpark is thinking…',
  speaking: 'ForgeSpark is speaking',
  excited: 'ForgeSpark is excited!',
  sleepy: 'ForgeSpark is sleepy',
  sad: 'ForgeSpark wants to help',
  celebrating: 'ForgeSpark is celebrating!',
  surprised: 'ForgeSpark is surprised!',
};

export function ForgeSparkCore({
  expression = 'idle',
  size = 'md',
  pixelSize,
  isAnimated = true,
  glowColor: glowColorProp,
  showAura = true,
  className = '',
}: SparkyCoreProps) {
  const reducedMotion = useReducedMotion();
  const cfg = FOX_EXPRESSIONS[expression] ?? FOX_EXPRESSIONS.idle;
  const glowColor = glowColorProp || cfg.glowColor;
  const width = pixelSize ?? SIZE_MAP[size];
  const animate = isAnimated && !reducedMotion;

  const bobAnimation = useMemo(() => (animate ? { y: [0, -4, 0] } : {}), [animate]);
  const bobTransition = useMemo(
    () => (animate ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' as const } : {}),
    [animate]
  );

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        aspectRatio: '1 / 1',
      }}
      animate={bobAnimation}
      transition={bobTransition}
    >
      {showAura && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${glowColor}33 0%, transparent 65%)`,
            transform: 'scale(1.35)',
          }}
        />
      )}
      <svg
        viewBox="0 0 240 240"
        role="img"
        aria-label={ARIA[expression] ?? ARIA.idle}
        className="relative w-full h-full"
      >
        <defs>
          <linearGradient id="fs-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRONZE} />
            <stop offset="100%" stopColor={BRONZE_DEEP} />
          </linearGradient>
          <linearGradient id="fs-flame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="55%" stopColor={AMBER} />
            <stop offset="100%" stopColor={cfg.flameTip} />
          </linearGradient>
        </defs>

        {/* ── tail flame (behind body, wobbles from its base) ──
            Outer <g>: SVG attribute transform positions/scales the
            flame. Inner <g>: the CSS wobble animation — CSS transform
            REPLACES an attribute transform on the same element, so the
            two must live on separate groups. */}
        <g transform={`translate(178 150) scale(${cfg.flameScale})`}>
          <g
            style={
              animate
                ? { animation: 'forge-fox-tail 2.8s ease-in-out infinite', transformOrigin: '0px 40px', transformBox: 'fill-box' }
                : undefined
            }
          >
            <path
              d="M 0 40 C -14 18 -6 2 4 -14 C 8 -2 18 2 14 16 C 24 8 26 22 18 34 C 12 42 4 44 0 40 Z"
              fill="url(#fs-flame)"
              opacity="0.95"
            />
            <path
              d="M 2 34 C -6 20 0 10 6 0 C 8 8 14 12 11 20 C 14 26 10 32 2 34 Z"
              fill={GOLD}
              opacity="0.8"
            />
          </g>
        </g>

        {/* ── body ── */}
        <ellipse cx="120" cy="168" rx="52" ry="44" fill="url(#fs-body)" />
        {/* belly */}
        <ellipse cx="120" cy="178" rx="30" ry="26" fill={CREAM} opacity="0.95" />
        {/* body seams (circuit traces) */}
        <path
          d="M 84 150 H 100 V 168 M 156 150 H 140 V 168"
          stroke={AMBER}
          strokeWidth="1.6"
          fill="none"
          opacity="0.7"
          strokeLinecap="round"
        />
        {/* paws */}
        <ellipse cx="98" cy="206" rx="13" ry="9" fill={BRONZE_DEEP} />
        <ellipse cx="142" cy="206" rx="13" ry="9" fill={BRONZE_DEEP} />

        {/* ── head ── */}
        <g>
          {/* ears */}
          <g transform={`rotate(${cfg.earRotate} 86 62)`}>
            <path d="M 70 82 L 84 30 L 106 68 Z" fill="url(#fs-body)" />
            <path d="M 78 70 L 85 44 L 96 64 Z" fill={AMBER} opacity="0.85" />
          </g>
          <g transform={`rotate(${-cfg.earRotate} 154 62)`}>
            <path d="M 170 82 L 156 30 L 134 68 Z" fill="url(#fs-body)" />
            <path d="M 162 70 L 155 44 L 144 64 Z" fill={AMBER} opacity="0.85" />
          </g>

          {/* head shape */}
          <path
            d="M 66 92 C 66 64 90 52 120 52 C 150 52 174 64 174 92 C 174 118 152 136 120 136 C 88 136 66 118 66 92 Z"
            fill="url(#fs-body)"
          />
          {/* head seam */}
          <path d="M 92 60 H 120 M 120 52 V 60" stroke={AMBER} strokeWidth="1.4" fill="none" opacity="0.6" strokeLinecap="round" />
          {/* muzzle */}
          <ellipse cx="120" cy="114" rx="26" ry="18" fill={CREAM} />
          {/* nose */}
          <ellipse cx="120" cy="106" rx="6" ry="4.5" fill={DARK} />
          {/* mouth */}
          {cfg.eyeStyle === 'crescent' ? (
            <path d="M 110 118 Q 120 126 130 118" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : expression === 'sad' ? (
            <path d="M 110 122 Q 120 116 130 122" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : expression === 'surprised' ? (
            <ellipse cx="120" cy="120" rx="5" ry="6" fill={DARK} />
          ) : (
            <path d="M 112 119 Q 120 123 128 119" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* ── eyes (the emotional centerpiece) ── */}
          {(['L', 'R'] as const).map((side) => {
            const cx = side === 'L' ? 98 : 142;
            if (cfg.eyeStyle === 'crescent') {
              return (
                <path
                  key={side}
                  d={`M ${cx - 10} 90 Q ${cx} 78 ${cx + 10} 90`}
                  stroke={DARK}
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            }
            const r = cfg.eyeStyle === 'wide' ? 13 : 11;
            return (
              <g key={side} transform={`translate(${cx} 88) scale(1 ${cfg.eyeScaleY})`}>
                <circle r={r} fill={DARK} />
                <circle r={r * 0.62} fill={CYAN} />
                <circle r={r * 0.3} fill={DARK} />
                <circle cx={-r * 0.3} cy={-r * 0.32} r={r * 0.2} fill="#FFFFFF" />
                {cfg.eyeStyle === 'wide' && <circle cx={r * 0.34} cy={r * 0.3} r={r * 0.11} fill="#FFFFFF" />}
              </g>
            );
          })}
        </g>

        {/* ── expression FX ── */}
        {cfg.fx === 'sparks' && (
          <g fill={GOLD} aria-hidden="true">
            <circle cx="66" cy="104" r="3" />
            <circle cx="174" cy="104" r="3" />
          </g>
        )}
        {cfg.fx === 'gear' && (
          <g transform="translate(168 44)" aria-hidden="true">
            <g
              style={
                animate
                  ? { animation: 'forge-fox-gear 2s linear infinite', transformOrigin: 'center', transformBox: 'fill-box' }
                  : undefined
              }
            >
              <circle r="10" fill="none" stroke={GOLD} strokeWidth="3" strokeDasharray="4 3" />
              <circle r="3.5" fill={GOLD} />
            </g>
          </g>
        )}
        {cfg.fx === 'arcs' && (
          <g stroke={CYAN} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85" aria-hidden="true">
            <path d="M 152 110 Q 158 114 152 118" />
            <path d="M 158 106 Q 168 114 158 122" />
            <path d="M 164 102 Q 178 114 164 126" />
          </g>
        )}
        {cfg.fx === 'orbit' && (
          <g fill={GOLD} aria-hidden="true">
            <circle cx="60" cy="70" r="3.5" />
            <circle cx="180" cy="70" r="3.5" />
            <circle cx="70" cy="140" r="2.5" fill={CYAN} />
            <circle cx="170" cy="140" r="2.5" fill={CYAN} />
          </g>
        )}
        {cfg.fx === 'zzz' && (
          <text x="168" y="52" fontSize="22" fill={CREAM} opacity="0.8" fontFamily="var(--font-display)" aria-hidden="true">
            z z
          </text>
        )}
        {cfg.fx === 'question' && (
          <text x="166" y="52" fontSize="26" fill={CYAN} fontWeight="bold" fontFamily="var(--font-display)" aria-hidden="true">
            ?
          </text>
        )}
        {cfg.fx === 'trophy' && (
          <g aria-hidden="true">
            <circle cx="62" cy="66" r="3.5" fill={GOLD} />
            <circle cx="178" cy="66" r="3.5" fill={GOLD} />
            <circle cx="52" cy="100" r="2.5" fill={PLASMA} />
            <circle cx="188" cy="100" r="2.5" fill={PLASMA} />
            <circle cx="72" cy="42" r="2.5" fill={CYAN} />
            <circle cx="168" cy="42" r="2.5" fill={CYAN} />
          </g>
        )}
        {cfg.fx === 'bang' && (
          <text x="168" y="52" fontSize="28" fill={GOLD} fontWeight="bold" fontFamily="var(--font-display)" aria-hidden="true">
            !
          </text>
        )}
      </svg>
    </motion.div>
  );
}
