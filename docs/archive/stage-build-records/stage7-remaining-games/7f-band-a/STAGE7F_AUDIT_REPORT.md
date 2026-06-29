# STAGE 7F — AUDIT & ENHANCEMENT REPORT

**Date:** March 9, 2026
**Auditor:** Claude Code (Code Review Role per CLAUDE.md §3.1)
**Files Audited:** 5 documents (README.md, Part1, Part2, v3FINAL_PartA, v3FINAL_PartB)
**Games:** Emoji Decoder, My First AI App, AI or Not?

---

## 1. CODE REDUNDANCY ANALYSIS

### 1.1 Cross-File Redundancy (HIGH — Structural Pattern)

All three game components share nearly identical boilerplate code that should be extracted to shared utilities during build:

| Redundant Pattern | Files | Lines Each | Recommendation |
|-------------------|-------|------------|----------------|
| **Particle generator** (`useMemo(() => Array.from({length: N}, ...)`) | All 3 games | ~4-5 lines | Already addressed by Stage 7 Shared `GenericGameParticles.tsx`. Games should use it instead of inline particle generation. |
| **Chrome bezel markup** (absolute div + gradient lines) | All 3 games | ~4-5 lines | Should use shared `ChromeBezel` component or be part of `GameShell`. |
| **Learn phase carousel** (concept cards + dot indicators + next/start button) | All 3 games | ~30-40 lines | Extract to `LearnPhaseCarousel` shared component accepting cards array + onComplete callback. |
| **Age-band filtering logic** (`BAND_ORDER` record + filter) | All 3 games | ~2 lines | Already identical. Extract to `utils.ts` as `filterByBand(items, ageBand)`. |
| **Welcome phase layout** (emoji animation + title + subtitle + tags + start button) | All 3 games | ~20 lines | Extract to `WelcomePhase` shared component. |
| **Bonus round pattern** (textarea + submit + result display) | EmojiDecoder + AiOrNot | ~40 lines | Extract to `BonusRound` component (prompt, placeholder, onSubmit, points). |

**Impact:** ~120-150 lines of redundancy per game. With 35 total games, shared components would save significant bundle size and maintenance burden.

**Verdict:** Not blocking for build — these are **Stage 7 Shared** candidates. Log for post-build refactor. The games are correct as self-contained units per the stage doc pattern.

### 1.2 Internal Redundancy

| Game | Issue | Severity |
|------|-------|----------|
| MyFirstAiAppGame | `ALL_POWERS.find(pw => pw.id === id)` repeated 4 times in render (powers badges, mini preview, pipeline, code peek) | LOW — could memo a `selectedPowersData` array |
| EmojiDecoder | `ageBand === 'B' \|\| ageBand === 'C'` repeated 3 times | LOW — extract `const isAdvancedBand = ageBand !== 'A'` |
| AiOrNot | Same `ageBand === 'B' \|\| ageBand === 'C'` pattern 3 times | LOW — same fix as above |

---

## 2. MISSING/INCORRECT FEATURES VS SPECS

### 2.1 Critical Gaps

| ID | Game | Issue | Spec Says | Doc Has | Severity |
|----|------|-------|-----------|---------|----------|
| F-1 | EmojiDecoder | **No `complete` phase rendered** | Phase type includes `'complete'` but no JSX renders when `phase === 'complete'` | Missing | **HIGH** — After finishing the game, screen goes blank. `finishGame` sets phase to `'complete'` and calls `game.completeGame()`, but AnimatePresence has no `complete` block. GameShell may handle this via overlay, but the component still shows no content underneath. |
| F-2 | AiOrNot | **No `complete` phase rendered** | Same issue as F-1 — phase type includes `'complete'` but no JSX for it | Missing | **HIGH** — Same blank screen risk. |
| F-3 | MyFirstAiApp | **No `complete` phase rendered** | Phase type includes `'complete'` | Missing | **MEDIUM** — Preview-to-complete transition exists but no dedicated complete screen. The "Finish & Celebrate!" button sets `phase === 'complete'` but there's no block for it. However, `game.completeGame()` is already called in `advanceStep` at the `design` step, so GameShell's completion overlay may cover this. |
| F-4 | MyFirstAiApp | **`game.startGame()` never called** | All games must call `game.startGame(gameId, xpReward)` before play phase | Missing from `learn → build` transition | **HIGH** — EmojiDecoder and AiOrNot both call `game.startGame()` at learn→play transition, but MyFirstAiApp jumps from learn to build without calling it. The `completeGame()` call may fail or not award XP properly without a preceding `startGame()`. |
| F-5 | MyFirstAiApp | **`xpReward` not passed in GameShell** | Other games pass `xpReward={25}` or `xpReward={30}` | GameShell call has no `xpReward` prop | **MEDIUM** — `<GameShell gameId="my-first-ai-app" title="My First AI App" worldNumber={9} worldColor="#F97316">` — missing `xpReward={30}`. Depends on whether GameShell requires it. |
| F-6 | EmojiDecoder | **Band C not supported** | CLAUDE.md §13 says Bands A,B only | Matches spec | **OK** — Not a bug. Band C falls through to Band B behavior via `ageBand === 'B' \|\| ageBand === 'C'` checks. |
| F-7 | MyFirstAiApp | **Power count spec mismatch** | Spec says "4 powers for Band A" | `maxPowers` for A = 3 | **LOW** — Part B line 318: `const maxPowers = ageBand === 'A' ? 3 : ageBand === 'B' ? 4 : 5;`. Header comment says "Band A: guided (3 categories, 4 powers)". The 4 refers to available powers (4 with bandMin A), not max selectable. Max selectable is 3. This is internally consistent but the header comment is ambiguous. |

