"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export default function Head3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth * 0.28;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene & Perspective Camera with Atmospheric Depth Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#000000", 0.08);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.6);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting (clean, natural, neutral cinematic studio lights - NO BLUE!)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    // Key light (warm-white studio light from top-front-right: natural skin & relief)
    const keyLight = new THREE.DirectionalLight(0xfff8f2, 2.2);
    keyLight.position.set(1.5, 2.0, 2.8);
    scene.add(keyLight);

    // Soft neutral rim light from behind (pure white/silver accent - NO BLUE)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.6);
    rimLight.position.set(-2.0, 1.5, -1.8);
    scene.add(rimLight);

    // Soft neutral fill light
    const fillLight = new THREE.DirectionalLight(0xfff5ea, 0.7);
    fillLight.position.set(2.0, -0.5, 1.5);
    scene.add(fillLight);

    // 4. Head Root Group (cinematic ~47° side angle, lowered position overlapping OV logo)
    const BASE_Y = 0.04; // Positioned comfortably overlapping top of OV logo
    const BASE_YAW = 0.82; // ~47 degrees for a dramatic, clear 3/4 side profile

    const headGroup = new THREE.Group();
    headGroup.position.set(0, BASE_Y, 0);
    headGroup.rotation.y = BASE_YAW;
    scene.add(headGroup);

    // Uniforms for subtle shader effects (NO BLUE - pure warm white and silver stars)
    const particleUniforms = {
      uTime: { value: 0 },
      uColorWhite: { value: new THREE.Color("#ffffff") },
      uColorSilver: { value: new THREE.Color("#dce3ea") },
      uColorWarm: { value: new THREE.Color("#fff6eb") },
    };

    let faceShader: THREE.WebGLProgramParametersWithUniforms | null = null;
    let particleMaterial: THREE.ShaderMaterial | null = null;
    let particleGeometry: THREE.BufferGeometry | null = null;

    // 5. Load Draco Model
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      "/models/kalla-Optimized.glb",
      (gltf) => {
        const root = gltf.scene;

        let targetMesh: THREE.Mesh | null = null;
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && !targetMesh) {
            targetMesh = child as THREE.Mesh;
          }
        });

        if (!targetMesh) return;

        // Auto center the geometry
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 2.2 / maxDim;

        root.position.sub(center);

        // A. REALISTIC TEXTURED FACE MESH (Your real face, beard, skin & eyes)
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = mesh.material as THREE.MeshStandardMaterial;

            if (mat) {
              if (mat.map) {
                mat.map.colorSpace = THREE.SRGBColorSpace;
                mat.map.needsUpdate = true;
              }
              mat.roughness = 0.6;
              mat.metalness = 0.05;
              mat.transparent = true; // Enable transparency for bottom dissolve
              mat.depthWrite = true;

              // Smooth transparent neck dissolve & subtle neutral silver rim (NO BLUE)
              mat.onBeforeCompile = (shader) => {
                shader.uniforms.uTime = { value: 0 };

                shader.vertexShader =
                  `
                  varying vec3 vWorldNormal;
                  varying vec3 vWorldPos;
                  varying vec3 vCamDir;
                  varying float vLocalY;
                ` + shader.vertexShader;

                shader.vertexShader = shader.vertexShader.replace(
                  "#include <beginnormal_vertex>",
                  `
                  #include <beginnormal_vertex>
                  vWorldNormal = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);
                  `
                );

                shader.vertexShader = shader.vertexShader.replace(
                  "#include <begin_vertex>",
                  `
                  #include <begin_vertex>
                  vLocalY = position.y; // Centered model Y: -1.1 at bottom of neck, -0.48 at chin
                  vec4 wPos = modelMatrix * vec4(transformed, 1.0);
                  vWorldPos = wPos.xyz;
                  vCamDir = normalize(cameraPosition - wPos.xyz);
                  `
                );

                shader.fragmentShader =
                  `
                  uniform float uTime;
                  varying vec3 vWorldNormal;
                  varying vec3 vWorldPos;
                  varying vec3 vCamDir;
                  varying float vLocalY;
                ` + shader.fragmentShader;

                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <dithering_fragment>",
                  `
                  #include <dithering_fragment>
                  // Pure neutral silver rim highlight on silhouette edges (NO BLUE)
                  float fresnel = pow(1.0 - max(0.0, dot(normalize(vWorldNormal), normalize(vCamDir))), 4.0);
                  gl_FragColor.rgb += vec3(1.0, 1.0, 1.0) * (fresnel * 0.2);

                  // Lower neck smoothly becomes transparent and completely disappears
                  // -0.45 (chin/throat) is 100% solid -> fades smoothly down to -0.92 (0% transparent)
                  float neckAlpha = smoothstep(-0.92, -0.45, vLocalY);
                  gl_FragColor.a *= neckAlpha;
                  if (gl_FragColor.a < 0.01) discard;
                  `
                );

                faceShader = shader;
              };
            }
          }
        });

        headGroup.add(root);
        headGroup.scale.setScalar(scaleFactor);

        // B. DELICATE & SPARKLING STARDUST PARTICLES (Only 1,400 tiny diamond sparkles!)
        const tempMesh = new THREE.Mesh(
          (targetMesh as THREE.Mesh).geometry.clone(),
          new THREE.MeshBasicMaterial()
        );
        const sampler = new MeshSurfaceSampler(tempMesh).build();

        const particleCount = 1400; // Small, refined count so it never covers the face!
        const positions = new Float32Array(particleCount * 3);
        const normals = new Float32Array(particleCount * 3);
        const randoms = new Float32Array(particleCount * 4); // x: phase, y: speed, z: size, w: color mix

        const tempPos = new THREE.Vector3();
        const tempNorm = new THREE.Vector3();

        for (let i = 0; i < particleCount; i++) {
          sampler.sample(tempPos, tempNorm);

          // Particles float gracefully around the face (some hugging surface, some slightly airborne)
          const offset =
            Math.random() < 0.4
              ? 0.015 + Math.random() * 0.07
              : (Math.random() - 0.5) * 0.01;

          const p = tempPos.clone().addScaledVector(tempNorm, offset);

          positions[i * 3] = p.x;
          positions[i * 3 + 1] = p.y;
          positions[i * 3 + 2] = p.z;

          normals[i * 3] = tempNorm.x;
          normals[i * 3 + 1] = tempNorm.y;
          normals[i * 3 + 2] = tempNorm.z;

          randoms[i * 4] = Math.random() * Math.PI * 2; // twinkle phase
          randoms[i * 4 + 1] = 1.5 + Math.random() * 3.5; // twinkle speed
          randoms[i * 4 + 2] = 0.5 + Math.random() * 0.8; // delicate tiny size
          randoms[i * 4 + 3] = Math.random(); // color mix
        }

        particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );
        particleGeometry.setAttribute(
          "normal",
          new THREE.BufferAttribute(normals, 3)
        );
        particleGeometry.setAttribute(
          "aRandoms",
          new THREE.BufferAttribute(randoms, 4)
        );

        particleMaterial = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: particleUniforms,
          vertexShader: `
            uniform float uTime;
            attribute vec4 aRandoms;

            varying float vTwinkle;
            varying float vColorMix;

            void main() {
              vColorMix = aRandoms.w;

              float phase = aRandoms.x;
              float speed = aRandoms.y;

              // Gentle floating oscillation
              vec3 pos = position + normal * (sin(uTime * 2.0 + phase) * 0.008);

              // Independent sharp diamond glisten (twinkles like diamond dust)
              float twinkle = sin(uTime * speed + phase) * 0.5 + 0.5;
              vTwinkle = pow(twinkle, 3.5);

              vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

              // Fine, pinprick diamond size (delicate & small, never blurry or blocking the face!)
              float size = (0.7 * aRandoms.z + vTwinkle * 1.2);
              gl_PointSize = size * (24.0 / -mvPos.z);
              gl_Position = projectionMatrix * mvPos;
            }
          `,
          fragmentShader: `
            uniform vec3 uColorWhite;
            uniform vec3 uColorSilver;
            uniform vec3 uColorWarm;

            varying float vTwinkle;
            varying float vColorMix;

            void main() {
              // Crisp circular diamond sparkle
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;

              // Sharp bright pinprick center + soft halo
              float core = smoothstep(0.12, 0.0, dist);
              float halo = smoothstep(0.5, 0.05, dist);

              vec3 baseColor = mix(uColorSilver, uColorWarm, vColorMix);
              vec3 color = mix(baseColor, uColorWhite, core * 0.9 + vTwinkle * 0.8);

              float alpha = (halo * 0.35 + core * 0.8) * (0.3 + vTwinkle * 0.7);

              gl_FragColor = vec4(color, alpha);
            }
          `,
        });

        const sparkles = new THREE.Points(particleGeometry, particleMaterial);
        headGroup.add(sparkles);

        // Default gaze: cinematic 25° side angle looking toward the content
        headGroup.rotation.y = BASE_YAW;
        setIsLoaded(true);
      },
      undefined,
      (err) => {
        console.error("Head3DScene load error:", err);
      }
    );

    // 6. Interactive Mouse Parallax & Tracking
    const mouse = { x: BASE_YAW, y: 0, targetX: BASE_YAW, targetY: 0 };
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let dragRotation = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      mouse.targetX = BASE_YAW + normX * 0.22;
      mouse.targetY = normY * 0.18;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        dragRotation.y += deltaX * 0.008;
        dragRotation.x += deltaY * 0.008;
        prevMousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.clientX <= window.innerWidth * 0.3) {
        isDragging = true;
        prevMousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth * 0.28;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    // 8. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      particleUniforms.uTime.value = elapsedTime;
      if (faceShader) {
        faceShader.uniforms.uTime.value = elapsedTime;
      }

      // Smooth gaze tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.045;
      mouse.y += (mouse.targetY - mouse.y) * 0.045;

      const idleYaw = Math.sin(elapsedTime * 0.65) * 0.04;
      const idlePitch = Math.cos(elapsedTime * 0.85) * 0.03;
      const idleBob = Math.sin(elapsedTime * 1.3) * 0.02;

      headGroup.rotation.y = mouse.x + idleYaw + dragRotation.y;
      headGroup.rotation.x = -mouse.y + idlePitch + dragRotation.x;
      headGroup.position.y = BASE_Y + idleBob;

      dragRotation.x *= 0.94;
      dragRotation.y *= 0.94;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);

      particleMaterial?.dispose();
      particleGeometry?.dispose();
      dracoLoader.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`head-3d-wrapper ${isLoaded ? "is-loaded" : ""}`}
      aria-label="3D Head Model"
      title="3D Model — Kursorni kuzatadi va boshqariladi"
    >
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}
