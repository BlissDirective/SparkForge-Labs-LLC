'use client';

// ════════════════════════════════════════════════════
// LabStructure3D — Individual Lab 3D Structure (Enhanced)
// ════════════════════════════════════════════════════
// Enhanced version: ~2,500 tris per lab (200K-500K total budget).
// Each lab is a multi-part 3D model with independent sub-part animations,
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
// LOD-aware via useLOD hook (tier: 'standard'). Responds to hover/focus states.

import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useLOD, lodSphere, type LODState } from '@/hooks/useLOD';

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

// ■■ Lab 1: What IS AI? — Icosahedron + orbiting ring + inner wireframe ■■
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
  const ringRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = lod.segments;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.7;
      ringRef.current.rotation.z = t * 0.4;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = -t * 0.3;
      wireRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <group>
      {/* Main icosahedron */}
      <mesh>
        <icosahedronGeometry args={[0.35, Math.min(Math.floor(seg / 8), 2)]} />
        <meshPhysicalMaterial {...chromeProps} clearcoat={0.5} clearcoatRoughness={0.1} />
      </mesh>
      {/* Inner wireframe icosahedron */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[0.25, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
      </mesh>
      {/* Orbiting ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.5, 0.02, 8, Math.max(seg * 2, 24)]} />
        <meshStandardMaterial
          color={color}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// ■■ Lab 2: Teaching Machines — Torus knot + training loop rings ■■
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
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = lod.segments;
  const tubSeg = lod.tubularSegments;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.6;
      ring1Ref.current.rotation.y = t * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.4;
      ring2Ref.current.rotation.z = t * 0.5;
    }
  });

  return (
    <group>
      {/* Main torus knot (3,2) */}
      <mesh>
        <torusKnotGeometry args={[0.28, 0.08, Math.max(tubSeg * 2, 48), seg, 3, 2]} />
        <meshPhysicalMaterial {...chromeProps} clearcoat={0.3} />
      </mesh>
      {/* Training loop ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.45, 0.015, 8, Math.max(seg * 2, 24)]} />
        <meshStandardMaterial
          color={color}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Training loop ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.38, 0.012, 8, Math.max(seg * 2, 24)]} />
        <meshStandardMaterial
          color={color}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}

// ■■ Lab 3: Neural Networks — Dodecahedron + 6 neuron spheres + connections ■■
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
  const seg = lod.segments;

  // Neuron positions on a sphere
  const neuronPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const phi = Math.acos(-1 + (2 * i + 1) / 6);
      const theta = Math.sqrt(6 * Math.PI) * phi;
      positions.push([
        Math.sin(phi) * Math.cos(theta) * 0.55,
        Math.sin(phi) * Math.sin(theta) * 0.55,
        Math.cos(phi) * 0.55,
      ]);
    }
    return positions;
  }, []);

  // Connection lines geometry
  const lineGeometry = useMemo(() => {
    const points: number[] = [];
    // Connect each neuron to center and nearest neighbors
    for (const pos of neuronPositions) {
      // To center
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

// ■■ Lab 4: Generative AI — Crystal prism + rotating palette ring ■■
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
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = lod.segments;

  const paletteColors = useMemo(
    () => ['#FF6644', '#FFAA44', '#00FF88', '#00BBFF', '#AA66FF', '#FF66AA'],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (paletteRef.current) {
      paletteRef.current.rotation.y = t * 0.5;
      paletteRef.current.position.y = Math.sin(t * 0.8) * 0.03;
    }
  });

  return (
    <group>
      {/* Crystal prism (6-sided cone) */}
      <mesh rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.28, 0.6, 6, 1]} />
        <meshPhysicalMaterial
          {...chromeProps}
          transmission={0.4}
          thickness={1.0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          ior={1.5}
        />
      </mesh>
      {/* Palette ring with colored dots */}
      <group ref={paletteRef}>
        <mesh>
          <torusGeometry args={[0.48, 0.015, 8, Math.max(seg * 2, 24)]} />
          <meshStandardMaterial
            color={color}
            emissive={new THREE.Color(color)}
            emissiveIntensity={0.3}
            transparent
            opacity={0.5}
          />
        </mesh>
        {paletteColors.map((c, i) => {
          const angle = (i / paletteColors.length) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 0.48,
                Math.sin(angle) * 0.48,
                0,
              ]}
            >
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color={c}
                emissive={new THREE.Color(c)}
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// ■■ Lab 5: AI Helpers — Gear assembly (2 interlocking gears) ■■
function Lab5Structure({
  color,
  lod: _lod,
  isFocused,
  isHovered,
}: {
  color: string;
  lod: LODState;
  isFocused: boolean;
  isHovered: boolean;
}) {
  const gear1Ref = useRef<THREE.Group>(null);
  const gear2Ref = useRef<THREE.Group>(null);
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);

  const teethCount1 = 10;
  const teethCount2 = 8;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (gear1Ref.current) gear1Ref.current.rotation.z = t * 0.4;
    if (gear2Ref.current) gear2Ref.current.rotation.z = -t * 0.5; // Counter-rotate
  });

  const GearTeeth = useCallback(
    ({ count, radius, toothH, toothW }: { count: number; radius: number; toothH: number; toothW: number }) => (
      <>
        {Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0,
              ]}
              rotation={[0, 0, angle]}
            >
              <boxGeometry args={[toothW, toothH, 0.08]} />
              <meshPhysicalMaterial {...chromeProps} />
            </mesh>
          );
        })}
      </>
    ),
    [chromeProps]
  );

  return (
    <group>
      {/* Gear 1 (larger) */}
      <group ref={gear1Ref} position={[-0.18, 0.05, 0]}>
        <mesh>
          <torusGeometry args={[0.22, 0.04, 8, 24]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
        <GearTeeth count={teethCount1} radius={0.22} toothH={0.08} toothW={0.04} />
        {/* Hub */}
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 8]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
      </group>
      {/* Gear 2 (smaller, offset) */}
      <group ref={gear2Ref} position={[0.22, -0.12, 0]}>
        <mesh>
          <torusGeometry args={[0.16, 0.035, 8, 20]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
        <GearTeeth count={teethCount2} radius={0.16} toothH={0.07} toothW={0.035} />
        {/* Hub */}
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.1, 8]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Lab 6: Ethics — Octahedron + balance beam + 2 scale pans ■■
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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (beamRef.current) {
      // Gentle tilt oscillation
      beamRef.current.rotation.z = Math.sin(t * 0.7) * 0.12;
    }
  });

  return (
    <group>
      {/* Central octahedron */}
      <mesh position={[0, 0.2, 0]}>
        <octahedronGeometry args={[0.18, Math.min(Math.floor(lod.segments / 12), 1)]} />
        <meshPhysicalMaterial
          {...chromeProps}
          transmission={0.2}
          thickness={0.5}
          clearcoat={0.6}
        />
      </mesh>
      {/* Pillar */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.35, 8]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* Balance beam + pans */}
      <group ref={beamRef} position={[0, 0.05, 0]}>
        {/* Beam */}
        <mesh>
          <boxGeometry args={[0.7, 0.025, 0.025]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
        {/* Left chain */}
        <mesh position={[-0.32, -0.1, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.2, 4]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Left pan */}
        <mesh position={[-0.32, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.015, 12]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
        {/* Right chain */}
        <mesh position={[0.32, -0.1, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.2, 4]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Right pan */}
        <mesh position={[0.32, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.015, 12]} />
          <meshPhysicalMaterial {...chromeProps} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Lab 7: Computer Vision — Camera lens (nested cylinders + glass sphere) ■■
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
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = lod.segments;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (lensRef.current) {
      lensRef.current.rotation.z = t * 0.15;
      lensRef.current.position.y = Math.sin(t * 0.6) * 0.02;
    }
  });

  return (
    <group ref={lensRef}>
      {/* Outer barrel */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.35, Math.max(seg, 12)]} />
        <meshPhysicalMaterial
          color="#1A1822"
          emissive={new THREE.Color(color)}
          emissiveIntensity={getEmissiveIntensity(isFocused, isHovered) * 0.5}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {/* Inner barrel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.22, 0.25, 0.2, Math.max(seg, 12)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* Front lens ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
        <torusGeometry args={[0.24, 0.02, 8, Math.max(seg * 2, 20)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* Glass front element */}
      <mesh position={[0, 0, 0.2]}>
        <sphereGeometry args={[0.18, Math.max(seg, 12), Math.max(seg, 12)]} />
        <meshPhysicalMaterial
          color="#88CCFF"
          transmission={0.8}
          thickness={0.3}
          roughness={0.05}
          metalness={0.0}
          ior={1.5}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.15}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Focus ring details */}
      {[0.05, -0.05, -0.12].map((z, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z]}>
          <torusGeometry args={[0.3, 0.008, 6, 20]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Lab 8: Language — Speech bubble + floating text particles ■■
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
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = lod.segments;

  // Tail triangle geometry
  const tailGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(-0.08, -0.2);
    shape.lineTo(0.06, -0.12);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  // Floating text particle positions
  const textParticles = useMemo(() => {
    const particles: { pos: [number, number, number]; char: string; speed: number }[] = [];
    const chars = ['A', 'B', '言', '01', 'ñ', 'δ', 'こ', '∑'];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      particles.push({
        pos: [
          Math.cos(angle) * 0.5,
          Math.sin(angle) * 0.35 + 0.05,
          (Math.random() - 0.5) * 0.2,
        ],
        char: chars[i],
        speed: 0.3 + Math.random() * 0.4,
      });
    }
    return particles;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const p = textParticles[i];
        if (p) {
          child.position.y = p.pos[1] + Math.sin(t * p.speed + i * 0.8) * 0.08;
          child.position.x = p.pos[0] + Math.cos(t * p.speed * 0.5 + i) * 0.04;
        }
      });
    }
  });

  return (
    <group>
      {/* Speech bubble body */}
      <mesh>
        <capsuleGeometry args={[0.2, 0.25, Math.ceil(seg / 4), Math.max(seg, 10)]} />
        <meshPhysicalMaterial
          {...chromeProps}
          transmission={0.15}
          thickness={0.3}
          clearcoat={0.5}
        />
      </mesh>
      {/* Tail triangle */}
      <mesh
        geometry={tailGeometry}
        position={[-0.1, -0.3, 0.01]}
      >
        <meshPhysicalMaterial {...chromeProps} side={THREE.DoubleSide} />
      </mesh>
      {/* Floating text particles */}
      <group ref={particlesRef}>
        {textParticles.map((p, i) => (
          <Text
            key={i}
            position={p.pos}
            fontSize={0.06}
            color={color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/Orbitron-Bold.woff"
          >
            {p.char}
          </Text>
        ))}
      </group>
    </group>
  );
}

