'use client';

// ════════════════════════════════════════════════════
// FoolTheAiEnvironment — Adversarial Testing Laboratory (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 7: AI Systems | Color: #06B6D4 (Cyan)
//
// A high-tech adversarial testing lab where players try to
// trick an AI model with cleverly disguised inputs:
//   - AI brain model in a glass dome (the target)
//   - Disguise/camouflage station with tools
//   - Perturbation generator (noise machine with dials)
//   - Confidence meter display (vertical bar)
//   - Attack vector selector panel (button array)
//   - Defense shield around the AI (energy barrier)
//   - Success/fail indicator lights (instanced)
//   - Adversarial examples gallery on walls (instanced)
//
// Triangle Budget (Desktop Ultra):
//   AI Brain in Dome:             ~80K  (brain mesh + glass dome + base)
//   Disguise Station:             ~50K  (workbench + tools + rack)
//   Perturbation Generator:       ~60K  (machine body + dials + display)
//   Confidence Meter:             ~40K  (bar + frame + labels)
//   Attack Vector Panel:          ~50K  (panel + buttons instanced)
//   Defense Shield:               ~60K  (energy sphere + ring + sparks)
//   Indicator Lights (instanced): ~60K  (16 lights x ~3.75K)
//   Example Gallery (instanced):  ~60K  (10 frames x ~6K)
//   Floor/Wall accents:           ~40K
//   Total:                        ~500K

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Euler,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#06B6D4';

