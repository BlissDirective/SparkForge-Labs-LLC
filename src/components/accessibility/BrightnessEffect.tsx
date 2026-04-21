'use client';

// ════════════════════════════════════════════════════════════════
// BrightnessEffect — UX-MED-005 (Opt A)
// ════════════════════════════════════════════════════════════════
// Subscribes to cockpitStore.brightness and mirrors it to the
// `--sf-brightness` CSS variable on <html>. A body-level filter rule
// in globals.css reads the variable; `canvas { filter: none }` in the
// same stylesheet keeps the 3D cockpit untouched so WebGL fill-rate is
// not impacted.
//
// Mounted once from RootLayout. Re-renders only when brightness
// changes, costs one DOM style write.
// ════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useCockpitStore } from '@/stores/cockpitStore';

export function BrightnessEffect() {
  const brightness = useCockpitStore((s) => s.brightness);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Clamp to slider bounds defensively — cockpitStore persists from
    // localStorage, so a tampered value could land outside [0.7, 1.0].
    const value = Math.max(0.7, Math.min(1.0, brightness));
    document.documentElement.style.setProperty(
      '--sf-brightness',
      String(value),
    );
  }, [brightness]);

  return null;
}
