// ════════════════════════════════════════════════════
// ADD CHILD — Create new child profile under parent
// v3 (P0-7): Light design system (the v2 Frost-Prismatic dark card
// rendered dark-on-dark inside the light dashboard), child count from
// React Query (parentStore.children was never hydrated, so the tier
// check lied), creation via useCreateChild (updates the cache and
// auto-selects the first child), success → /home.
// ════════════════════════════════════════════════════
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useChildren, useCreateChild } from '@/hooks/useChildren';
import { useParentStore } from '@/stores/parentStore';
import { getTierLimits, TIER_DISPLAY } from '@/lib/tier-config';
import { SFButton } from '@/components/ui/SFButton';
import BlurText from '@/components/bits/BlurText';
import GlareHover from '@/components/bits/GlareHover';
import { SparkyCore } from '@/components/sparky';

const AGE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 7);

const BAND_INFO: Record<'A' | 'B' | 'C', { label: string; color: string; emoji: string }> = {
  A: { label: '7–10 (Explorer)', color: '#2563EB', emoji: '🔭' },
  B: { label: '11–13 (Adventurer)', color: '#7C3AED', emoji: '🧭' },
  C: { label: '14–16 (Pioneer)', color: '#B45309', emoji: '🚀' },
};

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

function generateConfetti(count: number): ConfettiParticle[] {
  const colors = ['#4F6EF7', '#2ECC71', '#E945F5', '#FF6B35', '#FFAA44', '#FF66AA'];
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
  const tier = useParentStore((s) => s.tier);
  const limits = getTierLimits(tier);
  const { data: children, isLoading: childrenLoading } = useChildren();
  const createChild = useCreateChild();

  const [name, setName] = useState('');
  const [age, setAge] = useState(10);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles] = useState(() => generateConfetti(30));

  const ageBand: 'A' | 'B' | 'C' = age <= 10 ? 'A' : age <= 13 ? 'B' : 'C';
  const bandInfo = BAND_INFO[ageBand];
  const childCount = children?.length ?? 0;
  const atLimit = !childrenLoading && childCount >= limits.maxChildren;
  const saving = createChild.isPending;

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (saving || atLimit) return;
    if (!trimmed) {
      setError('Pick a nickname first — anything fun works!');
      return;
    }
    setError('');

    try {
      await createChild.mutateAsync({ displayName: trimmed, ageBand, age });
      setShowConfetti(true);
      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      if (/limit/i.test(message)) {
        setError('Your current plan has reached its child profile limit. Upgrade to add more profiles.');
      } else {
        setError(message || 'Something went wrong — please try again.');
      }
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Confetti burst overlay */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                className="fixed w-3 h-3 rounded-sm pointer-events-none z-50"
                style={{ left: `${p.x}%`, top: '50%', backgroundColor: p.color }}
                initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  y: [0, -300 - Math.random() * 200, 600],
                  x: [0, (Math.random() - 0.5) * 200],
                  opacity: [1, 1, 0],
                  rotate: p.rotation + 720,
                  scale: [1, 1.2, 0.5],
                }}
                transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
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
                <p className="font-display text-xl font-bold" style={{ color: '#1A1D2B' }}>
                  Profile Created!
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        className="rounded-2xl p-6 md:p-8 max-w-md w-full"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E6E9F4',
          boxShadow: '0 8px 30px rgba(26,29,43,0.08)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back link */}
        <Link href="/parent">
          <motion.div
            className="inline-flex items-center gap-2 font-body text-sm mb-6 transition-colors"
            style={{ color: '#8C94AC' }}
            whileHover={{ x: -2 }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </motion.div>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(79,110,247,0.1)' }}
          >
            <UserPlus className="w-5 h-5" style={{ color: '#4F6EF7' }} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: '#1A1D2B' }}>
              <BlurText text="Add Child Profile" />
            </h1>
            <p className="font-body text-xs" style={{ color: '#8C94AC' }}>
              {childrenLoading
                ? 'Checking your profiles…'
                : `${childCount}/${limits.maxChildren} profiles used (${TIER_DISPLAY[tier].name})`}
            </p>
          </div>
          {/* R4: Sparky beside the header (light surface — no aura glow) */}
          <div aria-hidden="true" className="ml-auto">
            <SparkyCore expression="excited" pixelSize={64} isAnimated={false} showAura={false} />
          </div>
        </div>

        {atLimit ? (
          /* Tier limit reached */
          <div className="text-center py-8">
            <UserPlus className="w-10 h-10 mx-auto mb-3" style={{ color: '#C3C9DB' }} />
            <h2 className="font-display text-lg font-bold mb-2" style={{ color: '#1A1D2B' }}>
              Profile Limit Reached
            </h2>
            <p className="font-body text-sm mb-4" style={{ color: '#52586E' }}>
              Your {TIER_DISPLAY[tier].name} plan supports up to {limits.maxChildren} child
              profile{limits.maxChildren === 1 ? '' : 's'}.
            </p>
            <Link
              href="/parent/subscription"
              className="inline-block px-6 py-3 rounded-xl text-white font-display font-bold text-sm"
              style={{ background: 'linear-gradient(90deg, #FF6B35, #D97706)' }}
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
                className="font-body text-sm font-medium block mb-1"
                style={{ color: '#52586E' }}
              >
                Display Name
              </label>
              <input
                id="child-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                }}
                placeholder="e.g., SparkKid"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl font-body focus:outline-none focus:ring-2"
                style={{
                  background: '#F6F8FD',
                  border: '1px solid #E6E9F4',
                  color: '#1A1D2B',
                }}
                aria-label="Child display name"
              />
              <p className="font-body text-xs mt-1" style={{ color: '#8C94AC' }}>
                No real names — this is just a fun nickname
              </p>
            </div>

            {/* Age selector */}
            <div>
              <label className="font-body text-sm font-medium block mb-2" style={{ color: '#52586E' }}>
                Age
              </label>
              <div className="flex flex-wrap gap-2">
                {AGE_OPTIONS.map((a) => (
                  <motion.button
                    key={a}
                    onClick={() => setAge(a)}
                    className="w-10 h-10 rounded-lg font-display text-sm font-bold transition-all"
                    style={
                      age === a
                        ? {
                            border: '2px solid #4F6EF7',
                            background: 'rgba(79,110,247,0.12)',
                            color: '#4F6EF7',
                          }
                        : {
                            border: '1px solid #E6E9F4',
                            background: '#F6F8FD',
                            color: '#52586E',
                          }
                    }
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Age ${a}`}
                    aria-pressed={age === a}
                  >
                    {a}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Age band preview — GlareHover chrome sweep (DESIGN §7.1) */}
            <GlareHover glowColor={bandInfo.color} radius={12}>
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#F6F8FD', border: '1px solid #E6E9F4' }}
              >
                <span className="text-2xl">{bandInfo.emoji}</span>
                <div>
                  <p className="font-body text-xs" style={{ color: '#8C94AC' }}>
                    Age Band
                  </p>
                  <p className="font-display text-sm font-bold" style={{ color: bandInfo.color }}>
                    {bandInfo.label}
                  </p>
                </div>
              </div>
            </GlareHover>

            {/* Error display */}
            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl font-body text-sm"
                style={{ background: '#EF444412', color: '#DC2626', border: '1px solid #EF444430' }}
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Submit */}
            <SFButton
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              disabled={saving || showConfetti}
              onClick={() => void handleCreate()}
            >
              {showConfetti ? 'Created!' : 'Create Profile'}
            </SFButton>
          </div>
        )}
      </motion.div>
    </div>
  );
}
