'use client';

// ════════════════════════════════════════════════════
// SceneRouter — Visibility Controller for CockpitCanvas
// ════════════════════════════════════════════════════
// Reads from sceneStore to control which <group> is visible.
// Handles cockpit opacity fade during game mode (D3D-B6).

import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '@/stores/sceneStore';

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

  const cockpitGroupRef = useRef<THREE.Group>(null);
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

  // Smooth cockpit opacity interpolation
  useFrame((_, delta) => {
    const current = cockpitOpacityRef.current;
    const target = cockpitOpacityTarget;
    if (Math.abs(current - target) > 0.001) {
      cockpitOpacityRef.current += (target - current) * Math.min(delta * 5, 1);
    }
    // Apply opacity to cockpit group children (traversal for material opacity)
    // Note: actual opacity application is handled by individual components
    // reading cockpitOpacityTarget from sceneStore
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

      {/* Game Scene Group */}
      <group visible={showGame}>
        {gameContent}
      </group>

      {/* Mechanical Iris Overlay */}
      <group visible={showIris}>
        {irisContent}
      </group>
    </>
  );
}
