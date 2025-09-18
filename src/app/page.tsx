"use client";

import FaceDetection from "@/components/FaceDetection";
import VideoStream from "@/components/VideoStream";
import RobotEyes from "@/components/RobotEyes";
import { useState } from "react";
import DirectionTracker from "@/components/DirectionTracker"; // Importe o componente
import VoiceAssistant from "@/components/VoiceAssistant";
import dynamic from "next/dynamic";
import UniverseBackground from "@/components/UniverseBackground";
import {
  handleSmileInteraction,
  handleAngryInteraction,
} from "@/utils/interactionHandlers";

// Importa Dictaphone apenas no cliente para evitar hidratação
const Dictaphone = dynamic(() => import("@/components/Dictaphone"), {
  ssr: false,
});

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

  const handleSmile = () =>
    handleSmileInteraction(isListening, setIsListening, setListenTrigger);

  const handleAngry = () => handleAngryInteraction(isListening, setStopTrigger);
  return (
    <div className="space-stage">
      <UniverseBackground />
      <div className="space-haze" />
      {/* <VoiceAssistant
        trigger={listenTrigger}
        stopTrigger={stopTrigger}
        onStart={() => setIsListening(true)}
        onAudioStart={() => {
          setIsListening(false);
          setIsTalking(true);
        }}
        onEnd={() => {
          setIsListening(false);
          setIsTalking(false);
        }}
      /> */}

      <Dictaphone />

      <div className="astronaut-floating orbit-left">
        <span className="orbit-core" />
      </div>
      <div className="astronaut-floating orbit-right">
        <span className="orbit-core" />
      </div>
      <div className="astronaut-floating satellite" />
      <div className="astronaut-floating comet" />

      <div className="astronaut-wrapper">
        <div className="astronaut-badge badge-left">MOB-01</div>
        <div className="astronaut-badge badge-right">Explorador</div>
        <RobotEyes
          facePosition={facePosition}
          isListening={isListening}
          isProcessing={isTalking}
        />
        <div className="astronaut-info">
          <span className="info-chip">Orbitando confiança</span>
          <span className="info-chip">Escuta espacial ativa</span>
          <span className="info-chip">Modo gravidade zero</span>
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
