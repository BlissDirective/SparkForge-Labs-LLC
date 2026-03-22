'use client';

// ================================================================
// CPA v2.0 — StatusBar3D: 3D Gauge-Style Bottom Status Strip
// ================================================================
// 20M Cockpit Upgrade — 500,000 triangle budget
//
// Bottom 5% of viewport: XP speedometer, streak flame, lab progress,
// chrome dividers, all on a 3D console strip with depth.
//
// Sections (left → right):
//   [XP Speedometer] | [Streak Flame] | [10 Lab Indicators]
//
// Triangle budget breakdown (~500K):
//   Base strip + chrome:       ~8,000
//   XP speedometer:          ~180,000
//   Streak flame sculpture:   ~60,000
//   10 lab indicators:       ~200,000
//   Chrome divider pillars:   ~12,000
//   Tick marks + details:     ~40,000
//
// Data binding:
// - XP, streak: from childStore
// - Session time: from useSessionTracker
// - Lab progress: from useProgress
// - Alerts: derived from toast events

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useLOD, lodTorus, type LODState } from '@/hooks/useLOD';

// ■■ Lab colors for 10 indicators ■■
const LAB_COLORS = [
  '#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88',
  '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
] as const;

interface StatusBarProps {
  xp: number;
  xpMax: number;
  streak: number;
  sessionTime: number;        // seconds
  labProgress: { done: number; total: number };
  labColor: string;
  opacity: number;
}

// ■■ Chrome material factory ■■
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useChromeMaterial(opacity: number) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a2a3a',
        metalness: 0.92,
        roughness: 0.15,
        envMapIntensity: 1.2,
        transparent: true,
        opacity: opacity * 0.85,
      }),
    [opacity]
  );
}

// ■■ Emissive material factory ■■
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEmissiveMaterial(color: string, intensity: number, opacity: number) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#000000',
        emissive: new THREE.Color(color),
        emissiveIntensity: intensity,
        transparent: true,
        opacity,
        toneMapped: false,
        depthWrite: false,
      }),
    [color, intensity, opacity]
  );
}

