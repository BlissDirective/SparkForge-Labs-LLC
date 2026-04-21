// ════════════════════════════════════════════════════════════════════════
// EMOJI DECODER — Lab 8 (Words & Language) — ENHANCED STANDARD
//
// FEATURES:
// 1. Emoji sequence puzzles — decode emoji combos into sentences
// 2. AI vs Human interpretation comparison — see how AI reads emojis
// 3. Animated emoji reveal with bounce-in and glow effects
// 4. Streak bonus system with combo multiplier
// 5. Difficulty tiers filtered by age band (A=easy+medium, B=+tricky)
// 6. "Emoji Lab" bonus round — kids create their own emoji sentence
// 7. Welcome phase, learn phase with 4 NLP concept cards
// 8. Chrome bezel (indigo, Lab 8), particles, ARIA labels
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGame } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';

// 3D scene content — rendered inside CockpitCanvas via sceneStore (D3D-B3, S7-HIGH-002)
const EmojiDecoder3D = dynamic(
  () => import('@/components/3d/EmojiDecoder3D'),
  { ssr: false }
);
import {
  Play, BookOpen, Sparkles, Zap, ArrowRight,
  Brain, Lightbulb, Award, Send
} from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// ──── Types ────
type Phase = 'welcome' | 'learn' | 'play' | 'lab' | 'complete';
type Difficulty = 'easy' | 'medium' | 'tricky';

interface EmojiRound {
  id: string;
  emojis: string;
  correctAnswer: string;
  wrongAnswers: string[];
  aiInterpretation: string;
  funFact: string;
  funFactB: string;
  difficulty: Difficulty;
  category: string;
  bandMin: 'A' | 'B';
  isAI?: boolean;
}

interface ConceptCard {
  emoji: string;
  title: string;
  description: string;
  descriptionB: string;
  color: string;
}

// ──── Concept Cards (Learn Phase) ────
const CONCEPT_CARDS: ConceptCard[] = [
  {
    emoji: '\u{1F4AC}',
    title: 'Language is Tricky!',
    description: 'Words can mean different things! "Cool" can mean cold or awesome. AI has to figure out which one you mean!',
    descriptionB: 'Natural Language Processing (NLP) helps AI understand human language \u2014 including ambiguity, slang, and context-dependent meaning.',
    color: '#818CF8',
  },
  {
    emoji: '\u{1F600}',
    title: 'Emojis Are a Language',
    description: 'Emojis are like tiny pictures that tell a story. You use them every day \u2014 and AI is learning to read them too!',
    descriptionB: 'Emojis carry semantic meaning \u2014 a smiley face communicates emotion just like words do. AI tokenizers map each emoji to a unique ID.',
    color: '#A78BFA',
  },
  {
    emoji: '\u{1F916}',
    title: 'AI Reads Differently',
    description: 'AI doesn\'t "see" emojis like you do. It turns them into numbers and looks for patterns!',
    descriptionB: 'AI converts emojis to numerical tokens and uses surrounding context to infer meaning \u2014 a process called contextual embedding.',
    color: '#6366F1',
  },
  {
    emoji: '\u{1F511}',
    title: 'Context is the Key',
    description: '\u2764\uFE0F + \u{1F3E0} = "I love home!" or "Homesick!" \u2014 the same emojis can mean different things depending on context!',
    descriptionB: 'Context disambiguation is a core NLP challenge. The same symbol sequence can have multiple valid interpretations depending on surrounding signals.',
    color: '#4F46E5',
  },
];

