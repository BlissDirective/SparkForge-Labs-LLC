'use client';

// ════════════════════════════════════════════════════
// HolographicLabMap — 3D Holographic Map of All 10 Labs
// ════════════════════════════════════════════════════
// Enhancement 2.0: High-budget holographic core (3,000 tri budget).
// - Icosahedron(1,2) wireframe + solid inner sphere
// - 5 orbital rings with 12 orbiting data points
// - Pulsing energy corona
// - Custom shader grid floor with edge fade
// - Connection beams between focused lab and adjacent labs
//
// All existing interfaces and interactions preserved.

import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { LabStructure3D } from './LabStructure3D';
import { LAB_POSITIONS } from '@/stores/cockpitStore';
import { LABS } from '@/types';

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
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) * 0.5,
        Math.max(start[1], end[1]) + 0.8,
        (start[2] + end[2]) * 0.5
      ),
      new THREE.Vector3(...end),
    ]);
    const geo = new THREE.TubeGeometry(curve, 12, 0.015, 4, false);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    return { geometry: geo, material: mat };
  }, [start, end, color]);

  useFrame(() => {
    if (material) {
      // Animated pulsing opacity
      material.opacity = 0.15 + Math.sin(time * 3) * 0.08;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

// ─── Central holographic core — enhanced ────────────────────

function HolographicCore({
  color,
  pulse,
  focusedLabId: _focusedLabId,
}: {
  color: string;
  pulse: number;
  focusedLabId: number | null;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const dataPointsRef = useRef<THREE.InstancedMesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const gridMatRef = useRef<THREE.ShaderMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  // 5 orbital ring definitions: [radius, thickness, segments, rotX, rotY]
  const ringDefs = useMemo(() => [
    { radius: 1.3, thickness: 0.008, rx: Math.PI / 2, ry: 0 },
    { radius: 1.1, thickness: 0.006, rx: Math.PI / 3, ry: 0 },
    { radius: 0.9, thickness: 0.006, rx: Math.PI / 6, ry: Math.PI / 4 },
    { radius: 1.5, thickness: 0.005, rx: Math.PI / 2.5, ry: Math.PI / 3 },
    { radius: 0.7, thickness: 0.005, rx: Math.PI / 1.5, ry: Math.PI / 6 },
  ], []);

  // 12 data points orbit parameters
  const dataPointParams = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      ringIdx: i % 5,
      angleOffset: (i / 12) * Math.PI * 2 + (i % 5) * 0.7,
      speed: 0.3 + (i % 3) * 0.15,
    })),
    []
  );

  // Grid floor shader material uniforms
  const gridUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uTime: { value: 0 },
  }), [color]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Rotate outer wireframe core
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.5;
      coreRef.current.rotation.x += delta * 0.15;
      const s = 0.3 + pulse * 0.05;
      coreRef.current.scale.setScalar(s);
    }

    // Pulse inner sphere
    if (innerRef.current) {
      const innerS = 0.3 + pulse * 0.03;
      innerRef.current.scale.setScalar(innerS);
      (innerRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.6 + Math.sin(t * 2) * 0.3;
    }

    // Rotate ring group
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.2;
      ringsRef.current.rotation.x += delta * 0.1;
    }

    // Pulse corona
    if (coronaRef.current) {
      const cs = 1.8 + Math.sin(t * 1.5) * 0.1;
      coronaRef.current.scale.setScalar(cs);
      (coronaRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.03 + Math.sin(t * 2) * 0.01;
    }

    // Animate data points along ring paths
    if (dataPointsRef.current) {
      for (let i = 0; i < 12; i++) {
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
        const dpScale = 0.03 + Math.sin(t * 3 + i) * 0.01;
        dummy.scale.setScalar(dpScale);
        dummy.updateMatrix();
        dataPointsRef.current.setMatrixAt(i, dummy.matrix);
      }
      dataPointsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update grid shader time
    if (gridMatRef.current) {
      gridMatRef.current.uniforms.uTime.value = t;
      gridMatRef.current.uniforms.uColor.value.set(color);
    }
  });

  return (
    <group>
      {/* Central wireframe orb — icosahedron(1, 2) for more detail */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
            wireframe
          />
        </mesh>
      </Float>

      {/* Solid inner sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* 5 Orbital rings */}
      <group ref={ringsRef}>
        {ringDefs.map((ring, idx) => (
          <mesh
            key={idx}
            rotation-x={ring.rx}
            rotation-y={ring.ry}
          >
            <torusGeometry args={[ring.radius, ring.thickness, 8, 96]} />
            <meshBasicMaterial
              color={idx % 2 === 0 ? color : '#ffffff'}
              transparent
              opacity={idx === 0 ? 0.25 : 0.12}
            />
          </mesh>
        ))}
      </group>

      {/* 12 orbiting data points */}
      <instancedMesh ref={dataPointsRef} args={[undefined, undefined, 12]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.0}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      {/* Pulsing energy corona */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Custom shader grid floor replacing gridHelper */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.8}>
        <planeGeometry args={[14, 14, 1, 1]} />
        <shaderMaterial
          ref={gridMatRef}
          vertexShader={gridVertexShader}
          fragmentShader={gridFragmentShader}
          uniforms={gridUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function HolographicLabMap({
  focusedLabId,
  hoveredLabId,
  labCompletions,
  orbitSpeed,
  onLabClick,
  onLabHover,
  onLabDoubleClick,
}: HolographicLabMapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeRef = useRef(0);

  // Gentle auto-rotation when no lab is focused
  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!groupRef.current || focusedLabId !== null) return;
    groupRef.current.rotation.y += delta * orbitSpeed;
  });

  // Core color follows focused lab or defaults to primary blue
  const coreColor = focusedLabId
    ? LAB_COLORS[focusedLabId] || '#00BBFF'
    : '#00BBFF';

  const pulse = useMemo(() => Math.sin(Date.now() * 0.002) * 0.5 + 0.5, []);

  // Handle single vs double click
  const handleLabClick = useCallback(
    (labId: number) => {
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
    <group ref={groupRef}>
      {/* Central holographic core */}
      <HolographicCore
        color={coreColor}
        pulse={pulse}
        focusedLabId={focusedLabId}
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
        return (
          <LabStructure3D
            key={lab.id}
            labId={lab.id}
            position={pos}
            color={LAB_COLORS[lab.id] || '#00BBFF'}
            title={lab.title}
            icon={lab.icon}
            isFocused={focusedLabId === lab.id}
            isHovered={hoveredLabId === lab.id}
            completionPct={labCompletions[lab.id] ?? 0}
            onClick={() => handleLabClick(lab.id)}
            onPointerEnter={() => onLabHover(lab.id)}
            onPointerLeave={() => onLabHover(null)}
          />
        );
      })}
    </group>
  );
}