// ■■ Lab 9: Build with AI — Code cube + circuit TubeGeometry paths ■■
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
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const tubSeg = lod.tubularSegments;

  // Circuit line curves
  const circuits = useMemo(() => {
    const paths: THREE.CurvePath<THREE.Vector3>[] = [];
    const routeDefs: [number, number, number][][] = [
      // Right circuit
      [[0.25, 0.1, 0], [0.4, 0.1, 0], [0.5, 0, 0], [0.5, -0.15, 0]],
      // Left circuit
      [[-0.25, -0.1, 0], [-0.4, -0.1, 0], [-0.5, 0.05, 0], [-0.5, 0.2, 0]],
      // Top circuit
      [[0, 0.25, 0.1], [0, 0.4, 0.15], [0.15, 0.5, 0.1], [0.3, 0.5, 0]],
      // Bottom circuit
      [[0.1, -0.25, 0], [0.2, -0.4, 0], [0.1, -0.5, 0], [-0.1, -0.5, 0]],
    ];
    for (const route of routeDefs) {
      const curve = new THREE.CatmullRomCurve3(
        route.map((p) => new THREE.Vector3(...p))
      );
      const path = new THREE.CurvePath<THREE.Vector3>();
      path.add(curve);
      paths.push(path);
    }
    return paths;
  }, []);

  const tubeGeometries = useMemo(
    () =>
      circuits.map(
        (path) =>
          new THREE.TubeGeometry(
            path.curves[0] as THREE.Curve<THREE.Vector3>,
            Math.max(tubSeg, 12),
            0.012,
            6,
            false
          )
      ),
    [circuits, tubSeg]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (circuitRef.current) {
      circuitRef.current.rotation.y = t * 0.15;
    }
  });

  return (
    <group>
      {/* Code cube */}
      <mesh>
        <boxGeometry args={[0.38, 0.38, 0.38]} />
        <meshPhysicalMaterial
          {...chromeProps}
          clearcoat={0.3}
        />
      </mesh>
      {/* Wireframe overlay on cube */}
      <mesh>
        <boxGeometry args={[0.39, 0.39, 0.39]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.2} />
      </mesh>
      {/* Circuit lines */}
      <group ref={circuitRef}>
        {tubeGeometries.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color={color}
              emissive={new THREE.Color(color)}
              emissiveIntensity={getEmissiveIntensity(isFocused, isHovered)}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        ))}
        {/* Circuit node dots */}
        {[
          [0.5, -0.15, 0],
          [-0.5, 0.2, 0],
          [0.3, 0.5, 0],
          [-0.1, -0.5, 0],
        ].map((pos, i) => (
          <mesh key={`node-${i}`} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={new THREE.Color(color)}
              emissiveIntensity={0.8}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ■■ Lab 10: AI Futures — Rocket + exhaust particles ■■
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
  const chromeProps = useChromeMaterialProps(color, isFocused, isHovered);
  const seg = lod.segments;

  // Exhaust particle initial positions
  const exhaustParticles = useMemo(() => {
    const particles: { offset: [number, number, number]; speed: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      particles.push({
        offset: [Math.cos(angle) * 0.04, 0, Math.sin(angle) * 0.04],
        speed: 1.0 + Math.random() * 0.5,
      });
    }
    return particles;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (rocketRef.current) {
      rocketRef.current.position.y = Math.sin(t * 0.8) * 0.04;
      rocketRef.current.rotation.z = Math.sin(t * 0.3) * 0.05;
    }
    // Animate exhaust particles
    if (exhaustRef.current) {
      exhaustRef.current.children.forEach((child, i) => {
        const p = exhaustParticles[i];
        if (!p) return;
        const cycle = ((t * p.speed + i * 0.5) % 1.0);
        child.position.y = -0.4 - cycle * 0.3;
        child.position.x = p.offset[0];
        child.position.z = p.offset[2];
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = (1 - cycle) * 0.6;
        child.scale.setScalar(1 - cycle * 0.6);
      });
    }
  });

  return (
    <group ref={rocketRef}>
      {/* Nose cone */}
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.1, 0.22, Math.max(seg, 8)]} />
        <meshPhysicalMaterial {...chromeProps} clearcoat={0.4} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.35, Math.max(seg, 8)]} />
        <meshPhysicalMaterial {...chromeProps} />
      </mesh>
      {/* Engine section */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.12, Math.max(seg, 8)]} />
        <meshPhysicalMaterial
          color="#1A1822"
          emissive={new THREE.Color(color)}
          emissiveIntensity={getEmissiveIntensity(isFocused, isHovered) * 0.5}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {/* 3 Fins */}
      {[0, 120, 240].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh
            key={i}
            position={[
              Math.sin(rad) * 0.12,
              -0.15,
              Math.cos(rad) * 0.12,
            ]}
            rotation={[0, -rad, -0.3]}
          >
            <boxGeometry args={[0.15, 0.18, 0.01]} />
            <meshPhysicalMaterial {...chromeProps} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* Exhaust particles */}
      <group ref={exhaustRef}>
        {exhaustParticles.map((p, i) => (
          <mesh key={i} position={[p.offset[0], -0.4, p.offset[2]]}>
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
        <sphereGeometry args={lodSphere(lod, 0.35)} />
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
  const lod = useLOD({ tier: 'standard' });

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

      {/* Floating base platform */}
      <mesh position-y={-0.45} rotation-x={-Math.PI / 2}>
        <cylinderGeometry args={[0.5, 0.5, 0.04, 24]} />
        <meshStandardMaterial
          color="#111118"
          emissive={color}
          emissiveIntensity={0.1}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

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
