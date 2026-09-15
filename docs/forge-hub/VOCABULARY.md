# LOCKED — Forge Hub vocabulary (2026-09-15)

**Status:** LOCKED  
**Task:** W0-05  
**Authority:** `TRANSITION_ACTION_PLAN.md` v2.2 §2.1, §2.8b, §2.9, §5 (route table)  
**Decision lock:** `docs/01-decisions/2026-09-forge-hub.md`  
**Plate lock:** `LOCKED_HUB.md` (visual). This file locks **names**.

Agents may not invent panel IDs, mode IDs, or aliases. If a spec disagrees with this lock, this lock (and TAP v2.2) win.

---

## Panels (the only three slab primitives)

The locked plate is a **Holo trio**. Every layout is a placement of one to three of these slabs. There is no top banner.

| ID | Role |
|----|------|
| `HoloL` | Left glass |
| `HoloC` | Center glass |
| `HoloR` | Right glass |

Spell them exactly this way. Do not write `Holo-L`, `holoLeft`, `LeftPanel`, or `TopBanner`.

---

## Modes (`ForgeRouteMode`)

Pathname maps to one of these, or to `FLAT` (stage paused / hidden). Source: TAP §2.1 and §5.

| Mode | Layout | Typical routes |
|------|--------|----------------|
| `welcome` | HoloL and HoloR at ~85% scale (hero key details); HoloC full size (headline + form). `/`, `/login` share the scene; `/signup`, `/forgot-password`, `/reset-password` wipe different content into HoloC **without** a morph. | `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/onboarding` |
| `hubSplit` | **Equal trio** — three destinations on HoloL / HoloC / HoloR (sides grown from 85% after login). Default post-login dock. Not “Top + L + R”. | `/home`, `/achievements`, `/seasons` |
| `labsBrowse` | HoloL list · HoloC selected-lab hero · HoloR detail | `/labs` |
| `gameLobby` | HoloL games · HoloC launch/preview stage · HoloR preview | `/arcade` |
| `playStage` | Three slabs merge into one `PlayStage` slab (yaw 0). Games play here by default. | `/arcade/[gameSlug]`, `/content/[slug]`, `/story` |
| `avatarStudio` | Profile / outfit rack on the trio | `/profile` |
| `settingsDock` | Kid prefs on glass; security routes leave to FLAT | `/settings` |
| `cinematic` | Minimal UI (emit / charge / story beats) | punctuates other modes; `/story` may use it |

### Sub-layouts (not extra slabs)

| ID | Meaning |
|----|---------|
| Focus | HoloC large (~70–80%); sides yaw/tuck. Used on `/labs/[labId]`, `/mastery`, `/competencies`. |
| Dual | Two mid panels; HoloC as a strip. Used on `/progress`, `/buddies`. |
| Whisper | HoloBubble expands; main panels dim. Not a route mode. |

`FLAT` is not a hologram mode: parent, billing, legal, admin, MFA, and dense security settings pause the stage and use `EscapeFlat`.

---

## Other locked module names

| ID | Role |
|----|------|
| `PlayStage` | The **merged** mega-glass (module). Mode id is `playStage`. |
| `HoloBubble` | Sparky’s head-emitter chat hologram (TAP §2.8b). Fourth small glass; not a fourth slab primitive in the trio. |
| `CorePortal` | SF emitter (world mesh): idle → charge → emit → docked. |
| `ToastRail` | Edge chips: offline, demo, verify, toasts, footer/legal chip. |
| `EscapeFlat` | Full-viewport 2D overlay **outside** any transformed wrapper (OVERLAY-CRIT-001). |

---

## Retired names — do not use

| Retired | Use instead | Why |
|---------|-------------|-----|
| `TopBanner` / `Top` | `HoloL` / `HoloC` / `HoloR` | Locked plate has three equal (or welcome-scaled) slabs and **no** top banner. |
| `SideList` / `SideDetail` | `HoloL` or `HoloR` by role | Same trio. |
| `CenterWide` | `HoloC`, or `PlayStage` when merged | Auth forms live on HoloC in `welcome`. |
| `heroWelcome` | `welcome` | TAP §2.9; decision 7. |
| `authMerged` | `welcome` | Login/signup share the welcome composition; forms wipe on HoloC. |
| `SparkyDock` | desk character + `HoloBubble` | No painted dock on the plate (`LOCKED_SPARKY.md`). |
| `SparkyOverlay` as the product Sparky | rigged desk Sparky + `HoloBubble` | Overlay-only Sparky was a Phase 0 draft default; superseded by decision 6. |

---

## Specs that must match this lock

| Spec | What to keep aligned |
|------|----------------------|
| `Phased-R3F-Hub-Plan.md` §3–§5 | Module catalog, modes, route crosswalk (updated W0-05) |
| `TRANSITION_ACTION_PLAN.md` §2 / §5 | Canonical architecture + route table |
| `R3F_VARIATION_PLAN.md` §2–§3 | Already uses the Holo trio; remaining path/copy drift is W0-06 |
| `SCREEN_INVENTORY.md` | Route → mode; remaining `authMerged` / overlay copy is later Scribe pass |

Do not reopen TAP decisions 1–13 to rename these.
