// ════════════════════════════════════════════════════════════════════════════
// SPARKY FLOATING — Dashboard Floating Assistant Wrapper
// ════════════════════════════════════════════════════════════════════════════
// Fixed bottom-right positioning with hard drop shadow, quick tip bubble,
// and chat indicator badge. Used on dashboard pages and during gameplay.
//
// Design: Transparent — floats directly on page content. No white card.
// Shadow: Hard, crisp, modern (1px blur max).

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';
import { SparkyCore, type SparkyExpression } from './SparkyCore';

export interface SparkyFloatingProps {
  expression?: SparkyExpression;
  isChatOpen: boolean;
  onClick: () => void;
  quickTip?: string;
  pulseAttention?: boolean;
  className?: string;
}

export function SparkyFloating({
  expression = 'idle',
  isChatOpen,
  onClick,
  quickTip,
  pulseAttention = false,
  className = '',
}: SparkyFloatingProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Auto-show quick tip after delay
  useEffect(() => {
    if (!quickTip) return;
    const t1 = setTimeout(() => setShowTip(true), 2500);
    const t2 = setTimeout(() => setShowTip(false), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [quickTip]);

  const glowColor = expression === 'happy' ? '#00FF88'
    : expression === 'excited' || expression === 'celebrating' ? '#FFD93D'
    : expression === 'sad' ? '#5B7FFF'
    : '#00D2FF';

  return (
    <div
      className={`fixed bottom-5 right-5 z-[500] flex flex-col items-end gap-2 ${className}`}
      style={{ pointerEvents: 'none' }}
    >
      {/* ═══ Quick Tip Bubble ═══ */}
      <AnimatePresence>
        {showTip && quickTip && !isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="pointer-events-auto mb-1 max-w-[200px]"
          >
            <div
              className="relative px-3.5 py-2.5 rounded-2xl rounded-br-sm text-xs font-medium"
              style={{
                background: 'rgba(10, 15, 30, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#E8ECF4',
                border: `1px solid ${glowColor}30`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${glowColor}15`,
              }}
            >
              {quickTip}
              <button
                onClick={(e) => { e.stopPropagation(); setShowTip(false); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#1A2035] border border-[#2A3050] hover:bg-[#252D45] transition-colors"
                aria-label="Dismiss tip"
              >
                <X className="w-2.5 h-2.5 text-[#8C94AC]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Sparky Orb with Shadow ═══ */}
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={
          pulseAttention && !isChatOpen
            ? { scale: [1, 1.04, 1] }
            : {}
        }
        transition={
          pulseAttention
            ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 350, damping: 20 }
        }
        className="pointer-events-auto relative"
        style={{ width: 72, height: 78 }}
        aria-label={isChatOpen ? 'Close Sparky chat' : 'Open Sparky chat'}
      >
        {/* Hard Drop Shadow — crisp, modern, 1px blur */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            bottom: -4,
            width: 48,
            height: 10,
            background:
              'radial-gradient(ellipse, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.08) 50%, transparent 70%)',
            filter: 'blur(1px)',
            transform: isHovered
              ? 'translateX(-50%) scaleX(0.7)'
              : 'translateX(-50%) scaleX(1)',
            transition: 'transform 0.3s ease',
          }}
        />

        {/* Ambient Aura */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${glowColor}18 0%, ${glowColor}06 40%, transparent 70%)`,
            transform: 'scale(1.6)',
            filter: 'blur(6px)',
          }}
          animate={{
            opacity: isHovered ? 1 : 0.55,
            scale: isHovered ? 1.9 : 1.6,
          }}
          transition={{ duration: 0.4 }}
        />

        {/* Sparky Core — md size */}
        <div
          style={{
            transform: isHovered
              ? 'rotateX(-6deg) rotateY(8deg) scale(1.02)'
              : undefined,
            transition: 'transform 0.35s ease',
          }}
        >
          <SparkyCore
            expression={expression}
            size="md"
            glowColor={glowColor}
            showAura={false}
          />
        </div>

        {/* Chat indicator badge */}
        {!isChatOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, delay: 0.5 }}
            className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
              boxShadow: '0 2px 6px rgba(233,69,245,0.4)',
            }}
          >
            <MessageCircle className="w-[10px] h-[10px] text-white" />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
