"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

type Expression = "normal" | "puppy";
type RobotEyesProps = {
  facePosition: { x: number; y: number };
};

export default function RobotEyes({ facePosition }: RobotEyesProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [expression, setExpression] = useState<Expression>("normal");
  const [showHearts, setShowHearts] = useState(false);
  const [showTears, setShowTears] = useState(false);
  const [hearts, setHearts] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);

  // Piscar automaticamente a cada 3 segundos
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Alternar entre normal e puppy eyes a cada 5 segundos
  useEffect(() => {
    const expressionInterval = setInterval(() => {
      setExpression((prev) => (prev === "normal" ? "puppy" : "normal"));
    }, 5000);

    return () => clearInterval(expressionInterval);
  }, []);

  // Calcular o deslocamento dos olhos com base na posição do rosto
  const calculateEyePosition = (faceX: number, faceY: number) => {
    const eyeContainerWidth = 300; // Largura da div dos olhos
    const eyeContainerHeight = 200; // Altura da div dos olhos
    const helmetWidth = 500; // Largura do capacete
    const helmetHeight = 450; // Altura do capacete

    // Dimensões do vídeo (conforme definido no CSS da classe .container)
    const videoWidth = 720;
    const videoHeight = 560;

    // Normalizar as coordenadas do rosto para um range de -1 a 1
    // Baseado no centro do vídeo
    const normalizedX = (faceX - videoWidth / 2) / (videoWidth / 2);
    const normalizedY = (faceY - videoHeight / 2) / (videoHeight / 2);

    // Calcular o movimento máximo dentro do capacete
    // Considerando que a div dos olhos precisa ficar dentro do capacete
    const maxMoveX = Math.min(
      (helmetWidth - eyeContainerWidth) / 2, // Limite do capacete
      eyeContainerWidth / 4 // Movimento suave (25% da largura)
    );
    const maxMoveY = Math.min(
      (helmetHeight - eyeContainerHeight) / 2, // Limite do capacete
      eyeContainerHeight / 4 // Movimento suave (25% da altura)
    );

    // Aplicar o movimento proporcional com suavização
    let offsetX = -normalizedX * maxMoveX * 0.8; // Reduz a sensibilidade
    let offsetY = normalizedY * maxMoveY * 0.8; // Reduz a sensibilidade

    // Garantir que não ultrapasse os limites do capacete
    offsetX = Math.max(-maxMoveX, Math.min(offsetX, maxMoveX));
    offsetY = Math.max(-maxMoveY, Math.min(offsetY, maxMoveY));

    return { offsetX, offsetY };
  };

  const { offsetX, offsetY } = calculateEyePosition(
    facePosition.x,
    facePosition.y
  );
  console.log("Face Position:", facePosition, "Offset:", { offsetX, offsetY });
  // Estilos para olhinhos pidões
  const getPuppyStyles = () => {
    if (expression === "puppy") {
      return {
        transform: "scale(1.3) translateY(3px) rotate(-2deg)",
        filter: "brightness(1.1)",
        animation: "puppy-tremble 0.8s ease-in-out infinite",
      };
    }
    return {};
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 helmet ">
      {/* Olhos */}
      <div
        className="flex items-center justify-center gap-8 mt-16 overflow-hidden w-[300px] h-[200px] transition-all duration-500"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) ${
            isBlinking ? "scaleY(0.1)" : "scaleY(1)"
          }`,
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
        <div className="w-24 h-24 overflow-hidden">
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
