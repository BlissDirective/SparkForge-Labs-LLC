'use client';

// ════════════════════════════════════════════════════
// RealOrFakeEnvironment — Media Verification Studio (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 6: AI Safety | Color: #FF6644 (Orange/Red)
//
// A media fact-checking studio where players learn to distinguish
// real news from misinformation and deepfakes:
//   - News desk with dual screens (real vs fake comparison)
//   - Fact-checking magnifier station (giant lens)
//   - Source verification pipeline (conveyor with checkmarks)
//   - Deepfake analysis chamber (glass enclosure)
//   - Truth meter (giant gauge with needle)
//   - Media library shelves (instanced, categorized)
//   - Verification stamp press (mechanical arm)
//   - Evidence comparison lightbox (illuminated panels)
//
// Triangle Budget (Desktop Ultra):
//   News Desk + Screens:           ~70K  (desk + 2 screens + chairs)
//   Magnifier Station:             ~50K  (lens + frame + stand)
//   Verification Pipeline:         ~60K  (conveyor + instanced stamps)
//   Deepfake Chamber:              ~60K  (glass walls + scan lines)
//   Truth Meter:                   ~50K  (gauge body + needle + labels)
//   Media Library (instanced):     ~80K  (16 shelves x ~5K)
//   Stamp Press:                   ~40K  (arm + stamp head + base)
//   Lightbox Panels (instanced):   ~50K  (8 panels x ~6.25K)
//   Floor/Wall accents:            ~40K
//   Total:                         ~500K

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#FF6644';

// ■■ News Desk with Dual Screens ■■
function NewsDesk({ lod: _lod, isChecking }: { lod: ReturnType<typeof useStandardLOD>; isChecking: boolean }) {
  const realScreenRef = useRef<THREE.Mesh>(null);
  const fakeScreenRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const pulse = isChecking ? 0.4 + Math.sin(timeRef.current * 3) * 0.2 : 0.15;
    if (realScreenRef.current) {
      (realScreenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
    if (fakeScreenRef.current) {
      (fakeScreenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <group position={[0, 0, -3.5]}>
      {/* Desk surface */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[3.5, 0.12, 1.2]} />
        <meshStandardMaterial color="#1A1218" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Desk front panel */}
      <mesh position={[0, 0.3, 0.55]} castShadow>
        <boxGeometry args={[3.5, 0.6, 0.08]} />
        <meshStandardMaterial color="#1A1520" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Left screen (REAL) */}
      <mesh ref={realScreenRef} position={[-0.9, 1.4, -0.2]}>
        <boxGeometry args={[1.2, 0.8, 0.04]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.15} transparent opacity={0.6} />
      </mesh>
      {/* Right screen (FAKE) */}
      <mesh ref={fakeScreenRef} position={[0.9, 1.4, -0.2]}>
        <boxGeometry args={[1.2, 0.8, 0.04]} />
        <meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={0.15} transparent opacity={0.6} />
      </mesh>
      {/* Screen stands */}
      <mesh position={[-0.9, 0.95, -0.2]}>
        <cylinderGeometry args={[0.04, 0.06, 0.6, 6]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.9, 0.95, -0.2]}>
        <cylinderGeometry args={[0.04, 0.06, 0.6, 6]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Divider label */}
      <mesh position={[0, 1.9, -0.2]}>
        <boxGeometry args={[0.06, 0.04, 0.04]} />
        <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ■■ Fact-Checking Magnifier Station ■■
function MagnifierStation({ lod, isChecking }: { lod: ReturnType<typeof useStandardLOD>; isChecking: boolean }) {
  const lensRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (lensRef.current) {
      lensRef.current.rotation.z = Math.sin(timeRef.current * 0.6) * 0.1;
      const mat = lensRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = isChecking ? 0.3 + Math.sin(timeRef.current * 4) * 0.1 : 0.2;
    }
  });

  const segments = 32;

  return (
    <group position={[3.5, 0, 0]}>
      {/* Stand base */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.2, segments]} />
        <meshStandardMaterial color="#1A1420" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Stand arm */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.0, 6]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Lens frame */}
      <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 6, 0, 0]}>
        <torusGeometry args={[0.5, 0.06, 8, segments]} />
        <meshStandardMaterial color="#FFAA44" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Lens glass */}
      <mesh ref={lensRef} position={[0, 2.2, 0]} rotation={[Math.PI / 6, 0, 0]}>
        <circleGeometry args={[0.48, segments]} />
        <meshStandardMaterial
          color="#88CCFF"
          emissive="#00BBFF"
          emissiveIntensity={0.2}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ■■ Source Verification Pipeline ■■
