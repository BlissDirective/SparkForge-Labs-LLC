// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// MY FIRST AI APP — Lab 9 (Build with AI) — FLAGSHIP-LITE
//
// v3-FINAL: Full standalone replacement of v2 code with 3D integration
// SUPERSEDES: STAGE7F_Part1.pdf (My First AI App section)
//
// FEATURES:
// 1. 5-step guided app builder wizard with animated transitions
// 2. "AI Power Cards" — illustrated capability selection with glow FX
// 3. Live app preview mockup that updates as kids build
// 4. "How It Works" diagram showing AI powers in a pipeline
// 5. App rating system — Innovation Score with animated gauge
// 6. Shareable "App Card" output with custom design
// 7. Band A: guided (3 categories, 4 powers, visual)
//    Band B: expanded (5 categories, 6 powers, How It Works)
//    Band C: full (7 categories, 9 powers, architecture diagram, code peek)
// 8. Welcome phase, learn phase with 4 concept cards
// 9. Chrome bezel (orange, Lab 9), particles, ARIA, keyboard nav
// [v3] 10. 3D app mockup assembly via MyFirstAiApp3D (desktop only)
// [v3] 11. Dynamic import with Suspense
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import {
  Play, BookOpen, Sparkles, Star, ArrowRight, ArrowLeft,
  Award, Rocket
} from 'lucide-react';

// [v3] Dynamic import for 3D component — SSR disabled, desktop only
const MyFirstAiApp3D = dynamic(
  () => import('@/components/3d/MyFirstAiApp3D'),
  { ssr: false }
);

// ■■■■ Types ■■■■

type Phase = 'welcome' | 'learn' | 'build' | 'preview' | 'complete';
type BuildStep = 'category' | 'name' | 'powers' | 'audience' | 'design';

interface AppCategory {
  id: string; title: string; emoji: string;
  description: string; descriptionB: string; descriptionC: string;
  color: string; bandMin: 'A' | 'B' | 'C';
}

interface AIPower {
  id: string; title: string; emoji: string;
  description: string; descriptionB: string; descriptionC: string;
  techLabel: string; color: string; bandMin: 'A' | 'B' | 'C';
}

interface DesignTheme {
  id: string; name: string; emoji: string;
  bgGradient: string; accentColor: string; textColor: string;
}

interface ConceptCard {
  emoji: string; title: string;
  description: string; descriptionB: string; descriptionC: string;
  color: string;
}

// ■■■■ Concept Cards (Learn Phase) ■■■■

const CONCEPT_CARDS: ConceptCard[] = [
  {
    emoji: '\u{1F4F1}', title: 'AI Apps Are Everywhere!',
    description: 'From photo filters to voice assistants \u2014 lots of apps use AI to do cool things behind the scenes!',
    descriptionB: 'Most modern apps use AI behind the scenes \u2014 autocorrect, recommendations, search ranking, fraud detection. AI is the invisible engine.',
    descriptionC: 'AI-powered apps combine multiple ML services (NLP, computer vision, recommendation engines) into user-facing products. Architecture matters.',
    color: '#F97316',
  },
  {
    emoji: '\u{1F9E9}', title: 'AI Powers Combine!',
    description: 'An AI app picks special powers \u2014 like seeing pictures, understanding words, or predicting the future!',
    descriptionB: 'AI apps chain together capabilities: image recognition + language understanding + data analysis = powerful combinations.',
    descriptionC: 'AI application architecture involves composing ML models into pipelines. Input preprocessing, model inference, postprocessing, and output formatting.',
    color: '#FB923C',
  },
  {
    emoji: '\u{1F465}', title: 'Built for People',
    description: 'The best AI apps solve real problems for real people. Who will use YOUR app?',
    descriptionB: 'User-centered design means understanding who your audience is and what problems they face. Great AI apps start with empathy.',
    descriptionC: 'Product-market fit in AI: identify a user pain point, select appropriate ML capabilities, design intuitive interfaces, and validate with real users.',
    color: '#EA580C',
  },
  {
    emoji: '\u{1F680}', title: 'You Can Build This!',
    description: 'Real app builders start exactly like this \u2014 with an idea, some AI powers, and a dream!',
    descriptionB: 'Companies like OpenAI, Google, and startups all begin with this process: define the problem, select AI capabilities, design the UX.',
    descriptionC: 'The AI product lifecycle: ideation \u2192 capability selection \u2192 data sourcing \u2192 model training \u2192 integration \u2192 deployment \u2192 monitoring \u2192 iteration.',
    color: '#C2410C',
  },
];

