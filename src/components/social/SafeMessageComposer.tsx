'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';
import { SFButton } from '@/components/ui/SFButton';
import {
  MESSAGE_TEMPLATES,
  type MessageCategory,
  type MessageTemplate,
} from '@/lib/social/SocialEngine';

interface SafeMessageComposerProps {
  buddyName: string;
  onSend: (templateId: string) => Promise<boolean> | void;
  onClose: () => void;
}

const CATEGORIES: { id: MessageCategory; label: string; emoji: string }[] = [
  { id: 'greeting', label: 'Hi', emoji: '👋' },
  { id: 'encouragement', label: 'Cheer', emoji: '💪' },
  { id: 'celebration', label: 'Yay', emoji: '🎉' },
  { id: 'study', label: 'Study', emoji: '📚' },
  { id: 'gratitude', label: 'Thanks', emoji: '💖' },
  { id: 'fun', label: 'Fun', emoji: '🤖' },
];

export function SafeMessageComposer({ buddyName, onSend, onClose }: SafeMessageComposerProps) {
  const [category, setCategory] = useState<MessageCategory>('greeting');
  const [sending, setSending] = useState<string | null>(null);

  const templates: MessageTemplate[] = MESSAGE_TEMPLATES.filter((m) => m.category === category);

  const handleSend = async (templateId: string) => {
    setSending(templateId);
    await onSend(templateId);
    setSending(null);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Send a friendly message to ${buddyName}`}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl p-5"
        style={{ background: '#FFFFFF', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
        initial={{ y: 40, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>
            Message {buddyName}
          </h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: '#8C94AC' }} />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={{
                backgroundColor: category === c.id ? '#4F6EF7' : 'rgba(79,110,247,0.08)',
                color: category === c.id ? '#FFFFFF' : '#4F6EF7',
              }}
              aria-pressed={category === c.id}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Preset messages */}
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="grid grid-cols-1 gap-2 max-h-[44vh] overflow-y-auto"
          >
            {templates.map((t) => (
              <SFButton
                key={t.id}
                variant="ghost"
                size="md"
                fullWidth
                loading={sending === t.id}
                onClick={() => handleSend(t.id)}
                className="justify-start text-left"
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                <span className="mr-2">{t.emoji}</span>
                {t.text}
              </SFButton>
            ))}
          </motion.div>
        </AnimatePresence>

        <p className="text-[10px] mt-4 text-center" style={{ color: '#A8AEC2' }}>
          🔒 Only these friendly messages can be sent. A grown-up can see all messages.
        </p>
      </motion.div>
    </motion.div>
  );
}

export default SafeMessageComposer;
