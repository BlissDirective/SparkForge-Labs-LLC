'use client';

// ================================================================
// BytelingCreature — Data & Binary Theme, CUBIC Shape Language
// ================================================================
// 6 evolution stages from Data Seed (egg) to Terabyte (genius).
// All geometry uses box-based primitives with MeshToonMaterial.
// Mood-reactive emissive intensity, blinking eyes, orbital satellites.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Color, MeshToonMaterial, MeshStandardMaterial } from 'three';
import type { CreatureProps } from '@/components/3d/creatures/CreatureBase';
import {
  CreatureWrapper,
  BlinkingEye,
  InnerGlow,
  useToonSetup,
} from '@/components/3d/creatures/CreatureBase';
import type { DataTexture } from 'three';

// ── Shared stage props ──────────────────────────────────────────

interface StageProps {
  gradientMap: DataTexture;
  emissiveColor: Color;
  moodIntensity: number;
}

// ── Stage 0: Data Seed (~200 tris) ─────────────────────────────

function DataSeed({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    // Pulsing emissive
    const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    const mat = meshRef.current.material as MeshToonMaterial;
    if (mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = pulse * moodIntensity;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.7, 0.7, 0.7, 1, 1, 1]} />
      <meshToonMaterial
        gradientMap={gradientMap}
        color="#00AAEE"
        emissive={emissiveColor}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// ── Stage 1: Bitlet (~500 tris) ─────────────────────────────────

function Bitlet({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const bodyRef = useRef<Group>(null);

  useFrame((state) => {
    if (!bodyRef.current) return;
    // Gentle hopping
    bodyRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 3)) * 0.15;
  });

  const legPositions: [number, number, number][] = [
    [-0.25, -0.45, -0.25],
    [0.25, -0.45, -0.25],
    [-0.25, -0.45, 0.25],
    [0.25, -0.45, 0.25],
  ];

  return (
    <group ref={bodyRef}>
      {/* Body cube */}
      <mesh>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0099DD"
          emissive={emissiveColor}
          emissiveIntensity={0.2 * moodIntensity}
        />
      </mesh>

      {/* 4 stubby box legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.15, 0.2, 0.15]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#0077BB"
            emissive={emissiveColor}
            emissiveIntensity={0.1 * moodIntensity}
          />
        </mesh>
      ))}

      {/* Single big square eye (flat box on face) */}
      <BlinkingEye position={[0, 0.05, 0.26]} size={0.18} />
    </group>
  );
}

// ── Stage 2: Bytepup (~800 tris) ────────────────────────────────

function Bytepup({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = Math.sin(t * 2) * 0.4;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = -Math.sin(t * 2) * 0.4;
    }
  });

  return (
    <group>
      {/* Rectangular body */}
      <mesh>
        <boxGeometry args={[0.7, 0.55, 0.45]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0088CC"
          emissive={emissiveColor}
          emissiveIntensity={0.25 * moodIntensity}
        />
      </mesh>

      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.48, 0, 0]}>
        <boxGeometry args={[0.15, 0.4, 0.15]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0077BB"
          emissive={emissiveColor}
          emissiveIntensity={0.15 * moodIntensity}
        />
      </mesh>

      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.48, 0, 0]}>
        <boxGeometry args={[0.15, 0.4, 0.15]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0077BB"
          emissive={emissiveColor}
          emissiveIntensity={0.15 * moodIntensity}
        />
      </mesh>

      {/* 2 box legs */}
      <mesh position={[-0.2, -0.45, 0]}>
        <boxGeometry args={[0.18, 0.25, 0.18]} />
        <meshToonMaterial gradientMap={gradientMap} color="#006699" />
      </mesh>
      <mesh position={[0.2, -0.45, 0]}>
        <boxGeometry args={[0.18, 0.25, 0.18]} />
        <meshToonMaterial gradientMap={gradientMap} color="#006699" />
      </mesh>

      {/* 2 BlinkingEyes */}
      <BlinkingEye position={[-0.15, 0.1, 0.24]} size={0.1} />
      <BlinkingEye position={[0.15, 0.1, 0.24]} size={0.1} />
    </group>
  );
}

// ── Stage 3: Datacrunch (~1200 tris) ────────────────────────────

