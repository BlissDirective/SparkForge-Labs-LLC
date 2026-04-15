'use client';

// ════════════════════════════════════════════════════
// NavigationButtonGrid — Physical Cockpit Page Navigation
// ════════════════════════════════════════════════════
// 5 beveled-square buttons in a pentagon cluster on a shared
// curved carbon-composite console plate with chrome border.
//
// Design Decisions:
//   1.1 Button Shape: Beveled square — chamfered edges, concave top, chrome frame
//   1.2 Layout: Pentagon cluster — ARCADE center-front, HOME/LABS back-left, SETTINGS/PROFILE back-right
//   1.3 Size: Standard — 0.12 x 0.05 units per button
//   1.4 Label Style: Backlit engraved — text engraved into surface, lit from behind (NO icons)
//   1.5 Active Indicator: Depressed + illuminated ring — 0.015 depress + bright accent ring
//   1.6 Mounting: Shared console plate — single curved carbon composite plate with chrome border
//
// Press -> cockpit state transition via cockpitBroadcastStore.
// ~1M triangles total (5 buttons + console plate + chrome frames).

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { useRouter, usePathname } from 'next/navigation';
import {
  Group,
  Mesh,
  Color,
  Shape,
  ExtrudeGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  RingGeometry,
  AdditiveBlending,
  DoubleSide,
  Vector3,
} from 'three';
import { useMagneticCursor } from '@/hooks/useMagneticCursor';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import {
  CHROME_BORDER,
  PRESS_DEPTH,
  EMISSIVE_IDLE_BUTTON,
  EMISSIVE_HOVER_MULTIPLIER,
  SPRING_PRESETS,
  HOVER_GLOW,
  TYPE_SCALE,
  BEVEL_STYLE,
  STATE_MACHINE,
  EMISSIVE_SCALE,
} from '@/lib/3d/cockpitDesignTokens';

// ════════════════════════════════════════════════════
// NAV BUTTON CONFIG — Pentagon cluster layout (Decision 1.2)
// ════════════════════════════════════════════════════

interface NavButtonConfig {
  id: string;
  label: string;
  color: string;
  route: string;
  position: readonly [number, number, number];
}

const NAV_BUTTONS: NavButtonConfig[] = [
  { id: 'nav-arcade',   label: 'ARCADE',   color: '#00FF88', route: '/arcade',   position: [0, 0, 0.04] as const },      // center front
  { id: 'nav-home',     label: 'HOME',     color: '#00BBFF', route: '/home',     position: [-0.13, 0, 0] as const },     // left
  { id: 'nav-labs',     label: 'LABS',     color: '#AA66FF', route: '/labs',     position: [-0.08, 0, -0.09] as const }, // back-left
  { id: 'nav-settings', label: 'SETTINGS', color: '#FFAA44', route: '/settings', position: [0.08, 0, -0.09] as const }, // back-right
  { id: 'nav-profile',  label: 'PROFILE',  color: '#FF66AA', route: '/profile',  position: [0.13, 0, 0] as const },     // right
];

// ════════════════════════════════════════════════════
// BUTTON DIMENSIONS (Decisions 1.1, 1.3, 1.5)
// ════════════════════════════════════════════════════

const BUTTON_WIDTH = 0.12;
const BUTTON_HEIGHT = 0.05;
const BUTTON_DEPTH = 0.018;
const CHAMFER = 0.006;
const ACTIVE_DEPRESS = 0.015; // Decision 1.5: active stays depressed 0.015 units
// Phase 2 audit fix (Section 7.1): Design token adoption — EMISSIVE_SCALE.blazing === 2.5
const _ACTIVE_RING_EMISSIVE = EMISSIVE_SCALE.blazing; // Decision 1.5: bright accent ring emissive
const RING_INNER = 0.068;
const RING_OUTER = 0.074;

// Console plate dimensions (Decision 1.6)
const PLATE_WIDTH = 0.40;
const PLATE_HEIGHT = 0.25;
const PLATE_DEPTH = 0.008;
const PLATE_CHAMFER = 0.012;

// ════════════════════════════════════════════════════
// GEOMETRY BUILDERS
// ════════════════════════════════════════════════════

