// ════════════════════════════════════════════════════
// Game Loaders — T14 PERF-MED-001 (Opt A)
// ════════════════════════════════════════════════════
// Separated from page.tsx so we can export the loader map +
// metadata for tests and potential preload hooks. Next.js App
// Router limits what a `page.tsx` may export, so helpers live
// here.
//
// Each factory returns a freshly-imported module with a
// `default` pointer. Named vs default exports are normalized
// inside the factory so the page.tsx consumer doesn't care.
// ════════════════════════════════════════════════════

import type { ComponentType } from 'react';
import { FEATURE_FLAGS } from '@/config/feature-flags';

export type GameLoaderFn = () => Promise<{ default: ComponentType }>;

/**
 * Normalize `{ default }` vs `{ Name }` modules to `{ default }`. Falls back to
 * the default export when the requested named export is absent — several game
 * files are `export default function Foo()` while their loader entry still asks
 * for the named `Foo`, which would otherwise resolve to `undefined` and throw
 * React error #306 ("element type is invalid"). The fallback makes the loader
 * tolerant of both export styles.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- component props vary per game
const def = (mod: Record<string, any>, named?: string): { default: ComponentType } => ({
  default: (named && mod[named]) ? mod[named] : mod.default,
});

export const GAME_LOADERS: Record<string, GameLoaderFn> = {
  // ── Stage 6: Flagship Games (5) ──
  'pet-trainer': () => import('@/components/games/PetTrainerGame').then((m) => def(m)),
  'neural-builder': () => import('@/components/games/NeuralBuilderGame').then((m) => def(m)),
  'prompt-lab': () => import('@/components/games/PromptLabGame').then((m) => def(m)),
  'agent-architect': () =>
    import('@/components/games/AgentArchitectGame').then((m) => def(m, 'AgentArchitectGame')),
  'bias-detective': () =>
    import('@/components/games/BiasDetectiveGame').then((m) => def(m, 'BiasDetectiveGame')),

  // ── Stage 7A: Tap/Quiz Games (9) ──
  'ai-spy': () =>
    import('@/components/games/AiSpyGame').then((m) => def(m, 'AiSpyGame')),
  'time-machine': () =>
    import('@/components/games/TimeMachineGame').then((m) => def(m, 'TimeMachineGame')),
  'word-predictor': () =>
    import('@/components/games/WordPredictorGame').then((m) => def(m, 'WordPredictorGame')),
  'token-chopper': () =>
    import('@/components/games/TokenChopperGame').then((m) => def(m, 'TokenChopperGame')),
  'ai-art-detective': () =>
    import('@/components/games/AiArtDetectiveGame').then((m) => def(m, 'AiArtDetectiveGame')),
  'tool-picker': () =>
    import('@/components/games/ToolPickerGame').then((m) => def(m, 'ToolPickerGame')),
  'data-shield': () =>
    import('@/components/games/DataShieldGame').then((m) => def(m, 'DataShieldGame')),
  'real-or-fake': () =>
    import('@/components/games/RealOrFakeGame').then((m) => def(m, 'RealOrFakeGame')),
  'prediction-market': () =>
    import('@/components/games/PredictionMarketGame').then((m) => def(m, 'PredictionMarketGame')),

  // ── Stage 7B: Drag/Drop Games (4) ──
  'sort-toy-box': () => import('@/components/games/SortToyBoxGame').then((m) => def(m)),
  'human-vs-machine': () => import('@/components/games/HumanVsMachineGame').then((m) => def(m)),
  'code-blocks': () => import('@/components/games/CodeBlocksGame').then((m) => def(m)),
  'career-explorer': () => import('@/components/games/CareerExplorerGame').then((m) => def(m)),

  // ── Stage 7C: Simulation Games (6) ──
  'treat-trainer': () =>
    import('@/components/games/TreatTrainerGame').then((m) => def(m, 'TreatTrainerGame')),
  'sentiment-scanner': () =>
    import('@/components/games/SentimentScannerGame').then((m) => def(m, 'SentimentScannerGame')),
  'lost-in-translation': () =>
    import('@/components/games/LostInTranslationGame').then((m) => def(m, 'LostInTranslationGame')),
  'data-detective': () =>
    import('@/components/games/DataDetectiveGame').then((m) => def(m, 'DataDetectiveGame')),
  'neuron-relay': () =>
    import('@/components/games/NeuronRelayGame').then((m) => def(m, 'NeuronRelayGame')),
  'chatbot-builder': () =>
    import('@/components/games/ChatbotBuilderGame').then((m) => def(m, 'ChatbotBuilderGame')),

  // ── Stage 7D: Investigation Games (5) ──
  'pixel-investigator': () =>
    import('@/components/games/PixelInvestigatorGame').then((m) => def(m, 'PixelInvestigatorGame')),
  'fool-the-ai': () =>
    import('@/components/games/FoolTheAiGame').then((m) => def(m, 'FoolTheAiGame')),
  'future-forge': () => import('@/components/games/FutureForgeGame').then((m) => def(m)),
  'robot-vacuum': () =>
    import('@/components/games/RobotVacuumGame').then((m) => def(m, 'RobotVacuumGame')),
  'camera-quest': () =>
    import('@/components/games/CameraQuestGame').then((m) => def(m, 'CameraQuestGame')),

  // ── Stage 7E: Ethics/API Games (3) ──
  'ethics-courtroom': () =>
    import('@/components/games/EthicsCourtroomGame').then((m) => def(m, 'EthicsCourtroomGame')),
  'build-classifier': () =>
    import('@/components/games/BuildClassifierGame').then((m) => def(m, 'BuildClassifierGame')),
  'api-explorer': () =>
    import('@/components/games/ApiExplorerGame').then((m) => def(m, 'ApiExplorerGame')),

  // ── Stage 7F: Band A Games (3) ──
  'emoji-decoder': () =>
    import('@/components/games/EmojiDecoderGame').then((m) => def(m, 'EmojiDecoderGame')),
  'my-first-ai-app': () =>
    import('@/components/games/MyFirstAiAppGame').then((m) => def(m, 'MyFirstAiAppGame')),
  'ai-or-not': () =>
    import('@/components/games/AiOrNotGame').then((m) => def(m, 'AiOrNotGame')),

  // ── Stage 11: Lab 11 Agentic AI Games (7) ──
  'agent-atelier': () => import('@/components/games/AgentAtelierGame').then((m) => def(m)),
  'mcp-lab': () => import('@/components/games/McpLabGame').then((m) => def(m)),
  'glass-box': () => import('@/components/games/GlassBoxGame').then((m) => def(m)),
  'harness-forge': () => import('@/components/games/HarnessForgeGame').then((m) => def(m)),
  'pocket-brain': () => import('@/components/games/PocketBrainGame').then((m) => def(m)),
  'context-architect': () => import('@/components/games/ContextArchitectGame').then((m) => def(m)),
  'pixel-witness': () => import('@/components/games/PixelWitnessGame').then((m) => def(m)),
  // ── G4 new-2026-curriculum games (ids 43–47) ──
  'just-a-friend': () => import('@/components/games/JustAFriendGame').then((m) => def(m)),
  'trace-it': () => import('@/components/games/TraceItGame').then((m) => def(m)),
  'vibe-coder': () => import('@/components/games/VibeCoderGame').then((m) => def(m)),
  'code-word': () => import('@/components/games/CodeWordGame').then((m) => def(m)),
  'thinking-cap': () => import('@/components/games/ThinkingCapGame').then((m) => def(m)),
  'core-ignition': () => import('@/components/games/CoreIgnitionGame').then((m) => def(m)),
};

/** Return the lazy loader for a slug, or undefined if unknown. */
export function getGameLoader(slug: string): GameLoaderFn | undefined {
  // Forge F8: Core Ignition ships behind GAME_CORE_IGNITION — direct
  // URLs resolve to "game not found" while the flag is off.
  if (slug === 'core-ignition' && !FEATURE_FLAGS.GAME_CORE_IGNITION) return undefined;
  return GAME_LOADERS[slug];
}

/** Stable count — used in tests to assert parity with gameRegistry. */
export const GAME_SLUG_COUNT = Object.keys(GAME_LOADERS).length;
