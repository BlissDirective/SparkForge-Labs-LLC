# Master Triad Audit Report
**Generated:** 2026-03-24
**Repo:** blissdirective/sparkforge
**Branch:** claude/frontend-audit-hmLnX
**Auditor:** Master Triad Agent (5 lenses: 3D Game Designer, 3D Component Developer, Frontend Developer, UI/UX Designer, Visual Designer)

---

## Executive Summary

SparkForge is an ambitious 35-game, 3D-immersive educational platform with **strong architectural foundations** — a single persistent R3F Canvas (CPA2-1), centralized scene routing, well-structured Zustand stores, and a consistent Frost-Prismatic design system. The biggest risk areas are **GPU memory leaks** in cockpit geometry components (geometries/materials created without proper disposal), **full-store subscriptions** in performance-critical 3D code paths (3 files destructure `useCockpitStore()` without selectors), and **103 files using `import * as THREE`** which prevents tree-shaking. The design system adherence is excellent at ~95% compliance, with only minor hardcoded hex values and animation duration inconsistencies.

---

## 🔴 Critical Findings (4)

### 1. SidePanels.tsx — Sphere Geometry Recreated Per Render
- **Lens:** Performance / 3D Component
- **File:** `src/components/3d/SidePanels.tsx` (lines 451–473)
- **Issue:** 10 radar blips each declare `<sphereGeometry args={[0.025, 64, 64]} />` inside a `.map()` loop. While R3F does cache declarative geometries by args, the `<meshStandardMaterial>` with dynamic `opacity` and `emissiveIntensity` props forces material recreation each render.
- **Impact:** 10 materials × every render = continuous GPU allocation churn during cockpit display.
- **Fix:**
```tsx
// Before (per blip)
<sphereGeometry args={[0.025, 64, 64]} />
<meshStandardMaterial
  color={`#${labColor.getHexString()}`}
  emissive={labColor}
  emissiveIntensity={0.9 * intensity}
  transparent
  opacity={opacity * 0.85 * intensity}
/>

// After — shared geometry + material ref
const blipGeo = useMemo(() => new THREE.SphereGeometry(0.025, 64, 64), []);
const blipMat = useMemo(() => new THREE.MeshStandardMaterial({
  color: labColor, emissive: labColor, transparent: true,
}), [labColor]);

useFrame(() => {
  blipMat.emissiveIntensity = 0.9 * intensity;
  blipMat.opacity = opacity * 0.85 * intensity;
});

// In JSX
<mesh><primitive object={blipGeo} attach="geometry" /><primitive object={blipMat} attach="material" /></mesh>
```
Also consider `<Instances>` for the 10 identical blips.

---

### 2. HolographicLabMap.tsx — ConnectionBeam Geometry/Material Leak
- **Lens:** Performance / 3D Component
- **File:** `src/components/3d/HolographicLabMap.tsx` (lines 100–127)
- **Issue:** `ConnectionBeam` creates `TubeGeometry` + `MeshBasicMaterial` in `useMemo` but **never disposes** them on unmount. 10 connection beams × scene reloads = cumulative VRAM leak.
- **Impact:** Each scene reload leaks ~20 GPU objects (10 geometries + 10 materials) that are never garbage collected.
- **Fix:** Add cleanup effect:
```tsx
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
  };
}, [geometry, material]);
```

---

### 3. PostProcessingStack.tsx — Defeated Memoization via Object Dependency
- **Lens:** Performance / Frontend
- **File:** `src/components/3d/PostProcessingStack.tsx` (lines 95–102)
- **Issue:** `chromaticOffsetVec` depends on `sceneMultipliers.chromatic`, but `sceneMultipliers` is a new object from `useMemo` (line 76). While `sceneMultipliers` itself is memoized by `[activeScene, isTransitioning]`, the `.chromatic` property is a primitive number. The dependency `sceneMultipliers.chromatic` is actually correct since it's a number comparison. **However**, during transitions `isTransitioning` toggles rapidly, creating new Vector2 objects each toggle.
- **Impact:** Vector2 allocation on every scene transition start/end. Moderate — not per-frame, but could be optimized.
- **Fix:** Store the Vector2 in a `useRef` and update `.set()` instead:
```tsx
const chromaticOffsetRef = useRef(new THREE.Vector2());
chromaticOffsetRef.current.set(
  chromaticOffset * sceneMultipliers.chromatic,
  chromaticOffset * sceneMultipliers.chromatic * 0.8
);
```

---

### 4. Full Store Subscriptions in 3D Render Path (3 files)
- **Lens:** Performance / Frontend
- **Files:**
  - `src/components/3d/CockpitCanvas.tsx` (line 136): `useCockpitStore()` — 10+ fields
  - `src/hooks/useSpatialNavigation.ts` (line 43): `useCockpitStore()` — full store
  - `src/components/dashboard/SpatialOverlay.tsx` (line 26): `useCockpitStore()` — full store
- **Issue:** Destructuring the entire `useCockpitStore()` without selectors causes re-renders on **any** cockpit store update, even unrelated fields. The CockpitCanvas usage is inside `SpatialDashboardContent` which renders complex 3D children (HolographicLabMap, 4 InteractiveConsole3D, AmbientNPCs).
- **Impact:** Unnecessary re-renders of the entire spatial dashboard subtree on every cockpit store change.
- **Fix:** Replace with individual selectors:
```tsx
// Before
const { focusedLabId, hoveredLabId, ... } = useCockpitStore();

