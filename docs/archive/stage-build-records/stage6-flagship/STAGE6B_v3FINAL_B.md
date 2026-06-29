# Stage 6B v3-FINAL Part B — AI Pet Trainer Game

> **AUDIT FIXES APPLIED (March 27, 2026):**
> - **S6-CRIT-003:** GameShell already calls `startGame()` — no redundant call needed in PetTrainerGame.
> - **sceneStore integration:** PetTrainerGame now imports `useSceneStore` and registers 3D content via `setGameSceneContent()`. Scene updates reactively with mood/evolution changes.
> - **cockpitBroadcast:** GameShell broadcasts `game-enter`/`game-exit` events to cockpitBroadcastStore.
>
> **ENHANCEMENTS APPLIED (March 28, 2026):**
> - **P1:** Cockpit broadcast — `button-press` on correct/wrong, `dial-rotate` at accuracy milestones, `celebration-start` on evolution
> - **P2:** `usePetTrainerAudio` (Tone.js) — correct chime, wrong tone, streak chord, evolution fanfare, blip
> - **P6-A:** `PetDataLab3D` — 3D bar chart visible during data-lab phase showing training data distribution + overfitting warning

**Version:** v3-FINAL (corrected)
**Build Phase:** 10 (Stage 6B — Pet Trainer, Part B: Full game replacement)
**Prerequisites:** Stage 6B Part A v3-FINAL (PetCreature3D.tsx + Pet3DScene.tsx) must be complete
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS
**Lab:** 2 — Teaching Machines | **Color:** #8B5CF6 (Purple)
**Age Bands:** A (7-10), B (11-13), C (14-16)

---

## Overview

This document contains the full PetTrainerGame.tsx game component — a complete replacement of the v2 version. The game logic, phases, content, and UI are identical to v2. All v3 changes are encapsulated in Part A's 3D components (PetCreature3D.tsx + Pet3DScene.tsx). The dynamic import path (`import('@/components/3d/Pet3DScene')`) is unchanged, so the game automatically picks up GLB creatures + toon shading once Part A is deployed.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 6.2 | GLB pet references via updated Pet3DScene import chain | PetTrainerGame.tsx |
| 7.5 | Toon-shaded pet (via Pet3DScene > PetCreature3D chain) | PetTrainerGame.tsx |

### v2 Enhancements Preserved

- Complete 7-phase game flow with all phase handlers
- 8 pets, 10 category sets, all training/test items (expanded April 7, 2026)
- Chrome bezel, LED rim, particle background
- Streak system, combo multiplier, overfitting detection
- Confusion matrix (Band C), What You Learned cards
- All ARIA labels and accessibility features

### Flagship Game Audit Enhancements (April 7, 2026)