function createChamferedSquareShape(
  w: number,
  h: number,
  chamfer: number,
): Shape {
  const hw = w / 2;
  const hh = h / 2;
  const c = chamfer;
  const shape = new Shape();
  shape.moveTo(-hw + c, -hh);
  shape.lineTo(hw - c, -hh);
  shape.lineTo(hw, -hh + c);
  shape.lineTo(hw, hh - c);
  shape.lineTo(hw - c, hh);
  shape.lineTo(-hw + c, hh);
  shape.lineTo(-hw, hh - c);
  shape.lineTo(-hw, -hh + c);
  shape.closePath();
  return shape;
}

// ════════════════════════════════════════════════════
// SPRING HELPER — per-frame physics integration
// ════════════════════════════════════════════════════

function springLerp(
  current: number,
  target: number,
  velocity: number,
  dt: number,
  config: { stiffness: number; damping: number; mass: number },
): [number, number] {
  const force = -config.stiffness * (current - target);
  const dampForce = -config.damping * velocity;
  const accel = (force + dampForce) / config.mass;
  const newVelocity = velocity + accel * dt;
  const newValue = current + newVelocity * dt;
  return [newValue, newVelocity];
}

// ════════════════════════════════════════════════════
// NavButtonMesh — Single beveled-square navigation button
// ════════════════════════════════════════════════════
// Custom geometry per Decision 1.1 (NOT HolographicButton).
// Each button: ExtrudeGeometry chamfered square, chrome bezel,
// backlit engraved Text label, active ring indicator, spring physics.

interface NavButtonMeshProps {
  config: NavButtonConfig;
  active: boolean;
  onPress: () => void;
}

