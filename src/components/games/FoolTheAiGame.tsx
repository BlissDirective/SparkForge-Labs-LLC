// ════════════════════════════════════════════════════════════════════════
// FOOL THE AI v3 — Lab 7 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Learn adversarial attacks! Trick AI with subtle changes.
// Quiz + simulation hybrid: adjust inputs to fool classifiers.
// 10 levels from simple tricks to advanced adversarial examples.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Trick the Classifier', description: 'Make a cat look like a dog to AI!', emoji: '🐱', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Invisible Changes', description: 'Tiny pixels, big confusion!', emoji: '🔬', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Stop Signs', description: 'Make AI miss a stop sign!', emoji: '🛑', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Text Tricks', description: 'Fool spam filters!', emoji: '📝', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Audio Attacks', description: 'Hidden commands in audio!', emoji: '🔊', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Physical World', description: 'Stickers that fool cameras!', emoji: '🎨', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Black Box', description: 'Fool AI without knowing its code!', emoji: '⬛', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Defenses', description: 'Protect AI from attacks!', emoji: '🛡️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Ethics', description: 'When is it OK to fool AI?', emoji: '⚖️', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Adversarial Master', description: 'Master the art of AI deception!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "An 'adversarial example' is an input designed to...", options: ["Trick an AI model into wrong predictions","Help AI learn faster","Speed up training","Clean data"], correctIndex: 0, explanation: "Adversarial examples are carefully crafted inputs that cause AI to make confident mistakes.", band: 'B' },
    { question: "You can fool an image classifier by adding...", options: ["Invisible pixel noise","Big stickers","A frame","Text captions"], correctIndex: 0, explanation: "Tiny, human-imperceptible perturbations can flip an AI's classification from 'cat' to 'dog'!", band: 'B' },
    { question: "A 'stop sign' attack on self-driving cars involves...", options: ["Stickers that make AI ignore the sign","Removing the sign","Painting over it","Making it bigger"], correctIndex: 0, explanation: "Researchers showed that specific stickers on stop signs could make Tesla's AI fail to recognize them.", band: 'C' },
    { question: "Adversarial attacks are dangerous because...", options: ["They expose AI vulnerabilities","They make AI smarter","They improve training data","They speed up inference"], correctIndex: 0, explanation: "If AI can be fooled by subtle changes, it's unreliable for critical applications like medical diagnosis or driving.", band: 'B' },
    { question: "'Black box' attacks fool AI without...", options: ["Knowing the model's internal structure","Having internet access","Using a computer","Having training data"], correctIndex: 0, explanation: "Black-box attacks only need access to the model's outputs. They gradually learn to fool it through trial and error.", band: 'C' },
    { question: "One defense against adversarial attacks is...", options: ["Adversarial training","More data","Faster computers","Bigger models"], correctIndex: 0, explanation: "Adversarial training includes adversarial examples in training data, making models more robust.", band: 'C' },
    { question: "A 'white box' attack requires...", options: ["Full knowledge of the model architecture","Physical access to the computer","The original training data","Government approval"], correctIndex: 0, explanation: "White-box attacks have full access to the model's weights and architecture, enabling precise adversarial crafting.", band: 'C' },
    { question: "Audio adversarial attacks can hide...", options: ["Voice commands in normal-sounding audio","Music in podcasts","Static noise","Silence"], correctIndex: 0, explanation: "Researchers embedded 'OK Google, call 911' into audio that sounds like static to humans but triggers voice assistants!", band: 'C' },
    { question: "Is it ethical to research adversarial attacks?", options: ["Yes — it helps make AI more robust","No — it teaches people to hack","Only in universities","Only for defense"], correctIndex: 0, explanation: "Security research (like penetration testing) finds vulnerabilities so they can be fixed before malicious use.", band: 'C' },
    { question: "The 'fast gradient sign method' (FGSM) is...", options: ["A quick way to create adversarial examples","A training optimization","A data cleaning technique","A model architecture"], correctIndex: 0, explanation: "FGSM uses the gradient of the loss function to quickly find the direction that maximally confuses the model.", band: 'C' },
    { question: "Transfer attacks work across...", options: ["Different AI models","Only identical models","Only the same dataset","Only the same computer"], correctIndex: 0, explanation: "Adversarial examples created for one model often fool different models too — this is called transferability.", band: 'C' },
    { question: "Input validation (checking inputs are reasonable) helps defend by...", options: ["Rejecting obviously modified inputs","Slowing down attackers","Encrypting data","Training the model"], correctIndex: 0, explanation: "Preprocessing can detect and remove adversarial perturbations before they reach the model.", band: 'C' },
  ];

  const perLevel = 8;
  const start = (levelId - 1) * 2;
  const levelQs: QuizQuestion[] = [];
  for (let i = 0; i < perLevel; i++) {
    const idx = (start + i) % all.length;
    levelQs.push(all[idx]);
  }
  return levelQs;
}

export default function FoolTheAiGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('fool-the-ai', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Fool the AI" color="#FF6B35" labNum={7}>
      <GameLevelSystem gameTitle="Fool the AI" gameEmoji="😈" labColor="#FF6B35" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#FF6B35" gameEmoji="😈" timePerQuestion={20} />
        )}
      />
    </GameShell>
  );
}
