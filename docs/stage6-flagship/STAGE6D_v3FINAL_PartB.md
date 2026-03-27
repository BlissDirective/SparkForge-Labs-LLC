# SPARKFORGE -- STAGE 6D v3-FINAL (PART B): Prompt Lab 3D Integration

> **AUDIT FIXES APPLIED (March 27, 2026):**
> - **S6-CRIT-001:** PromptLabGame now calls `game.completeGame()` when entering report phase. Added "Finish Lab" button (visible after 1+ challenge or 4+ messages), full report phase UI with stats + "What You Learned" summary differentiated by age band (A/B/C).
> - **S6-WARN-001:** Added client-side rate limiting to `sendMessage` — 2-second cooldown + 50 prompt daily cap.
> - **sceneStore integration:** PromptLabGame registers PromptBubble3DScene via `setGameSceneContent()` when keywords are active.

**Date:** March 5, 2026 | **GCUD:** V9 | **Vision:** Laboratory Control Station
**Design:** Frost-Prismatic v3 (blue-dominant 60/40, chrome bezel, hex-radial, R3F station frame)
**Lab:** 4 -- AI That Creates | **Color:** #F59E0B (Amber/Orange)

---

## DECISIONS IMPLEMENTED

- [x] Decision 6.2.3 -- 3D bubble integration via PromptBubble3D dynamic import in PromptLabGame.tsx

## v2 ENHANCEMENTS PRESERVED

All v2 features remain unchanged:
- 5-phase game flow (welcome > learn > sandbox > challenge > report)
- 8-category template library (40 prompts), technique tags, age-band filtering
- Multi-dimensional prompt scoring (5 axes), 6 technique tutorials
- 5 challenges with auto-eval, Prompt X-Ray, Explainer, Patterns, AI Thinking
- System Prompt Sandbox (Band C), Chrome bezel + LED rim, ARIA labels

---

## FILES IN THIS DOCUMENT

| Action | File | Lines |
|--------|------|-------|
| MODIFIED | `src/components/games/PromptLabGame.tsx` | +85 lines (1919 -> 2004) |
| NEW | `src/components/3d/PromptBubble3DScene.tsx` | 36 lines |

**Prerequisites:**
- Stage 6D Part A v3-FINAL (PromptBubble3D.tsx)
- Stage 6D v2 + v2 Enhancements (PromptLabGame.tsx base)

---

## INTEGRATION APPROACH

The stage document specified 6 modifications to the existing PromptLabGame.tsx. Rather than import `Canvas` directly (which causes SSR errors), the SSR-safe wrapper approach (Mod 6) was used from the start. This creates `PromptBubble3DScene.tsx` as a thin Canvas wrapper loaded via `next/dynamic({ ssr: false })`.

---

## CODE REVIEW FINDINGS & FIXES APPLIED

### HIGH (2 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Stage doc imports `Canvas` from `@react-three/fiber` at top level -- Canvas accesses browser APIs at import time, causing SSR/hydration errors | Mod 1 imports | Used SSR-safe wrapper approach (Mod 6): created `PromptBubble3DScene.tsx` with Canvas inside, loaded via `dynamic(() => import(...), { ssr: false })` |
| 2 | Stage doc specifies `frameloop="demand"` -- physics simulation in `useFrame` needs continuous animation loop, `demand` mode only renders when `invalidate()` is called | Canvas config | Changed to `frameloop="always"` so spring physics, damping, and pop animations run continuously while bubbles are visible |

### MEDIUM (2 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 3 | Sandbox container `motion.div` has no `relative` positioning -- absolute-positioned 3D overlay won't anchor to correct parent | Mod 5 sandbox wrapper | Added `relative` to className: `"flex-1 flex flex-col min-h-0 relative"` |
| 4 | `sendMessage` useCallback deps array missing `isMobile` -- stale closure means keyword extraction may use wrong mobile state | Mod 3 deps | Added `isMobile` to the deps array |

### LOW (1 note)

| # | Issue | Location | Note |
|---|-------|----------|------|
| 5 | Mobile fallback `motion.div` uses no `exit` prop -- stage doc had `exit={{ opacity: 0, scale: 0 }}` | Mobile pills | Removed `exit` since pills are not wrapped in their own `AnimatePresence` -- they unmount when `showBubbles` becomes false. The `animate` keyframes already handle the visual lifecycle. |

---

## MODIFICATIONS APPLIED

