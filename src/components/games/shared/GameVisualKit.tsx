// ════════════════════════════════════════════════════════════════════════
// GAME VISUAL KIT — Shared Visual Components for All Games
// ════════════════════════════════════════════════════════════════════════
// Animated neural nets, particle fields, glowing energy effects,
// score displays, combo counters, and polished UI overlays.
// Drop-in replacements for Three.js visualizations.

'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Star, Trophy, Flame, Brain } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// ANIMATED NEURAL NETWORK (SVG-based, replaces Three.js)
// ════════════════════════════════════════════════════════════════════════
interface NeuralNode {
  id: string; x: number; y: number; layer: number; activation: number;
}
interface NeuralLink {
  from: NeuralNode; to: NeuralNode; weight: number;
}

export function AnimatedNeuralNet({
  layers = [3, 4, 4, 3],
  color = '#E945F5',
  animated = true,
  size = { w: 320, h: 240 },
}: {
  layers?: number[]; color?: string; animated?: boolean; size?: { w: number; h: number };
}) {
  const { nodes, links } = useMemo(() => {
    const n: NeuralNode[] = [];
    const l: NeuralLink[] = [];
    const layerX = (i: number) => 40 + (i / (layers.length - 1)) * (size.w - 80);
    layers.forEach((count, layerIdx) => {
      for (let j = 0; j < count; j++) {
        n.push({
          id: `${layerIdx}-${j}`,
          x: layerX(layerIdx),
          y: size.h / 2 + (j - (count - 1) / 2) * 50,
          layer: layerIdx,
          activation: Math.random(),
        });
      }
    });
    // Connect consecutive layers
    n.forEach((from) => {
      n.filter((to) => to.layer === from.layer + 1).forEach((to) => {
        l.push({ from, to, weight: Math.random() * 2 - 1 });
      });
    });
    return { nodes: n, links: l };
  }, [layers, size]);

  return (
    <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} className="overflow-visible">
      <defs>
        <filter id={`glow-${color.replace('#', '')}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`nodeGrad-${color.replace('#', '')}`}>
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Connections */}
      {links.map((link, i) => (
        <motion.line
          key={i}
          x1={link.from.x} y1={link.from.y} x2={link.to.x} y2={link.to.y}
          stroke={color}
          strokeWidth={Math.abs(link.weight) * 1.5 + 0.5}
          strokeOpacity={0.15 + Math.abs(link.weight) * 0.15}
          filter={animated ? `url(#glow-${color.replace('#', '')})` : undefined}
          initial={animated ? { pathLength: 0 } : undefined}
          animate={animated ? {
            pathLength: 1,
            strokeOpacity: [0.1, 0.3, 0.1],
          } : undefined}
          transition={animated ? {
            pathLength: { duration: 1.5, delay: i * 0.002 },
            strokeOpacity: { repeat: Infinity, duration: 2 + Math.random() * 2, delay: Math.random() * 2 },
          } : undefined}
        />
      ))}

      {/* Nodes */}
      {nodes.map((node) => (
        <motion.g key={node.id}>
          <motion.circle
            cx={node.x} cy={node.y} r={8 + node.activation * 4}
            fill={`url(#nodeGrad-${color.replace('#', '')})`}
            filter={`url(#glow-${color.replace('#', '')})`}
            animate={animated ? {
              r: [8 + node.activation * 2, 10 + node.activation * 4, 8 + node.activation * 2],
              opacity: [0.7, 1, 0.7],
            } : undefined}
            transition={animated ? {
              repeat: Infinity,
              duration: 1.5 + Math.random(),
              delay: node.layer * 0.2 + Math.random(),
            } : undefined}
          />
          <circle cx={node.x} cy={node.y} r={3} fill="#FFFFFF" opacity="0.8" />
        </motion.g>
      ))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// COMBO COUNTER
// ════════════════════════════════════════════════════════════════════════
export function ComboCounter({ combo }: { combo: number }) {
  if (combo < 2) return null;
  return (
    <AnimatePresence>
      <motion.div
        key={combo}
        className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
        style={{
          background: combo >= 5 ? '#E945F520' : '#FF6B3515',
          color: combo >= 5 ? '#E945F5' : '#FF6B35',
          border: `1px solid ${combo >= 5 ? '#E945F540' : '#FF6B3530'}`,
        }}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
      >
        <Flame className="w-3.5 h-3.5" />
        {combo}x Combo!
      </motion.div>
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SCORE DISPLAY WITH ANIMATION
// ════════════════════════════════════════════════════════════════════════
export function ScoreDisplay({
  score, maxScore, label = 'Score',
}: {
  score: number; maxScore: number; label?: string;
}) {
  const pct = Math.min(100, (score / Math.max(maxScore, 1)) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-semibold" style={{ color: '#1A1D2B' }}>{label}</span>
          <span className="font-bold" style={{ color: '#4F6EF7' }}>
            {score} / {maxScore}
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F0F1F8' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #4F6EF7, #E945F5)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// GLOWING TITLE HEADER
// ════════════════════════════════════════════════════════════════════════
export function GlowingTitle({
  children, emoji, color = '#4F6EF7',
}: {
  children: React.ReactNode; emoji?: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {emoji && (
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}15)`,
            boxShadow: `0 0 20px ${color}20`,
          }}
          animate={{ boxShadow: [`0 0 20px ${color}15`, `0 0 30px ${color}30`, `0 0 20px ${color}15`] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {emoji}
        </motion.div>
      )}
      <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>{children}</h2>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FEEDBACK POPUP (correct/wrong)
// ════════════════════════════════════════════════════════════════════════
export function FeedbackPopup({
  type, message, explanation,
}: {
  type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string;
}) {
  const colors = {
    correct: { bg: '#2ECC7115', border: '#2ECC7140', icon: '#2ECC71', Icon: CheckCorrect },
    wrong: { bg: '#EF444415', border: '#EF444440', icon: '#EF4444', Icon: XWrong },
    info: { bg: '#4F6EF715', border: '#4F6EF740', icon: '#4F6EF7', Icon: Brain },
  };
  const c = colors[type];

  return (
    <motion.div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <c.Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: c.icon }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: c.icon }}>{message}</p>
        {explanation && <p className="text-xs mt-1" style={{ color: '#5A6078' }}>{explanation}</p>}
      </div>
    </motion.div>
  );
}

function CheckCorrect(props: React.SVGProps<SVGSVGElement> & { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12" /></svg>;
}
function XWrong(props: React.SVGProps<SVGSVGElement> & { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

// ════════════════════════════════════════════════════════════════════════
// STREAK FLAME
// ════════════════════════════════════════════════════════════════════════
export function StreakFlame({ streak }: { streak: number }) {
  if (streak < 3) return null;
  return (
    <motion.div
      className="flex items-center gap-1 text-xs font-bold"
      style={{ color: streak >= 10 ? '#E945F5' : '#FF6B35' }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 0.5 }}
    >
      <Flame className="w-4 h-4" />
      {streak} streak
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TOY ITEM (3D-ish CSS toy for sorting games)
// ════════════════════════════════════════════════════════════════════════
const TOY_STYLES: Record<string, { emoji: string; color: string; shadow: string; label: string }> = {
  train:     { emoji: '🚂', color: '#FF6B35', shadow: '#FF6B3540', label: 'Toy Train' },
  chess:     { emoji: '♟️', color: '#8C7AE6', shadow: '#8C7AE640', label: 'Chess Piece' },
  chest:     { emoji: '📦', color: '#D4A373', shadow: '#D4A37340', label: 'Treasure Chest' },
  rocket:    { emoji: '🚀', color: '#E945F5', shadow: '#E945F540', label: 'Rocket' },
  robot:     { emoji: '🤖', color: '#4F6EF7', shadow: '#4F6EF740', label: 'Robot' },
  dice:      { emoji: '🎲', color: '#2ECC71', shadow: '#2ECC7140', label: 'Dice' },
  ball:      { emoji: '⚽', color: '#00B894', shadow: '#00B89440', label: 'Ball' },
  car:       { emoji: '🚗', color: '#E17055', shadow: '#E1705540', label: 'Race Car' },
  teddy:     { emoji: '🧸', color: '#D63031', shadow: '#D6303140', label: 'Teddy Bear' },
  block:     { emoji: '🧱', color: '#B2BEC3', shadow: '#B2BEC340', label: 'Building Block' },
  plane:     { emoji: '✈️', color: '#0984E3', shadow: '#0984E340', label: 'Airplane' },
  puzzle:    { emoji: '🧩', color: '#FDCB6E', shadow: '#FDCB6E40', label: 'Puzzle Piece' },
};

export { TOY_STYLES };

export function ToyItem({
  toyKey, size = 'md', glowing = false, onClick,
}: {
  toyKey: string; size?: 'sm' | 'md' | 'lg'; glowing?: boolean; onClick?: () => void;
}) {
  const toy = TOY_STYLES[toyKey] || TOY_STYLES.block;
  const sizeMap = { sm: 'w-12 h-12 text-xl', md: 'w-16 h-16 text-2xl', lg: 'w-20 h-20 text-3xl' };

  return (
    <motion.button
      onClick={onClick}
      className={`${sizeMap[size]} rounded-2xl flex flex-col items-center justify-center gap-0.5
        transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
      style={{
        background: `linear-gradient(135deg, ${toy.color}20, ${toy.color}08)`,
        border: `2px solid ${toy.color}${glowing ? '80' : '30'}`,
        boxShadow: glowing ? `0 0 20px ${toy.shadow}, inset 0 0 10px ${toy.color}10` : `0 2px 8px ${toy.shadow}`,
        ['--tw-ring-color' as string]: toy.color,
      }}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.95 }}
      animate={glowing ? {
        boxShadow: [
          `0 0 15px ${toy.shadow}`,
          `0 0 30px ${toy.color}60`,
          `0 0 15px ${toy.shadow}`,
        ],
      } : undefined}
      transition={glowing ? { repeat: Infinity, duration: 1.5 } : undefined}
    >
      <span>{toy.emoji}</span>
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL BADGE
// ════════════════════════════════════════════════════════════════════════
export function LevelBadge({ level, color }: { level: number; color?: string }) {
  return (
    <div
      className="px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: `${color || '#4F6EF7'}15`, color: color || '#4F6EF7' }}
    >
      Level {level}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TIMER DISPLAY
// ════════════════════════════════════════════════════════════════════════
export function TimerDisplay({ seconds, warning = 10 }: { seconds: number; warning?: number }) {
  const isWarning = seconds <= warning;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
      style={{
        background: isWarning ? '#EF444415' : '#F0F1F8',
        color: isWarning ? '#EF4444' : '#5A6078',
        border: `1px solid ${isWarning ? '#EF444430' : 'transparent'}`,
      }}
      animate={isWarning ? { scale: [1, 1.05, 1] } : undefined}
      transition={isWarning ? { repeat: Infinity, duration: 0.5 } : undefined}
    >
      <Zap className="w-3.5 h-3.5" />
      {mins}:{secs.toString().padStart(2, '0')}
    </motion.div>
  );
}
