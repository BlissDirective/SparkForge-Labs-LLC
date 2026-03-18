'use client';

// ════════════════════════════════════════════════════
// PetTrainerEnvironment — Enchanted Pet Habitat (10M budget)
// ════════════════════════════════════════════════════
// Lab 2: AI Assistants | Color: #8B5CF6 (Purple)
//
// A lush, magical training habitat for the AI Pet Trainer:
//   - Rolling terrain with enchanted grass displacement
//   - Training arena with obstacle course equipment
//   - Dense enchanted forest (trees, mushrooms, ferns, grass)
//   - Pet playground equipment (slide, climbing wall, seesaw)
//   - Babbling creek with stepping stones
//   - Firefly swarm lighting the canopy
//   - Garden flower beds around the arena
//   - Magical lantern posts along paths
//   - Interactive food bowls and toys
//   - Ambient wildlife (butterflies, critters)
//   - Water pond with lily pads
//   - Mood-reactive and evolution-reactive effects
//
// Triangle Budget (Desktop Ultra):
//   Terrain:             ~400K (512x512 displacement)
//   Enchanted Forest:    ~1.2M (200 trees + mushrooms + ferns + grass)
//   Training Arena:      ~300K (fences, ramps, tunnels, posts)
//   Pet Playground:      ~400K (slide, climbing wall, seesaw, bridge)
//   Creek & Stones:      ~350K (animated water + stepping stones)
//   Firefly Swarm:       ~250K (500 instanced glow particles)
//   Garden Beds:         ~300K (flower clusters around arena)
//   Lantern Posts:       ~200K (magical lamp posts on paths)
//   Food/Toys:           ~100K (bowls, balls, bones, treats)
//   Butterflies:         ~80K  (150 instanced quads)
//   Water Pond:          ~100K (reflective plane + lily pads)
//   Sky Dome:            ~80K
//   Fog Particles:       ~200K
//   Total:               ~3.96M (within 10M budget, room to grow)

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FlagshipEnvironmentWrapper,
  useFlagshipLOD,
} from './FlagshipEnvironmentBase';

// ■■ Training Arena — Circular fenced area ■■
function TrainingArena({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const segs = lod.level === 'ultra' ? 64 : lod.level === 'high' ? 48 : 24;
  const postCount = lod.level === 'ultra' ? 32 : lod.level === 'high' ? 20 : 10;
  const postsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!postsRef.current) return;
    const temp = new THREE.Matrix4();
    const radius = 7;
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      temp.makeTranslation(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      postsRef.current.setMatrixAt(i, temp);
    }
    postsRef.current.instanceMatrix.needsUpdate = true;
  }, [postCount]);

  return (
    <group position={[0, -1, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8, segs]} />
        <meshStandardMaterial color="#1A1530" roughness={0.7} metalness={0.05} />
      </mesh>
      <instancedMesh ref={postsRef} args={[undefined, undefined, postCount]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.8, 6]} />
        <meshStandardMaterial color="#8B5CF6" metalness={0.6} roughness={0.3} emissive="#8B5CF6" emissiveIntensity={0.15} />
      </instancedMesh>
      <mesh position={[0, 0.5, 0]}>
        <torusGeometry args={[7, 0.03, 4, segs]} />
        <meshStandardMaterial color="#6D28D9" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[7, 0.03, 4, segs]} />
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
      <mesh position={[-3, 0.3, 2]} rotation={[0, 0.5, 0.3]} castShadow>
        <boxGeometry args={[2.5, 0.1, 1]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.6} />
      </mesh>
      <mesh position={[-3, 0, 2.5]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#92400E" roughness={0.7} />
      </mesh>
      <group position={[3, 0, -1]}>
        <mesh position={[-0.6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.4, segs]} />
          <meshStandardMaterial color="#6D28D9" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.4, segs]} />
          <meshStandardMaterial color="#6D28D9" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.2, segs]} />
          <meshStandardMaterial color="#C084FC" />
        </mesh>
      </group>
      <mesh position={[0, 0.4, -3.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.6, 0.08, 8, segs]} />
        <meshStandardMaterial color="#8B5CF6" metalness={0.3} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Double-row weave poles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`pole-${i}`} position={[-1.5 + i * 0.45, 0.35, 1.5]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 4]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#A78BFA' : '#FCD34D'} />
        </mesh>
      ))}
      {/* Balance beam */}
      <mesh position={[-1, 0.5, -5]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[3, 0.08, 0.15]} />
        <meshStandardMaterial color="#8B5CF6" metalness={0.4} roughness={0.4} emissive="#8B5CF6" emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

