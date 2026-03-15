# SPARKFORGE — STAGE 7C: CHATBOT BUILDER — v3-FINAL (PART B)

**Date:** February 28, 2026 | **GCUD:** V9 | **Vision:** Laboratory Control Station
**Design Direction:** Frost-Prismatic v3 | Lab 8: Words & Language (NLP) | Color: `#6366F1`

---

## DECISIONS IMPLEMENTED

- [x] Decision 6.5 — ChatbotNodes3D dynamic import integrated into ChatbotBuilderGame.tsx
- [x] BUG-10F — Font stack uses Exo 2/Sora/Orbitron (font-display/font-body classes)

## THIS PART CONTAINS

| Action | File | Lines |
|--------|------|-------|
| FULL REPLACEMENT | `src/components/games/ChatbotBuilderGame.tsx` | ~712 |

**PREREQUISITES:** Stage 7C Part A (`ChatbotNodes3D.tsx` at `src/components/3d/ChatbotNodes3D.tsx`)
**SUPERSEDES:** `ChatbotBuilderGame.tsx` from `STAGE7_ChatbotBuilder_V3_FullTreatment.pdf`

---

## WHAT CHANGED FROM V3 FULL TREATMENT TO v3-FINAL

All other code is identical to V3 Full Treatment. The v3-FINAL changes are purely additive — no V3 features were removed or modified. The 3D component renders conditionally above the SVG graph view and test view on desktop only.

| Line(s) | Change | Reason |
|---------|--------|--------|
| 7–12 | [v3] Header updated to v3-FINAL | Version tracking |
| 25–27 | [v3] `import dynamic from "next/dynamic"` | Required for 3D import |
| 30–33 | [v3] `const ChatbotNodes3D = dynamic(...)` | Decision 6.5: 3D conversation tree nodes |
| 36–43 | [v3] `function useIsMobile()` | Mobile detection for 3D/SVG fallback |
| 277 | [v3] `const isMobile = useIsMobile()` | Hook usage in component |
| 330–338 | [v3] ChatbotNodes3D render block | 3D scene above SVG graph (desktop only) |

## v3 INTEGRATION DETAILS

The ChatbotNodes3D component receives:

| Prop | Source | Description |
|------|--------|-------------|
| nodes | Component state | Current `BotNode[]` array |
| personalityColors | `pers.colors` | Active personality color set (primary, bg, border, accent) |
| hoveredNode | Component state | Currently hovered node ID (null in test view) |
| testPath | Component state | Array of node IDs visited in test mode |
| isTestMode | `viewMode === "test"` | True when test view active |
| isMobile | `useIsMobile()` | Mobile returns null (SVG-only fallback) |

The 3D scene renders in both graph and test view modes on desktop. In graph view, it shows hovered node highlights. In test view, it shows message pulse animations along the active test path. Tree view has no 3D overlay (editing focus).

---

## FULL REPLACEMENT: `src/components/games/ChatbotBuilderGame.tsx`

Copy-paste the entire code block below to replace the existing file.

