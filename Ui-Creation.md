# SparkForge — UI Creation & Iconography Guide (`Ui-Creation.md`)

**Status:** Active · **Created:** 2026-06-11 · **Owner:** Design/Eng

> **Directive:** No emojis anywhere in the app. Unicode emojis render
> inconsistently across OS/browsers, don't match the Frost‑Prismatic brand,
> blur at large sizes, announce awkwardly to screen readers, and read as
> "AI‑generated slop." This document is the single source of truth for how we
> replace them and how all UI imagery/iconography is produced going forward.

---

## 1. Current emoji footprint (baseline 2026-06-11)

| Metric | Count |
|---|---|
| Total emoji occurrences in `src/` | **1,464** |
| Distinct emoji | **366** |
| UI‑layer (components/app JSX) | **888** |
| Data‑layer (config/lib/types) | **576** |

**Top areas:**

| Count | Area | Kind |
|---|---|---|
| 769 | `src/components/games` | mixed (game content + inline UI) |
| 77 | `src/types/index.ts` | data (type defaults) |
| 60 | `src/config/creatureConfig.ts` | data (creature identity) |
| 59 | `src/lib/social` | data (message templates, badges) |
| 56 | `src/lib/contextarch` | data (game content) |
| 42 | `src/lib/badges` | data (badge identity) |
| 41 | `src/lib/quests` | data (quest templates) |
| 38 | `src/lib/leaderboard` | data |
| 32 | `src/lib/seasons` | data (season identity) |
| 31 | `src/components/3d` | UI |
| 30 | `src/lib/mechanics` | data |
| 18 | `src/lib/pet` | data (mood/species config) |
| 11 | `src/config/labs.ts` | data (`LAB_ICONS` — 11 lab identities) |

The most-used emojis (👑 🧠 ⚡ 🔍 🤖 📊 🔥 ⚖ 🎨 ✨ 🛡 🔬 🎯 😊 🚀 ⭐ …) split into
two intents: **functional icons** (search, chart, shield, target, check) and
**identity/illustration** (labs, games, pets, badges, seasons, characters).

---

## 2. Replacement strategy (two tracks)

### Track A — Functional icons → **lucide-react** (already a dependency)
Anything that is a *UI affordance* (nav, buttons, status, inline meaning,
section headers, empty states) becomes a **lucide SVG icon** via a shared
`<Icon>` wrapper. Consistent stroke, scalable, themeable to lab colors,
accessible (`aria-hidden` + adjacent label). **Zero asset cost.**

### Track B — Identity & illustration → **AI‑pipeline art** (SSIM‑QA'd)
Brand‑level imagery (11 lab glyphs, 42 game icons, pets/creatures, badges,
seasonal cosmetics, story cutscenes) is produced via the existing AI image +
branding render pipeline (`scripts/render-branding.ts`), hand‑cleaned, held to
the **SSIM ≥ 0.96** quality bar, vectorized where possible, and delivered as
SVG (icons) or optimized raster via `OptimizedImage`/`next/image`. These are
*data* emojis today (`LAB_ICONS`, `emoji:` fields) and are swapped to asset
keys as the art lands — **not deleted blindly**, since they carry meaning.

### Emoji → lucide quick map (functional)
| Emoji | lucide | Emoji | lucide |
|---|---|---|---|
| 🔍 | `Search` | 📊 | `BarChart3` |
| 🛡/⚖ | `Shield` / `Scale` | 🎯 | `Target` |
| ✅ | `Check` | 🔒 | `Lock` |
| ⭐ | `Star` | 🏆 | `Trophy` |
| 🔥 | `Flame` | ⚡ | `Zap` |
| 📚 | `BookOpen` | 📝 | `PenLine` |
| 🤝 | `Handshake` | 👁 | `Eye` |
| 🗓️ | `CalendarDays` | 💻 | `Laptop` |
| 🎉 | `PartyPopper` | 🚀 | `Rocket` |
| 🧠 | `Brain` | 🔬 | `FlaskConical`/`Microscope` |

Personality that emojis were faking (reactions, celebration) should come from
**Sparky** (the mascot, with expression states) + the existing particle/motion
systems (ClickSpark, ConfettiEngine, CeremonyFX) — not glyphs.

---

## 3. The no‑emoji guard (enforced)

`tests/unit/no-emoji.test.ts` scans `src/` (excluding `_SUPERSEDED`) for
`\p{Extended_Pictographic}` and asserts the count stays **at or below a
ratchet budget**. The budget only ever moves **down**.

- **Today:** budget = the post‑sweep baseline (see test header for the exact
  number). New emojis fail CI immediately.
- **Target:** `0`. Each migration phase lowers the budget.
- Also enforced at lint time via `@next/next` + a project rule where practical.

> Rule of thumb for contributors: **never add an emoji** to `.ts/.tsx`. Use
> `<Icon name="…">` (lucide) for affordances, or an asset for identity.

---

## 4. Phased migration plan

| Phase | Scope | Output | Status |
|---|---|---|---|
| **E0** | Inventory + guard + this doc | baseline ratchet, plan | ✅ done |
| **E1** | `<Icon>` abstraction (semantic name → lucide) | shared component | ⏳ next |
| **E2** | UI sweep of inline emojis in `components/` + `app/` (non‑game) → lucide | ratchet ↓ | ⏳ |
| **E3** | Lab (11) + game (42) identity glyph set via AI‑pipeline → SVG; swap `LAB_ICONS` + game configs | asset set | ⏳ |
| **E4** | Pets/creatures + badges/seasonal cosmetics art; swap `creatureConfig`, `badges`, `seasons`, `pet` data | asset set | ⏳ |
| **E5** | In‑game content emojis (the 769 in `components/games`) — replace per‑game with icons/art; story/season illustrations | per‑game | ⏳ |

This session completed **E0** and a first slice of **E2** (the social/season
components authored in Phase 8–10). Remaining work is tracked above.

---

## 5. Component / UI conventions going forward

- **Icons:** `<Icon name="…">` (lucide) — never raw emoji. `aria-hidden` when
  decorative; pair with text or `aria-label` when meaningful.
- **Images:** always through `OptimizedImage` / `next/image` (no raw `<img>` —
  enforced by `no-raw-img.test.ts`).
- **Color:** design tokens (`rgb(var(--sf-*))`) + per‑lab `LAB_COLORS`; no new
  hardcoded hexes where a token exists.
- **Contrast:** WCAG AA; no `text-white/10–40` (enforced by
  `no-low-contrast-text.test.ts`).
- **Spacing:** prefer Tailwind scale utilities; arbitrary `[Npx]` values are
  ratcheted by `spacing-tokens-budget.test.ts`.
- **Personality:** use Sparky (mascot) + motion/particles, not emoji.
- **Identity art:** SVG for icons/glyphs; `OptimizedImage` for raster; all
  brand art held to SSIM ≥ 0.96 vs reference.

---

*Generated as part of the Phase 8–10 audit follow‑up. Update the phase table
and the guard budget as migrations land.*