// ■■■■ App Categories ■■■■

const ALL_CATEGORIES: AppCategory[] = [
  { id: 'helper', title: 'Helper App', emoji: '\u{1F9F9}',
    description: 'An app that helps people with everyday tasks!',
    descriptionB: 'A productivity or utility app that uses AI to assist with daily activities.',
    descriptionC: 'An AI-powered utility that automates tasks, provides recommendations, or augments decision-making.',
    color: '#22C55E', bandMin: 'A' },
  { id: 'creative', title: 'Creative App', emoji: '\u{1F3A8}',
    description: 'An app that makes art, music, or stories with AI!',
    descriptionB: 'A generative AI app that creates original content \u2014 images, music, writing, or video.',
    descriptionC: 'A generative AI application leveraging diffusion models, LLMs, or music transformers for original content creation.',
    color: '#A855F7', bandMin: 'A' },
  { id: 'game', title: 'Game App', emoji: '\u{1F3AE}',
    description: 'A fun game that uses AI to make it exciting!',
    descriptionB: 'An AI-enhanced game with smart opponents, procedural content, or adaptive difficulty.',
    descriptionC: 'A game utilizing reinforcement learning for NPCs, procedural generation, or adaptive difficulty scaling.',
    color: '#3B82F6', bandMin: 'A' },
  { id: 'learning', title: 'Learning App', emoji: '\u{1F4DA}',
    description: 'An app that teaches people new things using AI!',
    descriptionB: 'An adaptive learning platform that personalizes education to each student\'s pace and style.',
    descriptionC: 'An intelligent tutoring system using knowledge tracing, spaced repetition, and adaptive content sequencing.',
    color: '#06B6D4', bandMin: 'B' },
  { id: 'social', title: 'Social Good App', emoji: '\u{1F30D}',
    description: 'An app that helps make the world a better place!',
    descriptionB: 'An AI app designed to address social challenges \u2014 health, environment, accessibility.',
    descriptionC: 'An AI-for-good application addressing SDGs: climate monitoring, health diagnostics, accessibility tools.',
    color: '#10B981', bandMin: 'B' },
  { id: 'health', title: 'Health & Wellness', emoji: '\u{1FA7A}',
    description: 'An app that helps people stay healthy and feel good!',
    descriptionB: 'An AI health app that tracks wellness, provides fitness guidance, or supports mental health.',
    descriptionC: 'A digital health application using wearable data analysis, symptom NLP, or treatment recommendation engines.',
    color: '#EF4444', bandMin: 'C' },
  { id: 'business', title: 'Business Tool', emoji: '\u{1F4BC}',
    description: 'An app that helps businesses work smarter!',
    descriptionB: 'An AI business tool for data analysis, customer service automation, or workflow optimization.',
    descriptionC: 'An enterprise AI solution combining analytics dashboards, NLP-powered customer support, and predictive operations.',
    color: '#6366F1', bandMin: 'C' },
];

// ■■■■ AI Powers ■■■■

