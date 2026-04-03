# SPARKFORGE — 3D Component Registry

**Version:** 3.0 | **Date:** April 3, 2026
**Extracted from:** CLAUDE.md v6.2 Section 9
**Cross-reference:** CLAUDE.md Section 9.1 (desktop-ultra rendering), Section 9.2 (tier definitions), Section 9.3 (Cockpit Suite)
**Last updated:** Full 3D UI Migration (April 3, 2026) — 49 components built/rebuilt across 7 phases. AmbientParticles REMOVED (Decision 20.0). HolographicHUD REPOSITIONED to peripheral frame (Decision 6.0). 13 new 3D panels, 10 game-ui components, 5 UI primitives, 3 infrastructure files, 1 marketing preview added.
**Design authority:** `DESIGN_DECISIONS_LOG.md` (150 decisions), `SparkForge-Full-ControlScreen.json` v1.2, `cockpitDesignTokens.ts`

---

## Overview

All R3F/Three.js components live in `src/components/3d/`. All must use `dynamic(() => import(...), { ssr: false })`. Triangle budgets: Flagship 20M, FL-Lite 10M, Standard 5M (per D3D-3).

---

## System / Dashboard Components

| Component | Stage | Description |
|-----------|-------|-------------|
| StationFrame.tsx | 3 v3 | Dashboard chrome frame |
| HeroAnimation.tsx | 3 v3 | 8-phase 19s cinematic hero sequence (1B+ particles, WebGPU TSL compute, Voronoi shatter → cockpit materialization). Replaces CrystalShatter (archived to `_SUPERSEDED/`). See `Implementation_Plan_Hero_Page_Animation_v2.0.md`. |
| AuroraBackground.tsx | 3 v3 | Dashboard ambient |
| ~~AmbientParticles.tsx~~ | ~~3 v3~~ | **REMOVED (Decision 20.0)** — Ambient particles removed from cockpit entirely |
| GameParticles3D.tsx | 5 v3 | R3F particles (5 flagships) |
| ~~GenericGameParticles.tsx~~ | ~~7 Shared v3~~ | Removed (D3D-1: desktop-only, no CSS fallbacks) |
| ~~LODWrapper.tsx~~ | ~~—~~ | Removed (D3D-2: all geometry at max quality) |
| XPVortex.tsx | 5 v3 | 100-particle instanced spiral for XP celebrations (2.0s auto-unmount) |
| LevelUpExplosion.tsx | 5 v3 | 200-particle instanced cube burst for level-up celebrations |
| BadgePedestal3D.tsx | 5 v3 | 5-tier PBR pedestals (common→legendary) with Float + Sparkles |
| AvatarPreview3D.tsx | 5 v3 | 6-shape 3D avatar with morph animation, idle rotation, letter overlay |
| StreakFlame3D.tsx | 5 v3 | Streak flame billboard (7+ days), scale by tier, 3 intersecting planes |
| CeremonyFXBridge.tsx | 5 v3 | uiStore → CeremonyFX bridge (maps CelebrationType to ceremony effects) |
| BadgePedestalBridge.tsx | 5 v3 | Badge pedestal orchestrator for CockpitCanvas trophy showcase |
| **ParentStatHologram3D.tsx** | **8 v3** | **4 floating holographic stat tiles (XP/Lessons/Time/Streak), animated counters, chrome bezels, ~200K tris** |
| **ParentDashboardBridge.tsx** | **8 v3** | **parentStore → ParentStatHologram3D bridge, mounts on /parent routes** |
| **OnboardingCrystal3D.tsx** | **8 v3** | **Progressive crystal formation (Tetra→Octa→Icosa), orbiting facets, completion particles, ~150K tris** |

---

## Flagship Game Components (10M+ triangles)

| Component | Stage | Description |
|-----------|-------|-------------|
| Pet3DScene.tsx + PetCreature3D.tsx | 6B v3 | Pet Trainer (GLB evolution) |
| NeuralNetwork3D.tsx | 6C v3 | Neural Builder (rotatable) |
| PromptBubble3D.tsx | 6D v3 | Prompt Lab (thought bubble) |
| AgentPipeline3D.tsx | 6E v3 | Agent Architect (pipeline) |
| BiasScales3D.tsx | 6F v3 | Bias Detective (justice scales) |
| SortScene3D.tsx | 7B v3 | Sort Toy Box (3D throwing) |