// ──── Emoji Rounds ────
const ALL_ROUNDS: EmojiRound[] = [
  // ── Easy (Band A) ──
  {
    id: 'e1', emojis: '\u{1F415} + \u{1F9B4} = \u{1F604}', difficulty: 'easy', bandMin: 'A', category: 'Animals',
    correctAnswer: 'A dog is happy with its bone!',
    wrongAnswers: ['A cat found a fish!', 'A bone broke in half!'],
    aiInterpretation: 'AI says: "Canine + calcium stick = positive emotion detected!"',
    funFact: 'Dogs wag their tails to show happiness \u2014 AI looks for \u{1F604} to detect positive feelings in text!',
    funFactB: 'Sentiment analysis models associate \u{1F604} with a positive valence score of ~0.85.',
  },
  {
    id: 'e2', emojis: '\u2600\uFE0F \u2192 \u{1F327}\uFE0F \u2192 \u{1F308}', difficulty: 'easy', bandMin: 'A', category: 'Weather',
    correctAnswer: 'Sun, then rain, then a rainbow appears!',
    wrongAnswers: ['It\'s always sunny!', 'The rainbow came first!'],
    aiInterpretation: 'AI says: "Weather sequence detected: solar \u2192 precipitation \u2192 light refraction!"',
    funFact: 'The \u2192 arrow tells AI this is a story that happens in order, like reading left to right!',
    funFactB: 'Sequential emoji patterns help NLP models detect narrative flow and temporal ordering.',
  },
  {
    id: 'e3', emojis: '\u{1F355} + \u{1F355} + \u{1F355} = \u{1F924}', difficulty: 'easy', bandMin: 'A', category: 'Food',
    correctAnswer: 'Eating lots of pizza is delicious!',
    wrongAnswers: ['Pizza is too expensive!', 'Three pizzas are sad!'],
    aiInterpretation: 'AI says: "Food item \u00D7 3 + drooling face = high satisfaction with meal!"',
    funFact: 'When AI sees the same emoji repeated, it thinks "more!" \u2014 just like you do!',
    funFactB: 'Repetition in emoji sequences acts as an intensifier, similar to "very very" in natural language.',
  },
  {
    id: 'e4', emojis: '\u{1F4DA} + \u{1F9E0} = \u{1F4A1}', difficulty: 'easy', bandMin: 'A', category: 'Learning',
    correctAnswer: 'Reading books makes you smarter!',
    wrongAnswers: ['Books are heavy!', 'Brains need lightbulbs!'],
    aiInterpretation: 'AI says: "Knowledge acquisition materials + cognitive organ = eureka moment!"',
    funFact: 'The \u{1F4A1} emoji means "idea!" \u2014 AI learned this from millions of text messages!',
    funFactB: 'The lightbulb emoji maps to insight/discovery concepts in 92% of training contexts.',
  },
  {
    id: 'e5', emojis: '\u{1F3AE} + \u{1F466} + \u{1F606}', difficulty: 'easy', bandMin: 'A', category: 'Fun',
    correctAnswer: 'A kid having fun playing video games!',
    wrongAnswers: ['A broken game controller!', 'A boy who is lost!'],
    aiInterpretation: 'AI says: "Gaming device + young human + joy = recreational digital entertainment!"',
    funFact: 'AI knows that \u{1F3AE} usually means fun \u2014 because people use it in happy messages!',
    funFactB: 'Co-occurrence analysis shows \u{1F3AE} appears with positive sentiment 78% of the time.',
  },
  {
    id: 'e6', emojis: '\u{1F319} + \u{1F6CF}\uFE0F + \u{1F4A4}', difficulty: 'easy', bandMin: 'A', category: 'Daily Life',
    correctAnswer: 'Time to go to sleep \u2014 goodnight!',
    wrongAnswers: ['It\'s time to wake up!', 'The bed is floating!'],
    aiInterpretation: 'AI says: "Nighttime indicator + sleep furniture + snoring symbols = bedtime routine!"',
    funFact: '\u{1F4A4} means sleeping in comics AND in AI language \u2014 some symbols mean the same everywhere!',
    funFactB: 'The \u{1F4A4} emoji is one of the most universally understood symbols across all languages and AI models.',
  },
  {
    id: 'e7', emojis: '\u{1F382} + \u{1F388} + \u{1F389}', difficulty: 'easy', bandMin: 'A', category: 'Celebrations',
    correctAnswer: 'It\'s a birthday party!',
    wrongAnswers: ['Someone is baking!', 'A balloon popped!'],
    aiInterpretation: 'AI says: "Celebration cake + inflatable decorations + party popper = birthday event!"',
    funFact: 'AI can tell this is a party because these three emojis almost always appear together!',
    funFactB: 'Emoji clustering: \u{1F382}\u{1F388}\u{1F389} form a "birthday" cluster with 95% association strength.',
  },
  {
    id: 'e8', emojis: '\u{1F3C3} + \u{1F4A8} + \u{1F3C6}', difficulty: 'easy', bandMin: 'A', category: 'Sports',
    correctAnswer: 'Running fast to win the race!',
    wrongAnswers: ['Someone is running away!', 'The wind blew a trophy!'],
    aiInterpretation: 'AI says: "Bipedal locomotion + speed indicator + victory symbol = competitive race!"',
    funFact: '\u{1F4A8} after a person means "fast!" \u2014 AI learned this pattern from sports conversations!',
    funFactB: 'Motion indicators like \u{1F4A8} modify adjacent emojis \u2014 a form of emoji "grammar."',
  },
  // ── Medium (Band A+B) ──
  {
    id: 'm1', emojis: '\u{1F431} + \u{1F4E6} = \u2753', difficulty: 'medium', bandMin: 'A', category: 'Science',
    correctAnswer: 'Schr\u00F6dinger\'s cat \u2014 is it in the box?',
    wrongAnswers: ['A cat delivered a package!', 'The box is empty!', 'Cats hate boxes!'],
    aiInterpretation: 'AI says: "Feline + container + uncertainty = possible quantum thought experiment?"',
    funFact: 'This is a famous science puzzle! The \u2753 means we don\'t know the answer yet!',
    funFactB: 'AI uses cultural reference databases to connect emoji patterns to known concepts like Schr\u00F6dinger\'s cat.',
  },
  {
    id: 'm2', emojis: '\u{1F30D} + \u{1F91D} + \u2764\uFE0F', difficulty: 'medium', bandMin: 'A', category: 'Values',
    correctAnswer: 'World peace and friendship!',
    wrongAnswers: ['The Earth is broken!', 'Hands are dirty!', 'A love letter!'],
    aiInterpretation: 'AI says: "Global symbol + cooperation gesture + affection = international harmony sentiment!"',
    funFact: 'When AI sees \u{1F30D} + \u2764\uFE0F together, it thinks about caring for the whole planet!',
    funFactB: 'Abstract concept detection: AI maps emoji combinations to themes like "peace" using learned associations.',
  },
  {
    id: 'm3', emojis: '\u{1F3B5} + \u{1F442} + \u{1F60C}', difficulty: 'medium', bandMin: 'A', category: 'Feelings',
    correctAnswer: 'Listening to music feels relaxing!',
    wrongAnswers: ['The music is too loud!', 'Someone lost their earbuds!', 'Ears can sing!'],
    aiInterpretation: 'AI says: "Audio content + auditory organ + serene expression = music-induced relaxation!"',
    funFact: 'AI connects \u{1F3B5} with feelings \u2014 happy music \u{1F604}, sad music \u{1F622}, calm music \u{1F60C}!',
    funFactB: 'Multimodal AI can cross-reference audio sentiment with emoji sentiment for richer understanding.',
  },
  {
    id: 'm4', emojis: '\u{1F9EA} + \u{1F4A5} + \u{1F632}', difficulty: 'medium', bandMin: 'A', category: 'Science',
    correctAnswer: 'A science experiment that exploded \u2014 wow!',
    wrongAnswers: ['A dangerous weapon!', 'Someone drank a potion!', 'Fireworks at the lab!'],
    aiInterpretation: 'AI says: "Chemical vessel + explosion event + surprise = unexpected experiment result!"',
    funFact: '\u{1F4A5} can mean an explosion OR just "amazing!" \u2014 AI has to guess which one from context!',
    funFactB: 'Polysemy in emojis mirrors word polysemy \u2014 \u{1F4A5} maps to both "explosion" and "impressive" depending on context.',
  },
  // ── Tricky (Band B only) ──
  {
    id: 't1', emojis: '\u{1F418} + \u{1F9E0} + \u23F0', difficulty: 'tricky', bandMin: 'B', category: 'Idioms',
    correctAnswer: 'An elephant never forgets!',
    wrongAnswers: ['Elephants wear watches!', 'Big brain, short time!', 'Memory is running out!'],
    aiInterpretation: 'AI says: "Large mammal + cognitive organ + time device = ...animal husbandry schedule?"',
    funFact: 'AI struggles with sayings like "an elephant never forgets" because they\'re not literal!',
    funFactB: 'Idiom detection is a major NLP challenge \u2014 figurative language breaks literal emoji-to-meaning mapping.',
  },
  {
    id: 't2', emojis: '\u{1F34E} + \u{1F3EB} + \u{1F469}\u200D\u{1F3EB}', difficulty: 'tricky', bandMin: 'B', category: 'Culture',
    correctAnswer: 'Bringing an apple for the teacher!',
    wrongAnswers: ['Apples grow at school!', 'Teachers sell fruit!', 'School lunch is apples!'],
    aiInterpretation: 'AI says: "Fruit + educational building + educator = nutritional supply chain for schools?"',
    funFact: 'This is a cultural tradition \u2014 AI doesn\'t always understand traditions from different countries!',
    funFactB: 'Culturally-specific emoji patterns require training data from diverse global sources for accurate interpretation.',
  },
  {
    id: 't3', emojis: '\u{1F494} + \u{1F9CA} + \u{1F451}', difficulty: 'tricky', bandMin: 'B', category: 'Stories',
    correctAnswer: 'The Ice Queen with a frozen heart \u2014 like a fairy tale!',
    wrongAnswers: ['Broken ice cubes for a king!', 'Hearts are made of ice!', 'Cold crown!'],
    aiInterpretation: 'AI says: "Fractured cardiac symbol + frozen water + royal headwear = damaged monarchy?"',
    funFact: 'AI has to read LOTS of fairy tales to understand that ice + heart + crown = an Ice Queen story!',
    funFactB: 'Narrative AI models use story trope databases to decode multi-emoji sequences into known plot archetypes.',
  },
  {
    id: 't4', emojis: '\u231B + \u{1F4B0} + \u2696\uFE0F', difficulty: 'tricky', bandMin: 'B', category: 'Idioms',
    correctAnswer: 'Time is money \u2014 they\'re equally valuable!',
    wrongAnswers: ['Buying a clock!', 'Weighing coins!', 'Time to pay bills!'],
    aiInterpretation: 'AI says: "Chronological device + currency + balance scale = financial time management?"',
    funFact: '"Time is money" is a saying \u2014 AI needs to learn that some emoji combos represent ideas, not actions!',
    funFactB: 'Proverb detection requires mapping abstract emoji sequences to known aphorisms \u2014 a deep NLP task.',
  },
  // ═══════ 5x CONTENT EXPANSION (64 new rounds) ═══════
  // ── EASY (Band A) — 32 new rounds ──
  { id: 'e9', emojis: '\u{1F3E0} + \u2764\uFE0F + \u{1F46A}', difficulty: 'easy', bandMin: 'A', category: 'Family', correctAnswer: 'Home is where the family is!', wrongAnswers: ['Building a house!', 'Hearts in a building!'], aiInterpretation: 'AI says: "Residential structure + affection + social group = domestic happiness!"', funFact: 'AI knows that house + heart usually means love for home!', funFactB: 'Co-occurrence analysis: house + heart emojis predict "home sweet home" sentiment with 87% accuracy.' },
  { id: 'e10', emojis: '\u{1F9D1}\u200D\u{1F373} + \u{1F372} + \u{1F60B}', difficulty: 'easy', bandMin: 'A', category: 'Food', correctAnswer: 'A chef cooked a yummy meal!', wrongAnswers: ['Soup is too hot!', 'Cooking is dangerous!'], aiInterpretation: 'AI says: "Culinary professional + hot liquid food = gustatory satisfaction!"', funFact: 'The drooling face \u{1F60B} tells AI the food is REALLY good!', funFactB: 'Emoji sentiment scoring: \u{1F60B} has a "desire" intensity of 0.91 in food contexts.' },
  { id: 'e11', emojis: '\u{1F3B6} + \u{1F57A} + \u{1F389}', difficulty: 'easy', bandMin: 'A', category: 'Fun', correctAnswer: 'Dancing to music at a party!', wrongAnswers: ['Singing alone!', 'Music is too loud!'], aiInterpretation: 'AI says: "Audio stimulus + kinetic human response + celebration marker = party event!"', funFact: 'AI can tell the difference between a sad song \u{1F3B6}\u{1F622} and a happy one \u{1F3B6}\u{1F389}!', funFactB: 'Context-dependent emoji: \u{1F3B6} sentiment shifts from 0.6 to 0.9 based on adjacent emojis.' },
  { id: 'e12', emojis: '\u2708\uFE0F + \u{1F30E} + \u{1F4F8}', difficulty: 'easy', bandMin: 'A', category: 'Travel', correctAnswer: 'Flying around the world taking photos!', wrongAnswers: ['Earth is flat!', 'Planes are scary!'], aiInterpretation: 'AI says: "Aviation vehicle + planetary body + camera = global tourism documentation!"', funFact: 'When AI sees \u2708\uFE0F + \u{1F30E} together, it knows you\'re talking about travel!', funFactB: 'Emoji pair analysis: airplane + globe co-occurrence predicts "travel" topic with 94% confidence.' },
  { id: 'e13', emojis: '\u{1F4F1} + \u{1F50B} + \u{1F622}', difficulty: 'easy', bandMin: 'A', category: 'Tech', correctAnswer: 'Phone battery is dead — so sad!', wrongAnswers: ['Phone is charging!', 'Happy phone!'], aiInterpretation: 'AI says: "Mobile device + depleted power cell + negative emotion = low battery frustration!"', funFact: 'AI has learned that \u{1F50B} + \u{1F622} almost always means a dead battery!', funFactB: 'Causal inference: battery + sad face maps to "low power" in 96% of social media usage.' },
  { id: 'e14', emojis: '\u{1F9D9} + \u2728 + \u{1F432}', difficulty: 'easy', bandMin: 'A', category: 'Fantasy', correctAnswer: 'A wizard casting a spell on a dragon!', wrongAnswers: ['Stars and lizards!', 'A hat with sparkles!'], aiInterpretation: 'AI says: "Magical humanoid + particle effects + mythical reptile = fantasy combat scenario!"', funFact: 'AI needs to know about fantasy stories to understand wizards and dragons!', funFactB: 'Genre classification: wizard + dragon emojis trigger "fantasy" topic model with 89% confidence.' },
  { id: 'e15', emojis: '\u{1F4A9} + \u{1F525} + \u{1F6AB}', difficulty: 'easy', bandMin: 'A', category: 'Humor', correctAnswer: 'That\'s a really bad idea — stop!', wrongAnswers: ['Fire extinguisher!', 'Camping fun!'], aiInterpretation: 'AI says: "Waste material + combustion + prohibition sign = hazardous situation warning!"', funFact: 'Even AI knows that poop + fire = a terrible idea! The \u{1F6AB} confirms it!', funFactB: 'Negation emoji (\u{1F6AB}) inverts the sentiment of preceding emojis, signaling disapproval.' },
  { id: 'e16', emojis: '\u{1F436} + \u{1F431} + \u{1F49B}', difficulty: 'easy', bandMin: 'A', category: 'Animals', correctAnswer: 'A dog and cat are best friends!', wrongAnswers: ['Animals fighting!', 'Pet store!'], aiInterpretation: 'AI says: "Canine + feline + friendship heart = interspecies bond!"', funFact: 'The yellow heart \u{1F49B} means friendship — different hearts mean different things to AI!', funFactB: 'Heart color semantics: \u2764\uFE0F=love, \u{1F49B}=friendship, \u{1F499}=trust, \u{1F49C}=compassion in emoji NLP.' },
  { id: 'e17', emojis: '\u{1F3C0} + \u{1F938} + \u{1F4AF}', difficulty: 'easy', bandMin: 'A', category: 'Sports', correctAnswer: 'Amazing basketball trick — perfect score!', wrongAnswers: ['100 basketballs!', 'Gymnastics test!'], aiInterpretation: 'AI says: "Spherical sports equipment + acrobatic maneuver + maximum score = athletic excellence!"', funFact: '\u{1F4AF} means "perfect" to AI — it\'s one of the most positive emojis!', funFactB: 'The \u{1F4AF} emoji carries the highest positive sentiment score (0.98) in most NLP models.' },
  { id: 'e18', emojis: '\u{1F4D6} + \u{1F44D} + \u2B50', difficulty: 'easy', bandMin: 'A', category: 'Reviews', correctAnswer: 'Great book — 5 stars!', wrongAnswers: ['Star-shaped book!', 'Thumbs up poster!'], aiInterpretation: 'AI says: "Reading material + approval gesture + rating symbol = positive media review!"', funFact: 'AI uses \u{1F44D} and \u2B50 together to detect product reviews in text!', funFactB: 'Review detection: thumb + star co-occurrence predicts review content with 91% precision.' },
  { id: 'e19', emojis: '\u{1F9CA} + \u{1F60E} + \u2600\uFE0F', difficulty: 'easy', bandMin: 'A', category: 'Weather', correctAnswer: 'Staying cool in the hot sun!', wrongAnswers: ['Melting ice!', 'Cold sunburn!'], aiInterpretation: 'AI says: "Frozen water + confident face + solar body = thermal regulation satisfaction!"', funFact: 'The sunglasses emoji \u{1F60E} tells AI someone feels cool and confident!', funFactB: 'Emoji pragmatics: \u{1F60E} signals confidence/composure rather than literal sunglasses in 78% of uses.' },
  { id: 'e20', emojis: '\u{1F6B2} + \u{1F343} + \u{1F60A}', difficulty: 'easy', bandMin: 'A', category: 'Nature', correctAnswer: 'A happy bike ride through nature!', wrongAnswers: ['Leaf on a wheel!', 'Wind-powered bike!'], aiInterpretation: 'AI says: "Pedal vehicle + botanical element + positive face = eco-friendly recreation!"', funFact: 'AI connects bike + leaves with nature and being eco-friendly!', funFactB: 'Topic modeling: bicycle + nature emojis cluster with sustainability/environment topics.' },
  // ── MEDIUM (Band A/B) — 16 new rounds ──
  { id: 'm5', emojis: '\u{1F916} + \u2764\uFE0F + \u{1F468}\u200D\u{1F469}\u200D\u{1F467}', difficulty: 'medium', bandMin: 'A', category: 'Ethics', correctAnswer: 'Can a robot truly love a family?', wrongAnswers: ['Robot babysitter!', 'Family buys a robot!'], aiInterpretation: 'AI says: "Artificial entity + affection marker + familial unit = domestic AI integration query?"', funFact: 'This is a big question! Can AI really feel love? Most scientists say no... yet!', funFactB: 'Affective computing studies whether AI can simulate emotions, but true feelings remain debated.' },
  { id: 'm6', emojis: '\u{1F4B8} + \u{1F4C8} + \u{1F4B0}', difficulty: 'medium', bandMin: 'A', category: 'Money', correctAnswer: 'Spending money to make more money — investing!', wrongAnswers: ['Losing all your money!', 'Printing money!'], aiInterpretation: 'AI says: "Capital outflow + upward trend + capital accumulation = financial growth strategy!"', funFact: 'AI sees \u{1F4C8} and knows something is going UP — it\'s used in finance and health tracking!', funFactB: 'Chart emojis (\u{1F4C8}\u{1F4C9}) serve as meta-indicators for trend direction in text analysis.' },
  { id: 'm7', emojis: '\u{1F9EC} + \u{1F52C} + \u{1F4A1}', difficulty: 'medium', bandMin: 'A', category: 'Science', correctAnswer: 'Studying DNA under a microscope led to a discovery!', wrongAnswers: ['DNA is a lightbulb!', 'Microscopes have ideas!'], aiInterpretation: 'AI says: "Genetic material + magnification device + insight indicator = biological research breakthrough!"', funFact: 'AI can\'t look through microscopes, but it helps scientists analyze what they see!', funFactB: 'AI-assisted microscopy uses computer vision to identify cellular structures 10x faster than humans.' },
  { id: 'm8', emojis: '\u{1F3AD} + \u{1F622} + \u{1F602}', difficulty: 'medium', bandMin: 'A', category: 'Emotions', correctAnswer: 'Theater makes you cry AND laugh!', wrongAnswers: ['Sad clown!', 'Broken masks!'], aiInterpretation: 'AI says: "Performance arts symbol + grief indicator + joy indicator = emotional range entertainment!"', funFact: 'The theater masks \u{1F3AD} show both happy and sad — AI finds this emoji one of the trickiest!', funFactB: 'Mixed sentiment: \u{1F3AD} combined with emotion emojis creates ambiguity NLP models struggle to resolve.' },
  { id: 'm9', emojis: '\u{1F3DF}\uFE0F + \u{1F4E3} + \u{1F44F}', difficulty: 'medium', bandMin: 'A', category: 'Events', correctAnswer: 'Cheering at a big stadium event!', wrongAnswers: ['Loud building!', 'Clapping at a wall!'], aiInterpretation: 'AI says: "Large venue + amplified audio + applause gesture = mass entertainment event!"', funFact: 'AI can guess events from emojis — stadium + cheering usually means sports or concerts!', funFactB: 'Event detection: venue + crowd emojis predict event type with 82% accuracy in social media.' },
  { id: 'm10', emojis: '\u{1F9D1}\u200D\u{1F4BB} + \u2615 + \u{1F62B}', difficulty: 'medium', bandMin: 'A', category: 'Work', correctAnswer: 'Working late on a computer — so tired!', wrongAnswers: ['Computer drinks coffee!', 'Tired of coffee!'], aiInterpretation: 'AI says: "Digital worker + caffeinated beverage + exhaustion indicator = overtime productivity struggle!"', funFact: 'AI has learned that computer + coffee + tired face = someone working really hard!', funFactB: 'Lifestyle inference: work emoji + stimulant + fatigue maps to "burnout" topic in workplace analysis.' },
  { id: 'm11', emojis: '\u{1F3A8} + \u{1F916} + \u2753', difficulty: 'medium', bandMin: 'A', category: 'AI Art', correctAnswer: 'Can a robot create real art?', wrongAnswers: ['Robot painting class!', 'Colorful robot!'], aiInterpretation: 'AI says: "Creative expression + artificial entity + interrogative = AI creativity inquiry!"', funFact: 'This is a hot debate! AI can now make paintings, but is it really ART?', funFactB: 'AI art generation (DALL-E, Midjourney) raises questions about creativity and authorship in NLP analysis.' },
  { id: 'm12', emojis: '\u{1F30A} + \u{1F4A8} + \u{1F3E0}', difficulty: 'medium', bandMin: 'A', category: 'Disaster', correctAnswer: 'A storm or tsunami threatening homes!', wrongAnswers: ['Ocean house!', 'Windy swimming!'], aiInterpretation: 'AI says: "Aquatic surge + atmospheric force + residential structure = natural disaster threat!"', funFact: 'AI can detect emergency topics from emojis to help with disaster response!', funFactB: 'Crisis informatics: disaster-related emoji patterns help filter emergency reports on social media.' },
  // ── TRICKY (Band B) — 12 new rounds ──
  { id: 't5', emojis: '\u{1F3C6} + \u{1F622} + \u{1F3C3}', difficulty: 'tricky', bandMin: 'B', category: 'Idioms', correctAnswer: 'Losing is part of trying — you learn from failure!', wrongAnswers: ['Crying while running!', 'Trophy is heavy!', 'Running from trophies!'], aiInterpretation: 'AI says: "Achievement symbol + grief + locomotion = failed competition aftermath?"', funFact: '"Fall seven times, stand up eight" — AI needs cultural knowledge to understand losing can be positive!', funFactB: 'Sentiment reversal: positive symbol + negative emotion requires pragmatic inference about resilience narratives.' },
  { id: 't6', emojis: '\u{1F3B2} + \u{1F914} + \u{1F4CA}', difficulty: 'tricky', bandMin: 'B', category: 'Math', correctAnswer: 'Probability — predicting dice outcomes with data!', wrongAnswers: ['Thinking about charts!', 'Gambling homework!', 'Statistics game!'], aiInterpretation: 'AI says: "Randomness generator + cognitive deliberation + statistical visualization = probability analysis!"', funFact: 'AI uses probability CONSTANTLY — every prediction it makes involves calculating chances!', funFactB: 'Probabilistic reasoning underpins all ML inference: softmax outputs, Bayesian priors, Monte Carlo sampling.' },
  { id: 't7', emojis: '\u{1F5FA}\uFE0F + \u{1F4CC} + \u2753', difficulty: 'tricky', bandMin: 'B', category: 'Geography', correctAnswer: 'Where in the world? — a location mystery!', wrongAnswers: ['Pin on a wall!', 'Lost map!', 'Geography test!'], aiInterpretation: 'AI says: "Cartographic projection + location marker + interrogative = geospatial query!"', funFact: 'AI uses maps and location data to answer "where" questions — it\'s called geospatial AI!', funFactB: 'GeoAI combines NLP with spatial data: entity recognition + geocoding + map rendering.' },
  { id: 't8', emojis: '\u{1F310} + \u{1F512} + \u{1F440}', difficulty: 'tricky', bandMin: 'B', category: 'Privacy', correctAnswer: 'The internet is watching — protect your privacy!', wrongAnswers: ['Locked website!', 'Eyes on a globe!', 'Internet security!'], aiInterpretation: 'AI says: "Global network + security mechanism + surveillance indication = digital privacy concern!"', funFact: 'AI helps protect your data online, but it also collects a LOT of data about you!', funFactB: 'Privacy-preserving NLP is an active research field: federated learning, differential privacy, on-device processing.' },
  { id: 't9', emojis: '\u{1F9E0} + \u26A1 + \u{1F4BB}', difficulty: 'tricky', bandMin: 'B', category: 'AI', correctAnswer: 'A brain-powered computer — artificial intelligence!', wrongAnswers: ['Electric brain surgery!', 'Smart plug!', 'Computer headache!'], aiInterpretation: 'AI says: "Cognitive organ + energy + computational device = artificial intelligence concept!"', funFact: 'This emoji combo basically describes AI itself — a computer that thinks like a brain!', funFactB: 'Neural network metaphor: brain + electricity + computer maps directly to deep learning architecture concepts.' },
  { id: 't10', emojis: '\u{1F30D} + \u{1F525} + \u{1F198}', difficulty: 'tricky', bandMin: 'B', category: 'Climate', correctAnswer: 'Earth is overheating — we need help! Climate change SOS!', wrongAnswers: ['Hot planet sale!', 'Fire department!', 'Burning map!'], aiInterpretation: 'AI says: "Planetary body + thermal event + distress signal = environmental crisis alert!"', funFact: 'AI helps track climate change by analyzing satellite images and weather data!', funFactB: 'Climate NLP: sentiment analysis of environmental discourse helps gauge public awareness and policy impact.' },
  { id: 't11', emojis: '\u{1F47B} + \u{1F5A5}\uFE0F + \u{1F440}', difficulty: 'tricky', bandMin: 'B', category: 'Cybersecurity', correctAnswer: 'A ghost in the machine — a hacker watching your screen!', wrongAnswers: ['Scary computer!', 'Ghost movie!', 'Computer ghost app!'], aiInterpretation: 'AI says: "Invisible entity + display terminal + surveillance = unauthorized system access!"', funFact: '"Ghost in the machine" is a famous saying about hidden things controlling computers!', funFactB: 'Cybersecurity NLP: threat detection models identify hacking terminology and attack pattern descriptions.' },
  { id: 't12', emojis: '\u{1F383} + \u{1F3AD} + \u{1F36C}', difficulty: 'tricky', bandMin: 'B', category: 'Culture', correctAnswer: 'Halloween — wearing costumes and getting candy!', wrongAnswers: ['Pumpkin theater!', 'Candy masks!', 'Scary performance!'], aiInterpretation: 'AI says: "Cucurbit ornament + disguise equipment + confectionery = autumnal celebration event!"', funFact: 'AI needs to know about holidays in different cultures to understand seasonal emoji patterns!', funFactB: 'Cultural calendar awareness: holiday-specific emoji spikes help NLP models detect temporal/cultural context.' },
  { id: 't13', emojis: '\u{1F4F0} + \u{1F916} + \u{1F4DD}', difficulty: 'tricky', bandMin: 'B', category: 'Media', correctAnswer: 'AI is writing the news! Can you trust robot journalists?', wrongAnswers: ['Newspaper robot!', 'Robot reads paper!', 'Writing homework!'], aiInterpretation: 'AI says: "News media + artificial entity + writing implement = automated content generation!"', funFact: 'Some news articles are already written by AI! Can you tell which ones?', funFactB: 'AI-generated text detection is a growing field: GPT detectors analyze perplexity and burstiness patterns.' },
  { id: 't14', emojis: '\u{1F468}\u200D\u2695\uFE0F + \u{1F916} + \u{1F4AC}', difficulty: 'tricky', bandMin: 'B', category: 'Healthcare', correctAnswer: 'A doctor and an AI chatbot discussing your health!', wrongAnswers: ['Robot doctor!', 'Talking medicine!', 'Chat about robots!'], aiInterpretation: 'AI says: "Medical professional + artificial entity + dialogue = AI-assisted healthcare consultation!"', funFact: 'AI chatbots already help doctors by summarizing symptoms and suggesting tests!', funFactB: 'Medical NLP: clinical note processing + symptom extraction + diagnostic suggestion are active AI applications.' },
  { id: 't15', emojis: '\u{1F3A4} + \u{1F916} + \u{1F3B5}', difficulty: 'tricky', bandMin: 'B', category: 'Music', correctAnswer: 'AI is making music — a robot singer!', wrongAnswers: ['Karaoke machine!', 'Music robot toy!', 'Robot concert!'], aiInterpretation: 'AI says: "Audio capture device + artificial entity + melodic notation = AI music generation!"', funFact: 'AI can now compose songs, write lyrics, and even clone voices! Music is changing fast!', funFactB: 'Audio generation models (Jukebox, MusicLM, Suno) create original compositions from text prompts.' },
  { id: 't16', emojis: '\u{1F9D1}\u200D\u{1F52C} + \u{1F4A1} + \u{1F30D}', difficulty: 'tricky', bandMin: 'B', category: 'Innovation', correctAnswer: 'A scientist\'s idea could change the world!', wrongAnswers: ['Lab on Earth!', 'Bright globe!', 'Smart planet!'], aiInterpretation: 'AI says: "Research professional + eureka event + global scope = world-changing scientific discovery!"', funFact: 'The biggest AI breakthroughs started as one person\'s idea — just like this emoji shows!', funFactB: 'Innovation narratives in NLP: discovery emoji patterns correlate with press releases about scientific breakthroughs.' },
];

