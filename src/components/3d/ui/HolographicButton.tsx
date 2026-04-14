'use client';

// ════════════════════════════════════════════════════
// HolographicButton — 3D Interactive Cockpit Button
// ════════════════════════════════════════════════════
// Decision 2.1: Chamfered rectangle (45° corner cuts, fighter jet MFD soft key)
// Decision 2.2: Dual-layer — solid dark carbon base + floating translucent emissive
// Decision 2.3: Ring expansion ripple on click
// Decision 2.4: Three sizes (sm/md/lg)
// Decision 2.5: Inset text — engraved into surface, backlit by emissive
//
// Uses cockpitDesignTokens for all visual constants.
// Broadcasts to cockpitBroadcastStore on every interaction.

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshPhongMaterial,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
  Shape,
  ExtrudeGeometry,
} from 'three';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import {
  CHROME_BORDER,
  PRESS_DEPTH,
  EMISSIVE_IDLE_BUTTON,
  EMISSIVE_HOVER_MULTIPLIER,
  SPRING_PRESETS,
  HOVER_GLOW,
  STATE_MACHINE,
  TYPE_SCALE,
  DAMPENING,
  getEmissive,
  getEmissiveHover,
} from '@/lib/3d/cockpitDesignTokens';

// ■■ Size definitions ■■
const SIZE_MAP = {
  sm: { width: 0.08, height: 0.035 },
  md: { width: 0.12, height: 0.05 },
  lg: { width: 0.18, height: 0.06 },
} as const;

// ■■ Constants ■■
const BEZEL_PADDING = 0.01;
const BEZEL_DEPTH = 0.015;
const BASE_DEPTH = 0.012;
const EMISSIVE_LAYER_OFFSET = 0.003;
const EMISSIVE_LAYER_DEPTH = 0.002;
const BEZEL_CHAMFER = 0.008;
const BUTTON_CHAMFER = 0.006;
const RIPPLE_DURATION = 0.6;
const RIPPLE_MAX_RADIUS = 0.15;
const HOVER_EMISSIVE = EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER; // 1.44
const CARBON_BASE_COLOR = '#0A0F1F';

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
  /** Button size: sm (filter pills), md (standard CTAs), lg (primary CTAs) */
  size?: 'sm' | 'md' | 'lg';
  /** Whether this button is currently active/selected */
  active?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// ■■ Chamfered rectangle shape (45° corner cuts) ■■
function createChamferedRect(w: number, h: number, chamfer: number): Shape {
  const s = new Shape();
  const hw = w / 2, hh = h / 2, c = chamfer;
  s.moveTo(-hw + c, -hh);
  s.lineTo(hw - c, -hh);
  s.lineTo(hw, -hh + c);
  s.lineTo(hw, hh - c);
  s.lineTo(hw - c, hh);
  s.lineTo(-hw + c, hh);
  s.lineTo(-hw, hh - c);
  s.lineTo(-hw, -hh + c);
  s.closePath();
  return s;
}

// ■■ Memoized geometry factory ■■
function createChamferedGeometry(
  w: number,
  h: number,
  depth: number,
  chamfer: number,
): ExtrudeGeometry {
  const shape = createChamferedRect(w, h, chamfer);
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
}

