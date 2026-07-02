// ════════════════════════════════════════════════════════════════════════════
// SPARKY CORE — Canonical AI Tutor Avatar Component (v2 — owner reference)
// ════════════════════════════════════════════════════════════════════════════
// The ONE and ONLY Sparky implementation in the entire codebase.
// All Sparky instances across the app (landing, dashboard, home, games)
// render this exact same character.
//
// v2 (July 2026): re-skinned to the owner's canonical reference
// (public/branding/sparky-reference.jpeg) — a full-body chibi chrome
// robot: polished dome head with a glowing lightning-bolt emblem,
// dark visor screen with scanline LED eyes, glowing ear pods, chunky
// chrome torso with neon trim, stubby arms and rounded boots. Neon
// accent is cyan (#4DE9FF); per-expression glow tints only the face
// LEDs so the character stays uniform site-wide while emotions read.
//
// Architecture: single SVG (crisp at any size) + Framer Motion.
// NO WebGL, NO canvas. Public API is unchanged from v1.

'use client';

import { useId, useMemo } from 'react';
import { motion } from 'motion/react';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type SparkyExpression =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'speaking'
  | 'excited'
  | 'sleepy'
  | 'sad'
  | 'celebrating'
  | 'surprised';

export type SparkySize = 'sm' | 'md' | 'lg' | 'xl';

