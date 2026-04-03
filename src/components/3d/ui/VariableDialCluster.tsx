'use client';

// ════════════════════════════════════════════════════
// VariableDialCluster — 3 Center Console Radial Dials
// ════════════════════════════════════════════════════
// Decision 15.1: Individual pods — Each dial has own circular mounting
//   pod connected by thin chrome rails. Modular, industrial lab equipment.
// Decision 15.2: Arc row — 3 dials following cockpit hull curvature.
//   Each angled slightly toward camera. Integrated, immersive.
// Decision 15.3: Instant swap — Labels change immediately on page switch.
//
// Per-page dial configuration:
//   HOME:     XP Rate / Streak Days / Lab Progress
//   LABS:     Completion / Games Played / Quiz Average
//   ARCADE:   Difficulty / Game Count / Time Played
//   SETTINGS: Volume / Brightness / Particles
//   PROFILE:  Total XP / Level / Badges
//
// ~1.5M triangles total (3 dials × ~500K including chrome pods + rails)

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Text } from '@react-three/drei';
import {
  Color,
  CylinderGeometry,
  MeshStandardMaterial,
} from 'three';
import { RadialDial3D } from './RadialDial3D';
import { useChildStore } from '@/stores/childStore';
import {
  CHROME_BORDER,
  TYPE_SCALE,
  TEXT_COLORS,
  EMISSIVE_IDLE_INDICATOR,
} from '@/lib/3d/cockpitDesignTokens';

interface DialConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  color: string;
  formatValue?: (v: number) => string;
}

interface PageDialConfigs {
  left: DialConfig;
  center: DialConfig;
  right: DialConfig;
}

// ■■ Per-page dial configurations ■■
const DIAL_CONFIGS: Record<string, PageDialConfigs> = {
  home: {
    left:   { id: 'home-xp',     label: 'XP RATE',       min: 0, max: 1000,  color: '#00BBFF' },
    center: { id: 'home-streak', label: 'STREAK DAYS',   min: 0, max: 365,   color: '#FF6644' },
    right:  { id: 'home-labs',   label: 'LAB PROGRESS',  min: 0, max: 100,   color: '#00FF88', formatValue: (v) => `${Math.round(v)}%` },
  },
  labs: {
    left:   { id: 'labs-complete', label: 'COMPLETION',   min: 0, max: 100,   color: '#AA66FF', formatValue: (v) => `${Math.round(v)}%` },
    center: { id: 'labs-games',   label: 'GAMES PLAYED', min: 0, max: 35,    color: '#00FF88' },
    right:  { id: 'labs-quiz',    label: 'QUIZ AVG',     min: 0, max: 100,   color: '#FFAA44', formatValue: (v) => `${Math.round(v)}%` },
  },
  arcade: {
    left:   { id: 'arcade-diff',  label: 'DIFFICULTY',   min: 1, max: 10,    color: '#FF6644' },
    center: { id: 'arcade-count', label: 'GAME COUNT',   min: 0, max: 35,    color: '#00BBFF' },
    right:  { id: 'arcade-time',  label: 'TIME PLAYED',  min: 0, max: 600,   color: '#AA66FF', formatValue: (v) => `${Math.round(v / 60)}m` },
  },
  settings: {
    left:   { id: 'set-volume',   label: 'VOLUME',       min: 0, max: 100,   color: '#FFAA44', formatValue: (v) => `${Math.round(v)}%` },
    center: { id: 'set-bright',   label: 'BRIGHTNESS',   min: 0, max: 100,   color: '#00BBFF', formatValue: (v) => `${Math.round(v)}%` },
    right:  { id: 'set-particle', label: 'PARTICLES',    min: 0, max: 100,   color: '#00FF88', formatValue: (v) => `${Math.round(v)}%` },
  },
  profile: {
    left:   { id: 'prof-xp',     label: 'TOTAL XP',     min: 0, max: 50000, color: '#00BBFF', formatValue: (v) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : Math.round(v).toString() },
    center: { id: 'prof-level',  label: 'LEVEL',        min: 1, max: 100,   color: '#AA66FF' },
    right:  { id: 'prof-badges', label: 'BADGES',       min: 0, max: 78,    color: '#FFAA44' },
  },
};

// ■■ Arc row positions — following cockpit hull curvature ■■
// Each dial offset in Z and rotated slightly toward camera
const DIAL_POSITIONS: { pos: [number, number, number]; rotY: number }[] = [
  { pos: [-0.15, 0, -0.012], rotY:  0.08 },  // Left: angled right
  { pos: [0,     0,  0.005], rotY:  0.00 },  // Center: straight
  { pos: [0.15,  0, -0.012], rotY: -0.08 },  // Right: angled left
];

