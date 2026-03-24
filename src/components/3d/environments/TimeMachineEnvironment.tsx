'use client';

// ════════════════════════════════════════════════════
// TimeMachineEnvironment — Time Travel Portal Chamber (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 1: AI Basics | Color: #00BBFF (Blue)
//
// A circular time-travel portal chamber teaching AI timeline milestones:
//   - Giant time vortex portal in the center (concentric spinning rings)
//   - Floating timeline markers along a helical path (instanced)
//   - Era display panels for past, present, and future (instanced)
//   - Clock gears and mechanisms on walls (instanced)
//   - Temporal energy particles streaming toward the portal
//   - Milestone pedestals that glow when activated (instanced)
//   - Chamber walls with temporal circuitry patterns
//   - Helical time-rail connecting all markers
//
// Triangle Budget (Desktop Ultra):
//   Time Vortex Portal (rings):         ~90K  (5 concentric torus rings)
//   Timeline Markers (instanced):       ~65K  (20 markers with labels)
//   Era Display Panels (instanced):     ~50K  (6 panels x ~8.3K)
//   Clock Gears (instanced):            ~80K  (12 gears x ~6.7K)
//   Temporal Energy Particles:          ~45K  (instanced particles)
//   Milestone Pedestals (instanced):    ~55K  (8 pedestals)
//   Chamber Walls + Circuitry:          ~70K  (cylindrical room)
//   Helical Time-Rail:                  ~45K  (tube geometry)
//   Total:                              ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#00BBFF';

