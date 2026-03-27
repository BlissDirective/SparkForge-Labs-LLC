// ENH: Discovery particles + refraction lens + glow ring
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
// [ENH] Discovery burst particles via shared gameParticles library
// [ENH] MeshPhysicalMaterial lens with transmission/ior/clearcoat
// [ENH] Holographic glow ring with opacity pulsing
// ================================================================

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, invalidate } from "@react-three/fiber";
import {
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import {
  spawnParticles,
  updateParticles,
  PARTICLE_PRESETS,
  Particle,
} from '@/lib/3d/gameParticles';

// ■■■ Types ■■■

interface DataDetective3DProps {
  selectedRow: number | null;
  totalRows: number;
  fixedRows: Set<number>;
  deletedRows: Set<number>;
  lastFixedRow: number | null;
  worldColor: string;
}

// ■■■ Holographic Glow Ring ■■■

function HolographicGlowRing({ worldColor }: { worldColor: string }) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const mat = meshRef.current.material as MeshStandardMaterial;
    mat.opacity = 0.15 + Math.sin(t * 2.5) * 0.1;
    mat.emissiveIntensity = 0.4 + Math.sin(t * 3.0) * 0.25;
    meshRef.current.rotation.z = t * 0.3;
    invalidate();
  });

  return (
    <mesh ref={meshRef} position={[2.2, 0.4, 0.48]}>
      <torusGeometry args={[0.5, 0.015, 16, 64]} />
      <meshStandardMaterial
        color={worldColor}
        emissive="#AA66FF"
        emissiveIntensity={0.4}
        transparent
        opacity={0.2}
        side={DoubleSide}
      />
    </mesh>
  );
}

// ■■■ Discovery Burst Particles (using shared gameParticles) ■■■

function DiscoveryBurstParticles({ particles }: { particles: Particle[] }) {
  const pointsRef = useRef<THREE.Points>(null);

  const posBuffer = useMemo(() => new Float32Array(40 * 3), []);
  const colBuffer = useMemo(() => new Float32Array(40 * 3), []);

  useFrame(() => {
    if (!pointsRef.current || particles.length === 0) return;

    for (let i = 0; i < 40; i++) {
      if (i < particles.length && particles[i].life > 0) {
        const p = particles[i];
        posBuffer[i * 3] = p.position.x;
        posBuffer[i * 3 + 1] = p.position.y;
        posBuffer[i * 3 + 2] = p.position.z;
        colBuffer[i * 3] = p.color.r;
        colBuffer[i * 3 + 1] = p.color.g;
        colBuffer[i * 3 + 2] = p.color.b;
      } else {
        posBuffer[i * 3 + 1] = -100;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    invalidate();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posBuffer, 3]} count={40} />
        <bufferAttribute attach="attributes-color" args={[colBuffer, 3]} count={40} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

// ■■■ Magnifying Glass Component (ENH: refraction lens) ■■■

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
      {/* Lens (ENH: MeshPhysicalMaterial with transmission, ior, clearcoat for refraction) */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[0.34, 32]} />
        <meshPhysicalMaterial
          color="#e0e8ff"
          transparent
          opacity={0.15}
          transmission={0.7}
          roughness={0}
          metalness={0}
          clearcoat={1.0}
          clearcoatRoughness={0}
          ior={1.5}
          thickness={0.3}
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
      {/* Static glow ring behind lens */}
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

  // ENH: Discovery burst particles via shared gameParticles library
  const [discoveryParticles, setDiscoveryParticles] = useState<Particle[]>([]);
  const lastFixedRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastFixedRow !== null && lastFixedRow !== lastFixedRef.current) {
      const origin = new Vector3(2.2, 0.8 - (lastFixedRow % 10) * 0.28, 0.5);
      setDiscoveryParticles(
        spawnParticles('discoveryBurst', origin, {
          colors: ['#FFD700', '#AA66FF', '#FFFFFF'],
        })
      );
    }
    lastFixedRef.current = lastFixedRow;
  }, [lastFixedRow]);

  // Update discovery particles each frame
  useFrame((_, delta) => {
    if (discoveryParticles.length > 0) {
      updateParticles(discoveryParticles, delta, PARTICLE_PRESETS.discoveryBurst);
      // Filter dead particles
      const alive = discoveryParticles.filter((p) => p.life > 0);
      if (alive.length !== discoveryParticles.length) {
        setDiscoveryParticles(alive);
      }
    }
  });

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

      {/* Magnifying Glass (ENH: refraction lens) */}
      <MagnifyingGlass targetY={magY} worldColor={worldColor} />

      {/* ENH: Holographic glow ring with opacity pulsing */}
      <HolographicGlowRing worldColor={worldColor} />

      {/* ENH: Discovery burst particles from shared library */}
      <DiscoveryBurstParticles particles={discoveryParticles} />
    </group>
  );
}
