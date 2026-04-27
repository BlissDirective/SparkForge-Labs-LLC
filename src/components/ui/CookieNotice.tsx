'use client';

// ════════════════════════════════════════════════════════════════
// CookieNotice — first-visit informational banner
//
// SparkForge uses essential cookies only (Supabase auth, Stripe
// checkout, CSRF). Per /privacy#cookies we do not run analytics,
// ad pixels, or third-party tracking — so this is a transparency
// notice, not a GDPR opt-in/opt-out consent center.
//
// If non-essential cookies are introduced later (analytics,
// marketing, etc.) replace this component with a category-based
// consent flow (Accept All / Reject / Customize) and gate any
// non-essential script load on the stored consent record.
//
// Dismissal state lives in localStorage under SF_COOKIE_NOTICE_KEY.
// localStorage usage for "user dismissed this banner" qualifies as
// strictly necessary under ePrivacy (no consent needed for the
// dismissal record itself).
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X } from 'lucide-react';

const SF_COOKIE_NOTICE_KEY = 'sparkforge:cookie-notice:dismissed';

// Exposed so a footer "Cookie preferences" link can clear it and
// re-show the banner without duplicating the storage key string.
export function clearCookieNoticeDismissal(): void {
  try {
    localStorage.removeItem(SF_COOKIE_NOTICE_KEY);
  } catch {
    // localStorage unavailable (private mode, etc.) — silent no-op
  }
}

export function CookieNotice() {
  const [dismissed, setDismissed] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(SF_COOKIE_NOTICE_KEY) === '1');
    } catch {
      setDismissed(false);
    }
    setHydrated(true);
  }, []);

  const onDismiss = useCallback(() => {
    try {
      localStorage.setItem(SF_COOKIE_NOTICE_KEY, '1');
    } catch {
      // ignore — banner just won't persist this session
    }
    setDismissed(true);
  }, []);

  if (!hydrated || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="region"
        aria-label="Cookie notice"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
      >
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-surface-card/95 backdrop-blur-md px-4 py-3 shadow-2xl shadow-spark-blue/10">
          <Cookie
            className="w-5 h-5 mt-0.5 text-spark-blue flex-shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80 leading-relaxed">
              SparkForge uses{' '}
              <strong className="text-white">essential cookies only</strong>{' '}
              &mdash; no analytics, no ads, no third-party tracking.{' '}
              <Link
                href="/privacy#cookies"
                className="text-spark-blue hover:underline focus:outline-none focus-visible:underline"
              >
                Learn more
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg bg-spark-blue/15 hover:bg-spark-blue/25 border border-spark-blue/30 text-sm font-medium text-spark-blue transition focus:outline-none focus-visible:ring-2 focus-visible:ring-spark-blue/60"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss cookie notice"
              className="p-1 rounded-md text-white/50 hover:text-white/90 hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
