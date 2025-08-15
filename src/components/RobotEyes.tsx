'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

type Expression = 'normal' | 'puppy';

export default function RobotEyes() {
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
    <div className="flex items-center justify-center gap-8 helmet">    

      {/* Olho Esquerdo */}
      <div 
        className={`w-24 h-24 overflow-hidden transition-all duration-500 ${
          isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'
        }`}
        style={getPuppyStyles()}
      >
        <Image
          src="/face/olho.png"
          alt="Olho esquerdo"
          width={120}
          height={120}
          // className={expression === 'puppy' ? 'opacity-90' : ''}
          className='opacity-90'
        />
      </div>

      {/* Olho Direito */}
      <div 
        className={`w-24 h-24 overflow-hidden transition-all duration-500 ${
          isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'
        }`}
        // style={{
        //   ...getPuppyStyles(),
        //   transform: expression === 'puppy' 
        //     ? 'scale(1.3) translateY(3px) rotate(2deg)' 
        //     : undefined
        // }}
      >
        <Image
          src="/face/olho.png"
          alt="Olho direito"
          width={120}
          height={120}
          // className={expression === 'puppy' ? 'opacity-90' : ''}
          className='opacity-90'
        />
      </div>

     
    </div>
  );
}