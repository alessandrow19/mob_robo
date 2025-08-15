'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

type Expression = 'normal' | 'puppy';
type RobotEyesProps = {
  facePosition: { x: number; y: number };
};

export default function RobotEyes({ facePosition }: RobotEyesProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [expression, setExpression] = useState<Expression>('normal');
  const [showHearts, setShowHearts] = useState(false);
  const [showTears, setShowTears] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

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
      setExpression(prev => prev === 'normal' ? 'puppy' : 'normal');
    }, 5000);

    return () => clearInterval(expressionInterval);
  }, []);

  // Calcular o deslocamento dos olhos com base na posição do rosto
  const calculateEyePosition = (faceX: number, faceY: number) => {
    const maxOffset = 50; // Máximo deslocamento dos olhos
    const offsetX = Math.min(Math.max((faceX / 20)*-1, -maxOffset), maxOffset);
    const offsetY = Math.min(Math.max((faceY / 20)*-1, -maxOffset), maxOffset);
    return { offsetX, offsetY };
  };

  const { offsetX, offsetY } = calculateEyePosition(facePosition.x, facePosition.y);

  // Estilos para olhinhos pidões
  const getPuppyStyles = () => {
    if (expression === 'puppy') {
      return {
        transform: 'scale(1.3) translateY(3px) rotate(-2deg)',
        filter: 'brightness(1.1)',
        animation: 'puppy-tremble 0.8s ease-in-out infinite',
      };
    }
    return {};
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 helmet">    
 {/* Olhos */}
    <div className="flex items-center justify-center gap-8">
      {/* Olho Esquerdo */}
      <div 
        className={`w-24 h-24 overflow-hidden transition-all duration-500 ${
          isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'
        }`}  

        style={{
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        <Image
          src="/face/olho.png"
          alt="Olho esquerdo"
          width={100}
          height={100}
          // className={expression === 'puppy' ? 'opacity-90' : ''}
          className='opacity-90'
        />
      </div>

      {/* Olho Direito */}
      <div 
        className={`w-24 h-24 overflow-hidden transition-all duration-500 ${
          isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'
        }`}

        style={{
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        <Image
          src="/face/olho.png"
          alt="Olho direito"
          width={100}
          height={100}         
          className='opacity-90'
        />
      </div>
    </div>

      {/* Olhinhos pidões */}
      <div className='boca animate-pulse'>
        <Image
          src="/face/boca.png"
          alt="Boca"
          width={100}
          height={100}
        />
      </div>

     
    </div>
  );
}