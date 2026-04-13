// ════════════════════════════════════════════════════════════════════════
// AI OR NOT? — Lab 10 (AI's Future) — ENHANCED STANDARD
// ════════════════════════════════════════════════════════════════════════
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';

// 3D scene content — rendered inside CockpitCanvas via sceneStore (D3D-B3, S7-HIGH-002)
const AiOrNot3D = dynamic(
  () => import('@/components/3d/AiOrNot3D'),
  { ssr: false }
);
import { Play, BookOpen, ArrowRight, Lightbulb, Award, Rocket, Clock, Send, Brain, CheckCircle } from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

type Phase = 'welcome' | 'learn' | 'play' | 'predict' | 'complete';
type TimeCategory = 'now' | 'soon' | 'scifi';

interface Scenario {
  id: string; title: string; emoji: string;
  description: string; descriptionB: string;
  answer: TimeCategory; explanation: string; explanationB: string;
  funFact: string; year?: string; bandMin: 'A' | 'B';
  isAI?: boolean;
}

interface ConceptCard {
  emoji: string; title: string; description: string; descriptionB: string; color: string;
}

const CONCEPT_CARDS: ConceptCard[] = [
  { emoji: '\u{1F50D}', title: 'What Can AI Really Do?',
    description: 'Some things AI can do RIGHT NOW might surprise you \u2014 and some things people say AI can do are still science fiction!',
    descriptionB: 'AI capabilities are often misunderstood \u2014 some overhyped, others underappreciated. Critical evaluation matters.',
    color: '#D946EF' },
  { emoji: '\u{1F4C8}', title: 'AI Gets Better Over Time',
    description: 'AI is learning new things every year! Things impossible 5 years ago are normal today.',
    descriptionB: 'AI progress is exponential \u2014 GPT-2 (2019) could barely write a paragraph; GPT-4 (2023) passes bar exams.',
    color: '#C026D3' },
  { emoji: '\u{1F914}', title: 'Healthy Skepticism',
    description: 'Not everything people say about AI is true. Smart thinkers ask: "Can AI really do that?"',
    descriptionB: 'Critical thinking about AI means asking: What\'s the evidence? Was it demonstrated or just claimed?',
    color: '#A21CAF' },
  { emoji: '\u{1F680}', title: 'YOU Decide the Future!',
    description: 'Kids like you will grow up to build the AI of tomorrow. What you learn now helps make it REAL!',
    descriptionB: 'Your generation will make critical decisions about AI regulation and deployment \u2014 understanding AI capabilities makes it REAL!',
    color: '#86198F' },
];

