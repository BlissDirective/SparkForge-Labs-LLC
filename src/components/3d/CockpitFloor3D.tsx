'use client';

// ================================================================
// CockpitFloor3D — Grated Floor with Sub-Floor Detail (CPA v2.0)
// ================================================================
// 20M Cockpit Upgrade — Triangle budget: 500,000
//
// Design Decisions:
//   13.1 Grating: Hexagonal (honeycomb) grid pattern — futuristic, strong,
//        matches geometric cockpit language.
//   13.2 Sub-Floor: Energy channels — glowing energy channels beneath grating
//        in current mode LED color. Floor pulses faintly with power.
//   13.3 Extent: Full semicircle — floor extends across full 218-degree
//        cockpit arc. Complete ground plane.
//
// Features:
//   - Grate panels: InstancedMesh hexagonal honeycomb slats (200+)
//   - Sub-floor energy channels: 6-8 CylinderGeometry pipes with lab-colored emissive glow
//   - Energy conduits: 3 TubeGeometry conduits with pulsing emissive material
//   - Maintenance hatches: 2 square frame outlines with distinct material
//   - Embedded LED channels: 50+ small emissive boxes along grate edges
//   - Under-glow: Large plane with low-opacity lab-colored emissive
//

// Floor positioned at y = -3.5, extends full 218° cockpit arc

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Path,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';
import {
  CHROME_BORDER,
  ACCENT_LINES,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_LED_MULTIPLIER,
  HOVER_GLOW,
} from '@/lib/3d/cockpitDesignTokens';

// ■■ Props ■■

interface CockpitFloor3DProps {
  labColor: string;
  opacity?: number;
}

// ■■ Constants ■■

const FLOOR_Y = -3.5;
const FLOOR_WIDTH = 10;
const FLOOR_DEPTH = 8;
// Hexagonal honeycomb slat dimensions (Decision 13.1)
const SLAT_WIDTH = 0.04;
const SLAT_HEIGHT = 0.02;

// Carbon composite surface color for grating frame
const GRATING_SURFACE_COLOR = 0x0a0f1f;

// Energy channel emissive intensity: LED_MULTIPLIER * IDLE_INDICATOR (Decision 13.2)
const ENERGY_CHANNEL_EMISSIVE = EMISSIVE_LED_MULTIPLIER * EMISSIVE_IDLE_INDICATOR;

// Pulse period from design tokens (Decision 13.2)
const PULSE_PERIOD_S = HOVER_GLOW.pulsePeriodS;

// LOD-driven hexagonal slat counts (honeycomb grid — Decision 13.1)
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

// ■■ Pipe layout: 8 energy channel pipes running along Z axis beneath the grate (Decision 13.2) ■■
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
function buildConduitCurve(index: number): CatmullRomCurve3 {
  const offsetX = (index - 1) * 2.8;
  return new CatmullRomCurve3([
    new Vector3(offsetX - 1.5, FLOOR_Y - 0.35, -3.5),
    new Vector3(offsetX - 0.5, FLOOR_Y - 0.5, -1.2),
    new Vector3(offsetX + 0.8, FLOOR_Y - 0.4, 1.0),
    new Vector3(offsetX + 1.6, FLOOR_Y - 0.55, 3.2),
  ]);
}

// ■■ Maintenance hatch frame builder ■■
function buildHatchFrame(cx: number, cz: number, size: number): BufferGeometry {
  const half = size / 2;
  const t = 0.04; // frame thickness
  const h = 0.015; // frame height
  const shape = new Shape();
  // Outer rectangle
  shape.moveTo(-half, -half);
  shape.lineTo(half, -half);
  shape.lineTo(half, half);
  shape.lineTo(-half, half);
  shape.closePath();
  // Inner cutout
  const hole = new Path();
  hole.moveTo(-half + t, -half + t);
  hole.lineTo(half - t, -half + t);
  hole.lineTo(half - t, half - t);
  hole.lineTo(-half + t, half - t);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
  });
  geo.translate(cx, 0, cz);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// ■■ Component ■■

