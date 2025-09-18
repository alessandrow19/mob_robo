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
};

export default function RobotEyes({
  facePosition,
  isListening = false,
  isProcessing = false,
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

  return (
    <div className="astronaut-shell">
      <div className="helmet-wrapper">
        <div className="helmet-glow" />
        <div className={`helmet ${isListening && !isProcessing ? "helmet-listening" : ""}`}>
          <div className="helmet-inner">
            {isListening && !isProcessing ? (
              <div className="relative flex items-center justify-center">
                <div className="question-glow"></div>
                <div className="question-icon text-[120px]">?</div>
              </div>
            ) : (
              <>
                <div
                  className="helmet-display"
                  style={{
                    transform: `translate(${offsetX}px, ${offsetY}px)`,
                    opacity: isBlinking ? 0 : 1,
                    ...expressionStyles,
                  }}
                >
                  <div className="w-24 h-24">
                    <Image
                      src="/face/olho.png"
                      alt="Olho esquerdo"
                      width={80}
                      height={80}
                      className="opacity-90"
                    />
                  </div>
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
                <div className="boca animate-pulse">
                  <Image src="/face/boca.png" alt="Boca" width={80} height={80} />
                </div>
              </>
            )}
          </div>
          <span className="visor-highlight" />
          <span className="helmet-frame" />
        </div>
      </div>
      <div className="astronaut-body">
        <div className="astronaut-shoulders">
          <span className="astronaut-strap strap-left" />
          <span className="astronaut-strap strap-right" />
        </div>
        <div className="astronaut-panel">
          <div className="panel-indicators">
            <span className="panel-indicator panel-indicator--red" />
            <span className="panel-indicator panel-indicator--yellow" />
            <span className="panel-indicator panel-indicator--green" />
          </div>
          <div className="panel-display">
            <span className="panel-level" />
            <span className="panel-level panel-level--low" />
          </div>
        </div>
        <div className="astronaut-belt">
          <span className="belt-light" />
          <span className="belt-light belt-light--secondary" />
        </div>
      </div>
      <div className="astronaut-oxygen hose-left" />
      <div className="astronaut-oxygen hose-right" />
    </div>
  );
}
