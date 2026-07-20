// ════════════════════════════════════════════════════════════════
// FORGE CHAMBER SHELL — Forge F2 (Concept 10 Part 6)
// ════════════════════════════════════════════════════════════════
// The forge-era game container. Prop-contract IDENTICAL to
// HtmlGameShell (games cannot tell the difference); selected by
// GameAdapter when FORGE_THEME && FORGE_CHAMBER. The frame is pure
// DOM/CSS (invariant 0.1.2); nothing overlays the game viewport.

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Pause, Play, RotateCcw, Home, X } from 'lucide-react';
import { ForgePanel, ForgeButton, MoltenProgress, HoloChip, CircuitTraces } from '@/components/forge';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { GameProps, GameResult } from '@/types/game';

interface ForgeChamberShellProps extends Omit<GameProps, 'difficulty'> {
  children: React.ReactNode;
  title: string;
  category: string;
  difficulty: number;
  totalQuestions?: number;
}

export function ForgeChamberShell({
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
}: ForgeChamberShellProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const reducedMotion = useReducedMotion();

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

  // Referenced for contract parity with HtmlGameShell (games drive
  // progress/completion through their own props; these stay wired for
  // shells that lift state here).
  void handleProgress;
  void handleComplete;
  void setElapsedSeconds;

  const progress = totalQuestions > 0 ? currentQuestion / totalQuestions : 0;

  return (
    <div
      className="h-full flex flex-col relative"
      style={{ backgroundColor: 'rgb(var(--sf-surface-alt) / 1)' }}
    >
      {/* Frame margin circuitry — decorative, behind everything */}
      <CircuitTraces
        density="low"
        pulse={false}
        className="absolute inset-0 w-full h-full opacity-25"
      />

      {/* ── Chamber frame ── */}
      <div className="relative flex-1 flex flex-col min-h-0 p-2 md:p-3">
        <ForgePanel
          variant="alloy"
          as="div"
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* corner rivets */}
          {(['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'] as const).map(
            (pos) => (
              <span
                key={pos}
                aria-hidden="true"
                className={`absolute ${pos} w-1.5 h-1.5 rounded-full z-10`}
                style={{
                  background:
                    'radial-gradient(circle at 35% 35%, var(--forge-chrome-hi, rgba(255,255,255,0.2)), rgb(var(--sf-border) / 1))',
                }}
              />
            )
          )}

          {/* side struts */}
          <span
            aria-hidden="true"
            className="absolute left-0 top-6 bottom-6 w-1 rounded-r"
            style={{ background: 'linear-gradient(180deg, var(--forge-bronze, #C87B3B), var(--forge-bronze-deep, #8A5426))', opacity: 0.5 }}
          />
          <span
            aria-hidden="true"
            className="absolute right-0 top-6 bottom-6 w-1 rounded-l"
            style={{ background: 'linear-gradient(180deg, var(--forge-bronze, #C87B3B), var(--forge-bronze-deep, #8A5426))', opacity: 0.5 }}
          />

          {/* ── Chamber header ── */}
          <div
            className="relative flex items-center justify-between gap-2 px-3 md:px-5 h-14 shrink-0 border-b"
            style={{ borderColor: 'rgb(var(--sf-border) / 1)' }}
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <ForgeButton
                variant="ghost"
                size="sm"
                sparks={false}
                onClick={onExit}
                aria-label="Exit game"
              >
                <X className="w-5 h-5" />
              </ForgeButton>
              <div className="min-w-0">
                <h2
                  className="text-sm font-semibold leading-tight truncate"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'rgb(var(--sf-text-primary) / 1)',
                  }}
                >
                  {title}
                </h2>
                <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
                  <HoloChip tone="neutral">{category}</HoloChip>
                  <HoloChip tone="amber">{renderDifficulty(difficulty)}</HoloChip>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <span
                className="text-xs font-medium tabular-nums"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgb(var(--sf-text-secondary) / 1)',
                }}
              >
                {currentQuestion}/{totalQuestions}
              </span>
              <motion.span
                key={score}
                initial={reducedMotion ? false : { scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-bold tabular-nums"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgb(var(--sf-primary-light) / 1)',
                }}
              >
                {score} pts
              </motion.span>
              <ForgeButton
                variant="ghost"
                size="sm"
                sparks={false}
                onClick={() => setIsPaused(true)}
                aria-label="Pause game"
              >
                <Pause className="w-5 h-5" />
              </ForgeButton>
            </div>
          </div>

          {/* ── Molten progress ── */}
          <div className="px-3 md:px-5 py-1.5 shrink-0">
            <MoltenProgress value={progress} height={8} label="Game progress" />
          </div>

          {/* ── Chamber viewport — the untouched game ── */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 min-h-0">
            <ForgePanel
              variant="glass"
              as="div"
              bezel={false}
              className="max-w-3xl mx-auto p-4 md:p-6"
            >
              {children}
            </ForgePanel>
          </div>
        </ForgePanel>
      </div>

      {/* ── Chamber Paused overlay ── */}
      {isPaused && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(22, 16, 11, 0.8)',
            backdropFilter: 'blur(6px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Game paused"
        >
          <ForgePanel variant="glass" glow="ambient" as="div" className="p-8 max-w-sm w-full mx-4 space-y-4">
            <h3
              className="text-xl font-bold text-center"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'rgb(var(--sf-text-primary) / 1)',
                textShadow: 'var(--glow-text, none)',
              }}
            >
              Chamber Paused
            </h3>

            <div className="space-y-3 pt-2">
              <ForgeButton
                variant="molten"
                className="w-full"
                onClick={() => setIsPaused(false)}
              >
                <Play className="w-5 h-5" />
                Resume
              </ForgeButton>
              <ForgeButton
                variant="alloy"
                className="w-full"
                onClick={() => {
                  setIsPaused(false);
                  setCurrentQuestion(0);
                  setScore(0);
                }}
              >
                <RotateCcw className="w-5 h-5" />
                Restart
              </ForgeButton>
              <ForgeButton variant="ghost" className="w-full" onClick={onExit}>
                <Home className="w-5 h-5" />
                Exit to Arcade
              </ForgeButton>
            </div>
          </ForgePanel>
        </div>
      )}
    </div>
  );
}

function renderDifficulty(level: number): string {
  return Array.from({ length: 3 }, (_, i) => (i < level ? '●' : '○')).join(' ');
}