| Feature | Before | After |
|---------|--------|-------|
| Pets | 5 | 8 (+Glitchfox, Datawing, Neurohound) |
| Categories | 4 | 10 (+Instruments, Weather, Emotions, Foods, Clothing, Vehicles Advanced) |
| Evolution stages | 6 | 8 (+Specialist, Master) |
| Moods | 6 | 10 (+frustrated, curious, proud, sleepy) |
| Training modes | 1 (label) | 4 (+speed-drill, noise-challenge, transfer-test) |
| Customization | None | 7 accessories with unlock milestones |
| Mood effects | None | Learning rate modifiers per mood |
| AI integration | None | useAIContent hook for "Surprise me!" novel categories |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/components/games/PetTrainerGame.tsx` | CREATE (REPLACES v2) | Full 7-phase AI Pet Trainer game |
| 2 | `src/components/game/GameShell.tsx` | CREATE | Game wrapper component (prerequisite) |

### Prerequisite: GameShell Component

`GameShell` is the standard wrapper for all 35 SparkForge games. It was created as part of this stage because it is first needed here. It:
- Calls `gameStore.startGame()` on mount with game configuration
- Calls `gameStore.resetGame()` on unmount
- Wraps children in a layout container with data attributes

---

## Code Review & Audit Report

### Issues Found and Fixed (Source Document)

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | CRITICAL | All emoji characters corrupted to `■` (black squares) — ~100+ instances across 8 pets, 10 category sets, evolution labels, UI elements | Reconstructed all emoji using Unicode escape sequences (`\u{XXXX}`) to prevent encoding issues |
| 2 | CRITICAL | Alien pet `wrongReactions` array has unclosed string: `'Does not compute on my planet..` — missing closing quote and bracket | Completed string with `... \u{1F4E1}']` |
| 3 | CRITICAL | Animals `descriptionC` string truncated mid-sentence | Completed: `'...changes decision boundaries and increases error rates.'` |
| 4 | CRITICAL | Vehicles `descriptionC` string truncated mid-sentence | Completed: `'...some vehicles fit multiple categories.'` |
| 5 | HIGH | `game.addScore()` called but gameStore has `updateScore()` | Changed to `game.updateScore()` |
| 6 | HIGH | `game.nextRound()` called but gameStore has `advanceRound()` | Changed to `game.advanceRound()` |
| 7 | HIGH | Confusion matrix uses `<>` fragment shorthand with implicit keys — React fragments shorthand cannot have keys | Changed to `<Fragment key={...}>` with explicit import |
| 8 | HIGH | `boxShadow` CSS value in chrome bezel truncated mid-string | Completed full shadow value |
| 9 | HIGH | Welcome phase `boxShadow` animation array truncated | Completed 3-step animation array |
| 10 | HIGH | `GameShell` import from `@/components/game/GameShell` — component did not exist | Created `GameShell.tsx` |
| 11 | MEDIUM | Grid cols ternary in train phase truncated (`'g...`) | Completed: 2 cols / 3 cols / 2-4 cols responsive |
| 12 | MEDIUM | Multiple `className` strings truncated across welcome, adopt, teach, report phases | Completed all className strings |
| 13 | REVERTED | `spark-green`, `spark-orange` CSS classes — confirmed valid (IMP-4 spark-* aliases in tailwind.config.ts) | Restored original spark-* classes per v2 doc cross-reference |
| 14 | LOW | Unused imports: `useCallback`, `useEffect`, `Star`, `Trophy`, `TrendingUp` | Removed unused imports |
| 15 | LOW | String escaping: `\'` inside JSX strings | Changed to `{"..."}` JSX expressions or `&apos;` entities |

### Game Architecture

**7-Phase Flow:**
1. **Welcome** — 3D egg preview, topic tags, "Hatch Your Pet" CTA
2. **Adopt** — 6 pet selection grid, personality display, name input
3. **Teach** — Category set selector (filtered by age band), description
4. **Train** — Item display, category buckets, accuracy bar, streak counter, pet speech bubbles
5. **Data Lab** — Label distribution chart, stats summary, overfitting warning
6. **Test** — Unknown items, pet thinking animation, correct/wrong feedback, progress dots
7. **Report** — Dual score rings (SVG), evolution label, confusion matrix (Band C), What You Learned

**8 Pets:**
| ID | Emoji | Name | Personality | Unlock |
|----|-------|------|-------------|--------|
| byteling | 🟦 | Byteling | Logical, precise, loves organizing | Start |
| sparkpaw | 🟣 | Sparkpaw | Curious, social, makes connections | Start |
| voltkit | ⚡ | Voltkit | Energetic, fast, loves speed | Start |
| cogsworth | ⚙️ | Cogsworth | Methodical, creative, builds | Start |
| pixie | 👁️ | Pixie | Observant, discovers patterns | Start |
| glitchfox | 🦊 | Glitchfox | Mischievous, teaches error correction | 3 sessions |
| datawing | 🧚 | Datawing | Precise but fragile (accuracy drops with bad data) | Reach "Kid" |
| neurohound | 🐕 | Neurohound | Loyal, retains categories better | Reach "Genius" |

