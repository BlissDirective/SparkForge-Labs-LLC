'use client';

// ════════════════════════════════════════════════════
// SentimentScannerEnvironment — Emotion Analysis Laboratory (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 8: Language & Communication | Color: #818CF8 (Indigo)
//
// A high-tech emotion analysis laboratory with sentiment instruments:
//   - Giant mood meter centerpiece (half-ring spectrum gauge)
//   - Sentiment wave oscilloscope screens (instanced)
//   - Text input conveyor belt with emotion tags
//   - Feeling spectrum display (color-coded arc)
//   - Social media feed wall (scrolling data panels)
//   - Emoji reaction bubbles floating upward (instanced)
//   - Tone analyzer microphone station
//   - Polarity graph dashboard (positive/negative bars)
//
// Triangle Budget (Desktop Ultra):
//   Mood Meter Centerpiece:           ~70K  (arc gauge + needle + labels)
//   Oscilloscope Screens (inst):      ~60K  (8 screens x ~7.5K)
//   Text Conveyor Belt:               ~55K  (belt + tag boxes)
//   Feeling Spectrum Display:         ~45K  (color-coded arc segments)
//   Social Media Feed Wall:           ~50K  (wall + scrolling panels)
//   Emoji Bubbles (instanced):        ~60K  (40 floating spheres)
//   Tone Analyzer Microphone:         ~45K  (mic + stand + wave ring)
//   Polarity Graph Dashboard:         ~55K  (bars + frame + labels)
//   Room Structure:                   ~60K
//   Total:                            ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#818CF8';

