'use client';

// ════════════════════════════════════════════════════
// NavigationButtonGrid — Physical Cockpit Page Navigation
// ════════════════════════════════════════════════════
// 5 beveled-square buttons in a pentagon cluster on a shared
// curved carbon-composite console plate with chrome border.
//
// Layout (pentagon):
//   ARCADE center-front, HOME left, LABS back-left,
//   SETTINGS back-right, PROFILE right.
//
// Each button: ExtrudeGeometry chamfered square (0.12 x 0.05),
// chrome bezel frame, backlit engraved label (no icons),
// spring-animated depress/hover, active ring indicator.
//
// Press -> cockpit state transition via cockpitBroadcastStore.
// ~1M triangles total (5 buttons + console plate + chrome frames).

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
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
} from 'three';
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
} from '@/lib/3d/cockpitDesignTokens';

// ════════════════════════════════════════════════════
// NAV BUTTON CONFIG — Pentagon cluster layout
// ════════════════════════════════════════════════════

interface NavButtonConfig {
  id: string;
  label: string;
  color: string;
  route: string;
  position: readonly [number, number, number];
}

const NAV_BUTTONS: NavButtonConfig[] = [
  { id: 'nav-arcade',   label: 'ARCADE',   color: '#00FF88', route: '/arcade',   position: [0, 0, 0.04] as const },
  { id: 'nav-home',     label: 'HOME',     color: '#00BBFF', route: '/home',     position: [-0.13, 0, 0] as const },
  { id: 'nav-labs',     label: 'LABS',     color: '#AA66FF', route: '/labs',     position: [-0.08, 0, -0.09] as const },
  { id: 'nav-settings', label: 'SETTINGS', color: '#FFAA44', route: '/settings', position: [0.08, 0, -0.09] as const },
  { id: 'nav-profile',  label: 'PROFILE',  color: '#FF66AA', route: '/profile',  position: [0.13, 0, 0] as const },
];

// ════════════════════════════════════════════════════
// BUTTON DIMENSIONS
// ════════════════════════════════════════════════════

const BUTTON_WIDTH = 0.12;
const BUTTON_HEIGHT = 0.05;
const BUTTON_DEPTH = 0.018;
const CHAMFER = 0.006;
const ACTIVE_DEPRESS = 0.015;
const RING_INNER = 0.068;
const RING_OUTER = 0.074;

// Console plate dimensions
const PLATE_WIDTH = 0.40;
const PLATE_HEIGHT = 0.25;
const PLATE_DEPTH = 0.008;
const PLATE_CHAMFER = 0.012;

// ════════════════════════════════════════════════════
// GEOMETRY BUILDERS (memoized outside render)
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
// SPRING HELPER
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
// NavButtonMesh — Single navigation button
// ════════════════════════════════════════════════════

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
  const textRef = useRef<Mesh>(null);

  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Spring state stored in refs for per-frame updates
  const springState = useRef({
    depressY: 0,
    depressVel: 0,
    scaleVal: 1,
    scaleVel: 0,
    emissiveVal: EMISSIVE_IDLE_BUTTON,
  });

  // Color objects (memoized)
  const accentColor = useMemo(() => new Color(config.color), [config.color]);

  // Button shape geometry (memoized)
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

  // Chrome bezel geometry — slightly larger than button
  const bezelGeometry = useMemo(() => {
    const bezelPad = 0.005;
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

  // Active ring geometry
  const ringGeo = useMemo(
    () => new RingGeometry(RING_INNER, RING_OUTER, 32),
    [],
  );

  // Spring config
  const spring = SPRING_PRESETS.snap;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); // Cap delta for stability
    const s = springState.current;

    // Compute target depress
    const targetDepress = pressed
      ? -PRESS_DEPTH
      : active
        ? -ACTIVE_DEPRESS
        : 0;

    // Compute target scale
    const targetScale = hovered && !pressed ? 1.05 : 1.0;

    // Compute target emissive
    const targetEmissive = pressed
      ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER * 1.2
      : hovered
        ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER
        : active
          ? EMISSIVE_IDLE_BUTTON * 1.3
          : EMISSIVE_IDLE_BUTTON;

    // Spring depress
    [s.depressY, s.depressVel] = springLerp(
      s.depressY, targetDepress, s.depressVel, dt, spring,
    );

    // Spring scale
    [s.scaleVal, s.scaleVel] = springLerp(
      s.scaleVal, targetScale, s.scaleVel, dt, SPRING_PRESETS.bounce,
    );

    // Smooth emissive
    s.emissiveVal += (targetEmissive - s.emissiveVal) * Math.min(dt * 8, 1);

    // Apply to group
    if (groupRef.current) {
      groupRef.current.position.y = s.depressY;
      groupRef.current.scale.setScalar(s.scaleVal);
    }

    // Apply emissive to button material
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      if (mat.emissive) {
        mat.emissiveIntensity = s.emissiveVal;
      }
    }

    // Active ring pulse
    if (ringRef.current) {
      ringRef.current.visible = active;
      if (active) {
        const pulse =
          HOVER_GLOW.pulseMin +
          (HOVER_GLOW.pulseMax - HOVER_GLOW.pulseMin) *
            (0.5 + 0.5 * Math.sin(Date.now() * 0.001 * (2 * Math.PI / HOVER_GLOW.pulsePeriodS)));
        const ringMat = ringRef.current.material as MeshBasicMaterial;
        ringMat.opacity = pulse;
      }
    }
  });

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
        {/* Chrome bezel frame — sits behind button */}
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

        {/* Button body — beveled square, concave top */}
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

        {/* Backlit engraved label */}
        <Text
          ref={textRef}
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

        {/* Active indicator ring — visible only when active */}
        <mesh
          ref={ringRef}
          geometry={ringGeo}
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
// CONSOLE PLATE GEOMETRY
// ════════════════════════════════════════════════════

function ConsolePlate() {
  const geometry = useMemo(() => {
    const shape = createChamferedSquareShape(PLATE_WIDTH, PLATE_HEIGHT, PLATE_CHAMFER);
    return new ExtrudeGeometry(shape, {
      depth: PLATE_DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL_STYLE.structural.value,
      bevelSize: BEVEL_STYLE.structural.value,
      bevelSegments: 2,
    });
  }, []);

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

      {/* Carbon composite plate */}
      <mesh
        geometry={geometry}
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
      {/* Shared console plate with chrome border */}
      <ConsolePlate />

      {/* 5 nav buttons in pentagon cluster */}
      {NAV_BUTTONS.map((button) => (
        <NavButtonMesh
          key={button.id}
          config={button}
          active={activeRoute === button.route}
          onPress={() => handleNavigation(button)}
        />
      ))}
    </group>
  );
}

export default NavigationButtonGrid;
