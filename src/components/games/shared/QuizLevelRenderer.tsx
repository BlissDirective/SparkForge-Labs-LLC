// ════════════════════════════════════════════════════════════════════════
// QUIZ LEVEL RENDERER — Shared for all tap/quiz games
// ════════════════════════════════════════════════════════════════════════
// Handles: question display, multiple choice, tap-to-answer,
// streak tracking, timer, score calculation, feedback.
// Games just provide questions[] and config.

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Target } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SortingTray } from '@/components/mechanics/SortingTray';
import type { SortableItem } from '@/lib/mechanics/GameMechanicKit';
import type { LevelConfig, LevelResult } from './GameLevelSystem';
import {
  ScoreDisplay, GlowingTitle, FeedbackPopup,
  ComboCounter, TimerDisplay, LevelBadge,
} from './GameVisualKit';

export interface QuizQuestion {
  question: string;
  emoji?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  band: 'A' | 'B' | 'C';
}

/**
 * Optional non-quiz "bonus round" appended after the questions. Lets any
 * quiz game add a drag-to-order mechanic (Fable Phase A item 1) by passing
 * one prop — the round is rendered + scored + juiced by this shared renderer.
 */
export interface QuizBonusRound {
  title?: string;
  prompt: string;
  items: SortableItem[];
  /** Max bonus points (default 20). */
  maxPoints?: number;
}

interface QuizLevelRendererProps {
  level: LevelConfig;
  onComplete: (result: LevelResult) => void;
  onExit: () => void;
  questions: QuizQuestion[];
  labColor: string;
  gameEmoji: string;
  timePerQuestion?: number;
  bonusRound?: QuizBonusRound;
}

