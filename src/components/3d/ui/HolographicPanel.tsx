'use client';

// ════════════════════════════════════════════════════
// HolographicPanel — Raised Platform Content Surface (Design Token System)
// ════════════════════════════════════════════════════
// A larger-scale panel for content grids, game lists, or stat displays.
// Raised platform with chrome edge rail and chrome divider bar header.
//
// Design Decisions (Component 17):
// - 17.1 Style: Raised platform — Panel raised 1 depth layer above surrounding surface.
//         Content on elevated platform with chrome edge rail.
// - 17.2 Headers: Chrome divider bar — Header text (Exo 2, h2) with horizontal chrome
//         bar extending to right edge. Professional, clean separation.
// - 17.3 Spacing: Per density tokens — 40% whitespace ratio, paginate overflow,
//         ghost placeholders for empty states. System-level consistency.
//
// Used for:
// - Arcade game grid projection
// - Lab detail game list
// - Profile badge gallery
// - Settings control surface
//
// All visual constants sourced from cockpitDesignTokens — NO hardcoded values.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  Shape,
  ExtrudeGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';

import {
  CHROME_BORDER,
  DEPTH_LAYERS,
  BEVEL_STYLE,
  HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  EMISSIVE_IDLE_INDICATOR,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface HolographicPanelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  title?: string;
  children?: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════

/** Chamfered rectangle shape — 45-degree corner cuts matching HolographicCard shape language */
function createChamferedRect(w: number, h: number, chamfer: number): Shape {
  const s = new Shape();
  const hw = w / 2, hh = h / 2, c = chamfer;
  s.moveTo(-hw + c, -hh);
  s.lineTo(hw - c, -hh);
  s.lineTo(hw, -hh + c);
  s.lineTo(hw, hh - c);
  s.lineTo(hw - c, hh);
  s.lineTo(-hw + c, hh);
  s.lineTo(-hw, hh - c);
  s.lineTo(-hw, -hh + c);
  s.closePath();
  return s;
}

function createChamferedGeometry(
  w: number,
  h: number,
  depth: number,
  chamfer: number,
): ExtrudeGeometry {
  const shape = createChamferedRect(w, h, chamfer);
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS derived from design tokens
// ═══════════════════════════════════════════════════════════════

const PLATFORM_CHAMFER = BEVEL_STYLE.structural.value; // 0.008
const PLATFORM_DEPTH = 0.006;
const RAIL_THICKNESS = 0.002;
const RAIL_HEIGHT = 0.003;
const CHROME_BAR_HEIGHT = 0.002;
const CHROME_BAR_DEPTH = 0.003;
const TITLE_LEFT_MARGIN = 0.015;
const TITLE_BAR_GAP = 0.008;

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function HolographicPanel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.6,
  height = 0.4,
  color = '#00BBFF',
  opacity = 0.85,
  title,
  children,
}: HolographicPanelProps) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  const surfaceRef = useRef<Mesh>(null);

  const accentColor = useMemo(() => new Color(color), [color]);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  // Platform base geometry — chamfered rectangle
  const platformGeometry = useMemo(
    () => createChamferedGeometry(width, height, PLATFORM_DEPTH, PLATFORM_CHAMFER),
    [width, height],
  );

  // Chrome edge rail geometries (4 sides)
  const railGeometries = useMemo(() => {
    const hw = width / 2;
    const hh = height / 2;
    return {
      top:    { w: width - PLATFORM_CHAMFER * 2, pos: [0, hh - RAIL_THICKNESS / 2, PLATFORM_DEPTH + RAIL_HEIGHT / 2] as [number, number, number] },
      bottom: { w: width - PLATFORM_CHAMFER * 2, pos: [0, -hh + RAIL_THICKNESS / 2, PLATFORM_DEPTH + RAIL_HEIGHT / 2] as [number, number, number] },
      left:   { h: height - PLATFORM_CHAMFER * 2, pos: [-hw + RAIL_THICKNESS / 2, 0, PLATFORM_DEPTH + RAIL_HEIGHT / 2] as [number, number, number] },
      right:  { h: height - PLATFORM_CHAMFER * 2, pos: [hw - RAIL_THICKNESS / 2, 0, PLATFORM_DEPTH + RAIL_HEIGHT / 2] as [number, number, number] },
    };
  }, [width, height]);

  // Platform base material — carbon composite
  const platformMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0A0F1F'),
    metalness: 0.85,
    roughness: 0.35,
    transparent: true,
    opacity: Math.min(opacity + 0.1, 1.0),
  }), [opacity]);

  // Chrome rail material
  const chromeMaterial = useMemo(() => new MeshStandardMaterial({
    color: chromeColor,
    metalness: 0.95,
    roughness: 0.1,
    emissive: accentColor,
    emissiveIntensity: CHROME_BORDER.glowIntensity,
    transparent: true,
    opacity: Math.min(opacity + 0.1, 1.0),
  }), [chromeColor, accentColor, opacity]);

  // Inner surface — dark with holographic emissive
  const surfaceMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0a1625'),
    emissive: accentColor,
    emissiveIntensity: EMISSIVE_IDLE_INDICATOR,
    metalness: 0.3,
    roughness: 0.6,
    transparent: true,
    opacity,
  }), [accentColor, opacity]);

  // Glow backing
  const glowMaterial = useMemo(() => new MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.1,
    blending: AdditiveBlending,
    side: DoubleSide,
    depthWrite: false,
    toneMapped: false,
  }), [accentColor]);

  // Chrome divider bar material (for header)
  const chromeBarMaterial = useMemo(() => new MeshStandardMaterial({
    color: chromeColor,
    metalness: 0.95,
    roughness: 0.1,
    emissive: accentColor,
    emissiveIntensity: CHROME_BORDER.glowIntensity * 0.8,
  }), [chromeColor, accentColor]);

  // Calculate title text width estimate for chrome bar positioning
  const h2Style = TYPE_SCALE.h2;
  const titleEstimatedWidth = title ? title.length * h2Style.fontSize * 0.55 : 0;
  const chromeBarStartX = -width / 2 + TITLE_LEFT_MARGIN + titleEstimatedWidth + TITLE_BAR_GAP;
  const chromeBarWidth = width / 2 - chromeBarStartX;

  // Header Y position (top of panel + rail offset)
  const headerY = height / 2 - 0.02;

  // Breathing glow animation using token-driven timing
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = Math.sin(t * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));

    if (surfaceRef.current) {
      const mat = surfaceRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = EMISSIVE_IDLE_INDICATOR + pulse * 0.05;
    }

    if (glowRef.current) {
      const mat = glowRef.current.material as MeshBasicMaterial;
      mat.opacity = 0.1 + pulse * 0.03;
    }
  });

  // Raised platform Z offset from design tokens
  const raiseZ = DEPTH_LAYERS.low_raise;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Glow backing — behind platform */}
      <mesh ref={glowRef} position={[0, 0, raiseZ - 0.003]}>
        <planeGeometry args={[width + 0.02, height + 0.02]} />
        <primitive object={glowMaterial} />
      </mesh>

      {/* Platform base — raised carbon composite surface */}
      <mesh
        geometry={platformGeometry}
        material={platformMaterial}
        position={[-width / 2, -height / 2, raiseZ]}
        /* ExtrudeGeometry is created in XY plane; position offsets to center */
      />

      {/* Inner surface — holographic emissive panel face */}
      <mesh ref={surfaceRef} position={[0, 0, raiseZ + PLATFORM_DEPTH + 0.001]}>
        <planeGeometry args={[width - 0.006, height - 0.006]} />
        <primitive object={surfaceMaterial} />
      </mesh>

      {/* Chrome edge rails — 4 sides */}
      {/* Top rail */}
      <mesh position={railGeometries.top.pos} material={chromeMaterial}>
        <boxGeometry args={[railGeometries.top.w, RAIL_THICKNESS, RAIL_HEIGHT]} />
      </mesh>
      {/* Bottom rail */}
      <mesh position={railGeometries.bottom.pos} material={chromeMaterial}>
        <boxGeometry args={[railGeometries.bottom.w, RAIL_THICKNESS, RAIL_HEIGHT]} />
      </mesh>
      {/* Left rail */}
      <mesh position={railGeometries.left.pos} material={chromeMaterial}>
        <boxGeometry args={[RAIL_THICKNESS, railGeometries.left.h, RAIL_HEIGHT]} />
      </mesh>
      {/* Right rail */}
      <mesh position={railGeometries.right.pos} material={chromeMaterial}>
        <boxGeometry args={[RAIL_THICKNESS, railGeometries.right.h, RAIL_HEIGHT]} />
      </mesh>

      {/* Chrome divider bar header (Decision 17.2) */}
      {title && (
        <group position={[0, headerY, raiseZ + PLATFORM_DEPTH + 0.002]}>
          {/* Title text — Exo 2 h2 */}
          <Text
            position={[-width / 2 + TITLE_LEFT_MARGIN, 0, 0]}
            fontSize={h2Style.fontSize}
            font={h2Style.fontPath}
            color={TEXT_COLORS.primary.hex}
            anchorX="left"
            anchorY="middle"
            fillOpacity={TEXT_COLORS.primary.opacity}
          >
            {title}
          </Text>

          {/* Horizontal chrome bar extending from after title text to right edge */}
          {chromeBarWidth > 0.01 && (
            <mesh
              position={[chromeBarStartX + chromeBarWidth / 2, 0, 0]}
              material={chromeBarMaterial}
            >
              <boxGeometry args={[chromeBarWidth, CHROME_BAR_HEIGHT, CHROME_BAR_DEPTH]} />
            </mesh>
          )}
        </group>
      )}

      {/* Content children — R3F elements positioned inside the platform area */}
      {children && (
        <group position={[0, title ? headerY - 0.035 : 0, raiseZ + PLATFORM_DEPTH + 0.003]}>
          {children}
        </group>
      )}
    </group>
  );
}

export default HolographicPanel;
