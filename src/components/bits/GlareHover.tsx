'use client';

import { useCallback, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface GlareHoverProps {
  children: React.ReactNode;
  className?: string;
  /** Border-glow color on hover / focus-within. */
  glowColor?: string;
  /** Border radius in px, preserved on the wrapper and glare layer. */
  radius?: number;
}

/**
 * GlareHover — card wrapper. On pointer (mouse/pen) hover, a chrome glare
 * band sweeps diagonally across the card while a soft border-glow fades in.
 * Touch devices and reduced-motion users get no sweep; keyboard users get
 * a gentle border-glow on focus-within.
 */
export default function GlareHover({
  children,
  className = '',
  glowColor = '#4F6EF7',
  radius = 16,
}: GlareHoverProps) {
  const prefersReducedMotion = useReducedMotion();
  // Incrementing key restarts the sweep animation on each hover entry.
  const [sweepKey, setSweepKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'touch') return;
      setHovered(true);
      if (!prefersReducedMotion) setSweepKey((k) => k + 1);
    },
    [prefersReducedMotion],
  );

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    setHovered(false);
  }, []);

  const glowing = hovered || focused;

  return (
    <div
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      className={`relative overflow-hidden transition-shadow duration-300 ${className}`}
      style={{
        borderRadius: radius,
        boxShadow: glowing
          ? `0 0 0 1px ${glowColor}66, 0 0 24px ${glowColor}40`
          : `0 0 0 1px transparent`,
      }}
    >
      {children}

      {/* Chrome glare sweep */}
      {!prefersReducedMotion && sweepKey > 0 && (
        <div
          key={sweepKey}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: radius }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 48%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.22) 52%, transparent 62%)',
              animation: 'sf-glare-sweep 0.7s ease-in-out forwards',
              willChange: 'transform',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes sf-glare-sweep {
          from { transform: translateX(-120%); }
          to { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}
