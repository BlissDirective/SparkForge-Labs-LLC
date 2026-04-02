# SESSION REFERENCE — SparkForge UI Design Change

**Last Session:** April 2, 2026
**Branch:** `claude/sparkforge-ui-design-8rpef`
**Status:** Phase 1+2 complete, design tokens locked, ready for component rebuild + Phase 3

---

## WHAT WAS ACCOMPLISHED

### 1. Phase 1: Infrastructure (COMPLETE)
Built the foundation for the full 3D cockpit UI migration:
- `src/lib/3d/cockpitModePresets.ts` — 8 cockpit modes × 14 atmosphere properties
- `src/hooks/useCockpitScene.ts` — Hook that pages call to set cockpit mode
- `src/stores/cockpitStore.ts` — Added 7 new state fields (audio volumes, brightness, activeMode)
- `src/stores/cockpitUIStore.ts` — Routes center content to correct panel component
- `src/components/3d/CockpitUILayer.tsx` — Master quadrant orchestrator (left/center/right/bottom)
- 5 UI primitives: CockpitText, CockpitContainer, CockpitScrollPanel, CockpitInput, CockpitTooltip

### 2. Phase 2: Dashboard (COMPLETE)
Stripped 6 HTML dashboard pages and replaced with 3D panel architecture:
- Dashboard layout.tsx stripped of HTML content layer, wired to useCockpitScene
- 6 pages (home, labs, arcade, profile, settings, parent) converted to thin scene descriptors
- 9 panel components created in `src/components/3d/panels/`:
  - DashboardLeft, DashboardRight (fixed side quadrants)
  - DashboardCenter, LabsCenter, SettingsPanel (Batch C)
  - LabDetailPanel, ArcadePanel, ProfileCenter, ParentPanel (Batch D)
- Net reduction: ~861 lines of HTML removed

### 3. Design Token System (COMPLETE — 131 decisions locked)
Created a comprehensive design language to prevent visual chaos:

**System-level tokens (12 sections, 48 decisions):**
- Typography: 7 levels, Orbitron for all numbers, accent-aware 4-tier colors
- Edges: rounded+chamfer hybrid, soft technical radii (4/8/12px), bold 2px chrome, pulse trace hover
- Depth: 8 layers (0.005/step), flush screens, tactile buttons
- Springs: 6 presets, mechanical satisfying feel, 400ms transitions
- Celebrations: 3 tiers (minor 1.5s / major 3s / epic 4s with camera shake)
- Emissive: 6 levels, medium idle (0.8), 1.8x hover boost, LEDs 1.5x brighter
- Mode atmosphere: whisper 5% tint, neutral chrome, mode-matched fill light + particles
- States: 6 states including loading, glow hold active, desaturated disabled
- Surface: subtle seams, fine grain, factory fresh, full trace accent lines
- Focus: brightness+DOF, mode-aware targets, primary CTA first-look
- Density: balanced items (5/12/9/3/4), comfortable 40% whitespace, paginate overflow
- Feedback: ripple 300ms, sector response, simultaneous audio, diminishing dampening
- Audio: flat falloff, moderate 0.5 density, priority ducking, hard cut crossfade

**Component-level designs (30 components, 83 decisions):**
- 10 hero components fully designed (NavigationButtonGrid, HolographicButton, RadialDial3D, ToggleSwitch3D, HolographicLabMap, HolographicHUD, LEDRim, StatusBar3D, CenterViewportScreen, MechanicalIris)
- 4 structural components (CockpitPanels, SidePanels, CockpitFloor3D, CockpitStructuralDetail)
- 3 interactive/display (VariableDialCluster, HolographicCard, HolographicPanel)
- 4 effects (CeremonyFX, AuroraBackground, AmbientParticles=REMOVED, WormholeTransition)
- 9 panel layouts (all dashboard panels)

