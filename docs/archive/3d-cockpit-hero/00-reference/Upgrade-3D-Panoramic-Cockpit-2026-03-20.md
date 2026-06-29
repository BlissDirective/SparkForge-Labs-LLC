# SparkForge 3D Panoramic Cockpit Upgrade — 20M Triangle Budget

## Implementation Status (as of March 20, 2026)

> This document is the **change record** for the 20M triangle upgrade and FIX-TRIPLE-CANVAS fix.
> The **active architectural spec** is `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`.
> `COCKPIT_PANORAMIC_ARCHITECTURE_v1.md` has been archived to `_SUPERSEDED/`.

| Section | Description | Status |
|---------|-------------|--------|
| **Section A** | Unified CockpitCanvas — FIX-TRIPLE-CANVAS: single Canvas, StationFrame/SpatialDashboard/HeroAnimation rewritten as `<group>` wrappers, CameraSystem.tsx created, seamless hero-to-cockpit handoff | ✅ COMPLETE |
| **Section B** | 20M triangle budget — 13 components upgraded + 8 new components created | ✅ COMPLETE |
| **Section C** | Store & hook updates — deviceStore 20M profiles + system tier, cockpitStore heroPhase, useLOD system cap removed, cockpitConfig.ts TRIANGLE_BUDGET_V2 | ✅ COMPLETE |
| **Section D** | Audio system — `cockpitAudio.ts` (CockpitAudioEngine singleton), `useCockpitAudio.ts` | ✅ COMPLETE |
| **Section E** | File changes — 23 modified + 10 created (see lists below) | ✅ COMPLETE |
| **Section F** | Verification — build check, TypeScript check, single Canvas confirm, hero handoff, triangle count, LOD degradation, game mode, adaptive FPS, mobile fallback | 🔲 PENDING — awaiting Stage visual checkpoint (HS-5) |

**Documentation updates from Section E (Docs to UPDATE):**
- `CLAUDE.md` — ✅ Updated (Sections 9, 9.1, 9.3, 11, 14 reflect 20M upgrade)
- `3D-Component-Registry.md` — 🔲 PENDING
- `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` — ✅ Updated (March 20, 2026: budgets, file registry, CPA2 decisions, store values)

---

## Context

The SparkForge cockpit currently uses ~68K–104K triangles across all components — a fraction of the desktop GPU budget. This upgrade increases the cockpit total to **20,000,000 triangles** (desktop), enabling dramatically higher visual fidelity: high-poly panels, volumetric effects, detailed NPCs, structural set dressing, and new transition/ceremony systems.

Additionally, a critical **triple-Canvas architecture bug** was discovered during review: `HeroAnimation.tsx`, `StationFrame.tsx`, and `SpatialDashboard.tsx` each create their own R3F `<Canvas>`, violating the CPA2-1 decision lock ("Single R3F Canvas for entire app lifecycle"). The hero-to-cockpit "seamless handoff" (CPA2-3) is **not implemented** — the hero unmounts entirely and the cockpit mounts independently with a separate Canvas. This upgrade fixes both issues.

---

## SECTION A: Critical Architecture Fix — Unified CockpitCanvas

### Problem: Triple Canvas

| Component | Canvas Location | frameloop | z-index |
|-----------|----------------|-----------|---------|
| `HeroAnimation.tsx` (line 614) | Own Canvas | default | 50 |
| `StationFrame.tsx` (line 284) | Own Canvas | `"demand"` | 0 |
| `SpatialDashboard.tsx` (line 181) | Own Canvas | `"always"` | 0 |

This causes dual/triple WebGL contexts, doubled GPU overhead, and prevents seamless hero-to-cockpit transition.

### Solution: Single Persistent CockpitCanvas

**Create** `src/components/3d/CockpitCanvas.tsx` — a single R3F Canvas that wraps the entire app:

