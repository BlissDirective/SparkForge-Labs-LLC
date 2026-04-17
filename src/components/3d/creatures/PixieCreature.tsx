'use client';

// ================================================================
// PIXIE — Computer Vision & Perception Creature (Species 5)
// ================================================================
// Shape language: Lens/disc/dome — flat circles, domes, ring geometries
// Theme: Computer Vision — observant, analytical, discovers patterns
// Color: Cyan (#06B6D4) → prismatic shifts
//
// Evolution stages:
//   0: Lens Seed     — floating disc with iris pattern
//   1: Peekaboo      — dome body, ONE enormous eye, tiny feet
//   2: Scanner       — taller body, scanning beam, wing-fins
//   3: Focusfly      — dragonfly-like, compound eyes, clear wings
//   4: Spectra       — owl-like, multi-spectral eyes, feather-antenna
//   5: Omniscient    — floating form, orbiting lens-drones, aurora wings

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
// PERF-CRIT-001 (10C): use named imports for Three.js tree-shaking.
import { Group, Mesh, Color, type DataTexture } from 'three';
import type { CreatureProps } from './CreatureBase';
import type { MoodConfig } from '@/config/creatureConfig';
import {
  CreatureWrapper,
  BlinkingEye,
  InnerGlow,
  useToonSetup,
} from './CreatureBase';

export default function PixieCreature({ speciesId, evolutionStage, mood }: CreatureProps) {
  const { evoCfg, moodCfg, gradientMap, emissiveColor, midColor, stage } = useToonSetup(speciesId, evolutionStage, mood);

  return (
    <CreatureWrapper mood={mood} evolutionStage={evolutionStage} moodCfg={moodCfg} evoCfg={evoCfg}>
      {stage === 0 && <LensSeed gradientMap={gradientMap} midColor={midColor} emissiveColor={emissiveColor} moodCfg={moodCfg} />}
      {stage === 1 && <Peekaboo gradientMap={gradientMap} midColor={midColor} emissiveColor={emissiveColor} moodCfg={moodCfg} />}
      {stage === 2 && <Scanner gradientMap={gradientMap} midColor={midColor} emissiveColor={emissiveColor} moodCfg={moodCfg} />}
      {stage === 3 && <Focusfly gradientMap={gradientMap} midColor={midColor} emissiveColor={emissiveColor} moodCfg={moodCfg} />}
      {stage === 4 && <Spectra gradientMap={gradientMap} midColor={midColor} emissiveColor={emissiveColor} moodCfg={moodCfg} />}
      {stage === 5 && <Omniscient gradientMap={gradientMap} midColor={midColor} emissiveColor={emissiveColor} moodCfg={moodCfg} />}
      <InnerGlow scale={evoCfg.scale} moodCfg={moodCfg} />
    </CreatureWrapper>
  );
}

// ── Shared types for stage components ────────────────────────────

interface StageProps {
  gradientMap: DataTexture;
  midColor: Color;
  emissiveColor: Color;
  moodCfg: MoodConfig;
}

// ── Stage 0: Lens Seed (floating disc with iris) ─────────────────

function LensSeed({ gradientMap, midColor, emissiveColor, moodCfg }: StageProps) {
  const irisRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!irisRef.current) return;
    // Iris dilate/contract
    const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    irisRef.current.scale.set(pulse, pulse, 1);
  });

  return (
    <group>
      {/* Main disc */}
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 0.15, 24]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
      </mesh>
      {/* Iris ring */}
      <mesh ref={irisRef} position={[0, 0.08, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.4, 0.05, 8, 24]} />
        <meshToonMaterial color="#FFFFFF" emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.8} />
      </mesh>
      {/* Center lens */}
      <mesh position={[0, 0.09, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#111122" emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.5} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ── Stage 1: Peekaboo (dome body, one ENORMOUS eye) ──────────────

function Peekaboo({ gradientMap, midColor, emissiveColor, moodCfg }: StageProps) {
  return (
    <group>
      {/* Dome body */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
      </mesh>
      {/* Flat bottom */}
      <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.65, 16]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} />
      </mesh>
      {/* THE BIG EYE */}
      <BlinkingEye position={[0, 0.15, 0.55]} size={0.35} color="#E0F0FF" pupilColor="#112233" pupilSize={0.6} />
      {/* Tiny feet */}
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={i} position={[x, -0.4, 0.1]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshToonMaterial color={midColor} gradientMap={gradientMap} />
        </mesh>
      ))}
    </group>
  );
}

