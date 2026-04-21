'use client';

// ════════════════════════════════════════════════════════════════
// ARCADE — Thin Scene Descriptor (UI Design Change)
// ════════════════════════════════════════════════════════════════
// Sets cockpit to 'arcade' mode — energetic game browser atmosphere.
// All visible UI renders in 3D via ArcadePanel inside CockpitUILayer.

import { useEffect } from 'react';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitStore } from '@/stores/cockpitStore';

export default function ArcadePage() {
  useCockpitScene('arcade');

  const setCenterContent = useCockpitStore((s) => s.setCenterContent);
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
