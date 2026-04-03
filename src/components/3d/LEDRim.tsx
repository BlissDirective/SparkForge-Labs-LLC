'use client';

// ================================================================
// SparkForge LEDRim — Ultra-Bright Emissive Status Strip (CPA v3.0)
// ================================================================
// v3.1: Design token integration, outward burst pulse, sequential
// color fill, removed data viz mode, desktop-only (no flat fallback)
//
// Features:
//   - 1500 instanced LED rectangular blocks across 218° arc
//   - Multi-layer: inner core tube, outer diffuser shell, mounting brackets
//   - Outward burst pulse from center (300ms cycle)
//   - Sequential color fill center→outward (400ms transition)
//   - Ultra-bright emissive (blazing = 2.5) via design tokens
//   - Secondary accent rims at offset y-positions
//
// Color = current lab accent (default #00BBFF on dashboard)
// Pulses gently, spikes on events (XP gain, badge earn, level up)

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import { COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';
import { createLEDMaterial, createAlloyFrameMaterial } from '@/lib/3d/cockpitMaterials';
import {
  EMISSIVE_SCALE,
  EMISSIVE_LED_MULTIPLIER,
  HOVER_GLOW,
  CHROME_BORDER,
  getEmissive,
} from '@/lib/3d/cockpitDesignTokens';

// ■■ Props Interface ■■
interface LEDRimProps {
  color?: string;
  intensity?: number;
  spikeActive?: boolean;
  curved?: boolean;
}

// ■■ Single LED count — desktop-ultra, no LOD tiers ■■
const LED_COUNT = 1500;

// ■■ Accent rim config ■■
const ACCENT_RIMS = [
  { yOffset: 0.18, scale: 0.6, ledFraction: 0.4, radiusOffset: 0.08 },
  { yOffset: -0.15, scale: 0.5, ledFraction: 0.35, radiusOffset: -0.06 },
];

// ■■ Bracket config ■■
const BRACKET_INTERVAL = 20; // place a bracket every N LEDs

// ■■ Helper: generate arc points ■■
function generateArcPoints(
  segments: number,
  arcDeg: number,
  radius: number,
  yOffset: number = 0,
  radiusOffset: number = 0,
): Vector3[] {
  const arcRad = (arcDeg * Math.PI) / 180;
  const r = radius + radiusOffset;
  const points: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = -arcRad / 2 + t * arcRad;
    points.push(
      new Vector3(
        Math.sin(angle) * r,
        yOffset,
        -Math.cos(angle) * r,
      ),
    );
  }
  return points;
}

// ■■ Helper: build curve from points ■■
function buildCurve(points: Vector3[]): CatmullRomCurve3 {
  return new CatmullRomCurve3(points, false);
}

