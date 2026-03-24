// ════════════════════════════════════════════════════
// Interactive Surface Configuration — Cockpit Presets (Section 4.1-E)
// ════════════════════════════════════════════════════
// Pre-configured interactivity presets for cockpit panel components.
// These presets are consumed by useInteractiveSurface() hook when
// cockpit components are built in Stages 5C/5D.
//
// Usage in future components:
//   const { meshRef, handlers } = useInteractiveSurface(getInteractivePreset('console'));
//   <mesh ref={meshRef} {...handlers}> ... </mesh>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InteractiveSurfacePreset {
  hoverScale: number;
  hoverEmissive: number;
  transitionSpeed: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Cockpit Component Presets
// ---------------------------------------------------------------------------

export const COCKPIT_INTERACTIVE_PRESETS = {
  // Main cockpit panels (Stage 5C)
  cockpitPanel: {
    hoverScale: 1.02,
    hoverEmissive: 0.2,
    transitionSpeed: 0.06,
    description: 'Subtle panel highlight on hover',
  },
  // Side panels (Stage 5C)
  sidePanel: {
    hoverScale: 1.03,
    hoverEmissive: 0.25,
    transitionSpeed: 0.08,
    description: 'Side panel data readout glow',
  },
  // Interactive consoles (Stage 5D)
  console: {
    hoverScale: 1.05,
    hoverEmissive: 0.4,
    transitionSpeed: 0.1,
    description: 'Console activates with strong glow on hover',
  },
  // Holographic lab map nodes (Stage 5D)
  labMapNode: {
    hoverScale: 1.08,
    hoverEmissive: 0.5,
    transitionSpeed: 0.12,
    description: 'Lab node enlarges and pulses on hover',
  },
  // Status bar segments (Stage 5C)
  statusBarSegment: {
    hoverScale: 1.04,
    hoverEmissive: 0.3,
    transitionSpeed: 0.08,
    description: 'Status indicator highlights on hover',
  },
  // LED rim segments (Stage 5C)
  ledRimSegment: {
    hoverScale: 1.01,
    hoverEmissive: 0.6,
    transitionSpeed: 0.15,
    description: 'LED intensifies on hover (fast, strong glow)',
  },
  // HUD ring elements (Stage 5C)
  hudElement: {
    hoverScale: 1.06,
    hoverEmissive: 0.35,
    transitionSpeed: 0.1,
    description: 'HUD element expands and brightens on hover',
  },
  // NPC bots (Stage 5D)
  npcBot: {
    hoverScale: 1.1,
    hoverEmissive: 0.3,
    transitionSpeed: 0.08,
    description: 'NPC scales up and glows when approached',
  },
} as const satisfies Record<string, InteractiveSurfacePreset>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Get interactive surface options for a cockpit component type */
export function getInteractivePreset(component: keyof typeof COCKPIT_INTERACTIVE_PRESETS) {
  const preset = COCKPIT_INTERACTIVE_PRESETS[component];
  return {
    hoverScale: preset.hoverScale,
    hoverEmissive: preset.hoverEmissive,
    transitionSpeed: preset.transitionSpeed,
  };
}
