// ════════════════════════════════════════════════════════════════════════
// AI SPY v3 — Lab 1 (What IS AI?) — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Spot hidden AI in everyday scenes. Tap items that use AI.
// Replaced Three.js with rich scene cards + particle field.
// 10 levels with 80+ scenes across home, school, city, future.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Living Room', description: 'Spot AI hiding in your home!', emoji: '🏠', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'School Day', description: 'AI at school — where is it?', emoji: '🏫', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'City Walk', description: 'AI is all around the city!', emoji: '🌆', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'The Kitchen', description: 'Smart kitchen gadgets use AI.', emoji: '🍳', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Playground', description: 'Even playtime has AI!', emoji: '🎮', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'The Hospital', description: 'AI helps doctors heal people.', emoji: '🏥', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Space Station', description: 'AI in space exploration!', emoji: '🚀', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Factory Floor', description: 'Robots and AI build our world.', emoji: '🏭', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Ocean Deep', description: 'AI explores underwater worlds.', emoji: '🌊', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Future World', description: 'The ultimate AI spotting test!', emoji: '🔮', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const q: Record<number, QuizQuestion[]> = {
    1: [
      { question: "Does a Smart TV that recommends shows use AI?", options: ["Yes — it learns your preferences!","No — it's just a regular TV","Maybe — only sometimes","Only if you press a button"], correctIndex: 0, explanation: "Smart TVs use recommendation algorithms to suggest shows based on your viewing history.", band: 'A' },
      { question: "Does a voice assistant (like Alexa) use AI?", options: ["Yes — it understands your voice!","No — it's just a speaker","Only for music","It uses magic"], correctIndex: 0, explanation: "Voice assistants use speech recognition and natural language processing (AI) to understand commands.", band: 'A' },
      { question: "Does a regular couch use AI?", options: ["Yes — it's very smart","No — it's just furniture","Only if it has USB ports","If it's expensive"], correctIndex: 1, explanation: "A regular couch has no sensors or processors — it's just furniture! No AI here.", band: 'A' },
      { question: "Does a robot vacuum use AI?", options: ["Yes — it maps rooms and avoids obstacles","No — it just bumps around randomly","Only if you control it","Only on hardwood"], correctIndex: 0, explanation: "Robot vacuums use SLAM (Simultaneous Localization and Mapping) — an AI technique to navigate.", band: 'A' },
      { question: "Does a light switch use AI?", options: ["Yes — it's smart!","No — it's just a simple circuit","Only LED switches","If it connects to WiFi"], correctIndex: 1, explanation: "A mechanical light switch simply completes or breaks an electrical circuit. No computation involved.", band: 'A' },
      { question: "Does a smart thermostat use AI?", options: ["Yes — it learns your temperature preferences","No — it just has buttons","Only in winter","Only if it has a screen"], correctIndex: 0, explanation: "Smart thermostats learn your schedule and preferences to optimize heating and cooling automatically.", band: 'B' },
      { question: "Does a regular picture frame use AI?", options: ["Yes — if it shows AI art","No — it just holds photos","Only digital frames","If it's expensive"], correctIndex: 1, explanation: "A regular picture frame is purely physical with no computational capability.", band: 'A' },
      { question: "Does a video doorbell with face detection use AI?", options: ["Yes — computer vision recognizes faces","No — it's just a camera","Only if connected to the internet","Only at night"], correctIndex: 0, explanation: "Video doorbells use computer vision (a type of AI) to detect faces and distinguish between people, packages, and animals.", band: 'B' },
    ],
    2: [
      { question: "Does an online math tutor app use AI?", options: ["Yes — it adapts to your skill level!","No — it just has worksheets","Only for older kids","Only for multiplication"], correctIndex: 0, explanation: "Adaptive learning apps use AI to adjust difficulty and personalize lessons based on your performance.", band: 'A' },
      { question: "Does a regular pencil use AI?", options: ["Yes — if it's a smart pencil","No — it's just wood and graphite","Only mechanical pencils","Only colored pencils"], correctIndex: 1, explanation: "A regular pencil is a simple writing tool with no electronics or AI.", band: 'A' },
      { question: "Does plagiarism detection software use AI?", options: ["Yes — it compares text to billions of sources","No — teachers just guess","Only for long essays","Only checks spelling"], correctIndex: 0, explanation: "Plagiarism detectors use NLP (Natural Language Processing) to compare text against vast databases.", band: 'B' },
      { question: "Does a cafeteria cash register use AI?", options: ["Yes — it counts money","No — it just adds prices","Only self-checkout ones","If it beeps"], correctIndex: 1, explanation: "A basic cash register performs arithmetic — not AI. Smart registers with facial payment do use AI.", band: 'A' },
      { question: "Does language translation software use AI?", options: ["Yes — neural networks translate languages","No — it just swaps words","Only for Spanish","Only in apps"], correctIndex: 0, explanation: "Modern translators use neural machine translation — deep learning models that understand context.", band: 'B' },
      { question: "Does a regular eraser use AI?", options: ["Yes — it knows what to erase","No — it's just rubber","Only electric erasers","Only pink ones"], correctIndex: 1, explanation: "An eraser is a simple physical tool. No AI involved in removing pencil marks!", band: 'A' },
      { question: "Does a school bus with GPS tracking use AI?", options: ["Yes — route optimization uses AI","No — GPS is just maps","Only if it drives itself","Only in big cities"], correctIndex: 0, explanation: "GPS + route optimization uses AI to find the most efficient routes and predict arrival times.", band: 'B' },
      { question: "Does a spelling auto-correct use AI?", options: ["Yes — it learns common mistakes","No — it just has a dictionary","Only on phones","Only in English"], correctIndex: 0, explanation: "Modern auto-correct uses machine learning to predict and fix errors based on context, not just dictionaries.", band: 'B' },
    ],
    3: [
      { question: "Do traffic lights that adapt to traffic use AI?", options: ["Yes — smart traffic systems optimize flow","No — they're just timers","Only in some countries","Only at night"], correctIndex: 0, explanation: "Smart traffic systems use sensors and AI to adjust signal timing based on real-time traffic conditions.", band: 'B' },
      { question: "Does a regular park bench use AI?", options: ["Yes — if it has solar panels","No — it's just a bench","Only smart benches","Only in Japan"], correctIndex: 1, explanation: "A regular park bench is just seating. No AI in sitting!", band: 'A' },
      { question: "Does a self-checkout scanner use AI?", options: ["Yes — computer vision identifies items","No — it just reads barcodes","Only the camera ones","Only in supermarkets"], correctIndex: 0, explanation: "Modern self-checkout uses computer vision to identify produce and verify scanned items.", band: 'B' },
      { question: "Does a parking meter use AI?", options: ["Yes — smart meters detect availability","No — it just counts time","Only digital ones","Only in downtown"], correctIndex: 1, explanation: "Basic parking meters just track time. Smart parking systems that detect open spots do use AI.", band: 'A' },
      { question: "Does facial recognition on phones use AI?", options: ["Yes — neural nets map your face","No — it's just a camera","Only on expensive phones","Only for photos"], correctIndex: 0, explanation: "Face ID uses deep learning neural networks to create and compare facial geometry maps.", band: 'B' },
      { question: "Does a regular mailbox use AI?", options: ["Yes — it knows when mail arrives","No — it's just a metal box","Only smart mailboxes","Only in the future"], correctIndex: 1, explanation: "A regular mailbox is just a container. No intelligence needed for holding letters!", band: 'A' },
      { question: "Does a weather prediction app use AI?", options: ["Yes — machine learning improves forecasts","No — it's just a guess","Only for rain","Only professional ones"], correctIndex: 0, explanation: "Modern weather apps use ML models trained on satellite data, radar, and historical patterns.", band: 'B' },
      { question: "Does a public fountain use AI?", options: ["Yes — if it has music sync","No — it's just water pressure","Only interactive fountains","Only at night"], correctIndex: 1, explanation: "A basic fountain operates on water pressure and pumps. Smart fountains with patterns may use simple programming.", band: 'A' },
    ],
  };

  // Levels 4-10 reuse and expand patterns
  const base = q[levelId] || q[1];
  // Add harder questions for higher levels
  const extra: QuizQuestion[] = levelId >= 4 ? [
    { question: "Does a fitness tracker use AI?", options: ["Yes — it learns your activity patterns","No — it just counts steps","Only heart rate monitors","Only smartwatches"], correctIndex: 0, explanation: "Fitness trackers use ML to recognize activities (walking, running, swimming) from motion sensor data.", band: 'C' },
    { question: "Does a spam email filter use AI?", options: ["Yes — it learns to spot junk mail","No — it just blocks addresses","Only Gmail","Only for ads"], correctIndex: 0, explanation: "Spam filters use ML classification to learn patterns in spam and adapt to new techniques.", band: 'B' },
  ] : [];
  const extra2: QuizQuestion[] = levelId >= 7 ? [
    { question: "Does a content recommendation algorithm use reinforcement learning?", options: ["Yes — it optimizes for engagement","No — it just shows popular items","Only TikTok","Only Netflix"], correctIndex: 0, explanation: "Advanced recommendation systems use reinforcement learning to optimize for long-term user engagement.", band: 'C' },
    { question: "Does a medical imaging system use convolutional neural networks?", options: ["Yes — CNNs excel at image recognition","No — doctors just look at pictures","Only X-rays","Only in research"], correctIndex: 0, explanation: "Medical imaging AI uses CNNs (Convolutional Neural Networks) to detect tumors, fractures, and diseases.", band: 'C' },
  ] : [];

  return [...base, ...extra, ...extra2].slice(0, 10);
}

export default function AiSpyGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('ai-spy', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Spy" color="#4F6EF7" labNum={1}>
      <GameLevelSystem gameTitle="AI Spy" gameEmoji="👁️" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#4F6EF7" gameEmoji="👁️" />
        )}
      />
    </GameShell>
  );
}
