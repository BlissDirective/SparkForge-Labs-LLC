# Higgsfield UI Redesign — Build Playbook (phase by phase)

> **Date:** 2026-06-16 · **Build with:** Claude Code + stakeholder, one phase at a time.
> **Reads from:** `Higgsfield-UI-Redesign-Plan.md` (strategy) + `brand/Brand-Bible-v1.md` (locked art direction "Lumen: Papercraft Neon").
> **How to use:** each phase has Goal · Tasks (split **CC** = Claude Code / **YOU**) · Deliverables · Acceptance gate. Do not start a phase until the prior gate is green. Every phase ends with the established cadence: commit → push feature branch → ff-merge to `setup-sparkforge-dev`.

---

## Division of labor (general)

- **YOU:** provision Higgsfield access; approve art-direction picks; run/approve Higgsfield generations (or delegate via MCP once connected); sign off COPPA review; visual checkpoints.
- **CC (Claude Code):** all code (manifest, components, wiring, fallbacks, a11y, perf); author + iterate prompts; assemble contact sheets; integrate approved assets; keep the build green; commit/merge.

---

## Prerequisite — connect Higgsfield MCP (blocks generation only, not Phase 1)

| Who | Task |
|---|---|
| YOU | Add Higgsfield MCP to Claude Code config (`mcpServers` in settings, or the web env MCP settings) with your Higgsfield API key; share the server command/URL. |
| CC | Once live: confirm tools surface, smoke-test one Soul generation, wire generation into the prompt kit. If you prefer, CC scaffolds the `mcpServers` config via the update-config skill once you supply the command + key. |

**Until connected:** Phases 1 (pipeline) and the planning of every phase proceed with poster/placeholder assets. Only the *generation* tasks wait.

---

## Phase 0 — Look-dev & lock (art direction)

**Goal:** turn the locked direction ("Lumen", Brand Bible v1) into real, approved reference assets + master seed.

| Who | Task |
|---|---|
| CC | Prompts ready in Brand Bible §8 (style spine + Soul/Video/Speak templates). |
| YOU+CC | Generate the **contact sheet**: home hero, 1 lab (suggest Lab 7 Vision — focus-pull motif), Sparky turnaround, one UI panel — 3 variations each. |
| YOU | Pick the winning look (or a blend). |
| CC | Record `MASTER_SEED`, `SPARKY_SEED`, and drop style refs into `brand/refs/`; update Brand Bible v1 → fill `[SEED_TBD]`/`[REF_TBD]`. |

**Deliverables:** approved ref set in `brand/refs/`, seeds recorded, Bible finalized.
**Gate:** stakeholder approves the look. **No production UI before this.**

---

## Phase 1 — Pipeline scaffolding (NO assets needed — buildable today)

**Goal:** the seam between authored media and the live UI, working end-to-end with placeholders.

| Who | Task |
|---|---|
| CC | `src/lib/cinematic/cinematicManifest.ts` — typed registry (schema below). |
| CC | `src/components/cinematic/CinematicBackdrop.tsx` — `<video>`+poster, device-tier source, reduced-motion → poster, lazy `IntersectionObserver` mount, overlay slot. |
| CC | `src/components/cinematic/CinematicTransition.tsx` — route-transition stinger layer; cross-fade fallback. |
| CC | `useCinematicTier()` from `useDeviceProfile` → `full | lite | poster`. |
| CC | Placeholder posters (solid Lumen-ink gradients) so everything renders before real media. |

**Deliverables:** the 3 primitives + manifest, all behind feature flags, zero visual regressions.
**Gate:** `tsc` + `eslint` + `next build` green; shared First-Load JS unchanged (~230 kB — media is `<video>`/CDN, not JS); backdrop renders placeholder, honors reduced-motion.

### Engineering spec — manifest shape
```ts
type Tier = 'full' | 'lite' | 'poster';
interface CinematicAsset {
  id: string;                 // 'home-hero', 'lab-7-loop', 'stinger-lab-7'
  kind: 'backdrop' | 'stinger' | 'sparky' | 'still';
  poster: string;            // /cinematic/.../poster.avif (always present)
  sources?: Partial<Record<Tier, string>>; // webm/mp4 per tier
  durationMs?: number;
  lab?: number;
  provenance?: { prompt: string; seed: number; model: string; styleRef: string; reviewer: string; date: string };
}
```
### Component API
```tsx
<CinematicBackdrop assetId="lab-7-loop" overlay={<PixiScene/>} priority={false} />
<CinematicTransition stingerId="stinger-lab-7" onDone={...} />
```
### Asset layout + encoding
```
public/cinematic/
  stills/<surface|lab>/*.avif
  video/<surface|lab>/{full,lite}.{webm,mp4}  + poster.avif
  sparky/*.webm
```
- AV1/VP9 (`.webm`) + H.264 (`.mp4`) fallback; `preload="none"`, play on intersection; posters via `next/image`.