```
<CockpitCanvas>  (fixed, full viewport, z-0, frameloop="always")
  <Suspense>
    <AdaptiveDpr />
    <Environment />
    <CameraSystem />                        // NEW — unified camera

    // Hero Scene Group (visible during animation only)
    <group visible={heroPhase !== 'complete'}>
      <HeroSceneContent />                  // extracted from HeroAnimation inner scene
    </group>

    // Cockpit Shell Group (visible post-hero, hidden during games)
    <group visible={heroComplete && !isGameMode}>
      <AuroraBackground />
      <AmbientParticles />
      <CockpitPanels />
      <LEDRim />
      <SidePanels />
      <HolographicHUD />
      <StatusBar3D />
      <CockpitStructuralDetail />           // NEW
      <CockpitFloor3D />                    // NEW
      <VolumetricFog3D />                   // NEW
    </group>

    // Spatial Dashboard Group (visible on dashboard routes)
    <group visible={isSpatialView && heroComplete}>
      <HolographicLabMap />
      <InteractiveConsole3D x4 />
      <AmbientNPCs />
      <DynamicEnvironment />
      <Stars />
    </group>

    // Transition & Ceremony Groups
    <WormholeTransition />                  // NEW
    <CeremonyFX />                          // NEW
    <MiniMapOverlay3D />                    // NEW

    // Single Postprocessing Stack
    <PostprocessingStack />
  </Suspense>
</CockpitCanvas>
```

### Seamless Hero-to-Cockpit Handoff (CPA2-3)

Camera positions already align: Hero Phase 7 ends at `[0, 6.5, 7]` fov 58 — identical to SpatialDashboard's starting camera. With the unified Canvas:

- **t=0–14s**: Hero group visible, cockpit groups hidden
- **t=14s**: Cockpit groups begin materializing (opacity 0→1 over 3s)
- **t=17s**: Hero elements fade out (opacity 1→0 over 2s), cockpit fully visible
- **t=19s**: Hero group visibility=false, hero geometries disposed — **zero Canvas swap, zero context loss**

### Game Mode Strategy

Games **keep their own separate Canvas** (preserving existing FIX-DUAL-CANVAS pattern). When `uiStore.gameActive === true`, the CockpitCanvas unmounts its R3F Canvas (as StationFrame already does today). When the game exits, CockpitCanvas remounts. This preserves the existing game architecture and avoids re-testing all 35 games. The key improvement: cockpit-to-cockpit and hero-to-cockpit transitions never create/destroy a Canvas.

---

## SECTION B: 20M Triangle Budget Allocation

### Device Scaling

| Device | Current maxTriangles | New maxTriangles | Notes |
|--------|---------------------|------------------|-------|
| **Desktop** | 10,000,000 | **20,000,000** | Full cockpit + games |
| **Tablet** | 5,000,000 | **10,000,000** | 50% of desktop |
| **Mobile** | 2,500,000 | 2,500,000 | CSS fallback unchanged |

### Per-Component Budget (Desktop Ultra)

#### Cockpit Shell Components

| Component | Current Tris | New Budget | What Changes |
|-----------|-------------|------------|-------------|
| **CockpitPanels** | 1,200 | **2,000,000** | 256-seg curved hull, multi-layer construction, edge beveling, instanced rivets/bolts, animated sub-panels, hex clusters with internal gauge geometry |
| **LEDRim** | 150 | **200,000** | 1,000+ individual LED capsules, multi-layer (core + diffuser + bracket), data visualization mode, audio-reactive pulse waves, secondary accent rims |
| **SidePanels** | 100 | **1,500,000** | 3D box panels with depth, left: physical radar dish with turntable, right: 3D data columns + holographic text, chrome bezels, articulated mounting arms |
| **HolographicHUD** | 600 | **500,000** | 8 concentric rings (was 3), data-display arc segments, reticle targeting system, volumetric scan beams, corner data readouts with Text geometry |
| **StatusBar3D** | 300 | **500,000** | 3D console strip with depth, full circular XP speedometer, volumetric streak flame sculpture, 10 miniature lab model indicators, chrome divider pillars |
| **AuroraBackground** | 2 | **50,000** | Volumetric aurora layers with 3D depth geometry |
| **AmbientParticles** | 500 | **200,000** | Higher-fidelity particle shapes, enhanced trails |
| **Shell Subtotal** | ~2,850 | **4,950,000** | |

