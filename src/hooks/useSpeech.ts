import { useCallback, useRef } from 'react';

export const useSpeech = () => {
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;

    if (!synthRef.current) {
      synthRef.current = window.speechSynthesis;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = synthRef.current.getVoices();
    const chineseVoice = voices.find(
      voice => voice.lang.includes('zh') || voice.lang.includes('CN')
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    synthRef.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  return { speak, stop };
};
