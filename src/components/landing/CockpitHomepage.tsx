// src/components/landing/CockpitHomepage.tsx
// ================================================================
// COCKPIT HOMEPAGE — Futuristic HUD-Style Landing Experience
// ================================================================
// Inspired by reference images: sci-fi cockpit interfaces, data
// dashboards with cyan/teal accents, holographic spheres, and
// wireframe terrain visualizations.
//
// Uses BrandHeroSlot for the core brand surface (dichroic wordmark).
// All other elements (chrome, HUD, infographics) are reimagined
// around it following the SparkForge registry guidelines.
//
// Color palette: lab colors from sparkforge-tokens.css
// ================================================================

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Rocket,
  Sparkles,
  ArrowDown,
  Zap,
  Shield,
  Brain,
  Gamepad2,
  Award,
  BarChart3,
  Activity,
  Target,
  Cpu,
  Globe,
  ChevronRight,
} from 'lucide-react';

// BrandHeroSlot — the WebGPU dichroic wordmark (Core/Preserve)
const BrandHeroSlot = dynamic(
  () => import('@/registry/blocks/brand-hero-slot').then((mod) => ({ default: mod.BrandHeroSlot })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[var(--sf-void-navy)]">
        <img
          src="/branding/sparkforge-hero.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain opacity-90"
        />
      </div>
    ),
  }
);

// ─── HUD Panel Component ───────────────────────────────────────────
interface HudPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

function HudPanel({ title, children, className = '', glowColor = 'var(--sf-rim-cyan)', delay = 0 }: HudPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      className={`relative ${className}`}
    >
      {/* Chrome bezel frame */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(168,181,200,0.12) 0%, rgba(168,181,200,0.04) 40%, rgba(0,0,0,0.2) 100%)',
          padding: '1px',
        }}
      >
        {/* Inner panel */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(7,10,20,0.95) 0%, rgba(2,5,13,0.98) 100%)',
          }}
        >
          {/* Top LED accent */}
          <div
            className="h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${glowColor} 20%, ${glowColor} 80%, transparent 100%)`,
              opacity: 0.6,
            }}
          />

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              {title}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--sf-led-green)]/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--sf-led-amber)]/40" />
            </div>
          </div>

          {/* Panel content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-white/10 rounded-tl" />
      <div className="absolute -top-px -right-px w-3 h-3 border-t border-r border-white/10 rounded-tr" />
      <div className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-white/10 rounded-bl" />
      <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-white/10 rounded-br" />
    </motion.div>
  );
}

// ─── Animated Gauge Component ──────────────────────────────────────
interface GaugeProps {
  value: number;
  label: string;
  color: string;
  size?: number;
}

function AnimatedGauge({ value, label, color, size = 80 }: GaugeProps) {
  const circumference = 2 * Math.PI * 35;
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={35}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={35}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
        {/* Center glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={25}
          fill={`${color}08`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="font-data text-lg font-bold text-white">{animatedValue}%</span>
      </div>
      <span className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/50">{label}</span>
    </div>
  );
}

// ─── Stat Counter Component ────────────────────────────────────────
interface StatCounterProps {
  value: number;
  suffix?: string;
  label: string;
  icon: typeof Sparkles;
  color: string;
}

function StatCounter({ value, suffix = '', label, icon: Icon, color }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let current = 0;
          const step = Math.max(1, Math.ceil(value / 60));
          const tick = () => {
            current = Math.min(current + step, value);
            setCount(current);
            if (current < value) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div
        className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <p className="font-data text-3xl md:text-4xl font-bold text-white">
        {count}{suffix}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mt-1">{label}</p>
    </div>
  );
}

// ─── Animated Bar Chart ────────────────────────────────────────────
function AnimatedBarChart() {
  const bars = [
    { height: 45, color: 'var(--sf-lab-1)' },
    { height: 65, color: 'var(--sf-lab-2)' },
    { height: 35, color: 'var(--sf-lab-3)' },
    { height: 80, color: 'var(--sf-lab-4)' },
    { height: 55, color: 'var(--sf-lab-5)' },
    { height: 70, color: 'var(--sf-lab-6)' },
    { height: 40, color: 'var(--sf-lab-7)' },
  ];

  return (
    <div className="flex items-end justify-between h-24 gap-1.5">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${bar.height}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 rounded-t-sm"
          style={{
            background: `linear-gradient(180deg, ${bar.color} 0%, ${bar.color}40 100%)`,
            boxShadow: `0 0 12px ${bar.color}30`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Wireframe Terrain Visualization ───────────────────────────────
function WireframeTerrain() {
  const lines = 12;
  const points = 20;

  return (
    <svg viewBox="0 0 400 150" className="w-full h-32">
      <defs>
        <linearGradient id="terrainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--sf-rim-cyan)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--sf-rim-cyan)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {Array.from({ length: lines }).map((_, lineIndex) => {
        const y = 30 + lineIndex * 10;
        const pathPoints = Array.from({ length: points }).map((_, i) => {
          const x = (i / (points - 1)) * 400;
          const wave = Math.sin((i / points) * Math.PI * 2 + lineIndex * 0.5) * 20;
          const noise = Math.sin((i / points) * Math.PI * 4) * 8;
          return `${i === 0 ? 'M' : 'L'} ${x} ${y + wave + noise}`;
        }).join(' ');

        return (
          <motion.path
            key={lineIndex}
            d={pathPoints}
            fill="none"
            stroke="url(#terrainGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 - lineIndex * 0.06 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: lineIndex * 0.05 }}
          />
        );
      })}
    </svg>
  );
}

// ─── Lab Card Component ────────────────────────────────────────────
interface LabCardProps {
  id: number;
  name: string;
  color: string;
  progress: number;
  delay?: number;
}

function LabCard({ id, name, color, progress, delay = 0 }: LabCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: id % 2 === 0 ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-lg overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)`,
        }}
      />

      <div className="relative p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-data text-sm font-bold"
            style={{ background: `${color}20`, color }}
          >
            {id}
          </div>
          <span className="font-body text-sm font-medium text-white/90">{name}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: delay + 0.2 }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
              boxShadow: `0 0 8px ${color}60`,
            }}
          />
        </div>
      </div>

      {/* Side LED indicator */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 rounded-r"
        style={{ background: color, opacity: 0.6 }}
      />
    </motion.div>
  );
}

