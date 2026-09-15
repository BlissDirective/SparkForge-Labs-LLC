'use client';

// Plate + parallax world (TAP v2.2 §2.4).
// Backdrop = display still filling the lock frustum.
// Desk = real y=0 plane (Sparky's floor in later tasks) textured from
// the plate. CorePortal (W1-02) is the TSL emitter on the painted SF
// module. Glass slabs (W1-03) overlay the painted cyan frames.

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { DoubleSide, type Group, SRGBColorSpace, Vector3 } from 'three';
import {
  FORGE_HUB_CAMERA,
  FORGE_HUB_DISPLAY_STILL,
  FORGE_HUB_LOCK_ASPECT,
  FORGE_HUB_PLATE,
  plateSizeAtDistance,
} from '@/config/forgeHub';
import { CorePortal } from './CorePortal';
import { ForgeGlassSlabs } from './ForgeGlassSlabs';
import { ForgeSlotProjector } from './ForgeSlotProjector';
import { PlaceholderSparky } from './PlaceholderSparky';

function usePlateTexture(url: string) {
  const texture = useTexture(url);
  useLayoutEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);
  return texture;
}

function plateBackdropPose() {
  const cam = new Vector3(...FORGE_HUB_CAMERA.position);
  const look = new Vector3(...FORGE_HUB_CAMERA.lookAt);
  const dir = look.clone().sub(cam).normalize();
  const pos = cam
    .clone()
    .addScaledVector(dir, FORGE_HUB_PLATE.backdropDistance);
  const size = plateSizeAtDistance(
    FORGE_HUB_PLATE.backdropDistance,
    FORGE_HUB_CAMERA.fov,
    FORGE_HUB_LOCK_ASPECT,
  );
  return { position: pos.toArray() as [number, number, number], size };
}

function PlateFrame({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const map = usePlateTexture(FORGE_HUB_DISPLAY_STILL);
  const groupRef = useRef<Group>(null);
  const { position, size } = useMemo(() => plateBackdropPose(), []);

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.lookAt(new Vector3(...FORGE_HUB_CAMERA.position));
  }, [position]);

  return (
    <group
      ref={groupRef}
      position={position}
      userData={{ forge: 'plate-frame' }}
    >
      <mesh
        frustumCulled={false}
        userData={{ forge: 'plate' }}
      >
        <planeGeometry args={[size[0], size[1]]} />
        {/* toneMapped off: the plate's pixels must reach the screen
            unchanged, or the SSIM gate measures the tone curve instead
            of the room. */}
        <meshBasicMaterial
          map={map}
          depthWrite
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <ForgeGlassSlabs plateSize={size} reducedMotion={reducedMotion} />
      <ForgeSlotProjector />
    </group>
  );
}

function DeskPlane() {
  // The painted plate already IS the desk. This plane is the y=0 floor
  // reference for Sparky's spots and a future shadow catcher; it must
  // not paint. The lit, plate-band-textured disc it replaced darkened
  // and warped the whole lower half of the room (bottom-centre SSIM
  // 0.12 in the 2026-09-15 WebGL2 capture). colorWrite off keeps it
  // invisible; depthWrite off keeps it from punching a hole in the
  // backdrop when opaque objects sort front-to-back.
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[...FORGE_HUB_PLATE.desk.position]}
      userData={{ forge: 'desk' }}
    >
      <circleGeometry args={[FORGE_HUB_PLATE.desk.radius, 48]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  );
}

export function ForgeRoom({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <group userData={{ forge: 'room' }}>
      <hemisphereLight args={['#9ad8ff', '#3a322c', 0.55]} />
      <ambientLight intensity={0.35} />
      <pointLight
        position={[0, 1.8, 0.4]}
        intensity={0.55}
        color="#7fe7ff"
        distance={8}
      />
      <PlateFrame reducedMotion={reducedMotion} />
      <DeskPlane />
      <CorePortal />
      <PlaceholderSparky />
    </group>
  );
}
