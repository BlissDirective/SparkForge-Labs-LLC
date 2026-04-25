'use client';

// ════════════════════════════════════════════════════
// CeremonyFXBridge — Connects uiStore celebrations to CeremonyFX
// ════════════════════════════════════════════════════
// Reads showCelebration / celebrationType / labColor from uiStore,
// maps CelebrationType → CeremonyFX type via ceremonyMapping,
// and renders the 3D CeremonyFX component when appropriate.
//
// Place this inside any R3F <Canvas> scene (e.g., CockpitCanvas).
// It is a thin bridge — no geometry of its own.
//
// Phase 2 audit fix (Section 3.5): Unified celebration state flow
// This bridge no longer calls `dismissCelebration()` on ceremony end.
// The single owner of dismiss is `useCelebration3D`, which drives the
// full orchestration (mode switch → CeremonyFX → XP popup → panel →
// auto-dismiss after CELEBRATION_TIERS[tier].durationMs). Having two
// dismiss paths (CeremonyFX.onComplete AND useCelebration3D's timer)
// previously caused a race where whichever fired first cut off the
// other's animation mid-flight. CeremonyFX still fires its internal
// onComplete for local cleanup; we just no-op the external callback.

import { useUIStore } from '@/stores/uiStore';
import { mapCelebrationToCeremony } from '@/lib/ceremonyMapping';
import { CeremonyFX } from './CeremonyFX';

export function CeremonyFXBridge() {
  const showCelebration = useUIStore((s) => s.showCelebration);
  const celebrationType = useUIStore((s) => s.celebrationType);
  const labColor = useUIStore((s) => s.labColor);

  const ceremonyType = mapCelebrationToCeremony(celebrationType);

  // Only render for celebration types that have a 3D ceremony
  if (!showCelebration || !ceremonyType) return null;

  // Phase 2 audit fix (Section 3.5): Unified celebration state flow
  // Intentionally omit onComplete — useCelebration3D owns dismiss.
  return (
    <CeremonyFX
      active={showCelebration}
      type={ceremonyType}
      labColor={labColor}
    />
  );
}