// ── Stage 2: Scanner (taller body, scanning beam, wing-fins) ─────

function Scanner({ gradientMap, midColor, emissiveColor, moodCfg }: StageProps) {
  const beamRef = useRef<Group>(null);

  useFrame((state) => {
    if (!beamRef.current) return;
    // Scanning beam sweeps left-right
    beamRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.8;
  });

  return (
    <group>
      {/* Taller dome body */}
      <mesh>
        <capsuleGeometry args={[0.5, 0.4, 8, 16]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
      </mesh>
      {/* Main eye */}
      <BlinkingEye position={[0, 0.3, 0.4]} size={0.22} />
      {/* Scanning beam */}
      <group ref={beamRef} position={[0, 0.3, 0.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.02, 1.5, 6]} />
          <meshStandardMaterial color="#06B6D4" emissive={emissiveColor} emissiveIntensity={moodCfg.intensity} transparent opacity={0.4} />
        </mesh>
      </group>
      {/* Wing-fins */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[side * 0.6, 0.1, 0]} rotation={[0, 0, side * 0.3]}>
          <boxGeometry args={[0.3, 0.5, 0.03]} />
          <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.2} />
        </mesh>
      ))}
    </group>
  );
}

// ── Stage 3: Focusfly (dragonfly-like, compound eyes, clear wings) ──

function Focusfly({ gradientMap, midColor, emissiveColor, moodCfg }: StageProps) {
  const wingsRef = useRef<Group>(null);

  useFrame((state) => {
    if (!wingsRef.current) return;
    // Wing flap
    wingsRef.current.children.forEach((wing, i) => {
      const side = i < 2 ? 1 : -1;
      const speed = i % 2 === 0 ? 8 : 9;
      (wing as Mesh).rotation.z = side * (0.3 + Math.sin(state.clock.elapsedTime * speed) * 0.4);
    });
  });

  return (
    <group>
      {/* Elongated body */}
      <mesh>
        <capsuleGeometry args={[0.3, 0.8, 8, 12]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
      </mesh>
      {/* Compound eyes (3 lenses per side) */}
      {[-0.2, 0, 0.2].map((y, i) => (
        <BlinkingEye key={`l${i}`} position={[-0.25, 0.7 + y * 0.3, 0.2]} size={0.08} />
      ))}
      {[-0.2, 0, 0.2].map((y, i) => (
        <BlinkingEye key={`r${i}`} position={[0.25, 0.7 + y * 0.3, 0.2]} size={0.08} />
      ))}
      {/* Wings (4 — 2 per side) */}
      <group ref={wingsRef} position={[0, 0.3, 0]}>
        {[[-0.5, 0.2], [-0.6, -0.1], [0.5, 0.2], [0.6, -0.1]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[0.6, 0.25, 0.01]} />
            <meshStandardMaterial color="#88DDEE" transparent opacity={0.3} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
          </mesh>
        ))}
      </group>
      {/* Tail */}
      <mesh position={[0, -0.6, 0]}>
        <coneGeometry args={[0.15, 0.5, 8]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

// ── Stage 4: Spectra (owl-like, multi-spectral eyes, feather-antenna) ──

function Spectra({ gradientMap, midColor, emissiveColor, moodCfg }: StageProps) {
  const antennaRef = useRef<Group>(null);

  useFrame((state) => {
    if (!antennaRef.current) return;
    antennaRef.current.children.forEach((ant, i) => {
      (ant as Mesh).rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + i * 1.5) * 0.15;
    });
  });

  return (
    <group>
      {/* Owl body */}
      <mesh>
        <capsuleGeometry args={[0.45, 0.6, 8, 16]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
      </mesh>
      {/* Multi-spectral eyes (concentric rings) */}
      {[-0.18, 0.18].map((x, i) => (
        <group key={i} position={[x, 0.75, 0.35]}>
          <BlinkingEye position={[0, 0, 0]} size={0.15} color="#E0F0FF" pupilColor="#06B6D4" pupilSize={0.5} />
          {/* Spectral ring around eye */}
          <mesh>
            <torusGeometry args={[0.18, 0.02, 8, 16]} />
            <meshStandardMaterial color="#FF66AA" emissive={new Color('#FF66AA')} emissiveIntensity={moodCfg.intensity * 0.5} />
          </mesh>
        </group>
      ))}
      {/* Feather-antenna (3 thin cone feathers on top) */}
      <group ref={antennaRef} position={[0, 1.1, 0]}>
        {[-0.15, 0, 0.15].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0.2, 0, x * 0.5]}>
            <coneGeometry args={[0.03, 0.4, 6]} />
            <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.6} />
          </mesh>
        ))}
      </group>
      {/* Wing tufts */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[side * 0.55, 0.2, 0]} rotation={[0, 0, side * 0.4]}>
          <coneGeometry args={[0.2, 0.6, 8]} />
          <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.2} />
        </mesh>
      ))}
      {/* Feet */}
      {[-0.2, 0.2].map((x, i) => (
        <mesh key={i} position={[x, -0.55, 0.1]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshToonMaterial color={midColor} gradientMap={gradientMap} />
        </mesh>
      ))}
    </group>
  );
}

