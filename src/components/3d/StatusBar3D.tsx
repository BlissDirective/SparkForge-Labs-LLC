'use client';

// ================================================================
// CPA v3.1 — StatusBar3D: 3D Gauge-Style Bottom Console Strip
// ================================================================
// v3.1: Design token migration + visual redesign
//   Decision 8.1: Arc bar speedometer (no needle)
//   Decision 8.2: Pulse ring streak (no flame)
//   Decision 8.3: Mini arc lab indicators (segmented donut)
//   Decision 8.4: Chrome pillars dividers (retained)
//   Decision 8.5: Curved strip profile (retained)
//
// Position: [0, -1.25, -1.95], 1M tri budget
// All visual constants from cockpitDesignTokens.ts

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  RingGeometry,
} from 'three';
import {
  CHROME_BORDER,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_LED_MULTIPLIER,
  TYPE_SCALE,
  NUMERIC_FONT,
  TEXT_COLORS,
  HOVER_GLOW,
  getEmissive,
} from '@/lib/3d/cockpitDesignTokens';

// ■■ Lab colors for 10 indicators ■■
const LAB_COLORS = [
  '#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88',
  '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
] as const;

interface StatusBarProps {
  xp: number;
  xpMax: number;
  streak: number;
  sessionTime: number;        // seconds
  labProgress: { done: number; total: number };
  labColor: string;
  opacity: number;
}

// ════════════════════════════════════════════════════
// SUB-COMPONENT: XP Speedometer — Arc Bar (Decision 8.1)
// ════════════════════════════════════════════════════
// Colored arc fills proportionally. Digital number in center (Orbitron).
// No needle. Clean, modern radial progress bar.
function XPSpeedometer({
  xp,
  xpMax,
  labColor,
  opacity,
  segments,
}: {
  xp: number;
  xpMax: number;
  labColor: string;
  opacity: number;
  segments: number;
}) {
  const fillRef = useRef<Mesh>(null);
  const glowRef = useRef<PointLight>(null);

  const xpRatio = xpMax > 0 ? Math.min(xp / xpMax, 1.0) : 0;
  const currentRatio = useRef(xpRatio);

  const labColorObj = useMemo(() => new Color(labColor), [labColor]);

  // Arc bar: 270 degrees = 3pi/2 radians, starts at bottom-left
  const arcStart = Math.PI * 0.75;  // 135 deg
  const arcTotal = Math.PI * 1.5;   // 270 deg

  // Background track ring (dim)
  const trackGeo = useMemo(
    () => new RingGeometry(0.7, 0.85, segments, 1, arcStart, arcTotal),
    [segments, arcStart, arcTotal]
  );

  // Initial fill arc geometry (animated via useFrame below)
  const fillArcGeo = useMemo(
    () => new RingGeometry(0.7, 0.85, segments, 1, arcStart, arcTotal * Math.max(xpRatio, 0.001)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, arcStart, arcTotal, xpRatio]
  );

  // We rebuild fill geometry on animated ratio via useFrame
  const animatedFillGeo = useRef<RingGeometry | null>(null);

  useFrame(() => {
    currentRatio.current = MathUtils.lerp(currentRatio.current, xpRatio, 0.04);

    // Rebuild fill arc geometry to match animated ratio
    if (fillRef.current) {
      if (animatedFillGeo.current) {
        animatedFillGeo.current.dispose();
      }
      animatedFillGeo.current = new RingGeometry(
        0.7, 0.85, segments, 1, arcStart, arcTotal * Math.max(currentRatio.current, 0.001)
      );
      fillRef.current.geometry = animatedFillGeo.current;
    }

    // Pulse glow intensity
    if (glowRef.current) {
      glowRef.current.intensity = EMISSIVE_LED_MULTIPLIER + Math.sin(Date.now() * 0.003) * 0.4;
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animatedFillGeo.current?.dispose();
    };
  }, []);

  return (
    <group>
      {/* Speedometer backing plate */}
      <mesh position={[0, 0, -0.04]}>
        <cylinderGeometry args={[1.0, 1.0, 0.06, segments]} />
        <meshStandardMaterial
          color="#0a0e16"
          metalness={0.8}
          roughness={0.3}
          transparent
          opacity={opacity * 0.7}
        />
      </mesh>

      {/* Background track ring (dim) */}
      <mesh geometry={trackGeo} position={[0, 0, 0.01]}>
        <meshStandardMaterial
          color="#1a1e2e"
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={opacity * 0.6}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Fill arc (emissive, lab-colored) */}
      <mesh ref={fillRef} geometry={fillArcGeo} position={[0, 0, 0.02]}>
        <meshStandardMaterial
          color="#000000"
          emissive={labColorObj}
          emissiveIntensity={EMISSIVE_LED_MULTIPLIER}
          transparent
          opacity={opacity * 0.85}
          toneMapped={false}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Digital XP number in center — Orbitron (Decision 8.1) */}
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.18}
        color={labColor}
        font="/fonts/Orbitron-Bold.woff2"
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
      >
        {xp}
      </Text>

      {/* "XP" label below number */}
      <Text
        position={[0, -0.25, 0.03]}
        fontSize={0.07}
        color="#88aacc"
        font="/fonts/Sora-Regular.woff2"
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
      >
        XP
      </Text>

      {/* Chrome bezel ring around speedometer */}
      <mesh position={[0, 0, 0.01]}>
        <torusGeometry args={[0.98, 0.03, 16, 64]} />
        <meshStandardMaterial
          color={CHROME_BORDER.colorHex}
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.85}
        />
      </mesh>

      {/* Point light glow at center */}
      <pointLight
        ref={glowRef}
        color={labColor}
        intensity={EMISSIVE_LED_MULTIPLIER}
        distance={2.5}
        decay={2}
        position={[0, 0, 0.15]}
      />
    </group>
  );
}

