'use client';

// ════════════════════════════════════════════════════
// LabStructure3D — Individual Lab 3D Structure
// ════════════════════════════════════════════════════
// Enhancement 1.1: Each lab is a distinct 3D structure on the holographic map.
// Lab 1: Neural tower, Lab 2: Training orb, Lab 3: Brain mesh,
// Lab 4: Palette prism, Lab 5: Gear assembly, Lab 6: Justice scales,
// Lab 7: Camera lens, Lab 8: Speech bubble, Lab 9: Code cube, Lab 10: Rocket
//
// Uses MeshStandardMaterial with emissive for glow.
// LOD-aware via useLOD hook. Responds to hover/focus states.

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useLOD, lodSphere } from '@/hooks/useLOD';

interface LabStructureProps {
  labId: number;
  position: [number, number, number];
  color: string;
  title: string;
  icon: string;
  isFocused: boolean;
  isHovered: boolean;
  completionPct: number; // 0-1
  onClick: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

// Lab-specific geometry generators
function useLabGeometry(labId: number, lod: ReturnType<typeof useLOD>) {
  return useMemo(() => {
    const segments = lod.segments;
    switch (labId) {
      case 1: // What IS AI? — Icosahedron (brain-like)
        return new THREE.IcosahedronGeometry(0.4, Math.min(segments / 4, 2));
      case 2: // Teaching Machines — Torus (training loop)
        return new THREE.TorusGeometry(0.35, 0.12, segments, segments * 2);
      case 3: // Neural Networks — Dodecahedron (complex structure)
        return new THREE.DodecahedronGeometry(0.38, 0);
      case 4: // Generative AI — Cone (creative prism)
        return new THREE.ConeGeometry(0.3, 0.6, segments);
      case 5: // AI Helpers — Cylinder (tool/gear)
        return new THREE.CylinderGeometry(0.25, 0.35, 0.5, segments);
      case 6: // Ethics — Octahedron (diamond/justice)
        return new THREE.OctahedronGeometry(0.4, 0);
      case 7: // Computer Vision — Sphere (lens)
        return new THREE.SphereGeometry(...lodSphere(lod, 0.38));
      case 8: // Language — Capsule-like (speech bubble)
        return new THREE.CapsuleGeometry(0.25, 0.3, Math.ceil(segments / 4), segments);
      case 9: // Build — Box (code block)
        return new THREE.BoxGeometry(0.5, 0.5, 0.5);
      case 10: // Futures — Tetrahedron (rocket/arrow)
        return new THREE.TetrahedronGeometry(0.42, 0);
      default:
        return new THREE.SphereGeometry(...lodSphere(lod, 0.35));
    }
  }, [labId, lod]);
}

export function LabStructure3D({
  labId,
  position,
  color,
  title,
  icon: _icon,
  isFocused,
  isHovered,
  completionPct,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: LabStructureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hoverScale] = useState({ current: 1 });
  const lod = useLOD({ tier: 'standard' });
  const geometry = useLabGeometry(labId, lod);

  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  // Animate rotation, scale, and glow
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Gentle rotation
    meshRef.current.rotation.y += delta * 0.3;

    // Scale spring toward target
    const targetScale = isFocused ? 1.4 : isHovered ? 1.15 : 1.0;
    hoverScale.current = THREE.MathUtils.lerp(
      hoverScale.current,
      targetScale,
      delta * 6
    );
    meshRef.current.scale.setScalar(hoverScale.current);

    // Glow pulse
    if (glowRef.current) {
      const pulse = Math.sin(Date.now() * 0.003 + labId) * 0.1 + 0.9;
      glowRef.current.scale.setScalar(hoverScale.current * 1.3 * pulse);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (isFocused ? 0.3 : isHovered ? 0.2 : 0.1) * pulse;
    }

    // Completion ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Completion ring — shows progress around the structure */}
      <mesh ref={ringRef} rotation-x={Math.PI / 2} position-y={-0.05}>
        <torusGeometry args={[0.55, 0.02, 8, 64, Math.PI * 2 * completionPct]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Background ring track */}
      <mesh rotation-x={Math.PI / 2} position-y={-0.05}>
        <torusGeometry args={[0.55, 0.01, 8, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
      </mesh>

      {/* Glow sphere behind structure */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main structure */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          onPointerEnter();
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          onPointerLeave();
          document.body.style.cursor = 'default';
        }}
      >
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isFocused ? 0.6 : isHovered ? 0.4 : 0.2}
          roughness={0.3}
          metalness={0.7}
          distort={isHovered ? 0.15 : 0.05}
          speed={2}
        />
      </mesh>

      {/* Floating base platform */}
      <mesh position-y={-0.45} rotation-x={-Math.PI / 2}>
        <cylinderGeometry args={[0.5, 0.5, 0.04, 24]} />
        <meshStandardMaterial
          color="#111118"
          emissive={color}
          emissiveIntensity={0.1}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Lab title text */}
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.12}
          color={color}
          anchorX="center"
          anchorY="bottom"
          font="/fonts/Exo2-Bold.woff"
          outlineWidth={0.005}
          outlineColor="#000000"
          maxWidth={1.2}
          textAlign="center"
        >
          {title}
        </Text>
      </Float>

      {/* Lab number badge */}
      <Text
        position={[0, -0.65, 0]}
        fontSize={0.08}
        color={threeColor}
        anchorX="center"
        anchorY="top"
        font="/fonts/Orbitron-Bold.woff"
      >
        {`LAB ${labId}`}
      </Text>

      {/* Holographic connection line to center */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -0.5, 0, -position[0], -position[1], -position[2]]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={isFocused ? 0.3 : 0.08}
          linewidth={1}
        />
      </line>
    </group>
  );
}