### Flagship Environment Components (10M+ triangles)

| Component | Stage | Description |
|-----------|-------|-------------|
| FlagshipEnvironmentBase.tsx | 6 v3 | Shared LOD-aware foundation: 512-seg terrain, sky dome, fog particles, lighting rig, instanced scatter |
| PetTrainerEnvironment.tsx | 6B v3 | Enchanted pet habitat: training arena, obstacle course, playground, enchanted forest, creek, fireflies, garden beds, lantern posts, butterflies (~3.96M tris) |
| NeuralBuilderEnvironment.tsx | 6C v3 | Quantum data center: server racks, quantum core processor, data pipelines, monitor array, matrix rain, robotic arms, security grid (~3.68M tris) |
| PromptLabEnvironment.tsx | 6D v3 | Enchanted AI workshop: library tower, floating books, word cloud, typewriter, ink rivers, AI brain, inspiration crystals, dictionary columns (~3.39M tris) |
| AgentArchitectEnvironment.tsx | 6E v3 | Mission control center: server corridor, mission control wall, drone fleet, blueprint table, assembly line, communication array, cargo containers (~3.27M tris) |
| BiasDetectiveEnvironment.tsx | 6F v3 | Grand justice courtroom: marble pillars, chandelier, witness stand, jury box, evidence wall, scales of justice, courthouse arches (~3.44M tris) |

---

## FL-Lite Game Components (10M triangles)

| Component | Stage | Description |
|-----------|-------|-------------|
| CodeBlocks3D.tsx | 7B v3 | Code Blocks (block assembly) |
| ChatbotNodes3D.tsx | 7C v3 | Chatbot Builder (conversation) |
| DataDetective3D.tsx | 7C v3 | Data Detective (magnifying glass) |
| RobotVacuum3D.tsx | 7D v3 | Robot Vacuum (isometric) |
| CameraQuest3D.tsx | 7D v3 | Camera Quest (polaroid) |
| FutureForge3D.tsx | 7D v3 | Future Forge (blueprint) |
| MyFirstAiApp3D.tsx | 7F v3 | My First AI App (mockup) |
| EmojiDecoder3D.tsx | 7F v3 | Emoji Decoder game 3D component: translation machine, emoji display, decoded output |
| AiOrNot3D.tsx | 7F v3 | AI or Not? game 3D component: display pedestal, voting buttons, verdict ring, score display |

### FL-Lite Environment Components (10M triangles)

| Component | Stage | Description |
|-----------|-------|-------------|
| FLLiteEnvironmentBase.tsx | 7 v3 | Shared FL-Lite foundation: 256-seg terrain, sky dome, fog particles, lighting rig |
| DataDetectiveEnvironment.tsx | 7C v3 | Investigation laboratory: desks, evidence boards, filing cabinets, magnifying hologram, data streams (~1.3M tris) |
| RobotVacuumEnvironment.tsx | 7D v3 | Smart home interior: furniture, IoT sensors, control panels, charging dock, floor plan overlay (~1.2M tris) |
| CameraQuestEnvironment.tsx | 7D v3 | Photography studio: lighting rigs, camera stations, photo gallery wall, film strips, neural net viz (~1.3M tris) |
| ChatbotBuilderEnvironment.tsx | 7C v3 | Communication hub: chat bubbles, server towers, antenna array, message streams, consoles (~1.2M tris) |
| EmojiDecoderEnvironment.tsx | 7F v3 | Translation workshop: emoji sculptures, translation machine, rosetta pillars, cultural displays (~1.3M tris) |
| CodeBlocksEnvironment.tsx | 7B v3 | Code laboratory: terminal screens, circuit board floor, LED strips, binary rain, robot assistants (~1.4M tris) |
| MyFirstAiAppEnvironment.tsx | 7F v3 | App dev studio: device mockups, component shelves, wireframe displays, launch pad (~1.2M tris) |
| FutureForgeEnvironment.tsx | 7D v3 | Future city: skyline towers, holographic billboards, flying vehicles, innovation dome (~1.4M tris) |
| AiOrNotEnvironment.tsx | 7F v3 | AI art gallery: exhibition pedestals, picture frames, voting booths, spotlight rigs (~1.3M tris) |