const ALL_POWERS: AIPower[] = [
  { id: 'see', title: 'See Pictures', emoji: '\u{1F441}',
    description: 'Your app can look at photos and understand what\'s in them!',
    descriptionB: 'Computer Vision \u2014 recognize objects, faces, scenes, and text in images.',
    descriptionC: 'Computer Vision: CNNs and Vision Transformers for image classification, object detection, OCR, and scene understanding.',
    techLabel: 'Computer Vision', color: '#06B6D4', bandMin: 'A' },
  { id: 'talk', title: 'Understand Words', emoji: '\u{1F4AC}',
    description: 'Your app can read text and understand what people mean!',
    descriptionB: 'Natural Language Processing \u2014 understand, generate, and respond to human text.',
    descriptionC: 'NLP: Transformer-based language models for text classification, entity extraction, summarization, and generation.',
    techLabel: 'NLP', color: '#818CF8', bandMin: 'A' },
  { id: 'remember', title: 'Remember Things', emoji: '\u{1F9E0}',
    description: 'Your app can remember what users like and learn from it!',
    descriptionB: 'Machine Learning Memory \u2014 store preferences, learn patterns, and improve over time.',
    descriptionC: 'Recommendation systems: collaborative filtering, content-based filtering, and hybrid approaches for personalization.',
    techLabel: 'Memory / RecSys', color: '#A855F7', bandMin: 'A' },
  { id: 'create', title: 'Create New Things', emoji: '\u2728',
    description: 'Your app can make new pictures, stories, or music from scratch!',
    descriptionB: 'Generative AI \u2014 create original images, text, music, or code.',
    descriptionC: 'Generative models: diffusion models (DALL-E, Stable Diffusion), autoregressive LLMs, and neural audio synthesis.',
    techLabel: 'Generative AI', color: '#F59E0B', bandMin: 'A' },
  { id: 'listen', title: 'Hear & Speak', emoji: '\u{1F3A4}',
    description: 'Your app can listen to voices and talk back!',
    descriptionB: 'Speech Recognition & Synthesis \u2014 convert speech to text and text to speech.',
    descriptionC: 'ASR (Whisper, DeepSpeech) for speech-to-text. TTS (ElevenLabs, Bark) for text-to-speech. Real-time streaming supported.',
    techLabel: 'Speech AI', color: '#EC4899', bandMin: 'B' },
  { id: 'predict', title: 'Predict the Future', emoji: '\u{1F52E}',
    description: 'Your app can guess what might happen next based on patterns!',
    descriptionB: 'Predictive Analytics \u2014 forecast trends, suggest next actions, and anticipate user needs.',
    descriptionC: 'Time series forecasting, regression models, and Bayesian prediction for demand planning, anomaly detection, and trend analysis.',
    techLabel: 'Prediction', color: '#10B981', bandMin: 'B' },
  { id: 'protect', title: 'Stay Safe & Fair', emoji: '\u{1F6E1}',
    description: 'Your app keeps people\'s data safe and treats everyone fairly!',
    descriptionB: 'AI Safety \u2014 content moderation, bias detection, data privacy, and responsible AI practices.',
    descriptionC: 'Responsible AI: differential privacy, fairness constraints (demographic parity, equalized odds), content filtering, and adversarial robustness.',
    techLabel: 'AI Safety', color: '#EF4444', bandMin: 'B' },
  { id: 'code', title: 'Write Code', emoji: '\u{1F4BB}',
    description: 'Your app can help write and fix computer code!',
    descriptionB: 'Code Generation \u2014 AI that writes, debugs, and explains programming code.',
    descriptionC: 'Code LLMs: Codex, StarCoder, CodeLlama for code generation, bug detection, and automated refactoring.',
    techLabel: 'Code AI', color: '#F97316', bandMin: 'C' },
  { id: 'multimodal', title: 'Mix Everything', emoji: '\u{1F300}',
    description: 'Your app can understand pictures AND words AND sounds together!',
    descriptionB: 'Multimodal AI \u2014 process and connect information across text, images, audio, and video.',
    descriptionC: 'Multimodal transformers (GPT-4V, Gemini): cross-attention between modalities for unified reasoning over text, images, and audio.',
    techLabel: 'Multimodal', color: '#D946EF', bandMin: 'C' },
];

// ■■■■ Design Themes ■■■■

const DESIGN_THEMES: DesignTheme[] = [
  { id: 'neon', name: 'Neon Glow', emoji: '\u{1F7E3}', bgGradient: 'from-purple-900 to-indigo-900', accentColor: '#A855F7', textColor: '#E9D5FF' },
  { id: 'ocean', name: 'Ocean Wave', emoji: '\u{1F30A}', bgGradient: 'from-cyan-900 to-blue-900', accentColor: '#06B6D4', textColor: '#CFFAFE' },
  { id: 'sunset', name: 'Sunset Fire', emoji: '\u{1F305}', bgGradient: 'from-orange-900 to-red-900', accentColor: '#F97316', textColor: '#FED7AA' },
  { id: 'forest', name: 'Forest Green', emoji: '\u{1F332}', bgGradient: 'from-emerald-900 to-green-900', accentColor: '#10B981', textColor: '#A7F3D0' },
  { id: 'candy', name: 'Candy Pop', emoji: '\u{1F36C}', bgGradient: 'from-pink-900 to-fuchsia-900', accentColor: '#EC4899', textColor: '#FBCFE8' },
  { id: 'space', name: 'Deep Space', emoji: '\u{1F680}', bgGradient: 'from-slate-900 to-gray-900', accentColor: '#94A3B8', textColor: '#E2E8F0' },
];

// ■■■■ Audience Options ■■■■