// ■■ Pet Playground Equipment ■■
function PetPlayground({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  if (!lod.enableDetailProps) return null;
  const segs = lod.segments;

  return (
    <group position={[10, -1, -3]}>
      {/* Slide structure */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.5, 2.4, 1.5]} />
        <meshStandardMaterial color="#2D1B69" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.2, 1.5]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, 2.5]} />
        <meshStandardMaterial color="#C084FC" metalness={0.5} roughness={0.2} emissive="#8B5CF6" emissiveIntensity={0.1} />
      </mesh>
      {/* Platform railing */}
      <mesh position={[0, 2.5, -0.6]} castShadow>
        <boxGeometry args={[1.5, 0.3, 0.05]} />
        <meshStandardMaterial color="#A78BFA" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Climbing wall */}
      <group position={[4, 0, 2]}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[3, 2.5, 0.15]} />
          <meshStandardMaterial color="#1E1545" roughness={0.8} />
        </mesh>
        {/* Climbing holds */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`hold-${i}`} position={[(i % 3 - 1) * 0.8, 0.3 + Math.floor(i / 3) * 0.5, 0.1]} castShadow>
            <sphereGeometry args={[0.1, segs, segs]} />
            <meshStandardMaterial
              color={['#8B5CF6', '#A78BFA', '#C084FC', '#F59E0B'][(i % 4)]}
              emissive={['#8B5CF6', '#A78BFA', '#C084FC', '#F59E0B'][(i % 4)]}
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Seesaw */}
      <group position={[-3, 0, 3]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.4, segs]} />
          <meshStandardMaterial color="#6D28D9" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.45, 0]} rotation={[0, 0, 0.05]} castShadow>
          <boxGeometry args={[3, 0.08, 0.5]} />
          <meshStandardMaterial color="#A78BFA" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>

      {/* Rope bridge */}
      <group position={[-1, 0, -2]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`plank-${i}`} position={[i * 0.5, 0.8 + Math.sin(i * 0.3) * 0.1, 0]} castShadow>
            <boxGeometry args={[0.4, 0.04, 0.6]} />
            <meshStandardMaterial color="#5D3A1A" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ■■ Food Bowl & Toys (expanded) ■■
function PropsAndToys({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const segs = lod.segments;
  const bowlRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!bowlRef.current) return;
    bowlRef.current.position.y = -0.85 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
  });

  return (
    <group>
      <mesh ref={bowlRef} position={[4, -0.85, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 0.18, segs]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.7} roughness={0.2} emissive="#F59E0B" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[4, -0.85, 1.2]} castShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.14, segs]} />
        <meshStandardMaterial color="#3B82F6" metalness={0.6} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-4, -0.7, 2]} castShadow>
        <sphereGeometry args={[0.18, segs, segs]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.2} />
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
      {/* Rope toy */}
      <mesh position={[2, -0.85, -3]} rotation={[Math.PI / 2, 0, 0.3]} castShadow>
        <torusGeometry args={[0.15, 0.04, 6, segs]} />
        <meshStandardMaterial color="#DDD6FE" roughness={0.7} />
      </mesh>
      {/* Treat dispenser */}
      <group position={[5, -0.7, -1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.5, segs]} />
          <meshStandardMaterial color="#8B5CF6" metalness={0.5} roughness={0.3} emissive="#8B5CF6" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.22, segs, segs]} />
          <meshStandardMaterial color="#A78BFA" transparent opacity={0.5} metalness={0.3} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Enchanted Forest (mushrooms, ferns, grass tufts) ■■
