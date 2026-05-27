// ════════════════════════════════════════════════════════════════════════════
// SPARKY CORE — Canonical AI Tutor Avatar Component
// ════════════════════════════════════════════════════════════════════════════
// The ONE and ONLY Sparky face implementation in the entire codebase.
// All Sparky instances across the app (landing, dashboard, home, games)
// render this exact same face and body.
//
// Architecture: SVG face (expressions) + CSS 3D chrome body (orb)
// Animations: Framer Motion (already in project)
// NO WebGL, NO canvas — pure SVG + CSS for crisp rendering at any size.

'use client';

import { useMemo } from 'react';
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

interface SparkyCoreProps {
  expression?: SparkyExpression;
  size?: SparkySize;
  isAnimated?: boolean;
  glowColor?: string;
  showAura?: boolean;
  className?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// EXPRESSION CONFIGURATION
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
    mouthPath: 'M 32 58 Q 40 62 48 58',
    glowColor: '#00D2FF',
    eyeRingOpacity: 0.8,
    antennaGlowIntensity: 0.6,
  },
  happy: {
    eyeScale: 1.1,
    eyeYOffset: -1,
    mouthPath: 'M 30 56 Q 40 66 50 56',
    glowColor: '#00FF88',
    eyeRingOpacity: 1,
    antennaGlowIntensity: 0.9,
  },
  thinking: {
    eyeScale: 0.7,
    eyeYOffset: 2,
    mouthPath: 'M 35 58 Q 40 55 45 58',
    glowColor: '#FFD93D',
    eyeRingOpacity: 0.6,
    antennaGlowIntensity: 0.5,
  },
  speaking: {
    eyeScale: 1,
    eyeYOffset: 0,
    mouthPath: 'M 32 57 Q 40 63 48 57',
    glowColor: '#E945F5',
    eyeRingOpacity: 0.9,
    antennaGlowIntensity: 0.8,
  },
  excited: {
    eyeScale: 1.2,
    eyeYOffset: -2,
    mouthPath: 'M 28 54 Q 40 70 52 54',
    glowColor: '#FF6B35',
    eyeRingOpacity: 1,
    antennaGlowIntensity: 1,
  },
  sleepy: {
    eyeScale: 0.5,
    eyeYOffset: 3,
    mouthPath: 'M 35 59 Q 40 60 45 59',
    glowColor: '#8B9FFF',
    eyeRingOpacity: 0.4,
    antennaGlowIntensity: 0.3,
  },
  sad: {
    eyeScale: 0.6,
    eyeYOffset: 1,
    mouthPath: 'M 32 60 Q 40 56 48 60',
    glowColor: '#5B7FFF',
    eyeRingOpacity: 0.5,
    antennaGlowIntensity: 0.3,
  },
  celebrating: {
    eyeScale: 1.3,
    eyeYOffset: -3,
    mouthPath: 'M 28 52 Q 40 72 52 52',
    glowColor: '#FFD93D',
    eyeRingOpacity: 1,
    antennaGlowIntensity: 1,
  },
  surprised: {
    eyeScale: 1.4,
    eyeYOffset: -1,
    mouthPath: 'M 37 59 A 3 3 0 1 1 37 65 A 3 3 0 1 1 37 59',
    glowColor: '#FF6B35',
    eyeRingOpacity: 1,
    antennaGlowIntensity: 0.9,
  },
};

// ════════════════════════════════════════════════════════════════════════════
// SIZE MAP
// ════════════════════════════════════════════════════════════════════════════

const SIZE_MAP: Record<SparkySize, number> = {
  sm: 40,
  md: 72,
  lg: 120,
  xl: 192,
};

// ════════════════════════════════════════════════════════════════════════════
// SVG DEFS COMPONENT (gradient definitions — rendered once)
// ════════════════════════════════════════════════════════════════════════════

