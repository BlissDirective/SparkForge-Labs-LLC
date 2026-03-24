'use client';

// ════════════════════════════════════════════════════
// VolumetricFog3D — Volumetric Fog & God Ray Atmospherics
// ════════════════════════════════════════════════════
// 20M cockpit upgrade component providing atmospheric depth
// via overlapping fog volumes, animated god ray cones, and
// noise-driven density layers. Triangle budget: 500K.
//

// god rays and density layers at 'low' and 'billboard'.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ■■ Props ■■
interface VolumetricFog3DProps {
  labColor: string;
  density?: number;
  opacity?: number;
  godRaysEnabled?: boolean;
}

// ■■ Fog Volume Config ■■
interface FogVolumeConfig {
  position: [number, number, number];
  scale: [number, number, number];
  baseOpacity: number;
  driftSpeed: number;
  driftAxis: 'x' | 'y' | 'z';
  driftAmplitude: number;
  geometry: 'sphere' | 'box';
}

const FOG_VOLUMES: FogVolumeConfig[] = [
  { position: [0, 2, -8], scale: [12, 8, 12], baseOpacity: 0.015, driftSpeed: 0.12, driftAxis: 'y', driftAmplitude: 0.4, geometry: 'sphere' },
  { position: [-6, -1, 4], scale: [10, 6, 10], baseOpacity: 0.025, driftSpeed: 0.08, driftAxis: 'x', driftAmplitude: 0.6, geometry: 'sphere' },
  { position: [5, 3, 2], scale: [8, 10, 8], baseOpacity: 0.02, driftSpeed: 0.15, driftAxis: 'z', driftAmplitude: 0.3, geometry: 'box' },
  { position: [0, -3, -4], scale: [14, 5, 14], baseOpacity: 0.03, driftSpeed: 0.1, driftAxis: 'y', driftAmplitude: 0.5, geometry: 'sphere' },
  { position: [-4, 5, -6], scale: [9, 7, 9], baseOpacity: 0.01, driftSpeed: 0.18, driftAxis: 'x', driftAmplitude: 0.35, geometry: 'box' },
  { position: [7, 0, -2], scale: [11, 9, 11], baseOpacity: 0.04, driftSpeed: 0.07, driftAxis: 'z', driftAmplitude: 0.45, geometry: 'sphere' },
];

// ■■ God Ray Config ■■
interface GodRayConfig {
  position: [number, number, number];
  rotation: [number, number, number];
  height: number;
  radius: number;
  phaseOffset: number;
  pulseSpeed: number;
}

const GOD_RAYS: GodRayConfig[] = [
  { position: [-4, 12, -6], rotation: [0, 0, 0.15], height: 20, radius: 2.5, phaseOffset: 0, pulseSpeed: 0.3 },
  { position: [5, 14, -3], rotation: [0, 0, -0.1], height: 24, radius: 3.0, phaseOffset: 1.5, pulseSpeed: 0.25 },
  { position: [0, 11, 4], rotation: [0.12, 0, 0], height: 18, radius: 2.0, phaseOffset: 3.0, pulseSpeed: 0.35 },
  { position: [-6, 13, 2], rotation: [-0.08, 0, 0.2], height: 22, radius: 2.8, phaseOffset: 4.5, pulseSpeed: 0.28 },
];

// ■■ Density Layer Config ■■
interface DensityLayerConfig {
  height: number;
  size: number;
  baseOpacity: number;
}

const DENSITY_LAYERS: DensityLayerConfig[] = [
  { height: -2, size: 30, baseOpacity: 0.03 },
  { height: 1, size: 25, baseOpacity: 0.02 },
  { height: 5, size: 35, baseOpacity: 0.015 },
];

// ■■ Noise Shader for Density Layers ■■
const densityVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const densityFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;

  varying vec2 vUv;

  // Simplex-style hash noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 4.0;
    float n = fbm(uv + uTime * 0.05);
    float edgeFade = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x)
                   * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
    float alpha = n * uOpacity * edgeFade;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ■■ Component ■■