// ■■ AI Brain in Glass Dome ■■
function AiBrainDome({ isTesting }: { isTesting: boolean }) {
  const brainRef = useRef<Mesh>(null);
  const domeRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (brainRef.current) {
      brainRef.current.rotation.y += delta * (isTesting ? 0.8 : 0.2);
      brainRef.current.rotation.x = Math.sin(timeRef.current * 0.5) * 0.1;
      (brainRef.current.material as MeshStandardMaterial).emissiveIntensity =
        isTesting ? 0.5 + Math.sin(timeRef.current * 4) * 0.3 : 0.3;
    }
    if (domeRef.current) {
      (domeRef.current.material as MeshStandardMaterial).opacity =
        isTesting ? 0.12 + Math.sin(timeRef.current * 3) * 0.04 : 0.08;
    }
  });

  const segments = 32;

  return (
    <group position={[0, 0, 0]}>
      {/* Base platform */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.16, segments]} />
        <meshStandardMaterial color="#0A1520" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glass dome */}
      <mesh ref={domeRef} position={[0, 1.0, 0]}>
        <sphereGeometry args={[1.1, segments, segments, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#88DDFF"
          transparent
          opacity={0.08}
          metalness={0.9}
          roughness={0.1}
          side={DoubleSide}
        />
      </mesh>
      {/* Brain mesh (icosahedron as brain proxy) */}
      <mesh ref={brainRef} position={[0, 0.8, 0]} castShadow>
        <icosahedronGeometry args={[0.5, 3]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.3}
          wireframe
        />
      </mesh>
      {/* Inner core glow */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive={LAB_COLOR}
          emissiveIntensity={0.8}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

// ■■ Disguise/Camouflage Station ■■
function DisguiseStation() {
  return (
    <group position={[-3.5, 0, -1.5]}>
      {/* Workbench */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.8, 0.08, 0.9]} />
        <meshStandardMaterial color="#1A1828" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Bench legs */}
      {[[-0.8, 0.2, -0.35], [0.8, 0.2, -0.35], [-0.8, 0.2, 0.35], [0.8, 0.2, 0.35]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#333340" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Tool rack (back panel) */}
      <mesh position={[0, 0.8, -0.45]} castShadow>
        <boxGeometry args={[1.8, 0.8, 0.04]} />
        <meshStandardMaterial color="#12101E" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Hanging tools */}
      {(
        <>
          {[-0.5, 0, 0.5].map((x, i) => (
            <mesh key={i} position={[x, 0.75, -0.42]}>
              <boxGeometry args={[0.08, 0.25, 0.04]} />
              <meshStandardMaterial color={i === 1 ? LAB_COLOR : '#FFAA44'} emissive={i === 1 ? LAB_COLOR : '#FFAA44'} emissiveIntensity={0.2} metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </>
      )}
      {/* Noise texture sample on bench */}
      <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshStandardMaterial
          color="#AA66FF"
          emissive="#AA66FF"
          emissiveIntensity={0.15}
          transparent
          opacity={0.5}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ■■ Perturbation Generator (Noise Machine) ■■
function PerturbationGenerator({ isTesting }: { isTesting: boolean }) {
  const dialRefs = useRef<Mesh[]>([]);
  const displayRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    dialRefs.current.forEach((dial, i) => {
      if (dial) {
        const speed = isTesting ? 2.0 + i * 0.5 : 0.2;
        dial.rotation.z += delta * speed;
      }
    });
    if (displayRef.current) {
      (displayRef.current.material as MeshStandardMaterial).emissiveIntensity =
        isTesting ? 0.5 + Math.sin(timeRef.current * 6) * 0.3 : 0.15;
    }
  });

  const segments = 24;

  return (
    <group position={[3.5, 0, -1.5]}>
      {/* Machine body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.2, 1.4, 0.8]} />
        <meshStandardMaterial color="#12101E" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Display screen */}
      <mesh ref={displayRef} position={[0, 1.0, 0.41]}>
        <boxGeometry args={[0.8, 0.4, 0.02]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.2} transparent opacity={0.6} />
      </mesh>
      {/* Dials */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) dialRefs.current[i] = el; }}
          position={[x, 0.5, 0.42]}
        >
          <torusGeometry args={[0.1, 0.02, 6, segments]} />
          <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
        </mesh>
      ))}
      {/* Output antenna */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
        <meshStandardMaterial color="#444450" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.88, 0]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial
          color={isTesting ? '#FF4444' : LAB_COLOR}
          emissive={isTesting ? '#FF4444' : LAB_COLOR}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// ■■ Confidence Meter Display ■■
function ConfidenceMeter({ foolAttempts }: { foolAttempts: number }) {
  const barRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (barRef.current) {
      const confidence = Math.max(0.1, 1 - foolAttempts * 0.08);
      const targetScale = confidence * 2.0;
      barRef.current.scale.y = MathUtils.lerp(barRef.current.scale.y, targetScale, delta * 2);
      barRef.current.position.y = barRef.current.scale.y / 2 + 0.1;
    }
  });

  return (
    <group position={[-2, 0, 2.5]}>
      {/* Frame */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.5, 2.4, 0.1]} />
        <meshStandardMaterial color="#12101E" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Confidence bar */}
      <mesh ref={barRef} position={[0, 1.0, 0.06]}>
        <boxGeometry args={[0.3, 1, 0.04]} />
        <meshStandardMaterial
          color={foolAttempts > 5 ? '#FF4444' : '#00FF88'}
          emissive={foolAttempts > 5 ? '#FF4444' : '#00FF88'}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Label */}
      <mesh position={[0, 2.4, 0.06]}>
        <boxGeometry args={[0.4, 0.08, 0.02]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Attack Vector Selector Panel ■■
function AttackVectorPanel() {
  const buttonCount = 12;
  const buttonsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!buttonsRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    const cols = 4;
    for (let i = 0; i < buttonCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = (col - (cols - 1) / 2) * 0.25;
      const y = 0.8 + row * 0.25;
      tmp.makeScale(0.1, 0.1, 0.04);
      tmp.setPosition(x + 2, y, 3.4);
      buttonsRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.5 + (i / buttonCount) * 0.3, 0.8, 0.5);
      buttonsRef.current.setColorAt(i, color);
    }
    buttonsRef.current.instanceMatrix.needsUpdate = true;
    if (buttonsRef.current.instanceColor) buttonsRef.current.instanceColor.needsUpdate = true;
  }, [buttonCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!buttonsRef.current) return;
    const mat = buttonsRef.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2) * 0.1;
  });

  return (
    <group>
      {/* Panel backing */}
      <mesh position={[2, 0.9, 3.45]} castShadow>
        <boxGeometry args={[1.4, 1.0, 0.1]} />
        <meshStandardMaterial color="#12101E" metalness={0.6} roughness={0.3} />
      </mesh>
      <instancedMesh ref={buttonsRef} args={[undefined, undefined, buttonCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} metalness={0.4} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Defense Shield (Energy Barrier) ■■
function DefenseShield({ foolAttempts }: { foolAttempts: number }) {
  const shieldRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const integrity = Math.max(0.1, 1 - foolAttempts * 0.07);
    if (shieldRef.current) {
      (shieldRef.current.material as MeshStandardMaterial).opacity = integrity * 0.15;
      (shieldRef.current.material as MeshStandardMaterial).emissiveIntensity =
        integrity * 0.3 + Math.sin(timeRef.current * 2) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.5;
      ringRef.current.rotation.x = Math.sin(timeRef.current * 0.3) * 0.2;
    }
  });

  const segments = 32;

  return (
    <group position={[0, 0.8, 0]}>
      {/* Energy sphere */}
      <mesh ref={shieldRef}>
        <sphereGeometry args={[1.6, segments, segments]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.1}
          side={DoubleSide}
          wireframe
        />
      </mesh>
      {/* Orbiting defense ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.8, 0.03, 8, segments]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Success/Fail Indicator Lights (Instanced) ■■
function IndicatorLights({ foolAttempts }: { foolAttempts: number }) {
  const count = 16;
  const lightsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!lightsRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 5;
      tmp.makeScale(0.1, 0.1, 0.1);
      tmp.setPosition(Math.cos(angle) * r, 0.15, Math.sin(angle) * r);
      lightsRef.current.setMatrixAt(i, tmp);
    }
    lightsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lightsRef.current) return;
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const isSuccess = i < foolAttempts;
      const pulse = Math.sin(timeRef.current * 3 + i * 0.5) * 0.3 + 0.7;
      color.set(isSuccess ? '#00FF88' : '#FF4444');
      color.multiplyScalar(isSuccess ? pulse : 0.3);
      lightsRef.current.setColorAt(i, color);
    }
    if (lightsRef.current.instanceColor) lightsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={lightsRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}

// ■■ Adversarial Examples Gallery (Instanced) ■■
function AdversarialGallery() {
  const count = 10;
  const framesRef = useRef<InstancedMesh>(null);
  const imagesRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!framesRef.current || !imagesRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI + Math.PI * 0.5;
      const r = 6.5;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const rot = new Quaternion();
      rot.setFromEuler(new Euler(0, -angle + Math.PI / 2, 0));
      // Frame
      tmp.compose(new Vector3(x, 1.5, z), rot, new Vector3(0.9, 0.7, 0.04));
      framesRef.current.setMatrixAt(i, tmp);
      // Image
      tmp.compose(new Vector3(x, 1.5, z), rot, new Vector3(0.75, 0.55, 0.02));
      imagesRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.5 + (i / count) * 0.2, 0.4, 0.2);
      imagesRef.current.setColorAt(i, color);
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    imagesRef.current.instanceMatrix.needsUpdate = true;
    if (imagesRef.current.instanceColor) imagesRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={framesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2A2838" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={imagesRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.1} roughness={0.8} emissive="#FFFFFF" emissiveIntensity={0.05} />
      </instancedMesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface FoolTheAiEnvironmentProps {
  foolAttempts?: number;
  isTesting?: boolean;
}

export default function FoolTheAiEnvironment({
  foolAttempts = 0,
  isTesting = false,
}: FoolTheAiEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0A0E14"
      skyTopColor="#040810"
      skyHorizonColor="#0E1A28"
      fogColor="#06B6D4"
    >
      <AiBrainDome isTesting={isTesting} />
      <DisguiseStation />
      <PerturbationGenerator isTesting={isTesting} />
      <ConfidenceMeter foolAttempts={foolAttempts} />
      <AttackVectorPanel />
      <DefenseShield foolAttempts={foolAttempts} />
      <IndicatorLights foolAttempts={foolAttempts} />
      <AdversarialGallery />
      {/* Testing active spotlight */}
      {isTesting && (
        <pointLight position={[0, 3, 0]} intensity={1.2} color="#FF4444" distance={10} />
      )}
    </StandardEnvironmentWrapper>
  );
}
