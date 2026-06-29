// ════════════════════════════════════════════════════════════════
// AI TUTOR CONTEXT — State Management & Memory System
// ════════════════════════════════════════════════════════════════
// Provides global state for the AI Tutor including:
// - Chat open/close state
// - Conversation memory (persisted to localStorage)
// - Expression/mood state
// - Context awareness (current page, game, lab)
// - Safety filtering

'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { TutorExpression } from './AITutorAvatar';
import type { ChatMessage } from './AITutorChat';
import { usePathname } from 'next/navigation';
import { useActiveChild } from '@/hooks/useChildren';
import { useGuideStore } from '@/stores/guideStore';
import {
  filterInput,
  generateTutorResponse,
  type TutorContext,
} from './ai-tutor-engine';

interface AITutorState {
  isChatOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  expression: TutorExpression;
  context: TutorContext;
  conversationCount: number;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string) => void;
  clearChat: () => void;
  setExpression: (e: TutorExpression) => void;
  setContext: (c: Partial<TutorContext>) => void;
}

const AITutorContext = createContext<AITutorState | null>(null);

export function useAITutor() {
  const ctx = useContext(AITutorContext);
  if (!ctx) throw new Error('useAITutor must be used within AITutorProvider');
  return ctx;
}

// localStorage key with child ID isolation
function getStorageKey(childId: string): string {
  return `sparkforge-tutor-messages-${childId}`;
}

// Load persisted messages
function loadMessages(childId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getStorageKey(childId));
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((m: ChatMessage) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    }
  } catch { /* ignore */ }
  return [];
}

// Save messages
function saveMessages(childId: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    // Only keep last 50 messages
    const toSave = messages.slice(-50);
    localStorage.setItem(getStorageKey(childId), JSON.stringify(toSave));
  } catch { /* storage full, ignore */ }
}

interface AITutorProviderProps {
  children: React.ReactNode;
}

export function AITutorProvider({ children }: AITutorProviderProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expression, setExpressionState] = useState<TutorExpression>('idle');
  const [context, setContextState] = useState<TutorContext>({
    currentPage: 'dashboard',
    childAge: 10,
    childLevel: 1,
  });
  const [conversationCount, setConversationCount] = useState(0);

  const pathname = usePathname() ?? '';
  const activeChild = useActiveChild();
  const childId = activeChild?.id ?? 'anonymous';
  const expressionTimeout = useRef<NodeJS.Timeout | null>(null);

  // Audit §3.6: rebind the persisted guide store to the active child so its
  // personalization/conversation/turn-count don't bleed across children on a
  // shared device. Uses the real child id (null when anonymous), not the
  // 'anonymous' display fallback.
  useEffect(() => {
    useGuideStore.getState().bindToChild(activeChild?.id ?? null);
  }, [activeChild?.id]);

  // Load persisted messages when child changes
  useEffect(() => {
    const loaded = loadMessages(childId);
    setMessages(loaded);
    setConversationCount(loaded.filter((m) => m.role === 'user').length);
  }, [childId]);

  // Auto-save messages
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(childId, messages);
    }
  }, [messages, childId]);

  // Auto-detect page context
  useEffect(() => {
    let page: string = 'dashboard';
    if (pathname.includes('/arcade')) page = 'arcade';
    else if (pathname.includes('/labs')) page = 'labs';
    else if (pathname.includes('/progress')) page = 'progress';
    else if (pathname.includes('/game')) page = 'game';
    else if (pathname.includes('/home')) page = 'home';

    setContextState((prev) => ({
      ...prev,
      currentPage: page,
      childAge: activeChild?.age_band === 'A' ? 8 : activeChild?.age_band === 'B' ? 12 : 14,
      childLevel: activeChild?.level ?? 1,
      childName: activeChild?.display_name,
    }));
  }, [pathname, activeChild]);

  // Auto-idle expression after speaking
  const setExpression = useCallback((e: TutorExpression) => {
    setExpressionState(e);
    if (expressionTimeout.current) clearTimeout(expressionTimeout.current);
    if (e === 'speaking' || e === 'excited') {
      expressionTimeout.current = setTimeout(() => {
        setExpressionState('idle');
      }, 3000);
    }
  }, []);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    setExpression('happy');
  }, [setExpression]);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setExpression('idle');
  }, [setExpression]);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      if (!prev) setExpression('happy');
      else setExpression('idle');
      return !prev;
    });
  }, [setExpression]);

  const sendMessage = useCallback(
    async (content: string) => {
      // Safety filter
      const filterResult = filterInput(content);
      if (!filterResult.allowed) {
        const safetyMsg: ChatMessage = {
          id: `safety-${Date.now()}`,
          role: 'tutor',
          content: filterResult.message,
          timestamp: new Date(),
          context: 'safety',
          expression: 'thinking',
        };
        setMessages((prev) => [...prev, safetyMsg]);
        setExpression('thinking');
        return;
      }

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: filterResult.filtered,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setConversationCount((c) => c + 1);

      // Show thinking
      setIsLoading(true);
      setExpression('thinking');

      // Generate response (simulated async)
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

      const response = generateTutorResponse(filterResult.filtered, context);

      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: 'tutor',
        content: response.text,
        timestamp: new Date(),
        context: response.context,
        expression: response.expression,
      };

      setMessages((prev) => [...prev, tutorMsg]);
      setExpression(response.expression);
      setIsLoading(false);
    },
    [context, setExpression]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationCount(0);
    localStorage.removeItem(getStorageKey(childId));
  }, [childId]);

  const setContext = useCallback((c: Partial<TutorContext>) => {
    setContextState((prev) => ({ ...prev, ...c }));
  }, []);

  return (
    <AITutorContext.Provider
      value={{
        isChatOpen,
        messages,
        isLoading,
        expression,
        context,
        conversationCount,
        openChat,
        closeChat,
        toggleChat,
        sendMessage,
        clearChat,
        setExpression,
        setContext,
      }}
    >
      {children}
    </AITutorContext.Provider>
  );
}
