'use client';

// ═══════════════════════════════════════════════════════════════════
// ShinyText — Animated shine sweep across text
// ═══════════════════════════════════════════════════════════════════
// Phase 4 §10.5: Copy-paste pattern from React Bits / Magic UI — NOT an
// npm package. Used for XP notifications, level-up text, and any surface
// where we want gleaming "shimmer" feedback.
//
// Technique: background-clip: text over a linear-gradient with a moving
// shine band. Pure CSS animation — respects prefers-reduced-motion.
//
// Usage:
//   <ShinyText>+50 XP</ShinyText>
//   <ShinyText duration={2.5} className="font-display text-3xl">
//     Level 5 Unlocked
//   </ShinyText>
// ═══════════════════════════════════════════════════════════════════

import type { ReactNode, CSSProperties } from 'react';
import clsx from 'clsx';

interface ShinyTextProps {
  children: ReactNode;
  /** Shine sweep duration in seconds. Default: 3. */
  duration?: number;
  /** Base text color (visible between shine passes). Default: rgba(255,255,255,0.7). */
  color?: string;
  /** Shine highlight color. Default: rgba(255,255,255,1). */
  shineColor?: string;
  /** Extra classes (font size, weight, etc.) */
  className?: string;
  /** Inline styles (passthrough) */
  style?: CSSProperties;
}

export function ShinyText({
  children,
  duration = 3,
  color = 'rgba(255,255,255,0.7)',
  shineColor = 'rgba(255,255,255,1)',
  className,
  style,
}: ShinyTextProps) {
  return (
    <span
      className={clsx('inline-block bg-clip-text text-transparent', className)}
      style={{
        backgroundImage: `linear-gradient(
          110deg,
          ${color} 0%,
          ${color} 40%,
          ${shineColor} 50%,
          ${color} 60%,
          ${color} 100%
        )`,
        backgroundSize: '250% 100%',
        backgroundPosition: '100% 0',
        animation: `sparkforge-shiny-sweep ${duration}s ease-in-out infinite`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
