"use client";

import FaceDetection from "@/components/FaceDetection";
import VideoStream from "@/components/VideoStream";
import RobotEyes from "@/components/RobotEyes";
import { useState } from "react";
import DirectionTracker from "@/components/DirectionTracker"; // Importe o componente
import VoiceAssistant from "@/components/VoiceAssistant";
import {
  handleSmileInteraction,
  handleAngryInteraction,
} from "@/utils/interactionHandlers";

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
  const [showVoiceButton, setShowVoiceButton] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);

  const handleAngry = () => handleAngryInteraction(isListening, setStopTrigger);
  const startVoiceFlow = () => {
    setShowVoiceButton(false);
    handleSmileInteraction(isListening, setIsListening, setListenTrigger);
  };
  const handleSmile = () => {
    if (!isListening && !isTalking) {
      startVoiceFlow();
    }
  };
  return (
    <div className="relative grid min-h-dvh w-dvw place-items-center">
      <VoiceAssistant
        trigger={listenTrigger}
        stopTrigger={stopTrigger}
        onStart={() => {
          setIsListening(true);
          setShowVoiceButton(false);
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
          // Quando o navegador exigir interação manual, voltamos a exibir o botão.
          setIsListening(false);
          setShowVoiceButton(true);
        }}
        onEnd={() => {
          setIsListening(false);
          setIsTalking(false);
          setShowVoiceButton(false);
          setIsAwaitingResponse(false);
        }}
      />

      <div className="m-auto flex flex-col items-center">
        <RobotEyes
          facePosition={facePosition}
          isListening={isListening}
          isProcessing={isTalking}
          isAwaitingResponse={isAwaitingResponse}
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
      {showVoiceButton && !isListening && !isTalking && (
        <button
          type="button"
          onClick={startVoiceFlow}
          className="voice-button"
        >
          <span className="voice-button__glow" />
          <span className="voice-button__label">Falar com o Robo</span>
        </button>
      )}
      {/* Adicione o componente DirectionTracker */}
      <DirectionTracker direction={currentDirection} />
    </div>
  );
}
