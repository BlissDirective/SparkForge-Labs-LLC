'use client';

import { useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AuroraGalaxyProps {
  /** Overall visual strength, 0-1. Scales blob + star opacity. */
  intensity?: number;
  className?: string;
}

/** Deterministic LCG so star positions match between server and client
 *  (no Math.random at render time → no hydration mismatch). */
function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const STAR_SEED = 20260702;
const STAR_COUNT = 56;

/**
 * AuroraGalaxy — the merged marketing-dark background (GalaxyBackground +
 * Aurora unified). Three large slow-drifting aurora blobs (cyan + violet)
 * over a deep #0A0F1E base, plus a sparse static star field with seeded
 * deterministic positions. Pure CSS/DOM — no WebGL, no canvas.
 * Reduced motion keeps the blobs static.
 */
export default function AuroraGalaxy({ intensity = 0.7, className = '' }: AuroraGalaxyProps) {
  const prefersReducedMotion = useReducedMotion();
  const level = Math.min(1, Math.max(0, intensity));

  const stars = useMemo(() => {
    const rand = lcg(STAR_SEED);
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      left: `${(rand() * 100).toFixed(2)}%`,
      top: `${(rand() * 100).toFixed(2)}%`,
      size: rand() > 0.7 ? 2 : 1,
      opacity: 0.25 + rand() * 0.5,
    }));
  }, []);

  const blobs = [
    {
      id: 'aurora-cyan',
      color: '#4DE9FF',
      width: '52%',
      height: '46%',
      left: '-8%',
      top: '-12%',
      duration: '22s',
      animation: 'sf-aurora-drift-a',
      opacity: 0.5,
    },
    {
      id: 'aurora-violet',
      color: '#7A5CFF',
      width: '58%',
      height: '52%',
      right: '-12%',
      top: '18%',
      duration: '28s',
      animation: 'sf-aurora-drift-b',
      opacity: 0.45,
    },
    {
      id: 'aurora-cyan-low',
      color: '#4DE9FF',
      width: '46%',
      height: '40%',
      left: '22%',
      bottom: '-16%',
      duration: '19s',
      animation: 'sf-aurora-drift-c',
      opacity: 0.35,
    },
  ] as const;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ backgroundColor: '#0A0F1E' }}
    >
      {/* Aurora blobs */}
      {blobs.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full"
          style={{
            width: b.width,
            height: b.height,
            left: 'left' in b ? b.left : undefined,
            right: 'right' in b ? b.right : undefined,
            top: 'top' in b ? b.top : undefined,
            bottom: 'bottom' in b ? b.bottom : undefined,
            background: `radial-gradient(ellipse at center, ${b.color} 0%, transparent 70%)`,
            filter: 'blur(90px)',
            opacity: b.opacity * level,
            animation: prefersReducedMotion
              ? 'none'
              : `${b.animation} ${b.duration} ease-in-out infinite alternate`,
            willChange: prefersReducedMotion ? undefined : 'transform',
          }}
        />
      ))}

      {/* Static star field — seeded, deterministic */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            backgroundColor: '#FFFFFF',
            opacity: s.opacity * (0.4 + level * 0.6),
          }}
        />
      ))}

      <style>{`
        @keyframes sf-aurora-drift-a {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(9%, 12%) scale(1.12); }
        }
        @keyframes sf-aurora-drift-b {
          from { transform: translate(0, 0) scale(1.08); }
          to { transform: translate(-11%, -8%) scale(0.96); }
        }
        @keyframes sf-aurora-drift-c {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(-7%, -10%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