// ════════════════════════════════════════════════════
// SUB-COMPONENT: XP Speedometer (270° ring gauge)
// ════════════════════════════════════════════════════
function XPSpeedometer({
  xp,
  xpMax,
  labColor,
  opacity,
  segments,
  enableEffects,
}: {
  xp: number;
  xpMax: number;
  labColor: string;
  opacity: number;
  segments: number;
  enableEffects: boolean;
}) {
  const needleRef = useRef<THREE.Mesh>(null);
  const fillRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const xpRatio = xpMax > 0 ? Math.min(xp / xpMax, 1.0) : 0;
  const currentRatio = useRef(xpRatio);

  const labColorObj = useMemo(() => new THREE.Color(labColor), [labColor]);

  // Ring gauge: 270 degrees = 3π/2 radians, starts at bottom-left
  const arcStart = Math.PI * 0.75;  // 135°
  const arcTotal = Math.PI * 1.5;   // 270°

  // Outer ring (track)
  const trackGeo = useMemo(
    () => new THREE.RingGeometry(0.7, 0.82, segments, 1, arcStart, arcTotal),
    [segments, arcStart, arcTotal]
  );

  // Inner ring (thinner track highlight)
  const innerTrackGeo = useMemo(
    () => new THREE.RingGeometry(0.6, 0.68, segments, 1, arcStart, arcTotal),
    [segments, arcStart, arcTotal]
  );

  // Tick marks geometry — 27 ticks spread across arc
  const tickCount = 27;
  const tickGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const angle = arcStart + (i / tickCount) * arcTotal;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const isMajor = i % 3 === 0;
      const innerR = isMajor ? 0.83 : 0.84;
      const outerR = isMajor ? 0.95 : 0.90;
      // Each tick is a thin line (two triangles forming a thin quad)
      const w = isMajor ? 0.012 : 0.006;
      const perpX = -sin * w;
      const perpY = cos * w;
      // Quad corners
      positions.push(cos * innerR + perpX, sin * innerR + perpY, 0.01);
      positions.push(cos * innerR - perpX, sin * innerR - perpY, 0.01);
      positions.push(cos * outerR + perpX, sin * outerR + perpY, 0.01);
      positions.push(cos * outerR - perpX, sin * outerR - perpY, 0.01);
      positions.push(cos * outerR + perpX, sin * outerR + perpY, 0.01);
      positions.push(cos * innerR - perpX, sin * innerR - perpY, 0.01);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [arcStart, arcTotal, tickCount]);

  // Needle geometry — elongated triangle
  const needleGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.03);
    shape.lineTo(0.72, 0);
    shape.lineTo(0, 0.03);
    shape.closePath();
    const extrudeSettings = { depth: 0.025, bevelEnabled: false };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // Needle hub
  const hubGeo = useMemo(
    () => new THREE.CylinderGeometry(0.06, 0.06, 0.05, segments),
    [segments]
  );

  // Fill ring — created dynamically each frame via scale trick
  // We use a full arc geometry and clip via shader or morph
  // Simpler: re-create arc geometry on ratio changes
  const fillArcGeo = useMemo(
    () => new THREE.RingGeometry(0.7, 0.82, segments, 1, arcStart, arcTotal * Math.max(xpRatio, 0.001)),
    [segments, arcStart, arcTotal, xpRatio]
  );

  useFrame((_state, _delta) => {
    currentRatio.current = THREE.MathUtils.lerp(currentRatio.current, xpRatio, 0.04);

    // Rotate needle to match XP ratio
    if (needleRef.current) {
      const targetAngle = arcStart + currentRatio.current * arcTotal;
      needleRef.current.rotation.z = targetAngle;
    }

    // Pulse glow
    if (glowRef.current && enableEffects) {
      glowRef.current.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.5;
    }
  });

  return (
    <group>
      {/* Speedometer backing plate (depth) */}
      <mesh position={[0, 0, -0.04]}>
        <cylinderGeometry args={[1.0, 1.0, 0.06, segments]} />
        <meshStandardMaterial
          color="#0a0e16"
          metalness={0.8}
          roughness={0.3}
          transparent
          opacity={opacity * 0.7}
        />
      </mesh>

      {/* Outer track ring (dark) */}
      <mesh geometry={trackGeo} position={[0, 0, 0.01]}>
        <meshStandardMaterial
          color="#1a1e2e"
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={opacity * 0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner track ring */}
      <mesh geometry={innerTrackGeo} position={[0, 0, 0.005]}>
        <meshStandardMaterial
          color="#111118"
          metalness={0.5}
          roughness={0.5}
          transparent
          opacity={opacity * 0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Fill arc (emissive, lab-colored) */}
      <mesh ref={fillRef} geometry={fillArcGeo} position={[0, 0, 0.02]}>
        <meshStandardMaterial
          color="#000000"
          emissive={labColorObj}
          emissiveIntensity={2.5}
          transparent
          opacity={opacity * 0.85}
          toneMapped={false}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Tick marks */}
      <mesh geometry={tickGeo}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.3}
          transparent
          opacity={opacity * 0.6}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Needle */}
      <mesh ref={needleRef} geometry={needleGeo} position={[0, 0, 0.03]}>
        <meshStandardMaterial
          color="#ff2244"
          emissive="#ff2244"
          emissiveIntensity={1.5}
          metalness={0.7}
          roughness={0.2}
          transparent
          opacity={opacity * 0.9}
          toneMapped={false}
        />
      </mesh>

      {/* Needle hub cap */}
      <mesh
        geometry={hubGeo}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.04]}
      >
        <meshStandardMaterial
          color="#2a2a3a"
          metalness={0.95}
          roughness={0.1}
          transparent
          opacity={opacity * 0.9}
        />
      </mesh>

      {/* Chrome bezel ring around speedometer */}
      <mesh position={[0, 0, 0.01]}>
        <torusGeometry args={lodTorus({ segments, tubularSegments: segments * 2 } as unknown as LODState, 0.98, 0.035)} />
        <meshStandardMaterial
          color="#3a3a4a"
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.85}
        />
      </mesh>

      {/* Point light glow at center */}
      {enableEffects && (
        <pointLight
          ref={glowRef}
          color={labColor}
          intensity={1.5}
          distance={2.5}
          decay={2}
          position={[0, 0, 0.15]}
        />
      )}
    </group>
  );
}

