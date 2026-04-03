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

// All geometry fits within cockpit shell (radius ~4.0, 140° arc)

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  TorusGeometry,
  Vector3,
} from 'three';
import {
  CHROME_BORDER,
  ACCENT_LINES,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_SCALE,
  type EmissiveLevel,
} from '@/lib/3d/cockpitDesignTokens';

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

// Surface colors — design token aligned
const CHROME_COLOR = CHROME_BORDER.color; // #a8b5c8 alloy chrome
const CARBON_COMPOSITE = 0x0a0f1f; // Dark carbon composite for panels/covers

// ■■ Seeded RNG for deterministic placement ■■

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ■■ Cable Path Generator ■■

function generateCablePaths(count: number): CatmullRomCurve3[] {
  const rng = seededRandom(42);
  const curves: CatmullRomCurve3[] = [];

  for (let i = 0; i < count; i++) {
    const pointCount = 5 + Math.floor(rng() * 4);
    const points: Vector3[] = [];

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
        new Vector3(
          Math.sin(angle) * rOffset,
          y,
          -Math.cos(angle) * rOffset
        )
      );
    }

    curves.push(new CatmullRomCurve3(points, false, 'catmullrom', 0.5));
  }

  return curves;
}

// ■■ Cable Bundles Sub-Component ■■
// Design Decision 14.1: Hidden cables — cables run inside recessed channels
// with carbon composite panel covers. The cables themselves are hidden behind
// cover geometry; only the tidy cover panels are visible.

