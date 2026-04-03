'use client';

// ════════════════════════════════════════════════════════════════
// ParentPanel — Parent Dashboard Center Content
// ════════════════════════════════════════════════════════════════
// Decision 29.1: Profile cards — each child as HolographicCard with avatar, name, level, XP
// Decision 29.2: Side panel — action buttons in vertical column on right side

import { Text } from '@react-three/drei';
import { HolographicButton } from '../ui/HolographicButton';
import { HolographicCard } from '../ui/HolographicCard';
import { useChildStore } from '@/stores/childStore';
import {
  TYPE_SCALE,
  TEXT_COLORS,
  NUMERIC_FONT as _NUMERIC_FONT,
} from '@/lib/3d/cockpitDesignTokens';

export default function ParentPanel() {
  const children = useChildStore((s) => s.children);

  return (
    <group name="parent">
      {/* ═══ Title ═══ */}
      <group position={[0, 0.75, 0.4]}>
        <Text
          fontSize={TYPE_SCALE.h1.fontSize}
          color="#FFAA44"
          anchorX="center"
          font={TYPE_SCALE.h1.fontPath}
        >
          Parent Dashboard
        </Text>
        <Text
          position={[0, -0.06, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          Monitor progress and manage settings
        </Text>
      </group>

      {/* ═══ Child Profile Cards (Decision 29.1) ═══ */}
      <group position={[-0.35, 0.3, 0.3]}>
        <Text
          position={[0.25, 0.1, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          CHILDREN
        </Text>
        {(children ?? []).slice(0, 4).map((child: { id: string; display_name: string; level: number; xp: number }, i: number) => (
          <HolographicCard
            key={child.id}
            title={child.display_name}
            subtitle={`Lv${child.level} · ${child.xp}XP`}
            color="#FFAA44"
            position={[i * 0.22, -0.04, 0]}
            width={0.2}
            height={0.1}
            scale={0.9}
          />
        ))}
      </group>

      {/* ═══ Action Buttons — Vertical Column Right Side (Decision 29.2) ═══ */}
      <group position={[0.45, 0.1, 0.3]}>
        <HolographicButton id="parent-add-child" label="Add Child" color="#00FF88" position={[0, 0, 0]} size="md" scale={0.8} />
        <HolographicButton id="parent-subscription" label="Subscription" color="#FFAA44" position={[0, -0.08, 0]} size="md" scale={0.8} />
        <HolographicButton id="parent-export" label="Export Report" color="#00BBFF" position={[0, -0.16, 0]} size="md" scale={0.8} />
      </group>
    </group>
  );
}
