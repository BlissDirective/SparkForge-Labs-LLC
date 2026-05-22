'use client';

import { forwardRef } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';
type CardPadding = 'sm' | 'md' | 'lg';

interface SFCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  clickable?: boolean;
  selected?: boolean;
}

export const SFCard = forwardRef<HTMLDivElement, SFCardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      clickable = false,
      selected = false,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    };

    const variantClasses: Record<CardVariant, string> = {
      default: 'bg-white shadow-sf-card border border-sf-border/50',
      elevated: 'bg-white shadow-sf-md border border-sf-border/30',
      outlined: 'bg-transparent border-2 border-sf-border',
      interactive: 'bg-white shadow-sf-card border border-sf-border/50 cursor-pointer hover:shadow-sf-card-hover hover:-translate-y-1',
    };

    return (
      <div
        ref={ref}
        className={`
          rounded-sf-lg
          transition-all duration-250
          ${paddingClasses[padding]}
          ${variantClasses[variant]}
          ${selected ? 'ring-2 ring-sf-primary ring-offset-2' : ''}
          ${clickable || variant === 'interactive' ? 'cursor-pointer' : ''}
          ${className}
        `}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SFCard.displayName = 'SFCard';