function VerificationPipeline({ lod, verified }: { lod: ReturnType<typeof useStandardLOD>; verified: number }) {
  const stampCount = 10;
  const stampsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!stampsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < stampCount; i++) {
      const baseX = -3 + (i / stampCount) * 6;
      const x = ((baseX + timeRef.current * 0.4 + 3) % 6) - 3;
      const bounce = Math.abs(Math.sin(timeRef.current * 2 + i * 0.8)) * 0.1;
      tmp.makeScale(0.15, 0.15, 0.02);
      tmp.setPosition(x, 0.35 + bounce, 2.5);
      stampsRef.current.setMatrixAt(i, tmp);
      const isVerified = i < Math.min(verified, stampCount);
      color.set(isVerified ? '#00FF88' : '#FF4444');
      stampsRef.current.setColorAt(i, color);
    }
    stampsRef.current.instanceMatrix.needsUpdate = true;
    if (stampsRef.current.instanceColor) stampsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Conveyor belt */}
      <mesh position={[0, 0.2, 2.5]} receiveShadow>
        <boxGeometry args={[7, 0.1, 0.6]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Conveyor sides */}
      <mesh position={[0, 0.28, 2.2]}>
        <boxGeometry args={[7, 0.06, 0.04]} />
        <meshStandardMaterial color="#2A2030" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.28, 2.8]}>
        <boxGeometry args={[7, 0.06, 0.04]} />
        <meshStandardMaterial color="#2A2030" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Stamps moving on belt */}
      <instancedMesh ref={stampsRef} args={[undefined, undefined, stampCount]}>
        <circleGeometry args={[1, 8]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.4} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

