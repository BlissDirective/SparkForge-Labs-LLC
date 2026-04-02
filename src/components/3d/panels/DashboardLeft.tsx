'use client';

// ════════════════════════════════════════════════════════════════
// DashboardLeft — Player Identity Hub (Left Quadrant, FIXED)
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §left_quadrant:
//   - Avatar viewport (placeholder sphere)
//   - AI Guide avatar (floating hologram placeholder)
//   - Trophy display (3 most recent badges)
//   - 4 radial gauges: XP, Level, Streak, Progress
//
// Always visible. Content is always about WHO YOU ARE.
// Position/rotation handled by CockpitUILayer parent group.

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { RadialDial3D } from '../ui/RadialDial3D';
import { useChildStore } from '@/stores/childStore';

export default function DashboardLeft() {
  const child = useChildStore((s) => s.activeChild);
  const badges = useChildStore((s) => s.badges);

  const xp = child?.xp ?? 0;
  const xpMax = 500;
  const level = child?.level ?? 1;
  const streak = child?.streak_count ?? 0;

  const recentBadges = useMemo(() => {
    if (!badges || badges.length === 0) return [];
    return badges.slice(-3).reverse();
  }, [badges]);

  return (
    <group name="dashboard-left">
      {/* ═══ Avatar Viewport ═══ */}
      <group position={[0.15, 0.55, 0.15]}>
        <mesh>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial
            color="#1a1e2e"
            metalness={0.6}
            roughness={0.4}
            emissive="#00BBFF"
            emissiveIntensity={0.3}
          />
        </mesh>
        <Text
          position={[0, -0.18, 0.01]}
          fontSize={0.035}
          color="#F0F0F4"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          {child?.display_name ?? 'Explorer'}
        </Text>
      </group>

      {/* ═══ AI Guide Avatar (placeholder) ═══ */}
      <group position={[-0.15, 0.15, 0.35]}>
        <mesh>
          <octahedronGeometry args={[0.06, 2]} />
          <meshStandardMaterial
            color="#AA66FF"
            transparent
            opacity={0.6}
            emissive="#AA66FF"
            emissiveIntensity={0.8}
          />
        </mesh>
        <Text
          position={[0, -0.1, 0.01]}
          fontSize={0.022}
          color="#AA66FF"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          AI Guide
        </Text>
      </group>

      {/* ═══ Trophy Display (3 recent) ═══ */}
      <group position={[0.35, 0, -0.15]}>
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.02}
          color="#F0F0F480"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          RECENT BADGES
        </Text>
        {recentBadges.map((_badge: unknown, i: number) => (
          <group key={i} position={[(i - 1) * 0.1, -0.02, 0]}>
            <mesh>
              <cylinderGeometry args={[0.025, 0.03, 0.015, 6]} />
              <meshStandardMaterial
                color="#a8b5c8"
                metalness={0.95}
                roughness={0.1}
                emissive="#FFAA44"
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ═══ 4 Radial Gauges ═══ */}
      <group position={[-0.3, -0.55, 0]}>
        <RadialDial3D
          id="xp_gauge"
          label="XP"
          value={xp}
          max={xpMax}
          onChange={() => {}}
          color="#00BBFF"
          position={[0, 0, 0]}
          scale={0.7}
        />
        <RadialDial3D
          id="level_gauge"
          label="LEVEL"
          value={level}
          max={100}
          onChange={() => {}}
          color="#AA66FF"
          position={[0.22, 0, 0]}
          scale={0.7}
        />
        <RadialDial3D
          id="streak_gauge"
          label="STREAK"
          value={streak}
          max={365}
          onChange={() => {}}
          color="#FF6644"
          position={[0.44, 0, 0]}
          scale={0.7}
        />
        <RadialDial3D
          id="progress_gauge"
          label="PROG"
          value={0}
          max={100}
          onChange={() => {}}
          color="#00FF88"
          position={[0.66, 0, 0]}
          scale={0.7}
          formatValue={(v) => `${v}%`}
        />
      </group>
    </group>
  );
}
