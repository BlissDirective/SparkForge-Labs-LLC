'use client';

// ================================================================
// SparkForge LEDRim — Emissive Status Strip (CPA v1.0 Updated)
// ================================================================
// Decision 2.1: Part of persistent station frame
// CPA v1.0: Adapted to curved arc path along cockpit panel top edge
// Color = current lab accent (default #00BBFF on dashboard)
// Pulses gently, spikes on events (XP gain, badge earn, level up)
//
// Updated geometry: curved arc using TubeGeometry along a CatmullRomCurve3
// that follows the top edge of the cockpit panels.
// Triangle budget: ~150 tris

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';

interface LEDRimProps {
  color?: string;
  intensity?: number;
  spikeActive?: boolean;
  curved?: boolean;          // CPA: use curved arc (default true)
}

export function LEDRim({
  color = '#00BBFF',
  intensity = 1.0,
  spikeActive = false,
  curved = true,
}: LEDRimProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [spikeIntensity, setSpikeIntensity] = useState(0);
  const { viewport } = useThree();

  // Spike animation on events
  useEffect(() => {
    if (spikeActive) {
      setSpikeIntensity(2.0);
      const timer = setTimeout(() => setSpikeIntensity(0), 600);
      return () => clearTimeout(timer);
    }
  }, [spikeActive]);

  // CPA: Generate curved arc geometry
  const curvedGeometry = useMemo(() => {
    if (!curved) return null;

    const { totalWrapArc, panelRadius } = COCKPIT_GEOMETRY;
    const arcRad = (totalWrapArc * Math.PI) / 180;
    const points: THREE.Vector3[] = [];
    const segments = 48;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = -arcRad / 2 + t * arcRad;
      const x = Math.sin(angle) * panelRadius;
      const z = -Math.cos(angle) * panelRadius;
      points.push(new THREE.Vector3(x, 0, z));
    }

    const curve = new THREE.CatmullRomCurve3(points, false);
    return new THREE.TubeGeometry(curve, 48, 0.04, 8, false);
  }, [curved]);

  // CPA: Glow arc geometry (wider tube)
  const glowGeometry = useMemo(() => {
    if (!curved) return null;

    const { totalWrapArc, panelRadius } = COCKPIT_GEOMETRY;
    const arcRad = (totalWrapArc * Math.PI) / 180;
    const points: THREE.Vector3[] = [];
    const segments = 48;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = -arcRad / 2 + t * arcRad;
      const x = Math.sin(angle) * panelRadius;
      const z = -Math.cos(angle) * panelRadius;
      points.push(new THREE.Vector3(x, 0, z));
    }

    const curve = new THREE.CatmullRomCurve3(points, false);
    return new THREE.TubeGeometry(curve, 48, 0.2, 8, false);
  }, [curved]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Gentle pulse: opacity oscillates 0.7-1.0 over 3s
    const pulse = Math.sin(clock.elapsedTime * 2.094) * 0.15 + 0.85;
    const totalIntensity = intensity * pulse + spikeIntensity;

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.color.set(color);
    mat.opacity = Math.min(totalIntensity, 1.0);

    // Glow layer
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.color.set(color);
      glowMat.opacity = Math.min(totalIntensity * 0.3, 0.5);
    }

    // Decay spike
    if (spikeIntensity > 0) {
      setSpikeIntensity((prev) => Math.max(prev - 0.05, 0));
    }
  });

  // Position at top of cockpit frame
  const yPos = viewport.height * 0.48;

  if (curved && curvedGeometry && glowGeometry) {
    return (
      <group position={[0, yPos, 0]}>
        {/* Core LED arc strip */}
        <mesh ref={meshRef} geometry={curvedGeometry}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.85}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        {/* Soft glow behind LED arc */}
        <mesh ref={glowRef} geometry={glowGeometry}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    );
  }

  // Flat fallback (pre-CPA behavior)
  const rimWidth = Math.min(18, viewport.width * 1.8);

  return (
    <group position={[0, yPos, -4]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[rimWidth, 0.08]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          toneMapped={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={glowRef} position={[0, 0, -0.1]}>
        <planeGeometry args={[rimWidth, 0.48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
