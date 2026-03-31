'use client';

// ════════════════════════════════════════════════════
// CockpitTooltip — 3D Holographic Tooltip
// ════════════════════════════════════════════════════
// Materializes on hover after 300ms delay. Chrome bezel border,
// carbon composite background. Spring scale-in/fade-out animation.
// Auto-positions relative to hovered element.
//
// Per SparkForge-Full-ControlScreen.json §interaction_model.tooltips
//
// Usage: Render as a sibling inside a <group> next to the hovered mesh.
// Controlled via `visible` prop + parent's onPointerEnter/Leave.

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Group, MeshStandardMaterial, MeshBasicMaterial, Color, DoubleSide } from 'three';
import { MathUtils } from 'three';

// ── Design tokens ──────────────────────────────────
const CARBON_BG = new Color('#0A0F1F');
const CHROME_BEZEL_COLOR = new Color('#a8b5c8');
const TEXT_COLOR = '#F0F0F4';
const ACCENT_HEIGHT = 0.004;

// ── Types ──────────────────────────────────────────

export interface CockpitTooltipProps {
  /** Tooltip text content */
  label: string;
  /** Whether the tooltip should be visible */
  visible: boolean;
  /** Accent color (LED line at top) */
  color?: string;
  /** Position offset from parent element */
  position?: [number, number, number];
  /** Max width in 3D units (default 0.4) */
  maxWidth?: number;
  /** Delay before showing (ms, default 300) */
  delay?: number;
}

// ── Component ──────────────────────────────────────

export function CockpitTooltip({
  label,
  visible,
  color = '#00BBFF',
  position = [0, 0.12, 0.15],
  maxWidth = 0.4,
  delay = 300,
}: CockpitTooltipProps) {
  const groupRef = useRef<Group>(null);
  const [showDelayed, setShowDelayed] = useState(false);
  const scaleRef = useRef(0);
  const opacityRef = useRef(0);

  // Delayed show (300ms default per spec)
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShowDelayed(true), delay);
      return () => clearTimeout(timer);
    }
    setShowDelayed(false);
  }, [visible, delay]);

  // Spring animation per frame
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const target = showDelayed ? 1 : 0;
    // Spring physics: stiffness ~400, damping ~25
    const speed = 8 * delta;
    scaleRef.current = MathUtils.lerp(scaleRef.current, target, Math.min(speed, 1));
    opacityRef.current = MathUtils.lerp(opacityRef.current, target, Math.min(speed * 1.5, 1));

    const s = 0.8 + 0.2 * scaleRef.current; // scale 0.8 → 1.0
    groupRef.current.scale.set(s, s, s);
    groupRef.current.visible = scaleRef.current > 0.01;

    // Update material opacities
    groupRef.current.traverse((child) => {
      if ('material' in child && child.material instanceof MeshStandardMaterial) {
        child.material.opacity = opacityRef.current * 0.95;
      }
      if ('material' in child && child.material instanceof MeshBasicMaterial) {
        child.material.opacity = opacityRef.current;
      }
    });
  });

  // Estimate panel dimensions from text
  const panelWidth = Math.min(label.length * 0.012 + 0.04, maxWidth);
  const panelHeight = 0.05;

  return (
    <group ref={groupRef} position={position} visible={false}>
      {/* Background panel — carbon composite */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[panelWidth, panelHeight]} />
        <meshStandardMaterial
          color={CARBON_BG}
          metalness={0.3}
          roughness={0.8}
          transparent
          opacity={0.95}
          side={DoubleSide}
        />
      </mesh>

      {/* Chrome bezel border */}
      <mesh position={[0, 0, -0.0005]}>
        <planeGeometry args={[panelWidth + 0.004, panelHeight + 0.004]} />
        <meshStandardMaterial
          color={CHROME_BEZEL_COLOR}
          metalness={0.98}
          roughness={0.12}
          transparent
          opacity={0.3}
          side={DoubleSide}
        />
      </mesh>

      {/* Accent LED line at top */}
      <mesh position={[0, panelHeight / 2 - ACCENT_HEIGHT / 2, 0.001]}>
        <planeGeometry args={[panelWidth - 0.01, ACCENT_HEIGHT]} />
        <meshBasicMaterial
          color={new Color(color)}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </mesh>

      {/* Text label */}
      <Text
        position={[0, -0.002, 0.002]}
        fontSize={0.02}
        color={TEXT_COLOR}
        anchorX="center"
        anchorY="middle"
        maxWidth={maxWidth - 0.02}
        font="/fonts/Sora-Regular.woff2"
      >
        {label}
      </Text>
    </group>
  );
}
