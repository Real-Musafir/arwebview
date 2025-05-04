// components/VRView.js
"use client";
import React, { useEffect, useRef, useState } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";
import * as tf from "@tensorflow/tfjs";
import * as THREE from "three";

const broselowZones = [
  { color: "gray", min: 46, max: 55, weight: 3 },
  { color: "pink", min: 56, max: 65, weight: 6 },
  { color: "red", min: 66, max: 75, weight: 8 },
  { color: "purple", min: 76, max: 85, weight: 10 },
  { color: "yellow", min: 86, max: 95, weight: 12 },
  { color: "white", min: 96, max: 105, weight: 14 },
  { color: "blue", min: 106, max: 115, weight: 18 },
  { color: "orange", min: 116, max: 125, weight: 22 },
  { color: "green", min: 126, max: 135, weight: 26 },
  { color: "light green", min: 136, max: 145, weight: 30 },
];

const emergencyData = {
  epinephrine: { doseMgPerKg: 0.01 },
  equipment: {
    laryngoscopeBlade: { 3: "0", 6: "1", 8: "2", 10: "2.5", 12: "3" },
    ettSize: { 3: "2.5", 6: "4.0", 8: "5.0", 10: "5.5", 12: "6.0" },
  },
};

const getBroselowInfo = (heightCm) => {
  return broselowZones.find(
    (zone) => heightCm >= zone.min && heightCm <= zone.max
  );
};

const calculateEmergencyData = (weightKg) => {
  return {
    epinephrineDose:
      (weightKg * emergencyData.epinephrine.doseMgPerKg).toFixed(2) + " mg",
    ettSize: emergencyData.equipment.ettSize[weightKg] || "N/A",
    laryngoscopeBlade:
      emergencyData.equipment.laryngoscopeBlade[weightKg] || "N/A",
  };
};

const VRView = ({ image }) => {
  const containerRef = useRef(null);
  const [heightCm, setHeightCm] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!image) return;

    const renderVRScene = async () => {
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => (img.onload = resolve));

      const net = await bodyPix.load();
      const segmentation = await net.segmentPerson(img);

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const mask = segmentation.data;
      let topY = canvas.height,
        bottomY = 0;

      for (let i = 0; i < mask.length; i++) {
        if (mask[i]) {
          const y = Math.floor(i / canvas.width);
          if (y < topY) topY = y;
          if (y > bottomY) bottomY = y;
        }
      }

      const centerX = canvas.width / 2;
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(centerX, topY, 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(centerX, bottomY, 10, 0, 2 * Math.PI);
      ctx.fill();

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        canvas.width / canvas.height,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(canvas.width, canvas.height);
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);

      const texture = new THREE.CanvasTexture(canvas);
      const geometry = new THREE.PlaneGeometry(
        8,
        8 * (canvas.height / canvas.width)
      );
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);

      camera.position.z = 10;
      renderer.render(scene, camera);
    };

    renderVRScene();
  }, [image]);

  const handleCalculate = () => {
    const height = parseInt(heightCm);
    const zone = getBroselowInfo(height);
    if (zone) {
      const emergency = calculateEmergencyData(zone.weight);
      setResult({ zone, emergency });
    } else {
      setResult(null);
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full h-[500px] bg-black rounded-md overflow-hidden shadow-lg"
      />

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Enter Height (cm):
        </label>
        <input
          type="number"
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
          className="mt-1 p-2 border rounded w-full"
          placeholder="e.g. 85"
        />
        <button
          onClick={handleCalculate}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Calculate Broselow Zone
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded shadow">
          <h2 className="text-lg font-bold">
            Broselow Zone:{" "}
            <span className={`text-${result.zone.color}-600`}>
              {result.zone.color}
            </span>
          </h2>
          <p>Estimated Weight: {result.zone.weight} kg</p>
          <p>Epinephrine Dose: {result.emergency.epinephrineDose}</p>
          <p>ETT Size: {result.emergency.ettSize}</p>
          <p>Laryngoscope Blade: {result.emergency.laryngoscopeBlade}</p>
        </div>
      )}
    </div>
  );
};

export default VRView;
