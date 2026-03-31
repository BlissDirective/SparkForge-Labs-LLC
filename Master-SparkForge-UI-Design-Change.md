# Master SparkForge UI Design Change

**Version:** 1.0 | **Date:** March 31, 2026 | **Status:** APPROVED — Ready for implementation
**Scope:** Complete migration from HTML/CSS overlay to fully integrated 3D cockpit UI

---

## 1. PROBLEM STATEMENT

SparkForge has a **split rendering architecture** that produces a poor visual result:
- 140 R3F 3D components render the cockpit as a background layer (z-index 0)
- 90 HTML/CSS components (~31K LOC) render all UI content as an overlay (z-index 10)
- The HTML completely obscures the 3D cockpit, making it invisible
- Two independent rendering systems fight for the same screen space
- Result: a generic dark-mode web dashboard with a barely-visible 3D backdrop

**The vision:** A futuristic Laboratory Control Station where the cockpit IS the interface — an opaque metallic control panel with chrome bezels, physical 3D dials, LED indicators, and holographic data displays.

---

## 2. SOLUTION

Eliminate the HTML overlay layer for all authenticated pages. All visible UI renders as 3D objects inside the single persistent `CockpitCanvas` via `@react-three/uikit`.

### Architecture Shift
```
BEFORE: Next.js Route → HTML Page → CSS Styling → z-index 10 over Canvas
AFTER:  Next.js Route → useCockpitScene(mode, data) → 3D Panels in Canvas
```

---

## 3. FINALIZED DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Dashboard** | Full 3D cockpit | Everything behind auth renders in 3D. Zero SEO risk (behind auth). |
| **Marketing** | 3D hero section + HTML body | Landing page gets interactive cockpit preview. Content stays HTML for SEO. |
| **Forms** | Full 3D via @react-three/uikit | uikit Input uses hidden HTML proxy for keyboard/paste/autocomplete. |
| **Games** | Phased: dashboard → 6 flagships → 29 standard | Prove architecture first, then extend. |
| **Navigation** | 3D NavigationButtonGrid | HTML sidebar removed. sr-only nav for accessibility. |

---

## 4. DESIGN LANGUAGE

