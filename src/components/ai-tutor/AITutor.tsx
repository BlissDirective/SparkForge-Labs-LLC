// ════════════════════════════════════════════════════════════════
// AI TUTOR — Combined Avatar + Chat Component
// ════════════════════════════════════════════════════════════════
// The main AI Tutor component that renders both the floating
// 3D avatar and the slide-out chat panel. Placed in the
// dashboard layout to appear on all pages.

'use client';

import { AITutorAvatar } from './AITutorAvatar';
import { AITutorChat } from './AITutorChat';
import { useAITutor } from './AITutorContext';

interface AITutorProps {
  quickTip?: string;
}

export function AITutor({ quickTip }: AITutorProps) {
  const {
    isChatOpen,
    toggleChat,
    closeChat,
    messages,
    sendMessage,
    isLoading,
    expression,
    context,
    clearChat,
  } = useAITutor();

  return (
    <>
      {/* 3D Avatar */}
      <AITutorAvatar
        expression={expression}
        isChatOpen={isChatOpen}
        onClick={toggleChat}
        quickTip={quickTip}
        pulseAttention={messages.length === 0}
      />

      {/* Chat Panel */}
      <AITutorChat
        isOpen={isChatOpen}
        onClose={closeChat}
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
        childName={context.childName}
        onClearChat={clearChat}
      />
    </>
  );
}
