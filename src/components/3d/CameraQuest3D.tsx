// ENH: Camera flash + polaroid develop + chrome gauge + flip sparks
'use client';

// ================================================================
// CAMERA QUEST 3D — Lab 7 (Computer Vision) — v3 Enhanced 3D
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// [v3] 3D polaroid cards that flip when found
// [v3] Confidence gauge with rotating needle
// [v3] Found card stack grows as items discovered
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// [ENH] Camera flash effect — emissive white plane spike on capture
// [ENH] Polaroid develop effect — found cards fade from white to image
// [ENH] Chrome confidence gauge (metalness=0.8, roughness=0.2)
// [ENH] Spark particles on card flip via shared gameParticles library
// ================================================================

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, invalidate } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Points,
  Vector3,
} from 'three';
import {
  spawnParticles,
  updateParticles,
  PARTICLE_PRESETS,
  Particle,
} from '@/lib/3d/gameParticles';
import CameraQuestEnvironment from '@/components/3d/environments/CameraQuestEnvironment';

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

// ---- ENH: Camera Flash Effect ----

function CameraFlash({ captured }: { captured: boolean }) {
  const meshRef = useRef<Mesh>(null);
  const flashOpacity = useRef(0);
  const prevCaptured = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Trigger flash when captured goes from false to true
    if (captured && !prevCaptured.current) {
      flashOpacity.current = 1.0;
    }
    prevCaptured.current = captured;

    // Decay flash opacity quickly (300ms total)
    if (flashOpacity.current > 0) {
      flashOpacity.current = Math.max(0, flashOpacity.current - delta * 3.3);
      const mat = meshRef.current.material as MeshStandardMaterial;
      mat.opacity = flashOpacity.current;
      mat.emissiveIntensity = flashOpacity.current * 3.0;
      invalidate();
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1.5]}>
      <planeGeometry args={[6, 6]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0}
        transparent
        opacity={0}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ---- ENH: Flip Spark Particles ----

