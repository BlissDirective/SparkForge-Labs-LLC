'use client';

// ════════════════════════════════════════════════════════════════
// PROFILE — Thin Scene Descriptor (UI Design Change)
// ════════════════════════════════════════════════════════════════
// Sets cockpit to 'profile' mode (purple LED). All visible UI
// renders in 3D via ProfileCenter panel inside CockpitUILayer.

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitUIStore } from '@/stores/cockpitUIStore';

export default function ProfilePage() {
  useCockpitScene('profile');
  const setLabColor = useUIStore((s) => s.setLabColor);

  const setCenterContent = useCockpitUIStore((s) => s.setCenterContent);
  useEffect(() => {
    setLabColor('#AA66FF');
    setCenterContent('profile');
  }, [setLabColor, setCenterContent]);

  return (
    <div className="sr-only" role="main" aria-label="SparkForge Profile">
      <h1>Player Profile</h1>
      <p>View your avatar, trophies, badges, and stats.</p>
    </div>
  );
}
