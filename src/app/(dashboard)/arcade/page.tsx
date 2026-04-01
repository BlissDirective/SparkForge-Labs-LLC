'use client';

// ════════════════════════════════════════════════════════════════
// ARCADE — Thin Scene Descriptor (UI Design Change)
// ════════════════════════════════════════════════════════════════
// Sets cockpit to 'dashboard' mode (arcade uses dashboard atmosphere).
// All visible UI renders in 3D via ArcadePanel inside CockpitUILayer.

import { useEffect } from 'react';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitUIStore } from '@/stores/cockpitUIStore';

export default function ArcadePage() {
  useCockpitScene('dashboard');

  const setCenterContent = useCockpitUIStore((s) => s.setCenterContent);
  useEffect(() => {
    setCenterContent('arcade');
  }, [setCenterContent]);

  return (
    <div className="sr-only" role="main" aria-label="SparkForge Arcade">
      <h1>Game Arcade</h1>
      <p>Browse all 35 SparkForge AI games across 10 labs.</p>
    </div>
  );
}
