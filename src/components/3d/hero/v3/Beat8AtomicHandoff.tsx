'use client';

/**
 * Beat 8 — Atomic Handoff via Shatter-Into-UI (18.5 → 19.5 s)
 *
 * Storyboard §10 — User pick Q6 (shatter-into-UI) + runtime extension
 * to 19.5 s for breathing room (Beat 8 = 1.0 s).
 *
 * Mechanism:
 *   - Mini-shatter @ progress=0: ~80 shards target-assigned to cockpit
 *     UI anchor positions (no random burst — every shard has a destination).
 *   - Per-shard cubic-bezier flight 0.50 s `power3.inOut` (in beat-relative
 *     terms: progress 0 → 0.50). Shards rotate during flight (random
 *     initial angular vel ±4 rad/s, dampens to 0 at arrival).
 *   - Shard material: BrandingMaterial with emissiveIntensity boosted
 *     0.3 → 1.4 during flight (shards read as streaks of light).
 *   - On per-shard arrival: corresponding anchor flash sphere
 *     emissiveIntensity 0 → 2.0 → 0 over 0.20 s (proxy for
 *     cockpit-UI-element flash; real cockpit refs wired in 5c.6).
 *   - Wordmark source group opacity 1.0 → 0 over progress 0 → 0.50.
 *   - Hero lights ramp out (parent-driven).
 *   - Rolling shimmer overlay deferred to 5c.6 (needs cockpit context).
 *   - At progress ≥ 0.99: onHandoffComplete() callback fires →
 *     HeroAnimation v3 (5c.6) calls setHeroPhase('complete') +
 *     setCockpitReady(true). /dev/hero-v3 just logs.
 *
 * UI anchor distribution (storyboard §10, ultra tier 80 shards total):
 *   - Central display: 16
 *   - 4 consoles (NE/NW/SE/SW): 12 each = 48
 *   - 10 lab-map nodes: 1 each = 10
 *   - Peripheral HUD frame: 4
 *   - Status bar segments: 2
 *   Lower tiers proportionally fewer, minimum 1 per anchor on 30-shard tier.
 */

import { useRef, useEffect, useMemo } from 'react';
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
import {
  SfShardSet,
  type SfShardSetHandle,
  type ShardTier,
  SHARD_COUNT_TIERS_BEAT8,
} from '@/components/3d/branding/SfShardSet';
import { SparkForgeWordmark3D } from '@/components/3d/branding/SparkForgeWordmark3D';
import { heroBeat4 } from '@/lib/hero/heroTheatreProject';
import { PALETTE } from '@/lib/branding/sf-material.config';

// ─────────────────────────────────────────────────────────────────────
// UI anchor positions (placeholder layout — real cockpit refs in 5c.6)
// ─────────────────────────────────────────────────────────────────────

interface UiAnchor {
  id: string;
  position: Vector3;
  /** How many shards target this anchor (per ultra-tier 80-shard plan). */
  shardWeight: number;
  /** Optional color override for the flash. Defaults to rimCyan. */
  color?: string;
}

const UI_ANCHORS: UiAnchor[] = [
  // Central display: 16 shards (most important)
  { id: 'central', position: new Vector3(0, 3.0, -0.5), shardWeight: 16, color: PALETTE.cyanKick },
  // 4 consoles (NE/NW/SE/SW): 12 each
  { id: 'console-NE', position: new Vector3(2.6, 4.4, -1.0), shardWeight: 12 },
  { id: 'console-NW', position: new Vector3(-2.6, 4.4, -1.0), shardWeight: 12 },
  { id: 'console-SE', position: new Vector3(2.6, 1.6, -1.0), shardWeight: 12 },
  { id: 'console-SW', position: new Vector3(-2.6, 1.6, -1.0), shardWeight: 12 },
  // 10 lab-map nodes: 1 each
  ...Array.from({ length: 10 }, (_, i): UiAnchor => {
    const a = (i / 10) * Math.PI * 2;
    return {
      id: `lab-${i}`,
      position: new Vector3(Math.cos(a) * 1.6, 3.0 + Math.sin(a) * 0.4, 0.5),
      shardWeight: 1,
      color: PALETTE.dispersionMag,
    };
  }),
  // Peripheral HUD frame: 4
  { id: 'hud-top', position: new Vector3(0, 5.6, -0.2), shardWeight: 1 },
  { id: 'hud-bottom', position: new Vector3(0, 0.4, -0.2), shardWeight: 1 },
  { id: 'hud-left', position: new Vector3(-3.6, 3.0, -0.2), shardWeight: 1 },
  { id: 'hud-right', position: new Vector3(3.6, 3.0, -0.2), shardWeight: 1 },
  // Status bar segments: 2
  { id: 'status-left', position: new Vector3(-1.6, 0.0, 0), shardWeight: 1 },
  { id: 'status-right', position: new Vector3(1.6, 0.0, 0), shardWeight: 1 },
];

const TOTAL_ULTRA_WEIGHT = UI_ANCHORS.reduce((s, a) => s + a.shardWeight, 0); // = 80

// ─────────────────────────────────────────────────────────────────────
// Shard target assignment (deterministic, weight-distributed)
// ─────────────────────────────────────────────────────────────────────

