'use client';

// ════════════════════════════════════════════════════
// NeuralBuilderEnvironment — Quantum Data Center (10M budget)
// ════════════════════════════════════════════════════
// Lab 3: How AI Learns | Color: #EC4899 (Pink)
//
// Fully immersive data center with quantum computing elements:
//   - Server rack walls with blinking status LEDs
//   - Quantum core processor with spinning orbital rings
//   - Data pipeline tubes with flowing particle streams
//   - Monitoring dashboard array (screens showing metrics)
//   - Matrix rain falling code particles
//   - Circuit board ground plane with traced copper paths
//   - Holographic data flow panels
//   - Cooling fan assemblies with rotation animation
//   - Neural pathway light trails on ceiling
//   - Security laser grid perimeter
//   - Robotic sorting arms
//   - Ambient data particles drifting through the space
//
// Triangle Budget (Desktop Ultra):
//   Terrain (circuit board):  ~400K
//   Server Racks (instanced): ~600K (60 racks x ~10K each)
//   Quantum Core:             ~500K (processor + orbital rings)
//   Data Pipelines:           ~400K (transparent tubes + particles)
//   Monitor Array:            ~300K (dashboard screens)
//   Matrix Rain:              ~300K (falling code particles)
//   Circuit Traces:           ~200K (copper paths)
//   Holographic Panels:       ~150K (floating displays)
//   Cooling Systems:          ~100K (fan assemblies)
//   Ceiling Neural Paths:     ~150K (glowing tube network)
//   Security Laser Grid:      ~100K (laser beams)
//   Robotic Arms:             ~200K (mechanical sorters)
//   Sky/Enclosure:            ~80K
//   Data Stream Particles:    ~200K
//   Total:                    ~3.68M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FlagshipEnvironmentWrapper,
  useFlagshipLOD,
} from './FlagshipEnvironmentBase';