### 2.2 Feature Completeness

| Game | Feature | Status |
|------|---------|--------|
| EmojiDecoder | 16 emoji rounds across 3 tiers | OK — 16 rounds defined (8 easy + 4 medium + 4 tricky) |
| EmojiDecoder | AI vs Human interpretation | OK — `aiInterpretation` shown after each answer |
| EmojiDecoder | Streak bonus (2x, 3x+) | PARTIAL — Streak bonus adds +3 or +5 XP, but no visual "2x"/"3x" multiplier label shown to the user. Only `{streak}x` counter is displayed. Spec says "combo multiplier" but implementation is additive bonus, not multiplicative. |
| EmojiDecoder | Emoji Lab bonus round | OK — Full implementation with textarea + AI response |
| AiOrNot | 12 scenarios | OK — 12 defined (4 NOW + 4 SOON + 4 SCI-FI) |
| AiOrNot | Confidence slider | OK — Range 10-100, bonus at 80+ |
| AiOrNot | Reality Score | OK — Calculated and displayed |
| AiOrNot | Prediction bonus round | OK — Full implementation with textarea |
| AiOrNot | Per-category breakdown | OK — Shown in results after prediction |
| MyFirstAiApp | 5-step wizard | OK — category→name→powers→audience→design |
| MyFirstAiApp | 7 categories (band-filtered) | OK — 3A + 2B + 2C = 7 total |
| MyFirstAiApp | 9 AI powers (band-filtered) | OK — 4A + 3B + 2C = 9 total |
| MyFirstAiApp | 6 design themes | OK — All 6 defined |
| MyFirstAiApp | Innovation score | OK — Calculated with combinatorial bonuses |
| MyFirstAiApp | How It Works pipeline (B+) | OK — Expandable data flow diagram |
| MyFirstAiApp | Code peek (C only) | OK — Python pseudocode |
| MyFirstAiApp | 3D integration (desktop) | OK — Dynamic import, isMobile, Suspense |

---

## 3. CODE BUGS & TYPE SAFETY ISSUES

### 3.1 Bugs

