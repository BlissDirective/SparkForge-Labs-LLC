'use client';

// ════════════════════════════════════════════════════
// ToggleSwitch3D — Physical Cockpit Paddle Toggle
// ════════════════════════════════════════════════════
// Per cockpit-architecture.json: "Physical Toggles — 3D toggle switches
// with snap animation and LED state indicator"
//
// Design decisions (Component 4):
//   4.1 Paddle switch — flat paddle flips up/down on horizontal axis
//   4.2 LED strip — thin accent-colored strip along mounting plate edge
//   4.3 Hard snap — instant 45° rotation, SPRING_PRESETS.snap
//   4.4 Grouped panel — single toggle; parent handles grouping
//
// Features:
// - Flat paddle switch with 45° hard snap rotation
// - LED strip indicator: accent ON, dim OFF
// - Chamfered mounting plate with chrome border frame
// - Sora caption label (TYPE_SCALE.caption)
// - Broadcasts to cockpitBroadcastStore
//
// ~80K triangles per toggle

import { useRef, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Shape,
  ExtrudeGeometry,
  BoxGeometry,
} from 'three';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import {
  CHROME_BORDER,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_LED_MULTIPLIER,
  EMISSIVE_SCALE,
  SPRING_PRESETS,
  TYPE_SCALE,
  ACCENT_LINES,
  getEmissive,
} from '@/lib/3d/cockpitDesignTokens';

interface ToggleSwitch3DProps {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  color?: string;
  position?: [number, number, number];
  scale?: number;
}

// ■■ Constants ■■
const PLATE_WIDTH = 0.06;
const PLATE_HEIGHT = 0.035;
const PLATE_DEPTH = 0.012;
const PLATE_CHAMFER = 0.006;
const BORDER_THICKNESS = 0.003;
const SNAP_ANGLE = Math.PI / 4; // 45°
const CARBON_BASE_COLOR = '#0A0F1F';

// Paddle geometry
const PADDLE_WIDTH = 0.035;
const PADDLE_HEIGHT = 0.004;
const PADDLE_DEPTH = 0.018;

// LED strip
const LED_STRIP_WIDTH = PLATE_WIDTH * 0.8;
const LED_STRIP_HEIGHT = 0.003;
const LED_STRIP_DEPTH = 0.004;
const _LED_ON_INTENSITY = EMISSIVE_LED_MULTIPLIER * EMISSIVE_IDLE_INDICATOR; // 0.75
const _LED_OFF_INTENSITY = getEmissive('off'); // 0.0

// Spring config from tokens
const { stiffness: SNAP_STIFFNESS, damping: SNAP_DAMPING, mass: SNAP_MASS } = SPRING_PRESETS.snap;

// ■■ Chamfered rectangle shape (45-degree corner cuts) ■■
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

