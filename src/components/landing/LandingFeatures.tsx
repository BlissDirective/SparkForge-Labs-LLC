'use client';

import { motion } from 'motion/react';
import { Gamepad2, FlaskConical, Trophy, Shield, Zap, Brain } from 'lucide-react';
import SpotlightCard from '@/components/bits/SpotlightCard';
import GradientText from '@/components/bits/GradientText';

const FEATURES = [
  {
    icon: Gamepad2,
    title: '30+ AI Learning Games',
    description: 'Play games that teach real AI concepts — from machine learning to neural networks. Every game is designed for kids ages 6-14.',
    color: '#4F6EF7',
  },
  {
    icon: Brain,
    title: 'AI Tutor: Sparky',
    description: 'Your personal 3D chrome robot tutor that floats around the app, ready to help with games, explain concepts, and make learning fun.',
    color: '#00D2FF',
  },
  {
    icon: FlaskConical,
    title: '11 Learning Labs',
    description: 'Explore structured learning paths covering AI basics, creativity, coding, data, ethics, and advanced agent systems.',
    color: '#E945F5',
  },
  {
    icon: Trophy,
    title: 'Earn Rewards',
    description: 'Collect XP, unlock badges, and build streaks as you learn. Compete with yourself and watch your progress grow.',
    color: '#FFD93D',
  },
  {
    icon: Shield,
    title: 'COPPA Compliant',
    description: 'Built for kids, trusted by parents. Full COPPA compliance with parental controls, content filtering, and safety monitoring.',
    color: '#2ECC71',
  },
  {
    icon: Zap,
    title: 'Adaptive Learning',
    description: 'Content adapts to your age, skill level, and interests. The more you play, the more personalized your experience becomes.',
    color: '#FF6B35',
  },
];

export function LandingFeatures() {
  return (
    <section className="py-20 sm:py-28 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2
            className="text-3xl sm:text-4xl font-extrabold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
          >
            Everything you need to{' '}
            <GradientText from="#4F6EF7" to="#E945F5">master AI</GradientText>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: '#8C94AC' }}>
            A complete learning platform designed specifically for young minds
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <SpotlightCard
                spotlightColor={`${feature.color}10`}
                className="h-full transition-all hover:-translate-y-1"
              >
                <div className="p-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}08)`,
                      boxShadow: `0 4px 12px ${feature.color}15`,
                    }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>

                  <h3 className="text-base font-bold mb-2" style={{ color: '#1A1D2B' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#8C94AC' }}>
                    {feature.description}
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
