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

---

# 4. Pitch Strategy & Deck Structure

## 4.1 Core Narrative

Every VC interaction should anchor to this central thesis:

> **"AI literacy is the defining educational challenge of this generation. SparkForge is the only platform that teaches kids AI through immersive 3D games — not lectures, not worksheets, but the kind of experience that makes kids beg for more screen time. We've built 35 games across 10 labs with a technological moat that would take competitors 2+ years to replicate. We're raising $3-5M to launch publicly, prove conversion economics, and establish SparkForge as the default platform for AI education before the market window closes."**

### The "AI = New Literacy" Framing

| Era | Literacy | Adoption Curve |
|-----|----------|---------------|
| 1990s | Computer literacy | 10+ years from optional to essential |
| 2010s | Coding literacy | ~8 years (Hour of Code 2013 → mainstream 2020) |
| **2024-2030** | **AI literacy** | **~3-5 years (compressed by urgency)** |

SparkForge is positioning to be the **Duolingo of AI education** — the platform that makes AI literacy accessible, engaging, and inevitable for the next generation.

## 4.2 Pitch Deck Structure (12 Slides + Appendix)

### Slide-by-Slide Blueprint

| # | Slide | Content | Time | Key Message |
|---|-------|---------|------|-------------|
| 1 | **Title** | Logo, tagline: "Teaching Kids AI Through Play", founder name(s) | 10s | Brand impression |
| 2 | **Problem** | Children consume AI daily without understanding it. Schools have no AI curriculum. Parents are anxious. Stat: "X% of US schools lack any AI education program" | 60s | Urgency + emotional hook |
| 3 | **Solution** | SparkForge overview — 35 games, 10 labs, immersive 3D. One hero screenshot or 5-second GIF of the cockpit | 60s | Product clarity |
| 4 | **Demo** | 3-4 screenshots OR embedded 60-90s video: cockpit entry, game in action, XP celebration, parent dashboard | 120s | **This is where SparkForge wins** — no competitor demos this well |
| 5 | **Market** | TAM/SAM/SOM with bottom-up calculation. AI EdTech $4-6B today → $20-30B by 2030. Gamified AI education for kids: greenfield $1.25-2.5B | 60s | Size + timing |
| 6 | **Business Model** | Freemium tiers (Free/$8.99/$16.99), school licensing ($6-8/student/year). Unit economics: 75-85% gross margin, 3.5:1 LTV:CAC | 60s | Clear monetization path |
| 7 | **Traction** | Pre-revenue substitutes: product completeness (464 files, 124K LOC, 35 games), waitlist numbers, beta engagement data, school pilot LOIs, advisor endorsements | 60s | Execution velocity |
| 8 | **Competition** | 2x2 matrix (axes: AI content depth vs. gamification/immersion). SparkForge alone in top-right quadrant. Key comparisons: Khan Academy (broad, not gamified), Scratch (coding, not AI), Tynker (bolt-on AI), Brilliant (older audience) | 60s | Differentiation clarity |
| 9 | **Go-to-Market** | Phase 1: Content marketing + parent influencers + waitlist. Phase 2: School pilot program. Phase 3: Institutional B2B expansion. Channel: organic → influencer → paid → B2B | 60s | Realistic distribution |
| 10 | **Team** | Founders + key hires/advisors. Emphasize: education domain expertise, AI/ML engineering, gaming/3D experience, child development | 60s | Credibility |
| 11 | **Financials** | 18-month projection. Path to $500K-1M ARR (Series A readiness). Burn rate, runway, milestones | 30s | Capital efficiency |
| 12 | **The Ask** | "$3-5M seed to achieve: (1) Public launch + 50K users, (2) $500K ARR, (3) 10 school pilots, (4) Series A readiness in 18 months" | 30s | Clear, specific ask |
| A | **Appendix** | Technical architecture, detailed financials, team bios, COPPA compliance plan, market research sources | — | Due diligence support |

