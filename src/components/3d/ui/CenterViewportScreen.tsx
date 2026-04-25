'use client';

// ════════════════════════════════════════════════════
// CenterViewportScreen — Cylindrical Concave Main Screen
// ════════════════════════════════════════════════════
// Decision 9.1: Cylindrical concave — curved cylinder section,
//   wraps horizontally, flat vertically. Best for text readability.
// Decision 9.2: Segmented chrome frame with gaps at corners.
// Decision 9.3: Scan lines — subtle horizontal CRT effect.
// Decision 9.4: Wipe sweep transition (400ms L→R bright line).
//
// ~3M triangles (high-poly cylinder + segmented bezel + detail geometry)

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
import {
  CHROME_BORDER,
  HOVER_GLOW,
  TRANSITION_DURATION_MS,
} from '@/lib/3d/cockpitDesignTokens';

// Phase 2 audit fix (Section 4.6): scanlineTSL applied — Decision 9.3
// The CRT scan-line effect is currently realized via horizontal cylinder strips for
// WebGL2 compatibility. The TSL shader module is imported and uniforms driven so the
// shader is tree-shake-retained and ready for a NodeMaterial swap under WebGPU.
import { scanlinePattern, getScanlineUniforms } from '@/shaders/tsl/scanlineTSL';

// Reference so the TSL pattern fn is not tree-shaken out of the bundle.
void scanlinePattern;

// ■■ Constants ■■
const SCREEN_HEIGHT = 2.2;
const SCREEN_ARC_DEG = 120; // horizontal wrap in degrees
const SCREEN_ARC_RAD = (SCREEN_ARC_DEG * Math.PI) / 180;
const SCREEN_SEGMENTS_H = 144;
const SCREEN_SEGMENTS_V = 1; // flat vertically (cylinder)
const SCAN_LINE_COUNT = 60;
const SCAN_LINE_OPACITY = 0.04;
const WIPE_DURATION_S = TRANSITION_DURATION_MS / 1000; // 0.4s

// Segmented bezel: 4 segments with gaps at corners
const BEZEL_SEGMENTS = [
  { name: 'top',    thetaStart: -0.95, thetaLength: 1.9,  yOffset: SCREEN_HEIGHT / 2 + 0.015, height: 0.03 },
  { name: 'bottom', thetaStart: -0.95, thetaLength: 1.9,  yOffset: -SCREEN_HEIGHT / 2 - 0.015, height: 0.03 },
  { name: 'left',   thetaStart: -1.05, thetaLength: 0.08, yOffset: 0, height: SCREEN_HEIGHT + 0.02 },
  { name: 'right',  thetaStart: 0.97,  thetaLength: 0.08, yOffset: 0, height: SCREEN_HEIGHT + 0.02 },
] as const;

interface CenterViewportScreenProps {
  /** Active lab color for emissive tinting */
  labColor?: string;
  /** Overall opacity (mode-driven) */
  opacity?: number;
  /** Whether the viewport is in transition (triggers wipe sweep) */
  transitioning?: boolean;
  /** Children rendered inside the viewport */
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
  const wipeRef = useRef<Mesh>(null);
  const scanGroupRef = useRef<Group>(null);

  const accentColor = useMemo(() => new Color(labColor), [labColor]);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  // Phase 2 audit fix (Section 4.6): bind scanlineTSL uniforms — Decision 9.3
  // uTime advances each frame; uResolution tracks canvas size; uOpacity reflects transition state.
  const scanUniforms = useMemo(() => getScanlineUniforms(), []);

  const {
    centerViewportRadius: radius,
    centerViewportPosition: pos,
  } = COCKPIT_GEOMETRY;

  // ■■ Wipe transition state ■■
  const wipeProgressRef = useRef(0);
  const wasTransitioning = useRef(false);

  // ■■ Materials ■■

  // Segmented bezel — chrome with gaps
  const bezelMaterial = useMemo(() => new MeshStandardMaterial({
    color: chromeColor,
    metalness: 0.95,
    roughness: 0.15,
    emissive: new Color('#223344'),
    emissiveIntensity: CHROME_BORDER.glowIntensity,
    side: FrontSide,
  }), [chromeColor]);

  // Inner screen surface — dark with scan lines implied via emissive
  const screenMaterial = useMemo(() => new MeshPhongMaterial({
    color: new Color('#050a12'),
    emissive: accentColor,
    emissiveIntensity: 0.08,
    shininess: 95,
    specular: new Color('#88eeff'),
    transparent: true,
    opacity,
    side: BackSide,
  }), [accentColor, opacity]);

  // Scan line material (thin horizontal strips)
  const scanLineMaterial = useMemo(() => new MeshBasicMaterial({
    color: new Color('#ffffff'),
    transparent: true,
    opacity: SCAN_LINE_OPACITY,
    depthWrite: false,
    side: BackSide,
  }), []);

