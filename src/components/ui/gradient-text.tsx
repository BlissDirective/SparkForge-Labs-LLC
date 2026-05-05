'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * GradientText — SparkForge v4 Design System
 * ════════════════════════════════════════════
 * Animated gradient text with multiple preset color combinations.
 */

export interface GradientTextProps {
  children: ReactNode;
  /** Gradient preset */
  gradient?: 'cosmic' | 'sunset' | 'ocean' | 'aurora' | 'lab';
  /** Custom gradient colors (overrides preset) */
  colors?: string[];
  /** Whether to animate the gradient */
  animate?: boolean;
  /** Custom class name */
  className?: string;
  /** HTML element to render */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const gradientPresets = {
  cosmic: ['#00D4FF', '#B67BFF', '#FF70AF'],
  sunset: ['#FF70AF', '#FF9F43', '#FFD93D'],
  ocean: ['#00D4FF', '#00D17A', '#0FB8FA'],
  aurora: ['#00D17A', '#00D4FF', '#B67BFF', '#FF70AF'],
  lab: ['var(--lab-color)', 'color-mix(in srgb, var(--lab-color), white 30%)'],
};

export function GradientText({
  children,
  gradient = 'cosmic',
  colors,
  animate = false,
  className,
  as: Component = 'span',
}: GradientTextProps) {
  const gradientColors = colors || gradientPresets[gradient];
  const gradientString = `linear-gradient(135deg, ${gradientColors.join(', ')})`;

  return (
    <Component
      className={cn(
        'bg-clip-text text-transparent',
        animate && 'animate-gradient-shift',
        className
      )}
      style={{
        backgroundImage: gradientString,
        backgroundSize: animate ? '200% 200%' : '100% 100%',
        ...(animate && {
          animation: 'sparkforge-gradient-shift 4s ease-in-out infinite',
        }),
      }}
    >
      {children}
    </Component>
  );
}