// ════════════════════════════════════════════════════
// SUB-COMPONENT: Streak Pulse Ring (Decision 8.2)
// ════════════════════════════════════════════════════
// Ring pulses with streak intensity. No flame/fire sculpture.
// 1-day = slow faint, 7-day = medium, 30-day = rapid bright.
function StreakPulseRing({
  streak,
  opacity,
  segments,
}: {
  streak: number;
  opacity: number;
  segments: number;
}) {
  const ringRef = useRef<Mesh>(null);

  // Determine pulse parameters based on streak count (Decision 8.2)
  const { pulsePeriod, emissiveLevel } = useMemo(() => {
    if (streak >= 30) {
      return { pulsePeriod: 0.5, emissiveLevel: 1.5 };
    } else if (streak >= 7) {
      return { pulsePeriod: 1.5, emissiveLevel: 0.8 };
    } else {
      return { pulsePeriod: 3.0, emissiveLevel: 0.4 };
    }
  }, [streak]);

  // Accent color — orange for streaks
  const streakColor = useMemo(() => new Color('#FF6644'), []);

  // Pulse ring geometry (Decision 8.2: inner 0.12, outer 0.18, 32 segments)
  const ringGeo = useMemo(
    () => new RingGeometry(0.12, 0.18, 32, 1),
    []
  );

  useFrame(() => {
    if (!ringRef.current) return;
    const time = Date.now() * 0.001;
    const pulse = Math.sin((time * Math.PI * 2) / pulsePeriod) * 0.5 + 0.5; // 0..1

    const mat = ringRef.current.material as MeshStandardMaterial;
    if (mat && 'emissiveIntensity' in mat) {
      mat.emissiveIntensity = emissiveLevel * (0.5 + pulse * 0.5);
    }
  });

  if (streak <= 0 && opacity <= 0) return null;

  return (
    <group>
      {/* Pulse ring (Decision 8.2) */}
      <mesh
        ref={ringRef}
        geometry={ringGeo}
        position={[0, 0, 0.01]}
      >
        <meshStandardMaterial
          color="#000000"
          emissive={streakColor}
          emissiveIntensity={streak > 0 ? emissiveLevel : 0.15}
          transparent
          opacity={opacity * 0.85}
          toneMapped={false}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Streak count number in center — Orbitron */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.08}
        font="/fonts/Orbitron-Bold.woff2"
        color="#FF6644"
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
      >
        {streak}
      </Text>
    </group>
  );
}

