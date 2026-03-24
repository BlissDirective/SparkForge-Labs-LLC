'use client';

// ================================================================
// CPA v2.0 — HolographicHUD: 500K Triangle Concentric Ring System
// ================================================================
// Decision CPA-4: 10-15% opacity during normal use
// Decision CPA-5: 8 concentric rings + 24 volumetric scan beams + core sphere
//
// Semi-transparent R3F overlay rendered in front of HTML content.
// During normal use: 10-15% opacity (barely visible).
// During celebrations: 80-100% opacity with full animation.
// During game mode: hidden (0% opacity).
//
// Triangle budget: ~500,000 tris (desktop ultra)
// Features:
//   - 8 concentric rings at different z-depths for parallax
//   - Data-display arc segments on inner rings (ExtrudeGeometry)
//   - Reticle targeting crosshair (when active)
//   - 24 volumetric TubeGeometry scan beams
//   - Corner HUD text readouts at cardinal positions
//   - Instanced tick marks along each ring
//   - Multi-layered emissive core sphere

import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { COCKPIT_LOD } from '@/lib/3d/cockpitConfig';

// ■■ Ring configuration ■■
interface RingDef {
  innerRadius: number;
  outerRadius: number;
  zOffset: number;
  rotationDir: number; // 1 = CW, -1 = CCW
  speedMultiplier: number;
  opacityScale: number;
  emissiveScale: number;
}

const RING_DEFS: RingDef[] = [
  { innerRadius: 4.8, outerRadius: 5.1, zOffset: -0.12, rotationDir: -1, speedMultiplier: 1.0, opacityScale: 1.0, emissiveScale: 0.9 },
  { innerRadius: 4.2, outerRadius: 4.45, zOffset: -0.08, rotationDir: 1, speedMultiplier: 0.8, opacityScale: 0.95, emissiveScale: 0.85 },
  { innerRadius: 3.6, outerRadius: 3.82, zOffset: -0.04, rotationDir: -1, speedMultiplier: 0.65, opacityScale: 0.9, emissiveScale: 0.8 },
  { innerRadius: 3.0, outerRadius: 3.2, zOffset: 0.0, rotationDir: 1, speedMultiplier: 0.5, opacityScale: 0.85, emissiveScale: 0.75 },
  { innerRadius: 2.4, outerRadius: 2.58, zOffset: 0.04, rotationDir: -1, speedMultiplier: 0.4, opacityScale: 0.8, emissiveScale: 0.7 },
  { innerRadius: 1.8, outerRadius: 1.96, zOffset: 0.08, rotationDir: 1, speedMultiplier: 0.3, opacityScale: 0.75, emissiveScale: 0.65 },
  { innerRadius: 1.2, outerRadius: 1.36, zOffset: 0.12, rotationDir: -1, speedMultiplier: 0.2, opacityScale: 0.7, emissiveScale: 0.6 },
  { innerRadius: 0.7, outerRadius: 0.84, zOffset: 0.16, rotationDir: 1, speedMultiplier: 0.15, opacityScale: 0.65, emissiveScale: 0.55 },
];

// ■■ Cardinal labels ■■
const CARDINAL_LABELS: Array<{ text: string; angle: number }> = [
  { text: 'SYS:NOMINAL', angle: 0 },
  { text: 'NET:ACTIVE', angle: Math.PI / 2 },
  { text: 'AI:ONLINE', angle: Math.PI },
  { text: 'XP:TRACKING', angle: (3 * Math.PI) / 2 },
];

// ■■ Data arc configuration (inner rings 4-7 display arcs) ■■
interface DataArc {
  ringIndex: number;
  startAngle: number;
  endAngle: number;
  thickness: number;
  dataKey: string;
}

