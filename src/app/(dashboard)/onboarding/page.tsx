'use client';

// ════════════════════════════════════════════════════════════════
// Onboarding Page — Thin Scene Descriptor (DASH-03 fix)
// ════════════════════════════════════════════════════════════════
// Follows the thin descriptor pattern: sets cockpit mode + center
// content, returns sr-only ARIA content. Actual UI renders via
// OnboardingPanel inside CockpitUILayer's center quadrant.

import { useEffect } from 'react';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitStore } from '@/stores/cockpitStore';

export default function OnboardingPage() {
  useCockpitScene('dashboard');

  const setCenterContent = useCockpitStore((s) => s.setCenterContent);
  useEffect(() => {
    setCenterContent('onboarding');
  }, [setCenterContent]);

  return (
    <div className="sr-only" role="main" aria-label="Onboarding wizard">
      <h1>Welcome to SparkForge</h1>
      <p>
        Set up your explorer profile and pick your first lab. This 3-step wizard
        will get you started on your AI learning journey.
      </p>
    </div>
  );
}
