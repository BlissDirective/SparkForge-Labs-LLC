'use client';

// ════════════════════════════════════════════════════
// FlagshipEnvironmentBase — Shared 10M-budget foundation
// ════════════════════════════════════════════════════

// and instanced mesh helpers for all 5 flagship environments.
// Each flagship environment composes this base with game-specific
// meshes, props, and effects to fill their 10M triangle budget.
//
// Triangle Budget Allocation (Desktop Ultra):
//   Ground terrain:     ~400K (512x512 displacement-mapped plane)
//   Sky dome:           ~80K  (hemisphere with gradient)
//   Volumetric fog:     ~200K (instanced mesh particles)
//   Environment props:  ~2M–6M (game-specific instanced meshes)
//   Core 3D scene:      ~500K–2M (existing game 3D component)
//   Particle systems:   ~300K (instanced mesh particles)
//   Reserve:            ~2M+  (future enhancements)

import React, { useRef, useMemo, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import {
  BackSide,
  BufferGeometry,
  Color,
  Euler,
  Group,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from 'three';
import { ProceduralEnvironmentGenerator } from './ProceduralEnvironmentGenerator';
import { ReactiveEnvironmentEffects, useEnvironmentParallax } from './ReactiveEnvironmentEffects';

// ■■ Flagship Environment Constants (Ultra quality) ■■
const _FLAGSHIP_TERRAIN_SEGMENTS = 512;
const _FLAGSHIP_SKY_SEGMENTS = 96;
const _FLAGSHIP_INSTANCE_COUNT = 1000;

// ■■ Terrain Ground Plane ■■
// Displacement-mapped ground with procedural height variation
// ~200K tris at ultra (256×256 segments)
interface TerrainProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
  heightScale?: number;
}

export function Terrain({
  size = 40,
  color = '#0A0E16',
  secondaryColor: _secondaryColor = '#111118',
  heightScale = 0.3,
}: TerrainProps) {
  const meshRef = useRef<Mesh>(null);

  const geometry = useMemo(() => {
    const segs = 512;
    const geo = new PlaneGeometry(size, size, segs, segs);
    const pos = geo.attributes.position;

    // Procedural terrain displacement (layered noise approximation)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const dist = Math.sqrt(x * x + z * z);
      const falloff = Math.max(0, 1 - dist / (size * 0.45));

      // Multi-octave pseudo-noise
      const n1 = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.5;
      const n2 = Math.sin(x * 0.7 + 1.3) * Math.cos(z * 0.9 + 0.7) * 0.25;
      const n3 = Math.sin(x * 1.5 + 3.1) * Math.cos(z * 1.8 + 2.4) * 0.125;

      pos.setZ(i, (n1 + n2 + n3) * heightScale * falloff);
    }

    geo.computeVertexNormals();
    return geo;
  }, [size, heightScale, 512]);

  const material = useMemo(() => {
    return new MeshStandardMaterial({
      color: new Color(color),
      roughness: 0.85,
      metalness: 0.1,
      envMapIntensity: 0.3,
    });
  }, [color]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1, 0]}
      receiveShadow
    />
  );
}

// ■■ Sky Dome ■■
// Gradient hemisphere above scene — ~50K tris at ultra
interface SkyDomeProps {
  topColor?: string;
  horizonColor?: string;
  radius?: number;
}

