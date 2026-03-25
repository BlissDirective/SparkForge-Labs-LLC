'use client';

// ════════════════════════════════════════════════════
// DataDetectiveEnvironment — Investigation Laboratory (FL-Lite 1.3M budget)
// ════════════════════════════════════════════════════
// Lab 2: AI Assistants | Color: #AA66FF (Purple)
//
// CSI-style data analysis lab with investigation desks,
// evidence pinboards, magnifying glass hologram, filing cabinets,
// holographic data screens, forensic microscopes, data streams,
// and neon evidence tape barriers.
//
// Triangle Budget (Desktop Ultra):
//   Investigation Desks:       ~250K (12 desks with monitors)
//   Evidence Pinboards:        ~120K (wall-mounted boards + lines)
//   Magnifying Glass Hologram: ~150K (rotating centerpiece)
//   Filing Cabinets:           ~200K (40 instanced cabinets)
//   Holographic Screens:       ~180K (floating data visualizations)
//   Forensic Microscopes:      ~100K (desk-mounted instruments)
//   Data Stream Particles:     ~150K (floor-level flowing data)
//   Evidence Tape Barriers:    ~80K  (neon tape strips)
//   Base Environment:          ~70K  (terrain + sky + fog)
//   Total:                     ~1.3M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { FLLiteEnvironmentWrapper } from './FLLiteEnvironmentBase';

// ■■ Investigation Desks with Monitors ■■
function InvestigationDesks() {
  const deskCount = 12;
  const desksRef = useRef<InstancedMesh>(null);
  const monitorsRef = useRef<InstancedMesh>(null);
  const screenGlowRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!desksRef.current || !monitorsRef.current || !screenGlowRef.current) return;
    const dTemp = new Matrix4();
    const mTemp = new Matrix4();
    const gTemp = new Matrix4();
    for (let i = 0; i < deskCount; i++) {
      const angle = (i / deskCount) * Math.PI * 2;
      const radius = 5 + (i % 2) * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      dTemp.makeTranslation(x, -0.3, z);
      desksRef.current.setMatrixAt(i, dTemp);
      mTemp.makeRotationY(-angle + Math.PI);
      mTemp.setPosition(x, 0.5, z);
      monitorsRef.current.setMatrixAt(i, mTemp);
      gTemp.makeRotationY(-angle + Math.PI);
      gTemp.setPosition(x, 0.5, z - 0.01);
      screenGlowRef.current.setMatrixAt(i, gTemp);
    }
    desksRef.current.instanceMatrix.needsUpdate = true;
    monitorsRef.current.instanceMatrix.needsUpdate = true;
    screenGlowRef.current.instanceMatrix.needsUpdate = true;
  }, [deskCount]);

  useFrame(({ clock }) => {
    if (!screenGlowRef.current) return;
    const mat = screenGlowRef.current.material as MeshBasicMaterial;
    mat.opacity = 0.3 + Math.sin(clock.elapsedTime * 2) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={desksRef} args={[undefined, undefined, deskCount]} castShadow>
        <boxGeometry args={[1.8, 0.08, 0.9]} />
        <meshStandardMaterial color="#1A1822" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={monitorsRef} args={[undefined, undefined, deskCount]} castShadow>
        <boxGeometry args={[0.9, 0.6, 0.04]} />
        <meshStandardMaterial color="#111118" metalness={0.7} roughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={screenGlowRef} args={[undefined, undefined, deskCount]}>
        <planeGeometry args={[0.85, 0.55]} />
        <meshBasicMaterial color="#AA66FF" transparent opacity={0.35} side={DoubleSide} />
      </instancedMesh>
    </group>
  );
}