---

## Standard Game Environment Components (5M triangles)

| Component | Stage | Description |
|-----------|-------|-------------|
| StandardEnvironmentBase.tsx | 7 Standard | Shared LOD-aware foundation: 128-seg terrain, sky dome, fog particles, lighting rig |
| AiSpyEnvironment.tsx | 7A | Futuristic detective office: holographic screens, magnifier, evidence pinboard, scanner beam (~5M tris) |
| TimeMachineEnvironment.tsx | 7A | Time vortex portal chamber: spinning rings, timeline helix, era panels, clock mechanisms (~5M tris) |
| HumanVsMachineEnvironment.tsx | 7B | Split arena: human workshop vs machine factory, judge podium, comparison cards (~5M tris) |
| TreatTrainerEnvironment.tsx | 7C | AI training playground: obstacle course, treat dispensers, reward stations, behavior scoreboard (~5M tris) |
| NeuronRelayEnvironment.tsx | 7C | Neural relay station: giant neuron models, axon pathways, synapse junctions, signal pulses (~5M tris) |
| PixelInvestigatorEnvironment.tsx | 7D | Digital forensics lab: pixel grid table, magnification station, RGB analyzer, binary waterfall (~5M tris) |
| WordPredictorEnvironment.tsx | 7A | Language prediction library: word bubbles, probability tree, autocomplete screens, dictionary towers (~5M tris) |
| TokenChopperEnvironment.tsx | 7A | Tokenization factory: conveyor belts, chopper mechanism, token bins, BPE visualizer (~5M tris) |
| AiArtDetectiveEnvironment.tsx | 7A | Art analysis museum: floating artworks, style panels, technique analyzer, palette station (~5M tris) |
| ToolPickerEnvironment.tsx | 7A | AI tool workshop: labeled racks, task board, comparison table, effectiveness gauges (~5M tris) |
| DataShieldEnvironment.tsx | 7A | Cybersecurity command center: shield generator, data tunnels, firewall walls, privacy vault (~5M tris) |
| RealOrFakeEnvironment.tsx | 7A | Media verification studio: dual screens, fact-checker, deepfake chamber, truth meter (~5M tris) |
| EthicsCourtroomEnvironment.tsx | 7E | AI ethics courtroom: judge bench, witness stand, jury box, scales of justice, gavel (~5M tris) |
| FoolTheAiEnvironment.tsx | 7D | Adversarial testing lab: AI brain dome, disguise station, perturbation generator, defense shield (~5M tris) |
| BuildClassifierEnvironment.tsx | 7E | Classification yard: sorting conveyors, category bins, decision tree, accuracy dashboard (~5M tris) |
| PredictionMarketEnvironment.tsx | 7A | Prediction trading floor: ticker displays, wager console, probability charts, crystal ball (~5M tris) |
| SentimentScannerEnvironment.tsx | 7C | Emotion analysis lab: mood meter, sentiment oscilloscope, emoji bubbles, polarity dashboard (~5M tris) |
| LostInTranslationEnvironment.tsx | 7C | Universal translation hub: Babel tower, translation bridge, language globe, dictionary ceiling (~5M tris) |
| CareerExplorerEnvironment.tsx | 7B | AI career expo: exhibition booths, holographic previews, skill tree, career flowchart (~5M tris) |
| ApiExplorerEnvironment.tsx | 7E | API command center: gateway hub, pipeline tubes, endpoint tower, auth station, webhook array (~5M tris) |

---

## Cockpit / Enhancement Components

