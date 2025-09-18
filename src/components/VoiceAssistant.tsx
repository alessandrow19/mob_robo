"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getVoiceUrl } from "../utils/pollinations.js";

type VoiceAssistantProps = {
  trigger: number;
  stopTrigger?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onAudioStart?: () => void;
};

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
  trigger,
  stopTrigger = 0,
  onStart,
  onEnd,
  onAudioStart,
}: VoiceAssistantProps) {
  const [status, setStatus] = useState<"idle" | "listening" | "responding">(
    "idle"
  );
  const statusRef = useRef<"idle" | "listening" | "responding">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const updateStatus = useCallback((nextStatus: typeof status) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const cleanupRecognition = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      recognitionRef.current?.abort?.();
      recognitionRef.current?.stop?.();
    } catch (error) {
      console.error(error);
    }

    recognitionRef.current = null;
  }, []);

  const resetToIdle = useCallback(() => {
    cleanupRecognition();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    updateStatus("idle");
    if (onEnd) onEnd();
  }, [cleanupRecognition, onEnd, updateStatus]);

  const startListening = useCallback(() => {
    if (statusRef.current !== "idle") return;

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
    updateStatus("listening");
    if (onStart) onStart();

    timeoutRef.current = window.setTimeout(() => {
      resetToIdle();
    }, 10000);

    recognition.onresult = async (event: CustomSpeechRecognitionEvent) => {
      if (statusRef.current !== "listening") return;

      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? "";

      cleanupRecognition();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!transcript) {
        resetToIdle();
        return;
      }

      updateStatus("responding");

      const astronomyPrompt = `Por favor, responda exclusivamente em português do Brasil e apenas a perguntas relacionadas à astronomia. Pergunta: ${transcript}`;

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }

        const audioResponse = await fetch(getVoiceUrl(astronomyPrompt), {
          headers: {
            Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
            Authorization: "Bearer sc6EZeTBRIf51QHl",
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

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resetToIdle();
        };

        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) await playPromise;
          if (onAudioStart) onAudioStart();
        } catch (playError) {
          console.error("Erro ao reproduzir áudio do Pollinations:", playError);
          throw playError;
        }
      } catch (error) {
        console.error("Erro ao obter resposta:", error);
        resetToIdle();
      }
    };

    recognition.onerror = () => {
      resetToIdle();
    };
  }, [cleanupRecognition, onAudioStart, onStart, resetToIdle, updateStatus]);

  useEffect(() => {
    if (trigger > 0) {
      startListening();
    }
  }, [trigger, startListening]);

  useEffect(() => {
    if (stopTrigger > 0) {
      resetToIdle();
    }
  }, [stopTrigger, resetToIdle]);

  return null;
}
