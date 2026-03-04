'use client';

// ================================================================
// SparkForge SparkCard3D — Holographic Daily Spark Card
// ================================================================
// Decision 4.3: Holographic diffraction on collectible cards
// GPU cost: ~0.1ms (no noise dependency, simple fragment shader)
// Geometry: RoundedBox card + drei Text for title
//
// Interactive: pointer-driven tilt updates uTilt uniform for
// rainbow shift that follows the user's viewing angle.
//
// FIX APPLIED: ShaderMaterial `transparent` and `side` moved
// INSIDE constructor (were outside due to PDF corruption).
//
// NOTE: Font file at /fonts/Exo2-Bold.woff must be placed in
// public/fonts/. Text component falls back to default font if missing.

import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  holographicVertexShader,
  holographicFragmentShader,
} from '@/shaders';

interface SparkCard3DProps {
  title?: string;
  color?: string;
  position?: [number, number, number];
  onClick?: () => void;
}

const FONT_URL = '/fonts/Exo2-Bold.woff';
const CARD_WIDTH = 1.2;
const CARD_HEIGHT = 1.6;

export default function SparkCard3D({
  title = 'Daily Spark',
  color = '#00BBFF',
  position = [0, 0, 0],
  onClick,
}: SparkCard3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const tiltRef = useRef(new THREE.Vector2(0, 0));
  const targetTiltRef = useRef(new THREE.Vector2(0, 0));

  // FIX: `transparent` and `side` are INSIDE the constructor (were outside)
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holographicVertexShader,
        fragmentShader: holographicFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uTilt: { value: new THREE.Vector2(0, 0) },
          uIntensity: { value: 0.8 },
          uBaseColor: { value: new THREE.Color(color) },
        },
        transparent: true,
        side: THREE.FrontSide,
      }),
    [color]
  );

  // Animate tilt toward target + update time
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    shaderMaterial.uniforms.uTime.value += delta;

    // Smooth tilt interpolation
    tiltRef.current.lerp(targetTiltRef.current, delta * 6);
    shaderMaterial.uniforms.uTilt.value.copy(tiltRef.current);

    // Subtle idle rotation when not hovered
    if (!hovered) {
      targetTiltRef.current.set(
        Math.sin(Date.now() * 0.001) * 0.05,
        Math.cos(Date.now() * 0.0013) * 0.05
      );
    }

    // Apply tilt to group rotation for physical card feel
    groupRef.current.rotation.y = tiltRef.current.x * 0.3;
    groupRef.current.rotation.x = -tiltRef.current.y * 0.2;
  });

  // Track pointer for tilt
  const handlePointerMove = useCallback(
    (e: THREE.Event) => {
      const event = e as THREE.Event & { point?: THREE.Vector3 };
      if (!event.point || !groupRef.current) return;

      // Normalize point relative to card center
      const local = groupRef.current.worldToLocal(event.point.clone());
      targetTiltRef.current.set(
        (local.x / CARD_WIDTH) * 2,
        (local.y / CARD_HEIGHT) * 2
      );
    },
    []
  );

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => {
        setHovered(false);
        targetTiltRef.current.set(0, 0);
      }}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      {/* Card body with holographic shader */}
      <RoundedBox
        args={[CARD_WIDTH, CARD_HEIGHT, 0.04]}
        radius={0.06}
        smoothness={4}
        castShadow
      >
        <primitive object={shaderMaterial} attach="material" />
      </RoundedBox>

      {/* Chrome edge bevel */}
      <RoundedBox
        args={[CARD_WIDTH + 0.03, CARD_HEIGHT + 0.03, 0.02]}
        radius={0.07}
        smoothness={4}
        position={[0, 0, -0.015]}
      >
        <meshStandardMaterial
          color="#2A2A3A"
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Title text */}
      <Text
        position={[0, -CARD_HEIGHT * 0.35, 0.025]}
        fontSize={0.1}
        maxWidth={CARD_WIDTH * 0.8}
        textAlign="center"
        color="#FFFFFF"
        font={FONT_URL}
        anchorX="center"
        anchorY="middle"
        aria-label={title}
      >
        {title}
      </Text>

      {/* Spark icon (diamond shape) */}
      <mesh position={[0, 0.15, 0.025]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
