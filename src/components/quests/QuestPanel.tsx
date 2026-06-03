// ════════════════════════════════════════════════════
// QuestPanel — Quest Display Panel for Home Page
// Shows 3 daily quests with Sparky greeting, weekly chain,
// and completion summary. Integrates with Phase 2 retention.
// ════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Trophy, Target, CheckCircle2, Sparkles } from 'lucide-react';
import type { ActiveQuest, WeeklyQuestChain } from '@/lib/quests/QuestEngine';
import { getQuestGreeting, allQuestsClaimed, countQuestsByStatus } from '@/lib/quests/QuestEngine';
import { QuestCard } from './QuestCard';
import { SparkyPresenter } from '@/components/sparky/SparkyPresenter';
import { SFCard } from '@/components/ui/SFCard';

interface QuestPanelProps {
  quests: ActiveQuest[];
  weeklyChain: WeeklyQuestChain | null;
  streakDays: number;
  onClaim: (questId: string) => void;
  childName: string;
}

export function QuestPanel({
  quests,
  weeklyChain,
  streakDays,
  onClaim,
  childName,
}: QuestPanelProps) {
  const statusCounts = useMemo(() => countQuestsByStatus(quests), [quests]);
  const completedCount = statusCounts.completed + statusCounts.claimed;
  const totalCount = quests.length;
  const greeting = useMemo(
    () => getQuestGreeting(completedCount, totalCount),
    [completedCount, totalCount]
  );
  const allClaimed = useMemo(() => allQuestsClaimed(quests), [quests]);

  // Sort: active first, then completed, then claimed
  const sortedQuests = useMemo(() => {
    const order = { active: 0, completed: 1, claimed: 2, expired: 3 };
    return [...quests].sort((a, b) => order[a.status] - order[b.status]);
  }, [quests]);

  return (
    <SFCard
      variant="gradient"
      className="relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23FFF'/%3E%3C/svg%3E")`,
      }} />

      {/* Header with Sparky */}
      <div className="relative z-10 mb-4">
        <SparkyPresenter
          expression={allClaimed ? 'celebrating' : completedCount > 0 ? 'happy' : 'thinking'}
          size="sm"
          message={greeting}
          childName={childName}
        />
      </div>

      {/* Completion summary bar */}
      {totalCount > 0 && (
        <motion.div
          className="flex items-center gap-3 mb-4 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/30"
          layout
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-300">
              {completedCount}/{totalCount} completed
            </span>
          </div>
          <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {allClaimed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-[10px] font-bold text-green-400"
            >
              <CheckCircle2 className="w-3 h-3" />
              All Done!
            </motion.span>
          )}
        </motion.div>
      )}

      {/* Daily Quest Cards */}
      <div className="space-y-3 mb-5">
        <AnimatePresence mode="popLayout">
          {sortedQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={onClaim}
              streakDays={streakDays}
            />
          ))}
        </AnimatePresence>

        {quests.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">
            <Scroll className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No quests available today.</p>
          </div>
        )}
      </div>

      {/* Weekly Quest Chain */}
      {weeklyChain && (
        <WeeklyChainDisplay chain={weeklyChain} />
      )}
    </SFCard>
  );
}

// ─── Weekly Chain Sub-Component ───

function WeeklyChainDisplay({ chain }: { chain: WeeklyQuestChain }) {
  const completedSteps = chain.steps.filter((s) => s.status === 'completed').length;
  const isChainComplete = chain.status === 'completed';

  return (
    <div className="border-t border-slate-700/30 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Weekly Quest Chain</h3>
        <span className="text-[10px] text-slate-500">
          {completedSteps}/{chain.totalSteps} steps
        </span>
        {isChainComplete && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-[10px] font-bold text-green-400"
          >
            <Sparkles className="w-3 h-3" />
            Complete!
          </motion.span>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {chain.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div
              className={`
                flex-1 h-2 rounded-full transition-colors duration-300
                ${step.status === 'completed'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : step.status === 'active'
                    ? 'bg-amber-500/30 animate-pulse'
                    : 'bg-slate-700'
                }
              `}
            />
            {i < chain.steps.length - 1 && (
              <div className={`w-1 h-1 rounded-full ${step.status === 'completed' ? 'bg-amber-500' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Current step detail */}
      {chain.steps[chain.currentStep - 1] && !isChainComplete && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10"
        >
          <p className="text-xs font-medium text-amber-300">
            Step {chain.currentStep}: {chain.steps[chain.currentStep - 1].title}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {chain.steps[chain.currentStep - 1].description}
          </p>
        </motion.div>
      )}
    </div>
  );
}
