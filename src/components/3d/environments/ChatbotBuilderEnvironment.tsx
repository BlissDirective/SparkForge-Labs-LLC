'use client';

// ════════════════════════════════════════════════════
// ChatbotBuilderEnvironment — Communication Command Center (FL-Lite 1.2M budget)
// ════════════════════════════════════════════════════
// Lab 8: AI Communication | Color: #818CF8 (Indigo)
//
// Communication command center with chat bubble landscape,
// server tower racks, holographic conversation tree,
// antenna array, message stream particles, operator consoles,
// floating emoji indicators, and signal wave rings.
//
// Triangle Budget (Desktop Ultra):
//   Chat Bubble Landscape:     ~200K (giant 3D speech bubbles)
//   Server Tower Racks:        ~180K (instanced server towers)
//   Conversation Tree Display: ~150K (holographic tree structure)
//   Antenna Array:             ~100K (signal transmission towers)
//   Message Stream Particles:  ~120K (flowing between nodes)
//   Operator Consoles:         ~140K (desks with screens)
//   Emoji/Sentiment Indicators:~80K  (floating indicators)
//   Signal Wave Rings:         ~80K  (expanding from center)
//   Base Environment:          ~70K  (terrain + sky + fog)
//   Total:                     ~1.2M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLLiteEnvironmentWrapper } from './FLLiteEnvironmentBase';

// ■■ Chat Bubble Landscape ■■
function ChatBubbles() {
  const count = 18;
  const ref = useRef<THREE.InstancedMesh>(null);

  const configs = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (Math.random() - 0.5) * 16,
    y: 0.5 + Math.random() * 3,
    z: (Math.random() - 0.5) * 16,
    scale: 0.3 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
    isLeft: i % 2 === 0,
  })), [count]);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const c = configs[i];
      temp.makeScale(c.scale, c.scale * 0.7, c.scale * 0.4);
      temp.setPosition(c.x, c.y, c.z);
      ref.current.setMatrixAt(i, temp);
      ref.current.setColorAt(i, new THREE.Color(c.isLeft ? '#818CF8' : '#A78BFA'));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [count, configs]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      ref.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      pos.y = configs[i].y + Math.sin(clock.elapsedTime * 0.5 + configs[i].phase) * 0.15;
      temp.compose(pos, quat, scl);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 10]} />
      <meshStandardMaterial color="#818CF8" emissive="#818CF8" emissiveIntensity={0.15} transparent opacity={0.6} metalness={0.3} roughness={0.5} />
    </instancedMesh>
  );
}

// ■■ Server Tower Racks ■■
function ServerTowers() {
  const count = 16;
  const towersRef = useRef<THREE.InstancedMesh>(null);
  const ledsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!towersRef.current || !ledsRef.current) return;
    const tTemp = new THREE.Matrix4();
    const lTemp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const x = -8 + row * 1.2;
      const z = (col - 1.5) * 1.4;
      tTemp.makeTranslation(x, 0.5, z);
      towersRef.current.setMatrixAt(i, tTemp);
      lTemp.makeScale(0.03, 0.03, 0.03);
      lTemp.setPosition(x + 0.3, 0.8 + (i % 5) * 0.15, z + 0.26);
      ledsRef.current.setMatrixAt(i, lTemp);
    }
    towersRef.current.instanceMatrix.needsUpdate = true;
    ledsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ledsRef.current) return;
    const temp = new THREE.Matrix4();
    const _pos = new THREE.Vector3();
    const _quat = new THREE.Quaternion();
    const _scl = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      ledsRef.current.getMatrixAt(i, temp);
      ledsRef.current.setColorAt(i, new THREE.Color(
        Math.sin(clock.elapsedTime * 3 + i * 1.2) > 0 ? '#818CF8' : '#4C51BF'
      ));
    }
    if (ledsRef.current.instanceColor) ledsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={towersRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[0.6, 2.2, 0.5]} />
        <meshStandardMaterial color="#111118" metalness={0.7} roughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={ledsRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#818CF8" />
      </instancedMesh>
    </group>
  );
}

