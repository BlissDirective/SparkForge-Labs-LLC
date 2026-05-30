// ════════════════════════════════════════════════════════════════
// JUICE PROVIDER — Game Juice System Context
// Wraps gameplay to provide combo tracking, floating text,
// Sparky reactions, screen shake, and milestone popups.
// ════════════════════════════════════════════════════════════════

'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { JuiceState, JuiceEvent } from '@/lib/juice/GameJuiceEngine';
import {
  createJuiceState,
  recordCorrect,
  recordWrong,
  recordHintUsed,
  getComboTier,
  getComboLabel,
  getSparkyReaction,
  getFloatingText,
  getScreenShakeIntensity,
  shouldShowSparky,
  COMBO_TIERS,
} from '@/lib/juice/GameJuiceEngine';
import type { ComboTier } from '@/lib/juice/GameJuiceEngine';
import { SparkyCore } from '@/components/sparky/SparkyCore';
import { Sparkles } from 'lucide-react';

// ─── Types ───

interface FloatingTextItem {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  size: 'sm' | 'md' | 'lg';
}

interface MilestonePopupItem {
  id: string;
  title: string;
  message: string;
  emoji: string;
  color: string;
}

interface SparkyReactionItem {
  id: string;
  expression: string;
  message: string;
}

interface JuiceContextValue {
  juiceState: JuiceState;
  onCorrect: (round: number, score: number, x?: number, y?: number) => void;
  onWrong: (round: number, score: number, x?: number, y?: number) => void;
  onHintUsed: (round: number, score: number) => void;
  resetJuice: () => void;
  comboTier: ComboTier | null;
}

const JuiceContext = createContext<JuiceContextValue>({
  juiceState: createJuiceState(),
  onCorrect: () => {},
  onWrong: () => {},
  onHintUsed: () => {},
  resetJuice: () => {},
  comboTier: null,
});

export function useJuice() {
  return useContext(JuiceContext);
}

// ─── Provider ───

