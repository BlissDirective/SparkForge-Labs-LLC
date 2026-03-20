# SparkForge AI Guide Avatar — Enhancement Concept Plan

## Context

SparkForge is a gamified AI learning platform for children ages 7-16 with a dark-mode "Frost-Prismatic" aesthetic and a 3D Laboratory Control Station / Panoramic Cockpit architecture. This enhancement introduces **"Spark"** — a persistent, Claude API-powered AI Guide Avatar that lives throughout the entire platform as a teacher, positive reinforcement figure, and creative collaborator. The guide is visible and interactive across all areas: the 3D panoramic cockpit home screen, individual lab environments, and game spaces. It includes full voice capabilities (speech-to-text input + text-to-speech output).

**Triangle Budget:** 500,000 – 2,000,000 (well within existing cockpit budget headroom of ~104K used out of 5M tablet / 10M desktop).

---

## Five Avatar Concepts

### Concept A: "Orb Sentinel" — Holographic Energy Sphere

**Visual:** A luminous energy orb (~0.5 scene units) with a crystalline internal lattice visible through a semi-transparent outer shell. The shell uses a custom TSL Fresnel glow shader that rotates slowly in the active lab's accent color. Two thin orbital rings orbit the sphere at different inclinations — accelerating during conversation, drifting gently when idle. A holographic "face" (two simple eye dots + subtle mouth curve) projects onto the front hemisphere via emissive texture, giving warmth without uncanny-valley realism.

**Audio-Reactive:** When speaking, the lattice pulses with waveform distortion. Orbital rings speed up during active conversation.

**Personality:** Wise, calm, encouraging. "Interesting thought!" / "Let me show you something cool." The orb form is pedagogically honest — it looks like AI, not pretending to be human, which aligns with the platform's mission of teaching AI concepts.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Outer sphere shell (32-seg) | ~2,048 | ~128 |
| Inner crystalline lattice | ~4,000 | 0 (hidden) |
| Orbital ring A (64-seg torus) | ~2,048 | ~256 |
| Orbital ring B (48-seg torus) | ~1,536 | 0 (hidden) |
| Face projection quad | 2 | 2 |
| Audio-reactive particle halo | ~500 | 0 |
| Hover-pad glow disc | ~32 | ~16 |
| **Total** | **~10,166** | **~402** |

**Mobile CSS Fallback:** Circular `<div>` with `backdrop-filter: blur(12px)`, `border: 2px solid var(--lab-color)`, animated `box-shadow` glow pulse. Two CSS dots for eyes with blink animation. `@keyframes float` for gentle vertical bob.

---

### Concept B: "Prism Fox" — Geometric Animal Companion

**Visual:** A low-poly fox-like creature built from sharp geometric facets — triangular faces with visible edge highlights giving a crystalline/origami appearance. Body color is dark chrome (`#1A1822`) with neon edge-lines in the active lab color. Ears are translucent prisms with inner glow. Tail is a segmented chain of decreasing prisms that sway with Perlin noise. Eyes are two bright LED-like emissive circles. When speaking, the jaw articulates (simple rotation of lower-face group) and ear prisms pulse brighter. When idle, it sits on a hovering platform and occasionally flicks its tail or tilts its head.

**Audio-Reactive:** Jaw articulation during speech, ear prisms pulse with audio amplitude, chest emissive glow follows waveform.

**Personality:** Playful, curious, adventurous. "Ooh, what if we tried THIS?" / "Follow me — I found something!" Appeals strongly to younger age bands (7-10) while remaining engaging for older users through witty observations. The fox metaphor (clever, adaptive) maps well to AI concepts.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Fox body (faceted low-poly) | ~3,200 | ~800 |
| Head with articulated jaw | ~1,800 | ~400 |
| Ears (2 translucent prisms) | ~400 | ~100 |
| Tail (8 chain segments) | ~1,600 | 0 (static) |
| Legs (4 simple cylinders) | ~1,200 | ~400 |
| Hover platform | ~200 | ~100 |
| Edge-line wireframe overlay | ~2,000 | 0 (hidden) |
| Emissive eye pair | ~64 | ~64 |
| Audio-reactive chest glow | ~200 | 0 |
| **Total** | **~10,664** | **~1,864** |

