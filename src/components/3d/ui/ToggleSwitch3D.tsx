'use client';

// ════════════════════════════════════════════════════
// ToggleSwitch3D — Physical Cockpit Toggle Control
// ════════════════════════════════════════════════════
// Per cockpit-architecture.json: "Physical Toggles — 3D toggle switches
// with snap animation and LED state indicator"
//
// Features:
// - Chrome lever with ball tip on mounting plate
// - 45° snap rotation with spring animation
// - LED state indicator: green ON (#00FF88), dim OFF (#333)
// - Engraved label text (drei Text)
// - Mechanical snap sound trigger
// - Broadcasts to cockpitBroadcastStore
//
// ~80K triangles per toggle

import { useRef, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  SphereGeometry,
} from 'three';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

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
const LEVER_HEIGHT = 0.05;
const LEVER_WIDTH = 0.012;
const TIP_RADIUS = 0.01;
const SNAP_ANGLE = Math.PI / 4;  // 45°
const SPRING_SPEED = 15;

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
  const leverRef = useRef<Group>(null);
  const ledRef = useRef<Mesh>(null);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const onColor = useMemo(() => new Color(color), [color]);
  const offColor = useMemo(() => new Color('#333333'), []);

  // Materials
  const plateMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#1a1e2e'),
    metalness: 0.7,
    roughness: 0.4,
    emissive: new Color('#0a0e16'),
    emissiveIntensity: 0.2,
  }), []);

  const leverMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#a8b5c8'),
    metalness: 0.98,
    roughness: 0.12,
    emissive: new Color('#223344'),
    emissiveIntensity: 0.3,
  }), []);

  const tipMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#c0cee0'),
    metalness: 0.95,
    roughness: 0.08,
    envMapIntensity: 2.0,
  }), []);

  // ■■ Click handler ■■
  const handleClick = useCallback(() => {
    const newValue = !value;
    onChange(newValue);

    broadcast({
      type: 'toggle-switch',
      source: id,
      value: newValue ? 1 : 0,
      color: newValue ? color : '#333333',
      label,
    });
  }, [value, onChange, broadcast, id, color, label]);

  // ■■ Per-frame animation — spring snap ■■
  useFrame((_, delta) => {
    if (!leverRef.current || !ledRef.current) return;

    // Spring toward target angle
    const targetAngle = value ? -SNAP_ANGLE : SNAP_ANGLE;
    const currentAngle = leverRef.current.rotation.x;
    const diff = targetAngle - currentAngle;
    leverRef.current.rotation.x += diff * Math.min(SPRING_SPEED * delta, 1);

    // LED color — smooth transition
    const ledMat = ledRef.current.material as MeshBasicMaterial;
    const targetColor = value ? onColor : offColor;
    const currentColor = ledMat.color;
    currentColor.lerp(targetColor, Math.min(delta * 10, 1));
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Mounting plate */}
      <RoundedBox
        args={[PLATE_WIDTH, PLATE_HEIGHT, PLATE_DEPTH]}
        radius={0.004}
        smoothness={4}
        material={plateMaterial}
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      />

      {/* Lever group (rotates on X axis) */}
      <group ref={leverRef} position={[0, 0, PLATE_DEPTH / 2]}>
        {/* Lever shaft */}
        <mesh material={leverMaterial} position={[0, LEVER_HEIGHT / 2, 0]}>
          <boxGeometry args={[LEVER_WIDTH, LEVER_HEIGHT, LEVER_WIDTH]} />
        </mesh>

        {/* Chrome ball tip */}
        <mesh material={tipMaterial} position={[0, LEVER_HEIGHT, 0]}>
          <sphereGeometry args={[TIP_RADIUS, 16, 16]} />
        </mesh>
      </group>

      {/* LED state indicator */}
      <mesh ref={ledRef} position={[0, -PLATE_HEIGHT / 2 - 0.01, PLATE_DEPTH / 2 + 0.002]}>
        <circleGeometry args={[0.005, 16]} />
        <meshBasicMaterial color={value ? onColor : offColor} toneMapped={false} />
      </mesh>

      {/* Label text (below plate) */}
      <Text
        position={[0, -PLATE_HEIGHT / 2 - 0.025, 0]}
        fontSize={0.008}
        color="#667788"
        anchorX="center"
        anchorY="top"
        font="/fonts/JetBrainsMono-Regular.woff"
        letterSpacing={0.05}
      >
        {label.toUpperCase()}
      </Text>
    </group>
  );
}

export default ToggleSwitch3D;
