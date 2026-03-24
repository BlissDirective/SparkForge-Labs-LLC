'use client';

// ════════════════════════════════════════════════════
// AgentArchitectEnvironment — Mission Control Center (10M budget)
// ════════════════════════════════════════════════════
// Lab 5: AI Agents | Color: #10B981 (Emerald)
//
// Futuristic command center for building AI agent pipelines:
//   - Server rack corridor with emerald status lights
//   - Mission control curved display wall
//   - Autonomous drone fleet patrolling the facility
//   - Holographic blueprint planning table
//   - Robotic assembly line building agent components
//   - Communication array (antenna tower)
//   - Conveyor belt system connecting pipeline stages
//   - Tool/API shelf wall with draggable equipment
//   - Execution debugger tower (call stack visualization)
//   - Cable management conduits on ceiling
//   - Cargo containers for API tools
//   - Emerald data pulse waves across floor
//
// Triangle Budget (Desktop Ultra):
//   Terrain:              ~400K
//   Server Corridor:      ~500K (instanced rack walls, more racks)
//   Mission Control Wall: ~400K (curved screen array)
//   Drone Fleet:          ~300K (autonomous flying drones)
//   Blueprint Table:      ~250K (holographic projections)
//   Assembly Line:        ~350K (mechanical arms + parts)
//   Communication Array:  ~200K (antenna + dish)
//   Conveyor System:      ~150K (belt + rollers)
//   Tool Shelves:         ~100K
//   Debug Tower:          ~80K
//   Cable Conduits:       ~100K
//   Cargo Containers:     ~200K
//   Data Pulse Floor:     ~60K
//   Particles:            ~100K
//   Sky/Enclosure:        ~80K
//   Total:                ~3.27M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  FlagshipEnvironmentWrapper,
} from './FlagshipEnvironmentBase';