**Total presentation time:** 10-12 minutes, leaving 18-20 minutes for Q&A in a standard 30-minute meeting.

## 4.3 What Pre-Revenue Startups Must Highlight

Since SparkForge has no revenue yet, VCs evaluate "leading indicators" of product-market fit:

### Quantitative Signals (collect before fundraising)

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| **DAU/MAU ratio** | >20% | Consumer-grade engagement |
| **D7 retention** | >40% | Kids return voluntarily |
| **D30 retention** | >20% | Sustained engagement loop |
| **Session duration** | >15 min avg | Deep engagement, not surface |
| **Game completion rate** | >60% | Content is compelling |
| **Progression depth** | >3 labs average | Breadth of platform used |
| **Waitlist signups** | 5,000+ | Pre-launch demand signal |
| **NPS score** | 50+ | Parent satisfaction |

### Qualitative Signals

- **Letters of intent** from 3-5 schools or districts (even unpaid pilots)
- **Parent testimonials** — video of parents watching kids engage with SparkForge
- **Educator endorsements** — AI researchers or curriculum designers validating pedagogy
- **Advisory board** with education, AI, and child development credentials
- **Product completeness narrative** — "464 files, 124K LOC, 35 games, 84 3D components — we chose product depth over premature monetization"

## 4.4 SparkForge-Specific Differentiators to Emphasize

Frame these as "unfair advantages" in the pitch:

### 1. Product Depth at Pre-Revenue Is Extraordinary

> "Most seed-stage startups have a landing page and a prototype. We have 35 playable games, an immersive 3D cockpit with 37.8M triangles, and 124,000 lines of production TypeScript. This signals execution velocity — we don't just talk about building, we build."

### 2. 3D Immersion as Engagement Moat

> "No competitor in AI education offers a React Three Fiber-powered 3D environment. This isn't cosmetic — it's the engagement architecture. Children don't use a learning app; they pilot a command bridge. Retention happens because it feels like a game, not homework."

### 3. AI Teaching AI (Meta-Learning Loop)

> "SparkForge uses Claude API to teach kids about AI. The tool IS the lesson. In the Prompt Lab game, children interact with real AI to learn how prompting works. The Content Agent uses AI to generate new educational content. This self-reinforcing loop is intellectually compelling and technically defensible."

### 4. Age-Band Architecture = Extended LTV

> "Three content tiers (ages 7-9, 10-12, 13-16) across all 35 games means the platform grows with the child. A family that subscribes when their child is 8 can stay through age 16 — that's 8 years of potential subscription revenue, not one."

### 5. 12-18 Month Replication Barrier

> "Building 35 AI education games with immersive 3D environments, age-band differentiation, Claude API integration, COPPA-compliant architecture, and a parent dashboard — from scratch — takes 12-18 months minimum with a skilled team. We've already done it."

## 4.5 Addressing the "No Revenue" Concern

Pre-revenue at seed stage is standard. Reframe it:

**"We chose product depth over premature monetization."** Duolingo spent years on product before monetizing aggressively. Prodigy Math raised early rounds on engagement metrics, not revenue. Brilliant.org raised seed on product vision and early data.

**Show a clear monetization timeline:**

| Month | Milestone |
|-------|-----------|
| 1-3 | Public beta launch with free tier, collect engagement data |
| 4-6 | Introduce Plus tier ($8.99/mo), measure free-to-paid conversion |
| 7-9 | Launch Forge tier ($16.99/mo), begin school pilot program |
| 10-12 | Target $250K-500K ARR run rate |
| 13-18 | Scale to $500K-1M ARR (Series A readiness) |

## 4.6 The Demo Is SparkForge's Biggest Asset

**The live product demo is the single most differentiating element of your pitch.** Most EdTech seed pitches show mockups or basic prototypes. SparkForge can show a fully immersive 3D cockpit with 35 playable games.

### Demo Strategy

