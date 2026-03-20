'use client';

// ════════════════════════════════════════════════════
// SpatialDashboard — Immersive 3D Command Bridge
// ════════════════════════════════════════════════════
// 20M COCKPIT UPGRADE: Now a thin wrapper around CockpitCanvas.
//
// Previously contained its own R3F <Canvas> at z-index 0. As of the
// 20M upgrade (March 20, 2026), SpatialDashboard renders its scene
// content inside the unified CockpitCanvas (CPA2-1: Single Canvas).
//
// The SpatialDashboardContent (HolographicLabMap, InteractiveConsoles,
// AmbientNPCs, DynamicEnvironment) is now embedded directly in
// CockpitCanvas and toggled via the showSpatialDashboard prop.
//
// This wrapper is preserved for backward compatibility with any
// consumer that imports SpatialDashboard directly.

import { CockpitCanvas } from './CockpitCanvas';

interface SpatialDashboardProps {
  labCompletions?: Record<number, number>;
  onLabEnter?: (labId: number) => void;
}

export function SpatialDashboard({ labCompletions = {}, onLabEnter }: SpatialDashboardProps) {
  return (
    <CockpitCanvas
      showSpatialDashboard
      labCompletions={labCompletions}
      onLabEnter={onLabEnter}
    />
  );
}
