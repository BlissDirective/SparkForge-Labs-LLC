'use client';

// ================================================================
// SparkForge AuroraBackground — R3F Aurora Void (20M Upgrade)
// ================================================================
// Decision 2.5: Background behind station frame
// Decision 4.6: Aurora is the frame's own glow, not separate space
// Decision 19.1: 3 ribbons — three overlapping at different depths
// Decision 19.2: Mode-tinted — ribbons shift toward mode LED color
// Decision 19.3: Gentle flow (0.6) — visible flowing motion
// 20M UPGRADE: Volumetric aurora layers with 3D depth geometry
// Triangle budget: ~50,000 (was 2 — single plane)
//
// Now renders 6 layered planes at varying depths with individual
// shader materials, plus 3 volumetric ribbon meshes using
// TubeGeometry for parallax depth.
// Color crossfade uses PARTICLE_CROSSFADE_S (1.5s) for smooth
// transitions. Mode tinting uses SURFACE_TINT_BLEND (0.05).

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { auroraFragmentShader, auroraVertexShader } from '@/shaders/index';
import {
  PARTICLE_CROSSFADE_S,
  SURFACE_TINT_BLEND,
} from '@/lib/3d/cockpitDesignTokens';

interface AuroraBackgroundProps {
  intensity?: number;
  speed?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  /** Current mode/lab LED color — ribbons subtly tint toward this */
  modeColor?: string;
}

// ── Volumetric Ribbon (TubeGeometry aurora band) ─────────────

