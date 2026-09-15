'use client';

// OS prefers-reduced-motion + uiStore a11y toggle.
// useSyncExternalStore so Playwright emulateMedia and real matchMedia
// are visible on the first client snapshot (motion/react's hook is not).

import { useSyncExternalStore } from 'react';
import { useUIStore } from '@/stores/uiStore';

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/** True when glass breathe / ambient loops must freeze. */
export function useForgeReducedMotion(): boolean {
  const osPref = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const userPref = useUIStore((s) => s.a11y.reduceMotion);
  return osPref || userPref;
}
