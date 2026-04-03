'use client';

// ════════════════════════════════════════════════════════════════
// DashboardCenter — Home Page Center Content
// ════════════════════════════════════════════════════════════════
// Decision 24.1: Floating header above lab map (integrated with scene)
// Decision 24.2: No center stats (stats in left panel gauges only)
// Decision 24.3: Bottom CTA — "Continue Learning" at bottom of center content

import { Text } from '@react-three/drei';
import { HolographicButton } from '../ui/HolographicButton';
import { useChildStore } from '@/stores/childStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import {
  TYPE_SCALE,
  TEXT_COLORS,
} from '@/lib/3d/cockpitDesignTokens';

export default function DashboardCenter() {
  const child = useChildStore((s) => s.activeChild);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const displayName = child?.display_name ?? 'Explorer';

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
      {/* ═══ Floating Header Above Lab Map (Decision 24.1) ═══ */}
      <group position={[0, 0.75, 0.4]}>
        <Text
          fontSize={TYPE_SCALE.h1.fontSize}
          color={TEXT_COLORS.primary.hex}
          anchorX="center"
          anchorY="middle"
          font={TYPE_SCALE.h1.fontPath}
        >
          {`Welcome back, ${displayName}`}
        </Text>
      </group>

      {/* Decision 24.2: No center stats — stats shown in left panel gauges only */}

      {/* ═══ Continue Learning CTA — Bottom (Decision 24.3) ═══ */}
      <group position={[0, -0.75, 0.5]}>
        <HolographicButton
          id="continue-learning"
          label="Continue Learning"
          color="#00BBFF"
          onClick={handleContinue}
          size="lg"
          scale={1.2}
        />
      </group>
    </group>
  );
}
