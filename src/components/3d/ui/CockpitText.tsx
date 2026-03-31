'use client';

// ════════════════════════════════════════════════════
// CockpitText — 3D Text Primitive for Cockpit UI
// ════════════════════════════════════════════════════
// Wraps @react-three/uikit Text with SparkForge Frost-Prismatic
// font/style defaults. Supports variant-based font selection,
// accessibility scaling, and high-contrast mode.

import { type ComponentPropsWithoutRef } from 'react';
import { Text } from '@react-three/uikit';
import { useA11yStore } from '@/stores/accessibilityStore';

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

const BASE_SIZE_MAP: Record<CockpitTextVariant, number> = {
  display: 24,
  body: 14,
  data: 16,
  mono: 13,
  label: 11,
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

type UikitTextProps = ComponentPropsWithoutRef<typeof Text>;

export interface CockpitTextProps extends Omit<UikitTextProps, 'fontSize' | 'color'> {
  /** Font/style variant. Default: 'body' */
  variant?: CockpitTextVariant;
  /** Override base font size (in uikit units). */
  fontSize?: number;
  /** Text color. Default: '#F0F0F4' */
  color?: string;
  /** Accent color for highlights. Default: '#00BBFF' */
  accentColor?: string;
  /** When true, renders in accentColor instead of base color. */
  accent?: boolean;
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
  children,
  ...rest
}: CockpitTextProps) {
  const highContrast = useA11yStore((s) => s.highContrast);
  const fontSizePref = useA11yStore((s) => s.fontSize);

  const multiplier = FONT_SIZE_MULTIPLIER[fontSizePref] ?? 1.0;
  const resolvedSize = (fontSize ?? BASE_SIZE_MAP[variant]) * multiplier;

  const resolvedColor = highContrast
    ? '#FFFFFF'
    : accent
      ? accentColor
      : color;

  return (
    <Text
      fontFamily={FONT_MAP[variant]}
      fontSize={resolvedSize}
      color={resolvedColor}
      {...rest}
    >
      {children}
    </Text>
  );
}
