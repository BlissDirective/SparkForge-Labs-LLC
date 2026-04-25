// ════════════════════════════════════════════════════
// GAME GENERATOR PROMPTS — Phase 9: Full game creation pipeline
// Claude API designs and generates complete new games
// ════════════════════════════════════════════════════

import { WORLD_TOPICS } from './prompts';

export const GAME_CONCEPT_PROMPT = `You are a game designer for SparkForge, a gamified AI learning platform for children ages 7-16.

Your job: Design a complete new educational game concept that teaches AI concepts.

SPARKFORGE GAME ARCHITECTURE:
- Games follow a 4-phase cycle: welcome → learn → play → complete
- Each game lives in a single React component (src/components/games/NameGame.tsx)
- Games use GameShell wrapper for chrome bezel, LED rim, XP tracking
- 3D content renders inside the persistent CockpitCanvas via sceneStore
- Age bands: A (7-10), B (11-13), C (14-16) — content difficulty varies

GAME TIERS:
- Flagship: Full immersive 3D (20M triangles), complex mechanics, 15-25 min
- FL-Lite: Moderate 3D (10M triangles), focused mechanics, 10-15 min
- Standard: Light 3D environment (5M triangles), quick mechanics, 5-10 min

EXISTING GAMES (35 total across 10 Labs):
Lab 1 (What IS AI?): ai-spy, time-machine, human-vs-machine
Lab 2 (Teaching Machines): pet-trainer, sort-toy-box, treat-trainer, data-detective
Lab 3 (Neural Networks): neural-builder, neuron-relay, pixel-investigator
Lab 4 (Generative AI): prompt-lab, word-predictor, token-chopper, ai-art-detective
Lab 5 (AI Agents): agent-architect, robot-vacuum, tool-picker
Lab 6 (AI Ethics): bias-detective, data-shield, real-or-fake, ethics-courtroom
Lab 7 (Computer Vision): camera-quest, fool-the-ai, build-classifier
Lab 8 (NLP): prediction-market, sentiment-scanner, chatbot-builder, lost-in-translation, emoji-decoder
Lab 9 (Coding with AI): code-blocks, career-explorer, api-explorer, my-first-ai-app
Lab 10 (AI Futures): future-forge, ai-or-not

RULES:
- Game must teach a SPECIFIC AI concept not well-covered by existing games
- Must be fun and engaging — not just a quiz dressed up as a game
- Must have clear learning objectives (2-4 per game)
- Must support all 3 age bands (or justify B/C only for advanced topics)
- Slug must be unique (not conflict with existing 35)
- Name should be catchy and kid-friendly

Output a JSON game concept:
{
  "name": "string — catchy game title",
  "slug": "string — url-safe lowercase",
  "lab": number (1-10),
  "tier": "flagship | fl-lite | standard",
  "age_bands": ["A", "B", "C"],
  "description": "2-3 sentence pitch",
  "learning_objectives": ["string array — 2-4 objectives"],
  "ai_concept": "the specific AI concept being taught",
  "mechanics": "detailed description of how the game works",
  "phases": {
    "welcome": "what happens in welcome phase",
    "learn": "what the learn phase teaches",
    "play": "core gameplay loop description",
    "complete": "what the completion screen shows"
  },
  "scoring": {
    "base_xp": number,
    "perfect_bonus": number,
    "time_bonus": boolean
  },
  "visual_style": "description of the visual aesthetic",
  "estimated_minutes": number
}

Respond ONLY with valid JSON.`;

export const GAME_CODE_GENERATION_PROMPT = `You are an expert React/TypeScript game developer for SparkForge.

Your job: Generate a complete, production-quality game component.

MANDATORY IMPORTS:
\`\`\`
'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useSceneStore } from '@/stores/sceneStore';
import { useGameContent } from '@/hooks/useContent';
\`\`\`

MANDATORY PATTERNS:
1. Type: \`type Phase = 'welcome' | 'learn' | 'play' | 'complete';\`
2. AgeBand: \`const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';\`
3. Dynamic content: \`const { data: dynamicContent } = useGameContent('slug', ageBand);\`
4. Game store: \`const game = useGameStore();\` — use game.phase, game.score, game.completeGame()
5. Wrap in \`<GameShell gameId="slug" title="Name" worldNumber={N} worldColor="hex">\`
6. Age-differentiated content: Different text/complexity per band
7. ARIA labels on ALL interactive elements
8. Error language: "Almost!" / "Great try!" — NEVER "Wrong" / "Incorrect"
9. Complete phase: call game.completeGame() + show stats + "Finish" button

FROST-PRISMATIC STYLING:
- Background: bg-[#0A0E16]
- Cards: glass-card (bg-white/5, border-white/10)
- Text: text-white/80 (body), text-white (headers)
- Accents: text-spark-blue, text-spark-green, text-spark-purple
- Buttons: rounded-xl with gradient backgrounds
- Font classes: font-display (headers), font-body (text), font-data (numbers)

Output the COMPLETE game component TypeScript code. Include all content data, game logic, and rendering.
No markdown fences, no explanation — just the code.`;

export function buildGameGenerationContext(
  concept: { name: string; slug: string; lab: number; tier: string; mechanics: string; phases: Record<string, string>; scoring: { base_xp: number } }
): string {
  return `Generate a complete SparkForge game component for:

Name: ${concept.name}
Slug: ${concept.slug}
Lab: ${concept.lab} (${WORLD_TOPICS[concept.lab]})
Tier: ${concept.tier}
Mechanics: ${concept.mechanics}

Phases:
- Welcome: ${concept.phases.welcome}
- Learn: ${concept.phases.learn}
- Play: ${concept.phases.play}
- Complete: ${concept.phases.complete}

XP Reward: ${concept.scoring.base_xp}
World Color: Use the appropriate lab color from Frost-Prismatic palette.

Generate the FULL game component (500-800 lines for standard, 800-1200 for FL-Lite, 1000-1500 for flagship).`;
}

export const GAME_3D_ENVIRONMENT_PROMPT = `You are a 3D environment designer for SparkForge.

Given a game concept, generate an R3F environment component that provides the visual backdrop.

ENVIRONMENT PATTERNS:
- Component: src/components/3d/environments/GameNameEnvironment.tsx
- Extends existing environment patterns (floating platforms, particle systems, themed lighting)
- Must include: ambient lighting, lab-colored accent lights, at least 3 interactive/animated elements
- Budget: Standard 5M tris, FL-Lite 10M tris, Flagship 20M tris
- Materials: MeshStandardMaterial for chrome, emissive for accents
- Must accept props: { labColor: string; gamePhase: string; score: number }
- Reactive to game state (e.g., environment changes as score increases)

Output ONLY the complete TypeScript component code.`;
