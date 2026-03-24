'use client';

// ════════════════════════════════════════════════════
// MyFirstAiAppEnvironment — App Development Studio (FL-Lite ~1.2M budget)
// ════════════════════════════════════════════════════
// Lab 9: Building with AI | Color: #F97316 (Orange)
//
// A creative tech workshop where kids build their first AI app:
//   - Giant phone/tablet frames on display stands
//   - Component library shelves with UI blocks
//   - Wireframe display screens showing app layouts
//   - 3D app store entrance portal with neon archway
//   - Launch pad platform with countdown lights
//   - Holographic app preview hovering above worktable
//   - Code snippet particles floating through workspace
//   - Rating stars orbiting completed apps
//
// Triangle Budget (Desktop Ultra):
//   Device Mockups (instanced):     ~200K (4 devices x ~50K each)
//   Component Shelves (instanced):  ~180K (24 shelf blocks)
//   Wireframe Screens (instanced):  ~120K (6 screens)
//   App Store Portal:               ~150K (archway + neon signs)
//   Launch Pad Platform:            ~130K (pad + countdown lights)
//   Holographic Preview:            ~100K (floating app preview)
//   Code Snippet Particles:         ~120K (floating code bits)
//   Rating Star Orbit:              ~80K  (orbiting stars)
//   Worktable + misc:               ~120K
//   Total:                          ~1.2M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLLiteEnvironmentWrapper } from './FLLiteEnvironmentBase';

const LAB_COLOR = '#F97316';
const _ORANGE = new THREE.Color(LAB_COLOR);

