'use client';

// ════════════════════════════════════════════════════
// TreatTrainerEnvironment — AI Training Playground (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 2: Machine Learning | Color: #AA66FF (Purple)
//
// An AI training playground/obstacle course for virtual pets:
//   - Treat dispensers along the course (instanced)
//   - Training hoops to jump through (instanced)
//   - Reward stations with star indicators (instanced)
//   - Behavior tracking scoreboard display
//   - Positive reinforcement zone (green glow)
//   - Negative reinforcement zone (red glow)
//   - Training targets and checkpoints (instanced)
//   - Response meter display gauge
//   - Pet playground equipment (slides, tunnels, platforms)
//
// Triangle Budget (Desktop Ultra):
//   Treat Dispensers (instanced):       ~60K  (10 dispensers x ~6K)
//   Training Hoops (instanced):         ~55K  (8 hoops)
//   Reward Stations (instanced):        ~65K  (6 stations with star indicators)
//   Scoreboard Display:                 ~35K  (screen + frame)
//   Reinforcement Zones:                ~50K  (2 glowing platforms)
//   Training Targets (instanced):       ~45K  (12 targets)
//   Response Meter:                     ~30K  (gauge + needle)
//   Playground Equipment:               ~75K  (slides, tunnels, platforms)
//   Arena Fencing + Floor:              ~55K
//   Ambient Particles:                  ~30K
//   Total:                              ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Euler,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#AA66FF';

// ■■ Treat Dispensers (Instanced) ■■
function TreatDispensers({ treatCount }: { treatCount: number }) {
  const count = 10;
  const basesRef = useRef<InstancedMesh>(null);
  const bowlsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!basesRef.current || !bowlsRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 4.0;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      // Dispenser tube
      tmp.makeScale(0.12, 0.8, 0.12);
      tmp.setPosition(x, 0.1, z);
      basesRef.current.setMatrixAt(i, tmp);
      // Bowl at top
      tmp.makeScale(0.2, 0.08, 0.2);
      tmp.setPosition(x, 0.55, z);
      bowlsRef.current.setMatrixAt(i, tmp);
      const isFull = i < treatCount;
      color.set(isFull ? '#00FF88' : '#333340');
      bowlsRef.current.setColorAt(i, color);
    }
    basesRef.current.instanceMatrix.needsUpdate = true;
    bowlsRef.current.instanceMatrix.needsUpdate = true;
    if (bowlsRef.current.instanceColor) bowlsRef.current.instanceColor.needsUpdate = true;
  }, [count, treatCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!bowlsRef.current) return;
    const mat = bowlsRef.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = 0.2 + Math.sin(timeRef.current * 2) * 0.1;
  });

  return (
    <group>
      <instancedMesh ref={basesRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.8, 1, 1, 12]} />
        <meshStandardMaterial color="#2A1E3A" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={bowlsRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 0.7, 1, 12]} />
        <meshStandardMaterial emissive="#00FF88" emissiveIntensity={0.2} metalness={0.6} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Training Hoops (Instanced) ■■
function TrainingHoops({ isTraining }: { isTraining: boolean }) {
  const count = 8;
  const hoopsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  const hoopData = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: -3 + (i / (count - 1)) * 6,
      y: 1.2 + (i % 3) * 0.3,
      z: -1 + (i % 2) * 2,
      phase: i * 0.5,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!hoopsRef.current) return;
    const tmp = new Matrix4();
    const rot = new Quaternion();
    for (let i = 0; i < count; i++) {
      const h = hoopData[i];
      const wobble = isTraining ? Math.sin(timeRef.current * 2 + h.phase) * 0.1 : 0;
      rot.setFromEuler(new Euler(0, 0, wobble));
      const scale = 0.6 + (i % 3) * 0.15;
      tmp.compose(
        new Vector3(h.x, h.y + (isTraining ? Math.sin(timeRef.current + h.phase) * 0.15 : 0), h.z),
        rot,
        new Vector3(scale, scale, scale)
      );
      hoopsRef.current.setMatrixAt(i, tmp);
    }
    hoopsRef.current.instanceMatrix.needsUpdate = true;
    const mat = hoopsRef.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = isTraining ? 0.5 + Math.sin(timeRef.current * 3) * 0.2 : 0.15;
  });

  return (
    <instancedMesh ref={hoopsRef} args={[undefined, undefined, count]}>
      <torusGeometry args={[1, 0.06, 8, 24]} />
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={0.15}
        metalness={0.7}
        roughness={0.2}
      />
    </instancedMesh>
  );
}

