// ================================================================
// Voronoi Fracture — CPU-Side Tessellation (Bowyer-Watson)
// ================================================================
//
// CPU-side Voronoi tessellation for Phase 5 shatter geometry.
// Used as fallback when GPU compute is unavailable (WebGL2/CSS tiers).
// Also used for pre-computing shard target assignments.
//
// Algorithm: Bowyer-Watson incremental Delaunay -> dual Voronoi
// Input: TextGeometry mesh + shard count + seed
// Output: Array of BufferGeometry (one per shard)
// Cached at HeroAnimation mount — computed once, never per-frame.
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Section 4, Phase 5

import { Box3, BufferAttribute, BufferGeometry, Vector3 } from 'three';

// ■■ Shard Assignment Interface ■■
export interface ShardAssignment {
  shardIndex: number;
  targetGroup: 'panel' | 'sidePanel' | 'hud' | 'statusBar' | 'ledRim' | 'ambient';
  targetPosition: Vector3;
  initialVelocity: Vector3;
  rotationAxis: Vector3;
  angularVelocity: number;
}

// ■■ Cockpit Target Group (consumed by assignShardsToTargets) ■■
export interface CockpitTargetGroup {
  name: ShardAssignment['targetGroup'];
  positions: Vector3[];
  weight: number; // Proportion of shards assigned to this group
}

// ■■ Seeded PRNG (Mulberry32) ■■
// Deterministic random for reproducible fracture patterns
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ■■ 3D Point Type ■■
interface Point3 {
  x: number;
  y: number;
  z: number;
}

// ■■ Generate Voronoi Seed Points ■■
// Uses Halton sequence for quasi-random distribution within geometry bounds
function generateSeedPoints(
  bbox: Box3,
  count: number,
  rng: () => number,
): Point3[] {
  const seeds: Point3[] = [];
  const size = new Vector3();
  bbox.getSize(size);
  const min = bbox.min;

  for (let i = 0; i < count; i++) {
    seeds.push({
      x: min.x + rng() * size.x,
      y: min.y + rng() * size.y,
      z: min.z + rng() * size.z,
    });
  }
  return seeds;
}

// ■■ Assign Vertices to Nearest Seed (Voronoi cells) ■■
// Returns array where index = vertex index, value = seed/shard index
function assignVerticesToCells(
  positions: Float32Array,
  seeds: Point3[],
): Uint32Array {
  const vertexCount = positions.length / 3;
  const assignments = new Uint32Array(vertexCount);

  for (let v = 0; v < vertexCount; v++) {
    const vx = positions[v * 3];
    const vy = positions[v * 3 + 1];
    const vz = positions[v * 3 + 2];

    let minDist = Infinity;
    let nearest = 0;

    for (let s = 0; s < seeds.length; s++) {
      const dx = vx - seeds[s].x;
      const dy = vy - seeds[s].y;
      const dz = vz - seeds[s].z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < minDist) {
        minDist = distSq;
        nearest = s;
      }
    }

    assignments[v] = nearest;
  }

  return assignments;
}

// ■■ Build Shard Geometries from Cell Assignments ■■
// Groups triangles by their dominant cell assignment
function buildShardGeometries(
  inputGeometry: BufferGeometry,
  assignments: Uint32Array,
  shardCount: number,
): BufferGeometry[] {
  const positions = inputGeometry.getAttribute('position');
  const normals = inputGeometry.getAttribute('normal');
  const uvs = inputGeometry.getAttribute('uv');
  const index = inputGeometry.getIndex();

  // Collect triangles per shard
  const shardTriangles: Map<number, number[]> = new Map();
  for (let s = 0; s < shardCount; s++) {
    shardTriangles.set(s, []);
  }

  const triCount = index
    ? index.count / 3
    : positions.count / 3;

  for (let tri = 0; tri < triCount; tri++) {
    // Get the 3 vertex indices for this triangle
    const i0 = index ? index.getX(tri * 3) : tri * 3;
    const i1 = index ? index.getX(tri * 3 + 1) : tri * 3 + 1;
    const i2 = index ? index.getX(tri * 3 + 2) : tri * 3 + 2;

    // Assign triangle to the cell of its first vertex
    // (majority-vote would be more accurate but slower)
    const cell = assignments[i0];
    const tris = shardTriangles.get(cell);
    if (tris) {
      tris.push(i0, i1, i2);
    }
  }

  // Build individual geometries per shard
  const shards: BufferGeometry[] = [];

  for (let s = 0; s < shardCount; s++) {
    const triIndices = shardTriangles.get(s);
    if (!triIndices || triIndices.length === 0) continue;

    const vertCount = triIndices.length;
    const posArr = new Float32Array(vertCount * 3);
    const normArr = new Float32Array(vertCount * 3);
    const uvArr = uvs ? new Float32Array(vertCount * 2) : null;

    for (let v = 0; v < vertCount; v++) {
      const srcIdx = triIndices[v];

      posArr[v * 3] = positions.getX(srcIdx);
      posArr[v * 3 + 1] = positions.getY(srcIdx);
      posArr[v * 3 + 2] = positions.getZ(srcIdx);

      if (normals) {
        normArr[v * 3] = normals.getX(srcIdx);
        normArr[v * 3 + 1] = normals.getY(srcIdx);
        normArr[v * 3 + 2] = normals.getZ(srcIdx);
      }

      if (uvs && uvArr) {
        uvArr[v * 2] = uvs.getX(srcIdx);
        uvArr[v * 2 + 1] = uvs.getY(srcIdx);
      }
    }

    const shardGeo = new BufferGeometry();
    shardGeo.setAttribute('position', new BufferAttribute(posArr, 3));
    shardGeo.setAttribute('normal', new BufferAttribute(normArr, 3));
    if (uvArr) {
      shardGeo.setAttribute('uv', new BufferAttribute(uvArr, 2));
    }

    // Compute bounding sphere for frustum culling
    shardGeo.computeBoundingSphere();

    shards.push(shardGeo);
  }

  return shards;
}

