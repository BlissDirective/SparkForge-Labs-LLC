// ════════════════════════════════════════════════════
// A11Y PROVIDER — Applies a11y classes to <html>
// v2 [BUG-10A]: Mounted guard prevents hydration mismatch
// v2 [ENH-10E]: Auto-detect system color scheme
// ════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { useA11yStore } from '@/stores/accessibilityStore';

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const { darkMode, fontSize, dyslexiaFont, reduceMotion, highContrast } =
    useA11yStore();
  const toggleDarkMode = useA11yStore((s) => s.toggleDarkMode);
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

    // [ENH-10E] On first visit, detect system preferences
    const hasStoredPrefs = localStorage.getItem('sparkforge-a11y');
    if (!hasStoredPrefs) {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      if (!prefersDark) {
        // System prefers light but our default is dark — switch
        toggleDarkMode();
      }

      // Also respect prefers-reduced-motion on first visit
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

  // Phase 5 P.2-REC: Global MotionConfig respects reduce-motion.
  // - When manual a11y store toggle is on → force `reducedMotion="always"`.
  // - Otherwise → use `"user"` so Motion reads OS-level
  //   `prefers-reduced-motion: reduce` media query and automatically
  //   simplifies animations for all motion children in the tree.
  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      {children}
    </MotionConfig>
  );
}
