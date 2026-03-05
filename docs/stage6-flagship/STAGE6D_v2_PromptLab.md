# SPARKFORGE — STAGE 6D v2: Prompt Lab Game (Base)

**Date:** March 5, 2026 | **GCUD:** V4 | **Vision:** Laboratory Control Station
**Source:** STAGE6D v2 Prompt Lab (base) — preliminary version
**Note:** This is the v2 base. v3-FINAL Parts A + B will supersede with 3D PromptBubble3D and enhanced visuals.

---

## FILES IN THIS DOCUMENT

| Action | File | Lines |
|--------|------|-------|
| NEW | `src/components/games/PromptLabGame.tsx` | ~830 |

**Prerequisites:** Stage 6A (GameShell, gameStore). API route `/api/ai/prompt-lab/route.ts` must exist (verified present).
**Supersedes:** PromptLabGame.tsx v1

---

## CODE REVIEW FINDINGS & FIXES APPLIED

### CRITICAL (7 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | **~50+ emoji corrupted** (PDF encoding — spaces/blank) | All data arrays, JSX, challenge checkFns | Reconstructed all as Unicode escapes: `\u{1F3AF}` (target), `\u{1F50D}` (magnifier), `\u2696\uFE0F` (scales), `\u{1F3A8}` (palette), `\u{1F308}` (rainbow), `\u{1F4CF}` (ruler), `\u{1F3AD}` (theater), `\u{1F517}` (link), `\u{1F4DD}` (memo), `\u2699\uFE0F` (gear), `\u{1F4D6}` (book), `\u{1F52C}` (microscope), `\u{1F9EE}` (abacus), `\u{1F4BB}` (laptop), `\u{1F6E0}\uFE0F` (wrench), `\u{1F30D}` (globe), `\u{1F4A1}` (bulb), `\u{1F4DA}` (books), `\u{1F60A}` (smile), `\u{1F327}\uFE0F` (rain), `\u26A1` (lightning), `\u{1F431}` (cat), `\u{1F436}` (dog), `\u2600\uFE0F` (sun), `\u{1F916}` (robot), `\u2728` (sparkles), `\u{1F3C6}` (trophy), `\u2705` (check), `\u{1F4AD}` (thought), `\u2715` (x-close) |
| 2 | **`game.addScore()`** does not exist on gameStore | `sendMessage` (2 calls) | Changed to `game.updateScore()` |
| 3 | **`game.nextRound()`** does not exist on gameStore | `sendMessage` | Changed to `game.advanceRound()` |
| 4 | **~40 template prompt texts truncated** | TEMPLATES object (all 8 categories) | Completed all 40 prompt texts based on visible context |
| 5 | **~40 technique tag arrays truncated** | TEMPLATES prompts | Reconstructed all technique arrays based on prompt content analysis |
| 6 | **6 technique descriptions/examples truncated** | TECHNIQUES array | Completed all `description`, `descriptionC`, `before`, `after` fields |
| 7 | **scorePrompt function — 5+ lines truncated** at increment operations | `scorePrompt()` | Reconstructed all regex checks and score increments |

### HIGH (6 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 8 | **CREATIVITY_STOPS** — all 5 entries merged onto corrupted lines | Constant array | Reconstructed as proper object array with all fields |
| 9 | **5 challenge checkFn feedback strings truncated** | CHALLENGES array | Completed all ternary feedback strings |
| 10 | **Template type annotation truncated** | TEMPLATES constant | Created proper `TemplateCategory` and `TemplatePrompt` interfaces |
| 11 | **challengeResults state type truncated** | Component state | Completed: `Record<string, { passed: boolean; feedback: string }>` |
| 12 | **Chrome bezel boxShadow truncated** at `rgba(0` | JSX style prop | Completed: full 3-value shadow matching project convention |
| 13 | **Multiple className strings truncated** | Various JSX elements (textarea, buttons) | Completed all className strings |

