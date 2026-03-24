'use client';

// ════════════════════════════════════════════════════
// TokenChopperEnvironment — Tokenization Factory (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 4: Language & Communication | Color: #FFAA44 (Amber)
//
// An industrial text processing plant where raw text is chopped into tokens:
//   - Conveyor belts carrying text blocks through the factory
//   - Giant scissor/chopper mechanism with animated blades
//   - Token bins sorted by type (instanced colored bins)
//   - Vocabulary lookup towers (tall reference columns)
//   - Subword assembly station (merging smaller pieces)
//   - Byte-pair encoding visualizer (pair frequency display)
//   - Token counter display (digital readout panel)
//   - Text-to-token pipeline tubes (transparent glowing pipes)
//
// Triangle Budget (Desktop Ultra):
//   Conveyor Belts + Rollers:    ~70K  (3 belts + instanced rollers)
//   Chopper Mechanism:           ~65K  (blades + arm + housing + gears)
//   Token Bins (instanced):      ~55K  (12 bins + labels)
//   Vocabulary Towers:           ~50K  (instanced column stacks)
//   Subword Assembly Station:    ~45K  (workbench + parts + tools)
//   BPE Visualizer:              ~40K  (frequency bars + pairs)
//   Token Counter Display:       ~35K  (digital panel + digits)
//   Pipeline Tubes:              ~60K  (instanced transparent tubes)
//   Factory Structure:           ~50K  (walls, beams, floor grates)
//   Reserve:                     ~30K
//   Total:                       ~500K

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#FFAA44';

