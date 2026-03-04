'use client';

// ================================================================
// SparkForge XPVortex — 100-Particle Spiral Overlay
// ================================================================
// Decision 5.2: Particle vortex for 20+ XP gains
// GPU cost: ~0.2ms (100 instanced spheres, single draw call)
// Geometry: InstancedMesh spiral rising upward
// Lifespan: Auto-unmounts after 2s animation
//
// Usage: Overlaid in XP popup/celebration when xpAmount >= 20.
// Below 20 XP returns null (no GPU cost).

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

interface XPVortexProps {
  xpAmount: number;
  color?: string;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 100;
const DURATION = 2.0;

export default function XPVortex({
  xpAmount,
  color = '#00BBFF',
  onComplete,
}: XPVortexProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const [active, setActive] = useState(true);

  // Pre-compute spiral paths for each particle
  const particleData = useMemo(() => {
    const data: Array<{
      angle: number;
      radius: number;
      speed: number;
      phase: number;
      baseY: number;
    }> = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT;
      const angle = t * Math.PI * 6; // 3 full spirals
      const radius = 0.3 + t * 1.2;
      const speed = 0.5 + (Math.sin(i * 1.37) * 0.5 + 0.5) * 1.5;
      const phase = (Math.sin(i * 2.71) * 0.5 + 0.5) * Math.PI * 2;
      data.push({ angle, radius, speed, phase, baseY: -1 + t * 0.5 });
    }
    return data;
  }, []);

  const colorObj = useMemo(() => new THREE.Color(color), [color]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !active || xpAmount < 20) return;

    timeRef.current += delta;
    const progress = Math.min(timeRef.current / DURATION, 1);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData[i];

      // Spiral upward with contracting radius
      const currentAngle =
        p.angle + timeRef.current * p.speed + p.phase;
      const currentRadius = p.radius * (1 - progress * 0.3);
      const y = p.baseY + progress * 3.0 * p.speed;

      dummy.position.set(
        Math.cos(currentAngle) * currentRadius,
        y,
        Math.sin(currentAngle) * currentRadius
      );

      // Scale down as particles rise and fade
      const scale = Math.max(0, (1 - progress) * 0.5);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Auto-complete after duration
    if (progress >= 1 && active) {
      setActive(false);
      onComplete?.();
    }
  });

  // Return null for small XP or after animation completes
  // All hooks are called unconditionally above (React rules)
  if (xpAmount < 20 || !active) return null;

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshBasicMaterial
          color={colorObj}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </instancedMesh>

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
