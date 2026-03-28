// ================================================================
// AGENT ARCHITECT V3-FINAL — Lab 5 Flagship (Complete Standalone)
// ================================================================
// Decision 6.4: Full 3D pipeline platform replaces 2D canvas.
// All v2 features: 10 blocks, 8 missions, cinema, pseudocode,
// block unlock, age-band differentiation.
// v2 Source: STAGE6E_Flagship_AgentArchitect.pdf (~1,300 lines)
// v3 Additions: 3D integration, mobile fallback (~200 lines)
// ================================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { useAgentAudio } from '@/hooks/useAgentAudio';
import {
  Play, RotateCcw, Zap,
  GraduationCap, Target, Award, Star,
  Settings2, Code2, CheckCircle2, Cpu,
} from 'lucide-react';

// [v3] Dynamic import for 3D pipeline (no SSR)
import dynamic from 'next/dynamic';

const AgentPipeline3D = dynamic(
  () => import('@/components/3d/AgentPipeline3D'),
  { ssr: false }
);

import { toPipelineBlocks } from '@/components/3d/AgentPipeline3D';

// ================================================================
// TYPES
// ================================================================

type Phase = 'welcome' | 'learn' | 'missions' | 'build' | 'report';

interface BlockType {
  id: string;
  label: string;
  emoji: string;
  color: string;
  outputs: number;
  category: 'core' | 'logic' | 'advanced';
  unlockAfter: number;
  description: string;
  configurable: boolean;
}

interface BlockConfig {
  text?: string;
  tool?: string;
  searchTarget?: string;
}

interface PlacedBlock {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  config: BlockConfig;
}

interface Arrow {
  fromId: string;
  toId: string;
  outputIndex: number;
}

