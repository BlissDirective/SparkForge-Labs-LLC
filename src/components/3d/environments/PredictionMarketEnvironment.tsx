'use client';

// ════════════════════════════════════════════════════
// PredictionMarketEnvironment — Prediction Trading Floor (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 7: Prediction & Probability | Color: #06B6D4 (Cyan)
//
// A futuristic stock exchange-style prediction trading floor:
//   - Central crystal ball with swirling probability vortex
//   - Ticker display boards (instanced) with scrolling data
//   - Prediction booth stations (instanced) for wager placement
//   - Confidence wager console with gauge meters
//   - Holographic probability chart pillars (instanced)
//   - Betting pool visualizer (glowing liquid cylinder)
//   - Market trend graph walls with neon line traces
//   - Result announcement podium with spotlight
//
// Triangle Budget (Desktop Ultra):
//   Crystal Ball Centerpiece:        ~60K  (sphere + inner vortex rings)
//   Ticker Display Boards (inst):    ~80K  (12 boards x ~6.7K)
//   Prediction Booth Stations (inst):~70K  (8 booths x ~8.75K)
//   Confidence Wager Console:        ~40K  (gauges + panel)
//   Probability Chart Pillars (inst):~65K  (10 pillars x ~6.5K)
//   Betting Pool Visualizer:         ~45K  (cylinder + liquid surface)
//   Market Trend Graph Walls:        ~50K  (wall panels + neon lines)
//   Result Announcement Podium:      ~40K  (platform + spotlight rig)
//   Room Structure (floor/walls):    ~50K
//   Total:                           ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Euler,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  TubeGeometry,
  Vector3,
} from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#06B6D4';

// ■■ Crystal Ball Centerpiece ■■
function CrystalBall({ confidence }: { confidence: number }) {
  const outerRef = useRef<Mesh>(null);
  const innerRing1Ref = useRef<Mesh>(null);
  const innerRing2Ref = useRef<Mesh>(null);
  const innerRing3Ref = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  const segments = 32;

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.15;
    }
    if (innerRing1Ref.current) {
      innerRing1Ref.current.rotation.x = t * 0.8;
      innerRing1Ref.current.rotation.z = t * 0.3;
    }
    if (innerRing2Ref.current) {
      innerRing2Ref.current.rotation.y = t * 1.0;
      innerRing2Ref.current.rotation.x = t * 0.5;
    }
    if (innerRing3Ref.current) {
      innerRing3Ref.current.rotation.z = t * 0.6;
      innerRing3Ref.current.rotation.y = -t * 0.4;
    }
    if (glowRef.current) {
      const intensity = 0.3 + confidence * 0.5 + Math.sin(t * 2.0) * 0.15;
      (glowRef.current.material as MeshStandardMaterial).emissiveIntensity = intensity;
      glowRef.current.scale.setScalar(1.15 + Math.sin(t * 1.5) * 0.05);
    }
  });

  return (
    <group position={[0, 1.8, 0]}>
      {/* Outer glass sphere */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[0.9, segments, segments]} />
        <meshStandardMaterial
          color="#1A3040"
          transparent
          opacity={0.25}
          metalness={0.8}
          roughness={0.1}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.95, segments / 2, segments / 2]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
      {/* Inner vortex rings */}
      <mesh ref={innerRing1Ref}>
        <torusGeometry args={[0.5, 0.03, 8, segments]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={innerRing2Ref}>
        <torusGeometry args={[0.35, 0.025, 8, segments]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.5} />
      </mesh>
      {(
        <mesh ref={innerRing3Ref}>
          <torusGeometry args={[0.6, 0.02, 6, segments]} />
          <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.4} />
        </mesh>
      )}
      {/* Pedestal base */}
      <mesh position={[0, -1.1, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.55, 0.6, segments]} />
        <meshStandardMaterial color="#1A2030" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.15, 0.4, 0.5, segments]} />
        <meshStandardMaterial color="#1A2535" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Ticker Display Boards (Instanced) ■■
