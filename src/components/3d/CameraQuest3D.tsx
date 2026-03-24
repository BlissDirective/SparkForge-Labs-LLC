'use client';

// ================================================================
// CAMERA QUEST 3D — Lab 7 (Computer Vision) — v3 Enhanced 3D
// [v3] 3D polaroid cards that flip when found
// [v3] Confidence gauge with rotating needle
// [v3] Found card stack grows as items discovered
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ================================================================

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ---- Types ----

interface HuntItemData {
  text: string;
  emoji: string;
  difficulty: 1 | 2 | 3;
  simConfidence: number;
}

interface CameraQuest3DProps {
  items: HuntItemData[];
  currentIndex: number;
  found: Set<number>;
  showConfidence: boolean;
  captured: boolean;
}

// ---- Polaroid Card ----

function PolaroidCard({
  item,
  isActive,
  isFound,
  stackOffset,
}: {
  item: HuntItemData;
  index: number;
  isActive: boolean;
  isFound: boolean;
  stackOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const flipRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Flip animation for found cards
    const targetFlip = isFound ? Math.PI : 0;
    flipRef.current = THREE.MathUtils.lerp(flipRef.current, targetFlip, delta * 4);
    groupRef.current.rotation.y = flipRef.current;

    // Active card float
    if (isActive && !isFound) {
      groupRef.current.position.y =
        0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      groupRef.current.scale.setScalar(
        1.1 + Math.sin(state.clock.elapsedTime * 3) * 0.02
      );
    } else if (isFound) {
      groupRef.current.position.x = 2.5 + stackOffset * 0.25;
      groupRef.current.position.y = stackOffset * 0.02;
      groupRef.current.rotation.z = (stackOffset % 3 - 1) * 0.08;
      groupRef.current.scale.setScalar(0.6);
    } else {
      groupRef.current.scale.setScalar(0.001); // hidden
    }
  });

  return (
    <group ref={groupRef} position={isActive ? [0, 0.5, 0] : [2.5, 0, 0]}>
      {/* White border frame */}
      <mesh>
        <boxGeometry args={[1.1, 1.35, 0.03]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
      </mesh>
      {/* Image area (dark) */}
      <mesh position={[0, 0.1, 0.02]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          color={isActive ? '#1a1a2e' : '#2a2a3e'}
          emissive="#06B6D4"
          emissiveIntensity={isActive ? 0.1 : 0.02}
        />
      </mesh>
      {/* Emoji */}
      <Text
        position={[0, 0.15, 0.04]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {item.emoji}
      </Text>
      {/* Label */}
      <Text
        position={[0, -0.5, 0.02]}
        fontSize={0.08}
        color="#555555"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
      >
        {item.text}
      </Text>
      {/* Difficulty stars */}
      <Text
        position={[0, -0.6, 0.02]}
        fontSize={0.07}
        color="#FBBF24"
        anchorX="center"
        anchorY="middle"
      >
        {'\u2605'.repeat(item.difficulty)}
      </Text>
      {/* Found checkmark (back side) */}
      {isFound && (
        <Text
          position={[0, 0, -0.02]}
          fontSize={0.3}
          color="#10B981"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
        >
          {'\u2713'} FOUND
        </Text>
      )}
    </group>
  );
}

// ---- Confidence Gauge ----

function ConfidenceGauge({
  confidence,
  visible,
}: {
  confidence: number;
  visible: boolean;
}) {
  const needleRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!needleRef.current || !visible) return;
    // Needle angle: -PI/2 (0%) to PI/2 (100%)
    const targetAngle = -Math.PI / 2 + (confidence / 100) * Math.PI;
    needleRef.current.rotation.z = THREE.MathUtils.lerp(
      needleRef.current.rotation.z,
      targetAngle,
      delta * 3
    );
  });

  if (!visible) return null;

  const gaugeColor =
    confidence > 80 ? '#10B981' : confidence > 50 ? '#FBBF24' : '#EF4444';

  return (
    <group position={[0, -1.2, 0]}>
      {/* Arc background */}
      <mesh>
        <torusGeometry args={[0.5, 0.04, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#333333" transparent opacity={0.5} />
      </mesh>
      {/* Colored arc fill */}
      <mesh>
        <torusGeometry args={[0.5, 0.05, 8, 32, Math.PI * (confidence / 100)]} />
        <meshStandardMaterial
          color={gaugeColor}
          emissive={gaugeColor}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Needle */}
      <mesh ref={needleRef} position={[0, 0, 0.05]} rotation={[0, 0, -Math.PI / 2]}>
        <boxGeometry args={[0.02, 0.45, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Center pivot */}
      <mesh position={[0, 0, 0.05]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} />
      </mesh>
      {/* Label */}
      <Text
        position={[0, -0.15, 0]}
        fontSize={0.08}
        color={gaugeColor}
        anchorX="center"
        anchorY="top"
      >
        {`${confidence}% confident`}
      </Text>
    </group>
  );
}

// ---- Scene ----

function QuestScene({
  items,
  currentIndex,
  found,
  showConfidence,
  captured,
}: CameraQuest3DProps) {
  let stackCount = 0;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 5, 3]} intensity={0.6} />
      <pointLight position={[0, 1, 2]} intensity={0.3} color="#06B6D4" />

      {/* All cards */}
      {items.map((item, i) => {
        const isActive = i === currentIndex;
        const isFound = found.has(i);
        const offset = isFound ? stackCount++ : 0;
        return (
          <PolaroidCard
            key={i}
            item={item}
            index={i}
            isActive={isActive}
            isFound={isFound}
            stackOffset={offset}
          />
        );
      })}

      {/* Confidence gauge */}
      <ConfidenceGauge
        confidence={items[currentIndex]?.simConfidence || 0}
        visible={showConfidence && captured}
      />

      <Environment preset="night" />

      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ---- Main Export ----

export default function CameraQuest3D(props: CameraQuest3DProps) {
  return (
    <div
      style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 2, 4], fov: 40 }}
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <QuestScene {...props} />
      </Canvas>
    </div>
  );
}
