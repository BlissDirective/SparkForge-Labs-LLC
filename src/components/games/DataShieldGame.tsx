// ════════════════════════════════════════════════════
// DATA SHIELD V2 — Lab 6 (AI & Ethics)
// Privacy game: decide what to share and protect.
// Enhanced: chrome bezel, welcome phase, 6 scenarios,
// visual shield meter, privacy tips, age-band explanations.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameContent } from '@/hooks/useContent';
import { Shield, Eye, Lock, AlertTriangle } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const DataShieldEnvironment = dynamic(
  () => import('@/components/3d/environments/DataShieldEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

interface DataPoint {
  label: string;
  shouldProtect: boolean;
  reason: string;
  reasonC: string;
  severity: 'safe' | 'warning' | 'danger';
}

interface Scenario {
  title: string;
  emoji: string;
  context: string;
  dataPoints: DataPoint[];
}

const LEARN_CARDS = [
  { title: 'Your Data Matters', emoji: '🛡️', desc: 'Every time you use an app or website, you share data. Some data is fine to share, but some is personal and should be protected!' },
  { title: 'What is Personal Data?', emoji: '🔐', desc: 'Personal data includes your name, address, phone number, photos, and even your location. This information can be used to identify you.' },
  { title: 'Shield Your Information', emoji: '🏰', desc: 'In this game, you\'ll decide which data to protect and which is safe to share. Think carefully — some requests seem innocent but aren\'t!' },
];

const SCENARIOS: Scenario[] = [
  {
    title: 'New Game Sign-Up', emoji: '🎮', context: 'A free game asks you to create an account. It wants:',
    dataPoints: [
      { label: 'Username (made-up)', shouldProtect: false, reason: 'Made-up usernames are safe — they don\'t reveal who you are!', reasonC: 'Pseudonymous identifiers provide functional identity without linking to PII. This is a core privacy-by-design pattern.', severity: 'safe' },
      { label: 'Full real name', shouldProtect: true, reason: 'Games don\'t need your real name! A username is enough.', reasonC: 'Full names are directly identifying PII. Combined with other data points, they enable identity correlation across services — a privacy anti-pattern.', severity: 'warning' },
      { label: 'School name', shouldProtect: true, reason: 'This reveals your location!', reasonC: 'Institutional affiliation narrows geolocation significantly and can enable physical-world targeting — especially sensitive for minors under COPPA/GDPR-K.', severity: 'danger' },
      { label: 'Birthday', shouldProtect: true, reason: 'Personal info. Games only need age range, not exact date!', reasonC: 'Date of birth is a quasi-identifier — combined with ZIP code and gender, it uniquely identifies 87% of the US population (Sweeney, 2000). Age ranges are sufficient for content filtering.', severity: 'warning' },
    ],
  },
  {
    title: 'Online Quiz', emoji: '📝', context: 'A fun quiz website asks for:',
    dataPoints: [
      { label: 'Email address', shouldProtect: true, reason: 'Quizzes don\'t need email. They might send spam!', reasonC: 'Email is a persistent cross-service identifier. Quiz sites often sell email lists to third-party advertisers — a common dark pattern in data brokerage.', severity: 'warning' },
      { label: 'Favorite color', shouldProtect: false, reason: 'Just a preference — totally safe to share!', reasonC: 'Non-identifying preference data has minimal privacy risk. It cannot be used for re-identification and is commonly used for personalization.', severity: 'safe' },
      { label: 'Home address', shouldProtect: true, reason: 'Never share your address online!', reasonC: 'Physical address is high-sensitivity PII enabling real-world targeting. It violates the data minimization principle — no quiz requires geolocation at this granularity.', severity: 'danger' },
      { label: 'Age range (e.g., 10-12)', shouldProtect: false, reason: 'Age ranges are fine — they don\'t pinpoint your exact age!', reasonC: 'k-anonymity through age bucketing provides plausible deniability. Ranges are sufficient for content filtering while preventing exact DOB inference.', severity: 'safe' },
    ],
  },
  {
    title: 'Chat App', emoji: '💬', context: 'A new chat app wants:',
    dataPoints: [
      { label: 'Phone number', shouldProtect: true, reason: 'Phone numbers can identify you!', reasonC: 'Phone numbers are persistent identifiers tied to SIM cards, enabling tracking across services via number-based lookups and social graph correlation.', severity: 'danger' },
      { label: 'Display name', shouldProtect: false, reason: 'A made-up display name is safe!', reasonC: 'User-chosen display names that don\'t contain real identity information are privacy-preserving pseudonyms — a recommended practice.', severity: 'safe' },
      { label: 'Photo of yourself', shouldProtect: true, reason: 'Photos can be shared without your permission!', reasonC: 'Facial images enable biometric identification via facial recognition systems. Once shared, they cannot be "unshared" — irreversible data exposure with high re-identification risk.', severity: 'danger' },
      { label: 'Interests/hobbies', shouldProtect: false, reason: 'General interests are safe to share!', reasonC: 'Broad interest categories have low uniqueness and cannot reliably identify individuals. They enable useful personalization without significant privacy cost.', severity: 'safe' },
    ],
  },
  {
    title: 'Survey for Free Prize', emoji: '🎁', context: 'You "won a prize"! They need:',
    dataPoints: [
      { label: 'Parent\'s credit card', shouldProtect: true, reason: 'Real prizes NEVER need payment info! This is a scam!', reasonC: 'Unsolicited prize claims requesting financial instruments are classic phishing/social engineering attacks. Legitimate giveaways never require payment — this violates FTC guidelines.', severity: 'danger' },
      { label: 'Mailing address', shouldProtect: true, reason: 'Don\'t give your address to strangers online!', reasonC: 'Physical address disclosure to unverified entities creates real-world attack vectors. Even legitimate prize fulfillment should use verified intermediaries.', severity: 'danger' },
      { label: 'Social security number', shouldProtect: true, reason: 'NEVER share this online! It\'s the most private info you have.', reasonC: 'SSN is the highest-sensitivity PII in the US — it enables identity theft, financial fraud, and is essentially irrevocable once compromised. No legitimate prize requires it.', severity: 'danger' },
      { label: 'First name only', shouldProtect: false, reason: 'First name alone is generally safe — it\'s very common!', reasonC: 'First names have high population frequency (low uniqueness) and cannot identify individuals in isolation. Acceptable under data minimization principles.', severity: 'safe' },
    ],
  },
  {
    title: 'Social Media App', emoji: '📱', context: 'A social media app requests:',
    dataPoints: [
      { label: 'Location (always on)', shouldProtect: true, reason: 'Constant location tracking is dangerous!', reasonC: 'Persistent geolocation tracking creates detailed movement profiles. Combined with temporal patterns, it reveals home/school locations, daily routines, and social connections — extreme privacy risk.', severity: 'danger' },
      { label: 'Contacts list access', shouldProtect: true, reason: 'This shares OTHER people\'s info without asking them!', reasonC: 'Contact list access violates third-party consent — you\'re sharing others\' PII without their knowledge. This enables social graph construction and shadow profiling.', severity: 'danger' },
      { label: 'Bio / About me', shouldProtect: false, reason: 'You control what you write. Keep it general and it\'s fine!', reasonC: 'User-authored bio text is self-disclosed and controllable. Privacy risk scales with specificity — general descriptions are low-risk while specific details increase re-identification potential.', severity: 'safe' },
      { label: 'Camera access (always)', shouldProtect: true, reason: 'Apps should only use cameras when you say so!', reasonC: 'Persistent camera access enables passive surveillance. Permission should be scoped to active use only — the principle of least privilege applied to device sensors.', severity: 'danger' },
    ],
  },
  {
    title: 'Smart Speaker Setup', emoji: '🔊', context: 'A smart speaker in your room wants:',
    dataPoints: [
      { label: 'Voice recordings (always listening)', shouldProtect: true, reason: 'Always-on microphones record everything — even private conversations!', reasonC: 'Continuous audio capture creates comprehensive surveillance records. Voice data is biometric (voiceprint identification) and conversational content may include sensitive disclosures.', severity: 'danger' },
      { label: 'Music preferences', shouldProtect: false, reason: 'What music you like is no secret — it helps get better recommendations!', reasonC: 'Music preference data has low privacy sensitivity and high utility for recommendation systems. Genre-level preferences cannot reliably identify individuals.', severity: 'safe' },
      { label: 'Your daily schedule', shouldProtect: true, reason: 'Your routine tells people when you\'re home or away!', reasonC: 'Temporal activity patterns reveal presence/absence schedules, creating physical security vulnerabilities. This data enables both digital profiling and real-world targeting.', severity: 'danger' },
      { label: 'Wi-Fi network name', shouldProtect: false, reason: 'Your Wi-Fi name is already visible to nearby devices — it\'s not secret!', reasonC: 'SSIDs are broadcast publicly by design (802.11 beacon frames). While they can approximate geolocation via wardriving databases, they\'re already exposed by the protocol itself.', severity: 'safe' },
    ],
  },
  {
    title: 'Online Shopping', emoji: '🛒', context: 'An online store wants:',
    dataPoints: [
      { label: 'Delivery address', shouldProtect: true, reason: 'Only share with trusted stores — and always with a parent!', reasonC: 'Physical address for commerce is a necessary disclosure, but should be shared only with verified merchants over encrypted connections with clear data retention policies.', severity: 'warning' },
      { label: 'Wishlist items', shouldProtect: false, reason: 'What you want to buy is just a preference — safe to share!', reasonC: 'Purchase intent data has low re-identification risk and enables useful personalization. It becomes concerning only when combined with other identifiers.', severity: 'safe' },
      { label: 'Parent\'s bank details', shouldProtect: true, reason: 'Financial info should only go through secure checkout with parents!', reasonC: 'Financial credentials must only traverse PCI-DSS compliant payment processors. Direct collection by merchants violates payment security standards.', severity: 'danger' },
      { label: 'Clothing size', shouldProtect: false, reason: 'Size info helps get the right fit — no privacy concern!', reasonC: 'Anthropometric data at category level (S/M/L) has negligible re-identification potential and serves a clear functional purpose.', severity: 'safe' },
    ],
  },
  {
    title: 'Fitness App', emoji: '🏃', context: 'A fitness tracker app requests:',
    dataPoints: [
      { label: 'Heart rate data', shouldProtect: true, reason: 'Health data is very personal!', reasonC: 'Biometric health data is classified as sensitive personal data under GDPR Article 9. Heart rate patterns can reveal medical conditions and emotional states.', severity: 'warning' },
      { label: 'Exercise type', shouldProtect: false, reason: 'What sport you do is fine to share with a fitness app!', reasonC: 'Activity type is low-sensitivity behavioral data that directly serves the app\'s purpose. Minimal privacy risk when not combined with location data.', severity: 'safe' },
      { label: 'GPS running route', shouldProtect: true, reason: 'Your running route shows where you live and go regularly!', reasonC: 'GPS traces reveal home location, daily patterns, and frequented areas. Strava\'s heat map incident (2018) demonstrated how aggregate fitness data can expose sensitive facilities.', severity: 'danger' },
      { label: 'Step count goal', shouldProtect: false, reason: 'A fitness goal is just a number — totally safe!', reasonC: 'Numeric fitness targets are non-identifying preference data with clear functional utility and negligible privacy impact.', severity: 'safe' },
    ],
  },
  {
    title: 'School Portal', emoji: '🏫', context: 'Your school\'s online portal asks for:',
    dataPoints: [
      { label: 'Student ID number', shouldProtect: true, reason: 'Your student ID is linked to your school records — keep it private!', reasonC: 'Student IDs are persistent institutional identifiers that can be used to access academic records, attendance data, and disciplinary history under FERPA protections.', severity: 'warning' },
      { label: 'Favorite subject', shouldProtect: false, reason: 'Which subject you like is just an interest — safe!', reasonC: 'Academic preferences are low-sensitivity data that can improve personalized learning experiences without meaningful privacy risk.', severity: 'safe' },
      { label: 'Parent contact info', shouldProtect: true, reason: 'Only share through official school forms, not random online portals!', reasonC: 'Parental contact details should only be collected through verified institutional channels with clear data governance policies under FERPA and state privacy laws.', severity: 'danger' },
      { label: 'Class schedule', shouldProtect: true, reason: 'Your schedule shows where you are at specific times!', reasonC: 'Temporal location data for minors creates safety risks. Class schedules enable prediction of a child\'s physical location at any given time.', severity: 'warning' },
    ],
  },
  {
    title: 'AI Chatbot', emoji: '🤖', context: 'An AI assistant chatbot asks:',
    dataPoints: [
      { label: 'Your question/prompt', shouldProtect: false, reason: 'Asking questions is what chatbots are for — that\'s fine!', reasonC: 'Query data serves the primary purpose of the service. Privacy risk depends on query content, but general questions have low sensitivity.', severity: 'safe' },
      { label: 'Your real name', shouldProtect: true, reason: 'You can chat without giving your real name!', reasonC: 'Name disclosure to AI systems creates training data that may be retained indefinitely. Pseudonymous interaction preserves functionality without PII exposure.', severity: 'warning' },
      { label: 'Your feelings/emotions', shouldProtect: true, reason: 'Emotional data is very personal. AI companies might use it to target you!', reasonC: 'Affective data is sensitive personal information that can be used for psychological profiling, emotional manipulation, and targeted advertising based on emotional vulnerability.', severity: 'warning' },
      { label: 'What language you speak', shouldProtect: false, reason: 'Language preference helps the chatbot respond in your language!', reasonC: 'Language preference is a functional setting with low uniqueness. While it narrows demographic segments, it cannot identify individuals alone.', severity: 'safe' },
    ],
  },
  {
    title: 'Photo Sharing App', emoji: '📸', context: 'A photo app wants access to:',
    dataPoints: [
      { label: 'All your photos', shouldProtect: true, reason: 'Only share specific photos — not your entire library!', reasonC: 'Blanket photo library access violates least privilege. Photos contain embedded EXIF metadata (GPS, timestamps, device info) creating comprehensive surveillance profiles.', severity: 'danger' },
      { label: 'Photo filters used', shouldProtect: false, reason: 'Which filters you like is just a preference!', reasonC: 'Filter preference data is non-identifying behavioral metadata with clear product improvement utility and negligible privacy impact.', severity: 'safe' },
      { label: 'Face recognition data', shouldProtect: true, reason: 'Face data is like a fingerprint — once shared, you can\'t take it back!', reasonC: 'Facial biometrics are irrevocable identifiers regulated under BIPA and GDPR. Template extraction enables persistent cross-platform tracking without consent.', severity: 'danger' },
      { label: 'Caption text', shouldProtect: false, reason: 'Captions you write are up to you — keep them general and they\'re fine!', reasonC: 'Self-authored captions are voluntary disclosures where the user controls content. Risk scales with specificity of disclosed information.', severity: 'safe' },
    ],
  },
  {
    title: 'Gaming Platform', emoji: '🎮', context: 'An online gaming platform requests:',
    dataPoints: [
      { label: 'Voice chat recordings', shouldProtect: true, reason: 'Voice recordings capture everything you say — keep them off!', reasonC: 'Voice data is biometric (voiceprint) and conversational content may include inadvertent PII disclosure. Persistent recording creates surveillance risks.', severity: 'danger' },
      { label: 'Game achievements', shouldProtect: false, reason: 'Your gaming stats are just for fun — safe to share!', reasonC: 'In-game achievement data is platform-specific behavioral metadata with clear social utility and minimal cross-platform re-identification risk.', severity: 'safe' },
      { label: 'Friends\' real names', shouldProtect: true, reason: 'Don\'t share your friends\' info — that\'s their choice!', reasonC: 'Third-party PII disclosure without consent violates fundamental privacy principles. You have no authority to share others\' identifying information.', severity: 'danger' },
      { label: 'Preferred game genre', shouldProtect: false, reason: 'What games you enjoy is just a preference!', reasonC: 'Entertainment preferences are low-sensitivity categorical data useful for recommendations with negligible re-identification risk.', severity: 'safe' },
    ],
  },
];

export function DataShieldGame() {
  const prefersReducedMotion = useReducedMotion();
  const game = useGameStore();
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('data-shield', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [pointIdx, setPointIdx] = useState(0);
  const [privacyScore, setPrivacyScore] = useState(100);
  const [feedback, setFeedback] = useState<{ correct: boolean; reason: string } | null>(null);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const scenarios = useFilteredContent(SCENARIOS as any[], tier, ageBand) as typeof SCENARIOS;
  const { safeTimeout } = useSafeTimeout();

  const scenario = scenarios[scenarioIdx];
  const point = scenario?.dataPoints[pointIdx];
  const totalDataPoints = scenarios.reduce((sum, s) => sum + s.dataPoints.length, 0);
  const meterColor = privacyScore > 70 ? '#10B981' : privacyScore > 40 ? '#F59E0B' : '#EF4444';

  // STD-DS2: Set maxScore to total data points * 10 (not scenarios * 10)
  useEffect(() => {
    game.setMaxScore(totalDataPoints * 10);
  }, [totalDataPoints]); // eslint-disable-line react-hooks/exhaustive-deps

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  useEffect(() => {
    setGameSceneContent(<DataShieldEnvironment shieldStrength={privacyScore} threatsBlocked={scenarioIdx} />);
    return () => setGameSceneContent(null);
  }, [privacyScore, scenarioIdx, setGameSceneContent]);

  function handleChoice(protect: boolean) {
    if (!point || feedback) return;
    const correct = protect === point.shouldProtect;
    if (!correct) setPrivacyScore(s => Math.max(0, s - 12));
    if (correct) game.updateScore(10);
    setFeedback({ correct, reason: ageBand === 'C' ? point.reasonC : point.reason });
    safeTimeout(() => {
      setFeedback(null);
      const next = pointIdx + 1;
      if (next < scenario.dataPoints.length) { setPointIdx(next); }
      else {
        const nextS = scenarioIdx + 1;
        if (nextS < scenarios.length) { setScenarioIdx(nextS); setPointIdx(0); game.advanceRound(); }
        else { setPhase('complete'); game.completeGame(); }
      }
    }, 2500);
  }

  return (
    <GameShell gameId="data-shield" title="Data Shield" worldNumber={6} worldColor="#FF7050" totalRounds={scenarios.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(255,102,68,${0.15 + p.size * 0.06}), transparent)` }}
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,102,68,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }} className="text-center space-y-4">
                    <span className="text-5xl">🛡️</span>
                    <h2 className="font-display text-2xl font-bold text-white">Data Shield</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">Apps and websites want your data. Can you tell what&apos;s safe to share and what to protect?</p>
                    <div className="flex gap-2 justify-center">
                      {['Privacy', 'PII', 'Data Safety'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-body text-orange-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #FF6644, #DD4422)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Activate Shield! <Shield className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
                    <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                    <h3 className="font-display text-xl font-bold text-white">{LEARN_CARDS[learnIdx].title}</h3>
                    <p className="font-body text-sm text-white/60 max-w-md">{LEARN_CARDS[learnIdx].desc}</p>
                    <div className="flex gap-1 mt-2">
                      {LEARN_CARDS.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-[#FF6644]' : 'bg-white/20'}`} />
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
                        style={{ background: 'linear-gradient(135deg, #FF6644, #CC4422)' }}
                        whileTap={{ scale: 0.95 }}>{learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Playing!'}</motion.button>
                    </div>
                  </motion.div>
                )}

                {phase === 'play' && scenario && point && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md space-y-2">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={scenarioIdx + 1} total={scenarios.length} labColor="#FF6644" />
                    </div>
                    {/* Privacy meter */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-body text-xs text-white/60 flex items-center gap-1"><Lock className="w-3 h-3" /> Privacy Score</span>
                        <span className="font-display text-xs font-bold" style={{ color: meterColor }}>{privacyScore}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: meterColor }}
                          animate={{ width: `${privacyScore}%` }} transition={{ type: 'spring', stiffness: 100 }} />
                      </div>
                    </div>

                    {/* Scenario */}
                    <div className="text-center mb-4">
                      <span className="text-3xl">{scenario.emoji}</span>
                      <h3 className="font-display text-base font-bold text-white mt-1">{scenario.title}</h3>
                      <p className="font-body text-xs text-white/70">{scenario.context}</p>
                    </div>

                    {/* Data point card */}
                    <motion.div key={`${scenarioIdx}-${pointIdx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-5 mb-4 border border-white/10 bg-white/[0.02] text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {point.severity === 'danger' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                        {point.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        <p className="font-display text-base font-bold text-white">{'"'}{point.label}{'"'}</p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <motion.button onClick={() => handleChoice(true)} disabled={!!feedback}
                          className="flex-1 py-3 rounded-xl bg-blue-500/15 border border-blue-500/20 font-display text-xs font-bold text-blue-400 flex items-center justify-center gap-2"
                          whileTap={{ scale: 0.95 }} aria-label="Shield this data">
                          <Shield className="w-4 h-4" /> SHIELD
                        </motion.button>
                        <motion.button onClick={() => handleChoice(false)} disabled={!!feedback}
                          className="flex-1 py-3 rounded-xl bg-emerald-500/15 border border-green-400/20 font-display text-xs font-bold text-green-400 flex items-center justify-center gap-2"
                          whileTap={{ scale: 0.95 }} aria-label="Share this data">
                          <Eye className="w-4 h-4" /> SHARE
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`rounded-xl p-3 text-center ${feedback.correct ? 'bg-green-400/10 border border-green-400/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                          <p className="font-display text-xs font-bold" style={{ color: feedback.correct ? '#00FF88' : '#EF4444' }}>
                            {feedback.correct ? '✅ Smart choice!' : '⚠️ Be careful!'}
                          </p>
                          <p className="font-body text-2xs text-white/70 mt-1">{feedback.reason}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    <h2 className="font-display text-2xl font-bold text-white">Data Shield Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You proved you can protect your personal information from AI misuse and make smart privacy decisions online.</p>
                    <div className="rounded-xl px-6 py-3 bg-[#FF6644]/10 border border-[#FF6644]/20">
                      <p className="font-data text-2xl" style={{ color: '#FF6644' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/60">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/70">
                        <li>• Personal data like addresses, phone numbers, and photos should be protected from apps and websites</li>
                        <li>• Not all data requests are necessary — always ask why an app needs your information</li>
                        <li>• Data privacy is a right, and understanding what to share keeps you safe from AI-powered misuse</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
