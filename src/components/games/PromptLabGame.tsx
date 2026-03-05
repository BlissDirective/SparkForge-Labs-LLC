// ================================================================
// PROMPT LAB V2 — Lab 4 Flagship (Complete Rewrite)
// ================================================================
// Chat with Claude via API. Holographic UI, expanded
// template library, multi-dimensional prompt scoring,
// prompt engineering tutorials, guided challenges.
// Teaches: prompt engineering, temperature/creativity,
// few-shot learning, chain-of-thought, constraints.
// ================================================================

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useChildStore } from '@/stores/childStore';
import { useGameStore } from '@/stores/gameStore';
import {
  Send, BookOpen, Star, AlertTriangle,
  ChevronRight, Lightbulb, GraduationCap,
  MessageSquare, Target, Copy, Check,
  Thermometer, ArrowRight,
} from 'lucide-react';

// ================================================================
// TYPES
// ================================================================

type Phase = 'welcome' | 'learn' | 'sandbox' | 'challenge' | 'report';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  score?: PromptScore;
  timestamp?: number;
}

interface PromptScore {
  specificity: number;
  clarity: number;
  creativity: number;
  constraints: number;
  technique: number;
  total: number;
  tips: string[];
}

interface PromptChallenge {
  id: string;
  title: string;
  emoji: string;
  description: string;
  goal: string;
  hint: string;
  starterPrompt?: string;
  checkFn: (response: string, prompt: string) => { passed: boolean; feedback: string };
  bandMin: 'A' | 'B' | 'C';
}

interface PromptTechnique {
  id: string;
  name: string;
  emoji: string;
  description: string;
  descriptionC: string;
  before: string;
  after: string;
  bandMin: 'A' | 'B' | 'C';
}

interface TemplatePrompt {
  text: string;
  techniques: string[];
}

interface TemplateCategory {
  emoji: string;
  bandMin: 'A' | 'B' | 'C';
  prompts: TemplatePrompt[];
}

// ================================================================
// CREATIVITY DIAL — Enhanced labels
// ================================================================

const CREATIVITY_STOPS = [
  { value: 0, label: 'Laser', emoji: '\u{1F3AF}', desc: 'Very precise, factual answers', color: '#3B82F6' },
  { value: 0.25, label: 'Precise', emoji: '\u{1F50D}', desc: 'Focused and clear', color: '#06B6D4' },
  { value: 0.5, label: 'Balanced', emoji: '\u2696\uFE0F', desc: 'Mix of both', color: '#10B981' },
  { value: 0.75, label: 'Creative', emoji: '\u{1F3A8}', desc: 'More imaginative', color: '#F59E0B' },
  { value: 1, label: 'Wild', emoji: '\u{1F308}', desc: 'Maximum creativity!', color: '#EF4444' },
];

// ================================================================
// PROMPT SCORING — Multi-dimensional
// ================================================================

