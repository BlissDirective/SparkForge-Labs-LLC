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
import { motion } from 'motion/react';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitStore } from '@/stores/cockpitStore';
import { TrialBanner } from '@/components/parent/TrialBanner';
import { UsageDashboard } from '@/components/parent/UsageDashboard';

export default function ParentPage() {
  useCockpitScene('parent');

  const setCenterContent = useCockpitStore((s) => s.setCenterContent);
  useEffect(() => {
    setCenterContent('parent');
  }, [setCenterContent]);

  return (
    <>
      {/* v3 Gap 2: Active trial banner — floats above cockpit canvas */}
      <TrialBanner variant="fixed" />

      {/* v3 Gap 4: Usage meters — HTML overlay pinned top-right on
          desktop. Designed to coexist with the 3D ParentPanel below. */}
      <motion.div
        className="fixed right-4 top-16 z-30 w-[320px] max-w-[calc(100vw-2rem)] pointer-events-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <UsageDashboard variant="card" showUpgradeCTA={true} />
      </motion.div>

      <div className="sr-only" role="main" aria-label="Parent Dashboard">
        <h1>Parent Dashboard</h1>
        <p>View child progress, manage time limits, and subscription settings.</p>
      </div>
    </>
  );
}
