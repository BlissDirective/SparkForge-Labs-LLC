'use client';

// ================================================================
// FUTURE FORGE 3D — Lab 10 (AI's Future) — v3 Enhanced 3D
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// [v3] 3D blueprint table with grid lines
// [v3] Floating skill orbs (selected vs dimmed)
// [v3] Holographic patent card (step 4, slow rotation)
// [v3] Innovation meter as 3D bar
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ENH: Grid pulse + selection burst + holographic seal + forge glow
// ================================================================

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';
import {
  Particle,
  PARTICLE_PRESETS,
  spawnParticles,
  updateParticles,
} from '@/lib/3d/gameParticles';

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
}

// ---- Instanced Particle Renderer ----

function InstancedParticles({ particles, preset }: { particles: Particle[]; preset: string }) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const presetConfig = PARTICLE_PRESETS[preset];
  const colorObj = useMemo(() => new Color(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || particles.length === 0) return;
    updateParticles(particles, delta, presetConfig);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.copy(p.position);
        dummy.scale.setScalar(p.size * (presetConfig.shrinkOnDeath ? p.life : 1));
        dummy.rotation.z = p.rotation;
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      colorObj.copy(p.color);
      meshRef.current.setColorAt(i, colorObj);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  if (particles.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial transparent depthWrite={false} />
    </instancedMesh>
  );
}

// ---- Blueprint Table with Animated Grid Pulse ----

