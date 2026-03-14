'use client';

// ================================================================
// SparkForge CockpitSkinManager — Cockpit Visual Theme Engine
// ================================================================
// Enhancement 1.2: Cockpit Personalization Engine
// Manages environmental visuals (lighting, fog, particles, background)
// based on the active cockpit skin selected by the child.
//
// 5 skins: default (Frost-Prismatic), cyberpunk, space, underwater, crystal
// Smooth color lerping over 1 second when switching skins.
// ~5,000 triangle budget for skin elements.

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useCockpitStore, type CockpitSkin } from '@/stores/cockpitStore';
import { useDeviceStore } from '@/stores/deviceStore';

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface CockpitSkinManagerProps {
  intensity?: number; // 0-1, overall effect intensity
}

interface SkinDefinition {
  ambient: {
    baseColor: string;
    skyColor: string;
    groundColor: string;
    hemisphereIntensity: number;
  };
  fog: {
    enabled: boolean;
    color: string;
    density: number;
  };
  particles: {
    colors: string[];
    count: number;
    size: number;
    speed: number;
    behavior: 'drift' | 'rise' | 'sparkle' | 'orbit';
  };
}

// ────────────────────────────────────────
// Skin Definitions
// ────────────────────────────────────────

const SKIN_DEFINITIONS: Record<CockpitSkin, SkinDefinition> = {
  default: {
    ambient: {
      baseColor: '#0A0E16',
      skyColor: '#00BBFF',
      groundColor: '#0A0E16',
      hemisphereIntensity: 0.4,
    },
    fog: { enabled: false, color: '#0A0E16', density: 0 },
    particles: {
      colors: ['#00BBFF'],
      count: 120,
      size: 0.03,
      speed: 0.15,
      behavior: 'drift',
    },
  },
  cyberpunk: {
    ambient: {
      baseColor: '#1A0020',
      skyColor: '#FF00FF',
      groundColor: '#1A0020',
      hemisphereIntensity: 0.5,
    },
    fog: { enabled: true, color: '#1A0020', density: 0.015 },
    particles: {
      colors: ['#FF00FF', '#00FFFF'],
      count: 150,
      size: 0.035,
      speed: 0.2,
      behavior: 'drift',
    },
  },
  space: {
    ambient: {
      baseColor: '#000008',
      skyColor: '#4444FF',
      groundColor: '#000008',
      hemisphereIntensity: 0.3,
    },
    fog: { enabled: false, color: '#000008', density: 0 },
    particles: {
      colors: ['#FFFFFF', '#AACCFF'],
      count: 100,
      size: 0.025,
      speed: 0.08,
      behavior: 'sparkle',
    },
  },
  underwater: {
    ambient: {
      baseColor: '#001A2E',
      skyColor: '#00BBFF',
      groundColor: '#001A2E',
      hemisphereIntensity: 0.45,
    },
    fog: { enabled: true, color: '#001A2E', density: 0.03 },
    particles: {
      colors: ['#66DDFF'],
      count: 80,
      size: 0.06,
      speed: 0.1,
      behavior: 'rise',
    },
  },
  crystal: {
    ambient: {
      baseColor: '#100818',
      skyColor: '#AA66FF',
      groundColor: '#100818',
      hemisphereIntensity: 0.5,
    },
    fog: { enabled: true, color: '#100818', density: 0.01 },
    particles: {
      colors: ['#00BBFF', '#00FF88', '#AA66FF', '#FF6644', '#FFAA44', '#D946EF'],
      count: 140,
      size: 0.04,
      speed: 0.25,
      behavior: 'sparkle',
    },
  },
};

// Lab palette for crystal prismatic sparkles
const _LAB_PALETTE = ['#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88', '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF'];

// Transition duration in seconds
const TRANSITION_DURATION = 1.0;

// ────────────────────────────────────────
// Shared Shaders
// ────────────────────────────────────────

const NEON_GRID_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEON_GRID_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 grid = abs(fract(vUv * 20.0 - vec2(0.0, uTime * 0.1)) - 0.5);
    float lineX = smoothstep(0.48, 0.5, grid.x);
    float lineY = smoothstep(0.48, 0.5, grid.y);
    float line = max(lineX, lineY);

    vec3 color = mix(uColor1, uColor2, sin(uTime * 0.5 + vUv.x * 6.28) * 0.5 + 0.5);
    float alpha = line * uIntensity * (0.3 + 0.15 * sin(uTime * 2.0 + vUv.y * 12.0));

    gl_FragColor = vec4(color, alpha);
  }
