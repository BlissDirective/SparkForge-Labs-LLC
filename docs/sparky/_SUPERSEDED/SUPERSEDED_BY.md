# SUPERSEDED FILES — docs/sparky/_SUPERSEDED/

> **DO NOT USE AS A BUILD SOURCE.** These documents describe the previous Sparky design (chrome robot orb). They are preserved for git history and for the parts of their contracts that were carried forward.

## Superseded File: SPARKY-RIVE-SPEC.md

| Field | Value |
|---|---|
| **Superseded File** | `SPARKY-RIVE-SPEC.md` (was `docs/SPARKY-RIVE-SPEC.md`) |
| **Replacement File** | `docs/sparky/SPARKY-CHARACTER-SPEC.md` |
| **Date Archived** | 2026-09-14 |
| **Reason** | Owner locked a new Sparky concept (`public/forge-hub/sparky/LOCKED_SPARKY.png`): a coral chibi humanoid robot with a face screen and a head-dome chat emitter. §1 of this spec (chrome orb geometry, gradient values) is wrong for the new character. |
| **Decision Reference** | `docs/forge-hub/LOCKED_SPARKY.md`; `docs/forge-hub/TRANSITION_ACTION_PLAN.md` §2.8, §2.8a, §2.8b |

### What is wrong in the superseded file
- §1 "The character": polished chrome sphere, gradient `#F0F2F8 → #7884A4`, antenna with a glowing ball. None of this exists on the locked character.
- §4 sizes and §5 delivery assume Rive is the master; the master is now a rigged GLB and 2D stills are rendered from it.

### What was carried forward unchanged
- §2 artboard and state-machine name `SparkyMachine`
- §3 inputs `comboTier` (Number 0–3), `celebrate` (Trigger), `encourage` (Trigger), `thinking` (Boolean), and the suggested state mapping
- The nine expression names and their glow colours (`idle`, `happy`, `thinking`, `speaking`, `excited`, `sleepy`, `sad`, `celebrating`, `surprised`) — redrawn in LED-dot style, colours kept
- §6 gotchas (case-sensitive names, short interruptible triggers, `@rive-app/react-canvas` v4)

## Active documents
| Document | Role |
|---|---|
| `docs/sparky/SPARKY-CHARACTER-SPEC.md` | Master: model, rig, clips, face screen, sockets, outfits, behaviour, 2D derivation, in-game Rive contract |
| `docs/forge-hub/LOCKED_SPARKY.md` | Visual lock and product role |
| `docs/forge-hub/TRANSITION_ACTION_PLAN.md` | Build plan (W3, §6, §6b) |
