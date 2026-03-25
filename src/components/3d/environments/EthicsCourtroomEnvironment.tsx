'use client';

// ════════════════════════════════════════════════════
// EthicsCourtroomEnvironment — AI Ethics Courtroom (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 6: AI Safety | Color: #FF6644 (Orange/Red)
//
// A grand courtroom where players deliberate on AI ethics cases,
// weighing arguments and delivering verdicts:
//   - Judge's elevated bench with gavel pedestal
//   - Witness stand with holographic display
//   - Jury box with 12 seats (instanced)
//   - Animated scales of justice (tilting balance)
//   - Argument podium with microphone
//   - Evidence presentation screen (glowing panel)
//   - Stained glass depicting ethical principles (instanced)
//   - Gallery seating (instanced rows)
//
// Triangle Budget (Desktop Ultra):
//   Judge's Bench:                ~60K  (bench + chair + platform)
//   Witness Stand:                ~40K  (stand + holographic display)
//   Jury Box (instanced):        ~70K  (12 seats x ~5.8K)
//   Scales of Justice:           ~60K  (beam + 2 pans + chain + pillar)
//   Argument Podium:             ~30K  (podium + mic + light)
//   Evidence Screen:             ~30K  (screen + frame + stand)
//   Stained Glass (instanced):   ~80K  (6 windows x ~13.3K)
//   Gallery Seating (instanced): ~70K  (16 seats x ~4.4K)
//   Courtroom Walls + Floor:     ~60K
//   Total:                       ~500K

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#FF6644';