// ── Stage 5: Omniscient (floating form, orbiting lens-drones, aurora wings) ──

function Omniscient({ gradientMap, midColor, emissiveColor, moodCfg }: StageProps) {
  const dronesRef = useRef<Group>(null);
  const wingsRef = useRef<Group>(null);
  const haloRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Lens drones orbit at different speeds
    if (dronesRef.current) {
      dronesRef.current.children.forEach((drone, i) => {
        const speed = 0.5 + i * 0.2;
        const radius = 1.2 + i * 0.15;
        const phase = (i * Math.PI * 2) / 4;
        (drone as Mesh).position.x = Math.cos(t * speed + phase) * radius;
        (drone as Mesh).position.z = Math.sin(t * speed + phase) * radius;
        (drone as Mesh).position.y = 0.5 + Math.sin(t * 0.8 + i) * 0.2;
      });
    }

    // Wings gentle flap
    if (wingsRef.current) {
      wingsRef.current.children.forEach((wing, i) => {
        const side = i === 0 ? 1 : -1;
        (wing as Mesh).rotation.z = side * (0.1 + Math.sin(t * 1.2) * 0.15);
      });
    }

    // Halo rotation
    if (haloRef.current) {
      haloRef.current.rotation.y = t * 0.3;
      haloRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <group>
      {/* Main body — elongated dome */}
      <mesh>
        <capsuleGeometry args={[0.5, 0.5, 12, 16]} />
        <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.4} />
      </mesh>
      {/* Central all-seeing eye */}
      <BlinkingEye position={[0, 0.4, 0.45]} size={0.25} color="#E0F8FF" pupilColor="#06B6D4" pupilSize={0.45} />
      {/* Spectral ring around central eye */}
      <mesh position={[0, 0.4, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.025, 8, 24]} />
        <meshStandardMaterial color="#FF66AA" emissive={new Color('#FF66AA')} emissiveIntensity={moodCfg.intensity * 0.6} />
      </mesh>
      {/* Halo ring with synaptic sparks */}
      <mesh ref={haloRef} position={[0, 0.9, 0]}>
        <torusGeometry args={[0.6, 0.03, 8, 32]} />
        <meshStandardMaterial color="#FFFFFF" emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.8} toneMapped={false} />
      </mesh>
      {/* Spark points on halo */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.6, 0.9, Math.sin(angle) * 0.6]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#FFFFFF" emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 1.2} toneMapped={false} />
          </mesh>
        );
      })}
      {/* Aurora wings */}
      <group ref={wingsRef}>
        {[-1, 1].map((side, i) => (
          <mesh key={i} position={[side * 0.8, 0.2, -0.1]} rotation={[0.1, side * 0.2, side * 0.1]}>
            <boxGeometry args={[0.8, 1.0, 0.02]} />
            <meshStandardMaterial
              color="#06B6D4"
              emissive={emissiveColor}
              emissiveIntensity={moodCfg.intensity * 0.4}
              transparent
              opacity={0.25}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      {/* Orbiting lens-drones */}
      <group ref={dronesRef}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 12]} />
            <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.6} />
          </mesh>
        ))}
      </group>
      {/* Flowing tendrils */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.3, -0.5 - i * 0.08, Math.sin(angle) * 0.3]} rotation={[0.3, angle, 0]}>
            <cylinderGeometry args={[0.03, 0.01, 0.6, 6]} />
            <meshToonMaterial color={midColor} gradientMap={gradientMap} emissive={emissiveColor} emissiveIntensity={moodCfg.intensity * 0.3} />
          </mesh>
        );
      })}
    </group>
  );
}
