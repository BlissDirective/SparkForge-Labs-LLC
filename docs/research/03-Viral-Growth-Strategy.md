# SparkForge — Viral Growth & High-Retention Strategy

**Version:** 1.0 | **Date:** June 21, 2026 | **Branch:** `claude/sparkforge-viral-strategy`
**Author:** Strategy pass (codebase audit + 2026 trend research)
**Status:** PROPOSAL — for founder review. No app code changed by this document.

---

## 0. TL;DR — The One Big Reframe

> **SparkForge does not have a retention problem. It has an *acquisition + virality* problem.**

The audit found **production-grade retention machinery already shipped**: streaks (with freezes, wagers, 2× XP), a 6-tier Duolingo-style league system, virtual pets with offline decay + evolution, seasons/battle-pass, daily + weekly quests, a 5-chapter branching story, 35+ badges, per-lab mastery certificates, parent analytics, and a mascot (Sparky). That is more retention surface than most funded edtech apps ever build.

What is missing is the thing that actually makes an app *spread*:

1. **A shareable artifact** — something a human wants to post that points back to the app.
2. **A daily public ritual** — one shared event everyone does and talks about.
3. **An adult-routed viral loop** — because **kids legally cannot be the broadcast vector.**

### The COPPA constraint that shapes everything (read this first)

The 2026 COPPA update (effective **April 22, 2026**) tightened the rules: separate verifiable parental consent for any third-party data sharing, no indefinite retention, biometric data now protected, and AI-training data collection is *never* bundled into "providing the service." For an app whose primary users are 7–13, this means:

- ❌ Kids **cannot** have public profiles, public usernames, open social graphs, or post to the open web.
- ❌ You **cannot** build a "kid posts their score to TikTok" loop directly.
- ✅ You **can** build artifacts that **parents and teachers** share.
- ✅ You **can** build **anonymized, PII-free score grids** (Wordle-style) that anyone shares.
- ✅ You **can** run **closed, parent-approved** peer loops (you already do — invite codes + parental approval).

**Therefore every viral mechanic below is engineered to route through one of three legal vectors:**

