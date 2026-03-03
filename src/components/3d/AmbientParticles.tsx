'use client';

// ================================================================
// SparkForge AmbientParticles — Living Data Streams
// ================================================================
// Decision 5.1: Every dashboard page
// Decision 5.5: Intensity slider (Low/Med/High/Off)
// Decision 5.6: Connection lines at Medium+ tied to slider
// Mobile: 100 particles, no connection lines

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Intensity presets from Decision 5.5
const INTENSITY_PRESETS = {
  off: { count: 0, speed: 0, connections: false, opacity: 0 },
  low: { count: 100, speed: 0.2, connections: false, opacity: 0.15 },
  medium: { count: 300, speed: 0.3, connections: true, opacity: 0.2 },
  high: { count: 600, speed: 0.5, connections: true, opacity: 0.25 },
} as const;

type IntensityLevel = keyof typeof INTENSITY_PRESETS;

interface AmbientParticlesProps {
  intensity?: IntensityLevel;
  color?: string;
  baseCount?: number;
  isMobile?: boolean;
}

export function AmbientParticles({
  intensity = 'medium',
  color = '#00BBFF',
  baseCount,
  isMobile = false,
}: AmbientParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const preset = INTENSITY_PRESETS[intensity];
  const count = isMobile
    ? Math.min(preset.count, 100)
    : baseCount || preset.count;
  const showConnections = preset.connections && !isMobile;

  // Generate initial particle positions
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread across viewport area
      pos[i3] = (Math.random() - 0.5) * 20; // x: -10 to 10
      pos[i3 + 1] = (Math.random() - 0.5) * 14; // y: -7 to 7
      pos[i3 + 2] = (Math.random() - 0.5) * 4 - 6; // z: behind frame

      // Slow drift velocity
      vel[i3] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.008;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  // Connection line geometry (pre-allocated buffer)
  const maxConnections = showConnections ? Math.min(count * 2, 600) : 0;
  const linePositions = useMemo(
    () => new Float32Array(maxConnections * 6), // 2 points per line * 3 coords
    [maxConnections]
  );

  // Animate particles
  useFrame(({ clock }) => {
    if (!pointsRef.current || count === 0) return;

    const posAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const time = clock.elapsedTime * preset.speed;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Brownian drift + gentle sine wave
      posArr[i3] +=
        velocities[i3] + Math.sin(time + i * 0.1) * 0.001;
      posArr[i3 + 1] +=
        velocities[i3 + 1] + Math.cos(time + i * 0.15) * 0.001;
      posArr[i3 + 2] += velocities[i3 + 2];

      // Wrap around boundaries
      if (posArr[i3] > 12) posArr[i3] = -12;
      if (posArr[i3] < -12) posArr[i3] = 12;
      if (posArr[i3 + 1] > 9) posArr[i3 + 1] = -9;
      if (posArr[i3 + 1] < -9) posArr[i3 + 1] = 9;
    }
    posAttr.needsUpdate = true;

    // Update connection lines
    if (showConnections && linesRef.current) {
      const lineAttr = linesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const lineArr = lineAttr.array as Float32Array;
      let lineIdx = 0;
      const thresholdSq = 2.5 * 2.5; // Connection distance threshold squared

      for (let i = 0; i < count && lineIdx < maxConnections * 6; i++) {
        const ix = posArr[i * 3];
        const iy = posArr[i * 3 + 1];
        const iz = posArr[i * 3 + 2];

        for (
          let j = i + 1;
          j < count && lineIdx < maxConnections * 6;
          j++
        ) {
          const dx = ix - posArr[j * 3];
          const dy = iy - posArr[j * 3 + 1];
          const dz = iz - posArr[j * 3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < thresholdSq) {
            lineArr[lineIdx++] = ix;
            lineArr[lineIdx++] = iy;
            lineArr[lineIdx++] = iz;
            lineArr[lineIdx++] = posArr[j * 3];
            lineArr[lineIdx++] = posArr[j * 3 + 1];
            lineArr[lineIdx++] = posArr[j * 3 + 2];
          }
        }
      }

      // Zero out remaining
      for (let k = lineIdx; k < maxConnections * 6; k++) {
        lineArr[k] = 0;
      }
      lineAttr.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, lineIdx / 3);
    }
  });

  if (count === 0) return null;

  return (
    <group>
      {/* Particle points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.04}
          transparent
          opacity={preset.opacity}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Connection lines (Decision 5.6) */}
      {showConnections && maxConnections > 0 && (
        <lineSegments ref={linesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={0.06}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}
    </group>
  );
}
