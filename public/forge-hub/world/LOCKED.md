# Forge Hub world plate — LOCK

**Status:** LOCKED. Canonical plate set by the owner 2026-09-15 (resolves O-5).
**Design doc:** `docs/forge-hub/LOCKED_HUB.md`

## LOCKED_HUB.jpg — canonical
- Source: owner-approved attachment, exact bytes (2026-09-15).
- SHA256: `4e48559f9f92a7ef814ebf58612665da33d0485c7fa207aa2089ca18f7610222`
- 1280 × 720 (16:9); fixed close frontal POV; **equal cyan trio** (HoloL / HoloC / HoloR, no top banner); flat SF emitter disc bottom-centre projecting a cone up to HoloC; warm rose-gold / cream lab.
- Rule: agents MUST NOT regenerate, restyle, or recompress this art. Copy byte-for-byte; verify with `sha256sum -c ../SHA256SUMS`.
- Role in the R3F build: the single reference. It is the SSIM target, the projected backdrop, and the poster fallback (there is no separate haze-free still). Room shell measured 0.969 SSIM (WebGL2) on 2026-09-15.
- Note (informational, per Tech Quality Mandate): the plate is a 1280×720 JPEG and is upscaled on ≥ 1440 px displays. If the owner supplies a higher-resolution or PNG master of the same composition, it replaces this file byte-for-byte with a new SHA.

## SF_MONOGRAM_CLOSEUP.png — emitter reference
- 1024 × 1024 close-up of the SF core, for modelling the emitter mesh and its TSL material.
- SHA256: `eb93c239179958dc430654b2a2dec94191c5e8ecf391a1c6105e08c8279fcbaf`
- Reference only; not displayed in the app.

## Superseded
- `_SUPERSEDED/LOCKED_HERO.png` and `_SUPERSEDED/LOCKED_HERO_no_haze_filter.png` — the PR #164 plate, a **different room** (top banner, silver/blue, mid-wall SF). See `_SUPERSEDED/SUPERSEDED_BY.md`. Do not use.
