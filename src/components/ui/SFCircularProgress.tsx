'use client';

import { forwardRef } from 'react';

interface SFCircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export const SFCircularProgress = forwardRef<SVGSVGElement, SFCircularProgressProps>(
  ({ value, max = 100, size = 56, strokeWidth = 4, color = '#4F6EF7', trackColor = '#EEF2FA', children }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const r = (size - strokeWidth) / 2;
    const c = 2 * Math.PI * r;
    const dash = (pct / 100) * c;

    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg ref={ref} width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={c} strokeDashoffset={c - dash} strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
      </div>
    );
  }
);
SFCircularProgress.displayName = 'SFCircularProgress';
