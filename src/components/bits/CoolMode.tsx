'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  shape: 'circle' | 'star';
  hueJitter: number;
  life: number;
}

interface Pulse {
  id: number;
  x: number;
  y: number;
}

interface CoolModeProps {
  children: React.ReactNode;
  color?: string;
  disabled?: boolean;
  className?: string;
}

const STAR_CLIP =
  'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';

/**
 * CoolMode — tap-feedback wrapper (replaces ClickSpark). On click/tap it
 * spawns 8-14 small particles (circles plus a few stars) from the click
 * point that pop outward with spring physics and fade over 600-900ms.
 * Reduced motion swaps in a single quick opacity pulse. Timers are
 * cleaned up on unmount.
 */
export default function CoolMode({
  children,
  color = '#4DE9FF',
  disabled = false,
  className = '',
}: CoolModeProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [pulses, setPulses] = useState<Pulse[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timersRef.current.delete(t);
      fn();
    }, ms);
    timersRef.current.add(t);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (prefersReducedMotion) {
        const id = ++idRef.current;
        setPulses((prev) => [...prev, { id, x, y }]);
        schedule(() => setPulses((prev) => prev.filter((p) => p.id !== id)), 320);
        return;
      }

      const count = 8 + Math.floor(Math.random() * 7); // 8-14
      const starCount = 2 + Math.floor(Math.random() * 2); // 2-3
      const batch: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const distance = 34 + Math.random() * 40;
        batch.push({
          id: ++idRef.current,
          x,
          y,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          size: 5 + Math.random() * 5,
          shape: i < starCount ? 'star' : 'circle',
          hueJitter: (Math.random() - 0.5) * 40,
          life: 0.6 + Math.random() * 0.3, // 600-900ms
        });
      }
      setParticles((prev) => [...prev, ...batch]);
      const ids = new Set(batch.map((p) => p.id));
      schedule(() => setParticles((prev) => prev.filter((p) => !ids.has(p.id))), 950);
    },
    [disabled, prefersReducedMotion, schedule],
  );

  return (
    <div ref={containerRef} onClick={handleClick} className={`relative ${className}`}>
      {children}

      {/* Particle layer — overflow intentionally visible */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: 50 }}>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              backgroundColor: color,
              borderRadius: p.shape === 'circle' ? '50%' : 0,
              clipPath: p.shape === 'star' ? STAR_CLIP : undefined,
              filter: `hue-rotate(${p.hueJitter}deg)`,
              boxShadow: p.shape === 'circle' ? `0 0 ${p.size}px ${color}80` : undefined,
            }}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
            animate={{ x: p.dx, y: p.dy, scale: 1, opacity: 0, rotate: p.shape === 'star' ? 120 : 0 }}
            transition={{
              x: { type: 'spring', stiffness: 160, damping: 14 },
              y: { type: 'spring', stiffness: 160, damping: 14 },
              scale: { type: 'spring', stiffness: 260, damping: 18 },
              opacity: { duration: p.life, ease: 'easeOut' },
              rotate: { duration: p.life, ease: 'easeOut' },
            }}
          />
        ))}

        {/* Reduced-motion fallback: quick opacity pulse at click point */}
        {pulses.map((pulse) => (
          <span
            key={pulse.id}
            className="absolute rounded-full"
            style={{
              left: pulse.x,
              top: pulse.y,
              width: 28,
              height: 28,
              marginLeft: -14,
              marginTop: -14,
              backgroundColor: `${color}55`,
              animation: 'sf-coolmode-pulse 0.3s ease-out forwards',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes sf-coolmode-pulse {
          0% { opacity: 0; }
          40% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
