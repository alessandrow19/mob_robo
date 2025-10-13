"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { playAudioResponse } from "../utils/audioPlayback";

type VoiceAssistantProps = {
  trigger: number;
  stopTrigger?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onAudioStart?: () => void;
  onResponsePendingStart?: () => void;
  onResponsePendingEnd?: () => void;
  onPermissionDenied?: () => void;
  onAnswerChange?: (answer: string | null) => void;
};

export type VoiceAssistantHandle = {
  /**
   * Inicia manualmente a captura de áudio, respeitando as mesmas validações do gatilho automático.
   */
  start: () => void;
  /**
   * Encerra imediatamente qualquer fluxo em andamento, retornando o componente ao estado "idle".
   */
  stop: () => void;
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
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionWindow extends Window {
  webkitSpeechRecognition?: new () => SpeechRecognition;
  SpeechRecognition?: new () => SpeechRecognition;
}

interface SpeechRecognitionErrorEvent extends Event {
  error?: string;
}

const VoiceAssistant = forwardRef<VoiceAssistantHandle, VoiceAssistantProps>(
  function VoiceAssistant(
    {
      trigger,
      stopTrigger = 0,
      onStart,
      onEnd,
      onAudioStart,
      onResponsePendingStart,
      onResponsePendingEnd,
      onPermissionDenied,
      onAnswerChange,
    }: VoiceAssistantProps,
    ref
  ) {
  const [status, setStatus] = useState<"idle" | "listening" | "responding">(
    "idle"
  );
  const statusRef = useRef<"idle" | "listening" | "responding">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const lastTriggerRef = useRef<number>(0);
  const lastStopTriggerRef = useRef<number>(0);

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
    const previousStatus = statusRef.current;
    cleanupRecognition();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (previousStatus === "responding" && onResponsePendingEnd) {
      onResponsePendingEnd();
    }
    updateStatus("idle");
    if (onEnd) onEnd();
  }, [cleanupRecognition, onEnd, onResponsePendingEnd, updateStatus]);

  const handleStartFailure = useCallback(
    (error: unknown) => {
      cleanupRecognition();

      const maybeDomException = error as DOMException | undefined;
      const permissionDenied =
        maybeDomException?.name === "NotAllowedError" ||
        maybeDomException?.name === "SecurityError";

      if (permissionDenied && onPermissionDenied) {
        onPermissionDenied();
      }
    },
    [cleanupRecognition, onPermissionDenied]
  );

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
    recognitionRef.current = recognition;

    try {
      // Alguns navegadores só permitem iniciar a captura de voz após interação prévia;
      // o bloco try/catch garante que tratamos esse caso sem travar o fluxo.
      recognition.start();
    } catch (error) {
      console.error("Falha ao iniciar o reconhecimento de voz:", error);
      handleStartFailure(error);
      return;
    }

    updateStatus("listening");
    if (onStart) onStart();
    // Limpa o balão enquanto aguardamos a próxima resposta da Groq.
    if (onAnswerChange) onAnswerChange(null);

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
        const groqResponse = await fetch("/api/pollinate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: astronomyPrompt }),
        });

        if (!groqResponse.ok) {
          const message = await safeReadError(groqResponse);
          throw new Error(message);
        }

        const { answer, audioBase64, contentType } =
          (await groqResponse.json()) as {
            answer?: string;
            audioBase64?: string;
            contentType?: string;
          };

        if (onAnswerChange) {
          // Mantemos o último texto exibido mesmo após o áudio terminar.
          onAnswerChange(answer ?? null);
        }

        if (!audioBase64) {
          throw new Error("Resposta da Groq sem áudio.");
        }

        const audioBlob = base64ToBlob(audioBase64, contentType);
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audioRef.current = audio;

        try {
          // Delega a orquestração da reprodução ao helper centralizado,
          // garantindo que o reset ocorra apenas após o término natural.
          await playAudioResponse({
            audio,
            url,
            onAudioStart,
            onResponsePendingEnd,
            onPlaybackFinished: () => {
              resetToIdle();
            },
          });
        } catch (playError) {
          console.error("Erro ao reproduzir áudio sintetizado:", playError);
          resetToIdle();
        }
      } catch (error) {
        console.error("Erro ao obter resposta da Groq:", error);
        if (onAnswerChange) onAnswerChange(null);
        resetToIdle();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Reexibe o botão de voz quando a permissão de microfone é negada.
      if (
        (event.error === "not-allowed" || event.error === "service-not-allowed") &&
        onPermissionDenied
      ) {
        onPermissionDenied();
      }
      resetToIdle();
    };
  }, [
    cleanupRecognition,
    handleStartFailure,
    onAudioStart,
    onAnswerChange,
    onPermissionDenied,
    onResponsePendingEnd,
    onResponsePendingStart,
    onStart,
    resetToIdle,
    updateStatus,
  ]);

  useEffect(() => {
    if (trigger > 0 && trigger !== lastTriggerRef.current) {
      lastTriggerRef.current = trigger;
      // Só reagimos a novos gatilhos, evitando reinícios desnecessários da escuta após o término do áudio.
      startListening();
    }
  }, [trigger, startListening]);

  useEffect(() => {
    if (stopTrigger > 0 && stopTrigger !== lastStopTriggerRef.current) {
      lastStopTriggerRef.current = stopTrigger;

      if (statusRef.current === "listening") {
        // Só interrompemos a escuta ativa; se o robô estiver respondendo, deixamos o áudio terminar.
        resetToIdle();
      }
    }
  }, [stopTrigger, resetToIdle]);

  useImperativeHandle(
    ref,
    () => ({
      start: () => {
        startListening();
      },
      stop: () => {
        resetToIdle();
      },
    }),
    [resetToIdle, startListening]
  );

  return null;
});

export default VoiceAssistant;

function base64ToBlob(base64: string, mimeType = "audio/mpeg"): Blob {
  // Decodifica a string para bytes; usamos atob por ser suportado no browser.
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes.buffer], { type: mimeType });
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return typeof data?.error === "string" ? data.error : JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return `status ${response.status}`;
    }
  }
}
