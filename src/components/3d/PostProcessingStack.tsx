'use client';

// ════════════════════════════════════════════════════
// PostProcessingStack — Full Always-On Effects (D3D-5)
// ════════════════════════════════════════════════════
// Desktop-First 3D Overhaul: All post-processing effects
// are always active. No conditional checks, no device-based
// degradation. Maximum visual fidelity at all times.
//
// Effects (render order):
//   1. N8AO (SSAO)          — Ambient occlusion for depth
//   2. Bloom                — Luminance-based glow
//   3. ChromaticAberration  — RGB offset for sci-fi aesthetic
//   4. DepthOfField         — Subtle tilt-shift focus
//   5. Noise                — Film grain texture
//   6. Vignette             — Edge darkening
//   7. BarrelDistortion     — Lens distortion (optional strength)

import { useRef } from 'react';
import { useMemo } from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  DepthOfField,
  Noise,
  N8AO,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { BarrelDistortion } from './BarrelDistortion';
import { useSceneStore } from '@/stores/sceneStore';
import * as THREE from 'three';

interface PostProcessingStackProps {
  // Bloom
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomSmoothing?: number;
  // Vignette
  vignetteDarkness?: number;
  vignetteOffset?: number;
  // Chromatic Aberration
  chromaticOffset?: number;
  // SSAO
  ssaoIntensity?: number;
  ssaoRadius?: number;
  // Depth of Field
  dofFocusDistance?: number;
  dofFocalLength?: number;
  dofBokehScale?: number;
  // Noise
  noiseOpacity?: number;
  // Barrel Distortion
  barrelDistortion?: number;
}

export function PostProcessingStack({
  bloomIntensity = 0.4,
  bloomThreshold = 0.6,
  bloomSmoothing = 0.9,
  vignetteDarkness = 0.5,
  vignetteOffset = 0.3,
  chromaticOffset = 0.0006,
  ssaoIntensity = 1.5,
  ssaoRadius = 0.5,
  dofFocusDistance = 0.01,
  dofFocalLength = 0.02,
  dofBokehScale = 2.0,
  noiseOpacity = 0.06,
  barrelDistortion: barrelDist = 0.02,
}: PostProcessingStackProps) {
  const activeScene = useSceneStore((s) => s.activeScene);
  const isTransitioning = useSceneStore((s) => s.isTransitioning);

  // Scene-reactive effect intensity adjustments
  const sceneMultipliers = useMemo(() => {
    if (isTransitioning) {
      return { bloom: 1.8, chromatic: 1.5, ssao: 0.4, dof: 0.2, noise: 0.5 };
    }

    switch (activeScene) {
      case 'game':
        return { bloom: 1.2, chromatic: 0.5, ssao: 0.8, dof: 0.5, noise: 1.0 };
      case 'spatial':
        return { bloom: 1.0, chromatic: 0.8, ssao: 1.2, dof: 1.5, noise: 0.8 };
      case 'hero':
        return { bloom: 1.5, chromatic: 1.2, ssao: 0.6, dof: 0.3, noise: 1.2 };
      case 'transitioning':
        return { bloom: 1.8, chromatic: 1.5, ssao: 0.4, dof: 0.2, noise: 0.5 };
      default: // cockpit
        return { bloom: 1.0, chromatic: 1.0, ssao: 1.0, dof: 1.0, noise: 1.0 };
    }
  }, [activeScene, isTransitioning]);

  // Chromatic aberration offset vector (Critical Fix #3: useRef to avoid Vector2 allocation on transition toggles)
  const chromaticOffsetRef = useRef(new THREE.Vector2());
  chromaticOffsetRef.current.set(
    chromaticOffset * sceneMultipliers.chromatic,
    chromaticOffset * sceneMultipliers.chromatic * 0.8
  );
  const chromaticOffsetVec = chromaticOffsetRef.current;

  return (
    <EffectComposer multisampling={4}>
      {/* 1. SSAO — Screen-space ambient occlusion */}
      <N8AO
        intensity={ssaoIntensity * sceneMultipliers.ssao}
        aoRadius={ssaoRadius}
        halfRes
      />

      {/* 2. Bloom — Luminance glow */}
      <Bloom
        intensity={bloomIntensity * sceneMultipliers.bloom}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        mipmapBlur
      />

      {/* 3. Chromatic Aberration — RGB offset */}
      <ChromaticAberration
        offset={chromaticOffsetVec}
        radialModulation
        modulationOffset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* 4. Depth of Field — Subtle focus */}
      <DepthOfField
        focusDistance={dofFocusDistance}
        focalLength={dofFocalLength * sceneMultipliers.dof}
        bokehScale={dofBokehScale}
      />

      {/* 5. Noise — Film grain */}
      <Noise
        opacity={noiseOpacity * sceneMultipliers.noise}
        blendFunction={BlendFunction.OVERLAY}
      />

      {/* 6. Vignette — Edge darkening */}
      <Vignette
        darkness={vignetteDarkness}
        offset={vignetteOffset}
        eskil={false}
      />

      {/* 7. Barrel Distortion — Lens effect */}
      <BarrelDistortion strength={barrelDist} />
    </EffectComposer>
  );
}
