// ════════════════════════════════════════════════════════════════
// autoQuality — Phase 5 task #1 (§10.11) Ultra sub-module
// Quality tier policy driven by FPS telemetry reports
// ════════════════════════════════════════════════════════════════
// Consumes `FpsReport`s (from fpsTelemetry.ts) and emits a quality
// tier: 'low' | 'medium' | 'high' | 'ultra'. Downstream consumers:
//   - PostProcessingStack (drops DOF/SSAO at low/medium)
//   - CockpitCanvas renderer dpr (1.0 at low, devicePixelRatio at ultra)
//   - MechanicalIris particle count (scales linearly with tier)
//
// Design (Mythos §8.8 ACT halting analogy):
//   - Promote to a higher tier only after N consecutive "good" reports
//     (hysteresis, avoids quality pops).
//   - Demote IMMEDIATELY on a single "bad" report (responsive to load
//     spikes — worse to stutter than to over-render).
//
// Default thresholds tuned for 60fps target on desktop-ultra.
// ════════════════════════════════════════════════════════════════

import type { FpsReport } from './fpsTelemetry';

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export const QUALITY_TIERS: QualityTier[] = ['low', 'medium', 'high', 'ultra'];

function tierIndex(tier: QualityTier): number {
  return QUALITY_TIERS.indexOf(tier);
}

export interface AutoQualityOptions {
  /** Starting tier (default 'high'). */
  initialTier?: QualityTier;
  /** Consecutive good reports required to promote (default 5). */
  promoteAfter?: number;
  /**
   * FPS floors for each tier. A sustained report.fps below tier's floor
   * demotes by one step. Raising report.fps above the NEXT tier's floor
   * promotes.
   *
   * Defaults target a comfortable 60fps at `high` and `ultra`; accept
   * 40fps at medium; 25fps at low.
   */
  fpsFloors?: Record<QualityTier, number>;
  /** P95 frame-time ceilings (ms) — alternate demotion trigger. */
  p95Ceilings?: Record<QualityTier, number>;
  /** Max freeze frames per report window before immediate demote. */
  freezeDemoteThreshold?: number;
  /** Called whenever the effective tier changes. */
  onTierChange?: (prev: QualityTier, next: QualityTier, reason: string) => void;
}

export interface AutoQuality {
  ingest(report: FpsReport): void;
  current(): QualityTier;
  /** Manually override and freeze at a specific tier (Settings UI). */
  pin(tier: QualityTier | null): void;
}

const DEFAULT_FPS_FLOORS: Record<QualityTier, number> = {
  low: 0,
  medium: 28,
  high: 48,
  ultra: 57,
};

const DEFAULT_P95_CEILINGS: Record<QualityTier, number> = {
  low: 40,
  medium: 28,
  high: 20,
  ultra: 18,
};

export function createAutoQuality(opts: AutoQualityOptions = {}): AutoQuality {
  let tier: QualityTier = opts.initialTier ?? 'high';
  let pinned: QualityTier | null = null;
  const promoteAfter = opts.promoteAfter ?? 5;
  const fpsFloors = { ...DEFAULT_FPS_FLOORS, ...(opts.fpsFloors ?? {}) };
  const p95Ceilings = { ...DEFAULT_P95_CEILINGS, ...(opts.p95Ceilings ?? {}) };
  const freezeLimit = opts.freezeDemoteThreshold ?? 3;
  let goodStreak = 0;

  const setTier = (next: QualityTier, reason: string) => {
    if (next === tier) return;
    const prev = tier;
    tier = next;
    goodStreak = 0;
    opts.onTierChange?.(prev, next, reason);
  };

  const step = (direction: -1 | 1, reason: string) => {
    const idx = tierIndex(tier);
    const nextIdx = Math.max(0, Math.min(QUALITY_TIERS.length - 1, idx + direction));
    if (nextIdx === idx) return;
    setTier(QUALITY_TIERS[nextIdx], reason);
  };

  return {
    ingest(report: FpsReport) {
      if (pinned) return;
      const floor = fpsFloors[tier];
      const ceil = p95Ceilings[tier];

      // Immediate demote conditions.
      if (report.freezeFrames >= freezeLimit) {
        step(-1, `freeze-frames=${report.freezeFrames}`);
        return;
      }
      if (report.fps < floor && report.samples >= 20) {
        step(-1, `fps=${report.fps.toFixed(1)} < floor=${floor}`);
        return;
      }
      if (report.frame.p95 > ceil && report.samples >= 20) {
        step(-1, `p95=${report.frame.p95.toFixed(1)} > ceil=${ceil}`);
        return;
      }

      // Promote after sustained headroom.
      const nextTierIdx = tierIndex(tier) + 1;
      if (nextTierIdx < QUALITY_TIERS.length) {
        const nextFloor = fpsFloors[QUALITY_TIERS[nextTierIdx]];
        if (report.fps >= nextFloor + 3 /* require +3fps headroom */) {
          goodStreak += 1;
          if (goodStreak >= promoteAfter) {
            step(+1, `sustained fps=${report.fps.toFixed(1)} ≥ ${nextFloor + 3}`);
          }
        } else {
          goodStreak = 0;
        }
      }
    },
    current() {
      return pinned ?? tier;
    },
    pin(t: QualityTier | null) {
      pinned = t;
    },
  };
}

/**
 * Apply a quality tier to a three.js renderer + scene. Helpers a
 * worker-side consumer can call in a single line when the tier changes.
 */
export interface QualityApplication {
  /** Renderer pixel ratio: [tier:value] */
  pixelRatio: Record<QualityTier, number>;
  /** Whether postprocessing DOF is enabled at this tier. */
  dof: Record<QualityTier, boolean>;
  /** Whether SSAO/N8AO is enabled at this tier. */
  ambientOcclusion: Record<QualityTier, boolean>;
  /** Max particle count multiplier (1.0 at ultra). */
  particleMultiplier: Record<QualityTier, number>;
  /** Shadow map size. */
  shadowMapSize: Record<QualityTier, number>;
}

export const DEFAULT_QUALITY_APPLICATION: QualityApplication = {
  pixelRatio: { low: 1.0, medium: 1.0, high: 1.25, ultra: 2.0 },
  dof: { low: false, medium: false, high: true, ultra: true },
  ambientOcclusion: { low: false, medium: false, high: true, ultra: true },
  particleMultiplier: { low: 0.3, medium: 0.6, high: 1.0, ultra: 1.0 },
  shadowMapSize: { low: 512, medium: 1024, high: 2048, ultra: 4096 },
};