// ■■ Conveyor Belts with Rollers ■■
function ConveyorBelts({ isChopping }: { isChopping: boolean }) {
  const rollerCount = 30;
  const rollersRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!rollersRef.current) return;
    const tmp = new THREE.Matrix4();
    const beltPositions = [
      { z: -2, length: 8 },
      { z: 0, length: 6 },
      { z: 2, length: 8 },
    ];
    let idx = 0;
    for (const belt of beltPositions) {
      const perBelt = Math.floor(rollerCount / 3);
      for (let i = 0; i < perBelt && idx < rollerCount; i++) {
        const x = -belt.length / 2 + (i / (perBelt - 1)) * belt.length;
        const rot = new THREE.Quaternion();
        rot.setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
        tmp.compose(
          new THREE.Vector3(x, 0.15, belt.z),
          rot,
          new THREE.Vector3(0.08, 0.15, 0.08),
        );
        rollersRef.current.setMatrixAt(idx, tmp);
        idx++;
      }
    }
    rollersRef.current.instanceMatrix.needsUpdate = true;
  }, [rollerCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!rollersRef.current) return;
    const speed = isChopping ? 3.0 : 0.5;
    const tmp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    for (let i = 0; i < rollerCount; i++) {
      rollersRef.current.getMatrixAt(i, tmp);
      tmp.decompose(pos, quat, scl);
      quat.setFromEuler(new THREE.Euler(timeRef.current * speed, 0, Math.PI / 2));
      tmp.compose(pos, quat, scl);
      rollersRef.current.setMatrixAt(i, tmp);
    }
    rollersRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Belt surfaces */}
      {[-2, 0, 2].map((z, i) => (
        <mesh key={i} position={[0, 0.22, z]} receiveShadow>
          <boxGeometry args={[i === 1 ? 6 : 8, 0.04, 0.5]} />
          <meshStandardMaterial color="#1A1822" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* Side rails */}
      {[-2, 0, 2].map((z, i) => (
        <React.Fragment key={`rails-${i}`}>
          <mesh position={[0, 0.3, z - 0.28]}>
            <boxGeometry args={[i === 1 ? 6 : 8, 0.04, 0.02]} />
            <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.3, z + 0.28]}>
            <boxGeometry args={[i === 1 ? 6 : 8, 0.04, 0.02]} />
            <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
          </mesh>
        </React.Fragment>
      ))}
      {/* Rollers */}
      <instancedMesh ref={rollersRef} args={[undefined, undefined, rollerCount]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#666" metalness={0.6} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Giant Chopper Mechanism ■■
function ChopperMechanism({ isChopping }: { isChopping: boolean }) {
  const bladeRef = useRef<THREE.Mesh>(null);
  const gearRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const segments = 24;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (bladeRef.current) {
      const chopSpeed = isChopping ? 6 : 1;
      bladeRef.current.position.y = 1.8 + Math.abs(Math.sin(timeRef.current * chopSpeed)) * 0.8;
      bladeRef.current.rotation.z = Math.sin(timeRef.current * chopSpeed * 0.3) * 0.05;
    }
    if (gearRef.current) {
      gearRef.current.rotation.z = timeRef.current * (isChopping ? 3 : 0.5);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Housing frame */}
      <mesh position={[-0.7, 1.5, 0]} castShadow>
        <boxGeometry args={[0.1, 2.5, 0.8]} />
        <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.7, 1.5, 0]} castShadow>
        <boxGeometry args={[0.1, 2.5, 0.8]} />
        <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[1.5, 0.15, 0.8]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Blade */}
      <mesh ref={bladeRef} position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[1.0, 0.08, 0.6]} />
        <meshStandardMaterial color="#CCCCCC" metalness={0.9} roughness={0.1} emissive={LAB_COLOR} emissiveIntensity={isChopping ? 0.3 : 0.05} />
      </mesh>
      {/* Cutting edge glow */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.0, 0.02, 0.5]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} transparent opacity={0.5} />
      </mesh>
      {/* Gear */}
      <mesh ref={gearRef} position={[0.85, 2.2, 0.45]}>
        <torusGeometry args={[0.2, 0.04, 6, segments]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Token Bins (Instanced) ■■
function TokenBins({ tokensChopped }: { tokensChopped: number }) {
  const count = 12;
  const binsRef = useRef<THREE.InstancedMesh>(null);
  const labelsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!binsRef.current || !labelsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 1.0;
      tmp.makeScale(0.35, 0.5, 0.3);
      tmp.setPosition(x, 0.25, 4.5);
      binsRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.06 + i * 0.02, 0.7, 0.25);
      binsRef.current.setColorAt(i, color);
      // Label strip
      tmp.makeScale(0.3, 0.04, 0.01);
      tmp.setPosition(x, 0.55, 4.33);
      labelsRef.current.setMatrixAt(i, tmp);
    }
    binsRef.current.instanceMatrix.needsUpdate = true;
    if (binsRef.current.instanceColor) binsRef.current.instanceColor.needsUpdate = true;
    labelsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!binsRef.current) return;
    const tmp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      binsRef.current.getMatrixAt(i, tmp);
      tmp.decompose(pos, quat, scl);
      const fillLevel = Math.min((tokensChopped - i * 5) / 10, 1);
      scl.y = 0.5 + Math.max(0, fillLevel) * 0.2;
      const jiggle = fillLevel > 0 ? Math.sin(timeRef.current * 4 + i) * 0.005 : 0;
      pos.x += jiggle;
      tmp.compose(pos, quat, scl);
      binsRef.current.setMatrixAt(i, tmp);
    }
    binsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={binsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.4} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={labelsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} />
      </instancedMesh>
    </group>
  );
}

// ■■ Vocabulary Lookup Towers ■■
function VocabTowers() {
  const count = 20;
  const blocksRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!blocksRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    const towers = 4;
    let idx = 0;
    for (let t = 0; t < towers; t++) {
      const bx = -5.5 + t * 2.5;
      const perTower = Math.floor(count / towers);
      for (let b = 0; b < perTower && idx < count; b++) {
        tmp.makeScale(0.4, 0.15, 0.25);
        tmp.setPosition(bx, 0.1 + b * 0.18, -5);
        blocksRef.current.setMatrixAt(idx, tmp);
        color.setHSL(0.08 + b * 0.01, 0.5, 0.2 + b * 0.02);
        blocksRef.current.setColorAt(idx, color);
        idx++;
      }
    }
    blocksRef.current.instanceMatrix.needsUpdate = true;
    if (blocksRef.current.instanceColor) blocksRef.current.instanceColor.needsUpdate = true;
  }, [count, 'ultra']);

  return (
    <instancedMesh ref={blocksRef} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.7} metalness={0.2} />
    </instancedMesh>
  );
}