function NavButtonMesh({ config, active, onPress }: NavButtonMeshProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const bezelRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);

  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Phase 4 §10.3: Magnetic cursor pull on nav buttons
  const magnetic = useMagneticCursor({ radius: 0.08, strength: 0.18, maxOffset: 0.015 });
  const restPos = useMemo(
    () => new Vector3(config.position[0], config.position[1], config.position[2]),
    [config.position]
  );

  // Spring state stored in refs for per-frame updates (no re-renders)
  const springState = useRef({
    depressY: 0,
    depressVel: 0,
    scaleVal: 1,
    scaleVel: 0,
    emissiveVal: EMISSIVE_IDLE_BUTTON,
  });

  // Accent color (memoized)
  const accentColor = useMemo(() => new Color(config.color), [config.color]);

  // Button body geometry — beveled square, slightly concave top (Decision 1.1)
  const buttonGeometry = useMemo(() => {
    const shape = createChamferedSquareShape(BUTTON_WIDTH, BUTTON_HEIGHT, CHAMFER);
    return new ExtrudeGeometry(shape, {
      depth: BUTTON_DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL_STYLE.interactive.value,
      bevelSize: BEVEL_STYLE.interactive.value,
      bevelSegments: 3,
    });
  }, []);

  // Chrome bezel frame — slightly larger than button body (Decision 1.1)
  const bezelGeometry = useMemo(() => {
    const bezelPad = CHROME_BORDER.width * 0.0025; // scale border width token to 3D units
    const shape = createChamferedSquareShape(
      BUTTON_WIDTH + bezelPad * 2,
      BUTTON_HEIGHT + bezelPad * 2,
      CHAMFER + bezelPad,
    );
    return new ExtrudeGeometry(shape, {
      depth: BUTTON_DEPTH + 0.003,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
    });
  }, []);

  // Active indicator ring geometry (Decision 1.5)
  const ringGeometry = useMemo(
    () => new RingGeometry(RING_INNER, RING_OUTER, 32),
    [],
  );

  // Spring configs from design tokens
  const snapSpring = SPRING_PRESETS.snap;
  const bounceSpring = SPRING_PRESETS.bounce;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); // Cap delta for stability
    const s = springState.current;

    // Target depress: pressed > active > idle
    const targetDepress = pressed
      ? -PRESS_DEPTH
      : active
        ? -ACTIVE_DEPRESS
        : 0;

    // Target scale: hover expands slightly
    // Phase 2 audit fix (Section 7.1): Design token adoption — STATE_MACHINE.hover.scale === 1.05
    const targetScale = hovered && !pressed ? STATE_MACHINE.hover.scale : STATE_MACHINE.idle.scale;

    // Target emissive: pressed > hover > active > idle
    const targetEmissive = pressed
      ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER * 1.2
      : hovered
        ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER
        : active
          ? EMISSIVE_IDLE_BUTTON * 1.3
          : EMISSIVE_IDLE_BUTTON;

    // Spring depress (snap for crisp tactile feel)
    [s.depressY, s.depressVel] = springLerp(
      s.depressY, targetDepress, s.depressVel, dt, snapSpring,
    );

    // Spring scale (bounce for playful hover)
    [s.scaleVal, s.scaleVel] = springLerp(
      s.scaleVal, targetScale, s.scaleVel, dt, bounceSpring,
    );

    // Smooth emissive transition
    s.emissiveVal += (targetEmissive - s.emissiveVal) * Math.min(dt * 8, 1);

    // Apply transforms to group + Phase 4 §10.3 magnetic offset
    if (groupRef.current) {
      const cursorPos = hovered ? restPos : null;
      magnetic.update(restPos, cursorPos, dt);
      const magOff = magnetic.state.current.offset;
      groupRef.current.position.x = magOff.x;
      groupRef.current.position.y = s.depressY + magOff.y;
      groupRef.current.position.z = magOff.z;
      groupRef.current.scale.setScalar(s.scaleVal);
    }

    // Apply emissive intensity to button material
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = s.emissiveVal;
      }
    }

    // Active ring pulse (Decision 1.5: pulses per HOVER_GLOW timing)
    if (ringRef.current) {
      ringRef.current.visible = active;
      if (active) {
        const pulse =
          HOVER_GLOW.pulseMin +
          (HOVER_GLOW.pulseMax - HOVER_GLOW.pulseMin) *
            (0.5 + 0.5 * Math.sin(
              Date.now() * 0.001 * (2 * Math.PI / HOVER_GLOW.pulsePeriodS),
            ));
        const ringMat = ringRef.current.material as MeshBasicMaterial;
        ringMat.opacity = pulse;
      }
    }
  });

  // Pointer handlers
  const handlePointerDown = useCallback(() => setPressed(true), []);
  const handlePointerUp = useCallback(() => {
    setPressed(false);
    onPress();
  }, [onPress]);
  const handlePointerOver = useCallback(() => setHovered(true), []);
  const handlePointerOut = useCallback(() => {
    setHovered(false);
    setPressed(false);
  }, []);

  return (
    <group position={[config.position[0], config.position[1], config.position[2]]}>
      <group ref={groupRef}>
        {/* Chrome bezel frame — sits behind button (Decision 1.1) */}
        <mesh
          ref={bezelRef}
          geometry={bezelGeometry}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.001, 0]}
        >
          <meshStandardMaterial
            color={CHROME_BORDER.color}
            metalness={0.92}
            roughness={0.18}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Button body — beveled square with concave top (Decision 1.1) */}
        <mesh
          ref={meshRef}
          geometry={buttonGeometry}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <meshStandardMaterial
            color="#1A1822"
            metalness={0.7}
            roughness={0.3}
            emissive={accentColor}
            emissiveIntensity={EMISSIVE_IDLE_BUTTON}
          />
        </mesh>

        {/* Backlit engraved label — no icons (Decision 1.4) */}
        <Text
          position={[0, BUTTON_DEPTH + 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          font={TYPE_SCALE.caption.fontPath}
          anchorX="center"
          anchorY="middle"
          color="#F0F0F4"
          outlineColor={config.color}
          outlineWidth={0.001}
          outlineBlur={0.003}
          outlineOpacity={0.9}
        >
          {config.label}
          <meshBasicMaterial
            color="#F0F0F4"
            toneMapped={false}
          />
        </Text>

        {/* Active indicator ring — visible only when active (Decision 1.5) */}
        <mesh
          ref={ringRef}
          geometry={ringGeometry}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, BUTTON_DEPTH + 0.004, 0]}
          visible={false}
        >
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={1}
            toneMapped={false}
            blending={AdditiveBlending}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

// ════════════════════════════════════════════════════
// CONSOLE PLATE — Shared carbon composite mounting (Decision 1.6)
// ════════════════════════════════════════════════════
// Material: MeshStandardMaterial color #0A0F1F, metalness 0.85, roughness 0.35
// Chrome border edge (thin frame around plate)
// Size: ~0.4 x 0.25 units with slight curve

