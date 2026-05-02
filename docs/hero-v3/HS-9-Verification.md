# HS-9 Hard-Stop Verification — Hero v3 + Cockpit Handoff

**CLAUDE.md HS-9** is the hard-stop gate that must pass before Phase 5 (Hero Animation Rebuild) is signed off. It verifies the **CPA v2 single-canvas** contract and the eight-beat hero plays end-to-end with the cockpit handoff intact.

This document is the user's checklist. Walk through every item; reply "approved" or "issue: [description]" to Claude when done.

---

## 0. Setup

1. Pull the latest commit on `claude/sparkforge-phase-five-CSSzU` (final commit ends in `5c.7`)
2. `npm install` (once if Theatre.js / three-bvh-csg haven't been installed since the branch update)
3. `npm run dev` — wait for "Ready in N s"
4. Open http://localhost:3000 in a Chromium-based browser with WebGPU enabled (Chrome 113+, Edge 113+; Safari TP if you're feeling brave)
5. **Clear hero localStorage** so the first-visit path runs:
   ```js
   localStorage.removeItem('sparkforge-hero-seen');
   location.reload();
   ```

---

## 1. Hero v3 plays end-to-end (live homepage)

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | First page paint | Black void; no flicker; no console errors | ☐ |
| 1.2 | Beat 1 (0.0–2.5 s) | Cyan starfield fades in over 2.5 s; faint cyan radial streaks visible | ☐ |
| 1.3 | Beat 2 (2.5–5.0 s) | Two anamorphic lensflares appear (warm-amber lower-left + cool-cyan upper-right); peak around t=4 s; particles continue | ☐ |
| 1.4 | Beat 3 (5.0–8.0 s) | S glyph crystallizes — transmission ramps 0 → glass; dispersion overshoot then settles; dichroic film visible on the bevels | ☐ |
| 1.5 | Beat 4 first half (8.0–10.0 s) | F glyph mirrors S's crystallization | ☐ |
| 1.6 | Beat 4 detonation (t=10.0) | F vanishes; ~80–500 shards burst outward + upward; bloom flash spike; lensflare double-pulse; faint camera shake | ☐ |
| 1.7 | Beat 5 (11.0–14.0 s) | Wordmark cascade — letters S/F already visible; p/a/r/k/o/r/g/e pop in left-to-right at scheduled times (8 distinct chimes audible) | ☐ |
| 1.8 | Beat 6 (14.0–16.5 s) | Dichroic bloom — wordmark dichroic intensity ramps to 1.6 then back; lensflares peak at intensityMul=2.0 (Q5 user pick) | ☐ |
| 1.9 | Beat 7 (16.5–18.5 s) | Camera arcs up to (0, 6, 7.5); wordmark drifts upward + scales 1.0 → 0.85; lensflares fade out | ☐ |
| 1.10 | Beat 8 (18.5–19.5 s) | Mini-shatter — ~80 shards target-assigned to UI anchor positions; shards fly along arc curves with rotation; per-anchor flash spheres ignite as shards arrive; wordmark fades out | ☐ |
| 1.11 | Total runtime | 19.5 ± 0.1 s end-to-end at 1× speed | ☐ |

---

## 2. CPA v2 single-canvas verification (HS-9 critical contract)

| # | Check | Expected | Pass? |
|---|---|---|---|
| 2.1 | DevTools → Elements → find the `<canvas>` element BEFORE refresh | Note its DOM node (right-click → "Store as global variable" → `temp1`) | ☐ |
| 2.2 | `localStorage.removeItem('sparkforge-hero-seen'); location.reload()` | Page reloads; first-visit path triggers | ☐ |
| 2.3 | After reload, find the `<canvas>` element again | Same DOM node identity OR equivalent (one-time remount on hot-reload is OK; no remounts during the 19.5 s sequence is the contract) | ☐ |
| 2.4 | Watch the canvas DOM node THROUGHOUT the 19.5 s sequence | The `<canvas>` MUST NOT unmount or remount at any point. Use DevTools' "Capture node screenshot" or the Animations panel to verify continuity. | ☐ |
| 2.5 | At t=19.5 (cockpit appears) | Same `<canvas>` continues rendering — cockpit children render INSIDE it, not as a sibling Canvas. No white flash, no visible swap. | ☐ |
| 2.6 | Cockpit interactivity | Click a console / lab map node — should respond. `cockpitReady=true` was set at t=19.5. | ☐ |

**If 2.4 or 2.5 fails:** the handoff is broken. Likely cause: `<Canvas>` mounted under a `key` that changes, or hero/cockpit are separate `<Canvas>` siblings. Trace the parent JSX tree until you find the swap.

---

## 3. Skip / fast-forward / accessibility

| # | Check | Expected | Pass? |
|---|---|---|---|
| 3.1 | Click anywhere on the hero overlay during the sequence | `timeScale = 4.0` (4× fast-forward); ~4.875 s total at peak speed | ☐ |
| 3.2 | Press `Enter` or `Space` during the sequence | Same as click — fast-forward | ☐ |
| 3.3 | Press `Escape` during the sequence | Immediate skip to end; cockpit appears; no half-rendered states | ☐ |
| 3.4 | Settings → "Skip intro animation" toggle ON; refresh | After first visit, hero is skipped on subsequent loads | ☐ |
| 3.5 | DevTools → Rendering panel → "Emulate CSS media feature prefers-reduced-motion: reduce"; refresh | Hero is skipped immediately; cockpit appears on first paint | ☐ |
| 3.6 | Audio muteable via Settings → Sound toggle | All hero audio cuts cleanly when muted | ☐ |

---

## 4. Audio synchronization (heroAudio.ts v3 remap)

| # | Check | Expected | Pass? |
|---|---|---|---|
| 4.1 | Beat 1 (0–2.5 s) | Brown noise rumble + 40 Hz sub-bass (felt more than heard) | ☐ |
| 4.2 | Beat 2 (~t=4.0) | Bandpass whoosh + impact + clang (warm-amber lensflare peak) | ☐ |
| 4.3 | Beat 3 (5–8 s) | Sustained Cmaj7 chord pad; pink whoosh circling | ☐ |
| 4.4 | Beat 4 (~t=10.0) | Sub-drop + glass-shatter sample (or fallback if `/audio/glass-shatter.mp3` not present) + debris granular | ☐ |
| 4.5 | Beat 5 (11.3–13.3 s) | 8 distinct cascade chimes — one per letter (p/a/r/k/o/r/g/e) | ☐ |
| 4.6 | Beat 6 (~t=14.0 + ~t=15.2) | Aurora pad Am7 attack + HUD ring chord at peak bloom | ☐ |
| 4.7 | Beat 7 boot sequence | LED buzz @ ~t=16.9; panel clunk @ ~t=17.3; digital chirp arpeggio @ ~t=17.7 | ☐ |
| 4.8 | Beat 8 (~t=18.5–19.3) | Power-up FM sweep + 8 staggered gauge clicks (~40 ms apart starting t=19.0) + persistent cockpit ambient | ☐ |
| 4.9 | Cockpit ambient | Continues into cockpit interactivity phase (no audio gap at t=19.5) | ☐ |

---

## 5. Performance budget

| # | Check | Expected | Pass? |
|---|---|---|---|
| 5.1 | DevTools → Performance → record 19.5 s of hero playback | Frame time stays ≤ 18 ms (55+ FPS) on WebGPU desktop-ultra | ☐ |
| 5.2 | Beat 4 detonation frame | Highest-cost frame; should still be ≤ 22 ms (45+ FPS instantaneous) | ☐ |
| 5.3 | Beat 8 shatter-into-UI | ~80 shards + cockpit groups + per-anchor flashes; ≤ 22 ms | ☐ |
| 5.4 | Bundle size | `/` First Load JS within tolerance of pre-Phase-5 baseline (Phase 5 added ~50 KB for v3 beats + Theatre.js studio) | ☐ |

---

## 6. Mobile / non-WebGPU fallback

| # | Check | Expected | Pass? |
|---|---|---|---|
| 6.1 | Open in Safari (or any non-WebGPU browser) | `<BrandingShowcase>` falls back to `brand-fallback.mp4` SF-mark loop (or `IMG_4607.png` poster) — no canvas; no hero v3 sequence | ☐ |
| 6.2 | Cockpit accessible after auth on mobile | Direct nav to `/home` works; mobile gets the static brand mark (no hero) | ☐ |
| 6.3 | (Q10 mobile trimmed video) | NOT in scope for HS-9 — that's Phase 7 work (Sora/Veo prompt pack expansion) | ✅ deferred |

---

## 7. Theatre.js studio (Q8 auto-mount)

| # | Check | Expected | Pass? |
|---|---|---|---|
| 7.1 | Open `/dev/hero-v3` | Studio overlay appears bottom-right with the heroBeat1..heroBeat4 objects | ☐ |
| 7.2 | Studio appears on `/` (live homepage hero) | Studio mounts here too (per Q8 — auto-mount on every environment) | ☐ |
| 7.3 | Tune a heroBeat object value (e.g. heroBeat1.particleFadeRate) | Live update reflects in the running hero | ☐ |

---

## Sign-off

When every checked item passes:
- Reply "**HS-9 approved**" to Claude
- Claude will mark Phase 5 fully complete in PROGRESS.md
- Branch is ready for squash-merge into `setup-SparkForge-dev`

If any item fails:
- Reply "**HS-9 issue: [check #N.N] [description]**"
- Claude will diagnose, propose fix options, await your selection

---

*Generated as part of Phase 5c.7 — final commit before HS-9 hard stop.*
*Storyboard authority: `docs/hero-v3/Storyboard.md` v1.2 (19.5 s).*