export default function QuizLevelRenderer({
  level, onComplete, onExit, questions, labColor, gameEmoji, timePerQuestion = 20, bonusRound,
}: QuizLevelRendererProps) {
  const juice = useJuice();
  const [phase, setPhase] = useState<'welcome' | 'play' | 'bonus' | 'done'>('welcome');
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; message: string; explanation: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [answered, setAnswered] = useState(false);
  const [runScore, setRunScore] = useState(0);

  const currentQ = questions[qIndex];
  const bonusMax = bonusRound ? (bonusRound.maxPoints ?? 20) : 0;
  const maxScore = questions.length * 10 + 10 + bonusMax;

  // Compute stars + hand the result up. Shared by the quiz-only and
  // quiz+bonus completion paths so scoring stays in one place.
  const completeWith = useCallback((total: number) => {
    const stars = total >= level.starThresholds[2] ? 3 : total >= level.starThresholds[1] ? 2 : total >= level.starThresholds[0] ? 1 : 0;
    onComplete({
      score: total,
      maxScore,
      stars: stars as 0 | 1 | 2 | 3,
      xpEarned: level.xpReward * (stars / 3),
      timeMs: questions.length * timePerQuestion * 1000,
    });
  }, [level, maxScore, onComplete, questions.length, timePerQuestion]);

  // Shuffle options for each question (pure — no render-phase setState).
  const shuffledOptions = useMemo(() => {
    if (!currentQ) return [];
    const indices = currentQ.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [currentQ]);

  // Reset per-question state when the question changes.
  useEffect(() => {
    setAnswered(false);
    setTimeLeft(timePerQuestion);
  }, [qIndex, timePerQuestion]);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (answered) return;
    setAnswered(true);

    const isCorrect = optionIdx === currentQ.correctIndex;
    const round = qIndex + 1;
    if (isCorrect) {
      const comboBonus = Math.min(combo, 5);
      const newScore = score + 10 + comboBonus;
      setScore(newScore);
      setCombo((c) => c + 1);
      setMaxCombo((m) => Math.max(m, combo + 1));
      setCorrectCount((c) => c + 1);
      setFeedback({
        type: 'correct',
        message: combo > 2 ? `Correct! ${combo + 1}x streak! +${10 + comboBonus}` : 'Correct! +10 pts',
        explanation: currentQ.explanation,
      });
      // Drive the shared GameJuiceEngine — combo flames, floating text,
      // Sparky reactions, milestone popups + screen shake. This single
      // call is what gives all 20 quiz games their juice (Phase A item 1).
      juice.onCorrect(round, newScore);
    } else {
      setCombo(0);
      const newScore = score + 2; // Participation point
      setScore(newScore);
      setFeedback({
        type: 'wrong',
        message: optionIdx === -1 ? "Time's up!" : 'Not quite!',
        explanation: currentQ.explanation,
      });
      juice.onWrong(round, newScore);
    }

    setTimeout(() => {
      setFeedback(null);
      if (qIndex + 1 >= questions.length) {
        // End of questions: tally the quiz score (incl. time bonus).
        const timeBonus = Math.round((timeLeft / timePerQuestion) * 5);
        const quizScore = score + (isCorrect ? 10 + Math.min(combo, 5) : 2) + timeBonus;
        if (bonusRound) {
          setRunScore(quizScore);
          setPhase('bonus');
        } else {
          completeWith(quizScore);
        }
      } else {
        setQIndex((i) => i + 1);
      }
    }, 1800);
  }, [answered, currentQ, combo, score, qIndex, questions.length, timeLeft, timePerQuestion, juice, bonusRound, completeWith]);

  // Countdown. (Was previously a `useState(() => …)` no-op, so the timer
  // never ticked — questions could be pondered forever. Now it counts
  // down and auto-submits a miss at 0, as TimerDisplay always implied.)
  useEffect(() => {
    if (phase !== 'play' || answered) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, answered, timeLeft, handleAnswer]);

  // Welcome
  if (phase === 'welcome') {
    return (
      <div className="relative">
        <div className="relative z-10 space-y-5">
          <GlowingTitle emoji={gameEmoji} color={labColor}>Level {level.id}: {level.name}</GlowingTitle>

          <SFCard variant="elevated" className="p-5">
            <p className="text-sm" style={{ color: '#5A6078' }}>{level.description}</p>
            <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#8C94AC' }}>
              <Target className="w-3.5 h-3.5" />
              {questions.length} questions &middot; {timePerQuestion}s each
              {bonusRound && <span>&middot; + bonus order round</span>}
            </div>
          </SFCard>

          <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('play')}>
            Start Quiz <ChevronRight className="w-5 h-5 ml-2" />
          </SFButton>
        </div>
      </div>
    );
  }

  // Bonus round — drag-to-order mechanic (GameMechanicKit / SortingTray).
  if (phase === 'bonus' && bonusRound) {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <GlowingTitle emoji={gameEmoji} color={labColor}>Bonus Round</GlowingTitle>
          <SFCard variant="elevated" className="p-5">
            <p className="text-sm font-semibold mb-1" style={{ color: '#1A1D2B' }}>
              {bonusRound.title ?? 'Put these in the right order'}
            </p>
            <p className="text-sm mb-4" style={{ color: '#5A6078' }}>{bonusRound.prompt}</p>
            <SortingTray
              items={bonusRound.items}
              onComplete={({ allCorrect, score: pct }) => {
                const pts = allCorrect ? bonusMax : Math.round((pct / 100) * (bonusMax * 0.75));
                const total = runScore + pts;
                if (allCorrect) juice.onCorrect(questions.length + 1, total);
                else juice.onWrong(questions.length + 1, total);
                setTimeout(() => completeWith(total), 1400);
              }}
            />
          </SFCard>
        </div>
      </div>
    );
  }

  // Play
  return (
    <div className="relative space-y-4">
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <LevelBadge level={level.id} color={labColor} />
          <span
            className="text-xs"
            style={{ color: '#8C94AC' }}
            aria-label={`Question ${qIndex + 1} of ${questions.length}`}
          >
            {qIndex + 1} / {questions.length}
          </span>
          <TimerDisplay seconds={timeLeft} warning={5} />
        </div>

        <ScoreDisplay score={score} maxScore={maxScore} />
        <ComboCounter combo={combo} />

        {/* Question */}
        <SFCard variant="elevated" className="p-5">
          {currentQ.emoji && (
            <div className="text-4xl mb-3 text-center" aria-hidden="true">{currentQ.emoji}</div>
          )}
          <h3 id="quiz-question" className="text-base font-bold mb-4" style={{ color: '#1A1D2B' }}>
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-2" role="group" aria-labelledby="quiz-question">
            {shuffledOptions.map((optIdx) => {
              const isSelected = answered;
              const isCorrect = optIdx === currentQ.correctIndex;
              const bgColor = isSelected
                ? isCorrect ? '#2ECC7120' : '#EF444415'
                : '#F8F7FF';
              const borderColor = isSelected
                ? isCorrect ? '#2ECC7140' : optIdx === currentQ.correctIndex ? '#2ECC7140' : 'transparent'
                : '#EEF0F8';
              const textColor = isSelected
                ? isCorrect ? '#2ECC71' : '#EF4444'
                : '#1A1D2B';

              return (
                <motion.button
                  key={optIdx}
                  onClick={() => handleAnswer(optIdx)}
                  disabled={answered}
                  className="w-full min-h-12 p-3 rounded-xl text-sm font-semibold text-left transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    background: bgColor,
                    border: `2px solid ${borderColor}`,
                    color: textColor,
                    opacity: answered && !isCorrect && optIdx !== currentQ.correctIndex ? 0.5 : 1,
                    ['--tw-ring-color' as string]: labColor,
                  }}
                  whileHover={!answered ? { scale: 1.02, x: 4 } : {}}
                  whileTap={!answered ? { scale: 0.98 } : {}}
                >
                  {currentQ.options[optIdx]}
                </motion.button>
              );
            })}
          </div>
        </SFCard>

        {/* Feedback — aria-live on the always-mounted wrapper so screen
            readers announce each popup as it appears. */}
        <div aria-live="polite">
          <AnimatePresence>
            {feedback && <FeedbackPopup {...feedback} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
