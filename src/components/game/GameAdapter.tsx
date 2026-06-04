// ════════════════════════════════════════════════════════════════
// GAME ADAPTER — Bridges old and new game shells during migration
// ════════════════════════════════════════════════════════════════
// This component wraps game components and renders them inside
// either the old 3D GameShell or the new HtmlGameShell based on
// the USE_HTML_GAME_SHELL feature flag.

import { FEATURE_FLAGS } from '@/config/feature-flags';
import type { GameProps } from '@/types/game';

interface GameAdapterProps extends Omit<GameProps, 'difficulty'> {
  /** The game React component to render */
  gameComponent: React.ComponentType<GameProps>;
  /** Game display title */
  title: string;
  /** Game category */
  category: string;
  /** Difficulty level (1-3) */
  difficulty: number;
  /** Total questions/rounds */
  totalQuestions?: number;
}

export function GameAdapter({
  gameComponent: GameComponent,
  title,
  category,
  difficulty,
  totalQuestions,
  ...gameProps
}: GameAdapterProps) {
  if (FEATURE_FLAGS.USE_HTML_GAME_SHELL) {
    // New HTML shell — import dynamically to avoid bundling both
    const HtmlGameShell = require('./HtmlGameShell').HtmlGameShell;
    return (
      <HtmlGameShell
        {...gameProps}
        title={title}
        category={category}
        difficulty={difficulty}
        totalQuestions={totalQuestions}
      >
        <GameComponent {...gameProps} />
      </HtmlGameShell>
    );
  }

  // Old 3D shell — keep existing behavior
  const GameShell = require('./GameShell').default;
  return (
    <GameShell
      gameId={gameProps.gameId}
      title={title}
      worldNumber={difficulty}
      worldColor={getCategoryColor(category)}
      totalRounds={totalQuestions ?? 10}
    >
      <GameComponent {...gameProps} />
    </GameShell>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    ethics: '#2F4BC0',
    creativity: '#E945F5',
    coding: '#00D17A',
    data: '#FF6B35',
    agents: '#9B59B6',
    safety: '#2ECC71',
    career: '#FFD93D',
    classification: '#4F6EF7',
    nlp: '#FF6B9D',
    vision: '#00BBFF',
    audio: '#FF7050',
  };
  return colors[category] ?? '#4F6EF7';
}
