'use client';

// ════════════════════════════════════════════════════════════════
// ChoiceButton3D — Reusable 3D Answer/Option Button (Phase 6)
// ════════════════════════════════════════════════════════════════
// A cockpit-style choice button used by quiz/selection game templates.
// Shows label text, optional icon indicator, and feedback states
// (correct/incorrect/selected). Used by QuizGameTemplate and others.
//
// Design tokens: chamfered shape, chrome bezel, spring press animation.

import { useState, useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  Group,
  MeshStandardMaterial,
} from 'three';
import {
  CHROME_BORDER,
  TYPE_SCALE,
  TEXT_COLORS,
  EMISSIVE_IDLE_BUTTON,
  EMISSIVE_HOVER_MULTIPLIER,
  EMISSIVE_SCALE,
  SPRING_PRESETS,
  PRESS_DEPTH,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ChoiceFeedback = 'none' | 'correct' | 'incorrect' | 'selected';

export interface ChoiceButton3DProps {
  /** Display label */
  label: string;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Button width */
  width?: number;
  /** Button height */
  height?: number;
  /** Accent color (default: lab color) */
  color?: string;
  /** Feedback state */
  feedback?: ChoiceFeedback;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Optional subtitle text (shown smaller below label) */
  subtitle?: string;
}

// ═══════════════════════════════════════════════════════════════
// FEEDBACK COLORS
// ═══════════════════════════════════════════════════════════════

const FEEDBACK_COLORS: Record<ChoiceFeedback, string> = {
  none: '#a8b5c8',
  correct: '#00FF88',
  incorrect: '#FF6644',
  selected: '#00BBFF',
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ChoiceButton3D({
  label,
  position = [0, 0, 0],
  width = 0.5,
  height = 0.08,
  color = '#00BBFF',
  feedback = 'none',
  disabled = false,
  onClick,
  subtitle,
}: ChoiceButton3DProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const depthRef = useRef(0);
  const velRef = useRef(0);

  const feedbackColor = feedback !== 'none' ? FEEDBACK_COLORS[feedback] : color;
  const accentC = useMemo(() => new Color(feedbackColor), [feedbackColor]);
  const chromeC = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const baseMat = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0A0F1F'),
    emissive: accentC,
    emissiveIntensity: feedback === 'correct' ? EMISSIVE_SCALE.bright
      : feedback === 'incorrect' ? EMISSIVE_SCALE.medium
      : EMISSIVE_IDLE_BUTTON * 0.3,
    metalness: 0.85,
    roughness: 0.35,
  }), [accentC, feedback]);

  const borderMat = useMemo(() => new MeshStandardMaterial({
    color: chromeC,
    metalness: 0.95,
    roughness: 0.1,
    emissive: accentC,
    emissiveIntensity: feedback !== 'none' ? 0.4 : CHROME_BORDER.glowIntensity,
  }), [chromeC, accentC, feedback]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = pressed ? PRESS_DEPTH * 0.5 : 0;
    const spring = SPRING_PRESETS.snap;
    velRef.current += ((spring.stiffness * (target - depthRef.current) - spring.damping * velRef.current) / spring.mass) * delta;
    depthRef.current += velRef.current * delta;
    groupRef.current.position.z = position[2] - depthRef.current;

    baseMat.emissiveIntensity = disabled ? 0.02
      : feedback === 'correct' ? EMISSIVE_SCALE.bright
      : feedback === 'incorrect' ? EMISSIVE_SCALE.medium
      : hovered ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER * 0.4
      : EMISSIVE_IDLE_BUTTON * 0.3;
  });

  const handleClick = useCallback(() => {
    if (disabled || feedback !== 'none') return;
    setPressed(true);
    onClick?.();
    setTimeout(() => setPressed(false), 200);
  }, [disabled, feedback, onClick]);

  // Feedback indicator character
  const indicator = feedback === 'correct' ? '✓' : feedback === 'incorrect' ? '✗' : '';

  return (
    <group ref={groupRef} position={position}>
      {/* Chrome border */}
      <mesh>
        <boxGeometry args={[width + 0.006, height + 0.006, 0.006]} />
        <primitive object={borderMat} />
      </mesh>
      {/* Background */}
      <mesh
        position={[0, 0, 0.001]}
        onClick={handleClick}
        onPointerOver={() => { if (!disabled && feedback === 'none') { setHovered(true); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[width, height, 0.005]} />
        <primitive object={baseMat} />
      </mesh>

      {/* Feedback indicator (left side) */}
      {indicator && (
        <Text
          position={[-width / 2 + 0.025, 0, 0.005]}
          fontSize={0.03}
          color={feedbackColor}
          anchorX="center"
          anchorY="middle"
          font={TYPE_SCALE.body.fontPath}
        >
          {indicator}
        </Text>
      )}

      {/* Label */}
      <Text
        position={[indicator ? 0.01 : 0, subtitle ? 0.01 : 0, 0.005]}
        fontSize={TYPE_SCALE.label.fontSize}
        color={disabled ? TEXT_COLORS.dim.hex : feedback !== 'none' ? feedbackColor : TEXT_COLORS.primary.hex}
        anchorX="center"
        anchorY="middle"
        font={TYPE_SCALE.label.fontPath}
        maxWidth={width - 0.06}
      >
        {label}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text
          position={[0, -0.02, 0.005]}
          fontSize={TYPE_SCALE.caption.fontSize * 0.8}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          anchorY="middle"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
          maxWidth={width - 0.04}
        >
          {subtitle}
        </Text>
      )}
    </group>
  );
}

export default ChoiceButton3D;
