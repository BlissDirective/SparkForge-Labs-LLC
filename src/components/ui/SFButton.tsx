// ════════════════════════════════════════════════════════════════
// SFButton — SparkForge Design System Button
// ════════════════════════════════════════════════════════════════
// Variants: primary, secondary, outline, ghost, danger
// Sizes: sm, md, lg, xl
// Shapes: default (rounded-sf-md), pill (rounded-sf-full), square

'use client';

import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonShape = 'default' | 'pill' | 'square';

interface SFButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#4F6EF7',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(79,110,247,0.3)',
  },
  secondary: {
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(255,107,53,0.25)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#4F6EF7',
    border: '2px solid #4F6EF7',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#52586E',
  },
  danger: {
    backgroundColor: '#FF5252',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(255,82,82,0.25)',
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
  xl: 'px-8 py-4 text-lg gap-3',
};

const shapeClasses: Record<ButtonShape, string> = {
  default: 'rounded-sf-md',
  pill: 'rounded-sf-full',
  square: 'rounded-sf-sm',
};

export const SFButton = forwardRef<HTMLButtonElement, SFButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      shape = 'default',
      leftIcon,
      rightIcon,
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          font-semibold font-body
          transition-all duration-200
          ${shapeClasses[shape]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.97]'}
          ${className}
        `}
        style={{
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

SFButton.displayName = 'SFButton';
