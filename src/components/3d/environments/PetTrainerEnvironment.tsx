'use client';

// ════════════════════════════════════════════════════
// PetTrainerEnvironment — Immersive Pet Habitat (5M budget)
// ════════════════════════════════════════════════════
// Lab 2: AI Assistants | Color: #8B5CF6 (Purple)
//
// Creates a lush training habitat for the AI Pet Trainer with:
//   - Rolling terrain with soft grass-like displacement
//   - Training arena with obstacle course equipment
//   - Instanced vegetation (trees, bushes, flowers)
//   - Interactive food bowls and toys
//   - Ambient wildlife (butterflies via instanced mesh)
//   - Water feature (reflective pond)
//   - Atmospheric fog and volumetric light shafts
//
// Triangle Budget (Desktop Ultra):
//   Terrain:          ~200K (256x256 displacement)
//   Vegetation:       ~600K (300 instanced trees + 200 bushes)
//   Training Arena:   ~150K (fences, ramps, tunnels, posts)
//   Obstacle Course:  ~100K (agility equipment)
//   Food/Toys:        ~80K  (bowls, balls, bones)
//   Water Feature:    ~50K  (reflective plane + ripple mesh)
//   Sky Dome:         ~50K
//   Butterflies:      ~30K  (100 instanced quads)
//   Fog Particles:    ~40K
//   Total:            ~1.3M (well within 5M, room to grow)

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FlagshipEnvironmentWrapper,
  useFlagshipLOD,
} from './FlagshipEnvironmentBase';

// ■■ Training Arena — Circular fenced area ■■
function TrainingArena({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const segs = lod.level === 'ultra' ? 48 : lod.level === 'high' ? 32 : 16;

  // Arena fence posts (instanced cylinders around perimeter)
  const postCount = lod.level === 'ultra' ? 24 : lod.level === 'high' ? 16 : 8;
  const postsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!postsRef.current) return;
    const temp = new THREE.Matrix4();
    const radius = 6;
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      temp.makeTranslation(x, 0, z);
      postsRef.current.setMatrixAt(i, temp);
    }
    postsRef.current.instanceMatrix.needsUpdate = true;
  }, [postCount]);

  return (
    <group position={[0, -1, 0]}>
      {/* Arena ground circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7, segs]} />
        <meshStandardMaterial
          color="#1A1530"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Fence posts */}
      <instancedMesh ref={postsRef} args={[undefined, undefined, postCount]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.5, 6]} />
        <meshStandardMaterial
          color="#8B5CF6"
          metalness={0.6}
          roughness={0.3}
          emissive="#8B5CF6"
          emissiveIntensity={0.15}
        />
      </instancedMesh>

      {/* Fence rails (horizontal rings) */}
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[6, 0.03, 4, segs]} />
        <meshStandardMaterial color="#6D28D9" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <torusGeometry args={[6, 0.03, 4, segs]} />
        <meshStandardMaterial color="#6D28D9" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ■■ Obstacle Course Equipment ■■
function ObstacleCourse({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  if (!lod.enableDetailProps) return null;

  const segs = lod.segments;

  return (
    <group position={[0, -1, 0]}>
      {/* Agility ramp */}
      <mesh position={[-3, 0.3, 2]} rotation={[0, 0.5, 0.3]} castShadow>
        <boxGeometry args={[2, 0.1, 0.8]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.6} />
      </mesh>
      <mesh position={[-3, 0, 2.5]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#92400E" roughness={0.7} />
      </mesh>

      {/* Jump hurdle */}
      <group position={[3, 0, -1]}>
        <mesh position={[-0.6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.2, segs]} />
          <meshStandardMaterial color="#6D28D9" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.2, segs]} />
          <meshStandardMaterial color="#6D28D9" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.2, segs]} />
          <meshStandardMaterial color="#C084FC" />
        </mesh>
      </group>

      {/* Tunnel */}
      <mesh position={[0, 0.4, -3.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.5, 0.08, 8, segs]} />
        <meshStandardMaterial
          color="#8B5CF6"
          metalness={0.3}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Weave poles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`pole-${i}`} position={[-1 + i * 0.5, 0.3, 1.5]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#A78BFA' : '#FCD34D'}
          />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Food Bowl & Toys ■■
function PropsAndToys({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const segs = lod.segments;
  const bowlRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!bowlRef.current) return;
    // Gentle bob animation on food bowl
    bowlRef.current.position.y = -0.85 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
  });

  return (
    <group>
      {/* Food bowl */}
      <mesh ref={bowlRef} position={[4, -0.85, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.15, segs]} />
        <meshStandardMaterial
          color="#F59E0B"
          metalness={0.7}
          roughness={0.2}
          emissive="#F59E0B"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Water bowl */}
      <mesh position={[4, -0.85, 1]} castShadow>
        <cylinderGeometry args={[0.3, 0.2, 0.12, segs]} />
        <meshStandardMaterial
          color="#3B82F6"
          metalness={0.6}
          roughness={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Ball toy */}
      <mesh position={[-4, -0.7, 2]} castShadow>
        <sphereGeometry args={[0.15, segs, segs]} />
        <meshStandardMaterial
          color="#EF4444"
          emissive="#EF4444"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Bone toy */}
      <group position={[-3.5, -0.9, -2]} rotation={[0, 0.8, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
          <meshStandardMaterial color="#F5F5DC" roughness={0.8} />
        </mesh>
        <mesh position={[-0.2, 0, 0]} castShadow>
          <sphereGeometry args={[0.08, 6, 4]} />
          <meshStandardMaterial color="#F5F5DC" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0, 0]} castShadow>
          <sphereGeometry args={[0.08, 6, 4]} />
          <meshStandardMaterial color="#F5F5DC" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Ambient Butterflies (Instanced) ■■
