'use client';

// ════════════════════════════════════════════════════════════════
// SaveIndicator3D — UX-MED-001 (Opt A)
// ════════════════════════════════════════════════════════════════
// Compact auto-save indicator anchored to the top-right of the
// GameHUD3D band (+x offset from HUD center). Reflects
// gameStore.saveState:
//   idle   → fully transparent (hidden)
//   saving → amber hex + soft pulse
//   saved  → green hex + check glyph (fades back to idle after 1.5s
//            via the consumer, not this component)
//   error  → red hex + flash
//
// No HTML — renders 100% in 3D. WCAG announcement happens in the
// sr-only A11yAnnouncer when save state changes (follow-up; the 3D
// indicator is purely visual).
//
// Positioned so it does NOT overlap the future PauseButton3D
// (T10b) which anchors at [0, 1.2, -2.0]; SaveIndicator3D sits to
// the right of the HUD band at roughly [+0.65, 0.0, 0] relative
// to the HUD's Y/Z.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { Text } from '@react-three/drei';
import { useGameStore } from '@/stores/gameStore';
import {
  NUMERIC_FONT,
  TYPE_SCALE,
} from '@/lib/3d/cockpitDesignTokens';

const COLORS = {
  saving: '#FFAA44', // amber
  saved: '#00FF88', // green
  error: '#FF6644', // orange-red
  idle: '#00BBFF', // cached default, invisible
} as const;

// Target opacity per state — the indicator interpolates towards it.
const OPACITIES = {
  idle: 0.0,
  saving: 0.9,
  saved: 0.95,
  error: 0.95,
} as const;

interface SaveIndicator3DProps {
  /** Offset relative to HUD center. Defaults to the top-right slot. */
  position?: [number, number, number];
}

export function SaveIndicator3D({
  position = [0.65, 0.0, 0.02],
}: SaveIndicator3DProps) {
  const saveState = useGameStore((s) => s.saveState);

  const hexRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const glowMatRef = useRef<MeshStandardMaterial>(null);

  // Hex prism — 6-sided cylinder, small
  const geometry = useMemo(
    () => new CylinderGeometry(0.045, 0.045, 0.02, 6),
    [],
  );

  // Separate material for the main hex and the glow ring behind it.
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(COLORS.idle),
        emissive: new Color(COLORS.idle),
        emissiveIntensity: 1.2,
        metalness: 0.4,
        roughness: 0.3,
        transparent: true,
        opacity: 0,
      }),
    [],
  );
  const glowMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(COLORS.idle),
        emissive: new Color(COLORS.idle),
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0,
      }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const colorHex =
      saveState === 'saving'
        ? COLORS.saving
        : saveState === 'saved'
          ? COLORS.saved
          : saveState === 'error'
            ? COLORS.error
            : COLORS.idle;
    const targetOpacity = OPACITIES[saveState];

    // Pulse amplitude per state (saving = strong pulse, saved/error = steady glow)
    const pulse =
      saveState === 'saving'
        ? 0.3 + Math.abs(Math.sin(t * 4)) * 0.4
        : saveState === 'error'
          ? 0.5 + Math.abs(Math.sin(t * 6)) * 0.5
          : saveState === 'saved'
            ? 0.8
            : 0;

    // Smooth opacity lerp — avoids jarring state-transition pops.
    const lerp = 1 - Math.exp(-delta * 10);

    if (matRef.current) {
      matRef.current.color.set(colorHex);
      matRef.current.emissive.set(colorHex);
      matRef.current.emissiveIntensity = 1.2 + pulse * 1.4;
      matRef.current.opacity +=
        (targetOpacity - matRef.current.opacity) * lerp;
    }
    if (glowMatRef.current) {
      glowMatRef.current.color.set(colorHex);
      glowMatRef.current.emissive.set(colorHex);
      glowMatRef.current.emissiveIntensity = 2.0 + pulse * 2.5;
      glowMatRef.current.opacity +=
        (targetOpacity * 0.35 - glowMatRef.current.opacity) * lerp;
    }
    // Subtle scale breathe while saving to signal in-flight work.
    if (hexRef.current && saveState === 'saving') {
      const s = 1 + Math.sin(t * 4) * 0.05;
      hexRef.current.scale.set(s, 1, s);
    } else if (hexRef.current) {
      hexRef.current.scale.set(1, 1, 1);
    }
  });

  // Don't mount the <Text> check at all when the state wouldn't show
  // it — saves drei <Text> font-loading.
  const showCheck = saveState === 'saved';

  return (
    <group position={position}>
      {/* Outer glow ring */}
      <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.01, 6]} />
        <primitive
          ref={glowMatRef}
          object={glowMaterial}
          attach="material"
        />
      </mesh>

      {/* Hex prism */}
      <mesh
        ref={hexRef}
        geometry={geometry}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <primitive ref={matRef} object={material} attach="material" />
      </mesh>

      {/* Check glyph when saved */}
      {showCheck && (
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.045}
          color="#0A0E16"
          anchorX="center"
          anchorY="middle"
          font={NUMERIC_FONT}
          characters="✓"
          fontWeight={700}
        >
          ✓
          <meshBasicMaterial transparent opacity={0.95} />
        </Text>
      )}

      {/* Saving label below the hex (only while saving) */}
      {saveState === 'saving' && (
        <Text
          position={[0, -0.11, 0]}
          fontSize={TYPE_SCALE.caption.fontSize * 0.7}
          color={COLORS.saving}
          anchorX="center"
          anchorY="middle"
          font={TYPE_SCALE.caption.fontPath}
        >
          SAVING…
        </Text>
      )}
    </group>
  );
}
