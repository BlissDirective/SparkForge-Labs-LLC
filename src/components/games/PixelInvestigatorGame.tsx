// ================================================================
// PIXEL INVESTIGATOR V2 — Lab 3 (Neural Networks) — STANDARD POLISH
//
// Concept: Image is heavily blurred. Reveal in stages, guess with
// fewer reveals = more points. Teaches how CNNs process images
// at different resolutions — low-res features first, details later.
//
// V2 Upgrades:
// - Chrome bezel (pink, Lab 3)
// - Particle background
// - Welcome phase with concept intro
// - Age-band explanations (C: feature extraction, receptive fields)
// - 48 images across 3 difficulty tiers
// - Confidence meter showing "how sure are you?"
// - Reveal stages visualized as resolution layers
// - Points breakdown with multiplier for early guesses
// - ARIA labels, keyboard nav
// ================================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { Eye, Search, Zap } from 'lucide-react';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';
import { useFilteredContent } from '@/hooks/useFilteredContent';

// 3D Environment (no SSR)
const PixelInvestigatorEnvironment = dynamic(
  () => import('@/components/3d/environments/PixelInvestigatorEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

const LEARN_CARDS = [
  { title: 'How Computers See', emoji: '👁️', desc: 'Computers don\'t see images like we do. They see millions of tiny colored squares called pixels, and use math to figure out what\'s in the picture.' },
  { title: 'Pixels to Patterns', emoji: '🔲', desc: 'AI looks at groups of pixels to find edges, shapes, and textures. Starting from simple patterns, it builds up to recognizing whole objects!' },
  { title: 'Layers of Understanding', emoji: '🎂', desc: 'A CNN (Convolutional Neural Network) uses many layers — early layers find edges, middle layers find shapes, and deep layers recognize objects!' },
];

interface ImageRound {
  emoji: string;
  answer: string;
  choices: string[];
  category: string;
  tier: 'easy' | 'medium' | 'hard';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  hintA: string;
  hintC: string;
}

const IMAGES: ImageRound[] = [
  // ── Easy tier — distinct shapes ──────────────────────
  { emoji: '\u{1F431}', answer: 'Cat', choices: ['Cat', 'Dog', 'Rabbit'], category: 'Animals', tier: 'easy', difficulty: 'easy',
    hintA: 'It has whiskers and pointy ears!', hintC: 'High-frequency features: ear triangles + whisker lines distinguish from similar quadrupeds.' },
  { emoji: '\u{1F680}', answer: 'Rocket', choices: ['Rocket', 'Airplane', 'Firework'], category: 'Vehicles', tier: 'easy', difficulty: 'easy',
    hintA: 'It points up and goes to space!', hintC: 'Vertical axis symmetry with tapered top — distinct from airplane wing profile.' },
  { emoji: '\u{1F33B}', answer: 'Sunflower', choices: ['Sunflower', 'Daisy', 'Rose'], category: 'Nature', tier: 'easy', difficulty: 'easy',
    hintA: "It's big and yellow!", hintC: 'Yellow radial pattern. Fibonacci spiral in seed arrangement is a distinguishing feature.' },
  { emoji: '\u{1F3B8}', answer: 'Guitar', choices: ['Guitar', 'Violin', 'Banjo'], category: 'Music', tier: 'easy', difficulty: 'easy',
    hintA: 'It has strings and a long neck!', hintC: 'Figure-8 body contour + narrow neck. String count and fret pattern distinguish from violin.' },
  { emoji: '\u{1F436}', answer: 'Dog', choices: ['Dog', 'Wolf', 'Bear'], category: 'Animals', tier: 'easy', difficulty: 'easy',
    hintA: 'It barks and wags its tail!', hintC: 'Floppy ears and shorter muzzle distinguish domestic dog from wolf at low resolution.' },
  { emoji: '\u{1F697}', answer: 'Car', choices: ['Car', 'Bus', 'Truck'], category: 'Vehicles', tier: 'easy', difficulty: 'easy',
    hintA: 'It has four wheels and fits your family!', hintC: 'Compact aspect ratio distinguishes sedan from elongated bus or tall truck profile.' },
  { emoji: '\u{1F34E}', answer: 'Apple', choices: ['Apple', 'Cherry', 'Tomato'], category: 'Food', tier: 'easy', difficulty: 'easy',
    hintA: 'It has a small stem on top!', hintC: 'Spherical with stem. Leaf presence and size ratio differentiate from cherry and tomato.' },
  { emoji: '\u{2B50}', answer: 'Star', choices: ['Star', 'Sun', 'Sparkle'], category: 'Nature', tier: 'easy', difficulty: 'easy',
    hintA: 'It twinkles in the night sky!', hintC: 'Five-pointed radial symmetry. Sun has rays emanating outward; sparkle has four points.' },
  { emoji: '\u{26BD}', answer: 'Soccer Ball', choices: ['Soccer Ball', 'Basketball', 'Globe'], category: 'Sports', tier: 'easy', difficulty: 'easy',
    hintA: 'You kick this round ball!', hintC: 'Pentagon/hexagon pattern on sphere surface. Basketball has curved lines; globe has landmass shapes.' },
  { emoji: '\u{1F4BB}', answer: 'Laptop', choices: ['Laptop', 'Tablet', 'TV'], category: 'Technology', tier: 'easy', difficulty: 'easy',
    hintA: 'It folds open and has a keyboard!', hintC: 'Hinge joint between screen and keyboard base. Clamshell form factor distinguishes from flat tablet.' },
  { emoji: '\u{1F40B}', answer: 'Whale', choices: ['Whale', 'Shark', 'Dolphin'], category: 'Animals', tier: 'easy', difficulty: 'easy',
    hintA: 'It is the biggest animal in the ocean!', hintC: 'Massive body with baleen plates. Horizontal tail fluke distinguishes from vertical shark tail.' },
  { emoji: '\u{1F3A4}', answer: 'Microphone', choices: ['Microphone', 'Flashlight', 'Lollipop'], category: 'Music', tier: 'easy', difficulty: 'easy',
    hintA: 'You sing into this!', hintC: 'Spherical mesh head on cylindrical handle. Distinct silhouette from flashlight lens or lollipop disc.' },

  // ── Medium tier — similar shapes ─────────────────────
  { emoji: '\u{1F418}', answer: 'Elephant', choices: ['Elephant', 'Hippo', 'Rhino'], category: 'Animals', tier: 'medium', difficulty: 'medium',
    hintA: "It's the biggest land animal with a long trunk!", hintC: 'Trunk is the key distinguishing feature. Gray color shared with rhino — need shape analysis.' },
  { emoji: '\u{1F98B}', answer: 'Butterfly', choices: ['Butterfly', 'Dragonfly', 'Moth'], category: 'Nature', tier: 'medium', difficulty: 'medium',
    hintA: 'It has colorful wings that spread wide!', hintC: 'Bilateral wing symmetry with broad wing area. Dragonfly has narrow elongated wings.' },
  { emoji: '\u{1F382}', answer: 'Cake', choices: ['Cake', 'Pie', 'Muffin'], category: 'Food', tier: 'medium', difficulty: 'medium',
    hintA: 'It usually has candles on top!', hintC: 'Cylindrical layered structure with frosting texture. Candles add vertical line features.' },
  { emoji: '\u{1F3E0}', answer: 'House', choices: ['House', 'Castle', 'Barn'], category: 'Buildings', tier: 'medium', difficulty: 'medium',
    hintA: 'It has a triangle roof and a door!', hintC: 'Triangular roof + rectangular base. Castle has turrets; barn has gambrel roof.' },
  { emoji: '\u{1F40A}', answer: 'Crocodile', choices: ['Crocodile', 'Lizard', 'Alligator'], category: 'Animals', tier: 'medium', difficulty: 'medium',
    hintA: 'It has a long snout and lives near water!', hintC: 'V-shaped snout distinguishes from U-shaped alligator. Body length and scale pattern differ from lizard.' },
  { emoji: '\u{1F6F4}', answer: 'Scooter', choices: ['Scooter', 'Bicycle', 'Skateboard'], category: 'Vehicles', tier: 'medium', difficulty: 'medium',
    hintA: 'You stand on it and push with one foot!', hintC: 'Handlebar + deck + two inline wheels. Bicycle has seat + pedals; skateboard lacks handlebars.' },
  { emoji: '\u{1F352}', answer: 'Cherry', choices: ['Cherry', 'Grape', 'Plum'], category: 'Food', tier: 'medium', difficulty: 'medium',
    hintA: 'It comes in pairs on a stem!', hintC: 'Twin spheres with forked stem. Grape clusters in bunches; plum is single and larger.' },
  { emoji: '\u{1F3D4}', answer: 'Mountain', choices: ['Mountain', 'Pyramid', 'Volcano'], category: 'Nature', tier: 'medium', difficulty: 'medium',
    hintA: 'It has a snowy peak and is very tall!', hintC: 'Irregular triangular profile with snow cap. Pyramid has straight edges; volcano has crater at summit.' },
  { emoji: '\u{1F3BE}', answer: 'Tennis', choices: ['Tennis', 'Badminton', 'Ping Pong'], category: 'Sports', tier: 'medium', difficulty: 'medium',
    hintA: 'You hit a fuzzy green ball with a racket!', hintC: 'Oval racket head with string pattern. Badminton shuttlecock shape differs; ping pong paddle is smaller and solid.' },
  { emoji: '\u{1F4F7}', answer: 'Camera', choices: ['Camera', 'Binoculars', 'Projector'], category: 'Technology', tier: 'medium', difficulty: 'medium',
    hintA: 'It takes pictures with a click!', hintC: 'Rectangular body with protruding lens cylinder. Binoculars have dual tubes; projector has single wide lens.' },
  { emoji: '\u{1F3B5}', answer: 'Music Note', choices: ['Music Note', 'Treble Clef', 'Headphones'], category: 'Music', tier: 'medium', difficulty: 'medium',
    hintA: 'You see these on sheet music!', hintC: 'Filled oval head with vertical stem and optional flag. Treble clef has spiral; headphones have arc shape.' },
  { emoji: '\u{1F681}', answer: 'Helicopter', choices: ['Helicopter', 'Airplane', 'Drone'], category: 'Vehicles', tier: 'medium', difficulty: 'medium',
    hintA: 'It has spinning blades on top!', hintC: 'Top rotor + tail boom distinguishes from fixed-wing airplane and multi-rotor drone configurations.' },

  // ── Hard tier — tricky distinctions ──────────────────
  { emoji: '\u{1F43A}', answer: 'Wolf', choices: ['Wolf', 'Dog', 'Fox'], category: 'Animals', tier: 'hard', difficulty: 'hard',
    hintA: 'It lives in the forest and howls at the moon!', hintC: 'Very similar to dog class — fine-grained classification. Muzzle length and ear angle are discriminative features.' },
  { emoji: '\u{1F34A}', answer: 'Orange', choices: ['Orange', 'Peach', 'Tangerine'], category: 'Food', tier: 'hard', difficulty: 'hard',
    hintA: "It's round, orange, and juicy!", hintC: 'Color and shape nearly identical to tangerine. Texture (pore size) is the discriminative feature at high resolution.' },
  { emoji: '\u{1F3BB}', answer: 'Violin', choices: ['Violin', 'Cello', 'Guitar'], category: 'Music', tier: 'hard', difficulty: 'hard',
    hintA: "It's played with a bow!", hintC: 'Same body shape as cello at different scale. Without size reference, need fine details like chin rest.' },
  { emoji: '\u{1F985}', answer: 'Eagle', choices: ['Eagle', 'Hawk', 'Falcon'], category: 'Nature', tier: 'hard', difficulty: 'hard',
    hintA: "It's a big bird with sharp eyes!", hintC: 'Fine-grained classification problem. Beak curvature, head coloring, and wingspan ratios are key discriminators.' },
  { emoji: '\u{1F98E}', answer: 'Lizard', choices: ['Lizard', 'Salamander', 'Gecko'], category: 'Animals', tier: 'hard', difficulty: 'hard',
    hintA: 'It has scaly skin and can lose its tail!', hintC: 'Dry scales vs salamander moist skin. Gecko has toe pads; lizard has clawed toes — subtle at low resolution.' },
  { emoji: '\u{1F345}', answer: 'Tomato', choices: ['Tomato', 'Apple', 'Pepper'], category: 'Food', tier: 'hard', difficulty: 'hard',
    hintA: 'It grows in gardens and goes on pizza!', hintC: 'Red spherical fruit. Calyx (green star top) distinguishes from apple stem. Very similar color/shape to red apple at low res.' },
  { emoji: '\u{1F3B7}', answer: 'Saxophone', choices: ['Saxophone', 'Trumpet', 'Clarinet'], category: 'Music', tier: 'hard', difficulty: 'hard',
    hintA: 'It curves up at the end and plays jazz!', hintC: 'J-shaped body with flared bell. Trumpet has compact loops; clarinet is straight cylinder.' },
  { emoji: '\u{1F42C}', answer: 'Dolphin', choices: ['Dolphin', 'Whale', 'Porpoise'], category: 'Animals', tier: 'hard', difficulty: 'hard',
    hintA: 'It jumps out of the water and is very smart!', hintC: 'Elongated snout distinguishes from rounded porpoise head. Size much smaller than whale — hard without scale reference.' },
  { emoji: '\u{1F3C2}', answer: 'Snowboarder', choices: ['Snowboarder', 'Skier', 'Surfer'], category: 'Sports', tier: 'hard', difficulty: 'expert',
    hintA: 'They ride sideways down a snowy mountain!', hintC: 'Single wide board vs two narrow skis. Body orientation perpendicular to travel direction unlike surfer stance.' },
  { emoji: '\u{1F4F1}', answer: 'Phone', choices: ['Phone', 'Tablet', 'Calculator'], category: 'Technology', tier: 'hard', difficulty: 'expert',
    hintA: 'You hold it in one hand and make calls!', hintC: 'Narrow rectangular aspect ratio. Tablet is wider; calculator has distinct button grid. At low-res all appear as rectangles.' },
  { emoji: '\u{1F99C}', answer: 'Parrot', choices: ['Parrot', 'Toucan', 'Peacock'], category: 'Animals', tier: 'hard', difficulty: 'expert',
    hintA: 'It can talk and has bright feathers!', hintC: 'Curved beak + upright perching posture. Toucan has oversized beak; peacock has trailing tail plumage.' },
  { emoji: '\u{1F336}', answer: 'Hot Pepper', choices: ['Hot Pepper', 'Banana', 'Eggplant'], category: 'Food', tier: 'hard', difficulty: 'expert',
    hintA: 'It is spicy and red and pointy!', hintC: 'Tapered point with curved body. Banana has uniform curve + yellow; eggplant is wider with purple hue. Color is key discriminator.' },

  // ── Expansion batch (12 rounds): sports, technology, nature, music, space, art ──

  // Sports items
  { emoji: '\u{1F3D3}', answer: 'Table Tennis', choices: ['Table Tennis', 'Tennis', 'Badminton'], category: 'Sports', tier: 'medium', difficulty: 'medium',
    hintA: 'You hit a tiny ball across a small table!', hintC: 'Small solid paddle vs strung racket. Scale ambiguity makes this a medium difficulty — aspect ratio is the discriminator.' },
  { emoji: '\u{1F94A}', answer: 'Boxing Glove', choices: ['Boxing Glove', 'Mitten', 'Oven Mitt'], category: 'Sports', tier: 'hard', difficulty: 'hard',
    hintA: 'Fighters wear these on their hands!', hintC: 'Padded fist shape with wrist cuff. Mitten has thumb separation; oven mitt is longer. At low-res all appear as rounded hand coverings.' },

  // Technology items
  { emoji: '\u{1F579}\uFE0F', answer: 'Joystick', choices: ['Joystick', 'Gear Shift', 'Microphone'], category: 'Technology', tier: 'medium', difficulty: 'medium',
    hintA: 'You use this to play video games with one hand!', hintC: 'Vertical stick on a base platform. Gear shift has similar profile but automotive context. Button clusters on base are a key feature.' },
  { emoji: '\u{1F4E1}', answer: 'Satellite Dish', choices: ['Satellite Dish', 'Umbrella', 'Wok'], category: 'Technology', tier: 'hard', difficulty: 'hard',
    hintA: 'It sits on rooftops and catches signals from space!', hintC: 'Concave parabolic reflector with central feedhorn. Umbrella has radial ribs; wok has handle. Orientation and mounting are discriminators.' },

  // Nature items
  { emoji: '\u{1F335}', answer: 'Cactus', choices: ['Cactus', 'Tree', 'Broccoli'], category: 'Nature', tier: 'easy', difficulty: 'easy',
    hintA: 'It lives in the desert and has spines instead of leaves!', hintC: 'Columnar green form with spines. Lacks branching canopy of tree and floret structure of broccoli. Distinctive saguaro silhouette.' },
  { emoji: '\u{1F30B}', answer: 'Volcano', choices: ['Volcano', 'Mountain', 'Hill'], category: 'Nature', tier: 'hard', difficulty: 'hard',
    hintA: 'It erupts with hot lava and smoke!', hintC: 'Conical profile with crater opening. Very similar to mountain at low-res — smoke plume and crater are the discriminative high-frequency features.' },

  // Music items
  { emoji: '\u{1FA97}', answer: 'Accordion', choices: ['Accordion', 'Piano', 'Organ'], category: 'Music', tier: 'medium', difficulty: 'medium',
    hintA: 'It squeezes in and out and has buttons and keys!', hintC: 'Bellows structure between two box panels. Piano has horizontal keyboard; organ has pipes. Zigzag bellows pattern is a unique feature.' },
  { emoji: '\u{1F941}', answer: 'Drum', choices: ['Drum', 'Bucket', 'Tambourine'], category: 'Music', tier: 'easy', difficulty: 'easy',
    hintA: 'You hit it to make a beat!', hintC: 'Cylindrical body with stretched membrane top. Drumstick interaction area. Bucket lacks membrane; tambourine is flat with jingles.' },

  // Space items
  { emoji: '\u{1FA90}', answer: 'Ringed Planet', choices: ['Ringed Planet', 'UFO', 'Atom'], category: 'Space', tier: 'medium', difficulty: 'medium',
    hintA: 'It has a beautiful ring around it — like Saturn!', hintC: 'Sphere with encircling elliptical ring. UFO has dome shape; atom has electron orbit lines. Ring tilt angle varies classification confidence.' },
  { emoji: '\u{1F30C}', answer: 'Galaxy', choices: ['Galaxy', 'Hurricane', 'Whirlpool'], category: 'Space', tier: 'hard', difficulty: 'expert',
    hintA: 'It is a huge swirl of billions of stars!', hintC: 'Spiral arm structure from above. Identical morphology to hurricane at different scales. Without contextual cues (stars vs clouds), shape alone is ambiguous.' },

  // Art items
  { emoji: '\u{1F3A8}', answer: 'Art Palette', choices: ['Art Palette', 'Shield', 'Pan'], category: 'Art', tier: 'easy', difficulty: 'easy',
    hintA: 'Artists hold this and mix paint colors on it!', hintC: 'Kidney-shaped board with thumb hole and color spots. Unique form factor with high inter-class distance from shield and pan shapes.' },
  { emoji: '\u{1F5FF}', answer: 'Moai Statue', choices: ['Moai Statue', 'Chess Piece', 'Trophy'], category: 'Art', tier: 'hard', difficulty: 'expert',
    hintA: 'These stone heads are found on Easter Island!', hintC: 'Elongated rectangular head with prominent brow and nose. At low resolution similar to chess king or trophy silhouette. Cultural context needed for disambiguation.' },
];

const REVEAL_LABELS = ['Extremely blurry', 'Very blurry', 'Blurry', 'Slightly blurry', 'Clear'];
const REVEAL_POINTS = [30, 25, 20, 15, 10];

export function PixelInvestigatorGame() {
  const prefersReducedMotion = useReducedMotion();
  const game = useGameStore();
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('pixel-investigator', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [ri, setRi] = useState(0);
  const [revealLevel, setRevealLevel] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  // STD-PI2: Removed dead totalEarned state
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const { safeTimeout } = useSafeTimeout();

  // Filter by difficulty tier and age band
  const rounds = useFilteredContent(IMAGES, tier, ageBand);

  const round = rounds[ri];
  const blur = Math.max(0, 24 - revealLevel * 6);
  const pts = REVEAL_POINTS[revealLevel] || 10;

  useEffect(() => {
    setGameSceneContent(<PixelInvestigatorEnvironment zoomLevel={revealLevel} isAnalyzing={phase === 'play' && !answered} />);
    return () => setGameSceneContent(null);
  }, [revealLevel, phase, answered, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function reveal() {
    if (revealLevel < 4) setRevealLevel(l => l + 1);
  }

  function guess(choice: string) {
    if (answered) return;
    const correct = choice === round.answer;
    setAnswered(true);
    setWasCorrect(correct);

    if (correct) {
      const earned = pts + (streak >= 2 ? 5 : 0);
      game.updateScore(earned);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    safeTimeout(() => {
      setAnswered(false);
      setRevealLevel(0);
      setWasCorrect(false);
      setShowHint(false);
      if (ri < rounds.length - 1) { setRi(i => i + 1); game.advanceRound(); }
      else { setPhase('complete'); game.completeGame(); }
    }, 2000);
  }

  return (
    <GameShell gameId="pixel-investigator" title="Pixel Investigator" worldNumber={3} worldColor="#FF70AF" xpReward={20} totalRounds={rounds.length}>
      <div className="h-full flex flex-col relative z-10 overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(236,72,153,${0.12 + p.size * 0.05}), transparent)` }}
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(236,72,153,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
            <div className="flex-1 flex flex-col p-4">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.span className="text-6xl block" animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}>{'\u{1F50D}'}</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Pixel Investigator</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? "Images start heavily blurred — like a CNN's early layers seeing only low-frequency features. Each reveal adds higher-frequency detail, mimicking deeper network layers."
                        : 'Can you guess what the blurry picture is? Fewer reveals = more points!'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Computer Vision', 'Feature Extraction', 'Image Recognition'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 font-body text-2xs text-pink-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Investigating! <Eye className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* LEARN */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
                    <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                    <h3 className="font-display text-xl font-bold text-white">{LEARN_CARDS[learnIdx].title}</h3>
                    <p className="font-body text-sm text-white/60 max-w-md">{LEARN_CARDS[learnIdx].desc}</p>
                    <div className="flex gap-1 mt-2">
                      {LEARN_CARDS.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-[#FF66AA]' : 'bg-white/20'}`} />
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      {learnIdx > 0 && (
                        <motion.button onClick={() => setLearnIdx(i => i - 1)}
                          className="px-4 py-2 rounded-lg border border-white/10 font-display text-xs text-white/60 hover:text-white"
                          whileTap={{ scale: 0.95 }}>Back</motion.button>
                      )}
                      <motion.button onClick={() => learnIdx < LEARN_CARDS.length - 1 ? setLearnIdx(i => i + 1) : setPhase('play')}
                        className="px-6 py-2 rounded-lg font-display text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #FF66AA, #DD4488)' }}
                        whileTap={{ scale: 0.95 }}>{learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Playing!'}</motion.button>
                    </div>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && round && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={ri + 1} total={rounds.length} labColor="#FF66AA" />
                    </div>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 w-full max-w-md">
                      <span className="px-2 py-0.5 rounded bg-pink-500/10 font-body text-2xs text-pink-400">{round.category}</span>
                      <span className="px-2 py-0.5 rounded font-body text-2xs"
                        style={{ backgroundColor: round.tier === 'hard' ? 'rgba(239,68,68,0.1)' : round.tier === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: round.tier === 'hard' ? '#EF4444' : round.tier === 'medium' ? '#F59E0B' : '#10B981' }}>
                        {round.tier}
                      </span>
                      <div className="flex-1" />
                      <span className="font-mono text-2xs text-white/20">{ri + 1}/{rounds.length}</span>
                      {streak >= 2 && <span className="font-display text-2xs font-bold text-amber-400">{'\u{1F525}'} x{streak}</span>}
                    </div>

                    {/* Points available */}
                    <div className="flex items-center gap-1 mb-3">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="font-display text-xs font-bold text-amber-400">{pts} pts</span>
                      <span className="font-body text-2xs text-white/20">available</span>
                    </div>

                    {/* Image display */}
                    <motion.div
                      className="w-36 h-36 rounded-2xl flex items-center justify-center text-7xl mb-3"
                      style={{
                        filter: answered ? 'blur(0px)' : `blur(${blur}px)`,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(236,72,153,0.15)',
                        boxShadow: '0 0 30px rgba(236,72,153,0.08)',
                        transition: 'filter 0.5s ease',
                      }}
                      aria-label={answered ? `The answer is ${round.answer}` : 'Blurred image to guess'}>
                      {round.emoji}
                    </motion.div>

                    {/* Reveal level indicator */}
                    <div className="flex gap-1 mb-3">
                      {[0, 1, 2, 3, 4].map(level => (
                        <div key={level} className="w-8 h-1 rounded-full transition-colors"
                          style={{ backgroundColor: level <= revealLevel ? '#EC4899' : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                    <p className="font-body text-2xs text-white/20 mb-3">{REVEAL_LABELS[revealLevel]}</p>

                    {/* Result feedback */}
                    <AnimatePresence>
                      {answered && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className={`mb-3 px-4 py-2 rounded-xl text-center ${wasCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                          <p className={`font-display text-sm font-bold ${wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {wasCorrect ? `\u2713 +${pts + (streak >= 3 ? 5 : 0)} pts!` : `\u2717 It was ${round.answer}`}
                          </p>
                          {wasCorrect && revealLevel <= 1 && (
                            <p className="font-body text-2xs text-green-400/60 mt-0.5">Eagle eye! Early guess bonus!</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reveal button */}
                    {!answered && (
                      <div className="flex gap-2 mb-3">
                        <button onClick={reveal} disabled={revealLevel >= 4}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 font-body text-xs disabled:opacity-30 flex items-center gap-1"
                          aria-label={`Reveal more detail. Currently level ${revealLevel} of 4`}>
                          <Search className="w-3 h-3" /> Reveal More ({revealLevel}/4)
                        </button>
                        {!showHint && (
                          <button onClick={() => setShowHint(true)}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 font-body text-xs"
                            aria-label="Show hint">{'\u{1F4A1}'}</button>
                        )}
                      </div>
                    )}

                    {/* Hint */}
                    <AnimatePresence>
                      {showHint && !answered && (
                        <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="font-body text-2xs text-pink-300/50 mb-2 max-w-sm text-center">
                          {ageBand === 'C' ? round.hintC : round.hintA}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Choice buttons */}
                    <div className="flex gap-2">
                      {round.choices.map(c => (
                        <motion.button key={c} onClick={() => guess(c)} disabled={answered}
                          className={`px-5 py-3 rounded-xl border font-display text-sm font-bold transition-all ${
                            answered && c === round.answer ? 'border-green-500 bg-green-500/10 text-green-400'
                            : answered && c !== round.answer && wasCorrect ? 'border-white/5 text-white/15'
                            : answered && c !== round.answer ? 'border-white/5 text-white/15'
                            : 'border-pink-500/20 bg-pink-500/5 text-white hover:border-pink-500/40'
                          }`}
                          whileTap={!answered ? { scale: 0.95 } : {}}
                          aria-label={`Guess: ${c}`}>
                          {c}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span className="text-6xl" animate={prefersReducedMotion ? {} : { rotate: [0, 10, -10, 0] }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Pixel Investigator Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      You identified images from blurry to clear, experiencing how computer vision processes visual information at different resolutions.
                    </p>
                    <div className="rounded-xl px-6 py-3 bg-[#FF66AA]/10 border border-[#FF66AA]/20">
                      <p className="font-data text-2xl text-[#FF66AA]">{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Computer vision processes images from low-resolution features (shapes, colors) to fine details (textures, edges)</li>
                        <li>• Early neural network layers detect broad patterns, while deeper layers recognize specific objects</li>
                        <li>• Some objects are harder to distinguish than others — fine-grained classification is a real challenge in AI</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
