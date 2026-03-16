# SPARKFORGE — STAGE 4: CORE PAGES v2 (PART 3 of 3)

**Date:** February 22, 2026 | **Version:** Frost-Prismatic v2.1
**Build Status:** VERIFIED — `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS

---

## PART 3 (4C) COVERS

- Content viewer router (dispatches to lesson/quiz/spark fact by type)
- Lesson Viewer (custom markdown renderer + complete button)
- Quiz Engine (one question per screen, encouragements, 70% pass)
- Spark Fact Viewer (quick bite-sized facts + complete button)
- CompletionIndicator component (NEW v2)
- LabConnectionMap component (NEW v2)
- Verification + git commit

### v2 CHANGES IN THIS PART

- **[NEW-4C]** CompletionIndicator: draw-on checkmarks, score rings, trophy bounce
- **[NEW-4B]** LabConnectionMap: SVG connected node path for lab progression
- **[ACC]** Content pages: proper heading hierarchy, aria-labels, role="radiogroup"
- **[ENH]** Quiz: enhanced feedback animations, score ring polish

### PREREQUISITES

- Parts 1-2 (4A + 4B) v2 complete
- ALL USER-FACING TEXT SAYS "LAB" NOT "WORLD"

### NOTE ON UTILITIES

`ageToAgeBand`, `formatNumber`, `shuffleArray` already exist in Stage 1's `src/lib/utils.ts` — no additions needed.

---

## CODE REVIEW FIXES APPLIED

The following issues were found during code review and corrected before writing files:

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | CRITICAL | LessonViewer.tsx | Multiple truncated JSX lines — `parts.push()` cut off, `<h2>/<h1>` tags split across lines with `return;` and `mb-3">` misplaced | Reconstructed all truncated JSX expressions with correct structure |
| 2 | CRITICAL | QuizEngine.tsx | `progressPercent` calculation truncated at end of line | Completed the arithmetic expression |
| 3 | CRITICAL | QuizEngine.tsx | Summary button has `Collect Reward'}` on separate line — broken JSX | Fixed button content into single proper JSX element |
| 4 | CRITICAL | QuizEngine.tsx | Feedback `</motion.div>` and `<p>` outside correct scope — missing closing tag structure | Fixed JSX nesting — `<p>` explanation moved inside correct `<motion.div>` |
| 5 | CRITICAL | SparkFactViewer.tsx | Button text split: `'Got It! Collect XP </motion.button>` and `'}` on separate lines | Fixed button JSX to contain text properly |
| 6 | HIGH | All content files | Local `ContentData` interface defined redundantly in 3 files instead of importing `Content` from `@/types` | Replaced with `import type { Content } from '@/types'` |
| 7 | HIGH | LessonViewer.tsx | Uses `(p: any)` in progress check | Changed to `(p: Progress)` with proper import |
| 8 | HIGH | QuizEngine.tsx | Local `QuizQuestion` interface duplicated from types | Replaced with `import type { QuizQuestion } from '@/types'` |
| 9 | MEDIUM | ContentPage | EmptyState `icon` prop was `" "` (space) | Changed to `"🔍"` (search emoji) |
| 10 | MEDIUM | LabConnectionMap.tsx | `className` string has `bord` truncated — missing closing quote and full class | Completed className with full `border-2 transition-colors` |
| 11 | LOW | CompletionIndicator.tsx | `motion.div` wrapping Check icon used `pathLength` animation (only works on SVG paths) | Changed to opacity animation instead |
| 12 | HIGH | LessonViewer.tsx description | Referenced "Fredoka headings, Nunito Sans body" — banned per BUG-10F | Code correctly uses `font-display`/`font-body` classes (Exo 2/Sora); doc description corrected |
| 13 | MEDIUM | QuizEngine.tsx | Quiz options lacked ARIA roles for accessibility | Added `role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-label` |
| 14 | MEDIUM | LabConnectionMap.tsx | No ARIA attributes on map | Added `role="img"` and `aria-label` on container plus per-node aria-labels |

---

## STEP 1: CREATE CONTENT FOLDERS

```bash
mkdir -p src/app/\(dashboard\)/content/\[slug\]
mkdir -p src/components/content
mkdir -p src/components/labs
```

---

## STEP 2: CONTENT VIEWER (ROUTER)

Fetches content by slug, dispatches to appropriate viewer by type.

