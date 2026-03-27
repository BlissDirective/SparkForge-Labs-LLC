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

import { useUIStore } from '@/stores/uiStore';
import { mapCelebrationToCeremony } from '@/lib/ceremonyMapping';
import { CeremonyFX } from './CeremonyFX';

export function CeremonyFXBridge() {
  const showCelebration = useUIStore((s) => s.showCelebration);
  const celebrationType = useUIStore((s) => s.celebrationType);
  const labColor = useUIStore((s) => s.labColor);
  const dismissCelebration = useUIStore((s) => s.dismissCelebration);

  const ceremonyType = mapCelebrationToCeremony(celebrationType);

  // Only render for celebration types that have a 3D ceremony
  if (!showCelebration || !ceremonyType) return null;

  return (
    <CeremonyFX
      active={showCelebration}
      type={ceremonyType}
      labColor={labColor}
      onComplete={dismissCelebration}
    />
  );
}
