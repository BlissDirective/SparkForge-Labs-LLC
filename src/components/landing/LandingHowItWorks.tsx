'use client';

import { motion } from 'motion/react';
import {
  Rocket, Gamepad2, Brain, Trophy, Users, TrendingUp,
  Shield, Sparkles, Globe, Zap, Star, ChevronRight,
} from 'lucide-react';
import SpotlightCard from '@/components/bits/SpotlightCard';
import StarBorder from '@/components/bits/StarBorder';
import BlurText from '@/components/bits/BlurText';
import CountUp from '@/components/bits/CountUp';

// ── Steps ──
const STEPS = [
  {
    num: '01',
    title: 'Create Your Profile',
    description: 'Set up your learning profile in seconds. Tell us your age and interests — SparkForge adapts everything just for you.',
    icon: Rocket,
    color: '#4F6EF7',
  },
  {
    num: '02',
    title: 'Pick a Lab & Play',
    description: 'Choose from 11 AI learning labs, each packed with games. From neural networks to ethics — every topic is a new adventure.',
    icon: Gamepad2,
    color: '#E945F5',
  },
  {
    num: '03',
    title: 'Learn by Doing',
    description: 'Games teach real AI concepts through play. Build neural networks, train virtual pets, detect bias, and write your first AI code.',
    icon: Brain,
    color: '#4DE9FF',
  },
  {
    num: '04',
    title: 'Earn & Grow',
    description: 'Collect XP, unlock badges, and build streaks. Watch your progress chart climb as you master new AI skills.',
    icon: Trophy,
    color: '#FFD93D',
  },
];

// ── AI Stats ──
const AI_STATS = [
  { value: 42, suffix: '', label: 'AI Learning Games', icon: Gamepad2, color: '#4F6EF7' },
  { value: 11, suffix: '', label: 'Learning Labs', icon: Star, color: '#E945F5' },
  { value: 1200, suffix: '+', label: 'Quiz Questions', icon: Brain, color: '#4DE9FF' },
  // Honest stat only — the old "97% Kids Love It" had no source (P1-5).
  { value: 0, suffix: '', label: 'Ads or Trackers', icon: Sparkles, color: '#FFD93D' },
];

// ── Fun Facts ──
const FUN_FACTS = [
  {
    icon: Globe,
    title: 'AI is Everywhere',
    stat: '77%',
    detail: 'of devices now use AI — from phones to cars. By 2030, AI will touch every industry.',
    color: '#4F6EF7',
  },
  {
    icon: TrendingUp,
    title: 'Fastest Growing Field',
    stat: '40%',
    detail: 'annual growth in AI jobs. Kids who learn AI now will be ahead of 90% of adults.',
    color: '#2ECC71',
  },
  {
    icon: Shield,
    title: 'Built for Safety',
    stat: 'COPPA',
    detail: 'certified. Zero data sold. Zero external AI calls. Local-only tutor responses.',
    color: '#FF6B35',
  },
  {
    icon: Zap,
    title: 'Play-First Learning',
    stat: '100%',
    detail: 'of concepts are taught through games you play — never lectures you sit through.',
    color: '#FFD93D',
  },
  {
    icon: Users,
    title: 'Ages 7 to 16',
    stat: '3 Bands',
    detail: 'Age-adaptive: Explorer (7–10), Adventurer (11–13), Pioneer (14–16). Content grows with you.',
    color: '#E945F5',
  },
  {
    icon: Brain,
    title: 'Real AI Concepts',
    stat: '42',
    detail: 'games covering neural networks, NLP, computer vision, ethics, agents, and more.',
    color: '#4DE9FF',
  },
];

// ── What Kids Learn ──
const SKILLS = [
  'Neural Networks', 'Machine Learning', 'Computer Vision',
  'NLP & Chatbots', 'AI Ethics', 'Data Science',
  'Prompt Engineering', 'Robotics', 'Creative AI',
  'Agent Systems', 'Bias Detection', 'Coding Basics',
];