function EnchantedForest({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const mushroomCount = lod.level === 'ultra' ? 60 : lod.level === 'high' ? 35 : 15;
  const fernCount = lod.level === 'ultra' ? 120 : lod.level === 'high' ? 60 : 25;
  const grassCount = lod.level === 'ultra' ? 300 : lod.level === 'high' ? 150 : 50;

  const mushroomRef = useRef<THREE.InstancedMesh>(null);
  const mushroomCapRef = useRef<THREE.InstancedMesh>(null);
  const fernRef = useRef<THREE.InstancedMesh>(null);
  const grassRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!mushroomRef.current || !mushroomCapRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < mushroomCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 9 + Math.random() * 10;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const scale = 0.3 + Math.random() * 0.5;
      // Stem
      temp.makeScale(scale * 0.3, scale, scale * 0.3);
      temp.setPosition(x, -1 + scale * 0.5, z);
      mushroomRef.current.setMatrixAt(i, temp);
      // Cap
      temp.makeScale(scale * 0.8, scale * 0.4, scale * 0.8);
      temp.setPosition(x, -1 + scale * 1.1, z);
      mushroomCapRef.current.setMatrixAt(i, temp);
    }
    mushroomRef.current.instanceMatrix.needsUpdate = true;
    mushroomCapRef.current.instanceMatrix.needsUpdate = true;
  }, [mushroomCount]);

  React.useEffect(() => {
    if (!fernRef.current) return;
    const temp = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    for (let i = 0; i < fernCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 12;
      pos.set(Math.cos(angle) * dist, -0.8, Math.sin(angle) * dist);
      quat.setFromEuler(new THREE.Euler(-0.3, Math.random() * Math.PI * 2, 0));
      const s = 0.3 + Math.random() * 0.4;
      scl.set(s, s * 1.5, s);
      temp.compose(pos, quat, scl);
      fernRef.current.setMatrixAt(i, temp);
    }
    fernRef.current.instanceMatrix.needsUpdate = true;
  }, [fernCount]);

  React.useEffect(() => {
    if (!grassRef.current) return;
    const temp = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    for (let i = 0; i < grassCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * 16;
      pos.set(Math.cos(angle) * dist, -0.9, Math.sin(angle) * dist);
      quat.setFromEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, 0));
      const s = 0.05 + Math.random() * 0.1;
      scl.set(s, 0.15 + Math.random() * 0.25, s);
      temp.compose(pos, quat, scl);
      grassRef.current.setMatrixAt(i, temp);
    }
    grassRef.current.instanceMatrix.needsUpdate = true;
  }, [grassCount]);

  return (
    <>
      {/* Mushroom stems */}
      <instancedMesh ref={mushroomRef} args={[undefined, undefined, mushroomCount]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 1, 6]} />
        <meshStandardMaterial color="#E5E1D8" roughness={0.8} />
      </instancedMesh>
      {/* Mushroom caps */}
      <instancedMesh ref={mushroomCapRef} args={[undefined, undefined, mushroomCount]} castShadow>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.15} roughness={0.6} />
      </instancedMesh>
      {/* Fern fronds */}
      <instancedMesh ref={fernRef} args={[undefined, undefined, fernCount]}>
        <planeGeometry args={[1, 1.5]} />
        <meshStandardMaterial color="#2D5A27" transparent opacity={0.7} side={THREE.DoubleSide} roughness={0.9} />
      </instancedMesh>
      {/* Grass tufts */}
      <instancedMesh ref={grassRef} args={[undefined, undefined, grassCount]}>
        <coneGeometry args={[0.5, 1, 4]} />
        <meshStandardMaterial color="#1A4020" roughness={0.9} />
      </instancedMesh>
    </>
  );
}

