'use client';

// ================================================================
// CockpitFloor3D — Grated Floor with Sub-Floor Detail (CPA v2.0)
// ================================================================
// 20M Cockpit Upgrade — Triangle budget: 500,000
//
// Features:
//   - Grate panels: InstancedMesh grid of thin BoxGeometry slats (200+)
//   - Sub-floor piping: 6-8 CylinderGeometry pipes with lab-colored emissive glow
//   - Energy conduits: 3 TubeGeometry conduits with pulsing emissive material
//   - Maintenance hatches: 2 square frame outlines with distinct material
//   - Embedded LED channels: 50+ small emissive boxes along grate edges
//   - Under-glow: Large plane with low-opacity lab-colored emissive
//
// LOD-aware via useLOD({ tier: 'system' })
// Floor positioned at y = -3.5, extends ~10 wide x ~8 deep

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLOD } from '@/hooks/useLOD';

// ■■ Props ■■

interface CockpitFloor3DProps {
  labColor: string;
  opacity?: number;
}

// ■■ Constants ■■

const FLOOR_Y = -3.5;
const FLOOR_WIDTH = 10;
const FLOOR_DEPTH = 8;
// Slat dimensions
const SLAT_WIDTH = 0.04;
const SLAT_HEIGHT = 0.02;

// LOD-driven slat counts
const SLAT_COUNTS: Record<string, { x: number; z: number }> = {
  ultra: { x: 120, z: 100 },
  high: { x: 80, z: 60 },
  medium: { x: 40, z: 30 },
  low: { x: 20, z: 16 },
  billboard: { x: 10, z: 8 },
};

// LOD-driven pipe segments
const PIPE_SEGMENTS: Record<string, number> = {
  ultra: 32,
  high: 16,
  medium: 10,
  low: 6,
  billboard: 4,
};

// LOD-driven LED counts
const LED_COUNTS: Record<string, number> = {
  ultra: 80,
  high: 50,
  medium: 30,
  low: 16,
  billboard: 8,
};

// ■■ Pipe layout: 8 pipes running along Z axis beneath the grate ■■
const PIPE_CONFIGS = [
  { x: -3.8, z: 0, radius: 0.06, length: 7.0 },
  { x: -2.4, z: 0, radius: 0.08, length: 7.5 },
  { x: -1.0, z: 0, radius: 0.05, length: 6.5 },
  { x: 0.2, z: 0, radius: 0.07, length: 7.2 },
  { x: 1.4, z: 0, radius: 0.06, length: 6.8 },
  { x: 2.6, z: 0, radius: 0.09, length: 7.0 },
  { x: 3.5, z: 0, radius: 0.05, length: 6.0 },
  { x: 4.2, z: 0, radius: 0.07, length: 7.4 },
];

// ■■ Energy conduit curves ■■
function buildConduitCurve(index: number): THREE.CatmullRomCurve3 {
  const offsetX = (index - 1) * 2.8;
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(offsetX - 1.5, FLOOR_Y - 0.35, -3.5),
    new THREE.Vector3(offsetX - 0.5, FLOOR_Y - 0.5, -1.2),
    new THREE.Vector3(offsetX + 0.8, FLOOR_Y - 0.4, 1.0),
    new THREE.Vector3(offsetX + 1.6, FLOOR_Y - 0.55, 3.2),
  ]);
}

// ■■ Maintenance hatch frame builder ■■
function buildHatchFrame(cx: number, cz: number, size: number): THREE.BufferGeometry {
  const half = size / 2;
  const t = 0.04; // frame thickness
  const h = 0.015; // frame height
  const shape = new THREE.Shape();
  // Outer rectangle
  shape.moveTo(-half, -half);
  shape.lineTo(half, -half);
  shape.lineTo(half, half);
  shape.lineTo(-half, half);
  shape.closePath();
  // Inner cutout
  const hole = new THREE.Path();
  hole.moveTo(-half + t, -half + t);
  hole.lineTo(half - t, -half + t);
  hole.lineTo(half - t, half - t);
  hole.lineTo(-half + t, half - t);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
  });
  geo.translate(cx, 0, cz);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// ■■ Component ■■

