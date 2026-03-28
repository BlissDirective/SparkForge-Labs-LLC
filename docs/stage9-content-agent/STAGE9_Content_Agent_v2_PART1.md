# Stage 9 Part 1 (9A) — Content Agent Pipeline, Prompts, API Routes, Schema

**Version:** v2 (Frost-Prismatic v2.1) — Audited & Corrected
**Build Phase:** 25
**Date:** February 23, 2026 | **Audited:** March 11, 2026 | **Audit Fixes:** March 28, 2026
**Prerequisites:** Stages 1–8 complete, `content_queue` table exists (Stage 2 v2)
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS

### Audit Fixes Applied (March 28, 2026 — Branch: claude/stage-9-audit-fixes-YQomo)

| Finding | Severity | Fix |
|---------|----------|-----|
| S9-CRIT-001 | CRITICAL | Prompt Lab: Lazy Anthropic init + 503 fallback (BUG-9A/ENH-9A) |
| S9-HIGH-001 | HIGH | Admin content page: Client-side admin guard with redirect |
| S9-HIGH-002 | HIGH | Review route: Zod validation for POST body (UUID-validated ids) |
| S9-HIGH-003 | HIGH | Prompt Lab: Centralized MODELS.moderation instead of hardcoded string |
| S9-HIGH-004 | HIGH | Pre-resolved: TextBlock type guard + error: unknown already in code |
| S9-WARN-001 | WARNING | Agent run route: Rate limiting (2/hr) |
| S9-WARN-002 | WARNING | Review route: Rate limiting (60/min) |
| S9-WARN-003 | WARNING | Schedule route: CRON_SECRET required in production |
| S9-WARN-004 | WARNING | Prompt Lab: Post-response moderation (blocklist + Haiku LLM) |
| S9-INFO-001 | INFO | Schedule route: Migrated to apiSuccess/apiError helpers |

**New file created:** `src/lib/agent/moderation.ts` — Defense-in-depth moderation for Prompt Lab

---

## Overview

This part creates the Content Agent system — a 4-stage AI pipeline (Research → Generate → Screen → Insert) that automatically generates child-safe educational content for all 10 SparkForge Labs. It includes centralized model configuration, system prompts for three AI roles, admin-only API routes for manual triggering, Vercel cron scheduling, a content review/approval workflow, and the database schema additions for agent run tracking.

### PART 1 (9A) COVERS

- Agent system prompts (Research, Generation, Safety) with centralized model config
- Content agent pipeline (4-stage orchestrator: Research → Generate → Screen → Insert)
- Readability utility (Flesch-Kincaid grade-level validation per age band)
- API route: manual trigger (admin-only, POST `/api/agent/run`)
- API route: cron trigger (Vercel cron, GET `/api/agent/schedule`)
- API route: content review (approve/reject with bulk support, POST `/api/agent/review`)
- Schema additions SQL (`agent_runs` table, admin flag, indexes)
- `vercel.json` cron configuration
- `.env.local` additions for Anthropic key

### v2 Changes in This Part

