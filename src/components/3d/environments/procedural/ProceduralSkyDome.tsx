'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import {
  type LabThemeProfile,
  type TierConfig,
  createSeededRng,
} from '@/lib/3d/proceduralConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProceduralSkyDomeProps {
  theme: LabThemeProfile;
  tierConfig: TierConfig;
}

// ---------------------------------------------------------------------------
// Shaders — Sky Gradient Hemisphere
// ---------------------------------------------------------------------------

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uLabColor;
  uniform float uNebulaOpacity;
  uniform float uRadius;

  varying vec3 vWorldPosition;

  void main() {
    float h = normalize(vWorldPosition).y;
    float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);

    vec3 color = mix(uHorizonColor, uTopColor, t);

    // Subtle nebula tint in the mid-range band
    if (uNebulaOpacity > 0.0) {
      float band = smoothstep(0.25, 0.5, t) * smoothstep(0.75, 0.5, t);
      color = mix(color, uLabColor, band * uNebulaOpacity * 0.35);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Sub-component: Star Field
// ---------------------------------------------------------------------------

function StarField({
  theme,
  skyRadius,
}: {
  theme: LabThemeProfile;
  skyRadius: number;
}) {
  const count = Math.floor(theme.sky.starDensity * 500);
  const meshRef = useRef<InstancedMesh>(null);
  const phaseRef = useRef(0);

  const baseOpacities = useMemo(() => {
    const rng = createSeededRng(theme.seed + 1000);
    const dummy = new Object3D();
    const opacities = new Float32Array(count);
    const innerRadius = skyRadius * 0.95;

    // Pre-build instance matrices
    const matrices: Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = rng() * Math.PI * 0.55; // upper hemisphere bias
      const r = innerRadius;

      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
      const scale = 0.02 + rng() * 0.03;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
      opacities[i] = 0.5 + rng() * 0.5; // base brightness
    }

    // Apply matrices after mount via ref callback handled in useFrame init
    return { matrices, opacities };
  }, [count, theme.seed, skyRadius]);

  // Apply instance matrices once on first frame
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!initialized.current) {
      baseOpacities.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.instanceMatrix.needsUpdate = true;
      initialized.current = true;
    }

    // Twinkle animation — oscillate emissive intensity
    phaseRef.current += delta * 0.8;
    const mat = mesh.material as MeshBasicMaterial;
    const twinkle = 0.6 + 0.4 * Math.sin(phaseRef.current * 2.3);
    mat.opacity = twinkle;
  });

  const geometry = useMemo(
    () => new SphereGeometry(1, 4, 4),
    [],
  );

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    [],
  );

  if (count <= 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Aurora Ribbons
// ---------------------------------------------------------------------------

function AuroraRibbons({
  theme,
  skyRadius,
}: {
  theme: LabThemeProfile;
  skyRadius: number;
}) {
  const groupRef = useRef<Group>(null);

  const ribbons = useMemo(() => {
    const rng = createSeededRng(theme.seed + 2000);
    const ribbonCount = 2 + Math.floor(rng() * 1.5); // 2-3 ribbons
    const auroraColor = new Color(theme.sky.auroraColor);
    const result: { geometry: TubeGeometry; opacity: number }[] = [];

    for (let r = 0; r < ribbonCount; r++) {
      const points: Vector3[] = [];
      const segments = 6 + Math.floor(rng() * 3);
      const baseY = skyRadius * (0.45 + rng() * 0.3);
      const spread = skyRadius * 0.6;

      for (let s = 0; s < segments; s++) {
        const frac = s / (segments - 1);
        points.push(
          new Vector3(
            (frac - 0.5) * spread * 2 + (rng() - 0.5) * spread * 0.3,
            baseY + (rng() - 0.5) * skyRadius * 0.12,
            -skyRadius * 0.3 + (rng() - 0.5) * skyRadius * 0.4,
          ),
        );
      }

      const curve = new CatmullRomCurve3(points, false, 'centripetal', 0.5);
      const tubeRadius = 0.3 + rng() * 0.5;
      const tubularSegments = 48;
      const radialSegments = 6;

      result.push({
        geometry: new TubeGeometry(
          curve,
          tubularSegments,
          tubeRadius,
          radialSegments,
          false,
        ),
        opacity: 0.15 + rng() * 0.1,
      });
    }

    return { data: result, color: auroraColor };
  }, [theme.seed, theme.sky.auroraColor, skyRadius]);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Slow undulation — gentle oscillation on Y and subtle rotation
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.15) * 0.4;
    groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.03;
  });

  return (
    <group ref={groupRef}>
      {ribbons.data.map((ribbon, i) => (
        <mesh key={i} geometry={ribbon.geometry} frustumCulled={false}>
          <meshBasicMaterial
            color={ribbons.color}
            transparent
            opacity={ribbon.opacity}
            side={DoubleSide}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProceduralSkyDome({
  theme,
  tierConfig,
}: ProceduralSkyDomeProps) {
  const skyUniforms = useMemo(
    () => ({
      uTopColor: { value: new Color(theme.sky.topColor) },
      uHorizonColor: { value: new Color(theme.sky.horizonColor) },
      uLabColor: { value: new Color(theme.labColor ?? '#00BBFF') },
      uNebulaOpacity: { value: theme.sky.nebulaOpacity ?? 0 },
      uRadius: { value: tierConfig.skyRadius },
    }),
    [theme.sky.topColor, theme.sky.horizonColor, theme.labColor, theme.sky.nebulaOpacity, tierConfig.skyRadius],
  );

  const sphereArgs = useMemo<[number, number, number]>(
    () => [tierConfig.skyRadius, tierConfig.skySegments, tierConfig.skySegments],
    [tierConfig.skyRadius, tierConfig.skySegments],
  );

  return (
    <group>
      {/* Sky Gradient Hemisphere */}
      <mesh frustumCulled={false}>
        <sphereGeometry args={sphereArgs} />
        <shaderMaterial
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Star Field */}
      {theme.sky.starDensity > 0 && (
        <StarField theme={theme} skyRadius={tierConfig.skyRadius} />
      )}

      {/* Aurora Ribbons */}
      {theme.sky.auroraEnabled && (
        <AuroraRibbons theme={theme} skyRadius={tierConfig.skyRadius} />
      )}
    </group>
  );
}
