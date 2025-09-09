export type Expression = 'normal' | 'funny';

export function calculateEyePosition(
  faceX: number,
  faceY: number,
  videoWidth: number,
  videoHeight: number
) {
  const eyeContainerWidth = 300;
  const eyeContainerHeight = 90;
  const helmetWidth = 500;
  const helmetHeight = 450;

  const width = videoWidth || 720;
  const height = videoHeight || 560;

  if (faceX === 0 && faceY === 0) {
    return { offsetX: 0, offsetY: 0 };
  }

  const normalizedX = (faceX - width / 2) / (width / 2);
  const normalizedY = (faceY - height / 2) / (height / 2);

  const maxMoveX = Math.min(
    (helmetWidth - eyeContainerWidth) / 2,
    eyeContainerWidth / 4
  );
  const maxMoveY = Math.min(
    (helmetHeight - eyeContainerHeight) / 2,
    eyeContainerHeight / 4
  );

  let offsetX = -normalizedX * maxMoveX * 0.8;
  let offsetY = normalizedY * maxMoveY * 0.8;

  offsetX = Math.max(-maxMoveX, Math.min(offsetX, maxMoveX));
  offsetY = Math.max(-maxMoveY, Math.min(offsetY, maxMoveY));

  return { offsetX, offsetY };
}

export function determineExpression(faceX: number, faceY: number): Expression {
  return faceX === 0 && faceY === 0 ? 'normal' : 'funny';
}

export function getExpressionStyles(expression: Expression) {
  if (expression === 'funny') {
    return {
      // React Native não suporta animações de CSS nativas; aqui
      // apenas alteramos a cor como indicação simples.
      tintColor: '#0ff',
    } as const;
  }
  return {} as const;
}
