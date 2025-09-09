import { useEffect } from 'react';
import * as Speech from 'expo-speech';

type Props = {
  isListening?: boolean;
  onStart?: () => void;
  onAudioStart?: () => void;
  onEnd?: () => void;
};

export default function VoiceAssistant({
  isListening = false,
  onStart,
  onAudioStart,
  onEnd,
}: Props) {
  useEffect(() => {
    if (isListening) {
      onStart && onStart();
      Speech.speak('Olá! Como posso ajudar?', {
        language: 'pt-BR',
        onStart: onAudioStart,
        onDone: onEnd,
      });
    }
  }, [isListening, onStart, onAudioStart, onEnd]);

  return null;
}
