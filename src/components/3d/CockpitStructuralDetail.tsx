'use client';

// ================================================================
// CPA v2.0 — CockpitStructuralDetail: Structural Set Dressing
// ================================================================
// 20M Cockpit Upgrade — adds physical plausibility to the cockpit:
//   - Cable bundles (50+ TubeGeometry splines along ceiling/walls)
//   - Conduit pipes (8 horizontal pipes with junction boxes)
//   - Ventilation panels (4 grille panels, instanced slats)
//   - Structural ribs (12 arc-shaped ribs around cockpit cylinder)
//   - Access hatches (4 rectangular hatch outlines)
//   - LED indicator strips (100+ emissive boxes along cable routes)
//   - Warning signage (2-3 emissive plane markers)
//
// Triangle budget: ~1,500,000
// LOD-aware via useLOD({ tier: 'system' })
// All geometry fits within cockpit shell (radius ~4.0, 140° arc)

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLOD } from '@/hooks/useLOD';

// ■■ Props ■■

interface CockpitStructuralDetailProps {
  opacity: number;
  labColor: string;
}

// ■■ LOD-Scaled Counts ■■

interface ScaledCounts {
  cables: number;
  ribs: number;
  leds: number;
  pipes: number;
  ventSlatsPerPanel: number;
  hatches: number;
  signs: number;
}

function getScaledCounts(level: string): ScaledCounts {
  switch (level) {
    case 'ultra':
      return { cables: 60, ribs: 12, leds: 200, pipes: 8, ventSlatsPerPanel: 20, hatches: 4, signs: 3 };
    case 'high':
      return { cables: 40, ribs: 12, leds: 120, pipes: 8, ventSlatsPerPanel: 14, hatches: 4, signs: 3 };
    case 'medium':
      return { cables: 24, ribs: 8, leds: 60, pipes: 6, ventSlatsPerPanel: 10, hatches: 2, signs: 2 };
    case 'low':
      return { cables: 12, ribs: 6, leds: 30, pipes: 4, ventSlatsPerPanel: 6, hatches: 2, signs: 1 };
    default:
      return { cables: 6, ribs: 4, leds: 10, pipes: 2, ventSlatsPerPanel: 4, hatches: 1, signs: 1 };
  }
}

// ■■ Cockpit Shell Constants ■■

const COCKPIT_RADIUS = 4.0;
const ARC_DEG = 140;
const ARC_RAD = (ARC_DEG * Math.PI) / 180;
const ARC_START = -ARC_RAD / 2;
const COCKPIT_HEIGHT = 3.0;
const COCKPIT_Y_MIN = -1.2;
const COCKPIT_Y_MAX = COCKPIT_Y_MIN + COCKPIT_HEIGHT;

// Chrome surface color
const CHROME_COLOR = 0x1a1822;
const CHROME_DARK = 0x111118;

// ■■ Seeded RNG for deterministic placement ■■

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ■■ Cable Path Generator ■■

function generateCablePaths(count: number): THREE.CatmullRomCurve3[] {
  const rng = seededRandom(42);
  const curves: THREE.CatmullRomCurve3[] = [];

  for (let i = 0; i < count; i++) {
    const pointCount = 5 + Math.floor(rng() * 4);
    const points: THREE.Vector3[] = [];

    // Cable runs along the cockpit arc — pick a random Y band
    const yBase = COCKPIT_Y_MIN + rng() * COCKPIT_HEIGHT;
    const yDrift = (rng() - 0.5) * 0.4;
    // Radius: slightly inset from cockpit shell
    const r = COCKPIT_RADIUS - 0.05 - rng() * 0.15;

    // Sweep a portion of the arc
    const sweepStart = ARC_START + rng() * ARC_RAD * 0.3;
    const sweepEnd = sweepStart + ARC_RAD * (0.3 + rng() * 0.5);

    for (let p = 0; p < pointCount; p++) {
      const t = p / (pointCount - 1);
      const angle = sweepStart + t * (sweepEnd - sweepStart);
      const y = yBase + t * yDrift + (rng() - 0.5) * 0.08;
      const rOffset = r + (rng() - 0.5) * 0.06;
      points.push(
        new THREE.Vector3(
          Math.sin(angle) * rOffset,
          y,
          -Math.cos(angle) * rOffset
        )
      );
    }

    curves.push(new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5));
  }

  return curves;
}

