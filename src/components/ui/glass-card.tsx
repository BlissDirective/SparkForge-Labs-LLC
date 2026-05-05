'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * GlassCard — SparkForge v4 Design System
 * ════════════════════════════════════════════
 * A beautiful glass-morphism card with gradient borders,
 * animated glow effects, and multiple variants.
 */

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'elevated' | 'bordered' | 'glow';
  /** Gradient border color (for 'glow' variant) */
  glowColor?: 'blue' | 'purple' | 'pink' | 'multi';
  /** Optional header content */
  header?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Hover effect */
  hover?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', glowColor = 'multi', header, footer, hover = false, children, ...props }, ref) => {
    const baseStyles = cn(
      'relative rounded-2xl overflow-hidden',
      'transition-all duration-300 ease-out'
    );

    const variantStyles = {
      default: cn(
        'bg-surface-card/60 backdrop-blur-xl',
        'border border-white/10',
        'shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
      ),
      elevated: cn(
        'bg-gradient-to-br from-surface-elevated/80 to-surface-card/60',
        'backdrop-blur-xl',
        'border border-white/15',
        'shadow-[0_16px_48px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]'
      ),
      bordered: cn(
        'bg-surface-card/40 backdrop-blur-lg',
        'border-2 border-white/10',
        'shadow-[0_4px_24px_rgba(0,0,0,0.2)]'
      ),
      glow: cn(
        'bg-surface-card/70 backdrop-blur-xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
      ),
    };

    const hoverStyles = hover
      ? 'hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] cursor-pointer'
      : '';

    const glowGradients = {
      blue: 'from-neon-blue via-neon-blue/50 to-neon-blue',
      purple: 'from-neon-purple via-neon-purple/50 to-neon-purple',
      pink: 'from-[#FF70AF] via-[#FF70AF]/50 to-[#FF70AF]',
      multi: 'from-neon-blue via-neon-purple to-[#FF70AF]',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], hoverStyles, className)}
        {...props}
      >
        {/* Gradient border for glow variant */}
        {variant === 'glow' && (
          <div
            className={cn(
              'absolute inset-0 rounded-2xl p-[1px]',
              'bg-gradient-to-br opacity-60',
              glowGradients[glowColor]
            )}
            aria-hidden="true"
          >
            <div className="absolute inset-[1px] rounded-2xl bg-surface-card/90" />
          </div>
        )}

        {/* Top edge highlight */}
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden="true"
        />

        {/* Content container */}
        <div className="relative z-10">
          {header && (
            <div className="px-6 py-4 border-b border-white/10">
              {header}
            </div>
          )}

          <div className="p-6">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t border-white/10 bg-black/20">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