| Context | Format | Duration |
|---------|--------|----------|
| **In pitch deck** | Embedded 60-90s video: cockpit entry → navigate to lab → play flagship game → earn XP → celebration | Passive viewing |
| **Live meeting** | Product running on laptop. 3-minute guided walkthrough. Let VC click around. | Interactive |
| **Pre-meeting** | Send Demo Login link (1-hour session, no signup). VCs try before meeting. | Self-service |
| **Landing page** | CockpitPreview3D component (50K triangle mini-cockpit teaser) | Always-on |
| **Conference booth** | Full demo on large screen. Kids playing live. | Event presence |

**Critical:** The demo must be bulletproof. Test on multiple machines/browsers. Have a video backup if live demo fails. A crash during a VC meeting is devastating.

## 4.7 Common Mistakes That Kill EdTech Pitches

| Mistake | Why It Kills | SparkForge Mitigation |
|---------|-------------|----------------------|
| Leading with tech, not outcomes | VCs invest in impact, not WebGPU | Lead with "kids who understand AI," reveal tech as moat |
| No clear revenue path | "Freemium" isn't a business model | Show conversion assumptions, ARPU, LTV:CAC |
| Ignoring buyer/user split | Child uses, parent/school buys | Address both: "Kids love it (game). Parents buy it (AI education). Schools adopt it (curriculum)." |
| Underestimating regulation | COPPA, FERPA, GDPR-K | Have compliance plan ready in appendix |
| TAM fantasy | "$400B global EdTech" without bottom-up | Show credible SOM: 196K paid subs x $8/mo = $24.5M ARR by Y5 |
| No distribution strategy | "We'll go viral" isn't a plan | Content marketing → influencers → school pilots → institutional B2B |
| Competing with free | Khan Academy, Scratch are free | "Free platforms teach coding, not AI. No free platform offers 35 gamified AI games with 3D immersion." |
| Solo technical founder | VCs want domain + technical | Compensate with advisory board (educators, AI researchers, child development) |

---

# 5. The Fundraising Process

## 5.1 End-to-End Timeline

| Phase | Duration | Activities | Success Metrics |
|-------|----------|------------|----------------|
| **Preparation** | Weeks 1-8 | Finalize deck, data room, financial model, demo polish, build waitlist, launch beta, secure advisor intros | Deck reviewed by 3+ mentors, beta live, waitlist >2K |
| **Outreach sprint** | Weeks 9-12 | Send 40-60 targeted emails/intros, schedule first meetings. Compress into 2-3 weeks for FOMO. | 20-30 first meetings scheduled |
| **First meetings** | Weeks 10-16 | 30-minute intro calls. Goal: advance to partner meeting. | 5-8 advance to partner meeting |
| **Partner meetings** | Weeks 14-20 | Deep dives, live demos, team evaluation. Due diligence begins. | 2-3 term sheet conversations |
| **Term sheet negotiation** | Weeks 18-22 | Lead investor issues term sheet. Use competing interest as leverage. | Signed term sheet |
| **Due diligence & close** | Weeks 20-26 | Legal docs, technical DD, background checks, reference calls. Wire transfer. | Money in bank |
| **Total** | **~4-6 months** | From first outreach to funds received | |

**Pro tip:** Run a "sprint" fundraise — compress outreach into 2-3 weeks so meetings cluster together. This creates competitive tension and FOMO among VCs.

## 5.2 Warm Intros vs. Cold Outreach

| Method | Response Rate | Meeting Rate | Best For |
|--------|-------------|-------------|----------|
| Warm intro from portfolio founder | 60-80% | 40-50% | Tier 1 targets |
| Warm intro from mutual connection | 40-60% | 20-30% | All targets |
| Well-crafted cold email | 5-15% | 3-8% | Tier 2-3 targets |
| Cold LinkedIn/X DM | 2-5% | 1-3% | Last resort |
| VC website application form | 1-3% | <1% | Only for open-application firms (YC, Khosla, a16z) |

### How to Generate Warm Intros

