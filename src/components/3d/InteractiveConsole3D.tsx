'use client';

// ════════════════════════════════════════════════════
// InteractiveConsole3D — Holographic Stat Consoles
// ════════════════════════════════════════════════════
// 20M COCKPIT UPGRADE: 500K tris/console × 4 = 2M total
// Multi-part housing, holographic projector base, instrument cluster,
// structural detail (cables, vents, ribs), interactive fold panels.
//
// All existing props and CONSOLE_POSITIONS preserved.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

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
  xp: '#00BBFF', badges: '#FFAA44', streak: '#FF6644', progress: '#00FF88',
};

const CONSOLE_LABELS: Record<ConsoleVariant, string> = {
  xp: 'XP STATION', badges: 'BADGE VAULT', streak: 'STREAK CORE', progress: 'LAB PROGRESS',
};

const LAB_COLORS = [
  '#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88',
  '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
];

// ── Housing Frame Rails (~40K tris) ───────────────

function FrameRails({ W, H, color, seg }: { W: number; H: number; color: string; seg: number }) {
  const halfSeg = Math.max(8, Math.floor(seg / 4));
  const railR = 0.012;
  const rails: Array<{ pos: [number,number,number]; rot: [number,number,number]; len: number }> = [
    // Vertical rails
    { pos: [-W/2, 0, 0], rot: [0, 0, 0], len: H },
    { pos: [ W/2, 0, 0], rot: [0, 0, 0], len: H },
    // Horizontal rails
    { pos: [0, -H/2, 0], rot: [0, 0, Math.PI / 2], len: W },
    { pos: [0,  H/2, 0], rot: [0, 0, Math.PI / 2], len: W },
    // Diagonal braces
    { pos: [-W/4,  H/4, 0], rot: [0, 0,  0.6], len: H * 0.4 },
    { pos: [ W/4, -H/4, 0], rot: [0, 0, -0.6], len: H * 0.4 },
  ];
  return (
    <group>
      {rails.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot}>
          <cylinderGeometry args={[railR, railR, r.len, halfSeg, 4]} />
          <meshStandardMaterial color="#2a2a3a" metalness={0.95} roughness={0.1}
            emissive={color} emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* Corner bolt spheres */}
      {[[-W/2,-H/2,0],[W/2,-H/2,0],[-W/2,H/2,0],[W/2,H/2,0]] .map((bp, i) => (
        <mesh key={`bolt-${i}`} position={bp as [number,number,number]}>
          <sphereGeometry args={[0.022, halfSeg, halfSeg]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5}
            metalness={0.9} roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

// ── Side Vent Panels (~30K tris each) ─────────────

function SideVentPanel({ side, H, color, seg }: { side: 1|-1; H: number; color: string; seg: number }) {
  const halfSeg = Math.max(6, Math.floor(seg / 4));
  const ventSlotCount = 8;
  return (
    <group position={[side * 0.38, 0, -0.02]}>
      {/* Panel backing */}
      <mesh>
        <boxGeometry args={[0.06, H * 0.8, 0.06]} />
        <meshStandardMaterial color="#0e0e18" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Vent slots */}
      {Array.from({ length: ventSlotCount }, (_: unknown, i: number) => (
        <mesh key={i} position={[0, -H * 0.3 + i * (H * 0.6 / (ventSlotCount - 1)), 0.034]}>
          <boxGeometry args={[0.05, 0.012, 0.008]} />
          <meshStandardMaterial color="#060610" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* LED accent strip */}
      <mesh position={[0, 0, 0.033]}>
        <boxGeometry args={[0.008, H * 0.7, 0.003]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8}
          transparent opacity={0.9} toneMapped={false} />
      </mesh>
      {/* Structural rib cylinders */}
      {[-H*0.25, 0, H*0.25].map((y, i) => (
        <mesh key={`rib-${i}`} position={[0, y, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.065, halfSeg]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// ── Holographic Projector Base (~60K tris) ─────────

function ProjectorBase({ color, seg, isActive }: { color: string; seg: number; isActive: boolean }) {
  const beamRef = useRef<THREE.Mesh>(null);
  const halfSeg = Math.max(16, Math.floor(seg / 2));

  useFrame(({ clock }) => {
    if (!beamRef.current) return;
    const mat = beamRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = (isActive ? 0.12 : 0.04) + Math.sin(clock.elapsedTime * 2.5) * 0.03;
  });

  return (
    <group position={[0, -0.35, 0.06]}>
      {/* Pedestal base cylinder */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.1, 0.06, seg, 4]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.95} roughness={0.08} />
      </mesh>
      {/* Pedestal step rings */}
      {[0.07, 0.065, 0.055].map((r, i) => (
        <mesh key={i} position={[0, 0.025 + i * 0.012, 0]}>
          <torusGeometry args={[r, 0.005, halfSeg / 2, seg]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4 + i * 0.1}
            metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
      {/* Projector housing sphere */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.055, seg, halfSeg]} />
        <meshStandardMaterial color="#1e1e2e" metalness={0.95} roughness={0.05}
          emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Lens barrel rings */}
      {[0, 0.018, 0.036].map((z, i) => (
        <mesh key={i} position={[0, 0.08, 0.05 + z]}>
          <torusGeometry args={[0.028 - i * 0.004, 0.006, halfSeg / 2, seg]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5 + i * 0.2}
            metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* Projection beam cone */}
      <mesh ref={beamRef} position={[0, 0.15, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.35, seg, 4, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.06}
          side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ── Instrument Cluster (~50K tris) ─────────────────

function InstrumentCluster({ color, seg, data }: { color: string; seg: number; data: ConsoleData }) {
  const halfSeg = Math.max(8, Math.floor(seg / 2));
  const gaugeValues = [
    data.xp ? (data.xp / (data.xpMax ?? 500)) : 0.6,
    data.streak ? Math.min(data.streak / 30, 1) : 0.4,
    data.labsCompleted ? (data.labsCompleted / (data.totalLabs ?? 10)) : 0.7,
  ];

  return (
    <group position={[0, -0.18, 0.03]}>
      {/* Sub-display panels in a row */}
      {[-0.14, 0, 0.14].map((x, gi) => (
        <group key={gi} position={[x, 0, 0]}>
          {/* Gauge housing cylinder */}
          <mesh>
            <cylinderGeometry args={[0.045, 0.05, 0.025, halfSeg]} />
            <meshStandardMaterial color="#111118" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* Gauge face ring */}
          <mesh position={[0, 0.014, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.038, 0.005, halfSeg / 2, halfSeg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4}
              metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Arc fill (progress) */}
          <mesh position={[0, 0.016, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.028, 0.008, halfSeg / 2, halfSeg,
              0, gaugeValues[gi] * Math.PI * 1.5]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
          {/* Needle */}
          <mesh position={[0, 0.018, 0]}
            rotation={[Math.PI / 2, 0, gaugeValues[gi] * Math.PI * 1.5 - Math.PI * 0.75]}>
            <boxGeometry args={[0.003, 0.025, 0.003]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Instrument panel strip */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.36, 0.01, 0.04]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Data column indicators */}
      {Array.from({ length: 8 }, (_: unknown, i: number) => (
        <mesh key={`col-${i}`} position={[-0.14 + i * 0.04, -0.035 + Math.random() * 0.02, 0.025]}>
          <cylinderGeometry args={[0.005, 0.005, 0.02 + (i % 3) * 0.02, 6]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ── Cable Bundles (~20K tris) ──────────────────────

function CableBundles({ color, seg }: { color: string; seg: number }) {
  const bundles = useMemo(() => {
    const defs = [
      [[0.35, -0.2, -0.04],[0.42, 0, 0.02],[0.38, 0.2, -0.02]],
      [[-0.35, -0.2, -0.04],[-0.42, 0, 0.02],[-0.38, 0.2, -0.02]],
      [[0.2, -0.28, -0.05],[0, -0.32, 0],[-0.2, -0.28, -0.05]],
    ] as [number,number,number][][];
    return defs.map((pts) => {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      return new THREE.TubeGeometry(curve, Math.max(8, seg / 4), 0.008, 6, false);
    });
  }, [seg]);

  return (
    <group>
      {bundles.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial color="#0a0a14" metalness={0.7} roughness={0.5}
            emissive={color} emissiveIntensity={0.05} />
        </mesh>
      ))}
    </group>
  );
}

// ── Scan Line ──────────────────────────────────────

function ScanLine({ width, height, color }: { width: number; height: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const t = (Date.now() % 3000) / 3000;
    meshRef.current.position.y = -height / 2 + t * height;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, (1.0 - Math.abs(t - 0.5) * 1.2) * 0.35);
  });
  return (
    <mesh ref={meshRef} position={[0, 0, 0.028]}>
      <planeGeometry args={[width - 0.06, 0.006]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} />
    </mesh>
  );
}

// ── Corner Brackets ────────────────────────────────

function CornerBrackets({ width, height, color }: { width: number; height: number; color: string }) {
  const hw = width / 2 - 0.02, hh = height / 2 - 0.02;
  return (
    <group>
      {([ [-hw,hh,0.026],[hw,hh,0.026],[-hw,-hh,0.026],[hw,-hh,0.026] ] as [number,number,number][]).map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.04, 0.04, 0.008]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6}
            metalness={0.95} roughness={0.15} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── XP Circular Gauge ──────────────────────────────

function XPGauge({ xp, xpMax, color, segments }: { xp: number; xpMax: number; color: string; segments: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = Math.min(xp / Math.max(xpMax, 1), 1);
  const displayRef = useRef(xp);
  useFrame(() => {
    displayRef.current += (xp - displayRef.current) * 0.05;
    if (meshRef.current) meshRef.current.rotation.z = -Math.PI * 0.75;
  });
  const thetaLength = progress * Math.PI * 1.5;
  return (
    <group position={[0, 0.02, 0.015]}>
      <mesh rotation={[0, 0, -Math.PI * 0.75]}>
        <ringGeometry args={[0.1, 0.13, segments, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color="#1A1822" transparent opacity={0.8} />
      </mesh>
      <mesh ref={meshRef}>
        <ringGeometry args={[0.1, 0.13, segments, 1, 0, thetaLength]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <Text position={[0, 0, 0.005]} fontSize={0.055} color={color} anchorX="center" anchorY="middle"
        font="/fonts/Orbitron-Bold.woff">{`${Math.round(xp)}`}</Text>
      <Text position={[0, -0.06, 0.005]} fontSize={0.025} color="#ffffff" anchorX="center" anchorY="middle"
        font="/fonts/Sora-Regular.woff">{`/ ${xpMax} XP`}</Text>
    </group>
  );
}

// ── Badge Pedestal ─────────────────────────────────

function BadgePedestal({ badgeCount, recentBadge, color, segments, enableEffects }: {
  badgeCount: number; recentBadge?: string; color: string; segments: number; enableEffects: boolean;
}) {
  const pedRef  = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (pedRef.current) pedRef.current.rotation.y += delta * 0.5;
    if (glowRef.current && enableEffects) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(Date.now() * 0.004) * 0.15;
    }
  });
  return (
    <group position={[0, 0.01, 0.015]}>
      <group ref={pedRef}>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.03, segments]} />
          <meshStandardMaterial color="#1A1822" metalness={0.95} roughness={0.15}
            emissive={color} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, -0.024, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.08, segments]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.6} />
        </mesh>
      </group>
      {enableEffects && (
        <mesh ref={glowRef} position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.14, segments]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} />
        </mesh>
      )}
      <Text position={[0, 0.04, 0.005]} fontSize={0.07} color={color} anchorX="center" anchorY="middle"
        font="/fonts/Orbitron-Bold.woff">{`${badgeCount}`}</Text>
      <Text position={[0, -0.01, 0.005]} fontSize={0.028} color="#ffffff" anchorX="center" anchorY="middle"
        font="/fonts/Sora-Regular.woff">Badges Earned</Text>
      {recentBadge && (
        <Text position={[0, -0.08, 0.005]} fontSize={0.022} color={color} anchorX="center" anchorY="middle"
          font="/fonts/Sora-Regular.woff">{`Latest: ${recentBadge}`}</Text>
      )}
    </group>
  );
}

// ── Streak Flame ────────────────────────────────────

function StreakFlame({ streak, color, segments, enableAnimations }: {
  streak: number; color: string; segments: number; enableAnimations: boolean;
}) {
  const flameRef = useRef<THREE.Group>(null);
  const flameScale = Math.min(0.5 + (streak / 30) * 1.0, 1.5);
  useFrame(() => {
    if (!flameRef.current || !enableAnimations) return;
    const t = Date.now() * 0.005;
    flameRef.current.scale.x = flameScale * (1.0 + Math.sin(t * 1.3) * 0.06);
    flameRef.current.scale.y = flameScale * (1.0 + Math.sin(t * 1.7) * 0.08);
    flameRef.current.scale.z = flameScale * (1.0 + Math.sin(t * 1.1) * 0.05);
  });
  return (
    <group position={[0, 0.02, 0.015]}>
      <group ref={flameRef} scale={flameScale}>
        <mesh position={[0, 0.01, 0]}>
          <coneGeometry args={[0.04, 0.12, segments]} />
          <meshStandardMaterial color="#FF6644" emissive="#FF6644" emissiveIntensity={0.9}
            transparent opacity={0.9} toneMapped={false} />
        </mesh>
        <mesh position={[-0.025, -0.01, 0]} rotation={[0, 0, 0.15]}>
          <coneGeometry args={[0.03, 0.09, segments]} />
          <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.8}
            transparent opacity={0.8} toneMapped={false} />
        </mesh>
        <mesh position={[0.025, -0.01, 0]} rotation={[0, 0, -0.15]}>
          <coneGeometry args={[0.03, 0.09, segments]} />
          <meshStandardMaterial color="#FF4422" emissive="#FF4422" emissiveIntensity={0.8}
            transparent opacity={0.8} toneMapped={false} />
        </mesh>
      </group>
      <Text position={[0, -0.08, 0.005]} fontSize={0.065} color={color} anchorX="center" anchorY="middle"
        font="/fonts/Orbitron-Bold.woff">{`${streak}`}</Text>
      <Text position={[0, -0.12, 0.005]} fontSize={0.028} color="#ffffff" anchorX="center" anchorY="middle"
        font="/fonts/Sora-Regular.woff">Day Streak</Text>
    </group>
  );
}

// ── Progress Grid ──────────────────────────────────

function ProgressGrid({ labsCompleted, totalLabs, color }: { labsCompleted: number; totalLabs: number; color: string }) {
  const completed = labsCompleted ?? 0;
  const total = totalLabs ?? 10;
  const squares = useMemo(() => {
    return Array.from({ length: total }, (_: unknown, i: number) => ({
      pos: [-0.1 + (i % 5) * 0.05, 0.02 - Math.floor(i / 5) * 0.055, 0.015] as [number,number,number],
      lit: i < completed,
      labColor: LAB_COLORS[i] ?? '#333333',
    }));
  }, [completed, total]);
  return (
    <group position={[0, 0.02, 0]}>
      <Text position={[0, 0.1, 0.015]} fontSize={0.04} color={color} anchorX="center" anchorY="middle"
        font="/fonts/Orbitron-Bold.woff">{`${completed} / ${total}`}</Text>
      <Text position={[0, 0.065, 0.015]} fontSize={0.025} color="#ffffff" anchorX="center" anchorY="middle"
        font="/fonts/Sora-Regular.woff">Labs Explored</Text>
      {squares.map((sq, i) => (
        <mesh key={i} position={sq.pos}>
          <boxGeometry args={[0.035, 0.035, 0.006]} />
          <meshStandardMaterial color={sq.lit ? sq.labColor : '#1A1822'}
            emissive={sq.lit ? sq.labColor : '#000000'}
            emissiveIntensity={sq.lit ? 0.7 : 0} metalness={0.6} roughness={0.3} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Console Content Router ─────────────────────────

function ConsoleContent({ variant, data, color }: {
  variant: ConsoleVariant; data: ConsoleData; color: string;
}) {
  switch (variant) {
    case 'xp':       return <XPGauge xp={data.xp ?? 0} xpMax={data.xpMax ?? 500} color={color} segments={64} />;
    case 'badges':   return <BadgePedestal badgeCount={data.badgeCount ?? 0} recentBadge={data.recentBadge} color={color} segments={64} enableEffects={true} />;
    case 'streak':   return <StreakFlame streak={data.streak ?? 0} color={color} segments={64} enableAnimations={true} />;
    case 'progress': return <ProgressGrid labsCompleted={data.labsCompleted ?? 0} totalLabs={data.totalLabs ?? 10} color={color} />;
  }
}

// ── Rising Antenna (interactive active state) ──────

function RisingAntenna({ color, seg, isActive }: { color: string; seg: number; isActive: boolean }) {
  const antennaRef = useRef<THREE.Group>(null);
  const halfSeg = Math.max(8, Math.floor(seg / 4));
  useFrame(() => {
    if (!antennaRef.current) return;
    const target = isActive ? 1 : 0;
    antennaRef.current.scale.y += (target - antennaRef.current.scale.y) * 0.08;
  });
  return (
    <group ref={antennaRef} position={[0, 0.28, 0]} scale={[1, 0, 1]}>
      <mesh>
        <cylinderGeometry args={[0.005, 0.008, 0.12, halfSeg]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.014, halfSeg, halfSeg]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </group>
  );
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
  const groupRef  = useRef<THREE.Group>(null);
  const glowRef   = useRef<THREE.Mesh>(null);
  const statusRef = useRef<THREE.Mesh>(null);
  const color  = CONSOLE_COLORS[variant];
  const label  = CONSOLE_LABELS[variant];
  const seg    = 64;

  // Console dimensions
  const W = 0.7, H = 0.5;

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002 + variant.charCodeAt(0)) * 0.03;

    if (glowRef.current) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isActive ? 0.25 + pulse : 0.08 + pulse * 0.5;
    }
    if (statusRef.current) {
      const sp = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
      (statusRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + sp * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={new THREE.Euler(...rotation)}>
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.15}>

        {/* ── Layer 1: Outer Chrome Frame (RoundedBox) ── */}
        <RoundedBox
          args={[W, H, 0.06]}
          radius={0.022}
          smoothness={64 >= 12 ? 6 : 3}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerEnter={() => { document.body.style.cursor = 'pointer'; }}
          onPointerLeave={() => { document.body.style.cursor = 'default'; }}
        >
          <meshStandardMaterial color="#222230" metalness={0.95} roughness={0.1}
            emissive={color} emissiveIntensity={isActive ? 0.12 : 0.03} />
        </RoundedBox>

        {/* ── Layer 2: Glass Panel ── */}
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[W - 0.08, H - 0.08]} />
          <meshPhysicalMaterial color="#111118" metalness={0.1} roughness={0.1}
            transmission={0.4} thickness={0.02} transparent opacity={0.85} />
        </mesh>

        {/* ── Layer 3: Holographic Backplate ── */}
        <mesh ref={glowRef} position={[0, 0, -0.035]}>
          <planeGeometry args={[W + 0.04, H + 0.04]} />
          <meshBasicMaterial color={color} transparent opacity={0.08}
            side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {/* Edge glow ring */}
        <mesh position={[0, 0, -0.033]}>
          <ringGeometry args={[Math.min(W, H) * 0.68, Math.min(W, H) * 0.72, seg * 2]} />
          <meshBasicMaterial color={color} transparent opacity={isActive ? 0.25 : 0.1} toneMapped={false} />
        </mesh>

        {/* ── Frame Rails ── */}
        <FrameRails W={W} H={H} color={color} seg={seg} />

        {/* ── Side Vent Panels ── */}
        <SideVentPanel side={1}  H={H} color={color} seg={seg} />
        <SideVentPanel side={-1} H={H} color={color} seg={seg} />

        {/* ── Corner Brackets ── */}
        <CornerBrackets width={W} height={H} color={color} />

        {/* ── Holographic Projector Base ── */}
        <ProjectorBase color={color} seg={seg} isActive={isActive} />

        {/* ── Instrument Cluster ── */}
        <InstrumentCluster color={color} seg={seg} data={data} />

        {/* ── Cable Bundles ── */}
        {<CableBundles color={color} seg={seg} />}

        {/* ── Structural Ribs (vertical back bars) ── */}
        {[-W/3, 0, W/3].map((x, i) => (
          <mesh key={`rib-${i}`} position={[x, 0, -0.032]}>
            <cylinderGeometry args={[0.007, 0.007, H * 0.85, Math.max(6, seg / 8)]} />
            <meshStandardMaterial color="#1a1a2a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* ── Status Ring (active indicator) ── */}
        <mesh ref={statusRef} position={[0, H / 2 + 0.015, 0.005]}>
          <ringGeometry args={[0.02, 0.026, seg]} />
          <meshBasicMaterial color={color} transparent opacity={isActive ? 0.8 : 0.2} toneMapped={false} />
        </mesh>

        {/* ── Scan Line ── */}
        {<ScanLine width={W} height={H} color={color} />}

        {/* ── Rising Antenna (active state) ── */}
        <RisingAntenna color={color} seg={seg} isActive={isActive} />

        {/* ── Top Label ── */}
        <Text position={[0, H / 2 + 0.04, 0.01]} fontSize={0.035} color={color}
          anchorX="center" anchorY="bottom" font="/fonts/Orbitron-Bold.woff">
          {label}
        </Text>

        {/* ── Console Content ── */}
        <ConsoleContent variant={variant} data={data} color={color} />

        {/* ── XP Level label ── */}
        {variant === 'xp' && (
          <Text position={[0, -H / 2 + 0.04, 0.015]} fontSize={0.025} color="#ffffff"
            anchorX="center" anchorY="middle" font="/fonts/Sora-Regular.woff">
            {`Level ${data.level ?? 1} — ${data.levelTitle ?? 'Spark Starter'}`}
          </Text>
        )}
      </Float>

      {/* ── Contact Shadow ── */}
      {(
        <ContactShadows position={[0, -0.3, 0]} opacity={0.4} scale={1.2} blur={2} far={0.8} color={color} />
      )}
    </group>
  );
}

// ── Console positions ──────────────────────────────

export const CONSOLE_POSITIONS: Record<ConsoleVariant, { position: [number, number, number]; rotation: [number, number, number] }> = {
  xp:       { position: [-2.5, 0.8, 4.5], rotation: [0, 0.3, 0] },
  badges:   { position: [ 2.5, 0.8, 4.5], rotation: [0, -0.3, 0] },
  streak:   { position: [-3.5, 0.8, -1],  rotation: [0, 0.6, 0] },
  progress: { position: [ 3.5, 0.8, -1],  rotation: [0, -0.6, 0] },
};