export function SkyDome({
  topColor = '#050810',
  horizonColor = '#0A1628',
  radius = 50,
}: SkyDomeProps) {
  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      uniforms: {
        topColor: { value: new Color(topColor) },
        horizonColor: { value: new Color(horizonColor) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float t = clamp(h * 1.5, 0.0, 1.0);
          gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
        }
      `,
      side: BackSide,
    });
    return mat;
  }, [topColor, horizonColor]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 96, 96]} />
    </mesh>
  );
}

// ■■ Volumetric Fog Particles ■■
// Instanced mesh fog wisps — ~100K tris at 500 instances
interface FogParticlesProps {
  count?: number;
  color?: string;
  spread?: number;
}

export function FogParticles({
  count: baseCount = 200,
  color = '#00BBFF',
  spread = 15,
}: FogParticlesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const count = Math.min(baseCount, 1000);

  const { matrices, speeds } = useMemo(() => {
    const m: Matrix4[] = [];
    const s: number[] = [];
    const temp = new Matrix4();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread * 2;
      const y = Math.random() * 3 - 0.5;
      const z = (Math.random() - 0.5) * spread * 2;
      const scale = 0.1 + Math.random() * 0.3;

      temp.makeScale(scale, scale * 0.3, scale);
      temp.setPosition(x, y, z);
      m.push(temp.clone());
      s.push(0.2 + Math.random() * 0.5);
    }
    return { matrices: m, speeds: s };
  }, [count, spread]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const temp = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();

    for (let i = 0; i < count; i++) {
      meshRef.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);

      pos.y += speeds[i] * delta * 0.3;
      pos.x += Math.sin(pos.y * 0.5 + i) * delta * 0.1;

      if (pos.y > 4) {
        pos.y = -0.5;
        pos.x = (Math.random() - 0.5) * spread * 2;
        pos.z = (Math.random() - 0.5) * spread * 2;
      }

      temp.compose(pos, quat, scl);
      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Set initial matrices
  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices, count]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.04}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ■■ Instanced Prop Scatter ■■
// Distributes instances of a geometry across the terrain
export interface ScatterConfig {
  geometry: BufferGeometry;
  material: Material;
  count: number;
  spreadX: number;
  spreadZ: number;
  yOffset?: number;
  minScale?: number;
  maxScale?: number;
  castShadow?: boolean;
}

export function InstancedScatter({
  geometry,
  material,
  count,
  spreadX,
  spreadZ,
  yOffset = -1,
  minScale = 0.5,
  maxScale = 1.5,
  castShadow = false,
}: ScatterConfig) {
  const meshRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!meshRef.current) return;
    const temp = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spreadX * 2;
      const z = (Math.random() - 0.5) * spreadZ * 2;
      const scale = minScale + Math.random() * (maxScale - minScale);
      const rotY = Math.random() * Math.PI * 2;

      pos.set(x, yOffset, z);
      quat.setFromEuler(new Euler(0, rotY, 0));
      scl.set(scale, scale, scale);
      temp.compose(pos, quat, scl);

      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, spreadX, spreadZ, yOffset, minScale, maxScale]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow
    />
  );
}

// ■■ Flagship Lighting Rig ■■
// Multi-point light setup for immersive environments
interface LightingRigProps {
  labColor: string;
  ambientIntensity?: number;
}

export function FlagshipLightingRig({
  labColor,
  ambientIntensity = 0.35,
}: LightingRigProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[8, 12, 5]}
        intensity={1.0}
        color="#ffffff"
        castShadow={true}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight
        position={[-6, 4, -4]}
        intensity={0.5}
        color={labColor}
        distance={20}
      />
      <pointLight
        position={[6, 3, 6]}
        intensity={0.3}
        color="#AA66FF"
        distance={15}
      />
      {(
        <pointLight
          position={[0, 8, 0]}
          intensity={0.2}
          color="#00BBFF"
          distance={25}
        />
      )}
      {(
        <ContactShadows
          position={[0, -0.99, 0]}
          opacity={0.4}
          scale={30}
          blur={2.5}
          far={4}
        />
      )}
    </>
  );
}

// ■■ Environment Wrapper ■■
// Composes shared elements for all flagship environments
interface FlagshipEnvironmentBaseProps {
  labColor: string;
  children: ReactNode;
  terrainColor?: string;
  terrainSecondaryColor?: string;
  skyTopColor?: string;
  skyHorizonColor?: string;
  fogColor?: string;
  heightScale?: number;
  terrainSize?: number;
}

export function FlagshipEnvironmentWrapper({
  labColor,
  children,
  terrainColor,
  terrainSecondaryColor: _terrainSecondaryColor,
  skyTopColor,
  skyHorizonColor,
  fogColor,
  heightScale,
  terrainSize,
}: FlagshipEnvironmentBaseProps) {
  const parallaxGroupRef = useRef<Group>(null);
  useEnvironmentParallax(parallaxGroupRef);

  return (
    <group ref={parallaxGroupRef}>
      <ProceduralEnvironmentGenerator
        labColor={labColor}
        tier="flagship"
        terrainColor={terrainColor}
        skyTopColor={skyTopColor}
        skyHorizonColor={skyHorizonColor}
        fogColor={fogColor}
        heightScale={heightScale}
        terrainSize={terrainSize}
      >
        <ReactiveEnvironmentEffects labColor={labColor} tier="flagship" />
        {children}
      </ProceduralEnvironmentGenerator>
    </group>
  );
}

export default FlagshipEnvironmentWrapper;