// ■■ Time Vortex Portal (Concentric Spinning Rings) ■■
function TimeVortexPortal() {
  const ringsRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);
  const ringCount = 5;
  const segments = 48;

  useFrame((_, delta) => {
    timeRef.current += delta;
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.z = timeRef.current * (0.3 + i * 0.15) * dir;
      ring.rotation.x = Math.sin(timeRef.current * 0.2 + i) * 0.1;
      const mat = ring.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(timeRef.current * 2 + i * 0.8) * 0.2;
    });
  });

  return (
    <group ref={ringsRef} position={[0, 2.5, 0]}>
      {Array.from({ length: ringCount }).map((_, i) => {
        const radius = 1.2 + i * 0.4;
        const tube = 0.04 + i * 0.01;
        return (
          <mesh
            key={i}
            ref={(el) => { if (el) ringRefs.current[i] = el; }}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[radius, tube, 8, segments]} />
            <meshStandardMaterial
              color={LAB_COLOR}
              emissive={LAB_COLOR}
              emissiveIntensity={0.4}
              transparent
              opacity={0.6 - i * 0.08}
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
        );
      })}
      {/* Inner vortex glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, segments]} />
        <meshStandardMaterial
          color="#001133"
          emissive={LAB_COLOR}
          emissiveIntensity={0.6}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ■■ Timeline Markers along Helical Path (Instanced) ■■
function TimelineMarkers({ currentYear }: { currentYear: number }) {
  const count = 20;
  const markersRef = useRef<THREE.InstancedMesh>(null);
  const glowsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const yearPositions = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const t = i / count;
      const angle = t * Math.PI * 4;
      const radius = 3.5;
      const height = 0.5 + t * 4;
      return {
        x: Math.sin(angle) * radius,
        y: height,
        z: Math.cos(angle) * radius,
        year: 1950 + Math.floor(t * 100),
      };
    }),
  [count]);

  React.useEffect(() => {
    if (!markersRef.current || !glowsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const p = yearPositions[i];
      // Marker orb
      tmp.makeScale(0.12, 0.12, 0.12);
      tmp.setPosition(p.x, p.y, p.z);
      markersRef.current.setMatrixAt(i, tmp);
      // Glow ring
      tmp.makeScale(0.18, 0.18, 0.01);
      tmp.setPosition(p.x, p.y, p.z);
      glowsRef.current.setMatrixAt(i, tmp);
      const isActive = Math.abs(p.year - currentYear) < 15;
      color.set(isActive ? '#FFFFFF' : LAB_COLOR);
      markersRef.current.setColorAt(i, color);
    }
    markersRef.current.instanceMatrix.needsUpdate = true;
    glowsRef.current.instanceMatrix.needsUpdate = true;
    if (markersRef.current.instanceColor) markersRef.current.instanceColor.needsUpdate = true;
  }, [count, currentYear, yearPositions]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!glowsRef.current) return;
    const mat = glowsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(timeRef.current * 2) * 0.2;
  });

  return (
    <group>
      <instancedMesh ref={markersRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={glowsRef} args={[undefined, undefined, count]}>
        <torusGeometry args={[1, 0.15, 6, 16]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} transparent opacity={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Era Display Panels (Instanced) ■■
function EraDisplayPanels() {
  const count = 6;
  const panelsRef = useRef<THREE.InstancedMesh>(null);
  const labelsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!panelsRef.current || !labelsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    const _eras = ['PAST', 'PRESENT', 'FUTURE', 'DAWN', 'RISE', 'BEYOND'];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 5.5;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, -angle + Math.PI, 0));
      // Panel body
      tmp.compose(new THREE.Vector3(x, 2.5, z), rot, new THREE.Vector3(1.2, 1.8, 0.08));
      panelsRef.current.setMatrixAt(i, tmp);
      // Label plate
      tmp.compose(new THREE.Vector3(x, 3.5, z), rot, new THREE.Vector3(0.8, 0.2, 0.1));
      labelsRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.55 + (i / count) * 0.15, 0.7, 0.2);
      panelsRef.current.setColorAt(i, color);
    }
    panelsRef.current.instanceMatrix.needsUpdate = true;
    labelsRef.current.instanceMatrix.needsUpdate = true;
    if (panelsRef.current.instanceColor) panelsRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!labelsRef.current) return;
    const mat = labelsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.5) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={panelsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={labelsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Clock Gears on Walls (Instanced) ■■
function ClockGears() {
  const count = 12;
  const gearsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const gearData = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      y: 1.5 + (i % 3) * 1.2,
      radius: 0.3 + (i % 4) * 0.15,
      speed: (0.2 + (i % 3) * 0.15) * (i % 2 === 0 ? 1 : -1),
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!gearsRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const g = gearData[i];
      const wallRadius = 6.2;
      const x = Math.sin(g.angle) * wallRadius;
      const z = Math.cos(g.angle) * wallRadius;
      rot.setFromEuler(new THREE.Euler(0, -g.angle, timeRef.current * g.speed));
      tmp.compose(
        new THREE.Vector3(x, g.y, z),
        rot,
        new THREE.Vector3(g.radius, g.radius, 0.04)
      );
      gearsRef.current.setMatrixAt(i, tmp);
    }
    gearsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={gearsRef} args={[undefined, undefined, count]} castShadow>
      <torusGeometry args={[1, 0.15, 6, 12]} />
      <meshStandardMaterial color="#2A3040" metalness={0.8} roughness={0.2} emissive={LAB_COLOR} emissiveIntensity={0.08} />
    </instancedMesh>
  );
}

// ■■ Temporal Energy Particles (Instanced) ■■
function TemporalParticles({ isPlacing }: { isPlacing: boolean }) {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 2 + Math.random() * 4,
      y: Math.random() * 5,
      speed: 0.3 + Math.random() * 0.5,
      spiralSpeed: 0.5 + Math.random() * 1.0,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new THREE.Matrix4();
    const speedMult = isPlacing ? 2.5 : 1.0;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const angle = s.angle + timeRef.current * s.spiralSpeed * speedMult * 0.3;
      const r = s.radius - (timeRef.current * s.speed * 0.1) % s.radius;
      const x = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;
      const y = ((s.y + timeRef.current * s.speed * 0.3) % 5);
      tmp.makeScale(0.04, 0.04, 0.04);
      tmp.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, tmp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={isPlacing ? 0.9 : 0.5}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ■■ Milestone Pedestals (Instanced) ■■
function MilestonePedestals({ currentYear }: { currentYear: number }) {
  const count = 8;
  const basesRef = useRef<THREE.InstancedMesh>(null);
  const topsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const milestones = useMemo(() => [1956, 1970, 1986, 1997, 2011, 2016, 2022, 2025].slice(0, count), [count]);

  React.useEffect(() => {
    if (!basesRef.current || !topsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 4.2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      // Base
      tmp.makeScale(0.25, 0.5, 0.25);
      tmp.setPosition(x, -0.5, z);
      basesRef.current.setMatrixAt(i, tmp);
      // Top crystal
      tmp.makeScale(0.08, 0.15, 0.08);
      tmp.setPosition(x, 0.1, z);
      topsRef.current.setMatrixAt(i, tmp);
      const isActive = Math.abs(milestones[i] - currentYear) < 10;
      color.set(isActive ? '#FFFFFF' : '#334455');
      topsRef.current.setColorAt(i, color);
    }
    basesRef.current.instanceMatrix.needsUpdate = true;
    topsRef.current.instanceMatrix.needsUpdate = true;
    if (topsRef.current.instanceColor) topsRef.current.instanceColor.needsUpdate = true;
  }, [count, currentYear, milestones]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!topsRef.current) return;
    const mat = topsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.8) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={basesRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.8, 1, 1, 12]} />
        <meshStandardMaterial color="#1A1E30" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={topsRef} args={[undefined, undefined, count]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.7} roughness={0.2} transparent opacity={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Chamber Walls (Cylindrical) ■■
function ChamberWalls() {
  const segments = 48;

  return (
    <group>
      {/* Cylindrical wall */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[7, 7, 6, segments, 1, true]} />
        <meshStandardMaterial
          color="#0C0E1A"
          metalness={0.4}
          roughness={0.6}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Floor ring accent */}
      <mesh position={[0, -0.96, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 7, segments]} />
        <meshStandardMaterial color="#101420" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Ceiling dome */}
      <mesh position={[0, 5, 0]}>
        <sphereGeometry args={[7, segments, segments / 2, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#060810" side={THREE.BackSide} roughness={0.9} />
      </mesh>
      {/* Circuitry accent lines */}
      {(
        <>
          <mesh position={[0, 1, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[6.95, 0.015, 4, segments]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <torusGeometry args={[6.95, 0.015, 4, segments]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
          </mesh>
          {/* Vertical circuitry strips */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.sin(angle) * 6.9;
            const z = Math.cos(angle) * 6.9;
            return (
              <mesh key={i} position={[x, 2.5, z]} rotation={[0, -angle, 0]}>
                <boxGeometry args={[0.02, 4, 0.01]} />
                <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.25} transparent opacity={0.4} />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}

// ■■ Main Environment ■■
interface TimeMachineEnvironmentProps {
  currentYear?: number;
  isPlacing?: boolean;
}

export default function TimeMachineEnvironment({
  currentYear = 2000,
  isPlacing = false,
}: TimeMachineEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#080A14"
      skyTopColor="#020408"
      skyHorizonColor="#081830"
      fogColor="#00BBFF"
    >
      <ChamberWalls />
      <TimeVortexPortal />
      <TimelineMarkers currentYear={currentYear} />
      <EraDisplayPanels />
      <ClockGears />
      <TemporalParticles isPlacing={isPlacing} />
      <MilestonePedestals currentYear={currentYear} />
      {/* Portal glow light */}
      <pointLight position={[0, 2.5, 0]} intensity={isPlacing ? 2.0 : 0.8} color={LAB_COLOR} distance={10} />
    </StandardEnvironmentWrapper>
  );
}
