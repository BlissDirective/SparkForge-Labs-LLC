// ════════════════════════════════════════════════════════════════════════
// AGENT ATELIER v4 — Lab 11 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Design AI agents with goals, tools, memory, and reasoning.
// Simulation: balance autonomy, safety, capability, efficiency.
// 10 levels from simple agents to multi-agent systems.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Hello Agent', description: 'Create your first AI agent!', emoji: '👋', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Tool User', description: 'Give your agent tools!', emoji: '🔧', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Memory Agent', description: 'Agents that remember!', emoji: '🧠', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Reasoning', description: 'Think step by step!', emoji: '🤔', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Planner', description: 'Make plans and execute!', emoji: '📋', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Multi-Agent', description: 'Multiple agents working together!', emoji: '👥', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Safety Guardrails', description: 'Keep agents safe and aligned!', emoji: '🛡️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'MCP Protocol', description: 'Connect to external tools!', emoji: '🔌', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Auto-Improvement', description: 'Agents that learn from mistakes!', emoji: '📈', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Agent Master', description: 'The ultimate agent architect!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const autonomy = params.autonomy || 50;
    const tools = params.tools || 50;
    const memory = params.memory || 50;
    const safety = params.safety || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [40, 30, 40, 80], 2: [50, 70, 50, 60], 3: [50, 50, 80, 60],
      4: [60, 60, 70, 50], 5: [70, 60, 70, 50], 6: [60, 70, 80, 40],
      7: [50, 60, 70, 90], 8: [60, 90, 60, 70], 9: [70, 70, 80, 60], 10: [70, 80, 80, 70],
    };
    const t = targets[levelId] || [60, 60, 60, 60];

    const capability = Math.max(0, 100 - Math.abs(autonomy - t[0]) * 0.5 - Math.abs(tools - t[1]) * 0.4 - Math.abs(memory - t[2]) * 0.3);
    const trust = Math.max(0, 100 - Math.abs(safety - t[3]) * 0.6 - Math.abs(autonomy - 50) * 0.3);
    const score = Math.round((capability + trust) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        capability: { value: Math.round(capability), target: 80, label: 'Capability', emoji: '💪' },
        trust: { value: Math.round(trust), target: 75, label: 'Trust Score', emoji: '✅' },
      },
      feedback: score >= 80 ? 'Outstanding agent!' : score >= 60 ? 'Functional agent!' : 'Needs more tuning!',
      explanation: 'Great AI agents balance autonomy, tool access, memory, and safety guardrails.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'An AI agent is a system that perceives its environment and takes actions to achieve goals.',
  2: 'Tool use lets agents call APIs, query databases, and interact with external systems.',
  3: 'Memory (short and long-term) lets agents learn from past interactions and improve.',
  4: 'Chain-of-thought reasoning helps agents break complex tasks into manageable steps.',
  5: 'Planning agents create action sequences before executing, like chess players thinking ahead.',
  6: 'Multi-agent systems divide work among specialized agents that collaborate.',
  7: 'Safety guardrails prevent agents from harmful actions — essential for deployment.',
  8: 'MCP (Model Context Protocol) standardizes how agents connect to external tools.',
  9: 'Self-improving agents use feedback loops to refine their strategies over time.',
  10: 'Master agent design: the right balance of power, safety, and collaboration.',
};

export default function AgentAtelierGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('agent-atelier', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Agent Atelier" color="#E945F5" labNum={11}>
      <GameLevelSystem gameTitle="Agent Atelier" gameEmoji="🤖" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#E945F5" gameEmoji="🤖"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'autonomy', label: 'Autonomy Level', emoji: '🎯', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'tools', label: 'Tool Access', emoji: '🔧', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'memory', label: 'Memory Size', emoji: '🧠', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'safety', label: 'Safety Filters', emoji: '🛡️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
