'use client';

import { forwardRef } from 'react';

type ProgressVariant = 'primary' | 'green' | 'purple' | 'custom';

interface SFProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Bar fill color/gradient, used when variant="custom". */
  color?: string;
}

const variantColors: Record<Exclude<ProgressVariant, 'custom'>, string> = {
  primary: 'linear-gradient(90deg, #4F6EF7, #8B9FFF)',
  green: 'linear-gradient(90deg, #2ECC71, #5EE897)',
  purple: 'linear-gradient(90deg, #9B59B6, #C084FC)',
};

export const SFProgressBar = forwardRef<HTMLDivElement, SFProgressBarProps>(
  ({ value, max = 100, variant = 'primary', showLabel = false, size = 'md', className = '', color, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const height = size === 'sm' ? '6px' : size === 'md' ? '10px' : '14px';
    const barBackground = variant === 'custom' ? (color ?? variantColors.primary) : variantColors[variant];

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        <div className="w-full rounded-sf-full overflow-hidden" style={{ height, backgroundColor: '#EEF2FA' }}>
          <div
            className="h-full rounded-sf-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, background: barBackground }}
          />
        </div>
        {showLabel && (
          <p className="text-xs font-medium mt-1 text-right" style={{ color: '#8C94AC', fontFamily: 'var(--font-body)' }}>
            {Math.round(pct)}%
          </p>
        )}
      </div>
    );
  }
);
SFProgressBar.displayName = 'SFProgressBar';