// ■■ Cable Bundles Sub-Component ■■

function CableBundles({
  count,
  tubularSegments,
  chromeMaterial,
}: {
  count: number;
  tubularSegments: number;
  chromeMaterial: THREE.MeshStandardMaterial;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const { geometry, totalInstances } = useMemo(() => {
    const curves = generateCablePaths(count);
    const tempMatrix = new THREE.Matrix4();
    const matrices: THREE.Matrix4[] = [];

    // We create a single representative tube geometry and instance it.
    // Each cable segment is a stretched cylinder instance placed along the path.
    const segmentsPerCable = Math.min(tubularSegments, 16);
    const segGeo = new THREE.CylinderGeometry(0.008, 0.008, 1, 4, 1);
    // Rotate cylinder so its length axis is along Z for easier orientation
    segGeo.rotateX(Math.PI / 2);

    for (const curve of curves) {
      const pts = curve.getSpacedPoints(segmentsPerCable);
      for (let s = 0; s < pts.length - 1; s++) {
        const start = pts[s];
        const end = pts[s + 1];
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(end, start);
        const len = dir.length();

        const mat = new THREE.Matrix4();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion();
        quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
        mat.compose(mid, quat, new THREE.Vector3(1, 1, len));
        matrices.push(mat.clone());
      }
    }

    return { geometry: segGeo, totalInstances: matrices.length };
  }, [count, tubularSegments]);

  // Set instance matrices
  useMemo(() => {
    if (!meshRef.current) return;
    const curves = generateCablePaths(count);
    const segmentsPerCable = Math.min(tubularSegments, 16);
    let idx = 0;
    const mat4 = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const dir = new THREE.Vector3();
    const mid = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, 1);

    for (const curve of curves) {
      const pts = curve.getSpacedPoints(segmentsPerCable);
      for (let s = 0; s < pts.length - 1; s++) {
        mid.addVectors(pts[s], pts[s + 1]).multiplyScalar(0.5);
        dir.subVectors(pts[s + 1], pts[s]);
        const len = dir.length();
        quat.setFromUnitVectors(forward, dir.normalize());
        mat4.compose(mid, quat, new THREE.Vector3(1, 1, len));
        meshRef.current.setMatrixAt(idx, mat4);
        idx++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, tubularSegments]);

  if (totalInstances === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, chromeMaterial, totalInstances]}
      frustumCulled={false}
    />
  );
}

// ■■ Conduit Pipes Sub-Component ■■

