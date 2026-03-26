'use client';

// ================================================================
// CPA v2.0 — CockpitPanels: 20M Cockpit Upgrade
// ================================================================
// Decision CPA-1: CylinderGeometry segments, 140° arc, r=4.0
// Decision CPA-2: 2 hex clusters x 6 hexes = 12 total (expanded from 6)
// Decision CPA-11: ~2,000,000 tri budget (upgraded from ~1,200)
//
// 20M Cockpit Upgrade additions:
// - 256-segment curved hull (was 32) at ultra LOD
// - Multi-layer construction: outer hull + inner hull + frame ribs
// - Edge beveling on all panels via ExtrudeGeometry
// - Instanced rivets/bolts (~500+ InstancedMesh instances)
// - Animated sub-panels with slide/rotate transforms
// - 12 hex clusters with internal gauge needle geometry

//
// Uses PanelFace, WornChrome, ConsoleBase materials.
// All geometry dims/retracts in game mode (Decision 3.4).

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BackSide,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  RingGeometry,
  Shape,
  Side,
  SphereGeometry,
  Vector3,
} from 'three';
import { COCKPIT_GEOMETRY, COCKPIT_LOD } from '@/lib/3d/cockpitConfig';
import { dampedLerp, R3F_LERP_SPEED } from '@/lib/animations';

// ■■ Props ■■

interface CockpitPanelsProps {
  curvature: number;       // 0.0 (flat/retracted) to 0.85 (full cockpit)
  opacity: number;         // 0.0-1.0, mode-driven
  labColor: string;        // Active lab accent for hex indicators
  frameDimmed: boolean;    // Game mode dim
}

// ■■ Constants ■■

const HEXES_PER_CLUSTER = 6;

const RIB_COUNT = 8;
const RIVET_COUNT = 512;

const BEVEL_SETTINGS = {
  bevelEnabled: true,
  bevelThickness: COCKPIT_GEOMETRY.panelEdgeBevel,
  bevelSize: COCKPIT_GEOMETRY.panelEdgeBevel,
  bevelSegments: 2,
} as const;

// ■■ LOD Segment Resolver ■■

interface ResolvedSegments {
  mainSegments: number;
  sideSegments: number;
  hexDetail: boolean;
  hexSubPanels: boolean;
  structuralDetail: boolean;
  reflections: boolean;
}

function resolveSegments(
): ResolvedSegments {
  const preset = COCKPIT_LOD['ultra'];

  return {
    mainSegments: preset.panelSegments,
    sideSegments: preset.sideSegments,
    hexDetail: preset.hexDetail,
    hexSubPanels: preset.hexSubPanels,
    structuralDetail: preset.structuralDetail,
    reflections: preset.reflections,
  };
}

// ■■ Hex Shape Generator ■■

