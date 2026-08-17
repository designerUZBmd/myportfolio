"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";

interface HeroBioTextProps {
  text: string;
  radius?: number;
}

interface CharCoord {
  docX: number;
  docY: number;
}

interface CharPhysics {
  x: number;
  y: number;
  rot: number;
  scale: number;
  targetX: number;
  targetY: number;
  targetRot: number;
  targetScale: number;
  vx: number;
  vy: number;
  vRot: number;
  vScale: number;
}

export default function HeroBioText({
  text,
  radius = 140,
}: HeroBioTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const coordsRef = useRef<CharCoord[]>([]);
  const [hasEntered, setHasEntered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const words = useMemo(() => text.split(" "), [text]);

  useEffect(() => {
    const checkMob = () => setIsMobile(window.innerWidth <= 768);
    checkMob();
    window.addEventListener("resize", checkMob, { passive: true });
    return () => window.removeEventListener("resize", checkMob);
  }, []);

  // Measure document coordinates of all characters (Desktop only)
  const updateCoords = useCallback(() => {
    if (window.innerWidth <= 768) return;
    const chars = charRefs.current;
    const len = chars.length;
    if (!len) return;

    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    coordsRef.current = new Array(len);
    for (let i = 0; i < len; i++) {
      const span = chars[i];
      if (span) {
        const rect = span.getBoundingClientRect();
        coordsRef.current[i] = {
          docX: rect.left + scrollX + rect.width / 2,
          docY: rect.top + scrollY + rect.height / 2,
        };
      } else {
        coordsRef.current[i] = { docX: 0, docY: 0 };
      }
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Synced entrance right as page revealer curtain lifts
    const entranceTimer = setTimeout(() => {
      setHasEntered(true);
      if (window.innerWidth > 768) {
        updateCoords();
      }
    }, 1050);

    // If mobile, skip all hover physics and event listeners
    if (window.innerWidth <= 768) {
      return () => clearTimeout(entranceTimer);
    }

    const handleResize = () => {
      if (window.innerWidth > 768) {
        updateCoords();
      }
    };

    window.addEventListener("resize", handleResize);

    const totalChars = charRefs.current.length;

    const physics: CharPhysics[] = Array.from({ length: totalChars }, () => ({
      x: 0,
      y: 0,
      rot: 0,
      scale: 1,
      targetX: 0,
      targetY: 0,
      targetRot: 0,
      targetScale: 1,
      vx: 0,
      vy: 0,
      vRot: 0,
      vScale: 0,
    }));

    let clientMouseX = -9999;
    let clientMouseY = -9999;
    let isHovering = false;
    let animationFrameId: number | null = null;

    const STIFFNESS = 0.22;
    const DAMPING = 0.72;

    const renderLoop = () => {
      let activeMovement = false;
      const coords = coordsRef.current;

      const currentScrollX = window.scrollX || window.pageXOffset || 0;
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const pageMouseX = clientMouseX + currentScrollX;
      const pageMouseY = clientMouseY + currentScrollY;

      for (let i = 0; i < totalChars; i++) {
        const span = charRefs.current[i];
        if (!span) continue;

        const p = physics[i];

        if (isHovering && coords[i] && coords[i].docX !== 0) {
          const dx = pageMouseX - coords[i].docX;
          const dy = pageMouseY - coords[i].docY;
          const dist = Math.hypot(dx, dy);

          if (dist < radius) {
            const intensity = Math.pow(1 - dist / radius, 1.8);
            p.targetY = -intensity * 18;
            p.targetX = (coords[i].docX - pageMouseX) * (intensity * 0.12);
            p.targetRot = ((coords[i].docX - pageMouseX) / radius) * (intensity * -14);
            p.targetScale = 1 + intensity * 0.14;
          } else {
            p.targetY = 0;
            p.targetX = 0;
            p.targetRot = 0;
            p.targetScale = 1;
          }
        } else {
          p.targetY = 0;
          p.targetX = 0;
          p.targetRot = 0;
          p.targetScale = 1;
        }

        const fx = (p.targetX - p.x) * STIFFNESS;
        p.vx = (p.vx + fx) * DAMPING;
        p.x += p.vx;

        const fy = (p.targetY - p.y) * STIFFNESS;
        p.vy = (p.vy + fy) * DAMPING;
        p.y += p.vy;

        const fRot = (p.targetRot - p.rot) * STIFFNESS;
        p.vRot = (p.vRot + fRot) * DAMPING;
        p.rot += p.vRot;

        const fScale = (p.targetScale - p.scale) * STIFFNESS;
        p.vScale = (p.vScale + fScale) * DAMPING;
        p.scale += p.vScale;

        if (
          Math.abs(p.vx) > 0.005 ||
          Math.abs(p.vy) > 0.005 ||
          Math.abs(p.targetY - p.y) > 0.01 ||
          Math.abs(p.targetX - p.x) > 0.01
        ) {
          activeMovement = true;
        }

        span.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${p.rot.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
      }

      if (activeMovement || isHovering) {
        animationFrameId = requestAnimationFrame(renderLoop);
      } else {
        animationFrameId = null;
      }
    };

    const startAnimation = () => {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      clientMouseX = e.clientX;
      clientMouseY = e.clientY;
      isHovering = true;

      if (!coordsRef.current.length || coordsRef.current[0]?.docX === 0) {
        updateCoords();
      }
      startAnimation();
    };

    const handleMouseLeave = () => {
      isHovering = false;
      startAnimation();
    };

    const handleScroll = () => {
      if (isHovering) {
        startAnimation();
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(entranceTimer);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [radius, updateCoords]);

  let globalCharIndex = 0;

  return (
    <p
      ref={containerRef}
      className="hero__bio"
      style={{
        fontFamily: "var(--font-body), sans-serif",
        cursor: "default",
      }}
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
                marginLeft: wordIndex === 0 ? "clamp(1.5rem, 5vw, 6rem)" : undefined,
              }}
            >
              {chars.map((char) => {
                const charIndex = globalCharIndex++;
                const delay = charIndex * 0.012;
                return (
                  <span
                    key={charIndex}
                    style={{
                      display: "inline-block",
                      opacity: hasEntered ? 1 : 0,
                      transform: hasEntered
                        ? "translate3d(0, 0, 0)"
                        : "translate3d(0, 16px, 0)",
                      transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                    }}
                  >
                    <span
                      ref={(el) => {
                        charRefs.current[charIndex] = el;
                      }}
                      style={{
                        display: "inline-block",
                        userSelect: "none",
                      }}
                    >
                      {char}
                    </span>
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
