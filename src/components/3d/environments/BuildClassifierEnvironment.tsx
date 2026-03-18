'use client';

// ════════════════════════════════════════════════════
// BuildClassifierEnvironment — Classification Construction Yard (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 7: AI Systems | Color: #06B6D4 (Cyan)
//
// An industrial classification workshop where players build
// and train their own ML classifier by sorting data:
//   - Sorting conveyor belts with items (instanced, animated)
//   - Category bins color-coded (instanced)
//   - Decision tree growing from center (branches + leaves)
//   - Feature extraction scanner (laser frame)
//   - Training data warehouse (shelving unit)
//   - Accuracy dashboard (gauge + percentage display)
//   - Confusion matrix display board (grid of cells)
//   - Model architecture blueprint table
//   - Validation checkpoint gate
//
// Triangle Budget (Desktop Ultra):
//   Conveyor Belts + Items:       ~80K  (2 belts + 20 instanced items)
//   Category Bins (instanced):    ~50K  (6 bins x ~8.3K)
//   Decision Tree:                ~60K  (trunk + branches + leaf nodes)
//   Feature Scanner:              ~40K  (frame + laser lines)
//   Training Warehouse:           ~50K  (shelves + data crates instanced)
//   Accuracy Dashboard:           ~40K  (gauge + frame + indicator)
//   Confusion Matrix Board:       ~60K  (grid cells instanced)
//   Blueprint Table:              ~40K  (table + blueprint overlay)
//   Validation Gate:              ~40K  (arch + checkpoint barrier)
//   Floor accents:                ~40K
//   Total:                        ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#06B6D4';

