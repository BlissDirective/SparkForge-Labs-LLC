// ================================================================
// useHeroAnimation — React Hook for Hero Animation Lifecycle
// ================================================================
//
// Manages the hero animation lifecycle:
//   1. Read skipIntroAnimation from uiStore (OD-3)
//   2. Read/detect gpuTier from deviceStore (OD-4)
//   3. Detect prefers-reduced-motion media query
//   4. Manage GSAP timeline timeScale for fast-forward (OD-2)
//   5. Track current phase (0-7) and progress (0.0-1.0)
//   6. Provide onPhaseChange callbacks
//   7. Provide onComplete callback for cockpit handoff
//   8. Handle isFirstVisit flag (full animation on first visit)
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md — OD-2, OD-3

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useDeviceStore, selectGpuTier, selectStripeCount } from '@/stores/deviceStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import type { GPUTier } from '@/stores/deviceStore';

// ── Local Storage Key ────────────────────────────────────────────
const HERO_SEEN_KEY = 'sparkforge-hero-seen';

// ── Public Interfaces ────────────────────────────────────────────

export interface HeroAnimationState {
  /** true if skip enabled + not first visit + not reduced motion */
  shouldSkip: boolean;
  /** Detected GPU rendering tier */
  gpuTier: GPUTier;
  /** Number of WebGPU particle buffer stripes (0-4) */
  stripeCount: number;
  /** Current phase index (0-7) */
  currentPhase: number;
  /** Animation progress (0.0-1.0) */
  progress: number;
  /** true when animation has completed */
  isComplete: boolean;
  /** true when fast-forwarding at 4x */
  isFastForwarding: boolean;
  /** Current timeline timeScale (1.0 normal, 4.0 fast-forward) */
  timeScale: number;
}

export interface HeroAnimationActions {
  /** Trigger 4x timeScale fast-forward (OD-2) */
  fastForward: () => void;
  /** Instant jump to Phase 8 final state */
  skipToEnd: () => void;
  /** Update current phase index */
  setPhase: (phase: number) => void;
  /** Update animation progress */
  setProgress: (progress: number) => void;
  /** Mark animation as complete */
  setComplete: () => void;
}

// ── Skip Logic Decision Tree ─────────────────────────────────────
//
// Is prefers-reduced-motion: reduce?
//   → YES: shouldSkip = true (accessibility override)
//   → NO: Is skipIntroAnimation true in uiStore?
//     → YES: Is this the first visit ever?
//       → YES: shouldSkip = false (first visit always plays)
//       → NO: shouldSkip = true
//     → NO: shouldSkip = false

function getIsFirstVisit(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(HERO_SEEN_KEY) !== 'true';
}

function markHeroSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HERO_SEEN_KEY, 'true');
}

/**
 * React hook managing the hero animation lifecycle.
 *
 * @param onComplete — Called when animation finishes (cockpit handoff)
 * @param onPhaseChange — Called when current phase changes (0-7)
 * @returns [state, actions] tuple
 */
export function useHeroAnimation(
  onComplete?: () => void,
  onPhaseChange?: (phase: number) => void,
): [HeroAnimationState, HeroAnimationActions] {
  // ── Store reads ──
  const skipIntroAnimation = useUIStore((s) => s.skipIntroAnimation);
  const gpuTier = useDeviceStore(selectGpuTier);
  const stripeCount = useDeviceStore(selectStripeCount);
  const setHeroPhase = useCockpitStore((s) => s.setHeroPhase);
  const setCockpitReady = useCockpitStore((s) => s.setCockpitReady);

  // ── Local state ──
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgressState] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [timeScale, setTimeScale] = useState(1.0);

  // ── Reduced motion detection ──
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Skip logic ──
  const isFirstVisit = useRef(getIsFirstVisit());

  const shouldSkip = prefersReducedMotion
    ? true
    : skipIntroAnimation
      ? !isFirstVisit.current
      : false;

  // ── Phase change callback ──
  const prevPhase = useRef(currentPhase);
  useEffect(() => {
    if (currentPhase !== prevPhase.current) {
      prevPhase.current = currentPhase;
      onPhaseChange?.(currentPhase);
    }
  }, [currentPhase, onPhaseChange]);

  // ── Actions ──
  const fastForward = useCallback(() => {
    setIsFastForwarding(true);
    setTimeScale(4.0);
  }, []);

  const skipToEnd = useCallback(() => {
    setCurrentPhase(7);
    setProgressState(1.0);
    setIsComplete(true);
    markHeroSeen();
    setHeroPhase('complete');
    setCockpitReady(true);
    onComplete?.();
  }, [onComplete, setHeroPhase, setCockpitReady]);

  const setPhase = useCallback((phase: number) => {
    setCurrentPhase(phase);
  }, []);

  const setProgress = useCallback((p: number) => {
    setProgressState(p);
  }, []);

  const setComplete = useCallback(() => {
    setIsComplete(true);
    markHeroSeen();
    setHeroPhase('complete');
    setCockpitReady(true);
    onComplete?.();
  }, [onComplete, setHeroPhase, setCockpitReady]);

  // ── Assemble return ──
  const state: HeroAnimationState = {
    shouldSkip,
    gpuTier,
    stripeCount,
    currentPhase,
    progress,
    isComplete,
    isFastForwarding,
    timeScale,
  };

  const actions: HeroAnimationActions = {
    fastForward,
    skipToEnd,
    setPhase,
    setProgress,
    setComplete,
  };

  return [state, actions];
}
