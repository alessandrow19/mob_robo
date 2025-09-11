"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { getVoiceUrl } from "../utils/pollinations.js";

// Propriedades do componente
type VoiceAssistantProps = {
  isListening?: boolean; // Inicia escuta automática (desktop) quando true
  onStart?: () => void; // Callback ao iniciar gravação
  onEnd?: () => void; // Callback ao retornar ao estado idle
  onAudioStart?: () => void; // Callback ao iniciar reprodução de áudio
  onUnsupported?: (reason: string) => void; // Callback quando não houver suporte a STT
};

// Métodos expostos via ref para o componente pai (ex: acionar em gesto no mobile)
export interface VoiceAssistantHandle {
  begin: () => void; // força início do fluxo de reconhecimento (respeitando estado)
  stop: () => void; // força parada (se não estiver tocando áudio)
  phase: () => Phase; // retorna fase atual
  lastError: () => string | null; // retorna último erro armazenado
}

type Phase = "idle" | "recording" | "tts" | "playing";

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

const VoiceAssistant = forwardRef<VoiceAssistantHandle, VoiceAssistantProps>(
  (
    { isListening = false, onStart, onEnd, onAudioStart, onUnsupported },
    ref
  ) => {
    // Máquina de estados simples
    // idle -> recording -> tts -> playing -> idle
    const [phase, setPhase] = useState<Phase>("idle");
    const [supportsSpeech, setSupportsSpeech] = useState<boolean | null>(null); // null = ainda checando
    const [lastError, setLastError] = useState<string | null>(null); // última mensagem de erro

    // Referências para áudio e reconhecimento
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const timeoutRef = useRef<number | null>(null);

    // Detectar suporte no client (somente após mount)
    useEffect(() => {
      if (typeof window === "undefined") return;
      const w = window as SpeechRecognitionWindow;
      const has = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
      setSupportsSpeech(has);
      if (!has) {
        const msg =
          "Reconhecimento de voz não suportado neste navegador/dispositivo.";
        onUnsupported?.(msg);
        setLastError(msg);
      }
    }, [onUnsupported]);

    // Função para parar tudo (exceto áudio em reprodução)
    const stopAll = useCallback(() => {
      // Não interromper o áudio se já estiver reproduzindo (fase 'playing').
      if (phase === "playing") return; // áudio termina naturalmente

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
      setPhase("idle");
      onEnd?.();
    }, [phase, onEnd]);

    // Função interna que inicia o reconhecimento (pressupõe suporte + permissão)
    const internalStart = useCallback(() => {
      if (phase !== "idle") return; // evita reentrância
      if (!supportsSpeech) {
        setLastError("Reconhecimento de voz não suportado.");
        return;
      }

      const w = window as SpeechRecognitionWindow;
      const SpeechRecognitionClass =
        w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setLastError("Classe SpeechRecognition ausente.");
        return;
      }

      let recognition: SpeechRecognition;
      try {
        recognition = new SpeechRecognitionClass();
      } catch (err) {
        console.error("Falha ao instanciar SpeechRecognition", err);
        setLastError("Falha ao inicializar reconhecimento.");
        return;
      }
      recognition.lang = "pt-BR";

      // Handler de erro
      recognition.onerror = (ev: Event) => {
        console.warn("[VoiceAssistant] onerror", ev);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setPhase("idle");
        recognitionRef.current = null;
        setLastError("Erro ou permissão negada.");
        onEnd?.();
      };

      try {
        recognition.start(); // IMPORTANTE: deve ocorrer em gesto direto no mobile
      } catch (startErr: any) {
        console.error("Erro ao iniciar reconhecimento:", startErr);
        setLastError(
          startErr?.message || "Não foi possível iniciar o microfone."
        );
        return;
      }

      recognitionRef.current = recognition;
      setPhase("recording");
      onStart?.();

      // Timeout de segurança
      timeoutRef.current = window.setTimeout(() => {
        console.warn("[VoiceAssistant] Timeout de gravação atingido");
        setLastError("Tempo de gravação esgotado.");
        stopAll();
      }, 10000);

      recognition.onresult = async (event: CustomSpeechRecognitionEvent) => {
        setPhase("tts");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        try {
          recognition.stop?.();
        } catch {}

        const transcript = event.results[0][0].transcript;
        console.log("Transcrição:", transcript);

        const prompt = ` Responda sempre em português do Brasil, nunca use português de Portugal, nem regionalismos de Portugal. Responda apenas perguntas relacionadas à astronomia. Pergunta: ${transcript} ? `;

        if (audioRef.current) {
          try {
            audioRef.current.pause();
          } catch {}
          audioRef.current = null;
        }

        let audioResponse: Response;
        try {
          audioResponse = await fetch(getVoiceUrl(prompt), {
            headers: { Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8" },
            cache: "no-store",
            mode: "cors",
          });
        } catch (err) {
          console.error(
            "Erro de CORS ou rede ao buscar áudio do Pollinations",
            err
          );
          setPhase("idle");
          setLastError("Erro ao buscar áudio (rede/CORS).");
          onEnd?.();
          return;
        }

        if (!audioResponse.ok) {
          console.error(
            "Falha ao obter áudio do Pollinations",
            audioResponse.status
          );
          setPhase("idle");
          setLastError("Falha ao obter áudio.");
          onEnd?.();
          return;
        }

        const blob = await audioResponse.blob();
        if (!blob || blob.size === 0) {
          console.error("Blob de áudio vazio");
          setPhase("idle");
          setLastError("Áudio vazio.");
          onEnd?.();
          return;
        }

        const url = URL.createObjectURL(blob);
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = url;
        audioRef.current = audio;

        audio.addEventListener(
          "ended",
          () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            setPhase("idle");
            onEnd?.();
          },
          { once: true }
        );

        try {
          const playPromise = audio.play();
          if (playPromise) await playPromise;
          setPhase("playing");
          onAudioStart?.();
        } catch (playErr) {
          console.error("Erro ao reproduzir áudio do Pollinations:", playErr);
          setPhase("idle");
          setLastError("Não foi possível reproduzir áudio.");
          onEnd?.();
        }
      };
    }, [phase, supportsSpeech, onStart, onEnd, onAudioStart, stopAll]);

    // Solicita permissão de microfone antecipadamente (melhora estabilidade em alguns browsers)
    const requestPermissionAndStart = useCallback(async () => {
      if (phase !== "idle") return;
      if (!supportsSpeech) {
        setLastError("Sem suporte a reconhecimento de voz.");
        return;
      }
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          stream.getTracks().forEach((t) => t.stop()); // liberamos imediatamente
        }
      } catch (permErr) {
        console.warn("Permissão de microfone negada/falhou", permErr);
        setLastError("Permissão de microfone negada.");
        return;
      }
      internalStart();
    }, [phase, supportsSpeech, internalStart]);

    // Expor API via ref
    useImperativeHandle(
      ref,
      () => ({
        begin: () => requestPermissionAndStart(),
        stop: () => stopAll(),
        phase: () => phase,
        lastError: () => lastError,
      }),
      [requestPermissionAndStart, stopAll, phase, lastError]
    );

    // Auto-start apenas para desktop (evitar restrição de gesto em mobile)
    useEffect(() => {
      if (!isListening) {
        if (
          phase !== "playing" &&
          phase !== "idle" &&
          (phase === "recording" || phase === "tts")
        ) {
          stopAll();
        }
        return;
      }
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (
        isListening &&
        phase === "idle" &&
        supportsSpeech &&
        supportsSpeech === true &&
        !isMobile
      ) {
        internalStart();
      }
    }, [isListening, phase, supportsSpeech, internalStart, stopAll]);

    // Sem UI visual: o controle é feito via ref / props. Pode-se adicionar debug opcional.
    return null;
  }
);

export default VoiceAssistant;
