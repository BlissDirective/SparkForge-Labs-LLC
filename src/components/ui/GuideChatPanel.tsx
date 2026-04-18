'use client';

// ════════════════════════════════════════════════════
// GUIDE CHAT PANEL — Phase 5: Glassmorphic conversation overlay
// HTML overlay that persists across all scenes (not R3F)
// ════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import { csrfHeader } from '@/lib/api';
import { motion } from 'motion/react';
import {
  X, Minimize2, Send, Mic, MicOff,
  Volume2, VolumeX, Sparkles,
} from 'lucide-react';
import { useGuideStore, type GuideMessage } from '@/stores/guideStore';
import { useChildStore } from '@/stores/childStore';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';

export default function GuideChatPanel() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    visible, minimized, messages, isStreaming, streamingContent,
    voiceEnabled, conversationId, context, labId, gameId,
    show, hide, minimize, toggle: _toggle,
    addMessage, setStreaming, setStreamingContent, appendStreamingContent,
    setConversationId, setVisualState, incrementTurns,
  } = useGuideStore();

  const activeChild = useChildStore(s => s.activeChild);
  const ageBand = activeChild?.age_band || 'B';

  const voice = useVoiceInput();
  const tts = useVoiceOutput();

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Voice input → text
  useEffect(() => {
    if (voice.transcript && !voice.isListening) {
      setInput(voice.transcript);
    }
  }, [voice.transcript, voice.isListening]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || !activeChild) return;

    setInput('');
    const userMsg: GuideMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setStreaming(true);
    setStreamingContent('');
    setVisualState('thinking');

    try {
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          childId: activeChild.id,
          message: text,
          context,
          ageBand,
          labId,
          gameId,
          conversationId,
          childName: activeChild.display_name,
          childProgress: {
            xp: activeChild.xp,
            level: activeChild.level,
            streak: activeChild.streak_count,
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      setVisualState('speaking');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'start') {
              setConversationId(data.conversationId);
            } else if (data.type === 'delta') {
              fullResponse += data.content;
              appendStreamingContent(data.content);
            } else if (data.type === 'done') {
              incrementTurns();
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Finalize — add assistant message
      const assistantMsg: GuideMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now(),
      };
      addMessage(assistantMsg);
      setStreamingContent('');

      // TTS if voice enabled
      if (voiceEnabled && fullResponse) {
        tts.speak(fullResponse, ageBand);
      }
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Hmm, I had trouble connecting. Try again in a moment!',
        timestamp: Date.now(),
      });
    } finally {
      setStreaming(false);
      setVisualState('idle');
    }
  }, [
    input, isStreaming, activeChild, context, ageBand, labId, gameId,
    conversationId, voiceEnabled, addMessage, setStreaming,
    setStreamingContent, appendStreamingContent, setConversationId,
    setVisualState, incrementTurns, tts,
  ]);

  // Toggle button (always visible)
  if (!visible) {
    return (
      <motion.button
        onClick={show}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center hover:scale-105 transition-transform"
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Guide"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </motion.button>
    );
  }

  // Minimized state
  if (minimized) {
    return (
      <motion.button
        onClick={() => useGuideStore.setState({ minimized: false })}
        className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white/80 text-sm font-body flex items-center gap-2 hover:bg-white/15 transition-colors"
        whileTap={{ scale: 0.95 }}
        aria-label="Expand guide chat"
      >
        <Sparkles className="w-4 h-4 text-cyan-400" />
        Spark
        {messages.length > 0 && (
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-96 max-h-[70vh] rounded-2xl bg-[#111118]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-display text-sm text-white">Spark</span>
          <span className="text-xs text-white/30 font-mono">{context}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => minimize()} className="p-1.5 rounded-lg hover:bg-white/5" aria-label="Minimize">
            <Minimize2 className="w-3.5 h-3.5 text-white/40" />
          </button>
          <button onClick={hide} className="p-1.5 rounded-lg hover:bg-white/5" aria-label="Close">
            <X className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center text-white/30 text-sm font-body py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-cyan-400/30" />
            Hi! I&apos;m Spark, your AI guide.<br />Ask me anything about AI!
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-body ${
              msg.role === 'user'
                ? 'bg-cyan-500/20 text-white/90'
                : 'bg-white/5 text-white/80'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm font-body bg-white/5 text-white/80">
              {streamingContent}
              <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2 bg-white/5 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {/* Voice toggle */}
          <button
            onClick={() => useGuideStore.setState(s => ({ voiceEnabled: !s.voiceEnabled }))}
            className={`p-2 rounded-lg transition-colors ${voiceEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/30'}`}
            aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Voice input */}
          {voice.isSupported && voiceEnabled && (
            <button
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              className={`p-2 rounded-lg transition-colors ${voice.isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-white/30'}`}
              aria-label={voice.isListening ? 'Stop listening' : 'Start voice input'}
            >
              {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            placeholder="Ask Spark anything..."
            className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 font-body outline-none focus:ring-1 focus:ring-cyan-400/30"
            disabled={isStreaming}
            maxLength={1000}
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-500/30 transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Voice interim feedback */}
        {voice.isListening && voice.interimTranscript && (
          <p className="text-xs text-cyan-400/60 font-body mt-1 truncate">
            {voice.interimTranscript}...
          </p>
        )}
      </div>
    </motion.div>
  );
}