// ■■ Pod dimensions ■■
const POD_RADIUS = 0.055;
const POD_HEIGHT = 0.015;
const RAIL_LENGTH = 0.04;
const RAIL_WIDTH = 0.004;
const RAIL_HEIGHT = 0.006;

interface VariableDialClusterProps {
  position?: [number, number, number];
  scale?: number;
}

export function VariableDialCluster({
  position = [0, 0.55, -1.4],
  scale = 1,
}: VariableDialClusterProps) {
  const pathname = usePathname();
  const activeChild = useChildStore((s) => s.activeChild);

  // Determine page context from route (instant swap — Decision 15.3)
  const pageKey = useMemo(() => {
    if (!pathname) return 'home';
    if (pathname.startsWith('/labs')) return 'labs';
    if (pathname.startsWith('/arcade')) return 'arcade';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'home';
  }, [pathname]);

  const config = DIAL_CONFIGS[pageKey] || DIAL_CONFIGS.home;

  // Read actual values from child store
  const dialValues = useMemo(() => {
    if (!activeChild) return { left: 0, center: 0, right: 0 };

    switch (pageKey) {
      case 'home':
        return {
          left: activeChild.xp || 0,
          center: activeChild.streak_count || 0,
          right: 0,
        };
      case 'profile':
        return {
          left: activeChild.xp || 0,
          center: activeChild.level || 1,
          right: 0,
        };
      default:
        return { left: 0, center: 0, right: 0 };
    }
  }, [activeChild, pageKey]);

  // ■■ Materials ■■
  const podMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0A0F1F'),
    metalness: 0.85,
    roughness: 0.35,
  }), []);

  const chromeMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color(CHROME_BORDER.colorHex),
    metalness: 0.95,
    roughness: 0.15,
    emissive: new Color('#223344'),
    emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), []);

  const dialEntries: { config: DialConfig; layout: typeof DIAL_POSITIONS[0]; value: number }[] = [
    { config: config.left,   layout: DIAL_POSITIONS[0], value: dialValues.left },
    { config: config.center, layout: DIAL_POSITIONS[1], value: dialValues.center },
    { config: config.right,  layout: DIAL_POSITIONS[2], value: dialValues.right },
  ];

  return (
    <group position={position} scale={scale}>
      {/* Page context label */}
      <Text
        position={[0, 0.06, 0.005]}
        fontSize={TYPE_SCALE.caption.fontSize}
        color={TEXT_COLORS.muted.hex}
        anchorX="center"
        anchorY="bottom"
        font={TYPE_SCALE.caption.fontPath}
        letterSpacing={0.08}
        fillOpacity={TEXT_COLORS.muted.opacity}
      >
        {`${pageKey.toUpperCase()} CONTROLS`}
      </Text>

      {/* 3 dials with individual pods in arc row */}
      {dialEntries.map(({ config: dc, layout, value }, index) => (
        <group key={dc.id} position={layout.pos} rotation={[0, layout.rotY, 0]}>
          {/* Individual circular mounting pod (Decision 15.1) */}
          <mesh material={podMaterial} position={[0, -0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[POD_RADIUS, POD_RADIUS, POD_HEIGHT, 32]} />
          </mesh>

          {/* Chrome rim around pod */}
          <mesh material={chromeMaterial} position={[0, -0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[POD_RADIUS, 0.003, 8, 32]} />
          </mesh>

          {/* Radial dial on top of pod */}
          <RadialDial3D
            id={dc.id}
            label={dc.label}
            min={dc.min}
            max={dc.max}
            value={Math.min(dc.max, Math.max(dc.min, value))}
            onChange={() => {}}
            color={dc.color}
            position={[0, 0, 0]}
            formatValue={dc.formatValue}
            readOnly={pageKey !== 'settings'}
          />
        </group>
      ))}

      {/* Chrome rails connecting pods (Decision 15.1) */}
      {/* Left-to-center rail */}
      <mesh material={chromeMaterial} position={[-0.075, -0.035, -0.003]}>
        <boxGeometry args={[RAIL_LENGTH, RAIL_HEIGHT, RAIL_WIDTH]} />
      </mesh>
      {/* Center-to-right rail */}
      <mesh material={chromeMaterial} position={[0.075, -0.035, -0.003]}>
        <boxGeometry args={[RAIL_LENGTH, RAIL_HEIGHT, RAIL_WIDTH]} />
      </mesh>
    </group>
  );
}

export default VariableDialCluster;