function ConsolePlate() {
  // Carbon composite plate geometry
  const plateGeometry = useMemo(() => {
    const shape = createChamferedSquareShape(PLATE_WIDTH, PLATE_HEIGHT, PLATE_CHAMFER);
    return new ExtrudeGeometry(shape, {
      depth: PLATE_DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL_STYLE.structural.value,
      bevelSize: BEVEL_STYLE.structural.value,
      bevelSegments: 2,
    });
  }, []);

  // Chrome border frame — slightly larger than plate
  const borderGeometry = useMemo(() => {
    const pad = 0.004;
    const shape = createChamferedSquareShape(
      PLATE_WIDTH + pad * 2,
      PLATE_HEIGHT + pad * 2,
      PLATE_CHAMFER + pad,
    );
    return new ExtrudeGeometry(shape, {
      depth: PLATE_DEPTH + 0.002,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
    });
  }, []);

  return (
    <group position={[0, -0.005, 0]}>
      {/* Chrome border edge */}
      <mesh
        geometry={borderGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
      >
        <meshStandardMaterial
          color={CHROME_BORDER.color}
          metalness={0.92}
          roughness={0.18}
          envMapIntensity={1.0}
        />
      </mesh>

      {/* Carbon composite plate surface */}
      <mesh
        geometry={plateGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#0A0F1F"
          metalness={0.85}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════
// NavigationButtonGrid — Main export
// ════════════════════════════════════════════════════
// Renders the console plate + 5 NavButtonMesh instances
// in a pentagon cluster layout. Handles route matching
// and cockpit broadcast on navigation.

interface NavigationButtonGridProps {
  /** Position of the entire grid in cockpit space */
  position?: [number, number, number];
  /** Scale multiplier */
  scale?: number;
}

export function NavigationButtonGrid({
  position = [0, 0.35, -1.85],
  scale = 1,
}: NavigationButtonGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const setLabColor = useUIStore((s) => s.setLabColor);

  // Determine which button is active based on current route
  const activeRoute = useMemo(() => {
    if (!pathname) return '/home';
    if (pathname.startsWith('/labs')) return '/labs';
    if (pathname.startsWith('/arcade')) return '/arcade';
    if (pathname.startsWith('/settings')) return '/settings';
    if (pathname.startsWith('/profile')) return '/profile';
    return '/home';
  }, [pathname]);

  const handleNavigation = useCallback(
    (button: NavButtonConfig) => {
      // Broadcast navigation event — triggers full cockpit state transition
      broadcast({
        type: 'page-navigate',
        source: button.id,
        color: button.color,
        label: button.label,
        targetPage: button.route,
      });

      // Update lab color for visual feedback
      setLabColor(button.color);

      // Navigate
      router.push(button.route);
    },
    [broadcast, setLabColor, router],
  );

  return (
    <group position={position} scale={scale}>
      {/* Shared console plate with chrome border (Decision 1.6) */}
      <ConsolePlate />

      {/* 5 nav buttons in pentagon cluster (Decision 1.2) */}
      {NAV_BUTTONS.map((button) => (
        <NavButtonMesh
          key={button.id}
          config={button}
          active={activeRoute === button.route}
          onPress={() => handleNavigation(button)}
        />
      ))}

      {/* ═══ Keyboard-accessible HTML overlay proxies (COCK-10 fix) ═══ */}
      {/* Invisible buttons that receive keyboard focus, enabling Tab + Enter
          navigation to mirror the 3D button grid. Visible only on :focus-visible. */}
      <Html
        position={[0, 0.02, 0.06]}
        style={{ pointerEvents: 'none' }}
        zIndexRange={[0, 0]}
      >
        <div
          role="toolbar"
          aria-label="Cockpit navigation buttons"
          style={{
            display: 'flex',
            gap: '4px',
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
          }}
        >
          {NAV_BUTTONS.map((button) => (
            <button
              key={button.id}
              onClick={() => handleNavigation(button)}
              aria-label={`Navigate to ${button.label}`}
              aria-current={activeRoute === button.route ? 'page' : undefined}
              style={{
                width: '44px',
                height: '44px',
                background: 'transparent',
                border: 'none',
                color: 'transparent',
                cursor: 'pointer',
                borderRadius: '6px',
                fontSize: '0',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid ${button.color}`;
                e.currentTarget.style.outlineOffset = '2px';
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#F0F0F4';
                e.currentTarget.style.fontSize = '10px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'transparent';
                e.currentTarget.style.fontSize = '0';
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
      </Html>
    </group>
  );
}

export default NavigationButtonGrid;
