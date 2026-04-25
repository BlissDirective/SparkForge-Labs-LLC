'use client';

// ════════════════════════════════════════════════════════════════
// ExplorerGameTemplate — Scene Exploration / Card Layout (Phase 6)
// ════════════════════════════════════════════════════════════════
// Covers ~6 games: Data Detective, Camera Quest, Career Explorer,
// Pixel Investigator, Time Machine, Data Shield
//
// Layout: Scene/image display (top) + info cards (center) + action bar (bottom)
// The scene area shows visual content (images, scenes, data).
// Info cards show clues/details. Action bar has navigation + submit.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import {
  Color,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import { HolographicButton } from '../ui/HolographicButton';
import {
  CHROME_BORDER,
  HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  NUMERIC_FONT,
  EMISSIVE_SCALE,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface InfoCard {
  id: string;
  title: string;
  description: string;
  color?: string;
  active?: boolean;
}

export interface ExplorerGameTemplateProps {
  /** Lab accent color */
  color: string;
  /** Scene/visual area content (HTML — images, canvases, etc.) */
  sceneContent: React.ReactNode;
  /** Scene area label */
  sceneLabel?: string;
  /** Info cards displayed below scene */
  infoCards?: InfoCard[];
  /** Handler when an info card is clicked */
  onCardClick?: (cardId: string) => void;
  /** Action buttons at bottom */
  actions?: Array<{ id: string; label: string; color?: string; disabled?: boolean; onClick: () => void }>;
  /** Progress text (e.g., "Scene 3/8") */
  progressText?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PANEL_WIDTH = 1.7;
const PANEL_HEIGHT = 1.3;
const PANEL_DEPTH = 0.005;
const PANEL_Z = -2.8;
const SCENE_HEIGHT = 0.55;
const CARD_WIDTH = 0.35;
const CARD_HEIGHT = 0.1;
const CARD_GAP = 0.04;
const CARBON_BG = '#0A0F1F';

// ═══════════════════════════════════════════════════════════════
// INFO CARD 3D
// ═══════════════════════════════════════════════════════════════

function InfoCard3D({
  card, position, color, onClick,
}: {
  card: InfoCard; position: [number, number, number];
  color: string; onClick?: () => void;
}) {
  const cardColor = card.color || color;
  const accentC = useMemo(() => new Color(cardColor), [cardColor]);
  const [hovered, setHovered] = React.useState(false);

  return (
    <group position={position}>
      <mesh
        onClick={onClick}
        onPointerOver={() => { if (onClick) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, 0.004]} />
        <meshStandardMaterial
          color={new Color(CARBON_BG)}
          emissive={accentC}
          emissiveIntensity={card.active ? EMISSIVE_SCALE.medium : hovered ? 0.15 : 0.05}
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Chrome top accent */}
      <mesh position={[0, CARD_HEIGHT / 2 - 0.001, 0.003]}>
        <boxGeometry args={[CARD_WIDTH, 0.002, 0.002]} />
        <meshStandardMaterial
          color={new Color(CHROME_BORDER.colorHex)}
          emissive={accentC}
          emissiveIntensity={card.active ? 0.4 : 0.15}
          metalness={0.95} roughness={0.1}
        />
      </mesh>
      {/* Title */}
      <Text
        position={[0, 0.02, 0.004]}
        fontSize={TYPE_SCALE.label.fontSize}
        color={card.active ? cardColor : TEXT_COLORS.primary.hex}
        anchorX="center" anchorY="middle"
        font={TYPE_SCALE.label.fontPath}
        maxWidth={CARD_WIDTH - 0.03}
      >{card.title}</Text>
      {/* Description */}
      <Text
        position={[0, -0.02, 0.004]}
        fontSize={TYPE_SCALE.caption.fontSize * 0.8}
        color={TEXT_COLORS.muted.hex}
        anchorX="center" anchorY="middle"
        font={TYPE_SCALE.caption.fontPath}
        fillOpacity={TEXT_COLORS.muted.opacity}
        maxWidth={CARD_WIDTH - 0.03}
      >{card.description}</Text>
    </group>
  );
}

// Need React for useState in InfoCard3D
import React from 'react';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ExplorerGameTemplate({
  color,
  sceneContent,
  sceneLabel = 'INVESTIGATE',
  infoCards = [],
  onCardClick,
  actions = [],
  progressText,
}: ExplorerGameTemplateProps) {
  const glowRef = useRef<Mesh>(null);
  const accentColor = useMemo(() => new Color(color), [color]);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CARBON_BG), metalness: 0.85, roughness: 0.35, transparent: true, opacity: 0.85,
  }), []);
  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor, metalness: 0.95, roughness: 0.1,
    emissive: accentColor, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [chromeColor, accentColor]);
  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: accentColor, transparent: true, opacity: 0.04,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [accentColor]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.04 + pulse * 0.015;
    }
  });

  const cardCols = Math.min(infoCards.length, 4);
  const _cardRows = Math.ceil(infoCards.length / cardCols);

  return (
    <group name="explorer-game-template" position={[0, 0, PANEL_Z]}>
      <mesh ref={glowRef} position={[0, 0, -0.002]}>
        <planeGeometry args={[PANEL_WIDTH + 0.04, PANEL_HEIGHT + 0.04]} />
        <primitive object={glowMat} />
      </mesh>
      <mesh><boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} /><primitive object={panelMat} /></mesh>
      <mesh position={[0, PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.002, 0.002]} />
      </mesh>
      <mesh position={[0, -PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.002, 0.002]} />
      </mesh>

      <group position={[0, 0, PANEL_DEPTH / 2 + 0.002]}>
        {/* Scene label + progress */}
        <group position={[0, PANEL_HEIGHT / 2 - 0.03, 0]}>
          <Text
            position={[-PANEL_WIDTH / 2 + 0.05, 0, 0]}
            fontSize={TYPE_SCALE.caption.fontSize * 0.75}
            color={color} anchorX="left" anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
          >{sceneLabel}</Text>
          {progressText && (
            <Text
              position={[PANEL_WIDTH / 2 - 0.05, 0, 0]}
              fontSize={TYPE_SCALE.caption.fontSize * 0.75}
              color={TEXT_COLORS.muted.hex} anchorX="right" anchorY="middle"
              font={NUMERIC_FONT} fillOpacity={TEXT_COLORS.muted.opacity}
            >{progressText}</Text>
          )}
        </group>

        {/* Scene area (HTML content) */}
        <group position={[0, PANEL_HEIGHT / 2 - 0.06 - SCENE_HEIGHT / 2, 0]}>
          <mesh>
            <boxGeometry args={[PANEL_WIDTH - 0.08, SCENE_HEIGHT, 0.003]} />
            <meshStandardMaterial
              color={new Color('#060A12')}
              emissive={accentColor}
              emissiveIntensity={0.02}
              metalness={0.3} roughness={0.6}
            />
          </mesh>
          <Html position={[0, 0, 0.01]} center
            style={{ width: `${(PANEL_WIDTH - 0.08) * 280}px`, maxHeight: `${SCENE_HEIGHT * 280}px`, overflow: 'hidden' }}
          >{sceneContent}</Html>
        </group>

        {/* Info cards */}
        {infoCards.length > 0 && (
          <group position={[0, -0.15, 0]}>
            {infoCards.map((card, i) => {
              const col = i % cardCols;
              const row = Math.floor(i / cardCols);
              const x = (col - (cardCols - 1) / 2) * (CARD_WIDTH + CARD_GAP);
              const y = -row * (CARD_HEIGHT + CARD_GAP);
              return (
                <InfoCard3D
                  key={card.id}
                  card={card}
                  position={[x, y, 0]}
                  color={color}
                  onClick={onCardClick ? () => onCardClick(card.id) : undefined}
                />
              );
            })}
          </group>
        )}

        {/* Action buttons */}
        {actions.length > 0 && (
          <group position={[0, -PANEL_HEIGHT / 2 + 0.06, 0]}>
            {actions.map((action, i) => {
              const x = (i - (actions.length - 1) / 2) * 0.25;
              return (
                <HolographicButton
                  key={action.id}
                  id={action.id}
                  label={action.label}
                  color={action.color || color}
                  position={[x, 0, 0]}
                  size="sm"
                  disabled={action.disabled}
                  onClick={action.onClick}
                />
              );
            })}
          </group>
        )}
      </group>
    </group>
  );
}

export default ExplorerGameTemplate;
