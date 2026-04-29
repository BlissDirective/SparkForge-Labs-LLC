'use client';

/**
 * SfMark3D — the SparkForge SF mark, rendered in 3D with BrandingMaterial.
 *
 * Pipeline:
 *   public/branding/sf-geometry.svg
 *     → SVGLoader (R3F useLoader cache)
 *     → SVGLoader.createShapes per <path>
 *     → ExtrudeGeometry per shape (bevel + depth from sf-material.config)
 *     → mirror y to convert SVG y-down → three y-up
 *     → center-on-origin via Box3 measurement
 *     → mesh per path with createBrandingMaterial()
 *
 * Path IDs (sf-mark-S, sf-mark-F) are preserved on each mesh's userData
 * so downstream Phase 5b animation can address the S and F separately
 * during the ignition beat.
 *
 * Mythos halt rule (CLAUDE.md v6.6): visual SSIM ≥ 0.96 vs IMG_4607.
 * If the geometry is off, edit sf-geometry.svg (single source of truth)
 * and refresh — the loader is cache-busted by URL.
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

export interface SfMark3DProps {
  /** Override the source SVG (defaults to the public-asset path). */
  url?: string;
  /** Position offset applied AFTER auto-centering. */
  position?: [number, number, number];
  /** Rotation in radians. */
  rotation?: [number, number, number];
  /** Scale multiplier. The SVG width auto-fits to ~6 scene units. */
  scale?: number;
  /** Italic forward-lean in radians. IMG_4607 reads ≈ 0.06 (~3.4°). */
  italicLean?: number;
  /** Pass-through to BrandingMaterial. */
  materialOptions?: BrandingMaterialOptions;
  /** Ref to the inner group for animation timelines (Phase 5b). */
  groupRef?: React.MutableRefObject<Group | null>;
}

const SVG_VIEW_WIDTH = 1400;
const TARGET_SCENE_WIDTH = 6.4; // SF mark fills ~6.4 units in scene space
const BASE_SCALE = TARGET_SCENE_WIDTH / SVG_VIEW_WIDTH;

// Cap-height in SVG units — 720 - 70 = 650.
// Bevel + depth scale relative to this so geometry tweaks
// to the SVG don't break the bevel proportions.
const SVG_CAP_HEIGHT = 650;

export function SfMark3D({
  url = '/branding/sf-geometry.svg',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  italicLean = 0.06,
  materialOptions,
  groupRef,
}: SfMark3DProps) {
  const data = useLoader(SVGLoader, url);
  const innerRef = useRef<Group>(null);
  const outerRef = useRef<Group>(null);

  // Build extruded geometry per path.
  const meshSpecs = useMemo(() => {
    const specs: Array<{ id: string; geometry: ExtrudeGeometry }> = [];

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
        `sf-path-${pathIdx}`;

      shapes.forEach((shape, shapeIdx) => {
        const geom = new ExtrudeGeometry(shape, extrudeSettings);
        // Mirror y so SVG y-down becomes scene y-up.
        geom.scale(1, -1, 1);
        // Recenter geometry to its own bounding-box center; the parent
        // group will then position the entire mark at the origin.
        geom.computeBoundingBox();
        if (geom.boundingBox) {
          const center = new Vector3();
          geom.boundingBox.getCenter(center);
          geom.translate(-center.x, -center.y, -center.z);
        }
        geom.computeVertexNormals();
        specs.push({
          id: `${pathId}-${shapeIdx}`,
          geometry: geom,
        });
      });
    });

    return specs;
  }, [data]);

  // After mount, recenter the inner group so the entire SF mark sits on origin.
  useEffect(() => {
    if (!innerRef.current) return;
    const box = new Box3().setFromObject(innerRef.current);
    if (!box.isEmpty()) {
      const center = new Vector3();
      box.getCenter(center);
      innerRef.current.position.set(-center.x, -center.y, -center.z);
    }
    // Forward to the outer-ref consumer for Phase 5b animations.
    if (groupRef && outerRef.current) {
      groupRef.current = outerRef.current;
    }
  }, [meshSpecs, groupRef]);

  // Italic shear on the outer group via a matrix transform applied through skewX.
  // We use an extra wrapper with rotation.z = 0 + a manual matrix skew so
  // BrandingMaterial's view-space Fresnel still reads correctly.
  return (
    <group
      ref={outerRef}
      position={position}
      rotation={rotation}
      scale={scale * BASE_SCALE}
    >
      <group
        // Italic lean: rotate-Y a hair so the letters tilt forward into screen.
        // (SkewX would distort dispersion sampling; rotation preserves it.)
        rotation={[0, italicLean, 0]}
      >
        <group ref={innerRef}>
          {meshSpecs.map(({ id, geometry }) => (
            <BrandingPart key={id} id={id} geometry={geometry} options={materialOptions} />
          ))}
        </group>
      </group>
    </group>
  );
}
