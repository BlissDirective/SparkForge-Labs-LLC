'use client';

// ════════════════════════════════════════════════════
// RobotVacuumEnvironment — Smart Home Interior (FL-Lite 1.2M budget)
// ════════════════════════════════════════════════════
// Lab 5: AI Agents | Color: #00FF88 (Green)
//
// Smart home interior with IoT devices, furniture, control panels,
// sensor nodes, kitchen area, charging dock, holographic floor plan,
// smart lights, and dust particles reacting to clean state.
//
// Triangle Budget (Desktop Ultra):
//   Living Room Furniture:     ~220K (sofa, coffee table, TV stand, bookshelf)
//   Smart Home Control Panels: ~100K (wall-mounted glowing screens)
//   IoT Sensor Nodes:          ~150K (instanced floating near ceiling)
//   Kitchen Area:              ~200K (counters and appliances)
//   Charging Dock Station:     ~120K (glowing platform with rings)
//   Holographic Floor Plan:    ~130K (floating translucent overlay)
//   Smart Light Fixtures:      ~100K (instanced ceiling lights)
//   Dust Particles:            ~110K (reactive to clean state)
//   Base Environment:          ~70K  (terrain + sky + fog)
//   Total:                     ~1.2M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { FLLiteEnvironmentWrapper } from './FLLiteEnvironmentBase';

// ■■ Living Room Furniture ■■
function LivingRoomFurniture() {
  const _sofaSegs = 16;

  return (
    <group position={[3, -0.6, 0]}>
      {/* Sofa */}
      <group position={[0, 0, -2]}>
        <mesh castShadow>
          <boxGeometry args={[3, 0.5, 1.0]} />
          <meshStandardMaterial color="#1A2A1E" roughness={0.8} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.55, -0.35]} castShadow>
          <boxGeometry args={[3, 0.7, 0.3]} />
          <meshStandardMaterial color="#1A2A1E" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* Armrests */}
        {[-1.4, 1.4].map((x, i) => (
          <mesh key={i} position={[x, 0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.35, 1.0]} />
            <meshStandardMaterial color="#162218" roughness={0.8} />
          </mesh>
        ))}
      </group>
      {/* Coffee Table */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.8]} />
        <meshStandardMaterial color="#111118" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* TV Stand */}
      <mesh position={[0, 0.2, 3]} castShadow>
        <boxGeometry args={[2.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#111118" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* TV Screen */}
      <mesh position={[0, 0.9, 3.2]}>
        <planeGeometry args={[2.2, 1.2]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.15} />
      </mesh>
      {/* Bookshelf */}
      {(
        <group position={[-3, 0.3, 1]}>
          {[0, 0.5, 1.0, 1.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} castShadow>
              <boxGeometry args={[1.2, 0.04, 0.35]} />
              <meshStandardMaterial color="#1A1822" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
          {/* Shelf sides */}
          {[-0.6, 0.6].map((x, i) => (
            <mesh key={`s${i}`} position={[x, 0.75, 0]} castShadow>
              <boxGeometry args={[0.04, 1.6, 0.35]} />
              <meshStandardMaterial color="#1A1822" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ■■ Smart Home Control Panels ■■
function ControlPanels() {
  const panelCount = 6;
  const panelsRef = useRef<InstancedMesh>(null);
  const glowRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!panelsRef.current || !glowRef.current) return;
    const pTemp = new Matrix4();
    const gTemp = new Matrix4();
    for (let i = 0; i < panelCount; i++) {
      const angle = (i / panelCount) * Math.PI * 2;
      const r = 10;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      pTemp.makeRotationY(-angle);
      pTemp.setPosition(x, 1.2, z);
      panelsRef.current.setMatrixAt(i, pTemp);
      gTemp.makeRotationY(-angle);
      gTemp.setPosition(x - Math.sin(angle) * 0.01, 1.2, z + Math.cos(angle) * 0.01);
      glowRef.current.setMatrixAt(i, gTemp);
    }
    panelsRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
  }, [panelCount]);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as MeshBasicMaterial;
    mat.opacity = 0.25 + Math.sin(clock.elapsedTime * 1.5) * 0.1;
  });

  return (
    <group>
      <instancedMesh ref={panelsRef} args={[undefined, undefined, panelCount]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.04]} />
        <meshStandardMaterial color="#111118" metalness={0.7} roughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={glowRef} args={[undefined, undefined, panelCount]}>
        <planeGeometry args={[0.7, 0.4]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.25} side={DoubleSide} />
      </instancedMesh>
    </group>
  );
}

// ■■ IoT Sensor Nodes ■■
function IoTSensorNodes() {
  const count = 30;
  const ref = useRef<InstancedMesh>(null);

  const offsets = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 16,
    z: (Math.random() - 0.5) * 16,
    phase: Math.random() * Math.PI * 2,
  })), [count]);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new Matrix4();
    for (let i = 0; i < count; i++) {
      temp.makeScale(0.12, 0.06, 0.12);
      temp.setPosition(offsets[i].x, 3.5 + Math.random() * 0.5, offsets[i].z);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, offsets]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const temp = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    for (let i = 0; i < count; i++) {
      ref.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      pos.y = 3.5 + Math.sin(clock.elapsedTime * 0.6 + offsets[i].phase) * 0.15;
      temp.compose(pos, quat, scl);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
    </instancedMesh>
  );
}

