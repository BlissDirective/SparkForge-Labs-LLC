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

export type GameId = 'pet-trainer' | 'sort-toy-box' | 'neural-builder' | 'agent-architect' | 'bias-detective'
  | 'data-detective' | 'robot-vacuum' | 'camera-quest' | 'chatbot-builder' | 'emoji-decoder'
  | 'code-blocks' | 'my-first-ai-app' | 'future-forge' | 'ai-or-not';
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
  | 'bias-case' | 'bias-stakeholder-interview'
  // ═══ FL-Lite Games (27 new content types) ═══
  // Data Detective
  | 'dataset-scenario' | 'anomaly-explanation' | 'data-concept-card'
  // Robot Vacuum
  | 'room-layout' | 'rule-challenge' | 'vacuum-learn-card'
  // Camera Quest
  | 'hunt-item' | 'cv-concept-explanation' | 'hunt-theme'
  // Chatbot Builder
  | 'conversation-template' | 'personality-script' | 'chatbot-challenge'
  // Emoji Decoder
  | 'emoji-puzzle' | 'nlp-fun-fact' | 'emoji-cultural-variant'
  // Code Blocks
  | 'programming-challenge' | 'code-hint' | 'code-solution-feedback'
  // My First AI App
  | 'app-category' | 'app-power-description' | 'app-idea'
  // Future Forge
  | 'world-scenario' | 'capability-mapping' | 'impact-narrative'
  // AI or Not
  | 'capability-scenario' | 'timeline-assessment' | 'evidence-explanation';

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
  queueId?: string; // Present when saveToQueue=true and content saved to admin review pipeline
}

// ================================================================
// REQUEST VALIDATION
// ================================================================

