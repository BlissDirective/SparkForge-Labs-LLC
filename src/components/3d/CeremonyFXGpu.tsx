'use client';

// ════════════════════════════════════════════════════════════════
// CeremonyFXGpu — GPU-driven Ceremony Sub-components (Sub 5/6)
// ════════════════════════════════════════════════════════════════
//
// GPU variants of CeremonyFX sub-components: positions/velocities/
// colors are read from TSL storage buffers populated by the compute
// kernels in `ceremonyFXCompute.ts`. The InstancedMesh material uses
// MeshBasicNodeMaterial with its positionNode / colorNode bound to
// the per-instance storage lookups, so the GPU both updates and
// reads the particle data — zero per-frame CPU work.
//
// Used by CeremonyFX.tsx when `useCeremonyCompute()` returns a
// system (renderer is WebGPU). On WebGL2, CeremonyFX keeps rendering
// the CPU path and these components are never mounted.
//
// Mythos MoE lens: the GPU variants are the "specialized experts"
// routed to when the WebGPU input signal matches. CPU variants are
// the "shared experts" — always available, absorbing the general
// case.
// ════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef } from 'react';
import {
  InstancedMesh,
  BoxGeometry,
  SphereGeometry,
  IcosahedronGeometry,
  MathUtils,
} from 'three';
import type {
  CeremonyComputeSystem,
  ConfettiBuffers,
  FireworkBuffers,
  TrophyBuffers,
  ShowerBuffers,
} from '@/lib/3d/ceremonyFXCompute';
import { CEREMONY_PARTICLE_COUNTS } from '@/lib/3d/ceremonyFXCompute';

// Minimal narrowing — material & node imports are dynamic to keep
// three/webgpu out of the WebGL user path's bundle.
type NodeMaterialLike = {
  positionNode?: unknown;
  colorNode?: unknown;
  transparent?: boolean;
  opacity?: number;
  dispose?: () => void;
};

/** Shared material factory. Creates a MeshBasicNodeMaterial with
 *  positionNode bound to the given storage buffer's per-instance
 *  position, and colorNode bound to the colors buffer (vec4 RGBA).
 *  The buffer param types are loose because three/tsl StorageBufferNode
 *  generics don't expose a public `element(idx)` signature matching our
 *  runtime usage — duck-typed at runtime, verified by TSL's own type
 *  checks when the kernel is compiled. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createNodeMaterial(
  positions: any,
  colors: any,
): Promise<NodeMaterialLike | null> {
  try {
    const [{ instanceIndex }, webgpu] = await Promise.all([
      import('three/tsl'),
      import('three/webgpu'),
    ]);
    const Mat = (webgpu as { MeshBasicNodeMaterial?: new () => NodeMaterialLike })
      .MeshBasicNodeMaterial;
    if (!Mat) return null;
    const mat = new Mat();
    mat.positionNode = positions.element(instanceIndex);
    mat.colorNode = colors.element(instanceIndex);
    mat.transparent = true;
    return mat;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// GPU Confetti
// ────────────────────────────────────────────────────────────────

export function GpuConfettiBurst({ system }: { system: CeremonyComputeSystem }) {
  const meshRef = useRef<InstancedMesh>(null);
  const matRef = useRef<NodeMaterialLike | null>(null);
  const b = system.confetti.buffers as ConfettiBuffers;

  const geometry = useMemo(() => new BoxGeometry(0.04, 0.016, 0.04), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mat = await createNodeMaterial(b.positions, b.colors);
      if (cancelled || !mat || !meshRef.current) return;
      matRef.current = mat;
      // Assign material imperatively to avoid JSX reconciliation issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (meshRef.current as unknown as { material: any }).material = mat;
    })();
    return () => {
      cancelled = true;
      matRef.current?.dispose?.();
      matRef.current = null;
    };
  }, [b.positions, b.colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, CEREMONY_PARTICLE_COUNTS.confetti]}
      frustumCulled={false}
    />
  );
}

// ────────────────────────────────────────────────────────────────
// GPU Firework Bursts
// ────────────────────────────────────────────────────────────────

export function GpuFireworkBursts({ system }: { system: CeremonyComputeSystem }) {
  const meshRef = useRef<InstancedMesh>(null);
  const matRef = useRef<NodeMaterialLike | null>(null);
  const b = system.firework.buffers as FireworkBuffers;

  const geometry = useMemo(() => new SphereGeometry(0.03, 6, 6), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mat = await createNodeMaterial(b.positions, b.colors);
      if (cancelled || !mat || !meshRef.current) return;
      matRef.current = mat;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (meshRef.current as unknown as { material: any }).material = mat;
    })();
    return () => {
      cancelled = true;
      matRef.current?.dispose?.();
      matRef.current = null;
    };
  }, [b.positions, b.colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, CEREMONY_PARTICLE_COUNTS.firework]}
      frustumCulled={false}
    />
  );
}

// ────────────────────────────────────────────────────────────────
// GPU Trophy Popup (Sub 6)
// ────────────────────────────────────────────────────────────────

export function GpuTrophyPopup({ system }: { system: CeremonyComputeSystem }) {
  const meshRef = useRef<InstancedMesh>(null);
  const matRef = useRef<NodeMaterialLike | null>(null);
  const b = system.trophy.buffers as TrophyBuffers;

  const geometry = useMemo(() => new IcosahedronGeometry(0.04, 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mat = await createNodeMaterial(b.positions, b.colors);
      if (cancelled || !mat || !meshRef.current) return;
      matRef.current = mat;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (meshRef.current as unknown as { material: any }).material = mat;
    })();
    return () => {
      cancelled = true;
      matRef.current?.dispose?.();
      matRef.current = null;
    };
  }, [b.positions, b.colors]);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, CEREMONY_PARTICLE_COUNTS.trophy]}
        frustumCulled={false}
      />
    </group>
  );
}

// ────────────────────────────────────────────────────────────────
// GPU Particle Shower (Sub 6)
// ────────────────────────────────────────────────────────────────

export function GpuParticleShower({ system }: { system: CeremonyComputeSystem }) {
  const meshRef = useRef<InstancedMesh>(null);
  const matRef = useRef<NodeMaterialLike | null>(null);
  const b = system.shower.buffers as ShowerBuffers;

  const geometry = useMemo(() => new SphereGeometry(0.015, 4, 4), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mat = await createNodeMaterial(b.positions, b.colors);
      if (cancelled || !mat || !meshRef.current) return;
      matRef.current = mat;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (meshRef.current as unknown as { material: any }).material = mat;
    })();
    return () => {
      cancelled = true;
      matRef.current?.dispose?.();
      matRef.current = null;
    };
  }, [b.positions, b.colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, CEREMONY_PARTICLE_COUNTS.shower]}
      frustumCulled={false}
    />
  );
}

// Suppress unused-vars on MathUtils helper (reserved for future feature-gating)
void MathUtils;