// ■■ Evidence Pinboards with Connection Lines ■■
function EvidencePinboards() {
  const boardCount = 6;
  const lineRef = useRef<Group>(null);

  const lineGeometry = useMemo(() => {
    const points: Vector3[] = [];
    for (let i = 0; i < 20; i++) {
      points.push(
        new Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.0, 0.02),
        new Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.0, 0.02)
      );
    }
    return new BufferGeometry().setFromPoints(points);
  }, []);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    lineRef.current.children.forEach((child, i) => {
      if (child instanceof LineSegments) {
        (child.material as LineBasicMaterial).opacity =
          0.4 + Math.sin(clock.elapsedTime * 1.5 + i) * 0.3;
      }
    });
  });

  return (
    <group ref={lineRef}>
      {Array.from({ length: boardCount }).map((_, i) => {
        const angle = (i / boardCount) * Math.PI * 0.6 - Math.PI * 0.3;
        const x = Math.sin(angle) * 12;
        const z = Math.cos(angle) * 12;
        return (
          <group key={i} position={[x, 2.5, z]} rotation={[0, -angle, 0]}>
            <mesh castShadow>
              <boxGeometry args={[2, 1.5, 0.06]} />
              <meshStandardMaterial color="#2A1F32" roughness={0.9} />
            </mesh>
            <lineSegments geometry={lineGeometry}>
              <lineBasicMaterial color="#AA66FF" transparent opacity={0.5} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}

// ■■ Magnifying Glass Hologram ■■
function MagnifyingGlassHologram({ isAnalyzing }: { isAnalyzing: boolean }) {
  const groupRef = useRef<Group>(null);
  const lensRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = isAnalyzing ? 3 : 0.5;
    groupRef.current.rotation.y = clock.elapsedTime * speed;
    groupRef.current.position.y = 2.5 + Math.sin(clock.elapsedTime * 0.8) * 0.3;
    if (lensRef.current) {
      const mat = lensRef.current.material as MeshBasicMaterial;
      mat.opacity = isAnalyzing ? 0.5 + Math.sin(clock.elapsedTime * 4) * 0.2 : 0.25;
    }
  });

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      <mesh>
        <torusGeometry args={[1.2, 0.08, 16, 48]} />
        <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={lensRef}>
        <circleGeometry args={[1.15, 48]} />
        <meshBasicMaterial color="#CC88FF" transparent opacity={0.25} side={DoubleSide} />
      </mesh>
      <mesh position={[0, -1.6, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.06, 0.08, 1.4, 12]} />
        <meshStandardMaterial color="#666688" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Scan rings */}
      {[0.4, 0.7, 1.0].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.01, r + 0.01, 32]} />
          <meshBasicMaterial color="#DD99FF" transparent opacity={0.15} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Filing Cabinets ■■
function FilingCabinets() {
  const cabinetCount = 40;
  const ref = useRef<InstancedMesh>(null);
  const handleRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!ref.current || !handleRef.current) return;
    const temp = new Matrix4();
    const hTemp = new Matrix4();
    for (let i = 0; i < cabinetCount; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const x = -10 + row * 0.65;
      const z = (col - 5) * 1.1;
      temp.makeTranslation(x, 0.0, z);
      ref.current.setMatrixAt(i, temp);
      hTemp.makeScale(0.15, 0.03, 0.03);
      hTemp.setPosition(x + 0.35, 0.2 + (i % 4) * 0.25, z);
      handleRef.current.setMatrixAt(i, hTemp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    handleRef.current.instanceMatrix.needsUpdate = true;
  }, [cabinetCount]);

  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, cabinetCount]} castShadow>
        <boxGeometry args={[0.5, 1.2, 0.8]} />
        <meshStandardMaterial color="#1E1A28" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={handleRef} args={[undefined, undefined, cabinetCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#888899" metalness={0.8} roughness={0.2} />
      </instancedMesh>
    </group>
  );
}

// ■■ Holographic Data Screens ■■
function HolographicScreens({ selectedRow }: { selectedRow: number | null }) {
  const screenCount = 8;
  const ref = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new Matrix4();
    for (let i = 0; i < screenCount; i++) {
      const angle = (i / screenCount) * Math.PI * 2;
      const r = 3.5;
      temp.makeRotationY(-angle);
      temp.setPosition(Math.cos(angle) * r, 3.5 + (i % 3) * 0.6, Math.sin(angle) * r);
      ref.current.setMatrixAt(i, temp);
      ref.current.setColorAt(i, new Color(selectedRow === i ? '#FF66AA' : '#AA66FF'));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [screenCount, selectedRow]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const temp = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    for (let i = 0; i < screenCount; i++) {
      ref.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      pos.y += Math.sin(clock.elapsedTime + i * 0.7) * 0.002;
      temp.compose(pos, quat, scl);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, screenCount]}>
      <planeGeometry args={[1.4, 0.9]} />
      <meshBasicMaterial color="#AA66FF" transparent opacity={0.2} side={DoubleSide} />
    </instancedMesh>
  );
}

// ■■ Data Stream Particles ■■
function DataStreamParticles() {
  const count = 300;
  const ref = useRef<InstancedMesh>(null);

  const speeds = useMemo(() => Array.from({ length: count }, () => 0.5 + Math.random() * 1.5), [count]);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 18;
      temp.makeScale(0.03, 0.03, 0.12);
      temp.setPosition(x, -0.8 + Math.random() * 0.3, z);
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
      pos.x += speeds[i] * delta;
      if (pos.x > 9) pos.x = -9;
      temp.compose(pos, quat, scl);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#CC88FF" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ■■ Evidence Tape Barriers ■■
function EvidenceTape() {
  const tapeCount = 6;
  return (
    <group>
      {Array.from({ length: tapeCount }).map((_, i) => {
        const angle = (i / tapeCount) * Math.PI * 2;
        const r = 8;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0.4, Math.sin(angle) * r]} rotation={[0, angle, 0]}>
            <boxGeometry args={[3, 0.06, 0.01]} />
            <meshBasicMaterial color="#FFAA44" transparent opacity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

// ■■ Main Environment ■■
interface DataDetectiveEnvironmentProps {
  selectedRow: number | null;
  isAnalyzing: boolean;
}

export default function DataDetectiveEnvironment({ selectedRow, isAnalyzing }: DataDetectiveEnvironmentProps) {

  return (
    <FLLiteEnvironmentWrapper
      labColor="#AA66FF"
      terrainColor="#0E0A18"
      skyTopColor="#08041A"
      skyHorizonColor="#1A0E30"
      fogColor="#AA66FF"
    >
      <InvestigationDesks />
      <EvidencePinboards />
      <MagnifyingGlassHologram isAnalyzing={isAnalyzing} />
      <FilingCabinets />
      <HolographicScreens selectedRow={selectedRow} />
      {<DataStreamParticles />}
      <EvidenceTape />
    </FLLiteEnvironmentWrapper>
  );
}