| Component | Stage | Description |
|-----------|-------|-------------|
| SpatialDashboard.tsx | Enh 1.1 | Thin wrapper → CockpitCanvas with showSpatialDashboard prop |
| CinematicCamera.tsx | Enh 1.1 | Legacy — merged into CameraSystem.tsx |
| CameraSystem.tsx | 20M | Unified camera: hero/station/spatial/game modes with spring interpolation |
| HolographicLabMap.tsx | 20M | Multi-layer geodesic core + data highways + projector pedestal (~1M tris) |
| LabStructure3D.tsx | 20M | 10 high-detail lab models with interiors (~300K tris each, 3M total) |
| InteractiveConsole3D.tsx | 20M | 4 full-housing consoles with projector bases (~500K each, 2M total) |
| AmbientNPCs.tsx | 20M | 8 articulated bots with facial anim + finger grippers (~187K each, 1.5M total) |
| DynamicEnvironment.tsx | 20M | Volumetric particles + fog layers + weather effects (~3M tris) |
| SpatialOverlay.tsx | Enh 1.1 | Glassmorphic HTML overlay — lab info, nav hints, console indicators |
| CockpitCanvas.tsx | 20M | Single persistent R3F Canvas (CPA2-1), hero+cockpit+spatial groups |
| CockpitPanels.tsx | 20M | 256-seg curved hull, multi-layer, instanced rivets (~2M tris) |
| SidePanels.tsx | 20M | Left radar dish + right terminal with data columns (~1.5M tris) |
| HolographicHUD.tsx | 20M | **REPOSITIONED (Decision 6.0):** peripheral viewport frame — 4 arc segments, corner data readouts (time/XP/mode/child), breathing pulse 4s cycle (~1M tris) |
| StatusBar3D.tsx | 20M | Arc bar XP (no needle), pulse ring streak (no flame), 10 mini arc lab indicators, chrome pillar dividers (~1M tris) |
| LEDRim.tsx | 20M | 1500 rectangular LED blocks, center-outward burst, sequential color fill, emissive 2.5x, pure mood lighting (~500K tris) |
| AuroraBackground.tsx | 20M | 3 mode-tinted ribbons at different depths, gentle flow 0.6 speed (~50K tris) |
| ~~AmbientParticles.tsx~~ | ~~20M~~ | **REMOVED (Decision 20.0)** |
| CockpitSkinManager.tsx | 20M | 5 skin soundscapes, increased particle counts |
| CockpitStructuralDetail.tsx | 20M | Cable bundles, conduits, vents, ribs, LEDs (~1.5M tris) |
| VolumetricFog3D.tsx | 20M | Fog volumes, god ray cones, density layers (~500K tris) |
| CockpitFloor3D.tsx | 20M | Grated floor, sub-floor piping, energy conduits (~1M tris) |
| CeremonyFX.tsx | 20M | Confetti, fireworks, trophies, HUD ring expansion (~500K tris) |
| WormholeTransition.tsx | 20M | Lab entrance tunnel, speed lines, portal rings (~300K tris) |
| MiniMapOverlay3D.tsx | 20M | Persistent 3D minimap of lab ring (~250K tris) |

---

## 3D UI Components (UI Migration — April 3, 2026)

Located in `src/components/3d/ui/`. All consume `cockpitDesignTokens.ts`. 150 design decisions locked.

| Component | Description |
|-----------|-------------|
| HolographicButton.tsx | Chamfered rectangle (ExtrudeGeometry), dual-layer surface, 3 sizes (sm/md/lg), inset backlit text |
| NavigationButtonGrid.tsx | Pentagon cluster layout (5 buttons: HOME/LABS/ARCADE/SETTINGS/PROFILE), beveled square buttons, console plate |
| RadialDial3D.tsx | Knurled cylinder, 24 LED ring, illuminated tick dots, glass cover for read-only gauges |
| ToggleSwitch3D.tsx | Paddle switch, LED strip indicator, hard snap (SPRING_PRESETS.snap), grouped panel mounting |
| VariableDialCluster.tsx | 3 dials in individual pods, arc row arrangement, instant label swap on page switch |
| HolographicCard.tsx | 45° chamfered rectangle, layered surface (carbon base + accent top strip), edge trace + lift hover |
| HolographicPanel.tsx | Raised platform (1 depth layer above), chrome divider bar headers, density token spacing |
| CenterViewportScreen.tsx | Cylindrical concave surface, segmented chrome bezel, CRT scan lines, wipe sweep transition |
| CockpitText.tsx | 3D text primitive using troika-three-text, design token typography levels |
| CockpitContainer.tsx | 3D container primitive with chrome borders and depth layers |
| CockpitScrollPanel.tsx | Paginated 3D scroll panel (no scroll — paginate per Decision B.3) |
| CockpitInput.tsx | 3D text input with hidden HTML proxy (P3-2), caret animation, border glow |
| CockpitTooltip.tsx | Floating 3D tooltip with chrome edge, auto-positioning |
| index.ts | Barrel export for all UI components |