function createHexShape(radius: number): Shape {
  const shape = new Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top hex
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

// ■■ Bevel Profile for Panel Edges ■■

function createBeveledPanelShape(width: number, height: number, bevel: number): Shape {
  const hw = width / 2;
  const hh = height / 2;
  const b = bevel;
  const shape = new Shape();

  shape.moveTo(-hw + b, -hh);
  shape.lineTo(hw - b, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + b);
  shape.lineTo(hw, hh - b);
  shape.quadraticCurveTo(hw, hh, hw - b, hh);
  shape.lineTo(-hw + b, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - b);
  shape.lineTo(-hw, -hh + b);
  shape.quadraticCurveTo(-hw, -hh, -hw + b, -hh);

  return shape;
}

// ■■ Geometry Factory ■■
// Pre-computes all panel geometries based on LOD level

interface PanelGeometries {
  outerTopGeo: CylinderGeometry;
  innerTopGeo: CylinderGeometry;
  outerConsoleGeo: CylinderGeometry;
  innerConsoleGeo: CylinderGeometry;
  leftGeo: CylinderGeometry;
  rightGeo: CylinderGeometry;
  innerLeftGeo: CylinderGeometry;
  innerRightGeo: CylinderGeometry;
  hexGeo: ExtrudeGeometry;
  hexInsetGeo: ExtrudeGeometry;
  needleGeo: CylinderGeometry;
  needleDialGeo: RingGeometry;
  ribGeo: CylinderGeometry;
  rivetGeo: SphereGeometry;
  subPanelGeo: ExtrudeGeometry;
}

function buildGeometries(segments: ResolvedSegments): PanelGeometries {
  const {
    totalWrapArc,
    panelRadius,
    centralViewportWidth,
    topBarHeight,
    consoleDeskHeight,
    hexRadius,
    hexDepth,
    panelEdgeBevel,
  } = COCKPIT_GEOMETRY;

  const arcRad = (totalWrapArc * Math.PI) / 180;
  const sideArcStart = (centralViewportWidth / 2) * arcRad;
  const sideArcEnd = arcRad / 2;
  const sideArc = sideArcEnd - sideArcStart;

  const innerRadiusOffset = 0.08;
  const innerRadius = panelRadius - innerRadiusOffset;
  const mainSegs = segments.mainSegments;
  const sideSegs = segments.sideSegments;

  // Outer hull — top bar
  const outerTopGeo = new CylinderGeometry(
    panelRadius, panelRadius,
    topBarHeight * 8,
    mainSegs, 2, true,
    -arcRad / 2, arcRad
  );

  // Inner hull — top bar (slightly smaller, darker)
  const innerTopGeo = new CylinderGeometry(
    innerRadius, innerRadius,
    topBarHeight * 8 - 0.04,
    Math.max(mainSegs / 2, 16), 1, true,
    -arcRad / 2, arcRad
  );

  // Outer hull — console desk
  const outerConsoleGeo = new CylinderGeometry(
    panelRadius * 0.95, panelRadius * 0.95,
    consoleDeskHeight * 8,
    mainSegs, 2, true,
    -arcRad / 2, arcRad
  );

  // Inner hull — console desk
  const innerConsoleGeo = new CylinderGeometry(
    (panelRadius - innerRadiusOffset) * 0.95,
    (panelRadius - innerRadiusOffset) * 0.95,
    consoleDeskHeight * 8 - 0.04,
    Math.max(mainSegs / 2, 16), 1, true,
    -arcRad / 2, arcRad
  );

  // Side panels — outer
  const leftGeo = new CylinderGeometry(
    panelRadius, panelRadius,
    3.5, sideSegs, 2, true,
    -arcRad / 2, sideArc
  );
  const rightGeo = new CylinderGeometry(
    panelRadius, panelRadius,
    3.5, sideSegs, 2, true,
    sideArcStart, sideArc
  );

  // Side panels — inner
  const innerLeftGeo = new CylinderGeometry(
    innerRadius, innerRadius,
    3.4, Math.max(sideSegs / 2, 8), 1, true,
    -arcRad / 2, sideArc
  );
  const innerRightGeo = new CylinderGeometry(
    innerRadius, innerRadius,
    3.4, Math.max(sideSegs / 2, 8), 1, true,
    sideArcStart, sideArc
  );

  // Hex outer shell with bevel
  const hexShape = createHexShape(hexRadius);
  const hexGeo = new ExtrudeGeometry(hexShape, {
    depth: hexDepth,
    ...BEVEL_SETTINGS,
  });

  // Hex inner inset (gauge face)
  const hexInsetShape = createHexShape(hexRadius * 0.75);
  const hexInsetGeo = new ExtrudeGeometry(hexInsetShape, {
    depth: hexDepth * 0.5,
    bevelEnabled: false,
  });

  // Gauge needle (thin tapered cylinder)
  const needleGeo = new CylinderGeometry(
    0.003, 0.012, hexRadius * 0.6, 6
  );

  // Gauge dial ring
  const needleDialGeo = new RingGeometry(
    hexRadius * 0.55, hexRadius * 0.62,
    segments.hexDetail ? 24 : 12
  );

  // Structural ribs (spars between top bar and console desk)
  const ribGeo = new CylinderGeometry(
    0.02, 0.025, 6.2,
    segments.structuralDetail ? 12 : 6
  );

  // Rivet geometry (shared by instanced mesh)
  const rivetGeo = new SphereGeometry(
    0.015, 6, 4
  );

  // Animated sub-panel (beveled rectangle)
  const subPanelShape = createBeveledPanelShape(0.5, 0.3, panelEdgeBevel * 3);
  const subPanelGeo = new ExtrudeGeometry(subPanelShape, {
    depth: 0.015,
    ...BEVEL_SETTINGS,
  });

  return {
    outerTopGeo, innerTopGeo,
    outerConsoleGeo, innerConsoleGeo,
    leftGeo, rightGeo,
    innerLeftGeo, innerRightGeo,
    hexGeo, hexInsetGeo,
    needleGeo, needleDialGeo,
    ribGeo, rivetGeo, subPanelGeo,
  };
}

// ■■ Rivet Instance Matrix Builder ■■

function buildRivetMatrices(
  count: number,
  panelRadius: number,
  arcRad: number
): Float32Array {
  const matrix = new Matrix4();
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  const arr = new Float32Array(count * 16);

  for (let i = 0; i < count; i++) {
    // Distribute rivets along the curved hull edges
    const t = i / count;
    const row = Math.floor(t * 8); // 8 rows of rivets
    const col = i % Math.ceil(count / 8);
    const colCount = Math.ceil(count / 8);
    const colT = col / colCount;

    const angle = -arcRad / 2 + colT * arcRad;
    const yOffset = (row - 3.5) * 0.85; // spread across height

    position.set(
      Math.sin(angle) * (panelRadius + 0.005),
      yOffset,
      -Math.cos(angle) * (panelRadius + 0.005)
    );

    // Orient rivet outward (normal to hull)
    quaternion.setFromAxisAngle(
      new Vector3(0, 1, 0),
      angle
    );

    // Slight size variation
    const s = 0.8 + Math.random() * 0.4;
    scale.set(s, s, s);

    matrix.compose(position, quaternion, scale);
    matrix.toArray(arr, i * 16);
  }

  return arr;
}

// ■■ Hex Cluster Component ■■

interface HexClusterProps {
  side: 'left' | 'right';
  hexGeo: ExtrudeGeometry;
  hexInsetGeo: ExtrudeGeometry;
  needleGeo: CylinderGeometry;
  needleDialGeo: RingGeometry;
  labColorObj: Color;
  opacity: number;
  hexRadius: number;
  hexDepth: number;
  showSubPanels: boolean;
  showDetail: boolean;
}

function HexCluster({
  side,
  hexGeo,
  hexInsetGeo,
  needleGeo,
  needleDialGeo,
  labColorObj,
  opacity,
  hexRadius,
  hexDepth,
  showSubPanels,
  showDetail,
}: HexClusterProps) {
  const needleRefs = useRef<(Mesh | null)[]>([]);
  const mirror = side === 'left' ? -1 : 1;

  // Animate gauge needles
  useFrame(({ clock }) => {
    for (let i = 0; i < HEXES_PER_CLUSTER; i++) {
      const needle = needleRefs.current[i];
      if (!needle) continue;
      // Each needle sweeps at a unique rate + phase offset
      const speed = 0.4 + i * 0.15;
      const phase = i * 1.2;
      const angle = Math.sin(clock.elapsedTime * speed + phase) * 1.2 - 0.6;
      needle.rotation.z = angle;
    }
  });

  // Hex grid layout: 2 columns x 3 rows, offset like a honeycomb
  const hexPositions = useMemo(() => {
    const positions: [number, number][] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const xOffset = col * hexRadius * 1.6 + (row % 2) * hexRadius * 0.8;
        const yOffset = row * hexRadius * 1.45 - hexRadius * 1.45;
        positions.push([xOffset * mirror, yOffset]);
      }
    }
    return positions;
  }, [hexRadius, mirror]);

  return (
    <group position={[mirror * 3.2, -2.5, -COCKPIT_GEOMETRY.panelRadius + 0.5]}>
      {hexPositions.map(([x, y], i) => (
        <group key={`hex-${side}-${i}`} position={[x, y, 0]}>
          {/* Hex outer shell (beveled) */}
          <mesh geometry={hexGeo}>
            <meshStandardMaterial
              color="#8a9098"
              metalness={0.95}
              roughness={0.35}
              transparent
              opacity={opacity}
              side={DoubleSide}
            />
          </mesh>

          {/* Hex inner inset (gauge face) — only at detail LOD */}
          {showSubPanels && (
            <mesh
              geometry={hexInsetGeo}
              position={[0, 0, hexDepth * 0.3]}
            >
              <meshStandardMaterial
                color="#050810"
                metalness={0.6}
                roughness={0.8}
                transparent
                opacity={opacity * 0.95}
              />
            </mesh>
          )}

          {/* Gauge dial ring */}
          {showDetail && (
            <mesh
              geometry={needleDialGeo}
              position={[0, 0, hexDepth + 0.005]}
            >
              <meshStandardMaterial
                color="#3a4050"
                metalness={0.8}
                roughness={0.4}
                transparent
                opacity={opacity * 0.7}
              />
            </mesh>
          )}

          {/* Gauge needle */}
          {showDetail && (
            <mesh
              ref={(el) => { needleRefs.current[i] = el; }}
              geometry={needleGeo}
              position={[0, 0, hexDepth + 0.01]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshStandardMaterial
                color="#ff3333"
                emissive="#ff2222"
                emissiveIntensity={0.6}
                metalness={0.9}
                roughness={0.2}
                transparent
                opacity={opacity}
              />
            </mesh>
          )}

          {/* Hex emissive indicator (per hex) */}
          <mesh position={[0, 0, hexDepth + 0.015]}>
            <circleGeometry args={[hexRadius * 0.2, 6]} />
            <meshStandardMaterial
              color="#000000"
              emissive={labColorObj}
              emissiveIntensity={0.4}
              transparent
              opacity={opacity * 0.8}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ■■ Structural Ribs Component ■■

interface StructuralRibsProps {
  ribGeo: CylinderGeometry;
  opacity: number;
  arcRad: number;
  panelRadius: number;
}

function StructuralRibs({ ribGeo, opacity, arcRad, panelRadius }: StructuralRibsProps) {
  const ribData = useMemo(() => {
    const ribs: { angle: number; x: number; z: number }[] = [];
    for (let i = 0; i < RIB_COUNT; i++) {
      const t = i / (RIB_COUNT - 1);
      const angle = -arcRad / 2 + t * arcRad;
      ribs.push({
        angle,
        x: Math.sin(angle) * (panelRadius - 0.04),
        z: -Math.cos(angle) * (panelRadius - 0.04),
      });
    }
    return ribs;
  }, [arcRad, panelRadius]);

  return (
    <group>
      {ribData.map((rib, i) => (
        <mesh
          key={`rib-${i}`}
          geometry={ribGeo}
          position={[rib.x, 0.1, rib.z]}
          rotation={[0, rib.angle, 0]}
        >
          <meshStandardMaterial
            color="#2a2e3e"
            metalness={0.92}
            roughness={0.3}
            transparent
            opacity={opacity * 0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Instanced Rivets Component ■■

interface InstancedRivetsProps {
  rivetGeo: SphereGeometry;
  opacity: number;
  panelRadius: number;
  arcRad: number;
}

function InstancedRivets({ rivetGeo, opacity, panelRadius, arcRad }: InstancedRivetsProps) {
  const meshRef = useRef<InstancedMesh>(null);

  const matrices = useMemo(
    () => buildRivetMatrices(RIVET_COUNT, panelRadius, arcRad),
    [panelRadius, arcRad]
  );

  // Apply instance matrices on mount
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const mat4 = new Matrix4();
    for (let i = 0; i < RIVET_COUNT; i++) {
      mat4.fromArray(matrices, i * 16);
      mesh.setMatrixAt(i, mat4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[rivetGeo, undefined, RIVET_COUNT]}
      frustumCulled
    >
      <meshStandardMaterial
        color="#6a7080"
        metalness={0.98}
        roughness={0.25}
        transparent
        opacity={opacity * 0.85}
      />
    </instancedMesh>
  );
}

// ■■ Animated Sub-Panels Component ■■

interface AnimatedSubPanelsProps {
  subPanelGeo: ExtrudeGeometry;
  opacity: number;
  labColorObj: Color;
  panelRadius: number;
  arcRad: number;
}

const SUB_PANEL_COUNT = 6;

function AnimatedSubPanels({
  subPanelGeo,
  opacity,
  labColorObj,
  panelRadius,
  arcRad,
}: AnimatedSubPanelsProps) {
  const panelRefs = useRef<(Group | null)[]>([]);

  const panelData = useMemo(() => {
    const panels: { angle: number; y: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < SUB_PANEL_COUNT; i++) {
      const t = (i + 0.5) / SUB_PANEL_COUNT;
      panels.push({
        angle: -arcRad / 2 + t * arcRad,
        y: 2.8 + (i % 2) * 0.4,
        speed: 0.3 + i * 0.08,
        phase: i * 1.5,
      });
    }
    return panels;
  }, [arcRad]);

  // Animate: slide out and rotate slightly
  useFrame(({ clock }) => {
    for (let i = 0; i < SUB_PANEL_COUNT; i++) {
      const panel = panelRefs.current[i];
      if (!panel) continue;
      const { speed, phase } = panelData[i];
      const t = Math.sin(clock.elapsedTime * speed + phase) * 0.5 + 0.5;

      // Slide outward
      panel.position.z = t * 0.08;
      // Slight rotation
      panel.rotation.y = t * 0.05;
    }
  });

  return (
    <group>
      {panelData.map((pd, i) => {
        const x = Math.sin(pd.angle) * (panelRadius + 0.02);
        const z = -Math.cos(pd.angle) * (panelRadius + 0.02);

        return (
          <group
            key={`sub-panel-${i}`}
            position={[x, pd.y, z]}
            rotation={[0, pd.angle, 0]}
          >
            <group ref={(el) => { panelRefs.current[i] = el; }}>
              <mesh geometry={subPanelGeo}>
                <meshStandardMaterial
                  color="#1e2230"
                  metalness={0.88}
                  roughness={0.3}
                  transparent
                  opacity={opacity * 0.9}
                />
              </mesh>
              {/* LED indicator on each sub-panel */}
              <mesh position={[0, 0.1, 0.016]}>
                <circleGeometry args={[0.03, 8]} />
                <meshStandardMaterial
                  color="#000000"
                  emissive={labColorObj}
                  emissiveIntensity={0.5}
                  transparent
                  opacity={opacity * 0.7}
                  toneMapped={false}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

// ================================================================
// ■■ Main CockpitPanels Component ■■
// ================================================================

export function CockpitPanels({
  curvature,
  opacity,
  labColor,
  frameDimmed,
}: CockpitPanelsProps) {
  const groupRef = useRef<Group>(null);
  const panelMatRef = useRef<MeshStandardMaterial>(null);
  const hexEmissiveRef = useRef<MeshStandardMaterial>(null);
  const targetCurvature = useRef(curvature);
  const currentCurvature = useRef(curvature);

  // ─── Hover feedback state (Audit Section 2, Finding C) ───
  const hoverProgressRef = useRef(0);
  const isHoveredRef = useRef(false);
  const handlePanelPointerEnter = useCallback(() => {
    isHoveredRef.current = true;
    document.body.style.cursor = 'pointer';
  }, []);
  const handlePanelPointerLeave = useCallback(() => {
    isHoveredRef.current = false;
    document.body.style.cursor = 'default';
  }, []);

  targetCurvature.current = curvature;

  // LOD from device store
  const segments = useMemo(() => resolveSegments(), []);

  const {
    totalWrapArc,
    panelRadius,
    hexRadius,
    hexDepth,
  } = COCKPIT_GEOMETRY;

  const arcRad = useMemo(() => (totalWrapArc * Math.PI) / 180, [totalWrapArc]);

  // Build all geometries based on current LOD
  // Audit Finding #7: Track previous geometries in ref for immediate disposal
  // when segments change, preventing VRAM accumulation between memoization
  // swap and async useEffect cleanup
  const prevGeometriesRef = useRef<ReturnType<typeof buildGeometries> | null>(null);
  const geometries = useMemo(() => {
    // Dispose previous geometries immediately on dependency change
    if (prevGeometriesRef.current) {
      Object.values(prevGeometriesRef.current).forEach((geo: unknown) => {
        if (geo && typeof (geo as BufferGeometry).dispose === 'function') {
          (geo as BufferGeometry).dispose();
        }
      });
    }
    const newGeos = buildGeometries(segments);
    prevGeometriesRef.current = newGeos;
    return newGeos;
  }, [segments]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevGeometriesRef.current) {
        Object.values(prevGeometriesRef.current).forEach((geo: unknown) => {
          if (geo && typeof (geo as BufferGeometry).dispose === 'function') {
            (geo as BufferGeometry).dispose();
          }
        });
        prevGeometriesRef.current = null;
      }
    };
  }, []);

  // Animate curvature transitions + material updates
  useFrame(({ clock }, delta) => {
    // Smooth curvature transition (dampedLerp for frame-rate independence)
    currentCurvature.current = dampedLerp(
      currentCurvature.current,
      targetCurvature.current,
      R3F_LERP_SPEED.SLOW,
      delta
    );

    // Scale group based on curvature (0 = hidden, 0.85 = full)
    if (groupRef.current) {
      const scale = currentCurvature.current / COCKPIT_GEOMETRY.panelCurvature;
      // Breathing: subtle 0.5% scale oscillation on 4s cycle (Finding D)
      const breathe = !frameDimmed
        ? Math.sin(clock.elapsedTime * 1.5708) * 0.005
        : 0;
      groupRef.current.scale.setScalar(Math.max(scale + breathe, 0.01));
    }

    // Smooth opacity transition (dampedLerp replaces hard assignment)
    if (panelMatRef.current) {
      panelMatRef.current.opacity = dampedLerp(
        panelMatRef.current.opacity,
        opacity,
        R3F_LERP_SPEED.NORMAL,
        delta
      );
    }

    // Hover glow: smooth 0→1 progress for emissive boost on panel hover
    const hoverTarget = isHoveredRef.current ? 1 : 0;
    hoverProgressRef.current = dampedLerp(
      hoverProgressRef.current,
      hoverTarget,
      R3F_LERP_SPEED.NORMAL,
      delta
    );

    // Hex emissive pulse (4s period, dashboard mode only) + hover boost
    if (hexEmissiveRef.current && !frameDimmed) {
      const pulse = Math.sin(clock.elapsedTime * 1.5708) * 0.1 + 0.4;
      hexEmissiveRef.current.emissiveIntensity = pulse + hoverProgressRef.current * 0.2;
    }
  });

  const labColorObj = useMemo(() => new Color(labColor), [labColor]);

  // Shared material props
  const outerPanelMaterial = useMemo(
    () => ({
      color: '#1a1e2e',
      metalness: 0.85,
      roughness: 0.35,
      transparent: true as const,
      opacity,
      side: DoubleSide as Side,
      depthWrite: false,
    }),
    [opacity]
  );

  const innerPanelMaterial = useMemo(
    () => ({
      color: '#0e1118',
      metalness: 0.75,
      roughness: 0.5,
      transparent: true as const,
      opacity: opacity * 0.85,
      side: BackSide as Side,
      depthWrite: false,
    }),
    [opacity]
  );

  return (
    <group ref={groupRef}>
      {/* ─── Outer Hull: Top Instrument Bar ─── */}
      <mesh
        geometry={geometries.outerTopGeo}
        position={[0, 3.5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerEnter={handlePanelPointerEnter}
        onPointerLeave={handlePanelPointerLeave}
      >
        <meshStandardMaterial
          ref={panelMatRef}
          {...outerPanelMaterial}
        />
      </mesh>

      {/* ─── Inner Hull: Top Instrument Bar ─── */}
      <mesh
        geometry={geometries.innerTopGeo}
        position={[0, 3.5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial {...innerPanelMaterial} />
      </mesh>

      {/* ─── Outer Hull: Left Side Panel ─── */}
      <mesh
        geometry={geometries.leftGeo}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerEnter={handlePanelPointerEnter}
        onPointerLeave={handlePanelPointerLeave}
      >
        <meshStandardMaterial {...outerPanelMaterial} />
      </mesh>

      {/* ─── Inner Hull: Left Side Panel ─── */}
      <mesh
        geometry={geometries.innerLeftGeo}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial {...innerPanelMaterial} />
      </mesh>

      {/* ─── Outer Hull: Right Side Panel ─── */}
      <mesh
        geometry={geometries.rightGeo}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerEnter={handlePanelPointerEnter}
        onPointerLeave={handlePanelPointerLeave}
      >
        <meshStandardMaterial {...outerPanelMaterial} />
      </mesh>

      {/* ─── Inner Hull: Right Side Panel ─── */}
      <mesh
        geometry={geometries.innerRightGeo}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial {...innerPanelMaterial} />
      </mesh>

      {/* ─── Outer Hull: Console Desk (Bottom) ─── */}
      <mesh
        geometry={geometries.outerConsoleGeo}
        position={[0, -3.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#0e1118"
          metalness={0.7}
          roughness={0.6}
          transparent
          opacity={opacity}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ─── Inner Hull: Console Desk ─── */}
      <mesh
        geometry={geometries.innerConsoleGeo}
        position={[0, -3.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#060810"
          metalness={0.65}
          roughness={0.7}
          transparent
          opacity={opacity * 0.8}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* ─── Structural Ribs (between top bar and console desk) ─── */}
      {segments.structuralDetail && (
        <StructuralRibs
          ribGeo={geometries.ribGeo}
          opacity={opacity}
          arcRad={arcRad}
          panelRadius={panelRadius}
        />
      )}

      {/* ─── Instanced Rivets / Bolts ─── */}
      {segments.structuralDetail && (
        <InstancedRivets
          rivetGeo={geometries.rivetGeo}
          opacity={opacity}
          panelRadius={panelRadius}
          arcRad={arcRad}
        />
      )}

      {/* ─── Animated Sub-Panels (slide/rotate on top bar) ─── */}
      {segments.structuralDetail && (
        <AnimatedSubPanels
          subPanelGeo={geometries.subPanelGeo}
          opacity={opacity}
          labColorObj={labColorObj}
          panelRadius={panelRadius}
          arcRad={arcRad}
        />
      )}

      {/* ─── Left Hex Cluster (6 hexes with gauge needles) ─── */}
      <HexCluster
        side="left"
        hexGeo={geometries.hexGeo}
        hexInsetGeo={geometries.hexInsetGeo}
        needleGeo={geometries.needleGeo}
        needleDialGeo={geometries.needleDialGeo}
        labColorObj={labColorObj}
        opacity={opacity}
        hexRadius={hexRadius}
        hexDepth={hexDepth}
        showSubPanels={segments.hexSubPanels}
        showDetail={segments.hexDetail}
      />

      {/* ─── Right Hex Cluster (6 hexes with gauge needles) ─── */}
      <HexCluster
        side="right"
        hexGeo={geometries.hexGeo}
        hexInsetGeo={geometries.hexInsetGeo}
        needleGeo={geometries.needleGeo}
        needleDialGeo={geometries.needleDialGeo}
        labColorObj={labColorObj}
        opacity={opacity}
        hexRadius={hexRadius}
        hexDepth={hexDepth}
        showSubPanels={segments.hexSubPanels}
        showDetail={segments.hexDetail}
      />
    </group>
  );
}
