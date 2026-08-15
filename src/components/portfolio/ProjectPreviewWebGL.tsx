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

    // 1. 2D Elastik cho'zilish (X va Y o'qlari)
    newPosition.x += sin(uv.y * PI) * uDelta.x * uAmplitude;
    newPosition.y += sin(uv.x * PI) * uDelta.y * uAmplitude;

    // 2. 3D Z-o'qi bo'yicha havoda varaqdek bukilish va to'lqinlanish
    float zBend = (sin(uv.y * PI) * uDelta.x + sin(uv.x * PI) * uDelta.y) * (uAmplitude * 1.6);
    
    // Shamolda hilpirash tebranishi (Wave ripple)
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
    
    // Rasmning 100% asl tabiiy yorug'ligi va ranglari (qorayishsiz)
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

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Three.js Scene & Camera (1 unit = 1 pixel at z = 600)
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

    // Preload project textures in true color (NoColorSpace preserves exact RGB bytes without gamma darkening)
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

    // Mesh Geometry & Combined Shader Material
    const planeWidth = Math.min(Math.max(window.innerWidth * 0.22, 280), 420);
    const planeHeight = planeWidth * (10 / 16);
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 40, 40);

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

    // Mouse Tracking state
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
    };
    const delta = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      camera.aspect = newW / newH;
      camera.fov = (2 * Math.atan(newH / 2 / cameraDistance) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      // Delta calculation with smooth damping spring
      const targetDeltaX = (mouse.targetX - mouse.x) * 0.7;
      const targetDeltaY = (mouse.targetY - mouse.y) * 0.7;

      delta.x += (targetDeltaX - delta.x) * 0.15;
      delta.y += (targetDeltaY - delta.y) * 0.15;

      // Position mesh at cursor
      mesh.position.x = mouse.x - window.innerWidth / 2;
      mesh.position.y = -(mouse.y - window.innerHeight / 2);

      // 3D paper rotation & tilt
      const targetRotY = THREE.MathUtils.clamp(delta.x * 0.007, -0.35, 0.35);
      const targetRotX = THREE.MathUtils.clamp(-delta.y * 0.007, -0.35, 0.35);
      const targetRotZ = THREE.MathUtils.clamp(delta.x * 0.002, -0.1, 0.1);

      mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.12;
      mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.12;
      mesh.rotation.z += (targetRotZ - mesh.rotation.z) * 0.1;

      // Alpha & Scale transitions
      const state = sceneRef.current;
      if (state) {
        state.currentAlpha += (state.targetAlpha - state.currentAlpha) * 0.14;
        state.currentScale += (state.targetScale - state.currentScale) * 0.14;

        material.uniforms.uAlpha.value = state.currentAlpha;
        mesh.scale.setScalar(state.currentScale);
      }

      // Update shader uniforms
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
