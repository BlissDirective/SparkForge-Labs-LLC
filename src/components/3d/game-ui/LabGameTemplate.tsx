'use client';

// ════════════════════════════════════════════════════════════════
// LabGameTemplate — Experiment/Analysis Layout (Phase 6)
// ════════════════════════════════════════════════════════════════
// Covers ~6 games: Sentiment Scanner, Prediction Market, Robot Vacuum,
// My First AI App, Future Forge, Chatbot Builder
//
// Layout: Control panel (left) + experiment area (center) + results (right)
// Similar to BuilderGameTemplate but with a "run experiment" paradigm.
// Left panel has parameters/inputs, center shows the experiment running,
// right shows results/metrics.

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
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface MetricDisplay {
  label: string;
  value: string;
  color?: string;
}

export interface LabGameTemplateProps {
  /** Lab accent color */
  color: string;
  /** Controls/parameters panel content (HTML) */
  controlsContent: React.ReactNode;
  /** Experiment/simulation area content (HTML) */
  experimentContent: React.ReactNode;
  /** Result metrics to display */
  metrics?: MetricDisplay[];
  /** Results panel content (HTML — charts, graphs, etc.) */
  resultsContent?: React.ReactNode;
  /** "Run" button handler */
  onRun?: () => void;
  /** Whether experiment is currently running */
  isRunning?: boolean;
  /** Controls panel label */
  controlsLabel?: string;
  /** Experiment area label */
  experimentLabel?: string;
  /** Results panel label */
  resultsLabel?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PANEL_WIDTH = 1.8;
const PANEL_HEIGHT = 1.2;
const PANEL_DEPTH = 0.005;
const PANEL_Z = -2.8;
const CONTROLS_WIDTH = 0.38;
const RESULTS_WIDTH = 0.38;
const CARBON_BG = '#0A0F1F';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function LabGameTemplate({
  color,
  controlsContent,
  experimentContent,
  metrics = [],
  resultsContent,
  onRun,
  isRunning = false,
  controlsLabel = 'PARAMETERS',
  experimentLabel = 'EXPERIMENT',
  resultsLabel = 'RESULTS',
}: LabGameTemplateProps) {
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

  const hasResults = !!resultsContent || metrics.length > 0;
  const experimentWidth = PANEL_WIDTH - CONTROLS_WIDTH - (hasResults ? RESULTS_WIDTH : 0) - 0.12;
  const contentHeight = PANEL_HEIGHT - 0.12;

  const controlsX = -PANEL_WIDTH / 2 + CONTROLS_WIDTH / 2 + 0.03;
  const experimentX = hasResults ? 0 : (CONTROLS_WIDTH) / 2 + 0.02;
  const resultsX = PANEL_WIDTH / 2 - RESULTS_WIDTH / 2 - 0.03;

  return (
    <group name="lab-game-template" position={[0, 0, PANEL_Z]}>
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

      <group position={[0, 0.02, PANEL_DEPTH / 2 + 0.002]}>
        {/* ═══ Controls panel (left) ═══ */}
        <group position={[controlsX, 0, 0]}>
          <mesh>
            <boxGeometry args={[CONTROLS_WIDTH, contentHeight, 0.003]} />
            <meshStandardMaterial color={new Color(CARBON_BG)} emissive={accentColor}
              emissiveIntensity={0.02} metalness={0.85} roughness={0.35} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, contentHeight / 2 - 0.001, 0.002]}>
            <boxGeometry args={[CONTROLS_WIDTH, 0.002, 0.002]} />
            <primitive object={chromeMat} />
          </mesh>
          <Text position={[-CONTROLS_WIDTH / 2 + 0.02, contentHeight / 2 - 0.015, 0.003]}
            fontSize={TYPE_SCALE.caption.fontSize * 0.75} color={color} anchorX="left" anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
          >{controlsLabel}</Text>
          <Html position={[0, -0.02, 0.01]} center
            style={{ width: `${CONTROLS_WIDTH * 250}px`, maxHeight: `${(contentHeight - 0.06) * 250}px`, overflow: 'auto' }}
          >{controlsContent}</Html>

