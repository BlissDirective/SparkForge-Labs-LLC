'use client';

// ════════════════════════════════════════════════════════════════
// ConfirmDialog — UX-MED-006 (Opt A)
// ════════════════════════════════════════════════════════════════
// Reusable portal-based confirmation dialog with:
//   - focus-trap (focus-trap-react already in deps)
//   - Escape-to-cancel
//   - Optional overlay-click-to-cancel (default: true)
//   - Optional type-to-confirm guard for irreversible actions
//   - Danger variant styling for destructive flows
//
// WCAG: role="alertdialog", aria-labelledby/describedby,
// aria-modal, initial focus trapped within the dialog, focus
// restored to the invoker on close.
//
// Not the same thing as DowngradeConfirmModal (that's a domain-
// specific flow for subscription tier changes). ConfirmDialog is
// the generic primitive wired into delete-account, child profile
// archive, and any future destructive actions.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  /** Whether the dialog is currently rendered. */
  isOpen: boolean;
  /** Called when the user dismisses without confirming (cancel button, Escape, overlay click). */
  onCancel: () => void;
  /** Called when the user confirms. async or sync. If async, pass `isBusy` to keep the button disabled during the pending call. */
  onConfirm: () => void | Promise<void>;
  /** Title shown at the top of the dialog. */
  title: string;
  /** Body copy / JSX (can include warning lists). */
  message: ReactNode;
  /** Confirm button label. Default: 'Confirm'. */
  confirmLabel?: string;
  /** Cancel button label. Default: 'Cancel'. */
  cancelLabel?: string;
  /** Visual variant. `danger` turns the confirm button red. */
  variant?: 'default' | 'danger';
  /**
   * If provided, the user must type this exact string into a
   * confirmation field for the confirm button to enable. Used for
   * truly irreversible actions (delete account, delete child profile).
   * The match is case-sensitive so 'delete' won't satisfy 'DELETE'.
   */
  requireType?: string;
  /** When true, overlay click does NOT cancel. Use for critical flows. */
  lockOverlay?: boolean;
  /** When true, Cancel button is hidden (e.g. fatal errors). Default: false. */
  hideCancel?: boolean;
  /** Disable the confirm button externally (e.g. during an in-flight mutation). */
  isBusy?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  requireType,
  lockOverlay = false,
  hideCancel = false,
  isBusy = false,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Portal target — only available client-side.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset typed value whenever the dialog opens
  useEffect(() => {
    if (isOpen) setTypedValue('');
  }, [isOpen]);

  // Escape key closes (unless busy)
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isBusy) {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isBusy, onCancel]);

  const typeMatches = !requireType || typedValue === requireType;
  const canConfirm = typeMatches && !isBusy;

  const confirmBgClass =
    variant === 'danger'
      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 focus-visible:ring-red-400'
      : 'bg-gradient-to-r from-spark-blue to-spark-purple hover:opacity-90 focus-visible:ring-spark-blue';

  const headerIconClass =
    variant === 'danger' ? 'text-red-400' : 'text-spark-blue';

  if (!mounted || !isOpen) return null;

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <FocusTrap
          active
          focusTrapOptions={{
            allowOutsideClick: true,
            clickOutsideDeactivates: false,
            escapeDeactivates: false,
            // Fallback guarantees a tabbable target exists even when
            // every action button is disabled (e.g. during isBusy) —
            // the dialog container itself becomes the focus target.
            fallbackFocus: () => dialogRef.current ?? document.body,
            initialFocus: () => {
              if (requireType) {
                return (
                  dialogRef.current?.querySelector<HTMLInputElement>(
                    'input[data-confirm-type]',
                  ) ?? false
                );
              }
              return (
                dialogRef.current?.querySelector<HTMLButtonElement>(
                  'button[data-confirm-cancel]',
                ) ?? false
              );
            },
            returnFocusOnDeactivate: true,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (
                !lockOverlay &&
                !isBusy &&
                e.target === e.currentTarget
              ) {
                onCancel();
              }
            }}
          >
            <motion.div
              ref={dialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-desc"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-card/95 shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-3 p-6 pb-4">
                <div
                  className={`flex-shrink-0 mt-0.5 ${headerIconClass}`}
                  aria-hidden="true"
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    id="confirm-dialog-title"
                    className="font-display text-lg font-bold text-white leading-tight"
                  >
                    {title}
                  </h2>
                </div>
                {!hideCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isBusy}
                    aria-label="Close"
                    className="flex-shrink-0 -m-1 p-1 rounded-md text-white/40 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div
                id="confirm-dialog-desc"
                className="px-6 pb-5 font-body text-sm text-white/75 leading-relaxed"
              >
                {message}
              </div>

              {/* Type-to-confirm input */}
              {requireType && (
                <div className="px-6 pb-5">
                  <label className="block text-xs font-body text-white/55 mb-2">
                    Type{' '}
                    <span className="font-mono text-white/85">
                      {requireType}
                    </span>{' '}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={typedValue}
                    onChange={(e) => setTypedValue(e.target.value)}
                    data-confirm-type
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-lg bg-surface-deep border border-white/15 px-3 py-2 font-mono text-sm text-white placeholder-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spark-blue focus-visible:border-spark-blue"
                    placeholder={requireType}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-6 pt-2 border-t border-white/5 rounded-b-2xl">
                {!hideCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isBusy}
                    data-confirm-cancel
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 font-display text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancelLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (canConfirm) void onConfirm();
                  }}
                  disabled={!canConfirm}
                  className={`px-4 py-2 rounded-lg font-display font-semibold text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${confirmBgClass}`}
                >
                  {isBusy ? 'Working…' : confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );

  return createPortal(dialogContent, document.body);
}
