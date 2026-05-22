'use client';

import { forwardRef } from 'react';
import { X } from 'lucide-react';

interface SFInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  error?: string;
  helper?: string;
}

export const SFInput = forwardRef<HTMLInputElement, SFInputProps>(
  ({ label, leftIcon, rightIcon, clearable, onClear, error, helper, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1D2B', fontFamily: 'var(--font-body)' }}>{label}</label>}
        <div className="relative flex items-center">
          {leftIcon && <span className="absolute left-3.5" style={{ color: '#8C94AC' }}>{leftIcon}</span>}
          <input
            ref={ref}
            className={`
              w-full rounded-sf-md border text-sm font-body
              transition-all duration-200
              placeholder:text-sf-text-muted
              focus:outline-none focus:ring-2 focus:ring-sf-primary/20 focus:border-sf-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : 'px-4'} ${(rightIcon || clearable) ? 'pr-10' : 'pr-4'}
              py-2.5
              ${error ? 'border-sf-accent-red' : 'border-sf-border'}
              ${className}
            `}
            style={{ backgroundColor: '#FFFFFF', color: '#1A1D2B' }}
            {...props}
          />
          {clearable && props.value && (
            <button onClick={onClear} className="absolute right-3.5 p-0.5 rounded hover:bg-gray-100" aria-label="Clear">
              <X className="w-4 h-4" style={{ color: '#8C94AC' }} />
            </button>
          )}
          {!clearable && rightIcon && <span className="absolute right-3.5" style={{ color: '#8C94AC' }}>{rightIcon}</span>}
        </div>
        {error && <p className="text-xs mt-1.5 font-medium" style={{ color: '#FF5252' }}>{error}</p>}
        {helper && !error && <p className="text-xs mt-1.5" style={{ color: '#8C94AC' }}>{helper}</p>}
      </div>
    );
  }
);
SFInput.displayName = 'SFInput';
