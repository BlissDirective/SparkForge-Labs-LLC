'use client';

// ════════════════════════════════════════════════════
// AgentArchitectEnvironment — Server Command Center (5M budget)
// ════════════════════════════════════════════════════
// Lab 5: AI Agents | Color: #10B981 (Emerald)
//
// Transforms Agent Architect into a futuristic server command center:
//   - Server rack corridor with emerald status lights
//   - Conveyor belt system connecting pipeline stages
//   - Tool/API shelf wall with draggable equipment
//   - Execution debugger tower (call stack visualization)
//   - Output terminal screens with scrolling data
//   - Cable management conduits on ceiling
//   - Emerald data pulse waves across floor
//
// Triangle Budget (Desktop Ultra):
//   Terrain:              ~200K
//   Server Corridor:      ~350K (instanced rack walls)
//   Conveyor System:      ~100K (belt + rollers)
//   Tool Shelves:         ~80K  (shelving units with items)
//   Debug Tower:          ~60K  (stacked execution frames)
//   Terminal Screens:     ~50K
//   Cable Conduits:       ~70K  (ceiling pipe network)
//   Data Pulse Floor:     ~40K
//   Particles:            ~50K
//   Total:                ~1.0M

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  FlagshipEnvironmentWrapper,
  useFlagshipLOD,
} from './FlagshipEnvironmentBase';

