'use client';

// ════════════════════════════════════════════════════
// BadgePedestalBridge — Renders BadgePedestal3D inside
// CockpitCanvas when a showcase badge is selected.
// Must be placed as a child of the R3F <Canvas> (D3D-B1).
// ════════════════════════════════════════════════════

import BadgePedestal3D from '@/components/3d/BadgePedestal3D';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface BadgePedestalBridgeProps {
  badge: { rarity: string; name: string } | null;
  position?: [number, number, number];
}

export default function BadgePedestalBridge({
  badge,
  position = [0, -0.5, -2],
}: BadgePedestalBridgeProps) {
  if (!badge) return null;

  return (
    <group position={position}>
      <BadgePedestal3D
        rarity={badge.rarity as Rarity}
        active
      />
    </group>
  );
}
