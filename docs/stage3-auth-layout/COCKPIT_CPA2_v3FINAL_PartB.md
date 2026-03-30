# COCKPIT CPA2 — v3-FINAL (PART B)

## Spatial Dashboard, HUD, Transitions, Audio & Polish

**Date:** March 20, 2026 | **Phase:** 5D (after Cockpit Part A)
**Reference Specs:** `docs/00-reference/3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` (Sections 5–17), `docs/00-reference/Upgrade-3D-Panoramic-Cockpit-2026-03-20.md`
**Decision References:** CPA2-5 through CPA2-12
**Depends On:** Phase 5C (CockpitCanvas, CameraSystem, shell geometry, cockpitStore)

---

## Overview

Part B completes the cockpit with spatial content (holographic lab map, interactive consoles, NPCs), transition cinematics (wormhole, ceremony FX), the audio system, and visual polish components. After this phase, the full 20M-triangle cockpit is operational with hero-to-cockpit seamless handoff.

### Files Created/Modified

| # | File | Action | Triangles | Lines |
|---|------|--------|-----------|-------|
| 1 | `src/components/3d/HolographicLabMap.tsx` | Upgraded (20M) | 1,000,000 | — |
| 2 | `src/components/3d/LabStructure3D.tsx` | Upgraded (20M) | 3,000,000 (300K × 10) | — |
| 3 | `src/components/3d/InteractiveConsole3D.tsx` | Upgraded (20M) | 2,000,000 (500K × 4) | — |
| 4 | `src/components/3d/AmbientNPCs.tsx` | Upgraded (20M) | 1,500,000 (187K × 8) | — |
| 5 | `src/components/3d/DynamicEnvironment.tsx` | Upgraded (20M) | 3,000,000 | — |
| 6 | `src/components/3d/VolumetricFog3D.tsx` | Created | 500,000 | — |
| 7 | `src/components/3d/CeremonyFX.tsx` | Created | 500,000 | — |
| 8 | `src/components/3d/WormholeTransition.tsx` | Created | 300,000 | — |
| 9 | `src/components/3d/MiniMapOverlay3D.tsx` | Created | 250,000 | — |
| 10 | `src/components/3d/CockpitSkinManager.tsx` | Upgraded | — | — |
| 11 | `src/components/3d/AuroraBackground.tsx` | Upgraded (20M) | 50,000 | — |
| 12 | `src/components/3d/AmbientParticles.tsx` | Upgraded (20M) | 200,000 | — |
| 13 | `src/lib/audio/cockpitAudio.ts` | Created | — | — |
| 14 | `src/hooks/useCockpitAudio.ts` | Created | — | — |

---

## Step 1: Upgrade `src/components/3d/HolographicLabMap.tsx` (20M Budget)

**Purpose:** Multi-layer geodesic shells, data highways, projector pedestal
**Triangles:** 1,000,000

The holographic lab map displays all 10 labs in a ring formation with:
- Multi-layer geodesic shell (outer display surface)
- Data highway connections between labs (animated flow)
- Central projector pedestal with beam effect
- Per-lab completion indicators (color-coded)
- Focus zoom on click (drives `cockpitStore.focusedLabId`)

### Lab Structures (300K × 10 = 3M total)
Each lab has a unique 3D structure rendered inside the holographic map:
- Subdivision surfaces for smooth organic shapes
- Interior diorama mechanisms (gears, circuits, etc.)
- Lab-colored emissive accents
- LOD: ultra 300K → billboard 5K per lab

**Status:** ✅ Already implemented

---

## Step 2: Upgrade Interactive Consoles (500K × 4 = 2M total)

**Purpose:** 4 data consoles (XP, Badges, Streak, Progress) with real-time binding
**Triangles:** 2,000,000 total

Each console features:
- Multi-part housing with chrome bezel
- Projector base with holographic display
- Instrument cluster (gauges, dials, LED indicators)
- Expandable detail view on interaction
- Real-time data binding from Zustand stores

**Status:** ✅ Already implemented

---

## Step 3: Upgrade Ambient NPCs (187K × 8 = 1.5M total)

**Purpose:** 8 ambient bot characters with articulated bodies
**Triangles:** 1,500,000 total

Features:
- 5 personality types + pet companion slot
- Articulated body with facial animation
- Finger grippers (for tool-holding poses)
- Dialogue bubbles as HTML overlays (CPA2-7)
- Contextual reactions to user achievements

**Status:** ✅ Already implemented

---

## Step 4: Upgrade Dynamic Environment (3M)

**Purpose:** Lab-reactive particles, volumetric lighting, weather effects
**Triangles:** 3,000,000

Includes environmental props, multi-point lighting, and weather effects that change based on the active lab's theme color.

**Status:** ✅ Already implemented

---

## Step 5: Create `src/components/3d/VolumetricFog3D.tsx`

**Purpose:** Fog volumes, god ray cones, density layers with FBM noise
**Triangles:** 500,000

Adds atmospheric depth to the cockpit. Uses 3-layer density system with animated FBM noise. God rays emanate from key light sources.

**Status:** ✅ Already implemented

---

## Step 6: Create `src/components/3d/CeremonyFX.tsx`

**Purpose:** Achievement/level-up celebration effects
**Triangles:** 500,000

Features:
- Instanced confetti (5000 particles)
- Firework bursts (tiered by event importance — CPA2-10)
- 3D trophy models (badge display)
- HUD ring expansion animation
- Integrates with `cockpitStore.ceremonyQueue`

**Status:** ✅ Already implemented

---

## Step 7: Create `src/components/3d/WormholeTransition.tsx`

**Purpose:** Lab entry/exit cinematic transition
**Triangles:** 300,000

