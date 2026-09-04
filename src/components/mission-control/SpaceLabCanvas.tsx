'use client';

// ════════════════════════════════════════════════════════════════
// SpaceLabCanvas — ONE decorative, locked-camera WebGL backdrop
// ════════════════════════════════════════════════════════════════
// Budget: a few thousand triangles. No OrbitControls, no cockpit hull,
// no postprocessing, no NPCs, no 50M panoramic shell.
// Chromebook path: parent only mounts this on desktop/ultrawide when
// reduced-motion is off. Errors fall through Canvas3DErrorBoundary.

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import type { Group, Mesh } from 'three';

function Spin({
  speed,
  axis = 'y',
  children,
}: {
  speed: number;
  axis?: 'x' | 'y' | 'z';
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation[axis] += delta * speed;
  });
  return <group ref={ref}>{children}</group>;
}

function PulseCore() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.06;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={[0, 0.35, 0]}>
      <icosahedronGeometry args={[0.32, 1]} />
      <meshBasicMaterial color="#4DE9FF" transparent opacity={0.92} />
    </mesh>
  );
}

function FloatingCrystal({
  position,
  color,
  speed,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.004;
    ref.current.rotation.y += 0.007;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.12;
  });
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.16, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.7}
        metalness={0.4}
        roughness={0.25}
      />
    </mesh>
  );
}

function SpaceLabScene() {
  return (
    <>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 10, 24]} />
      <ambientLight intensity={0.18} />
      <pointLight position={[0, 1.4, 2.2]} color="#4DE9FF" intensity={2.4} distance={14} />
      <pointLight position={[2.2, -0.4, 1.4]} color="#FF8C1A" intensity={0.55} distance={8} />

      <Stars radius={70} depth={36} count={900} factor={2.8} saturation={0} fade speed={0.35} />

      {/* Stargate / circuit portal — two low-segment torii, not a hull */}
      <group position={[0, 0.2, -2.2]}>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[3.15, 0.07, 8, 48]} />
          <meshStandardMaterial
            color="#3a4454"
            metalness={0.85}
            roughness={0.35}
            emissive="#1a3a48"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[2.55, 0.025, 6, 40]} />
          <meshBasicMaterial color="#4DE9FF" transparent opacity={0.45} />
        </mesh>
      </group>

      <PulseCore />

      <Spin speed={0.25}>
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.012, 6, 32]} />
          <meshBasicMaterial color="#4DE9FF" transparent opacity={0.7} />
        </mesh>
      </Spin>
      <Spin speed={-0.4} axis="z">
        <mesh position={[0, 0.35, 0]}>
          <torusGeometry args={[0.72, 0.01, 6, 32]} />
          <meshBasicMaterial color="#9AF0FF" transparent opacity={0.4} />
        </mesh>
      </Spin>

      {/* Mechanical pedestal */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.55, 0.85, 0.22, 16]} />
        <meshStandardMaterial color="#2a3340" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.7, 1.05, 0.28, 16]} />
        <meshStandardMaterial color="#1a222c" metalness={0.75} roughness={0.38} />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.04, 16]} />
        <meshBasicMaterial color="#4DE9FF" />
      </mesh>

      <FloatingCrystal position={[-1.6, 0.9, 0.4]} color="#FF8C1A" speed={0.9} />
      <FloatingCrystal position={[1.7, 0.55, 0.6]} color="#B67BFF" speed={1.1} />
      <FloatingCrystal position={[-1.1, -0.15, 1.1]} color="#4DE9FF" speed={0.7} />
      <FloatingCrystal position={[1.15, 1.15, -0.2]} color="#0FB8FA" speed={1.3} />
    </>
  );
}

export function SpaceLabCanvas() {
  return (
    <Canvas
      className="mc-canvas"
      camera={{ position: [0, 0.25, 5.4], fov: 36, near: 0.1, far: 80 }}
      dpr={[1, 1.25]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: false,
      }}
      frameloop="always"
      style={{ background: 'transparent' }}
    >
      <SpaceLabScene />
    </Canvas>
  );
}

export default SpaceLabCanvas;
