'use client';

/**
 * CosmicHomepage — SparkForge v4 Redesign
 * ════════════════════════════════════════════════════════════════════
 * A visually striking homepage that combines:
 * - Apple-inspired clean, minimal layouts
 * - Colorful futuristic spaceship control panel aesthetics
 * - Cosmic space theme with nebulas and star fields
 *
 * Sections:
 * 1. Hero — BrandHeroSlot with cosmic background + floating elements
 * 2. Labs Discovery — Interactive lab cards grid
 * 3. Features — Glass-morphism feature cards
 * 4. Stats — Animated counters with cosmic styling
 * 5. Final CTA — Call to action with gradient button
 * ════════════════════════════════════════════════════════════════════ */

import Link from 'next/link';
import { BrandHeroSlot } from '@/registry/blocks/brand-hero-slot';
import { StarField } from '@/components/ui/star-field';
import { CosmicButton } from '@/components/ui/cosmic-button';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientText } from '@/components/ui/gradient-text';
import { LAB_COLORS_TABLE } from '@/config/labColors';
import {
  Sparkles,
  Brain,
  Gamepad2,
  Rocket,
  Shield,
  Zap,
  Users,
  Award,
  ArrowRight,
  Play,
  ChevronDown,
} from 'lucide-react';

// ─── Lab Card Component ───────────────────────────────────────────────
interface LabCardProps {
  id: number;
  name: string;
  color: string;
  description: string;
}

function LabCard({ id, name, color, description }: LabCardProps) {
  return (
    <Link
      href={`/labs/${id}`}
      className="group relative block"
      style={{ '--lab-color': color } as React.CSSProperties}
    >
      <div className="lab-card-cosmic relative bg-surface-card/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 transition-all duration-300 hover:scale-[1.03] hover:border-white/20">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* LED indicator */}
        <div
          className="absolute top-4 right-4 w-2 h-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          {/* Lab number badge */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-data text-lg font-bold mb-4"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {id}
          </div>

          <h3 className="font-display text-lg font-semibold text-text-primary mb-2 group-hover:text-white transition-colors">
            {name}
          </h3>

          <p className="text-sm text-text-secondary line-clamp-2">{description}</p>

          {/* Progress indicator placeholder */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:w-1/4"
                style={{ backgroundColor: color, width: '0%' }}
              />
            </div>
            <span className="text-xs text-text-muted">Start</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Feature Card Component ───────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <GlassCard variant="default" hover className="h-full">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{
          backgroundColor: `${color}15`,
          boxShadow: `0 0 20px ${color}20`,
        }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-text-secondary leading-relaxed">{description}</p>
    </GlassCard>
  );
}

// ─── Stat Counter Component ───────────────────────────────────────────
interface StatProps {
  value: string;
  label: string;
  color: string;
}