// ■■ Giant Mood Meter Centerpiece ■■
function MoodMeter({ lod, sentiment }: { lod: ReturnType<typeof useStandardLOD>; sentiment: number }) {
  const needleRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const segments = 32;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (needleRef.current) {
      // sentiment: -1 to 1 maps to -PI/2 to PI/2
      const targetAngle = sentiment * (Math.PI / 2.2);
      needleRef.current.rotation.z += (targetAngle - needleRef.current.rotation.z) * delta * 2.0;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.25 + Math.sin(timeRef.current * 1.5) * 0.1;
    }
  });

  const arcColors = useMemo(() => ['#FF4444', '#FF8844', '#FFCC44', '#88CC44', '#44FF88'], []);

  return (
    <group position={[0, 2.5, -4.0]}>
      {/* Gauge backing plate */}
      <mesh>
        <cylinderGeometry args={[1.8, 1.8, 0.12, segments, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#121828" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Color arc segments */}
      {arcColors.map((color, i) => {
        const startAngle = (i / arcColors.length) * Math.PI;
        const arcLength = Math.PI / arcColors.length;
        return (
          <mesh key={`arc-${i}`} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.07]}>
            <torusGeometry args={[1.5, 0.12, 6, segments / 2, arcLength]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              rotation-z={startAngle}
            />
          </mesh>
        );
      })}
      {/* Outer ring */}
      <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
        <torusGeometry args={[1.75, 0.05, 6, segments]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.25}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      {/* Needle */}
      <group ref={needleRef} position={[0, 0, 0.12]}>
        <mesh>
          <boxGeometry args={[0.04, 1.3, 0.02]} />
          <meshStandardMaterial color="#FF3355" emissive="#FF3355" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#2A2040" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Oscilloscope Screens (Instanced) ■■
function OscilloscopeScreens({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = 8;
  const framesRef = useRef<THREE.InstancedMesh>(null);
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!framesRef.current || !screensRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 1.6;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(-0.15, 0, 0));
      // Frame
      tmp.compose(
        new THREE.Vector3(x, 1.3, 5.5),
        rot,
        new THREE.Vector3(1.1, 0.7, 0.08),
      );
      framesRef.current.setMatrixAt(i, tmp);
      // Screen
      tmp.compose(
        new THREE.Vector3(x, 1.3, 5.47),
        rot,
        new THREE.Vector3(1.0, 0.6, 0.02),
      );
      screensRef.current.setMatrixAt(i, tmp);
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    screensRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const mat = screensRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2.5) * 0.12;
  });

  return (
    <group>
      <instancedMesh ref={framesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#141020" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#0A1228"
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Text Conveyor Belt ■■
function TextConveyor({ lod, textsAnalyzed }: { lod: ReturnType<typeof useStandardLOD>; textsAnalyzed: number }) {
  const tagCount = 12;
  const tagsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const tagColors = useMemo(() => {
    const sentimentColors = ['#FF4444', '#FF8844', '#FFCC44', '#88CC44', '#44FF88', '#4488FF', LAB_COLOR];
    return Array.from({ length: tagCount }, (_, i) => sentimentColors[i % sentimentColors.length]);
  }, [tagCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!tagsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < tagCount; i++) {
      const offset = (timeRef.current * 0.5 + (i / tagCount) * 8) % 8;
      const x = offset - 4;
      const bob = Math.sin(timeRef.current * 2 + i * 0.8) * 0.03;
      const processed = i < Math.min(textsAnalyzed, tagCount);
      tmp.makeScale(0.5, 0.25, 0.15);
      tmp.setPosition(x, 0.15 + bob, 0);
      tagsRef.current.setMatrixAt(i, tmp);
      color.set(processed ? tagColors[i] : '#333340');
      tagsRef.current.setColorAt(i, color);
    }
    tagsRef.current.instanceMatrix.needsUpdate = true;
    if (tagsRef.current.instanceColor) tagsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[0, 0, 2.0]}>
      {/* Belt surface */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[9, 0.08, 0.8]} />
        <meshStandardMaterial color="#18142A" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Belt side rails */}
      <mesh position={[0, 0.05, 0.42]}>
        <boxGeometry args={[9, 0.12, 0.04]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, -0.42]}>
        <boxGeometry args={[9, 0.12, 0.04]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Tags */}
      <instancedMesh ref={tagsRef} args={[undefined, undefined, tagCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.2} transparent opacity={0.8} />
      </instancedMesh>
      {/* Rollers at ends */}
      {(
        <>
          <mesh position={[-4.3, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.75, 8]} />
            <meshStandardMaterial color="#2A2040" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[4.3, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.75, 8]} />
            <meshStandardMaterial color="#2A2040" metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ■■ Emoji Reaction Bubbles (Instanced) ■■
function EmojiBubbles({ lod, sentiment }: { lod: ReturnType<typeof useStandardLOD>; sentiment: number }) {
  const count = 40;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 8,
      speed: 0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      size: 0.08 + Math.random() * 0.12,
      startY: -1 + Math.random() * 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const y = ((s.startY + timeRef.current * s.speed * 0.4) % 5) - 0.5;
      const wobbleX = Math.sin(timeRef.current * 0.8 + s.phase) * 0.3;
      tmp.makeScale(s.size, s.size, s.size);
      tmp.setPosition(s.x + wobbleX, y, s.z);
      meshRef.current.setMatrixAt(i, tmp);
      // Color based on sentiment: red=negative, yellow=neutral, green=positive
      const hue = 0.0 + ((sentiment + 1) / 2) * 0.33;
      const saturation = 0.6 + Math.sin(s.phase + timeRef.current) * 0.2;
      color.setHSL(hue, saturation, 0.55);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} transparent opacity={0.6} depthWrite={false} />
    </instancedMesh>
  );
}

// ■■ Social Media Feed Wall ■■
function SocialMediaWall({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const panelCount = 12;
  const panelsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!panelsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < panelCount; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const scrollY = ((row * 0.9 + timeRef.current * 0.15) % 4) - 0.5;
      tmp.makeScale(0.7, 0.35, 0.03);
      tmp.setPosition(-6.8, 1.0 + scrollY, (col - 1) * 1.8);
      panelsRef.current.setMatrixAt(i, tmp);
      const hue = 0.6 + (i / panelCount) * 0.2;
      color.setHSL(hue, 0.4, 0.2);
      panelsRef.current.setColorAt(i, color);
    }
    panelsRef.current.instanceMatrix.needsUpdate = true;
    if (panelsRef.current.instanceColor) panelsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Wall backdrop */}
      <mesh position={[-7.0, 2.0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[6, 4, 0.12]} />
        <meshStandardMaterial color="#10081C" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Feed panels */}
      <instancedMesh ref={panelsRef} args={[undefined, undefined, panelCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.2} transparent opacity={0.7} />
      </instancedMesh>
      {/* Header bar */}
      {(
        <mesh position={[-6.85, 3.8, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[5.5, 0.2, 0.04]} />
          <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Tone Analyzer Microphone Station ■■
function ToneAnalyzer({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const segments = 24;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1.0 + Math.sin(timeRef.current * 3) * 0.08);
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 4) * 0.15;
    }
  });

  return (
    <group position={[5.5, 0, -2]}>
      {/* Microphone stand */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.6, 6]} />
        <meshStandardMaterial color="#2A2040" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.15, segments]} />
        <meshStandardMaterial color="#1A1428" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Microphone head */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.12, segments, segments / 2]} />
        <meshStandardMaterial color="#303848" metalness={0.8} roughness={0.15} />
      </mesh>
      {/* Grille pattern */}
      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.125, 6, 4]} />
        <meshStandardMaterial color="#1A1428" wireframe transparent opacity={0.6} />
      </mesh>
      {/* Sound wave ring */}
      <mesh ref={ringRef} position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.015, 4, segments]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
      {(
        <>
          <mesh position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.45, 0.01, 4, segments]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.008, 4, segments]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.1} transparent opacity={0.2} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ■■ Polarity Graph Dashboard ■■
