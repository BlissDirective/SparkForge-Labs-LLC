// ════════════════════════════════════════════════════
// GUIDE STORE — Phase 5: AI Guide Avatar state management
// 10th Zustand store — manages guide visibility, conversation, voice, preferences
// ════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export type AvatarConcept = 'orb' | 'fox' | 'drone' | 'spark' | 'nova';
export type GuideContext = 'cockpit' | 'lab' | 'game' | 'profile' | 'settings';
export type GuideVisualState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'celebrating';
export type GuideMood = 'neutral' | 'excited' | 'encouraging' | 'curious' | 'proud';

export interface GuideMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface GuideState {
  // Visibility & Position
  visible: boolean;
  minimized: boolean;
  context: GuideContext;
  labId: number | null;
  gameId: string | null;

  // Visual / Animation State
  visualState: GuideVisualState;
  mood: GuideMood;
  audioLevel: number; // 0-1, drives audio-reactive animations

  // Conversation
  messages: GuideMessage[];
  isStreaming: boolean;
  streamingContent: string;
  conversationId: string | null;

  // Voice
  /**
   * @deprecated Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore.
   * Use `cockpitStore.voiceEnabled` instead. This field remains as a backward-compat mirror —
   * the cockpitStore subscribe-bridge keeps it in sync.
   */
  voiceEnabled: boolean;
  voiceInputActive: boolean;
  ttsPlaying: boolean;

  // User Preferences (persisted)
  preferredName: string;
  avatarConcept: AvatarConcept;
  voiceSpeed: 'slow' | 'normal' | 'fast';
  autoGreet: boolean;

  // Tier tracking
  guideTurnsToday: number;
  guideTurnsResetDate: string;

  // UX-ENH-006 (Max): Inline context hints. Brief text bubble
  // rendered near the avatar when the child stalls on a lab / game.
  // Distinct from the chat panel — lower friction, auto-dismisses.
  hintVisible: boolean;
  hintText: string | null;
  hintAnchor: 'avatar' | 'top-center' | 'bottom-center';
  hintExpiresAt: number | null;
  /** Last context/key combination the user actually dismissed, so
   *  repeat stalls don't re-nudge until context actually changes. */
  lastDismissedHintKey: string | null;

  // Actions
  show: () => void;
  hide: () => void;
  toggle: () => void;
  minimize: () => void;
  setContext: (ctx: GuideContext, labId?: number, gameId?: string) => void;
  setVisualState: (state: GuideVisualState) => void;
  setMood: (mood: GuideMood) => void;
  setAudioLevel: (level: number) => void;
  addMessage: (msg: GuideMessage) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (delta: string) => void;
  setConversationId: (id: string | null) => void;
  /**
   * @deprecated Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore.
   * Use `cockpitStore.setVoiceEnabled(value)`.
   */
  setVoiceEnabled: (enabled: boolean) => void;
  setVoiceInputActive: (active: boolean) => void;
  setTtsPlaying: (playing: boolean) => void;
  setPreferredName: (name: string) => void;
  setAvatarConcept: (concept: AvatarConcept) => void;
  setVoiceSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  setAutoGreet: (greet: boolean) => void;
  incrementTurns: () => void;
  resetTurnsIfNeeded: () => void;
  /** UX-ENH-006: show an inline context hint. ttlMs default 8000. */
  showHint: (text: string, opts?: { ttlMs?: number; anchor?: 'avatar' | 'top-center' | 'bottom-center'; key?: string }) => void;
  /** UX-ENH-006: dismiss the current hint (user clicked X or clicked avatar). */
  dismissHint: (key?: string) => void;
}

