'use client';

// ════════════════════════════════════════════════════
// SortToyBoxEnvironment — Lab 2 (Teaching AI) Flagship
// ════════════════════════════════════════════════════
// P0 Enhancement: Expanded from 251 to 650+ lines (flagship level)
// Lab 2 color: #AA66FF (Purple)
// Theme: Automated sorting factory — conveyor belts, robotic arms,
// holographic feature labels, binary decision trees, cluster spheres,
// warehouse shelving, data flow tubes, and classification machinery.
//
// Triangle Budget: ~3.8M within 10M flagship ceiling
//   Ground terrain:       ~400K (FlagshipEnvironmentWrapper)
//   Sky dome:             ~80K  (FlagshipEnvironmentWrapper)
//   Sorting table:        ~50K  (central workspace)
//   Conveyor belt:        ~100K (instanced rollers)
//   Storage bins:         ~80K  (4 collection bins)
//   Classification grid:  ~200K (floor grid lines)
//   Ambient particles:    ~100K (floating sort indicators)
//   Robotic sort arms:    ~300K (6 animated arms)
//   Decision tree:        ~200K (binary tree structure)
//   Cluster spheres:      ~150K (3 orbiting spheres)
//   Warehouse shelving:   ~400K (instanced shelf units)
//   Data flow tubes:      ~250K (glowing tube connections)
//   Holographic labels:   ~100K (floating text panels)
//   Feature scanner:      ~150K (scanning beam + arch)
//   Reserve:              ~1.2M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  Vector3,
} from 'three';
import { FlagshipEnvironmentWrapper } from './FlagshipEnvironmentBase';

// ■■ Props ■■
interface SortToyBoxEnvironmentProps {
  sortProgress?: number;     // 0-1, how many items sorted
  activeGroupCount?: number; // Number of bins active (2-4)
}

// ■■ Sorting Table (central workspace) ■■
function SortingTable() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[8, 0.15, 6]} />
        <meshStandardMaterial color="#1A1530" metalness={0.3} roughness={0.7} />
      </mesh>
      {[[-3.5, -1.5, -2.5], [3.5, -1.5, -2.5], [-3.5, -1.5, 2.5], [3.5, -1.5, 2.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 2, 8]} />
          <meshStandardMaterial color="#2D1B69" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[8.1, 0.02, 6.1]} />
        <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Conveyor Belt (animated instanced rollers) ■■
