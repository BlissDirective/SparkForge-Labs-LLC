'use client';

// ════════════════════════════════════════════════════
// LODWrapper — Mandatory LOD Container for 3D Scenes
// ════════════════════════════════════════════════════
// Wraps any R3F 3D component with automatic LOD management.
// Provides LOD context, FPS monitoring, and graceful
// degradation when performance drops.
//
// Usage:
//   <LODWrapper tier="flagship">
//     <MyScene3D />
//   </LODWrapper>
//
// Inside MyScene3D:
//   const lod = useLODContext();
//   <sphereGeometry args={lodSphere(lod, 1.0)} />

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLOD, useAdaptiveLOD, type LODState } from '@/hooks/useLOD';
import type { LODLevel } from '@/stores/deviceStore';

// ■■ LOD Context ■■
const LODContext = createContext<LODState | null>(null);

/** Access LOD state from within a LODWrapper */
export function useLODContext(): LODState {
  const ctx = useContext(LODContext);
  if (!ctx) {
    throw new Error('useLODContext must be used within a <LODWrapper>');
  }
  return ctx;
}

// ■■ Props ■■
interface LODWrapperProps {
  /** Game tier — determines triangle budget */
  tier: 'flagship' | 'flLite' | 'standard' | 'system';
  /** Force a specific LOD level (overrides device-based) */
  forcedLevel?: LODLevel;
  /** Enable adaptive FPS monitoring (auto-downgrades on perf drop) */
  adaptive?: boolean;
  /** Camera distance for distance-based LOD */
  cameraDistance?: number;
  children: ReactNode;
}

function LODWrapperStandard({
  tier,
  forcedLevel,
  cameraDistance,
  children,
}: Omit<LODWrapperProps, 'adaptive'> & { children: ReactNode }) {
  const options = useMemo(
    () => ({ tier, forcedLevel, cameraDistance }),
    [tier, forcedLevel, cameraDistance]
  );
  const lodState = useLOD(options);
  return <LODContext.Provider value={lodState}>{children}</LODContext.Provider>;
}

function LODWrapperAdaptive({
  tier,
  forcedLevel,
  cameraDistance,
  children,
}: Omit<LODWrapperProps, 'adaptive'> & { children: ReactNode }) {
  const options = useMemo(
    () => ({ tier, forcedLevel, cameraDistance }),
    [tier, forcedLevel, cameraDistance]
  );
  const lodState = useAdaptiveLOD(options);
  return <LODContext.Provider value={lodState}>{children}</LODContext.Provider>;
}

export function LODWrapper({
  adaptive = false,
  ...props
}: LODWrapperProps) {
  return adaptive
    ? <LODWrapperAdaptive {...props} />
    : <LODWrapperStandard {...props} />;
}

// ■■ LOD Debug Overlay (development only) ■■
export function LODDebugOverlay() {
  const lod = useLODContext();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div
      className="absolute top-2 right-2 z-50 rounded bg-black/80 px-2 py-1 font-mono text-[10px] text-white/70 pointer-events-none"
      aria-hidden="true"
    >
      <div>LOD: {lod.level}</div>
      <div>Budget: {lod.scaledBudget.toLocaleString()} tris</div>
      <div>Device: {lod.deviceType}</div>
      <div>Segs: {lod.segments}</div>
    </div>
  );
}
