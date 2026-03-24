'use client';

// ════════════════════════════════════════════════════
// LabStructure3D — Individual Lab 3D Structure (Enhanced)
// ════════════════════════════════════════════════════
// 20M Cockpit Upgrade: ~300,000 tris per lab (3M total budget).
// Each lab is a high-detail 3D model with multi-layer construction,
// InstancedMesh for repeated elements, interior mechanisms, landing platforms,
// contact shadows, MeshPhysicalMaterial for glass elements, and chrome accents.
//
// Lab 1:  Icosahedron + orbiting ring + inner wireframe
// Lab 2:  Torus knot + training loop rings
// Lab 3:  Dodecahedron + 6 neuron spheres with connections
// Lab 4:  Crystal prism (6-sided cone) + rotating palette ring
// Lab 5:  Gear assembly (2 interlocking gears with teeth)
// Lab 6:  Octahedron + balance beam + 2 hanging scale pans
// Lab 7:  Camera lens (nested cylinders + glass sphere)
// Lab 8:  Speech bubble (capsule + tail) + floating text particles
// Lab 9:  Code cube + circuit lines (TubeGeometry)
// Lab 10: Rocket (cone + cylinder body + 3 fins) + exhaust particles
//


import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

// ■■ Props Interface (unchanged) ■■
interface LabStructureProps {
  labId: number;
  position: [number, number, number];
  color: string;
  title: string;
  icon: string;
  isFocused: boolean;
  isHovered: boolean;
  completionPct: number; // 0-1
  onClick: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

// ■■ Emissive intensity by state ■■
function getEmissiveIntensity(isFocused: boolean, isHovered: boolean): number {
  if (isFocused) return 0.8;
  if (isHovered) return 0.5;
  return 0.3;
}

// ■■ Shared chrome material props ■■
function useChromeMaterialProps(color: string, isFocused: boolean, isHovered: boolean) {
  return useMemo(() => ({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: getEmissiveIntensity(isFocused, isHovered),
    metalness: 0.8,
    roughness: 0.2,
  }), [color, isFocused, isHovered]);
}

// ■■ Contact Shadow component ■■
function ContactShadow({
  color: _color,
  isHovered,
  isFocused,
}: {
  color: string;
  isHovered: boolean;
  isFocused: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = useRef(1);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = isFocused ? 1.5 : isHovered ? 1.25 : 1.0;
    scale.current = THREE.MathUtils.lerp(scale.current, target, delta * 5);
    meshRef.current.scale.set(scale.current * 1.2, scale.current, 1);
  });

