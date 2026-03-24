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
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// ■■ Shared LOD Config for FL-Lite Environments ■■
export interface FLLiteLOD extends LODState {
  terrainSegments: number;
  skySegments: number;
  instanceCount: number;
  enableFog: boolean;
  enableContactShadows: boolean;
  enableParticles: boolean;
  enableDetailProps: boolean;
}

export function useFLLiteLOD(): FLLiteLOD {

  return useMemo(() => {
    const levelConfigs: Record<string, Partial<FLLiteLOD>> = {
      ultra: {
        terrainSegments: 256,
        skySegments: 64,
        instanceCount: 500,
        enableFog: true,
        enableContactShadows: true,
        enableParticles: true,
        enableDetailProps: true,
      },
      high: {
        terrainSegments: 128,
        skySegments: 48,
        instanceCount: 300,
        enableFog: true,
        enableContactShadows: true,
        enableParticles: true,
        enableDetailProps: true,
      },
      medium: {
        terrainSegments: 64,
        skySegments: 32,
        instanceCount: 150,
        enableFog: true,
        enableContactShadows: false,
        enableParticles: true,
        enableDetailProps: false,
      },
      low: {
        terrainSegments: 32,
        skySegments: 16,
        instanceCount: 50,
        enableFog: false,
        enableContactShadows: false,
        enableParticles: false,
        enableDetailProps: false,
      },
      billboard: {
        terrainSegments: 16,
        skySegments: 8,
        instanceCount: 10,
        enableFog: false,
        enableContactShadows: false,
        enableParticles: false,
        enableDetailProps: false,
      },
    };

    const config = levelConfigs['ultra'] || levelConfigs.high;
    return { ...lod, ...config } as FLLiteLOD;
  }, [lod]);
}

// ■■ FL-Lite Terrain ■■
interface TerrainProps {
  size?: number;
  color?: string;
  heightScale?: number;
  lod: FLLiteLOD;
}

export function FLLiteTerrain({
  size = 30,
  color = '#0A0E16',
  heightScale = 0.15,
  lod,
}: TerrainProps) {
  const geometry = useMemo(() => {
    const segs = 512;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
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
    new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.85, metalness: 0.1, envMapIntensity: 0.3 }),
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
  lod: FLLiteLOD;
}

export function FLLiteSkyDome({
  topColor = '#050810',
  horizonColor = '#0A1628',
  radius = 40,
  lod,
}: SkyDomeProps) {
  const material = useMemo(() =>
    new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(topColor) },
        horizonColor: { value: new THREE.Color(horizonColor) },
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
      side: THREE.BackSide,
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
  lod: FLLiteLOD;
}

export function FLLiteFogParticles({
  count: baseCount = 100,
  color = '#00BBFF',
  spread = 10,
  lod,
}: FogParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = Math.min(baseCount, 1000);

  const { matrices, speeds } = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    const s: number[] = [];
    const temp = new THREE.Matrix4();
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
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
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
  lod: FLLiteLOD;
  ambientIntensity?: number;
}

export function FLLiteLightingRig({ labColor, lod, ambientIntensity = 0.35 }: LightingRigProps) {
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
  terrainColor = '#0A0E16',
  skyTopColor = '#050810',
  skyHorizonColor = '#0A1628',
  fogColor,
  heightScale = 0.15,
  terrainSize = 30,
}: FLLiteEnvironmentBaseProps) {
  const lod = useFLLiteLOD();

  return (
    <group>
      <FLLiteLightingRig labColor={labColor} lod={lod} />
      <FLLiteTerrain size={terrainSize} color={terrainColor} heightScale={heightScale} lod={lod} />
      <FLLiteSkyDome topColor={skyTopColor} horizonColor={skyHorizonColor} lod={lod} />
      {<FLLiteFogParticles color={fogColor || labColor} lod={lod} />}
      <Environment preset="night" />
      {children}
    </group>
  );
}

export default FLLiteEnvironmentWrapper;
