'use client';

// ================================================================
// CPA v1.0 — HolographicHUD: Concentric Rings Overlay
// ================================================================
// Decision CPA-4: 10-15% opacity during normal use
// Decision CPA-5: 3 concentric rings + 12 radial lines + core sphere
//
// Semi-transparent R3F overlay rendered in front of HTML content.
// During normal use: 10-15% opacity (barely visible).
// During celebrations: 80-100% opacity with full animation.
// During game mode: hidden (0% opacity).
//
// Triangle budget: ~400-600 tris

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HolographicHUDProps {
  opacity: number;           // 0.0-1.0, driven by station mode
  color: string;             // Lab accent color
  rotationSpeed: number;     // Outer ring rotation, default 0.1 rad/s
  pulseIntensity: number;    // Core pulse strength, default 0.5
  active: boolean;           // false = return null (game mode)
}

export function HolographicHUD({
  opacity,
  color,
  rotationSpeed,
  pulseIntensity,
  active,
}: HolographicHUDProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const scanLinesRef = useRef<THREE.Group>(null);
  const activeScanRef = useRef(0);

  const hudColor = useMemo(() => new THREE.Color(color), [color]);

  // Create scan line geometry (12 radial lines)
  const scanLineGeo = useMemo(() => {
    return new THREE.PlaneGeometry(0.02, 2.5);
  }, []);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;

    // Outer ring: rotates counter-clockwise
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z -= rotationSpeed * 0.016; // per frame
    }

    // Mid ring: rotates clockwise, slower
    if (midRingRef.current) {
      midRingRef.current.rotation.z += rotationSpeed * 0.6 * 0.016;
    }

    // Inner ring: subtle scale pulse
    if (innerRingRef.current) {
      const scale = 1.0 + Math.sin(t * 3.14) * 0.02; // 2s period
      innerRingRef.current.scale.set(scale, scale, 1);
    }

    // Core: pulsing emissive
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(t * 4.189) * 0.5 + 0.5; // 1.5s period
      mat.emissiveIntensity = pulse * pulseIntensity * 2;
    }

    // Active scan line sweep
    if (scanLinesRef.current) {
      activeScanRef.current = (t * 1.5) % (Math.PI * 2); // 4s sweep
      scanLinesRef.current.children.forEach((child, i) => {
        const lineAngle = (i / 12) * Math.PI * 2;
        const diff = Math.abs(lineAngle - (activeScanRef.current % (Math.PI * 2)));
        const isActive = diff < 0.3;
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isActive ? 1.5 : 0.3;
      });
    }
  });

  if (!active || opacity <= 0) return null;

  return (
    <group position={[0, 0, 0.5]}>
      {/* Outer Ring — r=3.2-3.5 */}
      <mesh ref={outerRingRef}>
        <ringGeometry args={[3.2, 3.5, 64]} />
        <meshStandardMaterial
          color="#000000"
          emissive={hudColor}
          emissiveIntensity={0.8}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Mid Ring — r=2.2-2.5 */}
      <mesh ref={midRingRef}>
        <ringGeometry args={[2.2, 2.5, 48]} />
        <meshStandardMaterial
          color="#000000"
          emissive={hudColor}
          emissiveIntensity={0.6}
          transparent
          opacity={opacity * 0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Inner Ring — r=1.2-1.5 */}
      <mesh ref={innerRingRef}>
        <ringGeometry args={[1.2, 1.5, 32]} />
        <meshStandardMaterial
          color="#000000"
          emissive={hudColor}
          emissiveIntensity={0.5}
          transparent
          opacity={opacity * 0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Pulsing Core Sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#000000"
          emissive={hudColor}
          emissiveIntensity={1.0}
          transparent
          opacity={opacity}
          toneMapped={false}
        />
      </mesh>

      {/* 12 Radial Scan Lines */}
      <group ref={scanLinesRef}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={`scan-${i}`}
              geometry={scanLineGeo}
              position={[
                Math.cos(angle) * 1.7,
                Math.sin(angle) * 1.7,
                0,
              ]}
              rotation={[0, 0, angle + Math.PI / 2]}
            >
              <meshStandardMaterial
                color="#000000"
                emissive={hudColor}
                emissiveIntensity={0.3}
                transparent
                opacity={opacity * 0.6}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* 4 Cardinal Tick Marks */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={`tick-${i}`}
          position={[
            Math.cos(angle) * 3.6,
            Math.sin(angle) * 3.6,
            0,
          ]}
          rotation={[0, 0, angle]}
        >
          <planeGeometry args={[0.15, 0.04]} />
          <meshStandardMaterial
            color="#000000"
            emissive={hudColor}
            emissiveIntensity={1.0}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
