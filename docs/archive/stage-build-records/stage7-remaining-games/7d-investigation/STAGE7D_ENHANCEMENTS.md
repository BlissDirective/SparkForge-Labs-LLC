# SPARKFORGE — STAGE 7D ENHANCEMENTS

**Date:** March 8, 2026
**Applied By:** Claude Code (Code Review Role per CLAUDE.md §3.1)
**Scope:** 3 FL-Lite game files across Part B + Part C stage docs

---

## Enhancement Summary

| # | ID | Enhancement | Files Modified | Impact |
|---|-----|------------|----------------|--------|
| 1 | ENH-1 | Loading fallbacks for 3D dynamic imports | Part B (RV, CQ), Part C (FF) | UX: shimmer placeholder while R3F chunks load |
| 2 | ENH-2 | Shared `useIsMobile` hook | Part B (RV, CQ), Part C (FF) + new hook file | DX: eliminates 7-line duplication across 19+ games |
| 3 | ENH-3 | "Edit Rules & Retry" button in Robot Vacuum | Part B (RV) | UX: iterative learning without losing rule state |
| 4 | ENH-4 | Problem descriptions in Future Forge grid | Part C (FF) | UX: age-appropriate context for problem selection |

---

## ENH-1: Loading Fallbacks for FL-Lite 3D Dynamic Imports

**Problem:** The `dynamic()` imports for 3D components had no `loading` callback, showing nothing while the R3F chunk loads (~50-150KB). On slower connections, users see a blank gap above the game UI.

**Solution:** Added a themed shimmer placeholder to each dynamic import matching the game's lab color:

| Game | Color | Placeholder |
|------|-------|-------------|
| Robot Vacuum | `emerald-500` | `bg-emerald-500/5` shimmer + "Loading 3D…" text |
| Camera Quest | `cyan-500` | `bg-cyan-500/5` shimmer + "Loading 3D…" text |
| Future Forge | `fuchsia-500` | `bg-fuchsia-500/5` shimmer + "Loading 3D…" text |

**Code pattern (each game):**
```tsx
const Component3D = dynamic(
  () => import('@/components/3d/Component3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-32 rounded-xl bg-[color]-500/5 animate-pulse flex items-center justify-center">
        <span className="text-[color]-400/30 text-xs font-body">Loading 3D…</span>
      </div>
    ),
  }
);
```

**Lines changed:** ~3 lines added per game (9 total across 3 files)

---

## ENH-2: Shared `useIsMobile` Hook

**Problem:** Every FL-Lite and flagship game duplicates the same 7-line `useState`/`useEffect` block for mobile detection:
```tsx
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768);
  check();
  window.addEventListener('resize', check);
  return () => window.removeEventListener('resize', check);
}, []);
```
This pattern appears in 19+ game files. It also lacks orientation change handling and has a brief SSR hydration flash.

**Solution:** Created `src/hooks/useIsMobile.ts` that wraps the existing `useMediaQuery` hook:
```tsx
import { useMediaQuery } from './useMediaQuery';

export function useIsMobile(breakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
```

**Benefits over inline pattern:**
- SSR-safe via `useMediaQuery` (no flash)
- Handles orientation changes (media query fires on orientation change)
- Configurable breakpoint (default 768px = Tailwind `md:`)
- 1 line instead of 7

**Files modified:**
- `src/hooks/useIsMobile.ts` — NEW (hook source)
- Part B doc: RobotVacuumGame.tsx — replaced inline block, removed `useEffect` from import
- Part B doc: CameraQuestGame.tsx — replaced inline block, removed `useEffect` from import
- Part C doc: FutureForgeGame.tsx — replaced inline block, removed `useEffect` from import

---

## ENH-3: Robot Vacuum "Edit Rules & Retry" Button

**Problem:** After running the vacuum simulation, the results panel shows coverage/steps/efficiency stats with only a "Next Room" button. If a student gets poor coverage, they must use the generic "Reset" button which clears both the simulation AND their rules, losing their work.

**Solution:** Added an "Edit Rules & Retry" button inside the results panel that resets only the simulation state while preserving the current ruleset:

```tsx
<button
  onClick={() => {
    setCleaned(new Set());
    setTrail([]);
    setStepCount(0);
    setShowResults(false);
    setVacPos(room.charger);
    setVacDir(0);
  }}
  className="mt-2 w-full py-1.5 rounded-lg border border-emerald-500/20
    text-emerald-400/60 font-body text-[10px] hover:bg-emerald-500/5
    hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
>
  <RotateCcw className="w-2.5 h-2.5" /> Edit Rules & Retry
</button>
```

**State reset (keeps rules):** `cleaned`, `trail`, `stepCount`, `showResults`, `vacPos`, `vacDir`
**State preserved:** `rules[]`, `roomIdx`

**Pedagogical value:** Encourages iterative rule refinement — the core learning loop for rule-based AI systems.

---

## ENH-4: Future Forge Problem Descriptions

**Problem:** The problem selection grid (step 0) shows only emoji + label for each problem. The PROBLEMS array already contains age-appropriate descriptions (`descA` for younger, `descC` for older) but they're unused in the selection UI.

**Solution:** Added a description line below each problem label using the existing data:

```tsx
<p className="font-body text-[8px] text-white/25 mt-0.5 leading-tight">
  {ageBand === 'C' ? p.descC : p.descA}
</p>
```

**Examples:**
| Problem | Band A | Band C |
|---------|--------|--------|
| Climate Change | "Help save the planet!" | "Environmental monitoring, carbon modeling, sustainability optimization" |
| Healthcare | "Help people stay healthy!" | "Diagnostic imaging, drug discovery, patient monitoring systems" |
| Accessibility | "Help everyone participate!" | "Assistive technology, real-time captioning, navigation aids" |

**Also added** `px-2` to button padding to accommodate longer description text.

---

## Files Changed Summary

| File | Enhancements | Status |
|------|-------------|--------|
| `src/hooks/useIsMobile.ts` | ENH-2 (new file) | CREATED |
| `STAGE7D_v3FINAL_PartB_RobotVacuum_CameraQuest.md` | ENH-1, ENH-2, ENH-3 | UPDATED |
| `STAGE7D_v3FINAL_PartC_FutureForge_Registry_Verification.md` | ENH-1, ENH-2, ENH-4 | UPDATED |

---

## Future Application

ENH-1 and ENH-2 should be applied to all remaining FL-Lite and flagship games during their respective build stages:

| Stage | Games | ENH-1 | ENH-2 |
|-------|-------|-------|-------|
| 6B | Pet Trainer | Yes | Yes |
| 6C | Neural Builder | Yes | Yes |
| 6D | Prompt Lab | Yes | Yes |
| 6E | Agent Architect | Yes | Yes |
| 6F | Bias Detective | Yes | Yes |
| 7B | Sort Toy Box, Code Blocks | Yes | Yes |
| 7C | Chatbot Builder, Data Detective | Yes | Yes |
| 7F | My First AI App | Yes | Yes |
