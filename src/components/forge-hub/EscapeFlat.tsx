'use client';

/**
 * EscapeFlat — TAP W2 / OVERLAY-CRIT-001.
 * Full-viewport 2D overlay for parent, billing, security, legal, admin.
 * Portaled to document.body so no forge transform/filter wrapper can
 * become the containing block for position:fixed.
 */

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import { HOLO_BLEND_CSS_VARS } from '@/lib/forge-hub/holoBlend';

export interface EscapeFlatProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export function EscapeFlat({
  open,
  onClose,
  title = 'Parent space',
  children,
}: EscapeFlatProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const overlay = (
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: false,
        fallbackFocus: '#forge-hub-escape-back',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forge-hub-escape-title"
        data-testid="forge-hub-escape-flat"
        data-overlay-crit="001"
        className="fh-escape-flat"
        style={{
          ...HOLO_BLEND_CSS_VARS,
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          // OVERLAY-CRIT-001: never filter / transform / backdrop-filter
          // on this overlay shell (would retarget position:fixed).
          filter: 'none',
          transform: 'none',
          backdropFilter: 'none',
        }}
      >
        <div className="fh-escape-flat__plate">
          <header className="fh-escape-flat__head">
            <h2 id="forge-hub-escape-title">{title}</h2>
            <button
              id="forge-hub-escape-back"
              type="button"
              data-testid="forge-hub-escape-back"
              className="fh-escape-flat__back"
              onClick={onClose}
            >
              Back to forge
            </button>
          </header>
          <div className="fh-escape-flat__body">
            {children ?? (
              <p>
                Parent, billing, security, and legal screens use this flat
                overlay. The forge stage stays mounted and paused behind it.
              </p>
            )}
          </div>
        </div>
      </div>
    </FocusTrap>
  );

  return createPortal(overlay, document.body);
}
