'use client';

// ════════════════════════════════════════════════════════════════
// BuilderGameTemplate — Drag-Drop / Construction Layout (Phase 6)
// ════════════════════════════════════════════════════════════════
// Covers ~7 games: Code Blocks, Tool Picker, Build Classifier,
// Token Chopper, Agent Architect (lite), Neuron Relay, API Explorer
//
// Layout: Workspace area (center) + toolbox/palette (left) + output (right)
// Uses drei <Html> for the interactive workspace since drag-drop
// requires DOM events. 3D chrome frame wraps the workspace.

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
import {
  CHROME_BORDER,
  HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  EMISSIVE_IDLE_INDICATOR,
  NUMERIC_FONT,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface BuilderGameTemplateProps {
  /** Lab accent color */
  color: string;
  /** Section label for the workspace (e.g., "BUILD AREA", "PIPELINE") */
  workspaceLabel?: string;
  /** Section label for the toolbox/palette */
  toolboxLabel?: string;
  /** Section label for the output/result panel */
  outputLabel?: string;
  /** React node for the workspace (HTML drag-drop area) */
  workspaceContent: React.ReactNode;
  /** React node for the toolbox/palette (HTML draggable items) */
  toolboxContent?: React.ReactNode;
  /** React node for the output/result area */
  outputContent?: React.ReactNode;
  /** Status text shown at bottom (e.g., "3/5 blocks placed") */
  statusText?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PANEL_WIDTH = 1.8;
const PANEL_HEIGHT = 1.2;
const PANEL_DEPTH = 0.005;
const PANEL_Z = -2.8;
const SECTION_GAP = 0.02;
const TOOLBOX_WIDTH = 0.35;
const OUTPUT_WIDTH = 0.35;
const CARBON_BG = '#0A0F1F';

// ═══════════════════════════════════════════════════════════════
// SECTION FRAME — Chrome-bordered sub-panel
// ═══════════════════════════════════════════════════════════════

function SectionFrame({
  position, width, height, label, color, children,
}: {
  position: [number, number, number];
  width: number; height: number;
  label: string; color: string;
  children?: React.ReactNode;
}) {
  const accentC = useMemo(() => new Color(color), [color]);
  const chromeC = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  return (
    <group position={position}>
      {/* Background */}
      <mesh>
        <boxGeometry args={[width, height, 0.003]} />
        <meshStandardMaterial
          color={new Color(CARBON_BG)}
          emissive={accentC}
          emissiveIntensity={0.03}
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Top chrome bar with label */}
      <mesh position={[0, height / 2 - 0.001, 0.002]}>
        <boxGeometry args={[width, 0.002, 0.002]} />
        <meshStandardMaterial color={chromeC} metalness={0.95} roughness={0.1}
          emissive={accentC} emissiveIntensity={CHROME_BORDER.glowIntensity} />
      </mesh>
      <Text
        position={[-width / 2 + 0.02, height / 2 - 0.015, 0.003]}
        fontSize={TYPE_SCALE.caption.fontSize * 0.75}
        color={color}
        anchorX="left" anchorY="middle"
        font={TYPE_SCALE.caption.fontPath}
      >{label}</Text>
      {children}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function BuilderGameTemplate({
  color,
  workspaceLabel = 'WORKSPACE',
  toolboxLabel = 'TOOLBOX',
  outputLabel = 'OUTPUT',
  workspaceContent,
  toolboxContent,
  outputContent,
  statusText,
}: BuilderGameTemplateProps) {
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
    color: accentColor, transparent: true, opacity: 0.04,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [accentColor]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.04 + pulse * 0.015;
    }
  });

  const hasToolbox = !!toolboxContent;
  const hasOutput = !!outputContent;
  const workspaceWidth = PANEL_WIDTH - (hasToolbox ? TOOLBOX_WIDTH + SECTION_GAP : 0)
    - (hasOutput ? OUTPUT_WIDTH + SECTION_GAP : 0) - 0.06;
  const contentHeight = PANEL_HEIGHT - 0.1;

  // X positions for three columns
  let workspaceX = 0;
  const toolboxX = -PANEL_WIDTH / 2 + TOOLBOX_WIDTH / 2 + 0.03;
  const outputX = PANEL_WIDTH / 2 - OUTPUT_WIDTH / 2 - 0.03;

  if (hasToolbox && hasOutput) {
    workspaceX = 0;
  } else if (hasToolbox) {
    workspaceX = (TOOLBOX_WIDTH + SECTION_GAP) / 2;
  } else if (hasOutput) {
    workspaceX = -(OUTPUT_WIDTH + SECTION_GAP) / 2;
  }

  return (
    <group name="builder-game-template" position={[0, 0, PANEL_Z]}>
      <mesh ref={glowRef} position={[0, 0, -0.002]}>
        <planeGeometry args={[PANEL_WIDTH + 0.04, PANEL_HEIGHT + 0.04]} />
        <primitive object={glowMat} />
      </mesh>
      <mesh><boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} /><primitive object={panelMat} /></mesh>

      {/* Chrome frame */}
      <mesh position={[0, PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.002, 0.002]} />
      </mesh>
      <mesh position={[0, -PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.002, 0.002]} />
      </mesh>

      <group position={[0, 0.02, PANEL_DEPTH / 2 + 0.002]}>
        {/* Toolbox (left) */}
        {hasToolbox && (
          <SectionFrame
            position={[toolboxX, 0, 0]}
            width={TOOLBOX_WIDTH}
            height={contentHeight}
            label={toolboxLabel}
            color={color}
          >
            <Html position={[0, -0.02, 0.01]} center
              style={{ width: `${TOOLBOX_WIDTH * 250}px`, maxHeight: `${contentHeight * 250}px`, overflow: 'auto' }}
            >{toolboxContent}</Html>
          </SectionFrame>
        )}

        {/* Workspace (center) */}
        <SectionFrame
          position={[workspaceX, 0, 0]}
          width={workspaceWidth}
          height={contentHeight}
          label={workspaceLabel}
          color={color}
        >
          <Html position={[0, -0.02, 0.01]} center
            style={{ width: `${workspaceWidth * 250}px`, maxHeight: `${contentHeight * 250}px`, overflow: 'auto' }}
          >{workspaceContent}</Html>
        </SectionFrame>

        {/* Output (right) */}
        {hasOutput && (
          <SectionFrame
            position={[outputX, 0, 0]}
            width={OUTPUT_WIDTH}
            height={contentHeight}
            label={outputLabel}
            color={color}
          >
            <Html position={[0, -0.02, 0.01]} center
              style={{ width: `${OUTPUT_WIDTH * 250}px`, maxHeight: `${contentHeight * 250}px`, overflow: 'auto' }}
            >{outputContent}</Html>
          </SectionFrame>
        )}

        {/* Status text at bottom */}
        {statusText && (
          <Text
            position={[0, -PANEL_HEIGHT / 2 + 0.04, 0]}
            fontSize={TYPE_SCALE.caption.fontSize}
            color={TEXT_COLORS.muted.hex}
            anchorX="center" anchorY="middle"
            font={NUMERIC_FONT}
            fillOpacity={TEXT_COLORS.muted.opacity}
          >{statusText}</Text>
        )}
      </group>
    </group>
  );
}

export default BuilderGameTemplate;
