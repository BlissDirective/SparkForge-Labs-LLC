'use client';

// ================================================================
// SparkForge CrystalShatter — ~7s Cinematic Entry Sequence
// ================================================================
// Decision 1.1: Voronoi fracture (simplified as instanced shards)
// Decision 1.2: Both landing + dashboard entry
// Decision 1.3: Sound on first, optional via child settings
// Decision 1.4: Skip btn + tap-to-skip
// Decision 1.5: Shards reform into chrome bezel outline
// Decision 1.6: ~7s total (5 phases)
// Decision 1.7: Particles coalesce into crystal letters
//
// Phase 1 — Void Awakening (0 - 1.5s): Point of light + ambient dust
// Phase 2 — Logo Crystallization (1.5 - 3.0s): Particles coalesce into letters
// Phase 3 — Energy Surge (3.0 - 4.5s): Lightning arcs + pulse
// Phase 4 — Voronoi Shatter (4.5 - 5.5s): Letters break into shards
// Phase 5 — Station Formation (5.5 - 7.0s): Shards reform into frame
//
// Masks initial data loading (auth check, profile fetch, progress data).
// Unmounts completely after Phase 5. Zero ongoing GPU cost.

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ■■ Phase timing constants ■■
const PHASE_TIMINGS = {
  VOID_START: 0,
  VOID_END: 1.5,
  CRYSTAL_START: 1.5,
  CRYSTAL_END: 3.0,
  SURGE_START: 3.0,
  SURGE_END: 4.5,
  SHATTER_START: 4.5,
  SHATTER_END: 5.5,
  FORM_START: 5.5,
  FORM_END: 7.0,
  TOTAL: 7.0,
};

// ■■ Shard data (pre-computed "Voronoi-like" fragments) ■■
const SHARD_COUNT = 200;

function generateShardData() {
  const offsets = new Float32Array(SHARD_COUNT * 3);
  const velocities = new Float32Array(SHARD_COUNT * 3);
  const scales = new Float32Array(SHARD_COUNT);
  const rotations = new Float32Array(SHARD_COUNT * 3);
  const targetPositions = new Float32Array(SHARD_COUNT * 3);

  for (let i = 0; i < SHARD_COUNT; i++) {
    const i3 = i * 3;

    // Starting position: clustered around center (letter positions)
    offsets[i3] = (Math.random() - 0.5) * 6;
    offsets[i3 + 1] = (Math.random() - 0.5) * 2;
    offsets[i3 + 2] = (Math.random() - 0.5) * 1;

    // Explosion velocity (radial + gravity)
    const angle = Math.random() * Math.PI * 2;
    const force = 2 + Math.random() * 4;
    velocities[i3] = Math.cos(angle) * force;
    velocities[i3 + 1] = Math.sin(angle) * force + Math.random() * 2;
    velocities[i3 + 2] = (Math.random() - 0.5) * force;

    scales[i] = 0.02 + Math.random() * 0.08;

    rotations[i3] = Math.random() * Math.PI * 2;
    rotations[i3 + 1] = Math.random() * Math.PI * 2;
    rotations[i3 + 2] = Math.random() * Math.PI * 2;

    // Target: frame outline positions (rectangular border)
    const side = Math.floor(Math.random() * 4);
    const t = Math.random();
    const frameW = 8;
    const frameH = 5;

    switch (side) {
      case 0: // top
        targetPositions[i3] = (t - 0.5) * frameW;
        targetPositions[i3 + 1] = frameH / 2;
        break;
      case 1: // bottom
        targetPositions[i3] = (t - 0.5) * frameW;
        targetPositions[i3 + 1] = -frameH / 2;
        break;
      case 2: // left
        targetPositions[i3] = -frameW / 2;
        targetPositions[i3 + 1] = (t - 0.5) * frameH;
        break;
      case 3: // right
        targetPositions[i3] = frameW / 2;
        targetPositions[i3 + 1] = (t - 0.5) * frameH;
        break;
    }
    targetPositions[i3 + 2] = 0;
  }

  return { offsets, velocities, scales, rotations, targetPositions };
}

