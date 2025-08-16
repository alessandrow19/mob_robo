"use client";

import React, { useEffect, useRef } from "react";
import "./FaceDetection.css";

const VideoStream = ({ onVideoReady }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            onVideoReady(videoRef.current); // Notifica o componente pai quando o vídeo está pronto
          }
        })
        .catch((err) => console.error("Error accessing webcam:", err));
    };

    startVideo();
  }, [onVideoReady]);

  return (
    <video
      ref={videoRef}
      id="video"
      className="video-stream"
      autoPlay
      muted
      width={500}
      height={450}
    />
  );
};

export default VideoStream;
