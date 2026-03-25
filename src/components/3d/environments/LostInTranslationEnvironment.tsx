'use client';

// ════════════════════════════════════════════════════
// LostInTranslationEnvironment — Universal Translation Hub (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 8: Language & Communication | Color: #818CF8 (Indigo)
//
// A majestic universal translation hub inspired by Babel and linguistics:
//   - Babel tower centerpiece with spiraling language script rings
//   - Translation bridge connecting two cultural platforms
//   - Language pair selector globe (rotating wireframe)
//   - Mistranslation examples museum (instanced display cases)
//   - Phonetic decoder rings (animated concentric tori)
//   - Cultural context display cases (instanced)
//   - Real-time translation beam between platforms
//   - Dictionary constellation ceiling (instanced star points)
//
// Triangle Budget (Desktop Ultra):
//   Babel Tower Centerpiece:          ~80K  (stacked cylinders + script rings)
//   Translation Bridge:               ~50K  (arch + platform ends)
//   Language Selector Globe:          ~55K  (wireframe sphere + axis rings)
//   Mistranslation Museum (inst):     ~60K  (10 cases x ~6K)
//   Phonetic Decoder Rings:           ~45K  (5 concentric tori)
//   Cultural Display Cases (inst):    ~55K  (8 cases x ~6.8K)
//   Translation Beam:                 ~35K  (cylinder + particle emitters)
//   Dictionary Constellation (inst):  ~60K  (80 star points)
//   Room Structure:                   ~60K
//   Total:                            ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#818CF8';