// ════════════════════════════════════════════════════
// SUB-COMPONENT: Lab Progress Mini Arcs (Decision 8.3)
// ════════════════════════════════════════════════════
// 10 tiny arc segments forming a ring (~20 deg each).
// Each fills proportionally to lab completion. Segmented donut chart.
function LabMiniArcs({
  labProgress,
  opacity,
  segments,
}: {
  labProgress: { done: number; total: number };
  opacity: number;
  segments: number;
}) {
  const groupRef = useRef<Group>(null);

  const labColors = useMemo(
    () => LAB_COLORS.map((c) => new Color(c)),
    []
  );

  // 10 mini arc segments: ~20° (0.349 rad) each with 2° (0.035 rad) gap (Decision 8.3)
  const arcSweep = 0.349; // ~20 degrees in radians
  const gapSweep = 0.035; // ~2 degrees in radians
  const totalSpanRad = 10 * arcSweep + 9 * gapSweep; // total angular span
  const startAngleRad = -totalSpanRad / 2; // center the ring

  // Per-lab completion: labs 0..(done-1) are 100%, rest 0%
  const getLabCompletion = (index: number): number => {
    if (index < labProgress.done) return 1.0;
    return 0;
  };

  // Build arc geometries (inner 0.35, outer 0.42)
  const arcData = useMemo(() => {
    const data: { trackGeo: RingGeometry; fillGeo: RingGeometry | null; startRad: number; sweepRad: number; color: Color }[] = [];
    const innerR = 0.35;
    const outerR = 0.42;

    for (let i = 0; i < 10; i++) {
      const angleRad = startAngleRad + i * (arcSweep + gapSweep);
      const completion = getLabCompletion(i);

      // Track (dim background — always full arc)
      const trackGeo = new RingGeometry(innerR, outerR, Math.max(segments / 4, 8), 1, angleRad, arcSweep);

      // Fill (proportional, lab-colored)
      let fillGeo: RingGeometry | null = null;
      if (completion > 0) {
        fillGeo = new RingGeometry(innerR, outerR, Math.max(segments / 4, 8), 1, angleRad, arcSweep * completion);
      }

      data.push({ trackGeo, fillGeo, startRad: angleRad, sweepRad: arcSweep, color: labColors[i] });
    }
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labProgress.done, segments, labColors]);

  // Gentle pulse on completed arcs
  useFrame(() => {
    // Handled via emissive intensity — could add animation here if desired
  });

  return (
    <group ref={groupRef}>
      {arcData.map((arc, i) => (
        <group key={`lab-arc-${i}`}>
          {/* Track (dim background) */}
          <mesh geometry={arc.trackGeo} position={[0, 0, 0.005]}>
            <meshStandardMaterial
              color="#1a1e2e"
              metalness={0.5}
              roughness={0.4}
              transparent
              opacity={opacity * 0.5}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Fill (lab-colored, proportional) */}
          {arc.fillGeo && (
            <mesh geometry={arc.fillGeo} position={[0, 0, 0.015]}>
              <meshStandardMaterial
                color="#000000"
                emissive={arc.color}
                emissiveIntensity={EMISSIVE_LED_MULTIPLIER}
                transparent
                opacity={opacity * 0.85}
                toneMapped={false}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Center completion text — Orbitron */}
      <Text
        position={[0, 0.05, 0.02]}
        fontSize={0.22}
        font={NUMERIC_FONT}
        color={TEXT_COLORS.primary.hex}
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
      >
        {labProgress.done}/{labProgress.total}
      </Text>

      {/* "LABS" label — Sora caption */}
      <Text
        position={[0, -0.15, 0.02]}
        fontSize={TYPE_SCALE.caption.fontSize * 8}
        font={TYPE_SCALE.caption.fontPath}
        color={TEXT_COLORS.muted.hex}
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity * TEXT_COLORS.muted.opacity}
      >
        LABS
      </Text>

      {/* Chrome bezel around arc ring */}
      <mesh position={[0, 0, 0.003]}>
        <torusGeometry args={[0.9, 0.02, 12, 48]} />
        <meshStandardMaterial
          color={CHROME_BORDER.colorHex}
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.7}
        />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════
// SUB-COMPONENT: Chrome Divider Pillars (Decision 8.4)
// ════════════════════════════════════════════════════
// Thin vertical chrome bars between sections.
function ChromeDividers({
  positions,
  opacity,
  segments,
  height,
}: {
  positions: number[];
  opacity: number;
  segments: number;
  height: number;
}) {
  const instancedRef = useRef<InstancedMesh>(null);
  const capInstancedRef = useRef<InstancedMesh>(null);
  const count = positions.length;

  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!instancedRef.current || !capInstancedRef.current) return;

    positions.forEach((x, i) => {
      // Main pillar
      dummy.position.set(x, 0, 0);
      dummy.scale.set(0.04, height, 0.04);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instancedRef.current!.setMatrixAt(i, dummy.matrix);

      // Top cap sphere
      dummy.position.set(x, height * 0.5, 0);
      dummy.scale.set(0.06, 0.06, 0.06);
      dummy.updateMatrix();
      capInstancedRef.current!.setMatrixAt(i, dummy.matrix);

      // Bottom cap
      dummy.position.set(x, -height * 0.5, 0);
      dummy.updateMatrix();
      capInstancedRef.current!.setMatrixAt(i + count, dummy.matrix);
    });

    instancedRef.current.instanceMatrix.needsUpdate = true;
    capInstancedRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, height, dummy, count]);

  return (
    <group>
      {/* Pillar shafts (instanced cylinders) */}
      <instancedMesh
        ref={instancedRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 1, 1, segments]} />
        <meshStandardMaterial
          color={CHROME_BORDER.colorHex}
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.85}
          envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Cap spheres (instanced, top + bottom) */}
      <instancedMesh
        ref={capInstancedRef}
        args={[undefined, undefined, count * 2]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, Math.max(segments / 2, 8), Math.max(segments / 2, 8)]} />
        <meshStandardMaterial
          color={CHROME_BORDER.colorHex}
          metalness={0.95}
          roughness={0.05}
          transparent
          opacity={opacity * 0.85}
          envMapIntensity={1.5}
        />
      </instancedMesh>
    </group>
  );
}

