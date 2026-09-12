# Screen inventory — live routes → forge modes / modules

**Branch scanned:** `setup-sparkforge-dev`  
**Date:** 2026-09-12  
**Visual lock:** `LOCKED_HUB` (no Sparky dock) · Sparky = `SparkyOverlay` later  
**Unified plan:** `R3F_VARIATION_PLAN.md`

**Legend — placement**
| Tag | Meaning |
|-----|---------|
| **IN** | Lives inside the forge stage (Html-on-mesh) |
| **EXIT** | Leaves / dims forge (Phaser/Pixi or heavy canvas) |
| **FLAT** | `EscapeFlat` full-viewport 2D (parent / legal / dense forms) |
| **BRIDGE** | Dev / interim only; not product home |
| **DROP** | Marketing surface that the forge **replaces** as site home |

Modules: `HoloL` `HoloC` `HoloR` · `PlayStage` · `CorePortal` · `SparkyOverlay` · `ToastRail` · `EscapeFlat`

Modes: `welcome` · `hubSplit` · `authMerged` · `labsBrowse` · `gameLobby` · `avatarStudio` · `settingsDock` · `playStage` · `cinematic` · (+ Focus/Dual/Whisper as sub-layouts)

---

## 1. Site entry / marketing → forge home

| Live route | Today | Forge mode | Modules | Placement | Notes |
|------------|-------|------------|---------|-----------|-------|
| `/` `(marketing)/page` | Landing hero + micro-demo + features + CTA | **`welcome`** → optional Browse | HoloC welcome · HoloL/R teasers · CorePortal · SparkyOverlay | **IN** (replaces **DROP** hero) | Product decision: forge **is** welcome/main/control. Long marketing sections (features, how-it-works) → either fold into Browse panels or keep as secondary flat scroll behind flag during cutover. |
| `/pricing` | Pricing | `hubSplit` or **FLAT** | HoloC plans · HoloR FAQ | **IN** or **FLAT** | Prefer glass if short; EscapeFlat if comparison tables dense. |
| `/competencies` | Competencies marketing | `hubSplit` / Focus | HoloC story · HoloR list | **IN** | Watch contrast (prior audit). |
| `/privacy` `/privacy/children` `/privacy/rights` | Legal | — | EscapeFlat | **FLAT** | Always flat. |
| `/terms` `/cookies` `/coppa-notice` `/dmca` | Legal | — | EscapeFlat | **FLAT** | Always flat. |

---

## 2. Auth

| Live route | Forge mode | Modules | Placement | Notes |
|------------|------------|---------|-----------|-------|
| `/login` | `authMerged` | CenterWide on HoloC (or merged) · SparkyOverlay tip | **IN** | Forms on glass; EscapeFlat fallback if a11y fails. |
| `/signup` | `authMerged` | same | **IN** | |
| `/forgot-password` | `authMerged` | HoloC | **IN** | |
| `/reset-password` | `authMerged` | HoloC | **IN** | |
| `/mfa-challenge` | `authMerged` or **FLAT** | HoloC OTP | **IN**/FLAT | Prefer flat if timing-sensitive. |

API auth (`/api/auth/*`) — no UI mode.

---

## 3. Kid dashboard (core forge)