function AuroraRibbon({
  yOffset,
  zOffset,
  amplitude,
  frequency,
  tubeRadius,
  segments,
  color,
  opacity,
  speed,
  onMaterialReady,
}: {
  yOffset: number;
  zOffset: number;
  amplitude: number;
  frequency: number;
  tubeRadius: number;
  segments: number;
  color: Color;
  opacity: number;
  speed: number;
  onMaterialReady?: (mat: MeshBasicMaterial) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  // Generate the ribbon curve
  const { geometry, material } = useMemo(() => {
    const points: Vector3[] = [];
    const ribbonWidth = 20;
    const pointCount = Math.max(segments, 16);
    for (let i = 0; i <= pointCount; i++) {
      const t = (i / pointCount) * ribbonWidth - ribbonWidth / 2;
      const y = Math.sin(t * frequency * 0.5) * amplitude + yOffset;
      const z = zOffset + Math.cos(t * frequency * 0.3) * amplitude * 0.3;
      points.push(new Vector3(t, y, z));
    }
    const curve = new CatmullRomCurve3(points);
    const geo = new TubeGeometry(curve, segments, tubeRadius, 8, false);
    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: DoubleSide,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    onMaterialReady?.(mat);
    return { geometry: geo, material: mat };
  }, [yOffset, zOffset, amplitude, frequency, tubeRadius, segments, color, opacity, onMaterialReady]);

  useFrame(({ clock }) => {
    timeRef.current = clock.elapsedTime;
    if (meshRef.current) {
      // Gentle undulation
      meshRef.current.position.y = Math.sin(timeRef.current * speed * 0.3) * 0.3;
      meshRef.current.position.x = Math.sin(timeRef.current * speed * 0.15) * 0.5;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={-2} />;
}

// ── Main Component ───────────────────────────────────────────

export function AuroraBackground({
  intensity = 0.15,
  speed = 0.6,
  color1 = '#3B82F6', // Blue
  color2 = '#8B5CF6', // Purple
  color3 = '#06B6D4', // Teal
  modeColor,
}: AuroraBackgroundProps) {
  const groupRef = useRef<Group>(null);
  const layerRefs = useRef<Mesh[]>([]);
  const { viewport } = useThree();

  // Crossfade targets — smoothly interpolate toward mode-tinted colors
  const crossfadeRef = useRef({ c1: new Color(color1), c2: new Color(color2), c3: new Color(color3) });
  const modeColorRef = useRef<Color | null>(modeColor ? new Color(modeColor) : null);

  // Parse base colors, then tint toward modeColor using SURFACE_TINT_BLEND
  const colors = useMemo(() => {
    const c1 = new Color(color1);
    const c2 = new Color(color2);
    const c3 = new Color(color3);
    if (modeColor) {
      const mc = new Color(modeColor);
      modeColorRef.current = mc;
      c1.lerp(mc, SURFACE_TINT_BLEND);
      c2.lerp(mc, SURFACE_TINT_BLEND);
      c3.lerp(mc, SURFACE_TINT_BLEND);
    } else {
      modeColorRef.current = null;
    }
    return { c1, c2, c3 };
  }, [color1, color2, color3, modeColor]);

  // Layer definitions: z-depth, opacity multiplier, color index, scale
  const layers = useMemo(() => [
    { z: -12, opMult: 0.6, colorIdx: 0, scaleY: 1.0 },
    { z: -14, opMult: 0.4, colorIdx: 1, scaleY: 1.2 },
    { z: -16, opMult: 0.3, colorIdx: 2, scaleY: 1.4 },
    { z: -18, opMult: 0.2, colorIdx: 0, scaleY: 1.6 },
    { z: -20, opMult: 0.15, colorIdx: 1, scaleY: 1.8 },
    { z: -22, opMult: 0.1, colorIdx: 2, scaleY: 2.0 },
  ], []);

  // Create uniforms per layer
  const layerUniforms = useMemo(() =>
    layers.map(() => ({
      uTime: { value: 0 },
      uColor1: { value: new Color(color1) },
      uColor2: { value: new Color(color2) },
      uColor3: { value: new Color(color3) },
      uIntensity: { value: intensity },
      uSpeed: { value: speed },
      uResolution: { value: new Vector2(viewport.width, viewport.height) },
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Ribbon params for volumetric effect
  const ribbonSegments = Math.max(64 * 2, 32);

  // Ribbon material refs for crossfade tinting
  const ribbonMaterialRefs = useRef<MeshBasicMaterial[]>([]);

  // Update all layer uniforms each frame + crossfade ribbon colors
  useFrame(({ clock, delta }) => {
    const t = clock.elapsedTime;

    // Smoothly crossfade toward target colors (PARTICLE_CROSSFADE_S duration)
    const lerpFactor = MathUtils.clamp(delta / PARTICLE_CROSSFADE_S, 0, 1);
    const cf = crossfadeRef.current;
    cf.c1.lerp(colors.c1, lerpFactor);
    cf.c2.lerp(colors.c2, lerpFactor);
    cf.c3.lerp(colors.c3, lerpFactor);

    // Update ribbon materials with crossfaded colors
    const ribbonColors = [cf.c1, cf.c2, cf.c3];
    for (let r = 0; r < ribbonMaterialRefs.current.length; r++) {
      const mat = ribbonMaterialRefs.current[r];
      if (mat) mat.color.copy(ribbonColors[r]);
    }

    for (let i = 0; i < layerUniforms.length; i++) {
      const u = layerUniforms[i];
      u.uTime.value = t + i * 0.5; // Phase offset per layer
      u.uIntensity.value = intensity * layers[i].opMult;
      u.uSpeed.value = speed * (1.0 - i * 0.1);
      u.uColor1.value.copy(cf.c1);
      u.uColor2.value.copy(cf.c2);
      u.uColor3.value.copy(cf.c3);
    }
  });

  const w = viewport.width * 2;
  const h = viewport.height * 2;

  return (
    <group ref={groupRef}>
      {/* Layered shader planes at varying depths */}
      {layers.map((layer, i) => (
        <mesh
          key={`layer-${i}`}
          ref={(el) => { if (el) layerRefs.current[i] = el; }}
          position={[0, 0, layer.z]}
          renderOrder={-1}
        >
          <planeGeometry args={[w * (1 + i * 0.1), h * layer.scaleY]} />
          <shaderMaterial
            vertexShader={auroraVertexShader}
            fragmentShader={auroraFragmentShader}
            uniforms={layerUniforms[i]}
            transparent
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      ))}

      {/* Volumetric aurora ribbons for 3D depth (Decision 19.1: exactly 3 ribbons) */}
      {(
        <>
          <AuroraRibbon
            yOffset={2}
            zOffset={-13}
            amplitude={1.5}
            frequency={0.8}
            tubeRadius={0.15}
            segments={ribbonSegments}
            color={colors.c1}
            opacity={intensity * 0.12}
            speed={speed}
            onMaterialReady={(mat) => { ribbonMaterialRefs.current[0] = mat; }}
          />
          <AuroraRibbon
            yOffset={-1}
            zOffset={-15}
            amplitude={2.0}
            frequency={0.6}
            tubeRadius={0.2}
            segments={ribbonSegments}
            color={colors.c2}
            opacity={intensity * 0.08}
            speed={speed * 0.8}
            onMaterialReady={(mat) => { ribbonMaterialRefs.current[1] = mat; }}
          />
          <AuroraRibbon
            yOffset={3.5}
            zOffset={-17}
            amplitude={1.8}
            frequency={1.0}
            tubeRadius={0.12}
            segments={ribbonSegments}
            color={colors.c3}
            opacity={intensity * 0.06}
            speed={speed * 0.6}
            onMaterialReady={(mat) => { ribbonMaterialRefs.current[2] = mat; }}
          />
        </>
      )}
    </group>
  );
}
