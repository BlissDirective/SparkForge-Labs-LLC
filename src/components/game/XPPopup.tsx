// ════════════════════════════════════════════════════
// XP POPUP — Floating "+X XP" animation
// Renders wherever score is added. Rises and fades.
// Supports combo multipliers and streak fire effects.
// Drop-in: wrap any game's score area with <XPPopup>.
// ════════════════════════════════════════════════════
'use client';

import { useState, useCallback, createContext, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface XPEvent {
  id: string;
  amount: number;
  x: number;
  y: number;
  combo?: number;
  label?: string;
  color?: string;
}

interface XPContextType {
  showXP: (amount: number, opts?: { combo?: number; label?: string; color?: string; x?: number; y?: number }) => void;
}

const XPContext = createContext<XPContextType>({ showXP: () => {} });

export function useXPPopup() {
  return useContext(XPContext);
}

export function XPPopupProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<XPEvent[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const showXP = useCallback((amount: number, opts?: { combo?: number; label?: string; color?: string; x?: number; y?: number }) => {
    const id = `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const rect = containerRef.current?.getBoundingClientRect();
    const x = opts?.x ?? (rect ? rect.width / 2 : 150);
    const y = opts?.y ?? (rect ? rect.height * 0.4 : 200);

    setEvents(prev => [...prev, {
      id, amount, x, y,
      combo: opts?.combo,
      label: opts?.label,
      color: opts?.color,
    }]);

    // Auto-remove after animation
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== id));
    }, 1800);
  }, []);

  return (
    <XPContext.Provider value={{ showXP }}>
      <div ref={containerRef} className="relative h-full w-full">
        {children}

        {/* XP Popup Layer */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          <AnimatePresence>
            {events.map(event => (
              <motion.div
                key={event.id}
                className="absolute flex flex-col items-center"
                style={{ left: event.x, top: event.y }}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -60, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.8 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* XP amount */}
                <span
                  className="font-display font-black text-lg drop-shadow-lg"
                  style={{
                    color: event.color || '#F59E0B',
                    textShadow: `0 0 20px ${event.color || '#F59E0B'}60, 0 2px 4px rgba(0,0,0,0.3)`,
                    fontSize: event.combo && event.combo >= 3 ? '1.5rem' : '1.125rem',
                  }}
                >
                  +{event.amount} XP
                </span>

                {/* Combo indicator */}
                {event.combo && event.combo >= 2 && (
                  <motion.span
                    className="font-display text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                    style={{
                      backgroundColor: event.combo >= 5 ? 'rgba(239,68,68,0.2)' : event.combo >= 3 ? 'rgba(249,115,22,0.2)' : 'rgba(245,158,11,0.2)',
                      color: event.combo >= 5 ? '#EF4444' : event.combo >= 3 ? '#F97316' : '#F59E0B',
                      border: `1px solid ${event.combo >= 5 ? 'rgba(239,68,68,0.3)' : event.combo >= 3 ? 'rgba(249,115,22,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {event.combo >= 7 ? '\ud83d\udd25 LEGENDARY' : event.combo >= 5 ? '\ud83d\udd25 ON FIRE' : event.combo >= 3 ? '\u26a1 COMBO x' + event.combo : '\u2728 x' + event.combo}
                  </motion.span>
                )}

                {/* Custom label */}
                {event.label && (
                  <span className="font-body text-[9px] text-white/40 mt-0.5">{event.label}</span>
                )}

                {/* Sparkle particles */}
                {[...Array(event.combo && event.combo >= 3 ? 6 : 3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{ backgroundColor: event.color || '#F59E0B' }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: (i * 31 % 80) - 40,
                      y: (i * 23 % 60) - 40,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: (i * 0.04),
                    }}
                  />
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </XPContext.Provider>
  );
}
