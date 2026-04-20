// ════════════════════════════════════════════════════
// GAME ROUTER — Dynamic imports for all 35 games
// Stage 10 Part 2
// v2 [BUG-10E] + [ENH-10D]: Complete 35-game map
// Code review fix: Named exports use .then() wrapper
// MISSING-7A resolved: AI Spy game now included
// ════════════════════════════════════════════════════

'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useActiveChild } from '@/hooks/useChildren';
import { getGameBySlug } from '@/config/gameRegistry';

function GameLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div
          className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-neon-blue border-t-transparent animate-spin"
          aria-hidden="true"
        />
        <p className="font-display text-sm text-white/40">Loading game...</p>
      </div>
    </div>
  );
}

// ── Dynamic imports — each game loads only when needed ──
// Games with default exports use direct import.
// Games with named exports use .then() to wrap as default.

const GAME_MAP: Record<string, ReturnType<typeof dynamic>> = {
  // ── Stage 6: Flagship Games (5) — all have default exports ──
  'pet-trainer': dynamic(
    () => import('@/components/games/PetTrainerGame'),
    { loading: GameLoader }
  ),
  'neural-builder': dynamic(
    () => import('@/components/games/NeuralBuilderGame'),
    { loading: GameLoader }
  ),
  'prompt-lab': dynamic(
    () => import('@/components/games/PromptLabGame'),
    { loading: GameLoader }
  ),
  'agent-architect': dynamic(
    () => import('@/components/games/AgentArchitectGame').then(mod => ({ default: mod.AgentArchitectGame })),
    { loading: GameLoader }
  ),
  'bias-detective': dynamic(
    () => import('@/components/games/BiasDetectiveGame').then(mod => ({ default: mod.BiasDetectiveGame })),
    { loading: GameLoader }
  ),

  // ── Stage 7A: Tap/Quiz Games (9) ──
  'ai-spy': dynamic(
    () => import('@/components/games/AiSpyGame').then(mod => ({ default: mod.AiSpyGame })),
    { loading: GameLoader }
  ),
  'time-machine': dynamic(
    () => import('@/components/games/TimeMachineGame').then(mod => ({ default: mod.TimeMachineGame })),
    { loading: GameLoader }
  ),
  'word-predictor': dynamic(
    () => import('@/components/games/WordPredictorGame').then(mod => ({ default: mod.WordPredictorGame })),
    { loading: GameLoader }
  ),
  'token-chopper': dynamic(
    () => import('@/components/games/TokenChopperGame').then(mod => ({ default: mod.TokenChopperGame })),
    { loading: GameLoader }
  ),
  'ai-art-detective': dynamic(
    () => import('@/components/games/AiArtDetectiveGame').then(mod => ({ default: mod.AiArtDetectiveGame })),
    { loading: GameLoader }
  ),
  'tool-picker': dynamic(
    () => import('@/components/games/ToolPickerGame').then(mod => ({ default: mod.ToolPickerGame })),
    { loading: GameLoader }
  ),
  'data-shield': dynamic(
    () => import('@/components/games/DataShieldGame').then(mod => ({ default: mod.DataShieldGame })),
    { loading: GameLoader }
  ),
  'real-or-fake': dynamic(
    () => import('@/components/games/RealOrFakeGame').then(mod => ({ default: mod.RealOrFakeGame })),
    { loading: GameLoader }
  ),
  'prediction-market': dynamic(
    () => import('@/components/games/PredictionMarketGame').then(mod => ({ default: mod.PredictionMarketGame })),
    { loading: GameLoader }
  ),

  // ── Stage 7B: Drag/Drop Games (4) — all have default exports ──
  'sort-toy-box': dynamic(
    () => import('@/components/games/SortToyBoxGame'),
    { loading: GameLoader }
  ),
  'human-vs-machine': dynamic(
    () => import('@/components/games/HumanVsMachineGame'),
    { loading: GameLoader }
  ),
  'code-blocks': dynamic(
    () => import('@/components/games/CodeBlocksGame'),
    { loading: GameLoader }
  ),
  'career-explorer': dynamic(
    () => import('@/components/games/CareerExplorerGame'),
    { loading: GameLoader }
  ),

  // ── Stage 7C: Simulation Games (6) ──
  'treat-trainer': dynamic(
    () => import('@/components/games/TreatTrainerGame').then(mod => ({ default: mod.TreatTrainerGame })),
    { loading: GameLoader }
  ),
  'sentiment-scanner': dynamic(
    () => import('@/components/games/SentimentScannerGame').then(mod => ({ default: mod.SentimentScannerGame })),
    { loading: GameLoader }
  ),
  'lost-in-translation': dynamic(
    () => import('@/components/games/LostInTranslationGame').then(mod => ({ default: mod.LostInTranslationGame })),
    { loading: GameLoader }
  ),
  'data-detective': dynamic(
    () => import('@/components/games/DataDetectiveGame').then(mod => ({ default: mod.DataDetectiveGame })),
    { loading: GameLoader }
  ),
  'neuron-relay': dynamic(
    () => import('@/components/games/NeuronRelayGame').then(mod => ({ default: mod.NeuronRelayGame })),
    { loading: GameLoader }
  ),
  'chatbot-builder': dynamic(
    () => import('@/components/games/ChatbotBuilderGame').then(mod => ({ default: mod.ChatbotBuilderGame })),
    { loading: GameLoader }
  ),

  // ── Stage 7D: Investigation Games (5) ──
  'pixel-investigator': dynamic(
    () => import('@/components/games/PixelInvestigatorGame').then(mod => ({ default: mod.PixelInvestigatorGame })),
    { loading: GameLoader }
  ),
  'fool-the-ai': dynamic(
    () => import('@/components/games/FoolTheAiGame').then(mod => ({ default: mod.FoolTheAiGame })),
    { loading: GameLoader }
  ),
  'future-forge': dynamic(
    () => import('@/components/games/FutureForgeGame'),
    { loading: GameLoader }
  ),
  'robot-vacuum': dynamic(
    () => import('@/components/games/RobotVacuumGame').then(mod => ({ default: mod.RobotVacuumGame })),
    { loading: GameLoader }
  ),
  'camera-quest': dynamic(
    () => import('@/components/games/CameraQuestGame').then(mod => ({ default: mod.CameraQuestGame })),
    { loading: GameLoader }
  ),

  // ── Stage 7E: Ethics/API Games (3) ──
  'ethics-courtroom': dynamic(
    () => import('@/components/games/EthicsCourtroomGame').then(mod => ({ default: mod.EthicsCourtroomGame })),
    { loading: GameLoader }
  ),
  'build-classifier': dynamic(
    () => import('@/components/games/BuildClassifierGame').then(mod => ({ default: mod.BuildClassifierGame })),
    { loading: GameLoader }
  ),
  'api-explorer': dynamic(
    () => import('@/components/games/ApiExplorerGame').then(mod => ({ default: mod.ApiExplorerGame })),
    { loading: GameLoader }
  ),

  // ── Stage 7F: Band A Games (3) ──
  'emoji-decoder': dynamic(
    () => import('@/components/games/EmojiDecoderGame').then(mod => ({ default: mod.EmojiDecoderGame })),
    { loading: GameLoader }
  ),
  'my-first-ai-app': dynamic(
    () => import('@/components/games/MyFirstAiAppGame').then(mod => ({ default: mod.MyFirstAiAppGame })),
    { loading: GameLoader }
  ),
  'ai-or-not': dynamic(
    () => import('@/components/games/AiOrNotGame').then(mod => ({ default: mod.AiOrNotGame })),
    { loading: GameLoader }
  ),
};