// ■■ Holographic Conversation Tree ■■
function ConversationTree({ activeNodeCount }: { activeNodeCount: number }) {
  const maxNodes = 20;
  const visibleNodes = Math.min(activeNodeCount, maxNodes);
  const groupRef = useRef<THREE.Group>(null);

  const nodePositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const layers = [1, 2, 3, 4, 5, 5];
    let idx = 0;
    for (let l = 0; l < layers.length && idx < maxNodes; l++) {
      const layerCount = Math.min(layers[l], maxNodes - idx);
      for (let n = 0; n < layerCount; n++) {
        const x = (n - (layerCount - 1) / 2) * 1.2;
        const y = 4.5 - l * 0.8;
        positions.push(new THREE.Vector3(x, y, 0));
        idx++;
      }
    }
    return positions;
  }, [maxNodes]);

  const lineGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    let idx = 0;
    const layers = [1, 2, 3, 4, 5, 5];
    const layerStarts: number[] = [];
    for (let l = 0; l < layers.length; l++) {
      layerStarts.push(idx);
      idx += Math.min(layers[l], maxNodes - idx);
      if (idx >= maxNodes) break;
    }
    for (let l = 0; l < layerStarts.length - 1; l++) {
      const thisStart = layerStarts[l];
      const nextStart = layerStarts[l + 1];
      const thisEnd = nextStart;
      const nextEnd = l + 2 < layerStarts.length ? layerStarts[l + 2] : nodePositions.length;
      for (let p = thisStart; p < thisEnd && p < nodePositions.length; p++) {
        for (let c = nextStart; c < nextEnd && c < nodePositions.length; c++) {
          if (Math.abs(nodePositions[c].x - nodePositions[p].x) < 1.5) {
            points.push(nodePositions[p], nodePositions[c]);
          }
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [nodePositions, maxNodes]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.2;
  });

  return (
    <group ref={groupRef} position={[0, 0, -3]}>
      {nodePositions.slice(0, visibleNodes).map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial color="#818CF8" emissive="#818CF8" emissiveIntensity={0.6} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#818CF8" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
}

// ■■ Antenna Array ■■
function AntennaArray() {
  const antennaCount = 5;

  return (
    <group position={[7, 0, -5]}>
      {Array.from({ length: antennaCount }).map((_, i) => {
        const x = (i - 2) * 1.0;
        const height = 3 + Math.sin(i * 1.2) * 1;
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.04, 0.06, height, 6]} />
              <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, height / 2, 0]}>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshStandardMaterial color="#818CF8" emissive="#818CF8" emissiveIntensity={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ■■ Message Stream Particles ■■
function MessageParticles({ isTestMode }: { isTestMode: boolean }) {
  const count = 200;
  const ref = useRef<THREE.InstancedMesh>(null);

  const speeds = useMemo(() => Array.from({ length: count }, () => ({
    v: 0.5 + Math.random() * 2.0,
    angle: Math.random() * Math.PI * 2,
    radius: 2 + Math.random() * 6,
    yBase: Math.random() * 3,
  })), [count]);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const s = speeds[i];
      const x = Math.cos(s.angle) * s.radius;
      const z = Math.sin(s.angle) * s.radius;
      temp.makeScale(0.04, 0.04, 0.04);
      temp.setPosition(x, s.yBase, z);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, speeds]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    const speedMult = isTestMode ? 2.0 : 1.0;
    for (let i = 0; i < count; i++) {
      ref.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      const s = speeds[i];
      const angle = s.angle + clock.elapsedTime * s.v * 0.2 * speedMult;
      pos.x = Math.cos(angle) * s.radius;
      pos.z = Math.sin(angle) * s.radius;
      pos.y = s.yBase + Math.sin(clock.elapsedTime * 0.8 + i) * 0.3;
      temp.compose(pos, quat, scl);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color="#A78BFA" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ■■ Signal Wave Rings ■■
function SignalWaveRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const ringCount = 4;

  useFrame(({ clock }) => {
    if (!ringsRef.current) return;
    ringsRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const t = (clock.elapsedTime * 0.5 + i * 0.25) % 1;
        const scale = 0.5 + t * 4;
        child.scale.set(scale, scale, 1);
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - t) * 0.3;
      }
    });
  });

  return (
    <group ref={ringsRef} position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {Array.from({ length: ringCount }).map((_, i) => (
        <mesh key={i}>
          <ringGeometry args={[0.95, 1.0, 32]} />
          <meshBasicMaterial color="#818CF8" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Main Environment ■■
interface ChatbotBuilderEnvironmentProps {
  isTestMode: boolean;
  activeNodeCount: number;
}

export default function ChatbotBuilderEnvironment({ isTestMode, activeNodeCount }: ChatbotBuilderEnvironmentProps) {

  return (
    <FLLiteEnvironmentWrapper
      labColor="#818CF8"
      terrainColor="#0A0A18"
      skyTopColor="#04041A"
      skyHorizonColor="#0E0E30"
      fogColor="#818CF8"
    >
      <ChatBubbles />
      <ServerTowers />
      <ConversationTree activeNodeCount={activeNodeCount} />
      <AntennaArray />
      {<MessageParticles isTestMode={isTestMode} />}
      <SignalWaveRings />
    </FLLiteEnvironmentWrapper>
  );
}