const AUDIENCES = [
  { id: 'kids', label: 'Kids (like me!)', emoji: '\u{1F466}' },
  { id: 'teens', label: 'Teenagers', emoji: '\u{1F9D1}' },
  { id: 'adults', label: 'Adults', emoji: '\u{1F468}' },
  { id: 'everyone', label: 'Everyone!', emoji: '\u{1F30D}' },
  { id: 'students', label: 'Students', emoji: '\u{1F393}' },
  { id: 'artists', label: 'Artists & Creators', emoji: '\u{1F3A8}' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

function calcInnovationScore(
  category: string | null, powers: string[], audience: string | null, name: string
): number {
  let score = 0;
  if (category) score += 15;
  if (name.length > 2) score += 10;
  if (name.length > 8) score += 5;
  score += Math.min(powers.length * 12, 48);
  if (audience) score += 10;
  if (powers.includes('see') && powers.includes('create')) score += 5;
  if (powers.includes('talk') && powers.includes('listen')) score += 5;
  if (powers.includes('protect')) score += 7;
  return Math.min(100, score);
}

// ■■■■ Component ■■■■

export function MyFirstAiAppGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const ageBand = (activeChild?.age_band || 'A') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('my-first-ai-app', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [buildStep, setBuildStep] = useState<BuildStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [selectedPowers, setSelectedPowers] = useState<string[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('neon');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showCodePeek, setShowCodePeek] = useState(false);

  const categories = useMemo(
    () => ALL_CATEGORIES.filter(c => BAND_ORDER[c.bandMin] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const powers = useMemo(
    () => ALL_POWERS.filter(p => BAND_ORDER[p.bandMin] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const maxPowers = ageBand === 'A' ? 3 : ageBand === 'B' ? 4 : 5;

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const currentTheme = DESIGN_THEMES.find(t => t.id === selectedTheme) || DESIGN_THEMES[0];
  const currentAudience = AUDIENCES.find(a => a.id === selectedAudience);
  const innovationScore = calcInnovationScore(
    selectedCategory, selectedPowers, selectedAudience, appName
  );

  const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i, x: (((i * 37 + 13) * 7) % 100), y: (((i * 53 + 7) * 11) % 100),
    size: ((i * 17 + 3) % 25) / 10 + 1, delay: ((i * 31 + 5) % 50) / 10, dur: ((i * 43 + 9) % 70) / 10 + 4,
  })), []);

  const togglePower = useCallback((id: string) => {
    setSelectedPowers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < maxPowers ? [...prev, id] : prev
    );
  }, [maxPowers]);

  const BUILD_STEPS: BuildStep[] = ['category', 'name', 'powers', 'audience', 'design'];
  const stepIdx = BUILD_STEPS.indexOf(buildStep);

  const canAdvance = () => {
    switch (buildStep) {
      case 'category': return !!selectedCategory;
      case 'name': return appName.trim().length >= 2;
      case 'powers': return selectedPowers.length >= 1;
      case 'audience': return !!selectedAudience;
      case 'design': return true;
      default: return false;
    }
  };

  // E-3: completeGame() moved to preview->complete transition (was incorrectly called before user sees app card)
  const advanceStep = useCallback(() => {
    if (buildStep === 'design') {
      const pts = Math.floor(innovationScore * 0.4) + 10;
      game.updateScore(pts);
      setPhase('preview');
    } else {
      const next = BUILD_STEPS[stepIdx + 1];
      if (next) setBuildStep(next);
      game.advanceRound();
    }
  }, [buildStep, stepIdx, innovationScore, game]);

  const goBack = useCallback(() => {
    const prev = BUILD_STEPS[stepIdx - 1];
    if (prev) setBuildStep(prev);
  }, [stepIdx]);

  const pseudoCode = useMemo(() => {
    if (!currentCategory) return '';
    const powerNames = selectedPowers.map(id =>
      ALL_POWERS.find(p => p.id === id)?.techLabel || id
    ).join(', ');
    return `# ${appName || 'MyApp'}.py\nfrom sparkforge import AIApp\n\napp = AIApp("${appName || 'MyApp'}")\napp.set_category("${currentCategory.title}")\napp.add_powers([${powerNames}])\napp.set_audience("${currentAudience?.label || 'everyone'}")\napp.build()\napp.deploy()`;
  }, [appName, currentCategory, selectedPowers, currentAudience]);

  const getDesc = (item: { description: string; descriptionB: string; descriptionC: string }) =>
    ageBand === 'C' ? item.descriptionC : ageBand === 'B' ? item.descriptionB : item.description;

  // [v3] Prepare 3D power orb data for the 3D component
  const powerOrbs3D = useMemo(
    () => selectedPowers.map(id => {
      const p = ALL_POWERS.find(pw => pw.id === id);
      return {
        id,
        emoji: p?.emoji || '',
        color: p?.color || '#F97316',
        techLabel: p?.techLabel || '',
      };
    }),
    [selectedPowers]
  );

  useEffect(() => {
    if (phase === 'build' || phase === 'preview') {
      setGameSceneContent(
        <MyFirstAiApp3D
          buildStep={stepIdx}
          totalSteps={BUILD_STEPS.length}
          selectedPowers={powerOrbs3D}
          maxPowers={maxPowers}
          themeColor={currentTheme.accentColor}
          categoryEmoji={currentCategory?.emoji || '\u{1F4F1}'}
          appName={appName}
          innovationScore={innovationScore}
          isPreview={phase === 'preview'}
        />
      );
    } else {
      setGameSceneContent(null);
    }
  }, [phase, stepIdx, powerOrbs3D, maxPowers, currentTheme, currentCategory, appName, innovationScore, setGameSceneContent]);

  return (
    <GameShell gameId="my-first-ai-app" title="My First AI App" worldNumber={9} worldColor="#F97316" xpReward={30} totalRounds={BUILD_STEPS.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        {particles.map(p => (
          <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
              background: 'radial-gradient(circle, rgba(249,115,22,0.4), transparent)' }}
            animate={{ y: [0, -25, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
        ))}

        {/* Chrome Bezel */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.06]" />
        <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

        {/* 3D renders in CockpitCanvas via sceneStore (D3D-B3) */}

        <AnimatePresence mode="wait">
          {/* ■■■■■■■■■■ WELCOME ■■■■■■■■■■ */}
          {phase === 'welcome' && (
            <motion.div key="welcome" className="flex-1 flex flex-col items-center justify-center p-6 gap-2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <motion.div className="text-6xl mb-4" animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>{'\u{1F4F1}'}</motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">My First AI App</h2>
              <p className="font-body text-sm text-white/60 mb-1">Lab 9 — Build with AI</p>
              <p className="font-body text-sm text-white/50 max-w-sm mb-6">
                Design your very own AI-powered app! Pick its powers, name it, and see it come to life!
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {['App Design', 'AI Powers', 'Creative', 'Innovation'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/20 font-mono text-xs text-orange-300">{tag}</span>
                ))}
              </div>
              <motion.button onClick={() => setPhase('learn')}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-display text-sm font-bold"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} aria-label="Start learning">
                <BookOpen className="w-4 h-4" /> Let&#39;s Learn!
              </motion.button>
            </motion.div>
          )}

          {/* ■■■■■■■■■■ LEARN ■■■■■■■■■■ */}
          {phase === 'learn' && (
            <motion.div key="learn" className="flex-1 flex flex-col items-center justify-center p-6 gap-2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="font-mono text-xs text-orange-400/60 mb-3">CONCEPT {learnIdx + 1} / {CONCEPT_CARDS.length}</p>
              <AnimatePresence mode="wait">
                <motion.div key={learnIdx} className="w-full max-w-sm rounded-2xl p-6 text-center"
                  style={{ background: `linear-gradient(135deg, ${CONCEPT_CARDS[learnIdx].color}22, ${CONCEPT_CARDS[learnIdx].color}08)`,
                    border: `1px solid ${CONCEPT_CARDS[learnIdx].color}33` }}
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                  <motion.span className="text-4xl block mb-3" animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    {CONCEPT_CARDS[learnIdx].emoji}</motion.span>
                  <h3 className="font-display text-lg font-bold text-white mb-2">{CONCEPT_CARDS[learnIdx].title}</h3>
                  <p className="font-body text-sm text-white/70 leading-relaxed">{getDesc(CONCEPT_CARDS[learnIdx])}</p>
                </motion.div>
              </AnimatePresence>
              <div className="flex gap-2 mt-6">
                {CONCEPT_CARDS.map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === learnIdx ? 'bg-orange-400 scale-125' : i < learnIdx ? 'bg-orange-400/40' : 'bg-white/10'}`} />
                ))}
              </div>
              <motion.button onClick={() => { if (learnIdx < CONCEPT_CARDS.length - 1) setLearnIdx(i => i + 1); else { game.startGame('my-first-ai-app', 30); setPhase('build'); } }}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600/80 text-white font-display text-sm"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                {learnIdx < CONCEPT_CARDS.length - 1 ? <><ArrowRight className="w-4 h-4" /> Next</> : <><Play className="w-4 h-4" /> Start Building!</>}
              </motion.button>
            </motion.div>
          )}

          {/* ■■■■■■■■■■ BUILD ■■■■■■■■■■ */}
          {phase === 'build' && (
            <motion.div key="build" className="flex-1 flex flex-col p-4 overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-1 mb-4">
                {BUILD_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < stepIdx ? 'bg-orange-500 text-white' : i === stepIdx ? 'bg-orange-500/30 text-orange-300 ring-1 ring-orange-500/50' : 'bg-white/5 text-white/20'}`}>
                      {i + 1}</div>
                    {i < BUILD_STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < stepIdx ? 'bg-orange-500' : 'bg-white/10'}`} />}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Step 1: Category */}
                {buildStep === 'category' && (
                  <motion.div key="cat" className="flex-1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <h3 className="font-display text-lg font-bold text-white text-center mb-1">What kind of app?</h3>
                    <p className="font-body text-xs text-white/40 text-center mb-4">Pick the type of AI app you want to build!</p>
                    <div className="grid grid-cols-1 gap-2.5 max-w-sm mx-auto">
                      {categories.map(cat => (
                        <motion.button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                            selectedCategory === cat.id ? 'border-orange-500/50 bg-orange-500/10' :
                            'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} aria-label={`Select ${cat.title}`}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${cat.color}20` }}>
                            {cat.emoji}</div>
                          <div className="flex-1">
                            <p className="font-display text-sm font-bold text-white">{cat.title}</p>
                            <p className="font-body text-xs text-white/50">{getDesc(cat)}</p>
                          </div>
                          {selectedCategory === cat.id && <Star className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Name */}
                {buildStep === 'name' && (
                  <motion.div key="name" className="flex-1 flex flex-col items-center justify-center gap-2"
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <div className="text-4xl mb-3">{currentCategory?.emoji || '\u{1F4F1}'}</div>
                    <h3 className="font-display text-lg font-bold text-white mb-1">Name your app!</h3>
                    <p className="font-body text-xs text-white/40 mb-4">Give your {currentCategory?.title?.toLowerCase()} a cool name</p>
                    <input type="text" value={appName} onChange={e => setAppName(e.target.value)}
                      placeholder="e.g. SuperBrain, ArtMagic, FunBot..." maxLength={24}
                      className="w-full max-w-xs px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-display text-center focus:outline-none focus:border-orange-500/50"
                      aria-label="Enter your app name" autoFocus />
                    <p className="font-mono text-2xs text-white/20 mt-1">{appName.length}/24</p>
                    {appName.length >= 2 && (
                      <motion.div className="mt-4 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="font-body text-sm text-orange-300 text-center">{'\u2728'} <strong>{appName}</strong> — great name!</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Powers */}
                {buildStep === 'powers' && (
                  <motion.div key="powers" className="flex-1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <h3 className="font-display text-lg font-bold text-white text-center mb-1">Choose AI Powers!</h3>
                    <p className="font-body text-xs text-white/40 text-center mb-1">
                      Pick up to {maxPowers} powers for <strong className="text-orange-300">{appName || 'your app'}</strong>
                    </p>
                    <p className="font-mono text-xs text-center text-white/30 mb-3">{selectedPowers.length} / {maxPowers} selected</p>
                    <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                      {powers.map(pow => {
                        const isSelected = selectedPowers.includes(pow.id);
                        return (
                          <motion.button key={pow.id} onClick={() => togglePower(pow.id)}
                            className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                              isSelected ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            aria-label={`${isSelected ? 'Remove' : 'Add'} ${pow.title} power`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{pow.emoji}</span>
                              <span className="font-display text-xs font-bold text-white">{pow.title}</span>
                            </div>
                            <p className="font-body text-2xs text-white/40 leading-snug">{getDesc(pow)}</p>
                            {isSelected && (
                              <motion.div className="mt-1 h-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Audience */}
                {buildStep === 'audience' && (
                  <motion.div key="audience" className="flex-1 flex flex-col items-center justify-center gap-2"
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <h3 className="font-display text-lg font-bold text-white mb-1">Who is it for?</h3>
                    <p className="font-body text-xs text-white/40 mb-4">Who will use <strong className="text-orange-300">{appName}</strong>?</p>
                    <div className="grid grid-cols-2 gap-2 max-w-sm">
                      {AUDIENCES.map(aud => (
                        <motion.button key={aud.id} onClick={() => setSelectedAudience(aud.id)}
                          className={`px-4 py-3 rounded-xl border text-center transition-all ${
                            selectedAudience === aud.id ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} aria-label={`Select audience: ${aud.label}`}>
                          <span className="text-2xl block mb-1">{aud.emoji}</span>
                          <span className="font-body text-xs text-white/70">{aud.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Design */}
                {buildStep === 'design' && (
                  <motion.div key="design" className="flex-1 flex flex-col items-center"
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <h3 className="font-display text-lg font-bold text-white mb-1">Pick a style!</h3>
                    <p className="font-body text-xs text-white/40 mb-3">Choose the look for <strong className="text-orange-300">{appName}</strong></p>
                    <div className="grid grid-cols-3 gap-2 max-w-sm mb-4">
                      {DESIGN_THEMES.map(theme => (
                        <motion.button key={theme.id} onClick={() => setSelectedTheme(theme.id)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            selectedTheme === theme.id ? 'border-orange-500/50 ring-1 ring-orange-500/30' : 'border-white/10 bg-white/[0.02]'}`}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label={`Select theme: ${theme.name}`}>
                          <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${theme.bgGradient} mb-1`} />
                          <span className="text-sm">{theme.emoji}</span>
                          <p className="font-mono text-2xs text-white/50">{theme.name}</p>
                        </motion.button>
                      ))}
                    </div>
                    {/* Mini preview */}
                    <div className={`w-48 rounded-2xl p-3 bg-gradient-to-br ${currentTheme.bgGradient} border border-white/10 text-center`}>
                      <p className="text-2xl mb-1">{currentCategory?.emoji || '\u{1F4F1}'}</p>
                      <p className="font-display text-sm font-bold" style={{ color: currentTheme.textColor }}>{appName || 'Your App'}</p>
                      <div className="flex gap-1 justify-center mt-2">
                        {selectedPowers.slice(0, 3).map(id => {
                          const p = ALL_POWERS.find(pw => pw.id === id);
                          return <span key={id} className="text-xs">{p?.emoji}</span>;
                        })}
                      </div>
                      <p className="font-mono text-2xs mt-1" style={{ color: `${currentTheme.textColor}80` }}>Preview</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav buttons */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                {stepIdx > 0 ? (
                  <motion.button onClick={goBack} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 text-white/60 font-body text-sm"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><ArrowLeft className="w-4 h-4" /> Back</motion.button>
                ) : <div />}
                <motion.button onClick={advanceStep} disabled={!canAdvance()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-display text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  whileHover={canAdvance() ? { scale: 1.05 } : {}} whileTap={canAdvance() ? { scale: 0.97 } : {}}
                  aria-label={buildStep === 'design' ? 'Build my app' : 'Next step'}>
                  {buildStep === 'design' ? <><Rocket className="w-4 h-4" /> Build My App!</> : <><ArrowRight className="w-4 h-4" /> Next</>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ■■■■■■■■■■ PREVIEW ■■■■■■■■■■ */}
          {phase === 'preview' && (
            <motion.div key="preview" className="flex-1 flex flex-col items-center p-5 overflow-y-auto gap-3"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
              <motion.p className="font-display text-lg font-bold text-white mb-3"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                {'\u2728'} Your App is Ready!</motion.p>

              {/* App Card */}
              <motion.div className={`w-full max-w-xs rounded-3xl p-5 bg-gradient-to-br ${currentTheme.bgGradient} border border-white/10`}
                initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ delay: 0.5, type: 'spring' }}>
                <div className="text-center">
                  <motion.div className="text-5xl mb-2" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    {currentCategory?.emoji || '\u{1F4F1}'}</motion.div>
                  <h3 className="font-display text-xl font-bold mb-1" style={{ color: currentTheme.textColor }}>{appName}</h3>
                  <p className="font-body text-xs mb-3" style={{ color: `${currentTheme.textColor}99` }}>
                    A {currentCategory?.title?.toLowerCase()} for {currentAudience?.label?.toLowerCase() || 'everyone'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                    {selectedPowers.map(id => {
                      const p = ALL_POWERS.find(pw => pw.id === id);
                      return (
                        <span key={id} className="px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: `${p?.color}20`, color: p?.color }}>
                          {p?.emoji} {p?.title}</span>
                      );
                    })}
                  </div>
                  {/* Innovation Score */}
                  <div className="mb-2">
                    <p className="font-mono text-2xs mb-1" style={{ color: `${currentTheme.textColor}80` }}>INNOVATION SCORE</p>
                    <div className="w-full h-3 rounded-full bg-black/20 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                        initial={{ width: 0 }} animate={{ width: `${innovationScore}%` }}
                        transition={{ delay: 1, duration: 1.5, ease: 'easeOut' }} />
                    </div>
                    <motion.p className="font-display text-2xl font-bold mt-1" style={{ color: currentTheme.textColor }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                      {innovationScore}/100</motion.p>
                  </div>
                </div>
              </motion.div>

              {/* How It Works (Band B+) */}
              {(ageBand === 'B' || ageBand === 'C') && (
                <motion.button onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="w-full max-w-xs px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 font-body text-sm"
                  whileHover={{ scale: 1.02 }}>
                  {showHowItWorks ? '\u25BC' : '\u25B6'} How It Works — AI Pipeline</motion.button>
              )}
              <AnimatePresence>
                {showHowItWorks && (
                  <motion.div className="w-full max-w-xs rounded-xl p-3 bg-white/[0.03] border border-white/10"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <p className="font-mono text-2xs text-orange-400 mb-2">DATA FLOW:</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="px-2 py-1 rounded bg-white/10 font-mono text-2xs text-white/60">Input</span>
                      <span className="text-white/30">{'\u2192'}</span>
                      {selectedPowers.map((id, i) => {
                        const p = ALL_POWERS.find(pw => pw.id === id);
                        return (
                          <span key={id} className="contents">
                            <span className="px-2 py-1 rounded font-mono text-2xs" style={{ background: `${p?.color}20`, color: p?.color }}>
                              {p?.techLabel}</span>
                            {i < selectedPowers.length - 1 && <span className="text-white/30">{'\u2192'}</span>}
                          </span>
                        );
                      })}
                      <span className="text-white/30">{'\u2192'}</span>
                      <span className="px-2 py-1 rounded bg-emerald-500/20 font-mono text-2xs text-emerald-400">Output</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Code Peek (Band C) */}
              {ageBand === 'C' && (
                <>
                  <motion.button onClick={() => setShowCodePeek(!showCodePeek)}
                    className="w-full max-w-xs px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 font-body text-sm"
                    whileHover={{ scale: 1.02 }}>
                    {showCodePeek ? '\u25BC' : '\u25B6'} Code Preview (Python)</motion.button>
                  <AnimatePresence>
                    {showCodePeek && (
                      <motion.pre className="w-full max-w-xs rounded-xl p-3 bg-black/40 border border-orange-500/20 font-mono text-xs text-orange-300/80 whitespace-pre-wrap"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        {pseudoCode}</motion.pre>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* E-3: completeGame() called here (after user sees their app card, not before) */}
              <motion.button onClick={() => { game.completeGame(); setPhase('complete'); }}
                className="mt-2 w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display text-sm font-bold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Award className="w-4 h-4" /> Finish & Celebrate!
              </motion.button>
            </motion.div>
          )}

          {/* ══════════ COMPLETE (E-3) ══════════ */}
          {phase === 'complete' && (
            <motion.div key="complete" className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <motion.div className="text-6xl mb-4" animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}>{'\u{1F680}'}</motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">App Developer!</h2>
              <p className="font-body text-sm text-white/60 mb-4">You designed your very own AI-powered app!</p>

              <div className="w-full max-w-xs rounded-2xl p-4 bg-white/[0.03] border border-orange-500/20 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{currentCategory?.emoji || '\u{1F4F1}'}</span>
                  <div className="text-left">
                    <p className="font-display text-lg font-bold text-white">{appName}</p>
                    <p className="font-body text-xs text-white/40">{currentCategory?.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="rounded-xl p-2 bg-orange-500/10 border border-orange-500/20">
                    <p className="font-mono text-2xs text-orange-400 mb-1">INNOVATION</p>
                    <p className="font-display text-xl font-bold text-orange-300">{innovationScore}/100</p>
                  </div>
                  <div className="rounded-xl p-2 bg-amber-500/10 border border-amber-500/20">
                    <p className="font-mono text-2xs text-amber-400 mb-1">AI POWERS</p>
                    <p className="font-display text-xl font-bold text-amber-300">{selectedPowers.length}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 justify-center">
                  {selectedPowers.map(id => {
                    const p = ALL_POWERS.find(pw => pw.id === id);
                    return (
                      <span key={id} className="px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: `${p?.color}20`, color: p?.color }}>
                        {p?.emoji} {p?.title}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-sm text-amber-300">+{Math.floor(innovationScore * 0.4) + 10} XP earned!</span>
              </div>

              <p className="font-body text-xs text-white/30 max-w-xs">
                {ageBand === 'C' ? 'Real AI startups follow this exact process: idea \u2192 capabilities \u2192 audience \u2192 design \u2192 build!' :
                 ageBand === 'B' ? 'Companies like Google and OpenAI all start with this same process \u2014 idea, powers, audience, design!' :
                 'You just did what real app builders do \u2014 amazing!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      </div>
    </GameShell>
  );
}
