'use client';

// ════════════════════════════════════════════════════════════════
// XPPopup3D — Floating 3D XP Award Text (Phase 4: Gamification)
// ════════════════════════════════════════════════════════════════
// Replaces the HTML XPPopup with 3D floating text rendered inside
// CockpitCanvas. Shows "+X XP" with spring physics rise animation,
// combo multiplier display, and automatic fadeout.
//
// Per JSON spec §mode_presets.celebration:
//   - Gold color (#FFD700) default for XP text
//   - Bloom spike on award
//   - Rises and fades over 1.8s
//
// Usage: Place inside CockpitCanvas. Reads from xpPopup3DStore.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Group } from 'three';
import { create } from 'zustand';
import {
  TYPE_SCALE,
  NUMERIC_FONT,
  NUMERIC_FONT_FAMILY as _NUMERIC_FONT_FAMILY,
  SPRING_PRESETS as _SPRING_PRESETS,
} from '@/lib/3d/cockpitDesignTokens';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

// ═══════════════════════════════════════════════════════════════
// XP POPUP STORE — Manages active XP popup events
// ═══════════════════════════════════════════════════════════════

export interface XPEvent3D {
  id: string;
  amount: number;
  combo?: number;
  label?: string;
  color?: string;
  createdAt: number;
}

interface XPPopup3DState {
  events: XPEvent3D[];
  showXP: (amount: number, opts?: { combo?: number; label?: string; color?: string }) => void;
  removeEvent: (id: string) => void;
}

export const useXPPopup3DStore = create<XPPopup3DState>((set) => ({
  events: [],
  showXP: (amount, opts) => {
    const id = `xp3d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      events: [...s.events, {
        id,
        amount,
        combo: opts?.combo,
        label: opts?.label,
        color: opts?.color,
        createdAt: performance.now(),
      }],
    }));
    // Auto-remove after animation duration
    setTimeout(() => {
      set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    }, 2000);
  },
  removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const POPUP_DURATION = 1.8; // seconds
const RISE_DISTANCE = 0.4;
const BASE_Y = 0.2;
const GOLD_COLOR = '#FFD700';
const _FIRE_COLOR = '#FF6644';
const COMBO_COLORS = ['#F59E0B', '#F97316', '#EF4444', '#DC2626'];

// ═══════════════════════════════════════════════════════════════
// SINGLE XP EVENT RENDERER
// ═══════════════════════════════════════════════════════════════

function XPEventBubble({ event }: { event: XPEvent3D }) {
  const groupRef = useRef<Group>(null);
  const startTime = useRef(event.createdAt);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const broadcasted = useRef(false);

  const textColor = event.color || GOLD_COLOR;
  const isCombo = event.combo && event.combo >= 2;
  const isFire = event.combo && event.combo >= 3;
  const _isLegendary = event.combo && event.combo >= 7;

  const comboText = useMemo(() => {
    if (!event.combo || event.combo < 2) return '';
    if (event.combo >= 7) return 'LEGENDARY';
    if (event.combo >= 5) return 'ON FIRE';
    if (event.combo >= 3) return `COMBO x${event.combo}`;
    return `x${event.combo}`;
  }, [event.combo]);

  const comboColor = useMemo(() => {
    if (!event.combo) return GOLD_COLOR;
    if (event.combo >= 7) return COMBO_COLORS[3];
    if (event.combo >= 5) return COMBO_COLORS[2];
    if (event.combo >= 3) return COMBO_COLORS[1];
    return COMBO_COLORS[0];
  }, [event.combo]);

  // Broadcast XP event on first frame
  useFrame(() => {
    if (!broadcasted.current) {
      broadcasted.current = true;
      broadcast({
        type: 'xp-change',
        source: 'xp-popup-3d',
        value: event.amount,
        color: textColor,
        label: `+${event.amount} XP`,
      });
    }
  });

  // Animate: rise + fade
  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = (performance.now() - startTime.current) / 1000;
    const t = Math.min(elapsed / POPUP_DURATION, 1);

    // Ease-out cubic rise
    const eased = 1 - Math.pow(1 - t, 3);
    groupRef.current.position.y = BASE_Y + eased * RISE_DISTANCE;

    // Scale: pop in then shrink
    const scaleIn = t < 0.15 ? t / 0.15 * 1.2 : t < 0.3 ? 1.2 - (t - 0.15) / 0.15 * 0.2 : 1.0;
    const scaleFade = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1.0;
    const scale = scaleIn * scaleFade;
    groupRef.current.scale.setScalar(Math.max(0.01, scale));

    // Opacity fade at end
    // Text opacity handled via fillOpacity doesn't work dynamically
    // Instead we fade via scale (reaching 0)
  });

  const fontSize = isFire ? 0.08 : isCombo ? 0.065 : 0.055;

  return (
    <group ref={groupRef} position={[0, BASE_Y, -2.5]}>
      {/* Main XP text */}
      <Text
        fontSize={fontSize}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        font={NUMERIC_FONT}
        outlineWidth={0.002}
        outlineColor="#000000"
      >
        {`+${event.amount} XP`}
      </Text>

      {/* Combo indicator */}
      {isCombo && (
        <Text
          position={[0, -0.045, 0]}
          fontSize={0.025}
          color={comboColor}
          anchorX="center"
          anchorY="middle"
          font={TYPE_SCALE.caption.fontPath}
          outlineWidth={0.001}
          outlineColor="#000000"
        >
          {comboText}
        </Text>
      )}

      {/* Custom label */}
      {event.label && (
        <Text
          position={[0, isCombo ? -0.075 : -0.04, 0]}
          fontSize={0.018}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={0.5}
        >
          {event.label}
        </Text>
      )}

      {/* Glow point light for bloom pickup */}
      <pointLight
        color={textColor}
        intensity={isFire ? 2.0 : 1.0}
        distance={1.5}
        decay={2}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT — Renders all active XP popups
// ═══════════════════════════════════════════════════════════════

export function XPPopup3D() {
  const events = useXPPopup3DStore((s) => s.events);

  if (events.length === 0) return null;

  return (
    <group name="xp-popup-3d">
      {events.map((event, i) => (
        <group key={event.id} position={[0, i * 0.12, 0]}>
          <XPEventBubble event={event} />
        </group>
      ))}
    </group>
  );
}

export default XPPopup3D;
