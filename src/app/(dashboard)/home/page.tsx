'use client';

// ════════════════════════════════════════════════════════════════
// HOME — Thin Scene Descriptor (UI Design Change)
// ════════════════════════════════════════════════════════════════
// Sets cockpit to 'dashboard' mode. All visible UI renders in 3D
// via DashboardCenter panel inside CockpitUILayer.
// Retained: sr-only ARIA stats for screen readers.

import { useEffect, useMemo } from 'react';
import { useChildStore } from '@/stores/childStore';
import { useUIStore } from '@/stores/uiStore';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitStore } from '@/stores/cockpitStore';

export default function HomePage() {
  const { activeChild } = useChildStore();
  const setLabColor = useUIStore((s) => s.setLabColor);
  const childId = activeChild?.id || '';

  // Set cockpit mode
  useCockpitScene('dashboard');

  // R1: UI routing now lives in cockpitStore (was cockpitUIStore)
  const setCenterContent = useCockpitStore((s) => s.setCenterContent);
  useEffect(() => {
    setLabColor('#00BBFF');
    setCenterContent('home');
  }, [setLabColor, setCenterContent]);

  // Data for ARIA announcements
  const { data: labsProgress } = useAllLabsProgress(childId);
  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = labsProgress.reduce((sum: number, lab: { percent?: number }) =>
      sum + (lab.percent || 0), 0);
    return Math.round(total / 10);
  }, [labsProgress]);

  if (!activeChild) return null;

  // sr-only ARIA content for screen readers
  return (
    <div className="sr-only" role="main" aria-label="SparkForge Home Dashboard">
      <h1>Welcome back, {activeChild.display_name}</h1>
      <p>Level {activeChild.level} — {activeChild.level_title}</p>
      <div aria-live="polite" aria-atomic="true">
        XP: {activeChild.xp}. Level: {activeChild.level}. Streak: {activeChild.streak_count} days.
        Overall progress: {overallProgress}%.
      </div>
    </div>
  );
}
