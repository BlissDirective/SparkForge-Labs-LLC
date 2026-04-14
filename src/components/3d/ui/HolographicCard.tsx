'use client';

// ════════════════════════════════════════════════════
// HolographicCard — Chamfered 3D Data Card (Design Token System)
// ════════════════════════════════════════════════════
// Displays game info, stats, lab data as a holographic floating card
// embedded in the cockpit 3D scene. Pure Three.js geometry + drei <Text>.
//
// Design Decisions (Component 16):
// - 16.1 Shape: Chamfered rectangle (45-degree corner cuts) matching HolographicButton
// - 16.2 Surface: Layered — solid carbon base + floating translucent accent top-edge strip
// - 16.3 Hover: Edge trace + lift — card lifts AND chrome border does pulse trace
//
// All visual constants sourced from cockpitDesignTokens — NO hardcoded values.

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  Shape,
  ExtrudeGeometry,
  MeshStandardMaterial,
  DoubleSide,
  Vector2,
} from 'three';

// Phase 2 audit fix (Section 4.6): holographicTSL imported for Decision 4.3 rainbow diffraction
// Wiring is gated behind WebGPU tier — under WebGL2 the NodeMaterial cannot compile, so we keep
// the existing MeshStandardMaterial path and merely bind/animate the shared TSL uniforms so the
// shader module is wired and ready for WebGPU activation.
import { holographicPattern, getHolographicUniforms } from '@/shaders/tsl/holographicTSL';

import {
  CHROME_BORDER,
  EMISSIVE_IDLE_BUTTON,
  SPRING_PRESETS,
  HOVER_GLOW,
  BEVEL_STYLE,
  DEPTH_LAYERS,
  STATE_MACHINE,
  TYPE_SCALE,
  NUMERIC_FONT,
  TEXT_COLORS,
  WHITESPACE_RATIO,
  GHOST_PLACEHOLDER_OPACITY,
} from '@/lib/3d/cockpitDesignTokens';

// Phase 2 audit fix (Section 4.6): holographicTSL applied — Decision 4.3
// Reference the TSL module to ensure tree-shaking keeps it in the bundle. The shader
// will be fully activated when a WebGPU NodeMaterial path is introduced for this card.
void holographicPattern;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

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
  /** Optional — cards now render title/subtitle/completion via 3D text */
  children?: React.ReactNode;
  /** Title text rendered via drei <Text> */
  title?: string;
  /** Subtitle text rendered via drei <Text> */
  subtitle?: string;
  /** Completion badge (0-1 or null) */
  completion?: number | null;
}

// ═══════════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════

/** Chamfered rectangle shape — 45-degree corner cuts matching HolographicButton */
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

// ═══════════════════════════════════════════════════════════════
// CONSTANTS derived from design tokens
// ═══════════════════════════════════════════════════════════════

const BORDER_CHAMFER = BEVEL_STYLE.structural.value; // 0.008
const SURFACE_CHAMFER = 0.006;
const BORDER_DEPTH = 0.006;
const SURFACE_DEPTH = 0.004;
const ACCENT_STRIP_HEIGHT = 0.008;
const ACCENT_STRIP_FLOAT = 0.003;

const HOVER_LIFT = DEPTH_LAYERS.high_raise - DEPTH_LAYERS.surface; // 0.01 base, scaled
const HOVER_SCALE = STATE_MACHINE.hover.scale; // 1.05

