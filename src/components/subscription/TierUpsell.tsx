// ════════════════════════════════════════════════════
// TIER UPSELL — Friendly, parent-gated lock states (P1-4)
// Two surfaces sharing the same copy + light design system:
//   <LabUpsellDialog>  — modal opened from locked game cards
//                        on the lab detail page
//   <GameLockedNotice> — full inline state on the game page
//                        (rendered INSTEAD of a locked game)
// Copy is addressed to the parent, never shames the kid.
// A11y: role=dialog, aria-modal, labelled title, focus trap,
// Escape-to-close, focus restore on dismiss.
// ════════════════════════════════════════════════════
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lock, Sparkles, X } from 'lucide-react';

const COPY = {
  title: 'More adventures await!',
  body: 'This part of the lab opens with Spark Plus. Ask a grown-up to unlock all 11 labs and every game.',
  cta: 'Go to Plans',
  dismiss: 'Not now',
};

const CTA_GRADIENT = 'linear-gradient(90deg, #E945F5, #4F6EF7)';

function UpsellArt() {
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
      style={{ background: '#4F6EF715', border: '1px solid #E6E9F4' }}
      aria-hidden="true"
    >
      <Lock className="w-7 h-7" style={{ color: '#4F6EF7' }} />
    </div>
  );
}

// ── Modal variant ───────────────────────────────────────────

interface LabUpsellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Lab name for the aria description, e.g. "Machine Learning Basics". */
  labName?: string;
}

export function LabUpsellDialog({ isOpen, onClose, labName }: LabUpsellDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape + focus restore.
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      );

    getFocusable()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog card */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lab-upsell-title"
            aria-describedby="lab-upsell-body"
            className="relative w-full max-w-sm rounded-2xl p-6 text-center"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E6E9F4',
              boxShadow: '0 20px 60px rgba(26, 29, 43, 0.25)',
            }}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, damping: 25 } }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: '#8C94AC' }}
              aria-label="Close unlock info"
            >
              <X className="w-4 h-4" />
            </button>

            <UpsellArt />

            <h2
              id="lab-upsell-title"
              className="text-lg font-bold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
            >
              {COPY.title}
            </h2>
            <p id="lab-upsell-body" className="text-sm mb-6" style={{ color: '#52586E' }}>
              {labName ? `${labName} is a preview lab — the first game is free. ` : ''}
              {COPY.body}
            </p>

            <Link
              href="/parent/subscription"
              onClick={onClose}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: CTA_GRADIENT, fontFamily: 'var(--font-display)' }}
              aria-label="Go to plans — for grown-ups"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {COPY.cta}
            </Link>

            <button
              onClick={onClose}
              className="mt-3 text-xs font-medium transition-colors hover:underline"
              style={{ color: '#8C94AC' }}
            >
              {COPY.dismiss}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Inline full-page variant (game page) ───────────────────

interface GameLockedNoticeProps {
  /** Where the back link points, e.g. `/labs/4`. */
  backHref: string;
  /** Back link label, e.g. "Back to Language Lab". */
  backLabel: string;
  gameName?: string;
}

export function GameLockedNotice({ backHref, backLabel, gameName }: GameLockedNoticeProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="main">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center w-full max-w-md p-8 rounded-2xl"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E6E9F4',
          boxShadow: '0 4px 24px rgba(26, 29, 43, 0.06)',
        }}
        aria-label={gameName ? `${gameName} is not unlocked yet` : 'This game is not unlocked yet'}
      >
        <UpsellArt />

        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
        >
          {COPY.title}
        </h2>
        <p className="text-sm mb-6" style={{ color: '#52586E' }}>
          {gameName ? `${gameName} opens with Spark Plus. ` : ''}
          Ask a grown-up to unlock all 11 labs and every game — you&apos;re doing
          great, and there&apos;s so much more to explore!
        </p>

        <Link
          href="/parent/subscription"
          className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: CTA_GRADIENT, fontFamily: 'var(--font-display)' }}
          aria-label="Go to plans — for grown-ups"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          {COPY.cta}
        </Link>

        <Link
          href={backHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
          style={{ color: '#8C94AC' }}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {backLabel}
        </Link>
      </motion.div>
    </div>
  );
}
