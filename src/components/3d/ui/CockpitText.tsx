'use client';

// ════════════════════════════════════════════════════
// CockpitText — 3D Text Primitive for Cockpit UI
// ════════════════════════════════════════════════════
// Uses drei's <Text> (troika-three-text SDF rendering) for crisp
// text at any size, rotation, or zoom level. Frost-Prismatic
// font/style defaults with variant-based font selection,
// accessibility scaling, and high-contrast mode.
//
// COCK-04: Migrated from @react-three/uikit rasterized Text to
// @react-three/drei SDF Text (troika-three-text under the hood).

import { type ComponentPropsWithoutRef } from 'react';
import { Text } from '@react-three/drei';
// R2: a11y state merged into uiStore (was accessibilityStore)
import { useUIStore } from '@/stores/uiStore';

// ---------------------------------------------------------------------------
// Font configuration per variant (matches Frost-Prismatic design system)
// ---------------------------------------------------------------------------

const FONT_MAP = {
  display: '/fonts/Exo2-Bold.woff2',
  body: '/fonts/Sora-Regular.woff2',
  data: '/fonts/Orbitron-Bold.woff2',
  mono: '/fonts/JetBrainsMono-Regular.woff2',
  label: '/fonts/Sora-Regular.woff2',
} as const;

// World-unit font sizes aligned with cockpitDesignTokens TYPE_SCALE
const BASE_SIZE_MAP: Record<CockpitTextVariant, number> = {
  display: 0.07,
  body: 0.032,
  data: 0.032,
  mono: 0.028,
  label: 0.022,
};

// ---------------------------------------------------------------------------
// A11y font-size multiplier derived from store's FontSize enum
// ---------------------------------------------------------------------------

const FONT_SIZE_MULTIPLIER: Record<string, number> = {
  normal: 1.0,
  large: 1.25,
  xl: 1.5,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CockpitTextVariant = 'display' | 'body' | 'data' | 'mono' | 'label';

type DreiTextProps = ComponentPropsWithoutRef<typeof Text>;

export interface CockpitTextProps extends Omit<DreiTextProps, 'fontSize' | 'color' | 'font'> {
  /** Font/style variant. Default: 'body' */
  variant?: CockpitTextVariant;
  /** Override base font size (in world units). */
  fontSize?: number;
  /** Text color. Default: '#F0F0F4' */
  color?: string;
  /** Accent color for highlights. Default: '#00BBFF' */
  accentColor?: string;
  /** When true, renders in accentColor instead of base color. */
  accent?: boolean;
  /** Override font path. When set, takes precedence over variant font. */
  font?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CockpitText({
  variant = 'body',
  fontSize,
  color = '#F0F0F4',
  accentColor = '#00BBFF',
  accent = false,
  font,
  anchorX = 'center',
  anchorY = 'middle',
  children,
  ...rest
}: CockpitTextProps) {
  const highContrast = useUIStore((s) => s.a11y.highContrast);
  const fontSizePref = useUIStore((s) => s.a11y.fontSize);

  const multiplier = FONT_SIZE_MULTIPLIER[fontSizePref] ?? 1.0;
  const resolvedSize = (fontSize ?? BASE_SIZE_MAP[variant]) * multiplier;

  const resolvedColor = highContrast
    ? '#FFFFFF'
    : accent
      ? accentColor
      : color;

  return (
    <Text
      font={font ?? FONT_MAP[variant]}
      fontSize={resolvedSize}
      color={resolvedColor}
      anchorX={anchorX}
      anchorY={anchorY}
      {...rest}
    >
      {children}
    </Text>
  );
}
