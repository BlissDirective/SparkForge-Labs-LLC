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
    // Dynamic import alternative: use eslint-disable for require
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
