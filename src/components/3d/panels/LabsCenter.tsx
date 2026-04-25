'use client';

// ════════════════════════════════════════════════════════════════
// LabsCenter — Labs Map Center Content
// ════════════════════════════════════════════════════════════════
// Decision 25.1: Floating info card materializes next to focused lab node
// Decision 25.2: Both double-click and explicit "Enter Lab" button

import { Text } from '@react-three/drei';
import { HolographicButton } from '../ui/HolographicButton';
import { HolographicCard } from '../ui/HolographicCard';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { LAB_COLORS, LAB_NAMES } from '@/config/labs';
import {
  TYPE_SCALE,
  TEXT_COLORS,
} from '@/lib/3d/cockpitDesignTokens';

export default function LabsCenter() {
  const focusedLabId = useCockpitStore((s) => s.focusedLabId);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const focusedLabName = focusedLabId ? LAB_NAMES[focusedLabId] ?? '' : '';
  const focusedLabColor = focusedLabId ? LAB_COLORS[focusedLabId] ?? '#00BBFF' : '#00BBFF';

  const handleEnterLab = () => {
    if (!focusedLabId) return;
    broadcast({
      type: 'page-navigate',
      source: 'labs-enter-button',
      color: focusedLabColor,
      label: focusedLabName,
      targetPage: `/labs/${focusedLabId}`,
    });
  };

  return (
    <group name="labs-center">
      {/* ═══ Page Title ═══ */}
      <group position={[0, 0.8, 0.4]}>
        <Text
          fontSize={TYPE_SCALE.h1.fontSize}
          color={TEXT_COLORS.primary.hex}
          anchorX="center"
          font={TYPE_SCALE.h1.fontPath}
        >
          AI Learning Labs
        </Text>
        <Text
          position={[0, -0.065, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          Click a lab to focus · Double-click to enter
        </Text>
      </group>

      {/* ═══ Floating Info Card (Decision 25.1) ═══ */}
      {focusedLabId && (
        <group position={[0, -0.65, 0.5]}>
          <HolographicCard
            color={focusedLabColor}
            title={`Lab ${focusedLabId}: ${focusedLabName}`}
            width={0.4}
            height={0.1}
            active
          />

          {/* ═══ Enter Lab Button (Decision 25.2) ═══ */}
          <HolographicButton
            id="enter-lab"
            label="Enter Lab"
            color={focusedLabColor}
            onClick={handleEnterLab}
            size="md"
            position={[0, -0.1, 0]}
          />
        </group>
      )}
    </group>
  );
}
