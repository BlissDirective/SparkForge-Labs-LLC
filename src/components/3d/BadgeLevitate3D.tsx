'use client';

// ================================================================
// SparkForge BadgeLevitate3D — LiquidMetal Badge Display
// ================================================================
// Decision 4.2: Liquid metal shader on Epic/Legendary badges
// GPU cost: ~0.3ms per badge (simplex noise displacement)
// Geometry: SphereGeometry (detail 32) for smooth displacement
//
// Uniforms: uTime, uIntensity, uColor, uRippleCenter, uRippleStrength
// Epic: intensity=0.5 (subtle). Legendary: intensity=1.0 + mouse ripple.
//
// FIX APPLIED: ShaderMaterial `side` property moved INSIDE constructor.
// FIX APPLIED: Removed unused `useThree` import.

import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Rarity } from '@/lib/gamification';
import { getRarityColor, getRarityVisuals } from '@/lib/gamification';
import {
  liquidMetalVertexShader,
  liquidMetalFragmentShader,
} from '@/shaders';

interface BadgeLevitate3DProps {
  rarity: Rarity;
  position?: [number, number, number];
  badgeName?: string;
}

export default function BadgeLevitate3D({
  rarity,
  position = [0, 0, 0],
  badgeName = 'Badge',
}: BadgeLevitate3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const rippleCenterRef = useRef(new THREE.Vector2(0.5, 0.5));

  const isLegendary = rarity === 'legendary';
  const isEpic = rarity === 'epic';
  const useLiquidMetal = isEpic || isLegendary;
  const color = useMemo(() => getRarityColor(rarity), [rarity]);
  const visuals = useMemo(() => getRarityVisuals(rarity), [rarity]);

  // FIX: `side` is INSIDE the ShaderMaterial constructor (was outside)
  const shaderMaterial = useMemo(() => {
    if (!useLiquidMetal) return null;

    return new THREE.ShaderMaterial({
      vertexShader: liquidMetalVertexShader,
      fragmentShader: liquidMetalFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: isLegendary ? 1.0 : 0.5 },
        uColor: { value: new THREE.Color(color) },
        uRippleCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uRippleStrength: { value: 0 },
      },
      side: THREE.DoubleSide,
    });
  }, [useLiquidMetal, isLegendary, color]);

  // Animate uniforms + levitation
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Slow Y rotation
    if (visuals.rotateSpeed > 0) {
      meshRef.current.rotation.y +=
        (Math.PI * 2 * delta) / visuals.rotateSpeed;
    }

    // Levitation bob
    const levHeight = visuals.levitateHeight * 0.02;
    meshRef.current.position.y =
      position[1] + Math.sin(Date.now() * 0.002) * levHeight;

    // Update shader uniforms
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value += delta;
      shaderMaterial.uniforms.uRippleCenter.value.copy(rippleCenterRef.current);
      // Legendary gets mouse ripple; Epic gets none
      shaderMaterial.uniforms.uRippleStrength.value = THREE.MathUtils.lerp(
        shaderMaterial.uniforms.uRippleStrength.value,
        hovered && isLegendary ? 1.0 : 0,
        delta * 4
      );
    }
  });

  // Track pointer for legendary ripple
  const handlePointerMove = useCallback(
    (e: THREE.Event) => {
      if (!isLegendary) return;
      const event = e as THREE.Event & { uv?: THREE.Vector2 };
      if (event.uv) {
        rippleCenterRef.current.copy(event.uv);
      }
    },
    [isLegendary]
  );

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerMove={handlePointerMove}
      aria-label={`${badgeName}, ${rarity} rarity badge with liquid metal effect`}
    >
      <sphereGeometry args={[0.3, 32, 32]} />
      {shaderMaterial ? (
        <primitive object={shaderMaterial} attach="material" />
      ) : (
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      )}
    </mesh>
  );
}