// ■■ Sorting Conveyor Belts with Items (Instanced) ■■
function ConveyorBelts({ lod, itemsSorted }: { lod: ReturnType<typeof useStandardLOD>; itemsSorted: number }) {
  const itemCount = lod.level === 'ultra' ? 20 : lod.level === 'high' ? 12 : 6;
  const itemsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const itemSeeds = useMemo(() =>
    Array.from({ length: itemCount }, (_, i) => ({
      belt: i % 2,
      offset: (i / itemCount) * 8,
      speed: 0.3 + Math.random() * 0.4,
      shape: Math.floor(Math.random() * 3),
      hue: Math.random(),
    })),
  [itemCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!itemsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < itemCount; i++) {
      const s = itemSeeds[i];
      const x = ((s.offset + timeRef.current * s.speed) % 8) - 4;
      const z = s.belt === 0 ? -1.5 : 1.5;
      const size = 0.1 + (s.shape * 0.03);
      tmp.makeScale(size, size, size);
      tmp.setPosition(x, 0.35, z);
      itemsRef.current.setMatrixAt(i, tmp);
      const sorted = i < Math.min(itemsSorted, itemCount);
      color.setHSL(sorted ? 0.33 : s.hue, 0.8, 0.55);
      itemsRef.current.setColorAt(i, color);
    }
    itemsRef.current.instanceMatrix.needsUpdate = true;
    if (itemsRef.current.instanceColor) itemsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Belt 1 */}
      <mesh position={[0, 0.2, -1.5]} receiveShadow>
        <boxGeometry args={[8, 0.1, 0.8]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Belt 2 */}
      <mesh position={[0, 0.2, 1.5]} receiveShadow>
        <boxGeometry args={[8, 0.1, 0.8]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Belt side rails */}
      {[-1.5, 1.5].map((z, bi) => (
        <React.Fragment key={bi}>
          <mesh position={[0, 0.28, z - 0.42]}>
            <boxGeometry args={[8, 0.06, 0.04]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.1} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.28, z + 0.42]}>
            <boxGeometry args={[8, 0.06, 0.04]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.1} metalness={0.7} roughness={0.2} />
          </mesh>
        </React.Fragment>
      ))}
      {/* Items on belts */}
      <instancedMesh ref={itemsRef} args={[undefined, undefined, itemCount]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial metalness={0.3} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// ■■ Category Bins (Instanced) ■■
function CategoryBins({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 6 : lod.level === 'high' ? 4 : 3;
  const binsRef = useRef<THREE.InstancedMesh>(null);
  const labelsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!binsRef.current || !labelsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    const binColors = ['#FF6644', '#00FF88', '#00BBFF', '#FFAA44', '#AA66FF', '#FF66AA'];
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 1.6;
      // Bin body (open top)
      tmp.makeScale(0.6, 0.5, 0.5);
      tmp.setPosition(x, 0.25, 4);
      binsRef.current.setMatrixAt(i, tmp);
      color.set(binColors[i % binColors.length]);
      binsRef.current.setColorAt(i, color);
      // Label strip
      tmp.makeScale(0.5, 0.06, 0.02);
      tmp.setPosition(x, 0.52, 3.74);
      labelsRef.current.setMatrixAt(i, tmp);
      labelsRef.current.setColorAt(i, color);
    }
    binsRef.current.instanceMatrix.needsUpdate = true;
    binsRef.current.instanceColor!.needsUpdate = true;
    labelsRef.current.instanceMatrix.needsUpdate = true;
    labelsRef.current.instanceColor!.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={binsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.4} roughness={0.5} transparent opacity={0.7} />
      </instancedMesh>
      <instancedMesh ref={labelsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Decision Tree (Growing from Center) ■■
function DecisionTree({ lod, accuracy }: { lod: ReturnType<typeof useStandardLOD>; accuracy: number }) {
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const leafCount = lod.level === 'ultra' ? 16 : lod.level === 'high' ? 10 : 5;

  const leafPositions = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < leafCount; i++) {
      const layer = Math.floor(i / 4);
      const idx = i % 4;
      const spread = 0.4 + layer * 0.5;
      const angle = (idx / 4) * Math.PI * 2 + layer * 0.4;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * spread,
        1.5 + layer * 0.6,
        Math.sin(angle) * spread,
      ));
    }
    return pts;
  }, [leafCount]);

  React.useEffect(() => {
    if (!leavesRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < leafCount; i++) {
      const p = leafPositions[i];
      const size = 0.12 + (accuracy / 100) * 0.08;
      tmp.makeScale(size, size, size);
      tmp.setPosition(p.x, p.y, p.z);
      leavesRef.current.setMatrixAt(i, tmp);
      const isActive = i < Math.ceil(leafCount * (accuracy / 100));
      color.set(isActive ? '#00FF88' : '#333340');
      leavesRef.current.setColorAt(i, color);
    }
    leavesRef.current.instanceMatrix.needsUpdate = true;
    leavesRef.current.instanceColor!.needsUpdate = true;
  }, [leafCount, leafPositions, accuracy]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!leavesRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < leafCount; i++) {
      const p = leafPositions[i];
      const bob = Math.sin(timeRef.current * 0.8 + i * 0.5) * 0.03;
      const size = 0.12 + (accuracy / 100) * 0.08;
      tmp.makeScale(size, size, size);
      tmp.setPosition(p.x, p.y + bob, p.z);
      leavesRef.current.setMatrixAt(i, tmp);
    }
    leavesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Trunk */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 1.4, 8]} />
        <meshStandardMaterial color="#2A3040" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Major branches */}
      {lod.enableDetailProps && (
        <>
          {[[-0.3, 1.3, 0, -0.4], [0.3, 1.3, 0, 0.4], [0, 1.3, -0.3, 0], [0, 1.3, 0.3, 0]].map(([x, y, z, rot], i) => (
            <mesh key={i} position={[x, y, z]} rotation={[0, 0, rot]}>
              <cylinderGeometry args={[0.02, 0.04, 0.6, 6]} />
              <meshStandardMaterial color="#2A3040" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </>
      )}
      {/* Leaf nodes */}
      <instancedMesh ref={leavesRef} args={[undefined, undefined, leafCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} metalness={0.3} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Feature Extraction Scanner ■■
function FeatureScanner({ lod: _lod, itemsSorted }: { lod: ReturnType<typeof useStandardLOD>; itemsSorted: number }) {
  const laserRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (laserRef.current) {
      laserRef.current.position.y = 0.6 + Math.sin(timeRef.current * 2) * 0.3;
      (laserRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        itemsSorted > 0 ? 0.6 + Math.sin(timeRef.current * 5) * 0.3 : 0.15;
    }
  });

  return (
    <group position={[-3.5, 0, 0]}>
      {/* Scanner frame */}
      <mesh position={[-0.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.06, 1.0, 0.06]} />
        <meshStandardMaterial color="#2A2838" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.06, 1.0, 0.06]} />
        <meshStandardMaterial color="#2A2838" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1.1, 0.06, 0.06]} />
        <meshStandardMaterial color="#2A2838" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Laser line */}
      <mesh ref={laserRef} position={[0, 0.6, 0]}>
        <boxGeometry args={[0.9, 0.01, 0.01]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.04, 0.8]} />
        <meshStandardMaterial color="#12101E" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Training Data Warehouse ■■
