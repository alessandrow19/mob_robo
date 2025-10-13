"use client";

import FaceDetection from "@/components/FaceDetection";
import VideoStream from "@/components/VideoStream";
import RobotEyes from "@/components/RobotEyes";
import { useEffect, useRef, useState } from "react";
import DirectionTracker from "@/components/DirectionTracker"; // Importe o componente
import VoiceAssistant, {
  VoiceAssistantHandle,
} from "@/components/VoiceAssistant";
import ListeningIndicator from "@/components/ListeningIndicator";
import {
  handleSmileInteraction,
  handleAngryInteraction,
} from "@/utils/interactionHandlers";
import DirectionalOverlay from "@/components/DirectionalOverlay";

export default function Home() {
  const [videoElement, setVideoElement] = useState(null);
  const [facePosition, setFacePosition] = useState({
    x: 0,
    y: 0,
    videoWidth: 0,
    videoHeight: 0,
  });
  const [currentDirection, setCurrentDirection] = useState("center"); // Estado para a direção atual
  const [listenTrigger, setListenTrigger] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [stopTrigger, setStopTrigger] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [showDirectionalModal, setShowDirectionalModal] = useState(false);
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);
  const directionalModalTimeout = useRef<NodeJS.Timeout | null>(null);
  const voiceAssistantRef = useRef<VoiceAssistantHandle | null>(null);
  // Normalizamos o texto recebido da Groq antes de exibi-lo no balão.
  const sanitizedAnswer = assistantAnswer?.trim();
  const hasAssistantAnswer = Boolean(sanitizedAnswer);

  // Limpa o temporizador ao desmontar a página para evitar vazamentos.
  useEffect(() => {
    return () => {
      if (directionalModalTimeout.current) {
        clearTimeout(directionalModalTimeout.current);
      }
    };
  }, []);

  const revealDirectionalModal = (autoHide = true) => {
    setShowDirectionalModal(true);

    if (directionalModalTimeout.current) {
      clearTimeout(directionalModalTimeout.current);
    }

    if (autoHide) {
      // Damos um tempo maior para que o usuário possa clicar no botão de voz.
      directionalModalTimeout.current = setTimeout(() => {
        setShowDirectionalModal(false);
      }, 6500);
    }
  };

  const handleAngry = () => handleAngryInteraction(isListening, setStopTrigger);
  // O botão central do overlay chama esta função para iniciar a conversa.
  const startVoiceFlow = () => {
    setShowDirectionalModal(false);
    if (directionalModalTimeout.current) {
      clearTimeout(directionalModalTimeout.current);
      directionalModalTimeout.current = null;
    }
    if (voiceAssistantRef.current) {
      // O clique direto no botão garante o gesto de usuário exigido pelo navegador.
      voiceAssistantRef.current.start();
    } else {
      handleSmileInteraction(isListening, setListenTrigger);
    }
  };
  const handleSmile = () => {
    if (!isListening && !isTalking) {
      revealDirectionalModal();
    }
  };
  return (
    <div className="relative grid min-h-dvh w-dvw place-items-center">
      {/* Indicador visual para orientar o usuário sobre a captura de áudio ativa. */}
      <ListeningIndicator isListening={isListening} />

      <VoiceAssistant
        ref={voiceAssistantRef}
        trigger={listenTrigger}
        stopTrigger={stopTrigger}
        onStart={() => {
          setIsListening(true);
          setShowDirectionalModal(false);
        }}
        onResponsePendingStart={() => {
          setIsListening(false);
          setIsAwaitingResponse(true);
        }}
        onResponsePendingEnd={() => {
          setIsAwaitingResponse(false);
        }}
        onAudioStart={() => {
          setIsListening(false);
          setIsTalking(true);
        }}
        onPermissionDenied={() => {
          // Quando o navegador exigir interação manual, mantemos o overlay ativo
          // sem autodesaparecer, garantindo que o botão central seja o único
          // responsável por iniciar novas capturas de áudio.
          setIsListening(false);
          revealDirectionalModal(false);
        }}
        onEnd={() => {
          setIsListening(false);
          setIsTalking(false);
          setIsAwaitingResponse(false);
          setShowDirectionalModal(false);
        }}
        onAnswerChange={setAssistantAnswer}
      />

      <div className="relative m-auto flex flex-col items-center">
        {hasAssistantAnswer && (
          <div className="speech-bubble">
            {/* Mantemos o texto acessível e facilmente ajustável. */}
            <p>{sanitizedAnswer}</p>
          </div>
        )}
        <RobotEyes
          facePosition={facePosition}
          isListening={isListening}
          isProcessing={isTalking}
          isAwaitingResponse={isAwaitingResponse}
        />
        <DirectionalOverlay
          visible={showDirectionalModal}
          onActivateVoice={startVoiceFlow}
          disableVoiceButton={isListening || isTalking || isAwaitingResponse}
        />
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
