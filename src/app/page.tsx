"use client";

import FaceDetection from "@/components/FaceDetection";
import VideoStream from "@/components/VideoStream";
import RobotEyes from "@/components/RobotEyes";
import Image from "next/image";''
import { useState } from "react";

export default function Home() {
const [videoElement, setVideoElement] = useState(null)
  return (
    <>

    <RobotEyes /> 

    <div className="container">
     
      <div >
        <VideoStream onVideoReady={setVideoElement} />
        {videoElement && <FaceDetection videoElement={videoElement} />}
      </div>     
    </div>
    </>
  );
}

