'use client';

// PERF-ENH-001 (Ultra): React Three Fiber wrapper for zone-split
// BatchedMesh rendering of static cockpit chrome.
//
// This component receives a memoized list of BatchedInstance entries
// and renders up to three BatchedMesh primitives (front / side /
// rear). Feature-flag gated (BATCHED_COCKPIT). When the flag is off
// consumers should fall back to the legacy per-mesh path.
//
// The material is shared across all three batches and enables
// vertexColors so per-instance color attributes come through
// pixel-identical to the old per-mesh tint variants.

import { useEffect, useMemo, useRef } from 'react';
import {
  Color,
  DoubleSide,
  MeshStandardMaterial,
  type Material,
} from 'three';
import type { Object3D } from 'three';
import {
  buildZonedBatchedMeshes,
  type BatchedInstance,
  type BatchedZoneBundle,
} from '@/lib/3d/batchedCockpit';
import { isFeatureEnabled } from '@/lib/feature-flags';

export interface BatchedCockpitChromeProps {
  instances: readonly BatchedInstance[];
  /** Override the default shared material. Must have vertexColors=true
   *  so per-instance colors render. */
  material?: Material;
  /** Diagnostic: log instance counts per zone to console on mount. */
  debugLog?: boolean;
}

const DEFAULT_CHROME_MATERIAL = new MeshStandardMaterial({
  color: new Color('#9AA8BC'),
  metalness: 0.9,
  roughness: 0.18,
  vertexColors: true,
  side: DoubleSide,
});

export default function BatchedCockpitChrome({
  instances,
  material,
  debugLog = false,
}: BatchedCockpitChromeProps) {
  const enabled = isFeatureEnabled('BATCHED_COCKPIT');
  const bundleRef = useRef<BatchedZoneBundle | null>(null);
  const mat = useMemo(() => material ?? DEFAULT_CHROME_MATERIAL, [material]);

  // Build once per instance-list identity. Consumers should memoize
  // the list upstream or the whole bundle will rebuild every render.
  const bundle = useMemo<BatchedZoneBundle | null>(() => {
    if (!enabled) return null;
    return buildZonedBatchedMeshes(instances, mat);
  }, [enabled, instances, mat]);

  useEffect(() => {
    bundleRef.current = bundle;
    if (debugLog && bundle) {
      console.log(
        '[BatchedCockpitChrome] zones:',
        bundle.front ? 'front' : '-',
        bundle.side ? 'side' : '-',
        bundle.rear ? 'rear' : '-',
        'total:',
        bundle.totalInstances,
      );
    }
    return () => {
      if (bundleRef.current) {
        bundleRef.current.dispose();
        bundleRef.current = null;
      }
    };
  }, [bundle, debugLog]);

  if (!enabled || !bundle) return null;

  // R3F primitive wrapping — each BatchedMesh enters the scene graph
  // as a drop-in replacement for a cluster of Mesh objects.
  return (
    <>
      {bundle.front && <primitive object={bundle.front as Object3D} />}
      {bundle.side && <primitive object={bundle.side as Object3D} />}
      {bundle.rear && <primitive object={bundle.rear as Object3D} />}
    </>
  );
}
