"use client";

// ================================================================
// DATA DETECTIVE 3D — Lab 2 (Teaching AI) — v3 Enhanced 3D
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// [v3] 3D magnifying glass cursor with lens refraction
// [v3] Investigation desk lamp as R3F SpotLight
// [v3] Evidence card depth + flip animations
// [v3] Fix particle bursts from magnifying glass
// [v3] Decision 6.5 — Tier 2 Enhanced 3D
// ================================================================

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, invalidate } from "@react-three/fiber";
import {
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
} from 'three';

// ■■■ Types ■■■

interface DataDetective3DProps {
  selectedRow: number | null;
  totalRows: number;
  fixedRows: Set<number>;
  deletedRows: Set<number>;
  lastFixedRow: number | null;
  worldColor: string;
}

// ■■■ Magnifying Glass Component ■■■

function MagnifyingGlass({
  targetY,
  worldColor,
}: {
  targetY: number;
  worldColor: string;
}) {
  const groupRef = useRef<Group>(null);
  const currentY = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    currentY.current = MathUtils.lerp(
      currentY.current,
      targetY,
      delta * 3
    );
    groupRef.current.position.y = currentY.current;
    // Gentle bob animation (uses R3F clock instead of Date.now — LOW-1 fix)
    const t = clock.getElapsedTime();
    groupRef.current.position.x = Math.sin(t) * 0.05;
    groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.03;
    invalidate();
  });

  return (
    <group ref={groupRef} position={[2.2, 0, 0.5]}>
      {/* Lens (glass) */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0, 0.35, 32]} />
        <meshPhysicalMaterial
          color="#e0e8ff"
          transparent
          opacity={0.15}
          transmission={0.6}
          roughness={0}
          metalness={0}
          clearcoat={1.0}
          clearcoatRoughness={0}
          ior={1.5}
          side={DoubleSide}
        />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.35, 0.035, 8, 32]} />
        <meshStandardMaterial
          color="#C0C0C0"
          metalness={0.9}
          roughness={0.15}
          emissive={worldColor}
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[0.25, -0.4, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.04, 0.05, 0.45, 8]} />
        <meshStandardMaterial
          color="#8B7355"
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[0.33, 0.38, 32]} />
        <meshBasicMaterial
          color={worldColor}
          transparent
          opacity={0.15}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ■■■ Desk Lamp Component ■■■

