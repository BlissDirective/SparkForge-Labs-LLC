// ════════════════════════════════════════════════════════════════
// AI TUTOR CHAT PANEL — Slide-out Chat Interface
// ════════════════════════════════════════════════════════════════
// COPPA-safe chat panel for children with:
// - Age-appropriate response filtering
// - Topic suggestions for kids
// - Visual message bubbles with character expressions
// - Parent safety indicator
// - Conversation memory display

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, X, Sparkles, Shield, Clock, User,
  Gamepad2, Lightbulb, BookOpen, Zap, Star,
  ChevronRight, Lock, Volume2, Trash2,
} from 'lucide-react';
import { SFButton } from '@/components/ui/SFButton';
import { SFSkeleton } from '@/components/ui/SFSkeleton';
import type { TutorExpression } from './AITutorAvatar';

// ── Message Types ──
export interface ChatMessage {
  id: string;
  role: 'user' | 'tutor' | 'system';
  content: string;
  timestamp: Date;
  context?: 'game_help' | 'ai_learning' | 'general' | 'safety';
  expression?: TutorExpression;
}

// ── Topic Suggestions ──
const TOPIC_SUGGESTIONS = [
  { icon: Gamepad2, label: 'Game Help', color: '#4F6EF7', prompt: 'How do I play the games?' },
  { icon: Lightbulb, label: 'What is AI?', color: '#E945F5', prompt: 'What is artificial intelligence?' },
  { icon: BookOpen, label: 'Learn', color: '#2ECC71', prompt: 'Teach me about AI' },
  { icon: Zap, label: 'Tips', color: '#FFD93D', prompt: 'Give me tips to learn faster' },
  { icon: Star, label: 'Fun Fact', color: '#FF6B35', prompt: 'Tell me a fun fact about AI' },
  { icon: Shield, label: 'Safety', color: '#00D2FF', prompt: 'How does AI keep us safe?' },
];

// ── Tutor Greeting ──
function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let timeGreeting = 'Hello';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  if (name) {
    return `${timeGreeting}, ${name}! I'm Sparky, your AI learning tutor. I can help you with games, teach you about AI, or just chat. What would you like to explore today?`;
  }
  return `${timeGreeting}! I'm Sparky, your AI learning tutor. I can help you with games, teach you about AI, or just chat. What would you like to explore today?`;
}

interface AITutorChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  childName?: string;
  onClearChat: () => void;
}

export function AITutorChat({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  childName,
  onClearChat,
}: AITutorChatProps) {
  const [input, setInput] = useState('');
  const [showTopics, setShowTopics] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    setShowTopics(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTopicClick = (prompt: string) => {
    onSendMessage(prompt);
    setShowTopics(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 right-4 sm:right-6 z-[490] w-[calc(100vw-2rem)] sm:w-[380px] max-h-[70vh] flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF, #F8FAFF)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.1)',
            border: '1px solid rgba(79,110,247,0.1)',
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4F6EF7, #6B8AFF)',
            }}
          >
            <div className="flex items-center gap-2.5">
              {/* Mini avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Sparky</p>
                <p className="text-[10px] text-white/70">AI Learning Tutor</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* COPPA shield */}
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(46,204,113,0.2)' }}
                title="COPPA Safe"
              >
                <Shield className="w-3 h-3" style={{ color: '#2ECC71' }} />
                <span className="text-[10px] font-medium" style={{ color: '#2ECC71' }}>Safe</span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-1"
                aria-label="Close chat"
              >
                <X className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>

          {/* ── Messages Area ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[50vh]">
            {/* Welcome */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
              >
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #4F6EF720, #E945F520)',
                  }}
                >
                  <Sparkles className="w-8 h-8" style={{ color: '#4F6EF7' }} />
                </div>
                <p className="text-sm mb-1" style={{ color: '#1A1D2B', fontWeight: 600 }}>
                  Hey{childName ? `, ${childName}` : ''}! I'm Sparky
                </p>
                <p className="text-xs" style={{ color: '#8C94AC' }}>
                  Your personal AI tutor. Ask me anything!
                </p>
              </motion.div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i === messages.length - 1 ? 0 : 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'mt-1' : ''}`}
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #E945F5, #4F6EF7)'
                      : 'linear-gradient(135deg, #4F6EF7, #6B8AFF)',
                  }}
                >
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm'
                      : 'rounded-tl-sm'
                  }`}
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #4F6EF7, #6B8AFF)'
                      : '#FFFFFF',
                    color: msg.role === 'user' ? '#FFFFFF' : '#1A1D2B',
                    boxShadow: msg.role === 'user'
                      ? '0 2px 8px rgba(79,110,247,0.2)'
                      : '0 1px 4px rgba(0,0,0,0.05)',
                    border: msg.role === 'user' ? 'none' : '1px solid #EEF2FA',
                  }}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4F6EF7, #6B8AFF)' }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-sf-border">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-2 h-2 rounded-full bg-sf-primary/40"
                    />
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                      className="w-2 h-2 rounded-full bg-sf-primary/40"
                    />
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                      className="w-2 h-2 rounded-full bg-sf-primary/40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Topic suggestions (only when showing) */}
            {showTopics && messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <p className="text-xs font-medium mb-2 px-1" style={{ color: '#8C94AC' }}>
                  Try asking about:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TOPIC_SUGGESTIONS.map((topic) => (
                    <button
                      key={topic.label}
                      onClick={() => handleTopicClick(topic.prompt)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                      style={{
                        backgroundColor: `${topic.color}08`,
                        border: `1px solid ${topic.color}15`,
                        color: topic.color,
                      }}
                    >
                      <topic.icon className="w-4 h-4 shrink-0" />
                      {topic.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Footer: Input + Safety ── */}
          <div className="shrink-0 px-3 py-3 border-t" style={{ borderColor: '#EEF2FA' }}>
            {/* Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Sparky anything..."
                  className="w-full px-4 py-2.5 rounded-full text-sm border focus:outline-none focus:ring-2 focus:ring-sf-primary/20 focus:border-sf-primary transition-all"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#DAE0F0',
                    color: '#1A1D2B',
                  }}
                  maxLength={200}
                />
                {input.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#8C94AC' }}>
                    {input.length}/200
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                style={{
                  background: input.trim()
                    ? 'linear-gradient(135deg, #4F6EF7, #6B8AFF)'
                    : '#EEF2FA',
                  boxShadow: input.trim() ? '0 2px 8px rgba(79,110,247,0.25)' : 'none',
                }}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>

            {/* Safety footer */}
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" style={{ color: '#2ECC71' }} />
                <span className="text-[10px]" style={{ color: '#8C94AC' }}>COPPA Safe</span>
              </div>
              <button
                onClick={onClearChat}
                className="flex items-center gap-1 text-[10px] transition-colors hover:text-sf-accent-red"
                style={{ color: '#8C94AC' }}
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
