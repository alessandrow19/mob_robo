"use client";

import FaceDetection from "@/components/FaceDetection";
import VideoStream from "@/components/VideoStream";
import RobotEyes from "@/components/RobotEyes";
import { useState, useEffect, useCallback } from "react";
import DirectionTracker from "@/components/DirectionTracker"; // Importe o componente
import VoiceAssistant from "@/components/VoiceAssistant";
import InstructionOverlay from "@/components/InstructionOverlay";
import MicStatus from "@/components/MicStatus";
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

  // ---------------- MODO ASSISTIDO (sorriso abre janela + toque inicia) ----------------
  const [smileExpiresAt, setSmileExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const SMILE_WINDOW_MS = 5000;
  useEffect(() => {
    if (!smileExpiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [smileExpiresAt]);
  const smileWindowActive = !!smileExpiresAt && smileExpiresAt > now;

  const handleSmile = useCallback(() => {
    if (isTalking || isListening) return;
    setSmileExpiresAt(Date.now() + SMILE_WINDOW_MS);
  }, [isTalking, isListening]);

  const attemptStartListening = useCallback(() => {
    if (!smileWindowActive || isTalking || isListening) return;
    setIsListening(true);
    setSmileExpiresAt(null);
  }, [smileWindowActive, isTalking, isListening]);

  // Quando ficar bravo, interrompe escuta
  const handleAngry = () => {
    if (isListening) setIsListening(false);
  };
  return (
    <div className="relative grid min-h-dvh w-dvw place-items-center">
      <MicStatus />
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
      <div className="m-auto flex flex-col items-center">
        <div
          className="relative"
          onClick={() => attemptStartListening()}
          style={{ cursor: smileWindowActive ? "pointer" : "default" }}
        >
          <RobotEyes
            facePosition={facePosition}
            isListening={isListening}
            isProcessing={isTalking}
            onStartListening={() => attemptStartListening()}
          />
          {/* Overlay instruções abaixo do robô (versão básica; substituída depois por componente rico) */}
          {!isListening && !isTalking && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center text-xs select-none">
              {!smileWindowActive && (
                <span className="text-neutral-400">
                  Sorria para habilitar o microfone
                </span>
              )}
              {smileWindowActive && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-emerald-400 animate-pulse">
                    Toque para falar
                  </span>
                  <div className="w-40 h-1 bg-neutral-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-[width] duration-200"
                      style={{
                        width: `${
                          ((smileExpiresAt! - now) / SMILE_WINDOW_MS) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
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
      <InstructionOverlay
        active={smileWindowActive}
        remainingMs={smileWindowActive ? smileExpiresAt! - now : 0}
        totalMs={SMILE_WINDOW_MS}
        visible={!isListening && !isTalking}
        onClick={() => attemptStartListening()}
      />
      {/* Área fullscreen clicável quando janela ativa */}
      {!isListening && !isTalking && smileWindowActive && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => attemptStartListening()}
          style={{ background: "rgba(0,0,0,0.02)", cursor: "pointer" }}
        >
          <span className="sr-only">Toque para falar</span>
        </div>
      )}
    </div>
  );
}