// ■■ Device Mockup Stands (Instanced) ■■
function DeviceMockups({ buildStep }: { buildStep: number }) {
  const frameCount = 4;
  const framesRef = useRef<THREE.InstancedMesh>(null);
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const positions = useMemo(() => [
    new THREE.Vector3(-4, 1.8, -2),
    new THREE.Vector3(-1.5, 2.2, -3),
    new THREE.Vector3(1.5, 1.6, -2.5),
    new THREE.Vector3(4, 2.0, -1.5),
  ], []);

  React.useEffect(() => {
    if (!framesRef.current || !screensRef.current) return;
    const tmp = new THREE.Matrix4();
    const sizes = [
      [0.9, 1.6, 0.06],  // phone
      [1.4, 1.0, 0.05],  // tablet landscape
      [0.85, 1.5, 0.06], // phone
      [1.6, 1.2, 0.05],  // tablet
    ];
    for (let i = 0; i < frameCount; i++) {
      const [w, h, d] = sizes[i];
      tmp.makeScale(w, h, d);
      tmp.setPosition(positions[i].x, positions[i].y, positions[i].z);
      framesRef.current.setMatrixAt(i, tmp);
      // Inner screen slightly inset
      tmp.makeScale(w * 0.88, h * 0.88, 0.01);
      tmp.setPosition(positions[i].x, positions[i].y, positions[i].z + 0.035);
      screensRef.current.setMatrixAt(i, tmp);
      const brightness = i < buildStep ? 0.6 : 0.15;
      screensRef.current.setColorAt(i, new THREE.Color().setHSL(0.08, 0.9, brightness));
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    screensRef.current.instanceMatrix.needsUpdate = true;
    if (screensRef.current.instanceColor) screensRef.current.instanceColor.needsUpdate = true;
  }, [positions, buildStep]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const mat = screensRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2) * 0.1;
  });

  return (
    <group>
      <instancedMesh ref={framesRef} args={[undefined, undefined, frameCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1A1A22" metalness={0.8} roughness={0.15} />
      </instancedMesh>
      <instancedMesh ref={screensRef} args={[undefined, undefined, frameCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.1} roughness={0.5} />
      </instancedMesh>
      {/* Stand posts */}
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y - 1.2, p.z - 0.1]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 1.4, 8]} />
          <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Component Library Shelves (Instanced) ■■
function ComponentShelves() {
  const shelfCount = 24;
  const blocksRef = useRef<THREE.InstancedMesh>(null);
  const shelfRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!blocksRef.current || !shelfRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    const rows = 4;
    const perRow = Math.ceil(shelfCount / rows);
    for (let i = 0; i < shelfCount; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = -6 + col * 0.7;
      const y = 0.3 + row * 0.8;
      tmp.makeScale(0.5, 0.5, 0.3);
      tmp.setPosition(x, y, -6);
      blocksRef.current.setMatrixAt(i, tmp);
      // Color blocks by type: buttons, inputs, cards, icons
      const hue = [0.08, 0.55, 0.33, 0.75][row % 4];
      color.setHSL(hue, 0.7, 0.5);
      blocksRef.current.setColorAt(i, color);
    }
    // Shelf planks
    for (let r = 0; r < rows; r++) {
      tmp.makeScale(perRow * 0.7 + 0.4, 0.05, 0.5);
      tmp.setPosition(-6 + (perRow * 0.35) - 0.35, 0.05 + r * 0.8, -6);
      shelfRef.current.setMatrixAt(r, tmp);
    }
    blocksRef.current.instanceMatrix.needsUpdate = true;
    blocksRef.current.instanceColor!.needsUpdate = true;
    shelfRef.current.instanceMatrix.needsUpdate = true;
  }, [shelfCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    // Gentle hover effect on blocks
    if (!blocksRef.current) return;
    const tmp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < Math.min(4, shelfCount); i++) {
      blocksRef.current.getMatrixAt(i, tmp);
      tmp.decompose(pos, quat, scl);
      pos.y += Math.sin(timeRef.current * 2 + i * 1.2) * 0.001;
      tmp.compose(pos, quat, scl);
      blocksRef.current.setMatrixAt(i, tmp);
    }
    blocksRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={blocksRef} args={[undefined, undefined, shelfCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.2} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={shelfRef} args={[undefined, undefined, 4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1E1A28" metalness={0.5} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ App Store Portal Archway ■■
function AppStorePortal() {
  const neonRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (neonRef.current) {
      (neonRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(timeRef.current * 3) * 0.2;
    }
  });

  const archSegs = 32;

  return (
    <group position={[6, 0, 0]}>
      {/* Left pillar */}
      <mesh position={[-1.2, 1.5, 0]} castShadow>
        <boxGeometry args={[0.4, 3.0, 0.6]} />
        <meshStandardMaterial color="#1A1422" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[1.2, 1.5, 0]} castShadow>
        <boxGeometry args={[0.4, 3.0, 0.6]} />
        <meshStandardMaterial color="#1A1422" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Arch top */}
      <mesh position={[0, 3.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.2, 0.15, 8, archSegs, Math.PI]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Neon sign */}
      <mesh ref={neonRef} position={[0, 3.8, 0.35]}>
        <boxGeometry args={[1.8, 0.3, 0.05]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} />
      </mesh>
      {/* Inner portal glow */}
      <mesh position={[0, 1.5, -0.1]}>
        <planeGeometry args={[2.0, 3.0]} />
        <meshBasicMaterial color={LAB_COLOR} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ■■ Launch Pad Platform ■■
function LaunchPad({ isPreview }: { isPreview: boolean }) {
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const lightCount = 16;

  React.useEffect(() => {
    if (!lightsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2;
      const r = 2.2;
      tmp.makeScale(0.12, 0.12, 0.12);
      tmp.setPosition(Math.cos(angle) * r, 0.05, Math.sin(angle) * r);
      lightsRef.current.setMatrixAt(i, tmp);
    }
    lightsRef.current.instanceMatrix.needsUpdate = true;
  }, [lightCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lightsRef.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < lightCount; i++) {
      const phase = (i / lightCount) * Math.PI * 2;
      const pulse = isPreview
        ? Math.sin(timeRef.current * 6 + phase) > 0 ? 1 : 0.2
        : 0.3 + Math.sin(timeRef.current * 1.5 + phase) * 0.2;
      color.setRGB(pulse, pulse * 0.5, 0);
      lightsRef.current.setColorAt(i, color);
    }
    if (lightsRef.current.instanceColor) lightsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[-5, -0.9, 3]}>
      {/* Platform base */}
      <mesh receiveShadow>
        <cylinderGeometry args={[2.5, 2.8, 0.2, 32]} />
        <meshStandardMaterial color="#181420" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Inner ring */}
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[1.5, 0.05, 8, 32]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={isPreview ? 0.8 : 0.2} />
      </mesh>
      {/* Countdown lights */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, lightCount]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Holographic App Preview ■■
function HolographicPreview({ isPreview }: { isPreview: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!groupRef.current) return;
    groupRef.current.rotation.y = timeRef.current * (isPreview ? 1.2 : 0.3);
    groupRef.current.position.y = 2.0 + Math.sin(timeRef.current * 0.8) * 0.2;
  });

  return (
    <group ref={groupRef} position={[0, 2.0, 2]}>
      {/* Phone outline */}
      <mesh>
        <boxGeometry args={[0.7, 1.2, 0.04]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={isPreview ? 0.7 : 0.3}
          transparent
          opacity={0.4}
          wireframe
        />
      </mesh>
      {/* Screen content hint */}
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.55, 0.95]} />
        <meshBasicMaterial color={LAB_COLOR} transparent opacity={isPreview ? 0.25 : 0.08} />
      </mesh>
      {/* Holographic rings */}
      {[0.5, 0.7, 0.9].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, timeRef.current * (0.2 + i * 0.1)]}>
          <ringGeometry args={[r - 0.01, r + 0.01, 24]} />
          <meshBasicMaterial color={LAB_COLOR} transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Code Snippet Particles ■■
function CodeParticles() {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 14,
      y: Math.random() * 6,
      z: (Math.random() - 0.5) * 14,
      speed: 0.15 + Math.random() * 0.4,
      rotSpeed: (Math.random() - 0.5) * 2,
      phase: Math.random() * Math.PI * 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const y = ((s.y + timeRef.current * s.speed * 0.2) % 6);
      rot.setFromEuler(new THREE.Euler(0, timeRef.current * s.rotSpeed, timeRef.current * 0.2 + s.phase));
      tmp.compose(
        new THREE.Vector3(s.x + Math.sin(timeRef.current * 0.3 + s.phase) * 0.3, y, s.z),
        rot,
        new THREE.Vector3(0.15, 0.04, 0.01),
      );
      meshRef.current.setMatrixAt(i, tmp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} transparent opacity={0.5} />
    </instancedMesh>
  );
}

