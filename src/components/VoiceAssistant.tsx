"use client";

import { useEffect, useRef, useState } from "react";
import { getVoiceUrl } from "../utils/pollinations.js";

type VoiceAssistantProps = {
  trigger: number;
  stopTrigger?: number;
  onStart?: () => void;
  onEnd?: () => void;
};

export default function VoiceAssistant({
  trigger,
  stopTrigger = 0,
  onStart,
  onEnd,
}: VoiceAssistantProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const stopProcessing = () => {
    try {
      recognitionRef.current?.abort?.();
      recognitionRef.current?.stop?.();
    } catch (e) {
      console.error(e);
    }
    recognitionRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsProcessing(false);
    onEnd && onEnd();
  };

  const startListening = () => {
    if (isProcessing) return;

    // Insert CustomSpeechRecognitionEvent interface
    interface CustomSpeechRecognitionEvent extends Event {
      readonly resultIndex: number;
      readonly results: SpeechRecognitionResultList;
    }

    // Add SpeechRecognition type for TypeScript
    type SpeechRecognition = {
      lang: string;
      start: () => void;
      onresult: ((event: CustomSpeechRecognitionEvent) => void) | null;
      onerror: ((event: Event) => void) | null;
    };

    interface SpeechRecognitionWindow extends Window {
      webkitSpeechRecognition?: new () => SpeechRecognition;
      SpeechRecognition?: new () => SpeechRecognition;
    }

    const SpeechRecognitionClass =
      (window as SpeechRecognitionWindow).SpeechRecognition ||
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Seu navegador não suporta o reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pt-BR";
    recognition.start();
    recognitionRef.current = recognition;
    setIsProcessing(true);
    onStart && onStart();

    recognition.onresult = async (event: CustomSpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;

      // improved prompt with clearer instructions in Brazilian Portuguese
      const astronomyPrompt = `Por favor, responda exclusivamente em português do Brasil e apenas a perguntas relacionadas à astronomia. Pergunta: ${transcript}`;

      try {
        const textResponse = await fetch(
          `/api/pollinate?q=${encodeURIComponent(astronomyPrompt)}`,
          { cache: "no-store", headers: { "Accept-Language": "pt-BR" } }
        );
        if (!textResponse.ok) throw new Error("Falha ao obter texto");
        const answer = await textResponse.text();

        try {
          // ❌ Sem Authorization aqui — evita CORS preflight
          const audioResponse = await fetch(getVoiceUrl(answer), {
            // ajuda alguns browsers a escolherem o decodificador
            headers: {
              Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
              Authorization: "Bearer fr5BZb9Dr07vjlQ0",
            },
            cache: "no-store",
            mode: "cors",
          });

          if (!audioResponse.ok) {
            console.error(
              "Falha ao obter áudio do Pollinations",
              audioResponse.status,
              audioResponse.statusText
            );
            throw new Error("Falha ao obter áudio");
          }

          const blob = await audioResponse.blob();
          if (!blob || blob.size === 0) {
            console.error("Blob de áudio vazio");
            throw new Error("Áudio vazio");
          }

          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          try {
            const playPromise = audio.play();
            if (playPromise !== undefined) await playPromise;
          } catch (playError) {
            console.error("Erro ao reproduzir áudio do Pollinations:", playError);
            throw playError;
          } finally {
            audio.onended = () => {
              URL.revokeObjectURL(url);
              audioRef.current = null;
            };
          }
        } catch (audioError) {
          console.error("Erro no TTS:", audioError);
        }
      } catch (error) {
        console.error("Erro ao obter resposta:", error);
      } finally {
        setIsProcessing(false);
        recognitionRef.current = null;
        audioRef.current = null;
        onEnd && onEnd();
      }
    };

    recognition.onerror = () => {
      setIsProcessing(false);
      recognitionRef.current = null;
      onEnd && onEnd();
    };
  };

  useEffect(() => {
    if (trigger > 0) startListening();
  }, [trigger]);

  useEffect(() => {
    if (stopTrigger > 0) {
      stopProcessing();
    }
  }, [stopTrigger]);

  return null;
}