export default function GamePage() {
  const { gameSlug } = useParams<{ gameSlug: string }>();
  const activeChild = useActiveChild();

  const GameComponent = GAME_MAP[gameSlug];

  // S7-HIGH-004: Age band enforcement — check game registry for band restrictions
  const gameConfig = getGameBySlug(gameSlug);
  const childBand = activeChild?.age_band || 'B';
  if (GameComponent && gameConfig?.ageBands && !gameConfig.ageBands.includes(childBand)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4" aria-hidden="true">🔒</div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Age Restricted
          </h2>
          <p className="font-body text-sm text-white/40 mb-2">
            This game is designed for {gameConfig.ageBands.map(b =>
              b === 'A' ? 'ages 7-10' : b === 'B' ? 'ages 11-13' : 'ages 14-16'
            ).join(', ')}.
          </p>
          <p className="font-body text-xs text-white/30 mb-6">
            Check out other games in the Arcade that match your age group!
          </p>
          <Link
            href="/arcade"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display font-bold text-sm hover:bg-white/10 transition-colors inline-block"
          >
            Back to Arcade
          </Link>
        </div>
      </div>
    );
  }

  if (!GameComponent) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div
            className="text-5xl mb-4 font-display font-bold text-neon-blue/30"
            aria-hidden="true"
          >
            ?
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Game Not Found
          </h2>
          <p className="font-body text-sm text-white/40 mb-6">
            This game may have drifted into a black hole!
          </p>
          <Link
            href="/arcade"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display font-bold text-sm hover:bg-white/10 transition-colors inline-block"
          >
            Back to Arcade
          </Link>
        </div>
      </div>
    );
  }

  // S4-HIGH-002: GameShell wrapper is enforced at the individual game level.
  // Each game component imports and renders <GameShell> internally, which calls
  // sceneStore.enterGame/exitGame for cockpit integration. Router-level wrapping
  // is not used to avoid double-wrapping — the contract is: every game MUST use GameShell.
  return <GameComponent />;
}
