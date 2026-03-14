'use client';

// ════════════════════════════════════════════════════
// InteractiveConsole3D — Holographic Stat Consoles
// ════════════════════════════════════════════════════
// Enhancement 1.1: Physical 3D consoles for XP stats, badge gallery,
// streak tracker — holographic displays the child interacts with spatially.
//
// 4 consoles arranged around the central map:
// - XP Console (front-left): XP bar, level, progress
// - Badge Console (front-right): Recent badges, rarity glow
// - Streak Console (back-left): Streak fire, calendar
// - Progress Console (back-right): Lab completion overview
//
// Budget: ~1,500 tris per console (200K-500K total scene budget)
// Multi-layer holographic frame with animated data displays,
// scan line effect, and contact shadows.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useLOD } from '@/hooks/useLOD';

type ConsoleVariant = 'xp' | 'badges' | 'streak' | 'progress';

interface ConsoleData {
  xp?: number;
  xpMax?: number;
  level?: number;
  levelTitle?: string;
  streak?: number;
  badgeCount?: number;
  recentBadge?: string;
  labsCompleted?: number;
  totalLabs?: number;
}

interface InteractiveConsoleProps {
  variant: ConsoleVariant;
  position: [number, number, number];
  rotation?: [number, number, number];
  data: ConsoleData;
  isActive: boolean;
  onClick: () => void;
}

const CONSOLE_COLORS: Record<ConsoleVariant, string> = {
  xp: '#00BBFF',
  badges: '#FFAA44',
  streak: '#FF6644',
  progress: '#00FF88',
};

const CONSOLE_LABELS: Record<ConsoleVariant, string> = {
  xp: 'XP STATION',
  badges: 'BADGE VAULT',
  streak: 'STREAK CORE',
  progress: 'LAB PROGRESS',
};

// Lab colors for progress grid
const LAB_COLORS = [
  '#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88',
  '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
];

