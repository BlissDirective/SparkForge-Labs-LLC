'use client';

// ================================================================
// CameraSystem — Unified Camera for Cockpit Panoramic Architecture
// ================================================================
// Merges CameraController (from StationFrame) + CinematicCamera
// (from SpatialDashboard) + Hero camera GSAP sequences into a
// single camera component that lives inside CockpitCanvas.
//
// Modes:
//   'hero'     — GSAP-driven, timeline controls camera directly
//   'station'  — FOV lerp only (StationFrame style)
//   'spatial'  — Spring-interpolated position + lookAt + FOV + idle drift
//   'game'     — Locked (cockpit hidden, games own their Canvas)
//
// CPA2-3: Seamless handoff — hero Phase 7 camera target matches
//         SPATIAL_CAMERA_PRESETS.overview exactly ([0, 6.5, 7] fov 58)

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { useCockpitStore } from '@/stores/cockpitStore';
import { getShakeOffset } from '@/lib/3d/cameraShake';
import type { GameCameraPreset } from '@/config/gameRegistry';

export type CameraMode = 'hero' | 'station' | 'spatial' | 'game';

// D3D-B3: Default game camera preset — forward-looking, close to scene
const GAME_CAMERA_DEFAULT = {
  position: new Vector3(0, 2, 5),
  lookAt: new Vector3(0, 0, 0),
  fov: 45,
};

/** Parallax values from useParallaxMouse hook */
interface ParallaxValues {
  x: number;
  y: number;
  smoothX: number;
  smoothY: number;
}

interface CameraSystemProps {
  /** Current camera mode — driven by app state */
  mode: CameraMode;
  /** Override target for station mode (FOV-only transitions) */
  stationFov?: number;
  /** Damping for spatial mode (lower = smoother) */
  spatialDamping?: number;
  /** Enable idle drift in overview */
  enableOrbitDrift?: boolean;
  /** Reduced motion preference */
  reducedMotion?: boolean;
  /** Mouse parallax ref for subtle depth movement (D3D-C4) */
  parallaxRef?: React.RefObject<ParallaxValues>;
  /** Per-game camera preset override (Section 4.1-B) */
  gameCameraPreset?: GameCameraPreset | null;
}

export function CameraSystem({
  mode,
  stationFov = 56,
  spatialDamping = 0.04,
  enableOrbitDrift = true,
  reducedMotion = false,
  parallaxRef,
  gameCameraPreset,
}: CameraSystemProps) {
  const { camera } = useThree();
  const _heroPhase = useCockpitStore((s) => s.heroPhase);
  const cameraTarget = useCockpitStore((s) => s.cameraTarget);

  // Interpolation state refs
  const lookAtTarget = useRef(new Vector3(...cameraTarget.lookAt));
  const positionTarget = useRef(new Vector3(...cameraTarget.position));
  const currentLookAt = useRef(new Vector3(...cameraTarget.lookAt));
  const driftAngle = useRef(0);

  // Update spatial targets when cockpitStore changes
  positionTarget.current.set(...cameraTarget.position);
  lookAtTarget.current.set(...cameraTarget.lookAt);

  useFrame((_, delta) => {
    const cam = camera as PerspectiveCamera;

    // ── Hero mode: GSAP drives camera directly, no interpolation ──
    if (mode === 'hero') {
      // Camera is controlled by HeroScene's GSAP timeline.
      // CameraSystem does nothing — just yields control.
      return;
    }

    // ── Game mode: smooth transition to per-game camera preset (D3D-B3 + Section 4.1-B) ──
    if (mode === 'game') {
      const preset = gameCameraPreset
        ? { position: new Vector3(...gameCameraPreset.position), lookAt: new Vector3(...gameCameraPreset.lookAt), fov: gameCameraPreset.fov }
        : GAME_CAMERA_DEFAULT;
      const gamePos = preset.position;
      const gameLookAt = preset.lookAt;
      const gameFov = preset.fov;
      const lf = 1 - Math.pow(1 - 0.04, delta * 60);

      cam.position.lerp(gamePos, lf * 0.5);
      currentLookAt.current.lerp(gameLookAt, lf * 0.5);
      cam.lookAt(currentLookAt.current);
      if (Math.abs(cam.fov - gameFov) > 0.01) {
        cam.fov = MathUtils.lerp(cam.fov, gameFov, lf);
        cam.updateProjectionMatrix();
      }
    }

    // ── Station mode: FOV-only smooth interpolation ──
    else if (mode === 'station') {
      if (Math.abs(cam.fov - stationFov) > 0.01) {
        cam.fov = MathUtils.lerp(cam.fov, stationFov, 0.05);
        cam.updateProjectionMatrix();
      }
    }

    // ── Spatial mode: full spring-interpolated camera ──
    else {
      const effectiveDamping = reducedMotion ? 0.15 : spatialDamping;
      const lerpFactor = 1 - Math.pow(1 - effectiveDamping, delta * 60);

      // Interpolate position
      cam.position.lerp(positionTarget.current, lerpFactor);

      // Interpolate lookAt
      currentLookAt.current.lerp(lookAtTarget.current, lerpFactor);
      cam.lookAt(currentLookAt.current);

      // Interpolate FOV
      if (Math.abs(cam.fov - cameraTarget.fov) > 0.01) {
        cam.fov = MathUtils.lerp(cam.fov, cameraTarget.fov, lerpFactor);
        cam.updateProjectionMatrix();
      }

      // Subtle idle drift when in overview
      if (enableOrbitDrift && !reducedMotion) {
        driftAngle.current += delta * 0.05;
        const driftX = Math.sin(driftAngle.current) * 0.02;
        const driftY = Math.cos(driftAngle.current * 0.7) * 0.01;
        cam.position.x += driftX * delta;
        cam.position.y += driftY * delta;
      }
    }

    // Camera shake offset (Section 4.1-G)
    const shake = getShakeOffset(delta);
    if (shake.x !== 0 || shake.y !== 0 || shake.z !== 0) {
      cam.position.x += shake.x;
      cam.position.y += shake.y;
      cam.position.z += shake.z;
    }

    // Mouse parallax offset (D3D-C4) — applied to all non-hero modes
    if (parallaxRef?.current) {
      cam.position.x += parallaxRef.current.smoothX * 0.3;
      cam.position.y += parallaxRef.current.smoothY * 0.15;
    }
  });

  return null;
}
