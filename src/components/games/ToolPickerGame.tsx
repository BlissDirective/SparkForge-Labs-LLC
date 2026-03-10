// ════════════════════════════════════════════════════
// TOOL PICKER V2 — Lab 5 (AI Helpers)
// Quick-fire: pick the right AI tool for each task.
// Enhanced: chrome bezel, welcome phase, 6 tools, 15 tasks,
// "why this tool?" explanations, streak combos, timer.
// ════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Wrench } from 'lucide-react';

type Phase = 'welcome' | 'play';

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
}

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
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function ToolPickerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [timer, setTimer] = useState(6);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; why: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const tasks = useMemo(
    () => ALL_TASKS.filter(t => BAND_ORDER[t.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const task = tasks[roundIdx];
  const multiplier = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;

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
          setTimeout(() => {
            setFeedback(null);
            if (roundIdx < tasks.length - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
            else game.completeGame();
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
    if (correct) { setStreak(s => s + 1); game.updateScore(10 * multiplier); } else { setStreak(0); }
    setTimeout(() => {
      setFeedback(null);
      if (roundIdx < tasks.length - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
      else game.completeGame();
    }, 2000);
  }

  return (
    <GameShell gameId="tool-picker" title="Tool Picker" worldNumber={5} worldColor="#00FF88" totalRounds={tasks.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
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
                    <h2 className="font-display text-2xl font-bold text-white">Tool Picker</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">Quick-fire challenge! Pick the right AI tool for each task. Be fast — you only have 6 seconds!</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {TOOLS.map(t => <span key={t.id} className="px-2 py-1 rounded-lg bg-green-400/10 border border-green-400/20 text-xs font-body text-green-400">{t.emoji} {t.label}</span>)}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #00FF88, #00CC66)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Picking! <Wrench className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'play' && task && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md space-y-2">
                    {/* Timer + Streak */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <motion.div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm ${timer <= 2 ? 'bg-red-500/20 text-orange-400' : 'bg-green-400/10 text-green-400'}`}
                        animate={timer <= 2 ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.5, repeat: Infinity }}>
                        {timer}
                      </motion.div>
                      {streak >= 2 && (
                        <span className="px-2 py-1 rounded-lg bg-green-400/10 font-display text-xs text-green-400">🔥 ×{multiplier} streak!</span>
                      )}
                    </div>

                    {/* Task */}
                    <motion.div key={roundIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4 mb-4 border border-green-400/20 bg-green-400/5 text-center">
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
                          <p className="font-display text-[10px] font-bold text-white mt-1">{tool.label}</p>
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
                          <p className="font-body text-[10px] text-white/40 mt-1">{feedback.why}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
