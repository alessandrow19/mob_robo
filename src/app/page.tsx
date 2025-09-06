"use client";

import FaceDetection from "@/components/FaceDetection";
import VideoStream from "@/components/VideoStream";
import RobotEyes from "@/components/RobotEyes";
import { useState } from "react";
import DirectionTracker from "@/components/DirectionTracker"; // Importe o componente
import VoiceAssistant from "@/components/VoiceAssistant";

export default function Home() {
  const [videoElement, setVideoElement] = useState(null);
  const [facePosition, setFacePosition] = useState({
    x: 0,
    y: 0,
    videoWidth: 0,
    videoHeight: 0,
  });
  const [currentDirection, setCurrentDirection] = useState("center"); // Estado para a direção atual
  return (
    <div className="relative grid min-h-dvh w-dvw place-items-center">
      <div className="m-auto flex flex-col items-center">
        <RobotEyes facePosition={facePosition} />
        <VoiceAssistant />
      </div>
      <div className="container">
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
            />
          )}
        </div>
      </div>
      {/* Adicione o componente DirectionTracker */}
      <DirectionTracker direction={currentDirection} />
    </div>
  );
}

