'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * CosmicButton — SparkForge v4 Design System
 * ════════════════════════════════════════════
 * A visually striking button with gradient glow effects, inspired by
 * futuristic spaceship control panels. Three variants:
 *
 * - primary: Vibrant gradient (cyan→magenta) with animated glow
 * - secondary: Glass-morphism with subtle border glow
 * - ghost: Transparent with hover reveal
 *
 * Size options: sm, md, lg
 */

export interface CosmicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Optional glow color override (CSS color value) */
  glowColor?: string;
  /** Show loading spinner */
  isLoading?: boolean;
}

export const CosmicButton = forwardRef<HTMLButtonElement, CosmicButtonProps>(
  ({ className, variant = 'primary', size = 'md', glowColor, isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      'relative inline-flex items-center justify-center font-body font-semibold',
      'rounded-full transition-all duration-300 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'overflow-hidden'
    );

    const sizeStyles = {
      sm: 'h-9 px-4 text-sm gap-2',
      md: 'h-11 px-6 text-base gap-2',
      lg: 'h-14 px-8 text-lg gap-3',
    };

    const variantStyles = {
      primary: cn(
        'bg-gradient-to-r from-[#00D4FF] via-[#B67BFF] to-[#FF70AF]',
        'text-surface-base font-bold',
        'shadow-[0_0_20px_rgba(0,212,255,0.3),0_0_40px_rgba(182,123,255,0.2)]',
        'hover:shadow-[0_0_30px_rgba(0,212,255,0.5),0_0_60px_rgba(182,123,255,0.3)]',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:ring-neon-blue'
      ),
      secondary: cn(
        'bg-surface-card/80 backdrop-blur-md',
        'border border-white/10',
        'text-text-primary',
        'shadow-[0_0_15px_rgba(0,187,255,0.1)]',
        'hover:bg-surface-elevated/80 hover:border-white/20',
        'hover:shadow-[0_0_25px_rgba(0,187,255,0.2)]',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:ring-neon-purple'
      ),
      ghost: cn(
        'bg-transparent',
        'text-text-secondary',
        'hover:bg-white/5 hover:text-text-primary',
        'active:bg-white/10',
        'focus-visible:ring-white/20'
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        disabled={disabled || isLoading}
        style={glowColor ? { '--cosmic-glow': glowColor } as React.CSSProperties : undefined}
        {...props}
      >
        {/* Animated shine overlay for primary variant */}
        {variant === 'primary' && !disabled && (
          <span
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transform: 'translateX(-100%)',
              animation: 'cosmic-shine 3s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
        )}

        {/* Inner glow ring for secondary variant */}
        {variant === 'secondary' && (
          <span
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,187,255,0.1) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />
        )}

        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

CosmicButton.displayName = 'CosmicButton';
