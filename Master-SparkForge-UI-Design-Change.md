# Master SparkForge UI Design Change

**Version:** 1.5 | **Date:** April 3, 2026 | **Status:** Phase 1+2+3+4+5 COMPLETE — Ready for Phase 6
**Source of Truth:** `SparkForge-Full-ControlScreen.json` (1,081 lines, 11 sections)
**Branch:** `claude/review-cockpit-interface-7zfku`

---

## 1. WHAT IS CHANGING

SparkForge is migrating from a **split architecture** (3D cockpit backdrop + HTML overlay) to a **unified 3D cockpit interface** where every visible dashboard element renders inside a single persistent R3F Canvas.

### Before (Current)
```
┌─ HTML Layer (z-index 10) ────────────────────┐
│  Full-screen HTML pages cover entire viewport │
│  Sidebar, cards, text, buttons — all DOM      │
├──────────────────────────────────────────────┤
│  3D Canvas (z-index 0) — INVISIBLE behind HTML│
│  Cockpit panels, LEDs, HUD — never seen       │
└──────────────────────────────────────────────┘
```

### After (Target)
```
┌─ Single R3F Canvas ──────────────────────────┐
│  ┌─LEFT─┐  ┌───CENTER───┐  ┌─RIGHT─┐       │
│  │Avatar│  │ Lab Map /   │  │Settings│       │
│  │Guide │  │ Game Tiles /│  │Activity│       │
│  │Trophy│  │ Trophy Room │  │Actions │       │
│  │Gauges│  │ (per page)  │  │        │       │
│  └──────┘  └─────────────┘  └────────┘       │
│  ┌─── BOTTOM: Dials │ Nav │ StatusBar ───┐   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
  HTML: sr-only a11y nav + hidden text input proxy only
```

---

## 2. WHY

The HTML looked "terrible, disorganized, poorly designed, and non-coherent" because:
1. Full-screen HTML at z-index 10 completely obscured the 3D cockpit at z-index 0
2. Two independent rendering worlds (DOM + Canvas) fought for the same screen space
3. HTML components were never designed to integrate with the cockpit aesthetic
4. Postprocessing effects (bloom, vignette, DOF) were invisible under the HTML layer
5. 5 built 3D UI components (NavigationButtonGrid, VariableDialCluster, CenterViewportScreen) were never wired into the scene

Removing HTML and rendering all UI in 3D eliminates this split entirely. The cockpit becomes a single cohesive physical control station.

---

## 3. SCOPE

### Goes Full 3D (inside CockpitCanvas)
| Category | File Count | Approach |
|----------|-----------|----------|
| Dashboard pages (home, labs, arcade, profile, settings) | 6 pages | Become thin scene descriptors via `useCockpitScene()` |
| Navigation | Done | NavigationButtonGrid is primary nav |
| Settings controls | Done | ToggleSwitch3D, RadialDial3D already built |
| Data displays (stats, progress, badges) | ~15 components | Migrate to uikit Text + existing 3D components |
| Form inputs (login, signup, chat, search) | ~5 components | uikit Input with hidden HTML proxy |
| Gamification overlays (XP, streak, celebrations) | ~5 components | CeremonyFX (already 3D) + 3D text popups |
| Game UIs (score, timer, quiz) | 35 games | Phased: 6 flagships first, then 29 standard |
| Auth pages (login, signup) | 2 pages | 3D cockpit entrance with uikit form panels |
| Onboarding | 1 page | 3D step wizard in center viewport |

### Stays HTML
| Category | Reason |
|----------|--------|
| Marketing landing page body | SEO — Google must crawl it |
| /pricing, /terms, /privacy | SEO + legal compliance |
| Marketing hero section | 3D cockpit preview (Canvas) embedded in HTML page |
| Screen-reader nav (Sidebar.tsx) | WCAG accessibility — sr-only |
| Error/offline pages | Must work without WebGL |
| Admin panel (/admin/content) | Internal tool, no aesthetic requirement |
| Hidden text input proxy | Browser keyboard/paste/autocomplete compatibility |

---

## 4. ARCHITECTURAL DECISIONS