#### Spatial Dashboard Components

| Component | Current Tris | New Budget | What Changes |
|-----------|-------------|------------|-------------|
| **HolographicLabMap** (core) | 3,000 | **1,000,000** | Multi-layer geodesic shells (detail levels 1-4), data highway spline tubes, 3D grid floor with raised intersections, holographic projector pedestal with lens assembly |
| **LabStructure3D** (10 labs) | 25,000 | **3,000,000** | 300K/lab: subdivision surfaces, interior mechanisms (gears, circuits, neurons), grated landing pads with lighting strips, miniature scene dioramas |
| **InteractiveConsole3D** (x4) | 6,000 | **2,000,000** | 500K/console: multi-part housing (frame rails, side walls, ventilation), holographic projector base, full instrument cluster displays, interactive extend/retract animation |
| **AmbientNPCs** (8 bots) | 4,000 | **1,500,000** | 187K/bot: subdivision surface bodies, facial animation geometry (visor expressions), articulated 3-finger grippers, personality-specific accessories, skeletal mesh skinning |
| **DynamicEnvironment** | 15,000 | **3,000,000** | High-poly lab-themed particles, volumetric fog layers, floating holographic data fragments, visible light source housing, dynamic weather effects |
| **Stars/Skybox** | 2,000 | **500,000** | Enhanced starfield with nebula geometry |
| **Spatial Subtotal** | ~55,000 | **11,000,000** | |

#### NEW Components (enabled by 20M budget)

| Component | Budget | Description |
|-----------|--------|-------------|
| **CockpitStructuralDetail** | **1,500,000** | Cable bundles (50+ TubeGeometry splines), conduit pipes with junction boxes, ventilation panels with animated airflow, warning signage, structural ribs, access hatches, LED indicator strips |
| **VolumetricFog3D** | **500,000** | Overlapping sphere/box fog volumes with custom shader, god ray cone meshes, lab-reactive coloring, density control (thickens for celebrations) |
| **CockpitFloor3D** | **500,000** | Grated floor panels with visible depth, sub-floor piping with glowing energy conduits, maintenance hatches, embedded LED channels, lab-colored under-glow |
| **CeremonyFX** | **500,000** | Instanced confetti with physics, firework bursts, pop-up 3D trophy/badge models, HUD ring expansion effects |
| **WormholeTransition** | **300,000** | Animated tunnel interior with swirling energy walls, entry/exit portal rings, instanced speed lines, lab destination preview |
| **MiniMapOverlay3D** | **250,000** | Miniature lab ring with simplified lab structures, player position indicator, completion color-coding, interactive rotation |
| **New Subtotal** | **3,550,000** | |

#### Budget Summary

| Category | Desktop | Tablet |
|----------|---------|--------|
| Cockpit Shell | 4,950,000 | 2,475,000 |
| Spatial Dashboard | 11,000,000 | 5,500,000 |
| New Components | 3,550,000 | 1,775,000 |
| Dynamic Headroom | 500,000 | 250,000 |
| **TOTAL** | **20,000,000** | **10,000,000** |

---

## SECTION C: Store & Hook Updates

### deviceStore.ts — Updated Values

```typescript
// PERFORMANCE_PROFILES changes:
desktop: {
  maxTriangles: 20_000_000,    // was 10_000_000
  maxLights: 16,               // was 12
  instancedMeshLimit: 5000,    // was 2000
  sphereSegments: 64,          // was 32
}
tablet: {
  maxTriangles: 10_000_000,    // was 5_000_000
  maxLights: 8,                // was 4
  instancedMeshLimit: 1500,    // was 500
  sphereSegments: 32,          // was 16
}
// mobile: UNCHANGED

// TRIANGLE_BUDGETS — add 'system' tier:
{ flagship: number; flLite: number; standard: number; system: number }
desktop:  { ..., system: 20_000_000 }
tablet:   { ..., system: 10_000_000 }
mobile:   { ..., system: 0 }
```

