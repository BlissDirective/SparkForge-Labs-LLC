'use client';

// ================================================================
// SparkForge LEDRim — Emissive Status Strip
// ================================================================
// Decision 2.1: Part of persistent station frame
// Color = current lab accent (default #00BBFF on dashboard)
// Pulses gently, spikes on events (XP gain, badge earn, level up)

import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface LEDRimProps {
  color?: string;
  intensity?: number;
  width?: number;
  height?: number;
  spikeActive?: boolean;
}

export function LEDRim({
  color = '#00BBFF',
  intensity = 1.0,
  width = 18,
  height = 0.08,
  spikeActive = false,
}: LEDRimProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [spikeIntensity, setSpikeIntensity] = useState(0);
  const { viewport } = useThree();

  // Spike animation on events
  useEffect(() => {
    if (spikeActive) {
      setSpikeIntensity(2.0);
      const timer = setTimeout(() => setSpikeIntensity(0), 600);
      return () => clearTimeout(timer);
    }
  }, [spikeActive]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Gentle pulse: opacity oscillates 0.7-1.0 over 3s
    const pulse =
      Math.sin(clock.elapsedTime * 2.094) * 0.15 + 0.85; // 2.094 = 2PI/3
    const totalIntensity = intensity * pulse + spikeIntensity;

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.color.set(color);
    mat.opacity = Math.min(totalIntensity, 1.0);

    // Glow layer (larger, softer)
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.color.set(color);
      glowMat.opacity = Math.min(totalIntensity * 0.3, 0.5);
    }

    // Decay spike
    if (spikeIntensity > 0) {
      setSpikeIntensity((prev) => Math.max(prev - 0.05, 0));
    }
  });

  // Position at top of viewport frame
  const rimWidth = Math.min(width, viewport.width * 1.8);
  const yPos = viewport.height * 0.48;

  return (
    <group position={[0, yPos, -4]}>
      {/* Core LED strip */}
      <mesh ref={meshRef}>
        <planeGeometry args={[rimWidth, height]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          toneMapped={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Soft glow behind LED */}
      <mesh ref={glowRef} position={[0, 0, -0.1]}>
        <planeGeometry args={[rimWidth, height * 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
