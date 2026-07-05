// ════════════════════════════════════════════════════════════════════════
// ROBOT VACUUM v4 — Lab 5 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Explore how a robot vacuum navigates (SLAM-themed). Adjust sensors,
// speed, battery, and cleaning pattern with sliders — a themed dial sim,
// not real navigation. Replaced Three.js with CSS grid-based room visualization.
// 10 levels from studio apartment to mansion.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Studio Apt', description: 'Clean a small studio!', emoji: '🏠', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'One Bedroom', description: 'Navigate around furniture!', emoji: '🛏️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Kitchen', description: 'Avoid chairs and table legs!', emoji: '🍳', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Living Room', description: 'Sofas, rugs, and cables!', emoji: '🛋️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Multi-Room', description: 'Clean multiple rooms!', emoji: '🚪', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Stairs', description: 'Do not fall down!', emoji: '📶', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Pets!', description: 'Avoid pet toys and food!', emoji: '🐕', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Office', description: 'Wires, chairs, and desks!', emoji: '💼', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Mansion', description: 'A huge house to clean!', emoji: '🏰', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Vacuum Master', description: 'The ultimate cleaning challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const sensor = params.sensor || 50;
    const speed = params.speed || 50;
    const battery = params.battery || 50;
    const pattern = params.pattern || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [50, 60, 40, 60], 2: [60, 50, 50, 60], 3: [70, 40, 60, 60],
      4: [70, 50, 60, 70], 5: [60, 60, 70, 70], 6: [80, 40, 80, 50],
      7: [80, 50, 60, 60], 8: [70, 60, 60, 70], 9: [60, 70, 90, 80], 10: [70, 65, 75, 75],
    };
    const t = targets[levelId] || [60, 60, 60, 60];

    const coverage = Math.max(0, 100 - Math.abs(sensor - t[0]) * 0.5 - Math.abs(pattern - t[3]) * 0.4 - Math.abs(speed - t[1]) * 0.3);
    const efficiency = Math.max(0, 100 - Math.abs(battery - t[2]) * 0.5 - Math.abs(speed - t[1]) * 0.3);
    const score = Math.round((coverage + efficiency) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        coverage: { value: Math.round(coverage), target: 80, label: 'Room Coverage', emoji: '📊' },
        efficiency: { value: Math.round(efficiency), target: 75, label: 'Battery Efficiency', emoji: '🔋' },
      },
      feedback: score >= 80 ? 'Spotless!' : score >= 60 ? 'Pretty clean!' : 'Missed some spots!',
      explanation: 'In real life, robot vacuums use SLAM (Simultaneous Localization and Mapping) to navigate. Sensors, speed, battery, and pattern all matter.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'SLAM: the robot maps the room while tracking its own position.',
  2: 'Obstacle detection uses infrared and bump sensors to avoid furniture.',
  3: 'Path planning algorithms decide the most efficient cleaning route.',
  4: 'Different floor types (carpet vs hardwood) need different suction power.',
  5: 'Multi-room cleaning requires the robot to remember multiple maps.',
  6: 'Cliff sensors detect drops (stairs) using infrared — safety first!',
  7: 'Object recognition helps vacuums avoid pet mess (and spread it around!).',
  8: 'Dynamic obstacles (moving chairs, people) require real-time replanning.',
  9: 'Battery management is crucial for large spaces — return to dock and resume!',
  10: 'The best vacuums combine mapping, obstacle avoidance, and smart path planning.',
};

export default function RobotVacuumGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('robot-vacuum', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Robot Vacuum" color="#2ECC71" labNum={5}>
      <GameLevelSystem gameTitle="Robot Vacuum" gameEmoji="🤖" labColor="#2ECC71" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#2ECC71" gameEmoji="🤖"
            description={`${level.description} Adjust the dials and see what changes.`}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'sensor', label: 'Sensor Range', emoji: '👁️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'speed', label: 'Movement Speed', emoji: '⚡', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'battery', label: 'Battery Life', emoji: '🔋', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'pattern', label: 'Cleaning Pattern', emoji: '🔄', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
