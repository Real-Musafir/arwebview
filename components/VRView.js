"use client";
import React, { useEffect, useRef } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";
import * as tf from "@tensorflow/tfjs";
import * as THREE from "three";

const VRView = ({ image }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!image) return;

    const loadAndRender = async () => {
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => (img.onload = resolve));

      const net = await bodyPix.load();

      const segmentation = await net.segmentPerson(img);

      // Create a canvas with dots on head and foot (basic demo)
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Find top-most and bottom-most points of person
      const { data: mask } = segmentation;
      let top = img.height,
        bottom = 0;

      for (let i = 0; i < mask.length; i++) {
        if (mask[i]) {
          const y = Math.floor(i / img.width);
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(img.width / 2, top, 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(img.width / 2, bottom, 10, 0, 2 * Math.PI);
      ctx.fill();

      // THREE.js 2D/3D plane
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        canvas.width / canvas.height,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(canvas.width, canvas.height);
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      const geometry = new THREE.PlaneGeometry(
        5,
        5 * (canvas.height / canvas.width)
      );
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);

      camera.position.z = 5;
      const animate = () => {
        requestAnimationFrame(animate);
        plane.rotation.y += 0.005;
        renderer.render(scene, camera);
      };
      animate();
    };

    loadAndRender();
  }, [image]);

  return <div ref={containerRef} className="w-full h-[500px]" />;
};

export default VRView;
