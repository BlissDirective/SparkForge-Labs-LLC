'use client';

// ================================================================
// AI PET TRAINER v3-FINAL — Lab 2 Flagship
// ================================================================
// Adopt a pet, train it by labeling data, watch it evolve.
// Full R3F 3D pet with GLB creatures + toon shading,
// chrome bezel, 7 phases, age-band differentiation,
// expanded seed content, comprehensive accessibility.
//
// v3 Changes from v2:
// - Pet3DScene now loads GLB creatures (Decision 6.2)
// - Toon shading via MeshToonMaterial (Decision 7.5)
// - Custom HDR environment with fallback (Decision 7.1)
// - No changes to game logic, phases, or content
//
// Teaches: supervised learning, data quality, overfitting,
// training vs test data, balanced datasets.
// ================================================================

import { useState, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import {
  Heart, Sparkles, Brain, Zap, ChevronRight, BarChart3,
  CheckCircle2, XCircle, RotateCcw, Eye,
  AlertTriangle, FlaskConical, GraduationCap,
} from 'lucide-react';

// === Dynamic import for 3D pet (no SSR) ===

const Pet3DScene = dynamic(() => import('@/components/3d/Pet3DScene'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-48 rounded-full bg-purple-500/10 animate-pulse flex items-center justify-center">
      <span className="text-4xl animate-bounce">{'\u{1F95A}'}</span>
    </div>
  ),
});

// ================================================================
// TYPES
// ================================================================

type Phase = 'welcome' | 'adopt' | 'teach' | 'train' | 'data-lab' | 'test' | 'report';
type PetMood = 'sleeping' | 'confused' | 'learning' | 'smart' | 'genius' | 'celebrating';

interface PetConfig {
  id: string;
  emoji: string;
  name: string;
  personality: string;
  correctReactions: string[];
  wrongReactions: string[];
  thinkingPhrases: string[];
}

interface TrainingItem {
  id: string;
  emoji: string;
  label: string;
  features: string[]; // visible on Band C
  difficulty: 'easy' | 'medium' | 'tricky';
}

interface CategorySet {
  id: string;
  title: string;
  bandMin: 'A' | 'B' | 'C';
  categories: { id: string; label: string; emoji: string; color: string }[];
  training: TrainingItem[];
  test: TrainingItem[];
  description: string;
  descriptionC: string;
}

// ================================================================
// PET CONFIGURATIONS — 6 pets with unique personalities
// ================================================================

const PETS: PetConfig[] = [
  {
    id: 'dog', emoji: '\u{1F436}', name: 'Buddy',
    personality: 'Eager and enthusiastic! Loves to learn new tricks.',
    correctReactions: ['Woof! \u{1F389}', 'Tail wag! \u{1F43E}', '*happy bark*', 'Yes yes yes! \u{1F973}'],
    wrongReactions: ['Hmm? \u{1F914}', '*tilts head*', 'Ruff... let me try again', 'Oops! \u{1F605}'],
    thinkingPhrases: ['*sniffs carefully*', '*focuses hard*', 'Hmm hmm hmm...', '*ears perked*'],
  },
  {
    id: 'cat', emoji: '\u{1F431}', name: 'Whiskers',
    personality: 'Cool and calculating. Pretends not to care, but secretly loves learning.',
    correctReactions: ['Obviously. \u{1F60C}', '*slow blink*', 'I knew that.', 'Purrrfect \u{1F63A}'],
    wrongReactions: ['I meant to do that. \u{1F624}', '*looks away*', 'Hmph.', 'The data was unclear.'],
    thinkingPhrases: ['*stares intensely*', '*considers options*', '*flicks tail*', 'Interesting...'],
  },
  {
    id: 'owl', emoji: '\u{1F989}', name: 'Newton',
    personality: 'Wise and methodical. Takes time to analyze before answering.',
    correctReactions: ['Precisely! \u{1F393}', 'As hypothesized!', 'Knowledge grows! \u{1F4DA}', 'Eureka! \u{2728}'],
    wrongReactions: ['Fascinating error...', 'Hmm, recalculating...', 'A learning opportunity!', 'Back to the data! \u{1F4D6}'],
    thinkingPhrases: ['*adjusts glasses*', 'Let me analyze...', 'Processing patterns...', '*hoots thoughtfully*'],
  },
  {
    id: 'robot', emoji: '\u{1F916}', name: 'Sparky',
    personality: 'Precise and literal. Loves data and numbers.',
    correctReactions: ['CORRECT \u{2705} +1 accuracy', 'Pattern matched!', 'Beep boop! \u{26A1}', 'Confidence: HIGH'],
    wrongReactions: ['ERROR 404: correct answer not found', 'Recalibrating...', 'Beep... boop? \u{1F527}', 'Data inconclusive'],
    thinkingPhrases: ['Scanning...', 'Computing probability...', 'Analyzing features...', 'Running inference...'],
  },
  {
    id: 'dragon', emoji: '\u{1F409}', name: 'Ember',
    personality: 'Fiery and dramatic. Everything is an adventure!',
    correctReactions: ['RAWR! \u{1F525}', 'Fire of knowledge! \u{1F525}\u{2728}', 'Dragon SMASH this quiz!', 'Legendary! \u{2694}\u{FE0F}'],
    wrongReactions: ['*confused smoke puff*', 'Even dragons make mistakes...', 'RAWR?? \u{1F4A8}', 'My flames of wisdom flicker...'],
    thinkingPhrases: ['*smoke curls from nostrils*', '*squints at item*', 'Hmm, my dragon senses say...', '*flaps wings nervously*'],
  },
  {
    id: 'alien', emoji: '\u{1F47D}', name: 'Zyx',
    personality: 'Curious visitor from another world. Fascinated by Earth things.',
    correctReactions: ['Earth knowledge acquired! \u{1F6F8}', 'Beaming with joy! \u{2728}', 'My planet will be impressed!', 'Cosmic! \u{1F31F}'],
    wrongReactions: ['This planet confuses me...', 'Earth is strange \u{1F30D}', 'My antennae must be miscalibrated', 'Does not compute on my planet... \u{1F4E1}'],
    thinkingPhrases: ['*antennae twitching*', 'Consulting galactic database...', 'On my planet this would be...', '*blinks three eyes*'],
  },
];

