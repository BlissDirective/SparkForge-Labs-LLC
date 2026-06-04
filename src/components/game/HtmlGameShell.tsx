// ════════════════════════════════════════════════════════════════
// HTML GAME SHELL — Replaces the 3D GameShell wrapper
// ════════════════════════════════════════════════════════════════
// Clean, HTML-first game container with progress tracking,
// celebration overlay, and accessible game controls.

'use client';

import { useState, useCallback } from 'react';
import { Pause, Play, RotateCcw, Home, X } from 'lucide-react';
import type { GameProps, GameResult } from '@/types/game';

interface HtmlGameShellProps extends Omit<GameProps, 'difficulty'> {
  children: React.ReactNode;
  title: string;
  category: string;
  difficulty: number;
  totalQuestions?: number;
}

export function HtmlGameShell({
  children,
  gameId,
  childId,
  title,
  category,
  difficulty,
  totalQuestions = 10,
  onComplete,
  onProgress,
  onExit,
}: HtmlGameShellProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const handleProgress = useCallback(
    (q: number, total: number, s: number) => {
      setCurrentQuestion(q);
      setScore(s);
      onProgress?.({
        gameId,
        currentQuestion: q,
        totalQuestions: total,
        currentScore: s,
        elapsedSeconds,
      });
    },
    [gameId, elapsedSeconds, onProgress]
  );

  const handleComplete = useCallback(
    (finalScore: number, maxScore: number) => {
      const result: GameResult = {
        gameId,
        childId,
        score: finalScore,
        maxScore,
        xpEarned: Math.round((finalScore / maxScore) * 50),
        starsEarned:
          finalScore >= maxScore * 0.9
            ? 3
            : finalScore >= maxScore * 0.6
              ? 2
              : finalScore >= maxScore * 0.3
                ? 1
                : 0,
        timeSpentSeconds: elapsedSeconds,
        completedAt: new Date().toISOString(),
      };
      onComplete(result);
    },
    [gameId, childId, elapsedSeconds, onComplete]
  );

  const progress = totalQuestions > 0 ? currentQuestion / totalQuestions : 0;

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: 'rgb(var(--sf-surface-alt) / 1)' }}
    >
      {/* Game Header */}
      <GameHeader
        title={title}
        category={category}
        difficulty={difficulty}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        score={score}
        onPause={() => setIsPaused(true)}
        onExit={onExit}
      />

      {/* Progress Bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: 'rgb(var(--sf-border) / 1)' }}
      >
        <div
          className="h-full transition-all duration-300 rounded-r-full"
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, rgb(var(--sf-primary)), rgb(var(--sf-accent-pink)))',
          }}
        />
      </div>

      {/* Game Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-6 shadow-md"
          style={{
            backgroundColor: 'rgb(var(--sf-surface) / 1)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {children}
        </div>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <PauseOverlay
          onResume={() => setIsPaused(false)}
          onRestart={() => {
            setIsPaused(false);
            setCurrentQuestion(0);
            setScore(0);
          }}
          onExit={onExit}
        />
      )}
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────── */

function GameHeader({
  title,
  category,
  difficulty,
  currentQuestion,
  totalQuestions,
  score,
  onPause,
  onExit,
}: {
  title: string;
  category: string;
  difficulty: number;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  onPause: () => void;
  onExit?: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 md:px-6 h-14 border-b"
      style={{
        backgroundColor: 'rgb(var(--sf-surface) / 1)',
        borderColor: 'rgb(var(--sf-border) / 1)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}
          aria-label="Exit game"
        >
          <X className="w-5 h-5" />
        </button>
        <div>
          <h2
            className="text-sm font-semibold leading-tight"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'rgb(var(--sf-text-primary) / 1)',
            }}
          >
            {title}
          </h2>
          <p
            className="text-xs"
            style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}
          >
            {category} &middot; {renderDifficulty(difficulty)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}
        >
          {currentQuestion}/{totalQuestions}
        </span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'rgb(var(--sf-primary) / 1)',
          }}
        >
          {score} pts
        </span>
        <button
          onClick={onPause}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}
          aria-label="Pause game"
        >
          <Pause className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function PauseOverlay({
  onResume,
  onRestart,
  onExit,
}: {
  onResume: () => void;
  onRestart: () => void;
  onExit?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="rounded-2xl p-8 max-w-sm w-full mx-4 space-y-4"
        style={{
          backgroundColor: 'rgb(var(--sf-surface) / 1)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <h3
          className="text-xl font-bold text-center"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'rgb(var(--sf-text-primary) / 1)',
          }}
        >
          Game Paused
        </h3>

        <div className="space-y-3 pt-2">
          <PauseButton onClick={onResume} variant="primary" icon={<Play className="w-5 h-5" />}>
            Resume
          </PauseButton>
          <PauseButton onClick={onRestart} variant="secondary" icon={<RotateCcw className="w-5 h-5" />}>
            Restart
          </PauseButton>
          <PauseButton onClick={onExit} variant="ghost" icon={<Home className="w-5 h-5" />}>
            Exit to Arcade
          </PauseButton>
        </div>
      </div>
    </div>
  );
}

function PauseButton({
  children,
  onClick,
  variant,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant: 'primary' | 'secondary' | 'ghost';
  icon: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'rgb(var(--sf-primary) / 1)',
      color: '#fff',
      boxShadow: 'var(--shadow-glow-primary)',
    },
    secondary: {
      backgroundColor: 'rgb(var(--sf-surface-muted) / 1)',
      color: 'rgb(var(--sf-text-primary) / 1)',
      border: '1px solid rgb(var(--sf-border) / 1)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'rgb(var(--sf-text-secondary) / 1)',
    },
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
      style={styles[variant]}
    >
      {icon}
      {children}
    </button>
  );
}

function renderDifficulty(level: number): string {
  const dots = Array.from({ length: 3 }, (_, i) =>
    i < level ? '●' : '○'
  ).join(' ');
  return dots;
}
