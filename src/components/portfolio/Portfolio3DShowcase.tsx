"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import gsap from "gsap";
import { GalleryMedia, CaseSection } from "@/types/database";
import "./Portfolio3DShowcase.css";

export type Category = {
  id: string;
  title: string;
  slug: string;
};

export type PortfolioItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string;
  cover_type: "image" | "video";
  year: number;
  is_featured: boolean;
  categories: {
    title: string;
    slug: string;
  } | null;
  gallery?: GalleryMedia[];
  sections?: CaseSection[];
};

interface Portfolio3DShowcaseProps {
  categories: Category[];
  items: PortfolioItem[];
  activeCategory?: string;
}

interface CardObject {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  originalIndex: number;
}

// Synthesize pleasant tactile tick sound
function playHapticTick() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Ignore audio restrictions
  }
}

export default function Portfolio3DShowcase({
  categories,
  items,
  activeCategory,
}: Portfolio3DShowcaseProps) {
  const router = useRouter();

  const showcaseRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const centerActionRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
  const spatialTopRef = useRef<HTMLDivElement>(null);
  const spatialHeroRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isCaseOpen, setIsCaseOpen] = useState(false);
  const [activeCaseItem, setActiveCaseItem] = useState<PortfolioItem | null>(null);

  const activeIndexRef = useRef(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const isCaseOpenRef = useRef(false);
  const isReturningRef = useRef(false);
  const cardsRef = useRef<CardObject[]>([]);
  const openCaseRef = useRef<((item: PortfolioItem, mesh: THREE.Mesh) => void) | null>(null);
  const closeCaseRef = useRef<(() => void) | null>(null);

  // Filter items by category if selected
  const filteredItems = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter((item) => item.categories?.slug === activeCategory);
  }, [items, activeCategory]);

  const activeProject = filteredItems[activeIndex] || filteredItems[0] || null;

  // Category filter switch handler
  const handleCategoryClick = useCallback(
    (slug?: string) => {
      if (isCaseOpenRef.current || isReturningRef.current) return;
      targetProgressRef.current = 0;
      currentProgressRef.current = 0;
      setActiveIndex(0);
      activeIndexRef.current = 0;

      if (!slug) {
        router.push("/portfolio");
      } else {
        router.push(`/portfolio?category=${slug}`);
      }
    },
    [router]
  );

  // Jump to specific project in list
  const scrollToProject = useCallback(
    (index: number) => {
      if (isCaseOpenRef.current || isReturningRef.current || filteredItems.length === 0) return;
      const count = filteredItems.length;
      const current = currentProgressRef.current;
      const currentWrapped = ((Math.round(current) % count) + count) % count;

      let diff = index - currentWrapped;
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;

      targetProgressRef.current = Math.round(current + diff);
      if (audioEnabled) playHapticTick();
    },
    [filteredItems.length, audioEnabled]
  );

  useEffect(() => {
    const container = canvasWrapperRef.current;
    if (!container || filteredItems.length === 0) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Three.js Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Responsive Card Dimensions
    const isMobile = width < 768;
    const cardWidth = isMobile ? 3.0 : 4.0;
    const cardHeight = cardWidth * 0.68;
    const cardAspect = cardWidth / cardHeight;

    // 32x32 segments enable smooth cloth / liquid wave deformation
    const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    // Total display cards in infinite loop
    const count = filteredItems.length;
    const displayCount = Math.max(count, 5);

    const cards: CardObject[] = [];

    for (let i = 0; i < displayCount; i++) {
      const originalIdx = i % count;
      const item = filteredItems[originalIdx];

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      // Hook dynamic Object-Fit: Cover UV directly into Three.js material
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uVelocity = { value: 0 };
        shader.uniforms.uFlyProgress = { value: 0 };
        shader.uniforms.uCardAspect = { value: cardAspect };
        shader.uniforms.uScreenAspect = { value: width / height };
        shader.uniforms.uImageAspect = { value: 16 / 9 };

        shader.vertexShader = `
          uniform float uTime;
          uniform float uVelocity;
          uniform float uFlyProgress;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `
          #include <begin_vertex>
          
          // Organic 3D cloth wave (fades to flat during expansion)
          float wave1 = sin(uv.x * 4.5 + uTime * 2.2) * cos(uv.y * 4.0 + uTime * 1.8);
          float wave2 = sin((uv.x + uv.y) * 5.0 - uTime * 2.4) * 0.45;
          float dragBend = sin(uv.y * 3.14159265) * uVelocity * 0.45;
          float zWave = ((wave1 + wave2) * (0.05 + abs(uVelocity) * 0.18) + dragBend) * (1.0 - uFlyProgress);

          transformed.z += zWave;
          transformed.x += sin(uv.y * 3.14159265) * uVelocity * 0.08 * (1.0 - uFlyProgress);
          `
        );

        shader.fragmentShader = `
          uniform float uTime;
          uniform float uVelocity;
          uniform float uFlyProgress;
          uniform float uCardAspect;
          uniform float uScreenAspect;
          uniform float uImageAspect;
        ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          `
          #ifdef USE_MAP
            float speed = clamp(abs(uVelocity) * 1.5, 0.0, 1.0) * (1.0 - uFlyProgress);
            vec2 liquidDistort = vec2(
              sin(vMapUv.y * 12.0 + uTime * 3.0) * (0.003 + speed * 0.015),
              cos(vMapUv.x * 12.0 + uTime * 2.5) * (0.003 + speed * 0.015)
            );
            
            // Dynamic Container Aspect (seamlessly transitions from Card Aspect to Screen Aspect)
            float currentAspect = mix(uCardAspect, uScreenAspect, uFlyProgress);
            
            // Mathematical 1-to-1 exact Object-Fit: Cover UV
            vec2 coverUv = vMapUv;
            if (currentAspect > uImageAspect) {
              coverUv = vec2(vMapUv.x, (vMapUv.y - 0.5) * (uImageAspect / currentAspect) + 0.5);
            } else {
              coverUv = vec2((vMapUv.x - 0.5) * (currentAspect / uImageAspect) + 0.5, vMapUv.y);
            }

            vec2 finalUv = coverUv + liquidDistort;
            vec4 sampledDiffuseColor = texture2D(map, clamp(finalUv, 0.001, 0.999));
            diffuseColor *= sampledDiffuseColor;
          #endif
          `
        );

        material.userData.shader = shader;
      };

      // Load project cover texture
      if (item?.cover_url) {
        textureLoader.load(
          item.cover_url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            material.map = tex;
            material.needsUpdate = true;

            // Compute true natural aspect ratio of the image
            if (tex.image) {
              const imgW = tex.image.naturalWidth || tex.image.width || 1920;
              const imgH = tex.image.naturalHeight || tex.image.height || 1080;
              if (imgH > 0 && material.userData.shader) {
                material.userData.shader.uniforms.uImageAspect.value = imgW / imgH;
              }
            }
          },
          undefined,
          (err) => console.warn("Failed to load image:", item.cover_url, err)
        );
      }

      const mesh = new THREE.Mesh(geometry, material);
      (mesh as unknown as { projectIndex: number }).projectIndex = originalIdx;
      scene.add(mesh);

      cards.push({ mesh, material, originalIndex: originalIdx });
    }

    cardsRef.current = cards;

    let expandedMeshRef: THREE.Mesh | null = null;
    const flyState = { progress: 0 };
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // 1. OPEN CASE: Fluidly glide surrounding UI to sides, expand 3D card, and reveal spatial hero
    const openCase = (item: PortfolioItem, activeCardMesh: THREE.Mesh) => {
      if (isCaseOpenRef.current || isReturningRef.current) return;
      isCaseOpenRef.current = true;
      setIsCaseOpen(true);
      setActiveCaseItem(item);
      expandedMeshRef = activeCardMesh;

      // Update URL without page reload
      const url = `/portfolio/${item.categories?.slug || "case"}/${item.slug}`;
      window.history.pushState({ caseOpen: true, slug: item.slug }, "", url);

      // A. Surrounding UI elements smoothly float out to the sides with opacity
      if (leftColRef.current) {
        gsap.to(leftColRef.current, {
          x: -80,
          opacity: 0,
          duration: 0.65,
          ease: "power2.inOut",
        });
      }

      if (rightColRef.current) {
        gsap.to(rightColRef.current, {
          x: 80,
          opacity: 0,
          duration: 0.65,
          ease: "power2.inOut",
        });
      }

      if (topBarRef.current) {
        gsap.to(topBarRef.current, {
          y: -40,
          opacity: 0,
          duration: 0.55,
          ease: "power2.inOut",
        });
      }

      if (centerActionRef.current) {
        gsap.to(centerActionRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.55,
          ease: "power2.inOut",
        });
      }

      if (scrollHintRef.current) {
        gsap.to(scrollHintRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.55,
          ease: "power2.inOut",
        });
      }

      if (bottomRightRef.current) {
        gsap.to(bottomRightRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.55,
          ease: "power2.inOut",
        });
      }

      // B. Fade out non-active 3D cards
      cards.forEach((c) => {
        if (c.mesh !== activeCardMesh) {
          gsap.to(c.material, { opacity: 0, duration: 0.5, ease: "power2.out" });
        }
      });

      // C. Calculate exact scale needed to cover the entire camera viewport
      const currentW = width;
      const currentH = height;
      const aspect = currentW / currentH;
      const vFov = (camera.fov * Math.PI) / 180;
      const viewHeight = 2 * Math.tan(vFov / 2) * 8.5;
      const viewWidth = viewHeight * aspect;

      const targetScaleX = viewWidth / cardWidth;
      const targetScaleY = viewHeight / cardHeight;

      const cardMat = activeCardMesh.material as THREE.MeshBasicMaterial;
      const duration = 0.95;
      const ease = "power3.inOut";

      gsap.to(flyState, {
        progress: 1.0,
        duration: duration,
        ease: ease,
        onUpdate: () => {
          if (cardMat.userData.shader) {
            cardMat.userData.shader.uniforms.uFlyProgress.value = flyState.progress;
            cardMat.userData.shader.uniforms.uScreenAspect.value = aspect;
          }
        },
      });

      gsap.to(activeCardMesh.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: duration,
        ease: ease,
      });

      gsap.to(activeCardMesh.position, {
        x: 0,
        y: 0,
        z: 0.05,
        duration: duration,
        ease: ease,
      });

      gsap.to(activeCardMesh.scale, {
        x: targetScaleX,
        y: targetScaleY,
        duration: duration,
        ease: ease,
        onComplete: () => {
          // D. Once the card fills the screen, smoothly reveal spatial hero contents
          if (spatialTopRef.current) {
            gsap.fromTo(
              spatialTopRef.current,
              { opacity: 0, y: -25 },
              { opacity: 1, y: 0, duration: 0.75, ease: "power3.out" }
            );
          }

          if (spatialHeroRef.current) {
            gsap.fromTo(
              spatialHeroRef.current.children,
              { opacity: 0, y: 45 },
              {
                opacity: 1,
                y: 0,
                duration: 0.85,
                stagger: 0.12,
                ease: "power3.out",
              }
            );
          }
        },
      });
    };

    // 2. CLOSE CASE: Symmetrically shrink 3D card back to reel and glide surrounding UI back in
    const closeCase = () => {
      if (!isCaseOpenRef.current || !expandedMeshRef || isReturningRef.current) return;
      isCaseOpenRef.current = false;
      isReturningRef.current = true;
      setIsCaseOpen(false);

      // A. Fade out spatial case hero elements smoothly
      if (spatialTopRef.current) {
        gsap.to(spatialTopRef.current, { opacity: 0, y: -15, duration: 0.3 });
      }
      if (spatialHeroRef.current) {
        gsap.to(spatialHeroRef.current.children, { opacity: 0, y: 25, duration: 0.3 });
      }

      // Scroll window back to top smoothly
      if (showcaseRef.current) {
        showcaseRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Restore portfolio URL
      const backUrl = "/portfolio" + (activeCategory ? `?category=${activeCategory}` : "");
      window.history.pushState(null, "", backUrl);

      const activeCardMesh = expandedMeshRef;
      const cardMat = activeCardMesh.material as THREE.MeshBasicMaterial;
      const duration = 0.85;
      const ease = "power3.inOut";

      // B. Smoothly ease uFlyProgress back to 0
      gsap.to(flyState, {
        progress: 0.0,
        duration: duration,
        ease: ease,
        onUpdate: () => {
          if (cardMat.userData.shader) {
            cardMat.userData.shader.uniforms.uFlyProgress.value = flyState.progress;
          }
        },
      });

      // C. Calculate exact target 3D position & rotation in the reel for the active card
      const originalIdx = (activeCardMesh as unknown as { projectIndex: number }).projectIndex;
      let diff = originalIdx - (currentProgressRef.current % count);
      while (diff > count / 2) diff -= count;
      while (diff < -count / 2) diff += count;

      const absDiff = Math.abs(diff);
      const targetY = -diff * 3.3;
      const targetX = -diff * 1.5;
      const targetZ = -Math.pow(absDiff, 1.25) * 2.8;

      const targetRotX = diff * 0.42 + mouse.y * 0.1;
      const targetRotY = -diff * 0.35 + mouse.x * 0.12;
      const targetRotZ = diff * 0.1;

      const targetScale = Math.max(0.65, 1.05 - absDiff * 0.18);

      // Smoothly animate 3D card back into its angled slot
      gsap.to(activeCardMesh.rotation, {
        x: targetRotX,
        y: targetRotY,
        z: targetRotZ,
        duration: duration,
        ease: ease,
      });

      gsap.to(activeCardMesh.position, {
        x: targetX,
        y: targetY,
        z: targetZ,
        duration: duration,
        ease: ease,
      });

      gsap.to(activeCardMesh.scale, {
        x: targetScale,
        y: targetScale,
        duration: duration,
        ease: ease,
        onComplete: () => {
          isReturningRef.current = false;
          expandedMeshRef = null;
          setActiveCaseItem(null);
        },
      });

      // D. Restore non-active cards opacity smoothly
      cards.forEach((c) => {
        if (c.mesh !== activeCardMesh) {
          gsap.to(c.material, { opacity: 1.0, duration: 0.5, ease: "power2.out", delay: 0.2 });
        }
      });

      // E. Glide showcase UI elements back in from the sides
      if (leftColRef.current) {
        gsap.fromTo(
          leftColRef.current,
          { x: -80, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.75, ease: "power3.out", delay: 0.2 }
        );
      }

      if (rightColRef.current) {
        gsap.fromTo(
          rightColRef.current,
          { x: 80, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.75, ease: "power3.out", delay: 0.2 }
        );
      }

      if (topBarRef.current) {
        gsap.fromTo(
          topBarRef.current,
          { y: -40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", delay: 0.25 }
        );
      }

      if (centerActionRef.current) {
        gsap.fromTo(
          centerActionRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", delay: 0.25 }
        );
      }

      if (scrollHintRef.current) {
        gsap.fromTo(
          scrollHintRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", delay: 0.25 }
        );
      }

      if (bottomRightRef.current) {
        gsap.fromTo(
          bottomRightRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", delay: 0.25 }
        );
      }
    };

    openCaseRef.current = openCase;
    closeCaseRef.current = closeCase;

    // Handle browser Back / Forward buttons
    const handlePopState = () => {
      if (isCaseOpenRef.current) {
        closeCase();
      }
    };
    window.addEventListener("popstate", handlePopState);

    // Scroll & Physics Tracking
    let targetProgress = targetProgressRef.current;
    let currentProgress = currentProgressRef.current;
    let lastActiveIdx = activeIndexRef.current;

    // Pointer Interaction State
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let dragDistance = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (isCaseOpenRef.current || isReturningRef.current) return;
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest(".huyml-showcase__cat-chip") ||
        target.closest(".huyml-showcase__title-item") ||
        target.closest(".spatial-case")
      ) {
        return;
      }

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      lastY = e.clientY;
      dragDistance = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isCaseOpenRef.current || isReturningRef.current) return;
      mouse.targetX = (e.clientX / width) * 2 - 1;
      mouse.targetY = -(e.clientY / height) * 2 + 1;

      if (!isDragging) return;

      const deltaY = e.clientY - lastY;
      lastY = e.clientY;
      dragDistance += Math.abs(deltaY) + Math.abs(e.clientX - startX);

      const dragFactor = (deltaY / height) * 2.8;
      targetProgress -= dragFactor;
      targetProgressRef.current = targetProgress;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isCaseOpenRef.current || isReturningRef.current || !isDragging) return;
      isDragging = false;

      targetProgress = Math.round(targetProgress);
      targetProgressRef.current = targetProgress;

      // Raycast click detection on card click
      if (dragDistance < 8) {
        const rayMouse = new THREE.Vector2(
          ((e.clientX - renderer.domElement.getBoundingClientRect().left) / width) * 2 - 1,
          -((e.clientY - renderer.domElement.getBoundingClientRect().top) / height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(rayMouse, camera);
        const intersects = raycaster.intersectObjects(cards.map((c) => c.mesh));

        if (intersects.length > 0) {
          const hit = intersects[0].object as unknown as { projectIndex: number };
          const hitIdx = hit.projectIndex;
          const currentWrapped = ((Math.round(currentProgress) % count) + count) % count;

          if (hitIdx === currentWrapped) {
            // Clicked active center card -> Trigger continuous spatial open
            const p = filteredItems[hitIdx];
            const activeMesh = intersects[0].object as THREE.Mesh;
            openCase(p, activeMesh);
          } else {
            // Clicked adjacent card -> Scroll to that card
            let diff = hitIdx - currentWrapped;
            if (diff > count / 2) diff -= count;
            if (diff < -count / 2) diff += count;
            targetProgress = Math.round(currentProgress + diff);
            targetProgressRef.current = targetProgress;
            if (audioEnabled) playHapticTick();
          }
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (isCaseOpenRef.current || isReturningRef.current) return; // Allow natural scrolling inside open case view
      e.preventDefault();
      const delta = e.deltaY * 0.0022;
      targetProgress += delta;
      targetProgressRef.current = targetProgress;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCaseOpenRef.current) {
        if (e.key === "Escape") closeCase();
        return;
      }
      if (isReturningRef.current) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        targetProgress = Math.round(targetProgress + 1);
        targetProgressRef.current = targetProgress;
        if (audioEnabled) playHapticTick();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        targetProgress = Math.round(targetProgress - 1);
        targetProgressRef.current = targetProgress;
        if (audioEnabled) playHapticTick();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isCaseOpenRef.current || isReturningRef.current) {
        renderer.render(scene, camera);
        return;
      }

      targetProgress = targetProgressRef.current;

      // Smooth Physics Lerp
      currentProgress += (targetProgress - currentProgress) * 0.085;
      currentProgressRef.current = currentProgress;

      const elapsedTime = clock.getElapsedTime();
      const velocity = targetProgress - currentProgress;

      // Mouse Parallax Damping
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Camera slight tilt
      camera.position.x = mouse.x * 0.25;
      camera.position.y = mouse.y * 0.18;
      camera.lookAt(0, 0, 0);

      // Check current active center index
      const wrappedIndex = ((Math.round(currentProgress) % count) + count) % count;
      if (wrappedIndex !== lastActiveIdx) {
        lastActiveIdx = wrappedIndex;
        activeIndexRef.current = wrappedIndex;
        setActiveIndex(wrappedIndex);
        if (audioEnabled) playHapticTick();
      }

      // Position each card along the 3D Vertical-Diagonal Track
      cards.forEach((card, i) => {
        const total = cards.length;
        let diff = i - (currentProgress % total);

        while (diff > total / 2) diff -= total;
        while (diff < -total / 2) diff += total;

        const absDiff = Math.abs(diff);

        // Vertical-Diagonal trajectory
        const y = -diff * 3.3;
        const x = -diff * 1.5;
        const z = -Math.pow(absDiff, 1.25) * 2.8;

        card.mesh.position.set(x, y, z);

        // 3D Isometric Rotations (X, Y, Z angled stack)
        const rotX = diff * 0.42 + mouse.y * 0.1;
        const rotY = -diff * 0.35 + mouse.x * 0.12;
        const rotZ = diff * 0.1;

        card.mesh.rotation.set(rotX, rotY, rotZ);

        // Scale & Opacity falloff for depth
        const scale = Math.max(0.65, 1.05 - absDiff * 0.18);
        card.mesh.scale.set(scale, scale, 1);

        const opacity = THREE.MathUtils.clamp(1.05 - absDiff * 0.42, 0.15, 1.0);
        card.material.opacity = opacity;

        // Update wave & liquid shader uniforms
        if (card.material.userData.shader) {
          card.material.userData.shader.uniforms.uTime.value = elapsedTime;
          card.material.userData.shader.uniforms.uVelocity.value = velocity;
        }
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      geometry.dispose();
      cards.forEach((c) => {
        c.material.dispose();
      });
      renderer.dispose();
    };
  }, [filteredItems, activeCategory, audioEnabled]);

  if (filteredItems.length === 0) {
    return (
      <div className="huyml-showcase-empty">
        <p>Ushbu kategoriyada loyihalar topilmadi</p>
        <button
          onClick={() => handleCategoryClick()}
          className="huyml-showcase__cat-chip is-active"
          style={{ marginTop: "1rem" }}
        >
          All Work
        </button>
      </div>
    );
  }

  const projectCategorySlug = activeProject?.categories?.slug || "web-design";
  const projectSlug = activeProject?.slug || "";
  const projectUrl = `/portfolio/${projectCategorySlug}/${projectSlug}`;

  const handleViewCaseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCaseOpenRef.current || isReturningRef.current) return;
    const count = filteredItems.length;
    const currentWrapped = ((Math.round(currentProgressRef.current) % count) + count) % count;
    const activeCard = cardsRef.current.find((c) => c.originalIndex === currentWrapped);
    const item = filteredItems[currentWrapped];
    if (activeCard && item && openCaseRef.current) {
      openCaseRef.current(item, activeCard.mesh);
    }
  };

  const handleCloseCase = () => {
    if (closeCaseRef.current) {
      closeCaseRef.current();
    }
  };

  const caseCategoryTitle = activeCaseItem?.categories?.title || "Product Design";

  return (
    <div
      ref={showcaseRef}
      className={`huyml-showcase ${isCaseOpen ? "is-case-open" : ""}`}
    >
      {/* Background 3D Canvas Layer */}
      <div ref={canvasWrapperRef} className="huyml-showcase__canvas-wrapper" />
      <div className="huyml-showcase__fade-top" />
      <div className="huyml-showcase__fade-bottom" />

      {/* Top Bar (Categories & Sound) */}
      <div ref={topBarRef} className="huyml-showcase__top-bar">
        <div className="huyml-showcase__category-select">
          <button
            onClick={() => handleCategoryClick()}
            className={`huyml-showcase__cat-chip ${
              !activeCategory ? "is-active" : ""
            }`}
          >
            All ({items.length})
          </button>

          {categories.map((cat) => {
            const countInCat = items.filter(
              (i) => i.categories?.slug === cat.slug
            ).length;
            const isActive = activeCategory === cat.slug;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`huyml-showcase__cat-chip ${
                  isActive ? "is-active" : ""
                }`}
              >
                {cat.title} ({countInCat})
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="huyml-showcase__audio-btn"
          title="Audio Haptics"
        >
          <span>{audioEnabled ? "Sound ON" : "Sound OFF"}</span>
        </button>
      </div>

      {/* 3-Column Editorial Grid Container */}
      <div className="huyml-showcase__container">
        {/* =================================================================
            1. LEFT COLUMN: CASE METADATA & BOTTOM COUNTER
            ================================================================= */}
        <div ref={leftColRef} className="huyml-showcase__left-col">
          {activeProject && (
            <div className="huyml-showcase__meta-block">
              <div className="huyml-showcase__meta-item">
                <span className="huyml-showcase__meta-label">Client</span>
                <p className="huyml-showcase__meta-value">{activeProject.title}</p>
              </div>

              <div className="huyml-showcase__meta-item">
                <span className="huyml-showcase__meta-label">Service</span>
                <p className="huyml-showcase__meta-value">
                  {activeProject.categories?.title || "Product Design"}
                </p>
              </div>

              <div className="huyml-showcase__meta-item">
                <span className="huyml-showcase__meta-label">Year</span>
                <p className="huyml-showcase__meta-value">{activeProject.year}</p>
              </div>

              <div className="huyml-showcase__meta-item">
                <span className="huyml-showcase__meta-label">Recognition</span>
                <p className="huyml-showcase__meta-value">
                  {activeProject.is_featured
                    ? "Featured Project\nAwwwards Nominee\nCSSDA Website of the Day"
                    : "Digital Experience\nCreative Interface"}
                </p>
              </div>
            </div>
          )}

          {/* Large Bottom Left Counter */}
          <div className="huyml-showcase__bottom-counter">
            <span className="huyml-showcase__counter-label">Selected work</span>
            <div className="huyml-showcase__counter-number">
              {String(activeIndex + 1).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* =================================================================
            2. CENTER COLUMN: 3D CARD ACTION (VIEW CASE)
            ================================================================= */}
        <div className="huyml-showcase__center-col">
          <div ref={centerActionRef} className="huyml-showcase__center-action">
            <button
              onClick={handleViewCaseClick}
              className="huyml-showcase__view-case-btn"
            >
              <span>View Case Study</span>
              <span>↗</span>
            </button>
          </div>
        </div>

        {/* =================================================================
            3. RIGHT COLUMN: VERTICALLY SCROLLING REEL OF PROJECT TITLES
            ================================================================= */}
        <div ref={rightColRef} className="huyml-showcase__right-col">
          <div
            className="huyml-showcase__titles-track"
            style={{
              transform: `translateY(calc(-${activeIndex * 120}px - 60px))`,
            }}
          >
            {filteredItems.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => scrollToProject(idx)}
                  className={`huyml-showcase__title-item ${isActive ? "is-active" : ""}`}
                >
                  <div className="huyml-showcase__title-category">
                    <span className="huyml-showcase__title-category-dot" />
                    <span>{item.categories?.title || "Digital Case"}</span>
                  </div>

                  <h2 className="huyml-showcase__title-name">{item.title}</h2>

                  {item.excerpt && (
                    <p className="huyml-showcase__title-excerpt">{item.excerpt}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Center Scroll Hint */}
      <div ref={scrollHintRef} className="huyml-showcase__scroll-hint">
        Scroll / Drag to explore
      </div>

      {/* Bottom Right Total Selected Count Badge */}
      <div ref={bottomRightRef} className="huyml-showcase__bottom-right">
        <span className="huyml-showcase__total-badge">
          {String(filteredItems.length).padStart(2, "0")} Selected ↗
        </span>
      </div>

      {/* =====================================================================
          CONTINUOUS SPATIAL CASE STUDY LAYER (NO UNMOUNT / ZERO RELOAD)
          ===================================================================== */}
      {isCaseOpen && activeCaseItem && (
        <div className="spatial-case">
          {/* 1. Transparent Hero allowing 3D full-screen card to shine through */}
          <section className="spatial-case__hero">
            <div className="spatial-case__gradient" />

            <div ref={spatialTopRef} className="spatial-case__top">
              <button onClick={handleCloseCase} className="spatial-case__back-btn">
                <span>←</span>
                <span>All Projects</span>
              </button>

              <span className="spatial-case__year-badge">{activeCaseItem.year}</span>
            </div>

            <div ref={spatialHeroRef} className="spatial-case__hero-bottom">
              <div className="spatial-case__category">{caseCategoryTitle}</div>
              <h1 className="spatial-case__title">{activeCaseItem.title}</h1>
              {activeCaseItem.excerpt && (
                <p className="spatial-case__excerpt">{activeCaseItem.excerpt}</p>
              )}
            </div>
          </section>

          {/* 2. Solid Editorial Content Body */}
          <div className="spatial-case__body">
            <div className="spatial-case__inner">
              {/* Metadata Grid */}
              <div className="spatial-case__meta-grid">
                <div className="spatial-case__meta-item">
                  <span className="spatial-case__meta-label">Client</span>
                  <p className="spatial-case__meta-value">{activeCaseItem.title}</p>
                </div>

                <div className="spatial-case__meta-item">
                  <span className="spatial-case__meta-label">Service</span>
                  <p className="spatial-case__meta-value">{caseCategoryTitle}</p>
                </div>

                <div className="spatial-case__meta-item">
                  <span className="spatial-case__meta-label">Year</span>
                  <p className="spatial-case__meta-value">{activeCaseItem.year}</p>
                </div>

                <div className="spatial-case__meta-item">
                  <span className="spatial-case__meta-label">Recognition</span>
                  <p className="spatial-case__meta-value">
                    {activeCaseItem.is_featured
                      ? "Featured Project\nAwwwards Nominee"
                      : "Digital Experience\nCreative Interface"}
                  </p>
                </div>
              </div>

              {/* Case Sections */}
              {activeCaseItem.sections && activeCaseItem.sections.length > 0 && (
                <section className="spatial-case__sections">
                  {activeCaseItem.sections.map((section: CaseSection, i: number) => (
                    <div key={section.id || i} className="spatial-case__section-item">
                      <h2 className="spatial-case__section-title">{section.title}</h2>
                      <p className="spatial-case__section-content">{section.content}</p>
                    </div>
                  ))}
                </section>
              )}

              {/* Visual Gallery Grid */}
              {activeCaseItem.gallery && activeCaseItem.gallery.length > 0 && (
                <section className="spatial-case__gallery-section">
                  <h2 className="spatial-case__gallery-heading">Visual Showcase</h2>
                  <div className="spatial-case__gallery-grid">
                    {activeCaseItem.gallery.map((media: GalleryMedia, i: number) => (
                      <div key={media.id || i} className="spatial-case__gallery-item">
                        {media.type === "video" ? (
                          <video src={media.url} controls width="100%" />
                        ) : (
                          <Image
                            src={media.url}
                            alt={`${activeCaseItem.title} gallery ${i + 1}`}
                            width={1200}
                            height={750}
                            style={{ width: "100%", height: "auto" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Bottom Footer Back Button */}
              <div className="spatial-case__footer">
                <button onClick={handleCloseCase} className="spatial-case__footer-btn">
                  <span>← Back to All Projects</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