function ConduitPipes({
  count,
  segments,
  chromeMaterial,
}: {
  count: number;
  segments: number;
  chromeMaterial: THREE.MeshStandardMaterial;
}) {
  const rng = useMemo(() => seededRandom(137), []);

  const pipes = useMemo(() => {
    const gen = seededRandom(137);
    const result: { position: THREE.Vector3; angle: number; length: number }[] = [];

    for (let i = 0; i < count; i++) {
      const y = COCKPIT_Y_MIN + 0.3 + gen() * (COCKPIT_HEIGHT - 0.6);
      const angleStart = ARC_START + gen() * ARC_RAD * 0.2;
      const angleEnd = angleStart + ARC_RAD * (0.2 + gen() * 0.4);
      const angleMid = (angleStart + angleEnd) / 2;
      const r = COCKPIT_RADIUS - 0.12 - gen() * 0.1;

      result.push({
        position: new THREE.Vector3(
          Math.sin(angleMid) * r,
          y,
          -Math.cos(angleMid) * r
        ),
        angle: angleMid,
        length: (angleEnd - angleStart) * r,
      });
    }
    return result;
  }, [count]);

  // Junction boxes along each pipe
  const junctions = useMemo(() => {
    const gen = seededRandom(222);
    const result: THREE.Vector3[] = [];
    for (const pipe of pipes) {
      const jCount = 2 + Math.floor(gen() * 2);
      for (let j = 0; j < jCount; j++) {
        const offset = (gen() - 0.5) * pipe.length * 0.8;
        result.push(
          new THREE.Vector3(
            pipe.position.x + Math.sin(pipe.angle + 0.02) * offset * 0.3,
            pipe.position.y + (gen() - 0.5) * 0.05,
            pipe.position.z - Math.cos(pipe.angle + 0.02) * offset * 0.3
          )
        );
      }
    }
    return result;
  }, [pipes]);

  return (
    <group>
      {pipes.map((pipe, i) => (
        <mesh
          key={`pipe-${i}`}
          position={pipe.position}
          rotation={[0, -pipe.angle, 0]}
          material={chromeMaterial}
        >
          <cylinderGeometry args={[0.025, 0.025, pipe.length, segments, 1]} />
        </mesh>
      ))}
      {junctions.map((pos, i) => (
        <mesh
          key={`junction-${i}`}
          position={pos}
          material={chromeMaterial}
        >
          <boxGeometry args={[0.06, 0.06, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Ventilation Panels Sub-Component ■■

function VentilationPanels({
  slatsPerPanel,
  chromeMaterial,
}: {
  slatsPerPanel: number;
  chromeMaterial: THREE.MeshStandardMaterial;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  // 4 vent panels at fixed positions around the cockpit arc
  const panelConfigs = useMemo(
    () => [
      { angle: ARC_START + ARC_RAD * 0.15, y: COCKPIT_Y_MAX - 0.3 },
      { angle: ARC_START + ARC_RAD * 0.40, y: COCKPIT_Y_MAX - 0.25 },
      { angle: ARC_START + ARC_RAD * 0.60, y: COCKPIT_Y_MAX - 0.25 },
      { angle: ARC_START + ARC_RAD * 0.85, y: COCKPIT_Y_MAX - 0.3 },
    ],
    []
  );

  const totalSlats = panelConfigs.length * slatsPerPanel;
  const slatGeo = useMemo(
    () => new THREE.BoxGeometry(0.22, 0.004, 0.005),
    []
  );

  useMemo(() => {
    if (!meshRef.current) return;
    const mat4 = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    let idx = 0;

    for (const panel of panelConfigs) {
      const r = COCKPIT_RADIUS - 0.04;
      const baseX = Math.sin(panel.angle) * r;
      const baseZ = -Math.cos(panel.angle) * r;

      for (let s = 0; s < slatsPerPanel; s++) {
        const slatY = panel.y + s * 0.012;
        pos.set(baseX, slatY, baseZ);
        quat.setFromEuler(new THREE.Euler(0, -panel.angle, 0.25));
        mat4.compose(pos, quat, scale);
        meshRef.current.setMatrixAt(idx, mat4);
        idx++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [panelConfigs, slatsPerPanel]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[slatGeo, chromeMaterial, totalSlats]}
      frustumCulled={false}
    />
  );
}

// ■■ Structural Ribs Sub-Component ■■

function StructuralRibs({
  count,
  segments,
  chromeMaterial,
}: {
  count: number;
  segments: number;
  chromeMaterial: THREE.MeshStandardMaterial;
}) {
  const ribs = useMemo(() => {
    const result: { angle: number }[] = [];
    const step = ARC_RAD / (count + 1);
    for (let i = 1; i <= count; i++) {
      result.push({ angle: ARC_START + step * i });
    }
    return result;
  }, [count]);

  // Each rib is a torus segment (partial arc in the Y plane)
  const ribGeo = useMemo(() => {
    const geo = new THREE.TorusGeometry(
      COCKPIT_RADIUS - 0.02, // major radius matches cockpit shell
      0.02,                   // tube radius — thin structural rib
      6,                      // radial segments
      segments,               // tubular segments
      Math.PI * 0.55          // partial arc covering cockpit height
    );
    return geo;
  }, [segments]);

  return (
    <group>
      {ribs.map((rib, i) => (
        <mesh
          key={`rib-${i}`}
          geometry={ribGeo}
          material={chromeMaterial}
          position={[
            Math.sin(rib.angle) * 0,
            (COCKPIT_Y_MIN + COCKPIT_Y_MAX) / 2,
            0,
          ]}
          rotation={[0, -rib.angle, Math.PI / 2]}
        />
      ))}
    </group>
  );
}

// ■■ Access Hatches Sub-Component ■■

function AccessHatches({
  count,
  chromeMaterial,
}: {
  count: number;
  chromeMaterial: THREE.MeshStandardMaterial;
}) {
  const hatches = useMemo(() => {
    const gen = seededRandom(999);
    const result: { angle: number; y: number; width: number; height: number }[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        angle: ARC_START + ARC_RAD * (0.15 + (i / count) * 0.7),
        y: COCKPIT_Y_MIN + 0.4 + gen() * 1.0,
        width: 0.25 + gen() * 0.1,
        height: 0.35 + gen() * 0.1,
      });
    }
    return result;
  }, [count]);

  // Hatch = thin rectangular frame (4 thin boxes forming outline)
  return (
    <group>
      {hatches.map((hatch, i) => {
        const r = COCKPIT_RADIUS - 0.03;
        const cx = Math.sin(hatch.angle) * r;
        const cz = -Math.cos(hatch.angle) * r;
        const hw = hatch.width / 2;
        const hh = hatch.height / 2;
        const frameThick = 0.008;
        const frameDepth = 0.012;
        const rotY = -hatch.angle;

        return (
          <group key={`hatch-${i}`} position={[cx, hatch.y, cz]} rotation={[0, rotY, 0]}>
            {/* Top bar */}
            <mesh position={[0, hh, 0]} material={chromeMaterial}>
              <boxGeometry args={[hatch.width, frameThick, frameDepth]} />
            </mesh>
            {/* Bottom bar */}
            <mesh position={[0, -hh, 0]} material={chromeMaterial}>
              <boxGeometry args={[hatch.width, frameThick, frameDepth]} />
            </mesh>
            {/* Left bar */}
            <mesh position={[-hw, 0, 0]} material={chromeMaterial}>
              <boxGeometry args={[frameThick, hatch.height, frameDepth]} />
            </mesh>
            {/* Right bar */}
            <mesh position={[hw, 0, 0]} material={chromeMaterial}>
              <boxGeometry args={[frameThick, hatch.height, frameDepth]} />
            </mesh>
            {/* Handle nub */}
            <mesh position={[hw - 0.04, 0, 0.01]} material={chromeMaterial}>
              <cylinderGeometry args={[0.008, 0.008, 0.04, 6, 1]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ■■ LED Indicator Strips Sub-Component (Animated) ■■

function LEDIndicatorStrips({
  count,
  labColor,
  opacity,
}: {
  count: number;
  labColor: string;
  opacity: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const emissiveColor = useMemo(() => new THREE.Color(labColor), [labColor]);
  const timeRef = useRef(0);

  // Pre-compute LED positions along cable routes
  const ledPositions = useMemo(() => {
    const gen = seededRandom(777);
    const positions: { pos: THREE.Vector3; phaseOffset: number }[] = [];

    // Distribute LEDs along the cockpit arc at various heights
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = ARC_START + t * ARC_RAD;
      const r = COCKPIT_RADIUS - 0.06 - gen() * 0.12;
      // Several horizontal bands with some variation
      const band = Math.floor(gen() * 5);
      const baseY = COCKPIT_Y_MIN + 0.2 + band * (COCKPIT_HEIGHT / 5);
      const y = baseY + (gen() - 0.5) * 0.15;

      positions.push({
        pos: new THREE.Vector3(
          Math.sin(angle) * r,
          y,
          -Math.cos(angle) * r
        ),
        phaseOffset: t * Math.PI * 6 + band * 1.2,
      });
    }
    return positions;
  }, [count]);

  const ledGeo = useMemo(() => new THREE.BoxGeometry(0.012, 0.006, 0.006), []);

  const ledMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: emissiveColor,
        emissive: emissiveColor,
        emissiveIntensity: 2.0,
        transparent: true,
        opacity,
        toneMapped: false,
      }),
    [emissiveColor, opacity]
  );

  // Initialize instance matrices
  useMemo(() => {
    if (!meshRef.current) return;
    const mat4 = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < ledPositions.length; i++) {
      const { pos } = ledPositions[i];
      const angle = Math.atan2(pos.x, -pos.z);
      quat.setFromEuler(new THREE.Euler(0, -angle, 0));
      mat4.compose(pos, quat, scale);
      meshRef.current.setMatrixAt(i, mat4);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [ledPositions]);

  // Animate: gentle phase-offset sine pulse
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const mat4 = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();

    for (let i = 0; i < ledPositions.length; i++) {
      const led = ledPositions[i];
      const pulse = 0.7 + 0.3 * Math.sin(t * 2.5 + led.phaseOffset);
      const angle = Math.atan2(led.pos.x, -led.pos.z);
      quat.setFromEuler(new THREE.Euler(0, -angle, 0));
      scale.set(pulse, pulse, pulse);
      mat4.compose(led.pos, quat, scale);
      meshRef.current.setMatrixAt(i, mat4);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Update emissive intensity for global pulse
    const globalPulse = 1.5 + 0.5 * Math.sin(t * 1.8);
    ledMaterial.emissiveIntensity = globalPulse;
    ledMaterial.opacity = opacity;
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[ledGeo, ledMaterial, count]}
      frustumCulled={false}
    />
  );
}

// ■■ Warning Signage Sub-Component ■■

function WarningSigns({
  count,
}: {
  count: number;
}) {
  const signs = useMemo(() => {
    const configs: { angle: number; y: number; label: string }[] = [
      { angle: ARC_START + ARC_RAD * 0.12, y: COCKPIT_Y_MIN + 0.6, label: 'CAUTION' },
      { angle: ARC_START + ARC_RAD * 0.50, y: COCKPIT_Y_MAX - 0.15, label: 'HIGH VOLTAGE' },
      { angle: ARC_START + ARC_RAD * 0.88, y: COCKPIT_Y_MIN + 0.5, label: 'NO ACCESS' },
    ];
    return configs.slice(0, count);
  }, [count]);

  const signMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xff6644,
        emissive: new THREE.Color(0xff6644),
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        toneMapped: false,
      }),
    []
  );

  const borderMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffaa44,
        emissive: new THREE.Color(0xffaa44),
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9,
        toneMapped: false,
      }),
    []
  );

  return (
    <group>
      {signs.map((sign, i) => {
        const r = COCKPIT_RADIUS - 0.02;
        const x = Math.sin(sign.angle) * r;
        const z = -Math.cos(sign.angle) * r;
        const rotY = -sign.angle;

        return (
          <group key={`sign-${i}`} position={[x, sign.y, z]} rotation={[0, rotY, 0]}>
            {/* Sign background */}
            <mesh material={signMaterial}>
              <planeGeometry args={[0.12, 0.04]} />
            </mesh>
            {/* Border frame */}
            <mesh position={[0, 0, -0.001]} material={borderMaterial}>
              <planeGeometry args={[0.13, 0.05]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ■■ Main Component ■■

export function CockpitStructuralDetail({
  opacity,
  labColor,
}: CockpitStructuralDetailProps) {
  const lod = useLOD({ tier: 'system' });
  const counts = useMemo(() => getScaledCounts(lod.level), [lod.level]);

  // Shared chrome material for structural elements
  const chromeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: CHROME_COLOR,
        metalness: 0.85,
        roughness: 0.35,
        transparent: true,
        opacity,
      }),
    [opacity]
  );

  // Update opacity reactively
  useFrame(() => {
    if (chromeMaterial.opacity !== opacity) {
      chromeMaterial.opacity = opacity;
    }
  });

  // At billboard LOD, skip rendering entirely
  if (lod.level === 'billboard') return null;

  return (
    <group name="cockpit-structural-detail">
      {/* Cable Bundles — 50+ TubeGeometry splines along ceiling/walls */}
      <CableBundles
        count={counts.cables}
        tubularSegments={lod.tubularSegments}
        chromeMaterial={chromeMaterial}
      />

      {/* Conduit Pipes — horizontal pipes with junction boxes */}
      <ConduitPipes
        count={counts.pipes}
        segments={lod.segments}
        chromeMaterial={chromeMaterial}
      />

      {/* Ventilation Panels — 4 grille panels with instanced slats */}
      <VentilationPanels
        slatsPerPanel={counts.ventSlatsPerPanel}
        chromeMaterial={chromeMaterial}
      />

      {/* Structural Ribs — arc-shaped ribs evenly spaced */}
      <StructuralRibs
        count={counts.ribs}
        segments={lod.segments}
        chromeMaterial={chromeMaterial}
      />

      {/* Access Hatches — rectangular outlines */}
      <AccessHatches
        count={counts.hatches}
        chromeMaterial={chromeMaterial}
      />

      {/* LED Indicator Strips — emissive boxes along cable routes */}
      <LEDIndicatorStrips
        count={counts.leds}
        labColor={labColor}
        opacity={opacity}
      />

      {/* Warning Signage — emissive plane markers */}
      <WarningSigns count={counts.signs} />
    </group>
  );
}

export default CockpitStructuralDetail;