function Stat({ value, label, color }: StatProps) {
  return (
    <div className="text-center">
      <div
        className="font-data text-4xl md:text-5xl font-bold mb-2"
        style={{ color, textShadow: `0 0 30px ${color}40` }}
      >
        {value}
      </div>
      <div className="text-text-secondary text-sm uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

// ─── Floating Orb Decoration ──────────────────────────────────────────
function FloatingOrb({ className, color, size = 'md' }: { className?: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' };
  return (
    <div
      className={`absolute rounded-full animate-cosmic-float ${sizes[size]} ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}10, transparent)`,
        boxShadow: `0 0 40px ${color}30, inset 0 0 20px ${color}20`,
      }}
      aria-hidden="true"
    />
  );
}

// ─── Main Homepage Component ──────────────────────────────────────────
export function CosmicHomepage() {
  const features = [
    {
      icon: <Brain className="w-7 h-7" />,
      title: 'AI-Powered Learning',
      description: 'Adaptive content that evolves with your child&apos;s progress and learning style.',
      color: '#B67BFF',
    },
    {
      icon: <Gamepad2 className="w-7 h-7" />,
      title: '35+ Interactive Games',
      description: 'Hands-on experiments and games that make complex AI concepts fun and accessible.',
      color: '#00D4FF',
    },
    {
      icon: <Rocket className="w-7 h-7" />,
      title: 'Progress Tracking',
      description: 'Real-time dashboards for parents and engaging achievement systems for kids.',
      color: '#FF70AF',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Safe & Private',
      description: 'COPPA compliant with strict privacy controls. No ads, no data selling.',
      color: '#00D17A',
    },
  ];

  // Lab descriptions for the cards
  const labDescriptions: Record<number, string> = {
    1: 'Discover what artificial intelligence really is and how it\'s all around us.',
    2: 'Learn how machines learn from examples, just like you do!',
    3: 'Explore neural networks - the brain-like systems that power modern AI.',
    4: 'Create art, music, and stories with generative AI tools.',
    5: 'Meet AI assistants and learn how they help people every day.',
    6: 'Think critically about AI\'s impact on society and fairness.',
    7: 'Teach computers to see and understand images like humans.',
    8: 'Discover how AI reads, writes, and understands language.',
    9: 'Design and build your very own AI project from scratch!',
    10: 'Imagine the future of AI and your role in shaping it.',
    11: 'Explore AI agents that can take actions and make decisions.',
  };

  return (
    <div className="relative min-h-screen bg-surface-base overflow-hidden">
      {/* Global star field background */}
      <StarField starCount={200} showNebula />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col">
        {/* BrandHeroSlot - preserved 3D wordmark */}
        <div className="absolute inset-0 z-0">
          <BrandHeroSlot />
        </div>

        {/* Floating decorative orbs */}
        <FloatingOrb className="top-20 left-10 opacity-50" color="#B67BFF" size="lg" />
        <FloatingOrb className="top-40 right-20 opacity-40" color="#00D4FF" size="md" />
        <FloatingOrb className="bottom-40 left-1/4 opacity-30" color="#FF70AF" size="sm" />

        {/* Hero content overlay */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-text-secondary">AI Education for Ages 7-16</span>
            </div>

            {/* Main headline */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-text-primary mb-6 leading-tight">
              Where{' '}
              <GradientText gradient="cosmic" className="font-display">
                Curiosity
              </GradientText>
              <br />
              Meets AI
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              A gamified learning platform where kids explore artificial intelligence through 
              interactive labs, hands-on games, and real-world experiments.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/signup">
                <CosmicButton size="lg" className="min-w-[200px]">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5" />
                </CosmicButton>
              </Link>
              <Link href="/demo">
                <CosmicButton variant="secondary" size="lg" className="min-w-[200px]">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </CosmicButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="w-8 h-8 text-text-muted" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: LABS DISCOVERY
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary mb-4">
              <GradientText gradient="cosmic">11 Interactive Labs</GradientText>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Each lab is a complete learning journey with games, experiments, and quests
              designed for different ages and skill levels.
            </p>
          </div>

          {/* Labs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {LAB_COLORS_TABLE.map((lab) => (
              <LabCard
                key={lab.id}
                id={lab.id}
                name={lab.name}
                color={lab.hex}
                description={labDescriptions[lab.id] || 'Explore this exciting AI topic!'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: FEATURES
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-6">
        {/* Background accent */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(182,123,255,0.15) 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary mb-4">
              Built for <GradientText gradient="cosmic">Young Minds</GradientText>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Everything kids need to understand AI, and everything parents need to feel confident.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: STATS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <GlassCard variant="elevated" className="!p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <Stat value="11" label="Learning Labs" color="#00D4FF" />
              <Stat value="35+" label="Interactive Games" color="#B67BFF" />
              <Stat value="7-16" label="Age Range" color="#FF70AF" />
              <Stat value="100%" label="Ad-Free" color="#00D17A" />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: TESTIMONIAL / SOCIAL PROOF
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Award key={i} className="w-6 h-6 text-yellow-400" />
            ))}
          </div>
          <blockquote className="font-display text-2xl md:text-3xl text-text-primary mb-6 leading-relaxed">
            &quot;SparkForge turned my daughter from someone who was scared of technology into 
            someone who wants to build AI robots. The games are brilliant!&quot;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-text-primary font-medium">Sarah M.</div>
              <div className="text-text-muted text-sm">Parent of 9-year-old</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-6">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(182,123,255,0.1) 50%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <Zap className="w-12 h-12 mx-auto mb-6 text-neon-amber" />
          <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary mb-6">
            Ready to{' '}
            <GradientText gradient="cosmic">Ignite Curiosity</GradientText>?
          </h2>
          <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">
            Join thousands of families already exploring AI together. 
            Start with our free tier — no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <CosmicButton size="lg" className="min-w-[220px] animate-cosmic-pulse">
                Get Started Free
                <Rocket className="w-5 h-5" />
              </CosmicButton>
            </Link>
            <Link href="/pricing">
              <CosmicButton variant="ghost" size="lg">
                View Pricing
              </CosmicButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
