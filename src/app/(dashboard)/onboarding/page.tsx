'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Rocket,
} from 'lucide-react';
import { useChildStore } from '@/stores/childStore';
import { useAuthStore } from '@/stores/authStore';
import { WORLDS } from '@/types';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';

// Onboarding Wizard — First-Time Parent/Child Setup
// v2 [NEW-3A]: 3-step: child profile -> pick lab -> celebrate
// v3: OnboardingCrystal3D — progressive crystal formation (C1)

// Dynamic import for 3D crystal (ssr: false required for R3F)
const OnboardingCrystal3D = dynamic(
  () => import('@/components/3d/OnboardingCrystal3D'),
  { ssr: false }
);

const FREE_LABS = WORLDS.filter((w) => w.id <= 3);

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { activeChild } = useChildStore();
  const { parent } = useAuthStore();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(10);
  const [selectedLab, setSelectedLab] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Get selected lab color for crystal tint
  const selectedLabColor = FREE_LABS.find((l) => l.id === selectedLab)?.color || '#AA66FF';

  useEffect(() => {
    if (activeChild) {
      setChildName(activeChild.display_name || '');
    }
  }, [activeChild]);

  // If already onboarded, redirect
  useEffect(() => {
    if (parent?.onboarding_complete) {
      router.push('/home');
    }
  }, [parent, router]);

  // 3D cockpit broadcast: page-navigate per step
  useEffect(() => {
    broadcast({
      type: 'page-navigate',
      source: `onboarding-step-${step}`,
      color: '#AA66FF',
      label: `ONBOARDING ${step}/3`,
      targetPage: '/onboarding',
    });
  }, [step, broadcast]);

  async function completeOnboarding() {
    setLoading(true);

    // C3: Launch sequence — broadcast game-enter + celebration
    broadcast({
      type: 'game-enter',
      source: 'onboarding-launch',
      color: selectedLabColor,
      label: 'First Lab Launch!',
    });
    broadcast({
      type: 'celebration-start',
      source: 'onboarding-complete',
      color: '#FFD700',
      label: 'Welcome to SparkForge!',
    });
    triggerCelebration('confetti', { reason: 'onboarding-complete' });

    try {
      // Mark onboarding complete via API
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingComplete: true }),
      });

      // Update child profile if needed
      if (activeChild) {
        await fetch(`/api/children/${activeChild.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_name: childName,
          }),
        });
      }

      // Brief delay for celebration effect, then navigate
      setTimeout(() => {
        router.push(`/labs/${selectedLab}`);
      }, 800);
    } catch (error) {
      console.error('Onboarding error:', error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="glass-card rounded-3xl p-8 max-w-lg w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === step
                  ? 'bg-spark-purple'
                  : s < step
                    ? 'bg-spark-green'
                    : 'bg-white/20'
              }`}
              animate={{ scale: s === step ? 1.2 : 1 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Your Explorer */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Sparkles className="w-10 h-10 text-spark-purple mx-auto mb-3" />
                <h2 className="font-display text-xl font-bold text-white">
                  Your Explorer
                </h2>
              </div>

              {activeChild ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center text-3xl font-bold text-white">
                    {activeChild.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <p className="font-display text-lg font-bold text-white">
                    {activeChild.display_name}
                  </p>
                  <p className="font-body text-white/50 text-sm">
                    Band {activeChild.age_band} · Ready to explore AI!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block font-body text-sm text-white/60 mb-1">
                      Explorer Name
                    </label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body focus:border-spark-purple/50 focus:outline-none focus:ring-1 focus:ring-spark-purple/30 transition-colors"
                      placeholder="Enter name..."
                      aria-label="Child's display name"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm text-white/60 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      min={7}
                      max={16}
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body focus:border-spark-purple/50 focus:outline-none focus:ring-1 focus:ring-spark-purple/30 transition-colors"
                      aria-label="Child's age"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!activeChild && !childName.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Pick Your First Lab */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-display text-xl font-bold text-white">
                  Pick Your First Lab
                </h2>
                <p className="font-body text-white/50 text-sm mt-1">
                  These 3 labs are free to explore!
                </p>
              </div>

              <div className="space-y-3">
                {FREE_LABS.map((lab) => (
                  <motion.button
                    key={lab.id}
                    onClick={() => {
                      setSelectedLab(lab.id);
                      broadcast({ type: 'lab-select', source: `lab-${lab.id}`, color: lab.color, label: lab.title });
                    }}
                    className={`w-full p-4 rounded-xl text-left flex items-center gap-4 transition-all ${
                      selectedLab === lab.id
                        ? 'bg-white/15 border-2 border-spark-purple/50'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${lab.color}20` }}
                    >
                      {lab.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-bold text-white">
                        {lab.title}
                      </p>
                      <p className="font-body text-xs text-white/40 truncate">
                        {lab.description}
                      </p>
                    </div>
                    {selectedLab === lab.id && (
                      <Check className="w-5 h-5 text-spark-purple flex-shrink-0" />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-display font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold flex items-center justify-center gap-2"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Launch! */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center"
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🚀
              </motion.div>

              <h2 className="font-display text-2xl font-bold text-white mb-3">
                {"You're ready!"}
              </h2>
              <p className="font-body text-white/50">
                Welcome to SparkForge, {childName || activeChild?.display_name || 'Explorer'}!
                {'\n'}Your first lab awaits.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-display font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold flex items-center justify-center gap-2 emissive-glow disabled:opacity-40"
                  style={
                    { '--glow-color': '#8B5CF6' } as React.CSSProperties
                  }
                >
                  <Rocket className="w-5 h-5" />
                  {loading ? 'Launching...' : 'Launch!'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