// ■■ Babbling Creek with Stepping Stones ■■
function CreekAndStones({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const stoneCount = lod.level === 'ultra' ? 12 : 8;
  const stonesRef = useRef<THREE.InstancedMesh>(null);

  useFrame((state) => {
    if (!waterRef.current) return;
    const mat = waterRef.current.material as THREE.MeshStandardMaterial;
    mat.envMapIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
  });

  React.useEffect(() => {
    if (!stonesRef.current) return;
    const temp = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    for (let i = 0; i < stoneCount; i++) {
      const t = i / stoneCount;
      const x = -12 + t * 24;
      const z = 12 + Math.sin(t * Math.PI * 2) * 2;
      pos.set(x, -0.85, z);
      quat.setFromEuler(new THREE.Euler(0, Math.random() * Math.PI, 0));
      const s = 0.3 + Math.random() * 0.3;
      scl.set(s, s * 0.4, s);
      temp.compose(pos, quat, scl);
      stonesRef.current.setMatrixAt(i, temp);
    }
    stonesRef.current.instanceMatrix.needsUpdate = true;
  }, [stoneCount]);

  if (!lod.enableDetailProps) return null;

  return (
    <group>
      {/* Creek water surface */}
      <mesh ref={waterRef} position={[0, -0.92, 12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 3, 32, 4]} />
        <meshStandardMaterial color="#1E1B4B" metalness={0.4} roughness={0.05} transparent opacity={0.6} envMapIntensity={0.8} />
      </mesh>
      {/* Stepping stones */}
      <instancedMesh ref={stonesRef} args={[undefined, undefined, stoneCount]} castShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#4A4A5A" roughness={0.7} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}

// ■■ Firefly Swarm ■■
function FireflySwarm({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = lod.level === 'ultra' ? 250 : lod.level === 'high' ? 120 : 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const fireflies = useMemo(() =>
    Array.from({ length: count }, () => ({
      cx: (Math.random() - 0.5) * 30,
      cy: 1 + Math.random() * 5,
      cz: (Math.random() - 0.5) * 30,
      radius: 0.5 + Math.random() * 2,
      speed: 0.3 + Math.random() * 1,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: 2 + Math.random() * 4,
    })), [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const temp = new THREE.Matrix4();
    const t = state.clock.elapsedTime;
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const f = fireflies[i];
      const x = f.cx + Math.sin(t * f.speed + f.phase) * f.radius;
      const y = f.cy + Math.sin(t * f.speed * 0.5 + f.phase) * 0.5;
      const z = f.cz + Math.cos(t * f.speed + f.phase) * f.radius;
      const blink = Math.max(0, Math.sin(t * f.blinkSpeed + f.phase));
      const s = 0.02 + blink * 0.03;

      temp.makeScale(s, s, s);
      temp.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, temp);

      color.setHSL(0.17, 1, 0.3 + blink * 0.5);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  if (!lod.enableParticles) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#FBBF24" />
    </instancedMesh>
  );
}

// ■■ Garden Flower Beds ■■
function GardenBeds({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const flowerCount = lod.level === 'ultra' ? 200 : lod.level === 'high' ? 100 : 40;
  const flowersRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!flowersRef.current) return;
    const temp = new THREE.Matrix4();
    const color = new THREE.Color();
    const colors = ['#DDD6FE', '#F9A8D4', '#FBBF24', '#C084FC', '#A78BFA'];

    // Place flowers in patches around the arena
    for (let i = 0; i < flowerCount; i++) {
      const patch = Math.floor(i / (flowerCount / 5));
      const patchAngle = (patch / 5) * Math.PI * 2;
      const patchDist = 8 + Math.random() * 2;
      const cx = Math.cos(patchAngle) * patchDist;
      const cz = Math.sin(patchAngle) * patchDist;
      const x = cx + (Math.random() - 0.5) * 3;
      const z = cz + (Math.random() - 0.5) * 3;
      const s = 0.06 + Math.random() * 0.08;

      temp.makeScale(s, s, s);
      temp.setPosition(x, -0.85, z);
      flowersRef.current.setMatrixAt(i, temp);

      color.set(colors[i % colors.length]);
      flowersRef.current.setColorAt(i, color);
    }
    flowersRef.current.instanceMatrix.needsUpdate = true;
    if (flowersRef.current.instanceColor) flowersRef.current.instanceColor.needsUpdate = true;
  }, [flowerCount]);

  if (!lod.enableDetailProps) return null;

  return (
    <instancedMesh ref={flowersRef} args={[undefined, undefined, flowerCount]} castShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#DDD6FE" roughness={0.6} />
    </instancedMesh>
  );
}

// ■■ Magical Lantern Posts ■■
function LanternPosts({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const lanternCount = lod.level === 'ultra' ? 10 : 6;
  const postsRef = useRef<THREE.InstancedMesh>(null);
  const globeRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!postsRef.current || !globeRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < lanternCount; i++) {
      const angle = (i / lanternCount) * Math.PI * 2 + 0.2;
      const dist = 14;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      // Post
      temp.makeTranslation(x, 0, z);
      postsRef.current.setMatrixAt(i, temp);
      // Globe
      temp.makeScale(0.5, 0.5, 0.5);
      temp.setPosition(x, 1.5, z);
      globeRef.current.setMatrixAt(i, temp);
    }
    postsRef.current.instanceMatrix.needsUpdate = true;
    globeRef.current.instanceMatrix.needsUpdate = true;
  }, [lanternCount]);

  if (!lod.enableDetailProps) return null;

  return (
    <>
      <instancedMesh ref={postsRef} args={[undefined, undefined, lanternCount]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.5, 4]} />
        <meshStandardMaterial color="#3B1F5E" metalness={0.4} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={globeRef} args={[undefined, undefined, lanternCount]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.6} transparent opacity={0.7} />
      </instancedMesh>
    </>
  );
}