`;

const NEBULA_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vNormal = normal;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    float n = sin(vUv.x * 4.0 + uTime * 0.1) * cos(vUv.y * 3.0 - uTime * 0.08);
    n = n * 0.5 + 0.5;
    vec3 c1 = vec3(0.1, 0.0, 0.4);
    vec3 c2 = vec3(0.0, 0.15, 0.6);
    vec3 color = mix(c1, c2, n);
    float alpha = (0.15 + 0.1 * n) * uIntensity;
    gl_FragColor = vec4(color, alpha);
  }
`;

const CAUSTIC_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CAUSTIC_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  float caustic(vec2 p, float t) {
    float a = sin(p.x * 3.0 + t) * cos(p.y * 2.7 - t * 0.8);
    float b = sin(p.x * 2.1 - t * 0.6) * cos(p.y * 3.5 + t * 1.1);
    return (a + b) * 0.5 + 0.5;
  }

  void main() {
    float c = caustic(vUv * 8.0, uTime * 0.4);
    c = pow(c, 2.0);
    vec3 color = vec3(0.0, 0.4, 0.7) * c;
    float alpha = c * 0.4 * uIntensity;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ────────────────────────────────────────
// Helper: Kelp Vertex Shader
// ────────────────────────────────────────

const KELP_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float sway = sin(uTime * 0.8 + pos.y * 2.0 + uSeed) * 0.15 * pos.y;
    pos.x += sway;
    pos.z += sway * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const KELP_FRAGMENT = /* glsl */ `
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec3 color = mix(vec3(0.0, 0.3, 0.1), vec3(0.0, 0.5, 0.2), vUv.y);
    float alpha = (0.7 + 0.3 * vUv.y) * uIntensity;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ────────────────────────────────────────
// Sub-Component: Skin Particles
// ────────────────────────────────────────

interface SkinParticlesProps {
  definition: SkinDefinition;
  effectiveIntensity: number;
  particleCount: number;
}

function SkinParticles({ definition, effectiveIntensity, particleCount }: SkinParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { colors, size, speed, behavior } = definition.particles;

  const { positions, particleColors, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    const parsedColors = colors.map((c) => new THREE.Color(c));

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 16;
      pos[i3 + 1] = (Math.random() - 0.5) * 10;
      pos[i3 + 2] = (Math.random() - 0.5) * 8 - 4;

      const c = parsedColors[i % parsedColors.length];
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;

      // Velocity based on behavior
      switch (behavior) {
        case 'rise':
          vel[i3] = (Math.random() - 0.5) * 0.003;
          vel[i3 + 1] = Math.random() * 0.01 + 0.005;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.003;
          break;
        case 'sparkle':
          vel[i3] = (Math.random() - 0.5) * 0.005;
          vel[i3 + 1] = (Math.random() - 0.5) * 0.005;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.005;
          break;
        case 'orbit':
          vel[i3] = Math.random() * 0.008;
          vel[i3 + 1] = (Math.random() - 0.5) * 0.002;
          vel[i3 + 2] = Math.random() * 0.008;
          break;
        default: // drift
          vel[i3] = (Math.random() - 0.5) * 0.004;
          vel[i3 + 1] = (Math.random() - 0.5) * 0.003;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.002;
          break;
      }
    }

    return { positions: pos, particleColors: col, velocities: vel };
  }, [particleCount, colors, behavior]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    const effectSpeed = speed * effectiveIntensity;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      posArray[i3] += velocities[i3] * effectSpeed * delta * 60;
      posArray[i3 + 1] += velocities[i3 + 1] * effectSpeed * delta * 60;
      posArray[i3 + 2] += velocities[i3 + 2] * effectSpeed * delta * 60;

      // Wrap around bounds
      if (posArray[i3] > 8) posArray[i3] = -8;
      if (posArray[i3] < -8) posArray[i3] = 8;
      if (posArray[i3 + 1] > 5) posArray[i3 + 1] = -5;
      if (posArray[i3 + 1] < -5) posArray[i3 + 1] = 5;
      if (posArray[i3 + 2] > 0) posArray[i3 + 2] = -8;
      if (posArray[i3 + 2] < -8) posArray[i3 + 2] = 0;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particleColors, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={effectiveIntensity * 0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ────────────────────────────────────────
// Sub-Component: Cyberpunk Background
// ────────────────────────────────────────

interface CyberpunkBackgroundProps {
  intensity: number;
  segments: number;
}

function CyberpunkBackground({ intensity, segments }: CyberpunkBackgroundProps) {
  const gridRef = useRef<THREE.Mesh>(null);
  const signsRef = useRef<THREE.Group>(null);

  const gridMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NEON_GRID_VERTEX,
        fragmentShader: NEON_GRID_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uColor1: { value: new THREE.Color('#FF00FF') },
          uColor2: { value: new THREE.Color('#00FFFF') },
          uIntensity: { value: intensity },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Neon sign positions (scattered)
  const signData = useMemo(
    () => [
      { pos: [-5, 3, -8] as [number, number, number], scale: [1.2, 0.4, 0.1] as [number, number, number], color: '#FF00FF' },
      { pos: [6, 4.5, -10] as [number, number, number], scale: [0.8, 0.3, 0.1] as [number, number, number], color: '#00FFFF' },
      { pos: [-3, 5.5, -12] as [number, number, number], scale: [1.0, 0.35, 0.1] as [number, number, number], color: '#FF00FF' },
      { pos: [4, 2.5, -6] as [number, number, number], scale: [0.6, 0.25, 0.1] as [number, number, number], color: '#00FFFF' },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    gridMaterial.uniforms.uTime.value = t;
    gridMaterial.uniforms.uIntensity.value = intensity;

    if (signsRef.current) {
      signsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = (0.8 + 0.4 * Math.sin(t * 2 + i * 1.5)) * intensity;
        }
      });
    }
  });

  const seg = Math.max(4, Math.floor(segments * 0.5));

  return (
    <group>
      {/* Neon Grid Floor */}
      <mesh
        ref={gridRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3, -6]}
        material={gridMaterial}
      >
        <planeGeometry args={[30, 30, seg, seg]} />
      </mesh>

      {/* Floating Neon Signs */}
      <group ref={signsRef}>
        {signData.map((sign, i) => (
          <mesh key={i} position={sign.pos} scale={sign.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={sign.color}
              emissive={sign.color}
              emissiveIntensity={1.0 * intensity}
              transparent
              opacity={0.8 * intensity}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ────────────────────────────────────────
// Sub-Component: Space Background
// ────────────────────────────────────────

interface SpaceBackgroundProps {
  intensity: number;
  segments: number;
}

function SpaceBackground({ intensity, segments }: SpaceBackgroundProps) {
  const nebulaRef = useRef<THREE.Mesh>(null);
  const planetRef = useRef<THREE.Group>(null);

  const nebulaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERTEX,
        fragmentShader: NEBULA_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: intensity },
        },
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    nebulaMaterial.uniforms.uTime.value = t;
    nebulaMaterial.uniforms.uIntensity.value = intensity;

    if (planetRef.current) {
      planetRef.current.rotation.y += 0.0005;
    }
  });

  const nebSeg = Math.max(8, Math.floor(segments * 0.8));
  const planetSeg = Math.max(8, Math.floor(segments * 0.5));

  return (
    <group>
      {/* Dense star field */}
      <Stars
        radius={50}
        depth={40}
        count={5000}
        factor={2}
        saturation={0.2}
        fade
        speed={0.3}
      />

      {/* Nebula sphere (BackSide) */}
      <mesh ref={nebulaRef} material={nebulaMaterial}>
        <sphereGeometry args={[40, nebSeg, nebSeg]} />
      </mesh>

      {/* Distant planet with ring */}
      <group ref={planetRef} position={[12, 5, -25]}>
        <mesh>
          <sphereGeometry args={[2, planetSeg, planetSeg]} />
          <meshStandardMaterial
            color="#334466"
            emissive="#112244"
            emissiveIntensity={0.3 * intensity}
            roughness={0.8}
          />
        </mesh>
        {/* Ring */}
        <mesh rotation={[Math.PI * 0.35, 0.2, 0]}>
          <ringGeometry args={[2.8, 4, Math.max(16, Math.floor(segments * 0.8))]} />
          <meshStandardMaterial
            color="#667799"
            transparent
            opacity={0.4 * intensity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────
// Sub-Component: Underwater Background
// ────────────────────────────────────────

interface UnderwaterBackgroundProps {
  intensity: number;
  segments: number;
}

function UnderwaterBackground({ intensity, segments }: UnderwaterBackgroundProps) {
  const causticRef = useRef<THREE.Mesh>(null);
  const kelpGroupRef = useRef<THREE.Group>(null);

  const causticMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CAUSTIC_VERTEX,
        fragmentShader: CAUSTIC_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: intensity },
        },
        transparent: true,
        depthWrite: false,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Kelp cluster data
  const kelpClusters = useMemo(
    () => [
      { pos: [-4, -3, -6] as [number, number, number], seed: 0 },
      { pos: [5, -3, -8] as [number, number, number], seed: 1.5 },
      { pos: [-1, -3, -10] as [number, number, number], seed: 3.0 },
      { pos: [3, -3, -5] as [number, number, number], seed: 4.5 },
    ],
    []
  );

  const kelpMaterials = useMemo(
    () =>
      kelpClusters.map(
        (k) =>
          new THREE.ShaderMaterial({
            vertexShader: KELP_VERTEX,
            fragmentShader: KELP_FRAGMENT,
            uniforms: {
              uTime: { value: 0 },
              uSeed: { value: k.seed },
              uIntensity: { value: intensity },
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
      ),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    causticMaterial.uniforms.uTime.value = t;
    causticMaterial.uniforms.uIntensity.value = intensity;

    kelpMaterials.forEach((mat) => {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uIntensity.value = intensity;
    });
  });

  const causticSeg = Math.max(4, Math.floor(segments * 0.3));

  return (
    <group>
      {/* Caustic light on ground plane */}
      <mesh
        ref={causticRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.5, -6]}
        material={causticMaterial}
      >
        <planeGeometry args={[24, 24, causticSeg, causticSeg]} />
      </mesh>

      {/* Kelp strands */}
      <group ref={kelpGroupRef}>
        {kelpClusters.map((cluster, ci) => (
          <group key={ci} position={cluster.pos}>
            {/* Each cluster has 3 kelp strands */}
            {[0, 0.3, -0.3].map((offsetX, si) => (
              <mesh
                key={si}
                position={[offsetX, 1.5, si * 0.2]}
                material={kelpMaterials[ci]}
              >
                <cylinderGeometry
                  args={[0.03, 0.06, 3, Math.max(4, Math.floor(segments * 0.2)), 8]}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

// ────────────────────────────────────────
// Sub-Component: Crystal Background
// ────────────────────────────────────────

interface CrystalBackgroundProps {
  intensity: number;
  segments: number;
}

function CrystalBackground({ intensity, segments }: CrystalBackgroundProps) {
  const crystalsRef = useRef<THREE.Group>(null);
  const beamsRef = useRef<THREE.Group>(null);

  // Crystal formation data
  const crystals = useMemo(
    () => [
      { pos: [-5, -2, -8] as [number, number, number], scale: 1.5, rot: 0.3, color: '#AA66FF' },
      { pos: [4, -1.5, -10] as [number, number, number], scale: 2.0, rot: -0.5, color: '#00BBFF' },
      { pos: [-2, -2.5, -12] as [number, number, number], scale: 1.2, rot: 0.8, color: '#FF66AA' },
      { pos: [6, -2, -7] as [number, number, number], scale: 1.0, rot: -0.2, color: '#00FF88' },
      { pos: [0, -1, -14] as [number, number, number], scale: 2.5, rot: 0.6, color: '#D946EF' },
    ],
    []
  );

  // Light refraction beams
  const beams = useMemo(
    () => [
      { pos: [-3, 1, -9] as [number, number, number], rot: [0.4, 0, 0.3] as [number, number, number], length: 6, color: '#FF66AA' },
      { pos: [3, 2, -11] as [number, number, number], rot: [-0.3, 0, -0.5] as [number, number, number], length: 5, color: '#00BBFF' },
      { pos: [0, 3, -8] as [number, number, number], rot: [0.2, 0, 0.1] as [number, number, number], length: 7, color: '#AA66FF' },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (crystalsRef.current) {
      crystalsRef.current.children.forEach((child, i) => {
        child.rotation.y = t * 0.05 + i * 0.5;
      });
    }

    if (beamsRef.current) {
      beamsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = (0.5 + 0.3 * Math.sin(t * 1.5 + i * 2.0)) * intensity;
          mat.opacity = (0.3 + 0.15 * Math.sin(t * 1.5 + i * 2.0)) * intensity;
        }
      });
    }
  });

  const crystalDetail = Math.max(0, Math.min(2, Math.floor(segments / 16) - 1));

  return (
    <group>
      {/* Crystal formations */}
      <group ref={crystalsRef}>
        {crystals.map((crystal, i) => (
          <mesh
            key={i}
            position={crystal.pos}
            scale={crystal.scale}
            rotation={[crystal.rot, 0, crystal.rot * 0.5]}
          >
            <icosahedronGeometry args={[1, crystalDetail]} />
            <meshPhysicalMaterial
              color={crystal.color}
              transmission={0.6}
              roughness={0.1}
              metalness={0.1}
              ior={1.8}
              thickness={0.5}
              transparent
              opacity={0.7 * intensity}
              envMapIntensity={1.5}
            />
          </mesh>
        ))}
      </group>

      {/* Light refraction beams */}
      <group ref={beamsRef}>
        {beams.map((beam, i) => (
          <mesh
            key={i}
            position={beam.pos}
            rotation={beam.rot}
          >
            <cylinderGeometry args={[0.015, 0.015, beam.length, 4]} />
            <meshStandardMaterial
              color={beam.color}
              emissive={beam.color}
              emissiveIntensity={0.6 * intensity}
              transparent
              opacity={0.35 * intensity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ────────────────────────────────────────
// Sub-Component: Default Background
// ────────────────────────────────────────

interface DefaultBackgroundProps {
  intensity: number;
}

function DefaultBackground({ intensity }: DefaultBackgroundProps) {
  return (
    <Stars
      radius={30}
      depth={30}
      count={2000}
      factor={2.5}
      saturation={0.5}
      fade
      speed={0.5 * intensity}
    />
  );
}

// ────────────────────────────────────────
// Main Component: CockpitSkinManager
// ────────────────────────────────────────

export function CockpitSkinManager({ intensity = 1.0 }: CockpitSkinManagerProps) {
  const cockpitSkin = useCockpitStore((s) => s.cockpitSkin);
  const profile = useDeviceStore((s) => s.profile);
  const getParticleCount = useDeviceStore((s) => s.getParticleCount);

  const { scene } = useThree();

  // Refs for smooth color transitions
  const currentSkyColor = useRef(new THREE.Color(SKIN_DEFINITIONS.default.ambient.skyColor));
  const currentGroundColor = useRef(new THREE.Color(SKIN_DEFINITIONS.default.ambient.groundColor));
  const currentFogColor = useRef(new THREE.Color(SKIN_DEFINITIONS.default.fog.color));
  const currentFogDensity = useRef(0);
  const currentHemiIntensity = useRef(SKIN_DEFINITIONS.default.ambient.hemisphereIntensity);
  const prevSkinRef = useRef<CockpitSkin>(cockpitSkin);
  const transitionProgress = useRef(1.0); // 1.0 = fully transitioned

  // Light refs
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);

  // Target colors for lerping
  const targetSkyColor = useRef(new THREE.Color(SKIN_DEFINITIONS.default.ambient.skyColor));
  const targetGroundColor = useRef(new THREE.Color(SKIN_DEFINITIONS.default.ambient.groundColor));
  const targetFogColor = useRef(new THREE.Color(SKIN_DEFINITIONS.default.fog.color));
  const targetFogDensity = useRef(0);
  const targetHemiIntensity = useRef(SKIN_DEFINITIONS.default.ambient.hemisphereIntensity);

  // Current skin definition
  const skinDef = SKIN_DEFINITIONS[cockpitSkin];

  // Device-adaptive values
  const segments = profile.sphereSegments;
  const particleCount = getParticleCount(skinDef.particles.count);
  const effectiveIntensity = intensity;

  // Detect skin changes and start transition
  const startTransition = useCallback(
    (newSkin: CockpitSkin) => {
      const def = SKIN_DEFINITIONS[newSkin];
      targetSkyColor.current.set(def.ambient.skyColor);
      targetGroundColor.current.set(def.ambient.groundColor);
      targetFogColor.current.set(def.fog.color);
      targetFogDensity.current = def.fog.enabled ? def.fog.density : 0;
      targetHemiIntensity.current = def.ambient.hemisphereIntensity;
      transitionProgress.current = 0;
    },
    []
  );

  // Main animation loop: lerp colors and manage fog
  useFrame((_, delta) => {
    // Check for skin change
    if (prevSkinRef.current !== cockpitSkin) {
      startTransition(cockpitSkin);
      prevSkinRef.current = cockpitSkin;
    }

    // Advance transition
    if (transitionProgress.current < 1.0) {
      transitionProgress.current = Math.min(
        1.0,
        transitionProgress.current + delta / TRANSITION_DURATION
      );

      const t = smoothstep(transitionProgress.current);

      // Lerp hemisphere light colors
      currentSkyColor.current.lerp(targetSkyColor.current, t);
      currentGroundColor.current.lerp(targetGroundColor.current, t);
      currentFogColor.current.lerp(targetFogColor.current, t);
      currentFogDensity.current += (targetFogDensity.current - currentFogDensity.current) * t;
      currentHemiIntensity.current += (targetHemiIntensity.current - currentHemiIntensity.current) * t;
    }

    // Apply hemisphere light
    if (hemiLightRef.current) {
      hemiLightRef.current.color.copy(currentSkyColor.current);
      hemiLightRef.current.groundColor.copy(currentGroundColor.current);
      hemiLightRef.current.intensity = currentHemiIntensity.current * effectiveIntensity;
    }

    // Manage fog
    if (currentFogDensity.current > 0.001) {
      if (!scene.fog || !(scene.fog instanceof THREE.FogExp2)) {
        scene.fog = new THREE.FogExp2(
          currentFogColor.current.getHex(),
          currentFogDensity.current
        );
      } else {
        (scene.fog as THREE.FogExp2).color.copy(currentFogColor.current);
        (scene.fog as THREE.FogExp2).density = currentFogDensity.current;
      }
    } else if (scene.fog) {
      scene.fog = null;
    }

    // Update scene background color
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(
        new THREE.Color(SKIN_DEFINITIONS[cockpitSkin].ambient.baseColor),
        transitionProgress.current < 1 ? smoothstep(transitionProgress.current) : 1
      );
    } else {
      scene.background = new THREE.Color(SKIN_DEFINITIONS[cockpitSkin].ambient.baseColor);
    }
  });

  return (
    <group>
      {/* Hemisphere Light — always present, colors driven by skin */}
      <hemisphereLight
        ref={hemiLightRef}
        args={[
          currentSkyColor.current,
          currentGroundColor.current,
          skinDef.ambient.hemisphereIntensity * effectiveIntensity,
        ]}
      />

      {/* Skin-specific accent particles */}
      <SkinParticles
        definition={skinDef}
        effectiveIntensity={effectiveIntensity}
        particleCount={particleCount}
      />

      {/* Skin-specific background elements */}
      {cockpitSkin === 'default' && (
        <DefaultBackground intensity={effectiveIntensity} />
      )}

      {cockpitSkin === 'cyberpunk' && (
        <CyberpunkBackground intensity={effectiveIntensity} segments={segments} />
      )}

      {cockpitSkin === 'space' && (
        <SpaceBackground intensity={effectiveIntensity} segments={segments} />
      )}

      {cockpitSkin === 'underwater' && (
        <UnderwaterBackground intensity={effectiveIntensity} segments={segments} />
      )}

      {cockpitSkin === 'crystal' && (
        <CrystalBackground intensity={effectiveIntensity} segments={segments} />
      )}
    </group>
  );
}

// ────────────────────────────────────────
// Utility: Smoothstep for eased transitions
// ────────────────────────────────────────

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
