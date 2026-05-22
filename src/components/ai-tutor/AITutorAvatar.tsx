// ════════════════════════════════════════════════════════════════
// AI TUTOR AVATAR — 3D Chrome Robot Orb Character
// ════════════════════════════════════════════════════════════════
// A floating chrome metallic robot orb with neon glowing seam-line
// facial features. Built entirely with CSS 3D transforms — NO Three.js.
//
// Features:
// - CSS 3D perspective transforms for depth
// - Metallic chrome gradient with animated sheen
// - Neon cyan/pink glowing seam lines for eyes and mouth
// - Idle floating animation (gentle bob)
// - Hover wobble with intensified glow
// - Click pulse animation
// - Dynamic facial expressions (happy, thinking, speaking, excited)
// - Speech bubble for quick tips

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle, X } from 'lucide-react';

export type TutorExpression = 'idle' | 'happy' | 'thinking' | 'speaking' | 'excited' | 'sleepy';

interface AITutorAvatarProps {
  expression?: TutorExpression;
  isChatOpen: boolean;
  onClick: () => void;
  quickTip?: string;
  pulseAttention?: boolean;
}

const expressionConfig: Record<TutorExpression, { eyeGlow: string; mouthCurve: number; browTilt: number }> = {
  idle:    { eyeGlow: '#00D2FF', mouthCurve: 0,   browTilt: 0 },
  happy:   { eyeGlow: '#00FF88', mouthCurve: 8,   browTilt: -3 },
  thinking:{ eyeGlow: '#FFD93D', mouthCurve: -4,  browTilt: 5 },
  speaking:{ eyeGlow: '#E945F5', mouthCurve: 4,   browTilt: 0 },
  excited: { eyeGlow: '#FF6B35', mouthCurve: 12,  browTilt: -6 },
  sleepy:  { eyeGlow: '#8B9FFF', mouthCurve: 0,   browTilt: 3 },
};

