'use client';

// ════════════════════════════════════════════════════
// DynamicEnvironment — Lab-Reactive Cockpit Environment
// ════════════════════════════════════════════════════
// Enhancement 1.1: Cockpit environment shifts based on active lab.
// Lab 3 (Neural Networks) fills with floating neuron meshes,
// Lab 6 (Ethics) projects justice scale holograms, etc.
//
// Features:
// - Lab-themed floating particles (unique geometry per lab)
// - Ambient fog color shifts to lab palette
// - Reactive light color changes
// - Smooth crossfade between environments

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
// drei Instances available for future instanced rendering
import * as THREE from 'three';
import { useDeviceStore } from '@/stores/deviceStore';

const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', 2: '#AA66FF', 3: '#FF66AA', 4: '#FFAA44', 5: '#00FF88',
  6: '#FF6644', 7: '#06B6D4', 8: '#818CF8', 9: '#10B981', 10: '#D946EF',
};

interface DynamicEnvironmentProps {
  activeLabId: number | null;
  intensity?: number; // 0-1
}

// Generate floating particles with lab-specific behavior
function LabParticles({
  labId,
  color,
  count,
}: {
  labId: number;
  color: string;
  count: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-compute particle positions and velocities
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 14,
      ] as [number, number, number],
      speed: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      scale: 0.02 + Math.random() * 0.06,
      axis: i % 3, // 0=x drift, 1=y drift, 2=z drift
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    particles.forEach((p, i) => {
      const drift = Math.sin(t * p.speed + p.phase);
      dummy.position.set(
        p.position[0] + (p.axis === 0 ? drift * 0.5 : 0),
        p.position[1] + (p.axis === 1 ? drift * 0.3 : Math.sin(t * 0.2 + p.phase) * 0.1),
        p.position[2] + (p.axis === 2 ? drift * 0.5 : 0)
      );
      dummy.scale.setScalar(p.scale * (0.8 + drift * 0.2));
      dummy.rotation.y = t * p.speed;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Lab-specific geometry for particles
  const geometry = useMemo(() => {
    switch (labId) {
      case 1: return new THREE.IcosahedronGeometry(1, 0);    // AI: geometric
      case 2: return new THREE.TorusGeometry(1, 0.3, 6, 8);  // ML: loops
      case 3: return new THREE.SphereGeometry(1, 4, 4);       // NN: neurons
      case 4: return new THREE.TetrahedronGeometry(1, 0);     // Gen: crystals
      case 5: return new THREE.OctahedronGeometry(1, 0);      // Agents: gems
      case 6: return new THREE.BoxGeometry(1, 0.3, 1);        // Ethics: tiles
      case 7: return new THREE.SphereGeometry(1, 8, 8);       // Vision: orbs
      case 8: return new THREE.CapsuleGeometry(0.5, 1, 4, 8); // NLP: pills
      case 9: return new THREE.BoxGeometry(1, 1, 1);          // Code: cubes
      case 10: return new THREE.ConeGeometry(0.7, 1, 4);      // Future: arrows
      default: return new THREE.IcosahedronGeometry(1, 0);
    }
  }, [labId]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.15}
        roughness={0.6}
      />
    </instancedMesh>
  );
}

export function DynamicEnvironment({
  activeLabId,
  intensity = 0.5,
}: DynamicEnvironmentProps) {
  const ambientRef = useRef<THREE.PointLight>(null);
  const profile = useDeviceStore((s) => s.profile);

  const labColor = activeLabId ? LAB_COLORS[activeLabId] || '#00BBFF' : '#00BBFF';
  const threeColor = useMemo(() => new THREE.Color(labColor), [labColor]);

  // Smoothly transition light color
  useFrame((_, delta) => {
    if (!ambientRef.current) return;
    ambientRef.current.color.lerp(threeColor, delta * 2);
  });

  const particleCount = Math.round(
    (activeLabId ? 30 : 15) * intensity * profile.particleMultiplier
  );

  return (
    <group>
      {/* Dynamic point light that follows lab color */}
      <pointLight
        ref={ambientRef}
        position={[0, 3, 0]}
        color={labColor}
        intensity={intensity * 0.5}
        distance={15}
        decay={2}
      />

      {/* Ambient fill lights */}
      <ambientLight intensity={0.05} />
      <pointLight
        position={[5, 5, 5]}
        color="#00BBFF"
        intensity={0.15}
        distance={20}
      />
      <pointLight
        position={[-5, 3, -5]}
        color="#AA66FF"
        intensity={0.1}
        distance={20}
      />

      {/* Lab-specific floating particles */}
      {activeLabId && (
        <LabParticles
          labId={activeLabId}
          color={labColor}
          count={particleCount}
        />
      )}

      {/* Default ambient particles when no lab is focused */}
      {!activeLabId && (
        <LabParticles
          labId={1}
          color="#00BBFF"
          count={particleCount}
        />
      )}
    </group>
  );
}
