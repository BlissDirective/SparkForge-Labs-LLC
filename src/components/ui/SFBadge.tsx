'use client';

import { forwardRef } from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'premium' | 'custom';
type BadgeSize = 'sm' | 'md';

interface SFBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { backgroundColor: '#EEF2FA', color: '#52586E' },
  primary: { backgroundColor: 'rgba(79,110,247,0.12)', color: '#4F6EF7' },
  secondary: { backgroundColor: 'rgba(255,107,53,0.12)', color: '#FF6B35' },
  success: { backgroundColor: 'rgba(46,204,113,0.12)', color: '#2ECC71' },
  warning: { backgroundColor: 'rgba(255,217,61,0.2)', color: '#B8860B' },
  info: { backgroundColor: 'rgba(0,210,255,0.12)', color: '#00A8CC' },
  premium: { background: 'linear-gradient(135deg, #E945F5, #4F6EF7)', color: '#FFFFFF' },
  // Fully driven by the caller's `style` prop (color passed inline).
  custom: {},
};

export const SFBadge = forwardRef<HTMLSpanElement, SFBadgeProps>(
  ({ variant = 'default', size = 'sm', dot = false, children, className = '', style, ...props }, ref) => (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1.5 font-medium font-body rounded-sf-full ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
);
SFBadge.displayName = 'SFBadge';
