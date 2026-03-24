'use client';

// ════════════════════════════════════════════════════
// DataShieldEnvironment — Cybersecurity Command Center (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 6: AI Safety | Color: #FF6644 (Orange/Red)
//
// A high-tech cybersecurity command center where players protect
// data from threats using shields, firewalls, and encryption:
//   - Hexagonal shield generator in center (animated rotation)
//   - Data stream tunnels with interceptable packets (instanced)
//   - Firewall barrier walls (translucent energy panels)
//   - Privacy vault with lock mechanisms
//   - Threat detection radar (rotating sweep)
//   - Encryption cipher wheels (rotating rings)
//   - Personal data lockers with shield icons (instanced)
//   - Intrusion alert beacons (instanced, pulsing)
//
// Triangle Budget (Desktop Ultra):
//   Shield Generator:            ~80K  (hexagonal core + rings)
//   Data Stream Tunnels:         ~60K  (instanced tunnel segments + packets)
//   Firewall Barriers:           ~50K  (4 translucent walls)
//   Privacy Vault:               ~60K  (vault body + lock + door)
//   Threat Radar:                ~40K  (dish + sweep arm + base)
//   Cipher Wheels:               ~50K  (3 concentric rings)
//   Data Lockers (instanced):    ~80K  (12 lockers x ~6.6K)
//   Alert Beacons (instanced):   ~40K  (8 beacons x ~5K)
//   Floor/Wall accents:          ~40K
//   Total:                       ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#FF6644';

// ■■ Hexagonal Shield Generator (Center) ■■
function ShieldGenerator({ lod, shieldStrength }: { lod: ReturnType<typeof useStandardLOD>; shieldStrength: number }) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const strengthNorm = Math.min(shieldStrength / 100, 1);
    if (outerRef.current) {
      outerRef.current.rotation.y += delta * 0.3;
      outerRef.current.rotation.z = Math.sin(timeRef.current * 0.5) * 0.1;
      (outerRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + strengthNorm * 0.5 + Math.sin(timeRef.current * 2) * 0.1;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.5;
      (innerRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.2 + strengthNorm * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.4;
      ringRef.current.rotation.z += delta * 0.2;
    }
  });

  const segments = 6;

  return (
    <group position={[0, 1.5, 0]}>
      {/* Core hexagonal prism */}
      <mesh ref={outerRef} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 1.2, segments]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Inner shield sphere */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.5, 2} />
        <meshStandardMaterial
          color="#00FF88"
          emissive="#00FF88"
          emissiveIntensity={0.6}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
      {/* Orbiting ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.04, 8, 32} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Base pedestal */}
      <mesh position={[0, -1.0, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.2, 0.3, segments]} />
        <meshStandardMaterial color="#1A1218" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Data Stream Tunnels with Packets (Instanced) ■■