// ■■ Reward Stations (Instanced) ■■
function RewardStations() {
  const count = 6;
  const pedestalsRef = useRef<InstancedMesh>(null);
  const starsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!pedestalsRef.current || !starsRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 2.5;
      const z = 3.5;
      // Pedestal
      tmp.makeScale(0.3, 0.4, 0.3);
      tmp.setPosition(x, -0.5, z);
      pedestalsRef.current.setMatrixAt(i, tmp);
      // Star
      tmp.makeScale(0.15, 0.15, 0.03);
      tmp.setPosition(x, 0.0, z);
      starsRef.current.setMatrixAt(i, tmp);
    }
    pedestalsRef.current.instanceMatrix.needsUpdate = true;
    starsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!starsRef.current) return;
    const tmp = new Matrix4();
    const rot = new Quaternion();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 2.5;
      const y = 0.0 + Math.sin(timeRef.current * 1.5 + i) * 0.1;
      rot.setFromEuler(new Euler(0, timeRef.current * 0.8 + i, 0));
      tmp.compose(new Vector3(x, y, 3.5), rot, new Vector3(0.15, 0.15, 0.03));
      starsRef.current.setMatrixAt(i, tmp);
    }
    starsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={pedestalsRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.8, 1, 1, 12]} />
        <meshStandardMaterial color="#1E1630" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={starsRef} args={[undefined, undefined, count]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.5} metalness={0.6} roughness={0.2} />
      </instancedMesh>
    </group>
  );
}

// ■■ Scoreboard Display ■■
function ScoreboardDisplay({ treatCount }: { treatCount: number }) {
  const screenRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (screenRef.current) {
      const mat = screenRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.5) * 0.1;
    }
  });

  return (
    <group position={[0, 3.5, -4.5]}>
      {/* Screen backing */}
      <mesh castShadow>
        <boxGeometry args={[2.5, 1.2, 0.1]} />
        <meshStandardMaterial color="#1A1230" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Screen display */}
      <mesh ref={screenRef} position={[0, 0, 0.06]}>
        <boxGeometry args={[2.2, 1.0, 0.02]} />
        <meshStandardMaterial
          color="#110A20"
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Score bar indicator */}
      <mesh position={[-0.8 + Math.min(treatCount * 0.16, 1.6) / 2, -0.2, 0.08]}>
        <boxGeometry args={[Math.min(treatCount * 0.16, 1.6), 0.15, 0.01]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.5} />
      </mesh>
      {/* Support pole */}
      <mesh position={[0, -1.5, -0.05]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2, 6]} />
        <meshStandardMaterial color="#333340" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Reinforcement Zones ■■