function SparkyDefs({ glowColor }: { glowColor: string }) {
  return (
    <defs>
      {/* Eye ring gradient — bright inner, soft outer */}
      <radialGradient id="sc-eyeGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="40%" stopColor={glowColor} stopOpacity="0.95" />
        <stop offset="100%" stopColor={glowColor} stopOpacity="0.25" />
      </radialGradient>

      {/* Inner eye dark center */}
      <radialGradient id="sc-eyeCenter" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0A1628" stopOpacity="1" />
        <stop offset="70%" stopColor="#0A1628" stopOpacity="1" />
        <stop offset="100%" stopColor={glowColor} stopOpacity="0.45" />
      </radialGradient>

      {/* Face screen subtle gradient */}
      <radialGradient id="sc-faceScreen" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#0D1B2A" />
        <stop offset="100%" stopColor="#050A12" />
      </radialGradient>

      {/* Glow filter for eyes */}
      <filter id="sc-eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FACE COMPONENT (SVG — the soul of Sparky)
// ════════════════════════════════════════════════════════════════════════════

function SparkyFace({
  expression,
  isHovered,
}: {
  expression: SparkyExpression;
  isHovered: boolean;
}) {
  const cfg = EXPRESSIONS[expression];

  // Unique gradient IDs per expression to prevent caching issues
  const uid = expression.charAt(0) + expression.charAt(expression.length - 1);

  return (
    <svg
      viewBox="0 0 80 80"
      className="w-full h-full"
      style={{ filter: `drop-shadow(0 0 6px ${cfg.glowColor}60)` }}
      aria-hidden="true"
    >
      <SparkyDefs glowColor={cfg.glowColor} />

      {/* ── Face Screen (black rounded rectangle) ── */}
      <rect
        x="10"
        y="18"
        width="60"
        height="44"
        rx="20"
        fill="url(#sc-faceScreen)"
        stroke={cfg.glowColor}
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />

      {/* ── Left Eye ── */}
      <motion.g
        animate={{
          scale: cfg.eyeScale,
          y: cfg.eyeYOffset,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ transformOrigin: '28px 38px' }}
      >
        <g transform="translate(28, 38)">
          {/* Outer ring glow */}
          <circle
            cx="0"
            cy="0"
            r="9"
            fill="none"
            stroke={cfg.glowColor}
            strokeWidth="2.5"
            opacity={cfg.eyeRingOpacity}
            filter="url(#sc-eyeGlow)"
          />
          {/* Ring fill gradient */}
          <circle
            cx="0"
            cy="0"
            r="9"
            fill="none"
            stroke="url(#sc-eyeGrad)"
            strokeWidth="2"
            opacity={cfg.eyeRingOpacity}
          />
          {/* Dark center */}
          <circle cx="0" cy="0" r="5.5" fill="url(#sc-eyeCenter)" />
          {/* Highlight dot */}
          <circle cx="-2" cy="-2" r="1.8" fill="#FFFFFF" opacity="0.9" />
        </g>
      </motion.g>

      {/* ── Right Eye ── */}
      <motion.g
        animate={{
          scale: cfg.eyeScale,
          y: cfg.eyeYOffset,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ transformOrigin: '52px 38px' }}
      >
        <g transform="translate(52, 38)">
          <circle
            cx="0"
            cy="0"
            r="9"
            fill="none"
            stroke={cfg.glowColor}
            strokeWidth="2.5"
            opacity={cfg.eyeRingOpacity}
            filter="url(#sc-eyeGlow)"
          />
          <circle
            cx="0"
            cy="0"
            r="9"
            fill="none"
            stroke="url(#sc-eyeGrad)"
            strokeWidth="2"
            opacity={cfg.eyeRingOpacity}
          />
          <circle cx="0" cy="0" r="5.5" fill="url(#sc-eyeCenter)" />
          <circle cx="-2" cy="-2" r="1.8" fill="#FFFFFF" opacity="0.9" />
        </g>
      </motion.g>

      {/* ── Mouth ── */}
      <motion.path
        d={cfg.mouthPath}
        fill={expression === 'surprised' ? `${cfg.glowColor}40` : 'none'}
        stroke={cfg.glowColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
        animate={{ d: cfg.mouthPath }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* ── Scanline (subtle animated line across face) ── */}
      {isHovered && (
        <motion.line
          x1="10"
          y1="20"
          x2="70"
          y2="20"
          stroke={cfg.glowColor}
          strokeWidth="0.3"
          opacity="0.15"
          animate={{ y1: [20, 62, 20], y2: [20, 62, 20] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        />
      )}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHROME BODY COMPONENT (CSS 3D sphere)
// ════════════════════════════════════════════════════════════════════════════

function SparkyBody({
  glowColor,
  isHovered,
  size,
  children,
}: {
  glowColor: string;
  isHovered: boolean;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        background: `
          radial-gradient(circle at 32% 22%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 8%, transparent 18%),
          radial-gradient(circle at 70% 75%, ${glowColor}15 0%, transparent 35%),
          linear-gradient(160deg, #F0F2F8 0%, #D8DDE8 25%, #B8C0D4 50%, #98A2BC 75%, #7884A4 100%)
        `,
        boxShadow: isHovered
          ? `0 0 0 1px rgba(255,255,255,0.3) inset, 0 0 20px ${glowColor}40, 0 6px 24px rgba(0,0,0,0.25)`
          : `0 0 0 1px rgba(255,255,255,0.2) inset, 0 4px 16px rgba(0,0,0,0.18)`,
        transform: isHovered ? 'rotateX(-6deg) rotateY(8deg) scale(1.02)' : undefined,
        transition: 'transform 0.35s ease, box-shadow 0.35s ease',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Rim light (bottom arc — expression glow reflection) */}
      <div
        className="absolute bottom-0 left-[10%] right-[10%] h-[35%] rounded-b-full pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${glowColor}25, transparent 65%)`,
          filter: 'blur(3px)',
        }}
      />

      {/* Secondary specular highlight */}
      <div
        className="absolute top-[8%] left-[15%] w-[25%] h-[18%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.5), transparent 70%)',
          filter: 'blur(1px)',
        }}
      />

      {/* Face container */}
      <div className="absolute inset-[8%] rounded-full overflow-hidden flex items-center justify-center">
        {children}
      </div>

      {/* Chrome seam ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow:
            'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — SparkyCore
// ════════════════════════════════════════════════════════════════════════════

export function SparkyCore({
  expression = 'idle',
  size = 'md',
  isAnimated = true,
  glowColor: glowColorProp,
  showAura = true,
  className = '',
}: SparkyCoreProps) {
  const cfg = EXPRESSIONS[expression];
  const glowColor = glowColorProp || cfg.glowColor;
  const pixelSize = SIZE_MAP[size];

  // Floating bob animation
  const bobAnimation = useMemo(
    () =>
      isAnimated
        ? {
            y: [0, -5, 0],
          }
        : {},
    [isAnimated]
  );

  const bobTransition = useMemo(
    () =>
      isAnimated
        ? {
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut' as const,
          }
        : {},
    [isAnimated]
  );

  // Breathing scale animation
  const breatheAnimation = useMemo(
    () =>
      isAnimated
        ? {
            scale: [1, 1.015, 1],
          }
        : {},
    [isAnimated]
  );

  const breatheTransition = useMemo(
    () =>
      isAnimated
        ? {
            repeat: Infinity,
            duration: 4,
            ease: 'easeInOut' as const,
          }
        : {},
    [isAnimated]
  );

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: pixelSize, height: pixelSize + 6 }}
    >
      {/* ── Ambient Aura Glow (behind the orb) ── */}
      {showAura && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${glowColor}18 0%, ${glowColor}08 40%, transparent 70%)`,
            transform: 'scale(1.6)',
            filter: 'blur(8px)',
          }}
        />
      )}

      {/* ── Main Orb with Animations ── */}
      <motion.div
        animate={bobAnimation}
        transition={bobTransition}
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Breathing scale wrapper */}
        <motion.div
          animate={breatheAnimation}
          transition={breatheTransition}
          className="relative"
        >
          <SparkyBody glowColor={glowColor} isHovered={false} size={pixelSize}>
            <SparkyFace expression={expression} isHovered={false} />
          </SparkyBody>
        </motion.div>

        {/* ── Antenna ── */}
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[3px] rounded-full"
          style={{
            height: Math.max(4, pixelSize * 0.08),
            background: 'linear-gradient(180deg, #A0A8C0, #707890)',
          }}
        >
          <div
            className="absolute -top-[3px] left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: Math.max(4, pixelSize * 0.065),
              height: Math.max(4, pixelSize * 0.065),
              background: glowColor,
              boxShadow: `0 0 ${pixelSize * 0.08}px ${glowColor}, 0 0 ${pixelSize * 0.15}px ${glowColor}60`,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// Re-export types for convenience
export { EXPRESSIONS };
export type { ExpressionConfig };
