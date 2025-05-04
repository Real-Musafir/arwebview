"use client";
import { useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import VRView from "@/components/VRView";

export default function Home() {
  const [capturedImage, setCapturedImage] = useState(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">VR Camera Visualization</h1>
      <CameraCapture onCapture={setCapturedImage} />
      {capturedImage && (
        <>
          <h2 className="text-lg mt-6 mb-2">VR View:</h2>
          <VRView image={capturedImage} />
        </>
      )}
    </div>
  );
}