/** For a given shard count, assigns each shard index to one anchor index. */
function assignShardsToAnchors(shardCount: number): number[] {
  const assignments: number[] = [];
  // Weight-proportional distribution. Each anchor gets
  // round(shardCount * weight / TOTAL_ULTRA_WEIGHT) shards, minimum 1.
  let assigned = 0;
  UI_ANCHORS.forEach((anchor, anchorIdx) => {
    const slice = Math.max(1, Math.round((shardCount * anchor.shardWeight) / TOTAL_ULTRA_WEIGHT));
    for (let i = 0; i < slice && assigned < shardCount; i++) {
      assignments.push(anchorIdx);
      assigned++;
    }
  });
  // If we under-assigned (rounding), top up with central anchor
  while (assigned < shardCount) {
    assignments.push(0);
    assigned++;
  }
  return assignments;
}

// ─────────────────────────────────────────────────────────────────────
// Physics state per shard
// ─────────────────────────────────────────────────────────────────────

interface ShardFlightState {
  start: Vector3;
  target: Vector3;
  /** Lift amount for the arc curve (0 = straight line, 0.5 = high arc). */
  loft: number;
  /** Initial angular velocity (rad/s); dampens to 0 at arrival. */
  angularVelocity: Vector3;
  /** Per-shard flight start delay (0..0.05 s) so they don't all leave
   *  in lockstep — adds visual staggering. */
  startDelay: number;
}

function initFlightStates(count: number, anchorAssignments: number[], seed = 42): ShardFlightState[] {
  let s = seed | 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const states: ShardFlightState[] = [];
  for (let i = 0; i < count; i++) {
    const anchorIdx = anchorAssignments[i] ?? 0;
    const anchor = UI_ANCHORS[anchorIdx];
    states.push({
      start: new Vector3(0, 0, 0), // updated at first useFrame from mesh.position
      target: anchor.position.clone(),
      loft: 0.3 + rng() * 0.4, // 0.3 to 0.7 random arc loft
      angularVelocity: new Vector3(
        (rng() - 0.5) * 8,
        (rng() - 0.5) * 8,
        (rng() - 0.5) * 8,
      ),
      startDelay: rng() * 0.05,
    });
  }
  return states;
}

// ─────────────────────────────────────────────────────────────────────
// Curves
// ─────────────────────────────────────────────────────────────────────