function TickerBoards() {
  const count = 12;
  const boardsRef = useRef<InstancedMesh>(null);
  const screensRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!boardsRef.current || !screensRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 5.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rot = new Quaternion();
      rot.setFromEuler(new Euler(0, -angle + Math.PI, 0));
      // Board frame
      tmp.compose(
        new Vector3(x, 3.2, z),
        rot,
        new Vector3(1.4, 0.7, 0.1),
      );
      boardsRef.current.setMatrixAt(i, tmp);
      // Screen surface
      tmp.compose(
        new Vector3(x, 3.2, z),
        rot,
        new Vector3(1.3, 0.6, 0.02),
      );
      screensRef.current.setMatrixAt(i, tmp);
    }
    boardsRef.current.instanceMatrix.needsUpdate = true;
    screensRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const mat = screensRef.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(timeRef.current * 3) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={boardsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0E1820" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Prediction Booth Stations (Instanced) ■■
function PredictionBooths({ predictions }: { predictions: number }) {
  const count = 8;
  const boothsRef = useRef<InstancedMesh>(null);
  const consolesRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!boothsRef.current || !consolesRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.PI / count;
      const radius = 3.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Booth desk
      tmp.makeScale(0.8, 0.05, 0.5);
      tmp.setPosition(x, 0.85, z);
      boothsRef.current.setMatrixAt(i, tmp);
      // Console screen
      const rot = new Quaternion();
      rot.setFromEuler(new Euler(-0.3, -angle + Math.PI, 0));
      tmp.compose(
        new Vector3(x, 1.15, z),
        rot,
        new Vector3(0.5, 0.35, 0.03),
      );
      consolesRef.current.setMatrixAt(i, tmp);
    }
    boothsRef.current.instanceMatrix.needsUpdate = true;
    consolesRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!consolesRef.current) return;
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const active = i < Math.min(predictions, count);
      color.set(active ? '#00FF88' : LAB_COLOR);
      consolesRef.current.setColorAt(i, color);
    }
    if (consolesRef.current.instanceColor) consolesRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={boothsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#141E28" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={consolesRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.35}
          transparent
          opacity={0.6}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Probability Chart Pillars (Instanced) ■■
function ProbabilityPillars({ confidence }: { confidence: number }) {
  const count = 10;
  const pillarsRef = useRef<InstancedMesh>(null);
  const capsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!pillarsRef.current || !capsRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 1.1;
      const baseH = 0.3 + (Math.sin(i * 0.9 + timeRef.current * 0.5) * 0.5 + 0.5) * 1.8;
      const h = baseH * (0.5 + confidence * 0.5);
      // Bar
      tmp.makeScale(0.35, h, 0.35);
      tmp.setPosition(x, h / 2 - 0.5, -5.0);
      pillarsRef.current.setMatrixAt(i, tmp);
      const hue = 0.5 + (i / count) * 0.15;
      color.setHSL(hue, 0.7, 0.5);
      pillarsRef.current.setColorAt(i, color);
      // Top cap
      tmp.makeScale(0.4, 0.06, 0.4);
      tmp.setPosition(x, h - 0.5, -5.0);
      capsRef.current.setMatrixAt(i, tmp);
      capsRef.current.setColorAt(i, color);
    }
    pillarsRef.current.instanceMatrix.needsUpdate = true;
    capsRef.current.instanceMatrix.needsUpdate = true;
    if (pillarsRef.current.instanceColor) pillarsRef.current.instanceColor.needsUpdate = true;
    if (capsRef.current.instanceColor) capsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={pillarsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          emissive={LAB_COLOR}
          emissiveIntensity={0.25}
          transparent
          opacity={0.75}
          metalness={0.4}
          roughness={0.3}
        />
      </instancedMesh>
      <instancedMesh ref={capsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          emissive="#FFFFFF"
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.2}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Betting Pool Visualizer ■■
function BettingPool({ predictions }: { predictions: number }) {
  const liquidRef = useRef<Mesh>(null);
  const containerRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  const segments = 32;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (liquidRef.current) {
      const fillLevel = Math.min(predictions / 10, 1.0);
      liquidRef.current.scale.y = 0.1 + fillLevel * 0.9;
      (liquidRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 2) * 0.15;
    }
  });

  return (
    <group position={[4.0, 0, 2.5]}>
      {/* Glass container */}
      <mesh ref={containerRef}>
        <cylinderGeometry args={[0.6, 0.6, 2.0, segments, 1, true]} />
        <meshStandardMaterial
          color="#1A2838"
          transparent
          opacity={0.2}
          metalness={0.8}
          roughness={0.1}
          side={DoubleSide}
        />
      </mesh>
      {/* Liquid fill */}
      <mesh ref={liquidRef} position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 1.8, segments]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.45}
        />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, -1.05, 0]}>
        <torusGeometry args={[0.65, 0.08, 8, segments]} />
        <meshStandardMaterial color="#1E2A38" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 1.05, 0]}>
        <torusGeometry args={[0.65, 0.06, 8, segments]} />
        <meshStandardMaterial color="#1E2A38" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Market Trend Graph Walls ■■
