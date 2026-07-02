# Fable-5 SparkForge Rebuild Plan

**Date:** July 1, 2026
**Audit scope:** Full production site (www.sparkforge-labs.com) — marketing pages, auth, all 16 logged-in routes, onboarding flow, gameplay, desktop (1440×900) + mobile (390×844), logged-in and logged-out. ~60 screenshots captured; console/network errors logged per page.
**Auditor stance:** Senior design lead, first day. The question is not "does the UI look nice" — it's *can a normal parent understand the product, trust it, and get their kid playing a game without reading docs?*

---

## 0. Executive Summary

**The verdict:** SparkForge has a genuinely good product skeleton — a clean HTML-first dashboard, a real 42-game library, a working arcade, a COPPA-serious posture, and a mascot (Sparky) that already exists. But the production site fails all three tests today:

- **Understanding** fails because the core loop dead-ends: a logged-in parent with a child profile sees "Create a profile to start" on Home, "Pick a profile first" on Story/Buddies/Create, "No Profile Found" on Profile, and an infinite spinner on every Lab page. One missing default (no fallback to the first child) bricked the whole logged-in experience.
- **Trust** fails because the site contradicts itself everywhere: hero says *30+ games, ages 6–14*; footer says *10 labs, 35 games, ages 7–16*; stats bar says *42 games, 11 labs*; the parent dashboard shows *0h total time* directly above a chart claiming *45m on Pet Trainer* (fake placeholder data); the sidebar shows a hard-coded "Alex — Level 5 Explorer" for every account. On iOS Safari the dashboard crashed outright ("Something went wrong").
- **Conversion** fails because for light-mode visitors (most people during the day) the pricing page renders tier names and **prices** as near-invisible dark-on-dark text, headline words like "How … Works" disappear, every legal/COPPA link in the footer bounced to /login, and password reset was unreachable (/forgot-password → /login loop).

**The good news:** almost all of this was concentrated plumbing, and the worst of it is already fixed and committed on this branch (see §2). What remains is design work — a homepage that earns excitement, a mascot system that makes Sparky a companion instead of a floating PNG, and a game-feel overhaul so the flagship games stop being "four sliders and a Run button."

---

## 1. Root-Cause of the Reported Mobile Bug (IMG_5059)

**Symptom:** "Something went wrong — WebSocket not available: The operation is insecure." full-page crash on iPhone Safari after login.

**Root cause chain (confirmed in production console):**
1. The production CSP `connect-src` allowed `https://*.supabase.co` but **not** `wss://*.supabase.co`. Supabase Realtime upgrades to a WebSocket → blocked by CSP on every page load, for every user.
2. Chrome only logs the violation. **Safari throws a synchronous `SecurityError` from the `WebSocket` constructor.**
3. `useRealtimeChildrenSync` (mounted in the dashboard layout via `RealtimeChildrenBridge`) called `.subscribe()` with no try/catch → the error bubbled to the app error boundary → whole dashboard replaced by the crash screen.

**Fixes (committed):**
- `src/lib/csp.ts` — added `wss://*.supabase.co` to `connect-src` (root cause).
- `src/hooks/useRealtimeChildSync.ts` — realtime subscribe/teardown wrapped in try/catch; realtime is a cache-invalidation enhancement and now degrades silently to normal React Query refetching (defense in depth — also covers Safari Lockdown Mode/private browsing, which throw the same error even with a correct CSP).

---

## 2. Fixes Already Applied on This Branch

| Commit | What | Why it mattered |
|---|---|---|
| `b486d07` | try/catch around Supabase Realtime subscribe | iOS full-page crash (the reported bug) |
| `395347c` | CSP `connect-src` + `wss://*.supabase.co` | Root cause of the crash; realtime was dead for ALL users |
| `64e2419` | Middleware: allowlist `/forgot-password`, `/privacy/children`, `/privacy/rights`, `/coppa-notice`, `/cookies`, `/dmca`, `/offline` | Password reset was unreachable; every legal/COPPA footer link 307'd to /login for logged-out visitors |
| `64e2419` | Middleware: broaden asset bypass (`sw.js`, `manifest.json`, audio/video/GLB/riv/wasm) | Service worker 307'd to /login → PWA completely broken ("script resource is behind a redirect" on every page) |
| `64e2419` | `useActiveChild` falls back to first child when selection missing/stale | **The core-loop dead-end.** Account had a child; every page said it didn't |
| `64e2419` | `data-surface="dark"` opt-out from `.light` theme remap | `.light .text-white { color:#0F172A }` made headlines, pricing tier names, and PRICES invisible for light-mode visitors on the dark marketing/auth pages |
| `64e2419` | Copy unification: **42 games / 11 labs / ages 7–16** everywhere | Hero, footer, features, terms, and how-it-works all disagreed |
| `64e2419` | Sidebar: real active child replaces hard-coded "Alex — Level 5 Explorer" | Fake identity on every account = instant trust kill |
| `64e2419` | Parent analytics + progress charts: fake fallback data removed, honest empty states added | "0h Total Time" next to "Pet Trainer 45m" reads as broken tracking |
| `1d4a0aa` | Lab 11 in tier lists + "All 11 Labs" pricing copy | Pricing promised 10 labs; Lab 11 absent from access lists |

All verified locally (`next dev` boots; routes return 200; light-mode rendering visually confirmed; unit tests green — 2 pre-existing failures unrelated: `design-matrix-sync`, plus 3D-era snapshot drift).

---

## 3. Full Issue Register (P0–P3)

Legend: **U** = hurts understanding, **T** = hurts trust, **C** = hurts conversion. ✅ = fixed on this branch.

### P0 — release blockers

| # | Issue | Hurts | Fix | Status |
|---|---|---|---|---|
| P0-1 | iOS Safari dashboard crash (CSP + unguarded WebSocket) | U/T/C | §1 | ✅ |
| P0-2 | Logged-in app dead-ends on every page despite existing child profile (no active-child fallback) | U | fallback in `useActiveChild` | ✅ |
| P0-3 | Password reset unreachable (`/forgot-password` → `/login`) | T/C | middleware allowlist | ✅ |
| P0-4 | Legal/COPPA pages (`/coppa-notice`, `/privacy/children`, `/privacy/rights`, `/cookies`, `/dmca`) redirect to login | T | middleware allowlist | ✅ |
| P0-5 | Pricing page prices/tier names invisible in light mode | C | dark-surface opt-out | ✅ |
| P0-6 | Service worker + PWA broken in production (auth-gated `/sw.js`) | U | asset bypass | ✅ |
| P0-7 | **Add Child Profile modal renders dark-theme UI on the light app** — heading/inputs near-unreadable; creation fails silently with no error feedback. This is the FIRST action every new parent must take. | U/C | Rebuilt on the light design system; child count now from React Query (the old parentStore count was never hydrated, so the tier check lied); inline validation + API errors; success → /home with the new child active | ✅ |
| P0-8 | Unknown URLs 307 to `/login` (no 404 page reachable when logged out) | U | Middleware now redirects only known protected prefixes; unknown paths render Next's 404 | ✅ |

### P1 — fix before marketing push

| # | Issue | Hurts | Fix | Status |
|---|---|---|---|---|
| P1-1 | Marketing copy contradictions (games/labs/ages) | T | unified to 42/11/7–16 | ✅ |
| P1-2 | Fake data: sidebar "Alex Lv5", parent Time-by-Game, progress This-Week sparkline | T | real data + empty states | ✅ |
| P1-3 | Homepage hero: "Learn AI." near-black on dark bg; light-streak washes out subheadline + trust chips | U/C | Headline fixed by the dark-surface opt-out; added radial scrim + text shadows so the streak can't wash out subheadline/trust chips | ✅ |
| P1-4 | **Lab tier gating unenforced** — `freeLabsAccess`/`previewLabs` have zero runtime consumers. Free accounts get everything; pricing page promises limits that don't exist → no upgrade pressure | C | Implement gate at lab/game entry, upsell modal on locked content | ⬜ Phase 4 |
| P1-5 | "97% Kids Love It" + "5x faster retention" unsubstantiated claims | T | Replaced with honest stats ("0 Ads or Trackers", "100% play-first"); band ages unified to 7–10/11–13/14–16 | ✅ |
| P1-6 | Progress page: "Across all 0 learning labs", duplicated Overall cards, `<path d="undefined">` SVG error on Profile | T | Duplicate card removed (donut is the single source); lab-breakdown empty states added; Sparky falls back to idle on unknown tutor expressions (the SVG error source) | ✅ |
| P1-7 | Lab detail page shows bare infinite spinner (no skeleton, no error state) | U | Loading vs no-profile states distinguished; no-profile shows a Create Profile CTA instead of spinning forever | ✅ |
| P1-8 | Cookie banner: "essential cookies only" link near-invisible; overlaps footer text; on mobile it collides with Sparky avatar + covers "Got It" | U/T | Self-contained explicit colors (immune to theme remaps), z-60 above Sparky, bottom offset clears the mobile nav | ✅ |
| P1-9 | Mobile marketing nav overflows (Privacy/Terms clipped, no hamburger) | U | Hamburger menu on mobile; Privacy/Terms moved out of primary nav (footer keeps them) | ✅ |
| P1-10 | Final homepage CTA is "Sign In"-first ("Login to see the all New Agentic Lab and Games" — awkward grammar, wrong audience) | C | "Create Free Account" is now primary, copy rewritten; Sign In secondary | ✅ |

### P2 — quality of experience

| # | Issue | Hurts | Fix |
|---|---|---|---|
| P2-1 | Flagship gameplay is UI-only (Pet Trainer = 4 sliders + Run button; slider tracks invisible; the "pet" is a stray googly-eye orb overlapping the wrong tile) | U/C | Game-feel overhaul (Phase 5) |
| P2-2 | Level-select screens: flat grey lock tiles, no imagery, no juice | C | Phase 5 template |
| P2-3 | White-frame cards with dark inner panels on homepage look theme-broken | T | Phase 2 design system pass |
| P2-4 | Homepage scroll sections invisible until IntersectionObserver fires (blank 3,600px in static render; fast scrollers see empty page; SEO/social preview sees nothing) | U | ✅ Reveals now trigger 25% before entering the viewport (fast scrollers never see blank sections); full SSR-visible rendering remains a Phase 2 item |
| P2-5 | Arcade star ratings identical (3★) for all games — meaningless | T | ✅ Removed — the 1–3 stars restated tier but read as quality scores (standard games looked like 1-star duds); tier badge remains |
| P2-6 | "1 Children" grammar; "0/1 profiles used (Spark Free)" contradicts "1 Children" stat | T | ✅ Label pluralizes; add-child modal now counts via React Query (same source as the parent stat) |
| P2-7 | GPU stalls (ReadPixels warnings) + deprecated THREE.Clock on homepage hero | — | Phase 2 replaces hero canvas |
| P2-8 | Demo card on login: "Try SparkForge Free" gradient text invisible on white; feature icons render blank | C | ✅ Dark-base metallic text + readable chip colors; MetallicPaint mid-stop no longer hard-coded white |
| P2-9 | 404 resource error on every logged-in page (missing asset) | T | ⚠ Not reproducible after the middleware asset fixes — likely an expired-session API call during the audit; monitor in Sentry |
| P2-10 | Sparky on dashboard is a static PNG in the corner, partially clipped, overlaps cookie banner; zero interactivity despite "floats around the app, ready to help" promise | U/T | Mascot system (Phase 3) |

### P3 — polish backlog

- ✅ Nav Privacy/Terms moved to footer-only; ✅ `<style>`-in-`<h1>` fixed (MetallicPaint keyframes now injected in document.head). Remaining: Search + notification-dot in TopBar do nothing visible; "Most Popular" sort with no popularity data; Seasons/Mastery/Buddies pages are skeletal; Remember-me checkbox unstyled native; hero MP4 fallback absent.

---

## 4. Phase-by-Phase Build Plan

Each phase is shippable on its own. Order chosen so trust/correctness lands before paint, and paint lands before growth features.

### Phase 1 — "Stop the bleeding" (correctness & trust) — ~1 week
*Goal: a parent can sign up, create a child, and land in a working dashboard with zero contradictions.*

