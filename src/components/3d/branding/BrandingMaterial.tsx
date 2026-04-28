'use client';

/**
 * BrandingMaterial — WebGPU + TSL implementation of the SF brand surface.
 *
 * Authority:
 *   - Visual target: public/branding/IMG_4607.png
 *   - Source of truth: src/lib/branding/sf-material.config.ts
 *   - Mandate: CLAUDE.md v6.6 "Tech Quality Mandate" — WebGPU+TSL only
 *
 * What this file produces:
 *   1. createBrandingMaterial() — a configured MeshPhysicalNodeMaterial
 *      instance with anisotropic dispersion (E1) and a dichroic-coating
 *      emissive overlay. Ready to drop on any geometry.
 *   2. <BrandingMesh> — convenience React component that pairs the
 *      material with a geometry prop.
 *
 * What this file deliberately does NOT do:
 *   - It does not own the Canvas, lights, or HDRI. Those live in
 *     <BrandingShowcase> so the same material can plug into the live
 *     hero canvas, the offline render canvas, or any other host.
 *   - It does not perform WebGPU capability detection. The host canvas
 *     is responsible for that and for serving the MP4-poster fallback.
 */

import { useMemo, useEffect } from 'react';
import { Color } from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import {
  Fn,
  vec3,
  vec4,
  float,
  uniform,
  normalView,
  positionView,
  cameraPosition,
  positionWorld,
  mix,
  smoothstep,
  abs,
  sin,
  cos,
  pow,
  dot,
  normalize,
  fract,
  step,
  oneMinus,
} from 'three/tsl';

import {
  SF_BRAND,
  PALETTE,
  MATERIAL,
  DISPERSION,
  DICHROIC,
} from '@/lib/branding/sf-material.config';

// ─────────────────────────────────────────────────────────────────────
// 1. createBrandingMaterial — the heart of the brand surface
// ─────────────────────────────────────────────────────────────────────

export interface BrandingMaterialOptions {
  /**
   * Multiplier on dichroic intensity. The default (1.0) matches IMG_4607.
   * Phase 5b ramps this during the "ignition" beat.
   */
  dichroicIntensity?: number;

  /**
   * Multiplier on dispersion strength. Default 1.0. Phase 5b peaks this
   * to ~1.6 during the chromatic-bloom beat.
   */
  dispersionMultiplier?: number;

  /**
   * Override IOR for shimmer animation (e.g. Phase 5b oscillates IOR
   * between 1.50 and 1.62 to make the rainbow "breathe").
   */
  ior?: number;
}

