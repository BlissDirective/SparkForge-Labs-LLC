'use client';

// ════════════════════════════════════════════════════════════════
// LABS MAP — Thin Scene Descriptor (UI Design Change)
// ════════════════════════════════════════════════════════════════
// Sets cockpit to 'labs' mode. All visible UI renders in 3D
// via LabsCenter panel inside CockpitUILayer.

import { useEffect } from 'react';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitStore } from '@/stores/cockpitStore';

export default function LabsPage() {
  useCockpitScene('labs');

  const setCenterContent = useCockpitStore((s) => s.setCenterContent);
  useEffect(() => {
    setCenterContent('labs');
  }, [setCenterContent]);

  // sr-only for screen readers
  return (
    <div className="sr-only" role="main" aria-label="SparkForge Labs">
      <h1>AI Learning Labs</h1>
      <p>Explore 10 themed labs with 35 interactive AI games.</p>
    </div>
  );
}
