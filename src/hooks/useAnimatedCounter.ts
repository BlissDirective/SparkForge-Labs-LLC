'use client';

import { useState, useEffect } from 'react';

/**
 * Animated counter hook — smoothly transitions a displayed number toward a target value.
 * Uses ease-out cubic easing via requestAnimationFrame.
 */
export function useAnimatedCounter(target: number, duration = 600): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (display === target) return;
    const start = display;
    const diff = target - start;
    const startTime = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}
