// ================================================================
// Hero Splines — Phase 6 Shard Migration Paths
// ================================================================
//
// Spline path definitions for Phase 6 shard migration.
// Each shard follows a unique CubicBezierCurve3 from its
// post-explosion position to its cockpit target position.
//
// Paths are NOT linear — they follow spiral and arc trajectories
// with per-shard randomized control points for organic motion.
//
// Spline Properties (from spec Section 4, Phase 6):
//   - Control point 1: startPos + random * 4.0 (wide arc away from center)
//   - Control point 2: targetPos + random * 2.0 (converging approach)
//   - Path duration per shard: 1.5s – 2.5s (staggered start within 0.5s)
//   - Easing: power2.inOut (slow departure, fast middle, slow arrival)
//   - All arrivals complete by t=14.0s
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Section 4, Phase 6

import { CubicBezierCurve3, Vector3 } from 'three';
import type { ShardAssignment } from './voronoiFracture';

// ■■ Seeded PRNG ■■
// Deterministic random for reproducible spline control points.
// Same implementation as voronoiFracture for consistency.
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ■■ Generate a Single Shard Spline ■■
//
// Creates a CubicBezierCurve3 from start to target with
// randomized control points for organic arc/spiral motion.
//
// Control point strategy:
//   CP1: Wide arc away from center (outward sweep)
//   CP2: Converging approach toward target (inward sweep)
//
export function generateShardSpline(
  startPos: Vector3,
  targetPos: Vector3,
  seed: number,
): CubicBezierCurve3 {
  const rng = seededRandom(seed);

  // Perpendicular offset directions for arc
  const forward = new Vector3().subVectors(targetPos, startPos).normalize();
  const up = new Vector3(0, 1, 0);
  const right = new Vector3().crossVectors(forward, up).normalize();
  const perpUp = new Vector3().crossVectors(right, forward).normalize();

  // CP1: Wide arc away from center — startPos + random * 4.0
  // Creates outward sweep away from the explosion epicenter
  const cp1Offset = new Vector3(
    (rng() - 0.5) * 2.0,
    (rng() - 0.5) * 2.0,
    (rng() - 0.5) * 2.0,
  );
  // Bias outward from center for dramatic arc
  const centerDir = startPos.clone().normalize();
  cp1Offset.add(centerDir.multiplyScalar(rng() * 2.0));
  cp1Offset.multiplyScalar(4.0);

  const cp1 = startPos.clone().add(cp1Offset);

  // CP2: Converging approach — targetPos + random * 2.0
  // Creates smooth approach into the cockpit target position
  const cp2Offset = new Vector3(
    (rng() - 0.5) * 2.0,
    (rng() - 0.5) * 2.0,
    (rng() - 0.5) * 2.0,
  );
  // Bias perpendicular to approach direction for spiral feel
  cp2Offset.add(
    right.clone().multiplyScalar((rng() - 0.5) * 1.5)
  );
  cp2Offset.add(
    perpUp.clone().multiplyScalar((rng() - 0.5) * 1.5)
  );
  cp2Offset.multiplyScalar(2.0);

  const cp2 = targetPos.clone().add(cp2Offset);

  return new CubicBezierCurve3(startPos, cp1, cp2, targetPos);
}

// ■■ Generate Batch Splines for All Shards ■■
//
// Creates spline paths for all shard assignments at once.
// Uses shard index as seed for deterministic, unique paths.
//
export function generateBatchSplines(
  assignments: ShardAssignment[],
  currentPositions: Vector3[],
): CubicBezierCurve3[] {
  return assignments.map((assignment, i) => {
    const startPos = currentPositions[i] ?? new Vector3();
    return generateShardSpline(
      startPos,
      assignment.targetPosition,
      assignment.shardIndex * 7919 + 42, // Prime-based seed per shard
    );
  });
}

// ■■ Spline Timing Configuration ■■
// Per-shard timing for staggered spline traversal
export interface SplineTiming {
  /** When this shard starts moving (seconds from Phase 6 start) */
  startDelay: number;
  /** Total travel duration for this shard (seconds) */
  duration: number;
}

// ■■ Generate Staggered Timing ■■
//
// Creates per-shard timing within the Phase 6 window.
// Shards start within a 0.5s stagger window and take 1.5-2.5s to arrive.
// All arrivals complete by t=14.0s (2.5s Phase 6 window).
//
export function generateSplineTimings(
  shardCount: number,
  seed: number,
): SplineTiming[] {
  const rng = seededRandom(seed);
  const timings: SplineTiming[] = [];

  const STAGGER_WINDOW = 0.5;  // seconds — all shards start within this
  const MIN_DURATION = 1.5;     // seconds — fastest shard
  const MAX_DURATION = 2.5;     // seconds — slowest shard
  const PHASE_WINDOW = 2.5;    // seconds — total Phase 6 duration

  for (let i = 0; i < shardCount; i++) {
    const startDelay = rng() * STAGGER_WINDOW;
    // Duration must fit within phase window minus start delay
    const maxAllowed = PHASE_WINDOW - startDelay;
    const duration = Math.min(
      MIN_DURATION + rng() * (MAX_DURATION - MIN_DURATION),
      maxAllowed,
    );

    timings.push({ startDelay, duration });
  }

  return timings;
}

// ■■ Evaluate Spline with Easing ■■
//
// Gets position along a spline at a given time, applying
// power2.inOut easing for cinematic motion.
//
// @param spline   - The CubicBezierCurve3 path
// @param elapsed  - Seconds elapsed since this shard's start
// @param duration - Total duration for this shard's travel
// @returns Position on the spline (clamped to [0, 1])
//
export function evaluateSplineEased(
  spline: CubicBezierCurve3,
  elapsed: number,
  duration: number,
): Vector3 {
  // Normalize to [0, 1]
  const t = Math.min(Math.max(elapsed / duration, 0), 1);

  // power2.inOut easing: slow departure, fast middle, slow arrival
  const eased = t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;

  return spline.getPointAt(eased);
}

// ■■ Batch Evaluate All Splines at Time t ■■
//
// Updates all shard positions for a given time within Phase 6.
// Returns array of current positions.
//
export function evaluateBatchSplines(
  splines: CubicBezierCurve3[],
  timings: SplineTiming[],
  phaseElapsed: number,
): Vector3[] {
  return splines.map((spline, i) => {
    const timing = timings[i];
    const shardElapsed = phaseElapsed - timing.startDelay;

    if (shardElapsed <= 0) {
      // Not started yet — remain at spline start
      return spline.getPointAt(0);
    }

    return evaluateSplineEased(spline, shardElapsed, timing.duration);
  });
}