export function ToggleSwitch3D({
  id,
  label,
  value,
  onChange,
  color = '#00FF88',
  position = [0, 0, 0],
  scale = 1,
}: ToggleSwitch3DProps) {
  const groupRef = useRef<Group>(null);
  const paddleRef = useRef<Group>(null);
  const ledRef = useRef<Mesh>(null);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  // Spring physics refs
  const angleRef = useRef(value ? -SNAP_ANGLE : SNAP_ANGLE);
  const velocityRef = useRef(0);

  // Colors
  const onColor = useMemo(() => new Color(color), [color]);
  const offColor = useMemo(() => new Color('#1a1e2e'), []);

  // ■■ Geometries (memoized) ■■
  const plateGeometry = useMemo(() => {
    const shape = createChamferedRect(PLATE_WIDTH, PLATE_HEIGHT, PLATE_CHAMFER);
    return new ExtrudeGeometry(shape, { depth: PLATE_DEPTH, bevelEnabled: false });
  }, []);

  const borderGeometry = useMemo(() => {
    const outerW = PLATE_WIDTH + BORDER_THICKNESS * 2;
    const outerH = PLATE_HEIGHT + BORDER_THICKNESS * 2;
    const outer = createChamferedRect(outerW, outerH, PLATE_CHAMFER + BORDER_THICKNESS);
    const inner = createChamferedRect(PLATE_WIDTH, PLATE_HEIGHT, PLATE_CHAMFER);
    outer.holes.push(inner);
    return new ExtrudeGeometry(outer, { depth: PLATE_DEPTH + 0.001, bevelEnabled: false });
  }, []);

  const paddleGeometry = useMemo(
    () => new BoxGeometry(PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH),
    [],
  );

  const ledStripGeometry = useMemo(
    () => new BoxGeometry(LED_STRIP_WIDTH, LED_STRIP_HEIGHT, LED_STRIP_DEPTH),
    [],
  );

  // ■■ Materials (memoized) ■■
  const plateMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color(CARBON_BASE_COLOR),
    metalness: 0.85,
    roughness: 0.35,
    emissive: new Color('#050812'),
    emissiveIntensity: 0.1,
  }), []);

  const borderMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color(CHROME_BORDER.colorHex),
    metalness: 0.95,
    roughness: 0.15,
    emissive: new Color(CHROME_BORDER.colorHex),
    emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), []);

  const paddleMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color(CHROME_BORDER.colorHex),
    metalness: 0.95,
    roughness: 0.15,
    emissive: new Color('#223344'),
    emissiveIntensity: 0.2,
  }), []);

  // Phase 2 audit fix (Section 5.3): LED pulse on state change
  // Pulses brightness from 1.0 → 2.5 → 1.5 over 300ms (brighter LED flash)
  // Phase 2 audit fix (Section 7.1): Design token adoption
  // 2.5 === EMISSIVE_SCALE.blazing, 1.5 === EMISSIVE_SCALE.bright
  const ledPulseRef = useRef(-1);
  const LED_PULSE_DURATION = 0.3;
  const LED_PULSE_PEAK = EMISSIVE_SCALE.blazing; // 2.5
  const LED_PULSE_SETTLE = EMISSIVE_SCALE.bright; // 1.5
  const LED_PULSE_BASE = 1.0;

  // ■■ Click handler ■■
  const handleClick = useCallback(() => {
    const newValue = !value;
    onChange(newValue);

    // Trigger LED pulse on toggle
    ledPulseRef.current = 0;

    broadcast({
      type: 'toggle-switch',
      source: id,
      value: newValue ? 1 : 0,
      color: newValue ? color : '#1a1e2e',
      label,
    });
  }, [value, onChange, broadcast, id, color, label]);

  // ■■ Per-frame animation — spring-driven hard snap ■■
  useFrame((_, delta) => {
    if (!paddleRef.current || !ledRef.current) return;

    // Clamp delta to prevent instability on tab-switch
    const dt = Math.min(delta, 0.05);

    // Spring physics: F = -k(x - target) - d*v
    const targetAngle = value ? -SNAP_ANGLE : SNAP_ANGLE;
    const displacement = angleRef.current - targetAngle;
    const springForce = -SNAP_STIFFNESS * displacement;
    const dampingForce = -SNAP_DAMPING * velocityRef.current;
    const acceleration = (springForce + dampingForce) / SNAP_MASS;

    velocityRef.current += acceleration * dt;
    angleRef.current += velocityRef.current * dt;

    // Snap to rest when close enough
    if (Math.abs(displacement) < 0.001 && Math.abs(velocityRef.current) < 0.01) {
      angleRef.current = targetAngle;
      velocityRef.current = 0;
    }

    paddleRef.current.rotation.x = angleRef.current;

    // LED strip — smooth color + emissive transition
    const ledMat = ledRef.current.material as MeshBasicMaterial;
    const targetColor = value ? onColor : offColor;
    ledMat.color.lerp(targetColor, Math.min(dt * 12, 1));

    // Phase 2 audit fix (Section 5.3): LED pulse brightness on toggle state change
    // Phase 2 audit fix (Section 7.1): Design token adoption — peak = EMISSIVE_SCALE.blazing (2.5),
    // settle = EMISSIVE_SCALE.bright (1.5).
    if (ledPulseRef.current >= 0) {
      ledPulseRef.current += dt;
      const pt = ledPulseRef.current / LED_PULSE_DURATION;
      if (pt >= 1) {
        ledPulseRef.current = -1;
      } else {
        // Curve: LED_PULSE_BASE → LED_PULSE_PEAK (at pt=0.3) → LED_PULSE_SETTLE
        const pulseMultiplier = pt < 0.3
          ? LED_PULSE_BASE + ((LED_PULSE_PEAK - LED_PULSE_BASE) * pt / 0.3)         // 1.0 → 2.5
          : LED_PULSE_PEAK - ((LED_PULSE_PEAK - LED_PULSE_SETTLE) * (pt - 0.3) / 0.7); // 2.5 → 1.5
        ledMat.color.multiplyScalar(pulseMultiplier);
      }
    }
  });

  // Caption style from design tokens
  const captionStyle = TYPE_SCALE.caption;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Chrome border frame */}
      <mesh
        geometry={borderGeometry}
        material={borderMaterial}
        position={[0, 0, -0.0005]}
      />

      {/* Mounting plate (chamfered, recessed dark panel) */}
      <mesh
        geometry={plateGeometry}
        material={plateMaterial}
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      />

      {/* Paddle group (rotates on X axis) */}
      <group ref={paddleRef} position={[0, 0, PLATE_DEPTH]}>
        {/* Flat rectangular paddle */}
        <mesh
          geometry={paddleGeometry}
          material={paddleMaterial}
          position={[0, PADDLE_DEPTH / 2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </group>

      {/* LED strip along bottom edge of mounting plate */}
      <mesh
        ref={ledRef}
        geometry={ledStripGeometry}
        position={[0, -PLATE_HEIGHT / 2 - LED_STRIP_HEIGHT / 2 - 0.002, PLATE_DEPTH + 0.002]}
      >
        <meshBasicMaterial
          color={value ? onColor : offColor}
          toneMapped={false}
        />
      </mesh>

      {/* Accent line (thin decorative line above LED strip) */}
      <mesh position={[0, -PLATE_HEIGHT / 2 - 0.001, PLATE_DEPTH + 0.001]}>
        <boxGeometry args={[PLATE_WIDTH * 0.9, ACCENT_LINES.width, 0.001]} />
        <meshBasicMaterial
          color={CHROME_BORDER.colorHex}
          transparent
          opacity={ACCENT_LINES.opacity}
        />
      </mesh>

      {/* Label text (below toggle, Sora caption) */}
      <Text
        position={[0, -PLATE_HEIGHT / 2 - 0.018, 0]}
        fontSize={captionStyle.fontSize}
        color="#8899aa"
        anchorX="center"
        anchorY="top"
        font={captionStyle.fontPath}
        letterSpacing={0.05}
      >
        {label.toUpperCase()}
      </Text>
    </group>
  );
}

export default ToggleSwitch3D;
