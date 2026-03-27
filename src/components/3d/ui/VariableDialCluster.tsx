'use client';

// ════════════════════════════════════════════════════
// VariableDialCluster — 3 Center Console Radial Dials
// ════════════════════════════════════════════════════
// Per cockpit-architecture.json: "Multiple cylindrical/radial dials with
// metallic frames; each dial rotates independently with spring physics
// and iterates linked values live across every page"
//
// Positions: [-1.1, 0.55, -1.4], [0, 0.55, -1.4], [1.1, 0.55, -1.4]
//
// Per-page dial configuration:
//   HOME:     XP Rate / Streak Days / Lab Progress
//   LABS:     Lab Completion / Games Played / Quiz Average
//   ARCADE:   Difficulty / Game Count / Time Played
//   SETTINGS: Volume / Brightness / Particles
//
// ~1.5M triangles total (3 dials × ~500K including chrome housing)

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Text, RoundedBox } from '@react-three/drei';
import { RadialDial3D } from './RadialDial3D';
import { useChildStore } from '@/stores/childStore';
import { useUIStore } from '@/stores/uiStore';
import {
  createAlloyFrameMaterial,
} from '@/lib/3d/cockpitMaterials';

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

// Dial positions on center console
const DIAL_POSITIONS: [number, number, number][] = [
  [-0.14, 0, 0],   // Left dial
  [0, 0, 0],       // Center dial
  [0.14, 0, 0],    // Right dial
];

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

  // Determine page context from route
  const pageKey = useMemo(() => {
    if (!pathname) return 'home';
    if (pathname.startsWith('/labs')) return 'labs';
    if (pathname.startsWith('/arcade')) return 'arcade';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'home';
  }, [pathname]);

  const config = DIAL_CONFIGS[pageKey] || DIAL_CONFIGS.home;

  // Read actual values from child store where applicable
  const dialValues = useMemo(() => {
    if (!activeChild) return { left: 0, center: 0, right: 0 };

    switch (pageKey) {
      case 'home':
        return {
          left: activeChild.xp || 0,
          center: activeChild.streak_count || 0,
          right: 0,  // Lab progress computed elsewhere
        };
      case 'profile':
        return {
          left: activeChild.xp || 0,
          center: activeChild.level || 1,
          right: 0,  // Badge count from query
        };
      default:
        return { left: 0, center: 0, right: 0 };
    }
  }, [activeChild, pageKey]);

  // Chrome housing material
  const housingMaterial = useMemo(() => createAlloyFrameMaterial(), []);

  const dialEntries: { config: DialConfig; pos: [number, number, number]; value: number }[] = [
    { config: config.left,   pos: DIAL_POSITIONS[0], value: dialValues.left },
    { config: config.center, pos: DIAL_POSITIONS[1], value: dialValues.center },
    { config: config.right,  pos: DIAL_POSITIONS[2], value: dialValues.right },
  ];

  return (
    <group position={position} scale={scale}>
      {/* Chrome housing base plate */}
      <RoundedBox
        args={[0.44, 0.06, 0.01]}
        radius={0.005}
        smoothness={4}
        material={housingMaterial}
        position={[0, -0.03, 0]}
      />

      {/* Page context label */}
      <Text
        position={[0, 0.05, 0.005]}
        fontSize={0.008}
        color="#667788"
        anchorX="center"
        anchorY="bottom"
        font="/fonts/JetBrainsMono-Regular.woff"
        letterSpacing={0.08}
      >
        {`◆ ${pageKey.toUpperCase()} CONTROLS ◆`}
      </Text>

      {/* 3 radial dials */}
      {dialEntries.map(({ config: dc, pos, value }) => (
        <RadialDial3D
          key={dc.id}
          id={dc.id}
          label={dc.label}
          min={dc.min}
          max={dc.max}
          value={Math.min(dc.max, Math.max(dc.min, value))}
          onChange={() => {}}  // Display-only for now; settings page overrides
          color={dc.color}
          position={pos}
          formatValue={dc.formatValue}
        />
      ))}
    </group>
  );
}

export default VariableDialCluster;
