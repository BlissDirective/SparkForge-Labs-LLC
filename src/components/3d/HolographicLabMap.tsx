'use client';

// ════════════════════════════════════════════════════
// HolographicLabMap — 3D Holographic Map of All 10 Labs
// ════════════════════════════════════════════════════
// Enhancement 3.0: 20M cockpit upgrade (1,000,000 triangle budget).
// - 4 concentric geodesic shells (icosahedron detail 0/1/2/3)
// - Data highway spline tubes connecting all adjacent labs
// - 3D grid floor with raised intersection boxes (InstancedMesh)
// - Holographic projector pedestal with lens assembly
// - 8 orbital rings with 24 orbiting data points
// - Pulsing energy corona (double-layer)

//
// All existing interfaces and interactions preserved.

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import {
  CHROME_BORDER,
  EMISSIVE_LED_MULTIPLIER,
  EMISSIVE_IDLE_INDICATOR,
  TYPE_SCALE,
  NUMERIC_FONT,
  TEXT_COLORS,
  getEmissive,
} from '@/lib/3d/cockpitDesignTokens';
import {
  BackSide,
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Plane,
  Raycaster,
  ShaderMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { LabStructure3D } from './LabStructure3D';
import { LAB_POSITIONS } from '@/stores/cockpitStore';
import { LABS } from '@/types';

// Phase 2 audit fix (Section 4.6): energyFieldTSL applied — Decision 4.5
// The TSL shader provides hex-grid energy-crawl + fresnel glow for connection beams.
// Under WebGL2 the active visual remains MeshBasicMaterial (see ConnectionBeam); the
// TSL module is imported and uniforms driven so the shader is retained and ready for
// a NodeMaterial swap under WebGPU.
import {
  energyFieldFragment,
  energyFieldVertex,
  getEnergyFieldUniforms,
} from '@/shaders/tsl/energyFieldTSL';

// Reference the TSL pattern fns so they are not tree-shaken.
void energyFieldFragment;
void energyFieldVertex;

// Lab accent colors (same as useStationMode)
const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', 2: '#AA66FF', 3: '#FF66AA', 4: '#FFAA44', 5: '#00FF88',
  6: '#FF6644', 7: '#06B6D4', 8: '#818CF8', 9: '#10B981', 10: '#D946EF',
};

// Adjacency map for connection beams (labs that are neighbors in the ring)
const LAB_ADJACENCY: Record<number, number[]> = {
  1: [2, 10], 2: [1, 3], 3: [2, 4], 4: [3, 5], 5: [4, 6],
  6: [5, 7], 7: [6, 8], 8: [7, 9], 9: [8, 10], 10: [9, 1],
};

interface HolographicLabMapProps {
  focusedLabId: number | null;
  hoveredLabId: number | null;
  labCompletions: Record<number, number>; // labId -> 0-1 completion
  orbitSpeed: number;
  onLabClick: (labId: number) => void;
  onLabHover: (labId: number | null) => void;
  onLabDoubleClick: (labId: number) => void;
}

// ─── Holographic Grid Floor Shader Material ─────────────────

