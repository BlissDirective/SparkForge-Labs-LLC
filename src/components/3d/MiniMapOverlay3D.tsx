'use client';

// ════════════════════════════════════════════════════════════
// MiniMapOverlay3D — Persistent 3D Minimap for Cockpit
// ════════════════════════════════════════════════════════════
// Renders a miniature lab ring in the top-right cockpit area.
// Triangle budget: 250,000
// Features: 10 lab nodes, ring connections, completion glow,
//           focused lab pulse, player indicator, chrome bezel.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useLOD } from '@/hooks/useLOD';

// ■■ Lab Colors (L1–L10) ■■
const LAB_COLORS = [
  '#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88',
  '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
] as const;

const RING_RADIUS = 1.5;
const TWO_PI = Math.PI * 2;

// ■■ Props ■■
interface MiniMapOverlay3DProps {
  focusedLabId: number | null;
  labCompletions: Record<number, number>;
  position?: [number, number, number];
  scale?: number;
  visible?: boolean;
}

// ■■ Precompute lab node positions (evenly spaced around circle) ■■
function getLabPosition(index: number): [number, number, number] {
  const angle = (index / 10) * TWO_PI - Math.PI / 2; // start from top
  return [
    Math.cos(angle) * RING_RADIUS,
    0,
    Math.sin(angle) * RING_RADIUS,
  ];
}

// ════════════════════════════════════════════════════════════
// LabNode — Single lab sphere with label
// ════════════════════════════════════════════════════════════
interface LabNodeProps {
  index: number;
  color: string;
  completed: boolean;
  segments: number;
}

function LabNode({ index, color, completed, segments }: LabNodeProps) {
  const pos = useMemo(() => getLabPosition(index), [index]);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  const labelPos = useMemo<[number, number, number]>(() => {
    const angle = (index / 10) * TWO_PI - Math.PI / 2;
    const labelRadius = RING_RADIUS + 0.3;
    return [Math.cos(angle) * labelRadius, 0.15, Math.sin(angle) * labelRadius];
  }, [index]);

  return (
    <group>
      {/* Lab sphere */}
      <mesh position={pos}>
        <sphereGeometry args={[0.1, segments, segments]} />
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={completed ? 0.8 : 0.1}
          roughness={completed ? 0.2 : 0.6}
          metalness={0.4}
          transparent={!completed}
          opacity={completed ? 1.0 : 0.5}
        />
      </mesh>

      {/* Lab number label */}
      <Text
        position={labelPos}
        fontSize={0.1}
        color={color}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        font="/fonts/Orbitron-Regular.woff"
      >
        {String(index + 1)}
      </Text>
    </group>
  );
}

// ════════════════════════════════════════════════════════════
// FocusedLabIndicator — Pulsing ring around focused lab
// ════════════════════════════════════════════════════════════
function FocusedLabIndicator({
  labIndex,
  color,
  tubularSegments,
}: {
  labIndex: number;
  color: string;
  tubularSegments: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pos = useMemo(() => getLabPosition(labIndex), [labIndex]);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pulse = 0.8 + Math.sin(clock.elapsedTime * 4) * 0.2;
    meshRef.current.scale.setScalar(pulse);
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.5 + Math.sin(clock.elapsedTime * 4) * 0.5;
  });

  return (
    <mesh ref={meshRef} position={pos} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.17, 0.015, 8, tubularSegments]} />
      <meshStandardMaterial
        color={colorObj}
        emissive={colorObj}
        emissiveIntensity={0.8}
        transparent
        opacity={0.9}
        toneMapped={false}
      />
    </mesh>
  );
}

