// ════════════════════════════════════════════════════
// DATA DETECTIVE V2 — Lab 2 (Teaching AI) — FL-Lite
// Investigate datasets for patterns, anomalies, and bias.
// Enhanced: chrome bezel, welcome phase, age-band content,
// 3D magnifying glass on desktop, evidence card flips.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';
import dynamic from 'next/dynamic';

// 3D scene content — rendered inside CockpitCanvas via sceneStore (D3D-B3)
const DataDetective3D = dynamic(
  () => import('@/components/3d/DataDetective3D'),
  { ssr: false }
);

type Phase = 'welcome' | 'play' | 'complete';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface DataCase {
  title: string;
  description: string;
  difficulty: Difficulty;
  data: { label: string; value: number; flagged?: boolean }[];
  question: string;
  correctIndex: number;
  explanation: string;
  explanationKids: string;
  isAI?: boolean;
}

const CASES: DataCase[] = [
  {
    title: 'Pet Popularity Survey',
    difficulty: 'easy',
    description: 'A school surveyed 100 students about their favorite pets. Examine the results.',
    data: [
      { label: 'Dogs', value: 45 },
      { label: 'Cats', value: 30 },
      { label: 'Fish', value: 12 },
      { label: 'Hamsters', value: 8 },
      { label: 'Dragons', value: 55, flagged: true },
    ],
    question: 'Which data point looks suspicious?',
    correctIndex: 4,
    explanation: 'Dragons got 55 votes in a 100-student survey — that\'s more than dogs, and dragons aren\'t real pets! This is an anomaly.',
    explanationKids: 'Dragons aren\'t real pets, and 55 is way too many votes! Something fishy is going on!',
  },
  {
    title: 'Weather Station Readings',
    difficulty: 'easy',
    description: 'Temperature readings from a weather station over one week in summer.',
    data: [
      { label: 'Mon', value: 28 },
      { label: 'Tue', value: 30 },
      { label: 'Wed', value: -40, flagged: true },
      { label: 'Thu', value: 27 },
      { label: 'Fri', value: 31 },
    ],
    question: 'Which reading is an outlier?',
    correctIndex: 2,
    explanation: 'Wednesday shows -40°C in summer — a sensor malfunction or data entry error. This outlier would skew any analysis.',
    explanationKids: '-40 degrees in summer?! That\'s way too cold — the sensor must have glitched!',
  },
  {
    title: 'App Downloads by Age',
    difficulty: 'easy',
    description: 'An AI app tracked downloads. Does anything seem unfair in the data?',
    data: [
      { label: 'Ages 10-15', value: 200 },
      { label: 'Ages 16-20', value: 850 },
      { label: 'Ages 21-30', value: 1200 },
      { label: 'Ages 31-40', value: 900 },
      { label: 'Ages 0-9', value: 0, flagged: true },
    ],
    question: 'Which group might indicate bias in the data?',
    correctIndex: 4,
    explanation: 'Zero downloads from ages 0-9 could mean the app wasn\'t available to young children — this is selection bias that could skew conclusions.',
    explanationKids: 'No kids under 10 tried the app at all! Maybe they weren\'t allowed to — that makes the data unfair.',
  },
  {
    title: 'Robot Speed Tests',
    difficulty: 'easy',
    description: 'Five robots raced across a room. Check the results carefully.',
    data: [
      { label: 'Bot-A', value: 12 },
      { label: 'Bot-B', value: 15 },
      { label: 'Bot-C', value: 11 },
      { label: 'Bot-D', value: 999, flagged: true },
      { label: 'Bot-E', value: 14 },
    ],
    question: 'Which result seems like a measurement error?',
    correctIndex: 3,
    explanation: 'Bot-D recorded 999 units — likely a default error value or buffer overflow. Real speed should be similar to other bots.',
    explanationKids: '999 is waaay faster than the others — that\'s probably a glitch, not a real speed!',
  },
  {
    title: 'Student Test Scores',
    difficulty: 'easy',
    description: 'An AI grading tool scored student essays. Review the pattern.',
    data: [
      { label: 'Student A', value: 82 },
      { label: 'Student B', value: 78 },
      { label: 'Student C', value: 85 },
      { label: 'Student D', value: 50, flagged: true },
      { label: 'Student E', value: 80 },
    ],
    question: 'Which score might need a human review?',
    correctIndex: 3,
    explanation: 'Student D scored significantly lower. While it could be genuine, outliers in AI grading should be human-reviewed to check for bias.',
    explanationKids: 'Student D got a much lower score. A teacher should double-check — maybe the AI made a mistake!',
  },
  // ═══════ 5x CONTENT EXPANSION (20 new cases) ═══════
  // --- TIER: EASY (cases 6-10) ---
  {
    title: 'School Lunch Orders',
    difficulty: 'easy',
    description: 'The cafeteria tracked lunch orders for the week. Something looks off.',
    data: [
      { label: 'Pizza', value: 120 },
      { label: 'Salad', value: 45 },
      { label: 'Tacos', value: 85 },
      { label: 'Sushi', value: 60 },
      { label: 'Invisible Soup', value: 200, flagged: true },
    ],
    question: 'Which menu item seems suspicious?',
    correctIndex: 4,
    explanation: '"Invisible Soup" isn\'t a real menu item and has the most orders — this is likely fabricated data that would corrupt any analysis.',
    explanationKids: 'Invisible Soup isn\'t real food! Someone must have made that up!',
  },
  {
    title: 'Library Book Checkouts',
    difficulty: 'easy',
    description: 'A school library tracked which genres students borrowed this month.',
    data: [
      { label: 'Fantasy', value: 89 },
      { label: 'Science', value: 67 },
      { label: 'Comics', value: 102 },
      { label: 'History', value: 54 },
      { label: 'Cooking', value: 3, flagged: true },
    ],
    question: 'Which data point might indicate a sampling problem?',
    correctIndex: 4,
    explanation: 'Only 3 cooking books checked out could mean the library has very few cooking books — this is availability bias, not student preference.',
    explanationKids: 'Only 3 cooking books? Maybe the library barely has any! That\'s not fair to count.',
  },
  {
    title: 'Playground Usage',
    difficulty: 'easy',
    description: 'Sensors tracked how many kids used each playground area.',
    data: [
      { label: 'Swings', value: 45 },
      { label: 'Slide', value: 52 },
      { label: 'Sandbox', value: 38 },
      { label: 'Climbing Wall', value: 41 },
      { label: 'Broken Seesaw', value: 0, flagged: true },
    ],
    question: 'Which reading needs more context?',
    correctIndex: 4,
    explanation: 'Zero usage of the seesaw could mean it was broken or closed — the data doesn\'t tell the whole story without context.',
    explanationKids: 'Nobody used the seesaw? It was probably broken! The data doesn\'t explain why.',
  },
  {
    title: 'Video Game Ratings',
    difficulty: 'easy',
    description: 'An AI collected user ratings for 5 new games. Check the pattern.',
    data: [
      { label: 'Space Quest', value: 4.2 },
      { label: 'Puzzle World', value: 3.8 },
      { label: 'Racing Pro', value: 4.5 },
      { label: 'Adventure X', value: 4.0 },
      { label: 'My Own Game', value: 5.0, flagged: true },
    ],
    question: 'Which rating looks suspicious?',
    correctIndex: 4,
    explanation: 'A perfect 5.0 rating is extremely rare. "My Own Game" was likely rated only by its creator — this is self-selection bias.',
    explanationKids: 'A perfect score? The person who made the game probably rated it themselves!',
  },
  {
    title: 'Class Attendance',
    difficulty: 'easy',
    description: 'A school tracked daily attendance for one week.',
    data: [
      { label: 'Monday', value: 28 },
      { label: 'Tuesday', value: 27 },
      { label: 'Wednesday', value: 30 },
      { label: 'Thursday', value: 26 },
      { label: 'Friday', value: 2, flagged: true },
    ],
    question: 'Which day\'s data needs investigation?',
    correctIndex: 4,
    explanation: 'Only 2 students on Friday is a dramatic drop. There may have been a holiday, snow day, or data recording error.',
    explanationKids: 'Only 2 kids on Friday?! Was it a snow day? Something weird happened!',
  },
  // --- TIER: MEDIUM (cases 11-17) ---
  {
    title: 'Social Media Followers',
    difficulty: 'medium',
    description: 'An AI analyzed follower growth for 5 accounts over one month.',
    data: [
      { label: 'Art Page', value: 150 },
      { label: 'Cooking Channel', value: 200 },
      { label: 'Sports Blog', value: 180 },
      { label: 'News Hub', value: 120 },
      { label: 'New Account', value: 50000, flagged: true },
    ],
    question: 'Which account\'s growth is suspicious?',
    correctIndex: 4,
    explanation: '50,000 followers for a new account in one month is likely bot-generated followers — artificial inflation that skews engagement metrics.',
    explanationKids: '50,000 followers already?! Those are probably fake robot accounts, not real people!',
  },
  {
    title: 'Plant Growth Experiment',
    difficulty: 'medium',
    description: 'Students measured plant heights (cm) after 2 weeks of different treatments.',
    data: [
      { label: 'Water Only', value: 12 },
      { label: 'Sunlight+Water', value: 18 },
      { label: 'Fertilizer', value: 15 },
      { label: 'Music', value: 14 },
      { label: 'No Treatment', value: 45, flagged: true },
    ],
    question: 'Which result seems unreliable?',
    correctIndex: 4,
    explanation: 'A plant with no treatment growing 45cm in 2 weeks is biologically impossible. This is likely a measurement error or mixed-up data.',
    explanationKids: '45cm with nothing?! Someone probably measured the wrong plant or wrote the wrong number!',
  },
  {
    title: 'Movie Ticket Sales',
    difficulty: 'medium',
    description: 'A cinema tracked ticket sales for opening weekend across 5 cities.',
    data: [
      { label: 'New York', value: 8500 },
      { label: 'Los Angeles', value: 7200 },
      { label: 'Chicago', value: 4100 },
      { label: 'Houston', value: 3800 },
      { label: 'Small Town', value: 9000, flagged: true },
    ],
    question: 'Which city\'s data seems inconsistent?',
    correctIndex: 4,
    explanation: 'A small town outselling New York is highly unlikely. This could be a data entry error or the "small town" entry is mislabeled.',
    explanationKids: 'A tiny town selling more tickets than New York?! That can\'t be right — someone mixed up the numbers!',
  },
  {
    title: 'Sleep Tracker Data',
    difficulty: 'medium',
    description: 'A fitness app recorded sleep hours for a student over 5 nights.',
    data: [
      { label: 'Mon Night', value: 8 },
      { label: 'Tue Night', value: 7.5 },
      { label: 'Wed Night', value: 8.5 },
      { label: 'Thu Night', value: 25, flagged: true },
      { label: 'Fri Night', value: 9 },
    ],
    question: 'Which reading is clearly an error?',
    correctIndex: 3,
    explanation: '25 hours of sleep is impossible in a single night. The tracker likely malfunctioned or recorded across multiple days.',
    explanationKids: '25 hours of sleep?! A day only has 24 hours — the tracker must have glitched!',
  },
  {
    title: 'Online Store Reviews',
    difficulty: 'medium',
    description: 'An AI analyzed product reviews. Notice anything about the timing.',
    data: [
      { label: 'Jan Reviews', value: 12 },
      { label: 'Feb Reviews', value: 15 },
      { label: 'Mar Reviews', value: 8 },
      { label: 'Launch Day', value: 500, flagged: true },
      { label: 'Apr Reviews', value: 11 },
    ],
    question: 'Which data point suggests manipulation?',
    correctIndex: 3,
    explanation: '500 reviews on launch day suggests coordinated fake reviews — real reviews accumulate gradually over time.',
    explanationKids: '500 reviews in ONE day?! Real people don\'t all review the same day — those are probably fake!',
  },
  {
    title: 'Energy Usage by Building',
    difficulty: 'medium',
    description: 'Smart meters tracked electricity usage (kWh) for school buildings.',
    data: [
      { label: 'Main Hall', value: 450 },
      { label: 'Science Lab', value: 380 },
      { label: 'Gym', value: 520 },
      { label: 'Library', value: 200 },
      { label: 'Empty Closet', value: 600, flagged: true },
    ],
    question: 'Which reading indicates a problem?',
    correctIndex: 4,
    explanation: 'An empty closet using 600 kWh is physically impossible. This suggests a faulty meter, crossed wiring, or data mapping error.',
    explanationKids: 'An empty closet using the most electricity?! The meter must be broken or connected to the wrong room!',
  },
  {
    title: 'Sports Team Heights',
    difficulty: 'medium',
    description: 'A coach recorded player heights (cm) for the basketball team.',
    data: [
      { label: 'Player 1', value: 165 },
      { label: 'Player 2', value: 172 },
      { label: 'Player 3', value: 168 },
      { label: 'Player 4', value: 16, flagged: true },
      { label: 'Player 5', value: 175 },
    ],
    question: 'Which measurement has a data entry error?',
    correctIndex: 3,
    explanation: '16cm is impossibly short — someone likely forgot a digit. The correct value was probably 160cm. This is a truncation error.',
    explanationKids: '16cm?! That\'s shorter than a ruler! Someone forgot to type the zero — it should be 160!',
  },
  // --- TIER: HARD (cases 18-22) ---
  {
    title: 'Survey Response Times',
    difficulty: 'hard',
    description: 'An AI survey tool recorded how long (seconds) people took to answer.',
    data: [
      { label: 'User A', value: 45 },
      { label: 'User B', value: 38 },
      { label: 'User C', value: 52 },
      { label: 'User D', value: 2, flagged: true },
      { label: 'User E', value: 41 },
    ],
    question: 'Which response suggests the survey wasn\'t taken seriously?',
    correctIndex: 3,
    explanation: '2 seconds is too fast to have read the question. This user likely clicked randomly, introducing noise into the dataset.',
    explanationKids: '2 seconds?! They didn\'t even read the question! That answer shouldn\'t count.',
  },
  {
    title: 'Hospital Wait Times',
    difficulty: 'hard',
    description: 'AI tracked average ER wait times (minutes) across hospitals.',
    data: [
      { label: 'City General', value: 45 },
      { label: 'St. Mary\'s', value: 60 },
      { label: 'Children\'s', value: 35 },
      { label: 'County Med', value: 55 },
      { label: 'VIP Clinic', value: 5, flagged: true },
    ],
    question: 'Which data point reveals potential bias in the dataset?',
    correctIndex: 4,
    explanation: 'The VIP Clinic\'s 5-minute wait isn\'t an error — it serves wealthy patients only. Including it in "hospital averages" creates wealth bias in the dataset.',
    explanationKids: 'The fancy clinic is super fast, but only rich people go there. It\'s not fair to compare!',
  },
  {
    title: 'AI Hiring Scores',
    difficulty: 'hard',
    description: 'An AI tool scored job applicants. Review for potential bias.',
    data: [
      { label: 'Candidate A', value: 92 },
      { label: 'Candidate B', value: 88 },
      { label: 'Candidate C', value: 85 },
      { label: 'Internal Ref', value: 99, flagged: true },
      { label: 'Candidate D', value: 78 },
    ],
    question: 'Which score might indicate unfair advantage?',
    correctIndex: 3,
    explanation: 'The internal referral scored 99 — the AI may be biased toward internal candidates. This is referral bias in automated hiring.',
    explanationKids: 'The person who already knows someone inside got the best score? That doesn\'t seem fair!',
  },
  {
    title: 'Translation Accuracy',
    difficulty: 'hard',
    description: 'An AI translator was tested across languages. Check for bias.',
    data: [
      { label: 'English→Spanish', value: 96 },
      { label: 'English→French', value: 94 },
      { label: 'English→Mandarin', value: 91 },
      { label: 'English→Swahili', value: 62, flagged: true },
      { label: 'English→German', value: 95 },
    ],
    question: 'Which result reveals a training data problem?',
    correctIndex: 3,
    explanation: 'Much lower Swahili accuracy suggests the AI had far less Swahili training data — this is representation bias from unbalanced datasets.',
    explanationKids: 'The AI is bad at Swahili because it didn\'t practice enough! It had way more English and Spanish to learn from.',
  },
  {
    title: 'Fitness Tracker Steps',
    difficulty: 'hard',
    description: 'A step counter recorded daily steps for a wheelchair user.',
    data: [
      { label: 'Monday', value: 8000 },
      { label: 'Tuesday', value: 7500 },
      { label: 'Wednesday', value: 9200 },
      { label: 'Thursday', value: 8800 },
      { label: 'Friday', value: 7000 },
    ],
    question: 'What\'s wrong with this entire dataset?',
    correctIndex: 0,
    explanation: 'ALL values are suspicious — a wheelchair user wouldn\'t take 7000-9200 steps daily. The tracker is measuring arm movements as steps. The device has an assumption bias.',
    explanationKids: 'Wait — the person uses a wheelchair! The tracker is counting arm movements as steps. The whole thing is wrong!',
  },
  // --- TIER: EXPERT (cases 23-25) ---
  {
    title: 'Survivorship Bias Test',
    difficulty: 'expert',
    description: 'An AI studied successful companies to find what makes them succeed.',
    data: [
      { label: 'Bold Risks', value: 85 },
      { label: 'Long Hours', value: 78 },
      { label: 'Lucky Timing', value: 45 },
      { label: 'Great Product', value: 92 },
      { label: 'Failed Ones', value: 0, flagged: true },
    ],
    question: 'What\'s the fundamental flaw in this study?',
    correctIndex: 4,
    explanation: 'The study only looked at successful companies (0 failures analyzed). This is survivorship bias — failed companies with the same traits were ignored.',
    explanationKids: 'They only studied winners! What about companies that did the same things and still failed? You need both sides!',
  },
  {
    title: 'Correlation vs Causation',
    difficulty: 'expert',
    description: 'An AI found that ice cream sales and drowning incidents both increase in summer.',
    data: [
      { label: 'Jan', value: 10 },
      { label: 'Apr', value: 30 },
      { label: 'Jul', value: 95 },
      { label: 'Oct', value: 25 },
      { label: 'Ice Cream Link', value: 95, flagged: true },
    ],
    question: 'Why is the "ice cream causes drowning" conclusion wrong?',
    correctIndex: 4,
    explanation: 'Both increase in summer because of hot weather (confounding variable), not because one causes the other. This is the classic correlation ≠ causation trap.',
    explanationKids: 'Ice cream doesn\'t make people drown! It\'s just that both happen more in summer because it\'s hot!',
  },
  {
    title: 'Simpson\'s Paradox',
    difficulty: 'expert',
    description: 'Hospital A cures 80% of patients. Hospital B cures 90%. But when split by severity...',
    data: [
      { label: 'Hosp A (Mild)', value: 95 },
      { label: 'Hosp A (Severe)', value: 70 },
      { label: 'Hosp B (Mild)', value: 98 },
      { label: 'Hosp B (Severe)', value: 60 },
      { label: 'Hosp A Overall', value: 80, flagged: true },
    ],
    question: 'Why does Hospital A look worse overall despite doing better with severe cases?',
    correctIndex: 4,
    explanation: 'Hospital A treats more severe cases, dragging down its average. This is Simpson\'s Paradox — aggregated data reverses when split by subgroups.',
    explanationKids: 'Hospital A helps sicker people — that makes their average look worse even though they\'re actually better at hard cases!',
  },
];

