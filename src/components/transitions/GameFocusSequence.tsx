'use client';

// ================================================================
// SparkForge GameFocusSequence — Crystal Tunnel Game Entry
// ================================================================
// Decision 3.1: Crystal tunnel overlay (0.8s)
// Decision 3.4: Frame dimmed during games
//
// Hex crystal rings rush toward camera in lab's accent color.
// 15-20 rings in flight via InstancedMesh.
// Lab-colored emissive material. GPU: ~2ms for 0.8s.
// Transient overlay — unmounts entirely after completion.

import { useRef, useMemo, useCallback, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import {
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  InstancedMesh,
  Object3D,
  Path,
  Shape,
} from 'three';

// Hex ring count
const RING_COUNT = 18;

// Generate hex ring geometry (flat hexagonal torus)
function createHexRingGeometry(): BufferGeometry {
  const shape = new Shape();
  const sides = 6;
  const outerRadius = 1.0;
  const innerRadius = 0.85;

  // Outer hex
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 6;
    const x = Math.cos(angle) * outerRadius;
    const y = Math.sin(angle) * outerRadius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  // Inner hex (hole)
  const hole = new Path();
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 6;
    const x = Math.cos(angle) * innerRadius;
    const y = Math.sin(angle) * innerRadius;
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  shape.holes.push(hole);

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: false,
  });

  return geometry;
}

// Inner 3D scene
function TunnelScene({
  color,
  onComplete,
}: {
  color: string;
  onComplete: () => void;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const startTime = useRef(0);
  const completedRef = useRef(false);

  const hexGeometry = useMemo(() => createHexRingGeometry(), []);

  // Initialize ring positions along z-axis
  const ringData = useMemo(() => {
    const data = [];
    for (let i = 0; i < RING_COUNT; i++) {
      data.push({
        z: -30 - i * 4, // Spread far behind camera
        speed: 35 + Math.random() * 15, // z-velocity
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
        scale: 2.0 + Math.random() * 1.5,
      });
    }
    return data;
  }, []);

  // Setup instanced mesh
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new Object3D();
    for (let i = 0; i < RING_COUNT; i++) {
      dummy.position.set(0, 0, ringData[i].z);
      dummy.scale.setScalar(ringData[i].scale);
      dummy.rotation.z = ringData[i].rotation;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [ringData]);

  useFrame(({ clock }) => {
    if (startTime.current === 0) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current;
    if (!meshRef.current) return;

    const dummy = new Object3D();
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = ringData[i];
      // Move rings toward camera (positive z)
      const z = ring.z + elapsed * ring.speed;
      const rotation = ring.rotation + elapsed * ring.rotSpeed;

      dummy.position.set(0, 0, z);
      dummy.scale.setScalar(ring.scale * (1.0 + Math.max(0, z) * 0.1));
      dummy.rotation.z = rotation;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Complete after 0.8s
    if (elapsed >= 0.8 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <>
      {/* Instanced hex rings */}
      <instancedMesh ref={meshRef} args={[hexGeometry, undefined, RING_COUNT]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          toneMapped={false}
          side={DoubleSide}
        />
      </instancedMesh>

      {/* Central forward light */}
      <pointLight position={[0, 0, -5]} intensity={2} color={color} distance={20} />

      {/* Bloom for glow trails */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// Main overlay component
interface GameFocusSequenceProps {
  labColor?: string;
  onComplete?: () => void;
  onStart?: () => void;
}

export function GameFocusSequence({
  labColor = '#00BBFF',
  onComplete,
  onStart,
}: GameFocusSequenceProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    onStart?.();
  }, [onStart]);

  const handleComplete = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 200); // Quick 200ms fade out
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/90 transition-opacity duration-200 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <TunnelScene color={labColor} onComplete={handleComplete} />
        </Suspense>
      </Canvas>

      {/* Speed lines CSS overlay for extra effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, ${labColor}10 70%, ${labColor}20 100%)`,
        }}
      />
    </div>
  );
}
