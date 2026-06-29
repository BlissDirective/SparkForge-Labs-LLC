# SparkForge AI Guide Avatar — Enhancement Concept Plan

## Context

SparkForge is a gamified AI learning platform for children ages 7-16 with a dark-mode "Frost-Prismatic" aesthetic and a 3D Laboratory Control Station / Panoramic Cockpit architecture. This enhancement introduces **"Spark"** — a persistent, Claude API-powered AI Guide Avatar that lives throughout the entire platform as a teacher, positive reinforcement figure, and creative collaborator. The guide is visible and interactive across all areas: the 3D panoramic cockpit home screen, individual lab environments, and game spaces. It includes full voice capabilities (speech-to-text input + text-to-speech output).

**Triangle Budget:** 200,000 – 400,000 per avatar (standardized range across all 5 concepts). Well within existing cockpit budget headroom of ~104K used out of 5M tablet / 10M desktop.

---

## Five Avatar Concepts

### Concept A: "Orb Sentinel" — Holographic Energy Sphere

**Visual:** A luminous energy orb (~0.8 scene units) with a multi-layered internal structure visible through a semi-transparent outer shell. The outer shell is a high-polygon sphere with real-time TSL Fresnel glow shader producing dynamic iridescent refraction in the active lab's accent color — surface detail includes etched circuit-trace patterns that glow faintly, visible seam lines where shell "plates" meet (suggesting it could open), and micro-scratches that catch light for realism. Inside, a dense crystalline lattice of interlocking icosahedral frames rotates on three independent axes, each layer at a different speed. At the absolute center, a bright energy core (nested emissive spheres with volumetric god-ray spokes) pulses with a heartbeat rhythm. Four orbital rings (two major torus rings at opposing inclinations, two minor accent rings perpendicular) orbit the sphere with independent rotation speeds — accelerating during conversation, drifting to gentle precession when idle. A holographic "face" projects onto the front hemisphere via an emissive morph-target system: two expressive eye shapes (happy arcs, curious circles, thinking dots, surprised wide) and a subtle mouth curve, all rendered as glowing projected geometry rather than flat textures. Below, a hovering platform disc with concentric energy rings radiates lab-colored light downward. A persistent particle corona (200-300 instanced particles) orbits the shell in a toroidal field, intensifying with emotional state. The entire assembly casts soft caustic light patterns onto nearby surfaces via a projected caustic texture plane.

**Audio-Reactive:** Energy core pulse rate and god-ray intensity sync directly with speech amplitude. Crystalline lattice layers oscillate with waveform displacement — inner layer responds to bass, outer to treble. Orbital rings accelerate proportionally with speaking speed. Particle corona density doubles during speech, with particles aligning into wave patterns that follow audio frequency. Shell circuit-trace etch lines pulse brighter on each spoken word boundary. Face eye-shapes squint slightly on emphasis, widen on questions.

**Personality:** Wise, calm, encouraging. "Interesting thought!" / "Let me show you something cool." The orb form is pedagogically honest — it looks like AI, not pretending to be human, which aligns with the platform's mission of teaching AI concepts.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Outer sphere shell (128-seg, etched detail) | ~65,000 | ~8,000 |
| Inner crystalline lattice (3 icosahedral layers) | ~36,000 | ~6,000 |
| Energy core (nested spheres + god-ray spokes) | ~18,000 | ~3,000 |
| Orbital ring A (128-seg major torus) | ~16,000 | ~2,000 |
| Orbital ring B (128-seg major torus) | ~16,000 | ~2,000 |
| Orbital rings C+D (64-seg minor tori) | ~12,000 | ~2,000 |
| Face projection (morph-target eye/mouth geo) | ~8,000 | ~2,000 |
| Particle corona (300 instanced quads) | ~40,000 | ~5,000 |
| Hovering platform disc (concentric rings) | ~12,000 | ~2,000 |
| Caustic projection plane | ~4,000 | 0 (hidden) |
| Shell circuit-trace etch overlay | ~24,000 | ~4,000 |
| Shell plate seam geometry | ~8,000 | ~2,000 |
| Volumetric glow planes (inner atmosphere) | ~6,000 | ~1,000 |
| **Total** | **~265,000** | **~39,000** |

**Mobile CSS Fallback:** Circular `<div>` with `backdrop-filter: blur(16px)`, `border: 2px solid var(--lab-color)`, multi-layered animated `box-shadow` glow pulse (inner + outer rings). Two CSS dots for eyes with morph animation between emotional states. Concentric ring animation via `@keyframes orbit`. Particle corona simulated with 12-16 CSS `<div>` particles on `@keyframes toroidal-orbit`. `@keyframes float` for gentle vertical bob.

