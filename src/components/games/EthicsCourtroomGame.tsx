// ════════════════════════════════════════════════════════════════════════
// AI ETHICS COURTROOM — Lab 6 (AI & Ethics) — STANDARD POLISH
//
// Concept: Role-play ethical AI dilemmas. Read the case, choose a
// perspective to argue, present arguments, see the jury verdict.
// Multiple valid outcomes teach ethical complexity — no "right" answer.
//
// Features:
// • Chrome bezel (red, Lab 6)
// • Particle background
// • Welcome phase with ethics intro
// • Age-band depth (C: stakeholder analysis, consequentialism vs deontology)
// • 4 cases with 3 perspectives each
// • Jury verdict with reasoning
// • "No single right answer" philosophy emphasized
// • ARIA labels, keyboard nav
// ════════════════════════════════════════════════════════════════════════
'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Scale, Users, MessageSquare, Award } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';

// 3D Environment (no SSR)
const EthicsCourtroomEnvironment = dynamic(
  () => import('@/components/3d/environments/EthicsCourtroomEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'trial' | 'complete';
type TrialStep = 'case' | 'perspective' | 'argue' | 'verdict';

interface Argument {
  text: string;
  strength: 'strong' | 'moderate' | 'weak';
  explanation: string;
}

interface Perspective {
  role: string;
  emoji: string;
  stance: string;
  arguments: Argument[];
}

interface EthicsCase {
  title: string;
  emoji: string;
  scenario: string;
  scenarioC: string;
  question: string;
  perspectives: Perspective[];
  verdictNote: string;
  verdictNoteC: string;
}

const CASES: EthicsCase[] = [
  {
    title: 'The Self-Driving Decision',
    emoji: '🚗',
    scenario:
      'A self-driving car is about to crash. It can swerve left (hitting 1 person) or go straight (hitting 3 people). The AI must decide in milliseconds. What should it do?',
    scenarioC:
      "An autonomous vehicle's collision avoidance system must make a real-time decision between two harm outcomes. The utilitarian calculus says minimize total casualties, but deontological ethics says you cannot deliberately target an individual. This is a modern trolley problem with real engineering implications.",
    question: 'What should the AI car do?',
    perspectives: [
      {
        role: 'Safety Engineer',
        emoji: '🔧',
        stance: 'Minimize total harm — swerve left',
        arguments: [
          {
            text: 'Saving more lives is mathematically better',
            strength: 'strong',
            explanation:
              'Utilitarian logic: 3 lives saved > 1 life lost. Most ethical frameworks agree reducing total harm is good.',
          },
          {
            text: 'The car should be programmed to minimize casualties',
            strength: 'strong',
            explanation:
              'Engineering ethics requires designing for the least harmful outcome when harm is unavoidable.',
          },
          {
            text: 'This is what most people would want',
            strength: 'moderate',
            explanation:
              'Surveys show most people prefer utilitarian AI — but would they buy a car that might sacrifice them?',
          },
        ],
      },
      {
        role: 'Rights Advocate',
        emoji: '⚖️',
        stance: "Don't choose who lives — go straight",
        arguments: [
          {
            text: 'No one should program a machine to deliberately target someone',
            strength: 'strong',
            explanation:
              'Deliberately swerving toward someone is an active choice to harm — different from not acting.',
          },
          {
            text: 'The 1 person has equal right to life',
            strength: 'strong',
            explanation:
              'Every individual has inherent dignity. You cannot weigh lives like numbers.',
          },
          {
            text: 'If AI picks targets, people will fear walking near roads',
            strength: 'moderate',
            explanation:
              'Public trust in AI requires that no one is "selected" as an acceptable casualty.',
          },
        ],
      },
      {
        role: 'AI Researcher',
        emoji: '🧪',
        stance: "AI shouldn't make moral choices at all",
        arguments: [
          {
            text: 'AI lacks understanding of human values',
            strength: 'strong',
            explanation:
              'AI processes data, not ethics. It cannot truly understand the weight of a human life.',
          },
          {
            text: 'We should focus on preventing the situation entirely',
            strength: 'strong',
            explanation:
              'Better sensors, slower speeds, and safer roads eliminate the dilemma rather than solving it.',
          },
          {
            text: 'Different cultures have different ethical frameworks',
            strength: 'moderate',
            explanation:
              'A single algorithm cannot encode the moral diversity of the entire world.',
          },
        ],
      },
    ],
    verdictNote:
      "There's no single right answer here. Ethics is about considering many viewpoints. Real self-driving car companies are debating this right now!",
    verdictNoteC:
      'This case illustrates the tension between consequentialism (outcome-based ethics — minimize harm) and deontological ethics (rule-based — never deliberately target someone). The "Moral Machine" experiment by MIT found that cultural values significantly influence preferences, making a universal algorithm challenging.',
  },
  {
    title: 'The AI Job Interview',
    emoji: '💼',
    scenario:
      'A company uses AI to screen job applications. The AI rejects more women and minorities than expected. The company says the AI is just finding "the best candidates" based on past hiring data.',
    scenarioC:
      'A hiring ML model trained on historical data exhibits disparate impact against protected classes. The model achieves 92% accuracy on past hiring decisions, but those decisions reflected systemic bias. Debiasing the model reduces accuracy to 84%. What is the ethical path?',
    question: 'What should the company do?',
    perspectives: [
      {
        role: 'Company CEO',
        emoji: '👔',
        stance: 'Fix the AI and keep using it',
        arguments: [
          {
            text: 'AI processes 1000x more applications than humans',
            strength: 'strong',
            explanation:
              'Efficiency gains are real — but efficiency cannot justify discrimination.',
          },
          {
            text: 'We can add fairness constraints to the model',
            strength: 'strong',
            explanation:
              'Techniques like demographic parity and equalized odds can reduce bias mathematically.',
          },
          {
            text: 'Human reviewers have biases too',
            strength: 'moderate',
            explanation:
              "True, but two wrongs don't make a right. AI bias can be harder to detect and operates at scale.",
          },
        ],
      },
      {
        role: 'Job Applicant',
        emoji: '📋',
        stance: 'Stop using AI for hiring entirely',
        arguments: [
          {
            text: "My career shouldn't depend on a biased algorithm",
            strength: 'strong',
            explanation:
              'Individual rights to fair consideration outweigh corporate efficiency gains.',
          },
          {
            text: 'I deserve a human to read my application',
            strength: 'moderate',
            explanation:
              'Dignity in the hiring process matters, though human review has its own biases.',
          },
          {
            text: 'How do I appeal an AI decision?',
            strength: 'strong',
            explanation:
              'Due process requires explainability. If AI rejects you, you need to know why.',
          },
        ],
      },
      {
        role: 'AI Ethicist',
        emoji: '🎓',
        stance: 'Use AI as a helper, not a decider',
        arguments: [
          {
            text: 'AI should assist humans, not replace their judgment',
            strength: 'strong',
            explanation:
              'Human-in-the-loop systems combine AI efficiency with human ethical oversight.',
          },
          {
            text: 'Require explanation for every AI recommendation',
            strength: 'strong',
            explanation:
              'Explainable AI (XAI) ensures transparency and accountability in high-stakes decisions.',
          },
          {
            text: 'Regular audits should be mandatory',
            strength: 'moderate',
            explanation:
              'Ongoing monitoring catches drift and emerging biases that initial testing misses.',
          },
        ],
      },
    ],
    verdictNote:
      'Most experts agree: AI can help with hiring, but it needs careful oversight. Many countries are now creating laws about AI in hiring.',
    verdictNoteC:
      'Key concepts: disparate impact (unintentional discrimination), explainability (XAI), human-in-the-loop, algorithmic auditing. The EU AI Act classifies hiring AI as "high-risk" requiring conformity assessments.',
  },
  {
    title: 'The Student AI Detector',
    emoji: '📝',
    scenario:
      'A school uses AI to detect if students used ChatGPT to write their essays. The detector flags 20% of original essays as "AI-written" by mistake. A student who wrote their own essay gets accused of cheating.',
    scenarioC:
      'An AI plagiarism detection system has a 20% false positive rate on original student work. With a base rate of 5% actual AI usage in submissions, the positive predictive value is only ~21% — meaning most flagged essays are actually original.',
    question: 'Should the school keep using the AI detector?',
    perspectives: [
      {
        role: 'Teacher',
        emoji: '👩‍🏫',
        stance: 'We need SOME tool to maintain academic integrity',
        arguments: [
          {
            text: 'Without detection, everyone will just use AI',
            strength: 'strong',
            explanation:
              'Deterrence matters — if there are no checks, the incentive to cheat increases.',
          },
          {
            text: 'We can use it as a starting point, not final judgment',
            strength: 'strong',
            explanation:
              'Using AI detection as a flag for human review is more responsible than automated punishment.',
          },
          {
            text: '80% accuracy is still useful',
            strength: 'weak',
            explanation:
              '20% false positive rate means 1 in 5 honest students could be wrongly accused — that is a lot.',
          },
        ],
      },
      {
        role: 'Student',
        emoji: '🎒',
        stance: "It's unfair — innocent students get punished",
        arguments: [
          {
            text: 'Being wrongly accused of cheating is humiliating',
            strength: 'strong',
            explanation:
              'False accusations can damage mental health, academic records, and trust in institutions.',
          },
          {
            text: 'It punishes students who write unusually well',
            strength: 'strong',
            explanation:
              'Detectors often flag sophisticated writing, penalizing advanced writers.',
          },
          {
            text: 'Non-native speakers get flagged more often',
            strength: 'strong',
            explanation:
              'Studies show AI detectors have higher false positive rates for non-native English writers.',
          },
        ],
      },
      {
        role: 'Principal',
        emoji: '🏫',
        stance: 'Wait for better technology',
        arguments: [
          {
            text: 'A 20% error rate is too high for consequences',
            strength: 'strong',
            explanation:
              'In medicine or law, a 20% error rate would be unacceptable. Education deserves the same standard.',
          },
          {
            text: 'Focus on teaching WITH AI rather than banning it',
            strength: 'strong',
            explanation:
              'Adapting curriculum to integrate AI tools may be more effective than policing usage.',
          },
          {
            text: 'Use other assessment methods instead',
            strength: 'moderate',
            explanation:
              'Oral exams, project-based learning, and in-class writing can verify understanding without detectors.',
          },
        ],
      },
    ],
    verdictNote:
      "This is happening in real schools right now! Many experts say the detectors aren't reliable enough yet. Some schools are changing how they teach instead.",
    verdictNoteC:
      "Statistical issue: base rate fallacy. With 5% actual cheating and 20% FPR, only ~21% of flagged essays are truly AI-generated (Bayes' theorem). This means most accused students are innocent — a critical flaw in deployment.",
  },
  {
    title: 'The Health AI',
    emoji: '🏥',
    scenario:
      'An AI can predict who might get sick in the future using health data. Insurance companies want to use it to set prices — people likely to get sick would pay more.',
    scenarioC:
      'A predictive health ML model using EHR data achieves 85% accuracy for chronic disease onset within 5 years. Insurance companies propose risk-adjusted pricing. Patients argue this constitutes genetic and health-status discrimination.',
    question: 'Should insurance companies use predictive health AI?',
    perspectives: [
      {
        role: 'Insurance Company',
        emoji: '🏢',
        stance: 'Yes — it helps us price fairly',
        arguments: [
          {
            text: 'Accurate risk pricing keeps premiums fair for healthy people',
            strength: 'strong',
            explanation:
              'Without risk assessment, low-risk people subsidize high-risk ones — is that fair?',
          },
          {
            text: 'We already use age and medical history',
            strength: 'moderate',
            explanation:
              'AI is an extension of existing actuarial practices, not a new concept.',
          },
          {
            text: 'It encourages preventive care',
            strength: 'weak',
            explanation:
              "Only if predictions lead to prevention programs. If they just raise prices, people can't afford care.",
          },
        ],
      },
      {
        role: 'Patient',
        emoji: '🧑‍⚕️',
        stance: "No — it punishes people for things they can't control",
        arguments: [
          {
            text: "Your genetics shouldn't determine your insurance cost",
            strength: 'strong',
            explanation:
              'Genetic predisposition is not a choice. Penalizing unchangeable traits is discriminatory.',
          },
          {
            text: 'People will avoid getting health data collected',
            strength: 'strong',
            explanation:
              'Fear of higher premiums could discourage preventive screenings, worsening public health.',
          },
          {
            text: 'This could create a healthcare underclass',
            strength: 'strong',
            explanation:
              'Those predicted as high-risk become uninsurable, creating a cycle of poverty and poor health.',
          },
        ],
      },
      {
        role: 'Policy Maker',
        emoji: '🏛️',
        stance: 'Regulate it carefully',
        arguments: [
          {
            text: 'Allow AI for prevention, ban it for pricing',
            strength: 'strong',
            explanation:
              'AI predictions are valuable for early intervention but dangerous for discrimination.',
          },
          {
            text: 'Require consent and transparency',
            strength: 'strong',
            explanation:
              'People should know what data is used and have the right to opt out.',
          },
          {
            text: 'Create an independent oversight board',
            strength: 'moderate',
            explanation:
              'Third-party auditing ensures neither companies nor patients are taken advantage of.',
          },
        ],
      },
    ],
    verdictNote:
      'Most countries are moving toward protecting people from health data discrimination. The question is: how do we use AI for good health outcomes without enabling unfair pricing?',
    verdictNoteC:
      'GINA (US) prohibits genetic discrimination in health insurance. EU GDPR requires explicit consent for health data processing. The tension between actuarial fairness and social justice remains a core challenge in health AI policy.',
  },
];

const LEARN_CARDS = [
  {
    title: 'Ethics & AI',
    emoji: '⚖️',
    desc: "Ethics is about deciding what's right and fair. When AI makes decisions that affect people, we need to think carefully about the consequences.",
  },
  {
    title: 'Many Perspectives',
    emoji: '👥',
    desc: 'Different people see the same situation differently. A company CEO, an affected person, and an ethicist might all have valid but different views.',
  },
  {
    title: 'No Easy Answers',
    emoji: '🤔',
    desc: 'Unlike math, ethics rarely has one "correct" answer. The goal is to think deeply and consider all sides before deciding.',
  },
  {
    title: 'Your Voice Matters',
    emoji: '🗣️',
    desc: 'YOU get to shape how AI is used in the future. Understanding ethics helps you make better decisions about technology.',
  },
];

export function EthicsCourtroomGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [caseIdx, setCaseIdx] = useState(0);
  const [trialStep, setTrialStep] = useState<TrialStep>('case');
  const [chosenPerspective, setChosenPerspective] = useState<number | null>(null);
  const [selectedArgs, setSelectedArgs] = useState<Set<number>>(new Set());
  const [casesDebated, setCasesDebated] = useState<string[]>([]);

  const currentCase = CASES[caseIdx];

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  useEffect(() => {
    setGameSceneContent(<EthicsCourtroomEnvironment caseIndex={caseIdx} verdictReached={trialStep === 'verdict'} />);
    return () => setGameSceneContent(null);
  }, [caseIdx, trialStep, setGameSceneContent]);

  function choosePerspective(idx: number) {
    setChosenPerspective(idx);
    setSelectedArgs(new Set());
    setTrialStep('argue');
  }

  function toggleArg(idx: number) {
    setSelectedArgs((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  }

  function submitArguments() {
    if (selectedArgs.size === 0 || chosenPerspective === null) return;
    const perspective = currentCase.perspectives[chosenPerspective];
    const strongCount = Array.from(selectedArgs).filter(
      (i) => perspective.arguments[i].strength === 'strong'
    ).length;
    const pts = 10 + strongCount * 5;
    game.updateScore(pts);
    setTrialStep('verdict');
  }

  function nextCase() {
    setCasesDebated((prev) => [...prev, currentCase.title]);
    setChosenPerspective(null);
    setSelectedArgs(new Set());
    setTrialStep('case');
    if (caseIdx < CASES.length - 1) {
      setCaseIdx((i) => i + 1);
      game.advanceRound();
    } else {
      setPhase('complete');
    }
  }

  return (
    <GameShell
      gameId="ethics-courtroom"
      title="Ethics Courtroom"
      worldNumber={6}
      worldColor="#FF6644"
      totalRounds={CASES.length}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(239,68,68,${0.12 + p.size * 0.05}), transparent)`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(239,68,68,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Top LED rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div
                    key="w"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto"
                  >
                    <motion.span
                      className="text-6xl"
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      ⚖️
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      AI Ethics Courtroom
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Analyze real-world AI ethics dilemmas through stakeholder perspectives, consequentialist and deontological frameworks.'
                        : 'Step into the courtroom! Debate real AI dilemmas, argue your perspective, and see what the jury thinks.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['AI Ethics', 'Critical Thinking', 'Debate'].map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 font-body text-2xs text-red-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Enter the Courtroom"
                    >
                      Enter the Courtroom! <Scale className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* LEARN */}
                {phase === 'learn' && (
                  <motion.div
                    key="l"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-red-500/20 bg-red-500/5"
                      >
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-red-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < 3) setLearnIdx((i) => i + 1);
                        else setPhase('trial');
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {learnIdx < 3 ? 'Next →' : 'Start the Trial! ⚖️'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('trial')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                    >
                      Skip intro →
                    </button>
                  </motion.div>
                )}

                {/* TRIAL */}
                {phase === 'trial' && (
                  <motion.div
                    key="t"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Case header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{currentCase.emoji}</span>
                      <h3 className="font-display text-sm font-bold text-white flex-1">
                        {currentCase.title}
                      </h3>
                      <span className="font-mono text-2xs text-white/20">
                        Case {caseIdx + 1}/{CASES.length}
                      </span>
                    </div>

                    {/* Step: Read case */}
                    {trialStep === 'case' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col space-y-3"
                      >
                        <div className="rounded-xl p-4 border border-red-500/15 bg-red-500/5">
                          <p className="font-body text-sm text-white/70 leading-relaxed">
                            {ageBand === 'C' ? currentCase.scenarioC : currentCase.scenario}
                          </p>
                        </div>
                        <div className="rounded-xl p-3 border border-amber-500/15 bg-amber-500/5">
                          <p className="font-display text-sm font-bold text-amber-400">
                            {currentCase.question}
                          </p>
                        </div>
                        <motion.button
                          onClick={() => setTrialStep('perspective')}
                          className="mt-auto w-full py-3 rounded-xl font-display font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                          whileTap={{ scale: 0.98 }}
                          aria-label="Choose your perspective"
                        >
                          Choose Your Perspective <Users className="inline w-4 h-4 ml-1" />
                        </motion.button>
                      </motion.div>
                    )}

                    {/* Step: Pick perspective */}
                    {trialStep === 'perspective' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col space-y-2"
                      >
                        <p className="font-display text-xs font-bold text-white/40 text-center mb-1">
                          Choose a perspective to argue:
                        </p>
                        {currentCase.perspectives.map((p, i) => (
                          <motion.button
                            key={i}
                            onClick={() => choosePerspective(i)}
                            className="w-full p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left"
                            whileTap={{ scale: 0.98 }}
                            aria-label={`Argue as ${p.role}: ${p.stance}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{p.emoji}</span>
                              <div className="flex-1">
                                <p className="font-display text-sm font-bold text-white">
                                  {p.role}
                                </p>
                                <p className="font-body text-2xs text-white/40">
                                  {p.stance}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}

                    {/* Step: Select arguments */}
                    {trialStep === 'argue' && chosenPerspective !== null && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col space-y-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {currentCase.perspectives[chosenPerspective].emoji}
                          </span>
                          <p className="font-display text-xs font-bold text-white/50">
                            Arguing as {currentCase.perspectives[chosenPerspective].role}
                          </p>
                        </div>
                        <p className="font-body text-2xs text-white/30 mb-1">
                          Select your strongest arguments:
                        </p>
                        {currentCase.perspectives[chosenPerspective].arguments.map((arg, i) => (
                          <motion.button
                            key={i}
                            onClick={() => toggleArg(i)}
                            className={`w-full p-3 rounded-xl border text-left transition-all ${
                              selectedArgs.has(i)
                                ? 'border-red-500/40 bg-red-500/10'
                                : 'border-white/10 bg-white/5'
                            }`}
                            whileTap={{ scale: 0.98 }}
                            aria-label={`Argument: ${arg.text}. Strength: ${arg.strength}`}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center text-2xs ${
                                  selectedArgs.has(i)
                                    ? 'border-red-400 bg-red-500/20 text-red-300'
                                    : 'border-white/20'
                                }`}
                              >
                                {selectedArgs.has(i) ? '✓' : ''}
                              </div>
                              <div className="flex-1">
                                <p className="font-body text-sm text-white/70">{arg.text}</p>
                                <span
                                  className={`inline-block mt-1 px-1.5 py-0.5 rounded text-2xs font-bold ${
                                    arg.strength === 'strong'
                                      ? 'bg-green-500/15 text-green-400'
                                      : arg.strength === 'moderate'
                                        ? 'bg-amber-500/15 text-amber-400'
                                        : 'bg-red-500/15 text-red-400'
                                  }`}
                                >
                                  {arg.strength}
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                        <motion.button
                          onClick={submitArguments}
                          disabled={selectedArgs.size === 0}
                          className="mt-auto w-full py-3 rounded-xl font-display font-bold text-white disabled:opacity-40"
                          style={{
                            background:
                              selectedArgs.size > 0
                                ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                                : '#333',
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Present to the Jury!{' '}
                          <MessageSquare className="inline w-4 h-4 ml-1" />
                        </motion.button>
                      </motion.div>
                    )}

                    {/* Step: Verdict */}
                    {trialStep === 'verdict' && chosenPerspective !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col space-y-3"
                      >
                        {/* Arguments review */}
                        <div className="rounded-xl p-3 border border-red-500/15 bg-red-500/5">
                          <p className="font-display text-xs font-bold text-red-300 mb-2">
                            <Scale className="inline w-3 h-3 mr-1" /> Your Arguments (
                            {currentCase.perspectives[chosenPerspective].role})
                          </p>
                          {Array.from(selectedArgs).map((i) => {
                            const arg =
                              currentCase.perspectives[chosenPerspective].arguments[i];
                            return (
                              <div key={i} className="mb-2">
                                <p className="font-body text-xs text-white/60">
                                  • {arg.text}
                                </p>
                                <p className="font-body text-2xs text-white/30 ml-3">
                                  {arg.explanation}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Verdict */}
                        <div className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
                          <Award className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                          <p className="font-display text-sm font-bold text-amber-400 mb-2">
                            Jury Reflection
                          </p>
                          <p className="font-body text-xs text-white/60 leading-relaxed">
                            {ageBand === 'C'
                              ? currentCase.verdictNoteC
                              : currentCase.verdictNote}
                          </p>
                        </div>

                        {/* Other perspectives teaser */}
                        <div className="rounded-xl p-3 border border-white/5 bg-white/[0.02]">
                          <p className="font-body text-2xs text-white/25 mb-1">
                            Other perspectives:
                          </p>
                          {currentCase.perspectives
                            .filter((_, i) => i !== chosenPerspective)
                            .map((p, i) => (
                              <p key={i} className="font-body text-2xs text-white/40">
                                {p.emoji}{' '}
                                <span className="font-semibold">{p.role}:</span> {p.stance}
                              </p>
                            ))}
                        </div>

                        <motion.button
                          onClick={nextCase}
                          className="mt-auto w-full py-3 rounded-xl font-display font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {caseIdx < CASES.length - 1 ? 'Next Case →' : 'Complete! ⚖️'}
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
                {/* COMPLETE */}
                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto"
                  >
                    <motion.span
                      className="text-6xl"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🏛️
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Court Adjourned!
                    </h2>
                    <p className="font-body text-sm text-white/50">
                      You debated {casesDebated.length} real-world AI ethics dilemmas.
                    </p>

                    <div className="w-full rounded-xl p-3 border border-red-500/15 bg-red-500/5 text-left space-y-1">
                      {casesDebated.map((title, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm">{CASES[i]?.emoji}</span>
                          <p className="font-body text-xs text-white/50">{title}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl p-3 border border-amber-500/15 bg-amber-500/5">
                      <Award className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <p className="font-body text-xs text-white/50 leading-relaxed">
                        {ageBand === 'C'
                          ? 'Ethics in AI involves navigating tensions between consequentialism, deontology, and virtue ethics. There are no universal algorithms for moral reasoning — but understanding these frameworks makes you a better technologist.'
                          : "Remember: there's no single right answer in ethics. The important thing is to think carefully, consider all perspectives, and keep asking questions!"}
                      </p>
                    </div>

                    <p className="font-data text-lg text-red-400">
                      Score: {game.score}
                    </p>

                    <motion.button
                      onClick={() => game.completeGame()}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Finish game"
                    >
                      Finish! <Award className="inline w-4 h-4 ml-1" />
                    </motion.button>
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