// After
const focusedLabId = useCockpitStore((s) => s.focusedLabId);
const hoveredLabId = useCockpitStore((s) => s.hoveredLabId);
// ... etc
```

---

## 🟡 Important Findings (7)

### 5. 103 Files Use `import * as THREE` — Tree-Shaking Blocked
- **Lens:** Architecture / Frontend
- **Files:** 103 files across `src/components/3d/`, `src/lib/3d/`, `src/hooks/`
- **Issue:** Namespace imports (`import * as THREE from 'three'`) prevent bundlers from tree-shaking unused Three.js modules. With 103 files all importing the entire library, the bundle includes all of Three.js regardless of actual usage.
- **Impact:** Significantly larger JS bundle than necessary. Three.js is ~1MB unminified.
- **Fix:** Use named imports:
```tsx
// Before
import * as THREE from 'three';
const geo = new THREE.SphereGeometry(...);

// After
import { SphereGeometry, MeshStandardMaterial, Vector3 } from 'three';
const geo = new SphereGeometry(...);
```

### 6. StatusBar3D.tsx — Material Factory Creates New Material Per Opacity Change
- **Lens:** Performance / 3D Component
- **File:** `src/components/3d/StatusBar3D.tsx` (lines 50–62)
- **Issue:** `useChromeMaterial(opacity)` creates a new `MeshStandardMaterial` every time `opacity` changes. During animations (fade-in/out), this fires ~60× per second.
- **Impact:** 60 material allocations/second per StatusBar3D instance during transitions.
- **Fix:** Create material once, update opacity in `useFrame`.

### 7. CockpitPanels.tsx — Geometry Disposal Gap on Dependency Change
- **Lens:** Performance / 3D Component
- **File:** `src/components/3d/CockpitPanels.tsx` (lines 672–686)
- **Issue:** 14 panel geometries are created in `useMemo([segments])`. The cleanup `useEffect` runs on `[geometries]` change, but old geometry objects may linger in GPU memory between React's memoization swap and the effect cleanup.
- **Impact:** Potential VRAM accumulation if `segments` prop changes during runtime.
- **Fix:** Add explicit disposal in the useMemo factory or ensure cleanup runs synchronously.

### 8. `recharts` Dependency Alongside `@nivo/*` — Duplicate Charting Libraries
- **Lens:** Architecture / Dependency Hygiene
- **File:** `package.json` (lines 53, 21–24)
- **Issue:** Both `recharts` (^3.8.0) and `@nivo/core` + `@nivo/line` + `@nivo/bar` + `@nivo/radar` are installed. These are competing charting libraries serving the same purpose.
- **Impact:** ~200KB+ of unnecessary bundle weight from the unused library.
- **Fix:** Audit usage of both. If Nivo is the primary (per CLAUDE.md tech stack), remove `recharts`. If both are genuinely needed, document why.

### 9. `leva` in Production Dependencies
- **Lens:** Architecture
- **File:** `package.json` (line 47): `"leva": "^0.10.1"` in `dependencies` (not `devDependencies`)
- **Issue:** Leva is a debug GUI tool. While no imports were found in source code, having it in production `dependencies` means it's included in the production bundle if any code path imports it.
- **Impact:** Potential dead weight in production bundle.
- **Fix:** Move to `devDependencies` or remove if unused.

### 10. Animation Duration/Easing Inconsistency
- **Lens:** Visual / UI/UX
- **Files:** Multiple components across `src/components/`
- **Issue:** Mix of Motion spring physics (`stiffness: 300-400, damping: 30`) and GSAP easings (`power2.out`, `power2.in`) with no centralized animation config. Durations range from 0.2s to 3s+ without a consistent scale.
- **Impact:** Inconsistent motion feel across the platform — some interactions feel snappy while others feel sluggish.
- **Fix:** Create `src/lib/animation-config.ts`:
```tsx
export const ANIMATION = {
  QUICK: { duration: 0.2, ease: 'easeOut' },
  NORMAL: { duration: 0.3, ease: 'easeOut' },
  SLOW: { duration: 0.5, ease: 'easeInOut' },
  SPRING_SNAPPY: { type: 'spring' as const, stiffness: 400, damping: 30 },
  SPRING_SMOOTH: { type: 'spring' as const, stiffness: 200, damping: 25 },
};
```

### 11. Sub-Scale Font Sizes via Bracket Notation
- **Lens:** UI/UX / Visual
- **Files:** `ParticleIntensitySlider.tsx`, `PaywallModal.tsx`, `PetTrainerGame.tsx`, others
- **Issue:** `text-[9px]` and `text-[10px]` used in bracket notation, bypassing Tailwind's type scale and breaking accessibility font-size scaling (`font-size-large`, `font-size-xl`).
- **Impact:** These elements won't scale when users enable larger font sizes via accessibility settings.
- **Fix:** Use `text-xs` (12px minimum) or add the sizes to the Tailwind config if sub-12px is truly needed.

---

## 🟢 Suggestions (6)

### 12. Canvas `dpr` Uses SSR-Unsafe `window.devicePixelRatio`
- **Lens:** Frontend
- **File:** `src/components/3d/CockpitCanvas.tsx` (line 286)
- **Issue:** `dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 3)]}` — this is evaluated at render time and the `typeof window` check works for SSR, but the value is computed once and never updates if display changes (e.g., moving window between monitors).
- **Fix:** Use `<AdaptiveDpr>` (already present at line 305) which handles this dynamically. Consider simplifying to `dpr={[1, 3]}` and letting AdaptiveDpr manage the actual value.

### 13. `frameloop="always"` on CockpitCanvas
- **Lens:** Performance
- **File:** `src/components/3d/CockpitCanvas.tsx` (line 285)
- **Issue:** The Canvas always renders at 60fps even when no animations are active (e.g., user reading content). This is intentional for the ambient cockpit animations but wastes GPU cycles on static views.
- **Fix:** Consider `frameloop="demand"` with `invalidate()` calls from animated components. Low priority given the "always-on" design mandate (D3D-5).

### 14. Missing `React.memo` on Stable 3D Subtrees
- **Lens:** Performance / Frontend
- **Files:** `SpatialDashboardContent`, `AmbientNPCs`, `DynamicEnvironment`
- **Issue:** These components receive stable props but re-render when parent state changes. `React.memo` would prevent unnecessary subtree reconciliation.
- **Fix:** Wrap with `React.memo`:
```tsx
const SpatialDashboardContent = React.memo(function SpatialDashboardContent({...}) { ... });
```

### 15. Hardcoded Hex Values in 5 UI Components
- **Lens:** Visual / Design System
- **Files:** `PaywallModal.tsx`, `UpgradePrompt.tsx`, `ParentLoadingSkeleton.tsx`, `FutureForgeGame.tsx`
- **Issue:** Hex values like `#FF6644`, `#111118`, `#0A0E16` used directly instead of Tailwind tokens (`text-neon-orange`, `bg-surface-card`, `bg-surface-base`).
- **Fix:** Replace with semantic tokens for maintainability.

### 16. `DemoGuard` Wrapping Issue in Dashboard Layout
- **Lens:** Architecture
- **File:** `src/app/(dashboard)/layout.tsx` (lines 54, 119)
- **Issue:** `<DemoGuard>` wraps the layout content, but `<DemoSessionBanner />` is rendered as a sibling inside DemoGuard rather than at the layout level. The JSX structure has `<DemoGuard>` then `<DemoSessionBanner />` then the content div as sequential children, but DemoGuard only receives `children` — the banner should be inside or outside, not adjacent.
- **Fix:** Verify DemoGuard renders `{children}` correctly and DemoSessionBanner is positioned as intended.

### 17. Missing `useGLTF.preload()` Module-Level Calls
- **Lens:** Performance
- **Files:** Any components loading GLTF models
- **Issue:** No module-level `useGLTF.preload('/path/to/model.glb')` calls found. When GLTF models are eventually added (currently procedural), preloading should be in place.
- **Fix:** Add preload calls at module scope for any GLTF-using components.

---

## 💡 Insights

1. **Single Canvas Architecture is Solid.** The CPA2-1 pattern (one persistent `<Canvas>` with SceneRouter managing visibility) is well-executed. Hero → Cockpit → Game transitions happen without canvas remounting — this is the correct approach for a complex multi-scene R3F app.

2. **Desktop-Ultra Decision is Bold but Correct for Target.** The D3D-1 decision to remove all mobile code paths simplifies the codebase significantly. 103 3D component files with zero mobile conditional logic is much cleaner than the previous `useIsMobile()` pattern. Future mobile support via native Three.js LOD is the right path.

3. **Store Architecture is Well-Separated.** 11 stores (auth, child, game, toast, ui, accessibility, parent, device, cockpit, scene, cockpitAtoms) each own a clear domain. The sceneStore's `enterGame`/`exitGame`/`enterSpatial`/`exitSpatial` pattern provides clean transition orchestration. Pre-built selectors (e.g., `selectActiveScene`, `selectCockpitOpacity`) show good intent.

4. **GameShell is Minimal and Correct.** The D3D-B refactor stripped GameShell to its essentials — it signals `enterGame`/`exitGame` via sceneStore and delegates all rendering to children. No more canvas unmounting, no LODWrapper wrapping.

5. **35 Games are Code-Complete.** All 35 game files exist in `src/components/games/`. Combined with 95+ environment files in `src/components/3d/environments/`, the 3D content volume is substantial.

6. **Duplicate PR Commits.** PRs #12 and #13 have identical titles merged minutes apart — likely an accidental double-merge. No functional impact but clutters git history.

7. **PR #10 May Be Stale.** Open for 4 days, targets a feature branch (not main), and may be superseded by the D3D overhaul that landed via PRs #18-19.

---

## GitHub Cross-Reference
- **Issues already tracked:** None (0 open issues). All coordination happens outside GitHub Issues.
- **PR patterns of concern:** PR #10 (triangle budget upgrade) open 4 days, possibly stale.
- **Dependency drift:** `recharts` + `@nivo/*` coexist (duplicate charting). `leva` in production deps unused.

---

## Recommended Fix Order
1. **SidePanels.tsx blip materials** (🔴) — Highest per-frame allocation rate
2. **HolographicLabMap.tsx disposal** (🔴) — Cumulative VRAM leak per scene reload
3. **useCockpitStore() → selectors** (🔴) — 3 files causing unnecessary 3D re-renders
4. **StatusBar3D material factory** (🟡) — Material churn during transitions
5. **PostProcessingStack Vector2** (🔴) — Quick ref fix, low effort
6. **Remove `recharts` or `@nivo`** (🟡) — Bundle size win
7. **Move `leva` to devDeps** (🟡) — Trivial fix
8. **`import * as THREE` → named imports** (🟡) — Large scope, do incrementally
9. **Animation config centralization** (🟡) — Design consistency
10. **Sub-scale font sizes** (🟡) — Accessibility compliance

---

## Health Scorecard
| Category | Score | Notes |
|---|---|---|
| Performance | 🟡 3 / 5 | 4 critical GPU memory/allocation issues in cockpit components; single-canvas architecture is strong |
| Architecture | 🟢 4 / 5 | Clean store separation, SceneRouter pattern, GameShell minimal; 3 full-store subscriptions and duplicate deps drag score |
| Visual Consistency | 🟢 4.5 / 5 | Frost-Prismatic system 95% compliant; minor hardcoded hex, animation inconsistency |
| Dependency Health | 🟡 3.5 / 5 | Duplicate charting libs, leva in prod deps, `import * as THREE` everywhere |
| Overall | 🟡 3.8 / 5 | Strong foundations with targeted performance issues to fix. Architecture decisions (CPA2, D3D, SceneRouter) are sound. |