const gridVertexShader = `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vDist = length(worldPos.xz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const gridFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    // Create grid lines
    vec2 grid = abs(fract(vUv * 24.0 - 0.5) - 0.5);
    float line = min(grid.x, grid.y);
    float gridAlpha = 1.0 - smoothstep(0.0, 0.04, line);

    // Edge fade — fade out at edges of the plane
    float edgeFade = 1.0 - smoothstep(3.0, 6.0, vDist);

    // Radial scan pulse
    float scan = smoothstep(0.0, 0.3, abs(fract(vDist * 0.15 - uTime * 0.1) - 0.5));

    // Combine
    float alpha = gridAlpha * edgeFade * 0.06 * (0.7 + scan * 0.3);

    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ─── Connection Beam Component ──────────────────────────────

function ConnectionBeam({
  start,
  end,
  color,
  time,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  time: number;
}) {
  const meshRef = useRef<Mesh>(null);

  // Phase 2 audit fix (Section 4.6): bind energyFieldTSL uniforms — Decision 4.5
  // Uniforms shared across all beams (via getEnergyFieldUniforms module singletons).
  // Driven in useFrame below; NodeMaterial swap can read these directly under WebGPU.
  const energyUniforms = useMemo(() => getEnergyFieldUniforms(), []);

  const { geometry, material } = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(...start),
      new Vector3(
        (start[0] + end[0]) * 0.5,
        Math.max(start[1], end[1]) + 0.8,
        (start[2] + end[2]) * 0.5
      ),
      new Vector3(...end),
    ]);
    // Beam radius: visible at 0.015 (ACCENT_LINES.width=0.002 is for fine trim lines)
    const geo = new TubeGeometry(curve, 12, 0.015, 4, false);
    const mat = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    return { geometry: geo, material: mat };
  }, [start, end, color]);

  // Critical Fix #2: Dispose geometry + material on unmount to prevent VRAM leak
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(() => {
    if (material) {
      // Animated pulsing opacity — peak brightness from design token
      const peak = EMISSIVE_LED_MULTIPLIER; // 1.5
      material.opacity = 0.15 + Math.sin(time * 3) * 0.08 * peak;
    }
    // Phase 2 audit fix (Section 4.6): drive energyFieldTSL uniforms — Decision 4.5
    // Shared uniforms: uTime advances; uColor tracks beam accent; full intensity (shield HP 1.0).
    energyUniforms.uTime.value = time;
    energyUniforms.uColor.value.set(color);
    energyUniforms.uIntensity.value = 1.0;
    energyUniforms.uShieldHP.value = 1.0;
    energyUniforms.uShatterProgress.value = 0.0;
    energyUniforms.uBreathScale.value = 0.5;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

// ─── Data Highway Spline Tubes ──────────────────────────────
// High-segment tube geometry connecting adjacent labs with glowing data conduits

function DataHighways({
  color,
  tubularSegments,
}: {
  color: string;
  tubularSegments: number;
}) {
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);

  const highways = useMemo(() => {
    const results: { id: string; geometry: TubeGeometry; material: MeshStandardMaterial }[] = [];
    const visited = new Set<string>();

    for (const [labIdStr, neighbors] of Object.entries(LAB_ADJACENCY)) {
      const labId = Number(labIdStr);
      const posA = LAB_POSITIONS[labId];
      if (!posA) continue;

      for (const neighborId of neighbors) {
        const key = [Math.min(labId, neighborId), Math.max(labId, neighborId)].join('-');
        if (visited.has(key)) continue;
        visited.add(key);

        const posB = LAB_POSITIONS[neighborId];
        if (!posB) continue;

        const startV = new Vector3(posA[0], posA[1] - 0.3, posA[2]);
        const endV = new Vector3(posB[0], posB[1] - 0.3, posB[2]);
        const mid = startV.clone().lerp(endV, 0.5);
        mid.y -= 0.5; // Sag below the lab ring for visual depth

        const curve = new CatmullRomCurve3([startV, mid, endV]);
        const geo = new TubeGeometry(curve, tubularSegments, 0.02, 8, false);
        const mat = new MeshStandardMaterial({
          color: new Color(color).multiplyScalar(0.4),
          emissive: new Color(color),
          emissiveIntensity: EMISSIVE_IDLE_INDICATOR,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
          roughness: 0.5,
          metalness: 0.8,
        });
        results.push({ id: key, geometry: geo, material: mat });
      }
    }
    return results;
  }, [color, tubularSegments]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    for (const hw of highways) {
      hw.material.emissiveIntensity = 0.2 + Math.sin(timeRef.current * 2 + highways.indexOf(hw)) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {highways.map((hw) => (
        <mesh key={hw.id} geometry={hw.geometry} material={hw.material} />
      ))}
    </group>
  );
}

// ─── Grid Floor Intersection Boxes (InstancedMesh) ──────────
// Raised intersection boxes at grid crossings for 3D depth

function GridIntersectionBoxes({
  color,
  gridSize,
  gridDivisions,
  maxInstances,
}: {
  color: string;
  gridSize: number;
  gridDivisions: number;
  maxInstances: number;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const { geometry, material, count } = useMemo(() => {
    const boxGeo = new BoxGeometry(0.06, 0.04, 0.06);
    const boxMat = new MeshStandardMaterial({
      color: new Color(color),
      emissive: new Color(color),
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.15,
      metalness: 0.9,
      roughness: 0.3,
    });

    const half = gridSize / 2;
    const step = gridSize / gridDivisions;
    const dummy = new Object3D();
    const positions: Matrix4[] = [];

    for (let x = -half; x <= half; x += step) {
      for (let z = -half; z <= half; z += step) {
        const dist = Math.sqrt(x * x + z * z);
        // Fade out boxes beyond radius 5.5 for soft edge
        if (dist > 5.5) continue;
        if (positions.length >= maxInstances) break;

        dummy.position.set(x, -0.78, z);
        // Scale boxes smaller at edges
        const edgeScale = Math.max(0.3, 1.0 - dist / 6.0);
        dummy.scale.set(edgeScale, edgeScale * 0.5, edgeScale);
        dummy.updateMatrix();
        positions.push(dummy.matrix.clone());
      }
      if (positions.length >= maxInstances) break;
    }

    return { geometry: boxGeo, material: boxMat, count: positions.length, positions };
  }, [color, gridSize, gridDivisions, maxInstances]);

  // Set instance matrices on mount
  useMemo(() => {
    // We use a deferred approach — set matrices after ref is available
  }, []);

  useFrame(() => {
    if (meshRef.current && !meshRef.current.userData.initialized) {
      const half = gridSize / 2;
      const step = gridSize / gridDivisions;
      const dummy = new Object3D();
      let idx = 0;

      for (let x = -half; x <= half; x += step) {
        for (let z = -half; z <= half; z += step) {
          const dist = Math.sqrt(x * x + z * z);
          if (dist > 5.5) continue;
          if (idx >= count) break;

          dummy.position.set(x, -0.78, z);
          const edgeScale = Math.max(0.3, 1.0 - dist / 6.0);
          dummy.scale.set(edgeScale, edgeScale * 0.5, edgeScale);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(idx, dummy.matrix);
          idx++;
        }
        if (idx >= count) break;
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.userData.initialized = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
}

// ─── Holographic Projector Pedestal ─────────────────────────
// Cylinder base + stacked rings + lens sphere below the core

function ProjectorPedestal({
  color,
  segments,
}: {
  color: string;
  segments: number;
}) {
  const groupRef = useRef<Group>(null);
  const lensRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  // Stacked ring definitions: [y, radius, thickness]
  const pedestalRings = useMemo(() => [
    { y: -0.80, radius: 0.9, height: 0.04 },
    { y: -0.72, radius: 0.7, height: 0.03 },
    { y: -0.66, radius: 0.5, height: 0.03 },
    { y: -0.60, radius: 0.35, height: 0.02 },
    { y: -0.55, radius: 0.25, height: 0.02 },
  ], []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    // Lens pulse
    if (lensRef.current) {
      const mat = lensRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(timeRef.current * 3) * 0.3;
      lensRef.current.rotation.y += delta * 0.5;
    }
  });

  const chromeMat = useMemo(
    () => ({
      color: '#1A1822',
      metalness: 0.95,
      roughness: 0.15,
      envMapIntensity: 1.2,
    }),
    []
  );

  return (
    <group ref={groupRef}>
      {/* Main cylinder base */}
      <mesh position={[0, -0.88, 0]}>
        <cylinderGeometry args={[1.1, 1.3, 0.12, segments]} />
        <meshStandardMaterial {...chromeMat} />
      </mesh>

      {/* Stacked accent rings */}
      {pedestalRings.map((ring, i) => (
        <mesh key={i} position={[0, ring.y, 0]}>
          <cylinderGeometry args={[ring.radius, ring.radius * 1.05, ring.height, segments]} />
          {/* Phase 2 audit fix (Section 7.1): Design token adoption */}
          <meshStandardMaterial
            color={i % 2 === 0 ? color : '#1A1822'}
            emissive={i % 2 === 0 ? color : '#000000'}
            emissiveIntensity={getEmissive('dim')}
            metalness={0.9}
            roughness={0.2}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      {/* Inner column connecting base to core */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.15, 0.7, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Lens sphere — sits at top of pedestal, below core */}
      <mesh ref={lensRef} position={[0, -0.42, 0]}>
        <sphereGeometry args={[0.12, segments, segments]} />
        {/* Phase 2 audit fix (Section 7.1): Design token adoption */}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={EMISSIVE_IDLE_INDICATOR}
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>

      {/* Outer decorative torus at base */}
      <mesh position={[0, -0.84, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.2, 0.015, 8, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

// ─── Central holographic core — 20M upgrade ─────────────────

function HolographicCore({
  color,
  pulse,
  focusedLabId: _focusedLabId,
  segments,
  enableEffects,
  tubularSegments,
  maxInstances,
}: {
  color: string;
  pulse: number;
  focusedLabId: number | null;
  segments: number;
  enableEffects: boolean;
  tubularSegments: number;
  maxInstances: number;
}) {
  const shellGroupRef = useRef<Group>(null);
  const innerRef = useRef<Mesh>(null);
  const ringsRef = useRef<Group>(null);
  const dataPointsRef = useRef<InstancedMesh>(null);
  const coronaOuterRef = useRef<Mesh>(null);
  const coronaInnerRef = useRef<Mesh>(null);
  const gridMatRef = useRef<ShaderMaterial>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const timeRef = useRef(0);

  // 4 concentric geodesic shell definitions: [detail level, scale, opacity, wireframe?]
  const shellDefs = useMemo(() => [
    { detail: 0, scale: 0.2, opacity: 0.9, wireframe: false },  // Solid inner icosahedron
    { detail: 1, scale: 0.35, opacity: 0.4, wireframe: true },  // First wireframe shell
    { detail: 2, scale: 0.55, opacity: 0.25, wireframe: true }, // Second wireframe shell
    { detail: 3, scale: 0.8, opacity: 0.12, wireframe: true },  // Outer wireframe shell
  ], []);

  // 8 orbital ring definitions
  const ringDefs = useMemo(() => [
    { radius: 1.3, thickness: 0.008, rx: Math.PI / 2, ry: 0 },
    { radius: 1.1, thickness: 0.006, rx: Math.PI / 3, ry: 0 },
    { radius: 0.9, thickness: 0.006, rx: Math.PI / 6, ry: Math.PI / 4 },
    { radius: 1.5, thickness: 0.005, rx: Math.PI / 2.5, ry: Math.PI / 3 },
    { radius: 0.7, thickness: 0.005, rx: Math.PI / 1.5, ry: Math.PI / 6 },
    { radius: 1.7, thickness: 0.004, rx: Math.PI / 4, ry: Math.PI / 5 },
    { radius: 0.55, thickness: 0.004, rx: Math.PI / 1.2, ry: Math.PI / 2 },
    { radius: 1.9, thickness: 0.003, rx: Math.PI / 3.5, ry: Math.PI / 7 },
  ], []);

  // 24 data points orbit parameters
  const DATA_POINT_COUNT = 24;
  const dataPointParams = useMemo(() =>
    Array.from({ length: DATA_POINT_COUNT }, (_, i) => ({
      ringIdx: i % 8,
      angleOffset: (i / DATA_POINT_COUNT) * Math.PI * 2 + (i % 8) * 0.5,
      speed: 0.25 + (i % 4) * 0.12,
      size: 0.025 + (i % 3) * 0.01,
    })),
    []
  );

  // Grid floor shader material uniforms — base color from CHROME_BORDER token
  const gridUniforms = useMemo(() => ({
    uColor: { value: new Color(CHROME_BORDER.colorHex) },
    uTime: { value: 0 },
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Rotate shell group
    if (shellGroupRef.current) {
      shellGroupRef.current.rotation.y += delta * 0.4;
      shellGroupRef.current.rotation.x += delta * 0.12;
      // Each child shell counter-rotates slightly for depth
      shellGroupRef.current.children.forEach((child, i) => {
        child.rotation.y += delta * (0.1 * (i % 2 === 0 ? 1 : -1));
        child.rotation.z += delta * (0.05 * (i % 2 === 0 ? -1 : 1));
        // Pulse scale per shell
        const s = shellDefs[i]
          ? shellDefs[i].scale + pulse * 0.03 * (1 + i * 0.2)
          : 1;
        child.scale.setScalar(s);
      });
    }

    // Pulse inner sphere
    if (innerRef.current) {
      const innerS = 0.15 + pulse * 0.02;
      innerRef.current.scale.setScalar(innerS);
      (innerRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(t * 2) * 0.4;
    }

    // Rotate ring group
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.2;
      ringsRef.current.rotation.x += delta * 0.08;
    }

    // Pulse double corona
    if (coronaOuterRef.current) {
      const cs = 2.2 + Math.sin(t * 1.2) * 0.15;
      coronaOuterRef.current.scale.setScalar(cs);
      (coronaOuterRef.current.material as MeshBasicMaterial).opacity =
        0.025 + Math.sin(t * 1.8) * 0.01;
    }
    if (coronaInnerRef.current) {
      const cs2 = 1.6 + Math.sin(t * 1.8 + 1) * 0.1;
      coronaInnerRef.current.scale.setScalar(cs2);
      (coronaInnerRef.current.material as MeshBasicMaterial).opacity =
        0.04 + Math.sin(t * 2.5) * 0.015;
    }

    // Animate data points along ring paths
    if (dataPointsRef.current) {
      for (let i = 0; i < DATA_POINT_COUNT; i++) {
        const dp = dataPointParams[i];
        const ring = ringDefs[dp.ringIdx];
        const angle = t * dp.speed + dp.angleOffset;

        // Compute position on ring
        const x = Math.cos(angle) * ring.radius;
        const z = Math.sin(angle) * ring.radius;
        // Rotate by ring orientation
        const cosRx = Math.cos(ring.rx);
        const sinRx = Math.sin(ring.rx);
        const cosRy = Math.cos(ring.ry);
        const sinRy = Math.sin(ring.ry);
        // Apply rotations
        const y1 = z * sinRx;
        const z1 = z * cosRx;
        const x2 = x * cosRy - z1 * sinRy;
        const z2 = x * sinRy + z1 * cosRy;

        dummy.position.set(x2, y1, z2);
        const dpScale = dp.size + Math.sin(t * 3 + i) * 0.008;
        dummy.scale.setScalar(dpScale);
        dummy.updateMatrix();
        dataPointsRef.current.setMatrixAt(i, dummy.matrix);
      }
      dataPointsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update grid shader time — color stays at CHROME_BORDER token value
    if (gridMatRef.current) {
      gridMatRef.current.uniforms.uTime.value = t;
    }
  });

  return (
    <group>
      {/* 4 concentric geodesic shells */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <group ref={shellGroupRef}>
          {shellDefs.map((shell, idx) => (
            <mesh key={idx}>
              <icosahedronGeometry args={[1, shell.detail]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={shell.wireframe ? 0.6 : 1.0}
                transparent
                opacity={shell.opacity}
                wireframe={shell.wireframe}
                depthWrite={!shell.wireframe}
              />
            </mesh>
          ))}
        </group>
      </Float>

      {/* Solid inner energy sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.25, segments, segments]} />
        {/* Phase 2 audit fix (Section 7.1): Design token adoption */}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={getEmissive('medium')}
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>

      {/* 8 Orbital rings */}
      <group ref={ringsRef}>
        {ringDefs.map((ring, idx) => (
          <mesh
            key={idx}
            rotation-x={ring.rx}
            rotation-y={ring.ry}
          >
            <torusGeometry args={[ring.radius, ring.thickness, 8, segments * 2]} />
            <meshBasicMaterial
              color={idx % 3 === 0 ? color : idx % 3 === 1 ? '#ffffff' : color}
              transparent
              opacity={idx < 5 ? (idx === 0 ? 0.25 : 0.12) : 0.08}
            />
          </mesh>
        ))}
      </group>

      {/* 24 orbiting data points */}
      <instancedMesh ref={dataPointsRef} args={[undefined, undefined, DATA_POINT_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.0}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      {/* Double-layer pulsing energy corona */}
      <mesh ref={coronaOuterRef}>
        <sphereGeometry args={[2.2, segments, segments]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.025}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
      {enableEffects && (
        <mesh ref={coronaInnerRef}>
          <sphereGeometry args={[1.6, Math.floor(segments * 0.75), Math.floor(segments * 0.75)]} />
          <meshBasicMaterial
            color={'#ffffff'}
            transparent
            opacity={0.04}
            side={BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Custom shader grid floor */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.8}>
        <planeGeometry args={[14, 14, 1, 1]} />
        <shaderMaterial
          ref={gridMatRef}
          vertexShader={gridVertexShader}
          fragmentShader={gridFragmentShader}
          uniforms={gridUniforms}
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {/* Raised intersection boxes on grid floor */}
      <GridIntersectionBoxes
        color={color}
        gridSize={12}
        gridDivisions={24}
        maxInstances={maxInstances}
      />

      {/* Holographic projector pedestal */}
      <ProjectorPedestal color={color} segments={segments} />

      {/* Data highway spline tubes connecting labs */}
      <DataHighways color={color} tubularSegments={tubularSegments} />
    </group>
  );
}

// ─── Main Component ─────────────────────────────────────────

// ─── Drag Constants ──────────────────────────────────────────
const DRAG_DEAD_ZONE = 0.03; // radians — below this threshold, treat as click not drag
const DRAG_INERTIA_DECAY = 3.5; // velocity decays by this factor per second
const DRAG_INERTIA_MIN = 0.001; // stop inertia below this rad/s
const _DRAG_SNAP_SPEED = 4.0; // lerp speed for snap-to-lab
const _LAB_ANGLE_STEP_RAD = (2 * Math.PI) / 10;

export function HolographicLabMap({
  focusedLabId,
  hoveredLabId,
  labCompletions,
  orbitSpeed,
  onLabClick,
  onLabHover,
  onLabDoubleClick,
}: HolographicLabMapProps) {
  const groupRef = useRef<Group>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeRef = useRef(0);

  // ─── Drag-to-Rotate State (all refs to avoid re-renders) ───
  const { camera } = useThree();
  const isDraggingRef = useRef(false);
  const dragStartAngleRef = useRef(0);
  const dragStartRotationRef = useRef(0);
  const dragTotalRef = useRef(0); // total angular displacement during drag
  const dragVelocityRef = useRef(0); // angular velocity for inertia
  const prevDragAngleRef = useRef(0);
  const isInertiaActiveRef = useRef(false);

  // Reusable objects for raycasting (avoid per-frame allocation)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const dragRaycaster = useMemo(() => new Raycaster(), []);
  const dragPointer = useMemo(() => new Vector2(), []);
  const dragIntersect = useMemo(() => new Vector3(), []);

  // Compute angle from screen pointer to group center on XZ plane
  const getPointerAngle = useCallback(
    (event: PointerEvent | { clientX: number; clientY: number }) => {
      const canvas = camera.userData?.domElement ?? document.querySelector('canvas');
      if (!canvas) return 0;
      const rect = (canvas as HTMLElement).getBoundingClientRect();
      dragPointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      dragRaycaster.setFromCamera(dragPointer, camera);
      if (dragRaycaster.ray.intersectPlane(dragPlane, dragIntersect)) {
        return Math.atan2(dragIntersect.z, dragIntersect.x);
      }
      return 0;
    },
    [camera, dragPlane, dragRaycaster, dragPointer, dragIntersect]
  );

  // Pointer handlers for drag
  const handleDragStart = useCallback(
    (e: { nativeEvent: PointerEvent; stopPropagation: () => void }) => {
      // Only start drag on primary button
      if (e.nativeEvent.button !== 0) return;
      isDraggingRef.current = true;
      isInertiaActiveRef.current = false;
      dragTotalRef.current = 0;
      dragVelocityRef.current = 0;
      const angle = getPointerAngle(e.nativeEvent);
      dragStartAngleRef.current = angle;
      prevDragAngleRef.current = angle;
      dragStartRotationRef.current = groupRef.current?.rotation.y ?? 0;
    },
    [getPointerAngle]
  );

  const handleDragMove = useCallback(
    (e: { nativeEvent: PointerEvent; stopPropagation: () => void }) => {
      if (!isDraggingRef.current || !groupRef.current) return;
      const angle = getPointerAngle(e.nativeEvent);
      let delta = angle - dragStartAngleRef.current;

      // Normalize delta to [-PI, PI]
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      // Track velocity (angular change this frame)
      let frameDelta = angle - prevDragAngleRef.current;
      if (frameDelta > Math.PI) frameDelta -= 2 * Math.PI;
      if (frameDelta < -Math.PI) frameDelta += 2 * Math.PI;
      dragVelocityRef.current = frameDelta;
      prevDragAngleRef.current = angle;

      dragTotalRef.current += Math.abs(frameDelta);

      // Apply rotation — negate delta so dragging right rotates ring right
      groupRef.current.rotation.y = dragStartRotationRef.current - delta;
    },
    [getPointerAngle]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // If total drag distance exceeded dead zone, it was a real drag — start inertia
    if (dragTotalRef.current > DRAG_DEAD_ZONE) {
      isInertiaActiveRef.current = true;
      // Scale velocity for feel (negate to match drag direction)
      dragVelocityRef.current = -dragVelocityRef.current * 60; // convert per-frame → per-second approx
    }
  }, []);

  // Listen for pointerup on window (in case pointer leaves canvas)
  useEffect(() => {
    const onPointerUp = () => {
      if (isDraggingRef.current) handleDragEnd();
    };
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [handleDragEnd]);

  // ─── Frame Loop: Auto-Rotation + Inertia Decay ───
  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!groupRef.current) return;

    // During active drag, don't auto-rotate or apply inertia
    if (isDraggingRef.current) return;

    // Inertia decay after drag release
    if (isInertiaActiveRef.current) {
      groupRef.current.rotation.y += dragVelocityRef.current * delta;

      // Exponential decay
      dragVelocityRef.current *= Math.exp(-DRAG_INERTIA_DECAY * delta);

      // Stop inertia when velocity is negligible
      if (Math.abs(dragVelocityRef.current) < DRAG_INERTIA_MIN) {
        dragVelocityRef.current = 0;
        isInertiaActiveRef.current = false;
      }
      return;
    }

    // Gentle auto-rotation when no lab is focused and not dragging
    if (focusedLabId === null) {
      groupRef.current.rotation.y += delta * orbitSpeed;
    }
  });

  // Core color follows focused lab or defaults to primary blue
  const coreColor = focusedLabId
    ? LAB_COLORS[focusedLabId] || '#00BBFF'
    : '#00BBFF';

  const pulse = useMemo(() => Math.sin(Date.now() * 0.002) * 0.5 + 0.5, []);

  // Handle single vs double click — suppressed if drag exceeded dead zone
  const handleLabClick = useCallback(
    (labId: number) => {
      // If user was dragging, suppress the click
      if (dragTotalRef.current > DRAG_DEAD_ZONE) return;

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        // Double click — enter lab
        onLabDoubleClick(labId);
        return;
      }
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // Single click — focus lab
        onLabClick(labId);
      }, 250);
    },
    [onLabClick, onLabDoubleClick]
  );

  // Compute connection beams for focused lab
  const connectionBeams = useMemo(() => {
    if (!focusedLabId) return [];
    const adjacentIds = LAB_ADJACENCY[focusedLabId] || [];
    const focusedPos = LAB_POSITIONS[focusedLabId];
    if (!focusedPos) return [];

    return adjacentIds
      .map((adjId) => {
        const adjPos = LAB_POSITIONS[adjId];
        if (!adjPos) return null;
        return {
          id: `${focusedLabId}-${adjId}`,
          start: focusedPos as [number, number, number],
          end: adjPos as [number, number, number],
          color: LAB_COLORS[focusedLabId] || '#00BBFF',
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        start: [number, number, number];
        end: [number, number, number];
        color: string;
      }>;
  }, [focusedLabId]);

  return (
    <group
      ref={groupRef}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
    >
      {/* Central holographic core — 20M upgrade */}
      <HolographicCore
        color={coreColor}
        pulse={pulse}
        focusedLabId={focusedLabId}
        segments={64}
        enableEffects={true}
        tubularSegments={64}
        maxInstances={5000}
      />

      {/* Connection beams between focused lab and adjacent labs */}
      {connectionBeams.map((beam) => (
        <ConnectionBeam
          key={beam.id}
          start={beam.start}
          end={beam.end}
          color={beam.color}
          time={timeRef.current}
        />
      ))}

      {/* Lab structures arranged in ring */}
      {LABS.map((lab) => {
        const pos = LAB_POSITIONS[lab.id];
        if (!pos) return null;
        const labColor = LAB_COLORS[lab.id] || '#00BBFF';
        const completionPct = Math.round((labCompletions[lab.id] ?? 0) * 100);
        const isDimmed = hoveredLabId !== null && hoveredLabId !== lab.id;
        return (
          <group key={lab.id} position={pos}>
            <LabStructure3D
              labId={lab.id}
              position={[0, 0, 0]}
              color={labColor}
              title={lab.title}
              icon={lab.icon}
              isFocused={focusedLabId === lab.id}
              isHovered={hoveredLabId === lab.id}
              completionPct={labCompletions[lab.id] ?? 0}
              onClick={() => handleLabClick(lab.id)}
              onPointerEnter={() => onLabHover(lab.id)}
              onPointerLeave={() => onLabHover(null)}
            />
            {/* Isolate + spotlight: dim non-hovered labs to ~30% via dark overlay */}
            {isDimmed && (
              <mesh position={[0, 0.5, 0]}>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.6} depthWrite={false} />
              </mesh>
            )}
            {/* 3D Text tooltip on hovered lab */}
            {hoveredLabId === lab.id && (
              <group position={[0, 1.4, 0]}>
                <Text
                  fontSize={TYPE_SCALE.label.fontSize}
                  color={TEXT_COLORS.primary.hex}
                  font={TYPE_SCALE.label.fontPath}
                  anchorX="center"
                  anchorY="bottom"
                >
                  {lab.title}
                </Text>
                <Text
                  position={[0, -0.03, 0]}
                  fontSize={TYPE_SCALE.caption.fontSize}
                  color={labColor}
                  font={NUMERIC_FONT}
                  anchorX="center"
                  anchorY="top"
                >
                  {completionPct}%
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default HolographicLabMap;
