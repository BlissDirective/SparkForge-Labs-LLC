// ════════════════════════════════════════════════════════════════════════
// AI TIME MACHINE v3 — Lab 1 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Travel through time to see how AI evolved. Quiz format.
// 10 levels covering AI history from 1950s to 2030s.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: '1950s Dreams', description: 'The birth of AI thinking.', emoji: '🕰️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: '1960s-70s Winter', description: 'AI winter and expert systems.', emoji: '❄️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: '1980s Expert Era', description: 'Computers that know one thing well.', emoji: '🧠', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: '1990s Internet', description: 'AI meets the World Wide Web.', emoji: '🌐', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: '2000s Big Data', description: 'More data = smarter AI.', emoji: '📊', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: '2010s Deep Learning', description: 'Neural networks revolutionize AI.', emoji: '🧬', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: '2020s AI Everywhere', description: 'AI in your pocket, home, and car.', emoji: '📱', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: '2025 Agents', description: 'AI agents that act on their own.', emoji: '🤖', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: '2030s Futures', description: 'What might AI become?', emoji: '🔮', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Time Lord', description: 'Master of AI history!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const q: Record<number, QuizQuestion[]> = {
    1: [
      { question: "In 1950, Alan Turing proposed a test for machine intelligence. What is it called?", options: ["The Turing Test","The Intelligence Exam","The Robot Challenge","The Logic Test"], correctIndex: 0, explanation: "The Turing Test asks: Can a machine's responses fool a human into thinking it's also human?", band: 'A' },
      { question: "In 1956, the term 'Artificial Intelligence' was coined at a conference. Where?", options: ["Dartmouth College","MIT","Stanford","Harvard"], correctIndex: 0, explanation: "The Dartmouth Summer Research Project (1956) is considered the birth of AI as a field.", band: 'A' },
      { question: "Early AI researchers believed machines could think like humans by the year...", options: ["1970","2000","1980","They never guessed"], correctIndex: 0, explanation: "They were very optimistic! They thought general AI was just decades away. It took much longer.", band: 'A' },
      { question: "What was the first AI program to play chess called?", options: ["Deep Blue","AlphaZero","Mac Hack","ChessMaster"], correctIndex: 2, explanation: "Mac Hack (1966) was one of the first chess programs, created at MIT.", band: 'B' },
    ],
    2: [
      { question: "The 'AI Winter' of the 1970s happened because...", options: ["Funding dried up after over-promising","Computers were too slow","Nobody was interested","AI was banned"], correctIndex: 0, explanation: "Over-optimistic predictions led to disappointment. Governments cut funding when results didn't match hype.", band: 'B' },
      { question: "Expert systems of the 1970s were designed to...", options: ["Mimic human experts in narrow domains","Play games","Draw pictures","Control robots"], correctIndex: 0, explanation: "Expert systems encoded the knowledge of human specialists (doctors, engineers) into if-then rules.", band: 'B' },
      { question: "MYCIN was a famous expert system that could...", options: ["Diagnose blood infections","Play chess","Translate languages","Drive a car"], correctIndex: 0, explanation: "MYCIN (1976) diagnosed bacterial infections and recommended antibiotics — often better than doctors!", band: 'C' },
    ],
    3: [
      { question: "ELIZA (1966) was an early chatbot that pretended to be a...", options: ["Psychotherapist","Teacher","Chef","Astronaut"], correctIndex: 0, explanation: "ELIZA used pattern matching to respond like a Rogerian psychotherapist. Very simple, but surprisingly convincing!", band: 'A' },
      { question: "Expert systems used 'knowledge bases' which were basically...", options: ["Collections of if-then rules","Neural networks","Random guesses","Photo albums"], correctIndex: 0, explanation: "They encoded human expertise as IF-THEN rules. e.g., IF fever AND rash THEN possible measles.", band: 'B' },
    ],
    4: [
      { question: "The World Wide Web launched in 1991. How did it help AI?", options: ["Provided massive data for training","Made computers faster","Invented neural networks","Created the first AI"], correctIndex: 0, explanation: "The web created enormous datasets. More data = better AI training. This was crucial for ML progress.", band: 'B' },
      { question: "In 1997, Deep Blue beat the world chess champion. Who?", options: ["Garry Kasparov","Bobby Fischer","Magnus Carlsen","Anatoly Karpov"], correctIndex: 0, explanation: "Deep Blue defeated Garry Kasparov in 1997, a historic moment showing AI could beat humans at complex games.", band: 'A' },
      { question: "PageRank (1998) used AI to...", options: ["Rank web pages by importance","Translate web pages","Create web pages","Delete web pages"], correctIndex: 0, explanation: "PageRank treated links as votes. It became the foundation of Google's search algorithm.", band: 'C' },
    ],
    5: [
      { question: "'Big Data' in the 2000s meant AI could finally...", options: ["Learn from millions of examples","Think like humans","Build robots","Write novels"], correctIndex: 0, explanation: "Before big data, AI couldn't train on enough examples. More data meant dramatically better performance.", band: 'B' },
      { question: "Netflix's recommendation algorithm (launched 2006) used AI to...", options: ["Suggest movies you'd like","Edit movies","Create movies","Delete movies"], correctIndex: 0, explanation: "Netflix used collaborative filtering (an AI technique) to recommend shows based on similar users' preferences.", band: 'A' },
      { question: "Siri was released in 2011 as an early...", options: ["Voice assistant","Robot","Car","Video game"], correctIndex: 0, explanation: "Siri (2011) brought voice-controlled AI assistants to mainstream smartphones.", band: 'A' },
    ],
    6: [
      { question: "In 2012, AlexNet revolutionized AI by winning a computer vision contest. Its secret?", options: ["Deep neural networks + GPUs","Better cameras","More programmers","Quantum computing"], correctIndex: 0, explanation: "AlexNet showed that deep neural networks trained on GPUs could achieve superhuman image recognition.", band: 'C' },
      { question: "'Deep Learning' means neural networks with...", options: ["Many hidden layers","Just 2 layers","No layers at all","Only input and output"], correctIndex: 0, explanation: "'Deep' refers to having many layers. Each layer learns increasingly complex features.", band: 'B' },
      { question: "In 2016, AlphaGo beat the world champion at Go. Why was this harder than chess?", options: ["Go has more possible moves than atoms in the universe","Chess is actually harder","Go has simpler rules","Computers can't play Go"], correctIndex: 0, explanation: "Go has 10^170 possible positions (vs 10^44 for chess). Brute force is impossible — AlphaGo used deep learning + tree search.", band: 'C' },
    ],
    7: [
      { question: "GPT-3 (2020) could generate human-like text. How?", options: ["Trained on 175 billion parameters","Magic","Had a human inside","Used quantum physics"], correctIndex: 0, explanation: "GPT-3 was a transformer model with 175B parameters trained on internet text. It learned patterns of language.", band: 'C' },
      { question: "DALL-E (2021) could create images from...", options: ["Text descriptions","Hand drawings","Voice commands","Video clips"], correctIndex: 0, explanation: "DALL-E used a text encoder + image decoder to generate images from natural language prompts.", band: 'B' },
      { question: "Tesla's self-driving cars use AI for...", options: ["Computer vision to see the road","Playing music","Talking to passengers","Painting the car"], correctIndex: 0, explanation: "Tesla's Autopilot uses neural networks to process camera feeds for lane detection, object recognition, and path planning.", band: 'B' },
    ],
    8: [
      { question: "AI agents in 2025 can...", options: ["Plan and execute multi-step tasks autonomously","Only answer questions","Drive cars only","Play chess only"], correctIndex: 0, explanation: "AI agents combine planning, tool use, and reasoning to complete complex tasks with minimal human guidance.", band: 'C' },
      { question: "MCP (Model Context Protocol) lets AI agents...", options: ["Connect to external tools and data","Think faster","Draw better","Speak louder"], correctIndex: 0, explanation: "MCP is a standard protocol that lets AI agents securely connect to databases, APIs, and external tools.", band: 'C' },
      { question: "'Multimodal' AI can work with...", options: ["Text, images, audio, and video together","Only text","Only images","Only audio"], correctIndex: 0, explanation: "Multimodal AI processes multiple types of input simultaneously, like seeing an image and answering questions about it.", band: 'C' },
    ],
    9: [
      { question: "By 2030, AI might help scientists...", options: ["Discover new medicines","Replace all jobs","Take over the world","Stop working"], correctIndex: 0, explanation: "AI drug discovery is already accelerating research. By 2030, it could help design personalized treatments.", band: 'C' },
      { question: "'Artificial General Intelligence' (AGI) means AI that can...", options: ["Do any intellectual task a human can","Only play games","Only recognize images","Only drive cars"], correctIndex: 0, explanation: "AGI = human-level intelligence across all domains. It does not exist yet but is a major research goal.", band: 'C' },
      { question: "The most likely AI risk experts worry about is...", options: ["Misuse by bad actors","AI becoming sentient","AI being too slow","AI making art"], correctIndex: 0, explanation: "Most AI safety researchers worry about misuse (deepfakes, bias, weapons) rather than sci-fi scenarios.", band: 'C' },
    ],
    10: [
      { question: "What year is considered the 'birth of AI'?", options: ["1956","2000","1980","2020"], correctIndex: 0, explanation: "The 1956 Dartmouth Conference coined 'Artificial Intelligence' and launched the field.", band: 'A' },
      { question: "What was the biggest breakthrough of the 2010s?", options: ["Deep learning on GPUs","The internet","Smartphones","Video games"], correctIndex: 0, explanation: "Deep learning + GPU computing enabled the AI revolution we see today.", band: 'B' },
      { question: "What is the Turing Test designed to measure?", options: ["If a machine can think like a human","If a computer is fast","If a robot can walk","If AI can draw"], correctIndex: 0, explanation: "The Turing Test checks if a machine's behavior is indistinguishable from a human's.", band: 'A' },
      { question: "What does the future of AI depend on most?", options: ["Responsible development and human oversight","More processing power alone","Bigger companies","Fewer regulations"], correctIndex: 0, explanation: "The future of AI depends on how wisely humans develop, regulate, and deploy it.", band: 'C' },
    ],
  };

  return q[levelId] || q[1];
}

export default function TimeMachineGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('time-machine', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Time Machine" color="#4F6EF7" labNum={1}>
      <GameLevelSystem gameTitle="AI Time Machine" gameEmoji="🕰️" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#4F6EF7" gameEmoji="🕰️" timePerQuestion={20} />
        )}
      />
    </GameShell>
  );
}
