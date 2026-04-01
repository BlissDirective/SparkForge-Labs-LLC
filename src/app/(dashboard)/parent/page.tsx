'use client';

// ════════════════════════════════════════════════════════════════
// PARENT DASHBOARD — Thin Scene Descriptor (UI Design Change)
// ════════════════════════════════════════════════════════════════
// Sets cockpit to 'parent' mode (amber LED, subdued cockpit).
// All visible UI renders in 3D via ParentPanel inside CockpitUILayer.

import { useEffect } from 'react';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitUIStore } from '@/stores/cockpitUIStore';

export default function ParentPage() {
  useCockpitScene('parent');

  const setCenterContent = useCockpitUIStore((s) => s.setCenterContent);
  useEffect(() => {
    setCenterContent('parent');
  }, [setCenterContent]);

  return (
    <div className="sr-only" role="main" aria-label="Parent Dashboard">
      <h1>Parent Dashboard</h1>
      <p>View child progress, manage time limits, and subscription settings.</p>
    </div>
  );
}