function scorePrompt(text: string): PromptScore {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  const tips: string[] = [];

  // Specificity: Does it ask about something concrete?
  let specificity = 0;
  if (/\b(about|explain|describe|what is|how does|tell me about)\b/i.test(text)) specificity += 2;
  if (/\b(specific|example|instance|like|such as)\b/i.test(text)) specificity += 2;
  if (wordCount > 8) specificity += 1;
  if (specificity < 2) tips.push('Try being more specific about what you want to know');
  specificity = Math.min(5, specificity);

  // Clarity: Is it well-structured?
  let clarity = 0;
  if (wordCount >= 5 && wordCount <= 50) clarity += 2;
  if (text.includes('?') || /\b(please|can you|could you)\b/i.test(text)) clarity += 1;
  if (!/[A-Z]/.test(text[0])) tips.push('Start with a capital letter for clarity');
  else clarity += 1;
  if (text.endsWith('?') || text.endsWith('.') || text.endsWith('!')) clarity += 1;
  else tips.push('End with punctuation for a complete thought');
  clarity = Math.min(5, clarity);

  // Creativity: Does it use imaginative framing?
  let creativity = 0;
  if (/\b(imagine|pretend|what if|creative|story|invent|design)\b/i.test(text)) creativity += 2;
  if (/\b(fun|cool|amazing|surprising|unusual|unique)\b/i.test(text)) creativity += 1;
  if (/\b(like a|as if|metaphor|analogy)\b/i.test(text)) creativity += 1;
  if (creativity < 2) tips.push('Try adding "imagine" or "what if" for creative responses');
  creativity = Math.min(5, creativity);

  // Constraints: Does it set boundaries?
  let constraints = 0;
  if (/\b(for kids|simple|easy|short|brief|in \d+ words|in \d+ sentences)\b/i.test(text)) constraints += 2;
  if (/\b(step.by.step|list|bullet|numbered|format)\b/i.test(text)) constraints += 2;
  if (/\b(don't|without|avoid|only|must|should)\b/i.test(text)) constraints += 1;
  if (constraints < 2) tips.push('Add constraints like "explain in 3 steps" or "for a 10-year-old"');
  constraints = Math.min(5, constraints);

  // Technique: Does it use prompt engineering techniques?
  let technique = 0;
  if (/\b(step.by.step|think|reason|chain)\b/i.test(text)) technique += 2;
  if (/\b(example|for instance|here is|like this)\b/i.test(text)) technique += 2;
  if (/\b(you are|act as|pretend you|role|persona)\b/i.test(text)) technique += 2;
  if (/\b(first|then|finally|after that)\b/i.test(text)) technique += 1;
  if (technique < 2) tips.push('Try "explain step by step" or "act as a scientist"');
  technique = Math.min(5, technique);

  const total = specificity + clarity + creativity + constraints + technique;
  return { specificity, clarity, creativity, constraints, technique, total, tips };
}

// ================================================================
// PROMPT TECHNIQUES — Educational content
// ================================================================

const TECHNIQUES: PromptTechnique[] = [
  {
    id: 'specific',
    name: 'Be Specific',
    emoji: '\u{1F3AF}',
    description: 'Tell the AI exactly what you want. The more details, the better the answer!',
    descriptionC: 'Specificity reduces ambiguity in the prompt space. The model has fewer valid interpretations, leading to more focused and accurate responses.',
    before: 'Tell me about space',
    after: 'Explain how black holes form, using an analogy a 12-year-old would understand',
    bandMin: 'A',
  },
  {
    id: 'constraints',
    name: 'Add Constraints',
    emoji: '\u{1F4CF}',
    description: 'Set rules like length, format, or audience. This shapes the answer!',
    descriptionC: 'Constraints narrow the output distribution. Format constraints (lists, steps, tables) activate structured generation patterns.',
    before: 'Write about robots',
    after: 'Write a 5-sentence paragraph about robots that help in hospitals, suitable for a school newspaper.',
    bandMin: 'A',
  },
  {
    id: 'persona',
    name: 'Give a Persona',
    emoji: '\u{1F3AD}',
    description: 'Tell the AI to pretend to be someone specific. "Act as a scientist" or "You are a teacher" changes how it responds.',
    descriptionC: 'Persona prompts activate domain-specific knowledge and tone. The system prompt conditions the model to adopt consistent expertise throughout.',
    before: 'How does photosynthesis work?',
    after: 'You are a friendly plant scientist. Explain photosynthesis to your new assistant who has never seen a plant before.',
    bandMin: 'B',
  },
  {
    id: 'chain',
    name: 'Chain of Thought',
    emoji: '\u{1F517}',
    description: 'Ask the AI to think step by step. This helps it give better, more logical answers, especially for math and reasoning.',
    descriptionC: 'Chain-of-thought (CoT) prompting elicits intermediate reasoning steps, improving accuracy on complex tasks by decomposing them into manageable sub-problems.',
    before: 'What is 17 \u00D7 23?',
    after: 'What is 17 \u00D7 23? Think through it step by step, showing your work.',
    bandMin: 'B',
  },
  {
    id: 'fewshot',
    name: 'Give Examples',
    emoji: '\u{1F4DD}',
    description: 'Show the AI examples of what you want. It learns the pattern and follows it!',
    descriptionC: 'Few-shot prompting provides in-context examples that define the input-output mapping. More examples improve task specification.',
    before: 'Translate these words to emoji',
    after: 'Translate words to emoji. Examples: "happy" \u2192 \u{1F60A}, "rain" \u2192 \u{1F327}\uFE0F, "fast" \u2192 \u26A1. Now translate: Moon, Stars, Music',
    bandMin: 'B',
  },
  {
    id: 'system',
    name: 'System Prompts',
    emoji: '\u2699\uFE0F',
    description: 'A system prompt is a hidden instruction that shapes how the AI behaves for the entire conversation.',
    descriptionC: "System prompts set the model\u2019s behavioral context via the system message parameter. They define persona, constraints, and output format persistently.",
    before: '(no system prompt)',
    after: 'System: You are a code reviewer. Only respond with code improvements. Be concise.',
    bandMin: 'C',
  },
];

// ================================================================
// TEMPLATE LIBRARY — 8 categories, 40 prompts
// ================================================================

const TEMPLATES: Record<string, TemplateCategory> = {
  'Stories': {
    emoji: '\u{1F4D6}', bandMin: 'A',
    prompts: [
      { text: 'Write a short story about a robot who learns to paint', techniques: ['specific'] },
      { text: 'Tell me a story about an AI that discovers music for the first time', techniques: ['specific'] },
      { text: 'Create a tale about a friendly AI helping a kid solve a mystery in 3 chapters', techniques: ['specific', 'constraints'] },
      { text: 'Write about a day in the life of a self-driving car, from its perspective', techniques: ['persona', 'specific'] },
      { text: 'Imagine a world where every kid has an AI best friend. Write the first day.', techniques: ['specific'] },
    ],
  },
  'Science': {
    emoji: '\u{1F52C}', bandMin: 'A',
    prompts: [
      { text: 'Explain how AI can help doctors find diseases faster, in simple terms', techniques: ['specific', 'constraints'] },
      { text: 'How does a recommendation algorithm work, like on YouTube? Use an analogy.', techniques: ['specific', 'constraints'] },
      { text: "What is a neural network? Explain like I\u2019m 10 years old using a food analogy", techniques: ['specific', 'constraints'] },
      { text: 'How does facial recognition technology work? Break it into 4 simple steps.', techniques: ['specific', 'chain', 'constraints'] },
      { text: 'Compare how a human brain and a computer brain learn differently', techniques: ['specific'] },
    ],
  },
  'Creative': {
    emoji: '\u{1F3A8}', bandMin: 'A',
    prompts: [
      { text: 'Come up with 5 creative inventions that use AI to help animals', techniques: ['specific', 'constraints'] },
      { text: 'Describe a city in the year 2050 where AI helps everyone, in vivid detail', techniques: ['specific', 'constraints'] },
      { text: 'Create a superhero whose power is artificial intelligence. Describe their origin story.', techniques: ['specific', 'persona'] },
      { text: 'Design a new AI-powered game for kids. Include the rules and how to win.', techniques: ['specific', 'constraints'] },
      { text: 'Write a conversation between a calculator and a modern AI about who is smarter', techniques: ['persona', 'specific'] },
    ],
  },
  'Math & Logic': {
    emoji: '\u{1F9EE}', bandMin: 'B',
    prompts: [
      { text: 'Give me a fun logic puzzle about a robot sorting packages. Think step by step.', techniques: ['specific', 'chain'] },
      { text: 'Explain binary numbers using a fun analogy involving pizza toppings', techniques: ['specific', 'constraints'] },
      { text: 'Create a math riddle that involves training data and give hints', techniques: ['specific', 'constraints'] },
      { text: 'How does an AI count objects in a photo? Explain the algorithm step by step.', techniques: ['specific', 'chain'] },
      { text: 'Design a coding challenge for beginners that teaches loops using a real-world example.', techniques: ['specific', 'constraints'] },
    ],
  },
  'AI Ethics': {
    emoji: '\u2696\uFE0F', bandMin: 'B',
    prompts: [
      { text: 'What are 3 ways AI could be unfair? Give a real example for each.', techniques: ['specific', 'constraints'] },
      { text: "Imagine you\u2019re an AI judge. What rules would you need to be fair?", techniques: ['persona', 'specific'] },
      { text: 'Explain the difference between AI making a mistake and AI being biased', techniques: ['specific'] },
      { text: 'Should AI be allowed to make important decisions about people? Argue both sides.', techniques: ['specific', 'chain'] },
      { text: 'Design a checklist for testing if an AI system is fair and unbiased', techniques: ['specific', 'constraints'] },
    ],
  },
  'Code & Tech': {
    emoji: '\u{1F4BB}', bandMin: 'B',
    prompts: [
      { text: 'Explain what an API is using a restaurant analogy, then give a real example', techniques: ['specific', 'constraints'] },
      { text: 'Write pseudocode for a simple chatbot that answers FAQs. Add comments.', techniques: ['specific', 'constraints'] },
      { text: "What\u2019s the difference between machine learning and regular programming? Use examples.", techniques: ['specific', 'fewshot'] },
      { text: 'Explain how a search engine decides which results to show first, step by step', techniques: ['specific', 'chain'] },
      { text: 'Design a simple algorithm for recommending songs based on what someone already likes.', techniques: ['specific', 'chain'] },
    ],
  },
  'Prompt Engineering': {
    emoji: '\u{1F6E0}\uFE0F', bandMin: 'C',
    prompts: [
      { text: 'You are a prompt engineering teacher. Explain the concept of "temperature" in AI models.', techniques: ['persona', 'specific'] },
      { text: 'Compare zero-shot, one-shot, and few-shot prompting. Give an example of each format.', techniques: ['specific', 'fewshot'] },
      { text: 'Act as a senior AI researcher. Explain why "chain of thought" prompting improves reasoning.', techniques: ['persona', 'chain'] },
      { text: 'Create a prompt template for summarizing articles that consistently produces 3-bullet summaries.', techniques: ['specific', 'constraints'] },
      { text: 'Explain the concept of "prompt injection" and why AI systems need to be careful about it.', techniques: ['specific'] },
    ],
  },
  'Real World AI': {
    emoji: '\u{1F30D}', bandMin: 'C',
    prompts: [
      { text: 'Analyze how GPT-style models are changing education. List 3 benefits and 3 risks.', techniques: ['specific', 'constraints'] },
      { text: 'You are a tech journalist. Write a 200-word article about how AI is being used in healthcare.', techniques: ['persona', 'constraints'] },
      { text: 'Compare how AI assistants (like me) work versus how a search engine works. Be specific.', techniques: ['specific'] },
      { text: 'Explain the transformer architecture that powers modern AI. Use the analogy of a library.', techniques: ['specific', 'constraints'] },
      { text: 'What are foundation models and why are they considered a paradigm shift in AI?', techniques: ['specific'] },
    ],
  },
};

// ================================================================
// PROMPT CHALLENGES — Guided goals
// ================================================================

const CHALLENGES: PromptChallenge[] = [
  {
    id: 'specific',
    title: 'The Sharpshooter',
    emoji: '\u{1F3AF}',
    bandMin: 'A',
    description: 'Write a prompt so specific that the AI gives you EXACTLY the answer you want.',
    goal: 'Get the AI to explain ONE specific thing in exactly 3 sentences.',
    hint: 'Try: "Explain [topic] in exactly 3 sentences for a [age]-year-old."',
    checkFn: (response, prompt) => {
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 5);
      const hasConstraint = /\b(3 sentences|three sentences|exactly 3)\b/i.test(prompt);
      return {
        passed: sentences.length >= 2 && sentences.length <= 4 && hasConstraint,
        feedback: hasConstraint
          ? sentences.length <= 4
            ? 'Great constraint! The AI followed your 3-sentence rule.'
            : 'Close! The response was a bit long. Try being even more specific.'
          : 'Tip: Include "in exactly 3 sentences" in your prompt.',
      };
    },
  },
  {
    id: 'persona',
    title: 'The Actor',
    emoji: '\u{1F3AD}',
    bandMin: 'A',
    description: 'Make the AI pretend to be a specific character or expert.',
    goal: 'Get the AI to respond as a specific character throughout its answer.',
    hint: 'Start with: "You are a [character]. Explain [topic] as that character would."',
    checkFn: (response, prompt) => {
      const hasPersona = /\b(you are|act as|pretend|imagine you|role)\b/i.test(prompt);
      return {
        passed: hasPersona && response.length > 50,
        feedback: hasPersona
          ? 'Awesome! You gave the AI a role to play.'
          : 'Tip: Start with "You are a..." or "Act as a..." to give the AI a persona.',
      };
    },
  },
  {
    id: 'creative',
    title: 'The Inventor',
    emoji: '\u{1F4A1}',
    bandMin: 'B',
    description: 'Write a prompt that makes the AI generate something truly creative and unexpected.',
    goal: 'Get the AI to create something original \u2014 an invention, story, or design.',
    hint: 'Try: "Invent a new [thing] that combines [X] and [Y]. Describe how it works."',
    checkFn: (response, prompt) => {
      const hasCreative = /\b(invent|create|imagine|design|what if|new)\b/i.test(prompt);
      return {
        passed: hasCreative && response.length > 100,
        feedback: hasCreative
          ? 'Creative prompt! The AI generated something original.'
          : 'Tip: Use words like "invent", "create", or "imagine" to spark creativity.',
      };
    },
  },
  {
    id: 'chain',
    title: 'The Detective',
    emoji: '\u{1F50D}',
    bandMin: 'B',
    description: 'Use chain-of-thought prompting to make the AI reason through a problem.',
    goal: 'Get the AI to show its reasoning step by step.',
    hint: 'Add "Think step by step" or "Show your reasoning" to any question.',
    checkFn: (response, prompt) => {
      const hasChain = /\b(step.by.step|think through|show.*(reasoning|work)|let.s think)\b/i.test(prompt);
      const hasSteps = /\b(step \d|first|second|then|finally|\d\.)\b/i.test(response);
      return {
        passed: hasChain && hasSteps,
        feedback: hasChain
          ? hasSteps
            ? 'Perfect! The AI showed its reasoning.'
            : 'The AI didn\u2019t show clear steps. Try "think through it step by step".'
          : 'Add "think step by step" or "show your reasoning" to your prompt.',
      };
    },
  },
  {
    id: 'fewshot',
    title: 'The Teacher',
    emoji: '\u{1F4DA}',
    bandMin: 'C',
    description: 'Use few-shot prompting \u2014 give examples, then ask the AI to follow the pattern.',
    goal: 'Give 2+ examples in your prompt, then ask the AI to continue the pattern.',
    hint: 'Example: "Cat \u2192 \u{1F431}, Dog \u2192 \u{1F436}, Sun \u2192 \u2600\uFE0F. Now translate: Moon, Rain, Book"',
    starterPrompt: 'Translate words to emoji. Examples:\n"happy" \u2192 \u{1F60A}\n"rain" \u2192 \u{1F327}\uFE0F\n"fast" \u2192 \u26A1. Now translate: Moon, Rain, Book',
    checkFn: (response, prompt) => {
      const exampleCount = (prompt.match(/\u2192|->|=>|:/g) || []).length;
      return {
        passed: exampleCount >= 2 && response.length > 20,
        feedback: exampleCount >= 2
          ? 'Excellent few-shot prompting! The AI learned from your examples.'
          : 'Include at least 2 examples with arrows (\u2192) in your prompt.',
      };
    },
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

// ================================================================
// MAIN COMPONENT
// ================================================================

export function PromptLabGame() {
  const { activeChild } = useChildStore();
  const game = useGameStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  // --- Core state ---
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);

  // --- Chat state ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [temperature, setTemperature] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTechniques, setShowTechniques] = useState(false);
  const [showScoreDetail, setShowScoreDetail] = useState(false);
  const [promptsUsed, setPromptsUsed] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // --- Challenge state ---
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [challengeResults, setChallengeResults] = useState<Record<string, { passed: boolean; feedback: string }>>({});

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Particles ---
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        duration: Math.random() * 6 + 4,
      })),
    []
  );

  // --- Derived ---
  const promptScore = useMemo(
    () => (input.trim().length > 3 ? scorePrompt(input) : null),
    [input]
  );
  const currentCreativity =
    CREATIVITY_STOPS.find((s) => s.value === temperature) || CREATIVITY_STOPS[2];
  const availableTemplates = useMemo(
    () =>
      Object.entries(TEMPLATES).filter(
        ([, t]) => BAND_ORDER[t.bandMin] <= BAND_ORDER[ageBand]
      ),
    [ageBand]
  );
  const availableTechniques = useMemo(
    () => TECHNIQUES.filter((t) => BAND_ORDER[t.bandMin] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const availableChallenges = useMemo(
    () => CHALLENGES.filter((c) => BAND_ORDER[c.bandMin] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const activeChallenge = activeChallengeId
    ? CHALLENGES.find((c) => c.id === activeChallengeId) || null
    : null;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ================================================================
  // SEND MESSAGE — Claude API call
  // ================================================================

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || !activeChild) return;

    const score = scorePrompt(input);
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      score,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    // Award points for prompt quality
    game.updateScore(Math.max(1, Math.floor(score.total / 5)));

    try {
      const res = await fetch('/api/ai/prompt-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: activeChild.id,
          prompt: userMessage.content,
          temperature,
          ageBand: activeChild.age_band,
          conversationHistory: updatedMessages
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429)
          setError("You\u2019ve used all your prompts today! Come back tomorrow.");
        else if (data.error?.includes('moderation'))
          setError("Let\u2019s try a different topic! How about asking about AI or science?");
        else setError('Sparky had a hiccup. Try again!');
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      };
      setMessages([...updatedMessages, assistantMessage]);
      setPromptsUsed((p) => p + 1);
      game.advanceRound();

      // Check active challenge
      if (activeChallenge) {
        const result = activeChallenge.checkFn(data.reply, userMessage.content);
        setChallengeResults((prev) => ({ ...prev, [activeChallenge.id]: result }));
        if (result.passed) game.updateScore(15);
      }
    } catch {
      setError('Could not reach Sparky. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeChild, messages, temperature, game, activeChallenge]);

  function handleTemplateSelect(text: string) {
    setInput(text);
    setShowTemplates(false);
  }

  function startChallenge(id: string) {
    setActiveChallengeId(id);
    const ch = CHALLENGES.find((c) => c.id === id);
    if (ch?.starterPrompt) setInput(ch.starterPrompt);
    setPhase('sandbox');
  }

  function copyMessage(idx: number) {
    const msg = messages[idx];
    if (msg) {
      navigator.clipboard.writeText(msg.content).catch(() => {});
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  }

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <GameShell
      gameId="prompt-lab"
      title="Prompt Lab"
      worldNumber={4}
      worldColor="#F59E0B"
      totalRounds={10}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particle Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-amber-900/[0.08] via-transparent to-transparent" />
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(245,158,11,${0.15 + p.size * 0.06}) 0%, transparent 70%)`,
                boxShadow: `0 0 ${p.size * 3}px rgba(245,158,11,0.1)`,
              }}
              animate={{ y: [0, -12 - p.size * 4, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Chrome Bezel */}
        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(245,158,11,0.15)',
              boxShadow:
                '0 2px 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(245,158,11,0.1)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <AnimatePresence mode="wait">
              {/* ===== WELCOME ===== */}
              {phase === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(245,158,11,0.15)',
                        '0 0 40px rgba(245,158,11,0.25)',
                        '0 0 20px rgba(245,158,11,0.15)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.05))',
                    }}
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span className="font-data text-xs text-amber-400 uppercase tracking-wider">
                      Lab 4
                    </span>
                  </motion.div>

                  <span className="text-6xl">{'\u2728'}</span>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                    Prompt Lab
                  </h2>
                  <p className="font-body text-sm text-white/50 max-w-sm">
                    Master the art of talking to AI! Learn prompt engineering techniques,
                    experiment with creativity settings, and complete challenges.
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Prompt Engineering', 'Temperature', 'Few-Shot', 'Chain-of-Thought'].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-body text-xs"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>

                  <div className="flex gap-3 w-full max-w-sm">
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="flex-1 py-3 rounded-xl font-display font-bold text-sm text-white shadow-lg shadow-amber-500/20"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Learn First <GraduationCap className="inline w-4 h-4 ml-1" />
                    </motion.button>
                    <motion.button
                      onClick={() => setPhase('sandbox')}
                      className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-display font-bold text-sm text-white/70"
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Jump In {'\u2192'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ===== LEARN — Technique cards ===== */}
              {phase === 'learn' && (
                <motion.div
                  key="learn"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col items-center justify-center p-6 space-y-5"
                >
                  <div className="text-center">
                    <GraduationCap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <h3 className="font-display text-lg font-bold text-white">
                      Prompt Engineering Tips
                    </h3>
                    <p className="font-body text-xs text-white/40">
                      {learnIdx + 1} of {availableTechniques.length}
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={learnIdx}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="max-w-md w-full rounded-xl p-5 border border-amber-500/20 space-y-3"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.03))',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{availableTechniques[learnIdx]?.emoji}</span>
                        <h4 className="font-display text-base font-bold text-amber-300">
                          {availableTechniques[learnIdx]?.name}
                        </h4>
                      </div>
                      <p className="font-body text-sm text-white/60 leading-relaxed">
                        {ageBand === 'C'
                          ? availableTechniques[learnIdx]?.descriptionC
                          : availableTechniques[learnIdx]?.description}
                      </p>

                      {/* Before/After example */}
                      <div className="space-y-2 mt-3">
                        <div className="rounded-lg p-2.5 bg-red-500/5 border border-red-500/10">
                          <p className="font-data text-[9px] text-red-400 uppercase tracking-wider">
                            Before
                          </p>
                          <p className="font-body text-xs text-white/50 italic">
                            &quot;{availableTechniques[learnIdx]?.before}&quot;
                          </p>
                        </div>
                        <div className="rounded-lg p-2.5 bg-spark-green/5 border border-spark-green/10">
                          <p className="font-data text-[9px] text-spark-green uppercase tracking-wider">
                            After
                          </p>
                          <p className="font-body text-xs text-white/70 italic">
                            &quot;{availableTechniques[learnIdx]?.after}&quot;
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex gap-3 w-full max-w-md">
                    <motion.button
                      onClick={() => {
                        if (learnIdx < availableTechniques.length - 1)
                          setLearnIdx((i) => i + 1);
                        else setPhase('sandbox');
                      }}
                      className="flex-1 py-3 rounded-xl font-display font-bold text-sm text-white shadow-lg shadow-amber-500/20"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {learnIdx < availableTechniques.length - 1
                        ? 'Next Technique \u2192'
                        : 'Start Chatting! \u2728'}
                    </motion.button>
                  </div>
                  <button
                    onClick={() => setPhase('sandbox')}
                    className="font-body text-xs text-white/20 hover:text-white/40"
                  >
                    Skip intro {'\u2192'}
                  </button>
                </motion.div>
              )}

              {/* ===== SANDBOX — Main chat interface ===== */}
              {(phase === 'sandbox' || phase === 'challenge') && (
                <motion.div
                  key="sandbox"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Active challenge banner */}
                  {activeChallenge && (
                    <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/15 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      <div className="flex-1">
                        <span className="font-display text-[11px] font-bold text-amber-400">
                          {activeChallenge.title}
                        </span>
                        <span className="font-body text-[10px] text-white/30 ml-2">
                          {activeChallenge.goal}
                        </span>
                      </div>
                      {challengeResults[activeChallenge.id] && (
                        <span
                          className={`font-display text-[10px] font-bold ${
                            challengeResults[activeChallenge.id].passed
                              ? 'text-spark-green'
                              : 'text-amber-400'
                          }`}
                        >
                          {challengeResults[activeChallenge.id].passed
                            ? '\u2705 Passed!'
                            : '\u{1F4AD} Try again'}
                        </span>
                      )}
                      <button
                        onClick={() => setActiveChallengeId(null)}
                        className="text-white/20 hover:text-white/40 text-xs"
                        aria-label="Close challenge"
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  )}

                  {/* Message area */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-8 space-y-3">
                        <span className="text-5xl block">{'\u{1F916}'}</span>
                        <p className="font-display text-base font-bold text-white">
                          Hi! I&apos;m Sparky!
                        </p>
                        <p className="font-body text-sm text-white/40 max-w-sm mx-auto">
                          Ask me anything about AI, science, math, or technology. The better your
                          prompt, the better my answer!
                        </p>
                        {/* Quick action buttons */}
                        <div className="flex flex-wrap gap-2 justify-center mt-3">
                          <button
                            onClick={() => setShowTemplates(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-display"
                            aria-label="Open template library"
                          >
                            <BookOpen className="w-3 h-3" /> Templates
                          </button>
                          <button
                            onClick={() => setShowTechniques(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-display"
                            aria-label="Open tips panel"
                          >
                            <Lightbulb className="w-3 h-3" /> Tips
                          </button>
                          <button
                            onClick={() => setPhase('challenge')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-display"
                            aria-label="Open challenges"
                          >
                            <Target className="w-3 h-3" /> Challenges
                          </button>
                        </div>
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div
                          className={`max-w-[82%] relative group ${
                            msg.role === 'user'
                              ? 'rounded-2xl rounded-br-md px-4 py-3 border'
                              : 'rounded-2xl rounded-bl-md px-4 py-3 border'
                          }`}
                          style={
                            msg.role === 'user'
                              ? {
                                  background: 'rgba(245,158,11,0.08)',
                                  borderColor: 'rgba(245,158,11,0.2)',
                                }
                              : {
                                  background:
                                    'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(168,85,247,0.04))',
                                  borderColor: 'rgba(139,92,246,0.15)',
                                }
                          }
                        >
                          {msg.role === 'assistant' && (
                            <span className="text-[10px] font-display font-bold text-purple-400/60 block mb-1">
                              {'\u{1F916}'} Sparky
                            </span>
                          )}
                          <p className="font-body text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          {/* Copy button */}
                          <button
                            onClick={() => copyMessage(i)}
                            className="absolute -top-2 -right-2 p-1 rounded-md bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Copy message"
                          >
                            {copiedIdx === i ? (
                              <Check className="w-3 h-3 text-spark-green" />
                            ) : (
                              <Copy className="w-3 h-3 text-white/30" />
                            )}
                          </button>
                          {/* User prompt score (inline) */}
                          {msg.role === 'user' && msg.score && (
                            <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-white/5">
                              {Array.from({ length: 5 }).map((_, s) => (
                                <Star
                                  key={s}
                                  className={`w-2.5 h-2.5 ${
                                    s < Math.round(msg.score!.total / 5)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-white/10'
                                  }`}
                                />
                              ))}
                              <span className="font-mono text-[9px] text-white/20 ml-1">
                                {msg.score.total}/25
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Challenge result feedback */}
                    {activeChallenge && challengeResults[activeChallenge.id] && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mx-auto max-w-sm p-3 rounded-xl border ${
                          challengeResults[activeChallenge.id].passed
                            ? 'border-spark-green/30 bg-spark-green/5'
                            : 'border-amber-500/20 bg-amber-500/5'
                        }`}
                      >
                        <p
                          className={`font-display text-xs font-bold ${
                            challengeResults[activeChallenge.id].passed
                              ? 'text-spark-green'
                              : 'text-amber-400'
                          }`}
                        >
                          {challengeResults[activeChallenge.id].passed
                            ? '\u2705 Challenge Complete!'
                            : '\u{1F4A1} Keep Trying!'}
                        </p>
                        <p className="font-body text-[11px] text-white/50 mt-1">
                          {challengeResults[activeChallenge.id].feedback}
                        </p>
                      </motion.div>
                    )}

                    {loading && (
                      <motion.div
                        className="flex justify-start"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div
                          className="px-4 py-3 rounded-2xl rounded-bl-md border border-white/5"
                          style={{ background: 'rgba(139,92,246,0.06)' }}
                        >
                          <span className="font-body text-sm text-white/40">
                            Sparky is thinking
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              ...
                            </motion.span>
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        className="flex justify-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                          <AlertTriangle className="w-4 h-4 text-red-400 inline mr-2" />
                          <span className="font-body text-sm text-red-400">{error}</span>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Creativity Dial */}
                  <div className="px-4 py-2 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <Thermometer
                        className="w-4 h-4"
                        style={{ color: currentCreativity.color }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.25}
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="flex-1 h-1 accent-amber-500"
                        aria-label="Creativity / temperature dial"
                      />
                      <div className="min-w-[90px] text-right">
                        <span
                          className="font-display text-xs font-bold"
                          style={{ color: currentCreativity.color }}
                        >
                          {currentCreativity.emoji} {currentCreativity.label}
                        </span>
                      </div>
                    </div>
                    <p className="font-body text-[9px] text-white/20 mt-0.5">
                      {currentCreativity.desc}
                    </p>
                  </div>

                  {/* Prompt Score (live) */}
                  {promptScore && input.trim().length > 5 && (
                    <div className="px-4 py-1.5 border-t border-white/5">
                      <button
                        onClick={() => setShowScoreDetail(!showScoreDetail)}
                        className="flex items-center gap-2 w-full"
                      >
                        <span className="font-body text-[10px] text-white/25">Score:</span>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(promptScore.total / 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-white/10'
                            }`}
                          />
                        ))}
                        <span className="font-mono text-[9px] text-white/20">
                          {promptScore.total}/25
                        </span>
                        <ChevronRight
                          className={`w-3 h-3 text-white/15 ml-auto transition-transform ${
                            showScoreDetail ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {showScoreDetail && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-1.5 space-y-1"
                          >
                            {[
                              { label: 'Specificity', value: promptScore.specificity, color: '#3B82F6' },
                              { label: 'Clarity', value: promptScore.clarity, color: '#10B981' },
                              { label: 'Creativity', value: promptScore.creativity, color: '#F59E0B' },
                              { label: 'Constraints', value: promptScore.constraints, color: '#8B5CF6' },
                              { label: 'Technique', value: promptScore.technique, color: '#EC4899' },
                            ].map((d) => (
                              <div key={d.label} className="flex items-center gap-2">
                                <span className="font-body text-[9px] text-white/25 w-16">
                                  {d.label}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-white/5">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: d.color }}
                                    animate={{ width: `${(d.value / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[9px] text-white/20 w-4 text-right">
                                  {d.value}
                                </span>
                              </div>
                            ))}
                            {promptScore.tips.length > 0 && (
                              <p className="font-body text-[10px] text-amber-400/60 mt-1">
                                {'\u{1F4A1}'} {promptScore.tips[0]}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Input area */}
                  <div className="px-4 pb-4 pt-2">
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          showTemplates
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/5 text-white/30'
                        }`}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Open template library"
                      >
                        <BookOpen className="w-4 h-4" />
                      </motion.button>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Ask Sparky anything about AI..."
                        rows={1}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 font-body text-sm resize-none focus:outline-none focus:border-amber-500/30 placeholder:text-white/20"
                        disabled={loading}
                        aria-label="Type your prompt"
                      />
                      <motion.button
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg shadow-amber-500/20 disabled:opacity-30"
                        style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Send prompt"
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <p className="font-body text-[10px] text-white/15 text-center mt-1.5">
                      {promptsUsed} prompts used this session
                    </p>
                  </div>

                  {/* Template Drawer (overlay) */}
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        className="absolute bottom-24 left-3 right-3 rounded-xl border border-white/10 p-4 max-h-[50%] overflow-y-auto z-30"
                        style={{
                          background: 'rgba(17,17,24,0.95)',
                          backdropFilter: 'blur(12px)',
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-display text-sm font-bold text-white">
                            {'\u{1F4DA}'} Prompt Templates
                          </p>
                          <button
                            onClick={() => setShowTemplates(false)}
                            className="text-white/20 hover:text-white/40 text-xs"
                          >
                            {'\u2715'}
                          </button>
                        </div>
                        {availableTemplates.map(([category, data]) => (
                          <div key={category} className="mb-3">
                            <p className="font-body text-xs text-white/30 font-semibold mb-1.5">
                              {data.emoji} {category}
                            </p>
                            <div className="space-y-1.5">
                              {data.prompts.map((p, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleTemplateSelect(p.text)}
                                  className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-all group"
                                >
                                  <p className="font-body text-xs text-white/60 group-hover:text-white/80">
                                    {p.text}
                                  </p>
                                  <div className="flex gap-1 mt-1">
                                    {p.techniques.map((t) => (
                                      <span
                                        key={t}
                                        className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-400/60 font-body text-[8px]"
                                      >
                                        {TECHNIQUES.find((tech) => tech.id === t)?.emoji} {t}
                                      </span>
                                    ))}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Challenges Drawer */}
                  <AnimatePresence>
                    {phase === 'challenge' && !activeChallengeId && (
                      <motion.div
                        className="absolute bottom-24 left-3 right-3 rounded-xl border border-white/10 p-4 max-h-[50%] overflow-y-auto z-30"
                        style={{
                          background: 'rgba(17,17,24,0.95)',
                          backdropFilter: 'blur(12px)',
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-display text-sm font-bold text-amber-400">
                            {'\u{1F3C6}'} Prompt Challenges
                          </p>
                          <button
                            onClick={() => setPhase('sandbox')}
                            className="text-white/20 hover:text-white/40 text-xs"
                          >
                            {'\u2715'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {availableChallenges.map((ch) => (
                            <motion.button
                              key={ch.id}
                              onClick={() => startChallenge(ch.id)}
                              className={`w-full p-3 rounded-lg border text-left transition-all ${
                                challengeResults[ch.id]?.passed
                                  ? 'border-spark-green/30 bg-spark-green/5'
                                  : 'border-white/5 bg-white/[0.02] hover:border-amber-500/15'
                              }`}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{ch.emoji}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-display text-xs font-bold text-white">
                                      {ch.title}
                                    </p>
                                    {challengeResults[ch.id]?.passed && (
                                      <span className="text-spark-green text-[10px]">{'\u2705'}</span>
                                    )}
                                  </div>
                                  <p className="font-body text-[10px] text-white/30">
                                    {ch.description}
                                  </p>
                                </div>
                              </div>
                              <p className="font-body text-[10px] text-amber-400/50 mt-1 italic">
                                {'\u{1F4A1}'} {ch.hint}
                              </p>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Techniques Panel (overlay) */}
                  <AnimatePresence>
                    {showTechniques && (
                      <motion.div
                        className="absolute bottom-24 left-3 right-3 rounded-xl border border-white/10 p-4 max-h-[50%] overflow-y-auto z-30"
                        style={{
                          background: 'rgba(17,17,24,0.95)',
                          backdropFilter: 'blur(12px)',
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-display text-sm font-bold text-white">
                            {'\u{1F4A1}'} Prompt Engineering Tips
                          </p>
                          <button
                            onClick={() => setShowTechniques(false)}
                            className="text-white/20 hover:text-white/40 text-xs"
                          >
                            {'\u2715'}
                          </button>
                        </div>
                        {availableTechniques.map((t) => (
                          <div
                            key={t.id}
                            className="mb-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
                          >
                            <p className="font-display text-xs font-bold text-white">
                              {t.emoji} {t.name}
                            </p>
                            <p className="font-body text-[10px] text-white/40 mt-0.5">
                              {ageBand === 'C' ? t.descriptionC : t.description}
                            </p>
                            <div className="flex gap-2 mt-1.5">
                              <span className="flex-1 font-body text-[9px] text-red-400/60 italic">
                                &quot;{t.before}&quot;
                              </span>
                              <ArrowRight className="w-3 h-3 text-white/10 flex-shrink-0" />
                              <span className="flex-1 font-body text-[9px] text-spark-green/60 italic">
                                &quot;{t.after}&quot;
                              </span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}

export default PromptLabGame;
