'use client';

// ════════════════════════════════════════════════════
// CinematicCamera — Smooth Camera Rail System
// ════════════════════════════════════════════════════
// Enhancement 1.1: Cinematic camera that smoothly interpolates between
// spatial views. Uses spring-like easing for natural motion.
//
// Features:
// - Smooth position + lookAt interpolation
// - FOV transitions (wide for overview, narrow for focus)
// - Spring damping for natural deceleration
// - Respects reduced-motion preference

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraTarget } from '@/stores/cockpitStore';

interface CinematicCameraProps {
  target: CameraTarget;
  damping?: number;          // Lower = smoother (0.02-0.1)
  enableOrbitDrift?: boolean; // Subtle idle drift
  reducedMotion?: boolean;
}

export function CinematicCamera({
  target,
  damping = 0.04,
  enableOrbitDrift = true,
  reducedMotion = false,
}: CinematicCameraProps) {
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3(...target.lookAt));
  const positionTarget = useRef(new THREE.Vector3(...target.position));
  const currentLookAt = useRef(new THREE.Vector3(...target.lookAt));
  const driftAngle = useRef(0);

  // Update targets when props change
  positionTarget.current.set(...target.position);
  lookAtTarget.current.set(...target.lookAt);

  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    const effectiveDamping = reducedMotion ? 0.15 : damping;
    const lerpFactor = 1 - Math.pow(1 - effectiveDamping, delta * 60);

    // Interpolate position
    cam.position.lerp(positionTarget.current, lerpFactor);

    // Interpolate lookAt
    currentLookAt.current.lerp(lookAtTarget.current, lerpFactor);
    cam.lookAt(currentLookAt.current);

    // Interpolate FOV
    if (Math.abs(cam.fov - target.fov) > 0.01) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, target.fov, lerpFactor);
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
