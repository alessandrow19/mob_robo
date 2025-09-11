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
  onStartListening,
}: RobotEyesProps & { onStartListening?: () => void }) {
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

  // Estado: escutando (aguardando fala do usuário) -> anéis pulsando + interrogação amigável
  if (isListening && !isProcessing) {
    return (
      <div className="flex flex-col items-center">
        {/* Capacete com interrogação centralizada */}
        <div className="helmet relative flex items-center justify-center">
          {/* Camada central absoluta para garantir alinhamento ao centro do capacete */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-56 h-56 flex items-center justify-center">
              {/* Anéis pulsando centralizados */}
              <div className="absolute w-44 h-44 rounded-full bg-cyan-400/15 border border-cyan-400/30 animate-[ringPulse_2.4s_ease-out_infinite]"></div>
              <div className="absolute w-32 h-32 rounded-full bg-emerald-400/10 border border-emerald-400/25 animate-[ringPulseDelay_2.4s_ease-out_infinite_.6s]"></div>
              {/* Ícone interrogação */}
              <div
                aria-label="Escutando sua pergunta"
                className="relative text-[120px] leading-none font-light tracking-tighter text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)] select-none"
              >
                ?
              </div>
            </div>
          </div>
        </div>
        {/* Indicador de espera discreto */}
        <div className="mt-4 text-[11px] uppercase tracking-widest text-cyan-300/70 anim-thinking">
          <span className="anim-thinking">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
        {/* Texto simples para iniciar fala */}
        <div
          onClick={onStartListening}
          className="mt-10 text-cyan-300 text-sm font-medium cursor-pointer select-none"
        >
          Falar agora
        </div>
        </div>
      );
    }

  // Estado: processando (TTS gerando / áudio reproduzindo) -> equalizer minimalista
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 helmet relative">
        <div className="flex items-end gap-1 h-24 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="anim-eq-bar w-3 rounded bg-gradient-to-b from-emerald-300 via-cyan-300 to-sky-500"
              style={{ height: `${30 + i * 10}px` }}
            />
          ))}
        </div>
        <div className="text-emerald-300 text-sm font-medium tracking-wide">
          Respondendo...
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
