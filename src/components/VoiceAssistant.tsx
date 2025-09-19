"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getVoiceUrl } from "../utils/pollinations.js";

type AudioConstructor = new (src: string) => HTMLAudioElement;

type AudioPlaybackDependencies = {
  fetchImpl?: typeof fetch;
  AudioClass?: AudioConstructor;
  getVoiceUrlFn?: typeof getVoiceUrl;
  urlCreator?: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
};

type AudioPlaybackCallbacks = {
  onResponsePendingEnd?: () => void;
  onAudioStart?: () => void;
  onPlaybackComplete?: () => void;
};

export async function fetchAndPlayPollinationsAudio(
  prompt: string,
  {
    fetchImpl = fetch,
    AudioClass = Audio,
    getVoiceUrlFn = getVoiceUrl,
    urlCreator = URL,
  }: AudioPlaybackDependencies = {},
  {
    onResponsePendingEnd,
    onAudioStart,
    onPlaybackComplete,
  }: AudioPlaybackCallbacks = {}
) {
  const audioResponse = await fetchImpl(getVoiceUrlFn(prompt), {
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
    throw new Error(
      `Falha ao obter áudio: ${audioResponse.status} ${audioResponse.statusText}`
    );
  }

  const blob = await audioResponse.blob();
  if (!blob || blob.size === 0) {
    console.error("Blob de áudio vazio");
    throw new Error("Áudio vazio");
  }

  const url = urlCreator.createObjectURL(blob);
  const audio = new AudioClass(url);

  audio.onended = () => {
    urlCreator.revokeObjectURL(url);
    if (onPlaybackComplete) onPlaybackComplete();
  };

  try {
    if (onResponsePendingEnd) onResponsePendingEnd();
    const playPromise = audio.play();
    if (onAudioStart) onAudioStart();
    if (playPromise !== undefined) await playPromise;
    return audio;
  } catch (playError) {
    urlCreator.revokeObjectURL(url);
    throw playError;
  }
}

type VoiceAssistantProps = {
  trigger: number;
  stopTrigger?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onAudioStart?: () => void;
  onResponsePendingStart?: () => void;
  onResponsePendingEnd?: () => void;
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
  onResponsePendingStart,
  onResponsePendingEnd,
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

    if (onResponsePendingEnd) onResponsePendingEnd();
    updateStatus("idle");
    if (onEnd) onEnd();
  }, [cleanupRecognition, onEnd, onResponsePendingEnd, updateStatus]);

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
      if (onResponsePendingStart) onResponsePendingStart();

      const astronomyPrompt = `Por favor, responda exclusivamente em português do Brasil e apenas a perguntas relacionadas à astronomia. Pergunta: ${transcript}`;

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }

        const audio = await fetchAndPlayPollinationsAudio(
          astronomyPrompt,
          undefined,
          {
            onResponsePendingEnd,
            onAudioStart,
            onPlaybackComplete: () => {
              audioRef.current = null;
              resetToIdle();
            },
          }
        );

        audioRef.current = audio;
      } catch (error) {
        console.error("Erro ao obter resposta:", error);
        resetToIdle();
      }
    };

    recognition.onerror = () => {
      if (onResponsePendingEnd) onResponsePendingEnd();
      resetToIdle();
    };
  }, [
    cleanupRecognition,
    onAudioStart,
    onResponsePendingEnd,
    onResponsePendingStart,
    onStart,
    resetToIdle,
    updateStatus,
  ]);

  useEffect(() => {
    if (trigger > 0) {
      startListening();
    }
  }, [trigger, startListening]);

  useEffect(() => {
    if (stopTrigger > 0) {
      if (statusRef.current === "responding") {
        cleanupRecognition();
        return;
      }

      if (statusRef.current === "listening") {
        resetToIdle();
      }
    }
  }, [cleanupRecognition, resetToIdle, stopTrigger]);

  return null;
}