function TrendGraphWalls() {
  const lineRefs = useRef<Mesh[]>([]);
  const timeRef = useRef(0);

  const lineCount = 5;

  const lineGeometries = useMemo(() => {
    const geos: BufferGeometry[] = [];
    for (let l = 0; l < lineCount; l++) {
      const points: Vector3[] = [];
      const segments = 40;
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * 8 - 4;
        const y = Math.sin(i * 0.3 + l * 2.0) * 0.6 + l * 0.5 + 1.5;
        points.push(new Vector3(x, y, 0));
      }
      const curve = new CatmullRomCurve3(points);
      const tube = new TubeGeometry(curve, segments, 0.025, 6, false);
      geos.push(tube);
    }
    return geos;
  }, [lineCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    lineRefs.current.forEach((mesh, i) => {
      if (mesh) {
        (mesh.material as MeshStandardMaterial).emissiveIntensity =
          0.4 + Math.sin(timeRef.current * 1.5 + i * 1.2) * 0.2;
      }
    });
  });

  const colors = ['#06B6D4', '#00FF88', '#FFAA44', '#FF6644', '#AA66FF'];

  return (
    <group position={[0, 0, -6.5]} rotation={[0, 0, 0]}>
      {/* Wall backdrop */}
      <mesh position={[0, 2, -0.1]}>
        <boxGeometry args={[9, 3.5, 0.08]} />
        <meshStandardMaterial color="#0C141C" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Grid lines */}
      {(
        <group position={[0, 2, 0.01]}>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={`hgrid-${i}`} position={[0, (i - 2) * 0.6, 0]}>
              <boxGeometry args={[8.5, 0.005, 0.005]} />
              <meshBasicMaterial color="#1A2535" transparent opacity={0.4} />
            </mesh>
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <mesh key={`vgrid-${i}`} position={[(i - 4) * 1.0, 0, 0]}>
              <boxGeometry args={[0.005, 3.0, 0.005]} />
              <meshBasicMaterial color="#1A2535" transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      )}
      {/* Trend lines */}
      {lineGeometries.map((geo, i) => (
        <mesh
          key={`trend-${i}`}
          ref={(el) => { if (el) lineRefs.current[i] = el; }}
          geometry={geo}
          position={[0, 0, 0.05]}
        >
          <meshStandardMaterial
            color={colors[i % colors.length]}
            emissive={colors[i % colors.length]}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Result Announcement Podium ■■
function AnnouncementPodium() {
  const spotlightRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  const segments = 24;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (spotlightRef.current) {
      (spotlightRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 1.8) * 0.15;
    }
  });

  return (
    <group position={[-4.0, 0, 2.5]}>
      {/* Podium base */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1.0, 0.4, segments]} />
        <meshStandardMaterial color="#14202C" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Podium column */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.9, segments]} />
        <meshStandardMaterial color="#162430" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Top platform */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.65, 0.55, 0.1, segments]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.2}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      {/* Spotlight cone */}
      <mesh ref={spotlightRef} position={[0, 3.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.8, 2.5, segments, 1, true]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.08}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Spotlight fixture */}
      {(
        <mesh position={[0, 4.2, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.2, 8]} />
          <meshStandardMaterial color="#2A3540" metalness={0.7} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Trading Floor Structure ■■
function TradingFloorStructure() {
  return (
    <group>
      {/* Raised floor platform */}
      <mesh position={[0, -0.95, 0]} receiveShadow>
        <cylinderGeometry args={[7.5, 8.0, 0.1, 48]} />
        <meshStandardMaterial color="#0C161E" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Floor ring accent */}
      <mesh position={[0, -0.89, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.5, 0.03, 4, 48]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </mesh>
      {/* Inner ring */}
      <mesh position={[0, -0.88, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.0, 0.02, 4, 32]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.2} />
      </mesh>
      {/* Ceiling support beams */}
      {(
        <>
          {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
            <mesh
              key={`beam-${i}`}
              position={[Math.cos(angle) * 5, 4.0, Math.sin(angle) * 5]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <boxGeometry args={[0.08, 10, 0.08]} />
              <meshStandardMaterial color="#1A2530" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

// ■■ Main Environment ■■
interface PredictionMarketEnvironmentProps {
  predictions?: number;
  confidence?: number;
}

export default function PredictionMarketEnvironment({
  predictions = 0,
  confidence = 0.5,
}: PredictionMarketEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#080E18"
      skyTopColor="#040A14"
      skyHorizonColor="#0A1828"
      fogColor="#06B6D4"
    >
      <TradingFloorStructure />
      <CrystalBall confidence={confidence} />
      <TickerBoards />
      <PredictionBooths predictions={predictions} />
      <ProbabilityPillars confidence={confidence} />
      <BettingPool predictions={predictions} />
      <TrendGraphWalls />
      <AnnouncementPodium />
      {/* Active prediction spotlight */}
      {predictions > 0 && (
        <pointLight position={[0, 3, 0]} intensity={0.8} color={LAB_COLOR} distance={8} />
      )}
    </StandardEnvironmentWrapper>
  );
}
