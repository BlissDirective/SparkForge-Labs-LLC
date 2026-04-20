'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, ChevronRight, Lightbulb, Zap } from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { WORLDS } from '@/types';
import type { Content, QuizQuestion } from '@/types';

type AnswerState = 'unanswered' | 'correct' | 'incorrect' | 'hinted';

const ENCOURAGEMENTS_CORRECT = [
  'You crushed it!',
  'Nailed it!',
  'Brain power +10!',
  "You're on fire!",
  'Spot on!',
];

const ENCOURAGEMENTS_WRONG = [
  "Almost! Let's try a different approach.",
  "Interesting guess — here's a hint!",
  "Not quite — but you're thinking like a scientist!",
  "So close! Here's a clue to help:",
  'Good thinking! Let\'s try one more time.',
];

export function QuizEngine({ content }: { content: Content }) {
  const router = useRouter();
  const activeChild = useActiveChild();
  const completeAndReward = useCompleteAndReward();

  const questions: QuizQuestion[] = useMemo(
    () => content.quiz_questions || [],
    [content]
  );
  const lab = WORLDS.find((w) => w.id === content.world);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [completing, setCompleting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent =
    ((currentIndex + (answerState !== 'unanswered' ? 1 : 0)) / totalQuestions) * 100;

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (answerState === 'correct') return;
      setSelectedOption(optionIndex);

      if (optionIndex === currentQuestion.correct_index) {
        setAnswerState('correct');
        setCorrectCount((c) => c + 1);
      } else {
        setAnswerState((prev) => (prev === 'incorrect' ? 'hinted' : 'incorrect'));
      }
    },
    [answerState, currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswerState('unanswered');
      setSelectedOption(null);
    } else {
      setShowSummary(true);
    }
  }, [currentIndex, totalQuestions]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setAnswerState('unanswered');
    setSelectedOption(null);
    setCorrectCount(0);
    setShowSummary(false);
  }, []);

  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = scorePercent >= 70;

  async function handleFinish() {
    if (!activeChild || completing) return;
    setCompleting(true);
    try {
      await completeAndReward(
        activeChild.id,
        content.id,
        passed ? content.xp_reward : Math.floor(content.xp_reward * 0.5),
        'quiz',
        scorePercent
      );
      setTimeout(() => router.push(`/labs/${content.world}`), 3500);
    } catch (err) {
      console.error('Failed to complete quiz:', err);
    } finally {
      setCompleting(false);
    }
  }

  // ═══ Summary screen ═══
  if (showSummary) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          className="glass-card-v2 p-8 md:p-10 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-7xl mb-4"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6 }}
          >
            {passed ? '🏆' : '💪'}
          </motion.div>

          <h2 className="font-display text-2xl font-bold text-white mb-2">
            {passed ? 'Quiz Complete!' : 'Great Effort!'}
          </h2>

          {/* Score circle */}
          <div className="relative w-32 h-32 mx-auto my-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={passed ? '#10B981' : '#F97316'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 42 * (1 - scorePercent / 100),
                }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-3xl font-bold text-white">
                {scorePercent}%
              </span>
            </div>
          </div>

          <p className="font-body text-white/50 text-sm mb-2">
            {correctCount} of {totalQuestions} correct
          </p>

          {passed ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-spark-orange/10 mb-6">
                <Zap className="w-4 h-4 text-spark-orange" />
                <span className="font-display font-bold text-spark-orange text-sm">
                  +{content.xp_reward} XP
                </span>
              </div>
              <motion.button
                onClick={handleFinish}
                disabled={completing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-spark-green to-emerald-600 text-white font-display font-bold text-sm transition-opacity disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {completing ? 'Saving...' : 'Collect Reward'}
              </motion.button>
            </>
          ) : (
            <>
              <p className="font-body text-white/50 text-sm mb-6">
                {"You need 70% to pass. You're so close — try again!"}
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={handleRetry}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" /> Try Again
                </motion.button>
                <motion.button
                  onClick={handleFinish}
                  disabled={completing}
                  className="flex-1 py-4 rounded-xl bg-white/10 text-white font-display font-bold text-sm transition-opacity disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {completing
                    ? 'Saving...'
                    : `Collect ${Math.floor(content.xp_reward * 0.5)} XP`}
                </motion.button>
              </div>
            </>
          )}

          <Link href={`/labs/${content.world}`} className="block mt-4">
            <span className="font-body text-white/30 text-sm hover:text-white/50 transition-colors">
              Back to {lab?.title || `Lab ${content.world}`}
            </span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ═══ No questions fallback ═══
  if (!currentQuestion) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="font-body text-white/50">No quiz questions available.</p>
      </div>
    );
  }

  // ═══ Question screen ═══
  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/labs/${content.world}`}>
        <motion.div
          className="inline-flex items-center gap-2 text-white/60 hover:text-white font-body text-sm mb-6 transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to {lab?.title || `Lab ${content.world}`}
        </motion.div>
      </Link>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm text-white/50">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="font-display text-sm font-bold text-white/50">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-spark-purple to-spark-blue"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="glass-card-v2 p-6 md:p-8"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="font-display text-lg md:text-xl font-bold text-white mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3" role="radiogroup" aria-label="Answer options">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correct_index;
              const showCorrect = answerState === 'correct' && isCorrect;
              const showWrong =
                (answerState === 'incorrect' || answerState === 'hinted') &&
                isSelected &&
                !isCorrect;

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={answerState === 'correct'}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Option ${String.fromCharCode(65 + idx)}: ${option}`}
                  className={`w-full min-h-[60px] px-5 py-4 rounded-xl text-left font-body text-sm transition-all ${
                    showCorrect
                      ? 'bg-spark-green/20 border-2 border-spark-green text-white'
                      : showWrong
                        ? 'bg-red-500/10 border-2 border-red-400/50 text-white/60'
                        : isSelected
                          ? 'bg-white/15 border-2 border-white/30 text-white'
                          : 'bg-white/5 border-2 border-transparent text-white/80 hover:bg-white/10'
                  }`}
                  whileTap={{ scale: 0.98 }}
                  animate={showWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                  transition={showWrong ? { duration: 0.4 } : {}}
                >
                  <span className="mr-3 opacity-40">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </motion.button>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {answerState === 'correct' && (
              <motion.div
                className="mt-6 p-4 rounded-xl bg-spark-green/10 border border-spark-green/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-display text-sm font-bold text-spark-green mb-1">
                  {ENCOURAGEMENTS_CORRECT[currentIndex % ENCOURAGEMENTS_CORRECT.length]}
                </p>
                <p className="font-body text-white/60 text-xs">
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}

            {(answerState === 'incorrect' || answerState === 'hinted') && (
              <motion.div
                className="mt-6 p-4 rounded-xl bg-spark-orange/10 border border-spark-orange/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-display text-sm font-bold text-spark-orange mb-1">
                  {ENCOURAGEMENTS_WRONG[currentIndex % ENCOURAGEMENTS_WRONG.length]}
                </p>
                {answerState === 'hinted' && (
                  <p className="font-body text-white/60 text-xs flex items-center gap-1 mt-1">
                    <Lightbulb className="w-3 h-3 text-spark-orange" />
                    {currentQuestion.hint}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next button */}
          {answerState === 'correct' && (
            <motion.button
              onClick={handleNext}
              className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {currentIndex < totalQuestions - 1 ? (
                <span className="flex items-center justify-center gap-2">
                  Next Question <ChevronRight className="w-4 h-4" />
                </span>
              ) : (
                'See Results'
              )}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
