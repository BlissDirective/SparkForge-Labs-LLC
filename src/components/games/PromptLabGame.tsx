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
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useGameStore } from '@/stores/gameStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { usePromptLabAudio } from '@/hooks/usePromptLabAudio';
import {
  Send, BookOpen, Star, AlertTriangle,
  ChevronRight, Lightbulb, GraduationCap,
  MessageSquare, Target, Copy, Check,
  Thermometer, ArrowRight, Eye, Brain,
  RotateCcw, Sparkles,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { extractKeywords } from '@/components/3d/PromptBubble3D';

// [v3] SSR-safe dynamic import for 3D thought bubble scene
const PromptBubble3DScene = dynamic(
  () => import('@/components/3d/PromptBubble3DScene'),
  { ssr: false }
);
// P6-B: 3D prompt quality visualization
const PromptScore3D = dynamic(
  () => import('@/components/3d/PromptScore3D'),
  { ssr: false }
);

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
// PROMPT X-RAY — Keyword-to-response mapping
// ================================================================

interface XRayHighlight {
  keyword: string;
  color: string;
  promptIndices: [number, number];
  responseEffect: string;
}

const XRAY_PATTERNS: { regex: RegExp; color: string; effectLabel: string }[] = [
  { regex: /\b(explain|describe|what is|how does|tell me about)\b/gi, color: '#3B82F6', effectLabel: 'Triggered an explanation' },
  { regex: /\b(step.by.step|steps|first.*then|numbered)\b/gi, color: '#10B981', effectLabel: 'Structured the response in steps' },
  { regex: /\b(for kids|for a \d+-year-old|simple|easy|beginner)\b/gi, color: '#F59E0B', effectLabel: 'Adjusted complexity level' },
  { regex: /\b(in \d+ (words|sentences|paragraphs)|short|brief|concise)\b/gi, color: '#EC4899', effectLabel: 'Controlled response length' },
  { regex: /\b(you are|act as|pretend|imagine you|role)\b/gi, color: '#8B5CF6', effectLabel: 'Activated a persona' },
  { regex: /\b(list|bullet|format|table|json|markdown)\b/gi, color: '#06B6D4', effectLabel: 'Changed output format' },
  { regex: /\b(example|for instance|such as|like this|e\.g\.)\b/gi, color: '#F97316', effectLabel: 'Prompted example generation' },
  { regex: /\b(don't|without|avoid|never|do not|exclude)\b/gi, color: '#EF4444', effectLabel: 'Set a negative constraint' },
  { regex: /\b(creative|fun|surprising|unique|unusual|imaginative)\b/gi, color: '#A855F7', effectLabel: 'Boosted creative output' },
  { regex: /\b(compare|difference|versus|vs|similarities)\b/gi, color: '#14B8A6', effectLabel: 'Triggered comparison analysis' },
];

function analyzePromptXRay(prompt: string): XRayHighlight[] {
  const highlights: XRayHighlight[] = [];
  for (const pattern of XRAY_PATTERNS) {
    const re = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(prompt)) !== null) {
      highlights.push({
        keyword: match[0],
        color: pattern.color,
        promptIndices: [match.index, match.index + match[0].length],
        responseEffect: pattern.effectLabel,
      });
    }
  }
  return highlights;
}

// ================================================================
// "WHY DID THE AI SAY THAT?" — Response analysis
// ================================================================

interface ResponseInsight {
  emoji: string;
  observation: string;
  because: string;
}

function analyzeResponse(prompt: string, response: string): ResponseInsight[] {
  const insights: ResponseInsight[] = [];

  // Length analysis
  const wordCount = response.split(/\s+/).length;
  if (wordCount < 80) {
    if (/\b(short|brief|concise|in \d+)\b/i.test(prompt)) {
      insights.push({ emoji: '\u{1F4CF}', observation: `Short response (${wordCount} words)`, because: 'You asked for something brief or concise.' });
    }
  } else if (wordCount > 150) {
    if (/\b(detail|thorough|comprehensive|explain)\b/i.test(prompt)) {
      insights.push({ emoji: '\u{1F4D6}', observation: `Detailed response (${wordCount} words)`, because: 'You asked for a detailed explanation.' });
    }
  }

  // Structure analysis
  if (/\d\.\s|\d\)\s|step \d/i.test(response)) {
    if (/\b(step|list|number|order)\b/i.test(prompt)) {
      insights.push({ emoji: '\u{1F522}', observation: 'Used numbered steps', because: 'You asked for a structured, step-by-step response.' });
    } else {
      insights.push({ emoji: '\u{1F522}', observation: 'Used numbered steps', because: 'The AI chose to organize a complex answer into steps.' });
    }
  }

  // Tone analysis
  if (/!|\u{1F60A}|fun|cool|awesome/iu.test(response)) {
    if (/\b(fun|kid|child|exciting|cool)\b/i.test(prompt)) {
      insights.push({ emoji: '\u{1F389}', observation: 'Used an enthusiastic, kid-friendly tone', because: 'You set a fun or youthful tone in your prompt.' });
    }
  }

  // Analogy detection
  if (/\b(like|imagine|think of it as|similar to|just as)\b/i.test(response)) {
    if (/\b(analogy|like|compare|imagine|pretend)\b/i.test(prompt)) {
      insights.push({ emoji: '\u{1F4A1}', observation: 'Used an analogy or comparison', because: 'You asked for a comparison or analogy.' });
    } else {
      insights.push({ emoji: '\u{1F4A1}', observation: 'Used an analogy or comparison', because: 'The AI chose an analogy to make the concept clearer.' });
    }
  }

  // Persona detection
  if (/\b(you are|act as|pretend|I am)\b/i.test(prompt)) {
    insights.push({ emoji: '\u{1F3AD}', observation: 'Adopted a specific persona', because: 'You assigned the AI a role or character to play.' });
  }

  // Question at end
  if (response.trim().endsWith('?')) {
    insights.push({ emoji: '\u2753', observation: 'Ended with a follow-up question', because: 'The AI is inviting you to continue the conversation.' });
  }

  // Code detection
  if (/```|`[^`]+`/g.test(response)) {
    insights.push({ emoji: '\u{1F4BB}', observation: 'Included code or technical formatting', because: 'The topic involved programming or technical content.' });
  }

  // Default if no insights found
  if (insights.length === 0) {
    insights.push({ emoji: '\u{1F916}', observation: 'Standard conversational response', because: 'Your prompt was open-ended \u2014 try adding more signals for a more targeted response.' });
  }

  return insights.slice(0, 4);
}

// ================================================================
// PROMPT PATTERN LIBRARY — Reusable structures
// ================================================================

interface PromptPattern {
  id: string;
  name: string;
  emoji: string;
  description: string;
  template: string;
  slots: { key: string; label: string; examples: string[] }[];
  bandMin: 'A' | 'B' | 'C';
}

const PATTERNS: PromptPattern[] = [
  {
    id: 'explain-for', name: 'Explain For...', emoji: '\u{1F4D6}', bandMin: 'A',
    description: 'Ask the AI to explain something for a specific audience.',
    template: 'Explain {topic} for {audience} using {style}.',
    slots: [
      { key: 'topic', label: 'Topic', examples: ['how Wi-Fi works', 'what DNA is', 'how AI learns'] },
      { key: 'audience', label: 'Audience', examples: ['a 10-year-old', 'a curious teenager', 'my grandma'] },
      { key: 'style', label: 'Style', examples: ['a food analogy', 'a story', 'simple words only'] },
    ],
  },
  {
    id: 'step-by-step', name: 'Step by Step', emoji: '\u{1F522}', bandMin: 'A',
    description: 'Break down a complex topic into numbered steps.',
    template: 'Explain {topic} step by step. Use {count} steps. {extra}.',
    slots: [
      { key: 'topic', label: 'Topic', examples: ['how a computer boots up', 'how AI recognizes faces', 'how the internet works'] },
      { key: 'count', label: 'Number of steps', examples: ['3', '5', '7'] },
      { key: 'extra', label: 'Extra instruction', examples: ['Keep each step under 2 sentences', 'Add an emoji per step', 'Use simple language'] },
    ],
  },
  {
    id: 'persona-task', name: 'Persona + Task', emoji: '\u{1F3AD}', bandMin: 'A',
    description: 'Give the AI a character, then assign it a task.',
    template: 'You are {persona}. {task}. {constraint}.',
    slots: [
      { key: 'persona', label: 'Who the AI is', examples: ['a friendly scientist', 'a pirate captain', 'a time traveler from 2100'] },
      { key: 'task', label: 'What to do', examples: ['Explain gravity', 'Tell me about the ocean', 'Teach me about AI'] },
      { key: 'constraint', label: 'Extra rule', examples: ['Keep it under 100 words', 'Use only simple words', 'Include a joke'] },
    ],
  },
  {
    id: 'few-shot', name: 'Learn by Example', emoji: '\u{1F4DD}', bandMin: 'B',
    description: 'Show the AI examples, then ask it to follow the pattern.',
    template: '{taskDescription}\n\nExamples:\n{example1}\n{example2}\n\nNow: {newInput}',
    slots: [
      { key: 'taskDescription', label: 'What pattern to follow', examples: ['Translate words to emoji', 'Simplify these sentences', 'Convert to haiku'] },
      { key: 'example1', label: 'Example 1', examples: ['"happy" \u2192 \u{1F60A}', '"The cat sat on the mat" \u2192 "Cat on mat"', '"sun" \u2192 5-7-5 haiku'] },
      { key: 'example2', label: 'Example 2', examples: ['"rain" \u2192 \u{1F327}\uFE0F', '"The dog ran fast" \u2192 "Fast dog"', '"moon" \u2192 5-7-5 haiku'] },
      { key: 'newInput', label: 'Your input', examples: ['"music", "sleep", "fast"', '"AI is transforming industries"', '"stars", "ocean", "wind"'] },
    ],
  },
  {
    id: 'chain-thought', name: 'Think Step by Step', emoji: '\u{1F517}', bandMin: 'B',
    description: 'Ask the AI to show its reasoning process.',
    template: '{question}\n\nThink through this step by step. {format}',
    slots: [
      { key: 'question', label: 'Your question', examples: ['How would you design a robot that cleans a room?', 'Why does ice float on water?', 'How does encryption keep data safe?'] },
      { key: 'format', label: 'Output format', examples: ['Number each step.', 'Use "First... Then... Finally..."', 'Show your reasoning in bullet points.'] },
    ],
  },
  {
    id: 'constrained', name: 'The Constraint Stack', emoji: '\u{1F4CF}', bandMin: 'B',
    description: 'Layer multiple rules to precisely control the output.',
    template: '{task}\n\nRules:\n- {rule1}\n- {rule2}\n- {rule3}',
    slots: [
      { key: 'task', label: 'Main task', examples: ['Write about AI in schools', 'Explain machine learning', 'Describe a futuristic city'] },
      { key: 'rule1', label: 'Rule 1', examples: ['Maximum 100 words', 'Use exactly 3 paragraphs', 'Write as a poem'] },
      { key: 'rule2', label: 'Rule 2', examples: ['Include a real-world example', 'No jargon', 'Use at least 2 analogies'] },
      { key: 'rule3', label: 'Rule 3', examples: ['Suitable for a 12-year-old', 'Include one surprising fact', 'End with a question'] },
    ],
  },
  {
    id: 'system-user', name: 'System + User Split', emoji: '\u2699\uFE0F', bandMin: 'C',
    description: 'Separate persistent instructions (system) from the actual question (user).',
    template: '[System]: {systemPrompt}\n\n[User]: {userMessage}',
    slots: [
      { key: 'systemPrompt', label: 'System instructions', examples: ['You are a code reviewer. Be concise.', 'You are a friendly teacher for kids.', 'Always respond in bullet points.'] },
      { key: 'userMessage', label: 'Your message', examples: ['Review this Python function...', 'Explain what recursion is.', 'What is the difference between AI and ML?'] },
    ],
  },
  {
    id: 'iterative', name: 'The Refiner', emoji: '\u{1F504}', bandMin: 'C',
    description: 'Start broad, then ask the AI to improve its own response.',
    template: '{initialRequest}\n\nAfter your first answer, {refinement}',
    slots: [
      { key: 'initialRequest', label: 'Initial request', examples: ['Write a paragraph about quantum computing', 'Explain blockchain in simple terms', 'Summarize the history of AI'] },
      { key: 'refinement', label: 'Refinement instruction', examples: ['make it more concise and add an analogy', 'rewrite it for a 10-year-old audience', 'add 3 specific examples and a conclusion'] },
    ],
  },
];

// ================================================================
// AI THINKING ANIMATION — Mini neural network SVG
// ================================================================

function AIThinkingViz({ temperature }: { temperature: number }) {
  const layers = [3, 4, 3];
  const width = 120;
  const height = 48;
  const layerGap = width / (layers.length + 1);

  function nodePos(layer: number, idx: number) {
    const count = layers[layer];
    const gap = height / (count + 1);
    return { x: layerGap * (layer + 1), y: gap * (idx + 1) };
  }

  const nodeColor = temperature < 0.3 ? '#3B82F6' : temperature < 0.7 ? '#F59E0B' : '#EF4444';
  const pulseSpeed = 0.8 + temperature * 1.2;

  return (
    <div className="px-4 py-3 rounded-2xl rounded-bl-md border border-white/5"
      style={{ background: 'rgba(139,92,246,0.06)' }}>
      <span className="text-2xs font-display font-bold text-purple-400 block mb-1.5">
        {'\u{1F916}'} Sparky is thinking...
      </span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto block">
        {/* Connections with flowing dots */}
        {layers.map((_, li) => {
          if (li === 0) return null;
          return Array.from({ length: layers[li - 1] }).map((_, fromIdx) =>
            Array.from({ length: layers[li] }).map((_, toIdx) => {
              const from = nodePos(li - 1, fromIdx);
              const to = nodePos(li, toIdx);
              const key = `c-${li}-${fromIdx}-${toIdx}`;
              const animDur = pulseSpeed + (fromIdx * 0.17 + toIdx * 0.13);
              const animBegin = (fromIdx * 0.2 + toIdx * 0.15);
              return (
                <g key={key}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={nodeColor} strokeWidth={0.4} opacity={0.15} />
                  <circle r={1.2} fill={nodeColor} opacity={0.7}>
                    <animateMotion
                      dur={`${animDur}s`}
                      repeatCount="indefinite"
                      begin={`${animBegin}s`}
                      path={`M${from.x},${from.y} L${to.x},${to.y}`} />
                  </circle>
                </g>
              );
            })
          );
        })}
        {/* Nodes */}
        {layers.map((count, li) =>
          Array.from({ length: count }).map((_, ni) => {
            const p = nodePos(li, ni);
            return (
              <g key={`n-${li}-${ni}`}>
                <circle cx={p.x} cy={p.y} r={3.5} fill={`${nodeColor}20`} stroke={nodeColor} strokeWidth={0.6}>
                  <animate attributeName="r" values="3;4.5;3" dur={`${pulseSpeed}s`}
                    begin={`${li * 0.2}s`} repeatCount="indefinite" />
                </circle>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

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
  // === NEW TEMPLATE CATEGORIES (Phase D2 expansion) ===
  'Role-Play': {
    emoji: '\u{1F3AD}', bandMin: 'A',
    prompts: [
      { text: 'You are a pirate captain. Explain how GPS navigation works in pirate language.', techniques: ['persona', 'specific'] },
      { text: 'You are a detective solving the case of the missing semicolon in a JavaScript program.', techniques: ['persona', 'specific'] },
      { text: 'You are a cooking robot. Describe how you would make the perfect sandwich, step by step.', techniques: ['persona', 'chain'] },
    ],
  },
  'Debate': {
    emoji: '\u{2696}\u{FE0F}', bandMin: 'B',
    prompts: [
      { text: 'Present 3 arguments for and 3 against using AI in schools. Evaluate each fairly.', techniques: ['constraints', 'specific'] },
      { text: 'Debate whether AI art counts as "real" art. Give both sides equally.', techniques: ['specific'] },
      { text: 'Should self-driving cars make ethical decisions? Argue both perspectives.', techniques: ['specific', 'constraints'] },
    ],
  },
  'Compare': {
    emoji: '\u{1F4CA}', bandMin: 'B',
    prompts: [
      { text: 'Compare how humans learn vs. how AI learns. Format as a 3-column table.', techniques: ['specific', 'constraints'] },
      { text: 'Compare a smartphone and a human brain across: memory, speed, creativity, learning.', techniques: ['specific', 'constraints'] },
    ],
  },
  'Q&A Generator': {
    emoji: '\u{2753}', bandMin: 'A',
    prompts: [
      { text: 'Generate 5 quiz questions about AI for a 10-year-old. Include answers.', techniques: ['constraints', 'specific'] },
      { text: 'Create 3 true/false questions about machine learning with explanations.', techniques: ['constraints'] },
    ],
  },
  'Story Arc': {
    emoji: '\u{1F3AC}', bandMin: 'A',
    prompts: [
      { text: 'Write a story about an AI that develops a conscience. Include: setup, rising action, climax, resolution.', techniques: ['specific', 'constraints'] },
      { text: 'Create a 4-act story where a robot and a child must work together to save a forest.', techniques: ['specific', 'constraints'] },
    ],
  },
  'Structured Output': {
    emoji: '\u{1F4CB}', bandMin: 'C',
    prompts: [
      { text: 'Analyze the pros and cons of GPT models. Return as JSON with fields: category, pros[], cons[], verdict.', techniques: ['constraints', 'specific'] },
      { text: 'List 5 AI applications in healthcare as a markdown table with columns: Application, How It Works, Benefit, Risk.', techniques: ['constraints', 'specific'] },
    ],
  },
  'Multi-Turn': {
    emoji: '\u{1F504}', bandMin: 'B',
    prompts: [
      { text: 'First, brainstorm 5 topics about AI ethics. Then pick the most important one. Finally, write a 100-word essay on it.', techniques: ['chain', 'constraints'] },
      { text: 'Step 1: List 3 ways AI helps the environment. Step 2: For each, give a real example. Step 3: Rank them by impact.', techniques: ['chain', 'constraints'] },
    ],
  },
};

// ================================================================
// Phase D2: Prompt Lab Modes + Scenario Packs
// ================================================================

type PromptLabMode = 'sandbox' | 'challenge' | 'battle' | 'history' | 'recipes';

interface PromptHistoryEntry {
  id: string;
  prompt: string;
  response: string;
  score: number;
  timestamp: number;
}

interface PromptRecipeStep {
  id: number;
  prompt: string;
  response: string | null;
}

// Real-world scenario packs
const _SCENARIO_PACKS = [
  {
    id: 'homework', title: 'Homework Helper', emoji: '\u{1F4DA}',
    scenarios: [
      { id: 'essay', title: 'Essay Outline Generator', context: 'You need to write a 500-word essay about climate change.' },
      { id: 'math', title: 'Math Word Problem Solver', context: 'A train leaves station A at 60mph...' },
      { id: 'study', title: 'Study Guide Creator', context: 'You have a science test on the solar system tomorrow.' },
    ],
  },
  {
    id: 'creative', title: 'Creative Writing', emoji: '\u{270D}\u{FE0F}',
    scenarios: [
      { id: 'character', title: 'Character Creator', context: 'Design an interesting character for a sci-fi novel.' },
      { id: 'twist', title: 'Plot Twist Generator', context: 'A detective story where the detective IS the culprit.' },
      { id: 'dialogue', title: 'Dialogue Writer', context: 'Two AIs meeting each other for the first time.' },
    ],
  },
  {
    id: 'science', title: 'Science Explorer', emoji: '\u{1F52C}',
    scenarios: [
      { id: 'experiment', title: 'Experiment Designer', context: 'Design an experiment to test if plants grow better with music.' },
      { id: 'hypothesis', title: 'Hypothesis Evaluator', context: 'Hypothesis: AI can predict earthquakes better than traditional methods.' },
      { id: 'data', title: 'Data Interpreter', context: 'Given this data table, what conclusions can you draw?' },
    ],
  },
  {
    id: 'debate-pack', title: 'Debate Prep', emoji: '\u{1F3C6}',
    scenarios: [
      { id: 'argument', title: 'Argument Builder', context: 'Build a case for: "AI should be used in courtrooms."' },
      { id: 'counter', title: 'Counter-argument Finder', context: 'Find weaknesses in: "AI will replace all jobs."' },
      { id: 'opening', title: 'Opening Statement Writer', context: 'Write an opening statement for a debate on AI in schools.' },
    ],
  },
  {
    id: 'code-pack', title: 'Code Review', emoji: '\u{1F4BB}',
    scenarios: [
      { id: 'bugfinder', title: 'Bug Finder', context: 'This function should return the sum but returns NaN.' },
      { id: 'explainer', title: 'Code Explainer', context: 'Explain this recursive function to a beginner.' },
      { id: 'refactor', title: 'Refactoring Advisor', context: 'This 50-line function does too many things. How to split it?' },
    ],
  },
];

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
  // === NEW CHALLENGES (Phase D2 expansion) ===
  {
    id: 'storyteller', title: 'The Storyteller', emoji: '\u{1F4D6}', bandMin: 'A' as const,
    description: 'Write a prompt that generates a complete 3-act story with character arcs.',
    goal: 'Get the AI to write a story with a beginning, middle, and end.',
    hint: 'Try: "Write a story about [character] who [conflict]. Include setup, rising action, climax, and resolution."',
    checkFn: (_response: string, prompt: string) => {
      const hasStoryElements = /\b(story|character|beginning|middle|end|plot|climax)\b/i.test(prompt);
      return { passed: hasStoryElements && prompt.length > 30, feedback: hasStoryElements ? 'Great storytelling prompt!' : 'Include story structure words like "beginning, middle, end" or "character, plot".' };
    },
  },
  {
    id: 'code-helper', title: 'The Code Helper', emoji: '\u{1F4BB}', bandMin: 'B' as const,
    description: 'Write a prompt that helps debug a code snippet.',
    goal: 'Get the AI to find and fix a bug in pre-set code.',
    hint: 'Try: "Find the bug in this code and explain the fix step by step: [code]"',
    checkFn: (_response: string, prompt: string) => {
      const hasTechnical = /\b(bug|fix|debug|error|code|function|variable)\b/i.test(prompt);
      return { passed: hasTechnical, feedback: hasTechnical ? 'Nice technical prompt!' : 'Include technical terms like "bug", "fix", or "debug".' };
    },
  },
  {
    id: 'translator', title: 'The Translator', emoji: '\u{1F30D}', bandMin: 'B' as const,
    description: 'Write a prompt that translates AND adapts a message for a different culture.',
    goal: 'Get the AI to translate while considering cultural context.',
    hint: 'Try: "Translate this message to [language], adapting cultural references for a [country] audience."',
    checkFn: (_response: string, prompt: string) => {
      const hasTranslation = /\b(translate|language|adapt|culture|audience)\b/i.test(prompt);
      return { passed: hasTranslation, feedback: hasTranslation ? 'Great cross-cultural prompt!' : 'Include words like "translate", "adapt", or "culture".' };
    },
  },
  {
    id: 'summarizer', title: 'The Summarizer', emoji: '\u{1F4CB}', bandMin: 'A' as const,
    description: 'Write a prompt that compresses information into exactly 3 bullet points.',
    goal: 'Get the AI to produce a concise, structured summary.',
    hint: 'Try: "Summarize [topic] in exactly 3 bullet points, each one sentence long."',
    checkFn: (_response: string, prompt: string) => {
      const hasConstraint = /\b(3 bullet|three bullet|3 points|bullet points|summarize)\b/i.test(prompt);
      return { passed: hasConstraint, feedback: hasConstraint ? 'Excellent constraint-based prompt!' : 'Include "3 bullet points" or "summarize" in your prompt.' };
    },
  },
  {
    id: 'fact-checker', title: 'The Fact Checker', emoji: '\u{1F50D}', bandMin: 'B' as const,
    description: 'Write a prompt that evaluates a claim and provides sourced reasoning.',
    goal: 'Get the AI to analyze whether a claim is true or false with evidence.',
    hint: 'Try: "Evaluate this claim: [claim]. Provide 3 pieces of evidence for and against."',
    checkFn: (_response: string, prompt: string) => {
      const hasEvaluation = /\b(evaluate|claim|evidence|true|false|verify|check|source)\b/i.test(prompt);
      return { passed: hasEvaluation, feedback: hasEvaluation ? 'Strong analytical prompt!' : 'Include "evaluate", "claim", or "evidence" in your prompt.' };
    },
  },
  {
    id: 'persuader', title: 'The Persuader', emoji: '\u{1F4E2}', bandMin: 'C' as const,
    description: 'Write a prompt that generates a convincing argument for a given position.',
    goal: 'Get the AI to build a structured persuasive argument.',
    hint: 'Try: "Make a compelling argument for [position] using 3 supporting points and 1 counterargument."',
    checkFn: (_response: string, prompt: string) => {
      const hasPersuasion = /\b(argument|convince|persuade|position|support|counter)\b/i.test(prompt);
      return { passed: hasPersuasion, feedback: hasPersuasion ? 'Great persuasion prompt!' : 'Include "argument", "convince", or "position".' };
    },
  },
  {
    id: 'teacher-prompt', title: 'The Explainer', emoji: '\u{1F468}\u{200D}\u{1F3EB}', bandMin: 'B' as const,
    description: 'Write a prompt that explains a complex concept at a specified reading level.',
    goal: 'Get the AI to adjust its explanation complexity based on the audience.',
    hint: 'Try: "Explain [complex topic] as if I\'m [age] years old, using analogies and no jargon."',
    checkFn: (_response: string, prompt: string) => {
      const hasLevelSetting = /\b(explain|years old|grade|level|simple|analogy|jargon)\b/i.test(prompt);
      return { passed: hasLevelSetting, feedback: hasLevelSetting ? 'Smart audience-aware prompt!' : 'Include age/level targeting like "as if I\'m 10 years old".' };
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
  const { data: _dynamicContent } = useGameContent('prompt-lab', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges

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
  // S6-WARN-001: Client-side rate limiting (2s cooldown between sends)
  const [lastSentAt, setLastSentAt] = useState(0);
  const SEND_COOLDOWN_MS = 2000;
  const MAX_DAILY_PROMPTS = 50;

  // --- Challenge state ---
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [challengeResults, setChallengeResults] = useState<Record<string, { passed: boolean; feedback: string }>>({});

  // Phase D2: Extended mode state
  const [_labMode, _setLabMode] = useState<PromptLabMode>('sandbox');
  const [_promptHistory, _setPromptHistory] = useState<PromptHistoryEntry[]>([]);
  const [_battlePromptA, _setBattlePromptA] = useState('');
  const [_battlePromptB, _setBattlePromptB] = useState('');
  const [_battleResults, _setBattleResults] = useState<{ a: string; b: string; scoreA: number; scoreB: number } | null>(null);
  const [_recipeSteps, _setRecipeSteps] = useState<PromptRecipeStep[]>([{ id: 1, prompt: '', response: null }]);
  const [_activeScenarioPack, _setActiveScenarioPack] = useState<string | null>(null);

  // --- X-Ray & Explainer ---
  const [showXRay, setShowXRay] = useState<number | null>(null);
  const [showExplainer, setShowExplainer] = useState<number | null>(null);
  const [showPatterns, setShowPatterns] = useState(false);
  const [patternSlots, setPatternSlots] = useState<Record<string, string>>({});
  const [activePatternId, setActivePatternId] = useState<string | null>(null);

  // --- System prompt sandbox (Band C) ---
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  // [v3] 3D thought bubble state
  const [bubbleKeywords, setBubbleKeywords] = useState<string[]>([]);
  const [showBubbles, setShowBubbles] = useState(false);

  // P3-E: Always-on environment — register immediately, update with keywords
  // P6-B: Track last sent score for 3D visualization
  const [lastSentScore, setLastSentScore] = useState<{ dimensions: { label: string; value: number; color: string }[]; total: number } | null>(null);

  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  useEffect(() => {
    setGameSceneContent(
      <>
        <PromptBubble3DScene
          keywords={bubbleKeywords}
          isThinking={loading}
          temperature={temperature}
        />
        <PromptScore3D
          dimensions={lastSentScore?.dimensions ?? []}
          totalScore={lastSentScore?.total ?? 0}
          isVisible={!!lastSentScore && (phase === 'sandbox' || phase === 'challenge')}
        />
      </>
    );
    return () => setGameSceneContent(null);
  }, [bubbleKeywords, loading, temperature, lastSentScore, phase, setGameSceneContent]);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // S6-CRIT-001: Signal game completion when entering report phase
  useEffect(() => {
    if (phase === 'report') {
      game.completeGame();
    }
  }, [phase, game]);

  // P1: Cockpit broadcast integration
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  // P2: Audio integration
  const promptAudio = usePromptLabAudio();
  const [soundEnabled] = useState(false);
  // P4: CeremonyFX milestones
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);

  // Track completed challenges count
  const completedChallenges = useMemo(
    () => Object.values(challengeResults).filter((r) => r.passed).length,
    [challengeResults]
  );

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
  const availablePatterns = useMemo(
    () => PATTERNS.filter((p) => BAND_ORDER[p.bandMin] <= BAND_ORDER[ageBand]),
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
    // S6-WARN-001: Client-side cooldown (2s between sends)
    const now = Date.now();
    if (now - lastSentAt < SEND_COOLDOWN_MS) return;
    if (promptsUsed >= MAX_DAILY_PROMPTS) {
      setError(`Daily limit reached (${MAX_DAILY_PROMPTS} prompts). Try again tomorrow!`);
      return;
    }
    setLastSentAt(now);

    const score = scorePrompt(input);
    // P6-B: Update 3D score visualization
    setLastSentScore({
      dimensions: [
        { label: 'Specificity', value: score.specificity, color: '#F59E0B' },
        { label: 'Clarity', value: score.clarity, color: '#F97316' },
        { label: 'Creativity', value: score.creativity, color: '#EF4444' },
        { label: 'Constraints', value: score.constraints, color: '#8B5CF6' },
        { label: 'Technique', value: score.technique, color: '#10B981' },
      ],
      total: score.total,
    });
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

    // [v3] Extract keywords for 3D bubbles
    const newKeywords = extractKeywords(input.trim());
    if (newKeywords.length > 0) {
      setBubbleKeywords(prev => {
        const combined = [...prev, ...newKeywords];
        return combined.slice(-12); // Keep last 12
      });
      setShowBubbles(true);
    }

    // Award points for prompt quality
    game.updateScore(Math.max(1, Math.floor(score.total / 5)));
    // P2: Audio feedback
    if (soundEnabled) { promptAudio.playSend(); promptAudio.playScore(score.total); }
    // P1: Broadcast prompt send + quality to cockpit
    broadcast({ type: 'button-press', source: 'prompt-lab', value: score.total, color: '#F59E0B' });
    broadcast({ type: 'dial-rotate', source: 'prompt-lab', value: temperature, color: '#F59E0B' });

    try {
      const res = await fetch('/api/ai/prompt-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: activeChild.id,
          prompt: systemPrompt && ageBand === 'C'
            ? `[System Context: ${systemPrompt}]\n\n${userMessage.content}`
            : userMessage.content,
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
      if (soundEnabled) promptAudio.playResponse();
      setPromptsUsed((p) => p + 1);
      game.advanceRound();

      // Check active challenge
      if (activeChallenge) {
        const result = activeChallenge.checkFn(data.reply, userMessage.content);
        setChallengeResults((prev) => ({ ...prev, [activeChallenge.id]: result }));
        if (result.passed) {
          game.updateScore(15);
          if (soundEnabled) promptAudio.playChallengePassed();
          triggerCelebration('confetti');
          broadcast({ type: 'celebration-start', source: 'prompt-lab', value: 1, color: '#F59E0B' });
        }
      }

      // [v3] Clear bubble keywords after pop animation
      setTimeout(() => {
        setBubbleKeywords([]);
        setShowBubbles(false);
      }, 1000);
    } catch {
      setError('Could not reach Sparky. Check your connection.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, loading, activeChild, messages, temperature, game, activeChallenge, systemPrompt, ageBand]);

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
                          <p className="font-data text-2xs text-red-400 uppercase tracking-wider">
                            Before
                          </p>
                          <p className="font-body text-xs text-white/50 italic">
                            &quot;{availableTechniques[learnIdx]?.before}&quot;
                          </p>
                        </div>
                        <div className="rounded-lg p-2.5 bg-spark-green/5 border border-spark-green/10">
                          <p className="font-data text-2xs text-spark-green uppercase tracking-wider">
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
                  className="flex-1 flex flex-col min-h-0 relative"
                >
                  {/* [v3] 3D Thought Bubbles */}
                  {showBubbles && (phase === 'sandbox' || phase === 'challenge') && (
                    <div
                      className="absolute inset-0 pointer-events-none z-0"
                      style={{ opacity: 0.7 }}
                      aria-hidden="true"
                    >
                      <PromptBubble3DScene
                        keywords={bubbleKeywords}
                        isThinking={loading}
                        temperature={temperature}
                      />
                    </div>
                  )}

                  {/* Active challenge banner */}
                  {activeChallenge && (
                    <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/15 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      <div className="flex-1">
                        <span className="font-display text-xs font-bold text-amber-400">
                          {activeChallenge.title}
                        </span>
                        <span className="font-body text-2xs text-white/30 ml-2">
                          {activeChallenge.goal}
                        </span>
                      </div>
                      {challengeResults[activeChallenge.id] && (
                        <span
                          className={`font-display text-2xs font-bold ${
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
                            onClick={() => setShowPatterns(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-display"
                            aria-label="Open prompt patterns"
                          >
                            <Sparkles className="w-3 h-3" /> Patterns
                          </button>
                          <button
                            onClick={() => setPhase('challenge')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-display"
                            aria-label="Open challenges"
                          >
                            <Target className="w-3 h-3" /> Challenges
                          </button>
                          {(completedChallenges >= 1 || messages.length >= 4) && (
                            <button
                              onClick={() => setPhase('report')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-spark-green/10 text-spark-green text-xs font-display"
                              aria-label="Complete Prompt Lab and view report"
                            >
                              <GraduationCap className="w-3 h-3" /> Finish Lab
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <div key={i}>
                        <motion.div
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
                              <span className="text-2xs font-display font-bold text-purple-400/60 block mb-1">
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
                                <span className="font-mono text-2xs text-white/20 ml-1">
                                  {msg.score.total}/25
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Prompt X-Ray toggle (user messages only) */}
                        {msg.role === 'user' && i < messages.length - 1 && (
                          <div className="flex justify-end mt-1">
                            <button
                              onClick={() => setShowXRay(showXRay === i ? null : i)}
                              className="flex items-center gap-1 font-body text-2xs text-amber-400/40 hover:text-amber-400/70 transition-colors"
                              aria-label="Toggle prompt X-ray"
                            >
                              <Eye className="w-3 h-3" /> X-Ray
                            </button>
                          </div>
                        )}

                        {/* X-Ray analysis panel */}
                        {msg.role === 'user' && showXRay === i && i < messages.length - 1 && (() => {
                          const highlights = analyzePromptXRay(msg.content);
                          if (highlights.length === 0) return null;
                          return (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mx-4 my-1 rounded-lg p-2.5 border border-amber-500/15"
                              style={{ background: 'rgba(245,158,11,0.03)' }}
                            >
                              <p className="font-data text-2xs text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                                <Eye className="w-3 h-3" /> Prompt X-Ray
                              </p>
                              <div className="space-y-1">
                                {highlights.map((h, hi) => (
                                  <div key={hi} className="flex items-center gap-2">
                                    <span
                                      className="px-1.5 py-0.5 rounded font-mono text-2xs"
                                      style={{ backgroundColor: `${h.color}15`, color: h.color, border: `1px solid ${h.color}30` }}
                                    >
                                      {'\u201C'}{h.keyword}{'\u201D'}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-white/15 flex-shrink-0" />
                                    <span className="font-body text-2xs text-white/40">{h.responseEffect}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 p-2 rounded bg-white/[0.02] border border-white/5">
                                <p className="font-body text-2xs text-white/20 mb-1">Your prompt signals:</p>
                                <p className="font-body text-xs text-white/50 leading-relaxed">
                                  {msg.content}
                                </p>
                                <p className="font-body text-2xs text-white/15 mt-1 italic">
                                  {highlights.length} prompt signal{highlights.length !== 1 ? 's' : ''} detected
                                </p>
                              </div>
                            </motion.div>
                          );
                        })()}

                        {/* "Why did the AI say that?" toggle */}
                        {msg.role === 'assistant' && i > 0 && (
                          <div className="flex justify-start mt-1">
                            <button
                              onClick={() => setShowExplainer(showExplainer === i ? null : i)}
                              className="flex items-center gap-1 font-body text-2xs text-purple-400/40 hover:text-purple-400/70 transition-colors"
                              aria-label="Explain this response"
                            >
                              <Lightbulb className="w-3 h-3" /> Why did the AI say that?
                            </button>
                          </div>
                        )}

                        {/* Response explainer panel */}
                        {msg.role === 'assistant' && showExplainer === i && i > 0 && (() => {
                          const userMsg = messages[i - 1];
                          if (!userMsg) return null;
                          const insights = analyzeResponse(userMsg.content, msg.content);
                          return (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mx-4 my-1 rounded-lg p-2.5 border border-purple-500/15"
                              style={{ background: 'rgba(139,92,246,0.03)' }}
                            >
                              <p className="font-data text-2xs text-purple-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                                <Lightbulb className="w-3 h-3" /> Response Analysis
                              </p>
                              <div className="space-y-1.5">
                                {insights.map((ins, ii) => (
                                  <div key={ii} className="flex items-start gap-2">
                                    <span className="text-sm flex-shrink-0">{ins.emoji}</span>
                                    <div>
                                      <p className="font-body text-xs text-white/60">{ins.observation}</p>
                                      <p className="font-body text-2xs text-white/30">{'\u21B3'} Because: {ins.because}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="font-body text-2xs text-purple-400/40 mt-2 italic">
                                Tip: The more specific signals your prompt has, the more predictable the response.
                              </p>
                            </motion.div>
                          );
                        })()}
                      </div>
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
                        <p className="font-body text-xs text-white/50 mt-1">
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
                        <AIThinkingViz temperature={temperature} />
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
                    <p className="font-body text-2xs text-white/20 mt-0.5">
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
                        <span className="font-body text-2xs text-white/25">Score:</span>
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
                        <span className="font-mono text-2xs text-white/20">
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
                                <span className="font-body text-2xs text-white/25 w-16">
                                  {d.label}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-white/5">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: d.color }}
                                    animate={{ width: `${(d.value / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="font-mono text-2xs text-white/20 w-4 text-right">
                                  {d.value}
                                </span>
                              </div>
                            ))}
                            {promptScore.tips.length > 0 && (
                              <p className="font-body text-2xs text-amber-400/60 mt-1">
                                {'\u{1F4A1}'} {promptScore.tips[0]}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* System Prompt Sandbox (Band C) */}
                  <AnimatePresence>
                    {showSystemPrompt && ageBand === 'C' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 overflow-hidden"
                      >
                        <div
                          className="rounded-xl p-3 border border-purple-500/20 mb-2"
                          style={{ background: 'rgba(139,92,246,0.04)' }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Brain className="w-3 h-3 text-purple-400" />
                              <span className="font-display text-xs font-bold text-purple-300">
                                System Prompt
                              </span>
                            </div>
                            <span className="font-mono text-2xs text-white/15">
                              {systemPrompt.length}/200
                            </span>
                          </div>
                          <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value.slice(0, 200))}
                            placeholder="Set persistent instructions... e.g. 'You are a code reviewer. Be concise.'"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 font-body text-xs resize-none focus:outline-none focus:border-purple-500/30 placeholder:text-white/15"
                            aria-label="System prompt \u2014 persistent instructions for the AI"
                          />
                          <p className="font-body text-2xs text-white/15 mt-1">
                            This shapes ALL responses. It{'\u2019'}s like giving the AI a job description.
                          </p>
                          {systemPrompt && (
                            <button
                              onClick={() => setSystemPrompt('')}
                              className="mt-1 font-body text-2xs text-purple-400/40 hover:text-purple-400/70"
                            >
                              <RotateCcw className="w-3 h-3 inline mr-0.5" /> Clear system prompt
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input area */}
                  <div className="px-4 pb-4 pt-2">
                    <div className="flex gap-2">
                      {/* System Prompt toggle (Band C only) */}
                      {ageBand === 'C' && (
                        <motion.button
                          onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            showSystemPrompt || systemPrompt
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-white/5 text-white/30'
                          }`}
                          whileTap={{ scale: 0.9 }}
                          aria-label="System prompt editor"
                        >
                          <Brain className="w-4 h-4" />
                        </motion.button>
                      )}
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
                    <p className="font-body text-2xs text-white/15 text-center mt-1.5">
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
                                        className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-400/60 font-body text-2xs"
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
                                      <span className="text-spark-green text-2xs">{'\u2705'}</span>
                                    )}
                                  </div>
                                  <p className="font-body text-2xs text-white/30">
                                    {ch.description}
                                  </p>
                                </div>
                              </div>
                              <p className="font-body text-2xs text-amber-400/50 mt-1 italic">
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
                            <p className="font-body text-2xs text-white/40 mt-0.5">
                              {ageBand === 'C' ? t.descriptionC : t.description}
                            </p>
                            <div className="flex gap-2 mt-1.5">
                              <span className="flex-1 font-body text-2xs text-red-400/60 italic">
                                &quot;{t.before}&quot;
                              </span>
                              <ArrowRight className="w-3 h-3 text-white/10 flex-shrink-0" />
                              <span className="flex-1 font-body text-2xs text-spark-green/60 italic">
                                &quot;{t.after}&quot;
                              </span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Prompt Pattern Library (overlay) */}
                  <AnimatePresence>
                    {showPatterns && (
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
                            {'\u2728'} Prompt Patterns
                          </p>
                          <button
                            onClick={() => { setShowPatterns(false); setActivePatternId(null); }}
                            className="text-white/20 hover:text-white/40 text-xs"
                          >
                            {'\u2715'}
                          </button>
                        </div>

                        {!activePatternId ? (
                          <div className="space-y-2">
                            <p className="font-body text-2xs text-white/30">
                              Patterns are reusable structures you can fill in. Learn the shape of a great prompt!
                            </p>
                            {availablePatterns.map((p) => (
                              <motion.button
                                key={p.id}
                                onClick={() => { setActivePatternId(p.id); setPatternSlots({}); }}
                                className="w-full p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-amber-500/15 text-left transition-all"
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{p.emoji}</span>
                                  <div>
                                    <p className="font-display text-xs font-bold text-white">{p.name}</p>
                                    <p className="font-body text-2xs text-white/30">{p.description}</p>
                                  </div>
                                </div>
                                <p className="font-mono text-2xs text-amber-400/40 mt-1">{p.template}</p>
                              </motion.button>
                            ))}
                          </div>
                        ) : (() => {
                          const pattern = availablePatterns.find((p) => p.id === activePatternId);
                          if (!pattern) return null;
                          return (
                            <div className="space-y-3">
                              <button
                                onClick={() => setActivePatternId(null)}
                                className="font-body text-2xs text-white/30 hover:text-white/50"
                              >
                                {'\u2190'} Back to patterns
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{pattern.emoji}</span>
                                <h4 className="font-display text-sm font-bold text-white">{pattern.name}</h4>
                              </div>
                              {/* Template preview */}
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                                <p className="font-data text-2xs text-white/20 uppercase tracking-wider mb-1">Template</p>
                                <p className="font-mono text-xs text-amber-400/60">{pattern.template}</p>
                              </div>
                              {/* Slot inputs */}
                              {pattern.slots.map((slot) => (
                                <div key={slot.key}>
                                  <label className="font-body text-2xs text-white/40 block mb-1">
                                    {slot.label}
                                  </label>
                                  <input
                                    type="text"
                                    value={patternSlots[slot.key] || ''}
                                    onChange={(e) => setPatternSlots((prev) => ({ ...prev, [slot.key]: e.target.value }))}
                                    placeholder={slot.examples[0]}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 font-body text-xs focus:outline-none focus:border-amber-500/30 placeholder:text-white/15"
                                  />
                                  <div className="flex gap-1 mt-1 overflow-x-auto scrollbar-hide">
                                    {slot.examples.map((ex, ei) => (
                                      <button
                                        key={ei}
                                        onClick={() => setPatternSlots((prev) => ({ ...prev, [slot.key]: ex }))}
                                        className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-2xs text-white/30 hover:text-white/50 whitespace-nowrap"
                                      >
                                        {ex}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {/* Generate button */}
                              <motion.button
                                onClick={() => {
                                  let filled = pattern.template;
                                  for (const slot of pattern.slots) {
                                    filled = filled.replace(`{${slot.key}}`, patternSlots[slot.key] || slot.examples[0]);
                                  }
                                  setInput(filled);
                                  setShowPatterns(false);
                                  setActivePatternId(null);
                                }}
                                className="w-full py-2.5 rounded-xl font-display font-bold text-sm text-white shadow-lg shadow-amber-500/20"
                                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                Use This Prompt
                              </motion.button>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>

          {/* ===== REPORT — Game completion summary (S6-CRIT-001) ===== */}
          {phase === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 p-6"
            >
              <div className="text-6xl mb-2">{'\u{1F389}'}</div>
              <h2 className="font-display text-2xl font-bold text-white text-center">
                Prompt Lab Complete!
              </h2>
              <p className="font-body text-sm text-white/50 text-center max-w-md">
                {ageBand === 'A'
                  ? 'Great job chatting with AI! You learned how to write clear messages.'
                  : ageBand === 'B'
                    ? 'You explored prompt engineering techniques and completed challenges. Nice work!'
                    : 'You mastered advanced prompt engineering \u2014 temperature control, system prompts, and challenge scenarios.'}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-sm w-full">
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-data text-2xl text-amber-400">{messages.filter((m) => m.role === 'user').length}</p>
                  <p className="font-body text-2xs text-white/30">Prompts Sent</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-data text-2xl text-amber-400">{game.score}</p>
                  <p className="font-body text-2xs text-white/30">Points Earned</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-data text-2xl text-spark-green">{completedChallenges}/{availableChallenges.length}</p>
                  <p className="font-body text-2xs text-white/30">Challenges</p>
                </div>
              </div>

              {/* What you learned */}
              <div className="max-w-sm w-full rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-display text-sm font-bold text-white mb-2">{'\u{1F4A1}'} What You Learned</p>
                <ul className="space-y-1.5">
                  <li className="font-body text-xs text-white/40 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">{'\u2713'}</span>
                    {ageBand === 'A' ? 'How to ask AI clear questions' : 'How to structure effective prompts'}
                  </li>
                  <li className="font-body text-xs text-white/40 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">{'\u2713'}</span>
                    {ageBand === 'A' ? 'Being specific helps AI give better answers' : 'Prompt engineering techniques (specificity, examples, constraints)'}
                  </li>
                  {ageBand !== 'A' && (
                    <li className="font-body text-xs text-white/40 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">{'\u2713'}</span>
                      Temperature controls how creative vs. predictable AI responses are
                    </li>
                  )}
                  {ageBand === 'C' && (
                    <li className="font-body text-xs text-white/40 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">{'\u2713'}</span>
                      System prompts can shape AI behavior for specific tasks
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </GameShell>
  );
}

export default PromptLabGame;