// ════════════════════════════════════════════════════
// SUB-COMPONENT: Streak Flame Sculpture
// ════════════════════════════════════════════════════
function StreakFlame({
  streak,
  opacity,
  segments,
  enableEffects,
}: {
  streak: number;
  opacity: number;
  segments: number;
  enableEffects: boolean;
}) {
  const flameGroupRef = useRef<THREE.Group>(null);
  const coneRefs = useRef<(THREE.Mesh | null)[]>([]);

  // 7 overlapping cones for volumetric flame effect
  const flameElements = useMemo(() => {
    const intensity = Math.min(streak, 10) / 10;
    return [
      // Core flame (tallest, brightest)
      { scaleY: 1.0 + intensity * 0.6, scaleXZ: 0.22, y: 0, color: '#FF6644', emissive: 3.0, rotZ: 0 },
      // Inner flames
      { scaleY: 0.8 + intensity * 0.4, scaleXZ: 0.28, y: -0.05, color: '#FF8844', emissive: 2.5, rotZ: 0.15 },
      { scaleY: 0.75 + intensity * 0.35, scaleXZ: 0.26, y: -0.03, color: '#FFAA44', emissive: 2.2, rotZ: -0.12 },
      // Outer flames
      { scaleY: 0.6 + intensity * 0.3, scaleXZ: 0.32, y: -0.08, color: '#FF4422', emissive: 2.0, rotZ: 0.2 },
      { scaleY: 0.55 + intensity * 0.25, scaleXZ: 0.30, y: -0.06, color: '#FF6633', emissive: 1.8, rotZ: -0.18 },
      // Wisp flames (smaller, translucent)
      { scaleY: 0.45 + intensity * 0.2, scaleXZ: 0.18, y: 0.05, color: '#FFCC66', emissive: 2.8, rotZ: 0.1 },
      { scaleY: 0.35 + intensity * 0.15, scaleXZ: 0.14, y: 0.08, color: '#FFEE88', emissive: 3.0, rotZ: -0.08 },
    ];
  }, [streak]);

  // Ember spheres at base
  const emberCount = Math.min(streak, 8);

  useFrame(() => {
    if (!flameGroupRef.current) return;
    const time = Date.now() * 0.001;

    // Animate each cone with flicker
    coneRefs.current.forEach((cone, i) => {
      if (!cone) return;
      const phase = i * 0.7;
      const flickerY = Math.sin(time * 4.5 + phase) * 0.04 + Math.sin(time * 7.2 + phase) * 0.02;
      const flickerX = Math.sin(time * 3.8 + phase * 1.3) * 0.025;
      const flickerScale = 1.0 + Math.sin(time * 5.5 + phase) * 0.08;

      cone.position.y = flameElements[i].y + flickerY;
      cone.position.x = flickerX;
      cone.scale.setScalar(flickerScale);
    });
  });

  if (streak <= 0 && opacity <= 0) return null;

  return (
    <group ref={flameGroupRef}>
      {/* Flame base pedestal */}
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.25, 0.32, 0.12, segments]} />
        <meshStandardMaterial
          color="#1a1822"
          metalness={0.85}
          roughness={0.2}
          transparent
          opacity={opacity * 0.8}
        />
      </mesh>

      {/* Flame cones */}
      {flameElements.map((el, i) => (
        <mesh
          key={`flame-${i}`}
          ref={(ref) => { coneRefs.current[i] = ref; }}
          position={[0, el.y, 0]}
          rotation={[0, 0, el.rotZ]}
        >
          <coneGeometry args={[el.scaleXZ, el.scaleY, segments, 1]} />
          <meshStandardMaterial
            color="#000000"
            emissive={el.color}
            emissiveIntensity={el.emissive * (streak > 0 ? 1 : 0.2)}
            transparent
            opacity={opacity * 0.75}
            toneMapped={false}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Ember spheres at base */}
      {Array.from({ length: emberCount }).map((_, i) => {
        const angle = (i / emberCount) * Math.PI * 2;
        const r = 0.2;
        return (
          <mesh
            key={`ember-${i}`}
            position={[Math.cos(angle) * r, -0.35, Math.sin(angle) * r]}
          >
            <sphereGeometry args={[0.035, Math.max(segments / 2, 6), Math.max(segments / 2, 6)]} />
            <meshStandardMaterial
              color="#000000"
              emissive="#FF8844"
              emissiveIntensity={2.0 + Math.sin(i * 1.5) * 0.5}
              transparent
              opacity={opacity * 0.6}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* Flame point light */}
      {enableEffects && streak > 0 && (
        <pointLight
          color="#FF6644"
          intensity={1.0 + Math.min(streak, 10) * 0.2}
          distance={2.0}
          decay={2}
          position={[0, 0.2, 0.1]}
        />
      )}
    </group>
  );
}

// ════════════════════════════════════════════════════
// SUB-COMPONENT: Lab Progress Indicators (InstancedMesh)
// ════════════════════════════════════════════════════
function LabProgressIndicators({
  labProgress,
  opacity,
  segments,
}: {
  labProgress: { done: number; total: number };
  opacity: number;
  segments: number;
}) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const glowInstancedRef = useRef<THREE.InstancedMesh>(null);
  const baseInstancedRef = useRef<THREE.InstancedMesh>(null);

  const labColors = useMemo(
    () => LAB_COLORS.map((c) => new THREE.Color(c)),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set up instanced transforms + colors
  useEffect(() => {
    if (!instancedRef.current || !glowInstancedRef.current || !baseInstancedRef.current) return;

    const spacing = 0.42;
    const startX = -(9 * spacing) / 2;

    for (let i = 0; i < 10; i++) {
      const x = startX + i * spacing;

      // Main indicator (box)
      dummy.position.set(x, 0, 0);
      dummy.scale.set(0.16, 0.22, 0.12);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);

      // Glow sphere behind each indicator
      dummy.position.set(x, 0, -0.08);
      dummy.scale.set(0.12, 0.12, 0.08);
      dummy.updateMatrix();
      glowInstancedRef.current.setMatrixAt(i, dummy.matrix);

      // Base pedestal
      dummy.position.set(x, -0.18, 0);
      dummy.scale.set(0.08, 0.06, 0.08);
      dummy.updateMatrix();
      baseInstancedRef.current.setMatrixAt(i, dummy.matrix);

      // Set colors
      const isLit = i < labProgress.done;
      const color = isLit ? labColors[i] : new THREE.Color('#1a1e2e');
      instancedRef.current.setColorAt(i, color);
      glowInstancedRef.current.setColorAt(i, isLit ? labColors[i] : new THREE.Color('#0a0e16'));
      baseInstancedRef.current.setColorAt(i, new THREE.Color('#2a2a3a'));
    }

    instancedRef.current.instanceMatrix.needsUpdate = true;
    instancedRef.current.instanceColor!.needsUpdate = true;
    glowInstancedRef.current.instanceMatrix.needsUpdate = true;
    glowInstancedRef.current.instanceColor!.needsUpdate = true;
    baseInstancedRef.current.instanceMatrix.needsUpdate = true;
    baseInstancedRef.current.instanceColor!.needsUpdate = true;
  }, [labProgress.done, labColors, dummy]);

  // Animate lit indicators (gentle pulse)
  useFrame(() => {
    if (!instancedRef.current) return;
    const time = Date.now() * 0.001;
    const spacing = 0.42;
    const startX = -(9 * spacing) / 2;

    for (let i = 0; i < 10; i++) {
      const isLit = i < labProgress.done;
      if (isLit) {
        const pulse = 1.0 + Math.sin(time * 2.5 + i * 0.5) * 0.08;
        dummy.position.set(startX + i * spacing, 0, 0);
        dummy.scale.set(0.16 * pulse, 0.22 * pulse, 0.12 * pulse);
        dummy.rotation.set(0, time * 0.3 + i, 0);
        dummy.updateMatrix();
        instancedRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Main lab indicator boxes (instanced) */}
      <instancedMesh
        ref={instancedRef}
        args={[undefined, undefined, 10]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1, 2, 2, 2]} />
        <meshStandardMaterial
          metalness={0.6}
          roughness={0.3}
          emissiveIntensity={1.8}
          transparent
          opacity={opacity * 0.85}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Glow spheres behind each indicator (instanced) */}
      <instancedMesh
        ref={glowInstancedRef}
        args={[undefined, undefined, 10]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, Math.max(segments / 2, 8), Math.max(segments / 2, 8)]} />
        <meshStandardMaterial
          emissiveIntensity={2.0}
          transparent
          opacity={opacity * 0.4}
          toneMapped={false}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Base pedestals (instanced) */}
      <instancedMesh
        ref={baseInstancedRef}
        args={[undefined, undefined, 10]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 1.2, 1, Math.max(segments / 2, 6)]} />
        <meshStandardMaterial
          metalness={0.9}
          roughness={0.15}
          transparent
          opacity={opacity * 0.7}
        />
      </instancedMesh>

      {/* Connection rail between all indicators */}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[4.2, 0.02, 0.04]} />
        <meshStandardMaterial
          color="#2a2a3a"
          metalness={0.9}
          roughness={0.12}
          transparent
          opacity={opacity * 0.6}
        />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════
