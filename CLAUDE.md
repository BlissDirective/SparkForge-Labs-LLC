SPARKFORGE — CLAUDE.md
Operational Guide for Claude Code
Last Updated: February 24, 2026 | Version: v3 (Visual Stack Complete)
1. PROJECT IDENTITY
SparkForge is a gamified AI learning platform for children ages 7-16. It teaches AI concepts
through 31 interactive games across 10 themed “Labs.” The platform uses a dark-mode-
only aesthetic called “Frost-Prismatic” with chrome bezels, neon accents, and
glassmorphism.
Tech Stack — Foundation Layer
Layer Technology Purpose
Framework Next.js 14 (App Router) Full-stack React framework
Language TypeScript (strict mode) Type-safe JavaScript
Styling Tailwind CSS Utility-first CSS
Database Supabase (PostgreSQL + Auth +
Storage) All persistent data
State Zustand Client-side stores (6 total — see
Section 7)
Data
Fetching
React Query (@tanstack/react-
query) Server state, caching, mutations
Validation Zod Schema validation
Payments Stripe Subscription tiers (Free/Plus/Forge)
AI Anthropic Claude API Prompt Lab game + Content Agent
Deployment Vercel Production hosting
Tech Stack — Visual Layer
Tech Stack — UI Components
Layer Technology Purpose
2D
Motion
Framer Motion Page transitions, hover states, layout animations,
gesture response
2D
Motion GSAP + ScrollTrigger Scroll-driven sequences, timelines, parallax, pinned
sections
3D
Rendering Three.js 3D rendering engine (underlying)
3D
Rendering
React Three Fiber
(R3F) React wrapper for Three.js scenes
3D
Helpers @react-three/drei Float, Sparkles, MeshTransmission, Text3D,
Environment, ContactShadows
3D
Effects
@react-
three/postprocessing Bloom, ChromaticAberration, Vignette, God Rays
3D
Design
@splinetool/react-
spline Spline scene embedding (hero, REO mascot)
Charts recharts Data visualization (Neural Builder accuracy/loss
graphs)
Layer Technology Purpose
UI
Primitives
Radix UI Dialog, Dropdown, Tabs, Progress, Slider,
Tooltip, Avatar, Switch, Select
CSS
Utilities
class-variance-authority,
clsx, tailwind-merge Class composition
Icons Lucide React All icons throughout the app
Drop Drag and
@dnd-kit Sort Toy Box, Agent Architect, Neural Builder,
Code Blocks
Animations tailwindcss-animate CSS animation utilities
3D Component Architecture
All R3F components MUST be dynamically imported with ssr false to prevent server-side
rendering of browser-only WebGL code:
import dynamic from 'next/dynamic';
const Crystal3D = dynamic(
() => import('@/components/3d/CrystalHero'),
{ ssr: false, loading: () => <CrystalPlaceholder /> }
);
The next.config.js webpack section externalizes Three.js packages from server builds:
webpack: (config, { isServer }) => {
if (isServer) {
config.externals.push({
'three': 'three',
'@react-three/fiber': '@react-three/fiber',
'@react-three/drei': '@react-three/drei',
});
}
return config;
},
Performance Budget (3D)
Element Target Notes
R3F scenes < 300KB JS tree-shaken Only import what you use
Spline runtime 2-4MB Lazy-loaded, hero and REO only
GSAP 30KB Core + ScrollTrigger
Framer Motion 32KB Already in bundle
Total 3D overhead < 1MB first load Lazy-load ALL 3D components
Target FPS 60fps desktop, 30fps mobile Reduce particles on mobile
Folder Structure
sparkforge/
src/
app/
(auth)/ Login, signup, reset-password
(dashboard)/ Authenticated pages with sidebar
home/ Dashboard
labs/ Lab map + lab detail pages
arcade/ Game arcade
profile/ User profile
badges/ Badge gallery and Trophy Room
parent/ Parent dashboard
onboarding/ First-time wizard
(marketing)/ Public landing page
(public)/ Pre-auth pricing page
api/ API routes
auth/ Signup, login, logout, callback, me
children/ CRUD + [id]
content/ Content fetching
progress/ Progress + all-labs single call
gamification/ XP, streak, badges
stripe/ Checkout, webhook, portal
ai/ Prompt Lab endpoint
health/ Health check
agent/ Content agent pipeline
components/
3d/ All R3F and Three.js 3D components (ssr false)
CrystalHero.tsx Landing page crystal
OnboardingCrystal.tsx Onboarding forming crystal
LabMap3D.tsx Lab map 3D hex nodes
Pet3DScene.tsx Pet Trainer R3F scene
NeuralNet3D.tsx Neural Builder R3F scene
PromptBubble3D.tsx Prompt Lab thought bubble
AgentPipeline3D.tsx Agent Architect pipeline
StreakFlame3D.tsx Diamond-tier shader fire
BadgeLevitate3D.tsx Legendary and Epic badge levitation
SparkCard3D.tsx Daily Spark 3D card flip
LevelUpExplosion.tsx Level-up R3F particle burst
GameParticles3D.tsx Shared GPU particle system
game/ GameShell, XPPopup, GameCompleteCelebration, StreakFire
games/ All 31 game components
ui/ Button, Card, Input, Modal, ErrorBoundary, OfflineBanner
shared/ LoadingSkeleton, FeatureGate, ToastContainer
content/ LessonViewer, QuizEngine, SparkFactCard
layout/ Sidebar, TopBar, ChildSelector
accessibility/ A11yProvider, AccessibilityToolbar
celebrations/ CelebrationOverlay
providers/ AuthProvider, QueryProvider, PageTransitionProvider
profile/ AvatarDisplay, BadgeCard, TrophyRoom
gamification/ StreakFlame, StreakShield, DailySparkCard, BadgeProgressRing
labs/ LabConnectionMap
dashboard/ QuickPlay
hooks/ 10 custom hooks (see Section 7)
lib/
supabase/ client.ts, server.ts
tier-config.ts Subscription tier config
gamification.ts XP and level calculator
animations.ts Framer Motion variants (45+)
api.ts Fetch wrapper
feature-flags.ts Feature gate config
utils.ts cn, formatNumber, ageToAgeBand, shuffleArray
stores/ 6 Zustand stores (see Section 7)
types/index.ts All TypeScript interfaces
config/gameRegistry.ts All 31 game definitions
public/manifest.json PWA manifest
SparkForge_Master_Implementation_Guide.md
CLAUDE.md
tailwind.config.ts
next.config.js
tsconfig.json
.env.local Real secrets (NEVER commit)
.env.example Template
2. MASTER IMPLEMENTATION GUIDE
CRITICAL: Before starting any stage, read SparkForge_
Master
_Implementation_
Guide.md
first.
Workflow per Stage
1. 2. 3. READ Master Implementation Guide for stage overview
READ the referenced stage PDF for complete code
CHECK if a v3 visual enhancement patch exists for this stage
4. 5. 6. CREATE folders first, then files in the order specified
COPY code exactly as written
VALIDATE using three-layer check (visual, build, console)
7. COMMIT and move to next part or stage
3. DESIGN SYSTEM — FROST-PRISMATIC
Dark-mode only. Blue-dominant 60/40 rule (60% blue, 40% accent pops).
Color Palette
Neon Accents: blue #00BBFF (PRIMARY 60%), green #00FF88, purple #AA66FF, orange
#FF6644, amber #FFAA44 Surfaces: base #0A0E16, card #111118, elevated #1A1822, border
rgba(255,255,255,0.06) Chrome Bezel: edge rgba(255,255,255,0.06), highlight
rgba(255,255,255,0.12), specular rgba(255,255,255,0.18)
Lab Accent Colors: Lab 1 #00BBFF, Lab 2 #AA66FF, Lab 3 #FF66AA, Lab 4 #FFAA44, Lab 5
#00FF88, Lab 6 #FF6644, Lab 7 #06B6D4, Lab 8 #818CF8, Lab 9 #F97316, Lab 10
#D946EF
Font Stack (FROST-PRISMATIC — Authoritative)
Display: Exo 2 (headings, game titles) Body: Sora (paragraphs, UI text) Mono: JetBrains
Mono (code displays, data) Data: Orbitron (XP counters, scores)
IMPORTANT: Stage 10 Part 2 root layout must use Exo 2/Sora/Orbitron — NOT
Fredoka/Nunito Sans.
Visual Tool Assignment
Landing page hero: R3F crystal OR Spline + GSAP scroll-pinned acts Lab map: R3F 3D hex
nodes + Framer Motion panel transitions Game UIs: Framer Motion + Tailwind, optional R3F
GPU particles Badge unlock: R3F particle burst + Framer Motion modal Trophy Room
legendary: R3F levitating badges + Bloom Onboarding wizard: R3F crystal forming + Framer
Motion steps Streak Flame diamond: R3F shader fire, CSS fallback lower tiers Daily Spark
Card: R3F 3D glass card flip Level-Up Ceremony: R3F explosion + Bloom postprocessing
Prompt Lab thought bubble: R3F reactive 3D bubble Agent Architect pipeline: R3F floating
nodes + particle lines Pricing page: GSAP scroll reveal for tier cards Parent dashboard:
Tailwind + Framer Motion only Background particles: R3F shader-based GPU with CSS
fallback
4. GAME ARCHITECTURE TEMPLATE
Every game component follows this structure:
Required Imports: use client, useState, useMemo, motion, AnimatePresence, GameShell,
useGameStore, useChildStore
GameShell wrapper: gameId, title, worldNumber, worldColor, xpReward, totalRounds
Required Visual Elements:
1. Chrome bezel with LED rim lines
2. Particle background (12-15 particles, CSS or R3F GPU)
3. Welcome phase with title and action button
4. Learn phase with 4 age-band concept cards
5. Play phase (core gameplay)
6. Complete phase triggering game.completeGame()
Age Band Rules: A (7-10) simple, B (11-13) technical, C (14-16) industry terminology
5. POWERSHELL CONVENTIONS
Single-line only, no backtick continuations. Folder creation via New-Item. npm install on one
long line. Forward slashes in code. No Unix syntax.
Git: git add . then git commit -m “Stage N: description” then git push origin main
6. PAUSE-POINT RULES
HARD STOPS: Supabase/Stripe/Vercel setup, .env.local keys, visual verification, DB schema
changes, destructive operations. SOFT CHECKPOINTS: npm installs, non-standard folders,
shared file modifications, deviations. AUTONOMOUS: File creation, code writing, build/lint,
folder creation, git commits. Error handling: 2-3 self-fix attempts, then STOP. Never skip
errors or comment out code.
7. STORES, HOOKS AND SYSTEMS
Zustand Stores (6 total)
authStore: Parent auth state (Stage 1) childStore: Active child + XP/level/streak (Stage 1,
expanded Stage 5) uiStore: Sidebar, celebrations, lab color (Stage 1) gameStore: Game
round/score/hints/timer (Stage 1) toastStore: Toast notifications (Stage 1 v2)
accessibilityStore: A11y with persist (Stage 10)
Custom Hooks (10 total)
useChildren, useContent, useProgress, useGamification (Stage 4) useMediaQuery,
useDebounce, useSystemPreferences, useLocalStorage (Stage 1 v2) useSessionTracker
(Stage 3 v2) useGSAPScroll (Stage 3 v3)
Systems
Feature Flags: feature-flags.ts + FeatureGate.tsx (Stage 1 v2) Toast Notifications:
toastStore.ts + ToastContainer.tsx (Stage 1 v2) Accessibility: accessibilityStore +
A11yProvider + AccessibilityToolbar + globals-a11y.css (Stage 10) Error Boundaries:
ErrorBoundary.tsx + error.tsx files (Stage 3/10) Offline Detection: OfflineBanner.tsx (Stage
10) PWA: manifest.json (Stage 10)
8. FILE NAMING CONVENTIONS
Components: PascalCase (EmojiDecoderGame.tsx) Game components:
src/components/games/NameGame.tsx 3D components: src/components/3d/Name.tsx
Stores: camelCase (authStore.ts) API Routes: src/app/api/resource/route.ts Hooks:
camelCase with use prefix (useGSAPScroll.ts)
9. TERMINOLOGY
UI text: Lab. Database columns: world. API params: world. Hook names: Lab. Store
properties: labColor. Types/constants: WORLDS.
10. CURRENT PROJECT STATE (Feb 24, 2026)
All 10 stages have complete v2 documentation. v3 visual enhancement patches pending for
Stages 3, 4, 5, 6D, 6E, 7, 8, 10. No code written yet. Implementation order: 1 through 10.
31 games: 5 flagships (6B-6F), 26 standard/enhanced (7A-7F), 3 V3 treatments, 3 shared
systems.
11. KNOWN ISSUES AND FIXES
BUG-1: useApi.ts stubs — Stage 4 Part 1 REPLACES entirely BUG-3: 10 parallel progress
calls — Stage 4 uses single /api/progress/all-labs BUG-5: Lab map wrong completion —
Fixed in Stage 4 BUG-8A: Duplicate tier configs — APPEND to existing tier-config.ts BUG-
10D: CSP blocks Vercel — connect-src includes Vercel domains BUG-10F: Font stack
conflict — Root layout uses Exo 2/Sora/Orbitron NOT Fredoka/Nunito IMP-4: spark vs neon
tokens — Both defined as aliases in tailwind.config.ts
12. SUBSCRIPTION TIERS
Free: $0, Labs 1-3, 3 games/week, 1 profile, 5 prompts/day Plus: $7.99/mo ($79.99/yr), all 10
Labs, unlimited games, 3 profiles, 25 prompts/day Forge: $14.99/mo ($149.99/yr), all 10
Labs, unlimited games, 5 profiles, unlimited prompts + API Explorer
13. READING STAGE DOCUMENTS
1. Read Master Implementation Guide section for that stage
2. Check for v3 visual enhancement patches
3. Read entire stage PDF before writing code
4. Identify all pause points
5. Create folders first, then files in order
6. Copy code exactly
7. Apply v3 patches if they exist
8. Run validation after each section
9. Stop at HARD STOPs
10. Report completion with summary
This is a living document. Updated February 24, 2026 (v3 Visual Stack Complete).