interface Mission {
  id: string;
  title: string;
  emoji: string;
  description: string;
  requirements: string[];
  requiredBlockTypes: string[];
  minBlocks: number;
  optimalBlocks: number;
  starterBlocks?: { type: string; x: number; y: number; config?: BlockConfig }[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  bandMin: 'A' | 'B' | 'C';
}

interface RunStep {
  blockId: string;
  narration: string;
  decision?: 'yes' | 'no';
}

// ================================================================
// BLOCK TYPES — 10 total (7 base + 3 advanced)
// ================================================================

const ALL_BLOCK_TYPES: BlockType[] = [
  { id: 'goal', label: 'Goal', emoji: '\ud83c\udfaf', color: '#10B981',
    outputs: 1, category: 'core', unlockAfter: 0,
    description: 'Set the agent\'s mission objective', configurable: true },
  { id: 'search', label: 'Search', emoji: '\ud83d\udd0d', color: '#3B82F6',
    outputs: 1, category: 'core', unlockAfter: 0,
    description: 'Search for information from different sources', configurable: true },
  { id: 'done', label: 'Done', emoji: '\u2705', color: '#6B7280',
    outputs: 0, category: 'core', unlockAfter: 0,
    description: 'Mark the mission as complete', configurable: false },
  { id: 'tool', label: 'Tool', emoji: '\ud83d\udee0\ufe0f', color: '#F97316',
    outputs: 1, category: 'logic', unlockAfter: 1,
    description: 'Use a tool like calculator, translator, or code runner', configurable: true },
  { id: 'decide', label: 'Decide', emoji: '\ud83e\udd14', color: '#8B5CF6',
    outputs: 2, category: 'logic', unlockAfter: 1,
    description: 'Make a YES/NO decision based on a condition', configurable: true },
  { id: 'check', label: 'Check', emoji: '\ud83d\udd0e', color: '#06B6D4',
    outputs: 2, category: 'logic', unlockAfter: 2,
    description: 'Verify if something is correct (pass/fail)', configurable: true },
  { id: 'loop', label: 'Loop', emoji: '\ud83d\udd04', color: '#F59E0B',
    outputs: 1, category: 'logic', unlockAfter: 2,
    description: 'Repeat an action until a condition is met', configurable: true },
  { id: 'memory', label: 'Memory', emoji: '\ud83e\udde0', color: '#EC4899',
    outputs: 1, category: 'advanced', unlockAfter: 4,
    description: 'Store and recall intermediate results', configurable: true },
  { id: 'parallel', label: 'Parallel', emoji: '\u26a1', color: '#EAB308',
    outputs: 2, category: 'advanced', unlockAfter: 5,
    description: 'Run two paths simultaneously', configurable: false },
  { id: 'human', label: 'Human', emoji: '\ud83d\ude4b', color: '#F43F5E',
    outputs: 2, category: 'advanced', unlockAfter: 6,
    description: 'Ask a human for approval or input', configurable: true },
];

const TOOL_OPTIONS = [
  { id: 'calculator', label: 'Calculator', emoji: '\ud83e\uddee' },
  { id: 'translator', label: 'Translator', emoji: '\ud83c\udf0d' },
  { id: 'code-runner', label: 'Code Runner', emoji: '\ud83d\udcbb' },
  { id: 'web-scraper', label: 'Web Scraper', emoji: '\ud83d\udd77\ufe0f' },
  { id: 'emailer', label: 'Email Sender', emoji: '\ud83d\udce7' },
  { id: 'scheduler', label: 'Scheduler', emoji: '\ud83d\udcc5' },
];

const SEARCH_TARGETS = [
  { id: 'web', label: 'Web Search', emoji: '\ud83c\udf10' },
  { id: 'database', label: 'Database', emoji: '\ud83d\uddc3\ufe0f' },
  { id: 'memory', label: 'Agent Memory', emoji: '\ud83e\udde0' },
  { id: 'files', label: 'Files & Docs', emoji: '\ud83d\udcc1' },
];

// ================================================================
// MISSIONS — 8 structured scenarios
// ================================================================

const MISSIONS: Mission[] = [
  { id: 'm1', title: 'Hello Agent!', emoji: '\ud83d\udc4b',
    difficulty: 'beginner', bandMin: 'A',
    description: 'Build your first agent! Connect a Goal to a Search to Done.',
    requirements: ['Use a Goal block', 'Use a Search block', 'End with Done'],
    requiredBlockTypes: ['goal', 'search', 'done'],
    minBlocks: 3, optimalBlocks: 3,
    starterBlocks: [
      { type: 'goal', x: 140, y: 60, config: { text: 'Find today\'s weather' } },
      { type: 'done', x: 140, y: 300 },
    ] },
  { id: 'm2', title: 'Party Planner', emoji: '\ud83c\udf89',
    difficulty: 'beginner', bandMin: 'A',
    description: 'Plan a birthday party! Search for venues, pick one, and book it.',
    requirements: ['Set a party planning goal', 'Search for venues', 'Use a Tool to book'],
    requiredBlockTypes: ['goal', 'search', 'tool', 'done'],
    minBlocks: 4, optimalBlocks: 4 },
  { id: 'm3', title: 'Smart Shopper', emoji: '\ud83d\udecd\ufe0f',
    difficulty: 'beginner', bandMin: 'A',
    description: 'Build an agent that finds the best price for a product.',
    requirements: ['Search multiple stores', 'Decide if price is good enough',
      'Handle YES and NO paths'],
    requiredBlockTypes: ['goal', 'search', 'decide', 'done'],
    minBlocks: 5, optimalBlocks: 5 },
  { id: 'm4', title: 'Bug Hunter', emoji: '\ud83d\udc1b',
    difficulty: 'intermediate', bandMin: 'B',
    description: 'Create a debugging agent that finds and fixes code bugs.',
    requirements: ['Search for the bug', 'Use a Tool to fix it',
      'Check if the fix worked', 'Loop if not fixed'],
    requiredBlockTypes: ['goal', 'search', 'tool', 'check', 'loop', 'done'],
    minBlocks: 6, optimalBlocks: 7 },
  { id: 'm5', title: 'Research Assistant', emoji: '\ud83d\udcda',
    difficulty: 'intermediate', bandMin: 'B',
    description: 'Build an agent that researches a topic and writes a summary.',
    requirements: ['Search for information', 'Decide if enough info collected',
      'Use a Tool to write summary'],
    requiredBlockTypes: ['goal', 'search', 'decide', 'tool', 'done'],
    minBlocks: 5, optimalBlocks: 6 },
  { id: 'm6', title: 'Customer Support', emoji: '\ud83d\udcde',
    difficulty: 'intermediate', bandMin: 'B',
    description: 'Design a support agent that answers questions and escalates to humans when stuck.',
    requirements: ['Search knowledge base', 'Decide if answer found',
      'Escalate to human if needed'],
    requiredBlockTypes: ['goal', 'search', 'decide', 'check', 'done'],
    minBlocks: 6, optimalBlocks: 7 },
  { id: 'm7', title: 'Data Pipeline', emoji: '\ud83d\udcca',
    difficulty: 'advanced', bandMin: 'C',
    description: 'Build a data processing agent with parallel paths and memory.',
    requirements: ['Use Memory to store intermediate results',
      'Run Parallel data processing', 'Check data quality'],
    requiredBlockTypes: ['goal', 'search', 'memory', 'parallel', 'check', 'done'],
    minBlocks: 8, optimalBlocks: 9 },
  { id: 'm8', title: 'Autonomous Coder', emoji: '\ud83e\udd16',
    difficulty: 'advanced', bandMin: 'C',
    description: 'Design an AI coding agent: plan, write, test, fix, and deploy.',
    requirements: ['Plan the code (Goal)', 'Write code (Tool)',
      'Test it (Check)', 'Fix bugs (Loop)', 'Get human review'],
    requiredBlockTypes: ['goal', 'tool', 'check', 'loop', 'human', 'done'],
    minBlocks: 8, optimalBlocks: 10 },
];

// ================================================================
// LEARN CARDS
// ================================================================

const LEARN_CARDS = [
  { title: 'What is an AI Agent?', emoji: '\ud83e\udd16',
    body: 'An AI agent is a program that can make decisions and take actions on its own to complete a goal. Think of it like a smart robot helper!',
    bodyC: 'An AI agent is an autonomous system that perceives its environment, makes decisions, and takes actions to achieve objectives. Key properties: autonomy (self-directed), reactivity (responds to changes), proactivity (anticipates needs), and social ability (communicates with users and other agents).' },
  { title: 'Goal Decomposition', emoji: '\ud83c\udfaf',
    body: 'Big tasks are hard! Agents break them into small steps. "Plan a party" becomes: find venue, send invites, order cake.',
    bodyC: 'Goal decomposition (or task planning) is the process of breaking a high-level objective into executable sub-tasks. Modern LLM agents use chain-of-thought reasoning to build action plans, maintaining a stack of pending subtasks and executing them depth-first or priority-ordered.' },
  { title: 'Tool Use', emoji: '\ud83d\udee0\ufe0f',
    body: 'Agents can use tools! A search tool finds information, a calculator does math, an email tool sends messages. Each tool has a specific job.',
    bodyC: 'Tool use (or function calling) allows agents to invoke external APIs: search engines, code interpreters, databases, and other services. The agent selects which tool to call, formats the input parameters, executes the call, and interprets the structured response to continue its plan.' },
  { title: 'Decisions & Loops', emoji: '\ud83d\udd04',
    body: 'Sometimes agents need to make choices: "Is this answer good enough?" If YES, continue. If NO, try again! That\'s a loop.',
    bodyC: 'Branching (if/else) and iteration (loops) enable agents to handle non-deterministic outcomes. Error recovery loops (retry with backoff), conditional escalation (human-in-the-loop), and parallel execution (Promise.all) are patterns used in production agent systems.' },
];

// Type-safe band ordering for age-band comparisons.
// Used to filter content by difficulty: items with bandMin <= child's band are shown.
// A=0 (ages 7-9), B=1 (ages 10-12), C=2 (ages 13-16).
// Example: a mission with bandMin='B' is shown to bands B and C but not A.
const BAND_ORDER: Record<'A' | 'B' | 'C', number> = { A: 0, B: 1, C: 2 };

// Module-level counter for unique block IDs (client-only, safe with 'use client')
let blockCounter = 0;

// ================================================================
// PSEUDOCODE GENERATOR (Band C)
// ================================================================

function generatePseudocode(blocks: PlacedBlock[], arrows: Arrow[]): string {
  if (blocks.length === 0) return '// Place blocks to see code...';

  const lines: string[] = ['// Agent Pseudocode', '// Auto-generated from flowchart', ''];
  const goal = blocks.find(b => b.type.id === 'goal');
  if (!goal) return '// Add a Goal block to start';

  lines.push('function runAgent() {');
  lines.push(`  const goal = "${goal.config.text || 'Complete the mission'}";`);
  lines.push('  log("Starting: " + goal);');
  lines.push('');

  const visited = new Set<string>();

  function traverse(blockId: string, indent: number) {
    if (visited.has(blockId)) {
      lines.push(`${' '.repeat(indent)}// (loop back)`);
      return;
    }
    visited.add(blockId);

    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const pad = ' '.repeat(indent);
    const outgoing = arrows.filter(a => a.fromId === blockId);

    switch (block.type.id) {
      case 'goal':
        // Goal blocks encountered during traversal (e.g. sub-goals)
        lines.push(`${pad}setGoal("${block.config.text || 'Sub-objective'}");`);
        break;
      case 'search':
        lines.push(`${pad}const results = search("${block.config.searchTarget || 'web'}");`);
        break;
      case 'tool':
        lines.push(`${pad}const output = useTool("${block.config.tool || 'calculator'}");`);
        break;
      case 'decide': {
        lines.push(`${pad}if (${block.config.text || 'condition'}) {`);
        const yes = outgoing.find(a => a.outputIndex === 0);
        if (yes) traverse(yes.toId, indent + 2);
        const no = outgoing.find(a => a.outputIndex === 1);
        if (no) {
          lines.push(`${pad}} else {`);
          traverse(no.toId, indent + 2);
        }
        lines.push(`${pad}}`);
        return;
      }
      case 'check': {
        lines.push(`${pad}const passed = check("${block.config.text || 'result is valid'}");`);
        lines.push(`${pad}if (passed) {`);
        const pass = outgoing.find(a => a.outputIndex === 0);
        if (pass) traverse(pass.toId, indent + 2);
        const fail = outgoing.find(a => a.outputIndex === 1);
        if (fail) {
          lines.push(`${pad}} else {`);
          traverse(fail.toId, indent + 2);
        }
        lines.push(`${pad}}`);
        return;
      }
      case 'loop':
        lines.push(`${pad}while (!${block.config.text || 'done'}) {`);
        if (outgoing[0]) traverse(outgoing[0].toId, indent + 2);
        lines.push(`${pad}}`);
        return;
      case 'memory':
        lines.push(`${pad}memory.store("${block.config.text || 'data'}");`);
        break;
      case 'parallel':
        lines.push(`${pad}await Promise.all([`);
        outgoing.forEach((_, i) => {
          lines.push(`${pad}  // Path ${i + 1}`);
        });
        lines.push(`${pad}]);`);
        return;
      case 'human':
        lines.push(`${pad}const approval = await askHuman("${block.config.text || 'Please review'}");`);
        break;
      case 'done':
        lines.push(`${pad}log("\u2705 Mission complete!");`);
        lines.push(`${pad}return;`);
        return;
    }

    if (outgoing[0]) traverse(outgoing[0].toId, indent);
  }

  const goalOut = arrows.filter(a => a.fromId === goal.id);
  if (goalOut[0]) traverse(goalOut[0].toId, 2);
  lines.push('}');
  return lines.join('\n');
}

// ================================================================
// HELPERS
// ================================================================

function buildNarration(block: PlacedBlock): string {
  const name = block.config.text || block.type.label;
  switch (block.type.id) {
    case 'goal': return `\ud83c\udfaf Setting goal: "${name}"`;
    case 'search': return `\ud83d\udd0d Searching ${block.config.searchTarget || 'the web'}...`;
    case 'tool': return `\ud83d\udee0\ufe0f Using ${block.config.tool || 'a tool'}...`;
    case 'decide': return `\ud83e\udd14 Deciding: ${name}?`;
    case 'check': return `\ud83d\udd0e Checking: ${name}...`;
    case 'loop': return `\ud83d\udd04 Looping: ${name}`;
    case 'memory': return `\ud83e\udde0 Storing to memory: ${name}`;
    case 'parallel': return `\u26a1 Running parallel paths...`;
    case 'human': return `\ud83d\ude4b Asking human: "${name}"`;
    case 'done': return `\u2705 Mission complete!`;
    default: return `Processing: ${name}`;
  }
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function AgentArchitectGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  // Core state
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  // Canvas state
  const [blocks, setBlocks] = useState<PlacedBlock[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [connecting, setConnecting] = useState<{ id: string; idx: number } | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [runSteps, setRunSteps] = useState<RunStep[]>([]);
  const [activeRunBlock, setActiveRunBlock] = useState<string | null>(null);
  const [runPath, setRunPath] = useState<string[]>([]);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [_spotlightPos, setSpotlightPos] = useState<{ x: number; y: number } | null>(null);

  // Report state
  const [reportData, setReportData] = useState<{
    stars: number; pathLen: number; efficiency: string; tips: string[];
  } | null>(null);

  // S6-CRIT-002: Register 3D scene content with sceneStore (D3D-B1)
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  useEffect(() => {
    if (phase === 'build' || phase === 'report') {
      setGameSceneContent(
        <AgentPipeline3D
          blocks={toPipelineBlocks(blocks)}
          connections={arrows.map((a) => ({
            fromId: a.from,
            toId: a.to,
            outputIndex: a.outputIdx,
          }))}
          activeBlockId={activeRunBlock}
          runPath={runPath}
          isRunning={isRunning}
          onBlockClick={(id) => setSelectedBlock(id)}
          onPlatformClick={() => {}}
        />
      );
    }
    return () => setGameSceneContent(null);
  }, [phase, blocks, arrows, activeRunBlock, runPath, isRunning, setGameSceneContent]);

  // P1: Cockpit broadcast integration
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  // P2: Audio integration
  const agentAudio = useAgentAudio();
  const [soundEnabled, setSoundEnabled] = useState(false);
  // P4: CeremonyFX milestones
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);

  // Particles
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 1, delay: Math.random() * 4,
      duration: Math.random() * 6 + 4,
    })), []);

  // Derived
  const mission = activeMissionId ? MISSIONS.find(m => m.id === activeMissionId) : null;

  const unlockedBlocks = useMemo(() => {
    const completed = completedMissions.length;
    return ALL_BLOCK_TYPES.filter(bt =>
      bt.unlockAfter <= completed &&
      BAND_ORDER[ageBand] >= (bt.category === 'advanced' ? 2 : 0)
    );
  }, [completedMissions, ageBand]);

  const availableMissions = useMemo(() =>
    MISSIONS.filter(m => BAND_ORDER[m.bandMin] <= BAND_ORDER[ageBand]),
    [ageBand]);

  const pseudocode = useMemo(() =>
    ageBand === 'C' ? generatePseudocode(blocks, arrows) : '',
    [blocks, arrows, ageBand]);

  // [v3] Convert blocks for 3D pipeline
  const pipelineBlocks = useMemo(() => toPipelineBlocks(blocks), [blocks]);
  const pipelineConnections = useMemo(() =>
    arrows.map(a => ({ fromId: a.fromId, toId: a.toId, outputIndex: a.outputIndex })),
    [arrows]);

  // ================================================================
  // HANDLERS
  // ================================================================

  function startMission(missionId: string) {
    const m = MISSIONS.find(mi => mi.id === missionId);
    if (!m) return;
    setActiveMissionId(missionId);
    setBlocks([]); setArrows([]); setRunPath([]); setRunSteps([]);
    setReportData(null); setSelectedBlock(null);

    if (m.starterBlocks) {
      const starters: PlacedBlock[] = m.starterBlocks.map(sb => {
        const type = ALL_BLOCK_TYPES.find(t => t.id === sb.type)!;
        return {
          id: `blk-${++blockCounter}`, type, x: sb.x, y: sb.y,
          config: sb.config || {},
        };
      });
      setBlocks(starters);
    }
    setPhase('build');
  }

  function addBlock(type: BlockType) {
    if (isRunning) return;
    const id = `blk-${++blockCounter}`;
    const xBase = 120 + (blocks.length % 3) * 170;
    const yBase = 60 + Math.floor(blocks.length / 3) * 110;
    setBlocks(prev => [...prev, { id, type, x: xBase, y: yBase, config: {} }]);
    game.updateScore(1);
    if (soundEnabled) agentAudio.playPlaceBlock();
    broadcast({ type: 'button-press', source: 'agent-architect', value: 1, color: '#10B981' });
  }

  function _removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id));
    setArrows(prev => prev.filter(a => a.fromId !== id && a.toId !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  }

  function updateBlockConfig(id: string, config: Partial<BlockConfig>) {
    setBlocks(prev => prev.map(b =>
      b.id === id ? { ...b, config: { ...b.config, ...config } } : b
    ));
  }

  function _handleOutputClick(blockId: string, outputIdx: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (isRunning) return;
    setConnecting({ id: blockId, idx: outputIdx });
  }

  function handleBlockClick(blockId: string) {
    if (isRunning) return;
    if (connecting && connecting.id !== blockId) {
      const dup = arrows.some(a =>
        a.fromId === connecting.id && a.toId === blockId && a.outputIndex === connecting.idx);
      if (!dup) {
        setArrows(prev => [...prev, {
          fromId: connecting.id, toId: blockId, outputIndex: connecting.idx,
        }]);
      }
      setConnecting(null);
    } else {
      setSelectedBlock(selectedBlock === blockId ? null : blockId);
      setConnecting(null);
    }
  }

  function getBlockCenter(id: string) {
    const b = blocks.find(bl => bl.id === id);
    return b ? { x: b.x + 65, y: b.y + 35 } : { x: 0, y: 0 };
  }

  // [v3] 3D platform click (reserved for future click-to-place)
  function handle3DPlatformClick(_gridX: number, _gridZ: number) {
    if (isRunning || !mission) return;
    // Future: map grid coordinates to block placement
  }

  // Validation
  function validate(): string | null {
    if (!blocks.some(b => b.type.id === 'goal')) return 'Your agent needs a Goal! \ud83c\udfaf';
    if (!blocks.some(b => b.type.id === 'done')) return 'Add a Done block to finish! \u2705';
    if (blocks.length < 3) return 'Add more blocks for a complete plan!';

    const connected = new Set<string>();
    arrows.forEach(a => { connected.add(a.fromId); connected.add(a.toId); });
    const unconnected = blocks.filter(b => !connected.has(b.id));
    if (unconnected.length > 0)
      return `Connect all blocks! "${unconnected[0].type.label}" is floating alone.`;

    if (mission) {
      for (const req of mission.requiredBlockTypes) {
        if (!blocks.some(b => b.type.id === req))
          return `This mission requires a ${ALL_BLOCK_TYPES.find(t => t.id === req)?.label || req} block!`;
      }
    }
    return null;
  }

  // Run Agent (Cinema Mode)
  async function runAgent() {
    const err = validate();
    if (err) {
      setValidationMsg(err);
      setTimeout(() => setValidationMsg(null), 3000);
      return;
    }

    setIsRunning(true);
    setRunPath([]);
    setRunSteps([]);
    if (soundEnabled) agentAudio.playRunStart();
    broadcast({ type: 'button-press', source: 'agent-architect', value: 1, color: '#10B981', label: 'Pipeline Run' });

    const goal = blocks.find(b => b.type.id === 'goal')!;
    const path: string[] = [goal.id];
    const steps: RunStep[] = [];
    let current = goal.id;
    const visited = new Set<string>();

    for (let step = 0; step < 20; step++) {
      const block = blocks.find(b => b.id === current)!;
      const center = getBlockCenter(current);
      setSpotlightPos(center);
      setActiveRunBlock(current);
      setRunPath([...path]);

      const narration = buildNarration(block);
      steps.push({ blockId: current, narration });
      setRunSteps([...steps]);

      await new Promise(r => setTimeout(r, 1800));

      visited.add(current);
      const outgoing = arrows.filter(a => a.fromId === current);
      if (outgoing.length === 0 || block.type.id === 'done') break;

      let next: Arrow;
      if (block.type.outputs === 2 && outgoing.length >= 2) {
        const pick = Math.random() > 0.5 ? 0 : 1;
        next = outgoing.find(a => a.outputIndex === pick) || outgoing[0];
        steps[steps.length - 1].decision = pick === 0 ? 'yes' : 'no';
        setRunSteps([...steps]);
      } else {
        next = outgoing[0];
      }

      current = next.toId;
      path.push(current);
      if (visited.has(current) && visited.size > blocks.length + 3) break;
    }

    setActiveRunBlock(current);
    setRunPath([...path]);
    await new Promise(r => setTimeout(r, 1200));

    // Report calculation
    const pathLen = path.length;
    const optimal = mission?.optimalBlocks || blocks.length;
    const efficiency = pathLen <= optimal ? 'Excellent'
      : pathLen <= optimal + 2 ? 'Good' : 'Needs Optimization';

    const meetsReqs = mission
      ? mission.requiredBlockTypes.every(rt => blocks.some(b => b.type.id === rt))
      : true;

    const stars = (pathLen <= optimal ? 1 : 0)
      + (meetsReqs ? 1 : 0)
      + (blocks.length <= (mission?.minBlocks || blocks.length) + 2 ? 1 : 0);

    const tips: string[] = [];
    if (pathLen > optimal + 2)
      tips.push('Try using fewer blocks for a more efficient path');
    if (!blocks.some(b => b.type.id === 'check'))
      tips.push('Adding a Check block makes your agent more reliable');
    if (blocks.filter(b => b.type.id === 'decide').length === 0
      && mission && mission.difficulty !== 'beginner')
      tips.push('Decide blocks help your agent handle different outcomes');

    setReportData({ stars, pathLen, efficiency, tips });
    game.updateScore(10 + stars * 5);
    if (soundEnabled) agentAudio.playMissionComplete(stars);
    triggerCelebration(stars >= 3 ? 'streak' : 'confetti');
    broadcast({ type: 'celebration-start', source: 'agent-architect', value: stars, color: '#10B981' });
    broadcast({ type: 'dial-rotate', source: 'agent-architect', value: stars / 3, color: '#10B981' });

    if (mission && !completedMissions.includes(mission.id))
      setCompletedMissions(prev => [...prev, mission.id]);

    game.completeGame();
    setIsRunning(false);
    setSpotlightPos(null);
    setTimeout(() => setPhase('report'), 1500);
  }

  function resetCanvas() {
    setBlocks([]); setArrows([]); setConnecting(null);
    setRunPath([]); setRunSteps([]); setActiveRunBlock(null);
    setSelectedBlock(null); setReportData(null);
    if (mission?.starterBlocks) startMission(mission.id);
  }

  const selectedBlockData = selectedBlock ? blocks.find(b => b.id === selectedBlock) : null;

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <GameShell gameId="agent-architect" title="Agent Architect"
      worldNumber={5} worldColor="#10B981" totalRounds={8}>
      <div className="h-full flex flex-col relative overflow-hidden">

        {/* Particle Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-emerald-900/8 via-transparent to-transparent" />
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(16,185,129,${0.15 + p.size * 0.06}) 0%, transparent 70%)`,
              }}
              animate={{ y: [0, -12 - p.size * 4, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Chrome Bezel */}
        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(16,185,129,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(16,185,129,0.1)',
            }}>

            {/* Top LED rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto">
              <AnimatePresence mode="wait">

                {/* ======== WELCOME PHASE ======== */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-5">

                    <motion.div
                      animate={{ boxShadow: ['0 0 20px rgba(16,185,129,0.15)', '0 0 40px rgba(16,185,129,0.3)', '0 0 20px rgba(16,185,129,0.15)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20"
                      style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' }}>
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span className="font-data text-data-sm text-emerald-400 uppercase tracking-widest">Lab 5</span>
                    </motion.div>

                    <span className="text-6xl">{'\ud83e\udd16'}</span>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Agent Architect</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Design AI agents that think, decide, and act! Build flowcharts,
                      configure tools, and watch your agent execute its mission.
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Goal Decomposition', 'Tool Use', 'Decision Trees', 'Loops'].map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-body text-2xs text-emerald-400">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-sm py-3.5 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Enter the Lab">
                      Enter the Lab <Cpu className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ======== LEARN PHASE ======== */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 space-y-5">

                    <GraduationCap className="w-6 h-6 text-emerald-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">How AI Agents Work</h3>
                    <p className="font-body text-xs text-white/40">{learnIdx + 1} of {LEARN_CARDS.length}</p>

                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-emerald-500/20"
                        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.01))' }}>
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-emerald-300 mt-3">{LEARN_CARDS[learnIdx].title}</h4>
                        <p className="font-body text-sm text-white/60 mt-2 leading-relaxed">
                          {ageBand === 'C' ? LEARN_CARDS[learnIdx].bodyC : LEARN_CARDS[learnIdx].body}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <motion.button onClick={() => {
                      if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx(learnIdx + 1);
                      else setPhase('missions');
                    }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next \u2192' : 'Choose a Mission! \ud83d\ude80'}
                    </motion.button>

                    <button onClick={() => setPhase('missions')}
                      className="font-body text-xs text-white/20 hover:text-white/40">
                      Skip to missions
                    </button>
                  </motion.div>
                )}

                {/* ======== MISSIONS PHASE ======== */}
                {phase === 'missions' && (
                  <motion.div key="missions" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="p-4 md:p-6 space-y-4">

                    <div className="text-center">
                      <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <h3 className="font-display text-lg font-bold text-white">Choose Your Mission</h3>
                      <p className="font-body text-xs text-white/40">
                        {completedMissions.length} of {availableMissions.length} completed
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {availableMissions.map(m => {
                        const isComplete = completedMissions.includes(m.id);
                        const isLocked = m.difficulty === 'advanced' && completedMissions.length < 4;
                        return (
                          <motion.button key={m.id} onClick={() => !isLocked && startMission(m.id)}
                            disabled={isLocked}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              isComplete ? 'border-emerald-500/30 bg-emerald-500/5'
                              : isLocked ? 'border-white/5 bg-white/[0.01] opacity-40'
                              : 'border-white/10 bg-white/[0.02] hover:border-emerald-500/20'
                            }`}
                            whileHover={!isLocked ? { y: -2 } : {}}
                            whileTap={!isLocked ? { scale: 0.98 } : {}}>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{m.emoji}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-sm font-bold text-white">{m.title}</p>
                                  {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                  {isLocked && (
                                    <span className="text-2xs text-white/20">
                                      {'\ud83d\udd12'} Complete 4 missions
                                    </span>
                                  )}
                                </div>
                                <p className="font-body text-xs text-white/40 mt-0.5">{m.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                                m.difficulty === 'beginner' ? 'bg-emerald-500/10 text-emerald-400'
                                : m.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-red-500/10 text-red-400'
                              }`}>
                                {m.difficulty}
                              </span>
                              <span className="font-body text-2xs text-white/20">
                                {m.requirements.length} requirements
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ======== BUILD PHASE ======== */}
                {phase === 'build' && (
                  <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }} className="flex-1 flex flex-col">

                    {/* Mission header */}
                    {mission && (
                      <div className="px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/10 flex items-center gap-2">
                        <span className="text-lg">{mission.emoji}</span>
                        <div className="flex-1">
                          <span className="font-display text-xs font-bold text-emerald-400">{mission.title}</span>
                          <span className="font-body text-2xs text-white/30 ml-2">{mission.description}</span>
                        </div>
                        <button onClick={() => setPhase('missions')}
                          className="font-body text-2xs text-white/20 hover:text-white/40">
                          Back
                        </button>
                      </div>
                    )}

                    {/* Block palette */}
                    <div className="px-3 py-2 border-b border-white/5 flex items-center gap-1.5 flex-wrap">
                      {unlockedBlocks.map(type => (
                        <motion.button key={type.id} onClick={() => addBlock(type)} disabled={isRunning}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors disabled:opacity-30"
                          whileTap={{ scale: 0.95 }}
                          style={{ borderColor: `${type.color}20` }}
                          aria-label={`Add ${type.label} block`}>
                          <span className="text-sm">{type.emoji}</span>
                          <span className="font-body text-xs text-white/60">{type.label}</span>
                        </motion.button>
                      ))}

                      <div className="flex-1" />

                      {ageBand === 'C' && (
                        <button onClick={() => setShowCode(!showCode)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-body text-xs ${
                            showCode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'
                          }`}
                          aria-label="Toggle pseudocode view">
                          <Code2 className="w-3 h-3" /> Code
                        </button>
                      )}

                      <motion.button onClick={runAgent} disabled={isRunning || blocks.length < 2}
                        className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-white font-display text-xs font-bold disabled:opacity-30"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                        <Play className="w-3.5 h-3.5" /> Run
                      </motion.button>

                      <button onClick={resetCanvas}
                        className="text-white/20 hover:text-white/40 p-1.5"
                        aria-label="Reset canvas">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Validation / connection mode */}
                    <AnimatePresence>
                      {validationMsg && (
                        <motion.div
                          className="mx-4 mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}>
                          <span className="font-body text-xs text-amber-400">{validationMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {connecting && (
                      <div className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <span className="font-body text-xs text-blue-400">
                          Click a block to connect...{' '}
                          <button onClick={() => setConnecting(null)}
                            className="ml-2 text-white/30 hover:text-white/50">
                            Cancel
                          </button>
                        </span>
                      </div>
                    )}

                    {/* Main workspace */}
                    <div className="flex-1 flex min-h-0">

                      {/* 3D Pipeline */}
                        <div className="flex-1 relative mx-3 my-2 rounded-xl overflow-hidden"
                          style={{ minHeight: '300px' }}>
                          <AgentPipeline3D
                            blocks={pipelineBlocks}
                            connections={pipelineConnections}
                            activeBlockId={activeRunBlock}
                            runPath={runPath}
                            isRunning={isRunning}
                            onBlockClick={handleBlockClick}
                            onPlatformClick={handle3DPlatformClick}
                          />
                          {blocks.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <div className="text-center">
                                <span className="text-4xl block mb-2">{'\ud83d\udce6'}</span>
                                <p className="font-body text-sm text-white/25">
                                  Click blocks from the palette to build your agent
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                      {/* Code Panel (Band C) */}
                      {showCode && ageBand === 'C' && (
                        <motion.div initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 280, opacity: 1 }}
                          className="border-l border-white/5 overflow-y-auto">
                          <div className="p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Code2 className="w-3 h-3 text-emerald-400" />
                              <span className="font-display text-xs font-bold text-emerald-400">Pseudocode</span>
                            </div>
                            <pre className="font-mono text-2xs text-white/50 leading-relaxed whitespace-pre-wrap">
                              {pseudocode}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Block Config Panel */}
                    <AnimatePresence>
                      {selectedBlockData && selectedBlockData.type.configurable && !isRunning && (
                        <motion.div initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mx-3 mb-2 overflow-hidden">
                          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Settings2 className="w-3.5 h-3.5 text-white/40" />
                              <span className="font-display text-xs font-bold text-white">
                                Configure {selectedBlockData.type.label}
                              </span>
                            </div>

                            {/* Text input: Goal, Decide, Check, Loop, Memory, Human */}
                            {['goal', 'decide', 'check', 'loop', 'memory', 'human'].includes(selectedBlockData.type.id) && (
                              <input type="text"
                                value={selectedBlockData.config.text || ''}
                                onChange={e => updateBlockConfig(selectedBlockData.id, { text: e.target.value })}
                                placeholder={
                                  selectedBlockData.type.id === 'goal' ? "What is the agent's mission?" :
                                  selectedBlockData.type.id === 'decide' ? 'What condition to check?' :
                                  selectedBlockData.type.id === 'check' ? 'What to verify?' :
                                  selectedBlockData.type.id === 'loop' ? 'Loop until...' :
                                  selectedBlockData.type.id === 'memory' ? 'What to remember?' :
                                  'What to ask the human?'
                                }
                                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 font-body text-xs focus:outline-none focus:border-emerald-500/30"
                                aria-label="Block configuration text" />
                            )}

                            {/* Tool selector */}
                            {selectedBlockData.type.id === 'tool' && (
                              <div className="flex flex-wrap gap-1.5">
                                {TOOL_OPTIONS.map(tool => (
                                  <button key={tool.id}
                                    onClick={() => updateBlockConfig(selectedBlockData.id, { tool: tool.id })}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                                      selectedBlockData.config.tool === tool.id
                                        ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                                        : 'border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/5'
                                    }`}>
                                    {tool.emoji} {tool.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Search target selector */}
                            {selectedBlockData.type.id === 'search' && (
                              <div className="flex flex-wrap gap-1.5">
                                {SEARCH_TARGETS.map(target => (
                                  <button key={target.id}
                                    onClick={() => updateBlockConfig(selectedBlockData.id, { searchTarget: target.id })}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                                      selectedBlockData.config.searchTarget === target.id
                                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                        : 'border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/5'
                                    }`}>
                                    {target.emoji} {target.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Narration bar (during execution) */}
                    {isRunning && runSteps.length > 0 && (
                      <div className="mx-3 mb-2 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span className="font-body text-xs text-emerald-300">
                            {runSteps[runSteps.length - 1].narration}
                          </span>
                          {runSteps[runSteps.length - 1].decision && (
                            <span className={`ml-auto px-1.5 py-0.5 rounded text-2xs font-bold ${
                              runSteps[runSteps.length - 1].decision === 'yes'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {runSteps[runSteps.length - 1].decision?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Emoji trail */}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {runSteps.map((step, i) => {
                            const b = blocks.find(bl => bl.id === step.blockId);
                            return b ? (
                              <span key={i} className="text-xs opacity-60">{b.type.emoji}</span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ======== REPORT PHASE ======== */}
                {phase === 'report' && reportData && (
                  <motion.div key="report" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">

                    <Award className="w-8 h-8 text-emerald-400" />
                    <h3 className="font-display text-xl font-bold text-white">Mission Report</h3>
                    {mission && (
                      <p className="font-body text-xs text-white/40">{mission.emoji} {mission.title}</p>
                    )}

                    {/* Stars */}
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <Star key={i} className={`w-8 h-8 ${
                          i <= reportData.stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/10'
                        }`} />
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="font-display text-2xl font-bold text-emerald-400">{reportData.pathLen}</p>
                        <p className="font-body text-2xs text-white/30">Steps</p>
                      </div>
                      <div>
                        <p className="font-display text-2xl font-bold text-emerald-400">{blocks.length}</p>
                        <p className="font-body text-2xs text-white/30">Blocks</p>
                      </div>
                      <div>
                        <p className={`font-display text-sm font-bold ${
                          reportData.efficiency === 'Excellent' ? 'text-emerald-400'
                          : reportData.efficiency === 'Good' ? 'text-amber-400'
                          : 'text-red-400'
                        }`}>
                          {reportData.efficiency}
                        </p>
                        <p className="font-body text-2xs text-white/30">Efficiency</p>
                      </div>
                    </div>

                    {/* Mission log */}
                    <div className="max-w-sm w-full space-y-1.5 max-h-36 overflow-y-auto">
                      {runSteps.map((step, i) => {
                        const b = blocks.find(bl => bl.id === step.blockId);
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02]">
                            <span className="text-xs">{b?.type.emoji}</span>
                            <span className="font-body text-2xs text-white/40 flex-1">{step.narration}</span>
                            {step.decision && (
                              <span className={`text-2xs font-bold ${
                                step.decision === 'yes' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {step.decision.toUpperCase()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tips */}
                    {reportData.tips.length > 0 && (
                      <div className="max-w-sm w-full rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
                        <p className="font-display text-xs font-bold text-amber-400">{'\ud83d\udca1'} Tips</p>
                        {reportData.tips.map((tip, i) => (
                          <p key={i} className="font-body text-2xs text-white/40">{'\u2022'} {tip}</p>
                        ))}
                      </div>
                    )}

                    {/* Block unlock notifications */}
                    {completedMissions.length > 0 && (() => {
                      const newUnlocks = ALL_BLOCK_TYPES.filter(
                        bt => bt.unlockAfter === completedMissions.length
                      );
                      if (newUnlocks.length === 0) return null;
                      return (
                        <motion.div initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl p-3 border border-amber-500/20 max-w-sm w-full"
                          style={{ background: 'rgba(245,158,11,0.03)' }}>
                          <p className="font-display text-xs font-bold text-amber-400">
                            {'\ud83d\udd13'} New Blocks Unlocked!
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newUnlocks.map(bt => (
                              <span key={bt.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/60">
                                {bt.emoji} {bt.label}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => {
                          setPhase('build');
                          setReportData(null);
                          setRunPath([]);
                          setRunSteps([]);
                          setActiveRunBlock(null);
                        }}
                        className="px-6 py-2.5 rounded-xl border border-emerald-500/20 font-display text-xs font-bold text-emerald-400"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Improve Agent
                      </motion.button>
                      <motion.button onClick={() => setPhase('missions')}
                        className="px-6 py-2.5 rounded-xl font-display text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Next Mission
                      </motion.button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Bottom LED rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
