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
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// ■■ Shared LOD Config for Standard Environments ■■
export interface StandardLOD extends LODState {
  terrainSegments: number;
  skySegments: number;
  instanceCount: number;
  enableFog: boolean;
  enableContactShadows: boolean;
  enableParticles: boolean;
  enableDetailProps: boolean;
}

export function useStandardLOD(): StandardLOD {

  return useMemo(() => {
    const levelConfigs: Record<string, Partial<StandardLOD>> = {
      ultra: {
        terrainSegments: 128,
        skySegments: 48,
        instanceCount: 250,
        enableFog: true,
        enableContactShadows: true,
        enableParticles: true,
        enableDetailProps: true,
      },
      high: {
        terrainSegments: 64,
        skySegments: 32,
        instanceCount: 180,
        enableFog: true,
        enableContactShadows: true,
        enableParticles: true,
        enableDetailProps: true,
      },
      medium: {
        terrainSegments: 48,
        skySegments: 24,
        instanceCount: 100,
        enableFog: true,
        enableContactShadows: false,
        enableParticles: true,
        enableDetailProps: false,
      },
      low: {
        terrainSegments: 24,
        skySegments: 12,
        instanceCount: 40,
        enableFog: false,
        enableContactShadows: false,
        enableParticles: false,
        enableDetailProps: false,
      },
      billboard: {
        terrainSegments: 12,
        skySegments: 8,
        instanceCount: 10,
        enableFog: false,
        enableContactShadows: false,
        enableParticles: false,
        enableDetailProps: false,
      },
    };

    const config = levelConfigs['ultra'] || levelConfigs.high;
    return { ...lod, ...config } as StandardLOD;
  }, [lod]);
}

// ■■ Standard Terrain ■■
interface TerrainProps {
  size?: number;
  color?: string;
  heightScale?: number;
  lod: StandardLOD;
}

export function StandardTerrain({
  size = 20,
  color = '#0A0E16',
  heightScale = 0.1,
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
      const n1 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.4;
      const n2 = Math.sin(x * 1.0 + 1.2) * Math.cos(z * 0.9 + 0.5) * 0.2;
      pos.setZ(i, (n1 + n2) * heightScale * falloff);
    }
    geo.computeVertexNormals();
    return geo;
  }, [size, heightScale, 512]);

  const material = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
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
  lod: StandardLOD;
}

export function StandardSkyDome({
  topColor = '#050810',
  horizonColor = '#0A1628',
  radius = 30,
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

// ■■ Standard Fog Particles ■■
interface FogParticlesProps {
  count?: number;
  color?: string;
  spread?: number;
  lod: StandardLOD;
}

export function StandardFogParticles({
  count: baseCount = 60,
  color = '#00BBFF',
  spread = 8,
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
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
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
  lod: StandardLOD;
  ambientIntensity?: number;
}

export function StandardLightingRig({ labColor, lod, ambientIntensity = 0.3 }: LightingRigProps) {
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
  terrainColor = '#0A0E16',
  skyTopColor = '#050810',
  skyHorizonColor = '#0A1628',
  fogColor,
  heightScale = 0.1,
  terrainSize = 20,
}: StandardEnvironmentBaseProps) {
  const lod = useStandardLOD();

  return (
    <group>
      <StandardLightingRig labColor={labColor} lod={lod} />
      <StandardTerrain size={terrainSize} color={terrainColor} heightScale={heightScale} lod={lod} />
      <StandardSkyDome topColor={skyTopColor} horizonColor={skyHorizonColor} lod={lod} />
      {<StandardFogParticles color={fogColor || labColor} lod={lod} />}
      <Environment preset="night" />
      {children}
    </group>
  );
}

export default StandardEnvironmentWrapper;