export function CockpitFloor3D({ labColor, opacity = 1 }: CockpitFloor3DProps) {
  const lod = useLOD({ tier: 'system' });

  // Refs for animated elements
  const ledInstanceRef = useRef<THREE.InstancedMesh>(null);
  const conduitMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const underGlowRef = useRef<THREE.MeshStandardMaterial>(null);

  // Parsed lab color
  const labColorObj = useMemo(() => new THREE.Color(labColor), [labColor]);

  // ── Grate slats (InstancedMesh) ──
  const slatCounts = SLAT_COUNTS[lod.level] || SLAT_COUNTS.medium;

  const slatGeo = useMemo(
    () => new THREE.BoxGeometry(SLAT_WIDTH, SLAT_HEIGHT, FLOOR_DEPTH),
    []
  );
  const slatGeoZ = useMemo(
    () => new THREE.BoxGeometry(FLOOR_WIDTH, SLAT_HEIGHT, SLAT_WIDTH),
    []
  );

  const slatMatrixX = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const spacing = FLOOR_WIDTH / (slatCounts.x - 1);
    for (let i = 0; i < slatCounts.x; i++) {
      const m = new THREE.Matrix4();
      m.setPosition(
        -FLOOR_WIDTH / 2 + i * spacing,
        FLOOR_Y,
        0
      );
      matrices.push(m);
    }
    return matrices;
  }, [slatCounts.x]);

  const slatMatrixZ = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const spacing = FLOOR_DEPTH / (slatCounts.z - 1);
    for (let i = 0; i < slatCounts.z; i++) {
      const m = new THREE.Matrix4();
      m.setPosition(
        0,
        FLOOR_Y,
        -FLOOR_DEPTH / 2 + i * spacing
      );
      matrices.push(m);
    }
    return matrices;
  }, [slatCounts.z]);

  // ── Grate material (dark chrome) ──
  const grateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x111118,
        metalness: 0.85,
        roughness: 0.3,
        transparent: opacity < 1,
        opacity,
      }),
    [opacity]
  );

  // ── Sub-floor piping ──
  const pipeSegments = PIPE_SEGMENTS[lod.level] || 10;
  const pipeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x1a1822,
        metalness: 0.7,
        roughness: 0.4,
        emissive: labColorObj,
        emissiveIntensity: 0.3,
      }),
    [labColorObj]
  );

  const pipeGeos = useMemo(
    () =>
      PIPE_CONFIGS.map((p) =>
        new THREE.CylinderGeometry(p.radius, p.radius, p.length, pipeSegments)
      ),
    [pipeSegments]
  );

  // ── Energy conduits (3 TubeGeometry) ──
  const conduitCurves = useMemo(
    () => [buildConduitCurve(0), buildConduitCurve(1), buildConduitCurve(2)],
    []
  );

  const conduitTubeSegments = lod.tubularSegments;
  const conduitRadialSegments = Math.max(4, Math.floor(lod.segments / 4));

  const conduitGeos = useMemo(
    () =>
      conduitCurves.map(
        (curve) =>
          new THREE.TubeGeometry(curve, conduitTubeSegments, 0.04, conduitRadialSegments, false)
      ),
    [conduitCurves, conduitTubeSegments, conduitRadialSegments]
  );

  const conduitMats = useMemo(() => {
    const mats = [0, 1, 2].map(
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x0a0e16,
          emissive: labColorObj,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.9,
        })
    );
    conduitMatRefs.current = mats;
    return mats;
  }, [labColorObj]);

  // ── Maintenance hatches (2 frames) ──
  const hatchGeos = useMemo(
    () => [
      buildHatchFrame(-2.5, -1.8, 1.0),
      buildHatchFrame(2.2, 1.5, 0.9),
    ],
    []
  );

  const hatchMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x1a1a22,
        metalness: 0.6,
        roughness: 0.5,
        emissive: new THREE.Color(0xffaa44),
        emissiveIntensity: 0.15,
      }),
    []
  );

  // ── LED channels (InstancedMesh along grate edges) ──
  const ledCount = LED_COUNTS[lod.level] || 30;
  const ledGeo = useMemo(
    () => new THREE.BoxGeometry(0.06, 0.015, 0.025),
    []
  );

  const ledMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: labColorObj,
        emissive: labColorObj,
        emissiveIntensity: 1.0,
        toneMapped: false,
      }),
    [labColorObj]
  );

  // Compute LED instance matrices — distributed along the 4 edges
  const ledMatrices = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const perSide = Math.floor(ledCount / 4);
    const halfW = FLOOR_WIDTH / 2 - 0.1;
    const halfD = FLOOR_DEPTH / 2 - 0.1;

    // Top edge (z = -halfD)
    for (let i = 0; i < perSide; i++) {
      const m = new THREE.Matrix4();
      m.setPosition(
        -halfW + (i / (perSide - 1)) * (halfW * 2),
        FLOOR_Y + SLAT_HEIGHT / 2 + 0.005,
        -halfD
      );
      matrices.push(m);
    }
    // Bottom edge (z = +halfD)
    for (let i = 0; i < perSide; i++) {
      const m = new THREE.Matrix4();
      m.setPosition(
        -halfW + (i / (perSide - 1)) * (halfW * 2),
        FLOOR_Y + SLAT_HEIGHT / 2 + 0.005,
        halfD
      );
      matrices.push(m);
    }
    // Left edge (x = -halfW)
    for (let i = 0; i < perSide; i++) {
      const m = new THREE.Matrix4();
      const rot = new THREE.Matrix4().makeRotationY(Math.PI / 2);
      m.setPosition(
        -halfW,
        FLOOR_Y + SLAT_HEIGHT / 2 + 0.005,
        -halfD + (i / (perSide - 1)) * (halfD * 2)
      );
      m.multiply(rot);
      matrices.push(m);
    }
    // Right edge (x = +halfW)
    for (let i = 0; i < perSide; i++) {
      const m = new THREE.Matrix4();
      const rot = new THREE.Matrix4().makeRotationY(Math.PI / 2);
      m.setPosition(
        halfW,
        FLOOR_Y + SLAT_HEIGHT / 2 + 0.005,
        -halfD + (i / (perSide - 1)) * (halfD * 2)
      );
      m.multiply(rot);
      matrices.push(m);
    }
    return matrices;
  }, [ledCount]);

  // ── Under-glow plane ──
  const underGlowMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: labColorObj,
      emissive: labColorObj,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    underGlowRef.current = mat;
    return mat;
  }, [labColorObj]);

  // ── Animation ──
  useFrame(() => {
    const time = performance.now() * 0.001;

    // LED traveling wave pulse
    const inst = ledInstanceRef.current;
    if (inst) {
      const totalLeds = ledMatrices.length;
      const color = new THREE.Color();
      for (let i = 0; i < totalLeds; i++) {
        const wave = Math.sin(time * 3.0 + (i / totalLeds) * Math.PI * 4) * 0.5 + 0.5;
        color.copy(labColorObj).multiplyScalar(0.3 + wave * 0.7);
        inst.setColorAt(i, color);
      }
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    }

    // Energy conduit emissive pulse (each conduit offset by phase)
    for (let c = 0; c < conduitMatRefs.current.length; c++) {
      const mat = conduitMatRefs.current[c];
      if (mat) {
        const pulse = Math.sin(time * 2.5 + c * (Math.PI * 2) / 3) * 0.5 + 0.5;
        mat.emissiveIntensity = 0.3 + pulse * 0.8;
      }
    }

    // Subtle under-glow breathing
    if (underGlowRef.current) {
      const breath = Math.sin(time * 1.2) * 0.03 + 0.12;
      underGlowRef.current.opacity = breath;
    }
  });

  return (
    <group>
      {/* ── X-direction slats (InstancedMesh) ── */}
      <instancedMesh
        args={[slatGeo, grateMat, slatCounts.x]}
        frustumCulled={false}
        ref={(mesh) => {
          if (mesh) {
            slatMatrixX.forEach((m, i) => mesh.setMatrixAt(i, m));
            mesh.instanceMatrix.needsUpdate = true;
          }
        }}
      />

      {/* ── Z-direction slats (InstancedMesh) ── */}
      <instancedMesh
        args={[slatGeoZ, grateMat, slatCounts.z]}
        frustumCulled={false}
        ref={(mesh) => {
          if (mesh) {
            slatMatrixZ.forEach((m, i) => mesh.setMatrixAt(i, m));
            mesh.instanceMatrix.needsUpdate = true;
          }
        }}
      />

      {/* ── Sub-floor piping ── */}
      {PIPE_CONFIGS.map((pipe, i) => (
        <mesh
          key={`pipe-${i}`}
          geometry={pipeGeos[i]}
          material={pipeMat}
          position={[pipe.x, FLOOR_Y - 0.25, pipe.z]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}

      {/* ── Energy conduits (3 pulsing tubes) ── */}
      {conduitGeos.map((geo, i) => (
        <mesh
          key={`conduit-${i}`}
          geometry={geo}
          material={conduitMats[i]}
        />
      ))}

      {/* ── Maintenance hatches ── */}
      {hatchGeos.map((geo, i) => (
        <mesh
          key={`hatch-${i}`}
          geometry={geo}
          material={hatchMat}
          position={[0, FLOOR_Y + SLAT_HEIGHT / 2 + 0.001, 0]}
        />
      ))}

      {/* ── LED channels (InstancedMesh) ── */}
      <instancedMesh
        args={[ledGeo, ledMat, ledMatrices.length]}
        frustumCulled={false}
        ref={(mesh) => {
          if (mesh) {
            ledInstanceRef.current = mesh;
            ledMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
            mesh.instanceMatrix.needsUpdate = true;
            // Initialize instance colors
            const color = new THREE.Color(labColor);
            for (let i = 0; i < ledMatrices.length; i++) {
              mesh.setColorAt(i, color);
            }
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
          }
        }}
      />

      {/* ── Under-glow plane ── */}
      <mesh
        position={[0, FLOOR_Y - 0.6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={underGlowMat}
      >
        <planeGeometry args={[FLOOR_WIDTH * 0.95, FLOOR_DEPTH * 0.95]} />
      </mesh>
    </group>
  );
}

export default CockpitFloor3D;
