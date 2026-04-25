'use client';

// ════════════════════════════════════════════════════════════════
// CockpitPreview3D — Marketing 3D Cockpit Teaser (Phase 7)
// ════════════════════════════════════════════════════════════════
// A simplified, non-interactive 3D cockpit scene embedded in the
// marketing landing page (Act 4: StationPreview). Gives visitors
// a visual taste of the full cockpit experience before signup.
//
// Per Master Spec §3 (Stays HTML): "Marketing hero section: 3D
// cockpit preview (Canvas) embedded in HTML page"
//
// Renders a miniature cockpit with:
// - Curved hull panels (simplified CockpitPanels geometry)
// - LED rim glow strip
// - Peripheral HUD arcs
// - Rotating holographic lab map nodes
// - Gentle camera drift
// All at LOW triangle count (~50K) for fast marketing page load.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS — Frost-Prismatic palette
// ═══════════════════════════════════════════════════════════════

const CHROME = '#a8b5c8';
const CARBON = '#0A0F1F';
const LED_BLUE = '#00BBFF';
const LED_PURPLE = '#AA66FF';
const _LED_GREEN = '#00FF88';
const _ACCENT_ORANGE = '#FFAA44';

// Lab colors for the mini holographic nodes
const MINI_LAB_COLORS = [
  '#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88',
  '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
];

// ═══════════════════════════════════════════════════════════════
// MINI HULL — Simplified curved cockpit panel
// ═══════════════════════════════════════════════════════════════

function MiniHull() {
  const _hullRef = useRef<Mesh>(null);

  return (
    <group>
      {/* Main curved hull (simplified — cylinder section) */}
      <mesh rotation={[0, 0, 0]} position={[0, -0.15, -0.8]}>
        <cylinderGeometry args={[2.0, 2.2, 0.6, 32, 1, true, -Math.PI * 0.6, Math.PI * 1.2]} />
        <meshStandardMaterial
          color={new Color(CARBON)}
          metalness={0.85}
          roughness={0.35}
          side={DoubleSide}
        />
      </mesh>

      {/* Chrome edge trim (top arc) */}
      <mesh rotation={[0, 0, 0]} position={[0, 0.16, -0.8]}>
        <torusGeometry args={[2.0, 0.015, 8, 32, Math.PI * 1.2]} />
        <meshStandardMaterial
          color={new Color(CHROME)}
          metalness={0.95}
          roughness={0.1}
          emissive={new Color(LED_BLUE)}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Floor grating hint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, -0.3]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshStandardMaterial
          color={new Color('#080C14')}
          metalness={0.6}
          roughness={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// LED RIM — Glowing strip along hull edge
// ═══════════════════════════════════════════════════════════════

function MiniLEDRim() {
  const rimRef = useRef<Mesh>(null);
  const matRef = useRef<MeshBasicMaterial>(null);

  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      // Gentle pulse
      matRef.current.opacity = 0.6 + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <mesh ref={rimRef} rotation={[0, 0, 0]} position={[0, -0.14, -0.8]}>
      <torusGeometry args={[2.1, 0.02, 4, 48, Math.PI * 1.2]} />
      <meshBasicMaterial
        ref={matRef}
        color={new Color(LED_BLUE)}
        transparent
        opacity={0.6}
        toneMapped={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════
// HUD ARCS — Peripheral frame segments
// ═══════════════════════════════════════════════════════════════

function MiniHUDArcs() {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Slow breathing pulse via scale
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.05, -1.2]}>
      {/* Top arc */}
      <mesh rotation={[0, 0, Math.PI * 0.5]}>
        <torusGeometry args={[0.9, 0.008, 4, 16, Math.PI * 0.4]} />
        <meshBasicMaterial color={new Color(LED_BLUE)} transparent opacity={0.3} toneMapped={false} />
      </mesh>
      {/* Bottom arc */}
      <mesh rotation={[0, 0, -Math.PI * 0.5]} position={[0, -0.5, 0]}>
        <torusGeometry args={[0.9, 0.008, 4, 16, Math.PI * 0.4]} />
        <meshBasicMaterial color={new Color(LED_BLUE)} transparent opacity={0.2} toneMapped={false} />
      </mesh>
      {/* Left arc */}
      <mesh rotation={[0, 0, Math.PI]} position={[-0.85, -0.2, 0]}>
        <torusGeometry args={[0.5, 0.006, 4, 12, Math.PI * 0.3]} />
        <meshBasicMaterial color={new Color(LED_PURPLE)} transparent opacity={0.2} toneMapped={false} />
      </mesh>
      {/* Right arc */}
      <mesh position={[0.85, -0.2, 0]}>
        <torusGeometry args={[0.5, 0.006, 4, 12, Math.PI * 0.3]} />
        <meshBasicMaterial color={new Color(LED_PURPLE)} transparent opacity={0.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAB MAP NODES — Rotating holographic spheres
// ═══════════════════════════════════════════════════════════════

function MiniLabMap() {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -1.0]}>
      {MINI_LAB_COLORS.map((color, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const r = 0.45;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r * 0.4 - 0.2;
        const y = Math.sin(angle * 2) * 0.05;

        return (
          <Float key={i} speed={1.2 + i * 0.1} rotationIntensity={0.1} floatIntensity={0.08}>
            <mesh position={[x, y, z]}>
              <icosahedronGeometry args={[0.035, 1]} />
              <meshStandardMaterial
                color={new Color(color)}
                emissive={new Color(color)}
                emissiveIntensity={0.6}
                metalness={0.3}
                roughness={0.4}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Tiny connection line to center */}
            <mesh position={[x * 0.5, y * 0.5, z * 0.5]}>
              <boxGeometry args={[Math.sqrt(x * x + z * z) * 0.8, 0.002, 0.002]} />
              <meshBasicMaterial color={new Color(color)} transparent opacity={0.15} />
            </mesh>
          </Float>
        );
      })}
      {/* Center node */}
      <mesh>
        <icosahedronGeometry args={[0.05, 2]} />
        <meshStandardMaterial
          color={new Color(LED_BLUE)}
          emissive={new Color(LED_BLUE)}
          emissiveIntensity={0.8}
          metalness={0.5}
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CockpitPreview3D() {
  const sceneRef = useRef<Group>(null);

  // Gentle camera drift via scene rotation
  useFrame((state) => {
    if (sceneRef.current) {
      const t = state.clock.elapsedTime;
      sceneRef.current.rotation.y = Math.sin(t * 0.2) * 0.05;
      sceneRef.current.rotation.x = Math.sin(t * 0.15) * 0.02;
    }
  });

  return (
    <group ref={sceneRef}>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[2, 3, 4]} intensity={0.4} color="#E0E8F0" />
      <pointLight position={[0, 0.5, -0.5]} color={LED_BLUE} intensity={0.8} distance={4} decay={2} />
      <pointLight position={[-1.5, 0, -0.5]} color={LED_PURPLE} intensity={0.3} distance={3} decay={2} />

      {/* Cockpit elements */}
      <MiniHull />
      <MiniLEDRim />
      <MiniHUDArcs />
      <MiniLabMap />

      {/* "SparkForge" text floating above */}
      <Text
        position={[0, 0.5, -1.0]}
        fontSize={0.08}
        color="#F0F0F4"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Exo2-Bold.woff2"
        fillOpacity={0.6}
      >
        COMMAND BRIDGE
      </Text>

      {/* Ambient fog plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -0.5]}>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial
          color={new Color(LED_BLUE)}
          transparent
          opacity={0.03}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
