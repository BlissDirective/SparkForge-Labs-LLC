// ════════════════════════════════════════════════════════════════════════
// CAREER EXPLORER v3 — Lab 9 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Explore AI careers! Match skills to job roles.
// Drag-drop: match skills, tools, and personality traits to AI careers.
// 10 levels covering different career paths in AI.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import DragDropLevelRenderer from '@/components/games/shared/DragDropLevelRenderer';
import type { DragItem, DropZone } from '@/components/games/shared/DragDropLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Data Scientist', description: 'The detective of data!', emoji: '🔢', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'ML Engineer', description: 'Build the AI brain!', emoji: '🧠', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'AI Ethics Officer', description: 'Keep AI fair and safe!', emoji: '⚖️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Computer Vision Expert', description: 'Teach computers to see!', emoji: '👁️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'NLP Engineer', description: 'Make computers understand language!', emoji: '🗣️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Robotics Engineer', description: 'Build smart robots!', emoji: '🤖', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'AI Research Scientist', description: 'Invent the future of AI!', emoji: '🔬', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'AI Product Manager', description: 'Bridge tech and business!', emoji: '📊', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'AI Designer', description: 'Design AI that people love!', emoji: '🎨', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Career Master', description: 'Know every AI career path!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

const ZONES: DropZone[] = [
  { id: 'data', label: 'Data Scientist', emoji: '🔢', color: '#4F6EF7' },
  { id: 'ml', label: 'ML Engineer', emoji: '🧠', color: '#E945F5' },
  { id: 'ethics', label: 'AI Ethics', emoji: '⚖️', color: '#2ECC71' },
  { id: 'vision', label: 'Computer Vision', emoji: '👁️', color: '#FF6B35' },
];

function getItems(levelId: number): DragItem[] {
  const all: DragItem[] = [
    { id: 's1', label: 'Statistics & Probability', emoji: '📊', category: 'data', explanation: 'Data scientists live and breathe statistics!' },
    { id: 's2', label: 'Python Programming', emoji: '🐍', category: 'ml', explanation: 'ML engineers code in Python daily.' },
    { id: 's3', label: 'Philosophy & Ethics', emoji: '🤔', category: 'ethics', explanation: 'AI ethics requires deep moral reasoning.' },
    { id: 's4', label: 'Image Processing', emoji: '🖼️', category: 'vision', explanation: 'Computer vision experts process visual data.' },
    { id: 's5', label: 'SQL & Databases', emoji: '🗄️', category: 'data', explanation: 'Data scientists query databases constantly.' },
    { id: 's6', label: 'TensorFlow/PyTorch', emoji: '🔥', category: 'ml', explanation: 'ML frameworks are essential for building models.' },
    { id: 's7', label: 'Fairness & Bias Analysis', emoji: '⚖️', category: 'ethics', explanation: 'Detecting and mitigating AI bias is key.' },
    { id: 's8', label: 'Convolutional Neural Networks', emoji: '🧠', category: 'vision', explanation: 'CNNs are the backbone of image recognition.' },
    { id: 's9', label: 'Data Visualization', emoji: '📈', category: 'data', explanation: 'Presenting insights visually is crucial.' },
    { id: 's10', label: 'Model Deployment', emoji: '🚀', category: 'ml', explanation: 'Getting models into production is the end goal.' },
    { id: 's11', label: 'Privacy Law (GDPR)', emoji: '📜', category: 'ethics', explanation: 'Understanding data privacy regulations is essential.' },
    { id: 's12', label: 'Object Detection', emoji: '🎯', category: 'vision', explanation: 'Finding objects in images is a core CV task.' },
    { id: 's13', label: 'A/B Testing', emoji: '🧪', category: 'data', explanation: 'Testing hypotheses with controlled experiments.' },
    { id: 's14', label: 'MLOps', emoji: '⚙️', category: 'ml', explanation: 'DevOps practices for machine learning pipelines.' },
    { id: 's15', label: 'Stakeholder Communication', emoji: '🗣️', category: 'ethics', explanation: 'Explaining AI decisions to non-technical people.' },
    { id: 's16', label: '3D Vision', emoji: '🧊', category: 'vision', explanation: 'Understanding depth and spatial relationships.' },
  ];

  const start = ((levelId - 1) * 4) % all.length;
  const selected = [];
  for (let i = 0; i < 8; i++) {
    selected.push(all[(start + i) % all.length]);
  }
  return selected;
}

const CONCEPTS: Record<number, string> = {
  1: 'Data Scientists find patterns in data using statistics and programming.',
  2: 'ML Engineers build and deploy machine learning models at scale.',
  3: 'AI Ethics Officers ensure AI systems are fair, transparent, and safe.',
  4: 'Computer Vision experts teach machines to understand images and video.',
  5: 'NLP Engineers work on language understanding, translation, and generation.',
  6: 'Robotics Engineers combine AI with physical hardware to create smart machines.',
  7: 'AI Research Scientists push the boundaries of what AI can do.',
  8: 'AI Product Managers connect technical teams with business goals.',
  9: 'AI Designers create user experiences that make AI accessible and delightful.',
  10: 'The AI field has roles for every skill set — technical, creative, and ethical!',
};

export default function CareerExplorerGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('career-explorer', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Career Explorer" color="#E945F5" labNum={9}>
      <GameLevelSystem gameTitle="Career Explorer" gameEmoji="💼" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <DragDropLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#E945F5" gameEmoji="💼"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            items={getItems(level.id)}
            zones={ZONES}
          />
        )}
      />
    </GameShell>
  );
}
