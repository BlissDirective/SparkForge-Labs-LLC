"use client";

// ================================================================
// MY FIRST AI APP 3D — Lab 9 (Build with AI) — v3 Enhanced 3D
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// [v3] 3D app mockup that assembles as child builds it
// [v3] Floating AI power orbs with emissive glow
// [v3] Holographic app preview card with slow rotation
// [v3] Build progress shown via assembling phone frame
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ENH: Orb particles + screen content + launch exhaust + score counter
// ================================================================

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  MathUtils,
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
import MyFirstAiAppEnvironment from '@/components/3d/environments/MyFirstAiAppEnvironment';

// ---- Types ----

interface PowerOrb {
  id: string;
  emoji: string;
  color: string;
  techLabel: string;
}

interface MyFirstAiApp3DProps {
  buildStep: number;        // 0-4 (category, name, powers, audience, design)
  totalSteps: number;       // 5
  selectedPowers: PowerOrb[];
  maxPowers: number;
  themeColor: string;       // hex accent from selected theme
  categoryEmoji: string;
  appName: string;
  innovationScore: number;  // 0-100
  isPreview: boolean;       // true when app card is shown
}

// ---- Instanced Particle Renderer ----

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

// ---- App Icon Grid (screen content) ----

function AppIconGrid({ buildStep, themeColor }: { buildStep: number; themeColor: string }) {
  const icons = useMemo(() => {
    const items: { x: number; y: number; delay: number }[] = [];
    const cols = 4;
    const rows = 5;
    const w = 1.2;
    const h = 2.0;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          x: (c / (cols - 1)) * w - w / 2,
          y: ((rows - 1 - r) / (rows - 1)) * h - h / 2,
          delay: idx * 0.15,
        });
        idx++;
      }
    }
    return items;
  }, []);

  // Number of visible icons scales with buildStep (0-4 → 0, 5, 10, 15, 20)
  const visibleCount = Math.min(icons.length, buildStep * 5);

  return (
    <group position={[0, 0, 0.075]}>
      {icons.slice(0, visibleCount).map((icon, i) => (
        <mesh key={i} position={[icon.x, icon.y, 0]}>
          <planeGeometry args={[0.2, 0.2]} />
          <meshStandardMaterial
            color={themeColor}
            emissive={themeColor}
            emissiveIntensity={0.4}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---- Phone Frame ----

function PhoneFrame({
  buildProgress,
  themeColor,
  isPreview,
  buildStep,
}: {
  buildProgress: number; // 0-1
  themeColor: string;
  isPreview: boolean;
  buildStep: number;
}) {
  const groupRef = useRef<Group>(null);
  const screenRef = useRef<Mesh>(null);
  const launchStartTime = useRef<number | null>(null);
  const [launchOffset, setLaunchOffset] = useState(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Launch sequence: when isPreview, phone rises +0.5 over 2s
    if (isPreview) {
      if (launchStartTime.current === null) {
        launchStartTime.current = state.clock.elapsedTime;
      }
      const elapsed = state.clock.elapsedTime - launchStartTime.current;
      const t = Math.min(elapsed / 2.0, 1.0);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setLaunchOffset(eased * 0.5);
    } else {
      launchStartTime.current = null;
      if (launchOffset > 0) setLaunchOffset(0);
    }

    // Gentle floating + launch offset
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05 + launchOffset;

    // Slow rotation in preview mode
    if (isPreview) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    } else {
      groupRef.current.rotation.y = MathUtils.lerp(
        groupRef.current.rotation.y,
        0,
        0.05
      );
    }

    // Screen emissive pulse
    if (screenRef.current) {
      const mat = screenRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = isPreview
        ? 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1
        : 0.1 + buildProgress * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Phone body — outer shell */}
      <mesh>
        <boxGeometry args={[1.6, 2.8, 0.12]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Phone bezel — inner rim */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.5, 2.7, 0.08]} />
        <meshStandardMaterial
          color="#0a0a1a"
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0, 0.065]}>
        <planeGeometry args={[1.4, 2.5]} />
        <meshStandardMaterial
          color={isPreview ? themeColor : "#111827"}
          emissive={themeColor}
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* App icon grid — progressive screen content */}
      <AppIconGrid buildStep={buildStep} themeColor={themeColor} />

      {/* Screen content glow overlay */}
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[1.3, 2.4]} />
        <meshBasicMaterial
          color={themeColor}
          transparent
          opacity={buildProgress * 0.08}
        />
      </mesh>

      {/* Notch */}
      <mesh position={[0, 1.2, 0.07]}>
        <boxGeometry args={[0.5, 0.08, 0.01]} />
        <meshStandardMaterial color="#0a0a1a" />
      </mesh>

      {/* Build progress bar at bottom of screen */}
      {!isPreview && buildProgress > 0 && (
        <mesh position={[-0.7 + (buildProgress * 1.4) / 2, -1.15, 0.07]}>
          <boxGeometry args={[buildProgress * 1.4, 0.06, 0.01]} />
          <meshStandardMaterial
            color={themeColor}
            emissive={themeColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

// ---- Power Orb ----

function PowerOrbMesh({
  position,
  color,
  index,
  total,
}: {
  position: [number, number, number];
  color: string;
  index: number;
  total: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Individual bob offset
    meshRef.current.position.y =
      position[1] + Math.sin(t * 1.2 + index * 1.5) * 0.08;

    // Gentle spin
    meshRef.current.rotation.y = t * 0.5 + index * (Math.PI / total);

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 2 + index) * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.15, 12, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Glow ring */}
      <mesh
        ref={glowRef}
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.16, 0.25, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---- Connection Line (memoized geometry — E-12) ----
// Uses <primitive> instead of <line> to avoid JSX intrinsic SVG type conflict

function ConnectionLine({ start, color }: { start: [number, number, number]; color: string }) {
  const lineObj = useMemo(() => {
    const pts = new Float32Array([
      start[0], start[1], start[2],
      0, 0, 0.1,
    ]);
    const geom = new BufferGeometry();
    geom.setAttribute("position", new BufferAttribute(pts, 3));
    const mat = new LineBasicMaterial({ color, transparent: true, opacity: 0.2 });
    return new Line(geom, mat);
  }, [start, color]);

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as LineBasicMaterial).dispose();
    };
  }, [lineObj]);

  return <primitive object={lineObj} />;
}

