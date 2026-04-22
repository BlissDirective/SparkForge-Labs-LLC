// PERF-ENH-001 (Ultra): BatchedMesh builder for static cockpit details
//
// Three.js BatchedMesh packs MULTIPLE geometries + per-instance
// transforms + colors into a single draw call. It's pixel-identical
// to individual meshes as long as:
//   (a) the material is shared (we use MeshStandardMaterial with a
//       vertexColor path for tint variation),
//   (b) per-instance color attrs replace the would-have-been unique
//       material tints,
//   (c) we split batches by spatial zone so frustum culling still
//       eliminates off-screen work.
//
// This module is a builder + React component. Consumers produce an
// array of { geometry, matrix, color, zone } entries; the builder
// returns three BatchedMesh instances (front / side / rear) wired to
// a shared material.
//
// CeremonyFX particles deliberately stay on InstancedMesh — their
// per-frame vertex mutation is a better fit for instanced geometry.

import {
  BatchedMesh,
  type BufferGeometry,
  Color,
  type Material,
  Matrix4,
} from 'three';

export type CockpitZone = 'front' | 'side' | 'rear';

export interface BatchedInstance {
  geometry: BufferGeometry;
  matrix: Matrix4;
  /** Hex string (e.g. '#A3B8CC') or Color. Stored as a per-instance
   *  color attribute; material must have `vertexColors` enabled. */
  color: string | Color;
  zone: CockpitZone;
}

export interface BatchedZoneBundle {
  /** One BatchedMesh per zone, ready to add to a Scene. */
  front: BatchedMesh | null;
  side: BatchedMesh | null;
  rear: BatchedMesh | null;
  /** Call this when unmounting — releases all three batches' buffers. */
  dispose: () => void;
  /** Total primitives packed across zones. Useful for dev logging. */
  totalInstances: number;
}

/**
 * Given a shared material and a flat list of instance descriptors,
 * return three zone-split BatchedMesh objects.
 *
 * BatchedMesh constructor args:
 *   maxInstanceCount  — hard cap on .addInstance calls for this batch
 *   maxVertexCount    — sum of all unique geometries' vertex counts
 *   maxIndexCount     — sum of all unique geometries' index counts
 *
 * We round the caps up by 20% to leave headroom for runtime additions
 * without re-allocating.
 */
export function buildZonedBatchedMeshes(
  instances: readonly BatchedInstance[],
  material: Material,
): BatchedZoneBundle {
  const buckets: Record<CockpitZone, BatchedInstance[]> = {
    front: [],
    side: [],
    rear: [],
  };
  for (const inst of instances) {
    buckets[inst.zone].push(inst);
  }

  const headroom = 1.2;
  const batches: Partial<Record<CockpitZone, BatchedMesh>> = {};

  for (const zone of ['front', 'side', 'rear'] as CockpitZone[]) {
    const list = buckets[zone];
    if (list.length === 0) continue;

    let vertexTotal = 0;
    let indexTotal = 0;
    for (const inst of list) {
      vertexTotal += inst.geometry.attributes.position?.count ?? 0;
      indexTotal += inst.geometry.index?.count ?? 0;
    }

    const batch = new BatchedMesh(
      Math.ceil(list.length * headroom),
      Math.ceil(vertexTotal * headroom),
      Math.ceil(indexTotal * headroom),
      material,
    );
    batch.name = `batched-cockpit-${zone}`;

    const colorTmp = new Color();
    for (const inst of list) {
      const geometryId = batch.addGeometry(inst.geometry);
      const instanceId = batch.addInstance(geometryId);
      batch.setMatrixAt(instanceId, inst.matrix);
      const c = typeof inst.color === 'string' ? colorTmp.set(inst.color) : inst.color;
      // setColorAt enables per-instance color without per-mesh material duplication.
      batch.setColorAt(instanceId, c);
    }

    batches[zone] = batch;
  }

  return {
    front: batches.front ?? null,
    side: batches.side ?? null,
    rear: batches.rear ?? null,
    totalInstances: instances.length,
    dispose: () => {
      for (const b of [batches.front, batches.side, batches.rear]) {
        if (!b) continue;
        // Three's BatchedMesh.dispose releases internal buffers but
        // leaves the shared material / source geometries alone — the
        // caller owns those.
        b.dispose();
      }
    },
  };
}

/**
 * Classify a world-space Z coordinate into a zone. Cockpit world
 * space has the viewer at origin looking at -Z; front = -|z| band,
 * side = mid band, rear = +z band. Thresholds match the cockpit
 * layout in COCKPIT_GEOMETRY.
 */
export function zoneFromZ(z: number): CockpitZone {
  if (z < -0.3) return 'front';
  if (z > 0.4) return 'rear';
  return 'side';
}