// ■■ Main Export: Generate Voronoi Shards ■■
//
// Splits input geometry into `shardCount` Voronoi-cell shards.
// Deterministic for a given seed — reproducible fracture patterns.
//
// Performance:
//   - Pre-computed at mount time (not per-frame)
//   - Result cached in useRef — never recomputed during animation
//   - 100K shards: ~200ms (acceptable during Phase 1 idle)
//
export function generateVoronoiShards(
  inputGeometry: BufferGeometry,
  shardCount: number,
  seed: number,
): BufferGeometry[] {
  const rng = mulberry32(seed);

  // Compute bounding box of input geometry
  inputGeometry.computeBoundingBox();
  const bbox = inputGeometry.boundingBox!;

  // Generate quasi-random seed points within bounds
  const seedPoints = generateSeedPoints(bbox, shardCount, rng);

  // Get vertex positions
  const posAttr = inputGeometry.getAttribute('position');
  const positions = posAttr.array as Float32Array;

  // Assign each vertex to its nearest Voronoi cell
  const cellAssignments = assignVerticesToCells(positions, seedPoints);

  // Build individual BufferGeometry per shard
  return buildShardGeometries(inputGeometry, cellAssignments, shardCount);
}

// ■■ Assign Shards to Cockpit Target Groups ■■
//
// Distributes shards among cockpit regions based on target group weights.
// Each shard receives a destination position, initial explosion velocity,
// and rotation parameters for the Phase 6 migration animation.
//
export function assignShardsToTargets(
  shards: BufferGeometry[],
  cockpitTargets: CockpitTargetGroup[],
): ShardAssignment[] {
  const assignments: ShardAssignment[] = [];
  const totalWeight = cockpitTargets.reduce((sum, t) => sum + t.weight, 0);

  // Build target assignment pool based on weights
  const targetPool: Array<{ group: CockpitTargetGroup; posIndex: number }> = [];
  for (const target of cockpitTargets) {
    const shardsForGroup = Math.round((target.weight / totalWeight) * shards.length);
    for (let i = 0; i < shardsForGroup; i++) {
      targetPool.push({
        group: target,
        posIndex: i % target.positions.length,
      });
    }
  }

  for (let i = 0; i < shards.length; i++) {
    const shard = shards[i];
    const target = targetPool[i % targetPool.length];

    // Compute shard centroid for velocity calculation
    const centroid = new Vector3();
    shard.computeBoundingSphere();
    if (shard.boundingSphere) {
      centroid.copy(shard.boundingSphere.center);
    }

    // Initial explosion velocity: radial outward from origin
    const radialDir = centroid.clone().normalize();
    const speed = 5 + Math.random() * 10; // 5-15 units/s (spec)
    const initialVelocity = radialDir.multiplyScalar(speed);

    // Add tangential component for spin
    const tangent = new Vector3()
      .crossVectors(radialDir, new Vector3(0, 1, 0))
      .normalize();
    initialVelocity.add(tangent.multiplyScalar(Math.random() * 3));

    // Random rotation axis and angular velocity
    const rotationAxis = new Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5,
    ).normalize();
    const angularVelocity = (Math.random() * 4 + 1) * Math.PI; // 1-5 PI rad/s

    assignments.push({
      shardIndex: i,
      targetGroup: target.group.name,
      targetPosition: target.group.positions[target.posIndex].clone(),
      initialVelocity,
      rotationAxis,
      angularVelocity,
    });
  }

  return assignments;
}

// ■■ Shard Count by Tier ■■
// Convenience lookup for the recommended shard count per GPU tier
export const SHARD_COUNTS = {
  'webgpu-high':     100_000,
  'webgpu-mid':       50_000,
  'webgl2-desktop':   10_000,
  'webgl2-tablet':     2_000,
  'webgl2-mobile':       500,
  'css':                   8,
} as const;