---

## 3D Panel Components (UI Migration — April 3, 2026)

Located in `src/components/3d/panels/`. Dashboard pages converted to 3D panel architecture.

### Dashboard Panels (Phase 2)

| Component | Description |
|-----------|-------------|
| DashboardLeft.tsx | Player identity hub: hexagonal avatar frame, 4 vertical gauge stack, 5 recent badges |
| DashboardRight.tsx | Control & monitoring: mini card activity log, 4 horizontal quick action buttons, collapsed settings |
| DashboardCenter.tsx | Floating welcome text above lab map, "Continue Learning" CTA at bottom, no center stats (Decision 24.2) |
| LabsCenter.tsx | Floating info card on hover, double-click + explicit "Enter Lab" button (Decision 25.2) |
| ArcadePanel.tsx | Curved grid tiles (12/page), lab filter in HUD frame, inline SearchField3D |
| ProfileCenter.tsx | 3×3 badge pedestal grid, 1.5x enlarged avatar |
| SettingsPanel.tsx | Column layout (audio left, visual right), skin selector preview cards |
| ParentPanel.tsx | Child profile HolographicCards, side panel action buttons |
| LabDetailPanel.tsx | Radial game fan, full 3D lab structure diorama |

### Auth Panels (Phase 3)

| Component | Description |
|-----------|-------------|
| LoginPanel3D.tsx | 3D login form with hidden HTML input proxies, demo login flow |
| SignupPanel3D.tsx | 4-step wizard (Account→Verify→Consent→Profile), age slider, COPPA |
| ResetPasswordPanel3D.tsx | 2-state email/confirmation panel |
| ChatPanel3D.tsx | AI Guide chat, message bubbles, paginated history, streaming |

### Gamification (Phase 4)

| Component | Description |
|-----------|-------------|
| CelebrationPanel3D.tsx | Badge/level/streak/lab celebration display, center panel |
| XPPopup3D.tsx | Floating 3D "+X XP" with spring rise, combo multiplier, bloom light |

---

## 3D Game UI Components (UI Migration — Phases 5-6)

Located in `src/components/3d/game-ui/`. Auto-registered via GameShell (P5-1).

