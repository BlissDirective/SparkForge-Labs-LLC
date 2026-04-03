'use client';

// ════════════════════════════════════════════════════════════════
// QuizGameTemplate — Shared Quiz/Selection Layout (Phase 6)
// ════════════════════════════════════════════════════════════════
// Covers ~12 games: AI Spy, Word Predictor, AI or Not, Real or Fake,
// Human vs Machine, Emoji Decoder, Sentiment Scanner, Lost in Translation,
// Treat Trainer, Tool Picker, Fool the AI, Ethics Courtroom
//
// Layout: Prompt/question area (top) + choice grid (center) + feedback (bottom)
// Uses ChoiceButton3D for answers, drei <Html> for rich question content.
// Phase management: welcome → play → complete (learn phase optional via prop).

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
import { ChoiceButton3D, type ChoiceFeedback } from './ChoiceButton3D';
import {
  CHROME_BORDER,
  HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  EMISSIVE_IDLE_INDICATOR,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface QuizChoice {
  id: string;
  label: string;
  subtitle?: string;
}

export interface QuizGameTemplateProps {
  /** Lab accent color */
  color: string;
  /** Current question/prompt text */
  question: string;
  /** Optional question subtitle */
  questionSubtitle?: string;
  /** Available choices */
  choices: QuizChoice[];
  /** Feedback state per choice id */
  feedback?: Record<string, ChoiceFeedback>;
  /** Selected choice id */
  selectedId?: string | null;
  /** Handler when a choice is selected */
  onSelect: (choiceId: string) => void;
  /** Optional explanation text shown after selection */
  explanation?: string;
  /** Rich HTML content for the question area (images, emojis, etc.) */
  questionHtml?: React.ReactNode;
  /** Number of columns for choice layout (default: auto) */
  columns?: 1 | 2 | 3 | 4;
  /** Whether choices are disabled (e.g., after answer) */
  disabled?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PANEL_WIDTH = 1.6;
const PANEL_HEIGHT = 1.2;
const PANEL_DEPTH = 0.005;
const PANEL_Z = -2.8;
const CHOICE_WIDTH = 0.6;
const CHOICE_HEIGHT = 0.065;
const CHOICE_GAP = 0.08;
const CARBON_BG = '#0A0F1F';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function QuizGameTemplate({
  color,
  question,
  questionSubtitle,
  choices,
  feedback = {},
  selectedId,
  onSelect,
  explanation,
  questionHtml,
  columns,
  disabled = false,
}: QuizGameTemplateProps) {
  const glowRef = useRef<Mesh>(null);
  const accentColor = useMemo(() => new Color(color), [color]);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CARBON_BG), metalness: 0.85, roughness: 0.35,
    transparent: true, opacity: 0.85,
  }), []);
  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor, metalness: 0.95, roughness: 0.1,
    emissive: accentColor, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [chromeColor, accentColor]);
  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: accentColor, transparent: true, opacity: 0.05,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [accentColor]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.05 + pulse * 0.02;
    }
  });

  // Auto-calculate columns
  const cols = columns ?? (choices.length <= 2 ? 1 : choices.length <= 4 ? 2 : 3);
  const choiceW = cols === 1 ? CHOICE_WIDTH * 2 : cols === 2 ? CHOICE_WIDTH * 1.1 : CHOICE_WIDTH * 0.75;
  const rows = Math.ceil(choices.length / cols);

  return (
    <group name="quiz-game-template" position={[0, 0, PANEL_Z]}>
      {/* Panel glow */}
      <mesh ref={glowRef} position={[0, 0, -0.002]}>
        <planeGeometry args={[PANEL_WIDTH + 0.04, PANEL_HEIGHT + 0.04]} />
        <primitive object={glowMat} />
      </mesh>

      {/* Panel background */}
      <mesh>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
        <primitive object={panelMat} />
      </mesh>

      {/* Chrome top/bottom bars */}
      <mesh position={[0, PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.002, 0.002]} />
      </mesh>
      <mesh position={[0, -PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.002, 0.002]} />
      </mesh>

      {/* Content */}
      <group position={[0, 0, PANEL_DEPTH / 2 + 0.002]}>
        {/* ═══ Question area (top) ═══ */}
        <group position={[0, PANEL_HEIGHT / 2 - 0.15, 0]}>
          <Text
            fontSize={TYPE_SCALE.h3.fontSize}
            color={TEXT_COLORS.primary.hex}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.h3.fontPath}
            maxWidth={PANEL_WIDTH * 0.85}
            textAlign="center"
          >
            {question}
          </Text>

          {questionSubtitle && (
            <Text
              position={[0, -0.05, 0]}
              fontSize={TYPE_SCALE.caption.fontSize}
              color={TEXT_COLORS.muted.hex}
              anchorX="center"
              anchorY="middle"
              font={TYPE_SCALE.caption.fontPath}
              fillOpacity={TEXT_COLORS.muted.opacity}
              maxWidth={PANEL_WIDTH * 0.8}
              textAlign="center"
            >
              {questionSubtitle}
            </Text>
          )}

          {/* Rich HTML content (images, emojis, etc.) */}
          {questionHtml && (
            <Html
              position={[0, -0.08, 0.01]}
              center
              style={{
                width: '360px',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <div style={{ textAlign: 'center', color: '#F0F0F4' }}>
                {questionHtml}
              </div>
            </Html>
          )}
        </group>

        {/* ═══ Choice grid (center) ═══ */}
        <group position={[0, -0.05, 0]}>
          {choices.map((choice, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = (col - (cols - 1) / 2) * (choiceW + 0.03);
            const y = -(row) * CHOICE_GAP;
            const fb = feedback[choice.id] || 'none';

            return (
              <ChoiceButton3D
                key={choice.id}
                label={choice.label}
                subtitle={choice.subtitle}
                position={[x, y, 0]}
                width={choiceW}
                height={CHOICE_HEIGHT}
                color={color}
                feedback={fb}
                disabled={disabled}
                onClick={() => onSelect(choice.id)}
              />
            );
          })}
        </group>

        {/* ═══ Explanation area (bottom) ═══ */}
        {explanation && (
          <group position={[0, -PANEL_HEIGHT / 2 + 0.1, 0]}>
            <mesh>
              <boxGeometry args={[PANEL_WIDTH * 0.85, 0.06, 0.002]} />
              <meshStandardMaterial
                color={new Color(color)}
                emissive={new Color(color)}
                emissiveIntensity={0.1}
                transparent
                opacity={0.08}
              />
            </mesh>
            <Text
              fontSize={TYPE_SCALE.caption.fontSize}
              color={TEXT_COLORS.secondary.hex}
              anchorX="center"
              anchorY="middle"
              font={TYPE_SCALE.caption.fontPath}
              fillOpacity={TEXT_COLORS.secondary.opacity}
              maxWidth={PANEL_WIDTH * 0.8}
              textAlign="center"
            >
              {explanation}
            </Text>
          </group>
        )}
      </group>
    </group>
  );
}

export default QuizGameTemplate;
