'use client';

// ════════════════════════════════════════════════════
// RadialDial3D — Knurled Spring-Physics Rotary Control
// ════════════════════════════════════════════════════
// Decision 3.1: Knurled cylinder knob — grip ridges via instanced thin boxes
// Decision 3.2: LED ring + label — 24 emissive spheres fill proportionally
// Decision 3.3: Illuminated tick dots — 24 glowing spheres at outer radius
// Decision 3.4: Smooth rotation — continuous drag following mouse
// Decision 3.5: Glass cover — readOnly gauges get sealed translucent dome
//
// Uses cockpitDesignTokens for all visual constants.
// Broadcasts to cockpitBroadcastStore on every interaction.
//
// ~200K triangles per dial

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  Group,
  InstancedMesh,
  MeshPhongMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  BoxGeometry,
  DoubleSide,
} from 'three';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { fireHaptic } from '@/lib/haptic/hapticSim';
import {
  CHROME_BORDER,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_HOVER_MULTIPLIER,
  EMISSIVE_LED_MULTIPLIER,
  SPRING_PRESETS,
  HOVER_GLOW,
  STATE_MACHINE,
  TYPE_SCALE,
  NUMERIC_FONT,
  getEmissive,
} from '@/lib/3d/cockpitDesignTokens';

// ■■ Props ■■

interface RadialDial3DProps {
  id: string;
  label: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
  color?: string;
  position?: [number, number, number];
  scale?: number;
  readOnly?: boolean;
  formatValue?: (v: number) => string;
}

// ■■ Constants ■■
const DIAL_RADIUS = 0.08;
const DIAL_HEIGHT = 0.04;
const LED_COUNT = 24;
const RIDGE_COUNT = 24;
const VALUE_ARC = Math.PI * 1.5; // 270 deg sweep
const ARC_START = Math.PI * 0.75; // Start at 135 deg

const LED_RADIUS = 0.006;
const LED_RING_R = DIAL_RADIUS * 1.12;
const TICK_DOT_RADIUS = 0.004;
const TICK_RING_R = DIAL_RADIUS * 1.25;

const DIM_COLOR = new Color('#1a1e2e');
const CHROME_COLOR = new Color(CHROME_BORDER.color);

// Spring config for smooth drag interpolation
const SMOOTH_SPRING = SPRING_PRESETS.smooth;
const BOUNCE_SPRING = SPRING_PRESETS.bounce;
// Derive a lerp factor from spring stiffness/damping
const SPRING_LERP_FACTOR = SMOOTH_SPRING.stiffness / (SMOOTH_SPRING.stiffness + SMOOTH_SPRING.damping * 10);
const BOUNCE_LERP_FACTOR = BOUNCE_SPRING.stiffness / (BOUNCE_SPRING.stiffness + BOUNCE_SPRING.damping * 10);

// Phase 2 audit fix (Section 5.2): Release overshoot for mechanical satisfying feel
const OVERSHOOT_RAD = (2 * Math.PI) / 180; // 2 degrees
const OVERSHOOT_DURATION = 0.2;

// Glow pulse timing from design tokens
const GLOW_PULSE_PERIOD = HOVER_GLOW.pulsePeriodS;

// Reusable geometries (shared across instances)
const ridgeGeometry = new BoxGeometry(0.003, DIAL_HEIGHT * 0.8, 0.002);
const ledGeometry = new SphereGeometry(LED_RADIUS, 8, 8);
const tickGeometry = new SphereGeometry(TICK_DOT_RADIUS, 6, 6);

