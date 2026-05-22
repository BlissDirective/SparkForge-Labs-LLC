'use client';

import { useMemo } from 'react';

/**
 * AmbientParticles — Pure CSS floating particles for backgrounds.
 * No canvas, no JS animation — purely CSS keyframes for maximum
 * performance. Creates a subtle ambient floating effect perfect
 * for login/signup pages.
 */
export default function AmbientParticles({
  count = 25,
  color = '#4F6EF7',
  className = '',
}: {
  count?: number;
  color?: string;
  className?: string;
}) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 53 + 7) % 100}%`,
      size: 2 + (i % 4) * 1.5,
      duration: 8 + (i % 7) * 3,
      delay: (i * 0.7) % 12,
      opacity: 0.15 + (i % 5) * 0.06,
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 3}px ${p.size}px ${color}30`,
            animation: `ambientFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes ambientFloat {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-20px) translateX(10px) scale(1.2); }
          50% { transform: translateY(-10px) translateX(-15px) scale(0.8); }
          75% { transform: translateY(-30px) translateX(5px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
