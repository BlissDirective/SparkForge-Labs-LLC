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
| P0-7 | **Add Child Profile modal renders dark-theme UI on the light app** — heading/inputs near-unreadable; creation fails silently with no error feedback. This is the FIRST action every new parent must take. | U/C | Rebuild modal on the light design system; show validation + API errors inline; optimistic redirect to Home on success | ⬜ Phase 1 |
| P0-8 | Unknown URLs 307 to `/login` (no 404 page reachable when logged out) | U | Serve `not-found` for unknown paths; keep auth redirect only for known-protected prefixes | ⬜ Phase 1 |

### P1 — fix before marketing push

| # | Issue | Hurts | Fix | Status |
|---|---|---|---|---|
| P1-1 | Marketing copy contradictions (games/labs/ages) | T | unified to 42/11/7–16 | ✅ |
| P1-2 | Fake data: sidebar "Alex Lv5", parent Time-by-Game, progress This-Week sparkline | T | real data + empty states | ✅ |
| P1-3 | Homepage hero: "Learn AI." near-black on dark bg; light-streak washes out subheadline + trust chips | U/C | Rework hero text contrast (Phase 2 redesign) | ⬜ |
| P1-4 | **Lab tier gating unenforced** — `freeLabsAccess`/`previewLabs` have zero runtime consumers. Free accounts get everything; pricing page promises limits that don't exist → no upgrade pressure | C | Implement gate at lab/game entry, upsell modal on locked content | ⬜ Phase 4 |
| P1-5 | "97% Kids Love It" + "5x faster retention" unsubstantiated claims | T | Replace with real numbers or drop | ⬜ Phase 2 |
| P1-6 | Progress page: "Across all 0 learning labs", duplicated Overall cards, `<path d="undefined">` SVG error on Profile | T | data wiring + chart guard | ⬜ Phase 1 |
| P1-7 | Lab detail page shows bare infinite spinner (no skeleton, no error state) | U | skeleton + error/empty states (largely unblocked by P0-2 fix) | ⬜ Phase 1 |
| P1-8 | Cookie banner: "essential cookies only" link near-invisible; overlaps footer text; on mobile it collides with Sparky avatar + covers "Got It" | U/T | Restyle banner, single bottom-sheet on mobile, z-index audit | ⬜ Phase 1 |
| P1-9 | Mobile marketing nav overflows (Privacy/Terms clipped, no hamburger) | U | responsive nav menu | ⬜ Phase 2 |
| P1-10 | Final homepage CTA is "Sign In"-first ("Login to see the all New Agentic Lab and Games" — awkward grammar, wrong audience) | C | New-visitor-first CTA: "Create Free Account", fix copy | ⬜ Phase 2 |

### P2 — quality of experience

| # | Issue | Hurts | Fix |
|---|---|---|---|
| P2-1 | Flagship gameplay is UI-only (Pet Trainer = 4 sliders + Run button; slider tracks invisible; the "pet" is a stray googly-eye orb overlapping the wrong tile) | U/C | Game-feel overhaul (Phase 5) |
| P2-2 | Level-select screens: flat grey lock tiles, no imagery, no juice | C | Phase 5 template |
| P2-3 | White-frame cards with dark inner panels on homepage look theme-broken | T | Phase 2 design system pass |
| P2-4 | Homepage scroll sections invisible until IntersectionObserver fires (blank 3,600px in static render; fast scrollers see empty page; SEO/social preview sees nothing) | U | Animate opacity 0.99→1 or use `whileInView` with `initial={false}` below the fold |
| P2-5 | Arcade star ratings identical (3★) for all games — meaningless | T | Real difficulty/rating data or remove |
| P2-6 | "1 Children" grammar; "0/1 profiles used (Spark Free)" contradicts "1 Children" stat | T | pluralization + single source of child count |
| P2-7 | GPU stalls (ReadPixels warnings) + deprecated THREE.Clock on homepage hero | — | Phase 2 replaces hero canvas |
| P2-8 | Demo card on login: "Try SparkForge Free" gradient text invisible on white; feature icons render blank | C | restyle demo card |
| P2-9 | 404 resource error on every logged-in page (missing asset) | T | trace + fix in Phase 1 |
| P2-10 | Sparky on dashboard is a static PNG in the corner, partially clipped, overlaps cookie banner; zero interactivity despite "floats around the app, ready to help" promise | U/T | Mascot system (Phase 3) |

### P3 — polish backlog

- Nav includes Privacy/Terms as primary items (should be footer-only); Search + notification-dot in TopBar do nothing visible; "Most Popular" sort with no popularity data; Seasons/Mastery/Buddies pages are skeletal ("coming soon" energy without saying so); marketing `<h1>` contains a `<style>` tag (metallicSweep keyframes leak into accessibility tree); `Do not have an account?` copy (✅ fixed); Remember-me checkbox unstyled native; hero MP4 fallback absent.

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
