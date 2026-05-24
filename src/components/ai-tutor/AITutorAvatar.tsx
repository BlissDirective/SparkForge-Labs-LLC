// ════════════════════════════════════════════════════════════════════════════
// AI TUTOR AVATAR v3 — "Sparky" Floating Robot Orb
// ════════════════════════════════════════════════════════════════════════════
// Inspired by: spherical floating robots with glossy white chrome finish,
// large black face-screen, and glowing cyan ring eyes.
// Built with pure CSS/SVG — NO canvas, NO Three.js. Crisp at any size.
//
// Design Language (from reference images):
// - Large spherical white-chrome head (dominant feature)
// - Black rectangular/oval face screen with glowing cyan ring eyes
// - Small happy smile on face screen
// - Glossy metallic reflections (highlights + rim light)
// - Floating above page with hard drop shadow
// - Ambient blue aura glow
// - NO background card — transparent, sits directly on page content

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';

export type TutorExpression =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'speaking'
  | 'excited'
  | 'sleepy';

interface AITutorAvatarProps {
  expression?: TutorExpression;
  isChatOpen: boolean;
  onClick: () => void;
  quickTip?: string;
  pulseAttention?: boolean;
}

// ── Expression Config: eye size, mouth shape, glow color ──
const expr: Record<TutorExpression, {
  eyeScale: number;
  eyeY: number;
  mouthD: string;
  glowColor: string;
  eyeRingOpacity: number;
}> = {
  idle:     { eyeScale: 1,   eyeY: 0,   mouthD: 'M 32 58 Q 40 62 48 58',               glowColor: '#00D2FF', eyeRingOpacity: 0.8 },
  happy:    { eyeScale: 1.1, eyeY: -1, mouthD: 'M 30 56 Q 40 66 50 56',               glowColor: '#00FF88', eyeRingOpacity: 1 },
  thinking: { eyeScale: 0.7, eyeY: 2,  mouthD: 'M 35 58 Q 40 55 45 58',               glowColor: '#FFD93D', eyeRingOpacity: 0.6 },
  speaking: { eyeScale: 1,   eyeY: 0,  mouthD: 'M 32 57 Q 40 63 48 57',               glowColor: '#E945F5', eyeRingOpacity: 0.9 },
  excited:  { eyeScale: 1.2, eyeY: -2, mouthD: 'M 28 54 Q 40 70 52 54',               glowColor: '#FF6B35', eyeRingOpacity: 1 },
  sleepy:   { eyeScale: 0.5, eyeY: 3,  mouthD: 'M 35 59 Q 40 60 45 59',               glowColor: '#8B9FFF', eyeRingOpacity: 0.4 },
};