| Component | Description |
|-----------|-------------|
| GameHUD3D.tsx | Score arc, round counter, hint pips, timer, chrome bar — auto-registered via GameShell |
| GameTimerBar3D.tsx | Countdown/elapsed bar with urgent pulse |
| GamePhaseOverlay3D.tsx | Welcome panel + complete panel (tier badge: gold/silver/bronze, score, XP) |
| ChoiceButton3D.tsx | 4 feedback states: none, correct (#00FF88), incorrect (#FF6644), selected (#00BBFF) |
| QuizGameTemplate.tsx | Template for ~12 quiz-style games (AI Spy, Word Predictor, etc.) |
| BuilderGameTemplate.tsx | Template for ~7 builder-style games (Code Blocks, Token Chopper, etc.) |
| ExplorerGameTemplate.tsx | Template for ~6 explorer-style games (Data Detective, Camera Quest, etc.) |
| LabGameTemplate.tsx | Template for ~6 lab-style games (Sentiment Scanner, Robot Vacuum, etc.) |
| GameLearnCards3D.tsx | Paginated single-card carousel with progress dots, shared across all templates |
| index.ts | Barrel export for all game UI components |

---

## 3D Infrastructure (UI Migration — Phase 1)

| Component | Location | Description |
|-----------|----------|-------------|
| CockpitUILayer.tsx | `src/components/3d/` | Master quadrant orchestrator (left/center/right/bottom), lazy-loads 11 panel types |
| cockpitModePresets.ts | `src/lib/3d/` | 8 cockpit modes × 14 atmosphere properties (dashboard, labs, lab-detail, game, profile, settings, celebration, parent) |
| cockpitDesignTokens.ts | `src/lib/3d/` | TypeScript design tokens — 131 decisions encoded (typography, edges, depth, springs, emissive, states, etc.) |
| cockpitUIStore.ts | `src/stores/` | Center content routing for 3D panel architecture (9 route types) |
| useCockpitScene.ts | `src/hooks/` | Hook that pages call to set cockpit mode |
| useCelebration3D.ts | `src/hooks/` | Celebration orchestration: mode switch → CeremonyFX → XP popup → panel → auto-dismiss |

---

## 3D Marketing (UI Migration — Phase 7)

| Component | Description |
|-----------|-------------|
| CockpitPreview3D.tsx | Mini cockpit teaser (~50K tris): hull section, LED rim, HUD arcs, lab nodes. Used on landing page. |

---

## Hero Animation Components

| Component | Stage | Description |
|-----------|-------|-------------|
| useHeroAnimation.ts | Hero v2 | Animation lifecycle hook — skip logic, fast-forward, phase callbacks |
| heroParticleCompute.ts | Hero v2 | TSL compute kernel for 1B+ particle throughput (lib/3d/) |
| voronoiFracture.ts | Hero v2 | CPU-side Voronoi tessellation for Phase 5 shatter (lib/3d/) |
| heroSplines.ts | Hero v2 | Spline path definitions for Phase 6 shard→cockpit migration (lib/3d/) |
| heroAudio.ts | Hero v2 | Tone.js audio timeline for all 8 phases (lib/audio/) |

---

## Component Count Summary

| Category | Count | Notes |
|----------|-------|-------|
| System / Dashboard | 14 | StationFrame, HeroAnimation, AuroraBackground, GameParticles3D, XPVortex, LevelUpExplosion, BadgePedestal3D, AvatarPreview3D, StreakFlame3D, CeremonyFXBridge, BadgePedestalBridge, ParentStatHologram3D, ParentDashboardBridge, OnboardingCrystal3D |
| Flagship (games + environments) | 12 | 6 game components + 6 environment components |
| FL-Lite (games + environments) | 19 | 9 game components + 10 environment components |
| Standard (environments) | 21 | StandardEnvironmentBase + 20 game-specific environments |
| Cockpit / Enhancement | 22 | CockpitCanvas through MiniMapOverlay3D (AmbientParticles removed) |
| 3D UI Components | 14 | 8 interactive + 5 primitives + index (in `ui/`) |
| 3D Panels (Dashboard) | 9 | DashboardLeft/Right/Center, LabsCenter, ArcadePanel, ProfileCenter, SettingsPanel, ParentPanel, LabDetailPanel |
| 3D Panels (Auth) | 4 | LoginPanel3D, SignupPanel3D, ResetPasswordPanel3D, ChatPanel3D |
| 3D Gamification | 2 | XPPopup3D, CelebrationPanel3D |
| 3D Game UI | 10 | GameHUD3D, GameTimerBar3D, GamePhaseOverlay3D, ChoiceButton3D, 4 templates, GameLearnCards3D, index |
| 3D Marketing | 1 | CockpitPreview3D |
| 3D Infrastructure | 6 | CockpitUILayer, cockpitModePresets, cockpitDesignTokens, cockpitUIStore, useCockpitScene, useCelebration3D |
| Hero Animation | 5 | useHeroAnimation, heroParticleCompute, voronoiFracture, heroSplines, heroAudio |
| Procedural Environment | 7 | ProceduralEnvironmentGenerator + 5 sub-components + index |
| Creatures | 7 | CreatureBase + 5 creature types + index |
| **Total unique files** | **~172** | Across `src/components/3d/` + supporting stores/hooks/lib |

> **Note:** AuroraBackground.tsx appears in both System/Dashboard and Cockpit/Enhancement sections (dual role). AmbientParticles, GenericGameParticles, and LODWrapper have been removed per D3D decisions.

---

*End of 3D Component Registry v3.0 | Extracted from CLAUDE.md v6.2 | Updated April 3, 2026 — Full 3D UI Migration (49 components built/rebuilt, 150 design decisions)*
