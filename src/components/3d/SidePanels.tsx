'use client';

// ================================================================
// CPA v1.0 — SidePanels: Left Radar + Right Terminal
// ================================================================
// Decision CPA-6: Left=radar/labNav, Right=terminal/stats
//
// Left panel: Animated radar sweep shader with lab dot indicators
// Right panel: Scrolling data stream with bar graphs
//
// PlaneGeometry panels positioned at edges of curved cockpit.
// Material: PanelFace base with shader textures.
// Triangle budget: ~100 tris total (2 planes + minor geometry)

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  radarSweepVertexShader,
  radarSweepFragmentShader,
  dataStreamVertexShader,
  dataStreamFragmentShader,
} from '@/shaders/index';
import type { SidePanelContent } from '@/lib/3d/cockpitConfig';

interface SidePanelsProps {
  leftContent: SidePanelContent;
  rightContent: SidePanelContent;
  opacity: number;
  labColor: string;
  dimmed: boolean;
}

export function SidePanels({
  leftContent: _leftContent,
  rightContent: _rightContent,
  opacity,
  labColor,
  dimmed,
}: SidePanelsProps) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);

  const labColorVec = useMemo(() => new THREE.Color(labColor), [labColor]);

  // Radar sweep shader material (left panel)
  const radarUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: labColorVec },
      uIntensity: { value: 1.0 },
      uSweepSpeed: { value: 1.5 },
    }),
    [labColorVec]
  );

  // Data stream shader material (right panel)
  const dataUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: labColorVec },
      uIntensity: { value: 1.0 },
      uScrollSpeed: { value: 0.8 },
    }),
    [labColorVec]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    radarUniforms.uTime.value = t;
    radarUniforms.uIntensity.value = dimmed ? 0.1 : opacity;
    radarUniforms.uColor.value = labColorVec;

    dataUniforms.uTime.value = t;
    dataUniforms.uIntensity.value = dimmed ? 0.1 : opacity;
    dataUniforms.uColor.value = labColorVec;
  });

  if (opacity <= 0) return null;

  return (
    <group>
      {/* Left panel — radar/labNav motif */}
      <mesh
        ref={leftRef}
        position={[-5.5, 0, -2]}
        rotation={[0, 0.3, 0]}
      >
        <planeGeometry args={[1.8, 3.5]} />
        <shaderMaterial
          vertexShader={radarSweepVertexShader}
          fragmentShader={radarSweepFragmentShader}
          uniforms={radarUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left panel backing (PanelFace) */}
      <mesh position={[-5.5, 0, -2.05]} rotation={[0, 0.3, 0]}>
        <planeGeometry args={[1.9, 3.6]} />
        <meshStandardMaterial
          color="#1a1e2e"
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={opacity * 0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Right panel — terminal/stats motif */}
      <mesh
        ref={rightRef}
        position={[5.5, 0, -2]}
        rotation={[0, -0.3, 0]}
      >
        <planeGeometry args={[1.8, 3.5]} />
        <shaderMaterial
          vertexShader={dataStreamVertexShader}
          fragmentShader={dataStreamFragmentShader}
          uniforms={dataUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right panel backing (PanelFace) */}
      <mesh position={[5.5, 0, -2.05]} rotation={[0, -0.3, 0]}>
        <planeGeometry args={[1.9, 3.6]} />
        <meshStandardMaterial
          color="#1a1e2e"
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={opacity * 0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
