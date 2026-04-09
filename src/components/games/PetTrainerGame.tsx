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

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { usePetTrainerAudio } from '@/hooks/usePetTrainerAudio';
import {
  Heart, Sparkles, Brain, Zap, ChevronRight, BarChart3,
  CheckCircle2, XCircle, RotateCcw, Eye,
  AlertTriangle, FlaskConical, GraduationCap,
} from 'lucide-react';
import { useAIContent } from '@/hooks/useAIContent';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// === Dynamic import for 3D pet (no SSR) ===

const Pet3DScene = dynamic(() => import('@/components/3d/Pet3DScene'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-48 rounded-full bg-purple-500/10 animate-pulse flex items-center justify-center">
      <span className="text-4xl animate-bounce">{'\u{1F95A}'}</span>
    </div>
  ),
});

// P6-A: 3D data lab bar chart
const PetDataLab3D = dynamic(() => import('@/components/3d/PetDataLab3D'), {
  ssr: false,
});

// ================================================================
// TYPES
// ================================================================

type Phase = 'welcome' | 'adopt' | 'teach' | 'train' | 'data-lab' | 'test' | 'report';
type TrainingMode = 'label' | 'speed-drill' | 'noise-challenge' | 'transfer-test';
type PetMood = 'sleeping' | 'confused' | 'learning' | 'smart' | 'genius' | 'celebrating'
  | 'frustrated' | 'curious' | 'proud' | 'sleepy';