const today = () => new Date().toISOString().split('T')[0];

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      // Defaults
      visible: false,
      minimized: false,
      context: 'cockpit' as GuideContext,
      labId: null,
      gameId: null,
      visualState: 'idle' as GuideVisualState,
      mood: 'neutral' as GuideMood,
      audioLevel: 0,
      messages: [],
      isStreaming: false,
      streamingContent: '',
      conversationId: null,
      voiceEnabled: false,
      voiceInputActive: false,
      ttsPlaying: false,
      preferredName: '',
      avatarConcept: 'orb' as AvatarConcept,
      voiceSpeed: 'normal' as const,
      autoGreet: true,
      guideTurnsToday: 0,
      guideTurnsResetDate: today(),

      // UX-ENH-006 defaults
      hintVisible: false,
      hintText: null,
      hintAnchor: 'avatar' as const,
      hintExpiresAt: null,
      lastDismissedHintKey: null,

      // Actions
      show: () => set({ visible: true, minimized: false }),
      hide: () => set({ visible: false }),
      toggle: () => set(s => ({ visible: !s.visible })),
      minimize: () => set({ minimized: true }),

      setContext: (ctx, labId, gameId) => set({
        context: ctx,
        labId: labId ?? null,
        gameId: gameId ?? null,
      }),

      setVisualState: (visualState) => set({ visualState }),
      setMood: (mood) => set({ mood }),
      setAudioLevel: (audioLevel) => set({ audioLevel: Math.max(0, Math.min(1, audioLevel)) }),

      addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
      clearMessages: () => set({ messages: [], conversationId: null, streamingContent: '' }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setStreamingContent: (streamingContent) => set({ streamingContent }),
      appendStreamingContent: (delta) => set(s => ({ streamingContent: s.streamingContent + delta })),
      setConversationId: (conversationId) => set({ conversationId }),

      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setVoiceInputActive: (voiceInputActive) => set({ voiceInputActive }),
      setTtsPlaying: (ttsPlaying) => set({ ttsPlaying }),

      setPreferredName: (preferredName) => set({ preferredName }),
      setAvatarConcept: (avatarConcept) => set({ avatarConcept }),
      setVoiceSpeed: (voiceSpeed) => set({ voiceSpeed }),
      setAutoGreet: (autoGreet) => set({ autoGreet }),

      incrementTurns: () => {
        const state = get();
        state.resetTurnsIfNeeded();
        set(s => ({ guideTurnsToday: s.guideTurnsToday + 1 }));
      },

      resetTurnsIfNeeded: () => {
        const state = get();
        const currentDate = today();
        if (state.guideTurnsResetDate !== currentDate) {
          set({ guideTurnsToday: 0, guideTurnsResetDate: currentDate });
        }
      },

      showHint: (text, opts) => {
        const state = get();
        const key = opts?.key ?? null;
        // Suppress if the user just dismissed this same context+key.
        if (key && state.lastDismissedHintKey === key) return;
        const ttlMs = opts?.ttlMs ?? 8000;
        set({
          hintVisible: true,
          hintText: text,
          hintAnchor: opts?.anchor ?? 'avatar',
          hintExpiresAt: Date.now() + ttlMs,
        });
      },

      dismissHint: (key) => set({
        hintVisible: false,
        hintText: null,
        hintExpiresAt: null,
        lastDismissedHintKey: key ?? null,
      }),
    }),
    {
      name: 'sparkforge-guide',
      partialize: (state) => ({
        preferredName: state.preferredName,
        avatarConcept: state.avatarConcept,
        voiceSpeed: state.voiceSpeed,
        autoGreet: state.autoGreet,
        voiceEnabled: state.voiceEnabled,
        guideTurnsToday: state.guideTurnsToday,
        guideTurnsResetDate: state.guideTurnsResetDate,
      }),
    }
  )
);

// ═══ SELECTOR HOOKS (PERF-HIGH-001 Opt C) ═══
//
// Named bundle used by GuideChatPanel. Covers exactly the 16 fields
// the panel renders / calls — anything added outside this bundle
// won't trigger a panel re-render.
//
// NOTE: if a consumer needs a different subset, prefer a narrower
// inline selector rather than extending this bundle. Keeping it
// consumer-shaped avoids the "dumping ground" anti-pattern where
// bundles grow until useShallow defeats its own purpose.
export function useGuideChat() {
  return useGuideStore(
    useShallow((s) => ({
      visible: s.visible,
      minimized: s.minimized,
      messages: s.messages,
      isStreaming: s.isStreaming,
      streamingContent: s.streamingContent,
      voiceEnabled: s.voiceEnabled,
      conversationId: s.conversationId,
      context: s.context,
      labId: s.labId,
      gameId: s.gameId,
      show: s.show,
      hide: s.hide,
      minimize: s.minimize,
      toggle: s.toggle,
      addMessage: s.addMessage,
      setStreaming: s.setStreaming,
      setStreamingContent: s.setStreamingContent,
      appendStreamingContent: s.appendStreamingContent,
      setConversationId: s.setConversationId,
      setVisualState: s.setVisualState,
      incrementTurns: s.incrementTurns,
    })),
  );
}