// ─── Corner Brackets ──────────────────────────────
// Small chrome detail pieces at each corner of the console frame
function CornerBrackets({ width, height, color }: { width: number; height: number; color: string }) {
  const hw = width / 2 - 0.02;
  const hh = height / 2 - 0.02;
  const bracketSize = 0.04;
  const positions: [number, number, number][] = [
    [-hw, hh, 0.026],
    [hw, hh, 0.026],
    [-hw, -hh, 0.026],
    [hw, -hh, 0.026],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[bracketSize, bracketSize, 0.008]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            metalness={0.95}
            roughness={0.15}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Holographic Scan Line ────────────────────────
// A thin line that sweeps vertically across the console face
function ScanLine({ width, height, color }: { width: number; height: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    // Sweep from bottom to top over ~3 seconds, then loop
    const t = (Date.now() % 3000) / 3000;
    meshRef.current.position.y = -height / 2 + t * height;
    // Fade at edges
    const edgeFade = 1.0 - Math.abs(t - 0.5) * 1.2;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, edgeFade * 0.35);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0.028]}>
      <planeGeometry args={[width - 0.06, 0.006]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── XP Circular Gauge ────────────────────────────
// RingGeometry that fills like a speedometer arc based on XP progress
function XPGauge({
  xp,
  xpMax,
  color,
  segments,
}: {
  xp: number;
  xpMax: number;
  color: string;
  segments: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = Math.min(xp / Math.max(xpMax, 1), 1);

  // Animated counter — smoothly ticks toward target
  const _counterRef = useRef<THREE.Mesh>(null);
  const displayValueRef = useRef(xp);

  useFrame(() => {
    // Smoothly animate the display value
    displayValueRef.current += (xp - displayValueRef.current) * 0.05;

    // Gentle rotation on the gauge ring
    if (meshRef.current) {
      meshRef.current.rotation.z = -Math.PI * 0.75; // Start from bottom-left
    }
  });

  // Arc from 0 to thetaLength based on progress
  const thetaLength = progress * Math.PI * 1.5; // 270-degree max arc

  return (
    <group position={[0, 0.02, 0.015]}>
      {/* Background ring (full arc) */}
      <mesh rotation={[0, 0, -Math.PI * 0.75]}>
        <ringGeometry args={[0.1, 0.13, segments, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color="#1A1822" transparent opacity={0.8} />
      </mesh>
      {/* Filled arc */}
      <mesh ref={meshRef}>
        <ringGeometry args={[0.1, 0.13, segments, 1, 0, thetaLength]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* Center number */}
      <Text
        position={[0, 0, 0.005]}
        fontSize={0.055}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.woff"
      >
        {`${Math.round(xp)}`}
      </Text>
      {/* XP label beneath */}
      <Text
        position={[0, -0.06, 0.005]}
        fontSize={0.025}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Sora-Regular.woff"
      >
        {`/ ${xpMax} XP`}
      </Text>
    </group>
  );
}

// ─── Badge Pedestal ───────────────────────────────
// Rotating cylinder platform with badge count and glow
function BadgePedestal({
  badgeCount,
  recentBadge,
  color,
  segments,
  enableEffects,
}: {
  badgeCount: number;
  recentBadge?: string;
  color: string;
  segments: number;
  enableEffects: boolean;
}) {
  const pedestalRef = useRef<THREE.Group>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (pedestalRef.current) {
      pedestalRef.current.rotation.y += delta * 0.5;
    }
    if (glowRingRef.current && enableEffects) {
      const mat = glowRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(Date.now() * 0.004) * 0.15;
    }
  });

  return (
    <group position={[0, 0.01, 0.015]}>
      {/* Rotating pedestal platform */}
      <group ref={pedestalRef}>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.03, segments]} />
          <meshStandardMaterial
            color="#1A1822"
            metalness={0.95}
            roughness={0.15}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Pedestal top ring */}
        <mesh position={[0, -0.024, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.08, segments]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Glow ring around pedestal */}
      {enableEffects && (
        <mesh ref={glowRingRef} position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.14, segments]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} />
        </mesh>
      )}

      {/* Badge count */}
      <Text
        position={[0, 0.04, 0.005]}
        fontSize={0.07}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.woff"
      >
        {`${badgeCount}`}
      </Text>
      <Text
        position={[0, -0.01, 0.005]}
        fontSize={0.028}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Sora-Regular.woff"
      >
        Badges Earned
      </Text>
      {recentBadge && (
        <Text
          position={[0, -0.08, 0.005]}
          fontSize={0.022}
          color={color}
          anchorX="center"
          anchorY="middle"
          font="/fonts/Sora-Regular.woff"
        >
          {`Latest: ${recentBadge}`}
        </Text>
      )}
    </group>
  );
}

// ─── Streak Flame ─────────────────────────────────
// 3 overlapping cones in orange/red that scale with streak value
function StreakFlame({
  streak,
  color,
  segments,
  enableAnimations,
}: {
  streak: number;
  color: string;
  segments: number;
  enableAnimations: boolean;
}) {
  const flameGroupRef = useRef<THREE.Group>(null);
  // Scale flame height based on streak (min 0.5, max 1.5)
  const flameScale = Math.min(0.5 + (streak / 30) * 1.0, 1.5);

  useFrame(() => {
    if (!flameGroupRef.current || !enableAnimations) return;
    // Organic flickering
    const t = Date.now() * 0.005;
    flameGroupRef.current.scale.x = flameScale * (1.0 + Math.sin(t * 1.3) * 0.06);
    flameGroupRef.current.scale.y = flameScale * (1.0 + Math.sin(t * 1.7) * 0.08);
    flameGroupRef.current.scale.z = flameScale * (1.0 + Math.sin(t * 1.1) * 0.05);
  });

  return (
    <group position={[0, 0.02, 0.015]}>
      <group ref={flameGroupRef} scale={flameScale}>
        {/* Center cone — tallest, main fire */}
        <mesh position={[0, 0.01, 0]}>
          <coneGeometry args={[0.04, 0.12, segments]} />
          <meshStandardMaterial
            color="#FF6644"
            emissive="#FF6644"
            emissiveIntensity={0.9}
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        </mesh>
        {/* Left cone — shorter, orange */}
        <mesh position={[-0.025, -0.01, 0]} rotation={[0, 0, 0.15]}>
          <coneGeometry args={[0.03, 0.09, segments]} />
          <meshStandardMaterial
            color="#FFAA44"
            emissive="#FFAA44"
            emissiveIntensity={0.8}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
        {/* Right cone — shorter, deep red */}
        <mesh position={[0.025, -0.01, 0]} rotation={[0, 0, -0.15]}>
          <coneGeometry args={[0.03, 0.09, segments]} />
          <meshStandardMaterial
            color="#FF4422"
            emissive="#FF4422"
            emissiveIntensity={0.8}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Streak number */}
      <Text
        position={[0, -0.08, 0.005]}
        fontSize={0.065}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.woff"
      >
        {`${streak}`}
      </Text>
      <Text
        position={[0, -0.12, 0.005]}
        fontSize={0.028}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Sora-Regular.woff"
      >
        Day Streak
      </Text>
    </group>
  );
}