const DATA_ARCS: DataArc[] = [
  { ringIndex: 4, startAngle: 0.2, endAngle: 1.2, thickness: 0.06, dataKey: 'progress' },
  { ringIndex: 4, startAngle: 2.0, endAngle: 3.8, thickness: 0.06, dataKey: 'xp' },
  { ringIndex: 5, startAngle: 0.5, endAngle: 2.1, thickness: 0.05, dataKey: 'streak' },
  { ringIndex: 5, startAngle: 3.5, endAngle: 5.5, thickness: 0.05, dataKey: 'level' },
  { ringIndex: 6, startAngle: 0.0, endAngle: 1.8, thickness: 0.04, dataKey: 'badges' },
  { ringIndex: 6, startAngle: 2.5, endAngle: 4.8, thickness: 0.04, dataKey: 'games' },
  { ringIndex: 7, startAngle: 0.3, endAngle: 2.5, thickness: 0.04, dataKey: 'session' },
  { ringIndex: 7, startAngle: 3.0, endAngle: 5.8, thickness: 0.04, dataKey: 'lab' },
];

interface HolographicHUDProps {
  opacity: number;           // 0.0-1.0, driven by station mode
  color: string;             // Lab accent color
  rotationSpeed: number;     // Outer ring rotation, default 0.1 rad/s
  pulseIntensity: number;    // Core pulse strength, default 0.5
  active: boolean;           // false = return null (game mode)
}

// ■■ Build a single arc Shape for ExtrudeGeometry ■■
function createArcShape(
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  arcSegments: number,
): THREE.Shape {
  const shape = new THREE.Shape();
  const angleStep = (endAngle - startAngle) / arcSegments;

  // Outer arc (forward)
  shape.moveTo(
    Math.cos(startAngle) * outerR,
    Math.sin(startAngle) * outerR,
  );
  for (let i = 1; i <= arcSegments; i++) {
    const a = startAngle + i * angleStep;
    shape.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
  }

  // Inner arc (backward)
  for (let i = arcSegments; i >= 0; i--) {
    const a = startAngle + i * angleStep;
    shape.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
  }

  shape.closePath();
  return shape;
}

// ■■ Build a TubeGeometry scan beam curve ■■
function createScanBeamCurve(angle: number, innerR: number, outerR: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = THREE.MathUtils.lerp(innerR, outerR, t);
    // Slight sinusoidal wobble for visual interest
    const wobble = Math.sin(t * Math.PI) * 0.04;
    points.push(new THREE.Vector3(
      Math.cos(angle + wobble) * r,
      Math.sin(angle + wobble) * r,
      t * 0.1 - 0.05, // slight z variation
    ));
  }
  return new THREE.CatmullRomCurve3(points);
}