| Vector | Who broadcasts | Example artifact |
|---|---|---|
| **A. The Artifact** | Anyone (it's PII-free) | "Reality Check 4/5 🟩🟩🟨🟩🟩" emoji grid |
| **B. The Parent** | The parent (proud, consenting adult) | "My kid built this with AI" creation card; weekly AI Report Card |
| **C. The Teacher** | The educator (institutional channel) | Free classroom tournament; class leaderboard |

This is exactly how every successful kids-adjacent product spreads (Wordle's grids, Duolingo's parent screenshots, Prodigy/Kahoot's teacher distribution). We are not inventing a new growth physics — we are applying the proven one to an app that already has the retention half solved.

---

## 1. What Already Exists (so we propose *deltas*, not duplicates)

Condensed from the two codebase audits. **Do not rebuild these.**

| System | Status | Files (anchor) |
|---|---|---|
| Streaks + freeze + wager + 2× XP | ✅ Shipped | `src/app/api/gamification/streak/`, `src/components/streak/` |
| XP / levels / gem economy (server-authoritative) | ✅ Shipped | `src/app/api/currency/`, `src/lib/currency/CurrencyEngine.ts` |
| Badges (35+) + per-lab mastery + certificates | ✅ Shipped | `src/app/api/mastery/`, `src/app/api/gamification/badges/` |
| 6-tier weekly leagues (COPPA pseudonyms) | ✅ Shipped | `src/lib/leaderboard/LeaderboardEngine.ts` |
| Friends (invite code + **parent approval**) + preset-only messaging | ✅ Shipped | `src/app/api/friends/`, `src/app/api/messages/` |
| Seasons / battle-pass + cron rotation | ✅ Shipped | `src/lib/seasons/SeasonEngine.ts` |
| Virtual pet (decay, evolution, care quality) | ✅ Shipped | `src/lib/pet/PetEngine.ts` |
| Daily + weekly quests + 5-chapter branching story | ✅ Shipped | `src/lib/quests/`, `src/lib/story/` |
| Parent dashboard + usage analytics + email cron | ✅ Shipped | `src/app/api/parent/`, `src/lib/email.ts` |
| Sparky mascot (9 SVG expressions; Rive planned) | ✅ Shipped | `src/components/sparky/` |
| 42 games / 11 labs (incl. RealOrFake, AiOrNot, PromptLab) | ✅ Shipped | `src/components/games/` |
| Prompt Lab — Claude API, 5-dimension prompt scoring | ✅ Shipped | `src/components/games/PromptLabGame.tsx`, `src/app/api/ai/prompt-lab/` |
| AI content generation (14 games, 60+ types) | ✅ Shipped | `src/app/api/ai/generate-content/` |
| Demo mode (30-min anon, COPPA-safe) | ✅ Shipped | `src/stores/authStore.ts` |
| Landing + pricing + legal pages | ✅ Shipped | `src/app/(marketing)/` |
| Lumen "Papercraft Neon" rebrand | 🟡 Locked, not built | `docs/UI-Game-Enhancements/brand/Brand-Bible-v1.md` |

### The honest gaps (what virality needs and the app lacks)

1. **No shareable artifact exists anywhere.** Profile page has no share card; games produce no shareable result; Prompt Lab creations aren't exportable. (Audit explicitly: "Sharing… not visible," "Shared profile cards — not implemented.")
2. **No daily *shared* event.** Quests are per-child and seeded individually — there is no single thing the whole community does today and talks about.
3. **No teacher/classroom surface at all.** Zero institutional distribution channel.
4. **Sparky is a static helper, not a personality.** No voice, no social presence, no conversation — the single biggest under-used marketing asset.
5. **The landing page tells; it doesn't let you play.** No "try one round before signup" hook.
6. **Prompt Lab is a *test*, not a *toybox*.** It scores you; it doesn't let you make something you're proud to keep.

---

## 2. The 2026 Trend Read (why these bets, now)

Sourced research (full citations §11). The signal:

- **AI literacy in 2026 = critical thinking, not tool tutorials.** The durable question set is *"What did this system learn from? How do I verify it? Am I in control?"* Deepfake/"real-or-AI" detection is the single most viral, most news-relevant, most parent-resonant AI-literacy topic of the year (UNESCO, MediaSmarts AI Literacy Day, "Detect Fakes" games trending on Snapchat).
- **Parental involvement is the #1 efficacy multiplier.** Kids whose parents engage show stronger critical thinking + STEM interest. Parents are *both* the efficacy lever and the share vector. Build for them.
- **Duolingo's growth = layered loss-aversion + a mascot with a personality.** The owl that "dances, jokes, and threatens users" drove brand virality; streaks drove retention. You have the streaks. You're missing the owl's *attitude*.
- **Wordle physics: daily + single shared puzzle + spoiler-free emoji grid = organic explosion.** No app store spend, pure word-of-mouth.
- **UGC + creator economy is where kid attention lives** (Roblox: a single UGC title out-played Blizzard's whole 2024 catalog). "Secret code" share mechanics and creation pride drive it. Kids want to *make*, not just consume.
- **AI creation tools raised kids' creative output +60% (Stanford 2025).** "Teens love projects that feel real and shareable." Proper-attribution culture ("Made with AI using ___") is being taught as digital citizenship — lean into it as a *feature*, not a disclaimer.
- **TikTok 2026: educational content = 35% of searches; "Add Yours" sticker campaigns are the fastest-growing organic tactic; raw/BTS beats polished 2×; mascot personas win.**
- **Safety is now a moat, not a tax.** Character.AI *killed* its minor chatbot experience; HeyOtto wins by being COPPA-built and explicitly "does not form emotional attachments." A *safe* kid-AI companion is a differentiated, defensible position.

---

## 3. The Seven Flagship Bets (ranked)

Each bet lists: **the idea → why it goes viral → which existing system it extends → COPPA note → effort.** Effort is T-shirt (S/M/L) relative to this codebase.

---

### ⭐ BET 1 — "Reality Check": the daily, shareable, real-or-AI ritual (the Wordle move)

**The single highest-leverage feature in this document. Build this first.**

**What:** One global daily challenge. Every user, everywhere, gets the **same** 5 items today — images, short video clips, audio, or text — and judges each **Real vs. AI**. At the end you get a **spoiler-free emoji grid** to share:

```
SparkForge Reality Check #214
🟩🟩🟨🟩🟩  4/5 — can YOU beat me?
sparkforge.ai/today
```

- A streak ("🔥 Reality Check streak: 23 days") layered on top of the existing streak engine.
- A daily global leaderboard ("Today 61% of humans got #214's deepfake right — did you?").
- A **"how it fools you"** reveal after each guess (this is the *literacy* payload — teaches the tell: hands, reflections, audio artifacts, watermark checks).
- Age-banded difficulty (A/B/C) but the *same theme* daily so families/classes can compare.

**Why it goes viral:** This is the proven Wordle loop — daily cadence (habit), single shared instance (water-cooler talk), and a **PII-free emoji grid** (the legal share artifact). It rides the #1 AI-literacy news topic of 2026 (deepfakes). It's playable by adults too, so **parents and teachers share their own scores**, pulling in their networks. It is the perfect top-of-funnel: a stranger sees a grid → plays one round un-gated on the landing page → signs their kid up.

**Extends:** `RealOrFakeGame.tsx` + `AiOrNotGame.tsx` (mechanics already exist) + `SeasonEngine`/quest cron (daily rotation infra exists) + `LeaderboardEngine` (global stats) + `generate-content` (Claude can author the "why it's fake" explainer). The content set can be human-curated to start (legal-safe, licensed/synthetic media) and AI-assisted later.

**COPPA note:** The shareable grid contains **zero PII** — number + emoji + puzzle # only. Kids never post; the artifact is shareable by anyone. Source media must be licensed or first-party synthetic (never scraped real people, especially minors).

**Effort:** **M.** New `dailyChallenge` engine + table + a public un-gated route. Reuses two existing games' rendering.

> **This one feature simultaneously fixes the daily-ritual gap, the shareable-artifact gap, the landing-page-demo gap, and rides the year's hottest literacy topic. It is the keystone.**

---

### ⭐ BET 2 — "Maker Studio": turn Prompt Lab from a *test* into a *toybox* (the creation + parent-brag loop)

**What:** A first-class creation space where kids **make things with AI and keep them**: an AI-illustrated short story, a comic strip, a "design your own AI creature," a tiny text adventure, a song-lyric, a poster. Output is a **branded, watermarked artifact**:

> *"Made with SparkForge AI 🔮 by Maya, age 9 — Lab 4: AI That Creates"*

- A personal **Gallery** on the child profile (currently the profile has nothing shareable).
- A **parent-gated "Share this creation"** button → produces a clean image/PDF the *parent* posts. (Kid taps "Send to grown-up"; parent approves + shares. This is the legal bridge.)
- Teaches **prompt engineering naturally** (the research-backed pedagogy) and bakes in **attribution literacy** ("always say *made with AI*") as a celebrated feature, not fine print.

**Why it goes viral:** "Look what my 9-year-old made with AI" is irresistible parent-share content, and it's *aspirational* for other parents ("my kid should be doing that"). It rides the +60% creativity stat and the booming kids-AI-art space — but with a **safety + learning** wrapper that consumer art tools lack. The artifact carries your brand into every parent's feed.

**Extends:** `PromptLabGame.tsx` + `/api/ai/prompt-lab` (Claude integration + moderation already exist; you're adding *persistence + export*, not new AI plumbing). Reuses the `content` table and Sparky for guidance.

**COPPA note:** First name + age band only on the artifact (parent-configurable, can be initials/nickname). Parent-approval gate before any external share. Moderation pipeline already exists (Haiku post-check) — extend it to cover image-gen prompts.

**Effort:** **M–L.** Persistence + gallery UI + export renderer + parent-share gate. The hard part (safe Claude calls) is done.

---

### ⭐ BET 3 — Give Sparky a personality and a megaphone (the Duolingo-owl play)

**What:** Two moves, one mascot.

1. **External (marketing): Sparky becomes a *character*, not a logo.** A voice and attitude — curious, mischievous, obsessed with catching AI fakes. Short-form content: "Sparky busts an AI myth in 15s," "Sparky reacts to AI fails," "Sparky tries to fool you." This is the cheapest, highest-ROI marketing asset you own and it's **already modeled** (Rive rig planned, 9 expressions exist).
2. **Internal (product): "Talk to Sparky" — a genuinely safe AI companion.** On-rails, age-gated, *explicitly designed not to form emotional attachment* (the HeyOtto differentiator; the opposite of Character.AI's withdrawn minor experience). Sparky answers "how does AI work?" questions, gives hints, and **narrates the daily Reality Check reveal**. Conversational, but scaffolded + moderated, never open-ended companionship.

**Why it goes viral:** Duolingo proved a mascot with edge is worth more than any ad budget. A safe, funny, AI-literacy mascot is *the* ownable brand character in this category — nobody owns "the friendly AI that teaches kids to outsmart AI." And a **safe** kid-AI companion is a defensible PR + trust story precisely as competitors retreat from minors.

**Extends:** `src/components/sparky/` (build the planned Rive rig: `public/rive/sparky.riv`), `guideStore.ts` + `/api/ai/guide/` (the safe-Claude-guide endpoint already exists — upgrade it to conversational with strict guardrails).

**COPPA note:** Conversation is logged for safety (you already log `prompt_history`), no data used for ad targeting or model training (now explicitly illegal), hard "I'm just a guide, talk to a grown-up about big feelings" rails. Market the safety loudly — it's a feature.

**Effort:** External persona: **S** (content/brand, not engineering). In-app companion: **M** (guardrails + conversational upgrade of an existing endpoint).

---

### ⭐ BET 4 — The "AI Report Card" parents actually *want* to post (the parent loop, automated)

**What:** An auto-generated, beautiful **weekly artifact** delivered to parents (email + a shareable image card):

> *"This week Maya leveled up her **AI Ethics** brain 🧠 — spotted 12 deepfakes, wrote 8 great prompts, and earned the 'Bias Buster' badge. She's in the top 15% of young AI thinkers this week."*

Designed to be screenshot-and-post-worthy (the opposite of a boring grades email). Includes one **"brag card"** image sized for social, with the kid's first name + a proud stat + your brand.

**Why it goes viral:** It weaponizes the strongest organic channel a kids' app has — **proud parents** — on a *weekly cadence* (52 share-prompts/year per family). It also doubles as a **retention + conversion** tool (reminds lapsed parents, justifies the subscription). Research says parent engagement is the #1 efficacy lever; this makes engagement effortless and shareable.

**Extends:** `/api/parent/dashboard` + `/api/parent/usage` (the analytics already aggregate) + `src/lib/email.ts` + existing cron infra (`/api/cron/*`). You're adding a **render + compose** step to data you already compute.

**COPPA note:** Sent only to the verified parent. Parent controls whether the share card shows first name / nickname / initials. No child-to-child data.

**Effort:** **S–M.** Mostly a templating + image-render + cron job over existing analytics.

---

### BET 5 — "Classroom Mode": the teacher distribution wedge (the institutional vector)

**What:** A free, lightweight **teacher surface**: create a class, drop in a join code, and run a **live "Reality Check" tournament** (Bet 1, but synchronous + class leaderboard) à la Kahoot. Plus free downloadable **AI-literacy lesson packs** built from existing game content.

**Why it goes viral:** Edtech's cheapest, most durable growth channel is teachers — one teacher onboards 30 kids, and they bring it home to parents (who convert to paid). 2026 is the year AI-literacy curricula formally enter schools (Khanmigo in thousands of districts; MediaSmarts AI Literacy Day). A free classroom Reality Check is a Trojan horse: standards-aligned, genuinely useful, and it seeds the consumer funnel.

**Extends:** Reuses Bet 1's daily challenge + `LeaderboardEngine` (class-scoped). New: a teacher role + class-join COPPA flow (school-consent model differs from parent-consent — design carefully).

**COPPA note:** Uses the **school-consent / "school as agent of parent"** pathway (FERPA-adjacent). This is a distinct legal track — scope it as Phase 2, not a quick win. Keep classroom data minimal and ephemeral.

**Effort:** **L** (new role, new consent path). High payoff, but not the first thing to build.

---

### BET 6 — "Specimen Dex": evolve the pet into a collectible AI-creature system (retention + status + FOMO)

**What:** Reframe the existing virtual pet into a **collectible roster of "AI specimens"** — each creature embodies an AI concept (a "Neuron Sprite," a "Bias Gremlin you must tame," a "Hallucination Phantom," a "Transformer Titan"). You **collect, train, and evolve** them by completing the labs that teach their concept. A **"Dex"** tracks your collection (Pokédex energy: "gotta learn 'em all"). Seasonal **limited drops** (rides the FOMO/drop research) and **parent-approved trading** between buddies.

**Why it goes viral / retains:** Collection + completion + scarcity is the most durable retention loop for kids (Roblox/Pokémon). Each creature is a **learning checkpoint disguised as a collectible**, so retention and pedagogy point the same direction. Limited seasonal drops create return-visit FOMO. Trading (within the existing parent-approved buddy graph) creates closed-loop social pull.

**Extends:** `PetEngine.ts` (evolution/decay/care already exist — generalize from 1 pet to a roster), `SeasonEngine` (drops), `friends/` + `messages/` (parent-approved trade rails already exist).

**COPPA note:** Trading runs **only** inside the existing parent-approved friend graph with preset interactions — no open marketplace, no real-money trading, ever.

**Effort:** **M–L.** Significant content/art (creature designs — pairs perfectly with the Lumen papercraft rebrand) but mostly a generalization of shipped systems.

---

### BET 7 — "Prompt Duels" + "Forge Codes": closed-loop competitive & secret-code virality

**What:** Two smaller, synergistic mechanics:

1. **Prompt Duels** — async head-to-head: two buddies get the same creative challenge, both write a prompt, **Claude judges** which prompt produced the better result (on the 5 dimensions you *already score*). Winner takes gems. A spectator-friendly result card (parent-shareable).
2. **Forge Codes** — shareable "secret code" unlocks (the Roblox viral-code mechanic): a kid's **parent** shares a code that grants a cosmetic/creature to whoever redeems it. Codes also seed **referral** ("3 friends joined with your Forge Code → unlock the Legendary Sparky skin").

**Why it goes viral:** Duels turn the Prompt Lab's *solo test* into *social competition* (more reasons to return, shareable outcomes). Secret codes are a proven kid-virality primitive and double as a **measurable referral loop** routed through parents.

**Extends:** `PromptLabGame` + `/api/ai/prompt-lab` (judging reuses existing scoring), `friends/` + `buddy-quests/` (duel pairing), invite-code infra (`friend_invite_codes` table already exists → generalize to Forge Codes).

**COPPA note:** Duels stay inside parent-approved buddy pairs; codes are generated/shared by parents; referral rewards are cosmetic only.

**Effort:** Duels **M**; Forge Codes **S** (extends existing invite-code system).

---

## 4. Content & Topical Virality (ride the news cycle)

Marketability comes from **timeliness**. Make content production *react to AI headlines*:

- **"This Week in Reality"** — the daily Reality Check's Friday edition uses *that week's* viral AI news (a famous deepfake, an AI-slop scandal). Inherently shareable + teaches current-events literacy. The existing `generate-content` pipeline + human curation can turn this around fast.
- **Topical Seasons** (extends `SeasonEngine`): *"Deepfake Detective"* season, *"Agent Academy"* season, *"AI Art Heist"* season — each a 4–6 week themed arc with a limited creature drop (Bet 6) and a story chapter (story engine exists). Seasons give you a **marketing beat every 6 weeks** and a reason for press outreach.
- **"Myth vs. Machine"** micro-content — Sparky-voiced 30s explainers debunking AI myths ("No, AI is not alive," "Yes, AI makes stuff up — here's how to check"). Doubles as TikTok content (Bet 3) and in-app learn cards.
- **Parent-facing literacy hooks** — short "what your kid learned about deepfakes this week, and how to talk about it at dinner" notes in the AI Report Card. Turns the app into a *family AI-literacy* product, widening the market beyond "kids' game."

---

## 5. Game-Layer Upgrades for Shareability

The games are deep but produce no shareable output. Cheap, high-leverage additions:

1. **Every game ends in a "result card"** (score + emoji grade + Sparky reaction + brand), parent-shareable. One shared component reused across 42 games. **(S, huge surface area.)**
2. **"Beat my score" challenge links** for the flagship games — generated by a parent, opens an un-gated single-round demo (top-of-funnel + Classroom-ready). Reuses the demo-mode infra.
3. **Daily-challenge-ify the best games** — Reality Check (RealOrFake) is bet 1, but *"Fool the AI" daily* and *"Spot the Bias" daily* are natural follow-ons once the daily-challenge engine exists.
4. **Pocket Brain (client-side WebGPU LLM) is a press magnet** — "your kid runs a real AI model *on the device*, no data leaves." Lean into it in marketing as a privacy + wow story; surface a "look inside the brain" shareable visualization.

---

## 6. Profile & Identity Upgrades (status, the safe way)

The profile page currently has no shareable identity. Add:

- **The "AI Thinker Card"** — a baseball-card-style identity card: avatar, level title ("Junior Deepfake Detective"), top badges, Reality Check streak, signature creature (Bet 6). **Parent-shareable.** This is the kid's flex object — the thing leagues and badges currently lack an outlet for.
- **Earned *title* progression** tied to literacy, not just XP ("Prompt Apprentice → Prompt Artisan → Prompt Master"). Titles are status that's *legible to parents* (they signal real skill).
- **In-app "Hall of Fame"** — a closed, COPPA-safe showcase (pseudonymous, like the existing leagues) of top Reality Check scores / best (moderated) Maker Studio creations of the week. Status broadcast without leaving the walled garden.

---

## 7. Landing & Demo Page Reinvention

Today the landing *describes* the product. It should let you *feel* it in 10 seconds.

**Recommended new hero flow:**

1. **Hero = play one round of today's Reality Check, un-gated.** "Real or AI? You have 5 seconds." A visitor *plays*, gets a score + the emoji grid + "want your kid to get this good? → start free." This is the single best top-of-funnel change you can make and it's powered by Bet 1.
2. **"Made by kids like yours" gallery** — a rotating, moderated strip of Maker Studio creations (Bet 2). Social proof + aspiration.
3. **Sparky greets you with personality** (Bet 3) — not a static mascot, a character that reacts.
4. **A live counter** — "1,204 fakes spotted today" / "Reality Check #214 — 58% got it right." Real-time social proof (the FOMO/social-proof research).
5. **Keep the cinematic Lumen aesthetic** (the planned papercraft-neon rebrand) as the *frame*, but lead with *interaction*, not animation.

The 30-min **demo mode already exists** — wire the un-gated Reality Check round into it so "try → play → convert" is frictionless.

---

## 8. Marketing Playbook (channels → tactics)

| Channel | Tactic | Powered by |
|---|---|---|
| **TikTok / Reels / Shorts** | Sparky persona content; "Can you beat today's Reality Check?"; AI-fail reactions; raw BTS (research: BTS beats polished 2×) | Bet 3 |
| **"Add Yours" / duet campaigns** | "Add yours: your kid's Reality Check score" / "what my kid made with AI" — fastest-growing 2026 organic tactic | Bets 1, 2 |
| **Parent communities (FB groups, Reddit, school newsletters)** | The weekly AI Report Card + brag cards are drop-in shareable | Bet 4 |
| **Teachers (TpT, edu Twitter/X, conferences)** | Free Classroom Mode + lesson packs | Bet 5 |
| **Press / PR** | "The app teaching kids to outsmart deepfakes" (rides UNESCO/MediaSmarts narrative); "runs a real AI on your kid's device" (Pocket Brain); "the *safe* kid AI companion" (anti-Character.AI angle) | Bets 1, 3 |
| **Referral** | Forge Codes — measurable, parent-routed, cosmetic rewards | Bet 7 |
| **Seasonal beats** | A press + content moment every 6 weeks | §4 Seasons |

---

## 9. Prioritized Roadmap

Scored by **Impact on virality × Reuse of existing systems ÷ Effort.** Highest leverage first.

### Phase 1 — "The Keystone" (build now, ~4–6 weeks)
1. **Bet 1 — Reality Check daily challenge** + un-gated landing round (§7.1). *Fixes 4 gaps at once.*
2. **Bet 4 — AI Report Card** (parent loop; mostly templating over existing analytics).
3. **Game result cards** (§5.1) — one shared component, instant shareability across 42 games.
4. **Bet 3a — Sparky external persona** (brand/content track; can run in parallel, near-zero eng cost).

### Phase 2 — "The Engines" (~6–10 weeks)
5. **Bet 2 — Maker Studio** (creation + parent-share; the aspirational artifact).
6. **Bet 3b — "Talk to Sparky" safe companion** (the trust/PR differentiator).
7. **Profile "AI Thinker Card"** (§6) + earned titles.
8. **Bet 7 — Forge Codes** (referral) + **Prompt Duels**.

### Phase 3 — "The Multipliers" (~10+ weeks)
9. **Bet 6 — Specimen Dex** collectible system (pairs with the Lumen rebrand art push).
10. **Bet 5 — Classroom Mode** (separate consent track; institutional growth).
11. **Topical Seasons cadence** (§4) as the ongoing marketing engine.

> **If you do only one thing: ship Bet 1.** It is the daily ritual, the shareable artifact, the landing-page demo, and the on-trend literacy hook — in a single feature, built mostly from systems you already have.

---

## 10. Guardrails & Risks (non-negotiable)

- **COPPA-first, always.** Every share routes through a PII-free artifact or a verified parent. No public kid profiles, no open social graph, no kid-to-open-web posting. Re-confirm the April 2026 separate-consent rules before any third-party share integration.
- **Source media legality (Bet 1).** Real-or-AI content must be licensed or first-party synthetic. Never use real people's images without rights — *especially never minors'*. This is both legal and reputational.
- **AI companion safety (Bet 3).** Hard rails, logged, no emotional-attachment design, no data for ad-targeting or model training (now explicitly illegal). Market the safety; don't just comply with it.
- **Don't dilute the brand into "just another AI toy."** The wedge is *literacy + safety*. Every viral mechanic should also teach something or signal trust — that's the defensible position as the kids-AI space gets crowded and scrutinized.
- **Measure the loops.** Instrument: daily-challenge completion + share-tap rate, report-card open + share rate, Forge Code redemptions, demo→signup conversion. Virality is a number (k-factor); make it visible.

---

## 11. Sources

AI-literacy 2026 trends:
- [AI for Kids: Complete Guide (2026) — Local AI Master](https://localaimaster.com/blog/ai-for-kids-complete-guide)
- [Teaching AI to Kids in 2026 — The Young Maker](https://theyoungmaker.com/blog/teaching-ai-to-kids-in-2026/)
- [AI Education Trends 2026 — KidsAiTools](https://www.kidsaitools.com/en/articles/ai-education-trends-2026-predictions)
- [AI Literacy Review, Feb 3 2026 — AI Literacy Institute](https://ailiteracy.institute/ai-literacy-review-february-3-2026/)

Retention / gamification:
- [Duolingo Gamification Case Study (2026) — Trophy](https://trophy.so/blog/duolingo-gamification-case-study)
- [Apps That Use Streaks: 10 Examples (2026) — Trophy](https://trophy.so/blog/streaks-feature-gamification-examples)
- [Duolingo Gamification — StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)

UGC / creator economy / kids gaming:
- [The State of UGC Games (2026) — Naavik](https://naavik.co/deep-dives/the-state-of-ugc-games-2026/)
- [Games industry 2026: is UGC the future? — Taylor Wessing](https://www.taylorwessing.com/en/insights-and-events/insights/2026/03/games-industry-in-2026-and-beyond)
- [Roblox Statistics 2026 — SQ Magazine](https://sqmagazine.co.uk/roblox-statistics/)

Deepfake / media literacy virality:
- [Real or Fake? The AI Deepfake Game — Dr Leon Furze](https://leonfurze.com/deepfake-game/)
- [Teen helping kids spot deepfakes — CBC Kids News](https://www.cbc.ca/kidsnews/post/this-teen-is-helping-kids-spot-deep-fakes-in-the-name-of-ai-literacy-heres-why)
- [Deepfakes and the crisis of knowing — UNESCO](https://www.unesco.org/en/articles/deepfakes-and-crisis-knowing)
- [DetectFakes — Northwestern Kellogg](https://detectfakes.kellogg.northwestern.edu/)

AI creation tools for kids:
- [AI Image Generators Safe for Kids 2026 — KidsAiTools](https://www.kidsaitools.com/en/articles/ai-image-generators-safe-for-kids-2026)
- [Kidgeni — AI for kids](https://kidgeni.com/)
- [How can Children Make AI Art? — LittleLit](https://www.littlelit.ai/post/how-can-children-make-ai-art)

Safe AI companions for kids:
- [Best AI Games for Kids 2026 — AI Tools for Kids](https://www.aitoolsforkids.com/blog/best-ai-games-for-kids)
- [AI Chatbots for Kids — HeyOtto](https://www.heyotto.app/blog/ai-chatbots-for-kids)
- [Character.AI ending chatbot experience for kids — TechCrunch](https://techcrunch.com/2025/10/29/character-ai-is-killing-the-chatbot-experience-for-minors/)
- [AI chatbots & companions parents guide — Internet Matters](https://www.internetmatters.org/resources/ai-chatbots-and-virtual-friends-how-parents-can-keep-children-safe/)

Marketing / FOMO / TikTok:
- [21 Viral TikTok Marketing Strategies 2026 — Social Baddie](https://socialbaddie.com/lab-notes/smm/tiktok-marketing-strategies/)
- [TikTok Marketing Guide 2026 — Metricool](https://metricool.com/tiktok-marketing/)
- [Viral Product Drop Strategy: FOMO & Limited Editions — New Engen](https://newengen.com/insights/how-to-create-viral-product-drops/)

COPPA 2026:
- [Complying with COPPA: FAQ — FTC](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [COPPA's First Real Update in 12 Years — State of Surveillance](https://stateofsurveillance.org/news/coppa-2026-new-rules-children-privacy-biometric-data/)
- [COPPA Compliance: key requirements for 2026 — Usercentrics](https://usercentrics.com/us/knowledge-hub/coppa-compliance/)

---

*End of Viral Growth & High-Retention Strategy v1.0 — proposal for founder review.*