// ════════════════════════════════════════════════════════════
// PlayerIndicator — Cone pointing at focused lab or orbiting
// ════════════════════════════════════════════════════════════
function PlayerIndicator({
  focusedLabId,
  segments,
}: {
  focusedLabId: number | null;
  segments: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const coneRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!groupRef.current || !coneRef.current) return;
    const t = clock.elapsedTime;

    if (focusedLabId !== null) {
      // Point at the focused lab
      const targetPos = getLabPosition(focusedLabId - 1);
      const angle = Math.atan2(targetPos[2], targetPos[0]);
      const indicatorRadius = RING_RADIUS - 0.4;
      groupRef.current.position.set(
        Math.cos(angle) * indicatorRadius,
        0.12,
        Math.sin(angle) * indicatorRadius,
      );
      // Bob gently
      coneRef.current.position.y = Math.sin(t * 3) * 0.03;
      // Point outward
      groupRef.current.rotation.y = -angle + Math.PI / 2;
    } else {
      // Orbit around the ring center
      const orbitAngle = t * 0.5;
      const orbitRadius = RING_RADIUS * 0.6;
      groupRef.current.position.set(
        Math.cos(orbitAngle) * orbitRadius,
        0.12 + Math.sin(t * 2) * 0.03,
        Math.sin(orbitAngle) * orbitRadius,
      );
      groupRef.current.rotation.y = -orbitAngle + Math.PI / 2;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coneRef} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.05, 0.12, segments]} />
        <meshStandardMaterial
          color="#00BBFF"
          emissive="#00BBFF"
          emissiveIntensity={0.6}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════
// MiniMapOverlay3D — Main Component
// ════════════════════════════════════════════════════════════
export function MiniMapOverlay3D({
  focusedLabId,
  labCompletions,
  position = [5, 3, -2],
  scale = 0.3,
  visible = true,
}: MiniMapOverlay3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const lod = useLOD({ tier: 'system' });

  // LOD-aware geometry params
  const sphereSegs = lod.segments;
  const tubularSegs = lod.tubularSegments;
  const coneSegs = Math.max(6, Math.floor(lod.segments / 2));

  // Chrome bezel color
  const chromeColor = useMemo(() => new THREE.Color(0.7, 0.7, 0.75), []);

  // Gentle auto-rotation when no lab is focused
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (focusedLabId === null) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.15;
    } else {
      // Smoothly orient to face focused lab
      const targetAngle = ((focusedLabId - 1) / 10) * TWO_PI - Math.PI / 2;
      const target = -targetAngle + Math.PI;
      const current = groupRef.current.rotation.y;
      groupRef.current.rotation.y += (target - current) * 0.02;
    }
  });

  if (!visible) return null;

  return (
    <group position={position} scale={scale}>
      <group ref={groupRef}>
        {/* ── Base Plate ── */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry
            args={[RING_RADIUS + 0.4, RING_RADIUS + 0.45, 0.04, tubularSegs]}
          />
          <meshStandardMaterial
            color="#111118"
            roughness={0.4}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* ── Chrome Bezel Ring ── */}
        <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry
            args={[RING_RADIUS + 0.42, 0.025, 8, tubularSegs]}
          />
          <meshStandardMaterial
            color={chromeColor}
            emissive={chromeColor}
            emissiveIntensity={0.12}
            metalness={0.95}
            roughness={0.1}
          />
        </mesh>

        {/* ── Connection Ring (links all 10 labs) ── */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry
            args={[RING_RADIUS, 0.012, 6, tubularSegs]}
          />
          <meshStandardMaterial
            color="#1A1822"
            emissive="#00BBFF"
            emissiveIntensity={0.15}
            transparent
            opacity={0.6}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* ── Lab Nodes (10 spheres) ── */}
        {LAB_COLORS.map((color, i) => (
          <LabNode
            key={i}
            index={i}
            color={color}
            completed={(labCompletions[i + 1] ?? 0) >= 100}
            segments={sphereSegs}
          />
        ))}

        {/* ── Focused Lab Pulse Indicator ── */}
        {focusedLabId !== null &&
          focusedLabId >= 1 &&
          focusedLabId <= 10 && (
            <FocusedLabIndicator
              labIndex={focusedLabId - 1}
              color={LAB_COLORS[focusedLabId - 1]}
              tubularSegments={tubularSegs}
            />
          )}

        {/* ── Player Position Indicator ── */}
        <PlayerIndicator
          focusedLabId={focusedLabId}
          segments={coneSegs}
        />
      </group>
    </group>
  );
}

export default MiniMapOverlay3D;
