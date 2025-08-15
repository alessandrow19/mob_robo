"use client";

import FaceDetection from "@/components/FaceDetection";
import VideoStream from "@/components/VideoStream";
import RobotEyes from "@/components/RobotEyes";
import Image from "next/image";''
import { SetStateAction, useState } from "react";
import DirectionTracker from "@/components/DirectionTracker"; // Importe o componente

export default function Home() {
const [videoElement, setVideoElement] = useState(null)
const [facePosition, setFacePosition] = useState({ x: 0, y: 0 });
const [currentDirection, setCurrentDirection] = useState("center"); // Estado para a direção atual
  return (
    <>
    <div><RobotEyes facePosition={facePosition} /></div>
    <div className="container">     
      <div >
        <VideoStream onVideoReady={setVideoElement} />

         {/* Componente de detecção facial */}
          {videoElement && (
            <FaceDetection
              videoElement={videoElement}
              onFaceDetected={({ x, y, direction }: { x: number; y: number; direction: string }) => {
                setFacePosition({ x, y }); // Atualiza a posição do rosto
                setCurrentDirection(direction); // Atualiza a direção
              }}
            
            
            
            />
          )}
      </div>     
    </div>
    {/* Adicione o componente DirectionTracker */}
      <DirectionTracker direction={currentDirection} />
    </>
  );
}