// ■■ Subword Assembly Station ■■
function SubwordStation({ isChopping }: { isChopping: boolean }) {
  const timeRef = useRef(0);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isChopping ? 0.4 + Math.sin(timeRef.current * 3) * 0.2 : 0.1;
    }
  });

  return (
    <group position={[4, 0, -3]}>
      {/* Workbench */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.8]} />
        <meshStandardMaterial color="#2A2235" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Legs */}
      {[[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 6]} />
          <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Assembly glow platform */}
      <mesh ref={glowRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 0.02, 0.5]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.1} transparent opacity={0.5} />
      </mesh>
      {/* Merging arrow indicators */}
      <mesh position={[-0.3, 0.6, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.3, 0.6, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Pipeline Tubes (Instanced) ■■
function PipelineTubes({ isChopping }: { isChopping: boolean }) {
  const count = 8;
  const tubesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!tubesRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const y = 3.0 + i * 0.4;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
      tmp.compose(
        new THREE.Vector3(0, y, -4 + i * 0.3),
        rot,
        new THREE.Vector3(0.08, 5.0, 0.08),
      );
      tubesRef.current.setMatrixAt(i, tmp);
    }
    tubesRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!tubesRef.current) return;
    const mat = tubesRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isChopping
      ? 0.3 + Math.sin(timeRef.current * 4) * 0.15
      : 0.1;
    mat.opacity = 0.3 + (isChopping ? Math.sin(timeRef.current * 2) * 0.1 : 0);
  });

  return (
    <instancedMesh ref={tubesRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[1, 1, 1, 12]} />
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={0.1}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// ■■ Token Counter Display ■■
function TokenCounterDisplay({ tokensChopped }: { tokensChopped: number }) {
  const digitRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (digitRef.current) {
      (digitRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.4 + Math.sin(timeRef.current * 2) * 0.1;
    }
  });

  return (
    <group position={[0, 3.5, 5]}>
      {/* Display panel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.0, 0.6, 0.06]} />
        <meshStandardMaterial color="#111118" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Digit readout area */}
      <mesh ref={digitRef} position={[0, 0, 0.04]}>
        <boxGeometry args={[1.6, 0.4, 0.02]} />
        <meshStandardMaterial
          color="#000000"
          emissive={LAB_COLOR}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Label strip */}
      <mesh position={[0, -0.4, 0.04]}>
        <boxGeometry args={[1.0, 0.08, 0.01]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} />
      </mesh>
      {/* Counter value indicator bars */}
      {Array.from({ length: Math.min(tokensChopped, 8) }, (_, i) => (
        <mesh key={i} position={[-0.7 + i * 0.2, 0, 0.05]}>
          <boxGeometry args={[0.12, 0.25, 0.01]} />
          <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Main Environment ■■
interface TokenChopperEnvironmentProps {
  tokensChopped?: number;
  isChopping?: boolean;
}

export default function TokenChopperEnvironment({
  tokensChopped = 0,
  isChopping = false,
}: TokenChopperEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0A06"
      skyTopColor="#0A0604"
      skyHorizonColor="#1A1208"
      fogColor="#FFAA44"
    >
      <ConveyorBelts isChopping={isChopping} />
      <ChopperMechanism isChopping={isChopping} />
      <TokenBins tokensChopped={tokensChopped} />
      <VocabTowers />
      <SubwordStation isChopping={isChopping} />
      <PipelineTubes isChopping={isChopping} />
      <TokenCounterDisplay tokensChopped={tokensChopped} />
      {/* Active chopping light */}
      {isChopping && (
        <pointLight position={[0, 2.5, 0]} intensity={1.2} color={LAB_COLOR} distance={8} />
      )}
    </StandardEnvironmentWrapper>
  );
}