function DeskLamp({ worldColor }: { worldColor: string }) {
  return (
    <group position={[-1.8, 1.5, 1]}>
      {/* Lamp shade (cone) */}
      <mesh rotation={[Math.PI, 0, 0.2]}>
        <coneGeometry args={[0.35, 0.5, 16, 1, true]} />
        <meshStandardMaterial
          color="#2a2a3e"
          metalness={0.6}
          roughness={0.4}
          side={DoubleSide}
        />
      </mesh>
      {/* Lamp arm */}
      <mesh position={[0.1, 0.4, -0.1]} rotation={[0.3, 0, 0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial
          color="#555566"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {/* Spotlight beam */}
      <spotLight
        position={[0, -0.1, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={2}
        color={worldColor}
        castShadow={false}
      />
    </group>
  );
}

// ■■■ Fix Particle Burst ■■■

function FixParticles({
  active,
  position,
  worldColor,
}: {
  active: boolean;
  position: [number, number, number];
  worldColor: string;
}) {
  const pointsRef = useRef<Points>(null);
  const velocities = useRef<Float32Array>(new Float32Array(60));
  const lifetimes = useRef<Float32Array>(new Float32Array(20));

  useEffect(() => {
    if (active && pointsRef.current) {
      const posArr = pointsRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < 20; i++) {
        posArr[i * 3] = position[0];
        posArr[i * 3 + 1] = position[1];
        posArr[i * 3 + 2] = position[2];
        velocities.current[i * 3] = (Math.random() - 0.5) * 2;
        velocities.current[i * 3 + 1] = Math.random() * 1.5 + 0.5;
        velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 2;
        lifetimes.current[i] = 1.0;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [active, position]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posArr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    let anyAlive = false;
    for (let i = 0; i < 20; i++) {
      if (lifetimes.current[i] <= 0) {
        // Move dead particles offscreen (BUG-M4 fix)
        posArr[i * 3 + 1] = -100;
        continue;
      }
      anyAlive = true;
      lifetimes.current[i] -= delta * 1.5;
      posArr[i * 3] += velocities.current[i * 3] * delta;
      posArr[i * 3 + 1] += velocities.current[i * 3 + 1] * delta;
      posArr[i * 3 + 2] += velocities.current[i * 3 + 2] * delta;
      // Gravity
      velocities.current[i * 3 + 1] -= delta * 2;
    }
    // Only flag needsUpdate when particles are alive (LOW-2 fix)
    if (anyAlive) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      invalidate();
    }
    const mat = pointsRef.current.material as PointsMaterial;
    mat.opacity = anyAlive ? 0.8 : 0;
  });

  const positions = useMemo(() => new Float32Array(60), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={20}
        />
      </bufferGeometry>
      <pointsMaterial
        color={worldColor}
        size={0.06}
        transparent
        opacity={0}
        sizeAttenuation
      />
    </points>
  );
}

// ■■■ Evidence Card (3D plane) ■■■

function EvidenceCard({
  index,
  isSelected,
  isFixed,
  isDeleted,
  worldColor,
}: {
  index: number;
  totalRows: number;
  isSelected: boolean;
  isFixed: boolean;
  isDeleted: boolean;
  issueColor: string | null;
  worldColor: string;
}) {
  const meshRef = useRef<Mesh>(null);
  const y = 0.8 - index * 0.28;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetRotY = isSelected ? Math.PI * 0.05 : 0;
    const targetZ = isSelected ? 0.15 : 0;
    meshRef.current.rotation.y = MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotY,
      delta * 4
    );
    meshRef.current.position.z = MathUtils.lerp(
      meshRef.current.position.z,
      targetZ,
      delta * 4
    );
    const mat = meshRef.current.material as MeshStandardMaterial;
    mat.opacity = isDeleted
      ? MathUtils.lerp(mat.opacity, 0.2, delta * 3)
      : MathUtils.lerp(mat.opacity, 0.7, delta * 3);
    invalidate();
  });

  const cardColor = isFixed
    ? "#10B981"
    : isDeleted
      ? "#6B7280"
      : "#ffffff";

  return (
    <mesh ref={meshRef} position={[0, y, 0]}>
      <planeGeometry args={[3.5, 0.22]} />
      <meshStandardMaterial
        color={cardColor}
        transparent
        opacity={0.7}
        emissive={isSelected ? worldColor : "#000000"}
        emissiveIntensity={isSelected ? 0.3 : 0}
        roughness={0.8}
        side={DoubleSide}
      />
    </mesh>
  );
}

// ■■■ Exported Component ■■■

export default function DataDetective3D({
  selectedRow,
  totalRows,
  fixedRows,
  deletedRows,
  lastFixedRow,
  worldColor,
}: DataDetective3DProps) {
  const magY = selectedRow !== null
    ? 0.8 - (selectedRow % totalRows) * 0.28
    : 0.4;

  const [burstActive, setBurstActive] = useState(false);
  const burstPos = useRef<[number, number, number]>([2.2, 0, 0.5]);

  useEffect(() => {
    if (lastFixedRow !== null) {
      burstPos.current = [2.2, 0.8 - (lastFixedRow % 10) * 0.28, 0.5];
      setBurstActive(true);
      const t = setTimeout(() => setBurstActive(false), 800);
      return () => clearTimeout(t);
    }
  }, [lastFixedRow]);

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <DeskLamp worldColor={worldColor} />

      {/* Evidence Cards */}
      {Array.from({ length: Math.min(totalRows, 10) }, (_, i) => (
        <EvidenceCard
          key={i}
          index={i}
          totalRows={totalRows}
          isSelected={selectedRow === i}
          isFixed={fixedRows.has(i)}
          isDeleted={deletedRows.has(i)}
          issueColor={null}
          worldColor={worldColor}
        />
      ))}

      {/* Magnifying Glass */}
      <MagnifyingGlass targetY={magY} worldColor={worldColor} />

      {/* Fix Particles */}
      <FixParticles
        active={burstActive}
        position={burstPos.current}
        worldColor={worldColor}
      />
    </group>
  );
}