function CableBundles({
  count,
  tubularSegments,
  chromeMaterial,
  coverMaterial,
}: {
  count: number;
  tubularSegments: number;
  chromeMaterial: MeshStandardMaterial;
  coverMaterial: MeshStandardMaterial;
}) {
  const cableMeshRef = useRef<InstancedMesh>(null!);
  const coverMeshRef = useRef<InstancedMesh>(null!);

  const { cableGeo, coverGeo, totalInstances } = useMemo(() => {
    const curves = generateCablePaths(count);
    const segmentsPerCable = Math.min(tubularSegments, 16);

    // Hidden cable geometry — thin cylinder segments (recessed behind covers)
    const segGeo = new CylinderGeometry(0.008, 0.008, 1, 4, 1);
    segGeo.rotateX(Math.PI / 2);

    // Panel cover geometry — flat rectangular cover over cable channel
    const panelGeo = new BoxGeometry(0.028, 0.006, 1);
    panelGeo.rotateX(Math.PI / 2);

    let instanceCount = 0;
    for (const curve of curves) {
      const pts = curve.getSpacedPoints(segmentsPerCable);
      instanceCount += pts.length - 1;
    }

    return { cableGeo: segGeo, coverGeo: panelGeo, totalInstances: instanceCount };
  }, [count, tubularSegments]);

  // Set instance matrices for both cables (recessed) and covers (visible)
  useMemo(() => {
    if (!cableMeshRef.current || !coverMeshRef.current) return;
    const curves = generateCablePaths(count);
    const segmentsPerCable = Math.min(tubularSegments, 16);
    let idx = 0;
    const mat4 = new Matrix4();
    const coverMat4 = new Matrix4();
    const quat = new Quaternion();
    const dir = new Vector3();
    const mid = new Vector3();
    const coverMid = new Vector3();
    const forward = new Vector3(0, 0, 1);

    for (const curve of curves) {
      const pts = curve.getSpacedPoints(segmentsPerCable);
      for (let s = 0; s < pts.length - 1; s++) {
        mid.addVectors(pts[s], pts[s + 1]).multiplyScalar(0.5);
        dir.subVectors(pts[s + 1], pts[s]);
        const len = dir.length();
        quat.setFromUnitVectors(forward, dir.normalize());

        // Cable: slightly recessed inward (hidden behind cover)
        const inwardOffset = dir.clone().normalize().cross(new Vector3(0, 1, 0)).normalize().multiplyScalar(-0.005);
        coverMid.copy(mid);
        mat4.compose(mid.clone().add(inwardOffset), quat, new Vector3(1, 1, len));
        cableMeshRef.current.setMatrixAt(idx, mat4);

        // Cover panel: at the cable position, facing outward
        coverMat4.compose(coverMid, quat, new Vector3(1, 1, len));
        coverMeshRef.current.setMatrixAt(idx, coverMat4);
        idx++;
      }
    }
    cableMeshRef.current.instanceMatrix.needsUpdate = true;
    coverMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, tubularSegments]);

  if (totalInstances === 0) return null;

  return (
    <group>
      {/* Hidden cables — recessed behind cover panels */}
      <instancedMesh
        ref={cableMeshRef}
        args={[cableGeo, chromeMaterial, totalInstances]}
        frustumCulled={false}
        visible={false} // Cables hidden behind covers per Decision 14.1
      />
      {/* Carbon composite panel covers — visible, tidy, premium */}
      <instancedMesh
        ref={coverMeshRef}
        args={[coverGeo, coverMaterial, totalInstances]}
        frustumCulled={false}
      />
    </group>
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
  chromeMaterial: MeshStandardMaterial;
}) {
  const _rng = useMemo(() => seededRandom(137), []);

  const pipes = useMemo(() => {
    const gen = seededRandom(137);
    const result: { position: Vector3; angle: number; length: number }[] = [];

    for (let i = 0; i < count; i++) {
      const y = COCKPIT_Y_MIN + 0.3 + gen() * (COCKPIT_HEIGHT - 0.6);
      const angleStart = ARC_START + gen() * ARC_RAD * 0.2;
      const angleEnd = angleStart + ARC_RAD * (0.2 + gen() * 0.4);
      const angleMid = (angleStart + angleEnd) / 2;
      const r = COCKPIT_RADIUS - 0.12 - gen() * 0.1;

      result.push({
        position: new Vector3(
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
    const result: Vector3[] = [];
    for (const pipe of pipes) {
      const jCount = 2 + Math.floor(gen() * 2);
      for (let j = 0; j < jCount; j++) {
        const offset = (gen() - 0.5) * pipe.length * 0.8;
        result.push(
          new Vector3(
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
// Design Decision 14.2: Perforated circles — circular hole patterns in vent
// panels for a decorative aerospace aesthetic. Each vent panel is a carbon
// composite surface with instanced circular perforations arranged in a grid.

function VentilationPanels({
  slatsPerPanel,
  ventMaterial,
}: {
  slatsPerPanel: number;
  ventMaterial: MeshStandardMaterial;
}) {
  const meshRef = useRef<InstancedMesh>(null!);

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

  // Perforated circle geometry: small cylinder representing each circular hole rim
  const perforationGeo = useMemo(
    () => new CylinderGeometry(0.004, 0.004, 0.005, 8, 1),
    []
  );

  // Grid of circular perforations per panel (rows x cols derived from slatsPerPanel)
  const cols = 6;
  const rows = slatsPerPanel;
  const totalPerforations = panelConfigs.length * rows * cols;

  useMemo(() => {
    if (!meshRef.current) return;
    const mat4 = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scale = new Vector3(1, 1, 1);
    let idx = 0;

    for (const panel of panelConfigs) {
      const r = COCKPIT_RADIUS - 0.04;
      const baseX = Math.sin(panel.angle) * r;
      const baseZ = -Math.cos(panel.angle) * r;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const perfY = panel.y + row * 0.012;
          // Offset every other row for honeycomb-like circular pattern
          const colOffset = row % 2 === 0 ? 0 : 0.005;
          const lateralAngle = panel.angle + (col - cols / 2) * 0.008 + colOffset;
          const px = Math.sin(lateralAngle) * r;
          const pz = -Math.cos(lateralAngle) * r;
          pos.set(px, perfY, pz);
          quat.setFromEuler(new Euler(Math.PI / 2, -panel.angle, 0));
          mat4.compose(pos, quat, scale);
          meshRef.current.setMatrixAt(idx, mat4);
          idx++;
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [panelConfigs, rows]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[perforationGeo, ventMaterial, totalPerforations]}
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
  chromeMaterial: MeshStandardMaterial;
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
    const geo = new TorusGeometry(
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
  chromeMaterial: MeshStandardMaterial;
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
// Design Decision 14.3: Accent lighting at key intersections only — emissive
// glow applied where structural elements meet (rib-to-panel joints,
// cable-to-rib junction points). Dormant emissive level (0.15) per ACCENT_LINES.

// Derive dormant emissive intensity from design tokens
const ACCENT_EMISSIVE_INTENSITY = EMISSIVE_SCALE[ACCENT_LINES.emissiveLevel as EmissiveLevel]; // 0.15

function LEDIndicatorStrips({
  count,
  labColor,
  opacity,
  ribAngles,
}: {
  count: number;
  labColor: string;
  opacity: number;
  ribAngles: number[];
}) {
  const meshRef = useRef<InstancedMesh>(null!);
  const emissiveColor = useMemo(() => new Color(labColor), [labColor]);
  const timeRef = useRef(0);

  // Pre-compute LED positions at structural intersection points only:
  // - Rib-to-panel joints (where ribs meet the cockpit shell)
  // - Cable-to-rib crossings (where cable channels cross rib positions)
  const ledPositions = useMemo(() => {
    const gen = seededRandom(777);
    const positions: { pos: Vector3; phaseOffset: number }[] = [];

    // Place LEDs at rib-to-panel intersections along each rib
    for (let ri = 0; ri < ribAngles.length; ri++) {
      const ribAngle = ribAngles[ri];
      const r = COCKPIT_RADIUS - 0.04;

      // LEDs at top and bottom rib-panel joints, plus mid-height cable crossings
      const junctionYs = [
        COCKPIT_Y_MIN + 0.1,  // bottom rib-panel joint
        COCKPIT_Y_MIN + COCKPIT_HEIGHT * 0.25, // lower cable-rib crossing
        COCKPIT_Y_MIN + COCKPIT_HEIGHT * 0.5,  // mid cable-rib crossing
        COCKPIT_Y_MIN + COCKPIT_HEIGHT * 0.75, // upper cable-rib crossing
        COCKPIT_Y_MAX - 0.1,  // top rib-panel joint
      ];

      for (let j = 0; j < junctionYs.length; j++) {
        if (positions.length >= count) break;
        const y = junctionYs[j] + (gen() - 0.5) * 0.04;
        positions.push({
          pos: new Vector3(
            Math.sin(ribAngle) * r,
            y,
            -Math.cos(ribAngle) * r
          ),
          phaseOffset: ri * 1.2 + j * 0.8,
        });
      }
    }

    // Fill remaining budget with cable-to-rib junction highlights
    while (positions.length < count) {
      const ri = Math.floor(gen() * ribAngles.length);
      const ribAngle = ribAngles[ri] + (gen() - 0.5) * 0.03;
      const r = COCKPIT_RADIUS - 0.06 - gen() * 0.08;
      const y = COCKPIT_Y_MIN + 0.2 + gen() * (COCKPIT_HEIGHT - 0.4);
      positions.push({
        pos: new Vector3(
          Math.sin(ribAngle) * r,
          y,
          -Math.cos(ribAngle) * r
        ),
        phaseOffset: positions.length * 0.5,
      });
    }

    return positions.slice(0, count);
  }, [count, ribAngles]);

  const ledGeo = useMemo(() => new BoxGeometry(0.012, 0.006, 0.006), []);

  // Dormant emissive level from ACCENT_LINES token (0.15)
  const ledMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: emissiveColor,
        emissive: emissiveColor,
        emissiveIntensity: ACCENT_EMISSIVE_INTENSITY,
        transparent: true,
        opacity,
        toneMapped: false,
      }),
    [emissiveColor, opacity]
  );

  // Initialize instance matrices
  useMemo(() => {
    if (!meshRef.current) return;
    const mat4 = new Matrix4();
    const quat = new Quaternion();
    const scale = new Vector3(1, 1, 1);

    for (let i = 0; i < ledPositions.length; i++) {
      const { pos } = ledPositions[i];
      const angle = Math.atan2(pos.x, -pos.z);
      quat.setFromEuler(new Euler(0, -angle, 0));
      mat4.compose(pos, quat, scale);
      meshRef.current.setMatrixAt(i, mat4);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [ledPositions]);

  // Animate: subtle phase-offset sine pulse at intersection points
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const mat4 = new Matrix4();
    const quat = new Quaternion();
    const _pos = new Vector3();
    const scale = new Vector3();

    for (let i = 0; i < ledPositions.length; i++) {
      const led = ledPositions[i];
      const pulse = 0.7 + 0.3 * Math.sin(t * 2.5 + led.phaseOffset);
      const angle = Math.atan2(led.pos.x, -led.pos.z);
      quat.setFromEuler(new Euler(0, -angle, 0));
      scale.set(pulse, pulse, pulse);
      mat4.compose(led.pos, quat, scale);
      meshRef.current.setMatrixAt(i, mat4);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Gentle pulse around the dormant emissive baseline
    const globalPulse = ACCENT_EMISSIVE_INTENSITY * (0.85 + 0.15 * Math.sin(t * 1.8));
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
      new MeshStandardMaterial({
        color: 0xff6644,
        emissive: new Color(0xff6644),
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        toneMapped: false,
      }),
    []
  );

  const borderMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0xffaa44,
        emissive: new Color(0xffaa44),
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
  const counts = useMemo(() => getScaledCounts('ultra'), ['ultra']);

  // Chrome material — uses CHROME_BORDER design token (#a8b5c8)
  const chromeMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CHROME_COLOR,
        metalness: 0.85,
        roughness: 0.35,
        transparent: true,
        opacity,
      }),
    [opacity]
  );

  // Carbon composite material — #0A0F1F dark surface for panels/covers
  const carbonMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CARBON_COMPOSITE,
        metalness: 0.3,
        roughness: 0.7,
        transparent: true,
        opacity,
      }),
    [opacity]
  );

  // Update opacity reactively for all shared materials
  useFrame(() => {
    if (chromeMaterial.opacity !== opacity) {
      chromeMaterial.opacity = opacity;
    }
    if (carbonMaterial.opacity !== opacity) {
      carbonMaterial.opacity = opacity;
    }
  });

  // Pre-compute rib angles for LED intersection placement (Decision 14.3)
  const ribAngles = useMemo(() => {
    const step = ARC_RAD / (counts.ribs + 1);
    return Array.from({ length: counts.ribs }, (_, i) => ARC_START + step * (i + 1));
  }, [counts.ribs]);

  return (
    <group name="cockpit-structural-detail">
      {/* Cable Bundles — hidden inside recessed channels with panel covers (Decision 14.1) */}
      <CableBundles
        count={counts.cables}
        tubularSegments={64}
        chromeMaterial={chromeMaterial}
        coverMaterial={carbonMaterial}
      />

      {/* Conduit Pipes — horizontal pipes with junction boxes */}
      <ConduitPipes
        count={counts.pipes}
        segments={64}
        chromeMaterial={chromeMaterial}
      />

      {/* Ventilation Panels — perforated circular hole pattern, aerospace aesthetic (Decision 14.2) */}
      <VentilationPanels
        slatsPerPanel={counts.ventSlatsPerPanel}
        ventMaterial={carbonMaterial}
      />

      {/* Structural Ribs — arc-shaped ribs evenly spaced */}
      <StructuralRibs
        count={counts.ribs}
        segments={64}
        chromeMaterial={chromeMaterial}
      />

      {/* Access Hatches — rectangular outlines */}
      <AccessHatches
        count={counts.hatches}
        chromeMaterial={chromeMaterial}
      />

      {/* LED Accent Strips — emissive at key intersections only (Decision 14.3) */}
      <LEDIndicatorStrips
        count={counts.leds}
        labColor={labColor}
        opacity={opacity}
        ribAngles={ribAngles}
      />

      {/* Warning Signage — emissive plane markers */}
      <WarningSigns count={counts.signs} />
    </group>
  );
}

export default CockpitStructuralDetail;
