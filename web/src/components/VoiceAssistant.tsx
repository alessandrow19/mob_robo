"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getVoiceUrl } from "../utils/pollinations.js";

// Propriedades do componente
type VoiceAssistantProps = {
  isListening?: boolean; // Inicia escuta quando true
  onStart?: () => void; // Callback ao iniciar
  onEnd?: () => void; // Callback ao terminar
  onAudioStart?: () => void; // Callback ao iniciar áudio
};

// Tipos para reconhecimento de voz
interface CustomSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognition {
  lang: string;
  start: () => void;
  abort?: () => void;
  stop?: () => void;
  onresult: ((event: CustomSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
}
interface SpeechRecognitionWindow extends Window {
  webkitSpeechRecognition?: new () => SpeechRecognition;
  SpeechRecognition?: new () => SpeechRecognition;
}

export default function VoiceAssistant({
  isListening = false,
  onStart,
  onEnd,
  onAudioStart,
}: VoiceAssistantProps) {
  // Estado para saber se está processando
  const [isProcessing, setIsProcessing] = useState(false);
  // Referências para áudio e reconhecimento
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Função para parar tudo
  const stopAll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
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
    if (onEnd) onEnd();
  }, [onEnd]);

  // Função para iniciar reconhecimento de voz
  const startListening = useCallback(() => {
    if (isProcessing) return;

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
    if (onStart) onStart();

    // Timeout para não travar
    timeoutRef.current = window.setTimeout(() => {
      stopAll();
    }, 10000);

    // Quando reconhecer voz
    recognition.onresult = async (event: CustomSpeechRecognitionEvent) => {
      if (isProcessing) return;
      setIsProcessing(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const transcript = event.results[0][0].transcript;
      console.log("Transcrição:", transcript); // Mostra transcrição no console

      // Prompt para TTS Pollinations
      const prompt = ` Responda sempre em português do Brasil, nunca use português de Portugal, nem regionalismos de Portugal. Responda apenas perguntas relacionadas à astronomia. Pergunta: ${transcript} ? `;
      // Para áudio anterior
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }

      // Busca áudio diretamente do Pollinations TTS
      let audioResponse;
      try {
        audioResponse = await fetch(getVoiceUrl(prompt), {
          headers: {
            Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
          },
          cache: "no-store",
          mode: "cors",
        });
      } catch (err) {
        console.error(
          "Erro de CORS ou rede ao buscar áudio do Pollinations. Use uma API backend para contornar CORS.",
          err
        );
        throw new Error("Erro de CORS ou rede ao buscar áudio do Pollinations");
      }

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
        if (onAudioStart) onAudioStart();
      } catch (playError) {
        console.error("Erro ao reproduzir áudio do Pollinations:", playError);
        throw playError;
      } finally {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setIsProcessing(false); // Libera para nova chamada
          if (onEnd) onEnd();
        };
      }
    };

    recognition.onerror = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsProcessing(false);
      recognitionRef.current = null;
      if (onEnd) onEnd();
    };
  }, [isProcessing, onStart, onEnd, onAudioStart, stopAll]);

  // Inicia escuta se isListening for true e não estiver processando
  useEffect(() => {
    if (isListening && !isProcessing) {
      startListening();
    }
  }, [isListening, isProcessing, startListening]);

  return null;
}
