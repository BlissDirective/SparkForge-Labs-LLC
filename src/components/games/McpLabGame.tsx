// ════════════════════════════════════════════════════════════════════════
// MCP LAB v4 — Lab 11 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Learn the Model Context Protocol. Quiz format.
// 10 levels from basics to advanced MCP concepts.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'What is MCP?', description: 'Learn the protocol basics!', emoji: '🔌', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Context Windows', description: 'How much can the model remember?', emoji: '📏', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Tool Calling', description: 'Models that use tools!', emoji: '🔧', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Function Calling', description: 'Structured output from models!', emoji: '⚙️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'APIs', description: 'Connect to external services!', emoji: '🌐', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Safety', description: 'Secure tool use!', emoji: '🛡️', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Streaming', description: 'Real-time responses!', emoji: '⚡', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Multi-Modal', description: 'Text, images, and more!', emoji: '🖼️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Custom Tools', description: 'Build your own tools!', emoji: '🛠️', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'MCP Master', description: 'The ultimate MCP challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "MCP stands for...", options: ["Model Context Protocol","Machine Control Program","Multi-Channel Processing","Model Computation Platform"], correctIndex: 0, explanation: "Model Context Protocol is a standard for how AI models interact with external tools and context.", band: 'B' },
    { question: "A 'context window' is...", options: ["How much text the model can process at once","A browser window","A type of neural network","A data format"], correctIndex: 0, explanation: "The context window limits how much text (in tokens) a model can process in a single request.", band: 'B' },
    { question: "Tool calling lets an AI model...", options: ["Execute external functions","Draw pictures","Play music","Write faster"], correctIndex: 0, explanation: "Tool calling enables models to request execution of external functions (calculator, search, API calls).", band: 'B' },
    { question: "Function calling requires the model to output...", options: ["Structured JSON with function name and parameters","Free text","Binary code","Images"], correctIndex: 0, explanation: "Function calling outputs structured JSON specifying which function to call with what arguments.", band: 'C' },
    { question: "MCP improves on simple prompting by...", options: ["Providing structured access to tools and context","Using more words","Being faster","Being cheaper"], correctIndex: 0, explanation: "MCP standardizes how models access external capabilities, making tool use more reliable and secure.", band: 'C' },
    { question: "Streaming responses are useful because...", options: ["Users see results immediately","They use less memory","They are more accurate","They work offline"], correctIndex: 0, explanation: "Streaming sends tokens as they're generated, reducing perceived latency and improving user experience.", band: 'B' },
    { question: "Multi-modal MCP can handle...", options: ["Text, images, audio, and video","Only text","Only images","Only audio"], correctIndex: 0, explanation: "Modern MCP supports multiple input types, enabling rich interactions beyond just text.", band: 'C' },
    { question: "Custom tools in MCP let developers...", options: ["Connect their own services to AI models","Replace the AI model","Speed up training","Reduce costs"], correctIndex: 0, explanation: "Developers can expose their own APIs and services as tools that AI models can call through MCP.", band: 'C' },
    { question: "Safety in MCP is important because...", options: ["Tool access can execute real-world actions","Models are slow","Data is expensive","Users get confused"], correctIndex: 0, explanation: "Since MCP tools can execute actions (send emails, modify data), security and authorization are critical.", band: 'C' },
    { question: "A 'system prompt' in MCP...", options: ["Sets the model's behavior and constraints","Is written by the user","Contains training data","Is optional"], correctIndex: 0, explanation: "The system prompt defines the model's role, constraints, and available tools for the session.", band: 'C' },
    { question: "Token limits affect MCP because...", options: ["Long tool outputs may exceed the context window","Tokens are expensive","Models read slowly","Users type fast"], correctIndex: 0, explanation: "Tool outputs consume context window space. Long API responses may need to be summarized or truncated.", band: 'C' },
    { question: "MCP enables 'agents' by...", options: ["Giving models persistent tool access and memory","Making models bigger","Training models longer","Adding more data"], correctIndex: 0, explanation: "MCP's standardized tool access and context management let models act as autonomous agents over time.", band: 'C' },
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

export default function McpLabGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('mcp-lab', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="MCP Lab" color="#E945F5" labNum={11}>
      <GameLevelSystem gameTitle="MCP Lab" gameEmoji="🔌" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#E945F5" gameEmoji="🔌" timePerQuestion={20} />
        )}
      />
    </GameShell>
  );
}