| ID | Decision | Detail |
|----|----------|--------|
| **UI-1** | Full 3D dashboard | Everything behind auth renders in 3D. Zero SEO risk (behind auth). |
| **UI-2** | @react-three/uikit for text/forms | uikit Input uses hidden HTML proxy for keyboard/paste/autocomplete. |
| **UI-3** | Opaque metallic cockpit | NOT glassmorphic. Carbon composite + chrome bezel. Holographic ONLY on center lab map. |
| **UI-4** | Center swaps per page | Center viewport shows different 3D content per route. Left/right/bottom are fixed. |
| **UI-5** | Left = Player Identity Hub | Avatar + AI Guide + Trophies + 4 Gauges. Always present. |
| **UI-6** | Right = Control & Monitoring Hub | Settings + Activity Log + Quick Actions. Always present. |
| **UI-7** | Bottom = Fixed Instruments | 3 Dials (page-aware) + 5 Nav Buttons + StatusBar3D. Never changes layout. |
| **UI-8** | Game = 75% viewport takeover | Center scales 1.75x, FOV 58→72, panels slide 30% outward and dim to 40%. |
| **UI-9** | Celebration = Dramatic burst | Gold LEDs, HUD expansion, bloom spike, 3D confetti, 2.5s duration. |
| **UI-10** | Smooth crossfade transitions | 400ms ease-out-cubic between non-game pages. MechanicalIris for game entry/exit. |
| **UI-11** | Layered hover feedback | Buttons/cards: glow + scale 1.05. Panels/containers: chrome edge-trace. |
| **UI-12** | Modals = center screen takeover | Dialog replaces center content. No overlay dimming. Close via button/Escape. |
| **UI-13** | 3D holographic tooltips | Materialize next to hovered element. Chrome bezel. 300ms delay. |
| **UI-14** | Keyboard = nav + primary action | 5 nav buttons + center CTA are Tab-accessible. Mouse is primary input. |
| **UI-15** | Dense mechanical + atmospheric audio | Every interaction has spatial audio. User controls density via settings dial. |
| **UI-16** | Full audio customization | 6 controls: master toggle, ambient/spatial/event volumes, mechanical density, lab crossfade. |
| **UI-17** | Lab audio crossfade preserved | 10 Tone.js generative soundscapes. 1.5s crossfade on lab transition. |
| **UI-18** | Phased game migration | Dashboard first → 6 flagships → 29 standard. Prove architecture before scaling. |

---

## 5. QUADRANT LAYOUT