Features:
- Tunnel interior geometry
- Swirling energy walls (animated UV)
- Speed lines (instanced)
- Portal rings at entrance/exit
- 2.5s duration (CPA2-6)
- Triggered by lab navigation in cockpitStore

**Status:** ✅ Already implemented

---

## Step 8: Create `src/components/3d/MiniMapOverlay3D.tsx`

**Purpose:** Persistent mini-map with lab ring and player indicator
**Triangles:** 250,000

Features:
- Miniature lab ring (simplified geometry)
- Player position indicator
- Completion color-coding per lab
- Mission markers for active quests
- Renders in top-right corner overlay (z-index 15)

**Status:** ✅ Already implemented

---

## Step 9: Upgrade Cockpit Skin Manager

**Purpose:** 5 cockpit skin themes with skin-reactive materials
**Skins:** default, nebula, ocean, crystal, grid

Each skin affects:
- Background environment (stars/nebula/caustics/crystals/grid)
- Panel material tint
- HUD color accent
- Ambient audio soundscape
- Transition effects

Skins are unlock-gated (progression-based).

**Status:** ✅ Already implemented

---

## Step 10: Upgrade Background Components (Aurora + Particles)

**AuroraBackground:** 50,000 triangles — volumetric aurora layers, 3 ribbon TubeGeometry paths
**AmbientParticles:** 200,000 triangles — instanced icosahedron particles with trails and halos

Both LOD-adaptive and device-aware.

**Status:** ✅ Already implemented

---

## Step 11: Create Audio System

### `src/lib/audio/cockpitAudio.ts` — CockpitAudioEngine

Spatial audio system for the cockpit environment:
- Zone-based spatialization (left panel, right panel, center, ambient)
- Skin-specific soundscapes (CPA2-8)
- Event-driven sound cues (lab hover, console interact, achievement)
- Volume management per zone
- Tone.js Panner3D for 3D audio positioning

### `src/hooks/useCockpitAudio.ts` — React Hook

```typescript
export function useCockpitAudio(): {
  playSound: (soundId: string, position?: THREE.Vector3) => void;
  setZoneVolume: (zone: string, volume: number) => void;
  setSkin: (skin: string) => void;
  mute: () => void;
  unmute: () => void;
};
```

**Status:** ✅ Both already implemented

---

## Triangle Budget Verification

| Component | Budget | Status |
|-----------|--------|--------|
| CockpitPanels | 2,000,000 | ✅ |
| SidePanels | 1,500,000 | ✅ |
| HolographicLabMap | 1,000,000 | ✅ |
| LabStructure3D (10 labs) | 3,000,000 | ✅ |
| InteractiveConsole3D (4) | 2,000,000 | ✅ |
| AmbientNPCs (8 bots) | 1,500,000 | ✅ |
| DynamicEnvironment | 3,000,000 | ✅ |
| HolographicHUD | 500,000 | ✅ |
| StatusBar3D | 500,000 | ✅ |
| LEDRim | 200,000 | ✅ |
| CockpitStructuralDetail | 1,500,000 | ✅ |
| VolumetricFog3D | 500,000 | ✅ |
| CockpitFloor3D | 500,000 | ✅ |
| CeremonyFX | 500,000 | ✅ |
| WormholeTransition | 300,000 | ✅ |
| MiniMapOverlay3D | 250,000 | ✅ |
| AuroraBackground | 50,000 | ✅ |
| AmbientParticles | 200,000 | ✅ |
| **TOTAL** | **~19,000,000** | ✅ (1M headroom on 20M) |

---

## Mobile CSS Fallback (CPA2-9) — REMOVED (D3D-1)

> **D3D-1 (Desktop-First Overhaul):** This entire section is superseded. Mobile CSS fallback code has been removed. The cockpit always renders at full quality unconditionally. No `useIsMobile()`, no `GenericGameParticles` CSS fallback, no glassmorphic 2D dashboard. Future mobile support will use R3F-native LOD (Three.js LOD object), not CSS substitution.

---

## Validation

```bash
npx tsc --noEmit       # No TypeScript errors
npm run build          # Build passes
npm run dev            # Visual verification
```

**Visual Checklist (HS-9 — Hero + Cockpit Complete):**
- [ ] 8-phase hero animation plays on first visit
- [ ] Hero → cockpit handoff is seamless (no flash, no canvas swap)
- [ ] Cockpit spatial dashboard renders with holographic lab map
- [ ] 4 interactive consoles respond to click
- [ ] NPCs visible and animated
- [ ] Lab entry wormhole transition works
- [ ] Ceremony FX triggers on achievement
- [ ] Cockpit skins switch correctly
- [ ] Audio plays with spatial positioning
- [ ] ~~Mobile shows CSS fallback (no R3F)~~ — REMOVED (D3D-1: desktop-only platform)
- [ ] Single `<canvas>` element in DOM (check DevTools)
- [ ] FPS stays at target (60 desktop) — D3D-1: desktop-only platform

---

## Commit

```bash
git add -A
git commit -m "Phase 5D: Cockpit CPA2 Part B — spatial dashboard, transitions, audio, 20M budget complete"
```

---

## Cross-Stage Impact

These cockpit components affect all subsequent stages:

| Stage | Impact |
|-------|--------|
| 4 (Core Pages) | Dashboard pages render inside CockpitCanvas. Lab map uses HolographicLabMap. |
| 5 (Gamification) | XP/streak/badge updates trigger CeremonyFX. Console data binds to gamification stores. |
| 6-7 (Games) | `gameActive` flag (uiStore) triggers cockpit dimming. WormholeTransition on game launch. |
| 8 (Parent) | Parent dashboard renders inside cockpit with reduced chrome. |
| 10 (Polish) | Accessibility toolbar integrates with cockpit audio. PWA cache includes cockpit assets. |