export function JuiceProvider({ children }: { children: React.ReactNode }) {
  const [juiceState, setJuiceState] = useState<JuiceState>(createJuiceState);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [milestones, setMilestones] = useState<MilestonePopupItem[]>([]);
  const [sparkyReaction, setSparkyReaction] = useState<SparkyReactionItem | null>(null);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sparkyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const comboTier = getComboTier(juiceState.combo);

  const spawnFloatingText = useCallback((text: string, color: string, size: 'sm' | 'md' | 'lg', x?: number, y?: number) => {
    const id = `ft-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const rect = containerRef.current?.getBoundingClientRect();
    const fx = x ?? (rect ? rect.width / 2 + (Math.random() - 0.5) * 100 : 200);
    const fy = y ?? (rect ? rect.height * 0.5 + (Math.random() - 0.5) * 50 : 300);

    setFloatingTexts(prev => [...prev, { id, text, color, x: fx, y: fy, size }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1500);
  }, []);

  const showSparky = useCallback((expression: string, message: string) => {
    if (sparkyTimeoutRef.current) clearTimeout(sparkyTimeoutRef.current);
    const id = `sp-${Date.now()}`;
    setSparkyReaction({ id, expression, message });
    sparkyTimeoutRef.current = setTimeout(() => setSparkyReaction(null), 3000);
  }, []);

  const triggerShake = useCallback((intensity: number) => {
    setShakeIntensity(intensity);
    setTimeout(() => setShakeIntensity(0), 400);
  }, []);

  const onCorrect = useCallback((round: number, score: number, x?: number, y?: number) => {
    setJuiceState(prev => {
      const { state, events } = recordCorrect(prev, round, score);

      // Process events
      for (const event of events) {
        // Floating text
        const ft = getFloatingText(event);
        if (ft) spawnFloatingText(ft.text, ft.color, ft.size, x, y);

        // Sparky reaction
        const reaction = getSparkyReaction(event);
        if (reaction && shouldShowSparky(event)) {
          showSparky(reaction.expression, reaction.message);
        }

        // Screen shake for milestones
        const shake = getScreenShakeIntensity(event);
        if (shake > 0) triggerShake(shake);

        // Milestone popup
        if (event.type === 'combo_milestone' && event.data?.milestone) {
          const ms = event.data.milestone as { title: string; message: string; emoji: string; color: string };
          const mid = `ms-${Date.now()}`;
          setMilestones(p => [...p, { id: mid, title: ms.title, message: ms.message, emoji: ms.emoji, color: ms.color }]);
          setTimeout(() => setMilestones(p => p.filter(m => m.id !== mid)), 2500);
        }
      }

      return state;
    });
  }, [spawnFloatingText, showSparky, triggerShake]);

  const onWrong = useCallback((round: number, score: number, x?: number, y?: number) => {
    setJuiceState(prev => {
      const { state, events } = recordWrong(prev, round, score);

      for (const event of events) {
        const ft = getFloatingText(event);
        if (ft) spawnFloatingText(ft.text, ft.color, ft.size, x, y);

        const reaction = getSparkyReaction(event);
        if (reaction && shouldShowSparky(event)) {
          showSparky(reaction.expression, reaction.message);
        }

        const shake = getScreenShakeIntensity(event);
        if (shake > 0) triggerShake(shake);
      }

      return state;
    });
  }, [spawnFloatingText, showSparky, triggerShake]);

  const onHintUsed = useCallback((round: number, score: number) => {
    setJuiceState(prev => recordHintUsed(prev, round, score));
    spawnFloatingText('Hint Used', '#8B5CF6', 'sm');
  }, [spawnFloatingText]);

  const resetJuice = useCallback(() => {
    setJuiceState(createJuiceState());
    setFloatingTexts([]);
    setMilestones([]);
    setSparkyReaction(null);
    setShakeIntensity(0);
  }, []);

  return (
    <JuiceContext.Provider value={{ juiceState, onCorrect, onWrong, onHintUsed, resetJuice, comboTier }}>
      <div ref={containerRef} className="relative h-full w-full overflow-hidden">
        {/* Screen shake wrapper */}
        <motion.div
          animate={shakeIntensity > 0 ? {
            x: [0, -3, 3, -2, 2, 0],
            y: [0, 2, -2, 1, -1, 0],
          } : { x: 0, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full w-full"
        >
          {children}
        </motion.div>

        {/* Combo display */}
        <ComboDisplay combo={juiceState.combo} tier={comboTier} />

        {/* Floating texts */}
        <AnimatePresence>
          {floatingTexts.map(ft => (
            <FloatingText key={ft.id} {...ft} />
          ))}
        </AnimatePresence>

        {/* Milestone popups */}
        <AnimatePresence>
          {milestones.map(ms => (
            <MilestonePopup key={ms.id} {...ms} />
          ))}
        </AnimatePresence>

        {/* Sparky reaction */}
        <AnimatePresence>
          {sparkyReaction && (
            <SparkyGameReaction
              expression={sparkyReaction.expression}
              message={sparkyReaction.message}
              onDismiss={() => setSparkyReaction(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </JuiceContext.Provider>
  );
}

// ─── Combo Display ───

function ComboDisplay({ combo, tier }: { combo: number; tier: ReturnType<typeof getComboTier> }) {
  if (combo < 2) return null;

  return (
    <motion.div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      initial={{ opacity: 0, y: -20, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
    >
      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-full border"
        style={{
          background: `linear-gradient(135deg, ${tier?.color || '#F59E0B'}20, ${tier?.color || '#F59E0B'}08)`,
          borderColor: `${tier?.color || '#F59E0B'}40`,
          boxShadow: `0 0 20px ${tier?.color || '#F59E0B'}${Math.floor((tier?.glowIntensity || 0.2) * 255).toString(16).padStart(2, '0')}`,
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        <span className="text-lg">{tier?.emoji || '🔥'}</span>
        <span className="text-sm font-bold text-white">{combo}x</span>
        <span className="text-xs font-semibold" style={{ color: tier?.color || '#F59E0B' }}>
          {tier?.label || 'Combo'}
        </span>
      </motion.div>
    </motion.div>
  );
}

// ─── Floating Text ───

function FloatingText({ text, color, x, y, size }: FloatingTextItem) {
  const sizeClass = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm';

  return (
    <motion.div
      className={`absolute z-50 pointer-events-none font-bold ${sizeClass}`}
      style={{ left: x, top: y, color, textShadow: `0 0 10px ${color}80` }}
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -60, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      {text}
    </motion.div>
  );
}

// ─── Milestone Popup ───

function MilestonePopup({ title, message, emoji, color }: MilestonePopupItem) {
  return (
    <motion.div
      className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center px-8 py-6 rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
          borderColor: `${color}30`,
          boxShadow: `0 0 40px ${color}20`,
        }}
        initial={{ scale: 0.3, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <motion.span
          className="text-5xl block mb-2"
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5 }}
        >
          {emoji}
        </motion.span>
        <h3 className="text-xl font-black text-white mb-1" style={{ textShadow: `0 0 20px ${color}` }}>
          {title}
        </h3>
        <p className="text-sm font-medium" style={{ color: `${color}CC` }}>{message}</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Sparky Game Reaction ───

function SparkyGameReaction({ expression, message, onDismiss }: { expression: string; message: string; onDismiss: () => void }) {
  return (
    <motion.div
      className="absolute bottom-4 right-4 z-[55] flex items-end gap-3"
      initial={{ opacity: 0, x: 50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Speech bubble */}
      <motion.div
        className="relative max-w-[200px] px-3 py-2 rounded-xl rounded-br-sm text-xs font-medium text-white mb-2"
        style={{
          background: 'linear-gradient(135deg, rgba(79,110,247,0.9), rgba(124,92,252,0.9))',
          boxShadow: '0 4px 16px rgba(79,110,247,0.3)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {message}
      </motion.div>

      {/* Sparky avatar */}
      <motion.button
        onClick={onDismiss}
        whileHover={{ scale: 1.1 }}
        className="shrink-0 cursor-pointer"
      >
        <SparkyCore
          expression={expression as 'happy' | 'excited' | 'sad' | 'thinking' | 'celebrating'}
          size="sm"
        />
      </motion.button>
    </motion.div>
  );
}