// ■■ Judge's Bench ■■
function JudgeBench() {
  return (
    <group position={[0, 0, -4]}>
      {/* Elevated platform */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[4, 0.6, 2]} />
        <meshStandardMaterial color="#1A1218" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Bench surface */}
      <mesh position={[0, 0.85, 0.3]} castShadow>
        <boxGeometry args={[3.5, 0.1, 1.0]} />
        <meshStandardMaterial color="#2A1E20" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Bench front panel */}
      <mesh position={[0, 0.65, 0.8]} castShadow>
        <boxGeometry args={[3.5, 0.4, 0.06]} />
        <meshStandardMaterial color="#1E1418" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Judge's chair back */}
      <mesh position={[0, 1.3, -0.3]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#2A1A1A" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Nameplate */}
      {(
        <mesh position={[0, 0.92, 0.81]}>
          <boxGeometry args={[0.6, 0.1, 0.02]} />
          <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Gavel Pedestal ■■
function GavelPedestal({ verdictReached }: { verdictReached: boolean }) {
  const gavelRef = useRef<Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (gavelRef.current && verdictReached) {
      const smashPhase = Math.max(0, Math.sin(timeRef.current * 4));
      gavelRef.current.rotation.z = -0.3 * smashPhase;
    }
  });

  return (
    <group position={[1.2, 0.92, -3.5]}>
      {/* Gavel block (sound block) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 8]} />
        <meshStandardMaterial color="#2A2020" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Gavel */}
      <group ref={gavelRef} position={[0, 0.15, 0]}>
        {/* Handle */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.015, 0.015, 0.25, 6]} />
          <meshStandardMaterial color="#8B6914" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Head */}
        <mesh position={[0.09, 0.09, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
          <meshStandardMaterial color="#5A3D10" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Witness Stand with Holographic Display ■■
function WitnessStand({ caseIndex: _caseIndex }: { caseIndex: number }) {
  const holoRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (holoRef.current) {
      holoRef.current.position.y = 1.5 + Math.sin(timeRef.current * 0.8) * 0.05;
      (holoRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 2) * 0.15;
    }
  });

  return (
    <group position={[-2.5, 0, -1.5]}>
      {/* Stand body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 0.8]} />
        <meshStandardMaterial color="#1A1420" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Railing */}
      <mesh position={[0, 0.85, 0.35]}>
        <boxGeometry args={[1.1, 0.06, 0.04]} />
        <meshStandardMaterial color="#2A2030" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Holographic evidence display */}
      <mesh ref={holoRef} position={[0, 1.5, 0]}>
        <boxGeometry args={[0.7, 0.5, 0.02]} />
        <meshStandardMaterial
          color="#00BBFF"
          emissive="#00BBFF"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ■■ Jury Box with 12 Seats (Instanced) ■■
function JuryBox() {
  const count = 12;
  const seatsRef = useRef<InstancedMesh>(null);
  const backsRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!seatsRef.current || !backsRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / (count / 2));
      const col = i % Math.ceil(count / 2);
      const x = 3 + col * 0.7;
      const z = -2 + row * 0.8;
      const yBase = row * 0.25;
      // Seat
      tmp.makeScale(0.45, 0.08, 0.45);
      tmp.setPosition(x, 0.35 + yBase, z);
      seatsRef.current.setMatrixAt(i, tmp);
      // Seat back
      tmp.makeScale(0.45, 0.4, 0.06);
      tmp.setPosition(x, 0.6 + yBase, z - 0.2);
      backsRef.current.setMatrixAt(i, tmp);
    }
    seatsRef.current.instanceMatrix.needsUpdate = true;
    backsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      {/* Jury platform */}
      <mesh position={[4.2, 0.12, -1.5]} castShadow>
        <boxGeometry args={[3.5, 0.24, 2.5]} />
        <meshStandardMaterial color="#1A1218" metalness={0.5} roughness={0.4} />
      </mesh>
      <instancedMesh ref={seatsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2A1E22" metalness={0.4} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={backsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#221A1E" metalness={0.4} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// ■■ Scales of Justice (Animated) ■■
function ScalesOfJustice({ verdictReached }: { verdictReached: boolean }) {
  const beamRef = useRef<Mesh>(null);
  const leftPanRef = useRef<Mesh>(null);
  const rightPanRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const tiltAngle = verdictReached
      ? Math.PI / 12
      : Math.sin(timeRef.current * 0.6) * (Math.PI / 18);
    if (beamRef.current) {
      beamRef.current.rotation.z = tiltAngle;
    }
    if (leftPanRef.current) {
      leftPanRef.current.position.y = 2.8 - Math.sin(tiltAngle) * 0.4;
    }
    if (rightPanRef.current) {
      rightPanRef.current.position.y = 2.8 + Math.sin(tiltAngle) * 0.4;
    }
  });

  const segments = 24;

  return (
    <group position={[0, 0, -2]}>
      {/* Central pillar */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 3.0, 8]} />
        <meshStandardMaterial color="#FFAA44" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Beam */}
      <mesh ref={beamRef} position={[0, 3.1, 0]}>
        <boxGeometry args={[2.0, 0.04, 0.04]} />
        <meshStandardMaterial color="#FFAA44" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Left pan */}
      <mesh ref={leftPanRef} position={[-0.9, 2.8, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.03, segments]} />
        <meshStandardMaterial color="#FFAA44" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right pan */}
      <mesh ref={rightPanRef} position={[0.9, 2.8, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.03, segments]} />
        <meshStandardMaterial color="#FFAA44" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Chain lines (simplified) */}
      {(
        <>
          <mesh position={[-0.9, 2.95, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.3, 4]} />
            <meshStandardMaterial color="#CCAA44" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.9, 2.95, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.3, 4]} />
            <meshStandardMaterial color="#CCAA44" metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}
      {/* Base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.04, segments]} />
        <meshStandardMaterial color="#1A1420" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Argument Podium ■■
function ArgumentPodium() {
  return (
    <group position={[0, 0, 0.5]}>
      {/* Podium body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.7, 1.0, 0.5]} />
        <meshStandardMaterial color="#1E1420" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Angled top surface */}
      <mesh position={[0, 1.02, -0.05]} rotation={[-0.15, 0, 0]} castShadow>
        <boxGeometry args={[0.65, 0.04, 0.4]} />
        <meshStandardMaterial color="#2A2030" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Microphone */}
      {(
        <group position={[0.2, 1.3, 0.1]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
            <meshStandardMaterial color="#444450" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshStandardMaterial color="#333340" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      )}
      {/* Podium light */}
      <mesh position={[0, 1.08, 0.15]}>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ■■ Evidence Presentation Screen ■■
function EvidenceScreen({ caseIndex }: { caseIndex: number }) {
  const screenRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (screenRef.current) {
      (screenRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.2 + Math.sin(timeRef.current * 1.5 + caseIndex) * 0.1;
    }
  });

  return (
    <group position={[2.5, 0, 1.5]}>
      {/* Screen stand */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.6, 6]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 1.8, 0]}>
        <boxGeometry args={[1.4, 1.0, 0.04]} />
        <meshStandardMaterial
          color="#00BBFF"
          emissive="#00BBFF"
          emissiveIntensity={0.2}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Screen frame */}
      <mesh position={[0, 1.8, -0.02]}>
        <boxGeometry args={[1.5, 1.1, 0.02]} />
        <meshStandardMaterial color="#1A1828" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Stained Glass Windows (Instanced) ■■
