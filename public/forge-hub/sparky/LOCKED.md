# Sparky character concept — LOCK

**Status:** LOCKED by owner 2026-09-14
**Design doc:** `docs/forge-hub/LOCKED_SPARKY.md`
**Master spec:** `docs/sparky/SPARKY-CHARACTER-SPEC.md`

## LOCKED_SPARKY.png — canonical concept
- Source: owner-supplied concept render, exact bytes
- SHA256: `bfba27a23a63f14a1d56de49f252b76d9c84661d35640287ee90555dd6ffea7d`
- 516 × 631, RGBA, transparent background, three-quarter front view, right hand raised in an open-palm gesture
- Rule: agents MUST NOT regenerate, restyle, or "improve" this art. It is the single visual authority for the 3D model, the 2D stills, the face-screen expressions, and every outfit pack. Copy byte-for-byte; verify with `sha256sum -c ../SHA256SUMS`.

## What this file locks
- Silhouette and proportions (chibi humanoid robot, head about a third of total height)
- Shell colour (coral), joint colour (black), emissive colour (cyan), decal colour (yellow)
- Face screen: black rounded screen, dot-matrix cyan eyes and smile
- Head dome: translucent cyan module on the crown — the chat-hologram emitter; nothing may ever cover it
- Chest badge: cyan "S" plate; yellow lightning-bolt decals on shoulders, forearms, hips, and boots; cyan ear discs; cyan boot lights; five-fingered hands

## Supersedes
- `public/branding/_obsolete/sparky-reference.jpeg` (chrome orb reference)
- `docs/sparky/_SUPERSEDED/SPARKY-RIVE-SPEC.md` §1 (chrome orb geometry); the Rive state-machine contract in that file is carried forward unchanged into the new spec
- The `SparkyCore.tsx` SVG drawing (chrome orb) — code stays live until the LED-dot redraw lands in plan W3

## Additional views
- Turnaround, back, and expression sheets are produced by the character workstream from this file and are added here with SHAs only after owner approval.
