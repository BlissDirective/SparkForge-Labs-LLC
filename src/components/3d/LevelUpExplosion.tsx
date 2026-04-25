'use client';

// ================================================================
// SparkForge LevelUpExplosion — 200-Particle R3F Burst
// ================================================================
// Triggered on level-up. 200 instanced cubes, 2.0s duration.
// Deterministic particle generation (no Math.random).
// Renders INSIDE CockpitCanvas as a <group> (D3D-B1).
// Self-contained group — NOT a Canvas wrapper.

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Object3D, Vector3 } from 'three';
// R2: a11y state merged into uiStore (was accessibilityStore)
import { useUIStore } from '@/stores/uiStore';

const PARTICLE_COUNT = 200;
const DURATION = 2.0;

interface ParticleData {
  velocity: Vector3;
  size: number;
  rotSpeed: number;
  gravity: number;
}

interface LevelUpExplosionProps {
  active: boolean;
  color?: string;
  onComplete?: () => void;
}

// Deterministic particle generation from seed indices
function generateExplosion(): ParticleData[] {
  const data: ParticleData[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const seed1 = Math.sin(i * 1.37) * 0.5 + 0.5;
    const seed2 = Math.sin(i * 2.71) * 0.5 + 0.5;
    const seed3 = Math.sin(i * 3.97) * 0.5 + 0.5;
    const seed4 = Math.sin(i * 5.13) * 0.5 + 0.5;

    const theta = seed1 * Math.PI * 2;
    const phi = Math.acos(2 * seed2 - 1);
    const speed = 2 + seed3 * 4;

    data.push({
      velocity: new Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed + 2, // Bias upward
        Math.cos(phi) * speed * 0.5
      ),
      size: 0.02 + seed4 * 0.04,
      rotSpeed: (seed1 - 0.5) * 10,
      gravity: 3 + seed2 * 2,
    });
  }
  return data;
}

export default function LevelUpExplosion({
  active,
  color = '#00BBFF',
  onComplete,
}: LevelUpExplosionProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);
  const [alive, setAlive] = useState(false);
  const reduceMotion = useUIStore((s) => s.a11y.reduceMotion);

  const particles = useMemo(() => generateExplosion(), []);
  const dummy = useMemo(() => new Object3D(), []);
  const threeColor = useMemo(() => new Color(color), [color]);

  // Reset when active transitions to true
  useEffect(() => {
    if (active) {
      timeRef.current = 0;
      setAlive(true);
    }
  }, [active]);

  // Set per-instance colors with slight variation
  useEffect(() => {
    if (!meshRef.current || !alive) return;
    const c = new Color();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      c.copy(threeColor);
      const hueShift = (Math.sin(i * 7.19) - 0.5) * 0.1;
      c.offsetHSL(hueShift, 0, 0);
      meshRef.current.setColorAt(i, c);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [threeColor, alive]);

  useFrame((_, delta) => {
    if (!meshRef.current || !alive) return;

    if (reduceMotion) {
      setAlive(false);
      onComplete?.();
      return;
    }

    timeRef.current += delta;
    const t = timeRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      if (t > DURATION) {
        dummy.scale.setScalar(0);
      } else {
        // Physics: position = v*t - 0.5*g*t^2
        dummy.position.set(
          p.velocity.x * t,
          p.velocity.y * t - 0.5 * p.gravity * t * t,
          p.velocity.z * t
        );

        dummy.rotation.set(
          t * p.rotSpeed,
          t * p.rotSpeed * 0.7,
          t * p.rotSpeed * 0.3
        );

        // Fade out: full size until 60%, then shrink
        const progress = t / DURATION;
        const scale =
          progress < 0.6
            ? p.size
            : p.size * (1.0 - (progress - 0.6) / 0.4);
        dummy.scale.setScalar(Math.max(0, scale));
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (t >= DURATION) {
      setAlive(false);
      onComplete?.();
    }
  });

  if (!alive) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.03, 0.03, 0.03]} />
        <meshBasicMaterial
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </instancedMesh>
    </group>
  );
}
