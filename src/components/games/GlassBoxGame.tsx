// ════════════════════════════════════════════════════════════════════════
// GLASS BOX v4 — Lab 11 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Learn AI interpretability. Quiz format.
// 10 levels from basic explainability to advanced XAI.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Black Box', description: 'Why is AI a black box?', emoji: '⬛', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Feature Importance', description: 'Which features matter most?', emoji: '⭐', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Attention Maps', description: 'See what transformers focus on!', emoji: '👁️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'LIME', description: 'Local Interpretable Model Explanations!', emoji: '🍋', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'SHAP', description: 'Shapley values for AI!', emoji: '🎲', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Grad-CAM', description: 'Visualize CNN decisions!', emoji: '🔥', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Counterfactuals', description: 'What if things were different?', emoji: '🔄', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Probing', description: 'What do models know?', emoji: '🔍', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Mechanistic', description: 'Reverse-engineer neural nets!', emoji: '⚙️', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'XAI Master', description: 'Master interpretability!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "A 'black box' AI model is one that...", options: ["Makes decisions we cannot easily understand","Is painted black","Works at night","Is broken"], correctIndex: 0, explanation: "Black box models produce outputs from inputs, but their internal reasoning is opaque to humans.", band: 'B' },
    { question: "'Interpretability' in AI means...", options: ["Understanding how the model makes decisions","Making the model faster","Reducing model size","Improving accuracy"], correctIndex: 0, explanation: "Interpretability (or explainability) is the degree to which humans can understand a model's decision process.", band: 'B' },
    { question: "Feature importance tells us...", options: ["Which input features most influence the output","How many features exist","The size of the model","The training time"], correctIndex: 0, explanation: "Feature importance ranks inputs by their contribution to predictions. e.g., income > ZIP code for loan approval.", band: 'B' },
    { question: "Attention maps in transformers show...", options: ["Which words the model focused on","The model's accuracy","Training speed","Memory usage"], correctIndex: 0, explanation: "Attention visualization highlights which input tokens the model 'looked at' when producing each output token.", band: 'C' },
    { question: "LIME explains predictions by...", options: ["Creating a simple local approximation","Using complex math","Adding more data","Removing features"], correctIndex: 0, explanation: "LIME trains a simple interpretable model locally around a prediction to approximate the complex model's behavior.", band: 'C' },
    { question: "SHAP uses game theory to...", options: ["Fairly distribute prediction credit among features","Speed up training","Reduce model size","Increase accuracy"], correctIndex: 0, explanation: "SHAP (SHapley Additive exPlanations) assigns each feature an importance value based on cooperative game theory.", band: 'C' },
    { question: "Grad-CAM visualizes...", options: ["Which image regions influenced the CNN's decision","Model weights","Training loss","Data distribution"], correctIndex: 0, explanation: "Gradient-weighted Class Activation Mapping overlays heatmaps on images showing which pixels mattered most.", band: 'C' },
    { question: "A counterfactual explanation asks...", options: ["What would need to change for a different outcome?","Why is the model so slow","How big is the model","When was it trained"], correctIndex: 0, explanation: "Counterfactuals show minimal changes needed to flip a decision: 'You'd be approved if income was $5k higher.'", band: 'C' },
    { question: "Probing classifiers test...", options: ["What information is encoded in model layers","Model speed","Data quality","Hardware requirements"], correctIndex: 0, explanation: "By training small classifiers on internal model representations, we can discover what the model 'knows' at each layer.", band: 'C' },
    { question: "Mechanistic interpretability aims to...", options: ["Reverse-engineer how circuits in the model compute","Make models bigger","Speed up inference","Reduce costs"], correctIndex: 0, explanation: "This emerging field tries to understand the actual algorithms implemented by specific neurons and circuits in large models.", band: 'C' },
    { question: "Explainable AI is important because...", options: ["It builds trust and enables debugging","It makes models faster","It reduces data needs","It simplifies deployment"], correctIndex: 0, explanation: "XAI helps users trust AI decisions, developers debug failures, and regulators ensure compliance.", band: 'B' },
    { question: "The 'Clever Hans' effect in AI refers to...", options: ["Models using spurious correlations rather than real reasoning","Models being too smart","Models learning quickly","Models copying humans"], correctIndex: 0, explanation: "Named after a horse that appeared to do math by reading cues, this describes models that exploit dataset artifacts rather than learning true reasoning.", band: 'C' },
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

export default function GlassBoxGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('glass-box', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Glass Box" color="#E945F5" labNum={11}>
      <GameLevelSystem gameTitle="Glass Box" gameEmoji="🔍" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#E945F5" gameEmoji="🔍" timePerQuestion={20} />
        )}
      />
    </GameShell>
  );
}