// ── Sparky's Face SVG — black screen with glowing ring eyes ──
function SparkyFace({ expression, isHovered }: {
  expression: TutorExpression;
  isHovered: boolean;
}) {
  const config = expr[expression];
  const glowHex = config.glowColor;

  return (
    <svg
      viewBox="0 0 80 80"
      className="w-full h-full"
      style={{ filter: `drop-shadow(0 0 6px ${glowHex}60)` }}
    >
      <defs>
        {/* Eye ring gradient — bright inner, soft outer */}
        <radialGradient id="eyeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor={glowHex} stopOpacity="0.95" />
          <stop offset="100%" stopColor={glowHex} stopOpacity="0.3" />
        </radialGradient>

        {/* Inner eye dark center */}
        <radialGradient id="eyeCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0A1628" stopOpacity="1" />
          <stop offset="70%" stopColor="#0A1628" stopOpacity="1" />
          <stop offset="100%" stopColor={glowHex} stopOpacity="0.5" />
        </radialGradient>

        {/* Face screen subtle gradient */}
        <radialGradient id="faceScreen" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#0D1B2A" />
          <stop offset="100%" stopColor="#050A12" />
        </radialGradient>

        {/* Glow filter for eyes */}
        <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Face Screen (black rounded rect) ── */}
      <rect
        x="10" y="18" width="60" height="44" rx="20"
        fill="url(#faceScreen)"
        stroke={glowHex}
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />

      {/* ── Left Eye ── */}
      <g transform={`translate(28, ${38 + config.eyeY}) scale(${config.eyeScale})`}>
        {/* Outer ring glow */}
        <circle cx="0" cy="0" r="9" fill="none" stroke={glowHex}
          strokeWidth="2.5" opacity={config.eyeRingOpacity}
          filter="url(#eyeGlow)" />
        {/* Ring fill */}
        <circle cx="0" cy="0" r="9" fill="none" stroke="url(#eyeGrad)"
          strokeWidth="2" opacity={config.eyeRingOpacity} />
        {/* Dark center */}
        <circle cx="0" cy="0" r="5.5" fill="url(#eyeCenter)" />
        {/* Highlight dot */}
        <circle cx="-2" cy="-2" r="1.8" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* ── Right Eye ── */}
      <g transform={`translate(52, ${38 + config.eyeY}) scale(${config.eyeScale})`}>
        <circle cx="0" cy="0" r="9" fill="none" stroke={glowHex}
          strokeWidth="2.5" opacity={config.eyeRingOpacity}
          filter="url(#eyeGlow)" />
        <circle cx="0" cy="0" r="9" fill="none" stroke="url(#eyeGrad)"
          strokeWidth="2" opacity={config.eyeRingOpacity} />
        <circle cx="0" cy="0" r="5.5" fill="url(#eyeCenter)" />
        <circle cx="-2" cy="-2" r="1.8" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* ── Mouth ── */}
      <motion.path
        d={config.mouthD}
        fill="none"
        stroke={glowHex}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
        animate={{ d: config.mouthD }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* ── Subtle screen scanline ── */}
      <motion.line
        x1="10" y1="20" x2="70" y2="20"
        stroke={glowHex}
        strokeWidth="0.3"
        opacity="0.1"
        animate={{ y1: [20, 62, 20], y2: [20, 62, 20] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
      />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export function AITutorAvatar({
  expression = 'idle',
  isChatOpen,
  onClick,
  quickTip,
  pulseAttention = false,
}: AITutorAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const config = expr[expression];

  // Auto-show quick tip
  useEffect(() => {
    if (!quickTip) return;
    const t1 = setTimeout(() => setShowTip(true), 2500);
    const t2 = setTimeout(() => setShowTip(false), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [quickTip]);

  return (
    <div
      className="fixed bottom-5 right-5 z-[500] flex flex-col items-end gap-2"
      style={{ pointerEvents: 'none' }}
    >
      {/* ═══ Quick Tip Bubble (NO background — transparent tip) ═══ */}
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
                color: '#E8ECF4',
                border: `1px solid ${config.glowColor}30`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${config.glowColor}15`,
              }}
            >
              {quickTip}
              <button
                onClick={(e) => { e.stopPropagation(); setShowTip(false); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#1A2035] border border-[#2A3050] hover:bg-[#252D45] transition-colors"
              >
                <X className="w-2.5 h-2.5 text-[#8C94AC]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Sparky — Floating Robot Orb ═══ */}
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={pulseAttention && !isChatOpen ? {
          scale: [1, 1.04, 1],
        } : {}}
        transition={pulseAttention
          ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 350, damping: 20 }
        }
        className="pointer-events-auto relative cursor-none"
        style={{ width: 72, height: 72 }}
        aria-label={isChatOpen ? 'Close Sparky chat' : 'Open Sparky chat'}
      >
        {/* ── Hard Drop Shadow (crisp, modern) ── */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            bottom: -6,
            width: 48,
            height: 10,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 50%, transparent 70%)',
            filter: 'blur(1px)',
            transform: isHovered ? 'translateX(-50%) scaleX(0.7)' : 'translateX(-50%) scaleX(1)',
            transition: 'transform 0.3s ease',
          }}
        />

        {/* ── Ambient Aura Glow (behind the orb) ── */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.glowColor}18 0%, ${config.glowColor}08 40%, transparent 70%)`,
            transform: 'scale(1.6)',
            filter: 'blur(8px)',
          }}
          animate={{
            opacity: isHovered ? 1 : 0.6,
            scale: isHovered ? 1.9 : 1.6,
          }}
          transition={{ duration: 0.4 }}
        />

        {/* ── Main Orb Body (3D chrome sphere) ── */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Outer chrome shell */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: `
                radial-gradient(circle at 32% 22%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 8%, transparent 18%),
                radial-gradient(circle at 70% 75%, ${config.glowColor}15 0%, transparent 35%),
                linear-gradient(160deg, #F0F2F8 0%, #D8DDE8 25%, #B8C0D4 50%, #98A2BC 75%, #7884A4 100%)
              `,
              boxShadow: isHovered
                ? `0 0 0 1px rgba(255,255,255,0.3) inset, 0 0 20px ${config.glowColor}40, 0 6px 24px rgba(0,0,0,0.25)`
                : `0 0 0 1px rgba(255,255,255,0.2) inset, 0 4px 16px rgba(0,0,0,0.18)`,
              transform: isHovered ? 'rotateX(-6deg) rotateY(8deg) scale(1.02)' : 'rotateX(0) rotateY(0)',
              transition: 'transform 0.35s ease, box-shadow 0.35s ease',
            }}
          >
            {/* Rim light (bottom arc) */}
            <div
              className="absolute bottom-0 left-[10%] right-[10%] h-[35%] rounded-b-full"
              style={{
                background: `radial-gradient(ellipse at 50% 100%, ${config.glowColor}25, transparent 65%)`,
                filter: 'blur(3px)',
              }}
            />

            {/* Secondary specular highlight */}
            <div
              className="absolute top-[8%] left-[15%] w-[25%] h-[18%] rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.5), transparent 70%)',
                filter: 'blur(1px)',
              }}
            />

            {/* ── Face Container ── */}
            <div className="absolute inset-[8%] rounded-full overflow-hidden flex items-center justify-center">
              <SparkyFace expression={expression} isHovered={isHovered} />
            </div>

            {/* Chrome seam ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)',
              }}
            />
          </div>

          {/* ── Tiny antenna ── */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-[3px] h-[6px] rounded-full"
            style={{
              background: 'linear-gradient(180deg, #A0A8C0, #707890)',
            }}
          >
            <div
              className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full"
              style={{
                background: config.glowColor,
                boxShadow: `0 0 6px ${config.glowColor}, 0 0 12px ${config.glowColor}60`,
              }}
            />
          </div>
        </motion.div>

        {/* ── Chat indicator badge ── */}
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
