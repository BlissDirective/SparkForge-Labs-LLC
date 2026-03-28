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

  const progressArray = (allProgress || []) as Progress[];
  const isAlreadyCompleted = progressArray.some(
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