function Datacrunch({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const antennaL = useRef<Mesh>(null);
  const antennaR = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const glow = 0.5 + Math.sin(t * 3) * 0.5;
    if (antennaL.current) {
      const mat = antennaL.current.material as MeshToonMaterial;
      mat.emissiveIntensity = glow * moodIntensity;
    }
    if (antennaR.current) {
      const mat = antennaR.current.material as MeshToonMaterial;
      mat.emissiveIntensity = glow * moodIntensity;
    }
  });

  return (
    <group>
      {/* Bottom cube (waist) */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.55, 0.35, 0.4]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#006699"
          emissive={emissiveColor}
          emissiveIntensity={0.15 * moodIntensity}
        />
      </mesh>

      {/* Middle cube (torso) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.65, 0.4, 0.45]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0077CC"
          emissive={emissiveColor}
          emissiveIntensity={0.2 * moodIntensity}
        />
      </mesh>

      {/* Top cube (head) */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.5, 0.38, 0.4]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0088DD"
          emissive={emissiveColor}
          emissiveIntensity={0.25 * moodIntensity}
        />
      </mesh>

      {/* Left antenna stalk */}
      <mesh position={[-0.18, 0.72, 0]}>
        <boxGeometry args={[0.04, 0.25, 0.04]} />
        <meshToonMaterial gradientMap={gradientMap} color="#005588" />
      </mesh>
      {/* Left antenna tip (glowing) */}
      <mesh ref={antennaL} position={[-0.18, 0.88, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#66DDFF"
          emissive={emissiveColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Right antenna stalk */}
      <mesh position={[0.18, 0.72, 0]}>
        <boxGeometry args={[0.04, 0.25, 0.04]} />
        <meshToonMaterial gradientMap={gradientMap} color="#005588" />
      </mesh>
      {/* Right antenna tip (glowing) */}
      <mesh ref={antennaR} position={[0.18, 0.88, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#66DDFF"
          emissive={emissiveColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* 2 legs */}
      <mesh position={[-0.18, -0.7, 0]}>
        <boxGeometry args={[0.16, 0.25, 0.16]} />
        <meshToonMaterial gradientMap={gradientMap} color="#005588" />
      </mesh>
      <mesh position={[0.18, -0.7, 0]}>
        <boxGeometry args={[0.16, 0.25, 0.16]} />
        <meshToonMaterial gradientMap={gradientMap} color="#005588" />
      </mesh>

      {/* Eyes */}
      <BlinkingEye position={[-0.12, 0.44, 0.21]} size={0.09} />
      <BlinkingEye position={[0.12, 0.44, 0.21]} size={0.09} />
    </group>
  );
}

// ── Stage 4: Codec (~1800 tris) ─────────────────────────────────

function Codec({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const visorRef = useRef<Mesh>(null);
  const holoRef = useRef<Mesh>(null);
  const holoEmissive = useMemo(() => new Color('#00DDFF'), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Visor glow pulse
    if (visorRef.current) {
      const mat = visorRef.current.material as MeshToonMaterial;
      mat.emissiveIntensity = (0.6 + Math.sin(t * 2) * 0.3) * moodIntensity;
    }
    // Holo display flicker
    if (holoRef.current) {
      const mat = holoRef.current.material as MeshStandardMaterial;
      mat.opacity = 0.3 + Math.sin(t * 5) * 0.15;
    }
  });

  return (
    <group>
      {/* Angular body — main torso (rotated slightly for beveled look) */}
      <mesh rotation={[0, 0, 0.05]}>
        <boxGeometry args={[0.7, 0.85, 0.5]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0066BB"
          emissive={emissiveColor}
          emissiveIntensity={0.2 * moodIntensity}
        />
      </mesh>

      {/* Shoulder bevel (rotated box) */}
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.3, 0.3, 0.45]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0077CC"
          emissive={emissiveColor}
          emissiveIntensity={0.15 * moodIntensity}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.42]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0088DD"
          emissive={emissiveColor}
          emissiveIntensity={0.25 * moodIntensity}
        />
      </mesh>

      {/* Visor eye (wide flat box) */}
      <mesh ref={visorRef} position={[0, 0.64, 0.22]}>
        <boxGeometry args={[0.38, 0.1, 0.03]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#00EEFF"
          emissive={emissiveColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.5, 0.05, 0]}>
        <boxGeometry args={[0.14, 0.55, 0.14]} />
        <meshToonMaterial gradientMap={gradientMap} color="#005599" />
      </mesh>

      {/* Right arm with holographic display */}
      <mesh position={[0.5, 0.05, 0]}>
        <boxGeometry args={[0.14, 0.55, 0.14]} />
        <meshToonMaterial gradientMap={gradientMap} color="#005599" />
      </mesh>
      {/* Holographic display (thin transparent box) */}
      <mesh ref={holoRef} position={[0.65, 0.15, 0.15]}>
        <boxGeometry args={[0.25, 0.35, 0.02]} />
        <meshStandardMaterial
          color="#00DDFF"
          emissive={holoEmissive}
          emissiveIntensity={0.6 * moodIntensity}
          transparent
          opacity={0.35}
          toneMapped={false}
        />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.2, -0.6, 0]}>
        <boxGeometry args={[0.18, 0.4, 0.18]} />
        <meshToonMaterial gradientMap={gradientMap} color="#004488" />
      </mesh>
      <mesh position={[0.2, -0.6, 0]}>
        <boxGeometry args={[0.18, 0.4, 0.18]} />
        <meshToonMaterial gradientMap={gradientMap} color="#004488" />
      </mesh>
    </group>
  );
}

// ── Stage 5: Terabyte (~2500 tris) ──────────────────────────────

