'use client';

// ================================================================
// ROBOT VACUUM 3D — Lab 5 (AI Helpers) — v3 Enhanced 3D
// [v3] 3D isometric room with furniture depth
// [v3] Dust particles as Points, clean burst animation
// [v3] Vacuum robot with directional arrow + trail line
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~3K triangles)
// ================================================================

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ---- Types ----

interface FurnitureItem {
  pos: [number, number];
  emoji: string;
}

interface RoomData {
  walls: [number, number][];
  furniture: FurnitureItem[];
  dirt: [number, number][];
  charger: [number, number];
}

interface RobotVacuum3DProps {
  room: RoomData;
  vacPos: [number, number];
  vacDir: number;
  cleaned: Set<string>;
  trail: string[];
  gridSize: number;
  running: boolean;
  isMobile?: boolean;
}

// ---- Floor Grid ----

function FloorGrid({ size, color }: { size: number; color: string }) {
  const lines = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= size; i++) {
      // Horizontal
      pts.push(0, 0.01, i, size, 0.01, i);
      // Vertical
      pts.push(i, 0.01, 0, i, 0.01, size);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  }, [size]);

  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size / 2, 0, size / 2]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0a1a12" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Grid lines */}
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={color} transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

// ---- Furniture Block ----

function FurnitureBlock({ pos }: { pos: [number, number] }) {
  return (
    <mesh position={[pos[1] + 0.5, 0.3, pos[0] + 0.5]}>
      <boxGeometry args={[0.8, 0.6, 0.8]} />
      <meshStandardMaterial color="#4a3728" roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

// ---- Wall Block ----

function WallBlock({ pos }: { pos: [number, number] }) {
  return (
    <mesh position={[pos[1] + 0.5, 0.4, pos[0] + 0.5]}>
      <boxGeometry args={[0.95, 0.8, 0.95]} />
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.9}
        metalness={0.05}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

// ---- Dust Particles ----

function DustParticles({
  dirtPositions,
  cleaned,
}: {
  dirtPositions: [number, number][];
  cleaned: Set<string>;
}) {
  const ref = useRef<THREE.Points>(null);

  const { posArray, colArray } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    dirtPositions.forEach(([r, c]) => {
      pos.push(c + 0.5, 0.1, r + 0.5);
      col.push(0.6, 0.4, 0.2);
    });
    return {
      posArray: new Float32Array(pos),
      colArray: new Float32Array(col),
      count: dirtPositions.length,
    };
  }, [dirtPositions]);

  useFrame(() => {
    if (!ref.current) return;
    const colAttr = ref.current.geometry.getAttribute('color');
    dirtPositions.forEach(([r, c], i) => {
      const isCleaned = cleaned.has(`${r},${c}`);
      colAttr.setXYZ(
        i,
        isCleaned ? 0.1 : 0.6,
        isCleaned ? 0.8 : 0.4,
        isCleaned ? 0.1 : 0.2
      );
    });
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posArray, 3]} />
        <bufferAttribute attach="attributes-color" args={[colArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// ---- Vacuum Robot ----

function VacuumRobot({
  pos,
  dir,
  running,
}: {
  pos: [number, number];
  dir: number;
  running: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Direction to rotation (0=right, 1=down, 2=left, 3=up)
  const rotations = [0, -Math.PI / 2, Math.PI, Math.PI / 2];

  useFrame((state) => {
    if (!groupRef.current) return;
    // Smooth position lerp
    const tx = pos[1] + 0.5;
    const tz = pos[0] + 0.5;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x, tx, 0.15
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z, tz, 0.15
    );
    // Smooth rotation
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, rotations[dir], 0.15
    );
    // Glow pulse when running
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = running
        ? 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.15
        : 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[pos[1] + 0.5, 0.1, pos[0] + 0.5]}>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.15, 16]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Direction arrow */}
      <mesh position={[0.25, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.2, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#10B981" emissiveIntensity={0.5} />
      </mesh>
      {/* Glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.36, 0.45, 24]} />
        <meshBasicMaterial
          color="#10B981"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---- Trail Line ----

function TrailLine({ trail }: { trail: string[] }) {
  const ref = useRef<THREE.Line>(null);

  useEffect(() => {
    if (!ref.current || trail.length < 2) return;
    const pts = trail.map((key) => {
      const [r, c] = key.split(',').map(Number);
      return new THREE.Vector3(c + 0.5, 0.05, r + 0.5);
    });
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    ref.current.geometry.dispose();
    ref.current.geometry = geom;
  }, [trail]);

  return (
    // @ts-expect-error — R3F line element type mismatch with Three.js Line
    <line ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="#10B981" transparent opacity={0.3} />
    </line>
  );
}

// ---- Charger Marker ----

function ChargerMarker({ pos }: { pos: [number, number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.05 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
  });

  return (
    <mesh ref={ref} position={[pos[1] + 0.5, 0.05, pos[0] + 0.5]}>
      <boxGeometry args={[0.4, 0.08, 0.4]} />
      <meshStandardMaterial
        color="#FBBF24"
        emissive="#FBBF24"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

// ---- Scene (inner R3F) ----

function RoomScene({
  room,
  vacPos,
  vacDir,
  cleaned,
  trail,
  gridSize,
  running,
}: Omit<RobotVacuum3DProps, 'isMobile'>) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
      <pointLight
        position={[vacPos[1] + 0.5, 1, vacPos[0] + 0.5]}
        intensity={0.4}
        color="#10B981"
      />

      {/* Floor + Grid */}
      <FloorGrid size={gridSize} color="#10B981" />

      {/* Walls */}
      {room.walls.map(([r, c], i) => (
        <WallBlock key={`w-${i}`} pos={[r, c]} />
      ))}

      {/* Furniture */}
      {room.furniture.map((f, i) => (
        <FurnitureBlock key={`f-${i}`} pos={f.pos} />
      ))}

      {/* Charger */}
      <ChargerMarker pos={room.charger} />

      {/* Dust */}
      <DustParticles dirtPositions={room.dirt} cleaned={cleaned} />

      {/* Trail */}
      <TrailLine trail={trail} />

      {/* Vacuum */}
      <VacuumRobot pos={vacPos} dir={vacDir} running={running} />

      {/* Environment */}
      <Environment preset="night" />

      {/* Bloom */}
      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ---- Main Export ----

export default function RobotVacuum3D(props: RobotVacuum3DProps) {
  if (props.isMobile) return null;

  return (
    <div
      style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [5, 6, 5], fov: 45 }}
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => {
          camera.lookAt(3, 0, 3);
        }}
      >
        <RoomScene {...props} />
      </Canvas>
    </div>
  );
}
