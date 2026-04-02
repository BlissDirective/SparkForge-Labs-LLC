'use client';

// ════════════════════════════════════════════════════════════════
// ParentPanel — Parent Dashboard Center Content
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §mode_presets.parent:
//   - Children overview (stats per child)
//   - Time limits controls
//   - Subscription status
//   - Usage graphs (placeholder)
//
// Amber-tinted, reduced cockpit intensity, data-focused.

import { Text } from '@react-three/drei';
import { HolographicButton } from '../ui/HolographicButton';
import { useChildStore } from '@/stores/childStore';

export default function ParentPanel() {
  const children = useChildStore((s) => s.children);
  const activeChild = useChildStore((s) => s.activeChild);

  return (
    <group name="parent">
      {/* ═══ Title ═══ */}
      <group position={[0, 0.75, 0.4]}>
        <Text
          fontSize={0.045}
          color="#FFAA44"
          anchorX="center"
          font="/fonts/Exo2-Bold.woff2"
        >
          Parent Dashboard
        </Text>
        <Text
          position={[0, -0.06, 0]}
          fontSize={0.02}
          color="#F0F0F460"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          Monitor progress and manage settings
        </Text>
      </group>

      {/* ═══ Child Profiles ═══ */}
      <group position={[-0.3, 0.35, 0.3]}>
        <Text
          position={[0.25, 0.1, 0]}
          fontSize={0.022}
          color="#F0F0F460"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          CHILDREN
        </Text>
        {(children ?? []).slice(0, 4).map((child: { id: string; display_name: string; level: number; xp: number }, i: number) => (
          <group key={child.id} position={[i * 0.25, 0, 0]}>
            <mesh>
              <planeGeometry args={[0.22, 0.12]} />
              <meshStandardMaterial
                color="#0A0F1F"
                metalness={0.3}
                roughness={0.8}
                transparent
                opacity={0.8}
              />
            </mesh>
            <Text
              position={[0, 0.02, 0.001]}
              fontSize={0.02}
              color="#F0F0F4"
              anchorX="center"
              font="/fonts/Sora-Regular.woff2"
            >
              {child.display_name}
            </Text>
            <Text
              position={[0, -0.02, 0.001]}
              fontSize={0.016}
              color="#FFAA44"
              anchorX="center"
              font="/fonts/Orbitron-Bold.woff2"
            >
              {`Lv${child.level} · ${child.xp}XP`}
            </Text>
          </group>
        ))}
      </group>

      {/* ═══ Quick Actions ═══ */}
      <group position={[-0.2, -0.3, 0.3]}>
        <HolographicButton
          id="parent-add-child"
          label="Add Child"
          color="#00FF88"
          position={[0, 0, 0]}
          width={0.18}
          height={0.05}
          scale={0.8}
        />
        <HolographicButton
          id="parent-subscription"
          label="Subscription"
          color="#FFAA44"
          position={[0.25, 0, 0]}
          width={0.18}
          height={0.05}
          scale={0.8}
        />
        <HolographicButton
          id="parent-export"
          label="Export Report"
          color="#00BBFF"
          position={[0.5, 0, 0]}
          width={0.18}
          height={0.05}
          scale={0.8}
        />
      </group>
    </group>
  );
}
