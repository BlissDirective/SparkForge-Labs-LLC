'use client';

// ================================================================
// SparkForge AmbientParticles — Living Data Streams (20M Upgrade)
// ================================================================
// Decision 5.1: Every dashboard page
// Decision 5.5: Intensity slider (Low/Med/High/Off)
// Decision 5.6: Connection lines at Medium+ tied to slider
// 20M UPGRADE: Higher-fidelity particle shapes via InstancedMesh,
// enhanced trails with TubeGeometry segments, and volumetric
// glow halos around bright particles.
//
// Triangle budget: ~200,000 (was ~500)
// Mobile: 100 particles, no connections, no trails

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLOD } from '@/hooks/useLOD';

// Intensity presets from Decision 5.5
const INTENSITY_PRESETS = {
  off: { count: 0, speed: 0, connections: false, opacity: 0 },
  low: { count: 200, speed: 0.2, connections: false, opacity: 0.15 },
  medium: { count: 600, speed: 0.3, connections: true, opacity: 0.2 },
  high: { count: 1200, speed: 0.5, connections: true, opacity: 0.25 },
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
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const lod = useLOD({ tier: 'system' });
  const preset = INTENSITY_PRESETS[intensity];
  const count = isMobile
    ? Math.min(preset.count, 100)
    : baseCount || preset.count;
  const showConnections = preset.connections && !isMobile;
  const showTrails = lod.enableEffects && !isMobile;
  const showHalos = lod.enableEffects && !isMobile && intensity === 'high';

  // Particle geometry: icosahedron for higher fidelity
  const particleGeo = useMemo(() => {
    const segments = Math.max(lod.segments >= 32 ? 1 : 0, 0);
    return new THREE.IcosahedronGeometry(1, segments);
  }, [lod.segments]);

  // Trail segment geometry: elongated low-poly capsule
  const trailGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.6, 0.2, 3, 4, 1);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);

  // Halo geometry: flat ring for glow effect
  const haloGeo = useMemo(() => {
    return new THREE.RingGeometry(0.8, 2.0, 8);
  }, []);

  // Generate initial particle data
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);
    // Trail history: 3 previous positions per particle
    const trailHistory = new Float32Array(count * 9);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 14;
      positions[i3 + 2] = (Math.random() - 0.5) * 4 - 6;

      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.008;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;

      phases[i] = Math.random() * Math.PI * 2;
      scales[i] = 0.02 + Math.random() * 0.04;

      // Initialize trail at current position
      for (let t = 0; t < 3; t++) {
        trailHistory[i * 9 + t * 3] = positions[i3];
        trailHistory[i * 9 + t * 3 + 1] = positions[i3 + 1];
        trailHistory[i * 9 + t * 3 + 2] = positions[i3 + 2];
      }
    }
    return { positions, velocities, phases, scales, trailHistory };
  }, [count]);

  // Connection line geometry (pre-allocated buffer)
  const maxConnections = showConnections ? Math.min(count * 2, 1200) : 0;
  const linePositions = useMemo(
    () => new Float32Array(maxConnections * 6),
    [maxConnections]
  );

  const frameCount = useRef(0);

  // Animate particles
  useFrame(({ clock }) => {
    if (!instancedRef.current || count === 0) return;

    const time = clock.elapsedTime * preset.speed;
    const pos = data.positions;
    const vel = data.velocities;
    frameCount.current++;
    const updateTrails = frameCount.current % 3 === 0;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Brownian drift + gentle sine wave
      pos[i3] += vel[i3] + Math.sin(time + i * 0.1) * 0.001;
      pos[i3 + 1] += vel[i3 + 1] + Math.cos(time + i * 0.15) * 0.001;
      pos[i3 + 2] += vel[i3 + 2];

      // Wrap around boundaries
      if (pos[i3] > 12) pos[i3] = -12;
      if (pos[i3] < -12) pos[i3] = 12;
      if (pos[i3 + 1] > 9) pos[i3 + 1] = -9;
      if (pos[i3 + 1] < -9) pos[i3 + 1] = 9;

      // Update trail history
      if (updateTrails && showTrails) {
        const ti = i * 9;
        data.trailHistory[ti + 6] = data.trailHistory[ti + 3];
        data.trailHistory[ti + 7] = data.trailHistory[ti + 4];
        data.trailHistory[ti + 8] = data.trailHistory[ti + 5];
        data.trailHistory[ti + 3] = data.trailHistory[ti];
        data.trailHistory[ti + 4] = data.trailHistory[ti + 1];
        data.trailHistory[ti + 5] = data.trailHistory[ti + 2];
        data.trailHistory[ti] = pos[i3];
        data.trailHistory[ti + 1] = pos[i3 + 1];
        data.trailHistory[ti + 2] = pos[i3 + 2];
      }

      // Set particle instance matrix
      const s = data.scales[i] * (0.8 + Math.sin(time * 2 + data.phases[i]) * 0.2);
      dummy.position.set(pos[i3], pos[i3 + 1], pos[i3 + 2]);
      dummy.scale.setScalar(s);
      dummy.rotation.y = time * 0.5 + data.phases[i];
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;

    // Update trail instances
    if (trailRef.current && showTrails && updateTrails) {
      for (let i = 0; i < count; i++) {
        const ti = i * 9;
        for (let seg = 0; seg < 3; seg++) {
          const idx = i * 3 + seg;
          const sx = data.trailHistory[ti + seg * 3];
          const sy = data.trailHistory[ti + seg * 3 + 1];
          const sz = data.trailHistory[ti + seg * 3 + 2];
          dummy.position.set(sx, sy, sz);
          const trailScale = data.scales[i] * (0.5 - seg * 0.12);
          dummy.scale.set(trailScale, trailScale, trailScale * 2);
          dummy.lookAt(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          dummy.updateMatrix();
          trailRef.current!.setMatrixAt(idx, dummy.matrix);
        }
      }
      trailRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update halo instances (only bright particles, every 4th)
    if (haloRef.current && showHalos) {
      const haloCount = Math.floor(count / 4);
      for (let i = 0; i < haloCount; i++) {
        const pi = i * 4; // every 4th particle
        const i3 = pi * 3;
        dummy.position.set(pos[i3], pos[i3 + 1], pos[i3 + 2]);
        const haloScale = data.scales[pi] * 3 * (0.8 + Math.sin(time * 3 + data.phases[pi]) * 0.3);
        dummy.scale.setScalar(haloScale);
        dummy.updateMatrix();
        haloRef.current.setMatrixAt(i, dummy.matrix);
      }
      haloRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update connection lines
    if (showConnections && linesRef.current) {
      const lineAttr = linesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const lineArr = lineAttr.array as Float32Array;
      let lineIdx = 0;
      const thresholdSq = 2.5 * 2.5;

      for (let i = 0; i < count && lineIdx < maxConnections * 6; i++) {
        const ix = pos[i * 3];
        const iy = pos[i * 3 + 1];
        const iz = pos[i * 3 + 2];

        for (let j = i + 1; j < count && lineIdx < maxConnections * 6; j++) {
          const dx = ix - pos[j * 3];
          const dy = iy - pos[j * 3 + 1];
          const dz = iz - pos[j * 3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < thresholdSq) {
            lineArr[lineIdx++] = ix;
            lineArr[lineIdx++] = iy;
            lineArr[lineIdx++] = iz;
            lineArr[lineIdx++] = pos[j * 3];
            lineArr[lineIdx++] = pos[j * 3 + 1];
            lineArr[lineIdx++] = pos[j * 3 + 2];
          }
        }
      }

      for (let k = lineIdx; k < maxConnections * 6; k++) {
        lineArr[k] = 0;
      }
      lineAttr.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, lineIdx / 3);
    }
  });

  if (count === 0) return null;

  const haloCount = showHalos ? Math.floor(count / 4) : 0;

  return (
    <group>
      {/* High-fidelity instanced particles */}
      <instancedMesh ref={instancedRef} args={[particleGeo, undefined, count]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={preset.opacity}
          roughness={0.4}
          metalness={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Particle trails (3 segments per particle) */}
      {showTrails && (
        <instancedMesh ref={trailRef} args={[trailGeo, undefined, count * 3]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.06}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>
      )}

      {/* Volumetric glow halos (every 4th particle at high intensity) */}
      {showHalos && haloCount > 0 && (
        <instancedMesh ref={haloRef} args={[haloGeo, undefined, haloCount]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.03}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>
      )}

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
