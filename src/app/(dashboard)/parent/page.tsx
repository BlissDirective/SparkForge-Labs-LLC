// ════════════════════════════════════════════════════
// PARENT DASHBOARD — Main overview
// v2: Hold+math gate, tier-config imports, time limits,
//     Frost-Prismatic styling, ARIA labels
// v3: S8 audit fixes (Batch 1-3) + 3D cockpit broadcasts (Batch 5)
// Enhancements: #1 glassmorphism shimmer on hold bar,
//   #3 haptic micro-animation on correct math, #6 aria-live errors
// ════════════════════════════════════════════════════
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { TIER_DISPLAY, getTierLimits } from '@/lib/tier-config';
import { staggerContainer, staggerItem } from '@/lib/animations';
import {
  Users, Clock, Trophy, BookOpen, Flame, Shield,
  CreditCard, BarChart3, Plus, Trash2, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/stores/toastStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

// Age band → cockpit LED color mapping
const BAND_COLORS: Record<string, string> = {
  A: '#3B82F6', // blue
  B: '#8B5CF6', // purple
  C: '#F59E0B', // amber
};

export default function ParentDashboardPage() {
  const {
    tier, children, selectedChildId, selectChild,
    isLoading, updateChildTimeLimit, setChildren,
  } = useParentDashboard();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const [verified, setVerified] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showMath, setShowMath] = useState(false);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathError, setMathError] = useState('');
  const [mathCorrect, setMathCorrect] = useState(false); // ENH #3: track correct answer
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number>(0);

  const [mathProblem] = useState(() => {
    const a = Math.floor(Math.random() * 20) + 10;
    const b = Math.floor(Math.random() * 20) + 10;
    return { a, b, answer: a + b };
  });

  // S8-WARN-001 fix: Delete child confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const selected = children.find((c) => c.id === selectedChildId);
  const tierDisplay = TIER_DISPLAY[tier];
  const tierLimits = getTierLimits(tier);

  // 3D cockpit broadcast: page-navigate on mount (amber parent theme)
  useEffect(() => {
    broadcast({
      type: 'page-navigate',
      source: 'parent-dashboard',
      color: '#FFAA44',
      label: 'PARENT',
      targetPage: '/parent',
    });
  }, [broadcast]);

  // 3D cockpit broadcast: child selection → LED rim color shift to age band
  useEffect(() => {
    if (selected) {
      broadcast({
        type: 'lab-select',
        source: `child-${selected.id}`,
        color: BAND_COLORS[selected.age_band] || '#FFAA44',
        label: selected.display_name,
      });
    }
  }, [selected, broadcast]);

  // v2 [ENH-8B]: Hold-to-reveal gate (3 second press)
  const startHold = useCallback(() => {
    holdStartRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / 3000, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        setShowMath(true);
      } else {
        holdTimerRef.current = setTimeout(tick, 50);
      }
    };
    tick();
  }, []);

  const endHold = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (!showMath) setHoldProgress(0);
  }, [showMath]);

  // ENH #3: Haptic micro-animation + ENH #6: aria-live error region
  const checkMath = useCallback(() => {
    if (parseInt(mathAnswer) === mathProblem.answer) {
      setMathCorrect(true);
      setMathError('');
      setTimeout(() => setVerified(true), 400);
    } else if (mathAnswer) {
      setMathError('Not quite — try again!');
      setMathCorrect(false);
    }
  }, [mathAnswer, mathProblem.answer]);

  // v2 [ENH-8C]: Time limit handler — saves to Supabase
  // v3 [S8-WARN-003 fix]: Error handling + rollback on failure
  async function handleTimeLimit(childId: string, minutes: number | null) {
    const previousLimit = children.find(c => c.id === childId)?.daily_time_limit_minutes ?? null;
    updateChildTimeLimit(childId, minutes);

    // 3D cockpit broadcast: dial-rotate for time limit snap
    broadcast({
      type: 'dial-rotate',
      source: 'time-limit-dial',
      value: minutes ?? 999,
      color: '#00FF88',
      label: minutes === null ? 'Unlimited' : `${minutes}m`,
    });

    const sb = createClient();
    const { error } = await sb
      .from('children')
      .update({ daily_time_limit_minutes: minutes })
      .eq('id', childId);
    if (error) {
      updateChildTimeLimit(childId, previousLimit);
      toast.error('Failed to save time limit. Please try again.');
    }
  }

  // S8-WARN-001 fix: Delete child profile handler
  async function handleDeleteChild() {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/children/${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete profile');
      } else {
        toast.success(`${deleteConfirmName}'s profile has been deleted.`);
        // Remove from local state
        const remaining = children.filter(c => c.id !== deleteConfirmId);
        setChildren(remaining);
        if (selectedChildId === deleteConfirmId && remaining.length > 0) {
          selectChild(remaining[0].id);
        }
      }
    } catch {
      toast.error('Failed to delete profile. Please try again.');
    }
    setDeleting(false);
    setDeleteConfirmId(null);
  }

  // ═══ Gate: Hold + Math ═══
  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          className="glass-card rounded-2xl p-8 max-w-sm w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Shield className="w-10 h-10 text-spark-blue mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-white mb-2">
            Parent Area
          </h1>

          <AnimatePresence mode="wait">
            {!showMath ? (
              <motion.div
                key="hold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-body text-sm text-white/50 mb-6">
                  Press and hold the button for 3 seconds
                </p>
                {/* ENH #1: Glassmorphism shimmer on hold bar */}
                <div className="relative w-full h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-spark-blue/30 to-spark-blue/60"
                    style={{ width: `${holdProgress * 100}%` }}
                  />
                  {/* ENH #1: Shimmer overlay that travels across the fill */}
                  {holdProgress > 0 && holdProgress < 1 && (
                    <motion.div
                      className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                      animate={{
                        left: ['-5rem', `${holdProgress * 100}%`],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  )}
                  <button
                    onMouseDown={startHold}
                    onMouseUp={endHold}
                    onMouseLeave={endHold}
                    onTouchStart={startHold}
                    onTouchEnd={endHold}
                    className="absolute inset-0 font-display font-bold text-sm text-white/70 z-10 backdrop-blur-[2px]"
                    aria-label="Hold for 3 seconds to access parent area"
                  >
                    {holdProgress > 0 && holdProgress < 1
                      ? `${Math.round(holdProgress * 100)}%`
                      : 'Hold to Verify'}
                  </button>
                </div>
                <p className="font-body text-xs text-white/30 mt-3">
                  This keeps curious little ones out of the parent settings
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="math"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-body text-sm text-white/50 mb-4">
                  Almost there! Solve this:
                </p>
                <p className="font-display text-2xl font-bold text-white mb-4">
                  {mathProblem.a} + {mathProblem.b} = ?
                </p>
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => {
                    setMathAnswer(e.target.value);
                    setMathError('');
                    setMathCorrect(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && checkMath()}
                  className="w-24 mx-auto block px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center font-display text-lg focus:border-spark-blue/50 focus:outline-none"
                  autoFocus
                  aria-label="Enter the sum"
                />
                {/* ENH #3: Haptic scale bounce on correct answer */}
                <motion.button
                  onClick={checkMath}
                  className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-spark-blue to-blue-600 text-white font-display font-bold text-sm"
                  whileTap={{ scale: 0.98 }}
                  animate={
                    mathCorrect
                      ? { scale: [1, 1.08, 0.95, 1.03, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    mathCorrect
                      ? { duration: 0.4, ease: 'easeOut' }
                      : undefined
                  }
                >
                  {mathCorrect ? 'Correct!' : 'Enter'}
                </motion.button>
                {/* ENH #6: aria-live region for error messages */}
                <div aria-live="polite" aria-atomic="true" className="min-h-[1.25rem] mt-2">
                  {mathError && (
                    <motion.p
                      className="font-body text-xs text-spark-orange"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {mathError}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // ═══ Loading state ═══
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-10 w-48 rounded-lg bg-white/5 animate-pulse" />
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 w-32 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  // ═══ Dashboard ═══
  return (
    <motion.div
      className="min-h-screen p-6 max-w-5xl mx-auto"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Parent Dashboard</h1>
          <p className="font-body text-sm text-white/40">
            Plan: <span className="text-spark-blue font-semibold">{tierDisplay.name}</span>
          </p>
        </div>
        <Link
          href="/parent/subscription"
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 font-body text-sm hover:border-white/20 transition-all inline-flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" /> Subscription
        </Link>
      </motion.div>

      {/* Child selector */}
      <motion.div variants={staggerItem} className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {children.map((child) => (
          <motion.button
            key={child.id}
            onClick={() => selectChild(child.id)}
            className={`flex-shrink-0 px-5 py-3 rounded-xl border-2 transition-all ${
              selectedChildId === child.id
                ? 'border-spark-blue bg-spark-blue/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
            whileTap={{ scale: 0.97 }}
            aria-label={`Select ${child.display_name}`}
            aria-pressed={selectedChildId === child.id}
          >
            <p className="font-display text-sm font-bold text-white">{child.display_name}</p>
            <p className="font-body text-xs text-white/40">
              Band {child.age_band} · Level {child.level}
            </p>
          </motion.button>
        ))}
        {children.length < tierLimits.maxChildren && (
          <Link
            href="/parent/add-child"
            className="flex-shrink-0 px-5 py-3 rounded-xl border-2 border-dashed border-white/10 text-white/40 hover:border-white/20 hover:text-white/60 transition-all inline-flex items-center gap-2"
            aria-label="Add child profile"
          >
            <Plus className="w-4 h-4" /> Add Child
          </Link>
        )}
      </motion.div>

      {/* Selected child overview */}
      {selected && (
        <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Stats grid */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total XP', value: selected.xp.toLocaleString(), icon: Trophy, color: '#FFAA44' },
              { label: 'Lessons Done', value: selected.lessons_completed, icon: BookOpen, color: '#00FF88' },
              { label: 'Time Spent', value: `${selected.total_time_minutes}m`, icon: Clock, color: '#00BBFF' },
              { label: 'Current Streak', value: `${selected.streak_count} days`, icon: Flame, color: '#FF6644' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="font-body text-xs text-white/40">{label}</span>
                </div>
                <p className="font-display text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </motion.div>

          {/* Progress overview */}
          <motion.div variants={staggerItem} className="glass-card rounded-xl p-5 mb-6">
            <h2 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-spark-blue" /> Progress Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="font-body text-xs text-white/30">Level</p>
                <p className="font-display text-lg font-bold text-white">{selected.level}</p>
              </div>
              <div>
                <p className="font-body text-xs text-white/30">Badges Earned</p>
                <p className="font-display text-lg font-bold text-spark-orange">{selected.badges_earned}</p>
              </div>
              <div>
                <p className="font-body text-xs text-white/30">Age Band</p>
                <p className="font-display text-lg font-bold text-spark-purple">
                  {selected.age_band === 'A' ? '7–10' : selected.age_band === 'B' ? '11–13' : '14–16'}
                </p>
              </div>
              <div>
                <p className="font-body text-xs text-white/30">Last Active</p>
                <p className="font-body text-sm text-white/60">
                  {selected.last_active
                    ? new Date(selected.last_active).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* v2 [ENH-8C]: Time limit selector */}
          <motion.div variants={staggerItem} className="glass-card rounded-xl p-5 mb-6">
            <h2 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-spark-green" /> Daily Time Limit
            </h2>
            <p className="font-body text-xs text-white/30 mb-3">
              Set how long {selected.display_name} can use SparkForge each day
            </p>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 60, 90, null].map((mins) => {
                const isActive = selected.daily_time_limit_minutes === mins;
                return (
                  <motion.button
                    key={String(mins)}
                    onClick={() => handleTimeLimit(selected.id, mins)}
                    className={`px-4 py-2 rounded-lg border font-body text-sm transition-all ${
                      isActive
                        ? 'border-spark-green/50 bg-spark-green/10 text-spark-green font-semibold'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}
                    whileTap={{ scale: 0.97 }}
                    aria-pressed={isActive}
                    aria-label={mins === null ? 'No time limit' : `${mins} minute daily limit`}
                  >
                    {mins === null ? 'Unlimited' : `${mins} min`}
                  </motion.button>
                );
              })}
            </div>
            {selected.daily_time_limit_minutes !== null && (
              <p className="font-body text-xs text-white/30 mt-2">
                Today: ~{selected.total_time_minutes}m used of {selected.daily_time_limit_minutes}m limit
              </p>
            )}
          </motion.div>

          {/* S8-WARN-001 fix: Delete child profile */}
          <motion.div variants={staggerItem} className="glass-card rounded-xl p-5 mb-6">
            <h2 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-spark-coral" /> Remove Profile
            </h2>
            <p className="font-body text-xs text-white/30 mb-3">
              Permanently delete {selected.display_name}&apos;s profile and all associated data.
              This action cannot be undone.
            </p>
            <motion.button
              onClick={() => {
                setDeleteConfirmId(selected.id);
                setDeleteConfirmName(selected.display_name);
              }}
              className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 font-body text-sm hover:bg-red-500/20 transition-all"
              whileTap={{ scale: 0.97 }}
              aria-label={`Delete ${selected.display_name}'s profile`}
            >
              Delete Profile
            </motion.button>
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
            <Link
              href="/parent/prompt-history"
              className="group glass-card rounded-xl p-4 hover:border-white/20 transition-all"
            >
              <p className="font-display text-sm font-bold text-white group-hover:text-spark-blue transition-colors">
                Prompt History
              </p>
              <p className="font-body text-xs text-white/30 mt-1">
                Review last 50 AI interactions
              </p>
            </Link>
            <Link
              href="/parent/export"
              className="group glass-card rounded-xl p-4 hover:border-white/20 transition-all"
            >
              <p className="font-display text-sm font-bold text-white group-hover:text-spark-green transition-colors">
                Export Report
              </p>
              <p className="font-body text-xs text-white/30 mt-1">
                Download progress as PDF
              </p>
            </Link>
          </motion.div>
        </motion.div>
      )}

      {/* S8-WARN-001: Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setDeleteConfirmId(null)}
          >
            <motion.div
              className="glass-card rounded-2xl p-6 max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="font-display text-lg font-bold text-white">
                  Delete Profile?
                </h2>
              </div>
              <p className="font-body text-sm text-white/60 mb-2">
                This will permanently delete <strong className="text-white">{deleteConfirmName}</strong>&apos;s
                profile and all associated data:
              </p>
              <ul className="font-body text-xs text-white/40 mb-4 space-y-1 list-disc list-inside">
                <li>Progress, XP, and level data</li>
                <li>Earned badges and achievements</li>
                <li>Game history and session logs</li>
                <li>Prompt history and AI interactions</li>
              </ul>
              <p className="font-body text-xs text-red-400/80 mb-4">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display text-sm hover:border-white/20 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleDeleteChild}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-display text-sm font-bold hover:bg-red-500/30 transition-all disabled:opacity-50"
                  whileTap={{ scale: 0.97 }}
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {children.length === 0 && (
        <motion.div variants={staggerItem} className="text-center py-16">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="font-display text-lg font-bold text-white mb-2">No children yet</h2>
          <p className="font-body text-sm text-white/40 mb-4">
            Add your first child to start their AI learning adventure
          </p>
          <Link
            href="/parent/add-child"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-spark-blue to-blue-600 text-white font-display font-bold text-sm"
          >
            Add Child Profile
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
