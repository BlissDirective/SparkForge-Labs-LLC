'use client';

import { forwardRef } from 'react';

type SkeletonVariant = 'text' | 'avatar' | 'card' | 'game-card';

interface SFSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  lines?: number;
}

export const SFSkeleton = forwardRef<HTMLDivElement, SFSkeletonProps>(
  ({ variant = 'text', lines = 1, className = '', ...props }, ref) => {
    const base = 'rounded-sf-md animate-skeleton-shimmer';
    const bg = { background: 'linear-gradient(90deg, #EEF2FA 25%, #F4F6FB 50%, #EEF2FA 75%)', backgroundSize: '200% 100%' };

    if (variant === 'avatar') {
      return <div ref={ref} className={`${base} w-10 h-10 rounded-full ${className}`} style={bg} {...props} />;
    }
    if (variant === 'card') {
      return <div ref={ref} className={`${base} w-full h-32 ${className}`} style={bg} {...props} />;
    }
    if (variant === 'game-card') {
      return (
        <div ref={ref} className={`${base} w-full aspect-[3/4] rounded-sf-lg ${className}`} style={bg} {...props} />
      );
    }
    return (
      <div ref={ref} className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`${base} h-4`} style={{ ...bg, width: i === lines - 1 ? '60%' : '100%' }} />
        ))}
      </div>
    );
  }
);
SFSkeleton.displayName = 'SFSkeleton';