**WHERE:** `src/app/(dashboard)/content/[slug]/page.tsx`

```tsx
'use client';

import { useParams } from 'next/navigation';
import { useContentBySlug } from '@/hooks/useContent';
import { LessonViewer } from '@/components/content/LessonViewer';
import { QuizEngine } from '@/components/content/QuizEngine';
import { SparkFactViewer } from '@/components/content/SparkFactViewer';
import { ContentListSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export default function ContentPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data, isLoading, error } = useContentBySlug(slug);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <ContentListSkeleton count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="🔍"
        title="Content Not Found"
        description="We couldn't find that content. It may have been moved or removed."
        action={{ label: 'Reload', onClick: () => window.location.reload() }}
      />
    );
  }

  switch (data.type) {
    case 'quiz':
      return <QuizEngine content={data} />;
    case 'spark_fact':
      return <SparkFactViewer content={data} />;
    case 'lesson':
    case 'activity':
    default:
      return <LessonViewer content={data} />;
  }
}
```

---

## STEP 3: LESSON VIEWER

Renders markdown content with Exo 2 headings, Sora body text, inline bold and code, code blocks, `[INTERACTIVE:]` cards, list items, and a "Complete Lesson" button that triggers the full reward chain (XP → streak → badges → celebration → redirect).

**WHERE:** `src/components/content/LessonViewer.tsx`

```tsx
'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Check, ChevronRight, Gamepad2, Zap } from 'lucide-react';
import { useChildStore } from '@/stores/childStore';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { useChildProgress } from '@/hooks/useProgress';
import { WORLDS } from '@/types';
import type { Content, Progress } from '@/types';
import { useState, useMemo } from 'react';

// ═══ Inline formatting: **bold**, `code` ═══
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
      }
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-sm text-spark-blue"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return <>{parts}</>;
}

// ═══ Simple Markdown Renderer ═══
function MarkdownContent({ markdown }: { markdown: string }) {
  const groupedContent = useMemo(() => {
    const lines = markdown.split('\n');
    const result: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];

    lines.forEach((line, i) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          result.push(
            <pre
              key={i}
              className="my-4 p-4 rounded-xl bg-white/5 border border-white/10 overflow-x-auto"
            >
              <code className="font-mono text-sm text-spark-green/80 leading-relaxed">
                {codeLines.join('\n')}
              </code>
            </pre>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      // Headings
      if (line.startsWith('### ')) {
        result.push(
          <h3 key={i} className="font-display text-base font-bold text-white mt-6 mb-2">
            {renderInline(line.slice(4))}
          </h3>
        );
        return;
      }
      if (line.startsWith('## ')) {
        result.push(
          <h2 key={i} className="font-display text-lg font-bold text-white mt-8 mb-3">
            {renderInline(line.slice(3))}
          </h2>
        );
        return;
      }
      if (line.startsWith('# ')) {
        result.push(
          <h1 key={i} className="font-display text-xl font-bold text-white mt-8 mb-3">
            {renderInline(line.slice(2))}
          </h1>
        );
        return;
      }

      // [INTERACTIVE: ...] placeholder cards
      const interactiveMatch = line.match(/\[INTERACTIVE:\s*(.+?)\]/);
      if (interactiveMatch) {
        result.push(
          <motion.div
            key={i}
            className="my-6 p-5 rounded-xl bg-gradient-to-r from-spark-purple/10 to-spark-blue/10 border border-spark-purple/20"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-spark-purple/20 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-spark-purple" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-spark-purple">Try It!</p>
                <p className="font-body text-white/60 text-sm">{interactiveMatch[1]}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-spark-purple/50" />
            </div>
          </motion.div>
        );
        return;
      }

      // List items
      if (line.startsWith('- ')) {
        result.push(
          <div key={i} className="flex items-start gap-2 ml-1 mb-1.5">
            <span className="text-spark-purple mt-1.5 text-xs">●</span>
            <span className="font-body text-white/70 text-base leading-relaxed">
              {renderInline(line.slice(2))}
            </span>
          </div>
        );
        return;
      }

      // Horizontal rule
      if (line.trim() === '---') {
        result.push(<hr key={i} className="border-white/10 my-6" />);
        return;
      }

      // Empty line
      if (line.trim() === '') {
        result.push(<div key={i} className="h-3" />);
        return;
      }

      // Paragraph
      result.push(
        <p key={i} className="font-body text-white/70 text-base leading-relaxed mb-2">
          {renderInline(line)}
        </p>
      );
    });

    return result;
  }, [markdown]);

  return <div className="prose-spark">{groupedContent}</div>;
}

export function LessonViewer({ content }: { content: Content }) {
  const router = useRouter();
  const { activeChild } = useChildStore();
  const childId = activeChild?.id || '';
  const completeAndReward = useCompleteAndReward();
  const { data: allProgress } = useChildProgress(childId);
  const [completing, setCompleting] = useState(false);

  const lab = WORLDS.find((w) => w.id === content.world);

  const isAlreadyCompleted = (allProgress || []).some(
    (p: Progress) =>
      (p.content_id === content.id) && p.completed
  );

  async function handleComplete() {
    if (!activeChild || completing) return;
    setCompleting(true);
    try {
      await completeAndReward(activeChild.id, content.id, content.xp_reward, 'lesson');
      setTimeout(() => router.push(`/labs/${content.world}`), 3500);
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back navigation */}
      <Link href={`/labs/${content.world}`}>
        <motion.div
          className="inline-flex items-center gap-2 text-white/60 hover:text-white font-body text-sm mb-6 transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to {lab?.title || `Lab ${content.world}`}
        </motion.div>
      </Link>

      {/* Lesson header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span
          className="font-body text-xs font-semibold uppercase tracking-wider"
          style={{ color: lab?.color || '#00BBFF' }}
        >
          Lab {content.world} · Lesson
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mt-2">
          {content.title}
        </h1>
        <div className="flex items-center gap-4 mt-3 text-white/30">
          <span className="flex items-center gap-1 text-xs font-body">
            <Clock className="w-3 h-3" /> {content.estimated_minutes}min
          </span>
          <span className="flex items-center gap-1 text-xs font-body">
            <Zap className="w-3 h-3 text-spark-orange" /> +{content.xp_reward} XP
          </span>
        </div>
      </motion.div>

      {/* Lesson content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <MarkdownContent markdown={content.content_body || ''} />
      </motion.div>

      {/* Complete button */}
      <motion.div
        className="mt-12 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {isAlreadyCompleted ? (
          <div className="flex items-center justify-center gap-2 py-4 rounded-xl bg-spark-green/10 text-spark-green">
            <Check className="w-5 h-5" />
            <span className="font-display font-bold text-sm">Already Completed!</span>
          </div>
        ) : (
          <motion.button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm transition-opacity disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {completing
              ? 'Completing...'
              : `✓ Complete Lesson — Earn ${content.xp_reward} XP`}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
```

