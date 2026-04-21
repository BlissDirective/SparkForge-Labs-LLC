'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
// PERF-CRIT-001 (10C): use named imports for Three.js tree-shaking.
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
} from 'three';
// R2: a11y state merged into uiStore (was accessibilityStore)
import { useUIStore } from '@/stores/uiStore';

interface AvatarPreview3DProps {
  shapeIndex: number;
  color?: string;
  accentColor?: string;
  letter?: string;
  active?: boolean;
  position?: [number, number, number];
}

const SHAPE_FACTORIES: Array<() => BufferGeometry> = [
  () => new SphereGeometry(0.4, 32, 32),
  () => new CylinderGeometry(0.4, 0.4, 0.15, 6),
  () => new OctahedronGeometry(0.4, 0),
  () => new BoxGeometry(0.5, 0.6, 0.1, 1, 1, 1),
  () => new DodecahedronGeometry(0.4, 0),
  () => new CylinderGeometry(0.4, 0.4, 0.15, 5),
];

export default function AvatarPreview3D({
  shapeIndex,
  color = '#FF66AA',
  accentColor = '#AA66FF',
  letter,
  active = true,
  position = [0, 0, 0],
}: AvatarPreview3DProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const scaleRef = useRef(1);
  const [currentIndex, setCurrentIndex] = useState(shapeIndex);
  const [morphPhase, setMorphPhase] = useState<'idle' | 'shrink' | 'grow'>('idle');
  const reduceMotion = useUIStore((s) => s.a11y.reduceMotion);

  // Clamp shape index to valid range
  const safeIndex = Math.max(0, Math.min(5, currentIndex));

  const geometry = useMemo(() => {
    return SHAPE_FACTORIES[safeIndex]();
  }, [safeIndex]);

  const material = useMemo(() => {
    return new MeshStandardMaterial({
      color,
      metalness: 0.6,
      roughness: 0.3,
      emissive: new Color(color),
      emissiveIntensity: 0.15,
    });
  }, [color]);

  // Dispose geometry and material on cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Trigger morph when shapeIndex prop changes
  useEffect(() => {
    if (shapeIndex !== currentIndex) {
      if (reduceMotion) {
        setCurrentIndex(shapeIndex);
      } else {
        setMorphPhase('shrink');
      }
    }
  }, [shapeIndex, currentIndex, reduceMotion]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Idle rotation
    if (!reduceMotion) {
      groupRef.current.rotation.y += 0.3 * delta;
    }

    // Morph animation
    if (morphPhase === 'shrink') {
      scaleRef.current = MathUtils.lerp(scaleRef.current, 0, 8 * delta);
      if (scaleRef.current < 0.02) {
        scaleRef.current = 0;
        setCurrentIndex(shapeIndex);
        setMorphPhase('grow');
      }
    } else if (morphPhase === 'grow') {
      scaleRef.current = MathUtils.lerp(scaleRef.current, 1, 6 * delta);
      if (scaleRef.current > 0.98) {
        scaleRef.current = 1;
        setMorphPhase('idle');
      }
    }

    groupRef.current.scale.setScalar(scaleRef.current);
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={position}>
      <Float speed={reduceMotion ? 0 : 1.5} floatIntensity={0.15} rotationIntensity={0}>
        <mesh ref={meshRef} geometry={geometry} material={material} />

        {letter && (
          <Text
            position={[0, 0, 0.35]}
            fontSize={0.22}
            color={accentColor}
            anchorX="center"
            anchorY="middle"
            font="/fonts/Exo2-Bold.woff"
          >
            {letter}
          </Text>
        )}
      </Float>

      {/* Ambient glow behind avatar */}
      <pointLight
        position={[0, 0, -0.5]}
        color={color}
        intensity={1.2}
        distance={3}
        decay={2}
      />
    </group>
  );
}
