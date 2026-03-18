'use client';

// ════════════════════════════════════════════════════
// AiSpyEnvironment — Futuristic Detective Investigation Room (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 1: AI Basics | Color: #00BBFF (Blue)
//
// A futuristic detective's office for spotting AI in everyday scenes:
//   - Holographic display screens showing scene evidence (instanced)
//   - Central magnifying glass hologram centerpiece
//   - Evidence pinboard with connected investigation threads
//   - Surveillance monitor wall (instanced monitors)
//   - AI detection scanner beam sweeping the room
//   - Floating data fragments drifting through the air
//   - Detective desk with spy gadgets and tools
//   - Neon grid floor with scanning lines
//
// Triangle Budget (Desktop Ultra):
//   Holographic Screens (instanced):    ~80K  (12 screens x ~6.7K)
//   Magnifying Glass Centerpiece:       ~45K  (lens + handle + glow ring)
//   Evidence Pinboard + Threads:        ~60K  (board + pins + string meshes)
//   Surveillance Monitors (instanced):  ~70K  (16 monitors x ~4.4K)
//   Scanner Beam + Emitter:             ~35K  (cone + ring + particles)
//   Floating Data Fragments (instanced):~50K  (40 fragments)
//   Detective Desk + Gadgets:           ~55K  (desk + 6 gadgets)
//   Neon Grid Floor:                    ~40K  (grid lines + glow)
//   Room Walls + Ceiling:               ~65K  (enclosure + accents)
//   Total:                              ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#00BBFF';

// ■■ Holographic Display Screens (Instanced) ■■
function HolographicScreens({ lod, sceneIndex }: { lod: ReturnType<typeof useStandardLOD>; sceneIndex: number }) {
  const count = lod.level === 'ultra' ? 12 : lod.level === 'high' ? 8 : 5;
  const framesRef = useRef<THREE.InstancedMesh>(null);
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!framesRef.current || !screensRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 1.4 - Math.PI * 0.7;
      const radius = 4.5;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - 2;
      const y = 1.8 + (i % 3) * 0.6;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, -angle, 0));
      // Frame
      tmp.compose(new THREE.Vector3(x, y, z), rot, new THREE.Vector3(1.0, 0.7, 0.05));
      framesRef.current.setMatrixAt(i, tmp);
      // Screen surface
      tmp.compose(new THREE.Vector3(x, y, z), rot, new THREE.Vector3(0.9, 0.6, 0.02));
      screensRef.current.setMatrixAt(i, tmp);
      const hue = 0.55 + (i / count) * 0.1;
      color.setHSL(hue, 0.8, 0.15 + (i === sceneIndex % count ? 0.2 : 0));
      screensRef.current.setColorAt(i, color);
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    screensRef.current.instanceMatrix.needsUpdate = true;
    if (screensRef.current.instanceColor) screensRef.current.instanceColor.needsUpdate = true;
  }, [count, sceneIndex]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const mat = screensRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2) * 0.1;
  });

  return (
    <group>
      <instancedMesh ref={framesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1A2030" metalness={0.7} roughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Magnifying Glass Centerpiece ■■
function MagnifyingGlass({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const glassRef = useRef<THREE.Group>(null);
  const lensRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const segments = lod.level === 'ultra' ? 32 : lod.level === 'high' ? 20 : 12;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (glassRef.current) {
      glassRef.current.rotation.y = Math.sin(timeRef.current * 0.3) * 0.15;
      glassRef.current.position.y = 2.5 + Math.sin(timeRef.current * 0.6) * 0.1;
    }
    if (lensRef.current) {
      (lensRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.4 + Math.sin(timeRef.current * 1.5) * 0.2;
    }
  });

  return (
    <group ref={glassRef} position={[0, 2.5, 0]}>
      {/* Lens ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.06, 8, segments]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Lens glass */}
      <mesh ref={lensRef} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, segments]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.4}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[0.55, -0.8, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.04, 0.05, 1.2, 8]} />
        <meshStandardMaterial color="#8B6914" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.02, 6, segments]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.8} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ■■ Evidence Pinboard with Threads ■■
