"use client";
import React, { useEffect, useRef } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";
import * as tf from "@tensorflow/tfjs";
import * as THREE from "three";

const VRView = ({ image }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!image) return;

    const renderVRScene = async () => {
      // Load image
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => (img.onload = resolve));

      // Detect person
      const net = await bodyPix.load();
      const segmentation = await net.segmentPerson(img);

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Analyze mask for head and foot
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

      // Mark head (red) and foot (green)
      const centerX = canvas.width / 2;
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(centerX, topY, 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(centerX, bottomY, 10, 0, 2 * Math.PI);
      ctx.fill();

      // Setup Three.js scene
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

      // Convert canvas to texture
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

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] bg-black rounded-md overflow-hidden shadow-lg"
    />
  );
};

export default VRView;
