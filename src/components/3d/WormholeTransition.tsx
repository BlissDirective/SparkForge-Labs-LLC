'use client';

// ════════════════════════════════════════════════════
// WormholeTransition — Animated Tunnel for Lab Entrance
// ════════════════════════════════════════════════════
// 20M cockpit upgrade component. Triangle budget: 300,000.
// Renders an animated wormhole tunnel when transitioning

//
// Animation phases (2s total):
//   0.0–0.5s  Entry portal ring grows, tunnel fades in
//   0.5–1.5s  Speed lines stream through tunnel
//   1.5–2.0s  Exit portal grows, tunnel fades out
//   2.0s      onComplete callback fires
//
// direction='exit' reverses the entire sequence.

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ■■ Props ■■
interface WormholeTransitionProps {
  active: boolean;
  labColor?: string;
  direction?: 'enter' | 'exit';
  onComplete?: () => void;
}

// ■■ Constants ■■
const TUNNEL_LENGTH = 20;
const TUNNEL_RADIUS = 4;
const DURATION = 2.0;
const SPEED_LINE_LENGTH = 3;
const SPEED_LINE_RADIUS = 0.015;
const DESTINATION_SPHERE_MAX_RADIUS = 1.2;

// ■■ Speed Line Data ■■
interface SpeedLineData {
  angle: number;
  radius: number;
  zOffset: number;
  speed: number;
}

function generateSpeedLines(count: number): SpeedLineData[] {
  const lines: SpeedLineData[] = [];
  for (let i = 0; i < count; i++) {
    lines.push({
      angle: Math.random() * Math.PI * 2,
      radius: 0.6 + Math.random() * (TUNNEL_RADIUS - 1.2),
      zOffset: Math.random() * TUNNEL_LENGTH,
      speed: 8 + Math.random() * 12,
    });
  }
  return lines;
}

