'use client';

// ================================================================
// SparkForge LabPatternBackground — R3F Lab Pattern Renderer
// ================================================================
// Renders the current lab's pattern shader on a fullscreen quad
// behind the station frame. Supports crossfade transitions between
// lab patterns using two overlapping ShaderMaterials.
//
// Decision 3.2 + 4.1: All 10 lab patterns
// Used by: LabReconfiguration.tsx for transition orchestration
// Used in: StationFrame.tsx as replacement for AuroraBackground when in lab mode

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getLabPatternShader } from '@/shaders/labPatterns';

// Lab colors from useStationMode VEC v2 palette
const LAB_COLORS: Record<number, string> = {
  1: '#3B82F6',
  2: '#8B5CF6',
  3: '#EC4899',
  4: '#F59E0B',
  5: '#10B981',
  6: '#EF4444',
  7: '#06B6D4',
  8: '#8B5CF6',
  9: '#10B981',
  10: '#F59E0B',
};

interface LabPatternBackgroundProps {
  labId: number;
  intensity?: number;
  transitionProgress?: number; // 0.0 = previous lab, 1.0 = new lab
  previousLabId?: number | null;
}

export function LabPatternBackground({
  labId,
  intensity = 0.3,
  transitionProgress = 1.0,
  previousLabId = null,
}: LabPatternBackgroundProps) {
  const currentMeshRef = useRef<THREE.Mesh>(null);
  const previousMeshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Current lab shader
  const currentShader = useMemo(() => getLabPatternShader(labId), [labId]);
  const currentUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLabColor: { value: new THREE.Color(LAB_COLORS[labId] || '#3B82F6') },
      uIntensity: { value: intensity },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labId]
  );

  // Previous lab shader (for crossfade)
  const previousShader = useMemo(
    () => (previousLabId ? getLabPatternShader(previousLabId) : null),
    [previousLabId]
  );
  const previousUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLabColor: { value: new THREE.Color(LAB_COLORS[previousLabId || 1] || '#3B82F6') },
      uIntensity: { value: intensity },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previousLabId]
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;

    // Update current shader
    if (currentMeshRef.current) {
      const mat = currentMeshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = time;
      mat.uniforms.uLabColor.value.set(LAB_COLORS[labId] || '#3B82F6');
      mat.uniforms.uIntensity.value = intensity * transitionProgress;
    }

    // Update previous shader (fading out)
    if (previousMeshRef.current && previousLabId) {
      const mat = previousMeshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = time;
      mat.uniforms.uLabColor.value.set(LAB_COLORS[previousLabId] || '#3B82F6');
      mat.uniforms.uIntensity.value = intensity * (1.0 - transitionProgress);
    }
  });

  return (
    <group>
      {/* Previous lab pattern (fading out during transition) */}
      {previousShader && previousLabId && transitionProgress < 1.0 && (
        <mesh ref={previousMeshRef} position={[0, 0, -10.1]} renderOrder={-2}>
          <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
          <shaderMaterial
            vertexShader={previousShader.vertex}
            fragmentShader={previousShader.fragment}
            uniforms={previousUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Current lab pattern */}
      <mesh ref={currentMeshRef} position={[0, 0, -10]} renderOrder={-1}>
        <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
        <shaderMaterial
          vertexShader={currentShader.vertex}
          fragmentShader={currentShader.fragment}
          uniforms={currentUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
