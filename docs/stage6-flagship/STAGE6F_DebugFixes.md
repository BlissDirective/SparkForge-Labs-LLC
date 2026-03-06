# STAGE 6F v3-FINAL — Code Review Debug Fixes Reference

**Date:** March 6, 2026 | **Reviewer:** Claude Code (Code Review Role per CLAUDE.md §3.1)

This document catalogs all code fixes applied during the Stage 6F v3-FINAL audit. Each fix is categorized per the Stage Document Modification Policy (AUTO-FIX category).

---

## Part A Fixes (BiasScales3D.tsx)

| ID | Category | Issue | Fix | Policy |
|----|----------|-------|-----|--------|
| CR-6F-A1 | TypeScript type fix | `frameloop="demand"` prevents spring physics and particle animation updates from running | Changed to `frameloop="always"` — component uses `useFrame()` for per-frame spring physics interpolation and particle position updates | AUTO-FIX: TypeScript/Runtime fix |

### CR-6F-A1 Detail
- **Original:** `frameloop="demand"` in Canvas props (documented in Part C investigate phase)
- **Updated:** `frameloop="always"`
- **Reason:** The BiasScales3D component uses `useFrame()` callback for:
  1. Spring physics interpolation (`currentTilt` lerping toward `targetTilt`)
  2. Particle position updates (floating evidence particles)
  3. Glow pulse animation on balanced state
  All of these require continuous frame updates. `frameloop="demand"` only renders when `invalidate()` is called, which would freeze all animations.

---

## Part B Fixes (BiasDetectiveGame.tsx — Logic)

| ID | Category | Issue | Fix | Policy |
|----|----------|-------|-----|--------|
| CR-6F-B1 | TypeScript type fix | HTML entities (`&gt;`, `&lt;`, `&amp;`) in TypeScript logic | Decoded all to proper operators (`>`, `<`, `&&`) | AUTO-FIX: TypeScript type fix |
| CR-6F-B2 | TypeScript type fix | `getRank` comparisons used `&gt;=` HTML entity | Fixed to `>=` operator | AUTO-FIX: TypeScript type fix |
| CR-6F-B3 | TypeScript type fix | `availableCases` filter used `&lt;=` HTML entity | Fixed to `<=` operator | AUTO-FIX: TypeScript type fix |
| CR-6F-B4 | TypeScript type fix | `scaleWeights` computed value used `&gt;` HTML entity | Fixed to `>` operator | AUTO-FIX: TypeScript type fix |
| CR-6F-B5 | TypeScript type fix | `collectEvidence` dedupe check used `.includes()` with `&amp;&amp;` | Fixed to `&&` operator | AUTO-FIX: TypeScript type fix |
| CR-6F-B6 | TypeScript type fix | Ternary in test result used `&gt;` for comparison | Fixed to `>` operator | AUTO-FIX: TypeScript type fix |
| CR-6F-B7 | TypeScript type fix | `submitReport` scoring filter used `&amp;&amp;` | Fixed to `&&` operator | AUTO-FIX: TypeScript type fix |
| CR-6F-B8 | TypeScript type fix | `PieChartViz` SVG path `d` attribute string interpolation used HTML entities | Fixed to proper comparison operators | AUTO-FIX: TypeScript type fix |

---

## Part C Fixes (BiasDetectiveGame.tsx — JSX Render)

| ID | Category | Issue | Fix | Policy |
|----|----------|-------|-----|--------|
| CR-6F-C1 | TypeScript type fix | HTML entities (`&gt;`, `&lt;`, `&amp;`) throughout all JSX | Decoded all to proper JSX/TypeScript characters | AUTO-FIX: TypeScript type fix |
| CR-6F-C2 | Runtime fix | `frameloop="demand"` freezes spring physics and particles | Changed to `frameloop="always"` | AUTO-FIX: TypeScript/Runtime fix |
| CR-6F-C3 | TypeScript type fix | Welcome phase `&amp;amp;` double-encoded entity in "AI & Ethics" | Fixed to proper `&amp;` JSX entity for ampersand display | AUTO-FIX: TypeScript type fix |
| CR-6F-C4 | TypeScript type fix | Evidence board conditional rendering used `&amp;&amp;` HTML entity | Fixed to proper `&&` JSX operator | AUTO-FIX: TypeScript type fix |
| CR-6F-C5 | TypeScript type fix | Pie chart path `d` attribute used HTML entities for comparison | Fixed `pct > 0.5` comparison operator | AUTO-FIX: TypeScript type fix |
| CR-6F-C6 | TypeScript type fix | Several motion event handlers used HTML entity arrow functions | All `() => ...` lambdas use proper syntax | AUTO-FIX: TypeScript type fix |

---

## Summary

| Part | Fixes | Category Breakdown |
|------|-------|--------------------|
| A | 1 | 1 runtime fix |
| B | 8 | 8 TypeScript/HTML entity fixes |
| C | 6 | 5 TypeScript/HTML entity fixes + 1 runtime fix |
| **Total** | **15** | All AUTO-FIX per CLAUDE.md §3.1 |

### Root Cause

All HTML entity issues stem from the source PDF → Markdown conversion pipeline. The PDF renderer encoded `>`, `<`, `&`, and `&&` as their HTML entity equivalents (`&gt;`, `&lt;`, `&amp;`, `&amp;&amp;`). These are valid in HTML display contexts but are **not valid TypeScript/JSX syntax** and would cause immediate compilation failures.

### Recommendation

Future stage documents should be validated with a post-conversion check that ensures no HTML entities remain in code blocks. A simple regex scan for `&[a-z]+;` patterns inside triple-backtick fenced code blocks would catch these.