export function LandingHowItWorks() {
  return (
    <section className="relative py-20 sm:py-28 px-4 overflow-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(ellipse, #E945F520, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] rounded-full opacity-15 blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(ellipse, #4F6EF720, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto relative">
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 25% 0px' }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
               style={{ backgroundColor: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.2)' }}>
            <Rocket className="w-4 h-4" style={{ color: '#4F6EF7' }} />
            <span className="text-sm font-semibold" style={{ color: '#4F6EF7' }}>Your Journey Starts Here</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-white">How </span>
            <span style={{ color: '#4DE9FF' }}>
              <BlurText text="SparkForge" />
            </span>
            <span className="text-white"> Works</span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'rgba(248,250,255,0.5)' }}>
            Four simple steps from curious kid to AI creator. Every game teaches a real concept — no fluff, just fun.
          </p>
        </motion.div>

        {/* ═══ STEPS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px 25% 0px' }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <SpotlightCard
                spotlightColor={`${step.color}10`}
                className="h-full relative overflow-hidden"
              >
                {/* Step number watermark */}
                <div className="absolute -top-2 -right-2 text-6xl font-extrabold opacity-[0.04]" style={{ fontFamily: 'var(--font-display)', color: step.color }}>
                  {step.num}
                </div>
                <div className="p-5 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(135deg, ${step.color}25, ${step.color}10)` }}
                    >
                      <step.icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${step.color}15`, color: step.color }}>
                      Step {step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#1A1D2B' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#8C94AC' }}>{step.description}</p>
                </div>
              </SpotlightCard>

              {/* Connector arrow (desktop only) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-6 h-6 rounded-full"
                     style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: '#8C94AC' }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* ═══ STATS BAR ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 25% 0px' }}
          className="rounded-2xl p-6 sm:p-8 mb-20"
          style={{
            background: 'linear-gradient(135deg, rgba(79,110,247,0.08), rgba(233,69,245,0.06))',
            border: '1px solid rgba(79,110,247,0.12)',
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {AI_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '0px 0px 25% 0px' }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="w-5 h-5 mr-1.5" style={{ color: stat.color }} />
                  <span className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: stat.color }}>
                    <CountUp to={stat.value} suffix={stat.suffix} />
                  </span>
                </div>
                <p className="text-sm font-medium" style={{ color: 'rgba(248,250,255,0.6)' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ FUN FACTS (StarBorder cards) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 25% 0px' }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-white">Why </span>
            <span style={{ color: '#FFD93D' }}>
              <BlurText text="Learn AI Now?" />
            </span>
          </h3>
          <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'rgba(248,250,255,0.5)' }}>
            The future belongs to kids who understand AI. Here is why starting early matters.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {FUN_FACTS.map((fact, i) => (
            <motion.div
              key={fact.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px 25% 0px' }}
              transition={{ delay: i * 0.08 }}
            >
              <StarBorder color={fact.color} speed={5 + (i % 3) * 2}>
                <div className="p-5 h-full" style={{ backgroundColor: '#1A1D2B', borderRadius: 'inherit' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                         style={{ background: `linear-gradient(135deg, ${fact.color}20, ${fact.color}08)` }}>
                      <fact.icon className="w-5 h-5" style={{ color: fact.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'rgba(248,250,255,0.6)' }}>{fact.title}</p>
                      <p className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: fact.color }}>
                        {fact.stat}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,250,255,0.55)' }}>
                    {fact.detail}
                  </p>
                </div>
              </StarBorder>
            </motion.div>
          ))}
        </div>

        {/* ═══ SKILLS CLOUD ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 25% 0px' }}
          className="text-center"
        >
          <h3 className="text-xl sm:text-2xl font-extrabold mb-6" style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF' }}>
            What Kids{' '}
            <span style={{ color: '#2ECC71' }}>
              <BlurText text="Actually Learn" />
            </span>
          </h3>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {SKILLS.map((skill, i) => {
              const colors = ['#4F6EF7', '#E945F5', '#4DE9FF', '#2ECC71', '#FFD93D', '#FF6B35'];
              const c = colors[i % colors.length];
              return (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '0px 0px 25% 0px' }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  className="px-4 py-2 rounded-full text-sm font-semibold cursor-default"
                  style={{
                    backgroundColor: `${c}12`,
                    color: c,
                    border: `1px solid ${c}25`,
                  }}
                >
                  {skill}
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