// ---- Orb-to-Phone Data Stream Particles ----

function OrbDataStream({
  orbPosition,
  color,
}: {
  orbPosition: [number, number, number];
  color: string;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const spawnedRef = useRef(false);

  useEffect(() => {
    if (!spawnedRef.current) {
      const origin = new Vector3(orbPosition[0], orbPosition[1], orbPosition[2]);
      const direction = new Vector3(-orbPosition[0], -orbPosition[1], -orbPosition[2] + 0.1).normalize();
      const spawned = spawnParticles('dataStream', origin, {
        count: 30,
        colors: [color, '#FFFFFF', color],
        direction,
        spread: 0.3,
      });
      setParticles(spawned);
      spawnedRef.current = true;
    }
  }, [orbPosition, color]);

  // Respawn when particles die
  useFrame(() => {
    const alive = particles.filter(p => p.life > 0);
    if (alive.length === 0 && spawnedRef.current) {
      const origin = new Vector3(orbPosition[0], orbPosition[1], orbPosition[2]);
      const direction = new Vector3(-orbPosition[0], -orbPosition[1], -orbPosition[2] + 0.1).normalize();
      const spawned = spawnParticles('dataStream', origin, {
        count: 30,
        colors: [color, '#FFFFFF', color],
        direction,
        spread: 0.3,
      });
      setParticles(spawned);
    }
  });

  return <InstancedParticles particles={particles} preset="dataStream" />;
}

// ---- Power Orbs Ring ----

function PowerOrbsRing({
  powers,
  maxPowers,
}: {
  powers: PowerOrb[];
  maxPowers: number;
}) {
  const positions = useMemo(() => {
    const radius = 1.6;
    return powers.map((_, i) => {
      const angle = (i / Math.max(maxPowers, powers.length)) * Math.PI * 2 - Math.PI / 2;
      return [
        Math.cos(angle) * radius,
        0.2,
        Math.sin(angle) * radius,
      ] as [number, number, number];
    });
  }, [powers, maxPowers]);

  return (
    <group>
      {powers.map((pow, i) => (
        <PowerOrbMesh
          key={pow.id}
          position={positions[i]}
          color={pow.color}
          index={i}
          total={powers.length}
        />
      ))}

      {/* Connection lines from orbs to phone (memoized geometries — E-12) */}
      {powers.map((pow, i) => {
        const start = positions[i];
        if (!start) return null;
        return (
          <ConnectionLine key={`line-${pow.id}`} start={start} color={pow.color} />
        );
      })}

      {/* Data stream particles from each orb to phone center */}
      {powers.map((pow, i) => {
        const pos = positions[i];
        if (!pos) return null;
        return (
          <OrbDataStream
            key={`stream-${pow.id}`}
            orbPosition={pos}
            color={pow.color}
          />
        );
      })}
    </group>
  );
}

// ---- Launch Exhaust Particles ----

function LaunchExhaust({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const spawnedRef = useRef(false);

  useEffect(() => {
    if (active && !spawnedRef.current) {
      const origin = new Vector3(0, -1.4, 0);
      const direction = new Vector3(0, -1, 0);
      const spawned = spawnParticles('sparkShower', origin, {
        count: 30,
        colors: ['#FF6644', '#FFAA44', '#FFD700'],
        direction,
        spread: 0.4,
        speedRange: [2.0, 4.0],
        lifeRange: [0.4, 1.0],
      });
      setParticles(spawned);
      spawnedRef.current = true;
    }
    if (!active) {
      spawnedRef.current = false;
      setParticles([]);
    }
  }, [active]);

  // Continuously respawn while active
  useFrame(() => {
    if (!active) return;
    const alive = particles.filter(p => p.life > 0);
    if (alive.length < 5) {
      const origin = new Vector3(0, -1.4, 0);
      const direction = new Vector3(0, -1, 0);
      const spawned = spawnParticles('sparkShower', origin, {
        count: 30,
        colors: ['#FF6644', '#FFAA44', '#FFD700'],
        direction,
        spread: 0.4,
        speedRange: [2.0, 4.0],
        lifeRange: [0.4, 1.0],
      });
      setParticles(spawned);
    }
  });

  if (!active) return null;
  return <InstancedParticles particles={particles} preset="sparkShower" />;
}

// ---- Innovation Score Counter ----

function InnovationScoreCounter({
  score,
  themeColor,
}: {
  score: number;
  themeColor: string;
}) {
  const textRef = useRef<Group>(null);
  const prevScore = useRef(score);
  const pulseScale = useRef(1);

  useFrame((state, delta) => {
    if (!textRef.current) return;

    // Detect score change → trigger pulse
    if (score !== prevScore.current) {
      pulseScale.current = 1.4;
      prevScore.current = score;
    }

    // Decay pulse back to 1.0
    pulseScale.current = MathUtils.lerp(pulseScale.current, 1.0, delta * 5);
    textRef.current.scale.setScalar(pulseScale.current);

    // Gentle float
    textRef.current.position.y = 2.6 + Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
  });

  return (
    <group ref={textRef} position={[0, 2.6, 0]}>
      <Text
        fontSize={0.22}
        color={themeColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#000000"
      >
        {`${score}`}
      </Text>
      <Text
        position={[0, -0.22, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        INNOVATION
      </Text>
    </group>
  );
}

// ---- Holographic Preview (Preview Mode) ----

function HolographicPreview({
  themeColor,
  innovationScore,
}: {
  themeColor: string;
  innovationScore: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    groupRef.current.position.y =
      1.8 + Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
  });

  const barWidth = (innovationScore / 100) * 1.5;

  return (
    <group ref={groupRef} position={[0, 1.8, 0]}>
      {/* Floating holographic card */}
      <mesh>
        <planeGeometry args={[2.0, 1.2]} />
        <meshPhysicalMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={0.2}
          transparent
          opacity={0.25}
          transmission={0.3}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          side={DoubleSide}
        />
      </mesh>

      {/* Innovation score bar */}
      <mesh position={[-0.75 + barWidth / 2, -0.8, 0.01]}>
        <boxGeometry args={[barWidth, 0.08, 0.02]} />
        <meshStandardMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Score bar background */}
      <mesh position={[0, -0.8, -0.01]}>
        <boxGeometry args={[1.5, 0.08, 0.01]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

// ---- Base Platform ----

function BasePlatform({ themeColor }: { themeColor: string }) {
  const ringRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.1;
  });

  const gridRings = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      key: i,
      radius: 0.4 + i * 0.4,
    })), []);

  return (
    <group>
      {/* Platform disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial
          color="#0a0a1a"
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Outer ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.48, 0]}
      >
        <ringGeometry args={[2.0, 2.2, 48]} />
        <meshStandardMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Grid lines on platform */}
      {gridRings.map((ring) => (
        <mesh
          key={`grid-${ring.key}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.47, 0]}
        >
          <ringGeometry args={[ring.radius - 0.01, ring.radius, 32]} />
          <meshBasicMaterial
            color={themeColor}
            transparent
            opacity={0.06}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---- Scene ----

function Scene(props: MyFirstAiApp3DProps) {
  const {
    buildStep,
    totalSteps,
    selectedPowers,
    maxPowers,
    themeColor,
    innovationScore,
    isPreview,
  } = props;

  const buildProgress = buildStep / totalSteps;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={0.5}
        color="#ffffff"
      />
      <pointLight
        position={[0, 2, 2]}
        intensity={0.4}
        color={themeColor}
        distance={6}
      />
      <pointLight
        position={[-2, 0, -1]}
        intensity={0.2}
        color="#F97316"
        distance={5}
      />

      {/* Base platform */}
      <BasePlatform themeColor={themeColor} />

      {/* Phone mockup */}
      <PhoneFrame
        buildProgress={buildProgress}
        themeColor={themeColor}
        isPreview={isPreview}
        buildStep={buildStep}
      />

      {/* AI Power orbs (visible during powers step and beyond) */}
      {selectedPowers.length > 0 && (
        <PowerOrbsRing
          powers={selectedPowers}
          maxPowers={maxPowers}
        />
      )}

      {/* Launch exhaust particles under phone during preview */}
      <LaunchExhaust active={isPreview} />

      {/* Innovation score floating counter */}
      <InnovationScoreCounter score={innovationScore} themeColor={themeColor} />

      {/* Holographic preview (only in preview/complete phase) */}
      {isPreview && (
        <HolographicPreview
          themeColor={themeColor}
          innovationScore={innovationScore}
        />
      )}

    </>
  );
}

// ---- Export ----

export default function MyFirstAiApp3D(props: MyFirstAiApp3DProps) {
  return (
    <group>
      {/* FL-Lite Environment — wired S7-WARN-002 */}
      <MyFirstAiAppEnvironment buildStep={props.buildStep} isPreview={props.isPreview} />

      <Scene {...props} />
    </group>
  );
}
