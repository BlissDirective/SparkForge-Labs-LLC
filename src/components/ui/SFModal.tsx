'use client';

import { forwardRef, useEffect } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface SFModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function SFModal({ open, onClose, title, size = 'md', children, footer, showClose = true }: SFModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) { document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-sf-xl shadow-sf-xl max-h-[90vh] flex flex-col`}>
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#EEF2FA' }}>
            {title && <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>{title}</h3>}
            {showClose && (
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto" aria-label="Close">
                <X className="w-5 h-5" style={{ color: '#8C94AC' }} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t" style={{ borderColor: '#EEF2FA' }}>{footer}</div>}
      </div>
    </div>
  );
}
