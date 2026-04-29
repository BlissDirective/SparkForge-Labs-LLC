'use client';

/**
 * Shared helpers for 3D branding meshes (Phase 3 + Phase 5b).
 *
 * `BrandingPart` is one extruded letter (or sub-shape) with a fresh
 * BrandingMaterial instance. Both <SfMark3D> and <SparkForgeWordmark3D>
 * render arrays of these — a per-instance material is required because
 * TSL node materials hold per-instance GPU pipelines, and uniform
 * mutation across shared materials would corrupt per-mesh tuning.
 *
 * Naming history: started as `SfMarkPart` in SfMark3D.tsx; promoted to
 * `BrandingPart` here when the wordmark needed the same primitive.
 */

import { useMemo, useEffect } from 'react';
import type { ExtrudeGeometry } from 'three';
import {
  createBrandingMaterial,
  type BrandingMaterialOptions,
} from './BrandingMaterial';

export interface BrandingPartProps {
  /** Stable id — written to userData.sfMarkPathId for Phase 5b targeting. */
  id: string;
  /** Pre-built ExtrudeGeometry (caller owns disposal contract). */
  geometry: ExtrudeGeometry;
  /** Optional whether this part is currently visible — used for revealMask. */
  visible?: boolean;
  /** Pass-through to BrandingMaterial. */
  options?: BrandingMaterialOptions;
}

/**
 * One extruded letter / sub-shape rendered with its own BrandingMaterial.
 * Disposes both the material and the geometry on unmount.
 */
export function BrandingPart({
  id,
  geometry,
  visible = true,
  options,
}: BrandingPartProps) {
  const material = useMemo(
    () => createBrandingMaterial(options),
    [options],
  );

  useEffect(() => {
    return () => {
      material.dispose();
      geometry.dispose();
    };
  }, [material, geometry]);

  return (
    <mesh
      name={id}
      geometry={geometry}
      material={material}
      visible={visible}
      castShadow
      receiveShadow
      userData={{ sfMarkPathId: id }}
    />
  );
}