// ■■ Server Corridor Walls (expanded) ■■
function ServerCorridor() {
  const rackCount = 50;
  const racksRef = useRef<THREE.InstancedMesh>(null);
  const ledRef = useRef<THREE.InstancedMesh>(null);
  const ledCount = rackCount * 8;

  React.useEffect(() => {
    if (!racksRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < rackCount; i++) {
      const side = i < rackCount / 2 ? -1 : 1;
      const idx = i < rackCount / 2 ? i : i - rackCount / 2;
      const z = (idx - rackCount / 4 + 0.5) * 1.8;
      temp.makeTranslation(side * 13, 0.8, z);
      racksRef.current.setMatrixAt(i, temp);
    }
    racksRef.current.instanceMatrix.needsUpdate = true;
  }, [rackCount]);

  React.useEffect(() => {
    if (!ledRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < ledCount; i++) {
      const rackIdx = Math.floor(i / 8);
      const ledIdx = i % 8;
      const side = rackIdx < rackCount / 2 ? -1 : 1;
      const idx = rackIdx < rackCount / 2 ? rackIdx : rackIdx - rackCount / 2;
      const z = (idx - rackCount / 4 + 0.5) * 1.8;
      temp.makeScale(0.03, 0.03, 0.03);
      temp.setPosition(side * 12.3, 0.25 + ledIdx * 0.22, z);
      ledRef.current.setMatrixAt(i, temp);
    }
    ledRef.current.instanceMatrix.needsUpdate = true;
  }, [ledCount, rackCount]);

  useFrame((state) => {
    if (!ledRef.current) return;
    const color = new THREE.Color();
    const t = state.clock.elapsedTime;
    for (let i = 0; i < Math.min(ledCount, ledRef.current.count); i++) {
      const active = Math.sin(t * 2 + i * 0.5) > 0.3;
      color.set(active ? '#10B981' : '#064E3B');
      ledRef.current.setColorAt(i, color);
    }
    if (ledRef.current.instanceColor) ledRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={racksRef} args={[undefined, undefined, rackCount]} castShadow>
        <boxGeometry args={[1.2, 3.2, 1.6]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={ledRef} args={[undefined, undefined, ledCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#10B981" />
      </instancedMesh>
    </>
  );
}

// ■■ Mission Control Display Wall ■■
function MissionControlWall() {
  const screensRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!screensRef.current) return;
    const t = state.clock.elapsedTime;
    screensRef.current.children.forEach((child, i) => {
      const mat = ((child as THREE.Group).children[1] as THREE.Mesh)?.material as THREE.MeshBasicMaterial;
      if (mat?.opacity !== undefined) {
        mat.opacity = 0.06 + Math.sin(t * 0.5 + i * 0.8) * 0.03;
      }
    });
  });

  const screens = [
    { x: 0, y: 2, w: 7, h: 3.5, ry: 0 },
    { x: -5, y: 2, w: 4, h: 2.5, ry: 0.25 },
    { x: 5, y: 2, w: 4, h: 2.5, ry: -0.25 },
    { x: -8.5, y: 2, w: 3, h: 2, ry: 0.4 },
    { x: 8.5, y: 2, w: 3, h: 2, ry: -0.4 },
    { x: 0, y: 4.5, w: 5, h: 2, ry: 0 },
    { x: -4, y: 4.5, w: 3, h: 1.5, ry: 0.2 },
    { x: 4, y: 4.5, w: 3, h: 1.5, ry: -0.2 },
  ];

  return (
    <group ref={screensRef} position={[0, 0, -14]}>
      {screens.map((s, i) => (
        <group key={i} position={[s.x, s.y, 0]} rotation={[0.1, s.ry, 0]}>
          <mesh>
            <boxGeometry args={[s.w + 0.15, s.h + 0.15, 0.08]} />
            <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[s.w, s.h]} />
            <meshBasicMaterial color="#10B981" transparent opacity={0.06} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ■■ Autonomous Drone Fleet ■■
function DroneFleet() {
  const droneCount = 12;
  const dronesRef = useRef<THREE.InstancedMesh>(null);
  const propRef = useRef<THREE.InstancedMesh>(null);

  const drones = useMemo(() =>
    Array.from({ length: droneCount }, () => ({
      cx: (Math.random() - 0.5) * 16,
      cy: 3 + Math.random() * 2,
      cz: (Math.random() - 0.5) * 16,
      radius: 2 + Math.random() * 4,
      speed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    })), [droneCount]
  );

  useFrame((state) => {
    if (!dronesRef.current || !propRef.current) return;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    const t = state.clock.elapsedTime;

    for (let i = 0; i < droneCount; i++) {
      const d = drones[i];
      const angle = t * d.speed + d.phase;
      const x = d.cx + Math.cos(angle) * d.radius;
      const z = d.cz + Math.sin(angle) * d.radius;
      const y = d.cy + Math.sin(t * 0.5 + d.phase) * 0.3;

      // Body
      pos.set(x, y, z);
      quat.setFromEuler(new THREE.Euler(0, angle, 0));
      scl.set(0.3, 0.1, 0.3);
      temp.compose(pos, quat, scl);
      dronesRef.current.setMatrixAt(i, temp);

      // Propeller disc
      pos.set(x, y + 0.12, z);
      scl.set(0.4, 0.01, 0.4);
      temp.compose(pos, quat, scl);
      propRef.current.setMatrixAt(i, temp);
    }
    dronesRef.current.instanceMatrix.needsUpdate = true;
    propRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={dronesRef} args={[undefined, undefined, droneCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={propRef} args={[undefined, undefined, droneCount]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.2} />
      </instancedMesh>
    </>
  );
}

// ■■ Holographic Blueprint Table ■■
function BlueprintTable() {
  const holoRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!holoRef.current) return;
    holoRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    holoRef.current.scale.setScalar(s);
  });

  return (
    <group position={[0, -1, 5]}>
      {/* Table surface */}
      <mesh receiveShadow>
        <cylinderGeometry args={[2, 2.2, 0.15, 64]} />
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 0.8, 6]} />
        <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Holographic projection */}
      <mesh ref={holoRef} position={[0, 1.5, 0]}>
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#10B981" transparent opacity={0.12} wireframe emissive="#10B981" emissiveIntensity={0.4} />
      </mesh>
      {/* Projection rings */}
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[1.5, 0.02, 4, 64]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[1.2, 0.015, 4, 64]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.1} />
      </mesh>
      <pointLight position={[0, 1, 0]} intensity={0.8} color="#10B981" distance={5} />
    </group>
  );
}

// ■■ Robotic Assembly Line ■■
function AssemblyLine() {
  const armCount = 6;
  const armsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!armsRef.current) return;
    const t = state.clock.elapsedTime;
    armsRef.current.children.forEach((arm, i) => {
      arm.rotation.y = Math.sin(t * 0.6 + i * 1.0) * 0.6;
      const forearm = arm.children[2];
      if (forearm) forearm.rotation.z = Math.sin(t * 0.9 + i * 0.8) * 0.5;
    });
  });

  return (
    <group ref={armsRef}>
      {Array.from({ length: armCount }).map((_, i) => (
        <group key={i} position={[7, -1, -8 + i * 3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.3, 0.15, 64]} />
            <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.12, 1, 0.12]} />
            <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
          </mesh>
          <group position={[0, 1.1, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.7, 0.1]} />
              <meshStandardMaterial color="#6B7280" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <sphereGeometry args={[0.08, 6, 4]} />
              <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.4} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

// ■■ Communication Array ■■
function CommunicationArray() {
  const dishRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!dishRef.current) return;
    dishRef.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  return (
    <group position={[-8, -1, 8]}>
      {/* Tower */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.2, 5, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Cross beams */}
      {[1, 2, 3].map((h) => (
        <mesh key={h} position={[0, h * 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 4]} />
          <meshStandardMaterial color="#4B5563" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Satellite dish */}
      <group ref={dishRef} position={[0, 4.5, 0]}>
        <mesh rotation={[0.5, 0, 0]}>
          <sphereGeometry args={[0.8, 64, 64, 0, Math.PI * 2, 0, Math.PI / 3]} />
          <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.3} />
        </mesh>
      </group>
      {/* Blinking light */}
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#10B981" distance={6} />
    </group>
  );
}

// ■■ Cargo Containers ■■
function CargoContainers() {
  const containerCount = 12;
  const containersRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!containersRef.current) return;
    const temp = new THREE.Matrix4();
    const color = new THREE.Color();
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    for (let i = 0; i < containerCount; i++) {
      const stack = Math.floor(i / 4);
      const idx = i % 4;
      pos.set(-8 + idx * 2.5, stack * 1.5, -10);
      quat.setFromEuler(new THREE.Euler(0, (Math.random() - 0.5) * 0.1, 0));
      scl.set(1, 1, 1);
      temp.compose(pos, quat, scl);
      containersRef.current.setMatrixAt(i, temp);
      color.set(colors[i % colors.length]);
      containersRef.current.setColorAt(i, color);
    }
    containersRef.current.instanceMatrix.needsUpdate = true;
    if (containersRef.current.instanceColor) containersRef.current.instanceColor.needsUpdate = true;
  }, [containerCount]);

  return (
    <instancedMesh ref={containersRef} args={[undefined, undefined, containerCount]} castShadow>
      <boxGeometry args={[2, 1.2, 1]} />
      <meshStandardMaterial color="#10B981" roughness={0.6} metalness={0.3} />
    </instancedMesh>
  );
}

