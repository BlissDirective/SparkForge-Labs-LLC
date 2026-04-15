'use client';

// ════════════════════════════════════════════════════════════════════
// ThemePickerDial — Phase 5 N.2-MAX + Theme-A
// ════════════════════════════════════════════════════════════════════
// In-cockpit 3D rotary dial with 4 detent positions for selecting the
// current cockpit theme. Twist to snap to FROST / CYBER / SPACE / SUN.
//
// Wraps RadialDial3D with:
//   - Discrete-value mapping (index 0..3 → ThemeId)
//   - snapToGrid haptic on each detent crossing
//   - Active-detent emissive halo in the theme's ledBase color
//
// Renders as a small dial at the right edge of the cockpit side
// console. Placed by the caller (SettingsPanel or DashboardRight).
// ════════════════════════════════════════════════════════════════════

import { useCallback, useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import { Color } from 'three';
import { RadialDial3D } from './RadialDial3D';
import { useCockpitStore } from '@/stores/cockpitStore';
import { fireHaptic } from '@/lib/haptic/hapticSim';
import { COCKPIT_THEMES, THEME_ORDER } from '@/lib/3d/cockpitThemes';
import { TYPE_SCALE } from '@/lib/3d/cockpitDesignTokens';

interface ThemePickerDialProps {
  position?: [number, number, number];
  scale?: number;
}

// Detent labels (short enough to read on small 3D dial face)
const DETENT_LABELS = THEME_ORDER.map((id) =>
  COCKPIT_THEMES[id].name.toUpperCase().slice(0, 5)
);

export function ThemePickerDial({
  position = [0, 0, 0],
  scale = 1,
}: ThemePickerDialProps) {
  const currentTheme = useCockpitStore((s) => s.cockpitTheme);
  const setCockpitTheme = useCockpitStore((s) => s.setCockpitTheme);
  const lastIndexRef = useRef<number>(THEME_ORDER.indexOf(currentTheme));

  // Map current theme → dial value (0, 1, 2, 3)
  const dialValue = THEME_ORDER.indexOf(currentTheme);
  const activeColor = COCKPIT_THEMES[currentTheme].ledBase;

  const handleChange = useCallback(
    (newValue: number) => {
      // Snap to nearest integer detent
      const index = Math.max(
        0,
        Math.min(THEME_ORDER.length - 1, Math.round(newValue))
      );
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        // Detent crossing → snap haptic + theme swap
        fireHaptic('snapToGrid');
        const next = THEME_ORDER[index];
        if (next && next !== currentTheme) {
          setCockpitTheme(next);
        }
      }
    },
    [currentTheme, setCockpitTheme]
  );

  const formatDetent = useCallback(
    (v: number) => DETENT_LABELS[Math.round(v)] ?? '',
    []
  );

  // Active color Color object for the halo
  const haloColor = useMemo(() => new Color(activeColor), [activeColor]);

  return (
    <group position={position} scale={scale}>
      {/* Label above dial */}
      <Text
        position={[0, 0.135, 0]}
        fontSize={TYPE_SCALE.label.fontSize}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        fillOpacity={0.8}
      >
        THEME
      </Text>

      {/* Halo ring glows in the active theme color — visual confirmation
          that the dial is tied to the current theme selection. */}
      <mesh position={[0, 0, -0.005]}>
        <ringGeometry args={[0.105, 0.135, 48]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={0.4}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Underlying dial — 4 detent positions mapped to 0..3 */}
      <RadialDial3D
        id="theme-picker"
        label="THEME"
        min={0}
        max={THEME_ORDER.length - 1}
        value={dialValue}
        onChange={handleChange}
        color={activeColor}
        formatValue={formatDetent}
      />
    </group>
  );
}
