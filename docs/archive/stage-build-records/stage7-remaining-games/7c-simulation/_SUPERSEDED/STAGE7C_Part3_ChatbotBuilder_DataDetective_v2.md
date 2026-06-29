# SPARKFORGE — STAGE 7C PART 3: Chatbot Builder + Data Detective (V2 Originals)

**Continues from:** STAGE-7C Part 2
**Games in this file:** Chatbot Builder (Flagship-Lite), Data Detective (Flagship-Lite)
**Completes:** Stage 7C — All 6 Simulation & Sandbox games

> **NOTE:** Both games in this file have V3 Full Treatment replacements:
> - ChatbotBuilder V3 → `STAGE7C_v3FINAL_ChatbotBuilder_V3_FullTreatment.md`
> - DataDetective V3 → `STAGE7C_v3FINAL_DataDetective_V3_FullTreatment.md`
>
> **Per CLAUDE.md Section 3 (Build Strategy):** V3-FINAL documents supersede V2.
> These V2 originals are preserved for reference only. **Build from V3 documents.**

---

## Game 5: `src/components/games/ChatbotBuilderGame.tsx` — FLAGSHIP-LITE (V2)

```tsx
// ════════════════════════════════════════════════════
// CHATBOT BUILDER V2 — Lab 8 (NLP) — FLAGSHIP-LITE
// Visual conversation tree editor + test mode.
// Enhanced: chrome bezel, welcome phase, learn phase,
// 4 templates, custom node creation, personality settings,
// conversation flow visualization, age-band depth.
//
// ⚠️ SUPERSEDED BY V3 Full Treatment — see
//    STAGE7C_v3FINAL_ChatbotBuilder_V3_FullTreatment.md
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Plus, MessageCircle, Play, RotateCcw, Bot, Settings2, BookOpen, Sparkles } from 'lucide-react';

type Phase = 'welcome' | 'learn' | 'build';

interface BotNode { id: string; text: string; responses: { label: string; nextId: string | null }[]; }

const TEMPLATES: Record<string, { description: string; nodes: BotNode[] }> = {
  'Pizza Bot': {
    description: 'A pizza ordering chatbot with size and topping options.',
    nodes: [
      { id: 'root', text: 'Welcome to Pizza Palace! What size?', responses: [{ label: 'Small', nextId: 'small' }, { label: 'Medium', nextId: 'med' }, { label: 'Large', nextId: 'large' }] },
      { id: 'small', text: 'A small pizza! Any toppings?', responses: [{ label: 'Pepperoni', nextId: 'done' }, { label: 'Plain', nextId: 'done' }] },
      { id: 'med', text: 'Medium it is! Pick a topping:', responses: [{ label: 'Mushroom', nextId: 'done' }, { label: 'Veggie', nextId: 'done' }] },
      { id: 'large', text: 'Going big! What topping?', responses: [{ label: 'Everything!', nextId: 'done' }, { label: 'Cheese', nextId: 'done' }] },
      { id: 'done', text: 'Your order is placed! Enjoy! 🍕', responses: [] },
    ],
  },
  'Joke Bot': {
    description: 'A friendly chatbot that tells AI jokes.',
    nodes: [
      { id: 'root', text: 'Hey! Want to hear a joke? 😄', responses: [{ label: 'Yes!', nextId: 'joke' }, { label: 'No thanks', nextId: 'bye' }] },
      { id: 'joke', text: 'Why did the AI go to school?', responses: [{ label: 'Why?', nextId: 'punch' }] },
      { id: 'punch', text: 'To improve its learning algorithm! 🤣 Another?', responses: [{ label: 'Yes!', nextId: 'joke2' }, { label: 'No', nextId: 'bye' }] },
      { id: 'joke2', text: 'What do you call a robot that takes detours?', responses: [{ label: 'What?', nextId: 'punch2' }] },
      { id: 'punch2', text: "R2-Detour! That's all I've got!", responses: [] },
      { id: 'bye', text: 'See you later! 👋', responses: [] },
    ],
  },
  'Help Desk': {
    description: 'A support chatbot that triages common issues.',
    nodes: [
      { id: 'root', text: "Hi! I'm HelpBot. What's the problem? 🛠️", responses: [{ label: 'App crashed', nextId: 'crash' }, { label: 'Forgot password', nextId: 'password' }, { label: 'Other', nextId: 'other' }] },
      { id: 'crash', text: 'Sorry about that! Have you tried restarting?', responses: [{ label: 'Yes, still broken', nextId: 'escalate' }, { label: 'That fixed it!', nextId: 'resolved' }] },
      { id: 'password', text: 'No worries! Check your email for a reset link.', responses: [{ label: 'Got it!', nextId: 'resolved' }, { label: 'No email', nextId: 'escalate' }] },
      { id: 'other', text: 'Can you describe the issue briefly?', responses: [{ label: "It's complicated", nextId: 'escalate' }, { label: 'Never mind', nextId: 'resolved' }] },
      { id: 'escalate', text: "I'll connect you with a human agent. Hang tight! 🧑‍💻", responses: [] },
      { id: 'resolved', text: 'Glad I could help! Anything else? 😊', responses: [{ label: 'Nope, bye!', nextId: 'bye' }, { label: 'Yes', nextId: 'root' }] },
      { id: 'bye', text: 'Have a great day! 👋', responses: [] },
    ],
  },
  'Blank': {
    description: 'Start from scratch with an empty chatbot.',
    nodes: [
      { id: 'root', text: 'Hello! How can I help?', responses: [{ label: 'Option 1', nextId: null }] },
    ],
  },
};

const LEARN_CARDS = [
  { title: 'Conversation Trees', emoji: '🌳', desc: 'Chatbots follow a tree of responses. Each message leads to choices, and each choice leads to another message.' },
  { title: 'Nodes & Edges', emoji: '🔗', desc: 'Each message is a "node." The connections between them are "edges." Together they form the conversation graph.' },
  { title: 'User Choices', emoji: '👆', desc: 'Users pick from options you define. Each choice leads to a different branch of the conversation.' },
  { title: 'Dead Ends', emoji: '🏁', desc: "Conversations need endings! A node with no responses is a 'leaf' — the conversation ends there." },
];

const PERSONALITIES = [
  { name: 'Friendly', emoji: '😊', style: 'Uses lots of emojis, warm and casual' },
  { name: 'Professional', emoji: '👔', style: 'Formal, clear, and efficient' },
  { name: 'Funny', emoji: '🤡', style: 'Adds jokes and humor everywhere' },
];

export function ChatbotBuilderGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [nodes, setNodes] = useState<BotNode[]>(TEMPLATES['Pizza Bot'].nodes);
  const [activeTemplate, setActiveTemplate] = useState('Pizza Bot');
  const [editing, setEditing] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [testPath, setTestPath] = useState<string[]>(['root']);
  const [personality, setPersonality] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  const currentTestNode = testMode ? nodes.find(n => n.id === testPath[testPath.length - 1]) : null;

  const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function loadTemplate(name: string) {
    setNodes(TEMPLATES[name]?.nodes || TEMPLATES['Blank'].nodes);
    setActiveTemplate(name);
    setTestMode(false); setTestPath(['root']);
  }

  function updateNodeText(id: string, text: string) {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  }

  function addNode() {
    const id = `node_${Date.now()}`;
    setNodes(prev => [...prev, { id, text: 'New message...', responses: [] }]);
  }

  function addResponse(nodeId: string) {
    const availableTargets = nodes.filter(n => n.id !== nodeId);
    if (availableTargets.length === 0) return;
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n, responses: [...n.responses, { label: 'New option', nextId: availableTargets[0].id }]
    } : n));
  }

  function testRespond(nextId: string | null) {
    if (!nextId) return;
    setTestPath(prev => [...prev, nextId]);
  }

  function enterTestMode() {
    setTestMode(true); setTestPath(['root']);
    if (!hasCompleted) { game.updateScore(25); game.completeGame(); setHasCompleted(true); }
  }

  return (
    <GameShell gameId="chatbot-builder" title="Chatbot Builder" worldNumber={8} worldColor="#818CF8">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(99,102,241,${0.12 + p.size * 0.05}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">

                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <span className="text-5xl">🤖</span>
                    <h2 className="font-display text-2xl font-bold text-white">Chatbot Builder</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Design conversation graphs with branching dialog trees. Build, edit, and test chatbot flows.'
                        : 'Build your own chatbot! Design conversations, add responses, and test it out!'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Dialog Trees', 'NLP', 'Conversation Design', 'Chatbots'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-body text-[10px] text-indigo-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Learn the Basics! <BookOpen className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ LEARN ═══ */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                    <Bot className="w-6 h-6 text-indigo-400" />
                    <h3 className="font-display text-lg font-bold text-white">Chatbot Concepts</h3>
                    <p className="font-body text-xs text-white/40">{learnIdx + 1} of {LEARN_CARDS.length}</p>
                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-indigo-500/20 bg-indigo-500/5 text-center">
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-indigo-300 mt-3">{LEARN_CARDS[learnIdx].title}</h4>
                        <p className="font-body text-sm text-white/60 mt-2">{LEARN_CARDS[learnIdx].desc}</p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button onClick={() => { if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx(learnIdx + 1); else setPhase('build'); }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next →' : 'Start Building! 🔨'}
                    </motion.button>
                    <button onClick={() => setPhase('build')} className="font-body text-xs text-white/20 hover:text-white/40">
                      Skip to builder →
                    </button>
                  </motion.div>
                )}

                {/* ═══ BUILD / TEST ═══ */}
                {phase === 'build' && (
                  <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 flex-wrap">
                      {Object.entries(TEMPLATES).map(([name, t]) => (
                        <button key={name} onClick={() => loadTemplate(name)}
                          className={`px-2 py-1 rounded-lg font-body text-[10px] whitespace-nowrap transition-all ${
                            activeTemplate === name ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-white/30 border border-white/5 hover:text-white/50'
                          }`}>
                          {name}
                        </button>
                      ))}
                      <div className="flex-1" />
                      {/* Personality */}
                      <button onClick={() => setPersonality(p => (p + 1) % PERSONALITIES.length)}
                        className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 font-body text-[10px] text-white/40 flex items-center gap-1">
                        <Settings2 className="w-3 h-3" /> {PERSONALITIES[personality].emoji}
                      </button>
                      {/* Test toggle */}
                      <motion.button onClick={() => { if (testMode) { setTestMode(false); } else { enterTestMode(); } }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-display text-[10px] font-bold transition-all ${
                          testMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                        whileTap={{ scale: 0.95 }}>
                        {testMode ? <MessageCircle className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {testMode ? 'Edit' : '▶ Test'}
                      </motion.button>
                    </div>

                    {!testMode ? (
                      /* ═══ BUILD MODE ═══ */
                      <div className="flex-1 overflow-auto p-3 space-y-2">
                        {nodes.map(node => (
                          <div key={node.id} className="rounded-xl p-3 border border-white/10 bg-white/[0.02]">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Bot className="w-3 h-3 text-indigo-400" />
                              <span className="font-mono text-[9px] text-white/20">{node.id}</span>
                              {node.responses.length === 0 && <span className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[8px] font-bold">END</span>}
                            </div>
                            {editing === node.id ? (
                              <input value={node.text} onChange={e => updateNodeText(node.id, e.target.value)}
                                onBlur={() => setEditing(null)} autoFocus
                                className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-indigo-500/30 text-white font-body text-sm focus:outline-none" />
                            ) : (
                              <p onClick={() => setEditing(node.id)} className="font-body text-sm text-white/70 cursor-pointer hover:text-white/90">
                                {node.text}
                              </p>
                            )}
                            {node.responses.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {node.responses.map((r, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-300">
                                    {r.label} → {r.nextId || '?'}
                                  </span>
                                ))}
                              </div>
                            )}
                            <button onClick={() => addResponse(node.id)} className="mt-1.5 font-body text-[9px] text-white/20 hover:text-white/40 flex items-center gap-1">
                              <Plus className="w-2.5 h-2.5" /> Add response
                            </button>
                          </div>
                        ))}
                        <button onClick={addNode} className="w-full py-2 rounded-xl border border-dashed border-white/10 text-white/20 font-body text-xs hover:text-white/40 hover:border-white/20 flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" /> Add Node
                        </button>
                        {/* Stats */}
                        <div className="rounded-xl p-3 border border-indigo-500/10 bg-indigo-500/3">
                          <p className="font-body text-[10px] text-white/30">
                            {ageBand === 'C' ? `Graph: ${nodes.length} nodes, ${nodes.reduce((s, n) => s + n.responses.length, 0)} edges, ${nodes.filter(n => n.responses.length === 0).length} leaf nodes`
                              : `Your bot has ${nodes.length} messages and ${nodes.filter(n => n.responses.length === 0).length} endings`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* ═══ TEST MODE ═══ */
                      <div className="flex-1 overflow-auto p-3 space-y-2">
                        <div className="rounded-lg p-2 bg-green-500/5 border border-green-500/20 mb-2">
                          <p className="font-body text-[10px] text-green-400">🧪 Testing: {activeTemplate} ({PERSONALITIES[personality].name})</p>
                        </div>
                        {testPath.map((nodeId, i) => {
                          const node = nodes.find(n => n.id === nodeId);
                          if (!node) return null;
                          return (
                            <motion.div key={`${nodeId}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                              <div className="flex items-start gap-2 mb-2">
                                <Bot className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                                <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-indigo-500/10 border border-indigo-500/20">
                                  <p className="font-body text-sm text-white/80">{node.text}</p>
                                </div>
                              </div>
                              {i === testPath.length - 1 && node.responses.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 ml-6">
                                  {node.responses.map((r, ri) => (
                                    <motion.button key={ri} onClick={() => testRespond(r.nextId)}
                                      className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/20 font-body text-xs text-blue-300 hover:bg-blue-500/25"
                                      whileTap={{ scale: 0.95 }} aria-label={`Reply: ${r.label}`}>
                                      {r.label}
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                        {currentTestNode && currentTestNode.responses.length === 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-4">
                            <p className="font-body text-xs text-white/30 mb-2">End of conversation!</p>
                            <button onClick={() => setTestPath(['root'])} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-body text-xs text-white/40 hover:text-white/60 flex items-center gap-1 mx-auto">
                              <RotateCcw className="w-3 h-3" /> Restart Test
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Game 6: `src/components/games/DataDetectiveGame.tsx` — FLAGSHIP-LITE (V2)

```tsx
// ════════════════════════════════════════════════════
// DATA DETECTIVE V2 — Lab 2 (Teaching AI) — FLAGSHIP-LITE
// Clean messy data, compare before/after accuracy.
// Enhanced: chrome bezel, welcome phase, learn phase,
// issue categorization, visual severity indicators,
// 3 datasets, detailed explanations, accuracy chart.
//
// ⚠️ SUPERSEDED BY V3 Full Treatment — see
//    STAGE7C_v3FINAL_DataDetective_V3_FullTreatment.md
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Trash2, Wrench, Search, BarChart3, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';

type Phase = 'welcome' | 'learn' | 'investigate';

interface Row {
  id: number; name: string; age: string; score: string;
  issue?: 'outlier' | 'missing' | 'duplicate' | 'typo';
  issueDesc?: string; issueDescC?: string;
  fixed?: boolean; del?: boolean;
}

interface Dataset {
  title: string; emoji: string; description: string;
  rows: Row[];
}

const DATASETS: Dataset[] = [
  {
    title: 'Student Test Scores', emoji: '📝', description: 'A class of students took a test. Can you find the data problems?',
    rows: [
      { id: 1, name: 'Alice', age: '12', score: '85' },
      { id: 2, name: 'Bob', age: '999', score: '72', issue: 'outlier', issueDesc: 'Age 999 is impossible! This is an outlier.', issueDescC: 'Statistical outlier: value 999 is >50σ from the mean age.' },
      { id: 3, name: 'Charlie', age: '11', score: '90' },
      { id: 4, name: '', age: '13', score: '65', issue: 'missing', issueDesc: 'Name is empty! Can\'t identify this student.', issueDescC: 'Null value in identifier field prevents record linkage.' },
      { id: 5, name: 'Diana', age: '12', score: '85' },
      { id: 6, name: 'Diana', age: '12', score: '85', issue: 'duplicate', issueDesc: 'Same as row 5! Duplicate record.', issueDescC: 'Exact duplicate inflates sample size and biases training.' },
      { id: 7, name: 'Eve', age: '10', score: '', issue: 'missing', issueDesc: 'Score is empty! AI can\'t learn without target data.', issueDescC: 'Missing target variable makes this row unusable for supervised learning.' },
      { id: 8, name: 'Frank', age: '11', score: '78' },
      { id: 9, name: 'Grace', age: '-5', score: '92', issue: 'outlier', issueDesc: 'Age -5 is impossible! Ages can\'t be negative.', issueDescC: 'Domain constraint violation: age ∈ ℕ⁺.' },
      { id: 10, name: 'Hank', age: '13', score: '45' },
      { id: 11, name: 'Ivy', age: '12', score: '88' },
      { id: 12, name: 'Jack', age: '11', score: '2000', issue: 'outlier', issueDesc: 'Score 2000? The test only goes to 100!', issueDescC: 'Range violation: score ∈ [0,100]. Value 2000 exceeds domain max by 20×.' },
    ],
  },
  {
    title: 'Pet Shelter Records', emoji: '🐾', description: "The animal shelter's database has some issues...",
    rows: [
      { id: 101, name: 'Buddy', age: '3', score: 'Dog' },
      { id: 102, name: 'Whiskers', age: '5', score: 'Cat' },
      { id: 103, name: '', age: '2', score: 'Dog', issue: 'missing', issueDesc: 'No name! Every pet needs to be identifiable.', issueDescC: 'Missing identifier prevents entity resolution.' },
      { id: 104, name: 'Max', age: '-1', score: 'Dog', issue: 'outlier', issueDesc: 'Negative age! Someone made a typo.', issueDescC: 'Domain violation: age < 0. Likely sign error.' },
      { id: 105, name: 'Luna', age: '4', score: '', issue: 'missing', issueDesc: 'What kind of animal is Luna? Species is missing!', issueDescC: 'Missing categorical feature prevents classification.' },
      { id: 106, name: 'Buddy', age: '3', score: 'Dog', issue: 'duplicate', issueDesc: 'Duplicate! Buddy got entered twice.', issueDescC: 'Exact match on all fields with row 101.' },
      { id: 107, name: 'Mittens', age: '200', score: 'Cat', issue: 'outlier', issueDesc: 'A 200-year-old cat?! Cats live about 15-20 years.', issueDescC: 'Biologically implausible: cat lifespan < 30 years.' },
      { id: 108, name: 'Rocky', age: '7', score: 'Dog' },
    ],
  },
];

const ISSUE_COLORS: Record<string, string> = {
  outlier: '#F97316', missing: '#EAB308', duplicate: '#8B5CF6', typo: '#3B82F6',
};

const ISSUE_ICONS: Record<string, string> = {
  outlier: '📊', missing: '❓', duplicate: '👯', typo: '✏️',
};

const LEARN_CARDS = [
  { title: 'Missing Data', emoji: '❓', desc: "Empty cells mean the AI has gaps in its knowledge. Like studying with blank pages!" },
  { title: 'Outliers', emoji: '📊', desc: "Wild values that don't make sense (age: 999). These pull AI's understanding way off." },
  { title: 'Duplicates', emoji: '👯', desc: 'The same data repeated twice. Makes the AI think that data point matters more than it does.' },
  { title: 'Impact', emoji: '🎯', desc: 'Clean data = smart AI. Messy data = confused AI. Data quality is everything!' },
];

export function DataDetectiveGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [datasetIdx, setDatasetIdx] = useState(0);
  const [rows, setRows] = useState<Row[]>(DATASETS[0].rows.map(d => ({ ...d })));
  const [showResults, setShowResults] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const dataset = DATASETS[datasetIdx];
  const totalIssues = rows.filter(d => d.issue).length;
  const fixedCount = rows.filter(d => d.fixed || d.del).length;
  const afterAcc = Math.min(98, 62 + fixedCount * 6);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function fix(id: number) { setRows(p => p.map(d => d.id === id ? { ...d, fixed: true } : d)); game.updateScore(8); }
  function del(id: number) { setRows(p => p.map(d => d.id === id ? { ...d, del: true } : d)); game.updateScore(5); }

  function compare() {
    setShowResults(true); game.updateScore(15);
    if (datasetIdx < DATASETS.length - 1) {
      // More datasets available
    } else {
      game.completeGame();
    }
  }

  function nextDataset() {
    const next = datasetIdx + 1;
    setDatasetIdx(next);
    setRows(DATASETS[next].rows.map(d => ({ ...d })));
    setShowResults(false);
    setSelectedRow(null);
    game.advanceRound();
  }

  return (
    <GameShell gameId="data-detective" title="Data Detective" worldNumber={2} worldColor="#8B5CF6">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(139,92,246,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">

                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-5xl">🔍</span>
                    <h2 className="font-display text-2xl font-bold text-white">Data Detective</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Investigate datasets for quality issues: outliers, missing values, duplicates. Observe accuracy impact.'
                        : 'Be a data detective! Find and fix problems in messy data. Clean data = smart AI!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Data Quality', 'Outliers', 'Missing Values'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-[10px] text-purple-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Learn to Investigate! <Search className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ LEARN ═══ */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4 p-4">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                    <h3 className="font-display text-lg font-bold text-white">Data Issues</h3>
                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-purple-500/20 bg-purple-500/5 text-center">
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-purple-300 mt-3">{LEARN_CARDS[learnIdx].title}</h4>
                        <p className="font-body text-sm text-white/60 mt-2">{LEARN_CARDS[learnIdx].desc}</p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button onClick={() => { if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx(learnIdx + 1); else setPhase('investigate'); }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next →' : 'Start Investigating! 🔎'}
                    </motion.button>
                    <button onClick={() => setPhase('investigate')} className="font-body text-xs text-white/20 hover:text-white/40">
                      Skip to investigation →
                    </button>
                  </motion.div>
                )}

                {/* ═══ INVESTIGATE ═══ */}
                {phase === 'investigate' && (
                  <motion.div key="investigate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{dataset.emoji}</span>
                      <h3 className="font-display text-sm font-bold text-white flex-1">{dataset.title}</h3>
                      <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 font-body text-[10px] text-purple-300">{fixedCount}/{totalIssues} fixed</span>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto rounded-xl border border-white/10 mb-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-2 py-1.5 text-left font-display text-[10px] text-white/40 uppercase">Name</th>
                            <th className="px-2 py-1.5 text-left font-display text-[10px] text-white/40 uppercase">Age</th>
                            <th className="px-2 py-1.5 text-left font-display text-[10px] text-white/40 uppercase">Score</th>
                            <th className="px-2 py-1.5 w-20"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(r => (
                            <tr key={r.id} onClick={() => r.issue && setSelectedRow(selectedRow === r.id ? null : r.id)}
                              className={`border-b border-white/5 cursor-pointer transition-all ${
                                r.issue && !r.fixed && !r.del ? 'bg-amber-500/5 hover:bg-amber-500/10' :
                                r.del ? 'opacity-15 line-through' : r.fixed ? 'bg-green-500/5' : 'hover:bg-white/[0.02]'
                              } ${selectedRow === r.id ? 'ring-1 ring-purple-500/30' : ''}`}>
                              <td className="px-2 py-1.5 font-body text-xs text-white/60">{r.name || <span className="italic text-amber-400">empty</span>}</td>
                              <td className="px-2 py-1.5 font-mono text-xs text-white/60">{r.age}</td>
                              <td className="px-2 py-1.5 font-mono text-xs text-white/60">{r.score || <span className="italic text-amber-400">empty</span>}</td>
                              <td className="px-2 py-1.5 text-right">
                                {r.issue && !r.fixed && !r.del && (
                                  <div className="flex gap-1 justify-end">
                                    <span className="text-[10px]">{ISSUE_ICONS[r.issue]}</span>
                                    <button onClick={e => { e.stopPropagation(); fix(r.id); }}
                                      className="p-0.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                      aria-label="Fix row"><Wrench className="w-3 h-3" /></button>
                                    <button onClick={e => { e.stopPropagation(); del(r.id); }}
                                      className="p-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                      aria-label="Delete row"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                )}
                                {r.fixed && <CheckCircle2 className="w-3 h-3 text-green-400 ml-auto" />}
                                {r.del && <span className="text-red-400 text-xs">×</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Issue detail */}
                    <AnimatePresence>
                      {selectedRow && (() => {
                        const row = rows.find(r => r.id === selectedRow);
                        if (!row?.issue || row.fixed || row.del) return null;
                        return (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-2">
                            <div className="rounded-lg p-2 border text-[10px]" style={{ borderColor: `${ISSUE_COLORS[row.issue]}30`, backgroundColor: `${ISSUE_COLORS[row.issue]}08` }}>
                              <span className="font-bold uppercase" style={{ color: ISSUE_COLORS[row.issue] }}>{row.issue}</span>
                              <span className="text-white/40 ml-2">{ageBand === 'C' ? row.issueDescC : row.issueDesc}</span>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>

                    {/* Results */}
                    {!showResults && fixedCount >= 3 && (
                      <motion.button onClick={compare} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <BarChart3 className="w-4 h-4" /> Compare Accuracy!
                      </motion.button>
                    )}

                    {showResults && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-3 border border-purple-500/15 bg-purple-500/3">
                        <p className="font-display text-sm font-bold text-white mb-2 text-center">Accuracy Impact</p>
                        <div className="flex gap-4 mb-2">
                          {[{ label: 'Before', pct: 62, color: '#EF4444' }, { label: 'After', pct: afterAcc, color: '#10B981' }].map(b => (
                            <div key={b.label} className="flex-1">
                              <div className="h-16 bg-white/5 rounded-lg flex items-end overflow-hidden">
                                <motion.div className="w-full rounded-t" style={{ backgroundColor: b.color }}
                                  initial={{ height: 0 }} animate={{ height: `${b.pct}%` }} transition={{ duration: 0.8 }} />
                              </div>
                              <p className="text-center mt-1 font-display text-xs font-bold" style={{ color: b.color }}>{b.pct}%</p>
                              <p className="text-center font-body text-[9px] text-white/30">{b.label}</p>
                            </div>
                          ))}
                        </div>
                        <p className="font-body text-[10px] text-white/40 text-center">
                          {ageBand === 'C' ? `Data cleaning improved model accuracy by ${afterAcc - 62}pp.`
                            : 'Clean data = smarter AI! You improved accuracy by fixing the problems!'}
                        </p>
                        {datasetIdx < DATASETS.length - 1 && (
                          <motion.button onClick={nextDataset}
                            className="mt-2 w-full py-2 rounded-xl bg-white/5 border border-white/10 font-display text-xs text-white/50 hover:text-white/70"
                            whileTap={{ scale: 0.95 }}>
                            Next Dataset →
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Verification Checklist — Batch 7C

### `npm run dev` — All 6 Games

| Game | Route | Chrome Bezel | Flow |
|------|-------|-------------|------|
| Treat Trainer | `/arcade/treat-trainer` | Purple | Welcome → adjust reward sliders → run episodes → watch learning chart |
| Sentiment Scanner | `/arcade/sentiment-scanner` | Indigo | Welcome → type text → mood meter + word highlights → 5 challenges |
| Lost in Translation | `/arcade/lost-in-translation` | Indigo | Welcome → reveal translations step-by-step → see "why it changed" |
| Neuron Relay | `/arcade/neuron-relay` | Pink | Welcome → toggle neurons + adjust volume → hit target signal → 8 puzzles |
| Chatbot Builder | `/arcade/chatbot-builder` | Indigo | Welcome → learn 4 concepts → build/edit nodes → test mode with conversation flow |
| Data Detective | `/arcade/data-detective` | Purple | Welcome → learn 4 issue types → investigate table → fix/delete → accuracy chart → 2 datasets |

### Flagship-Lite Extras

- **Chatbot Builder:** 4 templates, add node/response, personality selector, graph stats
- **Data Detective:** 2 datasets, issue categorization with colors, detail panel on row click, age-band explanations

### Commit

```bash
git add .
git commit -m "Stage 7C: 6 simulation/sandbox games — Chatbot Builder + Data Detective flagship-lite"
git push origin main
```

Stage 7C complete. 4 standard polish + 2 flagship-lite games.
