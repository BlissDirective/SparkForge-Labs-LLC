// POST /api/ai/generate-content — AI content generation for flagship + FL-Lite games
// Phase E: Server-side Claude API calls for dynamic game content.
// Phase E+: Integrated with admin content_queue for review/approval pipeline.
// Phase F+: Extended for 9 FL-Lite games (27 content types, 9 world mappings).
// See: flagship-game-content-audit(04.06.2026).md, flagship-lite-game-content-audit(04.08.2026).md
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { apiSuccess, apiError, parseBody, requireAuth, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  AIContentRequestSchema,
  buildPrompt,
  buildSystemPrompt,
  sanitizeContent,
  validateContentSafety,
  type AIContentResponse,
  type ContentType,
} from '@/lib/ai-content-generator';
import { z } from 'zod';

// Extended schema: optional saveToQueue flag for admin curation
const ExtendedRequestSchema = AIContentRequestSchema.extend({
  saveToQueue: z.boolean().optional().default(false),
});

// Map contentType → pipeline content type for content_queue
const CONTENT_TYPE_MAP: Record<string, string> = {
  // Flagship games
  'pet-training-category': 'flagship_pet_category',
  'pet-novel-category': 'flagship_pet_category',
  'sort-criterion': 'flagship_sort_criterion',
  'sort-shape-config': 'flagship_sort_criterion',
  'neural-challenge': 'flagship_neural_challenge',
  'neural-test-dataset': 'flagship_neural_challenge',
  'agent-mission': 'flagship_agent_mission',
  'agent-themed-pack': 'flagship_agent_mission',
  'bias-case': 'flagship_bias_case',
  'bias-stakeholder-interview': 'flagship_bias_case',
  // FL-Lite games
  'dataset-scenario': 'fll_data_detective',
  'anomaly-explanation': 'fll_data_detective',
  'data-concept-card': 'fll_data_detective',
  'room-layout': 'fll_robot_vacuum',
  'rule-challenge': 'fll_robot_vacuum',
  'vacuum-learn-card': 'fll_robot_vacuum',
  'hunt-item': 'fll_camera_quest',
  'cv-concept-explanation': 'fll_camera_quest',
  'hunt-theme': 'fll_camera_quest',
  'conversation-template': 'fll_chatbot_builder',
  'personality-script': 'fll_chatbot_builder',
  'chatbot-challenge': 'fll_chatbot_builder',
  'emoji-puzzle': 'fll_emoji_decoder',
  'nlp-fun-fact': 'fll_emoji_decoder',
  'emoji-cultural-variant': 'fll_emoji_decoder',
  'programming-challenge': 'fll_code_blocks',
  'code-hint': 'fll_code_blocks',
  'code-solution-feedback': 'fll_code_blocks',
  'app-category': 'fll_my_first_ai_app',
  'app-power-description': 'fll_my_first_ai_app',
  'app-idea': 'fll_my_first_ai_app',
  'world-scenario': 'fll_future_forge',
  'capability-mapping': 'fll_future_forge',
  'impact-narrative': 'fll_future_forge',
  'capability-scenario': 'fll_ai_or_not',
  'timeline-assessment': 'fll_ai_or_not',
  'evidence-explanation': 'fll_ai_or_not',
};

// Map gameId → world number for content_queue
const GAME_WORLD_MAP: Record<string, number> = {
  // Flagship games
  'pet-trainer': 2,
  'sort-toy-box': 2,
  'neural-builder': 3,
  'prompt-lab': 4,
  'agent-architect': 5,
  'bias-detective': 6,
  // FL-Lite games
  'data-detective': 2,
  'robot-vacuum': 5,
  'camera-quest': 7,
  'chatbot-builder': 8,
  'emoji-decoder': 8,
  'code-blocks': 9,
  'my-first-ai-app': 9,
  'future-forge': 10,
  'ai-or-not': 10,
};

export async function POST(req: NextRequest) {
  // Graceful 503 if ANTHROPIC_API_KEY missing
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(
      'AI content generation is not configured. Add ANTHROPIC_API_KEY to .env.local.',
      503,
      'SERVICE_UNAVAILABLE'
    );
  }

  // Rate limit
  const limited = applyRateLimit(req, 'ai-generate', undefined, RATE_LIMITS.promptLab);
  if (limited) return limited;

  // Auth check
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  // Parse and validate request body
  const parsed = await parseBody(req, ExtendedRequestSchema);
  if (!parsed.success) return parsed.response;

  const { gameId, contentType, ageBand, context, saveToQueue } = parsed.data;

  try {
    // Build the prompt from game-specific templates
    const userPrompt = buildPrompt(contentType as ContentType, ageBand, context);
    const systemPrompt = buildSystemPrompt(ageBand);

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extract text response
    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return apiError('AI returned no text content', 500, 'AI_EMPTY_RESPONSE');
    }

    // Parse JSON from response (handle markdown code blocks)
    let rawText = textBlock.text.trim();
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) rawText = jsonMatch[1].trim();

    let content: unknown;
    try {
      content = JSON.parse(rawText);
    } catch {
      return apiError('AI returned invalid JSON', 500, 'AI_INVALID_JSON');
    }

    // Safety check
    const safety = validateContentSafety(content);
    if (!safety.safe) {
      return apiError(`Content safety check failed: ${safety.reason}`, 422, 'CONTENT_UNSAFE');
    }

    // Sanitize PII
    const sanitized = JSON.parse(sanitizeContent(JSON.stringify(content)));
    const generatedAt = new Date().toISOString();

    // Optionally save to content_queue for admin review
    let queueId: string | null = null;
    if (saveToQueue) {
      try {
        const supabase = await createServerSupabase();
        const pipelineType = CONTENT_TYPE_MAP[contentType] || 'game_scenario';
        const world = GAME_WORLD_MAP[gameId] || 1;
        const title = typeof sanitized === 'object' && sanitized !== null && 'title' in sanitized
          ? String((sanitized as Record<string, unknown>).title)
          : `${gameId} — ${contentType}`;

        const { data: inserted } = await supabase
          .from('content_queue')
          .insert({
            title,
            type: pipelineType,
            target_age_band: ageBand,
            world,
            difficulty: 'intermediate',
            content_json: { content_body: JSON.stringify(sanitized), game_id: gameId, content_type: contentType },
            safety_check: { passed: safety.safe, flags: [], flesch_kincaid_grade: 0, notes: 'Flagship AI content', recommendation: 'auto-generated' },
            source_urls: [],
            status: 'pending_review',
            generated_at: generatedAt,
          })
          .select('id')
          .single();

        queueId = inserted?.id || null;
      } catch {
        // Non-blocking: queue save failure doesn't block content delivery
      }
    }

    const response: AIContentResponse = {
      content: sanitized,
      cached: false,
      generatedAt,
      ...(queueId ? { queueId } : {}),
    };

    return apiSuccess(response);
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    return apiError(`AI generation failed: ${errMessage}`, 500, 'AI_GENERATION_ERROR');
  }
}
