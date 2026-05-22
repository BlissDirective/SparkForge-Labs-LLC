// ════════════════════════════════════════════════════════════════════════
// CAMERA QUEST v4 — Lab 7 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Learn computer vision by solving image challenges. Quiz format.
// 10 levels from basic image recognition to advanced CV concepts.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Pixels 101', description: 'Images are made of tiny dots!', emoji: '📸', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Edge Detection', description: 'Find the boundaries!', emoji: '〰️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Color Spaces', description: 'RGB, HSV, and beyond!', emoji: '🎨', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Object Detection', description: 'Find cats, dogs, cars!', emoji: '🐱', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Face Detection', description: 'How AI finds faces!', emoji: '👤', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Segmentation', description: 'Label every pixel!', emoji: '🔲', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: '3D Vision', description: 'Depth and stereo vision!', emoji: '🧊', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'OCR', description: 'Read text from images!', emoji: '📖', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Medical Imaging', description: 'AI that saves lives!', emoji: '🏥', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Vision Master', description: 'The ultimate CV challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "A digital image is made of...", options: ["Pixels (tiny colored dots)","Ink","Light beams","Magic"], correctIndex: 0, explanation: "Digital images are grids of pixels. Each pixel has color values (usually Red, Green, Blue).", band: 'A' },
    { question: "Edge detection finds boundaries by looking for...", options: ["Sudden color changes","Smooth gradients","Identical colors","Random patterns"], correctIndex: 0, explanation: "Edges are where pixel values change rapidly. The Sobel and Canny algorithms detect these transitions.", band: 'A' },
    { question: "RGB stands for...", options: ["Red, Green, Blue","Red, Gray, Black","Rainbow Gradient Bright","Real Good Picture"], correctIndex: 0, explanation: "RGB is the additive color model: combining Red, Green, and Blue light creates all other colors.", band: 'A' },
    { question: "Object detection draws bounding boxes around...", options: ["Recognized objects","Every pixel","Only faces","Text only"], correctIndex: 0, explanation: "Object detection finds objects and draws boxes around them. YOLO and R-CNN are popular algorithms.", band: 'B' },
    { question: "Haar cascades (used in early face detection) work by...", options: ["Comparing light and dark rectangular regions","Neural networks","Color matching","Texture analysis"], correctIndex: 0, explanation: "Haar features compare sums of pixel intensities in adjacent rectangular regions to detect facial features.", band: 'B' },
    { question: "Semantic segmentation labels...", options: ["Every pixel with its class","Only the main object","Text in images","Faces only"], correctIndex: 0, explanation: "Unlike object detection (boxes), segmentation labels EACH pixel. It's used in self-driving cars and medical imaging.", band: 'C' },
    { question: "Stereo vision creates 3D from...", options: ["Two cameras like human eyes","One camera moving","Special lighting","X-rays"], correctIndex: 0, explanation: "Stereo vision uses two offset cameras (like our eyes) and triangulates depth from the difference between views.", band: 'C' },
    { question: "OCR (Optical Character Recognition) converts...", options: ["Images of text into editable text","Speech to text","Text to speech","Images to drawings"], correctIndex: 0, explanation: "OCR reads text from scanned documents, photos, and screenshots. Tesseract is a popular open-source OCR engine.", band: 'B' },
    { question: "AI medical imaging can detect tumors by...", options: ["Finding abnormal patterns in scans","Asking the patient","Reading charts","Guessing"], correctIndex: 0, explanation: "CNNs trained on thousands of labeled scans can detect tumors, often matching or exceeding radiologist accuracy.", band: 'C' },
    { question: "A 'convolution' in image processing is...", options: ["A small filter sliding over the image","A type of camera","A color adjustment","A file format"], correctIndex: 0, explanation: "A convolution kernel (small matrix) slides over the image, computing new pixel values. This is the foundation of CNNs!", band: 'C' },
    { question: "Transfer learning in CV means...", options: ["Using a pre-trained model on a new task","Moving data between computers","Copying images","Translating labels"], correctIndex: 0, explanation: "Pre-trained models (trained on millions of images) can be fine-tuned for specific tasks with much less data.", band: 'C' },
    { question: "Adversarial patches can fool object detectors by...", options: ["Adding designed noise to the image","Making the object smaller","Changing the lighting","Removing color"], correctIndex: 0, explanation: "Adversarial patches are carefully designed patterns that cause AI to misclassify objects — a security concern.", band: 'C' },
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

export default function CameraQuestGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('camera-quest', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Camera Quest" color="#FF6B35" labNum={7}>
      <GameLevelSystem gameTitle="Camera Quest" gameEmoji="📸" labColor="#FF6B35" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#FF6B35" gameEmoji="📸" timePerQuestion={20} />
        )}
      />
    </GameShell>
  );
}