function power3InOut(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function arcLerp(start: Vector3, end: Vector3, t: number, loft: number, out: Vector3): Vector3 {
  out.lerpVectors(start, end, t);
  // Add upward arc — sin(πt) peaks at t=0.5
  out.y += Math.sin(t * Math.PI) * loft;
  return out;
}

function smoothBell(t: number, peakAt = 0.5): number {
  const x = Math.max(0, Math.min(1, t));
  let u: number;
  if (x <= peakAt) u = peakAt > 0 ? x / peakAt : 1;
  else u = 1 - (x - peakAt) / (1 - peakAt);
  return u * u * (3 - 2 * u);
}

const TIER_BY_INDEX: ShardTier[] = ['ultra', 'high', 'mid', 'low'];
const FLIGHT_END_PROGRESS = 0.50; // shards finish flight by t=19.0

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export interface Beat8Props {
  progress: number;
  active: boolean;
  /** Optional callback at progress ≥ 0.99 — HeroAnimation v3 fires
   *  setHeroPhase('complete') + setCockpitReady(true). */
  onHandoffComplete?: () => void;
}

export function Beat8AtomicHandoff({ progress, active, onHandoffComplete }: Beat8Props) {
  const shardHandle = useRef<SfShardSetHandle | null>(null);
  const wordmarkOuterRef = useRef<Group>(null);
  const flightStatesRef = useRef<ShardFlightState[]>([]);
  const anchorFlashRefs = useRef<Mesh[]>([]);
  const anchorFlashMatRefs = useRef<MeshBasicMaterial[]>([]);
  const anchorArrivalTimesRef = useRef<Map<number, number>>(new Map());
  const completedRef = useRef(false);

  // Theatre-tunable tier (reuse heroBeat4.shardCountTier — same scale)
  const tier = useMemo<ShardTier>(() => {
    if (!active) return 'ultra';
    const idx = Math.max(0, Math.min(3, Math.round(Number(val(heroBeat4.props.shardCountTier)))));
    return TIER_BY_INDEX[idx];
  }, [active]);

  const shardCount = SHARD_COUNT_TIERS_BEAT8[tier];

  // Pre-compute anchor assignments for this shard count
  const anchorAssignments = useMemo(() => assignShardsToAnchors(shardCount), [shardCount]);

  // Placeholder source geometry (real wordmark ExtrudeGeometry wired in 5c.6)
  const shardSourceGeometry = useMemo(
    () => new BoxGeometry(6.0, 1.4, 0.5, 4, 4, 4),
    [],
  );

  // Initialize flight states when shard set is ready
  useEffect(() => {
    if (!active) {
      completedRef.current = false;
      anchorArrivalTimesRef.current.clear();
      return;
    }
    const handle = shardHandle.current;
    if (!handle) return;
    flightStatesRef.current = initFlightStates(handle.shardCount, anchorAssignments, 42);

    // Capture initial mesh positions as flight starts (one frame later via raf)
    requestAnimationFrame(() => {
      const meshes = handle.meshes();
      flightStatesRef.current.forEach((state, i) => {
        const mesh = meshes[i];
        if (mesh) state.start.copy(mesh.position);
      });
    });
  }, [active, anchorAssignments]);

  useFrame((_, dt) => {
    if (!active) return;
    const handle = shardHandle.current;
    if (!handle) return;
    const meshes = handle.meshes();
    const states = flightStatesRef.current;

    // Beat duration: 1.0 s
    const beatTime = progress * 1.0;
    const tmp = new Vector3();

    // ─── Per-shard flight ───
    for (let i = 0; i < meshes.length && i < states.length; i++) {
      const mesh = meshes[i];
      const state = states[i];
      if (!mesh || !state) continue;

      // Compute per-shard flight progress within the FLIGHT_END_PROGRESS window,
      // accounting for stagger delay.
      const flightT = (beatTime - state.startDelay) / FLIGHT_END_PROGRESS;
      const t = Math.max(0, Math.min(1, flightT));
      const eased = power3InOut(t);

      mesh.visible = true;
      arcLerp(state.start, state.target, eased, state.loft, tmp);
      mesh.position.copy(tmp);

      // Rotation — angular velocity dampens with flight progress
      const angDamp = 1 - eased;
      mesh.rotation.x += state.angularVelocity.x * dt * angDamp;
      mesh.rotation.y += state.angularVelocity.y * dt * angDamp;
      mesh.rotation.z += state.angularVelocity.z * dt * angDamp;

      // Emissive boost during flight; fades to 0 at arrival
      const mat = mesh.material as MeshPhysicalMaterial;
      if (mat) {
        mat.emissiveIntensity = (1.4 * (1 - eased)) + (0.3 * eased);
      }

      // Track first-arrival per anchor
      if (t >= 1.0) {
        const anchorIdx = anchorAssignments[i];
        if (anchorIdx !== undefined && !anchorArrivalTimesRef.current.has(anchorIdx)) {
          anchorArrivalTimesRef.current.set(anchorIdx, beatTime);
        }
      }
    }

    // ─── Per-anchor flash on first shard arrival ───
    UI_ANCHORS.forEach((_, anchorIdx) => {
      const arrivedAt = anchorArrivalTimesRef.current.get(anchorIdx);
      const flashMesh = anchorFlashRefs.current[anchorIdx];
      const flashMat = anchorFlashMatRefs.current[anchorIdx];
      if (!flashMesh || !flashMat) return;
      if (arrivedAt === undefined) {
        flashMesh.visible = false;
        return;
      }
      // Bell flash 0 → 2.0 → 0 over 0.20 s after arrival
      const age = beatTime - arrivedAt;
      if (age < 0 || age > 0.20) {
        flashMesh.visible = false;
        return;
      }
      flashMesh.visible = true;
      const intensity = smoothBell(age / 0.20) * 2.0;
      flashMat.opacity = Math.min(intensity * 0.5, 0.9);
      const s = 0.3 + intensity * 0.4;
      flashMesh.scale.setScalar(s);
    });

    // ─── Wordmark fade ───
    if (wordmarkOuterRef.current) {
      // Opacity decays 1.0 → 0 over progress 0..0.5 (power2.in)
      const fadeT = Math.max(0, Math.min(1, beatTime / 0.5));
      const opacity = 1 - fadeT * fadeT;
      wordmarkOuterRef.current.visible = opacity > 0.01;
      // Apply opacity through traverse — wordmark mat doesn't have a single opacity prop,
      // so we use group visible toggle for the prep (a true opacity ramp would mutate
      // each letter's material.transparent + opacity per frame).
    }

    // ─── Atomic handoff signal at progress ≥ 0.99 ───
    if (progress >= 0.99 && !completedRef.current) {
      completedRef.current = true;
      onHandoffComplete?.();
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Source wordmark — visible for first half of beat then unmounted */}
      <group ref={wordmarkOuterRef}>
        <SparkForgeWordmark3D italicLean={0.06} />
      </group>

      {/* Shard set — target-assigned to UI anchors */}
      <SfShardSet
        ref={shardHandle}
        geometry={shardSourceGeometry}
        tier={tier}
        useBeat8Counts
        seed={42}
        visible
        emissiveIntensity={1.4}
      />

      {/* Per-anchor flash spheres — placeholders for cockpit UI element flashes */}
      {UI_ANCHORS.map((anchor, i) => (
        <mesh
          key={anchor.id}
          ref={(el) => { if (el) anchorFlashRefs.current[i] = el; }}
          position={anchor.position}
          visible={false}
        >
          <sphereGeometry args={[0.4, 12, 12]} />
          <meshBasicMaterial
            ref={(el) => { if (el) anchorFlashMatRefs.current[i] = el; }}
            color={new Color(anchor.color ?? PALETTE.rimCyan)}
            transparent
            opacity={0}
            depthWrite={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