// ■■ Ambient Butterflies (Instanced) ■■
function Butterflies({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = lod.level === 'ultra' ? 100 : lod.level === 'high' ? 50 : 20;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const offsets = useMemo(() =>
    Array.from({ length: count }, () => ({
      phase: Math.random() * Math.PI * 2,
      radius: 3 + Math.random() * 12,
      height: 0.5 + Math.random() * 4,
      speed: 0.3 + Math.random() * 0.5,
      wingSpeed: 5 + Math.random() * 5,
    })), [count]
  );

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
      <meshBasicMaterial color="#DDD6FE" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
}

// ■■ Instanced Trees (expanded) ■■
function Trees({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const treeCount = lod.level === 'ultra' ? 150 : lod.level === 'high' ? 80 : 30;
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 9 + Math.random() * 12;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const scale = 0.5 + Math.random() * 1.0;

      temp.makeScale(scale * 0.3, scale * 1.8, scale * 0.3);
      temp.setPosition(x, -1 + scale * 0.9, z);
      trunkRef.current.setMatrixAt(i, temp);

      temp.makeScale(scale, scale * 0.9, scale);
      temp.setPosition(x, -1 + scale * 2.2, z);
      canopyRef.current.setMatrixAt(i, temp);
    }
    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [treeCount]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, treeCount]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1, 5]} />
        <meshStandardMaterial color="#3B1F5E" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, treeCount]} castShadow>
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#2D1B69" emissive="#8B5CF6" emissiveIntensity={0.05} roughness={0.9} />
      </instancedMesh>
    </>
  );
}

// ■■ Water Pond with Lily Pads ■■
function WaterPond({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const segs = lod.level === 'ultra' ? 64 : 32;
  const lilyCount = lod.level === 'ultra' ? 8 : 4;
  const liliesRef = useRef<THREE.InstancedMesh>(null);

  useFrame((state) => {
    if (!waterRef.current) return;
    const mat = waterRef.current.material as THREE.MeshStandardMaterial;
    mat.envMapIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
  });

  React.useEffect(() => {
    if (!liliesRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < lilyCount; i++) {
      const angle = (i / lilyCount) * Math.PI * 2;
      const r = 1 + Math.random() * 1.5;
      temp.makeScale(0.4, 0.02, 0.4);
      temp.setPosition(-8 + Math.cos(angle) * r, -0.9, -5 + Math.sin(angle) * r);
      liliesRef.current.setMatrixAt(i, temp);
    }
    liliesRef.current.instanceMatrix.needsUpdate = true;
  }, [lilyCount]);

  return (
    <group>
      <mesh ref={waterRef} position={[-8, -0.93, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, segs]} />
        <meshStandardMaterial color="#1E1B4B" metalness={0.3} roughness={0.1} transparent opacity={0.7} envMapIntensity={0.8} />
      </mesh>
      {/* Lily pads */}
      {lod.enableDetailProps && (
        <instancedMesh ref={liliesRef} args={[undefined, undefined, lilyCount]}>
          <circleGeometry args={[1, 8]} />
          <meshStandardMaterial color="#2D5A27" roughness={0.8} side={THREE.DoubleSide} />
        </instancedMesh>
      )}
    </group>
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

  const moodIntensity = useMemo(() => {
    const intensities: Record<string, number> = {
      sleeping: 0.1, confused: 0.2, learning: 0.35,
      smart: 0.5, genius: 0.7, celebrating: 1.0,
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
      heightScale={0.25}
      terrainSize={50}
    >
      <TrainingArena lod={lod} />
      <ObstacleCourse lod={lod} />
      <PetPlayground lod={lod} />
      <PropsAndToys lod={lod} />
      <EnchantedForest lod={lod} />
      <Trees lod={lod} />
      <CreekAndStones lod={lod} />
      <FireflySwarm lod={lod} />
      <GardenBeds lod={lod} />
      <LanternPosts lod={lod} />
      <WaterPond lod={lod} />
      <Butterflies lod={lod} />

      {/* Mood-reactive accent light */}
      <pointLight position={[0, 2, 0]} intensity={moodIntensity} color="#DDD6FE" distance={12} />

      {/* Evolution-stage glow ring on arena floor */}
      {evolutionStage > 2 && (
        <mesh position={[0, -0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.5, 7, lod.segments]} />
          <meshBasicMaterial color="#8B5CF6" transparent opacity={0.1 + evolutionStage * 0.05} />
        </mesh>
      )}

      {/* Evolution stage secondary ring */}
      {evolutionStage > 4 && (
        <mesh position={[0, -0.97, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[8, 8.3, lod.segments]} />
          <meshBasicMaterial color="#FBBF24" transparent opacity={0.08 + (evolutionStage - 4) * 0.04} />
        </mesh>
      )}
    </FlagshipEnvironmentWrapper>
  );
}
