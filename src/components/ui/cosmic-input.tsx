'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * CosmicInput — SparkForge v4 Design System
 * ════════════════════════════════════════════
 * A sleek, futuristic input field with glass-morphism styling,
 * animated focus states, and optional icon slots.
 */

export interface CosmicInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Icon or element to display on the left */
  leftIcon?: ReactNode;
  /** Icon or element to display on the right */
  rightIcon?: ReactNode;
  /** Error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Label text */
  label?: string;
}

export const CosmicInput = forwardRef<HTMLInputElement, CosmicInputProps>(
  ({ className, leftIcon, rightIcon, error, errorMessage, label, id, ...props }, ref) => {
    const inputId = id || `cosmic-input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {/* Glow effect container */}
          <div
            className={cn(
              'absolute -inset-0.5 rounded-xl opacity-0 blur-sm transition-opacity duration-300',
              'group-focus-within:opacity-100',
              error
                ? 'bg-gradient-to-r from-red-500/50 to-orange-500/50'
                : 'bg-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-blue/30'
            )}
            aria-hidden="true"
          />

          {/* Input container */}
          <div
            className={cn(
              'relative flex items-center gap-3',
              'bg-surface-card/60 backdrop-blur-md',
              'border rounded-xl',
              'transition-all duration-300',
              error
                ? 'border-red-500/50 focus-within:border-red-500'
                : 'border-white/10 focus-within:border-neon-blue/50',
              leftIcon && 'pl-4',
              rightIcon && 'pr-4'
            )}
          >
            {leftIcon && (
              <span className="flex-shrink-0 text-text-muted">{leftIcon}</span>
            )}

            <input
              ref={ref}
              id={inputId}
              className={cn(
                'flex-1 h-12 px-4 bg-transparent',
                'text-text-primary placeholder:text-text-dim',
                'font-body text-base',
                'focus:outline-none',
                leftIcon && 'pl-0',
                rightIcon && 'pr-0',
                className
              )}
              aria-invalid={error}
              aria-describedby={error && errorMessage ? `${inputId}-error` : undefined}
              {...props}
            />

            {rightIcon && (
              <span className="flex-shrink-0 text-text-muted">{rightIcon}</span>
            )}
          </div>
        </div>

        {error && errorMessage && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-400 mt-1"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

CosmicInput.displayName = 'CosmicInput';
