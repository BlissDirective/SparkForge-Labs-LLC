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
  | 'code-blocks' | 'my-first-ai-app' | 'future-forge' | 'ai-or-not'
  // ═══ Standard Games (20 new GameIds) ═══
  | 'ai-spy' | 'time-machine' | 'human-vs-machine'
  | 'treat-trainer' | 'neuron-relay' | 'pixel-investigator'
  | 'word-predictor' | 'token-chopper' | 'ai-art-detective'
  | 'tool-picker' | 'data-shield' | 'real-or-fake'
  | 'ethics-courtroom' | 'fool-the-ai' | 'build-classifier'
  | 'prediction-market' | 'sentiment-scanner' | 'lost-in-translation'
  | 'career-explorer' | 'api-explorer'
  // ═══ Lab 11 Flagship Cohort (Stage 11D, April 30, 2026) ═══
  | 'agent-atelier'
  // ═══ Lab 11 Stage 11E (May 1, 2026) — Equip step ═══
  | 'mcp-lab'
  // ═══ Lab 11 Stage 11F (May 1, 2026) — Audit step ═══
  | 'glass-box'
  // ═══ Lab 11 Stage 11G (May 1, 2026) — Constrain step ═══
  | 'harness-forge'
  // ═══ Lab 1 Stage 11A (May 1, 2026) — C5 Pocket Brain ═══
  // No new ContentType entries: Pocket Brain generates its content
  // live in-browser via WebLLM (Doc 2 §H.14). The GameId is included
  // here only so any downstream tooling that enumerates GameIds sees
  // a consistent set.
  | 'pocket-brain';
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
  | 'capability-scenario' | 'timeline-assessment' | 'evidence-explanation'
  // ═══ Standard Games (60 new content types — 3 per game) ═══
  // AI Spy
  | 'spy-scene' | 'spy-item-set' | 'spy-explanation'
  // Time Machine
  | 'timeline-milestone' | 'era-challenge' | 'ai-history-card'
  // Human vs Machine
  | 'hvm-challenge' | 'hvm-comparison' | 'hvm-concept-card'
  // Treat Trainer
  | 'rl-maze' | 'reward-challenge' | 'rl-learn-card'
  // Neuron Relay
  | 'neuron-puzzle' | 'network-challenge' | 'neural-concept-card'
  // Pixel Investigator
  | 'pixel-image' | 'reveal-challenge' | 'cnn-learn-card'
  // Word Predictor
  | 'prediction-sentence' | 'probability-challenge' | 'llm-concept-card'
  // Token Chopper
  | 'token-challenge' | 'tokenizer-puzzle' | 'token-learn-card'
  // AI Art Detective
  | 'art-comparison' | 'detection-challenge' | 'genai-learn-card'
  // Tool Picker
  | 'tool-task' | 'multi-tool-scenario' | 'ai-tool-card'
  // Data Shield
  | 'privacy-scenario' | 'data-dilemma' | 'privacy-learn-card'
  // Real or Fake
  | 'fake-content' | 'detection-tip' | 'misinfo-learn-card'
  // Ethics Courtroom
  | 'ethics-case' | 'stakeholder-perspective' | 'ethics-framework-card'
  // Fool the AI
  | 'classification-item' | 'adversarial-challenge' | 'cv-learn-card'
  // Build Classifier
  | 'training-image-set' | 'test-challenge' | 'ml-pipeline-card'
  // Prediction Market
  | 'ai-prediction' | 'forecast-analysis' | 'futures-learn-card'
  // Sentiment Scanner
  | 'sentiment-challenge' | 'emotion-text' | 'nlp-learn-card'
  // Lost in Translation
  | 'translation-chain' | 'idiom-challenge' | 'mt-learn-card'
  // Career Explorer
  | 'ai-career' | 'skill-matching' | 'career-learn-card'
  // API Explorer
  | 'api-endpoint' | 'request-challenge' | 'api-concept-card'
  // ═══ Lab 11 — Agent Atelier (Stage 11D, April 30, 2026) ═══
  // 3 content types feeding the runtime AI-generated mission slot
  // (12/session) so per-session content tops out at 24 hardcoded + 12
  // AI = 36 units per Doc 2 §A.4 target.
  | 'atelier-mission' | 'atelier-rubric-criterion' | 'atelier-narrative-frame'
  // ═══ Lab 11 — MCP Plug-and-Play Lab (Stage 11E) ═══
  // 3 content types: equipped-mission spec, fresh tool description for
  // the descriptions tutorial, custom-tool spec for advanced kids.
  | 'mcp-equipped-mission' | 'mcp-tool-description' | 'mcp-custom-tool-spec'
  // ═══ Lab 11 — Glass Box Lab (Stage 11F) ═══
  // 3 content types: tutorial-grade synthetic trajectory step example,
  // an issue-spotting puzzle, and a kid-readable audit report template.
  | 'glassbox-trajectory-example' | 'glassbox-issue-puzzle' | 'glassbox-audit-summary'
  // ═══ Lab 11 — Harness Forge (Stage 11G) ═══
  // 3 content types: a fresh stress-test fixture, a kid-readable
  // post-test summary, and a per-rule explanation card.
  | 'harness-stress-fixture' | 'harness-test-summary' | 'harness-rule-card';

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
    // Standard Games
    'ai-spy', 'time-machine', 'human-vs-machine', 'treat-trainer', 'neuron-relay',
    'pixel-investigator', 'word-predictor', 'token-chopper', 'ai-art-detective',
    'tool-picker', 'data-shield', 'real-or-fake', 'ethics-courtroom', 'fool-the-ai',
    'build-classifier', 'prediction-market', 'sentiment-scanner', 'lost-in-translation',
    'career-explorer', 'api-explorer',
    // Lab 11 cohort
    'agent-atelier', 'mcp-lab', 'glass-box', 'harness-forge',
    // Lab 1 - C5 Pocket Brain (no ContentTypes; SLM content generated in-browser)
    'pocket-brain',
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
    // Standard Games
    'spy-scene', 'spy-item-set', 'spy-explanation',
    'timeline-milestone', 'era-challenge', 'ai-history-card',
    'hvm-challenge', 'hvm-comparison', 'hvm-concept-card',
    'rl-maze', 'reward-challenge', 'rl-learn-card',
    'neuron-puzzle', 'network-challenge', 'neural-concept-card',
    'pixel-image', 'reveal-challenge', 'cnn-learn-card',
    'prediction-sentence', 'probability-challenge', 'llm-concept-card',
    'token-challenge', 'tokenizer-puzzle', 'token-learn-card',
    'art-comparison', 'detection-challenge', 'genai-learn-card',
    'tool-task', 'multi-tool-scenario', 'ai-tool-card',
    'privacy-scenario', 'data-dilemma', 'privacy-learn-card',
    'fake-content', 'detection-tip', 'misinfo-learn-card',
    'ethics-case', 'stakeholder-perspective', 'ethics-framework-card',
    'classification-item', 'adversarial-challenge', 'cv-learn-card',
    'training-image-set', 'test-challenge', 'ml-pipeline-card',
    'ai-prediction', 'forecast-analysis', 'futures-learn-card',
    'sentiment-challenge', 'emotion-text', 'nlp-learn-card',
    'translation-chain', 'idiom-challenge', 'mt-learn-card',
    'ai-career', 'skill-matching', 'career-learn-card',
    'api-endpoint', 'request-challenge', 'api-concept-card',
    // Lab 11 - Agent Atelier
    'atelier-mission', 'atelier-rubric-criterion', 'atelier-narrative-frame',
    // Lab 11 - MCP Plug-and-Play Lab
    'mcp-equipped-mission', 'mcp-tool-description', 'mcp-custom-tool-spec',
    // Lab 11 - Glass Box Lab
    'glassbox-trajectory-example', 'glassbox-issue-puzzle', 'glassbox-audit-summary',
    // Lab 11 - Harness Forge
    'harness-stress-fixture', 'harness-test-summary', 'harness-rule-card',
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

  // ═══════ STANDARD GAME PROMPT TEMPLATES (60 new) ═══════

  // AI Spy
  'spy-scene': (ageBand, ctx) =>
    `Generate an AI Spy scene for SparkForge educational game. Create a scene set in ${ctx?.setting || 'a modern home'} containing 4-6 items. ` +
    `Each item: name, isAI (boolean), simpleExplanation (1-2 sentences), technicalExplanation (1-2 sentences). Mix of AI and non-AI items (~50/50). ` +
    `${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "title": "...", "emoji": "...", "items": [{ "name": "...", "isAI": true/false, "simpleExplanation": "...", "technicalExplanation": "..." }] }`,

  'spy-item-set': (ageBand) =>
    `Generate 6 items for an AI spy game — 3 that use AI and 3 that don't. Each: name, emoji, isAI, simpleExplanation, technicalExplanation. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "items": [...] }`,

  'spy-explanation': (ageBand, ctx) =>
    `Explain how "${ctx?.item || 'a smart speaker'}" uses AI technology. Give a simple and technical version. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "simple": "...", "technical": "..." }`,

  // Time Machine
  'timeline-milestone': (ageBand) =>
    `Generate an AI history milestone. Include: year, title, description (simple + technical), and significance. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "year": N, "title": "...", "desc": "...", "descC": "...", "significance": "..." }`,

  'era-challenge': (ageBand, ctx) =>
    `Create a quiz about AI developments in the ${ctx?.era || '2010s'}. 3 questions with 4 options each. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "era": "...", "questions": [{ "question": "...", "options": ["..."], "answer": N, "explanation": "..." }] }`,

  'ai-history-card': (ageBand) =>
    `Create a learn card about an AI history topic: pioneers, breakthroughs, milestones, or future directions. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "...", "funFact": "..." }`,

  // Human vs Machine
  'hvm-challenge': (ageBand) =>
    `Create a human vs AI challenge. Include: prompt, type (math|creativity|empathy|speed|pattern|humor), AI answer, AI thinking time (ms), ` +
    `humanAdvantage, aiAdvantage. ${AGE_BAND_CONTEXT[ageBand]} Return as JSON with full challenge structure.`,

  'hvm-comparison': (ageBand, ctx) =>
    `Compare human and AI abilities for the task: "${ctx?.task || 'writing poetry'}". ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "task": "...", "humanStrength": "...", "aiStrength": "...", "winner": "human|ai|tie", "explanation": "..." }`,

  'hvm-concept-card': (ageBand) =>
    `Create a learn card about human-AI collaboration. Topics: complementary strengths, augmentation, automation, creativity, judgment. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Treat Trainer
  'rl-maze': (ageBand) =>
    `Design a grid maze for a reinforcement learning game. Include: size (7-11), walls (as [row,col] pairs), start, goal, difficulty, description. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "name": "...", "size": N, "walls": [[r,c],...], "start": [r,c], "goal": [r,c], "difficulty": "..." }`,

  'reward-challenge': (ageBand) =>
    `Create a reward function challenge for RL. Describe a scenario where the agent needs specific reward tuning to succeed. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "scenario": "...", "optimalRewards": { "toward": N, "away": N, "wall": N, "goal": N }, "explanation": "..." }`,

  'rl-learn-card': (ageBand) =>
    `Create a learn card about reinforcement learning: agents, rewards, policies, exploration, convergence. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Neuron Relay
  'neuron-puzzle': (ageBand) =>
    `Create a neural network puzzle. Include: neuron count (3-8), connections, target activation zone, optimal weights, hint. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "neurons": N, "target": [min, max], "optimalWeights": [...], "hint": "...", "difficulty": "..." }`,

  'network-challenge': (ageBand) =>
    `Create a challenge about neural network behavior: pattern recognition, signal propagation, or weight adjustment. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "description": "...", "question": "...", "answer": "...", "explanation": "..." }`,

  'neural-concept-card': (ageBand) =>
    `Create a learn card about neural networks: neurons, weights, activation functions, layers, training. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Pixel Investigator
  'pixel-image': (ageBand) =>
    `Create an image guessing round. Include: emoji representation, 3 multiple-choice options, correct answer, 5 reveal levels with clues. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "emoji": "...", "choices": ["..."], "answer": "...", "reveals": [{ "level": N, "clue": "..." }], "difficulty": "..." }`,

  'reveal-challenge': (ageBand) =>
    `Create a challenge about how CNNs process images at different resolutions. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "question": "...", "answer": "...", "explanation": "..." }`,

  'cnn-learn-card': (ageBand) =>
    `Create a learn card about CNNs: convolution, pooling, feature maps, classification layers. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Word Predictor
  'prediction-sentence': (ageBand) =>
    `Create a next-word prediction round. Include: sentence with blank, 4-6 prediction options with confidence %, correct answer, explanation. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "sentence": "...", "options": [{ "word": "...", "confidence": N }], "answer": "...", "explanation": "...", "explanationC": "..." }`,

  'probability-challenge': (ageBand) =>
    `Create a challenge about probability distributions in language models. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "question": "...", "answer": "...", "explanation": "..." }`,

  'llm-concept-card': (ageBand) =>
    `Create a learn card about language models: tokens, prediction, transformers, attention, training data. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Token Chopper
  'token-challenge': (ageBand) =>
    `Create a tokenization challenge. Include: input text, challenge description, expected token count, hint, validation criteria. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "text": "...", "challenge": "...", "expectedTokens": N, "hint": "...", "difficulty": "..." }`,

  'tokenizer-puzzle': (ageBand) =>
    `Create a puzzle about how tokenizers split text. Show surprising tokenization results. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "input": "...", "tokens": ["..."], "surprise": "...", "explanation": "..." }`,

  'token-learn-card': (ageBand) =>
    `Create a learn card about tokenization: BPE, subword splitting, vocabulary, token costs. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // AI Art Detective
  'art-comparison': (ageBand) =>
    `Create an AI vs human art detection round. Include: art description, isAI boolean, style, detection clue (simple + technical). ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "description": "...", "isAI": true/false, "style": "...", "clue": "...", "clueC": "..." }`,

  'detection-challenge': (ageBand) =>
    `Create a challenge about identifying AI-generated art. Focus on telltale signs. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "question": "...", "answer": "...", "explanation": "..." }`,

  'genai-learn-card': (ageBand) =>
    `Create a learn card about generative AI: diffusion models, GANs, style transfer, prompt engineering. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Tool Picker
  'tool-task': (ageBand) =>
    `Create a task scenario for an AI tool matching game. Include: task description, correct tool (calculator|search|code|writer|translator|image-gen), explanation. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "text": "...", "correctTool": "...", "why": "...", "whyC": "..." }`,

  'multi-tool-scenario': (ageBand) =>
    `Create a scenario requiring multiple AI tools in sequence. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "scenario": "...", "tools": ["..."], "order": ["..."], "explanation": "..." }`,

  'ai-tool-card': (ageBand) =>
    `Create a learn card about AI tools: specialization, selection, limitations, combination. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Data Shield
  'privacy-scenario': (ageBand) =>
    `Create a data privacy scenario. Include: title, description, 4 data points (name, shouldProtect boolean, reason, reasonC). ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "dataPoints": [{ "name": "...", "shouldProtect": true/false, "reason": "...", "reasonC": "..." }] }`,

  'data-dilemma': (ageBand) =>
    `Create a data privacy dilemma with no clear right answer. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "scenario": "...", "options": [{ "choice": "...", "pros": "...", "cons": "..." }] }`,

  'privacy-learn-card': (ageBand) =>
    `Create a learn card about data privacy: PII, consent, data minimization, encryption, rights. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Real or Fake
  'fake-content': (ageBand) =>
    `Create a real vs AI-generated content detection round. Include: content text, type (article|review|post|email), isAI, clue, clueC. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "content": "...", "type": "...", "isAI": true/false, "clue": "...", "clueC": "..." }`,

  'detection-tip': (ageBand) =>
    `Create a tip for detecting AI-generated content. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "tip": "...", "example": "...", "technique": "..." }`,

  'misinfo-learn-card': (ageBand) =>
    `Create a learn card about misinformation: deepfakes, synthetic media, fact-checking, media literacy. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Ethics Courtroom
  'ethics-case': (ageBand) =>
    `Create an AI ethics case. Include: title, emoji, scenario (simple + advanced), question, 3 perspectives each with 3 arguments and strength ratings. ` +
    `Topics: fairness, privacy, autonomy, transparency, accountability. Avoid: violence, real individuals. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON with full case structure.`,

  'stakeholder-perspective': (ageBand, ctx) =>
    `Write a stakeholder perspective on the AI ethics case: "${ctx?.caseTitle || 'AI system'}". ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "name": "...", "emoji": "...", "arguments": [{ "text": "...", "textC": "...", "strength": "weak|moderate|strong" }] }`,

  'ethics-framework-card': (ageBand) =>
    `Create a learn card about an ethical framework: utilitarianism, deontology, virtue ethics, care ethics, justice theory. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "...", "example": "..." }`,

  // Fool the AI
  'classification-item': (ageBand) =>
    `Create an item for an AI classification game. Include: emoji, AI label, confidence %, whether the label is wrong, and explanations. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "emoji": "...", "aiLabel": "...", "confidence": N, "isWrong": true/false, "explanation": "...", "explanationC": "..." }`,

  'adversarial-challenge': (ageBand) =>
    `Create an adversarial example challenge: an item that looks like one thing but should be classified differently. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "item": "...", "looksLike": "...", "actuallyIs": "...", "whyConfusing": "..." }`,

  'cv-learn-card': (ageBand) =>
    `Create a learn card about computer vision: classification, object detection, adversarial examples, confidence calibration. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Build Classifier
  'training-image-set': (ageBand, ctx) =>
    `Create a set of 6 training items for the category "${ctx?.category || 'Nature'}". Each: emoji, label, 2 features. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "category": "...", "items": [{ "emoji": "...", "label": "...", "features": ["...", "..."] }] }`,

  'test-challenge': (ageBand) =>
    `Create 3 tricky test items that could confuse a classifier. Each: emoji, trueLabel, whyTricky. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "items": [{ "emoji": "...", "trueLabel": "...", "whyTricky": "..." }] }`,

  'ml-pipeline-card': (ageBand) =>
    `Create a learn card about ML pipelines: data collection, labeling, training, validation, testing, deployment. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Prediction Market
  'ai-prediction': (ageBand) =>
    `Create an AI future prediction for a voting game. Include: question, emoji, time horizon, mock crowd results (yes/no/maybe %), analysis (simple + advanced). ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "question": "...", "emoji": "...", "horizon": "...", "mockResults": { "yes": N, "no": N, "maybe": N }, "analysis": "...", "analysisC": "..." }`,

  'forecast-analysis': (ageBand, ctx) =>
    `Analyze the AI prediction: "${ctx?.prediction || 'Will AI replace doctors?'}". Provide evidence for and against. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "prediction": "...", "forEvidence": ["..."], "againstEvidence": ["..."], "expertConsensus": "..." }`,

  'futures-learn-card': (ageBand) =>
    `Create a learn card about AI forecasting: prediction markets, uncertainty, expert disagreement, trend analysis. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Sentiment Scanner
  'sentiment-challenge': (ageBand) =>
    `Create a sentiment analysis writing challenge. Include: instruction, target sentiment, check criteria, difficulty. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "text": "...", "target": "...", "difficulty": "...", "hint": "..." }`,

  'emotion-text': (ageBand) =>
    `Generate a text sample with specific sentiment for analysis practice. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "text": "...", "sentiment": "positive|negative|neutral|mixed", "keywords": ["..."], "score": N }`,

  'nlp-learn-card': (ageBand) =>
    `Create a learn card about NLP: sentiment analysis, tokenization, word embeddings, transformers. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Lost in Translation
  'translation-chain': (ageBand) =>
    `Create a translation telephone round. Include: original phrase/idiom, 3 intermediate translations with language flags, final back-translation, why it changed, technical explanation. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "original": "...", "steps": ["..."], "final": "...", "why": "...", "whyC": "..." }`,

  'idiom-challenge': (ageBand) =>
    `Create a challenge about predicting how an idiom will change through translation. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "idiom": "...", "prediction": "...", "actual": "...", "explanation": "..." }`,

  'mt-learn-card': (ageBand) =>
    `Create a learn card about machine translation: neural MT, encoder-decoder, attention, multilingual models. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // Career Explorer
  'ai-career': (ageBand) =>
    `Create an AI career for a career exploration game. Include: title, emoji, description (simple + technical), 3 required skills, 3 distractors. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "...", "descriptionC": "...", "skills": ["..."], "distractors": ["..."] }`,

  'skill-matching': (ageBand, ctx) =>
    `Create a skill-matching quiz for the AI career "${ctx?.career || 'ML Engineer'}". ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "career": "...", "questions": [{ "skill": "...", "isRequired": true/false, "explanation": "..." }] }`,

  'career-learn-card': (ageBand) =>
    `Create a learn card about AI careers: paths, skills, education, industry sectors, emerging roles. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // API Explorer
  'api-endpoint': (ageBand) =>
    `Create a simulated AI API endpoint for an API explorer game. Include: name, HTTP method, path, description, parameters, sample response. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "name": "...", "method": "GET|POST", "path": "/api/ai/...", "description": "...", "params": [...], "sampleResponse": {...} }`,

  'request-challenge': (ageBand) =>
    `Create an API challenge: construct the right request to get a specific response from an AI endpoint. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "endpoint": "...", "goal": "...", "correctParams": {...}, "explanation": "..." }`,

  'api-concept-card': (ageBand) =>
    `Create a learn card about APIs: REST, HTTP methods, JSON, status codes, authentication, rate limiting. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "title": "...", "emoji": "...", "description": "..." }`,

  // ─── Lab 11 — Agent Atelier (Stage 11D) ────────────────────────
  // Three content types feeding the runtime AI-generated mission
  // slot: a fresh mission spec, additional rubric criteria, and
  // narrative framing copy. Hardcoded missions cover 8x3=24; AI
  // generates up to 12 more per session for variety.

  'atelier-mission': (ageBand) =>
    `Create a kid-safe mission for an AI-agent-team-builder game. The kid will pick specialists ` +
    `(Researcher, Writer, Planner, Critic, Coder, Translator, Summarizer, etc.) and wire them up ` +
    `to solve this mission. The mission must require at least 3 specialists wired together to ` +
    `solve. ${AGE_BAND_CONTEXT[ageBand]} Return as JSON: ` +
    `{ "title": "...", "prompt": "...", "difficulty": "easy|medium|hard", ` +
    `"expectedOutput": "text|list|number|plan|code", "parAgentCount": 3, ` +
    `"rubric": [{"criterion": "...", "weight": 1}, ...] }`,

  'atelier-rubric-criterion': (ageBand) =>
    `Create one short rubric criterion (under 80 chars) that a Critic agent could check on a ` +
    `kid's atelier-team output. Should be specific and observable, not vague. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "criterion": "...", "weight": 1 }`,

  'atelier-narrative-frame': (ageBand) =>
    `Write a one-paragraph kid-safe narrative framing for an Agent Atelier mission, situating it ` +
    `in a real-life scenario (school, family, hobby, neighborhood). Should make the kid want to ` +
    `solve it. ${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "frame": "...", "hook": "..." }`,

  // ─── Lab 11 — MCP Plug-and-Play Lab (Stage 11E) ───────────────

  'mcp-equipped-mission': (ageBand) =>
    `Create a kid-safe mission for an MCP Plug-and-Play Lab game. The kid will load a starter ` +
    `team of agents and attach tools (calculator, calendar, dictionary, web-fetch, etc.) to ` +
    `their input ports. Mission must REQUIRE at least 2 tools to solve well. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: ` +
    `{ "title": "...", "prompt": "...", "difficulty": "easy|medium|hard", ` +
    `"starterTeam": ["agent_id", ...], "recommendedTools": ["tool_id", ...], ` +
    `"forbiddenTools": ["tool_id", ...], "parToolCount": 2, ` +
    `"rubric": [{"criterion": "...", "weight": 1}, ...] }`,

  'mcp-tool-description': (ageBand) =>
    `Write TWO descriptions for the same kid-safe AI tool — one VAGUE description that would ` +
    `make an agent use it incorrectly, and one CLEAR description that would make the agent use ` +
    `it well. Used in the Stage 11E "Descriptions Matter" tutorial. ${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "toolName": "...", "vague": "...", "clear": "...", "vagueOutcome": "...", "clearOutcome": "..." }`,

  'mcp-custom-tool-spec': (ageBand) =>
    `Design a brand-new kid-safe agent tool not in the standard catalog. It should be specific, ` +
    `useful, and have an input + output type. ${AGE_BAND_CONTEXT[ageBand]} Return as JSON: ` +
    `{ "id": "...", "name": "...", "blurb": "...", "category": "math|time|language|web|creative|data|utility", ` +
    `"inputType": "text|list|number|plan|code|tool_request", ` +
    `"outputType": "text|list|number|plan|code|tool_request", ` +
    `"description": "...", "sideEffect": "read-only|sandboxed|cached-fetch|network", "emoji": "..." }`,

  // ─── Lab 11 — Glass Box Lab (Stage 11F) ───────────────────────

  'glassbox-trajectory-example': (ageBand) =>
    `Write a tutorial-grade kid-safe example of one trajectory step. Show what the agent saw as ` +
    `inputs, what it produced as outputs, and a one-sentence summary. ${AGE_BAND_CONTEXT[ageBand]} ` +
    `Return as JSON: { "agentName": "...", "summary": "...", "inputs": { "...": "..." }, "outputs": { "...": "..." } }`,

  'glassbox-issue-puzzle': (ageBand) =>
    `Create a kid-safe audit puzzle: a 4-step trajectory snippet where exactly 1 of the issue ` +
    `categories applies (missing-input, unused-output, tool-misuse, redundant-step, no-critic, ` +
    `or short-loop). The kid reads the trajectory and identifies which category. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: ` +
    `{ "trajectory": [{ "step": 1, "agent": "...", "summary": "..." }, ...], ` +
    `"correctCategory": "missing-input|unused-output|tool-misuse|redundant-step|no-critic|short-loop", ` +
    `"explanation": "..." }`,

  'glassbox-audit-summary': (ageBand) =>
    `Write a kid-readable one-paragraph audit summary that explains what was good and what was ` +
    `weak about a trajectory. Should encourage iteration without being harsh. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "headline": "...", "good": "...", "improve": "...", "encouragement": "..." }`,

  // ─── Lab 11 — Harness Forge (Stage 11G) ───────────────────────

  'harness-stress-fixture': (ageBand) =>
    `Create a kid-safe stress-test prompt designed to challenge ONE specific safety-harness layer ` +
    `(filter, validator, or monitor). The prompt should look like a normal user request but contain ` +
    `the trap (e.g., embedded PII for filter, ambiguous criteria for validator, or loop-bait phrasing ` +
    `for monitor). ${AGE_BAND_CONTEXT[ageBand]} Return as JSON: ` +
    `{ "label": "...", "prompt": "...", "targetLayer": "filter|validator|monitor", ` +
    `"unharnessedOutcome": "...", "expectedKeywords": ["...", ...] }`,

  'harness-test-summary': (ageBand) =>
    `Write a kid-readable one-paragraph summary of a harness stress test result. Mention what ` +
    `the harness caught, what it missed, and one suggestion for improving the configuration. ` +
    `${AGE_BAND_CONTEXT[ageBand]} Return as JSON: { "headline": "...", "caught": "...", "missed": "...", "suggestion": "..." }`,

  'harness-rule-card': (ageBand) =>
    `Write a kid-readable explanation card for one harness rule. Include the rule label, when it ` +
    `fires, an example of what it catches, and an analogy to something familiar (door lock, ` +
    `seatbelt, etc.). ${AGE_BAND_CONTEXT[ageBand]} Return as JSON: ` +
    `{ "label": "...", "layer": "filter|validator|monitor", "fires": "...", "example": "...", "analogy": "..." }`,
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

/**
 * Async worker-offloaded sibling of `validateContentSafety`.
 * T12 PERF-MED-004 (Opt A): runs PII redaction + forbidden-topic
 * scan off the main thread so the cockpit Canvas stays at 60 fps
 * during bulk content validation (admin review, batch generation).
 *
 * Falls back to main-thread execution when Workers are unavailable.
 * The API is async regardless — call sites never branch.
 */
export async function validateContentSafetyAsync(
  content: unknown,
): Promise<{ safe: boolean; reason?: string; sanitized: string }> {
  const str = JSON.stringify(content);
  // Import at call-site so this module stays tree-shakable on the
  // server bundle (workers cannot run there).
  const { getHeavyComputeClient } = await import('./workers/heavyCompute.client');
  const api = getHeavyComputeClient();
  return api.filterContentSafety(str);
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
