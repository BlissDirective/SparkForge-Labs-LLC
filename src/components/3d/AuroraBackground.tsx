'use client';

// ================================================================
// SparkForge AuroraBackground — R3F Aurora Void
// ================================================================
// Decision 2.5: Background behind station frame
// Decision 4.6: Aurora is the frame's own glow, not separate space
// Renders at half viewport resolution for performance (~0.3ms GPU)

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { auroraFragmentShader, auroraVertexShader } from '@/shaders/index';

interface AuroraBackgroundProps {
  intensity?: number;
  speed?: number;
  color1?: string;
  color2?: string;
  color3?: string;
}

export function AuroraBackground({
  intensity = 0.15,
  speed = 1.0,
  color1 = '#3B82F6', // Blue
  color2 = '#8B5CF6', // Purple
  color3 = '#06B6D4', // Teal
}: AuroraBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uColor3: { value: new THREE.Color(color3) },
      uIntensity: { value: intensity },
      uSpeed: { value: speed },
      uResolution: {
        value: new THREE.Vector2(viewport.width, viewport.height),
      },
    }),
    // Only recreate on color changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Update uniforms each frame
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uIntensity.value = intensity;
    mat.uniforms.uSpeed.value = speed;
    mat.uniforms.uColor1.value.set(color1);
    mat.uniforms.uColor2.value.set(color2);
    mat.uniforms.uColor3.value.set(color3);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]} renderOrder={-1}>
      <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
      <shaderMaterial
        vertexShader={auroraVertexShader}
        fragmentShader={auroraFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
