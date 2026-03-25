'use client';

// ================================================================
// SparkForge CrystalHero — Landing Page Interactive Crystal
// ================================================================
// Decision 8.1: Shared DNA, different execution
// Landing: Interactive crystal with parallax + sparkles
// NOT the cinematic shatter — user scrolls past freely
// D3D Desktop-First: always renders full 3D

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AdditiveBlending, BufferAttribute, Group, Points } from 'three';

// ■■ Inner 3D Scene ■■
function CrystalText() {
  const groupRef = useRef<Group>(null);
  const sparklesRef = useRef<Points>(null);
  const { pointer } = useThree();

  // Generate sparkle positions
  const sparklePositions = useMemo(() => {
    const pos = new Float32Array(80 * 3);
    for (let i = 0; i < 80; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Mouse parallax tilt
    const targetRotY = pointer.x * 0.15;
    const targetRotX = -pointer.y * 0.1;
    groupRef.current.rotation.y +=
      (targetRotY - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x +=
      (targetRotX - groupRef.current.rotation.x) * 0.05;

    // Sparkle drift
    if (sparklesRef.current) {
      const posAttr = sparklesRef.current.geometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < 80; i++) {
        arr[i * 3 + 1] += Math.sin(clock.elapsedTime + i) * 0.002;
        arr[i * 3] +=
          Math.cos(clock.elapsedTime * 0.5 + i * 0.3) * 0.001;
      }
      (posAttr as BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* SPARKFORGE text as glowing crystal */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh>
          <boxGeometry args={[7, 1.2, 0.4]} />
          <meshPhysicalMaterial
            color="#88ccff"
            metalness={0.1}
            roughness={0.05}
            transparent
            opacity={0.6}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            envMapIntensity={2.0}
          />
        </mesh>
      </Float>

      {/* Sparkles */}
      <points ref={sparklesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparklePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00BBFF"
          size={0.05}
          transparent
          opacity={0.4}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

      {/* Ambient light */}
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 2, 4]} intensity={1.5} color="#3B82F6" />
      <pointLight position={[-3, -1, 3]} intensity={0.8} color="#8B5CF6" />
    </group>
  );
}

// ■■ Main Component ■■
export function CrystalHero() {
  return (
    <div className="relative w-full h-[60vh]">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <CrystalText />
          <EffectComposer>
            <Bloom
              intensity={0.8}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