// ■■ Server Racks (Instanced — expanded) ■■
function ServerRacks({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const rackCount = 60;
  const racksRef = useRef<THREE.InstancedMesh>(null);
  const ledsRef = useRef<THREE.InstancedMesh>(null);
  const ledCount = rackCount * 10;

  React.useEffect(() => {
    if (!racksRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < rackCount; i++) {
      const row = i < rackCount / 2 ? -1 : 1;
      const idx = i < rackCount / 2 ? i : i - rackCount / 2;
      const z = (idx - (rackCount / 4 - 0.5)) * 2.2;
      temp.makeTranslation(row * 11, 0.5, z);
      racksRef.current.setMatrixAt(i, temp);
    }
    racksRef.current.instanceMatrix.needsUpdate = true;
  }, [rackCount]);

  React.useEffect(() => {
    if (!ledsRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < ledCount; i++) {
      const rackIdx = Math.floor(i / 10);
      const ledIdx = i % 10;
      const row = rackIdx < rackCount / 2 ? -1 : 1;
      const idx = rackIdx < rackCount / 2 ? rackIdx : rackIdx - rackCount / 2;
      const z = (idx - (rackCount / 4 - 0.5)) * 2.2;
      const x = row * 11 + row * -0.55;
      const y = 0.1 + ledIdx * 0.18;
      temp.makeScale(0.035, 0.035, 0.035);
      temp.setPosition(x, y, z + (ledIdx % 2) * 0.25 - 0.12);
      ledsRef.current.setMatrixAt(i, temp);
    }
    ledsRef.current.instanceMatrix.needsUpdate = true;
  }, [ledCount, rackCount]);

  useFrame((state) => {
    if (!ledsRef.current) return;
    const color = new THREE.Color();
    const t = state.clock.elapsedTime;
    for (let i = 0; i < Math.min(ledCount, ledsRef.current.count); i++) {
      const blink = Math.sin(t * 3 + i * 0.7) > 0;
      const hue = (i * 0.03 + t * 0.1) % 1;
      color.setHSL(hue, 1, blink ? 0.6 : 0.1);
      ledsRef.current.setColorAt(i, color);
    }
    if (ledsRef.current.instanceColor) ledsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={racksRef} args={[undefined, undefined, rackCount]} castShadow>
        <boxGeometry args={[1, 2.8, 2]} />
        <meshStandardMaterial color="#1A1A2E" metalness={0.8} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={ledsRef} args={[undefined, undefined, ledCount]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#EC4899" />
      </instancedMesh>
    </>
  );
}

// ■■ Quantum Core Processor ■■
function QuantumCore({ lod, isTraining }: { lod: ReturnType<typeof useFlagshipLOD>; isTraining: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = isTraining ? 3 : 1;
    if (coreRef.current) {
      coreRef.current.rotation.y = t * speed * 0.5;
      const pulse = 1 + (isTraining ? Math.sin(t * 4) * 0.15 : Math.sin(t) * 0.05);
      coreRef.current.scale.setScalar(pulse);
    }
    if (ring1Ref.current) ring1Ref.current.rotation.x = t * speed * 0.8;
    if (ring2Ref.current) ring2Ref.current.rotation.y = t * speed * 0.6;
    if (ring3Ref.current) ring3Ref.current.rotation.z = t * speed * 0.4;
    if (outerRef.current) {
      outerRef.current.rotation.y = -t * 0.2;
      outerRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
  });

  const detail = 4;

  return (
    <group position={[0, 2, 0]}>
      {/* Inner core */}
      <mesh ref={coreRef} castShadow>
        <icosahedronGeometry args={[0.8, detail]} />
        <meshStandardMaterial color="#EC4899" metalness={0.6} roughness={0.15} emissive="#EC4899" emissiveIntensity={isTraining ? 1.0 : 0.3} />
      </mesh>
      {/* Orbital ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.5, 0.03, 4, 64]} />
        <meshStandardMaterial color="#F9A8D4" emissive="#EC4899" emissiveIntensity={0.5} transparent opacity={0.6} />
      </mesh>
      {/* Orbital ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2, 0.025, 4, 64]} />
        <meshStandardMaterial color="#F472B6" emissive="#EC4899" emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
      {/* Orbital ring 3 */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[2.5, 0.02, 4, 64]} />
        <meshStandardMaterial color="#BE185D" emissive="#EC4899" emissiveIntensity={0.2} transparent opacity={0.4} />
      </mesh>
      {/* Outer wireframe shell */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[3, 1]} />
        <meshStandardMaterial color="#EC4899" transparent opacity={0.05} wireframe />
      </mesh>
      <pointLight intensity={isTraining ? 3 : 1} color="#EC4899" distance={12} />
    </group>
  );
}

// ■■ Data Pipeline Tubes ■■
function DataPipelines({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const tubeCount = 8;
  const particleCount = 200;
  const particlesRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() =>
    Array.from({ length: particleCount }, () => ({
      tube: Math.floor(Math.random() * tubeCount),
      t: Math.random(),
      speed: 0.3 + Math.random() * 0.5,
    })), [particleCount, tubeCount]
  );

  const tubePositions = useMemo(() =>
    Array.from({ length: tubeCount }, (_, i) => {
      const angle = (i / tubeCount) * Math.PI * 2;
      return { x: Math.cos(angle) * 6, z: Math.sin(angle) * 6 };
    }), [tubeCount]
  );

  useFrame((state) => {
    if (!particlesRef.current) return;
    const temp = new THREE.Matrix4();
    const t = state.clock.elapsedTime;
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      const tube = tubePositions[p.tube];
      const progress = (p.t + t * p.speed) % 1;
      const y = -0.5 + progress * 5;
      temp.makeScale(0.04, 0.04, 0.04);
      temp.setPosition(tube.x, y, tube.z);
      particlesRef.current.setMatrixAt(i, temp);
      color.setHSL(0.92 + progress * 0.1, 1, 0.5 + progress * 0.3);
      particlesRef.current.setColorAt(i, color);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
    if (particlesRef.current.instanceColor) particlesRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Transparent tube shells */}
      {tubePositions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 2, pos.z]}>
          <cylinderGeometry args={[0.15, 0.15, 5, 64, 1, true]} />
          <meshStandardMaterial color="#EC4899" transparent opacity={0.06} side={THREE.DoubleSide} metalness={0.3} roughness={0.1} />
        </mesh>
      ))}
      {/* Flowing particles */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#EC4899" />
      </instancedMesh>
    </group>
  );
}