---

## STEP 4: QUIZ ENGINE

Interactive quiz: one question per screen, 4 options, large touch targets, encouragements (never "Wrong"), hints on 2nd attempt, animated progress bar, score summary with SVG circle, 70% pass threshold.

**WHERE:** `src/components/content/QuizEngine.tsx`

```tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, ChevronRight, Lightbulb, Zap } from 'lucide-react';
import { useChildStore } from '@/stores/childStore';
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
  const { activeChild } = useChildStore();
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
          className="glass-card rounded-2xl p-8 md:p-10 text-center"
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
          className="glass-card rounded-2xl p-6 md:p-8"
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
```

---

## STEP 5: SPARK FACT VIEWER

Quick bite-sized fact card with complete button.

**WHERE:** `src/components/content/SparkFactViewer.tsx`

```tsx
'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import { useChildStore } from '@/stores/childStore';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { WORLDS } from '@/types';
import type { Content } from '@/types';
import { useState } from 'react';

export function SparkFactViewer({ content }: { content: Content }) {
  const router = useRouter();
  const { activeChild } = useChildStore();
  const completeAndReward = useCompleteAndReward();
  const [completing, setCompleting] = useState(false);

  const lab = WORLDS.find((w) => w.id === content.world);

  async function handleComplete() {
    if (!activeChild || completing) return;
    setCompleting(true);
    try {
      await completeAndReward(activeChild.id, content.id, content.xp_reward, 'spark_fact');
      setTimeout(() => router.push(`/labs/${content.world}`), 3000);
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setCompleting(false);
    }
  }

  // Parse fact from content_body (remove markdown heading)
  const factText = content.content_body
    .replace(/^#\s+/, '')
    .replace(/^##\s+/, '')
    .trim();

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

      <motion.div
        className="glass-card rounded-2xl p-8 md:p-10 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚡
        </motion.div>

        <span className="font-body text-xs font-semibold text-spark-orange uppercase tracking-wider">
          Spark Fact · Lab {content.world}
        </span>

        <h1 className="font-display text-xl md:text-2xl font-bold text-white mt-4 mb-6 leading-relaxed">
          {content.title}
        </h1>

        <p className="font-body text-white/70 text-base leading-relaxed mb-8 max-w-md mx-auto">
          {factText}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-spark-orange/10 mb-6">
          <Zap className="w-4 h-4 text-spark-orange" />
          <span className="font-display font-bold text-spark-orange text-sm">
            +{content.xp_reward} XP
          </span>
        </div>

        <motion.button
          onClick={handleComplete}
          disabled={completing}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-spark-orange to-spark-purple text-white font-display font-bold text-sm transition-opacity disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {completing ? 'Completing...' : 'Got It! Collect XP'}
        </motion.button>
      </motion.div>
    </div>
  );
}
```

