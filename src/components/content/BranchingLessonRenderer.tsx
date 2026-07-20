'use client';

// ════════════════════════════════════════════════════
// BRANCHING LESSON RENDERER — Phase 4: Interactive decision-tree lessons
// Walks through BranchNode[] tree with choices, content, outcomes
// Supports: content nodes, choice nodes, outcome nodes, interactive nodes
// ════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, ArrowLeft, RotateCcw, CheckCircle2,
  GitBranch, BookOpen, Lightbulb, Gamepad2, Award,
} from 'lucide-react';
import { useBranchingLesson } from '@/hooks/useBranchingLesson';
import type { BranchNode } from '@/types';

interface BranchingLessonRendererProps {
  title: string;
  nodes: BranchNode[];
  entryNodeId: string;
  estimatedPaths?: number;
  learningOutcomes?: string[];
  xpReward?: number;
  onComplete?: () => void;
}

export default function BranchingLessonRenderer({
  title,
  nodes,
  entryNodeId,
  estimatedPaths = 3,
  learningOutcomes = [],
  xpReward = 25,
  onComplete,
}: BranchingLessonRendererProps) {
  const lesson = useBranchingLesson(nodes, entryNodeId, estimatedPaths);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header + Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-pink-400" />
          <h2 className="font-display text-lg text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {lesson.canGoBack && (
            <button
              onClick={lesson.goBack}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </button>
          )}
          <button
            onClick={lesson.restart}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Restart lesson"
          >
            <RotateCcw className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${lesson.progress * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Current Node */}
      <AnimatePresence mode="wait">
        {lesson.currentNode && (
          <motion.div
            key={lesson.currentNodeId}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <NodeRenderer
              node={lesson.currentNode}
              onChoice={lesson.makeChoice}
              isComplete={lesson.isComplete}
              onComplete={onComplete}
              xpReward={xpReward}
              learningOutcomes={learningOutcomes}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Path breadcrumbs */}
      <div className="flex items-center gap-1 text-xs text-white/55 font-mono overflow-x-auto">
        {lesson.path.map((nodeId, i) => (
          <span key={nodeId} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            <span className={nodeId === lesson.currentNodeId ? 'text-pink-400/60' : ''}>
              {nodeId}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Node Renderer ────────────────────────────────

function NodeRenderer({
  node,
  onChoice,
  isComplete,
  onComplete,
  xpReward,
  learningOutcomes,
}: {
  node: BranchNode;
  onChoice: (nextNodeId: string, label: string) => void;
  isComplete: boolean;
  onComplete?: () => void;
  xpReward: number;
  learningOutcomes: string[];
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-5">
      {/* Node type badge */}
      <div className="flex items-center gap-2">
        <NodeTypeIcon type={node.type} />
        <span className="text-xs font-data text-white/70 uppercase tracking-wider">
          {node.type === 'content' && 'Learn'}
          {node.type === 'choice' && 'Your Choice'}
          {node.type === 'outcome' && 'Outcome'}
          {node.type === 'interactive' && 'Try It'}
        </span>
      </div>

      {/* Content body — rendered as styled markdown-ish text */}
      <div className="prose-invert text-white/80 font-body text-sm leading-relaxed space-y-3">
        {node.content_body.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {/* Interactive node embed */}
      {node.type === 'interactive' && node.interactive_config && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gamepad2 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-data text-green-400/80 uppercase">
              Interactive: {node.interactive_config.type}
            </span>
          </div>
          <div className="text-white/50 text-sm font-body italic">
            Interactive {node.interactive_config.type} element
          </div>
        </div>
      )}

      {/* Choice buttons */}
      {node.choices && node.choices.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-white/70 font-body">What would you do?</p>
          {node.choices.map((choice) => (
            <motion.button
              key={choice.next_node_id}
              onClick={() => onChoice(choice.next_node_id, choice.label)}
              className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-400/20 hover:border-pink-400/40 transition-all duration-200 group"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-white/80 group-hover:text-white transition-colors">
                  {choice.label}
                </span>
                <ChevronRight className="w-4 h-4 text-pink-400/40 group-hover:text-pink-400 transition-colors" />
              </div>
              {choice.feedback && (
                <p className="text-xs text-white/60 mt-1">{choice.feedback}</p>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Completion state */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t border-white/10"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <span className="font-display text-lg text-green-400">Lesson Complete!</span>
          </div>

          {/* XP reward */}
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-data text-sm text-amber-400">+{xpReward} XP</span>
          </div>

          {/* Learning outcomes */}
          {learningOutcomes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/70 font-body">What you learned:</p>
              {learningOutcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 shrink-0" />
                  <span className="text-sm text-white/60 font-body">{outcome}</span>
                </div>
              ))}
            </div>
          )}

          {/* Complete button */}
          {onComplete && (
            <motion.button
              onClick={onComplete}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-display text-sm"
              whileTap={{ scale: 0.98 }}
            >
              Finish & Collect XP
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}

function NodeTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'content':
      return <BookOpen className="w-4 h-4 text-sf-console-info" />;
    case 'choice':
      return <GitBranch className="w-4 h-4 text-pink-400" />;
    case 'outcome':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case 'interactive':
      return <Gamepad2 className="w-4 h-4 text-sf-console-accent-alt" />;
    default:
      return <BookOpen className="w-4 h-4 text-white/70" />;
  }
}
