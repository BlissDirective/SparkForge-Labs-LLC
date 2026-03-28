# SPARKFORGE -- STAGE 6D v3-FINAL (PART A): Prompt Lab 3D

> **AUDIT FIXES APPLIED (March 27, 2026):**
> - **S6-CRIT-002:** `PromptBubble3DScene.tsx` refactored from standalone `<Canvas>` to `<group>` (D3D-B1). Canvas, camera, dpr, gl removed — CockpitCanvas provides these.
> - **S6-HIGH-003:** Added `useEffect` disposal cleanup for `MeshPhysicalMaterial` and `SpriteMaterial` in `PromptBubble3D.tsx` to prevent GPU memory leaks.
> - **3D Embedding:** PromptLabEnvironment correctly wired into PromptBubble3DScene group. No duplicate Environment instances.
>
> **P3 ENHANCEMENTS (March 28, 2026):**
> - **Merge mechanic:** PromptBubble3D `merging` field now active — similar keyword bubbles (matching first 3 chars) attract and absorb into larger bubble
> - **Always-on env:** PromptLabGame registers PromptBubble3DScene on mount regardless of keyword state

**Date:** March 5, 2026 | **GCUD:** V9 | **Vision:** Laboratory Control Station
**Design:** Frost-Prismatic v3 (blue-dominant 60/40, chrome bezel, hex-radial, R3F station frame)
**Lab:** 4 -- AI That Creates | **Color:** #F59E0B (Amber/Orange)
**Age Bands:** A (7-10), B (11-13), C (14-16)

---

## DECISIONS IMPLEMENTED

- [x] Decision 6.2.3 -- 3D thought bubbles: SphereGeometry + MeshPhysicalMaterial clearcoat, max 12, spring physics, keyword text, merge/pop -- in PromptBubble3D.tsx

## BUG FIXES PRESERVED

- [x] BUG-10F -- Font stack: Exo 2/Sora/Orbitron NOT Fredoka/Nunito

## v2 ENHANCEMENTS PRESERVED

All 5 v2 enhancement features remain intact (X-Ray, Explainer, Patterns, ThinkingViz, SystemPrompt). Part A adds the 3D component only; Part B integrates it into PromptLabGame.tsx.

---

## FILES IN THIS DOCUMENT

| Action | File | Lines |
|--------|------|-------|
| NEW | `src/components/3d/PromptBubble3D.tsx` | ~370 lines |

**Prerequisites:**
- Stage 3 Part 3 v3-FINAL (StationFrame + R3F infrastructure)
- Stage 6D v2 + v2 Enhancements (PromptLabGame.tsx with all features)

> **Canvas Coexistence Note (FIX-DUAL-CANVAS):** The StationFrame component creates a full-viewport R3F `<Canvas>` on all dashboard pages. When `useStationMode` returns `mode: 'game'`, StationFrame unmounts its 3D Canvas entirely (early return with CSS-only frame) to avoid dual WebGL contexts. PromptBubble3DScene creates its own `<Canvas>` for 3D thought bubble rendering — it gets full GPU ownership during gameplay. The CSS fallback frame (chrome bezel + indicators) remains visible for visual continuity. Long-term, CPA v2.0 (Enhancement 1.1+) will unify all Canvas instances into a single persistent `<CockpitCanvas>`.

---

## CODE REVIEW FINDINGS & FIXES APPLIED

### HIGH (3 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | `useRef<any>` for textRef -- bypasses TypeScript | `BubbleMesh` textRef | Changed to `useRef<THREE.Group>(null)` with proper typing |
| 2 | `useEffect` pop trigger checks `bubbles.length` but `bubbles` not in deps -- ESLint exhaustive-deps violation + stale closure risk | Pop effect | Replaced with `hadBubblesRef` pattern: ref tracks whether bubbles existed during thinking phase, effect only depends on `isThinking` |
| 3 | `setBubbles` in `useFrame` mutates Vector3 objects from previous state in-place | Physics loop `prev.map()` | Added `.clone()` for position and velocity at start of each bubble update to avoid mutating previous state objects |

### MEDIUM (2 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 4 | `material` useMemo depends only on `bubble.color` but opacity changes every frame | `BubbleMesh` material | Added `bubble.opacity` to deps so material is properly reactive. Direct mutation in useFrame still handles per-frame updates. |
| 5 | `glowMaterial` shared across all sprites -- sprite positions set via JSX props from React state | Glow sprites | Kept as-is; positions update via React re-renders from physics setState. Acceptable for max 12 sprites. |

### LOW (1 note)

| # | Issue | Location | Note |
|---|-------|----------|------|
| 6 | `/fonts/Exo2-Bold.woff` not present in `public/fonts/` | drei `Text` font prop | Non-blocking: drei Text falls back to default font gracefully. Font file will be added in Stage 10 (Polish). Consistent with Stage 6C NeuralNetwork3D behavior. |

### Triangle Budget Breakdown (10M Enhancement — March 18, 2026)

| Component | Desktop Ultra | LOD Low |
|-----------|-------------|---------|
| PromptBubble3D (bubbles + text) | ~15K | ~6K |
| PromptLabEnvironment (floating books) | ~1.0M | ~10K |
| PromptLabEnvironment (token counter + AI brain) | ~600K | ~5K |
| PromptLabEnvironment (writing desk + holo screens) | ~475K | ~0 |
| PromptLabEnvironment (idea motes) | ~150K | ~0 |
| PromptLabEnvironment (terrain + sky + fog) | ~1.15M | ~10K |
| **Total** | **~3.39M** | **~31K** |

