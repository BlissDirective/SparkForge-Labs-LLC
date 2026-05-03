/**
 * buildShardSourceGeometry — extract a single merged BufferGeometry from
 * a parsed SVG, suitable for feeding to <SfShardSet> for Voronoi pre-fracture.
 *
 * Used by Phase 5c.6+ Beat 4 (F-glyph shard burst) and Beat 8 (full wordmark
 * shatter-into-UI) to replace the placeholder BoxGeometry approximations
 * with real letterform geometry.
 *
 * Mirrors the per-path ExtrudeGeometry pipeline in SfMark3D.tsx /
 * SparkForgeWordmark3D.tsx — same constants from sf-material.config so
 * shard shapes match the visible letter shapes byte-for-byte.
 */

import {
  BufferGeometry,
  ExtrudeGeometry,
  Vector3,
  type ExtrudeGeometryOptions,
} from 'three';
import { SVGLoader, type SVGResult } from 'three/examples/jsm/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GEOMETRY } from '@/lib/branding/sf-material.config';

const SVG_CAP_HEIGHT = 650;

/**
 * Build a merged ExtrudeGeometry from an SVGResult, scaling to the
 * SfMark3D / SparkForgeWordmark3D world-space convention.
 *
 * @param data        Loaded SVGResult (from useLoader(SVGLoader, url))
 * @param pathFilter  Returns true for paths whose IDs should be included.
 *                    For Beat 4: id => id === 'sf-mark-F'.
 *                    For Beat 8: () => true (all paths).
 * @param baseScale   World-space scale multiplier. SfMark3D uses
 *                    6.4 / 1400 = 0.00457; SparkForgeWordmark3D uses
 *                    12.0 / 6400 = 0.001875.
 *
 * Caller owns disposal — call .dispose() on unmount.
 */
export function buildShardSourceGeometry(
  data: SVGResult,
  pathFilter: (pathId: string) => boolean,
  baseScale: number,
): BufferGeometry {
  const extrudeSettings: ExtrudeGeometryOptions = {
    depth: GEOMETRY.extrudeDepth * SVG_CAP_HEIGHT,
    bevelEnabled: true,
    bevelSize: GEOMETRY.bevelSize * SVG_CAP_HEIGHT,
    bevelThickness: GEOMETRY.bevelThickness * SVG_CAP_HEIGHT,
    bevelSegments: GEOMETRY.bevelSegments,
    curveSegments: GEOMETRY.curveSegments,
  };

  const geoms: ExtrudeGeometry[] = [];

  data.paths.forEach((path) => {
    const pathId =
      (path.userData as { node?: { id?: string } } | undefined)?.node?.id ?? '';
    if (!pathFilter(pathId)) return;

    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const g = new ExtrudeGeometry(shape, extrudeSettings);
      // Mirror y so SVG y-down becomes scene y-up
      g.scale(1, -1, 1);
      geoms.push(g);
    });
  });

  if (geoms.length === 0) {
    // No matching paths — return an empty geometry the caller can detect
    // by checking attributes. SfShardSet will catch the empty state and
    // render zero shards.
    return new BufferGeometry();
  }

  // Merge all per-path geometries. mergeGeometries returns null if
  // attributes don't match — for our pipeline they always do (same
  // ExtrudeGeometry settings) but guard anyway.
  let merged: BufferGeometry;
  if (geoms.length === 1) {
    merged = geoms[0];
  } else {
    const result = mergeGeometries(geoms, false);
    if (!result) {
      // Fallback: use the first geometry; dispose the rest
      merged = geoms[0];
      for (let i = 1; i < geoms.length; i++) geoms[i].dispose();
    } else {
      merged = result;
      // mergeGeometries clones — dispose the originals
      geoms.forEach((g) => g.dispose());
    }
  }

  // Recenter aggregate to its bounding-box center
  merged.computeBoundingBox();
  if (merged.boundingBox) {
    const center = new Vector3();
    merged.boundingBox.getCenter(center);
    merged.translate(-center.x, -center.y, -center.z);
  }

  // Apply world-space base scale (matches SfMark3D / SparkForgeWordmark3D)
  merged.scale(baseScale, baseScale, baseScale);
  merged.computeVertexNormals();

  return merged;
}
