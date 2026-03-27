'use client';

// ════════════════════════════════════════════════════
// EmojiDecoder3D — 3D Translation Machine (2M budget)
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// ════════════════════════════════════════════════════
// Lab 8: AI Communication | Color: #818CF8 (Indigo)
//
// Interactive 3D translation machine that visualizes
// emoji decoding as a mechanical process with gears,
// conveyor belts, and holographic output.
//
// Triangle Budget (Desktop Ultra): ~2K (game component)
// Full environment budget handled by EmojiDecoderEnvironment

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Group, Mesh, MeshStandardMaterial } from 'three';

interface EmojiDecoder3DProps {
  inputEmojis: string[];
  decodedText: string;
  isDecoding: boolean;
  progress: number; // 0-1
}

// ■■ Translation Machine ■■
function TranslationMachine({ isDecoding, progress }: { isDecoding: boolean; progress: number }) {
  const gearRef1 = useRef<Mesh>(null);
  const gearRef2 = useRef<Mesh>(null);
  const conveyorRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = isDecoding ? 3 : 0.5;
    if (gearRef1.current) gearRef1.current.rotation.z = t * speed;
    if (gearRef2.current) gearRef2.current.rotation.z = -t * speed * 0.8;
    if (conveyorRef.current) {
      conveyorRef.current.children.forEach((child, i) => {
        if (isDecoding) {
          child.position.x = ((child.position.x + 0.02) % 3) - 1.5;
        }
        child.position.y = Math.sin(t * 2 + i) * 0.02;
      });
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Machine body */}
      <mesh castShadow>
        <boxGeometry args={[3, 1.5, 1.2]} />
        <meshStandardMaterial color="#1A1A2E" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Input hopper */}
      <mesh position={[-1.2, 1, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial color="#818CF8" metalness={0.5} roughness={0.3} emissive="#818CF8" emissiveIntensity={isDecoding ? 0.3 : 0.1} />
      </mesh>

      {/* Output slot */}
      <mesh position={[1.2, 0.8, 0.5]}>
        <boxGeometry args={[0.6, 0.3, 0.1]} />
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={progress > 0.5 ? 0.4 : 0.1} />
      </mesh>

      {/* Gear 1 */}
      <mesh ref={gearRef1} position={[-0.5, 0.2, 0.65]}>
        <torusGeometry args={[0.25, 0.04, 6, 8]} />
        <meshStandardMaterial color="#818CF8" metalness={0.8} roughness={0.2} emissive="#818CF8" emissiveIntensity={0.2} />
      </mesh>

      {/* Gear 2 */}
      <mesh ref={gearRef2} position={[0.3, 0.2, 0.65]}>
        <torusGeometry args={[0.2, 0.035, 6, 8]} />
        <meshStandardMaterial color="#6366F1" metalness={0.8} roughness={0.2} emissive="#6366F1" emissiveIntensity={0.2} />
      </mesh>

      {/* Progress bar */}
      <mesh position={[0, -0.85, 0.55]}>
        <boxGeometry args={[progress * 2.8, 0.08, 0.02]} />
        <meshBasicMaterial color="#818CF8" />
      </mesh>

      {/* Conveyor belt segments */}
      <group ref={conveyorRef} position={[0, -0.3, 0.6]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[-1.5 + i * 0.5, 0, 0]}>
            <boxGeometry args={[0.4, 0.04, 0.3]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ■■ Emoji Input Display ■■
function EmojiDisplay({ emojis }: { emojis: string[] }) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 1.5 + i * 0.8) * 0.1;
    });
  });

  return (
    <group ref={groupRef}>
      {emojis.slice(0, 5).map((emoji, i) => (
        <group key={i} position={[-1 + i * 0.5, 1.8, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshStandardMaterial color="#818CF8" emissive="#818CF8" emissiveIntensity={0.3} transparent opacity={0.3} />
          </mesh>
          <Text position={[0, 0, 0.16]} fontSize={0.18} anchorX="center" anchorY="middle">
            {emoji}
          </Text>
        </group>
      ))}
    </group>
  );
}

// ■■ Decoded Output ■■
function DecodedOutput({ text, progress }: { text: string; progress: number }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = -1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    const mat = meshRef.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = 0.1 + progress * 0.3;
  });

  if (progress < 0.3) return null;

  return (
    <group position={[0, -1, 0.8]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[2.5, 0.4, 0.05]} />
        <meshStandardMaterial color="#1E1B4B" emissive="#818CF8" emissiveIntensity={0.2} transparent opacity={0.8} />
      </mesh>
      <Text position={[0, -1, 0.85]} fontSize={0.12} color="#E0E7FF" anchorX="center" anchorY="middle" maxWidth={2.2}>
        {text}
      </Text>
    </group>
  );
}

// ■■ Scene ■■
function Scene({ inputEmojis, decodedText, isDecoding, progress }: EmojiDecoder3DProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 4]} intensity={0.8} castShadow />
      <pointLight position={[0, 2, 2]} intensity={0.5} color="#818CF8" distance={8} />

      <TranslationMachine isDecoding={isDecoding} progress={progress} />
      <EmojiDisplay emojis={inputEmojis} />
      <DecodedOutput text={decodedText} progress={progress} />

    </>
  );
}

// ■■ Main Export ■■
export default function EmojiDecoder3D({
  inputEmojis,
  decodedText,
  isDecoding,
  progress,
}: EmojiDecoder3DProps) {
  return (
    <group>
      <Scene inputEmojis={inputEmojis} decodedText={decodedText} isDecoding={isDecoding} progress={progress} />
    </group>
  );
}
