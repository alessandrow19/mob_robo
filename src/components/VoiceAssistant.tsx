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
  // Máquina de estados simples
  // idle -> recording -> tts -> playing -> idle
  const [phase, setPhase] = useState<"idle" | "recording" | "tts" | "playing">(
    "idle"
  );
  // Referências para áudio e reconhecimento
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Função para parar tudo
  const stopAll = useCallback(() => {
    // Não interromper o áudio se já estiver reproduzindo (fase 'playing').
    // Requisito: o áudio só deve parar quando terminar naturalmente.
    if (phase === "playing") {
      // Mantemos reprodução até o evento 'ended'.
      return;
    }
    // Limpa timeout de segurança se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Aborta reconhecimento de voz (caso ainda ativo)
    try {
      recognitionRef.current?.abort?.();
      recognitionRef.current?.stop?.();
    } catch (e) {
      console.error(e);
    }
    recognitionRef.current = null;
    // Não pausamos/zeramos audioRef aqui para permitir término natural (caso algo tenha sido disparado prematuramente)
    setPhase("idle");
    if (onEnd) onEnd();
  }, [phase, onEnd]);

  // Função para iniciar reconhecimento de voz
  const startListening = useCallback(() => {
    if (phase !== "idle") return; // evita reentrância

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
    setPhase("recording");
    if (onStart) onStart();

    // Timeout para não travar
    // Timeout de segurança para não ficar preso em recording
    timeoutRef.current = window.setTimeout(() => {
      console.warn("[VoiceAssistant] Timeout de gravação atingido");
      stopAll();
    }, 10000);

    // Quando reconhecer voz
    recognition.onresult = async (event: CustomSpeechRecognitionEvent) => {
      // Consideramos que estamos em 'recording' ao receber resultado
      setPhase("tts");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Parar reconhecimento imediatamente para evitar eventos tardios interferindo
      try {
        recognition.stop?.();
      } catch {}
      const transcript = event.results[0][0].transcript;
      console.log("Transcrição:", transcript); // Mostra transcrição no console

      // Prompt para TTS Pollinations
      const prompt = ` Responda sempre em português do Brasil, nunca use português de Portugal, nem regionalismos de Portugal. Responda apenas perguntas relacionadas à astronomia. Pergunta: ${transcript} ? `;
      // Para áudio anterior
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
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
      console.debug("[VoiceAssistant] blob size=", blob.size);
      if (!blob || blob.size === 0) {
        console.error("Blob de áudio vazio");
        throw new Error("Áudio vazio");
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = url;
      audioRef.current = audio;

      // Listener de término natural do áudio
      audio.addEventListener(
        "ended",
        () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setPhase("idle");
          if (onEnd) onEnd();
        },
        { once: true }
      );

      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) await playPromise;
        setPhase("playing");
        if (onAudioStart) onAudioStart();
      } catch (playError) {
        console.error("Erro ao reproduzir áudio do Pollinations:", playError);
        setPhase("idle");
        throw playError;
      }
    };

    recognition.onerror = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setPhase("idle");
      recognitionRef.current = null;
      if (onEnd) onEnd();
    };
  }, [phase, onStart, onEnd, onAudioStart, stopAll]);

  // Inicia escuta se isListening for true e não estiver processando
  useEffect(() => {
    if (isListening && phase === "idle") {
      startListening();
    }
    // Se usuário retirou isListening enquanto gravando, parar
    if (!isListening && (phase === "recording" || phase === "tts")) {
      stopAll();
    }
  }, [isListening, phase, startListening, stopAll]);

  return null; // Sem UI
}
