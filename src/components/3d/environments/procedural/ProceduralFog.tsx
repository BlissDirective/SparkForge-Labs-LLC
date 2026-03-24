'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  LabThemeProfile,
  TierConfig,
  createSeededRng,
} from '@/lib/3d/proceduralConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProceduralFogProps {
  theme: LabThemeProfile;
  tierConfig: TierConfig;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function initParticlePositions(
  count: number,
  spread: number,
  rng: () => number,
): Float32Array {
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    data[i3] = (rng() - 0.5) * spread;          // x
    data[i3 + 1] = rng() * spread * 0.6;         // y — bottom-biased
    data[i3 + 2] = (rng() - 0.5) * spread;       // z
  }
  return data;
}

function initParticleScales(
  count: number,
  baseScale: number,
  rng: () => number,
): Float32Array {
  const data = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = baseScale * (0.6 + rng() * 0.8);
  }
  return data;
}

// ---------------------------------------------------------------------------
// ProceduralFog component
// ---------------------------------------------------------------------------

export default function ProceduralFog({ theme, tierConfig }: ProceduralFogProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = tierConfig.fogCount;
  const spread = theme.fog?.spread ?? 20;
  const baseScale = theme.fog?.particleScale ?? 0.25;
  const opacity = theme.fog?.opacity ?? 0.035;
  const behavior = theme.fog?.behavior ?? 'drift';

  // Seeded initial state
  const { positions, scales } = useMemo(() => {
    const rng = createSeededRng(theme.seed + 2000);
    return {
      positions: initParticlePositions(count, spread, rng),
      scales: initParticleScales(count, baseScale, rng),
    };
  }, [count, spread, baseScale, theme.seed]);

  // Geometry + material (memoized)
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 5, 3), []);
  const material = useMemo(() => {
    _color.set(theme.labColor);
    return new THREE.MeshBasicMaterial({
      color: _color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
  }, [theme.labColor, opacity]);

  // Set initial transforms
  useMemo(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const s = scales[i];
      _dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      _dummy.scale.setScalar(s);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meshRef.current, count, positions, scales]);

  // Per-frame animation
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const halfSpread = spread * 0.5;
    const topY = spread * 0.6;
    const t = performance.now() * 0.001;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];
      const s = scales[i];
      const phase = i * 1.618; // golden-ratio offset per particle

      switch (behavior) {
        case 'drift': {
          y += delta * 0.3;
          x += Math.sin(t * 0.4 + phase) * delta * 0.15;
          z += Math.cos(t * 0.35 + phase) * delta * 0.1;
          break;
        }
        case 'sparkle': {
          x += (Math.sin(t * 8 + phase) * 0.02);
          y += (Math.cos(t * 6 + phase) * 0.02);
          z += (Math.sin(t * 7 + phase * 0.7) * 0.02);
          break;
        }
        case 'swirl': {
          const angle = t * 0.5 + phase;
          const radius = 0.15;
          x += Math.cos(angle) * radius * delta;
          z += Math.sin(angle) * radius * delta;
          y += delta * 0.15;
          break;
        }
        case 'pulse': {
          const pulseScale = 1 + Math.sin(t * 2 + phase) * 0.3;
          _dummy.scale.setScalar(s * pulseScale);
          x += Math.sin(t * 0.2 + phase) * delta * 0.1;
          y += delta * 0.1;
          break;
        }
        case 'rise': {
          y += delta * 0.8;
          x += Math.sin(t * 0.6 + phase) * delta * 0.08;
          z += Math.cos(t * 0.5 + phase) * delta * 0.08;
          break;
        }
      }

      // Boundary reset — particles that exit top respawn at bottom
      if (y > topY) {
        y = -0.5;
        x = (((i * 7919) % 1000) / 1000 - 0.5) * spread;
        z = (((i * 6271) % 1000) / 1000 - 0.5) * spread;
      }

      // Horizontal wrap
      if (x > halfSpread) x = -halfSpread;
      if (x < -halfSpread) x = halfSpread;
      if (z > halfSpread) z = -halfSpread;
      if (z < -halfSpread) z = halfSpread;

      // Write back
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      _dummy.position.set(x, y, z);
      if (behavior !== 'pulse') {
        _dummy.scale.setScalar(s);
      }
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
