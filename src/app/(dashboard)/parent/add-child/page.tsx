// ════════════════════════════════════════════════════
// ADD CHILD — Create new child profile under parent
// v2: Tier limit check, Frost-Prismatic, ARIA, band preview
// Enhancement #4: Confetti burst on successful child creation
// ════════════════════════════════════════════════════
'use client';

import { useState, useCallback } from 'react';
import { csrfHeader } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useParentStore } from '@/stores/parentStore';
import { getTierLimits, TIER_DISPLAY } from '@/lib/tier-config';

const AGE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 7);

const BAND_INFO: Record<'A' | 'B' | 'C', { label: string; color: string; emoji: string }> = {
  A: { label: '7–10 (Explorer)', color: '#3B82F6', emoji: '🔭' },
  B: { label: '11–13 (Adventurer)', color: '#8B5CF6', emoji: '🧭' },
  C: { label: '14–16 (Pioneer)', color: '#F59E0B', emoji: '🚀' },
};

// ENH #4: Confetti particle config
interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

function generateConfetti(count: number): ConfettiParticle[] {
  const colors = ['#00BBFF', '#00FF88', '#AA66FF', '#FF6644', '#FFAA44', '#FF66AA'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[i % colors.length],
    delay: Math.random() * 0.3,
    rotation: Math.random() * 360,
  }));
}

export default function AddChildPage() {
  const router = useRouter();
  const { tier, children } = useParentStore();
  const limits = getTierLimits(tier);

  const [name, setName] = useState('');
  const [age, setAge] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false); // ENH #4
  const [confettiParticles] = useState(() => generateConfetti(30)); // ENH #4

  const ageBand: 'A' | 'B' | 'C' = age <= 10 ? 'A' : age <= 13 ? 'B' : 'C';
  const bandInfo = BAND_INFO[ageBand];
  const atLimit = children.length >= limits.maxChildren;

  const handleCreate = useCallback(async () => {
    if (!name.trim() || saving || atLimit) return;
    setSaving(true);
    setError('');

    try {
      // S8-WARN-005 fix: Route through API for server-side validation + tier limit enforcement
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          displayName: name.trim(),
          age,
          ageBand,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        // DASH-08: Parse error codes for tier-specific messages
        const errorMsg = result.error || 'Failed to create profile';
        if (result.code === 'TIER_LIMIT' || errorMsg.toLowerCase().includes('limit')) {
          setError('Your current plan has reached its child profile limit. Upgrade to add more profiles.');
        } else if (result.code === 'VALIDATION_ERROR' || res.status === 422) {
          setError(result.error || 'Please check the form fields and try again.');
        } else {
          setError(errorMsg);
        }
        setSaving(false);
      } else {
        // ENH #4: Show confetti, then navigate
        setShowConfetti(true);
        setTimeout(() => {
          router.push('/parent');
        }, 1500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      setError(message);
      setSaving(false);
    }
  }, [name, saving, atLimit, age, ageBand, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      {/* ENH #4: Confetti burst overlay */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                className="fixed w-3 h-3 rounded-sm pointer-events-none z-50"
                style={{
                  left: `${p.x}%`,
                  top: '50%',
                  backgroundColor: p.color,
                }}
                initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  y: [0, -300 - Math.random() * 200, 600],
                  x: [0, (Math.random() - 0.5) * 200],
                  opacity: [1, 1, 0],
                  rotate: p.rotation + 720,
                  scale: [1, 1.2, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
                exit={{ opacity: 0 }}
              />
            ))}
            <motion.div
              className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <motion.div
                  className="text-6xl mb-2"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  🎉
                </motion.div>
                <p className="font-display text-xl font-bold text-white">
                  Profile Created!
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-8 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back link */}
        <Link href="/parent">
          <motion.div
            className="inline-flex items-center gap-2 text-white/60 hover:text-white font-body text-sm mb-6 transition-colors"
            whileHover={{ x: -2 }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </motion.div>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-spark-blue/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-spark-blue" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Add Child Profile</h1>
            <p className="font-body text-xs text-white/70">
              {children.length}/{limits.maxChildren} profiles used ({TIER_DISPLAY[tier].name})
            </p>
          </div>
        </div>

        {atLimit ? (
          /* Tier limit reached */
          <div className="text-center py-8">
            <UserPlus className="w-10 h-10 text-white/55 mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold text-white mb-2">
              Profile Limit Reached
            </h2>
            <p className="font-body text-sm text-white/70 mb-4">
              Your {TIER_DISPLAY[tier].name} plan supports up to {limits.maxChildren} child
              profile{limits.maxChildren === 1 ? '' : 's'}.
            </p>
            <Link
              href="/parent/subscription"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-spark-orange to-amber-600 text-white font-display font-bold text-sm"
            >
              Upgrade for More Profiles
            </Link>
          </div>
        ) : (
          /* Create form */
          <div className="space-y-5">
            {/* Display name */}
            <div>
              <label
                htmlFor="child-name"
                className="font-body text-sm text-white/60 block mb-1"
              >
                Display Name
              </label>
              <input
                id="child-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., SparkKid"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body placeholder:text-white/55 focus:border-spark-blue/50 focus:outline-none"
                aria-label="Child display name"
              />
              <p className="font-body text-xs text-white/55 mt-1">
                No real names — this is just a fun nickname
              </p>
            </div>

            {/* Age selector */}
            <div>
              <label className="font-body text-sm text-white/60 block mb-2">
                Age
              </label>
              <div className="flex flex-wrap gap-2">
                {AGE_OPTIONS.map((a) => (
                  <motion.button
                    key={a}
                    onClick={() => setAge(a)}
                    className={`w-10 h-10 rounded-lg border font-display text-sm font-bold transition-all ${
                      age === a
                        ? 'border-spark-blue/50 bg-spark-blue/20 text-spark-blue'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Age ${a}`}
                    aria-pressed={age === a}
                  >
                    {a}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Age band preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-2xl">{bandInfo.emoji}</span>
              <div>
                <p className="font-body text-xs text-white/70">Age Band</p>
                <p
                  className="font-display text-sm font-bold"
                  style={{ color: bandInfo.color }}
                >
                  {bandInfo.label}
                </p>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <p className="font-body text-sm text-spark-coral" aria-live="polite">
                {error}
              </p>
            )}

            {/* Submit button */}
            <motion.button
              onClick={handleCreate}
              disabled={saving || !name.trim() || showConfetti}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-spark-blue to-blue-600 text-white font-display font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              whileTap={{ scale: 0.98 }}
            >
              {saving ? 'Creating...' : showConfetti ? 'Created!' : 'Create Profile'}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
