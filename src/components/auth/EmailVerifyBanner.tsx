'use client';

// ════════════════════════════════════════════════════════════════
// EmailVerifyBanner — AUTH-HIGH-004 (Q3 Option B)
//
// Dismissible banner that surfaces when the authenticated parent has
// not yet confirmed their email (`parents.email_verified_at IS NULL`).
// Dismiss state is persisted to `sessionStorage` so the banner stops
// nagging within a single browser session, but reappears on the next
// session — that's the "cookie-backed dismiss, re-appears per session"
// behavior selected in Q3.
//
// Does NOT render for demo/anonymous users (they have no parents row).
// Does NOT render while auth is still loading — avoids a flash on every
// dashboard visit before the parent object hydrates.
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const SESSION_DISMISS_KEY = 'sparkforge:verify-email-banner:dismissed';

export function EmailVerifyBanner() {
  const parent = useAuthStore((s) => s.parent);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);

  const [dismissed, setDismissed] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    // Read dismiss flag once on mount (avoids SSR/CSR hydration mismatch
    // on the banner's initial render).
    try {
      setDismissed(sessionStorage.getItem(SESSION_DISMISS_KEY) === '1');
    } catch {
      // sessionStorage can throw in some privacy modes — default: not dismissed.
      setDismissed(false);
    }
    setHydrated(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
    } catch {
      // Non-fatal; the banner will just reappear on re-render.
    }
  }, []);

  const handleResend = useCallback(async () => {
    if (!parent?.email || resending) return;
    setResending(true);
    setResendMessage(null);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parent.email }),
      });
      if (res.ok) {
        setResendMessage('Check your inbox — a new link is on its way.');
      } else {
        // 429 or 503 — show a gentle message. Keep the user on the banner.
        const data = await res.json().catch(() => null);
        setResendMessage(data?.error || 'Could not resend right now. Try again in a minute.');
      }
    } catch {
      setResendMessage('Could not resend right now. Check your connection.');
    } finally {
      setResending(false);
    }
  }, [parent?.email, resending]);

  // Gate conditions — render nothing until we're sure.
  if (!hydrated) return null;
  if (isLoading) return null;
  if (isDemoMode) return null;
  if (!parent) return null;
  if (parent.email_verified_at) return null;
  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-amber-900/90 to-amber-800/90 border-b border-amber-500/30 backdrop-blur-md"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2 text-sm font-body">
          <div className="flex items-center gap-2 text-amber-100">
            <Mail className="w-4 h-4 text-amber-300" aria-hidden="true" />
            <span>
              Please verify your email
              {parent.email ? (
                <>
                  {' '}— we sent a link to <span className="font-semibold">{parent.email}</span>.
                </>
              ) : (
                '.'
              )}
            </span>
            {resendMessage && (
              <span className="text-amber-200/80 italic ml-2">{resendMessage}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-100 text-xs font-semibold hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending…' : 'Resend link'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-amber-200/50 hover:text-amber-100 transition-colors"
              aria-label="Dismiss email verification reminder for this session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
