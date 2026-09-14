# Forge Hub world plate — LOCK

**Status:** LOCKED by owner 2026-09-05 (original, PR #164), re-affirmed and moved here 2026-09-14
**Design doc:** `docs/forge-hub/LOCKED_HUB.md`

## LOCKED_HERO.png — canonical
- Source: owner-approved attachment, exact bytes (from PR #164 `public/forge-lab/world/LOCKED_HERO.png`)
- SHA256: `db75ecf0055a8168a0ae71be5f1f28921c1ef9c29511ce44c380348121442555`
- 1536 × 1024 composition; fixed frontal POV; three empty cyan holograms; flat raised SF emitter; warm rose-gold and cream lab
- Rule: agents MUST NOT regenerate this art. Copy byte-for-byte; verify with `sha256sum -c ../SHA256SUMS`.
- Role in the R3F build: projected backdrop for the plate-plus-parallax room (plan §2.4); SSIM ≥ 0.96 reference for the Phase 1 room shell; poster fallback image.

## LOCKED_HERO_no_haze_filter.png — display still
- Mild non-generative bloom compress of the same composition
- SHA256: `582366f956c37390fb70c8d954f247fc4f1e3932c47996202c30f43d27be0cd9`
- Preferred for on-screen display and the poster fallback; `LOCKED_HERO.png` stays canonical for SSIM.
- PR #164 shipped this same file five more times as `00-locked-hub-dark-sf.png`, `01-idle.png`, `02-charge.png`, `03-emit.png`, `04-docked.png` (identical SHA). One copy is kept here; idle, charge, emit, and docked all use this file until a loop encode exists.

## SF_MONOGRAM_CLOSEUP.png — emitter reference
- 1024 × 1024 close-up of the SF core, for modelling the emitter mesh and its TSL material
- SHA256: `eb93c239179958dc430654b2a2dec94191c5e8ecf391a1c6105e08c8279fcbaf`
- Reference only; not displayed in the app.

## Not in the repo
- `LOCKED_HUB.jpeg` / `LOCKED_HUB.png` referenced by `docs/forge-hub/LOCKED_HUB.md` are the owner's local design references of the same composition. If they differ from `LOCKED_HERO.png` in any way the owner adds them here with SHAs and names which one is canonical for SSIM.
- Stale hub comps (`hub-concepts/obsolete/`) stay local and are not to be committed.
