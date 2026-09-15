# LOCKED — Hologram-Forge Hub (2026-09-11)

## Files (committed 2026-09-14, SHAs in `public/forge-hub/SHA256SUMS`)
- `public/forge-hub/world/LOCKED_HERO.png` — canonical plate (the composition described below)
- `public/forge-hub/world/LOCKED_HERO_no_haze_filter.png` — display still of the same plate
- `public/forge-hub/world/SF_MONOGRAM_CLOSEUP.png` — emitter reference
- `public/forge-hub/sparky/LOCKED_SPARKY.png` — Sparky (separate lock: `LOCKED_SPARKY.md`)
- `LOCKED_HUB.jpeg` / `LOCKED_HUB.png` — owner's local design references; add to `public/forge-hub/world/` with SHAs only if they differ from `LOCKED_HERO.png`

## Product role
This screen **replaces** the old sparkforge-labs.com hero marketing page.
It is the **welcome**, **main**, and **control** surface: panels dynamically shift/change/move with interaction.

## Vocabulary (locked 2026-09-15)
The three cyan panels are **`HoloL` / `HoloC` / `HoloR`**. Layout modes include **`welcome`** (sides ~85%, center full — site home + login) and **`hubSplit`** (equal trio, three destinations). Full lock: `VOCABULARY.md`. Do not use `TopBanner`, `heroWelcome`, or `authMerged`.

## Locked visual language
- Close frontal POV; three empty cyan hologram panels as primary UI (`HoloL` / `HoloC` / `HoloR`)
- Flat, slightly raised circular **SF** emitter module (not tall pedestal / deep pit)
- Warm futuristic rose-gold / cream lab soft in background
- Kid-friendly forge aesthetic

## Next layout targets (post-lock)
1. Welcome: **one large center** hologram + **two smaller** side holograms
2. Small **Sparky docking plate** on the console for avatar stand / interaction
3. Motion / morph variations for video (display states)

## Obsolete
Stale hub comps are owner-local only and must not be committed. Canonical lock is `public/forge-hub/world/` (SHAs in `public/forge-hub/SHA256SUMS`; read-only) plus this file.

## Sparky (2026-09-11 decision, revised 2026-09-14)
No dock baked into the plate. Sparky is a **rigged 3D character on the desk** (not painted desk hardware, not a flat overlay), locked in `docs/forge-hub/LOCKED_SPARKY.md`. Owner-local regen dock trials are exploratory only — not locked and not in this repo.

## Build plan
`TRANSITION_ACTION_PLAN.md` (v2.2) is the engineering plan for this lock.
