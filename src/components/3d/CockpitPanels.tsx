'use client';

// ================================================================
// CPA v3.0 — CockpitPanels: 3D-Embedded UI Upgrade
// ================================================================
// v3: 218° arc (was 140°), r=4.8 (was 4.0), 4M tri budget (was 2M)
// Materials upgraded to cockpitMaterials.ts factory (alloy, panel, holographic)
// Decision CPA-2: 2 hex clusters x 6 hexes = 12 total
//
// v3 additions (from cockpit-architecture.json):
// - 288-segment curved hull for wider arc
// - Metallic alloy frame (#a8b5c8, metalness 0.98)
// - Curved control panel (#0a1625, emissive #00bbff @ 0.85)
// - Decision 11.1: Smooth carbon surface (2% fine grain, no plate segmentation)
// - Decision 11.2: No rivets — clean surface, seam lines only
// - Decision 11.3: Accent-traced panels (#0A0F1F with full-trace accent lines)
//
// All geometry dims/retracts in game mode (Decision 3.4).

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BackSide,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  RingGeometry,
  Shape,
  Side,
  Vector3,
} from 'three';
import { COCKPIT_GEOMETRY, COCKPIT_DETAIL } from '@/lib/3d/cockpitConfig';
import { dampedLerp, R3F_LERP_SPEED } from '@/lib/animations';
import {
  CHROME_BORDER,
  ACCENT_LINES,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_SCALE,
} from '@/lib/3d/cockpitDesignTokens';

// ■■ Props ■■

interface CockpitPanelsProps {
  curvature: number;       // 0.0 (flat/retracted) to 0.85 (full cockpit)
  opacity: number;         // 0.0-1.0, mode-driven
  labColor: string;        // Active lab accent for hex indicators
  frameDimmed: boolean;    // Game mode dim
}

// ■■ Constants ■■

const HEXES_PER_CLUSTER = 6;

const RIB_COUNT = 12;           // v3: more ribs across wider 218° arc (was 8)

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
  const preset = COCKPIT_DETAIL;

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

  // Decision 11.2: Rivets removed — clean surface

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
    ribGeo, subPanelGeo,
  };
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

