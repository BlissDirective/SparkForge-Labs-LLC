'use client';

// ════════════════════════════════════════════════════════════════
// ForgeButton — Forge F1 (Concept 10 §4.2) — forge-press interaction
// ════════════════════════════════════════════════════════════════
// Real <button> (native semantics preserved). Press compresses with
// heat-glow; release springs back; activation fires a ≤8-particle
// spark burst (CSS keyframes, aria-hidden, throttled to 1/300ms,
// skipped under reduced-motion).

import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ButtonHTMLAttributes } from 'react';

export interface ForgeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'molten' | 'alloy' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Spark burst on activation (default true). */
  sparks?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<ForgeButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

const SPARK_COUNT = 8;

export function ForgeButton({
  variant = 'molten',
  size = 'md',
  sparks = true,
  className = '',
  onClick,
  children,
  disabled,
  ...rest
}: ForgeButtonProps) {
  const reducedMotion = useReducedMotion();
  const [burstKey, setBurstKey] = useState(0);
  const lastBurst = useRef(0);
  const [pressed, setPressed] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (sparks && !reducedMotion) {
        const now = Date.now();
        if (now - lastBurst.current > 300) {
          lastBurst.current = now;
          setBurstKey((k) => k + 1);
        }
      }
      onClick?.(e);
    },
    [onClick, sparks, reducedMotion]
  );

  const variantStyle: React.CSSProperties = {};
  let variantClass = '';
  switch (variant) {
    case 'molten':
      variantClass = 'forge-molten-fill forge-anim';
      variantStyle.color = 'rgb(var(--sf-text-inverse) / 1)';
      break;
    case 'alloy':
      variantStyle.backgroundColor = 'rgb(var(--sf-surface-elevated) / 1)';
      variantStyle.border = '1px solid rgb(var(--sf-border) / 1)';
      variantStyle.color = 'rgb(var(--sf-text-primary) / 1)';
      break;
    case 'ghost':
      variantStyle.backgroundColor = 'transparent';
      variantStyle.color = 'rgb(var(--sf-text-secondary) / 1)';
      break;
    case 'danger':
      variantStyle.backgroundColor = 'rgb(var(--sf-accent-red) / 0.15)';
      variantStyle.border = '1px solid rgb(var(--sf-accent-red) / 0.4)';
      variantStyle.color = 'rgb(var(--sf-accent-red) / 1)';
      break;
  }

  return (
    <button
      type="button"
      {...rest}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') setPressed(true);
        rest.onKeyDown?.(e);
      }}
      onKeyUp={(e) => {
        setPressed(false);
        rest.onKeyUp?.(e);
      }}
      className={[
        'relative inline-flex items-center justify-center gap-2 font-display font-semibold select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        SIZE_CLASSES[size],
        variantClass,
        className,
      ].join(' ')}
      style={{
        ...variantStyle,
        outlineColor: 'rgb(var(--sf-border-focus) / 1)',
        transform: pressed && !reducedMotion ? 'scale(0.96)' : 'scale(1)',
        filter: pressed && !reducedMotion ? 'brightness(1.15)' : undefined,
        transition: pressed
          ? 'transform var(--forge-press, 90ms), filter var(--forge-press, 90ms)'
          : 'transform var(--forge-release, 260ms), filter var(--forge-release, 260ms)',
      }}
    >
      {children}
      {burstKey > 0 && (
        <span key={burstKey} aria-hidden="true" className="absolute inset-0 overflow-visible pointer-events-none">
          {Array.from({ length: SPARK_COUNT }, (_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full"
              style={{
                backgroundColor: i % 3 === 0 ? 'rgb(var(--sf-primary-light) / 1)' : 'rgb(var(--sf-primary) / 1)',
                ['--spark-angle' as string]: `${(360 / SPARK_COUNT) * i + 10}deg`,
                ['--spark-dist' as string]: `${14 + (i % 3) * 5}px`,
                animation: 'forge-spark-fly 380ms ease-out forwards',
              }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
