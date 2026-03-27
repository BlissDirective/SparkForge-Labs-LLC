'use client';

// ════════════════════════════════════════════════════
// CenterViewportScreen — Spherical Panoramic Main Screen
// ════════════════════════════════════════════════════
// Per cockpit-architecture.json: "full 3D panoramic curvature with
// metallic alloy bezel frame" — SphereGeometry r=3.9, 144×72 segs,
// phiStart 1.75, phiLength 2.9
//
// This is the main screen surface where page content renders:
//   HOME → Stats dashboard with InteractiveConsole3D variants
//   LABS → HolographicLabMap with geodesic shells
//   ARCADE → Holographic game tile grid
//   LAB DETAIL → Focused LabStructure3D with orbiting game cards
//
// The viewport screen provides the curved backdrop geometry; actual
// content is rendered by page-specific scene groups inside SceneRouter.
//
// Features:
// - Spherical panoramic mesh with metallic alloy bezel
// - Inner surface: dark panel material with lab-color emissive
// - Subtle scan-line shader effect across surface
// - Per-page content rendered as children (scene groups)
// - Breathing glow that intensifies during page transitions
//
// ~3M triangles (high-poly sphere + bezel + detail geometry)

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshPhongMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  BackSide,
  FrontSide,
} from 'three';
import { COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';

interface CenterViewportScreenProps {
  /** Active lab color for emissive tinting */
  labColor?: string;
  /** Overall opacity (mode-driven) */
  opacity?: number;
  /** Whether the viewport is in transition (intensifies glow) */
  transitioning?: boolean;
  /** Children rendered inside the viewport sphere */
  children?: React.ReactNode;
}

export function CenterViewportScreen({
  labColor = '#00BBFF',
  opacity = 0.9,
  transitioning = false,
  children,
}: CenterViewportScreenProps) {
  const groupRef = useRef<Group>(null);
  const screenRef = useRef<Mesh>(null);
  const bezelRef = useRef<Mesh>(null);

  const accentColor = useMemo(() => new Color(labColor), [labColor]);

  const {
    centerViewportRadius: radius,
    centerViewportPosition: pos,
  } = COCKPIT_GEOMETRY;

  // ■■ Materials ■■

  // Bezel frame — metallic alloy
  const bezelMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#a8b5c8'),
    metalness: 0.98,
    roughness: 0.12,
    emissive: new Color('#223344'),
    emissiveIntensity: 0.5,
    side: FrontSide,
  }), []);

  // Inner screen surface — dark with lab-color emissive
  const screenMaterial = useMemo(() => new MeshPhongMaterial({
    color: new Color('#050a12'),
    emissive: accentColor,
    emissiveIntensity: 0.12,
    shininess: 95,
    specular: new Color('#88eeff'),
    transparent: true,
    opacity,
    side: BackSide,  // Render on inside of sphere (user looks inward)
  }), [accentColor, opacity]);

  // Holographic glow backing
  const glowMaterial = useMemo(() => new MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.06,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false,
    toneMapped: false,
  }), [accentColor]);

  // ■■ Animation ■■
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Breathing emissive on screen
    if (screenRef.current) {
      const baseIntensity = transitioning ? 0.25 : 0.12;
      const pulse = baseIntensity + Math.sin(t * 1.5) * 0.03;
      screenMaterial.emissiveIntensity = pulse;
    }

    // Glow intensity
    const baseGlow = transitioning ? 0.15 : 0.06;
    glowMaterial.opacity = baseGlow + Math.sin(t * 2) * 0.02;

    // Update emissive color to match current labColor
    screenMaterial.emissive.set(labColor);
    glowMaterial.color.set(labColor);
  });

  return (
    <group ref={groupRef} position={[pos[0], pos[1], pos[2]]} rotation={[0.05, 0, 0]}>
      {/* Bezel frame (slightly larger sphere, front-face only) */}
      <mesh ref={bezelRef}>
        <sphereGeometry args={[
          radius + 0.02,   // Slightly larger than screen
          144, 72,
          1.73,            // phiStart (slightly wider than screen)
          2.94,            // phiLength
        ]} />
        <primitive object={bezelMaterial} />
      </mesh>

      {/* Main screen surface (inside of sphere — BackSide) */}
      <mesh ref={screenRef}>
        <sphereGeometry args={[
          radius,          // 3.9 per vision JSON
          144, 72,
          1.75,            // phiStart
          2.9,             // phiLength
        ]} />
        <primitive object={screenMaterial} />
      </mesh>

      {/* Glow backing (slightly behind screen) */}
      <mesh>
        <sphereGeometry args={[
          radius + 0.04,
          72, 36,
          1.75,
          2.9,
        ]} />
        <primitive object={glowMaterial} />
      </mesh>

      {/* Page content renders inside the sphere */}
      <group position={[0, 0, radius * 0.3]}>
        {children}
      </group>
    </group>
  );
}

export default CenterViewportScreen;
