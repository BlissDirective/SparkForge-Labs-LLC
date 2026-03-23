'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles, Ring } from '@react-three/drei';
import * as THREE from 'three';

interface LoginPortal3DProps {
  portalColor?: string;
  intensity?: number;
  isHovered?: boolean;
}

export default function LoginPortal3D({
  portalColor = '#AA66FF',
  intensity = 1.0,
  isHovered = false,
}: LoginPortal3DProps) {
  const portalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const portalColorObj = useMemo(() => new THREE.Color(portalColor), [portalColor]);
  const secondaryColor = useMemo(() => new THREE.Color('#00BBFF'), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate outer ring slowly
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.15;
      ringRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }

    // Counter-rotate inner ring
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 0.25;
      innerRingRef.current.rotation.y = Math.cos(t * 0.08) * 0.15;
    }

    // Pulse portal distortion on hover
    if (portalRef.current) {
      const scale = isHovered ? 1.05 + Math.sin(t * 3) * 0.03 : 1.0;
      portalRef.current.scale.setScalar(scale);
    }

    // Animate glow intensity
    if (glowRef.current) {
      glowRef.current.intensity = (isHovered ? 3.0 : 1.5) + Math.sin(t * 2) * 0.5;
    }
  });

  return (
    <group position={[0, 0, -2]}>
      {/* Central portal sphere with distortion */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh ref={portalRef}>
          <icosahedronGeometry args={[1.2, 4]} />
          <MeshDistortMaterial
            color={portalColorObj}
            emissive={portalColorObj}
            emissiveIntensity={0.4 * intensity}
            roughness={0.1}
            metalness={0.8}
            distort={isHovered ? 0.5 : 0.3}
            speed={2}
            transparent
            opacity={0.85}
          />
        </mesh>
      </Float>

      {/* Outer chrome ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[2.0, 0.06, 16, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={secondaryColor}
          emissiveIntensity={0.3}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Inner energy ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[1.5, 0.04, 16, 48]} />
        <meshStandardMaterial
          color={portalColorObj}
          emissive={portalColorObj}
          emissiveIntensity={0.6}
          metalness={0.7}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Decorative ring segments */}
      {[0, 1, 2, 3].map((i) => (
        <Ring
          key={i}
          args={[1.7 + i * 0.15, 1.75 + i * 0.15, 32]}
          rotation={[0, 0, (i * Math.PI) / 4]}
          position={[0, 0, -0.1 * i]}
        >
          <meshStandardMaterial
            color="#ffffff"
            emissive={portalColorObj}
            emissiveIntensity={0.2}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.3}
          />
        </Ring>
      ))}

      {/* Sparkle particles around portal */}
      <Sparkles
        count={60}
        scale={5}
        size={2}
        speed={0.4}
        color={portalColor}
        opacity={0.6}
      />

      {/* Portal glow light */}
      <pointLight
        ref={glowRef}
        color={portalColor}
        intensity={1.5}
        distance={8}
        decay={2}
      />

      {/* Ambient fill */}
      <pointLight
        color="#00BBFF"
        intensity={0.3}
        position={[3, 2, 1]}
        distance={10}
      />
    </group>
  );
}
