'use client';

// ================================================================
// SparkForge OnboardingCrystal — Crystal Forming During Onboarding
// ================================================================
// Crystal assembles as onboarding steps complete:
// Step 1: Crystal seed appears (small glowing orb)
// Step 2: Crystal grows (facets form)
// Step 3: Crystal fully forms + celebration glow

import { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Mesh, MeshPhysicalMaterial } from 'three';

interface CrystalMeshProps {
  step: number; // 0-3
}

function CrystalMesh({ step }: CrystalMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const [targetScale, setTargetScale] = useState(0);
  const currentScale = useRef(0);

  useEffect(() => {
    switch (step) {
      case 0:
        setTargetScale(0);
        break;
      case 1:
        setTargetScale(0.4);
        break;
      case 2:
        setTargetScale(0.7);
        break;
      case 3:
        setTargetScale(1.0);
        break;
      default:
        setTargetScale(0);
    }
  }, [step]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Smooth scale transition
    currentScale.current +=
      (targetScale - currentScale.current) * 0.03;
    meshRef.current.scale.setScalar(currentScale.current);

    // Gentle rotation
    meshRef.current.rotation.y = clock.elapsedTime * 0.3;
    meshRef.current.rotation.x =
      Math.sin(clock.elapsedTime * 0.5) * 0.1;

    // Emissive pulse on step 3
    const mat = meshRef.current.material as MeshPhysicalMaterial;
    if (step >= 3) {
      mat.emissiveIntensity =
        0.5 + Math.sin(clock.elapsedTime * 3) * 0.3;
    } else {
      mat.emissiveIntensity = 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshPhysicalMaterial
          color="#88ccff"
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={step >= 1 ? 0.7 : 0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          emissive="#3B82F6"
          emissiveIntensity={0.1}
          envMapIntensity={1.5}
        />
      </mesh>
    </Float>
  );
}

interface OnboardingCrystalProps {
  currentStep: number; // 0-3 (0 = not started, 1-3 = wizard steps)
}

export function OnboardingCrystal({ currentStep }: OnboardingCrystalProps) {
  return (
    <div className="w-full h-48 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight
            position={[2, 2, 3]}
            intensity={1.2}
            color="#3B82F6"
          />
          <CrystalMesh step={currentStep} />
          <EffectComposer>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.5}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