function ReinforcementZones({ isTraining }: { isTraining: boolean }) {
  const positiveRef = useRef<Mesh>(null);
  const negativeRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  const segments = 24;

  useFrame((_, delta) => {
    timeRef.current += delta;
    const intensity = isTraining ? 0.4 + Math.sin(timeRef.current * 2) * 0.2 : 0.1;
    if (positiveRef.current) {
      (positiveRef.current.material as MeshStandardMaterial).emissiveIntensity = intensity;
    }
    if (negativeRef.current) {
      (negativeRef.current.material as MeshStandardMaterial).emissiveIntensity = intensity;
    }
  });

  return (
    <group>
      {/* Positive zone (green) */}
      <mesh ref={positiveRef} position={[-2.5, -0.94, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, segments]} />
        <meshStandardMaterial
          color="#00FF88"
          emissive="#00FF88"
          emissiveIntensity={0.1}
          transparent
          opacity={0.25}
          side={DoubleSide}
        />
      </mesh>
      {/* Negative zone (red) */}
      <mesh ref={negativeRef} position={[2.5, -0.94, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, segments]} />
        <meshStandardMaterial
          color="#FF4444"
          emissive="#FF4444"
          emissiveIntensity={0.1}
          transparent
          opacity={0.25}
          side={DoubleSide}
        />
      </mesh>
      {/* Zone labels */}
      {(
        <>
          <mesh position={[-2.5, 0.1, -2]}>
            <boxGeometry args={[0.6, 0.15, 0.02]} />
            <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[2.5, 0.1, -2]}>
            <boxGeometry args={[0.6, 0.15, 0.02]} />
            <meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={0.4} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ■■ Training Targets (Instanced) ■■
function TrainingTargets({ isTraining }: { isTraining: boolean }) {
  const count = 12;
  const targetsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  const targetData = useMemo(() =>
    Array.from({ length: count }, (_, _i) => ({
      x: (Math.random() - 0.5) * 7,
      z: (Math.random() - 0.5) * 6,
      phase: Math.random() * Math.PI * 2,
      popSpeed: 1 + Math.random() * 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!targetsRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const t = targetData[i];
      const visible = isTraining ? Math.sin(timeRef.current * t.popSpeed + t.phase) > 0 : true;
      const scale = visible ? 0.15 : 0.001;
      const y = visible ? -0.6 + Math.sin(timeRef.current * 0.5 + t.phase) * 0.1 : -2;
      tmp.makeScale(scale, scale, scale);
      tmp.setPosition(t.x, y, t.z);
      targetsRef.current.setMatrixAt(i, tmp);
    }
    targetsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={targetsRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color="#FFAA44"
        emissive="#FFAA44"
        emissiveIntensity={0.4}
        metalness={0.5}
        roughness={0.3}
      />
    </instancedMesh>
  );
}

// ■■ Playground Equipment ■■
function PlaygroundEquipment() {
  const segments = 16;

  return (
    <group>
      {/* Tunnel */}
      <mesh position={[3, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 1.8, segments, 1, true]} />
        <meshStandardMaterial color="#2A1E3A" metalness={0.4} roughness={0.5} side={DoubleSide} />
      </mesh>
      {/* Slide ramp */}
      <mesh position={[-3, -0.2, 1]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.03, 2.0]} />
        <meshStandardMaterial color="#3A2E4A" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Slide supports */}
      <mesh position={[-3, -0.5, 0.2]} castShadow>
        <boxGeometry args={[0.04, 0.6, 0.04]} />
        <meshStandardMaterial color="#444455" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Elevated platform */}
      <mesh position={[0, 0.3, -3]} castShadow>
        <boxGeometry args={[1.5, 0.08, 1.5]} />
        <meshStandardMaterial color="#2A2040" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Platform supports */}
      {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, -0.3, -3 + dz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
          <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Seesaw */}
      {(
        <group position={[1, -0.7, 2.5]}>
          <mesh>
            <boxGeometry args={[2.0, 0.04, 0.3]} />
            <meshStandardMaterial color="#3A2050" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <coneGeometry args={[0.15, 0.25, 6]} />
            <meshStandardMaterial color="#444455" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ■■ Response Meter Gauge ■■
function ResponseMeter({ isTraining }: { isTraining: boolean }) {
  const needleRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (needleRef.current) {
      const targetAngle = isTraining
        ? Math.sin(timeRef.current * 1.2) * 0.8
        : -0.5;
      needleRef.current.rotation.z += (targetAngle - needleRef.current.rotation.z) * delta * 3;
    }
  });

  return (
    <group position={[4.5, 2, -3]}>
      {/* Gauge backing */}
      <mesh>
        <circleGeometry args={[0.5, 16]} />
        <meshStandardMaterial color="#1A1230" metalness={0.5} roughness={0.4} side={DoubleSide} />
      </mesh>
      {/* Gauge ring */}
      <mesh position={[0, 0, 0.01]}>
        <torusGeometry args={[0.5, 0.03, 6, 24]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </mesh>
      {/* Needle */}
      <mesh ref={needleRef} position={[0, 0, 0.02]}>
        <boxGeometry args={[0.02, 0.4, 0.01]} />
        <meshStandardMaterial color="#FF6644" emissive="#FF6644" emissiveIntensity={0.4} />
      </mesh>
      {/* Center dot */}
      <mesh position={[0, 0, 0.03]}>
        <circleGeometry args={[0.04, 8]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} side={DoubleSide} />
      </mesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface TreatTrainerEnvironmentProps {
  treatCount?: number;
  isTraining?: boolean;
}

export default function TreatTrainerEnvironment({
  treatCount = 0,
  isTraining = false,
}: TreatTrainerEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0A0818"
      skyTopColor="#04020E"
      skyHorizonColor="#120A28"
      fogColor="#AA66FF"
    >
      <TreatDispensers treatCount={treatCount} />
      <TrainingHoops isTraining={isTraining} />
      <RewardStations />
      <ScoreboardDisplay treatCount={treatCount} />
      <ReinforcementZones isTraining={isTraining} />
      <TrainingTargets isTraining={isTraining} />
      <PlaygroundEquipment />
      <ResponseMeter isTraining={isTraining} />
      {/* Training active glow */}
      {isTraining && (
        <pointLight position={[0, 3, 0]} intensity={1.0} color={LAB_COLOR} distance={8} />
      )}
    </StandardEnvironmentWrapper>
  );
}