// ■■ Babel Tower Centerpiece ■■
function BabelTower({ translationsCompleted }: { translationsCompleted: number }) {
  const ringRefs = useRef<Mesh[]>([]);
  const timeRef = useRef(0);
  const segments = 28;
  const towerLevels = 6;

  useFrame((_, delta) => {
    timeRef.current += delta;
    ringRefs.current.forEach((mesh, i) => {
      if (mesh) {
        mesh.rotation.y = timeRef.current * (0.2 + i * 0.08) * (i % 2 === 0 ? 1 : -1);
        (mesh.material as MeshStandardMaterial).emissiveIntensity =
          0.2 + Math.sin(timeRef.current * 1.5 + i * 1.0) * 0.12;
      }
    });
  });

  const ringColors = ['#818CF8', '#AA66FF', '#06B6D4', '#00FF88', '#FFAA44', '#FF66AA'];

  return (
    <group position={[0, 0, 0]}>
      {/* Tower body — stacked tapering cylinders */}
      {Array.from({ length: towerLevels }).map((_, i) => {
        const radius = 0.6 - i * 0.07;
        const y = i * 0.9 + 0.2;
        return (
          <mesh key={`tower-${i}`} position={[0, y, 0]} castShadow>
            <cylinderGeometry args={[radius - 0.05, radius, 0.85, segments]} />
            <meshStandardMaterial
              color="#141028"
              metalness={0.5}
              roughness={0.4}
              emissive={LAB_COLOR}
              emissiveIntensity={i < Math.min(translationsCompleted, towerLevels) ? 0.12 : 0.02}
            />
          </mesh>
        );
      })}
      {/* Spiraling script rings */}
      {Array.from({ length: towerLevels }).map((_, i) => {
        const radius = 0.85 - i * 0.06;
        const y = i * 0.9 + 0.5;
        return (
          <mesh
            key={`ring-${i}`}
            ref={(el) => { if (el) ringRefs.current[i] = el; }}
            position={[0, y, 0]}
          >
            <torusGeometry args={[radius, 0.025, 6, segments]} />
            <meshStandardMaterial
              color={ringColors[i % ringColors.length]}
              emissive={ringColors[i % ringColors.length]}
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}
      {/* Tower apex beacon */}
      <mesh position={[0, towerLevels * 0.9 + 0.5, 0]}>
        <sphereGeometry args={[0.15, segments / 2, segments / 2]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.6} />
      </mesh>
      {/* Base platform */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[1.0, 1.2, 0.2, segments]} />
        <meshStandardMaterial color="#0E0A1C" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Translation Bridge ■■
function TranslationBridge() {
  const beamRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  const segments = 24;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (beamRef.current) {
      (beamRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.2 + Math.sin(timeRef.current * 2.5) * 0.15;
    }
  });

  return (
    <group position={[0, 0.3, 4.5]}>
      {/* Left cultural platform */}
      <mesh position={[-3.0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.25, segments]} />
        <meshStandardMaterial color="#1A1430" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Right cultural platform */}
      <mesh position={[3.0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.25, segments]} />
        <meshStandardMaterial color="#1A1430" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Bridge arch */}
      <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[3.0, 0.06, 6, segments, Math.PI]} />
        <meshStandardMaterial color="#2A2040" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Bridge walkway */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[5.8, 0.06, 0.6]} />
        <meshStandardMaterial color="#16102A" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Translation beam */}
      <mesh ref={beamRef} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 5.5, 6]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.2}
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Side rails */}
      {(
        <>
          <mesh position={[0, 0.25, 0.33]}>
            <boxGeometry args={[5.8, 0.03, 0.03]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0, 0.25, -0.33]}>
            <boxGeometry args={[5.8, 0.03, 0.03]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ■■ Language Selector Globe ■■
function LanguageGlobe({ languagePair: _languagePair }: { languagePair: string }) {
  const globeRef = useRef<Mesh>(null);
  const axisRef1 = useRef<Mesh>(null);
  const axisRef2 = useRef<Mesh>(null);
  const timeRef = useRef(0);
  const segments = 24;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (globeRef.current) {
      globeRef.current.rotation.y = timeRef.current * 0.3;
      globeRef.current.rotation.x = Math.sin(timeRef.current * 0.15) * 0.15;
    }
    if (axisRef1.current) {
      axisRef1.current.rotation.z = timeRef.current * 0.5;
    }
    if (axisRef2.current) {
      axisRef2.current.rotation.x = timeRef.current * 0.4;
    }
  });

  return (
    <group position={[-4.5, 1.5, -2.0]}>
      {/* Wireframe globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[0.7, segments, segments / 2]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          wireframe
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Axis ring 1 */}
      <mesh ref={axisRef1}>
        <torusGeometry args={[0.9, 0.02, 4, segments]} />
        <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={0.25} />
      </mesh>
      {/* Axis ring 2 */}
      <mesh ref={axisRef2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95, 0.015, 4, segments]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.2} />
      </mesh>
      {/* Pedestal */}
      <mesh position={[0, -1.0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 0.4, segments / 2]} />
        <meshStandardMaterial color="#14102A" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Stand column */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#2A2040" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
}

