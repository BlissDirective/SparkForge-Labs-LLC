// ================================================================
// AI CONTENT GENERATOR — Shared utility for all flagship games
// ================================================================
// Phase E: Server-side only content generation via Claude API.
// Static-first fallback, session caching, rate limiting, age-band prompting.
// See: flagship-game-content-audit(04.06.2026).md Section 6
// ================================================================

import { z } from 'zod';

// ================================================================
// TYPES
// ================================================================

export type GameId = 'pet-trainer' | 'sort-toy-box' | 'neural-builder' | 'agent-architect' | 'bias-detective';
export type AgeBand = 'A' | 'B' | 'C';

export type ContentType =
  // Pet Trainer
  | 'pet-training-category' | 'pet-novel-category'
  // Sort Toy Box
  | 'sort-criterion' | 'sort-shape-config'
  // Neural Builder
  | 'neural-challenge' | 'neural-test-dataset'
  // Agent Architect
  | 'agent-mission' | 'agent-themed-pack'
  // Bias Detective
  | 'bias-case' | 'bias-stakeholder-interview';

export interface AIContentRequest {
  gameId: GameId;
  contentType: ContentType;
  ageBand: AgeBand;
  context?: Record<string, unknown>;
}

export interface AIContentResponse<T = unknown> {
  content: T;
  cached: boolean;
  generatedAt: string;
}

// ================================================================
// REQUEST VALIDATION
// ================================================================

export const AIContentRequestSchema = z.object({
  gameId: z.enum(['pet-trainer', 'sort-toy-box', 'neural-builder', 'agent-architect', 'bias-detective']),
  contentType: z.enum([
    'pet-training-category', 'pet-novel-category',
    'sort-criterion', 'sort-shape-config',
    'neural-challenge', 'neural-test-dataset',
    'agent-mission', 'agent-themed-pack',
    'bias-case', 'bias-stakeholder-interview',
  ]),
  ageBand: z.enum(['A', 'B', 'C']),
  context: z.record(z.unknown()).optional(),
});

// ================================================================
// AGE-BAND CONTEXT FOR SYSTEM PROMPTS
// ================================================================

const AGE_BAND_CONTEXT: Record<AgeBand, string> = {
  A: 'The user is a child aged 7-9. Use simple, clear language. No complex vocabulary. Short sentences. Visual/concrete examples only. Fun and encouraging tone.',
  B: 'The user is a child aged 10-12. Use age-appropriate language. Can handle moderate complexity. Provide good examples and analogies. Encouraging but more informational tone.',
  C: 'The user is a teen aged 13-16. Can handle technical language and abstract concepts. Provide detailed, accurate information. Professional but approachable tone.',
};

// ================================================================
// GAME-SPECIFIC PROMPT TEMPLATES
// ================================================================

const PROMPT_TEMPLATES: Record<string, (ageBand: AgeBand, context?: Record<string, unknown>) => string> = {
  // Pet Trainer
  'pet-training-category': (ageBand, ctx) =>
    `Generate a set of 8 training items for the category "${ctx?.category || 'Animals'}". ` +
    `Each item needs: name, emoji, label (the category it belongs to), and 2 distinguishing features. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "items": [{ "name": "...", "emoji": "...", "label": "...", "features": ["...", "..."] }] }`,

  'pet-novel-category': (ageBand, ctx) =>
    `Invent a NEW training category for an AI pet training game, NOT one of these: ${ctx?.existing || 'Shapes, Fruits, Animals, Vehicles'}. ` +
    `The category should be visual, concrete, and sortable into 2-3 groups. ` +
    `Generate 8 items with: name, emoji, label (subcategory), and 2 features. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "category": "...", "groups": ["...", "..."], "items": [{ "name": "...", "emoji": "...", "label": "...", "features": ["...", "..."] }] }`,

  // Sort Toy Box
  'sort-criterion': (ageBand, ctx) =>
    `Create a sorting rule for ${ctx?.shapeCount || 12} shapes with properties: ${ctx?.properties || 'shape, color, size, pattern, symmetry, edgeCount'}. ` +
    `The rule should be non-obvious but learnable. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "criterion": "...", "description": "...", "groups": 3, "groupLabels": ["...", "...", "..."] }`,

  'sort-shape-config': (ageBand) =>
    `Design 12 shapes for a sorting exercise. Each shape has: name, color (hex), size (small/medium/large), pattern, symmetrical (bool), edgeCount. ` +
    `Make them visually diverse and interesting to sort. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "shapes": [{ "name": "...", "color": "#...", "size": "...", "pattern": "...", "symmetrical": true/false, "edgeCount": N }] }`,

  // Neural Builder
  'neural-challenge': (ageBand) =>
    `Create a neural network classification challenge. Include: task title, description, input feature names (4-12), output class labels (3-6), optimal layer architecture, and difficulty. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "description": "...", "inputLabels": ["..."], "outputLabels": ["..."], "optimalLayers": [N, N, N], "difficulty": "medium|hard" }`,

  'neural-test-dataset': (_ageBand, ctx) =>
    `Generate 8 test items for the neural network challenge "${ctx?.challengeTitle || 'Classifier'}". ` +
    `Each item: emoji representation, correct output class index, label description, difficulty. ` +
    `Return as JSON: { "items": [{ "emoji": "...", "answer": N, "label": "...", "difficulty": "easy|medium|hard" }] }`,

  // Agent Architect
  'agent-mission': (ageBand, ctx) =>
    `Create an AI agent pipeline mission. Available blocks: ${ctx?.availableBlocks || 'Goal, Search, Tool, Decide, Check, Loop, Memory, Done'}. ` +
    `Include: title, story context, goal description, required block types, validation rules, 3-star criteria. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "description": "...", "requiredBlockTypes": ["..."], "minBlocks": N, "optimalBlocks": N, "difficulty": "beginner|intermediate|advanced" }`,

  'agent-themed-pack': (ageBand, ctx) =>
    `Create 3 related agent missions about the theme "${ctx?.theme || 'Space Station'}". ` +
    `Missions should have increasing complexity. Each mission: title, description, required blocks, difficulty. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "theme": "...", "missions": [{ "title": "...", "description": "...", "requiredBlockTypes": ["..."], "difficulty": "..." }] }`,

  // Bias Detective
  'bias-case': (ageBand) =>
    `Create an AI bias case study. Include: title, domain, description of the biased AI system, ` +
    `4 evidence items (categories: data, outcome, pattern), 3 fix options (1 best, 1 partial, 1 wrong with explanations), ` +
    `and a real-world parallel (title, year, summary, lesson). ` +
    `IMPORTANT: Do not stereotype or reinforce biases about any group. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON with the full case structure.`,

  'bias-stakeholder-interview': (_ageBand, ctx) =>
    `Write a 5-exchange interview with a ${ctx?.role || 'affected person'} about the AI bias case: "${ctx?.caseTitle || 'an AI system'}". ` +
    `Include emotional but appropriate responses and unique perspective. ` +
    `Return as JSON: { "role": "...", "exchanges": [{ "question": "...", "answer": "..." }] }`,
};

