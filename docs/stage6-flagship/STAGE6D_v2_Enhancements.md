# SPARKFORGE — STAGE 6D V2 ENHANCEMENTS: Prompt Lab

**Date:** March 5, 2026 | **GCUD:** V4 | **Vision:** Laboratory Control Station
**Source:** STAGE6D V2 Enhancements — 5 premium features layered onto V2 base
**Applies to:** `src/components/games/PromptLabGame.tsx` (modifies existing file from STAGE6D v2)

---

## FILES IN THIS DOCUMENT

| Action | File | Lines Added |
|--------|------|-------------|
| MODIFY | `src/components/games/PromptLabGame.tsx` | ~580 lines over v2 base (1919 total) |

**Prerequisites:** Stage 6D v2 (PromptLabGame.tsx base). No new dependencies required.

---

## CODE REVIEW FINDINGS & FIXES APPLIED

### CRITICAL (8 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | **~30+ emoji corrupted to blank/space** (PDF encoding) | `analyzeResponse`, `PATTERNS`, `AIThinkingViz` data | Reconstructed all as Unicode escapes: `\u{1F4CF}` (ruler), `\u{1F4D6}` (book), `\u{1F522}` (digits), `\u{1F389}` (party), `\u{1F4A1}` (bulb), `\u{1F3AD}` (theater), `\u2753` (question), `\u{1F4BB}` (laptop), `\u{1F916}` (robot), `\u{1F60A}` (smile), `\u{1F327}\uFE0F` (rain), `\u{1F504}` (cycle), `\u{1F4DD}` (memo), `\u{1F517}` (link), `\u2699\uFE0F` (gear), `\u201C`/`\u201D` (quotes), `\u21B3` (arrow), `\u2190` (left arrow) |
| 2 | **`analyzeResponse` has stray `becaus` fragment** after insights declaration | Line after `const insights` | Removed dangling text fragment |
| 3 | **4 PATTERNS entries completely truncated** to `{ }` or partial fragments | PATTERNS[1] through PATTERNS[4] — between 'explain-for' and 'persona-task' | Reconstructed: 'step-by-step' (Step by Step, Band A), 'few-shot' (Learn by Example, Band B), 'chain-thought' (Think Step by Step, Band B), 'constrained' (The Constraint Stack, Band B) — with full templates, slots, and examples |
| 4 | **Multiple slot `examples` arrays truncated** mid-string | 'persona-task' slots, 'few-shot' slots, 'chain-thought' slots, 'constrained' slots | Completed all truncated example strings based on context |
| 5 | **`glass-card` CSS class** used in Patterns drawer overlay | Patterns `motion.div` | Replaced with inline styles: `background: rgba(17,17,24,0.95)`, `backdropFilter: blur(12px)` per v2 base convention |
| 6 | **`Sparkles` icon import** removed in v2 base as unused | Patterns quick action button | Re-added to lucide-react imports |
| 7 | **`Brain` and `RotateCcw` imports** removed in v2 base as unused | System Prompt Sandbox UI | Re-added to lucide-react imports |
| 8 | **`Eye` import** removed in v2 base as unused | X-Ray toggle and panel | Re-added to lucide-react imports |

### HIGH (4 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 9 | **X-Ray prompt reconstruction is a no-op** — reduces loop returns unchanged `text` | X-Ray panel highlighted prompt section | Simplified to show plain prompt text with signal count; proper tokenized highlighting is complex React work deferred to v3 |
| 10 | **`showXRay` is boolean but applied globally** — toggles ALL user messages at once | X-Ray state and toggle | Changed to `showXRay: number \| null` (message index) for per-message toggle. Same pattern for `showExplainer`. |
| 11 | **Motion exit props corrupted** in Patterns drawer | Pattern `motion.div` `exit={}` | Reconstructed: `exit={{ opacity: 0, y: 20 }}` matching project convention |
| 12 | **`AIThinkingViz` label text truncated** after "Sp" | Label `<span>` text | Completed to "Sparky is thinking..." with robot emoji prefix |

### MEDIUM (3 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 13 | **`sendMessage` deps missing** `systemPrompt` and `ageBand` | `useCallback` dependency array | Added `systemPrompt` and `ageBand` to deps |
| 14 | **`AIThinkingViz` uses `Math.random()` in SVG animation timing** | `animateMotion` `dur`/`begin` attributes | Replaced with deterministic formula based on indices to avoid hydration issues |
| 15 | **String apostrophes** in System Prompt sandbox JSX | "It's like giving..." text | Used `{'\u2019'}` JSX expression |

---

## ENHANCEMENT FEATURES IMPLEMENTED

### 1. Prompt X-Ray (~130 lines)

Color-codes prompt keywords and shows visual links to their effects on the AI response.

- **10 detection patterns:** explanations, step-by-step, audience, length, persona, format, examples, negatives, creative, comparison
- **Per-message toggle:** "X-Ray" button appears under each user message (after AI responds)
- **Color-coded keywords** with `"keyword" -> effect` mapping display
- **Signal count** at bottom of analysis panel
- **Types:** `XRayHighlight` interface, `analyzePromptXRay()` function

### 2. "Why Did the AI Say That?" Explainer (~100 lines)

Collapsible post-response panel analyzing response anatomy with educational callouts.

- **7 detection categories:** response length, numbered structure, enthusiastic tone, analogies, persona adoption, follow-up questions, code formatting
- **Default insight** when no specific patterns detected
- **Max 4 insights** per response (prevents overwhelming)
- **Educational "Because:"** explanation for each observation
- **Types:** `ResponseInsight` interface, `analyzeResponse()` function

### 3. Prompt Pattern Library (~200 lines including data)

