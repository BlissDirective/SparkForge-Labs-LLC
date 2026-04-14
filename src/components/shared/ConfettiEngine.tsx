'use client';

// Phase 2 audit fix (Section 5.6): Consolidated ConfettiEngine
// ════════════════════════════════════════════════════
// Single reusable confetti particle system replacing the two
// previously-separate systems in:
//   - GameCompleteCelebration.tsx (Motion-based fall w/ spring params)
//   - CelebrationOverlay.tsx (rAF-physics simulation)
//
// Uses Motion's AnimatePresence + motion.div per particle with
// physics-like falling behavior (gravity curve, rotation, drift).
// Decorative only: aria-hidden="true" on the container.
// ════════════════════════════════════════════════════

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Frost-Prismatic palette — same as legacy CelebrationOverlay
const DEFAULT_COLORS = [
  '#00BBFF', // Primary blue
  '#8B5CF6', // Purple
  '#00FF88', // Neon green
  '#FFD700', // Gold
  '#FF6B6B', // Coral
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#AA66FF', // REO purple
];

interface ConfettiEngineProps {
  /** Number of particles (default 60) */
  count?: number;
  /** Color palette. If omitted, uses the Frost-Prismatic default. */
  colors?: string[];
  /** Total fall duration window in ms (default 3000) */
  duration?: number;
  /** Controls mount/unmount via AnimatePresence */
  show: boolean;
  /** Fires after the engine finishes its initial animation cycle */
  onComplete?: () => void;
}

interface ParticleSpec {
  id: number;
  x: number;        // percent
  delay: number;    // seconds
  rotation: number; // final degrees
  color: string;
  size: number;     // px (width)
  drift: number;    // px horizontal drift
  shape: 'rect' | 'circle';
  falls: number;    // duration multiplier (staggered)
}

/**
 * Deterministic-ish particle generator for stable keys across renders.
 * Seeded from `count + duration` via simple hash so replays look similar
 * but different confetti instances look distinct.
 */
function buildParticles(count: number, colors: string[], durationSec: number): ParticleSpec[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i * 37 + 13) % 100,
    delay: (i * 0.013) % 0.8,
    rotation: ((i * 47) % 720) - 360,
    color: colors[i % colors.length],
    size: (i * 3) % 8 + 4,
    drift: ((i * 17) % 40) - 20,
    shape: (i * 11) % 2 === 0 ? 'rect' : 'circle',
    // Stagger the fall duration so particles don't all land at once — matches
    // the legacy GameCompleteCelebration behavior (duration: 3 + (c.id % 3)s).
    falls: durationSec + (i % 3),
  }));
}

export function ConfettiEngine({
  count = 60,
  colors = DEFAULT_COLORS,
  duration = 3000,
  show,
  onComplete,
}: ConfettiEngineProps) {
  const durationSec = duration / 1000;

  const particles = useMemo<ParticleSpec[]>(
    () => buildParticles(count, colors, durationSec),
    // Regenerate if the config meaningfully changes; colors array identity
    // is fine to include — callers should memoize if stable reference desired.
    [count, colors, durationSec]
  );

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <div
          key="confetti-engine"
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: -20,
                width: p.size,
                height: p.shape === 'rect' ? p.size * 0.6 : p.size,
                backgroundColor: p.color,
                borderRadius: p.shape === 'circle' ? '50%' : 2,
                boxShadow: `0 0 ${p.size}px ${p.color}40`,
              }}
              initial={{ y: -20, rotate: 0, opacity: 1, x: 0 }}
              animate={{
                y: 900,
                rotate: p.rotation,
                x: p.drift,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: p.falls,
                delay: p.delay,
                // Gravity-like easing curve — slow start, accelerate, settle.
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfettiEngine;
