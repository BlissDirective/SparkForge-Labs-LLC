'use client';

import { motion } from 'motion/react';

interface OrbitalRingProps {
  size?: number;
  color?: string;
  orbitCount?: number;
  speed?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * OrbitalRing — Animated concentric orbital rings around a central element.
 * Creates a planetary orbit effect with rotating dashed rings at varying
 * speeds and angles. Perfect for lab orbs and game icons in the Cosmic
 * Orbit design. Meshes with GalaxyBackground for a cohesive space theme.
 */
export default function OrbitalRing({
  size = 160,
  color = '#4F6EF7',
  orbitCount = 2,
  speed = 20,
  children,
  className = '',
}: OrbitalRingProps) {
  const rings = Array.from({ length: orbitCount }, (_, i) => {
    const ringSize = size + (i + 1) * 24;
    const isEven = i % 2 === 0;
    return {
      id: i,
      size: ringSize,
      duration: speed + i * 6,
      direction: isEven ? 360 : -360,
      opacity: 0.25 - i * 0.06,
      dashArray: `${8 + i * 4} ${12 + i * 6}`,
      strokeWidth: 1 + i * 0.4,
    };
  });

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size + orbitCount * 24 + 10, height: size + orbitCount * 24 + 10 }}
    >
      {/* Orbital rings rendered as SVG */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        viewBox={`0 0 ${size + orbitCount * 24 + 10} ${size + orbitCount * 24 + 10}`}
      >
        {rings.map((ring) => {
          const cx = (size + orbitCount * 24 + 10) / 2;
          const cy = (size + orbitCount * 24 + 10) / 2;
          const r = ring.size / 2;
          return (
            <motion.ellipse
              key={ring.id}
              cx={cx}
              cy={cy}
              rx={r}
              ry={r * 0.65}
              fill="none"
              stroke={color}
              strokeWidth={ring.strokeWidth}
              strokeDasharray={ring.dashArray}
              strokeLinecap="round"
              opacity={ring.opacity}
              initial={{ rotate: 0 }}
              animate={{ rotate: ring.direction }}
              transition={{
                duration: ring.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
