import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import { calculateEyePosition, determineExpression, getExpressionStyles } from './robotEyesUtils';

type Props = {
  facePosition: {
    x: number;
    y: number;
    videoWidth: number;
    videoHeight: number;
  };
  isListening?: boolean;
  isProcessing?: boolean;
  onStartListening?: () => void;
};

export default function RobotEyes({
  facePosition,
  isListening = false,
  isProcessing = false,
  onStartListening,
}: Props) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  const expression = determineExpression(facePosition.x, facePosition.y);
  const { offsetX, offsetY } = calculateEyePosition(
    facePosition.x,
    facePosition.y,
    facePosition.videoWidth,
    facePosition.videoHeight
  );
  const expressionStyles = getExpressionStyles(expression);

  if (isListening && !isProcessing) {
    return (
      <View style={styles.listeningContainer}>
        <Text style={styles.questionText}>?</Text>
        <Button title="Iniciar escuta" onPress={onStartListening} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.eyeContainer,
          {
            transform: [{ translateX: offsetX }, { translateY: offsetY }],
            opacity: isBlinking ? 0 : 1,
            ...expressionStyles,
          },
        ]}
      >
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
      <View style={styles.mouth} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  eyeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    height: 90,
  },
  eye: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    opacity: 0.9,
  },
  mouth: {
    width: 80,
    height: 20,
    backgroundColor: '#fff',
    marginTop: 20,
  },
  listeningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 120,
    color: '#0ff',
  },
});
