'use client';

// ═══════════════════════════════════════════════════════════════════
// LenisProvider — Momentum-based smooth scrolling
// ═══════════════════════════════════════════════════════════════════
// Phase 4 §10.4: Wraps the app in a single Lenis instance driving the
// window scroll with momentum physics. Premium feel matching the
// Frost-Prismatic aesthetic on parent dashboard, arcade grid, settings,
// content viewer, and marketing routes.
//
// Uses lenis' autoRaf mode — the library manages its own
// requestAnimationFrame loop, so we don't need to integrate with
// React Three Fiber's render loop. Pairs naturally with existing
// GSAP ScrollTrigger (Lenis publishes scroll events that ScrollTrigger
// reads).
//
// Respects prefers-reduced-motion: users with the OS flag set get
// native scroll (lerp=1 effectively disables smoothing).
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';

interface LenisProviderProps {
  children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect OS-level reduced-motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const lenis = new Lenis({
      // Smooth duration — longer = smoother but more floaty
      duration: prefersReducedMotion ? 0 : 1.2,
      // Ease-out exponential (standard Lenis default)
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Touch behavior: keep native inertia on touch devices
      touchMultiplier: 1.5,
      // Disable on reduced motion — effectively becomes native
      smoothWheel: !prefersReducedMotion,
      autoRaf: true,
    });

    lenisRef.current = lenis;

    // Integrate with GSAP ScrollTrigger if it's on the page
    // (Lenis publishes scroll; ScrollTrigger reads window scroll)
    // See https://greensock.com/docs/v3/Plugins/ScrollTrigger/ for
    // integration guidance.
    if (typeof window !== 'undefined' && 'ScrollTrigger' in window) {
      lenis.on('scroll', () => {
        // @ts-expect-error — ScrollTrigger is a global
        window.ScrollTrigger?.update?.();
      });
    }

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