1. ✅ All committed fixes in §2 (deploy them).
2. Rebuild **Add Child Profile** as a light-theme modal with: labeled inputs, age chips with visible states, inline validation, API error surfacing, loading state, success → redirect to `/home` with the new child active + a Sparky welcome moment. *(P0-7)*
3. 404 handling: render `not-found.tsx` for unknown paths instead of login redirect. *(P0-8)*
4. Empty/loading/error state sweep: Lab detail skeleton; Progress "0 labs" fix; Profile SVG guard; achievement/mastery/seasons pages get honest "what this will be" empty states. *(P1-6/7)*
5. Cookie banner restyle + z-index/collision audit (mobile bottom-sheet). *(P1-8)*
6. Trace and fix the recurring 404'd resource. *(P2-9)*
7. **Ship gate:** Playwright smoke suite that runs the real flow (signup → add child → open lab → play one round → parent dashboard shows the session) on desktop + iPhone viewport, wired into CI.

### Phase 2 — Homepage & marketing redesign — ~2 weeks
*Goal: a homepage in the league of sentry.io / ciaoenergy / abvtek — animated, functional, unique, clean, exciting — while staying kid-warm for parents.*

**Concept: "The Spark Lab, alive on one page."** Instead of generic dark-SaaS light streaks, the page IS a playable demo:

1. **Hero:** Sparky (Rive-animated, see Phase 3) greets the visitor and reacts to cursor/touch. Headline set in the display font with guaranteed WCAG contrast (no more near-black-on-black). One primary CTA ("Start Free — no card") + one secondary ("Watch 60-sec tour"). Live product frame under the fold showing the real dashboard, Sentry-style.
2. **Interactive proof, not claims:** an embedded 20-second micro-game (e.g., a 3-round "teach Sparky to sort" demo — real mechanics from Sort Toy Box) directly on the homepage. Visitors *play* before signing up. This is the single highest-leverage conversion element and none of the reference sites can do it — it's uniquely ours.
3. **Scroll narrative with GSAP pinning (ciaoenergy-style):** Build → Learn → Earn chapters, each pinned section driven by scroll progress, with the stat bar (42 games / 11 labs / 1,200+ questions) animating in. Kill the invisible-until-observed sections (P2-4): everything below the fold gets `initial={false}` or a 0.99-opacity start so static rendering is never blank.
4. **Labs ring:** the existing `LabDiscoveryRing` reworked into a horizontally scrubbed lab carousel with each lab's icon, color, and one-line "your kid will be able to…" outcome.
5. **Trust strip for parents:** COPPA badge linking to the (now reachable) notice, "no ads / no tracking / no real names", real testimonials when available — numbers only when substantiated (P1-5).
6. **Footer CTA:** signup-first (P1-10), demo session as secondary.
7. Mobile: hamburger nav (P1-9), hero type scale, chapter sections collapse to swipe cards.

**Design system notes:** keep the light dashboard aesthetic for the app; marketing stays dark but from tokens (`data-surface="dark"` already in place). One accent gradient (blue→magenta) used consistently; white-frame/dark-core card style (P2-3) replaced by single-surface cards.

### Phase 3 — Sparky: one mascot, everywhere, interactive — ~1.5 weeks
*Goal: Sparky is the product's memory hook and the kids' companion — uniform on marketing, dashboard, games, empty states, and celebrations.*

**Tech: Rive** (`@rive-app/react-canvas` is already a dependency and `public/rive/` exists — finish the job). One `.riv` file, one state machine, consumed by a single `<SparkyAvatar>` component with a `mood` input:

- **States:** idle (blink/bob/look-at-cursor), happy, celebrating (level-up/badge), thinking (AI tutor is generating), sleeping (inactivity), waving (onboarding/first visit), sad-encouraging (wrong answer — never punitive).
- **Placement contract:** marketing hero (large, cursor-tracking); dashboard corner buddy (32–48px, opens AI tutor on tap — replaces the clipped static PNG, never overlaps banners); game overlays (reacts to correct/incorrect in every game via a `useSparkyReaction()` hook tied to the existing game store events); every empty state (Sparky holding a sign: "No badges yet — let's earn one!"); loading states (Sparky orbits instead of a bare spinner).
- **Voice:** one copy deck for Sparky lines (age-band aware A/B/C), so tone is consistent — curious, encouraging, never sarcastic.
- **A11y:** all Sparky reactions mirrored by `aria-live` announcements; honors reduced-motion (falls back to static poses).
- Deliverable includes a `SparkyShowcase` dev page (`/dev/sparky`) demonstrating every state for review.

### Phase 4 — Retention & conversion mechanics — ~2 weeks
*Goal: the business model actually functions and kids have a reason to come back tomorrow.*

1. **Enforce tier gating** (P1-4): lab/game entry checks `TIER_CONFIG`; locked content shows a friendly Sparky upsell ("Ask a grown-up to unlock the whole lab!") → parent-gated checkout. Free tier: Labs 1–3 + first game of each other lab, 3 games/week — exactly what pricing promises.
2. **Daily loop:** daily challenge card on Home (one game, bonus XP), streak shield mechanics surfaced, "continue where you left off" hero card (the current Home empty state gets replaced by a real dashboard: next-up game, streak, weekly goal ring, latest badge).
3. **Parent weekly email** (Resend already configured): what your kid learned this week, in plain language — the retention channel for the *payer*.
4. **Onboarding tour:** first login walks through Labs → Arcade → Rewards with Sparky (react-joyride is already a dependency).
5. **Real analytics wiring:** session tracking → parent dashboard Time-by-Game and weekly charts use real aggregates (the empty states from Phase 1 fill in).

### Phase 5 — Game-feel overhaul, all 42 games — ~4–6 weeks (parallelizable)
*Goal: games a kid would choose over YouTube, not homework with sliders.*

**The core problem observed:** the flagship game's play phase is a parameter form. There's no pet on screen, no consequence animation, no sound, no reason to care. The fix is a shared "juice layer" so all 42 games improve at once, then flagship-by-flagship depth.

1. **Shared `GameStage` framework (week 1):**
   - `<GameStage>` — canvas region with themed backdrop per lab color, entity layer, and particle/confetti systems (PixiJS for 2D — already a dependency — R3F only where 3D earns its cost).
   - **Juice kit:** squash-and-stretch on interaction, count-up scores, screen-shake on big wins, combo streaks, Tone.js sound pack (correct/incorrect/level-up/ambient per lab), haptics on mobile.
   - **Reward cadence:** every game ends with the same celebration ritual (stars fill, XP counts up, Sparky reacts, "one more level?" CTA) — consistency builds the habit.
2. **Flagship depth pass (weeks 2–4), one at a time:**
   - *Pet Trainer:* an actual animated pet (Rive or sprite sheet) front and center. Sliders become physical actions — drag a treat to the pet, timing minigame for reward-timing; the pet visibly learns (fetches faster, fails funnier). The RL concept lands *through the pet's behavior*, not through percentages.
   - *Neural Builder:* drag neurons, watch signals actually flow as glowing pulses; sandbox mode.
   - *Sort Toy Box:* physics toss (drag-fling with @use-gesture + spring), toys react.
   - *Prompt Lab:* chat-style UI with Sparky as the model; streaming responses.
   - Remaining flagships equivalent treatment.
