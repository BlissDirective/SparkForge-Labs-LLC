'use client';

// UX-ENH-006 (Max): Contextual hint bridge
//
// Watches the current guide context + stall state. When the user
// stalls on a lab or game, calls /api/ai/guide with a short prompt
// ("suggest a tiny nudge; one sentence") and pushes the response
// into guideStore as an inline hint (not a full chat open).
//
// Always routes through the existing Claude endpoint — no static
// FAQ branch. Rate-limited by the server (RATE_LIMITS.guide) and by
// the hintKey dedup: once a user dismisses a hint for a given
// (context, labId, gameId), we won't re-nudge until context changes.

import { useCallback, useRef } from 'react';
import { useGuideStore } from '@/stores/guideStore';
import { useActiveChild } from '@/hooks/useChildren';
import { csrfHeader } from '@/lib/api';
import { useStallDetector } from './useStallDetector';

export function useContextualHints(opts?: { stallMs?: number; disabled?: boolean }): void {
  const context = useGuideStore((s) => s.context);
  const labId = useGuideStore((s) => s.labId);
  const gameId = useGuideStore((s) => s.gameId);
  const showHint = useGuideStore((s) => s.showHint);
  const child = useActiveChild();
  const inflightRef = useRef(false);

  const hintKey =
    `${context}:${labId ?? ''}:${gameId ?? ''}`;

  const triggerHint = useCallback(async () => {
    // Only nudge inside labs + games. Dashboard/profile stalls are
    // rarely puzzlement; usually the user stepped away.
    if (context !== 'lab' && context !== 'game') return;
    if (!child?.id) return;
    if (inflightRef.current) return;
    inflightRef.current = true;

    try {
      // Use /api/ai/guide in a short "hint mode" — we pass a
      // concise message and rely on the server-side system prompt
      // (assembleGuidePrompt) to shape the tone for the child's
      // age band. `context` + `labId` + `gameId` + `childProgress`
      // give the model everything needed to tailor the nudge.
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          childId: child.id,
          message:
            'I look a bit stuck. Give me a ONE-sentence nudge to help me figure out the next step — no spoilers, no long explanation.',
          context,
          ageBand: child.age_band,
          labId: labId ?? undefined,
          gameId: gameId ?? undefined,
          childName: child.display_name,
          childProgress: {
            xp: child.xp,
            level: child.level,
            streak: child.streak_count ?? 0,
          },
        }),
      });

      if (!res.ok || !res.body) return;

      // The guide route streams SSE. For hint mode we only need the
      // final assembled text — read the stream to completion and
      // pick out delta chunks. Keep the total capped at ~220 chars.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let text = '';
      const MAX = 220;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const obj = JSON.parse(payload) as { delta?: string; text?: string };
            const chunk = obj.delta ?? obj.text ?? '';
            text += chunk;
            if (text.length >= MAX) break;
          } catch {
            // non-JSON keep-alive line — ignore
          }
        }
        if (text.length >= MAX) break;
      }

      const trimmed = text.trim().slice(0, MAX);
      if (trimmed) {
        showHint(trimmed, { ttlMs: 10_000, key: hintKey });
      }
    } catch (err) {
      console.warn('[guide/hint] failed:', err);
    } finally {
      inflightRef.current = false;
    }
  }, [child, context, labId, gameId, showHint, hintKey]);

  useStallDetector({
    stallMs: opts?.stallMs ?? 15_000,
    disabled: opts?.disabled,
    onStall: triggerHint,
  });
}
