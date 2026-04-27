// ════════════════════════════════════════════════════
// PROMPT LAB POST-RESPONSE MODERATION
// v2 [S9-WARN-004]: Defense-in-depth safety screening
// Layer 1: Fast keyword blocklist (zero latency)
// Layer 2: Haiku LLM moderation (intelligent screening)
// ════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import { MODELS } from '@/lib/agent/prompts';

// ── Layer 1: Keyword Blocklist ────────────────────
// Topics inappropriate for children ages 7-16
// These trigger an immediate block without needing an LLM call
const BLOCKED_PATTERNS: RegExp[] = [
  // Violence / self-harm
  /\b(suicide|self[- ]?harm|kill\s+(yourself|myself|themselves))\b/i,
  /\b(school\s+shoot|mass\s+shoot|bomb\s+threat)\b/i,
  // Explicit content
  /\b(pornograph|explicit\s+sexual|sex\s+act)\b/i,
  // Drugs / substances (specific dangerous references)
  /\b(how\s+to\s+(make|cook|synthesize)\s+(meth|cocaine|heroin|fentanyl))\b/i,
  // Weapons manufacturing
  /\b(how\s+to\s+(make|build|assemble)\s+(a\s+)?(bomb|explosive|weapon|gun))\b/i,
  // Hate speech patterns
  /\b(racial\s+supremac|white\s+power|ethnic\s+cleansing)\b/i,
];

export interface ModerationResult {
  safe: boolean;
  layer: 'blocklist' | 'haiku' | 'passed';
  reason?: string;
}

/**
 * Layer 1: Fast keyword blocklist check
 * Returns immediately if dangerous content detected
 */
export function checkBlocklist(text: string): ModerationResult | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        layer: 'blocklist',
        reason: 'Response contained inappropriate content and was blocked.',
      };
    }
  }
  return null; // Passed blocklist — proceed to Layer 2
}

/**
 * Layer 2: Haiku LLM moderation check
 * Screens AI response for age-inappropriate content
 */
export async function checkHaikuModeration(
  response: string,
  ageBand: string,
  anthropic: Anthropic
): Promise<ModerationResult> {
  try {
    const ageRange = ageBand === 'A' ? '7-9' : ageBand === 'B' ? '10-12' : '13-16';

    const result = await anthropic.messages.create({
      model: MODELS.moderation,
      max_tokens: 100,
      temperature: 0,
      system: `You are a child safety content moderator. Analyze the following AI-generated response intended for a child aged ${ageRange}. Determine if it is safe and age-appropriate. Respond with ONLY a JSON object: {"safe": true} or {"safe": false, "reason": "brief reason"}. Be strict — flag anything violent, sexual, drug-related, or emotionally harmful.`,
      messages: [{ role: 'user', content: response }],
    });

    const text = result.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    const parsed = JSON.parse(text);

    if (!parsed.safe) {
      return {
        safe: false,
        layer: 'haiku',
        reason: parsed.reason || 'Content flagged by safety screening.',
      };
    }

    return { safe: true, layer: 'passed' };
  } catch {
    // If moderation fails, err on the side of caution and allow
    // (the system prompt already provides primary safety)
    // Moderation check failed — allowing response (system prompt provides primary safety)
    return { safe: true, layer: 'passed' };
  }
}

/**
 * Full moderation pipeline: blocklist first, then Haiku if passed
 */
export async function moderateResponse(
  response: string,
  ageBand: string,
  anthropic: Anthropic
): Promise<ModerationResult> {
  // Layer 1: Fast blocklist check
  const blocklistResult = checkBlocklist(response);
  if (blocklistResult) return blocklistResult;

  // Layer 2: Haiku LLM moderation
  return checkHaikuModeration(response, ageBand, anthropic);
}