export function AITutorAvatar({
  expression = 'idle',
  isChatOpen,
  onClick,
  quickTip,
  pulseAttention = false,
}: AITutorAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const config = expressionConfig[expression];

  // Auto-show quick tip on mount (once)
  useEffect(() => {
    if (quickTip) {
      const t1 = setTimeout(() => setShowTip(true), 2000);
      const t2 = setTimeout(() => setShowTip(false), 8000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [quickTip]);

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col items-end gap-3 pointer-events-none">
      {/* ── Quick Tip Bubble ── */}
      <AnimatePresence>
        {showTip && quickTip && !isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="pointer-events-auto max-w-[220px] mb-2"
          >
            <div
              className="relative px-4 py-3 rounded-2xl rounded-br-sm text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #1A1D2B, #2A2D3F)',
                color: '#F8FAFF',
                boxShadow: '0 8px 32px rgba(0,210,255,0.15), 0 0 1px rgba(0,210,255,0.3)',
                border: '1px solid rgba(0,210,255,0.15)',
              }}
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#00D2FF' }} />
                <span className="text-xs leading-relaxed">{quickTip}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowTip(false); }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-sf-surface-inverse border border-sf-border"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D Robot Orb ── */}
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={pulseAttention && !isChatOpen ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 8px 32px rgba(0,210,255,0.2)',
            '0 8px 40px rgba(0,210,255,0.4)',
            '0 8px 32px rgba(0,210,255,0.2)',
          ],
        } : {}}
        transition={pulseAttention ? { repeat: Infinity, duration: 2 } : { type: 'spring', stiffness: 300 }}
        className="pointer-events-auto relative w-16 h-16 sm:w-20 sm:h-20 cursor-pointer"
        style={{ perspective: '400px' }}
        aria-label={isChatOpen ? 'Close AI Tutor chat' : 'Open AI Tutor chat'}
      >
        {/* Floating shadow */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full transition-all"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.2), transparent 70%)',
            filter: 'blur(2px)',
            transform: isHovered ? 'translateX(-50%) scale(0.8)' : 'translateX(-50%) scale(1)',
          }}
        />

        {/* 3D Orb Body */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Chrome metallic sphere */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: `
                radial-gradient(circle at 35% 25%, rgba(255,255,255,0.9) 0%, rgba(200,210,230,0.4) 20%, rgba(120,130,160,0.3) 50%, rgba(60,70,100,0.6) 80%, rgba(20,25,40,0.9) 100%),
                linear-gradient(135deg, #C0C8DC 0%, #8A94B0 30%, #5A6480 60%, #3A4460 100%)
              `,
              boxShadow: isHovered
                ? `0 0 30px ${config.eyeGlow}60, 0 0 60px ${config.eyeGlow}30, inset 0 -4px 12px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.3)`
                : `0 0 20px rgba(0,210,255,0.15), 0 4px 16px rgba(0,0,0,0.2), inset 0 -4px 12px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.2)`,
              transform: isHovered ? 'rotateX(-8deg) rotateY(8deg)' : 'rotateX(0deg) rotateY(0deg)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {/* Chrome highlight reflection */}
            <div
              className="absolute top-[12%] left-[18%] w-[35%] h-[25%] rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.7), rgba(255,255,255,0) 70%)',
                filter: 'blur(1px)',
              }}
            />

            {/* Bottom rim light */}
            <div
              className="absolute bottom-[5%] left-[20%] right-[20%] h-[30%] rounded-full"
              style={{
                background: `radial-gradient(ellipse at center, ${config.eyeGlow}30, transparent 70%)`,
                filter: 'blur(4px)',
              }}
            />

            {/* ── Facial Features (Neon Seam Lines) ── */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              {/* Eyes container */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Left Eye */}
                <motion.div
                  animate={expression === 'thinking' ? { height: [3, 1, 3] } : {}}
                  transition={{ repeat: expression === 'thinking' ? Infinity : 0, duration: 2 }}
                  className="relative"
                >
                  {/* Eye glow background */}
                  <div
                    className="absolute inset-0 rounded-full blur-sm"
                    style={{
                      background: config.eyeGlow,
                      opacity: 0.4,
                      width: '140%',
                      height: '140%',
                      top: '-20%',
                      left: '-20%',
                    }}
                  />
                  {/* Eye line */}
                  <div
                    className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${config.eyeGlow}, ${config.eyeGlow}80)`,
                      boxShadow: `0 0 8px ${config.eyeGlow}, 0 0 16px ${config.eyeGlow}60`,
                    }}
                  >
                    <div
                      className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white"
                      style={{ opacity: 0.8 }}
                    />
                  </div>
                </motion.div>

                {/* Right Eye */}
                <motion.div
                  animate={expression === 'thinking' ? { height: [3, 1, 3] } : {}}
                  transition={{ repeat: expression === 'thinking' ? Infinity : 0, duration: 2, delay: 0.1 }}
                  className="relative"
                >
                  <div
                    className="absolute inset-0 rounded-full blur-sm"
                    style={{
                      background: config.eyeGlow,
                      opacity: 0.4,
                      width: '140%',
                      height: '140%',
                      top: '-20%',
                      left: '-20%',
                    }}
                  />
                  <div
                    className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${config.eyeGlow}, ${config.eyeGlow}80)`,
                      boxShadow: `0 0 8px ${config.eyeGlow}, 0 0 16px ${config.eyeGlow}60`,
                    }}
                  >
                    <div
                      className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white"
                      style={{ opacity: 0.8 }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Mouth */}
              <motion.div
                animate={{ borderRadius: `0 0 ${Math.abs(config.mouthCurve) + 8}px ${Math.abs(config.mouthCurve) + 8}px` }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-5 sm:w-6 mt-0.5"
                style={{
                  height: config.mouthCurve >= 0 ? `${config.mouthCurve + 3}px` : `${Math.abs(config.mouthCurve) + 3}px`,
                  background: config.mouthCurve >= 0
                    ? `linear-gradient(180deg, transparent, ${config.eyeGlow}60)`
                    : `linear-gradient(0deg, transparent, ${config.eyeGlow}40)`,
                  boxShadow: `0 0 6px ${config.eyeGlow}80`,
                  border: `1px solid ${config.eyeGlow}60`,
                  borderTop: config.mouthCurve >= 0 ? 'none' : `1px solid ${config.eyeGlow}60`,
                  borderBottom: config.mouthCurve >= 0 ? `1px solid ${config.eyeGlow}60` : 'none',
                }}
              />
            </div>

            {/* Panel lines (robot seams) */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              {/* Horizontal seam */}
              <div
                className="absolute top-[45%] left-0 right-0 h-[1px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${config.eyeGlow}30, transparent)`,
                }}
              />
              {/* Vertical seam */}
              <div
                className="absolute top-0 bottom-0 left-[50%] w-[1px]"
                style={{
                  background: `linear-gradient(180deg, transparent, ${config.eyeGlow}20, transparent)`,
                }}
              />
            </div>
          </div>

          {/* Antenna */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #8A94B0, #5A6480)',
              boxShadow: `0 0 6px ${config.eyeGlow}40`,
            }}
          >
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
              style={{
                background: config.eyeGlow,
                boxShadow: `0 0 8px ${config.eyeGlow}`,
              }}
            />
          </div>
        </motion.div>

        {/* Chat indicator badge */}
        {!isChatOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
              boxShadow: '0 2px 8px rgba(233,69,245,0.4)',
            }}
          >
            <MessageCircle className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
