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
  isProcessing?: boolean; // Nova prop para indicar processamento de áudio
  isAwaitingResponse?: boolean;
};

export default function RobotEyes({
  facePosition,
  isListening = false,
  isProcessing = false,
  isAwaitingResponse = false,
}: RobotEyesProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthFrame, setMouthFrame] = useState<0 | 1>(0);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      setMouthFrame(0);
      return;
    }

    const mouthInterval = setInterval(() => {
      setMouthFrame((prev) => (prev === 0 ? 1 : 0));
    }, 180);

    return () => clearInterval(mouthInterval);
  }, [isProcessing]);

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

  const shouldShowQuestion = (isListening || isAwaitingResponse) && !isProcessing;

  // Se está ouvindo ou aguardando resposta e não está processando áudio, mostra interrogação
  if (shouldShowQuestion) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 helmet">
        <div className="relative flex items-center justify-center">
          <div className="question-glow"></div>
          <div className="question-icon text-[120px]">?</div>
        </div>
        {isAwaitingResponse && (
          <div className="processing-indicator" aria-live="polite">
            {/* Mantemos o texto apenas para leitores de tela */}
            <span className="sr-only">Processando áudio</span>
            <div className="loading-dots" aria-hidden="true">
              {/* Três pontinhos para indicar o processamento sem cobrir o ponto de interrogação */}
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Caso contrário, mostra os olhos normalmente
  return (
    <div className="flex flex-col items-center justify-center gap-8 helmet">
      {/* Olhos */}
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

      <div
        className={`boca ${isProcessing ? "mouth-talking" : "mouth-idle"}`}
        aria-hidden="true"
      >
        <div
          className={`mouth-frame ${
            !isProcessing || mouthFrame === 0 ? "mouth-visible" : ""
          }`}
        >
          <Image
            src="/face/boca.png"
            alt="Boca"
            width={80}
            height={80}
            className="mouth-sprite"
          />
        </div>
        <div
          className={`mouth-frame ${
            isProcessing && mouthFrame === 1 ? "mouth-visible" : ""
          }`}
        >
          <Image
            src="/face/boca2.png"
            alt="Boca aberta"
            width={80}
            height={80}
            className="mouth-sprite"
          />
        </div>
      </div>
    </div>
  );
}
