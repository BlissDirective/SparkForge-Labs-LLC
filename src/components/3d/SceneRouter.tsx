'use client';

// ════════════════════════════════════════════════════
// SceneRouter — Visibility Controller for CockpitCanvas
// ════════════════════════════════════════════════════
// Reads from sceneStore to control which <group> is visible.
// Handles cockpit opacity fade during game mode (D3D-B6).

import { Suspense, useRef, type ReactNode } from 'react';
import { Group, Mesh, type Material } from 'three';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '@/stores/sceneStore';
import { Canvas3DErrorBoundary } from './Canvas3DErrorBoundary';

interface SceneRouterProps {
  heroContent?: ReactNode;
  cockpitContent: ReactNode;
  spatialContent?: ReactNode;
  gameContent?: ReactNode;
  irisContent?: ReactNode;
}

export function SceneRouter({
  heroContent,
  cockpitContent,
  spatialContent,
  gameContent,
  irisContent,
}: SceneRouterProps) {
  const activeScene = useSceneStore((s) => s.activeScene);
  const cockpitOpacityTarget = useSceneStore((s) => s.cockpitOpacityTarget);
  const isTransitioning = useSceneStore((s) => s.isTransitioning);
  const transition = useSceneStore((s) => s.transition);

  const cockpitGroupRef = useRef<Group>(null);
  const cockpitOpacityRef = useRef(1.0);

  const showHero = activeScene === 'hero';
  const showCockpit = activeScene !== 'hero';
  const showSpatial = activeScene === 'spatial';
  const showGame = activeScene === 'game' ||
    (isTransitioning && transition?.to === 'game') ||
    (isTransitioning && transition?.from === 'game');
  const showIris = isTransitioning && (
    transition?.type === 'iris-open' || transition?.type === 'iris-close'
  );

  // Smooth cockpit opacity interpolation + material traversal (D3D-B6 implemented)
  useFrame((_, delta) => {
    const current = cockpitOpacityRef.current;
    const target = cockpitOpacityTarget;
    if (Math.abs(current - target) > 0.001) {
      cockpitOpacityRef.current += (target - current) * Math.min(delta * 5, 1);
    }

    // Apply opacity to cockpit group children via material traversal
    const group = cockpitGroupRef.current;
    if (group && Math.abs(current - target) > 0.001) {
      const opacity = cockpitOpacityRef.current;
      group.traverse((child) => {
        if (child instanceof Mesh && child.material) {
          const mat = child.material as Material & { opacity?: number; transparent?: boolean };
          if (mat.opacity !== undefined) {
            mat.opacity = Math.min(mat.opacity, opacity);
            mat.transparent = opacity < 0.99;
          }
        }
      });
    }
  });

  return (
    <>
      {/* Hero Scene Group */}
      <group visible={showHero}>
        {heroContent}
      </group>

      {/* Cockpit Shell Group — fades to 20% during game (D3D-B6) */}
      <group ref={cockpitGroupRef} visible={showCockpit}>
        {cockpitContent}
      </group>

      {/* Spatial Dashboard Group */}
      <group visible={showSpatial}>
        {spatialContent}
      </group>

      {/* Game Scene Group — S7-WARN-004: Error boundary catches 3D crashes gracefully */}
      <group visible={showGame}>
        <Canvas3DErrorBoundary>
          <Suspense fallback={null}>
            {gameContent}
          </Suspense>
        </Canvas3DErrorBoundary>
      </group>

      {/* Mechanical Iris Overlay */}
      <group visible={showIris}>
        {irisContent}
      </group>
    </>
  );
}
