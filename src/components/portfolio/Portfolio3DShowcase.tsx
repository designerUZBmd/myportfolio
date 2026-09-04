"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useNavigation } from "@/hooks/useNavigation";
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

export default function Portfolio3DShowcase({
  categories,
  items,
  activeCategory,
}: Portfolio3DShowcaseProps) {
  const { navigateTo } = useNavigation();

  const showcaseRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // In-page category selection without full-page navigation / ViewTransition conflicts
  const [selectedCategory, setSelectedCategory] = useState<string>(
    activeCategory || ""
  );

  useEffect(() => {
    if (activeCategory !== undefined) {
      setSelectedCategory(activeCategory || "");
    }
  }, [activeCategory]);

  // Client-side instant filter: 0ms latency, zero server roundtrips
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter((item) => item.categories?.slug === selectedCategory);
  }, [items, selectedCategory]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const activeIndexRef = useRef(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const cardsRef = useRef<CardObject[]>([]);
  const titleItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const mobileTitleItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const currentItemsRef = useRef<PortfolioItem[]>(filteredItems);
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const buildCardsRef = useRef<((itemsList: PortfolioItem[]) => void) | null>(null);

  const count = filteredItems.length;
  const repeatFactor = count > 1 && count < 8 ? Math.ceil(8 / count) : 1;
  const totalReel = count * repeatFactor;

  const reelItems = useMemo(() => {
    if (count <= 1) {
      return filteredItems.map((item, idx) => ({
        ...item,
        reelKey: `reel-${item.id}-0`,
        originalIdx: idx,
      }));
    }
    const list: (PortfolioItem & { reelKey: string; originalIdx: number })[] = [];
    for (let r = 0; r < repeatFactor; r++) {
      filteredItems.forEach((item, idx) => {
        list.push({
          ...item,
          reelKey: `reel-${item.id}-${r}`,
          originalIdx: idx,
        });
      });
    }
    return list;
  }, [filteredItems, count, repeatFactor]);

  const activeProject = filteredItems[activeIndex] || filteredItems[0] || null;

  // Instant in-page filter: shallow URL update, NO heavy PageTransition
  const handleCategoryClick = useCallback((slug?: string) => {
    const nextSlug = slug || "";
    setSelectedCategory(nextSlug);

    const path = nextSlug ? `/portfolio?category=${nextSlug}` : "/portfolio";
    window.history.replaceState(null, "", path);
  }, []);

  // Jump to specific project in list
  const scrollToProject = useCallback(
    (index: number) => {
      const count = currentItemsRef.current.length;
      if (count <= 1) return;
      const current = currentProgressRef.current;
      const currentWrapped = ((Math.round(current) % count) + count) % count;

      let diff = index - currentWrapped;
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;

      targetProgressRef.current = Math.round(current + diff);
    },
    []
  );

  // 1. SETUP THREE.JS ENGINE ONCE (Renderer & Canvas never destroyed on filter)
  useEffect(() => {
    const container = canvasWrapperRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Three.js Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const initialZ = width < 720 ? Math.max(8.5, 8.5 * (0.62 / Math.max(width / height, 0.4))) : 8.5;
    camera.position.set(0, 0, initialZ);

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
    const isMobile = width < 720;
    const isTablet = width >= 720 && width < 1024;
    const cardWidth = isMobile ? 3.25 : isTablet ? 3.3 : 4.0;
    const cardHeight = cardWidth * 0.68;
    const cardAspect = cardWidth / cardHeight;

    const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let currentProgress = 0;
    let lastActiveTotalIdx = 0;

    // Dynamic Card Builder (swaps meshes in existing scene without restarting WebGL)
    const buildCards = (itemsList: PortfolioItem[]) => {
      // Clean up previous cards in scene
      cardsRef.current.forEach((c) => {
        scene.remove(c.mesh);
        c.material.dispose();
      });
      cardsRef.current = [];

      const count = itemsList.length;
      if (count === 0) return;

      const repeatFactor = count > 1 && count < 8 ? Math.ceil(8 / count) : 1;
      const totalCards = count * repeatFactor;
      const newCards: CardObject[] = [];

      for (let i = 0; i < totalCards; i++) {
        const originalIdx = i % count;
        const item = itemsList[originalIdx];

        const material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        material.onBeforeCompile = (shader) => {
          shader.uniforms.uTime = { value: 0 };
          shader.uniforms.uVelocity = { value: 0 };
          shader.uniforms.uCardAspect = { value: cardAspect };
          shader.uniforms.uImageAspect = { value: 16 / 9 };

          shader.vertexShader = `
            uniform float uTime;
            uniform float uVelocity;
          ` + shader.vertexShader;

          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            `
            #include <begin_vertex>
            float wave1 = sin(uv.x * 4.5 + uTime * 2.2) * cos(uv.y * 4.0 + uTime * 1.8);
            float wave2 = sin((uv.x + uv.y) * 5.0 - uTime * 2.4) * 0.45;
            float dragBend = sin(uv.y * 3.14159265) * uVelocity * 0.45;
            float zWave = (wave1 + wave2) * (0.05 + abs(uVelocity) * 0.18) + dragBend;

            transformed.z += zWave;
            transformed.x += sin(uv.y * 3.14159265) * uVelocity * 0.08;
            `
          );

          shader.fragmentShader = `
            uniform float uTime;
            uniform float uVelocity;
            uniform float uCardAspect;
            uniform float uImageAspect;
          ` + shader.fragmentShader;

          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <map_fragment>",
            `
            #ifdef USE_MAP
              float speed = clamp(abs(uVelocity) * 1.5, 0.0, 1.0);
              vec2 liquidDistort = vec2(
                sin(vMapUv.y * 12.0 + uTime * 3.0) * (0.003 + speed * 0.015),
                cos(vMapUv.x * 12.0 + uTime * 2.5) * (0.003 + speed * 0.015)
              );
              
              vec2 coverUv = vMapUv;
              if (uCardAspect > uImageAspect) {
                coverUv = vec2(vMapUv.x, (vMapUv.y - 0.5) * (uImageAspect / uCardAspect) + 0.5);
              } else {
                coverUv = vec2((vMapUv.x - 0.5) * (uCardAspect / uImageAspect) + 0.5, vMapUv.y);
              }

              vec2 finalUv = coverUv + liquidDistort;
              vec4 sampledDiffuseColor = texture2D(map, clamp(finalUv, 0.001, 0.999));
              diffuseColor *= sampledDiffuseColor;
            #endif
            `
          );

          material.userData.shader = shader;
        };

        // Cache textures to make category switching instant
        if (item?.cover_url) {
          const cachedTex = textureCacheRef.current.get(item.cover_url);
          if (cachedTex) {
            material.map = cachedTex;
            material.needsUpdate = true;
            const img = cachedTex.image as HTMLImageElement | undefined;
            if (img && material.userData.shader) {
              const imgW = img.naturalWidth || img.width || 1920;
              const imgH = img.naturalHeight || img.height || 1080;
              if (imgH > 0) {
                material.userData.shader.uniforms.uImageAspect.value = imgW / imgH;
              }
            }
          } else {
            textureLoader.load(
              item.cover_url,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.generateMipmaps = true;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                textureCacheRef.current.set(item.cover_url, tex);
                material.map = tex;
                material.needsUpdate = true;

                const img = tex.image as HTMLImageElement | undefined;
                if (img && material.userData.shader) {
                  const imgW = img.naturalWidth || img.width || 1920;
                  const imgH = img.naturalHeight || img.height || 1080;
                  if (imgH > 0) {
                    material.userData.shader.uniforms.uImageAspect.value = imgW / imgH;
                  }
                }
              },
              undefined,
              (err) => console.warn("Failed to load image:", item.cover_url, err)
            );
          }
        }

        const mesh = new THREE.Mesh(geometry, material);
        (mesh as unknown as { projectIndex: number; cardIndex: number }).projectIndex = originalIdx;
        (mesh as unknown as { projectIndex: number; cardIndex: number }).cardIndex = i;
        scene.add(mesh);

        newCards.push({ mesh, material, originalIndex: originalIdx });
      }

      cardsRef.current = newCards;
      titleItemsRef.current = [];
      mobileTitleItemsRef.current = [];
      targetProgressRef.current = 0;
      currentProgressRef.current = 0;
      currentProgress = 0;
      lastActiveTotalIdx = 0;
      activeIndexRef.current = 0;
      setActiveIndex(0);
      setActiveReelIndex(0);
    };

    buildCardsRef.current = buildCards;

    // Initial build of cards
    buildCards(currentItemsRef.current);

    // Pointer Interaction State
    let pointerDown = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let lastX = 0;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest(".huyml-showcase__category-nav") ||
        target.closest(".huyml-showcase__title-item") ||
        target.closest(".huyml-showcase__mobile-title-item")
      ) {
        return;
      }

      pointerDown = true;
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      lastY = e.clientY;
      lastX = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = (e.clientX / width) * 2 - 1;
      mouse.targetY = -(e.clientY / height) * 2 + 1;

      if (!pointerDown) return;

      const deltaY = e.clientY - lastY;
      const deltaX = e.clientX - lastX;
      lastY = e.clientY;
      lastX = e.clientX;

      if (!isDragging) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
          isDragging = true;
        }
      }

      if (isDragging && currentItemsRef.current.length > 1) {
        if (width < 720) {
          // Mobile: vertical drag for 3D card slider, with horizontal swipe also supported
          const isVerticalGesture = Math.abs(deltaY) >= Math.abs(deltaX);
          const primaryDelta = isVerticalGesture ? deltaY : deltaX;
          const basis = isVerticalGesture ? height : width;
          const dragMultiplier = 3.6;
          const dragFactor = (primaryDelta / basis) * dragMultiplier;
          targetProgressRef.current -= dragFactor;
        } else {
          const dragMultiplier = 2.8;
          const dragFactor = (deltaY / height) * dragMultiplier;
          targetProgressRef.current -= dragFactor;
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!pointerDown) return;
      const wasDragging = isDragging;
      pointerDown = false;
      isDragging = false;

      if (wasDragging) {
        return;
      }

      // Pure click on card
      const rect = renderer.domElement.getBoundingClientRect();
      const rayMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(rayMouse, camera);
      const intersects = raycaster.intersectObjects(cardsRef.current.map((c) => c.mesh));

      if (intersects.length > 0) {
        const hit = intersects[0].object as unknown as { projectIndex: number; cardIndex?: number };
        const clickedProjectIdx = hit.projectIndex;
        const currentActiveIdx = activeIndexRef.current;

        if (clickedProjectIdx === currentActiveIdx) {
          // Active center card was clicked -> Open project with PageTransition!
          const p = currentItemsRef.current[clickedProjectIdx];
          if (p) {
            const catSlug = p.categories?.slug || "web-design";
            navigateTo(`/portfolio/${catSlug}/${p.slug}`);
          }
        } else {
          // Adjacent card was clicked -> Bring it to center smoothly
          if (typeof hit.cardIndex === "number") {
            const total = cardsRef.current.length;
            const current = currentProgressRef.current;
            const activeCardIdx = ((Math.round(current) % total) + total) % total;
            let cardDiff = hit.cardIndex - activeCardIdx;
            while (cardDiff > total / 2) cardDiff -= total;
            while (cardDiff < -total / 2) cardDiff += total;
            targetProgressRef.current = current + cardDiff;
          } else {
            scrollToProject(clickedProjectIdx);
          }
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (currentItemsRef.current.length <= 1) return;
      e.preventDefault();
      const delta = e.deltaY * 0.0028;
      targetProgressRef.current += delta;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentItemsRef.current.length <= 1) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        targetProgressRef.current += 1;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        targetProgressRef.current -= 1;
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
      camera.position.z = width < 720 ? Math.max(8.5, 8.5 * (0.62 / Math.max(camera.aspect, 0.4))) : 8.5;
    };

    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const targetProgress = targetProgressRef.current;

      // Smooth Physics Lerp
      currentProgress += (targetProgress - currentProgress) * 0.085;
      currentProgressRef.current = currentProgress;

      const elapsedTime = clock.getElapsedTime();
      const velocity = targetProgress - currentProgress;

      // Mouse Parallax Damping
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      camera.position.x = mouse.x * 0.25;
      camera.position.y = mouse.y * 0.18;
      camera.lookAt(0, 0, 0);

      const count = currentItemsRef.current.length;
      const total = cardsRef.current.length;
      if (total > 0 && count > 0) {
        const wrappedTotalIndex = ((Math.round(currentProgress) % total) + total) % total;
        if (wrappedTotalIndex !== lastActiveTotalIdx) {
          lastActiveTotalIdx = wrappedTotalIndex;
          setActiveReelIndex(wrappedTotalIndex);
          const wrappedProjectIndex = wrappedTotalIndex % count;
          activeIndexRef.current = wrappedProjectIndex;
          setActiveIndex(wrappedProjectIndex);
        }
      }

      // Position each card along the 3D Track
      if (total > 0) {
        cardsRef.current.forEach((card, i) => {
          let diff = i - (currentProgress % total);

          while (diff > total / 2) diff -= total;
          while (diff < -total / 2) diff += total;

          const absDiff = Math.abs(diff);

          const isMobileView = width < 720;
          const y = -diff * (isMobileView ? 2.5 : 3.3) + (isMobileView ? 0.65 : 0);
          const x = -diff * (isMobileView ? 0.35 : 1.5);
          const z = -Math.pow(absDiff, 1.25) * (isMobileView ? 2.2 : 2.8);

          card.mesh.position.set(x, y, z);

          const rotX = diff * 0.42 + mouse.y * 0.1;
          const rotY = -diff * (isMobileView ? 0.14 : 0.35) + mouse.x * 0.12;
          const rotZ = diff * (isMobileView ? 0.04 : 0.1);

          card.mesh.rotation.set(rotX, rotY, rotZ);

          const scale = Math.max(0.65, 1.05 - absDiff * 0.18);
          card.mesh.scale.set(scale, scale, 1);

          const opacity = THREE.MathUtils.clamp(1.05 - absDiff * 0.42, 0.15, 1.0);
          card.material.opacity = opacity;

          if (card.material.userData.shader) {
            card.material.userData.shader.uniforms.uTime.value = elapsedTime;
            card.material.userData.shader.uniforms.uVelocity.value = velocity;
          }
        });

        // 2. Position each Right-Column 2D Title item continuously in real-time
        const titleEls = titleItemsRef.current;
        for (let i = 0; i < total; i++) {
          const el = titleEls[i];
          if (!el) continue;

          let diff = i - (currentProgress % total);
          while (diff > total / 2) diff -= total;
          while (diff < -total / 2) diff += total;

          const absDiff = Math.abs(diff);

          // Continuous smooth opacity curve:
          // Active (<= 0.4): 1.0
          // 0.4 -> 1.0: 1.0 -> 0.45
          // 1.0 -> 2.0: 0.45 -> 0.15
          // 2.0 -> 2.6: 0.15 -> 0.0
          // > 2.6: 0.0 (hidden)
          let opacity = 0;
          if (absDiff <= 0.4) {
            opacity = 1;
          } else if (absDiff <= 1.0) {
            const t = (absDiff - 0.4) / 0.6;
            opacity = 1.0 - t * 0.55;
          } else if (absDiff <= 2.0) {
            const t = (absDiff - 1.0) / 1.0;
            opacity = 0.45 - t * 0.30;
          } else if (absDiff <= 2.6) {
            const t = (absDiff - 2.0) / 0.6;
            opacity = Math.max(0, 0.15 - t * 0.15);
          } else {
            opacity = 0;
          }

          const scale = Math.max(0.78, 1.0 - absDiff * 0.075);
          const spacing = width < 1024 ? 95 : 135;
          const y = diff * spacing;

          el.style.transform = `translateY(calc(-50% + ${y.toFixed(2)}px)) scale(${scale.toFixed(3)})`;
          el.style.opacity = opacity.toFixed(3);
          el.style.visibility = opacity <= 0.005 ? "hidden" : "visible";
          el.style.pointerEvents = absDiff <= 2.2 ? "auto" : "none";
          el.style.zIndex = absDiff < 0.5 ? "5" : `${Math.max(1, 4 - Math.floor(absDiff))}`;

          if (absDiff < 0.5) {
            el.classList.add("is-active");
          } else {
            el.classList.remove("is-active");
          }
        }

        // 3. Position each Mobile Horizontal Title item continuously in real-time (< 720px)
        const isMobile = width < 720;
        if (isMobile) {
          const mobileEls = mobileTitleItemsRef.current;
          // Spacing: exactly sized so 3 titles (left, center, right) fit neatly across screen
          const spacingX = Math.min(Math.max(width * 0.38, 140), 200);
          for (let i = 0; i < total; i++) {
            const el = mobileEls[i];
            if (!el) continue;

            let diff = i - (currentProgress % total);
            while (diff > total / 2) diff -= total;
            while (diff < -total / 2) diff += total;

            const absDiff = Math.abs(diff);

            // Exactly 3 Titles visible curve:
            // Center (<= 0.3): full opacity 1.0
            // 0.3 -> 1.0: drops from 1.0 to 0.38 (dimmed side titles)
            // 1.0 -> 1.35: drops from 0.38 to 0 (fades out completely off the sides)
            // > 1.35: 0.0 (hidden)
            let opacity = 0;
            if (absDiff <= 0.3) {
              opacity = 1;
            } else if (absDiff <= 1.0) {
              const t = (absDiff - 0.3) / 0.7;
              opacity = 1.0 - t * 0.62;
            } else if (absDiff <= 1.35) {
              const t = (absDiff - 1.0) / 0.35;
              opacity = Math.max(0, 0.38 - t * 0.38);
            } else {
              opacity = 0;
            }

            const scale = Math.max(0.72, 1.0 - absDiff * 0.28);
            const x = diff * spacingX;

            el.style.transform = `translate(calc(-50% + ${x.toFixed(2)}px), -50%) scale(${scale.toFixed(3)})`;
            el.style.opacity = opacity.toFixed(3);
            el.style.visibility = opacity <= 0.005 ? "hidden" : "visible";
            el.style.pointerEvents = absDiff <= 1.1 ? "auto" : "none";
            el.style.zIndex = absDiff < 0.5 ? "10" : "5";

            if (absDiff < 0.5) {
              el.classList.add("is-active");
            } else {
              el.classList.remove("is-active");
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      buildCardsRef.current = null;
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
      cardsRef.current.forEach((c) => {
        c.material.dispose();
      });
      textureCacheRef.current.forEach((tex) => tex.dispose());
      textureCacheRef.current.clear();
      renderer.dispose();
    };
  }, [navigateTo, scrollToProject]);

  // 2. WHEN FILTERED ITEMS CHANGE: Rebuild cards in existing Three.js scene instantly!
  useEffect(() => {
    currentItemsRef.current = filteredItems;
    if (buildCardsRef.current) {
      buildCardsRef.current(filteredItems);
    }
  }, [filteredItems]);

  if (filteredItems.length === 0) {
    return (
      <div className="huyml-showcase-empty">
        <p>Ushbu kategoriyada loyihalar topilmadi</p>
        <button
          onClick={() => handleCategoryClick()}
          className="huyml-showcase__cat-item is-active"
          style={{ marginTop: "1rem" }}
        >
          All Work
        </button>
      </div>
    );
  }

  return (
    <div ref={showcaseRef} className="huyml-showcase">
      {/* Background 3D Canvas Layer */}
      <div ref={canvasWrapperRef} className="huyml-showcase__canvas-wrapper" />
      <div className="huyml-showcase__fade-top" />
      <div className="huyml-showcase__fade-bottom" />

      {/* =====================================================================
          VERTICALLY CENTERED CATEGORY NAVIGATION (LEFT SIDE)
          ===================================================================== */}
      <nav className="huyml-showcase__category-nav">
        <div className="huyml-showcase__category-list">
          <button
            onClick={() => handleCategoryClick()}
            className={`huyml-showcase__cat-item ${
              !selectedCategory ? "is-active" : ""
            }`}
          >
            <span className="huyml-showcase__cat-name">Barchasi</span>
            <span className="huyml-showcase__cat-count">{items.length}</span>
          </button>

          {categories.map((cat) => {
            const countInCat = items.filter(
              (i) => i.categories?.slug === cat.slug
            ).length;
            const isActive = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`huyml-showcase__cat-item ${
                  isActive ? "is-active" : ""
                }`}
              >
                <span className="huyml-showcase__cat-name">{cat.title}</span>
                <span className="huyml-showcase__cat-count">{countInCat}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3-Column Editorial Grid Container */}
      <div className="huyml-showcase__container">
        {/* =================================================================
            1. LEFT COLUMN: PROJECT METADATA (Top Left)
            ================================================================= */}
        <div className="huyml-showcase__left-col">
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
            </div>
          )}
        </div>

        {/* =================================================================
            2. CENTER COLUMN: Spacer (3D Canvas in center is unobstructed)
            ================================================================= */}
        <div className="huyml-showcase__center-col" />

        {/* =================================================================
            3. RIGHT COLUMN: VERTICALLY SCROLLING REEL OF PROJECT TITLES
            ================================================================= */}
        <div className="huyml-showcase__right-col">
          <div className="huyml-showcase__titles-reel">
            {reelItems.map((item, i) => {
              let diff = i;
              if (totalReel > 1) {
                while (diff > totalReel / 2) diff -= totalReel;
                while (diff < -totalReel / 2) diff += totalReel;
              }
              const absDiff = Math.abs(diff);
              const itemCatSlug = item.categories?.slug || "web-design";
              const itemUrl = `/portfolio/${itemCatSlug}/${item.slug}`;

              let initialOpacity = 0;
              if (absDiff <= 0.4) initialOpacity = 1;
              else if (absDiff <= 1.0) initialOpacity = 0.45;
              else if (absDiff <= 2.0) initialOpacity = 0.15;
              const initialScale = Math.max(0.78, 1.0 - absDiff * 0.075);
              const initialY = diff * 135;

              return (
                <div
                  key={item.reelKey}
                  ref={(el) => {
                    titleItemsRef.current[i] = el;
                  }}
                  onClick={() => {
                    const current = currentProgressRef.current;
                    let curDiff = i - (current % totalReel);
                    while (curDiff > totalReel / 2) curDiff -= totalReel;
                    while (curDiff < -totalReel / 2) curDiff += totalReel;

                    if (Math.abs(curDiff) < 0.5) {
                      navigateTo(itemUrl);
                    } else {
                      targetProgressRef.current = current + curDiff;
                    }
                  }}
                  className={`huyml-showcase__title-item ${
                    absDiff < 0.5 ? "is-active" : ""
                  }`}
                  style={{
                    transform: `translateY(calc(-50% + ${initialY.toFixed(2)}px)) scale(${initialScale.toFixed(3)})`,
                    opacity: initialOpacity,
                    pointerEvents: absDiff <= 2.2 ? "auto" : "none",
                    visibility: initialOpacity === 0 ? "hidden" : "visible",
                    zIndex: absDiff < 0.5 ? 5 : Math.max(1, 4 - Math.floor(absDiff)),
                  }}
                >
                  <h2 className="huyml-showcase__title-name">{item.title}</h2>

                  {item.excerpt && (
                    <p className="huyml-showcase__title-excerpt">{item.excerpt}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================================
            4. MOBILE HORIZONTAL TITLES REEL (< 720px)
            ================================================================= */}
        <div className="huyml-showcase__mobile-reel" aria-label="Loyiha nomlari">
          {reelItems.map((item, i) => {
            const cur = currentProgressRef.current;
            let diff = i - (cur % totalReel);
            if (totalReel > 0) {
              while (diff > totalReel / 2) diff -= totalReel;
              while (diff < -totalReel / 2) diff += totalReel;
            }
            const absDiff = Math.abs(diff);

            let initialOpacity = 0;
            if (absDiff <= 0.3) {
              initialOpacity = 1;
            } else if (absDiff <= 1.0) {
              const t = (absDiff - 0.3) / 0.7;
              initialOpacity = 1.0 - t * 0.62;
            } else if (absDiff <= 1.35) {
              const t = (absDiff - 1.0) / 0.35;
              initialOpacity = Math.max(0, 0.38 - t * 0.38);
            }
            const initialScale = Math.max(0.72, 1.0 - absDiff * 0.28);
            const initialX = diff * 150;

            const itemCatSlug = item.categories?.slug || "web-design";
            const itemUrl = `/portfolio/${itemCatSlug}/${item.slug}`;

            return (
              <div
                key={`mobile-reel-${item.reelKey || item.id}-${i}`}
                ref={(el) => {
                  mobileTitleItemsRef.current[i] = el;
                }}
                onClick={() => {
                  const current = currentProgressRef.current;
                  let curDiff = i - (current % totalReel);
                  while (curDiff > totalReel / 2) curDiff -= totalReel;
                  while (curDiff < -totalReel / 2) curDiff += totalReel;

                  if (Math.abs(curDiff) < 0.5) {
                    navigateTo(itemUrl);
                  } else {
                    targetProgressRef.current = current + curDiff;
                  }
                }}
                className={`huyml-showcase__mobile-title-item ${
                  absDiff < 0.5 ? "is-active" : ""
                }`}
                style={{
                  transform: `translate(calc(-50% + ${initialX.toFixed(2)}px), -50%) scale(${initialScale.toFixed(3)})`,
                  opacity: initialOpacity,
                  pointerEvents: absDiff <= 1.1 ? "auto" : "none",
                  visibility: initialOpacity <= 0.005 ? "hidden" : "visible",
                  zIndex: absDiff < 0.5 ? 10 : 5,
                }}
              >
                <h2 className="huyml-showcase__mobile-title-name">{item.title}</h2>
                {item.excerpt && (
                  <p className="huyml-showcase__mobile-title-excerpt">{item.excerpt}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