1. **Map your network.** Every advisor, mentor, colleague, fellow founder — who do they know at target firms?
2. **LinkedIn mapping.** For each target VC partner, find mutual connections who can intro.
3. **Attend events.** ASU+GSV Summit (EdTech), ISTE (education), GDC (gaming), NeurIPS (AI).
4. **Accelerator networks.** YC, Techstars alumni can provide intros to hundreds of VCs.
5. **Forwardable email.** Write a 5-sentence blurb your intro source can forward: one-liner, key metric, why now, the ask.

### Cold Email Template (When Warm Isn't Available)

```
Subject: AI literacy platform for kids — 35 games, immersive 3D, pre-revenue

Hi [Partner Name],

I noticed [firm] backed [relevant portfolio company] — SparkForge sits at a 
similar intersection of [education/AI/gaming].

We've built a gamified AI learning platform for ages 7-16: 35 interactive games, 
immersive 3D environments (WebGPU), and Anthropic Claude integration. 124K lines 
of production TypeScript. No direct competitor at equivalent depth.

Raising a $3-5M seed. Would 25 minutes next week work for a quick walkthrough?

[Link to demo / landing page]

Best,
[Name]
```

**Rules:** 5 sentences max. ONE compelling data point. Link, don't attach. Follow up exactly once at 5-7 days.

## 5.3 Due Diligence — What VCs Will Examine

### Product & Technical DD

| Area | What They Check | SparkForge Readiness |
|------|----------------|---------------------|
| Live demo | Does the product work? | Demo Login feature (1-hour, no signup) is ideal |
| Code quality | TypeScript strict mode, testing, architecture | 464 files, strict TS, Vitest + Playwright, clean architecture |
| Scalability | Can it handle 100K+ users? | Vercel (auto-scaling), Supabase (managed PostgreSQL), CDN-served 3D assets |
| AI integration | How is Claude API used? Cost per user? | Content Agent (batch) + Prompt Lab game (interactive). Estimated $0.05-0.15/user/mo with caching |
| Security | Auth, data protection, injection risks | Supabase Auth + RLS, Sentry monitoring, OWASP-aware development |

### Market & Regulatory DD

| Area | What They Check | SparkForge Readiness |
|------|----------------|---------------------|
| Market size | Are TAM/SAM/SOM credible? | Bottom-up calculation documented in market analysis report |
| Competitors | Who else is doing this? | Detailed competitive analysis with 15+ comparisons |
| COPPA compliance | Under-13 data collection | Parent consent flow, age verification, data minimization plan needed |
| FERPA (schools) | Student data in school context | Architecture supports school-mode data isolation |
| Content safety | AI outputs to children | Claude API with content filtering, age-appropriate response boundaries |

### Team & Financial DD

| Area | What They Check |
|------|----------------|
| Founder backgrounds | Track record, domain expertise, references |
| Cap table | Clean? Any prior investors? Option pool? |
| Financial model | Are assumptions reasonable? Burn rate realistic? |
| Use of funds | Specific allocation across engineering, marketing, content, infrastructure |

## 5.4 Term Sheet Essentials — $3-5M Seed

### Expected Terms

| Term | Typical Range | Notes |
|------|--------------|-------|
| **Round size** | $3-5M | SparkForge target |
| **Pre-money valuation** | $12-20M | Pre-revenue EdTech with strong product: $15-20M achievable |
| **Instrument** | Series Seed Preferred Stock or SAFE | Priced round more common at $3M+; SAFEs more common under $3M |
| **Lead investor** | 1 firm takes 50-70% of round | Lead sets terms; others follow on same terms |
| **Board composition** | 2 founders + 1 investor + 1-2 independents | Lead gets 1 board seat |
| **Liquidation preference** | 1x non-participating | Standard, founder-friendly. Avoid >1x or participating preferred. |
| **Anti-dilution** | Broad-based weighted average | Standard. Avoid full ratchet. |
| **Pro-rata rights** | Standard for lead | Right to invest proportionally in future rounds |
| **Vesting** | 4-year with 1-year cliff | Applied to any unvested founder shares |
| **Option pool** | 10-15% post-money | VCs will push for pre-money creation (dilutes founders, not investors) |
| **Information rights** | Monthly or quarterly updates | Financial statements, KPIs, board materials |