interface PetConfig {
  id: string;
  speciesId: 'byteling' | 'sparkpaw' | 'voltkit' | 'cogsworth' | 'pixie';
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
// PET CONFIGURATIONS — 5 AI-themed creature species
// ================================================================
// Each species has unique personality, reactions, and procedural 3D form.
// Species config details in: src/config/creatureConfig.ts

const PETS: PetConfig[] = [
  {
    id: 'byteling', speciesId: 'byteling', emoji: '\u{1F7E6}', name: 'Byteling',
    personality: 'Logical, precise, loves organizing things.',
    correctReactions: ['Data confirmed! \u{2713}', '01100111! \u{1F389}', '*sorts happily*', 'Pattern matched! \u{1F4CA}'],
    wrongReactions: ['Error 404... \u{1F914}', '*recalculating*', 'Data mismatch...', 'Hmm, null result \u{1F605}'],
    thinkingPhrases: ['*processing data...*', '*scanning patterns...*', '*analyzing...*', '*computing...*'],
  },
  {
    id: 'sparkpaw', speciesId: 'sparkpaw', emoji: '\u{1F7E3}', name: 'Sparkpaw',
    personality: 'Curious, social, loves making connections between ideas.',
    correctReactions: ['Connection made! \u{1F9E0}', '*synapses fire*', 'Neural link! \u{2728}', 'Pattern found! \u{1F31F}'],
    wrongReactions: ['Signal lost... \u{1F914}', '*reconnecting*', 'Weak signal...', 'Need more data... \u{1F605}'],
    thinkingPhrases: ['*forming connections...*', '*synapsing...*', '*linking nodes...*', '*propagating...*'],
  },
  {
    id: 'voltkit', speciesId: 'voltkit', emoji: '\u{26A1}', name: 'Voltkit',
    personality: 'Energetic, fast, loves speed and efficiency.',
    correctReactions: ['CHARGED! \u{26A1}', '*sparks fly*', 'Power surge! \u{1F50B}', 'Maximum output! \u{1F4A5}'],
    wrongReactions: ['Short circuit... \u{26A1}', '*fizzle*', 'Low power...', 'Recharging... \u{1F50C}'],
    thinkingPhrases: ['*charging up...*', '*calculating watts...*', '*boosting power...*', '*energizing...*'],
  },
  {
    id: 'cogsworth', speciesId: 'cogsworth', emoji: '\u{2699}\u{FE0F}', name: 'Cogsworth',
    personality: 'Methodical, creative, loves building and tinkering.',
    correctReactions: ['Built it! \u{1F527}', '*gears click*', 'Mechanism works! \u{2699}\u{FE0F}', 'Assembly complete! \u{1F3D7}\u{FE0F}'],
    wrongReactions: ['Gears jammed... \u{1F529}', '*steam hiss*', 'Misaligned...', 'Needs recalibration... \u{1F6E0}\u{FE0F}'],
    thinkingPhrases: ['*turning gears...*', '*measuring twice...*', '*blueprinting...*', '*calibrating...*'],
  },
  {
    id: 'pixie', speciesId: 'pixie', emoji: '\u{1F441}\u{FE0F}', name: 'Pixie',
    personality: 'Observant, analytical, loves discovering hidden patterns.',
    correctReactions: ['Spotted it! \u{1F441}\u{FE0F}', '*lens focuses*', 'Pattern detected! \u{1F50D}', 'Crystal clear! \u{2728}'],
    wrongReactions: ['Blurry... \u{1F635}\u{200D}\u{1F4AB}', '*refocusing*', 'Out of focus...', 'Need another look... \u{1F50E}'],
    thinkingPhrases: ['*scanning...*', '*analyzing pixels...*', '*focusing lens...*', '*detecting patterns...*'],
  },
  // === NEW PETS (Phase D2 expansion) ===
  {
    id: 'glitchfox', speciesId: 'pixie' as PetConfig['speciesId'], emoji: '\u{1F98A}', name: 'Glitchfox',
    personality: 'Mischievous — sometimes mislabels on purpose, teaches error correction.',
    correctReactions: ['*wink* Got it! \u{1F609}', 'Even I can\u2019t trick that! \u{1F98A}', '*tail wags*', 'Too easy! \u{2728}'],
    wrongReactions: ['Hehe, fooled ya! \u{1F92D}', '*pixelates*', 'Oops... or was that on purpose? \u{1F98A}', '*glitches*'],
    thinkingPhrases: ['*scheming...*', '*plotting mischief...*', '*tail flickers...*', '*calculating trick...*'],
  },
  {
    id: 'datawing', speciesId: 'voltkit' as PetConfig['speciesId'], emoji: '\u{1F9DA}', name: 'Datawing',
    personality: 'Precise — learns faster but fragile (accuracy drops with bad data).',
    correctReactions: ['Wings shimmer! \u{2728}', 'Data stream clear! \u{1F4A0}', '*flies higher*', 'Perfect signal! \u{1F4E1}'],
    wrongReactions: ['Wings dim... \u{1F614}', '*flutter weakens*', 'Corrupted data...', '*lands softly*'],
    thinkingPhrases: ['*wings processing...*', '*data streaming...*', '*signal analyzing...*', '*hovering...*'],
  },
  {
    id: 'neurohound', speciesId: 'cogsworth' as PetConfig['speciesId'], emoji: '\u{1F415}', name: 'Neurohound',
    personality: 'Loyal — retains categories better, teaches memory/retention.',
    correctReactions: ['*bark bark!* \u{1F415}', 'Fetched the answer! \u{1F9E0}', '*tail wags fast*', 'Good boy knows! \u{1F31F}'],
    wrongReactions: ['*whimper* \u{1F43E}', '*tilts head*', 'Lost the scent...', '*sniffs confused*'],
    thinkingPhrases: ['*sniffing data...*', '*tracking pattern...*', '*ears perked...*', '*nose twitching...*'],
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
  // === NEW CATEGORIES (Phase D2 expansion) ===
  {
    id: 'instruments', title: 'Instruments', bandMin: 'B',
    description: 'Teach your pet to recognize musical instruments by their shape and sound!',
    descriptionC: 'Multi-class classification of instruments by acoustic and visual features. Tests feature selection across modalities.',
    categories: [
      { id: 'string', label: 'String', emoji: '\u{1F3B8}', color: '#F59E0B' },
      { id: 'wind', label: 'Wind', emoji: '\u{1F3BA}', color: '#06B6D4' },
      { id: 'percussion', label: 'Percussion', emoji: '\u{1F941}', color: '#EF4444' },
    ],
    training: [
      { id: 'in1', emoji: '\u{1F3B8}', label: 'string', features: ['plucked', 'frets', 'resonance'], difficulty: 'easy' },
      { id: 'in2', emoji: '\u{1F3BB}', label: 'string', features: ['bowed', 'strings', 'wood'], difficulty: 'easy' },
      { id: 'in3', emoji: '\u{1F3BA}', label: 'wind', features: ['brass', 'valves', 'blown'], difficulty: 'easy' },
      { id: 'in4', emoji: '\u{1F3B7}', label: 'wind', features: ['reed', 'keys', 'woodwind'], difficulty: 'medium' },
      { id: 'in5', emoji: '\u{1F941}', label: 'percussion', features: ['struck', 'sticks', 'membrane'], difficulty: 'easy' },
      { id: 'in6', emoji: '\u{1F3B9}', label: 'string', features: ['keys', 'hammers', 'strings inside'], difficulty: 'tricky' },
      { id: 'in7', emoji: '\u{1FA97}', label: 'wind', features: ['blown', 'holes', 'wood'], difficulty: 'medium' },
      { id: 'in8', emoji: '\u{1FA87}', label: 'percussion', features: ['shaken', 'metal', 'bell'], difficulty: 'medium' },
    ],
    test: [
      { id: 'int1', emoji: '\u{1FA95}', label: 'string', features: ['plucked', 'small'], difficulty: 'medium' },
      { id: 'int2', emoji: '\u{1F3BA}', label: 'wind', features: ['brass', 'long'], difficulty: 'easy' },
      { id: 'int3', emoji: '\u{1F941}', label: 'percussion', features: ['hit', 'skin'], difficulty: 'easy' },
    ],
  },
  {
    id: 'weather', title: 'Weather', bandMin: 'A',
    description: 'Is it sunny or rainy? Teach your pet about weather!',
    descriptionC: 'Multi-class classification of meteorological phenomena from visual and sensor features.',
    categories: [
      { id: 'sunny', label: 'Sunny', emoji: '\u2600\uFE0F', color: '#F59E0B' },
      { id: 'rainy', label: 'Rainy', emoji: '\u{1F327}\uFE0F', color: '#3B82F6' },
      { id: 'snowy', label: 'Snowy', emoji: '\u2744\uFE0F', color: '#E5E7EB' },
    ],
    training: [
      { id: 'w1', emoji: '\u2600\uFE0F', label: 'sunny', features: ['bright', 'warm', 'clear sky'], difficulty: 'easy' },
      { id: 'w2', emoji: '\u{1F327}\uFE0F', label: 'rainy', features: ['wet', 'clouds', 'drops'], difficulty: 'easy' },
      { id: 'w3', emoji: '\u2744\uFE0F', label: 'snowy', features: ['cold', 'white', 'flakes'], difficulty: 'easy' },
      { id: 'w4', emoji: '\u{1F31E}', label: 'sunny', features: ['hot', 'no clouds'], difficulty: 'easy' },
      { id: 'w5', emoji: '\u{1F326}\uFE0F', label: 'rainy', features: ['partly cloudy', 'drizzle'], difficulty: 'medium' },
      { id: 'w6', emoji: '\u26C4', label: 'snowy', features: ['freezing', 'snowman'], difficulty: 'easy' },
      { id: 'w7', emoji: '\u{1F324}\uFE0F', label: 'sunny', features: ['few clouds', 'warm breeze'], difficulty: 'medium' },
      { id: 'w8', emoji: '\u26C8\uFE0F', label: 'rainy', features: ['thunder', 'lightning', 'storm'], difficulty: 'tricky' },
    ],
    test: [
      { id: 'wt1', emoji: '\u{1F305}', label: 'sunny', features: ['sunrise', 'warm'], difficulty: 'medium' },
      { id: 'wt2', emoji: '\u{1F302}', label: 'rainy', features: ['umbrella', 'wet'], difficulty: 'easy' },
      { id: 'wt3', emoji: '\u{1F328}\uFE0F', label: 'snowy', features: ['blizzard', 'heavy snow'], difficulty: 'medium' },
    ],
  },
  {
    id: 'emotions', title: 'Emotions', bandMin: 'B',
    description: 'Teach your pet to recognize feelings from facial expressions!',
    descriptionC: 'Facial expression classification — a real-world computer vision task. Tests ability to distinguish subtle feature variations.',
    categories: [
      { id: 'happy', label: 'Happy', emoji: '\u{1F60A}', color: '#F59E0B' },
      { id: 'sad', label: 'Sad', emoji: '\u{1F622}', color: '#3B82F6' },
      { id: 'angry', label: 'Angry', emoji: '\u{1F620}', color: '#EF4444' },
    ],
    training: [
      { id: 'em1', emoji: '\u{1F60A}', label: 'happy', features: ['smile', 'bright eyes', 'relaxed'], difficulty: 'easy' },
      { id: 'em2', emoji: '\u{1F622}', label: 'sad', features: ['tears', 'downturned', 'droopy'], difficulty: 'easy' },
      { id: 'em3', emoji: '\u{1F620}', label: 'angry', features: ['frown', 'furrowed brow', 'tense'], difficulty: 'easy' },
      { id: 'em4', emoji: '\u{1F604}', label: 'happy', features: ['grinning', 'open mouth', 'joy'], difficulty: 'easy' },
      { id: 'em5', emoji: '\u{1F62D}', label: 'sad', features: ['crying loudly', 'distress'], difficulty: 'easy' },
      { id: 'em6', emoji: '\u{1F624}', label: 'angry', features: ['steam', 'frustrated', 'red face'], difficulty: 'medium' },
      { id: 'em7', emoji: '\u{1F970}', label: 'happy', features: ['hearts', 'loving', 'warmth'], difficulty: 'medium' },
      { id: 'em8', emoji: '\u{1F625}', label: 'sad', features: ['disappointed', 'cold sweat'], difficulty: 'medium' },
    ],
    test: [
      { id: 'emt1', emoji: '\u{1F642}', label: 'happy', features: ['slight smile'], difficulty: 'tricky' },
      { id: 'emt2', emoji: '\u{1F61E}', label: 'sad', features: ['disappointed'], difficulty: 'medium' },
      { id: 'emt3', emoji: '\u{1F621}', label: 'angry', features: ['pouting', 'red'], difficulty: 'easy' },
    ],
  },
  {
    id: 'foods', title: 'Foods', bandMin: 'A',
    description: 'Pizza or sushi? Teach your pet to sort yummy foods!',
    descriptionC: 'Multi-class food classification with visual similarity challenges between categories.',
    categories: [
      { id: 'pizza', label: 'Italian', emoji: '\u{1F355}', color: '#EF4444' },
      { id: 'sushi', label: 'Japanese', emoji: '\u{1F363}', color: '#10B981' },
      { id: 'taco', label: 'Mexican', emoji: '\u{1F32E}', color: '#F59E0B' },
    ],
    training: [
      { id: 'fd1', emoji: '\u{1F355}', label: 'pizza', features: ['round', 'cheese', 'tomato'], difficulty: 'easy' },
      { id: 'fd2', emoji: '\u{1F363}', label: 'sushi', features: ['rice', 'fish', 'seaweed'], difficulty: 'easy' },
      { id: 'fd3', emoji: '\u{1F32E}', label: 'taco', features: ['shell', 'meat', 'salsa'], difficulty: 'easy' },
      { id: 'fd4', emoji: '\u{1F35D}', label: 'pizza', features: ['pasta', 'sauce', 'Italian'], difficulty: 'medium' },
      { id: 'fd5', emoji: '\u{1F371}', label: 'sushi', features: ['bento', 'rice', 'Japanese'], difficulty: 'medium' },
      { id: 'fd6', emoji: '\u{1F32F}', label: 'taco', features: ['wrap', 'beans', 'Mexican'], difficulty: 'easy' },
      { id: 'fd7', emoji: '\u{1F9C0}', label: 'pizza', features: ['cheese', 'Italian'], difficulty: 'tricky' },
      { id: 'fd8', emoji: '\u{1F961}', label: 'sushi', features: ['chopsticks', 'Japanese'], difficulty: 'medium' },
    ],
    test: [
      { id: 'fdt1', emoji: '\u{1F372}', label: 'pizza', features: ['stew', 'Italian'], difficulty: 'tricky' },
      { id: 'fdt2', emoji: '\u{1F365}', label: 'sushi', features: ['fish cake', 'Japanese'], difficulty: 'medium' },
      { id: 'fdt3', emoji: '\u{1FAD4}', label: 'taco', features: ['tamale', 'Mexican'], difficulty: 'medium' },
    ],
  },
  {
    id: 'clothing', title: 'Clothing', bandMin: 'B',
    description: 'Teach your pet to sort clothes by what part of the body they go on!',
    descriptionC: 'Hierarchical classification by body region — tests grouping by functional rather than visual features.',
    categories: [
      { id: 'head', label: 'Head', emoji: '\u{1F3A9}', color: '#8B5CF6' },
      { id: 'body', label: 'Body', emoji: '\u{1F455}', color: '#3B82F6' },
      { id: 'feet', label: 'Feet', emoji: '\u{1F45F}', color: '#10B981' },
    ],
    training: [
      { id: 'cl1', emoji: '\u{1F3A9}', label: 'head', features: ['hat', 'top', 'shade'], difficulty: 'easy' },
      { id: 'cl2', emoji: '\u{1F455}', label: 'body', features: ['shirt', 'torso', 'sleeves'], difficulty: 'easy' },
      { id: 'cl3', emoji: '\u{1F45F}', label: 'feet', features: ['shoe', 'sole', 'laces'], difficulty: 'easy' },
      { id: 'cl4', emoji: '\u{1F9E2}', label: 'head', features: ['cap', 'brim', 'adjustable'], difficulty: 'easy' },
      { id: 'cl5', emoji: '\u{1F457}', label: 'body', features: ['dress', 'full body', 'fabric'], difficulty: 'easy' },
      { id: 'cl6', emoji: '\u{1F462}', label: 'feet', features: ['boot', 'heel', 'leather'], difficulty: 'easy' },
      { id: 'cl7', emoji: '\u{1F576}\uFE0F', label: 'head', features: ['glasses', 'eyes', 'lenses'], difficulty: 'medium' },
      { id: 'cl8', emoji: '\u{1F9E5}', label: 'body', features: ['coat', 'warm', 'outer'], difficulty: 'medium' },
    ],
    test: [
      { id: 'clt1', emoji: '\u{1F451}', label: 'head', features: ['crown', 'royal'], difficulty: 'easy' },
      { id: 'clt2', emoji: '\u{1F9E3}', label: 'body', features: ['scarf', 'neck'], difficulty: 'tricky' },
      { id: 'clt3', emoji: '\u{1FA74}', label: 'feet', features: ['flip-flop', 'beach'], difficulty: 'easy' },
    ],
  },
  {
    id: 'vehicles-advanced', title: 'Vehicles (Advanced)', bandMin: 'C',
    description: 'Sort unusual vehicles your pet has never seen before!',
    descriptionC: 'Transfer learning test — classify novel vehicle types using features learned from the basic Vehicles category.',
    categories: [
      { id: 'land', label: 'Land', emoji: '\u{1F698}', color: '#10B981' },
      { id: 'water', label: 'Water', emoji: '\u{1F6A2}', color: '#3B82F6' },
      { id: 'air', label: 'Air', emoji: '\u{2708}\u{FE0F}', color: '#F59E0B' },
      { id: 'space', label: 'Space', emoji: '\u{1F680}', color: '#8B5CF6' },
    ],
    training: [
      { id: 'va1', emoji: '\u{1F6F5}', label: 'land', features: ['scooter', '2 wheels', 'motor'], difficulty: 'easy' },
      { id: 'va2', emoji: '\u{1F6F6}', label: 'water', features: ['canoe', 'paddle', 'river'], difficulty: 'easy' },
      { id: 'va3', emoji: '\u{1F6A1}', label: 'air', features: ['cable car', 'suspended', 'wire'], difficulty: 'medium' },
      { id: 'va4', emoji: '\u{1F6F8}', label: 'space', features: ['UFO', 'hovering', 'unknown'], difficulty: 'tricky' },
      { id: 'va5', emoji: '\u{1F6FA}', label: 'land', features: ['auto-rickshaw', '3 wheels'], difficulty: 'medium' },
      { id: 'va6', emoji: '\u{26F5}', label: 'water', features: ['sailboat', 'wind', 'hull'], difficulty: 'easy' },
      { id: 'va7', emoji: '\u{1F6EB}', label: 'air', features: ['jet', 'takeoff', 'thrust'], difficulty: 'easy' },
      { id: 'va8', emoji: '\u{1F6F0}\uFE0F', label: 'space', features: ['satellite', 'orbit', 'solar'], difficulty: 'medium' },
    ],
    test: [
      { id: 'vat1', emoji: '\u{1F6B2}', label: 'land', features: ['bicycle', 'pedals'], difficulty: 'easy' },
      { id: 'vat2', emoji: '\u{1F6F3}\uFE0F', label: 'water', features: ['cruise', 'large'], difficulty: 'easy' },
      { id: 'vat3', emoji: '\u{1F3A0}', label: 'air', features: ['hot air balloon'], difficulty: 'tricky' },
      { id: 'vat4', emoji: '\u{1F680}', label: 'space', features: ['rocket', 'launch'], difficulty: 'easy' },
    ],
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getPetMood(accuracy: number, phase: Phase, streak: number, totalLabeled: number): PetMood {
  if (phase === 'welcome' || phase === 'adopt') return 'sleeping';
  if (phase === 'report') return 'celebrating';
  // Phase D2: new mood triggers
  if (totalLabeled > 15 && accuracy < 40) return 'sleepy'; // 15+ items without break, low accuracy
  if (streak < 0 && Math.abs(streak) >= 3) return 'frustrated'; // 3+ consecutive wrong
  if (totalLabeled === 0 && phase === 'teach') return 'curious'; // new category introduced
  if (accuracy >= 90) return 'genius';
  if (accuracy >= 75) return 'smart';
  if (accuracy >= 50) return 'learning';
  if (accuracy >= 25) return 'confused';
  return 'confused';
}

function getEvolutionStage(totalCorrect: number, categoriesCompleted: number): number {
  if (totalCorrect < 3) return 0; // Egg
  if (totalCorrect < 6) return 1; // Baby
  if (totalCorrect < 10) return 2; // Toddler
  if (totalCorrect < 15) return 3; // Kid
  if (totalCorrect < 20) return 4; // Teen
  if (totalCorrect < 30) return 5; // Genius
  // Phase D2: new evolution stages
  if (categoriesCompleted >= 3) return 6; // Specialist
  if (categoriesCompleted >= 6) return 7; // Master
  return 5; // Genius (default high)
}

const EVOLUTION_LABELS = [
  'Egg \u{1F95A}',
  'Baby \u{1F423}',
  'Toddler \u{1F476}',
  'Kid \u{1F9D2}',
  'Teen \u{1F9D1}\u{200D}\u{1F4BB}',
  'Genius \u{1F9E0}',
  'Specialist \u{1F3AF}',    // Phase D2: 3+ categories at 90%+ accuracy
  'Master \u{1F451}',         // Phase D2: 6+ categories at 95%+ accuracy
];

// Phase D2: Mood effects on learning
const _MOOD_EFFECTS: Record<string, number> = {
  sleeping: 0, confused: 0.7, learning: 1, smart: 1.2, genius: 1.5, celebrating: 1.3,
  frustrated: 0.8, curious: 1.3, proud: 1.1, sleepy: 0.6,
};

// Phase D2: Pet customization accessories
const _ACCESSORIES = [
  { id: 'basic-hat', label: 'Basic Hat', emoji: '\u{1F3A9}', unlock: 'First evolution' },
  { id: 'collar', label: 'Collar', emoji: '\u{1F4BF}', unlock: '50 correct labels' },
  { id: 'speed-goggles', label: 'Speed Goggles', emoji: '\u{1F97D}', unlock: 'Complete Speed Drill' },
  { id: 'noise-headphones', label: 'Noise Headphones', emoji: '\u{1F3A7}', unlock: 'Complete Noise Challenge' },
  { id: 'professor-glasses', label: 'Professor Glasses', emoji: '\u{1F453}', unlock: 'Complete Transfer Test' },
  { id: 'category-badge', label: 'Category Badge', emoji: '\u{1F3C5}', unlock: 'Reach Specialist' },
  { id: 'crown', label: 'Crown & Aura', emoji: '\u{1F451}', unlock: 'Reach Master' },
];

// ================================================================
// MAIN COMPONENT
// ================================================================

// Phase F: AI-generated category button
function SurpriseMeButton({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const ai = useAIContent('pet-trainer', 'pet-novel-category', ageBand);
  return (
    <button
      onClick={() => ai.generate({ existing: 'Shapes, Fruits, Animals, Vehicles, Instruments, Weather, Emotions, Foods, Clothing, Vehicles Advanced' })}
      disabled={ai.isLoading}
      className="w-full py-2 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 font-display text-xs text-yellow-300 hover:text-yellow-200 disabled:opacity-40"
      aria-label="Generate a surprise AI category"
    >
      {ai.isLoading ? 'Generating...' : ai.data ? `AI Category: ${JSON.stringify(ai.data).slice(0, 40)}...` : '\u{2728} Surprise Me! (AI Category)'}
      {ai.error && <span className="block text-2xs text-red-400 mt-1">{ai.error}</span>}
    </button>
  );
}

export function PetTrainerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('pet-trainer', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges

  // === Core state ===
  const [phase, setPhase] = useState<Phase>('welcome');
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
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

  // Phase D2: Training mode state
  const [_trainingMode, _setTrainingMode] = useState<TrainingMode>('label');
  const [_speedDrillTimer, _setSpeedDrillTimer] = useState(30);
  const [_speedDrillActive, _setSpeedDrillActive] = useState(false);
  const [_noiseItems, _setNoiseItems] = useState<{ item: TrainingItem; isNoise: boolean }[]>([]);
  const [_transferSourceCategory, _setTransferSourceCategory] = useState<string | null>(null);
  const [_unlockedAccessories, _setUnlockedAccessories] = useState<string[]>([]);
  const [_equippedAccessory, _setEquippedAccessory] = useState<string | null>(null);
  const [_categoriesCompleted, _setCategoriesCompleted] = useState<string[]>([]);
  const _speedDrillRef = useRef<NodeJS.Timeout | null>(null);

  // P2: Audio integration
  const audio = usePetTrainerAudio();
  const [soundEnabled] = useState(false);

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
  const mood = getPetMood(accuracy, phase, streak, totalLabeled);
  const evolutionStage = getEvolutionStage(correctCount, _categoriesCompleted.length);
  // Map new moods to original 6 for Pet3DScene compatibility
  const mood3D: 'sleeping' | 'confused' | 'learning' | 'smart' | 'genius' | 'celebrating' =
    mood === 'frustrated' ? 'confused' : mood === 'curious' ? 'learning'
      : mood === 'proud' ? 'smart' : mood === 'sleepy' ? 'sleeping' : mood;

  // P1: Cockpit broadcast integration
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  // P4: CeremonyFX milestones
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);
  const prevEvolution = useRef(0);
  useEffect(() => {
    if (evolutionStage > prevEvolution.current) {
      broadcast({ type: 'celebration-start', source: 'pet-trainer', value: evolutionStage, color: '#8B5CF6' });
      triggerCelebration('confetti');
      if (soundEnabled) audio.playEvolution(evolutionStage);
      prevEvolution.current = evolutionStage;
    }
  }, [evolutionStage, broadcast, triggerCelebration, soundEnabled, audio]);
  const description = ageBand === 'C' ? categorySet.descriptionC : categorySet.description;
  const testAccuracy = testResults.length > 0
    ? Math.round((testResults.filter(r => r.correct).length / testResults.length) * 100)
    : 0;

  // S6-CRIT-002: Register 3D scene content with sceneStore (D3D-B1)
  // P6-A: PetDataLab3D shown alongside pet during data-lab phase
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const dataLabBars = useMemo(() => {
    return Object.entries(labelCounts).map(([label, count]) => ({
      label,
      count: count as number,
      color: '#8B5CF6',
    }));
  }, [labelCounts]);

  // Check for overfitting (imbalanced labeling)
  const isOverfit = useMemo(() => {
    const counts = Object.values(labelCounts);
    if (counts.length < 2 || totalLabeled < 6) return false;
    const max = Math.max(...counts);
    return max / totalLabeled > 0.75;
  }, [labelCounts, totalLabeled]);

  useEffect(() => {
    const sceneContent = (
      <>
        <Pet3DScene
          emoji={pet.emoji}
          speciesId={pet.speciesId}
          mood={mood3D}
          evolutionStage={evolutionStage}
          labColor="#8B5CF6"
        />
        {phase === 'data-lab' && dataLabBars.length > 0 && (
          <PetDataLab3D
            data={dataLabBars}
            totalItems={totalLabeled}
            isOverfit={isOverfit}
            labColor="#8B5CF6"
          />
        )}
      </>
    );
    setGameSceneContent(sceneContent);
    return () => setGameSceneContent(null);
  }, [pet, mood3D, evolutionStage, phase, dataLabBars, totalLabeled, isOverfit, setGameSceneContent]);

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
    // P2: Audio feedback
    if (soundEnabled) {
      if (isCorrect) { audio.playCorrect(); if (newStreak >= 3) audio.playStreak(newStreak); }
      else audio.playWrong();
    }
    // P1: Broadcast training action to cockpit
    broadcast({ type: 'button-press', source: 'pet-trainer', value: isCorrect ? 1 : 0, color: '#8B5CF6' });
    if (accuracy > 0 && accuracy % 25 === 0) {
      broadcast({ type: 'dial-rotate', source: 'pet-trainer', value: accuracy / 100, color: '#8B5CF6' });
    }
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
                      <Pet3DScene emoji={'\u{1F95A}'} speciesId="byteling" mood="sleeping" evolutionStage={0} size="lg" />
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
                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-2xs text-purple-300/60">
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
                      <Pet3DScene emoji={pet.emoji} speciesId={pet.speciesId} mood="sleeping" evolutionStage={0} size="md" />
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
                              <p className="font-body text-2xs text-white/30">{set.categories.length} categories &middot; {set.training.length} items</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-purple-400 transition-colors" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    {/* Phase F: AI-generated "Surprise me!" category */}
                    <SurpriseMeButton ageBand={ageBand} />
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
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={currentItem + 1} total={categorySet.training.length} labColor="#AA66FF" />
                    </div>
                    {/* Pet + mood display */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pet3DScene emoji={pet.emoji} speciesId={pet.speciesId} mood={mood3D} evolutionStage={evolutionStage} size="sm" showSparkles={mood === 'genius'} />
                        <div className="text-left">
                          <p className="font-display text-xs font-bold text-white">{petName}</p>
                          <p className="font-body text-2xs text-white/30">{EVOLUTION_LABELS[evolutionStage]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-data text-sm font-bold text-purple-400">{accuracy}%</p>
                        <p className="font-body text-2xs text-white/30">accuracy</p>
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
                        <span className="font-display text-2xs font-bold text-amber-400">{streak}x Streak!</span>
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
                          <span key={f} className="px-2 py-0.5 rounded bg-white/5 font-mono text-2xs text-white/30">{f}</span>
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
                          <span className="block font-body text-2xs text-white/20 mt-0.5">{labelCounts[cat.id] || 0} labeled</span>
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
                        <p className="font-body text-2xs text-white/30">Training Accuracy</p>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <p className="font-data text-xl font-bold text-amber-400">{bestStreak}</p>
                        <p className="font-body text-2xs text-white/30">Best Streak</p>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <p className="font-data text-xl font-bold text-white">{EVOLUTION_LABELS[evolutionStage].split(' ')[0]}</p>
                        <p className="font-body text-2xs text-white/30">Evolution</p>
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
                            <Pet3DScene emoji={pet.emoji} speciesId={pet.speciesId} mood="learning" evolutionStage={evolutionStage} size="sm" />
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
                      <Pet3DScene emoji={pet.emoji} speciesId={pet.speciesId} mood="celebrating" evolutionStage={evolutionStage} size="lg" />
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
                            <span className="font-body text-2xs text-white/30">{label}</span>
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
                            <div key={`col-${c.id}`} className="text-center font-mono text-2xs text-white/30 px-1">{c.label.slice(0, 4)}</div>
                          ))}
                          {categorySet.categories.map(actual => (
                            <Fragment key={`row-${actual.id}`}>
                              <div className="font-mono text-2xs text-white/30 flex items-center">{actual.label.slice(0, 4)}</div>
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
                        <p className="font-body text-2xs text-white/20 mt-2 italic">Rows = actual, Columns = predicted</p>
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
