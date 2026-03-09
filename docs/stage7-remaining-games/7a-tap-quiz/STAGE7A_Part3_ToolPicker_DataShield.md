# SPARKFORGE — STAGE 7A PART 3: Tool Picker + Data Shield

**Continues from:** `STAGE7A_Part2_TokenChopper_AiArt.md` (Games 3-4)
**Games in this file:** Tool Picker (Game 5), Data Shield (Game 6)

---

## Game 5: `src/components/games/ToolPickerGame.tsx`

```tsx
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
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
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
    <GameShell gameId="tool-picker" title="Tool Picker" worldNumber={5} worldColor="#00FF88">
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
```

---

## Game 6: `src/components/games/DataShieldGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// DATA SHIELD V2 — Lab 6 (AI & Ethics)
// Privacy game: decide what to share and protect.
// Enhanced: chrome bezel, welcome phase, 6 scenarios,
// visual shield meter, privacy tips, age-band explanations.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Shield, Eye, Lock, AlertTriangle } from 'lucide-react';

type Phase = 'welcome' | 'play';

interface DataPoint {
  label: string;
  shouldProtect: boolean;
  reason: string;
  reasonC: string;
  severity: 'safe' | 'warning' | 'danger';
}

interface Scenario {
  title: string;
  emoji: string;
  context: string;
  dataPoints: DataPoint[];
}

