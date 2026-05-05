// ════════════════════════════════════════════════════
// A11Y PROVIDER — Applies a11y classes to <html>
// v2 [BUG-10A]: Mounted guard prevents hydration mismatch
// v2 [ENH-10E]: Auto-detect system color scheme
// ════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { useA11yStore } from '@/stores/accessibilityStore';

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const { darkMode, fontSize, dyslexiaFont, reduceMotion, highContrast } =
    useA11yStore();
  const [mounted, setMounted] = useState(false);

  // [BUG-10A] Wait for client mount before applying classes
  useEffect(() => {
    setMounted(true);

    // [S10-HIGH-004] Register service worker for PWA offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failure is non-critical
      });
    }

    // SparkForge is dark-mode only by design (Frost-Prismatic, CLAUDE.md §6).
    // The .light theme is a manual a11y override, NOT something to auto-engage
    // from `prefers-color-scheme: light` — doing so washes out the 3D scenes
    // (login portal, cockpit) which are tuned for the dark surface palette.
    // Only auto-respect prefers-reduced-motion.
    const hasStoredPrefs = localStorage.getItem('sparkforge-a11y');
    if (!hasStoredPrefs) {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (prefersReducedMotion) {
        useA11yStore.getState().toggleReduceMotion();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply classes after mount to avoid hydration mismatch
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;

    // Dark/Light mode
    html.classList.toggle('dark', darkMode);
    html.classList.toggle('light', !darkMode);

    // Font size — uses globals.css convention: font-size-normal/large/xl
    html.classList.remove('font-size-normal', 'font-size-large', 'font-size-xl');
    html.classList.add(`font-size-${fontSize}`);

    // Dyslexia font — matches globals.css .dyslexia-font
    html.classList.toggle('dyslexia-font', dyslexiaFont);

    // Reduce motion — class-based toggle for manual control
    html.classList.toggle('reduce-motion', reduceMotion);

    // High contrast — matches globals.css .high-contrast
    html.classList.toggle('high-contrast', highContrast);
  }, [mounted, darkMode, fontSize, dyslexiaFont, reduceMotion, highContrast]);

  return <>{children}</>;
}
