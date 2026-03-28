'use client';

// ════════════════════════════════════════════════════
// AiOrNot3D — 3D Art Gallery Judge (2M budget)
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// ════════════════════════════════════════════════════
// Lab 10: AI Futures | Color: #D946EF (Fuchsia)
//
// Interactive 3D gallery scene where players judge whether
// creative works are human-made or AI-generated. Features
// a display pedestal, voting buttons, and verdict effects.
//
// Triangle Budget (Desktop Ultra): ~2K (game component)
// Full environment budget handled by AiOrNotEnvironment
// ENH: Verdict particles + spotlight + gallery + pedestal reveal

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';
import {
  Particle,
  PARTICLE_PRESETS,
  spawnParticles,
  updateParticles,
} from '@/lib/3d/gameParticles';
import AiOrNotEnvironment from '@/components/3d/environments/AiOrNotEnvironment';

interface AiOrNot3DProps {
  currentItem: { title: string; emoji: string; isAI: boolean } | null;
  verdict: 'human' | 'ai' | null;
  isCorrect: boolean | null;
  score: number;
  total: number;
}

// ■■ Instanced Particle Renderer ■■
function InstancedParticles({ particles, preset }: { particles: Particle[]; preset: string }) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const presetConfig = PARTICLE_PRESETS[preset];
  const colorObj = useMemo(() => new Color(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || particles.length === 0) return;
    updateParticles(particles, delta, presetConfig);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.copy(p.position);
        dummy.scale.setScalar(p.size * (presetConfig.shrinkOnDeath ? p.life : 1));
        dummy.rotation.z = p.rotation;
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      colorObj.copy(p.color);
      meshRef.current.setColorAt(i, colorObj);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  if (particles.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial transparent depthWrite={false} />
    </instancedMesh>
  );
}

// ■■ Verdict Particle Explosion ■■
function VerdictParticles({ isCorrect, verdict }: { isCorrect: boolean | null; verdict: 'human' | 'ai' | null }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [presetName, setPresetName] = useState('confettiBurst');
  const prevVerdict = useRef<'human' | 'ai' | null>(null);

  useEffect(() => {
    // Trigger on new verdict (transition from null to a value)
    if (verdict !== null && prevVerdict.current === null && isCorrect !== null) {
      const origin = new Vector3(0, 0.3, 0.5);

      if (isCorrect) {
        // Correct: 60 confettiBurst (gold + green)
        const spawned = spawnParticles('confettiBurst', origin, {
          count: 60,
          colors: ['#FFD700', '#10B981', '#FFD700', '#00FF88', '#FFFFFF', '#FFD700'],
        });
        setParticles(spawned);
        setPresetName('confettiBurst');
      } else {
        // Wrong: 20 sparkShower (red, quick fade)
        const spawned = spawnParticles('sparkShower', origin, {
          count: 20,
          colors: ['#EF4444', '#FF6666', '#CC3333'],
          lifeRange: [0.2, 0.5],
          speedRange: [1.0, 2.5],
        });
        setParticles(spawned);
        setPresetName('sparkShower');
      }
    }
    prevVerdict.current = verdict;
  }, [verdict, isCorrect]);

  return <InstancedParticles particles={particles} preset={presetName} />;
}