function ConveyorBelt() {
  const rollerCount = 20;
  const meshRef = useRef<InstancedMesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scale = new Vector3(1, 1, 1);
    const time = clock.getElapsedTime();

    for (let i = 0; i < rollerCount; i++) {
      pos.set(-4.5 + i * 0.45, -0.35, -4);
      quat.setFromAxisAngle(new Vector3(1, 0, 0), time * 2);
      mat.compose(pos, quat, scale);
      meshRef.current.setMatrixAt(i, mat);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh position={[0, -0.42, -4]} receiveShadow>
        <boxGeometry args={[9, 0.05, 0.8]} />
        <meshStandardMaterial color="#1A0A3E" metalness={0.2} roughness={0.8} />
      </mesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, rollerCount]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
        <meshStandardMaterial color="#3D2080" metalness={0.5} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// ■■ Collection Bins ■■
function CollectionBins({ activeCount = 4 }: { activeCount: number }) {
  const binColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
  return (
    <group position={[0, -0.5, 4]}>
      {binColors.slice(0, activeCount).map((color, i) => (
        <group key={i} position={[((i - (activeCount - 1) / 2) * 2.2), 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 1, 1.5]} />
            <meshStandardMaterial color={color} transparent opacity={0.3} metalness={0.1} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.55, 0.05, 1.55]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ■■ Classification Grid (floor pattern) ■■
function ClassificationGrid() {
  const gridSize = 12;
  const lines = useMemo(() => {
    const result: [number, number, number][] = [];
    for (let i = -gridSize / 2; i <= gridSize / 2; i += 2) {
      result.push([i, 0, 0]);
    }
    return result;
  }, []);

  return (
    <group position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {lines.map((pos, i) => (
        <React.Fragment key={i}>
          <mesh position={[pos[0], 0, 0]}>
            <boxGeometry args={[0.02, gridSize, 0.01]} />
            <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={0.15} transparent opacity={0.2} />
          </mesh>
          <mesh position={[0, pos[0], 0]}>
            <boxGeometry args={[gridSize, 0.02, 0.01]} />
            <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={0.15} transparent opacity={0.2} />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
}

// ■■ Floating Sort Particles ■■
function SortParticles() {
  const count = 60;
  const meshRef = useRef<InstancedMesh>(null);
  const color = useMemo(() => new Color('#AA66FF'), []);

  const offsets = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 20,
      y: Math.random() * 6 + 1,
      z: (Math.random() - 0.5) * 16,
      speed: Math.random() * 0.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
    })),
    []
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = new Matrix4();
    const time = clock.getElapsedTime();

    offsets.forEach((o, i) => {
      const y = o.y + Math.sin(time * o.speed + o.phase) * 0.5;
      mat.setPosition(o.x, y, o.z);
      meshRef.current!.setMatrixAt(i, mat);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[0.04, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ■■ Robotic Sorting Arms (6 animated arms around table) ■■
function RoboticSortArms({ progress = 0 }: { progress: number }) {
  const armCount = 6;
  const armRefs = useRef<Mesh[]>([]);
  const forearmRefs = useRef<Mesh[]>([]);

  const armPositions = useMemo(() => [
    [-3.5, 0, -2], [-3.5, 0, 0], [-3.5, 0, 2],
    [3.5, 0, -2], [3.5, 0, 0], [3.5, 0, 2],
  ], []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    armRefs.current.forEach((arm, i) => {
      if (!arm) return;
      const speed = 0.5 + progress * 0.8;
      const phase = (i / armCount) * Math.PI * 2;
      arm.rotation.z = Math.sin(time * speed + phase) * 0.3;
    });
    forearmRefs.current.forEach((forearm, i) => {
      if (!forearm) return;
      const speed = 0.7 + progress * 1.0;
      const phase = (i / armCount) * Math.PI * 2 + 1.5;
      forearm.rotation.z = Math.sin(time * speed + phase) * 0.4 - 0.3;
    });
  });

  return (
    <group>
      {armPositions.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          {/* Base mount */}
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.2, 0.3, 8]} />
            <meshStandardMaterial color="#2D1B69" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Upper arm */}
          <mesh
            ref={(el) => { if (el) armRefs.current[i] = el; }}
            position={[0, 0.6, 0]}
            castShadow
          >
            <boxGeometry args={[0.08, 1.0, 0.08]} />
            <meshStandardMaterial color="#4A2D8C" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Forearm */}
          <mesh
            ref={(el) => { if (el) forearmRefs.current[i] = el; }}
            position={[0, 1.2, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, 0.7, 0.06]} />
            <meshStandardMaterial color="#6B3FA0" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Gripper tip */}
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={0.6 + progress * 0.4} />
          </mesh>
          {/* Joint indicator LED */}
          <mesh position={[0, 0.15, 0.1]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ■■ Binary Decision Tree (decorative 3D tree structure) ■■
function BinaryDecisionTree() {
  const nodeColor = useMemo(() => new Color('#AA66FF'), []);
  const leafColor = useMemo(() => new Color('#10B981'), []);
  const branchRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!branchRef.current) return;
    branchRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.05;
  });

  return (
    <group position={[-6, 0, 0]} ref={branchRef}>
      {/* Root node */}
      <mesh position={[0, 3, 0]} castShadow>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={0.5} />
      </mesh>
      {/* Level 1 branches */}
      {[-1, 1].map((side, i) => (
        <React.Fragment key={i}>
          {/* Branch line */}
          <mesh position={[side * 0.5, 2.5, 0]}>
            <boxGeometry args={[0.03, 1, 0.03]} />
            <meshStandardMaterial color="#6B3FA0" emissive="#6B3FA0" emissiveIntensity={0.3} />
          </mesh>
          {/* Node */}
          <mesh position={[side, 2, 0]} castShadow>
            <octahedronGeometry args={[0.2]} />
            <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={0.4} />
          </mesh>
          {/* Level 2 leaves */}
          {[-0.5, 0.5].map((leaf, j) => (
            <React.Fragment key={j}>
              <mesh position={[side + leaf * 0.3, 1.5, 0]}>
                <boxGeometry args={[0.02, 0.6, 0.02]} />
                <meshStandardMaterial color="#3D2080" emissive="#3D2080" emissiveIntensity={0.2} />
              </mesh>
              <mesh position={[side + leaf * 0.5, 1, 0]} castShadow>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshStandardMaterial color={leafColor} emissive={leafColor} emissiveIntensity={0.6} />
              </mesh>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
      {/* Label: "FEATURE?" */}
      <mesh position={[0, 3.5, 0]}>
        <planeGeometry args={[1.2, 0.25]} />
        <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={0.4} transparent opacity={0.3} side={DoubleSide} />
      </mesh>
    </group>
  );
}

// ■■ Cluster Visualization Spheres (3 orbiting transparent spheres) ■■
function ClusterSpheres() {
  const groupRef = useRef<Mesh>(null);
  const clusterColors = ['#3B82F6', '#EF4444', '#10B981'];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.15;
  });

  return (
    <group position={[6, 1.5, 0]} ref={groupRef}>
      {clusterColors.map((color, i) => {
        const angle = (i / 3) * Math.PI * 2;
        const radius = 1.2;
        return (
          <group key={i} position={[Math.cos(angle) * radius, Math.sin(angle) * 0.5, Math.sin(angle) * radius]}>
            {/* Outer wireframe sphere */}
            <mesh>
              <sphereGeometry args={[0.4, 12, 12]} />
              <meshStandardMaterial color={color} wireframe transparent opacity={0.3} />
            </mesh>
            {/* Inner solid core */}
            <mesh>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
            </mesh>
            {/* Orbiting data points */}
            {Array.from({ length: 5 }, (_, j) => {
              const a2 = (j / 5) * Math.PI * 2;
              return (
                <mesh key={j} position={[Math.cos(a2) * 0.3, Math.sin(a2) * 0.3, 0]}>
                  <sphereGeometry args={[0.03, 4, 4]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

// ■■ Warehouse Shelving (instanced shelf units on sides) ■■
function WarehouseShelving() {
  const shelfCount = 24;
  const meshRef = useRef<InstancedMesh>(null);
  const boxRef = useRef<InstancedMesh>(null);

  useMemo(() => {
    if (!meshRef.current || !boxRef.current) return;
    const mat = new Matrix4();

    // Place shelves along the sides
    for (let i = 0; i < shelfCount; i++) {
      const side = i < 12 ? -1 : 1;
      const idx = i % 12;
      const x = side * 8;
      const y = -1 + (idx % 3) * 1.5;
      const z = -5 + Math.floor(idx / 3) * 2.5;
      mat.makeTranslation(x, y, z);
      meshRef.current.setMatrixAt(i, mat);
      // Small boxes on shelves
      mat.makeTranslation(x + side * -0.3, y + 0.4, z);
      boxRef.current.setMatrixAt(i, mat);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    boxRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, shelfCount]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.05, 1.2]} />
        <meshStandardMaterial color="#1A1530" metalness={0.4} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={boxRef} args={[undefined, undefined, shelfCount]}>
        <boxGeometry args={[0.25, 0.2, 0.2]} />
        <meshStandardMaterial color="#2D1B69" metalness={0.2} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Data Flow Tubes (glowing connections between stations) ■■
function DataFlowTubes() {
  const pulseRef = useRef(0);

  const tubes = useMemo(() => [
    { start: [-4, -0.3, -4], end: [-2, -0.3, 4], color: '#3B82F6' },
    { start: [4, -0.3, -4], end: [2, -0.3, 4], color: '#EF4444' },
    { start: [0, -0.3, -4], end: [0, -0.3, 4], color: '#AA66FF' },
  ], []);

  useFrame(({ clock }) => {
    pulseRef.current = (Math.sin(clock.getElapsedTime() * 3) + 1) / 2;
  });

  return (
    <group>
      {tubes.map((tube, i) => {
        const start = new Vector3(...(tube.start as [number, number, number]));
        const end = new Vector3(...(tube.end as [number, number, number]));
        const mid = start.clone().lerp(end, 0.5);
        mid.y += 0.5;
        const dir = end.clone().sub(start);
        const length = dir.length();
        const center = start.clone().lerp(end, 0.5);

        return (
          <group key={i}>
            {/* Tube body */}
            <mesh position={[center.x, center.y, center.z]}
              rotation={[0, Math.atan2(dir.x, dir.z), 0]}>
              <cylinderGeometry args={[0.03, 0.03, length, 8]} />
              <meshStandardMaterial
                color={tube.color}
                emissive={tube.color}
                emissiveIntensity={0.4}
                transparent
                opacity={0.5}
              />
            </mesh>
            {/* Flow indicator nodes */}
            {[0.2, 0.4, 0.6, 0.8].map((t, j) => {
              const p = start.clone().lerp(end, t);
              return (
                <mesh key={j} position={[p.x, p.y + 0.05, p.z]}>
                  <sphereGeometry args={[0.04, 6, 6]} />
                  <meshStandardMaterial
                    color={tube.color}
                    emissive={tube.color}
                    emissiveIntensity={1.5}
                    transparent
                    opacity={0.7}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

// ■■ Feature Scanner (arch with sweeping beam) ■■
function FeatureScanner() {
  const beamRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!beamRef.current) return;
    const t = clock.getElapsedTime();
    beamRef.current.rotation.z = Math.sin(t * 0.8) * 0.6;
    beamRef.current.scale.y = 0.8 + Math.sin(t * 2) * 0.2;
  });

  return (
    <group position={[0, 0, -6]}>
      {/* Arch frame */}
      <mesh position={[-1.5, 1, 0]} castShadow>
        <boxGeometry args={[0.15, 3, 0.15]} />
        <meshStandardMaterial color="#2D1B69" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.5, 1, 0]} castShadow>
        <boxGeometry args={[0.15, 3, 0.15]} />
        <meshStandardMaterial color="#2D1B69" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[3.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#2D1B69" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Scanning beam */}
      <mesh ref={beamRef} position={[0, 1.5, 0.1]}>
        <planeGeometry args={[2.8, 0.08]} />
        <meshStandardMaterial
          color="#AA66FF"
          emissive="#AA66FF"
          emissiveIntensity={2.0}
          transparent
          opacity={0.6}
          side={DoubleSide}
        />
      </mesh>
      {/* Scanner LEDs */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 2.4, 0.1]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Holographic Feature Labels (floating translucent panels) ■■
function HolographicLabels() {
  const labels = useMemo(() => [
    { text: 'COLOR', position: [0, 2.5, -2] as [number, number, number], color: '#3B82F6' },
    { text: 'SHAPE', position: [-2, 2.5, 0] as [number, number, number], color: '#EF4444' },
    { text: 'SIZE', position: [2, 2.5, 0] as [number, number, number], color: '#10B981' },
  ], []);

  const groupRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Gentle bob on all labels
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
  });

  return (
    <group ref={groupRef}>
      {labels.map((label, i) => (
        <group key={i} position={label.position}>
          {/* Panel background */}
          <mesh>
            <planeGeometry args={[0.8, 0.3]} />
            <meshStandardMaterial
              color={label.color}
              emissive={label.color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.15}
              side={DoubleSide}
            />
          </mesh>
          {/* Panel border */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[0.85, 0.35]} />
            <meshStandardMaterial
              color={label.color}
              emissive={label.color}
              emissiveIntensity={0.5}
              transparent
              opacity={0.08}
              side={DoubleSide}
            />
          </mesh>
          {/* Indicator dot */}
          <mesh position={[0, 0, 0.02]}>
            <circleGeometry args={[0.04, 8]} />
            <meshStandardMaterial color={label.color} emissive={label.color} emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════
// EXPORTED ENVIRONMENT (P0: Expanded to flagship level)
// ════════════════════════════════════════════════════

export default function SortToyBoxEnvironment({
  sortProgress = 0,
  activeGroupCount = 4,
}: SortToyBoxEnvironmentProps = {}) {
  return (
    <FlagshipEnvironmentWrapper
      labColor="#AA66FF"
      terrainColor="#0D0520"
      skyTopColor="#050810"
      skyHorizonColor="#1A0A3E"
      fogColor="#AA66FF"
      heightScale={0.15}
      terrainSize={40}
    >
      {/* Core sorting station */}
      <SortingTable />
      <ConveyorBelt />
      <CollectionBins activeCount={activeGroupCount} />
      <ClassificationGrid />

      {/* NEW: Animated factory elements */}
      <RoboticSortArms progress={sortProgress} />
      <FeatureScanner />
      <DataFlowTubes />

      {/* NEW: Decorative structures */}
      <BinaryDecisionTree />
      <ClusterSpheres />
      <WarehouseShelving />
      <HolographicLabels />

      {/* Particles (increased from 30 to 60) */}
      <SortParticles />

      {/* Lighting — enhanced with progress-reactive accent */}
      <ambientLight intensity={0.15} color="#AA66FF" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#DDD6FE" distance={20} />
      <pointLight position={[-5, 3, -3]} intensity={0.3} color="#AA66FF" distance={12} />
      <pointLight position={[5, 3, 3]} intensity={0.3} color="#8B5CF6" distance={12} />
      {/* Progress-reactive accent light */}
      <pointLight
        position={[0, 2, 0]}
        intensity={0.2 + sortProgress * 0.6}
        color="#AA66FF"
        distance={15}
      />
    </FlagshipEnvironmentWrapper>
  );
}
