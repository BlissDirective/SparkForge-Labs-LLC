// ════════════════════════════════════════════════════
// ONBOARDING CRYSTAL 3D — Progressive crystal formation
// Stage 8 3D Enhancement (C1): Grows across 3 onboarding steps
// Step 1: 33% formed (base crystal, dim glow)
// Step 2: 66% formed (facets emerge, medium glow)
// Step 3: 100% formed (full crystal, bright + particle burst)
// ~150K triangles | Renders inside CockpitCanvas
// ════════════════════════════════════════════════════
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  Color,
  IcosahedronGeometry,
  OctahedronGeometry,
  TetrahedronGeometry,
  AdditiveBlending,
  MeshBasicMaterial,
  DoubleSide,
  InstancedMesh,
  Object3D,
  Matrix4,
} from 'three';

interface OnboardingCrystal3DProps {
  /** Current onboarding step (1, 2, or 3) */
  step: number;
  /** Whether crystal is visible */
  visible?: boolean;
  /** Lab color for crystal tint (from selected lab) */
  labColor?: string;
}

const CRYSTAL_POSITION: [number, number, number] = [0, -0.3, -2.2];
const PARTICLE_COUNT = 60;

export default function OnboardingCrystal3D({
  step,
  visible = true,
  labColor = '#AA66FF',
}: OnboardingCrystal3DProps) {
  const groupRef = useRef<Group>(null);
  const crystalRef = useRef<Mesh>(null);
  const glowRef = useRef<MeshBasicMaterial>(null);
  const particlesRef = useRef<InstancedMesh>(null);
  const tempObj = useMemo(() => new Object3D(), []);

  // Step-based properties
  const progress = step / 3; // 0.33, 0.66, 1.0
  const crystalScale = 0.3 + progress * 0.7; // 0.53 → 0.76 → 1.0
  const emissiveIntensity = 0.3 + progress * 1.2; // 0.63 → 1.1 → 1.5
  const glowOpacity = 0.08 + progress * 0.15; // 0.13 → 0.18 → 0.23
  const detailLevel = Math.floor(progress * 3); // 1, 2, 3

  const baseColor = useMemo(() => new Color(labColor), [labColor]);

  // Crystal material — emissive grows with step
  const crystalMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: baseColor,
        metalness: 0.7,
        roughness: 0.15,
        emissive: baseColor,
        emissiveIntensity,
        transparent: true,
        opacity: 0.85 + progress * 0.15,
      }),
    [baseColor, emissiveIntensity, progress]
  );

  // Primary crystal geometry — complexity increases per step
  const primaryGeo = useMemo(() => {
    if (detailLevel <= 1) return new TetrahedronGeometry(0.06, 0);
    if (detailLevel <= 2) return new OctahedronGeometry(0.06, 1);
    return new IcosahedronGeometry(0.06, 2);
  }, [detailLevel]);

  // Orbiting facet geometries (appear at step 2+)
  const facetGeo = useMemo(() => new OctahedronGeometry(0.015, 0), []);
  const facetMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: emissiveIntensity * 0.6,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.7,
      }),
    [baseColor, emissiveIntensity]
  );

  // Particle positions (appear at step 3)
  const particlePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.08 + Math.random() * 0.06;
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ]);
    }
    return positions;
  }, []);

  // Animation loop
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Crystal rotation — faster as steps progress
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * (0.3 + progress * 0.4);
      crystalRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }

    // Floating bob
    groupRef.current.position.y =
      CRYSTAL_POSITION[1] + Math.sin(t * 0.6) * 0.01;

    // Glow pulse
    if (glowRef.current) {
      glowRef.current.opacity =
        glowOpacity + Math.sin(t * 1.5) * 0.05 * progress;
    }

    // Particle orbiting (step 3 only)
    if (particlesRef.current && step >= 3) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [bx, by, bz] = particlePositions[i];
        const angle = t * 0.8 + i * 0.1;
        const orbitR = 1.0 + Math.sin(t * 0.3 + i) * 0.2;
        tempObj.position.set(
          bx * orbitR * Math.cos(angle) - bz * Math.sin(angle),
          by + Math.sin(t + i * 0.5) * 0.01,
          bx * orbitR * Math.sin(angle) + bz * Math.cos(angle)
        );
        tempObj.scale.setScalar(0.3 + Math.sin(t * 2 + i) * 0.15);
        tempObj.updateMatrix();
        particlesRef.current.setMatrixAt(i, tempObj.matrix);
      }
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={CRYSTAL_POSITION}>
      {/* Primary crystal body */}
      <mesh
        ref={crystalRef}
        geometry={primaryGeo}
        material={crystalMaterial}
        scale={crystalScale}
      />

      {/* Glow sphere */}
      <mesh scale={crystalScale * 1.8}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial
          ref={glowRef}
          color={baseColor}
          transparent
          opacity={glowOpacity}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>

      {/* Orbiting facets (step 2+) */}
      {step >= 2 &&
        Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = 0.09 * crystalScale;
          return (
            <mesh
              key={i}
              geometry={facetGeo}
              material={facetMat}
              position={[
                Math.cos(angle) * radius,
                Math.sin(angle * 2) * 0.02,
                Math.sin(angle) * radius,
              ]}
              scale={0.6 + progress * 0.4}
            />
          );
        })}

      {/* Completion particles (step 3 only) */}
      {step >= 3 && (
        <instancedMesh
          ref={particlesRef}
          args={[undefined, undefined, PARTICLE_COUNT]}
        >
          <sphereGeometry args={[0.003, 6, 6]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.6}
            blending={AdditiveBlending}
          />
        </instancedMesh>
      )}

      {/* Base ring (always visible) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05 * crystalScale, 0]}>
        <ringGeometry args={[0.04 * crystalScale, 0.05 * crystalScale, 32]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.25}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}
