SPARKFORGE — MASTER IMPLEMENTATION GUIDE
Version: 2.0 | Date: February 24, 2026 | For: Claude Code
Purpose: Single entry point for building SparkForge from stage documents.
Visual Stack: Frost-Prismatic v3 — includes R3F, GSAP, Spline 3D enhancements.
HOW TO USE THIS GUIDE
This document is your roadmap. The actual code lives in the stage PDF documents stored
alongside this file. Your workflow for every stage is:
1. Read this guide for the stage overview, file list, and execution order
2. Read the referenced PDF for the complete copy-paste code
3. Create each file exactly as specified in the PDF
4. Validate using the three-layer check (visual, build, console)
5. Commit and move to the next part/stage
CRITICAL RULES:
Follow stages in order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
Each stage depends on all previous stages being complete
Never skip ahead. Never implement partial files.
Every code block in the PDFs is complete — copy the entire file contents
All PowerShell commands are single-line (no backtick continuations)
ENVIRONMENT
OS: Windows 11 with PowerShell 7+
Terminal: Windows PowerShell (all commands must be PS-compatible)
Editor: VS Code
Runtime: Node.js 20+ LTS
Stack: Next.js 14, TypeScript strict, Tailwind CSS, Supabase, Stripe, Framer Motion,
GSAP, React Three Fiber, Three.js, @react-three/drei, @react-three/postprocessing,
@splinetool/react-spline, recharts
Complete Package List (installed in Stage 1)
Foundation: next@14, react, typescript, tailwindcss, tailwindcss-animate
State/Data: zustand, @tanstack/react-query, zod
Database: @supabase/supabase-js, @supabase/ssr
UI: @radix-ui/* (dialog, dropdown, tabs, progress, slider, tooltip, avatar, switch, select)
CSS: class-variance-authority, clsx, tailwind-merge, lucide-react
Drag/Drop: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
Payments: stripe, @stripe/stripe-js
AI: @anthropic-ai/sdk
2D Motion: framer-motion, gsap
3D Rendering: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing
3D Design: @splinetool/react-spline
Charts: recharts
Dev: vitest, @testing-library/react, @testing-library/jest-dom, @types/three
3D Architecture Rule
All R3F/Three.js components MUST be in src/components/3d/ and dynamically imported
with ssr: false . The next.config.js externalizes Three.js from server builds. See
CLAUDE.md Section 1 for details.
PowerShell Command Rules
- Single-line only — no backtick (`) line continuations
- Folder creation: New-Item -ItemType Directory -Force -Path "src/folder"
- npm install: one long line with all packages space-separated
- No Unix-only syntax: no && chaining, no mkdir -p
- Path separators: forward slashes in code
Three-Layer Validation (run after every stage)
1. VISUAL: 2. BUILD: npm run dev → open localhost:3000 → check expected UI
npm run build → must complete with 0 errors
3. CONSOLE: Browser DevTools → Console → no red errors
Git Commit Convention
git add .
git commit -m "Stage N: Brief description of what was built"
git push origin main
PAUSE-POINT RULES
HARD STOPS — Must wait for human confirmation
Creating Supabase projects or running SQL in Supabase Dashboard
Creating Stripe products/prices in Dashboard
Setting up webhook endpoints in third-party services
Deploying to Vercel
ANY .env.local value requiring a real API key
NEVER invent placeholder values and continue as if they’re real
SOFT CHECKPOINTS — Pause, show status, continue if clean
After completing each STEP within a stage document
After npm run build succeeds
When switching between stage document parts
AUTONOMOUS — Proceed without asking
Creating files and folders as specified in stage docs
Running npm install commands
Writing code exactly as specified
Running build/lint commands
Self-fixing TypeScript errors (up to 3 attempts, then stop and ask)
DESIGN SYSTEM REFERENCE — FROST-PRISMATIC
Dark-mode only. Blue-dominant 60/40 rule.
Color Palette
Neon Accents:
blue: #00BBFF (PRIMARY — 60% of colored UI)
green: #00FF88
purple: #AA66FF
orange: #FF6644
amber: #FFAA44
Surfaces:
base: #0A0E16
card: #111118
elevated: #1A1822
border: rgba(255,255,255,0.06)
Lab Colors (1-10):
Lab 1: #00BBFF (What IS AI?)
Lab 2: #AA66FF (Teaching Machines)
Lab 3: #FF66AA (The Brain Inside)
Lab 4: #FFAA44 (AI That Creates)
Lab 5: #00FF88 (AI Helpers)
Lab 6: #FF6644 (AI & Ethics)
Lab 7: #06B6D4 (Computer Vision)
Lab 8: #818CF8 (Words & Language)
Lab 9: #F97316 (Build with AI)
Lab 10: #D946EF (AI's Future)
Fonts (FROST-PRISMATIC — Authoritative)
Display: 'Exo 2' (headings, game titles)
Body: 'Sora' (paragraphs, UI text)
Mono: 'JetBrains Mono' (code, data)
Data: 'Orbitron' (XP counters, scores)
NOTE: These fonts are authoritative. Stage 10 Part 2 root layout must use these — NOT
Fredoka/Nunito Sans from the original build prompt. See BUG-10F.
Terminology
User-facing: "Lab" (not "World")
Database columns: still use "world" for compatibility
API params: still use "world" (e.g., ?world=1)
Hook names: use "Lab" (e.g., useLabContent, useLabProgress)
STAGE 1: PROJECT FOUNDATION
Source Documents:
STAGE1_Foundation_v2_PART1_Feb21_2026.pdf STAGE1_Foundation_v2_PART2_Feb21_2026.pdf Prerequisites: Node.js 20+, Git, VS Code, PowerShell 7+
— Project setup, config files, CSS
— TypeScript source files, stores, hooks
Part 1 (10 Steps) — Config & Structure
Step Action File(s) Created
1 Create Next.js
project npx create-next-app@14 sparkforge
2
Install all
dependencies 40+ npm packages (8 install commands)
3 Configure
TypeScript tsconfig.json
4 Configure Tailwind
CSS
tailwind.config.ts (ENHANCED — unified neon-/spark-
tokens)
5 Configure PostCSS postcss.config.js
6 Configure Next.js next.config.js (ENHANCED — lazy-load 3D, optimize
imports)
7
Environment
variables .env.example
8 Git ignore .gitignore
9 Global styles src/app/globals.css (ENHANCED — 7 new utility
classes)
10
Create folder
structure
30+ directories via New-Item commands
Part 2 (16 Steps) — Source Files
Step Action File(s) Created
11 Utility functions src/lib/utils.ts
12 TypeScript types src/types/index.ts (Lab data, game configs, all
interfaces)
13 Supabase browser
client src/lib/supabase/client.ts
14 Supabase server client src/lib/supabase/server.ts
15 Auth middleware src/middleware.ts
16 Animation library src/lib/animations.ts (ENHANCED — 7 variant sets +
reducedMotion)
17 Zustand stores (5
files)
authStore.ts , childStore.ts , uiStore.ts ,
gameStore.ts , toastStore.ts
18 Root layout src/app/layout.tsx (ENHANCED — accessibility +
toast provider)
19 useMediaQuery hook src/hooks/useMediaQuery.ts (NEW v2)
20 useDebounce hook src/hooks/useDebounce.ts (NEW v2)
21 useSystemPreferences src/hooks/useSystemPreferences.ts (NEW v2)
22 useLocalStorage hook src/hooks/useLocalStorage.ts (NEW v2)
23 Feature flags src/lib/feature-flags.ts (NEW v2)
24
FeatureGate
component src/components/shared/FeatureGate.tsx (NEW v2)
25 Toast store src/stores/toastStore.ts (NEW v2)
26 Toast container src/components/shared/ToastContainer.tsx (NEW
v2)
Validation: npm run dev → localhost:3000 shows Next.js default page → no console errors
Commit: git commit -m "Stage 1 v2: Foundation with enhanced animations,
accessibility, feature flags, toast system"
Files after Stage 1: ~26 files
STAGE 2: DATABASE & API LAYER
Source Documents:
STAGE2_Database_API_v2_PART1_Feb21_2026.pdf — Supabase SQL schema
STAGE2_Database_API_v2_PART2_Feb21_2026.pdf — API routes (auth, children)
STAGE2_Database_API_v2_PART3_Feb21_2026.pdf gamification, stripe, ai, health) + tier config
— API routes (content, progress,
STAGE2_Database_API_v2_PART4_Feb21_2026.pdf placeholder hooks
— QueryProvider, api.ts fetch wrapper,
Prerequisites: Stage 1 complete + Supabase account created
HARD STOP before Part 1
You need a Supabase project. Claude Code must STOP and wait for the human to:
1. Create a Supabase project at https://supabase.com
2. Copy the Project URL and anon key
3. Add them to .env.local
Part 1 — SQL Schema (run in Supabase Dashboard)
Step Action What It Creates
1 Core tables SQL parents , children , progress , game_sessions
2 Content tables SQL content , badges , cosmetics , daily_challenges
3 Gamification tables SQL xp_log, streak_log, badge_awards
4 RLS policies Row Level Security on all tables
5 Indexes Performance indexes on foreign keys
6 Seed data Initial badges, cosmetics, daily challenges
NOTE: Part 1 SQL must be run in the Supabase Dashboard SQL Editor, not in the terminal.
Part 2 — Auth & Children API Routes
Step Action File(s) Created
1 Auth signup src/app/api/auth/signup/route.ts
2 Auth login src/app/api/auth/login/route.ts
3 Auth logout src/app/api/auth/logout/route.ts
4 Auth callback src/app/api/auth/callback/route.ts
5 Auth me src/app/api/auth/me/route.ts
6 Children CRUD src/app/api/children/route.ts
7 Child by ID src/app/api/children/[id]/route.ts
Part 3 — Content, Progress, Gamification, Config
Step Action File(s) Created
1 Content API src/app/api/content/route.ts
2 Progress API src/app/api/progress/route.ts
3
All-labs
progress
src/app/api/progress/all-labs/route.ts (NEW v2 — single
API call)
4 XP endpoint src/app/api/gamification/xp/route.ts
5
Streak
endpoint src/app/api/gamification/streak/route.ts
6 Badges
endpoint src/app/api/gamification/badges/route.ts
7 Stripe
checkout src/app/api/stripe/checkout/route.ts
8 Stripe
webhook src/app/api/stripe/webhook/route.ts
9 Stripe portal src/app/api/stripe/portal/route.ts
10 AI endpoint src/app/api/ai/route.ts
11 Health check src/app/api/health/route.ts (NEW v2)
12 Tier config src/lib/tier-config.ts
13
Gamification
lib src/lib/gamification.ts
Part 4 — Query Provider & Hooks
Step Action File(s) Created
1 Install devtools npm install @tanstack/react-query-devtools
2 QueryProvider src/components/providers/QueryProvider.tsx
3 API fetch wrapper src/lib/api.ts
4
Placeholder
hooks
src/hooks/useApi.ts (WARNING: Stage 4 REPLACES this
file)
5 Verify root layout Confirm QueryProvider wraps app in layout.tsx
6 Build verification npm run build → 0 errors
Validation: npm run build → 0 errors
Commit: git commit -m "Stage 2 v2: Database schema, API routes, tier config,
gamification"
Files after Stage 2: ~45 files
STAGE 3: AUTH & LAYOUT SHELL
Source Documents:
STAGE3_Auth_Layout_Shell_v2_PART1_Feb21_2026.pdf — AuthProvider, auth pages
STAGE3_Auth_Layout_Shell_v2_PART2_Feb21_2026.pdf — Dashboard layout, sidebar
STAGE3_Auth_Layout_Shell_v2_PART3_Feb22_2026.pdf — Onboarding wizard,
placeholder pages, loading screens
Prerequisites: Stages 1-2 complete
Part 1 — Auth System
Step Action File(s) Created
1 AuthProvider src/components/providers/AuthProvider.tsx
2 Auth layout src/app/(auth)/layout.tsx
3 Signup page src/app/(auth)/signup/page.tsx
4 Login page src/app/(auth)/login/page.tsx
5 Reset password src/app/(auth)/reset-password/page.tsx
6 Auth CSS Shared form styles
Part 2 — Dashboard Shell
Step Action File(s) Created
1 Dashboard layout src/app/(dashboard)/layout.tsx
2 Sidebar src/components/layout/Sidebar.tsx
3 Top bar src/components/layout/TopBar.tsx
4 Child selector src/components/layout/ChildSelector.tsx
5 Loading skeleton src/components/shared/LoadingSkeleton.tsx
Part 3 — Onboarding & Placeholders
Step Action File(s) Created
1 Onboarding wizard src/app/(dashboard)/onboarding/page.tsx
2 Home placeholder src/app/(dashboard)/home/page.tsx
3 Labs placeholder src/app/(dashboard)/labs/page.tsx
4 Arcade placeholder src/app/(dashboard)/arcade/page.tsx
5 Profile placeholder src/app/(dashboard)/profile/page.tsx
6 Badges placeholder src/app/(dashboard)/badges/page.tsx
7 Parent placeholder src/app/(dashboard)/parent/page.tsx
8 Loading screens Multiple loading.tsx files
Validation: Signup → Login → Dashboard with sidebar → Child selector works
Commit: git commit -m "Stage 3 v2: Auth flows, dashboard layout, sidebar,
onboarding"
Files after Stage 3: ~58 files
v3 Visual Enhancement Patch (Stage 3)
After completing v2, apply these enhancements:
Landing page: Replace Framer Motion starfield with R3F crystal hero scene + GSAP
scroll-pinned 5-act sequence
Onboarding wizard: Add R3F crystal-forming animation (crystal assembles as steps
complete)
CelebrationOverlay: Replace CSS confetti with R3F particle burst + Bloom
postprocessing
New files created by v3 patch:
File Purpose
src/components/3d/CrystalHero.tsx R3F landing page crystal scene
src/components/3d/OnboardingCrystal.tsx R3F onboarding crystal forming
src/hooks/useGSAPScroll.ts GSAP ScrollTrigger wrapper hook
Modified files: src/app/(marketing)/page.tsx ,
src/app/(dashboard)/onboarding/page.tsx ,
src/components/shared/CelebrationOverlay.tsx
STAGE 4: CORE PAGES
Source Documents:
STAGE4_Core_Pages_v2_PART1_Feb22_2026.pdf stubs)
STAGE4_Core_Pages_v2_PART2_Feb22_2026.pdf STAGE4_Core_Pages_v2_PART3_Feb22_2026.pdf components
Prerequisites: Stages 1-3 complete
— React Query hooks (replace useApi.ts
— Home dashboard, lab map, lab detail
— Content viewer, quiz engine, new
Part 1 — React Query Hooks (REPLACE useApi.ts)
Step Action File(s) Created
1
Create hooks
folder
New-Item for src/hooks subdirs
2 Children hook src/hooks/useChildren.ts
3 Content hook src/hooks/useContent.ts (staleTime 10min/30min)
4 Progress hook src/hooks/useProgress.ts (BUG-3 fix: single API call)
5
Gamification
hook
src/hooks/useGamification.ts (optimistic XP + streak
recovery)
6 DELETE old stubs Remove-Item -Path "src/hooks/useApi.ts"
Part 2 — Dashboard & Lab Pages
Step Action File(s) Created
1
Home
dashboard
src/app/(dashboard)/home/page.tsx (wave, shimmer,
carousel)
2 Lab map src/app/(dashboard)/labs/page.tsx (hex layout, ARIA, blur
entrance)
3 Lab detail src/app/(dashboard)/labs/[labId]/page.tsx (content list,
checkmarks)
4 SparkFactCard src/components/content/SparkFactCard.tsx (NEW v2)
5 QuickPlay src/components/dashboard/QuickPlay.tsx (NEW v2)
6 Loading
screens
labs/loading.tsx , labs/[labId]/loading.tsx
7
Animation
additions Append new variants to src/lib/animations.ts
Part 3 — Content Viewer & Quiz Engine
Step Action File(s) Created
1
Content viewer
page
src/app/(dashboard)/content/[slug]/page.tsx
2 Lesson viewer src/components/content/LessonViewer.tsx
3 Quiz engine src/components/content/QuizEngine.tsx
4 SparkFact viewer src/components/content/SparkFactViewer.tsx
5 Completion
indicator
src/components/content/CompletionIndicator.tsx
(NEW v2)
6
Lab connection
map
src/components/labs/LabConnectionMap.tsx (NEW v2)
Validation: Home dashboard → Lab map → Lab detail → Content → Quiz → XP awarded
Commit: git commit -m "Stage 4 v2: Core pages - hooks, dashboard, lab map,
content viewer, quiz engine"
Files after Stage 4: ~72 files
v3 Visual Enhancement Patch (Stage 4)
Lab Map: Replace 2D hex grid with R3F 3D hex nodes, glowing connections, and
parallax camera
New files: src/components/3d/LabMap3D.tsx
Modified files: src/app/(dashboard)/labs/page.tsx
STAGE 5: GAMIFICATION & PROFILE
Source Documents:
STAGE5_Gamification_Profile_PART1_Feb20_2026.pdf — XP engine, cosmetics, avatar,
sound, daily challenge
STAGE5_Gamification_Profile_PART2_Feb20_2026.pdf trophy room, badge progress
— Profile page, streak flame,
STAGE5_Gamification_Profile_PART3_Feb20_2026.pdf — Avatar builder modal,
cosmetic shop, ceremonies
Prerequisites: Stages 1-4 complete
Key Components:
Streak Flame (7 tiers: spark → candle → campfire → bonfire → inferno → bluecore →
diamond)
Streak Shield (hovering metallic discs, 8-fragment shatter animation)
World Mastery Mini-Map (3-4-3 hex layout with liquid fill and glow crowns)
Daily Spark Card (holographic parallax tilt, countdown timer, flip-to-reward)
Badge Progress Rings (SVG progress, glowing edge, lightning arcs at 80%+)
Trophy Room (glass display cases, levitating badges, rarity-based 3D effects)
Avatar Builder Modal
Cosmetic Shop Modal
Level-Up Ceremony
Welcome Achievement system
Commit: git commit -m "Stage 5 v2: Gamification engine, profile, avatar builder,
trophy room"
v3 Visual Enhancement Patch (Stage 5)
After completing v2, apply these 3D upgrades:
Streak Flame (Diamond tier): R3F shader-based fire effect for 100+ day streaks (lower
tiers keep CSS)
Trophy Room (Legendary/Epic badges): R3F levitating badges with Bloom
postprocessing glow
Daily Spark Card: R3F 3D glass card flip with MeshTransmission material
Badge unlock celebration: R3F particle burst replacing CSS confetti
Level-Up Ceremony: R3F explosion with Bloom replacing basic confetti overlay
New files created by v3 patch:
File Purpose
src/components/3d/StreakFlame3D.tsx Diamond-tier shader fire (R3F)
src/components/3d/BadgeLevitate3D.tsx Legendary/Epic badge R3F levitation
src/components/3d/SparkCard3D.tsx Daily Spark Card 3D glass flip
src/components/3d/LevelUpExplosion.tsx Level-up R3F particle burst with Bloom
Modified files: StreakFlame.tsx (conditional 3D at Diamond tier), TrophyRoom.tsx (R3F for
legendary), DailySparkCard.tsx (3D flip), CelebrationOverlay.tsx (R3F burst),
LevelUpCeremony.tsx (R3F explosion)
STAGE 6: GAME INFRASTRUCTURE + FLAGSHIPS
Source Documents:
STAGE6B_Flagship_PetTrainer.pdf — AI Pet Trainer (Lab 2)
STAGE6C_Flagship_NeuralBuilder.pdf — Neural Network Builder (Lab 3)
STAGE6C_V2_Enhancements.pdf — Neural Builder patches
STAGE6D_Flagship_PromptLab.pdf — Prompt Lab (Lab 4)
STAGE6D_V2_Enhancements.pdf — Prompt Lab patches
STAGE6E_Flagship_AgentArchitect.pdf — Agent Architect (Lab 5)
STAGE6F_Flagship_BiasDetective.pdf — Bias Detective (Lab 6)
Prerequisites: Stages 1-5 complete
IMPORTANT: The GameShell component and gameStore are already created in Stage 1 Part
2 ( src/stores/gameStore.ts ) and defined in the CLAUDE.md game architecture template.
Stage 6 builds ON TOP of that foundation.
Implementation Order
1. Read CLAUDE.md Section 3 (Game Architecture Template) for the GameShell pattern
2. 3. 4. 5. 6. Implement 6B: AI Pet Trainer → validate
Implement 6C: Neural Network Builder + V2 enhancements → validate
Implement 6D: Prompt Lab + V2 enhancements → validate
Implement 6E: Agent Architect → validate
Implement 6F: Bias Detective → validate
5 Flagship Games
Game Lab File Lines
Lab
AI Pet Trainer
2 src/components/games/PetTrainerGame.tsx ~600
Neural Network
Builder
Lab
3 src/components/games/NeuralBuilderGame.tsx ~700
Lab
Prompt Lab
4 src/components/games/PromptLabGame.tsx ~600
Lab
Agent Architect
5 src/components/games/AgentArchitectGame.tsx ~650
Lab
Bias Detective
6 src/components/games/BiasDetectiveGame.tsx ~550
Every flagship MUST include: Chrome bezel, particle background, welcome phase, learn
phase, play phase, complete phase, age-band differentiation, ARIA labels.
v3 Visual Enhancement Patches (Stage 6)
Two flagships receive 3D upgrades beyond what their v2 documents already include:
Stage 6D — Prompt Lab v3 patch:
Add R3F “thought bubble” that reacts to user input (grows, shifts color, morphs by
prompt complexity)
New file: src/components/3d/PromptBubble3D.tsx
Modified file: src/components/games/PromptLabGame.tsx (add dynamic import of 3D
bubble)
Stage 6E — Agent Architect v3 patch:
Add R3F pipeline visualization with floating agent nodes and data-stream particle lines
between them
New file: src/components/3d/AgentPipeline3D.tsx
Modified file: src/components/games/AgentArchitectGame.tsx (add dynamic import of
3D pipeline)
Note: Stage 6B (Pet Trainer) and 6C (Neural Builder) already include R3F scenes
( Pet3DScene.tsx , NeuralNet3D.tsx ) in their v2 documents — no additional v3 patch
needed.
Commit: git commit -m "Stage 6: 5 flagship games — Pet Trainer, Neural Builder,
Prompt Lab, Agent Architect, Bias Detective"
STAGE 7: ALL REMAINING GAMES (26 games)
Source Documents:
7A — Tap & Quiz (8 games)
STAGE7A_Batch_TapQuiz.pdf — AI Spy, Time Machine
STAGE7A_Part2_TokenChopper_AiArt.pdf Detective
STAGE7A_Part3_ToolPicker_DataShield.pdf STAGE7A_Part4_RealOrFake_PredictionMarket.pdf — Word Predictor, Token Chopper, AI Art
— Tool Picker, Data Shield
— Real or Fake, Prediction Market
7B — Drag & Drop (4 games)
STAGE7B_Part1_SortToyBox_HumanVsMachine.pdf STAGE7B_Part2_CodeBlocks_CareerExplorer.pdf Explorer
— Sort Toy Box, Human vs Machine
— Code Blocks (FL-Lite), Career
7C — Simulation & Sandbox (6 games)
STAGE7C_Part1_TreatTrainer_Sentiment.pdf STAGE7C_Part2_Translation_NeuronRelay.pdf STAGE7C_Part3_ChatbotBuilder_DataDetective.pdf Detective (FL-Lite)
— Treat Trainer, Sentiment Scanner
— Lost in Translation, Neuron Relay
— Chatbot Builder (FL-Lite), Data
7D — Advanced Interactive (5 games)
STAGE7D_Part1_PixelInvestigator_FoolTheAI.pdf STAGE7D_Part2_RobotVacuum_CameraQuest.pdf Quest (FL-Lite)
STAGE7D_Part3_FutureForge_Registry.pdf registry
— Pixel Investigator, Fool the AI
— Robot Vacuum (FL-Lite), Camera
— Future Forge (FL-Lite) + 28-game
7E — Ethics & API (3 games)
STAGE7E_Part1_EthicsCourtroom_BuildClassifier.pdf Classifier
STAGE7E_Part2_ApiExplorer_Registry.pdf — Ethics Courtroom, Build a
— API Explorer + updated registry
7F — Band A Expansion (3 games)
STAGE7F_Part1.pdf — Emoji Decoder, My First AI App
STAGE7F_Part2.pdf — AI or Not? + final 31-game registry
V3 Full Treatments (3 upgrades)
STAGE7_ChatbotBuilder_V3_FullTreatment.pdf STAGE7_DataDetective_V3_FullTreatment.pdf STAGE7_CodeBlocks_V3_FullTreatment.pdf — Chatbot Builder deep rewrite
— Data Detective deep rewrite
— Code Blocks deep rewrite
Shared Systems
STAGE7_Shared_XP_Celebration.pdf — XPPopupProvider, GameCompleteCelebration,
StreakFire
Implementation Order
1. Shared systems FIRST (XPPopup, GameComplete, StreakFire)
2. 3. 4. 5. 7A games (8 tap/quiz) → validate
7B games (4 drag/drop) → validate
7C games (6 simulation) → validate
7D games (5 advanced) → validate
6. 7E games (3 ethics/api) → validate
7. 7F games (3 Band A) → validate
8. V3 treatments LAST (replace V2 versions of Chatbot Builder, Data Detective, Code
Blocks)
9. Update game registry with all 31 entries
Every game MUST include: Chrome bezel + LED rim, 12-15 particles (lab-colored),
welcome phase, age-band content, ARIA labels, complete phase triggering
game.completeGame().
Commit per batch: git commit -m "Stage 7A: 8 tap/quiz games" etc.
v3 Visual Enhancement Patch (Stage 7)
After completing all v2 games, apply the shared GPU particle system:
All 31 games: Option to replace CSS-based 12-15 particle floats with R3F shader-based
GPU particles for smoother performance on capable devices, with automatic CSS
fallback for low-end hardware
New file: src/components/3d/GameParticles3D.tsx (shared across all games)
Integration: Each game can optionally import GameParticles3D as a drop-in replacement for
its CSS particle block. Feature-flagged so CSS particles remain the default until GPU mode
is explicitly enabled.
STAGE 8: PARENT DASHBOARD & MONETIZATION
Source Documents:
STAGE8_Parent_Dashboard_v2_PART1_Feb22_2026.pdf setup, parent store
— Tier config extensions, Stripe
STAGE8_Parent_Dashboard_v2_PART2_Feb22_2026.pdf — Parent dashboard, subscription
management, paywall
STAGE8_Parent_Dashboard_v2_PART3_Feb22_2026.pdf CTA, FAQ, validation checklist
— Pricing page, “For Schools”
Prerequisites: Stages 1-7 complete
HARD STOP — Stripe Setup
Claude Code must STOP before implementing Stripe integration. The human needs to:
1. Create Stripe account (test mode)
2. Create products: “Spark Plus” ($7.99/mo) and “Spark Forge” ($14.99/mo)
3. Copy price IDs to .env.local
4. Install Stripe CLI for webhook testing
Key Implementation Notes
BUG-8A FIX: Do NOT create a separate tiers.ts to the existing src/lib/tier-config.ts from Stage 2.
file. APPEND Stage 8 display config
Dual verification for age-gated areas (PIN + parent email)
Paywall behavior: free tier shows Labs 1-3, locked content shows upgrade CTA
Pricing page: monthly/yearly toggle, 3-tier comparison, “For Schools” interest capture
Commit: git commit -m "Stage 8 v2: Parent dashboard, Stripe subscriptions,
pricing page"
v3 Visual Enhancement Patch (Stage 8)
Pricing page: Add GSAP scroll-reveal for tier cards (staggered entrance) + parallax
crystal background element
Modified file: src/app/(public)/pricing/page.tsx (add GSAP scroll animations and
background crystal)
STAGE 9: CONTENT AGENT
Source Documents:
STAGE9_Content_Agent_v2_PART1_Feb23_2026.pdf — AI agent pipeline, prompts, API
routes
STAGE9_Content_Agent_v2_PART2_Feb23_2026.pdf — Admin review dashboard
STAGE9_Content_Agent_v2_PART3_Feb23_2026.pdf quizzes, 60 facts)
— Seed content (150 lessons, 90
Prerequisites: Stages 1-8 complete + Anthropic API key in .env.local
HARD STOP — Anthropic API Key
Claude Code must STOP and wait for the human to add ANTHROPIC_API_KEY to .env.local.
Commit: git commit -m "Stage 9 v2: Content agent pipeline, admin review, seed
content"
STAGE 10: POLISH & DEPLOY
Source Documents:
STAGE10_Polish_Deploy_v2_PART1_Feb23_2026.pdf — Accessibility, SEO, security
headers, CSP, PWA
STAGE10_Polish_Deploy_v2_PART2_Feb23_2026.pdf deployment guide, final validation
— Game router (31 games),
Prerequisites: Stages 1-9 complete
HARD STOP — Vercel Deployment
Claude Code must STOP before deploying. The human needs to:
1. Create Vercel account
2. Connect GitHub repository
3. Configure environment variables in Vercel dashboard
4. Verify Supabase production project is set up
Key Implementation Notes
BUG-10D FIX: CSP connect-src must include Vercel analytics domains
BUG-10F FIX (CRITICAL): Root layout in Part 2 must use Frost-Prismatic fonts (Exo 2,
Sora, JetBrains Mono, Orbitron) — NOT Fredoka/Nunito Sans from the original build
prompt. Update the next/font/google imports and CSS variable names accordingly.
Game router maps all 31 game slugs to their components
Production next.config.js REPLACES the Stage 1 development version
PWA manifest + service worker for installable app
Stage 10 Part 1 creates accessibilityStore.ts (6th Zustand store with persist
middleware)
Commit: git commit -m "Stage 10 v2: Accessibility, SEO, security, PWA,
deployment"
v3 Font Fix (Stage 10 — MUST APPLY)
The root layout ( src/app/layout.tsx ) in Stage 10 Part 2 overwrites Stage 1 font variables
with Fredoka/Nunito Sans. This MUST be corrected to use the Frost-Prismatic font stack:
Replace: Fredoka → Exo_2 (--font-display)
Replace: Nunito_Sans → Sora (--font-body)
Keep: JetBrains_Mono (--font-mono)
Add: Orbitron (--font-data) if not present
This is not optional — it affects the entire application’s visual identity.
COMPLETE FILE COUNT BY STAGE
Stage
v2
Files v3 Additions Cumulative
1 ~26 — ~26
2 ~19 — ~45
3 ~13 +3 (CrystalHero, OnboardingCrystal, useGSAPScroll) ~61
4 ~14 +1 (LabMap3D) ~76
5 ~15 +4 (StreakFlame3D, BadgeLevitate3D, SparkCard3D,
LevelUpExplosion)
~95
6 ~8 +2 (PromptBubble3D, AgentPipeline3D) ~105
7 ~35 +1 (GameParticles3D) ~141
8 ~10 — (modifications only) ~151
9 ~8 — ~159
10 ~8 — (font fix only) ~167
v3 VISUAL ENHANCEMENT SUMMARY
All stages have complete v2 documentation. v3 patches add R3F, GSAP, and Spline 3D
enhancements on top of v2. Apply v3 patches AFTER completing each stage’s v2
implementation.
New 3D Component Files (11 total)
File Stage Purpose
src/components/3d/CrystalHero.tsx 3 v3 Landing page R3F crystal hero
src/components/3d/OnboardingCrystal.tsx 3 v3 Onboarding wizard crystal
forming
src/components/3d/LabMap3D.tsx 4 v3 Lab map 3D hex nodes
src/components/3d/StreakFlame3D.tsx 5 v3 Diamond-tier shader fire
src/components/3d/BadgeLevitate3D.tsx 5 v3 Legendary/Epic badge
levitation
src/components/3d/SparkCard3D.tsx 5 v3 Daily Spark Card 3D flip
src/components/3d/LevelUpExplosion.tsx 5 v3 Level-up R3F particle explosion
src/components/3d/PromptBubble3D.tsx 6D v3 Prompt Lab reactive thought
bubble
src/components/3d/AgentPipeline3D.tsx 6E v3 Agent Architect node pipeline
src/components/3d/GameParticles3D.tsx 7 v3 Shared GPU particle system
src/components/3d/Pet3DScene.tsx
6B
(v2)
Already in v2 — no patch
needed
src/components/3d/NeuralNet3D.tsx
6C
(v2)
Already in v2 — no patch
needed
New Hook
File Stage Purpose
src/hooks/useGSAPScroll.ts 3 v3 GSAP ScrollTrigger wrapper
Critical Fix
Issue Stage Fix
BUG-10F: Font
stack
10 Root layout must use Exo 2/Sora/Orbitron (not
Fredoka/Nunito)
Implementation Rule
Every R3F component MUST:
1. Live in src/components/3d/
2. Be dynamically imported with ssr: false
3. Include a CSS/Framer Motion fallback for non-WebGL browsers
4. Respect the performance budget (< 1MB first load, 60fps desktop, 30fps mobile)
GAME ARCHITECTURE TEMPLATE
Every game component MUST follow this exact structure:
'use client';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { motion, AnimatePresence } from 'framer-motion';
// GameShell wrapper with lab metadata
<GameShell
gameId="game-slug"
title="Game Title"
worldNumber={N}
worldColor="#HEX"
xpReward={25}
totalRounds={N}
>
Required Visual Elements
1. Chrome bezel — 1px border + inset glow + lab-colored LED rim lines (top + bottom)
2. Particle background — 12-15 floating particles, lab-colored, float animation
3. 4. 5. Welcome phase — Title, emoji, description, topic tags, action button
Learn phase — 4 concept cards with age-band differentiated descriptions
Play phase — The core gameplay
6. Complete phase — Triggers game.completeGame()
Required Behaviors
Age-band filtering from childStore ARIA labels on all interactive elements
(Band A: 7-10, Band B: 11-13, Band C: 14-16)
Keyboard navigation support
Score tracking via gameStore
XP award on completion
Particle Background Pattern
const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
id: i,
x: Math.random() * 100,
y: Math.random() * 100,
size: Math.random() * 3 + 2,
delay: Math.random() * 4,
dur: Math.random() * 6 + 4,
})), []);
// In JSX:
{particles.map(p => (
<motion.div key={p.id} className="absolute rounded-full"
style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
background: `radial-gradient(circle, ${LAB_COLOR}25, transparent)` }}
animate={{ y: [0, -30, 0], opacity: [0.15, 0.5, 0.15] }}
transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
))}
KNOWN ISSUES & FIXES
ID Issue Fix
BUG-
1
useApi.ts stubs confuse
Stage 4 hooks
Stage 4 Part 1 REPLACES useApi.ts entirely
BUG-
3
10 parallel progress API
calls
Stage 4 uses single /api/progress/all-labs
endpoint
BUG-
5
Lab map shows wrong
completion Fixed in Stage 4 lab map with proper progress hook
8A BUG-
Duplicate tier config files APPEND to existing tier-config.ts , don’t create
new tiers.ts
BUG-
10D
CSP blocks Vercel
analytics
connect-src includes Vercel domains
IMP-
4
spark-* vs neon-* token
conflict Both defined as aliases in tailwind.config.ts
BUG-
10F
Font stack conflict in
Stage 10 root layout
Replace Fredoka/Nunito Sans with Exo
2/Sora/Orbitron in next/font/google imports
QUICK REFERENCE — ALL 31 GAMES
# Game Lab Type Stage Slug
1 AI Spy 1 Standard 7A ai-spy
2 Time Machine 1 Standard 7A time-machine
3 Human vs Machine 1 Standard 7B human-vs-machine
4 AI Pet Trainer 2 Flagship 6B pet-trainer
5 Sort the Toy Box 2 Standard 7B sort-toy-box
6 Treat Trainer 2 Standard 7C treat-trainer
7 Data Detective 2 FL-Lite/V3 7C data-detective
8 Neural Network Builder 3 Flagship 6C neural-builder
9 Neuron Relay 3 Standard 7C neuron-relay
10 Pixel Investigator 3 Standard 7D pixel-investigator
11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 Prompt Lab Word Predictor Token Chopper AI Art Detective Agent Architect Robot Vacuum Tool Picker Bias Detective Data Shield Real or Fake Camera Quest Fool the AI Ethics Courtroom Sentiment Scanner Lost in Translation Chatbot Builder Emoji Decoder Code Blocks Build a Classifier My First AI App API Explorer Prediction Market Career Explorer Future Forge 4 Flagship 4 Standard 4 Standard 4 Standard 5 Flagship 5 FL-Lite 5 Standard 6 Flagship 6 Standard 6 Standard 7 FL-Lite 7 Standard 7 Standard 8 Standard 8 Standard 8 FL-Lite/V3 8 Enhanced 9 FL-Lite/V3 9 Standard 9 FL-Lite 9 Standard 10 Standard 10 Standard 10 FL-Lite 6D 7A 7A 7A 6E 7D 7A 6F 7A 7A 7D 7D 7E 7C 7C 7C 7F 7B 7E 7F 7E 7A 7B 7D prompt-lab
word-predictor
token-chopper
ai-art-detective
agent-architect
robot-vacuum
tool-picker
bias-detective
data-shield
real-or-fake
camera-quest
fool-the-ai
ethics-courtroom
sentiment-scanner
lost-in-translation
chatbot-builder
emoji-decoder
code-blocks
build-classifier
my-first-ai-app
api-explorer
prediction-market
career-explorer
future-forge
35 AI or Not? 10 Enhanced 7F ai-or-not
This is a living document. Updated February 24, 2026 (v2.0 — Visual Stack v3
Enhancements). GCUD V9 is the canonical source for game content tracking. Stage PDFs
contain all v2 code. v3 visual enhancement patches are documented inline per stage above.