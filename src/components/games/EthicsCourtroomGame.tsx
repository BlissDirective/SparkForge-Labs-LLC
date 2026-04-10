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
import { useGameContent } from '@/hooks/useContent';
import { Scale, Users, MessageSquare, Award } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const EthicsCourtroomEnvironment = dynamic(
  () => import('@/components/3d/environments/EthicsCourtroomEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'trial' | 'complete';
type TrialStep = 'case' | 'perspective' | 'argue' | 'verdict';

interface Argument {
  text: string;
  textC?: string;
  strength: 'strong' | 'moderate' | 'weak';
  explanation?: string;
}

interface Perspective {
  role: string;
  name?: string;
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
  band?: 'A' | 'B' | 'C';
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
}

const CASES: EthicsCase[] = [
  {
    title: 'The Self-Driving Decision',
    emoji: '🚗',
    band: 'A',
    difficulty: 'medium',
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
    band: 'A',
    difficulty: 'medium',
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
    band: 'A',
    difficulty: 'easy',
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
    band: 'B',
    difficulty: 'medium',
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
  {
    title: 'AI Content Moderation',
    emoji: '🔇',
    band: 'A',
    difficulty: 'medium',
    scenario:
      'A social media company uses AI to automatically remove posts it thinks are harmful. But the AI sometimes removes harmless posts and misses actually harmful ones. Should AI decide what content gets removed?',
    scenarioC:
      'An automated content moderation system processes 500M posts daily with a 5% false positive rate (25M wrongful removals) and 15% false negative rate. The system disproportionately flags minority dialects and political satire. Manual review at this scale is economically infeasible.',
    question: 'Should AI decide what content gets removed from social media?',
    perspectives: [
      {
        role: 'Platform Executive',
        emoji: '💻',
        stance: 'AI moderation is necessary at scale',
        arguments: [
          {
            text: 'Humans cannot review billions of posts per day',
            textC: 'At 500M daily posts, human review would require 2M+ moderators working full-time — economically impossible.',
            strength: 'strong',
          },
          {
            text: 'AI catches harmful content before it spreads',
            textC: 'Real-time classification enables sub-second removal, preventing viral amplification of harmful content.',
            strength: 'strong',
          },
          {
            text: 'We can improve the AI over time with better training data',
            textC: 'Continuous learning from appeal outcomes creates a feedback loop that improves precision and recall iteratively.',
            strength: 'moderate',
          },
        ],
      },
      {
        role: 'Free Speech Advocate',
        emoji: '📢',
        stance: 'AI censorship threatens free expression',
        arguments: [
          {
            text: 'AI cannot understand sarcasm, humor, or cultural context',
            textC: 'Pragmatic language features like irony, satire, and code-switching systematically evade classifier detection.',
            strength: 'strong',
          },
          {
            text: 'Wrongful removal silences important voices',
            textC: 'False positives disproportionately affect marginalized communities whose dialects diverge from training data norms.',
            strength: 'strong',
          },
          {
            text: 'There is no easy way to appeal an AI decision',
            textC: 'Automated appeal systems create recursive loops where AI reviews AI decisions, undermining due process.',
            strength: 'moderate',
          },
        ],
      },
      {
        role: 'Digital Safety Researcher',
        emoji: '🛡️',
        stance: 'Use AI to flag, but let humans decide',
        arguments: [
          {
            text: 'AI should assist human moderators, not replace them',
            textC: 'Human-in-the-loop architectures combine AI throughput with human contextual judgment for high-stakes decisions.',
            strength: 'strong',
          },
          {
            text: 'Transparent rules help people understand what is allowed',
            textC: 'Publicly documented classification taxonomies enable community oversight and reduce perceived arbitrariness.',
            strength: 'strong',
          },
          {
            text: 'Regular audits can catch bias in the system',
            textC: 'Third-party algorithmic audits measuring disparate impact across demographic groups are essential for accountability.',
            strength: 'moderate',
          },
        ],
      },
    ],
    verdictNote:
      'Most experts agree AI is needed to handle the huge volume of content, but it works best when humans make the final call on tough decisions. Transparency and appeals processes are key.',
    verdictNoteC:
      'The Santa Clara Principles on Transparency and Accountability in Content Moderation recommend publishing enforcement data, providing notice to affected users, and offering meaningful appeals. The DSA (EU) mandates algorithmic transparency for very large platforms.',
  },
  {
    title: 'Deepfake Legislation',
    emoji: '🎭',
    band: 'A',
    difficulty: 'hard',
    scenario:
      'New AI tools can create incredibly realistic fake videos of real people saying things they never said. Some people use them for fun or art, but others use them to spread lies or hurt people.',
    scenarioC:
      'Generative adversarial networks and diffusion models can now produce photorealistic synthetic media indistinguishable from authentic footage. Applications range from entertainment and education to electoral manipulation and non-consensual intimate imagery.',
    question: 'Should creating realistic deepfakes be illegal?',
    perspectives: [
      {
        role: 'Lawmaker',
        emoji: '🏛️',
        stance: 'Yes — deepfakes cause real harm and must be banned',
        arguments: [
          {
            text: 'Fake videos can destroy someone\'s reputation overnight',
            textC: 'Deepfakes weaponize trust in visual evidence, causing irreversible reputational damage before debunking occurs.',
            strength: 'strong',
          },
          {
            text: 'Deepfakes can be used to interfere with elections',
            textC: 'Synthetic media of political figures making fabricated statements can influence voter behavior at scale with no time for correction.',
            strength: 'strong',
          },
          {
            text: 'People have a right to control their own likeness',
            textC: 'Personality rights and bodily autonomy extend to digital representations — unauthorized synthesis violates both.',
            strength: 'moderate',
          },
        ],
      },
      {
        role: 'Digital Artist',
        emoji: '🎨',
        stance: 'No — banning the technology kills creative innovation',
        arguments: [
          {
            text: 'Deepfake tech is used in movies, education, and accessibility',
            textC: 'Synthetic media enables de-aging in films, historical figure recreation for education, and voice synthesis for ALS patients.',
            strength: 'strong',
          },
          {
            text: 'We should punish misuse, not ban the tool itself',
            textC: 'Technology-neutral regulation targeting harmful outcomes is more effective than blanket prohibition of dual-use tools.',
            strength: 'strong',
          },
          {
            text: 'A ban would be impossible to enforce globally',
            textC: 'Open-source model weights are already widely distributed — enforcement requires international cooperation that does not exist.',
            strength: 'moderate',
          },
        ],
      },
      {
        role: 'Technology Ethicist',
        emoji: '🔬',
        stance: 'Require labeling and detection, not outright bans',
        arguments: [
          {
            text: 'All AI-generated content should be clearly labeled',
            textC: 'Mandatory watermarking via C2PA provenance standards enables downstream detection without restricting creation.',
            strength: 'strong',
          },
          {
            text: 'Invest in detection tools that keep pace with creation tools',
            textC: 'Adversarial co-evolution between generators and detectors maintains equilibrium when funded proportionally.',
            strength: 'strong',
          },
          {
            text: 'Education helps people become better at spotting fakes',
            textC: 'Media literacy programs reduce susceptibility to synthetic media by 30-50% in controlled studies.',
            strength: 'moderate',
          },
        ],
      },
    ],
    verdictNote:
      'Most experts say we need a mix: strong laws against harmful deepfakes, labeling requirements for all AI content, and better detection tools. Banning the technology entirely would also block many positive uses.',
    verdictNoteC:
      'The EU AI Act classifies deepfakes as limited-risk, requiring transparency obligations (disclosure of synthetic origin). The US DEEPFAKES Accountability Act proposes mandatory watermarking. China requires consent for likeness synthesis. No jurisdiction has imposed a total creation ban.',
  },
  {
    title: 'AI Teacher',
    emoji: '👩‍🏫',
    band: 'A',
    difficulty: 'medium',
    scenario:
      'A school district wants to replace some human teachers with AI tutors that can give every student personalized lessons 24/7. The AI is cheaper and always patient, but some parents and teachers are worried.',
    scenarioC:
      'An adaptive AI tutoring system demonstrates 1.5 standard deviation improvement in standardized test scores compared to traditional instruction, at 20% of the cost. However, longitudinal studies show reduced social-emotional development and increased screen dependency in AI-only cohorts.',
    question: 'Should AI teachers replace human teachers in schools?',
    perspectives: [
      {
        role: 'School Board Member',
        emoji: '📊',
        stance: 'Yes — AI tutors deliver better academic results',
        arguments: [
          {
            text: 'Every student gets a personal tutor who adapts to their pace',
            textC: 'Adaptive learning algorithms optimize spaced repetition and difficulty progression per-student, impossible at scale with human teachers.',
            strength: 'strong',
          },
          {
            text: 'AI tutors are available 24/7 and never get frustrated',
            textC: 'Asynchronous availability eliminates scheduling constraints and removes negative emotional feedback loops.',
            strength: 'strong',
          },
          {
            text: 'It saves money that can be spent on other school needs',
            textC: 'At 20% cost, savings could fund arts, sports, counseling, and infrastructure — areas currently underfunded.',
            strength: 'moderate',
          },
        ],
      },
      {
        role: 'Parent',
        emoji: '👨‍👩‍👧',
        stance: 'No — children need human connection to learn',
        arguments: [
          {
            text: 'Teachers are role models who inspire and care about students',
            textC: 'Mentorship, emotional validation, and modeling of social behavior are irreplaceable functions of human educators.',
            strength: 'strong',
          },
          {
            text: 'Kids already spend too much time on screens',
            textC: 'Meta-analyses link excessive screen time in children to reduced attention span, sleep disruption, and social skill deficits.',
            strength: 'strong',
          },
          {
            text: 'AI cannot handle bullying, anxiety, or family problems',
            textC: 'Social-emotional learning and pastoral care require empathy, situational judgment, and mandatory reporting obligations that AI cannot fulfill.',
            strength: 'moderate',
          },
        ],
      },
      {
        role: 'Education Researcher',
        emoji: '🔬',
        stance: 'Use AI to assist teachers, not replace them',
        arguments: [
          {
            text: 'AI handles drills and practice, humans handle inspiration and mentoring',
            textC: 'Blended models where AI manages formative assessment and humans facilitate Socratic discussion optimize both efficiency and depth.',
            strength: 'strong',
          },
          {
            text: 'Teachers freed from grading can spend more time with struggling students',
            textC: 'Automating routine assessment reclaims 30-40% of teacher time for high-impact individualized instruction.',
            strength: 'strong',
          },
          {
            text: 'The best outcomes come from humans and AI working together',
            textC: 'Studies show AI-augmented instruction outperforms both AI-only and human-only conditions by 0.4 standard deviations.',
            strength: 'moderate',
          },
        ],
      },
    ],
    verdictNote:
      'Most education experts say the best approach is AI AND human teachers working together. AI handles personalized practice while humans provide mentorship, creativity, and emotional support.',
    verdictNoteC:
      'The UNESCO Recommendation on AI in Education (2021) emphasizes human oversight, teacher empowerment, and equitable access. Research consistently shows blended instruction models outperform replacement models across all measured outcomes.',
  },
  {
    title: 'AI Environmental Cost',
    emoji: '🌍',
    band: 'A',
    difficulty: 'hard',
    scenario:
      'Training one large AI model uses as much energy as five cars use in their entire lifetime. AI data centers need huge amounts of water for cooling. As AI gets more popular, its environmental impact keeps growing.',
    scenarioC:
      'Training GPT-4-scale models emits approximately 300 tonnes of CO2 equivalent. Global AI compute demand doubles every 6-10 months. Data centers consumed 1-2% of global electricity in 2024, projected to reach 3-4% by 2027, with significant water consumption for cooling.',
    question: 'Is AI technology worth its massive energy consumption?',
    perspectives: [
      {
        role: 'AI Company Executive',
        emoji: '🏢',
        stance: 'Yes — AI benefits far outweigh environmental costs',
        arguments: [
          {
            text: 'AI helps fight climate change by optimizing energy grids and predicting weather',
            textC: 'DeepMind reduced Google data center cooling energy by 40%. AI-optimized power grids prevent 2.6 gigatonnes of CO2 annually.',
            strength: 'strong',
          },
          {
            text: 'We are investing heavily in renewable energy for data centers',
            textC: 'Major AI companies have committed to 100% renewable energy by 2030, with power purchase agreements already covering 60-80%.',
            strength: 'strong',
          },
          {
            text: 'AI makes many other industries more efficient, reducing overall waste',
            textC: 'AI-driven efficiency gains across transportation, agriculture, and manufacturing could reduce global emissions by 5-10%.',
            strength: 'moderate',
          },
        ],
      },
      {
        role: 'Environmental Scientist',
        emoji: '🌱',
        stance: 'No — we cannot ignore the growing environmental damage',
        arguments: [
          {
            text: 'AI energy use is growing faster than renewable energy can keep up',
            textC: 'AI compute demand doubles every 6-10 months while global renewable capacity grows at 10-15% annually — the gap is widening.',
            strength: 'strong',
          },
          {
            text: 'Data centers use millions of gallons of water in drought-prone areas',
            textC: 'A single large data center can consume 5 million gallons of water daily for cooling, competing with agricultural and municipal needs.',
            strength: 'strong',
          },
          {
            text: 'Most AI applications are not solving critical problems — they are generating cat pictures and chatbots',
            textC: 'Analysis shows less than 5% of AI compute is directed at climate, health, or sustainability applications — the majority serves advertising and entertainment.',
            strength: 'moderate',
          },
        ],
      },
      {
        role: 'Policy Advisor',
        emoji: '📜',
        stance: 'Regulate AI energy use and require transparency',
        arguments: [
          {
            text: 'Companies should report how much energy their AI models use',
            textC: 'Mandatory carbon disclosure for model training and inference enables market-based incentives for efficiency.',
            strength: 'strong',
          },
          {
            text: 'Tax carbon-heavy AI and fund green AI research',
            textC: 'Pigouvian taxation internalizes environmental externalities while redirecting revenue toward energy-efficient architectures.',
            strength: 'strong',
          },
          {
            text: 'Set efficiency standards — reward companies that do more with less energy',
            textC: 'Performance-per-watt benchmarks like MLPerf Green encourage algorithmic efficiency improvements alongside hardware advances.',
            strength: 'moderate',
          },
        ],
      },
    ],
    verdictNote:
      'This is one of the biggest challenges facing AI today. Most experts say we need AI to be part of solving climate change, but the AI industry must also clean up its own environmental footprint.',
    verdictNoteC:
      'The IEA projects data centers could consume 1,000 TWh by 2026 (doubling from 2022). The tension between AI\'s potential to accelerate decarbonization and its own carbon footprint requires lifecycle analysis, not just training-time metrics. Sparse models, distillation, and efficient architectures offer 10-100x compute reduction.',
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
  const { data: _dynamicContent } = useGameContent('ethics-courtroom', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [caseIdx, setCaseIdx] = useState(0);
  const [trialStep, setTrialStep] = useState<TrialStep>('case');
  const [chosenPerspective, setChosenPerspective] = useState<number | null>(null);
  const [selectedArgs, setSelectedArgs] = useState<Set<number>>(new Set());
  const [casesDebated, setCasesDebated] = useState<string[]>([]);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const [hasFinished, setHasFinished] = useState(false);

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
      game.completeGame();
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
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={caseIdx + 1} total={CASES.length} labColor="#FF6644" />
                    </div>
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
                      onClick={() => {
                        if (hasFinished) return;
                        setHasFinished(true);
                        game.completeGame();
                      }}
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
