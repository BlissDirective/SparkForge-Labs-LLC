'use client';

// ════════════════════════════════════════════════════════════════
// LabsCenter — Labs Map Center Content
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §center_console.per_page_content["/labs"]:
//   - HolographicLabMap (zoomed in, nodes larger)
//   - Click to focus lab, double-click to enter
//
// The HolographicLabMap is rendered by SpatialDashboardContent.
// This panel provides the zoomed camera hint and lab info overlay.

import { Text } from '@react-three/drei';
import { useCockpitStore } from '@/stores/cockpitStore';
import { LAB_COLORS, LAB_NAMES } from '@/config/labs';

export default function LabsCenter() {
  const focusedLabId = useCockpitStore((s) => s.focusedLabId);

  const focusedLabName = focusedLabId ? LAB_NAMES[focusedLabId] ?? '' : '';
  const focusedLabColor = focusedLabId ? LAB_COLORS[focusedLabId] ?? '#00BBFF' : '#00BBFF';

  return (
    <group name="labs-center">
      {/* ═══ Page Title ═══ */}
      <group position={[0, 0.8, 0.4]}>
        <Text
          fontSize={0.05}
          color="#F0F0F4"
          anchorX="center"
          font="/fonts/Exo2-Bold.woff2"
        >
          AI Learning Labs
        </Text>
        <Text
          position={[0, -0.065, 0]}
          fontSize={0.022}
          color="#F0F0F460"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          Click a lab to focus · Double-click to enter
        </Text>
      </group>

      {/* ═══ Focused Lab Info ═══ */}
      {focusedLabId && (
        <group position={[0, -0.7, 0.5]}>
          <mesh>
            <planeGeometry args={[0.5, 0.08]} />
            <meshStandardMaterial
              color="#0A0F1F"
              metalness={0.3}
              roughness={0.8}
              transparent
              opacity={0.85}
            />
          </mesh>
          <Text
            position={[0, 0.005, 0.001]}
            fontSize={0.03}
            color={focusedLabColor}
            anchorX="center"
            font="/fonts/Exo2-Bold.woff2"
          >
            {`Lab ${focusedLabId}: ${focusedLabName}`}
          </Text>
        </group>
      )}
    </group>
  );
}