### useLOD.ts — Remove Hardcoded System Cap

```typescript
// Line 172 — CURRENT:
() => tier === 'system' ? 3000 : getTriangleBudget(tier)

// NEW:
() => getTriangleBudget(tier)  // system tier now uses deviceStore budget
```

Update `TIER_SCALE.system` and LOD_CONFIGS `ultra` segments from 32 to 64.

### cockpitStore.ts — Add Hero Phase

Add `heroPhase: 'idle' | 'animating' | 'materializing' | 'complete'` state with `setHeroPhase` action.

---

## SECTION D: Cockpit Audio System (CockpitAudioEngine)

Per CPA v2.0, build the full spatial audio system alongside the visual upgrade.

### Architecture

Create `src/lib/audio/cockpitAudio.ts` — a Tone.js-based `CockpitAudioEngine` singleton:

- **Ambient drone**: 55Hz sine (from hero Phase 7 handoff) + filtered pink noise, lab-color-reactive
- **Spatial audio zones**: Positional audio tied to cockpit components (console hums, NPC chatter, radar pings)
- **Skin-specific soundscapes**: Each cockpit skin (Default, Nebula, Arctic, Volcanic, Digital) has unique ambient layers
- **Event sounds**: Console interaction clicks, lab selection whooshes, HUD scan beeps, celebration fanfares
- **Volume respects `uiStore.soundEnabled`** — muted when false, resumes when re-enabled

### Integration Points

| Component | Audio |
|-----------|-------|
| CockpitPanels | Low-frequency panel hum, button click feedback |
| LEDRim | Subtle electrical buzz, reactive pulse sounds |
| SidePanels | Radar ping (left), terminal keystrokes (right) |
| HolographicHUD | Scan line sweep, ring rotation whir |
| InteractiveConsole3D | Focus/unfocus transition sounds |
| AmbientNPCs | Faint chatter/beeps at proximity |
| CeremonyFX | Fanfare, firework pops, level-up chime |
| WormholeTransition | Warp entry/exit whoosh, tunnel resonance |
| Lab transitions | Lab-specific ambient shift (crossfade 500ms) |

### Files

| File | Purpose | Est. LOC |
|------|---------|----------|
| `src/lib/audio/cockpitAudio.ts` | CockpitAudioEngine singleton + spatial zones | ~500 |
| `src/hooks/useCockpitAudio.ts` | React hook for component-level audio integration | ~150 |

---

## SECTION E: Complete File Change List

### Code Files to MODIFY

