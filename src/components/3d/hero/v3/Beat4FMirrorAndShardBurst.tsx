'use client';

/**
 * Beat 4 — F Mirror + Shard Burst (8.0 → 11.0 s)
 *
 * Storyboard §6:
 *   - Camera (parent-driven): (-0.4,+0.2,7.5) → (+0.4,+0.2,7.5) lateral dolly
 *   - Subjects:
 *     SfMark3D revealMask=['sf-mark-S','sf-mark-F'] — F now visible
 *     SfShardSet — Voronoi pre-fracture from F's ExtrudeGeometry, visible
 *       only during burst (progress 0.67 → 1.0)
 *     Bloom flash sphere at F center — peaks at detonation
 *   - F material animation (compressed to first 0.33 progress):
 *     transmission 0 → 0.97 over progress 0.0 → 0.33
 *     dispersionStrength 0 → 0.108 → 0.072 (peak progress 0.20)
 *     dichroicIntensity 0 → 1.0
 *     emissiveIntensity 0 → 1.2 (peak progress 0.18) → 0.5
 *   - Detonation @ progress=0.67 (t=10.0):
 *     F becomes invisible
 *     SfShardSet appears with random velocity + angular velocity
 *     Bloom sphere emissiveIntensity 0 → 4.0 (instant) → 0 over 0.33 progress
 *     Camera shake spike 0 → 0.08 → 0 (parent-driven; passed via shakeRef)
 *     Lensflare double-pulse 1.0 → 2.2 → 1.0
 *   - Per-shard physics (matches v2 constants):
 *     velocity 2.5-6.0 u/s outward, biased upward +1.5
 *     angular velocity ±6 rad/s on each axis
 *     gravity −4.5 u/s², damping 0.985, angular damping 0.99
 *
 * For the 5b prep this beat fractures a placeholder F-bbox BoxGeometry.
 * Phase 5c integration replaces with the real F-glyph ExtrudeGeometry
 * captured from SfMark3D's path data.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type MeshPhysicalMaterial,
} from 'three';
import { val } from '@theatre/core';
import { SfMark3D } from '@/components/3d/branding/SfMark3D';
import { LensflareTSL } from '@/components/3d/branding/LensflareTSL';
import {
  SfShardSet,
  type SfShardSetHandle,
  type ShardTier,
} from '@/components/3d/branding/SfShardSet';
import { heroBeat4 } from '@/lib/hero/heroTheatreProject';
import { PALETTE } from '@/lib/branding/sf-material.config';

// ─────────────────────────────────────────────────────────────────────
// Curves (mirrors Beat 3)
// ─────────────────────────────────────────────────────────────────────

function rampLinear(progress: number, t0: number, t1: number, from: number, to: number): number {
  if (progress <= t0) return from;
  if (progress >= t1) return to;
  const u = (progress - t0) / (t1 - t0);
  return from + u * (to - from);
}

function peakSettle(progress: number, peakAt: number, peakValue: number, settleValue: number): number {
  const t = Math.max(0, Math.min(1, progress));
  if (t <= peakAt) {
    const u = peakAt > 0 ? t / peakAt : 1;
    return Math.pow(u, 0.65) * peakValue;
  }
  const u = (t - peakAt) / (1 - peakAt);
  return peakValue + Math.pow(u, 2.0) * (settleValue - peakValue);
}

// ─────────────────────────────────────────────────────────────────────
// Per-shard physics state
// ─────────────────────────────────────────────────────────────────────

interface ShardPhysicsState {
  velocity: Vector3;
  angularVelocity: Vector3;
  initialPos: Vector3;
}

function initShardPhysics(count: number, seed = 42): ShardPhysicsState[] {
  // Mulberry32 — matches v2 fracture seed
  let s = seed | 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const states: ShardPhysicsState[] = [];
  for (let i = 0; i < count; i++) {
    const speed = 2.5 + rng() * 3.5;
    const theta = rng() * Math.PI * 2;
    const phi = (rng() - 0.35) * Math.PI * 0.9;
    states.push({
      velocity: new Vector3(
        Math.sin(theta) * Math.cos(phi) * speed,
        Math.sin(phi) * speed + 1.5,
        Math.cos(theta) * Math.cos(phi) * speed,
      ),
      angularVelocity: new Vector3(
        (rng() - 0.5) * 6,
        (rng() - 0.5) * 6,
        (rng() - 0.5) * 6,
      ),
      initialPos: new Vector3(0, 0, 0),
    });
  }
  return states;
}

const TIER_BY_INDEX: ShardTier[] = ['ultra', 'high', 'mid', 'low'];

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export interface Beat4Props {
  /** 0..1 progress through the beat. */
  progress: number;
  /** Whether this beat is currently active. */
  active: boolean;
}

