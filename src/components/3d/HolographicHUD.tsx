'use client';

// ================================================================
// CPA v2.0 — HolographicHUD: Peripheral Viewport Frame
// ================================================================
// REPOSITIONED: Moved from centered concentric ring system [0,0,0.5]
// to peripheral viewport frame wrapping around content edges.
//
// Design Decisions:
//   6.0 Position:    Peripheral frame — instrument bezel around viewport
//   6.1 Ring Style:  Segmented arc frame — 4 arcs (top/bottom/left/right)
//   6.2 Data Display: Corner data readouts (time, XP, mode, child)
//   6.3 Motion:      Breathing pulse — 4-second sine cycle
//   6.4 Celebration: Gold cascade — chasing light around perimeter
//   6.5 Visibility:  20-30% opacity — clearly visible architectural element
//
// Triangle budget: ~500,000 tris (4 arcs + tick marks + text)

import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  RingGeometry,
  Vector3,
} from 'three';
import { Text } from '@react-three/drei';
import {
  CHROME_BORDER,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_LED_MULTIPLIER,
  TYPE_SCALE,
  NUMERIC_FONT,
  TEXT_COLORS,
  CELEBRATION_TIERS,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// FRAME ARC DEFINITIONS — positioned around viewport edges
// ═══════════════════════════════════════════════════════════════

interface FrameArcDef {
  id: string;
  startAngle: number;
  endAngle: number;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  tickCount: number;
}

const FRAME_ARCS: FrameArcDef[] = [
  {
    id: 'top',
    startAngle: -0.8,
    endAngle: 0.8,
    position: [0, 1.6, -2.5] as const,
    rotation: [0, 0, 0] as const,
    tickCount: 32,
  },
  {
    id: 'bottom',
    startAngle: -0.8,
    endAngle: 0.8,
    position: [0, -1.2, -2.5] as const,
    rotation: [0, 0, Math.PI] as const,
    tickCount: 32,
  },
  {
    id: 'left',
    startAngle: -0.6,
    endAngle: 0.6,
    position: [-2.0, 0.2, -2.5] as const,
    rotation: [0, 0, Math.PI / 2] as const,
    tickCount: 24,
  },
  {
    id: 'right',
    startAngle: -0.6,
    endAngle: 0.6,
    position: [2.0, 0.2, -2.5] as const,
    rotation: [0, 0, -Math.PI / 2] as const,
    tickCount: 24,
  },
];

// Arc ordering for celebration cascade: top → right → bottom → left
const CASCADE_ORDER = ['top', 'right', 'bottom', 'left'] as const;

// Breathing pulse period in seconds
const BREATHING_PERIOD_S = 4.0;

// Celebration revolutions per tier
const CELEBRATION_REVOLUTIONS: Record<string, number> = {
  minor: 1,
  major: 2,
  epic: 3,
};

// Gold color for celebration cascade
const GOLD_COLOR = new Color('#FFD700');

// ═══════════════════════════════════════════════════════════════
// CORNER READOUT POSITIONS
// ═══════════════════════════════════════════════════════════════

// Base corner layout — scaled by viewport aspect ratio at render time (COCK-02)
const BASE_CORNER_X = 1.8;
const CORNER_Y_TOP = 1.5;
const CORNER_Y_BOTTOM = -1.1;
const CORNER_Z = -2.45;
const BASE_ASPECT = 16 / 9; // 1.778 — design reference aspect ratio

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

interface HolographicHUDProps {
  // Phase 2 audit fix (Section 4.2): HUD visibility — Decision 6.5
  // Baseline opacity bumped from 0.25 to 0.35 for readability
  opacity: number;              // 0.0-1.0, driven by station mode (default 0.35)
  color: string;                // Lab accent color
  active: boolean;              // false = return null (game mode)
  modeName?: string;            // Current mode name for bottom-left readout
  childName?: string;           // Child name for bottom-right readout
  childLevel?: number;          // Child level for bottom-right readout
  xp?: number;                  // XP value for top-right readout
  celebrationActive?: boolean;  // Triggers gold cascade
  celebrationTier?: 'minor' | 'major' | 'epic'; // Controls cascade revolutions
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/** Format time as HH:MM */
function getCurrentTime(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Build tick mark matrices for a single arc segment */
function buildTickMatrices(arc: FrameArcDef): Matrix4[] {
  const matrices: Matrix4[] = [];
  const tempMatrix = new Matrix4();
  const tempPos = new Vector3();
  const tempQuat = new Quaternion();
  const tempScale = new Vector3(1, 1, 1);
  const arcRadius = 1.8; // radius for tick placement along arc
  const angleSpan = arc.endAngle - arc.startAngle;

  for (let t = 0; t < arc.tickCount; t++) {
    const frac = t / (arc.tickCount - 1);
    const angle = arc.startAngle + frac * angleSpan;
    const isMajor = t % 4 === 0;

    tempPos.set(
      Math.cos(angle) * arcRadius,
      Math.sin(angle) * arcRadius,
      0.01,
    );

    tempQuat.setFromAxisAngle(new Vector3(0, 0, 1), angle - Math.PI / 2);
    tempScale.set(
      isMajor ? 1.0 : 0.6,
      isMajor ? 1.8 : 1.0,
      1.0,
    );

    tempMatrix.compose(tempPos, tempQuat, tempScale);
    matrices.push(tempMatrix.clone());
  }
  return matrices;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function HolographicHUD({
  opacity,
  color,
  active,
  modeName = 'DASHBOARD',
  childName,
  childLevel,
  xp = 0,
  celebrationActive = false,
  celebrationTier = 'minor',
}: HolographicHUDProps) {

  // Refs for arc segment meshes (for per-frame material updates)
  const arcMeshRefs = useRef<(Mesh | null)[]>([]);
  const tickInstanceRefs = useRef<(InstancedMesh | null)[]>([]);
  const celebrationStartRef = useRef<number | null>(null);

  // Time display — update every frame would be wasteful, update every ~second
  const [displayTime, setDisplayTime] = useState(getCurrentTime);
  const lastTimeUpdateRef = useRef(0);

  // COCK-02: Viewport-responsive corner positions — scale X by aspect ratio
  const { viewport } = useThree();
  const cornerPositions = useMemo(() => {
    const aspectScale = Math.min(1, viewport.aspect / BASE_ASPECT);
    const x = BASE_CORNER_X * aspectScale;
    return {
      topLeft: [-x, CORNER_Y_TOP, CORNER_Z] as [number, number, number],
      topRight: [x, CORNER_Y_TOP, CORNER_Z] as [number, number, number],
      bottomLeft: [-x, CORNER_Y_BOTTOM, CORNER_Z] as [number, number, number],
      bottomRight: [x, CORNER_Y_BOTTOM, CORNER_Z] as [number, number, number],
    };
  }, [viewport.aspect]);

  const hudColor = useMemo(() => new Color(color), [color]);
  const _chromeColor = useMemo(() => new Color(CHROME_BORDER.color), []);

  // Arc ring geometries — thin ring arcs
  const arcGeometries = useMemo(() => {
    return FRAME_ARCS.map((arc) => {
      const innerR = 1.7;
      const outerR = 1.8;
      const thetaSegments = 64;
      const phiSegments = 1;
      const thetaStart = arc.startAngle + Math.PI / 2; // offset to align with arc orientation
      const thetaLength = arc.endAngle - arc.startAngle;
      return new RingGeometry(innerR, outerR, thetaSegments, phiSegments, thetaStart, thetaLength);
    });
  }, []);

  // Tick mark geometry (small box)
  // Phase 2 audit fix (Section 4.2): HUD visibility — Decision 6.5
  // Scaled up from (0.015, 0.06) → (0.025, 0.08) for readability
  const tickGeo = useMemo(() => new BoxGeometry(0.025, 0.08, 0.005), []);

  // Per-arc tick matrices
  const allTickMatrices = useMemo(() => {
    return FRAME_ARCS.map((arc) => buildTickMatrices(arc));
  }, []);

  // Total tick counts per arc
  const tickCounts = useMemo(() => allTickMatrices.map((m) => m.length), [allTickMatrices]);

  // Instanced mesh ref callback factories
  const tickRefCallbacks = useMemo(() => {
    return FRAME_ARCS.map((_, arcIndex) => {
      return (mesh: InstancedMesh | null) => {
        tickInstanceRefs.current[arcIndex] = mesh;
        if (!mesh) return;
        const matrices = allTickMatrices[arcIndex];
        for (let i = 0; i < matrices.length; i++) {
          mesh.setMatrixAt(i, matrices[i]);
        }
        mesh.instanceMatrix.needsUpdate = true;
      };
    });
  }, [allTickMatrices]);

  // Celebration config
  const celebrationRevolutions = CELEBRATION_REVOLUTIONS[celebrationTier] ?? 1;
  const celebrationDurationMs = CELEBRATION_TIERS[celebrationTier]?.durationMs ?? 1500;

  // ═══════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;

    // Update time display roughly every second
    if (t - lastTimeUpdateRef.current > 1.0) {
      lastTimeUpdateRef.current = t;
      setDisplayTime(getCurrentTime());
    }

    // ── Breathing pulse (4-second sine cycle) ──
    const breathPhase = (Math.sin((t * Math.PI * 2) / BREATHING_PERIOD_S) * 0.5 + 0.5);
    const breathEmissive = MathUtils.lerp(
      EMISSIVE_IDLE_INDICATOR * 0.6,
      EMISSIVE_IDLE_INDICATOR * EMISSIVE_LED_MULTIPLIER,
      breathPhase,
    );

    // ── Celebration cascade tracking ──
    let cascadeProgress = -1; // -1 = no cascade
    if (celebrationActive) {
      if (celebrationStartRef.current === null) {
        celebrationStartRef.current = t;
      }
      const elapsed = (t - celebrationStartRef.current) * 1000;
      if (elapsed < celebrationDurationMs) {
        // Progress: 0 → celebrationRevolutions (each revolution = 1.0 around all 4 segments)
        cascadeProgress = (elapsed / celebrationDurationMs) * celebrationRevolutions;
      } else {
        // Celebration finished
        celebrationStartRef.current = null;
      }
    } else {
      celebrationStartRef.current = null;
    }

    // ── Update arc materials ──
    for (let i = 0; i < FRAME_ARCS.length; i++) {
      const mesh = arcMeshRefs.current[i];
      if (!mesh) continue;
      const mat = mesh.material as MeshStandardMaterial;

      // Determine if this arc segment is currently "lit" by the cascade
      let cascadeIntensity = 0;
      if (cascadeProgress >= 0) {
        const arcId = FRAME_ARCS[i].id;
        const orderIndex = CASCADE_ORDER.indexOf(arcId as typeof CASCADE_ORDER[number]);
        if (orderIndex >= 0) {
          // Each segment occupies 0.25 of one revolution
          // Fractional revolution position
          const fractionalPos = cascadeProgress % 1.0;
          const segStart = orderIndex * 0.25;
          const segEnd = segStart + 0.25;
          // Chase light width: 0.15 of revolution
          const chaseHead = fractionalPos;
          const chaseTail = fractionalPos - 0.15;
          // Check overlap
          if (chaseHead >= segStart && chaseTail < segEnd) {
            cascadeIntensity = Math.min(1.0, (chaseHead - segStart) / 0.15);
          }
        }
      }

      if (cascadeIntensity > 0) {
        // Gold cascade color
        mat.emissive.copy(GOLD_COLOR);
        mat.emissiveIntensity = MathUtils.lerp(breathEmissive, 3.0, cascadeIntensity);
      } else {
        mat.emissive.copy(hudColor);
        mat.emissiveIntensity = breathEmissive;
      }
    }

    // ── Update tick mark materials (same breathing + cascade) ──
    for (let i = 0; i < FRAME_ARCS.length; i++) {
      const instancedMesh = tickInstanceRefs.current[i];
      if (!instancedMesh) continue;
      const mat = instancedMesh.material as MeshStandardMaterial;

      let cascadeIntensity = 0;
      if (cascadeProgress >= 0) {
        const arcId = FRAME_ARCS[i].id;
        const orderIndex = CASCADE_ORDER.indexOf(arcId as typeof CASCADE_ORDER[number]);
        if (orderIndex >= 0) {
          const fractionalPos = cascadeProgress % 1.0;
          const segStart = orderIndex * 0.25;
          const segEnd = segStart + 0.25;
          const chaseHead = fractionalPos;
          const chaseTail = fractionalPos - 0.15;
          if (chaseHead >= segStart && chaseTail < segEnd) {
            cascadeIntensity = Math.min(1.0, (chaseHead - segStart) / 0.15);
          }
        }
      }

      if (cascadeIntensity > 0) {
        mat.emissive.copy(GOLD_COLOR);
        mat.emissiveIntensity = MathUtils.lerp(breathEmissive * 0.8, 2.5, cascadeIntensity);
      } else {
        mat.emissive.copy(hudColor);
        mat.emissiveIntensity = breathEmissive * 0.8;
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // EARLY RETURN
  // ═══════════════════════════════════════════════════════════════

  if (!active || opacity <= 0) return null;

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  const labelStyle = TYPE_SCALE.label;
  const captionStyle = TYPE_SCALE.caption;
  // Phase 2 audit fix (Section 4.2): HUD visibility — Decision 6.5
  // Fill opacity floor raised 0.4 → 0.5 for readability boost
  const textFill = Math.max(0.5, TEXT_COLORS.secondary.opacity * opacity);
  const textMutedFill = Math.max(0.5, TEXT_COLORS.muted.opacity * opacity);

  // Format readout strings
  const xpText = `XP: ${xp.toLocaleString()}`;
  const modeText = modeName.toUpperCase();
  const childText = childName
    ? childLevel != null
      ? `${childName} / LV.${childLevel}`
      : childName
    : '';

  return (
    <group renderOrder={10}>
      {/* ════════ 4 Arc Segments (Viewport Frame) ════════ */}
      {FRAME_ARCS.map((arc, i) => (
        <group
          key={arc.id}
          position={arc.position as unknown as [number, number, number]}
          rotation={arc.rotation as unknown as [number, number, number]}
        >
          {/* Arc ring mesh */}
          <mesh
            ref={(el) => { arcMeshRefs.current[i] = el; }}
          >
            <primitive object={arcGeometries[i]} attach="geometry" />
            <meshStandardMaterial
              color={CHROME_BORDER.color}
              emissive={hudColor}
              emissiveIntensity={EMISSIVE_IDLE_INDICATOR}
              transparent
              opacity={opacity}
              side={DoubleSide}
              depthWrite={false}
              toneMapped={false}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Graduated tick marks along arc (instanced) */}
          {tickCounts[i] > 0 && (
            <instancedMesh
              ref={tickRefCallbacks[i]}
              args={[tickGeo, undefined, tickCounts[i]]}
              frustumCulled={false}
            >
              <meshStandardMaterial
                color="#000000"
                emissive={hudColor}
                emissiveIntensity={EMISSIVE_IDLE_INDICATOR * 0.8}
                transparent
                opacity={opacity * 0.85}
                depthWrite={false}
                toneMapped={false}
              />
            </instancedMesh>
          )}
        </group>
      ))}

      {/* ════════ Corner Data Readouts ════════ */}
      {/* Phase 2 audit fix (Section 4.2): HUD visibility — Decision 6.5
          Added background plates, thicker outlines for readability */}

      {/* Top-left: Current time (HH:MM) */}
      <group position={cornerPositions.topLeft}>
        <mesh position={[0.06, -0.03, -0.001]}>
          <planeGeometry args={[0.18, 0.09]} />
          <meshBasicMaterial color="#000000" opacity={0.4} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <Text
          fontSize={labelStyle.fontSize}
          color={TEXT_COLORS.secondary.hex}
          anchorX="left"
          anchorY="top"
          font={NUMERIC_FONT}
          fillOpacity={textFill}
          outlineWidth={0.006}
          outlineColor="#0A0E16"
          strokeWidth={0.001}
          strokeColor="#0A0E16"
        >
          {displayTime}
        </Text>
      </group>

      {/* Top-right: XP value */}
      <group position={cornerPositions.topRight}>
        <mesh position={[-0.15, -0.03, -0.001]}>
          <planeGeometry args={[0.36, 0.09]} />
          <meshBasicMaterial color="#000000" opacity={0.4} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <Text
          fontSize={labelStyle.fontSize}
          color={TEXT_COLORS.secondary.hex}
          anchorX="right"
          anchorY="top"
          font={NUMERIC_FONT}
          fillOpacity={textFill}
          outlineWidth={0.006}
          outlineColor="#0A0E16"
          strokeWidth={0.001}
          strokeColor="#0A0E16"
        >
          {xpText}
        </Text>
      </group>

      {/* Bottom-left: Mode name — COCK-03: use secondary opacity for readability */}
      <group position={cornerPositions.bottomLeft}>
        <mesh position={[0.12, 0.03, -0.001]}>
          <planeGeometry args={[0.3, 0.09]} />
          <meshBasicMaterial color="#000000" opacity={0.4} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <Text
          fontSize={captionStyle.fontSize}
          color={color}
          anchorX="left"
          anchorY="bottom"
          font={labelStyle.fontPath}
          fillOpacity={textFill}
          outlineWidth={0.008}
          outlineColor="#0A0E16"
          strokeWidth={0.001}
          strokeColor="#0A0E16"
        >
          {modeText}
        </Text>
      </group>

      {/* Bottom-right: Child name / level — COCK-03: use secondary opacity */}
      {childText && (
        <group position={cornerPositions.bottomRight}>
          <mesh position={[-0.18, 0.03, -0.001]}>
            <planeGeometry args={[0.42, 0.09]} />
            <meshBasicMaterial color="#000000" opacity={0.4} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <Text
            fontSize={captionStyle.fontSize}
            color={TEXT_COLORS.secondary.hex}
            anchorX="right"
            anchorY="bottom"
            font={labelStyle.fontPath}
            fillOpacity={textFill}
            outlineWidth={0.008}
            outlineColor="#0A0E16"
            strokeWidth={0.001}
            strokeColor="#0A0E16"
          >
            {childText}
          </Text>
        </group>
      )}
    </group>
  );
}

export default HolographicHUD;
