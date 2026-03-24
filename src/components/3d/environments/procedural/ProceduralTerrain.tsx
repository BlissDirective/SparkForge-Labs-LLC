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

interface ProceduralTerrainProps {
  theme: LabThemeProfile;
  tierConfig: TierConfig;
}

// ---------------------------------------------------------------------------
// Seeded 2D noise via hash-based lookup + bicubic-style interpolation
// ---------------------------------------------------------------------------

const NOISE_TABLE_SIZE = 256;

function buildNoiseTable(rng: () => number): Float32Array {
  const table = new Float32Array(NOISE_TABLE_SIZE * NOISE_TABLE_SIZE);
  for (let i = 0; i < table.length; i++) {
    table[i] = rng() * 2 - 1; // range [-1, 1]
  }
  return table;
}

function sampleNoise(table: Float32Array, x: number, z: number): number {
  const size = NOISE_TABLE_SIZE;
  // Wrap coordinates
  const fx = ((x % size) + size) % size;
  const fz = ((z % size) + size) % size;

  const ix = Math.floor(fx);
  const iz = Math.floor(fz);
  const tx = fx - ix;
  const tz = fz - iz;

  // Smoothstep for interpolation
  const sx = tx * tx * (3 - 2 * tx);
  const sz = tz * tz * (3 - 2 * tz);

  const idx = (r: number, c: number) => (r % size) * size + (c % size);

  const v00 = table[idx(iz, ix)];
  const v10 = table[idx(iz, ix + 1)];
  const v01 = table[idx(iz + 1, ix)];
  const v11 = table[idx(iz + 1, ix + 1)];

  const a = v00 + sx * (v10 - v00);
  const b = v01 + sx * (v11 - v01);

  return a + sz * (b - a);
}

function fbm(
  table: Float32Array,
  x: number,
  z: number,
  octaves: number,
  frequency: number,
  amplitude: number,
  lacunarity: number,
  persistence: number,
): number {
  let value = 0;
  let freq = frequency;
  let amp = amplitude;

  for (let o = 0; o < octaves; o++) {
    value += sampleNoise(table, x * freq, z * freq) * amp;
    freq *= lacunarity;
    amp *= persistence;
  }

  return value;
}

// ---------------------------------------------------------------------------
// Geometry builder
// ---------------------------------------------------------------------------

function buildTerrainGeometry(
  theme: LabThemeProfile,
  tierConfig: TierConfig,
): THREE.PlaneGeometry {
  const { terrainSize, segments, heightScale } = tierConfig;
  const { seed, noise } = theme;
  const { octaves, frequency, amplitude, lacunarity, persistence, warpStrength } = noise;

  const rng = createSeededRng(seed);
  const noiseTable = buildNoiseTable(rng);

  const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const count = pos.count;

  const halfSize = terrainSize / 2;

  for (let i = 0; i < count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);

    // Domain warping — offset coordinates based on neighbor noise
    const warpX = Math.sin(
      fbm(noiseTable, px + 31.7, py + 47.3, octaves, frequency * 0.8, 1, lacunarity, persistence),
    ) * warpStrength;
    const warpZ = Math.cos(
      fbm(noiseTable, px + 73.1, py + 11.9, octaves, frequency * 0.8, 1, lacunarity, persistence),
    ) * warpStrength;

    const wx = px + warpX;
    const wz = py + warpZ;

    // Multi-octave FBM height
    let height = fbm(noiseTable, wx, wz, octaves, frequency, amplitude, lacunarity, persistence);

    // Radial falloff — flatten edges smoothly
    const dx = px / halfSize;
    const dz = py / halfSize;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const falloff = Math.max(0, 1 - dist * dist);
    height *= falloff;

    // Apply height scale to Z (PlaneGeometry lies in XY, Z is "up" before rotation)
    pos.setZ(i, height * heightScale);
  }

  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// Grid floor overlay
// ---------------------------------------------------------------------------

function GridFloorOverlay({ theme, tierConfig }: ProceduralTerrainProps) {
  const gridColor = new THREE.Color(theme.terrainColor);
  const lineCount = 24;
  const size = tierConfig.terrainSize;
  const spacing = size / lineCount;
  const lineThickness = 0.02;
  const lineHeight = 0.005;

  const boxGeo = useMemo(
    () => new THREE.BoxGeometry(size, lineThickness, lineHeight),
    [size],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: gridColor,
        emissive: gridColor,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    [gridColor],
  );

  const lines = useMemo(() => {
    const result: THREE.Vector3[] = [];
    const half = size / 2;
    for (let i = 0; i <= lineCount; i++) {
      const offset = -half + i * spacing;
      // Horizontal lines (along X)
      result.push(new THREE.Vector3(0, offset, 0.01));
      // Vertical lines (along Z) — will be rotated 90 deg
      result.push(new THREE.Vector3(offset, 0, 0.01));
    }
    return result;
  }, [size, spacing]);

  return (
    <group>
      {lines.map((pos, idx) => {
        const isVertical = idx % 2 === 1;
        return (
          <mesh
            key={idx}
            geometry={boxGeo}
            material={material}
            position={pos}
            rotation={isVertical ? [0, 0, Math.PI / 2] : [0, 0, 0]}
          />
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// ProceduralTerrain component
// ---------------------------------------------------------------------------

export default function ProceduralTerrain({ theme, tierConfig }: ProceduralTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(
    () => buildTerrainGeometry(theme, tierConfig),
    [
      theme.seed,
      tierConfig.segments,
      tierConfig.terrainSize,
      tierConfig.heightScale,
      theme.noise.octaves,
      theme.noise.frequency,
      theme.noise.amplitude,
      theme.noise.lacunarity,
      theme.noise.persistence,
      theme.noise.warpStrength,
    ],
  );

  const terrainColor = useMemo(() => new THREE.Color(theme.terrainColor), [theme.terrainColor]);

  return (
    <group position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color={terrainColor}
          roughness={0.9}
          metalness={0.05}
          envMapIntensity={0.2}
        />
      </mesh>
      {theme.gridFloor && <GridFloorOverlay theme={theme} tierConfig={tierConfig} />}
    </group>
  );
}
