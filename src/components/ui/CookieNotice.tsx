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
      {/* P1-8: explicit colors (theme remaps made "essential cookies
          only" unreadable), z-[60] so Sparky/bottom-nav never cover the
          dismiss button, and a bottom offset that clears the mobile nav. */}
      <motion.div
        role="region"
        aria-label="Cookie notice"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-[60] mx-auto max-w-2xl"
        data-surface="dark"
      >
        <div
          className="flex flex-col gap-3 rounded-xl px-4 py-3 backdrop-blur-md sm:flex-row sm:items-start"
          style={{
            background: 'rgba(16, 20, 34, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 12px 40px rgba(10, 15, 30, 0.45)',
          }}
        >
          <Cookie
            className="w-5 h-5 mt-0.5 flex-shrink-0"
            style={{ color: '#6FA8FF' }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
              SparkForge uses{' '}
              <strong style={{ color: '#FFFFFF' }}>essential cookies only</strong>{' '}
              &mdash; no analytics, no ads, no third-party tracking.{' '}
              <Link
                href="/privacy#cookies"
                className="hover:underline focus:outline-none focus-visible:underline"
                style={{ color: '#6FA8FF' }}
              >
                Learn more
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2"
              style={{
                background: 'rgba(111, 168, 255, 0.18)',
                border: '1px solid rgba(111, 168, 255, 0.4)',
                color: '#9DC4FF',
              }}
            >
              Got it
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss cookie notice"
              className="p-1 rounded-md transition hover:bg-white/10 focus:outline-none focus-visible:ring-2"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