// ──── Emoji Lab Prompts ────
const LAB_PROMPTS = [
  { prompt: 'Make an emoji sentence about your favorite food!', hint: 'Try: food + feeling' },
  { prompt: 'Tell a story about going on an adventure!', hint: 'Try: person + place + action' },
  { prompt: 'Show what you did today!', hint: 'Try: morning + activity + evening' },
  { prompt: 'Describe your best friend!', hint: 'Try: person + heart + activity' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };
const DIFF_POINTS: Record<Difficulty, number> = { easy: 10, medium: 15, tricky: 20 };

// ──── Component ────
export function EmojiDecoderGame() {
  const prefersReducedMotion = useReducedMotion();
  const { safeTimeout } = useSafeTimeout();
  const game = useGame();
  const activeChild = useActiveChild();
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const ageBand = (activeChild?.age_band || 'A') as 'A' | 'B' | 'C';
  const { data: dynamicContent } = useGameContent('emoji-decoder', ageBand);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [labText, setLabText] = useState('');
  const [labSubmitted, setLabSubmitted] = useState(false);
  const [labPromptIdx] = useState(() => Math.floor(Math.random() * LAB_PROMPTS.length));
  const [emojiPulse, setEmojiPulse] = useState(false);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const filteredRounds = useFilteredContent(ALL_ROUNDS as any[], tier, ageBand) as typeof ALL_ROUNDS;
  const timerRef = useRef<number | null>(null);

  // Merge hardcoded + dynamic rounds, then filter/shuffle/slice
  const rounds = useMemo(() => {
    const pool = [...ALL_ROUNDS];
    if (dynamicContent?.scenarios?.length) {
      for (const s of dynamicContent.scenarios) {
        try { pool.push({ ...JSON.parse(s.content_body), isAI: true } as EmojiRound); } catch { /* skip */ }
      }
    }
    const filtered = pool.filter(r => BAND_ORDER[r.bandMin] <= BAND_ORDER[ageBand]);
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, ageBand === 'A' ? 8 : 10);
  }, [ageBand, dynamicContent?.scenarios]);

  const round = rounds[roundIdx];
  const totalRounds = rounds.length;

  // Register 3D scene content into CockpitCanvas via sceneStore (D3D-B3, S7-HIGH-002)
  useEffect(() => {
    if (phase === 'play' || phase === 'lab') {
      setGameSceneContent(
        <EmojiDecoder3D
          inputEmojis={round?.emojis ? Array.from(round.emojis) : []}
          decodedText={selected || ''}
          isDecoding={showAI}
          progress={totalRounds > 0 ? roundIdx / totalRounds : 0}
        />
      );
    } else {
      setGameSceneContent(null);
    }
  }, [phase, round, selected, showAI, roundIdx, totalRounds, setGameSceneContent]);

  const answers = useMemo(() => {
    if (!round) return [];
    const all = [round.correctAnswer, ...round.wrongAnswers];
    return [...all].sort(() => Math.random() - 0.5);
  }, [round]);

  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i, x: ((i * 41 + 17) * 7) % 100, y: ((i * 59 + 11) * 13) % 100,
      size: ((i * 19 + 3) % 25) / 10 + 1, delay: ((i * 37 + 7) % 50) / 10, dur: ((i * 47 + 5) % 60) / 10 + 5,
    })), []);

  useEffect(() => {
    if (phase === 'play') {
      setEmojiPulse(true);
      safeTimeout(() => setEmojiPulse(false), 800);
    }
  }, [roundIdx, phase, safeTimeout]);

  const handleAnswer = useCallback((answer: string) => {
    if (showResult || !round) return;
    setSelected(answer);
    setShowResult(true);
    const isCorrect = answer === round.correctAnswer;
    if (isCorrect) {
      const streakBonus = streak >= 3 ? 5 : streak >= 2 ? 3 : 0;
      game.updateScore(DIFF_POINTS[round.difficulty] + streakBonus);
      setStreak(s => s + 1);
      setBestStreak(b => Math.max(b, streak + 1));
      setTotalCorrect(c => c + 1);
    } else { setStreak(0); }
    timerRef.current = safeTimeout(() => setShowAI(true), 1200);
  }, [showResult, round, streak, game]);

  const nextRound = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelected(null); setShowResult(false); setShowAI(false);
    if (roundIdx < totalRounds - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
    else setPhase('lab');
  }, [roundIdx, totalRounds, game]);

  const handleLabSubmit = useCallback(() => {
    if (labText.trim().length < 2) return;
    setLabSubmitted(true);
    game.updateScore(15);
  }, [labText, game]);

  const finishGame = useCallback(() => { game.completeGame(); setPhase('complete'); }, [game]);

  return (
    <GameShell gameId="emoji-decoder" title="Emoji Decoder" worldNumber={8} worldColor="#8F96FA" xpReward={25} totalRounds={totalRounds}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        {particles.map(p => (
          <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
              background: 'radial-gradient(circle, rgba(129,140,248,0.5), transparent)' }}
            animate={prefersReducedMotion ? {} : { y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Chrome Bezel */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.06]">
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
          <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
        </div>

        <AnimatePresence mode="wait">
          {/* ══════════ WELCOME ══════════ */}
          {phase === 'welcome' && (
            <motion.div key="welcome" className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <motion.div className="text-6xl mb-4" animate={prefersReducedMotion ? {} : { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}>{'\u{1F524}'}</motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Emoji Decoder</h2>
              <p className="font-body text-sm text-white/60 mb-1">Lab 8 — Words & Language</p>
              <p className="font-body text-sm text-white/50 max-w-sm mb-6">
                Can you crack the emoji code? Decode emoji puzzles and see how AI reads them differently!
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {['NLP', 'Emojis', 'Language', 'Context'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/20 font-mono text-2xs text-indigo-300">{tag}</span>
                ))}
              </div>
              <motion.button onClick={() => setPhase('learn')}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-display font-bold"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} aria-label="Start learning">
                <BookOpen className="w-4 h-4" /> Let&#39;s Learn!
              </motion.button>
            </motion.div>
          )}

          {/* ══════════ LEARN ══════════ */}
          {phase === 'learn' && (
            <motion.div key="learn" className="flex-1 flex flex-col items-center justify-center p-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <p className="font-mono text-xs text-indigo-400/60 mb-3">CONCEPT {learnIdx + 1} / {CONCEPT_CARDS.length}</p>
              <AnimatePresence mode="wait">
                <motion.div key={learnIdx} className="w-full max-w-sm rounded-2xl p-6 text-center"
                  style={{ background: `linear-gradient(135deg, ${CONCEPT_CARDS[learnIdx].color}15, ${CONCEPT_CARDS[learnIdx].color}05)`,
                    border: `1px solid ${CONCEPT_CARDS[learnIdx].color}30` }}
                  initial={{ opacity: 0, x: 40, rotateY: 15 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -40, rotateY: -15 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                  <motion.span className="text-4xl block mb-3" animate={prefersReducedMotion ? {} : { y: [0, -6, 0] }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}>
                    {CONCEPT_CARDS[learnIdx].emoji}
                  </motion.span>
                  <h3 className="font-display text-lg font-bold text-white mb-2">{CONCEPT_CARDS[learnIdx].title}</h3>
                  <p className="font-body text-sm text-white/70 leading-relaxed">
                    {ageBand === 'B' || ageBand === 'C' ? CONCEPT_CARDS[learnIdx].descriptionB : CONCEPT_CARDS[learnIdx].description}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="flex gap-2 mt-6">
                {CONCEPT_CARDS.map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === learnIdx ? 'bg-indigo-400 scale-125' : i < learnIdx ? 'bg-indigo-400/40' : 'bg-white/20'}`} />
                ))}
              </div>
              <motion.button onClick={() => { if (learnIdx < CONCEPT_CARDS.length - 1) setLearnIdx(i => i + 1); else { setPhase('play'); game.startGame('emoji-decoder', totalRounds); /* FLL-023: use actual round count */ } }}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600/70 text-white font-display text-sm font-bold"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                {learnIdx < CONCEPT_CARDS.length - 1 ? <><ArrowRight className="w-4 h-4" /> Next</> : <><Play className="w-4 h-4" /> Start!</>}
              </motion.button>
            </motion.div>
          )}

          {/* ══════════ PLAY ══════════ */}
          {phase === 'play' && round && (
            <motion.div key="play" className="flex-1 flex flex-col p-4 overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 mb-3 px-4">
                <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                <GameProgressTracker current={roundIdx + 1} total={totalRounds} labColor="#818CF8" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-indigo-400/60">
                  <span className="font-body">ROUND </span>
                  <span className="font-data tabular-nums">{roundIdx + 1}</span>
                  <span className="font-body"> / </span>
                  <span className="font-data tabular-nums">{totalRounds}</span>
                </span>
                <div className="flex items-center gap-3">
                  {streak >= 2 && (
                    <motion.div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="font-mono text-xs text-amber-300">{streak}x</span>
                    </motion.div>
                  )}
                  {/* E-6: Streak visual multiplier animation */}
                  <AnimatePresence>
                    {streak >= 2 && showResult && selected === round?.correctAnswer && (
                      <motion.span className="absolute -top-6 right-0 font-display text-sm font-bold text-amber-400"
                        initial={{ opacity: 0, y: 10, scale: 0.5 }} animate={{ opacity: 1, y: -10, scale: 1.2 }}
                        exit={{ opacity: 0, y: -30 }} transition={{ type: 'spring', stiffness: 300 }}>
                        {streak >= 3 ? '\u{1F525} 3x COMBO!' : '\u26A1 2x COMBO!'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 font-mono text-xs text-white/60">{round.category}</span>
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex justify-center mb-2">
                <span className={`px-2 py-0.5 rounded-full font-mono text-2xs ${
                  round.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-400' :
                  round.difficulty === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-red-500/15 text-red-400'}`}>
                  {'\u2B50'.repeat(round.difficulty === 'easy' ? 1 : round.difficulty === 'medium' ? 2 : 3)}
                </span>
              </div>

              {/* Emoji Display */}
              <motion.div className="w-full max-w-md mx-auto rounded-2xl p-6 mb-4 text-center border border-indigo-500/20 bg-indigo-500/[0.05]"
                animate={emojiPulse ? { scale: [0.95, 1.05, 1] } : {}} transition={{ duration: 0.6 }}>
                <p className="font-mono text-xs text-indigo-400/50 mb-2">DECODE THIS:</p>
                <motion.p className="text-4xl md:text-5xl tracking-wider leading-relaxed"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={round.id}>
                  {round.emojis.split('').map((char, i) => (
                    <motion.span key={i} initial={{ opacity: 0, y: 20, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}>{char}</motion.span>
                  ))}
                </motion.p>
              </motion.div>

              {/* Answers */}
              <div className="w-full max-w-md mx-auto flex flex-col gap-2.5 mb-4">
                {answers.map((ans, i) => {
                  const isSelected = selected === ans;
                  const isCorrect = ans === round.correctAnswer;
                  const showColor = showResult;
                  return (
                    <motion.button key={`${round.id}-${i}`} onClick={() => handleAnswer(ans)}
                      className={`w-full text-left px-4 py-3 rounded-xl border font-body text-sm transition-all ${
                        showColor && isCorrect ? 'bg-emerald-500/15 border-emerald-500/40 text-white' :
                        showColor && isSelected && !isCorrect ? 'bg-red-500/15 border-red-500/40 text-white' :
                        isSelected ? 'bg-indigo-500/15 border-indigo-500/40 text-white' :
                        'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.06]'}`}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      whileHover={!showResult ? { scale: 1.02 } : {}} whileTap={!showResult ? { scale: 0.98 } : {}}
                      aria-label={`Answer choice: ${ans}`}>
                      <span className="mr-2 text-white/60 font-mono text-xs">{String.fromCharCode(65 + i)}.</span>
                      {ans}
                      {showColor && isCorrect && <span className="float-right">{'\u2705'}</span>}
                      {showColor && isSelected && !isCorrect && <span className="float-right">{'\u274C'}</span>}
                    </motion.button>
                  );
                })}
              </div>

              {/* AI Interpretation */}
              <AnimatePresence>
                {showAI && (
                  <motion.div className="w-full max-w-md mx-auto rounded-2xl p-4 border border-indigo-500/20 bg-indigo-500/[0.03] mb-4"
                    initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-indigo-400 mb-1">AI&#39;s INTERPRETATION:</p>
                        <p className="font-body text-sm text-white/60 italic">{round.aiInterpretation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-amber-400 mb-1">FUN FACT:</p>
                        <p className="font-body text-sm text-white/60">
                          {ageBand === 'B' || ageBand === 'C' ? round.funFactB : round.funFact}
                        </p>
                      </div>
                    </div>
                    <motion.button onClick={nextRound}
                      className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600/70 text-white font-display text-sm font-bold flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      {roundIdx < totalRounds - 1 ? <><ArrowRight className="w-4 h-4" /> Next Puzzle</> :
                        <><Sparkles className="w-4 h-4" /> Emoji Lab Bonus!</>}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress */}
              <div className="mt-auto pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-1">
                  <span>{'\u{1F3AF}'} {totalCorrect} / {roundIdx + (showResult ? 1 : 0)}</span>
                  <span>{'\u{1F525}'} Best streak: {bestStreak}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 mt-1.5 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    animate={{ width: `${((roundIdx + (showResult ? 1 : 0)) / totalRounds) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100 }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ EMOJI LAB ══════════ */}
          {phase === 'lab' && (
            <motion.div key="lab" className="flex-1 flex flex-col items-center justify-center p-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <motion.div className="text-4xl mb-3" animate={prefersReducedMotion ? {} : { rotate: [0, 10, -10, 0] }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}>{'\u{1F9EA}'}</motion.div>
              <h3 className="font-display text-xl font-bold text-white mb-1">Emoji Lab</h3>
              <p className="font-body text-sm text-white/50 mb-4">Bonus Round — Create your own emoji message!</p>

              <div className="w-full max-w-sm rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/[0.03]">
                <p className="font-body text-sm text-indigo-300 mb-2">{LAB_PROMPTS[labPromptIdx].prompt}</p>
                <p className="font-mono text-xs text-white/60 mb-3">{'\u{1F4A1}'} {LAB_PROMPTS[labPromptIdx].hint}</p>

                {!labSubmitted ? (
                  <>
                    <textarea value={labText} onChange={e => setLabText(e.target.value)}
                      placeholder="Type your emoji sentence here... \u{1F60A}"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm resize-none focus:outline-none focus:border-indigo-500/40 h-20"
                      maxLength={60} aria-label="Type your emoji sentence" />
                    <p className="font-mono text-2xs text-white/55 mt-1">{labText.length}/60</p>
                    <motion.button onClick={handleLabSubmit} disabled={labText.trim().length < 2}
                      className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-display text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} aria-label="Submit emoji sentence">
                      <Send className="w-4 h-4" /> Decode It!
                    </motion.button>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <p className="text-3xl mb-2">{labText}</p>
                    <div className="rounded-xl p-3 bg-indigo-500/10 border border-indigo-500/20 mb-3">
                      <div className="flex items-center gap-2 justify-center mb-1">
                        <Brain className="w-4 h-4 text-indigo-400" />
                        <span className="font-mono text-xs text-indigo-400">AI SAYS:</span>
                      </div>
                      <p className="font-body text-sm text-white/60 italic">
                        &quot;Interesting emoji sequence detected! I see creative symbols expressing a unique thought pattern!&quot;
                      </p>
                    </div>
                    <p className="font-mono text-xs text-emerald-400 mt-2">+15 XP creativity bonus!</p>
                    <motion.button onClick={finishGame}
                      className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display text-sm font-bold flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} aria-label="Finish game">
                      <Award className="w-4 h-4" /> See My Results!
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
          {/* ══════════ COMPLETE (E-1) ══════════ */}
          {phase === 'complete' && (
            <motion.div key="complete" className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <motion.div className="text-6xl mb-4" animate={prefersReducedMotion ? {} : { y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}>{'\u{1F3C6}'}</motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Emoji Master!</h2>
              <p className="font-body text-sm text-white/60 mb-4">You cracked the emoji code!</p>

              <div className="w-full max-w-xs rounded-2xl p-4 bg-white/[0.03] border border-indigo-500/20 mb-4">
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  <div className="rounded-xl p-2 bg-emerald-500/10 border border-emerald-500/20">
                    <p className="font-mono text-2xs text-emerald-400 mb-1">CORRECT</p>
                    <p className="font-display text-xl font-bold text-emerald-300">{totalCorrect}/{totalRounds}</p>
                  </div>
                  <div className="rounded-xl p-2 bg-amber-500/10 border border-amber-500/20">
                    <p className="font-mono text-2xs text-amber-400 mb-1">BEST STREAK</p>
                    <p className="font-display text-xl font-bold text-amber-300">{bestStreak}{'\u{1F525}'}</p>
                  </div>
                  <div className="rounded-xl p-2 bg-indigo-500/10 border border-indigo-500/20">
                    <p className="font-mono text-2xs text-indigo-400 mb-1">XP EARNED</p>
                    <p className="font-display text-xl font-bold text-indigo-300">{game.score}</p>
                  </div>
                </div>

                {totalCorrect === totalRounds && (
                  <motion.div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-display text-sm font-bold text-amber-300">Perfect Score!</span>
                  </motion.div>
                )}
              </div>

              <p className="font-body text-xs text-white/60 max-w-xs">
                {ageBand === 'B' || ageBand === 'C'
                  ? 'You\'ve explored how NLP processes emoji sequences \u2014 a core challenge in natural language understanding!'
                  : 'You decoded emojis like a pro and saw how AI reads them differently!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>
    </GameShell>
  );
}