export function HolographicHUD({
  opacity,
  color,
  rotationSpeed,
  pulseIntensity,
  active,
}: HolographicHUDProps) {

  // Resolve cockpit LOD tier
  const cockpitLod = useMemo(() => {
    const level = 'ultra' as keyof typeof COCKPIT_LOD;
    return COCKPIT_LOD[level] ?? COCKPIT_LOD.low;
  }, ['ultra']);

  const ringCount = cockpitLod.hudRingCount;
  const ringSegments = cockpitLod.hudRingSegments;
  const scanLineCount = cockpitLod.scanLines;

  // Refs
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const coreOuterRef = useRef<THREE.Mesh>(null);
  const coreInnerRef = useRef<THREE.Mesh>(null);
  const coreCenterRef = useRef<THREE.Mesh>(null);
  const scanGroupRef = useRef<THREE.Group>(null);
  const dataArcGroupRef = useRef<THREE.Group>(null);
  const reticleGroupRef = useRef<THREE.Group>(null);
  const tickInstancedRef = useRef<THREE.InstancedMesh>(null);
  const activeScanRef = useRef(0);

  const hudColor = useMemo(() => new THREE.Color(color), [color]);
  const _hudColorDim = useMemo(() => new THREE.Color(color).multiplyScalar(0.5), [color]);

  // Ring geometries (LOD-driven segments)
  const ringGeometries = useMemo(() => {
    const activeRings = RING_DEFS.slice(0, ringCount);
    return activeRings.map((ring) =>
      new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, ringSegments),
    );
  }, [ringCount, ringSegments]);

  // Data arc geometries (ExtrudeGeometry on arc Shapes)
  const dataArcGeometries = useMemo(() => {
    const arcSegments = Math.max(8, Math.floor(ringSegments / 4));
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: arcSegments,
    };

    return DATA_ARCS.filter((arc) => arc.ringIndex < ringCount).map((arc) => {
      const ring = RING_DEFS[arc.ringIndex];
      const midR = (ring.innerRadius + ring.outerRadius) / 2;
      const shape = createArcShape(
        midR - arc.thickness,
        midR + arc.thickness,
        arc.startAngle,
        arc.endAngle,
        arcSegments,
      );
      return {
        geometry: new THREE.ExtrudeGeometry(shape, extrudeSettings),
        zOffset: ring.zOffset,
        dataKey: arc.dataKey,
      };
    });
  }, [ringCount, ringSegments]);

  // Volumetric scan beam geometries (TubeGeometry)
  const scanBeamGeometries = useMemo(() => {
    const beams: THREE.TubeGeometry[] = [];
    const tubularSegs = Math.max(6, Math.floor(64 / 4));
    for (let i = 0; i < scanLineCount; i++) {
      const angle = (i / scanLineCount) * Math.PI * 2;
      const curve = createScanBeamCurve(angle, 0.9, 5.2);
      beams.push(new THREE.TubeGeometry(curve, tubularSegs, 0.015, 6, false));
    }
    return beams;
  }, [scanLineCount, 64]);

  // Reticle crosshair geometries (4 line meshes)
  const reticleGeo = useMemo(() => {
    return new THREE.BoxGeometry(0.02, 1.4, 0.01);
  }, []);

  // Tick mark instanced geometry + matrix setup
  const tickGeometry = useMemo(() => new THREE.BoxGeometry(0.04, 0.12, 0.01), []);

  const tickMatrices = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const activeRings = RING_DEFS.slice(0, ringCount);
    const ticksPerRing = Math.max(12, Math.floor(ringSegments / 2));
    const tempMatrix = new THREE.Matrix4();
    const tempPos = new THREE.Vector3();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3(1, 1, 1);

    for (let r = 0; r < activeRings.length; r++) {
      const ring = activeRings[r];
      const tickR = ring.outerRadius + 0.08;
      for (let t = 0; t < ticksPerRing; t++) {
        const angle = (t / ticksPerRing) * Math.PI * 2;
        tempPos.set(
          Math.cos(angle) * tickR,
          Math.sin(angle) * tickR,
          ring.zOffset,
        );
        tempQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
        // Every 4th tick is larger
        const isMajor = t % 4 === 0;
        tempScale.set(isMajor ? 1.5 : 1, isMajor ? 1.5 : 1, 1);
        tempMatrix.compose(tempPos, tempQuat, tempScale);
        matrices.push(tempMatrix.clone());
      }
    }
    return matrices;
  }, [ringCount, ringSegments]);

  const tickCount = tickMatrices.length;

  // Set instanced mesh matrices on first render
  const tickInstanceCallback = useCallback(
    (mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      tickInstancedRef.current = mesh;
      for (let i = 0; i < tickMatrices.length; i++) {
        mesh.setMatrixAt(i, tickMatrices[i]);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    [tickMatrices],
  );

  // Core sphere geometries (multi-layered)
  const coreOuterGeo = useMemo(
    () => new THREE.SphereGeometry(0.4, 64, 64),
    [64],
  );
  const coreInnerGeo = useMemo(
    () => new THREE.SphereGeometry(0.25, 64, 64),
    [64],
  );
  const coreCenterGeo = useMemo(
    () => new THREE.SphereGeometry(0.12, Math.max(8, Math.floor(64 / 2)), Math.max(8, Math.floor(64 / 2))),
    [64],
  );

  // ■■ Animation loop ■■
  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;

    // Animate each ring
    for (let i = 0; i < ringCount; i++) {
      const mesh = ringRefs.current[i];
      if (!mesh) continue;
      const def = RING_DEFS[i];
      mesh.rotation.z += def.rotationDir * rotationSpeed * def.speedMultiplier * 0.016;

      // Subtle scale pulse on inner rings
      if (i >= 4) {
        const scale = 1.0 + Math.sin(t * (2.0 + i * 0.3)) * 0.015;
        mesh.scale.set(scale, scale, 1);
      }
    }

    // Core pulsing (multi-layer)
    if (coreOuterRef.current) {
      const mat = coreOuterRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(t * 4.189) * 0.5 + 0.5;
      mat.emissiveIntensity = pulse * pulseIntensity * 1.5;
      coreOuterRef.current.rotation.y += 0.003;
      coreOuterRef.current.rotation.x += 0.001;
    }
    if (coreInnerRef.current) {
      const mat = coreInnerRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(t * 5.5 + 1.0) * 0.5 + 0.5;
      mat.emissiveIntensity = pulse * pulseIntensity * 2.5;
      coreInnerRef.current.rotation.y -= 0.005;
    }
    if (coreCenterRef.current) {
      const mat = coreCenterRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = pulseIntensity * 3.0;
    }

    // Scan beam sweep
    if (scanGroupRef.current) {
      activeScanRef.current = (t * 1.5) % (Math.PI * 2);
      scanGroupRef.current.children.forEach((child, i) => {
        const lineAngle = (i / scanLineCount) * Math.PI * 2;
        const diff = Math.abs(lineAngle - activeScanRef.current);
        const wrappedDiff = Math.min(diff, Math.PI * 2 - diff);
        const isActive = wrappedDiff < 0.25;
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isActive ? 2.0 : 0.25;
        mat.opacity = opacity * (isActive ? 0.8 : 0.4);
      });
    }

    // Data arc breathing
    if (dataArcGroupRef.current) {
      dataArcGroupRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const phase = t * 1.2 + i * 0.7;
        mat.emissiveIntensity = 0.6 + Math.sin(phase) * 0.3;
      });
    }

    // Reticle pulse
    if (reticleGroupRef.current) {
      const reticleScale = 1.0 + Math.sin(t * 6.0) * 0.03;
      reticleGroupRef.current.scale.set(reticleScale, reticleScale, 1);
      reticleGroupRef.current.rotation.z += 0.002;
    }
  });

  if (!active || opacity <= 0) return null;

  return (
    <group position={[0, 0, 0.5]}>
      {/* ════════ 8 Concentric Rings (LOD-driven count) ════════ */}
      {RING_DEFS.slice(0, ringCount).map((ring, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => { ringRefs.current[i] = el; }}
          position={[0, 0, ring.zOffset]}
        >
          <primitive object={ringGeometries[i]} attach="geometry" />
          <meshStandardMaterial
            color="#000000"
            emissive={hudColor}
            emissiveIntensity={ring.emissiveScale}
            transparent
            opacity={opacity * ring.opacityScale}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ════════ Data-Display Arc Segments (ExtrudeGeometry) ════════ */}
      <group ref={dataArcGroupRef}>
        {dataArcGeometries.map((arc, i) => (
          <mesh
            key={`data-arc-${i}`}
            position={[0, 0, arc.zOffset + 0.02]}
          >
            <primitive object={arc.geometry} attach="geometry" />
            <meshStandardMaterial
              color="#000000"
              emissive={hudColor}
              emissiveIntensity={0.7}
              transparent
              opacity={opacity * 0.7}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* ════════ Reticle Targeting Crosshair (4 line meshes) ════════ */}
      <group ref={reticleGroupRef} position={[0, 0, 0.2]}>
        {/* Vertical bar top */}
        <mesh position={[0, 0.85, 0]} geometry={reticleGeo}>
          <meshStandardMaterial
            color="#000000"
            emissive={hudColor}
            emissiveIntensity={1.2}
            transparent
            opacity={opacity * 0.9}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Vertical bar bottom */}
        <mesh position={[0, -0.85, 0]} geometry={reticleGeo}>
          <meshStandardMaterial
            color="#000000"
            emissive={hudColor}
            emissiveIntensity={1.2}
            transparent
            opacity={opacity * 0.9}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Horizontal bar left */}
        <mesh position={[-0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={reticleGeo}>
          <meshStandardMaterial
            color="#000000"
            emissive={hudColor}
            emissiveIntensity={1.2}
            transparent
            opacity={opacity * 0.9}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Horizontal bar right */}
        <mesh position={[0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={reticleGeo}>
          <meshStandardMaterial
            color="#000000"
            emissive={hudColor}
            emissiveIntensity={1.2}
            transparent
            opacity={opacity * 0.9}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ════════ 24 Volumetric Scan Beams (TubeGeometry) ════════ */}
      <group ref={scanGroupRef}>
        {scanBeamGeometries.map((geo, i) => (
          <mesh key={`scan-beam-${i}`}>
            <primitive object={geo} attach="geometry" />
            <meshStandardMaterial
              color="#000000"
              emissive={hudColor}
              emissiveIntensity={0.25}
              transparent
              opacity={opacity * 0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* ════════ Corner HUD Text Readouts (4 cardinal positions) ════════ */}
      {CARDINAL_LABELS.map((label, i) => {
        const r = 5.6;
        const x = Math.cos(label.angle) * r;
        const y = Math.sin(label.angle) * r;
        return (
          <Text
            key={`hud-label-${i}`}
            position={[x, y, 0.05]}
            fontSize={0.18}
            color={color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/JetBrainsMono-Regular.woff"
            fillOpacity={opacity * 0.8}
            outlineWidth={0.005}
            outlineColor="#000000"
          >
            {label.text}
          </Text>
        );
      })}

      {/* ════════ Instanced Tick Marks Along Rings ════════ */}
      {tickCount > 0 && (
        <instancedMesh
          ref={tickInstanceCallback}
          args={[tickGeometry, undefined, tickCount]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            color="#000000"
            emissive={hudColor}
            emissiveIntensity={0.9}
            transparent
            opacity={opacity * 0.75}
            depthWrite={false}
            toneMapped={false}
          />
        </instancedMesh>
      )}

      {/* ════════ Enhanced Multi-Layered Core Sphere ════════ */}
      {/* Outer translucent shell */}
      <mesh ref={coreOuterRef} position={[0, 0, 0.16]}>
        <primitive object={coreOuterGeo} attach="geometry" />
        <meshStandardMaterial
          color="#000000"
          emissive={hudColor}
          emissiveIntensity={1.0}
          transparent
          opacity={opacity * 0.4}
          toneMapped={false}
          depthWrite={false}
          wireframe
        />
      </mesh>
      {/* Inner emissive sphere */}
      <mesh ref={coreInnerRef} position={[0, 0, 0.16]}>
        <primitive object={coreInnerGeo} attach="geometry" />
        <meshStandardMaterial
          color="#000000"
          emissive={hudColor}
          emissiveIntensity={2.0}
          transparent
          opacity={opacity * 0.6}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* Center bright core */}
      <mesh ref={coreCenterRef} position={[0, 0, 0.16]}>
        <primitive object={coreCenterGeo} attach="geometry" />
        <meshStandardMaterial
          color={hudColor}
          emissive={hudColor}
          emissiveIntensity={3.0}
          transparent
          opacity={opacity * 0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