function Terabyte({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const sat1Ref = useRef<Group>(null);
  const sat2Ref = useRef<Group>(null);
  const sat3Ref = useRef<Group>(null);
  const chestRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // 3 orbiting satellites at different speeds/radii
    if (sat1Ref.current) {
      sat1Ref.current.position.x = Math.cos(t * 1.2) * 1.0;
      sat1Ref.current.position.z = Math.sin(t * 1.2) * 1.0;
      sat1Ref.current.position.y = 0.6 + Math.sin(t * 2) * 0.1;
      sat1Ref.current.rotation.y = t * 2;
    }
    if (sat2Ref.current) {
      sat2Ref.current.position.x = Math.cos(t * 0.8 + 2.1) * 1.2;
      sat2Ref.current.position.z = Math.sin(t * 0.8 + 2.1) * 1.2;
      sat2Ref.current.position.y = 0.2 + Math.sin(t * 1.5 + 1) * 0.15;
      sat2Ref.current.rotation.y = t * 1.5;
    }
    if (sat3Ref.current) {
      sat3Ref.current.position.x = Math.cos(t * 1.5 + 4.2) * 0.85;
      sat3Ref.current.position.z = Math.sin(t * 1.5 + 4.2) * 0.85;
      sat3Ref.current.position.y = -0.1 + Math.sin(t * 2.5 + 2) * 0.1;
      sat3Ref.current.rotation.y = t * 2.5;
    }

    // Chest panel pulse
    if (chestRef.current) {
      const mat = chestRef.current.material as MeshToonMaterial;
      mat.emissiveIntensity = (0.5 + Math.sin(t * 1.5) * 0.3) * moodIntensity;
    }
  });

  return (
    <group>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[0.85, 0.95, 0.55]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0055AA"
          emissive={emissiveColor}
          emissiveIntensity={0.2 * moodIntensity}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.55, 0.42, 0.48]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0066BB"
          emissive={emissiveColor}
          emissiveIntensity={0.25 * moodIntensity}
        />
      </mesh>

      {/* Shoulder plates (flat boxes) */}
      <mesh position={[-0.58, 0.35, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.5]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0077DD"
          emissive={emissiveColor}
          emissiveIntensity={0.3 * moodIntensity}
        />
      </mesh>
      <mesh position={[0.58, 0.35, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.5]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#0077DD"
          emissive={emissiveColor}
          emissiveIntensity={0.3 * moodIntensity}
        />
      </mesh>

      {/* Chest display (emissive front panel) */}
      <mesh ref={chestRef} position={[0, 0.05, 0.29]}>
        <boxGeometry args={[0.45, 0.4, 0.03]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#00CCFF"
          emissive={emissiveColor}
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.58, -0.05, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.16]} />
        <meshToonMaterial gradientMap={gradientMap} color="#004499" />
      </mesh>
      <mesh position={[0.58, -0.05, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.16]} />
        <meshToonMaterial gradientMap={gradientMap} color="#004499" />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.22, -0.72, 0]}>
        <boxGeometry args={[0.2, 0.45, 0.2]} />
        <meshToonMaterial gradientMap={gradientMap} color="#003388" />
      </mesh>
      <mesh position={[0.22, -0.72, 0]}>
        <boxGeometry args={[0.2, 0.45, 0.2]} />
        <meshToonMaterial gradientMap={gradientMap} color="#003388" />
      </mesh>

      {/* Eyes (visor style) */}
      <BlinkingEye position={[-0.13, 0.74, 0.25]} size={0.08} />
      <BlinkingEye position={[0.13, 0.74, 0.25]} size={0.08} />

      {/* Orbiting cube satellites */}
      <group ref={sat1Ref}>
        <mesh>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#44CCFF"
            emissive={emissiveColor}
            emissiveIntensity={0.9 * moodIntensity}
          />
        </mesh>
      </group>
      <group ref={sat2Ref}>
        <mesh>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#33BBEE"
            emissive={emissiveColor}
            emissiveIntensity={0.8 * moodIntensity}
          />
        </mesh>
      </group>
      <group ref={sat3Ref}>
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#55DDFF"
            emissive={emissiveColor}
            emissiveIntensity={0.85 * moodIntensity}
          />
        </mesh>
      </group>
    </group>
  );
}

// ── Main Component ──────────────────────────────────────────────

export default function BytelingCreature({
  speciesId,
  evolutionStage,
  mood,
  labColor,
}: CreatureProps) {
  const { gradientMap, emissiveColor, moodCfg, evoCfg, stage } =
    useToonSetup(speciesId, evolutionStage, mood);

  const moodIntensity = moodCfg.intensity;

  const stageElement = useMemo(() => {
    const props = { gradientMap, emissiveColor, moodIntensity };
    switch (stage) {
      case 0:
        return <DataSeed {...props} />;
      case 1:
        return <Bitlet {...props} />;
      case 2:
        return <Bytepup {...props} />;
      case 3:
        return <Datacrunch {...props} />;
      case 4:
        return <Codec {...props} />;
      case 5:
        return <Terabyte {...props} />;
      default:
        return <DataSeed {...props} />;
    }
  }, [stage, gradientMap, emissiveColor, moodIntensity]);

  return (
    <CreatureWrapper
      mood={mood}
      evolutionStage={stage}
      moodCfg={moodCfg}
      evoCfg={evoCfg}
    >
      <InnerGlow scale={evoCfg.scale} moodCfg={moodCfg} />
      {stageElement}
    </CreatureWrapper>
  );
}