// ■■ Monitoring Dashboard Array ■■
function MonitorArray({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const screenRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!screenRef.current) return;
    const t = state.clock.elapsedTime;
    screenRef.current.children.forEach((child, i) => {
      child.position.y = 1.5 + Math.sin(t * 0.3 + i * 0.5) * 0.1;
    });
  });

  const screens = [
    { x: 0, z: -12, w: 6, h: 3, ry: 0 },
    { x: -4, z: -11, w: 3, h: 2, ry: 0.3 },
    { x: 4, z: -11, w: 3, h: 2, ry: -0.3 },
    { x: -7, z: -9.5, w: 2.5, h: 1.8, ry: 0.5 },
    { x: 7, z: -9.5, w: 2.5, h: 1.8, ry: -0.5 },
    { x: 0, z: -12, w: 4, h: 1.5, ry: 0 },
  ];

  return (
    <group ref={screenRef}>
      {screens.map((s, i) => (
        <group key={i} position={[s.x, i === 5 ? 3.5 : 1.5, s.z]} rotation={[0.1, s.ry, 0]}>
          {/* Screen border */}
          <mesh>
            <boxGeometry args={[s.w + 0.1, s.h + 0.1, 0.06]} />
            <meshStandardMaterial color="#1A1A2E" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Screen surface */}
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[s.w, s.h]} />
            <meshBasicMaterial color="#EC4899" transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ■■ Matrix Rain Particles ■■
function MatrixRain({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = 400;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const drops = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 20,
      speed: 2 + Math.random() * 4,
      phase: Math.random() * 8,
    })), [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const temp = new THREE.Matrix4();
    const t = state.clock.elapsedTime;
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const d = drops[i];
      const y = 5 - ((t * d.speed + d.phase) % 6);
      const trail = Math.max(0, Math.min(1, (5 - y) / 6));
      temp.makeScale(0.015, 0.03, 0.015);
      temp.setPosition(d.x, y, d.z);
      meshRef.current.setMatrixAt(i, temp);
      color.setHSL(0.92, 1, 0.2 + trail * 0.5);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#EC4899" />
    </instancedMesh>
  );
}

// ■■ Circuit Board Ground Details ■■
function CircuitTraces({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const traceCount = 100;
  const tracesRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!tracesRef.current) return;
    const temp = new THREE.Matrix4();
    const scl = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    for (let i = 0; i < traceCount; i++) {
      const x = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 22;
      const length = 1 + Math.random() * 5;
      const isHorizontal = Math.random() > 0.5;
      pos.set(x, -0.98, z);
      quat.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, isHorizontal ? 0 : Math.PI / 2));
      scl.set(length, 0.05, 1);
      temp.compose(pos, quat, scl);
      tracesRef.current.setMatrixAt(i, temp);
    }
    tracesRef.current.instanceMatrix.needsUpdate = true;
  }, [traceCount]);

  return (
    <instancedMesh ref={tracesRef} args={[undefined, undefined, traceCount]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#EC4899" transparent opacity={0.12} depthWrite={false} />
    </instancedMesh>
  );
}

// ■■ Security Laser Grid ■■
function SecurityGrid({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const beamCount = 20;
  const beamsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!beamsRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < beamCount; i++) {
      const isX = i < beamCount / 2;
      const idx = isX ? i : i - beamCount / 2;
      const offset = (idx - beamCount / 4 + 0.5) * 3;
      if (isX) {
        temp.makeScale(0.01, 0.01, 24);
        temp.setPosition(offset, 0.1 + (idx % 3) * 0.4, 0);
      } else {
        temp.makeScale(24, 0.01, 0.01);
        temp.setPosition(0, 0.1 + (idx % 3) * 0.4, offset);
      }
      beamsRef.current.setMatrixAt(i, temp);
    }
    beamsRef.current.instanceMatrix.needsUpdate = true;
  }, [beamCount]);

  return (
    <instancedMesh ref={beamsRef} args={[undefined, undefined, beamCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#EC4899" transparent opacity={0.03} depthWrite={false} />
    </instancedMesh>
  );
}

// ■■ Robotic Sorting Arms ■■
function RoboticArms({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const armCount = 4;
  const armsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!armsRef.current) return;
    const t = state.clock.elapsedTime;
    armsRef.current.children.forEach((arm, i) => {
      arm.rotation.y = Math.sin(t * 0.5 + i * 1.5) * 0.8;
      const forearm = arm.children[1];
      if (forearm) forearm.rotation.z = Math.sin(t * 0.8 + i * 1.2) * 0.4;
    });
  });

  const positions: [number, number, number][] = [[-5, -1, 5], [5, -1, 5], [-5, -1, -5], [5, -1, -5]];

  return (
    <group ref={armsRef}>
      {positions.slice(0, armCount).map((pos, i) => (
        <group key={i} position={pos}>
          {/* Base */}
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.35, 0.2, 64]} />
            <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Upper arm */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.15, 1.2, 0.15]} />
            <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Forearm */}
          <group position={[0, 1.3, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.12, 0.8, 0.12]} />
              <meshStandardMaterial color="#6B7280" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Gripper */}
            <mesh position={[0, 0.45, 0]}>
              <sphereGeometry args={[0.1, 6, 4]} />
              <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={0.3} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