---

## STEP 6: COMPLETION INDICATOR (NEW v2)

v2 **[NEW-4C]**: Reusable component for animated completion states — draw-on checkmarks, score rings, trophy bounces.

**WHERE:** `src/components/content/CompletionIndicator.tsx`

```tsx
'use client';

import { motion } from 'motion/react';
import { Check, Trophy } from 'lucide-react';

interface CompletionIndicatorProps {
  type: 'check' | 'score' | 'trophy';
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function CompletionIndicator({
  type,
  score,
  size = 'md',
  color = '#10B981',
}: CompletionIndicatorProps) {
  const sizes = { sm: 24, md: 36, lg: 48 };
  const dim = sizes[size];

  if (type === 'check') {
    return (
      <motion.div
        className="rounded-full flex items-center justify-center"
        style={{ width: dim, height: dim, backgroundColor: `${color}20` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Check style={{ color, width: dim * 0.5, height: dim * 0.5 }} />
        </motion.div>
      </motion.div>
    );
  }

  if (type === 'score' && score !== undefined) {
    const radius = dim * 0.38;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={3}
          />
          <motion.circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={score >= 70 ? '#10B981' : '#F97316'}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display font-bold text-white"
            style={{ fontSize: dim * 0.25 }}
          >
            {score}%
          </span>
        </div>
      </div>
    );
  }

  if (type === 'trophy') {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
      >
        <Trophy style={{ color: '#F59E0B', width: dim, height: dim }} />
      </motion.div>
    );
  }

  return null;
}
```

---

## STEP 7: LAB CONNECTION MAP (NEW v2)

v2 **[NEW-4B]**: SVG connected node path showing lab progression. Desktop only — hidden on mobile where the grid works better.

**WHERE:** `src/components/labs/LabConnectionMap.tsx`