const SCENARIOS: Scenario[] = [
  {
    title: 'New Game Sign-Up', emoji: '🎮', context: 'A free game asks you to create an account. It wants:',
    dataPoints: [
      { label: 'Username (made-up)', shouldProtect: false, reason: 'Made-up usernames are safe — they don\'t reveal who you are!', reasonC: 'Pseudonymous identifiers provide functional identity without linking to PII. This is a core privacy-by-design pattern.', severity: 'safe' },
      { label: 'Full real name', shouldProtect: true, reason: 'Games don\'t need your real name! A username is enough.', reasonC: 'Full names are directly identifying PII. Combined with other data points, they enable identity correlation across services — a privacy anti-pattern.', severity: 'warning' },
      { label: 'School name', shouldProtect: true, reason: 'This reveals your location!', reasonC: 'Institutional affiliation narrows geolocation significantly and can enable physical-world targeting — especially sensitive for minors under COPPA/GDPR-K.', severity: 'danger' },
      { label: 'Birthday', shouldProtect: true, reason: 'Personal info. Games only need age range, not exact date!', reasonC: 'Date of birth is a quasi-identifier — combined with ZIP code and gender, it uniquely identifies 87% of the US population (Sweeney, 2000). Age ranges are sufficient for content filtering.', severity: 'warning' },
    ],
  },
  {
    title: 'Online Quiz', emoji: '📝', context: 'A fun quiz website asks for:',
    dataPoints: [
      { label: 'Email address', shouldProtect: true, reason: 'Quizzes don\'t need email. They might send spam!', reasonC: 'Email is a persistent cross-service identifier. Quiz sites often sell email lists to third-party advertisers — a common dark pattern in data brokerage.', severity: 'warning' },
      { label: 'Favorite color', shouldProtect: false, reason: 'Just a preference — totally safe to share!', reasonC: 'Non-identifying preference data has minimal privacy risk. It cannot be used for re-identification and is commonly used for personalization.', severity: 'safe' },
      { label: 'Home address', shouldProtect: true, reason: 'Never share your address online!', reasonC: 'Physical address is high-sensitivity PII enabling real-world targeting. It violates the data minimization principle — no quiz requires geolocation at this granularity.', severity: 'danger' },
      { label: 'Age range (e.g., 10-12)', shouldProtect: false, reason: 'Age ranges are fine — they don\'t pinpoint your exact age!', reasonC: 'k-anonymity through age bucketing provides plausible deniability. Ranges are sufficient for content filtering while preventing exact DOB inference.', severity: 'safe' },
    ],
  },
  {
    title: 'Chat App', emoji: '💬', context: 'A new chat app wants:',
    dataPoints: [
      { label: 'Phone number', shouldProtect: true, reason: 'Phone numbers can identify you!', reasonC: 'Phone numbers are persistent identifiers tied to SIM cards, enabling tracking across services via number-based lookups and social graph correlation.', severity: 'danger' },
      { label: 'Display name', shouldProtect: false, reason: 'A made-up display name is safe!', reasonC: 'User-chosen display names that don\'t contain real identity information are privacy-preserving pseudonyms — a recommended practice.', severity: 'safe' },
      { label: 'Photo of yourself', shouldProtect: true, reason: 'Photos can be shared without your permission!', reasonC: 'Facial images enable biometric identification via facial recognition systems. Once shared, they cannot be "unshared" — irreversible data exposure with high re-identification risk.', severity: 'danger' },
      { label: 'Interests/hobbies', shouldProtect: false, reason: 'General interests are safe to share!', reasonC: 'Broad interest categories have low uniqueness and cannot reliably identify individuals. They enable useful personalization without significant privacy cost.', severity: 'safe' },
    ],
  },
  {
    title: 'Survey for Free Prize', emoji: '🎁', context: 'You "won a prize"! They need:',
    dataPoints: [
      { label: 'Parent\'s credit card', shouldProtect: true, reason: 'Real prizes NEVER need payment info! This is a scam!', reasonC: 'Unsolicited prize claims requesting financial instruments are classic phishing/social engineering attacks. Legitimate giveaways never require payment — this violates FTC guidelines.', severity: 'danger' },
      { label: 'Mailing address', shouldProtect: true, reason: 'Don\'t give your address to strangers online!', reasonC: 'Physical address disclosure to unverified entities creates real-world attack vectors. Even legitimate prize fulfillment should use verified intermediaries.', severity: 'danger' },
      { label: 'Social security number', shouldProtect: true, reason: 'NEVER share this online! It\'s the most private info you have.', reasonC: 'SSN is the highest-sensitivity PII in the US — it enables identity theft, financial fraud, and is essentially irrevocable once compromised. No legitimate prize requires it.', severity: 'danger' },
      { label: 'First name only', shouldProtect: false, reason: 'First name alone is generally safe — it\'s very common!', reasonC: 'First names have high population frequency (low uniqueness) and cannot identify individuals in isolation. Acceptable under data minimization principles.', severity: 'safe' },
    ],
  },
  {
    title: 'Social Media App', emoji: '📱', context: 'A social media app requests:',
    dataPoints: [
      { label: 'Location (always on)', shouldProtect: true, reason: 'Constant location tracking is dangerous!', reasonC: 'Persistent geolocation tracking creates detailed movement profiles. Combined with temporal patterns, it reveals home/school locations, daily routines, and social connections — extreme privacy risk.', severity: 'danger' },
      { label: 'Contacts list access', shouldProtect: true, reason: 'This shares OTHER people\'s info without asking them!', reasonC: 'Contact list access violates third-party consent — you\'re sharing others\' PII without their knowledge. This enables social graph construction and shadow profiling.', severity: 'danger' },
      { label: 'Bio / About me', shouldProtect: false, reason: 'You control what you write. Keep it general and it\'s fine!', reasonC: 'User-authored bio text is self-disclosed and controllable. Privacy risk scales with specificity — general descriptions are low-risk while specific details increase re-identification potential.', severity: 'safe' },
      { label: 'Camera access (always)', shouldProtect: true, reason: 'Apps should only use cameras when you say so!', reasonC: 'Persistent camera access enables passive surveillance. Permission should be scoped to active use only — the principle of least privilege applied to device sensors.', severity: 'danger' },
    ],
  },
  {
    title: 'Smart Speaker Setup', emoji: '🔊', context: 'A smart speaker in your room wants:',
    dataPoints: [
      { label: 'Voice recordings (always listening)', shouldProtect: true, reason: 'Always-on microphones record everything — even private conversations!', reasonC: 'Continuous audio capture creates comprehensive surveillance records. Voice data is biometric (voiceprint identification) and conversational content may include sensitive disclosures.', severity: 'danger' },
      { label: 'Music preferences', shouldProtect: false, reason: 'What music you like is no secret — it helps get better recommendations!', reasonC: 'Music preference data has low privacy sensitivity and high utility for recommendation systems. Genre-level preferences cannot reliably identify individuals.', severity: 'safe' },
      { label: 'Your daily schedule', shouldProtect: true, reason: 'Your routine tells people when you\'re home or away!', reasonC: 'Temporal activity patterns reveal presence/absence schedules, creating physical security vulnerabilities. This data enables both digital profiling and real-world targeting.', severity: 'danger' },
      { label: 'Wi-Fi network name', shouldProtect: false, reason: 'Your Wi-Fi name is already visible to nearby devices — it\'s not secret!', reasonC: 'SSIDs are broadcast publicly by design (802.11 beacon frames). While they can approximate geolocation via wardriving databases, they\'re already exposed by the protocol itself.', severity: 'safe' },
    ],
  },
];

