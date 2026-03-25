// ════════════════════════════════════════════════════
// AI SPY V2 — Lab 1 (What IS AI?)
// "I spy with my AI eye!" — spot hidden AI in everyday
// scenes. Tap items that use AI, learn how AI powers them.
// Enhanced: chrome bezel, welcome phase, age-band content,
// educational feedback, score tracking, round counter.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useSceneStore } from '@/stores/sceneStore';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';

// 3D Environment — rendered inside CockpitCanvas via SceneRouter (D3D-B3)
const AiSpyEnvironment = dynamic(
  () => import('@/components/3d/environments/AiSpyEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'play' | 'reveal' | 'complete';

interface SceneItem {
  id: string;
  label: string;
  usesAI: boolean;
  explanation: string;
  explanationC: string;
}

interface Scene {
  id: string;
  title: string;
  description: string;
  emoji: string;
  items: SceneItem[];
  band: 'A' | 'B' | 'C';
}

const ALL_SCENES: Scene[] = [
  // ── Band A (ages 7–9): obvious AI ──
  {
    id: 's1', title: 'Living Room', emoji: '🏠', band: 'A',
    description: 'You\'re relaxing at home with your family after dinner.',
    items: [
      { id: 's1a', label: '📺 Smart TV recommending shows', usesAI: true, explanation: 'The TV uses AI to learn what shows you like and suggest new ones!', explanationC: 'Recommendation engines use collaborative filtering and content-based models to predict user preferences from viewing history.' },
      { id: 's1b', label: '🔈 Voice assistant playing music', usesAI: true, explanation: 'Voice assistants use AI to understand your words and find the right song!', explanationC: 'Speech recognition uses RNNs/Transformers for automatic speech recognition (ASR), then NLU models parse intent and entities.' },
      { id: 's1c', label: '🛋️ Couch cushions', usesAI: false, explanation: 'Couch cushions are just soft furniture — no AI here!', explanationC: 'Physical objects without sensors or processors have no computational capability.' },
      { id: 's1d', label: '💡 Light switch on the wall', usesAI: false, explanation: 'A regular light switch is just a simple electrical circuit.', explanationC: 'Mechanical switches complete or break a circuit — no inference or learning involved.' },
      { id: 's1e', label: '🤖 Robot vacuum cleaning the floor', usesAI: true, explanation: 'Robot vacuums use AI to map your rooms and avoid bumping into things!', explanationC: 'Robot vacuums use SLAM (Simultaneous Localization and Mapping) with LIDAR or camera sensors for path planning.' },
    ],
  },
  {
    id: 's2', title: 'School Classroom', emoji: '🏫', band: 'A',
    description: 'It\'s a busy day at school. Your teacher is using lots of tools.',
    items: [
      { id: 's2a', label: '📱 Tablet with a learning app', usesAI: true, explanation: 'Learning apps use AI to give you harder or easier questions based on how you\'re doing!', explanationC: 'Adaptive learning platforms use knowledge tracing models to estimate mastery and adjust difficulty via item response theory.' },
      { id: 's2b', label: '✏️ Pencil and eraser', usesAI: false, explanation: 'Pencils and erasers are classic school tools — no AI needed!', explanationC: 'Analog writing instruments operate through mechanical friction — no computation involved.' },
      { id: 's2c', label: '🔤 Auto-correct on the class computer', usesAI: true, explanation: 'Auto-correct uses AI to guess what word you\'re trying to type!', explanationC: 'Modern autocorrect uses n-gram language models and neural seq2seq models trained on large text corpora for error correction.' },
      { id: 's2d', label: '📖 Printed textbook', usesAI: false, explanation: 'A printed textbook is just ink on paper — no AI involved!', explanationC: 'Static printed media contains fixed content with no dynamic processing capability.' },
    ],
  },
  {
    id: 's3', title: 'Playground', emoji: '🎪', band: 'A',
    description: 'You\'re at the park after school. There\'s lots going on!',
    items: [
      { id: 's3a', label: '📸 Phone camera with portrait mode', usesAI: true, explanation: 'Portrait mode uses AI to figure out what\'s a person and what\'s the background!', explanationC: 'Computational photography uses depth estimation CNNs to create synthetic bokeh by segmenting foreground subjects from backgrounds.' },
      { id: 's3b', label: '⚽ Soccer ball', usesAI: false, explanation: 'A soccer ball is just a ball — it bounces with physics, not AI!', explanationC: 'A soccer ball follows Newtonian mechanics — no embedded computing or inference.' },
      { id: 's3c', label: '🎮 Friend\'s game with smart enemies', usesAI: true, explanation: 'Video game enemies use AI to chase you, hide, and make the game challenging!', explanationC: 'Game AI uses behavior trees, finite state machines, and sometimes reinforcement learning for NPC decision-making.' },
      { id: 's3d', label: '🌳 Trees and grass', usesAI: false, explanation: 'Nature is amazing, but it runs on biology, not AI!', explanationC: 'Biological organisms operate through biochemical processes — no artificial intelligence.' },
      { id: 's3e', label: '🗺️ Maps app showing route home', usesAI: true, explanation: 'Map apps use AI to find the fastest route and predict traffic!', explanationC: 'Navigation apps use graph algorithms enhanced with ML-based traffic prediction models trained on historical and real-time GPS data.' },
    ],
  },
  {
    id: 's4', title: 'Shopping Website', emoji: '🛒', band: 'A',
    description: 'Your parent is shopping online for birthday presents.',
    items: [
      { id: 's4a', label: '🎁 "Recommended for you" section', usesAI: true, explanation: 'AI watches what you browse and suggests things you might like!', explanationC: 'Product recommendation uses collaborative filtering (user-item matrices) and deep learning embeddings to predict purchase probability.' },
      { id: 's4b', label: '💬 Customer service chatbot', usesAI: true, explanation: 'Chatbots use AI to understand your questions and give helpful answers!', explanationC: 'Customer service bots use intent classification and entity extraction with transformer-based NLU to route and respond to queries.' },
      { id: 's4c', label: '📦 Cardboard shipping box', usesAI: false, explanation: 'A box is just a box — great for holding things, but no AI!', explanationC: 'Physical packaging materials have no computational properties.' },
      { id: 's4d', label: '🔍 Search bar with auto-suggestions', usesAI: true, explanation: 'The search bar uses AI to guess what you\'re looking for before you finish typing!', explanationC: 'Search autocomplete uses prefix trees enhanced with query frequency models and personalized ranking via learned embeddings.' },
    ],
  },
  // ── Band B (ages 10–12): subtler AI ──
  {
    id: 's5', title: 'Email Inbox', emoji: '📧', band: 'B',
    description: 'You\'re checking email on a rainy afternoon. Your inbox is busy!',
    items: [
      { id: 's5a', label: '🚫 Spam filter catching junk mail', usesAI: true, explanation: 'Spam filters use AI to learn patterns of junk mail and block them automatically!', explanationC: 'Spam classification uses naive Bayes, SVM, or transformer models trained on labeled email datasets to detect phishing, scams, and bulk mail.' },
      { id: 's5b', label: '✉️ Email from your friend (typed by them)', usesAI: false, explanation: 'A human-written email is just a person typing — no AI made it!', explanationC: 'Human-authored content is the product of biological cognition, not machine learning inference.' },
      { id: 's5c', label: '📋 Smart reply suggestions ("Sounds good!")', usesAI: true, explanation: 'AI reads your emails and suggests quick replies you can send with one tap!', explanationC: 'Smart Reply uses sequence-to-sequence models that encode the incoming message and decode short response candidates ranked by relevance.' },
      { id: 's5d', label: '📁 Auto-sorted email categories', usesAI: true, explanation: 'AI sorts your emails into categories like Primary, Social, and Promotions!', explanationC: 'Email categorization uses multi-label text classifiers trained on user interaction signals (opens, deletes, replies) as implicit labels.' },
      { id: 's5e', label: '📎 Paper clip icon for attachments', usesAI: false, explanation: 'The paper clip icon is just a picture — it doesn\'t use any AI!', explanationC: 'Static UI icons are rendered assets with no inference or learning capability.' },
    ],
  },
  {
    id: 's6', title: 'Photo Gallery', emoji: '🖼️', band: 'B',
    description: 'You\'re looking through all the photos on your phone.',
    items: [
      { id: 's6a', label: '👤 Faces auto-tagged with names', usesAI: true, explanation: 'AI recognizes faces in your photos and groups them by person!', explanationC: 'Facial recognition uses CNN-based embeddings (e.g., FaceNet) that map faces to 128-d vectors, clustering by cosine similarity.' },
      { id: 's6b', label: '🔍 Search photos by typing "beach"', usesAI: true, explanation: 'AI understands what\'s in each photo so you can search without adding labels yourself!', explanationC: 'Visual search uses CLIP or similar vision-language models that encode images and text into a shared embedding space for cross-modal retrieval.' },
      { id: 's6c', label: '📅 Photos sorted by date taken', usesAI: false, explanation: 'Sorting by date just uses the timestamp the camera saves — no AI needed!', explanationC: 'Date sorting uses EXIF metadata timestamps — a simple comparison sort on structured data, not ML inference.' },
      { id: 's6d', label: '🌅 "Memories" slideshow of last summer', usesAI: true, explanation: 'AI picks your best photos and creates slideshows from special moments!', explanationC: 'Memory curation uses aesthetic quality scoring CNNs, scene diversity algorithms, and temporal clustering to select highlight-worthy images.' },
    ],
  },
  // ── Band C (ages 13–16): technical AI ──
  {
    id: 's7', title: 'Social Media Feed', emoji: '📱', band: 'C',
    description: 'You\'re scrolling through a social media app. Everything feels curated.',
    items: [
      { id: 's7a', label: '📊 Content feed ordering', usesAI: true, explanation: 'AI decides which posts you see first based on what you engage with most!', explanationC: 'Feed ranking uses multi-objective optimization with engagement prediction models (click-through, dwell time, shares) weighted by business objectives.' },
      { id: 's7b', label: '🛡️ Auto-removed harmful comments', usesAI: true, explanation: 'AI moderates comments, detecting hate speech and bullying automatically!', explanationC: 'Content moderation uses fine-tuned transformers for toxicity classification, often with multi-task learning across categories (hate, spam, harassment).' },
      { id: 's7c', label: '👍 The "like" button itself', usesAI: false, explanation: 'The like button is just a UI element that records your tap — no AI in the button!', explanationC: 'The button is a frontend event handler that writes to a database — the intelligence is in downstream systems that consume that signal.' },
      { id: 's7d', label: '🎯 Targeted advertisements', usesAI: true, explanation: 'Ads use AI to show you products based on your interests and browsing habits!', explanationC: 'Ad targeting uses real-time bidding with ML models predicting conversion probability from user features, context, and ad embeddings.' },
      { id: 's7e', label: '⏱️ Screen time tracker', usesAI: false, explanation: 'Screen time just counts minutes — it\'s a simple timer, not AI!', explanationC: 'Screen time monitoring uses basic timer accumulation and threshold comparison — deterministic arithmetic, not learned inference.' },
    ],
  },
  {
    id: 's8', title: 'Streaming Music App', emoji: '🎵', band: 'C',
    description: 'You open your music app. It seems to know exactly what you want to hear.',
    items: [
      { id: 's8a', label: '🎶 "Discover Weekly" playlist', usesAI: true, explanation: 'AI analyzes your listening history and finds songs from artists you\'ve never heard!', explanationC: 'Discover Weekly uses hybrid recommender systems: collaborative filtering from user-song matrices + content-based audio features extracted via CNNs from spectrograms.' },
      { id: 's8b', label: '🎤 Lyrics displayed in sync', usesAI: true, explanation: 'AI matches lyrics to the exact moment in the song using audio analysis!', explanationC: 'Lyric synchronization uses forced alignment with acoustic models that match phoneme sequences to audio frames via dynamic time warping or CTC-based models.' },
      { id: 's8c', label: '⏩ Skip and replay buttons', usesAI: false, explanation: 'Skip and replay are just playback controls — simple media player functions!', explanationC: 'Media transport controls manipulate playback position in an audio buffer — deterministic operations with no learned components.' },
      { id: 's8d', label: '🏷️ Auto-generated genre tags', usesAI: true, explanation: 'AI listens to songs and automatically labels their genre and mood!', explanationC: 'Music information retrieval uses mel-spectrogram CNNs for multi-label genre/mood classification, often with attention mechanisms for temporal pooling.' },
      { id: 's8e', label: '🔊 Volume slider', usesAI: false, explanation: 'A volume slider just adjusts signal amplitude — pure math, no AI!', explanationC: 'Volume control applies a scalar multiplication to the audio signal amplitude — a linear transformation, not inference.' },
    ],
  },
  // Additional Band A scene
  {
    id: 's9', title: 'Kitchen at Breakfast', emoji: '🍳', band: 'A',
    description: 'It\'s breakfast time! The kitchen is full of gadgets.',
    items: [
      { id: 's9a', label: '🗣️ Smart speaker giving the weather', usesAI: true, explanation: 'The smart speaker uses AI to understand your voice and tell you the weather!', explanationC: 'Voice-activated weather queries involve ASR, intent parsing, entity extraction (location, date), and TTS for response generation.' },
      { id: 's9b', label: '🍞 Toaster making toast', usesAI: false, explanation: 'A toaster just heats bread with electric coils — no AI needed!', explanationC: 'A toaster uses resistive heating with a simple bimetallic timer — analog control with no learning or inference.' },
      { id: 's9c', label: '📱 News app with personalized stories', usesAI: true, explanation: 'The news app uses AI to show you stories about topics you care about!', explanationC: 'News personalization uses click-through prediction models and topic modeling (LDA or neural) to rank articles by estimated user interest.' },
      { id: 's9d', label: '🥣 Cereal bowl and spoon', usesAI: false, explanation: 'A bowl and spoon are just kitchen tools — no computers inside!', explanationC: 'Passive utensils have no sensors, processors, or data — purely mechanical objects.' },
    ],
  },
  // Additional Band B scene
  {
    id: 's10', title: 'Video Streaming', emoji: '🎬', band: 'B',
    description: 'Movie night! You\'re picking something to watch on a streaming service.',
    items: [
      { id: 's10a', label: '🎞️ "Because you watched..." row', usesAI: true, explanation: 'AI tracks what you watch and finds similar movies you\'ll probably enjoy!', explanationC: 'Item-based collaborative filtering computes similarity between content using co-watch patterns and content metadata embeddings.' },
      { id: 's10b', label: '🖼️ Custom thumbnail for each user', usesAI: true, explanation: 'Streaming services use AI to show you different cover images based on what might catch your eye!', explanationC: 'Artwork personalization uses multi-armed bandit algorithms (contextual bandits) to A/B test thumbnail variants and optimize for click-through rate per user segment.' },
      { id: 's10c', label: '⏸️ Pause and play button', usesAI: false, explanation: 'Pause and play just control the video — simple media controls!', explanationC: 'Playback controls toggle between buffered frame rendering and idle states — no ML models involved.' },
      { id: 's10d', label: '🌐 Auto-generated subtitles', usesAI: true, explanation: 'AI listens to the dialogue and creates subtitles in real time!', explanationC: 'Auto-captioning uses ASR models (Whisper, DeepSpeech) with beam search decoding to transcribe audio, sometimes with speaker diarization.' },
      { id: 's10e', label: '📺 The TV screen hardware', usesAI: false, explanation: 'The TV screen just displays pixels — the AI is in the software, not the screen!', explanationC: 'Display hardware renders pixel buffers via GPU output — the screen itself performs no inference or learning.' },
    ],
  },
  // Additional Band C scene
  {
    id: 's11', title: 'Online Banking App', emoji: '🏦', band: 'C',
    description: 'Your parent is checking their bank account on their phone.',
    items: [
      { id: 's11a', label: '🚨 Fraud detection alert', usesAI: true, explanation: 'AI monitors spending patterns and flags unusual transactions that might be fraud!', explanationC: 'Fraud detection uses anomaly detection models (autoencoders, isolation forests) and supervised classifiers trained on labeled transaction datasets with extreme class imbalance.' },
      { id: 's11b', label: '💰 Account balance display', usesAI: false, explanation: 'Your balance is just a number from the database — simple addition and subtraction!', explanationC: 'Account balances are computed via deterministic ledger arithmetic (sum of credits minus debits) — no probabilistic inference.' },
      { id: 's11c', label: '📊 Spending insights and categories', usesAI: true, explanation: 'AI reads your transaction descriptions and sorts them into categories like food, transport, and entertainment!', explanationC: 'Transaction categorization uses NLP classifiers on merchant names and descriptions, often with rule-based fallbacks and user feedback loops for active learning.' },
      { id: 's11d', label: '🔒 Biometric login (fingerprint/face)', usesAI: true, explanation: 'Your phone uses AI to recognize your fingerprint or face to keep your account safe!', explanationC: 'Biometric authentication uses CNN feature extractors that compare live capture embeddings against enrolled templates using distance metrics with anti-spoofing (liveness detection) models.' },
      { id: 's11e', label: '📄 PDF statement download', usesAI: false, explanation: 'Downloading a PDF is just sending a file — no AI involved!', explanationC: 'PDF generation is template-based document rendering — deterministic layout and content insertion with no ML components.' },
    ],
  },
  // Additional Band B scene
  {
    id: 's12', title: 'Self-Driving Car Ride', emoji: '🚗', band: 'B',
    description: 'You\'re riding in a car with advanced driver assistance features.',
    items: [
      { id: 's12a', label: '🚦 Lane-keeping assist', usesAI: true, explanation: 'AI uses cameras to see lane lines and keeps the car centered on the road!', explanationC: 'Lane detection uses semantic segmentation CNNs on camera feeds to identify lane markings, then PID controllers adjust steering torque.' },
      { id: 's12b', label: '🪞 Rearview mirror', usesAI: false, explanation: 'A mirror just reflects light — it\'s pure physics, no AI!', explanationC: 'Mirrors use specular reflection (angle of incidence = angle of reflection) — an optical phenomenon with no computation.' },
      { id: 's12c', label: '🅿️ Automatic parking assist', usesAI: true, explanation: 'AI uses sensors to measure the parking space and steers the car in perfectly!', explanationC: 'Automated parking uses ultrasonic/camera sensor fusion with path planning algorithms and motion control for precise maneuvering in constrained spaces.' },
      { id: 's12d', label: '🎵 Car radio playing FM station', usesAI: false, explanation: 'FM radio just receives radio waves and turns them into sound — no AI!', explanationC: 'FM radio demodulates analog frequency-modulated signals — a deterministic signal processing operation with no machine learning.' },
      { id: 's12e', label: '⚠️ Pedestrian detection warnings', usesAI: true, explanation: 'AI watches the road with cameras and detects people crossing so the car can brake!', explanationC: 'Pedestrian detection uses real-time object detection models (YOLO, SSD) on camera/LIDAR data with temporal tracking for trajectory prediction.' },
    ],
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function AiSpyGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const scenes = useMemo(
    () => ALL_SCENES.filter(s => BAND_ORDER[s.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [sceneIdx, setSceneIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);

  const scene = scenes[sceneIdx];
  const totalAI = scene?.items.filter(i => i.usesAI).length ?? 0;

  // Register 3D scene content into CockpitCanvas via sceneStore (D3D-B3)
  useEffect(() => {
    setGameSceneContent(
      <AiSpyEnvironment sceneIndex={sceneIdx} isScanning={!revealed} />
    );
  }, [sceneIdx, revealed, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  const toggleItem = useCallback((itemId: string) => {
    if (revealed) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, [revealed]);

  function handleSubmit() {
    if (revealed || !scene) return;
    setRevealed(true);

    // Score: +10 for each correct identification, -5 for each wrong
    let roundScore = 0;
    scene.items.forEach(item => {
      const playerSaidAI = selected.has(item.id);
      if (playerSaidAI === item.usesAI) {
        roundScore += 10;
      }
    });
    if (roundScore > 0) game.updateScore(roundScore);
    game.advanceRound();
  }

  function handleNext() {
    if (sceneIdx < scenes.length - 1) {
      setSceneIdx(i => i + 1);
      setSelected(new Set());
      setRevealed(false);
    } else {
      setPhase('complete');
      game.completeGame();
    }
  }

  function getItemStatus(item: SceneItem) {
    if (!revealed) return 'default';
    const playerSaidAI = selected.has(item.id);
    if (playerSaidAI && item.usesAI) return 'correct';
    if (!playerSaidAI && !item.usesAI) return 'correct';
    if (playerSaidAI && !item.usesAI) return 'wrong';
    return 'missed'; // didn't select but it was AI
  }

  return (
    <GameShell gameId="ai-spy" title="AI Spy" worldNumber={1} worldColor="#00BBFF" totalRounds={scenes.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* 3D Environment renders inside CockpitCanvas via SceneRouter (D3D-B3) */}

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(0,187,255,${0.15 + p.size * 0.06}), rgba(0,0,0,0))`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(0,187,255,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* ── Welcome Phase ── */}
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <span className="text-5xl">🔍</span>
                    <h2 className="font-display text-2xl font-bold text-white">AI Spy</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      I spy with my AI eye! Look at everyday scenes and tap the items that secretly use artificial intelligence.
                    </p>
                    <div className="flex gap-2">
                      {['Spot AI', 'Everyday Tech', 'Hidden Intelligence'].map(t => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-sky-400/10 border border-sky-400/20 text-sky-400 font-body text-2xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #00BBFF, #0099DD)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Start AI Spy game"
                    >
                      Start Spying! <Eye className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Play Phase ── */}
                {phase === 'play' && scene && (
                  <motion.div
                    key={`play-${scene.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Round counter + Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-2xs text-white/30">
                        Scene {sceneIdx + 1} / {scenes.length}
                      </span>
                      <span className="font-mono text-2xs text-sky-400/60">
                        Score: {game.score}
                      </span>
                    </div>

                    {/* Scene card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4 mb-4 border border-sky-400/20 bg-sky-400/5 text-center"
                    >
                      <span className="text-3xl">{scene.emoji}</span>
                      <h3 className="font-display text-base font-bold text-white mt-2">{scene.title}</h3>
                      <p className="font-body text-xs text-white/40 mt-1">{scene.description}</p>
                      {!revealed && (
                        <p className="font-body text-2xs text-sky-400/60 mt-2">
                          Tap items you think use AI ({totalAI} hidden)
                        </p>
                      )}
                    </motion.div>

                    {/* Items grid */}
                    <div className="flex flex-col gap-2 mb-4">
                      {scene.items.map(item => {
                        const status = getItemStatus(item);
                        const isSelected = selected.has(item.id);
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            disabled={revealed}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                              revealed
                                ? status === 'correct'
                                  ? 'border-green-500/30 bg-green-500/5'
                                  : status === 'wrong'
                                    ? 'border-red-500/30 bg-red-500/5'
                                    : 'border-amber-500/30 bg-amber-500/5'
                                : isSelected
                                  ? 'border-sky-400/50 bg-sky-400/10 ring-1 ring-sky-500/30'
                                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                            whileTap={!revealed ? { scale: 0.98 } : {}}
                            aria-label={`${item.label}${isSelected ? ' — selected as AI' : ''}`}
                            aria-pressed={isSelected}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-body text-sm text-white">{item.label}</span>
                              {!revealed && isSelected && (
                                <span className="text-sky-400 text-xs font-display">AI</span>
                              )}
                              {revealed && (
                                <span className="flex items-center gap-1">
                                  {status === 'correct' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                  {status === 'wrong' && <XCircle className="w-4 h-4 text-red-400" />}
                                  {status === 'missed' && (
                                    <span className="text-amber-400 text-2xs font-display">MISSED</span>
                                  )}
                                </span>
                              )}
                            </div>
                            {/* Explanation after reveal */}
                            {revealed && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="font-body text-2xs text-white/40 mt-1.5 leading-relaxed"
                              >
                                {item.usesAI && <span className="text-sky-400 font-bold">Uses AI: </span>}
                                {ageBand === 'C' ? item.explanationC : item.explanation}
                              </motion.p>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Submit / Next button */}
                    {!revealed ? (
                      <motion.button
                        onClick={handleSubmit}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                        style={{ background: 'linear-gradient(135deg, #00BBFF, #0099DD)' }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label="Submit your guesses"
                      >
                        Lock In My Guesses!
                      </motion.button>
                    ) : (
                      <div className="space-y-2">
                        {/* Score summary */}
                        <div className="rounded-xl px-4 py-2 bg-white/[0.03] border border-white/5 text-center">
                          <p className="font-body text-2xs text-white/30">
                            {scene.items.filter(i => getItemStatus(i) === 'correct').length} / {scene.items.length} correct
                          </p>
                        </div>
                        <motion.button
                          onClick={handleNext}
                          className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                          style={{ background: 'linear-gradient(135deg, #00BBFF, #0099DD)' }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          aria-label={sceneIdx < scenes.length - 1 ? 'Next scene' : 'Finish game'}
                        >
                          {sceneIdx < scenes.length - 1 ? 'Next Scene →' : 'See Results!'}
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Complete Phase ── */}
                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span
                      className="text-6xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🏆
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">AI Spy Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Great detective work! You explored {scenes.length} scenes and learned where AI hides in everyday life.
                    </p>
                    <div className="rounded-xl px-6 py-3 bg-sky-400/10 border border-sky-400/20">
                      <p className="font-data text-2xl text-sky-400">{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