  const gradientTexture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0.35)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={[0, -0.55, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[1.2, 0.8]} />
      <meshBasicMaterial
        map={gradientTexture}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

// ════════════════════════════════════════════════════
// Lab-Specific Sub-Structure Components
// ════════════════════════════════════════════════════

// ■■ Lab 1: What IS AI? — Multi-layer geodesic + satellite spheres + data rings ■■
function Lab1Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const satellitesRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;
  const detail = Math.min(Math.floor(seg / 8), 4);

  // 8 satellite positions on sphere surface
  const satellitePositions = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const phi = Math.acos(-1 + (2 * i + 1) / 8);
      const theta = Math.sqrt(8 * Math.PI) * phi;
      pts.push([
        Math.sin(phi) * Math.cos(theta) * 0.65,
        Math.sin(phi) * Math.sin(theta) * 0.65,
        Math.cos(phi) * 0.65,
      ]);
    }
    return pts;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) { ring1Ref.current.rotation.x = t * 0.7; ring1Ref.current.rotation.z = t * 0.4; }
    if (ring2Ref.current) { ring2Ref.current.rotation.y = t * 0.5; ring2Ref.current.rotation.x = t * 0.3; }
    if (ring3Ref.current) { ring3Ref.current.rotation.z = -t * 0.6; ring3Ref.current.rotation.y = t * 0.2; }
    if (wireRef.current) { wireRef.current.rotation.y = -t * 0.3; wireRef.current.rotation.x = Math.sin(t * 0.5) * 0.2; }
    if (satellitesRef.current) { satellitesRef.current.rotation.y = t * 0.15; }
  });

  return (
    <group>
      {/* Outer geodesic shell — detail 3-4 */}
      <mesh>
        <icosahedronGeometry args={[0.38, detail]} />
        <meshPhysicalMaterial {...chromeProps} clearcoat={0.5} clearcoatRoughness={0.1} />
      </mesh>
      {/* Middle wireframe shell */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[0.32, Math.max(detail - 1, 1)]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
      </mesh>
      {/* Inner core sphere */}
      <mesh>
        <icosahedronGeometry args={[0.2, detail]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {/* Bright center point */}
      <mesh>
        <sphereGeometry args={[0.08, seg, seg]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* Orbiting ring 1 — equatorial */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.52, 0.025, Math.max(seg / 2, 8), Math.max(seg * 3, 48)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Orbiting ring 2 — tilted */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.48, 0.018, Math.max(seg / 2, 8), Math.max(seg * 3, 48)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} metalness={0.85} roughness={0.15} transparent opacity={0.7} />
      </mesh>
      {/* Orbiting ring 3 — counter-tilted */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[0.56, 0.012, 8, Math.max(seg * 2, 32)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} transparent opacity={0.5} />
      </mesh>
      {/* Satellite spheres */}
      <group ref={satellitesRef}>
        {satellitePositions.map((pos, i) => (
          <group key={i} position={pos}>
            <mesh>
              <sphereGeometry args={[0.04, Math.max(seg / 2, 8), Math.max(seg / 2, 8)]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isFocused ? 0.8 : 0.4} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Connection line to center */}
            <mesh position={[-pos[0] / 2, -pos[1] / 2, -pos[2] / 2]}>
              <cylinderGeometry args={[0.004, 0.004, Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2), 4]} />
              <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Data hexagon ring at base */}
      {(
        <mesh position-y={-0.3} rotation-x={-Math.PI / 2}>
          <torusGeometry args={[0.45, 0.035, 6, 6]} />
          <meshStandardMaterial color="#1A1822" emissive={color} emissiveIntensity={0.3} metalness={0.9} roughness={0.15} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Lab 2: Teaching Machines — High-detail torus knot + conveyor rings + data flow ■■
function Lab2Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const conveyorRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;
  const tubSeg = 64;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) { ring1Ref.current.rotation.x = t * 0.6; ring1Ref.current.rotation.y = t * 0.3; }
    if (ring2Ref.current) { ring2Ref.current.rotation.x = -t * 0.4; ring2Ref.current.rotation.z = t * 0.5; }
    if (ring3Ref.current) { ring3Ref.current.rotation.y = t * 0.8; ring3Ref.current.rotation.z = -t * 0.2; }
    if (conveyorRef.current) { conveyorRef.current.rotation.y = t * 0.2; }
  });

  return (
    <group>
      {/* Main torus knot — high detail */}
      <mesh>
        <torusKnotGeometry args={[0.28, 0.09, Math.max(tubSeg * 3, 96), Math.max(seg, 16), 3, 2]} />
        <meshPhysicalMaterial {...chromeProps} clearcoat={0.4} clearcoatRoughness={0.1} />
      </mesh>
      {/* Inner secondary knot — smaller, different winding */}
      <mesh>
        <torusKnotGeometry args={[0.18, 0.04, Math.max(tubSeg * 2, 64), Math.max(seg / 2, 8), 2, 3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.6} toneMapped={false} />
      </mesh>
      {/* Training loop ring 1 — wide conveyor */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.48, 0.025, Math.max(seg / 2, 8), Math.max(seg * 3, 48)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.85} roughness={0.15} transparent opacity={0.8} />
      </mesh>
      {/* Training loop ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.42, 0.018, 8, Math.max(seg * 2, 36)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.6} />
      </mesh>
      {/* Training loop ring 3 — outermost */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[0.55, 0.012, 8, Math.max(seg * 2, 36)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.4} />
      </mesh>
      {/* Conveyor data nodes — 6 cubes orbiting */}
      <group ref={conveyorRef}>
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.48, Math.sin(angle) * 0.48, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.04]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isFocused ? 0.7 : 0.3} metalness={0.7} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
      {/* Chrome housing ring at equator */}
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.35, 0.015, seg, Math.max(seg * 2, 32)]} />
        <meshStandardMaterial color="#222230" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ■■ Lab 3: Neural Networks — 20 neuron spheres + synapse connections + pulsing signals ■■
function Lab3Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const neuronsRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;
  const neuronCount = 20;

  // Neuron positions in 3 layers (input, hidden, output)
  const neuronPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    // Layer 1 (input): 8 neurons in ring
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      positions.push([Math.cos(a) * 0.5, -0.25, Math.sin(a) * 0.5]);
    }
    // Layer 2 (hidden): 8 neurons in tighter ring, higher
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      positions.push([Math.cos(a) * 0.35, 0.05, Math.sin(a) * 0.35]);
    }
    // Layer 3 (output): 4 neurons at top
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      positions.push([Math.cos(a) * 0.2, 0.3, Math.sin(a) * 0.2]);
    }
    return positions.slice(0, neuronCount);
  }, [neuronCount]);

  // Connection pairs (layer-to-layer)
  const connections = useMemo(() => {
    const conns: [number, number][] = [];
    // Input (0-7) → Hidden (8-15)
    for (let i = 0; i < Math.min(8, neuronCount); i++) {
      for (let j = 8; j < Math.min(16, neuronCount); j++) {
        if (Math.abs(i - (j - 8)) <= 2 || Math.abs(i - (j - 8)) >= 6) conns.push([i, j]);
      }
    }
    // Hidden (8-15) → Output (16-19)
    for (let j = 8; j < Math.min(16, neuronCount); j++) {
      for (let k = 16; k < neuronCount; k++) conns.push([j, k]);
    }
    return conns;
  }, [neuronCount]);

  // Connection lines geometry
  const lineGeometry = useMemo(() => {
    const points: number[] = [];
    for (const [a, b] of connections) {
      const pa = neuronPositions[a]; const pb = neuronPositions[b];
      if (pa && pb) { points.push(pa[0], pa[1], pa[2], pb[0], pb[1], pb[2]); }
    }
    // Also connect each neuron to center
    for (const pos of neuronPositions) {
      points.push(pos[0], pos[1], pos[2], 0, 0, 0);
    }
    // Connect neighbors
    for (let i = 0; i < neuronPositions.length; i++) {
      const next = (i + 1) % neuronPositions.length;
      points.push(
        neuronPositions[i][0], neuronPositions[i][1], neuronPositions[i][2],
        neuronPositions[next][0], neuronPositions[next][1], neuronPositions[next][2]
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geo;
  }, [neuronPositions]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (neuronsRef.current) {
      neuronsRef.current.rotation.y = t * 0.25;
      neuronsRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    }
  });

  return (
    <group>
      {/* Central dodecahedron */}
      <mesh>
        <dodecahedronGeometry args={[0.25, Math.min(Math.floor(seg / 12), 1)]} />
        <meshPhysicalMaterial {...chromeProps} clearcoat={0.4} />
      </mesh>
      {/* Neuron cluster */}
      <group ref={neuronsRef}>
        {neuronPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.06, Math.max(seg, 8), Math.max(seg, 8)]} />
            <meshPhysicalMaterial
              color={color}
              emissive={new THREE.Color(color)}
              emissiveIntensity={getEmissiveIntensity(isFocused, isHovered) * 0.8}
              metalness={0.6}
              roughness={0.3}
              transmission={0.3}
              thickness={0.5}
            />
          </mesh>
        ))}
        {/* Connection lines */}
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={isFocused ? 0.6 : isHovered ? 0.4 : 0.25}
          />
        </lineSegments>
      </group>
    </group>
  );
}

