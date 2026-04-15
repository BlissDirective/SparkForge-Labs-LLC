'use client';

// ════════════════════════════════════════════════════════════════════
// ThemePickerChipRow — Phase 5 N.2-MAX + Theme-B
// ════════════════════════════════════════════════════════════════════
// 3D chip row for selecting cockpit theme from inside SettingsPanel.
// Four HolographicButton-styled chips in a horizontal row. Each chip
// shows the theme name + a 3-swatch preview (LED color / panel tint /
// chrome accent). The active theme gets a glowing ring indicator.
// Clicking swaps theme with 600ms fade (handled downstream by
// useCockpitCanvasProps reactive bridge).
//
// Renders as a 3D group — place inside the SettingsPanel geometry at
// the desired world position.
// ════════════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Color, Group, MeshStandardMaterial, MeshBasicMaterial, RingGeometry, DoubleSide } from 'three';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { fireHaptic } from '@/lib/haptic/hapticSim';
import { COCKPIT_THEMES, THEME_ORDER, type ThemeId } from '@/lib/3d/cockpitThemes';
import {
  CHROME_BORDER,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_LED_MULTIPLIER,
  TYPE_SCALE,
} from '@/lib/3d/cockpitDesignTokens';

interface ThemePickerChipRowProps {
  /** World position of the centered chip row. */
  position?: [number, number, number];
  /** Overall scale. */
  scale?: number;
}

const CHIP_WIDTH = 0.32;
const CHIP_HEIGHT = 0.16;
const CHIP_GAP = 0.04;
const CHIP_DEPTH = 0.025;

export function ThemePickerChipRow({
  position = [0, 0, 0],
  scale = 1,
}: ThemePickerChipRowProps) {
  const groupRef = useRef<Group>(null);
  const currentTheme = useCockpitStore((s) => s.cockpitTheme);
  const setCockpitTheme = useCockpitStore((s) => s.setCockpitTheme);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  // Row width: 4 chips + 3 gaps
  const totalWidth = THEME_ORDER.length * CHIP_WIDTH + (THEME_ORDER.length - 1) * CHIP_GAP;
  const startX = -totalWidth / 2 + CHIP_WIDTH / 2;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Section label */}
      <Text
        position={[0, CHIP_HEIGHT * 0.75, 0]}
        fontSize={TYPE_SCALE.label.fontSize}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        fillOpacity={0.75}
      >
        COCKPIT THEME
      </Text>

      {THEME_ORDER.map((themeId, i) => {
        const theme = COCKPIT_THEMES[themeId];
        const isActive = currentTheme === themeId;
        const x = startX + i * (CHIP_WIDTH + CHIP_GAP);

        return (
          <ThemeChip
            key={themeId}
            themeId={themeId}
            position={[x, 0, 0]}
            isActive={isActive}
            name={theme.name}
            swatch={theme.swatch}
            onSelect={() => {
              if (isActive) return;
              fireHaptic('buttonPress');
              setCockpitTheme(themeId);
              broadcast({
                type: 'button-press',
                source: `theme-${themeId}`,
                label: theme.name,
                color: theme.ledBase,
              });
            }}
          />
        );
      })}
    </group>
  );
}

// ─── Individual chip ─────────────────────────────────────────────

interface ThemeChipProps {
  themeId: ThemeId;
  position: [number, number, number];
  isActive: boolean;
  name: string;
  swatch: [string, string, string];
  onSelect: () => void;
}

function ThemeChip({ position, isActive, name, swatch, onSelect }: ThemeChipProps) {
  const chipRef = useRef<Group>(null);
  const ringRef = useRef<MeshBasicMaterial>(null);
  const hoveredRef = useRef(false);

  // Chip chrome material
  const chromeMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(CHROME_BORDER.color),
        metalness: 0.92,
        roughness: 0.25,
        emissive: new Color('#223344'),
        emissiveIntensity: EMISSIVE_IDLE_INDICATOR,
      }),
    []
  );

  // Active indicator ring
  const ringGeometry = useMemo(
    () => new RingGeometry(CHIP_WIDTH * 0.55, CHIP_WIDTH * 0.6, 48),
    []
  );

  // Swatch color objects
  const swatchColors = useMemo(() => swatch.map((c) => new Color(c)), [swatch]);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const pulse = isActive
        ? 1 + Math.sin(clock.elapsedTime * 2.2) * 0.2
        : 0;
      ringRef.current.opacity = pulse * 0.6;
    }
    if (chipRef.current) {
      // Hover lift
      const targetY = hoveredRef.current ? 0.012 : 0;
      chipRef.current.position.y +=
        (targetY - chipRef.current.position.y) * 0.15;
    }
  });

  return (
    <group
      ref={chipRef}
      position={position}
      onPointerOver={() => {
        hoveredRef.current = true;
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        hoveredRef.current = false;
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Base chip body */}
      <mesh material={chromeMaterial}>
        <boxGeometry args={[CHIP_WIDTH, CHIP_HEIGHT, CHIP_DEPTH]} />
      </mesh>

      {/* Active ring */}
      <mesh
        position={[0, 0, CHIP_DEPTH / 2 + 0.005]}
        rotation={[0, 0, 0]}
        geometry={ringGeometry}
      >
        <meshBasicMaterial
          ref={ringRef}
          color={new Color(swatch[0])}
          transparent
          opacity={0}
          side={DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* 3 color swatches as small spheres */}
      {swatchColors.map((color, i) => (
        <mesh
          key={i}
          position={[(i - 1) * 0.05, 0.02, CHIP_DEPTH / 2 + 0.01]}
        >
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={EMISSIVE_LED_MULTIPLIER * 0.7}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Theme name label */}
      <Text
        position={[0, -CHIP_HEIGHT * 0.3, CHIP_DEPTH / 2 + 0.005]}
        fontSize={0.018}
        color={isActive ? swatch[0] : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        fillOpacity={isActive ? 1 : 0.7}
      >
        {name.toUpperCase()}
      </Text>
    </group>
  );
}
