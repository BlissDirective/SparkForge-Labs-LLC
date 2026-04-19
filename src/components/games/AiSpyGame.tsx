// ════════════════════════════════════════════════════
// AI SPY V2 — Lab 1 (What IS AI?)
// "I spy with my AI eye!" — spot hidden AI in everyday
// scenes. Tap items that use AI, learn how AI powers them.
// Enhanced: chrome bezel, welcome phase, age-band content,
// educational feedback, score tracking, round counter.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions, useGameScore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';
import { useFilteredContent } from '@/hooks/useFilteredContent';

// 3D Environment — rendered inside CockpitCanvas via SceneRouter (D3D-B3)
const AiSpyEnvironment = dynamic(
  () => import('@/components/3d/environments/AiSpyEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

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
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
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
  // ── Healthcare AI (Band A) ──
  {
    id: 's13', title: 'Doctor\'s Office', emoji: '🏥', band: 'A', difficulty: 'easy',
    description: 'You\'re at the doctor for a checkup. The office has some high-tech equipment!',
    items: [
      { id: 's13a', label: '🩺 AI analyzing an X-ray image', usesAI: true, explanation: 'AI can look at X-ray pictures and help doctors find problems like broken bones!', explanationC: 'Medical imaging AI uses CNNs trained on annotated radiographs to detect fractures, tumors, and other pathologies with radiologist-level accuracy.' },
      { id: 's13b', label: '🌡️ Regular thermometer', usesAI: false, explanation: 'A thermometer just measures temperature with heat-sensitive materials — no AI!', explanationC: 'Thermometers use thermal expansion or infrared sensors with calibrated conversion — deterministic measurement, not inference.' },
      { id: 's13c', label: '💊 AI suggesting the right medicine', usesAI: true, explanation: 'AI helps doctors choose the best medicine based on your symptoms and health records!', explanationC: 'Clinical decision support systems use knowledge graphs and ML models trained on medical records to suggest diagnoses and treatment options.' },
      { id: 's13d', label: '🩹 Bandage from the supply cabinet', usesAI: false, explanation: 'Bandages are just cloth and tape — no technology at all!', explanationC: 'Medical supplies are passive physical materials with no computational elements.' },
    ],
  },
  // ── Entertainment AI (Band A) ──
  {
    id: 's14', title: 'Gaming Console', emoji: '🎮', band: 'A', difficulty: 'easy',
    description: 'You\'re playing video games with friends. The console does some amazing things!',
    items: [
      { id: 's14a', label: '🏎️ Racing game opponents that learn your moves', usesAI: true, explanation: 'Game AI watches how you play and makes computer racers adapt to challenge you!', explanationC: 'Adaptive game AI uses player modeling with behavioral cloning or reinforcement learning to match difficulty to player skill level.' },
      { id: 's14b', label: '🔌 Power cord plugged into the wall', usesAI: false, explanation: 'A power cord just carries electricity — no intelligence involved!', explanationC: 'Power cables are passive conductors transferring electrical energy — no processing capability.' },
      { id: 's14c', label: '🎙️ Voice chat that removes background noise', usesAI: true, explanation: 'AI filters out noise so your friends only hear your voice, not the dog barking!', explanationC: 'Noise suppression uses deep learning models (RNNoise, DTLN) that separate speech from environmental sounds in real-time on the audio waveform.' },
      { id: 's14d', label: '🕹️ The controller joystick', usesAI: false, explanation: 'The joystick just sends your thumb movements to the console — pure hardware!', explanationC: 'Analog sticks use potentiometers that convert mechanical position to voltage — simple ADC, no ML inference.' },
      { id: 's14e', label: '🗣️ NPC characters that have conversations', usesAI: true, explanation: 'Modern game characters use AI to talk with you in ways that feel natural!', explanationC: 'NPC dialogue systems use language models fine-tuned on game lore to generate contextually appropriate responses within narrative constraints.' },
    ],
  },
  // ── Home AI (Band A) ──
  {
    id: 's15', title: 'Smart Home', emoji: '🏡', band: 'A', difficulty: 'medium',
    description: 'Your neighbor has a "smart home" with lots of connected devices!',
    items: [
      { id: 's15a', label: '🌡️ Thermostat that learns your schedule', usesAI: true, explanation: 'Smart thermostats learn when you\'re home and adjust temperature automatically!', explanationC: 'Smart thermostats use occupancy prediction models and schedule learning via time-series analysis to optimize HVAC energy usage.' },
      { id: 's15b', label: '🚪 Regular door with a key lock', usesAI: false, explanation: 'A keyed lock is purely mechanical — pins and tumblers, no AI!', explanationC: 'Pin tumbler locks use physical key geometry for authentication — a purely mechanical system with no learning capability.' },
      { id: 's15c', label: '📹 Security camera with person detection', usesAI: true, explanation: 'AI can tell if there\'s a person, animal, or just a tree moving in the wind!', explanationC: 'Smart security cameras use edge-deployed object detection models to classify motion events, reducing false alarm rates from ~90% to ~5%.' },
      { id: 's15d', label: '💧 Garden sprinkler on a timer', usesAI: false, explanation: 'A timer sprinkler just runs at set times — it doesn\'t think about the weather!', explanationC: 'Timer-based irrigation uses fixed schedule programming — deterministic time comparison, not weather-adaptive inference.' },
    ],
  },
  // ── Transportation AI (Band B) ──
  {
    id: 's16', title: 'Airport', emoji: '✈️', band: 'B', difficulty: 'medium',
    description: 'You\'re at the airport waiting for a flight. There\'s tech everywhere!',
    items: [
      { id: 's16a', label: '🛂 Automated passport scanner', usesAI: true, explanation: 'AI reads your passport and matches your face to your photo in seconds!', explanationC: 'E-gates use OCR for passport MRZ reading and facial recognition with liveness detection to verify traveler identity against biometric templates.' },
      { id: 's16b', label: '🧳 Baggage carousel', usesAI: false, explanation: 'The carousel just spins bags around on a conveyor belt — mechanical movement!', explanationC: 'Baggage carousels are electromechanical conveyors with no sensing or inference — simple motor-driven belt systems.' },
      { id: 's16c', label: '📡 Air traffic control radar', usesAI: true, explanation: 'AI helps controllers track hundreds of planes and prevent collisions!', explanationC: 'ATC systems use ML-enhanced radar processing for track correlation, conflict detection, and trajectory prediction across complex airspace sectors.' },
      { id: 's16d', label: '🪑 Waiting area chairs', usesAI: false, explanation: 'Chairs are just furniture — definitely no AI sitting in them!', explanationC: 'Seating furniture is inert physical infrastructure with no computational elements.' },
      { id: 's16e', label: '🔎 X-ray baggage scanner with threat detection', usesAI: true, explanation: 'AI helps security identify dangerous items in your luggage automatically!', explanationC: 'CT-based baggage screening uses deep learning for automated threat recognition, trained on synthetic and real datasets of prohibited items.' },
    ],
  },
  // ── Financial AI (Band B) ──
  {
    id: 's17', title: 'Shopping Mall', emoji: '🏬', band: 'B', difficulty: 'medium',
    description: 'You\'re at a busy shopping mall. Retail is getting smarter!',
    items: [
      { id: 's17a', label: '🏷️ Dynamic pricing tags that change automatically', usesAI: true, explanation: 'Some stores use AI to change prices based on demand, time of day, and inventory!', explanationC: 'Dynamic pricing uses demand forecasting models and price elasticity estimation to optimize revenue through automated price adjustments.' },
      { id: 's17b', label: '🚶 People counter at the entrance', usesAI: true, explanation: 'AI counts how many people enter the store without identifying anyone!', explanationC: 'Footfall analytics uses person detection models with privacy-preserving design — counting without identification through anonymized blob detection.' },
      { id: 's17c', label: '🛗 Escalator moving up and down', usesAI: false, explanation: 'Escalators just move steps in a loop with a motor — no AI!', explanationC: 'Escalators are continuous loop conveyors driven by electric motors with mechanical step chains — deterministic mechanical systems.' },
      { id: 's17d', label: '🗃️ Store inventory tracking system', usesAI: true, explanation: 'AI predicts which products will sell out and tells the store to reorder!', explanationC: 'Inventory optimization uses time-series forecasting (Prophet, DeepAR) to predict demand and optimize reorder points for just-in-time replenishment.' },
    ],
  },
  // ── Research AI (Band C) ──
  {
    id: 's18', title: 'Science Lab', emoji: '🔬', band: 'C', difficulty: 'hard',
    description: 'You\'re visiting a cutting-edge research laboratory. Scientists are pushing boundaries!',
    items: [
      { id: 's18a', label: '🧬 AI predicting protein structures', usesAI: true, explanation: 'AI can predict how proteins fold — something scientists struggled with for 50 years!', explanationC: 'AlphaFold uses attention-based architectures to predict 3D protein structures from amino acid sequences, solving a grand challenge in computational biology.' },
      { id: 's18b', label: '🔬 Optical microscope', usesAI: false, explanation: 'A basic microscope uses glass lenses to magnify — pure optics!', explanationC: 'Optical microscopes use refractive lens systems for magnification — no computational processing in the optical path itself.' },
      { id: 's18c', label: '💻 AI designing new drug molecules', usesAI: true, explanation: 'AI can invent new medicine molecules by predicting which chemical shapes might work!', explanationC: 'Generative chemistry uses VAEs and diffusion models in molecular space, optimizing for drug-likeness scores (QED, SA), binding affinity, and ADMET properties.' },
      { id: 's18d', label: '📓 Researcher\'s paper notebook', usesAI: false, explanation: 'A notebook is just paper — the human brain does the thinking here!', explanationC: 'Physical notebooks are passive recording media — human cognition performs the analysis documented within.' },
      { id: 's18e', label: '🌌 AI analyzing telescope data for exoplanets', usesAI: true, explanation: 'AI sifts through billions of star measurements to find tiny dips that mean a planet passed by!', explanationC: 'Exoplanet detection uses neural networks trained on Kepler/TESS light curves to identify transit signals with higher sensitivity than traditional box-least-squares methods.' },
    ],
  },
  // ── Industrial AI (Band C) ──
  {
    id: 's19', title: 'Smart Factory', emoji: '🏭', band: 'C', difficulty: 'hard',
    description: 'You\'re touring a modern factory. Machines and AI work together here.',
    items: [
      { id: 's19a', label: '🤖 Robot arm assembling electronics', usesAI: true, explanation: 'Factory robots use AI to learn precise movements and adapt when things are slightly different!', explanationC: 'Industrial robots use imitation learning and sim-to-real transfer for dexterous manipulation, with force-torque sensing for compliance control.' },
      { id: 's19b', label: '⚙️ Conveyor belt moving parts', usesAI: false, explanation: 'A conveyor belt just moves things along at a set speed — simple mechanics!', explanationC: 'Conveyor systems use fixed-speed or variable-frequency drive motors — open-loop control with no adaptive learning.' },
      { id: 's19c', label: '📊 Predictive maintenance system', usesAI: true, explanation: 'AI listens to machines and predicts when they\'ll break down — before it happens!', explanationC: 'Predictive maintenance uses vibration analysis CNNs and time-series anomaly detection on sensor data to forecast equipment failure with remaining useful life estimation.' },
      { id: 's19d', label: '🔧 Wrench and screwdriver set', usesAI: false, explanation: 'Hand tools are powered by human muscle, not artificial intelligence!', explanationC: 'Manual tools apply mechanical advantage through levers, wedges, and screws — no computational elements.' },
      { id: 's19e', label: '👁️ Quality inspection camera', usesAI: true, explanation: 'AI cameras check every product for tiny defects that humans might miss!', explanationC: 'Automated optical inspection uses anomaly detection CNNs trained on defect-free samples, achieving sub-millimeter defect detection at production-line speeds.' },
    ],
  },
  // ── Agriculture AI (Band C) ──
  {
    id: 's20', title: 'Smart Farm', emoji: '🌾', band: 'C', difficulty: 'expert',
    description: 'This farm uses the latest technology to grow food more efficiently.',
    items: [
      { id: 's20a', label: '🛰️ Satellite crop health monitoring', usesAI: true, explanation: 'AI analyzes satellite images to spot which parts of a field need more water or have diseases!', explanationC: 'Precision agriculture uses multispectral satellite imagery with CNNs to compute NDVI (Normalized Difference Vegetation Index) maps for crop health assessment.' },
      { id: 's20b', label: '🚜 Tractor driving in straight rows', usesAI: false, explanation: 'A basic tractor just follows where the farmer steers — no AI in old tractors!', explanationC: 'Conventional tractors use mechanical steering linkages and human-operated controls — no autonomous navigation or inference.' },
      { id: 's20c', label: '🐝 AI-powered pollination drone', usesAI: true, explanation: 'Tiny drones use AI to find flowers and pollinate them, helping bees who are struggling!', explanationC: 'Agricultural micro-UAVs use computer vision for flower detection and path planning algorithms for efficient pollination coverage in greenhouses.' },
      { id: 's20d', label: '🌱 AI predicting optimal harvest time', usesAI: true, explanation: 'AI uses weather data, soil sensors, and growth models to tell farmers the perfect day to harvest!', explanationC: 'Harvest optimization combines weather forecasting, soil moisture sensing, and crop growth models (APSIM, DSSAT) with ML to maximize yield and quality metrics.' },
      { id: 's20e', label: '🧱 Stone wall around the farm', usesAI: false, explanation: 'A stone wall is just rocks stacked together — ancient technology, no AI!', explanationC: 'Dry stone walls use gravity and friction for structural integrity — a construction technique predating even simple machines.' },
    ],
  },
];

const LEARN_CARDS = [
  { title: 'What is AI?', emoji: '🤖', desc: 'AI (Artificial Intelligence) is when computers learn to do things that usually need human thinking — like recognizing faces, understanding speech, or making recommendations.' },
  { title: 'AI is Everywhere', emoji: '🌍', desc: 'AI helps filter your email, suggests videos you might like, powers voice assistants, and even helps doctors find diseases. It\'s in more places than you think!' },
  { title: 'Spotting AI in Action', emoji: '🔍', desc: 'In this game, you\'ll explore different scenes and figure out which items use AI and which don\'t. Look for things that learn, predict, or make smart decisions!' },
];

export function AiSpyGame() {
  const prefersReducedMotion = useReducedMotion();
  // PERF-HIGH-001 (C): narrow selectors. Actions are stable refs so
  // useGameActions never triggers re-render; useGameScore isolates
  // the single reactive read this file makes.
  const game = useGameActions();
  const score = useGameScore();
  const { activeChild } = useChildStore();
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('ai-spy', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const scenes = useFilteredContent(ALL_SCENES, tier, ageBand);

  const scene = scenes[sceneIdx];
  const totalAI = scene?.items.filter(i => i.usesAI).length ?? 0;

  // Register 3D scene content into CockpitCanvas via sceneStore (D3D-B3)
  useEffect(() => {
    setGameSceneContent(
      <AiSpyEnvironment sceneIndex={sceneIdx} isScanning={!revealed} />
    );
    return () => setGameSceneContent(null);
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

    // Score: +10 for each correct identification, no penalty for wrong answers
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
    <GameShell gameId="ai-spy" title="AI Spy" worldNumber={1} worldColor="#0FB8FA" totalRounds={scenes.length}>
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
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
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
                      onClick={() => setPhase('learn')}
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

                {/* ── Learn Phase ── */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
                    <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                    <h3 className="font-display text-xl font-bold text-white">{LEARN_CARDS[learnIdx].title}</h3>
                    <p className="font-body text-sm text-white/60 max-w-md">{LEARN_CARDS[learnIdx].desc}</p>
                    <div className="flex gap-1 mt-2">
                      {LEARN_CARDS.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-[#00BBFF]' : 'bg-white/20'}`} />
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
                        style={{ background: 'linear-gradient(135deg, #00BBFF, #0088CC)' }}
                        whileTap={{ scale: 0.95 }}>{learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Playing!'}</motion.button>
                    </div>
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
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={sceneIdx + 1} total={scenes.length} labColor="#00BBFF" />
                    </div>
                    {/* Round counter + Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-2xs text-white/30">
                        Scene {sceneIdx + 1} / {scenes.length}
                      </span>
                      <span className="font-mono text-2xs text-sky-400/60">
                        Score: {score}
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
                      animate={prefersReducedMotion ? {} : { rotate: [0, 10, -10, 0] }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}
                    >
                      🏆
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">AI Spy Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Great detective work! You explored {scenes.length} scenes and learned where AI hides in everyday life.
                    </p>
                    <div className="rounded-xl px-6 py-3 bg-sky-400/10 border border-sky-400/20">
                      <p className="font-data text-2xl text-sky-400">{score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• AI is all around us — from voice assistants to recommendation systems</li>
                        <li>• Not everything smart uses AI — some things just follow simple rules</li>
                        <li>• AI works by learning patterns from data, not by being programmed for every situation</li>
                      </ul>
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
