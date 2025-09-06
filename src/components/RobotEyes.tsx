"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

type Expression = "normal" | "puppy";
type RobotEyesProps = {
  facePosition: {
    x: number;
    y: number;
    videoWidth: number;
    videoHeight: number;
  };
};

export default function RobotEyes({ facePosition }: RobotEyesProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [expression, setExpression] = useState<Expression>("normal");

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
  const calculateEyePosition = (
    faceX: number,
    faceY: number,
    videoWidth: number,
    videoHeight: number
  ) => {
    const eyeContainerWidth = 300; // Largura da div dos olhos
    const eyeContainerHeight = 200; // Altura da div dos olhos
    const helmetWidth = 500; // Largura do capacete
    const helmetHeight = 450; // Altura do capacete

    // Usar as dimensões reais do vídeo ou valores padrão
    const width = videoWidth || 720;
    const height = videoHeight || 560;

    // Se não há posição válida do rosto, retorna centro (0, 0)
    if (faceX === 0 && faceY === 0) {
      return { offsetX: 0, offsetY: 0 };
    }

    // Normalizar as coordenadas do rosto para um range de -1 a 1
    // Baseado no centro do vídeo
    const normalizedX = (faceX - width / 2) / (width / 2);
    const normalizedY = (faceY - height / 2) / (height / 2);

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
    facePosition.y,
    facePosition.videoWidth,
    facePosition.videoHeight
  );

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
    <div className="flex flex-col items-center justify-center gap-8 helmet">
      {/* Olhos */}
      <div
        className="flex items-center justify-center gap-8 mt-16 overflow-hidden w-[300px] h-[90px] transition-all duration-500"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) ${
            isBlinking ? "scaleY(0.1)" : "scaleY(1)"
          }`,
          ...getPuppyStyles(),
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