// ════════════════════════════════════════════════════
// MAIN EXPORT: StatusBar3D
// ════════════════════════════════════════════════════
export function StatusBar3D({
  xp,
  xpMax,
  streak,
  sessionTime: _sessionTime,
  labProgress,
  labColor,
  opacity,
}: StatusBarProps) {
  const groupRef = useRef<Group>(null);
  const { viewport } = useThree();

  const segments = 64;

  const labColorObj = useMemo(() => new Color(labColor), [labColor]);

  if (opacity <= 0) return null;

  const barWidth = Math.min(viewport.width * 0.85, 14);
  const barHeight = 0.5;
  const barDepth = 0.12;
  const yPos = -viewport.height * 0.45;

  // Section positions (left to right)
  const xpCenterX = -barWidth * 0.35;
  const streakCenterX = -barWidth * 0.05;
  const progressCenterX = barWidth * 0.25;

  // Divider X positions (between sections)
  const dividerPositions = [
    (xpCenterX + streakCenterX) / 2,
    (streakCenterX + progressCenterX) / 2,
  ];

  return (
    <group ref={groupRef} position={[0, yPos, -3.5]}>
      {/* ─── 3D Base Strip (BoxGeometry with depth) ─── */}
      <mesh position={[0, 0, -barDepth / 2]}>
        <boxGeometry args={[barWidth, barHeight, barDepth]} />
        <meshStandardMaterial
          color="#0e1118"
          metalness={0.85}
          roughness={0.2}
          transparent
          opacity={opacity * 0.75}
          envMapIntensity={1.0}
        />
      </mesh>

      {/* Chrome top edge */}
      <mesh position={[0, barHeight * 0.5, 0]}>
        <boxGeometry args={[barWidth + 0.04, 0.025, barDepth + 0.02]} />
        <meshStandardMaterial
          color={CHROME_BORDER.colorHex}
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.8}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Chrome bottom edge */}
      <mesh position={[0, -barHeight * 0.5, 0]}>
        <boxGeometry args={[barWidth + 0.04, 0.025, barDepth + 0.02]} />
        <meshStandardMaterial
          color={CHROME_BORDER.colorHex}
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.8}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Emissive top highlight line */}
      <mesh position={[0, barHeight * 0.5 + 0.015, 0.01]}>
        <boxGeometry args={[barWidth, 0.006, 0.002]} />
        <meshStandardMaterial
          color="#000000"
          emissive={labColorObj}
          emissiveIntensity={EMISSIVE_IDLE_INDICATOR}
          transparent
          opacity={opacity * 0.5}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* ─── Chrome Divider Pillars (Decision 8.4) ─── */}
      <ChromeDividers
        positions={dividerPositions}
        opacity={opacity}
        segments={segments}
        height={barHeight * 0.8}
      />

      {/* ─── XP Speedometer Section — Arc Bar (Decision 8.1) ─── */}
      <group position={[xpCenterX, 0, 0.08]} scale={[0.22, 0.22, 0.22]}>
        <XPSpeedometer
          xp={xp}
          xpMax={xpMax}
          labColor={labColor}
          opacity={opacity}
          segments={segments}
        />
      </group>

      {/* ─── Streak Pulse Ring Section (Decision 8.2) ─── */}
      <group position={[streakCenterX, -0.02, 0.08]} scale={[0.35, 0.35, 0.35]}>
        <StreakPulseRing
          streak={streak}
          opacity={opacity}
          segments={segments}
        />
      </group>

      {/* ─── Lab Progress Mini Arcs (Decision 8.3) ─── */}
      <group position={[progressCenterX, 0, 0.08]} scale={[0.45, 0.45, 0.45]}>
        <LabMiniArcs
          labProgress={labProgress}
          opacity={opacity}
          segments={segments}
        />
      </group>

      {/* ─── Session Time Display (far right, subtle) ─── */}
      <group position={[barWidth * 0.42, 0, 0.06]}>
        {/* Time backing plate */}
        <mesh>
          <boxGeometry args={[0.6, 0.2, 0.03]} />
          <meshStandardMaterial
            color="#111118"
            metalness={0.7}
            roughness={0.3}
            transparent
            opacity={opacity * 0.6}
          />
        </mesh>
        {/* Clock ring indicator */}
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[0.06, 0.075, segments]} />
          <meshStandardMaterial
            color="#000000"
            emissive="#00FF88"
            emissiveIntensity={EMISSIVE_IDLE_INDICATOR}
            transparent
            opacity={opacity * 0.7}
            toneMapped={false}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ─── Corner accent bolts (4 corners) ─── */}
      {[
        [-barWidth / 2 + 0.08, barHeight / 2 - 0.08],
        [barWidth / 2 - 0.08, barHeight / 2 - 0.08],
        [-barWidth / 2 + 0.08, -barHeight / 2 + 0.08],
        [barWidth / 2 - 0.08, -barHeight / 2 + 0.08],
      ].map(([cx, cy], i) => (
        <mesh key={`bolt-${i}`} position={[cx, cy, 0.07]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
          <meshStandardMaterial
            color={CHROME_BORDER.colorHex}
            metalness={0.95}
            roughness={0.05}
            transparent
            opacity={opacity * 0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