### Dilution Scenarios

| Scenario | Pre-Money Val | Round Size | Post-Money Val | Investor Equity | Founder Equity (post-pool) |
|----------|-------------|-----------|---------------|----------------|--------------------------|
| Conservative | $12M | $3M | $15M | 20.0% | 65-70% |
| **Mid-range** | **$16M** | **$4M** | **$20M** | **20.0%** | **65-70%** |
| Strong position | $20M | $5M | $25M | 20.0% | 65-70% |

*Assumes 10-15% option pool. Founder equity range depends on prior angel/SAFE dilution.*

### Key Negotiation Points

1. **Push for higher pre-money** by creating competitive tension (multiple term sheets simultaneously)
2. **Resist participating preferred** — insist on non-participating liquidation preference
3. **Negotiate option pool size** — 10% vs 15% is significant dilution difference
4. **Board composition** — maintain founder majority (2:1 or 3:2) at seed stage
5. **Protective provisions** — limit investor blocking rights to truly major decisions (sale, dissolution, new fundraise)

## 5.5 Comparable Seed Rounds (EdTech / AI-Education)

| Company | Year | Seed Size | What They Emphasized | Outcome |
|---------|------|-----------|---------------------|---------|
| **Duolingo** | 2011 | $3.3M | Founder credibility (reCAPTCHA inventor), 300K users, gamification thesis | $9-12B market cap |
| **Brilliant.org** | 2012 | Undisclosed | Interactive STEM learning, problem-solving over lectures | $750M+ valuation |
| **Prodigy Math** | 2013 | Small seed | RPG math game, kids played voluntarily, teacher adoption | $159M total raised, 50M+ students |
| **Synthesis** | 2022 | $12M | Elon Musk school (Ad Astra) pedigree, collaborative learning, leadership games | Rapid scale |
| **Sparkli** | 2025 | $5M pre-seed | Ex-Google founders, generative AI for kids, interactive learning | Pre-launch |
| **Outschool** | 2017 | $1.4M | Marketplace model, teacher supply-side traction | $3B+ peak valuation |
| **CodeCombat** | 2013 | ~$2M | RPG coding, Y Combinator, deepest gamification in coding EdTech | $50-80M valuation |

**Common pattern:** Every successful EdTech seed was raised on engagement metrics and/or founder credibility — not revenue. SparkForge's product completeness (35 games, 124K LOC) exceeds most of these at their respective seed stages.

---

# 6. Preliminary Seed Proposal Design

This section provides a complete framework for SparkForge's investment proposal. It can serve as the basis for a formal pitch deck, investor memo, or data room.

## 6.1 Proposal Structure Overview

A complete SparkForge seed proposal consists of three deliverables:

| Deliverable | Format | Audience | Purpose |
|-------------|--------|----------|---------|
| **Pitch Deck** | 12-slide PDF/Keynote | First meetings | Hook interest, secure partner meeting |
| **Investor Memo** | 5-8 page document | Due diligence | Detailed thesis, financials, technical architecture |
| **Data Room** | Shared folder (Google Drive / Notion) | Post-term-sheet | Full documentation for legal and technical DD |

## 6.2 Investor Memo — Full Draft Framework

### Cover Page

```
SPARKFORGE — CONFIDENTIAL INVESTOR MEMO
Gamified AI Learning Platform for Children Ages 7-16

Raising: $3-5M Seed Round
Projected Use: 18-24 months to Series A milestones

[Date]
[Founder name(s) and contact]
```

### Section A: The Opportunity

**Opening paragraph (punch line first):**

