"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  calculateEyePosition,
  determineExpression,
  getExpressionStyles,
  Expression,
} from "./robotEyesUtils";

type RobotEyesProps = {
  facePosition: {
    x: number;
    y: number;
    videoWidth: number;
    videoHeight: number;
  };
  isListening?: boolean;
  isTalking?: boolean;
  isProcessing?: boolean;
  isAwaitingResponse?: boolean;
};

export default function RobotEyes({
  facePosition,
  isListening = false,
  isTalking = false,
  isProcessing = false,
  isAwaitingResponse = false,
}: RobotEyesProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Log o valor de isListening sempre que ele mudar
  useEffect(() => {
    console.log("RobotEyes: isListening", isListening);
  }, [isListening]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  const expression: Expression = determineExpression(
    facePosition.x,
    facePosition.y
  );

  const { offsetX, offsetY } = calculateEyePosition(
    facePosition.x,
    facePosition.y,
    facePosition.videoWidth,
    facePosition.videoHeight
  );

  const expressionStyles = getExpressionStyles(expression);

  // Se estiver ouvindo (isListening true) e não estiver tocando áudio nem processando nem aguardando resposta, exibe o question-glow
  // Caso contrário, exibe a face normal
  const showQuestionGlow = isListening && !isTalking && !isProcessing && !isAwaitingResponse;

  return showQuestionGlow ? (
    <div className="flex flex-col items-center justify-center gap-8 helmet">
      <div className="relative flex items-center justify-center">
        <div className="question-glow"></div>
        <div className="question-icon text-[120px]">?</div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center  gap-8 helmet">
      {/* Olhos */}
      <div
        className="flex items-center justify-center mt-30 overflow-hidden w-[300px] h-[90px] transition-all duration-500"
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
        <div className="w-24 h-24 ">
          <Image
            src="/face/olho.png"
            alt="Olho direito"
            width={80}
            height={80}
            className="opacity-90"
          />
        </div>
      </div>

      <div className="boca items-center  animat-epulse">
        <Image src="/face/boca.png" alt="Boca" width={60} height={60} />
      </div>
    </div>
  );
}
