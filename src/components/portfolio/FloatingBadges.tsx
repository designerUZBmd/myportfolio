"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import "./FloatingBadges.css";

interface CircularItem {
  id: string;
  size: number; // diameter in px
  orbitRadius: number; // distance from center in px
  initialAngle: number; // angle in degrees
  orbitSpeed: number; // speed of slow orbital rotation
  content: React.ReactNode;
  className?: string;
}

const circularItems: CircularItem[] = [
  {
    id: "c-idea",
    size: 84,
    orbitRadius: 280,
    initialAngle: 155,
    orbitSpeed: 0.12,
    className: "circle-card--idea",
    content: (
      <div className="circle-card__inner">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
        </svg>
        <span className="circle-card__mini-tag">G‘OYA</span>
      </div>
    ),
  },
  {
    id: "c-problem",
    size: 78,
    orbitRadius: 300,
    initialAngle: 25,
    orbitSpeed: -0.14,
    className: "circle-card--problem",
    content: (
      <div className="circle-card__inner">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
        <span className="circle-card__mini-tag">MUAMMO</span>
      </div>
    ),
  },
  {
    id: "c-img-ui",
    size: 96,
    orbitRadius: 360,
    initialAngle: 210,
    orbitSpeed: 0.09,
    className: "circle-card--img",
    content: (
      <div className="circle-card__img-wrap">
        <Image
          src="/images/process1.jpg"
          alt="UI Preview"
          fill
          className="circle-card__img"
          sizes="96px"
        />
        <div className="circle-card__img-badge">UI/UX</div>
      </div>
    ),
  },
  {
    id: "c-metric",
    size: 76,
    orbitRadius: 260,
    initialAngle: 335,
    orbitSpeed: 0.16,
    className: "circle-card--metric",
    content: (
      <div className="circle-card__inner">
        <span className="circle-card__metric-val">+140%</span>
        <span className="circle-card__mini-tag">O‘SISH</span>
      </div>
    ),
  },
  {
    id: "c-target",
    size: 86,
    orbitRadius: 340,
    initialAngle: 85,
    orbitSpeed: -0.11,
    className: "circle-card--target",
    content: (
      <div className="circle-card__inner">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        <span className="circle-card__mini-tag">NATIJA</span>
      </div>
    ),
  },
  {
    id: "c-img-photo",
    size: 92,
    orbitRadius: 380,
    initialAngle: 120,
    orbitSpeed: 0.08,
    className: "circle-card--img",
    content: (
      <div className="circle-card__img-wrap">
        <Image
          src="/images/photo.jpg"
          alt="Designer"
          fill
          className="circle-card__img"
          sizes="92px"
        />
        <div className="circle-card__img-badge">DESIGN</div>
      </div>
    ),
  },
  {
    id: "c-pen",
    size: 68,
    orbitRadius: 270,
    initialAngle: 250,
    orbitSpeed: -0.15,
    className: "circle-card--tool",
    content: (
      <div className="circle-card__inner">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
        <span className="circle-card__mini-tag">KREATIV</span>
      </div>
    ),
  },
  {
    id: "c-rocket",
    size: 74,
    orbitRadius: 320,
    initialAngle: 295,
    orbitSpeed: 0.13,
    className: "circle-card--rocket",
    content: (
      <div className="circle-card__inner">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </svg>
        <span className="circle-card__mini-tag">LAUNCH</span>
      </div>
    ),
  },
  {
    id: "c-chat",
    size: 70,
    orbitRadius: 250,
    initialAngle: 180,
    orbitSpeed: -0.17,
    className: "circle-card--chat",
    content: (
      <div className="circle-card__inner">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="circle-card__mini-tag">ALOQA</span>
      </div>
    ),
  },
  {
    id: "c-stars",
    size: 80,
    orbitRadius: 350,
    initialAngle: 5,
    orbitSpeed: 0.1,
    className: "circle-card--stars",
    content: (
      <div className="circle-card__inner">
        <div className="circle-card__stars-row">★★★★★</div>
        <span className="circle-card__mini-tag">5.0 SIFAT</span>
      </div>
    ),
  },
];

export default function FloatingBadges() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mouseX = -9999;
    let mouseY = -9999;
    let isMouseInside = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseInside = true;
    };

    const handleMouseLeave = () => {
      isMouseInside = false;
      mouseX = -9999;
      mouseY = -9999;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave);

    // Initial state for each circular body in gravity field
    const bodies = circularItems.map((item) => {
      const angleRad = (item.initialAngle * Math.PI) / 180;
      return {
        angle: angleRad,
        currentX: 0,
        currentY: 0,
        vx: 0,
        vy: 0,
        initialized: false,
      };
    });

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const currentTime = performance.now();
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const cWidth = container.clientWidth;
      const cHeight = container.clientHeight;
      const centerX = cWidth / 2;
      const centerY = cHeight / 2;

      // Adjust orbit radius based on viewport width
      const scaleFactor = Math.min(Math.max(cWidth / 1200, 0.72), 1.15);

      circularItems.forEach((item, i) => {
        const el = cardRefs.current[i];
        const body = bodies[i];
        if (!el || !body) return;

        // 1. Planetary Orbit angle increment
        body.angle += item.orbitSpeed * dt * 0.45;

        // 2. Gravitational Target position (Elliptical orbit centered on Title)
        const orbitRadiusX = item.orbitRadius * scaleFactor * 1.15;
        const orbitRadiusY = item.orbitRadius * scaleFactor * 0.72; // Horizontal ellipse matching headline aspect

        const targetX = centerX + Math.cos(body.angle) * orbitRadiusX;
        const targetY = centerY + Math.sin(body.angle) * orbitRadiusY;

        if (!body.initialized) {
          body.currentX = targetX;
          body.currentY = targetY;
          body.initialized = true;
        }

        // 3. Central Gravity Pull Force towards orbital home
        const springK = 0.08;
        const forceX = (targetX - body.currentX) * springK;
        const forceY = (targetY - body.currentY) * springK;

        // 4. Mouse Repulsion Wave
        let repelForceX = 0;
        let repelForceY = 0;

        if (isMouseInside) {
          const dx = body.currentX - mouseX;
          const dy = body.currentY - mouseY;
          const dist = Math.hypot(dx, dy);
          const repelRadius = 190;

          if (dist < repelRadius && dist > 0.1) {
            const force = Math.pow(1 - dist / repelRadius, 1.5) * 95;
            const angle = Math.atan2(dy, dx);
            repelForceX = Math.cos(angle) * force;
            repelForceY = Math.sin(angle) * force;
          }
        }

        // 5. Physics integration with damping (Yer tortishishi & Elastik qaytish)
        body.vx = (body.vx + forceX + repelForceX * 0.18) * 0.86;
        body.vy = (body.vy + forceY + repelForceY * 0.18) * 0.86;

        body.currentX += body.vx;
        body.currentY += body.vy;

        // Center the round badge
        const posX = body.currentX - item.size / 2;
        const posY = body.currentY - item.size / 2;

        el.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
      });
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="floating-badges-container">
      {circularItems.map((item, idx) => (
        <div
          key={item.id}
          ref={(el) => {
            cardRefs.current[idx] = el;
          }}
          className={`circle-card ${item.className || ""}`}
          style={{
            width: `${item.size}px`,
            height: `${item.size}px`,
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
