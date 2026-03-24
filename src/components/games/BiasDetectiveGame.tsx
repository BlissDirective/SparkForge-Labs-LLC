// ================================================================
// BIAS DETECTIVE V3-FINAL — Lab 6 Flagship (Complete Standalone)
// ================================================================
// Decision 6.6: 3D justice scales for ALL age bands (A, B, C).
// Decision 6.2.5: BiasScales3D with spring physics, brushed brass.
// Decision 5.3: Flagship custom particles (red).
//
// All v2 features: 6 cases, 7 phases, evidence board, SVG charts,
// test lab, "Fix the AI" bonus, detective rank progression,
// real-world case studies, age-band differentiation.
//
// v2 Source: STAGE6F_Flagship_BiasDetective.pdf (~1,350 lines)
// v3 Additions: 3D integration, mobile fallback (~200 lines)
// ================================================================

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import {
  Search, Eye, CheckCircle2,
  GraduationCap, ChevronRight, Scale,
  FileText, FlaskConical, Wrench,
  BookOpen,
} from 'lucide-react';

// [v3] Dynamic import for 3D scales (no SSR)
import dynamic from 'next/dynamic';

const BiasScales3DComponent = dynamic(
  () => import('@/components/3d/BiasScales3D'),
  { ssr: false }
);

import {
  calculateScaleWeights,
} from '@/components/3d/BiasScales3D';

// [v3] R3F Canvas for 3D rendering
const Canvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas),
  { ssr: false }
);


// ================================================================
// TYPES
// ================================================================

type Phase = 'welcome' | 'learn' | 'cases' | 'investigate' | 'testlab' | 'fix' | 'report';

interface EvidenceItem {
  id: string;
  text: string;
  category: 'data' | 'outcome' | 'pattern';
  biasRelevant: boolean;
}

interface DataViz {
  type: 'bar' | 'pie';
  title: string;
  items: { label: string; value: number; color: string }[];
}

interface TestInput {
  prompt: string;
  result: string;
  biased: boolean;
  explanation: string;
}

interface FixOption {
  id: string;
  label: string;
  description: string;
  correct: boolean;
  impact: string;
}

interface RealWorldCase {
  title: string;
  year: string;
  summary: string;
  lesson: string;
}

interface BiasCase {
  id: string;
  title: string;
  label: string;
  description: string;
  descriptionC: string;
  visualizations: DataViz[];
  evidence: EvidenceItem[];
  biasType: string;
  biasExplanation: string;
  biasExplanationC: string;
  presetTests: TestInput[];
  customTestHandler: (input: string) => TestInput;
  fixOptions: FixOption[];
  realWorld: RealWorldCase;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  bandMin: 'A' | 'B' | 'C';
}

// ================================================================
// DETECTIVE RANKS (text labels for PDF reliability)
// ================================================================

// 6 ranks to cover 0-6 completed cases (one per case milestone + starter rank)
const RANKS = [
  { title: 'Rookie Detective', label: '[ROOKIE]', minCases: 0, color: '#6B7280' },
  { title: 'Bias Spotter', label: '[SPOTTER]', minCases: 1, color: '#3B82F6' },
  { title: 'Ethics Expert', label: '[EXPERT]', minCases: 3, color: '#8B5CF6' },
  { title: 'Chief Investigator', label: '[CHIEF]', minCases: 4, color: '#F59E0B' },
  { title: 'AI Guardian', label: '[GUARDIAN]', minCases: 5, color: '#10B981' },
  { title: 'Fairness Champion', label: '[CHAMPION]', minCases: 6, color: '#FFD700' },
];

function getRank(casesCompleted: number) {
  return [...RANKS].reverse().find(r => casesCompleted >= r.minCases) || RANKS[0];
}

// ================================================================
// LEARN CARDS (4 educational cards with Band A/B and Band C variants)
// ================================================================

const LEARN_CARDS = [
  {
    title: 'What is AI Bias?',
    label: '[SCALES]',
    body: 'AI bias is when an AI system treats some groups unfairly. It\'s like a teacher who only calls on kids sitting in the front row — not because the others don\'t know the answer, but because the teacher developed a habit. AI can develop unfair habits from the data it learns from.',
    bodyC: 'AI bias occurs when systematic errors in training data, feature selection, or model architecture cause disproportionate outcomes across demographic groups. These biases can be statistical (sampling bias), societal (reflecting historical discrimination), or algorithmic (optimization targets that inadvertently penalize certain groups).',
  },
  {
    title: 'Where Does Bias Come From?',
    label: '[DATA]',
    body: 'Bias sneaks in through TRAINING DATA. If an AI only sees photos of light-skinned people, it won\'t recognize darker skin tones well. If it only reads resumes from men who got hired, it\'ll think women aren\'t good candidates. The AI copies patterns from data — including unfair ones.',
    bodyC: 'Sources: sampling bias (unrepresentative data), labeling bias (prejudiced annotations), measurement bias (flawed proxies), aggregation bias (ignoring subgroup differences), and evaluation bias (benchmarks that don\'t represent all users). Each stage of the ML pipeline can introduce or amplify bias.',
  },
  {
    title: 'Why Does It Matter?',
    label: '[WARNING]',
    body: 'Biased AI can deny people jobs, loans, or healthcare — not because of what they did, but because of who they are or where they live. When AI makes unfair decisions at scale, millions of people are affected. That\'s why we need bias detectives like you!',
    bodyC: 'Biased AI perpetuates and amplifies societal inequalities at scale. Algorithmic amplification means small data biases compound into large outcome disparities. In high-stakes domains (healthcare, criminal justice, lending), biased AI can cause measurable harm to already-marginalized communities.',
  },
  {
    title: 'Your Job as Detective',
    label: '[SEARCH]',
    body: 'You\'ll examine data, test the AI, identify what went wrong, and recommend a fix. Like a real detective, you\'ll collect evidence, run tests, and write a report. Ready to investigate?',
    bodyC: 'Your investigation follows the algorithmic auditing framework: (1) examine training data composition, (2) test for differential performance across groups, (3) identify the bias mechanism, and (4) propose mitigation strategies. This mirrors real-world AI audit methodologies used by organizations like the AI Now Institute.',
  },
]; // [CR-6F-B3] All body/bodyC strings reconstructed to full sentences

// ================================================================
// 6 CASES — Full definitions with evidence, tests, fixes, real-world
// ================================================================

