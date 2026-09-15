'use client';

// Fixed hub camera — no orbit, no cuts (TAP v2.2 §2.6).
// Idle: micro-dolly ±2% of camera distance + pointer parallax.
// `pose=lock`: freeze at FORGE_HUB_CAMERA so SSIM can capture a still.

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { FORGE_HUB_CAMERA } from '@/config/forgeHub';
import { peekDirectorClock } from '@/lib/forge-hub/director/clock';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import { useForgeStore } from '@/stores/sceneStore';

interface ForgeFixedCameraProps {
  reducedMotion: boolean;
}

export function ForgeFixedCamera({ reducedMotion }: ForgeFixedCameraProps) {
  const { camera } = useThree();
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const freeze = poseLock || reducedMotion;

  const parallaxRef = useParallaxMouse({
    smoothing: 0.06,
    intensity: 1,
    enabled: !freeze,
  });

  const lookAt = useMemo(
    () => new Vector3(...FORGE_HUB_CAMERA.lookAt),
    [],
  );
  const basePos = useMemo(
    () => new Vector3(...FORGE_HUB_CAMERA.position),
    [],
  );
  const working = useRef(new Vector3());
  const lookDir = useMemo(() => {
    const dir = lookAt.clone().sub(basePos);
    const distance = dir.length();
    dir.normalize();
    return { dir, distance };
  }, [basePos, lookAt]);

  useFrame(({ clock: frameClock }) => {
    const persp = camera as PerspectiveCamera;
    if (Math.abs(persp.fov - FORGE_HUB_CAMERA.fov) > 0.01) {
      persp.fov = FORGE_HUB_CAMERA.fov;
      persp.near = FORGE_HUB_CAMERA.near;
      persp.far = FORGE_HUB_CAMERA.far;
      persp.updateProjectionMatrix();
    }

    working.current.copy(basePos);

    const directorClock = peekDirectorClock();
    const directorOwnsDolly =
      !freeze &&
      directorClock.id != null &&
      directorClock.id !== 'welcome-idle';

    if (directorOwnsDolly) {
      const dolly = lookDir.distance * directorClock.cameraDollyPercent;
      working.current.addScaledVector(lookDir.dir, dolly);
    } else if (!freeze) {
      const dolly =
        Math.sin(frameClock.elapsedTime * 0.32) *
        lookDir.distance *
        FORGE_HUB_CAMERA.microDollyPercent;
      working.current.addScaledVector(lookDir.dir, dolly);

      const p = parallaxRef.current;
      working.current.x += p.smoothX * FORGE_HUB_CAMERA.parallax[0];
      working.current.y += -p.smoothY * FORGE_HUB_CAMERA.parallax[1];
    }

    persp.position.lerp(working.current, freeze ? 1 : 0.12);
    persp.up.set(0, 1, 0);
    persp.lookAt(lookAt);
  });

  return null;
}