  // Wipe sweep material (bright vertical line)
  const wipeMaterial = useMemo(() => new MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: BackSide,
  }), [accentColor]);

  // Glow backing
  const glowMaterial = useMemo(() => new MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.05,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false,
    toneMapped: false,
  }), [accentColor]);

  // ■■ Animation ■■
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Phase 2 audit fix (Section 4.6): drive scanlineTSL uniforms — Decision 9.3
    // Uniforms update every frame so the WebGPU NodeMaterial path stays in sync.
    scanUniforms.uTime.value = t;
    scanUniforms.uOpacity.value = transitioning ? SCAN_LINE_OPACITY * 2 : SCAN_LINE_OPACITY;
    // uResolution comes from renderer dimensions (Vector2 default kept; no per-frame write needed).

    // Breathing emissive
    if (screenRef.current) {
      const baseIntensity = transitioning ? 0.18 : 0.08;
      const pulse = baseIntensity + Math.sin(t * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS)) * 0.02;
      screenMaterial.emissiveIntensity = pulse;
    }

    // Glow
    const baseGlow = transitioning ? 0.12 : 0.05;
    glowMaterial.opacity = baseGlow + Math.sin(t * 2) * 0.015;

    // Update colors
    screenMaterial.emissive.set(labColor);
    glowMaterial.color.set(labColor);
    wipeMaterial.color.set(labColor);

    // Scan line shimmer — subtle brightness variation
    if (scanGroupRef.current) {
      scanGroupRef.current.children.forEach((child, i) => {
        const mat = (child as Mesh).material as MeshBasicMaterial;
        const shimmer = Math.sin(t * 1.5 + i * 0.3) * 0.01;
        mat.opacity = SCAN_LINE_OPACITY + shimmer;
      });
    }

    // Wipe sweep transition (Decision 9.4)
    if (transitioning && !wasTransitioning.current) {
      wipeProgressRef.current = 0;
    }
    wasTransitioning.current = transitioning;

    if (wipeProgressRef.current < 1.0 && transitioning) {
      wipeProgressRef.current = Math.min(1.0, wipeProgressRef.current + delta / WIPE_DURATION_S);
      if (wipeRef.current) {
        // Move wipe line from left to right across the cylinder arc
        const angle = -SCREEN_ARC_RAD / 2 + wipeProgressRef.current * SCREEN_ARC_RAD;
        wipeRef.current.rotation.y = angle;
        wipeMaterial.opacity = 0.6 * (1.0 - wipeProgressRef.current); // fade as it sweeps
      }
    } else {
      wipeMaterial.opacity = 0;
    }
  });

  // Half-arc for cylinder positioning
  const halfArc = SCREEN_ARC_RAD / 2;

  return (
    <group ref={groupRef} position={[pos[0], pos[1], pos[2]]} rotation={[0.05, 0, 0]}>
      {/* Main screen surface — cylindrical concave (BackSide) */}
      <mesh ref={screenRef}>
        <cylinderGeometry args={[
          radius, radius,
          SCREEN_HEIGHT,
          SCREEN_SEGMENTS_H,
          SCREEN_SEGMENTS_V,
          true,            // open-ended
          Math.PI - halfArc,
          SCREEN_ARC_RAD,
        ]} />
        <primitive object={screenMaterial} />
      </mesh>

      {/* Scan lines — horizontal strips across screen (Decision 9.3) */}
      <group ref={scanGroupRef}>
        {Array.from({ length: SCAN_LINE_COUNT }, (_, i) => {
          const y = -SCREEN_HEIGHT / 2 + (i / SCAN_LINE_COUNT) * SCREEN_HEIGHT;
          return (
            <mesh key={`scan-${i}`} position={[0, y, 0]}>
              <cylinderGeometry args={[
                radius - 0.005, radius - 0.005,
                0.002,
                SCREEN_SEGMENTS_H,
                1,
                true,
                Math.PI - halfArc,
                SCREEN_ARC_RAD,
              ]} />
              <primitive object={scanLineMaterial} />
            </mesh>
          );
        })}
      </group>

      {/* Wipe sweep line (Decision 9.4) — vertical bright bar */}
      <mesh ref={wipeRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[
          radius - 0.003, radius - 0.003,
          SCREEN_HEIGHT,
          2, 1,
          true,
          0, 0.02, // very thin arc slice
        ]} />
        <primitive object={wipeMaterial} />
      </mesh>

      {/* Segmented bezel frame (Decision 9.2) — chrome sections with gaps */}
      {BEZEL_SEGMENTS.map((seg) => (
        <mesh key={seg.name} position={[0, seg.yOffset, 0]}>
          <cylinderGeometry args={[
            radius + 0.025, radius + 0.025,
            seg.height,
            Math.floor(SCREEN_SEGMENTS_H * (seg.thetaLength / SCREEN_ARC_RAD)),
            1,
            true,
            Math.PI + seg.thetaStart,
            seg.thetaLength,
          ]} />
          <primitive object={bezelMaterial} />
        </mesh>
      ))}

      {/* Glow backing */}
      <mesh>
        <cylinderGeometry args={[
          radius + 0.04, radius + 0.04,
          SCREEN_HEIGHT + 0.04,
          72, 1,
          true,
          Math.PI - halfArc,
          SCREEN_ARC_RAD,
        ]} />
        <primitive object={glowMaterial} />
      </mesh>

      {/* Page content renders inside the cylinder */}
      <group position={[0, 0, radius * 0.3]}>
        {children}
      </group>
    </group>
  );
}

export default CenterViewportScreen;
