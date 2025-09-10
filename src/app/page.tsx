"use client";

import FaceDetection from "@/components/FaceDetection";
import VideoStream from "@/components/VideoStream";
import RobotEyes from "@/components/RobotEyes";
import { useState, useRef, useEffect } from "react";
import DirectionTracker from "@/components/DirectionTracker"; // Importe o componente
import VoiceAssistant from "@/components/VoiceAssistant";
import {
  handleSmileInteraction,
  handleAngryInteraction,
} from "@/utils/interactionHandlers";

export default function Home() {
  // Estado do vídeo e rosto
  const [videoElement, setVideoElement] = useState(null);
  const [facePosition, setFacePosition] = useState({
    x: 0,
    y: 0,
    videoWidth: 0,
    videoHeight: 0,
  });
  const [currentDirection, setCurrentDirection] = useState("center");
  // Estado para controle de escuta e fala
  const [isListening, setIsListening] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  // --- MODO ASSISTIDO (Sorriso + Toque) ---
  // Nesta abordagem o usuário precisa: (1) Sorrir -> abre uma janela de 5s; (2) Tocar na área do robô dentro dessa janela.
  // Isso evita falsos positivos de sorriso e garante gesto explícito exigido pelo mobile para iniciar APIs de voz.
  // Armazena timestamp (ms) do último sorriso detectado
  const [lastSmileTs, setLastSmileTs] = useState<number | null>(null);
  // Mensagem de feedback/overlay
  const [assistMsg, setAssistMsg] = useState<string>("");
  // Contagem regressiva restante em segundos
  const [countdown, setCountdown] = useState<number>(0);
  // Referência para interval de countdown
  const countdownRef = useRef<number | null>(null);

  // Tempo máximo (ms) entre sorriso e toque para iniciar escuta
  const ASSIST_WINDOW = 5000; // 5 segundos

  // Função para limpar estado assistido
  const resetAssist = () => {
    setLastSmileTs(null);
    setCountdown(0);
    setAssistMsg("");
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // Callback de sorriso: apenas registra tempo e inicia overlay
  const handleSmile = () => {
    // Apenas registra se não estiver falando/escutando
    if (isTalking || isListening) return; // Ignora se já está falando/escutando
    const now = Date.now();
    setLastSmileTs(now);
    setAssistMsg("Sorriso detectado! Toque para falar");

    // Inicia/Reseta countdown
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(ASSIST_WINDOW / 1000);
    countdownRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          // Expirou a janela
          resetAssist();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  // Callback de bravo cancela tudo
  const handleAngry = () => {
    if (isListening) setIsListening(false);
    resetAssist();
  };

  // Handler de toque: verifica se há sorriso recente dentro da janela
  const handleAssistTap = () => {
    // Tap no robô: somente inicia se houver sorriso recente dentro da janela.
    if (isTalking || isListening) return; // Já ocupado
    const now = Date.now();
    if (lastSmileTs && now - lastSmileTs <= ASSIST_WINDOW) {
      // Dentro da janela -> inicia escuta
      setAssistMsg("Iniciando escuta...");
      setTimeout(() => setIsListening(true), 50); // pequeno delay para UX
      resetAssist();
    } else {
      // Sem sorriso válido
      setAssistMsg("Sorria primeiro e depois toque");
      setTimeout(() => {
        if (assistMsg === "Sorria primeiro e depois toque") setAssistMsg("");
      }, 2000);
    }
  };

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, []);
  return (
    <div className="relative grid min-h-dvh w-dvw place-items-center">
      {/* Componente de voz: escuta quando isListening=true */}
      <VoiceAssistant
        isListening={isListening}
        onStart={() => setIsListening(true)}
        onAudioStart={() => {
          setIsListening(false);
          setIsTalking(true);
        }}
        onEnd={() => {
          setIsListening(false);
          setIsTalking(false);
        }}
      />
      <div className="m-auto flex flex-col items-center select-none">
        {/* Área clicável para modo assistido */}
        <div
          onClick={handleAssistTap}
          className="relative"
          role="button"
          aria-label="Área do robô - sorria e toque para falar"
        >
          <RobotEyes
            facePosition={facePosition}
            isListening={isListening}
            isProcessing={isTalking}
            onStartListening={() => {
              // Mantém compatibilidade com botão interno (se exibido quando escutando)
              if (!isListening && !isTalking) setIsListening(true);
              console.log("Iniciar escuta via btn interno");
            }}
          />
          {/* Overlay de instrução assistida */}
          {!isListening && !isTalking && assistMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center px-4 rounded-lg animate-fade">
              <p className="text-sm font-medium drop-shadow">{assistMsg}</p>
              {countdown > 0 && (
                <p className="mt-1 text-xs opacity-80">
                  {`Toque em até ${countdown}s`}
                </p>
              )}
            </div>
          )}
          {/* Dica inicial quando nada ativo */}
          {!isListening && !isTalking && !assistMsg && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-3 py-1 rounded-full animate-pulse">
              Sorria e toque para falar
            </div>
          )}
        </div>
      </div>
      <div className={`container ${isListening || isTalking ? "hidden" : ""}`}>
        <div className="fixed bottom-3 left-3">
          <VideoStream onVideoReady={setVideoElement} />

          {/* Componente de detecção facial */}
          {videoElement && (
            <FaceDetection
              videoElement={videoElement}
              onFaceDetected={({
                x,
                y,
                direction,
                videoWidth,
                videoHeight,
              }: {
                x: number;
                y: number;
                direction: string;
                videoWidth: number;
                videoHeight: number;
              }) => {
                setFacePosition({ x, y, videoWidth, videoHeight }); // Atualiza a posição do rosto
                setCurrentDirection(direction); // Atualiza a direção
              }}
              onSmile={handleSmile}
              onAngry={handleAngry}
            />
          )}
        </div>
      </div>
      {/* Adicione o componente DirectionTracker */}
      <DirectionTracker direction={currentDirection} />
    </div>
  );
}