// ─── Feature Highlight Component ───────────────────────────────────
interface FeatureHighlightProps {
  icon: typeof Sparkles;
  title: string;
  description: string;
  color: string;
  delay?: number;
}

function FeatureHighlight({ icon: Icon, title, description, color, delay = 0 }: FeatureHighlightProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative"
    >
      <div className="flex gap-4">
        <div
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          style={{
            background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            boxShadow: `0 0 20px ${color}10`,
          }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-white mb-1">{title}</h3>
          <p className="font-body text-sm text-white/60 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Cockpit Homepage Component ───────────────────────────────
export function CockpitHomepage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Parallax transforms
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Lab data with colors from sparkforge-tokens.css
  const labs = [
    { id: 1, name: 'What IS AI?', color: '#0FB8FA', progress: 85 },
    { id: 2, name: 'Teaching Machines', color: '#B67BFF', progress: 72 },
    { id: 3, name: 'The Brain Inside', color: '#FF70AF', progress: 58 },
    { id: 4, name: 'AI That Creates', color: '#D9A430', progress: 90 },
    { id: 5, name: 'AI Helpers', color: '#00D17A', progress: 65 },
    { id: 6, name: 'AI & Ethics', color: '#FF7050', progress: 45 },
    { id: 7, name: 'Computer Vision', color: '#10BAD2', progress: 78 },
    { id: 8, name: 'Words & Language', color: '#8F96FA', progress: 52 },
    { id: 9, name: 'Build Your AI', color: '#E68E28', progress: 38 },
    { id: 10, name: 'AI Futures', color: '#DE5AEA', progress: 25 },
    { id: 11, name: 'Agentic AI', color: '#6FFFE6', progress: 15 },
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Brand Surface with Dichroic Wordmark
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-end">
        {/* SEO/Accessibility title */}
        <h1 className="sr-only">SparkForge — the AI Laboratory for kids ages 7 to 16</h1>

        {/* Brand Hero 3D Canvas (Core/Preserve) */}
        <motion.div
          className="absolute inset-0 -z-10"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <BrandHeroSlot />
        </motion.div>

        {/* HUD Frame overlay */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Top left corner bracket */}
          <div className="absolute top-8 left-8 w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--sf-rim-cyan)]/60 to-transparent" />
            <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-[var(--sf-rim-cyan)]/60 to-transparent" />
          </div>

          {/* Top right corner bracket */}
          <div className="absolute top-8 right-8 w-16 h-16">
            <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-[var(--sf-rim-cyan)]/60 to-transparent" />
            <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-[var(--sf-rim-cyan)]/60 to-transparent" />
          </div>

          {/* Bottom corner brackets */}
          <div className="absolute bottom-32 left-8 w-16 h-16">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--sf-rim-cyan)]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-[var(--sf-rim-cyan)]/40 to-transparent" />
          </div>
          <div className="absolute bottom-32 right-8 w-16 h-16">
            <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-[var(--sf-rim-cyan)]/40 to-transparent" />
            <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-[var(--sf-rim-cyan)]/40 to-transparent" />
          </div>

          {/* Side status indicators */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 h-8 rounded-full"
                style={{
                  background: 'linear-gradient(180deg, var(--sf-led-blue) 0%, transparent 100%)',
                  opacity: 0.4 + i * 0.1,
                }}
              />
            ))}
          </div>
          <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 h-8 rounded-full"
                style={{
                  background: 'linear-gradient(180deg, var(--sf-led-purple) 0%, transparent 100%)',
                  opacity: 0.4 + i * 0.1,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hero Content — Below the wordmark */}
        <div className="relative z-10 text-center px-6 pb-20 w-full max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="font-body text-lg md:text-xl text-white/85 mb-8 leading-relaxed"
          >
            The AI Laboratory where kids discover, experiment, and build
            with artificial intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-body font-semibold text-white transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, var(--sf-spark-blue) 0%, var(--sf-spark-purple) 100%)',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.3), 0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Rocket className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              Launch Your Journey
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-body font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              View Pricing
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="mt-12 flex flex-col items-center gap-2"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              Scroll to explore
            </span>
            <motion.div
              animate={!prefersReducedMotion ? { y: [0, 6, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowDown className="w-4 h-4 text-white/30" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          COCKPIT DASHBOARD SECTION — HUD Panels & Infographics
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        {/* Aurora background */}
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-[var(--sf-spark-blue)]/[0.03] blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[var(--sf-spark-purple)]/[0.04] blur-[80px]" />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-mono text-xs text-[var(--sf-rim-cyan)]/60 uppercase tracking-widest mb-3"
            >
              Mission Control
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-5xl font-bold text-white mb-4"
            >
              Your Laboratory Awaits
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-body text-base md:text-lg text-white/60 max-w-xl mx-auto"
            >
              11 immersive labs, 35+ games, and a personalized dashboard
              that tracks every discovery.
            </motion.p>
          </div>

          {/* HUD Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column — Stats & Gauges */}
            <div className="lg:col-span-3 space-y-6">
              {/* Performance Gauges */}
              <HudPanel title="System Status" glowColor="var(--sf-led-green)" delay={0}>
                <div className="grid grid-cols-2 gap-4">
                  <AnimatedGauge value={87} label="Progress" color="#00D17A" />
                  <AnimatedGauge value={64} label="Mastery" color="#0FB8FA" />
                </div>
              </HudPanel>

              {/* Quick Stats */}
              <HudPanel title="Statistics" glowColor="var(--sf-led-amber)" delay={0.1}>
                <div className="space-y-3">
                  {[
                    { label: 'XP Earned', value: '2,847', color: '#FFAA44' },
                    { label: 'Badges Unlocked', value: '23', color: '#B67BFF' },
                    { label: 'Games Completed', value: '18', color: '#0FB8FA' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase text-white/40">{stat.label}</span>
                      <span className="font-data text-sm font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </HudPanel>
            </div>

            {/* Center column — Main visualization */}
            <div className="lg:col-span-6 space-y-6">
              {/* Terrain Visualization */}
              <HudPanel title="Neural Activity" glowColor="var(--sf-rim-cyan)" delay={0.2}>
                <WireframeTerrain />
                <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                  {[
                    { label: 'Sessions', value: '147' },
                    { label: 'Avg Time', value: '24m' },
                    { label: 'Streak', value: '12d' },
                    { label: 'Rank', value: '#42' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="font-data text-lg font-bold text-white">{item.value}</p>
                      <p className="font-mono text-[9px] uppercase text-white/40">{item.label}</p>
                    </div>
                  ))}
                </div>
              </HudPanel>

              {/* Activity Chart */}
              <HudPanel title="Weekly Activity" glowColor="var(--sf-led-purple)" delay={0.3}>
                <AnimatedBarChart />
                <div className="mt-3 flex justify-between">
                  <span className="font-mono text-[9px] text-white/30">Mon</span>
                  <span className="font-mono text-[9px] text-white/30">Sun</span>
                </div>
              </HudPanel>
            </div>

            {/* Right column — Lab list */}
            <div className="lg:col-span-3 space-y-6">
              <HudPanel title="Lab Progress" glowColor="var(--sf-led-blue)" delay={0.15}>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {labs.slice(0, 6).map((lab, i) => (
                    <LabCard key={lab.id} {...lab} delay={i * 0.05} />
                  ))}
                </div>
              </HudPanel>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES SECTION — Feature Highlights
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-mono text-xs text-[var(--sf-key-amber)]/60 uppercase tracking-widest mb-3"
            >
              Core Systems
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Built for Young Explorers
            </motion.h2>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <FeatureHighlight
              icon={Sparkles}
              title="Gamified Learning"
              description="Earn XP, collect badges, unlock new labs, and climb the leaderboard. Every experiment rewards curiosity."
              color="#FFAA44"
              delay={0}
            />
            <FeatureHighlight
              icon={Shield}
              title="AI Safety First"
              description="COPPA 2025 compliant. Content moderation, bias detection lessons, and responsible AI baked into every lab."
              color="#00FF88"
              delay={0.1}
            />
            <FeatureHighlight
              icon={Brain}
              title="Adaptive Learning"
              description="Three age bands (7-9, 10-12, 13-16) with content that adapts to each child's level."
              color="#AA66FF"
              delay={0.2}
            />
            <FeatureHighlight
              icon={BarChart3}
              title="Parent Dashboard"
              description="Track progress, set time limits, review completed experiments, and celebrate milestones together."
              color="#00BBFF"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STATS SECTION — Counter Stats
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={11} label="AI Labs" icon={Cpu} color="#0FB8FA" />
            <StatCounter value={35} suffix="+" label="Games" icon={Gamepad2} color="#B67BFF" />
            <StatCounter value={100} suffix="+" label="Badges" icon={Award} color="#FFAA44" />
            <StatCounter value={3} label="Age Bands" icon={Target} color="#00D17A" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA SECTION — Final Call to Action
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        {/* Glow backdrop */}
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[var(--sf-spark-blue)]/[0.06] blur-[120px]" />
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Chrome frame */}
            <div
              className="relative rounded-2xl p-8 md:p-12"
              style={{
                background: 'linear-gradient(145deg, rgba(7,10,20,0.9) 0%, rgba(2,5,13,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 60px rgba(59, 130, 246, 0.1), 0 25px 50px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Top LED strip */}
              <div
                className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, var(--sf-rim-cyan), transparent)',
                  opacity: 0.5,
                }}
              />

              <p className="font-mono text-xs text-[var(--sf-rim-cyan)]/60 uppercase tracking-widest mb-4">
                Ready for Launch
              </p>
              <h2 className="font-display text-2xl md:text-4xl font-bold text-white mb-4">
                Your Station Awaits
              </h2>
              <p className="font-body text-base text-white/60 mb-8 max-w-md mx-auto">
                Join thousands of young explorers discovering AI through play.
                Start free, no credit card required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-body font-semibold text-white transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, var(--sf-spark-blue) 0%, var(--sf-spark-purple) 100%)',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.3), 0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <Zap className="w-5 h-5" />
                  Start Free Today
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-body font-medium text-white/70 hover:text-white transition-colors"
                >
                  Already exploring? Log in
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default CockpitHomepage;
