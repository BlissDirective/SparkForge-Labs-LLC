'use client';

// ================================================================
// SparkForge StreakFlame3D — Diamond Tier Shader Fire
// ================================================================
// Diamond streak flame (100+ day) using fireNoise shader.
// v2 StreakFlame.tsx CSS handles tiers 1-6 — this is tier 7 only.
// PlaneGeometry billboard with transparent additive blending.
// Desktop only — mobile uses v2 CSS fallback.
//
// FIX APPLIED: JSX `>` was placed before attributes on the wrapper
// div (PDF corruption). All attributes now correctly inside the tag.
//
// Self-contained Canvas overlay.
// Dynamic import: dynamic(() => import(...).then(m => m.StreakFlame3D), { ssr: false })

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AdditiveBlending, DoubleSide, Mesh, ShaderMaterial } from 'three';
import {
  fireNoiseVertexShader,
  fireNoiseFragmentShader,
} from '@/shaders';

function DiamondFlame() {
  const meshRef = useRef<Mesh>(null);

  const shaderMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: fireNoiseVertexShader,
      fragmentShader: fireNoiseFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uFlameHeight: { value: 1.2 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
  }, []);

  useFrame(({ clock }) => {
    shaderMaterial.uniforms.uTime.value = clock.elapsedTime;
    // Subtle height pulsing
    const pulse = 1.0 + Math.sin(clock.elapsedTime * 1.5) * 0.1;
    shaderMaterial.uniforms.uFlameHeight.value = 1.2 * pulse;
  });

  return (
    <group>
      {/* Main flame plane */}
      <mesh ref={meshRef} material={shaderMaterial}>
        <planeGeometry args={[1.0, 1.8]} />
      </mesh>

      {/* Secondary smaller flame (depth illusion) */}
      <mesh
        material={shaderMaterial}
        rotation={[0, Math.PI / 4, 0]}
        scale={[0.8, 0.9, 0.8]}
      >
        <planeGeometry args={[0.8, 1.5]} />
      </mesh>

      {/* Third plane for volume */}
      <mesh
        material={shaderMaterial}
        rotation={[0, -Math.PI / 4, 0]}
        scale={[0.7, 0.85, 0.7]}
      >
        <planeGeometry args={[0.7, 1.4]} />
      </mesh>

      {/* Inner glow point light */}
      <pointLight
        position={[0, 0.3, 0]}
        color="#F59E0B"
        intensity={2}
        distance={3}
      />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </group>
  );
}

// ---- Public API ----

interface StreakFlame3DProps {
  streakDays: number;
  className?: string;
}

export function StreakFlame3D({ streakDays, className }: StreakFlame3DProps) {
  // Only render for Diamond tier (100+ days)
  if (streakDays < 100) return null;

  return (
    <div
      className={`relative ${className || ''}`}
      style={{ width: 80, height: 120 }}
      aria-label={`Diamond streak flame: ${streakDays} days`}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <DiamondFlame />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default StreakFlame3D;
