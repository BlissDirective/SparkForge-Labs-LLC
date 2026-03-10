'use client';

// ================================================================
// FUTURE FORGE 3D — Lab 10 (AI's Future) — v3 Enhanced 3D
// [v3] 3D blueprint table with grid lines
// [v3] Floating skill orbs (selected vs dimmed)
// [v3] Holographic patent card (step 4, slow rotation)
// [v3] Innovation meter as 3D bar
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ================================================================

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ---- Types ----

interface SkillData {
  name: string;
  emoji: string;
}

interface FutureForge3DProps {
  step: number;
  selectedSkills: Set<string>;
  allSkills: SkillData[];
  problemEmoji: string;
  inventionName: string;
  innovationScore: number;
  isMobile?: boolean;
}

// ---- Blueprint Table ----

function BlueprintTable() {
  const lines = useMemo(() => {
    const pts: number[] = [];
    const xCount = 8;
    const zCount = 6;
    const w = 4;
    const d = 3;
    for (let i = 0; i <= xCount; i++) {
      const x = (i / xCount) * w - w / 2;
      pts.push(x, 0.06, -d / 2, x, 0.06, d / 2);
    }
    for (let j = 0; j <= zCount; j++) {
      const z = (j / zCount) * d - d / 2;
      pts.push(-w / 2, 0.06, z, w / 2, 0.06, z);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  }, []);

  return (
    <group>
      {/* Table surface */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 3]} />
        <meshStandardMaterial color="#1a0a2e" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Grid lines */}
      <lineSegments geometry={lines}>
        <lineBasicMaterial color="#D946EF" transparent opacity={0.2} />
      </lineSegments>
    </group>
  );
}

// ---- Skill Orb ----

function SkillOrb({
  skill,
  index,
  isSelected,
  totalSkills,
}: {
  skill: SkillData;
  index: number;
  isSelected: boolean;
  totalSkills: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Arrange in arc above table
  const angle = (index / (totalSkills - 1 || 1)) * Math.PI - Math.PI / 2;
  const radius = 1.8;
  const baseX = Math.cos(angle) * radius;
  const baseZ = Math.sin(angle) * 0.8;
  const baseY = 1.2;

  useFrame((state) => {
    if (!ref.current) return;
    // Bob animation
    ref.current.position.y =
      baseY + Math.sin(state.clock.elapsedTime * 1.5 + index * 0.7) * 0.08;

    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isSelected
      ? 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      : 0.05;
    mat.opacity = isSelected ? 0.95 : 0.25;

    // Glow ring
    if (glowRef.current) {
      const gMat = glowRef.current.material as THREE.MeshBasicMaterial;
      gMat.opacity = isSelected
        ? 0.3 + Math.sin(state.clock.elapsedTime * 4 + index) * 0.1
        : 0;
    }
  });

  return (
    <group position={[baseX, baseY, baseZ]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial
          color={isSelected ? '#D946EF' : '#444444'}
          emissive="#D946EF"
          emissiveIntensity={0.05}
          transparent
          opacity={0.25}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {/* Glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.3, 16]} />
        <meshBasicMaterial
          color="#D946EF"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Emoji label */}
      <Text
        position={[0, -0.35, 0]}
        fontSize={0.09}
        color={isSelected ? '#D946EF' : 'rgba(255,255,255,0.3)'}
        anchorX="center"
        anchorY="top"
      >
        {skill.name}
      </Text>
    </group>
  );
}

// ---- Holographic Patent ----

function HolographicPatent({
  visible,
  inventionName,
  innovationScore,
}: {
  visible: boolean;
  inventionName: string;
  innovationScore: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  // Pre-allocate to avoid per-frame GC pressure
  const _targetScale = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Slow rotation
    groupRef.current.rotation.y += delta * 0.3;
    // Scale in
    const s = visible ? 1 : 0.001;
    _targetScale.set(s, s, s);
    groupRef.current.scale.lerp(_targetScale, delta * 3);
    // Holographic shimmer
    if (planeRef.current) {
      const mat = planeRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = visible
        ? 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1
        : 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.8, 0]} scale={[0.001, 0.001, 0.001]}>
      {/* Patent card plane */}
      <mesh ref={planeRef} rotation={[-0.3, 0, 0]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshPhysicalMaterial
          color="#2a0a4e"
          emissive="#D946EF"
          emissiveIntensity={0.2}
          transparent
          opacity={0.7}
          transmission={0.3}
          clearcoat={1.0}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Title */}
      <Text
        position={[0, 0.35, 0.02]}
        fontSize={0.12}
        color="#D946EF"
        anchorX="center"
        anchorY="middle"
        rotation={[-0.3, 0, 0]}
      >
        PATENT APPROVED
      </Text>
      {/* Invention name */}
      <Text
        position={[0, 0.05, 0.02]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        rotation={[-0.3, 0, 0]}
        maxWidth={2}
      >
        {inventionName || 'Untitled'}
      </Text>
      {/* Innovation score */}
      <Text
        position={[0, -0.3, 0.02]}
        fontSize={0.1}
        color={innovationScore >= 80 ? '#10B981' : '#FBBF24'}
        anchorX="center"
        anchorY="middle"
        rotation={[-0.3, 0, 0]}
      >
        {`Innovation: ${innovationScore}/100`}
      </Text>
    </group>
  );
}

// ---- Problem Display ----

function ProblemDisplay({ emoji, visible }: { emoji: string; visible: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    ref.current.scale.setScalar(visible ? 1.2 : 0.001);
  });

  return (
    <group ref={ref} position={[0, 0.8, 0]}>
      <Text fontSize={0.4} anchorX="center" anchorY="middle">
        {emoji}
      </Text>
    </group>
  );
}

// ---- Scene ----

function ForgeScene({
  step,
  selectedSkills,
  allSkills,
  problemEmoji,
  inventionName,
  innovationScore,
}: Omit<FutureForge3DProps, 'isMobile'>) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 6, 3]} intensity={0.5} />
      <pointLight position={[0, 2, 0]} intensity={0.4} color="#D946EF" />

      {/* Blueprint table */}
      <BlueprintTable />

      {/* Problem emoji (step >= 1) */}
      <ProblemDisplay emoji={problemEmoji} visible={step >= 1 && step < 4} />

      {/* Skill orbs (step >= 3) */}
      {allSkills.map((skill, i) => (
        <SkillOrb
          key={skill.name}
          skill={skill}
          index={i}
          isSelected={selectedSkills.has(skill.name)}
          totalSkills={allSkills.length}
        />
      ))}

      {/* Holographic patent (step 4) */}
      <HolographicPatent
        visible={step === 4}
        inventionName={inventionName}
        innovationScore={innovationScore}
      />

      <Environment preset="night" />

      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ---- Main Export ----

export default function FutureForge3D(props: FutureForge3DProps) {
  if (props.isMobile) return null;

  return (
    <div
      style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 4, 4], fov: 45 }}
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0.5, 0);
        }}
      >
        <ForgeScene {...props} />
      </Canvas>
    </div>
  );
}
