"use client";

import React, { useRef } from "react";
import FloatingBadges from "./FloatingBadges";
import "./CtaSection.css";

interface CtaSectionProps {
  onCtaClick?: () => void;
}

export default function CtaSection({ onCtaClick }: CtaSectionProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  };

  const handleMouseLeave = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    btn.style.transform = `translate(0px, 0px)`;
  };

  return (
    <section className="cta-section">
      {/* Interactive Floating Idea & Problem Badges with Cursor Repulsion */}
      <FloatingBadges />

      <div className="cta-container">
        <h2 className="cta-title">Qiziqarli loyihangiz bormi?</h2>

        <button
          ref={buttonRef}
          className="cta-button"
          onClick={onCtaClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          type="button"
        >
          <span className="cta-button__text">KELING, GAPLASHAMIZ.</span>
          <span className="cta-button__line" />
        </button>
      </div>
    </section>
  );
}
