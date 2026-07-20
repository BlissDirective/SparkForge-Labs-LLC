'use client';

// ════════════════════════════════════════════════════════════════
// SparkBurst — Forge F1 (Concept 10 §4.9) — shared celebration burst
// ════════════════════════════════════════════════════════════════
// Fires ≤24 DOM particles once per `fire` increment from `origin`
// (fractions of the parent container). Flash-safe (fade, no strobe),
// aria-hidden, auto-clears. Replaces ad-hoc confetti for small wins;
// canvas-confetti remains ONLY inside the F3 ceremony.

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface SparkBurstProps {
  /** Increment to fire one burst. 0 = never fired. */
  fire: number;
  /** Burst origin as fractions of the container (default center). */
  origin?: { x: number; y: number };
  /** Particle count, capped at 24 (default 16). */
  count?: number;
  className?: string;
}

const COLORS = [
  'rgb(var(--sf-primary) / 1)',
  'rgb(var(--sf-primary-light) / 1)',
  'rgb(var(--sf-secondary) / 1)',
];

export function SparkBurst({
  fire,
  origin = { x: 0.5, y: 0.5 },
  count = 16,
  className = '',
}: SparkBurstProps) {
  const reducedMotion = useReducedMotion();
  const [burst, setBurst] = useState<number | null>(null);
  const lastFire = useRef(fire);

  useEffect(() => {
    if (fire > lastFire.current && !reducedMotion) {
      lastFire.current = fire;
      setBurst(fire);
      const t = setTimeout(() => setBurst(null), 600);
      return () => clearTimeout(t);
    }
    lastFire.current = fire;
  }, [fire, reducedMotion]);

  if (burst === null) return null;

  const n = Math.min(24, Math.max(1, count));

  return (
    <span
      key={burst}
      aria-hidden="true"
      className={`absolute inset-0 overflow-visible pointer-events-none ${className}`}
    >
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${origin.x * 100}%`,
            top: `${origin.y * 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
            ['--spark-angle' as string]: `${(360 / n) * i + (i % 2) * 12}deg`,
            ['--spark-dist' as string]: `${18 + (i % 4) * 8}px`,
            animation: 'forge-spark-fly 520ms ease-out forwards',
          }}
        />
      ))}
    </span>
  );
}
