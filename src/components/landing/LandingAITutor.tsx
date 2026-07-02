// ════════════════════════════════════════════════════════════════
// LANDING AI TUTOR — Feature Showcase Section
// ════════════════════════════════════════════════════════════════
// Highlights the 3D AI Tutor with a visual preview and the
// featured quote: "Personalized AI Learning Tutor that grows with you"

'use client';

import { motion } from 'motion/react';
import { Sparkles, MessageCircle, Shield, Brain, Zap, Star } from 'lucide-react';
import GradientText from '@/components/bits/GradientText';
import ShinyText from '@/components/bits/ShinyText';
import { SparkyStatic } from '@/components/sparky/SparkyStatic';

export function LandingAITutor() {
  return (
    <section className="relative py-20 sm:py-28 px-4 overflow-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      {/* Background ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #00D2FF30, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[300px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #E945F530, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* ── Left: Text Content ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#00D2FF' }} />
              <span className="text-sm font-semibold" style={{ color: '#00D2FF' }}>Meet Sparky</span>
            </div>

            {/* Main Quote with ShinyText */}
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-white">Personalized </span>
              <br />
              <ShinyText text="AI Learning Tutor" speed={4} color="#00D2FF" />
              <br />
              <GradientText from="#E945F5" to="#4F6EF7">
                that grows with you
              </GradientText>
            </h2>

            <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: 'rgba(248,250,255,0.6)' }}>
              Sparky is your personal AI learning companion — a friendly chrome robot orb that
              floats around the app, ready to help with games, explain AI concepts, and make
              learning fun. Every conversation is COPPA-safe and age-appropriate.
            </p>

            {/* Feature list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: MessageCircle, color: '#00D2FF', text: 'Ask questions about any game or AI topic' },
                { icon: Brain, color: '#E945F5', text: 'Learns your interests and adapts responses' },
                { icon: Shield, color: '#2ECC71', text: 'COPPA-safe with parental monitoring' },
                { icon: Zap, color: '#FFD93D', text: 'Gives tips to level up faster' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px 25% 0px' }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-4 h-4" style={{ color: feature.color }} />
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(248,250,255,0.7)' }}>{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Right: Visual Preview ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            {/* Glow behind orb */}
            <div
              className="absolute w-64 h-64 rounded-full blur-3xl opacity-40"
              style={{ background: 'radial-gradient(circle, #00D2FF40, transparent 70%)' }}
            />

            {/* Sparky — Canonical AI Tutor Avatar */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="relative"
            >
              <SparkyStatic expression="happy" size="xl" showAura />
            </motion.div>

            {/* Chat bubble preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '0px 0px 25% 0px' }}
              transition={{ delay: 0.8 }}
              className="absolute top-4 right-0 sm:right-4"
            >
              <div
                className="px-4 py-3 rounded-2xl rounded-bl-sm max-w-[180px]"
                style={{
                  background: 'linear-gradient(135deg, #1A1D3B, #2A2D4F)',
                  border: '1px solid rgba(0,210,255,0.15)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <p className="text-xs" style={{ color: 'rgba(248,250,255,0.9)' }}>
                  Hey! I'm Sparky. Ask me anything about AI!
                </p>
              </div>
            </motion.div>

            {/* Sparkle decorations */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute -top-4 -left-4"
            >
              <Star className="w-5 h-5" style={{ color: '#FFD93D', fill: '#FFD93D', opacity: 0.6 }} />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
              className="absolute -bottom-2 -right-2"
            >
              <Sparkles className="w-4 h-4" style={{ color: '#E945F5', opacity: 0.5 }} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