export function RadialDial3D({
  id,
  label,
  min = 0,
  max = 100,
  value,
  onChange,
  color = '#00bbff',
  position = [0, 0, 0],
  scale = 1,
  readOnly = false,
  formatValue = (v) => Math.round(v).toString(),
}: RadialDial3DProps) {
  const groupRef = useRef<Group>(null);
  const knobRef = useRef<Group>(null);
  const ridgesRef = useRef<InstancedMesh>(null);
  const ledsRef = useRef<InstancedMesh>(null);
  const ticksRef = useRef<InstancedMesh>(null);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dragStartRef = useRef({ y: 0, startValue: 0 });
  const glowPulseRef = useRef(0);
  const prevValueRef = useRef(value);

  const dialColor = useMemo(() => new Color(color), [color]);
  const normalizedValue = (value - min) / (max - min);

  // ■■ Materials ■■

  const chromeMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CHROME_COLOR.clone(),
        metalness: 0.98,
        roughness: 0.12,
        emissive: new Color('#223344'),
        emissiveIntensity: getEmissive('dormant'),
      }),
    [],
  );

  const knobMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color('#6a7a8e'),
        metalness: 0.95,
        roughness: 0.2,
        emissive: dialColor.clone(),
        // Phase 2 audit fix (Section 7.1): Design token adoption
        // 25% of STATE_MACHINE.idle.emissive ('medium' === EMISSIVE_SCALE.medium === 0.8) = 0.2
        emissiveIntensity: getEmissive(STATE_MACHINE.idle.emissive) * 0.25,
      }),
    [dialColor],
  );

  const glassMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: new Color('#88aacc'),
        transparent: true,
        opacity: 0.15,
        shininess: 200,
        side: DoubleSide,
        depthWrite: false,
      }),
    [],
  );

  // ■■ Build knurled ridge transforms ■■
  useMemo(() => {
    if (!ridgesRef.current) return;
    const dummy = new Object3D();
    for (let i = 0; i < RIDGE_COUNT; i++) {
      const angle = (i / RIDGE_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * DIAL_RADIUS;
      const z = Math.sin(angle) * DIAL_RADIUS;
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      ridgesRef.current.setMatrixAt(i, dummy.matrix);
    }
    ridgesRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // ■■ Build LED ring + tick dot transforms ■■
  useMemo(() => {
    if (!ledsRef.current || !ticksRef.current) return;
    const dummy = new Object3D();
    for (let i = 0; i < LED_COUNT; i++) {
      const angle = ARC_START + (i / LED_COUNT) * VALUE_ARC;
      const lx = Math.cos(angle) * LED_RING_R;
      const lz = Math.sin(angle) * LED_RING_R;
      dummy.position.set(lx, DIAL_HEIGHT / 2 + 0.003, lz);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      ledsRef.current.setMatrixAt(i, dummy.matrix);

      const tx = Math.cos(angle) * TICK_RING_R;
      const tz = Math.sin(angle) * TICK_RING_R;
      dummy.position.set(tx, DIAL_HEIGHT / 2 + 0.002, tz);
      dummy.updateMatrix();
      ticksRef.current.setMatrixAt(i, dummy.matrix);
    }
    ledsRef.current.instanceMatrix.needsUpdate = true;
    ticksRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // ■■ Update LED + tick colors based on value ■■
  const updateLEDColors = useCallback(
    (norm: number) => {
      if (!ledsRef.current || !ticksRef.current) return;
      const activeCount = Math.round(norm * LED_COUNT);
      const activeColor = dialColor.clone();
      const dimC = DIM_COLOR.clone();

      for (let i = 0; i < LED_COUNT; i++) {
        if (i < activeCount) {
          ledsRef.current.setColorAt(i, activeColor);
          ticksRef.current.setColorAt(i, activeColor);
        } else {
          ledsRef.current.setColorAt(i, dimC);
          ticksRef.current.setColorAt(i, dimC);
        }
      }
      if (ledsRef.current.instanceColor) ledsRef.current.instanceColor.needsUpdate = true;
      if (ticksRef.current.instanceColor) ticksRef.current.instanceColor.needsUpdate = true;
    },
    [dialColor],
  );

  // Initialize colors
  useEffect(() => {
    updateLEDColors(normalizedValue);
  }, [normalizedValue, updateLEDColors]);

  // Trigger glow pulse on value change
  useEffect(() => {
    if (prevValueRef.current !== value) {
      glowPulseRef.current = 1.0;
      prevValueRef.current = value;
    }
  }, [value]);

  // ■■ Drag handlers ■■
  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (readOnly) return;
      e.stopPropagation();
      setDragging(true);
      dragStartRef.current = { y: e.clientY, startValue: value };
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    },
    [value, readOnly],
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!dragging || readOnly) return;
      e.stopPropagation();
      const deltaY = dragStartRef.current.y - e.clientY;
      const range = max - min;
      const sensitivity = range / 200; // 200px drag = full range
      const newValue = Math.max(min, Math.min(max, dragStartRef.current.startValue + deltaY * sensitivity));
      onChange(newValue);

      broadcast({
        type: 'dial-rotate',
        source: id,
        value: newValue,
        color,
        label,
      });
    },
    [dragging, readOnly, min, max, onChange, broadcast, id, color, label],
  );

  // Phase 2 audit fix (Section 5.2): Spring overshoot on release for mechanical feel
  const overshootTimeRef = useRef(-1);
  const releaseValueRef = useRef(normalizedValue);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    // Trigger overshoot animation on release
    overshootTimeRef.current = 0;
    releaseValueRef.current = normalizedValue;
    // Phase 4 §10.14 (J-A): Fire snapToGrid haptic on dial release —
    // micro camera shake + click complements the existing spring
    // overshoot, giving the "landing" moment real tactile weight.
    fireHaptic('snapToGrid');
  }, [normalizedValue]);

  // ■■ Per-frame animation ■■
  useFrame((_, delta) => {
    if (!knobRef.current) return;

    // Compute target rotation — with overshoot on release (Phase 2 audit fix: Section 5.2)
    let targetRotation = -ARC_START - normalizedValue * VALUE_ARC;
    let lerpSpeed = SPRING_LERP_FACTOR * delta * 60;

    if (overshootTimeRef.current >= 0) {
      overshootTimeRef.current += delta;
      const ot = overshootTimeRef.current / OVERSHOOT_DURATION;
      if (ot >= 1) {
        overshootTimeRef.current = -1;
      } else {
        // Sine-curve overshoot: +2° at peak, decaying to 0
        const overshootAmount = Math.sin(ot * Math.PI) * OVERSHOOT_RAD * (1 - ot);
        targetRotation += overshootAmount;
        lerpSpeed = BOUNCE_LERP_FACTOR * delta * 60; // Bouncier lerp during overshoot
      }
    }

    knobRef.current.rotation.y += (targetRotation - knobRef.current.rotation.y) * Math.min(lerpSpeed, 1);

    // Glow pulse decay using design token period
    if (glowPulseRef.current > 0) {
      const decayRate = 1 / GLOW_PULSE_PERIOD;
      glowPulseRef.current = Math.max(0, glowPulseRef.current - delta * decayRate);
      // Phase 2 audit fix (Section 7.1): Design token adoption
      // Base = 25% of medium idle button emissive (STATE_MACHINE.idle.emissive === 'medium' === 0.8)
      // Pulse peak adds up to 0.9 (EMISSIVE_HOVER_MULTIPLIER 1.8 * 0.5), summing to ~1.1 at crest
      knobMaterial.emissiveIntensity =
        getEmissive(STATE_MACHINE.idle.emissive) * 0.25
        + glowPulseRef.current * EMISSIVE_HOVER_MULTIPLIER * 0.5;
    }

    // Hover emissive boost
    if (hovered && !dragging && !readOnly) {
      // Phase 2 audit fix (Section 7.1): Design token adoption
      // Previous (legacy): idle-button emissive * HOVER_MULTIPLIER * 0.3 = 0.8 * 1.8 * 0.3 = 0.432
      // Now:               getEmissive(STATE_MACHINE.hover.emissive) * 0.3 = 1.5 * 0.3 = 0.45 (~4% above legacy)
      knobMaterial.emissiveIntensity = Math.max(
        knobMaterial.emissiveIntensity,
        getEmissive(STATE_MACHINE.hover.emissive) * 0.3,
      );
    }
  });

  // Emissive intensities for LED materials
  const _activeLEDEmissive = EMISSIVE_LED_MULTIPLIER * EMISSIVE_IDLE_INDICATOR;
  const _dormantEmissive = getEmissive('dormant');

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Chrome base plate */}
      <mesh material={chromeMaterial} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[DIAL_RADIUS * 1.5, DIAL_RADIUS * 1.5, 0.008, 32]} />
      </mesh>

      {/* LED ring — 24 emissive spheres (instanced, per-instance color) */}
      <instancedMesh ref={ledsRef} args={[ledGeometry, undefined, LED_COUNT]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Tick dots — 24 illuminated dots at outer radius (instanced, per-instance color) */}
      <instancedMesh ref={ticksRef} args={[tickGeometry, undefined, LED_COUNT]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Knob group — rotates with value */}
      <group
        ref={knobRef}
        onPointerDown={readOnly ? undefined : handlePointerDown}
        onPointerMove={readOnly ? undefined : handlePointerMove}
        onPointerUp={readOnly ? undefined : handlePointerUp}
        onPointerOver={
          readOnly
            ? undefined
            : () => {
                setHovered(true);
                document.body.style.cursor = 'grab';
              }
        }
        onPointerOut={
          readOnly
            ? undefined
            : () => {
                setHovered(false);
                document.body.style.cursor = 'default';
              }
        }
      >
        {/* Knob cylinder body */}
        <mesh material={knobMaterial}>
          <cylinderGeometry
            args={[
              DIAL_RADIUS,
              DIAL_RADIUS,
              readOnly ? DIAL_HEIGHT * 0.3 : DIAL_HEIGHT,
              32,
            ]}
          />
        </mesh>

        {/* Knurled grip ridges — 24 instanced thin boxes around edge */}
        <instancedMesh ref={ridgesRef} args={[ridgeGeometry, undefined, RIDGE_COUNT]} frustumCulled={false}>
          <meshStandardMaterial
            color="#5a6a7e"
            metalness={0.9}
            roughness={0.3}
          />
        </instancedMesh>

        {/* Indicator dot on knob (hidden when readOnly) */}
        {!readOnly && (
          <mesh position={[DIAL_RADIUS * 0.6, DIAL_HEIGHT / 2 + 0.003, 0]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* Read-only glass dome cover */}
      {readOnly && (
        <mesh
          position={[0, DIAL_HEIGHT * 0.15 + 0.002, 0]}
          rotation={[Math.PI, 0, 0]}
        >
          <sphereGeometry args={[DIAL_RADIUS * 1.05, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={glassMaterial} />
        </mesh>
      )}

      {/* Label text */}
      <Text
        position={[0, -DIAL_RADIUS * 1.8, 0]}
        fontSize={TYPE_SCALE.label.fontSize}
        color="#88aacc"
        anchorX="center"
        anchorY="top"
        font={TYPE_SCALE.label.fontPath}
      >
        {label}
      </Text>

      {/* Value display (Orbitron numeric font) */}
      <Text
        position={[0, DIAL_HEIGHT + 0.02, 0]}
        fontSize={TYPE_SCALE.caption.fontSize}
        color={color}
        anchorX="center"
        anchorY="bottom"
        font={NUMERIC_FONT}
      >
        {formatValue(value)}
      </Text>
    </group>
  );
}

export default RadialDial3D;