---

## Phase 2 — Marketing reinvention

**Goal:** the public site becomes the cinematic showcase.

| Who | Task |
|---|---|
| YOU+CC | Generate hero film + section b-roll + pricing ambient (Bible prompt kit). |
| CC | Replace `HeroSection` OGL FloatingLines with `<CinematicBackdrop assetId="home-hero">` + kinetic headline (GSAP/Theatre). |
| CC | Re-skin `LandingFeatures`, `LandingHowItWorks` (3-beat cinematic), `LandingAITutor` (Sparky Speak clip), `LandingCTA`, pricing. Swap emoji/stock for Soul stills (`Ui-Creation.md`). |
| YOU | COPPA review of all marketing media; visual checkpoint. |

**Gate:** visual checkpoint approved; Lighthouse/LCP within budget (poster-first); reduced-motion path verified.

---

## Phase 3 — Onboarding arrival + dashboard home

**Goal:** the cinematic entry + the reimagined cockpit home.

| Who | Task |
|---|---|
| YOU+CC | Generate the arrival film (the reborn 8-beat hero) + Sparky greeter clip + home backdrop. |
| CC | Onboarding arrival sequence (Theatre.js timeline over the film; skippable; auto-skip mobile/reduced-motion). |
| CC | `home/page.tsx`: cinematic backdrop of the lab map + Sparky greeter + kinetic level/XP/streak (Orbitron + CountUp) + continue-CTA. DOM + video + Pixi accents (not WebGPU). |
| YOU | COPPA review; checkpoint. |

**Gate:** arrival plays + skips correctly; home renders on all tiers; data accurate via existing hooks.

---

## Phase 4 — The 11 lab worlds (sequence with the Pixi waves)

**Goal:** each lab becomes a place; ship reskin + games together, lab by lab.

| Who | Task |
|---|---|
| YOU+CC | Per lab: generate key art + ambient loop + entry stinger (Bible §7) + pick Tone.js soundscape. |
| CC | Lab-map "galaxy of 11 worlds" (hover/focus previews); `<CinematicTransition>` on lab entry; lab backdrop persists behind that lab's games. |
| CC | Wire each lab's games to their archetype + skin **in the same sweep** (`Game-Migration-Map.md §5` waves). |
| YOU | Per-lab COPPA review + checkpoint. |

**Gate (per lab):** world + stinger + soundscape + that lab's migrated games all green; SSIM ≥ 0.96 vs key art; 60fps Chromebook.
**Order:** follow Game-Migration-Map waves (start Vision/Ethics/Creates), Lab 11 last.

---

## Phase 5 — Game shells, celebrations, Sparky

| Who | Task |
|---|---|
| YOU+CC | Generate celebration stingers (1–3 star) + Sparky big-moment clips; drop `sparky.riv` if authored. |
| CC | Lab-world backdrop behind Pixi archetype canvases; celebration stingers in the reward pipeline; Sparky clips on milestones (Rive primary). |
| YOU | COPPA review; checkpoint. |

**Gate:** celebrations fire per tier; backdrops don't regress game fps; juice intact.

---

## Phase 6 — Mobile lite-tier, a11y, perf hardening

| Who | Task |
|---|---|
| CC | `MobileDashboard` lite tier (static key art + 1 short hero loop); audit every surface for poster-only on reduced-motion; CDN range-serving; preload tuning. |
| CC | Full a11y pass (focus, aria-live, contrast over media), Lighthouse, 60fps Chromebook profiling. |
| YOU | Final sign-off. |

**Gate:** Lighthouse targets met; reduced-motion + mobile verified; SSIM checkpoints across surfaces; First-Load JS unchanged.

---

## Cross-phase guardrails (every phase)

- **COPPA gate** before any asset merges (Bible §10) — provenance logged in manifest.
- **Fallback ladder** always: full → lite → poster → reduced-motion static.
- **Perf invariant:** media is `<video>`/CDN/`next/image`, never JS bundle; shared First-Load JS stays ~230 kB.
- **Single source of truth:** any hue change → `src/config/labColors.ts`.
- **Cadence:** commit → push `claude/sparkforge-phase-review-uiapy3` → ff-merge `setup-sparkforge-dev`.

---

## Status & immediate next step

- **Done:** Phase-0 direction locked ("Lumen: Papercraft Neon"), Brand Bible v1 written, prompt kit + seed-lock protocol defined.
- **Blocked on:** Higgsfield MCP connection (generation) — see Prerequisite.
- **Buildable now without it:** **Phase 1** (pipeline scaffolding with placeholders).

**Recommended next action:** while you provision Higgsfield, CC builds **Phase 1** (manifest + `<CinematicBackdrop>` + `<CinematicTransition>` + tier logic + placeholder posters) so the seam is ready the moment the first approved assets land — same proven pattern as the Rive-mascot fallback.

*Build Playbook v1. Generated by Claude Code (Fable series).*
