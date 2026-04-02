'use client';

// ════════════════════════════════════════════════════════════════
// DashboardCenter — Home Page Center Content
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §center_console.per_page_content["/home"]:
//   - HolographicLabMap (rendered by SpatialDashboardContent in CockpitCanvas)
//   - Welcome stats header (uikit text)
//   - Continue Learning CTA (HolographicButton)
//
// The lab map is already rendered by the SpatialDashboardContent group
// in CockpitCanvas. This panel adds the overlay stats + CTA.

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { HolographicButton } from '../ui/HolographicButton';
import { useChildStore } from '@/stores/childStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

export default function DashboardCenter() {
  const child = useChildStore((s) => s.activeChild);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const displayName = child?.display_name ?? 'Explorer';
  const level = child?.level ?? 1;
  const xp = child?.xp ?? 0;
  const streak = child?.streak_count ?? 0;

  const statsLine = useMemo(
    () => `Level ${level}  ·  ${xp.toLocaleString()} XP  ·  ${streak} day streak`,
    [level, xp, streak],
  );

  const handleContinue = () => {
    broadcast({
      type: 'page-navigate',
      source: 'dashboard-continue-cta',
      color: '#00BBFF',
      label: 'LABS',
      targetPage: '/labs',
    });
  };

  return (
    <group name="dashboard-center">
      {/* ═══ Welcome Stats Header ═══ */}
      <group position={[0, 0.75, 0.4]}>
        <Text
          fontSize={0.06}
          color="#F0F0F4"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Exo2-Bold.woff2"
        >
          {`Welcome back, ${displayName}`}
        </Text>
        <Text
          position={[0, -0.08, 0]}
          fontSize={0.028}
          color="#00BBFF"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Orbitron-Bold.woff2"
        >
          {statsLine}
        </Text>
      </group>

      {/* ═══ Continue Learning CTA ═══ */}
      <group position={[0, -0.75, 0.5]}>
        <HolographicButton
          id="continue-learning"
          label="Continue Learning"
          color="#00BBFF"
          onClick={handleContinue}
          width={0.35}
          height={0.06}
          scale={1.2}
        />
      </group>
    </group>
  );
}
