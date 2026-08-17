"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ProjectItemData } from "./ProjectList";

interface ProjectPreviewWebGLProps {
  activeProject: ProjectItemData | null;
  projects: ProjectItemData[];
}

export const vertex = `
varying vec2 vUv;
uniform vec2 uDelta;
uniform float uAmplitude;
uniform float uTime;
float PI = 3.141592653589793238;

void main() {
    vUv = uv;
    vec3 newPosition = position;

    // 1. 2D Elastic stretch (X and Y axes)
    newPosition.x += sin(uv.y * PI) * uDelta.x * uAmplitude;
    newPosition.y += sin(uv.x * PI) * uDelta.y * uAmplitude;

    // 2. 3D Z-axis bend like paper / cloth in wind
    float zBend = (sin(uv.y * PI) * uDelta.x + sin(uv.x * PI) * uDelta.y) * (uAmplitude * 1.6);
    
    // Wind wave ripple
    vec2 centeredUv = uv - vec2(0.5);
    float speed = length(uDelta);
    float wave = sin(centeredUv.x * 5.5 + uTime * 5.0) * cos(centeredUv.y * 5.0 + uTime * 4.0) * (speed * 0.18);

    newPosition.z += zBend + wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

export const fragment = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uAlpha;

void main() {
    vec4 tex = texture2D(uTexture, vUv);
    gl_FragColor = vec4(tex.rgb, tex.a * uAlpha);
}
`;