**10 Category Sets (Age-Band Filtered):**
| Set | Band Min | Categories | Training Items | Test Items |
|-----|----------|------------|---------------|------------|
| Shapes | A | 2 (Circle, Square) | 12 | 4 |
| Fruits | A | 2 (Apple, Banana) | 12 | 4 |
| Weather | A | 3 (Sunny, Rainy, Snowy) | 8 | 3 |
| Foods | A | 3 (Italian, Japanese, Mexican) | 8 | 3 |
| Animals | B | 3 (Cat, Dog, Bird) | 16 | 6 |
| Instruments | B | 3 (String, Wind, Percussion) | 8 | 3 |
| Emotions | B | 3 (Happy, Sad, Angry) | 8 | 3 |
| Clothing | B | 3 (Head, Body, Feet) | 8 | 3 |
| Vehicles | C | 4 (Land, Water, Air, Space) | 16 | 6 |
| Vehicles (Advanced) | C | 4 (Land, Water, Air, Space) | 8 | 4 |

**GameStore Integration:**
- `game.updateScore(points)` — awards XP for correct labels (5 base + 3 streak bonus)
- `game.advanceRound()` — advances round counter after each label
- `game.completeGame()` — marks game complete after test phase

**Evolution System (8 stages):**
| Correct | Stage | Label |
|---------|-------|-------|
| 0-2 | 0 | Egg 🥚 |
| 3-5 | 1 | Baby 🐣 |
| 6-9 | 2 | Toddler 👶 |
| 10-14 | 3 | Kid 🧒 |
| 15-19 | 4 | Teen 🧑‍💻 |
| 20-29 | 5 | Genius 🧠 |
| 30+ (3+ categories) | 6 | Specialist 🎯 |
| 30+ (6+ categories) | 7 | Master 👑 |

**Mood System (10 moods):**
| Mood | Trigger | Learning Rate Effect |
|------|---------|---------------------|
| sleeping | Welcome/adopt phase | 0x |
| confused | Accuracy < 25% | 0.7x |
| learning | Accuracy 25-50% | 1.0x |
| smart | Accuracy 50-75% | 1.2x |
| genius | Accuracy 90%+ | 1.5x |
| celebrating | Report phase | 1.3x |
| frustrated | 3+ consecutive wrong | 0.8x |
| curious | New category introduced | 1.3x |
| proud | Evolution stage reached | 1.1x |
| sleepy | 15+ items without break | 0.6x |

---

## Verification Checklist

After implementing Part A + Part B:

`npm run dev` → Test at http://localhost:3000/arcade/pet-trainer:

### Visual Checks (v3 specific)
- [ ] [v3] Pet renders with toon shading (flat color steps, not glass/refraction)
- [ ] [v3] If GLB files exist in `public/models/pets/`, creature models load
- [ ] [v3] If GLB files are missing, procedural orb fallback renders correctly
- [ ] [v3] Custom HDR loads if `frost-prismatic.hdr` exists, else drei `'night'` preset
- [ ] Chrome bezel frame visible with purple LED rim glow
- [ ] Purple particle background animates smoothly
- [ ] Emoji overlays centered on 3D creature/orb
- [ ] Glass card panels render with backdrop blur

### Phase Flow (preserved from v2)
- [ ] Welcome: 3D egg, topic tags, "Hatch Your Pet" CTA
- [ ] Adopt: 8 pets with personalities, name input, adopt button (5 base + 3 unlockable)
- [ ] Teach: category set selector (filtered by age band), description
- [ ] Train: item display, category buckets, accuracy bar, streak counter, pet speech bubbles
- [ ] Data Lab: label distribution chart, stats, overfitting warning (if applicable)
- [ ] Test: unknown items, pet thinking animation, correct/wrong, progress dots
- [ ] Report: dual score rings, evolution label, confusion matrix (Band C), What You Learned

### Age Band Differentiation
- [ ] Band A: Shapes + Fruits
- [ ] Band B: Shapes + Fruits + Animals
- [ ] Band C: all 4 sets + feature display + confusion matrix + ML terminology

### Accessibility
- [ ] All buttons have aria-labels
- [ ] Pet selector uses aria-pressed
- [ ] Category buttons use aria-label
- [ ] Name input has aria-label
- [ ] No drag-drop required (all click-based)