// SUB-COMPONENT: Chrome Divider Pillars (InstancedMesh)
// ════════════════════════════════════════════════════
function ChromeDividers({
  positions,
  opacity,
  segments,
  height,
}: {
  positions: number[];
  opacity: number;
  segments: number;
  height: number;
}) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const capInstancedRef = useRef<THREE.InstancedMesh>(null);
  const count = positions.length;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!instancedRef.current || !capInstancedRef.current) return;

    positions.forEach((x, i) => {
      // Main pillar
      dummy.position.set(x, 0, 0);
      dummy.scale.set(0.04, height, 0.04);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instancedRef.current!.setMatrixAt(i, dummy.matrix);

      // Top cap sphere
      dummy.position.set(x, height * 0.5, 0);
      dummy.scale.set(0.06, 0.06, 0.06);
      dummy.updateMatrix();
      capInstancedRef.current!.setMatrixAt(i, dummy.matrix);

      // Bottom cap
      dummy.position.set(x, -height * 0.5, 0);
      dummy.updateMatrix();
      capInstancedRef.current!.setMatrixAt(i + count, dummy.matrix);
    });

    instancedRef.current.instanceMatrix.needsUpdate = true;
    capInstancedRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, height, dummy, count]);

  return (
    <group>
      {/* Pillar shafts (instanced cylinders) */}
      <instancedMesh
        ref={instancedRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 1, 1, segments]} />
        <meshStandardMaterial
          color="#3a3a4a"
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.85}
          envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Cap spheres (instanced, top + bottom) */}
      <instancedMesh
        ref={capInstancedRef}
        args={[undefined, undefined, count * 2]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, Math.max(segments / 2, 8), Math.max(segments / 2, 8)]} />
        <meshStandardMaterial
          color="#4a4a5a"
          metalness={0.95}
          roughness={0.05}
          transparent
          opacity={opacity * 0.85}
          envMapIntensity={1.5}
        />
      </instancedMesh>
    </group>
  );
}