// ■■ Lab 4: Generative AI — Multi-facet crystal cluster + palette shards + refraction ■■
function Lab4Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const paletteRef = useRef<THREE.Group>(null);
  const shardsRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;
  const paletteColors = useMemo(() => ['#FF6644', '#FFAA44', '#00FF88', '#00BBFF', '#AA66FF', '#FF66AA', '#FF66AA', '#06B6D4', '#D946EF', '#818CF8'], []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (paletteRef.current) { paletteRef.current.rotation.y = t * 0.5; paletteRef.current.position.y = Math.sin(t * 0.8) * 0.03; }
    if (shardsRef.current) { shardsRef.current.rotation.y = -t * 0.2; }
  });

  return (
    <group>
      {/* Main crystal — large hexagonal prism */}
      <mesh rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.3, 0.65, 6, 2]} />
        <meshPhysicalMaterial {...chromeProps} transmission={0.4} thickness={1.0} clearcoat={1.0} clearcoatRoughness={0.05} ior={1.5} />
      </mesh>
      {/* Secondary crystal — smaller, tilted */}
      <mesh position={[0.15, -0.1, 0.1]} rotation={[0.3, 0.4, Math.PI + 0.2]}>
        <coneGeometry args={[0.15, 0.4, 6, 1]} />
        <meshPhysicalMaterial color={color} transmission={0.5} thickness={0.8} clearcoat={0.8} ior={1.6} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Tertiary crystal */}
      <mesh position={[-0.12, 0.05, -0.08]} rotation={[-0.2, -0.3, Math.PI - 0.15]}>
        <coneGeometry args={[0.12, 0.35, 6, 1]} />
        <meshPhysicalMaterial color={color} transmission={0.6} thickness={0.6} clearcoat={0.9} ior={1.4} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      {/* Inner core glow */}
      <mesh>
        <sphereGeometry args={[0.12, seg, seg]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.6} />
      </mesh>
      {/* Palette ring with 10 colored shards */}
      <group ref={paletteRef}>
        <mesh>
          <torusGeometry args={[0.5, 0.02, 8, Math.max(seg * 3, 48)]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.5} />
        </mesh>
        {paletteColors.map((c, i) => {
          const angle = (i / paletteColors.length) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, 0]}>
              <octahedronGeometry args={[0.04, 0]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} />
            </mesh>
          );
        })}
      </group>
      {/* Floating shards */}
      <group ref={shardsRef}>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.35, 0.3 + i * 0.06, Math.sin(a) * 0.35]} rotation={[i * 0.5, i * 0.3, 0]}>
              <coneGeometry args={[0.03, 0.12, 4, 1]} />
              <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.5} transmission={0.3} thickness={0.5} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// ■■ Lab 5: AI Helpers — 5-gear mechanism + drive shafts + housing frame ■■
