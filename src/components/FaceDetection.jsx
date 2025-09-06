import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import "./FaceDetection.css";

const FaceDetection = ({ videoElement, onFaceDetected }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);
    };

    const detectFaces = async () => {
      if (videoElement && canvasRef.current) {
        const displaySize = {
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);

        setInterval(async () => {
          const detections = await faceapi
            .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );

          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);

          // Lógica de direção
          if (detections.length > 0) {
            const box = detections[0].detection.box;
            // Ajuste para centralizar melhor o quadro
            const faceCenterX =
              box.x +
              box.width / 2 -
              (canvasRef.current.width - displaySize.width) / 2;
            const faceCenterY =
              box.y +
              box.height / 2 -
              (canvasRef.current.height - displaySize.height) / 2;
            const videoCenterX = displaySize.width / 2;
            const videoCenterY = displaySize.height / 2;

            let direction = "center";
            if (faceCenterX < videoCenterX - 50) direction = "left";
            else if (faceCenterX > videoCenterX + 50) direction = "right";
            else if (faceCenterY < videoCenterY - 50) direction = "up";
            else if (faceCenterY > videoCenterY + 50) direction = "down";

            if (onFaceDetected) {
              onFaceDetected({
                x: faceCenterX,
                y: faceCenterY,
                direction,
                videoWidth: displaySize.width,
                videoHeight: displaySize.height,
              });
            }
          }
        }, 1000);
      }
    };

    loadModels().then(detectFaces);
  }, [videoElement]);

  return <canvas ref={canvasRef} className="canvas-face " />;
};

export default FaceDetection;
