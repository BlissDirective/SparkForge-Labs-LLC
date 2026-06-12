# Fable Frontend Enhancement Plan — SparkForge UI & 42-Game Redesign

> **Date:** 2026-06-12
> **Branch:** `setup-sparkforge-dev`
> **Companion doc:** `fable-audit-v1.md` (audit findings referenced throughout)
> **Goal:** Make the app — and especially the 42 games — visually stunning and unique for kids ages 6–16, and establish an MCP-/API-driven tooling loop so Claude can design, build, and iterate on game visuals directly.

---

## 1. Diagnosis: Why the Games Feel Lackluster

The audit found the game library is **bimodal**: ~6 flagship games (800–2,400 lines, 3D environments, rich phases) and ~28 standard games that are thin wrappers around `QuizLevelRenderer` — timer, score, one explanation toast. Three root causes:

1. **Quiz-mechanic dominance.** ~18 games are pure multiple-choice. No drag, build, draw, steer, or explore. A kid "consumes" a level in 90 seconds.
2. **Flat feedback loop.** A correct answer = a toast and a number incrementing. Compare Duolingo: confetti, chime, streak flame, character reaction. SparkForge built the machinery for this (GameJuiceEngine is wired into GameShell via JuiceProvider) but games barely trigger it, and the **GameMechanicKit components (DragDropZone, ConnectionBoard, SortingTray, ChoiceCardDeck) have zero game imports** — built in Phase 6, used by nothing.
3. **No living characters.** Sparky exists as a static/3D avatar, but in-game there is no reactive character: nothing celebrates, sulks, or cheers *in response to play*. For ages 6–16, a reactive character is the single highest-leverage delight mechanism.

The DOM+Tailwind+Motion stack that renders the games is excellent for *app UI* but structurally limits *game feel*: no particle systems, no shader effects, no physics, no sprite animation, no camera. The fix is not "more CSS polish" — it's giving games a real rendering layer.

---

## 2. Platform & MCP Research (June 2026)

Research question: which game-design/rendering platforms can integrate with Claude Code via MCP or API so Claude can help design and iterate on game UI?

### 2.1 The key insight up front

**Engine-editor MCPs are remote controls for desktop apps** — they require the editor running, give lossy feedback, and are brittle. **Code-first libraries need no MCP at all**, because Claude Code editing TypeScript directly is the highest-bandwidth integration that exists. The strongest stack is therefore: code-first rendering libraries (Pixi/Phaser/R3F) + a small set of *production-grade* MCPs for assets and visual QA (Playwright, Blender, Figma, Rive).

### 2.2 Candidates evaluated