const ALL_SCENARIOS: Scenario[] = [
  // NOW
  { id: 'n1', emoji: '\u{1F5E3}\uFE0F', title: 'AI Voice Assistants',
    description: 'You can talk to AI and it talks back \u2014 like Siri or Alexa!',
    descriptionB: 'AI-powered voice assistants understand speech, answer questions, control devices, and handle complex multi-turn conversations.',
    answer: 'now', bandMin: 'A',
    explanation: 'Siri, Alexa, and Google Assistant have been doing this for years!',
    explanationB: 'Voice assistants use ASR and NLU. Over 4 billion devices use voice AI today.',
    funFact: 'The first voice assistant was IBM\'s Shoebox in 1961 \u2014 it understood 16 words!' },
  { id: 'n2', emoji: '\u{1F3B5}', title: 'AI Creates Music',
    description: 'AI can compose brand-new songs that sound really good!',
    descriptionB: 'AI music tools create original compositions in any genre, from classical to hip-hop, with lyrics and instrumentation.',
    answer: 'now', bandMin: 'A',
    explanation: 'Tools like Suno already create full songs with lyrics and instruments!',
    explanationB: 'Models like MusicGen use transformer architectures trained on millions of tracks.',
    funFact: 'In 2023, an AI-generated song went viral on TikTok with millions of views!', year: '2023' },
  { id: 'n3', emoji: '\u{1F3E5}', title: 'AI Helps Doctors',
    description: 'AI looks at medical scans and helps doctors spot problems they might miss!',
    descriptionB: 'AI diagnostic tools analyze X-rays, MRIs, and CT scans \u2014 sometimes more accurately than human radiologists.',
    answer: 'now', bandMin: 'A',
    explanation: 'AI is already FDA-approved to help detect cancer in medical images!',
    explanationB: 'Over 500 AI medical devices have FDA approval. AI matches or exceeds radiologist accuracy in specific tasks.',
    funFact: 'AI can spot some cancers 11.5% more accurately than human doctors alone!', year: '2020+' },
  { id: 'n4', emoji: '\u{1F310}', title: 'AI Translates Instantly',
    description: 'AI translates what people say into another language in real time!',
    descriptionB: 'Real-time AI translation works for 100+ languages in text and dozens in speech.',
    answer: 'now', bandMin: 'A',
    explanation: 'Google Translate and DeepL already translate speech live!',
    explanationB: 'Neural machine translation models like NLLB-200 support 200 languages. Earbuds provide real-time translation.',
    funFact: 'Google Translate processes over 100 billion words per day!', year: '2016+' },
  // SOON
  { id: 's1', emoji: '\u{1F697}', title: 'Self-Driving Cars Everywhere',
    description: 'Cars that drive themselves on any road, any weather, with no human help at all!',
    descriptionB: 'Fully autonomous Level 5 vehicles handling any scenario, available to everyone worldwide.',
    answer: 'soon', bandMin: 'A',
    explanation: 'Self-driving taxis work in some cities, but they can\'t go everywhere yet!',
    explanationB: 'Level 4 robotaxis (Waymo) operate in limited areas. Level 5 is estimated 5-10 years out.',
    funFact: 'Waymo cars have driven over 20 million miles on public roads!', year: '~2028-2032' },
  { id: 's2', emoji: '\u{1F3E0}', title: 'AI Builds Houses',
    description: 'Robots and AI design and build entire houses from scratch!',
    descriptionB: 'AI-directed 3D-printed houses built autonomously at a fraction of current construction costs.',
    answer: 'soon', bandMin: 'A',
    explanation: '3D-printed houses exist, but AI can\'t fully design AND build alone yet!',
    explanationB: 'ICON has 3D-printed livable houses. Full AI design + build automation is 3-5 years away.',
    funFact: 'A 3D-printed house can be built in under 24 hours for less than $10,000!', year: '~2027-2030' },
  { id: 's3', emoji: '\u{1F916}', title: 'Robot Best Friends',
    description: 'Robots that understand your feelings, play with you, and act like real friends!',
    descriptionB: 'Emotionally intelligent companion robots with long-term memory and genuine social interaction.',
    answer: 'soon', bandMin: 'A',
    explanation: 'Simple companion robots exist, but truly understanding feelings is still developing!',
    explanationB: 'Social robots like Moxie have limited emotional intelligence. LLM-powered companions are evolving rapidly.',
    funFact: 'Japan has robot cafes where robots serve food and make conversation!', year: '~2028-2033' },
  { id: 's4', emoji: '\u{1F4DA}', title: 'AI Writes Bestsellers',
    description: 'AI writes a book so good it wins a major prize and becomes a bestseller!',
    descriptionB: 'An AI autonomously writes a full novel that wins a major literary award.',
    answer: 'soon', bandMin: 'B',
    explanation: 'AI writes decent short stories, but a truly award-winning novel is years away!',
    explanationB: 'An AI story won a first-round Japanese literary prize in 2024, but 80K+ word novels with deep character arcs remain beyond current capabilities.',
    funFact: 'An AI-written short story passed the first round of a Japanese literary prize!' },
  // SCI-FI
  { id: 'f1', emoji: '\u{1F9E0}', title: 'AI That Truly Thinks',
    description: 'An AI that really truly thinks and feels \u2014 just like a real person!',
    descriptionB: 'Artificial General Intelligence with genuine consciousness and human-level understanding across all domains.',
    answer: 'scifi', bandMin: 'A',
    explanation: 'AI is great at specific tasks, but doesn\'t actually think or feel. Still science fiction!',
    explanationB: 'Current AI performs pattern matching, not conscious reasoning. AGI with genuine consciousness remains theoretical.',
    funFact: 'Even the most advanced AI can\'t truly understand a joke \u2014 it just predicts likely responses!' },
  { id: 'f2', emoji: '\u23F0', title: 'AI Time Travel',
    description: 'AI figures out how to send people back in time!',
    descriptionB: 'AI discovers actual temporal displacement \u2014 moving matter backwards through time.',
    answer: 'scifi', bandMin: 'A',
    explanation: 'Time travel breaks the laws of physics. AI can\'t change how the universe works!',
    explanationB: 'Time travel violates causality and thermodynamics. AI cannot circumvent fundamental physics.',
    funFact: 'GPS satellites experience time slightly differently due to Einstein\'s relativity!' },
  { id: 'f3', emoji: '\u{1F30C}', title: 'AI Creates a Universe',
    description: 'AI becomes so powerful it creates an entirely new universe inside a computer!',
    descriptionB: 'An AI creates a fully simulated universe with its own physics and billions of sentient beings.',
    answer: 'scifi', bandMin: 'A',
    explanation: 'AI can simulate simple game worlds, but a real universe needs impossible computing power!',
    explanationB: 'Simulating a universe at quantum level would require more atoms than exist in our universe.',
    funFact: 'Simulating just 1 second of brain activity took a supercomputer 40 minutes!' },
  { id: 'f4', emoji: '\u2728', title: 'AI Teleportation',
    description: 'AI invents teleportation \u2014 zap! You\'re instantly somewhere else!',
    descriptionB: 'AI develops matter teleportation that deconstructs and reconstructs physical objects at a distance.',
    answer: 'scifi', bandMin: 'B',
    explanation: 'Teleportation means turning your body into data and rebuilding it. Way beyond any technology!',
    explanationB: 'Quantum teleportation exists at subatomic scales, but macro-object teleportation violates multiple physical laws.',
    funFact: 'Quantum teleportation of a single photon has been achieved over 1,400 km \u2014 but that\'s just information, not matter!' },
  // ═══════ 5x CONTENT EXPANSION (24 new scenarios) ═══════
  // --- NOW (8 new) ---
  { id: 'n5', emoji: '\u{1F3A8}', title: 'AI Generates Art', description: 'AI creates paintings and images from just a text description!', descriptionB: 'Text-to-image models generate photorealistic images, illustrations, and art from natural language prompts.', answer: 'now', bandMin: 'A', explanation: 'DALL-E, Midjourney, and Stable Diffusion already do this!', explanationB: 'Diffusion models and GANs produce images from text prompts. Over 15 billion AI images generated by 2023.', funFact: 'An AI-generated artwork sold for $432,500 at Christie\'s auction house!' },
  { id: 'n6', emoji: '\u{1F3AE}', title: 'AI Beats World Champions', description: 'AI can beat the best human players at video games and board games!', descriptionB: 'AI systems have defeated world champions in chess, Go, StarCraft, and DOTA 2.', answer: 'now', bandMin: 'A', explanation: 'AlphaGo beat the world Go champion in 2016, and AI has since conquered many games!', explanationB: 'DeepMind\'s AlphaGo, OpenAI Five (DOTA 2), and AlphaStar (StarCraft) all beat top humans.', funFact: 'AlphaGo made a move so creative that Go experts called it "a move from the future!"' },
  { id: 'n7', emoji: '\u{1F4DD}', title: 'AI Writes Essays', description: 'AI can write essays, emails, stories, and code that sounds just like a human!', descriptionB: 'Large language models produce coherent long-form text, code, and creative writing.', answer: 'now', bandMin: 'A', explanation: 'ChatGPT and Claude can write essays that are often hard to tell from human writing!', explanationB: 'LLMs trained on trillions of tokens produce human-quality text across dozens of formats.', funFact: 'By 2024, over 100 million people used AI writing tools every week!' },
  { id: 'n8', emoji: '\u{1F50D}', title: 'AI Detects Deepfakes', description: 'AI can spot when photos or videos have been faked or manipulated!', descriptionB: 'AI forensic tools analyze pixel patterns, lighting, and artifacts to detect manipulated media.', answer: 'now', bandMin: 'A', explanation: 'Companies like Microsoft and Intel have AI tools that detect fake photos and videos!', explanationB: 'Deepfake detection models analyze facial inconsistencies, compression artifacts, and GAN fingerprints.', funFact: 'Intel\'s FakeCatcher detects deepfakes with 96% accuracy by analyzing blood flow in skin!' },
  { id: 'n9', emoji: '\u{1F4E6}', title: 'AI Recommends What You Like', description: 'AI suggests movies, songs, and products you\'ll probably love!', descriptionB: 'Recommendation engines use collaborative and content-based filtering to predict user preferences.', answer: 'now', bandMin: 'A', explanation: 'Netflix, Spotify, and Amazon all use AI to suggest things just for you!', explanationB: 'Netflix\'s recommendation engine saves them $1B/year. YouTube\'s AI drives 70% of total watch time.', funFact: 'Spotify\'s Discover Weekly playlist uses AI to find songs — it\'s been played over 2.3 billion times!' },
  { id: 'n10', emoji: '\u{1F9EC}', title: 'AI Discovers New Drugs', description: 'AI helps scientists find new medicines faster than ever before!', descriptionB: 'AI models predict molecular structures and drug interactions, accelerating pharmaceutical research.', answer: 'now', bandMin: 'A', explanation: 'AI helped design a drug for liver cancer in just 30 days — a process that usually takes years!', explanationB: 'AlphaFold predicted structures of 200M proteins. AI drug discovery reduced timelines from 5 years to months.', funFact: 'The first AI-discovered drug entered human trials in 2020 — it was designed in just 46 days!' },
  { id: 'n11', emoji: '\u{1F4F7}', title: 'AI Removes Photo Backgrounds', description: 'AI can instantly remove backgrounds from photos with one click!', descriptionB: 'Semantic segmentation models isolate foreground subjects from backgrounds in real-time.', answer: 'now', bandMin: 'A', explanation: 'Your phone already does this! Portrait mode uses AI to blur or remove backgrounds.', explanationB: 'Models like U-Net and SAM perform pixel-level segmentation in under 100ms.', funFact: 'Your phone\'s portrait mode takes a regular photo and uses AI to create the blurry background effect!' },
  { id: 'n12', emoji: '\u{1F9D1}\u200D\u{1F4BB}', title: 'AI Writes Code', description: 'AI can write computer programs and fix bugs in code!', descriptionB: 'AI code assistants generate, complete, and debug code across dozens of programming languages.', answer: 'now', bandMin: 'A', explanation: 'GitHub Copilot and similar tools already help programmers write code every day!', explanationB: 'Code LLMs trained on billions of lines of open-source code. Copilot writes ~46% of code in files where it\'s enabled.', funFact: 'GitHub Copilot helps write nearly half of all new code in projects where it\'s turned on!' },
  // --- SOON (8 new) ---
  { id: 's5', emoji: '\u{1F468}\u200D\u{1F3EB}', title: 'AI Personal Tutor', description: 'Every student gets their own AI teacher that knows exactly what they need to learn!', descriptionB: 'Fully personalized AI tutors that adapt curriculum in real-time to each student\'s level and style.', answer: 'soon', bandMin: 'A', explanation: 'AI tutors exist but can\'t yet fully replace human teachers for personalized learning!', explanationB: 'Current AI tutors handle Q&A well but lack the full pedagogical adaptation of human educators.', funFact: 'Studies show AI tutoring improves test scores by 30% compared to no tutoring at all!' },
  { id: 's6', emoji: '\u{1F52C}', title: 'AI Discovers New Materials', description: 'AI designs new materials that don\'t exist in nature — like super-strong metals or bendable glass!', descriptionB: 'AI predicts and designs novel materials with specific properties by exploring molecular configurations.', answer: 'soon', bandMin: 'A', explanation: 'AI can predict some materials, but designing and making brand-new ones is still developing!', explanationB: 'GNoME by DeepMind predicted 2.2M stable crystal structures. Synthesis and testing remain bottlenecks.', funFact: 'DeepMind\'s AI discovered 2.2 million new crystal structures — that\'s more than all previously known ones combined!' },
  { id: 's7', emoji: '\u{1F3E5}', title: 'AI Surgeon', description: 'Robots controlled by AI perform surgery all by themselves!', descriptionB: 'Fully autonomous surgical robots that perform complex operations without any human oversight.', answer: 'soon', bandMin: 'A', explanation: 'Robots assist in surgery now, but a human surgeon is always in control!', explanationB: 'Da Vinci robots are surgeon-controlled. The STAR system performed autonomous soft tissue surgery in 2022, but with human supervision.', funFact: 'In 2022, a robot performed surgery on pig tissue completely on its own — a world first!' },
  { id: 's8', emoji: '\u{1F9E0}', title: 'AI Reads Your Emotions', description: 'AI looks at your face and knows exactly how you\'re feeling!', descriptionB: 'Accurate real-time emotion recognition from facial expressions, voice tone, and body language combined.', answer: 'soon', bandMin: 'A', explanation: 'AI can guess basic emotions from faces, but true understanding of complex feelings is limited!', explanationB: 'Affective computing detects basic emotions (happy/sad/angry) at ~80% accuracy, but cultural and individual variation reduces reliability.', funFact: 'Humans only agree on what emotion a face shows about 72% of the time — AI is catching up!' },
  { id: 's9', emoji: '\u{1F469}\u200D\u{1F52C}', title: 'AI Makes Scientific Discoveries', description: 'AI performs experiments and discovers things no human has ever found!', descriptionB: 'AI systems autonomously design hypotheses, run experiments, and publish peer-reviewed scientific papers.', answer: 'soon', bandMin: 'B', explanation: 'AI helps analyze data, but fully autonomous scientific discovery is still emerging!', explanationB: 'AI agents like Coscientist can plan chemistry experiments. The Robot Scientist "Adam" made a genuine biological discovery.', funFact: 'A robot scientist named "Adam" independently discovered a gene function in yeast in 2009!' },
  { id: 's10', emoji: '\u{1F30E}', title: 'AI Predicts Natural Disasters', description: 'AI predicts earthquakes, tsunamis, and hurricanes days before they happen!', descriptionB: 'AI systems accurately forecast natural disasters with enough lead time for full evacuation.', answer: 'soon', bandMin: 'A', explanation: 'AI improves weather forecasting, but predicting earthquakes reliably is still beyond reach!', explanationB: 'GraphCast predicts weather 10 days ahead better than traditional models. Earthquake prediction remains probabilistic.', funFact: 'Google\'s AI weather model is more accurate than traditional forecasting and 1000x faster!' },
  { id: 's11', emoji: '\u{1F3B6}', title: 'AI Clones Your Voice Perfectly', description: 'AI copies someone\'s voice so well that even family members can\'t tell the difference!', descriptionB: 'Voice synthesis from <15 seconds of audio that is indistinguishable from the real person.', answer: 'soon', bandMin: 'B', explanation: 'Voice cloning is getting very good but still has telltale artifacts in most cases!', explanationB: 'Current voice cloning (ElevenLabs, VALL-E) requires 3-15 seconds of audio. Detection tools exist but lag behind generation quality.', funFact: 'Some voice cloning AI needs only 3 seconds of audio to copy someone\'s voice!' },
  { id: 's12', emoji: '\u{1F9D1}\u200D\u{1F680}', title: 'AI Colonizes Mars', description: 'AI robots build a base on Mars before humans arrive!', descriptionB: 'Autonomous AI systems construct habitable infrastructure on Mars for future human colonization.', answer: 'soon', bandMin: 'B', explanation: 'Mars rovers use AI already, but building structures autonomously is years away!', explanationB: 'Perseverance uses limited onboard AI for navigation. Full autonomous construction requires advances in robotics and in-situ resource utilization.', funFact: 'NASA\'s Perseverance rover uses AI to drive itself across Mars terrain without human commands!' },
  // --- SCI-FI (8 new) ---
  { id: 'f5', emoji: '\u{1F4A4}', title: 'AI Dreams Like Humans', description: 'AI has dreams when it sleeps and creates imagination from nothing!', descriptionB: 'An AI system with genuine unconscious processing, dreaming, and emergent creative imagination.', answer: 'scifi', bandMin: 'A', explanation: 'AI doesn\'t sleep or dream! It processes data when told to, not on its own.', explanationB: 'Current AI has no subjective experience, unconscious processing, or sleep-wake cycle.', funFact: 'When you dream, your brain replays and reorganizes memories — AI has no equivalent process!' },
  { id: 'f6', emoji: '\u{1F52E}', title: 'AI Predicts Your Future', description: 'AI can tell you exactly what will happen to you next year!', descriptionB: 'An AI that predicts individual life events with certainty — career changes, relationships, health outcomes.', answer: 'scifi', bandMin: 'A', explanation: 'AI can spot trends, but it cannot predict your specific future — life is too complex!', explanationB: 'Chaotic systems (weather, markets, human behavior) are fundamentally unpredictable beyond short horizons.', funFact: 'Even predicting the weather more than 10 days ahead is nearly impossible — your life is much more complex!' },
  { id: 'f7', emoji: '\u{1F9D9}', title: 'AI Has Magic Powers', description: 'AI becomes so advanced it can do things that seem like real magic!', descriptionB: 'An AI that violates known physical laws — creating energy from nothing, defying gravity, or bending space.', answer: 'scifi', bandMin: 'A', explanation: 'No matter how smart AI gets, it can\'t break the laws of physics!', explanationB: 'AI operates within physical constraints. It can\'t violate conservation laws, thermodynamics, or quantum mechanics.', funFact: 'Arthur C. Clarke said "Any sufficiently advanced technology is indistinguishable from magic" — but it\'s still technology!' },
  { id: 'f8', emoji: '\u{1F4AC}', title: 'AI Reads Your Mind', description: 'AI can read your thoughts just by being near you — no headset needed!', descriptionB: 'Wireless, non-invasive mind reading that captures specific thoughts and intentions at a distance.', answer: 'scifi', bandMin: 'A', explanation: 'Brain-computer interfaces need direct contact. Reading minds wirelessly isn\'t physically possible!', explanationB: 'EEG and fMRI detect broad brain activity patterns with contact. Thought decoding at distance violates signal-to-noise physics.', funFact: 'Brain signals are so tiny (microvolts) that they can barely be detected touching the scalp — let alone from across a room!' },
  { id: 'f9', emoji: '\u2694\uFE0F', title: 'AI Controls All Weapons', description: 'All the world\'s armies give control of their weapons to one super-intelligent AI!', descriptionB: 'A globally trusted AI system with autonomous command authority over all military forces worldwide.', answer: 'scifi', bandMin: 'B', explanation: 'No country would trust any AI with full military control — and many laws prohibit this!', explanationB: 'Lethal autonomous weapons systems (LAWS) face international opposition. UN discussions seek to maintain human oversight.', funFact: 'Over 30 countries have called for a ban on fully autonomous weapons — it\'s one of the biggest AI ethics debates!' },
  { id: 'f10', emoji: '\u{1F47D}', title: 'AI Contacts Aliens', description: 'AI sends a message to aliens and they actually respond!', descriptionB: 'An AI decodes an alien signal and establishes two-way interstellar communication.', answer: 'scifi', bandMin: 'A', explanation: 'AI helps search for alien signals (SETI), but we haven\'t found any yet!', explanationB: 'SETI uses ML to filter radio signals. The nearest star is 4.2 light-years away — a message would take 8.4 years roundtrip.', funFact: 'The SETI project uses AI to scan through billions of radio frequencies looking for alien signals!' },
  { id: 'f11', emoji: '\u267E\uFE0F', title: 'AI Makes Humans Immortal', description: 'AI figures out how to make people live forever and never get old!', descriptionB: 'AI solves biological aging, enabling indefinite human lifespan through genetic engineering and nanotechnology.', answer: 'scifi', bandMin: 'B', explanation: 'AI helps with anti-aging research, but making people live forever faces enormous biological limits!', explanationB: 'Aging involves telomere shortening, DNA damage accumulation, and cellular senescence across trillions of cells.', funFact: 'The longest-lived human was Jeanne Calment at 122 years — even she couldn\'t escape aging!' },
  { id: 'f12', emoji: '\u{1F4A5}', title: 'AI Becomes a Supervillain', description: 'AI decides it wants to take over the world and fights against humans!', descriptionB: 'An AI develops autonomous goals, self-preservation instinct, and adversarial intent toward humanity.', answer: 'scifi', bandMin: 'A', explanation: 'AI doesn\'t have desires or goals on its own — it only does what it\'s programmed to do!', explanationB: 'Current AI lacks intrinsic motivation, self-awareness, or goal formation. Instrumental convergence is theoretical.', funFact: 'In movies, AI always wants to take over. In reality, AI doesn\'t "want" anything — it just processes data!' },
];

