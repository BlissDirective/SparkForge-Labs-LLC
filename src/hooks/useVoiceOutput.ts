'use client';

// ════════════════════════════════════════════════════
// VOICE OUTPUT HOOK — Phase 5: Web Speech API TTS wrapper
// Browser-native text-to-speech for guide responses
// Pitch/rate tuned per age band
// ════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGuideStore } from '@/stores/guideStore';

interface VoiceConfig {
  pitch: number;
  rate: number;
}

const VOICE_CONFIGS: Record<string, VoiceConfig> = {
  A: { pitch: 1.2, rate: 0.85 },   // Higher pitch, slower for young kids
  B: { pitch: 1.0, rate: 1.0 },    // Medium for tweens
  C: { pitch: 0.95, rate: 1.05 },  // Natural for teens
};

const SPEED_MULTIPLIERS: Record<string, number> = {
  slow: 0.8,
  normal: 1.0,
  fast: 1.2,
};

interface UseVoiceOutputReturn {
  speak: (text: string, ageBand?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useVoiceOutput(): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceSpeed = useGuideStore(s => s.voiceSpeed);
  const setAudioLevel = useGuideStore(s => s.setAudioLevel);
  const setTtsPlaying = useGuideStore(s => s.setTtsPlaying);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const speak = useCallback((text: string, ageBand: string = 'B') => {
    if (!isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const config = VOICE_CONFIGS[ageBand] || VOICE_CONFIGS.B;
    const speedMult = SPEED_MULTIPLIERS[voiceSpeed] || 1.0;

    utterance.pitch = config.pitch;
    utterance.rate = config.rate * speedMult;
    utterance.lang = 'en-US';

    // Select a good voice (prefer Google voices if available)
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setTtsPlaying(true);
    };

    utterance.onboundary = (event) => {
      // Simulate audio level from word boundaries
      if (event.name === 'word') {
        setAudioLevel(0.6 + Math.random() * 0.4);
        // Decay after 200ms
        setTimeout(() => setAudioLevel(0.1), 200);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setTtsPlaying(false);
      setAudioLevel(0);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setTtsPlaying(false);
      setAudioLevel(0);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, voiceSpeed, setAudioLevel, setTtsPlaying]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setTtsPlaying(false);
      setAudioLevel(0);
    }
  }, [isSupported, setAudioLevel, setTtsPlaying]);

  return { speak, stop, isSpeaking, isSupported };
}
