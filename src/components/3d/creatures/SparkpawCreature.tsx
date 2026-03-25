'use client';

// ================================================================
// SparkpawCreature — Neural Networks Theme, SPHERICAL Shape Language
// ================================================================
// 6 evolution stages from Synapse Egg (egg) to Cortex (genius).
// All geometry uses sphere/cylinder-based primitives with MeshToonMaterial.
// Mood-reactive emissive intensity, tentacle wave animations, neural orbits.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Color, MeshToonMaterial, MeshStandardMaterial } from 'three';
import type { DataTexture } from 'three';
import type { CreatureProps } from '@/components/3d/creatures/CreatureBase';
import {
  CreatureWrapper,
  BlinkingEye,
  InnerGlow,
  useToonSetup,
} from '@/components/3d/creatures/CreatureBase';

// ── Shared stage props ──────────────────────────────────────────

interface StageProps {
  gradientMap: DataTexture;
  emissiveColor: Color;
  moodIntensity: number;
}

// ── Reusable Tentacle ───────────────────────────────────────────

function Tentacle({
  position,
  length = 0.4,
  radius = 0.04,
  phaseOffset = 0,
  waveAmplitude = 0.3,
  gradientMap,
  color = '#7733CC',
  tipSphere = false,
  tipRadius = 0.06,
  emissiveColor,
  moodIntensity,
}: {
  position: [number, number, number];
  length?: number;
  radius?: number;
  phaseOffset?: number;
  waveAmplitude?: number;
  gradientMap: DataTexture;
  color?: string;
  tipSphere?: boolean;
  tipRadius?: number;
  emissiveColor?: Color;
  moodIntensity?: number;
}) {
  const tentRef = useRef<Group>(null);

  useFrame((state) => {
    if (!tentRef.current) return;
    const t = state.clock.elapsedTime;
    tentRef.current.rotation.x = Math.sin(t * 1.5 + phaseOffset) * waveAmplitude;
    tentRef.current.rotation.z = Math.sin(t * 1.2 + phaseOffset * 0.7) * waveAmplitude * 0.4;
  });

  return (
    <group position={position}>
      <group ref={tentRef}>
        <mesh position={[0, -length / 2, 0]}>
          <cylinderGeometry args={[radius, radius * 0.6, length, 6, 1]} />
          <meshToonMaterial gradientMap={gradientMap} color={color} />
        </mesh>
        {tipSphere && emissiveColor && (
          <mesh position={[0, -length, 0]}>
            <sphereGeometry args={[tipRadius, 8, 8]} />
            <meshToonMaterial
              gradientMap={gradientMap}
              color="#CC99FF"
              emissive={emissiveColor}
              emissiveIntensity={0.5 * (moodIntensity ?? 0.5)}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

// ── Stage 0: Synapse Egg (~300 tris) ────────────────────────────

function SynapseEgg({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const veinRefs = useRef<Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    veinRefs.current.forEach((vein, i) => {
      if (!vein) return;
      const mat = vein.material as MeshToonMaterial;
      mat.emissiveIntensity = (0.4 + Math.sin(t * 2.5 + i * 1.5) * 0.4) * moodIntensity;
    });
  });

  // 4 vein positions (thin cylinders on surface of sphere)
  const veins: { pos: [number, number, number]; rot: [number, number, number] }[] = [
    { pos: [0.28, 0.15, 0.1], rot: [0, 0, 0.8] },
    { pos: [-0.2, 0.25, 0.15], rot: [0, 0, -0.5] },
    { pos: [0.1, -0.2, 0.25], rot: [0.6, 0, 0.3] },
    { pos: [-0.15, -0.1, -0.25], rot: [-0.4, 0, -0.6] },
  ];

  return (
    <group>
      {/* Main orb */}
      <mesh>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#9955EE"
          emissive={emissiveColor}
          emissiveIntensity={0.3 * moodIntensity}
        />
      </mesh>

      {/* Surface veins (thin cylinders) */}
      {veins.map((v, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) veinRefs.current[i] = el; }}
          position={v.pos}
          rotation={v.rot}
        >
          <cylinderGeometry args={[0.015, 0.015, 0.25, 4, 1]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#CC99FF"
            emissive={emissiveColor}
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Stage 1: Noodlet (~500 tris) ────────────────────────────────

function Noodlet({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const bodyRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!bodyRef.current) return;
    // Wobble animation
    const t = state.clock.elapsedTime;
    bodyRef.current.scale.x = 1 + Math.sin(t * 3) * 0.06;
    bodyRef.current.scale.y = 1 - Math.sin(t * 3) * 0.04;
  });

  const legOffsets: { pos: [number, number, number]; phase: number }[] = [
    { pos: [-0.18, -0.3, -0.12], phase: 0 },
    { pos: [0.18, -0.3, -0.12], phase: 1.5 },
    { pos: [-0.12, -0.3, 0.18], phase: 3.0 },
    { pos: [0.12, -0.3, 0.18], phase: 4.5 },
  ];

  return (
    <group>
      {/* Round blob body */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#8844DD"
          emissive={emissiveColor}
          emissiveIntensity={0.25 * moodIntensity}
        />
      </mesh>

      {/* 4 tiny tentacle-legs */}
      {legOffsets.map((leg, i) => (
        <Tentacle
          key={i}
          position={leg.pos}
          length={0.22}
          radius={0.03}
          phaseOffset={leg.phase}
          waveAmplitude={0.2}
          gradientMap={gradientMap}
          color="#7733CC"
        />
      ))}

      {/* Huge oversized BlinkingEyes */}
      <BlinkingEye position={[-0.14, 0.08, 0.28]} size={0.14} />
      <BlinkingEye position={[0.14, 0.08, 0.28]} size={0.14} />
    </group>
  );
}

// ── Stage 2: Synapper (~800 tris) ───────────────────────────────

function Synapper({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const node1Ref = useRef<Group>(null);
  const node2Ref = useRef<Group>(null);
  const node3Ref = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Floating neural nodes orbit slowly
    if (node1Ref.current) {
      node1Ref.current.position.x = Math.cos(t * 0.7) * 0.6;
      node1Ref.current.position.z = Math.sin(t * 0.7) * 0.6;
      node1Ref.current.position.y = 0.3 + Math.sin(t * 1.2) * 0.08;
    }
    if (node2Ref.current) {
      node2Ref.current.position.x = Math.cos(t * 0.5 + 2.1) * 0.55;
      node2Ref.current.position.z = Math.sin(t * 0.5 + 2.1) * 0.55;
      node2Ref.current.position.y = -0.1 + Math.sin(t * 1.4 + 1) * 0.06;
    }
    if (node3Ref.current) {
      node3Ref.current.position.x = Math.cos(t * 0.9 + 4.2) * 0.5;
      node3Ref.current.position.z = Math.sin(t * 0.9 + 4.2) * 0.5;
      node3Ref.current.position.y = 0.1 + Math.sin(t * 1.0 + 3) * 0.07;
    }
  });

  const tentacles: { pos: [number, number, number]; phase: number }[] = [
    { pos: [-0.22, -0.32, -0.15], phase: 0 },
    { pos: [0.22, -0.32, -0.15], phase: 1.2 },
    { pos: [-0.15, -0.32, 0.22], phase: 2.4 },
    { pos: [0.15, -0.32, 0.22], phase: 3.6 },
  ];

  return (
    <group>
      {/* Body sphere */}
      <mesh>
        <sphereGeometry args={[0.38, 14, 14]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#7733CC"
          emissive={emissiveColor}
          emissiveIntensity={0.25 * moodIntensity}
        />
      </mesh>

      {/* 4 longer tentacles */}
      {tentacles.map((t, i) => (
        <Tentacle
          key={i}
          position={t.pos}
          length={0.3}
          radius={0.035}
          phaseOffset={t.phase}
          waveAmplitude={0.25}
          gradientMap={gradientMap}
          color="#6622BB"
        />
      ))}

      {/* Floating neural node spheres */}
      <group ref={node1Ref}>
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#BB88FF"
            emissive={emissiveColor}
            emissiveIntensity={0.7 * moodIntensity}
          />
        </mesh>
      </group>
      <group ref={node2Ref}>
        <mesh>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#AA77EE"
            emissive={emissiveColor}
            emissiveIntensity={0.6 * moodIntensity}
          />
        </mesh>
      </group>
      <group ref={node3Ref}>
        <mesh>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#CC99FF"
            emissive={emissiveColor}
            emissiveIntensity={0.65 * moodIntensity}
          />
        </mesh>
      </group>

      {/* Eyes */}
      <BlinkingEye position={[-0.13, 0.1, 0.3]} size={0.11} />
      <BlinkingEye position={[0.13, 0.1, 0.3]} size={0.11} />
    </group>
  );
}

// ── Stage 3: Neurowhelp (~1200 tris) ────────────────────────────

function Neurowhelp({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const tentacles: { pos: [number, number, number]; phase: number }[] = [
    { pos: [-0.2, -0.5, -0.15], phase: 0 },
    { pos: [0.2, -0.5, -0.15], phase: 1.0 },
    { pos: [-0.25, -0.5, 0.1], phase: 2.0 },
    { pos: [0.25, -0.5, 0.1], phase: 3.0 },
    { pos: [-0.1, -0.5, 0.22], phase: 4.0 },
    { pos: [0.1, -0.5, 0.22], phase: 5.0 },
  ];

  // Brain bump positions on the head
  const bumps: [number, number, number][] = [
    [0, 0.62, 0],
    [-0.12, 0.58, 0.1],
    [0.12, 0.58, 0.1],
    [0, 0.58, -0.12],
    [-0.1, 0.55, -0.08],
  ];

  return (
    <group>
      {/* Body sphere */}
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.38, 14, 14]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#6622CC"
          emissive={emissiveColor}
          emissiveIntensity={0.2 * moodIntensity}
        />
      </mesh>

      {/* Head sphere (distinct) */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.28, 14, 14]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#7733DD"
          emissive={emissiveColor}
          emissiveIntensity={0.3 * moodIntensity}
        />
      </mesh>

      {/* Brain bumps (small spheres on head surface) */}
      {bumps.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#9966DD"
            emissive={emissiveColor}
            emissiveIntensity={0.35 * moodIntensity}
          />
        </mesh>
      ))}

      {/* 6 tentacles with sphere tips */}
      {tentacles.map((t, i) => (
        <Tentacle
          key={i}
          position={t.pos}
          length={0.35}
          radius={0.035}
          phaseOffset={t.phase}
          waveAmplitude={0.3}
          gradientMap={gradientMap}
          color="#5511AA"
          tipSphere
          tipRadius={0.05}
          emissiveColor={emissiveColor}
          moodIntensity={moodIntensity}
        />
      ))}

      {/* Eyes */}
      <BlinkingEye position={[-0.11, 0.34, 0.22]} size={0.09} />
      <BlinkingEye position={[0.11, 0.34, 0.22]} size={0.09} />
    </group>
  );
}

// ── Stage 4: Dendrite (~1800 tris) ──────────────────────────────

function Dendrite({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const tentacles: { pos: [number, number, number]; phase: number; len: number }[] = [
    { pos: [-0.22, -0.45, -0.18], phase: 0, len: 0.5 },
    { pos: [0.22, -0.45, -0.18], phase: 0.8, len: 0.48 },
    { pos: [-0.28, -0.45, 0.0], phase: 1.6, len: 0.52 },
    { pos: [0.28, -0.45, 0.0], phase: 2.4, len: 0.46 },
    { pos: [-0.2, -0.45, 0.18], phase: 3.2, len: 0.54 },
    { pos: [0.2, -0.45, 0.18], phase: 4.0, len: 0.5 },
    { pos: [-0.08, -0.45, 0.25], phase: 4.8, len: 0.42 },
    { pos: [0.08, -0.45, 0.25], phase: 5.6, len: 0.44 },
  ];

  return (
    <group>
      {/* Elongated body (stretched sphere) */}
      <mesh scale={[0.85, 1.2, 0.85]}>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#5511BB"
          emissive={emissiveColor}
          emissiveIntensity={0.25 * moodIntensity}
        />
      </mesh>

      {/* Head region (subtle sphere merge) */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.25, 14, 14]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#6622CC"
          emissive={emissiveColor}
          emissiveIntensity={0.3 * moodIntensity}
        />
      </mesh>

      {/* 8 flowing tendrils with independent wave */}
      {tentacles.map((t, i) => (
        <Tentacle
          key={i}
          position={t.pos}
          length={t.len}
          radius={0.03}
          phaseOffset={t.phase}
          waveAmplitude={0.35 * (0.8 + moodIntensity * 0.3)}
          gradientMap={gradientMap}
          color="#4400AA"
          tipSphere
          tipRadius={0.04}
          emissiveColor={emissiveColor}
          moodIntensity={moodIntensity}
        />
      ))}

      {/* Glowing eyes */}
      <BlinkingEye position={[-0.1, 0.4, 0.2]} size={0.08} />
      <BlinkingEye position={[0.1, 0.4, 0.2]} size={0.08} />
    </group>
  );
}

// ── Stage 5: Cortex (~2500 tris) ────────────────────────────────

function Cortex({ gradientMap, emissiveColor, moodIntensity }: StageProps) {
  const haloRef = useRef<Mesh>(null);
  const sparkRefs = useRef<Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Halo ring rotates
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.3;
      haloRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
    // Spark points pulse
    sparkRefs.current.forEach((spark, i) => {
      if (!spark) return;
      const mat = spark.material as MeshToonMaterial;
      mat.emissiveIntensity = (0.5 + Math.sin(t * 3 + i * 1.3) * 0.5) * moodIntensity;
    });
  });

  // 12 cascading tendrils
  const tendrils: { pos: [number, number, number]; phase: number; len: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 0.3;
    tendrils.push({
      pos: [Math.cos(angle) * r, -0.45, Math.sin(angle) * r],
      phase: i * 0.5,
      len: 0.45 + (i % 3) * 0.1,
    });
  }

  // 8 spark points on the halo torus
  const sparkPositions: [number, number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 0.5;
    sparkPositions.push([Math.cos(angle) * r, Math.sin(angle) * r, 0]);
  }

  return (
    <group>
      {/* Dome head (jellyfish form) */}
      <mesh scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.45, 18, 18]} />
        <meshToonMaterial
          gradientMap={gradientMap}
          color="#4400AA"
          emissive={emissiveColor}
          emissiveIntensity={0.3 * moodIntensity}
        />
      </mesh>

      {/* Inner dome highlight */}
      <mesh scale={[0.9, 0.6, 0.9]} position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.4, 14, 14]} />
        <meshStandardMaterial
          color="#7744BB"
          emissive={emissiveColor}
          emissiveIntensity={0.4 * moodIntensity}
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>

      {/* Halo ring (torus) with spark points */}
      <group position={[0, 0.25, 0]}>
        <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.025, 8, 24]} />
          <meshToonMaterial
            gradientMap={gradientMap}
            color="#9966DD"
            emissive={emissiveColor}
            emissiveIntensity={0.6 * moodIntensity}
          />
        </mesh>

        {/* Synaptic spark points on the torus */}
        {sparkPositions.map((pos, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) sparkRefs.current[i] = el; }}
            position={pos}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshToonMaterial
              gradientMap={gradientMap}
              color="#DDD6FE"
              emissive={emissiveColor}
              emissiveIntensity={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* 12 cascading tendrils */}
      {tendrils.map((t, i) => (
        <Tentacle
          key={i}
          position={t.pos}
          length={t.len}
          radius={0.025}
          phaseOffset={t.phase}
          waveAmplitude={0.3 * (0.7 + moodIntensity * 0.4)}
          gradientMap={gradientMap}
          color="#330099"
          tipSphere
          tipRadius={0.03}
          emissiveColor={emissiveColor}
          moodIntensity={moodIntensity}
        />
      ))}

      {/* Eyes */}
      <BlinkingEye position={[-0.12, 0.0, 0.35]} size={0.07} />
      <BlinkingEye position={[0.12, 0.0, 0.35]} size={0.07} />
    </group>
  );
}

// ── Main Component ──────────────────────────────────────────────

export default function SparkpawCreature({
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
        return <SynapseEgg {...props} />;
      case 1:
        return <Noodlet {...props} />;
      case 2:
        return <Synapper {...props} />;
      case 3:
        return <Neurowhelp {...props} />;
      case 4:
        return <Dendrite {...props} />;
      case 5:
        return <Cortex {...props} />;
      default:
        return <SynapseEgg {...props} />;
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