const DETONATION_PROGRESS = 0.67;
const F_CRYSTAL_END = 0.33; // F finishes crystallizing here

export function Beat4FMirrorAndShardBurst({ progress, active }: Beat4Props) {
  const sfMarkGroup = useRef<Group | null>(null);
  const shardHandle = useRef<SfShardSetHandle | null>(null);
  const physicsRef = useRef<ShardPhysicsState[]>([]);
  const prevProgress = useRef(0);

  // Bloom flash sphere refs
  const bloomMeshRef = useRef<Mesh>(null);
  const bloomMatRef = useRef<MeshBasicMaterial>(null);

  // Theatre tunables (read once per active toggle)
  const tunables = useMemo(() => {
    if (!active) {
      return {
        bloomPeak: 4.0,
        flarePulse: 2.2,
        tier: 'ultra' as ShardTier,
      };
    }
    const tierIdx = Math.max(0, Math.min(3, Math.round(Number(val(heroBeat4.props.shardCountTier)))));
    return {
      bloomPeak: Number(val(heroBeat4.props.bloomPeakIntensity)),
      flarePulse: Number(val(heroBeat4.props.lensflareDoublePulse)),
      tier: TIER_BY_INDEX[tierIdx],
    };
  }, [active]);

  // Placeholder F-bbox geometry for the shard set (real F-glyph
  // ExtrudeGeometry wired in 5c integration).
  const shardSourceGeometry = useMemo(() => new BoxGeometry(1.6, 2.2, 0.5, 4, 4, 4), []);

  // Initialize physics when shard set is ready
  useEffect(() => {
    if (!active) return;
    const handle = shardHandle.current;
    if (!handle) return;
    physicsRef.current = initShardPhysics(handle.shardCount, 42);
  }, [active, tunables.tier]);

  useFrame(() => {
    if (!active) {
      prevProgress.current = 0;
      return;
    }

    // Estimate per-frame dt from progress delta — beat duration is 3.0 s
    const dt = Math.max(0, Math.min(0.05, (progress - prevProgress.current) * 3.0));
    prevProgress.current = progress;

    // ─── F crystallization (progress 0 → 0.33) ───
    const fTransmission = rampLinear(progress, 0.0, F_CRYSTAL_END, 0, 0.97);
    const fDispersion = peakSettle(progress, F_CRYSTAL_END * 0.6, 0.108, 0.072);
    const fDichroic = rampLinear(progress, 0.05, F_CRYSTAL_END * 0.95, 0, 1.0);
    const fEmissive = peakSettle(progress, F_CRYSTAL_END * 0.55, 1.2, 0.5);
    const fVisible = progress < DETONATION_PROGRESS;

    // ─── Walk SfMark group to update F material + visibility ───
    if (sfMarkGroup.current) {
      sfMarkGroup.current.traverse((obj) => {
        if (!(obj instanceof Mesh)) return;
        const pathId = (obj.userData as { sfMarkPathId?: string } | undefined)?.sfMarkPathId;
        if (!pathId) return;

        const mat = obj.material as MeshPhysicalMaterial;
        if (!mat) return;

        if (pathId.startsWith('sf-mark-F')) {
          obj.visible = fVisible;
          mat.transmission = fTransmission;
          mat.dispersion = fDispersion * 4.0;
          mat.emissiveIntensity = fEmissive;
          const sfUniforms = (mat as unknown as { __sfUniforms?: { dichroicIntensity?: { value: number } } }).__sfUniforms;
          if (sfUniforms?.dichroicIntensity) {
            sfUniforms.dichroicIntensity.value = fDichroic;
          }
        } else if (pathId.startsWith('sf-mark-S')) {
          // S stays at baseline (already crystallized in Beat 3)
          mat.transmission = 0.97;
          mat.dispersion = 0.072 * 4.0;
          mat.emissiveIntensity = 0.3;
        }
      });
    }

    // ─── Shard burst (progress >= 0.67) ───
    const burstActive = progress >= DETONATION_PROGRESS;
    const handle = shardHandle.current;
    if (handle && burstActive && physicsRef.current.length > 0) {
      const meshes = handle.meshes();
      const burstProg = (progress - DETONATION_PROGRESS) / (1 - DETONATION_PROGRESS); // 0..1 within burst
      const fadeOut = burstProg > 0.6 ? Math.max(0, 1 - (burstProg - 0.6) / 0.4) : 1.0;
      const GRAVITY = -4.5;
      const DAMPING = 0.985;
      const ANGULAR_DAMPING = 0.99;

      for (let i = 0; i < meshes.length && i < physicsRef.current.length; i++) {
        const mesh = meshes[i];
        const phys = physicsRef.current[i];
        if (!mesh || !phys) continue;
        mesh.visible = true;
        phys.velocity.y += GRAVITY * dt;
        phys.velocity.multiplyScalar(DAMPING);
        phys.angularVelocity.multiplyScalar(ANGULAR_DAMPING);
        mesh.position.addScaledVector(phys.velocity, dt);
        mesh.rotation.x += phys.angularVelocity.x * dt;
        mesh.rotation.y += phys.angularVelocity.y * dt;
        mesh.rotation.z += phys.angularVelocity.z * dt;
        // Per-mesh material opacity ramps via emissive (BrandingMaterial
        // doesn't expose per-mesh transparent toggle without rebuild,
        // so emissive fade is the visible-fade proxy for the prep).
        const mat = mesh.material as MeshPhysicalMaterial;
        if (mat) mat.emissiveIntensity = fadeOut * 1.4;
      }
    }

    // ─── Bloom flash (progress 0.67 → 1.0) ───
    if (bloomMatRef.current && bloomMeshRef.current) {
      if (burstActive) {
        const burstProg = (progress - DETONATION_PROGRESS) / (1 - DETONATION_PROGRESS);
        const intensity = Math.max(0, (1 - burstProg) * tunables.bloomPeak);
        bloomMatRef.current.opacity = Math.min(intensity * 0.18, 0.7);
        bloomMeshRef.current.visible = intensity > 0.05;
        const s = 1.0 + (1 - burstProg) * 0.8;
        bloomMeshRef.current.scale.setScalar(s);
      } else {
        bloomMeshRef.current.visible = false;
        bloomMatRef.current.opacity = 0;
      }
    }
  });

  if (!active) return null;

  // Lensflare intensities — both pulse at detonation
  const flareT = progress >= DETONATION_PROGRESS
    ? peakSettle((progress - DETONATION_PROGRESS) / (1 - DETONATION_PROGRESS), 0.05, tunables.flarePulse, 1.0)
    : 1.0;

  return (
    <group>
      <SfMark3D
        groupRef={sfMarkGroup}
        revealMask={['sf-mark-S', 'sf-mark-F']}
        italicLean={0.06}
      />

      {/* Shard set — only meaningful after detonation */}
      <SfShardSet
        ref={shardHandle}
        geometry={shardSourceGeometry}
        tier={tunables.tier}
        seed={42}
        visible={progress >= DETONATION_PROGRESS}
        emissiveIntensity={1.4}
        position={[0, 0, 0]}
      />

      {/* Bloom flash sphere — additive, depthWrite off */}
      <mesh ref={bloomMeshRef} visible={false}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial
          ref={bloomMatRef}
          color={new Color(PALETTE.amberCore)}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Lensflares double-pulse at detonation */}
      <LensflareTSL flare={0} intensityMul={flareT} streakScale={1.2} coreScale={1.0} />
      <LensflareTSL flare={1} intensityMul={flareT} streakScale={1.2} coreScale={1.0} />
    </group>
  );
}