// ■■ Instanced LED Strip Sub-Component ■■
function LEDStrip({
  curve,
  ledCount,
  ledSize,
  color,
  pulseBase,
  spikeVal,
  enableEffects,
}: {
  curve: CatmullRomCurve3;
  ledCount: number;
  ledSize: [number, number, number];
  color: string;
  pulseBase: React.MutableRefObject<number>;
  spikeVal: React.MutableRefObject<number>;
  enableEffects: boolean;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const colorRef = useRef(new Color(color));
  const prevColorRef = useRef(new Color(color));
  const targetColorRef = useRef(new Color(color));
  const transitionRef = useRef(0); // 0 = complete, >0 = in progress

  // Pre-compute positions and orientations along curve
  const transforms = useMemo(() => {
    const positions: Matrix4[] = [];
    const dummy = new Object3D();
    for (let i = 0; i < ledCount; i++) {
      const t = i / (ledCount - 1);
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      dummy.position.copy(point);
      // Orient LED to face outward from the arc center
      dummy.lookAt(point.clone().add(tangent));
      dummy.updateMatrix();
      positions.push(dummy.matrix.clone());
    }
    return positions;
  }, [curve, ledCount]);

  // Initialize instance matrices and colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    colorRef.current.set(color);

    for (let i = 0; i < ledCount; i++) {
      mesh.setMatrixAt(i, transforms[i]);
      mesh.setColorAt(i, colorRef.current);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [transforms, ledCount, color]);

  // Per-frame: update instance colors for pulse, spike, outward burst, and color transition
  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.elapsedTime;
    const pulse = pulseBase.current;
    const spike = spikeVal.current;

    // Detect color change and start sequential fill transition
    const currentTargetColor = new Color(color);
    if (!targetColorRef.current.equals(currentTargetColor)) {
      prevColorRef.current.copy(targetColorRef.current);
      targetColorRef.current.copy(currentTargetColor);
      transitionRef.current = 1.0; // start transition
    }

    // Decay transition: 400ms = delta * 2.5
    if (transitionRef.current > 0) {
      transitionRef.current = Math.max(0, transitionRef.current - delta * 2.5);
    }

    const inTransition = transitionRef.current > 0;
    // How far from center the new color has spread (0..1)
    const transitionThreshold = (1.0 - transitionRef.current);

    for (let i = 0; i < ledCount; i++) {
      const t = i / (ledCount - 1);

      // Distance from center (0 at center, 1 at edges)
      const centerDist = Math.abs(t - 0.5) * 2;

      // Compute per-LED intensity
      let ledIntensity = pulse + spike;

      if (enableEffects) {
        // Outward burst: pulse radiates from center (t=0.5) outward both directions
        const burstPhase = (time * 3.33) % 1.0; // ~300ms cycle
        const burstWave = 1.0 - Math.abs(centerDist - burstPhase);
        const burstIntensity = Math.max(0, burstWave) * 0.3;
        ledIntensity += burstIntensity;
      }

      // Clamp and apply
      ledIntensity = Math.max(0.2, Math.min(ledIntensity, 2.0));

      // Sequential color fill: center LEDs get new color first
      let ledColor: Color;
      if (inTransition && centerDist > transitionThreshold) {
        // This LED still shows old color
        ledColor = prevColorRef.current.clone().multiplyScalar(ledIntensity);
      } else {
        ledColor = targetColorRef.current.clone().multiplyScalar(ledIntensity);
      }

      mesh.setColorAt(i, ledColor);
    }

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, ledCount]}
      frustumCulled={false}
    >
      <boxGeometry args={ledSize} />
      <meshStandardMaterial
        emissive={color}
        emissiveIntensity={getEmissive('blazing')}
        toneMapped={false}
        transparent
        opacity={0.95}
      />
    </instancedMesh>
  );
}