// ■■ Inner Scene Component ■■
function CrystalScene({ onComplete }: { onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const shardsRef = useRef<THREE.InstancedMesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const startTime = useRef(0);
  const completedRef = useRef(false);

  const shardData = useMemo(() => generateShardData(), []);

  // Dust particles for Phase 1
  const dustPositions = useMemo(() => {
    const pos = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
    }
    return pos;
  }, []);

  // Shard instance setup
  useEffect(() => {
    if (!shardsRef.current) return;

    const mesh = shardsRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < SHARD_COUNT; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (startTime.current === 0) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current;
    const T = PHASE_TIMINGS;

    // Phase 1: Void Awakening — point light grows
    if (elapsed < T.VOID_END && lightRef.current) {
      const progress = elapsed / T.VOID_END;
      lightRef.current.intensity = progress * 3;
      lightRef.current.distance = 2 + progress * 8;

      // Dust drift
      if (dustRef.current) {
        const posAttr = dustRef.current.geometry.attributes.position;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < 100; i++) {
          arr[i * 3 + 1] += 0.002; // slow upward drift
        }
        (posAttr as THREE.BufferAttribute).needsUpdate = true;
        (dustRef.current.material as THREE.PointsMaterial).opacity =
          progress * 0.3;
      }
    }

    // Phase 2: Logo Crystallization — shards converge to center
    if (
      elapsed >= T.CRYSTAL_START &&
      elapsed < T.CRYSTAL_END &&
      shardsRef.current
    ) {
      const progress =
        (elapsed - T.CRYSTAL_START) / (T.CRYSTAL_END - T.CRYSTAL_START);
      const dummy = new THREE.Object3D();
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      for (let i = 0; i < SHARD_COUNT; i++) {
        const i3 = i * 3;
        // Converge from scattered to letter positions
        const startX = shardData.offsets[i3] * 3;
        const startY = shardData.offsets[i3 + 1] * 3;
        const startZ = shardData.offsets[i3 + 2] * 3 - 5;

        dummy.position.set(
          THREE.MathUtils.lerp(startX, shardData.offsets[i3], eased),
          THREE.MathUtils.lerp(startY, shardData.offsets[i3 + 1], eased),
          THREE.MathUtils.lerp(startZ, shardData.offsets[i3 + 2], eased)
        );
        dummy.scale.setScalar(shardData.scales[i] * eased);
        dummy.rotation.set(
          shardData.rotations[i3] * (1 - eased),
          shardData.rotations[i3 + 1] * (1 - eased),
          shardData.rotations[i3 + 2] * (1 - eased)
        );
        dummy.updateMatrix();
        shardsRef.current.setMatrixAt(i, dummy.matrix);
      }
      shardsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Phase 3: Energy Surge — pulse + glow
    if (elapsed >= T.SURGE_START && elapsed < T.SURGE_END) {
      const progress =
        (elapsed - T.SURGE_START) / (T.SURGE_END - T.SURGE_START);
      if (lightRef.current) {
        lightRef.current.intensity =
          3 + Math.sin(progress * Math.PI * 4) * 2;
        lightRef.current.color.setHex(0x00bbff);
      }
    }

    // Phase 4: Shatter — explode outward
    if (
      elapsed >= T.SHATTER_START &&
      elapsed < T.SHATTER_END &&
      shardsRef.current
    ) {
      const progress =
        (elapsed - T.SHATTER_START) / (T.SHATTER_END - T.SHATTER_START);
      const dummy = new THREE.Object3D();
      const eased = progress * progress; // easeInQuad

      for (let i = 0; i < SHARD_COUNT; i++) {
        const i3 = i * 3;
        dummy.position.set(
          shardData.offsets[i3] + shardData.velocities[i3] * eased,
          shardData.offsets[i3 + 1] +
            shardData.velocities[i3 + 1] * eased -
            eased * eased * 2,
          shardData.offsets[i3 + 2] + shardData.velocities[i3 + 2] * eased
        );
        dummy.scale.setScalar(shardData.scales[i] * (1 - eased * 0.5));
        dummy.rotation.set(
          shardData.rotations[i3] + progress * 5,
          shardData.rotations[i3 + 1] + progress * 3,
          shardData.rotations[i3 + 2] + progress * 4
        );
        dummy.updateMatrix();
        shardsRef.current.setMatrixAt(i, dummy.matrix);
      }
      shardsRef.current.instanceMatrix.needsUpdate = true;

      // Flash on shatter start
      if (lightRef.current && progress < 0.2) {
        lightRef.current.intensity = 8;
        lightRef.current.color.setHex(0xffffff);
      }
    }

    // Phase 5: Station Formation — shards spiral to frame outline
    if (
      elapsed >= T.FORM_START &&
      elapsed < T.FORM_END &&
      shardsRef.current
    ) {
      const progress =
        (elapsed - T.FORM_START) / (T.FORM_END - T.FORM_START);
      const dummy = new THREE.Object3D();
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      for (let i = 0; i < SHARD_COUNT; i++) {
        const i3 = i * 3;

        // Spiral path: r decreases, theta increases
        const theta = eased * Math.PI * 3 + i * 0.05;
        const r = (1 - eased) * 3;

        // Current scattered position
        const scatterX =
          shardData.offsets[i3] + shardData.velocities[i3] * 1;
        const scatterY =
          shardData.offsets[i3 + 1] +
          shardData.velocities[i3 + 1] * 1 -
          2;

        // Target frame position
        const targetX = shardData.targetPositions[i3];
        const targetY = shardData.targetPositions[i3 + 1];

        // Spiral interpolation
        const midX =
          THREE.MathUtils.lerp(scatterX, targetX, eased) +
          Math.cos(theta) * r;
        const midY =
          THREE.MathUtils.lerp(scatterY, targetY, eased) +
          Math.sin(theta) * r;

        dummy.position.set(
          midX,
          midY,
          THREE.MathUtils.lerp(-2, 0, eased)
        );
        dummy.scale.setScalar(shardData.scales[i] * (1 - eased * 0.7));
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        shardsRef.current.setMatrixAt(i, dummy.matrix);
      }
      shardsRef.current.instanceMatrix.needsUpdate = true;

      // Fade light to station glow
      if (lightRef.current) {
        lightRef.current.intensity = THREE.MathUtils.lerp(3, 0.5, eased);
        lightRef.current.color.set('#00BBFF');
      }
    }

    // Complete
    if (elapsed >= T.TOTAL && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central point light */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 2]}
        intensity={0}
        color="#00BBFF"
        distance={10}
      />

      {/* Ambient dust (Phase 1) */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00BBFF"
          size={0.03}
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Instanced shard mesh (Phases 2-5) */}
      <instancedMesh
        ref={shardsRef}
        args={[undefined, undefined, SHARD_COUNT]}
      >
        <boxGeometry args={[1, 1, 0.3]} />
        <meshPhysicalMaterial
          color="#88ccff"
          metalness={0.1}
          roughness={0.1}
          transparent
          opacity={0.8}
          envMapIntensity={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </instancedMesh>

      {/* Bloom for glow effect */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </group>
  );
}

// ■■ Main Overlay Component ■■
interface CrystalShatterProps {
  onComplete?: () => void;
  enableSound?: boolean;
}

export function CrystalShatter({
  onComplete,
}: CrystalShatterProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleComplete = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 500); // 500ms fade out
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleSkip}
      role="presentation"
      aria-label="Loading animation — click to skip"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <CrystalScene onComplete={handleComplete} />
      </Canvas>

      {/* Skip button (Decision 1.4) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        className="absolute bottom-6 right-6 px-4 py-2 text-sm text-white/50 hover:text-white/80 border border-white/20 hover:border-white/40 rounded-lg backdrop-blur-sm transition-all duration-200 z-[51]"
        aria-label="Skip intro animation"
      >
        Skip
      </button>
    </div>
  );
}