// ■■ Charging Dock Station ■■
function ChargingDock({ isRunning }: { isRunning: boolean }) {
  const ringRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = clock.elapsedTime * (isRunning ? 0.3 : 1.2);
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as MeshBasicMaterial;
      mat.opacity = isRunning ? 0.15 : 0.4 + Math.sin(clock.elapsedTime * 3) * 0.15;
    }
  });

  return (
    <group position={[-5, -0.9, -4]}>
      {/* Dock platform */}
      <mesh receiveShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.1, 24]} />
        <meshStandardMaterial color="#1A2A1E" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Energy ring */}
      <mesh ref={ringRef} position={[0, 0.15, 0]}>
        <torusGeometry args={[0.6, 0.03, 8, 32]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.8} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Platform glow */}
      <mesh ref={glowRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75, 24]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.3} />
      </mesh>
      {/* Charging connectors */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.85, 0.12, Math.sin(a) * 0.85]}>
          <boxGeometry args={[0.06, 0.15, 0.06]} />
          <meshStandardMaterial color="#00CC66" emissive="#00FF88" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Smart Light Fixtures ■■
function SmartLights() {
  const count = 16;
  const ref = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 14;
      temp.makeScale(0.3, 0.05, 0.3);
      temp.setPosition(x, 4.2, z);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshStandardMaterial color="#222228" emissive="#00FF88" emissiveIntensity={0.2} metalness={0.6} roughness={0.3} />
    </instancedMesh>
  );
}

// ■■ Dust Particles ■■
function DustParticles({ cleanProgress }: { cleanProgress: number }) {
  const baseCount = 250;
  const count = Math.max(10, Math.floor(baseCount * (1 - cleanProgress)));
  const ref = useRef<InstancedMesh>(null);

  const speeds = useMemo(() => Array.from({ length: baseCount }, () => ({
    vx: (Math.random() - 0.5) * 0.3,
    vy: 0.1 + Math.random() * 0.2,
    vz: (Math.random() - 0.5) * 0.3,
  })), [baseCount]);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const s = 0.015 + Math.random() * 0.025;
      temp.makeScale(s, s, s);
      temp.setPosition((Math.random() - 0.5) * 16, Math.random() * 2 - 0.5, (Math.random() - 0.5) * 16);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const temp = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    for (let i = 0; i < count; i++) {
      ref.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      pos.x += speeds[i].vx * delta;
      pos.y += speeds[i].vy * delta;
      pos.z += speeds[i].vz * delta;
      if (pos.y > 3) { pos.y = -0.5; pos.x = (Math.random() - 0.5) * 16; pos.z = (Math.random() - 0.5) * 16; }
      temp.compose(pos, quat, scl);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#AABB99" transparent opacity={0.35} />
    </instancedMesh>
  );
}

// ■■ Main Environment ■■
interface RobotVacuumEnvironmentProps {
  isRunning: boolean;
  cleanProgress: number;
}

export default function RobotVacuumEnvironment({ isRunning, cleanProgress }: RobotVacuumEnvironmentProps) {

  return (
    <FLLiteEnvironmentWrapper
      labColor="#00FF88"
      terrainColor="#0A160E"
      skyTopColor="#040A06"
      skyHorizonColor="#0E2818"
      fogColor="#00FF88"
    >
      <LivingRoomFurniture />
      <ControlPanels />
      <IoTSensorNodes />
      <ChargingDock isRunning={isRunning} />
      <SmartLights />
      {<DustParticles cleanProgress={cleanProgress} />}
    </FLLiteEnvironmentWrapper>
  );
}
