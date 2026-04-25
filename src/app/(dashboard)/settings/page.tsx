'use client';

// ════════════════════════════════════════════════════════════════
// SETTINGS — Thin Scene Descriptor (UI Design Change)
// ════════════════════════════════════════════════════════════════
// Sets cockpit to 'settings' mode (amber LED). All visible UI
// renders in 3D via SettingsPanel inside CockpitUILayer.

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitStore } from '@/stores/cockpitStore';

export default function SettingsPage() {
  useCockpitScene('settings');
  const setLabColor = useUIStore((s) => s.setLabColor);

  const setCenterContent = useCockpitStore((s) => s.setCenterContent);
  useEffect(() => {
    setLabColor('#FFAA44');
    setCenterContent('settings');
  }, [setLabColor, setCenterContent]);

  return (
    <div className="sr-only" role="main" aria-label="SparkForge Settings">
      <h1>Cockpit Settings</h1>
      <p>Adjust audio, visual effects, and cockpit skin.</p>
    </div>
  );
}