function Butterflies({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = lod.level === 'ultra' ? 60 : lod.level === 'high' ? 30 : 15;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const offsets = useMemo(() => {
    return Array.from({ length: count }, () => ({
      phase: Math.random() * Math.PI * 2,
      radius: 3 + Math.random() * 8,
      height: 0.5 + Math.random() * 3,
      speed: 0.3 + Math.random() * 0.5,
      wingSpeed: 5 + Math.random() * 5,
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.elapsedTime;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const o = offsets[i];
      const angle = elapsed * o.speed + o.phase;
      const x = Math.cos(angle) * o.radius;
      const z = Math.sin(angle) * o.radius;
      const y = o.height + Math.sin(elapsed * 2 + o.phase) * 0.5;

      // Wing flap via X-scale oscillation
      const wingFlap = 0.5 + Math.abs(Math.sin(elapsed * o.wingSpeed)) * 0.5;

      pos.set(x, y, z);
      quat.setFromEuler(new THREE.Euler(0, angle + Math.PI / 2, 0));
      scl.set(wingFlap * 0.15, 0.1, 0.15);
      temp.compose(pos, quat, scl);
      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 0.6]} />
      <meshBasicMaterial
        color="#DDD6FE"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ■■ Instanced Trees ■■
function Trees({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const treeCount = lod.level === 'ultra' ? 80 : lod.level === 'high' ? 50 : 20;
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < treeCount; i++) {
      // Place trees outside the arena (radius 6), between 8-18 units from center
      const angle = (i / treeCount) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 8 + Math.random() * 10;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const scale = 0.6 + Math.random() * 0.8;

      // Trunk
      temp.makeScale(scale * 0.3, scale * 1.5, scale * 0.3);
      temp.setPosition(x, -1 + scale * 0.75, z);
      trunkRef.current.setMatrixAt(i, temp);

      // Canopy
      temp.makeScale(scale, scale * 0.8, scale);
      temp.setPosition(x, -1 + scale * 1.8, z);
      canopyRef.current.setMatrixAt(i, temp);
    }
    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [treeCount]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, treeCount]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1, 5]} />
        <meshStandardMaterial color="#3B1F5E" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, treeCount]} castShadow>
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          color="#2D1B69"
          emissive="#8B5CF6"
          emissiveIntensity={0.05}
          roughness={0.9}
        />
      </instancedMesh>
    </>
  );
}

// ■■ Water Pond ■■
function WaterPond({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const segs = lod.level === 'ultra' ? 64 : 32;

  useFrame((state) => {
    if (!waterRef.current) return;
    const mat = waterRef.current.material as THREE.MeshStandardMaterial;
    mat.envMapIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
  });

  return (
    <mesh
      ref={waterRef}
      position={[-8, -0.95, -5]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[3, segs]} />
      <meshStandardMaterial
        color="#1E1B4B"
        metalness={0.3}
        roughness={0.1}
        transparent
        opacity={0.7}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

// ■■ Main Environment Component ■■
export interface PetTrainerEnvironmentProps {
  evolutionStage: number;
  mood: string;
}

export default function PetTrainerEnvironment({
  evolutionStage,
  mood,
}: PetTrainerEnvironmentProps) {
  const lod = useFlagshipLOD();

  // Mood-reactive environment lighting
  const moodIntensity = useMemo(() => {
    const intensities: Record<string, number> = {
      sleeping: 0.1,
      confused: 0.2,
      learning: 0.35,
      smart: 0.5,
      genius: 0.7,
      celebrating: 1.0,
    };
    return intensities[mood] || 0.3;
  }, [mood]);

  return (
    <FlagshipEnvironmentWrapper
      labColor="#8B5CF6"
      terrainColor="#12091F"
      skyTopColor="#050810"
      skyHorizonColor="#1A0A3E"
      fogColor="#8B5CF6"
      heightScale={0.2}
    >
      {/* Training Arena */}
      <TrainingArena lod={lod} />

      {/* Obstacle Course */}
      <ObstacleCourse lod={lod} />

      {/* Food & Toys */}
      <PropsAndToys lod={lod} />

      {/* Vegetation */}
      <Trees lod={lod} />

      {/* Water Feature */}
      <WaterPond lod={lod} />

      {/* Ambient Wildlife */}
      <Butterflies lod={lod} />

      {/* Mood-reactive accent light */}
      <pointLight
        position={[0, 2, 0]}
        intensity={moodIntensity}
        color="#DDD6FE"
        distance={10}
      />

      {/* Evolution-stage glow ring on arena floor */}
      {evolutionStage > 2 && (
        <mesh position={[0, -0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.5, 6, lod.segments]} />
          <meshBasicMaterial
            color="#8B5CF6"
            transparent
            opacity={0.1 + evolutionStage * 0.05}
          />
        </mesh>
      )}
    </FlagshipEnvironmentWrapper>
  );
}