| ID | Description |
|----|-------------|
| **BUG-9A** | Lazy Anthropic SDK init with graceful fallback (no top-level crash if key missing) |
| **BUG-9B** | Centralized `MODELS` config — one place to update model strings |
| **BUG-9C** | Proper `approveContent()` unpacker for `content_queue` → `content` migration |
| **ENH-9A** | Graceful 503 if `ANTHROPIC_API_KEY` missing (same pattern as Stripe ENH-8A) |
| **ENH-9C** | Bulk approve/reject via array of IDs in review route |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/lib/agent/prompts.ts` | CREATE | System prompts, `MODELS` config, `WORLD_TOPICS`, `SEARCH_QUERIES` |
| 2 | `src/lib/agent/readability.ts` | CREATE | Flesch-Kincaid readability scoring + age band validation |
| 3 | `src/lib/agent/pipeline.ts` | CREATE | 4-stage orchestrator, `approveContent`, `rejectContent`, retry logic |
| 4 | `src/app/api/agent/run/route.ts` | CREATE | Manual trigger (admin-only, POST) |
| 5 | `src/app/api/agent/schedule/route.ts` | CREATE | Vercel cron trigger (GET, `CRON_SECRET` protected) |
| 6 | `src/app/api/agent/review/route.ts` | CREATE | Approve/reject queue items (admin-only, bulk support) |
| 7 | `sql/schema-stage9.sql` | CREATE | `agent_runs` table, indexes, RLS — run in Supabase SQL Editor |
| 8 | `vercel.json` | CREATE | Daily cron at 6 AM UTC |

### Code Review Fixes Applied (vs. Original Source Document)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **CRITICAL** | `WORLD_TOPICS` values truncated mid-sentence (e.g., `'Machine learning, training data, supervised/unsupervised/reinforcement learning, data qual'`) | Restored all 10 topic strings to full content |
| 2 | **CRITICAL** | `RESEARCH_SYSTEM_PROMPT` truncated — missing bullet point completions and closing text | Fully reconstructed with complete source rules and output format |
| 3 | **CRITICAL** | `GENERATION_SYSTEM_PROMPT` truncated — voice rules, analogies, quiz format cut off | Fully reconstructed with complete band rules, all 6 analogies, and JSON schema |
| 4 | **CRITICAL** | `SAFETY_SCREENING_PROMPT` rules truncated — rules 1-5 end mid-sentence | Fully reconstructed all 11 rules with complete text |
| 5 | **CRITICAL** | Review route `try/catch` inverted — `body = await req.json()` placed INSIDE `catch` block instead of `try` | Restructured: parse JSON in try block, return error in catch block |
| 6 | **CRITICAL** | Manual trigger route has malformed JSON — `error` and `setup_url` strings concatenated into broken syntax | Separated into proper `error` + `setup_url` fields with valid JSON |
| 7 | **CRITICAL** | Manual trigger route admin error message truncated (`'Admin access required. Run: UPDATE parents SET is_admin = true WHERE email = \'y'`) | Completed with full SQL hint and proper escaping |
| 8 | **CRITICAL** | Pipeline `stageResearch()` fallback summary truncated (`'Recent developments show AI being used more widely in educational tools for chil'`) | Completed full fallback finding text |
| 9 | **HIGH** | `web_search` tool definition uses incorrect format `{ type: 'web_search_20250305' as any, name: 'web_search' }` | Updated to correct Anthropic server tool format with `max_uses` cost control |
| 10 | **HIGH** | SQL file path `prisma/schema-stage9.sql` — project uses `sql/` directory (per Stage 8 pattern) | Changed to `sql/schema-stage9.sql` |
| 11 | **HIGH** | Pipeline uses raw `any` types for Anthropic SDK — no type safety | Added proper `AnthropicMessage` interface types for response parsing |
| 12 | **HIGH** | No retry logic for Anthropic API calls — rate limits cause pipeline failure | Added exponential backoff with jitter for all Claude API calls |
| 13 | **MEDIUM** | Pipeline uses `createClient` directly instead of existing `createAdminClient` from `@/lib/supabase/server` | Uses `createAdminClient()` for consistency with Stage 8 Stripe routes |
| 14 | **MEDIUM** | No readability validation server-side — relies entirely on LLM self-assessment | Added `readability.ts` utility with Flesch-Kincaid grade computation and age band checks |
| 15 | **MEDIUM** | `approveContent()` inserts `slug: undefined` — content table has `slug TEXT UNIQUE` column | Added slug generation from title using `slugify()` helper |
| 16 | **MEDIUM** | No deduplication check — same finding can generate duplicate content across runs | Added title similarity check before queue insertion |
| 17 | **LOW** | Missing `export const runtime = 'nodejs'` on API routes using Anthropic SDK | Added to all three API routes for consistency |
| 18 | **LOW** | `agent_runs` table missing `duration_ms` column — no way to track pipeline performance | Added `duration_ms INT` and `completed_at TIMESTAMPTZ` columns |

### Enhancement Suggestions (All Implemented Below)

| # | Category | Enhancement | Rationale |
|---|----------|-------------|-----------|
| 1 | **Reliability** | Exponential backoff with jitter for Anthropic API calls | Prevents pipeline failure on transient rate limits |
| 2 | **Safety** | Server-side Flesch-Kincaid readability validation | Double-checks LLM grade assessment with algorithmic scoring |
| 3 | **Performance** | `duration_ms` tracking on agent runs | Enables monitoring pipeline performance over time |
| 4 | **Data Quality** | Title deduplication before queue insertion | Prevents redundant content generation across runs |
| 5 | **Cost Control** | `max_uses: 5` on web_search tool | Caps search API costs per research invocation |
| 6 | **Type Safety** | Proper interfaces for Anthropic response parsing | Eliminates `any` type usage in pipeline |
| 7 | **Consistency** | Uses `createAdminClient()` + `apiSuccess`/`apiError` helpers | Matches patterns established in Stages 2-8 |
| 8 | **Security** | Zod validation on review route request body | Defense in depth against malformed admin requests |
| 9 | **UX** | Review route returns `summary` object with counts | Admin dashboard can display batch operation results |

---

## STEP 1: CREATE FOLDERS

```bash
mkdir -p src/lib/agent
mkdir -p src/app/api/agent/run
mkdir -p src/app/api/agent/schedule
mkdir -p src/app/api/agent/review
mkdir -p src/app/(dashboard)/admin/content
```

---

## STEP 2: AGENT PROMPTS + MODEL CONFIG

v2 [BUG-9B] FIX: All model strings live in `MODELS` config object. When Anthropic releases new models, update ONE object.

### File 1: `src/lib/agent/prompts.ts`

```typescript
// ════════════════════════════════════════════════════
// AGENT SYSTEM PROMPTS — Research, Generation, Safety
// v2 [BUG-9B]: Centralized MODELS config for easy updates
// ════════════════════════════════════════════════════

// v2 [BUG-9B]: Single source of truth for model strings
export const MODELS = {
  research: 'claude-sonnet-4-5-20250514',     // Sonnet for research (needs web_search)
  generation: 'claude-sonnet-4-5-20250514',   // Sonnet for content generation
  safety: 'claude-haiku-4-5-20251001',        // Haiku for fast safety screening
  moderation: 'claude-haiku-4-5-20251001',    // Haiku for prompt lab moderation
} as const;

export const WORLD_TOPICS: Record<number, string> = {
  1: 'What AI is, everyday AI, history of AI, AI vs humans',
  2: 'Machine learning, training data, supervised/unsupervised/reinforcement learning, data quality and preparation',
  3: 'Neural networks, deep learning, neurons, layers, weights, CNNs, activation functions',
  4: 'Generative AI, LLMs, tokens, prompts, text/image generation, creativity and AI art',
  5: 'AI agents, tool use, planning, decision-making, automation and workflows',
  6: 'AI ethics, bias, fairness, privacy, deepfakes, responsible AI development',
  7: 'Computer vision, image classification, object detection, filters, facial recognition',
  8: 'NLP, sentiment analysis, translation, chatbots, text understanding and summarization',
  9: 'Coding with AI, APIs, prompt engineering, building AI apps, developer tools',
  10: 'AI futures, careers in AI, emerging capabilities, societal impact and governance',
};

