// ================================================================
// useAIContent — Client hook for AI-generated game content
// ================================================================
// Phase E: Checks localStorage cache first, shows static content
// immediately, merges AI content when ready. "generate" can be
// called manually for on-demand content.
//
// Usage:
//   const { data, isLoading, error, generate } = useAIContent<CategoryData>(
//     'pet-trainer', 'pet-novel-category', ageBand
//   );
//
// See: flagship-game-content-audit(04.06.2026).md Section 6
// ================================================================

import { useState, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import {
  getCacheKey,
  hashContext,
  checkRateLimit,
  recordRequest,
  type GameId,
  type ContentType,
  type AgeBand,
  type AIContentResponse,
} from '@/lib/ai-content-generator';

interface UseAIContentReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  generate: (context?: Record<string, unknown>) => Promise<void>;
  cached: boolean;
  remaining: number;
}

function getFromCache<T>(key: string): { data: T; generatedAt: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setToCache<T>(key: string, data: T, generatedAt: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ data, generatedAt }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function useAIContent<T = unknown>(
  gameId: GameId,
  contentType: ContentType,
  ageBand: AgeBand
): UseAIContentReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [remaining, setRemaining] = useState(5);
  const generatingRef = useRef(false);

  const generate = useCallback(async (context?: Record<string, unknown>) => {
    // Prevent double-fire
    if (generatingRef.current) return;

    // Check rate limit
    const rateCheck = checkRateLimit(gameId);
    if (!rateCheck.allowed) {
      const waitSec = rateCheck.waitMs ? Math.ceil(rateCheck.waitMs / 1000) : 0;
      setError(
        rateCheck.remaining === 0
          ? 'Maximum AI generation requests reached for this session.'
          : `Please wait ${waitSec}s before generating again.`
      );
      return;
    }

    // Check cache first
    const ctxHash = hashContext(context);
    const cacheKey = getCacheKey(gameId, contentType, ageBand, ctxHash);
    const cachedResult = getFromCache<T>(cacheKey);
    if (cachedResult) {
      setData(cachedResult.data);
      setCached(true);
      return;
    }

    // Make API request
    generatingRef.current = true;
    setIsLoading(true);
    setError(null);
    setCached(false);

    try {
      const response = await apiFetch<AIContentResponse<T>>('/api/ai/generate-content', {
        method: 'POST',
        body: JSON.stringify({ gameId, contentType, ageBand, context }),
      });

      setData(response.content);
      setToCache(cacheKey, response.content, response.generatedAt);
      recordRequest(gameId);

      // Update remaining count
      const newCheck = checkRateLimit(gameId);
      setRemaining(newCheck.remaining ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate content';
      setError(message);
    } finally {
      setIsLoading(false);
      generatingRef.current = false;
    }
  }, [gameId, contentType, ageBand]);

  return { data, isLoading, error, generate, cached, remaining };
}

export default useAIContent;
