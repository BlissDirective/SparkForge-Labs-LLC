'use client';

// Three lock-pose glass slabs (W1-03). World materials — not a hotspot
// shell. Overlay the painted cyan frames on LOCKED_HERO: HoloL, HoloR,
// lock-pose HoloC (top glass). Edge glow + scanline via TSL; breathe
// is a mesh scale loop. Freeze under reduced motion and pose=lock.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type Group,
  type Mesh,
} from 'three';
import { isWebGPURenderer } from '@/lib/3d/webgpuRenderer';
import { FORGE_HUB_GLASS } from '@/config/forgeHub';
import {
  GLASS_LOCK_SLOT_LIST,
  percentRectToLocal,
  type GlassLockSlot,
} from '@/lib/forge-hub/glassSlots';
import {
  PANEL_BREATHE_PHASE_S,
  panelBreatheScale,
} from '@/lib/forge-hub/panelBreathe';
import { useForgeStore } from '@/stores/sceneStore';
import { createGlassSlabMaterial } from '@/shaders/tsl/forgeGlassTSL';

interface ForgeGlassSlabsProps {
  plateSize: readonly [number, number];
  reducedMotion: boolean;
}

interface SlabProps {
  slot: GlassLockSlot;
  plateSize: readonly [number, number];
  freeze: boolean;
}

function useLocalRect(slot: GlassLockSlot, plateSize: readonly [number, number]) {
  return useMemo(
    () => percentRectToLocal(slot, plateSize[0], plateSize[1]),
    [plateSize, slot],
  );
}

function GlassSlabGpu({ slot, plateSize, freeze }: SlabProps) {
  const groupRef = useRef<Group>(null);
  const glass = useMemo(() => createGlassSlabMaterial(), []);
  const local = useLocalRect(slot, plateSize);
  const phase = PANEL_BREATHE_PHASE_S[slot.id];

  useEffect(() => {
    const mat = glass.material;
    return () => {
      const later =
        typeof requestAnimationFrame === 'function'
          ? (cb: () => void) => requestAnimationFrame(cb)
          : (cb: () => void) => setTimeout(cb, 0);
      later(() => mat.dispose());
    };
  }, [glass.material]);

  useFrame((state) => {
    const scale = panelBreatheScale(state.clock.elapsedTime, phase, freeze);
    const group = groupRef.current;
    if (group) group.scale.setScalar(scale);
    glass.uniforms.uTime.value = freeze ? 0 : state.clock.elapsedTime;
    glass.uniforms.uBreathe.value = scale;
    glass.uniforms.uFrozen.value = freeze ? 1 : 0;
  });

  return (
    <group
      ref={groupRef}
      position={[local.x + local.pivotX, local.y, FORGE_HUB_GLASS.lift]}
      rotation={[0, local.yawRad, 0]}
      userData={{ forge: 'glass', slot: slot.id }}
    >
      <mesh
        position={[-local.pivotX, 0, 0]}
        material={glass.material}
        userData={{ forge: `glass-${slot.id}` }}
      >
        <planeGeometry args={[local.width, local.height]} />
      </mesh>
    </group>
  );
}

function GlassSlabFallback({ slot, plateSize, freeze }: SlabProps) {
  const groupRef = useRef<Group>(null);
  const fillRef = useRef<Mesh>(null);
  const edgeRef = useRef<Mesh>(null);
  const cyan = useMemo(() => new Color('#4de9ff'), []);
  const local = useLocalRect(slot, plateSize);
  const phase = PANEL_BREATHE_PHASE_S[slot.id];

  useFrame((state) => {
    const scale = panelBreatheScale(state.clock.elapsedTime, phase, freeze);
    const group = groupRef.current;
    if (group) group.scale.setScalar(scale);
    const fill = fillRef.current;
    const edge = edgeRef.current;
    if (fill) {
      const mat = fill.material as { opacity: number };
      mat.opacity = 0.08 * (freeze ? 1 : 0.92 + 0.08 * scale);
    }
    if (edge) {
      const mat = edge.material as { opacity: number };
      mat.opacity = 0.42 * (freeze ? 1 : 0.88 + 0.12 * scale);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[local.x + local.pivotX, local.y, FORGE_HUB_GLASS.lift]}
      rotation={[0, local.yawRad, 0]}
      userData={{ forge: 'glass', slot: slot.id }}
    >
      <mesh
        ref={fillRef}
        position={[-local.pivotX, 0, 0]}
        userData={{ forge: `glass-${slot.id}` }}
      >
        <planeGeometry args={[local.width, local.height]} />
        <meshBasicMaterial
          color="#060e1c"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={edgeRef}
        position={[-local.pivotX, 0, 0.002]}
        userData={{ forge: `glass-edge-${slot.id}` }}
      >
        <planeGeometry args={[local.width, local.height]} />
        <meshBasicMaterial
          color={cyan}
          transparent
          opacity={0.42}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
          wireframe
        />
      </mesh>
    </group>
  );
}

export function ForgeGlassSlabs({
  plateSize,
  reducedMotion,
}: ForgeGlassSlabsProps) {
  const gl = useThree((s) => s.gl);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const freeze = poseLock || reducedMotion;
  const gpu = isWebGPURenderer(gl);
  const Slab = gpu ? GlassSlabGpu : GlassSlabFallback;

  return (
    <group userData={{ forge: 'glass-trio' }}>
      {GLASS_LOCK_SLOT_LIST.map((slot) => (
        <Slab
          key={slot.id}
          slot={slot}
          plateSize={plateSize}
          freeze={freeze}
        />
      ))}
    </group>
  );
}