| ID | File | Line | Bug | Severity | Fix |
|----|------|------|-----|----------|-----|
| B-1 | EmojiDecoder | 317 | **`game.addScore()` — incorrect store API** | **CRITICAL** | Must use `game.updateScore()` per CLAUDE.md store API. `addScore` does not exist on gameStore. See Section 4 below. |
| B-2 | EmojiDecoder | 328 | **`game.nextRound()` — incorrect store API** | **CRITICAL** | Must use `game.advanceRound()`. See Section 4 below. |
| B-3 | EmojiDecoder | 335 | **`game.addScore(15)` in lab submit** | **CRITICAL** | Same `addScore` issue. |
| B-4 | AiOrNot | 220 | **`game.addScore(12 + confBonus)`** | **CRITICAL** | Same `addScore` issue. |
| B-5 | AiOrNot | 226 | **`game.nextRound()`** | **CRITICAL** | Same `nextRound` issue. |
| B-6 | AiOrNot | 232 | **`game.addScore(15)` in prediction** | **CRITICAL** | Same `addScore` issue. |
| B-7 | MyFirstAiApp | 355 | **`game.addScore(pts)`** | **CRITICAL** | Same `addScore` issue. |
| B-8 | MyFirstAiApp | 356 | **`game.completeGame()` called in `advanceStep`** before preview phase | **MEDIUM** | `completeGame()` is called at the design→preview transition, but the user hasn't seen the preview yet. The game is marked complete before the user sees their app card. Should be called when transitioning from preview→complete. |
| B-9 | MyFirstAiApp | 361 | **`game.nextRound()`** | **CRITICAL** | Same `nextRound` issue. |
| B-10 | EmojiDecoder | 280 | **Timer ref not cleaned up on unmount** | **LOW** | `timerRef` is set in `handleAnswer` but only conditionally cleared in `nextRound`. If component unmounts during the 1200ms timeout, it will fire on unmounted component. Add cleanup: `useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);` |
| B-11 | MyFirstAiApp | 358-359 | **`BUILD_STEPS` referenced in `advanceStep` creates stale closure** | **LOW** | `BUILD_STEPS` is declared inside the component body (line 338) but is a const array — no issue. However, `advanceStep` depends on `stepIdx` which depends on `buildStep` but `advanceStep`'s `useCallback` dependencies list does not include `BUILD_STEPS` (fine since it's stable). The dependency on `game` object may cause unnecessary recreations. |
| B-12 | MyFirstAiApp3D | 612 | **`frameloop="demand"` with `useFrame` animations** | **MEDIUM** | The 3D component uses `frameloop="demand"` but has continuous animations in `useFrame` (floating, rotation, pulsing). `frameloop="demand"` only renders when state changes via `invalidate()`. Since no `invalidate()` calls exist, the animations won't play. Should be `frameloop="always"` or add `state.invalidate()` calls in each `useFrame`. |
| B-13 | MyFirstAiApp3D | 363-383 | **BufferGeometry created in render loop** | **MEDIUM** | `PowerOrbsRing` creates new `Float32Array` and `BufferGeometry` objects on every render for connection lines. These should be memoized with `useMemo`. |

### 3.2 Type Safety Issues