// ================================================================
// CONTENT SAFETY — Post-generation checks
// ================================================================

const PII_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.]+\b|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\d{1,5}\s\w+\s(?:St|Ave|Rd|Blvd|Dr|Ln|Ct)\b/gi;

export function sanitizeContent(text: string): string {
  return text.replace(PII_PATTERN, '[REDACTED]');
}

export function validateContentSafety(content: unknown): { safe: boolean; reason?: string } {
  const str = JSON.stringify(content).toLowerCase();
  const FORBIDDEN = ['violence', 'weapon', 'drug', 'alcohol', 'sexual', 'suicide', 'self-harm'];
  for (const term of FORBIDDEN) {
    if (str.includes(term)) return { safe: false, reason: `Content contains forbidden topic: ${term}` };
  }
  return { safe: true };
}

// ================================================================
// CACHE KEY GENERATION
// ================================================================

export function getCacheKey(gameId: string, contentType: string, ageBand: string, contextHash?: string): string {
  return `sf:ai:${gameId}:${contentType}:${ageBand}${contextHash ? `:${contextHash}` : ''}`;
}

export function hashContext(context?: Record<string, unknown>): string {
  if (!context) return '';
  return btoa(JSON.stringify(context)).slice(0, 16);
}

// ================================================================
// RATE LIMITING (client-side enforcement)
// ================================================================

const RATE_STATE: Record<string, { count: number; lastRequest: number }> = {};

export const RATE_LIMITS = {
  maxPerGamePerSession: 5,
  cooldownMs: 30000, // 30 seconds
};

export function checkRateLimit(gameId: string): { allowed: boolean; waitMs?: number; remaining?: number } {
  const key = `ai-gen:${gameId}`;
  const state = RATE_STATE[key] || { count: 0, lastRequest: 0 };

  const now = Date.now();
  const cooldownRemaining = state.lastRequest + RATE_LIMITS.cooldownMs - now;
  if (cooldownRemaining > 0) {
    return { allowed: false, waitMs: cooldownRemaining };
  }

  if (state.count >= RATE_LIMITS.maxPerGamePerSession) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMITS.maxPerGamePerSession - state.count };
}

export function recordRequest(gameId: string): void {
  const key = `ai-gen:${gameId}`;
  const state = RATE_STATE[key] || { count: 0, lastRequest: 0 };
  state.count++;
  state.lastRequest = Date.now();
  RATE_STATE[key] = state;
}

// ================================================================
// PROMPT BUILDER
// ================================================================

export function buildPrompt(contentType: ContentType, ageBand: AgeBand, context?: Record<string, unknown>): string {
  const template = PROMPT_TEMPLATES[contentType];
  if (!template) throw new Error(`No prompt template for content type: ${contentType}`);
  return template(ageBand, context);
}

export function buildSystemPrompt(ageBand: AgeBand): string {
  return (
    `You are SparkForge's content generation AI. You generate educational content for children. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `RULES: ` +
    `1. NEVER generate real names, addresses, phone numbers, or emails. ` +
    `2. NEVER include violence, weapons, drugs, alcohol, or sexual content. ` +
    `3. NEVER stereotype or reinforce biases about any group. ` +
    `4. Always respond with valid JSON matching the requested schema. ` +
    `5. Keep content educational, engaging, and age-appropriate.`
  );
}