| Platform | MCP status (mid-2026) | Web embed cost | Verdict for SparkForge |
|---|---|---|---|
| **PixiJS v8 + @pixi/react** | None official — none needed (code-first) | Small, tree-shakeable, no iframe | ✅ **Primary** — rebuilt exclusively for React 19; JSX components (`<pixiSprite>`) like R3F; Zustand works inside the canvas; WebGL+WebGPU; MIT |
| **Phaser 4** | ✅ Official `phaserjs/editor-mcp-server` (40+ tools), but tied to the paid Phaser Editor v5 desktop app | Modest — v4 is ESM + tree-shakeable (unlike v3's ~1 MB monolith) | ✅ **Selective** — for the 5–10 games needing physics/tilemaps/cameras; official Next.js EventBus template exists |
| **Rive** | ✅ Official Editor MCP in Early Access (expect flakiness) | Tiny `.riv` files, WASM renderer, MIT React runtime | ✅ **Character/juice layer** — state-machine characters; web runtime now supports data binding (bind game state → animation) |
| **Blender** | ✅ `ahujasid/blender-mcp` (16k+ stars) — adopted as an **official Claude connector** (April 2026); Hyper3D/Hunyuan3D text→3D | n/a (asset pipeline) | ✅ **3D asset pipeline** — GLB → `public/models/` → existing R3F; finally closes the HS-8 pet-model gap |
| **Figma** | ✅ Official, mature, **bidirectional** since Feb 2026 (Claude can push UI back to Figma as editable layers) | n/a (design pipeline) | ✅ Optional — app chrome/dashboard/parent pages, if a designer is in the loop; does nothing for in-canvas visuals |
| **Playwright** | ✅ `microsoft/playwright-mcp` — most mature MCP in this list (already in this repo's MCP config) | n/a (QA loop) | ✅ **The iteration loop** — screenshot → critique → fix; see canvas caveat §2.3 |
| Godot | `Coding-Solo/godot-mcp` works, but… | ❌ ~40 MB wasm (~5 MB Brotli) *before content*, slow first compile, needs COOP/COEP headers | ❌ Skip — ×42 games on school Chromebooks is a non-starter |
| Unity | Most mature engine MCPs (CoplayDev unity-mcp, official Unity AI Assistant MCP) | ❌ ~7.7 MB Brotli empty 2D build, iframe silos, no React/Zustand integration | ❌ Skip — overkill for 2D mini-games |
| Spline | ❌ Community MCP (`aydinfer/spline-mcp-server`) is **archived/non-functional** — Spline has no public REST API behind it | Heavy runtime | ❌ Skip — and note: `@splinetool/*` is already an unused dep in package.json (audit §4.2); remove it |
| Kaplay / Excalibur.js | No MCP story | Light | ➖ Fine engines, but no advantage over Pixi/Phaser at this scale |
| Babylon.js | ✅ Official MCP server suite shipped 2026 | Moderate | ❌ Skip — would fork the 3D stack against R3F |
| Construct 3 / GDevelop | No meaningful Claude integration (editor-centric event sheets, Claude-opaque) | iframe embeds | ❌ Skip |
| Theatre.js | Dormant (0.7 stalled) | — | ❌ Avoid; prefer GSAP timelines (already in stack) |
| Lottie | ✅ Official Lottie Creator MCP | Tiny | ➖ UI flourishes only; Rive is strictly better for *interactive* characters |
| AI asset gen (Meshy / Tripo / Scenario) | Meshy has community MCP + API; Scenario API trains style-consistent models | n/a | ✅ **Scenario** for style-consistent 2D sprite sets across all 42 games; Meshy/Tripo → Blender → GLB for 3D |

### 2.3 The canvas caveat for the Playwright loop

Playwright MCP's accessibility-tree snapshots see **nothing** inside a Pixi/Phaser/R3F canvas. For game QA the loop must be: screenshot mode for visual judgment **plus** a dev-only instrumentation hook — expose game state on `window.__SPARKFORGE_GAME__` in dev builds so Claude can assert state textually while judging visuals from screenshots. This extends the SSIM ≥ 0.96 checkpoint discipline already in CLAUDE.md to game scenes.

### 2.4 Recommended stack (summary)

```
RENDERING        PixiJS v8 + @pixi/react  ← primary, in-place game upgrades
                 Phaser 4                 ← 5–10 physics/tilemap games (EventBus bridge)
                 R3F (existing)           ← cockpit shell + flagship 3D (unchanged)

CHARACTERS/JUICE Rive (React runtime + data binding; Editor MCP opportunistically)

ASSETS           Blender MCP (+ Meshy/Hyper3D text→3D) → GLB → R3F
                 Scenario API → style-consistent 2D sprite sets
                 Lottie Creator MCP → UI micro-animations (optional)

DESIGN-TO-CODE   Figma MCP (app chrome only, designer-in-loop, optional)

ITERATION LOOP   Playwright MCP screenshots + window.__SPARKFORGE_GAME__ dev hook
```

Why this wins for *this* codebase specifically: @pixi/react v8 is React-19-exclusive and works exactly like R3F (which the team already knows); Zustand stores, GameShell phases (`welcome → learn → play → complete`), `game.completeGame()`, and the lazy game-loader factory all survive untouched; migration is per-game and incremental; everything is MIT; no iframes; WebGPU-capable (consistent with the Tech Quality Mandate).

---

## 3. The Design Vision: "Every Lab Is a World"

Frost-Prismatic is a strong *app* identity. The games' problem is they all look like the app instead of like *games*. The vision:

- **App chrome stays Frost-Prismatic** (chrome bezels, glassmorphism, neon) — it's the "control station."
- **Each of the 11 labs gets a visual world identity** that its games inhabit: distinct palette (seeded from the existing `labColors.ts`), background art set (Scenario-generated, style-locked), particle signature, and ambient soundscape (Tone.js is already in the stack). Entering a game should feel like the cockpit's wormhole transition *delivered you somewhere*.
- **One mascot system, many reactions.** A Rive-built Sparky (and/or per-lab companion creatures) with a state machine: idle → thinking → celebrate (3 intensity tiers) → encourage-after-miss → combo-hype. Bound directly to game state via Rive data binding. This single asset upgrades all 42 games at once because it mounts in `GameShell`.
- **Age-band differentiated feedback** (audit §3.x): band A (6–9) gets maximal celebration — confetti, mascot dance, big numbers; band C (13–16) gets speed metrics, streak multipliers, leaderboard deltas. Same engine, different presentation config.
- **No emojis** — this plan is fully aligned with `Ui-Creation.md`: Scenario/Rive/Blender assets replace the 1,464 emoji occurrences as game art lands.

---

## 4. Execution Plan

### Phase A — Foundations (week 1–2)

1. **Wire what exists first** (near-zero cost, audit §3.2): retrofit GameMechanicKit components into standard games — every quiz game gets at least one non-quiz level type (SortingTray or ConnectionBoard round); trigger GameJuiceEngine combo/milestone events from the shared renderers so all 28 standard games inherit juice at once.
2. **Shared-renderer upgrades**: ARIA + keyboard nav + 44 px touch targets in `QuizLevelRenderer`/`GameLevelSystem`/`GameVisualKit` (fixes ~28 games in 3 files).
3. **Install the loop**: add `window.__SPARKFORGE_GAME__` dev hook to GameShell; establish the Playwright screenshot → critique → fix workflow with per-lab reference boards.
4. **Add deps**: `pixi.js@^8`, `@pixi/react@^8`, `@rive-app/react-canvas`. Remove `@splinetool/*` (dead, audit §4.2).

### Phase B — Prove the pattern on one game (week 2–3)

Pick **one standard game** (suggest: SortToyBox or TreatTrainer) and rebuild its `play` phase as a Pixi scene inside the existing GameShell:

- Pixi stage mounted via `@pixi/react`, reading the existing Zustand game store with selectors.
- Particle effects, sprite animation, screen-shake (Frost-Prismatic glow filters — Pixi's displacement/bloom filters are on-brand).
- Rive mascot docked in the shell reacting to right/wrong/combo.
- Scenario-generated sprite set for the lab's world identity.
- Measure: bundle delta through the existing perf tooling, LCP, and a kid-facing "fun" pass at the HS-5-style visual checkpoint.

**Exit criteria:** game is measurably more fun, bundle cost per game ≤ ~150 kB gzip incremental, 60 fps on a school Chromebook.

### Phase C — Templatize and roll out (week 3–8)

- Extract the Phase-B result into a **`PixiGameStage` shared component** + 3–4 reusable scene archetypes: *Sort/Drag world*, *Build/Connect board*, *Reaction/Timing arena*, *Explore/Reveal map*.
- Migrate standard games lab-by-lab (the existing stage-doc playbook cadence), each game choosing an archetype + lab world skin. Target: ~4–6 games/week once the template is stable.
- Phaser 4 (EventBus template) only for the handful of games that genuinely need physics/tilemaps (e.g., TreatTrainer mazes, any platformer-style concepts in Lab 11's Stage 11D/11E/11G pipeline).

### Phase D — Flagships & app chrome (week 8+)

- Flagship games keep their R3F identity; upgrade selectively with Blender-MCP-generated themed assets (pets, props, environments) — this closes the long-standing HS-8 procedural-pet fallback.
- App UI pass via Figma MCP if/when design files exist; otherwise continue the SF* design-system consolidation (audit §3.7) and finish the emoji → icon/asset sweep per `Ui-Creation.md`.

### MCP servers to add to the project config

| Server | Purpose | Priority |
|---|---|---|
| `microsoft/playwright-mcp` | Visual iteration loop (already present in this environment) | Now |
| `ahujasid/blender-mcp` | 3D asset generation → GLB → R3F | Phase B/D |
| Figma official MCP | Design-to-code for app chrome | Optional |
| Rive Editor MCP (Early Access) | Mascot/state-machine authoring assist | Opportunistic — human animator in loop |
| Phaser Editor MCP | Scene layout, only if Phaser volume grows | Later |

---

## 5. Cost & Risk Notes (informational, per Tech Quality Mandate)

- **Licensing:** Pixi, Phaser framework, Rive runtimes, Blender — all free/MIT/GPL-tool. Paid: Phaser Editor (flexible 1/3/6-month licenses, optional), Rive editor ($9–32/mo), Scenario API (usage-based), Figma seat (existing?), Meshy (usage-based).
- **Bundle:** Pixi adds a one-time shared chunk (~100–150 kB gz with tree-shaking); per-game scenes are small. Phaser 4 per-game cost is modest with ESM tree-shaking. Rive runtime ~80 kB + tiny `.riv` assets. All games stay behind the existing lazy loader, so the dashboard/first-load 230 kB is unaffected.
- **Risks:** (1) Rive Editor MCP is Early Access — treat as an accelerator, never a dependency; (2) canvas-opaque QA — mitigated by the dev state hook; (3) two rendering paradigms in games during migration — mitigated by the GameShell boundary: shell is always React DOM, `play` phase owns its canvas; (4) team WebGL debugging skills — Pixi's React devtools story is good, and the archetype template concentrates the hard parts in one place.

---

## 6. TL;DR

1. The games feel flat because half of them are quiz templates with one toast, the juice/mechanics infrastructure they need already exists unused, and there's no reactive character. Fix the wiring first — it's nearly free.
2. Give games a real rendering layer: **PixiJS v8 + @pixi/react** (primary), **Phaser 4** (selective), keeping GameShell/Zustand/loader architecture intact.
3. Add a **Rive mascot with state-machine reactions** bound to game state — the single highest-leverage delight investment for ages 6–16.
4. Build the asset pipeline around **production-grade MCPs only**: Playwright (visual loop), Blender (3D), Figma (app UI), plus Scenario API for style-consistent 2D art. Skip Godot/Unity/Spline/Construct — wrong tool or broken MCP.
5. Prove it on one game, templatize into 3–4 scene archetypes, then roll out lab-by-lab with Playwright-screenshot checkpoints.

*Generated by Claude Code (Fable series). Research current as of 2026-06-12; MCP maturity ratings reflect hands-on community status, not directory listings.*