### Mod 1: Imports (after lucide-react import)
- `import dynamic from 'next/dynamic'`
- `import { extractKeywords } from '@/components/3d/PromptBubble3D'`
- `const PromptBubble3DScene = dynamic(() => import(...), { ssr: false })`
- `function useIsMobile()` -- resize listener, 768px breakpoint

### Mod 2: State Variables (after systemPrompt state)
- `bubbleKeywords: string[]` -- accumulated keywords from prompts
- `showBubbles: boolean` -- controls 3D scene visibility
- `isMobile: boolean` -- from `useIsMobile()` hook

### Mod 3: Keyword Extraction (inside sendMessage, after setInput)
- Calls `extractKeywords(input.trim())`
- Appends to `bubbleKeywords` (max 12 via slice)
- Sets `showBubbles(true)` on desktop only

### Mod 4: Bubble Cleanup (after challenge check, before catch)
- `setTimeout(() => { setBubbleKeywords([]); setShowBubbles(false) }, 1000)`
- 1s delay allows pop animation in PromptBubble3D to complete

### Mod 5: 3D Scene JSX (inside sandbox phase, before challenge banner)
- Desktop: `PromptBubble3DScene` with absolute positioning, opacity 0.7, pointer-events-none
- Mobile: Floating keyword pills with Motion keyframe animations
- Both have `aria-hidden="true"` for accessibility

### Mod 6: SSR-Safe Wrapper (new file)
- `PromptBubble3DScene.tsx` -- Canvas wrapper with camera, frameloop, dpr, gl config
- Loaded via `next/dynamic({ ssr: false })` to avoid hydration errors

---

## NEW FILE: PromptBubble3DScene.tsx

### Architecture

```
PromptBubble3DScene (dynamic import, ssr: false)
  |-- Canvas (camera, frameloop=always, alpha)
      |-- PromptBubble3D (keywords, isThinking, temperature)
          |-- BubbleMesh (x12 max)
          |-- Glow sprites (x12 max)
          |-- Lighting + Environment
```

### Canvas Configuration

- **Camera:** position [0, 0, 2.5], FOV 50
- **Frame loop:** `always` (physics needs continuous updates)
- **DPR:** [1, 1.5] (performance capped)
- **GL:** antialias + alpha (transparent background)
- **Style:** `background: 'transparent'` (chat visible through)

---

## BUILD VALIDATION

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS (0 errors) |
| `npm run lint` | PASS (0 warnings) |
| `npm run build` | PASS |
| PromptLabGame.tsx final lines | 2004 |
| PromptBubble3DScene.tsx lines | 36 |

---

## STAGE 6D v3-FINAL COMPLETE (Parts A + B)

### Combined File Summary

| File | Action | Lines | Stage |
|------|--------|-------|-------|
| `src/components/3d/PromptBubble3D.tsx` | NEW | 369 | Part A |
| `src/components/3d/PromptBubble3DScene.tsx` | NEW | 36 | Part B |
| `src/components/games/PromptLabGame.tsx` | MODIFIED | +85 | Part B |

### Combined Decisions
- Decision 6.2.3: 3D thought bubbles with glass material, spring physics, keyword extraction, pop animations

### Supersedes
- `STAGE6D_Flagship_PromptLab.pdf`
- `STAGE6D_V2_Enhancements.pdf`

Both v2 documents are no longer needed for implementation. The v3-FINAL Parts A + B contain all specifications.

---

## VERIFICATION CHECKLIST

### v3 Visual Checks
- [x] Desktop: glass bubbles materialize when prompt is sent
- [x] Spring physics: bubbles drift, attract center, repel each other
- [x] Keywords visible as white text inside glass spheres
- [x] Amber/orange color palette matches Lab 4
- [x] Pop animation triggers when AI responds
- [x] Temperature slider affects bubble drift speed
- [x] Maximum 12 bubbles (old ones FIFO replaced)
- [x] Mobile: CSS keyword pills fallback (no 3D)
- [x] Transparent background (chat visible through)
- [x] pointer-events-none (no interaction interference)
- [x] No SSR hydration errors on page load

### Preserved v2 Checks
- [x] All 5 phases functional
- [x] Chrome bezel + LED rim
- [x] All v2 enhancement features preserved
- [x] ARIA labels and accessibility

---

## FORWARD: Stage 6E

Stage 6E implements Agent Architect (Lab 5) -- AgentPipeline3D component + full game replacement.
