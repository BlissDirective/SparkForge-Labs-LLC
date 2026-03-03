'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, Shield, BarChart3, Rocket, Sparkles } from 'lucide-react';
import { WORLDS } from '@/types';
import { staggerContainer, staggerItem } from '@/lib/animations';

// Landing Page — SparkForge Marketing
// v3 Decision 8.1: CrystalHero placeholder (R3F in Part 3B)
// v3: Station-aesthetic styling, Frost-Prismatic colors
// v2 preserved: Lab grid, features, footer, all content

const features = [
  {
    icon: Brain,
    title: '10 AI Labs',
    description:
      'From machine learning to ethics, explore every corner of AI through interactive experiments.',
  },
  {
    icon: Sparkles,
    title: '35+ Games',
    description:
      'Train neural networks, build chatbots, detect bias, and more with hands-on mini-games.',
  },
  {
    icon: Shield,
    title: 'Safe & Age-Adapted',
    description:
      'Content adapts to ages 7-16. No ads, no data collection, parent dashboard included.',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description:
      'XP, badges, streaks, and a parent dashboard to see what your child is learning.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-deep text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* v3: Animated background gradient (CSS fallback for CrystalHero) */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                'radial-gradient(ellipse at 30% 50%, #00BBFF22 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, #8B5CF622 0%, transparent 50%)',
            }}
          />
          {/* Floating particles */}
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-spark-blue/30"
              style={{
                left: `${10 + (i * 4.2) % 80}%`,
                top: `${5 + (i * 4.7) % 90}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + (i % 4),
                repeat: Infinity,
                delay: (i % 3),
              }}
            />
          ))}
        </div>

        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* v3: Crystal emoji placeholder for CrystalHero */}
          <motion.div
            className="text-7xl mb-8"
            variants={staggerItem}
            animate={{
              rotateY: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotateY: { duration: 8, repeat: Infinity, ease: 'linear' },
              scale: { duration: 3, repeat: Infinity },
            }}
          >
            💎
          </motion.div>

          <motion.h1
            className="font-display text-5xl md:text-7xl font-bold mb-6"
            variants={staggerItem}
          >
            <span className="bg-gradient-to-r from-spark-blue via-spark-purple to-spark-blue bg-clip-text text-transparent">
              SparkForge
            </span>
          </motion.h1>

          <motion.p
            className="font-body text-xl md:text-2xl text-white/60 mb-4 max-w-2xl mx-auto"
            variants={staggerItem}
          >
            The AI Learning Lab for Curious Minds
          </motion.p>

          <motion.p
            className="font-body text-white/40 mb-10 max-w-lg mx-auto"
            variants={staggerItem}
          >
            10 interactive labs. 35+ hands-on games. Built for ages 7-16.
            Explore AI through play.
          </motion.p>

          <motion.div className="flex gap-4 justify-center" variants={staggerItem}>
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-lg emissive-glow hover:brightness-110 transition-all"
              style={{ '--glow-color': '#8B5CF6' } as React.CSSProperties}
            >
              Start Learning Free
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-display font-bold text-lg hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Lab Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="font-display text-3xl md:text-4xl font-bold text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            10 AI Research Labs
          </motion.h2>
          <motion.p
            className="font-body text-white/40 text-center mb-12 max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Each lab is a themed environment with lessons, quizzes, and
            interactive games.
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {WORLDS.map((lab, i) => (
              <motion.div
                key={lab.id}
                className="glass-card rounded-2xl p-4 text-center hover:bg-white/10 transition-colors group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <div
                  className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-2xl mb-3"
                  style={{ backgroundColor: `${lab.color}20` }}
                >
                  {lab.icon}
                </div>
                <p className="font-display text-sm font-bold text-white mb-1">
                  {lab.title}
                </p>
                <p className="font-body text-[10px] text-white/30">
                  {lab.games.length} experiments
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  className="glass-card rounded-2xl p-6 flex gap-4"
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-spark-purple/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-spark-purple" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white mb-1">
                      {f.title}
                    </h3>
                    <p className="font-body text-sm text-white/50">
                      {f.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            className="font-display text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Your Station Awaits
          </motion.h2>
          <p className="font-body text-white/40 mb-8">
            Start with 3 free labs. Upgrade anytime.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-lg emissive-glow hover:brightness-110 transition-all"
            style={{ '--glow-color': '#00BBFF' } as React.CSSProperties}
          >
            <Rocket className="w-5 h-5" />
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-white/20 text-sm">
            © 2026 BlissDirective · SparkForge
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="font-body text-white/20 text-sm hover:text-white/40"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-body text-white/20 text-sm hover:text-white/40"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