// ■■ Deepfake Analysis Chamber ■■
function DeepfakeChamber({ lod: _lod, isChecking }: { lod: ReturnType<typeof useStandardLOD>; isChecking: boolean }) {
  const scanLineRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (scanLineRef.current) {
      const y = isChecking
        ? 0.5 + Math.sin(timeRef.current * 2) * 0.8
        : 0.5;
      scanLineRef.current.position.y = y;
      (scanLineRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isChecking ? 0.6 + Math.sin(timeRef.current * 8) * 0.3 : 0.1;
    }
  });

  return (
    <group position={[-3.5, 0, 0]}>
      {/* Glass walls */}
      {[[-0.6, 0.7, 0], [0.6, 0.7, 0], [0, 0.7, -0.6], [0, 0.7, 0.6]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[i < 2 ? 0.03 : 1.2, 1.4, i < 2 ? 1.2 : 0.03]} />
          <meshStandardMaterial
            color="#88BBFF"
            transparent
            opacity={0.08}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
      {/* Scan line */}
      <mesh ref={scanLineRef} position={[0, 0.5, 0]}>
        <planeGeometry args={[1.1, 0.02]} />
        <meshStandardMaterial
          color="#00BBFF"
          emissive="#00BBFF"
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Base platform */}
      <mesh position={[0, -0.02, 0]} castShadow>
        <boxGeometry args={[1.3, 0.04, 1.3]} />
        <meshStandardMaterial color="#1A1828" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Truth Meter (Giant Gauge) ■■
function TruthMeter({ lod, verified }: { lod: ReturnType<typeof useStandardLOD>; verified: number }) {
  const needleRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (needleRef.current) {
      const targetAngle = -Math.PI / 4 + (Math.min(verified, 10) / 10) * (Math.PI / 2);
      const wobble = Math.sin(timeRef.current * 3) * 0.02;
      needleRef.current.rotation.z = targetAngle + wobble;
    }
  });

  const segments = 32;

  return (
    <group position={[0, 2.8, -4.5]}>
      {/* Gauge backing */}
      <mesh castShadow>
        <circleGeometry args={[0.9, segments]} />
        <meshStandardMaterial color="#1A1420" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Gauge rim */}
      <mesh>
        <torusGeometry args={[0.9, 0.05, 8, segments]} />
        <meshStandardMaterial color={LAB_COLOR} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Needle */}
      <mesh ref={needleRef} position={[0, 0, 0.05]}>
        <boxGeometry args={[0.04, 0.7, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
      </mesh>
      {/* Center cap */}
      <mesh position={[0, 0, 0.06]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#FFAA44" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Label - FAKE zone (red) */}
      <mesh position={[-0.5, -0.5, 0.02]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.3, 0.06, 0.01]} />
        <meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={0.4} />
      </mesh>
      {/* Label - REAL zone (green) */}
      <mesh position={[0.5, -0.5, 0.02]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.3, 0.06, 0.01]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ■■ Media Library Shelves (Instanced) ■■
function MediaLibrary({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const shelfCount = 16;
  const shelvesRef = useRef<THREE.InstancedMesh>(null);
  const booksRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!shelvesRef.current || !booksRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    const categories = ['#FF6644', '#00FF88', '#00BBFF', '#FFAA44', '#AA66FF'];
    for (let i = 0; i < shelfCount; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const x = -6 + col * 0.8;
      const y = 0.5 + row * 0.8;
      // Shelf plank
      tmp.makeScale(0.7, 0.04, 0.3);
      tmp.setPosition(x, y, 4);
      shelvesRef.current.setMatrixAt(i, tmp);
      // Books on shelf
      tmp.makeScale(0.5, 0.25, 0.2);
      tmp.setPosition(x, y + 0.15, 4);
      booksRef.current.setMatrixAt(i, tmp);
      color.set(categories[i % categories.length]);
      booksRef.current.setColorAt(i, color);
    }
    shelvesRef.current.instanceMatrix.needsUpdate = true;
    booksRef.current.instanceMatrix.needsUpdate = true;
    if (booksRef.current.instanceColor) booksRef.current.instanceColor.needsUpdate = true;
  }, [shelfCount]);

  return (
    <group>
      <instancedMesh ref={shelvesRef} args={[undefined, undefined, shelfCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2A2030" metalness={0.4} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={booksRef} args={[undefined, undefined, shelfCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.2} roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

// ■■ Evidence Comparison Lightbox (Instanced) ■■
function LightboxPanels({ lod, isChecking }: { lod: ReturnType<typeof useStandardLOD>; isChecking: boolean }) {
  const count = 8;
  const panelsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!panelsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 1.5;
      tmp.makeScale(1.0, 0.7, 0.03);
      tmp.setPosition(x, 1.5, 4.8);
      panelsRef.current.setMatrixAt(i, tmp);
    }
    panelsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!panelsRef.current) return;
    const mat = panelsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isChecking
      ? 0.3 + Math.sin(timeRef.current * 2) * 0.15
      : 0.1;
  });

  return (
    <instancedMesh ref={panelsRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#FFFFFF"
        emissive="#FFFFFF"
        emissiveIntensity={0.15}
        transparent
        opacity={0.15}
      />
    </instancedMesh>
  );
}

// ■■ Main Environment ■■
interface RealOrFakeEnvironmentProps {
  verified?: number;
  isChecking?: boolean;
}

export default function RealOrFakeEnvironment({
  verified = 0,
  isChecking = false,
}: RealOrFakeEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0A0A"
      skyTopColor="#0A0408"
      skyHorizonColor="#1A0E12"
      fogColor="#FF6644"
    >
      <NewsDesk lod={lod} isChecking={isChecking} />
      <MagnifierStation lod={lod} isChecking={isChecking} />
      <VerificationPipeline lod={lod} verified={verified} />
      <DeepfakeChamber lod={lod} isChecking={isChecking} />
      <TruthMeter lod={lod} verified={verified} />
      <MediaLibrary lod={lod} />
      <LightboxPanels lod={lod} isChecking={isChecking} />
      {/* Extra analysis spotlight when checking */}
      {isChecking && (
        <pointLight position={[0, 3, -3]} intensity={1.0} color="#FFAA44" distance={10} />
      )}
    </StandardEnvironmentWrapper>
  );
}