export default function ProjectPreviewWebGL({
  activeProject,
  projects,
}: ProjectPreviewWebGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mesh: THREE.Mesh;
    geometry: THREE.PlaneGeometry;
    material: THREE.ShaderMaterial;
    textures: Record<string, THREE.Texture>;
    animationFrameId: number;
    mouse: { x: number; y: number; targetX: number; targetY: number };
    delta: { x: number; y: number };
    targetAlpha: number;
    currentAlpha: number;
    targetScale: number;
    currentScale: number;
  } | null>(null);

  const activeProjectRef = useRef<ProjectItemData | null>(activeProject);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Completely disable Three.js WebGL on mobile to ensure 120fps native performance
    if (window.innerWidth <= 768) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Three.js Scene & Camera
    const scene = new THREE.Scene();
    const cameraDistance = 600;
    const fov = (2 * Math.atan(height / 2 / cameraDistance) * 180) / Math.PI;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 2000);
    camera.position.z = cameraDistance;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100vw";
    renderer.domElement.style.height = "100vh";
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.zIndex = "999";
    container.appendChild(renderer.domElement);

    // Texture Loader & Cache
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const textures: Record<string, THREE.Texture> = {};

    const placeholderCanvas = document.createElement("canvas");
    placeholderCanvas.width = 1;
    placeholderCanvas.height = 1;
    const placeholderTexture = new THREE.CanvasTexture(placeholderCanvas);

    // Mesh Dimensions & Segments
    const getMeshDimensions = () => {
      const mobile = window.innerWidth <= 768;
      const planeWidth = mobile
        ? Math.min(Math.max(window.innerWidth * 0.65, 220), 320)
        : Math.min(Math.max(window.innerWidth * 0.22, 280), 420);
      const planeHeight = planeWidth * (10 / 16);
      const segments = mobile ? 16 : 30;
      return { planeWidth, planeHeight, segments };
    };

    let { planeWidth, planeHeight, segments } = getMeshDimensions();
    let geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segments, segments);

    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTexture: { value: placeholderTexture },
        uDelta: { value: new THREE.Vector2(0, 0) },
        uAmplitude: { value: 0.12 },
        uTime: { value: 0 },
        uAlpha: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Preload project textures
    projects.forEach((proj) => {
      if (proj.image) {
        textureLoader.load(
          proj.image,
          (tex) => {
            tex.colorSpace = THREE.NoColorSpace;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            textures[proj.id] = tex;
            if (activeProjectRef.current?.id === proj.id && material) {
              material.uniforms.uTexture.value = tex;
            }
          },
          undefined,
          (err) => console.warn("Failed to load preview texture:", proj.image, err)
        );
      }
    });

    // Tracking state
    const isMobileInitial = width <= 768;
    const mouse = {
      x: isMobileInitial ? width * 0.62 : width / 2,
      y: height / 2,
      targetX: isMobileInitial ? width * 0.62 : width / 2,
      targetY: height / 2,
    };
    const delta = { x: 0, y: 0 };

    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let scrollVelocityY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth > 768) {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const diff = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Scroll speed translates to dynamic vertical impulse
      scrollVelocityY = Math.max(Math.min(diff * 0.9, 40), -40);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.innerWidth <= 768 && e.touches.length > 0) {
        mouse.targetX = window.innerWidth * 0.62;
        mouse.targetY = window.innerHeight * 0.5;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      width = newW;
      height = newH;
      camera.aspect = newW / newH;
      camera.fov = (2 * Math.atan(newH / 2 / cameraDistance) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, newW <= 768 ? 1.5 : 2));

      // Recreate geometry for new screen size
      const dims = getMeshDimensions();
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(dims.planeWidth, dims.planeHeight, dims.segments, dims.segments);

      if (newW <= 768) {
        mouse.targetX = newW * 0.62;
        mouse.targetY = newH * 0.5;
      }
    };

    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const state = sceneRef.current;
      if (!state) return;

      // Update Alpha & Scale transitions
      state.currentAlpha += (state.targetAlpha - state.currentAlpha) * 0.18;
      state.currentScale += (state.targetScale - state.currentScale) * 0.18;

      if (state.currentAlpha < 0.005) {
        state.currentAlpha = 0;
      }

      material.uniforms.uAlpha.value = state.currentAlpha;
      mesh.scale.setScalar(state.currentScale);

      // If fully invisible, sleep rendering
      if (state.currentAlpha === 0 && state.targetAlpha === 0) {
        return;
      }

      const elapsedTime = clock.getElapsedTime();
      const isMob = window.innerWidth <= 768;

      if (isMob) {
        // Mobile: Firmly anchored in the center of the screen
        mesh.position.x = 0;
        mesh.position.y = 0;

        // Feed vertical scroll velocity into delta.y with spring damping
        delta.x += (0 - delta.x) * 0.18;
        delta.y += (scrollVelocityY - delta.y) * 0.2;
        scrollVelocityY *= 0.84;

        // 3D Paper tilt driven by scroll
        const targetRotX = THREE.MathUtils.clamp(-delta.y * 0.008, -0.35, 0.35);
        const targetRotZ = THREE.MathUtils.clamp(-delta.y * 0.0015, -0.1, 0.1);

        mesh.rotation.y += (0 - mesh.rotation.y) * 0.14;
        mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.14;
        mesh.rotation.z += (targetRotZ - mesh.rotation.z) * 0.12;
      } else {
        // Desktop: mouse follow
        mouse.x += (mouse.targetX - mouse.x) * 0.12;
        mouse.y += (mouse.targetY - mouse.y) * 0.12;

        const targetDeltaX = (mouse.targetX - mouse.x) * 0.7;
        const targetDeltaY = (mouse.targetY - mouse.y) * 0.7;

        delta.x += (targetDeltaX - delta.x) * 0.15;
        delta.y += (targetDeltaY - delta.y) * 0.15;

        // Position mesh in 3D camera coordinates at cursor
        mesh.position.x = mouse.x - window.innerWidth / 2;
        mesh.position.y = -(mouse.y - window.innerHeight / 2);

        // 3D Paper tilt and rotation
        const targetRotY = THREE.MathUtils.clamp(delta.x * 0.007, -0.35, 0.35);
        const targetRotX = THREE.MathUtils.clamp(-delta.y * 0.008, -0.4, 0.4);
        const targetRotZ = THREE.MathUtils.clamp(delta.x * 0.002, -0.15, 0.15);

        mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.14;
        mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.14;
        mesh.rotation.z += (targetRotZ - mesh.rotation.z) * 0.12;
      }

      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uDelta.value.set(delta.x, delta.y);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    sceneRef.current = {
      renderer,
      scene,
      camera,
      mesh,
      geometry,
      material,
      textures,
      animationFrameId,
      mouse,
      delta,
      targetAlpha: 0,
      currentAlpha: 0,
      targetScale: 0.88,
      currentScale: 0.88,
    };

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [projects]);

  // Handle active project change
  useEffect(() => {
    activeProjectRef.current = activeProject;
    const state = sceneRef.current;
    if (!state) return;

    if (activeProject) {
      state.targetAlpha = 1;
      state.targetScale = 1;

      const cached = state.textures[activeProject.id];
      if (cached) {
        state.material.uniforms.uTexture.value = cached;
      } else if (activeProject.image) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        loader.load(activeProject.image, (tex) => {
          tex.colorSpace = THREE.NoColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          state.textures[activeProject.id] = tex;
          if (activeProjectRef.current?.id === activeProject.id) {
            state.material.uniforms.uTexture.value = tex;
          }
        });
      }
    } else {
      state.targetAlpha = 0;
      state.targetScale = 0.88;
    }
  }, [activeProject]);

  return <div ref={containerRef} className="project-webgl-container" />;
}
