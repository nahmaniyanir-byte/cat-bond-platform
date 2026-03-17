"use client";

import { useEffect, useRef } from "react";

export function BackgroundGlobe() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let animationId: number;
    let renderer: any;
    let cleanupResize: (() => void) | undefined;

    async function init() {
      const THREE = await import("three");

      const width = window.innerWidth;
      const height = window.innerHeight;

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 2.5;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
      }

      const geometry = new THREE.SphereGeometry(1, 64, 64);

      const wireframeMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });
      const globe = new THREE.Mesh(geometry, wireframeMat);
      scene.add(globe);

      const solidMat = new THREE.MeshBasicMaterial({
        color: 0x0a1628,
        transparent: true,
        opacity: 0.4,
      });
      const solidGlobe = new THREE.Mesh(geometry, solidMat);
      scene.add(solidGlobe);

      function animate() {
        animationId = requestAnimationFrame(animate);
        globe.rotation.y += 0.001;
        solidGlobe.rotation.y += 0.001;
        renderer.render(scene, camera);
      }
      animate();

      function handleResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener("resize", handleResize);
      cleanupResize = () => window.removeEventListener("resize", handleResize);
    }

    init().catch(console.error);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (cleanupResize) cleanupResize();
      if (renderer) renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.6,
      }}
    />
  );
}
