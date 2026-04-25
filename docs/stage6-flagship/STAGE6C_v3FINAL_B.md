# SPARKFORGE — STAGE 6C v3-FINAL (PART B): Neural Network Builder Game

> **AUDIT FIXES APPLIED (March 27, 2026):**
> - **S6-CRIT-003:** GameShell already calls `startGame()` — no redundant call needed in NeuralBuilderGame.
> - **sceneStore integration:** NeuralBuilderGame now imports `useSceneStore` and registers 3D content via `setGameSceneContent()`. Scene updates reactively with training/accuracy state.
> - **cockpitBroadcast:** GameShell broadcasts `game-enter`/`game-exit` events to cockpitBroadcastStore.
>
> **ENHANCEMENTS APPLIED (March 28, 2026):**
> - **P1:** Cockpit broadcast — `dial-rotate` every 5 epochs, `celebration-start` at 50/75/90% accuracy + training complete
> - **P2:** NeuralBuilder already had `useNetworkAudio` — cockpit broadcast is the primary enhancement

**Date:** March 4, 2026 | **GCUD:** V9 | **Vision:** Laboratory Control Station
**Source:** STAGE6C v3-FINAL Part B + v2 base + v2 Enhancements cross-reference
**Decision Implemented:** 6.1 (3D network integration via NeuralNetwork3D dynamic import)

---

## FILES IN THIS DOCUMENT

| Action | File | Lines |
|--------|------|-------|
| FULL REPLACEMENT | `src/components/games/NeuralBuilderGame.tsx` | ~780 |

**Prerequisites:** Stage 6C Part A v3-FINAL (NeuralNetwork3D.tsx + useNetworkAudio.ts) must be complete.
**Supersedes:** NeuralBuilderGame.tsx from STAGE6C v2 + V2 Enhancements

---

## CODE REVIEW FINDINGS & FIXES APPLIED

### CRITICAL (5 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | **~35 emoji corrupted to `■`** (PDF encoding) | All challenge data, learn cards, UI text throughout | Reconstructed all emoji as Unicode escape sequences: `\u{1F9E0}` (brain), `\u{1F522}` (digits), `\u{1F3A8}` (palette), `\u{1F537}` (diamond), `\u{1F534}`/`\u{1F7E2}`/`\u{1F535}`/`\u{1F7E1}`/`\u{1F7E3}`/`\u{1F7E0}` (color circles), `\u{2B55}`/`\u{2B1C}`/`\u{1F53A}`/`\u2B21` (shapes), `0\uFE0F\u20E3`/`3\uFE0F\u20E3`/`7\uFE0F\u20E3`/`5\uFE0F\u20E3` (keycap digits), `\u{1F4E5}`/`\u{1F9F1}`/`\u26A1`/`\u{1F3AF}` (learn cards), `\u{1F3C6}` (trophy), `\u{1F52C}` (microscope), `\u{1F517}` (link), `\u{1F4C9}` (chart), `\u2705`/`\u274C` (check/cross), `\u2713`/`\u2717` (tick/cross), `\u2726` (star), `\u2715` (x) |
| 2 | **`game.addScore()` does not exist** on gameStore | `trainNetwork()` end | Changed to `game.updateScore(Math.round(maxAcc / 10) * 5)` |
| 3 | **GameShell props `labColor`/`labName` don't exist** | Component JSX root | Changed to `worldNumber={3} worldColor="#EC4899" totalRounds={1}` matching GameShellProps interface |
| 4 | **`className` placed inside `style={{}}` object** (invalid JSX) | Chrome bezel div, LED rim div — both had `className="..."` inside `style={{}}` | Separated into distinct `className` and `style` attributes on each div |
| 5 | **`handleWeightChange` logic bug** — `return c;` inside if block (dead code) | `handleWeightChange` function | Moved `return c;` after the if block's closing brace so unmatch connections are properly returned |

