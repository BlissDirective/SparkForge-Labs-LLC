'use client';

// ════════════════════════════════════════════════════
// CockpitScrollPanel — Scrollable 3D Cockpit Container
// ════════════════════════════════════════════════════
// Scrollable container using @react-three/uikit with overflow="scroll".
// Carbon composite background, chrome bezel border, accent-colored
// scrollbar. Supports rubber-band overscroll natively.

import { type ReactNode } from 'react';
import { Container } from '@react-three/uikit';

const CARBON_BG = 0x0a0f1f;
const CHROME_BEZEL = 0xa8b5c8;

export interface CockpitScrollPanelProps {
  maxHeight: number;
  color?: number;
  opacity?: number;
  padding?: number;
  width?: number | `${number}%`;
  children?: ReactNode;
}

export function CockpitScrollPanel({
  maxHeight,
  color = 0x00bbff,
  opacity = 1.0,
  padding = 8,
  children,
  ...rest
}: CockpitScrollPanelProps) {
  return (
    <Container
      flexDirection="column"
      maxHeight={maxHeight}
      backgroundColor={CARBON_BG}
      opacity={opacity}
      borderColor={CHROME_BEZEL}
      borderWidth={1}
      borderRadius={4}
      overflow="scroll"
      scrollbarColor={color}
      padding={padding}
      {...rest}
    >
      {children}
    </Container>
  );
}