export interface SparkyCoreProps {
  expression?: SparkyExpression;
  size?: SparkySize;
  /**
   * Fluid override for marketing surfaces: exact px (number) or any CSS
   * width expression (e.g. `clamp(96px, 18vw, 280px)`). Height follows
   * via aspect-ratio. Takes precedence over `size`.
   */
  pixelSize?: number | string;
  isAnimated?: boolean;
  glowColor?: string;
  showAura?: boolean;
  className?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// EXPRESSION CONFIGURATION
// Mouth paths live in the visor coordinate space (visor: x 16–64, y 27–53;
// eyes at (30,38) and (50,38); mouth baseline ~y 48).
// ════════════════════════════════════════════════════════════════════════════

interface ExpressionConfig {
  eyeScale: number;
  eyeYOffset: number;
  mouthPath: string;
  glowColor: string;
  eyeRingOpacity: number;
  antennaGlowIntensity: number;
}

const EXPRESSIONS: Record<SparkyExpression, ExpressionConfig> = {
  idle: {
    eyeScale: 1,
    eyeYOffset: 0,
    mouthPath: 'M 35 47.5 Q 40 50.5 45 47.5',
    glowColor: '#4DE9FF',
    eyeRingOpacity: 0.85,
    antennaGlowIntensity: 0.6,
  },
  happy: {
    eyeScale: 1.1,
    eyeYOffset: -0.6,
    mouthPath: 'M 33.5 46.5 Q 40 52.5 46.5 46.5',
    glowColor: '#34F5C0',
    eyeRingOpacity: 1,
    antennaGlowIntensity: 0.9,
  },
  thinking: {
    eyeScale: 0.7,
    eyeYOffset: 1.2,
    mouthPath: 'M 36.5 48.5 Q 40 46.5 43.5 48.5',
    glowColor: '#FFD93D',
    eyeRingOpacity: 0.6,
    antennaGlowIntensity: 0.5,
  },
  speaking: {
    eyeScale: 1,
    eyeYOffset: 0,
    mouthPath: 'M 35 47 Q 40 51 45 47',
    glowColor: '#E945F5',
    eyeRingOpacity: 0.9,
    antennaGlowIntensity: 0.8,
  },
  excited: {
    eyeScale: 1.2,
    eyeYOffset: -1.2,
    mouthPath: 'M 32.5 45.5 Q 40 54.5 47.5 45.5',
    glowColor: '#FF8A5C',
    eyeRingOpacity: 1,
    antennaGlowIntensity: 1,
  },
  sleepy: {
    eyeScale: 0.5,
    eyeYOffset: 1.8,
    mouthPath: 'M 36.5 49 Q 40 49.8 43.5 49',
    glowColor: '#8B9FFF',
    eyeRingOpacity: 0.4,
    antennaGlowIntensity: 0.3,
  },
  sad: {
    eyeScale: 0.65,
    eyeYOffset: 0.8,
    mouthPath: 'M 35 49.5 Q 40 46.8 45 49.5',
    glowColor: '#5B7FFF',
    eyeRingOpacity: 0.5,
    antennaGlowIntensity: 0.3,
  },
  celebrating: {
    eyeScale: 1.3,
    eyeYOffset: -1.6,
    mouthPath: 'M 32 44.5 Q 40 55.5 48 44.5',
    glowColor: '#FFE066',
    eyeRingOpacity: 1,
    antennaGlowIntensity: 1,
  },
  surprised: {
    eyeScale: 1.35,
    eyeYOffset: -0.6,
    mouthPath: 'M 38.4 48 A 1.9 1.9 0 1 1 38.4 51.4 A 1.9 1.9 0 1 1 38.4 48',
    glowColor: '#FF6B9C',
    eyeRingOpacity: 1,
    antennaGlowIntensity: 0.9,
  },
};

// The character's constant chrome/neon identity — expressions tint the
// face LEDs, but trim, bolt emblem, and ear pods stay canonical cyan so
// Sparky reads as the same robot everywhere.
const NEON = '#4DE9FF';

// ════════════════════════════════════════════════════════════════════════════
// SIZE MAP — width in px; the full-body robot is ~1.22× taller than wide.
// ════════════════════════════════════════════════════════════════════════════

const SIZE_MAP: Record<SparkySize, number> = {
  sm: 40,
  md: 72,
  lg: 120,
  xl: 192,
};

const ASPECT = 1.22; // viewBox 80 × 98

// ════════════════════════════════════════════════════════════════════════════
// FULL-BODY ROBOT (single SVG)
// ════════════════════════════════════════════════════════════════════════════

function SparkyRobot({
  expression,
  glowColor: glowOverride,
}: {
  expression: SparkyExpression;
  glowColor?: string;
}) {
  // The AI-tutor API can return expression strings outside the union
  // (server prompt drift); an unknown key made cfg undefined and
  // rendered <path d="undefined"> (P1-6). Fall back to idle.
  const cfg = EXPRESSIONS[expression] ?? EXPRESSIONS.idle;
  const glow = glowOverride || cfg.glowColor;

  // Unique gradient/pattern IDs per instance so multiple Sparkys on one
  // page (e.g. /dev/sparky) never fight over defs.
  const uid = useId().replace(/[:]/g, '');
  const id = (name: string) => `sk-${name}-${uid}`;

  return (
    <svg
      viewBox="0 0 80 98"
      className="w-full h-full"
      style={{ filter: `drop-shadow(0 0 6px ${glow}50)` }}
      aria-hidden="true"
    >
      <defs>
        {/* Chrome — cool polished steel with a warm kiss, per reference */}
        <linearGradient id={id('chrome')} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#F7F9FE" />
          <stop offset="30%" stopColor="#D9DFEC" />
          <stop offset="55%" stopColor="#AEB8CE" />
          <stop offset="78%" stopColor="#7C88A6" />
          <stop offset="100%" stopColor="#525E7C" />
        </linearGradient>
        <linearGradient id={id('chromeDark')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C6CEDF" />
          <stop offset="55%" stopColor="#8792AE" />
          <stop offset="100%" stopColor="#3E4A66" />
        </linearGradient>
        {/* Visor screen */}
        <radialGradient id={id('screen')} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#0D1B2A" />
          <stop offset="100%" stopColor="#04080F" />
        </radialGradient>
        {/* LED eye — bright core fading out */}
        <radialGradient id={id('eye')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="35%" stopColor={glow} stopOpacity="0.95" />
          <stop offset="80%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={glow} stopOpacity="0.15" />
        </radialGradient>
        {/* Horizontal scanlines masked into the eye discs (reference look) */}
        <pattern id={id('scan')} width="4" height="2.2" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.3" fill="#04080F" opacity="0.35" />
        </pattern>
        <filter id={id('neonGlow')} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ══ BOOTS ══ */}
      <g>
        <rect x="21" y="86" width="16" height="9" rx="4.2" fill={`url(#${id('chromeDark')})`} />
        <rect x="43" y="86" width="16" height="9" rx="4.2" fill={`url(#${id('chromeDark')})`} />
        {/* Neon boot trim */}
        <path d="M 23 90 H 35" stroke={NEON} strokeWidth="1" strokeLinecap="round" opacity="0.85" filter={`url(#${id('neonGlow')})`} />
        <path d="M 45 90 H 57" stroke={NEON} strokeWidth="1" strokeLinecap="round" opacity="0.85" filter={`url(#${id('neonGlow')})`} />
      </g>

      {/* ══ ARMS (behind torso) ══ */}
      <g>
        <ellipse cx="16.5" cy="72" rx="6" ry="8.5" fill={`url(#${id('chromeDark')})`} transform="rotate(14 16.5 72)" />
        <ellipse cx="63.5" cy="72" rx="6" ry="8.5" fill={`url(#${id('chromeDark')})`} transform="rotate(-14 63.5 72)" />
        {/* Arm neon rings */}
        <path d="M 12.5 68.5 Q 16.5 66.5 20.5 68.5" stroke={NEON} strokeWidth="0.9" fill="none" opacity="0.8" filter={`url(#${id('neonGlow')})`} />
        <path d="M 59.5 68.5 Q 63.5 66.5 67.5 68.5" stroke={NEON} strokeWidth="0.9" fill="none" opacity="0.8" filter={`url(#${id('neonGlow')})`} />
      </g>

      {/* ══ TORSO ══ */}
      <g>
        <path
          d="M 24 60 Q 24 56 29 56 L 51 56 Q 56 56 56 60 L 57.5 80 Q 57.5 86 51 86 L 29 86 Q 22.5 86 22.5 80 Z"
          fill={`url(#${id('chrome')})`}
        />
        {/* Torso neon trim following the silhouette */}
        <path
          d="M 25.8 61 L 24.6 79.5 Q 24.6 84 29.5 84 L 50.5 84 Q 55.4 84 55.4 79.5 L 54.2 61"
          stroke={NEON}
          strokeWidth="1.1"
          fill="none"
          opacity="0.9"
          filter={`url(#${id('neonGlow')})`}
        />
        {/* Chest core panel */}
        <rect x="34.5" y="63.5" width="11" height="9.5" rx="2.4" fill={`url(#${id('screen')})`} stroke={NEON} strokeWidth="0.9" strokeOpacity="0.9" filter={`url(#${id('neonGlow')})`} />
        <path d="M 37 66 H 43 M 37 68.2 H 43 M 37 70.4 H 43" stroke={NEON} strokeWidth="0.8" opacity="0.75" />
        {/* Belly seam + rivets */}
        <circle cx="29" cy="78" r="0.8" fill="#46506B" />
        <circle cx="51" cy="78" r="0.8" fill="#46506B" />
      </g>

      {/* ══ EAR PODS ══ */}
      <g>
        <circle cx="9.5" cy="38" r="7.2" fill={`url(#${id('chromeDark')})`} />
        <circle cx="70.5" cy="38" r="7.2" fill={`url(#${id('chromeDark')})`} />
        {/* Glowing pod rings */}
        <circle cx="9.5" cy="38" r="5.4" fill="none" stroke={NEON} strokeWidth="1.1" opacity="0.9" filter={`url(#${id('neonGlow')})`} />
        <circle cx="70.5" cy="38" r="5.4" fill="none" stroke={NEON} strokeWidth="1.1" opacity="0.9" filter={`url(#${id('neonGlow')})`} />
        <circle cx="9.5" cy="38" r="2.6" fill="#111A2C" />
        <circle cx="70.5" cy="38" r="2.6" fill="#111A2C" />
      </g>

      {/* ══ HEAD DOME ══ */}
      <g>
        {/* Antenna cap */}
        <rect x="33" y="1.5" width="14" height="5.5" rx="2.4" fill={`url(#${id('chromeDark')})`} />
        {/* Dome */}
        <ellipse cx="40" cy="34" rx="30" ry="29" fill={`url(#${id('chrome')})`} />
        {/* Dome specular highlight */}
        <ellipse cx="29" cy="17" rx="12" ry="6.5" fill="#FFFFFF" opacity="0.55" transform="rotate(-18 29 17)" />
        {/* Panel seam over the brow with rivets */}
        <path d="M 12.5 27.5 Q 40 15.5 67.5 27.5" stroke="#5D6883" strokeWidth="0.9" fill="none" opacity="0.7" />
        <path d="M 13.5 30 Q 40 18 66.5 30" stroke={NEON} strokeWidth="0.9" fill="none" opacity="0.75" filter={`url(#${id('neonGlow')})`} />
        <circle cx="20" cy="24.7" r="0.75" fill="#46506B" />
        <circle cx="60" cy="24.7" r="0.75" fill="#46506B" />
        <circle cx="40" cy="17.8" r="0.75" fill="#46506B" />

        {/* Lightning-bolt emblem (canonical, always neon) */}
        <motion.path
          d="M 41.8 8.5 L 36.8 16.8 L 40 16.8 L 38.2 22.5 L 43.6 14.4 L 40.4 14.4 Z"
          fill={NEON}
          filter={`url(#${id('neonGlow')})`}
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        />
      </g>

      {/* ══ VISOR SCREEN ══ */}
      <g>
        {/* rx=20 is load-bearing: Sparky.test.tsx asserts the visor rect */}
        <rect
          x="16"
          y="27"
          width="48"
          height="26"
          rx="20"
          ry="12"
          fill={`url(#${id('screen')})`}
          stroke={NEON}
          strokeWidth="1"
          strokeOpacity="0.8"
          filter={`url(#${id('neonGlow')})`}
        />

        {/* ── Eyes: LED discs with scanlines ── */}
        {[30, 50].map((cx) => (
          <motion.g
            key={cx}
            animate={{ scale: cfg.eyeScale, y: cfg.eyeYOffset }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ transformOrigin: `${cx}px 38px` }}
          >
            <g transform={`translate(${cx}, 38)`}>
              {/* Soft halo */}
              <circle cx="0" cy="0" r="7.6" fill={glow} opacity={0.22 * cfg.eyeRingOpacity} filter={`url(#${id('neonGlow')})`} />
              {/* LED disc */}
              <circle cx="0" cy="0" r="6.2" fill={`url(#${id('eye')})`} opacity={cfg.eyeRingOpacity} />
              {/* Scanline texture */}
              <circle cx="0" cy="0" r="6.2" fill={`url(#${id('scan')})`} opacity="0.9" />
              {/* Rim */}
              <circle cx="0" cy="0" r="6.2" fill="none" stroke={glow} strokeWidth="0.8" opacity={cfg.eyeRingOpacity} />
              {/* Highlight dot */}
              <circle cx="-2" cy="-2.2" r="1.3" fill="#FFFFFF" opacity="0.85" />
            </g>
          </motion.g>
        ))}

        {/* ── Mouth ── */}
        <motion.path
          d={cfg.mouthPath}
          fill={expression === 'surprised' ? `${glow}40` : 'none'}
          stroke={glow}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.9"
          filter={`url(#${id('neonGlow')})`}
          animate={{ d: cfg.mouthPath }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      </g>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — SparkyCore
// ════════════════════════════════════════════════════════════════════════════

export function SparkyCore({
  expression = 'idle',
  size = 'md',
  pixelSize,
  isAnimated = true,
  glowColor: glowColorProp,
  showAura = true,
  className = '',
}: SparkyCoreProps) {
  const cfg = EXPRESSIONS[expression] ?? EXPRESSIONS.idle;
  const glowColor = glowColorProp || cfg.glowColor;
  const width = pixelSize ?? SIZE_MAP[size];

  // Floating bob animation
  const bobAnimation = useMemo(
    () => (isAnimated ? { y: [0, -5, 0] } : {}),
    [isAnimated]
  );
  const bobTransition = useMemo(
    () =>
      isAnimated
        ? { repeat: Infinity, duration: 3, ease: 'easeInOut' as const }
        : {},
    [isAnimated]
  );

  // Breathing scale animation
  const breatheAnimation = useMemo(
    () => (isAnimated ? { scale: [1, 1.015, 1] } : {}),
    [isAnimated]
  );
  const breatheTransition = useMemo(
    () =>
      isAnimated
        ? { repeat: Infinity, duration: 4, ease: 'easeInOut' as const }
        : {},
    [isAnimated]
  );

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width, aspectRatio: `1 / ${ASPECT}` }}
    >
      {/* ── Ambient Aura Glow ── */}
      {showAura && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${glowColor}18 0%, ${glowColor}08 40%, transparent 70%)`,
            transform: 'scale(1.45)',
            filter: 'blur(8px)',
          }}
        />
      )}

      {/* ── Robot with float + breathe ── */}
      <motion.div
        animate={bobAnimation}
        transition={bobTransition}
        className="relative w-full h-full"
      >
        <motion.div
          animate={breatheAnimation}
          transition={breatheTransition}
          className="relative w-full h-full"
        >
          <SparkyRobot expression={expression} glowColor={glowColorProp} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// Re-export types for convenience
export { EXPRESSIONS };
export type { ExpressionConfig };