### HIGH (5 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 6 | **digits `descriptionC` truncated** at "curv" | CHALLENGES[0].descriptionC | Completed: "...edges, curves, strokes). Adjust architecture to balance capacity vs. training efficiency." |
| 7 | **Train button `className` truncated** — `disable` | Build phase train button | Completed to `disabled:opacity-50` |
| 8 | **Train button inner text broken** across lines | Build phase train button JSX | Restructured as two `<span>` elements with correct content placement |
| 9 | **Node inspection panel JSX broken** — closing tags reversed | Build phase inspectedNodeData panel | Reconstructed proper nesting: each stat div contains `<p>` value then `<p>` label, properly closed |
| 10 | **Learning rate slider JSX broken** — `</span>` and `</div>` reversed | Build phase controls (Band C) | Reconstructed proper structure: `<div>` wraps `<label>`, `<input>`, and `<span>` in correct order |

### MEDIUM (3 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 11 | **`bg-spark-pink/5`** in loading fallback — no `spark-pink` in Tailwind config | NeuralNetwork3D dynamic import loading component | Changed to `bg-pink-500/5` |
| 12 | **Unused imports** — Star, Trophy, Eye, Layers, Network, BookOpen | Import statement | Removed 6 unused lucide-react imports |
| 13 | **`prediction` state declared but never read** | Component state | Removed `prediction`/`setPrediction` state and all references (v3 removed the prediction confidence bars UI from v2's drawing canvas test flow) |

### LOW (2 fixes)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 14 | **`toggleSound` not wrapped in useCallback** | Sound toggle handler | Wrapped in `useCallback` with `[soundEnabled, audio]` deps for referential stability |
| 15 | **String apostrophes** — `Let's Build!` raw in JSX | Learn phase button | Changed to `{"Let\u2019s Build!"}` JSX expression |

---

## v3 CHANGES FROM v2 (Decision 6.1)

| Aspect | v2 | v3-FINAL |
|--------|----|---------|
| Network visualization | Animated SVG with circles, lines, data flow dots | 3D rotatable NeuralNetwork3D via dynamic import |
| Welcome/Report 3D | NeuralNet3D brain orb | Removed (NeuralNetwork3D replaces all 3D) |
| Heartbeat + sparks | Drove SVG node opacity + SVG spark circles | Drive NeuralNetwork3D props (heartbeatPhase, sparkIntensity) |
| Camera interaction | None (static SVG) | OrbitControls with constrained polar angle, auto-orbit during training |
| Game logic | 6 phases, 3 challenges, 4 arch challenges | **Expanded (April 7 audit):** 8 B/C challenges + 3 Band A challenges + 8 arch tests + Band C hyperparameters + competition mode |
| Audio | useNetworkAudio hook | Identical — preserved from v2. Audio concurrency limited to 3 events (BUG-NB7 fix). |
| Age bands | B (guided), C (learning rate + loss curve) | **Expanded:** Now A/B/C. Band A: simplified "brain building" metaphor. Band C: activation function, dropout, learning rate slider, batch size. |
| Accessibility | ARIA labels on all controls | Identical — preserved from v2 |

---

## Flagship Game Audit Enhancements (April 7, 2026)

### Bug Fixes (8 total)

| ID | Severity | Fix |
|----|----------|-----|
| BUG-NB1 | CRITICAL | Training accuracy now architecture-dependent (convergence rate, noise, plateau vary with arch quality) |
| BUG-NB2 | HIGH | optimalMatch normalized by sum of optimal neurons, not totalNeurons |
| BUG-NB3 | HIGH | sparkIntensity uses raw delta before weight clamping |
| BUG-NB4 | CRITICAL | Removed duplicate inline NeuralNetwork3D — kept sceneStore registration only |
| BUG-NB5 | MEDIUM | setTimeout stored in ref, cleared on unmount |
| BUG-NB6 | MEDIUM | Heartbeat continues during training at 2.7x speed |
| BUG-NB7 | MEDIUM | Audio concurrency limited to 3 events with 400ms decay |
| BUG-NB8 | MEDIUM | Canvas cleared on challenge switch via clearCanvas() |

### Content Expansion

| Feature | Before | After |
|---------|--------|-------|
| Challenges (B/C) | 3 (Digit Reader, Color Classifier, Shape Sorter) | 8 (+Sound Recognizer, Emotion Detector, Animal Identifier, Text Classifier, Weather Predictor) |
| Band A challenges | None | 3 (Connect the Dots, Build a Simple Brain, Color Sorter) |
| Architecture tests | 4 | 8 (+Overfitter, Underfitter, Speed Demon, Memory Master) |
| Hyperparameters | 0 | 4 (activation function, dropout, learning rate, batch size) — Band C only |
| Game modes | 1 (standard) | 2 (+competition: Beat the Benchmark with bronze/silver/gold) |
| AI integration | None | useAIContent hook for "Random Challenge" generation |
| File size | ~1,531 lines | ~1,863 lines |

---

## GAME FEATURES PRESERVED FROM v2

- **6-phase flow:** welcome → learn → build → train → test → report
- **3 challenge tasks:** Digit Reader (draw mode), Color Classifier, Shape Sorter
- **4 architecture challenges:** The Minimalist, Shallow Master, Deep Thinker, Efficiency Expert
- **Training simulation:** 20 epochs, accuracy based on optimal architecture match
- **Network heartbeat:** Idle pulse wave flows input→output when not training
- **Synaptic sparks:** Flash at connection midpoints during weight changes
- **Tone.js audio:** Epoch chords (minor→major), activation pings, completion arpeggio
- **Drawing canvas:** 200×200 pointer-based canvas for digit challenge
- **Chrome bezel + LED rim:** Pink-themed with gradient background
- **22 CSS particles:** Pink ambient background
- **Loss curve (Band C):** @nivo/line ResponsiveLine showing loss + accuracy over epochs
- **Learning rate slider (Band C):** Adjustable 0.001–0.1
- **Weight slider:** Click connection in 3D → adjust weight manually
- **Node inspection:** Hover/click neuron in 3D → activation, inputs, outputs panel

---

## BUILD VALIDATION

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS (0 errors) |
| `npm run lint` | PASS (0 warnings) |
| `npm run build` | PASS |

---

## CLEANUP NOTE

After verifying v3-FINAL works correctly, delete the old v2 brain orb file if it exists:

```bash
rm src/components/3d/NeuralNet3D.tsx
```

NeuralNet3D.tsx was a decorative brain orb used in the v2 welcome/report phases. It is fully replaced by NeuralNetwork3D.tsx. No other files import NeuralNet3D.tsx.

---

## VERIFICATION CHECKLIST

### Visual Checks (v3 specific)
- [ ] 3D network renders with rotatable OrbitControls (drag to rotate)
- [ ] Neurons are glowing spheres with activation color (cold blue → hot orange)
- [ ] Connections are visible lines with weight-based thickness
- [ ] Auto-orbit activates during training, stops when idle
- [ ] Heartbeat pulse wave flows input→output when idle on build screen
- [ ] Spark flashes appear at connection midpoints during training
- [ ] Hover on neuron shows inspection panel (activation, inputs, outputs)
- [ ] Click on connection opens weight slider
- [ ] Chrome bezel frame visible with pink LED rim glow
- [ ] Pink particle background animates smoothly

### Phase Flow
- [ ] Welcome: brain emoji, topic tags, "Start Building" CTA
- [ ] Learn: 4 teaching cards (age-band adapted), "Let's Build" button
- [ ] Build: Challenge selector, layer/neuron controls, 3D network, train button
- [ ] Train: Animated progress bar, epoch counter, accuracy display, loss curve (Band C)
- [ ] Test: Drawing canvas (digit) OR item display (colors/shapes), predict button
- [ ] Report: Architecture summary, dual score rings, "What You Learned"

### V2 Enhancements (preserved)
- [ ] 4 Architecture Challenges accessible via Challenges button
- [ ] Challenge result banner (pass/fail) appears after training with constraints
- [ ] Sound toggle enables/disables Tone.js audio
- [ ] Epoch chords play during training (minor→major progression)

### Age Band Differentiation
- [ ] Band B: Standard labels, guided experience, no loss curve, no learning rate slider
- [ ] Band C: Learning rate slider, loss curve display, mathematical terminology

### Accessibility
- [ ] All buttons have aria-labels
- [ ] Challenge selector uses aria-pressed
- [ ] Drawing canvas has aria-label
- [ ] Weight slider has aria-label
- [ ] Sound toggle has aria-label
