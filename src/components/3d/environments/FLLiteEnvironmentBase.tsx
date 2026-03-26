'use client';

// ════════════════════════════════════════════════════
// FLLiteEnvironmentBase — Shared 2M-budget foundation
// ════════════════════════════════════════════════════

// all 9 FL-Lite game environments. Lighter than Flagship
// base but still fully immersive at 2M triangle budget.
//
// Triangle Budget Allocation (Desktop Ultra):
//   Ground terrain:     ~100K (256x256 displacement)
//   Sky dome:           ~40K  (hemisphere with gradient)
//   Volumetric fog:     ~60K  (instanced mesh particles)
//   Environment props:  ~800K–1.5M (game-specific)
//   Particle systems:   ~100K
//   Reserve:            ~200K+ (future enhancements)

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

// ■■ FL-Lite Environment Constants (Ultra quality) ■■
const _FLLITE_TERRAIN_SEGMENTS = 256;
const _FLLITE_SKY_SEGMENTS = 64;
const _FLLITE_INSTANCE_COUNT = 500;

// ■■ FL-Lite Terrain ■■
interface TerrainProps {
  size?: number;
  color?: string;
  heightScale?: number;
}

export function FLLiteTerrain({
  size = 30,
  color = '#0A0E16',
  heightScale = 0.15,
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
      const n1 = Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.5;
      const n2 = Math.sin(x * 0.8 + 1.5) * Math.cos(z * 1.0 + 0.8) * 0.25;
      pos.setZ(i, (n1 + n2) * heightScale * falloff);
    }
    geo.computeVertexNormals();
    return geo;
  }, [size, heightScale, 512]);

  const material = useMemo(() =>
    new MeshStandardMaterial({ color: new Color(color), roughness: 0.85, metalness: 0.1, envMapIntensity: 0.3 }),
  [color]);

  return (
    <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow />
  );
}

// ■■ FL-Lite Sky Dome ■■
interface SkyDomeProps {
  topColor?: string;
  horizonColor?: string;
  radius?: number;
}

export function FLLiteSkyDome({
  topColor = '#050810',
  horizonColor = '#0A1628',
  radius = 40,
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

// ■■ FL-Lite Fog Particles ■■
interface FogParticlesProps {
  count?: number;
  color?: string;
  spread?: number;
}

export function FLLiteFogParticles({
  count: baseCount = 100,
  color = '#00BBFF',
  spread = 10,
}: FogParticlesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const count = Math.min(baseCount, 1000);

  const { matrices, speeds } = useMemo(() => {
    const m: Matrix4[] = [];
    const s: number[] = [];
    const temp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread * 2;
      const y = Math.random() * 2.5 - 0.5;
      const z = (Math.random() - 0.5) * spread * 2;
      const scale = 0.08 + Math.random() * 0.2;
      temp.makeScale(scale, scale * 0.3, scale);
      temp.setPosition(x, y, z);
      m.push(temp.clone());
      s.push(0.2 + Math.random() * 0.4);
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
      pos.y += speeds[i] * delta * 0.25;
      pos.x += Math.sin(pos.y * 0.5 + i) * delta * 0.08;
      if (pos.y > 3) {
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
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.04} depthWrite={false} />
    </instancedMesh>
  );
}

// ■■ FL-Lite Lighting Rig ■■
interface LightingRigProps {
  labColor: string;
  ambientIntensity?: number;
}

export function FLLiteLightingRig({ labColor, ambientIntensity = 0.35 }: LightingRigProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={0.9}
        color="#ffffff"
        castShadow={true}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight position={[-4, 3, -3]} intensity={0.4} color={labColor} distance={15} />
      <pointLight position={[4, 2, 4]} intensity={0.25} color="#AA66FF" distance={12} />
      {(
        <ContactShadows position={[0, -0.99, 0]} opacity={0.35} scale={20} blur={2} far={3} />
      )}
    </>
  );
}

// ■■ FL-Lite Environment Wrapper ■■
interface FLLiteEnvironmentBaseProps {
  labColor: string;
  children: ReactNode;
  terrainColor?: string;
  skyTopColor?: string;
  skyHorizonColor?: string;
  fogColor?: string;
  heightScale?: number;
  terrainSize?: number;
}

export function FLLiteEnvironmentWrapper({
  labColor,
  children,
  terrainColor,
  skyTopColor,
  skyHorizonColor,
  fogColor,
  heightScale,
  terrainSize,
}: FLLiteEnvironmentBaseProps) {
  const parallaxGroupRef = useRef<Group>(null);
  useEnvironmentParallax(parallaxGroupRef);

  return (
    <group ref={parallaxGroupRef}>
      <ProceduralEnvironmentGenerator
        labColor={labColor}
        tier="fl-lite"
        terrainColor={terrainColor}
        skyTopColor={skyTopColor}
        skyHorizonColor={skyHorizonColor}
        fogColor={fogColor}
        heightScale={heightScale}
        terrainSize={terrainSize}
      >
        <ReactiveEnvironmentEffects labColor={labColor} tier="fl-lite" />
        {children}
      </ProceduralEnvironmentGenerator>
    </group>
  );
}

export default FLLiteEnvironmentWrapper;
