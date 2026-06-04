// ════════════════════════════════════════════════════
// useSafeMessages — preset-only buddy messaging hook
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';

export interface SafeMessageView {
  id: string;
  fromChildId: string;
  toChildId: string;
  templateId: string;
  text: string;
  emoji: string;
  createdAt: string;
  reported: boolean;
  outgoing: boolean;
}

export interface UseSafeMessagesReturn {
  messages: SafeMessageView[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (buddyId: string, templateId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useSafeMessages(childId: string | null, buddyId: string | null): UseSafeMessagesReturn {
  const [messages, setMessages] = useState<SafeMessageView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const qs = buddyId ? `?childId=${childId}&buddyId=${buddyId}` : `?childId=${childId}`;
      const res = await apiFetchResponse(`/api/messages${qs}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages ?? []);
      } else {
        setError(data.error ?? 'Failed to load messages');
      }
    } catch {
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [childId, buddyId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (toBuddyId: string, templateId: string) => {
      if (!childId) return false;
      try {
        const res = await apiFetchResponse('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ childId, buddyId: toBuddyId, templateId }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchMessages();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [childId, fetchMessages],
  );

  return { messages, isLoading, error, sendMessage, refresh: fetchMessages };
}
