'use client';

import { forwardRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Star } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'achievement';

interface SFToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const config: Record<ToastVariant, { icon: React.ReactNode; style: React.CSSProperties }> = {
  success: { icon: <CheckCircle className="w-5 h-5" />, style: { backgroundColor: 'rgba(46,204,113,0.1)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.2)' } },
  error: { icon: <AlertCircle className="w-5 h-5" />, style: { backgroundColor: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.2)' } },
  warning: { icon: <AlertTriangle className="w-5 h-5" />, style: { backgroundColor: 'rgba(255,217,61,0.15)', color: '#B8860B', border: '1px solid rgba(255,217,61,0.3)' } },
  info: { icon: <Info className="w-5 h-5" />, style: { backgroundColor: 'rgba(79,110,247,0.08)', color: '#4F6EF7', border: '1px solid rgba(79,110,247,0.15)' } },
  achievement: { icon: <Star className="w-5 h-5" />, style: { background: 'linear-gradient(135deg, rgba(233,69,245,0.1), rgba(79,110,247,0.1))', color: '#E945F5', border: '1px solid rgba(233,69,245,0.2)' } },
};

export const SFToast = forwardRef<HTMLDivElement, SFToastProps>(
  ({ variant = 'info', title, message, onDismiss, className = '', ...props }, ref) => {
    const c = config[variant];
    return (
      <div ref={ref} className={`flex items-start gap-3 px-4 py-3.5 rounded-sf-lg shadow-sf-lg min-w-[280px] max-w-md ${className}`} style={c.style} {...props}>
        <div className="shrink-0 mt-0.5">{c.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#1A1D2B' }}>{title}</p>
          {message && <p className="text-xs mt-0.5" style={{ color: '#52586E' }}>{message}</p>}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors" aria-label="Dismiss">
            <X className="w-4 h-4" style={{ color: '#8C94AC' }} />
          </button>
        )}
      </div>
    );
  }
);
SFToast.displayName = 'SFToast';
