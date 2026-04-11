'use client';

// ════════════════════════════════════════════════════════════════
// PARENT DASHBOARD — Thin Scene Descriptor (UI Design Change)
// ════════════════════════════════════════════════════════════════
// Sets cockpit to 'parent' mode (amber LED, subdued cockpit).
// Primary UI renders in 3D via ParentPanel inside CockpitUILayer.
// HTML overlays layered above the canvas deliver:
//   - v3 Gap 2: Trial countdown (TrialBanner)
//   - v3 Gap 4: Per-child usage dashboard (UsageDashboard)

import { useEffect } from 'react';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitUIStore } from '@/stores/cockpitUIStore';
import { TrialBanner } from '@/components/parent/TrialBanner';

export default function ParentPage() {
  useCockpitScene('parent');

  const setCenterContent = useCockpitUIStore((s) => s.setCenterContent);
  useEffect(() => {
    setCenterContent('parent');
  }, [setCenterContent]);

  return (
    <>
      {/* v3 Gap 2: Active trial banner — floats above cockpit canvas */}
      <TrialBanner variant="fixed" />

      <div className="sr-only" role="main" aria-label="Parent Dashboard">
        <h1>Parent Dashboard</h1>
        <p>View child progress, manage time limits, and subscription settings.</p>
      </div>
    </>
  );
}