> Artificial intelligence will reshape every industry, yet the generation entering the workforce in 2035-2040 has no structured way to learn what AI is, how it works, or how to use it responsibly. SparkForge is the first platform to teach AI literacy to children ages 7-16 through 35 immersive, gamified experiences — not coding exercises, not textbook modules, but the kind of 3D interactive games that make kids choose learning over entertainment.

**Market sizing (bottom-up):**

| Layer | Calculation | Size |
|-------|------------|------|
| Global children 7-16 with internet | ~800M | — |
| English-speaking markets (US/UK/CA/AU/NZ) | ~65M | — |
| Families willing to pay for EdTech | ~30% = 19.5M | — |
| At $100/year ARPU | 19.5M x $100 | **$1.95B SAM** |
| SparkForge capture at 1% (Y5) | 196K subscribers | **$24.5M ARR** |

**Policy tailwinds:**
- Multiple US states introducing AI literacy curriculum requirements (California, Virginia)
- EU AI Act includes education provisions
- UNESCO published K-12 AI education framework (September 2023)
- US Department of Education report: "AI and the Future of Teaching and Learning" (May 2023)

### Section B: The Product

**Product summary with metrics:**

| Metric | Value |
|--------|-------|
| Games | 35 (6 Flagship + 9 FL-Lite + 20 Standard) |
| AI Topics | 10 themed Labs (neural networks, NLP, computer vision, bias, RL, etc.) |
| Age bands | 3 tiers: A (7-9), B (10-12), C (13-16) |
| 3D components | 84 React Three Fiber components |
| Codebase | 464 files, 124,272 lines of TypeScript |
| Triangle budget | 37.8M (cockpit) + 12.2M (game headroom) = 50M total |
| AI integration | Anthropic Claude API (Prompt Lab game + Content Agent) |
| Monetization | Free / Plus ($8.99/mo) / Forge ($16.99/mo) + School licensing |
| Infrastructure | Next.js 15, Supabase, Stripe, Vercel, Sentry |
| Compliance | COPPA-aware architecture, parent dashboard, age verification |

**Technical moat statement:**

> SparkForge's WebGPU-rendered 3D cockpit environment (37.8 million triangles), custom TSL shader pipeline, and deep Claude API integration create a 12-18 month replication barrier. Building 35 AI education games with immersive 3D environments, age-band differentiation, and COPPA-compliant architecture from scratch requires both specialized engineering talent and deep pedagogical design — a combination no current competitor possesses.

### Section C: Business Model & Unit Economics

**Revenue model:**

| Tier | Price | Target Audience | Features |
|------|-------|----------------|----------|
| **Free** | $0 | Gateway / school access | 3 games per lab, basic progression |
| **Plus** | $8.99/mo ($79.99/yr) | Core families | All 35 games, full progression, parent dashboard |
| **Forge** | $16.99/mo ($149.99/yr) | Premium families | All Plus + AI tutor, advanced 3D, multi-child |
| **School** | $6-8/student/yr | Institutional | Classroom management, curriculum alignment, bulk licensing |

**Projected unit economics (Y3+):**

| Metric | Value |
|--------|-------|
| Blended monthly ARPU (paid) | $8-10 |
| Free-to-paid conversion | 10-14% (gamification drives above average) |
| Monthly churn (paid) | 4-5% |
| LTV | $160-240 |
| CAC (blended) | $25-50 |
| LTV:CAC | 3.5:1 – 5:1 |
| Gross margin | 75-85% |
| Payback period | 3-5 months |

### Section D: Competitive Landscape

**Positioning matrix:**

```
                    HIGH AI Content Depth
                          │
        Brilliant.org     │  ★ SPARKFORGE
        (older audience)  │  (35 games, 3D, ages 7-16)
                          │
   ─────────────────────────────────────────── HIGH Gamification
                          │
        Khan Academy      │  Tynker / CodeCombat
        (broad, not       │  (coding focus, bolt-on AI)
         gamified)        │
                          │
                    LOW AI Content Depth
```

