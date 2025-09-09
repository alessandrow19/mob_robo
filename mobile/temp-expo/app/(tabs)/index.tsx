import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import RobotEyes from "../../../components/RobotEyes";
import FaceDetection from "../../../components/FaceDetection";
import DirectionTracker from "../../../components/DirectionTracker";
import VoiceAssistant from "../../../components/VoiceAssistant";

export default function HomeScreen() {
  const [facePosition, setFacePosition] = useState({
    x: 0,
    y: 0,
    videoWidth: 0,
    videoHeight: 0,
  });
  const [currentDirection, setCurrentDirection] = useState("center");
  const [isListening, setIsListening] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  const handleSmile = () => {
    if (!isListening && !isTalking) setIsListening(true);
  };

  const handleAngry = () => {
    if (isListening) setIsListening(false);
  };

  return (
    <View style={styles.container}>
      <VoiceAssistant
        isListening={isListening}
        onStart={() => setIsListening(true)}
        onAudioStart={() => {
          setIsListening(false);
          setIsTalking(true);
        }}
        onEnd={() => {
          setIsListening(false);
          setIsTalking(false);
        }}
      />
      <RobotEyes
        facePosition={facePosition}
        isListening={isListening}
        isProcessing={isTalking}
        onStartListening={() => {
          if (!isListening && !isTalking) setIsListening(true);
        }}
      />
      <FaceDetection
        onFaceDetected={({ x, y, direction, videoWidth, videoHeight }) => {
          setFacePosition({ x, y, videoWidth, videoHeight });
          setCurrentDirection(direction);
        }}
        onSmile={handleSmile}
        onAngry={handleAngry}
      />
      <DirectionTracker direction={currentDirection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
});