### Materials
| Material | Use | Properties |
|----------|-----|------------|
| Carbon Composite | Panel face surfaces | Matte-black (#0A0F1F), metalness 0.3, roughness 0.8 |
| Chrome Bezel | Every edge, button housing, frame | High-polish (#a8b5c8), metalness 0.98, roughness 0.12 |
| Control Panel | Interactive screen areas | Dark wet-glass (#0a1625), shininess 95, emissive lab-color |
| Button Active | Pressed/active controls | Bright emissive, intensity 2.5 |
| Button Idle | Inactive controls | Subtle glow, intensity 1.2 |
| Holographic | Center lab map ONLY | Additive blending, cyan, transparent |
| LED Emissive | Status strips, indicators | Ultra-bright, toneMapped false |

### Color Palette
- `#0A0F1F` — Deep space black (base)
- `#00E5FF` — Cyan accent (primary)
- `#FF9500` — Orange accent (active controls)
- `#1A2A4A` — Dark blue-gray (panel surfaces)
- `#FFFFFF` — Chrome highlights
- `#00FFAA` — Green accent (status OK)
- Lab colors 1-10 as defined in CLAUDE.md Section 6

### Rules
- **NOT glassmorphic** — opaque metallic surfaces everywhere except center lab map
- **Holographic glow** confined to center lab map and small data readouts
- **Chrome bezels** on every button, dial, panel edge, and structural frame
- **120-140 degree panoramic arc** with subtle barrel distortion on outer edges
- **First-person perspective** — seated 1 foot from panel face

---

## 5. QUADRANT LAYOUT

```
┌─────────────────────────────────────────────────┐
│                  HolographicHUD                  │
│               (top, subtle data rings)           │
├──────────┬──────────────────────┬────────────────┤
│  LEFT    │   CENTER CONSOLE     │    RIGHT       │
│  25%     │      45%             │    25%         │
│          │                      │                │
│ Avatar   │  Holographic Lab Map │  Settings      │
│ AI Guide │  (ONLY holographic   │  App Controls  │
│ Trophies │   element)           │  Activity Log  │
│ Gauges   │  Stats overlay       │  Data readouts │
├──────────┴──────────────────────┴────────────────┤
│              BOTTOM MODULE (15%)                  │
│  Dials  │  Navigation Buttons  │  Quick Stats    │
└─────────────────────────────────────────────────┘
```

Content changes per route — see `SparkForge-Full-ControlScreen.json` for full per-mode definitions.

---

## 6. SCOPE INVENTORY

### Goes Full 3D (inside CockpitCanvas)
- All dashboard pages (home, labs, arcade, profile, settings, onboarding)
- Navigation (3D NavigationButtonGrid — already done)
- Settings controls (3D toggles, dials, sliders — already exist)
- Data displays (stats, progress, badges — via uikit Text/Container)
- Form inputs (login, signup, chat — via uikit Input with HTML proxy)
- Gamification overlays (XP, streak, celebrations — 3D components exist)
- Game UIs (phased migration)

### Stays HTML
- Marketing pages (/, /pricing, /terms, /privacy) — SEO
- Screen-reader nav (sr-only) — accessibility
- Error/offline pages — WebGL fallback
- Admin panel — internal tool

### Files Preserved (Zero Changes)
- 140 existing 3D components
- 37 custom hooks (data layer)
- 31 API routes (backend)
- 13 Zustand stores (cockpitStore gets minor additions)
- 47 shader files
- 35 game 3D environments

### Files Replaced
- 90 HTML/CSS components → ~40 new 3D panel components
- 37 page layouts → thin scene descriptors (~20 lines each)

---

## 7. IMPLEMENTATION PHASES

| Phase | Name | Duration | Scope |
|-------|------|----------|-------|
| 1 | Core Infrastructure | Week 1 | useCockpitScene, CockpitUILayer, uikit primitives |
| 2 | Dashboard Pages | Week 2 | 6 pages converted to 3D scene descriptors, 9 panel components |
| 3 | Auth + Forms | Week 3 | Login/signup in 3D, chat panel in 3D |
| 4 | Gamification & Overlays | Week 3-4 | Celebrations, XP popup, streak fire, game shell |
| 5 | Flagship Game UIs | Week 4-5 | 6 games: Pet Trainer, Sort Toy Box, Neural Builder, Prompt Lab, Agent Architect, Bias Detective |
| 6 | Standard Game UIs | Week 6-8 | 29 games via 4 shared templates |
| 7 | Marketing Enhancement | Week 8 | 3D hero section on landing page |

---

## 8. KNOWN CONFLICTS & MITIGATIONS

| # | Conflict | Mitigation |
|---|----------|------------|
| 1 | uikit text less crisp than HTML at small sizes | Use 14px+ fonts, geometric typefaces (Orbitron/Exo 2), high-contrast colors |
| 2 | No page-level scroll in cockpit | Desired behavior — cockpits don't scroll, users interact with panels |
| 3 | Browser DevTools can't inspect 3D content | R3F Perf monitor + Theatre.js studio for debugging |
| 4 | UI layer adds ~3M triangles | Within 12.2M headroom (50M budget - 37.8M cockpit) |
| 5 | Tailwind unused for dashboard | Keep for marketing; cockpitMaterials.ts for 3D |
| 6 | No mobile cockpit | Marketing pages responsive; cockpit desktop-only (D3D-1) |
| 7 | 35 game UIs = massive scope | Phased; 4 shared templates cover 29 of 35 |
| 8 | Auth flow redirects in 3D | Thin Next.js routes with 3D scene inside (auth) layout |

---

## 9. KEY REFERENCE FILES

| File | Role |
|------|------|
| `SparkForge-Full-ControlScreen.json` | Master cockpit layout specification |
| `src/components/3d/CockpitCanvas.tsx` | Single persistent R3F Canvas |
| `src/lib/3d/cockpitConfig.ts` | Geometry, presets, budgets |
| `src/lib/3d/cockpitMaterials.ts` | Material factory functions |
| `src/stores/cockpitStore.ts` | Cockpit state + page data |
| `src/stores/cockpitBroadcastStore.ts` | Cross-panel event bus |
| `src/components/3d/SceneRouter.tsx` | Scene visibility control |
| `src/components/3d/ui/index.ts` | 3D UI component exports |

---

## 10. TECH STACK ADDITIONS

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-three/uikit` | 1.0.64 | Flexbox 3D UI (text, buttons, containers, scroll, input) |
| `@react-three/uikit-apfel` | latest | Pre-styled component kit |
| `@theatre/core` | latest | Visual animation sequencer |
| `@theatre/studio` | latest | Theatre.js editor |
| `@splinetool/react-spline` | latest | 3D design tool integration |
| `@splinetool/runtime` | latest | Spline runtime |

**No packages removed.** Existing stack (R3F, Three.js, drei, postprocessing, GSAP, Motion, Tone.js) fully preserved.

---

*End of Master SparkForge UI Design Change v1.0*
