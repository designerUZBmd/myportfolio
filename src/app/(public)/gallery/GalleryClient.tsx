"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRevealer } from "@/hooks/useRevealer";
import { GalleryItem } from "@/types/database";
import "./gallery.css";

interface GallerySectionWithItems {
  id: string;
  title: string;
  items: GalleryItem[];
}

interface WallCard {
  item: GalleryItem;
  sectionTitle: string;
  globalIndex: number;
  tilt: number;
}

const CARD_TILTS = [
  -1.6, 1.4, -0.9, 1.8, -1.4, 1.2, -1.7, 0.9, -1.2, 1.5, -1.8, 1.3, -1.0, 1.6,
];

// Stagger offsets for columns to give an organic "tartibsiz lekin tartibli" feel
const COL_STAGGERS_DESKTOP = [0, 80, -50, 110];
const COL_STAGGERS_MOBILE = [0, 60];

const mod = (n: number, m: number) => (m > 0 ? ((n % m) + m) % m : 0);

function getOptimizedImageUrl(url: string, width = 1400) {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto:best,w_${width}/`);
  }
  return url;
}

export default function GalleryClient({
  sections,
}: {
  sections: GallerySectionWithItems[];
}) {
  useRevealer();

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const unitRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const colHeightsRef = useRef<number[]>([2600, 2600, 2600, 2600]);

  // Active section filter in dock
  const [activeFilter, setActiveFilter] = useState<string>("all");
  // Lightbox active item index
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Hint visibility
  const [showHint, setShowHint] = useState(true);

  // Column count based on screen width
  const [numCols, setNumCols] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      setNumCols(window.innerWidth < 768 ? 2 : 4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Continuous floating-point coordinates (never jump or reset violently)
  const scrollYRef = useRef(0);
  const targetScrollYRef = useRef(0);
  const scrollXRef = useRef(0);
  const targetScrollXRef = useRef(0);
  const scaleRef = useRef(1);
  const targetScaleRef = useRef(1);

  const [displayZoom, setDisplayZoom] = useState(100);
  const isDraggingRef = useRef(false);
  const touchStartXRef = useRef(0);

  // Lock document body scroll on mount
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;

    document.body.style.backgroundColor = "#ededed";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const timer = setTimeout(() => setShowHint(false), 4500);

    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
      clearTimeout(timer);
    };
  }, []);

  // Filter sections that have items
  const validSections = useMemo(() => {
    return sections.filter((s) => s.items && s.items.length > 0);
  }, [sections]);

  // Flatten items based on active filter
  const { displayCards, allFlatCards } = useMemo(() => {
    const flat: WallCard[] = [];

    let gIdx = 0;
    validSections.forEach((sec) => {
      sec.items.forEach((item) => {
        flat.push({
          item,
          sectionTitle: sec.title,
          globalIndex: gIdx,
          tilt: CARD_TILTS[gIdx % CARD_TILTS.length],
        });
        gIdx++;
      });
    });

    const activeCards =
      activeFilter === "all"
        ? flat
        : flat.filter((c) => c.item.section_id === activeFilter);

    return { displayCards: activeCards, allFlatCards: flat };
  }, [validSections, activeFilter]);

  // Distribute items across columns, ensuring enough cards per unit for seamless looping
  const columns = useMemo(() => {
    const cols: WallCard[][] = Array.from({ length: numCols }, () => []);
    displayCards.forEach((card, idx) => {
      cols[idx % numCols].push(card);
    });

    const minCardsPerUnit = 8;
    return cols.map((colCards) => {
      if (colCards.length === 0) return [];
      const repeat = Math.max(1, Math.ceil(minCardsPerUnit / colCards.length));
      const repeated: WallCard[] = [];
      for (let r = 0; r < repeat; r++) {
        repeated.push(...colCards);
      }
      return repeated;
    });
  }, [displayCards, numCols]);

  // Measure column unit height dynamically
  const measureColHeight = useCallback((colIdx: number) => {
    const unitEl = unitRefs.current[colIdx]?.[0];
    if (!unitEl) return;
    const h = unitEl.offsetHeight;
    if (h > 150) {
      colHeightsRef.current[colIdx] = h;
    }
  }, []);

  // Observe unit elements for size changes
  useEffect(() => {
    const observers: ResizeObserver[] = [];

    columns.forEach((_, colIdx) => {
      const unitEl = unitRefs.current[colIdx]?.[0];
      if (!unitEl) return;

      measureColHeight(colIdx);
      const ro = new ResizeObserver(() => measureColHeight(colIdx));
      ro.observe(unitEl);
      observers.push(ro);
    });

    return () => {
      observers.forEach((ro) => ro.disconnect());
    };
  }, [columns, measureColHeight]);

  // Initial setup
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const initialScale = isMobile ? 0.88 : 1.0;
    scaleRef.current = initialScale;
    targetScaleRef.current = initialScale;
    setDisplayZoom(Math.round(initialScale * 100));
  }, []);

  // Continuous animation render loop (Smooth Lerp + Offscreen Unit Modulo Wrapping)
  useEffect(() => {
    let animId: number;

    const update = () => {
      // 1. Smooth interpolation without any conditional jump
      scrollYRef.current +=
        (targetScrollYRef.current - scrollYRef.current) * 0.14;
      scrollXRef.current +=
        (targetScrollXRef.current - scrollXRef.current) * 0.14;
      scaleRef.current +=
        (targetScaleRef.current - scaleRef.current) * 0.14;

      const sY = scrollYRef.current;
      const sX = scrollXRef.current;
      const sc = scaleRef.current;

      // Clamp horizontal pan
      const maxPanX = window.innerWidth < 768 ? 160 : 380;
      targetScrollXRef.current = Math.max(
        -maxPanX,
        Math.min(maxPanX, targetScrollXRef.current)
      );

      // Move canvas horizontally and apply zoom
      if (canvasRef.current) {
        canvasRef.current.style.transform = `translate3d(calc(-50% + ${sX.toFixed(1)}px), 0, 0) scale(${sc.toFixed(3)})`;
      }

      // 2. Move each unit independently with safe off-screen wrapping
      // Each unit wraps when it is over 1000px outside the viewport
      const isMobile = window.innerWidth < 768;
      const staggers = isMobile ? COL_STAGGERS_MOBILE : COL_STAGGERS_DESKTOP;

      for (let c = 0; c < numCols; c++) {
        const H = colHeightsRef.current[c] || 2600;
        if (H <= 0) continue;

        const stagger = staggers[c % staggers.length] || 0;
        const colSY = sY + stagger;
        const tripleH = 3 * H;

        const units = unitRefs.current[c];
        if (!units) continue;

        for (let u = 0; u < 3; u++) {
          const unitEl = units[u];
          if (!unitEl) continue;

          // Safe off-screen wrap in range [-1.5H, 1.5H)
          // Wraps only when > 1200px away from viewport: ZERO visible jump!
          const base = u * H - colSY;
          const shifted = base + 1.5 * H;
          const wrapped = mod(shifted, tripleH);
          const y = wrapped - 1.5 * H;

          unitEl.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        }
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [numCols]);

  // Zoom Helpers
  const zoomAt = useCallback((delta: number) => {
    const newScale = Math.max(0.5, Math.min(1.5, targetScaleRef.current * delta));
    targetScaleRef.current = newScale;
    setDisplayZoom(Math.round(newScale * 100));
  }, []);

  const resetView = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const targetScale = isMobile ? 0.88 : 1.0;

    targetScrollXRef.current = 0;
    targetScrollYRef.current = 0;
    targetScaleRef.current = targetScale;
    setDisplayZoom(Math.round(targetScale * 100));
    setActiveFilter("all");
  }, []);

  // Pointer Drag & Velocity Handling
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    let isPointerDown = false;
    let didDrag = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let lastTime = 0;

    // Pinch zoom
    let initialPinchDist = 0;
    let initialPinchScale = 1;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".gallery-dock") ||
        target.closest(".gallery-lightbox") ||
        target.closest(".navbar__bottom") ||
        target.closest(".navbar__top")
      ) {
        return;
      }

      isPointerDown = true;
      didDrag = false;
      isDraggingRef.current = false;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = 0;
      velY = 0;
      lastTime = performance.now();
      vp.classList.add("is-dragging");
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;

      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const now = performance.now();
      const dt = Math.max(8, now - lastTime);
      lastTime = now;

      if (!didDrag && Math.hypot(e.clientX - startX, e.clientY - startY) > 5) {
        didDrag = true;
        isDraggingRef.current = true;
      }

      if (didDrag) {
        // Dragging down moves content down (decreases targetScrollY)
        // Dragging up moves content up (increases targetScrollY)
        targetScrollXRef.current += deltaX * 0.9;
        targetScrollYRef.current -= deltaY * 1.1;

        const instVx = deltaX / (dt / 1000);
        const instVy = -deltaY / (dt / 1000);
        velX = velX * 0.4 + instVx * 0.6;
        velY = velY * 0.4 + instVy * 0.6;
      }
    };

    const onPointerUp = () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      vp.classList.remove("is-dragging");

      if (didDrag) {
        const clampVx = Math.max(-1000, Math.min(1000, velX));
        const clampVy = Math.max(-1500, Math.min(1500, velY));
        targetScrollXRef.current += clampVx * 0.1;
        targetScrollYRef.current += clampVy * 0.16;
      }

      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    };

    // Wheel Scroll (Downwards increases targetScrollYRef -> content moves up)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const zoomDelta = e.deltaY < 0 ? 1.06 : 0.94;
        zoomAt(zoomDelta);
      } else {
        targetScrollYRef.current += e.deltaY * 0.95;
        if (Math.abs(e.deltaX) > 2) {
          targetScrollXRef.current -= e.deltaX * 0.8;
        }
      }
    };

    // Touch pinch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialPinchScale = targetScaleRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (initialPinchDist > 0) {
          const ratio = currentDist / initialPinchDist;
          const newScale = Math.max(0.5, Math.min(1.5, initialPinchScale * ratio));
          targetScaleRef.current = newScale;
          setDisplayZoom(Math.round(newScale * 100));
        }
      }
    };

    vp.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("touchstart", onTouchStart, { passive: true });
    vp.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      vp.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("touchstart", onTouchStart);
      vp.removeEventListener("touchmove", onTouchMove);
    };
  }, [zoomAt]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === "Escape") {
          setLightboxIndex(null);
        } else if (e.key === "ArrowRight") {
          setLightboxIndex((prev) =>
            prev !== null && prev < displayCards.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowLeft") {
          setLightboxIndex((prev) =>
            prev !== null && prev > 0 ? prev - 1 : displayCards.length - 1
          );
        }
      } else {
        if (e.key === "+" || e.key === "=") {
          zoomAt(1.12);
        } else if (e.key === "-") {
          zoomAt(0.88);
        } else if (e.key === "0") {
          resetView();
        } else if (e.key === "ArrowDown") {
          targetScrollYRef.current += 280;
        } else if (e.key === "ArrowUp") {
          targetScrollYRef.current -= 280;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, displayCards.length, zoomAt, resetView]);

  const activeLightboxCard =
    lightboxIndex !== null ? displayCards[lightboxIndex] : null;

  // Render cards inside a unit
  const renderUnitCards = (
    cards: WallCard[],
    unitKey: string,
    colIdx: number
  ) => {
    return cards.map((card, cardInColIdx) => {
      const artboardName = `${card.sectionTitle} / ${String(card.globalIndex + 1).padStart(2, "0")}`;

      return (
        <div
          key={`${unitKey}-${colIdx}-${card.item.id}-${cardInColIdx}`}
          className="gallery-card"
          style={{
            transform: `rotate(${card.tilt}deg)`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDraggingRef.current) {
              const idx = displayCards.findIndex(
                (c) => c.item.id === card.item.id
              );
              setLightboxIndex(idx >= 0 ? idx : 0);
            }
          }}
        >
          {/* Figma Artboard Label (Appears on Top-Left Corner) */}
          <div className="gallery-card__artboard-label">
            <span className="gallery-card__artboard-icon">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
              >
                <path d="M3 0V2H2V3H0V4H2V6H0V7H2V8H3V10H4V8H6V10H7V8H8V7H10V6H8V4H10V3H8V2H7V0H6V2H4V0H3ZM4 3H6V4H7V6H6V7H4V6H3V4H4V3Z" />
              </svg>
            </span>
            <span>{artboardName}</span>
          </div>

          {/* Uncropped Natural Aspect Ratio Media */}
          <div className="gallery-card__inner">
            {card.item.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getOptimizedImageUrl(card.item.url, 1400)}
                alt={artboardName}
                className="gallery-card__img"
                draggable={false}
                decoding="async"
                onLoad={() => measureColHeight(colIdx)}
              />
            ) : (
              <video
                src={card.item.url}
                autoPlay
                loop
                muted
                playsInline
                className="gallery-card__img"
                onLoadedMetadata={() => measureColHeight(colIdx)}
              />
            )}

            {card.item.type === "video" && (
              <div className="gallery-card__video-indicator">
                <svg
                  width="10"
                  height="12"
                  viewBox="0 0 10 12"
                  fill="currentColor"
                >
                  <path d="M0 0L10 6L0 12V0Z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <div className="revealer"></div>

      {/* Infinite Canvas Viewport */}
      <div className="gallery-viewport" ref={viewportRef}>
        {/* Infinite Grid Background */}
        <div className="gallery-grid-bg" />

        {/* Moving Canvas World (Centered horizontally, infinite seamless loop) */}
        <div className="gallery-canvas" ref={canvasRef}>
          <div className="gallery-wall">
            {columns.map((colCards, colIdx) => (
              <div key={`column-${colIdx}`} className="gallery-column">
                {[0, 1, 2].map((unitIdx) => (
                  <div
                    key={`col-${colIdx}-unit-${unitIdx}`}
                    className="gallery-column-unit"
                    ref={(el) => {
                      if (!unitRefs.current[colIdx]) {
                        unitRefs.current[colIdx] = [];
                      }
                      unitRefs.current[colIdx][unitIdx] = el;
                    }}
                    aria-hidden={unitIdx !== 0}
                  >
                    {renderUnitCards(colCards, `u${unitIdx}`, colIdx)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Floating Instruction Hint */}
        <div className={`gallery-hint ${!showHint ? "is-faded" : ""}`}>
          Scroll down infinitely • Drag to explore • Click to inspect
        </div>

        {/* Floating Bottom Navigation Dock */}
        <nav className="gallery-dock" aria-label="Gallery Navigation">
          <div className="gallery-dock__sections">
            <button
              type="button"
              className={`gallery-dock__btn ${activeFilter === "all" ? "is-active" : ""}`}
              onClick={() => {
                setActiveFilter("all");
                targetScrollYRef.current = 0;
              }}
            >
              All
              <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>
                ({allFlatCards.length})
              </span>
            </button>

            {validSections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className={`gallery-dock__btn ${activeFilter === sec.id ? "is-active" : ""}`}
                onClick={() => {
                  setActiveFilter(sec.id);
                  targetScrollYRef.current = 0;
                }}
              >
                {sec.title}
                <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>
                  ({sec.items?.length || 0})
                </span>
              </button>
            ))}
          </div>

          <div className="gallery-dock__divider" />

          {/* Zoom Controller */}
          <div className="gallery-dock__controls">
            <button
              type="button"
              className="gallery-dock__icon-btn"
              onClick={() => zoomAt(0.88)}
              title="Zoom out (-)"
              aria-label="Zoom out"
            >
              −
            </button>

            <span
              className="gallery-dock__zoom-text"
              onClick={resetView}
              title="Reset View (0)"
            >
              {displayZoom}%
            </span>

            <button
              type="button"
              className="gallery-dock__icon-btn"
              onClick={() => zoomAt(1.12)}
              title="Zoom in (+)"
              aria-label="Zoom in"
            >
              +
            </button>

            <button
              type="button"
              className="gallery-dock__icon-btn"
              onClick={resetView}
              title="Recenter"
              aria-label="Recenter"
              style={{ fontSize: "1.05rem" }}
            >
              ⌖
            </button>
          </div>
        </nav>
      </div>

      {/* Cinematic Lightbox Modal (Uncropped View) */}
      {lightboxIndex !== null && activeLightboxCard && (
        <div
          className="gallery-lightbox"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="gallery-lightbox__dialog"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const diff = e.changedTouches[0].clientX - touchStartXRef.current;
              if (diff > 45) {
                setLightboxIndex((prev) =>
                  prev !== null && prev > 0
                    ? prev - 1
                    : displayCards.length - 1
                );
              } else if (diff < -45) {
                setLightboxIndex((prev) =>
                  prev !== null && prev < displayCards.length - 1
                    ? prev + 1
                    : 0
                );
              }
            }}
          >
            {/* Top Navigation & Info */}
            <div className="gallery-lightbox__topbar">
              <div className="gallery-lightbox__info">
                <span className="gallery-lightbox__section-tag">
                  {activeLightboxCard.sectionTitle}
                </span>
                <span className="gallery-lightbox__counter">
                  {String(lightboxIndex + 1).padStart(2, "0")} /{" "}
                  {String(displayCards.length).padStart(2, "0")}
                </span>
              </div>

              <button
                type="button"
                className="gallery-lightbox__close"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Media Presentation */}
            <div className="gallery-lightbox__media-wrap">
              {activeLightboxCard.item.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeLightboxCard.item.url}
                  alt={activeLightboxCard.sectionTitle}
                  className="gallery-lightbox__img"
                />
              ) : (
                <video
                  src={activeLightboxCard.item.url}
                  controls
                  autoPlay
                  playsInline
                  className="gallery-lightbox__video"
                />
              )}
            </div>

            {/* Prev / Next Arrows */}
            {displayCards.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-lightbox__nav-btn gallery-lightbox__nav-btn--prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) =>
                      prev !== null && prev > 0
                        ? prev - 1
                        : displayCards.length - 1
                    );
                  }}
                  aria-label="Previous image"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="gallery-lightbox__nav-btn gallery-lightbox__nav-btn--next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) =>
                      prev !== null && prev < displayCards.length - 1
                        ? prev + 1
                        : 0
                    );
                  }}
                  aria-label="Next image"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
