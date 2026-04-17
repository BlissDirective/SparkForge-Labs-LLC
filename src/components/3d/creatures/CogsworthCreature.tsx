'use client';

// ================================================================
// CogsworthCreature — Robotics & Mechanical AI Theme
// ================================================================
// CYLINDRICAL/MECHANICAL shape language. 6 evolution stages from
// gear capsule egg to elegant inventor Archimedes.
// Triangle budget: 350 (egg) -> 2500 (genius)

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
// PERF-CRIT-001 (10C): use named imports for Three.js tree-shaking.
import { Group, Mesh, Color, type MeshStandardMaterial } from 'three';
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

// ── Steam puff helper (small transparent sphere that scales up and fades) ──

function SteamPuff({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime + phaseRef.current;
    const cycle = ((t * 0.4) % 1); // 0..1 repeating
    meshRef.current.scale.setScalar(0.02 + cycle * 0.12);
    (meshRef.current.material as MeshStandardMaterial).opacity = 0.35 * (1 - cycle);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#FFFFFF"
        transparent
        opacity={0.3}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Stage 0: Gear Capsule (Egg) ~350 tris ───────────────────────

function GearCapsule({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const gearRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (gearRef.current) {
      gearRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group>
      {/* Cylindrical capsule body */}
      <mesh>
        <cylinderGeometry args={[0.45, 0.45, 1.0, 12]} />
        <meshToonMaterial
          color="#CC8822"
          gradientMap={gradientMap}
          emissive={emissiveColor}
          emissiveIntensity={moodCfg.intensity * 0.4}
        />
      </mesh>
      {/* Gear ring around middle — slowly rotates */}
      <mesh ref={gearRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.08, 8, 16]} />
        <meshToonMaterial
          color="#DDAA44"
          gradientMap={gradientMap}
          emissive={emissiveColor}
          emissiveIntensity={moodCfg.intensity * 0.5}
        />
      </mesh>
      <InnerGlow scale={0.6} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 1: Sprocket (Baby) ~550 tris ──────────────────────────

function Sprocket({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const bodyRef = useRef<Group>(null);
  const lensRingRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Rolls slightly side to side
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(t * 1.5) * 0.12;
    }
    // Lens ring rotates
    if (lensRingRef.current) {
      lensRingRef.current.rotation.z = t * 0.8;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group ref={bodyRef}>
      {/* Barrel body (short wide cylinder) */}
      <mesh>
        <cylinderGeometry args={[0.45, 0.5, 0.65, 12]} />
        <meshToonMaterial color="#BB7711" {...matProps} />
      </mesh>
      {/* Camera-lens eye (cylinder facing forward) */}
      <mesh position={[0, 0.05, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.12, 10]} />
        <meshToonMaterial color="#222222" {...matProps} />
      </mesh>
      {/* Torus ring around lens */}
      <mesh ref={lensRingRef} position={[0, 0.05, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.03, 6, 12]} />
        <meshToonMaterial color="#DDAA44" {...matProps} />
      </mesh>
      {/* Lens highlight (pupil) */}
      <mesh position={[0, 0.05, 0.52]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#66CCFF"
          emissive={new Color('#66CCFF')}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      {/* 1 small wrench arm (thin box) */}
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.35, 0.08, 0.08]} />
        <meshToonMaterial color="#AA6600" {...matProps} />
      </mesh>
      <SteamPuff position={[0, 0.45, 0]} />
      <InnerGlow scale={0.5} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 2: Ratchet (Toddler) ~950 tris ────────────────────────

function Ratchet({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const leftPistonRef = useRef<Mesh>(null);
  const rightPistonRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Pistons animate up/down
    if (leftPistonRef.current) {
      leftPistonRef.current.position.y = -0.15 + Math.sin(t * 3) * 0.06;
    }
    if (rightPistonRef.current) {
      rightPistonRef.current.position.y = -0.15 + Math.sin(t * 3 + Math.PI) * 0.06;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Cylinder body (upright) */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.4, 0.8, 12]} />
        <meshToonMaterial color="#AA6600" {...matProps} />
      </mesh>
      {/* Expressive visor eye (wide flat cylinder) */}
      <mesh position={[0, 0.15, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 12]} />
        <meshStandardMaterial
          color="#66DDFF"
          emissive={new Color('#66DDFF')}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      {/* 2 arms (thin cylinders) */}
      <mesh position={[-0.45, 0.05, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.45, 8]} />
        <meshToonMaterial color="#995500" {...matProps} />
      </mesh>
      <mesh position={[0.45, 0.05, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.45, 8]} />
        <meshToonMaterial color="#995500" {...matProps} />
      </mesh>
      {/* Left piston leg */}
      <mesh position={[-0.15, -0.55, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
        <meshToonMaterial color="#884400" {...matProps} />
      </mesh>
      {/* Left piston joint (small cylinder) */}
      <mesh ref={leftPistonRef} position={[-0.15, -0.15, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
        <meshToonMaterial color="#DDAA44" {...matProps} />
      </mesh>
      {/* Right piston leg */}
      <mesh position={[0.15, -0.55, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
        <meshToonMaterial color="#884400" {...matProps} />
      </mesh>
      {/* Right piston joint */}
      <mesh ref={rightPistonRef} position={[0.15, -0.15, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
        <meshToonMaterial color="#DDAA44" {...matProps} />
      </mesh>
      <SteamPuff position={[0.3, 0.35, 0.2]} />
      <InnerGlow scale={0.5} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 3: Dynamo (Kid) ~1700 tris ────────────────────────────

function Dynamo({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const antennaRef = useRef<Mesh>(null);
  const chestRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Antenna tip bobs
    if (antennaRef.current) {
      antennaRef.current.position.y = 0.95 + Math.sin(t * 2) * 0.03;
    }
    // Chest compartment pulses
    if (chestRef.current) {
      (chestRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.6 + Math.sin(t * 2.5) * 0.4;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Cylinder torso */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.38, 0.75, 14]} />
        <meshToonMaterial color="#995500" {...matProps} />
      </mesh>
      {/* Box head */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.42, 0.35, 0.38]} />
        <meshToonMaterial color="#AA6600" {...matProps} />
      </mesh>
      {/* Visor eyes on head */}
      <BlinkingEye position={[-0.1, 0.58, 0.2]} size={0.07} />
      <BlinkingEye position={[0.1, 0.58, 0.2]} size={0.07} />
      {/* Antenna (thin cylinder + sphere tip) */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshToonMaterial color="#DDAA44" {...matProps} />
      </mesh>
      <mesh ref={antennaRef} position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color="#FFCC44"
          emissive={new Color('#FFCC44')}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      {/* Left arm with wrench (thin cylinder + small cone) */}
      <mesh position={[-0.45, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshToonMaterial color="#884400" {...matProps} />
      </mesh>
      <mesh position={[-0.6, -0.15, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.08, 0.18, 6]} />
        <meshToonMaterial color="#CC8822" {...matProps} />
      </mesh>
      {/* Right arm with hammer (thin cylinder + small box) */}
      <mesh position={[0.45, 0.1, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshToonMaterial color="#884400" {...matProps} />
      </mesh>
      <mesh position={[0.6, -0.15, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.1]} />
        <meshToonMaterial color="#CC8822" {...matProps} />
      </mesh>
      {/* Chest compartment (slightly inset box) */}
      <mesh ref={chestRef} position={[0, 0.05, 0.32]}>
        <boxGeometry args={[0.22, 0.2, 0.04]} />
        <meshStandardMaterial
          color="#FFAA33"
          emissive={new Color('#FFAA33')}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.13, -0.55, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
        <meshToonMaterial color="#773300" {...matProps} />
      </mesh>
      <mesh position={[0.13, -0.55, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
        <meshToonMaterial color="#773300" {...matProps} />
      </mesh>
      <SteamPuff position={[-0.25, 0.5, 0.15]} />
      <InnerGlow scale={0.55} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 4: Fabricator (Teen) ~2400 tris ───────────────────────

function Fabricator({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const arm1Ref = useRef<Mesh>(null);
  const arm2Ref = useRef<Mesh>(null);
  const arm3Ref = useRef<Mesh>(null);
  const arm4Ref = useRef<Mesh>(null);
  const visorRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // 4 arms move independently at different speeds
    if (arm1Ref.current) arm1Ref.current.rotation.z = -0.5 + Math.sin(t * 1.2) * 0.25;
    if (arm2Ref.current) arm2Ref.current.rotation.z = -0.3 + Math.sin(t * 1.8 + 1) * 0.2;
    if (arm3Ref.current) arm3Ref.current.rotation.z = 0.5 - Math.sin(t * 1.5 + 0.5) * 0.25;
    if (arm4Ref.current) arm4Ref.current.rotation.z = 0.3 - Math.sin(t * 2.0 + 2) * 0.2;
    // Welding visor glow
    if (visorRef.current) {
      (visorRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(t * 3) * 0.4;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Wider industrial body */}
      <mesh>
        <cylinderGeometry args={[0.42, 0.48, 0.9, 14]} />
        <meshToonMaterial color="#884400" {...matProps} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.25, 0.28, 0.35, 12]} />
        <meshToonMaterial color="#995500" {...matProps} />
      </mesh>
      {/* Welding visor (flat cylinder over eyes) */}
      <mesh ref={visorRef} position={[0, 0.62, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 12]} />
        <meshStandardMaterial
          color="#FF8844"
          emissive={new Color('#FF8844')}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
      {/* 4 arms (2 per side, thin cylinders) */}
      {/* Upper left */}
      <mesh ref={arm1Ref} position={[-0.52, 0.2, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
        <meshToonMaterial color="#773300" {...matProps} />
      </mesh>
      {/* Lower left */}
      <mesh ref={arm2Ref} position={[-0.48, -0.05, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 8]} />
        <meshToonMaterial color="#773300" {...matProps} />
      </mesh>
      {/* Upper right */}
      <mesh ref={arm3Ref} position={[0.52, 0.2, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
        <meshToonMaterial color="#773300" {...matProps} />
      </mesh>
      {/* Lower right */}
      <mesh ref={arm4Ref} position={[0.48, -0.05, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 8]} />
        <meshToonMaterial color="#773300" {...matProps} />
      </mesh>
      {/* Tank treads suggested by 2 torus at base */}
      <mesh position={[-0.2, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.15, 0.06, 6, 12]} />
        <meshToonMaterial color="#553300" {...matProps} />
      </mesh>
      <mesh position={[0.2, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.15, 0.06, 6, 12]} />
        <meshToonMaterial color="#553300" {...matProps} />
      </mesh>
      <SteamPuff position={[-0.4, 0.45, 0.2]} />
      <SteamPuff position={[0.4, 0.45, -0.1]} />
      <InnerGlow scale={0.6} moodCfg={moodCfg} />
    </group>
  );
}

// ── Stage 5: Archimedes (Genius) ~2500 tris ─────────────────────

function Archimedes({ gradientMap, emissiveColor, moodCfg }: StageProps) {
  const monocleRef = useRef<Mesh>(null);
  const gearsRef = useRef<Group>(null);
  const leftLimbRef = useRef<Group>(null);
  const rightLimbRef = useRef<Group>(null);
  const blueprintRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Monocle lens glow
    if (monocleRef.current) {
      (monocleRef.current.material as MeshStandardMaterial).emissiveIntensity =
        1.0 + Math.sin(t * 2) * 0.4;
    }
    // Gear satellites orbit
    if (gearsRef.current) {
      gearsRef.current.children.forEach((gear, i) => {
        const speed = 0.6 + i * 0.3;
        const radius = 0.9 + i * 0.15;
        const offset = (i / 3) * Math.PI * 2;
        gear.position.x = Math.cos(t * speed + offset) * radius;
        gear.position.z = Math.sin(t * speed + offset) * radius;
        gear.position.y = 0.2 + Math.sin(t * 1.5 + i) * 0.15;
        gear.rotation.y = t * (1 + i * 0.5);
      });
    }
    // Telescoping limbs extend/retract subtly
    if (leftLimbRef.current) {
      leftLimbRef.current.scale.y = 1.0 + Math.sin(t * 0.8) * 0.08;
    }
    if (rightLimbRef.current) {
      rightLimbRef.current.scale.y = 1.0 + Math.sin(t * 0.8 + 1.5) * 0.08;
    }
    // Blueprint flicker
    if (blueprintRef.current) {
      (blueprintRef.current.material as MeshStandardMaterial).opacity =
        0.25 + Math.sin(t * 4) * 0.1;
    }
  });

  const matProps = {
    gradientMap,
    emissive: emissiveColor,
    emissiveIntensity: moodCfg.intensity * 0.4,
  };

  return (
    <group>
      {/* Elegant brass-colored main body */}
      <mesh>
        <cylinderGeometry args={[0.38, 0.42, 0.95, 16]} />
        <meshToonMaterial color="#AA7711" {...matProps} />
      </mesh>
      {/* Head (cylinder) */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.22, 0.25, 0.38, 14]} />
        <meshToonMaterial color="#BB8822" {...matProps} />
      </mesh>
      {/* Monocle eye — torus ring */}
      <mesh position={[0.12, 0.68, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.02, 6, 12]} />
        <meshToonMaterial color="#EEBB55" {...matProps} />
      </mesh>
      {/* Monocle lens (sphere) */}
      <mesh ref={monocleRef} position={[0.12, 0.68, 0.24]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial
          color="#88DDFF"
          emissive={new Color('#88DDFF')}
          emissiveIntensity={1.2}
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
      {/* Other eye */}
      <BlinkingEye position={[-0.1, 0.68, 0.22]} size={0.06} />
      {/* Telescoping left arm (nested cylinders) */}
      <group ref={leftLimbRef} position={[-0.48, 0.1, 0]}>
        <mesh rotation={[0, 0, -0.35]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
          <meshToonMaterial color="#996600" {...matProps} />
        </mesh>
        <mesh position={[-0.08, -0.22, 0]} rotation={[0, 0, -0.35]}>
          <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
          <meshToonMaterial color="#AA7711" {...matProps} />
        </mesh>
      </group>
      {/* Telescoping right arm (nested cylinders) */}
      <group ref={rightLimbRef} position={[0.48, 0.1, 0]}>
        <mesh rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
          <meshToonMaterial color="#996600" {...matProps} />
        </mesh>
        <mesh position={[0.08, -0.22, 0]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
          <meshToonMaterial color="#AA7711" {...matProps} />
        </mesh>
      </group>
      {/* Legs */}
      <mesh position={[-0.14, -0.65, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
        <meshToonMaterial color="#885500" {...matProps} />
      </mesh>
      <mesh position={[0.14, -0.65, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
        <meshToonMaterial color="#885500" {...matProps} />
      </mesh>
      {/* Floating blueprint display (thin transparent box behind) */}
      <mesh ref={blueprintRef} position={[0, 0.3, -0.55]}>
        <boxGeometry args={[0.6, 0.45, 0.02]} />
        <meshStandardMaterial
          color="#44AAFF"
          emissive={new Color('#44AAFF')}
          emissiveIntensity={0.6}
          transparent
          opacity={0.25}
          toneMapped={false}
        />
      </mesh>
      {/* Orbiting gear satellites (3 small torus gears) */}
      <group ref={gearsRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.08, 0.025, 6, 10]} />
            <meshToonMaterial
              color="#EEBB55"
              gradientMap={gradientMap}
              emissive={emissiveColor}
              emissiveIntensity={moodCfg.intensity * 0.7}
            />
          </mesh>
        ))}
      </group>
      <SteamPuff position={[-0.3, 0.55, 0.15]} />
      <SteamPuff position={[0.35, 0.4, -0.2]} />
      <InnerGlow scale={0.6} moodCfg={moodCfg} />
    </group>
  );
}

// ── Main Export ──────────────────────────────────────────────────

export default function CogsworthCreature({ speciesId, evolutionStage, mood, labColor: _labColor }: CreatureProps) {
  const { evoCfg, moodCfg, gradientMap, emissiveColor } = useToonSetup(speciesId, evolutionStage, mood);
  const stage = Math.min(Math.max(0, evolutionStage), 5);

  const sharedProps = { gradientMap, emissiveColor, moodCfg };

  return (
    <CreatureWrapper mood={mood} evolutionStage={stage} moodCfg={moodCfg} evoCfg={evoCfg}>
      {stage === 0 && <GearCapsule {...sharedProps} />}
      {stage === 1 && <Sprocket {...sharedProps} />}
      {stage === 2 && <Ratchet {...sharedProps} />}
      {stage === 3 && <Dynamo {...sharedProps} />}
      {stage === 4 && <Fabricator {...sharedProps} />}
      {stage === 5 && <Archimedes {...sharedProps} />}
    </CreatureWrapper>
  );
}
