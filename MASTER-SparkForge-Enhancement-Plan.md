# SPARKFORGE LABS — MASTER ENHANCEMENT PLAN

> **Version:** 2.0  
> **Last Updated:** 2026-06-04  
> **Status:** 7 of 10 Phases Complete  
> **Branch:** `setup-sparkforge-dev`  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 1 — Unified Sparky AI Tutor Avatar](#phase-1)
3. [Phase 2 — Retention Mechanics Engine](#phase-2)
4. [Phase 3 — Home Page Redesign](#phase-3)
5. [Phase 4 — PetTrainer Tamagotchi](#phase-4)
6. [Phase 5 — Game Juice System](#phase-5)
7. [Phase 6 — Game Mechanic Diversification Kit](#phase-6)
8. [Phase 7 — Sparky Quest Giver](#phase-7)
9. [Phase 8 — COPPA-Safe Social Features](#phase-8)
10. [Phase 9 — Seasonal Content Engine](#phase-9)
11. [Phase 10 — Long-Term Evolution](#phase-10)
12. [Technical Architecture](#technical-architecture)
13. [Database Schema Summary](#database-schema-summary)
14. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

This plan transforms SparkForge Labs from a functional educational game platform into a retention-optimized, engagement-driven learning ecosystem. Each phase builds on previous work while introducing new mechanics proven to increase user engagement in children's educational platforms.

### Key Metrics Targets

| Metric | Current | Target (Post Phase 10) |
|--------|---------|----------------------|
| DAU/MAU Ratio | ~15% | 45%+ |
| Avg Session Length | 8 min | 18 min |
| Day 7 Retention | ~12% | 35%+ |
| Day 30 Retention | ~4% | 18%+ |
| Games Per Session | 2.1 | 5.0+ |
| Parent Engagement | Low | Weekly reports opened |

### Research Foundation

- **Duolingo** (2024): Streak mechanics increase D30 retention by 3.2x
- **Prodigy Math** (2023): Virtual pets increase session frequency by 2.1x
- **Minecraft Education** (2023): Quest systems increase completion rates by 47%
- **UGA Study** (2022): Virtual pets in classrooms increased engagement by 156%
- **Kahoot!** (2024): Combo/juice systems increase replay rates by 68%

---

## Phase 1 — Unified Sparky AI Tutor Avatar

**Status:** COMPLETE  
**Commit:** `cee5fd8`  
**Files:** `src/components/sparky/*`

### What Was Built

Canonical Sparky avatar system with 9 emotional expressions surfaced through 4 context-aware wrappers:

| Component | Purpose |
|-----------|---------|
| `SparkyCore.tsx` | SVG face with 9 expressions (happy, excited, thinking, celebrating, sad, surprised, determined, sleepy, proud) |
| `SparkyFloating.tsx` | Dashboard floating assistant with speech bubbles |
| `SparkyPresenter.tsx` | Mission/announcement mode with dramatic entrance |
| `SparkyStatic.tsx` | Landing page and static display |
| `index.ts` | Barrel export |

### Key Decisions
- Single canonical component prevents visual drift across surfaces
- All expressions are SVG-based (no external images = COPPA-safe)
- Context-aware wrappers handle positioning and animation, not SparkyCore

---

## Phase 2 — Retention Mechanics Engine

**Status:** COMPLETE  
**Commit:** `6f19fab`  
**Files:** `src/lib/streak/*`, `src/lib/currency/*`, `src/lib/leaderboard/*`, `src/lib/badges/*`

### What Was Built

Duolingo-inspired retention system with 4 interconnected engines:

#### StreakEngine
- Daily streak tracking with timezone-aware UTC dates
- Streak freeze system (equip before break, auto-recover)
- Streak wagers (7-day and 14-day bets with gem rewards)
- Streak Society (premium tier at 30+ days with 2x XP multiplier)
- Calendar generation for visual progress

#### CurrencyEngine
- Gem wallet with earn/spend/transaction history
- Daily reward system (day 1-7 escalating rewards, resets weekly)
- Anti-fraud: server-side validation, no client-side gem manipulation

#### LeaderboardEngine
- 6-tier league system: Bronze → Silver → Gold → Platinum → Diamond → Legend
- Weekly resets every Monday at 00:00 UTC
- Promotion/demotion zones (top 5 promote, bottom 5 demote)
- COPPA-safe: pseudonymous display names, no PII, no photos

#### BadgeEngine
- 40+ badge catalog across 5 rarity tiers
- Progressive unlock chains (e.g., Play 1 → 10 → 50 → 100 games)
- Surprise badges for Easter eggs and hidden achievements

### Database Tables (8 new tables)
`streak_history`, `streak_freezes`, `streak_wagers`, `currency_wallets`, `currency_transactions`, `leaderboard_entries`, `badge_progress`, `badge_definitions`

---

## Phase 3 — Home Page Redesign

**Status:** COMPLETE  
**Commit:** `3852ae8`  
**Files:** `src/app/(dashboard)/home/page.tsx`, `src/components/home/*`, `src/components/mission/*`

### What Was Built

Complete home page overhaul integrating all Phase 2 retention mechanics:

| Component | Purpose |
|-----------|---------|
| `QuickStatsBar` | Horizontal stats (streak, gems, badges, league, level) |
| `DailyMissionCard` | Sparky-given daily challenge with lab/game targeting |
| `ActivityFeed` | Recent learning timeline with streak/game/badge events |

### Layout
```
+----------------------------------+------------------------+
| Welcome Header                    | LeaderboardPanel       |
| QuickStatsBar                    |                        |
|                                   | QuestPanel (Phase 7)   |
| DailyMissionCard                 |                        |
|                                   | PetWidget (Phase 4)    |
| Continue Playing (featured)      |                        |
|                                   | ActivityFeed           |
| Overall Progress                  |                        |
|                                   | DailyChallengeQuickCard|
+----------------------------------+------------------------+
```

---

## Phase 4 — PetTrainer Tamagotchi

**Status:** COMPLETE  
**Commit:** `ae68b54`  
**Files:** `src/lib/pet/*`, `src/components/pet/*`, `src/hooks/usePet.ts`

### What Was Built

Virtual pet retention anchor with research-backed engagement mechanics:

#### PetEngine
- **4 needs** that decay over time: hunger, happiness, energy, cleanliness
- **5 care actions**: feed, play, clean, train, sleep
- **5 growth stages**: Egg → Baby → Child → Teen → Adult
- **3 evolution paths** based on care quality: TechWhiz (play), DataNinja (train), RoboPal (balanced)
- **8 tricks** to learn, each with mini-game style training sessions
- **Offline decay**: needs decrease while child is away (capped to prevent death)

#### Components
| Component | Purpose |
|-----------|---------|
| `PetAvatar.tsx` | Animated mood-responsive avatar (SVG) |
| `PetCarePanel.tsx` | Need bars with critical pulse, care buttons |
| `PetEvolutionModal.tsx` | Cinematic evolution celebration |
| `PetWidget.tsx` | Home page card with expandable care panel |

### Database Tables
`pet_states`, `pet_care_logs`, `pet_accessories`

---

## Phase 5 — Game Juice System

**Status:** COMPLETE  
**Commit:** `30f256e`  
**Files:** `src/lib/juice/*`, `src/components/juice/*`

### What Was Built

In-game feedback engine that makes every action feel rewarding:

#### GameJuiceEngine
- **6-tier combo system**: Good(2x) → Great(3x) → Awesome(4x) → Amazing(5x) → Incredible(10x) → LEGENDARY(20x)
- **7 milestones**: First Win, Speed Demon, Perfect Round, Combo Master, etc.
- **Sparky reaction mapping**: Each milestone triggers context-appropriate Sparky expression
- **Screen shake**: Configurable intensity per combo tier
- **Floating text**: +XP, +Gems, combo multipliers animate upward

#### JuiceProvider Context
| Sub-Component | Purpose |
|---------------|---------|
| `ComboDisplay` | Live combo counter with tier badge |
| `FloatingText` | Animated score popups |
| `MilestonePopup` | Full-screen achievement flash |
| `SparkyGameReaction` | In-game Sparky commentary |

### Integration
All 42 games wrapped via `<JuiceProvider>` in `GameShell.tsx` — no individual game changes required.

---

## Phase 6 — Game Mechanic Diversification Kit

**Status:** COMPLETE  
**Commit:** `061914f`  
**Files:** `src/lib/mechanics/*`, `src/components/mechanics/*`

### What Was Built

4 reusable game mechanic components to replace the quiz-heavy pattern (21 of 42 games used similar quiz flow):

| Component | Type | Use Case |
|-----------|------|----------|
| `DragDropZone` | Click-to-move classification | Sort items into categories |
| `ConnectionBoard` | SVG node-link builder | Connect related concepts |
| `SortingTray` | Framer Motion Reorder | Sequence/ordering puzzles |
| `ChoiceCardDeck` | Branching decisions | Choose-your-path scenarios with consequence reveal |

#### GameMechanicKit
- 7 item types (text, image, code block, diagram, audio clip, formula, definition)
- 4 validators (exact match, fuzzy match, category match, sequence match)
- Scoring engine with combo support
- 3 difficulty presets per component
- Full demo data for each mechanic type

---

## Phase 7 — Sparky Quest Giver

**Status:** COMPLETE  
**Commit:** `59cb9ea`  
**Files:** `src/lib/quests/*`, `src/components/quests/*`, `src/hooks/useQuests.ts`, `src/app/api/quests/*`

### What Was Built

Daily quest system with weekly chains, rarity tiers, and streak bonuses:

#### QuestEngine
- **32 quest templates** across 3 difficulties:
  - Easy (10): 1-2 games, 5-10 gems, 10 XP
  - Medium (10): 3-5 games, 10-20 gems, 25 XP
  - Hard (12): 7-15 games, 20-50 gems, 50 XP
- **2 weekly chain templates** (7 steps each):
  - "AI Master in Training": play → score → perfect → explore
  - "Streak Champion": maintain → earn → collect
- **Rarity system**: common(1.0x) → uncommon(1.2x) → rare(1.5x) → epic(2.0x) → legendary(3.0x)
- **Streak bonus**: +5% per consecutive quest completion day, max 2x

#### Components
| Component | Purpose |
|-----------|---------|
| `QuestCard.tsx` | Rarity-glow borders, progress bar, claim button |
| `QuestPanel.tsx` | Sparky greeting, completion summary, weekly chain display |
| `useQuests.ts` | Server sync, progress tracking, optimistic updates |

#### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/quests` | GET | Fetch today's quests + weekly chain |
| `/api/quests` | POST | Generate new daily quests |
| `/api/quests/claim` | POST | Claim quest rewards (gems + XP) |
| `/api/quests/progress` | POST | Update progress from game events |

#### Database Tables
`active_quests`, `quest_history`, `weekly_quest_chains`, `weekly_chain_steps`

#### Event Type Mapping
Progress events from games/pet automatically map to quest types:
```
game_complete → play_games    pet_care → pet_care
xp_earned → earn_xp           pet_trick → learn_tricks
perfect_score → perfect_score lab_visit → lab_explore
```

---

## Phase 8 — COPPA-Safe Social Features

**Status:** PLANNED  
**Priority:** HIGH  
**Estimated Effort:** 3 weeks

### Overview
Social features designed for children under 13 that fully comply with COPPA — no PII, no free-form chat, no photos, parent-controlled.

### Features

#### 1. Study Buddies (Friend System)
- Parent-approved friend connections only
- No search-by-name: friends connect via shareable invite codes
- COPPA-safe avatars (Sparky expressions + accessories, no photos)
- Friend limit: 10 max per child

#### 2. Collaborative Challenges
- "Buddy Quests": Complete quests together with a friend
- Synchronized weekly challenges (both must complete for bonus)
- Team vs Team competitions (COPPA-safe grouping)

#### 3. Safe Communication
- **Pre-set messages only**: 50+ positive, educational message templates
- No free-form typing, ever
- Messages reviewed by NLP filter before delivery
- Parent can view all communication history
- One-tap report system for any concern

#### 4. Shared Achievements
- "Buddy Badges" earned together (e.g., "Study Partners: Complete 10 quests together")
- Shared pet playdates (visit friend's pet, collaborative mini-games)
- Joint leaderboard entries for team events

### Technical Requirements
- `friend_connections` table with parent_approved flag
- `buddy_quests` table for collaborative quests
- `message_templates` catalog (server-controlled)
- `safe_messages` table for sent message audit trail
- `parent_approvals` table for friend request workflow

### COPPA Compliance Checklist
- [ ] No collection of friend's real names (display names only)
- [ ] No geolocation data shared
- [ ] No photos or videos
- [ ] Parent must approve every friend connection
- [ ] Parent can view all communications
- [ ] No external links in messages
- [ ] Data minimization: only store what's necessary

---

## Phase 9 — Seasonal Content Engine

**Status:** PLANNED  
**Priority:** MEDIUM  
**Estimated Effort:** 2 weeks

### Overview
Limited-time seasonal events that create FOMO and recurring engagement spikes.

### Features

#### 1. Seasonal Quest Lines
- Monthly themed quest chains (e.g., "Summer AI Explorer", "Winter Code Wonderland")
- Exclusive seasonal rewards (accessories, badges, backgrounds)
- Season completion tracker with grand prize

#### 2. Seasonal Shop
- Limited-time cosmetic items for Sparky and Pet
- Seasonal currency (earned only during event)
- Items rotate weekly during season

#### 3. Holiday Mini-Games
- 3-5 special games per major holiday
- Lightweight variants of existing games with holiday themes
- Available for 2 weeks only

#### 4. Leaderboard Events
- Special leaderboard tiers during seasons
- "Season Champion" title for top performers
- Team-based leaderboard events

### Season Calendar (Proposed)
| Season | Period | Theme |
|--------|--------|-------|
| Winter Festival | Jan 1-31 | Winter Code Wonderland |
| Valentine's | Feb 1-14 | Hearts & Algorithms |
| Spring Bloom | Mar 15-Apr 15 | Garden of Knowledge |
| Summer Explorer | Jun 1-Aug 15 | Summer AI Adventure |
| Back to School | Sep 1-30 | Code Academy |
| Halloween | Oct 15-31 | Spooky Circuits |
| Holiday | Dec 1-31 | Winter AI Festival |

### Technical Requirements
- `seasons` table for season definitions
- `seasonal_quests` table for time-limited quests
- `seasonal_items` table for shop inventory
- `seasonal_progress` table for per-child season tracking
- Cron job to activate/deactivate seasons automatically

---

## Phase 10 — Long-Term Evolution

**Status:** PLANNED  
**Priority:** MEDIUM  
**Estimated Effort:** 4 weeks

### Overview
Systems that keep the platform fresh for long-term users (6+ months).

### Features

#### 1. Adaptive Difficulty System
- ML-based difficulty adjustment per child
- Tracks: accuracy, speed, help requests, retry patterns
- Auto-adjusts game difficulty within lab topics
- Parent dashboard shows learning curve visualization

#### 2. Mastery Path System
- Topic mastery trees (visual skill progression)
- Prerequisites for advanced labs (must complete basics first)
- Mastery certificates per topic (shareable with parent approval)
- "Expert Mode" unlocks after mastery (harder variants of completed games)

#### 3. User-Generated Content (COPPA-Safe)
- "Create a Quiz" tool with pre-approved question templates
- Children create content, moderated before sharing
- Community content library with ratings
- Creator badges for published content

#### 4. Cross-Lab Story Campaigns
- 5-chapter narrative campaigns spanning multiple labs
- Unlockable story cutscenes with Sparky
- Branching narrative based on game choices
- Replayable for different endings

#### 5. Advanced Analytics Dashboard (Parent)
- Learning velocity tracking (XP per week trend)
- Topic strength heatmap
- Time-on-task analytics
- Comparative benchmarks (anonymous percentile)
- Weekly email reports with AI-generated insights

### Technical Requirements
- `mastery_paths` table for topic progression
- `adaptive_difficulty` table for per-child difficulty settings
- `user_content` table for community creations
- `story_progress` table for narrative campaigns
- `analytics_snapshots` table for parent dashboard data

---

## Technical Architecture

### File Organization Pattern (All Phases)

```
src/
  lib/{feature}/           # Pure function engines
    {Feature}Engine.ts
    index.ts               # Barrel export
  components/{feature}/    # React components
    {Component}.tsx
    index.ts               # Barrel export
  hooks/use{Feature}.ts    # React hooks
  app/api/{feature}/       # API routes
    route.ts
    {subroute}/
      route.ts
  tests/unit/{feature}-engine.test.ts
supabase/migrations/       # Database migrations
  YYYYMMDD_{feature}.sql
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (COPPA-compliant) |
| Payments | Stripe |
| Monitoring | Sentry |

### COPPA Compliance Architecture
- Pseudonymous display names (no real names)
- Parent email required for account creation
- Verifiable parental consent flow
- All PII in `children` table with RLS
- Pre-set communication templates (no free-form text)
- Parent approval required for social features
- One-tap data export and deletion

---

## Database Schema Summary

### Phase 1 (Foundation)
- `children` — child profiles, gamification state
- `users` — parent accounts
- `game_sessions` — play history

### Phase 2 (Retention)
- `streak_history`, `streak_freezes`, `streak_wagers`
- `currency_wallets`, `currency_transactions`
- `leaderboard_entries`
- `badge_progress`, `badge_definitions`

### Phase 4 (Pet)
- `pet_states`, `pet_care_logs`, `pet_accessories`

### Phase 7 (Quests)
- `active_quests`, `quest_history`
- `weekly_quest_chains`, `weekly_chain_steps`

### Planned Phase 8-10
- `friend_connections`, `buddy_quests`, `safe_messages`
- `seasons`, `seasonal_quests`, `seasonal_items`, `seasonal_progress`
- `mastery_paths`, `adaptive_difficulty`, `user_content`, `story_progress`

---

## Deployment Checklist

### Pre-Deploy (All Phases)
- [ ] Run `supabase/migrations` in order on production
- [ ] Verify RLS policies are active
- [ ] Seed badge definitions
- [ ] Seed quest templates (Phase 7)
- [ ] Verify feature flags are set correctly

### Phase-Specific Activation
- [ ] Phase 1: Sparky visible on all surfaces
- [ ] Phase 2: Streak/currency/leaderboard badges active
- [ ] Phase 3: Home page redirects to new design
- [ ] Phase 4: PetWidget visible on home page
- [ ] Phase 5: JuiceProvider wraps all games
- [ ] Phase 6: Gradually replace quiz games with mechanic components
- [ ] Phase 7: QuestPanel visible, daily cron job generates quests
- [ ] Phase 8: Parent approval flow active for social features
- [ ] Phase 9: Season activation cron job scheduled
- [ ] Phase 10: Analytics collection begins

### Monitoring
- [ ] Sentry error tracking active
- [ ] PostHog/Mixpanel event tracking for engagement metrics
- [ ] Parent dashboard shows real-time data
- [ ] Automated alerts for >5% error rate

---

## Appendix: Completed Commits Log

| Phase | Commit | Description |
|-------|--------|-------------|
| 1 | `cee5fd8` | Unified Sparky AI Tutor Avatar System v4 |
| 2 | `6f19fab` | Retention Mechanics Engine |
| 3 | `3852ae8` | Home Page Redesign |
| 4 | `ae68b54` | PetTrainer Tamagotchi |
| 5 | `30f256e` | Game Juice System |
| 6 | `061914f` | Game Mechanic Diversification Kit |
| 7 | `59cb9ea` | Sparky Quest Giver |

---

*This document is a living plan. Priorities and timelines may shift based on user feedback and engagement data. All phases maintain COPPA compliance and follow the established pure-function engine + React component architecture.*
