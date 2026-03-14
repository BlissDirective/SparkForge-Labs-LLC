'use client';

// ════════════════════════════════════════════════════
// useSpatialNavigation — Spatial Dashboard Navigation Hook
// ════════════════════════════════════════════════════
// Enhancement 1.1: Bridges cockpitStore with route navigation
// Handles: lab focus → router push, camera transitions, keyboard nav

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCockpitStore, LAB_POSITIONS } from '@/stores/cockpitStore';
import type { CameraTarget } from '@/stores/cockpitStore';

export interface SpatialNavigation {
  // State
  focusedLabId: number | null;
  hoveredLabId: number | null;
  isTransitioning: boolean;
  cameraTarget: CameraTarget;

  // Actions
  navigateToLab: (labId: number) => void;
  hoverLab: (labId: number | null) => void;
  returnToOverview: () => void;
  enterLab: (labId: number) => void;
  getLabPosition: (labId: number) => [number, number, number] | undefined;

  // Keyboard
  focusNextLab: () => void;
  focusPrevLab: () => void;
}

export function useSpatialNavigation(): SpatialNavigation {
  const router = useRouter();
  const {
    focusedLabId,
    hoveredLabId,
    isTransitioning,
    cameraTarget,
    focusLab,
    setHoveredLab,
    returnToOverview,
  } = useCockpitStore();

  // Navigate camera to focus on a lab (no route change)
  const navigateToLab = useCallback(
    (labId: number) => {
      focusLab(labId);
    },
    [focusLab]
  );

  // Hover lab (highlight only)
  const hoverLab = useCallback(
    (labId: number | null) => {
      setHoveredLab(labId);
    },
    [setHoveredLab]
  );

  // Enter lab (route change after camera transition)
  const enterLab = useCallback(
    (labId: number) => {
      focusLab(labId);
      // Delay route push to allow camera flythrough
      setTimeout(() => {
        router.push(`/labs/${labId}`);
      }, 600);
    },
    [focusLab, router]
  );

  // Get 3D position for a lab
  const getLabPosition = useCallback((labId: number) => {
    return LAB_POSITIONS[labId];
  }, []);

  // Keyboard: cycle through labs
  const focusNextLab = useCallback(() => {
    const current = focusedLabId ?? 0;
    const next = current >= 10 ? 1 : current + 1;
    focusLab(next);
  }, [focusedLabId, focusLab]);

  const focusPrevLab = useCallback(() => {
    const current = focusedLabId ?? 1;
    const prev = current <= 1 ? 10 : current - 1;
    focusLab(prev);
  }, [focusedLabId, focusLab]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only when spatial dashboard is visible (not in input fields)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          focusNextLab();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          focusPrevLab();
          break;
        case 'Escape':
          e.preventDefault();
          returnToOverview();
          break;
        case 'Enter':
          if (focusedLabId) {
            e.preventDefault();
            enterLab(focusedLabId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusNextLab, focusPrevLab, returnToOverview, enterLab, focusedLabId]);

  return {
    focusedLabId,
    hoveredLabId,
    isTransitioning,
    cameraTarget,
    navigateToLab,
    hoverLab,
    returnToOverview,
    enterLab,
    getLabPosition,
    focusNextLab,
    focusPrevLab,
  };
}
