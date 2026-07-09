'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  UserCog,
  Scale,
  Cpu,
  Blocks,
  Lightbulb,
  Hand,
  Hammer,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { GAME_REGISTRY } from '@/config/gameRegistry';
import { LAB_COLORS_HEX } from '@/config/labColors';

// ════════════════════════════════════════════════════════════════════
// /competencies — UNESCO AI Competency Framework for Students map (G5)
// ════════════════════════════════════════════════════════════════════
// Honestly maps the framework's 4 dimensions × 3 progression levels
// (12 competency blocks) to SparkForge's 11 labs / 47 games.
// Game references are drawn ONLY from GAME_REGISTRY (source of truth);
// cells with light coverage are marked "Growing" rather than padded.
// SparkForge aligns to the framework — no official endorsement is claimed.
// ════════════════════════════════════════════════════════════════════

const LEVELS = [
  {
    key: 'understand',
    label: 'Understand',
    blurb: 'Foundational awareness',
    Icon: Lightbulb,
  },
  {
    key: 'apply',
    label: 'Apply',
    blurb: 'Use and evaluate in context',
    Icon: Hand,
  },
  {
    key: 'create',
    label: 'Create',
    blurb: 'Design, build, critically shape',
    Icon: Hammer,
  },
] as const;

type LevelKey = (typeof LEVELS)[number]['key'];

interface Cell {
  /** Kid/parent-legible description of the competency at this level. */
  desc: string;
  /** Game slugs from GAME_REGISTRY that build this competency. */
  games: string[];
  /** Honest flag: coverage here is still growing. */
  growing?: boolean;
}

interface Dimension {
  id: string;
  title: string;
  summary: string;
  hex: string;
  Icon: typeof UserCog;
  cells: Record<LevelKey, Cell>;
}

// ── The 4 × 3 map ──────────────────────────────────────────────────
// Every slug below is verified against GAME_REGISTRY.
const DIMENSIONS: Dimension[] = [
  {
    id: 'human-centred',
    title: 'Human-centred mindset',
    summary:
      'AI serves people. Human agency, judgment, and oversight always stay in charge.',
    hex: LAB_COLORS_HEX[1], // #0FB8FA
    Icon: UserCog,
    cells: {
      understand: {
        desc: 'Notice where AI already lives in everyday life and see that people — not machines — decide what AI is for.',
        games: ['ai-spy', 'human-vs-machine', 'pocket-brain'],
      },
      apply: {
        desc: 'Decide when to trust AI and when to rely on a human, and recognise when an app is nudging you.',
        games: ['just-a-friend', 'tool-picker', 'trace-it'],
      },
      create: {
        desc: 'Imagine and sketch AI that genuinely helps people, weighing its effect on real communities.',
        games: ['future-forge', 'career-explorer'],
        growing: true,
      },
    },
  },
  {
    id: 'ethics',
    title: 'Ethics of AI',
    summary:
      'Fairness, privacy, transparency, accountability, and safety when AI makes or shapes decisions.',
    hex: LAB_COLORS_HEX[6], // #FF7050
    Icon: Scale,
    cells: {
      understand: {
        desc: 'Learn what personal data is worth protecting and how to tell real media from AI fakes and scams.',
        games: ['data-shield', 'real-or-fake', 'code-word'],
      },
      apply: {
        desc: 'Weigh fairness and bias in AI decisions and argue both sides of a real ethical dilemma.',
        games: ['bias-detective', 'ethics-courtroom', 'just-a-friend'],
      },
      create: {
        desc: 'Build accountability in: open up an AI to inspect its reasoning and add safety rails around it.',
        games: ['glass-box', 'harness-forge'],
      },
    },
  },
  {
    id: 'techniques',
    title: 'AI techniques & applications',
    summary:
      'How AI systems actually work — data, models, and algorithms — and where they get used.',
    hex: LAB_COLORS_HEX[2], // #B67BFF
    Icon: Cpu,
    cells: {
      understand: {
        desc: 'See the moving parts under the hood: neurons, pixels, and the tokens that language models read.',
        games: ['neural-builder', 'pixel-investigator', 'token-chopper'],
      },
      apply: {
        desc: 'Train, tune, and test a model in context — from teaching a pet to reading a sentence’s mood.',
        games: ['pet-trainer', 'sort-toy-box', 'sentiment-scanner'],
      },
      create: {
        desc: 'Assemble your own working AI: label data to build a classifier, wire a chatbot, curate its memory.',
        games: ['build-classifier', 'chatbot-builder', 'context-architect'],
      },
    },
  },
  {
    id: 'system-design',
    title: 'AI system design',
    summary:
      'Scoping a problem, then building, testing, and iterating on an AI solution — including agents.',
    hex: LAB_COLORS_HEX[11], // #6FFFE6
    Icon: Blocks,
    cells: {
      understand: {
        desc: 'Learn how AI programs are put together, from code blocks to prompts and step-by-step reasoning.',
        games: ['code-blocks', 'prompt-lab', 'thinking-cap'],
      },
      apply: {
        desc: 'Drive real AI systems: call an API, give an agent new tools, and verify the code AI writes for you.',
        games: ['api-explorer', 'mcp-lab', 'vibe-coder'],
      },
      create: {
        desc: 'Design and ship an end-to-end AI: build your first app and orchestrate a team of cooperating agents.',
        games: ['my-first-ai-app', 'agent-architect', 'agent-atelier'],
      },
    },
  },
];

