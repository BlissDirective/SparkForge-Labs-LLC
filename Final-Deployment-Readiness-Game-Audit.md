# SparkForge — Final Deployment-Readiness Game Audit

> **Version:** 1.0 · **Date:** May 3, 2026 · **Auditor of record:** Claude Code (Opus 4.7)
> **Scope:** All 42 deployable games (35 prior + 7 Stage-11 flagships) plus every cross-cutting surface required for a paid public launch — UI, UX, design, content, auth, database, compliance, performance, accessibility (general + desktop vs mobile), deployment, and gameplay enhancement.
> **Branch:** `claude/game-deployment-audit-uebBB`
> **Supersedes (in part):** `Final-Audit_04-15-2026.md` Phase 5 carry-over items; all earlier per-tier game audits remain reference inputs.
> **Resumable:** This document is structured so any future session can pick up at the next un-checked sub-phase without re-reading prior turns.

---

## 0. HOW TO USE THIS DOCUMENT

This file is **both** the audit findings ledger **and** the multi-session execution playbook. It is the source-of-truth for every deployment-readiness item between today and the launch tag.

### 0.1 Document layout

| Block | Purpose |
|---|---|
| §1 Operating Rules | The hard rules every session must obey before touching code. **Read first.** |
| §2 Reference Sources | Top-10 game-dev repos, design canon, audit-agent prior art, regulatory citations. |
| §3 Game Matrix | The 42-game grid. Updated each phase. |
| §4 Phase 0 → 12 | The audit + remediation phases. Each phase has sub-phases that can be executed in separate sessions. |
| §5 Per-Game Findings Ledger | One row per game, populated as Phase 1F runs. |
| §6 Session Log | Append-only. Each session writes a turn summary here so the next session can resume cold. |
| §7 Glossary & Appendices | Acronyms, severity table, Frost-Prismatic token map, agent prompt templates. |

### 0.2 Severity scale (used everywhere)

| Level | Symbol | Meaning | Action |
|---|---|---|---|
| Critical | 🔴 P0 | Crash · auth bypass · COPPA breach · launch-blocking | Fix this session |
| High | 🟠 P1 | Broken feature · WCAG-A fail · data-loss risk · payments fail | Fix before launch |
| Medium | 🟡 P2 | Polish · perf · partial implementation · WCAG-AA gap | Fix in first patch window |
| Low | 🔵 P3 | Tech debt · minor a11y · convention drift | Backlog after launch |
| Enhancement | 🟢 ENH | Net-new uplift, not a bug | Deferred to enhancement phase |

### 0.3 Phase status legend

`⬜ Not started` · `🟦 In progress` · `🟪 In review` · `✅ Complete` · `⏸ Paused (blocker logged)` · `🚫 Cancelled (with rationale)`

### 0.4 Table of contents