function EvidencePinboard({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const pinCount = lod.level === 'ultra' ? 16 : lod.level === 'high' ? 10 : 6;
  const pinsRef = useRef<THREE.InstancedMesh>(null);
  const cardsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!pinsRef.current || !cardsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < pinCount; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = -3.5 + col * 0.7;
      const y = 2.8 + row * 0.55;
      // Pin
      tmp.makeScale(0.03, 0.03, 0.03);
      tmp.setPosition(x, y, -5.85);
      pinsRef.current.setMatrixAt(i, tmp);
      // Evidence card
      tmp.makeScale(0.4, 0.3, 0.01);
      tmp.setPosition(x, y - 0.12, -5.88);
      cardsRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.55 + (i / pinCount) * 0.15, 0.5, 0.12);
      cardsRef.current.setColorAt(i, color);
    }
    pinsRef.current.instanceMatrix.needsUpdate = true;
    cardsRef.current.instanceMatrix.needsUpdate = true;
    if (cardsRef.current.instanceColor) cardsRef.current.instanceColor.needsUpdate = true;
  }, [pinCount]);

  return (
    <group>
      {/* Board backing */}
      <mesh position={[-2.2, 2.8, -5.9]} castShadow>
        <boxGeometry args={[4.0, 2.5, 0.08]} />
        <meshStandardMaterial color="#2A1E0E" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Board frame */}
      <mesh position={[-2.2, 2.8, -5.88]}>
        <boxGeometry args={[4.2, 2.7, 0.04]} />
        <meshStandardMaterial color="#3A2818" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Pins */}
      <instancedMesh ref={pinsRef} args={[undefined, undefined, pinCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color="#FF4444" metalness={0.5} roughness={0.3} />
      </instancedMesh>
      {/* Evidence cards */}
      <instancedMesh ref={cardsRef} args={[undefined, undefined, pinCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} metalness={0.1} />
      </instancedMesh>
      {/* Thread connections */}
      {lod.enableDetailProps && (
        <group>
          {Array.from({ length: 5 }).map((_, i) => {
            const x1 = -3.5 + (i % 4) * 0.7;
            const x2 = -3.5 + ((i + 2) % 4) * 0.7;
            const y1 = 2.8 + Math.floor(i / 4) * 0.55;
            const y2 = 2.8 + Math.floor((i + 1) / 4) * 0.55;
            return (
              <mesh key={i} position={[(x1 + x2) / 2, (y1 + y2) / 2, -5.84]}>
                <boxGeometry args={[Math.abs(x2 - x1) || 0.5, 0.005, 0.005]} />
                <meshStandardMaterial color="#CC3333" />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}

// ■■ Surveillance Monitors (Instanced) ■■
function SurveillanceMonitors({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 16 : lod.level === 'high' ? 10 : 6;
  const monitorsRef = useRef<THREE.InstancedMesh>(null);
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!monitorsRef.current || !screensRef.current) return;
    const tmp = new THREE.Matrix4();
    const cols = Math.ceil(count / 2);
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 4.8;
      const y = 1.8 + row * 1.0;
      const z = (col - cols / 2) * 0.9;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
      // Monitor body
      tmp.compose(new THREE.Vector3(x, y, z), rot, new THREE.Vector3(0.6, 0.45, 0.06));
      monitorsRef.current.setMatrixAt(i, tmp);
      // Screen
      tmp.compose(new THREE.Vector3(x - 0.01, y, z), rot, new THREE.Vector3(0.52, 0.38, 0.01));
      screensRef.current.setMatrixAt(i, tmp);
    }
    monitorsRef.current.instanceMatrix.needsUpdate = true;
    screensRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const mat = screensRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.25 + Math.sin(timeRef.current * 3) * 0.1;
  });

  return (
    <group>
      <instancedMesh ref={monitorsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1A1A28" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#002244" emissive={LAB_COLOR} emissiveIntensity={0.25} transparent opacity={0.6} />
      </instancedMesh>
    </group>
  );
}

// ■■ Scanner Beam ■■
function ScannerBeam({ lod, isScanning }: { lod: ReturnType<typeof useStandardLOD>; isScanning: boolean }) {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const segments = lod.level === 'ultra' ? 24 : 12;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (beamRef.current) {
      beamRef.current.rotation.y = timeRef.current * (isScanning ? 1.5 : 0.3);
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = isScanning ? 0.2 + Math.sin(timeRef.current * 4) * 0.1 : 0.05;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = timeRef.current * 0.8;
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isScanning ? 0.8 + Math.sin(timeRef.current * 5) * 0.3 : 0.2;
    }
  });

  return (
    <group position={[0, 4.5, 0]}>
      {/* Emitter device */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.2, 0.3, segments]} />
        <meshStandardMaterial color="#1A2030" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Scanning beam cone */}
      <mesh ref={beamRef} position={[0, -2, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[2.5, 4, segments, 1, true]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.5}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Rotating scan ring */}
      <mesh ref={ringRef} position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.02, 6, segments]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Floating Data Fragments (Instanced) ■■
function DataFragments({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 40 : lod.level === 'high' ? 25 : 12;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 8,
      y: Math.random() * 4 + 0.5,
      z: (Math.random() - 0.5) * 8,
      speed: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const y = ((s.y + timeRef.current * s.speed * 0.15) % 4.5) + 0.5;
      const x = s.x + Math.sin(timeRef.current * 0.5 + s.phase) * 0.3;
      rot.setFromEuler(new THREE.Euler(
        timeRef.current * s.rotSpeed * 0.3,
        timeRef.current * s.rotSpeed * 0.5,
        0
      ));
      tmp.compose(
        new THREE.Vector3(x, y, s.z),
        rot,
        new THREE.Vector3(0.06, 0.04, 0.005)
      );
      meshRef.current.setMatrixAt(i, tmp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!lod.enableParticles) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={0.6}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ■■ Detective Desk with Gadgets ■■
function DetectiveDesk({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  return (
    <group position={[0, 0, 3]}>
      {/* Desk surface */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        <meshStandardMaterial color="#1A1220" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Desk legs */}
      {[[-1.0, 0], [1.0, 0], [-1.0, -0.5], [1.0, -0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]} castShadow>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
          <meshStandardMaterial color="#2A2035" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Gadgets on desk */}
      {lod.enableDetailProps && (
        <>
          {/* Tablet device */}
          <mesh position={[-0.5, 0.78, 0.1]}>
            <boxGeometry args={[0.35, 0.02, 0.25]} />
            <meshStandardMaterial color="#111118" emissive={LAB_COLOR} emissiveIntensity={0.15} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Spy earpiece */}
          <mesh position={[0.4, 0.78, -0.2]}>
            <sphereGeometry args={[0.04, 8, 6]} />
            <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* ID badge */}
          <mesh position={[0.7, 0.78, 0.15]} rotation={[0, 0.3, 0]}>
            <boxGeometry args={[0.15, 0.01, 0.22]} />
            <meshStandardMaterial color="#1A3050" metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Desk lamp */}
          <mesh position={[-0.9, 1.1, -0.3]}>
            <coneGeometry args={[0.12, 0.15, 8]} />
            <meshStandardMaterial color="#444450" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.9, 0.95, -0.3]}>
            <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
            <meshStandardMaterial color="#555560" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Holographic projector */}
          <mesh position={[0, 0.78, -0.1]}>
            <cylinderGeometry args={[0.06, 0.08, 0.05, 12]} />
            <meshStandardMaterial color="#1A2030" emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.8} roughness={0.1} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ■■ Room Enclosure with Neon Grid ■■
function RoomEnclosure({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 2.2, -6]} castShadow>
        <boxGeometry args={[12, 5, 0.12]} />
        <meshStandardMaterial color="#0C0E18" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-6, 2.2, -1]} castShadow>
        <boxGeometry args={[0.12, 5, 10]} />
        <meshStandardMaterial color="#0C0E18" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[6, 2.2, -1]} castShadow>
        <boxGeometry args={[0.12, 5, 10]} />
        <meshStandardMaterial color="#0C0E18" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Neon floor grid lines */}
      {lod.enableDetailProps && (
        <group position={[0, -0.97, 0]}>
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={`h-${i}`} position={[0, 0, -4 + i * 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 0.01]} />
              <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} transparent opacity={0.2} />
            </mesh>
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <mesh key={`v-${i}`} position={[-4 + i * 1.0, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[8, 0.01]} />
              <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} transparent opacity={0.15} />
            </mesh>
          ))}
        </group>
      )}
      {/* Ceiling accent strip */}
      <mesh position={[0, 4.6, -1]}>
        <boxGeometry args={[10, 0.03, 0.1]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface AiSpyEnvironmentProps {
  sceneIndex?: number;
  isScanning?: boolean;
}

export default function AiSpyEnvironment({
  sceneIndex = 0,
  isScanning = false,
}: AiSpyEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#080C16"
      skyTopColor="#030610"
      skyHorizonColor="#0A1628"
      fogColor="#00BBFF"
    >
      <RoomEnclosure lod={lod} />
      <HolographicScreens lod={lod} sceneIndex={sceneIndex} />
      <MagnifyingGlass lod={lod} />
      <EvidencePinboard lod={lod} />
      <SurveillanceMonitors lod={lod} />
      <ScannerBeam lod={lod} isScanning={isScanning} />
      <DataFragments lod={lod} />
      <DetectiveDesk lod={lod} />
      {/* Active scanning spotlight */}
      {isScanning && (
        <pointLight position={[0, 3.5, 0]} intensity={1.2} color={LAB_COLOR} distance={8} />
      )}
    </StandardEnvironmentWrapper>
  );
}
