'use client';

// ════════════════════════════════════════════════════════════════
// useForgeTier — Forge F1 (Concept 10 §4.10)
// ════════════════════════════════════════════════════════════════
// Single decision point for conditional forge effect mounting.
// ALL tier/motion gating in forge components goes through this hook —
// no scattered media queries.

import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import type { DeviceTier } from '@/hooks/useDeviceProfile';

export interface ForgeTier {
  tier: DeviceTier;
  /** mobile or tablet */
  isCompact: boolean;
  prefersReducedMotion: boolean;
  /** Ambient particle layers (EmberField) may mount. */
  allowAmbience: boolean;
  /** Heat-distortion hover effects may activate (desktop-class only). */
  allowShimmer: boolean;
}

export function useForgeTier(): ForgeTier {
  const { tier } = useDeviceProfile();
  const prefersReducedMotion = useReducedMotion();

  const isCompact = tier === 'mobile' || tier === 'tablet';

  return {
    tier,
    isCompact,
    prefersReducedMotion,
    allowAmbience:
      FEATURE_FLAGS.FORGE_AMBIENCE && !prefersReducedMotion && tier !== 'mobile',
    allowShimmer:
      (tier === 'desktop' || tier === 'ultrawide') && !prefersReducedMotion,
  };
}
