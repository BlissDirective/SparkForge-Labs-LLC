// ════════════════════════════════════════════════════
// TOOL PICKER V2 — Lab 5 (AI Helpers)
// Quick-fire: pick the right AI tool for each task.
// Enhanced: chrome bezel, welcome phase, 6 tools, 15 tasks,
// "why this tool?" explanations, streak combos, timer.
// ════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { Wrench } from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const ToolPickerEnvironment = dynamic(
  () => import('@/components/3d/environments/ToolPickerEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

interface Tool {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

interface Task {
  text: string;
  correctTool: string;
  why: string;
  whyC: string;
  band: 'A' | 'B' | 'C';
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
}

const LEARN_CARDS = [
  { title: 'AI Has Many Tools', emoji: '🧰', desc: 'Just like a toolbox has different tools for different jobs, AI has many specialized tools — some write, some calculate, some create images, and some translate!' },
  { title: 'The Right Tool for the Job', emoji: '🎯', desc: 'Choosing the right AI tool matters. A calculator AI is great for math but terrible at writing poetry. Knowing which tool to pick is a real skill!' },
  { title: 'AI Specialization', emoji: '⚙️', desc: 'Each AI tool is trained for specific tasks. In this game, you\'ll race against the clock to match tasks with the perfect AI tool!' },
];

const TOOLS: Tool[] = [
  { id: 'calc', emoji: '🧮', label: 'Calculator', description: 'Math and numbers' },
  { id: 'search', emoji: '🔍', label: 'Search', description: 'Find information' },
  { id: 'code', emoji: '💻', label: 'Code', description: 'Programming tasks' },
  { id: 'writer', emoji: '✍️', label: 'Writer', description: 'Create text content' },
  { id: 'translate', emoji: '🌐', label: 'Translator', description: 'Change languages' },
  { id: 'image', emoji: '🎨', label: 'Image Gen', description: 'Create pictures' },
];

const ALL_TASKS: Task[] = [
  { text: 'Calculate 847 × 293', correctTool: 'calc', why: 'Calculators are best for precise math!', whyC: 'Large integer multiplication benefits from deterministic computation — LLMs can approximate but calculators guarantee exact results via ALU operations.', band: 'A' },
  { text: 'Find the capital of Mongolia', correctTool: 'search', why: 'Search engines have the latest facts!', whyC: 'Search engines index real-time knowledge bases. LLMs have knowledge cutoffs and can hallucinate geographic facts — retrieval-augmented generation (RAG) solves this.', band: 'A' },
  { text: 'Write a thank-you email', correctTool: 'writer', why: 'AI writers are great at composing messages!', whyC: 'Language models excel at generative text tasks — email composition leverages their training on millions of writing examples for tone and structure.', band: 'A' },
  { text: 'Sort a list of 1000 numbers', correctTool: 'code', why: 'Code can sort millions of numbers instantly!', whyC: 'Sorting algorithms (O(n log n)) in code are deterministic and efficient. LLMs would struggle with sequential comparison of 1000 items in context.', band: 'A' },
  { text: 'What is 15% tip on $67.50?', correctTool: 'calc', why: 'Money math needs exact answers!', whyC: 'Financial calculations require precision — floating-point arithmetic in calculators avoids the rounding errors LLMs introduce when doing mental math.', band: 'A' },
  { text: 'Who won the World Cup in 2022?', correctTool: 'search', why: 'Recent events need up-to-date sources!', whyC: 'Post-training-cutoff events require external retrieval. This is a classic RAG use case — the model\'s parametric memory may not include recent results.', band: 'B' },
  { text: 'Create a poem about the ocean', correctTool: 'writer', why: 'Creative writing is a strength of AI writers!', whyC: 'Poetry generation leverages the model\'s learned patterns of meter, rhyme, imagery, and emotional resonance from its training corpus.', band: 'A' },
  { text: 'Build a website countdown timer', correctTool: 'code', why: 'Interactive features need real code!', whyC: 'DOM manipulation and setInterval-based timers require executable JavaScript — generative models can write the code but a runtime environment must execute it.', band: 'B' },
  { text: 'Convert "hello" to Japanese', correctTool: 'translate', why: 'Translators know the right characters and grammar!', whyC: 'Machine translation models (like those behind Google Translate) are fine-tuned specifically on parallel corpora — they handle morphology and character systems better than general LLMs.', band: 'A' },
  { text: 'Design a logo for a bakery', correctTool: 'image', why: 'Image generators create visuals from descriptions!', whyC: 'Diffusion models (DALL-E, Stable Diffusion) generate pixel-level output from text prompts — text models can only describe images, not render them.', band: 'A' },
  { text: 'Summarize a 10-page document', correctTool: 'writer', why: 'AI writers can read and condense text perfectly!', whyC: 'Extractive and abstractive summarization are core NLP tasks. Long-context models can process 10+ pages and produce coherent summaries via attention mechanisms.', band: 'B' },
  { text: 'Convert 5 miles to kilometers', correctTool: 'calc', why: 'Unit conversion is just math — calculators are perfect!', whyC: 'Unit conversion is a deterministic multiplication (5 × 1.60934). Calculators guarantee precision while LLMs might round or approximate.', band: 'A' },
  { text: 'Make a graph from sales data', correctTool: 'code', why: 'Code can turn data into beautiful charts!', whyC: 'Data visualization requires rendering libraries (D3.js, Chart.js) that transform numerical arrays into SVG/Canvas elements — a computational task, not generative.', band: 'B' },
  { text: 'Translate a French news article', correctTool: 'translate', why: 'Translators handle full documents accurately!', whyC: 'Document-level translation requires maintaining context, terminology consistency, and grammatical agreement across paragraphs — specialized MT models outperform general LLMs here.', band: 'B' },
  { text: 'Generate a fantasy landscape image', correctTool: 'image', why: 'Image AI creates pictures from your imagination!', whyC: 'Text-to-image diffusion models iteratively denoise latent representations conditioned on CLIP embeddings of the text prompt — producing novel visual compositions.', band: 'A' },
  // --- Band A tasks (simple, obvious tool choices) ---
  { text: 'How much is 999 + 1?', correctTool: 'calc', why: 'Even simple math is faster with a calculator!', whyC: 'Trivial arithmetic benefits from deterministic ALU operations — zero chance of off-by-one errors that humans and LLMs occasionally make.', band: 'A' },
  { text: 'Write a birthday card message for Grandma', correctTool: 'writer', why: 'AI writers help you find the perfect words!', whyC: 'Language models leverage large corpora of greeting card text to produce warm, contextually appropriate messages with appropriate sentiment.', band: 'A' },
  { text: 'What does "gato" mean in English?', correctTool: 'translate', why: 'Translators instantly know words in every language!', whyC: 'Neural machine translation models encode cross-lingual embeddings that map "gato" to "cat" via learned bilingual alignment — faster and more reliable than dictionary lookup.', band: 'A' },
  { text: 'Draw a picture of a robot eating pizza', correctTool: 'image', why: 'Image generators turn fun ideas into pictures!', whyC: 'Text-to-image models compose novel visual concepts ("robot" + "eating pizza") through compositional understanding of CLIP-space embeddings.', band: 'A' },
  { text: 'What is the tallest building in the world right now?', correctTool: 'search', why: 'Search engines always have the latest facts!', whyC: 'Real-time search indexes are updated continuously — LLM training data has a cutoff date and may not reflect recent construction completions or records.', band: 'A' },
  // --- Band B tasks (moderate complexity) ---
  { text: 'Fix a bug in my Python script that crashes on line 42', correctTool: 'code', why: 'Code tools can analyze and debug programs!', whyC: 'Static analysis and runtime debugging require code execution environments — IDE-integrated AI can trace stack frames, inspect variables, and suggest fixes contextually.', band: 'B' },
  { text: 'Translate a 3-page Spanish contract into English', correctTool: 'translate', why: 'Translators handle full documents with proper legal terms!', whyC: 'Document-level neural MT preserves cross-sentence coherence and domain-specific terminology — critical for legal translation where a single mistranslation can alter contractual obligations.', band: 'B' },
  { text: 'Create a presentation with charts from quarterly sales data', correctTool: 'code', why: 'Code tools can generate charts and slides from data!', whyC: 'Presentation generation from data requires computational pipelines — data parsing, aggregation, chart rendering (e.g., matplotlib/D3), and slide formatting are all programmatic tasks.', band: 'B' },
  { text: 'Calculate the monthly payment on a $250,000 mortgage at 6.5% for 30 years', correctTool: 'calc', why: 'Financial formulas need precise calculations!', whyC: 'Amortization calculations use the formula M = P[r(1+r)^n]/[(1+r)^n-1] — deterministic computation guarantees exact results critical for financial planning.', band: 'B' },
  { text: 'Write a product description for a new wireless headphone', correctTool: 'writer', why: 'AI writers craft persuasive marketing copy!', whyC: 'Marketing copy generation leverages persuasive writing patterns, benefit-focused framing, and SEO keyword integration — core strengths of fine-tuned language models.', band: 'B' },
  // --- Band C tasks (advanced: RAG, fine-tuning, multi-modal) ---
  { text: 'Search our company\'s internal documents to answer a customer question', correctTool: 'search', why: 'Search tools can find answers in private databases using RAG!', whyC: 'Retrieval-Augmented Generation (RAG) combines vector search over private document embeddings with LLM generation — the search tool retrieves relevant chunks that ground the model\'s response in factual company data.', band: 'C' },
  { text: 'Build an API endpoint that validates user input and stores it in a database', correctTool: 'code', why: 'Backend development requires real executable code!', whyC: 'API development involves schema validation (Zod/Joi), database ORM queries, authentication middleware, and error handling — all requiring executable runtime environments, not generative text.', band: 'C' },
  { text: 'Create a detailed architectural blueprint from a text description', correctTool: 'image', why: 'Image generation AI can visualize complex structures from descriptions!', whyC: 'Multi-modal image models fine-tuned on architectural datasets can generate floor plans and 3D renders from textual specifications — combining spatial reasoning with generative diffusion.', band: 'C' },
  { text: 'Analyze customer reviews in 12 languages to find common complaints', correctTool: 'translate', why: 'Translators can process many languages at once before analysis!', whyC: 'Multilingual NLP pipelines first normalize text via translation or cross-lingual embeddings (XLM-R), then apply sentiment analysis and topic modeling — the translation step is the critical bottleneck for polyglot corpora.', band: 'C' },
  { text: 'Write a 5000-word research paper synthesizing 20 academic sources with proper citations', correctTool: 'writer', why: 'AI writers can synthesize multiple sources into coherent long-form text!', whyC: 'Long-form academic synthesis requires RAG over source documents, citation graph traversal, argument structuring, and stylistic consistency — tasks where large-context language models excel when grounded with retrieved evidence.', band: 'C' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function ToolPickerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('tool-picker', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const { safeTimeout } = useSafeTimeout();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [timer, setTimer] = useState(6);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; why: string } | null>(null);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const tasks = useMemo(
    () => ALL_TASKS.filter(t => BAND_ORDER[t.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const task = tasks[roundIdx];
  const multiplier = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;

  useEffect(() => {
    setGameSceneContent(<ToolPickerEnvironment toolsSelected={roundIdx} currentTask={task?.text || ''} />);
  }, [roundIdx, task?.text, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  useEffect(() => {
    if (phase !== 'play' || feedback) return;
    setTimer(6);
    const currentTask = tasks[roundIdx];
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setFeedback({ correct: false, why: 'Time\'s up! The correct tool was ' + TOOLS.find(tl => tl.id === currentTask.correctTool)?.label + '.' });
          setStreak(0);
          safeTimeout(() => {
            setFeedback(null);
            if (roundIdx < tasks.length - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
            else { setPhase('complete'); game.completeGame(); }
          }, 2000);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [roundIdx, feedback, phase, tasks, game]);

  function handlePick(toolId: string) {
    if (feedback || phase !== 'play') return;
    clearInterval(timerRef.current);
    const correct = toolId === task.correctTool;
    const why = correct
      ? (ageBand === 'C' ? task.whyC : task.why)
      : `The best tool was ${TOOLS.find(t => t.id === task.correctTool)?.label}. ${task.why}`;
    setFeedback({ correct, why });
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      game.updateScore(10 * (newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1));
    } else { setStreak(0); }
    safeTimeout(() => {
      setFeedback(null);
      if (roundIdx < tasks.length - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
      else { setPhase('complete'); game.completeGame(); }
    }, 2000);
  }

  return (
    <GameShell gameId="tool-picker" title="Tool Picker" worldNumber={5} worldColor="#00FF88" totalRounds={tasks.length}>
      <div className="h-full flex flex-col relative z-10 overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(0,255,136,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(0,255,136,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }} className="text-center space-y-4">
                    <span className="text-5xl">🔧</span>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Tool Picker welcome phase">Tool Picker</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">Quick-fire challenge! Pick the right AI tool for each task. Be fast — you only have 6 seconds!</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {TOOLS.map(t => <span key={t.id} className="px-2 py-1 rounded-lg bg-green-400/10 border border-green-400/20 text-xs font-body text-green-400">{t.emoji} {t.label}</span>)}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #00FF88, #00CC66)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start the Tool Picker game">
                      Start Picking! <Wrench className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
                    <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                    <h3 className="font-display text-xl font-bold text-white">{LEARN_CARDS[learnIdx].title}</h3>
                    <p className="font-body text-sm text-white/60 max-w-md">{LEARN_CARDS[learnIdx].desc}</p>
                    <div className="flex gap-1 mt-2">
                      {LEARN_CARDS.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-[#00FF88]' : 'bg-white/20'}`} />
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      {learnIdx > 0 && (
                        <motion.button onClick={() => setLearnIdx(i => i - 1)}
                          className="px-4 py-2 rounded-lg border border-white/10 font-display text-xs text-white/60 hover:text-white"
                          whileTap={{ scale: 0.95 }}>Back</motion.button>
                      )}
                      <motion.button onClick={() => learnIdx < LEARN_CARDS.length - 1 ? setLearnIdx(i => i + 1) : setPhase('play')}
                        className="px-6 py-2 rounded-lg font-display text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #00FF88, #00CC66)' }}
                        whileTap={{ scale: 0.95 }}>{learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Playing!'}</motion.button>
                    </div>
                  </motion.div>
                )}

                {phase === 'play' && task && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md space-y-2">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={roundIdx + 1} total={tasks.length} labColor="#00FF88" />
                    </div>
                    {/* Timer + Streak */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <motion.div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm ${timer <= 2 ? 'bg-red-500/20 text-orange-400' : 'bg-green-400/10 text-green-400'}`}
                        animate={timer <= 2 ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.5, repeat: Infinity }}
                        role="status" aria-label={`${timer} seconds remaining`}>
                        {timer}
                      </motion.div>
                      {streak >= 2 && (
                        <span className="px-2 py-1 rounded-lg bg-green-400/10 font-display text-xs text-green-400">🔥 ×{multiplier} streak!</span>
                      )}
                    </div>

                    {/* Task */}
                    <motion.div key={roundIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4 mb-4 border border-green-400/20 bg-green-400/5 text-center"
                      role="status" aria-label={`Task ${roundIdx + 1} of ${tasks.length}: ${task.text}`}>
                      <p className="font-display text-base font-bold text-white">{task.text}</p>
                    </motion.div>

                    {/* Tools grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {TOOLS.map(tool => (
                        <motion.button key={tool.id} onClick={() => handlePick(tool.id)} disabled={!!feedback}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            feedback && tool.id === task.correctTool ? 'border-green-400/50 bg-green-400/10'
                            : feedback ? 'border-white/5 opacity-30'
                            : 'border-white/10 bg-white/[0.02] hover:border-green-400/20'
                          }`} whileTap={!feedback ? { scale: 0.95 } : {}} aria-label={`Pick ${tool.label}`}>
                          <span className="text-2xl">{tool.emoji}</span>
                          <p className="font-display text-2xs font-bold text-white mt-1">{tool.label}</p>
                        </motion.button>
                      ))}
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`rounded-xl p-3 ${feedback.correct ? 'bg-green-400/10 border border-green-400/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                          <p className="font-display text-xs font-bold" style={{ color: feedback.correct ? '#00FF88' : '#EF4444' }}>
                            {feedback.correct ? '✅ Perfect pick!' : '❌ Not quite!'}
                          </p>
                          <p className="font-body text-2xs text-white/40 mt-1">{feedback.why}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span className="text-6xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Tool Picker complete phase">Tool Picker Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You mastered the art of choosing the right AI tool for every task — knowing when to use each tool is a superpower.</p>
                    <div className="rounded-xl px-6 py-3 bg-[#00FF88]/10 border border-[#00FF88]/20" role="status" aria-label={`Final score: ${game.score} points`}>
                      <p className="font-data text-2xl" style={{ color: '#00FF88' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Different AI tools are specialized for different tasks like math, writing, or translation</li>
                        <li>• Choosing the right tool saves time and produces better results than forcing one tool to do everything</li>
                        <li>• Understanding AI tool specialization helps you work smarter with technology</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