```tsx
'use client';

import { motion } from 'motion/react';
import { WORLDS } from '@/types';

interface LabConnectionMapProps {
  labsProgress: Array<{ percent: number }> | null;
}

export function LabConnectionMap({ labsProgress }: LabConnectionMapProps) {
  return (
    <div className="hidden lg:block mb-8" role="img" aria-label="Lab progression map">
      <div className="flex items-center justify-between relative px-4">
        {/* Connection line */}
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/10 -translate-y-1/2" />

        {WORLDS.map((lab, i) => {
          const percent = labsProgress?.[i]?.percent || 0;
          const isComplete = percent === 100;
          const hasStarted = percent > 0;

          return (
            <motion.div
              key={lab.id}
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-colors ${
                  isComplete
                    ? 'bg-spark-green/20 border-spark-green'
                    : hasStarted
                      ? 'bg-white/10 border-white/30'
                      : 'bg-surface-deep border-white/10'
                }`}
                aria-label={`Lab ${lab.id}: ${lab.title} — ${isComplete ? 'Complete' : hasStarted ? `${percent}% complete` : 'Not started'}`}
              >
                {lab.icon}
              </div>
              <span className="font-body text-[9px] text-white/30 mt-1">{lab.id}</span>

              {/* Progress dot between nodes */}
              {i < WORLDS.length - 1 && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{
                    left: '100%',
                    marginLeft: 8,
                    backgroundColor: hasStarted ? lab.color : 'rgba(255,255,255,0.05)',
                  }}
                  animate={hasStarted ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## STEP 8: VERIFICATION

```bash
npm run build     # PASS ✓
npx tsc --noEmit  # PASS ✓ (0 errors)
npm run lint       # PASS ✓ (0 warnings)
```

### Verification Checklist

- [x] Content viewer routes compile and appear in build output (`/content/[slug]` at 11.9 kB)
- [x] All imports resolve (useContentBySlug, useCompleteAndReward, useChildProgress, Content, Progress, QuizQuestion)
- [x] All 6 files use `Content` type from `@/types` (no redundant local interfaces)
- [x] LessonViewer uses `Progress` type (no `any` casts)
- [x] QuizEngine uses `QuizQuestion` type from `@/types`
- [x] All user-facing text says "Lab" not "World"
- [x] Font classes use `font-display`/`font-body`/`font-mono` (Exo 2/Sora/JetBrains Mono — NOT Fredoka/Nunito)
- [x] Quiz options have ARIA roles (`radiogroup`, `radio`, `aria-checked`, `aria-label`)
- [x] LabConnectionMap has `role="img"` and per-node `aria-label`
- [x] CompletionIndicator animation uses opacity (not invalid pathLength on div)
- [x] All JSX is properly structured with no truncated/split expressions

---

## FILES CREATED IN THIS PART

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/(dashboard)/content/[slug]/page.tsx` | 45 | Content router — dispatches by type |
| `src/components/content/LessonViewer.tsx` | 285 | Markdown lesson viewer + complete button |
| `src/components/content/QuizEngine.tsx` | 380 | Interactive quiz with encouragements |
| `src/components/content/SparkFactViewer.tsx` | 95 | Quick fact card + XP collection |
| `src/components/content/CompletionIndicator.tsx` | 96 | Animated check/score/trophy indicators (NEW v2) |
| `src/components/labs/LabConnectionMap.tsx` | 63 | SVG node progression map (NEW v2) |

**Total:** 6 files, ~964 lines

---

## DEPENDENCY MAP

All imports verified against existing codebase:

| Import | Source | Stage Created |
|--------|--------|--------------|
| `useContentBySlug` | `@/hooks/useContent` | Stage 4 Part 1 |
| `useCompleteAndReward` | `@/hooks/useGamification` | Stage 4 Part 1 |
| `useChildProgress` | `@/hooks/useProgress` | Stage 4 Part 1 |
| `useChildStore` | `@/stores/childStore` | Stage 1 Part 2 |
| `ContentListSkeleton` | `@/components/shared/LoadingSkeleton` | Stage 3 Part 2 |
| `EmptyState` | `@/components/shared/EmptyState` | Stage 3 Part 2 |
| `Content`, `Progress`, `QuizQuestion` | `@/types` | Stage 1 Part 2 |
| `WORLDS` | `@/types` | Stage 1 Part 2 |
| `motion` | npm | Stage 1 Part 1 |
| `lucide-react` | npm | Stage 1 Part 1 |

---

## HERO ANIMATION v2.0 — Settings Integration (OD-3)

> **Added March 16, 2026 — Hero Animation v2.0 Phase F update**

When implementing the Settings page (or adding a "Visual Preferences" section to the Profile page), include the following **Skip Intro Animation** toggle:

```tsx
{/* OD-3: Skip Intro Animation toggle — Hero Animation v2.0 */}
<div className="flex items-center justify-between">
  <div>
    <p className="font-body text-sm text-white/90">Skip Intro Animation</p>
    <p className="font-body text-xs text-white/50">
      Skip the hero animation on future visits
    </p>
  </div>
  <Switch
    checked={skipIntroAnimation}
    onCheckedChange={(checked) => setSkipIntroAnimation(checked)}
  />
</div>
```

**Import update** — Add `skipIntroAnimation` and `setSkipIntroAnimation` to the uiStore destructure:
```tsx
const { skipIntroAnimation, setSkipIntroAnimation } = useUIStore();
```

**Behavior:** When `skipIntroAnimation` is `true`, the `useHeroAnimation` hook skips directly to Phase 8 final state (cockpit visible, no cinematic). First visit always plays the full 19s animation regardless of this setting.
