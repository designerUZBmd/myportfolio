"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";

interface HeroBioTextProps {
  text: string;
  radius?: number;
  maxWeight?: number;
  minWeight?: number;
}

interface CharCoord {
  x: number;
  y: number;
  width: number;
}

export default function HeroBioText({
  text,
  radius = 180,
  maxWeight = 900,
  minWeight = 400,
}: HeroBioTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const coordsRef = useRef<CharCoord[]>([]);
  const [hasEntered, setHasEntered] = useState(false);

  // Memoize words array to prevent garbage collection churn on re-renders
  const words = useMemo(() => text.split(" "), [text]);

  // Batched DOM Measurement to prevent Layout Thrashing & update for current font size
  const updateCoords = useCallback(() => {
    const chars = charRefs.current;
    const len = chars.length;
    if (!len) return;

    // Reset widths first so spans measure at true current font size
    for (let i = 0; i < len; i++) {
      const span = chars[i];
      if (span) span.style.width = "auto";
    }

    // Step 1: Batch Read DOM rects
    const rects: (DOMRect | null)[] = new Array(len);
    for (let i = 0; i < len; i++) {
      const span = chars[i];
      rects[i] = span ? span.getBoundingClientRect() : null;
    }

    // Step 2: Batch Write style widths
    for (let i = 0; i < len; i++) {
      const span = chars[i];
      const rect = rects[i];
      if (span && rect && rect.width > 0) {
        span.style.width = `${rect.width}px`;
        span.style.textAlign = "center";
      }
    }

    // Step 3: Store coordinates
    coordsRef.current = new Array(len);
    for (let i = 0; i < len; i++) {
      const rect = rects[i];
      if (rect) {
        coordsRef.current[i] = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
        };
      } else {
        coordsRef.current[i] = { x: 0, y: 0, width: 0 };
      }
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Trigger entrance animation after page revealer finishes (~1.9s)
    const initialDelay = 1900;

    const entranceTimer = setTimeout(() => {
      setHasEntered(true);
    }, initialDelay);

    const totalChars = charRefs.current.length;
    const entranceDuration = initialDelay + totalChars * 15 + 700;

    // Lock widths & calculate coordinates once entrance animation completes
    const coordsTimer = setTimeout(() => {
      updateCoords();
    }, entranceDuration);

    const handleResize = () => {
      charRefs.current.forEach((span) => {
        if (span) span.style.width = "auto";
      });
      updateCoords();
    };

    window.addEventListener("resize", handleResize);

    const currentWeights = new Float32Array(totalChars).fill(minWeight);
    const targetWeights = new Float32Array(totalChars).fill(minWeight);
    const displayedWeights = new Float32Array(totalChars).fill(minWeight);

    let mouseX = -9999;
    let mouseY = -9999;
    let isHovering = false;
    let isScrolling = false;
    let scrollEndTimer: NodeJS.Timeout | null = null;
    let animationFrameId: number | null = null;

    const resetWeights = () => {
      for (let i = 0; i < totalChars; i++) {
        targetWeights[i] = minWeight;
        currentWeights[i] = minWeight;
        const span = charRefs.current[i];
        if (span && displayedWeights[i] !== minWeight) {
          displayedWeights[i] = minWeight;
          span.style.fontVariationSettings = `'wght' ${minWeight}`;
          span.style.fontWeight = `${minWeight}`;
        }
      }
    };

    // Scroll-Guard: Pause calculations during scroll to guarantee 60fps smooth scrolling
    const handleScroll = () => {
      isScrolling = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      resetWeights();

      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        isScrolling = false;
        updateCoords();
      }, 120);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const renderLoop = () => {
      if (isScrolling) {
        animationFrameId = null;
        return;
      }

      let isStillAnimating = false;
      const coords = coordsRef.current;

      for (let i = 0; i < totalChars; i++) {
        const span = charRefs.current[i];
        if (!span) continue;

        if (isHovering && coords[i] && coords[i].x !== 0) {
          const dist = Math.hypot(mouseX - coords[i].x, mouseY - coords[i].y);
          if (dist < radius) {
            const intensity = Math.pow(1 - dist / radius, 1.4);
            targetWeights[i] = minWeight + intensity * (maxWeight - minWeight);
          } else {
            targetWeights[i] = minWeight;
          }
        } else {
          targetWeights[i] = minWeight;
        }

        // Fast & crisp LERP speed (35% interpolation per frame)
        const diff = targetWeights[i] - currentWeights[i];
        if (Math.abs(diff) > 0.05) {
          currentWeights[i] += diff * 0.35;
          isStillAnimating = true;
        } else {
          currentWeights[i] = targetWeights[i];
        }

        // DOM update for font-weight
        if (Math.abs(currentWeights[i] - displayedWeights[i]) > 0.1) {
          displayedWeights[i] = currentWeights[i];
          const w = currentWeights[i].toFixed(1);
          span.style.fontVariationSettings = `'wght' ${w}`;
          span.style.fontWeight = `${Math.round(currentWeights[i])}`;
        }
      }

      if (isStillAnimating || isHovering) {
        animationFrameId = requestAnimationFrame(renderLoop);
      } else {
        animationFrameId = null;
      }
    };

    const startAnimation = () => {
      if (!animationFrameId && !isScrolling) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isScrolling) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      isHovering = true;

      if (!coordsRef.current.length || coordsRef.current[0]?.x === 0) {
        updateCoords();
      }
      startAnimation();
    };

    const handleMouseLeave = () => {
      isHovering = false;
      startAnimation();
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(coordsTimer);
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [radius, maxWeight, minWeight, updateCoords]);

  let globalCharIndex = 0;

  return (
    <p
      ref={containerRef}
      className="hero__bio"
      style={{ fontFamily: "var(--font-body), sans-serif" }}
    >
      <span className="hero__spacer"></span>
      {words.map((word, wordIndex) => {
        const chars = word.split("");
        return (
          <React.Fragment key={wordIndex}>
            <span
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                marginLeft: wordIndex === 0 ? "clamp(3rem, 6vw, 8rem)" : undefined,
              }}
            >
              {chars.map((char) => {
                const charIndex = globalCharIndex++;
                const delay = charIndex * 0.015;
                return (
                  <span
                    key={charIndex}
                    ref={(el) => {
                      charRefs.current[charIndex] = el;
                    }}
                    style={{
                      display: "inline-block",
                      fontFamily: "var(--font-body), sans-serif",
                      fontWeight: minWeight,
                      fontVariationSettings: `'wght' ${minWeight}`,
                      opacity: hasEntered ? 1 : 0,
                      filter: hasEntered ? "blur(0px)" : "blur(10px)",
                      transform: hasEntered
                        ? "translate(0px, 0px)"
                        : "translate(24px, 18px)",
                      transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, filter 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                      willChange: "opacity, filter, transform",
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
            {wordIndex < words.length - 1 && " "}
          </React.Fragment>
        );
      })}
    </p>
  );
}
