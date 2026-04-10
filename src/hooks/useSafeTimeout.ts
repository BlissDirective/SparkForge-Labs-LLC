'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Return type of the useSafeTimeout hook. */
export type SafeTimerControls = {
  /** Schedule a callback after `delay` ms. Auto-cleared on unmount. */
  safeTimeout: (callback: () => void, delay: number) => number;
  /** Schedule a repeating callback every `delay` ms. Auto-cleared on unmount. */
  safeInterval: (callback: () => void, delay: number) => number;
  /** Manually clear all pending timeouts and intervals. */
  clearAll: () => void;
};

/**
 * Provides safe `setTimeout` and `setInterval` wrappers that automatically
 * clear all pending timers when the component unmounts. Timer IDs are stored
 * in a `Set<number>` ref for O(1) add/remove.
 */
export function useSafeTimeout(): SafeTimerControls {
  const timeoutIds = useRef<Set<number>>(new Set());
  const intervalIds = useRef<Set<number>>(new Set());

  const clearAll = useCallback(() => {
    timeoutIds.current.forEach((id) => clearTimeout(id));
    timeoutIds.current.clear();
    intervalIds.current.forEach((id) => clearInterval(id));
    intervalIds.current.clear();
  }, []);

  const safeTimeout = useCallback((callback: () => void, delay: number): number => {
    const id = window.setTimeout(() => {
      timeoutIds.current.delete(id);
      callback();
    }, delay);
    timeoutIds.current.add(id);
    return id;
  }, []);

  const safeInterval = useCallback((callback: () => void, delay: number): number => {
    const id = window.setInterval(callback, delay);
    intervalIds.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timeoutIds.current.forEach((id) => clearTimeout(id));
      // eslint-disable-next-line react-hooks/exhaustive-deps
      intervalIds.current.forEach((id) => clearInterval(id));
    };
  }, []);

  return { safeTimeout, safeInterval, clearAll };
}
