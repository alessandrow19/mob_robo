import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import "./FaceDetection.css";

const FaceDetection = ({ videoElement, onFaceDetected, onSmile, onAngry }) => {
  const canvasRef = useRef(null);
  const isSmilingRef = useRef(false);
  const isAngryRef = useRef(false);

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
            .withFaceLandmarks()
            .withFaceExpressions();
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

            if (onSmile) {
              // Aumenta o limiar para 0.8 e adiciona log
              const smiling = detections[0].expressions?.happy > 0.8;
              if (smiling && !isSmilingRef.current) {
                isSmilingRef.current = true;
                console.log("Sorriso detectado! Ativando modo escuta.");
                onSmile();
              } else if (!smiling) {
                isSmilingRef.current = false;
              }
            }

            if (onAngry) {
              const angry = detections[0].expressions?.angry > 0.7;
              if (angry && !isAngryRef.current) {
                isAngryRef.current = true;
                onAngry();
              } else if (!angry) {
                isAngryRef.current = false;
              }
            }
          } else {
            // Mantém os olhos centralizados quando não há faces detectadas
            if (onFaceDetected)
              onFaceDetected({ x: 0, y: 0, direction: "center" });
            if (onSmile) isSmilingRef.current = false;
            if (onAngry) isAngryRef.current = false;
          }
        }, 1000);
      }
    };

    loadModels().then(detectFaces);
  }, [videoElement]);

  return <canvas ref={canvasRef} className="canvas-face " />;
};

export default FaceDetection;
