'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MarqueeProps {
  children: React.ReactNode;
  /** Seconds per full loop. */
  speed?: number;
  pauseOnHover?: boolean;
  reverse?: boolean;
  className?: string;
}

const STYLE_ID = 'sf-marquee-keyframes';
const GAP = 24;

/**
 * Marquee — seamless horizontal loop strip.
 *
 * Children are rendered twice inside an overflow-hidden flex row that
 * translates to -50% infinitely. Each copy carries a trailing padding equal
 * to the inner gap, so the halfway point of the track lines up exactly with
 * the start of the second copy (no seam). Keyframes are injected once at
 * document level (same pattern as MetallicPaint).
 *
 * Reduced motion: a static row, scrollable with overflow-x auto.
 */
export default function Marquee({
  children,
  speed = 30,
  pauseOnHover = true,
  reverse = false,
  className = '',
}: MarqueeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '@keyframes sf-marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }';
    document.head.appendChild(style);
  }, []);

  const copyStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: GAP,
    paddingRight: GAP,
  };

  if (prefersReducedMotion) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <div style={copyStyle}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden ${className}`}
      onMouseEnter={pauseOnHover ? () => setPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setPaused(false) : undefined}
    >
      <div
        className="flex w-max"
        style={{
          animation: `sf-marquee-scroll ${speed}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        <div style={copyStyle}>{children}</div>
        <div style={copyStyle} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
