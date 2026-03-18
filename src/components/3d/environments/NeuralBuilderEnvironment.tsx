'use client';

// ════════════════════════════════════════════════════
// NeuralBuilderEnvironment — Data Center Lab (5M budget)
// ════════════════════════════════════════════════════
// Lab 3: How AI Learns | Color: #EC4899 (Pink)
//
// Transforms Neural Builder into an immersive data center:
//   - Server rack walls with blinking status LEDs
//   - Circuit board ground plane with traced copper paths
//   - Holographic data flow streams between racks
//   - Floating data visualization panels
//   - Cooling fan assemblies with rotation animation
//   - Neural pathway light trails on ceiling
//   - Ambient data particles drifting through the space
//
// Triangle Budget (Desktop Ultra):
//   Terrain (circuit board):  ~200K
//   Server Racks (instanced): ~400K (50 racks x ~8K each)
//   Data Flow Streams:        ~150K (instanced tube particles)
//   Holographic Panels:       ~80K  (floating display meshes)
//   Cooling Systems:          ~60K  (fan assemblies)
//   Ceiling Neural Paths:     ~100K (glowing tube network)
//   Sky/Enclosure:            ~50K
//   Ambient Particles:        ~60K
//   Total:                    ~1.1M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FlagshipEnvironmentWrapper,
  useFlagshipLOD,
} from './FlagshipEnvironmentBase';

