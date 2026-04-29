'use client';

/**
 * SparkForgeWordmark3D — full "SparkForge" wordmark in 3D, materialised
 * with BrandingMaterial. Phase 3 deliverable per BRAND_HERO_ACTION_PLAN.md.
 *
 * Pipeline (mirrors SfMark3D):
 *   public/branding/sparkforge-geometry.svg
 *     → SVGLoader (R3F useLoader cache)
 *     → SVGLoader.createShapes per <path>  (10 letters)
 *     → ExtrudeGeometry per shape          (one mesh per letter)
 *     → mirror y to convert SVG y-down → three y-up
 *     → group recenter + italic-lean rotation (NOT skew)
 *     → BrandingMaterial instance per mesh (TSL pipeline-per-instance)
 *
 * Per-letter addressability:
 *   Each path keeps its id (sf-mark-S, wm-p, wm-a, wm-r, wm-k, sf-mark-F,
 *   wm-o, wm-r2, wm-g, wm-e). `userData.sfMarkPathId` carries the id to
 *   the mesh so Phase 5b's wordmark-cascade timeline can target letters
 *   individually.
 *
 * `revealMask` (Phase 5b will animate it):
 *   undefined → all letters visible
 *   number[]  → only letter indices in the array are visible
 *   Order is left-to-right in the SVG: [S, p, a, r, k, F, o, r, g, e].
 *
 * Italic lean is applied as group rotation around Y, identical to
 * SfMark3D. Skew would distort the dispersion fresnel sampling.
 */

import { useMemo, useRef, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import {
  ExtrudeGeometry,
  Group,
  Box3,
  Vector3,
  type ExtrudeGeometryOptions,
} from 'three';
import { type BrandingMaterialOptions } from './BrandingMaterial';
import { BrandingPart } from './_shared';
import { GEOMETRY } from '@/lib/branding/sf-material.config';

export interface SparkForgeWordmark3DProps {
  /** Override the source SVG (defaults to the public-asset path). */
  url?: string;
  /** Position offset applied AFTER auto-centering. */
  position?: [number, number, number];
  /** Rotation in radians. */
  rotation?: [number, number, number];
  /** Scale multiplier. The SVG width auto-fits to ~12 scene units. */
  scale?: number;
  /** Italic forward-lean in radians. Default 0.06 (~3.4°), matches SF mark. */
  italicLean?: number;
  /** Pass-through to every per-letter BrandingMaterial. */
  materialOptions?: BrandingMaterialOptions;
  /**
   * Letter indices currently visible (left-to-right: S,p,a,r,k,F,o,r,g,e).
   * undefined → all visible. Phase 5b animates this for the cascade beat.
   */
  revealMask?: number[];
  /** Ref to the inner group for animation timelines (Phase 5b). */
  groupRef?: React.MutableRefObject<Group | null>;
}

const SVG_VIEW_WIDTH = 6400;
const TARGET_SCENE_WIDTH = 12.0; // wordmark fills ~12 units in scene space
const BASE_SCALE = TARGET_SCENE_WIDTH / SVG_VIEW_WIDTH;

// Cap-height in SVG units — same as SF mark (720 - 70 = 650).
// Bevel + extrude depth scale relative to this so the wordmark's bevel
// proportions match the SF mark when rendered at any size.
const SVG_CAP_HEIGHT = 650;

/**
 * Left-to-right letter order in sparkforge-geometry.svg. Used to map
 * `revealMask` indices to path ids. Must stay in sync with the SVG.
 */
const LETTER_ORDER = [
  'sf-mark-S', 'wm-p', 'wm-a', 'wm-r', 'wm-k',
  'sf-mark-F', 'wm-o', 'wm-r2', 'wm-g', 'wm-e',
] as const;

export function SparkForgeWordmark3D({
  url = '/branding/sparkforge-geometry.svg',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  italicLean = 0.06,
  materialOptions,
  revealMask,
  groupRef,
}: SparkForgeWordmark3DProps) {
  const data = useLoader(SVGLoader, url);
  const innerRef = useRef<Group>(null);
  const outerRef = useRef<Group>(null);

  // Build extruded geometry per path.
  // Each <path> in the SVG becomes ONE mesh with its own BrandingMaterial.
  // (If a path has multiple subpaths — e.g. wm-p with bowl + counter — they
  // are unified into a single shape array and the resulting ExtrudeGeometry
  // honours the evenodd fill-rule: outer outline solid, reversed inner
  // counter is the hole.)
  const meshSpecs = useMemo(() => {
    const specs: Array<{
      id: string;
      pathId: string;
      letterIndex: number;
      geometry: ExtrudeGeometry;
    }> = [];

    const extrudeSettings: ExtrudeGeometryOptions = {
      depth: GEOMETRY.extrudeDepth * SVG_CAP_HEIGHT,
      bevelEnabled: true,
      bevelSize: GEOMETRY.bevelSize * SVG_CAP_HEIGHT,
      bevelThickness: GEOMETRY.bevelThickness * SVG_CAP_HEIGHT,
      bevelSegments: GEOMETRY.bevelSegments,
      curveSegments: GEOMETRY.curveSegments,
    };

    data.paths.forEach((path, pathIdx) => {
      const shapes = SVGLoader.createShapes(path);
      const pathId =
        (path.userData as { node?: { id?: string } } | undefined)?.node?.id ??
        `sparkforge-path-${pathIdx}`;

      const letterIndex = (LETTER_ORDER as readonly string[]).indexOf(pathId);

      shapes.forEach((shape, shapeIdx) => {
        const geom = new ExtrudeGeometry(shape, extrudeSettings);
        // Mirror y so SVG y-down becomes scene y-up.
        geom.scale(1, -1, 1);
        geom.computeVertexNormals();
        // NOTE: do NOT recenter geometry here. We need each letter's
        // local geometry preserved at its SVG x-position so the word
        // reads correctly horizontally; the parent group recentering
        // (useEffect below) will handle the aggregate positioning.
        specs.push({
          id: `${pathId}-${shapeIdx}`,
          pathId,
          letterIndex: letterIndex >= 0 ? letterIndex : pathIdx,
          geometry: geom,
        });
      });
    });

    return specs;
  }, [data]);

  // After mount, recenter the inner group so the entire wordmark sits on origin.
  useEffect(() => {
    if (!innerRef.current) return;
    const box = new Box3().setFromObject(innerRef.current);
    if (!box.isEmpty()) {
      const center = new Vector3();
      box.getCenter(center);
      innerRef.current.position.set(-center.x, -center.y, -center.z);
    }
    if (groupRef && outerRef.current) {
      groupRef.current = outerRef.current;
    }
  }, [meshSpecs, groupRef]);

  return (
    <group
      ref={outerRef}
      position={position}
      rotation={rotation}
      scale={scale * BASE_SCALE}
    >
      <group rotation={[0, italicLean, 0]}>
        <group ref={innerRef}>
          {meshSpecs.map(({ id, geometry, letterIndex }) => {
            const visible =
              revealMask === undefined || revealMask.includes(letterIndex);
            return (
              <BrandingPart
                key={id}
                id={id}
                geometry={geometry}
                visible={visible}
                options={materialOptions}
              />
            );
          })}
        </group>
      </group>
    </group>
  );
}
