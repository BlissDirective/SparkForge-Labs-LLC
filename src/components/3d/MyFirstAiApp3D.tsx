"use client";

// ================================================================
// MY FIRST AI APP 3D — Lab 9 (Build with AI) — v3 Enhanced 3D
// [v3] 3D app mockup that assembles as child builds it
// [v3] Floating AI power orbs with emissive glow
// [v3] Holographic app preview card with slow rotation
// [v3] Build progress shown via assembling phone frame
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ================================================================

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from 'three';

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

// ---- Phone Frame ----

function PhoneFrame({
  buildProgress,
  themeColor,
  isPreview,
}: {
  buildProgress: number; // 0-1
  themeColor: string;
  isPreview: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const screenRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;

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

      {/* Screen content glow overlay */}
      <mesh position={[0, 0, 0.07]}>
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

      {/* Environment */}
      <Environment preset="night" />

      {/* Base platform */}
      <BasePlatform themeColor={themeColor} />

      {/* Phone mockup */}
      <PhoneFrame
        buildProgress={buildProgress}
        themeColor={themeColor}
        isPreview={isPreview}
      />

      {/* AI Power orbs (visible during powers step and beyond) */}
      {selectedPowers.length > 0 && (
        <PowerOrbsRing
          powers={selectedPowers}
          maxPowers={maxPowers}
        />
      )}

      {/* Holographic preview (only in preview/complete phase) */}
      {isPreview && (
        <HolographicPreview
          themeColor={themeColor}
          innovationScore={innovationScore}
        />
      )}

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          intensity={0.4}
        />
      </EffectComposer>
    </>
  );
}

// ---- Export ----

export default function MyFirstAiApp3D(props: MyFirstAiApp3DProps) {
  return (
    <div
      className="w-full h-48 md:h-56 rounded-xl overflow-hidden"
      aria-hidden="true"
    >
      <Canvas
        camera={{
          position: [0, 1.5, 5],
          fov: 40,
          near: 0.1,
          far: 50,
        }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