// ■■ Helpers ■■
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ■■ Component ■■
export function WormholeTransition({
  active,
  labColor = '#00BBFF',
  direction = 'enter',
  onComplete,
}: WormholeTransitionProps) {
  // LOD

  // Derived LOD values
  const segments = 64;
  const speedLineCount = Math.round(120 * 1.0);

  // Refs
  const groupRef = useRef<THREE.Group>(null);
  const tunnelRef = useRef<THREE.Mesh>(null);
  const wallLayer1Ref = useRef<THREE.Mesh>(null);
  const wallLayer2Ref = useRef<THREE.Mesh>(null);
  const wallLayer3Ref = useRef<THREE.Mesh>(null);
  const entryRingRef = useRef<THREE.Mesh>(null);
  const exitRingRef = useRef<THREE.Mesh>(null);
  const speedLinesRef = useRef<THREE.InstancedMesh>(null);
  const destinationRef = useRef<THREE.Mesh>(null);

  // State
  const [elapsed, setElapsed] = useState(0);
  const completedRef = useRef(false);

  // Memoized data
  const color = useMemo(() => new THREE.Color(labColor), [labColor]);
  const speedLineData = useMemo(() => generateSpeedLines(speedLineCount), [speedLineCount]);

  // Dummy matrix for instanced mesh updates
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Reset when becoming active
  const wasActive = useRef(false);
  if (active && !wasActive.current) {
    setElapsed(0);
    completedRef.current = false;
  }
  wasActive.current = active;

  // ■■ Frame Loop ■■
  useFrame((_state: unknown, delta: number) => {
    if (!active || completedRef.current) return;

    const newElapsed = Math.min(elapsed + delta, DURATION);
    setElapsed(newElapsed);

    // Normalized time 0..1, reversed for 'exit'
    const rawT = newElapsed / DURATION;
    const t = direction === 'exit' ? 1 - rawT : rawT;

    // ── Phase calculations ──
    // Entry ring: grows 0..0.25 normalized
    const entryPhase = Math.min(t / 0.25, 1);
    // Tunnel: fades in 0..0.25, holds, fades out 0.75..1.0
    const tunnelAlpha =
      t < 0.25 ? easeOut(t / 0.25) : t > 0.75 ? easeOut((1 - t) / 0.25) : 1;
    // Speed lines: active 0.25..0.75
    const speedPhase = t < 0.25 ? 0 : t > 0.75 ? 0 : (t - 0.25) / 0.5;
    // Exit ring: grows 0.75..1.0
    const exitPhase = t < 0.75 ? 0 : easeInOut((t - 0.75) / 0.25);
    // Destination sphere: grows throughout
    const destPhase = easeInOut(t);

    // ── Entry Portal Ring ──
    if (entryRingRef.current) {
      const scale = easeOut(entryPhase);
      entryRingRef.current.scale.setScalar(scale);
      const mat = entryRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = scale * 0.9;
    }

    // ── Exit Portal Ring ──
    if (exitRingRef.current) {
      const scale = easeOut(exitPhase);
      exitRingRef.current.scale.setScalar(scale);
      const mat = exitRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = scale * 0.9;
    }

    // ── Tunnel ──
    if (tunnelRef.current) {
      const mat = tunnelRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = tunnelAlpha * 0.3;
    }

    // ── Swirling Energy Walls ──
    const walls = [wallLayer1Ref.current, wallLayer2Ref.current, wallLayer3Ref.current];
    const rotSpeeds = [0.4, -0.6, 0.8];
    walls.forEach((wall, i) => {
      if (!wall) return;
      wall.rotation.z += rotSpeeds[i] * delta;
      const mat = wall.material as THREE.MeshBasicMaterial;
      mat.opacity = tunnelAlpha * (0.08 + i * 0.03);
    });

    // ── Speed Lines (InstancedMesh) ──
    if (speedLinesRef.current) {
      const alpha = speedPhase > 0 ? 0.6 : 0;
      (speedLinesRef.current.material as THREE.MeshBasicMaterial).opacity = alpha;

      for (let i = 0; i < speedLineData.length; i++) {
        const line = speedLineData[i];
        // Position on tunnel wall in a ring
        const x = Math.cos(line.angle) * line.radius;
        const y = Math.sin(line.angle) * line.radius;
        // Move through tunnel
        let z = -(line.zOffset + newElapsed * line.speed) % (TUNNEL_LENGTH + SPEED_LINE_LENGTH);
        if (z > 0) z -= TUNNEL_LENGTH + SPEED_LINE_LENGTH;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        speedLinesRef.current.setMatrixAt(i, dummy.matrix);
      }
      speedLinesRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Destination Sphere ──
    if (destinationRef.current) {
      const radius = destPhase * DESTINATION_SPHERE_MAX_RADIUS;
      destinationRef.current.scale.setScalar(radius);
      const mat = destinationRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = destPhase * 0.8;
    }

    // ── Completion ──
    if (newElapsed >= DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  // ■■ Bail if inactive ■■
  if (!active) return null;

  
  const cylSegments = Math.max(segments, 12);
  const torusSegments = Math.max(Math.round(segments * 0.75), 8);
  const torusTube = Math.max(Math.round(segments * 0.5), 6);

  return (
    <group ref={groupRef}>
      {/* ── Tunnel Interior (BackSide) ── */}
      <mesh ref={tunnelRef} position={[0, 0, -TUNNEL_LENGTH / 2]}>
        <cylinderGeometry
          args={[
            TUNNEL_RADIUS,
            TUNNEL_RADIUS,
            TUNNEL_LENGTH,
            cylSegments,
            1,
            true, // open-ended
          ]}
        />
        <meshBasicMaterial
          color={color}
          side={THREE.BackSide}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ── Swirling Energy Wall Layer 1 ── */}
      <mesh
        ref={wallLayer1Ref}
        position={[0, 0, -TUNNEL_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[
            TUNNEL_RADIUS * 0.95,
            TUNNEL_RADIUS * 0.95,
            TUNNEL_LENGTH,
            cylSegments,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          color={color}
          side={THREE.BackSide}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ── Swirling Energy Wall Layer 2 ── */}
      <mesh
        ref={wallLayer2Ref}
        position={[0, 0, -TUNNEL_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, Math.PI / 3]}
      >
        <cylinderGeometry
          args={[
            TUNNEL_RADIUS * 0.88,
            TUNNEL_RADIUS * 0.88,
            TUNNEL_LENGTH,
            cylSegments,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          color={color}
          side={THREE.BackSide}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ── Swirling Energy Wall Layer 3 ── */}
      <mesh
        ref={wallLayer3Ref}
        position={[0, 0, -TUNNEL_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, (Math.PI * 2) / 3]}
      >
        <cylinderGeometry
          args={[
            TUNNEL_RADIUS * 0.80,
            TUNNEL_RADIUS * 0.80,
            TUNNEL_LENGTH,
            cylSegments,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          color={color}
          side={THREE.BackSide}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ── Entry Portal Ring (z=0) ── */}
      <mesh ref={entryRingRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <torusGeometry
          args={[
            TUNNEL_RADIUS * 1.1,
            0.15,
            torusTube,
            torusSegments,
          ]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ── Exit Portal Ring (z=-20) ── */}
      <mesh ref={exitRingRef} position={[0, 0, -TUNNEL_LENGTH]} rotation={[0, 0, 0]}>
        <torusGeometry
          args={[
            TUNNEL_RADIUS * 1.1,
            0.15,
            torusTube,
            torusSegments,
          ]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ── Speed Lines (InstancedMesh) ── */}
      <instancedMesh
        ref={speedLinesRef}
        args={[undefined, undefined, speedLineCount]}
        frustumCulled={false}
      >
        <cylinderGeometry
          args={[
            SPEED_LINE_RADIUS,
            SPEED_LINE_RADIUS,
            SPEED_LINE_LENGTH,
            4,
            1,
            false,
          ]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>

      {/* ── Lab Destination Preview ── */}
      <mesh ref={destinationRef} position={[0, 0, -TUNNEL_LENGTH]}>
        <sphereGeometry
          args={[
            1,
            Math.max(Math.round(segments * 0.5), 8),
            Math.max(Math.round(segments * 0.5), 8),
          ]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default WormholeTransition;