export function DataDetectiveGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const { safeTimeout } = useSafeTimeout();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: dynamicContent } = useGameContent('data-detective', ageBand);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [caseIdx, setCaseIdx] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const filteredCases = useFilteredContent(CASES, tier, ageBand);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const investigateTimerRef = useRef<number | null>(null);
  const hasCompleted = useRef(false);

  // Filter cases by age band: A=easy, B=easy+medium, C=all tiers
  const allowedDifficulties = useMemo<Difficulty[]>(() => {
    if (ageBand === 'A') return ['easy'];
    if (ageBand === 'B') return ['easy', 'medium'];
    return ['easy', 'medium', 'hard', 'expert'];
  }, [ageBand]);
  // Merge hardcoded + dynamic content from admin curation pipeline
  const cases = useMemo(() => {
    const hardcoded = CASES.filter(c => allowedDifficulties.includes(c.difficulty));
    if (!dynamicContent?.scenarios?.length) return hardcoded;
    const dynamic: DataCase[] = dynamicContent.scenarios
      .map(s => { try { return { ...JSON.parse(s.content_body), isAI: true } as DataCase; } catch { return null; } })
      .filter((c): c is DataCase => c !== null && allowedDifficulties.includes(c.difficulty));
    return [...hardcoded, ...dynamic];
  }, [allowedDifficulties, dynamicContent?.scenarios]);

  const currentCase = cases[caseIdx];
  const maxBar = useMemo(() => Math.max(...currentCase.data.map(d => d.value)), [currentCase.data]);

  const handleSelect = useCallback((idx: number) => {
    if (showResult) return;
    setSelected(idx);

    investigateTimerRef.current = safeTimeout(() => {
      setShowResult(true);

      if (idx === currentCase.correctIndex) {
        game.updateScore(10); // FLL-002: Align with GameShell maxScore = totalRounds * 10
        game.advanceRound();
      }
    }, 800);
  }, [showResult, currentCase.correctIndex, game]);

  const handleNext = useCallback(() => {
    if (caseIdx < cases.length - 1) {
      setCaseIdx(i => i + 1);
      setSelected(null);
      setShowResult(false);
    } else if (!hasCompleted.current) {
      hasCompleted.current = true; // FLL-003: prevent double-click race
      setPhase('complete');
      game.completeGame();
    }
  }, [caseIdx, game]);

  // Register 3D scene content into CockpitCanvas via sceneStore (D3D-B3)
  useEffect(() => {
    if (phase === 'play') {
      setGameSceneContent(
        <DataDetective3D
          selectedRow={selected}
          totalRows={currentCase.data.length}
          fixedRows={new Set<number>()}
          deletedRows={new Set<number>()}
          lastFixedRow={showResult && selected === currentCase.correctIndex ? selected : null}
          worldColor="#AA66FF"
        />
      );
    } else {
      setGameSceneContent(null);
    }
  }, [phase, selected, currentCase, showResult, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  return (
    <GameShell gameId="data-detective" title="Data Detective" worldNumber={2} worldColor="#AA66FF" totalRounds={cases.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(170,102,255,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(170,102,255,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">

                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    <span className="text-5xl" role="img" aria-label="magnifying glass">{'\u{1F50D}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">Data Detective</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Analyze datasets for anomalies, outliers, and selection bias. Identify suspicious data points that could compromise ML model training.'
                        : ageBand === 'B'
                        ? 'Investigate data like a detective! Find the suspicious numbers hiding in each dataset.'
                        : 'Look at the numbers and find the one that doesn\'t belong! Be a data detective!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Data Analysis', 'Anomaly Detection', 'Bias'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-2xs text-purple-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #AA66FF, #8844DD)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start investigating">
                      Start Investigating! <Search className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-lg">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={caseIdx + 1} total={cases.length} labColor="#AA66FF" />
                    </div>
                    {/* 3D renders in CockpitCanvas via sceneStore (D3D-B3) */}

                    {/* Case header */}
                    <div className="rounded-xl p-3 mb-3 border border-purple-500/20 bg-purple-500/5 text-center">
                      <p className="font-display text-sm font-bold text-purple-400">{'\u{1F4CB}'} Case {caseIdx + 1}: {currentCase.title}</p>
                      <p className="font-body text-xs text-white/40 mt-1">{currentCase.description}</p>
                    </div>

                    {/* Data bars */}
                    <div className="space-y-2 mb-3">
                      {currentCase.data.map((d, i) => (
                        <motion.button key={i} onClick={() => handleSelect(i)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                            selected === i
                              ? showResult
                                ? i === currentCase.correctIndex
                                  ? 'border-green-500/40 bg-green-500/10'
                                  : 'border-red-500/40 bg-red-500/10'
                                : 'border-purple-500/40 bg-purple-500/10'
                              : 'border-white/5 bg-white/[0.02] hover:border-purple-500/20'
                          }`}
                          whileHover={{ scale: showResult ? 1 : 1.01 }}
                          whileTap={{ scale: showResult ? 1 : 0.99 }}
                          aria-label={`${d.label}: ${d.value}`}
                          disabled={showResult}>
                          <span className="font-body text-xs text-white/60 w-20 text-left">{d.label}</span>
                          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full"
                              style={{ background: showResult && d.flagged ? 'linear-gradient(90deg, #EF4444, #F97316)' : 'linear-gradient(90deg, #AA66FF, #8844DD)' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (d.value / maxBar) * 100)}%` }}
                              transition={{ duration: 0.6, delay: i * 0.1 }} />
                          </div>
                          <span className="font-data text-xs text-white/40 w-10 text-right">{d.value}</span>
                          {showResult && d.flagged && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                          {showResult && selected === i && i === currentCase.correctIndex && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </motion.button>
                      ))}
                    </div>

                    {/* Question */}
                    <div className="rounded-xl p-3 mb-3 border border-purple-500/10 bg-white/[0.02] text-center">
                      <p className="font-display text-sm font-bold text-white">{'\u{1F914}'} {currentCase.question}</p>
                    </div>

                    {/* Result */}
                    <AnimatePresence>
                      {showResult && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`mb-3 rounded-xl p-3 border text-center ${
                            selected === currentCase.correctIndex
                              ? 'bg-green-500/10 border-green-500/20'
                              : 'bg-red-500/10 border-red-500/20'
                          }`}>
                          <p className="font-display text-sm font-bold mb-1" style={{ color: selected === currentCase.correctIndex ? '#4ADE80' : '#F87171' }}>
                            {selected === currentCase.correctIndex ? '\u2705 Correct!' : '\u274C Not quite!'}
                          </p>
                          <p className="font-body text-xs text-white/50">
                            {ageBand === 'A' ? currentCase.explanationKids : currentCase.explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Next button */}
                    {showResult && (
                      <motion.button onClick={handleNext}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                        style={{ background: 'linear-gradient(135deg, #AA66FF, #8844DD)' }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        aria-label={caseIdx < cases.length - 1 ? 'Next case' : 'Complete'}>
                        {caseIdx < cases.length - 1 ? 'Next Case \u2192' : 'Complete Investigation!'}
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {/* COMPLETE */}
                {phase === 'complete' && (
                  <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4">
                    <span className="text-5xl">{'\u{1F3C6}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">Case Closed!</h2>
                    <p className="font-body text-sm text-white/50">
                      {ageBand === 'C'
                        ? 'Excellent analytical work! You\'ve demonstrated key data quality assessment skills.'
                        : 'Great detective work! You found all the suspicious data!'}
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
