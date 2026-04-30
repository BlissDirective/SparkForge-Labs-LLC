/**
 * Hero v3 — Theatre.js project + sheet definition
 *
 * Authority:
 *   - Storyboard: docs/hero-v3/Storyboard.md (v1.2)
 *   - Sign-off Q8: studio.initialize() auto-mounted on every environment
 *     (no NODE_ENV gate, no query-param gate). User explicitly requested
 *     this to avoid the "forget-to-remove-gate-before-prod" risk.
 *   - Tech Quality Mandate v6.6 covers the +500 KB studio bundle cost.
 *
 * What this module exports:
 *   - heroProject  — singleton Theatre.js Project for SparkForge Hero v3
 *   - heroSheet    — the "Hero v3" Sheet that holds all 8 beat tracks
 *   - heroBeats    — typed map of per-beat Sheet Objects with tunable props
 *
 * Phase 5b proper uses heroBeats.beat1 .. beat4 to drive Beats 1-4 from
 * GSAP timeline callbacks (the GSAP timeline is the master clock; Theatre
 * holds the per-beat tunable parameter sets).
 *
 * Phase 5c expands to beat5 .. beat8.
 *
 * NOTE: studio.initialize() runs at module first import. This is the
 * earliest the studio overlay can mount in a Next.js client tree. It runs
 * on every environment per Q8.
 */

'use client';

import { getProject, types, type IProject, type ISheet } from '@theatre/core';

// ─────────────────────────────────────────────────────────────────────
// 1. Studio auto-mount (Q8 — no gating)
// ─────────────────────────────────────────────────────────────────────

let studioInitialized = false;

/**
 * Initialize Theatre.js studio overlay. Called once at module import.
 * Idempotent — safe to call from any client component on every mount.
 *
 * Per Q8 sign-off: no NODE_ENV / no query-param gating. The studio
 * overlay appears on every environment when the hero v3 stack is
 * mounted. Bundle cost (~500 KB @theatre/studio) accepted under
 * Tech Quality Mandate v6.6.
 */
export async function ensureHeroStudio(): Promise<void> {
  if (studioInitialized) return;
  if (typeof window === 'undefined') return; // SSR no-op

  studioInitialized = true;
  try {
    const studioModule = await import('@theatre/studio');
    studioModule.default.initialize();
  } catch (err) {
    studioInitialized = false;
    // Studio failure must not break the hero — log and continue
    if (typeof console !== 'undefined') {
      console.warn('[hero v3] Theatre.js studio failed to initialize:', err);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 2. Project + Sheet
// ─────────────────────────────────────────────────────────────────────

/**
 * Singleton Theatre.js project for the SparkForge Hero v3 sequence.
 * `getProject` is idempotent — passing the same name returns the same
 * project instance across imports.
 */
export const heroProject: IProject = getProject('SparkForgeHeroV3', {
  // No persisted state file in 5b proper — Theatre keeps tuning in
  // memory while the dev server runs. Phase 5b/c later exports state
  // to docs/hero-v3/hero-v3.theatre.json once tuning settles.
  state: undefined,
});

/**
 * The Hero v3 sheet. All 8 beats and the master timeline live on this sheet.
 */
export const heroSheet: ISheet = heroProject.sheet('Hero v3');

// ─────────────────────────────────────────────────────────────────────
// 3. Per-beat Sheet Objects (typed)
// ─────────────────────────────────────────────────────────────────────

/**
 * Beat 1 — Void Awakening (0.0 → 2.5 s)
 *   - cameraDollyEnd: end z position of the dolly (default 12)
 *   - particleFadeRate: opacity ramp speed (1.0 = full ramp over the beat)
 *   - streakDriftRate: rad/s drift of the radial streaks
 */
export const heroBeat1 = heroSheet.object('Beat1_VoidAwakening', {
  cameraDollyEnd: types.number(12, { range: [10, 14] }),
  particleFadeRate: types.number(1.0, { range: [0.0, 2.0] }),
  streakDriftRate: types.number(0.005, { range: [0.0, 0.02] }),
});

/**
 * Beat 2 — Ignition Spark (2.5 → 5.0 s)
 *   - flareIntensityPeak: lensflare intensityMul peak value (Beat 2 default 1.4)
 *   - peakTime: when intensityMul peaks (default t=4.0 → relative offset 1.5 s)
 *   - particleAttractorX/Y: where particles converge (S anchor)
 */
export const heroBeat2 = heroSheet.object('Beat2_IgnitionSpark', {
  flareIntensityPeak: types.number(1.4, { range: [0.5, 2.4] }),
  peakTime: types.number(1.5, { range: [0.0, 2.5] }),
  particleAttractorX: types.number(-0.4, { range: [-2.0, 2.0] }),
  particleAttractorY: types.number(0.2, { range: [-2.0, 2.0] }),
});

/**
 * Beat 3 — S Crystallization (5.0 → 8.0 s)
 *   - dispersionOvershoot: peak dispersionStrength before settle
 *   - emissivePeakTime: when emissive peaks (relative seconds into beat)
 *   - dichroicRampDuration: seconds for dichroic to reach 1.0
 */
export const heroBeat3 = heroSheet.object('Beat3_SCrystallization', {
  dispersionOvershoot: types.number(0.108, { range: [0.072, 0.16] }),
  emissivePeakTime: types.number(1.5, { range: [0.5, 2.5] }),
  dichroicRampDuration: types.number(2.0, { range: [1.0, 3.0] }),
});

/**
 * Beat 4 — F Mirror + Shard Burst (8.0 → 11.0 s)
 *   - fCrystallizeDuration: how fast F resolves (default 1.0 s)
 *   - detonationTime: when shards burst (relative seconds into beat — default 2.0)
 *   - shardCountTier: ultra/high/mid/low select index (0-3)
 *   - bloomPeakIntensity: emissive flash sphere intensity at detonation
 *   - lensflareDoublePulse: flare intensityMul spike at detonation
 */
export const heroBeat4 = heroSheet.object('Beat4_FMirrorAndShardBurst', {
  fCrystallizeDuration: types.number(1.0, { range: [0.5, 2.0] }),
  detonationTime: types.number(2.0, { range: [1.5, 2.5] }),
  shardCountTier: types.number(0, { range: [0, 3] }),
  bloomPeakIntensity: types.number(4.0, { range: [2.0, 6.0] }),
  lensflareDoublePulse: types.number(2.2, { range: [1.5, 3.0] }),
});

// ─────────────────────────────────────────────────────────────────────
// 4. Aggregate convenience export
// ─────────────────────────────────────────────────────────────────────

export const heroBeats = {
  beat1: heroBeat1,
  beat2: heroBeat2,
  beat3: heroBeat3,
  beat4: heroBeat4,
  // beat5..beat8 added in Phase 5c
} as const;

export type HeroBeats = typeof heroBeats;
