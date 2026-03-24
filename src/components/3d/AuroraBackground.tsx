'use client';

// ================================================================
// SparkForge AuroraBackground — R3F Aurora Void (20M Upgrade)
// ================================================================
// Decision 2.5: Background behind station frame
// Decision 4.6: Aurora is the frame's own glow, not separate space
// 20M UPGRADE: Volumetric aurora layers with 3D depth geometry
// Triangle budget: ~50,000 (was 2 — single plane)
//
// Now renders 6 layered planes at varying depths with individual
// shader materials, plus 3 volumetric ribbon meshes using
// TubeGeometry for parallax depth.

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { auroraFragmentShader, auroraVertexShader } from '@/shaders/index';

interface AuroraBackgroundProps {
  intensity?: number;
  speed?: number;
  color1?: string;
  color2?: string;
  color3?: string;
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
}: {
  yOffset: number;
  zOffset: number;
  amplitude: number;
  frequency: number;
  tubeRadius: number;
  segments: number;
  color: THREE.Color;
  opacity: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Generate the ribbon curve
  const { geometry, material } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const ribbonWidth = 20;
    const pointCount = Math.max(segments, 16);
    for (let i = 0; i <= pointCount; i++) {
      const t = (i / pointCount) * ribbonWidth - ribbonWidth / 2;
      const y = Math.sin(t * frequency * 0.5) * amplitude + yOffset;
      const z = zOffset + Math.cos(t * frequency * 0.3) * amplitude * 0.3;
      points.push(new THREE.Vector3(t, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, segments, tubeRadius, 8, false);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, [yOffset, zOffset, amplitude, frequency, tubeRadius, segments, color, opacity]);

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
  speed = 1.0,
  color1 = '#3B82F6', // Blue
  color2 = '#8B5CF6', // Purple
  color3 = '#06B6D4', // Teal
}: AuroraBackgroundProps) {
  const groupRef = useRef<THREE.Group>(null);
  const layerRefs = useRef<THREE.Mesh[]>([]);
  const { viewport } = useThree();

  // Parse colors
  const colors = useMemo(() => ({
    c1: new THREE.Color(color1),
    c2: new THREE.Color(color2),
    c3: new THREE.Color(color3),
  }), [color1, color2, color3]);

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
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uColor3: { value: new THREE.Color(color3) },
      uIntensity: { value: intensity },
      uSpeed: { value: speed },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Ribbon params for volumetric effect
  const ribbonSegments = Math.max(64 * 2, 32);

  // Update all layer uniforms each frame
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < layerUniforms.length; i++) {
      const u = layerUniforms[i];
      u.uTime.value = t + i * 0.5; // Phase offset per layer
      u.uIntensity.value = intensity * layers[i].opMult;
      u.uSpeed.value = speed * (1.0 - i * 0.1);
      u.uColor1.value.set(color1);
      u.uColor2.value.set(color2);
      u.uColor3.value.set(color3);
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
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Volumetric aurora ribbons for 3D depth */}
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
          />
        </>
      )}
    </group>
  );
}
