'use client';

// ════════════════════════════════════════════════════
// useInteractiveSurface — Hover-Reactive 3D Surfaces (D3D-8)
// ════════════════════════════════════════════════════
// Makes R3F meshes respond to pointer hover/click with
// smooth glow, scale, and emissive intensity transitions.
// Used on cockpit panels, consoles, lab map nodes.

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InteractiveSurfaceState {
  isHovered: boolean;
  isPressed: boolean;
  /** 0..1 smooth hover progress */
  hoverProgress: number;
  /** 0..1 smooth press progress */
  pressProgress: number;
}

interface UseInteractiveSurfaceOptions {
  /** Scale multiplier on hover. Default: 1.05 */
  hoverScale?: number;
  /** Emissive intensity on hover. Default: 0.3 */
  hoverEmissive?: number;
  /** Transition speed. Default: 0.08 */
  transitionSpeed?: number;
  /** Click callback */
  onClick?: () => void;
  /** Hover callback */
  onHover?: (hovered: boolean) => void;
  /** Whether interaction is enabled. Default: true */
  enabled?: boolean;
}

export function useInteractiveSurface(options: UseInteractiveSurfaceOptions = {}) {
  const {
    hoverScale = 1.05,
    hoverEmissive = 0.3,
    transitionSpeed = 0.08,
    onClick,
    onHover,
    enabled = true,
  } = options;

  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const hoverProgressRef = useRef(0);
  const pressProgressRef = useRef(0);
  const meshRef = useRef<THREE.Mesh>(null);
  const baseScaleRef = useRef(new THREE.Vector3(1, 1, 1));
  const hasRecordedBase = useRef(false);

  // Smooth transitions via useFrame
  useFrame((_, delta) => {
    if (!enabled) return;

    const hoverTarget = isHovered ? 1 : 0;
    const pressTarget = isPressed ? 1 : 0;
    const speed = Math.min(transitionSpeed * delta * 60, 1);

    hoverProgressRef.current += (hoverTarget - hoverProgressRef.current) * speed;
    pressProgressRef.current += (pressTarget - pressProgressRef.current) * speed * 2;

    // Apply scale
    if (meshRef.current) {
      if (!hasRecordedBase.current) {
        baseScaleRef.current.copy(meshRef.current.scale);
        hasRecordedBase.current = true;
      }

      const hp = hoverProgressRef.current;
      const scaleFactor = 1 + (hoverScale - 1) * hp;
      const pressScale = isPressed ? 0.97 : 1;

      meshRef.current.scale.copy(baseScaleRef.current).multiplyScalar(scaleFactor * pressScale);

      // Apply emissive intensity if material supports it
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat && 'emissiveIntensity' in mat) {
        mat.emissiveIntensity = hp * hoverEmissive;
      }
    }
  });

  const handlePointerOver = useCallback(() => {
    if (!enabled) return;
    setIsHovered(true);
    onHover?.(true);
    document.body.style.cursor = 'pointer';
  }, [enabled, onHover]);

  const handlePointerOut = useCallback(() => {
    if (!enabled) return;
    setIsHovered(false);
    setIsPressed(false);
    onHover?.(false);
    document.body.style.cursor = 'default';
  }, [enabled, onHover]);

  const handlePointerDown = useCallback(() => {
    if (!enabled) return;
    setIsPressed(true);
  }, [enabled]);

  const handlePointerUp = useCallback(() => {
    if (!enabled) return;
    setIsPressed(false);
    if (isHovered) onClick?.();
  }, [enabled, isHovered, onClick]);

  const state: InteractiveSurfaceState = {
    isHovered,
    isPressed,
    hoverProgress: hoverProgressRef.current,
    pressProgress: pressProgressRef.current,
  };

  return {
    meshRef,
    state,
    handlers: {
      onPointerOver: handlePointerOver,
      onPointerOut: handlePointerOut,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
    },
  };
}