**Mobile CSS Fallback:** SVG fox face (pre-rendered, ~2KB) inside glassmorphic circle. CSS animations: ear-wiggle, eye-blink, glow-pulse on active lab color.

---

### Concept C: "Beacon Drone" — Miniature Station Bot

**Visual:** A miniature version of the existing `ArticulatedBot` from `AmbientNPCs.tsx` but distinctly larger (2x scale), more detailed, and with unique visual markers. Same dark chrome body (`#1A1822` with neon accents) but adds: a holographic projector "eye" (replacing the visor — a small cone of volumetric light), a backpack antenna array (3 antennae instead of 1), and a glowing chest panel that displays a waveform when speaking. Color is always `#00BBFF` (primary blue) rather than personality-mapped, reinforcing its identity as THE guide rather than one of many NPCs.

**Audio-Reactive:** Antenna tips glow with audio amplitude, chest waveform panel animates in real-time, holographic projector eye brightens during speech.

**Personality:** Knowledgeable, supportive, slightly formal but warm — like a favorite science teacher. "Great question! Here's what I know about that..." / "You're making excellent progress." The bot form factor is consistent with the existing NPC ecosystem, making it feel like the "lead bot" of the station.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Body (extended ArticulatedBot, 2x) | ~1,200 | ~500 |
| Holographic projector eye | ~600 | ~200 |
| Antenna array (3 antennae) | ~300 | ~100 |
| Chest waveform panel | ~400 | ~100 |
| Arms with tool appendages | ~800 | ~300 |
| Hover pads (larger + particle ring) | ~400 | ~100 |
| Holographic name badge | ~100 | 0 |
| Audio-reactive elements | ~200 | 0 |
| **Total** | **~4,000** | **~1,300** |

**Mobile CSS Fallback:** SVG drone face (visor + antenna silhouette) in glassmorphic circle. CSS: visor blink, antenna pulse, hover bob.

---

### Concept D: "Spark" — Crystalline Companion Bot

**Visual:** A small (30-40cm) floating crystalline robot with a translucent glassmorphic body. The torso is built from faceted crystal panels that refract light, trimmed with chrome bezel edges matching the Frost-Prismatic design language. A visible internal energy core pulses with the current lab's neon accent color, casting colored caustic light through the crystal panels. The face is a smooth faceplate with two expressive LED "eyes" that morph between emotional states — happy arcs, curious circles, thinking dots, surprised wide ovals. Two hovering hands (no arms) float beside the body, gesturing expressively during conversation — pointing when explaining, open-palmed when encouraging, clasped when thinking.

**Audio-Reactive:** Energy core pulse rate syncs with speech amplitude. Crystal panels shimmer with increased refraction during speaking. Hovering hands gesture more actively during animated speech, settling to gentle idle drift when quiet. A 50-100 micro-particle trail in the current lab color streams from the core, with intensity scaling proportionally with emotional state (celebrating = maximum particles, idle = minimal trail).

**Personality:** Curious, encouraging, slightly playful. Naturally uses crystal and sparkle metaphors — "Let's crack this puzzle open!" / "That idea really shines!" / "I can see the gears turning!" The crystalline form bridges the gap between the abstract (Orb) and the figurative (Fox/Drone) — it's recognizably a "companion" without being an animal or human. The glassmorphic body directly echoes the platform's UI language, making Spark feel native to SparkForge.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Crystal torso (faceted panels, 12 faces) | ~120,000 | ~15,000 |
| Faceplate + LED eyes (emissive morph targets) | ~8,000 | ~2,000 |
| Internal energy core (nested spheres + glow) | ~24,000 | ~4,000 |
| Chrome bezel trim (edge geometry) | ~16,000 | ~4,000 |
| Hovering hand L (5-finger crystal) | ~40,000 | ~5,000 |
| Hovering hand R (5-finger crystal) | ~40,000 | ~5,000 |
| Particle trail system (instanced) | ~100,000 | ~10,000 |
| Refraction caustic planes | ~12,000 | 0 (hidden) |
| Hover-disc base glow | ~8,000 | ~2,000 |
| Body detail (shoulder joints, chest plate) | ~32,000 | ~8,000 |
| **Base total** | **~400,000** | **~55,000** |
| **Ultra LOD total (with max detail)** | **~800,000** | — |