// ─── Progress Grid ────────────────────────────────
// 10 small squares in a 5x2 grid, lit/unlit based on lab completion
function ProgressGrid({
  labsCompleted,
  totalLabs,
  color,
}: {
  labsCompleted: number;
  totalLabs: number;
  color: string;
}) {
  const completed = labsCompleted ?? 0;
  const total = totalLabs ?? 10;

  const squares = useMemo(() => {
    const items: { pos: [number, number, number]; lit: boolean; labColor: string }[] = [];
    for (let i = 0; i < total; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      items.push({
        pos: [
          -0.1 + col * 0.05,
          0.02 - row * 0.055,
          0.015,
        ],
        lit: i < completed,
        labColor: LAB_COLORS[i] || '#333333',
      });
    }
    return items;
  }, [completed, total]);

  return (
    <group position={[0, 0.02, 0]}>
      {/* Title */}
      <Text
        position={[0, 0.1, 0.015]}
        fontSize={0.04}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.woff"
      >
        {`${completed} / ${total}`}
      </Text>
      <Text
        position={[0, 0.065, 0.015]}
        fontSize={0.025}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Sora-Regular.woff"
      >
        Labs Explored
      </Text>
      {/* Grid of squares */}
      {squares.map((sq, i) => (
        <mesh key={i} position={sq.pos}>
          <boxGeometry args={[0.035, 0.035, 0.006]} />
          <meshStandardMaterial
            color={sq.lit ? sq.labColor : '#1A1822'}
            emissive={sq.lit ? sq.labColor : '#000000'}
            emissiveIntensity={sq.lit ? 0.7 : 0}
            metalness={0.6}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Console Content Router ───────────────────────
function ConsoleContent({
  variant,
  data,
  color,
  lod,
}: {
  variant: ConsoleVariant;
  data: ConsoleData;
  color: string;
  lod: { segments: number; enableEffects: boolean; enableAnimations: boolean };
}) {
  switch (variant) {
    case 'xp':
      return (
        <XPGauge
          xp={data.xp ?? 0}
          xpMax={data.xpMax ?? 500}
          color={color}
          segments={lod.segments}
        />
      );
    case 'badges':
      return (
        <BadgePedestal
          badgeCount={data.badgeCount ?? 0}
          recentBadge={data.recentBadge}
          color={color}
          segments={lod.segments}
          enableEffects={lod.enableEffects}
        />
      );
    case 'streak':
      return (
        <StreakFlame
          streak={data.streak ?? 0}
          color={color}
          segments={lod.segments}
          enableAnimations={lod.enableAnimations}
        />
      );
    case 'progress':
      return (
        <ProgressGrid
          labsCompleted={data.labsCompleted ?? 0}
          totalLabs={data.totalLabs ?? 10}
          color={color}
        />
      );
  }
}

// ═══════════════════════════════════════════════════
// Main InteractiveConsole3D Component
// ═══════════════════════════════════════════════════
export function InteractiveConsole3D({
  variant,
  position,
  rotation = [0, 0, 0],
  data,
  isActive,
  onClick,
}: InteractiveConsoleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const color = CONSOLE_COLORS[variant];
  const label = CONSOLE_LABELS[variant];

  const lod = useLOD({ tier: 'system' });

  // Console dimensions
  const W = 0.7;
  const H = 0.5;

  useFrame(() => {
    if (!groupRef.current) return;
    // Subtle hover float
    groupRef.current.position.y =
      position[1] + Math.sin(Date.now() * 0.002 + variant.charCodeAt(0)) * 0.03;

    // Glow pulse on holographic backplate
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(Date.now() * 0.003) * 0.1;
      mat.opacity = isActive ? 0.25 + pulse : 0.08 + pulse * 0.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={new THREE.Euler(...rotation)}
    >
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.15}>
        {/* ── Layer 1: Outer Chrome Frame ── */}
        <RoundedBox
          args={[W, H, 0.05]}
          radius={0.025}
          smoothness={lod.segments >= 12 ? 4 : 2}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerEnter={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerLeave={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <meshStandardMaterial
            color="#222230"
            metalness={0.95}
            roughness={0.15}
            emissive={color}
            emissiveIntensity={isActive ? 0.12 : 0.03}
          />
        </RoundedBox>

        {/* ── Layer 2: Inner Glass Panel ── */}
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[W - 0.08, H - 0.08]} />
          <meshPhysicalMaterial
            color="#111118"
            metalness={0.1}
            roughness={0.1}
            transmission={0.4}
            thickness={0.02}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* ── Layer 3: Floating Holographic Backplate with Edge Glow ── */}
        <mesh ref={glowRef} position={[0, 0, -0.03]}>
          <planeGeometry args={[W + 0.04, H + 0.04]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        {/* Edge glow — thin border ring around the backplate */}
        <mesh position={[0, 0, -0.028]}>
          <ringGeometry args={[
            Math.min(W, H) * 0.68,
            Math.min(W, H) * 0.72,
            lod.segments * 2,
          ]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isActive ? 0.25 : 0.1}
            toneMapped={false}
          />
        </mesh>

        {/* ── Layer 4: Corner Bracket Details ── */}
        <CornerBrackets width={W} height={H} color={color} />

        {/* ── Holographic Scan Line ── */}
        {lod.enableAnimations && (
          <ScanLine width={W} height={H} color={color} />
        )}

        {/* ── Top Label ── */}
        <Text
          position={[0, H / 2 + 0.04, 0.01]}
          fontSize={0.035}
          color={color}
          anchorX="center"
          anchorY="bottom"
          font="/fonts/Orbitron-Bold.woff"
        >
          {label}
        </Text>

        {/* ── Console Content (variant-specific) ── */}
        <ConsoleContent variant={variant} data={data} color={color} lod={lod} />

        {/* ── Level / status sub-label for XP console ── */}
        {variant === 'xp' && (
          <Text
            position={[0, -H / 2 + 0.04, 0.015]}
            fontSize={0.025}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Sora-Regular.woff"
          >
            {`Level ${data.level ?? 1} — ${data.levelTitle ?? 'Spark Starter'}`}
          </Text>
        )}
      </Float>

      {/* ── Contact Shadow beneath console ── */}
      {lod.enableShadows && (
        <ContactShadows
          position={[0, -0.3, 0]}
          opacity={0.4}
          scale={1.2}
          blur={2}
          far={0.8}
          color={color}
        />
      )}
    </group>
  );
}

// Pre-defined console positions around the map
export const CONSOLE_POSITIONS: Record<ConsoleVariant, { position: [number, number, number]; rotation: [number, number, number] }> = {
  xp:       { position: [-2.5, 0.8, 4.5], rotation: [0, 0.3, 0] },
  badges:   { position: [2.5, 0.8, 4.5],  rotation: [0, -0.3, 0] },
  streak:   { position: [-3.5, 0.8, -1],   rotation: [0, 0.6, 0] },
  progress: { position: [3.5, 0.8, -1],    rotation: [0, -0.6, 0] },
};