| # | File | Change Type | Summary |
|---|------|------------|---------|
| 1 | `src/components/3d/StationFrame.tsx` | **REWRITE** | Remove Canvas, export as scene group within CockpitCanvas |
| 2 | `src/components/3d/SpatialDashboard.tsx` | **REWRITE** | Remove Canvas, export as scene group within CockpitCanvas |
| 3 | `src/components/3d/HeroAnimation.tsx` | **REWRITE** | Remove Canvas, export HeroScene as group, add materialization crossfade |
| 4 | `src/components/3d/CockpitPanels.tsx` | **MAJOR** | 256-seg curves, multi-layer construction, rivets, animated sub-panels |
| 5 | `src/components/3d/LEDRim.tsx` | **MAJOR** | 1000+ LED capsules, data viz mode, mounting hardware |
| 6 | `src/components/3d/SidePanels.tsx` | **MAJOR** | 3D box panels, physical radar dish, 3D data columns |
| 7 | `src/components/3d/HolographicHUD.tsx` | **MAJOR** | 8 rings, data arcs, reticle, volumetric beams |
| 8 | `src/components/3d/StatusBar3D.tsx` | **MAJOR** | 3D console strip, XP speedometer, flame sculpture |
| 9 | `src/components/3d/HolographicLabMap.tsx` | **MAJOR** | Multi-layer geodesic, data highways, projector pedestal |
| 10 | `src/components/3d/LabStructure3D.tsx` | **MAJOR** | 300K/lab, interior detail, diorama scenes |
| 11 | `src/components/3d/InteractiveConsole3D.tsx` | **MAJOR** | 500K/console, full housing, projector base |
| 12 | `src/components/3d/AmbientNPCs.tsx` | **MAJOR** | 187K/bot, facial animation, finger articulation |
| 13 | `src/components/3d/DynamicEnvironment.tsx` | **MAJOR** | Volumetric fog, environmental props, weather |
| 14 | `src/components/3d/AuroraBackground.tsx` | **MINOR** | Volumetric layers for ultra LOD |
| 15 | `src/components/3d/AmbientParticles.tsx` | **MINOR** | Higher fidelity shapes |
| 16 | `src/components/3d/CockpitSkinManager.tsx` | **MINOR** | Updated budgets for skin-reactive geometry |
| 17 | `src/stores/deviceStore.ts` | **MODERATE** | 20M profiles, system tier, increased limits |
| 18 | `src/stores/cockpitStore.ts` | **MODERATE** | Add heroPhase state |
| 19 | `src/stores/uiStore.ts` | **MINOR** | Verify gameActive with unified Canvas |
| 20 | `src/hooks/useLOD.ts` | **MODERATE** | Remove 3K system cap, ultra segments=64 |
| 21 | `src/hooks/useHeroAnimation.ts` | **MODERATE** | heroPhase sync with cockpitStore |
| 22 | `src/lib/3d/cockpitConfig.ts` | **MODERATE** | Rewrite TRIANGLE_BUDGET_V2, geometry constants |
| 23 | `src/app/layout.tsx` or `src/app/(dashboard)/layout.tsx` | **MODERATE** | Mount CockpitCanvas |

### New Code Files to CREATE

| # | File | Purpose | Est. LOC |
|---|------|---------|----------|
| 1 | `src/components/3d/CockpitCanvas.tsx` | Unified single Canvas wrapper | ~300 |
| 2 | `src/components/3d/CameraSystem.tsx` | Unified camera (hero + dashboard + transitions) | ~200 |
| 3 | `src/components/3d/CockpitStructuralDetail.tsx` | Cables, conduits, vents, rivets, signs | ~400 |
| 4 | `src/components/3d/VolumetricFog3D.tsx` | Fog volumes, god rays | ~250 |
| 5 | `src/components/3d/CockpitFloor3D.tsx` | Grated floors, sub-floor piping | ~300 |
| 6 | `src/components/3d/CeremonyFX.tsx` | Celebration effects, trophies | ~350 |
| 7 | `src/components/3d/WormholeTransition.tsx` | Lab entrance tunnel | ~300 |
| 8 | `src/components/3d/MiniMapOverlay3D.tsx` | Persistent 3D minimap | ~250 |
| 9 | `src/lib/audio/cockpitAudio.ts` | CockpitAudioEngine + spatial zones | ~500 |
| 10 | `src/hooks/useCockpitAudio.ts` | React hook for component audio | ~150 |

### Documentation Files to UPDATE

| # | File | Sections to Update |
|---|------|--------------------|
| 1 | `CLAUDE.md` | Section 9: cockpit budget table (104K→20M), Section 9.1: device budgets, Section 9.3: cockpit component table, Section 11: new bug entries, Section 14: cockpitStore state |
| 2 | `docs/00-reference/3D-Component-Registry.md` | Add 8 new components, update existing component budgets |
| 3 | `docs/00-reference/3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` | Update budget section, mark CPA2-1 and CPA2-3 as IMPLEMENTED |

---

## SECTION E: Implementation Order

### Phase 1 — Foundation (Blocking)
1. Update `deviceStore.ts` — new PERFORMANCE_PROFILES and TRIANGLE_BUDGETS with `system` tier
2. Update `useLOD.ts` — remove 3K system cap, update ultra segments to 64
3. Update `cockpitConfig.ts` — new budget constants
4. Update `cockpitStore.ts` — add `heroPhase` state