**Mobile CSS Fallback:** Glassmorphic rounded-rectangle `<div>` with `backdrop-filter: blur(16px)`, crystal-facet SVG overlay, pulsing inner glow in lab color. Two CSS LED dots for eyes with morph animation between emotional states. Micro-particle CSS trail (8-12 `<div>` particles) animated via `@keyframes drift`.

---

### Concept E: "Nova" — Holographic Cockpit AI

**Visual:** A semi-transparent holographic humanoid (50-60cm), upper-body only, projecting upward from a circular holographic disc base. The form is rendered in blue-white holographic tones with visible scan lines sweeping vertically and horizontal data streams flowing through the body like a living data visualization. The face features stylized friendly features — large expressive eyes and a simple mouth — rendered on a holographic projection plane with a subtle flicker effect. Inside the body, a "data skeleton" is visible: flowing code patterns, circuit traces, and neural network node visualizations that pulse with activity. The silhouette wears a lab coat outline with glowing trim that shifts to the current lab's accent color.

**Audio-Reactive:** Scan line sweep speed increases during speech. Data streams accelerate and brighten with audio amplitude. Mouth animates with simple open/close synced to speech. The holographic disc base emits concentric ripple rings during active conversation. Data skeleton patterns pulse rhythmically with speech cadence. On achievements, the entire hologram brightens and emits a radial burst of data particles.

**Personality:** Confident, warm, mentor-like — a science communicator style. Uses mission and exploration metaphors — "Let's investigate this together!" / "Your data analysis is spot-on!" / "Mission objective: unlocked!" Nova feels like a natural extension of the cockpit itself — not a visitor but the station's built-in intelligence. This concept appeals especially to older age bands (13-16) who appreciate the sci-fi command bridge aesthetic.

**Transitions:** When moving between areas, Nova dissolves into a stream of data particles, flows along a light beam trajectory, and reassembles at the destination with a brief holographic boot-up flicker. This transition takes ~0.8s and uses the same spring-damped animation system as other concepts.

**Triangle Budget:**
| Component | Ultra LOD | Low LOD |
|-----------|----------|---------|
| Holographic torso (upper body mesh) | ~80,000 | ~12,000 |
| Head + face projection plane | ~30,000 | ~6,000 |
| Data skeleton (internal wire mesh) | ~60,000 | ~8,000 |
| Lab coat silhouette + trim | ~40,000 | ~6,000 |
| Holographic disc base | ~16,000 | ~4,000 |
| Scan line planes (2 vertical sweeps) | ~4,000 | ~1,000 |
| Data stream particles (instanced) | ~120,000 | ~15,000 |
| Concentric ripple rings (base) | ~8,000 | ~2,000 |
| Arms + hand gestures | ~60,000 | ~10,000 |
| Dissolve/reassemble particle system | ~80,000 | ~10,000 |
| Holographic flicker overlay | ~2,000 | ~1,000 |
| Neural network node viz (data skeleton) | ~40,000 | ~5,000 |
| Eye emissive + mouth morph | ~6,000 | ~2,000 |
| Lab-color trim glow | ~4,000 | ~1,000 |
| **Base total** | **~550,000** | **~83,000** |
| **Ultra LOD total (with max detail)** | **~1,200,000** | — |

**Mobile CSS Fallback:** Holographic-styled `<div>` with semi-transparent blue-white gradient, animated `background: repeating-linear-gradient(...)` for scan lines, `mix-blend-mode: screen` for hologram effect. SVG face (eyes + mouth) with flicker animation. CSS data-stream particles (6-8 vertical `<div>` strips) with `@keyframes dataFlow`. Circular base ring with `@keyframes ripple`.

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
7. **Performance:** Verify avatar stays within triangle budget (Orb/Fox/Drone < 15K; Spark < 800K; Nova < 1.2M), no FPS regression on tablet profile. Spark and Nova use aggressive LOD scaling to hit tablet/mobile budgets.
