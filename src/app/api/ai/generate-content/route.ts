// POST /api/ai/generate-content — AI content generation for flagship games
// Phase E: Server-side Claude API calls for dynamic game content.
// See: flagship-game-content-audit(04.06.2026).md Section 6
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { apiSuccess, apiError, parseBody, requireAuth, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import {
  AIContentRequestSchema,
  buildPrompt,
  buildSystemPrompt,
  sanitizeContent,
  validateContentSafety,
  type AIContentResponse,
} from '@/lib/ai-content-generator';

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
  const parsed = await parseBody(req, AIContentRequestSchema);
  if (!parsed.success) return parsed.response;

  const { gameId: _gameId, contentType, ageBand, context } = parsed.data;

  try {
    // Build the prompt from game-specific templates
    const userPrompt = buildPrompt(contentType, ageBand, context);
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

    const response: AIContentResponse = {
      content: sanitized,
      cached: false,
      generatedAt: new Date().toISOString(),
    };

    return apiSuccess(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return apiError(`AI generation failed: ${message}`, 500, 'AI_GENERATION_ERROR');
  }
}