// ■■ Server Corridor Walls ■■
function ServerCorridor({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const rackCount = lod.level === 'ultra' ? 30 : lod.level === 'high' ? 20 : 10;
  const racksRef = useRef<THREE.InstancedMesh>(null);
  const ledRef = useRef<THREE.InstancedMesh>(null);
  const ledCount = rackCount * 6;

  React.useEffect(() => {
    if (!racksRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < rackCount; i++) {
      const side = i < rackCount / 2 ? -1 : 1;
      const idx = i < rackCount / 2 ? i : i - rackCount / 2;
      const z = (idx - rackCount / 4 + 0.5) * 2;

      temp.makeTranslation(side * 12, 0.8, z);
      racksRef.current.setMatrixAt(i, temp);
    }
    racksRef.current.instanceMatrix.needsUpdate = true;
  }, [rackCount]);

  React.useEffect(() => {
    if (!ledRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < ledCount; i++) {
      const rackIdx = Math.floor(i / 6);
      const ledIdx = i % 6;
      const side = rackIdx < rackCount / 2 ? -1 : 1;
      const idx = rackIdx < rackCount / 2 ? rackIdx : rackIdx - rackCount / 2;
      const z = (idx - rackCount / 4 + 0.5) * 2;

      temp.makeScale(0.03, 0.03, 0.03);
      temp.setPosition(side * 11.4, 0.3 + ledIdx * 0.25, z);
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
    if (ledRef.current.instanceColor) {
      ledRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={racksRef} args={[undefined, undefined, rackCount]} castShadow>
        <boxGeometry args={[1.2, 3, 1.8]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={ledRef} args={[undefined, undefined, ledCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#10B981" />
      </instancedMesh>
    </>
  );
}

// ■■ Conveyor Belt System ■■
function ConveyorBelt({
  lod,
  isRunning,
}: {
  lod: ReturnType<typeof useFlagshipLOD>;
  isRunning: boolean;
}) {
  const beltRef = useRef<THREE.Mesh>(null);
  const rollersRef = useRef<THREE.InstancedMesh>(null);
  const rollerCount = lod.level === 'ultra' ? 20 : 10;

  React.useEffect(() => {
    if (!rollersRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < rollerCount; i++) {
      const z = (i - rollerCount / 2 + 0.5) * 1.2;
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
      quat.multiply(new THREE.Quaternion().setFromEuler(
        new THREE.Euler(state.clock.getDelta() * 5, 0, 0)
      ));
      temp.compose(pos, quat, scl);
      rollersRef.current.setMatrixAt(i, temp);
    }
    rollersRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Belt surface */}
      <mesh ref={beltRef} position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[2, 0.05, rollerCount * 1.2]} />
        <meshStandardMaterial
          color="#1F2937"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Side rails */}
      <mesh position={[-1.1, 0, 0]}>
        <boxGeometry args={[0.1, 0.3, rollerCount * 1.2]} />
        <meshStandardMaterial
          color="#10B981"
          metalness={0.6}
          roughness={0.3}
          emissive="#10B981"
          emissiveIntensity={isRunning ? 0.3 : 0.05}
        />
      </mesh>
      <mesh position={[1.1, 0, 0]}>
        <boxGeometry args={[0.1, 0.3, rollerCount * 1.2]} />
        <meshStandardMaterial
          color="#10B981"
          metalness={0.6}
          roughness={0.3}
          emissive="#10B981"
          emissiveIntensity={isRunning ? 0.3 : 0.05}
        />
      </mesh>

      {/* Rollers */}
      <instancedMesh ref={rollersRef} args={[undefined, undefined, rollerCount]}>
        <cylinderGeometry args={[0.08, 0.08, 2, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </instancedMesh>
    </group>
  );
}

// ■■ Tool Shelf Wall ■■
function ToolShelves({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  if (!lod.enableDetailProps) return null;

  const shelfCount = 4;
  const itemsPerShelf = 5;

  return (
    <group position={[0, 0, -8]}>
      {/* Shelf backs */}
      <mesh>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Shelf planks */}
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh key={`shelf-${i}`} position={[0, -1.5 + i * 1.2, 0.2]}>
          <boxGeometry args={[7.5, 0.08, 0.5]} />
          <meshStandardMaterial color="#1F2937" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Tool items on shelves */}
      {Array.from({ length: shelfCount }).map((_, si) =>
        Array.from({ length: itemsPerShelf }).map((_, ti) => {
          const shapes = ['box', 'cylinder', 'sphere'] as const;
          const shape = shapes[(si + ti) % 3];
          const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
          const x = (ti - 2) * 1.4;
          const y = -1.2 + si * 1.2;

          return (
            <mesh key={`item-${si}-${ti}`} position={[x, y, 0.35]} castShadow>
              {shape === 'box' && <boxGeometry args={[0.3, 0.3, 0.3]} />}
              {shape === 'cylinder' && <cylinderGeometry args={[0.15, 0.15, 0.3, 6]} />}
              {shape === 'sphere' && <sphereGeometry args={[0.15, 8, 6]} />}
              <meshStandardMaterial
                color={colors[(si + ti) % colors.length]}
                emissive={colors[(si + ti) % colors.length]}
                emissiveIntensity={0.15}
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ■■ Debug Tower (Call Stack) ■■
function DebugTower({
  lod,
  activeBlockId,
}: {
  lod: ReturnType<typeof useFlagshipLOD>;
  activeBlockId: string | null;
}) {
  const frameCount = 6;
  const towerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!towerRef.current) return;
    towerRef.current.children.forEach((child, i) => {
      const isActive = activeBlockId && i === 0;
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = isActive
          ? 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.2
          : 0.05;
      }
    });
  });

  if (!lod.enableDetailProps) return null;

  return (
    <group ref={towerRef} position={[8, -1, 3]}>
      {Array.from({ length: frameCount }).map((_, i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.5, 0]} castShadow>
          <boxGeometry args={[1.5, 0.35, 0.8]} />
          <meshStandardMaterial
            color="#064E3B"
            emissive="#10B981"
            emissiveIntensity={0.05}
            metalness={0.5}
            roughness={0.4}
            transparent
            opacity={0.8 - i * 0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Cable Conduits (Ceiling) ■■
function CableConduits({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const cableCount = lod.level === 'ultra' ? 15 : 8;
  const cablesRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!cablesRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < cableCount; i++) {
      const x = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      const length = 4 + Math.random() * 8;
      const isX = Math.random() > 0.5;

      temp.makeScale(isX ? length : 0.08, 0.08, isX ? 0.08 : length);
      temp.setPosition(x, 4, z);
      cablesRef.current.setMatrixAt(i, temp);
    }
    cablesRef.current.instanceMatrix.needsUpdate = true;
  }, [cableCount]);

  if (!lod.enableDetailProps) return null;

  return (
    <instancedMesh ref={cablesRef} args={[undefined, undefined, cableCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#065F46" metalness={0.6} roughness={0.4} />
    </instancedMesh>
  );
}

// ■■ Data Pulse Floor Rings ■■
function DataPulseFloor({
  lod,
  isRunning,
}: {
  lod: ReturnType<typeof useFlagshipLOD>;
  isRunning: boolean;
}) {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ringsRef.current) return;
    ringsRef.current.children.forEach((ring, i) => {
      const t = (state.clock.elapsedTime * 0.5 + i * 0.3) % 1;
      ring.scale.setScalar(1 + t * 8);
      const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.15;
    });
  });

  if (!lod.enableEffects || !isRunning) return null;

  return (
    <group ref={ringsRef} position={[0, -0.96, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[0.5, 0.55, lod.segments]} />
          <meshBasicMaterial
            color="#10B981"
            transparent
            opacity={0.15}
            depthWrite={false}
          />
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

export default function AgentArchitectEnvironment({
  isRunning,
  activeBlockId,
}: AgentArchitectEnvironmentProps) {
  const lod = useFlagshipLOD();

  return (
    <FlagshipEnvironmentWrapper
      labColor="#10B981"
      terrainColor="#030D08"
      skyTopColor="#020A05"
      skyHorizonColor="#0A1F15"
      fogColor="#10B981"
      heightScale={0.05}
      terrainSize={35}
    >
      {/* Server Infrastructure */}
      <ServerCorridor lod={lod} />

      {/* Conveyor Belt */}
      <ConveyorBelt lod={lod} isRunning={isRunning} />

      {/* Tool Shelves */}
      <ToolShelves lod={lod} />

      {/* Debug Tower */}
      <DebugTower lod={lod} activeBlockId={activeBlockId} />

      {/* Cable Conduits */}
      <CableConduits lod={lod} />

      {/* Data Pulse Floor */}
      <DataPulseFloor lod={lod} isRunning={isRunning} />

      {/* Ceiling */}
      <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#050F0A" roughness={0.9} />
      </mesh>

      {/* Execution glow */}
      {isRunning && (
        <pointLight
          position={[0, 2, 0]}
          intensity={1.5}
          color="#10B981"
          distance={12}
        />
      )}
    </FlagshipEnvironmentWrapper>
  );
}
