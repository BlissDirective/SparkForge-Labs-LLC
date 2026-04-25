'use client';

// ================================================================
// SparkForge XPVortex — 100-Particle Instanced Spiral
// ================================================================
// Decision 5.2: Particle vortex for 20+ XP celebrations
// GPU cost: ~0.2ms (100 instanced icosahedrons, single draw call)
// Renders INSIDE CockpitCanvas as a <group> (D3D-B1)
// Auto-unmounts after 2.0s animation

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Object3D } from 'three';
// R2: a11y state merged into uiStore (was accessibilityStore)
import { useUIStore } from '@/stores/uiStore';

interface XPVortexProps {
  active: boolean;
  amount?: number;
  color?: string;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 100;
const DURATION = 2.0;

export default function XPVortex({
  active,
  amount = PARTICLE_COUNT,
  color = '#00BBFF',
  onComplete,
}: XPVortexProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);
  const [alive, setAlive] = useState(false);
  const reduceMotion = useUIStore((s) => s.a11y.reduceMotion);

  // Reset timer when active transitions to true
  useEffect(() => {
    if (active) {
      timeRef.current = 0;
      setAlive(true);
    }
  }, [active]);

  // Pre-compute spiral paths for each particle
  const particleData = useMemo(() => {
    const count = Math.min(amount, PARTICLE_COUNT);
    const data: Array<{
      angle: number;
      radius: number;
      speed: number;
      phase: number;
      baseY: number;
    }> = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      data.push({
        angle: t * Math.PI * 6, // 3 full spirals
        radius: 0.3 + t * 1.2,
        speed: 0.5 + (Math.sin(i * 1.37) * 0.5 + 0.5) * 1.5,
        phase: (Math.sin(i * 2.71) * 0.5 + 0.5) * Math.PI * 2,
        baseY: -1 + t * 0.5,
      });
    }
    return data;
  }, [amount]);

  const colorObj = useMemo(() => new Color(color), [color]);
  const dummy = useMemo(() => new Object3D(), []);
  const count = Math.min(amount, PARTICLE_COUNT);

  useFrame((_, delta) => {
    if (!meshRef.current || !alive) return;

    // Skip animation for reduced motion — just call complete immediately
    if (reduceMotion) {
      setAlive(false);
      onComplete?.();
      return;
    }

    timeRef.current += delta;
    const progress = Math.min(timeRef.current / DURATION, 1);

    for (let i = 0; i < count; i++) {
      const p = particleData[i];
      const currentAngle = p.angle + timeRef.current * p.speed + p.phase;
      const currentRadius = p.radius * (1 - progress * 0.3);
      const y = p.baseY + progress * 3.0 * p.speed;

      dummy.position.set(
        Math.cos(currentAngle) * currentRadius,
        y,
        Math.sin(currentAngle) * currentRadius
      );

      const scale = Math.max(0, (1 - progress) * 0.5);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (progress >= 1) {
      setAlive(false);
      onComplete?.();
    }
  });

  if (!alive) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[0.02, 1]} />
        <meshBasicMaterial
          color={colorObj}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
