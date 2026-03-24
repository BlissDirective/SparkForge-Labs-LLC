'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  type LabThemeProfile,
  type TierConfig,
  type PropDefinition,
  createSeededRng,
} from '@/lib/3d/proceduralConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProceduralPropsProps {
  theme: LabThemeProfile;
  tierConfig: TierConfig;
}

interface InstancedPropGroupProps {
  prop: PropDefinition;
  labColor: string;
  seed: number;
  tierMultiplier: number;
  spreadRadius: number;
}

// ---------------------------------------------------------------------------
// Geometry factory
// ---------------------------------------------------------------------------

function createGeometryForType(type: PropDefinition['type']): THREE.BufferGeometry {
  switch (type) {
    case 'crystal':
      return new THREE.ConeGeometry(0.5, 1.2, 6);
    case 'cube':
      return new THREE.BoxGeometry(1, 1, 1);
    case 'sphere':
      return new THREE.SphereGeometry(0.5, 12, 8);
    case 'torus':
      return new THREE.TorusGeometry(0.5, 0.15, 8, 24);
    case 'cone':
      return new THREE.ConeGeometry(0.5, 1, 12);
    case 'octahedron':
      return new THREE.OctahedronGeometry(0.5, 0);
    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(0.3, 0);
    case 'cylinder':
      return new THREE.CylinderGeometry(0.3, 0.3, 1, 12);
    case 'ring':
      return new THREE.TorusGeometry(0.6, 0.05, 6, 24);
    case 'icosahedron':
      return new THREE.IcosahedronGeometry(0.4, 1);
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

// ---------------------------------------------------------------------------
// Scratch objects (reused across frames to avoid GC pressure)
// ---------------------------------------------------------------------------

const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();
const _matrix = new THREE.Matrix4();

// ---------------------------------------------------------------------------
// InstancedPropGroup
// ---------------------------------------------------------------------------

interface InstancePlacement {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  s: number;
}

function InstancedPropGroup({
  prop,
  labColor,
  seed,
  tierMultiplier,
  spreadRadius,
}: InstancedPropGroupProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const count = Math.floor(prop.count * tierMultiplier);

  // Memoised geometry
  const geometry = useMemo(() => createGeometryForType(prop.type), [prop.type]);

  // Memoised material
  const resolvedColor = prop.color === 'lab' ? labColor : prop.color;

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(resolvedColor),
      emissive: prop.emissive ? new THREE.Color(resolvedColor) : undefined,
      emissiveIntensity: prop.emissive ? prop.emissiveIntensity : 0,
      metalness: prop.metalness,
      roughness: prop.roughness,
      transparent: prop.emissive,
      opacity: prop.emissive ? 0.7 : 1.0,
    });
    return mat;
  }, [resolvedColor, prop.emissive, prop.emissiveIntensity, prop.metalness, prop.roughness]);

  // Compute initial placements with seeded RNG
  const placements = useMemo<InstancePlacement[]>(() => {
    const rng = createSeededRng(seed);
    const result: InstancePlacement[] = [];

    for (let i = 0; i < count; i++) {
      // Circular distribution
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * spreadRadius; // sqrt for uniform area distribution
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Height: 0.5 to 3.0
      const y = 0.5 + rng() * 2.5;

      // Scale: min + rng * variance  (scale tuple is [min, max, variance])
      const s = prop.scale[0] + rng() * prop.scale[2];

      // Random rotations
      const rx = rng() * Math.PI * 2;
      const ry = rng() * Math.PI * 2;
      const rz = rng() * Math.PI * 2;

      result.push({ x, y, z, rx, ry, rz, s });
    }

    return result;
  }, [seed, count, spreadRadius, prop.scale]);

  // Set initial matrices once the mesh is available
  const initialised = useRef(false);

  const isAnimated = prop.floats || prop.rotates;

  // Apply initial transforms (runs once)
  useMemo(() => {
    initialised.current = false;
  }, [placements]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.getElapsedTime();

    // On first frame (or after placement change), set all matrices
    if (!initialised.current) {
      for (let i = 0; i < count; i++) {
        const p = placements[i];
        _position.set(p.x, p.y, p.z);
        _euler.set(p.rx, p.ry, p.rz);
        _quaternion.setFromEuler(_euler);
        _scale.setScalar(p.s);
        _matrix.compose(_position, _quaternion, _scale);
        mesh.setMatrixAt(i, _matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      initialised.current = true;
    }

    // Animated props: update every frame
    if (isAnimated) {
      for (let i = 0; i < count; i++) {
        const p = placements[i];

        // Y-axis bobbing
        const yOffset = prop.floats
          ? Math.sin(time * 0.8 + i * 1.37) * 0.15
          : 0;

        // Y-axis rotation
        const ryOffset = prop.rotates
          ? time * 0.3 + i * 0.5
          : 0;

        _position.set(p.x, p.y + yOffset, p.z);
        _euler.set(p.rx, p.ry + ryOffset, p.rz);
        _quaternion.setFromEuler(_euler);
        _scale.setScalar(p.s);
        _matrix.compose(_position, _quaternion, _scale);
        mesh.setMatrixAt(i, _matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  if (count <= 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      castShadow
      receiveShadow
    />
  );
}

// ---------------------------------------------------------------------------
// ProceduralProps (main)
// ---------------------------------------------------------------------------

function ProceduralProps({ theme, tierConfig }: ProceduralPropsProps) {
  const tierMultiplier = tierConfig.propCountMultiplier;
  const spreadRadius = tierConfig.terrainSize * 0.35;

  return (
    <group name="procedural-props">
      {theme.props.map((prop, propIndex) => (
        <InstancedPropGroup
          key={`${theme.id}-prop-${propIndex}`}
          prop={prop}
          labColor={theme.labColor}
          seed={theme.seed + 3000 + propIndex * 100}
          tierMultiplier={tierMultiplier}
          spreadRadius={spreadRadius}
        />
      ))}
    </group>
  );
}

export default ProceduralProps;