export function HolographicButton({
  id,
  label,
  color = '#00ffcc',
  position = [0, 0, 0],
  scale = 1,
  size = 'md',
  active = false,
  disabled = false,
  onClick,
}: HolographicButtonProps) {
  const groupRef = useRef<Group>(null);
  const buttonGroupRef = useRef<Group>(null);
  const rippleRef = useRef<Mesh>(null);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  // Interaction state
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const rippleTimeRef = useRef(-1);

  // Spring physics state
  const depthRef = useRef(0);
  const velocityRef = useRef(0);
  const scaleRef = useRef(1);

  // Click dampening state
  const clickHistoryRef = useRef<number[]>([]);

  // Resolve dimensions from size
  const { width, height } = SIZE_MAP[size];

  // Colors
  const accentColor = useMemo(() => new Color(color), [color]);
  const bezelColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);
  const carbonColor = useMemo(() => new Color(CARBON_BASE_COLOR), []);

  // ■■ Geometries (memoized per size) ■■
  const bezelGeometry = useMemo(
    () => createChamferedGeometry(
      width + BEZEL_PADDING * 2,
      height + BEZEL_PADDING * 2,
      BEZEL_DEPTH,
      BEZEL_CHAMFER,
    ),
    [width, height],
  );

  const baseGeometry = useMemo(
    () => createChamferedGeometry(width, height, BASE_DEPTH, BUTTON_CHAMFER),
    [width, height],
  );

  const emissiveGeometry = useMemo(
    () => createChamferedGeometry(width, height, EMISSIVE_LAYER_DEPTH, BUTTON_CHAMFER),
    [width, height],
  );

  // ■■ Materials (memoized) ■■
  const bezelMaterial = useMemo(() => new MeshStandardMaterial({
    color: bezelColor,
    metalness: 0.98,
    roughness: 0.12,
    emissive: new Color('#223344'),
    emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [bezelColor]);

  const baseMaterial = useMemo(() => new MeshStandardMaterial({
    color: carbonColor,
    metalness: 0.85,
    roughness: 0.35,
  }), [carbonColor]);

  const emissiveMaterial = useMemo(() => new MeshPhongMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: EMISSIVE_IDLE_BUTTON,
    transparent: true,
    opacity: 0.4,
    shininess: 120,
  }), [accentColor]);

  const rippleMaterial = useMemo(() => new MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0,
    side: DoubleSide,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), [accentColor]);

  // ■■ Click dampening ■■
  const getDampenedIntensity = useCallback((): number => {
    const now = performance.now();
    // Prune clicks outside window
    clickHistoryRef.current = clickHistoryRef.current.filter(
      (t) => now - t < DAMPENING.windowMs,
    );
    const count = clickHistoryRef.current.length;
    clickHistoryRef.current.push(now);

    if (count === 0) return DAMPENING.firstClick;
    if (count === 1) return DAMPENING.secondClick;
    return DAMPENING.thirdPlus;
  }, []);

  // ■■ Click handler ■■
  const handleClick = useCallback(() => {
    if (disabled) return;

    // COCK-11: Haptic feedback for tablet devices (no-op if unsupported)
    navigator.vibrate?.([20]);

    const intensity = getDampenedIntensity();

    setPressed(true);
    rippleTimeRef.current = 0;

    // Spring push with snap preset
    const _snap = SPRING_PRESETS.snap;
    velocityRef.current = -2.0 * intensity;

    broadcast({
      type: 'button-press',
      source: id,
      color,
      label,
    });

    onClick?.();

    setTimeout(() => setPressed(false), 200);
  }, [id, color, label, broadcast, onClick, disabled, getDampenedIntensity]);

  // ■■ Hover handlers ■■
  const handlePointerOver = useCallback(() => {
    if (disabled) return;
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, [disabled]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  // ■■ Resolve current spring preset ■■
  const activeSpring = pressed
    ? SPRING_PRESETS.snap
    : hovered
      ? SPRING_PRESETS.bounce
      : SPRING_PRESETS.smooth;

  // ■■ Per-frame animation ■■
  useFrame((_, delta) => {
    if (!groupRef.current || !buttonGroupRef.current) return;

    // Disabled state — dim and no animation
    if (disabled) {
      const disabledVisuals = STATE_MACHINE.disabled;
      emissiveMaterial.emissiveIntensity = getEmissive('off');
      emissiveMaterial.opacity = disabledVisuals.opacity ?? 0.4;
      groupRef.current.scale.setScalar(scale);
      return;
    }

    // Spring physics for depress
    const targetDepth = (pressed || active) ? PRESS_DEPTH : 0;
    const springForce = activeSpring.stiffness * (targetDepth - depthRef.current);
    const dampingForce = -activeSpring.damping * velocityRef.current;
    const accel = (springForce + dampingForce) / activeSpring.mass;
    velocityRef.current += accel * delta;
    depthRef.current += velocityRef.current * delta;
    buttonGroupRef.current.position.z = -depthRef.current;

    // Hover scale (bounce spring for hover)
    const targetScale = hovered ? STATE_MACHINE.hover.scale : STATE_MACHINE.idle.scale;
    scaleRef.current += (targetScale - scaleRef.current) * delta * 10;
    groupRef.current.scale.setScalar(scale * scaleRef.current);

    // Emissive pulse on the translucent layer
    const baseEmissive = active
      ? getEmissiveHover('bright')
      : hovered
        ? HOVER_EMISSIVE
        : EMISSIVE_IDLE_BUTTON;

    // Subtle pulse per HOVER_GLOW token
    const t = performance.now() / 1000;
    const pulseRange = HOVER_GLOW.pulseMax - HOVER_GLOW.pulseMin;
    const pulse = HOVER_GLOW.pulseMin + (Math.sin(t * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS)) * 0.5 + 0.5) * pulseRange;
    emissiveMaterial.emissiveIntensity = baseEmissive * (active || hovered ? pulse : 1.0);
    emissiveMaterial.opacity = active ? 0.55 : hovered ? 0.5 : 0.4;

    // Ripple animation
    if (rippleTimeRef.current >= 0 && rippleRef.current) {
      rippleTimeRef.current += delta;
      const rt = rippleTimeRef.current / RIPPLE_DURATION;

      if (rt >= 1) {
        rippleTimeRef.current = -1;
        rippleMaterial.opacity = 0;
        rippleRef.current.scale.set(0.01, 0.01, 1);
      } else {
        const rippleScale = rt * RIPPLE_MAX_RADIUS * 2;
        rippleRef.current.scale.set(rippleScale, rippleScale, 1);
        rippleMaterial.opacity = (1 - rt) * 0.8;
      }
    }
  });

  // Label font from design tokens
  const labelType = TYPE_SCALE.label;

  return (
    <group ref={groupRef} position={position}>
      {/* Chrome bezel frame — chamfered rectangle */}
      <mesh geometry={bezelGeometry} material={bezelMaterial} position={[0, 0, -BEZEL_DEPTH / 2]} />

      {/* Interactive button group (depresses on press) */}
      <group ref={buttonGroupRef}>
        {/* Bottom layer: dark carbon base */}
        <mesh
          geometry={baseGeometry}
          material={baseMaterial}
          position={[0, 0, -BASE_DEPTH / 2]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />

        {/* Top layer: floating translucent emissive (0.003 above base) */}
        <mesh
          geometry={emissiveGeometry}
          material={emissiveMaterial}
          position={[0, 0, EMISSIVE_LAYER_OFFSET - EMISSIVE_LAYER_DEPTH / 2]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />

        {/* Ripple effect (ring expansion on click) */}
        <mesh ref={rippleRef} position={[0, 0, EMISSIVE_LAYER_OFFSET + 0.002]} scale={[0.01, 0.01, 1]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <primitive object={rippleMaterial} />
        </mesh>

        {/* Inset label text — engraved into surface (z = -0.001 relative to surface) */}
        <Text
          position={[0, 0, -0.001]}
          fontSize={labelType.fontSize}
          color={disabled ? '#555566' : active ? '#ffffff' : color}
          anchorX="center"
          anchorY="middle"
          font={labelType.fontPath}
          outlineWidth={0.0008}
          outlineColor="#000000"
          maxWidth={width * 0.85}
        >
          {label}
        </Text>
      </group>

      {/* Phase 1 audit fix (Section 8.3): Hidden HTML proxy for keyboard accessibility.
          Invisible button captures Tab focus + Enter/Space activation.
          Uses the existing P3-2 hidden HTML input proxy pattern from auth panels. */}
      <Html
        center
        position={[0, 0, 0.01]}
        style={{ pointerEvents: 'none', opacity: 0, width: 0, height: 0, overflow: 'visible' }}
      >
        <button
          aria-label={label}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onFocus={() => { if (!disabled) setHovered(true); }}
          onBlur={() => setHovered(false)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              handleClick();
            }
          }}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        />
      </Html>
    </group>
  );
}

export default HolographicButton;
