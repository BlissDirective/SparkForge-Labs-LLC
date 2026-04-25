'use client';

// ════════════════════════════════════════════════════
// CockpitContainer — 3D Panel Container Primitive
// ════════════════════════════════════════════════════
// Wraps @react-three/uikit Container with cockpit styling defaults.
// Three variants: default (carbon composite), holographic (additive
// cyan, for center lab map / data readouts only), and control_panel
// (dark wet-glass with emissive lab-color tint).
//
// Chrome edge-trace hover effect on panels.

import { useMemo, type ReactNode } from 'react';
import { Container, type ContainerProperties } from '@react-three/uikit';

// ── Design tokens ──────────────────────────────────
const CARBON_COMPOSITE_BG = 0x0a0f1f;
const CONTROL_PANEL_BG = 0x0a1625;
const CHROME_BEZEL = 0xa8b5c8;
const HOLOGRAPHIC_BG = 0x061820;
// Chrome (#a8b5c8) blended with cyan (#00E5FF) at ~15%
const CHROME_CYAN_EDGE = 0x93b8cf;

// ── Types ──────────────────────────────────────────

export type CockpitContainerVariant = 'default' | 'holographic' | 'control_panel';

export interface CockpitContainerProps {
  variant?: CockpitContainerVariant;
  color?: number;
  opacity?: number;
  borderRadius?: number;
  padding?: number;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  maxHeight?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexGrow?: number;
  flexShrink?: number;
  gap?: number;
  children?: ReactNode;
}

// ── Component ──────────────────────────────────────

export function CockpitContainer({
  variant = 'default',
  color = 0x00bbff,
  opacity = 1.0,
  borderRadius = 8,
  padding = 12,
  children,
  ...rest
}: CockpitContainerProps) {
  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'holographic':
        return { bg: HOLOGRAPHIC_BG, border: color, bgOpacity: 0.35 };
      case 'control_panel':
        return { bg: CONTROL_PANEL_BG, border: CHROME_BEZEL, bgOpacity: opacity };
      default:
        return { bg: CARBON_COMPOSITE_BG, border: CHROME_BEZEL, bgOpacity: opacity };
    }
  }, [variant, color, opacity]);

  const hoverStyle = useMemo<ContainerProperties['hover']>(() => ({
    borderColor: CHROME_CYAN_EDGE,
  }), []);

  return (
    <Container
      borderRadius={borderRadius}
      padding={padding}
      borderWidth={1}
      backgroundColor={variantStyles.bg}
      opacity={variantStyles.bgOpacity}
      borderColor={variantStyles.border}
      hover={hoverStyle}
      {...rest}
    >
      {children}
    </Container>
  );
}
