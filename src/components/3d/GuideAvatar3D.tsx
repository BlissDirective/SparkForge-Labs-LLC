'use client';

// ════════════════════════════════════════════════════
// GUIDE AVATAR 3D — Phase 5: R3F avatar component
// Renders inside CockpitCanvas as a <group>
// Supports 5 avatar concepts via guideStore.avatarConcept
// ════════════════════════════════════════════════════

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useGuideStore } from '@/stores/guideStore';

interface GuideAvatar3DProps {
  position?: [number, number, number];
  scale?: number;
  labColor?: string;
}

export default function GuideAvatar3D({
  position = [2.5, 0.8, -1.5],
  scale = 0.3,
  labColor = '#00BBFF',
}: GuideAvatar3DProps) {
  const concept = useGuideStore(s => s.avatarConcept);
  const visualState = useGuideStore(s => s.visualState);
  const audioLevel = useGuideStore(s => s.audioLevel);
  const visible = useGuideStore(s => s.visible);

  if (!visible) return null;

  return (
    <group position={position} scale={scale}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {concept === 'orb' && <OrbAvatar labColor={labColor} audioLevel={audioLevel} visualState={visualState} />}
        {concept === 'fox' && <FoxAvatar labColor={labColor} audioLevel={audioLevel} visualState={visualState} />}
        {concept === 'drone' && <DroneAvatar labColor={labColor} audioLevel={audioLevel} visualState={visualState} />}
        {concept === 'spark' && <SparkAvatar labColor={labColor} audioLevel={audioLevel} visualState={visualState} />}
        {concept === 'nova' && <NovaAvatar labColor={labColor} audioLevel={audioLevel} visualState={visualState} />}
      </Float>
    </group>
  );
}

// ── Shared types ──
interface AvatarProps {
  labColor: string;
  audioLevel: number;
  visualState: string;
}

// ── Concept A: Orb Sentinel ──
function OrbAvatar({ labColor, audioLevel, visualState: _visualState }: AvatarProps) {
  const shellRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  const color = useMemo(() => new THREE.Color(labColor), [labColor]);

  useFrame((_, delta) => {
    if (shellRef.current) {
      shellRef.current.rotation.y += delta * 0.3;
    }
    if (coreRef.current) {
      const pulse = 1 + audioLevel * 0.3 + Math.sin(Date.now() * 0.003) * 0.05;
      coreRef.current.scale.setScalar(pulse);
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * (0.5 + audioLevel);
    if (ring2Ref.current) ring2Ref.current.rotation.x += delta * (0.3 + audioLevel * 0.5);
  });

  return (
    <group>
      {/* Outer shell */}
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial color={color} transparent opacity={0.15} wireframe />
      </mesh>
      {/* Inner core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2 + audioLevel * 3} />
      </mesh>
      {/* Orbital rings */}
      <mesh ref={ring1Ref} rotation={[0.5, 0, 0]}>
        <torusGeometry args={[1.3, 0.02, 8, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[0, 0.8, 0.3]}>
        <torusGeometry args={[1.1, 0.015, 8, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Platform */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.8, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ── Concept B: Prism Fox ──
function FoxAvatar({ labColor, audioLevel, visualState }: AvatarProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const color = useMemo(() => new THREE.Color(labColor), [labColor]);

  useFrame((_, delta) => {
    if (bodyRef.current) {
      // Idle breathing + audio reaction
      const breathe = Math.sin(Date.now() * 0.002) * 0.02;
      bodyRef.current.position.y = breathe;
      bodyRef.current.rotation.y += delta * 0.1 * (visualState === 'speaking' ? 2 : 1);
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Body — faceted crystal */}
      <mesh position={[0, 0, 0]}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#1A1822" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.7, 0.3]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#1A1822" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 0.78, 0.55]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3 + audioLevel * 2} />
      </mesh>
      <mesh position={[0.12, 0.78, 0.55]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3 + audioLevel * 2} />
      </mesh>
      {/* Ears — prism shapes */}
      <mesh position={[-0.2, 1.05, 0.2]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.1, 0.3, 4]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.2, 1.05, 0.2]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.1, 0.3, 4]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={1} />
      </mesh>
      {/* Chest core */}
      <mesh position={[0, 0.2, 0.4]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2 + audioLevel * 3} />
      </mesh>
      {/* Wireframe overlay */}
      <mesh position={[0, 0, 0]}>
        <dodecahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ── Concept C: Beacon Drone ──
function DroneAvatar({ labColor, audioLevel }: AvatarProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const color = useMemo(() => new THREE.Color(labColor), [labColor]);

  useFrame((_, delta) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Main body — chrome chassis */}
      <mesh>
        <cylinderGeometry args={[0.4, 0.5, 0.8, 8]} />
        <meshStandardMaterial color="#a8b5c8" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Head dome */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#a8b5c8" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Eye — iris projector */}
      <mesh position={[0, 0.5, 0.25]}>
        <ringGeometry args={[0.05, 0.12, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3 + audioLevel * 4} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 4]} />
        <meshStandardMaterial color="#a8b5c8" metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      {/* Hover thrusters */}
      {[[-0.35, -0.5, 0], [0.35, -0.5, 0], [0, -0.5, -0.35], [0, -0.5, 0.35]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.08, 0.06, 0.1, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1 + audioLevel} />
        </mesh>
      ))}
    </group>
  );
}

// ── Concept D: Spark (Crystalline Companion) ──
function SparkAvatar({ labColor, audioLevel }: AvatarProps) {
  const ref = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(labColor), [labColor]);

  useFrame(() => {
    if (ref.current) {
      const scale = 1 + audioLevel * 0.2 + Math.sin(Date.now() * 0.003) * 0.05;
      ref.current.scale.setScalar(scale);
      ref.current.rotation.y += 0.005;
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5 + audioLevel * 2} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="white" emissive={color} emissiveIntensity={3 + audioLevel * 3} />
      </mesh>
      {/* Wireframe shell */}
      <mesh>
        <icosahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial color={color} wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ── Concept E: Nova (Holographic AI) ──
function NovaAvatar({ labColor, audioLevel }: AvatarProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(labColor), [labColor]);

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * (0.5 + audioLevel);
  });

  return (
    <group>
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} emissive={color} emissiveIntensity={1 + audioLevel * 2} />
      </mesh>
      {/* Data ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.7, 0.03, 8, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      {/* Holographic scan planes */}
      {[0, Math.PI / 3, -Math.PI / 3].map((rot, i) => (
        <mesh key={i} rotation={[rot, 0, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshStandardMaterial color={color} transparent opacity={0.1 + audioLevel * 0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Point light for glow */}
      <pointLight color={labColor} intensity={1 + audioLevel * 2} distance={3} />
    </group>
  );
}
