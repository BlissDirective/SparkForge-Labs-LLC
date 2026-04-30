'use client';

/**
 * SfShardSet — Voronoi pre-fracture for the SF mark / wordmark
 *
 * Authority:
 *   - Storyboard: docs/hero-v3/Storyboard.md §6 Beat 4 (F shard burst),
 *     §10 Beat 8 (wordmark shatter-into-UI).
 *   - Action plan §10 Phase 5b.2.
 *
 * What this component does:
 *   1. Takes a source BufferGeometry (typically the SF mark or wordmark
 *      ExtrudeGeometry from Phase 2/3).
 *   2. Pre-fractures it into N shards via generateVoronoiShards()
 *      (existing v2 implementation in src/lib/3d/voronoiFracture.ts —
 *      Bowyer-Watson Delaunay → dual Voronoi tessellation).
 *   3. Mounts each shard as its own mesh with a per-instance
 *      BrandingMaterial. Per-instance materials are required because
 *      TSL node materials hold GPU pipelines per-instance — sharing
 *      breaks uniform isolation.
 *   4. Exposes per-shard mesh refs so beat components (Beat 4 in 5b,
 *      Beat 8 in 5c) can drive shard physics via useFrame from the
 *      outside without rebuilding the shard set.
 *
 * E3 GPU compute Voronoi pre-fracture (action plan §10 5b.2) is
 * deferred to a future perf pass — the existing CPU-side fracture is
 * memoized via useMemo and runs once per geometry change.
 *
 * NOT used by 5b prep (the lensflare needs no shards). Used by:
 *   - Beat 4 component (5b.3): F detonation
 *   - Beat 8 component (5c): wordmark shatter-into-UI
 */

import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Color, Group, Mesh, type BufferGeometry } from 'three';
import { generateVoronoiShards } from '@/lib/3d/voronoiFracture';
import { createBrandingMaterial, type BrandingMaterialOptions } from './BrandingMaterial';

// ─────────────────────────────────────────────────────────────────────
// Shard count tier table (per Storyboard §6 + §10)
// ─────────────────────────────────────────────────────────────────────

export const SHARD_COUNT_TIERS = {
  ultra: 500, // WebGPU desktop-ultra (Beat 4)
  high: 350,
  mid: 250,
  low: 150,   // non-WebGPU floor
} as const;

export type ShardTier = keyof typeof SHARD_COUNT_TIERS;

/**
 * Beat 8 uses smaller shard counts (target-assigned to UI anchors,
 * not random burst). Storyboard §10 spec: 80 / 60 / 40 / 30.
 */
export const SHARD_COUNT_TIERS_BEAT8 = {
  ultra: 80,
  high: 60,
  mid: 40,
  low: 30,
} as const;

// ─────────────────────────────────────────────────────────────────────
// Imperative handle for parent-driven physics
// ─────────────────────────────────────────────────────────────────────

export interface SfShardSetHandle {
  /** Number of shards actually generated (may be < requested). */
  shardCount: number;
  /** All shard mesh refs. Index matches shard generation order. */
  meshes: () => Mesh[];
  /** The wrapping group — for whole-set transforms. */
  group: () => Group | null;
}

// ─────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────

