'use client';

import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Play, Shield, Gamepad2, Zap } from 'lucide-react';

export function HeroContent() {
  return (
    <div className="space-y-8">
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
        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
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
        style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}
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