**Key insight:** SparkForge is alone in the top-right quadrant — deep AI content with deep gamification. Competitors are either AI-deep but not gamified (Brilliant), or gamified but not AI-focused (Tynker, CodeCombat), or broad but shallow on both (Khan Academy).

### Section E: Go-to-Market Strategy

**Phase 1 (Months 1-6): Consumer Launch**
- Content marketing: AI education blog, YouTube explainers, parent community building
- Influencer partnerships: EdTech YouTubers, parent bloggers, homeschool communities
- Waitlist conversion: 5,000+ pre-launch signups → beta testers → paid subscribers
- Referral program: Free month for referring families

**Phase 2 (Months 6-12): School Pilots**
- 5-10 school pilot programs (initially free/discounted)
- Curriculum alignment mapping (ISTE, CSTA standards)
- Teacher resources and classroom management tools
- Case studies from pilot schools

**Phase 3 (Months 12-18): Institutional Scale**
- District-level sales (1,000+ seat licenses)
- Conference presence (ISTE, ASU+GSV)
- International expansion (UK, Canada, Australia)
- B2B revenue target: 20-40% of total ARR by Y3

### Section F: The Team

*[To be completed with actual founder/team details]*

**Required roles for seed stage:**
- CEO / Education Domain Lead — EdTech experience, vision, fundraising
- CTO / Technical Lead — Full-stack + 3D/WebGPU expertise
- Head of Content / Pedagogy — Curriculum design, child development
- Advisory Board — AI researchers, educators, child safety experts, EdTech operators

### Section G: Financial Projections (18-Month)

**Use of $4M seed (mid-range scenario):**

| Category | Allocation | Amount | Key Hires/Spend |
|----------|-----------|--------|----------------|
| Engineering | 40% | $1.6M | 3-4 engineers (full-stack, 3D, backend) |
| Marketing/Growth | 25% | $1.0M | Head of marketing, content creators, paid acquisition |
| Content Development | 15% | $600K | Curriculum designers, game designers, QA |
| Infrastructure | 10% | $400K | Vercel, Supabase, Anthropic API, Sentry, tools |
| G&A | 10% | $400K | Legal (COPPA), ops, office, insurance |
| **Total** | **100%** | **$4.0M** | **18-24 month runway** |

**Series A readiness milestones (18 months):**

| Milestone | Target | Purpose |
|-----------|--------|---------|
| Registered users | 250,000+ | Market demand validation |
| Paid subscribers | 5,000-10,000 | Revenue traction |
| ARR | $500K-1M | Fundable at Series A |
| School pilots | 10+ active | B2B proof of concept |
| D30 retention | >20% | Engagement loop validated |
| NPS | 50+ | Product-market fit signal |

### Section H: The Ask

> **SparkForge is raising $3-5M in seed funding** to:
>
> 1. **Launch publicly** — Complete remaining 20% of development, beta test, and launch to consumers
> 2. **Prove unit economics** — Demonstrate free-to-paid conversion, retention, and LTV in market
> 3. **Establish B2B pipeline** — Secure 10+ school pilot programs and first institutional revenue
> 4. **Reach Series A readiness** — $500K-1M ARR within 18 months
>
> The $3-5M range provides 18-24 months of runway at projected burn rate, sufficient to hit all milestones above with margin of safety.

## 6.3 Data Room Checklist

Prepare these documents before first VC meeting:

| Category | Documents |
|----------|----------|
| **Corporate** | Certificate of incorporation, operating agreement, cap table, stock purchase agreements |
| **Financial** | 18-month financial model (Excel), burn rate projection, bank statements |
| **Product** | Live demo access (Demo Login link), product roadmap, technical architecture diagram |
| **Market** | Market analysis report (`2026_MarketAnalysis_Report.md`), competitive landscape, customer research |
| **Legal** | COPPA compliance plan, privacy policy draft, terms of service draft, IP assignment agreements |
| **Team** | Founder bios, advisor agreements, org chart, key hire plan |
| **Metrics** | Beta engagement data (when available), waitlist growth, NPS surveys |