// ── Registry-backed chip lookup ────────────────────────────────────
function gameChip(slug: string) {
  const entry = GAME_REGISTRY.find((g) => g.slug === slug);
  if (!entry) return null;
  return { name: entry.name, hex: LAB_COLORS_HEX[entry.lab], lab: entry.labName };
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function CompetenciesContent() {
  return (
    <div className="pt-24 pb-20">
      {/* ═══ Hero ═══ */}
      <section className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spark-blue/10 border border-spark-blue/20 text-spark-blue text-xs font-data uppercase tracking-wider mb-5">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Standards alignment
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
            The UNESCO AI Competency
            <br className="hidden sm:block" /> Framework, mapped to play
          </h1>
          <p className="text-lg font-body text-white/70 leading-relaxed max-w-2xl mx-auto">
            SparkForge aligns its 11 labs and 47 games to the{' '}
            <strong className="text-white">
              UNESCO AI Competency Framework for Students
            </strong>{' '}
            &mdash; the international reference for what young people should
            understand, apply, and create with AI. Below is an honest map of
            which games build which competency.
          </p>
        </motion.div>

        {/* Framework primer */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left"
        >
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="font-display text-2xl font-bold text-white">4</p>
            <p className="text-sm font-body text-white/60">
              Dimensions of AI capability
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="font-display text-2xl font-bold text-white">3</p>
            <p className="text-sm font-body text-white/60">
              Progression levels each
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="font-display text-2xl font-bold text-white">12</p>
            <p className="text-sm font-body text-white/60">
              Competency blocks in total
            </p>
          </div>
        </motion.div>

        <p className="mt-6 text-xs font-body text-white/55 max-w-2xl mx-auto">
          SparkForge is independently built and aligns to the framework as a
          guide. It is not endorsed, certified, or accredited by UNESCO.
        </p>
      </section>

      {/* ═══ Level legend (desktop column headers live inside grid) ═══ */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        {/* Desktop header row: dimension gutter + 3 level columns */}
        <div className="hidden lg:grid grid-cols-[minmax(220px,1fr)_2fr_2fr_2fr] gap-4 mb-4 items-end">
          <div />
          {LEVELS.map((lvl) => {
            const LvlIcon = lvl.Icon;
            return (
              <div key={lvl.key} className="px-2">
                <div className="flex items-center gap-2 text-white">
                  <LvlIcon className="w-4 h-4 text-white/70" aria-hidden="true" />
                  <span className="font-display text-sm font-semibold uppercase tracking-wider">
                    {lvl.label}
                  </span>
                </div>
                <p className="text-xs font-body text-white/55 mt-1">{lvl.blurb}</p>
              </div>
            );
          })}
        </div>

        {/* ═══ 4 dimension rows ═══ */}
        <div className="space-y-4">
          {DIMENSIONS.map((dim, rowIndex) => {
            const DimIcon = dim.Icon;
            return (
              <motion.div
                key={dim.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{
                  duration: 0.45,
                  ease: 'easeOut',
                  delay: Math.min(rowIndex * 0.05, 0.2),
                }}
                className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1fr)_2fr_2fr_2fr] gap-4"
              >
                {/* Dimension label cell */}
                <div
                  className="rounded-2xl p-5 border relative overflow-hidden"
                  style={{
                    borderColor: `${dim.hex}40`,
                    background: `linear-gradient(160deg, ${dim.hex}1A, rgba(255,255,255,0.02))`,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: `${dim.hex}26`,
                      color: dim.hex,
                    }}
                  >
                    <DimIcon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-white leading-snug">
                    {dim.title}
                  </h2>
                  <p className="text-sm font-body text-white/60 mt-2 leading-relaxed">
                    {dim.summary}
                  </p>
                </div>

                {/* 3 level cells */}
                {LEVELS.map((lvl) => {
                  const cell = dim.cells[lvl.key];
                  const LvlIcon = lvl.Icon;
                  return (
                    <div
                      key={lvl.key}
                      className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.08] flex flex-col"
                    >
                      {/* Mobile-only level tag */}
                      <div className="flex items-center gap-1.5 mb-2 lg:hidden">
                        <LvlIcon
                          className="w-3.5 h-3.5 text-white/60"
                          aria-hidden="true"
                        />
                        <span className="text-xs font-data uppercase tracking-wider text-white/60">
                          {lvl.label}
                        </span>
                      </div>

                      <p className="text-sm font-body text-white/80 leading-relaxed mb-4">
                        {cell.desc}
                      </p>

                      <div className="mt-auto flex flex-wrap gap-2">
                        {cell.games.map((slug) => {
                          const chip = gameChip(slug);
                          if (!chip) return null;
                          return (
                            <span
                              key={slug}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-body text-white/85"
                              title={chip.lab}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: chip.hex }}
                                aria-hidden="true"
                              />
                              {chip.name}
                            </span>
                          );
                        })}
                        {cell.growing && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium"
                            style={{
                              backgroundColor: `${dim.hex}1A`,
                              color: dim.hex,
                            }}
                          >
                            Growing &middot; more games coming
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>

        {/* Honesty note */}
        <p className="mt-8 text-sm font-body text-white/60 max-w-3xl leading-relaxed">
          We map only real, playable games to each competency &mdash; and where
          our coverage is still thin, we say so plainly rather than overstate it.
          A single game can build more than one competency, so some appear in
          more than one cell.
        </p>
      </section>

      {/* ═══ Closing CTA ═══ */}
      <section className="max-w-4xl mx-auto px-6 mt-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-3xl p-8 sm:p-10 text-center border border-white/[0.08] bg-gradient-to-br from-spark-blue/[0.06] to-spark-purple/[0.06]"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            Build every one of these competencies
          </h2>
          <p className="text-base font-body text-white/70 max-w-xl mx-auto mb-7 leading-relaxed">
            Start free and let your learner explore all four dimensions of AI
            capability &mdash; at their own age and pace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-semibold text-white bg-gradient-to-r from-spark-blue to-spark-purple hover:shadow-glow-blue transition-shadow duration-300"
            >
              Start free
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-semibold text-white/80 bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-colors duration-200"
            >
              See plans
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
