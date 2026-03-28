'use client';

// ════════════════════════════════════════════════════
// GUIDE MOBILE AVATAR — Phase 5: CSS 2D avatar fallback
// Glassmorphic avatar indicator for non-3D contexts
// ════════════════════════════════════════════════════

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useGuideStore } from '@/stores/guideStore';

interface GuideMobileAvatarProps {
  labColor?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const SIZES = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-20 h-20' };
const ICON_SIZES = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export default function GuideMobileAvatar({
  labColor = '#00BBFF',
  size = 'md',
  onClick,
}: GuideMobileAvatarProps) {
  const visualState = useGuideStore(s => s.visualState);
  const audioLevel = useGuideStore(s => s.audioLevel);
  const toggle = useGuideStore(s => s.toggle);

  const isSpeaking = visualState === 'speaking';
  const isThinking = visualState === 'thinking';

  return (
    <motion.button
      onClick={onClick || toggle}
      className={`${SIZES[size]} rounded-full relative flex items-center justify-center cursor-pointer`}
      style={{
        background: `radial-gradient(circle, ${labColor}15, ${labColor}05)`,
        border: `2px solid ${labColor}40`,
        boxShadow: `0 0 ${12 + audioLevel * 20}px ${labColor}20, inset 0 0 ${8 + audioLevel * 12}px ${labColor}10`,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={isSpeaking ? {
        boxShadow: [
          `0 0 12px ${labColor}20, inset 0 0 8px ${labColor}10`,
          `0 0 24px ${labColor}40, inset 0 0 16px ${labColor}20`,
          `0 0 12px ${labColor}20, inset 0 0 8px ${labColor}10`,
        ],
      } : undefined}
      transition={isSpeaking ? { duration: 0.8, repeat: Infinity } : undefined}
      aria-label="AI Guide Avatar"
    >
      {/* Pulse ring when speaking */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${labColor}30` }}
          animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Thinking spinner */}
      {isThinking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ borderTop: `2px solid ${labColor}`, borderRight: '2px solid transparent', borderBottom: '2px solid transparent', borderLeft: '2px solid transparent' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Icon */}
      <Sparkles className={`${ICON_SIZES[size]} text-cyan-400`} />
    </motion.button>
  );
}
