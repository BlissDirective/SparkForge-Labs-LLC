'use client';

// ════════════════════════════════════════════════════
// HolographicCard — Floating 3D Data Card
// ════════════════════════════════════════════════════
// Displays game info, stats, lab data as a holographic floating card
// embedded in the cockpit 3D scene. Uses drei <Html transform> for
// readable text content while the card frame is pure Three.js geometry.
//
// Features:
// - Chrome bezel border (4 edge segments, alloy material)
// - Inner surface: holographic shimmer (AdditiveBlending)
// - Lab-color border glow: dynamic emissive from --lab-color
// - Content: drei <Html transform occlude> for text/badges
// - Hover: lift 0.05 units + scale 1.03 + border glow 2x
// - Click: callback with ripple feedback
//
// ~50K triangles per card

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';

interface HolographicCardProps {
  /** Position in 3D space */
  position?: [number, number, number];
  /** Rotation */
  rotation?: [number, number, number];
  /** Card dimensions */
  width?: number;
  height?: number;
  /** Accent color for border glow */
  color?: string;
  /** Whether card is in selected/active state */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Scale */
  scale?: number;
  /** React children rendered as HTML inside the card */
  children?: React.ReactNode;
  /** Optional title text rendered in 3D */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Completion badge (0-1 or null) */
  completion?: number | null;
}

const HOVER_LIFT = 0.03;
const HOVER_SCALE = 1.03;
const BORDER_WIDTH = 0.004;

export function HolographicCard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.28,
  height = 0.18,
  color = '#00BBFF',
  active = false,
  onClick,
  scale = 1,
  children,
  title,
  subtitle,
  completion,
}: HolographicCardProps) {
  const groupRef = useRef<Group>(null);
  const borderRef = useRef<Mesh>(null);
  const surfaceRef = useRef<Mesh>(null);

  const [hovered, setHovered] = useState(false);
  const liftRef = useRef(0);
  const scaleRef = useRef(1);

  const accentColor = useMemo(() => new Color(color), [color]);

  // Materials
  const borderMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#a8b5c8'),
    metalness: 0.98,
    roughness: 0.12,
    emissive: accentColor,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.95,
  }), [accentColor]);

  const surfaceMaterial = useMemo(() => new MeshBasicMaterial({
    color: new Color('#0a1625'),
    transparent: true,
    opacity: 0.85,
    side: DoubleSide,
  }), []);

  const glowMaterial = useMemo(() => new MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.15,
    blending: AdditiveBlending,
    side: DoubleSide,
    depthWrite: false,
    toneMapped: false,
  }), [accentColor]);

  const handleClick = useCallback(() => onClick?.(), [onClick]);

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Hover lift
    const targetLift = hovered ? HOVER_LIFT : 0;
    liftRef.current += (targetLift - liftRef.current) * delta * 10;

    // Hover scale
    const targetScale = hovered ? HOVER_SCALE : 1.0;
    scaleRef.current += (targetScale - scaleRef.current) * delta * 10;
    groupRef.current.scale.setScalar(scale * scaleRef.current);

    // Border glow pulse
    if (borderRef.current) {
      const baseGlow = active ? 1.2 : (hovered ? 0.9 : 0.6);
      const pulse = baseGlow + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      borderMaterial.emissiveIntensity = pulse;
    }

    // Surface shimmer
    if (surfaceRef.current) {
      const shimmer = 0.85 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      surfaceMaterial.opacity = shimmer;
    }

    // Glow intensity
    glowMaterial.opacity = (hovered ? 0.3 : 0.15) + Math.sin(state.clock.elapsedTime * 3) * 0.05;

    // Apply hover lift to local position
    groupRef.current.position.y = position[1] + liftRef.current;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Chrome bezel border */}
      <RoundedBox
        ref={borderRef}
        args={[width + BORDER_WIDTH * 2, height + BORDER_WIDTH * 2, 0.006]}
        radius={0.008}
        smoothness={4}
        material={borderMaterial}
      />

      {/* Dark inner surface */}
      <mesh ref={surfaceRef} position={[0, 0, 0.001]}>
        <planeGeometry args={[width, height]} />
        <primitive object={surfaceMaterial} />
      </mesh>

      {/* Holographic glow plane (behind card) */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[width + 0.02, height + 0.02]} />
        <primitive object={glowMaterial} />
      </mesh>

      {/* Completion indicator bar (if provided) */}
      {completion !== null && completion !== undefined && (
        <mesh position={[-(width / 2) + (width * completion) / 2, -(height / 2) - 0.006, 0.002]}>
          <planeGeometry args={[width * completion, 0.004]} />
          <meshBasicMaterial color={accentColor} toneMapped={false} />
        </mesh>
      )}

      {/* HTML content layer — rendered at 3D position */}
      {children && (
        <Html
          transform
          occlude
          position={[0, 0, 0.004]}
          style={{
            width: `${width * 400}px`,
            height: `${height * 400}px`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px',
            color: '#ffffff',
            fontFamily: 'Sora, sans-serif',
            fontSize: '10px',
            textAlign: 'center',
            textShadow: `0 0 8px ${color}40`,
          }}>
            {title && (
              <div style={{
                fontFamily: 'Exo 2, sans-serif',
                fontWeight: 700,
                fontSize: '11px',
                color: color,
                marginBottom: '4px',
              }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ opacity: 0.6, fontSize: '9px' }}>
                {subtitle}
              </div>
            )}
            {children}
          </div>
        </Html>
      )}
    </group>
  );
}

export default HolographicCard;