export const AIContentRequestSchema = z.object({
  gameId: z.enum([
    'pet-trainer', 'sort-toy-box', 'neural-builder', 'agent-architect', 'bias-detective',
    'data-detective', 'robot-vacuum', 'camera-quest', 'chatbot-builder', 'emoji-decoder',
    'code-blocks', 'my-first-ai-app', 'future-forge', 'ai-or-not',
  ]),
  contentType: z.enum([
    'pet-training-category', 'pet-novel-category',
    'sort-criterion', 'sort-shape-config',
    'neural-challenge', 'neural-test-dataset',
    'agent-mission', 'agent-themed-pack',
    'bias-case', 'bias-stakeholder-interview',
    // FL-Lite
    'dataset-scenario', 'anomaly-explanation', 'data-concept-card',
    'room-layout', 'rule-challenge', 'vacuum-learn-card',
    'hunt-item', 'cv-concept-explanation', 'hunt-theme',
    'conversation-template', 'personality-script', 'chatbot-challenge',
    'emoji-puzzle', 'nlp-fun-fact', 'emoji-cultural-variant',
    'programming-challenge', 'code-hint', 'code-solution-feedback',
    'app-category', 'app-power-description', 'app-idea',
    'world-scenario', 'capability-mapping', 'impact-narrative',
    'capability-scenario', 'timeline-assessment', 'evidence-explanation',
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

  // ═══════ FL-LITE GAME PROMPT TEMPLATES (27 new) ═══════

  // Data Detective
  'dataset-scenario': (ageBand) =>
    `Create a data investigation case for a data detective game. Include: title, description, 5 data items (label + numeric value), ` +
    `one flagged data point (anomaly/bias/error), question asking which data point is suspicious, ` +
    `correctIndex (0-4), explanation, and explanationKids (for younger learners). ` +
    `Anomaly types: outlier, bias, measurement error, fabricated data, survivorship bias, correlation error. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "description": "...", "data": [{ "label": "...", "value": N, "flagged": bool }], "question": "...", "correctIndex": N, "explanation": "...", "explanationKids": "..." }`,

  'anomaly-explanation': (ageBand, ctx) =>
    `Explain why the data anomaly "${ctx?.anomalyType || 'outlier'}" in the dataset "${ctx?.title || 'data'}" is problematic for AI training. ` +
    `Provide an explanation and a simplified version for younger learners. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "explanation": "...", "explanationKids": "...", "realWorldExample": "..." }`,

  'data-concept-card': (ageBand) =>
    `Create a learn card about a data quality concept for kids. Topics: anomaly detection, bias, sampling, correlation vs causation, survivorship bias, Simpson's paradox. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "emoji": "...", "description": "...", "example": "..." }`,

  // Robot Vacuum
  'room-layout': (ageBand) =>
    `Design a 6x6 grid room for a robot vacuum game. Include: title, emoji, walls (blocked cells as [row,col] pairs), ` +
    `furniture (position + emoji), dirt spots (cells to clean), charger position, and optimal step count. ` +
    `Room difficulty should match age band: A=simple with few obstacles, B=moderate, C=complex maze-like. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "emoji": "...", "walls": [[r,c],...], "furniture": [{"pos":[r,c],"emoji":"..."},...], "dirt": [[r,c],...], "charger": [r,c], "optimalSteps": N }`,

  'rule-challenge': (ageBand) =>
    `Create a challenge goal for a robot vacuum rule-building game. The robot uses IF-THEN rules with conditions (See dirt, See wall, Battery low, Path clear, At charger, Dirt nearby) ` +
    `and actions (Move forward, Turn left, Turn right, Clean, Go to charger, Turn around). ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "goal": "...", "constraints": "...", "hint": "...", "difficulty": "easy|medium|hard" }`,

  'vacuum-learn-card': (ageBand) =>
    `Create a learn card about AI agent concepts for a robot vacuum game. Topics: IF-THEN rules, sensor types, rule priority, coverage algorithms, efficiency metrics. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Camera Quest
  'hunt-item': (ageBand) =>
    `Create a scavenger hunt item for a computer vision game. Include: text description of what to find, emoji, category (color|shape|abstract), ` +
    `difficulty (1-3), simulated AI confidence (0-100), hintA (for kids), hintC (technical CV concept). ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "text": "Something ...", "emoji": "...", "category": "...", "difficulty": N, "simConfidence": N, "hintA": "...", "hintC": "..." }`,

  'cv-concept-explanation': (ageBand, ctx) =>
    `Explain the computer vision concept "${ctx?.concept || 'object detection'}" for a children's educational game. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "concept": "...", "explanation": "...", "realWorldUse": "...", "funFact": "..." }`,

  'hunt-theme': (ageBand, ctx) =>
    `Create a themed scavenger hunt session called "${ctx?.theme || 'Nature Walk'}" with 8 hunt items for a CV game. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "theme": "...", "description": "...", "items": [{ "text": "...", "emoji": "...", "category": "...", "difficulty": N, "simConfidence": N, "hintA": "...", "hintC": "..." }] }`,

  // Chatbot Builder
  'conversation-template': (ageBand, ctx) =>
    `Create a chatbot conversation template about "${ctx?.topic || 'customer service'}". Include 6-10 nodes forming a conversation tree. ` +
    `Each node: id, text (bot message), responses array (label + nextId). Terminal nodes have empty responses. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "name": "...", "emoji": "...", "description": "...", "nodes": [{ "id": "...", "text": "...", "responses": [{ "label": "...", "nextId": "..." }] }] }`,

  'personality-script': (ageBand) =>
    `Create a chatbot personality with a unique voice. Include: name, emoji, style description, example greetings (3), and response tone rules. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "name": "...", "emoji": "...", "style": "...", "greetings": ["..."], "rules": ["..."] }`,

  'chatbot-challenge': (ageBand) =>
    `Create a chatbot building challenge. Include: title, description, check criteria (what the bot structure must have), and reward points. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "description": "...", "descriptionC": "...", "criteria": "...", "reward": N }`,

  // Emoji Decoder
  'emoji-puzzle': (ageBand) =>
    `Create an emoji decoding puzzle. Include: emoji sequence (3-5 emojis with +/=/→ connectors), correct answer, 2 wrong answers, ` +
    `AI interpretation (funny literal reading), funFact (for young learners), funFactB (NLP detail for older). ` +
    `Difficulty: easy (concrete) | medium (abstract) | tricky (idioms/culture). ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "emojis": "...", "difficulty": "...", "category": "...", "correctAnswer": "...", "wrongAnswers": ["..."], "aiInterpretation": "...", "funFact": "...", "funFactB": "..." }`,

  'nlp-fun-fact': (ageBand, ctx) =>
    `Create an NLP fun fact related to the topic "${ctx?.topic || 'language processing'}". ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "fact": "...", "factB": "...", "topic": "..." }`,

  'emoji-cultural-variant': (ageBand) =>
    `Create a cross-cultural emoji interpretation challenge. Show how the same emoji means different things in different cultures. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "emoji": "...", "meaning1": { "culture": "...", "meaning": "..." }, "meaning2": { "culture": "...", "meaning": "..." }, "nlpLesson": "..." }`,

  // Code Blocks
  'programming-challenge': (ageBand) =>
    `Create a visual block programming challenge. Include: title, category (sequence|conditional|loop|function|algorithm), ` +
    `description, palette blocks (id, type, label), correct block sequence, output steps, and pseudocode. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "category": "...", "description": "...", "palette": [{ "id": "...", "type": "...", "label": "..." }], "correctSequence": ["..."], "outputSteps": ["..."], "pseudocode": "..." }`,

  'code-hint': (_ageBand, ctx) =>
    `Create a 3-level progressive hint for the programming challenge "${ctx?.challengeTitle || 'challenge'}". ` +
    `Level 1: vague nudge. Level 2: structural hint. Level 3: near-answer. ` +
    `Return as JSON: { "hints": ["...", "...", "..."] }`,

  'code-solution-feedback': (ageBand, ctx) =>
    `Generate feedback for a ${ctx?.correct ? 'correct' : 'incorrect'} solution to "${ctx?.challengeTitle || 'challenge'}". ` +
    `If correct: celebrate and explain why it works. If incorrect: explain what went wrong without giving the answer. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "message": "...", "explanation": "...", "tip": "..." }`,

  // My First AI App
  'app-category': (ageBand) =>
    `Create a new AI app category for a "build your first AI app" game. Include: title, emoji, descriptions for 3 age bands, and a color hex. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "emoji": "...", "description": "...", "descriptionB": "...", "descriptionC": "...", "color": "#..." }`,

  'app-power-description': (ageBand, ctx) =>
    `Create an AI capability/power for an app builder game. Power: "${ctx?.powerName || 'new capability'}". ` +
    `Include descriptions for 3 age bands and a technical label. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "emoji": "...", "description": "...", "descriptionB": "...", "descriptionC": "...", "techLabel": "..." }`,

  'app-idea': (ageBand, ctx) =>
    `Generate a creative AI app concept that uses the capabilities: ${ctx?.powers || 'Computer Vision, NLP'}. ` +
    `Target audience: ${ctx?.audience || 'kids'}. Category: ${ctx?.category || 'helper'}. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "name": "...", "tagline": "...", "description": "...", "howItWorks": "..." }`,

  // Future Forge
  'world-scenario': (ageBand) =>
    `Create a real-world AI problem scenario for a "design the future" game. Include: title, problem description (normal + simple), ` +
    `correct AI capabilities needed (from: vision, language, robotics, prediction, processing, safety), bonus capability, ` +
    `and impact text (normal + simple). Topic should be current and relevant. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "problem": "...", "problemSimple": "...", "correctCapabilities": ["..."], "bonusCapability": "...", "impactText": "...", "impactTextSimple": "..." }`,

  'capability-mapping': (ageBand, ctx) =>
    `Explain why the AI capabilities ${ctx?.capabilities || '["vision", "robotics"]'} are needed for the scenario "${ctx?.scenario || 'ocean cleanup'}". ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "explanations": [{ "capability": "...", "why": "..." }], "synergy": "..." }`,

  'impact-narrative': (ageBand, ctx) =>
    `Write a short narrative (3-4 sentences) about the positive impact of using AI capabilities ${ctx?.capabilities || '["vision"]'} for "${ctx?.scenario || 'problem'}". ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "narrative": "...", "statistic": "...", "timeframe": "..." }`,

  // AI or Not
  'capability-scenario': (ageBand) =>
    `Create a "Can AI do this?" scenario. Include: title, emoji, description (normal + B-band), ` +
    `answer (now|soon|scifi), explanation (normal + B-band), and fun fact. ` +
    `Balance realism — don't make all scenarios "now". Include genuine "soon" and "scifi" items. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "emoji": "...", "description": "...", "descriptionB": "...", "answer": "now|soon|scifi", "explanation": "...", "explanationB": "...", "funFact": "..." }`,

  'timeline-assessment': (ageBand) =>
    `Create an AI technology timeline challenge. Pick a specific AI capability and place it on a timeline: ` +
    `"possible now" / "5-10 years" / "20+ years" / "unlikely ever". Include evidence for the placement. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "capability": "...", "timeline": "...", "evidence": ["..."], "currentState": "..." }`,

  'evidence-explanation': (ageBand, ctx) =>
    `Explain why AI ${ctx?.canDo ? 'CAN' : 'CANNOT'} "${ctx?.capability || 'do this task'}". ` +
    `Provide 3 evidence points and a conclusion. ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "conclusion": "...", "evidence": ["...", "...", "..."], "nuance": "..." }`,
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
  maxPerGamePerSession: 15, // Increased from 5 for FL-Lite multi-round games
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
