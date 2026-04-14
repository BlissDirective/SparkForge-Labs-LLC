'use client';

// ════════════════════════════════════════════════════
// GameErrorBoundary — Game-specific error recovery
// ════════════════════════════════════════════════════
// Phase 1 audit fix (Section 8.7, Solution B): Dedicated error boundary
// for all 35 games with game-aware recovery options:
//   - "Restart Game" → resets gameStore and re-renders
//   - "Return to Arcade" → navigates to /arcade
//   - "Report Bug" → logs to Sentry with game context
//
// Wraps GameShell children. On error, shows a friendly message
// styled with Frost-Prismatic aesthetic matching the game's worldColor.

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { useGameStore } from '@/stores/gameStore';
import { useSceneStore } from '@/stores/sceneStore';

interface GameErrorBoundaryProps {
  children: React.ReactNode;
  gameId: string;
  gameTitle: string;
  worldColor: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GameErrorBoundaryInner extends React.Component<
  GameErrorBoundaryProps & { onRestart: () => void; onReturnToArcade: () => void },
  State
> {
  constructor(props: GameErrorBoundaryProps & { onRestart: () => void; onReturnToArcade: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[GameErrorBoundary] ${this.props.gameId}:`, error, errorInfo);
    Sentry.captureException(error, {
      tags: { gameId: this.props.gameId, component: 'GameErrorBoundary' },
      contexts: {
        game: { gameId: this.props.gameId, gameTitle: this.props.gameTitle },
        react: { componentStack: errorInfo.componentStack ?? undefined },
      },
    });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRestart();
  };

  handleReturnToArcade = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReturnToArcade();
  };

  render() {
    if (this.state.hasError) {
      const { worldColor, gameTitle } = this.props;

      return (
        <div className="flex items-center justify-center h-full w-full p-8">
          <div className="text-center max-w-sm">
            <div
              className="text-5xl mb-3 opacity-60"
              style={{ filter: `drop-shadow(0 0 12px ${worldColor})` }}
            >
              &#x1F527;
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="font-body text-sm text-white/50 mb-1">
              {gameTitle} ran into an issue.
            </p>
            <p className="font-body text-xs text-white/30 mb-6">
              Don&apos;t worry — your progress is safe!
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left text-xs text-red-400/60 bg-red-500/5 border border-red-500/10 rounded-xl p-3 mb-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleRestart}
                className="w-full py-2.5 rounded-xl font-display font-bold text-sm text-white"
                style={{ background: `linear-gradient(135deg, ${worldColor}, ${worldColor}CC)` }}
              >
                Restart Game
              </button>
              <button
                onClick={this.handleReturnToArcade}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Return to Arcade
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper to access hooks (gameStore.resetGame, router)
export function GameErrorBoundary({ children, gameId, gameTitle, worldColor }: GameErrorBoundaryProps) {
  const handleRestart = React.useCallback(() => {
    useGameStore.getState().resetGame();
  }, []);

  const handleReturnToArcade = React.useCallback(() => {
    useSceneStore.getState().exitGame();
    useGameStore.getState().resetGame();
    // Use window.location for reliable navigation from error state
    window.location.href = '/arcade';
  }, []);

  return (
    <GameErrorBoundaryInner
      gameId={gameId}
      gameTitle={gameTitle}
      worldColor={worldColor}
      onRestart={handleRestart}
      onReturnToArcade={handleReturnToArcade}
    >
      {children}
    </GameErrorBoundaryInner>
  );
}