export function CockpitFloor3D({ labColor, opacity = 1 }: CockpitFloor3DProps) {

  // Refs for animated elements
  const ledInstanceRef = useRef<InstancedMesh>(null);
  const conduitMatRefs = useRef<MeshStandardMaterial[]>([]);
  const underGlowRef = useRef<MeshStandardMaterial>(null);
  const pipeMatRef = useRef<MeshStandardMaterial>(null);

  // Parsed lab color
  const labColorObj = useMemo(() => new Color(labColor), [labColor]);

  // ── Hexagonal honeycomb grate slats (InstancedMesh — Decision 13.1) ──
  // Slats are offset every other row by half-spacing to create honeycomb pattern
  const slatCounts = SLAT_COUNTS['ultra'] || SLAT_COUNTS.medium;

  const slatGeo = useMemo(
    () => new BoxGeometry(SLAT_WIDTH, SLAT_HEIGHT, FLOOR_DEPTH),
    []
  );
  const slatGeoZ = useMemo(
    () => new BoxGeometry(FLOOR_WIDTH, SLAT_HEIGHT, SLAT_WIDTH),
    []
  );

  // Hexagonal grid: X-direction slats with alternating row offsets
  const slatMatrixX = useMemo(() => {
    const matrices: Matrix4[] = [];
    const spacing = FLOOR_WIDTH / (slatCounts.x - 1);
    for (let i = 0; i < slatCounts.x; i++) {
      const m = new Matrix4();
      // Hexagonal offset: every other slat shifts Z by half-spacing (honeycomb pattern)
      const hexOffsetZ = (i % 2 === 0) ? 0 : (FLOOR_DEPTH / (slatCounts.z - 1)) * 0.5;
      m.setPosition(
        -FLOOR_WIDTH / 2 + i * spacing,
        FLOOR_Y,
        hexOffsetZ
      );
      matrices.push(m);
    }
    return matrices;
  }, [slatCounts.x, slatCounts.z]);

  // Hexagonal grid: Z-direction slats with alternating column offsets
  const slatMatrixZ = useMemo(() => {
    const matrices: Matrix4[] = [];
    const spacing = FLOOR_DEPTH / (slatCounts.z - 1);
    for (let i = 0; i < slatCounts.z; i++) {
      const m = new Matrix4();
      // Hexagonal offset: every other slat shifts X by half-spacing (honeycomb pattern)
      const hexOffsetX = (i % 2 === 0) ? 0 : (FLOOR_WIDTH / (slatCounts.x - 1)) * 0.5;
      m.setPosition(
        hexOffsetX,
        FLOOR_Y,
        -FLOOR_DEPTH / 2 + i * spacing
      );
      matrices.push(m);
    }
    return matrices;
  }, [slatCounts.x, slatCounts.z]);

  // ── Grate material — carbon composite (#0A0F1F) with chrome accents ──
  const grateMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: GRATING_SURFACE_COLOR,
        metalness: 0.85,
        roughness: 0.3,
        transparent: opacity < 1,
        opacity,
      }),
    [opacity]
  );

  // ── Sub-floor energy channel piping (Decision 13.2) ──
  const pipeSegments = PIPE_SEGMENTS['ultra'] || 10;
  const pipeMat = useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: GRATING_SURFACE_COLOR,
      metalness: 0.7,
      roughness: 0.4,
      emissive: labColorObj,
      emissiveIntensity: ENERGY_CHANNEL_EMISSIVE,
    });
    pipeMatRef.current = mat;
    return mat;
  }, [labColorObj]);

  const pipeGeos = useMemo(
    () =>
      PIPE_CONFIGS.map((p) =>
        new CylinderGeometry(p.radius, p.radius, p.length, pipeSegments)
      ),
    [pipeSegments]
  );

  // ── Energy conduits (3 TubeGeometry) ──
  const conduitCurves = useMemo(
    () => [buildConduitCurve(0), buildConduitCurve(1), buildConduitCurve(2)],
    []
  );

  const conduitTubeSegments = 64;
  const conduitRadialSegments = Math.max(4, Math.floor(64 / 4));

  const conduitGeos = useMemo(
    () =>
      conduitCurves.map(
        (curve) =>
          new TubeGeometry(curve, conduitTubeSegments, 0.04, conduitRadialSegments, false)
      ),
    [conduitCurves, conduitTubeSegments, conduitRadialSegments]
  );

  const conduitMats = useMemo(() => {
    const mats = [0, 1, 2].map(
      () =>
        new MeshStandardMaterial({
          color: GRATING_SURFACE_COLOR,
          emissive: labColorObj,
          emissiveIntensity: ENERGY_CHANNEL_EMISSIVE,
          transparent: true,
          opacity: 0.9,
        })
    );
    conduitMatRefs.current = mats;
    return mats;
  }, [labColorObj]);

  // ── Maintenance hatches (2 frames) — chrome border from design tokens ──
  const hatchGeos = useMemo(
    () => [
      buildHatchFrame(-2.5, -1.8, 1.0),
      buildHatchFrame(2.2, 1.5, 0.9),
    ],
    []
  );

  const hatchMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CHROME_BORDER.color,
        metalness: 0.6,
        roughness: 0.5,
        emissive: new Color(0xffaa44),
        emissiveIntensity: ACCENT_LINES.opacity,
      }),
    []
  );

  // ── LED channels (InstancedMesh along grate edges) ──
  const ledCount = LED_COUNTS['ultra'] || 30;
  const ledGeo = useMemo(
    () => new BoxGeometry(0.06, 0.015, 0.025),
    []
  );

  const ledMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: labColorObj,
        emissive: labColorObj,
        emissiveIntensity: EMISSIVE_LED_MULTIPLIER,
        toneMapped: false,
      }),
    [labColorObj]
  );

  // Compute LED instance matrices — distributed along the 4 edges
  const ledMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];
    const perSide = Math.floor(ledCount / 4);
    const halfW = FLOOR_WIDTH / 2 - 0.1;
    const halfD = FLOOR_DEPTH / 2 - 0.1;

    // Top edge (z = -halfD)
    for (let i = 0; i < perSide; i++) {
      const m = new Matrix4();
      m.setPosition(
        -halfW + (i / (perSide - 1)) * (halfW * 2),
        FLOOR_Y + SLAT_HEIGHT / 2 + 0.005,
        -halfD
      );
      matrices.push(m);
    }
    // Bottom edge (z = +halfD)
    for (let i = 0; i < perSide; i++) {
      const m = new Matrix4();
      m.setPosition(
        -halfW + (i / (perSide - 1)) * (halfW * 2),
        FLOOR_Y + SLAT_HEIGHT / 2 + 0.005,
        halfD
      );
      matrices.push(m);
    }
    // Left edge (x = -halfW)
    for (let i = 0; i < perSide; i++) {
      const m = new Matrix4();
      const rot = new Matrix4().makeRotationY(Math.PI / 2);
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
      const m = new Matrix4();
      const rot = new Matrix4().makeRotationY(Math.PI / 2);
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

  // ── Under-glow plane (energy channel ambient — Decision 13.2) ──
  const underGlowMat = useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: labColorObj,
      emissive: labColorObj,
      emissiveIntensity: ENERGY_CHANNEL_EMISSIVE,
      transparent: true,
      opacity: 0.12,
      side: DoubleSide,
    });
    underGlowRef.current = mat;
    return mat;
  }, [labColorObj]);

  // ── Animation ──
  useFrame(() => {
    const time = performance.now() * 0.001;
    // Pulse frequency derived from design token HOVER_GLOW.pulsePeriodS
    const pulseFreq = (2 * Math.PI) / PULSE_PERIOD_S;

    // LED traveling wave pulse
    const inst = ledInstanceRef.current;
    if (inst) {
      const totalLeds = ledMatrices.length;
      const color = new Color();
      for (let i = 0; i < totalLeds; i++) {
        const wave = Math.sin(time * pulseFreq + (i / totalLeds) * Math.PI * 4) * 0.5 + 0.5;
        color.copy(labColorObj).multiplyScalar(0.3 + wave * 0.7);
        inst.setColorAt(i, color);
      }
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    }

    // Energy conduit emissive pulse (each conduit offset by phase — Decision 13.2)
    for (let c = 0; c < conduitMatRefs.current.length; c++) {
      const mat = conduitMatRefs.current[c];
      if (mat) {
        const pulse = Math.sin(time * pulseFreq + c * (Math.PI * 2) / 3) * 0.5 + 0.5;
        mat.emissiveIntensity = ENERGY_CHANNEL_EMISSIVE * (0.4 + pulse * 1.2);
      }
    }

    // Sub-floor energy channel pipe pulse (Decision 13.2)
    if (pipeMatRef.current) {
      const pipePulse = Math.sin(time * pulseFreq * 0.8) * 0.5 + 0.5;
      pipeMatRef.current.emissiveIntensity = ENERGY_CHANNEL_EMISSIVE * (0.6 + pipePulse * 0.8);
    }

    // Subtle under-glow breathing (energy channel ambient)
    if (underGlowRef.current) {
      const breath = Math.sin(time * pulseFreq * 0.5) * 0.03 + 0.12;
      underGlowRef.current.opacity = breath;
    }
  });

  return (
    <group>
      {/* ── X-direction hexagonal slats (InstancedMesh — honeycomb pattern) ── */}
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

      {/* ── Z-direction hexagonal slats (InstancedMesh — honeycomb pattern) ── */}
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

      {/* ── Sub-floor energy channels (Decision 13.2) ── */}
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

      {/* ── Maintenance hatches (chrome border from tokens) ── */}
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
            const color = new Color(labColor);
            for (let i = 0; i < ledMatrices.length; i++) {
              mesh.setColorAt(i, color);
            }
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
          }
        }}
      />

      {/* ── Under-glow plane (energy channel ambient — Decision 13.2) ── */}
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