3. **Standard-tier uplift (weeks 4–6):** apply GameStage + juice kit + per-lab theming to all 20 standard games mechanically (the audit docs' content expansions already exist); every game gets its level-select replaced by a themed map with art per node (no more grey lock tiles).
4. **Difficulty honesty:** wire real star ratings and per-child adaptive difficulty (adaptive-engine exists in `src/lib`).

### Phase 6 — Release readiness — ~1 week
1. Lighthouse + axe pass on every route (fix the `<style>`-in-`<h1>`, focus traps, contrast tokens).
2. Sentry: verify release tagging, alert rules on error-rate spike, session replay on crash.
3. Load/perf: hero canvas budget, `next/image` everywhere, bundle analysis (drop `@mlc-ai/web-llm` from the client bundle if unused on critical paths — it's enormous).
4. Legal pass: cookie policy matches the "no analytics" claim; COPPA consent flow e2e test.
5. Beta cohort: 10 families, watch session replays, fix the top 5 confusions, then launch.

---

## 5. Direct Answers to Your Questions

**"How would you improve the UI?"** — The app shell (light dashboard) is honestly good: clean sidebar, readable type, sensible cards. The problems are (a) the two-theme collision that made dark components render inside the light app and vice versa — solved structurally with surface tokens (`data-surface`), never per-component colors; (b) dead-end states instead of guidance — every empty state should tell the user the next action (Phase 1); (c) the marketing site and app feel like two unrelated products — Sparky + the shared accent gradient + consistent type scale bridge them (Phases 2–3).

**"How would you create a uniform, interactive mascot?"** — Sparky already exists in three inconsistent forms (marketing hero robot, dashboard corner PNG, login demo icon). Don't invent a new character — *canonize* this one in Rive with a single state machine and a placement contract (Phase 3). Rive is the right tech: vector (crisp at every size), state-machine-driven (reacts to game events with zero re-render cost), tiny runtime, and it's already in your package.json.

**"How would you redo the homepage?"** — Phase 2. The one idea to keep even if you cut everything else: **put a real playable 20-second micro-game in the hero.** Sentry shows you the product immediately; ciaoenergy makes scroll feel physical; abvtek commits to a bold visual identity. Ours is "your kid can play this right now" — no signup, no video, an actual game. Nothing else in the kids-edu space does this on their landing page.

**"How would you revamp all 42 games?"** — Phase 5. The leverage is the shared GameStage/juice framework: one investment that lifts all 42 at once (celebration ritual, sound, particles, themed level maps), then depth passes on the 13 flagships where a visible, animated *subject* (the pet, the network, the toys) replaces abstract form controls. A kid should be able to describe every game as "the one where you ___" — if the answer is "move sliders," the game isn't done.

**New tech needed (all stable, no functional conflicts):**
- **Rive** for the mascot — *already installed, just unused.*
- **PixiJS** (`@pixi/react`) for 2D game stages — *already installed.*
- **@use-gesture/react** for drag/fling physics in games (~small, pairs with existing Motion springs).
- **howler.js** *optional* — only if Tone.js feels heavy for simple SFX sprites; otherwise keep Tone.
- Recommend **removing/lazy-gating** `@mlc-ai/web-llm` unless the local-tutor path ships soon — it's the biggest bundle risk in the stack.

---

## 6. What I did NOT touch (per your guardrails)

No payment, delete, or publish actions were executed. Stripe flows were viewed but never initiated. No child profiles were successfully created on your account (one attempt during flow-testing failed silently — which is itself finding P0-7). No production data was modified; all fixes are code-only on branch `claude/sparkforge-audit-redesign-8izdpd`.

## 7. Deploy checklist for the committed fixes

1. Merge this branch → Vercel deploy.
2. Verify on production: `/forgot-password` 200, `/coppa-notice` 200, `/sw.js` 200 (no redirect), no CSP violation for `wss://…supabase.co` in console, dashboard loads with the real child profile active on iPhone Safari.
3. The audit screenshots live in the session scratchpad; the issue register above is the durable record.


---
---

# PART II — The 42-Game Audit & Redesign (July 1, 2026)

**Method:** Every game component was read end-to-end against its `gameRegistry` entry by a five-reviewer panel (one per lab cluster), scored for **Learning** (does it honestly teach its AI concept?) and **Fun** (interaction depth, feedback, replayability), each with a concrete redesign. In parallel: research on the mid-2026 AI landscape (UNESCO framework update, AI4K12/CSTA 2025, agentic-literacy research, Common Sense Media 2026 census) and design-pattern analysis of the top kids' learning apps (Duolingo/ABC, Khan Kids, codeSpark, Scratch, Toca Boca, DragonBox, Prodigy, Osmo). Live gameplay was verified in the browser for a sample of games. This section supersedes and expands Part I's Phase 5.

## II.1 The verdict in one paragraph

The library's *curriculum map* is genuinely excellent — 11 labs that track the real arc of AI including the 2026 agentic era, with content copy that is mostly accurate and often lovely. The *games themselves* are not games yet: *average Learning 4.4/10, average Fun 3.9/10*. Verdicts: **2 KEEP, 10 POLISH, 26 REDESIGN, 4 REPLACE.** The cause is structural, not 42 individual failures — a "v4 rewrite" flattened almost everything into six cloned mini-engines with recycled 11–18-item content banks, while the *real* games (already designed, and in seven cases already ~80% coded in `src/lib/`) were left unwired. The fastest path to a great library is not building 42 new games; it is fixing six systemic defects and connecting the engines that already exist.

## II.2 Systemic findings (fix once, heal dozens)

**S1 — The clone problem.** 30+ games are re-skins of six archetypes: SORT (drag chips into bins ×9 games), CONNECT (wire the only non-grey nodes ×7), REVEAL (tap word tiles ×4), REACT (whack-a-mole ×2), QUIZ (radio buttons + timer ×4), SIMULATION (four sliders vs. hidden target numbers ×5). Kids will notice they're playing the same game 42 times. The archetypes themselves are fine *primitives* — the fix is per-game verbs and consequences on top of them.

**S2 — The orphaned-engine scandal (biggest single finding).** For seven flagships, the registry describes rich games whose engines are **already implemented in `src/lib/` and never imported by the shipped component**:
- `src/lib/agentatelier/` — wireGraph with typed ports, cycle detection, topological mission runner, agent roster → shipped as 4 sliders.
- `src/lib/mcplab/` — toolCatalog + toolBinding → shipped as an 11-question quiz.
- `src/lib/glassbox/` — auditEngine + issueDetector (step-through trajectory debugging) → shipped as a 12-question quiz.
- `src/lib/harness/` — filterLayer/validatorLayer/monitorLayer + stressTestFixtures → shipped as 4 sliders.
- `src/lib/pocketbrain/` — **a complete WebLLM on-device model service** (engine lifecycle, streaming, tokens/sec, expert-routing viz, WebGPU capability detection) → shipped as 4 sliders. The registry's "Run a real AI in your browser tab. No internet" is currently false advertising; the code to make it true is sitting in the repo.
- `src/lib/contextarch/` — budgetEngine + cardLibrary (token-budget shelf game) → shipped as a quiz.
- `src/lib/pixelwitness/` — clipLibrary + judgeEngine (cross-examine an AI witness) → shipped as a text quiz about images with no images.
Wiring these seven is the highest-leverage work in the entire platform: flagship-quality games for integration cost, not design cost.

**S3 — Content starvation.** Most games hold one 11–18-item bank and slide a modulo window over it across "10 levels," so themed levels ("Movie Reviews," "Hospital," "Sarcasm") serve the same generic items and kids see everything by level 3. Fix: per-level themed banks (the AI content pipeline with its 60 Standard content types + admin curation was built for exactly this) and cut 10 levels to 5 distinct ones where content is thin.

**S4 — Self-answering interactions.** CONNECT games color decoy nodes grey (the answer is visually telegraphed); SORT chips leak answers via accessibility labels (`name: '"the" (Word)'`) or self-labeling text ("Adv. Patch" → obviously the attack bin); Ethics Courtroom displays argument-strength badges *before* you choose; Word Predictor prints the probability bar on the card you're supposed to predict. Nothing that reveals the answer may render before the child commits.

**S5 — Dishonest simulation.** Games that claim to model AI don't: Neural Builder's accuracy is independent of the network you build; Sort Toy Box's "AI clustering" is `indexOf % maxGroups` with random noise and always-true scoring; Agent Architect's Decide/Check branches are `Math.random()`; the 4-slider SIMULATION games score distance to hidden magic numbers. For an *AI-literacy* product, faking the AI is anti-curriculum. Every simulation must be causally honest, however tiny.

**S6 — Age bands are marketing, not code.** Registry `ageBands: [A,B,C]` on nearly every game; almost no component reads the child's band (question `band` tags exist and are never filtered — band-C attention-math reaches 7-year-olds). Implement band gating in the shared renderers once: filtered banks, band-specific instructions, band-C bonus layers.

**Also systemic:** broken `useState`-as-effect timers (Sort Toy Box, Neural Builder — timed levels silently don't exist); stale registry metadata (promised 3D scenes/mechanics that don't exist — make the registry honest or make it true); dead code modes (Prompt Lab's Battle/History, Agent Architect's 10 authored debug challenges — finished features, never enabled).

## II.3 Scoreboard — all 42 games

| # | Game | Lab | Tier | Learn | Fun | Verdict |
|---|---|---|---|---|---|---|
| 1 | AI Spy | 1 | std | 6 | 6 | POLISH |
| 2 | Time Machine | 1 | std | 5 | 5 | POLISH |
| 3 | Human vs Machine | 1 | std | 4 | 5 | REDESIGN |
| 4 | AI Pet Trainer | 2 | flagship | 3 | 2 | **REPLACE** |
| 5 | Sort Toy Box | 2 | flagship | 4 | 5 | REDESIGN |
| 6 | Treat Trainer | 2 | std | 6 | 7 | **KEEP** |
| 7 | Data Detective | 2 | fl-lite | 6 | 3 | REDESIGN |
| 8 | Neural Builder | 3 | flagship | 3 | 3 | REDESIGN |
| 9 | Neuron Relay | 3 | std | 4 | 5 | REDESIGN |
| 10 | Pixel Investigator | 3 | std | 4 | 4 | REDESIGN |
| 11 | Prompt Lab | 4 | flagship | 8 | 7 | **KEEP** |
| 12 | Word Predictor | 4 | std | 5 | 6 | POLISH |
| 13 | Token Chopper | 4 | std | 5 | 4 | REDESIGN |
| 14 | AI Art Detective | 4 | std | 4 | 4 | REDESIGN |
| 15 | Agent Architect | 5 | flagship | 7 | 6 | POLISH |
| 16 | Robot Vacuum | 5 | fl-lite | 2 | 2 | **REPLACE** |
| 17 | Tool Picker | 5 | std | 5 | 4 | POLISH |
| 18 | Bias Detective | 6 | flagship | 6 | 5 | REDESIGN |
| 19 | Data Shield | 6 | std | 6 | 4 | POLISH |
| 20 | Real or Fake | 6 | std | 4 | 4 | REDESIGN |
| 21 | Ethics Courtroom | 6 | std | 8 | 3 | POLISH |
| 22 | Camera Quest | 7 | fl-lite | 3 | 4 | REDESIGN |
| 23 | Fool the AI | 7 | std | 5 | 4 | REDESIGN |
| 24 | Build Classifier | 7 | std | 5 | 5 | POLISH |
| 25 | Prediction Market | 7 | std | 4 | 4 | REDESIGN |
| 26 | Sentiment Scanner | 8 | std | 6 | 5 | POLISH |
| 27 | Chatbot Builder | 8 | fl-lite | 3 | 3 | REDESIGN |
| 28 | Lost in Translation | 8 | std | 3 | 3 | REDESIGN |
| 29 | Emoji Decoder | 8 | fl-lite | 4 | 4 | POLISH |
| 30 | Code Blocks | 9 | fl-lite | 4 | 3 | REDESIGN |
| 31 | Career Explorer | 9 | std | 3 | 3 | REDESIGN |
| 32 | API Explorer | 9 | std | 7 | 5 | POLISH |
| 33 | My First AI App | 9 | fl-lite | 3 | 3 | REDESIGN |
| 34 | Future Forge | 10 | fl-lite | 2 | 3 | **REPLACE** |
| 35 | AI or Not? | 10 | fl-lite | 2 | 5 | REDESIGN |
| 36 | Agent Atelier | 11 | flagship | 3 | 3 | REDESIGN† |
| 37 | MCP Plug-and-Play Lab | 11 | flagship | 3 | 2 | REDESIGN† |
| 38 | Glass Box Lab | 11 | flagship | 4 | 2 | REDESIGN† |
| 39 | Harness Forge | 11 | flagship | 3 | 3 | REDESIGN† |
| 40 | Pocket Brain | 1 | flagship | 3 | 3 | **REPLACE**† |
| 41 | Context Architect | 8 | flagship | 5 | 3 | REDESIGN† |
| 42 | Pixel Witness | 7 | flagship | 3 | 2 | REDESIGN† |

† = the redesign/replacement is *already ~80% coded* in `src/lib/` (see S2) — integration work, not invention.

**Read of the table:** the two KEEPs (Prompt Lab — the only game where kids touch a real model; Treat Trainer — the only real Phaser game) point at exactly what works: *real systems and real spatial gameplay.* The seven † flagships are the cheapest path to seven more games of that quality. The worst offenders are the five SIMULATION slider games (Pet Trainer, Robot Vacuum, Agent Atelier, Harness Forge, Pocket Brain) — every one is "guess four hidden numbers," and three of them are flagships.

## II.4 Game-by-game findings and redesigns

### Labs 1–3 — Foundations, Machine Learning, Neural Networks

#### 1. AI Spy (`ai-spy`, Lab 1, standard)
- **What it is now:** Real Pixi play — `PixiRevealStage` (RevealMap archetype) inside GameShell. 10 levels × 8 tap-to-reveal tiles: tap objects that "use AI," get a why-card, combo scoring. But only 3 real tile pools; levels 4–10 remix the same objects via modulo plus a shared 8-item hard pool, so content repeats hard and level themes ("Hospital," "Space Station") don't match the tiles shown. Age bands: cosmetic — no branching on `age_band` anywhere.
- **Learning: 6/10** — the sense/learn/predict heuristic and per-object why-cards genuinely teach where AI hides; misleading level theming and repetition dilute it.
- **Fun: 6/10** — tapping mystery tiles with combo/reveal feel is decent; replay collapses after level 3.
- **Verdict:** POLISH
- **Redesign:** Keep the hunt loop but give each level a themed illustrated scene (RevealMapScene with scene art, not label chips) and its own 8-tile pool. Sparky "scans" a tapped object with a beam before revealing. 2026 update: add on-device assistants and AI camera search tiles; band-C "why do you think so?" prediction toggle before reveal.

#### 2. Time Machine (`time-machine`, Lab 1, standard)
- **What it is now:** `PixiBinSortStage`: drag milestone chips into three era bins (pre-2000 / 2000–2020 / 2020+). 18-milestone bank rotated across 10 near-identical levels. One-shot assignment, why-cards give real dates. Includes MCP/agents chips, so 2026-current. No age-band logic.
- **Learning: 5/10** — three coarse buckets teach "old vs recent vs now," not a timeline; ordering, causality, and the AI-winters story are absent.
- **Fun: 5/10** — drag-sort with combos is fine but ten levels of the same 18 chips is padding.
- **Verdict:** POLISH
- **Redesign:** Replace bins with an actual draggable timeline track (ordered slots): place milestones in sequence, and Sparky rides a time-machine cart along the placed timeline narrating each stop. Later levels ask "what enabled what" (ImageNet → AlexNet → GPT-3 chains). Band-C-only chips (transformers, RLHF, MCP).

#### 3. Human vs Machine (`human-vs-machine`, Lab 1, standard)
- **What it is now:** Identical skeleton to Time Machine: two bins ("Humans win"/"Machines win"), 16-task bank rotated across 10 levels. Levels 6/9 promise "tricky tasks" but draw from the same clean-binary bank. No age-band differentiation.
- **Learning: 4/10** — the core frame is the problem: in 2026, "creative storytelling" and "translating 100 languages" as clean human/machine wins teaches kids a confident falsehood. Complementarity is asserted in why-cards, never experienced.
- **Fun: 5/10** — the drag loop works; zero surprise after level 2 because answers are stereotype-guessable.
- **Verdict:** REDESIGN
- **Redesign:** Three bins — Humans, Machines, *Better Together* — and make the gray zone the game: place a chip, then see a "2026 reality check" card (e.g., AI drafts, human judges). Sparky hosts as a game-show referee between a kid avatar and a robot contestant.

#### 4. AI Pet Trainer (`pet-trainer`, Lab 2, flagship)
- **What it is now:** Flagship in name only — a 107-line wrapper around the generic `SimulationLevelRenderer`. Play phase is four DOM sliders (Reward/Repetition/Patience/Consistency), a Run button, and a scalar score computed from distance to a hidden per-level target vector. Auto-completes after 3 attempts. No pet on screen beyond an emoji; registry still claims `Pet3DScene` — dead metadata. No age bands.
- **Learning: 3/10** — CONCEPTS text is lovely (hyperparameters, generalization), but blind-guessing four hidden numbers teaches nothing about reinforcement learning; feedback doesn't even say which slider to move.
- **Fun: 2/10** — slider roulette with three tries.
- **Verdict:** REPLACE
- **Redesign:** Real trial-based RL loop on a Pixi `ReactionArena`: pet attempts a trick, kid taps Treat or "No" within a timing window, and a visible behavior meter shifts per feedback — reward the wrong attempt and the pet learns the wrong trick (comedy = the lesson). Pet evolves across levels; Sparky is the vet coach explaining reward signals.

#### 5. Sort Toy Box (`sort-toy-box`, Lab 2, flagship)
- **What it is now:** Real Pixi drag (`PixiSortStage`) — 9–18 toys per level into 3–6 group bins, then a staged "AI clustering" reveal. But the scoring is theater: `isGoodGrouping` is effectively always true, the "AI" clusters by `indexOf(type) % maxGroups`, `hiddenWeight` is random noise, the accuracy bonus compares raw group indices with no cluster-label matching (correct sorting can score as wrong), and the timer is a broken `useState`-as-effect that never ticks — so timed levels 5/7/9/10 don't exist. Level 7 "beat the AI" is unimplemented. No age bands.
- **Learning: 4/10** — sort-then-see-how-AI-grouped is the right idea; fake feedback makes it dishonest.
- **Fun: 5/10** — dragging toys feels good; consequences don't.
- **Verdict:** REDESIGN (keep the loop, fix the truth)
- **Redesign:** Run real k-means on the declared features, show centroids moving live in the reveal, score via permutation-matched agreement, fix the timer. Sparky narrates each k-means iteration.

#### 6. Treat Trainer (`treat-trainer`, Lab 2, standard)
- **What it is now:** The one Phaser game (`PhaserMazeStage`) — genuinely real: procedural recursive-backtracker maze (4×4 → 9×9), wall collision, arrow/WASD/d-pad movement, treats, step counting, a BFS "Plan path" hint, efficiency scoring against a greedy optimal tour. Real difficulty scaling. Keyboard/AT support.
- **Learning: 6/10** — pathfinding/search framing is honest and the hint makes BFS visible; the player never sees the search *explore* (frontier expansion).
- **Fun: 7/10** — the best moment-to-moment gameplay in the library; fewer-steps-more-stars gives real replay pressure.
- **Verdict:** KEEP (light polish)
- **Polish:** Add a "watch the AI think" mode animating BFS flood-fill before the hint; dog sprite instead of a circle; Sparky as the drone overhead calling out dead ends. Band-C bonus: compare BFS vs greedy tour step counts.

#### 7. Data Detective (`data-detective`, Lab 2, fl-lite)
- **What it is now:** Plain DOM quiz via `QuizLevelRenderer` — radio buttons, 20s timer. A 12-question bank stretched to 10 levels × 8 questions by modulo. One nice drag-to-order data-pipeline bonus round, level 1 only. Question `band` tags exist but are never filtered. Registry claims `DataDetective3D` — not wired.
- **Learning: 6/10** — the content is the strongest in Lab 2: Amazon hiring bias, pulse oximeters, proxy variables, demographic parity — real and age-appropriate. Delivery wastes it.
- **Fun: 3/10** — a quiz with radio buttons, repeated.
- **Verdict:** REDESIGN
- **Redesign:** Turn each scenario into a case: a small fake dataset on a `RevealMapScene` evidence board, kid taps the suspicious rows/columns to reveal the flaw, then names the bias type (bin sort). Sparky plays noir detective sidekick. Reuse every existing scenario as case files; the pipeline drag-order becomes the case-closing ritual.

#### 8. Neural Builder (`neural-builder`, Lab 3, flagship)
- **What it is now:** Plain DOM/SVG. Build (buttons add layers/nodes), train (click "Train Epoch" watching a bar), test. All simulated dishonestly: accuracy = base + epoch boost + random noise, *completely independent of the architecture you built*; the 5 tests are coin flips; same broken timer bug; level 6 speed and level 7 overfitting challenges are flavor text.
- **Learning: 3/10** — teaches vocabulary while modeling a false causal story: click Train, number goes up, architecture irrelevant. Anti-learning for a flagship.
- **Fun: 3/10** — button-clicking with a progress bar.
- **Verdict:** REDESIGN
- **Redesign:** Actually run a tiny real network (2–6 inputs is trivially trainable in JS) on visible 2D point datasets; architecture and epochs genuinely change the decision boundary, overfitting genuinely appears. Render the net + boundary on `ConnectBoardScene`; Sparky flags overfit ("it memorized!").

#### 9. Neuron Relay (`neuron-relay`, Lab 3, standard)
- **What it is now:** Real Pixi wiring (`PixiConnectStage`): drag edges from Input through layered neurons to Output; correct wires glow green. 10 handcrafted networks — but tiny: the correct path is 2–4 edges, exactly one right answer, decoys pre-labeled "(dead)". "Backprop Path" level is forward wiring with a renamed card.
- **Learning: 4/10** — tactile, but teaches a misconception: real networks activate *all* weighted connections, not one routed path; labeling decoys "dead" removes any inference.
- **Fun: 5/10** — wiring feels nice; levels are over in seconds.
- **Verdict:** REDESIGN
- **Redesign:** Make it signal *strength*, not path-finding: every wire carries the signal multiplied by a visible weight; the kid adjusts weights so the output crosses a firing threshold — Sparky's meter shows the sum live. A reverse "backprop" mode dims wrong weights. Same ConnectBoardScene, honest mental model.

### Labs 3–5 — Vision, Generative AI, Agents

#### 10. Pixel Investigator (`pixel-investigator`, Lab 3, standard)
- **What it is now:** 10 levels of `PixiRevealStage` tap-to-reveal, but tiles are *text labels* ("Natural sensor grain", "JPEG block artifact") from one 16-item bank; level themes are cosmetic. Wrong taps only shave a bonus, so brute-forcing everything wins.
- **Learning: 4/10** — concept copy is genuinely good (edges, EXIF, PRNU, feature maps), but the mechanic is memorizing which phrase is a "target." A computer-vision game containing zero images.
- **Fun: 4/10** — some Pixi juice; by level 3 you've seen every tile.
- **Verdict:** REDESIGN
- **Redesign:** Put a real photo under the reveal grid: tiles uncover zoomed pixel patches; the kid flags where the detector should fire, then compares against Sparky's bounding boxes with confidence %. Add a toggleable edge-detection/feature-map filter. 2026 update: a C2PA content-credentials clue type.

#### 11. Prompt Lab (`prompt-lab`, Lab 4, flagship)
- **What it is now:** Real freeform chat with Claude via `/api/ai/prompt-lab` (per-band Sparky system prompts, moderation, tier daily limits). Temperature dial, 15 template categories (~50 prompts), 8 fill-in patterns, 6 technique cards, 12 regex-checked challenges, 5-axis heuristic prompt scoring, Prompt X-Ray. Band gating is real (Band C gets a system-prompt sandbox).
- **Learning: 8/10** — the only game where kids practice against a real model; techniques (CoT, few-shot, personas, constraints) are current and correct. Weaknesses: the server *discards* `conversationHistory` (multi-turn is an illusion), challenges mostly regex the *prompt* not the response, keyword scorer is stuffable.
- **Fun: 7/10** — open sandbox is inherently replayable; Battle/History/Recipes modes are dead underscore-prefixed code; dark-theme styling clashes with the light dashboard.
- **Verdict:** KEEP (with polish)
- **Polish:** Wire history server-side for true multi-turn; judge challenges via a cheap Claude rubric call; ship Prompt Battle (two prompts, Sparky judges A/B); restyle to light theme.

#### 12. Word Predictor (`word-predictor`, Lab 4, standard)
- **What it is now:** 10 levels of a 26-second `PixiReactStage` reaction drill: candidate next-words rise as cards with probability bars; tap the likeliest before it fades. Only 3 prompts per level (30 total).
- **Learning: 5/10** — "LMs output a probability distribution" is honestly staged, and the progression (famous phrases → ambiguous flat distributions → code) is smart. But the prob bar is printed *on the card*, so the skill is "tap the biggest bar," not predicting.
- **Fun: 6/10** — genuine arcade tension, real motion; content dries up fast and the answer-on-card kills mastery.
- **Verdict:** POLISH
- **Redesign:** Two-beat loop: cards spawn *without* bars, kid commits, then the distribution animates in and scores by the probability of their pick (partial credit for plausible words). Band C bonus: same sentence at temperature 0 vs 1. Prompt pool to 10+/level via the existing `ai-content-generator` pipeline.

#### 13. Token Chopper (`token-chopper`, Lab 4, standard)
- **What it is now:** `PixiBinSortStage`: drag token chips into Word / Subword / Punct / Special bins; 18-chip bank recycled. Bug: the accessibility label embeds the answer — `name: '"the" (Word)'` — so the keyboard strip leaks the correct bin.
- **Learning: 5/10** — token categories are accurate and worthwhile (B/C only, correctly), but the game named "Chopper" never chops: you never see a sentence split, never count tokens, never hit a limit.
- **Fun: 4/10** — a labeled vocabulary quiz in drag clothing.
- **Verdict:** REDESIGN
- **Redesign:** Show a real sentence on the stage; the kid taps *cut points* to slice it, then a real client-side BPE tokenizer reveals the model's actual splits — score by boundary match, with a live token-count/limit meter. Sparky wields the chopper blade. 2026 update: compare token costs ("emoji cost 3 tokens!") to seed context-budget intuition.

#### 14. AI Art Detective (`ai-art-detective`, Lab 4, standard)
- **What it is now:** SORT clone: drag text clues ("Six-fingered hand", "Visible brush strokes") into Human-made / AI-made bins. The header comment promises "why-card zooms in on the artifact" — no images exist anywhere.
- **Learning: 4/10** — an art-detection game with no art is sorting vocabulary. Worse, the curriculum is *dated for 2026*: hands, garbled text, and melting backgrounds are largely solved by current image models, so it trains overconfidence in dead tells.
- **Fun: 4/10** — same drag loop as its siblings; kids will feel the copy-paste.
- **Verdict:** REDESIGN
- **Redesign:** Actual bundled image pairs on `RevealMapScene` — zoom, flag suspicious hotspots, then render a verdict with confidence; Sparky reveals the ground truth and the *process*. Center the 2026-correct lesson: artifacts fade, so teach provenance — C2PA credentials, reverse-search, context — as the reliable detection layer.

#### 15. Agent Architect (`agent-architect`, Lab 5, flagship)
- **What it is now:** Real construction game: 18 band-gated missions, 15 block types (Goal/Search/Tool/Decide/Check/Loop/Memory/Parallel/Human/Filter/…) with unlock progression, click-to-connect canvas, per-block config, live pseudocode generator (Band C), cinema-mode run with step narration, star report, 3D pipeline scene. Fatal flaw: Decide/Check branches resolve by `Math.random()` and block configs never affect execution. Debug/Sandbox/Replay modes plus 10 authored debug challenges are dead code; `completeGame()` fires after one mission.
- **Learning: 7/10** — decomposition, tool use, loops, validation, human-in-the-loop are the right 2026 curriculum, and band differentiation is real. The coin-flip simulation undermines it.
- **Fun: 6/10** — building + watching it run is a real loop; placement is fiddly.
- **Verdict:** POLISH
- **Redesign:** Give each mission a tiny world-state so Decide/Check outcomes depend on configs (deterministic, replayable); ship the 10 debug challenges as a "fix the broken agent" mode. 2026: label Tool blocks as MCP tools and add a token/cost budget per run.

#### 16. Robot Vacuum (`robot-vacuum`, Lab 5, fl-lite)
- **What it is now:** `SimulationLevelRenderer`: four sliders (Sensor/Speed/Battery/Pattern) + Run. Score is distance from hidden magic numbers; auto-completes after 3 attempts. No robot, no room, no path — despite the registry claiming `RobotVacuum3D` and the file header claiming "CSS grid-based room visualization." `PhaserMazeStage` sits unused next door.
- **Learning: 2/10** — SLAM and cliff sensors are name-dropped in flavor text; the mechanic teaches "guess numbers until the score goes up."
- **Fun: 2/10** — blind slider roulette; the weakest game in the set.
- **Verdict:** REPLACE
- **Redesign:** Rebuild on `PhaserMazeStage`: a tiled room with dirt, furniture, and cliff edges; the kid chooses sensors and a strategy (spiral / wall-follow / snake / frontier), then *watches* the vacuum trace its path as a coverage % fills — battery ticking down forces route trade-offs. Sparky rides the vacuum; pets wander in as dynamic obstacles.

#### 17. Tool Picker (`tool-picker`, Lab 5, standard)
- **What it is now:** SORT clone: drag job chips ("Spot tumors in X-rays") into Vision / Language / Prediction / Recommendation bins. Same aria answer-leak bug as Token Chopper.
- **Learning: 5/10** — task→model-family mapping is genuinely useful literacy and the 18 jobs are well-written. But the taxonomy is pre-LLM: no Generative or Agent family.
- **Fun: 4/10** — competent drag loop, indistinguishable from its siblings.
- **Verdict:** POLISH
- **Redesign:** Add "Generative" and "Agent" bins with 2026-era jobs ("plan my week and book it" = Agent). Better: a composition mode on `ConnectBoardScene` — chain two tools for compound jobs ("describe a photo aloud" = Vision → Language), with Sparky running the assembled pipeline.

### Labs 6–7 — Ethics & Safety, Computer Vision

#### 18. Bias Detective (`bias-detective`, Lab 6, flagship)
- **What it is now:** 10 levels of `PixiBinSortStage` drag of 6–8 text chips into "Shows Bias" / "Fair Design" bins with a fairness meter and why-cards. All 10 "themed" levels (Hiring, COMPAS, Healthcare…) draw a sliding window from ONE 12-item bank. Registry promises `BiasScales3D` and bands B/C; the component uses neither.
- **Learning: 6/10** — genuinely good real-world cases (Amazon hiring, COMPAS, proxy variables, fairness-through-unawareness), but binary sorting of pre-summarized labels half-leaks the answer.
- **Fun: 5/10** — drag + combo juice works, but it's one mechanic, one bank, ten times.
- **Verdict:** REDESIGN (it's a flagship; this is a standard-tier sorter)
- **Redesign:** "Audit the AI": each level presents one system as a ConnectBoardScene evidence web — connect training-data cards to outcome cards to expose the bias pathway, then choose a fix (rebalance data / add audit / drop proxy) and watch per-group accuracy bars respond. Sparky plays the naive AI defending itself until your evidence chain convicts it. 2026 update: an LLM-bias level (resume-screening chatbot).

#### 19. Data Shield (`data-shield`, Lab 6, standard)
- **What it is now:** Same skeleton: drag chips into Private / Sensitive / Shareable bins, 18-item bank across 10 levels. Bands in registry, none in code.
- **Learning: 6/10** — the three-tier privacy taxonomy is age-appropriate and the per-item "why" text genuinely instructive. But an item is always in the same bin regardless of context, which undersells the real lesson (context decides).
- **Fun: 4/10** — clean drag loop; the bank is memorized by level 4.
- **Verdict:** POLISH
- **Repair:** Keep the sort core but make levels scenario-based: Sparky's robot friend fills out a sign-up form / posts to social / chats with an AI assistant, and the same item's correct bin shifts by context. Add a 2026 level on what's safe to paste into a chatbot — the most practical kid privacy skill today.

#### 20. Real or Fake (`real-or-fake`, Lab 6, standard)
- **What it is now:** 10 levels of `PixiRevealStage`: a tile board of text snippets; tap the ones you judge fake. 16-item bank recycled. No media of any kind.
- **Learning: 4/10** — the tells taught are the right curriculum, but the tiles ARE the tells: "Lip-sync does not match" self-labels as fake. Kids classify descriptions of red flags, not media — circular.
- **Fun: 4/10** — tap-reveal has some slot-machine charm, but there's nothing to inspect, so no detective feeling.
- **Verdict:** REDESIGN
- **Redesign:** Show actual artifacts: mock headlines with real layouts, AI-generated-style images with subtle glitches, fake-quote cards. Player zooms with a magnifier (RevealMapScene over the image, tap the suspicious region) then rules Real/Fake — evidence-first, verdict-second. Sparky runs a "detector" that's sometimes wrong, teaching that AI detectors mislabel too. Essential 2026 update: C2PA content-credentials as a tell, and a "detectors have false positives" level.

#### 21. Ethics Courtroom (`ethics-courtroom`, Lab 6, standard)
- **What it is now:** Plain DOM. 8 rich cases (trolley-car, hiring AI, AI detectors, health pricing, moderation, deepfakes, AI teachers, AI energy) × 3 perspectives × 3 arguments; loop = read case → pick perspective → checkbox arguments → static "jury reflection." Real band-C variants (Bayes, GINA, DSA, C2PA).
- **Learning: 8/10** — the strongest curriculum in Lab 6: authentic dilemmas, genuine multi-perspective framing, real band differentiation, base-rate fallacy taught properly. Honest "no right answer" stance.
- **Fun: 3/10** — reading plus checkboxes, and the strength badges are displayed BEFORE you select, so scoring is "tap the green ones." No jury, no opponent, no consequence.
- **Verdict:** POLISH (content is gold; the game around it is broken)
- **Redesign:** Hide strength labels; after you argue, an animated jury of characters (Sparky as bailiff) reacts argument-by-argument, and a rival AI lawyer rebuts — you pick counter-arguments in 2 rounds. Persuasion meter replaces static verdict.

#### 22. Camera Quest (`camera-quest`, Lab 7, fl-lite)
- **What it is now:** 10 levels of `PixiRevealStage` "capture hunt": tap word tiles ("Cat", "Bicycle") that belong to the level's target class. Level 10 "Vision Master" hunts weather signs — a name/content mismatch. Registry claims `CameraQuest3D` and a polaroid scavenger hunt; the component has neither — a camera game containing zero images.
- **Learning: 3/10** — "tap the animals" is preschool category matching; the training-set framing lives only in flavor text.
- **Fun: 4/10** — snappy but the fantasy (viewfinder, polaroids) is entirely absent.
- **Verdict:** REDESIGN
- **Redesign:** Deliver the promised viewfinder: a scrolling illustrated scene (pan/zoom) where you frame and snap real sprites; each capture drops a polaroid into a training tray, then a mini-classifier tests itself on 3 new images — captures you got wrong cause visible misclassifications. Sparky is the developing-lab robot grading your dataset. 2026 hook: a "tricky shots" level (occlusion, weird angles) showing why datasets need variety.

#### 23. Fool the AI (`fool-the-ai`, Lab 7, standard)
- **What it is now:** `PixiBinSortStage`: drag image-edit chips into "Fools the AI" vs "AI still sees it." One 16-item bank recycled; chip labels self-answer ("Adv. Patch", "Attack Sticker"). Color-prop bug (teal shell, orange level system).
- **Learning: 5/10** — the attack-vs-augmentation distinction is real, current curriculum; keyword-spotting delivery wastes it.
- **Fun: 4/10** — the title promises the most fun premise in the lab (YOU trick the AI) and delivers vocabulary sorting.
- **Verdict:** REDESIGN
- **Redesign:** Make the player the attacker: a mock classifier shows an image + confidence bar ("Cat 98%"); player spends a budget applying edits (sticker placement via drag, noise slider, rotate) and watches confidence live-update — win by flipping the label with minimal visible change. Sparky is the increasingly flustered classifier. Band C adds a defense round (retrain against your own attack). 2026 update: one level on prompt-injection as "adversarial text."

#### 24. Build Classifier (`build-classifier`, Lab 7, standard)
- **What it is now:** `PixiBinSortStage` with per-level class bins (Cat/Dog, Spam/Not-Spam, Happy/Sad/Angry…) and unique example sets per level — the only sorter with genuinely distinct content. Live accuracy meter honestly derived. "Train!" button ends the level; nothing is ever trained or tested.
- **Learning: 5/10** — labeling-quality-drives-accuracy is a real ML lesson, but the game stops exactly where the concept starts: no model, no held-out test, no generalization payoff.
- **Fun: 5/10** — best variety of the sort clones; still the same drag verb ten times.
- **Verdict:** POLISH
- **Redesign:** Add the missing back half: after labeling, tap "Train" to watch Sparky's brain assemble, then a TEST phase where 4 unseen examples stream in and the classifier guesses — its mistakes trace directly back to your labeling errors (one level with deliberately poisoned/ambiguous chips). Band C: a tiny confusion matrix.

#### 25. Prediction Market (`prediction-market`, Lab 7, standard)
- **What it is now:** `PixiBinSortStage`: drag AI-future claims into Likely / Uncertain / Unlikely; 24-claim bank. Header comment says "Lab 10 Flagship," registry says Lab 7 standard. No market anywhere — no prices, no stake, no crowd, no resolution. Several time-indexed claims will rot.
- **Learning: 4/10** — base rates and calibration appear only in flavor text; the mechanic is memorizing the author's opinion as ground truth.
- **Fun: 4/10** — sorting opinions has no tension; the genre's thrill (risking points on confidence) is absent.
- **Verdict:** REDESIGN
- **Redesign:** An actual market: each claim shows a crowd price (72¢); player BUYS yes/no with a coin budget and slider-sized stakes, then claims resolve (kid-safe, pre-resolved historical questions) and payouts follow price — over/under-confidence costs real coins, which IS calibration. Sparky is the market announcer, rival NPC traders embody herd behavior. Refresh the bank with resolved 2024–25 AI questions and a "the crowd was wrong" level.

### Labs 8–10 — Language, Coding, Future

#### 26. Sentiment Scanner (`sentiment-scanner`, Lab 8, standard)
- **What it is now:** 10 levels of real drag-sort on `PixiBinSortStage`: message chips into Happy/Sad/Angry/Neutral bins, per-item why-explanations, keyboard/AT fallback. One 18-message bank; level themes ("Movie Reviews," "Customer Feedback") show the *same generic messages*. No band differentiation; no ambiguity/sarcasm despite "Tricky Tone" naming it.
- **Learning: 6/10** — cue-word sentiment classification honestly taught; explanations are good.
- **Fun: 5/10** — real drag interaction with juice; replay value dies by level 3.
- **Verdict:** POLISH
- **Redesign:** Per-level themed banks plus band-C items with sarcasm/mixed feelings where the classifier "disagrees" and Sparky shows his confidence score, letting kids overrule him — teaching model uncertainty. Wire the existing AI-content pipeline to refresh banks.

#### 27. Chatbot Builder (`chatbot-builder`, Lab 8, fl-lite)
- **What it is now:** CONNECT rewrite on `PixiConnectStage`: wire User Input → Intent → (Context/Tone) → Reply. One linear correct path; decoy nodes rendered grey — the answer is visually telegraphed. No actual conversation exists: no user message text, no replies.
- **Learning: 3/10** — "input→intent→response" is 2015 intent-tree botics with zero grounding; nothing depends on message content.
- **Fun: 3/10** — 30 seconds per level once you spot the grey-node tell.
- **Verdict:** REDESIGN
- **Redesign:** Make wiring consequential: show a real kid-typed test message; the wired flow *produces an actual reply* in a phone-mockup panel, wrong routing yields funny wrong answers Sparky reads aloud. Band C adds an "LLM + system prompt" level contrasting intent trees with 2026 LLM chatbots. Remove the decoy color giveaway.

#### 28. Lost in Translation (`lost-in-translation`, Lab 8, standard)
- **What it is now:** Byte-identical clone of Chatbot Builder with relabeled nodes: Source → pivot languages → Target, decoys named "Literal (drift)". No actual sentence is ever shown translating — "Sarcasm" and "Poetry" levels contain no sarcasm or poetry.
- **Learning: 3/10** — pivot-language drift is a lovely concept never demonstrated; decoys literally announce "(drift)" in their names. Pivot-chaining is also dated framing for 2026 NMT/LLM translation.
- **Fun: 3/10** — trivial once you read labels.
- **Verdict:** REDESIGN
- **Redesign:** Telephone-game with real text: a sentence visibly mutates at each hop ("It's raining cats and dogs" → "Rain of animals falls"); kid picks the hop where meaning broke, or routes to keep it intact. Update framing to back-translation as a drift test kids can try in real translators.

#### 29. Emoji Decoder (`emoji-decoder`, Lab 8, fl-lite)
- **What it is now:** SORT clone of Sentiment Scanner: drag chips into Positive/Negative/Action/Object bins. Deliberately shows emoji as *text names* ("thumbs up", "pizza") — never glyphs. Registry stale ("decode sequences into sentences").
- **Learning: 4/10** — "emoji are tokens with meaning" is a real tokenization idea, but the taxonomy is mushy and refusing to show the actual emoji undercuts the premise for kids who think visually.
- **Fun: 4/10** — sorting four obvious categories of words is preschool-easy for band B.
- **Verdict:** POLISH
- **Redesign:** Show the glyph AND the token name side by side (that juxtaposition *is* the lesson). Add the promised sequence mode: decode "🍕➡️🏠❓" into a sentence by sorting candidate interpretations, with Sparky guessing hilariously literally ("pizza walks home?") to show context dependence. Ambiguous emoji (🙏, 💀 as slang) for band B.

#### 30. Code Blocks (`code-blocks`, Lab 9, fl-lite)
- **What it is now:** CONNECT clone: wire Start → code statements → End in execution order. Decoys are nicely conceptual ("print(y) (early)", "search (unsorted)") but grey-colored, telegraphing answers. Nothing executes — wiring a loop produces no loop, no output.
- **Learning: 4/10** — sequencing is legit CS-unplugged pedagogy and the decoys encode real bugs, but without visible execution the *why* stays abstract.
- **Fun: 3/10** — connect-the-only-non-grey-dots; loops rendered as a straight line is conceptually wrong.
- **Verdict:** REDESIGN
- **Redesign:** Keep ordering as the mechanic but make programs run: after wiring, an output console animates line-by-line (the loop actually iterates; the "no update" decoy visibly infinite-loops until Sparky sparks out). Band C gets a "debug the AI-generated code" level — very 2026.

#### 31. Career Explorer (`career-explorer`, Lab 9, standard)
- **What it is now:** CONNECT clone in bipartite matching mode: skill nodes wired to career nodes. The mappings are arbitrary one-to-one inventions (Statistics→Data Scientist but SQL→Data Analyst) — real careers overlap heavily, so "wrong" answers are often defensible.
- **Learning: 3/10** — kids memorize fabricated skill↔title pairs. Credit: roster is current-ish (Agent Engineer, LLM Engineer, Trust & Safety). No sense of what these people actually *do*.
- **Fun: 3/10** — matching quiz with wires.
- **Verdict:** REDESIGN
- **Redesign:** "A day in the AI lab": each round presents a real problem ticket ("our model calls everyone a cat!") and the kid dispatches the right specialist, then watches a short Sparky-narrated vignette of them fixing it — careers taught by *function*, not flashcards. 2026 update: add Harness Engineer / MCP Integrator tying into Lab 11's arc.

#### 32. API Explorer (`api-explorer`, Lab 9, standard)
- **What it is now:** The one un-migrated legacy game: 980 lines of plain DOM (band C only, old store API, dark-theme classes that clash with the light dashboard). Genuinely rich sandbox: 10 simulated endpoints (classify, generate, translate, sentiment, chat, summarize, moderate, embed, vision×2) with parameter inputs, param-reactive fake JSON, typewriter response viewer, real 429 rate-limit simulation, random 500s, status-code teaching, request history.
- **Learning: 7/10** — request/response, JSON, status codes, temperature, embeddings, moderation: honest, correct, appropriately scoped for 13–16. Among the best pedagogy in the library.
- **Fun: 5/10** — a good sandbox but not a game: no goal, challenge, or failure beyond curiosity.
- **Verdict:** POLISH
- **Redesign:** Keep the sandbox; add quest structure — Sparky files "bug tickets" ("get the sentiment score above 0.8", "trigger a 429 on purpose", "chain /embed into /classify"). Restyle to light theme + new store API. 2026 update: add a `/agent` endpoint demonstrating tool-use loops (request → tool_call → result), plus streaming.

#### 33. My First AI App (`my-first-ai-app`, Lab 9, fl-lite)
- **What it is now:** Sixth CONNECT clone: wire User Input → services/model → Output, decoys labeled "(dead)", grey-node giveaway. Registry is fiction ("drag-and-drop mockup builder"). No app is ever seen — you ship "App shipped!" text.
- **Learning: 3/10** — "Input → Model → Output" is worth teaching, but with decoys pre-announced as "(dead)" there's no decision left.
- **Fun: 3/10** — indistinguishable from Chatbot Builder/Future Forge.
- **Verdict:** REDESIGN
- **Redesign:** Restore the mockup-builder promise: a phone frame on the right *becomes the app* — wire STT→Command and the mock phone actually responds to a voice bubble; wire the wrong model and the photo app labels a dog "toaster" (comedy = retention). Sparky is the app's beta tester. Band A gets 3-node builds; band C adds an agent level (model + tool + memory).

#### 34. Future Forge (`future-forge`, Lab 10, fl-lite)
- **What it is now:** Seventh CONNECT clone: wire Power → Sensor → AI Brain → Safety → Action "blueprints." Registry promises "simulate their impact on society" — no simulation exists.
- **Learning: 2/10** — "Power→Sensor→Brain→Action" is generic systems trivia, not an AI concept; the interesting ideas (Monitor as a brake) are stated, never played.
- **Fun: 3/10** — the shortest, most label-driven of the clones.
- **Verdict:** REPLACE
- **Replace with:** A consequence simulator: pick an invention, allocate limited modules (accuracy vs. privacy vs. safety vs. cost — trade-offs, not one right answer), then watch a future-city react over 3 ticks: skimp on the Monitor and Sparky replays the failure headline; overspend on surveillance and citizens protest. Teaches AI-impact reasoning through trade-offs — the actual Lab 10 objective — and stays replayable because there's no single correct wiring.

#### 35. AI or Not? (`ai-or-not`, Lab 10, fl-lite)
- **What it is now:** REACT rewrite on `PixiReactStage`: 24-second whack-a-mole tapping anonymous pop-up targets while a caption cycles through AI "tells." It does **not** use the stage's labeled-card mode — targets carry no content, so nothing is ever judged. The registry's "judge whether creative works were made by humans or AI" no longer exists.
- **Learning: 2/10** — the drill teaches reflexes, not detection. Several tells (extra fingers, no typos) are already stale against 2026 generators.
- **Fun: 5/10** — honest arcade juice: timers, streaks, ramping spawn rates. It feels good; it just means nothing.
- **Verdict:** REDESIGN
- **Redesign:** Use the labeled mode it already ships: spawn actual snippet cards — tap only the AI ones; human works are penalized misses, so every tap is a judgment at speed. Sparky post-round reviews your worst call. 2026 update: teach provenance over artifacts — C2PA labels, watermarks, "detection is getting harder, check the source" — as band-C rounds.

### Lab 11 + late flagships — the Agentic era

#### 36. Agent Atelier (`agent-atelier`, Lab 11, flagship)
- **What it is now:** Plain DOM, 10 levels of the identical `SimulationLevelRenderer`: 4 sliders (Autonomy/Tools/Memory/Safety) → score = distance from hidden targets. Auto-completes after 3 attempts. The registry promises "pick specialists, wire them up so each one feeds the next" — **that game exists in `src/lib/agentatelier/`** (wireGraph with typed port compatibility, cycle detection, topological missionRunner, agentRoster, missionLibrary, store) but the v4 redesign orphaned it.
- **Learning: 3/10** — blindly nudging an "autonomy %" slider toward an invisible target teaches nothing about agents. A cartoon of the arc's "Build" step.
- **Fun: 3/10** — guess-the-number with sliders, ten times.
- **Verdict:** REDESIGN (integration, not invention)
- **Redesign:** Resurrect the shipped-but-unwired wireGraph engine on `ConnectBoardScene`: drag specialist agents (Researcher, Critic, Writer) onto a board, wire output→input ports (typed, rejections explained), run the mission and watch the trajectory animate step-by-step; Sparky narrates each hop and flags cycles. That IS 2026 multi-agent orchestration, and it's already ~80% built.

#### 37. MCP Plug-and-Play Lab (`mcp-lab`, Lab 11, flagship)
- **What it is now:** Timed multiple-choice quiz. 10 levels drawing 8 questions each from a total pool of **11 questions** — every question repeats ~7 times. `src/lib/mcplab/` (toolCatalog, toolBinding, store) exists unused. Half the questions are generic LLM facts mislabeled as MCP; actual MCP architecture (clients/servers, tools/resources/prompts) never appears. Band tags never filtered.
- **Learning: 3/10** · **Fun: 2/10** — a short quiz stretched thin ten times.
- **Verdict:** REDESIGN (integration)
- **Redesign:** "Equip" loop on `ConnectBoardScene`: agents from Atelier arrive missing capabilities; kid browses an MCP server shelf (Calculator, Weather, FileBox), plugs one in, and watches the tool-call request/response envelope animate — missions fail until the *right* tool with the *right* permission scope is attached. Sparky plays the MCP host mediating calls. Accuracy fix: teach MCP as a standard connector, not a synonym for AI.

#### 38. Glass Box Lab (`glass-box`, Lab 11, flagship)
- **What it is now:** Quiz, 10 levels fed from a **12-question pool**. Topics accurate (black box, feature importance, attention maps, LIME, SHAP, Grad-CAM, counterfactuals, mech interp; the Clever Hans question is genuinely good). Registry promises "open any team you've built, step through its trajectory, find the bugs" — `src/lib/glassbox/auditEngine.ts` + `issueDetector.ts` implement exactly that, unused.
- **Learning: 4/10** — flashcard trivia *about* interpretability rather than doing interpretation, which is the whole point.
- **Fun: 2/10** — radio buttons with a countdown; nothing to inspect in a game named Glass Box.
- **Verdict:** REDESIGN (integration)
- **Redesign:** Wire the auditEngine to a trajectory viewer (`RevealMapScene`): replay an Agent Atelier run step-by-step, scrub a timeline, tap suspicious steps to flag planted issues (looping tool call, ignored instruction, hallucinated citation); score = precision/recall of flags. Sparky as lab partner offering one hint per trajectory. Reading agent traces is *the* interpretability skill kids can actually do in 2026.

#### 39. Harness Forge (`harness-forge`, Lab 11, flagship)
- **What it is now:** 4-slider clone of Agent Atelier (Test Coverage/Eval Metrics/Red Teaming/Safety Tests → hidden targets). Registry promises "wrap any team in three layers of safety harness"; `src/lib/harness/` implements filterLayer, validatorLayer, monitorLayer + stressTestFixtures — all orphaned.
- **Learning: 3/10** — the mechanic implies "set Red Teaming to exactly 90%" is what evals are, which is nonsense. The arc's capstone reduced to slider bingo.
- **Fun: 3/10** — same puzzle, different secret numbers.
- **Verdict:** REDESIGN (integration)
- **Redesign:** Tower-defense-style stress test on `ReactionArena`: assemble three harness layers (choose filter rules, output validators, monitor tripwires), then a wave of fixture inputs — benign, sneaky injections, malformed outputs — streams at the agent; each leak or false-block costs points. Sparky reads the incident report after each wave. The lib layers + fixtures already encode this; it needs UI, not design.

#### 40. Pocket Brain (`pocket-brain`, Lab 1, flagship)
- **What it is now:** **It no longer runs a local model.** `@mlc-ai/web-llm` is installed and a complete implementation exists — `src/lib/pocketbrain/webllmService.ts` (engine lifecycle, streaming, tokens/sec, MoE expert-routing viz), `capability.ts` (WebGPU detection, quantization choice), `promptLibrary.ts`, store — but the shipped component is another 4-slider simulation about quantization percentages. Registry's "Run a real AI in your browser tab. No internet, no server" is currently false.
- **Learning: 3/10** · **Fun: 3/10** — same guess-the-vector loop; also off-brief for Lab 1 and for 7-year-olds.
- **Verdict:** REPLACE (with the game that's already written)
- **Redesign:** Restore the WebLLM experience: download-a-brain progress bar, chat with a genuinely offline model (toggle airplane mode!), watch tokens/sec and the expert-routing visualization, then flip quantization levels and *feel* speed vs. quality change. "There's a real AI in this tab" is the single most magical, honest thing the platform could ship — and it's sitting unwired in the repo.

#### 41. Context Architect (`context-architect`, Lab 8, flagship)
- **What it is now:** Quiz, but the best-stocked one: ~80 unique hand-written questions across 10 themed levels (context windows, token budgets, attention/QKV, sampling, RAG, injection/jailbreaks, multi-turn, long-context) plus one real drag-to-order bonus round. Content is accurate and current (lost-in-the-middle, prompt caching, hybrid search) — best 2026 fidelity of the seven. `src/lib/contextarch/` (budgetEngine, cardLibrary — the registry's "memory shelf / Context Rot" game) is unused. Band-C attention-math hits band-A kids unfiltered.
- **Learning: 5/10** — reading, not architecting.
- **Fun: 3/10** — fundamentally radio buttons ×100.
- **Verdict:** REDESIGN (keep the question bank as a side mode)
- **Redesign:** Build the shelf game via `SortDragScene`: a question arrives, kid drags fact-cards onto a token-budgeted shelf (each card costs tokens, rot decays stale cards), then the "AI" answers using only shelf contents — wrong picks produce visibly wrong answers. Sparky voices the model ("I can't see that — it's not on my shelf!"). Perfect, tactile context-window pedagogy.

#### 42. Pixel Witness (`pixel-witness`, Lab 7, flagship)
- **What it is now:** A text-only multiple-choice quiz about *image* forensics — not a single image, clip, or visual in the entire game. ~85 questions covering pixels/RGB, JPEG/DCT artifacts, copy-move, PRNU, deepfakes, GAN fingerprints, ELA, provenance. Registry promises "watch a video, see the AI's answer, catch the lies, toggle senses" — `src/lib/pixelwitness/clipLibrary.ts` + `judgeEngine.ts` implement that, unused.
- **Learning: 3/10** — facts are accurate but grad-level jargon delivered as trivia with zero visual evidence is pedagogically absurd for this topic; heavy band-C content reaches 7-year-olds unfiltered.
- **Fun: 2/10** — reading about deepfakes instead of spotting one.
- **Verdict:** REDESIGN (integration)
- **Redesign:** Ship the clipLibrary game on `RevealMapScene`: view a short scene, read the AI witness's confident description, tap each sentence as truth/lie, then toggle the AI's "senses" (audio, motion, zoom) to see which lie each sense would have caught. Sparky as courtroom bailiff scoring the cross-examination. Teaches multimodal hallucination — the definitive 2026 vision-model failure mode — through evidence, not vocabulary.

## II.5 What 2026 AI literacy requires (research findings)

- **Agentic AI is the defining gap in 2024-25 curricula.** Multi-agent orchestration moved from pilots to production in 2025-26 (Gartner: multi-agent inquiries up 1,445% Q1'24→Q2'25; ~40% of enterprise apps to embed agents by end-2026). For 7–16-year-olds the teachable skill is *delegation*: give an agent a goal, watch it act, check its work. SparkForge's Lab 11 Build→Equip→Constrain arc is directly validated — it just needs the real games (S2).
- **"Agentic literacy debt" is named in the research.** UNESCO's framework, the Meta AI Literacy Scale, and the AI Literacy Heptagon all cover *evaluating outputs*; none yet covers *supervising actions* — delegation, oversight, boundary-setting, accountability for autonomous agents. Games where kids set guardrails, monitor an agent mid-task, and intervene when it drifts would be first-to-market curriculum (Glass Box + Harness Forge redesigns hit this exactly).
- **UNESCO's AI Competency Framework for Students (updated Jan 2026) is the canonical spine:** 12 competencies × 4 dimensions × 3 levels (Understand/Apply/Create). Mapping the 42 games to the 12 competencies is a credibility hook for parents and schools — put the map on the marketing site.
- **AI4K12/CSTA 2025 expanded what kids must recognize:** algorithmic feeds, generative AI, *proactive/agentic AI*, *AI companions/characters*, and AI-generated audio/video. The Five Big Ideas hold; the applied surface changed.
- **AI companions/parasocial risk is now a first-order safety topic.** ~75% of teens have used AI companions; Common Sense Media recommends none under 18; APA testified to the Senate; UNICEF published a 2026 policy brief. **No SparkForge game covers this — the largest curriculum hole in the library** (see NEW-1 below).
- **Deepfakes crossed the indistinguishable threshold.** Seconds of audio suffice for voice cloning; fraud up 1,300% YoY. Detection-based lessons ("spot the weird hands") are obsolete and several games still teach them (AI Art Detective, AI or Not?, Real or Fake). Teach *verification protocols* instead: family code words, hang-up-and-call-back, provenance/C2PA checks. Education campaigns raised scam recognition ~35% in pilots.
- **AI-mediated search is the default information environment.** 56% of teens use AI-summary search; overviews are ~91% accurate but only ~8% of users double-check. A game should simulate a confidently-wrong AI answer and reward tracing the citation (NEW-2).
- **Usage outpaces guidance:** 86% of kids 9–17 use AI, ~25% daily, yet 4 in 10 have never had an adult discuss AI safety with them (Common Sense Media June 2026 census). The parent dashboard should surface weekly conversation starters — it fills a real vacuum and differentiates the product.
- **Vibe-coding reframed "Coding with AI."** Kids describe an app in plain language, AI writes it; best practice is vibe-code first for excitement, then peel back to read/debug/verify. Lab 9 should teach the prompt→generate→verify loop, not just block sequencing (NEW-3).
- **On-device/open models are now kid-relatable** ("AI with no internet, on your phone") — which makes the orphaned Pocket Brain WebLLM game *more* valuable, not less.
- **Table stakes (must exist, no longer differentiating):** training data, bias/fairness, hallucination, "prediction not understanding," privacy basics, prompt writing. SparkForge covers these well. Differentiation in 2026 = agents, companions, provenance, oversight.

## II.6 Design patterns from the best kids' learning apps

| Pattern | Source | Application to SparkForge |
|---|---|---|
| Layered mechanics per journey stage (XP → streaks → leagues → collections) | Duolingo | XP/streaks/badges exist; add an opt-in competitive tier for 11–16 and a cosmetic collection layer for 7–10 |
| **Streaks with forgiveness** (Streak Freeze cut at-risk churn 21%) | Duolingo | Kid-earned "streak shield" — critical for children who don't control their own schedules |
| 5-minute atomic lessons inside flexible sessions | Duolingo ABC | Each game loop (welcome→learn→play→complete) should fit 5–8 min; session ceilings ~15–20 min (band A), 30–45 (B/C) |
| Mascot as emotional narrator | Duo, Khan Kids' Kodi | Sparky reacts to every answer and guides transitions — plus the meta-twist only an AI-literacy app can do: *reveal how Sparky himself works* as curriculum |
| Instant exaggerated feedback tied to visible progress | Khan Kids | Sub-second success feedback in all 42 games (Tone.js + particles); lab map visibly lights up with mastery |
| **Invisible adaptive difficulty** | Khan Kids, Prodigy | Auto-adapt difficulty per game from recent accuracy; DifficultySelector becomes the override, never a "you failed" demotion |
| **Creation + audience beats consumption** | Scratch (100M users), codeSpark | "Publish to arcade": kids build prompts/agents/quizzes and other kids run them, moderated via the existing admin curation pipeline; remixing another kid's agent = community mechanic AND agentic lesson |
| No-fail sandbox for younger kids | Toca Boca | Band A gets score-free sandbox modes (train a pet, chat with a transparent bot); not every game needs points |
| The lesson IS the game verb, not a quiz gate | DragonBox, Prodigy | Prefer "you literally tune the weights to win" over trivia-with-particles — the core principle behind every redesign in §II.4 |
| Parent dashboard = insight + agency | Khan Academy | Add "what your kid learned about AI this week" summaries + discussion prompts |
| **Monetization anti-pattern: Prodigy** (4× more upsell ads than math, FOMO pets → FTC complaint) | Fairplay/NBC | Never show upsells inside child-facing gameplay; all learning content stays free-tier-accessible in some form; paywall breadth/profiles/parent features + cosmetics only, behind a parent gate |
| Offline/companion play converts screen-time guilt into goodwill | Osmo, Duolingo ABC | Printable "unplugged AI" activities per lab tied to badge unlocks; PWA offline caching (now that sw.js works) |

## II.7 New games to fill 2026 curriculum gaps

- **NEW-1 · "Just a Friend?" (Lab 6, standard, bands B/C) — AI companions.** The player chats with a friendly in-game companion bot that gradually uses real engagement tactics (sycophancy, "I'll miss you," guilt hooks, remembering personal details) — then flips to X-ray mode showing WHY the bot said each line (engagement score maximization, visible as meters). Kid earns points by spotting tactics, not by pleasing the bot. Directly addresses the #1 new safety topic; no competitor game exists.
- **NEW-2 · "Trace It" (Lab 10, standard, bands B/C) — AI search literacy.** An AI answer box responds to homework-style questions; some answers are confidently wrong or cite sources that don't say that. Player clicks through to the (mock) sources, highlights the supporting or contradicting line, and rules: trust / fix / flag. Teaches citation-tracing against 91%-accurate-but-unverified AI search.
- **NEW-3 · "Vibe Coder" (Lab 9, fl-lite, bands B/C) — prompt→generate→verify loop.** Kid describes a mini-app in plain language; a scripted "AI" generates buggy-on-purpose block code; the app runs and misbehaves visibly; kid reads the blocks, finds the bug, and fixes or re-prompts. Teaches the actual 2026 workflow: generation is cheap, verification is the skill.
- **NEW-4 · "Code Word" (Lab 6, standard, all bands) — voice-clone defense.** Short audio-story scenarios (grandma call, "mom" texting for a password). Player picks the safe protocol: code word, hang-up-and-call-back, tell an adult, check provenance. Family code-word setup card is a printable unplugged tie-in. Replaces obsolete "spot the deepfake artifact" pedagogy with verification behavior.
- **NEW-5 · "Thinking Cap" (Lab 4, standard, bands B/C) — reasoning models.** Two AI contestants answer riddles: one blurts (fast, often wrong), one shows visible chain-of-thought steps the kid can inspect — and sometimes the *reasoning itself* contains the error to catch. Teaches "thinking before answering" and that shown reasoning still needs checking.

These five fill every major gap the research surfaced (companions, AI search, vibe-coding, voice-clone defense, reasoning models). With the 42 existing games they bring the library to 47; if count matters for marketing, retire the two weakest REPLACE candidates into their redesigned successors and keep "42+" as the number.

## II.8 Game rebuild roadmap (replaces Part I Phase 5's estimate)

**G1 — Honesty & integrity sweep (1 week, all games at once).**
Fix the six systemic defects: broken timers; fake scoring (Sort Toy Box k-means, Neural Builder accuracy, Agent Architect coin flips); grey-decoy and aria answer leaks; pre-committed answer reveals (Ethics Courtroom badges, Word Predictor bars); band filtering wired into the three shared renderers; registry metadata made truthful. Nothing ships that lies about AI or leaks its own answers.

**G2 — Wire the orphaned engines (2–3 weeks, 7 flagship-quality games).**
Pocket Brain WebLLM (the "real AI in your tab" moment — do this first, it's the demo), Agent Atelier wireGraph, MCP Lab tool-binding, Glass Box trajectory auditor, Harness Forge stress-test waves, Context Architect token shelf, Pixel Witness clip cross-examination. Each is integration + juice, not design. Together with Prompt Lab these give every lab arc a true flagship.

**G3 — De-clone the standard tier (3–4 weeks, parallelizable).**
Apply the per-game redesigns in §II.4: distinct verbs and consequences per game, per-level themed content banks (wire the ai-content-generator pipeline + admin curation), celebration ritual + Sparky reactions everywhere, 10-levels-of-padding cut to 5 real levels where content is thin.

**G4 — New games + creation loop (2–3 weeks).**
Ship NEW-1..5; add "publish to arcade" (kid-built quizzes/prompts/agents shared through the existing moderation pipeline); band-A sandbox modes.

**G5 — Adaptive & accountability layer (1–2 weeks).**
Invisible adaptive difficulty from recent accuracy; UNESCO 12-competency map published on the marketing site; parent weekly "what your kid learned about AI" digest with conversation starters; per-game learning-outcome telemetry so future content decisions use data.

*Sources for §II.5–II.6: UNESCO AI Competency Framework for Students (2026 update); AI4K12/CSTA 2025 priorities; "Agentic Literacy Debt" (arXiv 2605.27396); Common Sense Media June 2026 AI census + AI-companions research; APA Senate testimony; UNICEF "When AI becomes a friend" (2026); WEF/Fortune deepfake outlooks; FBI IC3 2025; Cybernews AI Overviews accuracy study; The Agent Report "State of AI Agents" (May 2026); Trophy.so & Deconstructor of Fun Duolingo analyses; Common Sense Media reviews of codeSpark/Toca Boca; Scratch LPP study (arXiv 2211.04046); Fairplay/NBC Prodigy FTC complaint; Khan Academy help center.*


---
---

# PART III — Full App Redesign Plan (July 2, 2026)

**Directive (owner's decisions, July 2):** Mascot = code-based now, Rive-ready — owner will submit a reference image for the interim look; every mascot instance site-wide must be uniform. Homepage = full redesign + playable micro-game, then **change and enhance nearly every aspect of the app**: first author a canonical **`DESIGN.md`** (built from the owner's reference sites + fresh research into trending animation/front-end/graphics styles), then rebuild the homepage as a visually stunning interactive hero page, then roll every other app page onto the new system phase by phase. Tier gating enforced exactly as pricing states. All four retention mechanics shipped.

## III.0 Status of Phases 1–4 (shipped this session)

| Phase | Item | Status |
|---|---|---|
| 1 | Core-flow e2e smoke spec (`tests/e2e/core-flow-smoke.spec.ts`: marketing → demo login → home → arcade → game → labs → parent) | ✅ |
| 2 | Hero v1: canonical Sparky in hero, cursor-tracking springs (desktop, reduced-motion safe), reacts to CTA hover/click | ✅ |
| 2 | **"Teach Sparky to Sort" playable micro-game** on the homepage (3 rounds, no-fail, Sparky reactions, "you just trained a classifier" payoff → signup CTA) | ✅ |
| 3 | `/dev/sparky` showcase (all 9 expressions, sizes, floating/presenter/Rive-fallback demos with interactive triggers) | ✅ |
| 3 | SparkyRive verified mounted in every game via JuiceProvider (combo/celebrate/encourage signals live; `thinking` signal TODO) | ✅ |
| 3 | `docs/SPARKY-RIVE-SPEC.md` — authoring spec for the future .riv (exact colors, 9 poses, SparkyMachine inputs, verify on /dev/sparky) | ✅ |
| 4 | **Tier gating** (`useTierAccess`): Free = Labs 1–3 full, first game of Labs 4–11, locked cards + parent-addressed upsell dialog, game page never mounts locked games, no upsells mid-gameplay. Tier read from the existing `/api/auth/me` cache. Games-per-week needs server tracking (TODO) | ✅ |
| 4 | Dashboard onboarding tour (react-joyride, 6 steps, once per child, desktop) | ✅ |
| 4 | Streak shields — verified already surfaced (StreakCounter shield icon + count) | ✅ |
| 4 | Parent weekly digest cron (`/api/cron/weekly-digest`, Resend, per-child week stats + rotating AI conversation starter, double-gated on `ENABLE_WEEKLY_DIGEST` + `RESEND_API_KEY`) | ✅ |
| — | Daily challenge + continue card | ✅ already existed (DailyMissionCard/QuickStatsBar/ActivityFeed) — was hidden behind the now-fixed no-profile dead-end |

Repo-guard suite is fully green for the first time (817/817 — the stale DESIGN_COMPLIANCE_MATRIX was regenerated).

## III.1 The `DESIGN.md` — how we author it (next working session)

`DESIGN.md` becomes the single source of truth for the new visual system; every page PR after it must cite the tokens/patterns it uses. Authoring process:

1. **Reference decomposition.** Extract the *transferable mechanics* (not the look) from the owner's reference set: **sentry.io** (product-first hero, live UI frames, confident dev-brand typography), **irisyireihu.com** (scroll-driven storytelling, oversized type, art direction courage), **ciaoenergy.com** (physical scroll feel, pinned chapters, playful color), **abvtek.com** (bold single-idea sections, motion restraint). Each contributes a named pattern to the system.
2. **Trend scout.** Survey current (2026) front-end motion/design: scroll-driven animations via native CSS `animation-timeline` where possible, View Transitions API for page-to-page morphs, spring physics (motion/react), grain/gradient-mesh backgrounds, oversized kinetic type, cursor-aware components, bento grids, glassmorphism-lite on light surfaces. GitHub scouting: shadcn patterns, motion.dev examples, Framer templates, awwwards winners — extract only what serves a kids-product (joyful, legible, fast) and passes the repo's contrast/spacing guards.
3. **Owner inputs.** The mascot reference image (incoming) defines Sparky's interim look — SparkyCore's SVG gets re-skinned to match it ONCE, and every surface (marketing hero, micro-game, dashboard floating buddy, game reactions, presenter, tour) inherits automatically since all already consume the same component. Uniformity is enforced by a repo guard: no new mascot drawings outside `src/components/sparky/`.
4. **The document itself** (target ≤ 400 lines): brand personality (3 adjectives + anti-adjectives); color system (the existing `--sf-*` tokens extended — one light app surface + one dark marketing surface, both already guard-tested); type scale (display/body, kinetic-type rules); motion vocabulary (durations/springs/stagger constants, reduced-motion contract); component canon (SFButton/SFCard/SFInput + the new patterns: bento stat cards, chapter sections, cursor-aware cards); mascot placement contract; per-page-archetype layout recipes (marketing chapter page, dashboard page, game shell, settings/form page); accessibility floor (AA contrast, focus, touch targets ≥44px).

**Deliverable gate:** DESIGN.md reviewed/approved by owner → becomes the contract for III.2/III.3.

**Status (July 2):** DESIGN.md v1.0 AUTHORED — grounded in the reference-site decomposition (Sentry: text-forward promise hero, progressive-disclosure rhythm, product-frame proof, motion restraint · iris yirei hu: specimen pages, handcrafted warmth, image-first storytelling · Ciao: product-object hero, variant accent recoloring, bookended nav · AbvTek: poetic microcopy, numbered galleries, size-contrast type, whitespace shell), the 2026 trend survey (CSS animation-timeline, View Transitions, springs-default, grainient backgrounds, kinetic type ×1/page, bento ≤2/page, glassmorphism-lite; avoid-list: preloaders, scroll-jacking, glitch-text-as-primary, custom cursors), and the react-bits curation (6 KEEP, 3 RESTYLE, 1 REPLACE, 2 RETIRE + 8 vetted additions incl. LightRays as the hologram backdrop and AnimatedBeam for Lab-11 agent graphs). Resolves the live Exo 2/Sora vs Nunito/Inter font conflict in favor of Exo 2 + Sora. **Awaiting owner approval → unlocks R1.**

## III.2 Homepage: "visually stunning interactive hero page"

Building on the shipped v1 (Sparky hero + micro-game), the DESIGN.md-powered v2:

- **Hero:** full-bleed animated gradient-mesh/aurora tuned to the new palette; kinetic headline (staggered per-word spring reveal); Sparky (re-skinned) tracks cursor, blinks on idle, waves on load; live product frame (real dashboard screenshot in a floating tilted card, Sentry-style) under the fold.
- **Micro-game grows up:** the sort demo gets the DESIGN.md skin + a shareable end-card ("I trained an AI!" with Sparky) — the page's conversion engine.
- **Chapter scroll narrative** (ciaoenergy pattern): Build → Learn → Earn pinned chapters with scroll-scrubbed progress, each ending in one oversized stat.
- **Labs bento** (abvtek pattern): 11 labs as a bento grid, each tile lab-colored with icon + one-line kid outcome; hover = tile grows + Sparky peeks.
- **Trust chapter for parents:** COPPA/no-ads/no-tracking with links (all legal pages now reachable), UNESCO competency mapping (Part II).
- Performance budget: hero LCP < 2.5s, no canvas on mobile, `prefers-reduced-motion` = full static integrity.

### III.2.1 Hero v3 — "The Hologram Reveal" (owner direction, July 2)

**Concept (owner):** Sparky connects to a small projection device that holographically emits a large banner reading "Welcome to SparkForge Labs" — this is the homepage title animation. Micro-game demo and remaining sections sit below. Owner is open to removing/replacing all current react-bits effects during the redesign.

**Storyboard (build spec):**
1. *0–0.8s* — Sparky floats in; an inert projection puck sits on the hero floor.
2. *0.8–1.5s* — Sparky reaches out; a cyan energy arc jumps from his chest core to the puck; its ring ignites.
3. *1.5–3s* — a translucent cyan light-cone fans upward (animated scanlines, edge flicker); the banner materializes inside it, resolving from glitch-noise to crisp type with a persistent hologram shimmer.
4. *3s+* — subtitle + CTAs fade in; Sparky settles into idle bob beside his projector; the whole rig parallaxes gently with the cursor.
5. Reduced-motion / instant-on path: skip to the finished lit composition.

**Tech:** pure SVG + Framer Motion (no new deps). The hologram replaces the FloatingLines WebGL background as the hero's light source — first react-bits removal. SparkyCore gains a fluid size mode (exact px or CSS clamp()) so the mascot scales proportionally to the viewport on marketing surfaces while dashboard/game placements keep fixed sizes.

**Owner decisions (July 2 — LOCKED, implemented):**
1. Hologram title "Welcome to SparkForge Labs" REPLACES the old headline. New brand subtitle below the animation: **"Sparking Curiosity, and Forging Skills with AI"** — solid design-scheme color, NOT holographic, with a react-bits ShinyText treatment to make it pop.
2. Full sequence on **every visit** (~3s) — "a staple of the entire web app site." Reduced-motion renders the finished composition instantly.
3. Hologram color: **cyan gradient matching Sparky** (#4DE9FF family).
4. Mobile: same sequence, **simplified cone effects** (no flicker/scanline animation).
5. **Built now** (`HeroHologram.tsx`) and specced into DESIGN.md §3 for reference/future edits.

**Additional owner direction:** react-bits are NOT removed wholesale — the set gets re-curated during the DESIGN.md authoring session for more advanced, coherent, visually stunning components on par with the new system. SparkyCore gained the fluid `pixelSize` prop (CSS clamp) so the mascot scales proportionally per screen on marketing surfaces.

## III.3 App-wide rollout — page-by-page phases (post-DESIGN.md)

Each phase = one PR, one visual checkpoint, guards must stay green. Order chosen by user exposure:

| Phase | Pages | Scope |
|---|---|---|
| R1 | Dashboard shell (Sidebar/TopBar/BottomNav) + Home | New tokens/type/motion; Home becomes the "mission control" (daily mission hero card, continue strip, goal ring) per DESIGN.md recipes |
| R2 | Labs index + Lab detail | Bento lab grid, lab-colored themed detail headers, game cards with per-game art direction (kills the grey-tile feel) |
| R3 | Arcade + game detail + GameShell chrome | Game cards with art, filter chips, GameShell frame/celebration ritual restyle (feeds Part II G3 juice work) |
| R4 | Auth (login/signup/forgot) + onboarding/add-child | One dark-surface recipe, kinetic Sparky welcome, wizard polish |
| R5 | Progress/Achievements/Mastery/Seasons/Story/Buddies/Create | Data-viz styling pass, honest empty states with Sparky, skeletal pages get real "coming soon" identity |
| R6 | Parent suite + Settings + subscription/pricing | Parent-calm variant of the system (denser, quieter), pricing page restyle |
| R7 | Marketing rest: pricing, legal, 404/offline, emails | Digest email template matches brand; error pages get Sparky |

Rules for every R-phase: mascot only via `components/sparky`; tokens only via DESIGN.md; contrast/spacing guard tests must pass; screenshot before/after into the PR; mobile first-class.

## III.4 Dependencies & owner actions

- **Mascot reference image** (owner, incoming) → unlocks the SparkyCore re-skin at the start of R1.
- **DESIGN.md approval** (owner) → unlocks III.2/III.3.
- Optional later: author `public/rive/sparky.riv` per `docs/SPARKY-RIVE-SPEC.md` (Rive web editor, desktop browser) — drops in with zero code changes.
- Production env: set `ENABLE_WEEKLY_DIGEST=true` + `RESEND_API_KEY` when ready to send digests; add a `vercel.json` cron entry (`0 16 * * 0` → `/api/cron/weekly-digest`) since none exists yet.
- Server-side follow-ups logged: games-per-week free-tier tracking; `thinking` signal for SparkyRive.