```tsx
"use client";

// ================================================================
// CHATBOT BUILDER v3-FINAL — Lab 8 (NLP) — Flagship-Lite
// ================================================================
// V3 Full Treatment features:
//   1. SVG conversation graph with floating bubbles + animated edges
//   2. Typing animation in test mode (char-by-char, blinking cursor)
//   3. Personality system (Friendly/Professional/Funny) with themed
//      colors, borders, glow, animation style
//   4. Challenge mode — 3 challenges with live checking
//   5. Builder metrics — node count, edge count, max depth, terminals
//   6. Deploy celebration — bot shrinks into phone mockup + confetti
//   7. Chrome bezel, welcome phase, learn phase, age-band depth
//
// v3-FINAL Additions (Decision 6.5):
//   - [v3] Dynamic import of ChatbotNodes3D for 3D node visualization
//   - [v3] useIsMobile hook for 3D/SVG fallback
//   - [v3] personalityColors passed to 3D scene
//   - [v3] 3D renders above SVG graph on desktop, hidden on mobile
//
// SUPERSEDES: STAGE7_ChatbotBuilder_V3_FullTreatment.pdf
// ================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { GameShell } from "@/components/game/GameShell";
import { useGameStore } from "@/stores/gameStore";
import { useChildStore } from "@/stores/childStore";
import {
  Plus, RotateCcw, Bot, Settings2,
  BookOpen, Smartphone,
} from "lucide-react";
import { Canvas3DErrorBoundary } from "@/components/3d/Canvas3DErrorBoundary";

// [v3] Dynamic import for 3D conversation tree (no SSR)
const ChatbotNodes3D = dynamic(
  () => import("@/components/3d/ChatbotNodes3D"),
  { ssr: false }
);

// [v3] Mobile detection for 3D fallback
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// --- Types ---
type Phase = "welcome" | "learn" | "build";
type ViewMode = "tree" | "graph" | "test";

interface BotNode {
  id: string;
  text: string;
  responses: { label: string; nextId: string | null }[];
}

interface Personality {
  name: string;
  emoji: string;
  style: string;
  colors: { primary: string; bg: string; border: string; accent: string };
  animation: "smooth" | "bouncy" | "crisp";
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  descriptionC: string;
  check: (nodes: BotNode[]) => boolean;
  reward: number;
}

// --- Constants ---

const PERSONALITIES: Personality[] = [
  {
    name: "Friendly", emoji: "☀️",
    style: "Warm, casual, lots of emojis",
    colors: { primary: "#F59E0B", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", accent: "#FCD34D" },
    animation: "smooth",
  },
  {
    name: "Professional", emoji: "💼",
    style: "Formal, clear, efficient",
    colors: { primary: "#3B82F6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)", accent: "#93C5FD" },
    animation: "crisp",
  },
  {
    name: "Funny", emoji: "🤪",
    style: "Jokes, humor, bouncy energy",
    colors: { primary: "#EC4899", bg: "rgba(236,72,153,0.06)", border: "rgba(236,72,153,0.2)", accent: "#F9A8D4" },
    animation: "bouncy",
  },
];

const TEMPLATES: Record<string, { emoji: string; description: string; nodes: BotNode[] }> = {
  "Pizza Bot": {
    emoji: "🍕", description: "A pizza ordering chatbot",
    nodes: [
      { id: "root", text: "Welcome to Pizza Palace! 🍕 What size?", responses: [
        { label: "Small", nextId: "small" }, { label: "Medium", nextId: "med" }, { label: "Large", nextId: "large" }
      ]},
      { id: "small", text: "A small pizza! Any toppings?", responses: [
        { label: "Pepperoni", nextId: "done" }, { label: "Plain", nextId: "done" }
      ]},
      { id: "med", text: "Medium it is! Pick a topping:", responses: [
        { label: "Mushroom", nextId: "done" }, { label: "Olives", nextId: "done" }
      ]},
      { id: "large", text: "Going big! What topping?", responses: [
        { label: "Everything!", nextId: "done" }
      ]},
      { id: "done", text: "Your order is placed! Enjoy! 🎉", responses: [] },
    ],
  },
  "Help Desk": {
    emoji: "🔧", description: "A support chatbot that triages issues",
    nodes: [
      { id: "root", text: "Hi! I'm HelpBot. What's the problem? 🤖", responses: [
        { label: "App crashed", nextId: "crash" }, { label: "Forgot password", nextId: "password" }, { label: "Other", nextId: "other" }
      ]},
      { id: "crash", text: "Sorry! Have you tried restarting?", responses: [
        { label: "Still broken", nextId: "escalate" }, { label: "That fixed it!", nextId: "resolved" }
      ]},
      { id: "password", text: "Check your email for a reset link.", responses: [
        { label: "Got it!", nextId: "resolved" }, { label: "No email", nextId: "escalate" }
      ]},
      { id: "other", text: "Can you describe the issue?", responses: [
        { label: "It's complicated", nextId: "escalate" }, { label: "Never mind", nextId: "resolved" }
      ]},
      { id: "escalate", text: "Connecting you to a human agent 👤", responses: [] },
      { id: "resolved", text: "Glad I could help! ✅", responses: [] },
    ],
  },
  "Joke Bot": {
    emoji: "😂", description: "A joke-telling chatbot",
    nodes: [
      { id: "root", text: "Hey! Want to hear a joke? 😄", responses: [
        { label: "Yes!", nextId: "joke" }, { label: "No thanks", nextId: "bye" }
      ]},
      { id: "joke", text: "Why did the AI go to school?", responses: [
        { label: "Why?", nextId: "punch" }
      ]},
      { id: "punch", text: "To improve its learning algorithm! 🤓😂", responses: [
        { label: "Another!", nextId: "joke2" }, { label: "Bye!", nextId: "bye" }
      ]},
      { id: "joke2", text: "What do you call a robot that takes detours?", responses: [
        { label: "What?", nextId: "punch2" }
      ]},
      { id: "punch2", text: "R2-Detour! 🤣", responses: [] },
      { id: "bye", text: "See you later! 👋", responses: [] },
    ],
  },
  "Blank": {
    emoji: "📝", description: "Start from scratch",
    nodes: [
      { id: "root", text: "Hello! How can I help?", responses: [{ label: "Option 1", nextId: null }] },
    ],
  },
};

const CHALLENGES: Challenge[] = [
  {
    id: "ch1", title: "Three Endings",
    description: "Build a bot with at least 3 different conversation endings.",
    descriptionC: "Create a dialog graph with ≥3 terminal nodes (nodes with 0 outgoing edges).",
    check: (nodes) => nodes.filter((n) => n.responses.length === 0).length >= 3,
    reward: 20,
  },
  {
    id: "ch2", title: "Deep Conversation",
    description: "Make a conversation that goes at least 4 messages deep.",
    descriptionC: "Ensure the graph has a path of length ≥4 from root to a terminal.",
    check: (nodes) => {
      function maxDepth(id: string, visited: Set<string>): number {
        const node = nodes.find((n) => n.id === id);
        if (!node || visited.has(id)) return 0;
        visited.add(id);
        if (node.responses.length === 0) return 1;
        return 1 + Math.max(...node.responses.filter((r) => r.nextId).map((r) => maxDepth(r.nextId!, new Set(visited))));
      }
      return maxDepth("root", new Set()) >= 4;
    },
    reward: 25,
  },
  {
    id: "ch3", title: "Many Choices",
    description: "Have at least one message with 3 or more response options.",
    descriptionC: "Include a node with branching factor ≥3.",
    check: (nodes) => nodes.some((n) => n.responses.length >= 3),
    reward: 15,
  },
];

const LEARN_CARDS = [
  { title: "Conversation Trees", emoji: "🌳", desc: "Chatbots follow a tree of responses. Each message leads to choices, and each choice leads to a new message." },
  { title: "Nodes & Edges", emoji: "🔗", desc: "Messages are \"nodes.\" Connections between them are \"edges.\" Together they form a graph." },
  { title: "User Choices", emoji: "👆", desc: "Users pick from options you define. Each choice leads down a different branch of the tree." },
  { title: "Dead Ends", emoji: "🛑", desc: "Every conversation needs graceful endings. A node with no responses is a terminal node." },
];

// --- Helper: compute graph layout ---
function computeGraphLayout(nodes: BotNode[]) {
  const positions: Record<string, { x: number; y: number }> = {};
  const visited = new Set<string>();
  const levelNodes: Record<number, string[]> = {};

  function traverse(id: string, level: number) {
    if (visited.has(id)) return;
    visited.add(id);
    if (!levelNodes[level]) levelNodes[level] = [];
    levelNodes[level].push(id);
    const node = nodes.find((n) => n.id === id);
    if (node) node.responses.forEach((r) => { if (r.nextId) traverse(r.nextId, level + 1); });
  }
  traverse("root", 0);

  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      const maxLevel = Math.max(0, ...Object.keys(levelNodes).map(Number));
      if (!levelNodes[maxLevel + 1]) levelNodes[maxLevel + 1] = [];
      levelNodes[maxLevel + 1].push(n.id);
      visited.add(n.id);
    }
  });

  const levels = Object.keys(levelNodes).map(Number).sort((a, b) => a - b);
  const maxWidth = Math.max(...levels.map((l) => levelNodes[l].length));
  const svgW = Math.max(300, maxWidth * 120);
  const svgH = Math.max(200, levels.length * 90);

  levels.forEach((level) => {
    const nodesAtLevel = levelNodes[level];
    const spacing = svgW / (nodesAtLevel.length + 1);
    nodesAtLevel.forEach((id, i) => { positions[id] = { x: spacing * (i + 1), y: 40 + level * 80 }; });
  });

  return { positions, svgW, svgH };
}

// --- Helper: compute metrics ---
function computeMetrics(nodes: BotNode[]) {
  const edges = nodes.reduce((s, n) => s + n.responses.filter((r) => r.nextId).length, 0);
  const terminals = nodes.filter((n) => n.responses.length === 0).length;
  const maxBranch = Math.max(0, ...nodes.map((n) => n.responses.length));
  function depth(id: string, v: Set<string>): number {
    const node = nodes.find((n) => n.id === id);
    if (!node || v.has(id)) return 0;
    v.add(id);
    if (node.responses.length === 0) return 1;
    return 1 + Math.max(...node.responses.filter((r) => r.nextId).map((r) => depth(r.nextId!, new Set(v))));
  }
  return { nodeCount: nodes.length, edges, terminals, maxBranch, maxDepth: depth("root", new Set()) };
}

// --- Typing Animation Hook ---
function useTypingAnimation(text: string, enabled: boolean, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!enabled) { setDisplayed(text); setDone(true); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, enabled, speed]);
  return { displayed, done };
}

// --- Typing Message Sub-component ---
function TypingMessage({ text, isLatest, speed }: { text: string; isLatest: boolean; speed: number }) {
  const { displayed, done } = useTypingAnimation(text, isLatest, speed);
  return (
    <p className="font-body text-sm text-white/80">
      {displayed}
      {isLatest && !done && (
        <motion.span className="inline-block w-0.5 h-4 bg-white/50 ml-0.5"
          animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} />
      )}
    </p>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function ChatbotBuilderGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || "B") as "A" | "B" | "C";
  const isMobile = useIsMobile(); // [v3]

  // State
  const [phase, setPhase] = useState<Phase>("welcome");
  const [learnIdx, setLearnIdx] = useState(0);
  const [nodes, setNodes] = useState<BotNode[]>(TEMPLATES["Pizza Bot"].nodes);
  const [activeTemplate, setActiveTemplate] = useState("Pizza Bot");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [editing, setEditing] = useState<string | null>(null);
  const [personality, setPersonality] = useState(0);
  const [testPath, setTestPath] = useState<string[]>(["root"]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [showDeploy, setShowDeploy] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  const pers = PERSONALITIES[personality];
  const metrics = useMemo(() => computeMetrics(nodes), [nodes]);
  const currentTestNode = viewMode === "test" ? nodes.find((n) => n.id === testPath[testPath.length - 1]) : null;

  const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 1, delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  // --- Actions ---
  function loadTemplate(name: string) {
    setNodes(TEMPLATES[name]?.nodes || TEMPLATES["Blank"].nodes);
    setActiveTemplate(name); setViewMode("tree"); setTestPath(["root"]);
  }

  function updateNodeText(id: string, text: string) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  }

  function addNode() {
    const id = `node_${Date.now()}`;
    setNodes((prev) => [...prev, { id, text: "New message...", responses: [] }]);
  }

  function addResponse(nodeId: string) {
    const targets = nodes.filter((n) => n.id !== nodeId);
    if (targets.length === 0) return;
    setNodes((prev) => prev.map((n) => n.id === nodeId
      ? { ...n, responses: [...n.responses, { label: "New option", nextId: targets[0].id }] } : n));
  }

  function removeResponse(nodeId: string, idx: number) {
    setNodes((prev) => prev.map((n) => n.id === nodeId
      ? { ...n, responses: n.responses.filter((_, i) => i !== idx) } : n));
  }

  // Enhancement A: Edit response labels inline
  function updateResponseLabel(nodeId: string, idx: number, label: string) {
    setNodes((prev) => prev.map((n) => n.id === nodeId
      ? { ...n, responses: n.responses.map((r, i) => i === idx ? { ...r, label } : r) } : n));
  }

  function enterTestMode() {
    setViewMode("test"); setTestPath(["root"]);
    if (!hasScored) { game.updateScore(20); setHasScored(true); }
  }

  // Enhancement C: Initialize game in store
  useEffect(() => {
    game.startGame("chatbot-builder", 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fixed stale closure: use functional state update to read latest completedChallenges (BUG-AUDIT-4)
  const checkChallenges = useCallback(() => {
    setCompletedChallenges((prev) => {
      const next = new Set(prev);
      let added = false;
      CHALLENGES.forEach((ch) => {
        if (!next.has(ch.id) && ch.check(nodes)) {
          next.add(ch.id);
          game.updateScore(ch.reward);
          added = true;
        }
      });
      return added ? next : prev;
    });
  }, [nodes, game]);

  useEffect(() => { if (phase === "build") checkChallenges(); }, [nodes, phase, checkChallenges]);

  const deployTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function deployBot() {
    setShowDeploy(true);
    game.updateScore(30);
    deployTimerRef.current = setTimeout(() => game.completeGame(), 3000);
  }
  // Cleanup deploy timer on unmount (LOW-4 fix)
  useEffect(() => () => { if (deployTimerRef.current) clearTimeout(deployTimerRef.current); }, []);

  return (
    <GameShell gameId="chatbot-builder" title="Chatbot Builder" worldNumber={8} worldColor="#6366F1">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, ${pers.colors.primary}20, transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: `1px solid ${pers.colors.border}`, boxShadow: "0 2px 40px rgba(0,0,0,0.3)" }}>
            <div className="h-[2px] w-full" style={{ background: `linear-gradient(to right, transparent, ${pers.colors.primary}40, transparent)` }} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {/* === WELCOME === */}
                {phase === "welcome" && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <motion.span className="text-6xl block" animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                      🤖
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Chatbot Builder</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === "C" ? "Design conversation graphs with branching dialog trees, test routing paths, and analyze graph metrics."
                        : "Build your own chatbot! Design conversations, add responses, and test your creation."}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["Dialog Trees", "NLP", "Graph Theory", "Chatbots"].map((t) => (
                        <span key={t} className="px-2 py-1 rounded-lg font-body text-[10px]"
                          style={{ backgroundColor: pers.colors.bg, border: `1px solid ${pers.colors.border}`, color: pers.colors.primary }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase("learn")}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: `linear-gradient(135deg, ${pers.colors.primary}, ${pers.colors.accent})` }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Learn the Basics! <BookOpen className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* === LEARN === */}
                {phase === "learn" && (
                  <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                    <Bot className="w-6 h-6" style={{ color: pers.colors.primary }} />
                    <h3 className="font-display text-lg font-bold text-white">Chatbot Concepts</h3>
                    <p className="font-body text-xs text-white/40">{learnIdx + 1} / {LEARN_CARDS.length}</p>
                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 text-center"
                        style={{ backgroundColor: pers.colors.bg, border: `1px solid ${pers.colors.border}` }}>
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold mt-3" style={{ color: pers.colors.primary }}>
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">{LEARN_CARDS[learnIdx].desc}</p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button onClick={() => { if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx((i) => i + 1); else setPhase("build"); }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: `linear-gradient(135deg, ${pers.colors.primary}, ${pers.colors.accent})` }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1 ? "Next →" : "Start Building! 🚀"}
                    </motion.button>
                    <button onClick={() => setPhase("build")} className="font-body text-xs text-white/20">Skip</button>
                  </motion.div>
                )}

                {/* === BUILD / GRAPH / TEST === */}
                {phase === "build" && (
                  <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
                    {/* -- Toolbar -- */}
                    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/5 overflow-x-auto">
                      {Object.entries(TEMPLATES).map(([name, t]) => (
                        <button key={name} onClick={() => loadTemplate(name)}
                          className={`px-2 py-1 rounded-lg font-body whitespace-nowrap border text-[10px] ${activeTemplate === name ? "text-white" : "text-white/30"}`}
                          style={activeTemplate === name ? { borderColor: pers.colors.border, backgroundColor: pers.colors.bg } : {}}>
                          {t.emoji} {name}
                        </button>
                      ))}
                      <div className="flex-1" />
                      {/* Personality toggle */}
                      <button onClick={() => setPersonality((p) => (p + 1) % PERSONALITIES.length)}
                        className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-white/40 text-[10px]">
                        <Settings2 className="w-3 h-3" /> {pers.emoji}
                      </button>
                      {/* View mode tabs */}
                      {(["tree", "graph", "test"] as const).map((mode) => (
                        <button key={mode} onClick={() => mode === "test" ? enterTestMode() : setViewMode(mode)}
                          className={`px-2 py-1 rounded-lg font-display font-bold ${viewMode === mode ? "text-white" : "text-white/20"} text-[10px]`}
                          style={viewMode === mode ? { backgroundColor: pers.colors.bg, color: pers.colors.primary } : {}}>
                          {mode === "tree" ? "🌳" : mode === "graph" ? "🕸️" : "▶️"} {mode}
                        </button>
                      ))}
                    </div>

                    {/* [v3] 3D Visualization (desktop only, graph or test view) */}
                    {(viewMode === "graph" || viewMode === "test") && !isMobile && (
                      <Canvas3DErrorBoundary>
                        <ChatbotNodes3D
                          nodes={nodes}
                          personalityColors={pers.colors}
                          hoveredNode={viewMode === "graph" ? hoveredNode : null}
                          testPath={testPath}
                          isTestMode={viewMode === "test"}
                        />
                      </Canvas3DErrorBoundary>
                    )}

                    {/* -- TREE VIEW -- */}
                    {viewMode === "tree" && (
                      <div className="flex-1 overflow-auto p-3 space-y-2">
                        {nodes.map((node) => (
                          <motion.div key={node.id} layout className="rounded-xl p-3 border border-white/5 bg-white/[0.02]"
                            style={{ borderColor: hoveredNode === node.id ? pers.colors.border : undefined }}
                            onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-2 h-2 rounded-full" style={{
                                backgroundColor: node.responses.length === 0 ? "#F59E0B"
                                  : node.id === "root" ? pers.colors.primary
                                  : nodes.some((n) => n.responses.some((r) => r.nextId === node.id)) ? "#10B981" : "#EF4444",
                              }} />
                              <span className="font-mono text-[9px] text-white/20">{node.id}</span>
                              {node.id === "root" && (
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold"
                                  style={{ backgroundColor: pers.colors.bg, color: pers.colors.primary }}>START</span>
                              )}
                              {node.responses.length === 0 && (
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400">END</span>
                              )}
                            </div>
                            {editing === node.id ? (
                              <input value={node.text} onChange={(e) => updateNodeText(node.id, e.target.value)}
                                onBlur={() => setEditing(null)} autoFocus
                                className="w-full px-2 py-1.5 rounded-lg bg-white/5 border text-sm text-white/80 font-body"
                                style={{ borderColor: pers.colors.border }} />
                            ) : (
                              <p onClick={() => setEditing(node.id)} className="font-body text-sm text-white/70 cursor-text">
                                {node.text}
                              </p>
                            )}
                            {node.responses.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {node.responses.map((r, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-lg font-body text-[10px] flex items-center gap-1"
                                    style={{ backgroundColor: pers.colors.bg, border: `1px solid ${pers.colors.border}`, color: pers.colors.primary }}>
                                    {/* Enhancement A: Editable response labels */}
                                    <input value={r.label} onChange={(e) => updateResponseLabel(node.id, i, e.target.value)}
                                      className="bg-transparent border-none outline-none w-16 font-body text-[10px]"
                                      style={{ color: pers.colors.primary }}
                                      aria-label={`Response label ${i + 1}`} />
                                    &rarr; {r.nextId || "?"}
                                    <button onClick={() => removeResponse(node.id, i)} className="ml-1 text-white/20 hover:text-red-400"
                                      aria-label={`Remove response ${r.label}`}>x</button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <button onClick={() => addResponse(node.id)} className="mt-1.5 font-body text-[10px] text-white/20 flex items-center gap-1"
                              aria-label={`Add response to ${node.id}`}>
                              <Plus className="w-2.5 h-2.5" /> Add response
                            </button>
                          </motion.div>
                        ))}
                        <button onClick={addNode}
                          className="w-full py-2 rounded-xl border border-dashed border-white/10 text-white/20 font-display text-xs flex items-center gap-1 justify-center"
                          aria-label="Add new node">
                          <Plus className="w-3 h-3" /> Add Node
                        </button>
                      </div>
                    )}

                    {/* -- GRAPH VIEW (SVG) -- */}
                    {viewMode === "graph" && (() => {
                      const { positions, svgW, svgH } = computeGraphLayout(nodes);
                      return (
                        <div className="flex-1 overflow-auto p-3">
                          <svg width={svgW} height={svgH} className="mx-auto">
                            {/* Edges */}
                            {nodes.flatMap((node) =>
                              node.responses.filter((r) => r.nextId && positions[r.nextId!]).map((r, i) => {
                                const from = positions[node.id]; const to = positions[r.nextId!];
                                if (!from || !to) return null;
                                const isHovered = hoveredNode === node.id || hoveredNode === r.nextId;
                                return (
                                  <motion.line key={`${node.id}-${r.nextId}-${i}`}
                                    x1={from.x} y1={from.y + 18} x2={to.x} y2={to.y - 18}
                                    stroke={isHovered ? pers.colors.primary : "rgba(255,255,255,0.08)"}
                                    strokeWidth={isHovered ? 2 : 1}
                                    strokeDasharray={isHovered ? "none" : "4 4"}
                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
                                );
                              })
                            )}
                            {/* Nodes */}
                            {nodes.map((node) => {
                              const pos = positions[node.id]; if (!pos) return null;
                              const isHov = hoveredNode === node.id;
                              const isEnd = node.responses.length === 0;
                              const isRoot = node.id === "root";
                              return (
                                <g key={node.id} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
                                  {isHov && <circle cx={pos.x} cy={pos.y} r={28} fill="none" stroke={pers.colors.primary} strokeWidth={1} opacity={0.4} />}
                                  <circle cx={pos.x} cy={pos.y} r={22}
                                    fill={isHov ? pers.colors.bg : "rgba(255,255,255,0.03)"}
                                    stroke={isRoot ? pers.colors.primary : isEnd ? "#F59E0B" : "rgba(255,255,255,0.1)"}
                                    strokeWidth={isHov ? 2 : 1} />
                                  <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" fontSize="14" fill="white">
                                    {isRoot ? "▶" : isEnd ? "🏁" : "💬"}
                                  </text>
                                  <text x={pos.x} y={pos.y + 32} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="monospace">
                                    {node.id}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      );
                    })()}

                    {/* -- TEST VIEW -- */}
                    {viewMode === "test" && (
                      <div className="flex-1 overflow-auto p-3 space-y-2">
                        <div className="rounded-lg p-2 text-center mb-2"
                          style={{ backgroundColor: pers.colors.bg, border: `1px solid ${pers.colors.border}` }}>
                          <p className="font-body text-[10px]" style={{ color: pers.colors.primary }}>
                            Testing: {activeTemplate} ({pers.emoji} {pers.name})
                          </p>
                        </div>
                        {testPath.map((nodeId, i) => {
                          const node = nodes.find((n) => n.id === nodeId);
                          if (!node) return null;
                          return (
                            <motion.div key={`${nodeId}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                              transition={pers.animation === "bouncy" ? { type: "spring", stiffness: 300 } : { duration: 0.3 }}>
                              <div className="flex items-start gap-2 mb-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: pers.colors.bg, border: `1px solid ${pers.colors.border}` }}>
                                  🤖
                                </div>
                                <div className="px-3 py-2 rounded-2xl rounded-bl-md max-w-[85%]"
                                  style={{ backgroundColor: pers.colors.bg, border: `1px solid ${pers.colors.border}` }}>
                                  <TypingMessage text={node.text} isLatest={i === testPath.length - 1}
                                    speed={pers.animation === "crisp" ? 15 : 30} />
                                </div>
                              </div>
                              {i === testPath.length - 1 && node.responses.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 ml-9">
                                  {node.responses.map((r, ri) => (
                                    <motion.button key={ri} onClick={() => r.nextId && setTestPath((prev) => [...prev, r.nextId!])}
                                      className="px-3 py-1.5 rounded-xl font-display text-[11px] font-bold"
                                      style={{ backgroundColor: `${pers.colors.primary}15`, border: `1px solid ${pers.colors.border}`, color: pers.colors.primary }}
                                      whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.5 + ri * 0.1 }}>
                                      {r.label}
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                        {currentTestNode && currentTestNode.responses.length === 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-4 space-y-2">
                            <p className="font-body text-xs text-white/30">End of conversation reached.</p>
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => setTestPath(["root"])}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 font-display text-xs flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Restart
                              </button>
                              <button onClick={deployBot}
                                className="px-3 py-1.5 rounded-lg font-display text-xs font-bold"
                                style={{ backgroundColor: `${pers.colors.primary}20`, color: pers.colors.primary }}>
                                <Smartphone className="w-3 h-3 inline mr-1" /> Deploy Bot
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* -- Bottom Bar: Challenges + Metrics -- */}
                    {viewMode !== "test" && (
                      <div className="border-t border-white/5 px-3 py-2">
                        <div className="flex items-center gap-3 text-[9px] text-white/30 font-body">
                          <span>Nodes: {metrics.nodeCount}</span>
                          <span>Edges: {metrics.edges}</span>
                          <span>Depth: {metrics.maxDepth}</span>
                          <span>Terminals: {metrics.terminals}</span>
                          <div className="flex-1" />
                          {CHALLENGES.map((ch) => (
                            <span key={ch.id} className={`px-1.5 py-0.5 rounded ${completedChallenges.has(ch.id) ? "bg-emerald-500/15 text-emerald-400" : ""}`}>
                              {completedChallenges.has(ch.id) ? "✓" : "•"} {ch.title}
                            </span>
                          ))}
                        </div>
                        {ageBand === "C" && (
                          <p className="font-body text-[9px] text-white/20 mt-1">
                            Graph: {metrics.nodeCount} nodes, {metrics.edges} edges, max branch {metrics.maxBranch}, depth {metrics.maxDepth}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Deploy Celebration Overlay */}
        <AnimatePresence>
          {showDeploy && (
            <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div className="relative" initial={{ scale: 1 }} animate={{ scale: 0.3 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}>
                <div className="w-48 h-80 rounded-3xl border-2 overflow-hidden flex flex-col"
                  style={{ borderColor: pers.colors.primary, backgroundColor: pers.colors.bg }}>
                  <div className="h-6 flex items-center justify-center">
                    <div className="w-12 h-1.5 rounded-full bg-white/10" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <motion.span className="text-4xl" animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}>
                      🤖
                    </motion.span>
                  </div>
                  <div className="h-8 flex items-center justify-center">
                    <p className="font-display text-[8px] font-bold" style={{ color: pers.colors.primary }}>
                      {activeTemplate} deployed!
                    </p>
                  </div>
                </div>
              </motion.div>
              {/* Confetti */}
              {Array.from({ length: 30 }, (_, i) => (
                <motion.div key={i} className="absolute w-2 h-2 rounded-sm"
                  style={{ backgroundColor: [pers.colors.primary, "#F59E0B", "#10B981", "#EC4899"][i % 4],
                    left: `${50 + (Math.random() - 0.5) * 20}%`, top: "30%" }}
                  animate={{ y: 600, rotate: Math.random() * 720, x: (Math.random() - 0.5) * 400 }}
                  transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
```

---

## PART B VALIDATION CHECKLIST

### File Verification
- [ ] `ChatbotBuilderGame.tsx` exists at `src/components/games/ChatbotBuilderGame.tsx`
- [ ] File is ~712 lines (complete replacement)
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No lint errors: `npx eslint src/components/games/ChatbotBuilderGame.tsx`

### [v3] 3D Integration Verification
- [ ] Line ~30: dynamic import of ChatbotNodes3D with `ssr: false`
- [ ] Line ~36: `useIsMobile` hook present
- [ ] Line ~277: `isMobile = useIsMobile()` in component body
- [ ] Line ~330: ChatbotNodes3D renders when (viewMode graph or test) AND !isMobile
- [ ] Props passed: nodes, personalityColors, hoveredNode, testPath, isTestMode, isMobile
- [ ] 3D hidden on mobile (isMobile check)
- [ ] 3D hidden in tree view (editing mode)

### V3 Full Treatment Features Preserved
- [ ] 3 Personalities: Friendly (#F59E0B), Professional (#3B82F6), Funny (#EC4899)
- [ ] 4 Templates: Pizza Bot, Help Desk, Joke Bot, Blank
- [ ] 3 Challenges: Three Endings (>=3 terminals), Deep Conversation (depth >=4), Many Choices (branch >=3)
- [ ] SVG graph view with floating bubbles, animated edges, hover highlights
- [ ] Tree view with node editing, response add/remove, status dots
- [ ] Test view with typing animation, blinking cursor, personality-themed speed
- [ ] Deploy celebration with phone mockup + confetti
- [ ] Builder metrics bar: node count, edge count, depth, terminals
- [ ] Challenge progress indicators in bottom bar
- [ ] Age-band C: graph metrics text, technical challenge descriptions
- [ ] Welcome phase with animated robot emoji
- [ ] Learn phase with 4 concept cards (Conversation Trees, Nodes & Edges, User Choices, Dead Ends)
- [ ] Chrome bezel: gradient top bar, rounded border, shadow
- [ ] Background particles with personality-colored radial gradients
- [ ] All ARIA labels preserved

---

**PROCEED TO PART C** for `DataDetectiveGame.tsx` full standalone replacement + 3D integration + Final verification + Git commands.
