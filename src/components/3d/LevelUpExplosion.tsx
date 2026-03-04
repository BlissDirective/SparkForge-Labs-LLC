'use client';

// ================================================================
// SparkForge LevelUpExplosion — R3F Particle Burst
// ================================================================
// Replaces v2 CSS confetti with R3F particle burst + Bloom.
// Triggered on level-up. 200 particles, 2.0s duration.
// Auto-unmounts after completion. Mobile uses v2 CSS fallback.
//
// Self-contained Canvas overlay — no parent Canvas needed.
// Dynamic import: dynamic(() => import(...).then(m => m.LevelUpExplosion), { ssr: false })

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const PARTICLE_COUNT = 200;
const DURATION = 2.0;

interface ParticleData {
  velocity: THREE.Vector3;
  size: number;
  rotSpeed: number;
  gravity: number;
}

function generateExplosion(): ParticleData[] {
  const data: ParticleData[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Deterministic "random" from index (avoids Math.random in hot path)
    const seed1 = Math.sin(i * 1.37) * 0.5 + 0.5;
    const seed2 = Math.sin(i * 2.71) * 0.5 + 0.5;
    const seed3 = Math.sin(i * 3.97) * 0.5 + 0.5;
    const seed4 = Math.sin(i * 5.13) * 0.5 + 0.5;

    const theta = seed1 * Math.PI * 2;
    const phi = Math.acos(2 * seed2 - 1);
    const speed = 2 + seed3 * 4;

    data.push({
      velocity: new THREE.Vector3(
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

function ExplosionScene({
  color,
  onComplete,
}: {
  color: string;
  onComplete: () => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTime = useRef(0);
  const completedRef = useRef(false);
  const particles = useMemo(() => generateExplosion(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  // Set instance colors with slight per-particle variation
  useEffect(() => {
    if (!meshRef.current) return;
    const c = new THREE.Color();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      c.copy(threeColor);
      const seed = Math.sin(i * 7.19) * 0.5 + 0.5;
      c.offsetHSL(
        (seed - 0.5) * 0.1,
        (Math.sin(i * 3.37) * 0.5) * 0.2,
        (Math.sin(i * 4.91) * 0.5) * 0.1
      );
      meshRef.current.setColorAt(i, c);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [threeColor]);

  useFrame(({ clock }) => {
    if (startTime.current === 0) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current;
    if (!meshRef.current) return;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const t = elapsed;

      if (t > DURATION) {
        dummy.scale.setScalar(0);
      } else {
        // Physics: position = v*t - 0.5*g*t^2 (gravity pulls down)
        dummy.position.set(
          p.velocity.x * t,
          p.velocity.y * t - 0.5 * p.gravity * t * t,
          p.velocity.z * t
        );

        // Rotation
        dummy.rotation.set(
          t * p.rotSpeed,
          t * p.rotSpeed * 0.7,
          t * p.rotSpeed * 0.3
        );

        // Fade out: full size until 60%, then shrink
        const fadeProgress = elapsed / DURATION;
        const scale =
          fadeProgress < 0.6
            ? p.size
            : p.size * (1.0 - (fadeProgress - 0.6) / 0.4);
        dummy.scale.setScalar(Math.max(0, scale));
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (elapsed >= DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>

      <EffectComposer>
        <Bloom
          intensity={3.0}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </group>
  );
}

// ---- Public API ----

interface LevelUpExplosionProps {
  /** Level tier color */
  tierColor: string;
  onComplete?: () => void;
}

export function LevelUpExplosion({
  tierColor,
  onComplete,
}: LevelUpExplosionProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity
        duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ExplosionScene color={tierColor} onComplete={handleComplete} />
        </Suspense>
      </Canvas>

      {/* LEVEL UP text */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2
          font-display text-5xl font-bold animate-bounce"
        style={{
          color: tierColor,
          textShadow: `0 0 30px ${tierColor}80`,
        }}
      >
        LEVEL UP!
      </div>
    </div>
  );
}

export default LevelUpExplosion;
