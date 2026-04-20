'use client';

// ════════════════════════════════════════════════════
// useGameEnvironmentReactivity — Game State → Environment Parameters
// ════════════════════════════════════════════════════
// Maps gameStore (score, round, completion) and childStore (level, streak)
// into smooth, per-frame environment reactivity values that drive
// lighting warmth, fog density, particle speed, and victory effects.
//
// Must be called within R3F Canvas context (uses useFrame).
// Returns a mutable ref — read values in useFrame for zero re-renders.
//
// Audit: R3F Best Practices §1 — Immersive "Wow Factor"
// Findings 1, 3: Game environments become state-reactive

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';

// ■■ Public interface ■■

export interface EnvironmentReactivityValues {
  /** 0–1: currentRound / totalRounds (smoothed) */
  roundProgress: number;
  /** Raw score from gameStore */
  score: number;
  /** Whether the game is complete */
  isComplete: boolean;
  /** Current round number */
  currentRound: number;
  /** Total rounds in game */
  totalRounds: number;
  /** 1.0–1.5: lighting warmth multiplier based on progress */
  lightingWarmth: number;
  /** 1.0–1.25: lighting intensity multiplier */
  lightingIntensity: number;
  /** 0.7–1.0: fog opacity multiplier (decreases as rounds advance) */
  fogDensity: number;
  /** 1.0–1.8: fog/particle speed multiplier */
  particleSpeed: number;
  /** 1.0–1.8: particle count multiplier from child progress */
  particleCountMultiplier: number;
  /** 0–0.5: sky horizon color shift toward lab color */
  skyColorShift: number;
  /** 0–1: animated victory flash intensity (decays over ~2s) */
  victoryFlash: number;
  /** 0–1: child level normalized (capped at level 50) */
  levelFactor: number;
  /** 0–1: streak count normalized (capped at 7-day streak) */
  streakFactor: number;
}

const DEFAULT_VALUES: EnvironmentReactivityValues = {
  roundProgress: 0,
  score: 0,
  isComplete: false,
  currentRound: 0,
  totalRounds: 0,
  lightingWarmth: 1.0,
  lightingIntensity: 1.0,
  fogDensity: 1.0,
  particleSpeed: 1.0,
  particleCountMultiplier: 1.0,
  skyColorShift: 0,
  victoryFlash: 0,
  levelFactor: 0,
  streakFactor: 0,
};

/**
 * Maps game state + child progress → environment reactivity parameters.
 *
 * All values are smoothly interpolated per-frame via the returned mutable ref.
 * Consumers should read `ref.current.*` inside `useFrame` for jank-free updates.
 *
 * @returns React ref to mutable EnvironmentReactivityValues
 */
export function useGameEnvironmentReactivity() {
  // ── Store selectors (individual fields → minimal re-renders) ──
  const score = useGameStore((s) => s.score);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const isComplete = useGameStore((s) => s.isComplete);

  // STATE-MED-001 (B-full/T5c-C1): read from React Query cache via
  // useActiveChild() so env reactivity reflects the latest server
  // values (e.g., an XP award just reconciled from ['children']
  // refetch won't require a childStore patch to propagate).
  const activeChild = useActiveChild();
  const childLevel = activeChild?.level ?? 1;
  const childStreak = activeChild?.streak_count ?? 0;

  // ── Mutable values ref (read in useFrame, never triggers React render) ──
  const valuesRef = useRef<EnvironmentReactivityValues>({ ...DEFAULT_VALUES });
  const prevCompleteRef = useRef(false);

  // ── Derived targets (recomputed on React re-render from store changes) ──
  const targetRoundProgress = totalRounds > 0
    ? Math.min(currentRound / totalRounds, 1)
    : 0;
  const levelFactor = Math.min(childLevel / 50, 1);
  const streakFactor = Math.min(childStreak / 7, 1);

  // ── Per-frame smooth interpolation ──
  useFrame((_, delta) => {
    const v = valuesRef.current;

    // Victory flash: trigger on completion edge, decay over ~2s
    if (isComplete && !prevCompleteRef.current) {
      v.victoryFlash = 1.0;
    }
    prevCompleteRef.current = isComplete;
    v.victoryFlash = Math.max(0, v.victoryFlash - delta * 0.5);

    // Smooth-lerp round progress for fluid transitions
    v.roundProgress = MathUtils.lerp(v.roundProgress, targetRoundProgress, delta * 3);

    // Pass-through values
    v.score = score;
    v.isComplete = isComplete;
    v.currentRound = currentRound;
    v.totalRounds = totalRounds;
    v.levelFactor = levelFactor;
    v.streakFactor = streakFactor;

    // ── Derived environment multipliers (all smoothed) ──

    // Lighting gets warmer as rounds advance; extra warmth on completion
    const warmthTarget = 1.0 + targetRoundProgress * 0.3 + (isComplete ? 0.2 : 0);
    v.lightingWarmth = MathUtils.lerp(v.lightingWarmth, warmthTarget, delta * 2);

    // Overall intensity grows with progress + child level
    const intensityTarget = 1.0 + targetRoundProgress * 0.15 + levelFactor * 0.1;
    v.lightingIntensity = MathUtils.lerp(v.lightingIntensity, intensityTarget, delta * 2);

    // Fog clears as player progresses (1.0 → 0.7)
    const fogTarget = 1.0 - targetRoundProgress * 0.3;
    v.fogDensity = MathUtils.lerp(v.fogDensity, fogTarget, delta * 2);

    // Particles speed up with progress + streak
    const speedTarget = 1.0 + targetRoundProgress * 0.5 + streakFactor * 0.3;
    v.particleSpeed = MathUtils.lerp(v.particleSpeed, speedTarget, delta * 2);

    // Particle density grows with child level + streak
    v.particleCountMultiplier = 1.0 + levelFactor * 0.5 + streakFactor * 0.3;

    // Sky shifts toward lab color as rounds advance
    const skyTarget = targetRoundProgress * 0.3;
    v.skyColorShift = MathUtils.lerp(v.skyColorShift, skyTarget, delta * 2);
  });

  return valuesRef;
}