```
╔═══════════════════════════════════════════════════════════╗
║                  HolographicHUD · LED Rim                  ║
╠══════════╦════════════════════════════╦════════════════════╣
║ LEFT 25% ║     CENTER 45%             ║ RIGHT 25%          ║
║ FIXED    ║     SWAPS PER PAGE         ║ FIXED              ║
║          ║                             ║                    ║
║ Avatar   ║ /home → LabMap+Stats+CTA   ║ Settings (2T+2D)   ║
║ AI Guide ║ /labs → LabMap zoomed      ║ Activity Log (20)   ║
║ Trophies ║ /labs/N → LabStructure3D   ║ Quick Actions (4)   ║
║ 4 Gauges ║ /arcade → 35-game grid    ║                    ║
║ (XP,Lv,  ║ /profile → Trophy room    ║                    ║
║  Streak, ║ /settings → Settings      ║                    ║
║  Prog)   ║ /game → 75% TAKEOVER      ║                    ║
╠══════════╩════════════════════════════╩════════════════════╣
║            BOTTOM 15% — FIXED INSTRUMENTS                  ║
║   3 Variable Dials │ 5 Nav Buttons │ StatusBar3D           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 6. MODE PRESETS SUMMARY

8 modes, each controlling 14 atmosphere properties:

| Mode | Route | LED Color | FOV | Bloom | Panel Opacity | Center Scale | Vibe |
|------|-------|-----------|-----|-------|---------------|-------------|------|
| **dashboard** | /home | #00BBFF | 58 | 0.4 | 1.0 | 1.0 | Calm command bridge |
| **labs** | /labs | #00BBFF | 62 | 0.5 | 1.0 | 1.0 | Exploration |
| **lab_detail** | /labs/[id] | lab color | 55 | 0.5 | 1.0 | 1.0 | Focused on one lab |
| **game** | /arcade/[slug] | lab color | 72 | 0.3 | 0.4 | 1.75 | Immersion, 75% takeover |
| **profile** | /profile | #AA66FF | 56 | 0.4 | 1.0 | 1.0 | Personal, reflective |
| **settings** | /settings | #FFAA44 | 56 | 0.35 | 1.0 | 1.0 | Engineering, utilitarian |
| **celebration** | (trigger) | #FFD700 | 62 | 0.8 | 1.0 | 1.0 | Dramatic burst, 2.5s |
| **parent** | /parent | #FFAA44 | 54 | 0.3 | 0.7 | 1.0 | Responsible, data-focused |

---

## 7. AUDIO ARCHITECTURE

**3 layers:**
- **Ambient:** Skin-reactive drone (45-65Hz) + pink noise. Always running.
- **Spatial:** 9 positioned zones via Web Audio PannerNode (HRTF). Sounds come from the direction of the element.
- **Events:** 16 one-shot synthesized sounds triggered by cockpitBroadcastStore.

**9 spatial zones:** cockpit_ambient, center_screen, left_console, right_console, bottom_console, hud_overhead, led_rim, npc_area, game_scene.

**6 user controls:** Master toggle, ambient volume, spatial FX volume, UI sounds volume, mechanical density dial, lab crossfade toggle.

---

## 8. INTERACTION MODEL

| Input | Behavior |
|-------|----------|
| **Mouse hover** | Buttons/cards: glow + scale 1.05. Panels: chrome edge-trace. Scenery: no response. |
| **Mouse click** | Buttons: depress 0.03 + spring bounce + ripple. Toggles: 45° snap. Dials: drag-to-rotate. |
| **Scroll wheel** | uikit scroll containers only (activity log, game grid, trophy gallery). No page scroll. |
| **Text input** | uikit Input with hidden HTML proxy. SDF text rendering. Per-character spring animation. |
| **Keyboard Tab** | 5 nav buttons → center primary action. Enter activates. Escape closes modals. |
| **Tooltips** | 3D holographic panel. 300ms delay. Auto-positioned. Chrome bezel border. |
| **Modals** | Center screen takeover. Crossfade in/out. Close via button, Escape, or navigation. |
| **Drag-and-drop** | Phase 5+ games only. drei useDrag + raycasting. Lift + shadow + drop zone highlight. |

**Broadcast chain example** (user clicks LABS nav button):
1. Nav button: metallic_thunk audio + depress + spring bounce
2. LED rim: purple pulse wave sweeps 218° arc
3. HUD: rings flash briefly
4. StatusBar3D: needle sweep
5. VariableDialCluster: reconfigures to Completion / Games / Quiz Avg
6. Center viewport: crossfade to zoomed lab map (400ms)
7. Camera: FOV interpolates 58→62
8. Active button: LABS stays depressed with pulsing purple glow

---

## 9. IMPLEMENTATION PHASES

| Phase | Week | Scope | New Files | Modified Files |
|-------|------|-------|-----------|----------------|
| **1: Infrastructure** | 1 | useCockpitScene, CockpitUILayer, uikit primitives | ~6 | ~3 |
| **2: Dashboard** | 2 | 6 pages → scene descriptors, 9 panel components | ~9 | ~6 |
| **3: Auth + Forms** | 3 | Login/signup 3D, chat panel, search | ~4 | ~4 |
| **4: Gamification** | 3-4 | Celebration, XP popup, streak → 3D | ~4 | ~5 |
| **5: Flagship Games** | 4-5 | 6 game UIs → 3D panels + shared components | ~6 | ~6 |
| **6: Standard Games** | 6-8 | 29 game UIs via 4 shared templates | ~4 | ~29 |
| **7: Marketing** | 8 | 3D hero section, enhanced CSS | ~1 | ~2 |

**Total: ~34 new files, ~55 modified files. Estimated 6-8 weeks.**

---

## 10. WHAT IS PRESERVED (ZERO CHANGES)

- 140 existing 3D components (cockpit, environments, game scenes, hero animation)
- 37 custom hooks (React Query + Zustand data layer)
- 31 API routes (backend unchanged)
- 13 Zustand stores (cockpitStore gets minor additions only)
- 47 shader files
- 35 game 3D environments
- cockpitBroadcastStore (16 events already defined)
- cockpitMaterials.ts (7 factories match JSON spec)
- CockpitAudioEngine + 10 lab soundscapes

---

## 11. WHAT IS REPLACED

| Old (HTML/CSS) | New (3D) |
|---------------|----------|
| 90 HTML/CSS component files (~31K LOC) | ~40 3D panel components + uikit primitives |
| 37 page layouts (~9.5K LOC) | ~20-line scene descriptors per page |
| Tailwind dashboard styling | cockpitMaterials.ts + uikit styling |
| DOM click/hover events | Raycasting + cockpitBroadcastStore |
| Browser page scroll | uikit scroll containers per panel |
| CSS animations (Framer Motion) | Spring physics + useFrame |
| HTML `<input>` elements | uikit Input (hidden HTML proxy) |
| CSS glassmorphism | Opaque metallic panels |
| HTML sidebar | 3D NavigationButtonGrid (done) |

---

## 12. RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Text readability in 3D | Larger fonts (14px+), geometric typefaces, high-contrast. Fallback to drei Html per element. |
| uikit Input edge cases | Hidden HTML proxy handles keyboard/paste. Fallback to HTML overlay per input if needed. |
| Performance overhead | 3M triangle budget for UI. SDF instancing. useFrameTimeMonitor. |
| Single Canvas crash | Error boundaries per scene group. Fallback to error page on WebGL context loss. |
| 35 game UI migrations | Phased: 4 shared templates cover 29 games. 6 flagships first. |
| Accessibility regression | sr-only nav, ARIA live regions, reduced motion (8 effects), high contrast, font scaling. |

---

## 13. FILES REFERENCE

### Master Spec
- `/SparkForge-Full-ControlScreen.json` — 1,081 lines. Complete cockpit UI specification.

### New Files to Create (~34)
**Infrastructure:** `useCockpitScene.ts`, `CockpitUILayer.tsx`, `CockpitText.tsx`, `CockpitContainer.tsx`, `CockpitScrollPanel.tsx`, `CockpitInput.tsx`, `CockpitTooltip.tsx`

**Panels:** `DashboardCenter.tsx`, `DashboardLeft.tsx`, `DashboardRight.tsx`, `LabsCenter.tsx`, `LabDetailPanel.tsx`, `ArcadePanel.tsx`, `ProfileCenter.tsx`, `SettingsPanel.tsx`, `ParentPanel.tsx`, `LoginPanel3D.tsx`, `OnboardingPanel.tsx`

**Game UI:** `GameScoreGauge.tsx`, `GameTimerDisplay.tsx`, `QuizPanel3D.tsx`, `ChatPanel3D.tsx`, `PhaseIndicator3D.tsx`

**Marketing:** `MarketingHero3D.tsx`

### Stage Documents Affected (~80 files in docs/)
- All stage docs with HTML component code need updating
- CLAUDE.md Sections 7, 8, 9 need 3D UI patterns added

---

## 14. APPROVAL CHAIN

- [x] Quadrant layout — Center swaps, Left/Right/Bottom fixed
- [x] Mode presets — 8 modes, 14 properties each
- [x] Audio zones — 9 zones, 16 events, 6 user controls
- [x] Interaction model — Layered hover, center takeover modals, 3D tooltips
- [x] Accessibility — sr-only nav, reduced motion, high contrast, font scaling
- [x] Game mode — 75% takeover, FOV 72, panels 40% dim, 30% slide
- [x] Celebration — Dramatic burst (gold LEDs, HUD expand, confetti, 2.5s)
- [x] Forms — Full 3D via uikit Input with hidden HTML proxy
- [x] Marketing — 3D hero section + HTML body for SEO
- [x] Phased games — Dashboard → 6 flagships → 29 standard
- [x] Master JSON — `SparkForge-Full-ControlScreen.json` (1,081 lines)

**All decisions approved. Ready for Phase 1 implementation.**

---

## 15. IMPLEMENTATION PROGRESS

### Phase 1: Infrastructure — COMPLETE (April 1, 2026)
| Batch | Files | Status |
|-------|-------|--------|
| A: Mode presets + useCockpitScene hook + cockpitStore updates | 3 files | DONE |
| B: CockpitText + CockpitContainer + CockpitScrollPanel | 3 files | DONE |
| C: CockpitInput + CockpitTooltip | 2 files | DONE |
| D: CockpitUILayer + CockpitCanvas wiring | 2 files | DONE |

**Key files created:**
- `src/lib/3d/cockpitModePresets.ts` — 8 modes × 14 atmosphere properties
- `src/hooks/useCockpitScene.ts` — Page-level mode controller hook
- `src/lib/3d/cockpitDesignTokens.ts` — 131 design tokens (system + component)
- `src/stores/cockpitUIStore.ts` — Center content routing store
- `src/components/3d/CockpitUILayer.tsx` — Master quadrant orchestrator
- 5 UI primitives in `src/components/3d/ui/` (Text, Container, ScrollPanel, Input, Tooltip)

### Phase 2: Dashboard — COMPLETE (April 1, 2026)
| Batch | Files | Status |
|-------|-------|--------|
| A: cockpitUIStore + layout strip + 6 page descriptors + 9 panel stubs | 18 files | DONE |
| B: DashboardLeft + DashboardRight (fixed quadrants) | 2 files | DONE |
| C: DashboardCenter + LabsCenter + SettingsPanel | 3 files | DONE |
| D: LabDetailPanel + ArcadePanel + ProfileCenter + ParentPanel | 4 files | DONE |

**Key changes:**
- Dashboard layout stripped of HTML content layer (AnimatePresence, CelebrationOverlay, etc.)
- 6 dashboard pages converted to thin scene descriptors (sr-only ARIA HTML only)
- 9 panel components in `src/components/3d/panels/` rendering inside CockpitUILayer

### Design Tokens — COMPLETE (April 1-2, 2026)
- 12 system-level sections (typography, edges, depth, springs, celebrations, emissive, mode atmosphere, states, surface detail, focus zones, density, feedback chains, audio)
- 30 component-level designs (10 hero + 4 structural + 3 interactive/display + 4 effects + 9 panels)
- **131 total locked design decisions**
- JSON spec extended to ~1,800 lines
- TypeScript tokens file: `src/lib/3d/cockpitDesignTokens.ts` (~340 lines)
- Full decision log: `DESIGN_DECISIONS_LOG.md`

### Component Rebuild — ALL 30 COMPLETE (April 3, 2026)
All 30 designed components rebuilt to consume `cockpitDesignTokens.ts`.

| Group | Components | Status |
|-------|-----------|--------|
| 10 Hero | Button, NavGrid, Dial, Toggle, LabMap, HUD, LEDRim, StatusBar, Viewport, Iris | DONE |
| 4 Structural | CockpitPanels, SidePanels, Floor, StructuralDetail | DONE |
| 3 Interactive | DialCluster, Card, Panel | DONE |
| 3 Effects | CeremonyFX, Aurora, Wormhole (+ AmbientParticles REMOVED) | DONE |
| 9 Panels | DashboardLeft/Right/Center, LabsCenter, Arcade, Profile, Settings, Parent, LabDetail | DONE |

**Key architectural changes during rebuild:**
- HolographicHUD: overhead rings → peripheral viewport frame
- All `<Html>` usage removed from cards/panels → drei `<Text>`
- HolographicButton: `width`/`height` props → `size` (sm/md/lg)
- CockpitPanels: 768 rivets removed (clean surface)
- RadialDial3D: new `readOnly` prop with glass cover
- ArcadePanel: paginated (12/page) with prev/next controls

### Phase 3: Auth + Forms — COMPLETE (April 3, 2026)
| Batch | Files | Status |
|-------|-------|--------|
| A: LoginPanel3D + auth layout + login page | 3 files | DONE |
| B: SignupPanel3D + ResetPasswordPanel3D + pages | 4 files | DONE |
| C: ChatPanel3D + ArcadePanel search + CockpitUILayer wiring | 4 files | DONE |

**Key files created:**
- `src/components/3d/panels/LoginPanel3D.tsx` — 3D login form (hidden HTML proxy pattern)
- `src/components/3d/panels/SignupPanel3D.tsx` — 4-step 3D signup wizard
- `src/components/3d/panels/ResetPasswordPanel3D.tsx` — 3D password reset
- `src/components/3d/panels/ChatPanel3D.tsx` — AI Guide 3D chat panel

**Key architectural changes:**
- Auth layout renders children as R3F groups inside Canvas (not HTML overlay)
- All auth pages are now thin scene descriptors (zero HTML UI)
- ArcadePanel gained SearchField3D with text search + hidden HTML proxy
- CockpitUILayer routes 'chat' content key to ChatPanel3D

### Phase 4: Gamification — COMPLETE (April 3, 2026)
| Batch | Files | Status |
|-------|-------|--------|
| A: XPPopup3D + useCelebration3D hook | 2 new | DONE |
| B: CelebrationPanel3D + CockpitUILayer wiring | 1 new, 2 modified | DONE |
| Build fixes: AuroraBackground, CockpitCanvas, ProfileCenter | 4 modified | DONE |

**Key files created:**
- `src/components/3d/XPPopup3D.tsx` — 3D floating XP text with spring physics
- `src/components/3d/panels/CelebrationPanel3D.tsx` — Badge/level/streak/lab celebration display
- `src/hooks/useCelebration3D.ts` — Full celebration orchestration hook

### Phase 5: Flagship Games — COMPLETE (April 3, 2026)
| Batch | Files | Status |
|-------|-------|--------|
| A: GameHUD3D + GameTimerBar3D | 2 new | DONE |
| B: GamePhaseOverlay3D (welcome + complete) | 1 new + barrel | DONE |
| C: GameShell + sceneStore + CockpitCanvas integration | 3 modified | DONE |

**Key architectural change:** GameShell registers `GameHUD3D` in `sceneStore.gameHUDContent`. CockpitCanvas renders it above game scenes. All 35 games get the 3D HUD automatically.

### Phases Remaining
| Phase | Scope | Status |
|-------|-------|--------|
| **6: Standard Games** | 29 game UIs via 4 shared templates | NOT STARTED |
| **7: Marketing** | 3D hero section, enhanced CSS | NOT STARTED |

### Architecture After Phase 2
```
Route → page.tsx (thin descriptor, sr-only HTML)
         ↓ useCockpitScene(mode)
         ↓ setCenterContent(key)
         ↓
cockpitUIStore → CockpitUILayer → CenterContentRouter
                    ├── Left:  DashboardLeft (avatar, guide, trophies, gauges)
                    ├── Center: [per-page panel component]
                    ├── Right: DashboardRight (settings, activity, quick actions)
                    └── Bottom: (instruments in CockpitCanvas)
```

---

## 16. COMPANION FILES

| File | Purpose |
|------|---------|
| `SparkForge-Full-ControlScreen.json` | Master spec — ~1,800 lines, 11 original sections + design_tokens + component_designs |
| `DESIGN_DECISIONS_LOG.md` | All 131 design decisions with rationale |
| `src/lib/3d/cockpitDesignTokens.ts` | TypeScript constants consumed by all 3D components |
| `src/lib/3d/cockpitModePresets.ts` | 8 mode presets with route mapping |
| `SESSION_REFERENCE.md` | Continuity note for next development session |

---

*Master SparkForge UI Design Change v1.5 — April 3, 2026*
*Phase 1-5 complete. 131 design decisions locked. 30 cockpit components + 4 auth panels + 3 gamification + 4 game UI = 41 components. Phases 6-7 pending.*
*Companion spec: SparkForge-Full-ControlScreen.json (~1,800 lines)*
