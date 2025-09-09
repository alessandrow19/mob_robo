import { useEffect, useRef, useState } from 'react';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { getVoiceUrl } from '../utils/pollinations';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Limpa áudio carregado
  const unloadSound = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  useEffect(() => {
    // Handler para resultados de reconhecimento de voz
    Voice.onSpeechResults = async (event: SpeechResultsEvent) => {
      const transcript = event.value?.[0];
      if (!transcript) {
        setIsProcessing(false);
        onEnd && onEnd();
        return;
      }

      const prompt = ` Responda sempre em português do Brasil, nunca use português de Portugal, nem regionalismos de Portugal. Responda apenas perguntas relacionadas à astronomia. Pergunta: ${transcript} ? `;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: getVoiceUrl(prompt) },
          { shouldPlay: true },
          (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;
            if (status.didJustFinish) {
              unloadSound();
              setIsProcessing(false);
              onEnd && onEnd();
            }
          }
        );
        soundRef.current = sound;
        onAudioStart && onAudioStart();
      } catch (e) {
        console.error('Erro ao reproduzir áudio do Pollinations', e);
        await unloadSound();
        setIsProcessing(false);
        onEnd && onEnd();
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      unloadSound();
    };
  }, [onAudioStart, onEnd]);

  useEffect(() => {
    const startListening = async () => {
      try {
        await Voice.start('pt-BR');
        onStart && onStart();
      } catch (e) {
        console.error('Erro ao iniciar reconhecimento de voz', e);
        setIsProcessing(false);
        onEnd && onEnd();
      }
    };

    if (isListening && !isProcessing) {
      setIsProcessing(true);
      startListening();
    }
    if (!isListening) {
      Voice.stop();
    }
  }, [isListening, isProcessing, onStart, onEnd]);

  return null;
}