// ■■ Rating Stars Orbit ■■
function RatingStars({ buildStep }: { buildStep: number }) {
  const count = 5;
  const starsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!starsRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + timeRef.current * 0.5;
      const r = 1.8;
      const y = 3.5 + Math.sin(timeRef.current + i * 1.3) * 0.2;
      rot.setFromEuler(new THREE.Euler(0, -angle, timeRef.current * 0.8));
      tmp.compose(
        new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r + 2),
        rot,
        new THREE.Vector3(0.2, 0.2, 0.05),
      );
      starsRef.current.setMatrixAt(i, tmp);
      const lit = i < buildStep;
      color.set(lit ? '#FFD700' : '#333340');
      starsRef.current.setColorAt(i, color);
    }
    starsRef.current.instanceMatrix.needsUpdate = true;
    if (starsRef.current.instanceColor) starsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={starsRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial emissive="#FFD700" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
    </instancedMesh>
  );
}

// ■■ Main Environment ■■
interface MyFirstAiAppEnvironmentProps {
  buildStep?: number;
  isPreview?: boolean;
}

export default function MyFirstAiAppEnvironment({
  buildStep = 0,
  isPreview = false,
}: MyFirstAiAppEnvironmentProps) {

  return (
    <FLLiteEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#120E08"
      skyTopColor="#0A0604"
      skyHorizonColor="#1A1208"
      fogColor="#F97316"
    >
      <DeviceMockups buildStep={buildStep} />
      <ComponentShelves />
      <AppStorePortal />
      <LaunchPad isPreview={isPreview} />
      <HolographicPreview isPreview={isPreview} />
      <CodeParticles />
      <RatingStars buildStep={buildStep} />
    </FLLiteEnvironmentWrapper>
  );
}