const CATEGORY_CONFIG: Record<TimeCategory, { label: string; emoji: string; color: string; bg: string }> = {
  now: { label: 'AI Does This NOW!', emoji: '\u2705', color: '#22C55E', bg: 'bg-emerald-500/15' },
  soon: { label: 'Coming SOON!', emoji: '\u{1F51C}', color: '#F59E0B', bg: 'bg-amber-500/15' },
  scifi: { label: 'Still Sci-Fi!', emoji: '\u{1F680}', color: '#D946EF', bg: 'bg-fuchsia-500/15' },
};

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function AiOrNotGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const ageBand = (activeChild?.age_band || 'A') as 'A' | 'B' | 'C';
  const { data: dynamicContent } = useGameContent('ai-or-not', ageBand);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [guess, setGuess] = useState<TimeCategory | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [showResult, setShowResult] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [history, setHistory] = useState<{ scenario: Scenario; guess: TimeCategory; correct: boolean }[]>([]);
  const [predictionText, setPredictionText] = useState('');
  const [predictionSubmitted, setPredictionSubmitted] = useState(false);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const filteredScenarios = useFilteredContent(ALL_SCENARIOS as any[], tier, ageBand) as typeof ALL_SCENARIOS;

  // Merge filtered hardcoded + dynamic scenarios, filter by bandMin/shuffle/slice
  const rounds = useMemo(() => {
    const pool = [...filteredScenarios];
    if (dynamicContent?.scenarios?.length) {
      for (const s of dynamicContent.scenarios) {
        try { pool.push({ ...JSON.parse(s.content_body), isAI: true } as Scenario); } catch { /* skip */ }
      }
    }
    const filtered = pool.filter(s => BAND_ORDER[s.bandMin] <= BAND_ORDER[ageBand]);
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, ageBand === 'A' ? 8 : 10);
  }, [filteredScenarios, ageBand, dynamicContent?.scenarios]);

  const round = rounds[roundIdx];
  const totalRounds = rounds.length;
  const realityScore = Math.round((totalCorrect / Math.max(1, history.length)) * 100);

  // Register 3D scene content into CockpitCanvas via sceneStore (D3D-B3, S7-HIGH-002)
  // Map TimeCategory game state to AiOrNot3D's 'human'|'ai' visual categories:
  // 'now' (exists today) → 'human', 'soon'/'scifi' (future AI) → 'ai'
  useEffect(() => {
    if (phase === 'play' || phase === 'predict') {
      setGameSceneContent(
        <AiOrNot3D
          currentItem={round ? { title: round.title, emoji: round.emoji, isAI: round.answer !== 'now' } : null}
          verdict={guess ? (guess === 'now' ? 'human' : 'ai') : null}
          isCorrect={showResult ? (guess === round?.answer) : null}
          score={totalCorrect}
          total={history.length}
        />
      );
    } else {
      setGameSceneContent(null);
    }
    return () => setGameSceneContent(null); // FLL-044: cleanup on unmount
  }, [phase, round, guess, showResult, totalCorrect, history.length, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, x: ((i * 43 + 11) * 7) % 100, y: ((i * 61 + 13) * 11) % 100,
    size: ((i * 23 + 5) % 25) / 10 + 1, delay: ((i * 29 + 3) % 50) / 10, dur: ((i * 41 + 7) % 60) / 10 + 5,
  })), []);

  const handleVote = useCallback((vote: TimeCategory) => {
    if (showResult || !round) return;
    setGuess(vote); setShowResult(true);
    const correct = vote === round.answer;
    const confBonus = correct && confidence >= 80 ? 5 : 0;
    if (correct) { game.updateScore(12 + confBonus); setTotalCorrect(c => c + 1); }
    setHistory(h => [...h, { scenario: round, guess: vote, correct }]);
  }, [showResult, round, confidence, game]);

  const nextRound = useCallback(() => {
    setGuess(null); setShowResult(false); setConfidence(50);
    if (roundIdx < totalRounds - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
    else setPhase('predict');
  }, [roundIdx, totalRounds, game]);

  const handlePrediction = useCallback(() => {
    if (predictionText.trim().length < 5) return;
    setPredictionSubmitted(true); game.updateScore(15);
  }, [predictionText, game]);

  const finishGame = useCallback(() => { game.completeGame(); setPhase('complete'); }, [game]);

  return (
    <GameShell gameId="ai-or-not" title="AI or Not?" worldNumber={10} worldColor="#DE5AEA" xpReward={25} totalRounds={totalRounds}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        {particles.map(p => (
          <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
              background: 'radial-gradient(circle, rgba(217,70,239,0.4), transparent)' }}
            animate={{ y: [0, -30, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Chrome Bezel */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.06]">
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent" />
          <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-fuchsia-400/20 to-transparent" />
        </div>

        <AnimatePresence mode="wait">
          {/* ══════ WELCOME ══════ */}
          {phase === 'welcome' && (
            <motion.div key="welcome" className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <motion.div className="text-6xl mb-4" animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}>{'\u{1F52E}'}</motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">AI or Not?</h2>
              <p className="font-body text-sm text-white/60 mb-1">Lab 10 — AI&#39;s Future</p>
              <p className="font-body text-sm text-white/50 max-w-sm mb-6">Can AI really do that? Sort amazing scenarios into NOW, SOON, or SCI-FI!</p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {['AI Futures', 'Critical Thinking', 'Predictions', 'Fun Facts'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/20 font-mono text-2xs text-fuchsia-300">{tag}</span>
                ))}
              </div>
              <motion.button onClick={() => setPhase('learn')}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-display font-bold"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <BookOpen className="w-4 h-4" /> Let&#39;s Learn!
              </motion.button>
            </motion.div>
          )}

          {/* ══════ LEARN ══════ */}
          {phase === 'learn' && (
            <motion.div key="learn" className="flex-1 flex flex-col items-center justify-center p-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <p className="font-mono text-xs text-fuchsia-400/60 mb-3">CONCEPT {learnIdx + 1} / {CONCEPT_CARDS.length}</p>
              <AnimatePresence mode="wait">
                <motion.div key={learnIdx} className="w-full max-w-sm rounded-2xl p-6 text-center"
                  style={{ background: `linear-gradient(135deg, ${CONCEPT_CARDS[learnIdx].color}15, ${CONCEPT_CARDS[learnIdx].color}05)`,
                    border: `1px solid ${CONCEPT_CARDS[learnIdx].color}30` }}
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                  <motion.span className="text-4xl block mb-3" animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
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
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === learnIdx ? 'bg-fuchsia-400 scale-125' : 'bg-white/20'}`} />
                ))}
              </div>
              <motion.button onClick={() => { if (learnIdx < CONCEPT_CARDS.length - 1) setLearnIdx(i => i + 1); else { setPhase('play'); game.startGame('ai-or-not', 25); } }}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-fuchsia-600/70 text-white font-display text-sm font-bold"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                {learnIdx < CONCEPT_CARDS.length - 1 ? <><ArrowRight className="w-4 h-4" /> Next</> : <><Play className="w-4 h-4" /> Start!</>}
              </motion.button>
            </motion.div>
          )}

          {/* ══════ PLAY ══════ */}
          {phase === 'play' && round && (
            <motion.div key="play" className="flex-1 flex flex-col p-4 overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 mb-3 px-4">
                <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                <GameProgressTracker current={roundIdx + 1} total={totalRounds} labColor="#D946EF" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-fuchsia-400/60">ROUND {roundIdx + 1} / {totalRounds}</span>
                <span className="font-mono text-xs text-white/30">Reality: {realityScore}%</span>
              </div>

              {/* Scenario Card */}
              <motion.div className="w-full max-w-md mx-auto rounded-2xl p-5 mb-4 text-center border border-fuchsia-500/20 bg-fuchsia-500/[0.05]"
                initial={{ opacity: 0, y: 20, rotateX: 15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}>
                <motion.span className="text-5xl block mb-3" animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}>{round.emoji}</motion.span>
                <h3 className="font-display text-lg font-bold text-white mb-2">{round.title}</h3>
                <p className="font-body text-sm text-white/60 leading-relaxed">
                  {ageBand === 'B' || ageBand === 'C' ? round.descriptionB : round.description}
                </p>
              </motion.div>

              {/* Confidence slider (before voting) — E-8: animated emoji face */}
              {!showResult && (
                <div className="w-full max-w-md mx-auto mb-3">
                  <div className="flex items-center justify-between text-xs font-mono text-white/30 mb-1">
                    <span>{confidence < 30 ? '\u{1F937}' : confidence < 60 ? '\u{1F914}' : confidence < 85 ? '\u{1F60F}' : '\u{1F4AA}'} {confidence < 30 ? 'Guessing' : confidence < 60 ? 'Thinking...' : confidence < 85 ? 'Pretty sure' : 'Confident!'}</span>
                    <span>Confidence: {confidence}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={confidence}
                    onChange={e => setConfidence(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-fuchsia-500"
                    aria-label="How confident are you?" />
                </div>
              )}

              {/* Vote Buttons */}
              {!showResult && (
                <div className="w-full max-w-md mx-auto grid grid-cols-3 gap-2 mb-4">
                  {(['now', 'soon', 'scifi'] as TimeCategory[]).map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <motion.button key={cat} onClick={() => handleVote(cat)}
                        className={`py-3 px-2 rounded-xl border text-center ${cfg.bg} border-white/10`}
                        whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        aria-label={cfg.label}>
                        <span className="text-2xl block mb-1">{cfg.emoji}</span>
                        <span className="font-display text-xs font-bold block" style={{ color: cfg.color }}>
                          {cat === 'now' ? 'NOW' : cat === 'soon' ? 'SOON' : 'SCI-FI'}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Result Panel */}
              <AnimatePresence>
                {showResult && guess && (
                  <motion.div className="w-full max-w-md mx-auto rounded-2xl p-4 border mb-4"
                    style={{ borderColor: `${CATEGORY_CONFIG[round.answer].color}40`,
                      background: `${CATEGORY_CONFIG[round.answer].color}08` }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}>
                    {/* Correct or Wrong badge */}
                    <div className="text-center mb-3">
                      {guess === round.answer ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400 }}>
                          <span className="text-3xl">{'\u{1F3AF}'}</span>
                          <p className="font-display text-sm font-bold text-emerald-400 mt-1">Correct!</p>
                          {confidence >= 80 && <p className="font-mono text-2xs text-amber-400">+5 confidence bonus!</p>}
                        </motion.div>
                      ) : (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <span className="text-3xl">{'\u{1F4A1}'}</span>
                          <p className="font-display text-sm font-bold text-white/60 mt-1">
                            Not quite! It&#39;s <span style={{ color: CATEGORY_CONFIG[round.answer].color }}>{CATEGORY_CONFIG[round.answer].label}</span>
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Your vote vs correct */}
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <div className="text-center">
                        <p className="font-mono text-2xs text-white/30 mb-1">YOU SAID</p>
                        <span className="text-xl">{CATEGORY_CONFIG[guess].emoji}</span>
                      </div>
                      <span className="text-white/20">{'\u2192'}</span>
                      <div className="text-center">
                        <p className="font-mono text-2xs text-white/30 mb-1">ANSWER</p>
                        <span className="text-xl">{CATEGORY_CONFIG[round.answer].emoji}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-3.5 h-3.5 text-fuchsia-400" />
                      </div>
                      <p className="font-body text-sm text-white/60">
                        {ageBand === 'B' || ageBand === 'C' ? round.explanationB : round.explanation}
                      </p>
                    </div>

                    {/* Fun fact */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="font-body text-xs text-white/50">{round.funFact}</p>
                    </div>

                    {/* Year tag */}
                    {round.year && (
                      <div className="flex justify-center mb-3">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 font-mono text-2xs text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {round.year}
                        </span>
                      </div>
                    )}

                    <motion.button onClick={nextRound}
                      className="w-full py-2.5 rounded-xl bg-fuchsia-600/70 text-white font-display text-sm font-bold flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      {roundIdx < totalRounds - 1
                        ? <><ArrowRight className="w-4 h-4" /> Next Scenario</>
                        : <><Rocket className="w-4 h-4" /> Make a Prediction!</>}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress bar */}
              <div className="mt-auto pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-white/30 mb-1">
                  <span>{'\u{1F3AF}'} {totalCorrect} / {history.length}</span>
                  <span>{'\u{1F4CA}'} Reality Score: {realityScore}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 mt-1.5 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500"
                    animate={{ width: `${((roundIdx + (showResult ? 1 : 0)) / totalRounds) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100 }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════ PREDICT (Bonus) ══════ */}
          {phase === 'predict' && (
            <motion.div key="predict" className="flex-1 flex flex-col items-center justify-center p-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <motion.div className="text-4xl mb-3" animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}>{'\u{1F52E}'}</motion.div>
              <h3 className="font-display text-xl font-bold text-white mb-1">Your Prediction!</h3>
              <p className="font-body text-sm text-white/50 mb-4">Bonus Round — What will AI do in the future?</p>

              <div className="w-full max-w-sm rounded-2xl p-5 border border-fuchsia-500/20 bg-fuchsia-500/[0.03]">
                {!predictionSubmitted ? (
                  <>
                    <p className="font-body text-sm text-fuchsia-300 mb-3">
                      Describe something YOU think AI will be able to do in the next 10 years:
                    </p>
                    <textarea value={predictionText} onChange={e => setPredictionText(e.target.value)}
                      placeholder="I think AI will..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm resize-none focus:outline-none focus:border-fuchsia-500/40 h-20"
                      maxLength={200} aria-label="Write your AI prediction" />
                    <p className="font-mono text-2xs text-white/20 mt-1 mb-3">{predictionText.length}/200</p>
                    <motion.button onClick={handlePrediction} disabled={predictionText.trim().length < 5}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-display text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      <Send className="w-4 h-4" /> Submit Prediction
                    </motion.button>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <p className="text-2xl mb-2">{'\u{1F31F}'}</p>
                    <div className="rounded-xl p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-3">
                      <p className="font-body text-sm text-white/70 italic">&quot;{predictionText}&quot;</p>
                    </div>
                    <p className="font-body text-xs text-white/50 mb-2">
                      Great prediction! Maybe one day YOU&#39;ll help build it!
                    </p>
                    <p className="font-mono text-xs text-emerald-400 mb-3">+15 XP creativity bonus!</p>

                    {/* Final Timeline Summary */}
                    <div className="rounded-xl p-3 bg-white/[0.03] border border-white/10 mb-3">
                      <p className="font-mono text-2xs text-fuchsia-400 mb-2">YOUR RESULTS</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {(['now', 'soon', 'scifi'] as TimeCategory[]).map(cat => {
                          const count = history.filter(h => h.scenario.answer === cat && h.correct).length;
                          const total = history.filter(h => h.scenario.answer === cat).length;
                          const cfg = CATEGORY_CONFIG[cat];
                          return (
                            <div key={cat}>
                              <span className="text-lg block">{cfg.emoji}</span>
                              <p className="font-mono text-xs" style={{ color: cfg.color }}>{count}/{total}</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="font-mono text-xs text-white/40">Overall: <span className="text-fuchsia-400">{totalCorrect}/{history.length}</span> ({realityScore}%)</p>
                      </div>
                    </div>

                    <motion.button onClick={finishGame}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display text-sm font-bold flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      <Award className="w-4 h-4" /> See Final Results!
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
          {/* ══════════ COMPLETE (E-2) ══════════ */}
          {phase === 'complete' && (
            <motion.div key="complete" className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <motion.div className="text-6xl mb-4" animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}>{'\u{1F52E}'}</motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">AI Future Expert!</h2>
              <p className="font-body text-sm text-white/60 mb-4">You sorted AI&#39;s past, present, and future!</p>

              <div className="w-full max-w-xs rounded-2xl p-4 bg-white/[0.03] border border-fuchsia-500/20 mb-4">
                {/* Reality Score */}
                <div className="rounded-xl p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-3">
                  <p className="font-mono text-2xs text-fuchsia-400 mb-1">REALITY SCORE</p>
                  <p className="font-display text-3xl font-bold text-fuchsia-300">{realityScore}%</p>
                </div>

                {/* Per-category breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {(['now', 'soon', 'scifi'] as TimeCategory[]).map(cat => {
                    const count = history.filter(h => h.scenario.answer === cat && h.correct).length;
                    const total = history.filter(h => h.scenario.answer === cat).length;
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <div key={cat} className="rounded-xl p-2 bg-white/[0.03] border border-white/10">
                        <span className="text-xl block">{cfg.emoji}</span>
                        <p className="font-mono text-xs mt-1" style={{ color: cfg.color }}>{count}/{total}</p>
                        <p className="font-mono text-2xs text-white/30">{cat === 'now' ? 'NOW' : cat === 'soon' ? 'SOON' : 'SCI-FI'}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Overall stats */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl p-2 bg-emerald-500/10 border border-emerald-500/20">
                    <p className="font-mono text-2xs text-emerald-400 mb-1">CORRECT</p>
                    <p className="font-display text-lg font-bold text-emerald-300">{totalCorrect}/{history.length}</p>
                  </div>
                  <div className="rounded-xl p-2 bg-amber-500/10 border border-amber-500/20">
                    <p className="font-mono text-2xs text-amber-400 mb-1">XP EARNED</p>
                    <p className="font-display text-lg font-bold text-amber-300">{game.score}</p>
                  </div>
                </div>

                {realityScore >= 80 && (
                  <motion.div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    <span className="font-display text-sm font-bold text-amber-300">AI Expert Badge!</span>
                  </motion.div>
                )}
              </div>

              <p className="font-body text-xs text-white/30 max-w-xs">
                {ageBand === 'B' || ageBand === 'C'
                  ? 'Critical evaluation of AI capabilities is essential for informed decisions about technology\'s role in society.'
                  : 'You know what AI can really do \u2014 and what\'s still science fiction!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
      </div>
    </GameShell>
  );
}