// ================================================================
// CATEGORY SETS — Age-band differentiated content
// ================================================================

const CATEGORY_SETS: CategorySet[] = [
  // === Band A: Simple Shapes & Colors ===
  {
    id: 'shapes',
    title: 'Shapes',
    bandMin: 'A',
    description: 'Teach your pet to sort circles and squares!',
    descriptionC: 'Binary classification of geometric primitives \u2014 a simple but foundational ML task.',
    categories: [
      { id: 'circle', label: 'Circle', emoji: '\u{1F534}', color: '#EF4444' },
      { id: 'square', label: 'Square', emoji: '\u{1F7E6}', color: '#3B82F6' },
    ],
    training: [
      { id: 'sh1', emoji: '\u{1F534}', label: 'circle', features: ['round', 'red', 'no corners'], difficulty: 'easy' },
      { id: 'sh2', emoji: '\u{1F7E6}', label: 'square', features: ['4 sides', 'blue', '4 corners'], difficulty: 'easy' },
      { id: 'sh3', emoji: '\u{2B55}', label: 'circle', features: ['round', 'hollow', 'no corners'], difficulty: 'easy' },
      { id: 'sh4', emoji: '\u{1F7E7}', label: 'square', features: ['4 sides', 'orange', '4 corners'], difficulty: 'easy' },
      { id: 'sh5', emoji: '\u{1F7E1}', label: 'circle', features: ['round', 'yellow', 'no corners'], difficulty: 'easy' },
      { id: 'sh6', emoji: '\u{1F7EA}', label: 'square', features: ['4 sides', 'purple', '4 corners'], difficulty: 'easy' },
      { id: 'sh7', emoji: '\u{1F7E0}', label: 'circle', features: ['round', 'orange', 'no corners'], difficulty: 'easy' },
      { id: 'sh8', emoji: '\u{2B1B}', label: 'square', features: ['4 sides', 'black', '4 corners'], difficulty: 'easy' },
      { id: 'sh9', emoji: '\u{1F7E2}', label: 'circle', features: ['round', 'green', 'no corners'], difficulty: 'easy' },
      { id: 'sh10', emoji: '\u{1F7E5}', label: 'square', features: ['4 sides', 'red', '4 corners'], difficulty: 'medium' },
      { id: 'sh11', emoji: '\u{26AA}', label: 'circle', features: ['round', 'white', 'no corners'], difficulty: 'medium' },
      { id: 'sh12', emoji: '\u{1F7EB}', label: 'square', features: ['4 sides', 'brown', '4 corners'], difficulty: 'medium' },
    ],
    test: [
      { id: 'sht1', emoji: '\u{1F535}', label: 'circle', features: ['round', 'blue'], difficulty: 'easy' },
      { id: 'sht2', emoji: '\u{1F7E9}', label: 'square', features: ['4 sides', 'green'], difficulty: 'easy' },
      { id: 'sht3', emoji: '\u{1F7E4}', label: 'circle', features: ['round', 'brown'], difficulty: 'medium' },
      { id: 'sht4', emoji: '\u{25FB}\u{FE0F}', label: 'square', features: ['4 sides', 'white'], difficulty: 'medium' },
    ],
  },

  // === Band A/B: Fruits (classic, upgraded) ===
  {
    id: 'fruits',
    title: 'Fruits',
    bandMin: 'A',
    description: 'Is it an apple or a banana? Teach your pet!',
    descriptionC: 'Binary classification with visual variants \u2014 same label, different appearances. Tests generalization.',
    categories: [
      { id: 'apple', label: 'Apple', emoji: '\u{1F34E}', color: '#EF4444' },
      { id: 'banana', label: 'Banana', emoji: '\u{1F34C}', color: '#FBBF24' },
    ],
    training: [
      { id: 'f1', emoji: '\u{1F34E}', label: 'apple', features: ['red', 'round', 'stem'], difficulty: 'easy' },
      { id: 'f2', emoji: '\u{1F34C}', label: 'banana', features: ['yellow', 'curved', 'long'], difficulty: 'easy' },
      { id: 'f3', emoji: '\u{1F34F}', label: 'apple', features: ['green', 'round', 'stem'], difficulty: 'medium' },
      { id: 'f4', emoji: '\u{1F34C}', label: 'banana', features: ['yellow', 'curved', 'long'], difficulty: 'easy' },
      { id: 'f5', emoji: '\u{1F34E}', label: 'apple', features: ['red', 'round', 'shiny'], difficulty: 'easy' },
      { id: 'f6', emoji: '\u{1F34C}', label: 'banana', features: ['yellow', 'bunch', 'curved'], difficulty: 'easy' },
      { id: 'f7', emoji: '\u{1F34F}', label: 'apple', features: ['green', 'round', 'tart'], difficulty: 'medium' },
      { id: 'f8', emoji: '\u{1F34C}', label: 'banana', features: ['yellow', 'single', 'curved'], difficulty: 'easy' },
      { id: 'f9', emoji: '\u{1F34E}', label: 'apple', features: ['red-green', 'round', 'stem'], difficulty: 'medium' },
      { id: 'f10', emoji: '\u{1F34C}', label: 'banana', features: ['spotty', 'curved', 'ripe'], difficulty: 'medium' },
      { id: 'f11', emoji: '\u{1F34F}', label: 'apple', features: ['green', 'small', 'crisp'], difficulty: 'medium' },
      { id: 'f12', emoji: '\u{1F34C}', label: 'banana', features: ['green', 'straight', 'unripe'], difficulty: 'tricky' },
    ],
    test: [
      { id: 'ft1', emoji: '\u{1F34E}', label: 'apple', features: ['red', 'round'], difficulty: 'easy' },
      { id: 'ft2', emoji: '\u{1F34C}', label: 'banana', features: ['yellow', 'curved'], difficulty: 'easy' },
      { id: 'ft3', emoji: '\u{1F34F}', label: 'apple', features: ['green', 'round'], difficulty: 'medium' },
      { id: 'ft4', emoji: '\u{1F34C}', label: 'banana', features: ['spotty', 'overripe'], difficulty: 'medium' },
    ],
  },

  // === Band B: Animals (3 categories) ===
  {
    id: 'animals',
    title: 'Animals',
    bandMin: 'B',
    description: "Cat, dog, or bird? This one's trickier with 3 categories!",
    descriptionC: 'Multi-class classification (K=3). Observe how adding a third category changes decision boundaries and increases error rates.',
    categories: [
      { id: 'cat', label: 'Cat', emoji: '\u{1F431}', color: '#8B5CF6' },
      { id: 'dog', label: 'Dog', emoji: '\u{1F436}', color: '#F97316' },
      { id: 'bird', label: 'Bird', emoji: '\u{1F426}', color: '#06B6D4' },
    ],
    training: [
      { id: 'a1', emoji: '\u{1F431}', label: 'cat', features: ['whiskers', 'small', 'pointy ears'], difficulty: 'easy' },
      { id: 'a2', emoji: '\u{1F436}', label: 'dog', features: ['wagging tail', 'large', 'floppy ears'], difficulty: 'easy' },
      { id: 'a3', emoji: '\u{1F426}', label: 'bird', features: ['wings', 'beak', 'feathers'], difficulty: 'easy' },
      { id: 'a4', emoji: '\u{1F431}', label: 'cat', features: ['whiskers', 'medium', 'green eyes'], difficulty: 'easy' },
      { id: 'a5', emoji: '\u{1F436}', label: 'dog', features: ['wagging tail', 'golden', 'friendly'], difficulty: 'easy' },
      { id: 'a6', emoji: '\u{1F99C}', label: 'bird', features: ['wings', 'colorful', 'talks'], difficulty: 'medium' },
      { id: 'a7', emoji: '\u{1F408}\u{200D}\u{2B1B}', label: 'cat', features: ['whiskers', 'black', 'silent'], difficulty: 'medium' },
      { id: 'a8', emoji: '\u{1F429}', label: 'dog', features: ['curly fur', 'medium', 'pointy snout'], difficulty: 'medium' },
      { id: 'a9', emoji: '\u{1F986}', label: 'bird', features: ['wings', 'beak', 'swims'], difficulty: 'medium' },
      { id: 'a10', emoji: '\u{1F431}', label: 'cat', features: ['whiskers', 'fluffy', 'purrs'], difficulty: 'easy' },
      { id: 'a11', emoji: '\u{1F436}', label: 'dog', features: ['wagging tail', 'small', 'playful'], difficulty: 'easy' },
      { id: 'a12', emoji: '\u{1F985}', label: 'bird', features: ['wings', 'large', 'soaring'], difficulty: 'medium' },
      { id: 'a13', emoji: '\u{1F431}', label: 'cat', features: ['whiskers', 'striped', 'independent'], difficulty: 'easy' },
      { id: 'a14', emoji: '\u{1F9AE}', label: 'dog', features: ['vest', 'trained', 'helpful'], difficulty: 'tricky' },
      { id: 'a15', emoji: '\u{1F427}', label: 'bird', features: ['wings', "can't fly", 'swims'], difficulty: 'tricky' },
      { id: 'a16', emoji: '\u{1F987}', label: 'bird', features: ['wings', 'nocturnal', 'echolocation'], difficulty: 'tricky' },
    ],
    test: [
      { id: 'at1', emoji: '\u{1F431}', label: 'cat', features: ['whiskers', 'orange'], difficulty: 'easy' },
      { id: 'at2', emoji: '\u{1F436}', label: 'dog', features: ['wagging', 'spotted'], difficulty: 'easy' },
      { id: 'at3', emoji: '\u{1F54A}\u{FE0F}', label: 'bird', features: ['wings', 'white', 'peaceful'], difficulty: 'medium' },
      { id: 'at4', emoji: '\u{1F431}', label: 'cat', features: ['whiskers', 'large', 'lazy'], difficulty: 'medium' },
      { id: 'at5', emoji: '\u{1F43A}', label: 'dog', features: ['howling', 'wolf-like'], difficulty: 'tricky' },
      { id: 'at6', emoji: '\u{1F989}', label: 'bird', features: ['wings', 'nocturnal', 'wise'], difficulty: 'tricky' },
    ],
  },

  // === Band C: Vehicles (4 categories — hard) ===
  {
    id: 'vehicles',
    title: 'Vehicles',
    bandMin: 'C',
    description: 'Four categories with tricky edge cases. Can your pet handle it?',
    descriptionC: 'Multi-class classification (K=4) with ambiguous samples. Observe precision-recall tradeoffs \u2014 some vehicles fit multiple categories.',
    categories: [
      { id: 'land', label: 'Land', emoji: '\u{1F697}', color: '#10B981' },
      { id: 'water', label: 'Water', emoji: '\u{26F5}', color: '#3B82F6' },
      { id: 'air', label: 'Air', emoji: '\u{2708}\u{FE0F}', color: '#06B6D4' },
      { id: 'space', label: 'Space', emoji: '\u{1F680}', color: '#8B5CF6' },
    ],
    training: [
      { id: 'v1', emoji: '\u{1F697}', label: 'land', features: ['wheels', 'road', 'engine'], difficulty: 'easy' },
      { id: 'v2', emoji: '\u{1F6A2}', label: 'water', features: ['hull', 'ocean', 'anchor'], difficulty: 'easy' },
      { id: 'v3', emoji: '\u{2708}\u{FE0F}', label: 'air', features: ['wings', 'sky', 'jet engine'], difficulty: 'easy' },
      { id: 'v4', emoji: '\u{1F680}', label: 'space', features: ['rocket', 'orbit', 'thrust'], difficulty: 'easy' },
      { id: 'v5', emoji: '\u{1F68C}', label: 'land', features: ['wheels', 'passengers', 'road'], difficulty: 'easy' },
      { id: 'v6', emoji: '\u{26F5}', label: 'water', features: ['sail', 'wind', 'water'], difficulty: 'easy' },
      { id: 'v7', emoji: '\u{1F681}', label: 'air', features: ['rotors', 'hover', 'sky'], difficulty: 'medium' },
      { id: 'v8', emoji: '\u{1F6F8}', label: 'space', features: ['disc', 'alien', 'hover'], difficulty: 'medium' },
      { id: 'v9', emoji: '\u{1F3CD}\u{FE0F}', label: 'land', features: ['2 wheels', 'road', 'fast'], difficulty: 'easy' },
      { id: 'v10', emoji: '\u{1F6A4}', label: 'water', features: ['motor', 'fast', 'waves'], difficulty: 'easy' },
      { id: 'v11', emoji: '\u{1FA82}', label: 'air', features: ['parachute', 'falling', 'wind'], difficulty: 'tricky' },
      { id: 'v12', emoji: '\u{1F6F0}\u{FE0F}', label: 'space', features: ['orbit', 'solar panels', 'signals'], difficulty: 'medium' },
      { id: 'v13', emoji: '\u{1F682}', label: 'land', features: ['rails', 'steam', 'long'], difficulty: 'easy' },
      { id: 'v14', emoji: '\u{1F6F6}', label: 'water', features: ['paddle', 'river', 'wood'], difficulty: 'medium' },
      { id: 'v15', emoji: '\u{1F388}', label: 'air', features: ['balloon', 'hot air', 'float'], difficulty: 'tricky' },
      { id: 'v16', emoji: '\u{1F680}', label: 'space', features: ['booster', 'launch', 'countdown'], difficulty: 'easy' },
    ],
    test: [
      { id: 'vt1', emoji: '\u{1F699}', label: 'land', features: ['wheels', 'SUV'], difficulty: 'easy' },
      { id: 'vt2', emoji: '\u{1F6F3}\u{FE0F}', label: 'water', features: ['hull', 'yacht'], difficulty: 'easy' },
      { id: 'vt3', emoji: '\u{1F6E9}\u{FE0F}', label: 'air', features: ['propeller', 'small'], difficulty: 'medium' },
      { id: 'vt4', emoji: '\u{1F6F0}\u{FE0F}', label: 'space', features: ['orbit', 'ISS'], difficulty: 'medium' },
      { id: 'vt5', emoji: '\u{1F6B2}', label: 'land', features: ['pedals', '2 wheels'], difficulty: 'easy' },
      { id: 'vt6', emoji: '\u{1F6E1}\u{FE0F}', label: 'land', features: ['tank', 'treads'], difficulty: 'tricky' },
    ],
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getPetMood(accuracy: number, phase: Phase): PetMood {
  if (phase === 'welcome' || phase === 'adopt') return 'sleeping';
  if (phase === 'report') return 'celebrating';
  if (accuracy < 25) return 'confused';
  if (accuracy <= 50) return 'learning';
  if (accuracy <= 75) return 'smart';
  return 'genius';
}

function getEvolutionStage(totalCorrect: number): number {
  if (totalCorrect < 3) return 0; // Egg
  if (totalCorrect < 6) return 1; // Baby
  if (totalCorrect < 10) return 2; // Toddler
  if (totalCorrect < 15) return 3; // Kid
  if (totalCorrect < 20) return 4; // Teen
  return 5; // Genius
}

const EVOLUTION_LABELS = [
  'Egg \u{1F95A}',
  'Baby \u{1F423}',
  'Toddler \u{1F476}',
  'Kid \u{1F9D2}',
  'Teen \u{1F9D1}\u{200D}\u{1F4BB}',
  'Genius \u{1F9E0}',
];

// ================================================================
// MAIN COMPONENT
// ================================================================

export function PetTrainerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  // === Core state ===
  const [phase, setPhase] = useState<Phase>('welcome');
  const [pet, setPet] = useState(PETS[0]);
  const [petName, setPetName] = useState('');
  const [categorySetId, setCategorySetId] = useState('fruits');

  // === Training state ===
  const [currentItem, setCurrentItem] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalLabeled, setTotalLabeled] = useState(0);
  const [labelCounts, setLabelCounts] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // === Test state ===
  const [testIndex, setTestIndex] = useState(0);
  const [testResults, setTestResults] = useState<{ correct: boolean; predicted: string; actual: string }[]>([]);
  const [petThinking, setPetThinking] = useState(false);

  // === Particles ===
  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2.5 + 1, delay: Math.random() * 5, duration: Math.random() * 7 + 5,
    })), []);

  // === Derived ===
  const availableSets = useMemo(() =>
    CATEGORY_SETS.filter(s => BAND_ORDER[s.bandMin] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const categorySet = useMemo(() =>
    CATEGORY_SETS.find(s => s.id === categorySetId) || CATEGORY_SETS[1],
    [categorySetId]
  );
  const accuracy = totalLabeled > 0 ? Math.round((correctCount / totalLabeled) * 100) : 0;
  const mood = getPetMood(accuracy, phase);
  const evolutionStage = getEvolutionStage(correctCount);
  const description = ageBand === 'C' ? categorySet.descriptionC : categorySet.description;
  const testAccuracy = testResults.length > 0
    ? Math.round((testResults.filter(r => r.correct).length / testResults.length) * 100)
    : 0;

  // Check for overfitting (imbalanced labeling)
  const isOverfit = useMemo(() => {
    const counts = Object.values(labelCounts);
    if (counts.length < 2 || totalLabeled < 6) return false;
    const max = Math.max(...counts);
    return max / totalLabeled > 0.75;
  }, [labelCounts, totalLabeled]);

  // === Random pet reaction ===
  function getPetReaction(correct: boolean): string {
    const pool = correct ? pet.correctReactions : pet.wrongReactions;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function getPetThinking(): string {
    return pet.thinkingPhrases[Math.floor(Math.random() * pet.thinkingPhrases.length)];
  }

  // ================================================================
  // PHASE HANDLERS
  // ================================================================

  function handleAdopt() {
    if (!petName.trim()) return;
    setPhase('teach');
  }

  function handleStartTraining() {
    const counts: Record<string, number> = {};
    categorySet.categories.forEach(c => { counts[c.id] = 0; });
    setLabelCounts(counts);
    setCurrentItem(0);
    setCorrectCount(0);
    setTotalLabeled(0);
    setStreak(0);
    setBestStreak(0);
    setPhase('train');
  }

  function handleLabel(chosenLabel: string) {
    const item = categorySet.training[currentItem];
    if (!item) return;
    const isCorrect = item.label === chosenLabel;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    const newTotal = totalLabeled + 1;
    const newStreak = isCorrect ? streak + 1 : 0;
    setCorrectCount(newCorrect);
    setTotalLabeled(newTotal);
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);
    setLabelCounts(prev => ({ ...prev, [chosenLabel]: (prev[chosenLabel] || 0) + 1 }));
    if (isCorrect) {
      const streakBonus = newStreak >= 3 ? 3 : 0;
      game.updateScore(5 + streakBonus);
    }
    setShowFeedback({ correct: isCorrect, message: getPetReaction(isCorrect) });
    setTimeout(() => {
      setShowFeedback(null);
      const next = currentItem + 1;
      setCurrentItem(next);
      game.advanceRound();
      if (next >= categorySet.training.length) {
        setPhase('data-lab');
      }
    }, 1400);
  }

  function handleFinishDataLab() {
    setTestIndex(0);
    setTestResults([]);
    setPhase('test');
  }

  function handleTest() {
    if (testIndex >= categorySet.test.length) return;
    setPetThinking(true);
    setTimeout(() => {
      const testItem = categorySet.test[testIndex];
      // Pet's guess is influenced by training accuracy + a small random factor
      const guessChance = accuracy / 100;
      const isCorrect = Math.random() < guessChance;
      const predicted = isCorrect
        ? testItem.label
        : categorySet.categories.find(c => c.id !== testItem.label)?.id || testItem.label;
      setTestResults(prev => [...prev, { correct: isCorrect, predicted, actual: testItem.label }]);
      setPetThinking(false);
      if (isCorrect) game.updateScore(10);
      const nextIdx = testIndex + 1;
      setTestIndex(nextIdx);
      if (nextIdx >= categorySet.test.length) {
        setTimeout(() => {
          setPhase('report');
          game.completeGame();
        }, 1500);
      }
    }, 1800);
  }

  function handleReplay() {
    setPhase('teach');
    setCurrentItem(0);
    setCorrectCount(0);
    setTotalLabeled(0);
    setStreak(0);
    setBestStreak(0);
    setTestIndex(0);
    setTestResults([]);
  }

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <GameShell
      gameId="pet-trainer"
      title="AI Pet Trainer"
      worldNumber={2}
      worldColor="#8B5CF6"
      xpReward={30}
      totalRounds={categorySet.training.length}
      hints={3}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* === Particle Background === */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent" />
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{
                left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(139,92,246,${0.2 + p.size * 0.08}), transparent)`,
                boxShadow: `0 0 ${p.size * 3}px rgba(139,92,246,0.12)`,
              }}
              animate={{ y: [0, -20 - p.size * 6, 0], opacity: [0.15, 0.5, 0.15] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
          ))}
        </div>
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(rgba(139,92,246,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* === Chrome Bezel Frame === */}
        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(139,92,246,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 25px rgba(139,92,246,0.08)',
            }}>
            {/* LED Rim Top */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="flex-1 overflow-auto p-4 md:p-6">
              <AnimatePresence mode="wait">

                {/* ================================================= */}
                {/* PHASE 1: WELCOME                                   */}
                {/* ================================================= */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto text-center space-y-5 py-4">
                    <motion.div
                      animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.15)', '0 0 40px rgba(139,92,246,0.25)', '0 0 20px rgba(139,92,246,0.15)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/20"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))' }}>
                      <Heart className="w-4 h-4 text-purple-400" />
                      <span className="font-data text-xs text-purple-400 uppercase tracking-wider">Lab 2 &mdash; Teaching Machines</span>
                    </motion.div>

                    {/* 3D Pet Preview */}
                    <div className="flex justify-center">
                      <Pet3DScene emoji={'\u{1F95A}'} mood="sleeping" evolutionStage={0} size="lg" />
                    </div>

                    <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                      AI Pet Trainer
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm mx-auto leading-relaxed">
                      Adopt your very own AI pet and teach it to recognize things!
                      The better your training data, the smarter it gets.
                      Watch it evolve from an egg to a genius!
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Supervised Learning', 'Data Quality', 'Overfitting'].map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-[10px] text-purple-300/60">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <motion.button onClick={() => setPhase('adopt')}
                      className="w-full py-3.5 rounded-xl font-display font-bold text-sm text-white relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(139,92,246,0.35)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Start the AI Pet Trainer game">
                      Hatch Your Pet! {'\u{1F95A}'}
                    </motion.button>
                  </motion.div>
                )}

                {/* ================================================= */}
                {/* PHASE 2: ADOPT                                     */}
                {/* ================================================= */}
                {phase === 'adopt' && (
                  <motion.div key="adopt" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto text-center space-y-5">
                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">Choose Your AI Pet</h3>
                    <p className="font-body text-xs text-white/40">Each pet has a unique personality!</p>

                    {/* Pet grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {PETS.map((p, i) => (
                        <motion.button key={p.id}
                          onClick={() => { setPet(p); setPetName(''); }}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            pet.id === p.id
                              ? 'border-purple-500/60 bg-purple-500/10'
                              : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                          aria-label={`Select ${p.name} the ${p.id}`} aria-pressed={pet.id === p.id}>
                          <span className="text-3xl block">{p.emoji}</span>
                          <span className="font-display text-xs font-bold text-white mt-1 block">{p.name}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Selected pet personality */}
                    <AnimatePresence mode="wait">
                      <motion.div key={pet.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-xl p-3 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{pet.emoji}</span>
                          <span className="font-display text-sm font-bold text-white">{pet.name}</span>
                        </div>
                        <p className="font-body text-xs text-white/50">{pet.personality}</p>
                      </motion.div>
                    </AnimatePresence>

                    {/* Name input */}
                    <input type="text" value={petName} onChange={e => setPetName(e.target.value.slice(0, 14))}
                      placeholder={`Name your ${pet.name}...`}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-center text-base placeholder:text-white/20 focus:outline-none focus:border-purple-500/40"
                      aria-label="Name your pet" />

                    <motion.button onClick={handleAdopt} disabled={!petName.trim()}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white disabled:opacity-30"
                      style={{ background: petName.trim() ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(255,255,255,0.05)' }}
                      whileHover={petName.trim() ? { scale: 1.02 } : {}} whileTap={petName.trim() ? { scale: 0.98 } : {}}>
                      Adopt {petName || pet.name}! {'\u{2764}\u{FE0F}'}
                    </motion.button>
                  </motion.div>
                )}

                {/* ================================================= */}
                {/* PHASE 3: TEACH (choose category set)               */}
                {/* ================================================= */}
                {phase === 'teach' && (
                  <motion.div key="teach" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto text-center space-y-5">
                    {/* Pet with 3D scene */}
                    <div className="flex justify-center">
                      <Pet3DScene emoji={pet.emoji} mood="sleeping" evolutionStage={0} size="md" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">What should {petName} learn?</h3>
                      <p className="font-body text-xs text-white/40 mt-1">Pick a training category</p>
                    </div>
                    <div className="space-y-2">
                      {availableSets.map((set, i) => (
                        <motion.button key={set.id}
                          onClick={() => { setCategorySetId(set.id); }}
                          className={`w-full p-3 rounded-xl border text-left transition-all group ${
                            categorySetId === set.id
                              ? 'border-purple-500/40 bg-purple-500/10'
                              : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                          }`}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                          aria-label={`Category: ${set.title}`} aria-pressed={categorySetId === set.id}>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              {set.categories.map(c => (
                                <span key={c.id} className="text-lg">{c.emoji}</span>
                              ))}
                            </div>
                            <div className="flex-1">
                              <p className="font-display text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{set.title}</p>
                              <p className="font-body text-[10px] text-white/30">{set.categories.length} categories &middot; {set.training.length} items</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-purple-400 transition-colors" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    <div className="glass-card rounded-xl p-3 text-left">
                      <p className="font-body text-xs text-white/50">{description}</p>
                    </div>
                    <motion.button onClick={handleStartTraining}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Training! <Zap className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ================================================= */}
                {/* PHASE 4: TRAIN (label items)                       */}
                {/* ================================================= */}
                {phase === 'train' && currentItem < categorySet.training.length && (
                  <motion.div key="train" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto text-center space-y-4">
                    {/* Pet + mood display */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pet3DScene emoji={pet.emoji} mood={mood} evolutionStage={evolutionStage} size="sm" showSparkles={mood === 'genius'} />
                        <div className="text-left">
                          <p className="font-display text-xs font-bold text-white">{petName}</p>
                          <p className="font-body text-[10px] text-white/30">{EVOLUTION_LABELS[evolutionStage]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-data text-sm font-bold text-purple-400">{accuracy}%</p>
                        <p className="font-body text-[10px] text-white/30">accuracy</p>
                      </div>
                    </div>

                    {/* Accuracy bar */}
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }}
                        animate={{ width: `${accuracy}%` }} transition={{ duration: 0.5 }} />
                    </div>

                    {/* Streak indicator */}
                    {streak >= 2 && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="font-display text-[10px] font-bold text-amber-400">{streak}x Streak!</span>
                      </motion.div>
                    )}

                    {/* Current item */}
                    <motion.div key={`item-${currentItem}`} className="py-4"
                      initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 12 }}>
                      <span className="text-7xl md:text-8xl drop-shadow-lg">{categorySet.training[currentItem]?.emoji}</span>
                    </motion.div>

                    {/* Features (Band C only) */}
                    {ageBand === 'C' && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {categorySet.training[currentItem]?.features.map(f => (
                          <span key={f} className="px-2 py-0.5 rounded bg-white/5 font-mono text-[9px] text-white/30">{f}</span>
                        ))}
                      </div>
                    )}

                    <p className="font-body text-sm text-white/40">
                      Item {currentItem + 1}/{categorySet.training.length} &mdash; What is this?
                    </p>

                    {/* Category buckets */}
                    <div className={`grid gap-3 ${
                      categorySet.categories.length <= 2
                        ? 'grid-cols-2'
                        : categorySet.categories.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-2 md:grid-cols-4'
                    }`}>
                      {categorySet.categories.map(cat => (
                        <motion.button key={cat.id} onClick={() => handleLabel(cat.id)}
                          className="py-4 px-2 rounded-xl border-2 border-dashed transition-all"
                          style={{ borderColor: `${cat.color}30`, backgroundColor: `${cat.color}05` }}
                          whileHover={{ scale: 1.04, borderColor: `${cat.color}60`, backgroundColor: `${cat.color}15` }}
                          whileTap={{ scale: 0.96 }}
                          aria-label={`Label as ${cat.label}`}>
                          <span className="text-2xl block mb-1">{cat.emoji}</span>
                          <span className="font-display text-xs font-bold text-white">{cat.label}</span>
                          <span className="block font-body text-[9px] text-white/20 mt-0.5">{labelCounts[cat.id] || 0} labeled</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Pet speech bubble (feedback) */}
                    <AnimatePresence>
                      {showFeedback && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          className={`p-3 rounded-xl text-sm font-display font-bold ${
                            showFeedback.correct
                              ? 'bg-spark-green/10 text-spark-green border border-spark-green/20'
                              : 'bg-spark-orange/10 text-spark-orange border border-spark-orange/20'
                          }`}>
                          <span className="mr-2">{pet.emoji}</span>
                          {showFeedback.message}
                          {showFeedback.correct && streak >= 3 && <span className="ml-2 text-amber-400">{'\u{1F525}'} +3 bonus!</span>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ================================================= */}
                {/* PHASE 5: DATA LAB (review + overfitting)           */}
                {/* ================================================= */}
                {phase === 'data-lab' && (
                  <motion.div key="data-lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto text-center space-y-5">
                    <BarChart3 className="w-6 h-6 text-purple-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">Data Lab</h3>
                    <p className="font-body text-xs text-white/40">{"Let's look at your training data before testing!"}</p>

                    {/* Data balance chart */}
                    <div className="glass-card rounded-xl p-4 space-y-3">
                      <p className="font-display text-xs font-bold text-white/50 uppercase tracking-wider">Label Distribution</p>
                      {categorySet.categories.map(cat => {
                        const count = labelCounts[cat.id] || 0;
                        const pct = totalLabeled > 0 ? Math.round((count / totalLabeled) * 100) : 0;
                        return (
                          <div key={cat.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-body text-xs text-white/60">{cat.emoji} {cat.label}</span>
                              <span className="font-data text-xs font-bold" style={{ color: cat.color }}>{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <motion.div className="h-full rounded-full"
                                style={{ backgroundColor: cat.color }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats summary */}
                    <div className="flex gap-4 justify-center">
                      <div className="text-center">
                        <p className="font-data text-xl font-bold text-purple-400">{accuracy}%</p>
                        <p className="font-body text-[10px] text-white/30">Training Accuracy</p>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <p className="font-data text-xl font-bold text-amber-400">{bestStreak}</p>
                        <p className="font-body text-[10px] text-white/30">Best Streak</p>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <p className="font-data text-xl font-bold text-white">{EVOLUTION_LABELS[evolutionStage].split(' ')[0]}</p>
                        <p className="font-body text-[10px] text-white/30">Evolution</p>
                      </div>
                    </div>

                    {/* Overfitting warning */}
                    {isOverfit && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span className="font-display text-sm font-bold text-amber-400">Overfitting Alert!</span>
                        </div>
                        <p className="font-body text-xs text-white/60">
                          {petName} saw WAY more of one category than the others. Now it might think
                          everything is that type! This is called <strong className="text-white">overfitting</strong> &mdash;
                          when AI memorizes patterns instead of truly learning them.
                        </p>
                        {ageBand === 'C' && (
                          <p className="font-body text-xs text-white/40 mt-2 italic">
                            In ML terms: the model has high variance and may fail to generalize to the test distribution.
                            Balanced training data produces more robust decision boundaries.
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Teaching card */}
                    <div className="glass-card rounded-xl p-4 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-purple-400" />
                        <span className="font-display text-xs font-bold text-purple-400">Training vs Testing</span>
                      </div>
                      <p className="font-body text-xs text-white/50">
                        So far, {petName} has only seen the training data &mdash; items it was taught with.
                        {"Now we'll show it "}<strong className="text-white">completely new items</strong>{" it's never "}
                        seen before. This is how real AI is evaluated: can it handle the unknown?
                      </p>
                    </div>

                    <motion.button onClick={handleFinishDataLab}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start the Test! <FlaskConical className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ================================================= */}
                {/* PHASE 6: TEST                                      */}
                {/* ================================================= */}
                {phase === 'test' && testIndex <= categorySet.test.length && (
                  <motion.div key="test" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto text-center space-y-5">
                    <FlaskConical className="w-6 h-6 text-purple-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">Testing {petName}!</h3>
                    <p className="font-body text-xs text-white/40">
                      These are items {petName} has NEVER seen. Can it figure them out?
                    </p>

                    {testIndex < categorySet.test.length ? (
                      <>
                        {/* Test item */}
                        <motion.div key={`test-${testIndex}`}
                          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="py-4">
                          <span className="text-7xl drop-shadow-lg">{categorySet.test[testIndex]?.emoji}</span>
                        </motion.div>

                        {petThinking ? (
                          <motion.div className="flex flex-col items-center gap-2"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}>
                            <Pet3DScene emoji={pet.emoji} mood="learning" evolutionStage={evolutionStage} size="sm" />
                            <p className="font-body text-sm text-white/50 italic">&ldquo;{getPetThinking()}&rdquo;</p>
                          </motion.div>
                        ) : testResults.length > testIndex ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-display font-bold text-sm ${
                              testResults[testIndex].correct
                                ? 'bg-spark-green/10 text-spark-green border border-spark-green/20'
                                : 'bg-spark-orange/10 text-spark-orange border border-spark-orange/20'
                            }`}>
                            {testResults[testIndex].correct
                              ? <><CheckCircle2 className="w-5 h-5" /> {petName} got it!</>
                              : <><XCircle className="w-5 h-5" /> {petName} guessed wrong</>}
                          </motion.div>
                        ) : (
                          <motion.button onClick={handleTest}
                            className="px-8 py-3 rounded-xl font-display font-bold text-sm text-white"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Eye className="inline w-4 h-4 mr-2" /> Show to {petName}
                          </motion.button>
                        )}
                      </>
                    ) : null}

                    {/* Test progress dots */}
                    <div className="flex justify-center gap-2">
                      {categorySet.test.map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-all ${
                          i < testResults.length
                            ? testResults[i].correct ? 'bg-spark-green scale-110' : 'bg-red-500 scale-110'
                            : i === testIndex ? 'bg-purple-400 animate-pulse' : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ================================================= */}
                {/* PHASE 7: REPORT CARD                               */}
                {/* ================================================= */}
                {phase === 'report' && (
                  <motion.div key="report" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto text-center space-y-5">
                    {/* Celebrating pet */}
                    <div className="flex justify-center">
                      <Pet3DScene emoji={pet.emoji} mood="celebrating" evolutionStage={evolutionStage} size="lg" />
                    </div>

                    <h2 className="font-display text-xl font-bold text-white">
                      {petName}&apos;s Report Card!
                    </h2>
                    <p className="font-body text-xs text-white/40">Evolution: {EVOLUTION_LABELS[evolutionStage]}</p>

                    {/* Score rings */}
                    <div className="flex justify-center gap-8">
                      {[
                        { label: 'Training', value: accuracy, color: '#8B5CF6' },
                        { label: 'Test', value: testAccuracy, color: '#10B981' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="relative w-24 h-24">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <motion.circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 42}`}
                              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - value / 100) }}
                              transition={{ duration: 1.5, ease: 'easeOut' }}
                              style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-data text-lg font-bold text-white">{value}%</span>
                            <span className="font-body text-[9px] text-white/30">{label}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Confusion matrix for Band C */}
                    {ageBand === 'C' && testResults.length > 0 && (
                      <div className="glass-card rounded-xl p-4 text-left">
                        <p className="font-display text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Confusion Matrix</p>
                        <div className="grid gap-1" style={{ gridTemplateColumns: `auto ${categorySet.categories.map(() => '1fr').join(' ')}` }}>
                          <div /> {/* empty corner */}
                          {categorySet.categories.map(c => (
                            <div key={`col-${c.id}`} className="text-center font-mono text-[9px] text-white/30 px-1">{c.label.slice(0, 4)}</div>
                          ))}
                          {categorySet.categories.map(actual => (
                            <Fragment key={`row-${actual.id}`}>
                              <div className="font-mono text-[9px] text-white/30 flex items-center">{actual.label.slice(0, 4)}</div>
                              {categorySet.categories.map(predicted => {
                                const count = testResults.filter(r =>
                                  r.actual === actual.id && r.predicted === predicted.id
                                ).length;
                                const isCorrect = actual.id === predicted.id;
                                return (
                                  <div key={`${actual.id}-${predicted.id}`}
                                    className={`text-center py-1 rounded font-data text-xs font-bold ${
                                      isCorrect ? 'bg-spark-green/10 text-spark-green' : count > 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.02] text-white/15'
                                    }`}>
                                    {count}
                                  </div>
                                );
                              })}
                            </Fragment>
                          ))}
                        </div>
                        <p className="font-body text-[9px] text-white/20 mt-2 italic">Rows = actual, Columns = predicted</p>
                      </div>
                    )}

                    {/* What You Learned */}
                    <div className="rounded-xl p-4 border border-purple-500/20 text-left"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(139,92,246,0.02))' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="font-display text-sm font-bold text-purple-400">What You Learned</span>
                      </div>
                      <p className="font-body text-xs text-white/60 leading-relaxed">
                        You just did <strong className="text-white">supervised learning</strong>!
                        You gave {petName} labeled examples (training data), and it learned to recognize patterns.
                        {accuracy > testAccuracy + 15
                          ? ` Notice how training accuracy (${accuracy}%) is higher than test accuracy (${testAccuracy}%) \u2014 this gap means ${petName} may have overfit to the training data!`
                          : ` Great job! ${petName}'s test accuracy (${testAccuracy}%) is close to training accuracy (${accuracy}%), which means it learned to generalize well!`
                        }
                      </p>
                      {ageBand === 'C' && (
                        <p className="font-body text-xs text-white/40 mt-2 italic">
                          Key ML concepts practiced: supervised classification, train/test split, label quality, dataset balance,
                          generalization, {isOverfit ? 'overfitting detection,' : ''} and accuracy evaluation.
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      <motion.button onClick={handleReplay}
                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 font-display font-bold text-sm text-white/60 flex items-center justify-center gap-2"
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.98 }}>
                        <RotateCcw className="w-4 h-4" /> Train Again
                      </motion.button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            {/* LED Rim Bottom */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}

export default PetTrainerGame;