### MEDIUM (4 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 14 | **`parent` from useAuthStore** — destructured but never used in render | Import/destructuring | Removed to pass lint |
| 15 | **Unused imports** — Zap, Brain, RotateCcw, Sparkles, Eye, Sliders | Import statement | Removed 6 unused lucide-react imports (may be used in v3-FINAL) |
| 16 | **`glass-card` CSS class** used in overlays — may not be defined in globals.css | Template/challenges/techniques drawers | Replaced with inline styles: `background: rgba(17,17,24,0.95)`, `backdropFilter: blur(12px)` |
| 17 | **Multiple `exit={}` props corrupted** on motion.divs | AnimatePresence children | Reconstructed proper exit animations |

### LOW (2 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 18 | **String apostrophes** — raw `'` in JSX strings | Various places | Changed to `&apos;`, `\u2019`, or JSX expressions |
| 19 | **`availableTemplates` filter** — unused `_` variable name | `Object.entries().filter()` | Changed to `[, t]` destructuring |

---

## GAME FEATURES IMPLEMENTED

### 5-Phase Flow
- **Welcome:** Sparkles emoji, topic tags, "Learn First" / "Jump In" buttons
- **Learn:** Technique cards with before/after examples, step navigation, skip option
- **Sandbox:** Full chat interface with templates, tips, challenges quick actions
- **Challenge:** Challenge drawer overlay, active challenge banner, auto-evaluation feedback
- **Report:** (Phase type defined, render to be added in v3-FINAL)

### 8-Category Template Library (40 prompts)
- Stories (A), Science (A), Creative (A) — all age bands
- Math & Logic (B), AI Ethics (B), Code & Tech (B) — Band B+
- Prompt Engineering (C), Real World AI (C) — Band C only
- Each prompt tagged with applicable techniques

### Multi-Dimensional Prompt Scoring
- 5 axes: Specificity, Clarity, Creativity, Constraints, Technique (0-5 each)
- Live scoring as user types (after 5+ chars)
- Expandable detail view with colored progress bars
- Tips for low-scoring dimensions
- Score attached to each sent message (star display)

### 5 Guided Challenges
1. The Sharpshooter (A) — Specificity with 3-sentence constraint
2. The Actor (A) — Persona prompting
3. The Inventor (B) — Creative generation
4. The Detective (B) — Chain-of-thought reasoning
5. The Teacher (C) — Few-shot prompting with examples

### 6 Prompt Engineering Techniques
- Be Specific (A), Add Constraints (A), Give a Persona (B)
- Chain of Thought (B), Give Examples (B), System Prompts (C)
- Each with before/after examples and Band B/C technical descriptions

### Visual Design
- Chrome bezel with amber LED rim glow
- 20 amber CSS particles
- Holographic chat bubbles (amber for user, purple for assistant)
- Creativity dial with 5 colored stops
- Glass-style overlay panels for templates/challenges/techniques

### Age Band Differentiation
- **Band A:** Guided templates, basic challenges, simple technique descriptions
- **Band B:** + Math/Logic, Ethics, Code categories; + persona, chain, fewshot techniques
- **Band C:** + Prompt Engineering, Real World AI; + system prompts; technical descriptions

### API Integration
- Calls `/api/ai/prompt-lab` with childId, prompt, temperature, ageBand, conversationHistory
- Rate limit (429) and moderation error handling
- Loading state with animated "thinking" indicator

---

## BUILD VALIDATION

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS (0 errors) |
| `npm run lint` | PASS (0 warnings) |
| `npm run build` | PASS |

---

## FORWARD COMPATIBILITY NOTES

This v2 base will be superseded by v3-FINAL Parts A + B which add:
- **Part A:** PromptBubble3D.tsx — 3D thought bubble visualization (Decision 6.5)
- **Part B:** Enhanced PromptLabGame.tsx with 3D integration, report phase render

The following are preserved for v3 integration:
- `Phase` type includes `'report'` for future render
- Template/technique/challenge data structures are extensible
- Chrome bezel structure matches v3 Station Frame pattern
