// ════════════════════════════════════════════════════════════════════════
// TOKEN CHOPPER v3 — Lab 8 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Chop sentences into tokens to learn how NLP works. Quiz format.
// 10 levels from simple words to complex tokenization.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Word Basics', description: 'Chop sentences into words!', emoji: '✂️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Punctuation', description: 'Handle commas, periods, and quotes.', emoji: '📌', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Contractions', description: "Can't, won't, shouldn't — one word or two?", emoji: "🤝", difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Subwords', description: 'Breaking words into smaller pieces.', emoji: '🧩', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Special Tokens', description: 'CLS, SEP, PAD — special markers.', emoji: '🔖', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Multilingual', description: 'Tokenizing different languages.', emoji: '🌍', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Emoji Tokens', description: 'How does AI understand 😂 and 🚀?', emoji: '😂', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Code Tokens', description: 'Tokenizing programming languages.', emoji: '💻', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Token Limits', description: 'Why context length matters.', emoji: '📏', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Token Master', description: 'The ultimate tokenization challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "How many tokens is: 'The cat sat'", options: ["3 — The / cat / sat","4 — including space","1 — it's one sentence","2 — The cat / sat"], correctIndex: 0, explanation: "Each word is typically one token. 'The' = 1, 'cat' = 1, 'sat' = 1. Total = 3 tokens.", band: 'A' },
    { question: "How many tokens is: 'Hello, world!'", options: ["4 — Hello / , / world / !","2 — Hello / world","3 — Hello / , world / !","1 — it's one phrase"], correctIndex: 0, explanation: "Punctuation often becomes separate tokens. Hello (1) , (1) world (1) ! (1) = 4 tokens.", band: 'A' },
    { question: "The contraction 'can't' is typically split into how many tokens?", options: ["2 — can / 't","1 — it's one word","3 — ca / n / 't","It depends on the tokenizer"], correctIndex: 3, explanation: "Different tokenizers handle contractions differently! Some split into 'can' + \"'t\", others keep as one subword token.", band: 'B' },
    { question: "What does the [CLS] token represent in BERT?", options: ["Classification — the start of input","Close — end of sentence","Clear — reset memory","Class — object oriented"], correctIndex: 0, explanation: "[CLS] is a special classification token added at the beginning. BERT uses its final representation for classification tasks.", band: 'C' },
    { question: "What does the [SEP] token do?", options: ["Separates sentences in a pair","Ends the paragraph","Starts a new section","Pauses the model"], correctIndex: 0, explanation: "[SEP] separates sentence pairs (e.g., in question-answering) and marks the end of input.", band: 'C' },
    { question: "'Tokenization' is the process of...", options: ["Splitting text into units for AI","Encrypting text","Translating text","Compressing text"], correctIndex: 0, explanation: "Tokenization converts raw text into tokens (words, subwords, or characters) that the AI model can process.", band: 'A' },
    { question: "A subword tokenizer might split 'unhappiness' into...", options: ["un + happiness","un + happy + ness","unhappiness (one token)","un + hap + pi + ness"], correctIndex: 1, explanation: "Subword tokenization (like BPE) breaks rare words into common pieces. 'un' + 'happy' + 'ness' = familiar subwords.", band: 'B' },
    { question: "Why is 'token limit' important for AI models?", options: ["Models can only process fixed-length input","It makes models faster","It saves electricity","It prevents hacking"], correctIndex: 0, explanation: "Transformer models have a fixed context window (e.g., 4096 tokens). Exceeding this means information gets cut off.", band: 'B' },
    { question: "Emoji '🚀' typically becomes how many tokens?", options: ["1 — some tokenizers handle emojis","2-4 — often split into byte pieces","It depends on the tokenizer","All of the above"], correctIndex: 3, explanation: "Different tokenizers handle emojis differently. GPT-4 typically uses 1 token per common emoji, while older ones may split them.", band: 'B' },
    { question: "A character-level tokenizer would split 'AI' into...", options: ["A / I (2 tokens)","AI (1 token)","A + space + I (3 tokens)","It would skip it"], correctIndex: 0, explanation: "Character-level tokenizers split every character. 'A' = 1 token, 'I' = 1 token. Total = 2 tokens.", band: 'A' },
    { question: "BPE (Byte Pair Encoding) works by...", options: ["Merging the most frequent character pairs iteratively","Splitting at spaces only","Using a dictionary","Random assignment"], correctIndex: 0, explanation: "BPE starts with characters and repeatedly merges the most common pairs into new tokens. This builds a vocabulary of subwords.", band: 'C' },
    { question: "What is 'out-of-vocabulary' (OOV) in tokenization?", options: ["Words the tokenizer has never seen before","Words that are too long","Words with special characters","Words in foreign languages"], correctIndex: 0, explanation: "OOV words are unknown to the tokenizer. Subword tokenization solves this by breaking unknown words into known pieces.", band: 'B' },
    { question: "The word 'tokenization' itself might be split as...", options: ["token + ization","to + ken + ization","tokenization (one token if common)","Any of the above"], correctIndex: 3, explanation: "Different tokenizers produce different splits! BPE might use 'token' + 'ization', while WordPiece might differ.", band: 'C' },
    { question: "Why do some tokenizers split numbers like '12345'?", options: ["Each digit can be a separate token","Numbers are always one token","Numbers are ignored","Numbers are converted to words"], correctIndex: 0, explanation: "Many tokenizers split multi-digit numbers into individual digits unless the specific number appeared frequently in training data.", band: 'B' },
    { question: "The [PAD] token is used to...", options: ["Make all inputs the same length","Add punctuation","Separate paragraphs","Encrypt data"], correctIndex: 0, explanation: "[PAD] fills shorter sequences to match the batch's maximum length so the model can process them in parallel.", band: 'C' },
    { question: "Code 'function hello() { return 42; }' would tokenize into roughly how many tokens?", options: ["8-12 — each symbol and word is separate","3 — it's short","1 — code is compressed","20+ — code is complex"], correctIndex: 0, explanation: "Code tokenizers split keywords, identifiers, symbols, and whitespace. Expect 8-15 tokens for this snippet.", band: 'C' },
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

export default function TokenChopperGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('token-chopper', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Token Chopper" color="#FF6B35" labNum={8}>
      <GameLevelSystem gameTitle="Token Chopper" gameEmoji="✂️" labColor="#FF6B35" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#FF6B35" gameEmoji="✂️" timePerQuestion={20} />
        )}
      />
    </GameShell>
  );
}
