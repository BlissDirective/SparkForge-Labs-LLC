'use client';

// Glass slabs (W1-03 materials + W2 live layout). World materials —
// not a hotspot shell. `?pose=lock` keeps the painted W1-03 trio
// (HoloC on the top seed). Live modes read Stagehand `layouts.ts` so
// HoloC re-seats to {31.2, 24, 37.6×48}. Director lerps those targets
// during morphs; it does not invent registry rects. Edge glow +
// scanline via TSL; breathe is a mesh scale loop. Freeze under
// reduced motion and pose=lock. freezeBreathe snaps breathe off.

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  EdgesGeometry,
  type Group,
  type LineSegments,
  type Mesh,
  PlaneGeometry,
} from 'three';
import { isWebGPURenderer } from '@/lib/3d/webgpuRenderer';
import { FORGE_HUB_GLASS } from '@/config/forgeHub';
import {
  percentRectToLocal,
  type GlassSlotId,
} from '@/lib/forge-hub/glassSlots';
import { liveDirectorSlot } from '@/lib/forge-hub/director/targets';
import { peekDirectorClock } from '@/lib/forge-hub/director/clock';
import { glassSlotsForView, type LayoutSlot } from '@/lib/forge-hub/layouts';
import {
  PANEL_BREATHE_PHASE_S,
  panelBreatheScale,
} from '@/lib/forge-hub/panelBreathe';
import {
  registerSlotAnchor,
  unregisterSlotAnchor,
} from '@/lib/forge-hub/slotAnchors';
import { useForgeStore } from '@/stores/sceneStore';
import { createGlassSlabMaterial } from '@/shaders/tsl/forgeGlassTSL';

interface ForgeGlassSlabsProps {
  plateSize: readonly [number, number];
  reducedMotion: boolean;
}

interface SlabProps {
  slot: LayoutSlot;
  plateSize: readonly [number, number];
  freeze: boolean;
}

/** Ambient panelBreathe is Stagehand. Director freezeBreathe snaps it off. */
function slabScale(
  elapsedSec: number,
  phase: number,
  freeze: boolean,
): number {
  const clock = peekDirectorClock();
  const breathe = clock.freezeBreathe
    ? 1
    : panelBreatheScale(elapsedSec, phase, freeze);
  return breathe * clock.appearScale;
}

function applyLivePose(
  group: Group,
  mesh: Mesh,
  slot: LayoutSlot,
  plateSize: readonly [number, number],
  scale: number,
) {
  const local = percentRectToLocal(slot, plateSize[0], plateSize[1]);
  group.position.set(
    local.x + local.pivotX,
    local.y,
    FORGE_HUB_GLASS.lift,
  );
  group.rotation.set(0, local.yawRad, 0);
  group.scale.setScalar(scale);
  mesh.position.set(-local.pivotX, 0, 0);
  mesh.scale.set(local.width, local.height, 1);
}

function useSlotAnchor(
  id: GlassSlotId,
  meshRef: { current: Mesh | null },
) {
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    registerSlotAnchor(id, mesh);
    return () => unregisterSlotAnchor(id, mesh);
  }, [id, meshRef]);
}

function GlassSlabGpu({ slot, plateSize, freeze }: SlabProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const glass = useMemo(() => createGlassSlabMaterial(), []);
  const phase = PANEL_BREATHE_PHASE_S[slot.id];
  useSlotAnchor(slot.id, meshRef);

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
    const store = useForgeStore.getState().forge;
    const live = liveDirectorSlot(slot.id, store.mode, store.poseLock);
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;
    if (!live) {
      group.visible = false;
      return;
    }
    group.visible = true;
    const scale = slabScale(state.clock.elapsedTime, phase, freeze);
    applyLivePose(group, mesh, live, plateSize, scale);
    glass.uniforms.uTime.value = freeze ? 0 : state.clock.elapsedTime;
    glass.uniforms.uBreathe.value = scale;
    glass.uniforms.uFrozen.value =
      freeze || peekDirectorClock().freezeBreathe ? 1 : 0;
  });

  return (
    <group ref={groupRef} userData={{ forge: 'glass', slot: slot.id }}>
      <mesh
        ref={meshRef}
        material={glass.material}
        userData={{ forge: `glass-${slot.id}` }}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}

function GlassSlabFallback({ slot, plateSize, freeze }: SlabProps) {
  const groupRef = useRef<Group>(null);
  const fillRef = useRef<Mesh>(null);
  const edgeRef = useRef<LineSegments>(null);
  const cyan = useMemo(() => new Color('#4de9ff'), []);
  // Outline only. A `wireframe` plane also draws the triangle diagonal,
  // which showed up as a corner-to-corner line across every painted
  // panel in the WebGL2 SSIM capture (2026-09-15, score 0.717).
  const edgeGeometry = useMemo(
    () => new EdgesGeometry(new PlaneGeometry(1, 1)),
    [],
  );
  useEffect(() => () => edgeGeometry.dispose(), [edgeGeometry]);
  const phase = PANEL_BREATHE_PHASE_S[slot.id];
  useSlotAnchor(slot.id, fillRef);

  useFrame((state) => {
    const store = useForgeStore.getState().forge;
    const live = liveDirectorSlot(slot.id, store.mode, store.poseLock);
    const group = groupRef.current;
    const fill = fillRef.current;
    const edge = edgeRef.current;
    if (!group || !fill) return;
    if (!live) {
      group.visible = false;
      return;
    }
    group.visible = true;
    const scale = slabScale(state.clock.elapsedTime, phase, freeze);
    applyLivePose(group, fill, live, plateSize, scale);
    if (edge) {
      edge.position.copy(fill.position);
      edge.scale.copy(fill.scale);
    }
    const fillMat = fill.material as { opacity: number };
    fillMat.opacity = 0.08 * (freeze ? 1 : 0.92 + 0.08 * scale);
    if (edge) {
      const edgeMat = edge.material as { opacity: number };
      edgeMat.opacity = 0.42 * (freeze ? 1 : 0.88 + 0.12 * scale);
    }
  });

  return (
    <group ref={groupRef} userData={{ forge: 'glass', slot: slot.id }}>
      <mesh ref={fillRef} userData={{ forge: `glass-${slot.id}` }}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#060e1c"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <lineSegments
        ref={edgeRef}
        geometry={edgeGeometry}
        userData={{ forge: 'glass-edge' }}
      >
        <lineBasicMaterial
          color={cyan}
          transparent
          opacity={0.42}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

export function ForgeGlassSlabs({
  plateSize,
  reducedMotion,
}: ForgeGlassSlabsProps) {
  const gl = useThree((s) => s.gl);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const mode = useForgeStore((s) => s.forge.mode);
  const freeze = poseLock || reducedMotion;
  const gpu = isWebGPURenderer(gl);
  const Slab = gpu ? GlassSlabGpu : GlassSlabFallback;
  const slots = glassSlotsForView(mode, poseLock);

  return (
    <group userData={{ forge: 'glass-trio' }}>
      {slots.map((slot) => (
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
