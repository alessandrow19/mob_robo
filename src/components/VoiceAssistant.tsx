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
  // Estado de fase granular para evitar conflitos e cortes de áudio
  // idle -> aguardando; recording -> capturando voz; tts -> baixando áudio; playing -> reproduzindo resposta
  const [phase, setPhase] = useState<"idle" | "recording" | "tts" | "playing">(
    "idle"
  );
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  // Referências para áudio e reconhecimento
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Função para parar tudo
  const stopAll = useCallback(() => {
    // Se estiver reproduzindo, não forçar corte imediato a menos que usuário tenha explicitamente mudado estado externo
    if (phaseRef.current === "playing") {
      // Marcar para término suave
      if (audioRef.current) {
        audioRef.current.onended = null; // evitamos disparo duplo
        const a = audioRef.current;
        a.addEventListener(
          "ended",
          () => {
            if (onEnd) onEnd();
          },
          { once: true }
        );
        a.volume = 0; // fade instantâneo simples
        a.pause();
      }
      setPhase("idle");
      return;
    }
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
    setPhase("idle");
    if (onEnd) onEnd();
  }, [onEnd]);

  // Função para iniciar reconhecimento de voz
  const startListening = useCallback(() => {
    if (phase !== "idle") return; // evita iniciar durante outra fase

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
    timeoutRef.current = window.setTimeout(() => {
      if (phaseRef.current === "recording") {
        stopAll();
      }
    }, 12000);

    // Quando reconhecer voz
    recognition.onresult = async (event: CustomSpeechRecognitionEvent) => {
      // Garante que processamos apenas uma vez
      if (phaseRef.current !== "recording") return;
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
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = url;
      audioRef.current = audio;

      // Adiciona listeners para debug detalhado e evitar corte
      audio.addEventListener("loadedmetadata", () => {
        console.log("Duração do áudio (s):", audio.duration);
      });
      // Esperar canplaythrough antes de iniciar para reduzir risco de cortes (buffering)
      const waitCanPlay = new Promise<void>((resolve, reject) => {
        const onReady = () => {
          resolve();
          cleanup();
        };
        const onError = (e: any) => {
          reject(e);
          cleanup();
        };
        const cleanup = () => {
          audio.removeEventListener("canplaythrough", onReady);
          audio.removeEventListener("error", onError);
        };
        audio.addEventListener("canplaythrough", onReady, { once: true });
        audio.addEventListener("error", onError, { once: true });
        // Fallback: se não disparar em 2.5s, segue mesmo assim
        setTimeout(() => {
          if (phaseRef.current === "tts") {
            console.warn(
              "canplaythrough não disparou em 2500ms, iniciando mesmo assim"
            );
            cleanup();
            resolve();
          }
        }, 2500);
      });
      audio.addEventListener("timeupdate", () => {
        // console.log("Progresso:", audio.currentTime.toFixed(2)); // descomentar se precisar
      });
      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setPhase("idle");
        if (onEnd) onEnd();
      });
      audio.addEventListener("error", (e) => {
        console.error("Erro de reprodução de áudio", e);
        setPhase("idle");
        if (onEnd) onEnd();
      });
      // Auto-resume: se um pause ocorrer antes de 90% da duração e não estivermos em idle, tentar retomar
      let autoResumeAttempts = 0;
      audio.addEventListener("pause", () => {
        if (
          phaseRef.current === "playing" &&
          audio.currentTime < audio.duration * 0.9
        ) {
          if (autoResumeAttempts < 2) {
            autoResumeAttempts++;
            setTimeout(() => {
              audio.play().catch(() => {});
            }, 120);
          }
        }
      });

      // Watchdog: garante finalização mesmo se 'ended' não disparar (alguns bugs de Media pipeline)
      const watchdog = () => {
        if (!audioRef.current || phaseRef.current !== "playing") return;
        if (audio.duration && audio.currentTime >= audio.duration - 0.15) {
          console.warn("Watchdog finalizando áudio silenciado no fim.");
          audioRef.current?.dispatchEvent(new Event("ended"));
        } else {
          setTimeout(watchdog, 500);
        }
      };

      try {
        await waitCanPlay;
        const playPromise = audio.play();
        if (playPromise !== undefined) await playPromise;
        setPhase("playing");
        setTimeout(watchdog, 1500); // inicia watchdog depois de tocar um pouco
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
  }, [isListening, phase, startListening]);

  return null; // Componente não renderiza UI diretamente
}
