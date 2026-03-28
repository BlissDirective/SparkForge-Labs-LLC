// ════════════════════════════════════════════════════
// PARENT DASHBOARD BRIDGE — Mounts parent 3D in CockpitCanvas
// Stage 8 3D Enhancement: Bridges parent store data → 3D scene
// Pattern: CeremonyFXBridge / BadgePedestalBridge
// Active only on /parent/* routes
// ════════════════════════════════════════════════════
'use client';

import { useEffect, useRef } from 'react';
import { useParentStore } from '@/stores/parentStore';
import { useSceneStore } from '@/stores/sceneStore';
import ParentStatHologram3D from './ParentStatHologram3D';

export function ParentDashboardBridge() {
  const children = useParentStore((s) => s.children);
  const selectedChildId = useParentStore((s) => s.selectedChildId);
  const activeScene = useSceneStore((s) => s.activeScene);
  const prevSceneRef = useRef(activeScene);

  // Only render on cockpit scenes (not during game or hero)
  const isParentRoute =
    activeScene === 'cockpit' || activeScene === 'spatial';

  // Get selected child stats for hologram
  const selected = children.find((c) => c.id === selectedChildId);

  // Track scene changes for cleanup
  useEffect(() => {
    prevSceneRef.current = activeScene;
  }, [activeScene]);

  if (!isParentRoute || !selected) return null;

  return (
    <ParentStatHologram3D
      xp={selected.xp}
      lessonsCompleted={selected.lessons_completed}
      totalTimeMinutes={selected.total_time_minutes}
      streakDays={selected.streak_count}
      visible
    />
  );
}