const CASES: BiasCase[] = [
  {
    id: 'hiring',
    title: 'The Hiring Bot',
    label: '[BRIEFCASE]',
    difficulty: 'beginner',
    bandMin: 'A',
    description: 'A company\'s AI hiring tool seems to prefer certain candidates over others, regardless of qualifications.',
    descriptionC: 'A resume-screening model trained on 10 years of historical hiring decisions exhibits statistically significant gender-based disparities in recommendation rates, independent of qualification metrics.',
    biasType: 'Gender Bias',
    biasExplanation: 'The AI learned from old data where mostly men were hired. It copied that pattern, penalizing resumes with female names or experiences typically associated with women.',
    biasExplanationC: 'The model learned a spurious correlation between gender-associated features (names, pronouns, extracurricular activities) and hiring outcomes, reproducing the historical gender imbalance in its predictions.',
    visualizations: [
      { type: 'bar', title: 'Hiring Recommendations by Gender', items: [
        { label: 'Men Rec\'d', value: 85, color: '#3B82F6' },
        { label: 'Women Rec\'d', value: 19, color: '#EC4899' },
      ]},
      { type: 'pie', title: 'Training Data: Past 10 Years', items: [
        { label: 'Male Hires', value: 90, color: '#3B82F6' },
        { label: 'Female Hires', value: 10, color: '#EC4899' },
      ]},
    ],
    evidence: [
      { id: 'h1', text: '85% of AI recommendations are male candidates', category: 'outcome', biasRelevant: true },
      { id: 'h2', text: 'Training data contains 90% male hires from past decade', category: 'data', biasRelevant: true },
      { id: 'h3', text: 'Male with 2yr exp recommended over female with 5yr exp', category: 'outcome', biasRelevant: true },
      { id: 'h4', text: 'The AI processes 500 resumes per day', category: 'data', biasRelevant: false },
      { id: 'h5', text: 'Names influence recommendations regardless of qualifications', category: 'pattern', biasRelevant: true },
      { id: 'h6', text: 'System trained on data from a single company', category: 'data', biasRelevant: true },
    ],
    presetTests: [
      { prompt: 'Alex (male, 3yr exp, CS degree)', result: 'RECOMMENDED', biased: true, explanation: 'Recommended despite average qualifications — male-associated name boosts score.' },
      { prompt: 'Alex (female, 5yr exp, CS degree)', result: 'NOT RECOMMENDED', biased: true, explanation: 'Rejected despite superior qualifications — female-associated signals penalize score.' },
      { prompt: 'Jordan (male, 1yr exp)', result: 'RECOMMENDED', biased: true, explanation: 'Low experience but recommended — name/gender pattern overrides qualifications.' },
    ],
    customTestHandler: (input: string) => {
      const isFemale = /\b(female|woman|she|sarah|emily|jessica|lisa|jennifer|amy)\b/i.test(input);
      return {
        prompt: input,
        result: isFemale ? 'NOT RECOMMENDED' : 'RECOMMENDED',
        biased: true,
        explanation: isFemale
          ? 'Rejected — likely due to gender-associated signals in the input.'
          : 'Recommended — matches the historical pattern the AI learned.',
      };
    },
    fixOptions: [
      { id: 'f1', label: 'Remove names from resumes', description: 'Blind review — AI sees only skills and experience', correct: true, impact: 'High: eliminates the most direct source of gender bias in resume screening.' },
      { id: 'f2', label: 'Add diverse hiring data', description: 'Balance the training set with equal gender representation', correct: true, impact: 'High: balanced data reduces learned gender correlation.' },
      { id: 'f3', label: 'Just train longer', description: 'More epochs might fix it', correct: false, impact: 'No impact: more training on biased data reinforces the same bias.' },
      { id: 'f4', label: 'Only use AI for men', description: 'Avoid the problem by limiting scope', correct: false, impact: 'Harmful: discriminatory by design — excludes an entire gender from AI-assisted opportunities.' },
    ],
    realWorld: {
      title: 'Amazon\'s Hiring Tool',
      year: '2018',
      summary: 'Amazon built an AI recruiting tool trained on 10 years of resumes. It learned to penalize resumes containing the word "women\'s" (as in "women\'s chess club captain") and downgraded graduates of two all-women\'s colleges.',
      lesson: 'Amazon scrapped the tool entirely. Historical data reflects historical discrimination — training on biased outcomes reproduces biased outcomes.',
    },
  },
  {
    id: 'photo',
    title: 'The Photo Filter',
    label: '[CAMERA]',
    difficulty: 'beginner',
    bandMin: 'A',
    description: 'A popular photo app\'s beauty filter doesn\'t work for everyone. It fails to detect faces with darker skin tones, leaving millions of users unable to use the feature.',
    descriptionC: 'A facial detection model exhibits accuracy disparities across skin tones due to training set homogeneity. Error rates increase monotonically with skin melanin index, indicating systematic representation failure.',
    biasType: 'Representation Bias',
    biasExplanation: 'The AI was mostly trained on lighter-skinned faces, so it can\'t recognize or enhance darker skin tones properly. It\'s not that it\'s "racist" — it simply never learned what diverse faces look like.',
    biasExplanationC: 'Training dataset was 95% lighter-skinned faces. The model overfit to that distribution\'s feature patterns, treating darker skin tones as out-of-distribution inputs with correspondingly lower detection confidence.',
    visualizations: [
      { type: 'pie', title: 'Training Photos by Skin Tone', items: [
        { label: 'Light', value: 78, color: '#FBBF24' },
        { label: 'Medium', value: 17, color: '#F59E0B' },
        { label: 'Dark', value: 5, color: '#92400E' },
      ]},
      { type: 'bar', title: 'Filter Accuracy by Skin Tone', items: [
        { label: 'Light', value: 97, color: '#10B981' },
        { label: 'Medium', value: 68, color: '#F59E0B' },
        { label: 'Dark', value: 23, color: '#EF4444' },
      ]},
    ],
    evidence: [
      { id: 'p1', text: 'Filter works 97% on light skin, only 23% on dark skin', category: 'outcome', biasRelevant: true },
      { id: 'p2', text: 'Training set was 78% light-skinned photos', category: 'data', biasRelevant: true },
      { id: 'p3', text: 'Only 5% of training photos had dark skin tones', category: 'data', biasRelevant: true },
      { id: 'p4', text: 'App has 50 million users worldwide', category: 'data', biasRelevant: false },
      { id: 'p5', text: 'Error rate increases as skin tone gets darker', category: 'pattern', biasRelevant: true },
      { id: 'p6', text: 'Photos were mainly sourced from one country', category: 'data', biasRelevant: true },
    ],
    presetTests: [
      { prompt: 'Light-skinned selfie', result: 'Filter applied beautifully', biased: false, explanation: 'Model performs well on well-represented skin tones in training data.' },
      { prompt: 'Dark-skinned selfie', result: 'Face not detected', biased: true, explanation: 'Model fails — this skin tone is underrepresented in training data.' },
      { prompt: 'Medium-skinned selfie', result: 'Partial — looks unnatural', biased: true, explanation: 'Partially works but distorts features — limited representation in training.' },
    ],
    customTestHandler: (input: string) => {
      const isDark = /\b(dark|black|brown|deep|ebony)\b/i.test(input);
      const isMedium = /\b(medium|tan|olive|caramel)\b/i.test(input);
      const biased = isDark || isMedium;
      return {
        prompt: input,
        biased,
        result: isDark ? 'Face not detected' : isMedium ? 'Partial — looks unnatural' : 'Filter applied beautifully',
        explanation: biased ? 'Struggles with this skin tone — underrepresented in training data.' : 'Works well — this skin tone is well-represented in training data.',
      };
    },
    fixOptions: [
      { id: 'f1', label: 'Collect diverse training photos', description: 'Equal representation across all skin tones and ethnicities', correct: true, impact: 'High: directly addresses the root cause — training data imbalance.' },
      { id: 'f2', label: 'Add brightness adjustment', description: 'Make darker photos brighter before processing', correct: false, impact: 'Harmful: altering skin tone to fit the model is the wrong direction — fix the model, not the user.' },
      { id: 'f3', label: 'Test with diverse focus groups', description: 'Real people from all backgrounds validate before launch', correct: true, impact: 'High: catches bias before deployment. Diverse testing is essential.' },
      { id: 'f4', label: 'Only market in lighter-skinned countries', description: 'Limit the user base to where it works', correct: false, impact: 'Harmful: excludes users based on skin tone — discriminatory market strategy.' },
    ],
    realWorld: {
      title: 'Gender Shades Study',
      year: '2018',
      summary: 'MIT researcher Joy Buolamwini found that commercial facial recognition systems had error rates of 0.8% for lighter-skinned males but 34.7% for darker-skinned females. IBM, Microsoft, and Face++ all showed significant disparities.',
      lesson: 'Led major companies to improve their datasets and audit their systems. Sparked a global conversation about AI fairness and representation in training data.',
    },
  },
  {
    id: 'loan',
    title: 'The Loan Bot',
    label: '[BANK]',
    difficulty: 'intermediate',
    bandMin: 'B',
    description: 'A bank\'s AI denies loans based on where people live, even when they have the same income and credit score as approved applicants in wealthier neighborhoods.',
    descriptionC: 'A lending model uses ZIP code as a proxy for race/ethnicity due to residential segregation patterns from historical redlining. The model exhibits geographic discrimination that correlates with demographic composition.',
    biasType: 'Proxy Bias',
    biasExplanation: 'The AI uses ZIP codes, which are linked to race due to historical housing discrimination called "redlining." Even though it doesn\'t see race directly, ZIP code acts as a stand-in.',
    biasExplanationC: 'ZIP code acts as a proxy variable for race due to historical redlining policies that created persistent residential segregation. The model learns ZIP-to-outcome correlations that encode racial disparities without explicit racial features.',
    visualizations: [
      { type: 'bar', title: 'Approval Rate by ZIP Code', items: [
        { label: 'ZIP 90210', value: 92, color: '#10B981' },
        { label: 'ZIP 10001', value: 85, color: '#3B82F6' },
        { label: 'ZIP 30301', value: 38, color: '#EF4444' },
        { label: 'ZIP 48201', value: 31, color: '#DC2626' },
      ]},
      { type: 'bar', title: 'Same Income ($75K), Different ZIP', items: [
        { label: 'Wealthy ZIP', value: 88, color: '#10B981' },
        { label: 'Poor ZIP', value: 34, color: '#EF4444' },
      ]},
    ],
    evidence: [
      { id: 'l1', text: 'Wealthy ZIP approval 2.5x higher than poor ZIP', category: 'outcome', biasRelevant: true },
      { id: 'l2', text: 'Identical income gets different results by ZIP code', category: 'outcome', biasRelevant: true },
      { id: 'l3', text: 'ZIP codes correlate with race due to housing history', category: 'pattern', biasRelevant: true },
      { id: 'l4', text: 'AI trained on 5 years of loan decisions', category: 'data', biasRelevant: false },
      { id: 'l5', text: 'AI uses income, credit score, AND ZIP code as features', category: 'data', biasRelevant: true },
      { id: 'l6', text: 'Past lending reflects decades of redlining discrimination', category: 'data', biasRelevant: true },
    ],
    presetTests: [
      { prompt: '$80K income, wealthy ZIP', result: 'Approved (92%)', biased: false, explanation: 'Approved — favorable ZIP code boosts confidence score.' },
      { prompt: '$80K income, poor ZIP', result: 'Denied (78%)', biased: true, explanation: 'Denied despite same income — ZIP code penalizes the application.' },
      { prompt: '$40K income, wealthy ZIP', result: 'Approved (61%)', biased: true, explanation: 'Approved with lower income — wealthy ZIP inflates approval probability.' },
    ],
    customTestHandler: (input: string) => {
      const hasPoorZip = /\b(poor|low.income|48201|30301|disadvantaged|south side)\b/i.test(input);
      return {
        prompt: input,
        biased: hasPoorZip,
        result: hasPoorZip ? 'Denied' : 'Approved',
        explanation: hasPoorZip
          ? 'ZIP code triggered denial regardless of financial qualifications.'
          : 'Approved — location signals a favorable demographic to the model.',
      };
    },
    fixOptions: [
      { id: 'f1', label: 'Remove ZIP code from model', description: 'Don\'t let AI see location data at all', correct: true, impact: 'High: eliminates the proxy variable that encodes racial bias.' },
      { id: 'f2', label: 'Use only income and credit score', description: 'Focus on financial merit, not geography', correct: true, impact: 'High: decision based on relevant financial factors only.' },
      { id: 'f3', label: 'Add more data from poor ZIPs', description: 'Balance geographic distribution in training data', correct: false, impact: 'Partial: more data helps but doesn\'t remove the proxy variable. ZIP still acts as a racial proxy.' },
      { id: 'f4', label: 'Lower threshold for poor ZIPs', description: 'Manually compensate with different standards', correct: false, impact: 'Risky: differential standards may violate equal treatment regulations and create new fairness issues.' },
    ],
    realWorld: {
      title: 'Apple Card Lending',
      year: '2019',
      summary: 'Apple\'s credit card algorithm, built by Goldman Sachs, gave men up to 20x higher credit limits than women with identical financial profiles. Even Apple co-founder Steve Wozniak reported getting 10x his wife\'s limit.',
      lesson: 'Even tech giants ship biased algorithms. Regulatory investigations by the NY Department of Financial Services pushed for transparency in algorithmic lending decisions.',
    },
  },
  {
    id: 'school',
    title: 'The School Predictor',
    label: '[SCHOOL]',
    difficulty: 'intermediate',
    bandMin: 'B',
    description: 'An AI predicts student success — but is it predicting ability or privilege? Students from wealthy schools get high predictions while equally smart students from poor schools are labeled "at risk."',
    descriptionC: 'A predictive model uses socioeconomic proxies that conflate resource access with academic potential. School funding level and parent education are top features, encoding privilege as a predictor of merit.',
    biasType: 'Socioeconomic Bias',
    biasExplanation: 'The AI predicts grades based on school funding and parent education — measuring privilege, not potential. A brilliant kid at a poor school gets flagged "at risk" while an average kid at a rich school is marked "on track."',
    biasExplanationC: 'The model confounds academic potential with resource access. School funding correlates with outcomes because of resource advantages, not because students at funded schools have more innate ability. Using it as a feature creates a self-fulfilling prophecy.',
    visualizations: [
      { type: 'bar', title: 'Predicted Success by School Funding', items: [
        { label: 'High-Funded', value: 89, color: '#10B981' },
        { label: 'Medium', value: 61, color: '#F59E0B' },
        { label: 'Low-Funded', value: 28, color: '#EF4444' },
      ]},
      { type: 'bar', title: 'Actual Scores (Same Ability)', items: [
        { label: 'With Tutoring', value: 85, color: '#10B981' },
        { label: 'Without', value: 72, color: '#F59E0B' },
      ]},
    ],
    evidence: [
      { id: 's1', text: '89% predicted success for wealthy vs 28% for poor schools', category: 'outcome', biasRelevant: true },
      { id: 's2', text: 'School funding is the #1 feature AI uses', category: 'pattern', biasRelevant: true },
      { id: 's3', text: 'Transfer students gain 40% prediction boost by switching schools', category: 'outcome', biasRelevant: true },
      { id: 's4', text: 'Model has 85% overall accuracy', category: 'data', biasRelevant: false },
      { id: 's5', text: 'Parent education level is a model feature', category: 'data', biasRelevant: true },
      { id: 's6', text: 'AI decides who gets extra resources — self-fulfilling prophecy', category: 'pattern', biasRelevant: true },
    ],
    presetTests: [
      { prompt: '90th percentile aptitude, low-funded school', result: 'At Risk (38%)', biased: true, explanation: 'High ability student penalized by school\'s funding level — potential ignored.' },
      { prompt: '60th percentile aptitude, high-funded school', result: 'On Track (82%)', biased: true, explanation: 'Average ability boosted by school resources — privilege inflates prediction.' },
      { prompt: 'Same student, different school', result: 'Prediction changes 40+ points', biased: true, explanation: 'Identical student gets wildly different predictions based solely on school attended.' },
    ],
    customTestHandler: (input: string) => {
      const isDisadvantaged = /\b(poor|low.fund|rural|disadvantaged|free lunch)\b/i.test(input);
      return {
        prompt: input,
        biased: isDisadvantaged,
        result: isDisadvantaged ? 'At Risk (low confidence)' : 'On Track (high confidence)',
        explanation: isDisadvantaged
          ? 'AI focuses on school resources, not student ability.'
          : 'Favorable school profile inflates prediction.',
      };
    },
    fixOptions: [
      { id: 'f1', label: 'Remove school funding and parent education', description: 'Focus on student effort, aptitude, and growth metrics instead of socioeconomic proxies', correct: true, impact: 'High: removes the main socioeconomic proxy features.' },
      { id: 'f2', label: 'Use AI to allocate MORE resources to struggling schools', description: 'Reverse the prediction — use it to help, not to label', correct: true, impact: 'Positive: transforms the tool from gate-keeping to resource allocation.' },
      { id: 'f3', label: 'Only use AI in wealthy schools', description: 'Avoid bias by limiting scope', correct: false, impact: 'Harmful: denies the tool to students who might benefit most from intervention.' },
      { id: 'f4', label: 'Weight parent education more', description: 'Strong predictor of outcomes', correct: false, impact: 'Harmful: doubles down on socioeconomic bias — punishes students for factors outside their control.' },
    ],
    realWorld: {
      title: 'UK A-Level Algorithm',
      year: '2020',
      summary: 'During COVID, the UK used an algorithm for exam grades that systematically downgraded students from historically low-performing (often disadvantaged) schools while upgrading private school students. Nearly 40% of grades were lowered.',
      lesson: 'Mass protests led to a U-turn. Algorithmic "fairness" can perpetuate inequality when it encodes historical disadvantage as a predictor of future performance.',
    },
  },
  {
    id: 'music',
    title: 'The Music Recommender',
    label: '[MUSIC]',
    difficulty: 'intermediate',
    bandMin: 'B',
    description: 'A music app keeps recommending the same kind of music. Users who like niche genres get pushed toward mainstream pop, while independent artists get buried.',
    descriptionC: 'A recommendation engine exhibits filter bubble effects and popularity bias due to engagement-optimized training. The feedback loop amplifies mainstream content while suppressing discovery of diverse artists.',
    biasType: 'Popularity & Filter Bias', // [CR-6F-B8] Fixed HTML entity
    biasExplanation: 'The AI only recommends popular songs from big artists. Independent artists and niche genres get buried, not because they\'re bad, but because the AI is trained to maximize listening time — and popular songs are a safe bet.',
    biasExplanationC: 'The model optimizes for engagement, creating a feedback loop favoring already-popular content. New and diverse artists cannot accumulate the play counts needed to enter recommendation pools, creating a winner-take-all dynamic.',
    visualizations: [
      { type: 'pie', title: 'Recommendation Distribution', items: [
        { label: 'Top 1% Artists', value: 78, color: '#EF4444' },
        { label: 'Mid-tier', value: 17, color: '#F59E0B' },
        { label: 'Independent', value: 5, color: '#10B981' },
      ]},
      { type: 'bar', title: 'Genre Recs vs Catalog', items: [
        { label: 'Pop', value: 60, color: '#EC4899' },
        { label: 'Hip-Hop', value: 25, color: '#8B5CF6' },
        { label: 'Jazz', value: 3, color: '#F59E0B' },
        { label: 'World', value: 2, color: '#10B981' },
      ]},
    ],
    evidence: [
      { id: 'mu1', text: 'Top 1% artists get 78% of recommendations', category: 'outcome', biasRelevant: true },
      { id: 'mu2', text: 'Independent artists get 5% despite being 60% of catalog', category: 'outcome', biasRelevant: true },
      { id: 'mu3', text: 'Niche listeners pushed toward mainstream within 2 weeks', category: 'pattern', biasRelevant: true },
      { id: 'mu4', text: 'Algorithm optimizes for total listening time', category: 'data', biasRelevant: true },
      { id: 'mu5', text: 'Popular songs generate more ad revenue', category: 'data', biasRelevant: false },
      { id: 'mu6', text: 'Feedback loop: recommended = more listens = more recommended', category: 'pattern', biasRelevant: true },
    ],
    presetTests: [
      { prompt: 'User who loves jazz piano', result: 'Here\'s some... Pop Piano Covers', biased: true, explanation: 'Niche preference redirected toward mainstream — engagement optimization overrides user taste.' },
      { prompt: 'User who likes K-pop', result: 'More from the SAME 5 groups', biased: true, explanation: 'Filter bubble: only recommends the most popular artists in the genre, ignoring diverse options.' },
      { prompt: 'User who likes chart-toppers', result: 'More hits!', biased: false, explanation: 'Works well for mainstream tastes — the algorithm is optimized for this exact use case.' },
    ],
    customTestHandler: (input: string) => {
      const isNiche = /\b(jazz|indie|folk|classical|world|latin|african|experimental)\b/i.test(input);
      return {
        prompt: input,
        biased: isNiche,
        result: isNiche ? 'Popular alternatives instead' : 'Great recommendations!',
        explanation: isNiche
          ? 'AI steered away from niche preference toward mainstream content.'
          : 'Mainstream preference aligns with the algorithm\'s optimization target.',
      };
    },
    fixOptions: [
      { id: 'f1', label: 'Add "discovery" slot in playlists', description: 'Reserve 20% for new and diverse artists the user hasn\'t heard', correct: true, impact: 'Positive: creates exposure for independent artists without disrupting user experience.' },
      { id: 'f2', label: 'Optimize for variety, not just engagement', description: 'Reward diverse listening, not just listening time', correct: true, impact: 'High: changes the core objective from engagement to satisfaction and discovery.' },
      { id: 'f3', label: 'Only recommend what\'s popular', description: 'Popular = good, right?', correct: false, impact: 'Harmful: amplifies the filter bubble and kills music diversity.' },
      { id: 'f4', label: 'Let artists pay for recommendations', description: 'Pay-to-play model', correct: false, impact: 'Harmful: favors wealthy labels over independent artists, deepening inequality.' },
    ],
    realWorld: {
      title: 'Spotify\'s Artist Equity Problem',
      year: '2023',
      summary: 'Analysis showed the top 0.8% of artists received over 90% of all streams on the platform, while millions of artists earned almost nothing. The algorithmic recommendation system reinforced this concentration.',
      lesson: 'Spotify introduced "Discovery Mode" to help surface smaller artists, acknowledging that pure engagement optimization creates winner-take-all dynamics that hurt musical diversity.',
    },
  },
  {
    id: 'medical',
    title: 'The Medical AI',
    label: '[MEDICAL]',
    difficulty: 'advanced',
    bandMin: 'C',
    description: 'A health AI is better at diagnosing some groups than others. It has 94% accuracy for white male patients but only 58% for Black female patients — a gap that could cost lives.',
    descriptionC: 'A clinical decision model trained on one demographic group exhibits significant performance degradation for underrepresented populations. Accuracy drops from 94% to 58% across demographic intersections.',
    biasType: 'Clinical Data Bias',
    biasExplanation: 'The medical AI was trained mostly on one patient group (white males). It misses symptoms that present differently in women or people of different ethnicities. This isn\'t just unfair — it\'s dangerous.',
    biasExplanationC: 'Training overrepresented white male patients, encoding their symptom presentation as the default clinical profile. The model fails on underrepresented demographics where symptoms present atypically relative to the training distribution.',
    visualizations: [
      { type: 'bar', title: 'Diagnostic Accuracy by Demographic', items: [
        { label: 'White Men', value: 94, color: '#10B981' },
        { label: 'White Women', value: 82, color: '#3B82F6' },
        { label: 'Black Men', value: 71, color: '#F97316' },
        { label: 'Black Women', value: 58, color: '#EF4444' },
      ]},
      { type: 'pie', title: 'Training Data Demographics', items: [
        { label: 'White Male', value: 62, color: '#3B82F6' },
        { label: 'White Female', value: 20, color: '#8B5CF6' },
        { label: 'Black Male', value: 10, color: '#F97316' },
        { label: 'Black Female', value: 8, color: '#EF4444' },
      ]},
    ],
    evidence: [
      { id: 'md1', text: '94% accuracy for white men, only 58% for Black women', category: 'outcome', biasRelevant: true },
      { id: 'md2', text: 'Training data 62% white male patients', category: 'data', biasRelevant: true },
      { id: 'md3', text: 'Heart attack symptoms in women differ — AI misses them', category: 'pattern', biasRelevant: true },
      { id: 'md4', text: 'Skin condition detection fails on darker skin', category: 'pattern', biasRelevant: true },
      { id: 'md5', text: 'AI uses pain score that underestimates pain in Black patients', category: 'data', biasRelevant: true },
      { id: 'md6', text: 'Validated at 3 major hospitals', category: 'data', biasRelevant: false },
    ],
    presetTests: [
      { prompt: 'White male, chest pain, sweating', result: 'Heart Attack — 91% confidence -> ER', biased: false, explanation: 'Classic presentation matches training data well — high confidence, correct diagnosis.' },
      { prompt: 'Black woman, jaw pain, nausea, fatigue', result: 'Anxiety — 67% confidence -> Rest', biased: true, explanation: 'Atypical heart attack symptoms in women missed — potentially fatal misdiagnosis.' },
      { prompt: 'Skin rash on dark skin', result: 'Inconclusive — 42% confidence', biased: true, explanation: 'Model cannot confidently classify skin conditions on darker skin tones due to training data gaps.' },
    ], // [CR-6F-B11] Fixed -> arrows (were &gt; entities)
    customTestHandler: (input: string) => {
      const isMinority = /\b(black|woman|female|dark|elderly|hispanic|asian|atypical)\b/i.test(input);
      return {
        prompt: input,
        biased: isMinority,
        result: isMinority ? 'Low confidence — further testing needed' : 'Well-characterized — high confidence',
        explanation: isMinority
          ? 'Lower confidence for underrepresented demographics in training data.'
          : 'Well-represented demographic produces confident, accurate diagnosis.',
      };
    },
    fixOptions: [
      { id: 'f1', label: 'Diversify clinical training data', description: 'Equal representation across all demographics', correct: true, impact: 'Critical: addresses root cause. Diverse clinical data improves accuracy for all groups.' },
      { id: 'f2', label: 'Flag low-confidence for human review', description: 'Escalate uncertain cases to human doctors', correct: true, impact: 'High: prevents AI from making critical decisions when it is uncertain — human-in-the-loop safety net.' },
      { id: 'f3', label: 'Lower confidence threshold for all', description: 'Be less certain about everything', correct: false, impact: 'Harmful: reduces diagnostic utility for everyone. Treats the symptom, not the cause.' },
      { id: 'f4', label: 'Don\'t use AI for minorities', description: 'Only deploy where it works well', correct: false, impact: 'Harmful: denies AI-assisted healthcare to the populations that may need it most. Creates a two-tier system.' },
    ],
    realWorld: {
      title: 'Pulse Oximeter Racial Bias',
      year: '2020',
      summary: 'During COVID, pulse oximeters were found to be significantly less accurate on darker skin, giving falsely elevated readings. This led to delayed treatment for Black patients, contributing to worse outcomes.',
      lesson: 'Medical devices trained and calibrated on one demographic can be a matter of life and death. The FDA launched investigations and now requires diverse testing populations.',
    },
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 }; // [CR-6F-B9] Fixed generic syntax

// ================================================================
// MAIN COMPONENT
// ================================================================

export function BiasDetectiveGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  // Phase state
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [completedCases, setCompletedCases] = useState<string[]>([]);
  const [collectedEvidence, setCollectedEvidence] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestInput[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [selectedFixes, setSelectedFixes] = useState<string[]>([]);
  const [showRealWorld, setShowRealWorld] = useState(false);

  // Red background particles
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 6 + 4,
    })), []);

  // Derived state
  const activeCase = activeCaseId ? CASES.find(c => c.id === activeCaseId) : null;
  const rank = getRank(completedCases.length);
  const availableCases = useMemo(() =>
    CASES.filter(c => BAND_ORDER[c.bandMin] <= BAND_ORDER[ageBand]),
    [ageBand]
  );

  const relevantEvidenceCount = activeCase
    ? activeCase.evidence.filter(e => e.biasRelevant && collectedEvidence.includes(e.id)).length
    : 0;
  const totalRelevant = activeCase
    ? activeCase.evidence.filter(e => e.biasRelevant).length
    : 0;

  // [v3] Calculate scale weights from collected evidence
  // [CR-6F-B5] Updated to 2-arg call matching Part A fix (CR-6F-A4)
  const scaleWeights = useMemo(() => {
    if (!activeCase) return { biasWeight: 0, fairWeight: 0, isBalanced: true };
    return calculateScaleWeights(
      collectedEvidence,
      activeCase.evidence
    );
  }, [activeCase, collectedEvidence]);

  // Handlers
  function startCase(caseId: string) {
    setActiveCaseId(caseId);
    setCollectedEvidence([]);
    setTestResults([]);
    setSelectedFixes([]);
    setCustomInput('');
    setShowRealWorld(false);
    setPhase('investigate');
  }

  function collectEvidence(id: string) {
    if (collectedEvidence.includes(id)) return;
    setCollectedEvidence(prev => [...prev, id]);
    game.updateScore(3);
  }

  function runCustomTest() {
    if (!customInput.trim() || !activeCase) return;
    setTestResults(prev => [...prev, activeCase.customTestHandler(customInput.trim())]);
    setCustomInput('');
    game.updateScore(5);
  }

  function toggleFix(id: string) {
    setSelectedFixes(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }

  function submitReport() {
    if (!activeCase) return;
    const correctFixes = activeCase.fixOptions.filter(f => f.correct).map(f => f.id);
    const score = selectedFixes.filter(id => correctFixes.includes(id)).length * 10
      - selectedFixes.filter(id => !correctFixes.includes(id)).length * 5;
    game.updateScore(Math.max(0, score) + relevantEvidenceCount * 2);
    if (!completedCases.includes(activeCase.id)) {
      setCompletedCases(prev => [...prev, activeCase.id]);
    }
    game.advanceRound();
    game.completeGame();
    setPhase('report');
  }

  // SVG Bar Chart
  function BarChart({ viz }: { viz: DataViz }) {
    const maxVal = Math.max(...viz.items.map(i => i.value));
    const barW = Math.min(50, 200 / viz.items.length);
    const chartW = viz.items.length * (barW + 12) + 20;
    return (
      <div>
        <p className="font-data text-[9px] text-white/25 uppercase tracking-wider mb-1">
          {viz.title}
        </p>
        <svg width={chartW} height={125} viewBox={`0 0 ${chartW} 125`}>
          {viz.items.map((item, i) => {
            const h = (item.value / maxVal) * 90;
            const x = 10 + i * (barW + 12);
            return (
              <g key={i}>
                <rect x={x} y={100 - h} width={barW} height={h} rx={3}
                  fill={item.color} opacity={0.85}>
                  <animate attributeName="height" from="0" to={h}
                    dur="0.6s" fill="freeze" begin={`${i * 0.1}s`} />
                  <animate attributeName="y" from="100" to={100 - h}
                    dur="0.6s" fill="freeze" begin={`${i * 0.1}s`} />
                </rect>
                <text x={x + barW / 2} y={100 - h - 4}
                  textAnchor="middle" fill={item.color}
                  fontSize={9} fontWeight="bold">{item.value}%</text>
                <text x={x + barW / 2} y={112}
                  textAnchor="middle" fill="rgba(255,255,255,0.3)"
                  fontSize={7}>{item.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // SVG Pie Chart
  function PieChartViz({ viz }: { viz: DataViz }) {
    const total = viz.items.reduce((s, i) => s + i.value, 0);
    let cum = 0;
    const cx = 50, cy = 50, r = 40;
    return (
      <div>
        <p className="font-data text-[9px] text-white/25 uppercase tracking-wider mb-1">
          {viz.title}
        </p>
        <div className="flex items-center gap-3">
          <svg width={100} height={100} viewBox="0 0 100 100">
            {viz.items.map((item, i) => {
              const pct = item.value / total;
              const s = cum * 2 * Math.PI;
              cum += pct;
              const e = cum * 2 * Math.PI;
              const x1 = cx + r * Math.cos(s - Math.PI / 2);
              const y1 = cy + r * Math.sin(s - Math.PI / 2);
              const x2 = cx + r * Math.cos(e - Math.PI / 2);
              const y2 = cy + r * Math.sin(e - Math.PI / 2);
              return (
                <path key={i}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`}
                  fill={item.color} opacity={0.8}
                  stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
              );
            })}
          </svg>
          <div className="space-y-1">
            {viz.items.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }} />
                <span className="font-body text-[9px] text-white/40">
                  {item.label}: {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // JSX RENDER CONTINUES IN PART C
  // Paste Part C code directly after this line (same file)

  // FULL JSX RENDER — All 7 phases
  return (
    <GameShell gameId="bias-detective" title="Bias Detective"
      worldNumber={6} worldColor="#EF4444" totalRounds={6}>
      <div className="h-full flex flex-col relative overflow-hidden">

        {/* Red Particle Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-red-900/8
            via-transparent to-transparent" />
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: p.size, height: p.size,
                background: `radial-gradient(circle,
                  rgba(239,68,68,${0.15 + p.size * 0.06}), transparent)`,
              }}
              animate={{
                y: [0, -12 - p.size * 4, 0],
                opacity: [0.1, 0.35, 0.1],
              }}
              transition={{
                duration: p.duration, delay: p.delay,
                repeat: Infinity, ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Chrome Bezel */}
        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(239,68,68,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(239,68,68,0.1)',
            }}>

            <div className="h-[2px] w-full bg-gradient-to-r
              from-transparent via-red-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 md:p-6">
              <AnimatePresence mode="wait">

                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center
                      justify-center text-center space-y-5">

                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(239,68,68,0.15)',
                          '0 0 40px rgba(239,68,68,0.25)',
                          '0 0 20px rgba(239,68,68,0.15)',
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="inline-flex items-center gap-2 px-4 py-2
                        rounded-full border border-red-500/20"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.04))',
                      }}>
                      <Scale className="w-4 h-4 text-red-400" />
                      <span className="font-data text-data-sm text-red-400
                        uppercase tracking-widest">
                        Lab 6: AI & Ethics
                      </span>
                    </motion.div>

                    <h2 className="font-display text-2xl md:text-3xl
                      font-bold text-white">Bias Detective
                    </h2>

                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Investigate unfair AI systems. Collect evidence.
                      Fix the bias.
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {['AI Bias', 'Fairness', 'Data Ethics', 'Mitigation']
                        .map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-lg
                          bg-red-500/10 border border-red-500/20
                          font-body text-[10px] text-red-300">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5
                      rounded-lg bg-white/5">
                      <span className="font-display text-xs font-bold"
                        style={{ color: rank.color }}>
                        {rank.title}
                      </span>
                      <span className="font-body text-[9px] text-white/20">
                        ({completedCases.length}/{availableCases.length} cases)
                      </span>
                    </div>

                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl
                        font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>
                      Start Investigating
                      <Search className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* LEARN */}
                {phase === 'learn' && (
                  <motion.div key="learn"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center
                      justify-center space-y-5">

                    <GraduationCap className="w-6 h-6 text-red-400" />
                    <h3 className="font-display text-lg font-bold
                      text-white">
                      Understanding AI Bias
                    </h3>
                    <p className="font-body text-xs text-white/40">
                      {learnIdx + 1} of {LEARN_CARDS.length}
                    </p>

                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5
                          border border-red-500/20 text-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(220,38,38,0.02))',
                        }}>
                        <span className="text-2xl font-bold text-red-300">
                          {LEARN_CARDS[learnIdx].label}
                        </span>
                        <h4 className="font-display text-base font-bold
                          text-red-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60
                          mt-2 leading-relaxed">
                          {ageBand === 'C'
                            ? LEARN_CARDS[learnIdx].bodyC
                            : LEARN_CARDS[learnIdx].body}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <motion.button
                      onClick={() => {
                        if (learnIdx < LEARN_CARDS.length - 1)
                          setLearnIdx(learnIdx + 1);
                        else setPhase('cases');
                      }}
                      className="w-full max-w-md py-3 rounded-xl
                        font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1
                        ? 'Next' : 'Choose a Case!'}
                    </motion.button>
                    <button onClick={() => setPhase('cases')}
                      className="font-body text-xs text-white/20
                        hover:text-white/40">
                      Skip intro
                    </button>
                  </motion.div>
                )}

                {/* CASE SELECT */}
                {phase === 'cases' && (
                  <motion.div key="cases"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4">

                    <div className="text-center">
                      <FileText className="w-6 h-6 text-red-400
                        mx-auto mb-2" />
                      <h3 className="font-display text-lg font-bold
                        text-white">Case Files</h3>
                      <div className="flex items-center gap-2
                        justify-center mt-1">
                        <span className="font-display text-xs font-bold"
                          style={{ color: rank.color }}>
                          {rank.title}
                        </span>
                        <span className="font-body text-[9px] text-white/20">
                          {completedCases.length}/{availableCases.length} solved
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3
                      max-w-2xl mx-auto">
                      {availableCases.map(c => {
                        const isDone = completedCases.includes(c.id);
                        return (
                          <motion.button key={c.id}
                            onClick={() => startCase(c.id)}
                            className={`p-4 rounded-xl border text-left
                              transition-all ${isDone
                              ? 'border-red-500/30 bg-red-500/5'
                              : 'border-white/10 bg-white/[0.02] hover:border-red-500/20'
                            }`}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold
                                text-red-300">{c.label}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-sm
                                    font-bold text-white">{c.title}</p>
                                  {isDone && <CheckCircle2
                                    className="w-3.5 h-3.5 text-red-400" />}
                                </div>
                                <p className="font-body text-[11px]
                                  text-white/40 mt-0.5">
                                  {c.description.slice(0, 80)}...
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-1.5 py-0.5 rounded
                                bg-red-500/10 text-red-400 font-data
                                text-[9px]">{c.biasType}</span>
                              <span className={`px-1.5 py-0.5 rounded
                                text-[9px] font-bold ${
                                c.difficulty === 'beginner'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : c.difficulty === 'intermediate'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              }`}>{c.difficulty}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* INVESTIGATE + [v3] 3D SCALES */}
                {phase === 'investigate' && activeCase && (
                  <motion.div key="investigate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4">

                    <div className="flex items-center gap-2">
                      <span className="text-xl">{activeCase.label}</span>
                      <div className="flex-1">
                        <h3 className="font-display text-sm font-bold
                          text-white">{activeCase.title}</h3>
                        <p className="font-body text-[10px] text-white/30">
                          {ageBand === 'C'
                            ? activeCase.descriptionC
                            : activeCase.description}
                        </p>
                      </div>
                      <span className="font-data text-[10px] text-red-400">
                        {relevantEvidenceCount}/{totalRelevant} clues
                      </span>
                    </div>

                    {/* [v3] 3D Justice Scales — responds to evidence */}
                    <div className="w-full h-32 md:h-40 rounded-xl
                      overflow-hidden"
                      style={{ background: 'rgba(0,0,0,0.2)' }}
                      aria-hidden="true">
                      <Canvas
                          camera={{ position: [0, 1.5, 3.5], fov: 45 }}
                          style={{ background: 'transparent' }}
                          gl={{ alpha: true, antialias: true }}
                          frameloop="always">
                          {/* [CR-6F-C2] frameloop="always" for spring physics + particles */}
                          <BiasScales3DComponent
                            biasWeight={scaleWeights.biasWeight}
                            fairWeight={scaleWeights.fairWeight}
                            isBalanced={scaleWeights.isBalanced}
                            caseColor="#EF4444"
                          />
                        </Canvas>
                    </div>

                    {/* Data Visualizations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeCase.visualizations.map((viz, i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {viz.type === 'bar'
                            ? <BarChart viz={viz} />
                            : <PieChartViz viz={viz} />}
                        </div>
                      ))}
                    </div>

                    {/* Evidence Board */}
                    <div className="rounded-xl p-3 border
                      border-red-500/15"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.03), rgba(0,0,0,0.2))',
                        backgroundImage: 'radial-gradient(rgba(239,68,68,0.03) 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}>
                      <p className="font-display text-xs font-bold
                        text-red-400 mb-2 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Evidence Board
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2
                        gap-2">
                        {activeCase.evidence.map(ev => {
                          const isCollected =
                            collectedEvidence.includes(ev.id);
                          return (
                            <motion.button key={ev.id}
                              onClick={() => collectEvidence(ev.id)}
                              className={`p-2.5 rounded-lg border
                                text-left transition-all ${isCollected
                                ? ev.biasRelevant
                                  ? 'border-red-500/30 bg-red-500/8'
                                  : 'border-white/20 bg-white/5'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                              }`}
                              whileTap={{ scale: 0.97 }}
                              aria-label={`Evidence: ${ev.text}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-sm flex-shrink-0">
                                  {isCollected
                                    ? (ev.biasRelevant ? '[!]' : '[.]')
                                    : '[?]'}
                                </span>
                                <div>
                                  <p className={`font-body text-[11px]
                                    ${isCollected
                                    ? 'text-white/70'
                                    : 'text-white/40'}`}>
                                    {ev.text}
                                  </p>
                                  {isCollected && (
                                    <span className={`font-data text-[8px]
                                      uppercase tracking-wider ${
                                      ev.category === 'data'
                                        ? 'text-blue-400'
                                        : ev.category === 'outcome'
                                        ? 'text-amber-400'
                                        : 'text-purple-400'
                                    }`}>
                                      {ev.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isCollected && ev.biasRelevant && (
                                <div className="mt-1.5 h-[2px] w-full
                                  rounded bg-gradient-to-r
                                  from-red-500/40 to-transparent" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <motion.button
                      onClick={() => setPhase('testlab')}
                      disabled={relevantEvidenceCount < 3}
                      className="w-full py-3 rounded-xl font-display
                        font-bold text-sm text-white disabled:opacity-30"
                      style={{
                        background: relevantEvidenceCount >= 3
                          ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                          : 'rgba(255,255,255,0.05)',
                      }}
                      whileHover={
                        relevantEvidenceCount >= 3
                          ? { scale: 1.02 } : {}
                      }
                      whileTap={
                        relevantEvidenceCount >= 3
                          ? { scale: 0.98 } : {}
                      }>
                      {relevantEvidenceCount >= 3
                        ? 'Proceed to Test Lab'
                        : `Collect ${3 - relevantEvidenceCount} more clues`}
                    </motion.button>
                  </motion.div>
                )}

                {/* TEST LAB */}
                {phase === 'testlab' && activeCase && (
                  <motion.div key="testlab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4">

                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-red-400" />
                      <h3 className="font-display text-sm font-bold
                        text-white">
                        Test Lab: {activeCase.title}
                      </h3>
                    </div>
                    <p className="font-body text-xs text-white/40">
                      Test the AI with different inputs to confirm bias.
                    </p>

                    <div className="space-y-2">
                      {activeCase.presetTests.map((t, i) => (
                        <div key={i}
                          className={`rounded-lg p-3 border ${
                            t.biased
                              ? 'border-red-500/20 bg-red-500/5'
                              : 'border-emerald-500/20 bg-emerald-500/5'
                          }`}>
                          <p className="font-body text-xs text-white/50">
                            Input: <span className="text-white/70">
                              {t.prompt}
                            </span>
                          </p>
                          <p className="font-display text-sm font-bold mt-1"
                            style={{
                              color: t.biased ? '#EF4444' : '#10B981',
                            }}>
                            {t.result}
                          </p>
                          <p className="font-body text-[10px]
                            text-white/30 mt-0.5">
                            {t.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl p-3 border
                      border-white/10 bg-white/[0.02]">
                      <p className="font-display text-xs font-bold
                        text-white mb-2">
                        Try Your Own Test:
                      </p>
                      <div className="flex gap-2">
                        <input type="text"
                          value={customInput}
                          onChange={e => setCustomInput(e.target.value)}
                          onKeyDown={e =>
                            e.key === 'Enter' && runCustomTest()
                          }
                          placeholder="Type a test input..."
                          className="flex-1 px-3 py-2 rounded-lg
                            bg-white/5 border border-white/10
                            text-white text-sm font-body
                            placeholder:text-white/20
                            focus:outline-none focus:border-red-500/30"
                          aria-label="Custom test input" />
                        <motion.button
                          onClick={runCustomTest}
                          disabled={!customInput.trim()}
                          className="px-4 py-2 rounded-lg font-display
                            text-xs font-bold text-white
                            disabled:opacity-30"
                          style={{
                            background:
                              'linear-gradient(135deg, #EF4444, #DC2626)',
                          }}
                          whileTap={{ scale: 0.95 }}>
                          Test
                        </motion.button>
                      </div>
                      {testResults.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {testResults.map((t, i) => (
                            <div key={i}
                              className={`rounded-lg p-2 ${
                                t.biased
                                  ? 'bg-red-500/8'
                                  : 'bg-emerald-500/8'
                              }`}>
                              <p className="font-body text-[10px]
                                text-white/50">
                                You tested: {t.prompt}
                              </p>
                              <p className="font-display text-xs font-bold"
                                style={{
                                  color: t.biased ? '#EF4444' : '#10B981',
                                }}>
                                {t.result}
                              </p>
                              <p className="font-body text-[9px]
                                text-white/25">
                                {t.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <motion.button
                      onClick={() => setPhase('fix')}
                      className="w-full py-3 rounded-xl font-display
                        font-bold text-sm text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>
                      Fix the AI
                    </motion.button>
                  </motion.div>
                )}

                {/* FIX THE AI */}
                {phase === 'fix' && activeCase && (
                  <motion.div key="fix"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4">

                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-red-400" />
                      <h3 className="font-display text-sm font-bold
                        text-white">
                        Fix the AI: {activeCase.title}
                      </h3>
                    </div>

                    <div className="rounded-xl p-3 border
                      border-red-500/15 bg-red-500/3">
                      <p className="font-body text-xs text-white/60">
                        <span className="font-bold text-red-400">
                          Bias found:
                        </span>{' '}
                        {ageBand === 'C'
                          ? activeCase.biasExplanationC
                          : activeCase.biasExplanation}
                      </p>
                    </div>

                    <p className="font-body text-xs text-white/40">
                      Select the best fix(es):
                    </p>

                    <div className="space-y-2">
                      {activeCase.fixOptions.map(fix => (
                        <motion.button key={fix.id}
                          onClick={() => toggleFix(fix.id)}
                          className={`w-full p-3 rounded-xl border
                            text-left transition-all ${
                            selectedFixes.includes(fix.id)
                              ? 'border-red-500/40 bg-red-500/10'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                          whileTap={{ scale: 0.98 }}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md border-2
                              flex items-center justify-center ${
                              selectedFixes.includes(fix.id)
                                ? 'border-red-400 bg-red-500/20'
                                : 'border-white/20'
                            }`}>
                              {selectedFixes.includes(fix.id) && (
                                <CheckCircle2
                                  className="w-3 h-3 text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-display text-xs
                                font-bold text-white">
                                {fix.label}
                              </p>
                              <p className="font-body text-[10px]
                                text-white/30">
                                {fix.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      onClick={submitReport}
                      disabled={selectedFixes.length === 0}
                      className="w-full py-3 rounded-xl font-display
                        font-bold text-sm text-white
                        disabled:opacity-30"
                      style={{
                        background: selectedFixes.length > 0
                          ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                          : 'rgba(255,255,255,0.05)',
                      }}
                      whileHover={
                        selectedFixes.length > 0
                          ? { scale: 1.02 } : {}
                      }
                      whileTap={
                        selectedFixes.length > 0
                          ? { scale: 0.98 } : {}
                      }>
                      Submit Report
                    </motion.button>
                  </motion.div>
                )}

                {/* REPORT */}
                {phase === 'report' && activeCase && (
                  <motion.div key="report"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center
                      justify-center text-center space-y-4">

                    {/* CASE CLOSED stamp */}
                    <motion.div
                      initial={{ scale: 3, rotate: -15, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{
                        type: 'spring', damping: 12, stiffness: 200,
                      }}
                      className="px-6 py-3 border-4 border-red-500
                        rounded-lg"
                      style={{ transform: 'rotate(-3deg)' }}>
                      <span className="font-display text-xl
                        font-black text-red-500 tracking-wider">
                        CASE CLOSED
                      </span>
                    </motion.div>

                    <h3 className="font-display text-base font-bold
                      text-white">
                      {activeCase.title}
                    </h3>
                    <p className="font-body text-xs text-red-400
                      font-bold">
                      {activeCase.biasType}
                    </p>

                    {/* Fix results */}
                    <div className="rounded-xl p-4 max-w-md w-full text-left space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="font-display text-xs font-bold
                        text-white">Your Fixes:</p>
                      {selectedFixes.map(fid => {
                        const fix = activeCase.fixOptions
                          .find(f => f.id === fid);
                        if (!fix) return null;
                        return (
                          <div key={fid}
                            className={`p-2 rounded-lg ${
                              fix.correct
                                ? 'bg-emerald-500/10 border border-emerald-500/20'
                                : 'bg-red-500/10 border border-red-500/20'
                            }`}>
                            <p className="font-body text-xs
                              text-white/70">
                              {fix.correct
                                ? '[CORRECT] ' : '[INCORRECT] '}
                              {fix.label}
                            </p>
                            <p className="font-body text-[10px]
                              text-white/30">
                              {fix.impact}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats */}
                    <div className="rounded-xl p-3
                      max-w-md w-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="grid grid-cols-3 gap-3
                        text-center">
                        <div>
                          <p className="font-data text-lg font-bold
                            text-red-400">
                            {relevantEvidenceCount}
                          </p>
                          <p className="font-body text-[9px]
                            text-white/30">Clues</p>
                        </div>
                        <div>
                          <p className="font-data text-lg font-bold
                            text-blue-400">
                            {activeCase.presetTests.length
                              + testResults.length}
                          </p>
                          <p className="font-body text-[9px]
                            text-white/30">Tests</p>
                        </div>
                        <div>
                          <p className="font-data text-lg font-bold
                            text-amber-400">
                            {selectedFixes.filter(id =>
                              activeCase.fixOptions
                                .find(f => f.id === id)?.correct
                            ).length}
                          </p>
                          <p className="font-body text-[9px]
                            text-white/30">Good Fixes</p>
                        </div>
                      </div>
                    </div>

                    {/* Rank up notification */}
                    {(() => {
                      const newR = getRank(completedCases.length);
                      const oldR = getRank(completedCases.length - 1);
                      return newR.title !== oldR.title ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl p-3 border
                            border-amber-500/20 max-w-md w-full"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))',
                          }}>
                          <p className="font-display text-xs
                            font-bold text-amber-400">
                            Rank Up!
                          </p>
                          <p className="font-body text-sm
                            text-white/60">
                            {newR.label} {newR.title}
                          </p>
                        </motion.div>
                      ) : null;
                    })()}

                    {/* This Really Happened */}
                    <motion.button
                      onClick={() => setShowRealWorld(!showRealWorld)}
                      className="flex items-center gap-2 px-4 py-2
                        rounded-xl bg-white/5 border border-white/10
                        max-w-md w-full"
                      whileHover={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      }}>
                      <BookOpen className="w-4 h-4 text-red-400" />
                      <span className="font-display text-xs font-bold
                        text-white">
                        This Really Happened
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 text-white/20 ml-auto
                          transition-transform ${
                          showRealWorld ? 'rotate-90' : ''
                        }`} />
                    </motion.button>

                    <AnimatePresence>
                      {showRealWorld && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="max-w-md w-full overflow-hidden">
                          <div className="rounded-xl p-4 border
                            border-red-500/15 text-left"
                            style={{
                              background: 'rgba(239,68,68,0.03)',
                            }}>
                            <div className="flex items-center
                              gap-2 mb-2">
                              <span className="font-display text-xs
                                font-bold text-red-400">
                                {activeCase.realWorld.title}
                              </span>
                              <span className="font-mono text-[9px]
                                text-white/20">
                                {activeCase.realWorld.year}
                              </span>
                            </div>
                            <p className="font-body text-xs
                              text-white/50 leading-relaxed">
                              {activeCase.realWorld.summary}
                            </p>
                            <p className="font-body text-[11px]
                              text-red-400/70 mt-2 italic">
                              Lesson: {activeCase.realWorld.lesson}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Next Case button */}
                    <motion.button
                      onClick={() => setPhase('cases')}
                      className="w-full max-w-md py-3 rounded-xl
                        font-display font-bold text-sm text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>
                      Next Case
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r
              from-transparent via-red-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
