'use client';

// ════════════════════════════════════════════════════════════════
// GameLearnCards3D — Educational Card Carousel (Phase 6)
// ════════════════════════════════════════════════════════════════
// Displays concept cards during the "learn" phase of games.
// Paginated (1 card at a time), prev/next navigation.
// Each card has title, body text, and optional visual content.
//
// Used across all game templates as the learn phase component.

import { useState, useMemo, useRef } from 'react';
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
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface LearnCard {
  title: string;
  body: string;
  /** Optional rich HTML content (images, diagrams) */
  visual?: React.ReactNode;
}

export interface GameLearnCards3DProps {
  /** Lab accent color */
  color: string;
  /** Array of learn cards */
  cards: LearnCard[];
  /** Called when user finishes all cards */
  onComplete: () => void;
  /** Section title above cards */
  sectionTitle?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CARD_WIDTH = 1.3;
const CARD_HEIGHT = 0.9;
const CARD_DEPTH = 0.005;
const CARD_Z = -2.8;
const CARBON_BG = '#0A0F1F';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function GameLearnCards3D({
  color,
  cards,
  onComplete,
  sectionTitle = 'LEARN',
}: GameLearnCards3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const glowRef = useRef<Mesh>(null);
  const accentColor = useMemo(() => new Color(color), [color]);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CARBON_BG), metalness: 0.85, roughness: 0.35, transparent: true, opacity: 0.9,
  }), []);
  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor, metalness: 0.95, roughness: 0.1,
    emissive: accentColor, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [chromeColor, accentColor]);
  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: accentColor, transparent: true, opacity: 0.06,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [accentColor]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.06 + pulse * 0.02;
    }
  });

  const card = cards[currentIndex];
  const isLast = currentIndex >= cards.length - 1;
  const isFirst = currentIndex === 0;

  if (!card) return null;

  return (
    <group name="game-learn-cards" position={[0, 0, CARD_Z]}>
      <mesh ref={glowRef} position={[0, 0, -0.003]}>
        <planeGeometry args={[CARD_WIDTH + 0.04, CARD_HEIGHT + 0.04]} />
        <primitive object={glowMat} />
      </mesh>
      <mesh><boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} /><primitive object={panelMat} /></mesh>

      {/* Chrome frame */}
      <mesh position={[0, CARD_HEIGHT / 2, CARD_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[CARD_WIDTH, 0.003, 0.003]} />
      </mesh>
      <mesh position={[0, -CARD_HEIGHT / 2, CARD_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[CARD_WIDTH, 0.003, 0.003]} />
      </mesh>

      <group position={[0, 0, CARD_DEPTH / 2 + 0.002]}>
        {/* Header: section title + card counter */}
        <group position={[0, CARD_HEIGHT / 2 - 0.04, 0]}>
          <Text
            position={[-CARD_WIDTH / 2 + 0.04, 0, 0]}
            fontSize={TYPE_SCALE.caption.fontSize * 0.75}
            color={color} anchorX="left" anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
          >{sectionTitle}</Text>
          <Text
            position={[CARD_WIDTH / 2 - 0.04, 0, 0]}
            fontSize={TYPE_SCALE.caption.fontSize * 0.75}
            color={TEXT_COLORS.muted.hex} anchorX="right" anchorY="middle"
            font={NUMERIC_FONT} fillOpacity={TEXT_COLORS.muted.opacity}
          >{`${currentIndex + 1} / ${cards.length}`}</Text>
        </group>

        {/* Divider */}
        <mesh position={[0, CARD_HEIGHT / 2 - 0.06, 0]} material={chromeMat}>
          <boxGeometry args={[CARD_WIDTH * 0.85, 0.001, 0.001]} />
        </mesh>

        {/* Card title */}
        <Text
          position={[0, CARD_HEIGHT / 2 - 0.12, 0]}
          fontSize={TYPE_SCALE.h3.fontSize}
          color={TEXT_COLORS.primary.hex}
          anchorX="center" anchorY="middle"
          font={TYPE_SCALE.h3.fontPath}
          maxWidth={CARD_WIDTH * 0.85}
          textAlign="center"
        >{card.title}</Text>

        {/* Card body text */}
        <Text
          position={[0, 0.05, 0]}
          fontSize={TYPE_SCALE.body.fontSize}
          color={TEXT_COLORS.secondary.hex}
          anchorX="center" anchorY="middle"
          font={TYPE_SCALE.body.fontPath}
          fillOpacity={TEXT_COLORS.secondary.opacity}
          maxWidth={CARD_WIDTH * 0.8}
          textAlign="center"
        >{card.body}</Text>

        {/* Optional visual content (HTML) */}
        {card.visual && (
          <Html position={[0, -0.1, 0.01]} center
            style={{ width: '320px', pointerEvents: 'none', textAlign: 'center' }}
          >{card.visual}</Html>
        )}

        {/* Progress dots */}
        <group position={[0, -CARD_HEIGHT / 2 + 0.12, 0]}>
          {cards.map((_, i) => (
            <mesh key={i} position={[(i - (cards.length - 1) / 2) * 0.025, 0, 0]}>
              <circleGeometry args={[0.005, 8]} />
              <meshStandardMaterial
                color={i === currentIndex ? new Color(color) : new Color('#333')}
                emissive={i === currentIndex ? new Color(color) : new Color('#111')}
                emissiveIntensity={i === currentIndex ? 0.5 : 0.02}
              />
            </mesh>
          ))}
        </group>

        {/* Navigation buttons */}
        <group position={[0, -CARD_HEIGHT / 2 + 0.05, 0]}>
          {!isFirst && (
            <HolographicButton
              id="learn-prev"
              label="BACK"
              color="#555555"
              position={[-0.2, 0, 0]}
              size="sm"
              onClick={() => setCurrentIndex(currentIndex - 1)}
            />
          )}
          <HolographicButton
            id={isLast ? 'learn-done' : 'learn-next'}
            label={isLast ? 'GOT IT!' : 'NEXT'}
            color={color}
            position={[isFirst ? 0 : 0.2, 0, 0]}
            size="sm"
            onClick={isLast ? onComplete : () => setCurrentIndex(currentIndex + 1)}
          />
        </group>
      </group>
    </group>
  );
}

export default GameLearnCards3D;