| ID | File | Issue | Severity |
|----|------|-------|----------|
| T-1 | EmojiDecoder | `timerRef` typed as `NodeJS.Timeout \| null` — works but `ReturnType<typeof setTimeout>` is more portable | LOW |
| T-2 | MyFirstAiApp | `canAdvance()` is a regular function, not memoized — fine for re-render but inconsistent with other `useCallback` usage | LOW |
| T-3 | MyFirstAiApp | `currentTheme` fallback `DESIGN_THEMES[0]` could be undefined if array is empty (won't happen but `!` assertion would be cleaner with a const) | LOW |
| T-4 | MyFirstAiApp3D | `PowerOrbMesh` accesses `position[1]` in `useFrame` but position is passed as prop — if parent changes position, stale value used in animation | LOW |
| T-5 | All 3 games | `as 'A' \| 'B' \| 'C'` type assertion on `ageBand` — could fail silently if store returns unexpected value | LOW |

---

## 4. STORE API USAGE AUDIT

### Critical: `game.addScore` vs `updateScore` / `game.nextRound` vs `advanceRound`

Per CLAUDE.md §11 (Known Bug Registry) and §14 (Stores), the correct gameStore API is:

| Incorrect (used in docs) | Correct API | Games Affected |
|--------------------------|-------------|----------------|
| `game.addScore(N)` | `game.updateScore(N)` | ALL 3 games |
| `game.nextRound()` | `game.advanceRound()` | ALL 3 games |
| `game.startGame(id, xp)` | `game.startGame(id, xp)` | CORRECT in Emoji + AiOrNot, MISSING in MyFirstAiApp |
| `game.completeGame()` | `game.completeGame()` | CORRECT in all 3 |

### Occurrence Count

| Method | EmojiDecoder | MyFirstAiApp | AiOrNot | Total |
|--------|-------------|-------------|---------|-------|
| `game.addScore()` | 2 (lines 317, 335) | 1 (line 355) | 2 (lines 220, 232) | **5** |
| `game.nextRound()` | 1 (line 328) | 1 (line 361) | 1 (line 226) | **3** |
| `game.startGame()` | 1 (line 410) | **0 — MISSING** | 1 (line 304) | 2 + 1 missing |

### Required Fixes (Stage Doc Auto-Fix per §3.1)

These are **Package API changes / TypeScript type fixes** — auto-fixable without approval:

1. **Replace all `game.addScore(N)`** → `game.updateScore(N)` across all 3 game files
2. **Replace all `game.nextRound()`** → `game.advanceRound()` across all 3 game files
3. **Add `game.startGame('my-first-ai-app', 30)`** to MyFirstAiAppGame at the learn→build transition

---

## 5. POTENTIAL ENHANCEMENTS & UI IMPROVEMENTS

### 5.1 High-Priority Enhancements (Recommended)

| ID | Game | Enhancement | Rationale | Effort |
|----|------|-------------|-----------|--------|
| E-1 | EmojiDecoder | **Add complete phase UI** | Currently blank screen after game. Add summary: total correct, best streak, XP earned, badge earned message. | Low (~30 lines) |
| E-2 | AiOrNot | **Add complete phase UI** | Same issue. Could show final Reality Score, per-category breakdown (currently only in prediction phase), and "AI Future Expert" badge. | Low (~35 lines) |
| E-3 | MyFirstAiApp | **Move `completeGame()` to preview→complete** | Game is marked complete before user sees their app card. Better UX: show preview, then complete. | Low (move 1 line) |
| E-4 | MyFirstAiApp | **Add `startGame()` call** | Missing game initialization. Required for XP/progress tracking. | Low (add 1 line) |
| E-5 | All 3 | **Add keyboard navigation for answer selection** | ARIA labels exist but no keyboard handlers (Enter/Space only via button default). Arrow keys for navigating options would improve a11y. | Medium |

### 5.2 Medium-Priority Enhancements

| ID | Game | Enhancement | Rationale |
|----|------|-------------|-----------|
| E-6 | EmojiDecoder | **Streak visual multiplier** | Show "2x COMBO!", "3x COMBO!" text animation when streak triggers, not just the counter. More gamified feel. |
| E-7 | EmojiDecoder | **Shuffle answers per render** | Answers are shuffled in `useMemo` but memoized by `round` — if component re-renders for same round, answers won't re-shuffle. This is actually correct behavior (prevents layout shift), but the shuffle uses `Math.random()` which makes answer order deterministic per mount. Consider seed-based shuffle for reproducibility. |
| E-8 | AiOrNot | **Animate confidence slider value** | Show an emoji face that changes expression as confidence moves (🤷 at 10%, 🤔 at 50%, 💪 at 90%). Currently only shows text label. |
| E-9 | AiOrNot | **Add sound feedback** | Spec mentions Tone.js for game audio. No audio hooks in any of the 3 games. Consider adding correct/incorrect chimes. |
| E-10 | MyFirstAiApp | **Animate 3D during power selection** | Currently orbs just appear. Could animate entrance (scale from 0, fly in from edges) when each power is selected. |
| E-11 | MyFirstAiApp3D | **Fix frameloop issue** | Change `frameloop="demand"` to `frameloop="always"` or add `state.invalidate()` in useFrame hooks. Without this, all 3D animations are frozen. |
| E-12 | MyFirstAiApp3D | **Memoize line geometries** | Move Float32Array/BufferGeometry creation out of render into `useMemo`. |

### 5.3 Low-Priority / Post-Build Enhancements

| ID | Game | Enhancement |
|----|------|-------------|
| E-13 | EmojiDecoder | Add animation for emoji characters splitting apart when answer is wrong (visual "decode failure") |
| E-14 | AiOrNot | Add a "time capsule" feature — save predictions to local storage, revisit later |
| E-15 | MyFirstAiApp | Add app icon generator — simple algorithm to create a unique icon from category + theme + powers |
| E-16 | All 3 | Add loading skeletons for phase transitions instead of instant mount |
| E-17 | MyFirstAiApp3D | Add entry animation for phone frame (slide up from below platform on first build step) |

---

## 6. README & DOCUMENT CONSISTENCY

### 6.1 README.md Issues

| Issue | Current | Should Be |
|-------|---------|-----------|
| Filename convention | Lists `STAGE7F_v3FINAL_A.pdf` and `STAGE7F_Part2.pdf` | Actual files are `.md` not `.pdf`. Part1 and Part2 naming differs from actual filenames. |
| Part count | Lists 3 PDFs | Actually 4 `.md` files (Part1, Part2, v3FINAL_PartA, v3FINAL_PartB) |
| Build phase | "19 of 24" | Should be "21 of 26" per CLAUDE.md §4 (26 phases total, 7F is phase 21) |

### 6.2 Cross-Document Issues

| Issue | Details |
|-------|---------|
| **Supersedes confusion** | Part B says it "Supersedes: STAGE7F_Part1.pdf (My First AI App code section)" but the actual file is `STAGE7F_Part1_EmojiDecoder.md`. The Part 1 file title says "Emoji Decoder" not "My First AI App". It appears Part 1 originally contained both games but was renamed. The supersedes reference uses the old PDF naming convention. |
| **Line count discrepancy** | Part 2 coverage summary says "1,635 lines across 3 components" (543 + 619 + 473 = 1,635). But Part B replaces MyFirstAiApp with ~700 lines, so actual total is 543 + 700 + 473 = 1,716 lines. |
| **GCUD version mismatch** | Part 1 and Part 2 reference GCUD V8→V9. v3FINAL Parts A/B reference GCUD V9. Current GCUD is V10.1. All references should note V10.1 as current. |
| **Game count** | Part 2 says "31 games (was 28)". CLAUDE.md says 35 total games. The 31 figure is correct at time of 7F completion (pre-7F = 28 + 3 = 31), but if the total is 35, the "TOTAL Curriculum" number needs context about remaining stages. |
| **_SUPERSEDED folder** | Per CLAUDE.md §3.2, Part 1's MyFirstAiApp section is superseded by v3FINAL Parts A+B. During build, the `_SUPERSEDED/` folder should be created with a manifest noting Part 1's MyFirstAiApp code is replaced. However, since Part 1 also contains Emoji Decoder (which is NOT superseded), Part 1 cannot be fully archived. It should be split or annotated. |

---

## 7. SUMMARY OF REQUIRED FIXES

### Must Fix Before Build (Auto-Fix per §3.1)

| Priority | Fix | Files Affected |
|----------|-----|----------------|
| **P0** | Replace `game.addScore()` → `game.updateScore()` | All 3 game files (5 occurrences) |
| **P0** | Replace `game.nextRound()` → `game.advanceRound()` | All 3 game files (3 occurrences) |
| **P0** | Add `game.startGame('my-first-ai-app', 30)` at learn→build transition | MyFirstAiAppGame.tsx |
| **P1** | Fix `frameloop="demand"` → `frameloop="always"` in MyFirstAiApp3D | MyFirstAiApp3D.tsx |
| **P1** | Add `xpReward={30}` to GameShell in MyFirstAiAppGame | MyFirstAiAppGame.tsx |
| **P1** | Add complete phase UI to EmojiDecoder and AiOrNot | EmojiDecoderGame.tsx, AiOrNotGame.tsx |
| **P1** | Move `completeGame()` from advanceStep to preview→complete in MyFirstAiApp | MyFirstAiAppGame.tsx |
| **P2** | Memoize line geometries in PowerOrbsRing | MyFirstAiApp3D.tsx |
| **P2** | Add timer cleanup on unmount for EmojiDecoder | EmojiDecoderGame.tsx |
| **P2** | Update README.md with correct filenames and phase number | README.md |

### Requires Human Approval (per §3.1)

None — all identified fixes are code quality / API correctness fixes within the auto-fix category.

---

---

## 8. RESOLUTION STATUS (Updated March 9, 2026)

All P0 and P1 fixes have been applied to stage documents:

| Fix | Status | Applied In |
|-----|--------|-----------|
| P0: `game.addScore()` → `game.updateScore()` | **RESOLVED** | All 3 game docs (5 occurrences) + all active stage docs across S6F, S7A, S7B |
| P0: `game.nextRound()` → `game.advanceRound()` | **RESOLVED** | All 3 game docs (3 occurrences) + all active stage docs across S6F, S7A, S7B |
| P0: Add `game.startGame('my-first-ai-app', 30)` | **RESOLVED** | STAGE7F_v3FINAL_PartB at learn→build transition |
| P1: `frameloop="demand"` → `frameloop="always"` | **RESOLVED** | STAGE7F_v3FINAL_PartA |
| P1: Add `xpReward={30}` to GameShell | **RESOLVED** | STAGE7F_v3FINAL_PartB |
| P1: Complete phase UI for EmojiDecoder | **RESOLVED** | STAGE7F_Part1 — E-1 enhancement |
| P1: Complete phase UI for AiOrNot | **RESOLVED** | STAGE7F_Part2 — E-2 enhancement |
| P1: Move `completeGame()` to preview→complete | **RESOLVED** | STAGE7F_v3FINAL_PartB — E-3 enhancement |
| P2: Memoize line geometries | **RESOLVED** | STAGE7F_v3FINAL_PartA — E-12 ConnectionLine component |
| P2: Timer cleanup on unmount | **RESOLVED** | STAGE7F_Part1 — B-10 fix |
| E-6: Streak visual multiplier | **RESOLVED** | STAGE7F_Part1 — Animated COMBO text |
| E-8: Confidence slider emoji | **RESOLVED** | STAGE7F_Part2 — Dynamic emoji face |
| E-5, E-7, E-9, E-10, E-13-E-17 | **DOCUMENTED** | Build-time implementation notes added to STAGE7F_v3FINAL_PartB |

**Total: 10 fixes applied, 7 implementation guides added for build-time application.**

---

*End of Stage 7F Audit Report*
*Audited: 5 files, 3 games, ~2,200 lines of code*
*Resolution update: March 9, 2026 — all critical and high-priority fixes applied*
