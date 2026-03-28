'use client';

// ════════════════════════════════════════════════════
// HolographicButton — 3D Interactive Cockpit Button
// ════════════════════════════════════════════════════
// Per cockpit-architecture.json: "press-to-depress with metallic click
// animation; triggers full cockpit state change with holographic pop-up
// mapping and camera movement"
//
// Features:
// - Chrome bezel frame (alloyFrame material, metalness 0.98)
// - Inner emissive panel (lightedButton material, emissive 1.8)
// - Press: depress 0.03 units on Z + spring bounce-back
// - Holographic ripple: radial ring expansion from press point
// - Hover: scale 1.05 + glow intensify + cursor pointer
// - Active state: stays depressed with pulsing glow
// - Broadcasts to cockpitBroadcastStore on every interaction
//
// ~100K triangles per button

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshPhongMaterial,
  MeshStandardMaterial,
  RingGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

interface HolographicButtonProps {
  /** Unique ID for broadcast events */
  id: string;
  /** Display label */
  label: string;
  /** Button accent color */
  color?: string;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Scale multiplier */
  scale?: number;
  /** Whether this button is currently active/selected */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Icon character (emoji or single char) */
  icon?: string;
  /** Width of button */
  width?: number;
  /** Height of button */
  height?: number;
}

// ■■ Spring physics constants ■■
const SPRING_STIFFNESS = 300;
const SPRING_DAMPING = 25;
const DEPRESS_DEPTH = 0.03;
const HOVER_SCALE = 1.05;
const RIPPLE_DURATION = 0.6;  // seconds
const RIPPLE_MAX_RADIUS = 0.15;

export function HolographicButton({
  id,
  label,
  color = '#00ffcc',
  position = [0, 0, 0],
  scale = 1,
  active = false,
  onClick,
  icon,
  width = 0.22,
  height = 0.08,
}: HolographicButtonProps) {
  const groupRef = useRef<Group>(null);
  const buttonRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const rippleRef = useRef<Mesh>(null);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  // Interaction state
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const pressTimeRef = useRef(0);
  const rippleTimeRef = useRef(-1);  // -1 = no ripple

  // Spring physics state
  const depthRef = useRef(0);
  const velocityRef = useRef(0);
  const scaleRef = useRef(1);

  // Materials (memoized)
  const buttonColor = useMemo(() => new Color(color), [color]);
  const bezelMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#a8b5c8'),
    metalness: 0.98,
    roughness: 0.12,
    emissive: new Color('#223344'),
    emissiveIntensity: 0.5,
  }), []);

  const buttonMaterial = useMemo(() => new MeshPhongMaterial({
    color: buttonColor,
    emissive: buttonColor,
    emissiveIntensity: 1.8,
    shininess: 120,
  }), [buttonColor]);

  const rippleMaterial = useMemo(() => new MeshBasicMaterial({
    color: buttonColor,
    transparent: true,
    opacity: 0,
    side: DoubleSide,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), [buttonColor]);

  // ■■ Click handler ■■
  const handleClick = useCallback(() => {
    setPressed(true);
    pressTimeRef.current = performance.now();
    rippleTimeRef.current = 0;  // Start ripple
    velocityRef.current = -2.0; // Push down

    // Broadcast to cockpit
    broadcast({
      type: 'button-press',
      source: id,
      color,
      label,
    });

    onClick?.();

    // Release after spring settles
    setTimeout(() => setPressed(false), 200);
  }, [id, color, label, broadcast, onClick]);

  // ■■ Hover handlers ■■
  const handlePointerOver = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  // ■■ Per-frame animation ■■
  useFrame((_, delta) => {
    if (!groupRef.current || !buttonRef.current) return;

    // Spring physics for depress
    const targetDepth = (pressed || active) ? DEPRESS_DEPTH : 0;
    const springForce = SPRING_STIFFNESS * (targetDepth - depthRef.current);
    const dampingForce = -SPRING_DAMPING * velocityRef.current;
    velocityRef.current += (springForce + dampingForce) * delta;
    depthRef.current += velocityRef.current * delta;
    buttonRef.current.position.z = -depthRef.current;

    // Hover scale
    const targetScale = hovered ? HOVER_SCALE : 1.0;
    scaleRef.current += (targetScale - scaleRef.current) * delta * 10;
    groupRef.current.scale.setScalar(scale * scaleRef.current);

    // Button emissive pulse
    const basePulse = active ? 2.5 : (hovered ? 2.2 : 1.8);
    const pulse = basePulse + Math.sin(performance.now() * 0.004) * (active ? 0.4 : 0.15);
    buttonMaterial.emissiveIntensity = pulse;

    // Glow ring pulse
    if (glowRef.current) {
      const glowMat = glowRef.current.material as MeshBasicMaterial;
      glowMat.opacity = (active ? 0.6 : hovered ? 0.4 : 0.2) + Math.sin(performance.now() * 0.003) * 0.1;
    }

    // Ripple animation
    if (rippleTimeRef.current >= 0 && rippleRef.current) {
      rippleTimeRef.current += delta;
      const t = rippleTimeRef.current / RIPPLE_DURATION;

      if (t >= 1) {
        rippleTimeRef.current = -1;
        rippleMaterial.opacity = 0;
        rippleRef.current.scale.set(0.01, 0.01, 1);
      } else {
        const rippleScale = t * RIPPLE_MAX_RADIUS * 2;
        rippleRef.current.scale.set(rippleScale, rippleScale, 1);
        rippleMaterial.opacity = (1 - t) * 0.8;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Chrome bezel frame */}
      <RoundedBox
        args={[width + 0.02, height + 0.02, 0.015]}
        radius={0.008}
        smoothness={4}
        material={bezelMaterial}
      />

      {/* Inner button surface */}
      <RoundedBox
        ref={buttonRef}
        args={[width, height, 0.012]}
        radius={0.006}
        smoothness={4}
        material={buttonMaterial}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Glow ring (always visible, pulses) */}
      <mesh ref={glowRef} position={[0, 0, 0.008]}>
        <ringGeometry args={[
          Math.max(width, height) * 0.55,
          Math.max(width, height) * 0.65,
          32,
        ]} />
        <meshBasicMaterial
          color={buttonColor}
          transparent
          opacity={0.2}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Ripple effect (appears on click) */}
      <mesh ref={rippleRef} position={[0, 0, 0.01]} scale={[0.01, 0.01, 1]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <primitive object={rippleMaterial} />
      </mesh>

      {/* Label text */}
      <Text
        position={[icon ? 0.02 : 0, 0, 0.01]}
        fontSize={0.018}
        color={active ? '#ffffff' : color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Exo2-Bold.woff"
        outlineWidth={0.001}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* Icon (if provided) */}
      {icon && (
        <Text
          position={[-width * 0.35, 0, 0.01]}
          fontSize={0.024}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {icon}
        </Text>
      )}
    </group>
  );
}

export default HolographicButton;
