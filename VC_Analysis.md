# SparkForge: Venture Capital Seed Funding Analysis & Strategy

**Document Classification:** Strategic Investment Research
**Version:** 1.0 | **Date:** April 4, 2026
**Prepared for:** SparkForge Founding Team
**Scope:** VC landscape research, target firm analysis, pitch strategy, proposal design, and fundraising playbook
**Companion Document:** `2026_MarketAnalysis_Report.md` (market sizing, financials, competitive landscape)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [SparkForge Investment Profile](#2-sparkforge-investment-profile)
3. [Target VC Firms — 18 Recommended Investors](#3-target-vc-firms--18-recommended-investors)
4. [Pitch Strategy & Deck Structure](#4-pitch-strategy--deck-structure)
5. [The Fundraising Process](#5-the-fundraising-process)
6. [Preliminary Seed Proposal Design](#6-preliminary-seed-proposal-design)
7. [Action Plan, Timeline & Appendices](#7-action-plan-timeline--appendices)

---

# 1. Executive Summary

## 1.1 Purpose

This document provides a complete roadmap for SparkForge to secure a **$3-5M seed round** of venture capital funding. It identifies 18 target VC firms across EdTech, AI, gaming, and generalist categories; details how to structure, present, and market a compelling investment pitch; and lays out a preliminary proposal design that can be adapted into a formal pitch deck.

## 1.2 Why SparkForge Is Investable

SparkForge occupies a rare position at the convergence of three high-growth sectors — **artificial intelligence, gamified education, and immersive 3D experiences** — targeting a market niche (gamified AI literacy for children) that is currently **unserved by any direct competitor at equivalent depth**.

**Key investment signals:**

| Signal | Evidence |
|--------|----------|
| **Product completeness** | 464 source files, 124,000+ lines of TypeScript, 35 playable games, 84 3D components, ~80% code-complete |
| **Technical moat** | WebGPU/WebGL2 rendering (37.8M triangle cockpit), React Three Fiber v9, Anthropic Claude API integration, custom TSL shaders — 12-18 month replication barrier |
| **Market timing** | AI literacy mandates emerging (US state-level, EU AI Act education provisions, UNESCO frameworks). Category is pre-commercial — first credible entrant wins |
| **Validated economics** | Freemium model (Free/$8.99/$16.99) with projected 75-85% gross margins, 3.5:1+ LTV:CAC ratio |
| **No direct competitor** | No platform combines dedicated AI concept education + 35 gamified games + immersive 3D + age-band differentiation (7-16) + Claude API tutoring |

## 1.3 Recommended Raise

| Parameter | Recommendation |
|-----------|---------------|
| **Round type** | Priced Seed (Series Seed Preferred) |
| **Target raise** | $3-5M |
| **Pre-money valuation** | $15-25M |
| **Expected dilution** | 17-25% |
| **Runway** | 18-24 months to Series A milestones |
| **Lead investor profile** | EdTech-specialist or AI-focused VC with $1B+ AUM |
| **Use of funds** | 40% engineering, 25% marketing/growth, 15% content, 10% infrastructure, 10% G&A |

## 1.4 Fundraising Timeline Target

| Phase | Target Date | Milestone |
|-------|-------------|-----------|
| Preparation | Now – Month 2 | Pitch deck, financial model, beta launch, waitlist |
| Outreach sprint | Month 2-3 | 40-60 targeted intros, first meetings |
| Partner meetings | Month 3-4 | 5-8 deep dives, live demos |
| Term sheet | Month 4-5 | Lead investor commits |
| Close | Month 5-6 | Legal, diligence, wire |

---

# 2. SparkForge Investment Profile

## 2.1 Company Snapshot

| Attribute | Detail |
|-----------|--------|
| **Product** | Gamified AI learning platform for children ages 7-16 |
| **Stage** | Pre-revenue, ~80% code-complete |
| **Tech stack** | Next.js 15, React 19, TypeScript (strict), React Three Fiber v9, Supabase, Stripe, Anthropic Claude API |
| **Content** | 35 interactive games across 10 themed AI Labs |
| **Game tiers** | 6 Flagship (20M tris) + 9 FL-Lite (10M tris) + 20 Standard (5M tris) |
| **3D architecture** | Single persistent R3F Canvas, 37.8M triangle cockpit, WebGPU primary with WebGL2 fallback |
| **Monetization** | Freemium: Free / Plus ($8.99/mo) / Forge ($16.99/mo) + School licensing (planned) |
| **Infrastructure** | Vercel deployment, Supabase (PostgreSQL + Auth + Storage), Sentry monitoring |
| **Codebase** | 464 source files, 124,272 lines of code, 84 3D components, 36 game files, 15 Zustand stores |

## 2.2 Competitive Positioning

SparkForge's competitive moat rests on **four compounding advantages:**

**1. Content Depth:** 35 games teaching distinct AI concepts (neural networks, bias, NLP, computer vision, reinforcement learning, etc.) — no competitor offers more than 5-10 AI modules.

**2. Immersive Experience:** Full 3D "Laboratory Control Station" cockpit with cinematic hero animation, holographic lab map, ambient NPCs, and wormhole transitions. Children don't use a learning app — they pilot a command bridge.

**3. AI-Native Architecture:** Claude API powers the Prompt Lab game (kids interact with real AI) and the Content Agent (automated content generation pipeline). The platform teaches AI using AI — a self-reinforcing narrative.

**4. Age-Band System:** Three content tiers (A: 7-9, B: 10-12, C: 13-16) across all 35 games. The platform grows with the child, extending LTV from single-year to multi-year subscriptions.

## 2.3 Market Opportunity Summary

*(Detailed analysis in `2026_MarketAnalysis_Report.md`, Section 2-6)*

| Market Layer | Size | Growth |
|-------------|------|--------|
| **TAM** — Global AI market | $450-520B (2026) | 35-42% CAGR |
| **SAM** — AI in Education | $4-6B (2024) → $20-30B (2030) | 25-35% CAGR |
| **SOM** — Gamified AI education for English-speaking children | $1.25-2.5B (2030) | Greenfield |
| **Beachhead** — US/UK/CA/AU families, ages 7-16 | ~$780M addressable | First mover |

## 2.4 Financial Projections (Moderate Scenario)

| Year | Registered Users | Paid Subscribers | Total ARR | Projected Valuation |
|------|-----------------|-----------------|-----------|-------------------|
| Y1 | 50,000 | 1,080 | $104K | — |
| Y2 | 250,000 | 9,000 | $954K | — |
| Y3 | 800,000 | 36,000 | $4.32M | $65-110M |
| Y4 | 2,000,000 | 97,500 | $12.17M | — |
| Y5 | 4,000,000 | 196,000 | $24.46M | $250-490M |

## 2.5 Unit Economics (Projected, Y3+)

| Metric | Value | Industry Benchmark |
|--------|-------|--------------------|
| ARPU (monthly, paid) | $8-10 | $4-8 (EdTech) |
| LTV (paid subscriber) | $160-240 | $100-200 |
| CAC (blended) | $25-50 | $30-80 |
| LTV:CAC ratio | 3.5:1 – 5:1 | 3:1+ (healthy) |
| Gross margin | 75-85% | 70-80% (SaaS) |
| Payback period | 3-5 months | 6-12 months |

---

# 3. Target VC Firms — 18 Recommended Investors

Firms are organized into three categories based on investment thesis alignment with SparkForge. Within each category, firms are ranked by fit strength. All firms actively invest at seed stage ($1-10M checks).

## 3.1 Category A: EdTech-Specialist VCs (6 firms)

These firms invest exclusively or primarily in education technology. They understand EdTech unit economics, school distribution, COPPA/FERPA compliance, and the buyer-user split (parent buys, child uses).

---

### A1. Reach Capital — HIGHEST PRIORITY

| Field | Details |
|-------|---------|
| **HQ** | Palo Alto, CA |
| **AUM** | ~$230M+ across multiple funds |
| **Seed check** | $1-5M |
| **Key partners** | Jennifer Carolan (co-founder), Wayee Chu, Shauntel Garvey |
| **Notable portfolio** | ClassDojo, Newsela, Outschool, Handshake, Panorama Education |
| **Thesis** | Pure-play EdTech. Invests pre-K through workforce in consumer education, learning platforms, and tools that reach learners directly. |
| **How to pitch** | Open application at reachcapital.com. Active at ASU+GSV Summit. Jennifer Carolan responsive on LinkedIn. |

**Why Reach for SparkForge:** They led ClassDojo (gamified, kids-focused) and Outschool (children's learning marketplace). Gamified AI learning for ages 7-16 is the exact intersection of their thesis. SparkForge's freemium consumer model matches their portfolio pattern. **Target: $2-4M lead check.**

---

### A2. Owl Ventures

| Field | Details |
|-------|---------|
| **HQ** | San Francisco, CA |
| **AUM** | $2B+ (largest dedicated EdTech fund globally) |
| **Seed check** | $2-8M (invest seed through growth) |
| **Key partners** | Tory Patterson (co-founder), Amit Patel, Ian Chiu |
| **Notable portfolio** | Byju's, Newsela, Masterclass, Handshake, Nerdy (Varsity Tutors), Homer |
| **Thesis** | Full-lifecycle EdTech. Focus on technology-driven learning outcomes across K-12, higher ed, and workforce. |
| **How to pitch** | Warm intros preferred via owlvc.com. Active at ASU+GSV. Amit Patel leads early-stage consumer ed deals. |

**Why Owl for SparkForge:** Backed Homer (children's subscription learning with gamification — acquired by BEGiN) — a direct structural comparable to SparkForge. Their scale ($2B+ AUM) means they can lead a $3-5M seed and follow on through Series B+. **Target: $2-5M lead check.**

---

### A3. GSV Ventures

| Field | Details |
|-------|---------|
| **HQ** | Woodside, CA |
| **AUM** | ~$900M+ |
| **Seed check** | $1-5M |
| **Key partners** | Michael Moe (founder), Deborah Quazzo, Li Jiang |
| **Notable portfolio** | Coursera, ClassDojo, Duolingo (early), Kahoot, Course Hero, Degreed |
| **Thesis** | Education + technology at scale. Michael Moe coined "EdTech" as an investment category. Strong conviction in AI transforming education. |
| **How to pitch** | Apply at gsvventures.com. Attending ASU+GSV Summit (April, San Diego) is the single best networking opportunity. |

**Why GSV for SparkForge:** Backed Duolingo early (gamified learning gold standard) and Kahoot (game-based learning). Deborah Quazzo has specific interest in K-12 consumer education. They've been publicly vocal about AI in education since 2023. **Target: $2-4M lead check.**

---

### A4. Learn Capital

| Field | Details |
|-------|---------|
| **HQ** | San Francisco, CA / Venice Beach, CA |
| **AUM** | ~$500M+ across funds |
| **Seed check** | $1-5M |
| **Key partners** | Rob Hutter, Greg Mauro, John Katzman (founder of Princeton Review, 2U) |
| **Notable portfolio** | Coursera, Udemy, Edmodo, Minerva, Brainly, Kajabi |
| **Thesis** | EdTech platforms with global scale potential. Strong interest in creator economy + education intersection. |
| **How to pitch** | Warm intros preferred. Rob Hutter responsive on LinkedIn/X. |

**Why Learn for SparkForge:** They favor platforms with network effects. SparkForge's 35-game content library with freemium subscription fits the "platform" archetype. The Content Agent (AI-generated content pipeline) aligns with their creator economy interest. **Target: $1-3M co-lead or follow.**

---

### A5. NewSchools Venture Fund

| Field | Details |
|-------|---------|
| **HQ** | Oakland, CA |
| **AUM** | ~$400M deployed (hybrid grant + venture model) |
| **Seed check** | $250K-3M (grants and equity investments) |
| **Key partners** | Tonika Cheek Clayton, Stacey Childress |
| **Notable portfolio** | Khan Academy (grant), DreamBox Learning, Zearn, Rocketship Education |
| **Thesis** | Mission-driven EdTech focused on equity and access in K-12. |
| **How to pitch** | Open application cycles at newschools.org. Also runs "Ignite" accelerator program. |

**Why NewSchools for SparkForge:** SparkForge's Free tier provides AI literacy to underserved students — an equity argument. AI literacy is increasingly framed as a civil rights issue (children without AI education face workforce disadvantage). Non-dilutive or low-dilution capital complements traditional VC. **Target: $500K-2M grant or investment.**

---

### A6. Imaginable Futures (Emerson Collective)

| Field | Details |
|-------|---------|
| **HQ** | Palo Alto, CA |
| **AUM** | Not disclosed (backed by Laurene Powell Jobs' Emerson Collective) |
| **Seed check** | $1-5M |
| **Key partners** | Team operates semi-independently from Emerson Collective |
| **Notable portfolio** | AltSchool, Ellevation Education, XQ Institute |
| **Thesis** | Impact-driven education investing. Reimagining learning through technology. |
| **How to pitch** | Inbound accepted at imaginablefutures.com. Strong education conference presence. |

**Why Imaginable for SparkForge:** SparkForge's mission of democratizing AI education for children aligns with their transformative education thesis. The immersive 3D approach makes learning a critical future skill feel accessible and engaging. **Target: $1-3M co-invest.**

---

## 3.2 Category B: AI-Focused VCs (6 firms)

These firms invest in artificial intelligence companies and would evaluate SparkForge as an "AI-native consumer application" rather than traditional EdTech. They value technical moats, AI integration depth, and the AI market tailwind.

---

### B1. AI Fund (Andrew Ng)

| Field | Details |
|-------|---------|
| **HQ** | San Francisco, CA |
| **AUM** | ~$176M+ across funds |
| **Seed check** | $1-5M (also incubates companies in-house) |
| **Key partners** | Andrew Ng, Eva Wang |
| **Notable portfolio** | Landing AI, Woebot Health, Abridge, Bear Robotics |
| **Thesis** | AI applications across verticals. Studio model — also co-builds companies. |
| **How to pitch** | Submit at aifund.ai. Andrew Ng is accessible through AI education channels. |

**Why AI Fund for SparkForge:** Andrew Ng founded Coursera and DeepLearning.AI — his entire career is democratizing AI education. SparkForge teaching AI to children ages 7-16 is the downstream consumer version of Ng's mission. The studio model could provide operational support beyond capital. **Target: $1-4M lead or co-lead. Potential strategic advisor relationship.**

---

### B2. Lux Capital

| Field | Details |
|-------|---------|
| **HQ** | New York, NY |
| **AUM** | ~$4B+ across funds |
| **Seed check** | $1-5M |
| **Key partners** | Josh Wolfe, Peter Hebert, Bilal Zuberi, Deena Shakir |
| **Notable portfolio** | Anthropic (early investor), Hugging Face, Anduril, Recursion |
| **Thesis** | Frontier technology with genuine technical differentiation. |
| **How to pitch** | pitch@luxcapital.com. Josh Wolfe is active on X and responds to compelling outreach. |

**Why Lux for SparkForge:** Direct Anthropic investor — they understand the Claude API ecosystem intimately. SparkForge is essentially an Anthropic ecosystem company (Content Agent + Prompt Lab game both built on Claude). Lux loves technical moats, and SparkForge's WebGPU rendering, custom TSL shaders, and 3D cockpit architecture represent genuine differentiation. **Target: $2-5M lead check.**

---

### B3. Radical Ventures

| Field | Details |
|-------|---------|
| **HQ** | Toronto, Canada |
| **AUM** | ~$550M+ (Fund II: ~$350M) |
| **Seed check** | $1-5M (seed through Series A) |
| **Key partners** | Jordan Jacobs, Tad Goldfeldt, Rob Fiedler |
| **Notable portfolio** | Cohere, Waabi, Layer6 AI, Kindred AI |
| **Thesis** | Deep AI-native thesis. Applied AI across verticals. Geoffrey Hinton advisory relationship. |
| **How to pitch** | Submit at radicalventures.com. Active at NeurIPS, ICML. |

**Why Radical for SparkForge:** SparkForge's full-stack AI integration (Claude API content generation, WebGPU compute pipelines, TSL shader compilation) positions it as a credible "AI-first company" rather than "education company using AI." Radical appreciates deep technical architectures. **Target: $2-4M lead or co-lead.**

---

### B4. Coatue Management (Early-Stage Fund)

| Field | Details |
|-------|---------|
| **HQ** | New York, NY |
| **AUM** | ~$8B+ (venture arm has dedicated early-stage fund) |
| **Seed check** | $2-10M |
| **Key partners** | Philippe Laffont, Matt Mazzeo (early stage), Kris Fredrickson |
| **Notable portfolio** | Anthropic, OpenAI (investor), Rippling, Airtable, Databricks |
| **Thesis** | Data-driven investor in AI infrastructure and applications. |
| **How to pitch** | Warm intros through portfolio companies. Early-stage team has dedicated application process. |

**Why Coatue for SparkForge:** Dual investor in Anthropic AND OpenAI — deep conviction that AI applications will be transformative. SparkForge as an AI-native consumer platform that teaches the next generation about AI itself creates a compelling meta-narrative. Larger check size ($2-10M) could fill the entire round. **Target: $3-5M sole lead.**

---

### B5. Khosla Ventures (Seed Fund)

| Field | Details |
|-------|---------|
| **HQ** | Menlo Park, CA |
| **AUM** | ~$15B+ across funds; dedicated seed fund |
| **Seed check** | $500K-3M (seed fund); $5M+ (main fund) |
| **Key partners** | Vinod Khosla, Samir Kaul, Sven Strohband |
| **Notable portfolio** | OpenAI (major early investor), Mistral AI, Together AI, Stripe |
| **Thesis** | Frontier tech. Vinod Khosla publicly vocal about AI transforming education. |
| **How to pitch** | Open pitch form at khoslaventures.com. They review cold submissions. |

**Why Khosla for SparkForge:** Khosla has publicly stated AI will "replace tutors" and transform education access. SparkForge's Claude-powered learning aligns with this worldview. Engineering-heavy evaluation process would appreciate the technical depth (WebGPU, 37.8M triangle budget, TSL shaders). **Target: $1-3M from seed fund.**

---

### B6. Lightspeed Venture Partners

| Field | Details |
|-------|---------|
| **HQ** | Menlo Park, CA |
| **AUM** | ~$10B+ with dedicated early-stage programs |
| **Seed check** | $1-5M |
| **Key partners** | Alex Taussig (consumer), Mercedes Bent (consumer/kids), Gaurav Gupta |
| **Notable portfolio** | Anthropic, Epic! (kids reading app), Grammarly, Rubrik |
| **Thesis** | Generalist with strong consumer and AI verticals. |
| **How to pitch** | Accept cold pitches at lsvp.com. Mercedes Bent active on X. Scout program for warm intros. |

**Why Lightspeed for SparkForge:** Backed both Anthropic AND Epic! (children's subscription learning platform with gamification — acquired by Byju's). Epic! is almost a direct structural comp to SparkForge. Mercedes Bent has specific interest in children's consumer products. **Target: $2-5M lead check.**

---

## 3.3 Category C: Gaming & Consumer VCs (3 firms)

These firms invest in interactive entertainment, gaming technology, and consumer products. They evaluate SparkForge through the lens of engagement mechanics, 3D technology, and game design rather than educational outcomes.

---

### C1. Konvoy Ventures

| Field | Details |
|-------|---------|
| **HQ** | Denver, CO |
| **AUM** | ~$150M across funds |
| **Seed check** | $1-5M |
| **Key partners** | Josh Chapman, Jackson Vaughan, Luke Panza |
| **Notable portfolio** | Roblox (early), Skillz, Gamefam, Bunch |
| **Thesis** | Gaming-native VC. Game technology, platforms, and studios. Increasingly interested in "games for impact." |
| **How to pitch** | Pitch form at konvoy.vc. Josh Chapman very active on X and LinkedIn. |

**Why Konvoy for SparkForge:** SparkForge's 35 games with immersive 3D (React Three Fiber, 50M triangle budget) positions it closer to a game studio than typical EdTech. The cockpit navigation with hero animations is genuinely game-like. Josh Chapman has spoken publicly about educational gaming as underexplored. **Target: $1-3M co-lead.**

---

### C2. Andreessen Horowitz (a16z) — GAMES Fund + AI Fund

| Field | Details |
|-------|---------|
| **HQ** | Menlo Park, CA |
| **AUM** | $600M GAMES Fund + multi-billion AI Fund |
| **Seed check** | $1-10M+ |
| **Key partners** | Andrew Chen (games), Jonathan Lai (games), Anjney Midha (AI) |
| **Notable portfolio** | Roblox, Rec Room, Character.AI, ElevenLabs, Photomath |
| **Thesis** | Dedicated funds for both games and AI. Cross-portfolio opportunities at their intersection. |
| **How to pitch** | Formal pitch form at a16z.com/pitch (they review all submissions). Also runs Speedrun accelerator for games. |

**Why a16z for SparkForge:** SparkForge sits at the intersection of two a16z funds. The 3D immersive UI would demo spectacularly. Andrew Chen has written extensively about gamification mechanics. The Speedrun accelerator could be an entry path. **Target: $3-5M lead from GAMES or AI fund.**

---

### C3. LEGO Ventures

| Field | Details |
|-------|---------|
| **HQ** | Billund, Denmark / London, UK |
| **AUM** | ~$100M+ |
| **Seed check** | $500K-3M |
| **Key partners** | Rob Lowe (Head of LEGO Ventures), Cecilia Qvist |
| **Notable portfolio** | Toca Boca, Epic!, Light Brick Studio, Manticore Games |
| **Thesis** | Children's play + learning intersection. Playful learning and creative expression through technology. |
| **How to pitch** | Application form at legoventures.com. Accessible through children's media conferences (Sandbox Summit, KidScreen). |

**Why LEGO for SparkForge:** SparkForge's core thesis — making AI learning feel like a game for 7-16 year olds — is precisely what LEGO Ventures funds. Their investment in Epic! (children's subscription learning) is a direct comparable. The "Laboratory Control Station" cockpit aesthetic resonates with LEGO's build-and-explore philosophy. **Target: $1-3M co-lead. Potential strategic brand partnership.**

---

## 3.4 Category D: Accelerators & Programs (3 programs)

These provide funding, mentorship, network access, and signal value. Particularly valuable for pre-revenue startups as validation mechanisms.

---

### D1. Y Combinator

| Field | Details |
|-------|---------|
| **HQ** | San Francisco, CA |
| **Investment** | $500K for 7% equity (standard deal) + $375K MFN SAFE |
| **Key partners** | Garry Tan (CEO), Jared Friedman, Michael Seibel |
| **Notable EdTech alumni** | ClassDojo, Panorama Education, CodeCombat, Mathpresso |
| **Application** | ycombinator.com/apply (cycles: typically March and September deadlines) |

**Why YC for SparkForge:** Post-YC companies typically raise $2-5M seed rounds. The YC brand provides massive signal to follow-on investors. SparkForge's ~80% code completeness is a strength — most YC companies are far earlier. AI-focused batches are increasing. **Path: YC batch then immediate $3-5M seed raise.**

---

### D2. ASU+GSV Summit

| Field | Details |
|-------|---------|
| **Type** | Conference + pitch competition (not an accelerator) |
| **When** | April annually, San Diego, CA |
| **Attendees** | 100+ EdTech investors, 7,000+ attendees |
| **Value** | Single highest-density EdTech investor networking event globally |

**Why ASU+GSV for SparkForge:** Reach Capital, Owl Ventures, GSV Ventures, Learn Capital, NewSchools, and dozens of other EdTech VCs attend. SparkForge's 3D demo would stand out dramatically at a conference dominated by flat-UI platforms. **Action: Submit to GSV Cup pitch competition.**

---

### D3. NVIDIA Inception Program

| Field | Details |
|-------|---------|
| **Type** | Startup accelerator (non-dilutive) |
| **Benefits** | GPU cloud credits, technical support, co-marketing, VC network access |
| **Relevance** | SparkForge's WebGPU rendering and 50M triangle budget make it a natural fit |
| **Application** | nvidia.com/inception |

**Why NVIDIA Inception for SparkForge:** Non-dilutive support. GPU cloud credits reduce infrastructure costs. NVIDIA brand association validates the 3D technical architecture. Access to NVIDIA's VC network for warm intros. **Action: Apply immediately — complements VC fundraise.**

---

## 3.5 Investor Outreach Priority Matrix

### Tier 1 — Approach First (highest alignment, target as lead)

| Firm | Category | Why Lead | Target Check |
|------|----------|----------|-------------|
| **Reach Capital** | EdTech | ClassDojo/Outschool track record | $2-4M |
| **Owl Ventures** | EdTech | Largest EdTech fund, Homer comparable | $2-5M |
| **Lightspeed** | AI | Backed Anthropic + Epic! (direct comp) | $2-5M |
| **AI Fund** | AI | Andrew Ng's education mission | $1-4M |

### Tier 2 — Approach in Parallel (strong fit)

| Firm | Category | Why | Target Check |
|------|----------|-----|-------------|
| **GSV Ventures** | EdTech | Duolingo/Kahoot track record | $2-4M |
| **Lux Capital** | AI | Anthropic investor, frontier tech thesis | $2-5M |
| **a16z GAMES** | Gaming | Games + AI fund intersection | $3-5M |
| **LEGO Ventures** | Gaming | Kids + play + learning thesis | $1-3M |
| **Coatue** | AI | Anthropic + OpenAI backer, large checks | $3-5M |

### Tier 3 — Fill the Round

| Firm | Category | Why | Target Check |
|------|----------|-----|-------------|
| **Radical Ventures** | AI | AI-native thesis | $1-3M |
| **Learn Capital** | EdTech | Platform specialist | $1-3M |
| **Konvoy Ventures** | Gaming | 3D/immersive angle | $1-3M |
| **Khosla Ventures** | AI | AI education conviction | $1-3M |
| **NewSchools** | EdTech | Equity/access, non-dilutive | $500K-2M |
| **Imaginable Futures** | EdTech | Impact education | $1-3M |

### Accelerator Path (alternative to direct seed raise)

| Program | Value | Timeline |
|---------|-------|----------|
| **Y Combinator** | $500K + YC signal, then $3-5M post-batch raise | 3-month batch |
| **ASU+GSV Summit** | Networking + pitch competition | April annually |
| **NVIDIA Inception** | Non-dilutive credits + VC intros | Ongoing |