// ■■ Inner Core Tube ■■
function CoreTube({
  curve,
  tubularSegments,
  radialSegments,
  radius,
  color,
  pulseRef,
  spikeRef,
}: {
  curve: CatmullRomCurve3;
  tubularSegments: number;
  radialSegments: number;
  radius: number;
  color: string;
  pulseRef: React.MutableRefObject<number>;
  spikeRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<Mesh>(null);

  const geometry = useMemo(
    () => new TubeGeometry(curve, tubularSegments, radius, radialSegments, false),
    [curve, tubularSegments, radius, radialSegments],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as MeshStandardMaterial;
    const totalIntensity = pulseRef.current + spikeRef.current;
    mat.emissiveIntensity = Math.min(totalIntensity * 0.8, 2.0);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#111118"
        emissive={color}
        emissiveIntensity={0.6}
        metalness={0.9}
        roughness={0.3}
        toneMapped={false}
      />
    </mesh>
  );
}

// ■■ Outer Diffuser Shell ■■
function DiffuserShell({
  curve,
  tubularSegments,
  radialSegments,
  radius,
  color,
  pulseRef,
}: {
  curve: CatmullRomCurve3;
  tubularSegments: number;
  radialSegments: number;
  radius: number;
  color: string;
  pulseRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<Mesh>(null);

  const geometry = useMemo(
    () => new TubeGeometry(curve, tubularSegments, radius, radialSegments, false),
    [curve, tubularSegments, radius, radialSegments],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as MeshPhysicalMaterial;
    mat.emissiveIntensity = Math.min(pulseRef.current * 0.4, 0.8);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.2}
        transmission={0.6}
        roughness={0.1}
        metalness={0.0}
        thickness={0.05}
        toneMapped={false}
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
      />
    </mesh>
  );
}

// ■■ Mounting Brackets ■■
function MountingBrackets({
  curve,
  bracketCount,
  bracketSize,
  color,
}: {
  curve: CatmullRomCurve3;
  bracketCount: number;
  bracketSize: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const transforms = useMemo(() => {
    const mats: Matrix4[] = [];
    const dummy = new Object3D();
    const up = new Vector3(0, 1, 0);

    for (let i = 0; i < bracketCount; i++) {
      const t = (i + 0.5) / bracketCount;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new Vector3()
        .crossVectors(tangent, up)
        .normalize();

      // Place bracket slightly below and inward of the LED strip
      dummy.position.copy(point).addScaledVector(normal, -0.03);
      dummy.position.y -= 0.06;
      dummy.lookAt(dummy.position.clone().add(tangent));
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
    }
    return mats;
  }, [curve, bracketCount]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const bracketColor = new Color(color).multiplyScalar(0.15);
    for (let i = 0; i < bracketCount; i++) {
      mesh.setMatrixAt(i, transforms[i]);
      mesh.setColorAt(i, bracketColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [transforms, bracketCount, color]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, bracketCount]}
      frustumCulled={false}
    >
      <boxGeometry args={bracketSize} />
      <meshStandardMaterial
        color="#1A1822"
        metalness={0.95}
        roughness={0.2}
      />
    </instancedMesh>
  );
}

// ■■ Glow Halo (additive bloom layer) ■■
function GlowHalo({
  curve,
  tubularSegments,
  radius,
  color,
  pulseRef,
  spikeRef,
}: {
  curve: CatmullRomCurve3;
  tubularSegments: number;
  radius: number;
  color: string;
  pulseRef: React.MutableRefObject<number>;
  spikeRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<Mesh>(null);

  const geometry = useMemo(
    () => new TubeGeometry(curve, tubularSegments, radius, 6, false),
    [curve, tubularSegments, radius],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as MeshBasicMaterial;
    const totalIntensity = pulseRef.current + spikeRef.current;
    mat.opacity = Math.min(totalIntensity * 0.15, 0.35);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.12}
        toneMapped={false}
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
      />
    </mesh>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================
export function LEDRim({
  color = '#00BBFF',
  intensity = 1.0,
  spikeActive = false,
  curved = true,
}: LEDRimProps) {
  const { viewport } = useThree();

  // Shared mutable refs for pulse/spike (avoids setState in useFrame)
  const pulseRef = useRef(0.85);
  const spikeRef = useRef(0);

  // Spike trigger
  useEffect(() => {
    if (spikeActive) {
      spikeRef.current = 2.0;
    }
  }, [spikeActive]);

  // Pulse + spike decay in useFrame
  useFrame(({ clock }) => {
    // Gentle pulse: 0.7..1.0 over ~3s cycle
    const pulse = Math.sin(clock.elapsedTime * 2.094) * 0.15 + 0.85;
    pulseRef.current = intensity * pulse;

    // Decay spike
    if (spikeRef.current > 0) {
      spikeRef.current = Math.max(spikeRef.current - 0.04, 0);
    }
  });

  // Fixed LED count — desktop-ultra, no LOD
  const ledCount = LED_COUNT;

  // ■■ Geometry parameters ■■
  const coreRadius = 0.035;
  const diffuserRadius = 0.065;
  const glowRadius = 0.25;
  const ledSize: [number, number, number] = [0.014, 0.006, 0.004]; // Flat rectangular blocks (runway lights)
  const bracketSize: [number, number, number] = [0.025, 0.06, 0.015];

  const coreTubularSegs = 128;
  const coreRadialSegs = 12;
  const diffuserTubularSegs = Math.round(coreTubularSegs * 0.75);
  const diffuserRadialSegs = Math.max(coreRadialSegs - 2, 4);
  const glowTubularSegs = Math.round(coreTubularSegs * 0.5);

  const bracketCount = Math.max(4, Math.floor(ledCount / BRACKET_INTERVAL));

  const enableEffects = true;
  const enableAccentRims = true; // D3D-1: Always enabled (desktop-ultra)
  const enableDiffuser = true;
  const enableGlow = true; // D3D-1: Always enabled (desktop-ultra)

  // ■■ Build curves ■■
  const { totalWrapArc, panelRadius } = COCKPIT_GEOMETRY;

  const mainCurve = useMemo(() => {
    if (!curved) return null;
    const pts = generateArcPoints(Math.max(ledCount, 64), totalWrapArc, panelRadius);
    return buildCurve(pts);
  }, [curved, ledCount, totalWrapArc, panelRadius]);

  const accentCurves = useMemo(() => {
    if (!curved || !enableAccentRims) return [];
    return ACCENT_RIMS.map((rim) => {
      const pts = generateArcPoints(
        Math.max(Math.round(ledCount * rim.ledFraction), 16),
        totalWrapArc * rim.scale,
        panelRadius,
        rim.yOffset,
        rim.radiusOffset,
      );
      return { curve: buildCurve(pts), config: rim };
    });
  }, [curved, enableAccentRims, ledCount, totalWrapArc, panelRadius]);

  // Position at top of cockpit frame
  const yPos = viewport.height * 0.48;

  // ■■ Curved rendering (CPA mode) — desktop-only, no flat fallback ■■
  if (!curved || !mainCurve) return null;

  return (
    <group position={[0, yPos, 0]}>
      {/* === PRIMARY RIM === */}
      {/* Inner core tube — metallic spine */}
      <CoreTube
        curve={mainCurve}
        tubularSegments={coreTubularSegs}
        radialSegments={coreRadialSegs}
        radius={coreRadius}
        color={color}
        pulseRef={pulseRef}
        spikeRef={spikeRef}
      />

      {/* LED strip — instanced rectangular blocks along arc */}
      <LEDStrip
        curve={mainCurve}
        ledCount={ledCount}
        ledSize={ledSize}
        color={color}
        pulseBase={pulseRef}
        spikeVal={spikeRef}
        enableEffects={enableEffects}
      />

      {/* Outer diffuser shell — frosted transmission envelope */}
      {enableDiffuser && (
        <DiffuserShell
          curve={mainCurve}
          tubularSegments={diffuserTubularSegs}
          radialSegments={diffuserRadialSegs}
          radius={diffuserRadius}
          color={color}
          pulseRef={pulseRef}
        />
      )}

      {/* Soft glow halo — additive bloom layer */}
      {enableGlow && (
        <GlowHalo
          curve={mainCurve}
          tubularSegments={glowTubularSegs}
          radius={glowRadius}
          color={color}
          pulseRef={pulseRef}
          spikeRef={spikeRef}
        />
      )}

      {/* Mounting brackets — connect rim to panel surface */}
      <MountingBrackets
        curve={mainCurve}
        bracketCount={bracketCount}
        bracketSize={bracketSize}
        color={color}
      />

      {/* === SECONDARY ACCENT RIMS === */}
      {accentCurves.map(({ curve: ac, config: cfg }, idx) => {
        const accentLedCount = Math.max(
          Math.round(ledCount * cfg.ledFraction),
          16,
        );
        const accentBracketCount = Math.max(
          2,
          Math.floor(accentLedCount / (BRACKET_INTERVAL * 2)),
        );
        const accentCoreTubSegs = Math.round(coreTubularSegs * 0.6);
        const accentCoreRadSegs = Math.max(coreRadialSegs - 2, 4);
        const accentLedSize: [number, number, number] = [0.008, 0.004, 0.003]; // Proportionally flatter for accents
        const accentBracketSz: [number, number, number] = [0.018, 0.04, 0.012];

        return (
          <group key={idx}>
            {/* Accent core tube */}
            <CoreTube
              curve={ac}
              tubularSegments={accentCoreTubSegs}
              radialSegments={accentCoreRadSegs}
              radius={coreRadius * 0.7}
              color={color}
              pulseRef={pulseRef}
              spikeRef={spikeRef}
            />

            {/* Accent LED strip */}
            <LEDStrip
              curve={ac}
              ledCount={accentLedCount}
              ledSize={accentLedSize}
              color={color}
              pulseBase={pulseRef}
              spikeVal={spikeRef}
              enableEffects={enableEffects}
            />

            {/* Accent diffuser */}
            {enableDiffuser && (
              <DiffuserShell
                curve={ac}
                tubularSegments={Math.round(diffuserTubularSegs * 0.6)}
                radialSegments={Math.max(diffuserRadialSegs - 1, 3)}
                radius={diffuserRadius * 0.7}
                color={color}
                pulseRef={pulseRef}
              />
            )}

            {/* Accent mounting brackets */}
            <MountingBrackets
              curve={ac}
              bracketCount={accentBracketCount}
              bracketSize={accentBracketSz}
              color={color}
            />
          </group>
        );
      })}
    </group>
  );
}
