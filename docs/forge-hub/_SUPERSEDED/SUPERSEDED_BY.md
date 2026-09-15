# SUPERSEDED FILES — docs/forge-hub/_SUPERSEDED/

> **DO NOT USE AS A BUILD SOURCE.** These documents are preserved for git history. They describe earlier brainstorm drafts of the Hologram-Forge Hub and are **not** the locked vocabulary or the engineering plan.

## Archive Manifest

| Superseded File | Replaced By | Reason | Date |
|-----------------|-------------|--------|------|
| `Phased-R3F-Hub-Plan.md` (was `docs/Phased-R3F-Hub-Plan.md`) | `docs/forge-hub/Phased-R3F-Hub-Plan.md` (phases 0–6 spine) + `docs/forge-hub/VOCABULARY.md` (name lock) + `docs/forge-hub/TRANSITION_ACTION_PLAN.md` v2.2 (architecture + route table) | Older root copy of the Phased plan. Differs from the forge-hub copy (status, Sparky section, `heroWelcome` vs `welcome`) and from TAP v2.2 (Holo trio, `hubSplit` as equal destinations, auth on `welcome`). Per CLAUDE.md §3.2 and TAP v2.2 §3 W0 item 5 / PLAN_ASSESSMENT §3. | 2026-09-15 |

---

## Superseded File: Phased-R3F-Hub-Plan.md

| Field | Value |
|-------|-------|
| **Superseded File** | `Phased-R3F-Hub-Plan.md` (was `docs/Phased-R3F-Hub-Plan.md`) |
| **Replacement File** | `docs/forge-hub/Phased-R3F-Hub-Plan.md` |
| **Also see** | `docs/forge-hub/VOCABULARY.md`; `docs/forge-hub/TRANSITION_ACTION_PLAN.md` v2.2 |
| **Date Archived** | 2026-09-15 |
| **Reason** | Duplicate, older brainstorm at docs root. Vocabulary (`TopBanner` / `heroWelcome` / `authMerged` / `hubSplit` as Top+L+R) contradicts the locked Holo trio and TAP §2 / §5. |
| **Decision Reference** | TAP v2.2 §3 W0 item 5; `docs/01-decisions/2026-09-forge-hub.md`; PLAN_ASSESSMENT.md §3 / §6.3 |

### What is wrong in the superseded file (DO NOT APPLY)

- **Module catalog** uses `TopBanner`, `SideList`, `SideDetail`, `CenterWide`. The locked plate has three cyan slabs only: `HoloL` / `HoloC` / `HoloR`. There is no top banner.
- **`heroWelcome`** is not a mode. Use `welcome` (HoloL/R ~85%, HoloC full — site home + login).
- **`authMerged`** is not a mode. Login/signup/forgot/reset are `welcome` with HoloC form wipes (TAP §2.9).
- **`hubSplit`** is described as “Top + L + R”. Locked meaning: **equal trio**, three destinations on HoloL/C/R (e.g. `/home`).
- Paths point at `public/forge-lab/` and PR #164 hotspot names, not `public/forge-hub/` / TAP `FORGE_HUB*`.
- No Sparky 2026-09-11/14 lock (desk character + `HoloBubble`).
- Games-on-glass and Director choreography are absent (TAP decisions 5 and 8).

### What was carried forward

- Phases 0–6 spine (room shell → screen kit → hubSplit/welcome → PlayStage → content → polish)
- Fixed-camera R3F world + HTML-on-glass UI
- Named morph states; `PlayStage` 3→1 merge; `EscapeFlat`; `CorePortal`; `ToastRail`
- Non-goals: Pixel Streaming, free-look, replacing Phaser/Pixi games with R3F

---

## Active documents

| Document | Role |
|----------|------|
| `docs/forge-hub/VOCABULARY.md` | **Name lock** — HoloL/C/R, modes (`welcome`, `hubSplit`, …), retired aliases |
| `docs/forge-hub/Phased-R3F-Hub-Plan.md` | Phase 0–6 engineering spine; §3–§5 match the vocabulary lock (W0-05) |
| `docs/forge-hub/TRANSITION_ACTION_PLAN.md` v2.2 | Canonical architecture, route table, workstreams |
| `docs/forge-hub/LOCKED_HUB.md` | Visual plate lock |
| `docs/01-decisions/2026-09-forge-hub.md` | Decisions 1–13 LOCKED |

Build order for names: **VOCABULARY.md** → TAP §2 / §5 → Phased plan §3–§5. Do not rebuild from this folder.
