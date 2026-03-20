# SPARKFORGE — 3D Component Registry

**Version:** 2.0 | **Date:** March 20, 2026
**Extracted from:** CLAUDE.md v5.6 Section 9
**Cross-reference:** CLAUDE.md Section 9.1 (LOD rules), Section 9.2 (tier definitions), Section 9.3 (Cockpit Suite)

---

## Overview

All R3F/Three.js components live in `src/components/3d/`. All must use `dynamic(() => import(...), { ssr: false })`. Triangle budgets: Flagship 10M+, FL-Lite 2M+, Standard 500K+.

---

## System / Dashboard Components

| Component | Stage | Description |
|-----------|-------|-------------|
| StationFrame.tsx | 3 v3 | Dashboard chrome frame |
| HeroAnimation.tsx | 3 v3 | 8-phase 19s cinematic hero sequence (1B+ particles, WebGPU TSL compute, Voronoi shatter → cockpit materialization). Replaces CrystalShatter (archived to `_SUPERSEDED/`). See `Implementation_Plan_Hero_Page_Animation_v2.0.md`. |
| AuroraBackground.tsx | 3 v3 | Dashboard ambient |
| AmbientParticles.tsx | 3 v3 | Dashboard floating particles |
| GameParticles3D.tsx | 5 v3 | R3F particles (5 flagships) |
| GenericGameParticles.tsx | 7 Shared v3 | CSS particles (23 standard) |
| LODWrapper.tsx | — | Mandatory LOD container for all 3D scenes |

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

## FL-Lite Game Components (2M+ triangles)

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

### FL-Lite Environment Components (2M+ triangles)

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

## Standard Game Environment Components (500K+ triangles)

| Component | Stage | Description |
|-----------|-------|-------------|
| StandardEnvironmentBase.tsx | 7 Standard | Shared LOD-aware foundation: 128-seg terrain, sky dome, fog particles, lighting rig |
| AiSpyEnvironment.tsx | 7A | Futuristic detective office: holographic screens, magnifier, evidence pinboard, scanner beam (~500K tris) |
| TimeMachineEnvironment.tsx | 7A | Time vortex portal chamber: spinning rings, timeline helix, era panels, clock mechanisms (~500K tris) |
| HumanVsMachineEnvironment.tsx | 7B | Split arena: human workshop vs machine factory, judge podium, comparison cards (~500K tris) |
| TreatTrainerEnvironment.tsx | 7C | AI training playground: obstacle course, treat dispensers, reward stations, behavior scoreboard (~500K tris) |
| NeuronRelayEnvironment.tsx | 7C | Neural relay station: giant neuron models, axon pathways, synapse junctions, signal pulses (~500K tris) |
| PixelInvestigatorEnvironment.tsx | 7D | Digital forensics lab: pixel grid table, magnification station, RGB analyzer, binary waterfall (~500K tris) |
| WordPredictorEnvironment.tsx | 7A | Language prediction library: word bubbles, probability tree, autocomplete screens, dictionary towers (~500K tris) |
| TokenChopperEnvironment.tsx | 7A | Tokenization factory: conveyor belts, chopper mechanism, token bins, BPE visualizer (~500K tris) |
| AiArtDetectiveEnvironment.tsx | 7A | Art analysis museum: floating artworks, style panels, technique analyzer, palette station (~500K tris) |
| ToolPickerEnvironment.tsx | 7A | AI tool workshop: labeled racks, task board, comparison table, effectiveness gauges (~500K tris) |
| DataShieldEnvironment.tsx | 7A | Cybersecurity command center: shield generator, data tunnels, firewall walls, privacy vault (~500K tris) |
| RealOrFakeEnvironment.tsx | 7A | Media verification studio: dual screens, fact-checker, deepfake chamber, truth meter (~500K tris) |
| EthicsCourtroomEnvironment.tsx | 7E | AI ethics courtroom: judge bench, witness stand, jury box, scales of justice, gavel (~500K tris) |
| FoolTheAiEnvironment.tsx | 7D | Adversarial testing lab: AI brain dome, disguise station, perturbation generator, defense shield (~500K tris) |
| BuildClassifierEnvironment.tsx | 7E | Classification yard: sorting conveyors, category bins, decision tree, accuracy dashboard (~500K tris) |
| PredictionMarketEnvironment.tsx | 7A | Prediction trading floor: ticker displays, wager console, probability charts, crystal ball (~500K tris) |
| SentimentScannerEnvironment.tsx | 7C | Emotion analysis lab: mood meter, sentiment oscilloscope, emoji bubbles, polarity dashboard (~500K tris) |
| LostInTranslationEnvironment.tsx | 7C | Universal translation hub: Babel tower, translation bridge, language globe, dictionary ceiling (~500K tris) |
| CareerExplorerEnvironment.tsx | 7B | AI career expo: exhibition booths, holographic previews, skill tree, career flowchart (~500K tris) |
| ApiExplorerEnvironment.tsx | 7E | API command center: gateway hub, pipeline tubes, endpoint tower, auth station, webhook array (~500K tris) |

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
| HolographicHUD.tsx | 20M | 8 concentric rings, scan beams, reticle system (~500K tris) |
| StatusBar3D.tsx | 20M | 3D console strip, XP speedometer, flame sculpture (~500K tris) |
| LEDRim.tsx | 20M | 1000+ instanced LED capsules, data viz mode (~200K tris) |
| AuroraBackground.tsx | 20M | 6 layered shader planes + 3 volumetric ribbons (~50K tris) |
| AmbientParticles.tsx | 20M | Instanced icosahedron particles + trails + halos (~200K tris) |
| CockpitSkinManager.tsx | 20M | 5 skin soundscapes, increased particle counts |
| CockpitStructuralDetail.tsx | 20M | Cable bundles, conduits, vents, ribs, LEDs (~1.5M tris) |
| VolumetricFog3D.tsx | 20M | Fog volumes, god ray cones, density layers (~500K tris) |
| CockpitFloor3D.tsx | 20M | Grated floor, sub-floor piping, energy conduits (~500K tris) |
| CeremonyFX.tsx | 20M | Confetti, fireworks, trophies, HUD ring expansion (~500K tris) |
| WormholeTransition.tsx | 20M | Lab entrance tunnel, speed lines, portal rings (~300K tris) |
| MiniMapOverlay3D.tsx | 20M | Persistent 3D minimap of lab ring (~250K tris) |

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

| Category | Count |
|----------|-------|
| System / Dashboard | 7 |
| Flagship (games + environments) | 12 |
| FL-Lite (games + environments) | 19 |
| Standard (environments) | 21 |
| Cockpit / Enhancement | 14 |
| Hero Animation | 5 |
| **Total** | **78** |

---

*End of 3D Component Registry v1.0 | Extracted from CLAUDE.md v5.6 | March 19, 2026*