function StainedGlass() {
  const count = 6;
  const panelsRef = useRef<InstancedMesh>(null);
  const framesRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!panelsRef.current || !framesRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    const principleColors = ['#FF6644', '#00FF88', '#00BBFF', '#FFAA44', '#AA66FF', '#FF66AA'];
    for (let i = 0; i < count; i++) {
      const x = -5 + (i / (count - 1 || 1)) * 10;
      // Glass panel
      tmp.makeScale(1.0, 1.8, 0.03);
      tmp.setPosition(x, 2.5, -5.5);
      panelsRef.current.setMatrixAt(i, tmp);
      color.set(principleColors[i % principleColors.length]);
      panelsRef.current.setColorAt(i, color);
      // Frame
      tmp.makeScale(1.15, 2.0, 0.06);
      tmp.setPosition(x, 2.5, -5.52);
      framesRef.current.setMatrixAt(i, tmp);
    }
    panelsRef.current.instanceMatrix.needsUpdate = true;
    panelsRef.current.instanceColor!.needsUpdate = true;
    framesRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={panelsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial transparent opacity={0.25} emissive="#FFFFFF" emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={framesRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2A2030" metalness={0.6} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Gallery Seating (Instanced) ■■
function GallerySeating() {
  const count = 16;
  const seatsRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!seatsRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / (count / 2));
      const col = i % Math.ceil(count / 2);
      const x = -3 + col * 1.0;
      const z = 3 + row * 0.8;
      tmp.makeScale(0.4, 0.35, 0.35);
      tmp.setPosition(x, 0.18 + row * 0.15, z);
      seatsRef.current.setMatrixAt(i, tmp);
    }
    seatsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={seatsRef} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#221A20" metalness={0.3} roughness={0.6} />
    </instancedMesh>
  );
}

// ■■ Main Environment ■■
interface EthicsCourtroomEnvironmentProps {
  caseIndex?: number;
  verdictReached?: boolean;
}

export default function EthicsCourtroomEnvironment({
  caseIndex = 0,
  verdictReached = false,
}: EthicsCourtroomEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0A08"
      skyTopColor="#0A0408"
      skyHorizonColor="#1A0E10"
      fogColor="#FF6644"
    >
      <JudgeBench />
      <GavelPedestal verdictReached={verdictReached} />
      <WitnessStand caseIndex={caseIndex} />
      <JuryBox />
      <ScalesOfJustice verdictReached={verdictReached} />
      <ArgumentPodium />
      <EvidenceScreen caseIndex={caseIndex} />
      <StainedGlass />
      <GallerySeating />
      {/* Verdict spotlight */}
      {verdictReached && (
        <pointLight position={[0, 4, -2]} intensity={1.5} color="#FFAA44" distance={10} />
      )}
    </StandardEnvironmentWrapper>
  );
}
