'use client';

// ================================================================
// CPA v1.0 — StatusBar3D: 3D Gauge-Style Bottom Status Strip
// ================================================================
// Bottom 5% of viewport: XP bar, streak, session time, lab progress, alerts.
// Renders as 3D gauge elements using ConsoleBase + EmissiveGlow materials.
// Triangle budget: ~200-300 tris
//
// Data binding:
// - XP, streak: from childStore
// - Session time: from useSessionTracker
// - Lab progress: from useProgress
// - Alerts: derived from toast events

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface StatusBarProps {
  xp: number;
  xpMax: number;
  streak: number;
  sessionTime: number;        // seconds
  labProgress: { done: number; total: number };
  labColor: string;
  opacity: number;
}

export function StatusBar3D({
  xp,
  xpMax,
  labColor,
  opacity,
}: StatusBarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const xpFillRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const labColorObj = useMemo(() => new THREE.Color(labColor), [labColor]);
  const xpRatio = xpMax > 0 ? Math.min(xp / xpMax, 1.0) : 0;

  // Animate XP bar fill
  const currentFill = useRef(xpRatio);

  useFrame(() => {
    // Lerp XP fill for smooth animation
    currentFill.current = THREE.MathUtils.lerp(currentFill.current, xpRatio, 0.05);

    if (xpFillRef.current) {
      xpFillRef.current.scale.x = Math.max(currentFill.current, 0.001);
      xpFillRef.current.position.x = -(1 - currentFill.current) * 2; // slide left
    }
  });

  if (opacity <= 0) return null;

  const barWidth = Math.min(viewport.width * 0.8, 12);
  const yPos = -viewport.height * 0.45;

  return (
    <group ref={groupRef} position={[0, yPos, -3.5]}>
      {/* Base strip (ConsoleBase material) */}
      <mesh>
        <planeGeometry args={[barWidth, 0.25]} />
        <meshStandardMaterial
          color="#0e1118"
          metalness={0.7}
          roughness={0.6}
          transparent
          opacity={opacity * 0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* XP bar background */}
      <mesh position={[-barWidth * 0.3, 0, 0.01]}>
        <planeGeometry args={[barWidth * 0.35, 0.08]} />
        <meshStandardMaterial
          color="#1a1e2e"
          metalness={0.5}
          roughness={0.5}
          transparent
          opacity={opacity * 0.6}
          depthWrite={false}
        />
      </mesh>

      {/* XP bar fill (EmissiveGlow) */}
      <mesh ref={xpFillRef} position={[-barWidth * 0.3, 0, 0.02]}>
        <planeGeometry args={[barWidth * 0.35, 0.06]} />
        <meshStandardMaterial
          color="#000000"
          emissive={labColorObj}
          emissiveIntensity={2.0}
          transparent
          opacity={opacity * 0.8}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Streak indicator ring */}
      <mesh position={[barWidth * 0.05, 0, 0.01]}>
        <ringGeometry args={[0.06, 0.09, 16]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#FF6644"
          emissiveIntensity={1.5}
          transparent
          opacity={opacity * 0.7}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Lab progress segments (5 slots) */}
      <group position={[barWidth * 0.25, 0, 0.01]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={`prog-${i}`} position={[(i - 2) * 0.15, 0, 0]}>
            <planeGeometry args={[0.1, 0.06]} />
            <meshStandardMaterial
              color="#000000"
              emissive={labColorObj}
              emissiveIntensity={0.5}
              transparent
              opacity={opacity * 0.4}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Alert indicator dots (3) */}
      <group position={[barWidth * 0.4, 0, 0.01]}>
        {[0, 1, 2].map((i) => (
          <mesh key={`alert-${i}`} position={[(i - 1) * 0.12, 0, 0]}>
            <circleGeometry args={[0.03, 12]} />
            <meshStandardMaterial
              color="#000000"
              emissive="#00FF88"
              emissiveIntensity={0.8}
              transparent
              opacity={opacity * 0.5}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Top edge highlight */}
      <mesh position={[0, 0.13, 0.01]}>
        <planeGeometry args={[barWidth, 0.005]} />
        <meshStandardMaterial
          color="#000000"
          emissive={labColorObj}
          emissiveIntensity={1.0}
          transparent
          opacity={opacity * 0.4}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