// ■■ Gallery Collection (previous artworks) ■■
function GalleryCollection() {
  const galleryEmojis = useMemo(() => ['🎨', '🖼️', '📷', '✏️', '🎭'], []);

  return (
    <group position={[-2.2, -0.1, -0.5]}>
      {galleryEmojis.map((emoji, i) => {
        const y = 0.4 + i * 0.55;
        const z = -0.3 - i * 0.15;
        return (
          <group key={`gallery-${i}`} position={[0, y, z]}>
            {/* Small frame */}
            <mesh>
              <boxGeometry args={[0.5, 0.4, 0.03]} />
              <meshStandardMaterial
                color="#D946EF"
                metalness={0.5}
                roughness={0.4}
                emissive="#D946EF"
                emissiveIntensity={0.05}
              />
            </mesh>
            {/* Inner plane */}
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[0.4, 0.3]} />
              <meshStandardMaterial
                color="#111118"
                roughness={0.8}
                transparent
                opacity={0.5 - i * 0.06}
              />
            </mesh>
            {/* Mini emoji */}
            <Text
              position={[0, 0, 0.035]}
              fontSize={0.15}
              anchorX="center"
              anchorY="middle"
            >
              {emoji}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// ■■ Display Pedestal with Reveal Animation ■■
function DisplayPedestal({
  emoji,
  isRevealing,
  itemKey,
}: {
  emoji: string;
  isRevealing: boolean;
  itemKey: string;
}) {
  const pedestalRef = useRef<Mesh>(null);
  const frameRef = useRef<Group>(null);
  const prevItemKey = useRef(itemKey);
  const revealPhase = useRef<'idle' | 'shrink' | 'pause' | 'grow'>('idle');
  const revealTimer = useRef(0);
  const glowBurstRef = useRef<Mesh>(null);

  // ENH: Detect item switch → start pedestal reveal animation
  useEffect(() => {
    if (itemKey !== prevItemKey.current) {
      revealPhase.current = 'shrink';
      revealTimer.current = 0;
      prevItemKey.current = itemKey;
    }
  }, [itemKey]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (pedestalRef.current) {
      pedestalRef.current.rotation.y = t * 0.2;
    }
    if (frameRef.current) {
      frameRef.current.position.y = 0.8 + Math.sin(t * 0.8) * 0.05;

      // ENH: Pedestal reveal animation
      if (revealPhase.current === 'shrink') {
        revealTimer.current += delta;
        const progress = Math.min(revealTimer.current / 0.15, 1);
        const scale = 1 - progress * 0.999;
        frameRef.current.scale.setScalar(Math.max(scale, 0.001));
        if (progress >= 1) {
          revealPhase.current = 'pause';
          revealTimer.current = 0;
        }
      } else if (revealPhase.current === 'pause') {
        revealTimer.current += delta;
        frameRef.current.scale.setScalar(0.001);
        if (revealTimer.current >= 0.2) {
          revealPhase.current = 'grow';
          revealTimer.current = 0;
        }
      } else if (revealPhase.current === 'grow') {
        revealTimer.current += delta;
        const progress = Math.min(revealTimer.current / 0.25, 1);
        // Ease-out back
        const eased = 1 - Math.pow(1 - progress, 3);
        frameRef.current.scale.setScalar(eased);
        if (progress >= 1) {
          revealPhase.current = 'idle';
          frameRef.current.scale.setScalar(1);
        }
      } else if (isRevealing) {
        frameRef.current.scale.setScalar(1 + Math.sin(t * 6) * 0.05);
      }

      // ENH: Glow burst during grow phase
      if (glowBurstRef.current) {
        const mat = glowBurstRef.current.material as MeshBasicMaterial;
        if (revealPhase.current === 'grow') {
          mat.opacity = 0.3 * (1 - revealTimer.current / 0.25);
          glowBurstRef.current.scale.setScalar(1 + revealTimer.current * 3);
        } else {
          mat.opacity = 0;
        }
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
        {/* ENH: Glow burst ring (visible during reveal grow) */}
        <mesh ref={glowBurstRef} position={[0, 0, 0.03]}>
          <ringGeometry args={[0.7, 1.1, 32]} />
          <meshBasicMaterial
            color="#D946EF"
            transparent
            opacity={0}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Original point light */}
      <pointLight position={[0, 2.5, 1]} intensity={1} color="#D946EF" distance={5} />

      {/* ENH: Artwork spotlight — cone above the display frame */}
      <spotLight
        position={[0, 3.0, 0.8]}
        target-position={[0, 0.3, 0]}
        intensity={3.0}
        angle={0.35}
        penumbra={0.5}
        color="#D946EF"
        distance={6}
        castShadow
      />
    </group>
  );
}

// ■■ Voting Buttons ■■
function VotingButtons({ verdict }: { verdict: 'human' | 'ai' | null }) {
  const humanRef = useRef<Mesh>(null);
  const aiRef = useRef<Mesh>(null);
  const _humanTarget = useMemo(() => new Vector3(), []);
  const _aiTarget = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (humanRef.current) {
      const isSelected = verdict === 'human';
      const targetScale = isSelected ? 1.2 : 1;
      _humanTarget.set(targetScale, targetScale, targetScale);
      humanRef.current.scale.lerp(_humanTarget, 0.1);
      humanRef.current.position.y = -1 + Math.sin(t * 1.5) * 0.03;
    }
    if (aiRef.current) {
      const isSelected = verdict === 'ai';
      const targetScale = isSelected ? 1.2 : 1;
      _aiTarget.set(targetScale, targetScale, targetScale);
      aiRef.current.scale.lerp(_aiTarget, 0.1);
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
  const ringRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    const mat = ringRef.current.material as MeshBasicMaterial;
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
        side={DoubleSide}
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
  // Generate a stable key for current item to detect switches
  const itemKey = currentItem ? `${currentItem.title}-${currentItem.emoji}` : 'none';

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={0.7} castShadow />
      <pointLight position={[-3, 2, 2]} intensity={0.3} color="#D946EF" distance={10} />

      {currentItem && (
        <DisplayPedestal
          emoji={currentItem.emoji}
          isRevealing={verdict !== null}
          itemKey={itemKey}
        />
      )}
      <VotingButtons verdict={verdict} />
      <VerdictRing isCorrect={isCorrect} />
      <ScoreDisplay score={score} total={total} />

      {/* ENH: Gallery collection — small framed artworks beside pedestal */}
      <GalleryCollection />

      {/* ENH: Verdict particle explosion */}
      <VerdictParticles isCorrect={isCorrect} verdict={verdict} />
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
    <group>
      {/* FL-Lite Environment — wired S7-WARN-002 */}
      <AiOrNotEnvironment isJudging={verdict !== null} correctCount={score} />

      <Scene currentItem={currentItem} verdict={verdict} isCorrect={isCorrect} score={score} total={total} />
    </group>
  );
}
