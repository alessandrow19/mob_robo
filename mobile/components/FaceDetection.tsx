import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

type FaceInfo = {
  x: number;
  y: number;
  direction: string;
  videoWidth: number;
  videoHeight: number;
};

type Props = {
  onFaceDetected: (info: FaceInfo) => void;
  onSmile?: () => void;
  onAngry?: () => void;
};

export default function FaceDetection({
  onFaceDetected,
  onSmile,
  onAngry,
}: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const smileRef = useRef(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const handleFacesDetected = ({ faces }: { faces: FaceDetector.Face[] }) => {
    if (faces.length > 0 && layout.width && layout.height) {
      const face = faces[0];
      const faceX = face.bounds.origin.x + face.bounds.size.width / 2;
      const faceY = face.bounds.origin.y + face.bounds.size.height / 2;
      let direction = 'center';
      const centerX = layout.width / 2;
      const centerY = layout.height / 2;
      if (faceX < centerX - 50) direction = 'left';
      else if (faceX > centerX + 50) direction = 'right';
      else if (faceY < centerY - 50) direction = 'up';
      else if (faceY > centerY + 50) direction = 'down';

      onFaceDetected({
        x: faceX,
        y: faceY,
        direction,
        videoWidth: layout.width,
        videoHeight: layout.height,
      });

      if (onSmile) {
        const smiling = face.smilingProbability ?? 0;
        if (smiling > 0.8 && !smileRef.current) {
          smileRef.current = true;
          onSmile();
        } else if (smiling < 0.5) {
          smileRef.current = false;
        }
      }

      if (onAngry) {
        const smiling = face.smilingProbability ?? 0;
        if (smiling < 0.1 && smileRef.current) {
          onAngry();
        }
      }
    }
  };

  if (hasPermission === false) {
    return null;
  }

  return (
    <View
      style={styles.cameraContainer}
      onLayout={(e) => setLayout(e.nativeEvent.layout)}
    >
      <Camera
        style={styles.camera}
        type={CameraType.front}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.accurate,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 200,
    height: 200,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
});