function TrainingWarehouse({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const crateCount = lod.level === 'ultra' ? 15 : lod.level === 'high' ? 9 : 5;
  const cratesRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!cratesRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < crateCount; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      tmp.makeScale(0.25, 0.2, 0.25);
      tmp.setPosition(-4.5 + col * 0.35, 0.5 + row * 0.25, -3.5);
      cratesRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.5 + (i / crateCount) * 0.15, 0.5, 0.3);
      cratesRef.current.setColorAt(i, color);
    }
    cratesRef.current.instanceMatrix.needsUpdate = true;
    if (cratesRef.current.instanceColor) cratesRef.current.instanceColor.needsUpdate = true;
  }, [crateCount]);

  return (
    <group>
      {/* Shelf frame */}
      <mesh position={[-3.5, 0.6, -3.5]} castShadow>
        <boxGeometry args={[2.5, 1.2, 0.4]} />
        <meshStandardMaterial color="#1A1828" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Shelf dividers */}
      {lod.enableDetailProps && (
        <>
          <mesh position={[-3.5, 0.4, -3.3]}>
            <boxGeometry args={[2.4, 0.02, 0.3]} />
            <meshStandardMaterial color="#2A2838" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[-3.5, 0.65, -3.3]}>
            <boxGeometry args={[2.4, 0.02, 0.3]} />
            <meshStandardMaterial color="#2A2838" metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      )}
      {/* Data crates */}
      <instancedMesh ref={cratesRef} args={[undefined, undefined, crateCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.3} roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

// ■■ Accuracy Dashboard ■■
function AccuracyDashboard({ lod, accuracy }: { lod: ReturnType<typeof useStandardLOD>; accuracy: number }) {
  const needleRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (needleRef.current) {
      const targetAngle = -Math.PI / 3 + (accuracy / 100) * (2 * Math.PI / 3);
      const current = needleRef.current.rotation.z;
      needleRef.current.rotation.z = THREE.MathUtils.lerp(current, targetAngle, delta * 2);
    }
  });

  const segments = lod.level === 'ultra' ? 32 : 16;

  return (
    <group position={[3.5, 0, 0]}>
      {/* Dashboard backing */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#12101E" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Gauge arc */}
      <mesh position={[0, 1.0, 0.06]}>
        <torusGeometry args={[0.4, 0.03, 8, segments, Math.PI * 2 / 3 * 2]} />
        <meshStandardMaterial color="#2A2838" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Needle */}
      <mesh ref={needleRef} position={[0, 1.0, 0.08]}>
        <boxGeometry args={[0.03, 0.35, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
      </mesh>
      {/* Center pivot */}
      <mesh position={[0, 1.0, 0.09]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color={LAB_COLOR} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Accuracy indicator light */}
      <mesh position={[0, 1.6, 0.06]}>
        <boxGeometry args={[0.6, 0.08, 0.02]} />
        <meshStandardMaterial
          color={accuracy > 80 ? '#00FF88' : accuracy > 50 ? '#FFAA44' : '#FF4444'}
          emissive={accuracy > 80 ? '#00FF88' : accuracy > 50 ? '#FFAA44' : '#FF4444'}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// ■■ Confusion Matrix Display Board ■■
function ConfusionMatrix({ lod, accuracy }: { lod: ReturnType<typeof useStandardLOD>; accuracy: number }) {
  const cellCount = lod.level === 'ultra' ? 16 : lod.level === 'high' ? 9 : 4;
  const cellsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const gridSize = Math.ceil(Math.sqrt(cellCount));

  React.useEffect(() => {
    if (!cellsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < cellCount; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = 3 + (col - (gridSize - 1) / 2) * 0.35;
      const y = 1.8 + (row - (gridSize - 1) / 2) * 0.35;
      tmp.makeScale(0.28, 0.28, 0.03);
      tmp.setPosition(x, y, -4);
      cellsRef.current.setMatrixAt(i, tmp);
      const isDiagonal = row === col;
      const intensity = isDiagonal ? Math.min(accuracy / 100, 1) : Math.max(0, 1 - accuracy / 100) * 0.5;
      color.set(isDiagonal ? '#00FF88' : '#FF4444');
      color.multiplyScalar(0.3 + intensity * 0.7);
      cellsRef.current.setColorAt(i, color);
    }
    cellsRef.current.instanceMatrix.needsUpdate = true;
    if (cellsRef.current.instanceColor) cellsRef.current.instanceColor.needsUpdate = true;
  }, [cellCount, gridSize, accuracy]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!cellsRef.current) return;
    const mat = cellsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.5) * 0.1;
  });

  if (!lod.enableDetailProps) return null;

  return (
    <group>
      {/* Board backing */}
      <mesh position={[3, 1.8, -4.02]} castShadow>
        <boxGeometry args={[gridSize * 0.4 + 0.3, gridSize * 0.4 + 0.3, 0.05]} />
        <meshStandardMaterial color="#12101E" metalness={0.5} roughness={0.4} />
      </mesh>
      <instancedMesh ref={cellsRef} args={[undefined, undefined, cellCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} transparent opacity={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Validation Checkpoint Gate ■■
function ValidationGate({ lod, accuracy }: { lod: ReturnType<typeof useStandardLOD>; accuracy: number }) {
  const barrierRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (barrierRef.current) {
      const isOpen = accuracy >= 70;
      const targetY = isOpen ? 2.5 : 0.8;
      barrierRef.current.position.y = THREE.MathUtils.lerp(barrierRef.current.position.y, targetY, delta * 2);
      (barrierRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isOpen ? 0.4 : 0.2 + Math.sin(timeRef.current * 3) * 0.1;
      (barrierRef.current.material as THREE.MeshStandardMaterial).color.set(isOpen ? '#00FF88' : '#FF4444');
      (barrierRef.current.material as THREE.MeshStandardMaterial).emissive.set(isOpen ? '#00FF88' : '#FF4444');
    }
  });

  return (
    <group position={[0, 0, -5]}>
      {/* Gate pillars */}
      <mesh position={[-1.5, 1.2, 0]} castShadow>
        <boxGeometry args={[0.2, 2.4, 0.2]} />
        <meshStandardMaterial color="#1A1828" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[1.5, 1.2, 0]} castShadow>
        <boxGeometry args={[0.2, 2.4, 0.2]} />
        <meshStandardMaterial color="#1A1828" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[3.2, 0.15, 0.2]} />
        <meshStandardMaterial color="#1A1828" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Barrier (raises when accuracy threshold met) */}
      <mesh ref={barrierRef} position={[0, 0.8, 0]}>
        <boxGeometry args={[2.8, 0.08, 0.04]} />
        <meshStandardMaterial
          color="#FF4444"
          emissive="#FF4444"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Checkpoint indicator lights */}
      {lod.enableDetailProps && (
        <>
          <mesh position={[-1.5, 2.2, 0.12]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial
              color={accuracy >= 70 ? '#00FF88' : '#FF4444'}
              emissive={accuracy >= 70 ? '#00FF88' : '#FF4444'}
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[1.5, 2.2, 0.12]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial
              color={accuracy >= 70 ? '#00FF88' : '#FF4444'}
              emissive={accuracy >= 70 ? '#00FF88' : '#FF4444'}
              emissiveIntensity={0.6}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// ■■ Main Environment ■■
interface BuildClassifierEnvironmentProps {
  accuracy?: number;
  itemsSorted?: number;
}

export default function BuildClassifierEnvironment({
  accuracy = 0,
  itemsSorted = 0,
}: BuildClassifierEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0A0E14"
      skyTopColor="#040810"
      skyHorizonColor="#0E1A28"
      fogColor="#06B6D4"
    >
      <ConveyorBelts lod={lod} itemsSorted={itemsSorted} />
      <CategoryBins lod={lod} />
      <DecisionTree lod={lod} accuracy={accuracy} />
      <FeatureScanner lod={lod} itemsSorted={itemsSorted} />
      <TrainingWarehouse lod={lod} />
      <AccuracyDashboard lod={lod} accuracy={accuracy} />
      <ConfusionMatrix lod={lod} accuracy={accuracy} />
      <ValidationGate lod={lod} accuracy={accuracy} />
      {/* Highlight light when accuracy is high */}
      {accuracy > 80 && (
        <pointLight position={[0, 3, 0]} intensity={1.0} color="#00FF88" distance={10} />
      )}
    </StandardEnvironmentWrapper>
  );
}