function PolarityDashboard({ lod, sentiment }: { lod: ReturnType<typeof useStandardLOD>; sentiment: number }) {
  const barCount = 16;
  const barsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!barsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < barCount; i++) {
      const x = (i - (barCount - 1) / 2) * 0.4;
      const normalizedI = i / (barCount - 1); // 0 to 1
      const polarityVal = (normalizedI - 0.5) * 2; // -1 to 1
      const proximity = 1 - Math.abs(polarityVal - sentiment);
      const height = 0.2 + proximity * 1.5 + Math.sin(timeRef.current * 2 + i * 0.5) * 0.1;
      tmp.makeScale(0.25, height, 0.2);
      tmp.setPosition(x, height / 2 - 0.3, 0);
      barsRef.current.setMatrixAt(i, tmp);
      // Red to green gradient
      const hue = normalizedI * 0.33;
      color.setHSL(hue, 0.7, 0.45 + proximity * 0.15);
      barsRef.current.setColorAt(i, color);
    }
    barsRef.current.instanceMatrix.needsUpdate = true;
    if (barsRef.current.instanceColor) barsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[6.0, 1.5, 2.5]} rotation={[0, -Math.PI / 4, 0]}>
      {/* Dashboard frame */}
      <mesh position={[0, 0.3, -0.15]}>
        <boxGeometry args={[barCount * 0.4 + 0.5, 2.5, 0.08]} />
        <meshStandardMaterial color="#0E0820" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Bars */}
      <instancedMesh ref={barsRef} args={[undefined, undefined, barCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.2} transparent opacity={0.8} />
      </instancedMesh>
      {/* Center line (zero marker) */}
      <mesh position={[0, 0.5, 0.01]}>
        <boxGeometry args={[0.01, 2.0, 0.01]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface SentimentScannerEnvironmentProps {
  sentiment?: number;
  textsAnalyzed?: number;
}

export default function SentimentScannerEnvironment({
  sentiment = 0,
  textsAnalyzed = 0,
}: SentimentScannerEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0A0818"
      skyTopColor="#050414"
      skyHorizonColor="#0E0A28"
      fogColor="#818CF8"
    >
      <MoodMeter lod={lod} sentiment={sentiment} />
      <OscilloscopeScreens lod={lod} />
      <TextConveyor lod={lod} textsAnalyzed={textsAnalyzed} />
      <EmojiBubbles lod={lod} sentiment={sentiment} />
      <SocialMediaWall lod={lod} />
      <ToneAnalyzer lod={lod} />
      <PolarityDashboard lod={lod} sentiment={sentiment} />
      {/* Mood-reactive ambient light */}
      <pointLight
        position={[0, 3, -3]}
        intensity={0.6}
        color={sentiment > 0 ? '#44FF88' : sentiment < 0 ? '#FF4444' : '#FFCC44'}
        distance={10}
      />
    </StandardEnvironmentWrapper>
  );
}