// ════════════════════════════════════════════════════
// MAIN EXPORT: StatusBar3D
// ════════════════════════════════════════════════════
export function StatusBar3D({
  xp,
  xpMax,
  streak,
  sessionTime: _sessionTime,
  labProgress,
  labColor,
  opacity,
}: StatusBarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // LOD-aware rendering
  const lod = useLOD({ tier: 'system' });
  const segments = lod.segments;

  const labColorObj = useMemo(() => new THREE.Color(labColor), [labColor]);

  if (opacity <= 0) return null;

  const barWidth = Math.min(viewport.width * 0.85, 14);
  const barHeight = 0.5;
  const barDepth = 0.12;
  const yPos = -viewport.height * 0.45;

  // Section positions (left to right)
  const xpCenterX = -barWidth * 0.35;
  const streakCenterX = -barWidth * 0.05;
  const progressCenterX = barWidth * 0.25;

  // Divider X positions (between sections)
  const dividerPositions = [
    (xpCenterX + streakCenterX) / 2,
    (streakCenterX + progressCenterX) / 2,
  ];

  return (
    <group ref={groupRef} position={[0, yPos, -3.5]}>
      {/* ─── 3D Base Strip (BoxGeometry with depth) ─── */}
      <mesh position={[0, 0, -barDepth / 2]}>
        <boxGeometry args={[barWidth, barHeight, barDepth]} />
        <meshStandardMaterial
          color="#0e1118"
          metalness={0.85}
          roughness={0.2}
          transparent
          opacity={opacity * 0.75}
          envMapIntensity={1.0}
        />
      </mesh>

      {/* Chrome top edge (extruded strip) */}
      <mesh position={[0, barHeight * 0.5, 0]}>
        <boxGeometry args={[barWidth + 0.04, 0.025, barDepth + 0.02]} />
        <meshStandardMaterial
          color="#3a3a4a"
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.8}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Chrome bottom edge */}
      <mesh position={[0, -barHeight * 0.5, 0]}>
        <boxGeometry args={[barWidth + 0.04, 0.025, barDepth + 0.02]} />
        <meshStandardMaterial
          color="#3a3a4a"
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={opacity * 0.8}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Emissive top highlight line */}
      <mesh position={[0, barHeight * 0.5 + 0.015, 0.01]}>
        <boxGeometry args={[barWidth, 0.006, 0.002]} />
        <meshStandardMaterial
          color="#000000"
          emissive={labColorObj}
          emissiveIntensity={1.2}
          transparent
          opacity={opacity * 0.5}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* ─── Chrome Divider Pillars ─── */}
      <ChromeDividers
        positions={dividerPositions}
        opacity={opacity}
        segments={segments}
        height={barHeight * 0.8}
      />

      {/* ─── XP Speedometer Section (left) ─── */}
      <group position={[xpCenterX, 0, 0.08]} scale={[0.22, 0.22, 0.22]}>
        <XPSpeedometer
          xp={xp}
          xpMax={xpMax}
          labColor={labColor}
          opacity={opacity}
          segments={segments}
          enableEffects={lod.enableEffects}
        />
      </group>

      {/* ─── Streak Flame Section (center-left) ─── */}
      <group position={[streakCenterX, -0.02, 0.08]} scale={[0.35, 0.35, 0.35]}>
        <StreakFlame
          streak={streak}
          opacity={opacity}
          segments={segments}
          enableEffects={lod.enableEffects}
        />
      </group>

      {/* ─── Lab Progress Indicators (right) ─── */}
      <group position={[progressCenterX, 0, 0.08]} scale={[0.45, 0.45, 0.45]}>
        <LabProgressIndicators
          labProgress={labProgress}
          opacity={opacity}
          segments={segments}
        />
      </group>

      {/* ─── Session Time Display (far right, subtle) ─── */}
      <group position={[barWidth * 0.42, 0, 0.06]}>
        {/* Time backing plate */}
        <mesh>
          <boxGeometry args={[0.6, 0.2, 0.03]} />
          <meshStandardMaterial
            color="#111118"
            metalness={0.7}
            roughness={0.3}
            transparent
            opacity={opacity * 0.6}
          />
        </mesh>
        {/* Clock ring indicator */}
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[0.06, 0.075, segments]} />
          <meshStandardMaterial
            color="#000000"
            emissive="#00FF88"
            emissiveIntensity={1.2}
            transparent
            opacity={opacity * 0.7}
            toneMapped={false}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ─── Corner accent bolts (4 corners) ─── */}
      {[
        [-barWidth / 2 + 0.08, barHeight / 2 - 0.08],
        [barWidth / 2 - 0.08, barHeight / 2 - 0.08],
        [-barWidth / 2 + 0.08, -barHeight / 2 + 0.08],
        [barWidth / 2 - 0.08, -barHeight / 2 + 0.08],
      ].map(([cx, cy], i) => (
        <mesh key={`bolt-${i}`} position={[cx, cy, 0.07]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
          <meshStandardMaterial
            color="#4a4a5a"
            metalness={0.95}
            roughness={0.05}
            transparent
            opacity={opacity * 0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
