'use client';

// ════════════════════════════════════════════════════
// AiOrNot3D — 3D Art Gallery Judge (2M budget)
// ════════════════════════════════════════════════════
// Lab 10: AI Futures | Color: #D946EF (Fuchsia)
//
// Interactive 3D gallery scene where players judge whether
// creative works are human-made or AI-generated. Features
// a display pedestal, voting buttons, and verdict effects.
//
// Triangle Budget (Desktop Ultra): ~2K (game component)
// Full environment budget handled by AiOrNotEnvironment

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

interface AiOrNot3DProps {
  currentItem: { title: string; emoji: string; isAI: boolean } | null;
  verdict: 'human' | 'ai' | null;
  isCorrect: boolean | null;
  score: number;
  total: number;
}

// ■■ Display Pedestal ■■
function DisplayPedestal({ emoji, isRevealing }: { emoji: string; isRevealing: boolean }) {
  const pedestalRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pedestalRef.current) {
      pedestalRef.current.rotation.y = t * 0.2;
    }
    if (frameRef.current) {
      frameRef.current.position.y = 0.8 + Math.sin(t * 0.8) * 0.05;
      if (isRevealing) {
        frameRef.current.scale.setScalar(1 + Math.sin(t * 6) * 0.05);
      }
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Pedestal */}
      <mesh ref={pedestalRef} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 0.8, 16]} />
        <meshStandardMaterial color="#1A1A2E" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Pedestal ring */}
      <mesh position={[0, 0.42, 0]}>
        <torusGeometry args={[0.65, 0.03, 6, 24]} />
        <meshStandardMaterial color="#D946EF" emissive="#D946EF" emissiveIntensity={0.3} />
      </mesh>

      {/* Floating frame */}
      <group ref={frameRef} position={[0, 0.8, 0]}>
        {/* Frame border */}
        <mesh>
          <boxGeometry args={[1.6, 1.2, 0.06]} />
          <meshStandardMaterial color="#D946EF" metalness={0.6} roughness={0.3} emissive="#D946EF" emissiveIntensity={0.1} />
        </mesh>
        {/* Inner canvas */}
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#111118" roughness={0.8} />
        </mesh>
        {/* Artwork emoji */}
        <Text position={[0, 0, 0.08]} fontSize={0.5} anchorX="center" anchorY="middle">
          {emoji}
        </Text>
      </group>

      {/* Spotlight */}
      <pointLight position={[0, 2.5, 1]} intensity={1} color="#D946EF" distance={5} />
    </group>
  );
}

// ■■ Voting Buttons ■■
function VotingButtons({ verdict }: { verdict: 'human' | 'ai' | null }) {
  const humanRef = useRef<THREE.Mesh>(null);
  const aiRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (humanRef.current) {
      const isSelected = verdict === 'human';
      const targetScale = isSelected ? 1.2 : 1;
      humanRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      humanRef.current.position.y = -1 + Math.sin(t * 1.5) * 0.03;
    }
    if (aiRef.current) {
      const isSelected = verdict === 'ai';
      const targetScale = isSelected ? 1.2 : 1;
      aiRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      aiRef.current.position.y = -1 + Math.sin(t * 1.5 + 1) * 0.03;
    }
  });

  return (
    <group>
      {/* Human button */}
      <group position={[-1.2, -1, 1.5]}>
        <mesh ref={humanRef} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.15, 16]} />
          <meshStandardMaterial
            color={verdict === 'human' ? '#3B82F6' : '#1E3A5F'}
            metalness={0.5}
            roughness={0.3}
            emissive="#3B82F6"
            emissiveIntensity={verdict === 'human' ? 0.5 : 0.1}
          />
        </mesh>
        <Text position={[0, 0.15, 0]} fontSize={0.12} color="#93C5FD" anchorX="center" anchorY="bottom">
          HUMAN
        </Text>
      </group>

      {/* AI button */}
      <group position={[1.2, -1, 1.5]}>
        <mesh ref={aiRef} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.15, 16]} />
          <meshStandardMaterial
            color={verdict === 'ai' ? '#D946EF' : '#581C87'}
            metalness={0.5}
            roughness={0.3}
            emissive="#D946EF"
            emissiveIntensity={verdict === 'ai' ? 0.5 : 0.1}
          />
        </mesh>
        <Text position={[0, 0.15, 0]} fontSize={0.12} color="#E9D5FF" anchorX="center" anchorY="bottom">
          AI
        </Text>
      </group>
    </group>
  );
}

// ■■ Verdict Indicator ■■
function VerdictRing({ isCorrect }: { isCorrect: boolean | null }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = isCorrect !== null ? 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.2 : 0;
  });

  if (isCorrect === null) return null;

  return (
    <mesh ref={ringRef} position={[0, 0.3, 0.5]}>
      <ringGeometry args={[0.9, 1, 32]} />
      <meshBasicMaterial
        color={isCorrect ? '#10B981' : '#EF4444'}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ■■ Score Display ■■
function ScoreDisplay({ score, total }: { score: number; total: number }) {
  return (
    <group position={[0, 2.2, -1]}>
      <mesh>
        <boxGeometry args={[1.5, 0.4, 0.05]} />
        <meshStandardMaterial color="#1A1A2E" metalness={0.5} roughness={0.3} />
      </mesh>
      <Text position={[0, 0, 0.04]} fontSize={0.15} color="#D946EF" anchorX="center" anchorY="middle">
        {score} / {total}
      </Text>
    </group>
  );
}

// ■■ Scene ■■
function Scene({ currentItem, verdict, isCorrect, score, total }: AiOrNot3DProps) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={0.7} castShadow />
      <pointLight position={[-3, 2, 2]} intensity={0.3} color="#D946EF" distance={10} />

      {currentItem && <DisplayPedestal emoji={currentItem.emoji} isRevealing={verdict !== null} />}
      <VotingButtons verdict={verdict} />
      <VerdictRing isCorrect={isCorrect} />
      <ScoreDisplay score={score} total={total} />

      <Environment preset="night" />
      <EffectComposer>
        <Bloom intensity={0.3} luminanceThreshold={0.5} />
      </EffectComposer>
    </>
  );
}

// ■■ Main Export ■■
export default function AiOrNot3D({
  currentItem,
  verdict,
  isCorrect,
  score,
  total,
}: AiOrNot3DProps) {
  return (
    <div className="w-full h-48 md:h-56 relative">
      <Canvas camera={{ position: [0, 0.5, 4], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <Scene currentItem={currentItem} verdict={verdict} isCorrect={isCorrect} score={score} total={total} />
      </Canvas>
    </div>
  );
}
