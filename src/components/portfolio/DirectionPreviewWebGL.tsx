"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface DirectionItemData {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
}

interface DirectionPreviewWebGLProps {
  activeDirection: DirectionItemData | null;
  activeSlotRect: { left: number; top: number; width: number; height: number } | null;
  directions: DirectionItemData[];
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

    // 1. 2D Elastik mato cho'zilishi
    newPosition.x += sin(uv.y * PI) * uDelta.x * uAmplitude;
    newPosition.y += sin(uv.x * PI) * uDelta.y * uAmplitude;

    // 2. 3D Z-o'qi bo'yicha matodek bukilish va to'lqinlanish
    float zBend = (sin(uv.y * PI) * uDelta.x + sin(uv.x * PI) * uDelta.y) * (uAmplitude * 1.8);
    
    // Shamolda mato tebranishi (Cloth wave ripple)
    vec2 centeredUv = uv - vec2(0.5);
    float speed = length(uDelta);
    float wave = sin(centeredUv.x * 6.0 + uTime * 6.0) * cos(centeredUv.y * 6.0 + uTime * 5.0) * (speed * 0.22);

    newPosition.z += zBend + wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

export const fragment = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uNextTexture;
uniform float uMixFactor;
uniform float uAlpha;
uniform vec2 uPlaneRes;
uniform vec2 uMediaRes;
uniform vec2 uNextMediaRes;

vec2 CoverUV(vec2 uv, vec2 planeRes, vec2 mediaRes) {
    vec2 s = planeRes; // Plane aspect ratio
    vec2 i = mediaRes; // Image natural aspect ratio
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 newUv = uv;
    if (rs > ri) {
        newUv.y = (uv.y - 0.5) * (ri / rs) + 0.5;
    } else {
        newUv.x = (uv.x - 0.5) * (rs / ri) + 0.5;
    }
    return newUv;
}

void main() {
    vec2 uv1 = CoverUV(vUv, uPlaneRes, uMediaRes);
    vec2 uv2 = CoverUV(vUv, uPlaneRes, uNextMediaRes);

    vec4 tex1 = texture2D(uTexture, uv1);
    vec4 tex2 = texture2D(uNextTexture, uv2);

    // Ultra-smooth easing crossfade
    float mixSmooth = smoothstep(0.0, 1.0, uMixFactor);
    vec4 blended = mix(tex1, tex2, mixSmooth);

    gl_FragColor = vec4(blended.rgb, blended.a * uAlpha);
}
`;

export default function DirectionPreviewWebGL({
  activeDirection,
  activeSlotRect,
  directions,
}: DirectionPreviewWebGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    textures: Record<string, THREE.Texture>;
    mediaResolutions: Record<string, THREE.Vector2>;
    animationFrameId: number;
    mouse: { x: number; y: number; targetX: number; targetY: number };
    delta: { x: number; y: number };
    targetAlpha: number;
    currentAlpha: number;
    targetScale: number;
    currentScale: number;
    targetSlot: { x: number; y: number; width: number; height: number };
    currentSlot: { x: number; y: number };
    currentTexId: string | null;
    nextTexId: string | null;
    mixFactor: number;
    targetMixFactor: number;
  } | null>(null);

  const activeDirectionRef = useRef<DirectionItemData | null>(activeDirection);
  const activeSlotRectRef = useRef(activeSlotRect);

  useEffect(() => {
    activeDirectionRef.current = activeDirection;
    activeSlotRectRef.current = activeSlotRect;

    const state = sceneRef.current;
    if (!state) return;

    if (activeDirection) {
      const newId = activeDirection.id;

      if (!state.currentTexId) {
        // Initial hover: set both slots to current active image
        state.currentTexId = newId;
        state.nextTexId = newId;
        state.mixFactor = 1.0;
        state.targetMixFactor = 1.0;

        const tex = state.textures[newId];
        const res = state.mediaResolutions[newId] || new THREE.Vector2(1600, 1000);
        if (tex) {
          state.material.uniforms.uTexture.value = tex;
          state.material.uniforms.uNextTexture.value = tex;
          state.material.uniforms.uMediaRes.value.copy(res);
          state.material.uniforms.uNextMediaRes.value.copy(res);
          state.material.uniforms.uMixFactor.value = 1.0;
        }
      } else if (state.nextTexId !== newId) {
        // Smooth crossfade from previous image to new image
        const prevId = state.nextTexId || state.currentTexId;
        const prevTex = state.textures[prevId];
        const nextTex = state.textures[newId];
        const prevRes = state.mediaResolutions[prevId] || new THREE.Vector2(1600, 1000);
        const nextRes = state.mediaResolutions[newId] || new THREE.Vector2(1600, 1000);

        if (prevTex && nextTex) {
          state.material.uniforms.uTexture.value = prevTex;
          state.material.uniforms.uNextTexture.value = nextTex;
          state.material.uniforms.uMediaRes.value.copy(prevRes);
          state.material.uniforms.uNextMediaRes.value.copy(nextRes);
          state.currentTexId = prevId;
          state.nextTexId = newId;
          state.mixFactor = 0.0;
          state.targetMixFactor = 1.0;
        }
      }

      state.targetAlpha = 1.0;
      state.targetScale = 1.0;

      if (activeSlotRect) {
        state.targetSlot = {
          x: activeSlotRect.left + activeSlotRect.width / 2,
          y: activeSlotRect.top + activeSlotRect.height / 2,
          width: activeSlotRect.width,
          height: activeSlotRect.height,
        };
      }
    } else {
      state.targetAlpha = 0.0;
      state.targetScale = 0.92;

      // Clean transition reset after fade out
      setTimeout(() => {
        if (!activeDirectionRef.current && sceneRef.current) {
          sceneRef.current.currentTexId = null;
          sceneRef.current.nextTexId = null;
          sceneRef.current.mixFactor = 1.0;
          sceneRef.current.targetMixFactor = 1.0;
        }
      }, 450);
    }
  }, [activeDirection, activeSlotRect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const cameraDistance = 600;
    const fov = (2 * Math.atan(height / 2 / cameraDistance) * 180) / Math.PI;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 2000);
    camera.position.z = cameraDistance;

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
    renderer.domElement.style.zIndex = "40";
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const textures: Record<string, THREE.Texture> = {};
    const mediaResolutions: Record<string, THREE.Vector2> = {};

    const placeholderCanvas = document.createElement("canvas");
    placeholderCanvas.width = 1;
    placeholderCanvas.height = 1;
    const placeholderTexture = new THREE.CanvasTexture(placeholderCanvas);

    // High-impact vertical portrait dimensions
    const planeWidth = Math.min(Math.max(window.innerWidth * 0.17, 210), 280);
    const planeHeight = planeWidth * (330 / 230);
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 36, 36);

    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTexture: { value: placeholderTexture },
        uNextTexture: { value: placeholderTexture },
        uMixFactor: { value: 1.0 },
        uDelta: { value: new THREE.Vector2(0, 0) },
        uAmplitude: { value: 0.14 },
        uTime: { value: 0 },
        uAlpha: { value: 0 },
        uPlaneRes: { value: new THREE.Vector2(planeWidth, planeHeight) },
        uMediaRes: { value: new THREE.Vector2(1600, 1000) },
        uNextMediaRes: { value: new THREE.Vector2(1600, 1000) },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    directions.forEach((dir) => {
      if (dir.image) {
        textureLoader.load(
          dir.image,
          (tex) => {
            tex.colorSpace = THREE.NoColorSpace;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            textures[dir.id] = tex;

            const img = tex.image as HTMLImageElement;
            const w = img ? img.naturalWidth || img.width || 1600 : 1600;
            const h = img ? img.naturalHeight || img.height || 1000 : 1000;
            mediaResolutions[dir.id] = new THREE.Vector2(w, h);

            if (activeDirectionRef.current?.id === dir.id && material) {
              material.uniforms.uTexture.value = tex;
              material.uniforms.uNextTexture.value = tex;
              material.uniforms.uMediaRes.value.set(w, h);
              material.uniforms.uNextMediaRes.value.set(w, h);
            }
          },
          undefined,
          (err) => console.warn("Failed to load direction texture:", dir.image, err)
        );
      }
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

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

    const initialSlot = activeSlotRectRef.current
      ? {
          x: activeSlotRectRef.current.left + activeSlotRectRef.current.width / 2,
          y: activeSlotRectRef.current.top + activeSlotRectRef.current.height / 2,
        }
      : { x: width / 2, y: height / 2 };

    sceneRef.current = {
      renderer,
      scene,
      camera,
      mesh,
      material,
      textures,
      mediaResolutions,
      animationFrameId: 0,
      mouse,
      delta,
      targetAlpha: 0,
      currentAlpha: 0,
      targetScale: 0.92,
      currentScale: 0.92,
      targetSlot: {
        x: initialSlot.x,
        y: initialSlot.y,
        width: planeWidth,
        height: planeHeight,
      },
      currentSlot: { x: initialSlot.x, y: initialSlot.y },
      currentTexId: null,
      nextTexId: null,
      mixFactor: 1.0,
      targetMixFactor: 1.0,
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const state = sceneRef.current;
      if (!state) return;

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      // Delta calculation for cloth distortion
      const targetDeltaX = (mouse.targetX - mouse.x) * 0.7;
      const targetDeltaY = (mouse.targetY - mouse.y) * 0.7;

      delta.x += (targetDeltaX - delta.x) * 0.15;
      delta.y += (targetDeltaY - delta.y) * 0.15;

      // Smooth interpolation of slot position (anchored to the exact center of the hovered list row!)
      state.currentSlot.x += (state.targetSlot.x - state.currentSlot.x) * 0.16;
      state.currentSlot.y += (state.targetSlot.y - state.currentSlot.y) * 0.16;

      // Subtle magnetic draw towards mouse (talpinish)
      const magneticOffsetX = (mouse.x - state.currentSlot.x) * 0.08;
      const magneticOffsetY = (mouse.y - state.currentSlot.y) * 0.12;

      const posX = state.currentSlot.x + magneticOffsetX;
      const posY = state.currentSlot.y + magneticOffsetY;

      // Convert screen coords to Three.js world coords
      mesh.position.x = posX - window.innerWidth / 2;
      mesh.position.y = -(posY - window.innerHeight / 2);

      // 3D cloth tilt / rotation
      const targetRotY = THREE.MathUtils.clamp(delta.x * 0.006, -0.28, 0.28);
      const targetRotX = THREE.MathUtils.clamp(-delta.y * 0.006, -0.28, 0.28);
      const targetRotZ = THREE.MathUtils.clamp(delta.x * 0.002, -0.08, 0.08);

      mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.12;
      mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.12;
      mesh.rotation.z += (targetRotZ - mesh.rotation.z) * 0.1;

      // Smooth texture crossfade
      state.mixFactor += (state.targetMixFactor - state.mixFactor) * 0.11;
      material.uniforms.uMixFactor.value = state.mixFactor;

      // Alpha & Scale transitions
      state.currentAlpha += (state.targetAlpha - state.currentAlpha) * 0.14;
      state.currentScale += (state.targetScale - state.currentScale) * 0.14;

      material.uniforms.uAlpha.value = state.currentAlpha;
      mesh.scale.setScalar(state.currentScale);

      // Update shader uniforms
      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uDelta.value.set(delta.x, delta.y);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);
    sceneRef.current.animationFrameId = animationFrameId;

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      Object.values(textures).forEach((t) => t.dispose());
    };
  }, [directions]);

  return <div ref={containerRef} className="directions-webgl-container" />;
}