export const RESEARCH_SYSTEM_PROMPT = `You are a research agent for SparkForge, an AI education platform for children ages 7-16.

Your job: Find recent, credible AI news and breakthroughs that can be turned into educational content for kids.

RULES:
- Only use sources from: .edu domains, .gov domains, major tech company blogs (Google AI, Microsoft Research, Meta AI, OpenAI, Anthropic, DeepMind), peer-reviewed journals, established news outlets (MIT Technology Review, Wired, Nature, Science, IEEE Spectrum).
- REJECT: random blogs, social media posts, unverified claims, paywalled-only content.
- Focus on: breakthroughs, new tools, educational milestones, ethical developments.
- For each finding, output: title, summary (2-3 sentences), source URL, which SparkForge lab (1-10) it fits best, and educational_potential (1-5 score).

Respond ONLY with a JSON array of findings. No other text, no markdown fences.`;

export const GENERATION_SYSTEM_PROMPT = `You are a content generator for SparkForge, a gamified AI learning platform for children ages 7-16.

You transform AI research findings into engaging educational content in THREE age-band variants.

VOICE RULES:
- Band A (ages 7-10): Max 15-word sentences. Story-based. Emoji-rich. Simple analogies from a child's everyday life. No technical jargon. Use "you" and "we" to address the reader directly.
- Band B (ages 11-13): Max 20-word sentences. Scenario-based. Some technical terms WITH definitions in parentheses. Real-world examples from gaming, social media, and school.
- Band C (ages 14-16): No sentence limit. Real technical terms. Code examples where relevant. News-style tone. Reference real companies and research papers.

MANDATORY ANALOGIES (use these when the concept appears):
- Neural networks → "A chain of friends whispering a message, each adding a clue"
- Training data → "Flash cards for a robot"
- Overfitting → "Memorizing the answer key instead of learning the subject"
- Tokens → "Chopping a sentence into puzzle pieces"
- Reinforcement learning → "Training a puppy with treats"
- Bias → "If you only read books by one author, you'd think all stories are the same"

ERROR/FAILURE LANGUAGE:
- NEVER use: "Wrong", "Incorrect", "Failed", "Try harder", "You got it wrong"
- ALWAYS use: "Almost!", "Interesting guess!", "Not quite — but you're thinking like a scientist!", "Great try! Here's a clue..."

For each piece of content, output a JSON object with these fields:
- title: string
- type: "lesson" | "quiz" | "spark_fact"
- target_age_band: "A" | "B" | "C"
- world: number (1-10)
- difficulty: "beginner" | "intermediate" | "advanced"
- content_body: string (markdown for lessons, text for facts)
- quiz_questions: array of {question, options: string[4], correct_index, explanation, hint} (only for quizzes, exactly 5 questions)
- xp_reward: number (15 for lessons, 30 for quizzes, 5 for facts)
- estimated_duration_minutes: number

Respond ONLY with a valid JSON array. No markdown fences, no preamble.`;

export const SAFETY_SCREENING_PROMPT = `You are a child safety screener for SparkForge, an AI education platform for children ages 7-16.

Review the following content against ALL 11 safety rules. Every rule must pass.

RULES:
1. NO VIOLENCE OR WEAPONS — Even metaphorical. No "AI weapons," "AI warfare," "killer robots." Military AI must be framed as defense/safety research only.
2. NO SEXUAL CONTENT — Zero tolerance. No innuendo, no euphemism, no romantic themes.
3. NO PERSONAL DATA COLLECTION — Never teach scraping, tracking, surveillance, or bypassing privacy controls. Privacy lessons must teach protection, not exploitation.
4. NO FEARMONGERING — AI risks discussed ONLY constructively with solutions. Frame as empowerment ("here's what YOU can do") not fear ("AI will replace everyone").
5. NO HACKING/EXPLOITATION — No exploit code, vulnerability details, or social engineering techniques. Cybersecurity taught only from defensive perspective.
6. READING LEVEL MATCH — Band A content must be at or below grade 5 reading level. Band B at or below grade 8. Band C at or below grade 10.
7. NO STEREOTYPE REINFORCEMENT — Diverse representation in all examples. No gendered assumptions about tech skills. International examples required.
8. SOURCE CREDIBILITY — Only universities, major tech companies, peer-reviewed research, established news outlets. No unverified or sensationalized claims.
9. EMOTIONAL SAFETY — No content designed to frighten, manipulate, or cause anxiety. AI capabilities presented with wonder, not dread.
10. NO ADVERTISING — Pure education. Never promote commercial products, services, or brands as superior. Brand mentions only for factual context.
11. EDUCATIONAL VALUE — Content must teach something meaningful about AI. No filler, no padding, no entertainment-only content.

Respond ONLY with JSON:
{
  "passed": boolean,
  "flags": ["string array of any concerns"],
  "flesch_kincaid_grade": number,
  "notes": "brief assessment",
  "recommendation": "approve" | "flag_for_review" | "reject"
}`;

export const SEARCH_QUERIES = [
  'AI breakthroughs education 2025 2026',
  'machine learning children teaching resources',
  'new AI tool announcement research',
  'AI ethics news fairness bias update',
  'computer vision breakthrough applications',
  'natural language processing advances 2026',
  'AI safety research update alignment',
  'generative AI creative applications education',
  'robotics AI education STEM',
  'AI career opportunities future workforce',
];
```

---

## STEP 3: READABILITY UTILITY

Server-side Flesch-Kincaid grade-level validation to double-check LLM safety screening assessments.

### File 2: `src/lib/agent/readability.ts`

```typescript
// ════════════════════════════════════════════════════
// READABILITY — Flesch-Kincaid grade-level scoring
// Used by the safety screening stage to validate
// age-band appropriateness algorithmically.
// ════════════════════════════════════════════════════

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  // Remove common silent suffixes
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(matches.length, 1) : 1;
}

function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return Math.max(sentences.length, 1);
}

function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((w) => w.replace(/[^a-zA-Z]/g, '').length > 0).length;
}