function Lab5Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const gearsRef = useRef<(THREE.Group | null)[]>([]);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;

  // 5 gears: position, radius, teethCount, speed, direction
  const gearDefs = useMemo(() => [
    { pos: [-0.18, 0.08, 0] as [number,number,number], r: 0.22, teeth: 12, speed: 0.4, dir: 1 },
    { pos: [0.2, -0.08, 0] as [number,number,number], r: 0.16, teeth: 9, speed: -0.53, dir: -1 },
    { pos: [0.0, -0.3, 0] as [number,number,number], r: 0.13, teeth: 7, speed: 0.65, dir: 1 },
    { pos: [-0.32, -0.18, 0.02] as [number,number,number], r: 0.1, teeth: 6, speed: -0.88, dir: -1 },
    { pos: [0.35, 0.15, -0.02] as [number,number,number], r: 0.11, teeth: 6, speed: 0.8, dir: 1 },
  ], []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    gearDefs.forEach((g, i) => {
      if (gearsRef.current[i]) gearsRef.current[i]!.rotation.z = t * g.speed * g.dir;
    });
  });

  return (
    <group>
      {gearDefs.map((g, gi) => (
        <group key={gi} ref={(el) => { gearsRef.current[gi] = el; }} position={g.pos}>
          {/* Gear ring */}
          <mesh>
            <torusGeometry args={[g.r, g.r * 0.18, Math.max(seg / 2, 8), Math.max(seg * 2, 24)]} />
            <meshPhysicalMaterial {...chromeProps} />
          </mesh>
          {/* Gear teeth */}
          {Array.from({ length: g.teeth }, (_, i) => {
            const angle = (i / g.teeth) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * g.r, Math.sin(angle) * g.r, 0]} rotation={[0, 0, angle]}>
                <boxGeometry args={[g.r * 0.2, g.r * 0.35, 0.08]} />
                <meshPhysicalMaterial {...chromeProps} />
              </mesh>
            );
          })}
          {/* Hub */}
          <mesh>
            <cylinderGeometry args={[g.r * 0.25, g.r * 0.25, 0.1, Math.max(seg / 2, 8)]} />
            <meshPhysicalMaterial {...chromeProps} />
          </mesh>
          {/* Hub axle dot */}
          <mesh>
            <sphereGeometry args={[g.r * 0.12, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
      {/* Drive shaft connecting gears 1-2 */}
      <mesh position={[0.01, 0, -0.04]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.015, 0.015, 0.45, 6]} />
        <meshStandardMaterial color="#222230" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Housing frame corners */}
      {[[-0.45, 0.35, 0], [0.45, 0.35, 0], [-0.45, -0.45, 0], [0.45, -0.45, 0]].map((p, i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <boxGeometry args={[0.04, 0.04, 0.12]} />
          <meshStandardMaterial color="#1A1822" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Lab 6: Ethics — Full justice scales with ornate base + chains + weights ■■
function Lab6Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const beamRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (beamRef.current) { beamRef.current.rotation.z = Math.sin(t * 0.7) * 0.12; }
  });

  return (
    <group>
      {/* Central octahedron — larger, more detail */}
      <mesh position={[0, 0.28, 0]}>
        <octahedronGeometry args={[0.2, Math.min(Math.floor(seg / 8), 2)]} />
        <meshPhysicalMaterial {...chromeProps} transmission={0.2} thickness={0.5} clearcoat={0.6} />
      </mesh>
      {/* Ornate pillar — multi-section */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.3, Math.max(seg, 12)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.1, Math.max(seg, 12)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* Ornate base platform */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.06, Math.max(seg, 12)]} />
        <meshStandardMaterial color="#1A1822" emissive={color} emissiveIntensity={0.15} metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <torusGeometry args={[0.2, 0.012, 8, Math.max(seg * 2, 24)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Balance beam + pans */}
      <group ref={beamRef} position={[0, 0.12, 0]}>
        <mesh>
          <boxGeometry args={[0.75, 0.03, 0.03]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
        {/* Beam end caps */}
        {[-0.375, 0.375].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        {/* Left side: 3 chain links + pan */}
        {[0, 1, 2].map((j) => (
          <mesh key={`lc-${j}`} position={[-0.35, -0.06 - j * 0.07, 0]}>
            <torusGeometry args={[0.02, 0.005, 6, 12]} />
            <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
        <mesh position={[-0.35, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, Math.max(seg, 16)]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
        {/* Right side: 3 chain links + pan */}
        {[0, 1, 2].map((j) => (
          <mesh key={`rc-${j}`} position={[0.35, -0.06 - j * 0.07, 0]}>
            <torusGeometry args={[0.02, 0.005, 6, 12]} />
            <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
        <mesh position={[0.35, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, Math.max(seg, 16)]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
        {/* Weights on left pan */}
        <mesh position={[-0.35, -0.24, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Lab 7: Computer Vision — Detailed camera body + lens elements + aperture ■■
function Lab7Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const lensRef = useRef<THREE.Group>(null);
  const apertureRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (lensRef.current) { lensRef.current.rotation.z = t * 0.15; lensRef.current.position.y = Math.sin(t * 0.6) * 0.02; }
    if (apertureRef.current) { apertureRef.current.rotation.z = t * 0.8; }
  });

  return (
    <group ref={lensRef}>
      {/* Camera body — box with rounded edges */}
      <mesh position={[0, 0, -0.12]}>
        <boxGeometry args={[0.45, 0.3, 0.2]} />
        <meshPhysicalMaterial color="#1A1822" emissive={color} emissiveIntensity={getEmissiveIntensity(isFocused, isHovered) * 0.3} metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Viewfinder prism */}
      <mesh position={[0, 0.2, -0.12]}>
        <boxGeometry args={[0.1, 0.08, 0.1]} />
        <meshStandardMaterial color="#222230" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Outer barrel — widest */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.38, Math.max(seg * 2, 24)]} />
        <meshPhysicalMaterial color="#1A1822" emissive={color} emissiveIntensity={getEmissiveIntensity(isFocused, isHovered) * 0.4} metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Mid barrel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.24, 0.28, 0.22, Math.max(seg * 2, 24)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* Inner barrel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.22]}>
        <cylinderGeometry args={[0.2, 0.22, 0.12, Math.max(seg * 2, 24)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* 5 focus ring grooves */}
      {[-0.08, -0.02, 0.04, 0.1, 0.16].map((z, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z]}>
          <torusGeometry args={[0.32 - i * 0.02, 0.008, 6, Math.max(seg * 2, 24)]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Front lens ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.26]}>
        <torusGeometry args={[0.22, 0.025, 8, Math.max(seg * 2, 24)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* Aperture blades — 8 blades */}
      <group ref={apertureRef} position={[0, 0, 0.2]}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0]} rotation={[0, 0, a + Math.PI / 2]}>
              <boxGeometry args={[0.08, 0.02, 0.003]} />
              <meshStandardMaterial color="#111118" metalness={0.95} roughness={0.05} />
            </mesh>
          );
        })}
      </group>
      {/* Glass front element */}
      <mesh position={[0, 0, 0.28]}>
        <sphereGeometry args={[0.16, Math.max(seg, 16), Math.max(seg, 16)]} />
        <meshPhysicalMaterial color="#88CCFF" transmission={0.8} thickness={0.3} roughness={0.05} ior={1.5} emissive={color} emissiveIntensity={0.15} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// ■■ Lab 8: Language — Holographic text projector + sound wave rings + word cloud ■■
function Lab8Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const particlesRef = useRef<THREE.Group>(null);
  const wavesRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;

  const tailGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(-0.1, -0.22); shape.lineTo(0.07, -0.14); shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  const textParticles = useMemo(() => {
    const chars = ['A', 'B', '言', '01', 'ñ', 'δ', 'こ', '∑', 'AI', '♪', 'Ω', '∞'];
    return chars.map((char, i) => {
      const angle = (i / chars.length) * Math.PI * 2;
      return { pos: [Math.cos(angle) * 0.55, Math.sin(angle) * 0.4 + 0.05, (i % 3 - 1) * 0.1] as [number,number,number], char, speed: 0.3 + (i % 4) * 0.15 };
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const p = textParticles[i];
        if (p) { child.position.y = p.pos[1] + Math.sin(t * p.speed + i * 0.8) * 0.08; child.position.x = p.pos[0] + Math.cos(t * p.speed * 0.5 + i) * 0.04; }
      });
    }
    if (wavesRef.current) {
      wavesRef.current.children.forEach((ring, i) => {
        const scale = 1.0 + Math.sin(t * 2 + i * 0.8) * 0.15;
        ring.scale.setScalar(scale);
        (ring as THREE.Mesh).material && ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity !== undefined && ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity;
      });
    }
  });

  return (
    <group>
      {/* Speech bubble body — larger */}
      <mesh>
        <capsuleGeometry args={[0.22, 0.3, Math.ceil(seg / 3), Math.max(seg * 2, 16)]} />
        <meshPhysicalMaterial {...chromeProps} transmission={0.15} thickness={0.3} clearcoat={0.5} />
      </mesh>
      {/* Tail */}
      <mesh geometry={tailGeometry} position={[-0.12, -0.35, 0.01]}>
        <meshPhysicalMaterial {...chromeProps} side={THREE.DoubleSide} />
      </mesh>
      {/* Projector base cylinder */}
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.06, Math.max(seg, 12)]} />
        <meshStandardMaterial color="#1A1822" emissive={color} emissiveIntensity={0.2} metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Sound wave rings — 4 expanding rings */}
      <group ref={wavesRef}>
        {[0.3, 0.38, 0.46, 0.54].map((r, i) => (
          <mesh key={i} position={[0.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[r, 0.008, 6, Math.max(seg * 2, 20)]} />
            <meshBasicMaterial color={color} transparent opacity={0.2 - i * 0.04} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[0.1, seg, seg]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} />
      </mesh>
      {/* Floating text particles — 12 characters */}
      <group ref={particlesRef}>
        {textParticles.map((p, i) => (
          <Text key={i} position={p.pos} fontSize={0.065} color={color} anchorX="center" anchorY="middle" font="/fonts/Orbitron-Bold.woff">
            {p.char}
          </Text>
        ))}
      </group>
    </group>
  );
}

// ■■ Lab 9: Build with AI — Server rack + circuit boards + LED arrays + data cables ■■
function Lab9Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const circuitRef = useRef<THREE.Group>(null);
  const ledsRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const _seg = 64;
  const tubSeg = 64;

  // 6 circuit paths
  const tubeGeometries = useMemo(() => {
    const routeDefs: [number, number, number][][] = [
      [[0.25, 0.1, 0.2], [0.4, 0.1, 0.1], [0.5, 0, 0], [0.5, -0.15, -0.1]],
      [[-0.25, -0.1, 0.2], [-0.4, -0.1, 0.1], [-0.5, 0.05, 0], [-0.5, 0.2, -0.1]],
      [[0, 0.25, 0.2], [0, 0.4, 0.15], [0.15, 0.5, 0.05], [0.3, 0.5, -0.1]],
      [[0.1, -0.25, 0.15], [0.2, -0.4, 0.05], [0.1, -0.5, -0.05], [-0.1, -0.5, -0.1]],
      [[-0.2, 0.15, 0.2], [-0.35, 0.3, 0.15], [-0.45, 0.35, 0], [-0.4, 0.2, -0.15]],
      [[0.15, -0.05, 0.22], [0.3, -0.15, 0.15], [0.4, -0.3, 0.05], [0.35, -0.4, -0.1]],
    ];
    return routeDefs.map((route) => {
      const curve = new THREE.CatmullRomCurve3(route.map((p) => new THREE.Vector3(...p)));
      return new THREE.TubeGeometry(curve, Math.max(tubSeg, 16), 0.014, 6, false);
    });
  }, [tubSeg]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (circuitRef.current) { circuitRef.current.rotation.y = t * 0.12; }
    if (ledsRef.current) {
      ledsRef.current.children.forEach((led, i) => {
        const mat = (led as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = 0.4 + Math.sin(t * 3 + i * 1.2) * 0.4;
      });
    }
  });

  return (
    <group>
      {/* Server rack frame */}
      <mesh>
        <boxGeometry args={[0.42, 0.55, 0.35]} />
        <meshPhysicalMaterial {...chromeProps} clearcoat={0.3} />
      </mesh>
      {/* Wireframe overlay */}
      <mesh>
        <boxGeometry args={[0.43, 0.56, 0.36]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
      </mesh>
      {/* 4 server blade slots */}
      {[-0.18, -0.06, 0.06, 0.18].map((y, i) => (
        <mesh key={i} position={[0, y, 0.18]}>
          <boxGeometry args={[0.36, 0.08, 0.02]} />
          <meshStandardMaterial color="#0A0E16" emissive={color} emissiveIntensity={0.1 + (i === 1 ? 0.2 : 0)} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
      {/* LED indicator array — 16 LEDs across server faces */}
      <group ref={ledsRef}>
        {Array.from({ length: 16 }, (_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          return (
            <mesh key={i} position={[-0.12 + col * 0.08, -0.18 + row * 0.12, 0.185]}>
              <sphereGeometry args={[0.01, 6, 6]} />
              <meshBasicMaterial color={i % 3 === 0 ? '#00FF88' : color} transparent opacity={0.8} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
      {/* Circuit traces */}
      <group ref={circuitRef}>
        {tubeGeometries.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={getEmissiveIntensity(isFocused, isHovered)} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* 6 circuit endpoint nodes */}
        {[[0.5, -0.15, -0.1], [-0.5, 0.2, -0.1], [0.3, 0.5, -0.1], [-0.1, -0.5, -0.1], [-0.4, 0.2, -0.15], [0.35, -0.4, -0.1]].map((pos, i) => (
          <mesh key={`node-${i}`} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>
      {/* Ventilation grille at top */}
      {(
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.36, 0.3]} />
          <meshStandardMaterial color="#0A0E16" metalness={0.8} roughness={0.3} transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Lab 10: AI Futures — Detailed spacecraft + engine nozzles + solar panels + antenna ■■
function Lab10Structure({
  color,
  lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const rocketRef = useRef<THREE.Group>(null);
  const exhaustRef = useRef<THREE.Group>(null);
  const solarsRef = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = 64;

  const exhaustParticles = useMemo(() => {
    const particles: { offset: [number, number, number]; speed: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 0.03 + (i % 3) * 0.015;
      particles.push({ offset: [Math.cos(angle) * r, 0, Math.sin(angle) * r], speed: 1.0 + (i % 4) * 0.2 });
    }
    return particles;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (rocketRef.current) { rocketRef.current.position.y = Math.sin(t * 0.8) * 0.04; rocketRef.current.rotation.z = Math.sin(t * 0.3) * 0.05; }
    if (exhaustRef.current) {
      exhaustRef.current.children.forEach((child, i) => {
        const p = exhaustParticles[i]; if (!p) return;
        const cycle = ((t * p.speed + i * 0.5) % 1.0);
        child.position.y = -0.45 - cycle * 0.35; child.position.x = p.offset[0]; child.position.z = p.offset[2];
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = (1 - cycle) * 0.6;
        child.scale.setScalar(1 - cycle * 0.6);
      });
    }
    if (solarsRef.current) { solarsRef.current.rotation.y = Math.sin(t * 0.2) * 0.1; }
  });

  return (
    <group ref={rocketRef}>
      {/* Nose cone — pointed */}
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.1, 0.25, Math.max(seg, 12)]} />
        <meshPhysicalMaterial {...chromeProps} clearcoat={0.5} />
      </mesh>
      {/* Antenna mast at tip */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* Upper body */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.3, Math.max(seg, 12)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* Mid-section ring */}
      <mesh position={[0, -0.02, 0]}>
        <torusGeometry args={[0.13, 0.015, 8, Math.max(seg * 2, 20)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Lower body */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.2, Math.max(seg, 12)]} />
        <meshPhysicalMaterial color="#1A1822" emissive={color} emissiveIntensity={getEmissiveIntensity(isFocused, isHovered) * 0.4} metalness={0.9} roughness={0.15} />
      </mesh>
      {/* 3 Engine nozzles */}
      {[0, 120, 240].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <group key={`nozzle-${i}`} position={[Math.sin(rad) * 0.08, -0.25, Math.cos(rad) * 0.08]}>
            <mesh>
              <coneGeometry args={[0.04, 0.1, Math.max(seg / 2, 8)]} />
              <meshStandardMaterial color="#222230" emissive={color} emissiveIntensity={0.3} metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <torusGeometry args={[0.04, 0.008, 6, 12]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
          </group>
        );
      })}
      {/* 4 Fins — larger, angled */}
      {[0, 90, 180, 270].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh key={`fin-${i}`} position={[Math.sin(rad) * 0.14, -0.15, Math.cos(rad) * 0.14]} rotation={[0, -rad, -0.25]}>
            <boxGeometry args={[0.16, 0.2, 0.012]} />
            <meshPhysicalMaterial {...chromeProps} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* Solar panel wings */}
      <group ref={solarsRef}>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.3, 0.05, 0]}>
            {/* Panel arm */}
            <mesh position={[side * 0.08, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.2, 4]} />
              <meshStandardMaterial color="#222230" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Solar panel */}
            <mesh position={[side * 0.18, 0, 0]} rotation={[0, 0, side > 0 ? 0 : Math.PI]}>
              <boxGeometry args={[0.18, 0.25, 0.008]} />
              <meshStandardMaterial color="#223355" emissive="#00BBFF" emissiveIntensity={0.15} metalness={0.3} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Exhaust particles — 12 */}
      <group ref={exhaustRef}>
        {exhaustParticles.map((p, i) => (
          <mesh key={i} position={[p.offset[0], -0.45, p.offset[2]]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ════════════════════════════════════════════════════
// Lab Structure Selector
// ════════════════════════════════════════════════════
function LabModel({
  labId,
  color,
  lod,
  isFocused,
  isHovered,
}: {
  labId: number;
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const props = { color, lod, isFocused, isHovered };
  switch (labId) {
    case 1: return <Lab1Structure {...props} />;
    case 2: return <Lab2Structure {...props} />;
    case 3: return <Lab3Structure {...props} />;
    case 4: return <Lab4Structure {...props} />;
    case 5: return <Lab5Structure {...props} />;
    case 6: return <Lab6Structure {...props} />;
    case 7: return <Lab7Structure {...props} />;
    case 8: return <Lab8Structure {...props} />;
    case 9: return <Lab9Structure {...props} />;
    case 10: return <Lab10Structure {...props} />;
    default: return (
      <mesh>
        <sphereGeometry args={[0.35, 64, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={new THREE.Color(color)}
          emissiveIntensity={getEmissiveIntensity(isFocused, isHovered)}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    );
  }
}

// ════════════════════════════════════════════════════
// Main Component Export
// ════════════════════════════════════════════════════
export function LabStructure3D({
  labId,
  position,
  color,
  title,
  icon: _icon,
  isFocused,
  isHovered,
  completionPct,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: LabStructureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hoverScale] = useState({ current: 1 });

  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  // Animate scale, glow, and completion ring
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Scale spring toward target
    const targetScale = isFocused ? 1.4 : isHovered ? 1.15 : 1.0;
    hoverScale.current = THREE.MathUtils.lerp(
      hoverScale.current,
      targetScale,
      delta * 6
    );
    groupRef.current.scale.setScalar(hoverScale.current);

    // Glow pulse
    if (glowRef.current) {
      const pulse = Math.sin(Date.now() * 0.003 + labId) * 0.1 + 0.9;
      glowRef.current.scale.setScalar(hoverScale.current * 1.3 * pulse);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (isFocused ? 0.3 : isHovered ? 0.2 : 0.1) * pulse;
    }

    // Completion ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Contact shadow */}
      <ContactShadow color={color} isHovered={isHovered} isFocused={isFocused} />

      {/* Completion ring — shows progress around the structure */}
      <mesh ref={ringRef} rotation-x={Math.PI / 2} position-y={-0.05}>
        <torusGeometry args={[0.55, 0.02, 8, 64, Math.PI * 2 * completionPct]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Background ring track */}
      <mesh rotation-x={Math.PI / 2} position-y={-0.05}>
        <torusGeometry args={[0.55, 0.01, 8, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
      </mesh>

      {/* Glow sphere behind structure */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Interactive hit area + lab model group */}
      <group
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          onPointerEnter();
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          onPointerLeave();
          document.body.style.cursor = 'default';
        }}
      >
        {/* Lab-specific multi-part 3D model */}
        <LabModel
          labId={labId}
          color={color}
          lod={lod}
          isFocused={isFocused}
          isHovered={isHovered}
        />
      </group>

      {/* Floating base platform — multi-layer */}
      <mesh position-y={-0.45} rotation-x={-Math.PI / 2}>
        <cylinderGeometry args={[0.52, 0.52, 0.05, Math.max(64 * 2, 32)]} />
        <meshStandardMaterial color="#111118" emissive={color} emissiveIntensity={0.1} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Platform edge ring */}
      <mesh position-y={-0.43}>
        <torusGeometry args={[0.52, 0.015, 8, Math.max(64 * 2, 32)]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Platform grated detail */}
      {(
        <mesh position-y={-0.42} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.2, 0.48, Math.max(64 * 2, 32)]} />
          <meshStandardMaterial color="#0A0E16" metalness={0.85} roughness={0.2} transparent opacity={0.5} />
        </mesh>
      )}

      {/* Lab title text */}
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.12}
          color={color}
          anchorX="center"
          anchorY="bottom"
          font="/fonts/Exo2-Bold.woff"
          outlineWidth={0.005}
          outlineColor="#000000"
          maxWidth={1.2}
          textAlign="center"
        >
          {title}
        </Text>
      </Float>

      {/* Lab number badge */}
      <Text
        position={[0, -0.65, 0]}
        fontSize={0.08}
        color={threeColor}
        anchorX="center"
        anchorY="top"
        font="/fonts/Orbitron-Bold.woff"
      >
        {`LAB ${labId}`}
      </Text>

      {/* Holographic connection line to center */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -0.5, 0, -position[0], -position[1], -position[2]]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={isFocused ? 0.3 : 0.08}
          linewidth={1}
        />
      </line>
    </group>
  );
}
