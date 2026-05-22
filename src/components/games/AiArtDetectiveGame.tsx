// ════════════════════════════════════════════════════════════════════════
// AI ART DETECTIVE v3 — Lab 4 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Identify AI-generated vs human-created art. Quiz format.
// 10 levels across art styles, techniques, and history.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Paint or Pixel?', description: 'Digital art vs traditional painting.', emoji: '🎨', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Style Transfer', description: 'AI that paints like Van Gogh!', emoji: '🖼️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Deepfake Art', description: 'When AI recreates masterpieces.', emoji: '👤', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Generative Adversarial', description: 'GANs — two AIs competing to make art!', emoji: '⚔️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Text to Image', description: 'DALL-E, Midjourney, Stable Diffusion.', emoji: '✨', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Music Generation', description: 'AI that composes symphonies!', emoji: '🎵', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Video Synthesis', description: 'AI-generated video and film.', emoji: '🎬', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: '3D Generation', description: 'AI that sculpts in 3D!', emoji: '🧊', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Creative Tools', description: 'AI as a creative partner.', emoji: '🛠️', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Art Critic', description: 'The ultimate art AI challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "AI art generators like DALL-E create images from...", options: ["Text descriptions","Hand drawings","Camera photos","3D models"], correctIndex: 0, explanation: "Text-to-image models generate images from natural language prompts using diffusion models.", band: 'A' },
    { question: "Style transfer lets you apply the style of one image to another. How?", options: ["Neural networks separate content and style","It copies pixel by pixel","It traces over the image","Magic"], correctIndex: 0, explanation: "Neural style transfer uses CNNs to separate content representation from style representation, then recombines them.", band: 'B' },
    { question: "GANs (Generative Adversarial Networks) use two neural networks that...", options: ["Compete against each other","Cooperate together","Take turns drawing","Share one brain"], correctIndex: 0, explanation: "The Generator creates fake images, the Discriminator tries to spot fakes. Competition makes both better!", band: 'B' },
    { question: "Diffusion models create images by...", options: ["Starting with noise and refining it","Drawing lines first","Copying existing photos","Asking humans for help"], correctIndex: 0, explanation: "Diffusion models start with random noise and gradually denoise it, guided by the text prompt, to create images.", band: 'C' },
    { question: "AI-generated hands often look strange because...", options: ["Training data has fewer hand images","AI hates hands","Hands are simple","AI can't see fingers"], correctIndex: 0, explanation: "Hands are complex with many poses. Training data often lacks detailed hand examples, so AI struggles to learn them.", band: 'A' },
    { question: "A 'prompt' in AI art is...", options: ["The text description you give the AI","A button you press","A color palette","A canvas size"], correctIndex: 0, explanation: "The prompt is the text instruction. Better prompts = better art. Prompt engineering is a real skill!", band: 'A' },
    { question: "AI music generators like Suno can create songs with...", options: ["Lyrics, vocals, and instruments","Only instruments","Only lyrics","Only beats"], correctIndex: 0, explanation: "Modern AI music generators can produce complete songs including vocals, lyrics, and instrumentation from text prompts.", band: 'B' },
    { question: "The 'uncanny valley' in AI art refers to...", options: ["Almost-real but slightly off feeling","A place where AI lives","A color palette","A type of brush stroke"], correctIndex: 0, explanation: "The uncanny valley is when something looks almost human/real but has subtle errors that make it feel creepy or wrong.", band: 'B' },
    { question: "Watermark detection can help spot AI art because...", options: ["Some AI tools add invisible watermarks","AI art is always watermarked","Humans never watermark","It's illegal to remove"], correctIndex: 0, explanation: "Some AI platforms embed invisible watermarks or metadata to identify AI-generated content.", band: 'C' },
    { question: "AI 3D generation creates models from...", options: ["Text descriptions or single images","Only from scratch","Hand sculpting","Scanning real objects"], correctIndex: 0, explanation: "Text-to-3D and image-to-3D models can generate 3D objects from descriptions or photos using neural radiance fields (NeRFs).", band: 'C' },
    { question: "The first AI-generated artwork sold at auction (Edmond de Belamy, 2018) was created by...", options: ["A GAN","DALL-E","A human painter","A robot arm"], correctIndex: 0, explanation: "The Belamy portraits were created by Obvious Art using a GAN. One sold for $432,500 at Christie's!", band: 'B' },
    { question: "'Inpainting' in AI art means...", options: ["Filling in missing parts of an image","Painting indoors","Watercolor technique","Erasing mistakes"], correctIndex: 0, explanation: "Inpainting uses AI to fill masked regions of an image with contextually appropriate content.", band: 'B' },
    { question: "AI art tools can help human artists by...", options: ["All of these","Generating ideas quickly","Creating variations","Handling tedious tasks"], correctIndex: 0, explanation: "AI is a creative tool! It can brainstorm, iterate fast, handle grunt work, and inspire new directions.", band: 'A' },
    { question: "Copyright for AI-generated art is tricky because...", options: ["It's unclear who owns it","It's always public domain","AI can't create art","It's automatically copyrighted"], correctIndex: 0, explanation: "Legal systems are still figuring out AI copyright. Different countries have different rules about AI-generated content.", band: 'C' },
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

export default function AiArtDetectiveGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('ai-art-detective', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Art Detective" color="#E945F5" labNum={4}>
      <GameLevelSystem gameTitle="AI Art Detective" gameEmoji="🎨" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#E945F5" gameEmoji="🎨" timePerQuestion={18} />
        )}
      />
    </GameShell>
  );
}