// ■■ Server Racks (Instanced) ■■
function ServerRacks({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const rackCount = lod.level === 'ultra' ? 40 : lod.level === 'high' ? 24 : 12;
  const racksRef = useRef<THREE.InstancedMesh>(null);
  const ledsRef = useRef<THREE.InstancedMesh>(null);

  const ledCount = rackCount * 8; // 8 LED indicators per rack

  React.useEffect(() => {
    if (!racksRef.current) return;
    const temp = new THREE.Matrix4();

    // Place racks in two rows along Z-axis
    for (let i = 0; i < rackCount; i++) {
      const row = i < rackCount / 2 ? -1 : 1;
      const idx = i < rackCount / 2 ? i : i - rackCount / 2;
      const z = (idx - (rackCount / 4 - 0.5)) * 2.5;
      const x = row * 10;

      temp.makeTranslation(x, 0.5, z);
      racksRef.current.setMatrixAt(i, temp);
    }
    racksRef.current.instanceMatrix.needsUpdate = true;
  }, [rackCount]);

  // LED blinking
  React.useEffect(() => {
    if (!ledsRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < ledCount; i++) {
      const rackIdx = Math.floor(i / 8);
      const ledIdx = i % 8;
      const row = rackIdx < rackCount / 2 ? -1 : 1;
      const idx = rackIdx < rackCount / 2 ? rackIdx : rackIdx - rackCount / 2;
      const z = (idx - (rackCount / 4 - 0.5)) * 2.5;
      const x = row * 10 + row * -0.55;
      const y = 0.15 + ledIdx * 0.2;

      temp.makeScale(0.04, 0.04, 0.04);
      temp.setPosition(x, y, z + (ledIdx % 2) * 0.3 - 0.15);
      ledsRef.current.setMatrixAt(i, temp);
    }
    ledsRef.current.instanceMatrix.needsUpdate = true;
  }, [ledCount, rackCount]);

  useFrame((state) => {
    if (!ledsRef.current) return;
    const color = new THREE.Color();
    const t = state.clock.elapsedTime;

    for (let i = 0; i < Math.min(ledCount, ledsRef.current.count); i++) {
      // Staggered blink pattern
      const blink = Math.sin(t * 3 + i * 0.7) > 0;
      const hue = (i * 0.03 + t * 0.1) % 1;
      color.setHSL(hue, 1, blink ? 0.6 : 0.1);
      ledsRef.current.setColorAt(i, color);
    }
    if (ledsRef.current.instanceColor) {
      ledsRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Rack bodies */}
      <instancedMesh ref={racksRef} args={[undefined, undefined, rackCount]} castShadow>
        <boxGeometry args={[1, 2.5, 2]} />
        <meshStandardMaterial
          color="#1A1A2E"
          metalness={0.8}
          roughness={0.3}
        />
      </instancedMesh>

      {/* LED indicators */}
      <instancedMesh ref={ledsRef} args={[undefined, undefined, ledCount]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#EC4899" />
      </instancedMesh>
    </>
  );
}

// ■■ Circuit Board Ground Details ■■
function CircuitTraces({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const traceCount = lod.level === 'ultra' ? 60 : lod.level === 'high' ? 35 : 15;
  const tracesRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!tracesRef.current) return;
    const temp = new THREE.Matrix4();
    const scl = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    for (let i = 0; i < traceCount; i++) {
      const x = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 20;
      const length = 1 + Math.random() * 4;
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
      <meshBasicMaterial
        color="#EC4899"
        transparent
        opacity={0.15}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ■■ Holographic Display Panels ■■
function HolographicPanels({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const panelCount = 6;
  const panelsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!panelsRef.current) return;
    panelsRef.current.children.forEach((child, i) => {
      child.position.y = 2 + Math.sin(state.clock.elapsedTime * 0.5 + i * 1.2) * 0.3;
      child.rotation.y = state.clock.elapsedTime * 0.1 + i * (Math.PI / 3);
    });
  });

  if (!lod.enableDetailProps) return null;

  return (
    <group ref={panelsRef}>
      {Array.from({ length: panelCount }).map((_, i) => {
        const angle = (i / panelCount) * Math.PI * 2;
        const radius = 5;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * radius, 2, Math.sin(angle) * radius]}
          >
            <planeGeometry args={[1.5, 1]} />
            <meshBasicMaterial
              color="#EC4899"
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
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
    fansRef.current.children.forEach((fan) => {
      fan.rotation.z += delta * 8;
    });
  });

  if (!lod.enableDetailProps) return null;

  // Place fans on top of some server racks
  const fanPositions = [
    [-10, 2, -4], [-10, 2, 0], [-10, 2, 4],
    [10, 2, -4], [10, 2, 0], [10, 2, 4],
  ] as const;

  return (
    <group ref={fansRef}>
      {fanPositions.map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], pos[2]]}>
          <torusGeometry args={[0.4, 0.05, 4, lod.segments]} />
          <meshStandardMaterial
            color="#374151"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Ceiling Neural Pathway Lights ■■
function CeilingPaths({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const pathCount = lod.level === 'ultra' ? 20 : 10;
  const pathsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!pathsRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < pathCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 20;
      const length = 3 + Math.random() * 6;
      const isHoriz = Math.random() > 0.5;

      temp.makeScale(isHoriz ? length : 0.05, 0.02, isHoriz ? 0.05 : length);
      temp.setPosition(x, 4.5, z);
      pathsRef.current.setMatrixAt(i, temp);
    }
    pathsRef.current.instanceMatrix.needsUpdate = true;
  }, [pathCount]);

  if (!lod.enableEffects) return null;

  return (
    <instancedMesh ref={pathsRef} args={[undefined, undefined, pathCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color="#F472B6"
        transparent
        opacity={0.3}
      />
    </instancedMesh>
  );
}

// ■■ Data Stream Particles ■■
function DataStreams({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = lod.level === 'ultra' ? 200 : 100;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const offsets = useMemo(() =>
    Array.from({ length: count }, () => ({
      speed: 1 + Math.random() * 3,
      x: (Math.random() - 0.5) * 18,
      z: (Math.random() - 0.5) * 20,
      phase: Math.random() * 10,
    })), [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const temp = new THREE.Matrix4();
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const o = offsets[i];
      const y = ((t * o.speed + o.phase) % 6) - 1;
      temp.makeScale(0.02, 0.02, 0.02);
      temp.setPosition(o.x, y, o.z);
      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!lod.enableParticles) return null;

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
      terrainSize={30}
    >
      {/* Data Center Infrastructure */}
      <ServerRacks lod={lod} />
      <CircuitTraces lod={lod} />
      <HolographicPanels lod={lod} />
      <CoolingFans lod={lod} />
      <CeilingPaths lod={lod} />
      <DataStreams lod={lod} />

      {/* Training-reactive accent light */}
      <pointLight
        position={[0, 3, 0]}
        intensity={isTraining ? 1.5 : 0.3}
        color={isTraining ? '#F472B6' : '#EC4899'}
        distance={15}
      />

      {/* Accuracy-driven floor glow */}
      {accuracy > 0.5 && (
        <mesh position={[0, -0.97, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8, lod.segments]} />
          <meshBasicMaterial
            color="#EC4899"
            transparent
            opacity={accuracy * 0.1}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Enclosure ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0A0A14" roughness={0.9} />
      </mesh>
    </FlagshipEnvironmentWrapper>
  );
}
