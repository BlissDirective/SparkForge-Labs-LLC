'use client';

// ════════════════════════════════════════════════════
// CodeBlocksEnvironment — Code Workshop / Digital Fabrication Lab (FL-Lite 1.4M budget)
// ════════════════════════════════════════════════════
// Lab 9: Building with AI | Color: #F97316 (Orange)
//
// Code workshop with giant terminal screens, circuit board floor,
// LED strip lighting, binary rain columns, robot assistants,
// component shelves, execution pipeline conveyor, and debug tower.
//
// Triangle Budget (Desktop Ultra):
//   Giant Terminal Screens:    ~200K (curved display walls)
//   Circuit Board Floor:       ~180K (instanced trace patterns)
//   LED Strip Lighting:        ~100K (instanced wall strips)
//   Binary Rain Columns:       ~160K (particle columns)
//   Robot Assistants:          ~200K (instanced worker figures)
//   Component Shelf:           ~120K (shelving with block items)
//   Execution Pipeline:        ~180K (conveyor with lit stages)
//   Debug Console Tower:       ~120K (stacked frame displays)
//   Base Environment:          ~70K  (terrain + sky + fog)
//   Total:                     ~1.4M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLLiteEnvironmentWrapper, useFLLiteLOD } from './FLLiteEnvironmentBase';