export function createBrandingMaterial(
  options: BrandingMaterialOptions = {},
): MeshPhysicalNodeMaterial {
  const {
    dichroicIntensity = 1.0,
    dispersionMultiplier = 1.0,
    ior = MATERIAL.ior,
  } = options;

  const m = new MeshPhysicalNodeMaterial();

  // ── Physical properties (all CPU-side; mirrors MeshPhysicalMaterial) ──
  m.transmission = MATERIAL.transmission;
  m.ior = ior;
  m.thickness = MATERIAL.thickness;
  m.roughness = MATERIAL.roughness;
  m.metalness = MATERIAL.metalness;
  m.attenuationColor = new Color(MATERIAL.attenuationColor);
  m.attenuationDistance = MATERIAL.attenuationDistance;
  m.clearcoat = MATERIAL.clearcoat;
  m.clearcoatRoughness = MATERIAL.clearcoatRoughness;
  m.envMapIntensity = MATERIAL.envMapIntensity;
  m.anisotropy = MATERIAL.anisotropy;
  m.anisotropyRotation = MATERIAL.anisotropyRotation;

  // Built-in scalar dispersion gives us the baseline rainbow split.
  // The full anisotropic per-channel transmission is added below via
  // an emissive-coating node (the dichroic film) + a Fresnel-boosted
  // dispersion bias. True per-channel-direction refraction lives in
  // the wordmark geometry pass (Phase 2-3) where edge density rises.
  m.dispersion = DISPERSION.strength * dispersionMultiplier * 4.0;

  // The body is glass — base color stays neutral. The "color" comes
  // from transmission tinting (attenuationColor) + the dichroic node.
  m.color = new Color('#ffffff');

  // ── TSL-side: dichroic coating + asymmetric chromatic boost ──
  // The dichroic node is added on top of the lit shading via emissive.
  // This way it survives the transmission lookup unchanged and reads
  // the same on glass, on metals, or against the env-map background.

  const uDichroicIntensity = uniform(dichroicIntensity);
  const uDispersionRot     = uniform(DISPERSION.rotation);
  const uFresnelBoost      = uniform(DISPERSION.fresnelBoost);
  const uFresnelPower      = uniform(DISPERSION.fresnelPower);
  const uDichroicFreq      = uniform(DICHROIC.frequency);
  const uDichroicAnglePow  = uniform(DICHROIC.anglePower);
  const uWarmBiasRight     = uniform(DICHROIC.warmBiasRight);

  const cBandA = uniform(new Color(DICHROIC.bandA));
  const cBandB = uniform(new Color(DICHROIC.bandB));
  const cBandC = uniform(new Color(DICHROIC.bandC));

  // Expose handles for animation (Phase 5b) without rebuilding the material.
  (m as unknown as { __sfUniforms: Record<string, unknown> }).__sfUniforms = {
    dichroicIntensity: uDichroicIntensity,
    dispersionRot: uDispersionRot,
    fresnelBoost: uFresnelBoost,
    fresnelPower: uFresnelPower,
    dichroicFreq: uDichroicFreq,
    dichroicAnglePow: uDichroicAnglePow,
    warmBiasRight: uWarmBiasRight,
  };

  // Dichroic emissive node — a view-angle-dependent rainbow band.
  // This is the visible "oil-slick rainbow" of IMG_4607's faces.
  const dichroicNode = Fn(() => {
    // Vector from surface to camera (world-space)
    const viewDir = normalize(cameraPosition.sub(positionWorld));

    // Fresnel: 1 at grazing angles, 0 at normal incidence
    const ndv = abs(dot(normalize(normalView), viewDir));
    const fresnel = pow(oneMinus(ndv), uFresnelPower).mul(uFresnelBoost);

    // Sweep position drives the band traversal across the surface.
    // We use world-X with a rotation so the bands aren't axis-locked.
    const sweep = positionWorld.x.mul(cos(uDispersionRot))
      .add(positionWorld.y.mul(sin(uDispersionRot)))
      .mul(uDichroicFreq);

    // Wrap to 0..1 — fract gives us the repeating band cycle.
    const phase = fract(sweep.mul(0.5).add(pow(oneMinus(ndv), uDichroicAnglePow)));

    // Three-stop traversal: A → B → C → A
    const seg1 = smoothstep(float(0.0), float(0.33), phase);
    const seg2 = smoothstep(float(0.33), float(0.66), phase);
    const seg3 = smoothstep(float(0.66), float(1.0), phase);

    const bandAB = mix(cBandA, cBandB, seg1);
    const bandBC = mix(bandAB, cBandC, seg2);
    const bandCA = mix(bandBC, cBandA, seg3);

    // Asymmetric warm bias on the +X side (matches IMG_4607)
    const rightSide = step(float(0.0), positionWorld.x);
    const warmBias = vec3(0.18, 0.08, 0.02).mul(rightSide).mul(uWarmBiasRight);

    // Final dichroic contribution, scaled by Fresnel + intensity uniform
    return bandCA.add(warmBias).mul(fresnel).mul(uDichroicIntensity);
  });

  m.emissiveNode = dichroicNode();

  // Mark for downstream identification
  m.name = 'BrandingMaterial';
  m.userData.isBrandingMaterial = true;
  m.userData.sfBrandVersion = '1.0';

  return m;
}

// ─────────────────────────────────────────────────────────────────────
// 2. <BrandingMesh> — drop-in mesh with the brand material
// ─────────────────────────────────────────────────────────────────────

export interface BrandingMeshProps {
  geometry: React.ReactNode; // a <boxGeometry/>, <sphereGeometry/>, or extruded geometry node
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  options?: BrandingMaterialOptions;
}

export function BrandingMesh({
  geometry,
  position,
  rotation,
  scale,
  options,
}: BrandingMeshProps) {
  const material = useMemo(() => createBrandingMaterial(options), [
    options?.dichroicIntensity,
    options?.dispersionMultiplier,
    options?.ior,
  ]);

  // Dispose on unmount — node materials hold GPU pipelines
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      material={material}
      castShadow
      receiveShadow
    >
      {geometry}
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 3. Re-exports for downstream phases
// ─────────────────────────────────────────────────────────────────────

export { SF_BRAND, PALETTE };