function FlipSparkParticles({ particles }: { particles: Particle[] }) {
  const pointsRef = useRef<Points>(null);
  const maxCount = 30; // sparkShower preset count

  const posBuffer = useMemo(() => new Float32Array(maxCount * 3), []);
  const colBuffer = useMemo(() => new Float32Array(maxCount * 3), []);

  useFrame(() => {
    if (!pointsRef.current || particles.length === 0) return;

    for (let i = 0; i < maxCount; i++) {
      if (i < particles.length && particles[i].life > 0) {
        const p = particles[i];
        posBuffer[i * 3] = p.position.x;
        posBuffer[i * 3 + 1] = p.position.y;
        posBuffer[i * 3 + 2] = p.position.z;
        colBuffer[i * 3] = p.color.r;
        colBuffer[i * 3 + 1] = p.color.g;
        colBuffer[i * 3 + 2] = p.color.b;
      } else {
        posBuffer[i * 3 + 1] = -100; // hide offscreen
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    invalidate();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posBuffer, 3]} count={maxCount} />
        <bufferAttribute attach="attributes-color" args={[colBuffer, 3]} count={maxCount} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

// ---- Polaroid Card (ENH: develop effect — white fades to image color) ----

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
  const groupRef = useRef<Group>(null);
  const imageRef = useRef<Mesh>(null);
  const flipRef = useRef(0);
  // ENH: Track develop progress (0 = white, 1 = fully developed)
  const developProgress = useRef(0);
  const wasFound = useRef(false);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Flip animation for found cards
    const targetFlip = isFound ? Math.PI : 0;
    flipRef.current = MathUtils.lerp(flipRef.current, targetFlip, delta * 4);
    groupRef.current.rotation.y = flipRef.current;

    // ENH: Polaroid develop effect — found cards fade from white to image
    if (isFound && !wasFound.current) {
      developProgress.current = 0; // reset on newly found
    }
    wasFound.current = isFound;

    if (isFound && developProgress.current < 1) {
      developProgress.current = Math.min(1, developProgress.current + delta); // ~1s to develop
    }

    if (imageRef.current && isFound) {
      const mat = imageRef.current.material as MeshStandardMaterial;
      // Lerp from white (#ffffff) to the dark image area (#2a2a3e)
      const targetColor = new Color('#2a2a3e');
      const whiteColor = new Color('#ffffff');
      const currentColor = whiteColor.lerp(targetColor, developProgress.current);
      mat.color.copy(currentColor);
      mat.emissiveIntensity = 0.02 + developProgress.current * 0.08;
    }

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

    invalidate();
  });

  return (
    <group ref={groupRef} position={isActive ? [0, 0.5, 0] : [2.5, 0, 0]}>
      {/* White border frame */}
      <mesh>
        <boxGeometry args={[1.1, 1.35, 0.03]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
      </mesh>
      {/* Image area (ENH: starts white when found, develops to dark) */}
      <mesh ref={imageRef} position={[0, 0.1, 0.02]}>
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

// ---- Confidence Gauge (ENH: chrome material upgrade) ----

function ConfidenceGauge({
  confidence,
  visible,
}: {
  confidence: number;
  visible: boolean;
}) {
  const needleRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!needleRef.current || !visible) return;
    // Needle angle: -PI/2 (0%) to PI/2 (100%)
    const targetAngle = -Math.PI / 2 + (confidence / 100) * Math.PI;
    needleRef.current.rotation.z = MathUtils.lerp(
      needleRef.current.rotation.z,
      targetAngle,
      delta * 3
    );
    invalidate();
  });

  if (!visible) return null;

  const gaugeColor =
    confidence > 80 ? '#10B981' : confidence > 50 ? '#FBBF24' : '#EF4444';

  return (
    <group position={[0, -1.2, 0]}>
      {/* ENH: Chrome arc background (metalness=0.8, roughness=0.2) */}
      <mesh>
        <torusGeometry args={[0.5, 0.04, 8, 32, Math.PI]} />
        <meshStandardMaterial
          color="#a8b5c8"
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Colored arc fill */}
      <mesh>
        <torusGeometry args={[0.5, 0.05, 8, 32, Math.PI * (confidence / 100)]} />
        <meshStandardMaterial
          color={gaugeColor}
          emissive={gaugeColor}
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* ENH: Chrome needle */}
      <mesh ref={needleRef} position={[0, 0, 0.05]} rotation={[0, 0, -Math.PI / 2]}>
        <boxGeometry args={[0.02, 0.45, 0.01]} />
        <meshStandardMaterial
          color="#e0e8f0"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* ENH: Chrome center pivot */}
      <mesh position={[0, 0, 0.05]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#c0c8d0"
          metalness={0.8}
          roughness={0.2}
        />
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
  sparkParticles,
}: CameraQuest3DProps & { sparkParticles: Particle[] }) {
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

      {/* Confidence gauge (ENH: chrome material) */}
      <ConfidenceGauge
        confidence={items[currentIndex]?.simConfidence || 0}
        visible={showConfidence && captured}
      />

      {/* ENH: Camera flash effect */}
      <CameraFlash captured={captured} />

      {/* ENH: Flip spark particles */}
      <FlipSparkParticles particles={sparkParticles} />
    </>
  );
}

// ---- Main Export ----

export default function CameraQuest3D(props: CameraQuest3DProps) {
  const { found, items: _items, currentIndex: _currentIndex } = props;

  // ENH: Spark particles on card flip (when a new card is found)
  const [sparkParticles, setSparkParticles] = useState<Particle[]>([]);
  const prevFoundSize = useRef(found.size);

  useEffect(() => {
    if (found.size > prevFoundSize.current) {
      // A new card was just found — spawn sparks at the active card position
      // Active card is at [0, 0.5, 0] before it moves to the stack
      const origin = new Vector3(0, 0.5, 0);
      setSparkParticles(prev => [
        ...prev,
        ...spawnParticles('sparkShower', origin, {
          count: 20,
          colors: ['#FFD700', '#06B6D4', '#FFFFFF'],
        }),
      ]);
    }
    prevFoundSize.current = found.size;
  }, [found.size]);

  // Update spark particles each frame
  useFrame((_, delta) => {
    if (sparkParticles.length > 0) {
      updateParticles(sparkParticles, delta, PARTICLE_PRESETS.sparkShower);
      const alive = sparkParticles.filter((p) => p.life > 0);
      if (alive.length !== sparkParticles.length) {
        setSparkParticles(alive);
      }
    }
  });

  return (
    <group>
      {/* FL-Lite Environment — wired S7-WARN-002 */}
      <CameraQuestEnvironment isCapturing={props.captured} confidence={props.items[props.currentIndex]?.simConfidence ?? 0} />

      <QuestScene {...props} sparkParticles={sparkParticles} />
    </group>
  );
}
