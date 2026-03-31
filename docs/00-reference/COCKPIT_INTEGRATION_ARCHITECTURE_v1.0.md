# COCKPIT INTEGRATION ARCHITECTURE v1.0

**Date:** March 31, 2026 | **Status:** ACTIVE — Implementation in progress
**Supersedes:** Cockpit-Interface-Plan.md (analysis document, retained as reference)

---

## VISION STATEMENT

SparkForge's cockpit is NOT a 3D backdrop behind HTML. It IS the interface.

**Design language:** Opaque metallic control panel with high-polish chrome bezels,
matte-black carbon composite surfaces, physical 3D dials/buttons/switches, and
limited holographic effects confined to the center lab map and small data readouts.

**NOT glassmorphic.** The cockpit renders as a solid, tangible, curved command console.
Glassmorphism is reserved exclusively for the Hero Animation sequence.

---

## QUADRANT LAYOUT (from LabForge Nexus JSON spec)

```
┌─────────────────────────────────────────────────┐
│                  HolographicHUD                  │
│               (top, subtle data rings)           │
├──────────┬──────────────────────┬────────────────┤
│          │                      │                │
│  LEFT    │   CENTER CONSOLE     │    RIGHT       │
│  25%     │      45%             │    25%         │
│          │                      │                │
│ Avatar   │  Holographic Lab Map │  Settings      │
│ AI Guide │  (ONLY holographic   │  App Controls  │
│ Trophies │   element here)      │  Activity Log  │
│ Gauges   │  Stats overlay       │  Data readouts │
│          │                      │                │
├──────────┴──────────────────────┴────────────────┤
│              BOTTOM MODULE (15%)                  │
│  Dials  │  Navigation Buttons  │  Quick Stats    │
└─────────────────────────────────────────────────┘
```

### Material Rules
- **External shell & edges:** High-polish chrome/metallic (`createAlloyFrameMaterial`)
- **Panel surfaces:** Matte-black carbon composite (`createConsoleSurfaceMaterial`)
- **Interactive controls:** Bright emissive buttons/dials (`createButtonMaterial`)
- **Center lab map ONLY:** Holographic glow + volumetric particles
- **Everything else:** Opaque, solid, metallic — no transparency, no glassmorphism

### Color Palette
- `#0A0F1F` — Deep space black (base)
- `#00E5FF` — Cyan accent (primary)
- `#FF9500` — Orange accent (active controls)
- `#1A2A4A` — Dark blue-gray (panel surfaces)
- `#FFFFFF` — Chrome highlights
- `#00FFAA` — Green accent (status OK)

---

## ARCHITECTURAL DECISIONS

| ID | Decision | Rationale |
|----|----------|-----------|
| INT-1 | HTML content rendered via @react-three/uikit inside Canvas | Full 3D immersion — no HTML overlay blocking cockpit |
| INT-2 | Opaque metallic cockpit, NOT glassmorphic | Tangible control panel feel per JSON spec |
| INT-3 | Holographic effects LIMITED to center lab map | Prevents visual noise; focuses attention |
| INT-4 | NavigationButtonGrid is supplementary to HTML sidebar (transitional) | Accessibility requires HTML nav during migration |
| INT-5 | Route auto-detects cockpit mode via useStationMode | Eliminates manual mode management |
| INT-6 | cockpitBroadcastStore drives all cross-panel reactivity | Unified event bus for visual feedback |

---

## IMPLEMENTATION PHASES

### Phase 1: Wire + Viewport Constraint (Current Sprint)
1. Wire orphaned 3D UI components into CockpitCanvas
2. Constrain HTML content area to center 60% viewport
3. Connect sidebar to cockpitBroadcastStore
4. Add route-to-scene mode broadcasting
5. Fix hero animation initialization
6. Implement cockpit opacity fade

### Phase 2: @react-three/uikit Migration (Next Sprint)
1. Install and configure uikit Root/Fullscreen in CockpitCanvas
2. Create CockpitUILayer component with quadrant layout
3. Migrate dashboard stats cards to uikit Container/Text
4. Migrate navigation to uikit buttons + existing NavigationButtonGrid
5. Create per-page uikit content templates

### Phase 3: Full 3D UI (Future)
1. All page content rendered via uikit inside Canvas
2. HTML sidebar replaced by 3D NavigationButtonGrid
3. Per-page 3D scene content (lab map, game tiles, profile)
4. Full keyboard/gamepad navigation in 3D

---

*End of Cockpit Integration Architecture v1.0*
