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
//   6. HueSaturation        — Per-lab color grading (Audit Section 3, Item 5)
//   7. BrightnessContrast   — Scene-reactive contrast (Audit Section 3, Item 5)
//   8. Vignette             — Edge darkening
//   9. BarrelDistortion     — Lens distortion (optional strength)

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
  HueSaturation,
  BrightnessContrast,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { BarrelDistortion } from './BarrelDistortion';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { Vector2 } from 'three';

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
  const activeGameLabColor = useSceneStore((s) => s.activeGameLabColor);
  const ceremonyQueue = useCockpitStore((s) => s.ceremonyQueue);
  const isCeremonyActive = ceremonyQueue.length > 0;

  // Scene-reactive effect intensity adjustments (extended with vignette + barrel)
  const sceneMultipliers = useMemo(() => {
    if (isTransitioning) {
      return { bloom: 1.8, chromatic: 1.5, ssao: 0.4, dof: 0.2, noise: 0.5, vignette: 1.3, barrel: 2.0 };
    }

    switch (activeScene) {
      case 'game':
        return { bloom: 1.2, chromatic: 0.5, ssao: 0.8, dof: 0.5, noise: 1.0, vignette: 0.8, barrel: 0.0 };
      case 'spatial':
        return { bloom: 1.0, chromatic: 0.8, ssao: 1.2, dof: 1.5, noise: 0.8, vignette: 1.0, barrel: 2.0 };
      case 'hero':
        return { bloom: 1.5, chromatic: 1.2, ssao: 0.6, dof: 0.3, noise: 1.2, vignette: 1.2, barrel: 1.5 };
      case 'transitioning':
        return { bloom: 1.8, chromatic: 1.5, ssao: 0.4, dof: 0.2, noise: 0.5, vignette: 1.3, barrel: 2.0 };
      default: // cockpit
        return { bloom: 1.0, chromatic: 1.0, ssao: 1.0, dof: 1.0, noise: 1.0, vignette: 1.0, barrel: 1.0 };
    }
  }, [activeScene, isTransitioning]);

  // ── Item 4: Adaptive Bloom Threshold ──
  // Lower threshold during celebrations (more glow), raise during gameplay (UI legibility)
  const adaptiveBloomThreshold = useMemo(() => {
    if (isCeremonyActive) return 0.3;     // Celebrations: everything glows
    if (isTransitioning) return 0.4;       // Transitions: moderate glow
    switch (activeScene) {
      case 'game':    return 0.8;          // Gameplay: only bright elements bloom (UI legibility)
      case 'hero':    return 0.4;          // Hero animation: cinematic glow
      case 'spatial': return 0.5;          // Spatial dashboard: balanced
      default:        return bloomThreshold; // Cockpit: use prop default (0.6)
    }
  }, [activeScene, isTransitioning, isCeremonyActive, bloomThreshold]);

  // ── Item 5: Per-Lab Color Grading ──
  // Maps lab hex colors to hue shift (radians) + saturation boost + brightness/contrast
  const labColorGrade = useMemo(() => {
    // Per-lab hue rotation and saturation profiles
    const LAB_COLOR_GRADES: Record<string, { hue: number; saturation: number; brightness: number; contrast: number }> = {
      '#00BBFF': { hue: 0.0,   saturation: 0.10,  brightness: 0.0,   contrast: 0.05  }, // Lab 1: AI Discovery — cool cyan (neutral base)
      '#AA66FF': { hue: 0.15,  saturation: 0.12,  brightness: -0.02, contrast: 0.08  }, // Lab 2: ML Basics — purple shift, deeper contrast
      '#FF66AA': { hue: -0.20, saturation: 0.15,  brightness: 0.02,  contrast: 0.05  }, // Lab 3: Data — warm pink tint
      '#FFAA44': { hue: -0.35, saturation: 0.18,  brightness: 0.03,  contrast: 0.03  }, // Lab 4: Creativity — warm amber glow
      '#00FF88': { hue: 0.25,  saturation: 0.08,  brightness: 0.01,  contrast: 0.06  }, // Lab 5: Agents — fresh green
      '#FF6644': { hue: -0.45, saturation: 0.14,  brightness: 0.01,  contrast: 0.08  }, // Lab 6: Bias & Safety — alert orange-red
      '#06B6D4': { hue: 0.05,  saturation: -0.05, brightness: -0.03, contrast: 0.10  }, // Lab 7: Ethics — desaturated, serious teal
      '#818CF8': { hue: 0.10,  saturation: 0.06,  brightness: 0.0,   contrast: 0.04  }, // Lab 8: Future — indigo, subtle
      '#F97316': { hue: -0.40, saturation: 0.12,  brightness: 0.02,  contrast: 0.06  }, // Lab 9: Integration — warm orange
      '#D946EF': { hue: 0.20,  saturation: 0.16,  brightness: 0.01,  contrast: 0.07  }, // Lab 10: Mastery — vivid magenta
    };

    // Ceremony override: warm amber celebration grade
    if (isCeremonyActive) {
      return { hue: -0.30, saturation: 0.20, brightness: 0.04, contrast: 0.03 };
    }

    // Only apply lab grading during game and spatial scenes
    if (activeScene === 'game' || activeScene === 'spatial') {
      return LAB_COLOR_GRADES[activeGameLabColor] ?? { hue: 0, saturation: 0, brightness: 0, contrast: 0 };
    }

    // Hero and cockpit: neutral grade
    return { hue: 0, saturation: 0, brightness: 0, contrast: 0 };
  }, [activeScene, activeGameLabColor, isCeremonyActive]);

  // Chromatic aberration offset vector (Critical Fix #3: useRef to avoid Vector2 allocation on transition toggles)
  const chromaticOffsetRef = useRef(new Vector2());
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

      {/* 2. Bloom — Adaptive luminance glow (Item 4: threshold shifts per scene/ceremony) */}
      <Bloom
        intensity={bloomIntensity * sceneMultipliers.bloom}
        luminanceThreshold={adaptiveBloomThreshold}
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

      {/* 6. Hue/Saturation — Per-lab color grading (Item 5) */}
      <HueSaturation
        hue={labColorGrade.hue}
        saturation={labColorGrade.saturation}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* 7. Brightness/Contrast — Scene-reactive contrast (Item 5) */}
      <BrightnessContrast
        brightness={labColorGrade.brightness}
        contrast={labColorGrade.contrast}
      />

      {/* 8. Vignette — Scene-reactive edge darkening */}
      <Vignette
        darkness={vignetteDarkness * sceneMultipliers.vignette}
        offset={vignetteOffset}
        eskil={false}
      />

      {/* 9. Barrel Distortion — Scene-reactive lens effect */}
      <BarrelDistortion strength={barrelDist * sceneMultipliers.barrel} />
    </EffectComposer>
  );
}
