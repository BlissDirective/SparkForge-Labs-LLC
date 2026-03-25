// ════════════════════════════════════════════════════════════════════════
// API EXPLORER — Lab 9 (Build with AI) — STANDARD POLISH — BAND C ONLY
//
// Concept: Send simulated API requests to an AI service.
// Choose endpoints, set parameters, see JSON responses.
// Teaches REST APIs, request/response cycle, JSON format.
//
// Features:
// • Chrome bezel (orange, Lab 9)
// • Particle background
// • Welcome + learn phases
// • 5 endpoints: /classify, /generate, /translate, /sentiment, /chat
// • Request builder with parameter inputs
// • Animated "sending" state
// • JSON response viewer with syntax highlighting
// • Status codes explained (200, 400, 429, 500)
// • Request history log
// • ARIA labels
// ════════════════════════════════════════════════════════════════════════
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import {
  Send,
  Server,
  Code,
  Globe,
  History,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// 3D Environment (no SSR)
const Canvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas),
  { ssr: false }
);
const ApiExplorerEnvironment = dynamic(
  () => import('@/components/3d/environments/ApiExplorerEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'explore';

interface Endpoint {
  path: string;
  method: 'GET' | 'POST';
  description: string;
  params: { name: string; type: string; placeholder: string; required: boolean }[];
  exampleResponse: (params: Record<string, string>) => {
    status: number;
    body: object;
    latency: number;
  };
  teachingNote: string;
}

interface RequestLog {
  endpoint: string;
  params: Record<string, string>;
  status: number;
  latency: number;
  timestamp: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    path: '/api/v1/classify',
    method: 'POST',
    description: 'Classify an image or text into categories',
    params: [
      { name: 'input', type: 'text', placeholder: 'e.g., "a photo of a sunset"', required: true },
      { name: 'categories', type: 'text', placeholder: 'e.g., "nature,urban,food"', required: true },
      { name: 'confidence_threshold', type: 'number', placeholder: '0.5', required: false },
    ],
    exampleResponse: (p) => {
      const cats = (p.categories || 'unknown').split(',').map((c) => c.trim());
      const primary = cats[0] || 'unknown';
      const conf = 0.7 + Math.random() * 0.25;
      return {
        status: p.input ? 200 : 400,
        latency: 120 + Math.floor(Math.random() * 80),
        body: p.input
          ? {
              classification: primary,
              confidence: Number(conf.toFixed(3)),
              all_scores: Object.fromEntries(
                cats.map((c, i) => [c, Number((i === 0 ? conf : (1 - conf) / Math.max(cats.length - 1, 1)).toFixed(3))])
              ),
              model: 'classifier-v2',
              tokens_used: Math.floor(Math.random() * 50) + 10,
            }
          : { error: 'Missing required parameter: input', code: 'INVALID_REQUEST' },
      };
    },
    teachingNote:
      'Classification APIs return probability scores across categories. The confidence score tells you how sure the model is about its prediction.',
  },
  {
    path: '/api/v1/generate',
    method: 'POST',
    description: 'Generate text from a prompt',
    params: [
      { name: 'prompt', type: 'text', placeholder: 'e.g., "Write a haiku about robots"', required: true },
      { name: 'max_tokens', type: 'number', placeholder: '100', required: false },
      { name: 'temperature', type: 'number', placeholder: '0.7', required: false },
    ],
    exampleResponse: (p) => {
      const outputs: Record<string, string> = {
        default: 'The quick brown fox jumps over the lazy dog. AI-generated text appears here based on your prompt.',
        robot: 'Steel fingers typing, / Algorithms dream in code, / Circuits come alive.',
        space: 'Beyond the stars, a civilization of quantum beings contemplated the meaning of existence across dimensions.',
      };
      const key = (p.prompt || '').toLowerCase().includes('robot')
        ? 'robot'
        : (p.prompt || '').toLowerCase().includes('space')
          ? 'space'
          : 'default';
      return {
        status: p.prompt ? 200 : 400,
        latency: 800 + Math.floor(Math.random() * 400),
        body: p.prompt
          ? {
              generated_text: outputs[key],
              tokens_used: Math.floor(Math.random() * 80) + 20,
              model: 'claude-haiku-4.5',
              finish_reason: 'stop',
              temperature: Number(p.temperature) || 0.7,
            }
          : { error: 'Missing required parameter: prompt', code: 'INVALID_REQUEST' },
      };
    },
    teachingNote:
      'Generation APIs use temperature to control randomness. Low temp = predictable output. High temp = creative and varied output.',
  },
  {
    path: '/api/v1/translate',
    method: 'POST',
    description: 'Translate text between languages',
    params: [
      { name: 'text', type: 'text', placeholder: 'e.g., "Hello, how are you?"', required: true },
      { name: 'source_lang', type: 'text', placeholder: 'en', required: true },
      { name: 'target_lang', type: 'text', placeholder: 'es', required: true },
    ],
    exampleResponse: (p) => {
      const translations: Record<string, string> = {
        es: 'Hola, ¿cómo estás?',
        fr: 'Bonjour, comment allez-vous?',
        de: 'Hallo, wie geht es Ihnen?',
        ja: 'こんにちは、お元気ですか？',
        zh: '你好，你好吗？',
        ko: '안녕하세요, 어떻게 지내세요?',
      };
      const lang = (p.target_lang || 'es').toLowerCase();
      return {
        status: p.text ? 200 : 400,
        latency: 200 + Math.floor(Math.random() * 150),
        body: p.text
          ? {
              translated_text: translations[lang] || `[${lang}] ${p.text}`,
              source_language: p.source_lang || 'en',
              target_language: lang,
              confidence: Number((0.85 + Math.random() * 0.12).toFixed(3)),
              model: 'translate-v3',
            }
          : { error: 'Missing required parameter: text', code: 'INVALID_REQUEST' },
      };
    },
    teachingNote:
      'Translation APIs detect source language and convert to target. Confidence scores indicate translation quality — lower for rare language pairs.',
  },
  {
    path: '/api/v1/sentiment',
    method: 'POST',
    description: 'Analyze sentiment of text',
    params: [
      { name: 'text', type: 'text', placeholder: 'e.g., "I love this product!"', required: true },
    ],
    exampleResponse: (p) => {
      const text = (p.text || '').toLowerCase();
      const positive = text.includes('love') || text.includes('great') || text.includes('amazing') || text.includes('wonderful');
      const negative = text.includes('hate') || text.includes('terrible') || text.includes('bad') || text.includes('awful');
      const sentiment = positive ? 'positive' : negative ? 'negative' : 'neutral';
      const score = positive ? 0.8 + Math.random() * 0.15 : negative ? -(0.7 + Math.random() * 0.2) : Math.random() * 0.3 - 0.15;
      return {
        status: p.text ? 200 : 400,
        latency: 90 + Math.floor(Math.random() * 60),
        body: p.text
          ? {
              sentiment,
              score: Number(score.toFixed(3)),
              emotions: {
                joy: positive ? Number((0.6 + Math.random() * 0.3).toFixed(2)) : Number((Math.random() * 0.2).toFixed(2)),
                anger: negative ? Number((0.5 + Math.random() * 0.3).toFixed(2)) : Number((Math.random() * 0.15).toFixed(2)),
                surprise: Number((Math.random() * 0.3).toFixed(2)),
                neutral: !positive && !negative ? Number((0.5 + Math.random() * 0.3).toFixed(2)) : Number((Math.random() * 0.2).toFixed(2)),
              },
              model: 'sentiment-v2',
            }
          : { error: 'Missing required parameter: text', code: 'INVALID_REQUEST' },
      };
    },
    teachingNote:
      'Sentiment APIs return a score from -1 (negative) to +1 (positive). Many also break down emotions into specific categories like joy, anger, and surprise.',
  },
  {
    path: '/api/v1/chat',
    method: 'POST',
    description: 'Send a message to an AI chatbot',
    params: [
      { name: 'message', type: 'text', placeholder: 'e.g., "What is machine learning?"', required: true },
      { name: 'system_prompt', type: 'text', placeholder: 'e.g., "You are a helpful tutor"', required: false },
      { name: 'max_tokens', type: 'number', placeholder: '200', required: false },
    ],
    exampleResponse: (p) => {
      const responses: Record<string, string> = {
        ml: 'Machine learning is a subset of AI where computers learn patterns from data without being explicitly programmed. It uses algorithms to identify patterns and make predictions.',
        ai: 'Artificial intelligence is the simulation of human intelligence by computer systems. This includes learning, reasoning, and self-correction.',
        default:
          "That's a great question! AI systems process your input, match it against learned patterns, and generate a contextually appropriate response.",
      };
      const msg = (p.message || '').toLowerCase();
      const key = msg.includes('machine learning') || msg.includes('ml') ? 'ml' : msg.includes('artificial intelligence') || msg.includes(' ai') ? 'ai' : 'default';
      return {
        status: p.message ? 200 : 400,
        latency: 500 + Math.floor(Math.random() * 300),
        body: p.message
          ? {
              response: responses[key],
              role: 'assistant',
              model: 'claude-haiku-4.5',
              tokens_used: {
                input: Math.floor(Math.random() * 30) + 10,
                output: Math.floor(Math.random() * 60) + 20,
              },
              system_prompt: p.system_prompt || 'default',
              finish_reason: 'stop',
            }
          : { error: 'Missing required parameter: message', code: 'INVALID_REQUEST' },
      };
    },
    teachingNote:
      'Chat APIs use a messages array with roles (user, assistant, system). The system prompt sets the AI personality and behavior constraints.',
  },
];

const STATUS_INFO: Record<number, { label: string; color: string; desc: string }> = {
  200: { label: '200 OK', color: '#10B981', desc: 'Success! The API processed your request.' },
  400: { label: '400 Bad Request', color: '#F59E0B', desc: 'Something was wrong with your request. Check required parameters.' },
  429: { label: '429 Rate Limited', color: '#F97316', desc: 'Too many requests! APIs limit how often you can call them.' },
  500: { label: '500 Server Error', color: '#EF4444', desc: 'The server had a problem. Not your fault — try again later.' },
};

const LEARN_CARDS = [
  {
    title: "What's an API?",
    emoji: '🔌',
    desc: "API = Application Programming Interface. It's how programs talk to each other — like a waiter taking your order to the kitchen.",
  },
  {
    title: 'Request → Response',
    emoji: '📡',
    desc: 'You send a REQUEST with parameters (like an order), and the server sends back a RESPONSE with data (like your food).',
  },
  {
    title: 'JSON Format',
    emoji: '📋',
    desc: 'APIs speak JSON — a structured format with keys and values. Think of it like a labeled filing system for data.',
  },
  {
    title: 'Status Codes',
    emoji: '🚦',
    desc: '200 = Success, 400 = Bad request, 429 = Too many requests, 500 = Server error. These tell you what happened.',
  },
];

function JsonViewer({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const indent = '  '.repeat(depth);

  if (data === null) return <span className="text-orange-400">null</span>;
  if (typeof data === 'boolean') return <span className="text-orange-400">{String(data)}</span>;
  if (typeof data === 'number') return <span className="text-cyan-400">{data}</span>;
  if (typeof data === 'string') return <span className="text-green-400">&quot;{data}&quot;</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span>{'[]'}</span>;
    return (
      <span>
        {'[\n'}
        {data.map((v, i) => (
          <span key={i}>
            {indent}  <JsonViewer data={v} depth={depth + 1} />
            {i < data.length - 1 ? ',\n' : '\n'}
          </span>
        ))}
        {indent}]
      </span>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span>{'{}'}</span>;
    return (
      <span>
        {'{\n'}
        {entries.map(([k, v], i) => (
          <span key={k}>
            {indent}  <span className="text-purple-400">&quot;{k}&quot;</span>:{' '}
            <JsonViewer data={v} depth={depth + 1} />
            {i < entries.length - 1 ? ',\n' : '\n'}
          </span>
        ))}
        {indent}
        {'}'}
      </span>
    );
  }

  return <span>{String(data)}</span>;
}

export function ApiExplorerGame() {
  const game = useGameStore();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [params, setParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<{ status: number; body: object; latency: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<RequestLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [endpointsUsed, setEndpointsUsed] = useState<Set<number>>(new Set());
  const [recentRequests, setRecentRequests] = useState<number[]>([]);

  const endpoint = ENDPOINTS[selectedEndpoint];

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  function updateParam(name: string, value: string) {
    setParams((prev) => ({ ...prev, [name]: value }));
  }

  async function sendRequest() {
    setSending(true);
    setResponse(null);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    // Check for rate limiting: 3+ requests to the same endpoint in rapid succession
    const now = Date.now();
    const recentSame = recentRequests.filter((t) => now - t < 5000);
    setRecentRequests([...recentSame, now]);

    let result: { status: number; body: object; latency: number };

    if (recentSame.length >= 2) {
      // Rate limited
      result = {
        status: 429,
        latency: 15 + Math.floor(Math.random() * 10),
        body: { error: 'Rate limit exceeded. Please wait before sending more requests.', code: 'RATE_LIMITED', retry_after_ms: 5000 },
      };
    } else if (Math.random() < 0.05) {
      // Random server error (~5% chance)
      result = {
        status: 500,
        latency: 2000 + Math.floor(Math.random() * 500),
        body: { error: 'Internal server error. The model encountered an unexpected condition.', code: 'INTERNAL_ERROR', request_id: `req_${Math.random().toString(36).slice(2, 10)}` },
      };
    } else {
      result = endpoint.exampleResponse(params);
    }

    setResponse(result);
    setSending(false);

    setHistory((prev) =>
      [
        {
          endpoint: endpoint.path,
          params: { ...params },
          status: result.status,
          latency: result.latency,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 10)
    );

    const isNew = !endpointsUsed.has(selectedEndpoint);
    if (isNew) {
      setEndpointsUsed((prev) => new Set(prev).add(selectedEndpoint));
      game.updateScore(10);
      game.advanceRound();
    } else {
      game.updateScore(3);
    }

    const totalUsed = isNew ? endpointsUsed.size + 1 : endpointsUsed.size;
    if (totalUsed >= ENDPOINTS.length) {
      setTimeout(() => game.completeGame(), 2000);
    }
  }

  function selectEndpoint(idx: number) {
    setSelectedEndpoint(idx);
    setParams({});
    setResponse(null);
  }

  const statusInfo = response ? STATUS_INFO[response.status] || STATUS_INFO[500] : null;

  return (
    <GameShell
      gameId="api-explorer"
      title="API Explorer"
      worldNumber={9}
      worldColor="#F97316"
      totalRounds={ENDPOINTS.length}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* 3D Environment Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <Canvas
            camera={{ position: [0, 2, 8], fov: 50 }}
            style={{ background: 'transparent' }}
            gl={{ alpha: true, antialias: true }}
          >
            <ApiExplorerEnvironment requestsSent={history.length} currentMethod={endpoint.method} />
          </Canvas>
        </div>

        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: 'radial-gradient(circle, rgba(249,115,22,0.15), transparent)',
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(249,115,22,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Top LED rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div
                    key="w"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto"
                  >
                    <motion.span
                      className="text-6xl"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🔌
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">API Explorer</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Send requests to simulated AI APIs. Set parameters, read JSON responses,
                      and learn how real AI services work under the hood.
                    </p>
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 font-body text-2xs text-orange-400">
                      Advanced — Ages 14-16
                    </span>
                    <div className="flex gap-2 justify-center">
                      {['REST APIs', 'JSON', 'HTTP', 'AI Services'].map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 font-body text-2xs text-orange-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Learn about APIs"
                    >
                      Learn APIs! <Code className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* LEARN */}
                {phase === 'learn' && (
                  <motion.div
                    key="l"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-orange-500/20 bg-orange-500/5"
                      >
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-orange-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < 3) setLearnIdx((i) => i + 1);
                        else setPhase('explore');
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {learnIdx < 3 ? 'Next →' : 'Start Exploring! 🔌'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('explore')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                    >
                      Skip intro →
                    </button>
                  </motion.div>
                )}

                {/* EXPLORE */}
                {phase === 'explore' && (
                  <motion.div
                    key="e"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col space-y-2"
                  >
                    {/* Endpoint tabs */}
                    <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                      {ENDPOINTS.map((ep, i) => (
                        <button
                          key={i}
                          onClick={() => selectEndpoint(i)}
                          className={`flex-shrink-0 px-2 py-1 rounded-lg font-mono text-2xs transition-all ${
                            i === selectedEndpoint
                              ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                              : endpointsUsed.has(i)
                                ? 'bg-green-500/10 border border-green-500/20 text-green-400/60'
                                : 'bg-white/[0.02] border border-white/10 text-white/30'
                          }`}
                          aria-label={`Select endpoint ${ep.path}`}
                        >
                          {endpointsUsed.has(i) && '✓ '}
                          {ep.path.split('/').pop()}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex-shrink-0 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/10 text-white/20 font-mono text-2xs"
                        aria-label="Toggle request history"
                      >
                        <History className="inline w-2.5 h-2.5" /> {history.length}
                      </button>
                    </div>

                    {/* Progress */}
                    <p className="font-body text-2xs text-white/15 mb-2">
                      {endpointsUsed.size}/{ENDPOINTS.length} endpoints explored
                    </p>

                    {/* Request builder */}
                    <div className="rounded-xl p-3 border border-orange-500/15 bg-orange-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                            endpoint.method === 'POST'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="font-mono text-xs text-orange-300 flex-1">
                          {endpoint.path}
                        </code>
                        <Globe className="w-3 h-3 text-white/15" />
                      </div>
                      <p className="font-body text-2xs text-white/30 mb-2">
                        {endpoint.description}
                      </p>

                      {/* Parameters */}
                      <div className="space-y-1.5">
                        {endpoint.params.map((p) => (
                          <div key={p.name} className="flex items-center gap-2">
                            <label className="font-mono text-2xs text-white/40 w-24 text-right">
                              {p.name}
                              {p.required && <span className="text-red-400">*</span>}
                            </label>
                            <input
                              value={params[p.name] || ''}
                              onChange={(e) => updateParam(p.name, e.target.value)}
                              placeholder={p.placeholder}
                              type={p.type === 'number' ? 'number' : 'text'}
                              className="flex-1 px-2 py-1 rounded bg-black/30 border border-white/10 font-mono text-2xs text-white/70 placeholder:text-white/15 focus:border-orange-500/40 outline-none"
                              aria-label={`${p.name} parameter`}
                            />
                          </div>
                        ))}
                      </div>

                      <motion.button
                        onClick={sendRequest}
                        disabled={sending}
                        className="mt-2 w-full py-2 rounded-lg font-display font-bold text-xs text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{
                          background: !sending
                            ? 'linear-gradient(135deg, #F97316, #EA580C)'
                            : '#555',
                        }}
                        whileTap={{ scale: 0.98 }}
                        aria-label="Send API request"
                      >
                        {sending ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Server className="w-3 h-3" />
                          </motion.span>
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {sending ? 'Sending...' : 'Send Request'}
                      </motion.button>
                    </div>

                    {/* Response */}
                    <AnimatePresence>
                      {response && statusInfo && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="rounded-xl border overflow-hidden mb-2 flex-1"
                          style={{ borderColor: `${statusInfo.color}30` }}
                        >
                          {/* Status header */}
                          <div
                            className="flex items-center gap-2 px-3 py-1.5"
                            style={{ background: `${statusInfo.color}10` }}
                          >
                            {response.status === 200 ? (
                              <CheckCircle2 className="w-3 h-3" style={{ color: statusInfo.color }} />
                            ) : (
                              <AlertCircle className="w-3 h-3" style={{ color: statusInfo.color }} />
                            )}
                            <span className="font-mono text-xs font-bold" style={{ color: statusInfo.color }}>
                              {statusInfo.label}
                            </span>
                            <span className="font-mono text-2xs text-white/20 ml-auto">
                              {response.latency}ms
                            </span>
                          </div>

                          {/* JSON body */}
                          <div className="p-3 overflow-auto max-h-48">
                            <pre className="font-mono text-2xs leading-relaxed whitespace-pre-wrap">
                              <JsonViewer data={response.body} />
                            </pre>
                          </div>

                          {/* Teaching note */}
                          <div className="px-3 py-1.5 border-t border-white/5">
                            <p className="font-body text-2xs text-white/25">
                              💡 {endpoint.teachingNote}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* History panel */}
                    <AnimatePresence>
                      {showHistory && history.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-xl border border-white/5 p-2 space-y-1 overflow-hidden"
                        >
                          <p className="font-display text-2xs font-bold text-white/25">
                            Request History
                          </p>
                          {history.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-2xs">
                              <span className="font-mono text-white/15">{h.timestamp}</span>
                              <code className="font-mono text-orange-300/50">{h.endpoint}</code>
                              <span
                                className={`font-mono font-bold ${
                                  h.status === 200 ? 'text-green-400/50' : 'text-amber-400/50'
                                }`}
                              >
                                {h.status}
                              </span>
                              <span className="font-mono text-white/15">{h.latency}ms</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