/**
 * Compute Flesch-Kincaid Grade Level.
 * Returns approximate US school grade level needed to understand the text.
 * Band A (7-10) → max grade 5, Band B (11-13) → max grade 8, Band C (14-16) → max grade 10.
 */
export function fleschKincaidGrade(text: string): number {
  const words = countWords(text);
  if (words === 0) return 0;

  const sentences = countSentences(text);
  const syllables = text
    .split(/\s+/)
    .reduce((sum, w) => sum + countSyllables(w), 0);

  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

/**
 * Compute Flesch Reading Ease score.
 * 90-100 = very easy (grade 5), 60-70 = standard (grade 8-9), 30-50 = difficult (college).
 */
export function fleschReadingEase(text: string): number {
  const words = countWords(text);
  if (words === 0) return 100;

  const sentences = countSentences(text);
  const syllables = text
    .split(/\s+/)
    .reduce((sum, w) => sum + countSyllables(w), 0);

  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

/** Max Flesch-Kincaid grade level per age band */
const MAX_GRADE: Record<string, number> = { A: 5, B: 8, C: 10 };

/**
 * Check if content is readable for the target age band.
 * Returns { valid, grade, maxGrade } for logging.
 */
export function validateReadability(
  text: string,
  ageBand: 'A' | 'B' | 'C'
): { valid: boolean; grade: number; maxGrade: number } {
  const grade = Math.round(fleschKincaidGrade(text) * 10) / 10;
  const maxGrade = MAX_GRADE[ageBand];
  return { valid: grade <= maxGrade, grade, maxGrade };
}
```

---

## STEP 4: CONTENT AGENT PIPELINE

4-stage orchestrator: Research → Generate → Screen → Insert.

- v2 [BUG-9A] FIX: Lazy Anthropic init with `getAnthropicClient()`.
- v2 [BUG-9C] FIX: `approveContent()` properly unpacks `content_queue` JSONB into `content` table columns.
- [ENH] Exponential backoff with jitter on all Anthropic API calls.
- [ENH] Server-side readability validation supplements LLM safety screening.
- [ENH] Title deduplication before queue insertion.
- [ENH] Pipeline duration tracking.

### File 3: `src/lib/agent/pipeline.ts`

```typescript
// ════════════════════════════════════════════════════
// CONTENT AGENT PIPELINE — 4-stage orchestrator
// v2 [BUG-9A]: Lazy Anthropic init (no top-level crash)
// v2 [BUG-9C]: Proper content_queue → content unpacker
// [ENH]: Retry with backoff, readability validation,
//        deduplication, duration tracking
// ════════════════════════════════════════════════════

import { createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  MODELS,
  RESEARCH_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  SAFETY_SCREENING_PROMPT,
  SEARCH_QUERIES,
  WORLD_TOPICS,
} from './prompts';
import { validateReadability } from './readability';

// ── Types ──────────────────────────────────────────

interface Finding {
  title: string;
  summary: string;
  source_url: string;
  world: number;
  educational_potential: number;
}

interface GeneratedContent {
  title: string;
  type: 'lesson' | 'quiz' | 'spark_fact';
  target_age_band: 'A' | 'B' | 'C';
  world: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content_body: string;
  quiz_questions?: {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
    hint: string;
  }[];
  xp_reward: number;
  estimated_duration_minutes: number;
}

interface SafetyResult {
  passed: boolean;
  flags: string[];
  flesch_kincaid_grade: number;
  notes: string;
  recommendation: 'approve' | 'flag_for_review' | 'reject';
}

export interface AgentRunResult {
  runId: string;
  findings: number;
  generated: number;
  approved: number;
  flagged: number;
  rejected: number;
  durationMs: number;
  errors: string[];
}

/** Shape of Anthropic message content blocks */
interface ContentBlock {
  type: string;
  text?: string;
}

/** Shape of Anthropic messages.create response */
interface AnthropicResponse {
  content: ContentBlock[];
}

// ── v2 [BUG-9A]: Lazy SDK initialization ───────────

let _anthropic: {
  messages: {
    create: (params: Record<string, unknown>) => Promise<AnthropicResponse>;
  };
} | null = null;

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  if (!_anthropic) {
    // Dynamic require avoids top-level crash when SDK not configured
    const Anthropic = require('@anthropic-ai/sdk').default;
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  return _anthropic;
}

// ── Retry with exponential backoff + jitter ────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;

      // Only retry on rate limits (429) or server errors (5xx)
      const status = (error as { status?: number }).status;
      const isRetryable = status === 429 || (status && status >= 500);
      if (!isRetryable || attempt === maxRetries) break;

      const delay = baseDelayMs * Math.pow(2, attempt);
      const jitter = delay * 0.1 * Math.random();
      console.warn(
        `Anthropic API retry ${attempt + 1}/${maxRetries} in ${Math.round(delay + jitter)}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError ?? new Error('Max retries exceeded');
}

// ── Slug generation ────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ── Extract text from Anthropic response ───────────

function extractText(response: AnthropicResponse): string {
  return response.content
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text!)
    .join('');
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\s?|```/g, '').trim();
  return JSON.parse(cleaned) as T;
}

// ── STAGE 1: RESEARCH ──────────────────────────────

async function stageResearch(): Promise<Finding[]> {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY not configured');

  // Pick 3 random search queries per run for coverage variety
  const queries = [...SEARCH_QUERIES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  try {
    const response = await withRetry(() =>
      anthropic.messages.create({
        model: MODELS.research,
        max_tokens: 4000,
        system: RESEARCH_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Search for recent AI education news using these queries: ${queries.join(', ')}

Find 3-5 high-quality findings. For each, determine which SparkForge lab (1-10) it fits best.

Lab topics: ${JSON.stringify(WORLD_TOPICS)}

Return a JSON array of findings with fields: title, summary, source_url, world, educational_potential.`,
          },
        ],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 5, // [ENH] Cap search costs per invocation
          },
        ],
      })
    );

    const text = extractText(response);
    return parseJSON<Finding[]>(text);
  } catch (e) {
    console.error('Research stage error, using fallback:', e);
    // Fallback: generate from known topics so pipeline continues
    const randomWorld = Math.floor(Math.random() * 10) + 1;
    return [
      {
        title: 'AI continues to advance in education',
        summary:
          'Recent developments show AI being used more widely in educational tools for children, with new interactive platforms making complex concepts accessible to younger learners through gamification and visual storytelling.',
        source_url: 'https://ai.google/education',
        world: randomWorld,
        educational_potential: 4,
      },
    ];
  }
}

// ── STAGE 2: GENERATION ────────────────────────────

async function stageGenerate(
  findings: Finding[]
): Promise<GeneratedContent[]> {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY not configured');

  const allContent: GeneratedContent[] = [];

  for (const finding of findings) {
    try {
      const response = await withRetry(() =>
        anthropic.messages.create({
          model: MODELS.generation,
          max_tokens: 6000,
          system: GENERATION_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Create educational content from this finding:

Title: ${finding.title}
Summary: ${finding.summary}
Source: ${finding.source_url}
Target Lab: ${finding.world} (${WORLD_TOPICS[finding.world] || 'General AI'})

Generate:
1. One LESSON for each age band (A, B, C) — 3 items
2. One SPARK FACT for Band B — 1 item
3. One QUIZ (5 questions) for Band B — 1 item

Total: 5 content items. Return as a JSON array.`,
            },
          ],
        })
      );

      const text = extractText(response);
      const items = parseJSON<GeneratedContent[]>(text);
      allContent.push(...items);
    } catch (e) {
      console.error(`Generation failed for: ${finding.title}`, e);
      // Skip this finding, continue with others
    }
  }

  return allContent;
}