### Phase 2 — Canvas Unification
5. Create `CockpitCanvas.tsx` — unified single Canvas
6. Create `CameraSystem.tsx` — unified camera system
7. Rewrite `StationFrame.tsx` — remove Canvas, export as scene group
8. Rewrite `SpatialDashboard.tsx` — remove Canvas, export as scene group
9. Rewrite `HeroAnimation.tsx` — remove Canvas, export as group with crossfade
10. Update `useHeroAnimation.ts` — heroPhase sync
11. Update layout file — mount CockpitCanvas

### Phase 3 — Component Upgrades (one at a time, test each)
12. Upgrade `CockpitPanels.tsx` → 2M tris
13. Upgrade `LEDRim.tsx` → 200K tris
14. Upgrade `SidePanels.tsx` → 1.5M tris
15. Upgrade `HolographicHUD.tsx` → 500K tris
16. Upgrade `StatusBar3D.tsx` → 500K tris
17. Upgrade `HolographicLabMap.tsx` → 1M tris
18. Upgrade `LabStructure3D.tsx` → 3M tris (300K/lab)
19. Upgrade `InteractiveConsole3D.tsx` → 2M tris (500K/console)
20. Upgrade `AmbientNPCs.tsx` → 1.5M tris (187K/bot)
21. Upgrade `DynamicEnvironment.tsx` → 3M tris

### Phase 4 — New Visual Components
22. Create `CockpitStructuralDetail.tsx` → 1.5M tris
23. Create `VolumetricFog3D.tsx` → 500K tris
24. Create `CockpitFloor3D.tsx` → 500K tris
25. Create `CeremonyFX.tsx` → 500K tris
26. Create `WormholeTransition.tsx` → 300K tris
27. Create `MiniMapOverlay3D.tsx` → 250K tris

### Phase 5 — Audio System
28. Create `cockpitAudio.ts` — CockpitAudioEngine singleton with Tone.js spatial zones
29. Create `useCockpitAudio.ts` — React hook for component-level audio
30. Integrate audio into upgraded cockpit components (CockpitPanels, LEDRim, SidePanels, HolographicHUD, etc.)

### Phase 6 — Documentation & Testing
31. Update `CLAUDE.md` sections 9, 9.1, 9.3, 11, 14
32. Update `3D-Component-Registry.md`
33. Update `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`
34. Run `npm run build` and `npx tsc --noEmit`
35. Performance test across device profiles

---

## SECTION F: Verification Plan

1. **Build verification**: `npm run build` — must pass with zero errors
2. **TypeScript check**: `npx tsc --noEmit` — must pass clean
3. **Single Canvas verification**: Confirm only ONE `<Canvas>` element in the DOM at any time (inspect via browser DevTools)
4. **Hero-to-cockpit seamless handoff**: Run dev server, watch hero animation through all 8 phases — no flash, no blank frame, no Canvas swap visible
5. **Triangle budget verification**: Use R3F `<Stats>` or Three.js `renderer.info.render.triangles` to confirm desktop scene uses ~20M tris
6. **LOD degradation**: Test with tablet/mobile device profiles — confirm reduced geometry
7. **Game mode**: Enter a game — confirm cockpit groups hide, game renders, cockpit returns on exit
8. **Adaptive FPS**: Monitor FPS — confirm auto-downgrade when performance drops below 80% target
9. **Mobile fallback**: Verify CSS-only frame on mobile (no WebGL)

---

## Summary of Key Numbers

| Metric | Before | After |
|--------|--------|-------|
| Total cockpit triangles (desktop) | ~68K–104K | **20,000,000** |
| Number of R3F Canvas instances | 3 | **1** |
| System tier LOD budget | 3,000 | **20,000,000** |
| Desktop maxTriangles | 10M | **20M** |
| Tablet maxTriangles | 5M | **10M** |
| Cockpit components | 13 | **21** (13 upgraded + 8 new) |
| Files to modify | — | 23 |
| Files to create | — | 10 (8 visual + 2 audio) |
| Docs to update | — | 3 |
| Hero-cockpit handoff | Separate Canvas, unmount/remount | Seamless crossfade in single Canvas |
