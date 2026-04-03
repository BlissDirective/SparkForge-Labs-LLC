'use client';

// ═══════════════════��══════════════════════���═════════════════════
// GamePhaseOverlay3D — Welcome & Complete Screens (Phase 5)
// ═════════════���═════════��════════════════════════════════════════
// Renders cockpit-style chrome panels for the welcome (start) and
// complete (results) phases of all games. Game-specific learning
// and play content stays as HTML via drei <Html>.
//
// Welcome panel: Game title, description, "START" button
// Complete panel: Score summary, tier badge, "CONTINUE" button
//
// Per JSON spec UI-8: 75% viewport takeover during game mode.
// These panels render centered in the game viewport area.

import { useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import {
  CHROME_BORDER,
  HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  NUMERIC_FONT,
  EMISSIVE_IDLE_BUTTON,
  EMISSIVE_HOVER_MULTIPLIER,
  EMISSIVE_SCALE,
  SPRING_PRESETS,
  PRESS_DEPTH,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════���═══════════════════════════��══════════

const PANEL_WIDTH = 1.2;
const PANEL_HEIGHT = 1.0;
const PANEL_DEPTH = 0.006;
const PANEL_Z = -2.6;
const BUTTON_WIDTH = 0.5;
const BUTTON_HEIGHT = 0.08;
const BUTTON_DEPTH = 0.008;
const CARBON_BG = '#0A0F1F';

// Tier colors & labels
const TIER_CONFIG: Record<string, { color: string; label: string; stars: number }> = {
  gold:   { color: '#FFD700', label: 'GOLD', stars: 3 },
  silver: { color: '#C0C0C0', label: 'SILVER', stars: 2 },
  bronze: { color: '#CD7F32', label: 'BRONZE', stars: 1 },
};

// ═══════════════════════════���═══════════════════════════════════
// 3D BUTTON (local — same pattern as auth panels)
// ═════════════════���═════════════════════════════════════════════

function Button3D({
  label, color, position, onClick, width = BUTTON_WIDTH,
}: {
  label: string; color: string; position: [number, number, number];
  onClick: () => void; width?: number;
}) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const depthRef = useRef(0);
  const velRef = useRef(0);
  const accentC = useMemo(() => new Color(color), [color]);

  const baseMat = useMemo(() => new MeshStandardMaterial({
    color: accentC, emissive: accentC, emissiveIntensity: EMISSIVE_IDLE_BUTTON,
    metalness: 0.7, roughness: 0.3,
  }), [accentC]);

  const borderMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CHROME_BORDER.colorHex), metalness: 0.95, roughness: 0.1,
    emissive: accentC, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [accentC]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = pressed ? PRESS_DEPTH : 0;
    const spring = SPRING_PRESETS.snap;
    velRef.current += ((spring.stiffness * (target - depthRef.current) - spring.damping * velRef.current) / spring.mass) * delta;
    depthRef.current += velRef.current * delta;
    groupRef.current.position.z = position[2] - depthRef.current;
    baseMat.emissiveIntensity = hovered ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER : EMISSIVE_IDLE_BUTTON;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh><boxGeometry args={[width + 0.006, BUTTON_HEIGHT + 0.006, BUTTON_DEPTH]} /><primitive object={borderMat} /></mesh>
      <mesh position={[0, 0, 0.001]}
        onClick={() => { setPressed(true); onClick(); setTimeout(() => setPressed(false), 200); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[width, BUTTON_HEIGHT, BUTTON_DEPTH - 0.002]} /><primitive object={baseMat} />
      </mesh>
      <Text position={[0, 0, BUTTON_DEPTH / 2 + 0.002]} fontSize={TYPE_SCALE.label.fontSize}
        color="#ffffff" anchorX="center" anchorY="middle" font={TYPE_SCALE.label.fontPath}
      >{label}</Text>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// WELCOME PANEL
// ═══════════════════════════════════════════════��═══════════════

interface WelcomePanelProps {
  title: string;
  description?: string;
  color: string;
  totalRounds: number;
  onStart: () => void;
}

export function GameWelcomePanel3D({
  title,
  description = 'Complete all rounds to earn XP!',
  color,
  totalRounds,
  onStart,
}: WelcomePanelProps) {
  const glowRef = useRef<Mesh>(null);
  const accentColor = useMemo(() => new Color(color), [color]);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CARBON_BG), metalness: 0.85, roughness: 0.35, transparent: true, opacity: 0.92,
  }), []);
  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor, metalness: 0.95, roughness: 0.1,
    emissive: accentColor, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [chromeColor, accentColor]);
  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: accentColor, transparent: true, opacity: 0.08,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [accentColor]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.08 + pulse * 0.04;
    }
  });

  return (
    <group name="game-welcome" position={[0, 0, PANEL_Z]}>
      <mesh ref={glowRef} position={[0, 0, -0.003]}>
        <planeGeometry args={[PANEL_WIDTH + 0.06, PANEL_HEIGHT + 0.06]} />
        <primitive object={glowMat} />
      </mesh>
      <mesh><boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} /><primitive object={panelMat} /></mesh>

      {/* Chrome frame */}
      {[
        [0, PANEL_HEIGHT / 2, [PANEL_WIDTH, 0.003, 0.003]],
        [0, -PANEL_HEIGHT / 2, [PANEL_WIDTH, 0.003, 0.003]],
        [-PANEL_WIDTH / 2, 0, [0.003, PANEL_HEIGHT, 0.003]],
        [PANEL_WIDTH / 2, 0, [0.003, PANEL_HEIGHT, 0.003]],
      ].map(([x, y, size], i) => (
        <mesh key={i} position={[x as number, y as number, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
          <boxGeometry args={size as [number, number, number]} />
        </mesh>
      ))}

      <group position={[0, 0, PANEL_DEPTH / 2 + 0.002]}>
        {/* Title */}
        <Text position={[0, 0.28, 0]} fontSize={TYPE_SCALE.h1.fontSize}
          color={color} anchorX="center" anchorY="middle" font={TYPE_SCALE.h1.fontPath}
        >{title}</Text>

        {/* Divider */}
        <mesh position={[0, 0.2, 0]} material={chromeMat}>
          <boxGeometry args={[PANEL_WIDTH * 0.6, 0.002, 0.002]} />
        </mesh>

        {/* Description */}
        <Text position={[0, 0.1, 0]} fontSize={TYPE_SCALE.body.fontSize}
          color={TEXT_COLORS.secondary.hex} anchorX="center" anchorY="middle"
          font={TYPE_SCALE.body.fontPath} fillOpacity={TEXT_COLORS.secondary.opacity}
          maxWidth={PANEL_WIDTH * 0.7} textAlign="center"
        >{description}</Text>

        {/* Round count */}
        <Text position={[0, -0.02, 0]} fontSize={TYPE_SCALE.label.fontSize}
          color={TEXT_COLORS.muted.hex} anchorX="center" anchorY="middle"
          font={TYPE_SCALE.label.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
        >{`${totalRounds} ROUNDS`}</Text>

        {/* Start button */}
        <Button3D label="START" color={color} position={[0, -0.2, 0]} onClick={onStart} />
      </group>
    </group>
  );
}

// ══��════════════════���═══════════════════════════════════════════
// COMPLETE PANEL
// ═════════════════════���═════════════════════════════════════════

interface CompletePanelProps {
  title: string;
  score: number;
  maxScore: number;
  color: string;
  /** 'gold' | 'silver' | 'bronze' */
  tier?: string;
  xpAwarded?: number;
  onContinue: () => void;
}

export function GameCompletePanel3D({
  title,
  score,
  maxScore,
  color: _color,
  tier = 'bronze',
  xpAwarded = 50,
  onContinue,
}: CompletePanelProps) {
  const glowRef = useRef<Mesh>(null);
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const tierColor = useMemo(() => new Color(tierConfig.color), [tierConfig.color]);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CARBON_BG), metalness: 0.85, roughness: 0.35, transparent: true, opacity: 0.92,
  }), []);
  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor, metalness: 0.95, roughness: 0.1,
    emissive: tierColor, emissiveIntensity: 0.3,
  }), [chromeColor, tierColor]);
  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: tierColor, transparent: true, opacity: 0.1,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [tierColor]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5;
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.08 + pulse * 0.05;
    }
  });

  const scorePercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <group name="game-complete" position={[0, 0, PANEL_Z]}>
      <mesh ref={glowRef} position={[0, 0, -0.003]}>
        <planeGeometry args={[PANEL_WIDTH + 0.06, PANEL_HEIGHT + 0.06]} />
        <primitive object={glowMat} />
      </mesh>
      <mesh><boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} /><primitive object={panelMat} /></mesh>

      {/* Chrome frame */}
      {[
        [0, PANEL_HEIGHT / 2, [PANEL_WIDTH, 0.003, 0.003]],
        [0, -PANEL_HEIGHT / 2, [PANEL_WIDTH, 0.003, 0.003]],
        [-PANEL_WIDTH / 2, 0, [0.003, PANEL_HEIGHT, 0.003]],
        [PANEL_WIDTH / 2, 0, [0.003, PANEL_HEIGHT, 0.003]],
      ].map(([x, y, size], i) => (
        <mesh key={i} position={[x as number, y as number, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
          <boxGeometry args={size as [number, number, number]} />
        </mesh>
      ))}

      <group position={[0, 0, PANEL_DEPTH / 2 + 0.002]}>
        {/* Title */}
        <Text position={[0, 0.34, 0]} fontSize={TYPE_SCALE.h2.fontSize}
          color={TEXT_COLORS.primary.hex} anchorX="center" anchorY="middle"
          font={TYPE_SCALE.h2.fontPath}
        >{title}</Text>

        {/* COMPLETE! */}
        <Text position={[0, 0.26, 0]} fontSize={TYPE_SCALE.h1.fontSize}
          color={tierConfig.color} anchorX="center" anchorY="middle"
          font={TYPE_SCALE.h1.fontPath}
        >COMPLETE!</Text>

        {/* Divider */}
        <mesh position={[0, 0.2, 0]} material={chromeMat}>
          <boxGeometry args={[PANEL_WIDTH * 0.6, 0.002, 0.002]} />
        </mesh>

        {/* Tier badge */}
        <group position={[0, 0.1, 0]}>
          <mesh>
            <circleGeometry args={[0.06, 6]} />
            <meshStandardMaterial
              color={tierColor}
              emissive={tierColor}
              emissiveIntensity={EMISSIVE_SCALE.bright}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Stars */}
          {Array.from({ length: tierConfig.stars }, (_, i) => (
            <Text key={i}
              position={[(i - (tierConfig.stars - 1) / 2) * 0.025, 0, 0.005]}
              fontSize={0.02} color="#ffffff" anchorX="center" anchorY="middle"
              font={TYPE_SCALE.body.fontPath}
            >{'★'}</Text>
          ))}
        </group>
        <Text position={[0, 0.02, 0]} fontSize={TYPE_SCALE.label.fontSize}
          color={tierConfig.color} anchorX="center" anchorY="middle"
          font={TYPE_SCALE.label.fontPath}
        >{tierConfig.label}</Text>

        {/* Score */}
        <group position={[0, -0.06, 0]}>
          <Text fontSize={0.04} color={TEXT_COLORS.primary.hex} anchorX="center" anchorY="middle"
            font={NUMERIC_FONT}
          >{`${score}`}</Text>
          <Text position={[0, -0.04, 0]} fontSize={TYPE_SCALE.caption.fontSize}
            color={TEXT_COLORS.muted.hex} anchorX="center" anchorY="middle"
            font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
          >{`${scorePercent}% · ${maxScore} max`}</Text>
        </group>

        {/* XP awarded */}
        <Text position={[0, -0.16, 0]} fontSize={TYPE_SCALE.label.fontSize}
          color="#FFD700" anchorX="center" anchorY="middle" font={NUMERIC_FONT}
        >{`+${xpAwarded} XP`}</Text>

        {/* Continue button */}
        <Button3D label="CONTINUE" color={tierConfig.color} position={[0, -0.3, 0]}
          onClick={onContinue} width={0.45} />

        {/* Glow light */}
        <pointLight color={tierConfig.color} intensity={2} distance={2} decay={2} />
      </group>
    </group>
  );
}
