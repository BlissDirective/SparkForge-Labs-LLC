# Fable Frontend Enhancement — Phase D Status & Decision Plan

> **Date:** 2026-06-28 · **Owner doc:** `Fable-Frontend-Enhancement.md`
> **Status:** Phases A–C COMPLETE & shipped to `setup-sparkforge-dev`. Phase D
> (Flagships & app chrome) is the remaining phase and needs authoritative
> direction — it changes flagship game mechanics (CLAUDE.md approval gate) and
> depends on external asset connectors not available in this environment.

---

## 1. Where the plan stands

| Phase | Status |
|-------|--------|
| **A — Foundations** | ✅ Complete (juice retrofit, shared-renderer a11y, dev hook + Playwright loop **green 26/26**, deps in, `@splinetool/*` removed) |
| **B — Prove on one game** | ✅ Complete (Sort Toy Box) |
| **C — Templatize & roll out** | ✅ Complete (25 standard/fl-lite games + Phaser maze; canonical re-skin; full smoke sweep) |
| **D — Flagships & app chrome** | ⏳ **Needs direction** (this doc) |

---

## 2. Phase D breakdown

### 2a. Code track — flagship play surfaces

A key finding: **GameShell renders no per-game 3D** (the 3D cockpit was removed in
the v2 redesign). A flagship only has an R3F scene if its **own file** imports
one. Actual state of the flagship files:

| Game | Map intent | In-file R3F? | Reality |
|------|-----------|--------------|---------|
| Bias Detective | R3F + SORT fallback | **No** (quiz only, 73L) | un-migrated quiz |
| Pocket Brain | R3F + REVEAL fallback | **No** (104L) | un-migrated |
| Pet Trainer | R3F (Rive pet) | **No** (107L) | un-migrated |
| Neural Builder | R3F + CONNECT fallback | **No** (439L, custom LEVELS) | rich custom, no R3F |
| Context Architect | R3F + SORT fallback | **Yes** (2 imports, 182L) | genuine R3F |
| Pixel Witness | R3F + REVEAL fallback | **Yes** (1 import, 168L) | genuine R3F |
| Agent Architect | R3F + CONNECT fallback | **Yes** (6 imports, 1356L) | genuine R3F |
| Prompt Lab | R3F | **Yes** (6 imports, 2409L) | genuine R3F (flagship of flagships) |
| Lab 11: Agent Atelier / MCP Lab / Glass Box / Harness Forge | R3F + fallback | TBD | files exist; not yet audited |

Two distinct sub-tracks fall out of this:

- **(i) Quiz/levels "flagships" with no R3F** (Bias Detective, Pocket Brain, Pet
  Trainer, Neural Builder): these can be migrated to their mapped archetype
  exactly like the Wave 1–7 standard games — low risk, no R3F to preserve.
  **BUT** this changes their game mechanic, which CLAUDE.md lists under
  *REQUIRES HUMAN APPROVAL* ("Feature additions/removals: changing game
  mechanics"). The Wave 1–7 migrations were each explicitly authorized; the
  flagship-tier games were not.
- **(ii) Genuine-R3F flagships** (Context Architect, Pixel Witness, Agent
  Architect, Prompt Lab, + Lab 11): **revised direction (owner, 2026-06-28)** —
  do **not** ship separate 2D games for low-end devices. Instead render the
  *same R3F scene, fidelity-scaled* along a quality ladder, with the Pixi 2D
  archetype reserved as the true **FLOOR** (no-WebGL2 devices) + the a11y path.
  Full design + implementation plan: **`Adaptive-Quality-Strategy.md`**.

### 2b. Asset-pipeline track — BLOCKED on external connectors

None of these can proceed in this environment; each needs something only you can
provide. **Full acquisition + setup steps (accounts, keys, `.mcp.json`
entries): `Asset-Pipeline-Setup.md`.**

| Track | Needs | Unblocks |
|-------|-------|----------|
| **Blender MCP** GLB assets | Blender desktop + `ahujasid/blender-mcp` (local Claude Code); optional Hyper3D/Meshy/Tripo key | Themed 3D props; closes **HS-8** procedural-pet gap |
| **Rive** mascot | the actual `public/rive/sparky.riv` file (Rive account/editor) | Sparky reactions across all games (runtime already wired) |
| **Scenario API** | account + `SCENARIO_API_KEY` + a trained style model | Style-locked per-lab background art + emoji-replacement icons |
| **Figma MCP** | Figma Dev-Mode seat (desktop) or a personal-access-token via framelink | App-chrome design-to-code (optional, designer-in-loop) |

Note the **local-only caveat**: Blender/Figma/Rive-editor MCPs remote-control a
desktop app and only work in a **local** Claude Code session, not the web/remote
sandbox. Scenario/Meshy/Tripo are key-based and run anywhere. See the setup doc.

### 2c. Emoji → icon/asset sweep (Ui-Creation.md)

~1,464 occurrences, split into three buckets — UI affordances → **lucide** (no
new assets), decorative → **Scenario** style-locked icons, characters →
**Rive/Blender**. Repeatable inventory→map→generate→swap→verify process and a
Scenario prompt template are documented in **`Asset-Pipeline-Setup.md` §6**.

---

## 3. Recommended path (pending your go-ahead)

1. **Authorize the quiz-flagship migrations** → I migrate Bias Detective (SORT),
   Pocket Brain (REVEAL), Pet Trainer (SORT/REVEAL), Neural Builder (CONNECT) on
   the proven Wave 1–7 pattern + smoke harness. (Same risk profile as the
   completed waves; just needs the mechanic-change approval.)
2. **Adaptive quality (revised)** → build `useQualityTier()` + drei
   `PerformanceMonitor` auto-scaling so the *same* R3F scene optimizes for
   low-end devices, with the 2D archetype only as the no-WebGL2 FLOOR. Plan in
   `Adaptive-Quality-Strategy.md`. Suggested order: cockpit first (proof), then
   the genuine-R3F flagships.
3. **Provide (or defer) the asset connectors** → Blender / Rive `.riv` /
   Scenario key / Figma — acquisition steps in `Asset-Pipeline-Setup.md`. Note
   Blender/Figma/Rive-editor MCPs are local-Claude-Code-only; Scenario/Meshy/
   Tripo run anywhere with a key.
4. **Emoji sweep** → UI bucket (lucide) can start now with no assets; decorative/
   character buckets pair with Scenario/Rive once keys/assets exist.

I did **not** make unilateral changes to flagship mechanics or 3D games, per the
CLAUDE.md approval gates. Reply with which of 1–4 to proceed on and I'll execute.