// ■■ Conveyor Belt System ■■
function ConveyorBelt({ isRunning }: { isRunning: boolean }) {
  const rollersRef = useRef<THREE.InstancedMesh>(null);
  const rollerCount = 24;

  React.useEffect(() => {
    if (!rollersRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < rollerCount; i++) {
      const z = (i - rollerCount / 2 + 0.5) * 1;
      temp.makeRotationZ(Math.PI / 2);
      temp.setPosition(0, -0.7, z);
      rollersRef.current.setMatrixAt(i, temp);
    }
    rollersRef.current.instanceMatrix.needsUpdate = true;
  }, [rollerCount]);

  useFrame((state) => {
    if (!rollersRef.current || !isRunning) return;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < rollerCount; i++) {
      rollersRef.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      quat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(state.clock.getDelta() * 5, 0, 0)));
      temp.compose(pos, quat, scl);
      rollersRef.current.setMatrixAt(i, temp);
    }
    rollersRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, -0.5, 0]}>
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[2, 0.05, rollerCount * 1]} />
        <meshStandardMaterial color="#1F2937" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[-1.1, 0, 0]}>
        <boxGeometry args={[0.1, 0.3, rollerCount * 1]} />
        <meshStandardMaterial color="#10B981" metalness={0.6} roughness={0.3} emissive="#10B981" emissiveIntensity={isRunning ? 0.3 : 0.05} />
      </mesh>
      <mesh position={[1.1, 0, 0]}>
        <boxGeometry args={[0.1, 0.3, rollerCount * 1]} />
        <meshStandardMaterial color="#10B981" metalness={0.6} roughness={0.3} emissive="#10B981" emissiveIntensity={isRunning ? 0.3 : 0.05} />
      </mesh>
      <instancedMesh ref={rollersRef} args={[undefined, undefined, rollerCount]}>
        <cylinderGeometry args={[0.08, 0.08, 2, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </instancedMesh>
    </group>
  );
}