Reusable structural patterns with fill-in-the-blank slots — teaching prompt SHAPES not just content.

- **8 patterns total:**
  - Band A: Explain For..., Step by Step, Persona + Task (3)
  - Band B: Learn by Example, Think Step by Step, The Constraint Stack (3)
  - Band C: System + User Split, The Refiner (2)
- **Fill-in-the-blank UI:** Each pattern has named slots with example pills
- **Example pills:** Clickable to auto-fill slot values
- **"Use This Prompt"** button assembles and fills the input
- **Two-panel UI:** Pattern list -> Pattern fill-in (with back navigation)
- **Types:** `PromptPattern` interface, `PATTERNS` constant array

### 4. AI Thinking Visualization (~80 lines)

Animated SVG replacing "..." dots with a mini neural network data flow graphic.

- **3-layer network:** 3-4-3 nodes (input, hidden, output)
- **Flowing data dots:** Animate along connections with `animateMotion`
- **Pulsing nodes:** Rhythmic radius animation
- **Temperature-adaptive visuals:**
  - Low (<0.3): Blue nodes/connections
  - Mid (0.3-0.7): Amber nodes/connections
  - High (>0.7): Red nodes/connections
- **Speed scales with temperature:** Higher temp = faster animation
- **Sparky label:** "Sparky is thinking..." header

### 5. System Prompt Sandbox — Band C Only (~60 lines)

Persistent system prompt textarea that shapes all AI responses in the session.

- **Brain icon toggle** in input area (purple glow when active)
- **200-character limit** with live counter
- **Collapsible panel** with AnimatePresence animation
- **Clear button** to reset system prompt
- **API integration:** System prompt prepended to API call as `[System Context: ...]`
- **Band C exclusive:** Not visible for Band A or Band B
- **Educational explanation:** "This shapes ALL responses. It's like giving the AI a job description."

---

## NEW IMPORTS ADDED

```typescript
import { Eye, Brain, RotateCcw, Sparkles } from 'lucide-react';
```

These were previously removed in v2 base as unused — now required by enhancement features.

---

## NEW STATE VARIABLES

```typescript
// X-Ray & Explainer
const [showXRay, setShowXRay] = useState<number | null>(null);
const [showExplainer, setShowExplainer] = useState<number | null>(null);
const [showPatterns, setShowPatterns] = useState(false);
const [patternSlots, setPatternSlots] = useState<Record<string, string>>({});
const [activePatternId, setActivePatternId] = useState<string | null>(null);

// System prompt sandbox (Band C)
const [systemPrompt, setSystemPrompt] = useState('');
const [showSystemPrompt, setShowSystemPrompt] = useState(false);

// Derived
const availablePatterns = useMemo(() =>
  PATTERNS.filter(p => BAND_ORDER[p.bandMin] <= BAND_ORDER[ageBand]),
  [ageBand]
);
```

---

## API MODIFICATION

The `sendMessage` function's fetch body now conditionally includes the system prompt for Band C:

```typescript
prompt: systemPrompt && ageBand === 'C'
  ? `[System Context: ${systemPrompt}]\n\n${userMessage.content}`
  : userMessage.content,
```

---

## BUILD VALIDATION

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS (0 errors) |
| `npm run lint` | PASS (0 warnings) |
| `npm run build` | PASS |
| Final line count | 1919 lines (~580 added over 830-line v2 base) |

---

## FORWARD COMPATIBILITY NOTES

This v2 Enhancement layer will be superseded by v3-FINAL Parts A + B which add:
- **Part A:** PromptBubble3D.tsx — 3D thought bubble visualization (Decision 6.5)
- **Part B:** Enhanced PromptLabGame.tsx with 3D integration, report phase render

All enhancement features (X-Ray, Explainer, Patterns, AIThinkingViz, System Prompt) are preserved in v3-FINAL integration.

---

## VERIFICATION CHECKLIST

### Prompt X-Ray
- [ ] "X-Ray" link appears under each user message (after AI has responded)
- [ ] Clicking shows color-coded keyword analysis with arrow -> effect labels
- [ ] 10 pattern types detected: explanations, step-by-step, audience, length, persona, format, examples, negatives, creative, comparison
- [ ] X-Ray toggles on/off cleanly per message

### "Why Did the AI Say That?"
- [ ] "Why did the AI say that?" link appears under each assistant message
- [ ] Clicking shows 1-4 response insights with emoji + observation + "Because" explanation
- [ ] Detects: response length, numbered structure, enthusiastic tone, analogies, persona adoption, follow-up questions, code formatting
- [ ] Default insight appears when no specific patterns detected

### Prompt Pattern Library
- [ ] "Patterns" button appears in empty-state quick actions
- [ ] Pattern list shows 5-8 patterns (filtered by age band)
- [ ] Clicking a pattern opens fill-in-the-blank view with slot inputs
- [ ] Each slot shows clickable example pills
- [ ] "Use This Prompt" fills the input with the assembled prompt
- [ ] Band C sees System+User Split and The Refiner patterns

### AI Thinking Visualization
- [ ] Loading state shows animated mini neural network SVG instead of "..." dots
- [ ] Data flow dots animate along connections
- [ ] Nodes pulse rhythmically
- [ ] Visual adapts to temperature: blue (low), amber (mid), red (high)
- [ ] Speed increases at higher temperature settings

### System Prompt Sandbox (Band C)
- [ ] Brain icon button appears left of input (Band C only)
- [ ] Clicking opens persistent system prompt textarea above input
- [ ] Character counter shows 0/200
- [ ] System prompt prepended to API calls as context
- [ ] Clear button resets system prompt
- [ ] Button glows purple when system prompt is active
- [ ] Not visible for Band A or Band B