// ■■ Giant Terminal Screens ■■
function TerminalScreens({ lod, isRunning }: { lod: ReturnType<typeof useFLLiteLOD>; isRunning: boolean }) {
  const screenCount = lod.enableDetailProps ? 5 : 3;
  const scanLineRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!scanLineRef.current) return;
    scanLineRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        child.position.y = ((clock.elapsedTime * 0.8 + i * 0.3) % 1) * 3 - 0.5;
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = isRunning ? 0.2 : 0.08;
      }
    });
  });

  return (
    <group>
      {Array.from({ length: screenCount }).map((_, i) => {
        const angle = (i / screenCount) * Math.PI * 0.7 - Math.PI * 0.35;
        const r = 9;
        const x = Math.sin(angle) * r;
        const z = -Math.cos(angle) * r;
        return (
          <group key={i} position={[x, 2, z]} rotation={[0, angle, 0]}>
            {/* Screen frame */}
            <mesh castShadow>
              <boxGeometry args={[3.5, 2.5, 0.08]} />
              <meshStandardMaterial color="#111118" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Screen surface */}
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[3.3, 2.3]} />
              <meshBasicMaterial color="#F97316" transparent opacity={isRunning ? 0.18 : 0.08} />
            </mesh>
          </group>
        );
      })}
      {/* Scan lines */}
      <group ref={scanLineRef}>
        {Array.from({ length: screenCount }).map((_, i) => {
          const angle = (i / screenCount) * Math.PI * 0.7 - Math.PI * 0.35;
          const r = 8.92;
          return (
            <mesh key={i} position={[Math.sin(angle) * r, 1.5, -Math.cos(angle) * r]} rotation={[0, angle, 0]}>
              <planeGeometry args={[3.2, 0.02]} />
              <meshBasicMaterial color="#F97316" transparent opacity={0.12} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// ■■ Circuit Board Floor Detail ■■
function CircuitBoardFloor({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const traceCount = lod.level === 'ultra' ? 120 : lod.level === 'high' ? 70 : 30;
  const ref = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < traceCount; i++) {
      const isHorizontal = i % 2 === 0;
      const x = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 18;
      const length = 0.5 + Math.random() * 3;
      if (isHorizontal) {
        temp.makeScale(length, 0.005, 0.02);
      } else {
        temp.makeScale(0.02, 0.005, length);
      }
      temp.setPosition(x, -0.94, z);
      ref.current.setMatrixAt(i, temp);
      ref.current.setColorAt(i, new THREE.Color().setHSL(0.07 + Math.random() * 0.03, 0.8, 0.3 + Math.random() * 0.2));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [traceCount]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, traceCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.3} metalness={0.6} roughness={0.3} />
    </instancedMesh>
  );
}

// ■■ LED Strip Lighting ■■
function LEDStrips({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = lod.level === 'ultra' ? 24 : lod.level === 'high' ? 14 : 6;
  const ref = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const isVertical = i % 3 === 0;
      const angle = (i / count) * Math.PI * 2;
      const r = 10.5;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (isVertical) {
        temp.makeScale(0.04, 2.0, 0.02);
        temp.setPosition(x, 1.5, z);
      } else {
        temp.makeScale(1.5, 0.04, 0.02);
        temp.setPosition(x, 0.3 + (i % 2) * 2.5, z);
      }
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      const brightness = 0.4 + Math.sin(clock.elapsedTime * 2 + i * 0.5) * 0.3;
      ref.current.setColorAt(i, new THREE.Color('#F97316').multiplyScalar(brightness));
    }
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#F97316" transparent opacity={0.8} />
    </instancedMesh>
  );
}

// ■■ Binary Rain Columns ■■
function BinaryRainColumns({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const columnCount = lod.level === 'ultra' ? 8 : lod.level === 'high' ? 5 : 3;
  const particlesPerColumn = lod.level === 'ultra' ? 30 : 15;
  const totalCount = columnCount * particlesPerColumn;
  const ref = useRef<THREE.InstancedMesh>(null);

  const configs = useMemo(() => Array.from({ length: columnCount }, () => ({
    x: (Math.random() - 0.5) * 14,
    z: (Math.random() - 0.5) * 14,
    speed: 1 + Math.random() * 2,
  })), [columnCount]);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    let idx = 0;
    for (let c = 0; c < columnCount; c++) {
      for (let p = 0; p < particlesPerColumn; p++) {
        const s = 0.03 + Math.random() * 0.02;
        temp.makeScale(s, s * 3, s);
        temp.setPosition(configs[c].x, p * 0.25, configs[c].z);
        ref.current.setMatrixAt(idx, temp);
        idx++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [columnCount, particlesPerColumn, configs]);

  useFrame(({ clock: _clock }) => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    let idx = 0;
    for (let c = 0; c < columnCount; c++) {
      for (let p = 0; p < particlesPerColumn; p++) {
        ref.current.getMatrixAt(idx, temp);
        temp.decompose(pos, quat, scl);
        pos.y -= configs[c].speed * 0.016;
        if (pos.y < -1) pos.y = 5;
        temp.compose(pos, quat, scl);
        ref.current.setMatrixAt(idx, temp);
        idx++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, totalCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#FFAA44" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ■■ Robot Assistant Figures ■■
function RobotAssistants({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = lod.level === 'ultra' ? 6 : lod.level === 'high' ? 4 : 2;
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!bodyRef.current || !headRef.current) return;
    const bTemp = new THREE.Matrix4();
    const hTemp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 4;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      bTemp.makeTranslation(x, 0, z);
      bodyRef.current.setMatrixAt(i, bTemp);
      hTemp.makeTranslation(x, 0.7, z);
      headRef.current.setMatrixAt(i, hTemp);
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame(({ clock }) => {
    if (!headRef.current) return;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      headRef.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      pos.y = 0.7 + Math.sin(clock.elapsedTime * 1.5 + i * 1.2) * 0.05;
      temp.compose(pos, quat, scl);
      headRef.current.setMatrixAt(i, temp);
    }
    headRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Robot bodies */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[0.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#1A1822" metalness={0.7} roughness={0.2} />
      </instancedMesh>
      {/* Robot heads */}
      <instancedMesh ref={headRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.3, 0.25, 0.25]} />
        <meshStandardMaterial color="#222233" emissive="#F97316" emissiveIntensity={0.3} metalness={0.6} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Execution Pipeline Conveyor ■■
function ExecutionPipeline({ lod, isRunning, blockCount }: { lod: ReturnType<typeof useFLLiteLOD>; isRunning: boolean; blockCount: number }) {
  const stageCount = lod.enableDetailProps ? 6 : 4;
  const stageRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    stageRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isActive = isRunning && i < blockCount;
      mat.emissiveIntensity = isActive
        ? 0.5 + Math.sin(clock.elapsedTime * 3 + i * 0.5) * 0.3
        : 0.1;
    });
  });

  return (
    <group position={[5, -0.3, 3]}>
      {/* Conveyor belt base */}
      <mesh receiveShadow>
        <boxGeometry args={[stageCount * 1.2, 0.06, 0.8]} />
        <meshStandardMaterial color="#111118" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Pipeline stages */}
      {Array.from({ length: stageCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { stageRefs.current[i] = el; }}
          position={[(i - (stageCount - 1) / 2) * 1.2, 0.2, 0]}
          castShadow
        >
          <boxGeometry args={[0.8, 0.3, 0.6]} />
          <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.1} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {/* Arrows between stages */}
      {Array.from({ length: stageCount - 1 }).map((_, i) => (
        <mesh key={`a${i}`} position={[(i - (stageCount - 2) / 2) * 1.2, 0.2, 0.45]}>
          <boxGeometry args={[0.3, 0.02, 0.02]} />
          <meshBasicMaterial color="#FFAA44" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Main Environment ■■
interface CodeBlocksEnvironmentProps {
  isRunning: boolean;
  blockCount: number;
}

export default function CodeBlocksEnvironment({ isRunning, blockCount }: CodeBlocksEnvironmentProps) {
  const lod = useFLLiteLOD();

  return (
    <FLLiteEnvironmentWrapper
      labColor="#F97316"
      terrainColor="#140E0A"
      skyTopColor="#0A0604"
      skyHorizonColor="#281A0E"
      fogColor="#F97316"
    >
      <TerminalScreens lod={lod} isRunning={isRunning} />
      <CircuitBoardFloor lod={lod} />
      <LEDStrips lod={lod} />
      {lod.enableParticles && <BinaryRainColumns lod={lod} />}
      <RobotAssistants lod={lod} />
      <ExecutionPipeline lod={lod} isRunning={isRunning} blockCount={blockCount} />
    </FLLiteEnvironmentWrapper>
  );
}