- §1 [Operating Rules — read every session](#1-operating-rules--read-every-session)
- §2 [Reference Sources & External Canon](#2-reference-sources--external-canon)
- §3 [The 42-Game Matrix](#3-the-42-game-matrix)
- §4 Audit & Remediation Phases
  - [Phase 0 — Bootstrap & Baseline](#phase-0--bootstrap--baseline)
  - [Phase 1 — Game Inventory & Code Health](#phase-1--game-inventory--code-health)
  - [Phase 2 — UI & Design System](#phase-2--ui--design-system)
  - [Phase 3 — UX & Game Loop](#phase-3--ux--game-loop)
  - [Phase 4 — Accessibility (General + Desktop vs Mobile)](#phase-4--accessibility-general--desktop-vs-mobile)
  - [Phase 5 — Content & Pedagogy](#phase-5--content--pedagogy)
  - [Phase 6 — Auth & Authorization](#phase-6--auth--authorization)
  - [Phase 7 — Database & Backend](#phase-7--database--backend)
  - [Phase 8 — Compliance (COPPA · FERPA · GDPR-K · App Stores)](#phase-8--compliance)
  - [Phase 9 — Performance & 3D Optimization](#phase-9--performance--3d-optimization)
  - [Phase 10 — Game Enhancement Showcase](#phase-10--game-enhancement-showcase)
  - [Phase 11 — Deployment & Operations](#phase-11--deployment--operations)
  - [Phase 12 — Sign-off & Launch](#phase-12--sign-off--launch)
- §5 [Per-Game Findings Ledger](#5-per-game-findings-ledger)
- §6 [Session Log (append-only)](#6-session-log)
- §7 [Glossary & Appendices](#7-glossary--appendices)

---

## 1. OPERATING RULES — read every session

These rules are **non-negotiable** for every session that touches this audit. They are the literal terms-of-engagement the user has set and supersede default assistant behaviour wherever they conflict.

### 1.1 The Three-Options Rule (mandatory)

For every conflict, design choice, or remediation question that requires a decision, present the user with **at least three selectable options** plus a recommendation. Use this exact shape:

```
─────────────────────────────────────
[FINDING-ID] — short title
Severity: 🔴/🟠/🟡/🔵/🟢

Option 1 — Min Effort
  Scope: …
  Risks: …
  Benefits: …

Option 2 — Medium Effort
  Scope: …
  Risks: …
  Benefits: …

Option 3 — Max Effort
  Scope: …
  Risks: …
  Benefits: …

Recommendation: Option N — because …
─────────────────────────────────────
```

Where useful, add **Option 4 — Alternative architecture** when a different approach (not just more effort) is on the table. Never present fewer than 3.

### 1.2 Acknowledge-then-build

After the user makes a selection, **echo back the locked choice** (option letter, scope, files likely touched) before writing or modifying any code. If the user's reply is ambiguous, ask once more with a tightened option set rather than guessing.

### 1.3 Agent usage

- Use sub-agents **only for tasks too large to fit in a single session safely** (e.g. parallel per-game audits, or whole-codebase grep + summarise jobs).
- After spawning an agent, **track its status**. If it has not produced output for the expected duration, treat it as timed-out and complete the work yourself.
- After every agent run, **audit the agent's output** before acting on it. Do not propagate agent claims into the document until verified against the actual files.
- Prefer the `Explore` agent for read-only search; `general-purpose` for multi-step research; never spawn an agent for a job a single tool call can answer.

### 1.4 Task decomposition

- Every phase has sub-phases. Every sub-phase that touches more than ~3 files must be broken into named sub-tasks before executing.
- Use `TodoWrite` to track sub-tasks and mark them complete one at a time.
- A sub-task is complete only when (a) code is written, (b) build/typecheck/lint pass, (c) the change is committed.

### 1.5 Build & verify rhythm

For every code-modifying sub-task:

1. `npm run dev` is left running in the background (one instance per session) so live-route checks are immediate.
2. After the change is made: `npm run build` (full Next.js build) **must** pass.
3. If the change touches TypeScript types, run `npx tsc --noEmit`.
4. If the change touches game logic or shared infrastructure, run the relevant Vitest suite (`npx vitest run <pattern>`).
5. UI/UX changes require a quick manual sanity in the running dev server before commit.

If the build fails twice in a row, escalate to a HARD STOP per CLAUDE.md §2.

### 1.6 Iteration & self-review

After a sub-task is "done":

1. Re-read the diff yourself before committing.
2. Question at least one decision in the change ("could this be simpler / more robust / closer to a referenced repo's pattern?").
3. Only after that loop converges to "no obvious improvement" do you commit.

This is the explicit "iterate until 100% flawless" rule — apply it per sub-task, not per phase.

### 1.7 Git rhythm

- **Commit after each sub-task** with a message of the shape `phase-N.x: <short summary>`.
- **Push to `claude/game-deployment-audit-uebBB`** after the **last sub-task of a phase** (single push per phase). Use `git push -u origin claude/game-deployment-audit-uebBB` with the standard 4-attempt exponential backoff (2s/4s/8s/16s) on network errors.
- **Never** force-push, amend a pushed commit, or rebase a published commit on this branch without explicit user approval.

### 1.8 Source-doc update at end of each phase

When a phase finishes (status `✅ Complete`), append a turn summary to §6 Session Log with:

- Date, session id, branch.
- Sub-phases completed.
- Findings opened, options presented, options selected, fixes shipped.
- Outstanding follow-ups + the next phase entry-point.
- Files materially changed.

This is the only required write to this document at end-of-session, but the per-finding ledger (§5) and per-phase status grid (§4) also stay current as you go.

### 1.9 When to ask the user

Always ask, with selectable options, when:

- A choice has product, design, security, billing, compliance, or pedagogical consequences.
- Two or more reasonable paths exist and the cost difference is non-trivial.
- A change would require touching more than ~10 files.
- A change touches schema, RLS, payment routes, or auth surfaces.
- An external service must be enabled or paid for.

Do **not** ask for trivial mechanical fixes (typos, lint, unused vars, type narrowings) — auto-fix per CLAUDE.md §3.1.

### 1.10 Halt conditions

Stop and surface to the user immediately if any of these occur:

- A COPPA / FTC 2025-rule violation is suspected.
- A secret, key, or PII appears in the repo, logs, or commit history.
- A Supabase migration would alter or drop user data.
- A Stripe webhook or live-mode key would be touched.
- The audit-agent or a sub-agent reports a CRITICAL finding it cannot self-resolve.

---

## 2. REFERENCE SOURCES & EXTERNAL CANON

This audit is calibrated against the highest-rated open-source projects in browser/online game development plus the regulatory canon for kid-EdTech. Cite these by id (e.g. `[REF-3JS]`) when a finding pulls a pattern or rule from them.

### 2.1 Top-10 Online / Browser Game-Dev Repos (by GitHub stars, May 2026)

| ID | Repo | ★ Stars | What we pull from it |
|---|---|---|---|
| `REF-3JS` | [mrdoob/three.js](https://github.com/mrdoob/three.js) | ~111k | Triangle/draw-call discipline, BufferGeometry hygiene, dispose() patterns, KTX2/Draco loaders, WebGPU + TSL roadmap. |
| `REF-PIXI` | [pixijs/pixijs](https://github.com/pixijs/pixijs) | ~47k | 2D canvas perf, sprite-batching, scene-graph cleanup, asset-bundle preload. |
| `REF-PHASER` | [phaserjs/phaser](https://github.com/phaserjs/phaser) | ~39k | Browser game lifecycle, scene-state machine pattern, mobile input handling. |
| `REF-R3F` | [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | ~28k | R3F v9 idioms, `frameloop="demand"`, `<Suspense>` + dynamic-import discipline, official perf-pitfalls list. |
| `REF-BJS` | [BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js) | ~23k | Asset-pipeline patterns, accessibility for WebGL, Have-I-Been-Pwned-style production telemetry. |
| `REF-PCV` | [playcanvas/engine](https://github.com/playcanvas/engine) | ~10k | Production-grade browser-game ops, 60fps budget enforcement, save-state patterns. |
| `REF-DREI` | [pmndrs/drei](https://github.com/pmndrs/drei) | ~9k | Helper-component conventions used by SparkForge already. |
| `REF-MJS` | [liabru/matter-js](https://github.com/liabru/matter-js) | ~17k | Deterministic 2D physics fallback for non-3D games. |
| `REF-GD` | [4ian/GDevelop](https://github.com/4ian/GDevelop) | ~14k | Event-system patterns; export-to-web compliance checklist. |
| `REF-EXC` | [excaliburjs/Excalibur](https://github.com/excaliburjs/Excalibur) | ~2.3k | TypeScript-first game-engine ergonomics; named over starred for type-purity. |

### 2.2 Adjacent canon (frequently referenced)

| ID | Source | Use |
|---|---|---|
| `REF-OPEN-DESIGN` | [nexu-io/open-design](https://github.com/nexu-io/open-design) | Brand-spec extraction discipline · OKLch palette mandate · 5-dimensional pre-emit critique · honest placeholders rule · P0/P1/P2 hard gates. |
| `REF-ZUSTAND` | [pmndrs/zustand](https://github.com/pmndrs/zustand) | Selector-pattern enforcement (already used in 30+ games). |
| `REF-JOTAI` | [pmndrs/jotai](https://github.com/pmndrs/jotai) | 3D atom isolation for cockpitAtoms. |
| `REF-TQ` | [TanStack/query](https://github.com/TanStack/query) | Cache discipline, optimistic-update primitives, persist client. |
| `REF-RADIX` | [radix-ui/primitives](https://github.com/radix-ui/primitives) | A11y baseline for dialogs, menus, tooltips. |
| `REF-SHADCN` | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | Component composition + token taste. |
| `REF-WCAG22` | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Target Size (Min) 2.5.8, Focus Appearance 2.4.13, Dragging Movements 2.5.7, Consistent Help 3.2.6, Redundant Entry 3.3.7. |
| `REF-CWV` | [web.dev/vitals](https://web.dev/vitals/) | LCP ≤2.5s · INP ≤200ms · CLS ≤0.1 (75th-pct field). |
| `REF-OWASP25` | [OWASP Top 10:2025](https://owasp.org/Top10/) | A01–A10 audit map. |
| `REF-COPPA25` | [FTC COPPA 2025 Final Rule](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data) | **Compliance deadline April 22, 2026** — separate verifiable parental consent for third-party disclosures, written data-retention policy, data-minimization rule, expanded direct-notice contents. |
| `REF-COG` | [Cognosphere/Genshin FTC settlement](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-takes-action-against-cognosphere-developer-genshin-impact-deceiving) | $20M precedent for under-13 in-game purchases without parental consent — Stripe checkout flow must be audited against this. |
| `REF-UK-AADC` | [ICO Children's Code (UK Age-Appropriate Design Code)](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/) | International coverage for UK users; default-high-privacy + default-off-profiling. |

### 2.3 Internal prior-art (audit lineage)

| ID | File | Use |
|---|---|---|
| `INT-AUDIT-AGENT` | `docs/00-reference/SPARKFORGE_AUDIT_AGENT.md` | The original audit-agent prompt; severity legend; COPPA checklist seed. |
| `INT-FINAL-04-15` | `Final-Audit_04-15-2026.md` | 137-finding final pre-release pass. Resolved Phase 1–4. Phase 5 enhancement carry-over. |
| `INT-UI-04-11` | `agent-reports/UI-UX-Audit-Enhancement-04.11.2026.md` | 75-finding UI/UX scan; AUTH-01, GAME-01..04, COCK-01..02, DASH-01..02 still partially open. |
| `INT-FLAG-04-06` | `flagship-game-content-audit(04.06.2026).md` | 6 flagship games — content + 17 bugs fixed. |
| `INT-FL-LITE-04-08` | `flagship-lite-game-content-audit(04.08.2026).md` | 9 FL-Lite games — 43 bugs, ~11× content. |
| `INT-STD-04-09` | `StandardTier-game-content-audit(04.09.2026).md` | 20 Standard games — 76 bugs, AI-content infra extension. |
| `INT-COPPA` | `docs/legal/AUDIT_2_COMPLIANCE_MATRIX.md` | Active COPPA matrix; gaps live there. |
| `INT-A11Y` | `docs/legal/AUDIT_3_UX_ACCESSIBILITY.md` | Active a11y matrix. |
| `INT-CONTENT` | `docs/legal/AUDIT_1_CONTENT_COVERAGE.md` | Active content-coverage matrix. |
| `INT-DR` | `docs/DISASTER_RECOVERY.md` | PITR runbook; drill schedule. |
| `INT-CONTRAST` | `docs/UX_CONTRAST_POLICY.md` | text-white/N → /50+ sweep policy. |
| `INT-PERF` | `docs/3D_PERF_PROFILING.md` | 3D perf baselines. |

### 2.4 How to cite

When a finding's options or recommendation pulls from a referenced source, append the citation in brackets:

> *"Switch sprite layer to instanced batches `[REF-PIXI]`; r3f-perf shows draw-calls drop from 312 → 41 `[REF-3JS]`."*

This keeps every recommendation falsifiable against a known-good external pattern.

---

## 3. THE 42-GAME MATRIX

This is the canonical roster the audit walks. Source-of-truth: `src/config/gameRegistry.ts`. Lab assignments come from `src/types/index.ts` (LABS array). Status columns are filled in during the corresponding phase and updated as work proceeds.

### 3.1 Tier counts (gate)

| Tier | Count | Games |
|---|---|---|
| Flagship | **13** | pet-trainer, sort-toy-box, neural-builder, prompt-lab, agent-architect, bias-detective, agent-atelier, mcp-lab, glass-box, harness-forge, pocket-brain, context-architect, pixel-witness |
| FL-Lite | **9** | data-detective, robot-vacuum, camera-quest, chatbot-builder, emoji-decoder, code-blocks, my-first-ai-app, future-forge, ai-or-not |
| Standard | **20** | ai-spy, time-machine, human-vs-machine, treat-trainer, neuron-relay, pixel-investigator, word-predictor, token-chopper, ai-art-detective, tool-picker, data-shield, real-or-fake, ethics-courtroom, fool-the-ai, build-classifier, prediction-market, sentiment-scanner, lost-in-translation, career-explorer, api-explorer |
| **Total** | **42** | — |

> The barrel export header at `src/components/games/index.ts:1` still says *"All 35 Games"*. **Phase 1A** updates that to 42 and validates exhaustiveness.

### 3.2 Game × Phase status grid

Columns are the phases that can produce a game-scoped finding. Mark with `⬜ / 🟦 / 🟪 / ✅ / ⏸ / 🚫` per the legend in §0.3. Severity counts go into §5.

| # | Slug | Tier | P1 Code | P2 UI | P3 UX | P4 A11y | P5 Content | P9 Perf | P10 ENH | Per-game ledger |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ai-spy | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.1 |
| 2 | time-machine | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.2 |
| 3 | human-vs-machine | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.3 |
| 4 | pet-trainer | **FS** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.4 |
| 5 | sort-toy-box | **FS** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.5 |
| 6 | treat-trainer | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.6 |
| 7 | data-detective | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.7 |
| 8 | neural-builder | **FS** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.8 |
| 9 | neuron-relay | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.9 |
| 10 | pixel-investigator | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.10 |
| 11 | prompt-lab | **FS** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.11 |
| 12 | word-predictor | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.12 |
| 13 | token-chopper | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.13 |
| 14 | ai-art-detective | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.14 |
| 15 | agent-architect | **FS** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.15 |
| 16 | robot-vacuum | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.16 |
| 17 | tool-picker | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.17 |
| 18 | bias-detective | **FS** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.18 |
| 19 | data-shield | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.19 |
| 20 | real-or-fake | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.20 |
| 21 | ethics-courtroom | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.21 |
| 22 | camera-quest | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.22 |
| 23 | fool-the-ai | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.23 |
| 24 | build-classifier | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.24 |
| 25 | prediction-market | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.25 |
| 26 | sentiment-scanner | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.26 |
| 27 | chatbot-builder | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.27 |
| 28 | lost-in-translation | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.28 |
| 29 | emoji-decoder | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.29 |
| 30 | code-blocks | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.30 |
| 31 | career-explorer | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.31 |
| 32 | api-explorer | Std | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.32 |
| 33 | my-first-ai-app | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.33 |
| 34 | future-forge | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.34 |
| 35 | ai-or-not | FL-L | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.35 |
| 36 | agent-atelier | **FS-11A** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.36 |
| 37 | mcp-lab | **FS-11B** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.37 |
| 38 | glass-box | **FS-11C** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.38 |
| 39 | harness-forge | **FS-11D** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.39 |
| 40 | pocket-brain | **FS-11E** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.40 |
| 41 | context-architect | **FS-11F** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.41 |
| 42 | pixel-witness | **FS-11G** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | §5.42 |

> **Stage 11A–G** are the new flagships from the Lab-11 *Agentic AI* adoption (CLAUDE.md v6.7, April 30 2026). They share the **Build → Equip → Constrain** narrative arc.

---

## 4. AUDIT & REMEDIATION PHASES

Each phase below is a **scoped, self-contained body of work**. Phases run mostly sequentially, but Phase 9 (Performance) and Phase 10 (Enhancements) can interleave. Phase 12 (Sign-off) is the only phase that requires every preceding phase to be `✅ Complete`.

Per-phase shape:

```
### Phase N — Title
Status:  ⬜ / 🟦 / 🟪 / ✅ / ⏸ / 🚫
Owner:   (assigned per session)
Duration estimate: (sessions)
Entry preconditions
Sub-phases (N.A, N.B, …)
Exit acceptance criteria
Cross-phase dependencies
```

---

### Phase 0 — Bootstrap & Baseline

**Status:** ⬜ Not started · **Estimate:** 1 session · **Goal:** Produce a baseline build/test/typecheck/lint snapshot before any audit-driven change is shipped, so every later phase has a known-good reference and a falsifiable delta.

#### Entry preconditions

- Branch `claude/game-deployment-audit-uebBB` checked out and clean.
- `.env.local` populated for at least: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (test), `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- `node --version` ≥ 20.

#### Sub-phases

**0.A — Environment & repo sanity**

- `git status` clean · `git pull --rebase=false origin claude/game-deployment-audit-uebBB`
- `node --version` · `npm --version` · capture in §6 session log.
- `npm install --no-audit --no-fund` (only if `package-lock.json` changed since last session).
- `ls docs/` · `ls supabase/migrations` · `ls sql/` to confirm new files since `Final-Audit_04-15-2026.md` are catalogued.

**0.B — Static analysis baseline**

| Step | Command | Pass criterion |
|---|---|---|
| Type-check | `npx tsc --noEmit 2>&1 \| tee /tmp/tsc-baseline.txt` | 0 errors. If >0, lift them into Phase 1.A as findings before proceeding. |
| Lint | `npx eslint "src/**/*.{ts,tsx}" --format=stylish 2>&1 \| tee /tmp/eslint-baseline.txt` | 0 errors. Warnings allowed; logged. |
| Format check | `npx prettier --check "src/**/*.{ts,tsx,css}"` (if configured) | 0 deltas. |

**0.C — Build baseline**

- `npm run build 2>&1 | tee /tmp/build-baseline.txt`
- Capture the route table that Next.js prints (size column) into the session log — this becomes the bundle-size baseline used in Phase 9.B.
- Pass criterion: build exits 0.

**0.D — Test baseline**

| Step | Command | Pass criterion |
|---|---|---|
| Unit | `npx vitest run --reporter=basic 2>&1 \| tee /tmp/vitest-baseline.txt` | 0 failures. Skip allowed; logged. |
| Coverage spot-check | `npx vitest run --coverage` (optional) | Capture % per package as a Phase 9 reference. |
| E2E smoke | `npx playwright test --project=chromium tests/e2e/smoke.spec.ts` if it exists, else note "no smoke spec — Phase 1.D adds one". | All smoke specs green. |

**0.E — Runtime baseline**

- `npm run dev` (in the long-running background slot for the session).
- Manually open `/`, `/login`, `/home`, `/labs`, `/arcade`, `/parent`, `/profile`, `/settings`. Confirm each renders without console errors. Record any unexpected runtime warnings.
- Confirm hero animation runs to completion on first visit (skip toggle works in Settings).
- Confirm one game per tier launches: pet-trainer (FS), data-detective (FL-L), ai-spy (Std).

**0.F — Snapshot the baseline into the session log**

In §6, append a Phase 0 turn summary with:

- Commit SHA at start.
- tsc / eslint / build / vitest / playwright pass-fail counts.
- Bundle sizes (top 10 routes).
- Runtime sanity result.
- Any blockers found before audit work begins.

#### Exit acceptance criteria

- All five static/build/test commands exit 0 (or the failure list is captured into Phase 1.A as `🔴`/`🟠` findings to fix first).
- The hero → cockpit handoff plays without console errors on a fresh session.
- One game per tier completes a `welcome → learn → play → complete` cycle without throwing.
- A baseline session-log entry exists in §6.

#### What Phase 0 does **not** do

- Does not modify code (other than allowing a one-line `package.json` install if a lockfile drift existed).
- Does not open any non-trivial finding — surface bugs found here are pulled into the appropriate later phase.

---

### Phase 1 — Game Inventory & Code Health

**Status:** ⬜ Not started · **Estimate:** 3–4 sessions · **Goal:** For every one of the 42 games, verify registry truth, phase-cycle integrity, store API correctness, leak-free unmount, and shared-shell conformance. Net result: each row of §3.2 has a `P1 Code` value of `✅` or a finding linked into §5.

#### Entry preconditions

- Phase 0 `✅ Complete`.
- `tsc --noEmit` clean against `main`.

#### Sub-phases

**1.A — Registry & barrel reconciliation** *(1 session, mechanical)*

- Update `src/components/games/index.ts:1` header from "All 35 Games" → "All 42 Games".
- Confirm every `slug` in `src/config/gameRegistry.ts` has a matching component in `src/components/games/`.
- Confirm every component in `src/components/games/` is referenced by the registry (no orphan).
- Confirm every game appears in `LABS[*].games` in `src/types/index.ts` (Stage 11 games 36–42 may still be empty per CLAUDE.md v6.7 — call out as a finding if so).
- Output: `INV-001` ledger row marked `✅` or `🟡` with delta.

**1.B — Per-game phase-cycle audit** *(per-game; agent-parallelisable)*

For each of the 42 games, verify:

| Check | Pattern |
|---|---|
| `Phase` type exists | `type Phase = 'welcome' \| 'learn' \| 'play' \| 'complete'` |
| Welcome phase rendered | Conditional on `phase === 'welcome'` |
| Learn phase rendered | At minimum 3 cards (per `INT-STD-04-09`) |
| Play phase rendered | Real game logic, not stub |
| Complete phase rendered | Calls `game.completeGame()` exactly once |
| `useChildStore(s => s.activeChild?.age_band)` read | Default to `'B'` if missing |
| Age-band branching present | A/B/C content forks visible in source |
| Cleanup on unmount | All `setTimeout`/`setInterval` cleared (see 1.C) |

**Sub-task delivery model:** batches of 6 games per session × 7 batches.
- Batch 1 — games 1–6 (3 Std, 2 FS, 1 Std)
- Batch 2 — games 7–12
- Batch 3 — games 13–18
- Batch 4 — games 19–24
- Batch 5 — games 25–30
- Batch 6 — games 31–36 (incl. Stage 11A)
- Batch 7 — games 37–42 (Stage 11B–G)

Per batch: open all 6 files, run the 8 checks, write findings into §5, run `npm run build` once at end of batch, commit `phase-1.B: batch N — games X–Y`.

**1.C — `setTimeout`/`setInterval` leak sweep** *(carry-over from `INT-UI-04-11` GAME-01)*

`INT-UI-04-11` flagged 18/35 games leaking timers. Apply `useSafeTimeout` to:

1. Every `setTimeout` in a game component without a matching `clearTimeout` in cleanup.
2. Every `setInterval` ditto.
3. Every `requestAnimationFrame` chain without `cancelAnimationFrame` in cleanup.

Verification:

```bash
# Find unguarded timers in game components
rg -n "setTimeout\(|setInterval\(" src/components/games --no-heading | wc -l
# Then check that each game with hits also imports useSafeTimeout
rg -n "useSafeTimeout" src/hooks src/components/games
```

Provide options when more than 3 timers in a single game must be migrated:

```
Option 1 — Min: useSafeTimeout for setTimeout only; leave RAF chains as-is.
Option 2 — Med: useSafeTimeout + useSafeInterval; manual RAF cleanup.
Option 3 — Max: useSafeTimeout + useSafeInterval + custom useRafLoop hook centralising RAF lifecycle.
```

**1.D — Store API correctness** *(carry-over from `INT-FLAG-04-06` and superseded files)*

Verify every game uses the **current** `gameStore` API:

- `game.startGame(slug, labId)` (not `addScore` — that was the v2 superseded API).
- `game.updateScore(delta)` (not `addScore`).
- `game.advanceRound()` for multi-round games.
- `game.completeGame()` exactly once at end of `complete` phase.

Add a CI guard:

```bash
# Should match zero
rg -n "game\.addScore\(" src/components/games
```

**1.E — DifficultySelector functional wiring** *(carry-over from `INT-UI-04-11` GAME-04)*

`INT-UI-04-11` GAME-04 found `DifficultySelector` rendered in 20 Standard games but **0% functional** — decorative only. For each Standard game:

- Confirm difficulty state is read from `useGameStore` or local state.
- Confirm content (`learnCards`, `prompts`, `levels`) actually filters by difficulty.
- Confirm difficulty is persisted to `progress.difficulty` for Standard tier.

Three-Options scaffold for the gap:

```
Option 1 — Min effort: filter learn cards by difficulty in 5 highest-traffic Std games (ai-spy, time-machine, real-or-fake, sentiment-scanner, ethics-courtroom). Other 15 stay decorative; flagged in `KNOWN_LIMITATIONS.md`.
Option 2 — Medium effort: wire all 20 Std games. Each game's content gets a `difficulty` field; the renderer filters by selected level. Persist to `progress.difficulty`.
Option 3 — Max effort: Option 2 + DifficultySelector becomes a true *adaptive* system that auto-tunes based on the player's last 3 sessions (logistic regression on accuracy + time).
Recommendation: Option 2 — closes the false-promise UX without committing to ML.
```

**1.F — GameShell phase enforcement** *(carry-over from `INT-UI-04-11` GAME-02)*

`INT-UI-04-11` GAME-02: `GameShell` does not enforce phase ordering. Add a tiny FSM guard:

- `welcome → learn` allowed.
- `learn → play` allowed.
- `play → complete` allowed.
- Backward jumps allowed only via explicit `onExit` (used by quit-confirm).
- `completeGame()` rejects if current phase is not `play`.

Three-Options scaffold:

```
Option 1 — Min: runtime warning (console.warn) only, no enforcement.
Option 2 — Med: hard guard in `gameStore.completeGame` that throws if phase ≠ play.
Option 3 — Max: full XState machine in GameShell with typed transitions; per-game machines compose into it.
```

**1.G — Per-game finding ledger fill-in**

After 1.B–F, fill §5 rows for each game with:

- `code_health` overall: ✅ / 🟡 / 🟠 / 🔴.
- Specific findings open against this game (link by id, e.g. `GAME-CRIT-PT-01`).
- Files most recently modified.

#### Agent-usage rule for Phase 1

- Phase 1.B is the **only** phase 1 sub-phase that benefits from sub-agent parallelisation. Spawn the `Explore` agent in a `medium` breadth lookup for each batch of 6 games. **Audit the agent's output** — re-open each file yourself before propagating findings into §5.
- Phases 1.A, 1.C, 1.D, 1.E, 1.F, 1.G are tractable in the main session.

#### Build & verify gates

- After every sub-phase: `npm run build`, `npx tsc --noEmit`, relevant `npx vitest run`.
- After 1.E (the largest code-modifying sub-phase): full `npm run build` + spot-check 3 games in the dev server.

#### Exit acceptance criteria

- §3.2 `P1 Code` column is `✅` or `🟡 (with linked finding)` for all 42 games.
- `rg "game\.addScore\(" src/components/games` returns nothing.
- `useSafeTimeout` adoption ≥ the count of unguarded timers identified in 1.C.
- Phase-cycle FSM ships per the user's selected option in 1.F.
- A Phase 1 turn summary lands in §6.

---

### Phase 2 — UI & Design System

**Status:** ⬜ Not started · **Estimate:** 2–3 sessions · **Goal:** Lock down the Frost-Prismatic surface — tokens, contrast, OKLCH adoption, typography, motion, glassmorphism, chrome bezels, and 3D visual fidelity — to launch quality. Inputs from `INT-UI-04-11`, `INT-CONTRAST`, and `REF-OPEN-DESIGN`.

#### Entry preconditions

- Phase 0 + Phase 1 `✅`.
- `docs/UX_CONTRAST_POLICY.md` reviewed; `text-white/N → /50+` sweep status known.

#### Sub-phases

**2.A — WCAG 2.2 AA contrast sweep**

Re-run the contrast policy across every text token and every game:

- Body text on dark surfaces: ≥ 4.5:1.
- Large text (≥18px or 14px bold) on dark: ≥ 3.0:1.
- UI component contrast (focus rings, borders): ≥ 3.0:1 against adjacent surface.
- "Decorative-only" text gets `aria-hidden="true"`, otherwise must hit AA.

Carry-overs from `INT-UI-04-11` to verify resolved or open as findings:

- `DES-01` `--text-muted` (~3.2:1) on `#0A0E16` — re-test current value.
- `DES-02` `--text-dim` (~1.8:1) — re-test.
- `COCK-01` HUD corner text 0.06 effective opacity.

Three-Options template (use per token below threshold):

```
Option 1 — Min: bump opacity/luminance to scrape AA (4.5:1).
Option 2 — Med: bump to AAA-target (7:1) + verify against all 11 lab backgrounds.
Option 3 — Max: replace token usage with `text-secondary`/`text-primary` and reserve "muted" for `aria-hidden` decoration only.
```

**2.B — OKLCH adoption gap** *(REF-OPEN-DESIGN)*

The 11 lab colors are already OKLCH-defined in `labColors.ts`, but the broader palette (`globals.css`) is HEX/RGBA. `REF-OPEN-DESIGN` and `REF-WCAG22` 2026 guidance both push OKLCH for perceptual uniformity (e.g. `#00FF88` reads brighter than `#AA66FF` at identical opacity).

```
Option 1 — Min: leave neon/text tokens as HEX; add a comment in `globals.css` noting the gap.
Option 2 — Med: convert text tokens (`--text-primary`, `--text-secondary`, `--text-muted`, `--text-dim`) to OKLCH for predictable contrast against any lab tint.
Option 3 — Max: full palette migration to OKLCH (text + neon + surface + glass) with a token-naming refactor; `tailwind.config.ts` autogen extended.
Recommendation: Option 2 — meets perceptual uniformity for the surfaces that matter without a full repaint.
```

**2.C — Frost-Prismatic compliance audit**

For every dashboard page, panel, modal, and game shell, confirm:

- Chrome bezel present where the design system requires (HS-9, HS-10).
- Glassmorphism opacity in token range (no rogue `backdrop-blur` values).
- Neon accent uses one of the 11 lab tints — not a free-form hex.
- No CSS hand-drawn SVGs, generic emoji icons, or "soft purple gradient" anti-patterns (`REF-OPEN-DESIGN`).

Walking order: `(dashboard)/home`, `(dashboard)/labs`, `(dashboard)/arcade`, `(dashboard)/parent/*`, `(dashboard)/profile`, `(dashboard)/settings`, `(dashboard)/admin/*`, `(auth)/login`, `(auth)/signup`, `(auth)/reset-password`, plus GameShell + GameHUD3D.

**2.D — Typography conformance**

Required stack: Exo 2 (display), Sora (UI), Orbitron (numerals/codes), JetBrains Mono (technical). Verify:

- `next/font` loaders present for all four.
- No `Fredoka` / `Nunito` survivors anywhere (`rg -n "Fredoka\|Nunito" src/`).
- `font-display: swap` set per-loader.
- All headings and prose fall under `text-balance` / `text-pretty` where appropriate.

**2.E — Motion & reduced-motion discipline**

Audit every Motion (ex Framer) and GSAP usage:

- Only `transform` / `opacity` animated (no layout properties).
- `prefers-reduced-motion: reduce` honoured (kill-switch in `uiStore.reducedMotion` + media query).
- `will-change` scoped to actively-animating elements only.
- Hero animation 8-phase respects skip + fast-forward (HS-9).
- ScrollTrigger / Lenis cleaned up on unmount.

**2.F — 3D visual fidelity (Mythos rule)**

Per CLAUDE.md §1 Tech-Quality Mandate, **visual checkpoints halt at SSIM ≥ 0.96**. For each route that renders 3D:

| Route | Reference render | SSIM target |
|---|---|---|
| `/` (hero) | `public/branding/IMG_4607.png` source | ≥ 0.96 |
| `/home` (cockpit spatial dashboard) | `docs/00-reference/3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` | ≥ 0.96 |
| `/labs` (holographic lab map, 11 nodes) | `src/components/3d/HolographicLabMap.tsx` | ≥ 0.96 |
| `/login` (3D crystal portal) | HS-10 spec | ≥ 0.96 |
| Each flagship game's 3D scene | per-game design doc | ≥ 0.96 |

Use `tools/visual-diff` (or the user's preferred SSIM tool) to take a baseline screenshot, then re-take after any change. If any drops below 0.96, surface a `🟡 P2` finding with the delta and the offending commit.

**2.G — Token leakage scan**

`rg` for hard-coded hex/rgba in components:

```bash
rg -n "#[0-9A-Fa-f]{6}|rgba\(" src/components --glob '!*.config.*' --glob '!**/3d/shaders/**'
```

Each hit becomes a finding; remediation = swap to a token from `tailwind.config.ts` or `cockpitDesignTokens.ts`.

#### Agent-usage rule for Phase 2

- Spawn the `Explore` agent for the **token-leakage scan** in 2.G only; review its output before propagating.
- All other sub-phases stay in the main session — too design-judgement-heavy to delegate.

#### Build & verify gates

- After 2.A and 2.B: `npm run build`, manual sanity in dev server (every dashboard route).
- After 2.E: confirm reduced-motion toggle in Settings actually flips animation off across hero, cockpit, and one flagship.
- After 2.F: SSIM screenshots filed under `docs/visual-baselines/` (create if missing).

#### Exit acceptance criteria

- 0 contrast tokens below WCAG-AA (excluding `aria-hidden` decoration).
- User has selected an OKLCH-adoption option (1/2/3) and the chosen scope is shipped.
- 0 `Fredoka`/`Nunito` survivors.
- 0 raw hex/rgba in `src/components` outside the explicit allow-list (`tailwind.config.ts`, design-token files, shader source).
- Hero / cockpit / lab-map / login / each flagship 3D scene each have a baseline SSIM ≥ 0.96 capture saved.
- Phase 2 turn summary in §6.

---

### Phase 3 — UX & Game Loop

**Status:** ⬜ Not started · **Estimate:** 2–3 sessions · **Goal:** Ship a uniformly polished onboarding-to-completion player journey across all 42 games, with consistent feedback, recoverable failure paths, and difficulty UX that actually works. Inputs from `INT-UI-04-11`, `INT-FLAG-04-06`, `INT-FL-LITE-04-08`, `INT-STD-04-09`.

#### Entry preconditions

- Phase 1 + Phase 2 `✅`.
- `react-joyride` cockpit tutorial (T11) installed and reviewed.

#### Sub-phases

**3.A — First-game journey (onboarding)**

Walk a brand-new account end-to-end:

1. Signup → COPPA consent (Phase 8 verifies legal sufficiency; Phase 3 verifies UX clarity).
2. Child-profile creation (default age band assigned).
3. Hero animation arrival → cockpit handoff.
4. `react-joyride` tutorial fires once, dismissable, persisted.
5. First game launch (recommend `ai-spy` or `pet-trainer`).
6. Welcome → learn → play → complete cycle.
7. XP popup, badge unlock if applicable, return to cockpit with celebration.

For each step, log a finding if the transition is jarring, slow (>1.5s without skeleton), or breaks the chrome-frame persistence.

**3.B — Welcome / Learn / Play / Complete uniformity**

Per `INT-STD-04-09`, all 20 Standard games have welcome→learn→play→complete now. Per `INT-FLAG-04-06`/`INT-FL-LITE-04-08`, flagship + FL-Lite games do too. **Verify this is still true** — Stage 11A–G especially.

For each game, score 0–3 on:

- Welcome: mood-set (animation, lab-themed entry).
- Learn: min 3 cards (or equivalent interactive learn surface).
- Play: phase actually playable (no decorative-only).
- Complete: celebration overlay + clear CTA back to cockpit/labs.

Total score < 8 = `🟡 P2` finding for that game, scope = "uniformity uplift". Score < 5 = `🟠 P1`.

**3.C — Empty / loading / error state coverage**

For each route:

- Empty: when there's no data yet (new user · no progress · no badges).
- Loading: skeleton or progress indicator within 200ms of route navigation.
- Error: friendly message + recovery action — never a raw stack trace.

Carry-over from `INT-UI-04-11` DASH-01: `/badges` route was an empty directory with no `page.tsx`. Verify resolved.

**3.D — Toast & feedback consistency**

- One toast system (`toastStore`) — confirm no Sonner/native browser fallback survivors.
- XP popup, streak fire, badge unlock — all use the same animation primitives.
- No double-fired toasts (track by event id).
- All async actions have a "saving…" → "saved" → "error" path through `toastStore`.

**3.E — Difficulty UX (carry-over from 1.E)**

Whatever option the user picked in Phase 1.E, this sub-phase ensures the **UX wrapper** is consistent:

- Difficulty selection persists per-child (not per-session).
- Active difficulty is visible during play (not just the welcome screen).
- Switching difficulty mid-game shows a confirm + restart-round prompt.
- Default difficulty per age band: A→easy, B→medium, C→hard.

**3.F — Save / resume / mid-game disconnect handling**

Required behaviour: if a child closes the tab mid-play, they can return to the same game and either resume or restart-from-round-N. Audit per game:

- Is play state persisted? (Most games: no — and that may be acceptable for short loops.)
- If persisted, is it scoped to the child profile (RLS + Zustand persist key includes `child.id`)?
- On reconnect (Realtime sql/024), does the in-progress XP get reconciled or duplicated?

```
Option 1 — Min: no resume; "leaving will restart this round" warning on tab-close (single-use beforeunload listener).
Option 2 — Med: resume for flagship games only (long-form). Standard/FL-Lite games stay restart-on-close.
Option 3 — Max: resume for all 42 games via per-game `useGameResume(slug, child.id)` hook backed by `progress.session_state` JSON column.
Recommendation: Option 2 — high-value for prompt-lab, agent-architect, glass-box, harness-forge; low-cost; doesn't open RLS surface for tiny games.
```

**3.G — Reward / XP / badge / streak feedback**

- Confirm XP awarded once per `completeGame()` call (idempotency on the API side — Phase 7 covers this).
- Streak increments on first daily completion only.
- Badges unlock with celebration overlay; idle badges sit silently in `/badges`.
- Daily-cap enforcement (sql/012_xp_daily_cap.sql) is observed in the UX (banner when capped).

**3.H — In-game help / hints / nudges**

Per `REF-WCAG22` 3.2.6 (Consistent Help):

- Each game exposes a "How to play" surface reachable from the play phase (not just welcome).
- For Standard tier, a one-tap hint costs no XP; flagship hints may cost partial XP — confirm consistency with the design doc.

#### Agent-usage rule for Phase 3

- Sub-agent **not recommended** for Phase 3 — judgement-heavy UX work needs the main session.

#### Build & verify gates

- After 3.B: spot-check 3 random games per tier in dev server.
- After 3.D: trigger every toast variety in the dev server and confirm visual + a11y consistency.
- After 3.F (the riskiest sub-phase): manual mid-game disconnect test on the games included in the chosen option.

#### Exit acceptance criteria

- Onboarding journey passes a fresh-account walk-through with zero `🔴`/`🟠` findings.
- All 42 games score ≥ 8/12 on the uniformity rubric.
- Empty/loading/error states cover every route.
- Difficulty UX matches the option locked in 1.E.
- Resume option is shipped per the user's selection.
- Phase 3 turn summary in §6.

---

### Phase 4 — Accessibility (General + Desktop vs Mobile)

**Status:** ⬜ Not started · **Estimate:** 3 sessions · **Goal:** WCAG 2.2 AA across the entire surface, with a **specific desktop-vs-mobile split** because SparkForge ships D3D-1 (desktop-only 3D) and a degraded-but-equivalent mobile experience. Inputs from `INT-A11Y`, `INT-UI-04-11`, `REF-WCAG22`, `REF-RADIX`.

#### Entry preconditions

- Phase 2 + Phase 3 `✅`.
- Latest `axe-core` / `@axe-core/playwright` available.

#### Sub-phases

**4.A — WCAG 2.2 AA gate (general)**

The new 2.2 success criteria most likely to fail us:

| SC | Title | Where it bites SparkForge |
|---|---|---|
| 2.4.11 | Focus Not Obscured (Min) | Sticky cockpit chrome covers focus on small viewports. |
| 2.4.13 | Focus Appearance | 3px outline + 2px offset already shipped — confirm contrast ≥ 3:1. |
| 2.5.7 | Dragging Movements | Drag-to-sort games (sort-toy-box, neural-builder) need a non-drag alternative. |
| 2.5.8 | Target Size (Min) | All interactive targets ≥ 24×24 CSS px (we want ≥ 44×44 on touch). |
| 3.2.6 | Consistent Help | Per-game help surface (Phase 3.H). |
| 3.3.7 | Redundant Entry | Don't re-ask child for info already collected. |
| 3.3.8 | Accessible Authentication | Login/Signup must not require cognitive function tests; passkey/email-link path must exist. |

Per route, run `axe-core` and triage. Tooling:

```bash
npx playwright test tests/e2e/a11y.spec.ts  # if exists
# Else add via:
#   import { injectAxe, checkA11y } from 'axe-playwright';
```

**4.B — Keyboard navigation (every game)**

Carry-over from `INT-UI-04-11`: 18 games had partial keyboard nav. For each game:

- Every interactive control reachable by Tab.
- Tab order matches visual order.
- Drag-to-sort interactions have a keyboard alternative (Up/Down to move, Space to grab, Enter to drop) — `@dnd-kit/core` already supports this; verify it's enabled per game.
- Hotkeys documented in the per-game help surface.

```
Option 1 — Min: keyboard parity for the 13 flagship games only.
Option 2 — Med: keyboard parity for all 42 games via shared `useGameKeymap` hook.
Option 3 — Max: Option 2 + global command palette (`cmdk`, already installed) for game launch + nav.
Recommendation: Option 2 — `cmdk` palette is already in Phase 5 enhancement plan.
```

**4.C — Screen-reader support**

- Every interactive element has a discernable name (label, aria-label, or aria-labelledby).
- Form errors use `aria-describedby` (carry-over from `INT-UI-04-11` AUTH-02).
- Live regions (`aria-live="polite"`) for XP popup, score updates, round-advance notifications.
- `LoginPanel3D` hidden-input proxies must have ARIA (carry-over from `INT-UI-04-11` AUTH-01).
- Sidebar `sr-only` nav must list every reachable route (carry-over from DASH-02 — was missing 8).

**4.D — Reduced-motion / reduced-transparency / high-contrast**

- `prefers-reduced-motion: reduce` → hero animation skips, particle counts drop, GSAP timelines short-circuit, parallax disabled.
- `prefers-reduced-transparency: reduce` → glassmorphism backdrop-blur replaced by opaque token surfaces.
- High-contrast mode (`globals-a11y.css`) — re-test all 42 games in the toggle.

**4.E — Desktop-only 3D and mobile-equivalent fallback**

Per CLAUDE.md D3D-1 (Desktop-First) + Tech-Quality Mandate, mobile gets a thin MP4-poster fallback for the hero, and 3D game scenes are desktop-only. Audit:

- Every 3D game has a 2D mobile fallback that delivers the same learning objective.
- Mobile users see a clear (but non-shaming) banner: "For full 3D, return on a desktop. The mobile version still earns full XP."
- Mobile fallback is **not** a degraded toy — same content, different rendering.

Per game (13 flagship + R3F-Enh from FL-Lite/Standard):

| Game | Mobile equivalent strategy |
|---|---|
| pet-trainer | Procedural orb fallback (already shipped) — confirm parity. |
| neural-builder | 2D node-graph SVG. |
| prompt-lab | UI-only (no 3D). |
| agent-architect | 2D org-chart SVG. |
| bias-detective | 2D cards with chart. |
| agent-atelier | 2D blueprint canvas. |
| mcp-lab | 2D plug-board. |
| glass-box | 2D inspector view. |
| harness-forge | 2D forge table. |
| pocket-brain | 2D quantised tile. |
| context-architect | 2D card stack. |
| pixel-witness | 2D evidence board. |
| sort-toy-box | DnD list (already mobile-capable). |

Three-Options when a fallback is missing:

```
Option 1 — Min: render a static SVG illustration with "Best on desktop" CTA.
Option 2 — Med: implement a dedicated 2D fallback that hits the same learning objective.
Option 3 — Max: render a degraded WebGL2 path (no postprocessing, lower triangle budget) for high-end mobile.
Recommendation: Option 2 — equity, parity, and no extra GPU surface area on mobile.
```

**4.F — Mobile responsiveness audit**

- Touch targets ≥ 44×44 (Apple HIG) on every game's controls.
- Viewport meta tag set; no zoom-blocking.
- Orientation: portrait primary; landscape supported with no clipped UI.
- Safe-area insets honoured (notch / home indicator).
- Sidebar collapses to bottom-bar or off-canvas on `< 768px`.

Test matrix (Playwright + emulated devices):

| Device | Mode | Critical surfaces |
|---|---|---|
| iPhone 14 | portrait | login, home, labs, ai-spy, prompt-lab |
| iPhone 14 | landscape | one flagship game |
| iPad Air | portrait | full dashboard |
| Pixel 7 | portrait | parent dashboard |
| Galaxy Fold (unfolded) | portrait | hero + cockpit handoff |

**4.G — Cognitive load / age-band differentiation**

Per `REF-UK-AADC` and `INT-A11Y`:

- A-band (7–9) UI strings ≤ Flesch-Kincaid grade 3.
- B-band (10–12) ≤ grade 5.
- C-band (13–16) ≤ grade 8.
- One primary action per screen.
- No surprise modals, no dark patterns.
- Run a readability sweep per band on every game's `learnCards` and welcome strings.

**4.H — Color-blind palette safety**

- Ensure no gameplay outcome depends on red-vs-green alone.
- Lab tints viewed under deuteranopia / protanopia / tritanopia simulators (Coblis-class) remain distinguishable.
- Add color + icon redundancy where required (e.g. "wrong" answers also get an X icon, not just red).

**4.I — Audio captions / Tone.js alternatives**

Tone.js drives in-game feedback (correct/incorrect chimes, ambient beds). Required:

- Every audio cue has a visual + haptic equivalent.
- A "mute" toggle (already in `uiStore`) silences audio without removing feedback.
- Tone.js AudioContext starts only on first user gesture (autoplay-policy compliance).

**4.J — i18n scaffolding posture**

`src/i18n/` exists. Required:

- All user-facing strings under `messages/`.
- Per-locale fallback to `en` if a key is missing.
- Number/date formatting via `Intl`.
- Tone-down (or remove) hard-coded English in any of the 42 games during this audit.

#### Agent-usage rule for Phase 4

- Phase 4.B (keyboard) and 4.F (mobile) tests can run in parallel via Playwright projects — sub-agent not needed; just split the test specs.

#### Build & verify gates

- After 4.A: `axe-core` results green or every violation has a finding id in §5.
- After 4.B: hand-keyboard pass through 6 games (one of each 3D-tier × tier).
- After 4.E: mobile-emulated screenshots for each fallback saved under `docs/visual-baselines/mobile/`.

#### Exit acceptance criteria

- 0 WCAG 2.2 AA failures in `axe-core` on every route.
- All 42 games keyboard-completable (per the locked option in 4.B).
- Reduced-motion / reduced-transparency / high-contrast all functional.
- Every desktop-only 3D scene has the agreed mobile fallback shipped.
- Touch-target audit returns 0 sub-44px controls on mobile.
- Phase 4 turn summary in §6.

---

### Phase 5 — Content & Pedagogy

**Status:** ⬜ Not started · **Estimate:** 2 sessions · **Goal:** Verify every game's content is age-appropriate, pedagogically accurate, and safely generated (where AI-assisted). Inputs from `INT-CONTENT`, `INT-FLAG-04-06`, `INT-FL-LITE-04-08`, `INT-STD-04-09`, `docs/research/01-AI-Trends-Research.md`, `docs/research/02-Flagship-Game-Concepts.md`.

#### Sub-phases

**5.A — Age-band content coverage per game**

Each game must have content for A (7–9), B (10–12), C (13–16). Verify:

- `learnCards` arrays carry an `ageBand` field or three parallel arrays.
- `prompts` / `scenarios` / `levels` differentiate vocabulary, sentence length, and concept depth per band.
- Default routing reads `useChildStore(s => s.activeChild?.age_band)` and falls back to B if missing.

For Stage 11A–G (newest), confirm A/B/C content arrays exist and aren't placeholder copies of B.

**5.B — AI-generated content review pipeline**

`src/lib/ai-content-generator.ts` and the admin queue (`/api/admin/content/*`) compose the pipeline. Verify:

- Generation is admin-triggered, never auto-fired by child interaction.
- Each generated item lands in `content_queue` with `status='pending_review'`.
- Admin dashboard surfaces them with approve/reject/edit.
- Approved items move to `content` with `published=true`.
- Rejected items are retained with reason for audit (do not silently delete).

**5.C — Anthropic prompt safety**

For every Claude API call (prompt-lab game, content agent):

- System prompt forbids unsafe categories (self-harm, violence, sexual content, identity-targeted hate).
- Output is screened by a moderation pre-filter before reaching the child (`INT-AUDIT-AGENT` C1: "Content Agent does NOT expose raw AI outputs to children without screening step").
- Per-child rate limit enforced (currently 15/game/session per `CLAUDE.md` Standard-Tier section).
- Token usage logged per child for billing and abuse detection.

**5.D — Standard-tier content expansion follow-through**

`INT-STD-04-09` planned ~3× content expansion across 20 Standard games + 60 new AI content types. Re-audit each Standard game for:

- Vocabulary expansions present (e.g. SentimentScanner 30 → 90 words).
- Multi-level systems present where planned (TreatTrainer 1 → 6 mazes).
- Difficulty tags applied to content rows.
- Scoring normalized to 10pts/correct (TimeMachine, RealOrFake fixes).

**5.E — Pedagogical accuracy (AI-trends alignment)**

Stage 11 games tie to current AI-engineering trends (`docs/research/01-AI-Trends-Research.md`). Verify:

- Agentic AI, MCP, harness engineering, on-device models, prompt context, and image-provenance topics are explained at the level a kid in the matched age band can act on.
- No factually wrong claims (esp. about LLM internals, model training, or capability limits).
- "Big-picture" framings credited or sourced where lifted from a public reference.

**5.F — Localization scaffolding**

- Confirm `messages/en.json` (and any other locale files) hold every user-facing string.
- All 42 games' welcome / learn / play / complete strings are keyed (no hardcoded English).
- `src/i18n/index.ts` falls back to `en` on missing keys.

```
Option 1 — Min: keep English-only at launch; scaffold present but no other locales.
Option 2 — Med: ship en + es (Latin American) at launch — translation pass via `npm run translate:i18n`.
Option 3 — Max: ship en + es + fr + de + pt-BR; review by native parent volunteers; per-locale legal/COPPA copy.
Recommendation: Option 1 — keep launch tight; queue Option 2 for v1.1.
```

**5.G — Profanity / age-appropriate language gate**

For prompt-lab and any free-text input, verify:

- Profanity filter applied to *child input* before relay to Claude (avoid wasting Claude tokens on filtered content; also avoid the model echoing it back).
- Profanity filter applied to *Claude output* before display.
- Filter list is deny-listed words *and* a Claude-side moderation prompt — defense in depth.
- Filter list maintained centrally (`src/lib/safety/profanity.ts` if it exists) — if not, create.

**5.H — Image / asset provenance (REF-COPPA25 alignment)**

For every image, audio file, and 3D model in `public/`:

- Source documented (own work / CC0 / licensed) in `public/ASSET_LICENSES.md`.
- No third-party tracking pixels or remote-loaded assets that aren't whitelisted in CSP.
- Children's likenesses and voices: if any user-supplied media features in a game, parental consent flow gates upload (Phase 8).

#### Build & verify gates

- After 5.B/5.C: spot-check the admin queue with one approve, one reject, one edit. Verify audit-log row created (sql/014_audit_log.sql).
- After 5.G: smoke-test prompt-lab with a deny-listed input; confirm rejection reaches the child clearly.

#### Exit acceptance criteria

- All 42 games have non-placeholder A/B/C content.
- Anthropic moderation step verified by manual probe.
- Standard-tier expansion items from `INT-STD-04-09` either shipped or filed as `🟡 P2` with target patch window.
- Localization scope locked to the user's selected option.
- Phase 5 turn summary in §6.

---

### Phase 6 — Auth & Authorization

**Status:** ⬜ Not started · **Estimate:** 2 sessions · **Goal:** Close all auth findings carried over from `INT-FINAL-04-15` and verify the demo / passkey / MFA / session-dashboard surfaces installed since that audit. Inputs from `INT-FINAL-04-15` §2, `REF-OWASP25`, Next.js CVE-2025-29927.

#### Sub-phases

**6.A — Login API token-in-body removal** *(carry-over `AUTH-CRIT-001`)*

Audit `src/app/api/auth/login/route.ts:27-30`. The fix from `INT-FINAL-04-15` should already have removed the `accessToken` from the response body. Verify, and re-test with `curl` that the response carries only `{ user: { id, email }, authenticated: true }`.

**6.B — Demo session signed-token migration** *(carry-over `AUTH-CRIT-002`)*

`INT-FINAL-04-15` Phase 5 selected the **Max** option: Supabase `signInAnonymously()` + dedicated `demo` RLS role across all 9 tables. Verify:

- `sql/019_demo_role_rls.sql` has been applied (it's in the migrations list).
- `src/app/api/auth/demo/route.ts` issues a real anon Supabase session (no static `'1'` cookie).
- `src/middleware.ts` no longer trusts `sparkforge-demo-active=1`.
- Demo banner countdown still works under the new flow.

If anything is incomplete, present three remediation options with the migration risks (e.g. existing demo cookies in the wild) per §1.1.

**6.C — Auth callback open-redirect close-out** *(carry-over `AUTH-CRIT-003`)*

`src/app/api/auth/callback/route.ts:9,15` — verify `next` is allowlisted (Option B from `INT-FINAL-04-15`). Re-test with `?next=//evil.com`, `?next=/%2F%2Fevil.com`, `?next=https://evil.com` — all should fall through to `/home`.

**6.D — Passkey / WebAuthn rollout**

`@simplewebauthn/browser@13` and `@simplewebauthn/server@13` are installed; `sql/020_passkey_credentials.sql` applied. Verify:

- Registration flow in `(dashboard)/settings` works for parents.
- Conditional-UI autofill on `/login` triggers passkey selection on supported browsers.
- Lockout/recovery path documented (`SETUP_CHECKLIST.md` mentions recovery codes — confirm `sql/023_mfa_backup_codes.sql` is applied + UX is shipped).
- No passkey allowed for **child** profiles (parent-only auth surface).

**6.E — Session dashboard**

Verify `(dashboard)/settings/sessions/page.tsx` lists active refresh tokens and supports revoke. Per `INT-FINAL-04-15` Phase 5 #4 (Min option) — no device fingerprinting, no geolocation.

**6.F — Rate-limiting all auth surfaces**

`@upstash/ratelimit` + `@upstash/redis` are installed. Verify Upstash limits applied to:

- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/reset-password`
- `/api/auth/demo`
- `/api/ai/prompt` (for prompt-lab)
- `/api/auth/passkey/*`

Per-IP and per-account limits both present (account limit prevents distributed brute-force).

**6.G — Parent vs child boundary**

- Children **cannot** create accounts directly; only parent creates child profiles.
- Children authenticate via parent-issued PIN (or shared parent session) — confirm exact mechanism in code.
- RLS enforces: `progress`, `child_badges`, `prompt_history` rows scoped to `child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())`.
- Child cannot read another child's data even within the same family.

**6.H — Next.js CVE-2025-29927 middleware-bypass check**

Confirm Next.js version is patched (≥ 14.2.25 / 15.0.4 / 15.1.7 etc.). `package.json` lists `next` — verify the installed version reads as patched.

```bash
npm ls next
```

#### Build & verify gates

- After 6.B: full Playwright run of demo-flow spec.
- After 6.D: manual passkey register + sign-in on Chrome 124+ and Safari 17+ (where available).
- After 6.F: hammer signup with `ab -n 200 -c 20` against a test account; confirm rate-limit 429s after threshold.

#### Exit acceptance criteria

- 0 carry-over CRITICAL auth findings remain open.
- Passkey + session dashboard reach a parent's hands without errors.
- Rate-limit gates verified by load test.
- `npm ls next` shows a CVE-2025-29927-patched version.
- Phase 6 turn summary in §6.

---

### Phase 7 — Database & Backend

**Status:** ⬜ Not started · **Estimate:** 2 sessions · **Goal:** RLS-airtight, performance-indexed, cron-robust, audit-logged Postgres + Supabase backend, with a tested DR runbook. Inputs from `INT-FINAL-04-15` §3, `INT-DR`, `sql/RUN_ORDER.md`, `REF-OWASP25` A01/A04, `REF-COPPA25`.

#### Sub-phases

**7.A — RLS audit on every table**

Per Supabase MCP `list_tables`, every table must have RLS enabled with policies that:

- Default-deny.
- Scope by `auth.uid()` for parent-owned rows.
- Scope by `child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())` for child-owned rows.
- Allow `published=true` rows to be public-read on `content`.

Tables added since `INT-FINAL-04-15` that need explicit verification:

- `passkey_credentials` (sql/020) — parent-only.
- `pgaudit` audit log (sql/021) — admin-read only.
- `auth_events` (sql/022) — admin-read only; child-scoped writes.
- `mfa_backup_codes` (sql/023) — parent-only.
- `realtime_progress` (sql/024) — child-scoped.
- `dunning` (sql/025) — parent-scoped.
- `parents.coppa_consent_age_band` columns (sql/026) — touched by COPPA flow only.

Run the Supabase MCP `get_advisors` after any change.

**7.B — Migration RUN_ORDER consistency**

`sql/RUN_ORDER.md` should list all migrations in apply order. Verify it matches `supabase/migrations/` and `sql/` directories, including the `_ARCHIVED` files (which must NOT be applied).

**7.C — Performance indexes**

Verify all indexes from `sql/001a_indexes.sql` and `sql/016_perf_indexes.sql` exist. Add any missing ones surfaced by `EXPLAIN ANALYZE` of the most-queried routes (`/api/progress/all-labs`, `/api/parent/dashboard`, `/api/admin/content/queue`).

**7.D — Cron job verification**

`pg_cron` jobs:

- `coppa-cleanup` (`prompt_history` retention).
- Daily streak reset.
- Weekly streak boundary reset.
- Audit-log retention.
- Dunning sweep.

```sql
SELECT jobname, schedule, active FROM cron.job;
```

Expected ≥ 5 jobs `active=true`. Document any disabled with rationale.

**7.E — pgaudit + audit_log retention**

`sql/021_enable_pgaudit.sql` and `sql/014_audit_log.sql` both exist. Verify:

- `pgaudit.log = 'write'` set at the database level.
- `audit_log` retention cron purges rows older than the policy window (90 days default unless legal review demands longer).

**7.F — PITR / DR runbook drill**

`docs/DISASTER_RECOVERY.md` runbook exists. Required:

- Run `scripts/disaster-recovery.sh pitr-drill` against a staging branch.
- Record RPO / RTO into the drill log.
- If `npm` script is missing, add it as part of this sub-phase.

```
Option 1 — Min: confirm runbook readable; skip drill until v1.1.
Option 2 — Med: one-shot drill on staging, results recorded.
Option 3 — Max: cron the drill monthly via Vercel Cron + post results to a Slack/email channel.
Recommendation: Option 2 for launch; Option 3 in the first patch window.
```

**7.G — Realtime progress channels**

`sql/024_realtime_progress.sql` enables Realtime publication on `progress`. Verify:

- Channel scope is per-child (`child_id` filter).
- No PII leaks via Realtime payload.
- Reconnect handling on the client (dashboard) doesn't double-count XP.

**7.H — Backup-and-restore matrix per table**

Confirm Supabase Pro PITR is enabled (operator action — flag if not). Document backup/restore behaviour per table (some are seeded, some are user-data, some are derived).

#### Build & verify gates

- After 7.A: `get_advisors` clean, including for new tables.
- After 7.D: `cron.job` table inspected.
- After 7.F: drill log entry exists.

#### Exit acceptance criteria

- All tables have RLS + verified policies.
- All indexes present.
- All cron jobs active or explicitly documented as disabled.
- DR drill outcome (per the option locked) recorded.
- Phase 7 turn summary in §6.

---

### Phase 8 — Compliance (COPPA · FERPA · GDPR-K · App Stores)

**Status:** ⬜ Not started · **Estimate:** 2–3 sessions · **Goal:** Land every legal-and-policy requirement before SparkForge is reachable to a paying customer. The COPPA 2025 Final Rule's compliance deadline was **April 22, 2026** — past, but rule applies in full now. Inputs from `INT-COPPA`, `REF-COPPA25`, `REF-COG`, `REF-UK-AADC`.

> **HARD-STOP rule:** any `🔴` finding in this phase blocks launch (per `INT-AUDIT-AGENT` §C1).

#### Sub-phases

**8.A — COPPA 2025 Final Rule conformance**

Per the FTC final rule (effective June 23 2025; full compliance April 22 2026):

| Requirement | Where it lives in SparkForge | Verification |
|---|---|---|
| **Verifiable parental consent** before any data collection from a child | `(auth)/signup` + `parents.coppa_consent_at` column | Manual flow walkthrough; check `sql/026_parents_coppa_consent_age_band.sql` populates timestamp + age_band per child. |
| **Separate verifiable consent** for any third-party disclosure | new flow needed if we share data with anyone outside Supabase + Stripe | Verify the disclosure list (Sentry, Vercel Analytics, Anthropic) is itemised in the consent UI. **If not, this is a `🔴` finding.** |
| **Direct notice contents** — categories of personal info, business need, retention period, parties with whom info is shared and their specific purposes | privacy policy + signup-time disclosure card | Read each component and check coverage. |
| **Written data-retention policy** | `docs/legal/DATA_RETENTION.md` (create if missing) | File exists, references the cron jobs from Phase 7.D. |
| **Data minimization** — collect only what's reasonably necessary | per-table audit | Walk every column on `parents`, `children`, `progress`, `prompt_history`, `sessions`. Each column gets a one-line "why we need this". Anything without justification = `🟠`. |
| **No conditioning participation on extra data collection** | `(auth)/signup` + child profile creation | Confirm optional fields are clearly optional and game access doesn't gate on them. |
| **No targeted advertising to children** | confirm no ad SDK in repo | `rg "googletag\|fbq\|gtag" src/` returns nothing. |
| **No third-party trackers in child sessions** | CSP + analytics review | Vercel Analytics is allowed for parents only; child sessions get a stricter CSP. |

Three-Options scaffold for a likely gap:

```
Option 1 — Min: text-only third-party-disclosure list in the existing consent card.
Option 2 — Med: granular consent: parents tick each third party (Sentry, Anthropic, etc.) separately. Default-off where the law allows.
Option 3 — Max: Option 2 + an account-settings toggle to revoke any third party post-signup, with downstream effects (e.g. revoking Anthropic disables prompt-lab; surfaced to the parent before they confirm).
Recommendation: Option 2 — the FTC rule wants "separate verifiable consent" for disclosure, and Option 1 isn't separate.
```

**8.B — In-game purchases (REF-COG precedent)**

The Cognosphere/Genshin Impact $20M settlement set the precedent: under-16 cannot make in-game purchases without parental consent. SparkForge currently has **no in-game purchases** but Stripe is wired for tier upgrade. Confirm:

- The Stripe checkout surface is reachable **only** from the parent dashboard (not from a child session).
- Tier upgrades affect the parent's account, not the child's.
- Demo session has 0 paid surfaces exposed.

**8.C — Right-to-delete UX**

- Parents can delete a child profile and ALL associated data (progress, badges, prompt_history, sessions).
- Parents can delete the entire account (all children + parent record).
- Deletion is hard-delete (no soft-delete with PII retained).
- Deletion event audit-logged (without retaining the deleted PII in the audit row).

**8.D — Privacy policy + ToS reachability**

- Privacy policy linked from signup, login, footer, settings.
- Last-modified date displayed.
- Plain-language version (Flesch-Kincaid grade ≤ 8) available alongside the legal text — `REF-UK-AADC` requires this for kids' services.
- Children see a child-tailored version on first session.

**8.E — FERPA scoping**

If SparkForge markets to schools (admin tier? bulk seats?), FERPA may apply to academic-record data. Today: not marketing to schools. Action: explicitly note in a `docs/legal/MARKET_SCOPING.md` that FERPA is out-of-scope at launch and will be re-evaluated when the School tier ships.

**8.F — GDPR-K + UK Children's Code (international)**

If we serve EEA/UK users:

- GDPR-K consent age varies by member state (13–16). Default to 16 unless we restrict region.
- ICO Children's Code (`REF-UK-AADC`): default-high-privacy, default-off profiling, no nudging children to weaken privacy settings.

```
Option 1 — Min: geo-restrict launch to US only; GDPR-K out-of-scope.
Option 2 — Med: launch globally with a single privacy posture matching the strictest applicable jurisdiction (GDPR-K w/ default age 16).
Option 3 — Max: per-region consent age + per-region privacy copy, gated by the visitor's IP geo and self-declared region.
Recommendation: Option 1 for launch — keeps surface area small. Option 2 in v1.1.
```

**8.G — App-store and PWA policy**

If we ship a PWA (and CLAUDE.md hints at it):

- Apple Smart App Banner / App Store Connect kid-category guidelines.
- Google Play Families Policy.
- Both require their own DPA-like attestations + self-certification panels.

**8.H — Compliance attestation document**

Produce `docs/legal/COMPLIANCE_ATTESTATION_v1.md` — a one-page summary signed-off by an internal stakeholder before launch, listing:

- Each regulatory regime in scope.
- The control that satisfies it.
- The evidence file path in this repo.
- The next review date.

#### Build & verify gates

- After 8.A: walk a fresh signup with a real-looking parent email; confirm consent timestamp + third-party disclosure rendered before any child profile can be created.
- After 8.C: trigger account delete on a test parent; confirm cascade across all child rows; confirm audit row created without PII.

#### Exit acceptance criteria

- 0 `🔴` findings open in §8.
- `docs/legal/DATA_RETENTION.md` and `docs/legal/COMPLIANCE_ATTESTATION_v1.md` exist and are signed-off.
- Privacy policy reachable from every required surface.
- The user has selected and shipped an option for 8.A and 8.F.
- Phase 8 turn summary in §6.

---

### Phase 9 — Performance & 3D Optimization

**Status:** ⬜ Not started · **Estimate:** 2–3 sessions · **Goal:** Hit Core Web Vitals 2026 targets, keep 3D scenes under known draw-call budgets, and ship the asset pipeline (KTX2, Draco, LOD) carried over from `INT-FINAL-04-15` Phase 5. Inputs from `INT-PERF`, `REF-3JS`, `REF-R3F`, `REF-CWV`.

#### Sub-phases

**9.A — Core Web Vitals 2026 targets (per route)**

Targets at the 75th-percentile field measurement:

- LCP ≤ 2.5s.
- INP ≤ 200ms.
- CLS ≤ 0.1.

Procedure per route:

1. Cold-load the page in dev (real device or throttled emulation: 4G + 4× CPU slowdown).
2. Capture metrics via Lighthouse + Web-Vitals overlay.
3. File a `🟡 P2` finding for any route over a target.

Routes to walk: `/`, `/login`, `/signup`, `/home`, `/labs`, `/labs/[id]`, `/arcade`, `/arcade/[slug]` (one per tier), `/parent`, `/parent/children`, `/profile`, `/settings`, `/badges`, `/admin`.

**9.B — Bundle size & code-split per game**

The build baseline from Phase 0.C captured per-route sizes. For this phase:

- Each game component should land in its own dynamic chunk (`dynamic(() => import(...))`).
- The `/arcade` index page should NOT bundle every game.
- Cockpit chunk must not bundle the entire game catalogue.
- 3D dependencies (three, drei, postprocessing) must only load on routes that use them.

```bash
# Inspect chunks
ANALYZE=true npm run build  # if @next/bundle-analyzer is wired
# Else look at /tmp/build-baseline.txt route table.
```

Findings: any route's First Load JS > 250kb gz (post-baseline of Phase 0) → `🟡`. > 400kb → `🟠`.

**9.C — 3D draw-call audit (REF-3JS golden rule)**

`REF-3JS` and `REF-R3F` agree: **draw calls matter more than triangle count**, target < 100 draw calls per scene.

Use `r3f-perf` (drei) overlay in dev to capture per-scene metrics:

| Scene | Target draw calls | Target visible tris |
|---|---|---|
| Hero animation | ≤ 80 | ≤ 1.2M |
| Cockpit (`/home`) | ≤ 100 | ≤ 37.8M @ desktop-ultra · ≤ 8M @ desktop-low |
| Holographic lab map | ≤ 60 | ≤ 800k |
| Each flagship 3D scene | ≤ 100 | per-game design doc |

Where over budget, options:

```
Option 1 — Min: enable instanced meshes for repeated geometries (chairs, trees, particles); update component to `<instancedMesh>`.
Option 2 — Med: Option 1 + LOD chains via `<Detailed>` or custom `useFrame` distance check.
Option 3 — Max: Option 2 + GPU-driven culling via TSL compute (already proven for CeremonyFX in `INT-FINAL-04-15` Phase 5).
```

**9.D — KTX2 / Basis + Draco + LOD pipeline**

`INT-FINAL-04-15` Phase 5 task #6 selected **Ultra** scope. Verify the pipeline shipped:

- `@gltf-transform/core` + `functions` installed (yes per `package.json`).
- `next.config.ts` build step runs the asset transform.
- `public/hdri/frost-prismatic.hdr` available as `.ktx2`.
- Lab textures + Cockpit GLB Draco-compressed.
- `src/lib/3d/assetPreloader.ts` reads a per-user manifest.
- Backend job `src/app/api/jobs/build-preload-manifest/route.ts` exists.

If any pieces are missing, file a `🟠 P1` finding and propose 3 options (re-scope to **Med** for launch and queue **Ultra** for v1.1, etc.).

**9.E — Worker / OffscreenCanvas activation**

`INT-FINAL-04-15` Phase 5 task #1 (Ultra) — OffscreenCanvas migration. Detection lives at `src/lib/3d/offscreenCanvasSupport.ts`. Verify:

- Detection works on Chrome 113+, Edge, FF (no Safari < 16.4).
- `useWorkerPhysics` flag is **off** by default (per `INT-FINAL-04-15` operator follow-up #4) until COOP/COEP headers ship in Phase 11.A.
- A feature flag in `uiStore.experimentalWorkerCanvas` lets internal testers opt-in.

**9.F — Memoization / Zustand selectors**

Per CLAUDE.md v6.5, 30 non-flagship games migrated to Zustand selectors. Verify:

```bash
# Anti-pattern: subscribing to the entire store
rg -n "useGameStore\(\)" src/components/games  # should be empty (must use selector)
rg -n "useChildStore\(\)" src/components/games
```

Add selectors where missing.

**9.G — Lighthouse CI gates**

`INT-FINAL-04-15` Phase 5 task DEPLOY-ENH includes lighthouse-CI. Verify the workflow file exists (`.github/workflows/lighthouse.yml` or equivalent) and gates PRs at:

- Performance ≥ 80
- Accessibility ≥ 95
- Best practices ≥ 90
- SEO ≥ 90

If missing, file as a Phase 11 follow-up (deployment infra) — not a Phase 9 blocker.

**9.H — Realtime / streaming budget**

Realtime channels (sql/024) and Anthropic streaming both eat memory and CPU.

- Realtime: cap subscriptions to active routes only; unsubscribe on route change.
- Anthropic streaming: cancel `AbortController` on tab-hide.

#### Build & verify gates

- After 9.B: dev-server route walk; check Network tab for unintended chunks.
- After 9.C: `r3f-perf` overlay screenshots saved per scene.
- After 9.D: `ls public/hdri/*.ktx2` returns the converted asset(s).

#### Exit acceptance criteria

- All 14 audited routes pass CWV targets at 75th-pct (or have a documented `🟡` exception).
- All scenes within draw-call budget.
- Asset pipeline matches Phase-5-task-#6 scope.
- Zustand selector pattern enforced across all 42 games.
- Phase 9 turn summary in §6.

---

### Phase 10 — Game Enhancement Showcase

**Status:** ⬜ Not started · **Estimate:** 3+ sessions (per chosen scope) · **Goal:** Move every game from "ships" to "delights." This phase is **pure enhancement**, presented as a menu the user selects from. No item here blocks launch — but every item here moves SparkForge from acceptable to wow. Inputs from `INT-UI-04-11` ENH-* items, `REF-OPEN-DESIGN`, `REF-3JS`, `REF-PCV`, the deferred 52 enhancements from `INT-FINAL-04-15` APPENDIX B.

#### How this phase runs

This phase is **menu-driven**, not sequential. For each enhancement candidate:

1. Present the user with min/med/max options + recommendation.
2. User selects 0..N items + a depth per item.
3. We commit to the chosen list, write it into the §6 Session Log, and execute it as a series of mini-sub-phases.

#### Menu of enhancement candidates

**10.A — Per-game interactivity uplift**

For each of the 42 games, the menu offers:

- Min: add one new interactive moment (e.g. a parallax background, hover reveal).
- Med: add a new gameplay mode (e.g. timed mode, free-play mode, story mode).
- Max: rebuild the play phase as a 3D scene per the flagship pattern (only applicable to Standard/FL-Lite tier upgrades).

Recommended starter set (highest learning-impact-per-effort):

| Game | Recommended uplift | Why |
|---|---|---|
| ai-spy | Lab-themed environment per scene category | Cheap, big visual win. |
| time-machine | Timeline-scrub interactive | Pedagogically strong. |
| neuron-relay | Real-time signal-propagation animation | Better mental model. |
| token-chopper | Live-tokenizer view with BPE merges | Real CS visibility. |
| ethics-courtroom | Branching narrative engine | Replayability. |
| sentiment-scanner | Live sentiment-heatmap on text | Accuracy feedback. |
| career-explorer | "Day in the life" 30-second video clips | Real-world hook. |

**10.B — Sound design (Tone.js mood beds)**

Currently each game has a couple of feedback chimes. Enhancement: per-lab ambient mood bed (Lab 1 sci-fi pad, Lab 11 agentic-network pulse).

```
Option 1 — Min: 2 new chimes (correct + incorrect) for the 13 flagship games.
Option 2 — Med: per-lab mood bed (11 beds), looped, ducked when narration plays.
Option 3 — Max: dynamic music engine — beats per minute reflects play tempo, intensity rises near completion.
Recommendation: Option 2 — high impact, contained scope, no library additions.
```

**10.C — Particle / haptic / feedback polish**

- 3D particle bursts on correct answers (lab-tinted).
- Vibration API on supported mobile (short pulse on success, longer on completion).
- Confetti / shower / firework variants from CeremonyFX (already shipped).

**10.D — Multiplayer / cooperative features (Realtime channels)**

`sql/024_realtime_progress.sql` + Realtime infra is ready for a cooperative or competitive surface.

```
Option 1 — Min: a "shared family streak" that aggregates all kids in one parent's account.
Option 2 — Med: live-board for one game (e.g. fool-the-ai) where 2 sibling profiles play together.
Option 3 — Max: full peer-game framework — each game can declare a co-op mode and the framework wires Realtime + presence + rejoin logic.
Recommendation: Option 1 — cheapest, family-positive, no per-game work needed.
```

**10.E — User-generated content (parent-reviewed)**

Allow parents to add prompts / scenarios into pet-trainer, prompt-lab, story-driven games.

```
Option 1 — Min: parents can edit existing prompts; no net-new content surface.
Option 2 — Med: parents can author 1 prompt per child per week, queued through the existing admin-review pipeline (sql/014 audit_log).
Option 3 — Max: full UGC platform with per-prompt sharing across families (requires moderation team + reporting flow).
Recommendation: Option 2 — strong family engagement, leans on existing review pipeline, manageable moderation load.
```

**10.F — AI-coach companion ("Sparky")**

Glassbox + the `@mlc-ai/web-llm` dependency hint at on-device LLM possibilities.

```
Option 1 — Min: rule-based hint engine in 5 flagship games (pre-written hints triggered on stuck detection).
Option 2 — Med: on-device WebLLM coach for parents-only (parents can ask "how is my child progressing?").
Option 3 — Max: in-game Claude-API coach (rate-limited, child-safe, persona-bounded).
Recommendation: Option 1 for launch; Option 3 in v1.2 once moderation infra is stress-tested.
```

**10.G — Cross-device continuity**

Already achievable via Supabase Auth on the web. Enhancement: an "open on another device" flow (QR code + magic-link) so kids can switch from desktop to tablet mid-game without re-login.

**10.H — Visual fidelity ceiling raises**

Per the Tech-Quality Mandate, "use the highest-quality tech stack tool available, at all times." Candidate raises:

- Switch hero animation reference from MP4-poster fallback to a thin WebGPU+TSL fallback that still hits 0.96 SSIM on lower-end desktops.
- Push GTAO (deferred §10.8-D1) past the architectural-spike state.
- Add dynamic environment lighting via spherical-harmonics from current lab tint.

**10.I — Cockpit panel deepening**

The cockpit dashboard has 4 consoles, NPCs, and dynamic environment. Enhancement candidates:

- Animated parent-message console (notifications from parent dashboard).
- Lab-progression hologram that morphs as games complete.
- Pet companion (using the same procedural orb / GLB rig from pet-trainer).

#### Build & verify gates

- After every enhancement item ships: full build + dev-server sanity + (if 3D-touching) `r3f-perf` capture.
- Enhancements that increase draw-call count must come with a corresponding optimisation per Phase 9.C.

#### Exit acceptance criteria

- The user-selected enhancement list is fully shipped (or the un-shipped subset is moved to v1.1 backlog with rationale).
- Phase 10 turn summaries (one per enhancement item) recorded in §6.

---

### Phase 11 — Deployment & Operations

**Status:** ⬜ Not started · **Estimate:** 2 sessions · **Goal:** Move SparkForge from a green branch to a paid live URL on Vercel with monitoring, alerts, runbooks, and rollback. Inputs from `INT-FINAL-04-15` §8, operator follow-ups, `REF-OWASP25` A05 (Security Misconfiguration).

#### Sub-phases

**11.A — Vercel COOP / COEP / CSP headers**

Carry-over from `INT-FINAL-04-15` operator action. Required headers:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-origin`
- CSP: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.stripe.com https://*.sentry.io https://vitals.vercel-insights.com; img-src 'self' data: https:; ...`

These unlock SharedArrayBuffer (needed for OffscreenCanvas + WebGPU compute features).

```
Option 1 — Min: add COOP/COEP only when feature-flag activates worker-canvas (skip CSP tightening for now).
Option 2 — Med: add COOP/COEP + a tightened CSP at launch.
Option 3 — Max: Option 2 + report-only CSP first for 1 week, then enforce — surfaces violations before they break.
Recommendation: Option 3 — kid-safety + dev safety, low marginal cost.
```

**11.B — Sentry release tagging + perf transactions**

Per CLAUDE.md v6.5 T16: Sentry environment/release tagging + perf transactions implemented. Verify:

- `SENTRY_RELEASE` env var set per deploy (Vercel `VERCEL_GIT_COMMIT_SHA`).
- Source maps uploaded — `npm run verify:sentry:ci` passes.
- Transaction sampling rate set to a non-1.0 value in production (e.g. 0.1).
- Errors in production carry the release tag and are linked to commits.

**11.C — Stripe live-mode runbook**

- A dedicated runbook in `docs/STRIPE_RUNBOOK.md` (create if missing) covers: switching test → live keys, configuring live webhook secret, verifying via Stripe CLI test, rolling back to test if needed.
- The webhook handler verifies signatures with `stripe.webhooks.constructEvent` (`INT-AUDIT-AGENT` §C).
- Live keys live in Vercel env, never in the repo.

**11.D — Anthropic key rotation**

- Document the rotation procedure (how to swap the key, how to confirm it's live, how to revoke the old).
- Add a key-rotation reminder cron (Vercel Cron) — quarterly.

**11.E — DR drill cadence**

Per Phase 7.F decision, cadence is locked. Document it in `docs/DISASTER_RECOVERY.md`.

**11.F — Lighthouse CI / Gitleaks CI / e2e gating**

Verify the GitHub Actions workflows enforce gates on every PR:

- Lighthouse CI: per Phase 9.G targets.
- Gitleaks: scan for secrets in commits.
- Playwright: critical-flow e2e suite must pass before merge.
- Type-check + build + lint: on every PR.

If any are missing, file `🟡 P2`.

**11.G — On-call / incident response**

- One named on-call (the operator).
- Sentry alerts wired to email/Slack.
- A `runbooks/` directory with one runbook per critical surface (auth-down, stripe-webhook-fail, anthropic-rate-limited, supabase-down).
- An incident-response template ready in `runbooks/INCIDENT_TEMPLATE.md`.

**11.H — Status page + maintenance UX**

- A simple statuspage (Vercel-hosted or external) at `status.sparkforge.app`.
- A maintenance route in the app (`/maintenance`) that the marketing/auth subdomains can fall through to.
- A graceful-degradation banner in the cockpit when an upstream service is degraded (already a known posture in CLAUDE.md HS-9 / HS-10).

**11.I — Production environment variables checklist**

Confirm every required env var is set in Vercel Production:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (live), Stripe price ids
- `ANTHROPIC_API_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_RELEASE`
- `NEXT_PUBLIC_SITE_URL` (public canonical URL)
- Any feature flags (`NEXT_PUBLIC_EXPERIMENTAL_WORKER_CANVAS=0`, etc.)

**11.J — Domain + DNS + email**

- Custom domain attached to Vercel.
- Apex + www both resolve.
- TLS auto-managed by Vercel.
- Transactional email service (Resend / Postmark) wired with SPF/DKIM/DMARC.
- A `support@` mailbox monitored by the operator.

#### Build & verify gates

- After 11.A: re-test the dev server with strict CSP locally (Playwright run + console error scan).
- After 11.C: trigger a test webhook in live mode and confirm receipt + signature verification.
- After 11.I: `vercel env ls` (or dashboard) screenshot saved into the session log.

#### Exit acceptance criteria

- All required env vars set in Vercel Production.
- All headers shipping per the chosen 11.A option.
- Sentry release-tagged + verified.
- Stripe live mode tested and runbook present.
- CI gates green on `claude/game-deployment-audit-uebBB`.
- Phase 11 turn summary in §6.

---

### Phase 12 — Sign-off & Launch

**Status:** ⬜ Not started · **Estimate:** 1 session · **Goal:** The terminal phase. Every preceding phase has `✅`. We cut the launch tag, push, deploy, and turn on monitoring. Inputs from every preceding phase plus `INT-AUDIT-AGENT` HS-5.

#### Entry preconditions

- Phases 0–11 all `✅`.
- §3.2 has no `⬜` rows in the columns required for launch (P1 Code, P2 UI, P3 UX, P4 A11y, P5 Content; P9 Perf and P10 ENH may be partial).
- §5 has no open `🔴` findings; max one open `🟠` finding per game with a documented v1.0.1 fix plan.
- The user has issued an explicit "approved to launch" reply to the final visual-checkpoint summary.

#### Sub-phases

**12.A — Final visual verification (HS-5 style walk)**

A full manual walkthrough of every route on a fresh account, on:

- Desktop (latest Chrome).
- Tablet (iPad Air emulated).
- Mobile (iPhone 14 emulated).
- Low-end laptop (4× CPU throttle + 4G network).

Record the walk in `docs/launch/FINAL_VISUAL_WALK.md` with screenshots per route per device class.

**12.B — A11y certification snapshot**

- Re-run `axe-core` against every route on every device class.
- Save the green report under `docs/launch/A11Y_SNAPSHOT.md`.
- File any net-new findings as `🔵 P3` for v1.0.1.

**12.C — Compliance attestation**

- `docs/legal/COMPLIANCE_ATTESTATION_v1.md` (from Phase 8.H) is filled in and dated.
- Privacy policy effective date matches launch date.
- Data-retention policy live.
- COPPA consent flow exercised on a fresh signup as the final smoke test.

**12.D — Tag, release, deploy**

```bash
git checkout claude/game-deployment-audit-uebBB
git pull --rebase=false origin claude/game-deployment-audit-uebBB
git tag -a v1.0.0 -m "SparkForge v1.0.0 — public launch"
# Push branch (last push of the audit)
git push -u origin claude/game-deployment-audit-uebBB
git push origin v1.0.0
```

Vercel auto-deploys from the configured production branch. **The audit branch is not the production branch unless the user explicitly merges it.** Before merge:

- Open a PR `claude/game-deployment-audit-uebBB → main` for review.
- Confirm CI gates green.
- Merge by squash or merge-commit per the operator's preference.
- After merge, the `v1.0.0` tag is moved to the merge commit (or re-tagged) — but only after operator approval.

**12.E — Post-launch monitoring playbook**

For the first 72 hours post-launch:

- Sentry dashboard checked hourly.
- Stripe dashboard checked twice daily.
- Supabase logs checked twice daily.
- A daily journal entry in `docs/launch/POST_LAUNCH_DIARY.md` for the first 7 days.
- Any `🔴` finding triggers immediate rollback per `docs/STRIPE_RUNBOOK.md` (and equivalent for auth/db).

**12.F — v1.0.1 backlog freeze**

Everything carried over (un-shipped Phase 10 items, deferred `🔵`/`🟢`) is consolidated into `docs/v1-0-1-backlog.md` with priorities and rough sequencing.

#### Exit acceptance criteria

- v1.0.0 tag pushed.
- Vercel production deploy green (status `READY`).
- Operator on-call active.
- §6 has the launch turn summary.
- This document's top-level status banner flipped from "audit-in-progress" to "launched on YYYY-MM-DD".

---

## 5. PER-GAME FINDINGS LEDGER

One section per game (42 total). Filled in during Phase 1.G and updated as later phases add findings. Use the standard finding template:

```
[FINDING-ID] · severity · phase
File: src/components/games/<File>.tsx[:line]
Description: …
Options presented: 1 / 2 / 3 (+4 if alt)
User selection: …
Status: ⬜ open · 🟦 in progress · 🟪 awaiting review · ✅ resolved (commit SHA) · 🚫 wont-fix
```

> **Authoring rule:** never delete a finding row, even after resolution — close it with the resolution commit SHA so the audit history remains traceable.

### Per-game template

```
### §5.X game-slug — Tier (FS / FL-L / Std)
File: src/components/games/GameSlugGame.tsx
Lab: Lab N · Color: …
Code health (P1): ⬜
UI (P2): ⬜
UX (P3): ⬜
A11y (P4): ⬜
Content (P5): ⬜
Perf (P9): ⬜
Enhancements (P10): ⬜
Findings:
  — none yet
```

### §5.1 ai-spy — Std

File: `src/components/games/AiSpyGame.tsx` · Lab 1 (Vision) · open scaffold.

### §5.2 time-machine — Std

File: `src/components/games/TimeMachineGame.tsx` · open scaffold.

### §5.3 human-vs-machine — Std

File: `src/components/games/HumanVsMachineGame.tsx` · open scaffold.

### §5.4 pet-trainer — FS

File: `src/components/games/PetTrainerGame.tsx` · 3D · GLB-driven (procedural-orb fallback) · open scaffold.

### §5.5 sort-toy-box — FS

File: `src/components/games/SortToyBoxGame.tsx` · 3D · `@dnd-kit` · open scaffold.

### §5.6 treat-trainer — Std

File: `src/components/games/TreatTrainerGame.tsx` · multi-maze · open scaffold.

### §5.7 data-detective — FL-L

File: `src/components/games/DataDetectiveGame.tsx` · R3F-Enh · open scaffold.

### §5.8 neural-builder — FS

File: `src/components/games/NeuralBuilderGame.tsx` · 3D node-graph · open scaffold.

### §5.9 neuron-relay — Std

File: `src/components/games/NeuronRelayGame.tsx` · open scaffold.

### §5.10 pixel-investigator — Std

File: `src/components/games/PixelInvestigatorGame.tsx` · open scaffold.

### §5.11 prompt-lab — FS

File: `src/components/games/PromptLabGame.tsx` · Anthropic API · 3D · open scaffold.

### §5.12 word-predictor — Std

File: `src/components/games/WordPredictorGame.tsx` · open scaffold.

### §5.13 token-chopper — Std

File: `src/components/games/TokenChopperGame.tsx` · open scaffold.

### §5.14 ai-art-detective — Std

File: `src/components/games/AiArtDetectiveGame.tsx` · open scaffold.

### §5.15 agent-architect — FS

File: `src/components/games/AgentArchitectGame.tsx` · 3D · open scaffold.

### §5.16 robot-vacuum — FL-L

File: `src/components/games/RobotVacuumGame.tsx` · R3F-Enh · open scaffold (carry-over `INT-UI-04-11` GAME-03 — verify "Go to charger" handler ships).

### §5.17 tool-picker — Std

File: `src/components/games/ToolPickerGame.tsx` · open scaffold.

### §5.18 bias-detective — FS

File: `src/components/games/BiasDetectiveGame.tsx` · 3D · open scaffold.

### §5.19 data-shield — Std

File: `src/components/games/DataShieldGame.tsx` · open scaffold.

### §5.20 real-or-fake — Std

File: `src/components/games/RealOrFakeGame.tsx` · open scaffold.

### §5.21 ethics-courtroom — Std

File: `src/components/games/EthicsCourtroomGame.tsx` · open scaffold.

### §5.22 camera-quest — FL-L

File: `src/components/games/CameraQuestGame.tsx` · R3F-Enh · open scaffold.

### §5.23 fool-the-ai — Std

File: `src/components/games/FoolTheAiGame.tsx` · open scaffold.

### §5.24 build-classifier — Std

File: `src/components/games/BuildClassifierGame.tsx` · open scaffold.

### §5.25 prediction-market — Std

File: `src/components/games/PredictionMarketGame.tsx` · open scaffold.

### §5.26 sentiment-scanner — Std

File: `src/components/games/SentimentScannerGame.tsx` · open scaffold.

### §5.27 chatbot-builder — FL-L

File: `src/components/games/ChatbotBuilderGame.tsx` · R3F-Enh · open scaffold.

### §5.28 lost-in-translation — Std

File: `src/components/games/LostInTranslationGame.tsx` · open scaffold.

### §5.29 emoji-decoder — FL-L

File: `src/components/games/EmojiDecoderGame.tsx` · open scaffold.

### §5.30 code-blocks — FL-L

File: `src/components/games/CodeBlocksGame.tsx` · R3F-Enh · open scaffold.

### §5.31 career-explorer — Std

File: `src/components/games/CareerExplorerGame.tsx` · open scaffold.

### §5.32 api-explorer — Std

File: `src/components/games/ApiExplorerGame.tsx` · C-band only · open scaffold (audit `INT-AUDIT-AGENT` C1: no raw API key exposure).

### §5.33 my-first-ai-app — FL-L

File: `src/components/games/MyFirstAiAppGame.tsx` · R3F-Enh · open scaffold.

### §5.34 future-forge — FL-L

File: `src/components/games/FutureForgeGame.tsx` · R3F-Enh · open scaffold.

### §5.35 ai-or-not — FL-L

File: `src/components/games/AiOrNotGame.tsx` · open scaffold.

### §5.36 agent-atelier — FS-11A

File: `src/components/games/AgentAtelierGame.tsx` · Stage 11A flagship · store: `agentAtelierStore` · open scaffold (verify per-CLAUDE.md v6.7 lab placement).

### §5.37 mcp-lab — FS-11B

File: `src/components/games/McpLabGame.tsx` · Stage 11B flagship · store: `mcpLabStore` · open scaffold.

### §5.38 glass-box — FS-11C

File: `src/components/games/GlassBoxGame.tsx` · Stage 11C flagship · store: `glassBoxStore` · open scaffold.

### §5.39 harness-forge — FS-11D

File: `src/components/games/HarnessForgeGame.tsx` · Stage 11D flagship · store: `harnessForgeStore` · open scaffold.

### §5.40 pocket-brain — FS-11E

File: `src/components/games/PocketBrainGame.tsx` · Stage 11E flagship · store: `pocketBrainStore` · uses `@mlc-ai/web-llm` · open scaffold.

### §5.41 context-architect — FS-11F

File: `src/components/games/ContextArchitectGame.tsx` · Stage 11F flagship · store: `contextArchitectStore` · open scaffold.

### §5.42 pixel-witness — FS-11G

File: `src/components/games/PixelWitnessGame.tsx` · Stage 11G flagship · store: `pixelWitnessStore` · open scaffold.

---

## 6. SESSION LOG

Append-only. **Every session** that touches this audit must add an entry at the bottom of this section before pushing.

### Session-log entry template

```
### Session NNN — YYYY-MM-DD — claude/<branch> — Phase N.x → N.y

Started: HH:MM (TZ)
Ended: HH:MM (TZ)
Operator: <user handle>

Phases worked:
  - Phase N.x: <status before> → <status after>
  - …

Sub-tasks completed:
  1. <sub-task>: commit SHA <abc1234>, summary
  2. …

Findings opened:
  - <FINDING-ID> · severity · phase
  - …

Findings closed:
  - <FINDING-ID> resolved by commit <abc1234>
  - …

Options presented to user:
  - <FINDING-ID>: 1/2/3 → user picked Option 2
  - …

Build / verify gates:
  - tsc --noEmit: ✅
  - npm run build: ✅
  - vitest: NN passed / 0 failed
  - playwright: NN passed / 0 failed

Files materially changed:
  - <path>
  - …

Outstanding follow-ups:
  - <item> (next phase: …)

Next session entry-point:
  → Phase N.x · sub-task <Letter> · in <file/route>

Push status: pushed at HH:MM with `git push -u origin claude/game-deployment-audit-uebBB`
```

### Session 001 — 2026-05-03 — claude/game-deployment-audit-uebBB — Authoring of this document

Started: this turn
Operator: BlissDirective (via Claude Code Opus 4.7)

Phases worked:
- Document scaffold (§0–§7): ⬜ → ✅ written. Audit work itself has not yet begun.

Sub-tasks completed:
1. Inventory of past audits (`AUDIT_REPORT*`, `Final-Audit_04-15-2026.md`, `agent-reports/UI-UX-Audit-Enhancement-04.11.2026.md`, `flagship-*-audit.md`, `StandardTier-game-content-audit.md`, `docs/00-reference/SPARKFORGE_AUDIT_AGENT.md`, `docs/legal/AUDIT_*`).
2. Codebase survey (`src/config/gameRegistry.ts` confirms 42 games · `src/components/games/*` confirms file count · 19 Zustand stores including 7 new for Stage 11 flagships · `sql/` lists 26 numbered migrations).
3. External research:
   - `REF-OPEN-DESIGN` — `nexu-io/open-design` reviewed for design-discipline rules (OKLCH, P0/P1/P2 gates, 5-dim critique).
   - `REF-3JS` (~111k★), `REF-PIXI` (~47k★), `REF-PHASER` (~39k★), `REF-R3F` (~28k★), `REF-BJS` (~23k★), `REF-MJS` (~17k★), `REF-GD` (~14k★), `REF-PCV` (~10k★), `REF-DREI` (~9k★), `REF-EXC` (~2.3k★) — top-10 game-dev repos by stars on GitHub catalogued.
   - `REF-WCAG22`, `REF-CWV`, `REF-OWASP25`, `REF-COPPA25` (FTC 2025 Final Rule, deadline April 22 2026), `REF-COG` (Cognosphere $20M precedent), `REF-UK-AADC` referenced.
4. Authored the full document — operating rules, references, 42-game matrix, Phases 0–12 with sub-phases, per-game ledger scaffold (42 entries), session log, glossary.

Findings opened:
- None — document is the audit framework, not yet the findings.

Outstanding follow-ups:
- Begin Phase 0 in next session.

Next session entry-point:
→ Phase 0.A — `git pull --rebase=false origin claude/game-deployment-audit-uebBB` followed by tsc + lint + build + test baselines.

Push status: pending — committed after authoring; pushed in the same end-of-session step per §1.7.

---

## 7. GLOSSARY & APPENDICES

### 7.1 Acronym & term glossary

| Term | Meaning |
|---|---|
| 11A–11G | The seven Stage 11 flagship games (Lab 11 *Agentic AI* cohort), CLAUDE.md v6.7 adoption. |
| AAA / AA | WCAG conformance levels. AA is the launch target; AAA is the stretch for body text. |
| Age band | A (7–9) · B (10–12) · C (13–16). Set on the child profile; drives content + UI complexity. |
| AUDIT_AGENT | The agent template in `docs/00-reference/SPARKFORGE_AUDIT_AGENT.md`. Predecessor to this document. |
| Chrome bezel | The metallic frame around panels (Frost-Prismatic). Persists across hero → cockpit handoff. |
| Cockpit | The 3D spatial dashboard at `/home`. 4 consoles + holographic lab map + NPCs. |
| COOP / COEP | Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy — required for SharedArrayBuffer (worker canvas, WebGPU compute). |
| COPPA | US Children's Online Privacy Protection Act. 2025 FTC Final Rule applies in full now. |
| CPA / CPA2 | Cockpit-Persistent Architecture — single Canvas, hero-to-cockpit seamless handoff. |
| CWV | Core Web Vitals — LCP, INP, CLS. |
| D3D-N | Desktop-3D decision N (CLAUDE.md). D3D-1 = desktop-only 3D; D3D-5 = relaxation toggle for DepthOfField + N8AO/SSAO. |
| Demo session | Anonymous time-boxed access for marketing visitors. |
| Forge | The premium tier (Forge / Plus / Free). |
| FS / FL-L / Std | Game tiers — Flagship · Flagship-Lite · Standard. |
| Frost-Prismatic | The dark-mode-only aesthetic — chrome bezels, glassmorphism, lab-tinted neon. |
| GameShell | The wrapper component every game renders inside; owns phase routing + chrome. |
| GLB / GLTF | Binary 3D scene format used for pets and cockpit assets. |
| Glassbox | Lab 11 game *glass-box* — interpretability inspector. |
| Glassmorphism | Translucent surface treatment (backdrop-blur + light tint). |
| HS-N | Hard Stop N (CLAUDE.md §2). HS-5 = stage-end visual checkpoint. |
| KTX2 / Basis | Compressed-texture format Three.js loads via `KTX2Loader`. |
| Lab N | One of 11 themed pavilions, each with a tint and N games. Lab 11 = Agentic AI. |
| MCP | Model Context Protocol. The mcp-lab game introduces the concept. |
| Mythos rule | "SSIM ≥ 0.96 vs reference" — visual checkpoints halt below this. |
| OKLCH | Perceptually-uniform color space. The 11 lab colors are OKLCH-defined. |
| PITR | Point-in-Time Recovery (Supabase Pro feature). |
| RLS | Row-Level Security (Postgres). Default-deny everywhere. |
| R3F | React Three Fiber. |
| SSIM | Structural Similarity Index — visual-equivalence metric. |
| Station frame | The persistent UI-chrome shell around all dashboard pages. |
| TSL | Three.js Shader Language (node-based shader graph for WebGPU). |
| Verifiable parental consent | The COPPA-required step before collecting any data from a child. |
| WebGPU | Modern GPU API; SparkForge's hero animation runs on WebGPU+TSL only (per Tech-Quality Mandate). |

### 7.2 Severity-to-action quick map

| Symbol | Action this session | Action before launch |
|---|---|---|
| 🔴 P0 Critical | Always | Always |
| 🟠 P1 High | Open finding | Always |
| 🟡 P2 Medium | Open finding | First patch (v1.0.1) |
| 🔵 P3 Low | Open finding | Backlog (v1.1+) |
| 🟢 ENH | Discuss only | Phase 10 menu |

### 7.3 Frost-Prismatic token quick reference

| Token | Value (current) | WCAG note |
|---|---|---|
| `--surface-base` | `#0A0E16` | Background; reference for contrast math. |
| `--text-primary` | `#F0F0F4` | ~14:1 on surface — passes AAA. |
| `--text-secondary` | `rgba(255,255,255,0.55)` | ~7.5:1 — passes AAA. |
| `--text-muted` | `rgba(255,255,255,0.30)` | **~3.2:1 — fails AA for body text** (Phase 2.A). |
| `--text-dim` | `rgba(255,255,255,0.15)` | **~1.8:1 — fails everywhere; decoration only** (Phase 2.A). |
| `--neon-blue` | `#00BBFF` | Primary lab-1 accent. |
| Lab tints (11) | OKLCH-defined in `src/config/labColors.ts` | Lab 11 = `oklch(0.85 0.16 175)` (#6FFFE6 Mint-Cyan). |

### 7.4 Sub-agent prompt templates

> **Use only when a job is genuinely too large for the main session.** Audit every agent's output before propagating it into §5 / §6.

**Per-game phase-cycle audit (Phase 1.B)**

```
Description: Per-game phase-cycle audit
Subagent: Explore (medium breadth)
Prompt: For each of these game files, open the file and report on (1) presence of Phase
type with welcome/learn/play/complete, (2) `useChildStore(s => s.activeChild?.age_band)`
read with B fallback, (3) every setTimeout/setInterval is matched by a clearTimeout/
clearInterval in cleanup, (4) `game.completeGame()` called exactly once,
(5) DifficultySelector wired to actual content filtering (or marked decorative).
Files: <list of 6 files>. Report in <300 words per file, with file:line citations.
Do NOT modify any file.
```

**Token-leakage scan (Phase 2.G)**

```
Description: Token-leakage scan
Subagent: Explore (quick)
Prompt: Run `rg -n "#[0-9A-Fa-f]{6}|rgba\(" src/components --glob '!*.config.*'
--glob '!**/3d/shaders/**'` and report each hit with file:line and the matched literal.
Do NOT modify any file.
```

### 7.5 Reference-fetch list (do not memorise — fetch when needed)

- W3C WCAG 2.2 spec
- FTC COPPA 2025 Final Rule press release (`REF-COPPA25`)
- ICO Children's Code (`REF-UK-AADC`)
- pmndrs/react-three-fiber `pitfalls.md`
- mrdoob/three.js docs section on `BufferGeometry`, `KTX2Loader`, `DRACOLoader`
- web.dev/vitals
- Supabase docs · RLS, PITR, Realtime
- Stripe docs · webhook signature verification, automatic-tax, proration

### 7.6 File-touch index (canonical write surfaces by phase)

| Phase | Most likely files |
|---|---|
| 0 | none (read-only baseline) |
| 1 | `src/components/games/*.tsx`, `src/components/games/index.ts`, `src/components/games/GameShell.tsx`, `src/hooks/useSafeTimeout.ts`, `src/components/games/DifficultySelector.tsx`, `src/stores/gameStore.ts` |
| 2 | `src/app/globals.css`, `tailwind.config.ts`, `src/config/cockpitDesignTokens.ts`, `src/config/labColors.ts`, `docs/UX_CONTRAST_POLICY.md`, `docs/visual-baselines/*` |
| 3 | `src/components/dashboard/*`, `src/components/auth/*`, `src/components/games/GameShell.tsx`, `src/stores/uiStore.ts`, `src/stores/toastStore.ts`, route `page.tsx` files |
| 4 | `src/components/a11y/*`, `src/app/globals-a11y.css`, every game (keyboard handlers), `tests/e2e/a11y.spec.ts` |
| 5 | `src/lib/ai-content-generator.ts`, `src/app/api/admin/content/*`, `messages/en.json`, `src/lib/safety/profanity.ts` (new) |
| 6 | `src/middleware.ts`, `src/app/api/auth/**/*`, `src/lib/supabase/server.ts`, `sql/019..023*.sql`, `src/components/auth/*` |
| 7 | `sql/*.sql`, `supabase/migrations/*.sql`, `docs/DISASTER_RECOVERY.md`, `scripts/disaster-recovery.sh` |
| 8 | `src/components/auth/COPPAConsent*.tsx`, `docs/legal/*`, privacy-policy markdown, signup flow |
| 9 | `next.config.ts`, `src/lib/3d/*`, `public/hdri/*.ktx2`, `r3f-perf` overlays, every 3D component |
| 10 | per chosen enhancements (variable) |
| 11 | `vercel.json` / Vercel dashboard, `.github/workflows/*`, Sentry config (`instrumentation*.ts`), `docs/STRIPE_RUNBOOK.md` (new), `runbooks/*` (new) |
| 12 | `docs/launch/*` (new), tag/push only |

---

*Final-Deployment-Readiness-Game-Audit.md · v1.0 authored 2026-05-03 · 13 phases · 42 games · 10 reference repos · auto-resumable · branch `claude/game-deployment-audit-uebBB`*
