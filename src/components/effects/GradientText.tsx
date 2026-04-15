'use client';

// ═══════════════════════════════════════════════════════════════════
// GradientText — Animated multi-stop gradient text
// ═══════════════════════════════════════════════════════════════════
// Phase 4 §10.5: Copy-paste pattern from React Bits / Magic UI. Used
// for lab names in HolographicLabMap, hero taglines, and any headline
// where we want an animated rainbow-style gradient.
//
// Technique: background-clip: text over a conic/linear gradient with
// animated background-position. The gradient uses Frost-Prismatic lab
// accent colors by default.
//
// Usage:
//   <GradientText>The AI Lab</GradientText>
//   <GradientText colors={['#00BBFF','#AA66FF','#FF66AA']}>
//     Welcome back
//   </GradientText>
// ═══════════════════════════════════════════════════════════════════

import type { ReactNode, CSSProperties } from 'react';
import clsx from 'clsx';

interface GradientTextProps {
  children: ReactNode;
  /** Gradient color stops. Default: Frost-Prismatic primary cycle. */
  colors?: string[];
  /** Animation duration in seconds. Default: 8. */
  duration?: number;
  /** Gradient direction in degrees. Default: 110. */
  angle?: number;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_COLORS = [
  '#00BBFF', // blue (primary)
  '#AA66FF', // purple
  '#00FF88', // green
  '#FFAA44', // amber
  '#00BBFF', // loop back to blue
];

export function GradientText({
  children,
  colors = DEFAULT_COLORS,
  duration = 8,
  angle = 110,
  className,
  style,
}: GradientTextProps) {
  const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`;

  return (
    <span
      className={clsx('inline-block bg-clip-text text-transparent', className)}
      style={{
        backgroundImage: gradient,
        backgroundSize: '300% 100%',
        animation: `sparkforge-gradient-shift ${duration}s ease infinite`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
