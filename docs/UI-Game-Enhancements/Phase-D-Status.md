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
  Architect, Prompt Lab, + Lab 11): the plan says *keep R3F on desktop, add the
  2D archetype as the mobile/tablet fallback* via `useDeviceProfile` (Mobile
  Fallback Policy v6.8). This is additive (desktop untouched) but is a
  *3D/structure* change — also an approval gate in CLAUDE.md.

### 2b. Asset-pipeline track — BLOCKED on external connectors

None of these can proceed in this environment; each needs something only you can
provide:

| Track | Needs | Unblocks |
|-------|-------|----------|
| **Blender MCP** GLB assets | `ahujasid/blender-mcp` connector | Themed 3D props; closes **HS-8** procedural-pet gap |
| **Rive** mascot | the actual `public/rive/sparky.riv` file (Rive editor/animator) | Sparky reactions across all games (runtime already wired) |
| **Scenario API** | API key | Style-locked per-lab background art |
| **Figma MCP** | Figma connector + design files | App-chrome design-to-code (optional, designer-in-loop) |

### 2c. Emoji → icon/asset sweep (Ui-Creation.md)

Large and design-dependent (which icon replaces which emoji). The policy says
"replace as game art lands," so it naturally pairs with the Scenario/Rive asset
work above.

---

## 3. Recommended path (pending your go-ahead)

1. **Authorize the quiz-flagship migrations** → I migrate Bias Detective (SORT),
   Pocket Brain (REVEAL), Pet Trainer (SORT/REVEAL), Neural Builder (CONNECT) on
   the proven Wave 1–7 pattern + smoke harness. (Same risk profile as the
   completed waves; just needs the mechanic-change approval.)
2. **Decide the genuine-R3F fallback approach** → additive `useDeviceProfile`
   gate that keeps desktop R3F and renders the 2D archetype on mobile/tablet for
   Context Architect, Pixel Witness, Agent Architect, Prompt Lab, + Lab 11.
3. **Provide (or defer) the asset connectors** → Blender / Rive `.riv` /
   Scenario key / Figma. I'll resume those tracks when access exists; otherwise
   they stay documented here as backlog.
4. **Emoji sweep** → do alongside (3), or mechanically now if you prefer.

I did **not** make unilateral changes to flagship mechanics or 3D games, per the
CLAUDE.md approval gates. Reply with which of 1–4 to proceed on and I'll execute.