export function VolumetricFog3D({
  labColor,
  density = 0.5,
  opacity = 1,
  godRaysEnabled = true,
}: VolumetricFog3DProps) {

  // Refs for animated elements
  const fogGroupRef = useRef<THREE.Group>(null);
  const fogMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const godRayRefs = useRef<(THREE.Mesh | null)[]>([]);
  const densityMatRefs = useRef<(THREE.ShaderMaterial | null)[]>([]);

  // Track current color for smooth lerp
  const currentColorRef = useRef(new THREE.Color(labColor));
  const targetColor = useMemo(() => new THREE.Color(labColor), [labColor]);

  // LOD-driven segments for sphere/cone geometry
  const sphereSegments = useMemo(() => {
    switch ('ultra') {
      case 'ultra': return 24;
      case 'high': return 16;
      case 'medium': return 10;
      default: return 6;
    }
  }, ['ultra']);

  const coneSegments = useMemo(() => {
    switch ('ultra') {
      case 'ultra': return 16;
      case 'high': return 12;
      case 'medium': return 8;
      default: return 4;
    }
  }, ['ultra']);

  // Disable god rays at low LOD or when explicitly off
  const showGodRays = godRaysEnabled && true;
  // Disable density layers at low/billboard
  const showDensityLayers = true;

  // Density layer shader uniforms
  const densityUniforms = useMemo(() =>
    DENSITY_LAYERS.map((layer) => ({
      uTime: { value: 0 },
      uOpacity: { value: layer.baseOpacity * density * opacity },
      uColor: { value: currentColorRef.current.clone() },
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [density, opacity]
  );

  // Fog volume materials (created once, updated in frame loop)
  const fogMaterials = useMemo(() =>
    FOG_VOLUMES.map((vol) =>
      new THREE.MeshBasicMaterial({
        color: currentColorRef.current.clone(),
        transparent: true,
        opacity: vol.baseOpacity * density * opacity,
        side: THREE.BackSide,
        depthWrite: false,
      })
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [density, opacity]
  );

  // God ray materials
  const godRayMaterials = useMemo(() =>
    GOD_RAYS.map(() =>
      new THREE.MeshBasicMaterial({
        color: currentColorRef.current.clone(),
        transparent: true,
        opacity: 0.06 * density * opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [density, opacity]
  );

  // ■■ Animation Loop ■■
  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    const time = performance.now() * 0.001;

    // Lerp color toward labColor (~500ms transition at 60fps)
    const lerpFactor = 1.0 - Math.pow(0.01, clampedDelta);
    currentColorRef.current.lerp(targetColor, lerpFactor);

    // Update fog volume positions and materials
    FOG_VOLUMES.forEach((vol, i) => {
      const mesh = fogMeshRefs.current[i];
      const mat = fogMaterials[i];
      if (!mesh || !mat) return;

      // Gentle drift oscillation
      const drift = Math.sin(time * vol.driftSpeed) * vol.driftAmplitude;
      if (vol.driftAxis === 'x') mesh.position.x = vol.position[0] + drift;
      else if (vol.driftAxis === 'y') mesh.position.y = vol.position[1] + drift;
      else mesh.position.z = vol.position[2] + drift;

      // Update color
      mat.color.copy(currentColorRef.current);
    });

    // Animate god ray opacity with sine pulse
    if (showGodRays) {
      GOD_RAYS.forEach((ray, i) => {
        const mat = godRayMaterials[i];
        if (!mat) return;
        const pulse = 0.5 + 0.5 * Math.sin(time * ray.pulseSpeed + ray.phaseOffset);
        mat.opacity = (0.03 + 0.05 * pulse) * density * opacity;
        mat.color.copy(currentColorRef.current);
      });
    }

    // Update density layer uniforms
    if (showDensityLayers) {
      densityUniforms.forEach((u, i) => {
        const mat = densityMatRefs.current[i];
        if (!mat) return;
        u.uTime.value = time;
        u.uColor.value.copy(currentColorRef.current);
        mat.uniforms = u;
      });
    }
  });

  // At billboard LOD, render nothing

  return (
    <group ref={fogGroupRef}>
      {/* ── Fog Volumes (6 overlapping spheres/boxes, BackSide) ── */}
      {FOG_VOLUMES.map((vol, i) => (
        <mesh
          key={`fog-vol-${i}`}
          ref={(el) => { fogMeshRefs.current[i] = el; }}
          position={vol.position}
          scale={vol.scale}
          material={fogMaterials[i]}
          frustumCulled={false}
        >
          {vol.geometry === 'sphere' ? (
            <sphereGeometry args={[1, sphereSegments, sphereSegments]} />
          ) : (
            <boxGeometry args={[1, 1, 1]} />
          )}
        </mesh>
      ))}

      {/* ── God Ray Cones (4 downward-pointing cones) ── */}
      {showGodRays && GOD_RAYS.map((ray, i) => (
        <mesh
          key={`god-ray-${i}`}
          ref={(el) => { godRayRefs.current[i] = el; }}
          position={ray.position}
          rotation={ray.rotation}
          material={godRayMaterials[i]}
          frustumCulled={false}
        >
          <coneGeometry args={[ray.radius, ray.height, coneSegments, 1, true]} />
        </mesh>
      ))}

      {/* ── Density Layers (3 horizontal noise-driven planes) ── */}
      {showDensityLayers && DENSITY_LAYERS.map((layer, i) => (
        <mesh
          key={`density-layer-${i}`}
          position={[0, layer.height, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          frustumCulled={false}
        >
          <planeGeometry args={[layer.size, layer.size, 1, 1]} />
          <shaderMaterial
            ref={(el) => { densityMatRefs.current[i] = el; }}
            vertexShader={densityVertexShader}
            fragmentShader={densityFragmentShader}
            uniforms={densityUniforms[i]}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default VolumetricFog3D;
