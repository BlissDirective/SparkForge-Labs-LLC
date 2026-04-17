'use client';

// ================================================================
// VoltkitCreature — Energy & Computing Power Theme
// ================================================================
// TRIANGULAR/SPIKY shape language. 6 evolution stages from
// electric spark cell to phoenix-like Exaflare.
// Triangle budget: 250 (egg) -> 2500 (genius)

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
// PERF-CRIT-001 (10C): use named imports for Three.js tree-shaking.
import { Group, Mesh, Color, type MeshStandardMaterial, type MeshToonMaterial } from 'three';
import type { CreatureProps } from '../creatures/CreatureBase';
import type { MoodConfig } from '@/config/creatureConfig';
import {
  CreatureWrapper,
  BlinkingEye,
  InnerGlow,
  useToonSetup,
} from '../creatures/CreatureBase';

// ── Shared stage prop types ──────────────────────────────────────

interface StageProps {
  gradientMap: ReturnType<typeof useToonSetup>['gradientMap'];
  emissiveColor: Color;
  moodCfg: MoodConfig;
}

// ── Stage 0: Spark Cell (Egg) ~250 tris ─────────────────────────

function SparkCell({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const shellRef = useRef<Mesh>(null);
  const sparksRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (shellRef.current) {
      shellRef.current.rotation.y = t * 0.4;
      const mat = shellRef.current.material as MeshToonMaterial;
      mat.emissiveIntensity = (0.4 + Math.sin(t * 2.5) * 0.3) * moodCfg.intensity;
    }
    if (sparksRef.current) {
      sparksRef.current.children.forEach((spark, i) => {
        const offset = (i / 4) * Math.PI * 2;
        spark.position.x = Math.sin(t * 2 + offset) * 0.6;
        spark.position.y = Math.cos(t * 2.5 + offset) * 0.6;
        spark.position.z = Math.sin(t * 1.8 + offset + 1) * 0.4;
      });
    }
  });

  return (
    <group>
      {/* Tetrahedron shell */}
      <mesh ref={shellRef}>
        <coneGeometry args={[0.8, 1.2, 4]} />
        <meshToonMaterial
          color="#00BB66"
          gradientMap={gradientMap}
          emissive={emissiveColor}
          emissiveIntensity={moodCfg.intensity * 0.6}
        />
      </mesh>
      {/* Floating spark particles */}
      <group ref={sparksRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} scale={0.06}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial
              color="#66FFAA"
              emissive={new Color('#66FFAA')}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      <InnerGlow scale={0.7} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 1: Zaplet (Baby) ~450 tris ────────────────────────────

function Zaplet({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const leftEarRef = useRef<Mesh>(null);
  const rightEarRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Ear twitch — higher freq for Voltkit erratic personality
    if (leftEarRef.current) {
      leftEarRef.current.rotation.z = -0.4 + Math.sin(t * 4) * 0.1;
    }
    if (rightEarRef.current) {
      rightEarRef.current.rotation.z = 0.4 - Math.sin(t * 4 + 0.5) * 0.1;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Triangular body */}
      <mesh>
        <coneGeometry args={[0.5, 0.9, 4]} />
        <meshToonMaterial color="#00AA55" {...matProps} />
      </mesh>
      {/* Left ear */}
      <mesh ref={leftEarRef} position={[-0.3, 0.55, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.15, 0.45, 3]} />
        <meshToonMaterial color="#00DD77" {...matProps} />
      </mesh>
      {/* Right ear */}
      <mesh ref={rightEarRef} position={[0.3, 0.55, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.15, 0.45, 3]} />
        <meshToonMaterial color="#00DD77" {...matProps} />
      </mesh>
      {/* Lightning tail — 3 zigzag boxes */}
      <mesh position={[0, -0.3, -0.4]} rotation={[0.3, 0, 0.2]}>
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshToonMaterial color="#66FFAA" {...matProps} />
      </mesh>
      <mesh position={[0.1, -0.5, -0.5]} rotation={[0.3, 0, -0.3]}>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshToonMaterial color="#66FFAA" {...matProps} />
      </mesh>
      <mesh position={[0, -0.65, -0.55]} rotation={[0.3, 0, 0.2]}>
        <boxGeometry args={[0.06, 0.18, 0.06]} />
        <meshToonMaterial color="#88FFBB" {...matProps} />
      </mesh>
      {/* Big BlinkingEyes */}
      <BlinkingEye position={[-0.15, 0.2, 0.4]} size={0.12} />
      <BlinkingEye position={[0.15, 0.2, 0.4]} size={0.12} />
      <InnerGlow scale={0.5} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 2: Voltpup (Toddler) ~850 tris ───────────────────────

function Voltpup({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const leftEarRef = useRef<Mesh>(null);
  const rightEarRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Ears twitch via useFrame — erratic frequency
    if (leftEarRef.current) {
      leftEarRef.current.rotation.z = -0.5 + Math.sin(t * 5) * 0.15;
    }
    if (rightEarRef.current) {
      rightEarRef.current.rotation.z = 0.5 - Math.sin(t * 5 + 0.3) * 0.15;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Fox-like cone body */}
      <mesh>
        <coneGeometry args={[0.55, 1.0, 4]} />
        <meshToonMaterial color="#009944" {...matProps} />
      </mesh>
      {/* 4 legs (thin cones) */}
      {(
        [
          [-0.3, -0.6, 0.2],
          [0.3, -0.6, 0.2],
          [-0.3, -0.6, -0.2],
          [0.3, -0.6, -0.2],
        ] as [number, number, number][]
      ).map((pos, i) => (
        <mesh key={i} position={pos}>
          <coneGeometry args={[0.07, 0.35, 4]} />
          <meshToonMaterial color="#007733" {...matProps} />
        </mesh>
      ))}
      {/* Larger ears */}
      <mesh ref={leftEarRef} position={[-0.35, 0.6, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.18, 0.55, 3]} />
        <meshToonMaterial color="#00CC66" {...matProps} />
      </mesh>
      <mesh ref={rightEarRef} position={[0.35, 0.6, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.18, 0.55, 3]} />
        <meshToonMaterial color="#00CC66" {...matProps} />
      </mesh>
      {/* Spiky fur on back (3-4 small cones pointing up) */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`spike-${i}`}
          position={[0, 0.35 + i * 0.08, -0.25 - i * 0.05]}
          rotation={[-0.4, 0, 0]}
        >
          <coneGeometry args={[0.06, 0.2, 3]} />
          <meshToonMaterial color="#44DD88" {...matProps} />
        </mesh>
      ))}
      {/* Eyes */}
      <BlinkingEye position={[-0.15, 0.25, 0.45]} size={0.1} />
      <BlinkingEye position={[0.15, 0.25, 0.45]} size={0.1} />
      <InnerGlow scale={0.55} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 3: Ampere (Kid) ~1500 tris ────────────────────────────

function Ampere({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const crystalLeftRef = useRef<Mesh>(null);
  const crystalRightRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Crystal shoulders pulse emissive with sin(time * 3)
    const pulse = Math.sin(t * 3) * 0.5 + 0.5;
    if (crystalLeftRef.current) {
      (crystalLeftRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.5 + pulse * 1.5;
    }
    if (crystalRightRef.current) {
      (crystalRightRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.5 + pulse * 1.5;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Lean upright body */}
      <mesh position={[0, -0.1, 0]}>
        <coneGeometry args={[0.45, 1.3, 4]} />
        <meshToonMaterial color="#008833" {...matProps} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.7, 0]}>
        <coneGeometry args={[0.28, 0.4, 4]} />
        <meshToonMaterial color="#00AA44" {...matProps} />
      </mesh>
      {/* Crystal shoulders (2 octahedronGeometry) */}
      <mesh ref={crystalLeftRef} position={[-0.55, 0.3, 0]} rotation={[0, 0, 0.5]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          color="#33FF99"
          emissive={new Color('#33FF99')}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={crystalRightRef} position={[0.55, 0.3, 0]} rotation={[0, 0, -0.5]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          color="#33FF99"
          emissive={new Color('#33FF99')}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
      {/* Split tail — 2 thin cones */}
      <mesh position={[-0.15, -0.5, -0.5]} rotation={[0.6, 0.2, 0]}>
        <coneGeometry args={[0.05, 0.5, 4]} />
        <meshToonMaterial color="#44DD88" {...matProps} />
      </mesh>
      <mesh position={[0.15, -0.5, -0.5]} rotation={[0.6, -0.2, 0]}>
        <coneGeometry args={[0.05, 0.5, 4]} />
        <meshToonMaterial color="#44DD88" {...matProps} />
      </mesh>
      {/* 2 BlinkingEyes */}
      <BlinkingEye position={[-0.1, 0.75, 0.22]} size={0.08} />
      <BlinkingEye position={[0.1, 0.75, 0.22]} size={0.08} />
      <InnerGlow scale={0.6} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 4: Gigawatt (Teen) ~2200 tris ─────────────────────────

function Gigawatt({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const leftFinRef = useRef<Mesh>(null);
  const rightFinRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Fins trail with slight delay animation
    if (leftFinRef.current) {
      leftFinRef.current.rotation.z = -0.8 + Math.sin(t * 1.5) * 0.15;
      (leftFinRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(t * 3) * 0.5;
    }
    if (rightFinRef.current) {
      rightFinRef.current.rotation.z = 0.8 - Math.sin(t * 1.5 + 0.4) * 0.15;
      (rightFinRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(t * 3 + 0.4) * 0.5;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Sleek elongated cone body */}
      <mesh rotation={[0.1, 0, 0]}>
        <coneGeometry args={[0.4, 1.6, 4]} />
        <meshToonMaterial color="#007722" {...matProps} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.85, 0.05]}>
        <coneGeometry args={[0.25, 0.35, 4]} />
        <meshToonMaterial color="#009933" {...matProps} />
      </mesh>
      {/* Visor eye (wide flat box) */}
      <mesh position={[0, 0.85, 0.25]}>
        <boxGeometry args={[0.4, 0.08, 0.06]} />
        <meshStandardMaterial
          color="#AAFFDD"
          emissive={new Color('#AAFFDD')}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      {/* Wing-like energy fins (flat triangle planes on sides) */}
      <mesh ref={leftFinRef} position={[-0.5, 0.2, -0.1]} rotation={[0, 0, -0.8]}>
        <planeGeometry args={[0.7, 0.4]} />
        <meshStandardMaterial
          color="#22FF88"
          emissive={new Color('#22FF88')}
          emissiveIntensity={1}
          transparent
          opacity={0.7}
          side={2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={rightFinRef} position={[0.5, 0.2, -0.1]} rotation={[0, 0, 0.8]}>
        <planeGeometry args={[0.7, 0.4]} />
        <meshStandardMaterial
          color="#22FF88"
          emissive={new Color('#22FF88')}
          emissiveIntensity={1}
          transparent
          opacity={0.7}
          side={2}
          toneMapped={false}
        />
      </mesh>
      {/* Tail */}
      <mesh position={[0, -0.6, -0.6]} rotation={[0.8, 0, 0]}>
        <coneGeometry args={[0.08, 0.6, 4]} />
        <meshToonMaterial color="#44DD88" {...matProps} />
      </mesh>
      <InnerGlow scale={0.65} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 5: Exaflare (Genius) ~2500 tris ───────────────────────

function Exaflare({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const crownRef = useRef<Group>(null);
  const leftWingRef = useRef<Mesh>(null);
  const rightWingRef = useRef<Mesh>(null);
  const tailRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Crown crystals rotate slowly + staggered emissive timing
    if (crownRef.current) {
      crownRef.current.rotation.y = t * 0.3;
      crownRef.current.children.forEach((crystal, i) => {
        if ((crystal as Mesh).material) {
          ((crystal as Mesh).material as MeshStandardMaterial).emissiveIntensity =
            1.0 + Math.sin(t * 3 + i * 1.25) * 0.8;
        }
      });
    }
    // Wings gentle flap (rotation.z oscillation)
    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = -0.6 + Math.sin(t * 1.2) * 0.2;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = 0.6 - Math.sin(t * 1.2) * 0.2;
    }
    // Flowing plasma tail sway
    if (tailRef.current) {
      tailRef.current.rotation.x = 0.5 + Math.sin(t * 0.8) * 0.1;
      tailRef.current.rotation.z = Math.sin(t * 1.3) * 0.08;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Electric phoenix body */}
      <mesh>
        <coneGeometry args={[0.5, 1.5, 4]} />
        <meshToonMaterial color="#006611" {...matProps} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.9, 0.05]}>
        <coneGeometry args={[0.22, 0.35, 4]} />
        <meshToonMaterial color="#009933" {...matProps} />
      </mesh>
      {/* Crown of 5 energy crystal cones */}
      <group ref={crownRef} position={[0, 1.15, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.sin(angle) * 0.25, 0.1, Math.cos(angle) * 0.25]}
              rotation={[0.2, angle, 0]}
            >
              <coneGeometry args={[0.06, 0.25, 4]} />
              <meshStandardMaterial
                color="#44FFAA"
                emissive={new Color('#44FFAA')}
                emissiveIntensity={1.5}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>
      {/* Large energy wings (2 flat triangle planes) */}
      <mesh ref={leftWingRef} position={[-0.6, 0.3, -0.1]} rotation={[0.1, 0.2, -0.6]}>
        <planeGeometry args={[0.9, 0.6]} />
        <meshStandardMaterial
          color="#11FF77"
          emissive={new Color('#11FF77')}
          emissiveIntensity={1.2}
          transparent
          opacity={0.6}
          side={2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={rightWingRef} position={[0.6, 0.3, -0.1]} rotation={[0.1, -0.2, 0.6]}>
        <planeGeometry args={[0.9, 0.6]} />
        <meshStandardMaterial
          color="#11FF77"
          emissive={new Color('#11FF77')}
          emissiveIntensity={1.2}
          transparent
          opacity={0.6}
          side={2}
          toneMapped={false}
        />
      </mesh>
      {/* Flowing plasma tail (multiple thin cones) */}
      <group ref={tailRef} position={[0, -0.5, -0.4]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[Math.sin(i * 0.5) * 0.08, -i * 0.22, -i * 0.15]}
            rotation={[0.4 + i * 0.1, 0, Math.sin(i) * 0.2]}
          >
            <coneGeometry args={[0.06 - i * 0.01, 0.3 - i * 0.04, 4]} />
            <meshToonMaterial color="#55EEAA" {...matProps} />
          </mesh>
        ))}
      </group>
      {/* Visor eyes */}
      <mesh position={[0, 0.95, 0.22]}>
        <boxGeometry args={[0.3, 0.06, 0.04]} />
        <meshStandardMaterial
          color="#BBFFDD"
          emissive={new Color('#BBFFDD')}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <InnerGlow scale={0.7} moodCfg={moodCfg} />
    </group>
  );
}

// ── Main Export ──────────────────────────────────────────────────

export default function VoltkitCreature({ speciesId, evolutionStage, mood, labColor: _labColor }: CreatureProps) {
  const { evoCfg, moodCfg, gradientMap, emissiveColor } = useToonSetup(speciesId, evolutionStage, mood);
  const stage = Math.min(Math.max(0, evolutionStage), 5);

  const sharedProps = { gradientMap, emissiveColor, moodCfg };

  return (
    <CreatureWrapper mood={mood} evolutionStage={stage} moodCfg={moodCfg} evoCfg={evoCfg}>
      {stage === 0 && <SparkCell {...sharedProps} />}
      {stage === 1 && <Zaplet {...sharedProps} />}
      {stage === 2 && <Voltpup {...sharedProps} />}
      {stage === 3 && <Ampere {...sharedProps} />}
      {stage === 4 && <Gigawatt {...sharedProps} />}
      {stage === 5 && <Exaflare {...sharedProps} />}
    </CreatureWrapper>
  );
}
