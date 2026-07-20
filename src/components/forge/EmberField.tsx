'use client';

// ════════════════════════════════════════════════════════════════
// EmberField — Forge F1 (Concept 10 §4.6) — drifting embers
// ════════════════════════════════════════════════════════════════
// 10–14 CSS-keyframed ember dots rising with slight sway. Gated by
// useForgeTier().allowAmbience (FORGE_AMBIENCE flag + reduced-motion
// + tier). Hard caps: ≤14 particles, ≤1 instance per route (caller's
// responsibility, enforced by convention + review).

import { useMemo } from 'react';
import { useForgeTier } from '@/hooks/useForgeTier';

export interface EmberFieldProps {
  className?: string;
}

interface Ember {
  left: number;      // %
  size: number;      // px
  delay: number;     // s
  duration: number;  // s
  sway: number;      // px
  opacity: number;
}

// Deterministic pseudo-random layout (stable across renders/SSR).
function makeEmbers(count: number): Ember[] {
  const embers: Ember[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    embers.push({
      left: 4 + rand() * 92,
      size: 2 + Math.round(rand() * 2),
      delay: rand() * 14,
      duration: 9 + rand() * 8,
      sway: (rand() - 0.5) * 40,
      opacity: 0.35 + rand() * 0.4,
    });
  }
  return embers;
}

export function EmberField({ className = '' }: EmberFieldProps) {
  const { allowAmbience, tier } = useForgeTier();
  const count = tier === 'tablet' ? 8 : 14;
  const embers = useMemo(() => makeEmbers(count), [count]);

  if (!allowAmbience) return null;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {embers.map((e, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            background:
              'radial-gradient(circle, rgb(var(--sf-primary-light) / 1) 0%, rgb(var(--sf-primary) / 0.6) 45%, transparent 75%)',
            ['--ember-opacity' as string]: e.opacity,
            ['--ember-travel' as string]: '72vh',
            ['--ember-sway' as string]: `${e.sway}px`,
            animation: `forge-ember-rise ${e.duration}s linear ${e.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