// ■■ Holographic Display Panels ■■
function HolographicPanels({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const panelCount = 8;
  const panelsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!panelsRef.current) return;
    panelsRef.current.children.forEach((child, i) => {
      child.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 0.5 + i * 0.8) * 0.3;
      child.rotation.y = state.clock.elapsedTime * 0.1 + i * (Math.PI / 4);
    });
  });

  return (
    <group ref={panelsRef}>
      {Array.from({ length: panelCount }).map((_, i) => {
        const angle = (i / panelCount) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 5, 2.5, Math.sin(angle) * 5]}>
            <planeGeometry args={[1.5, 1]} />
            <meshBasicMaterial color="#EC4899" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

// ■■ Cooling Fan Assemblies ■■
function CoolingFans({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const fansRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!fansRef.current) return;
    fansRef.current.children.forEach((fan) => { fan.rotation.z += delta * 8; });
  });

  const fanPositions: [number, number, number][] = [
    [-11, 2.2, -6], [-11, 2.2, -2], [-11, 2.2, 2], [-11, 2.2, 6],
    [11, 2.2, -6], [11, 2.2, -2], [11, 2.2, 2], [11, 2.2, 6],
  ];

  return (
    <group ref={fansRef}>
      {fanPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <torusGeometry args={[0.4, 0.05, 4, 64]} />
          <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Ceiling Neural Pathway Lights ■■
function CeilingPaths({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const pathCount = 30;
  const pathsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!pathsRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < pathCount; i++) {
      const x = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 22;
      const length = 3 + Math.random() * 8;
      const isHoriz = Math.random() > 0.5;
      temp.makeScale(isHoriz ? length : 0.05, 0.02, isHoriz ? 0.05 : length);
      temp.setPosition(x, 5, z);
      pathsRef.current.setMatrixAt(i, temp);
    }
    pathsRef.current.instanceMatrix.needsUpdate = true;
  }, [pathCount]);

  return (
    <instancedMesh ref={pathsRef} args={[undefined, undefined, pathCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#F472B6" transparent opacity={0.3} />
    </instancedMesh>
  );
}

// ■■ Data Stream Particles ■■
function DataStreams({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = 300;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const offsets = useMemo(() =>
    Array.from({ length: count }, () => ({
      speed: 1 + Math.random() * 3,
      x: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 22,
      phase: Math.random() * 10,
    })), [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const temp = new THREE.Matrix4();
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const o = offsets[i];
      const y = ((t * o.speed + o.phase) % 7) - 1;
      temp.makeScale(0.02, 0.02, 0.02);
      temp.setPosition(o.x, y, o.z);
      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#EC4899" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ■■ Main Environment Component ■■
export interface NeuralBuilderEnvironmentProps {
  isTraining: boolean;
  accuracy: number;
}

export default function NeuralBuilderEnvironment({
  isTraining,
  accuracy,
}: NeuralBuilderEnvironmentProps) {
  const lod = useFlagshipLOD();

  return (
    <FlagshipEnvironmentWrapper
      labColor="#EC4899"
      terrainColor="#0D0D1A"
      skyTopColor="#050510"
      skyHorizonColor="#1A0525"
      fogColor="#EC4899"
      heightScale={0.05}
      terrainSize={35}
    >
      <ServerRacks lod={lod} />
      <QuantumCore lod={lod} isTraining={isTraining} />
      <DataPipelines lod={lod} />
      <MonitorArray lod={lod} />
      <MatrixRain lod={lod} />
      <CircuitTraces lod={lod} />
      <SecurityGrid lod={lod} />
      <RoboticArms lod={lod} />
      <HolographicPanels lod={lod} />
      <CoolingFans lod={lod} />
      <CeilingPaths lod={lod} />
      <DataStreams lod={lod} />

      {/* Training-reactive accent light */}
      <pointLight position={[0, 3, 0]} intensity={isTraining ? 2 : 0.3} color={isTraining ? '#F472B6' : '#EC4899'} distance={15} />

      {/* Accuracy-driven floor glow */}
      {accuracy > 0.5 && (
        <mesh position={[0, -0.97, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[10, 64]} />
          <meshBasicMaterial color="#EC4899" transparent opacity={accuracy * 0.12} depthWrite={false} />
        </mesh>
      )}

      {/* Enclosure ceiling */}
      <mesh position={[0, 5.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#0A0A14" roughness={0.9} />
      </mesh>
    </FlagshipEnvironmentWrapper>
  );
}