          {/* Run button at bottom of controls */}
          {onRun && (
            <HolographicButton
              id="lab-run"
              label={isRunning ? 'RUNNING...' : 'RUN'}
              color={isRunning ? '#FFAA44' : color}
              position={[0, -contentHeight / 2 + 0.04, 0.005]}
              size="sm"
              disabled={isRunning}
              onClick={onRun}
            />
          )}
        </group>

        {/* ═══ Experiment area (center) ═══ */}
        <group position={[experimentX, 0, 0]}>
          <mesh>
            <boxGeometry args={[experimentWidth, contentHeight, 0.003]} />
            <meshStandardMaterial color={new Color('#060A12')} emissive={accentColor}
              emissiveIntensity={isRunning ? 0.06 : 0.02} metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[0, contentHeight / 2 - 0.001, 0.002]}>
            <boxGeometry args={[experimentWidth, 0.002, 0.002]} />
            <primitive object={chromeMat} />
          </mesh>
          <Text position={[-experimentWidth / 2 + 0.02, contentHeight / 2 - 0.015, 0.003]}
            fontSize={TYPE_SCALE.caption.fontSize * 0.75} color={color} anchorX="left" anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
          >{experimentLabel}</Text>
          <Html position={[0, -0.02, 0.01]} center
            style={{ width: `${experimentWidth * 250}px`, maxHeight: `${(contentHeight - 0.04) * 250}px`, overflow: 'hidden' }}
          >{experimentContent}</Html>
        </group>

        {/* ═══ Results panel (right) ═══ */}
        {hasResults && (
          <group position={[resultsX, 0, 0]}>
            <mesh>
              <boxGeometry args={[RESULTS_WIDTH, contentHeight, 0.003]} />
              <meshStandardMaterial color={new Color(CARBON_BG)} emissive={accentColor}
                emissiveIntensity={0.02} metalness={0.85} roughness={0.35} transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, contentHeight / 2 - 0.001, 0.002]}>
              <boxGeometry args={[RESULTS_WIDTH, 0.002, 0.002]} />
              <primitive object={chromeMat} />
            </mesh>
            <Text position={[-RESULTS_WIDTH / 2 + 0.02, contentHeight / 2 - 0.015, 0.003]}
              fontSize={TYPE_SCALE.caption.fontSize * 0.75} color={color} anchorX="left" anchorY="middle"
              font={TYPE_SCALE.caption.fontPath}
            >{resultsLabel}</Text>

            {/* Metric displays */}
            {metrics.map((metric, i) => (
              <group key={i} position={[0, contentHeight / 2 - 0.06 - i * 0.06, 0.003]}>
                <Text
                  position={[-RESULTS_WIDTH / 2 + 0.03, 0.01, 0]}
                  fontSize={TYPE_SCALE.caption.fontSize * 0.7}
                  color={TEXT_COLORS.muted.hex} anchorX="left" anchorY="middle"
                  font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
                >{metric.label}</Text>
                <Text
                  position={[-RESULTS_WIDTH / 2 + 0.03, -0.01, 0]}
                  fontSize={0.022}
                  color={metric.color || color} anchorX="left" anchorY="middle"
                  font={NUMERIC_FONT}
                >{metric.value}</Text>
              </group>
            ))}

            {/* Custom results HTML content */}
            {resultsContent && (
              <Html position={[0, metrics.length > 0 ? -0.08 - metrics.length * 0.03 : -0.02, 0.01]} center
                style={{ width: `${RESULTS_WIDTH * 250}px`, maxHeight: '150px', overflow: 'auto' }}
              >{resultsContent}</Html>
            )}
          </group>
        )}
      </group>
    </group>
  );
}

export default LabGameTemplate;
