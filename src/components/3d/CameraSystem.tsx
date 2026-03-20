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
import * as THREE from 'three';
import { useCockpitStore, SPATIAL_CAMERA_PRESETS, type CameraTarget, type HeroPhase } from '@/stores/cockpitStore';

export type CameraMode = 'hero' | 'station' | 'spatial' | 'game';

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
}

export function CameraSystem({
  mode,
  stationFov = 56,
  spatialDamping = 0.04,
  enableOrbitDrift = true,
  reducedMotion = false,
}: CameraSystemProps) {
  const { camera } = useThree();
  const heroPhase = useCockpitStore((s) => s.heroPhase);
  const cameraTarget = useCockpitStore((s) => s.cameraTarget);

  // Interpolation state refs
  const lookAtTarget = useRef(new THREE.Vector3(...cameraTarget.lookAt));
  const positionTarget = useRef(new THREE.Vector3(...cameraTarget.position));
  const currentLookAt = useRef(new THREE.Vector3(...cameraTarget.lookAt));
  const driftAngle = useRef(0);

  // Update spatial targets when cockpitStore changes
  positionTarget.current.set(...cameraTarget.position);
  lookAtTarget.current.set(...cameraTarget.lookAt);

  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;

    // ── Hero mode: GSAP drives camera directly, no interpolation ──
    if (mode === 'hero') {
      // Camera is controlled by HeroScene's GSAP timeline.
      // CameraSystem does nothing — just yields control.
      return;
    }

    // ── Game mode: camera is irrelevant (cockpit hidden) ──
    if (mode === 'game') {
      return;
    }

    // ── Station mode: FOV-only smooth interpolation ──
    if (mode === 'station') {
      if (Math.abs(cam.fov - stationFov) > 0.01) {
        cam.fov = THREE.MathUtils.lerp(cam.fov, stationFov, 0.05);
        cam.updateProjectionMatrix();
      }
      return;
    }

    // ── Spatial mode: full spring-interpolated camera ──
    const effectiveDamping = reducedMotion ? 0.15 : spatialDamping;
    const lerpFactor = 1 - Math.pow(1 - effectiveDamping, delta * 60);

    // Interpolate position
    cam.position.lerp(positionTarget.current, lerpFactor);

    // Interpolate lookAt
    currentLookAt.current.lerp(lookAtTarget.current, lerpFactor);
    cam.lookAt(currentLookAt.current);

    // Interpolate FOV
    if (Math.abs(cam.fov - cameraTarget.fov) > 0.01) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, cameraTarget.fov, lerpFactor);
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
  });

  return null;
}