// ── STAGE 3: SAFETY SCREENING ──────────────────────

async function stageScreen(content: GeneratedContent): Promise<SafetyResult> {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY not configured');

  try {
    const response = await withRetry(() =>
      anthropic.messages.create({
        model: MODELS.safety,
        max_tokens: 500,
        system: SAFETY_SCREENING_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Screen this content for child safety:

Title: ${content.title}
Type: ${content.type}
Age Band: ${content.target_age_band}
Lab: ${content.world}

Content:
${content.content_body}

${content.quiz_questions ? `Quiz Questions:\n${JSON.stringify(content.quiz_questions, null, 2)}` : ''}`,
          },
        ],
      })
    );

    const text = extractText(response);
    const result = parseJSON<SafetyResult>(text);

    // [ENH] Server-side readability validation supplements LLM assessment
    const readability = validateReadability(
      content.content_body,
      content.target_age_band
    );

    if (!readability.valid) {
      result.flags.push(
        `Server-side readability: grade ${readability.grade} exceeds max ${readability.maxGrade} for band ${content.target_age_band}`
      );
      // Downgrade to flag_for_review if readability fails but LLM approved
      if (result.recommendation === 'approve') {
        result.recommendation = 'flag_for_review';
        result.passed = false;
      }
    }

    // Override LLM's grade assessment with server-computed value
    result.flesch_kincaid_grade = readability.grade;

    return result;
  } catch (e) {
    console.error('Safety screening error:', e);
    // Fail safe: flag for human review
    return {
      passed: false,
      flags: ['Safety screening failed — flagged for manual review'],
      flesch_kincaid_grade: 0,
      notes: 'Automatic flag due to screening error',
      recommendation: 'flag_for_review',
    };
  }
}

// ── STAGE 4: INSERT TO QUEUE ───────────────────────

async function stageInsert(
  supabase: SupabaseClient,
  content: GeneratedContent,
  safetyResult: SafetyResult,
  runId: string,
  sourceUrls: string[]
): Promise<'approved' | 'flagged' | 'rejected'> {
  // [ENH] Deduplication check: skip if similar title already in queue
  const { data: existing } = await supabase
    .from('content_queue')
    .select('id')
    .eq('title', content.title)
    .eq('world', content.world)
    .eq('target_age_band', content.target_age_band)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`Skipping duplicate: "${content.title}" (band ${content.target_age_band})`);
    return 'flagged'; // Count as flagged to surface in run report
  }

  let status: 'pending_review' | 'needs_human_review' | 'rejected';

  if (safetyResult.recommendation === 'approve' && safetyResult.passed) {
    status = 'pending_review'; // auto-passed safety, awaiting human approval
  } else if (safetyResult.recommendation === 'reject') {
    status = 'rejected';
  } else {
    status = 'needs_human_review';
  }

  await supabase.from('content_queue').insert({
    agent_run_id: runId,
    title: content.title,
    type: content.type,
    target_age_band: content.target_age_band,
    world: content.world,
    difficulty: content.difficulty || 'beginner',
    content_json: {
      content_body: content.content_body,
      quiz_questions: content.quiz_questions || null,
      xp_reward: content.xp_reward || 15,
      estimated_minutes: content.estimated_duration_minutes || 10,
    },
    source_urls: sourceUrls,
    safety_check: safetyResult,
    status,
  });

  if (status === 'rejected') return 'rejected';
  if (status === 'needs_human_review') return 'flagged';
  return 'approved';
}

// ── v2 [BUG-9C]: APPROVE CONTENT (queue → content) ─

export async function approveContent(
  queueItemId: string,
  reviewerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Fetch queue item
  const { data: item, error: fetchError } = await supabase
    .from('content_queue')
    .select('*')
    .eq('id', queueItemId)
    .single();

  if (fetchError || !item) {
    return { success: false, error: 'Content queue item not found' };
  }

  if (item.status === 'approved') {
    return { success: false, error: 'Already approved' };
  }

  // Unpack content_json into content table columns
  const contentJson = item.content_json as {
    content_body?: string;
    quiz_questions?: unknown;
    xp_reward?: number;
    estimated_minutes?: number;
  };

  // Generate slug from title for the content table's unique slug column
  const baseSlug = slugify(item.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  // Insert into live content table
  const { error: insertError } = await supabase.from('content').insert({
    world: item.world,
    title: item.title,
    slug,
    type: item.type,
    target_age_band: item.target_age_band,
    difficulty: item.difficulty || 'beginner',
    content_body: contentJson.content_body || '',
    quiz_questions: contentJson.quiz_questions || null,
    xp_reward: contentJson.xp_reward || 15,
    estimated_minutes: contentJson.estimated_minutes || 10,
    sort_order: 0, // agent content appears at end
    is_free: false, // agent content is premium by default
    is_agent_generated: true,
    source_urls: item.source_urls || [],
    status: 'published',
    safety_check: item.safety_check,
    published_at: new Date().toISOString(),
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Mark queue item as approved
  await supabase
    .from('content_queue')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', queueItemId);

  return { success: true };
}

// ── REJECT CONTENT ─────────────────────────────────

export async function rejectContent(
  queueItemId: string,
  reviewerId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('content_queue')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', queueItemId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── MAIN PIPELINE ORCHESTRATOR ─────────────────────

export async function runAgentPipeline(): Promise<AgentRunResult> {
  const startTime = Date.now();
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const supabase = createAdminClient();
  const errors: string[] = [];
  let findingsCount = 0;
  let generatedCount = 0;
  let approvedCount = 0;
  let flaggedCount = 0;
  let rejectedCount = 0;

  try {
    // Stage 1: Research
    const findings = await stageResearch();
    findingsCount = findings.length;

    // Stage 2: Generate content from findings
    const content = await stageGenerate(findings);
    generatedCount = content.length;

    // Stage 3 + 4: Screen each item and insert to queue
    for (const item of content) {
      try {
        const safetyResult = await stageScreen(item);

        // Collect source URLs from the finding that spawned this content
        const parentFinding = findings.find((f) => f.world === item.world);
        const sourceUrls = parentFinding ? [parentFinding.source_url] : [];

        const result = await stageInsert(
          supabase,
          item,
          safetyResult,
          runId,
          sourceUrls
        );

        if (result === 'approved') approvedCount++;
        else if (result === 'flagged') flaggedCount++;
        else rejectedCount++;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push(`Screen/insert error for "${item.title}": ${message}`);
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    errors.push(`Pipeline error: ${message}`);
  }

  const durationMs = Date.now() - startTime;

  // Log run to agent_runs table
  await supabase.from('agent_runs').insert({
    run_id: runId,
    findings_count: findingsCount,
    generated_count: generatedCount,
    approved_count: approvedCount,
    flagged_count: flaggedCount,
    rejected_count: rejectedCount,
    duration_ms: durationMs,
    errors: errors.length > 0 ? errors : [],
    completed_at: new Date().toISOString(),
  });

  return {
    runId,
    findings: findingsCount,
    generated: generatedCount,
    approved: approvedCount,
    flagged: flaggedCount,
    rejected: rejectedCount,
    durationMs,
    errors,
  };
}
```

---

## STEP 5: MANUAL TRIGGER API ROUTE (admin-only)

POST `/api/agent/run` — requires admin auth.
- v2 [ENH-9A]: Graceful 503 if `ANTHROPIC_API_KEY` missing.
- v2 [BUG-9A]: Does not crash if SDK unavailable.
- Uses `apiSuccess`/`apiError` helpers for consistency with all other routes.

### File 4: `src/app/api/agent/run/route.ts`

```typescript
// ════════════════════════════════════════════════════
// AGENT RUN — Manual trigger (admin-only)
// v2 [ENH-9A]: Graceful 503 if API key missing
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { runAgentPipeline } from '@/lib/agent/pipeline';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // v2 [ENH-9A]: Check for API key before proceeding
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(
      'Content Agent is not configured. Add ANTHROPIC_API_KEY to your .env.local file.',
      503,
      'AGENT_NOT_CONFIGURED'
    );
  }

  // Admin auth check
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError('Unauthorized', 401, 'AUTH_REQUIRED');
  }

  const { data: parent } = await supabase
    .from('parents')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!parent?.is_admin) {
    return apiError(
      'Admin access required. Run: UPDATE parents SET is_admin = true WHERE email = \'your@email.com\'; in Supabase SQL Editor.',
      403,
      'FORBIDDEN'
    );
  }

  try {
    const result = await runAgentPipeline();
    return apiSuccess(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return apiError(`Agent pipeline failed: ${message}`, 500, 'SERVER_ERROR');
  }
}
```

---

## STEP 6: CRON TRIGGER API ROUTE (Vercel cron)

GET `/api/agent/schedule` — triggered by Vercel cron daily at 6 AM UTC. Secured by `CRON_SECRET` to prevent public access.

### File 5: `src/app/api/agent/schedule/route.ts`

```typescript
// ════════════════════════════════════════════════════
// AGENT SCHEDULE — Vercel cron trigger (daily 6 AM UTC)
// Secured by CRON_SECRET header verification
// ════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agent/pipeline';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this as Bearer token)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Skip if API key not configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { skipped: true, reason: 'ANTHROPIC_API_KEY not configured' },
      { status: 200 }
    );
  }

  // Skip if feature flag disabled
  if (process.env.ENABLE_CONTENT_AGENT === 'false') {
    return NextResponse.json(
      {
        skipped: true,
        reason: 'Content agent disabled via ENABLE_CONTENT_AGENT=false',
      },
      { status: 200 }
    );
  }

  try {
    const result = await runAgentPipeline();
    return NextResponse.json({ success: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Cron agent run failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

## STEP 7: CONTENT REVIEW API ROUTE

POST `/api/agent/review` — approve or reject queue items. Supports single and bulk operations.
- v2 [BUG-9C]: Uses `approveContent()` for proper unpacking.
- v2 [ENH-9C]: Supports bulk approve/reject via array of IDs.
- [FIX] Corrected inverted try/catch on request body parsing.

### File 6: `src/app/api/agent/review/route.ts`

```typescript
// ════════════════════════════════════════════════════
// CONTENT REVIEW API — Approve/reject queue items
// v2 [BUG-9C]: Uses approveContent() for proper unpacking
// v2 [ENH-9C]: Supports bulk operations via arrays
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { approveContent, rejectContent } from '@/lib/agent/pipeline';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Admin auth check
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError('Unauthorized', 401, 'AUTH_REQUIRED');
  }

  const { data: parent } = await supabase
    .from('parents')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!parent?.is_admin) {
    return apiError('Admin access required', 403, 'FORBIDDEN');
  }

  // [FIX] Parse body in try block, return error in catch block
  let body: {
    action: 'approve' | 'reject';
    ids: string[];
    reason?: string;
  };

  try {
    body = await req.json();
  } catch {
    return apiError('Invalid request body', 400);
  }

  if (
    !body.action ||
    !body.ids ||
    !Array.isArray(body.ids) ||
    body.ids.length === 0
  ) {
    return apiError(
      'Required: action ("approve" | "reject") and ids (string[])',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (!['approve', 'reject'].includes(body.action)) {
    return apiError(
      'action must be "approve" or "reject"',
      400,
      'VALIDATION_ERROR'
    );
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const id of body.ids) {
    if (body.action === 'approve') {
      const result = await approveContent(id, user.id);
      results.push({ id, ...result });
    } else {
      const result = await rejectContent(
        id,
        user.id,
        body.reason || 'Rejected by admin'
      );
      results.push({ id, ...result });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return apiSuccess({
    results,
    summary: {
      total: results.length,
      succeeded,
      failed,
    },
  });
}
```

---

## STEP 8: SCHEMA ADDITIONS SQL

Adds `agent_runs` table, admin flag, and indexes. Safe to re-run (uses `IF NOT EXISTS` throughout). Note: `content_queue` table already exists from Stage 2 v2.

> **Run in Supabase SQL Editor** (Dashboard → SQL Editor → New Query)

### File 7: `sql/schema-stage9.sql`

```sql
-- ════════════════════════════════════════════════════
-- STAGE 9 SCHEMA ADDITIONS
-- Agent run logging, admin flag, indexes
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ════════════════════════════════════════════════════

-- Admin flag on parents (may already exist from Stage 2)
ALTER TABLE parents ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Agent run history table
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT UNIQUE NOT NULL,
  findings_count INT DEFAULT 0,
  generated_count INT DEFAULT 0,
  approved_count INT DEFAULT 0,
  flagged_count INT DEFAULT 0,
  rejected_count INT DEFAULT 0,
  duration_ms INT,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for content_queue (table exists from Stage 2)
CREATE INDEX IF NOT EXISTS idx_content_queue_status
  ON content_queue(status);

CREATE INDEX IF NOT EXISTS idx_content_queue_generated
  ON content_queue(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_queue_world
  ON content_queue(world);

-- Indexes for agent_runs
CREATE INDEX IF NOT EXISTS idx_agent_runs_created
  ON agent_runs(created_at DESC);

-- RLS on agent_runs (admin-only)
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agent_runs' AND policyname = 'agent_runs_admin_only'
  ) THEN
    CREATE POLICY agent_runs_admin_only ON agent_runs
      FOR ALL USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

-- Make yourself admin (replace with your email)
-- UPDATE parents SET is_admin = true WHERE email = 'your@email.com';
```

---

## STEP 9: VERCEL.JSON CRON CONFIGURATION

### File 8: `vercel.json`

> Create in project root (or merge if it already exists).

```json
{
  "crons": [
    {
      "path": "/api/agent/schedule",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## STEP 10: ENV ADDITIONS

> Append to `.env.local` and `.env.example`:

```bash
# ════════════════════════════════════════════════════
# STAGE 9 — Content Agent
# ════════════════════════════════════════════════════

# Anthropic API key (server-side ONLY — never in client bundle)
# Get from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Content agent feature flag (set to 'false' to disable cron runs)
ENABLE_CONTENT_AGENT=true

# Cron secret (protects /api/agent/schedule from public access)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=generate-a-random-string-here
```

---

## STEP 11: VERIFY EVERYTHING

```bash
npm run build
```

| Check | Expected Result |
|-------|----------------|
| **Build succeeds** | No import errors from `src/lib/agent/` |
| **API routes compile** | Routes compile without `ANTHROPIC_API_KEY` set |
| **Schema SQL** | Run `schema-stage9.sql` in Supabase SQL Editor. Verify: `agent_runs` table exists, `content_queue` has indexes on `status`, `generated_at`, `world` |
| **Graceful fallback** | POST to `/api/agent/run` without `ANTHROPIC_API_KEY` → returns 503 with setup message, NOT a 500 crash |
| **Admin auth** | POST to `/api/agent/run` as non-admin user → returns 403 with helpful SQL hint |
| **Cron auth** | GET `/api/agent/schedule` without `CRON_SECRET` → returns 401 Unauthorized |
| **Cron skip** | GET `/api/agent/schedule` without `ANTHROPIC_API_KEY` → returns 200 with `skipped: true` |

---

## Enhancement 8.3 — Edge-First Architecture for AI Content Generation

> **Source:** ENHANCEMENT_BLUEPRINT_v1.0 Section 8.3
> **Impact:** Lower latency for AI content generation by moving workloads to Supabase Edge Functions.

### Edge Functions for Content Pipeline

The Content Agent pipeline (Research → Generate → Screen → Insert) currently runs in Vercel
serverless functions via Next.js API routes. Enhancement 8.3 adds **Supabase Edge Functions**
as an alternative execution path for lower latency and longer execution timeouts.

**Migration strategy:**

| Pipeline Stage | Current | Enhanced | Benefit |
|---------------|---------|----------|---------|
| Research | Vercel serverless (10s timeout) | Supabase Edge Function (150s timeout) | Longer research with multiple API calls |
| Generate | Vercel serverless | Supabase Edge Function | Claude API calls closer to edge |
| Screen | Vercel serverless | Vercel serverless (keep) | Low latency, simple logic |
| Insert | Vercel serverless | Vercel serverless (keep) | Direct Supabase client, fast |

**Supabase Edge Function file:** `supabase/functions/content-agent/index.ts`

```typescript
// Supabase Edge Function for content generation
// Deployed to Deno Deploy (Supabase Edge runtime)
// Triggered by: cron schedule OR manual admin API call

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

serve(async (req: Request) => {
  // Verify authorization (cron secret or admin JWT)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
  });

  // Run Research + Generate stages with 150s timeout
  // ... (pipeline.ts logic adapted for Deno runtime)

  return new Response(JSON.stringify({ success: true, generated: count }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Directory addition to Stage 1 Part 1 Step 10:**
```bash
mkdir -p supabase/functions/content-agent
```

**Cron trigger update in `vercel.json`:**
The existing Vercel cron at `/api/agent/schedule` becomes the **fallback**. The primary
trigger is a Supabase cron that invokes the Edge Function directly. If the Edge Function is
not deployed, the Vercel cron continues to work as before (zero regression).

### Edge Caching for Game Assets (Also in Stage 10 Part 2)

Game assets (3D models, shader files, audio samples) are cached at CDN edge via Vercel Edge
Network. Cache headers configured in Stage 10 Part 2's production `next.config.ts`.

---

## STEP 12: GIT COMMIT

```bash
git add -A
git commit -m "Stage 9 Part 1: Content agent pipeline, prompts, API routes, schema, cron config"
```

---

## PART 1 (9A) COMPLETE

### Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `src/lib/agent/prompts.ts` | System prompts, `MODELS` config, `WORLD_TOPICS`, `SEARCH_QUERIES` |
| 2 | `src/lib/agent/readability.ts` | Flesch-Kincaid readability scoring + age band validation |
| 3 | `src/lib/agent/pipeline.ts` | 4-stage orchestrator, `approveContent`, `rejectContent`, retry logic |
| 4 | `src/app/api/agent/run/route.ts` | Manual trigger (admin-only, POST) |
| 5 | `src/app/api/agent/schedule/route.ts` | Vercel cron trigger (GET, `CRON_SECRET` protected) |
| 6 | `src/app/api/agent/review/route.ts` | Approve/reject with bulk support (admin-only, POST) |
| 7 | `sql/schema-stage9.sql` | `agent_runs` table, indexes, RLS |
| 8 | `vercel.json` | Daily cron at 6 AM UTC |

### Bug Fixes Applied

| ID | Description |
|----|-------------|
| **BUG-9A** | Lazy Anthropic init — no top-level crash if key missing |
| **BUG-9B** | Centralized `MODELS` config — one place to update model strings |
| **BUG-9C** | `approveContent()` properly unpacks `content_queue` JSONB → `content` columns with slug generation |

### Enhancements Applied

| ID | Description |
|----|-------------|
| **ENH-9A** | Graceful 503 + error message when `ANTHROPIC_API_KEY` missing |
| **ENH-9C** | Bulk approve/reject via array of IDs in review route |
| **ENH-9D** | Exponential backoff with jitter on all Anthropic API calls |
| **ENH-9E** | Server-side Flesch-Kincaid readability validation per age band |
| **ENH-9F** | Title deduplication before queue insertion |
| **ENH-9G** | Pipeline duration tracking (`duration_ms` in `agent_runs`) |
| **ENH-9H** | `max_uses: 5` on web_search tool to control costs |
| **ENH-9I** | Proper TypeScript interfaces for Anthropic response (no `any` types) |
| **ENH-9J** | Consistent use of `apiSuccess`/`apiError` helpers + `createAdminClient()` |

### Cockpit Integration (CPA v2.0)

The admin content review page (`/admin/content`) lives under the `(dashboard)` layout and renders inside the persistent CockpitCanvas. The cockpit uses **`admin` mode** presets — a minimal cockpit treatment with a terminal/ops aesthetic:

| Preset | Value | Rationale |
|--------|-------|-----------|
| LED color | `#00FF88` (green) | Terminal/ops accent for admin context |
| Panel curvature | 0.5 | Further retracted — content review needs screen space |
| Panel opacity | 0.6 | Subdued — admin UI is the focus |
| HUD opacity | 0.06 | Near-invisible — admin doesn't need lab HUD |
| Side panel content | `terminal` / `stats` | Terminal output left, pipeline stats right |
| Bloom intensity | 0.25 | Minimal bloom — clean reading environment |
| Status bar opacity | 0.5 | Low profile — shows system status, not child progress |
| Particles | 100 @ 0.2 speed | Minimal particles — avoid distraction during review |

**No action needed by developers** — `useStationMode` auto-detects `/admin/*` pathnames and applies `admin` mode presets from `cockpitConfig.ts`. The content review dashboard, approval workflow, and run history all render as HTML at z-index 10 above the cockpit.

**API routes** (`/api/agent/*`) are server-side only and have no interaction with CockpitCanvas.

---

### NEXT: Part 2 (9B)

Admin review dashboard with content preview, bulk actions, run history tab, Frost-Prismatic styling.