| Live route | Forge mode | Modules | Placement | Notes |
|------------|------------|---------|-----------|-------|
| `/home` | `welcome` / `hubSplit` | HoloC continue/mission · HoloL streak · HoloR shortcuts · SparkyOverlay · ToastRail | **IN** | Post-login home = same stage as site welcome (different content). |
| `/labs` | `labsBrowse` | HoloL list · HoloR detail · CorePortal | **IN** | Variation **E** Lab bench. |
| `/labs/[labId]` | Focus → `playStage` or **EXIT** | HoloC lesson · sides tools | **IN** / EXIT | Light labs stay in forge; heavy interactive may EXIT. |
| `/arcade` | `gameLobby` | HoloL games · HoloR preview | **IN** | Variation **F**. |
| `/arcade/[gameSlug]` | **EXIT** (or dim + `playStage` for light) | — | **EXIT** | Phaser/Pixi runtime; return morph to lobby. |
| `/create` | Lab bench / `playStage` | Wide HoloC make · sides tools | **IN** | Prompt / make surface. |
| `/content/[slug]` | Focus | HoloC reader · HoloR related | **IN** | |
| `/story` | Focus / cinematic | HoloC narrative · SparkyOverlay | **IN** | |
| `/progress` | `hubSplit` / Dual | HoloL stats · HoloR chart | **IN** | |
| `/achievements` | `hubSplit` | HoloC badges · HoloR detail | **IN** | |
| `/mastery` | Focus | HoloC path · HoloR claim | **IN** | |
| `/seasons` | `hubSplit` | HoloC season · HoloR rewards | **IN** | |
| `/buddies` | `hubSplit` / Dual | HoloL friends · HoloR invite | **IN** | Social; COPPA-safe. |
| `/profile` | `avatarStudio` | HoloC avatar · HoloR Sparky/companion | **IN** | Sparky overlay + profile glass. |
| `/onboarding` | `welcome` → wizard on glass | HoloC steps · SparkyOverlay | **IN** | |
| `/onboarding/consent` | **FLAT** or authMerged | EscapeFlat / HoloC | **FLAT** preferred | Legal clarity. |

---

## 4. Parent / settings / admin → mostly flat

| Live route | Forge mode | Modules | Placement | Notes |
|------------|------------|---------|-----------|-------|
| `/parent` | — | EscapeFlat | **FLAT** | Parent dashboard. |
| `/parent/add-child` | — | EscapeFlat | **FLAT** | |
| `/parent/subscription` | — | EscapeFlat | **FLAT** | Billing. |
| `/parent/export` | — | EscapeFlat | **FLAT** | |
| `/parent/prompt-history` | — | EscapeFlat | **FLAT** | |
| `/settings` | `settingsDock` or **FLAT** | HoloC prefs or EscapeFlat | **IN**/FLAT | Kid prefs can stay on glass; security → flat. |
| `/settings/mfa` `/sessions` `/linked-accounts` | — | EscapeFlat | **FLAT** | |
| `/settings/legal` | — | EscapeFlat | **FLAT** | |
| `/admin/*` | — | EscapeFlat | **FLAT** | Staff only; never forge theater. |

---

## 5. Dev / bridge (not product)

| Live route | Placement | Notes |
|------------|-----------|-------|
| `/dev/forge` | **BRIDGE** | Existing forge component playground. |
| `/dev/sparky` | **BRIDGE** | Sparky experiments. |
| `/dev/hero-v3` `/dev/branding` `/dev/design` `/dev/game-preview/*` | **BRIDGE** | |
| PR #164 `/dev/forge-lab` (if present on other branches) | **BRIDGE** | Hotspot shell until R3F cutover. |

`/offline` — system; keep plain.

---

## 6. Priority cutover order (product)

1. **`/` + `/home`** → `welcome` / `hubSplit` (forge is home)  
2. **`/login` `/signup`** → `authMerged`  
3. **`/labs` → `/labs/[labId]`** → `labsBrowse` → Focus  
4. **`/arcade` → game EXIT** → `gameLobby`  
5. **`/profile` + SparkyOverlay** → `avatarStudio`  
6. Parent/settings/admin stay **FLAT** from day one  
7. Marketing legal pages stay **FLAT**; `/pricing` `/competencies` fold when ready  

---

## 7. Gaps / decisions for Phase 0

| # | Question | Default if unstated |
|---|----------|---------------------|
| 1 | Does `/` become forge-only, or forge + collapsed marketing scroll? | Forge-first; marketing sections behind “Learn more” flat or Browse panel |
| 2 | `/home` vs `/` same stage different content? | Yes — one stage, auth-aware content |
| 3 | Which labs stay IN vs EXIT? | Heuristic: canvas-heavy / multiplayer EXIT |
| 4 | Sparky on which routes day-1? | `/`, `/home`, onboarding, whisper tips; not parent/admin |
| 5 | Keep AuroraGalaxy landing until R3F flag? | Yes — `NEXT_PUBLIC_FORGE_LAB_R3F` off = current marketing |

---

## 8. Next after this inventory

Phase 0 close → Phase 1 room shell **or** variation stills for Welcome/Browse/Focus/Emit using this map.