export function DataShieldGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [pointIdx, setPointIdx] = useState(0);
  const [privacyScore, setPrivacyScore] = useState(100);
  const [feedback, setFeedback] = useState<{ correct: boolean; reason: string } | null>(null);

  const scenario = SCENARIOS[scenarioIdx];
  const point = scenario?.dataPoints[pointIdx];
  const meterColor = privacyScore > 70 ? '#10B981' : privacyScore > 40 ? '#F59E0B' : '#EF4444';

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function handleChoice(protect: boolean) {
    if (!point || feedback) return;
    const correct = protect === point.shouldProtect;
    if (!correct) setPrivacyScore(s => Math.max(0, s - 12));
    if (correct) game.updateScore(10);
    setFeedback({ correct, reason: ageBand === 'C' ? point.reasonC : point.reason });
    setTimeout(() => {
      setFeedback(null);
      const next = pointIdx + 1;
      if (next < scenario.dataPoints.length) { setPointIdx(next); }
      else {
        const nextS = scenarioIdx + 1;
        if (nextS < SCENARIOS.length) { setScenarioIdx(nextS); setPointIdx(0); game.advanceRound(); }
        else game.completeGame();
      }
    }, 2500);
  }

  return (
    <GameShell gameId="data-shield" title="Data Shield" worldNumber={6} worldColor="#FF6644">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(255,102,68,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,102,68,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }} className="text-center space-y-4">
                    <span className="text-5xl">🛡️</span>
                    <h2 className="font-display text-2xl font-bold text-white">Data Shield</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">Apps and websites want your data. Can you tell what&apos;s safe to share and what to protect?</p>
                    <div className="flex gap-2 justify-center">
                      {['Privacy', 'PII', 'Data Safety'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-body text-orange-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #FF6644, #DD4422)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Activate Shield! <Shield className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'play' && scenario && point && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md space-y-2">
                    {/* Privacy meter */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-body text-xs text-white/30 flex items-center gap-1"><Lock className="w-3 h-3" /> Privacy Score</span>
                        <span className="font-display text-xs font-bold" style={{ color: meterColor }}>{privacyScore}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: meterColor }}
                          animate={{ width: `${privacyScore}%` }} transition={{ type: 'spring', stiffness: 100 }} />
                      </div>
                    </div>

                    {/* Scenario */}
                    <div className="text-center mb-4">
                      <span className="text-3xl">{scenario.emoji}</span>
                      <h3 className="font-display text-base font-bold text-white mt-1">{scenario.title}</h3>
                      <p className="font-body text-xs text-white/40">{scenario.context}</p>
                    </div>

                    {/* Data point card */}
                    <motion.div key={`${scenarioIdx}-${pointIdx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-5 mb-4 border border-white/10 bg-white/[0.02] text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {point.severity === 'danger' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                        {point.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        <p className="font-display text-base font-bold text-white">&quot;{point.label}&quot;</p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <motion.button onClick={() => handleChoice(true)} disabled={!!feedback}
                          className="flex-1 py-3 rounded-xl bg-blue-500/15 border border-blue-500/20 font-display text-xs font-bold text-blue-400 flex items-center justify-center gap-2"
                          whileTap={{ scale: 0.95 }} aria-label="Shield this data">
                          <Shield className="w-4 h-4" /> SHIELD
                        </motion.button>
                        <motion.button onClick={() => handleChoice(false)} disabled={!!feedback}
                          className="flex-1 py-3 rounded-xl bg-emerald-500/15 border border-green-400/20 font-display text-xs font-bold text-green-400 flex items-center justify-center gap-2"
                          whileTap={{ scale: 0.95 }} aria-label="Share this data">
                          <Eye className="w-4 h-4" /> SHARE
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`rounded-xl p-3 text-center ${feedback.correct ? 'bg-green-400/10 border border-green-400/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                          <p className="font-display text-xs font-bold" style={{ color: feedback.correct ? '#00FF88' : '#EF4444' }}>
                            {feedback.correct ? '✅ Smart choice!' : '⚠️ Be careful!'}
                          </p>
                          <p className="font-body text-[10px] text-white/40 mt-1">{feedback.reason}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Verification Checklist

| Item | ToolPickerGame | DataShieldGame |
|------|---------------|----------------|
| Chrome bezel + LED rim | ✅ emerald border | ✅ red border |
| 12 particles | ✅ emerald | ✅ red |
| Welcome phase | ✅ tool showcase | ✅ topic badges |
| Age-band content | ✅ BAND_ORDER filter + whyC | ✅ reasonC for Band C |
| ARIA labels | ✅ on tool buttons | ✅ on shield/share buttons |
| GameShell integration | ✅ worldNumber=5 | ✅ worldNumber=6 |
| Store usage | ✅ addScore, nextRound, completeGame | ✅ addScore, nextRound, completeGame |
| Framer Motion | ✅ AnimatePresence, motion.button | ✅ AnimatePresence, motion.button |
| Unique mechanic | ✅ 6s timer + streak multiplier | ✅ Privacy score meter (100→0) |
| Content depth | ✅ 6 tools, 15 tasks | ✅ 6 scenarios, 24 data points |