export interface SfShardSetProps {
  /** Source geometry to fracture. Typically an SF mark ExtrudeGeometry. */
  geometry: BufferGeometry;
  /** Override shard count. Defaults to tier-based count. */
  shardCount?: number;
  /** Tier select (when shardCount is not given). Default 'ultra'. */
  tier?: ShardTier;
  /** Seed for deterministic fracture. Default 42 (matches v2). */
  seed?: number;
  /** Initial visibility. Default false (Beat 4 toggles to true at detonation). */
  visible?: boolean;
  /** BrandingMaterial options applied to every shard. */
  materialOptions?: BrandingMaterialOptions;
  /** Optional: emissive boost shared across all shards (Beat 4 sets to ~1.4). */
  emissiveIntensity?: number;
  /** Position of the shard-set group. Defaults to origin. */
  position?: [number, number, number];
  /** Rotation of the shard-set group. */
  rotation?: [number, number, number];
  /** Scale of the shard-set group. */
  scale?: number | [number, number, number];
  /** Use Beat-8 reduced shard counts instead of Beat-4 burst counts. */
  useBeat8Counts?: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export const SfShardSet = forwardRef<SfShardSetHandle, SfShardSetProps>(
  function SfShardSet(
    {
      geometry,
      shardCount,
      tier = 'ultra',
      seed = 42,
      visible = false,
      materialOptions,
      emissiveIntensity = 0.3,
      position,
      rotation,
      scale,
      useBeat8Counts = false,
    },
    handleRef,
  ) {
    const groupRef = useRef<Group>(null);
    const meshRefs = useRef<Mesh[]>([]);

    const resolvedCount = useMemo(() => {
      if (typeof shardCount === 'number') return Math.max(1, Math.floor(shardCount));
      const table = useBeat8Counts ? SHARD_COUNT_TIERS_BEAT8 : SHARD_COUNT_TIERS;
      return table[tier];
    }, [shardCount, tier, useBeat8Counts]);

    // ─── Generate shards (CPU Voronoi via v2 implementation) ───
    // Memoized on geometry + count + seed; runs once per render set.
    // Audit §9.3 fix mirrored from HeroAnimation v2: keeps unrelated
    // re-renders from re-running the expensive fracture.
    const shardGeometries = useMemo(() => {
      try {
        return generateVoronoiShards(geometry, resolvedCount, seed);
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.warn(
            '[SfShardSet] Voronoi fracture failed; rendering empty set:',
            err,
          );
        }
        return [];
      }
    }, [geometry, resolvedCount, seed]);

    // Dispose shard geometries on unmount or shardData change
    useEffect(() => {
      return () => {
        shardGeometries.forEach((g) => g.dispose());
      };
    }, [shardGeometries]);

    // ─── Per-shard materials (one BrandingMaterial per shard) ───
    const materials = useMemo(() => {
      return shardGeometries.map(() => {
        const m = createBrandingMaterial({
          dichroicIntensity: materialOptions?.dichroicIntensity,
          dispersionMultiplier: materialOptions?.dispersionMultiplier,
          ior: materialOptions?.ior,
        });
        // Tweak: shards run hotter than letter material so they read as
        // streaks of light during burst (storyboard §6 Beat 4).
        m.emissive = new Color('#ffffff');
        m.emissiveIntensity = emissiveIntensity;
        return m;
      });
    }, [
      shardGeometries,
      materialOptions?.dichroicIntensity,
      materialOptions?.dispersionMultiplier,
      materialOptions?.ior,
      emissiveIntensity,
    ]);

    // Dispose materials on unmount or material set change
    useEffect(() => {
      return () => {
        materials.forEach((m) => m.dispose());
      };
    }, [materials]);

    // Live emissive update without rebuilding the materials
    useEffect(() => {
      materials.forEach((m) => {
        m.emissiveIntensity = emissiveIntensity;
      });
    }, [emissiveIntensity, materials]);

    // ─── Imperative handle for parent-driven physics ───
    useImperativeHandle(
      handleRef,
      () => ({
        shardCount: shardGeometries.length,
        meshes: () => meshRefs.current,
        group: () => groupRef.current,
      }),
      [shardGeometries.length],
    );

    // Reset meshRefs array length when shard count changes
    useEffect(() => {
      meshRefs.current = new Array(shardGeometries.length).fill(null);
    }, [shardGeometries.length]);

    return (
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scale}
        visible={visible}
      >
        {shardGeometries.map((geo, i) => (
          <mesh
            key={i}
            geometry={geo}
            material={materials[i]}
            ref={(el) => {
              if (el) meshRefs.current[i] = el;
            }}
          />
        ))}
      </group>
    );
  },
);