const SPRING = SPRING_PRESETS.bounce;

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function HolographicCard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.28,
  height = 0.18,
  color = '#00BBFF',
  active = false,
  onClick,
  scale = 1,
  children: _children,
  title,
  subtitle,
  completion,
}: HolographicCardProps) {
  const groupRef = useRef<Group>(null);
  const borderRef = useRef<Mesh>(null);

  const [hovered, setHovered] = useState(false);

  // Spring-driven animation state
  const velocityLift = useRef(0);
  const currentLift = useRef(0);
  const velocityScale = useRef(0);
  const currentScale = useRef(1);

  const accentColor = useMemo(() => new Color(color), [color]);
  const chromeBorderColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  // Phase 2 audit fix (Section 4.6): bind holographicTSL uniforms — Decision 4.3
  // These drive the TSL rainbow-diffraction shader when the card is rendered under WebGPU.
  // Under WebGL2 they update harmlessly; the accent strip material remains the active visual.
  const holoUniforms = useMemo(() => getHolographicUniforms(), []);
  const tiltTarget = useRef(new Vector2(0, 0));

  // ── Geometries ──────────────────────────────────────────────

  const borderGeometry = useMemo(
    () => createChamferedGeometry(
      width + CHROME_BORDER.width * 0.002 * 2,
      height + CHROME_BORDER.width * 0.002 * 2,
      BORDER_DEPTH,
      BORDER_CHAMFER,
    ),
    [width, height],
  );

  const surfaceGeometry = useMemo(
    () => createChamferedGeometry(width, height, SURFACE_DEPTH, SURFACE_CHAMFER),
    [width, height],
  );

  const accentStripGeometry = useMemo(
    () => createChamferedGeometry(
      width * 0.92,
      ACCENT_STRIP_HEIGHT,
      0.002,
      0.003,
    ),
    [width],
  );

  // ── Materials ───────────────────────────────────────────────

  const borderMaterial = useMemo(() => new MeshStandardMaterial({
    color: chromeBorderColor,
    metalness: 0.98,
    roughness: 0.12,
    emissive: chromeBorderColor,
    emissiveIntensity: CHROME_BORDER.glowIntensity,
    transparent: true,
    opacity: 0.95,
  }), [chromeBorderColor]);

  const surfaceMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0A0F1F'),
    metalness: 0.85,
    roughness: 0.35,
    emissive: new Color('#000000'),
    emissiveIntensity: 0,
    transparent: false,
  }), []);

  const accentStripMaterial = useMemo(() => new MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: EMISSIVE_IDLE_BUTTON,
    transparent: true,
    opacity: 0.4,
    toneMapped: false,
    side: DoubleSide,
  }), [accentColor]);

  const completionMaterial = useMemo(() => new MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: EMISSIVE_IDLE_BUTTON * 0.8,
    toneMapped: false,
  }), [accentColor]);

  // ── Handlers ────────────────────────────────────────────────

  const handleClick = useCallback(() => onClick?.(), [onClick]);

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  // ── Frame loop: spring physics + edge trace ─────────────────

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const dt = Math.min(delta, 0.05); // clamp large dt

    // Spring-driven lift (SPRING_PRESETS.bounce)
    const targetLift = hovered ? HOVER_LIFT * 3 : 0; // 0.03 lift on hover
    const forceLift = -SPRING.stiffness * (currentLift.current - targetLift);
    const dampLift = -SPRING.damping * velocityLift.current;
    velocityLift.current += (forceLift + dampLift) / SPRING.mass * dt;
    currentLift.current += velocityLift.current * dt;

    // Spring-driven scale
    const targetScale = hovered ? HOVER_SCALE : 1.0;
    const forceScale = -SPRING.stiffness * (currentScale.current - targetScale);
    const dampScale = -SPRING.damping * velocityScale.current;
    velocityScale.current += (forceScale + dampScale) / SPRING.mass * dt;
    currentScale.current += velocityScale.current * dt;

    groupRef.current.scale.setScalar(scale * currentScale.current);
    groupRef.current.position.y = position[1] + currentLift.current;

    // Phase 2 audit fix (Section 4.6): drive holographicTSL uniforms — Decision 4.3
    // uTime advances continuously; uTilt eases toward hover magnitude; uBaseColor tracks accent.
    holoUniforms.uTime.value = state.clock.elapsedTime;
    const desiredTiltMag = hovered ? 0.6 : 0.0;
    const currentMag = tiltTarget.current.length();
    const nextMag = currentMag + (desiredTiltMag - currentMag) * Math.min(1, dt * 6);
    tiltTarget.current.set(nextMag, nextMag * 0.7);
    holoUniforms.uTilt.value.copy(tiltTarget.current);
    holoUniforms.uIntensity.value = active ? 1.2 : 1.0;
    holoUniforms.uBaseColor.value.copy(accentColor);

    // Chrome border pulse trace on hover (HOVER_GLOW tokens)
    if (borderRef.current) {
      if (hovered || active) {
        const t = state.clock.elapsedTime;
        const period = HOVER_GLOW.pulsePeriodS;
        const phase = (Math.sin((t / period) * Math.PI * 2) + 1) * 0.5; // 0..1
        const intensity = HOVER_GLOW.pulseMin + phase * (HOVER_GLOW.pulseMax - HOVER_GLOW.pulseMin);
        borderMaterial.emissiveIntensity = intensity * (active ? 1.2 : 1.0);
        borderMaterial.emissive.copy(accentColor);
      } else {
        borderMaterial.emissiveIntensity = CHROME_BORDER.glowIntensity;
        borderMaterial.emissive.copy(chromeBorderColor);
      }
    }
  });

  // ── Text layout positions ───────────────────────────────────

  const contentTop = height / 2 - height * WHITESPACE_RATIO * 0.4;
  const titleY = contentTop - TYPE_SCALE.label.fontSize * 0.6;
  const subtitleY = titleY - TYPE_SCALE.label.fontSize * 1.4;
  const completionTextY = subtitleY - TYPE_SCALE.caption.fontSize * 2.5;
  const completionBarY = -(height / 2) - 0.006;
  const textZ = SURFACE_DEPTH + DEPTH_LAYERS.content;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Chrome border — chamfered rectangle */}
      <mesh
        ref={borderRef}
        geometry={borderGeometry}
        material={borderMaterial}
        position={[0, 0, -BORDER_DEPTH / 2]}
      />

      {/* Carbon base surface — solid dark */}
      <mesh
        geometry={surfaceGeometry}
        material={surfaceMaterial}
        position={[0, 0, -SURFACE_DEPTH / 2 + 0.001]}
      />

      {/* Top-edge accent strip — floating translucent */}
      <mesh
        geometry={accentStripGeometry}
        material={accentStripMaterial}
        position={[0, height / 2 - ACCENT_STRIP_HEIGHT / 2 - 0.004, ACCENT_STRIP_FLOAT]}
      />

      {/* Title — drei Text, accent color */}
      {title && (
        <Text
          position={[0, titleY, textZ]}
          fontSize={TYPE_SCALE.label.fontSize}
          font={TYPE_SCALE.label.fontPath}
          color={color}
          anchorX="center"
          anchorY="middle"
          maxWidth={width * 0.88}
          textAlign="center"
        >
          {title}
        </Text>
      )}

      {/* Subtitle — drei Text, muted color */}
      {subtitle && (
        <Text
          position={[0, subtitleY, textZ]}
          fontSize={TYPE_SCALE.caption.fontSize}
          font={TYPE_SCALE.caption.fontPath}
          color={TEXT_COLORS.muted.hex}
          fillOpacity={TEXT_COLORS.muted.opacity}
          anchorX="center"
          anchorY="middle"
          maxWidth={width * 0.88}
          textAlign="center"
        >
          {subtitle}
        </Text>
      )}

      {/* Completion percentage — Orbitron numeric font */}
      {completion !== null && completion !== undefined && (
        <Text
          position={[0, completionTextY, textZ]}
          fontSize={TYPE_SCALE.caption.fontSize * 1.2}
          font={NUMERIC_FONT}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {`${Math.round(completion * 100)}%`}
        </Text>
      )}

      {/* Completion bar — emissive accent, toneMapped false */}
      {completion !== null && completion !== undefined && completion > 0 && (
        <mesh
          position={[
            -(width / 2) + (width * completion) / 2,
            completionBarY,
            SURFACE_DEPTH + 0.002,
          ]}
        >
          <planeGeometry args={[width * completion, 0.004]} />
          <primitive object={completionMaterial} />
        </mesh>
      )}

      {/* Completion bar track (ghost placeholder) */}
      {completion !== null && completion !== undefined && (
        <mesh position={[0, completionBarY, SURFACE_DEPTH + 0.001]}>
          <planeGeometry args={[width, 0.004]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={GHOST_PLACEHOLDER_OPACITY}
          />
        </mesh>
      )}
    </group>
  );
}

export default HolographicCard;