function DataStreamTunnels({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const packetCount = 40;
  const packetsRef = useRef<THREE.InstancedMesh>(null);
  const tubeRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const tubeCount = 4;

  const packetSeeds = useMemo(() =>
    Array.from({ length: packetCount }, (_, i) => ({
      tunnel: i % tubeCount,
      offset: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.0,
      size: 0.04 + Math.random() * 0.06,
    })),
  [packetCount]);

  React.useEffect(() => {
    if (!tubeRef.current) return;
    const tmp = new THREE.Matrix4();
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (let i = 0; i < tubeCount; i++) {
      const angle = angles[i];
      const x = Math.cos(angle) * 4;
      const z = Math.sin(angle) * 4;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, -angle, Math.PI / 2));
      tmp.compose(
        new THREE.Vector3(x * 0.5, 0.8, z * 0.5),
        rot,
        new THREE.Vector3(0.2, 4, 0.2),
      );
      tubeRef.current.setMatrixAt(i, tmp);
    }
    tubeRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!packetsRef.current) return;
    const tmp = new THREE.Matrix4();
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const color = new THREE.Color();
    for (let i = 0; i < packetCount; i++) {
      const s = packetSeeds[i];
      const angle = angles[s.tunnel];
      const t = ((timeRef.current * s.speed + s.offset) % (Math.PI * 2)) / (Math.PI * 2);
      const dist = t * 4;
      const x = Math.cos(angle) * dist * 0.5;
      const z = Math.sin(angle) * dist * 0.5;
      tmp.makeScale(s.size, s.size, s.size);
      tmp.setPosition(x, 0.8 + Math.sin(timeRef.current + i) * 0.05, z);
      packetsRef.current.setMatrixAt(i, tmp);
      color.setHSL(t * 0.3, 0.9, 0.6);
      packetsRef.current.setColorAt(i, color);
    }
    packetsRef.current.instanceMatrix.needsUpdate = true;
    if (packetsRef.current.instanceColor) packetsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={tubeRef} args={[undefined, undefined, tubeCount]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#1A1520" transparent opacity={0.15} metalness={0.5} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={packetsRef} args={[undefined, undefined, packetCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.6} metalness={0.3} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Firewall Barrier Walls ■■
function FirewallBarriers({ lod: _lod, shieldStrength }: { lod: ReturnType<typeof useStandardLOD>; shieldStrength: number }) {
  const wallsRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!wallsRef.current) return;
    const strengthNorm = Math.min(shieldStrength / 100, 1);
    wallsRef.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = 0.08 + strengthNorm * 0.15 + Math.sin(timeRef.current * 1.5 + i) * 0.03;
        mat.emissiveIntensity = 0.2 + strengthNorm * 0.4;
      }
    });
  });

  const positions: [number, number, number, number, number, number][] = [
    [-5, 1.5, 0, 0.05, 3.0, 8],
    [5, 1.5, 0, 0.05, 3.0, 8],
    [0, 1.5, -5, 8, 3.0, 0.05],
    [0, 1.5, 5, 8, 3.0, 0.05],
  ];

  return (
    <group ref={wallsRef}>
      {positions.map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={LAB_COLOR}
            emissive={LAB_COLOR}
            emissiveIntensity={0.3}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Privacy Vault ■■
function PrivacyVault({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const lockRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (lockRef.current) {
      lockRef.current.rotation.z = Math.sin(timeRef.current * 0.8) * 0.15;
      (lockRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 2) * 0.15;
    }
  });

  const segments = 16;

  return (
    <group position={[-3.5, 0, -3]}>
      {/* Vault body */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.8, 1.6, 1.2]} />
        <meshStandardMaterial color="#1A1420" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Vault door */}
      <mesh position={[0, 0.8, 0.61]} castShadow>
        <boxGeometry args={[1.5, 1.3, 0.08]} />
        <meshStandardMaterial color="#2A2030" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Circular lock */}
      <mesh ref={lockRef} position={[0, 0.8, 0.66]}>
        <torusGeometry args={[0.3, 0.05, 8, segments]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Lock handle bar */}
      <mesh position={[0.4, 0.8, 0.66]}>
        <boxGeometry args={[0.3, 0.06, 0.06]} />
        <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Threat Detection Radar ■■
function ThreatRadar({ lod, threatsBlocked }: { lod: ReturnType<typeof useStandardLOD>; threatsBlocked: number }) {
  const sweepRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (sweepRef.current) {
      sweepRef.current.rotation.y = timeRef.current * 1.5;
    }
  });

  const segments = 32;

  return (
    <group position={[3.5, 0, -3]}>
      {/* Radar base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.3, segments]} />
        <meshStandardMaterial color="#1A1420" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Radar dish */}
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, segments]} />
        <meshStandardMaterial
          color="#0A1020"
          emissive="#00FF88"
          emissiveIntensity={0.1}
          metalness={0.3}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Sweep arm */}
      <mesh ref={sweepRef} position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.65, 0.02]} />
        <meshStandardMaterial
          color="#00FF88"
          emissive="#00FF88"
          emissiveIntensity={0.8}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Threat count indicator ring */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.65, segments]} />
        <meshStandardMaterial
          color={threatsBlocked > 5 ? '#FF6644' : '#00FF88'}
          emissive={threatsBlocked > 5 ? '#FF6644' : '#00FF88'}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ■■ Encryption Cipher Wheels ■■