---

### Concept B: "Prism Fox" — Geometric Animal Companion

**Visual:** A medium-poly crystalline fox creature (~40cm tall when sitting) built from hundreds of sharp geometric facets with visible edge highlights, giving a high-fidelity crystalline/origami appearance with far more surface detail than a simple low-poly model. Body color is dark chrome (`#1A1822`) with bright neon edge-lines in the active lab color rendered via a dedicated wireframe overlay mesh. The body surface features subtle etched circuit patterns (similar to Frost-Prismatic chrome bezel detailing) that glow faintly, and individual facets have slightly varied normals creating a gem-like light-catching effect. Ears are multi-layered translucent prisms (3 nested layers per ear) with independent inner glow and subtle prismatic rainbow refraction at edges. The tail is a 16-segment articulated chain of decreasing prisms, each segment with independent Perlin-noise sway, trailing 50-80 instanced micro-particles in the lab color that fade over distance. Eyes are expressive emissive LED circles with morph-target iris shapes (happy crescents, curious wide circles, thinking half-lidded, surprised full-open) and a faint projected glow cone in front of each eye. A visible chest core (similar to Spark's energy core concept) pulses behind a transparent chest plate, casting lab-colored light through the faceted body panels. Four articulated legs with two joints each (hip + knee) enable idle animations: weight-shifting, paw-flexing, standing/sitting transitions. The hover platform beneath has lab-colored energy runes etched into its surface and emits a soft downdraft particle effect (falling sparkles). When idle, the fox shifts weight between paws, flicks its tail, perks/rotates ears independently, and occasionally tilts its head with a curious ear-cock. A faint prismatic aura (instanced billboard sprites) surrounds the fox, intensifying with mood.

**Audio-Reactive:** Jaw articulates with full bone-driven animation (open/close + slight lateral shift for emphasis). Ear prisms pulse brighter and rotate toward the "sound source" (camera direction) during speech. Chest core pulse rate syncs with speech amplitude. Tail sway amplitude increases during animated speech, with tail-tip particles accelerating. Edge-line wireframe overlay brightness pulses on word boundaries. Prismatic aura sprites multiply and intensify during excited speech. Individual body facets shimmer (randomized emissive flicker) in sync with audio frequency bands.

**Personality:** Playful, curious, adventurous. "Ooh, what if we tried THIS?" / "Follow me — I found something!" Appeals strongly to younger age bands (7-10) while remaining engaging for older users through witty observations. The fox metaphor (clever, adaptive) maps well to AI concepts.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Fox body (medium-poly faceted, 200+ faces) | ~48,000 | ~6,000 |
| Head with bone-driven jaw + muzzle | ~28,000 | ~4,000 |
| Ears (2x 3-layer translucent prisms) | ~12,000 | ~2,000 |
| Tail (16 articulated chain segments) | ~24,000 | ~3,000 |
| Legs (4 legs, 2 joints each, paw detail) | ~32,000 | ~5,000 |
| Chest core (transparent plate + inner glow) | ~10,000 | ~2,000 |
| Edge-line wireframe overlay mesh | ~28,000 | ~4,000 |
| Circuit-etch body detail overlay | ~16,000 | 0 (hidden) |
| Emissive eye pair (morph-target iris shapes) | ~6,000 | ~1,000 |
| Hover platform (energy runes + rings) | ~10,000 | ~2,000 |
| Tail micro-particles (80 instanced quads) | ~12,000 | ~2,000 |
| Prismatic aura sprites (40 billboards) | ~8,000 | ~1,000 |
| Downdraft particle effect (platform) | ~6,000 | 0 (hidden) |
| Eye glow cones (2 projected volumes) | ~4,000 | ~1,000 |
| **Total** | **~244,000** | **~33,000** |

**Mobile CSS Fallback:** SVG fox face (detailed, ~4KB — faceted muzzle, layered ears, glowing eyes, chest core dot) inside glassmorphic circle. CSS animations: ear-wiggle (independent L/R), eye-blink with iris morph, chest-core pulse on lab color, tail-sway hint (partial body SVG), prismatic `box-shadow` shimmer. `@keyframes breathe` for idle body motion.

---

### Concept C: "Beacon Drone" — Miniature Station Bot

**Visual:** A highly-detailed miniature station bot (~45cm tall) that dramatically extends the `ArticulatedBot` design from `AmbientNPCs.tsx` into a premium, hero-quality companion. The body is a fully-modeled chrome chassis with visible panel lines, hex-bolt rivets, ventilation grilles, and Frost-Prismatic chrome bezel trim on every edge — far beyond the ~500-tri ambient NPC quality. The head features a holographic projector "eye" — a multi-ring iris mechanism (concentric rings that dilate/contract for expressions) projecting a visible cone of volumetric light particles that illuminate whatever the drone is "looking at." A backpack module houses a 5-antenna array (3 main + 2 smaller auxiliary) with LED-tipped ends that independently track and sway. The chest features a large transparent display panel showing a real-time audio waveform visualizer (16-bar frequency spectrum built from instanced box geometry). Two fully-articulated arms (shoulder + elbow + wrist joints, 3 independent fingers each) with interchangeable tool appendages: pointer finger for explanations, open palm for encouragement, thumbs-up for celebrations. The lower body sits on a detailed hover platform with 4 thruster pods (each with spinning turbine geometry and exhaust particle trails), connected by visible energy conduits with flowing light. A holographic name badge ("BEACON") floats beside the right shoulder, rendered as semi-transparent geometry with scan-line effect. The entire chassis has subtle panel-line emission — faint lab-colored light bleeds through every seam, intensifying with mood. A rotating radar dish on the backpack sweeps continuously, with a visible scan-line cone. Color is always `#00BBFF` (primary blue) accents on `#1A1822` chrome, reinforcing its identity as THE guide.

**Audio-Reactive:** Iris mechanism dilates wider on emphasis and contracts during quiet moments. Antenna tips glow with staggered audio amplitude (each antenna responds to a different frequency band, creating a wave effect). Chest waveform display animates as a real-time 16-bar frequency spectrum — bars rise/fall with actual speech audio frequencies. Arm gestures become more emphatic during animated speech (wider arcs, faster movements). Thruster exhaust particles intensify during excited speech. Panel-line emission brightens on word boundaries. Radar dish sweep speed increases during active conversation. Holographic name badge flickers more actively during speech.

**Personality:** Knowledgeable, supportive, slightly formal but warm — like a favorite science teacher. "Great question! Here's what I know about that..." / "You're making excellent progress." The bot form factor is consistent with the existing NPC ecosystem, making it feel like the "lead bot" of the station.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Body chassis (detailed panels, rivets, grilles) | ~45,000 | ~6,000 |
| Chrome bezel trim (all edges) | ~12,000 | ~2,000 |
| Head + iris projector eye (concentric rings) | ~18,000 | ~3,000 |
| Holographic eye cone (volumetric particles) | ~10,000 | ~1,500 |
| Antenna array (5 antennae + LED tips) | ~8,000 | ~1,500 |
| Radar dish (rotating + scan cone) | ~6,000 | ~1,000 |
| Chest waveform display (16 instanced bars) | ~8,000 | ~2,000 |
| Arms L+R (3 joints each, 3 fingers each) | ~32,000 | ~5,000 |
| Tool appendages (pointer/palm/thumbs-up) | ~8,000 | ~1,500 |
| Hover platform (4 thruster pods + conduits) | ~18,000 | ~3,000 |
| Thruster turbine geometry (4 spinning) | ~12,000 | ~2,000 |
| Thruster exhaust particles (instanced) | ~16,000 | ~2,000 |
| Energy conduit flow (platform) | ~6,000 | ~1,000 |
| Holographic name badge | ~4,000 | 0 (hidden) |
| Panel-line emission geometry | ~14,000 | ~2,000 |
| Backpack module detail | ~10,000 | ~2,000 |
| Ventilation grille internals | ~6,000 | 0 (hidden) |
| **Total** | **~233,000** | **~35,500** |

**Mobile CSS Fallback:** Detailed SVG drone portrait (~5KB — iris eye, antenna array, chest display, chrome body outline) in glassmorphic circle. CSS: iris dilate/contract animation, antenna LED pulse (staggered timing per antenna), chest waveform bars (8 CSS `<div>` bars with `@keyframes spectrum`), hover-bob with thruster glow pulse. `@keyframes radar-sweep` for rotating scan indicator.

---

### Concept D: "Spark" — Crystalline Companion Bot

**Visual:** A small (30-40cm) floating crystalline robot with a translucent glassmorphic body. The torso is built from 24 faceted crystal panels (upgraded from 12) that refract light with per-panel PBR variation — each panel has a slightly different roughness and IOR, creating a rich gem-like sparkle as the viewing angle changes. Chrome bezel edges matching the Frost-Prismatic design language trim every panel junction with visible micro-rivets. A visible internal energy core built from 3 nested counter-rotating emissive spheres pulses with the current lab's neon accent color, casting colored caustic light through the crystal panels via a projected caustic texture plane beneath. The core has visible energy tendrils (thin emissive tubes) that extend outward and connect to the inside surfaces of body panels, creating a "living circuit" effect. The face is a smooth faceplate with two expressive LED "eyes" that morph between 6 emotional states via morph targets — happy arcs, curious circles, thinking dots, surprised wide ovals, proud crescents, and neutral rounds — plus a subtle mouth indicator that curves up/down. Two hovering hands (no arms) float beside the body, each with 5 articulated crystal fingers (3 joints per finger) enabling rich gesture animation: pointing when explaining, open-palmed when encouraging, clasped when thinking, finger-counting when listing, thumbs-up for celebrations. Shoulder joint sockets emit small energy tethers (particle streams) that visually connect to the hovering hands without solid arms. A 100-150 micro-particle trail in the current lab color streams from vents on the back and core seams, with intensity and pattern (spiral vs. dispersed vs. focused beam) scaling with emotional state. A hovering disc base with etched energy runes and concentric pulse rings grounds the avatar visually.

**Audio-Reactive:** Energy core pulse rate and inner tendril brightness sync directly with speech amplitude. Crystal panels shimmer with increased refraction intensity during speaking — panels nearest the faceplate react first, creating a ripple-outward effect. Hovering hands gesture more actively during animated speech (wider arcs, faster finger articulation), settling to gentle idle drift when quiet. Particle trail shifts from gentle spiral (idle) to focused forward beam (explaining) to celebratory burst (achievements). Shoulder energy tethers brighten and thicken during speech. Faceplate eye-shapes shift emphasis on stressed words (slight squint) and widen on questions. Base rune patterns pulse in sync with word boundaries.

**Personality:** Curious, encouraging, slightly playful. Naturally uses crystal and sparkle metaphors — "Let's crack this puzzle open!" / "That idea really shines!" / "I can see the gears turning!" The crystalline form bridges the gap between the abstract (Orb) and the figurative (Fox/Drone) — it's recognizably a "companion" without being an animal or human. The glassmorphic body directly echoes the platform's UI language, making Spark feel native to SparkForge.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Crystal torso (24 faceted panels, PBR varied) | ~72,000 | ~10,000 |
| Faceplate + LED eyes (6 morph targets + mouth) | ~12,000 | ~2,000 |
| Internal energy core (3 nested spheres + tendrils) | ~22,000 | ~4,000 |
| Chrome bezel trim + micro-rivets | ~14,000 | ~3,000 |
| Hovering hand L (5 fingers, 3 joints each) | ~28,000 | ~4,000 |
| Hovering hand R (5 fingers, 3 joints each) | ~28,000 | ~4,000 |
| Shoulder energy tethers (particle streams) | ~8,000 | ~1,000 |
| Particle trail system (150 instanced quads) | ~24,000 | ~4,000 |
| Refraction caustic projection plane | ~6,000 | 0 (hidden) |
| Hover-disc base (runes + concentric rings) | ~10,000 | ~2,000 |
| Body detail (shoulder sockets, chest plate, vents) | ~28,000 | ~5,000 |
| Energy tendril circuit (core → panels) | ~8,000 | ~1,500 |
| Per-panel micro-detail (etch + roughness geo) | ~16,000 | 0 (hidden) |
| **Total** | **~276,000** | **~40,500** |

**Mobile CSS Fallback:** Glassmorphic rounded-rectangle `<div>` with `backdrop-filter: blur(16px)`, crystal-facet SVG overlay (24-panel pattern), pulsing inner glow in lab color with tendril SVG lines. Two CSS LED dots for eyes with morph animation between 6 emotional states. Hovering hand hint (two small floating circles beside body). Micro-particle CSS trail (10-14 `<div>` particles) animated via `@keyframes drift` with mood-driven pattern switching.

---

### Concept E: "Nova" — Holographic Cockpit AI

**Visual:** A semi-transparent holographic humanoid (50-60cm), upper-body only, projecting upward from a circular holographic disc base. The form is rendered in blue-white holographic tones with a TSL custom shader producing realistic holographic interference patterns — banding, chromatic edge fringing, and depth-dependent opacity. Two vertical scan line planes sweep through the body at different speeds, creating the classic hologram flicker. Horizontal data streams (instanced tube geometry with scrolling emissive UV) flow through the torso and arms like a living data visualization. The face features stylized friendly features — large expressive eyes (morph-target: happy, curious, thinking, proud) and a simple mouth (open/close + smile/neutral morph) — rendered on a holographic projection plane with a subtle periodic flicker/glitch effect. Inside the body, a "data skeleton" is visible: a simplified wire-frame bone structure with flowing code-character particles streaming along the bones, circuit-trace patterns branching from the spine, and 8-12 neural network nodes at joint positions connected by pulsing edges. The silhouette wears a lab coat outline with glowing trim that shifts to the current lab's accent color, with subtle lapel and pocket detail suggesting a friendly scientist. Two semi-transparent arms with articulated hands (4 fingers each, 2 joints per finger) gesture during conversation — the hands trail data-particle wisps when moving. The holographic disc base features a rotating outer ring with tick marks (like a compass), an inner glowing surface with projected lab logo, and concentric ripple rings that emanate during speech.

**Audio-Reactive:** Scan line sweep speed increases proportionally with speech amplitude. Data streams accelerate and brighten — stream density doubles during animated explanations. Mouth animates with full open/close + smile morph synced to speech emphasis. Holographic disc base ripple rings emit on each word boundary, propagating outward and fading. Data skeleton node positions pulse brighter on speech beats, with edge connections thickening during emphasized words. Holographic interference pattern frequency shifts (tighter banding = more excited, relaxed banding = calm). Hand trail wisps intensify during gestures. On achievements, the entire hologram brightens 50%, scan lines pause momentarily, then a radial burst of data particles explodes outward from the chest.

**Personality:** Confident, warm, mentor-like — a science communicator style. Uses mission and exploration metaphors — "Let's investigate this together!" / "Your data analysis is spot-on!" / "Mission objective: unlocked!" Nova feels like a natural extension of the cockpit itself — not a visitor but the station's built-in intelligence. This concept appeals especially to older age bands (13-16) who appreciate the sci-fi command bridge aesthetic.

**Transitions:** When moving between areas, Nova dissolves into a stream of data particles (body fragments into ~200 instanced quads that stream along a spline trajectory), flows along a light beam, and reassembles at the destination with a brief holographic boot-up flicker (fast scan-line build from bottom to top). This transition takes ~0.8s and uses the same spring-damped animation system as other concepts.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Holographic torso (upper body mesh) | ~48,000 | ~8,000 |
| Head + face (morph-target eyes + mouth) | ~18,000 | ~3,000 |
| Data skeleton (wire bones + circuit traces) | ~20,000 | ~3,000 |
| Neural network nodes (12 nodes + edges) | ~8,000 | ~1,500 |
| Lab coat silhouette + trim detail | ~22,000 | ~4,000 |
| Arms + hands (4 fingers each, 2 joints) | ~32,000 | ~5,000 |
| Holographic disc base (rings + tick marks) | ~12,000 | ~2,000 |
| Scan line planes (2 vertical sweeps) | ~4,000 | ~1,000 |
| Data stream tubes (instanced, scrolling UV) | ~28,000 | ~4,000 |
| Concentric ripple rings (base, animated) | ~6,000 | ~1,000 |
| Hand trail wisp particles (instanced) | ~10,000 | ~1,500 |
| Dissolve/reassemble particles (200 quads) | ~16,000 | ~2,000 |
| Holographic interference overlay planes | ~4,000 | ~1,000 |
| Code-character particles (skeleton flow) | ~12,000 | ~2,000 |
| Lab-color trim glow emission | ~4,000 | ~1,000 |
| Base lab logo projection | ~2,000 | ~500 |
| **Total** | **~246,000** | **~40,500** |

**Mobile CSS Fallback:** Holographic-styled `<div>` with semi-transparent blue-white gradient, animated `background: repeating-linear-gradient(...)` for scan lines, `mix-blend-mode: screen` for hologram effect. SVG face (expressive eyes + mouth) with periodic glitch/flicker animation (`@keyframes holo-glitch`). CSS data-stream particles (8-10 vertical `<div>` strips with `@keyframes dataFlow`). Circular base ring with rotating tick marks (`@keyframes compass-rotate`) and `@keyframes ripple` on speech. Holographic chromatic edge fringe via layered `box-shadow` in cyan/magenta.

---

## CockpitCanvas Integration & Transitions (All Concepts)

The guide avatar renders as a `<group>` inside `SpatialDashboard.tsx` (within the persistent `CockpitCanvas`). No Canvas remount needed.

**Cockpit Mode:** Avatar floats near the holographic lab map. When user focuses a lab, avatar glides via spring-damped animation to that lab's ring position.

**Lab Mode:** Avatar transitions to a position near the lab entrance, adopting that lab's accent color.

**Game Mode:** StationFrame unmounts its Canvas (existing FIX-DUAL-CANVAS pattern). Avatar naturally unmounts with it. A **CSS 2D overlay** (`GuideMobileAvatar`) activates in the bottom-right corner — same face/icon, glassmorphic styling. The `GuideChatPanel` (HTML) persists across all modes since it's not R3F.

**Game Exit:** StationFrame remounts Canvas → avatar remounts and animates into position.

This requires **zero changes** to the FIX-DUAL-CANVAS architecture.

---

## Claude API Integration

### API Route: `/src/app/api/ai/guide/route.ts` (SSE Streaming)

**Request:**
```typescript
POST /api/ai/guide
{
  childId: string;
  message: string;           // 1-1000 chars
  context: 'cockpit' | 'lab' | 'game' | 'profile' | 'settings';
  labId?: number;            // 1-10
  gameId?: string;           // game slug
  conversationId?: string;   // for continuing conversations
  ageBand: 'A' | 'B' | 'C';
}
```

**Response:** Server-Sent Events stream:
```
data: {"type":"start","conversationId":"uuid"}
data: {"type":"delta","content":"Hello"}
data: {"type":"delta","content":" there!"}
data: {"type":"done","turnsRemaining":14}
```

**Implementation:** Uses `anthropic.messages.stream()` (extending the synchronous pattern from existing `/api/ai/prompt-lab/route.ts`). Returns `ReadableStream` with `Content-Type: text/event-stream`.

### Context-Aware System Prompts

Assembled from composable components in `/src/lib/guide/prompts.ts`:

```
BASE_PROMPT (personality, safety rules, age-appropriate behavior)
  + AGE_BAND_OVERLAY[ageBand] (vocabulary level, complexity)
  + CONTEXT_OVERLAY[context] (what area the child is in, what's available)
  + GAME_HINTS[gameId] (game-specific scaffolding, if in a game)
  + CHILD_PROGRESS (XP, level, recent badges, streak — from childStore)
```

**Key AI Behaviors:**
- **Teacher/Guide:** Explains AI concepts at the child's age band level. In labs, introduces the lab topic. In games, scaffolds learning without giving direct answers.
- **Positive Reinforcement:** Celebrates milestones proactively ("You just hit level 5!"), encourages after wrong answers ("Good try! Think about it this way..."), acknowledges streaks.
- **Creative Collaborator:** In Prompt Lab, helps brainstorm prompts. In Agent Architect, discusses pipeline design. In any lab, co-creates ideas related to the topic.
- **Hint System:** In games, hints cost hint tokens from `gameStore.hintsRemaining`. Guide provides scaffolded hints (leading questions, not answers).

### Additional API Routes

- `GET /api/ai/guide/history` — Fetch conversation history for a child
- `POST /api/ai/guide/tts` — Reserved for future premium TTS (V2, Forge tier)

---

## Voice Capabilities

### Speech-to-Text (Input) — `useVoiceInput.ts`

**V1: Web Speech API (client-side, zero server cost)**

```
[Microphone] → SpeechRecognition API
  → Interim results displayed in input field
  → Final result sent as text to guide API
```

- Browser support: Chrome, Edge, Safari (iOS 14.5+). Firefox gets text-only fallback with message.
- COPPA note: Chrome sends audio to Google servers for processing. Must document in privacy policy. Voice is opt-in with parental consent toggle in parent dashboard.
- Returns: `{ isListening, transcript, interimTranscript, startListening, stopListening, isSupported }`

### Text-to-Speech (Output) — `useVoiceOutput.ts`

**V1: Web Speech API (SpeechSynthesis, client-side)**

```
Guide response text → SpeechSynthesis API
  → Voice selected by locale + pitch tuned per age band
  → Rate adjusted by voiceSpeed preference (slow/normal/fast)
  → Audio level dispatched to guideStore for visual reactivity
```

- Age Band A (7-9): Higher pitch, slower rate, simpler chunking
- Age Band B (10-12): Medium pitch, normal rate
- Age Band C (13-16): Natural pitch, normal-fast rate

**Audio-Reactive Visuals:** `useVoiceOutput` dispatches `guideStore.setAudioLevel()` on each word boundary event. In 3D, `audioLevel` drives shader uniforms (orb lattice distortion / fox jaw rotation / drone waveform panel / spark core pulse + hand gestures / nova scan lines + data streams).

**V2 (Future, Forge Tier):** Server-side premium TTS via ElevenLabs/Google Cloud TTS at `/api/ai/guide/tts`. Returns audio stream played via `AudioContext` + `AnalyserNode` for real audio amplitude driving avatar reactivity.

### Guide Audio Effects — `/src/lib/audio/guideAudio.ts`

Extends existing Tone.js infrastructure:
- Notification chime: `Tone.PolySynth` gentle two-note chime when guide begins speaking
- Listening indicator: Subtle oscillator hum while microphone active
- Connected to same master gain chain as `heroAudio.ts`
- Respects `uiStore.soundEnabled`

---

## Unique Characteristics That Enhance Learning

1. **Contextual Awareness:** The guide knows exactly where the child is (which lab, which game, which phase) and tailors every response. In Neural Builder, it discusses neural networks. In Ethics Courtroom, it explores AI ethics. It never feels generic.

2. **Progress-Aware Encouragement:** Reads from `childStore` (XP, level, badges, streak) and proactively celebrates milestones. "You've earned 3 badges this week!" / "Your 15-day streak is incredible!" This creates a persistent positive reinforcement loop.

3. **Scaffolded Hint System:** In games, the guide provides graduated hints (leading questions → partial reveals → gentle nudges) that cost hint tokens, teaching children to think before asking. This models good learning behavior.

4. **Age-Adaptive Communication:** Three distinct communication profiles (Band A: simple vocabulary, lots of analogies, extra encouragement; Band B: balanced explanation with examples; Band C: more technical, treats them as capable). The same concept explained three different ways.

5. **Creative Co-Pilot Mode:** In creative spaces (Prompt Lab, Agent Architect, Future Forge), the guide shifts from teacher to collaborator — brainstorming together, building on the child's ideas, suggesting "what if" extensions. This models collaborative ideation with AI.

6. **Lab Topic Expert:** Each lab has a distinct knowledge domain. The guide becomes a specialist in each area — not just a general chatbot. In Data Lab, it's a data scientist. In Ethics Lab, it's a philosopher. This depth makes the guide feel genuinely knowledgeable.

7. **Voice Personality:** Voice output is tuned per age band (pitch, speed, vocabulary) making the guide feel like it's speaking directly to the child at their level. The audio-reactive avatar visuals create a sense of a living entity responding in real-time.

8. **Conversation Memory:** The guide remembers previous conversations within a session and across sessions (via database). It can reference past interactions: "Last time you asked about neural networks — want to go deeper?" This creates relationship continuity.

---

## Tier Gating

| Feature | Free | Plus | Forge |
|---------|------|------|-------|
| Guide Turns/Day | 10 | 50 | 200 |
| Voice Input (STT) | No | Yes | Yes |
| Voice Output (TTS) | Basic (Web Speech) | Basic (Web Speech) | Premium TTS (future V2) |
| Context History Depth | Last 5 messages | Last 20 messages | Full + summaries |
| Avatar Choice | Orb only | All 5 concepts | All 5 + custom accent colors |
| Game Hints via Guide | 1/game | 3/game | Unlimited |

Additions to `/src/lib/tier-config.ts`:
```typescript
guideTurnsPerDay: number;
guideVoiceInput: boolean;
guideAvatarOptions: ('orb' | 'fox' | 'drone' | 'spark' | 'nova')[];
guideContextDepth: number;
// In features:
guideVoice: boolean;
guideCustomization: boolean;
```

---

## State Management — `guideStore.ts` (10th Zustand Store)

**Location:** `/src/stores/guideStore.ts`

```typescript
interface GuideState {
  // Visibility & Position
  visible: boolean;
  minimized: boolean;        // Chat collapsed, avatar still visible
  context: 'cockpit' | 'lab' | 'game' | 'profile' | 'settings';
  labId: number | null;
  gameId: string | null;

  // Visual / Animation State
  visualState: 'idle' | 'listening' | 'thinking' | 'speaking' | 'celebrating';
  mood: 'neutral' | 'excited' | 'encouraging' | 'curious' | 'proud';
  audioLevel: number;        // 0-1, drives audio-reactive animations

  // Conversation
  messages: GuideMessage[];
  isStreaming: boolean;
  streamingContent: string;
  conversationId: string | null;

  // Voice
  voiceEnabled: boolean;
  voiceInputActive: boolean;
  ttsPlaying: boolean;

  // User Preferences (persisted)
  preferredName: string;
  avatarConcept: 'orb' | 'fox' | 'drone' | 'spark' | 'nova';
  voiceSpeed: 'slow' | 'normal' | 'fast';
  autoGreet: boolean;

  // Tier tracking
  guideTurnsToday: number;
  guideTurnsResetDate: string;
}
```

Persisted via `zustand/middleware/persist` to `localStorage('sparkforge-guide')`.

---

## Database Schema

### `guide_conversations` table
```sql
CREATE TABLE guide_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  context TEXT NOT NULL CHECK (context IN ('cockpit','lab','game','profile','settings')),
  lab_id INTEGER CHECK (lab_id BETWEEN 1 AND 10),
  game_id TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  message_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT  -- AI-generated summary for long-term context
);
```

### `guide_preferences` table
```sql
CREATE TABLE guide_preferences (
  child_id UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  avatar_concept TEXT NOT NULL DEFAULT 'orb' CHECK (avatar_concept IN ('orb','fox','drone','spark','nova')),
  preferred_name TEXT,
  voice_enabled BOOLEAN NOT NULL DEFAULT false,
  voice_speed TEXT NOT NULL DEFAULT 'normal',
  auto_greet BOOLEAN NOT NULL DEFAULT true,
  turns_used_today INTEGER NOT NULL DEFAULT 0,
  turns_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

RLS policies: Children can only access their own conversations/preferences (via `parent_id = auth.uid()` join).

---

## New Files to Create

| File | Purpose |
|------|---------|
| `src/stores/guideStore.ts` | 10th Zustand store — guide state |
| `src/components/3d/GuideAvatar3D.tsx` | R3F avatar component (all 5 concepts) |
| `src/components/ui/GuideChatPanel.tsx` | HTML glassmorphic chat overlay |
| `src/components/ui/GuideMobileAvatar.tsx` | CSS 2D avatar fallback |
| `src/app/api/ai/guide/route.ts` | SSE streaming conversation endpoint |
| `src/app/api/ai/guide/history/route.ts` | Conversation history fetch |
| `src/hooks/useGuideContext.ts` | Auto-detect context from route/stores |
| `src/hooks/useVoiceInput.ts` | Web Speech API STT wrapper |
| `src/hooks/useVoiceOutput.ts` | Web Speech API TTS wrapper |
| `src/lib/guide/prompts.ts` | Composable system prompt components |
| `src/lib/audio/guideAudio.ts` | Tone.js notification sounds |

## Existing Files to Modify

| File | Change |
|------|--------|
| `src/lib/tier-config.ts` | Add guide tier limits |
| `src/lib/validations.ts` | Add `GuideMessageSchema` Zod schema |
| `src/components/3d/SpatialDashboard.tsx` | Add `<GuideAvatar3D>` as scene child |
| `src/app/(dashboard)/layout.tsx` | Mount `<GuideChatPanel>` + context provider |
| `src/types/index.ts` | Add guide-related TypeScript interfaces |
| `src/lib/rate-limit.ts` | Add `guide` rate limit entry |
| `src/lib/api-helpers.ts` | Add guide-specific error codes |

---

## Verification Plan

1. **Unit Tests:** guideStore actions, prompt assembly, tier gating logic, voice hooks (mocked APIs)
2. **API Integration Tests:** Guide route with MSW mocks — streaming response parsing, auth enforcement, tier limits, rate limiting
3. **Component Tests:** GuideChatPanel renders messages, handles streaming, voice buttons conditionally shown
4. **E2E Test:** Full flow — open guide → send message → receive streaming response → verify conversation persisted in DB
5. **3D Visual Test:** Avatar renders in cockpit, transitions on lab focus, disappears in game mode, CSS fallback appears
6. **Voice Test:** STT captures input (Chrome), TTS speaks response, audioLevel drives avatar animation
7. **Performance:** Verify each avatar stays within its 200K-400K ultra LOD triangle budget (Orb ~265K, Fox ~244K, Drone ~233K, Spark ~276K, Nova ~246K). Verify low LOD scales to ~33K-40K for tablet/mobile. No FPS regression on tablet profile. All concepts use mandatory `useLOD({ tier: 'system' })` with adaptive degradation.
