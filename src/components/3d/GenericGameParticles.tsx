// ================================================================
// GENERIC GAME PARTICLES — CSS/Framer Motion Ambient Drift
// ================================================================
// Decision 5.3: 30 non-flagship games share a generic lab-colored
// ambient particle drift background. This component extracts the
// duplicated particle pattern from individual game files into a
// single reusable component.
//
// Usage:
//   <GenericGameParticles color="#00BBFF" />
//   <GenericGameParticles color="#00BBFF" count={20} intensity="high" />
//
// Props:
//   color     - Lab accent color (hex). Used for radial gradient.
//   count     - Number of particles (default: 14). Scaled by intensity.
//   intensity - Particle density: 'off' | 'low' | 'medium' | 'high'
//               Default reads from uiStore (Decision 5.5).
//               Can be overridden per-instance.
//   className - Additional CSS classes for the container.
//
// This is a 2D CSS component (no Three.js / R3F dependency).
// For 3D particle systems (flagship games on desktop), see
// GameParticles3D.tsx (Stage 5 Parts 2-3 v3-FINAL).
// ================================================================

'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';

// ---- Intensity Multipliers (mirrors Decision 5.5) ----
const INTENSITY_MULTIPLIERS: Record<string, number> = {
  off: 0,
  low: 0.5,
  medium: 1.0,
  high: 1.8,
};

// ---- Particle Data Generator ----
interface ParticleData {
  id: number;
  x: number;       // % left position
  y: number;       // % top position
  size: number;    // px diameter
  delay: number;   // animation delay (s)
  duration: number; // animation duration (s)
  drift: number;   // vertical drift distance (px)
  opacity: [number, number, number]; // [start, peak, end] opacity
}

function generateParticles(count: number): ParticleData[] {
  return Array.from({ length: count }, (_, i) => {
    // Deterministic-ish values based on index for SSR consistency
    const seed1 = ((i * 37 + 13) % 100) / 100;
    const seed2 = ((i * 53 + 7) % 100) / 100;
    const seed3 = ((i * 71 + 31) % 100) / 100;
    const seed4 = ((i * 43 + 17) % 100) / 100;
    const seed5 = ((i * 61 + 23) % 100) / 100;
    const seed6 = ((i * 29 + 41) % 100) / 100;
    return {
      id: i,
      x: seed1 * 100,
      y: seed2 * 100,
      size: seed3 * 2.5 + 0.8,
      delay: seed4 * 6,
      duration: seed5 * 7 + 4,
      drift: -(seed6 * 20 + 10),
      opacity: [
        0.08 + seed1 * 0.12,
        0.25 + seed2 * 0.35,
        0.08 + seed3 * 0.12,
      ] as [number, number, number],
    };
  });
}

// ---- Hex to RGBA Helper ----
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length < 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `rgba(0,187,255,${alpha})`; // fallback to primary blue
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---- Props ----
export interface GenericGameParticlesProps {
  /** Lab accent color in hex format (e.g., '#00BBFF') */
  color: string;
  /** Base particle count before intensity scaling (default: 14) */
  count?: number;
  /** Override intensity level. If omitted, uses 'medium' default. */
  intensity?: 'off' | 'low' | 'medium' | 'high';
  /** Additional CSS classes for the container */
  className?: string;
}

// ---- Component ----
export function GenericGameParticles({
  color,
  count = 14,
  intensity = 'medium',
  className = '',
}: GenericGameParticlesProps) {
  const multiplier = INTENSITY_MULTIPLIERS[intensity] ?? 1.0;

  // Generate particles with adjusted count
  const adjustedCount = Math.round(count * multiplier);
  const particles = useMemo(
    () => generateParticles(adjustedCount),
    [adjustedCount]
  );

  // Off = render nothing
  if (multiplier === 0 || adjustedCount === 0) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${hexToRgba(color, 0.5)}, transparent)`,
          }}
          animate={{
            y: [0, p.drift, 0],
            opacity: p.opacity,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ---- Lab Color Registry ----
export const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF',  // Code Lab - blue
  2: '#AA66FF',  // Data Lab - purple
  3: '#FF66AA',  // Neural Lab - pink
  4: '#FFAA44',  // Create Lab - amber
  5: '#00FF88',  // Agent Lab - green
  6: '#FF6644',  // Ethics Lab - red
  7: '#06B6D4',  // Vision Lab - cyan
  8: '#818CF8',  // Language Lab - indigo
  9: '#F97316',  // Build Lab - orange
  10: '#D946EF', // Frontier Lab - fuchsia
};

// ---- Convenience Wrapper ----
export function LabParticles({
  labId,
  count,
  intensity,
  className,
}: {
  labId: number;
  count?: number;
  intensity?: 'off' | 'low' | 'medium' | 'high';
  className?: string;
}) {
  const color = LAB_COLORS[labId] || '#00BBFF';
  return (
    <GenericGameParticles
      color={color}
      count={count}
      intensity={intensity}
      className={className}
    />
  );
}
