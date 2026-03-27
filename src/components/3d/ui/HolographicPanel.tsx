'use client';

// ════════════════════════════════════════════════════
// HolographicPanel — Large Curved Content Surface
// ════════════════════════════════════════════════════
// A larger-scale panel for content grids, game lists, or stat displays.
// Matches the cockpit's curved control panel aesthetic with metallic
// alloy bezel frame and holographic inner surface.
//
// Used for:
// - Arcade game grid projection
// - Lab detail game list
// - Profile badge gallery
// - Settings control surface
//
// Features:
// - Curved panel via CylinderGeometry (matches cockpit hull curvature)
// - Metallic alloy frame with lab-color emissive
// - Holographic inner surface (AdditiveBlending)
// - Children rendered via drei <Html transform>
// - Mode-reactive opacity and glow intensity

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  MeshPhongMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';

interface HolographicPanelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  /** Whether to use curved geometry (matches cockpit) vs flat */
  curved?: boolean;
  /** Curvature radius (only when curved=true) */
  curveRadius?: number;
  /** Curvature arc in radians */
  curveArc?: number;
  /** Panel title (rendered in 3D) */
  title?: string;
  children?: React.ReactNode;
}

export function HolographicPanel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.6,
  height = 0.4,
  color = '#00BBFF',
  opacity = 0.85,
  curved = false,
  curveRadius = 3.9,
  curveArc = 0.5,
  title,
  children,
}: HolographicPanelProps) {
  const groupRef = useRef<Group>(null);
  const panelRef = useRef<Mesh>(null);

  const accentColor = useMemo(() => new Color(color), [color]);

  // Frame material (metallic alloy)
  const frameMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#a8b5c8'),
    metalness: 0.98,
    roughness: 0.12,
    emissive: accentColor,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: Math.min(opacity + 0.1, 1.0),
  }), [accentColor, opacity]);

  // Inner surface — dark with holographic glow
  const surfaceMaterial = useMemo(() => new MeshPhongMaterial({
    color: new Color('#0a1625'),
    emissive: accentColor,
    emissiveIntensity: 0.15,
    shininess: 95,
    specular: new Color('#88eeff'),
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

  useFrame((state) => {
    // Subtle breathing glow
    if (panelRef.current) {
      const t = state.clock.elapsedTime;
      surfaceMaterial.emissiveIntensity = 0.15 + Math.sin(t * 1.5) * 0.05;
      glowMaterial.opacity = 0.1 + Math.sin(t * 2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Bezel frame */}
      {!curved ? (
        <RoundedBox
          args={[width + 0.01, height + 0.01, 0.008]}
          radius={0.006}
          smoothness={4}
          material={frameMaterial}
        />
      ) : (
        <mesh material={frameMaterial}>
          <cylinderGeometry args={[
            curveRadius + 0.005,
            curveRadius + 0.005,
            height + 0.01,
            72, 1, true,
            -curveArc / 2,
            curveArc,
          ]} />
        </mesh>
      )}

      {/* Inner panel surface */}
      <mesh ref={panelRef} position={[0, 0, curved ? 0 : 0.001]}>
        {!curved ? (
          <planeGeometry args={[width, height]} />
        ) : (
          <cylinderGeometry args={[
            curveRadius,
            curveRadius,
            height,
            72, 1, true,
            -curveArc / 2,
            curveArc,
          ]} />
        )}
        <primitive object={surfaceMaterial} />
      </mesh>

      {/* Glow backing */}
      <mesh position={[0, 0, curved ? 0 : -0.003]}>
        {!curved ? (
          <planeGeometry args={[width + 0.02, height + 0.02]} />
        ) : (
          <cylinderGeometry args={[
            curveRadius + 0.01,
            curveRadius + 0.01,
            height + 0.02,
            36, 1, true,
            -curveArc / 2,
            curveArc,
          ]} />
        )}
        <primitive object={glowMaterial} />
      </mesh>

      {/* Title (if provided) */}
      {title && (
        <Html
          transform
          position={[0, height / 2 + 0.015, curved ? 0 : 0.005]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div style={{
            fontFamily: 'Exo 2, sans-serif',
            fontWeight: 700,
            fontSize: '10px',
            color,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: `0 0 12px ${color}60`,
            whiteSpace: 'nowrap',
          }}>
            {title}
          </div>
        </Html>
      )}

      {/* Content children via Html transform */}
      {children && (
        <Html
          transform
          occlude
          position={[0, 0, curved ? 0 : 0.005]}
          style={{
            width: `${width * 400}px`,
            height: `${height * 400}px`,
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            color: '#ffffff',
            fontFamily: 'Sora, sans-serif',
            fontSize: '10px',
          }}>
            {children}
          </div>
        </Html>
      )}
    </group>
  );
}

export default HolographicPanel;