**Key design file locations:**
- `SparkForge-Full-ControlScreen.json` — Master JSON spec (~1,800 lines)
- `DESIGN_DECISIONS_LOG.md` — All 131 decisions with rationale
- `src/lib/3d/cockpitDesignTokens.ts` — TypeScript constants for code consumption
- `Master-SparkForge-UI-Design-Change.md` — Overview + progress tracking

### Notable Design Decisions
- **HolographicHUD repositioned** from overhead overlay to peripheral frame (eliminates content distraction)
- **AmbientParticles REMOVED** from cockpit (cleaner visual, accent lines provide atmosphere)
- **NavigationButtonGrid** uses pentagon cluster layout with ARCADE center
- **All chrome stays neutral silver** — mode atmosphere comes from fill light + particles + LEDs only
- **Paginate, not scroll** for overflow content (no scroll in 3D, next/prev buttons)

---

## WHAT COMES NEXT

### Immediate Priority Options:
1. **Update 10 hero component implementations** — Rewrite existing NavigationButtonGrid, HolographicButton, RadialDial3D, ToggleSwitch3D, etc. to match their new design specs and consume cockpitDesignTokens.ts
2. **Phase 3: Auth + Forms** — Login/signup 3D panels, chat panel, search (4 new files, 4 modified)
3. **Phase 4: Gamification** — Celebration system, XP popup, streak → 3D (4 new files, 5 modified)

### Recommended order: Update hero components FIRST
The 10 hero components (especially HolographicButton and RadialDial3D) are used by every panel. Updating them to consume design tokens means all panels automatically get the correct visual treatment.

### Files that need component rebuild:
- `src/components/3d/ui/NavigationButtonGrid.tsx` — pentagon cluster, beveled square, backlit engraved
- `src/components/3d/ui/HolographicButton.tsx` — chamfered rect, dual-layer, 3 sizes, inset text
- `src/components/3d/ui/RadialDial3D.tsx` — knurled cylinder, LED ring, glass cover for read-only
- `src/components/3d/ui/ToggleSwitch3D.tsx` — paddle switch, LED strip, grouped panel
- `src/components/3d/HolographicLabMap.tsx` — beam lines, shell-layer completion, isolate hover
- `src/components/3d/HolographicHUD.tsx` — MAJOR: reposition to peripheral frame
- `src/components/3d/LEDRim.tsx` — rectangular blocks, outward burst, sequential fill
- `src/components/3d/StatusBar3D.tsx` — arc bar, pulse ring, mini arcs, curved strip
- `src/components/3d/ui/CenterViewportScreen.tsx` — cylindrical concave, segmented frame, scan lines
- `src/components/3d/MechanicalIris.tsx` — staggered spiral, carbon composite blades

---

## KEY REFERENCE FILES

| File | What it contains |
|------|-----------------|
| `CLAUDE.md` | Project architecture, autonomy rules, all stage docs |
| `Master-SparkForge-UI-Design-Change.md` | UI migration overview + implementation progress |
| `SparkForge-Full-ControlScreen.json` | Complete cockpit spec (layout + design tokens + component designs) |
| `DESIGN_DECISIONS_LOG.md` | All 131 design decisions with tables |
| `src/lib/3d/cockpitDesignTokens.ts` | TypeScript design tokens (consumed by components) |
| `src/lib/3d/cockpitModePresets.ts` | 8 mode definitions + route mapping |
| `src/hooks/useCockpitScene.ts` | Page-level cockpit mode controller |
| `src/stores/cockpitUIStore.ts` | Center content routing store |
| `src/components/3d/CockpitUILayer.tsx` | Master quadrant orchestrator |
| `src/components/3d/panels/*.tsx` | 9 panel components (center content per page) |

---

*To continue: Read this file + DESIGN_DECISIONS_LOG.md + Master-SparkForge-UI-Design-Change.md for full context.*
*Branch: claude/sparkforge-ui-design-8rpef*
