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
};

export default function RobotEyes({
  facePosition,
  isListening = false,
}: RobotEyesProps) {
  const [isBlinking, setIsBlinking] = useState(false);

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

  return isListening ? (
    <div className="flex flex-col items-center justify-center gap-8 helmet">
      <div className="relative flex items-center justify-center">
        <div className="question-glow"></div>
        <div className="question-icon text-[120px]">?</div>
      </div>
    </div>
  ) : (
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

      <div className="boca animate-pulse">
        <Image src="/face/boca.png" alt="Boca" width={80} height={80} />
      </div>
    </div>
  );
}