**Scene total:** ~3.39M tris (desktop ultra) with LODWrapper adaptive FPS monitoring.
Immersive AI workshop: floating book library, token counter cylinder, central AI brain mesh, writing desk, holographic displays, ambient idea motes.

### New Files (10M Enhancement)

| # | File | Purpose |
|---|------|---------|
| 2 | `src/components/3d/environments/PromptLabEnvironment.tsx` | Immersive AI workshop studio |

| Device | Max Budget | Target FPS | LOD Level |
|--------|-----------|------------|-----------|
| Desktop | 10,000,000 | 60 | ultra/high |
| Tablet | 5,000,000 | 45 | medium |
| Mobile | 2,500,000 | 30 | low |

### PERFORMANCE NOTE

The physics simulation calls `setBubbles()` inside `useFrame`, which triggers React re-renders at animation rate. With max 12 bubbles and desktop-only rendering, this is acceptable. For future optimization, physics state could be moved entirely to refs with only structural changes (spawn/pop) triggering React re-renders.

---

## COMPONENT: PromptBubble3D.tsx

### Architecture

```
PromptBubble3D (R3F scene content -- rendered inside Canvas)
  |-- BubbleMesh (x12 max) -- glass sphere + keyword text
  |-- Glow sprites (x12 max) -- additive blending halos
  |-- Lighting (ambient + 2 point lights)
  |-- Environment (drei "night" preset)
```

### Props

```typescript
interface PromptBubble3DProps {
  keywords: string[];     // Keywords extracted from prompt
  isThinking: boolean;    // True while waiting for AI response
  temperature: number;    // 0-1, affects drift speed
  onBubblesReady?: () => void;  // Callback when bubbles spawn
}
```

### Named Exports

- `extractKeywords(text: string): string[]` -- NLP-lite keyword extraction (100+ stop words filtered, max 12 keywords)
- `default` -- PromptBubble3D component

### Materials & Geometry

- **Sphere:** `SphereGeometry(radius, 24, 24)` -- 24 segments per bubble
- **Glass:** `MeshPhysicalMaterial` with clearcoat: 1.0, transmission: 0.7, ior: 1.5, roughness: 0.05
- **Text:** drei `Text` with Exo2-Bold font, 0.06 fontSize, billboarded to camera
- **Glow:** `SpriteMaterial` with additive blending, opacity 0.15

### Physics

- **Spring attraction:** Bubbles pull toward center (0, 0, -0.3) with strength 0.008
- **Repulsion:** Overlapping bubbles push apart with strength 0.015
- **Damping:** 0.94 per frame
- **Orbit:** Gentle circular motion while `isThinking` is true
- **Temperature wobble:** Drift speed scales with `0.5 + temperature * 1.5`
- **Lifetime:** 15 seconds with fade starting at 70%

### Bubble Lifecycle

1. **Spawn:** Keywords arrive -> bubbles created at random positions around spawn radius, scale 0
2. **Scale-in:** Scale animates from 0 to 1 at rate `delta * 3`
3. **Drift:** Spring physics + repulsion + orbit (while thinking) + temperature wobble
4. **Fade:** After 10.5s (70% of lifetime), opacity fades to 0
5. **Pop:** When `isThinking` becomes false, all bubbles enter pop state (scale/opacity shrink rapidly)
6. **Remove:** Filtered out when opacity < 0.01 or scale < 0.01

### Color Palette

12 amber/orange variants matching Lab 4: `#F59E0B`, `#FBBF24`, `#D97706`, `#FCD34D`, `#F97316`, `#FB923C`, `#FDBA74`, `#FDE68A`, `#EAB308`, `#CA8A04`, `#A16207`, `#854D0E`

---

## BUILD VALIDATION

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS (0 errors) |
| `npm run lint` | PASS (0 warnings) |
| `npm run build` | PASS |
| Final line count | 369 lines |

---

## PART A VALIDATION CHECKLIST

- [x] PromptBubble3D.tsx exists at `src/components/3d/PromptBubble3D.tsx`
- [x] No TypeScript errors: `npx tsc --noEmit`
- [x] PromptBubble3D imports: useFrame, useThree, Text, Environment, THREE
- [x] `extractKeywords` is a named export (for reuse in PromptLabGame.tsx)
- [x] PromptBubble3D is the default export
- [x] MeshPhysicalMaterial uses clearcoat: 1.0, transmission: 0.7, ior: 1.5
- [x] SphereGeometry uses 24 segments (24, 24) per bubble
- [x] BUBBLE_COLORS has 12 amber/orange variants
- [x] STOP_WORDS has 100+ common English words
- [x] MAX_BUBBLES = 12, BUBBLE_LIFETIME = 15s
- [x] Pop animation triggers when isThinking changes from true to false
- [x] Font path: `/fonts/Exo2-Bold.woff` (from Stage 3/10 setup)
- [x] Environment preset: 'night' (drei)

---

## FORWARD: PART B

Part B provides the integration guide for PromptLabGame.tsx -- dynamic import of PromptBubble3D, keyword extraction on send, SSR-safe wrapper, mobile fallback, and 6 modification points in the existing game component.
