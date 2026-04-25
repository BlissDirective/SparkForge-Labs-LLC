// ENH: Dust cloud particles + glowing trail + LED eyes + victory spin
'use client';

// ================================================================
// ROBOT VACUUM 3D — Lab 5 (AI Helpers) — v3 Enhanced 3D
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// [v3] 3D isometric room with furniture depth
// [v3] Dust particles as Points, clean burst animation
// [v3] Vacuum robot with directional arrow + trail line
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~3K triangles)
// [ENH] Dust cloud particle bursts via shared gameParticles library
// [ENH] Glowing instanced-sphere trail replacing static line
// [ENH] LED "eyes" with state-based color (green/blue/yellow)
// [ENH] Victory spin animation + confetti burst when all dust cleaned
// ================================================================

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, invalidate } from '@react-three/fiber';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Points,
  Vector3,
} from 'three';
import {
  spawnParticles,
  updateParticles,
  PARTICLE_PRESETS,
  Particle,
} from '@/lib/3d/gameParticles';
import RobotVacuumEnvironment from '@/components/3d/environments/RobotVacuumEnvironment';

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
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(pts, 3));
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

// ---- Dust Particles (static grid dust) ----

function DustParticles({
  dirtPositions,
  cleaned,
}: {
  dirtPositions: [number, number][];
  cleaned: Set<string>;
}) {
  const ref = useRef<Points>(null);

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

// ---- ENH: Dust Cloud Burst Particles (shared gameParticles) ----

function DustCloudParticles({ particles }: { particles: Particle[] }) {
  const pointsRef = useRef<Points>(null);
  const maxCount = 20; // dustCloud preset count

  const posBuffer = useMemo(() => new Float32Array(maxCount * 3), []);
  const colBuffer = useMemo(() => new Float32Array(maxCount * 3), []);

  useFrame(() => {
    if (!pointsRef.current || particles.length === 0) return;

    for (let i = 0; i < maxCount; i++) {
      if (i < particles.length && particles[i].life > 0) {
        const p = particles[i];
        posBuffer[i * 3] = p.position.x;
        posBuffer[i * 3 + 1] = p.position.y;
        posBuffer[i * 3 + 2] = p.position.z;
        colBuffer[i * 3] = p.color.r;
        colBuffer[i * 3 + 1] = p.color.g;
        colBuffer[i * 3 + 2] = p.color.b;
      } else {
        posBuffer[i * 3 + 1] = -100; // hide offscreen
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    invalidate();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posBuffer, 3]} count={maxCount} />
        <bufferAttribute attach="attributes-color" args={[colBuffer, 3]} count={maxCount} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

// ---- ENH: Victory Confetti Particles ----

function VictoryParticles({ particles }: { particles: Particle[] }) {
  const pointsRef = useRef<Points>(null);
  const maxCount = 80; // victoryFireworks preset count

  const posBuffer = useMemo(() => new Float32Array(maxCount * 3), []);
  const colBuffer = useMemo(() => new Float32Array(maxCount * 3), []);

  useFrame(() => {
    if (!pointsRef.current || particles.length === 0) return;

    for (let i = 0; i < maxCount; i++) {
      if (i < particles.length && particles[i].life > 0) {
        const p = particles[i];
        posBuffer[i * 3] = p.position.x;
        posBuffer[i * 3 + 1] = p.position.y;
        posBuffer[i * 3 + 2] = p.position.z;
        colBuffer[i * 3] = p.color.r;
        colBuffer[i * 3 + 1] = p.color.g;
        colBuffer[i * 3 + 2] = p.color.b;
      } else {
        posBuffer[i * 3 + 1] = -100;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    invalidate();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posBuffer, 3]} count={maxCount} />
        <bufferAttribute attach="attributes-color" args={[colBuffer, 3]} count={maxCount} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

// ---- ENH: Glowing Trail (instanced spheres that fade) ----

function GlowingTrail({ trail, color }: { trail: string[]; color: string }) {
  const meshRef = useRef<InstancedMesh>(null);
  const maxTrailPoints = 64;
  const dummy = useMemo(() => new Object3D(), []);
  const trailColor = useMemo(() => new Color(color), [color]);

  useFrame(() => {
    if (!meshRef.current) return;
    const count = Math.min(trail.length, maxTrailPoints);

    for (let i = 0; i < maxTrailPoints; i++) {
      if (i < count) {
        const key = trail[trail.length - 1 - i]; // most recent first
        const [r, c] = key.split(',').map(Number);
        const fade = 1 - i / count; // 1.0 at newest, 0.0 at oldest
        const scale = 0.06 + fade * 0.06;
        dummy.position.set(c + 0.5, 0.06, r + 0.5);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(
          i,
          trailColor.clone().multiplyScalar(0.3 + fade * 0.7)
        );
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
    invalidate();
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxTrailPoints]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

// ---- Vacuum Robot (ENH: LED eyes + victory spin) ----

function VacuumRobot({
  pos,
  dir,
  running,
  isVictory,
}: {
  pos: [number, number];
  dir: number;
  running: boolean;
  isVictory: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  const leftEyeRef = useRef<Mesh>(null);
  const rightEyeRef = useRef<Mesh>(null);
  const victorySpinRef = useRef(0);

  // Direction to rotation (0=right, 1=down, 2=left, 3=up)
  const rotations = [0, -Math.PI / 2, Math.PI, Math.PI / 2];

  // ENH: LED eye color based on state
  const eyeColor = useMemo(() => {
    if (isVictory) return '#FFD700'; // gold during victory
    if (running) return '#10B981'; // green = moving
    return '#3B82F6'; // blue = idle
  }, [running, isVictory]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Smooth position lerp
    const tx = pos[1] + 0.5;
    const tz = pos[0] + 0.5;
    groupRef.current.position.x = MathUtils.lerp(
      groupRef.current.position.x, tx, 0.15
    );
    groupRef.current.position.z = MathUtils.lerp(
      groupRef.current.position.z, tz, 0.15
    );

    // ENH: Victory spin — rapid rotation when all dust cleaned
    if (isVictory) {
      victorySpinRef.current += delta * 12; // fast spin
      groupRef.current.rotation.y = victorySpinRef.current;
      // Small hop during victory
      groupRef.current.position.y = 0.1 + Math.abs(Math.sin(victorySpinRef.current * 2)) * 0.15;
    } else {
      victorySpinRef.current = 0;
      groupRef.current.position.y = 0.1;
      // Smooth rotation to direction
      groupRef.current.rotation.y = MathUtils.lerp(
        groupRef.current.rotation.y, rotations[dir], 0.15
      );
    }

    // Glow pulse when running
    if (glowRef.current) {
      const mat = glowRef.current.material as MeshBasicMaterial;
      mat.opacity = running
        ? 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.15
        : 0.1;
    }

    // ENH: Pulse LED eyes
    const eyeIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
    if (leftEyeRef.current) {
      const mat = leftEyeRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = eyeIntensity;
    }
    if (rightEyeRef.current) {
      const mat = rightEyeRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = eyeIntensity;
    }

    invalidate();
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
      {/* ENH: Left LED eye */}
      <mesh ref={leftEyeRef} position={[0.18, 0.09, 0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* ENH: Right LED eye */}
      <mesh ref={rightEyeRef} position={[0.18, 0.09, -0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.36, 0.45, 24]} />
        <meshBasicMaterial
          color="#10B981"
          transparent
          opacity={0.1}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---- Charger Marker ----

function ChargerMarker({ pos }: { pos: [number, number] }) {
  const ref = useRef<Mesh>(null);

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

// ---- Main Export ----

export default function RobotVacuum3D({
  room,
  vacPos,
  vacDir,
  cleaned,
  trail,
  gridSize,
  running,
}: RobotVacuum3DProps) {
  // ENH: Dust cloud particles when vacuum moves over dirty cell
  const [dustParticles, setDustParticles] = useState<Particle[]>([]);
  const prevPosRef = useRef<string>(`${vacPos[0]},${vacPos[1]}`);

  // ENH: Victory confetti particles
  const [victoryParticles, setVictoryParticles] = useState<Particle[]>([]);
  const [isVictory, setIsVictory] = useState(false);
  const prevCleanedSizeRef = useRef(cleaned.size);

  // Detect when vacuum moves over a dirty cell -> dust cloud burst
  useEffect(() => {
    const currentKey = `${vacPos[0]},${vacPos[1]}`;
    if (currentKey !== prevPosRef.current) {
      // Check if this cell was dirty (just got cleaned)
      const wasDirty = room.dirt.some(
        ([r, c]) => r === vacPos[0] && c === vacPos[1]
      );
      if (wasDirty && cleaned.has(currentKey)) {
        const origin = new Vector3(vacPos[1] + 0.5, 0.15, vacPos[0] + 0.5);
        setDustParticles(prev => [
          ...prev,
          ...spawnParticles('dustCloud', origin, {
            count: 15,
            direction: new Vector3(0, 1, 0),
            spread: 0.8,
          }),
        ]);
      }
    }
    prevPosRef.current = currentKey;
  }, [vacPos, cleaned, room.dirt]);

  // ENH: Detect victory — all dirt cleaned
  useEffect(() => {
    if (
      room.dirt.length > 0 &&
      cleaned.size === room.dirt.length &&
      prevCleanedSizeRef.current < room.dirt.length
    ) {
      setIsVictory(true);
      const origin = new Vector3(vacPos[1] + 0.5, 0.5, vacPos[0] + 0.5);
      setVictoryParticles(
        spawnParticles('victoryFireworks', origin, {
          colors: ['#FFD700', '#10B981', '#00BBFF', '#FF66AA', '#FFFFFF'],
        })
      );
      // End victory spin after 2 seconds
      const timer = setTimeout(() => setIsVictory(false), 2000);
      return () => clearTimeout(timer);
    }
    prevCleanedSizeRef.current = cleaned.size;
  }, [cleaned.size, room.dirt.length, vacPos]);

  // Update dust cloud particles each frame
  useFrame((_, delta) => {
    if (dustParticles.length > 0) {
      updateParticles(dustParticles, delta, PARTICLE_PRESETS.dustCloud);
      const alive = dustParticles.filter((p) => p.life > 0);
      if (alive.length !== dustParticles.length) {
        setDustParticles(alive);
      }
    }
    if (victoryParticles.length > 0) {
      updateParticles(victoryParticles, delta, PARTICLE_PRESETS.victoryFireworks);
      const alive = victoryParticles.filter((p) => p.life > 0);
      if (alive.length !== victoryParticles.length) {
        setVictoryParticles(alive);
      }
    }
  });

  return (
    <group>
      {/* FL-Lite Environment — wired S7-WARN-002 */}
      <RobotVacuumEnvironment isRunning={running} cleanProgress={room.dirt.length > 0 ? cleaned.size / room.dirt.length : 0} />

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

      {/* ENH: Glowing trail (replaces static line) */}
      <GlowingTrail trail={trail} color="#10B981" />

      {/* Vacuum (ENH: LED eyes + victory spin) */}
      <VacuumRobot pos={vacPos} dir={vacDir} running={running} isVictory={isVictory} />

      {/* ENH: Dust cloud burst particles */}
      <DustCloudParticles particles={dustParticles} />

      {/* ENH: Victory confetti particles */}
      <VictoryParticles particles={victoryParticles} />
    </group>
  );
}