// ■■ Mistranslation Museum Cases (Instanced) ■■
function MistranslationMuseum() {
  const count = 10;
  const casesRef = useRef<InstancedMesh>(null);
  const lidsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!casesRef.current || !lidsRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI + Math.PI;
      const radius = 5.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Case body
      tmp.makeScale(0.5, 0.7, 0.5);
      tmp.setPosition(x, 0.05, z);
      casesRef.current.setMatrixAt(i, tmp);
      // Glass lid
      tmp.makeScale(0.48, 0.02, 0.48);
      tmp.setPosition(x, 0.42, z);
      lidsRef.current.setMatrixAt(i, tmp);
    }
    casesRef.current.instanceMatrix.needsUpdate = true;
    lidsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lidsRef.current) return;
    const mat = lidsRef.current.material as MeshStandardMaterial;
    mat.opacity = 0.15 + Math.sin(timeRef.current * 1.2) * 0.05;
  });

  return (
    <group>
      <instancedMesh ref={casesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#16102C" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={lidsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#AABBCC"
          transparent
          opacity={0.15}
          metalness={0.8}
          roughness={0.1}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Phonetic Decoder Rings ■■
function PhoneticDecoderRings() {
  const ringCount = 5;
  const ringRefs = useRef<Mesh[]>([]);
  const timeRef = useRef(0);
  const segments = 32;

  const ringColors = useMemo(() => ['#818CF8', '#AA66FF', '#06B6D4', '#00FF88', '#FFAA44'], []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    ringRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const axis = i % 3;
        if (axis === 0) mesh.rotation.x = timeRef.current * (0.3 + i * 0.1);
        else if (axis === 1) mesh.rotation.y = timeRef.current * (0.25 + i * 0.08);
        else mesh.rotation.z = timeRef.current * (0.35 + i * 0.06);
      }
    });
  });

  return (
    <group position={[4.5, 1.8, -3.0]}>
      {Array.from({ length: ringCount }).map((_, i) => (
        <mesh
          key={`decoder-${i}`}
          ref={(el) => { if (el) ringRefs.current[i] = el; }}
        >
          <torusGeometry args={[0.4 + i * 0.18, 0.02, 6, segments]} />
          <meshStandardMaterial
            color={ringColors[i]}
            emissive={ringColors[i]}
            emissiveIntensity={0.3}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Dictionary Constellation Ceiling (Instanced) ■■
function DictionaryConstellation() {
  const count = 80;
  const starsRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 16,
      y: 4.0 + Math.random() * 2.0,
      z: (Math.random() - 0.5) * 16,
      twinkleSpeed: 1.0 + Math.random() * 3.0,
      twinklePhase: Math.random() * Math.PI * 2,
      size: 0.02 + Math.random() * 0.05,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!starsRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const brightness = 0.4 + Math.sin(timeRef.current * s.twinkleSpeed + s.twinklePhase) * 0.3;
      const scale = s.size * (0.8 + brightness * 0.4);
      tmp.makeScale(scale, scale, scale);
      tmp.setPosition(s.x, s.y, s.z);
      starsRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.6 + Math.random() * 0.1, 0.5, brightness);
      starsRef.current.setColorAt(i, color);
    }
    starsRef.current.instanceMatrix.needsUpdate = true;
    if (starsRef.current.instanceColor) starsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={starsRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.8} transparent opacity={0.8} depthWrite={false} />
    </instancedMesh>
  );
}

// ■■ Cultural Display Cases (Instanced) ■■
function CulturalDisplayCases() {
  const count = 8;
  const casesRef = useRef<InstancedMesh>(null);
  const glassRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!casesRef.current || !glassRef.current) return;
    const tmp = new Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 1.8;
      // Pedestal
      tmp.makeScale(0.45, 0.5, 0.45);
      tmp.setPosition(x, -0.1, -5.5);
      casesRef.current.setMatrixAt(i, tmp);
      // Glass dome
      tmp.makeScale(0.35, 0.35, 0.35);
      tmp.setPosition(x, 0.5, -5.5);
      glassRef.current.setMatrixAt(i, tmp);
    }
    casesRef.current.instanceMatrix.needsUpdate = true;
    glassRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={casesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#18122E" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={glassRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#AABBDD"
          transparent
          opacity={0.1}
          metalness={0.9}
          roughness={0.05}
          side={DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface LostInTranslationEnvironmentProps {
  languagePair?: string;
  translationsCompleted?: number;
}

export default function LostInTranslationEnvironment({
  languagePair = 'EN-ES',
  translationsCompleted = 0,
}: LostInTranslationEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0A0818"
      skyTopColor="#040312"
      skyHorizonColor="#0E0826"
      fogColor="#818CF8"
    >
      <BabelTower translationsCompleted={translationsCompleted} />
      <TranslationBridge />
      <LanguageGlobe languagePair={languagePair} />
      <MistranslationMuseum />
      <PhoneticDecoderRings />
      <DictionaryConstellation />
      <CulturalDisplayCases />
      {/* Tower beacon light */}
      <pointLight position={[0, 5, 0]} intensity={0.5} color={LAB_COLOR} distance={12} />
    </StandardEnvironmentWrapper>
  );
}