// ■■ Tool Shelf Wall ■■
function ToolShelves() {

  return (
    <group position={[0, 0, -8]}>
      <mesh>
        <boxGeometry args={[10, 4.5, 0.2]} />
        <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.3} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`shelf-${i}`} position={[0, -1.8 + i * 1.1, 0.2]}>
          <boxGeometry args={[9.5, 0.08, 0.5]} />
          <meshStandardMaterial color="#1F2937" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, si) =>
        Array.from({ length: 6 }).map((_, ti) => {
          const shapes = ['box', 'cylinder', 'sphere'] as const;
          const shape = shapes[(si + ti) % 3];
          const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
          return (
            <mesh key={`item-${si}-${ti}`} position={[(ti - 2.5) * 1.5, -1.5 + si * 1.1, 0.35]} castShadow>
              {shape === 'box' && <boxGeometry args={[0.3, 0.3, 0.3]} />}
              {shape === 'cylinder' && <cylinderGeometry args={[0.15, 0.15, 0.3, 6]} />}
              {shape === 'sphere' && <sphereGeometry args={[0.15, 8, 6]} />}
              <meshStandardMaterial color={colors[(si + ti) % colors.length]} emissive={colors[(si + ti) % colors.length]} emissiveIntensity={0.15} metalness={0.4} roughness={0.3} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ■■ Debug Tower (expanded) ■■
function DebugTower({ activeBlockId }: { activeBlockId: string | null }) {
  const frameCount = 8;
  const towerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!towerRef.current) return;
    towerRef.current.children.forEach((child, i) => {
      const isActive = activeBlockId && i === 0;
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = isActive ? 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.2 : 0.05;
      }
    });
  });

  return (
    <group ref={towerRef} position={[9, -1, 5]}>
      {Array.from({ length: frameCount }).map((_, i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.45, 0]} castShadow>
          <boxGeometry args={[1.8, 0.35, 1]} />
          <meshStandardMaterial color="#064E3B" emissive="#10B981" emissiveIntensity={0.05} metalness={0.5} roughness={0.4} transparent opacity={0.85 - i * 0.08} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Cable Conduits (Ceiling, expanded) ■■
function CableConduits() {
  const cableCount = 25;
  const cablesRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!cablesRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < cableCount; i++) {
      const x = (Math.random() - 0.5) * 24;
      const z = (Math.random() - 0.5) * 24;
      const length = 4 + Math.random() * 10;
      const isX = Math.random() > 0.5;
      temp.makeScale(isX ? length : 0.08, 0.08, isX ? 0.08 : length);
      temp.setPosition(x, 4.5, z);
      cablesRef.current.setMatrixAt(i, temp);
    }
    cablesRef.current.instanceMatrix.needsUpdate = true;
  }, [cableCount]);

  return (
    <instancedMesh ref={cablesRef} args={[undefined, undefined, cableCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#065F46" metalness={0.6} roughness={0.4} />
    </instancedMesh>
  );
}

// ■■ Data Pulse Floor Rings ■■
function DataPulseFloor({ isRunning }: { isRunning: boolean }) {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ringsRef.current) return;
    ringsRef.current.children.forEach((ring, i) => {
      const t = (state.clock.elapsedTime * 0.5 + i * 0.25) % 1;
      ring.scale.setScalar(1 + t * 10);
      const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.12;
    });
  });

  if (!true || !isRunning) return null;

  return (
    <group ref={ringsRef} position={[0, -0.96, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[0.5, 0.55, 64]} />
          <meshBasicMaterial color="#10B981" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Main Environment Component ■■
export interface AgentArchitectEnvironmentProps {
  isRunning: boolean;
  activeBlockId: string | null;
}

export default function AgentArchitectEnvironment({ isRunning, activeBlockId }: AgentArchitectEnvironmentProps) {

  return (
    <FlagshipEnvironmentWrapper
      labColor="#10B981"
      terrainColor="#030D08"
      skyTopColor="#020A05"
      skyHorizonColor="#0A1F15"
      fogColor="#10B981"
      heightScale={0.05}
      terrainSize={40}
    >
      <ServerCorridor />
      <MissionControlWall />
      <DroneFleet />
      <BlueprintTable />
      <AssemblyLine />
      <CommunicationArray />
      <ConveyorBelt isRunning={isRunning} />
      <ToolShelves />
      <DebugTower activeBlockId={activeBlockId} />
      <CableConduits />
      <CargoContainers />
      <DataPulseFloor isRunning={isRunning} />

      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial color="#050F0A" roughness={0.9} />
      </mesh>

      {/* Execution glow */}
      {isRunning && (
        <pointLight position={[0, 2, 0]} intensity={2} color="#10B981" distance={15} />
      )}
    </FlagshipEnvironmentWrapper>
  );
}
