'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { Sparkles, Play, Shield, Gamepad2, Zap } from 'lucide-react';
import { SparkyStatic } from '@/components/sparky/SparkyStatic';
import type { SparkyExpression } from '@/components/sparky/SparkyCore';

export interface HeroContentProps {
  /** Spring-smoothed pointer offset (px) supplied by HeroSection. */
  sparkyX: MotionValue<number>;
  sparkyY: MotionValue<number>;
  reducedMotion: boolean;
}

export function HeroContent({ sparkyX, sparkyY, reducedMotion }: HeroContentProps) {
  // Sparky reacts to the primary CTA: 'happy' on hover/focus,
  // a brief 'excited' burst on click, otherwise 'idle'.
  const [expression, setExpression] = useState<SparkyExpression>('idle');
  const excitedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (excitedTimer.current) clearTimeout(excitedTimer.current);
    };
  }, []);

  // Gentle tilt derived from the horizontal spring — a few degrees max.
  const sparkyRotate = useTransform(sparkyX, [-16, 16], [-5, 5]);

  const handleCtaEnter = () => setExpression('happy');
  const handleCtaLeave = () => setExpression('idle');
  const handleCtaClick = () => {
    setExpression('excited');
    if (excitedTimer.current) clearTimeout(excitedTimer.current);
    excitedTimer.current = setTimeout(() => setExpression('happy'), 900);
  };

  return (
    <div className="space-y-8">
      {/* Sparky — canonical mascot, cursor-reactive on desktop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex justify-center"
      >
        <motion.div
          aria-hidden="true"
          style={
            reducedMotion
              ? undefined
              : { x: sparkyX, y: sparkyY, rotate: sparkyRotate }
          }
        >
          <SparkyStatic
            expression={reducedMotion ? 'happy' : expression}
            size="lg"
            showAura
          />
        </motion.div>
      </motion.div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <Sparkles className="w-4 h-4" style={{ color: '#E945F5' }} />
        <span className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          AI Learning for Kids Ages 7–16
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
        style={{ textShadow: '0 4px 30px rgba(233, 69, 245, 0.3)' }}
      >
        Learn AI.
        <br />
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(135deg, #E945F5, #2F4BC0, #FFFFFF)',
          }}
        >
          Build the Future.
        </span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
        style={{
          color: 'rgba(255, 255, 255, 0.88)',
          textShadow: '0 1px 12px rgba(10, 15, 30, 0.8)',
        }}
      >
        Play 42 games that teach real AI, coding, and digital literacy.
        No experience needed — just curiosity.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
      >
        <a
          href="/signup"
          onMouseEnter={handleCtaEnter}
          onMouseLeave={handleCtaLeave}
          onFocus={handleCtaEnter}
          onBlur={handleCtaLeave}
          onClick={handleCtaClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #E945F5, #2F4BC0)',
            boxShadow: '0 4px 20px rgba(233, 69, 245, 0.35)',
          }}
        >
          <Sparkles className="w-5 h-5" />
          Start Free
        </a>

        <a
          href="#how-it-works"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-base transition-all hover:bg-white/10 active:scale-[0.98]"
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Play className="w-5 h-5" />
          See How It Works
        </a>
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="pt-12 flex flex-wrap items-center justify-center gap-6"
        style={{
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '0.875rem',
          textShadow: '0 1px 10px rgba(10, 15, 30, 0.8)',
        }}
      >
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" style={{ color: '#2ECC71' }} />
          COPPA Compliant
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: '#FFD93D' }} />
          No Credit Card Required
        </span>
        <span className="flex items-center gap-1.5">
          <Gamepad2 className="w-3.5 h-3.5" style={{ color: '#4F6EF7' }} />
          42 Learning Games
        </span>
      </motion.div>
    </div>
  );
}