// Phase 3 audit fix (Task 4A, §9.1/§10.7):
//
// OLD: 6 hexes × up to 5 meshes each = up to 30 meshes per cluster (60 total).
// NEW: Up to 5 InstancedMesh per cluster (10 total). Savings: up to 50 draw
// calls with zero visual change. Needle animation fully preserved via
// per-instance matrix updates (each needle keeps its unique speed/phase).
//
// Instanced groups:
//   1) Hex shells (6 instances, always rendered)
//   2) Hex insets (6 instances, only when showSubPanels)
//   3) Dial rings (6 instances, only when showDetail)
//   4) Needles   (6 instances, only when showDetail — ANIMATED per frame)
//   5) Indicator circles (6 instances, always rendered)

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
  const shellRef = useRef<InstancedMesh>(null);
  const insetRef = useRef<InstancedMesh>(null);
  const dialRef = useRef<InstancedMesh>(null);
  const needleRef = useRef<InstancedMesh>(null);
  const indicatorRef = useRef<InstancedMesh>(null);
  const mirror = side === 'left' ? -1 : 1;

  // Hex grid layout: 2 columns × 3 rows, offset like a honeycomb
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

  // Shared materials — one per sub-type (identical per hex within cluster)
  const shellMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#0A0F1F',
        metalness: 0.85,
        roughness: 0.35,
        transparent: true,
        opacity,
        side: DoubleSide,
      }),
    [opacity]
  );
  const insetMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#060A14',
        metalness: 0.75,
        roughness: 0.5,
        transparent: true,
        opacity: opacity * 0.95,
      }),
    [opacity]
  );
  const dialMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CHROME_BORDER.colorHex,
        metalness: 0.85,
        roughness: 0.35,
        transparent: true,
        opacity: opacity * 0.7,
      }),
    [opacity]
  );
  const needleMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#ff3333',
        emissive: '#ff2222',
        emissiveIntensity: 0.6,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity,
      }),
    [opacity]
  );
  const indicatorMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#000000',
        emissive: labColorObj,
        emissiveIntensity: EMISSIVE_IDLE_INDICATOR,
        transparent: true,
        opacity: opacity * 0.8,
        toneMapped: false,
      }),
    [labColorObj, opacity]
  );

  // Per-hex indicator circle geometry — shared by indicator InstancedMesh
  const indicatorGeo = useMemo(
    () => new CircleGeometry(hexRadius * 0.2, 6),
    [hexRadius]
  );

  // Write static instance matrices (shells / insets / dials / indicators).
  // Needle matrices are updated per-frame in useFrame below.
  useEffect(() => {
    const mat4 = new Matrix4();
    const quat = new Quaternion();
    const euler = new Euler();
    const scale = new Vector3(1, 1, 1);
    const pos = new Vector3();
    const identityQuat = new Quaternion();

    const writeMatrices = (
      ref: InstancedMesh | null,
      zOffset: number,
      rotation?: Euler
    ) => {
      if (!ref) return;
      const q = rotation ? quat.setFromEuler(rotation) : identityQuat;
      for (let i = 0; i < hexPositions.length; i++) {
        const [x, y] = hexPositions[i];
        pos.set(x, y, zOffset);
        mat4.compose(pos, q, scale);
        ref.setMatrixAt(i, mat4);
      }
      ref.instanceMatrix.needsUpdate = true;
    };

    writeMatrices(shellRef.current, 0);
    writeMatrices(insetRef.current, hexDepth * 0.3);
    writeMatrices(dialRef.current, hexDepth + 0.005);
    writeMatrices(indicatorRef.current, hexDepth + 0.015);
  }, [hexPositions, hexDepth]);

  // Animate needles per-instance — preserves the original per-hex
  // (speed = 0.4 + i * 0.15, phase = i * 1.2) sweep formula exactly.
  const needleFrameState = useMemo(
    () => ({
      mat4: new Matrix4(),
      quat: new Quaternion(),
      baseEuler: new Euler(Math.PI / 2, 0, 0),
      animatedEuler: new Euler(),
      scale: new Vector3(1, 1, 1),
      pos: new Vector3(),
    }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = needleRef.current;
    if (!mesh) return;
    const { mat4, quat, animatedEuler, scale, pos } = needleFrameState;
    const t = clock.elapsedTime;

    for (let i = 0; i < hexPositions.length; i++) {
      const [x, y] = hexPositions[i];
      const speed = 0.4 + i * 0.15;
      const phase = i * 1.2;
      const angle = Math.sin(t * speed + phase) * 1.2 - 0.6;
      // Compose local rotation: base [PI/2, 0, 0] × animated [0, 0, angle]
      // The original mesh had rotation=[PI/2, 0, 0] and the per-frame update
      // only touched .rotation.z. Replicate the same final orientation.
      animatedEuler.set(Math.PI / 2, 0, angle);
      quat.setFromEuler(animatedEuler);
      pos.set(x, y, hexDepth + 0.01);
      mat4.compose(pos, quat, scale);
      mesh.setMatrixAt(i, mat4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  const count = hexPositions.length;

  return (
    <group position={[mirror * 3.2, -2.5, -COCKPIT_GEOMETRY.panelRadius + 0.5]}>
      {/* 1) Hex outer shells (always) */}
      <instancedMesh
        ref={shellRef}
        args={[hexGeo, shellMat, count]}
        frustumCulled={false}
      />

      {/* 2) Hex inner insets (gauge face) — only at detail LOD */}
      {showSubPanels && (
        <instancedMesh
          ref={insetRef}
          args={[hexInsetGeo, insetMat, count]}
          frustumCulled={false}
        />
      )}

      {/* 3) Gauge dial rings */}
      {showDetail && (
        <instancedMesh
          ref={dialRef}
          args={[needleDialGeo, dialMat, count]}
          frustumCulled={false}
        />
      )}

      {/* 4) Gauge needles (per-instance animated rotation) */}
      {showDetail && (
        <instancedMesh
          ref={needleRef}
          args={[needleGeo, needleMat, count]}
          frustumCulled={false}
        />
      )}

      {/* 5) Hex emissive indicators */}
      <instancedMesh
        ref={indicatorRef}
        args={[indicatorGeo, indicatorMat, count]}
        frustumCulled={false}
      />
    </group>
  );
}

// ■■ Accent Lines Component ■■
// Phase 2 audit fix (Section 4.1): Accent line emissive overlay — Decision 11.3
// Traces 12 vertical seam lines along rib positions on the 218° arc at r=4.8.
// Uses LineSegments (lightweight — effectively ~0 triangles, well within 500K budget).

interface AccentLinesProps {
  arcRad: number;
  panelRadius: number;
  accentColor: string;
  opacity: number;
}

function AccentLines({ arcRad, panelRadius, accentColor, opacity }: AccentLinesProps) {
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    // Vertical seam lines at each rib theta — from console desk (y=-3.2) to top bar (y=3.5)
    const yTop = 3.5;
    const yBottom = -3.2;
    // Slight inset so the lines sit just outside the panel surface
    const r = panelRadius - 0.02;
    for (let i = 0; i < RIB_COUNT; i++) {
      const t = i / (RIB_COUNT - 1);
      const angle = -arcRad / 2 + t * arcRad;
      const x = Math.sin(angle) * r;
      const z = -Math.cos(angle) * r;
      // LineSegments needs pairs of points (start, end) per line
      positions.push(x, yBottom, z);
      positions.push(x, yTop, z);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geo;
  }, [arcRad, panelRadius]);

  useEffect(() => {
    return () => {
      lineGeometry.dispose();
    };
  }, [lineGeometry]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial
        color={accentColor}
        transparent
        opacity={opacity * 0.4}
        toneMapped={false}
        depthWrite={false}
      />
    </lineSegments>
  );
}

// ■■ Structural Ribs Component ■■

interface StructuralRibsProps {
  ribGeo: CylinderGeometry;
  opacity: number;
  arcRad: number;
  panelRadius: number;
}

function StructuralRibs({ ribGeo, opacity: _opacity, arcRad, panelRadius }: StructuralRibsProps) {
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
            color={CHROME_BORDER.colorHex}
            metalness={0.92}
            roughness={0.3}
            emissive={CHROME_BORDER.colorHex}
            // Phase 2 audit fix (Section 7.1): Design token adoption — 0.15 === EMISSIVE_SCALE.dormant
            emissiveIntensity={ACCENT_LINES.emissiveLevel === 'dormant' ? EMISSIVE_SCALE.dormant : 0}
            transparent
            opacity={ACCENT_LINES.opacity}
          />
        </mesh>
      ))}
    </group>
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
                  color="#0A0F1F"
                  metalness={0.85}
                  roughness={0.35}
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
                  emissiveIntensity={EMISSIVE_IDLE_INDICATOR}
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
  // COCK-12: Geometry creation in useMemo, disposal moved to useEffect cleanup
  const geometries = useMemo(() => buildGeometries(segments), [segments]);

  // COCK-12: Dispose geometries via useEffect cleanup (runs on segments change + unmount)
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((geo: unknown) => {
        if (geo && typeof (geo as BufferGeometry).dispose === 'function') {
          (geo as BufferGeometry).dispose();
        }
      });
    };
  }, [geometries]);

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
      // Phase 2 audit fix (Section 7.1): Design token adoption — base 0.4 === EMISSIVE_SCALE.dim
      const pulse = Math.sin(clock.elapsedTime * 1.5708) * 0.1 + EMISSIVE_SCALE.dim;
      hexEmissiveRef.current.emissiveIntensity = pulse + hoverProgressRef.current * 0.2;
    }
  });

  const labColorObj = useMemo(() => new Color(labColor), [labColor]);

  // Shared material props — Decision 11.1/11.3: carbon composite #0A0F1F
  const outerPanelMaterial = useMemo(
    () => ({
      color: '#0A0F1F',
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
      color: '#060A14',
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
          color="#0A0F1F"
          metalness={0.85}
          roughness={0.35}
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
          color="#060A14"
          metalness={0.75}
          roughness={0.5}
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

      {/* ─── Accent Line Overlay (Phase 2 audit fix Section 4.1 — Decision 11.3) ─── */}
      <AccentLines
        arcRad={arcRad}
        panelRadius={panelRadius}
        accentColor={labColor}
        opacity={opacity}
      />

      {/* ─── Decision 11.2: Rivets removed — clean surface, seam lines only ─── */}

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