function CipherWheels({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.3;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.5;
    if (ring3Ref.current) ring3Ref.current.rotation.z += delta * 0.7;
  });

  const segments = 32;

  return (
    <group position={[3.5, 1.8, 3]}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.8, 0.06, 8, segments]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.6, 0.05, 8, segments]} />
        <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[0.4, 0.04, 8, segments]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Center keyhole */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 6]} />
        <meshStandardMaterial color="#1A1420" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ■■ Personal Data Lockers (Instanced) ■■
function DataLockers({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = 12;
  const lockersRef = useRef<THREE.InstancedMesh>(null);
  const shieldIconsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!lockersRef.current || !shieldIconsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 6;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      // Locker body
      tmp.makeScale(0.5, 0.8, 0.4);
      tmp.setPosition(x, 0.4, z);
      lockersRef.current.setMatrixAt(i, tmp);
      // Shield icon on front
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, -angle, 0));
      tmp.compose(
        new THREE.Vector3(
          Math.cos(angle) * (r - 0.21),
          0.4,
          Math.sin(angle) * (r - 0.21),
        ),
        rot,
        new THREE.Vector3(0.15, 0.15, 0.02),
      );
      shieldIconsRef.current.setMatrixAt(i, tmp);
    }
    lockersRef.current.instanceMatrix.needsUpdate = true;
    shieldIconsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!shieldIconsRef.current) return;
    const mat = shieldIconsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.5) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={lockersRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1A1520" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={shieldIconsRef} args={[undefined, undefined, count]}>
        <circleGeometry args={[1, 6]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.4}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Intrusion Alert Beacons (Instanced) ■■
function AlertBeacons({ lod, threatsBlocked }: { lod: ReturnType<typeof useStandardLOD>; threatsBlocked: number }) {
  const count = 8;
  const beaconsRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!beaconsRef.current || !lightRef.current) return;
    const tmp = new THREE.Matrix4();
    const corners = [
      [-5, 0, -5], [5, 0, -5], [-5, 0, 5], [5, 0, 5],
      [-5, 0, 0], [5, 0, 0], [0, 0, -5], [0, 0, 5],
    ];
    for (let i = 0; i < count; i++) {
      const [cx, _cy, cz] = corners[i % corners.length];
      // Beacon pole
      tmp.makeScale(0.08, 1.5, 0.08);
      tmp.setPosition(cx, 0.75, cz);
      beaconsRef.current.setMatrixAt(i, tmp);
      // Beacon light
      tmp.makeScale(0.12, 0.12, 0.12);
      tmp.setPosition(cx, 1.6, cz);
      lightRef.current.setMatrixAt(i, tmp);
    }
    beaconsRef.current.instanceMatrix.needsUpdate = true;
    lightRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lightRef.current) return;
    const mat = lightRef.current.material as THREE.MeshStandardMaterial;
    const alertLevel = Math.min(threatsBlocked / 10, 1);
    mat.emissiveIntensity = alertLevel > 0.5
      ? 0.5 + Math.sin(timeRef.current * 6) * 0.4
      : 0.2 + Math.sin(timeRef.current * 2) * 0.1;
  });

  return (
    <group>
      <instancedMesh ref={beaconsRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#2A1A18" metalness={0.6} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={lightRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.4}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface DataShieldEnvironmentProps {
  shieldStrength?: number;
  threatsBlocked?: number;
}

export default function DataShieldEnvironment({
  shieldStrength = 50,
  threatsBlocked = 0,
}: DataShieldEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0A0A"
      skyTopColor="#0A0408"
      skyHorizonColor="#1A0E12"
      fogColor="#FF6644"
    >
      <ShieldGenerator lod={lod} shieldStrength={shieldStrength} />
      <DataStreamTunnels lod={lod} />
      <FirewallBarriers lod={lod} shieldStrength={shieldStrength} />
      <PrivacyVault lod={lod} />
      <ThreatRadar lod={lod} threatsBlocked={threatsBlocked} />
      <CipherWheels lod={lod} />
      <DataLockers lod={lod} />
      <AlertBeacons lod={lod} threatsBlocked={threatsBlocked} />
      {/* Alert lighting when under heavy attack */}
      {threatsBlocked > 5 && (
        <pointLight position={[0, 3, 0]} intensity={1.2} color="#FF4444" distance={12} />
      )}
    </StandardEnvironmentWrapper>
  );
}
