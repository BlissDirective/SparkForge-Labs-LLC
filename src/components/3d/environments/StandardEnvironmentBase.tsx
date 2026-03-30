'use client';

// ════════════════════════════════════════════════════
// StandardEnvironmentBase — Shared 500K-budget foundation
// ════════════════════════════════════════════════════

// all 20 Standard tier game environments. Upgraded from
// 10K-25K to 500K triangle budget per game.
//
// Triangle Budget Allocation (Desktop Ultra):
//   Ground terrain:     ~30K  (128x128 displacement)
//   Sky dome:           ~16K  (hemisphere with gradient)
//   Volumetric fog:     ~20K  (instanced mesh particles)
//   Environment props:  ~350K–400K (game-specific)
//   Particle systems:   ~30K
//   Reserve:            ~30K+ (future enhancements)

import React, { useRef, useMemo, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import {
  BackSide,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from 'three';
import { ProceduralEnvironmentGenerator } from './ProceduralEnvironmentGenerator';
import { ReactiveEnvironmentEffects, useEnvironmentParallax } from './ReactiveEnvironmentEffects';

// ■■ Standard Environment Constants (Ultra quality) ■■
const _STANDARD_TERRAIN_SEGMENTS = 128;
const _STANDARD_SKY_SEGMENTS = 48;
const _STANDARD_INSTANCE_COUNT = 250;

// ■■ Standard Terrain ■■
interface TerrainProps {
  size?: number;
  color?: string;
  heightScale?: number;
}

export function StandardTerrain({
  size = 20,
  color = '#0A0E16',
  heightScale = 0.1,
}: TerrainProps) {
  const geometry = useMemo(() => {
    const segs = 512;
    const geo = new PlaneGeometry(size, size, segs, segs);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const dist = Math.sqrt(x * x + z * z);
      const falloff = Math.max(0, 1 - dist / (size * 0.45));
      const n1 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.4;
      const n2 = Math.sin(x * 1.0 + 1.2) * Math.cos(z * 0.9 + 0.5) * 0.2;
      pos.setZ(i, (n1 + n2) * heightScale * falloff);
    }
    geo.computeVertexNormals();
    return geo;
  }, [size, heightScale]);

  const material = useMemo(() =>
    new MeshStandardMaterial({
      color: new Color(color),
      roughness: 0.9,
      metalness: 0.05,
      envMapIntensity: 0.2,
    }),
  [color]);

  return (
    <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow />
  );
}

// ■■ Standard Sky Dome ■■
interface SkyDomeProps {
  topColor?: string;
  horizonColor?: string;
  radius?: number;
}

export function StandardSkyDome({
  topColor = '#050810',
  horizonColor = '#0A1628',
  radius = 30,
}: SkyDomeProps) {
  const material = useMemo(() =>
    new ShaderMaterial({
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
    }),
  [topColor, horizonColor]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 96, 96]} />
    </mesh>
  );
}

// ■■ Standard Fog Particles ■■
interface FogParticlesProps {
  count?: number;
  color?: string;
  spread?: number;
}

export function StandardFogParticles({
  count: baseCount = 60,
  color = '#00BBFF',
  spread = 8,
}: FogParticlesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const count = Math.min(baseCount, 1000);

  const { matrices, speeds } = useMemo(() => {
    const m: Matrix4[] = [];
    const s: number[] = [];
    const temp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread * 2;
      const y = Math.random() * 2.0 - 0.5;
      const z = (Math.random() - 0.5) * spread * 2;
      const scale = 0.06 + Math.random() * 0.15;
      temp.makeScale(scale, scale * 0.3, scale);
      temp.setPosition(x, y, z);
      m.push(temp.clone());
      s.push(0.15 + Math.random() * 0.35);
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
      pos.y += speeds[i] * delta * 0.2;
      pos.x += Math.sin(pos.y * 0.4 + i) * delta * 0.06;
      if (pos.y > 2.5) {
        pos.y = -0.5;
        pos.x = (Math.random() - 0.5) * spread * 2;
        pos.z = (Math.random() - 0.5) * spread * 2;
      }
      temp.compose(pos, quat, scl);
      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) meshRef.current.setMatrixAt(i, matrices[i]);
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices, count]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 5, 3]} />
      <meshBasicMaterial color={color} transparent opacity={0.035} depthWrite={false} />
    </instancedMesh>
  );
}

// ■■ Standard Lighting Rig ■■
interface LightingRigProps {
  labColor: string;
  ambientIntensity?: number;
}

export function StandardLightingRig({ labColor, ambientIntensity = 0.3 }: LightingRigProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={0.8}
        color="#ffffff"
        castShadow={true}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-3, 2.5, -2]} intensity={0.35} color={labColor} distance={12} />
      <pointLight position={[3, 1.5, 3]} intensity={0.2} color="#AA66FF" distance={10} />
      {(
        <ContactShadows position={[0, -0.99, 0]} opacity={0.3} scale={16} blur={2} far={2.5} />
      )}
    </>
  );
}

// ■■ Standard Environment Wrapper ■■
interface StandardEnvironmentBaseProps {
  labColor: string;
  children: ReactNode;
  terrainColor?: string;
  skyTopColor?: string;
  skyHorizonColor?: string;
  fogColor?: string;
  heightScale?: number;
  terrainSize?: number;
}

export function StandardEnvironmentWrapper({
  labColor,
  children,
  terrainColor,
  skyTopColor,
  skyHorizonColor,
  fogColor,
  heightScale,
  terrainSize,
}: StandardEnvironmentBaseProps) {
  const parallaxGroupRef = useRef<Group>(null);
  useEnvironmentParallax(parallaxGroupRef);

  return (
    <group ref={parallaxGroupRef}>
      <ProceduralEnvironmentGenerator
        labColor={labColor}
        tier="standard"
        terrainColor={terrainColor}
        skyTopColor={skyTopColor}
        skyHorizonColor={skyHorizonColor}
        fogColor={fogColor}
        heightScale={heightScale}
        terrainSize={terrainSize}
      >
        <ReactiveEnvironmentEffects labColor={labColor} tier="standard" />
        {children}
      </ProceduralEnvironmentGenerator>
    </group>
  );
}

export default StandardEnvironmentWrapper;
