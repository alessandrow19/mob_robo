"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  calculateEyePosition,
  determineExpression,
  getExpressionStyles,
  Expression,
} from "./robotEyesUtils";

// Props do componente: posição do rosto, estados de escuta e processamento
type RobotEyesProps = {
  facePosition: {
    x: number;
    y: number;
    videoWidth: number;
    videoHeight: number;
  };
  isListening?: boolean;
  isProcessing?: boolean;
};

export default function RobotEyes({
  facePosition,
  isListening = false,
  isProcessing = false,
}: RobotEyesProps) {
  // Piscar dos olhos: alterna visibilidade a cada 3s
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Calcula expressão e posição dos olhos
  const expression = determineExpression(facePosition.x, facePosition.y);
  const { offsetX, offsetY } = calculateEyePosition(
    facePosition.x,
    facePosition.y,
    facePosition.videoWidth,
    facePosition.videoHeight
  );
  const expressionStyles = getExpressionStyles(expression);

  // Se está ouvindo e não está processando áudio, mostra interrogação
  if (isListening && !isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 helmet">
        <div className="relative flex items-center justify-center">
          <div className="question-glow"></div>
          <div className="question-icon text-[120px]">?</div>
        </div>
      </div>
    );
  }

  // Mostra olhos e boca do robô
  return (
    <div className="flex flex-col items-center justify-center gap-8 helmet">
      {/* Olhos do robô */}
      <div
        className="flex items-center justify-center gap-8 mt-16 overflow-hidden w-[300px] h-[90px] transition-all duration-500"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          opacity: isBlinking ? 0 : 1,
          ...expressionStyles,
        }}
      >
        {/* Olho Esquerdo */}
        <div className="w-24 h-24">
          <Image
            src="/face/olho.png"
            alt="Olho esquerdo"
            width={80}
            height={80}
            className="opacity-90"
          />
        </div>
        {/* Olho Direito */}
        <div className="w-24 h-24">
          <Image
            src="/face/olho.png"
            alt="Olho direito"
            width={80}
            height={80}
            className="opacity-90"
          />
        </div>
      </div>
      {/* Boca do robô */}
      <div className="boca animate-pulse">
        <Image src="/face/boca.png" alt="Boca" width={80} height={80} />
      </div>
    </div>
  );
}
