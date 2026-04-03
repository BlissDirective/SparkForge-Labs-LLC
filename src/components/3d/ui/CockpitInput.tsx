'use client';

// ════════════════════════════════════════════════════
// CockpitInput — 3D Text Input for Cockpit UI
// ════════════════════════════════════════════════════
// Wraps @react-three/uikit Input with cockpit styling.
// uikit Input uses a hidden HTML <input> proxy for keyboard,
// paste, and autocomplete browser compatibility. SDF text
// rendering inside the Canvas.
//
// Per SparkForge-Full-ControlScreen.json §interaction_model.text_input

import { useCallback } from 'react';
import { Input } from '@react-three/uikit';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

// ── Design tokens ──────────────────────────────────
const CARBON_BG = 0x0a1625;
const CHROME_BEZEL = 0xa8b5c8;
const TEXT_COLOR = 0xf0f0f4;
const PLACEHOLDER_COLOR = 0x666680;
const FOCUS_GLOW = 0x00bbff;

// ── Types ──────────────────────────────────────────

export interface CockpitInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Accent color for focus ring (default: primary blue) */
  color?: number;
  /** Input value (controlled) */
  value?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Width in uikit units */
  width?: number | `${number}%`;
  /** Input type */
  type?: 'text' | 'password' | 'number';
  /** Font size */
  fontSize?: number;
}

// ── Component ──────────────────────────────────────

export function CockpitInput({
  placeholder = '',
  color = FOCUS_GLOW,
  value,
  onValueChange,
  width = '100%' as `${number}%`,
  type = 'text',
  fontSize = 14,
  ...rest
}: CockpitInputProps) {
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const handleFocus = useCallback(() => {
    broadcast({
      type: 'button-press',
      source: 'cockpit-input',
      color: `#${color.toString(16).padStart(6, '0')}`,
    });
  }, [broadcast, color]);

  return (
    <Input
      width={width}
      height={40}
      backgroundColor={CARBON_BG}
      borderColor={CHROME_BEZEL}
      borderWidth={1}
      borderRadius={6}
      paddingLeft={12}
      paddingRight={12}
      color={TEXT_COLOR}
      fontSize={fontSize}
      placeholder={placeholder}
      placeholderStyle={{
        color: PLACEHOLDER_COLOR,
      }}
      type={type}
      value={value}
      onValueChange={onValueChange}
      onFocusChange={handleFocus}
      focus={{
        borderColor: color,
      }}
      {...rest}
    />
  );
}