function BlueprintTable({ innovationScore }: { innovationScore: number }) {
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
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(pts, 3));
    return geom;
  }, []);

  // ENH: Grid pulse — individual grid cells pulse with sin(distance + time)
  const gridCells = useMemo(() => {
    const cells: { x: number; z: number; dist: number }[] = [];
    const xCount = 8;
    const zCount = 6;
    const w = 4;
    const d = 3;
    for (let i = 0; i < xCount; i++) {
      for (let j = 0; j < zCount; j++) {
        const cx = ((i + 0.5) / xCount) * w - w / 2;
        const cz = ((j + 0.5) / zCount) * d - d / 2;
        const dist = Math.sqrt(cx * cx + cz * cz);
        cells.push({ x: cx, z: cz, dist });
      }
    }
    return cells;
  }, []);

  const cellRefs = useRef<(Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < gridCells.length; i++) {
      const mesh = cellRefs.current[i];
      if (!mesh) continue;
      const cell = gridCells[i];
      // Wave radiating from center
      const wave = Math.sin(cell.dist * 2.5 - t * 2.0);
      const opacity = 0.03 + Math.max(0, wave) * 0.12;
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = opacity;
    }
  });

  // ENH: Forge glow — platform emissive increases with innovationScore
  const platformRef = useRef<Mesh>(null);
  useFrame(() => {
    if (!platformRef.current) return;
    const mat = platformRef.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = 0.05 + (innovationScore / 100) * 0.6;
  });

  return (
    <group>
      {/* Table surface with forge glow */}
      <mesh ref={platformRef} position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 3]} />
        <meshStandardMaterial
          color="#1a0a2e"
          emissive="#D946EF"
          emissiveIntensity={0.05}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>
      {/* Grid lines */}
      <lineSegments geometry={lines}>
        <lineBasicMaterial color="#D946EF" transparent opacity={0.2} />
      </lineSegments>
      {/* ENH: Pulsing grid cells overlay */}
      {gridCells.map((cell, i) => (
        <mesh
          key={`cell-${i}`}
          ref={(el) => { cellRefs.current[i] = el; }}
          position={[cell.x, 0.065, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[4 / 8 - 0.02, 3 / 6 - 0.02]} />
          <meshBasicMaterial
            color="#D946EF"
            transparent
            opacity={0.03}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---- Skill Selection Burst Particles ----

function SkillSelectionBurst({
  orbPosition,
  color,
  triggerKey,
}: {
  orbPosition: Vector3;
  color: string;
  triggerKey: number; // increments on each selection
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevKey = useRef(triggerKey);

  useEffect(() => {
    if (triggerKey > prevKey.current) {
      const spawned = spawnParticles('sparkShower', orbPosition, {
        count: 20,
        colors: [color, '#FFFFFF', color],
        spread: 1.5,
        speedRange: [1.5, 3.5],
        lifeRange: [0.3, 0.7],
      });
      setParticles(spawned);
      prevKey.current = triggerKey;
    }
  }, [triggerKey, orbPosition, color]);

  return <InstancedParticles particles={particles} preset="sparkShower" />;
}

// ---- Skill Orb ----

function SkillOrb({
  skill,
  index,
  isSelected,
  totalSkills,
  onSelected,
}: {
  skill: SkillData;
  index: number;
  isSelected: boolean;
  totalSkills: number;
  onSelected?: (pos: Vector3) => void;
}) {
  const ref = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const wasSelected = useRef(isSelected);
  const [burstKey, setBurstKey] = useState(0);

  // Arrange in arc above table
  const angle = (index / (totalSkills - 1 || 1)) * Math.PI - Math.PI / 2;
  const radius = 1.8;
  const baseX = Math.cos(angle) * radius;
  const baseZ = Math.sin(angle) * 0.8;
  const baseY = 1.2;

  const orbPos = useMemo(() => new Vector3(baseX, baseY, baseZ), [baseX, baseY, baseZ]);

  // ENH: Detect selection transition → spawn burst
  useEffect(() => {
    if (isSelected && !wasSelected.current) {
      setBurstKey((k) => k + 1);
    }
    wasSelected.current = isSelected;
  }, [isSelected]);

  useFrame((state) => {
    if (!ref.current) return;
    // Bob animation
    ref.current.position.y =
      baseY + Math.sin(state.clock.elapsedTime * 1.5 + index * 0.7) * 0.08;

    const mat = ref.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = isSelected
      ? 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      : 0.05;
    mat.opacity = isSelected ? 0.95 : 0.25;

    // Glow ring
    if (glowRef.current) {
      const gMat = glowRef.current.material as MeshBasicMaterial;
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
          side={DoubleSide}
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
      {/* ENH: Selection burst particles */}
      <SkillSelectionBurst
        orbPosition={orbPos}
        color="#D946EF"
        triggerKey={burstKey}
      />
    </group>
  );
}

// ---- Holographic Seal (SparkForge emblem on patent card) ----

function HolographicSeal() {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = state.clock.elapsedTime * 0.8;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
  });

  return (
    <group ref={groupRef} position={[0.8, -0.45, 0.06]} rotation={[-0.3, 0, 0]}>
      {/* Outer torus */}
      <mesh>
        <torusGeometry args={[0.18, 0.015, 8, 24]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Inner torus — rotated */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.01, 8, 20]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFAA44"
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>
      {/* Center diamond */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={1.0}
          metalness={1.0}
          roughness={0.0}
        />
      </mesh>
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
  const groupRef = useRef<Group>(null);
  const planeRef = useRef<Mesh>(null);
  // Pre-allocate to avoid per-frame GC pressure
  const _targetScale = useMemo(() => new Vector3(), []);

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
      const mat = planeRef.current.material as MeshPhysicalMaterial;
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
          side={DoubleSide}
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
      {/* ENH: Holographic seal — rotating SparkForge emblem */}
      <HolographicSeal />
    </group>
  );
}

// ---- Problem Display ----

function ProblemDisplay({ emoji, visible }: { emoji: string; visible: boolean }) {
  const ref = useRef<Group>(null);

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
}: FutureForge3DProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 6, 3]} intensity={0.5} />
      <pointLight position={[0, 2, 0]} intensity={0.4} color="#D946EF" />

      {/* Blueprint table with animated grid pulse + forge glow */}
      <BlueprintTable innovationScore={innovationScore} />

      {/* Problem emoji (step >= 1) */}
      <ProblemDisplay emoji={problemEmoji} visible={step >= 1 && step < 4} />

      {/* Skill orbs (step >= 3) with selection burst particles */}
      {allSkills.map((skill, i) => (
        <SkillOrb
          key={skill.name}
          skill={skill}
          index={i}
          isSelected={selectedSkills.has(skill.name)}
          totalSkills={allSkills.length}
        />
      ))}

      {/* Holographic patent with seal (step 4) */}
      <HolographicPatent
        visible={step === 4}
        inventionName={inventionName}
        innovationScore={innovationScore}
      />

    </>
  );
}

// ---- Main Export ----

export default function FutureForge3D(props: FutureForge3DProps) {
  return (
    <group>
      <ForgeScene {...props} />
    </group>
  );
}
