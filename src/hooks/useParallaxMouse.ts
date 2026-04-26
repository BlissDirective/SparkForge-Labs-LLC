'use client';

// ════════════════════════════════════════════════════
// useParallaxMouse — Mouse-Position Parallax Tracking (D3D-8)
// ════════════════════════════════════════════════════
// Tracks normalized mouse position (-1 to 1) and provides
// smooth interpolated values for parallax effects on 3D scenes.
// Used by CockpitCanvas to add subtle depth movement.
//
// COPPA-PRD-D2 (R3F sweep): when the OS reports
// prefers-reduced-motion, the rAF lerp loop is skipped and the
// hook returns a frozen zero-vector ref. The Canvas' frameloop
// switch to "demand" already pauses useFrame consumers, but
// stopping this rAF loop too saves CPU on every page that calls
// the hook (cockpit, ReactiveEnvironmentEffects).

import { useRef, useEffect, useCallback } from 'react';

interface ParallaxValues {
  /** Normalized X (-1 left, 0 center, 1 right) */
  x: number;
  /** Normalized Y (-1 top, 0 center, 1 bottom) */
  y: number;
  /** Smoothed X (lerped toward target) */
  smoothX: number;
  /** Smoothed Y (lerped toward target) */
  smoothY: number;
}

interface UseParallaxMouseOptions {
  /** Smoothing factor (0-1, lower = smoother). Default: 0.05 */
  smoothing?: number;
  /** Intensity multiplier. Default: 1.0 */
  intensity?: number;
  /** Whether parallax is enabled. Default: true */
  enabled?: boolean;
}

export function useParallaxMouse(options: UseParallaxMouseOptions = {}) {
  const { smoothing = 0.05, intensity = 1.0, enabled = true } = options;

  const valuesRef = useRef<ParallaxValues>({ x: 0, y: 0, smoothX: 0, smoothY: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    const nx = ((e.clientX / window.innerWidth) * 2 - 1) * intensity;
    const ny = ((e.clientY / window.innerHeight) * 2 - 1) * intensity;
    valuesRef.current.x = nx;
    valuesRef.current.y = ny;
  }, [enabled, intensity]);

  // Smooth interpolation loop
  useEffect(() => {
    if (!enabled) return;

    // Honor prefers-reduced-motion: skip the rAF lerp loop entirely.
    // Mouse listener also stays unbound so the hook is fully inert.
    // SSR-safe: matchMedia is only called inside this client-only effect.
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      // Reset to a known-good zero vector so consumers don't see stale values.
      valuesRef.current.x = 0;
      valuesRef.current.y = 0;
      valuesRef.current.smoothX = 0;
      valuesRef.current.smoothY = 0;
      return;
    }

    const tick = () => {
      const v = valuesRef.current;
      v.smoothX += (v.x - v.smoothX) * smoothing;
      v.smoothY += (v.y - v.smoothY) * smoothing;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled, smoothing, handleMouseMove]);

  return valuesRef;
}
