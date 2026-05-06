'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { Color, InstancedMesh, Object3D, Vector3 } from 'three';

interface LoginParticles3DProps {
  count?: number;
  color?: string;
  spread?: number;
}

export default function LoginParticles3D({
  count = 200,
  color = '#AA66FF',
  spread = 8,
}: LoginParticles3DProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new Vector3(
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread - 3,
      ),
      speed: 0.1 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      scale: 0.02 + Math.random() * 0.04,
    }));
  }, [count, spread]);

  // Audit P1/L6 — prefers-reduced-motion. Particles still render in
  // their seed positions (so the panel keeps its depth backdrop) but
  // stop drifting and pulsing for motion-sensitive users.
  const prefersReducedMotion = useReducedMotion();

  // When motion is disabled, write the static seed positions ONCE so the
  // particles render without further useFrame churn. Without this, the
  // InstancedMesh shows up with its identity-matrix default (zero scale)
  // and looks empty.
  useEffect(() => {
    if (!prefersReducedMotion || !meshRef.current) return;
    particles.forEach((p, i) => {
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [prefersReducedMotion, particles, dummy]);

  useFrame((state) => {
    if (prefersReducedMotion) return;
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      dummy.position.set(
        p.position.x + Math.sin(t * p.speed + p.offset) * 0.5,
        p.position.y + Math.cos(t * p.speed * 0.7 + p.offset) * 0.3,
        p.position.z + Math.sin(t * p.speed * 0.5 + p.offset) * 0.2,
      );
      const pulse = 1 + Math.sin(t * 2 + p.offset) * 0.3;
      dummy.scale.setScalar(p.scale * pulse);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const particleColor = useMemo(() => new Color(color), [color]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={particleColor}
        transparent
        opacity={0.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
